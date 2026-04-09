import { Router } from "express";
import { db } from "@workspace/db";
import { transactionsTable, checkoutsTable, payoutsTable } from "@workspace/db";
import { eq, and, desc, gte, lte, sql } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth.js";
import { CreateTransactionBody, ListTransactionsQueryParams, RefundTransactionBody, CreateCheckoutBody, GetPaymentSummaryQueryParams } from "@workspace/api-zod";

const CARD_SCHEMES = ["visa", "mastercard", "amex", "maestro"] as const;
const LAST_FOURS = ["4242", "1234", "5678", "9012", "3456"];

function randomCard() {
  return {
    scheme: CARD_SCHEMES[Math.floor(Math.random() * CARD_SCHEMES.length)],
    lastFour: LAST_FOURS[Math.floor(Math.random() * LAST_FOURS.length)],
  };
}

const router = Router();

router.get("/payments/transactions", requireAuth, async (req, res) => {
  const parsed = ListTransactionsQueryParams.safeParse(req.query);
  const limit = parsed.success ? (parsed.data.limit ?? 20) : 20;
  const offset = parsed.success ? (parsed.data.offset ?? 0) : 0;

  const conditions = [eq(transactionsTable.merchantId, req.merchantId!)];

  if (parsed.success && parsed.data.status) {
    conditions.push(eq(transactionsTable.status, parsed.data.status));
  }
  if (parsed.success && parsed.data.start_date) {
    conditions.push(gte(transactionsTable.createdAt, new Date(parsed.data.start_date)));
  }
  if (parsed.success && parsed.data.end_date) {
    conditions.push(lte(transactionsTable.createdAt, new Date(parsed.data.end_date + "T23:59:59Z")));
  }

  const [items, [{ count }]] = await Promise.all([
    db.select().from(transactionsTable).where(and(...conditions)).orderBy(desc(transactionsTable.createdAt)).limit(limit).offset(offset),
    db.select({ count: sql<number>`count(*)::int` }).from(transactionsTable).where(and(...conditions)),
  ]);

  res.json({ items: items.map(formatTx), total: count, limit, offset });
});

router.post("/payments/transactions", requireAuth, async (req, res) => {
  const parsed = CreateTransactionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "ValidationError", message: "Invalid request body" });
    return;
  }

  const card = parsed.data.payment_method === "card" || parsed.data.payment_method === "tap_to_pay" ? randomCard() : null;

  const [tx] = await db.insert(transactionsTable).values({
    merchantId: req.merchantId!,
    amount: parsed.data.amount.toString(),
    currency: parsed.data.currency,
    status: "successful",
    paymentMethod: parsed.data.payment_method,
    cardLastFour: card?.lastFour,
    cardScheme: card?.scheme,
    productId: parsed.data.product_id,
    description: parsed.data.description,
    customerEmail: parsed.data.customer_email,
    receiptSent: !!parsed.data.customer_email,
  }).returning();

  res.status(201).json(formatTx(tx));
});

router.get("/payments/transactions/:transactionId", requireAuth, async (req, res) => {
  const txId = String(req.params["transactionId"]);
  const [tx] = await db.select().from(transactionsTable)
    .where(and(eq(transactionsTable.id, txId), eq(transactionsTable.merchantId, req.merchantId!)))
    .limit(1);

  if (!tx) {
    res.status(404).json({ error: "NotFound", message: "Transaction not found" });
    return;
  }
  res.json(formatTx(tx));
});

router.post("/payments/transactions/:transactionId/refund", requireAuth, async (req, res) => {
  const txId = String(req.params["transactionId"]);
  const [tx] = await db.select().from(transactionsTable)
    .where(and(eq(transactionsTable.id, txId), eq(transactionsTable.merchantId, req.merchantId!)))
    .limit(1);

  if (!tx) {
    res.status(404).json({ error: "NotFound", message: "Transaction not found" });
    return;
  }

  const [updated] = await db.update(transactionsTable)
    .set({ status: "refunded", refundedAt: new Date() })
    .where(eq(transactionsTable.id, tx.id))
    .returning();

  res.json(formatTx(updated));
});

router.post("/payments/checkouts", requireAuth, async (req, res) => {
  const parsed = CreateCheckoutBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "ValidationError", message: "Invalid request body" });
    return;
  }

  const checkoutId = crypto.randomUUID();
  const checkoutUrl = `${process.env["REPLIT_DEV_DOMAIN"] || "http://localhost"}/checkout/${checkoutId}`;
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  const [checkout] = await db.insert(checkoutsTable).values({
    merchantId: req.merchantId!,
    amount: parsed.data.amount.toString(),
    currency: parsed.data.currency,
    title: parsed.data.title,
    description: parsed.data.description,
    status: "pending",
    checkoutUrl,
    redirectUrl: parsed.data.redirect_url,
    expiresAt,
  }).returning();

  res.status(201).json(formatCheckout(checkout));
});

