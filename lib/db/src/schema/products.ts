import { pgTable, text, timestamp, uuid, numeric, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { merchantsTable } from "./merchants";

export const productsTable = pgTable("products", {
  id: uuid("id").primaryKey().defaultRandom(),
  merchantId: uuid("merchant_id").notNull().references(() => merchantsTable.id),
  name: text("name").notNull(),
  description: text("description"),
  price: numeric("price", { precision: 12, scale: 2 }).notNull(),
  currency: text("currency").notNull().default("GBP"),
  category: text("category"),
  sku: text("sku"),
  active: boolean("active").notNull().default(true),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertProductSchema = createInsertSchema(productsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof productsTable.$inferSelect;

export const checkoutsTable = pgTable("checkouts", {
  id: uuid("id").primaryKey().defaultRandom(),
  merchantId: uuid("merchant_id").notNull().references(() => merchantsTable.id),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  currency: text("currency").notNull().default("GBP"),
  title: text("title"),
  description: text("description"),
  status: text("status").notNull().default("pending"),
  checkoutUrl: text("checkout_url").notNull(),
  redirectUrl: text("redirect_url"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  expiresAt: timestamp("expires_at"),
});

export const insertCheckoutSchema = createInsertSchema(checkoutsTable).omit({
  id: true,
  createdAt: true,
});

export type InsertCheckout = z.infer<typeof insertCheckoutSchema>;
export type Checkout = typeof checkoutsTable.$inferSelect;
