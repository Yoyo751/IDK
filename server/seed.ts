import { db } from "./db";
import { agents, properties, users } from "@shared/schema";
import * as bcrypt from "bcryptjs";
import { pool } from "./db";

async function seedDatabase() {
  try {
    console.log("Starting database seeding...");
    
    // Check if database already has data
    try {
      // Direct query to check if tables have data
      const agentResult = await pool.query('SELECT COUNT(*) FROM agents');
      const propertyResult = await pool.query('SELECT COUNT(*) FROM properties');
      
      const agentCount = parseInt(agentResult.rows[0].count);
      const propertyCount = parseInt(propertyResult.rows[0].count);
      
      if (agentCount > 0 || propertyCount > 0) {
        console.log("Database already has data, skipping seed");
        return;
      }
    } catch (err) {
      console.log("Tables may not exist yet, will continue with seeding");
    }
    
    console.log("Seeding agents...");
    // Seed agents
    await db.insert(agents).values([
      {
        name: "Aditya Kumar",
        email: "aditya@homequest.com",
        phone: "9876543210",
        specialization: "Residential Specialist",
        experience: 5,
        rating: 4, // Convert to integer for PostgreSQL
        reviewCount: 42,
        image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400&q=80",
        bio: "Specializing in luxury residential properties with 5+ years of experience in the Mumbai market.",
        areas: ["Mumbai", "Thane"]
      },
      {
        name: "Sneha Sharma",
        email: "sneha@homequest.com",
        phone: "9876543211",
        specialization: "Luxury Property Expert",
        experience: 7,
        rating: 5,
        reviewCount: 38,
        image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400&q=80",
        bio: "Luxury property specialist with expertise in high-end residential and commercial properties.",
        areas: ["Mumbai", "Pune"]
      },
      {
        name: "Rajiv Verma",
        email: "rajiv@homequest.com",
        phone: "9876543212",
        specialization: "Commercial Property Specialist",
        experience: 6,
        rating: 4,
        reviewCount: 29,
        image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400&q=80",
        bio: "Commercial property expert helping businesses find the perfect office spaces and retail locations.",
        areas: ["Mumbai", "Hyderabad"]
      },
      {
        name: "Neha Gupta",
        email: "neha@homequest.com",
        phone: "9876543213",
        specialization: "New Projects Consultant",
        experience: 4,
        rating: 4, // Convert to integer for PostgreSQL
        reviewCount: 31,
        image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400&q=80",
        bio: "Specializing in new project launches with deep knowledge of upcoming developments across cities.",
        areas: ["Delhi", "Bangalore"]
      }
    ]);
    
    console.log("Seeding properties...");
    // Seed properties
    await db.insert(properties).values([
      {
        title: "Skyline Residency",
        description: "A beautiful 3BHK apartment with a stunning view of the city skyline. The apartment is well ventilated and gets ample sunlight. It has modern amenities including a swimming pool, gym, and children's play area.",
        address: "Skyline Residency, Bandra West",
        city: "Mumbai",
        location: "Bandra West",
        type: "apartment",
        category: "buy",
        price: 12500000, // 1.25 Cr
        displayPrice: "₹ 1.25 Cr",
        bedrooms: 3,
        bathrooms: 2,
        area: 1250,
        amenities: ["Swimming Pool", "Gym", "Children's Play Area", "Security"],
        features: ["Balcony", "Parking", "Power Backup"],
        images: [
          "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=500&q=80"
        ],
        latitude: "19.0596",
        longitude: "72.8295",
        status: "available",
        featured: true,
        agentId: 1
      },
      {
        title: "Palm Paradise Villa",
        description: "Luxurious 4BHK villa with a private swimming pool and garden. The villa is designed for modern living with high-end finishes, spacious rooms, and top-notch amenities.",
        address: "Palm Paradise, Juhu",
        city: "Mumbai",
        location: "Juhu",
        type: "villa",
        category: "buy",
        price: 29500000, // 2.95 Cr
        displayPrice: "₹ 2.95 Cr",
        bedrooms: 4,
        bathrooms: 4,
        area: 2680,
        amenities: ["Private Pool", "Garden", "Security", "Club House"],
        features: ["Terrace", "Parking", "Power Backup", "Furnished"],
        images: [
          "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=500&q=80"
        ],
        latitude: "19.1074",
        longitude: "72.8289",
        status: "available",
        featured: true,
        agentId: 2
      },
      {
        title: "Urban Compact Studio",
        description: "Cozy studio apartment perfect for singles or young couples. Modern design with efficient use of space and all necessary amenities for comfortable living.",
        address: "Urban Heights, Powai",
        city: "Mumbai",
        location: "Powai",
        type: "apartment",
        category: "buy",
        price: 7550000, // 75.5 Lac
        displayPrice: "₹ 75.5 Lac",
        bedrooms: 1,
        bathrooms: 1,
        area: 650,
        amenities: ["Gym", "Security", "Power Backup"],
        features: ["Modern Kitchen", "AC", "Furnished"],
        images: [
          "https://images.unsplash.com/photo-1505691938895-1758d7feb511?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=500&q=80"
        ],
        latitude: "19.1157",
        longitude: "72.9063",
        status: "available",
        isNewLaunch: true,
        agentId: 3
      },
      {
        title: "Business Hub Office Space",
        description: "Premium office space in a prime business district. The space is designed for optimal productivity with modern infrastructure and essential business amenities.",
        address: "Tech Park, Andheri East",
        city: "Mumbai",
        location: "Andheri East",
        type: "commercial",
        category: "buy",
        price: 17500000, // 1.75 Cr
        displayPrice: "₹ 1.75 Cr",
        area: 1800,
        amenities: ["Conference Room", "Cafeteria", "24/7 Security", "Power Backup"],
        features: ["Air Conditioning", "Parking", "Reception Area"],
        images: [
          "https://images.unsplash.com/photo-1604328698692-f76ea9498e76?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=500&q=80"
        ],
        latitude: "19.1136",
        longitude: "72.8697",
        status: "available",
        agentId: 4
      },
      {
        title: "Green Valley Apartment",
        description: "Spacious 2BHK apartment in a quiet neighborhood with lush greenery. Perfect for families looking for a peaceful living environment with all modern amenities.",
        address: "Green Valley, Malad West",
        city: "Mumbai",
        location: "Malad West",
        type: "apartment",
        category: "rent",
        price: 35000, // 35k per month
        displayPrice: "₹ 35,000/month",
        bedrooms: 2,
        bathrooms: 2,
        area: 950,
        amenities: ["Garden", "Children's Play Area", "Security"],
        features: ["Balcony", "Parking", "Semi-Furnished"],
        images: [
          "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=500&q=80"
        ],
        latitude: "19.1857",
        longitude: "72.8404",
        status: "available",
        agentId: 1
      },
      {
        title: "Summit Heights",
        description: "Elegant 3BHK apartment with premium finishes and spectacular city views. Located in a prime residential area with excellent connectivity and amenities.",
        address: "Summit Heights, Dadar West",
        city: "Mumbai",
        location: "Dadar West",
        type: "apartment",
        category: "buy",
        price: 18500000, // 1.85 Cr
        displayPrice: "₹ 1.85 Cr",
        bedrooms: 3,
        bathrooms: 3,
        area: 1500,
        amenities: ["Swimming Pool", "Gym", "Club House", "Security"],
        features: ["Balcony", "Parking", "Power Backup", "Furnished"],
        images: [
          "https://images.unsplash.com/photo-1493809842364-78817add7ffb?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=500&q=80"
        ],
        latitude: "19.0228",
        longitude: "72.8418",
        status: "available",
        featured: true,
        agentId: 2
      },
      {
        title: "Harmony Towers",
        description: "Contemporary 2BHK apartment with modern amenities. Located in a well-connected area with easy access to public transportation, schools, and shopping centers.",
        address: "Harmony Towers, Andheri West",
        city: "Mumbai",
        location: "Andheri West",
        type: "apartment",
        category: "rent",
        price: 45000, // 45k per month
        displayPrice: "₹ 45,000/month",
        bedrooms: 2,
        bathrooms: 2,
        area: 850,
        amenities: ["Gym", "Security", "Power Backup"],
        features: ["Balcony", "Parking", "Furnished"],
        images: [
          "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=500&q=80"
        ],
        latitude: "19.1364",
        longitude: "72.8296",
        status: "available",
        agentId: 3
      },
      {
        title: "Sunset Boulevard Apartment",
        description: "Luxurious 3BHK apartment with panoramic sea views. Located in a premium residential complex with world-class amenities and excellent security.",
        address: "Sunset Boulevard, Worli",
        city: "Mumbai",
        location: "Worli",
        type: "apartment",
        category: "buy",
        price: 45000000, // 4.5 Cr
        displayPrice: "₹ 4.5 Cr",
        bedrooms: 3,
        bathrooms: 3,
        area: 2100,
        amenities: ["Swimming Pool", "Gym", "Spa", "Club House", "Security"],
        features: ["Sea View", "Balcony", "Parking", "Fully Furnished"],
        images: [
          "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=500&q=80"
        ],
        latitude: "19.0178",
        longitude: "72.8478",
        status: "available",
        isExclusive: true,
        agentId: 4
      }
    ]);
    
    console.log("Seeding admin user...");
    // Create default admin user
    const hashedPassword = await bcrypt.hash("admin123", 10);
    await db.insert(users).values({
      username: "admin",
      password: hashedPassword,
      email: "admin@realestate.com",
      name: "Administrator",
      role: "admin"
    });
    
    console.log("Database seeded successfully!");
  } catch (error) {
    console.error("Error seeding database:", error);
  }
}

export { seedDatabase };