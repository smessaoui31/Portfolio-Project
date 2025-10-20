import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireAuth, requireAdmin } from "../middleware/auth";

export const categoriesRouter = Router();

// Routes to list all categories by name

categoriesRouter.get("/", async (_req, res) =>  {
    const categories = await prisma.category.findMany({
        orderBy: { name: "asc"},
    });
    res.json(categories);
});