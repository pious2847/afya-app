import { pgTable, text, timestamp, uuid, real, boolean } from "drizzle-orm/pg-core";

export const assessments = pgTable("assessments", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull(),
  symptoms: text("symptoms").notNull(), // JSON string of symptom data
  riskLevel: text("risk_level").notNull(), // low | medium | high | emergency
  recommendations: text("recommendations"), // JSON string of AI recommendations
  bodyRegions: text("body_regions"), // JSON: selected body map regions
  conversationSummary: text("conversation_summary"), // Full Q&A for context
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Each Q&A turn in conversational assessment - saves ALL user responses
export const assessmentTurns = pgTable("assessment_turns", {
  id: uuid("id").defaultRandom().primaryKey(),
  assessmentId: uuid("assessment_id").notNull(),
  role: text("role").notNull(), // user | assistant
  content: text("content").notNull(),
  metadata: text("metadata"), // JSON: e.g. bodyRegions, severity
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const clinics = pgTable("clinics", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  address: text("address").notNull(),
  latitude: real("latitude"),
  longitude: real("longitude"),
  phone: text("phone"),
  email: text("email"),
  type: text("type").notNull(), // clinic | hospital | health_center
  region: text("region"),
  operatingHours: text("operating_hours"), // JSON or plain text
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Super admins - Clerk userIds who can manage clinics and view analytics
export const admins = pgTable("admins", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull().unique(),
  email: text("email"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Emergency alerts / consultation requests (for teleconsultation flow)
export const emergencyAlerts = pgTable("emergency_alerts", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull(),
  assessmentId: uuid("assessment_id"),
  message: text("message"),
  status: text("status").default("pending"), // pending | acknowledged | resolved
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
