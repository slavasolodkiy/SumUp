import { pgTable, text, timestamp, uuid, numeric, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { merchantsTable } from "./merchants";

export const transactionsTable = pgTable("transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  merchantId: uuid("merchant_id").notNull().references(() => merchantsTable.id),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  currency: text("currency").notNull().default("GBP"),
  status: text("status").notNull().default("successful"),
  paymentMethod: text("payment_method").notNull().default("card"),
  cardLastFour: text("card_last_four"),
  cardScheme: text("card_scheme"),
  productId: text("product_id"),
  productName: text("product_name"),
  description: text("description"),
  receiptSent: boolean("receipt_sent").notNull().default(false),
  customerEmail: text("customer_email"),
  refundedAt: timestamp("refunded_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertTransactionSchema = createInsertSchema(transactionsTable).omit({
  id: true,
  createdAt: true,
});

export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactionsTable.$inferSelect;
