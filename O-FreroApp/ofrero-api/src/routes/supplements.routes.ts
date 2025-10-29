import { Router } from "express";
import { prisma } from "../lib/prisma";
import { z } from "zod";
import { requireAuth, requireAdmin } from "../middleware/auth";

export const supplementsRouter = Router();

/** Public: liste des suppléments disponibles (tous) */
supplementsRouter.get("/", async (_req, res) => {
  const data = await prisma.supplement.findMany({
    where: { isAvailable: true },
    orderBy: { name: "asc" },
  });
  res.json(data);
});

/** Public: suppléments disponibles pour un produit */
supplementsRouter.get("/product/:productId", async (req, res) => {
  const productId = req.params.productId;
  const links = await prisma.productSupplement.findMany({
    where: { productId, supplement: { isAvailable: true } },
    include: { supplement: true },
    orderBy: { supplement: { name: "asc" } },
  });

  // applique overridePrice si present
  const items = links.map((l) => ({
    id: l.supplementId,
    name: l.supplement.name,
    priceCents: l.overridePriceCents ?? l.supplement.priceCents,
    isAvailable: l.supplement.isAvailable,
  }));

  res.json(items);
});

/** Admin: CRUD simple */
const UpsertSchema = z.object({
  name: z.string().min(2),
  priceCents: z.number().int().min(0),
  isAvailable: z.boolean().optional().default(true),
});

supplementsRouter.post("/", requireAuth, requireAdmin, async (req, res) => {
  const parsed = UpsertSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid body", details: parsed.error.flatten() });

  const created = await prisma.supplement.create({ data: parsed.data });
  res.status(201).json(created);
});

supplementsRouter.put("/:id", requireAuth, requireAdmin, async (req, res) => {
  const parsed = UpsertSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid body", details: parsed.error.flatten() });

  const updated = await prisma.supplement.update({
    where: { id: req.params.id },
    data: parsed.data,
  });
  res.json(updated);
});

supplementsRouter.delete("/:id", requireAuth, requireAdmin, async (req, res) => {
  await prisma.supplement.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

/** Admin: attacher/détacher un supplément à un produit */
const LinkSchema = z.object({
  supplementId: z.string().cuid(),
  overridePriceCents: z.number().int().min(0).optional(),
});

supplementsRouter.post("/product/:productId/link", requireAuth, requireAdmin, async (req, res) => {
  const productId = req.params.productId;
  const parsed = LinkSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid body", details: parsed.error.flatten() });

  const created = await prisma.productSupplement.upsert({
    where: { productId_supplementId: { productId, supplementId: parsed.data.supplementId } },
    update: { overridePriceCents: parsed.data.overridePriceCents ?? null },
    create: { productId, supplementId: parsed.data.supplementId, overridePriceCents: parsed.data.overridePriceCents ?? null },
  });

  res.status(201).json(created);
});

supplementsRouter.delete("/product/:productId/unlink/:supplementId", requireAuth, requireAdmin, async (req, res) => {
  await prisma.productSupplement.delete({
    where: { productId_supplementId: { productId: req.params.productId, supplementId: req.params.supplementId } },
  });
  res.json({ ok: true });
});