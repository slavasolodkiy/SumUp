import { Router } from "express";
import { db } from "@workspace/db";
import { merchantsTable, transactionsTable, productsTable } from "@workspace/db";
import { eq, desc, and, gte, sql } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth.js";
import { UpdateMyMerchantBody } from "@workspace/api-zod";
import { formatMerchant } from "./auth.js";

const router = Router();

router.get("/merchants/me", requireAuth, async (req, res) => {
  const [merchant] = await db.select().from(merchantsTable).where(eq(merchantsTable.id, req.merchantId!)).limit(1);
  if (!merchant) {
    res.status(404).json({ error: "NotFound", message: "Merchant not found" });
    return;
  }
  res.json(formatMerchant(merchant));
});

router.put("/merchants/me", requireAuth, async (req, res) => {
  const parsed = UpdateMyMerchantBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "ValidationError", message: "Invalid request body" });
    return;
  }

  const updates: Record<string, unknown> = { updatedAt: new Date() };
  if (parsed.data.first_name) updates["firstName"] = parsed.data.first_name;
  if (parsed.data.last_name) updates["lastName"] = parsed.data.last_name;
  if (parsed.data.business_name) updates["businessName"] = parsed.data.business_name;
  if (parsed.data.business_category) updates["businessCategory"] = parsed.data.business_category;

  const [updated] = await db.update(merchantsTable)
    .set(updates as Partial<typeof merchantsTable.$inferInsert>)
    .where(eq(merchantsTable.id, req.merchantId!))
    .returning();

  res.json(formatMerchant(updated));
});

router.get("/merchants/me/summary", requireAuth, async (req, res) => {
  const merchantId = req.merchantId!;
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(startOfDay);
  startOfWeek.setDate(startOfDay.getDate() - startOfDay.getDay());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [merchant] = await db.select().from(merchantsTable).where(eq(merchantsTable.id, merchantId)).limit(1);
  const currency = merchant?.country === "US" ? "USD" : merchant?.country === "BR" ? "BRL" : "GBP";

  const recentTxs = await db.select().from(transactionsTable)
    .where(and(eq(transactionsTable.merchantId, merchantId), eq(transactionsTable.status, "successful")))
    .orderBy(desc(transactionsTable.createdAt))
    .limit(10);

  const todayTxs = recentTxs.filter(t => t.createdAt >= startOfDay);
  const weekTxs = await db.select().from(transactionsTable)
    .where(and(eq(transactionsTable.merchantId, merchantId), eq(transactionsTable.status, "successful"), gte(transactionsTable.createdAt, startOfWeek)));
  const monthTxs = await db.select().from(transactionsTable)
    .where(and(eq(transactionsTable.merchantId, merchantId), eq(transactionsTable.status, "successful"), gte(transactionsTable.createdAt, startOfMonth)));

  const sum = (txs: typeof recentTxs) => txs.reduce((acc, t) => acc + parseFloat(t.amount), 0);

  const productMap = new Map<string, { name: string; count: number; volume: number }>();
  monthTxs.forEach(t => {
    if (t.productId && t.productName) {
      const existing = productMap.get(t.productId) ?? { name: t.productName, count: 0, volume: 0 };
      productMap.set(t.productId, { name: t.productName, count: existing.count + 1, volume: existing.volume + parseFloat(t.amount) });
    }
  });

  const topProducts = Array.from(productMap.entries())
    .map(([productId, data]) => ({ product_id: productId, name: data.name, total_sold: data.count, total_volume: data.volume }))
    .sort((a, b) => b.total_volume - a.total_volume)
    .slice(0, 5);

  res.json({
    today_volume: sum(todayTxs),
    today_transactions: todayTxs.length,
    week_volume: sum(weekTxs),
    month_volume: sum(monthTxs),
    currency,
    recent_transactions: recentTxs.map(formatTx),
    top_products: topProducts,
  });
});

function formatTx(t: typeof transactionsTable.$inferSelect) {
  return {
    id: t.id,
    merchant_id: t.merchantId,
    amount: parseFloat(t.amount),
    currency: t.currency,
    status: t.status,
    payment_method: t.paymentMethod,
    card_last_four: t.cardLastFour,
    card_scheme: t.cardScheme,
    product_id: t.productId,
    product_name: t.productName,
    description: t.description,
    receipt_sent: t.receiptSent,
    customer_email: t.customerEmail,
    created_at: t.createdAt,
    refunded_at: t.refundedAt,
  };
}

export { router as merchantsRouter };
