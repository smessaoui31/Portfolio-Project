import { currentEdition, pastEditions, type EditionLike } from "@/domain/editions";
import type { OptionSlot } from "@/domain/options";
import { unitPriceCents, type PricedProduct } from "@/domain/pricing";
import type { Prisma } from "@/generated/prisma/client";
import type { SupplementFamily } from "@/generated/prisma/enums";
import { prisma } from "@/lib/db";
import { getSettings } from "./settings";

export interface MenuProduct {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  priceCents: number;
  unitPriceCents: number;
  discountPercent: number;
  isPizza: boolean;
  isMenu: boolean;
  soldOut: boolean;
  supplements: { id: string; name: string; priceCents: number; family: SupplementFamily }[];
  optionSlots: OptionSlot[];
}

export interface MenuCategory {
  id: string;
  name: string;
  isPizza: boolean;
  products: MenuProduct[];
}

const productInclude = {
  category: { select: { isPizza: true, isMenu: true } },
  supplements: { include: { supplement: true }, orderBy: { supplement: { name: "asc" } } },
  optionGroups: {
    orderBy: { position: "asc" },
    include: { group: { include: { options: { where: { isActive: true }, orderBy: { displayOrder: "asc" } } } } },
  },
} satisfies Prisma.ProductInclude;

type ProductRow = Prisma.ProductGetPayload<{ include: typeof productInclude }>;

const activeSupplements = (p: ProductRow) =>
  p.supplements
    .filter((ps) => ps.supplement.isActive)
    .map((ps) => ({
      id: ps.supplement.id,
      name: ps.supplement.name,
      priceCents: ps.overridePriceCents ?? ps.supplement.priceCents,
      family: ps.supplement.family,
    }));

/** Each attachment of a group is a slot; its label replaces the group name when set. */
const optionSlots = (p: ProductRow): OptionSlot[] =>
  p.optionGroups.map((slot) => ({
    id: slot.id,
    label: slot.label ?? slot.group.name,
    minSelect: slot.group.minSelect,
    maxSelect: slot.group.maxSelect,
    options: slot.group.options.map((o) => ({ id: o.id, name: o.name, priceCents: o.priceCents })),
  }));

function toMenuProduct(p: ProductRow): MenuProduct {
  return {
    id: p.id,
    name: p.name,
    description: p.description,
    imageUrl: p.imageUrl,
    priceCents: p.priceCents,
    unitPriceCents: unitPriceCents(p),
    discountPercent: p.discountPercent,
    isPizza: p.category?.isPizza ?? false,
    isMenu: p.category?.isMenu ?? false,
    soldOut: p.stockQuantity === 0,
    supplements: activeSupplements(p),
    optionSlots: optionSlots(p),
  };
}

async function loadEditions() {
  return prisma.edition.findMany({ include: { product: { include: productInclude } }, orderBy: { number: "desc" } });
}

export async function getCurrentEditionRef(now: Date): Promise<{ id: string; productId: string } | null> {
  const editions = await prisma.edition.findMany({ select: { id: true, number: true, startsAt: true, endsAt: true, productId: true } });
  const current = currentEdition(editions, now);
  return current ? { id: current.id, productId: current.productId } : null;
}

export async function getCurrentEditionProductId(now: Date): Promise<string | null> {
  return (await getCurrentEditionRef(now))?.productId ?? null;
}

export async function getMenu(now: Date): Promise<MenuCategory[]> {
  const [categories, editionProductId] = await Promise.all([
    prisma.category.findMany({
      orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
      include: { products: { where: { isAvailable: true }, include: productInclude, orderBy: { createdAt: "asc" } } },
    }),
    getCurrentEditionProductId(now),
  ]);
  return categories
    .map((c) => ({
      id: c.id,
      name: c.name,
      isPizza: c.isPizza,
      products: c.products
        .filter((p) => !p.isEditionOnly || p.id === editionProductId)
        .sort((a, b) => Number(b.id === editionProductId) - Number(a.id === editionProductId))
        .map(toMenuProduct),
    }))
    .filter((c) => c.products.length > 0);
}

export async function getPricedProducts(ids: string[]): Promise<Map<string, PricedProduct>> {
  const rows = await prisma.product.findMany({ where: { id: { in: [...new Set(ids)] } }, include: productInclude });
  return new Map(
    rows.map((p) => [
      p.id,
      {
        id: p.id,
        name: p.name,
        priceCents: p.priceCents,
        discountPercent: p.discountPercent,
        isPizza: p.category?.isPizza ?? false,
        isMenu: p.category?.isMenu ?? false,
        isAvailable: p.isAvailable,
        stockQuantity: p.stockQuantity,
        isEditionOnly: p.isEditionOnly,
        allowedSupplements: activeSupplements(p),
        optionSlots: optionSlots(p),
      },
    ]),
  );
}

export interface HomeEdition extends EditionLike {
  brothersNote: string;
  product: MenuProduct;
}

export interface HomeData {
  edition: HomeEdition | null;
  featured: MenuProduct | null;
  past: { id: string; number: number; name: string; imageUrl: string | null }[];
  preview: MenuProduct[];
  /** The next edition, without its name: only its number and when it starts. */
  next: { number: number; startsAt: string } | null;
}

export async function getHomeData(now: Date): Promise<HomeData> {
  const [editions, settings, pizzas] = await Promise.all([
    loadEditions(),
    getSettings(),
    prisma.product.findMany({
      where: { isAvailable: true, isEditionOnly: false, category: { isPizza: true } },
      include: productInclude,
      orderBy: { createdAt: "asc" },
    }),
  ]);

  const nextEdition =
    editions.filter((e) => e.startsAt > now).sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime())[0] ?? null;
  const current = currentEdition(editions, now);
  const featuredRow =
    (settings.featuredProductId && pizzas.find((p) => p.id === settings.featuredProductId)) || pizzas[0] || null;

  return {
    edition: current
      ? {
          id: current.id,
          number: current.number,
          startsAt: current.startsAt,
          endsAt: current.endsAt,
          brothersNote: current.brothersNote,
          product: toMenuProduct(current.product),
        }
      : null,
    featured: featuredRow ? toMenuProduct(featuredRow) : null,
    past: pastEditions(editions, now).map((e) => ({
      id: e.id,
      number: e.number,
      name: e.product.name,
      imageUrl: e.product.imageUrl,
    })),
    preview: pizzas.slice(0, 3).map(toMenuProduct),
    next: nextEdition ? { number: nextEdition.number, startsAt: nextEdition.startsAt.toISOString() } : null,
  };
}
