import { pgTable, text, timestamp, uuid, numeric, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { merchantsTable } from "./merchants";

export const payoutsTable = pgTable("payouts", {
  id: uuid("id").primaryKey().defaultRandom(),
  merchantId: uuid("merchant_id").notNull().references(() => merchantsTable.id),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  currency: text("currency").notNull().default("GBP"),
  status: text("status").notNull().default("pending"),
  payoutDate: date("payout_date").notNull(),
  reference: text("reference"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertPayoutSchema = createInsertSchema(payoutsTable).omit({
  id: true,
  createdAt: true,
});

export type InsertPayout = z.infer<typeof insertPayoutSchema>;
export type Payout = typeof payoutsTable.$inferSelect;
