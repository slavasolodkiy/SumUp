import { pgTable, text, timestamp, uuid, jsonb, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { merchantsTable } from "./merchants";

export const onboardingSessionsTable = pgTable("onboarding_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  merchantId: uuid("merchant_id").notNull().references(() => merchantsTable.id),
  currentStep: text("current_step").notNull().default("q_country"),
  status: text("status").notNull().default("not_started"),
  answers: jsonb("answers").notNull().default({}),
  progressPercent: integer("progress_percent").notNull().default(0),
  kycSessionId: text("kyc_session_id"),
  kycStatus: text("kyc_status"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertOnboardingSessionSchema = createInsertSchema(onboardingSessionsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertOnboardingSession = z.infer<typeof insertOnboardingSessionSchema>;
export type OnboardingSession = typeof onboardingSessionsTable.$inferSelect;
