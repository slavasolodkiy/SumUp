import { Router } from "express";
import { db } from "@workspace/db";
import { productsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth.js";
import { CreateProductBody, ListProductsQueryParams } from "@workspace/api-zod";

const DEFAULT_CATEGORIES = [
  { id: "food_drink", name: "Food & Drink" },
  { id: "retail", name: "Retail" },
  { id: "health_beauty", name: "Health & Beauty" },
  { id: "sport_fitness", name: "Sport & Fitness" },
  { id: "services", name: "Services" },
  { id: "events", name: "Events & Entertainment" },
  { id: "charity", name: "Charity & Non-profit" },
  { id: "other", name: "Other" },
];

const router = Router();

router.get("/products/categories", requireAuth, (_req, res) => {
  res.json(DEFAULT_CATEGORIES.map(c => ({ id: c.id, name: c.name })));
});

router.get("/products", requireAuth, async (req, res) => {
  const parsed = ListProductsQueryParams.safeParse(req.query);
  const conditions = [eq(productsTable.merchantId, req.merchantId!)];

  if (parsed.success && parsed.data.category) {
    conditions.push(eq(productsTable.category, parsed.data.category));
  }
  if (parsed.success && parsed.data.active !== undefined) {
    conditions.push(eq(productsTable.active, parsed.data.active));
  }

  const products = await db.select().from(productsTable).where(and(...conditions));
  res.json(products.map(formatProduct));
});

router.post("/products", requireAuth, async (req, res) => {
  const parsed = CreateProductBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "ValidationError", message: "Invalid request body" });
    return;
  }

  const [product] = await db.insert(productsTable).values({
    merchantId: req.merchantId!,
    name: parsed.data.name,
    description: parsed.data.description,
    price: parsed.data.price.toString(),
    currency: parsed.data.currency,
    category: parsed.data.category,
    sku: parsed.data.sku,
    active: parsed.data.active ?? true,
    imageUrl: parsed.data.image_url,
  }).returning();

  res.status(201).json(formatProduct(product));
});

router.get("/products/:productId", requireAuth, async (req, res) => {
  const productId = String(req.params["productId"]);
  const [product] = await db.select().from(productsTable)
    .where(and(eq(productsTable.id, productId), eq(productsTable.merchantId, req.merchantId!)))
    .limit(1);

  if (!product) {
    res.status(404).json({ error: "NotFound", message: "Product not found" });
    return;
  }
  res.json(formatProduct(product));
});

router.put("/products/:productId", requireAuth, async (req, res) => {
  const productId = String(req.params["productId"]);
  const parsed = CreateProductBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "ValidationError", message: "Invalid request body" });
    return;
  }

  const [product] = await db.update(productsTable)
    .set({
      name: parsed.data.name,
      description: parsed.data.description,
      price: parsed.data.price.toString(),
      currency: parsed.data.currency,
      category: parsed.data.category,
      sku: parsed.data.sku,
      active: parsed.data.active ?? true,
      imageUrl: parsed.data.image_url,
      updatedAt: new Date(),
    })
    .where(and(eq(productsTable.id, productId), eq(productsTable.merchantId, req.merchantId!)))
    .returning();

  if (!product) {
    res.status(404).json({ error: "NotFound", message: "Product not found" });
    return;
  }
  res.json(formatProduct(product));
});

router.delete("/products/:productId", requireAuth, async (req, res) => {
  const productId = String(req.params["productId"]);
  await db.delete(productsTable)
    .where(and(eq(productsTable.id, productId), eq(productsTable.merchantId, req.merchantId!)));
  res.status(204).send();
});

function formatProduct(p: typeof productsTable.$inferSelect) {
  return {
    id: p.id, merchant_id: p.merchantId,
    name: p.name, description: p.description,
    price: parseFloat(p.price), currency: p.currency,
    category: p.category, sku: p.sku,
    active: p.active, image_url: p.imageUrl,
    created_at: p.createdAt, updated_at: p.updatedAt,
  };
}

export { router as productsRouter };
