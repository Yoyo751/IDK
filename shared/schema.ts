import { pgTable, text, serial, integer, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Property data model
export const properties = pgTable("properties", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  address: text("address").notNull(),
  city: text("city").notNull(),
  location: text("location").notNull(),
  type: text("type").notNull(), // apartment, villa, commercial, plot
  category: text("category").notNull(), // buy, rent, pg
  price: integer("price").notNull(),
  priceUnit: text("price_unit").notNull().default("₹"), // ₹, $, etc.
  displayPrice: text("display_price"), // e.g. "₹ 1.2 Cr", "On Request"
  bedrooms: integer("bedrooms"),
  bathrooms: integer("bathrooms"),
  area: integer("area"), // in sq. ft.
  amenities: jsonb("amenities").$type<string[]>(),
  features: jsonb("features").$type<string[]>(),
  images: jsonb("images").$type<string[]>().notNull(),
  latitude: text("latitude"),
  longitude: text("longitude"),
  builderId: integer("builder_id"),
  status: text("status").notNull().default("available"), // available, sold, rented
  featured: boolean("featured").default(false),
  isNewLaunch: boolean("is_new_launch").default(false),
  isExclusive: boolean("is_exclusive").default(false),
  isReadyToMove: boolean("is_ready_to_move").default(false),
  agentId: integer("agent_id"),
});

// Agents data model
export const agents = pgTable("agents", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone").notNull(),
  specialization: text("specialization"),
  areas: jsonb("areas"), // array of areas they specialize in
  experience: integer("experience"),
  rating: integer("rating"),
  reviewCount: integer("review_count").default(0),
  image: text("image"),
  bio: text("bio"),
});

// Enquiries data model
export const enquiries = pgTable("enquiries", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  message: text("message").notNull(),
  propertyId: integer("property_id"),
  agentId: integer("agent_id"),
  interest: text("interest"), // buy, rent, sell, invest
  createdAt: timestamp("created_at").defaultNow(),
});

// Users data model (extended from template)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").unique(),
  name: text("name"),
  phone: text("phone"),
  role: text("role").notNull().default("user"), // user, agent, admin
  profileImage: text("profile_image"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Saved properties data model
export const savedProperties = pgTable("saved_properties", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  propertyId: integer("property_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas
export const insertPropertySchema = createInsertSchema(properties).omit({
  id: true,
});

export const insertAgentSchema = createInsertSchema(agents).omit({
  id: true,
});

export const insertEnquirySchema = createInsertSchema(enquiries).omit({
  id: true,
  createdAt: true,
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  name: true,
  phone: true,
});

export const insertSavedPropertySchema = createInsertSchema(savedProperties).omit({
  id: true,
  createdAt: true,
});

// Create a separate schema for the enquiry form that has basic validation
export const enquiryFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  email: z.string().email({ message: "Please enter a valid email address" }),
  phone: z.string().min(10, { message: "Please enter a valid phone number" }),
  message: z.string().min(10, { message: "Message must be at least 10 characters" }),
  interest: z.string(),
  propertyId: z.number().optional(),
  agentId: z.number().optional(),
});

// Property filter schema
export const propertyFilterSchema = z.object({
  category: z.string().optional(),
  type: z.string().optional(),
  city: z.string().optional(),
  location: z.string().optional(),
  minPrice: z.number().optional(),
  maxPrice: z.number().optional(),
  bedrooms: z.number().optional(),
  bathrooms: z.number().optional(),
  minArea: z.number().optional(),
  maxArea: z.number().optional(),
  status: z.string().optional(),
  featured: z.boolean().optional(),
});

// Type definitions
export type Property = typeof properties.$inferSelect;
export type InsertProperty = z.infer<typeof insertPropertySchema>;

export type Agent = typeof agents.$inferSelect;
export type InsertAgent = z.infer<typeof insertAgentSchema>;

export type Enquiry = typeof enquiries.$inferSelect;
export type InsertEnquiry = z.infer<typeof insertEnquirySchema>;

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type SavedProperty = typeof savedProperties.$inferSelect;
export type InsertSavedProperty = z.infer<typeof insertSavedPropertySchema>;

export type EnquiryFormData = z.infer<typeof enquiryFormSchema>;
export type PropertyFilter = z.infer<typeof propertyFilterSchema>;
