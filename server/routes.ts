import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertEnquirySchema,
  insertUserSchema,
  propertyFilterSchema,
  insertSavedPropertySchema
} from "@shared/schema";
import passport from "passport";
import path from "path";
import * as z from "zod";
import fetch from "node-fetch";

// Authentication middleware
const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized, please log in" });
};

// Login validation schema
const loginSchema = z.object({
  username: z.string().min(1, { message: "Username is required" }),
  password: z.string().min(1, { message: "Password is required" })
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Api prefix for all routes
  const apiPrefix = '/api';
  
  // Add a simple test route
  app.get('/test', (_req, res) => {
    res.sendFile(path.resolve(process.cwd(), 'test.html'));
  });

  // GET properties
  app.get(`${apiPrefix}/properties`, async (req: Request, res: Response) => {
    try {
      // Convert query params to filter
      const filter: Record<string, any> = {};
      
      if (req.query.category) filter.category = req.query.category as string;
      if (req.query.type) filter.type = req.query.type as string;
      if (req.query.city) filter.city = req.query.city as string;
      if (req.query.location) filter.location = req.query.location as string;
      if (req.query.minPrice) filter.minPrice = parseInt(req.query.minPrice as string);
      if (req.query.maxPrice) filter.maxPrice = parseInt(req.query.maxPrice as string);
      if (req.query.bedrooms) filter.bedrooms = parseInt(req.query.bedrooms as string);
      if (req.query.minArea) filter.minArea = parseInt(req.query.minArea as string);
      if (req.query.maxArea) filter.maxArea = parseInt(req.query.maxArea as string);
      if (req.query.status) filter.status = req.query.status as string;
      if (req.query.featured) filter.featured = req.query.featured === 'true';
      
      // Validate filter params
      const filterResult = propertyFilterSchema.safeParse(filter);
      
      if (!filterResult.success) {
        return res.status(400).json({ 
          message: "Invalid filter parameters",
          errors: filterResult.error.errors
        });
      }
      
      const properties = await storage.getProperties(filterResult.data);
      res.json(properties);
    } catch (error) {
      console.error("Error fetching properties:", error);
      res.status(500).json({ message: "Failed to fetch properties" });
    }
  });

  // GET featured properties
  app.get(`${apiPrefix}/properties/featured`, async (req: Request, res: Response) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const properties = await storage.getFeaturedProperties(limit);
      res.json(properties);
    } catch (error) {
      console.error("Error fetching featured properties:", error);
      res.status(500).json({ message: "Failed to fetch featured properties" });
    }
  });

  // GET properties by city
  app.get(`${apiPrefix}/properties/city/:city`, async (req: Request, res: Response) => {
    try {
      const { city } = req.params;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const properties = await storage.getPropertiesByCity(city, limit);
      res.json(properties);
    } catch (error) {
      console.error("Error fetching properties by city:", error);
      res.status(500).json({ message: "Failed to fetch properties by city" });
    }
  });

  // GET property by ID
  app.get(`${apiPrefix}/properties/:id`, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const property = await storage.getProperty(id);
      
      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }
      
      res.json(property);
    } catch (error) {
      console.error("Error fetching property:", error);
      res.status(500).json({ message: "Failed to fetch property" });
    }
  });

  // GET agents
  app.get(`${apiPrefix}/agents`, async (req: Request, res: Response) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const agents = await storage.getAgents(limit);
      res.json(agents);
    } catch (error) {
      console.error("Error fetching agents:", error);
      res.status(500).json({ message: "Failed to fetch agents" });
    }
  });

  // GET agent by ID
  app.get(`${apiPrefix}/agents/:id`, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const agent = await storage.getAgent(id);
      
      if (!agent) {
        return res.status(404).json({ message: "Agent not found" });
      }
      
      res.json(agent);
    } catch (error) {
      console.error("Error fetching agent:", error);
      res.status(500).json({ message: "Failed to fetch agent" });
    }
  });

  // POST create enquiry
  app.post(`${apiPrefix}/enquiries`, async (req: Request, res: Response) => {
    try {
      const validateResult = insertEnquirySchema.safeParse(req.body);
      
      if (!validateResult.success) {
        return res.status(400).json({ 
          message: "Invalid enquiry data",
          errors: validateResult.error.errors
        });
      }
      
      const enquiry = await storage.createEnquiry(validateResult.data);
      res.status(201).json(enquiry);
    } catch (error) {
      console.error("Error creating enquiry:", error);
      res.status(500).json({ message: "Failed to create enquiry" });
    }
  });

  // POST register user
  app.post(`${apiPrefix}/users/register`, async (req: Request, res: Response) => {
    try {
      const validateResult = insertUserSchema.safeParse(req.body);
      
      if (!validateResult.success) {
        return res.status(400).json({ 
          message: "Invalid user data",
          errors: validateResult.error.errors
        });
      }
      
      // Check if username already exists
      const existingUser = await storage.getUserByUsername(validateResult.data.username);
      
      if (existingUser) {
        return res.status(409).json({ message: "Username already exists" });
      }
      
      const user = await storage.createUser(validateResult.data);
      // Remove password from response
      const { password, ...userWithoutPassword } = user;
      
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ message: "Failed to register user" });
    }
  });

  // POST login user
  app.post(`${apiPrefix}/auth/login`, (req: Request, res: Response, next: NextFunction) => {
    try {
      const validateResult = loginSchema.safeParse(req.body);
      
      if (!validateResult.success) {
        return res.status(400).json({ 
          message: "Invalid login data",
          errors: validateResult.error.errors
        });
      }
      
      passport.authenticate('local', (err: Error, user: any, info: any) => {
        if (err) {
          return next(err);
        }
        
        if (!user) {
          return res.status(401).json({ message: info.message || "Login failed" });
        }
        
        req.logIn(user, (err) => {
          if (err) {
            return next(err);
          }
          
          // Remove password from response
          const { password, ...userWithoutPassword } = user;
          
          return res.json({ 
            message: "Login successful", 
            user: userWithoutPassword 
          });
        });
      })(req, res, next);
    } catch (error) {
      console.error("Error logging in:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  // POST logout user
  app.post(`${apiPrefix}/auth/logout`, (req: Request, res: Response) => {
    req.logout((err) => {
      if (err) {
        console.error("Error logging out:", err);
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ message: "Logout successful" });
    });
  });

  // GET current user
  app.get(`${apiPrefix}/auth/me`, isAuthenticated, (req: Request, res: Response) => {
    res.json(req.user);
  });

  // Check authentication status
  app.get(`${apiPrefix}/auth/status`, (req: Request, res: Response) => {
    if (req.isAuthenticated()) {
      return res.json({ 
        isAuthenticated: true, 
        user: req.user 
      });
    }
    res.json({ isAuthenticated: false });
  });
  
  // Update user profile
  app.patch(`${apiPrefix}/users/:id`, isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      
      // Make sure the user is updating their own profile
      if (req.user && (req.user as any).id !== userId) {
        return res.status(403).json({ message: "You can only update your own profile" });
      }
      
      const updateSchema = z.object({
        name: z.string().min(2).optional(),
        email: z.string().email().optional(),
        phone: z.string().optional()
      });
      
      const validateResult = updateSchema.safeParse(req.body);
      
      if (!validateResult.success) {
        return res.status(400).json({ 
          message: "Invalid profile data",
          errors: validateResult.error.errors
        });
      }
      
      // Get the current user data
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Update the user in the database
      const updatedUser = await storage.updateUser(userId, validateResult.data);
      
      if (!updatedUser) {
        return res.status(500).json({ message: "Failed to update user" });
      }
      
      // Remove password from response
      const { password, ...userWithoutPassword } = updatedUser;
      
      res.json({ 
        message: "Profile updated successfully",
        user: userWithoutPassword
      });
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // Saved Properties endpoints
  // GET saved properties for current user
  app.get(`${apiPrefix}/saved-properties`, isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req.user as any).id;
      const properties = await storage.getSavedProperties(userId);
      res.json(properties);
    } catch (error: any) {
      console.error("Error getting saved properties:", error);
      res.status(500).json({ message: "Failed to get saved properties" });
    }
  });

  // POST save a property
  app.post(`${apiPrefix}/saved-properties`, isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req.user as any).id;
      
      const validateResult = insertSavedPropertySchema.safeParse({
        userId,
        propertyId: req.body.propertyId
      });
      
      if (!validateResult.success) {
        return res.status(400).json({ 
          message: "Invalid property data",
          errors: validateResult.error.errors
        });
      }
      
      // Check if property exists
      const property = await storage.getProperty(validateResult.data.propertyId);
      
      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }
      
      const savedProperty = await storage.saveProperty(validateResult.data);
      
      res.status(201).json(savedProperty);
    } catch (error: any) {
      console.error("Error saving property:", error);
      res.status(500).json({ message: "Failed to save property" });
    }
  });

  // DELETE unsave a property
  app.delete(`${apiPrefix}/saved-properties/:propertyId`, isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req.user as any).id;
      const propertyId = parseInt(req.params.propertyId);
      
      if (isNaN(propertyId)) {
        return res.status(400).json({ message: "Invalid property ID" });
      }
      
      await storage.unsaveProperty(userId, propertyId);
      
      res.json({ message: "Property removed from saved list successfully" });
    } catch (error) {
      console.error("Error removing saved property:", error);
      res.status(500).json({ message: "Failed to remove saved property" });
    }
  });

  // GET check if a property is saved by current user
  app.get(`${apiPrefix}/saved-properties/:propertyId/check`, isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req.user as any).id;
      const propertyId = parseInt(req.params.propertyId);
      
      if (isNaN(propertyId)) {
        return res.status(400).json({ message: "Invalid property ID" });
      }
      
      const isSaved = await storage.isPropertySaved(userId, propertyId);
      
      res.json({ isSaved });
    } catch (error) {
      console.error("Error checking saved property:", error);
      res.status(500).json({ message: "Failed to check saved property status" });
    }
  });

  // AI Chat endpoint with Gemini API
  app.post(`${apiPrefix}/ai/chat`, async (req: Request, res: Response) => {
    try {
      const { messages, enhancedPrompt } = req.body;
      
      if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ message: "Invalid chat messages format" });
      }
      
      // Format request for Gemini API
      const apiKey = process.env.GEMINI_API_KEY;
      const endpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';
      
      const requestBody = {
        contents: messages,
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          }
        ]
      };

      // Make the API request to Gemini
      const response = await fetch(`${endpoint}?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Gemini API error:", errorData);
        throw new Error(`Gemini API returned status code ${response.status}`);
      }

      const data = await response.json();
      
      // Extract the response text
      const responseText = data.candidates[0].content.parts[0].text || 'I apologize, but I couldn\'t generate a response.';
      
      // Return the AI response
      res.json({
        content: responseText,
        success: true
      });
    } catch (error) {
      console.error("Error in AI chat endpoint:", error);
      res.status(500).json({ 
        message: "Failed to generate AI response",
        content: "I apologize, but I encountered an error while processing your request. Please try again later.",
        success: false
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
