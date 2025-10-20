import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireAuth, AuthRequest } from "../middleware/auth";

export const addressRouter = Router();

const AddressInput = z.object({
  line1: z.string().min(3),
  line2: z.string().optional(),
  city: z.string().min(2),
  postalCode: z.string().min(3),
  phone: z.string().min(6),
  isDefault: z.boolean().optional(), // si true, on bascule le défaut
});

// GET /addresses – liste des adresses de l’utilisateur
addressRouter.get("/", requireAuth, async (req: AuthRequest, res) => {
  const addresses = await prisma.address.findMany({
    where: { userId: req.user!.id },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  });
  res.json(addresses);
});

// POST /addresses – créer une adresse (+ possibilité de la marquer défaut)
addressRouter.post("/", requireAuth, async (req: AuthRequest, res) => {
  const parsed = AddressInput.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid body", details: parsed.error.flatten() });

  const { isDefault = false, ...data } = parsed.data;

  const created = await prisma.$transaction(async (tx) => {
    if (isDefault) {
      await tx.address.updateMany({ where: { userId: req.user!.id, isDefault: true }, data: { isDefault: false } });
    }
    return tx.address.create({ data: { ...data, userId: req.user!.id, isDefault } });
  });

  res.status(201).json(created);
});

// PATCH /addresses/:id – mise à jour (peut aussi basculer défaut)
addressRouter.patch("/:id", requireAuth, async (req: AuthRequest, res) => {
  const parsed = AddressInput.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid body", details: parsed.error.flatten() });

  const addr = await prisma.address.findFirst({ where: { id: req.params.id, userId: req.user!.id } });
  if (!addr) return res.status(404).json({ error: "Address not found" });

  const { isDefault, ...data } = parsed.data;

  const updated = await prisma.$transaction(async (tx) => {
    if (isDefault === true) {
      await tx.address.updateMany({ where: { userId: req.user!.id, isDefault: true }, data: { isDefault: false } });
    }
    return tx.address.update({
      where: { id: addr.id },
      data: { ...data, ...(isDefault !== undefined ? { isDefault } : {}) },
    });
  });

  res.json(updated);
});

// PATCH /addresses/:id/default – bascule cette adresse en défaut
addressRouter.patch("/:id/default", requireAuth, async (req: AuthRequest, res) => {
  const addr = await prisma.address.findFirst({ where: { id: req.params.id, userId: req.user!.id } });
  if (!addr) return res.status(404).json({ error: "Address not found" });

  const updated = await prisma.$transaction(async (tx) => {
    await tx.address.updateMany({ where: { userId: req.user!.id, isDefault: true }, data: { isDefault: false } });
    return tx.address.update({ where: { id: addr.id }, data: { isDefault: true } });
  });

  res.json(updated);
});

// DELETE /addresses/:id – suppression
addressRouter.delete("/:id", requireAuth, async (req: AuthRequest, res) => {
  const addr = await prisma.address.findFirst({ where: { id: req.params.id, userId: req.user!.id } });
  if (!addr) return res.status(404).json({ error: "Address not found" });

  await prisma.address.delete({ where: { id: addr.id } });
  res.json({ deleted: addr.id });
});