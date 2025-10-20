import { Router } from "express";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { requireAuth, requireAdmin } from "../middleware/auth";

export const productsRouter = Router();

/* ------------------------ Helpers pagination & tri ------------------------ */
function parsePagination(query: any) {
  const page = Math.max(parseInt(String(query.page ?? "1"), 10) || 1, 1);
  const pageSize = Math.min(Math.max(parseInt(String(query.pageSize ?? "10"), 10) || 10, 1), 100);
  const skip = (page - 1) * pageSize;
  const take = pageSize;
  return { page, pageSize, skip, take };
}

function parseSort(query: any): Prisma.ProductOrderByWithRelationInput {
  const sort = String(query.sort ?? "").trim(); // ex: "priceDesc", "name", "createdAtDesc"
  const map: Record<string, Prisma.SortOrder> = { asc: "asc", desc: "desc" };
  const kv: [keyof Prisma.ProductOrderByWithRelationInput, Prisma.SortOrder][] = [
    ["name", "asc"],
  ];

  if (!sort) return Object.fromEntries(kv);

  const lower = sort.toLowerCase();
  if (lower.startsWith("price")) {
    kv.splice(0, kv.length, ["priceCents", lower.endsWith("desc") ? "desc" : "asc"]);
  } else if (lower.startsWith("createdat")) {
    kv.splice(0, kv.length, ["createdAt", lower.endsWith("desc") ? "desc" : "asc"]);
  } else if (lower.startsWith("name")) {
    kv.splice(0, kv.length, ["name", lower.endsWith("desc") ? "desc" : "asc"]);
  }
  return Object.fromEntries(kv);
}

/* ------------------------------ GET /products ----------------------------- */
productsRouter.get("/", async (req, res) => {
  const q = (req.query.q as string | undefined)?.trim();
  const categoryId = (req.query.categoryId as string | undefined)?.trim() || undefined;

  const where: Prisma.ProductWhereInput = {
    ...(q ? { name: { contains: q, mode: "insensitive" } } : {}),
    ...(categoryId ? { categoryId } : {}),
  };

  const { skip, take, page, pageSize } = parsePagination(req.query);
  const orderBy = parseSort(req.query);

  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy,
      skip,
      take,
      include: { category: { select: { id: true, name: true } } },
    }),
    prisma.product.count({ where }),
  ]);

  res.json({
    page,
    pageSize,
    total,
    items,
  });
});

/* --------------------------- GET /products/:id ---------------------------- */
productsRouter.get("/:id", async (req, res) => {
  const product = await prisma.product.findUnique({
    where: { id: req.params.id },
    include: { category: { select: { id: true, name: true } } },
  });
  if (!product) return res.status(404).json({ error: "Not found" });
  res.json(product);
});

/* ------------------------------ POST /products ---------------------------- */
const NewProductSchema = z.object({
  name: z.string().min(2),
  priceCents: z.number().int().min(0),
  description: z.string().optional(),
  categoryId: z.string().optional().nullable(),
});

productsRouter.post("/", requireAuth, requireAdmin, async (req, res) => {
  const parsed = NewProductSchema.safeParse(req.body);
  if (!parsed.success)
    return res.status(400).json({ error: "Invalid body", details: parsed.error.flatten() });

  if (parsed.data.categoryId) {
    const cat = await prisma.category.findUnique({ where: { id: parsed.data.categoryId } });
    if (!cat) return res.status(404).json({ error: "Category not found" });
  }

  const product = await prisma.product.create({ data: parsed.data });
  res.status(201).json(product);
});

/* ----------------------- GET /products/by-category/:id -------------------- */
productsRouter.get("/by-category/:categoryId", async (req, res) => {
  const { skip, take, page, pageSize } = parsePagination(req.query);
  const orderBy = parseSort(req.query);

  // vérifie la catégorie
  const cat = await prisma.category.findUnique({ where: { id: req.params.categoryId } });
  if (!cat) return res.status(404).json({ error: "Category not found" });

  const where: Prisma.ProductWhereInput = { categoryId: req.params.categoryId };

  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy,
      skip,
      take,
      include: { category: { select: { id: true, name: true } } },
    }),
    prisma.product.count({ where }),
  ]);

  res.json({
    category: { id: cat.id, name: cat.name },
    page,
    pageSize,
    total,
    items,
  });
});

/* ----------------------------- POST /products/seed ------------------------ */
productsRouter.post("/seed", requireAuth, requireAdmin, async (_req, res) => {
  const pizzaCategory = await prisma.category.upsert({
    where: { name: "Pizza" },
    update: {},
    create: { name: "Pizza" },
    select: { id: true },
  });

  const data = [
    { name: "Pizza Margherita", description: "Tomate, mozzarella, basilic", priceCents: 950, categoryId: pizzaCategory.id },
    { name: "Pizza Reine", description: "Jambon, champignons, mozzarella", priceCents: 1150, categoryId: pizzaCategory.id },
    { name: "Pizza 4 Fromages", description: "Mozzarella, gorgonzola, parmesan, emmental", priceCents: 1250, categoryId: pizzaCategory.id },
    { name: "Pizza Diavola", description: "Pepperoni piquant, olives noires", priceCents: 1300, categoryId: pizzaCategory.id },
    { name: "Pizza O’Frero Spéciale", description: "Chèvre, viande hachée, oignons caramélisés, sauce BBQ", priceCents: 1450, categoryId: pizzaCategory.id },
  ];

  try {
    const created = await prisma.product.createMany({ data });
    res.status(201).json({ message: `🍕 ${created.count} pizzas ajoutées`, count: created.count });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Erreur lors de la création des pizzas" });
  }
});