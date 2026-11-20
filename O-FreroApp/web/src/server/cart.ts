import { z } from "zod";
import { mergeCartLines } from "@/domain/cart";
import type { CartLineInput } from "@/domain/types";
import { prisma } from "@/lib/db";

const storedLine = z.object({
  productId: z.string(),
  quantity: z.number().int().min(1).max(20),
  cooking: z.enum(["NORMAL", "WELL_DONE", "LIGHTLY_COOKED"]),
  supplementIds: z.array(z.string()),
});

export interface DescribedLine extends CartLineInput {
  name: string;
  imageUrl: string | null;
  supplementNames: string[];
}

export async function loadCart(userId: string): Promise<CartLineInput[]> {
  const cart = await prisma.cart.findUnique({ where: { userId } });
  if (!cart || !Array.isArray(cart.lines)) return [];
  return cart.lines.flatMap((line) => {
    const parsed = storedLine.safeParse(line);
    return parsed.success ? [parsed.data] : [];
  });
}

export async function saveCart(userId: string, lines: CartLineInput[]): Promise<void> {
  const data = lines.map(({ productId, quantity, cooking, supplementIds }) => ({ productId, quantity, cooking, supplementIds }));
  await prisma.cart.upsert({ where: { userId }, update: { lines: data }, create: { userId, lines: data } });
}

/** Stored cart first, then the lines added on this device; saved and returned. */
export async function mergeIntoAccount(userId: string, local: CartLineInput[]): Promise<CartLineInput[]> {
  const merged = mergeCartLines(await loadCart(userId), local);
  await saveCart(userId, merged);
  return merged;
}

/** Adds what the UI needs to show lines that come from the server. */
export async function describeLines(lines: CartLineInput[]): Promise<DescribedLine[]> {
  const products = await prisma.product.findMany({
    where: { id: { in: lines.map((l) => l.productId) } },
    select: { id: true, name: true, imageUrl: true, supplements: { select: { supplement: { select: { id: true, name: true } } } } },
  });
  const byId = new Map(products.map((p) => [p.id, p]));
  return lines.flatMap((line) => {
    const product = byId.get(line.productId);
    if (!product) return [];
    const names = new Map(product.supplements.map((s) => [s.supplement.id, s.supplement.name]));
    return [
      {
        productId: line.productId,
        quantity: line.quantity,
        cooking: line.cooking,
        supplementIds: line.supplementIds,
        name: product.name,
        imageUrl: product.imageUrl,
        supplementNames: line.supplementIds.flatMap((id) => (names.has(id) ? [names.get(id)!] : [])),
      },
    ];
  });
}