router.get("/payments/checkouts", requireAuth, async (req, res) => {
  const checkouts = await db.select().from(checkoutsTable)
    .where(eq(checkoutsTable.merchantId, req.merchantId!))
    .orderBy(desc(checkoutsTable.createdAt))
    .limit(20);
  res.json(checkouts.map(formatCheckout));
});

router.get("/payments/summary", requireAuth, async (req, res) => {
  const parsed = GetPaymentSummaryQueryParams.safeParse(req.query);
  const period = parsed.success ? (parsed.data.period ?? "month") : "month";

  const now = new Date();
  let startDate: Date;
  if (period === "today") {
    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  } else if (period === "week") {
    startDate = new Date(now);
    startDate.setDate(now.getDate() - 7);
  } else if (period === "year") {
    startDate = new Date(now.getFullYear(), 0, 1);
  } else {
    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  }

  const txs = await db.select().from(transactionsTable)
    .where(and(eq(transactionsTable.merchantId, req.merchantId!), eq(transactionsTable.status, "successful"), gte(transactionsTable.createdAt, startDate)));

  const total_volume = txs.reduce((acc, t) => acc + parseFloat(t.amount), 0);
  const total_transactions = txs.length;
  const average_transaction = total_transactions > 0 ? total_volume / total_transactions : 0;

  const dailyMap = new Map<string, { volume: number; count: number }>();
  txs.forEach(t => {
    const date = t.createdAt.toISOString().split("T")[0]!;
    const existing = dailyMap.get(date) ?? { volume: 0, count: 0 };
    dailyMap.set(date, { volume: existing.volume + parseFloat(t.amount), count: existing.count + 1 });
  });

  const daily_breakdown = Array.from(dailyMap.entries())
    .map(([date, data]) => ({ date, volume: data.volume, count: data.count }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const methodMap = new Map<string, { volume: number; count: number }>();
  txs.forEach(t => {
    const existing = methodMap.get(t.paymentMethod) ?? { volume: 0, count: 0 };
    methodMap.set(t.paymentMethod, { volume: existing.volume + parseFloat(t.amount), count: existing.count + 1 });
  });

  const by_payment_method = Array.from(methodMap.entries())
    .map(([method, data]) => ({
      method,
      volume: data.volume,
      count: data.count,
      percentage: total_volume > 0 ? Math.round((data.volume / total_volume) * 100) : 0
    }));

  res.json({ period, total_volume, total_transactions, average_transaction, currency: "GBP", daily_breakdown, by_payment_method });
});

router.get("/payments/payouts", requireAuth, async (req, res) => {
  const payouts = await db.select().from(payoutsTable)
    .where(eq(payoutsTable.merchantId, req.merchantId!))
    .orderBy(desc(payoutsTable.createdAt))
    .limit(20);
  res.json(payouts.map(formatPayout));
});

function formatTx(t: typeof transactionsTable.$inferSelect) {
  return {
    id: t.id, merchant_id: t.merchantId,
    amount: parseFloat(t.amount), currency: t.currency,
    status: t.status, payment_method: t.paymentMethod,
    card_last_four: t.cardLastFour, card_scheme: t.cardScheme,
    product_id: t.productId, product_name: t.productName,
    description: t.description, receipt_sent: t.receiptSent,
    customer_email: t.customerEmail, created_at: t.createdAt, refunded_at: t.refundedAt,
  };
}

function formatCheckout(c: typeof checkoutsTable.$inferSelect) {
  return {
    id: c.id, merchant_id: c.merchantId,
    amount: parseFloat(c.amount), currency: c.currency,
    title: c.title, description: c.description,
    status: c.status, checkout_url: c.checkoutUrl,
    redirect_url: c.redirectUrl, created_at: c.createdAt, expires_at: c.expiresAt,
  };
}

function formatPayout(p: typeof payoutsTable.$inferSelect) {
  return {
    id: p.id, merchant_id: p.merchantId,
    amount: parseFloat(p.amount), currency: p.currency,
    status: p.status, payout_date: p.payoutDate,
    reference: p.reference, created_at: p.createdAt,
  };
}

export { router as paymentsRouter };
