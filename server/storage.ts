import { 
  users, type User, type InsertUser,
  properties, type Property, type InsertProperty,
  agents, type Agent, type InsertAgent,
  enquiries, type Enquiry, type InsertEnquiry,
  savedProperties, type SavedProperty, type InsertSavedProperty,
  PropertyFilter
} from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, lte, desc, sql, asc } from "drizzle-orm";
import * as bcrypt from "bcryptjs";

// Modify the interface with any CRUD methods needed
export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<Omit<User, 'id' | 'password'>>): Promise<User | undefined>;
  
  // Property methods
  getProperty(id: number): Promise<Property | undefined>;
  getProperties(filter?: PropertyFilter): Promise<Property[]>;
  getFeaturedProperties(limit?: number): Promise<Property[]>;
  getPropertiesByCity(city: string, limit?: number): Promise<Property[]>;
  createProperty(property: InsertProperty): Promise<Property>;
  
  // Agent methods
  getAgent(id: number): Promise<Agent | undefined>;
  getAgents(limit?: number): Promise<Agent[]>;
  createAgent(agent: InsertAgent): Promise<Agent>;
  
  // Enquiry methods
  getEnquiry(id: number): Promise<Enquiry | undefined>;
  getEnquiries(): Promise<Enquiry[]>;
  createEnquiry(enquiry: InsertEnquiry): Promise<Enquiry>;
  
  // Saved properties methods
  getSavedProperties(userId: number): Promise<Property[]>;
  saveProperty(savedProperty: InsertSavedProperty): Promise<SavedProperty>;
  unsaveProperty(userId: number, propertyId: number): Promise<void>;
  isPropertySaved(userId: number, propertyId: number): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    // Hash the password before storing
    const hashedPassword = await bcrypt.hash(insertUser.password, 10);
    
    const [user] = await db
      .insert(users)
      .values({
        ...insertUser,
        password: hashedPassword
      })
      .returning();
    
    return user;
  }
  
  async updateUser(id: number, updates: Partial<Omit<User, 'id' | 'password'>>): Promise<User | undefined> {
    try {
      // Check if user exists
      const userExists = await this.getUser(id);
      if (!userExists) {
        return undefined;
      }
      
      // Update user with provided fields
      const [updatedUser] = await db
        .update(users)
        .set(updates)
        .where(eq(users.id, id))
        .returning();
      
      return updatedUser;
    } catch (error) {
      console.error("Error updating user:", error);
      return undefined;
    }
  }
  
  // Property methods
  async getProperty(id: number): Promise<Property | undefined> {
    const [property] = await db.select().from(properties).where(eq(properties.id, id));
    return property;
  }
  
  async getProperties(filter?: PropertyFilter): Promise<Property[]> {
    let queryConditions = [];
    
    if (filter) {
      if (filter.category) {
        queryConditions.push(eq(properties.category, filter.category));
      }
      
      if (filter.type) {
        queryConditions.push(eq(properties.type, filter.type));
      }
      
      if (filter.city) {
        queryConditions.push(eq(properties.city, filter.city));
      }
      
      if (filter.location) {
        queryConditions.push(eq(properties.location, filter.location));
      }
      
      if (filter.minPrice !== undefined) {
        queryConditions.push(gte(properties.price, filter.minPrice));
      }
      
      if (filter.maxPrice !== undefined) {
        queryConditions.push(lte(properties.price, filter.maxPrice));
      }
      
      if (filter.bedrooms !== undefined) {
        queryConditions.push(gte(properties.bedrooms, filter.bedrooms));
      }
      
      if (filter.bathrooms !== undefined) {
        queryConditions.push(gte(properties.bathrooms, filter.bathrooms));
      }
      
      if (filter.minArea !== undefined) {
        queryConditions.push(gte(properties.area, filter.minArea));
      }
      
      if (filter.maxArea !== undefined) {
        queryConditions.push(lte(properties.area, filter.maxArea));
      }
      
      if (filter.status) {
        queryConditions.push(eq(properties.status, filter.status));
      }
      
      if (filter.featured !== undefined) {
        queryConditions.push(eq(properties.featured, filter.featured));
      }
    }
    
    if (queryConditions.length > 0) {
      return await db.select().from(properties).where(and(...queryConditions));
    } else {
      return await db.select().from(properties);
    }
  }
  
  async getFeaturedProperties(limit = 10): Promise<Property[]> {
    return await db
      .select()
      .from(properties)
      .where(eq(properties.featured, true))
      .limit(limit);
  }
  
  async getPropertiesByCity(city: string, limit = 10): Promise<Property[]> {
    return await db
      .select()
      .from(properties)
      .where(eq(properties.city, city))
      .limit(limit);
  }
  
  async createProperty(insertProperty: InsertProperty): Promise<Property> {
    const [property] = await db
      .insert(properties)
      .values(insertProperty)
      .returning();
    
    return property;
  }
  
  // Agent methods
  async getAgent(id: number): Promise<Agent | undefined> {
    const [agent] = await db
      .select()
      .from(agents)
      .where(eq(agents.id, id));
    
    return agent;
  }
  
  async getAgents(limit = 10): Promise<Agent[]> {
    return await db
      .select()
      .from(agents)
      .limit(limit);
  }
  
  async createAgent(insertAgent: InsertAgent): Promise<Agent> {
    const [agent] = await db
      .insert(agents)
      .values(insertAgent)
      .returning();
    
    return agent;
  }
  
  // Enquiry methods
  async getEnquiry(id: number): Promise<Enquiry | undefined> {
    const [enquiry] = await db
      .select()
      .from(enquiries)
      .where(eq(enquiries.id, id));
    
    return enquiry;
  }
  
  async getEnquiries(): Promise<Enquiry[]> {
    return await db
      .select()
      .from(enquiries)
      .orderBy(desc(enquiries.createdAt));
  }
  
  async createEnquiry(insertEnquiry: InsertEnquiry): Promise<Enquiry> {
    const [enquiry] = await db
      .insert(enquiries)
      .values(insertEnquiry)
      .returning();
    
    return enquiry;
  }

  // Saved properties methods
  async getSavedProperties(userId: number): Promise<Property[]> {
    const result = await db
      .select({
        property: properties
      })
      .from(savedProperties)
      .innerJoin(properties, eq(savedProperties.propertyId, properties.id))
      .where(eq(savedProperties.userId, userId))
      .orderBy(desc(savedProperties.createdAt));
    
    return result.map(r => r.property);
  }

  async saveProperty(savedProperty: InsertSavedProperty): Promise<SavedProperty> {
    // Check if already saved to avoid duplicates
    const existing = await db
      .select()
      .from(savedProperties)
      .where(
        and(
          eq(savedProperties.userId, savedProperty.userId),
          eq(savedProperties.propertyId, savedProperty.propertyId)
        )
      );

    if (existing.length > 0) {
      return existing[0];
    }

    const [newSavedProperty] = await db
      .insert(savedProperties)
      .values(savedProperty)
      .returning();
    
    return newSavedProperty;
  }

  async unsaveProperty(userId: number, propertyId: number): Promise<void> {
    await db
      .delete(savedProperties)
      .where(
        and(
          eq(savedProperties.userId, userId),
          eq(savedProperties.propertyId, propertyId)
        )
      );
  }

  async isPropertySaved(userId: number, propertyId: number): Promise<boolean> {
    const result = await db
      .select()
      .from(savedProperties)
      .where(
        and(
          eq(savedProperties.userId, userId),
          eq(savedProperties.propertyId, propertyId)
        )
      );
    
    return result.length > 0;
  }
}

export const storage = new DatabaseStorage();