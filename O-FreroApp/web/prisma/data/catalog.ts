// The menu of ofreropizza.com as sold on 2026-11-20 (see docs/superpowers/specs/2026-11-20-migration-carte-design.md, annex A).
// Prices in cents. Read by prisma/seed.ts.

export type SupplementFamily = "CHEESE" | "MEAT" | "FISH" | "VEGETABLE" | "OTHER";

export interface SlotSeed {
  group: string;
  /** Replaces the group name on the product ("Pizza 1"). */
  label?: string;
}

export interface ProductSeed {
  name: string;
  description?: string;
  priceCents: number;
  slots?: SlotSeed[];
}

export interface CategorySeed {
  name: string;
  isPizza: boolean;
  isMenu: boolean;
  products: ProductSeed[];
}

export interface OptionGroupSeed {
  name: string;
  minSelect: number;
  maxSelect: number;
  options: { name: string; priceCents: number }[];
}

const SIZE: SlotSeed = { group: "Taille" };
const pizza = (name: string, description: string, priceCents: number, extra: SlotSeed[] = []): ProductSeed => ({
  name,
  description,
  priceCents,
  slots: [SIZE, ...extra],
});

const COLLECTORS: ProductSeed[] = [
  pizza("Margarita", "Sauce tomate, mozzarella, emmental, olives", 900),
  pizza("La Vegan", "Sauce tomate, poivrons, champignons, oignons, tomates, aubergines, olives", 900),
  pizza("Chèvre-miel", "Crème fraîche, mozzarella, emmental, chèvre, miel, olives", 900),
  pizza("Savoyarde", "Crème fraîche, mozzarella, emmental, dés de jambon, reblochon, oignons, pommes de terre, persillade", 900),
  pizza("Cheezy", "Sauce tomate, mozzarella, emmental, provolone, gorgonzola, olives", 900),
  pizza("Napoli", "Sauce tomate, mozzarella, emmental, anchois, olives", 900),
  pizza("Classic'O", "Sauce tomate, mozzarella, emmental, viande hachée, oignons, tomates fraîches, olives", 900),
  pizza("Reine", "Sauce tomate, mozzarella, emmental, jambon, champignons, olives", 900),
];

const BEST_SELLERS: ProductSeed[] = [
  pizza("La Kebab", "Crème fraîche, mozzarella, emmental, oignons, pommes de terre, tomates, kebab, persil", 1000, [{ group: "Sauce kebab" }]),
  pizza("Alaska", "Crème fraîche, mozzarella, emmental, saumon, persillade", 1000),
  pizza("Curry", "Crème fraîche, mozzarella, emmental, poulet curry, oignons, poivrons, olives", 1000),
  pizza("Croq Chicken", "Crème fraîche, mozzarella, emmental, poulet fumé, oignons, pommes de terre, fromage croq, persillade", 1000),
  pizza("Végétarienne", "Sauce tomate, mozzarella, emmental, poivrons, champignons, oignons, tomates, aubergines, olives", 1000),
  pizza("Méditerranéenne", "Sauce tomate, mozzarella, emmental, thon, poivrons, oignons, œuf", 1000),
  pizza("Hot spicy", "Sauce tomate, mozzarella, emmental, poulet spicy, poivrons, oignons, olives", 1000),
  pizza("Oriental", "Sauce tomate, mozzarella, emmental, merguez, oignons, poivrons, olives", 1000),
];

const PRESTIGES: ProductSeed[] = [
  pizza("O'Frero", "Crème fraîche, mozzarella, emmental, jambon, viande hachée, oignons, pommes de terre, cheddar, œuf, persil", 1200),
  pizza("Chicken mix", "Crème fraîche, mozzarella, emmental, poulet curry, poulet spicy, oignons, poivrons, cheddar, olives", 1200),
  pizza("Duchesse", "Crème fraîche, mozzarella, emmental, magret de canard, oignons, champignons, persillade", 1200),
  pizza("Marina", "Sauce tomate, mozzarella, emmental, thon, saumon, crevettes, moules, persillade", 1200),
];

const CALZONES: ProductSeed[] = [
  pizza("Garlic Gratinée", "Crème fraîche, poulet boursin, mozzarella, emmental, oignons, pommes de terre, champignons", 1000),
  pizza("V.I.P", "Crème fraîche, mozzarella, emmental, jambon, viande hachée, oignons, pommes de terre, Vache qui rit", 1000),
  pizza("Suprêm'", "Crème fraîche, mozzarella, emmental, jambon, chèvre, champignons, persillade", 1000),
  pizza("Burger", "Sauce tomate, mozzarella, emmental, viande hachée, oignons, champignons, cheddar", 1000),
  pizza("Xtrem'", "Sauce tomate, mozzarella, emmental, thon, olives vertes, poivrons, champignons, oignons", 1000),
];

export const CATEGORIES: CategorySeed[] = [
  { name: "Collectors", isPizza: true, isMenu: false, products: COLLECTORS },
  { name: "Best-sellers", isPizza: true, isMenu: false, products: BEST_SELLERS },
  { name: "Prestiges", isPizza: true, isMenu: false, products: PRESTIGES },
  { name: "Calzones", isPizza: true, isMenu: false, products: CALZONES },
  {
    name: "Pizzaninis",
    isPizza: true,
    isMenu: false,
    products: [
      { name: "Le 4 fromages", description: "Crème fraîche, mozzarella, emmental, chèvre, provolone", priceCents: 790 },
      { name: "Le Tikka", description: "Crème fraîche, mozzarella, emmental, poulet curry, oignons, poivrons, olives vertes", priceCents: 790 },
      { name: "Le Parmentier", description: "Crème fraîche, mozzarella, emmental, viande hachée, pommes de terre, oignons, persillade", priceCents: 790 },
      { name: "Le Rustik", description: "Crème fraîche, mozzarella, emmental, poulet fumé, oignons, champignons, pommes de terre", priceCents: 790 },
      {
        name: "L'Istanbul",
        description: "Crème fraîche, mozzarella, emmental, kebab, pomme de terre, oignons, tomates",
        priceCents: 790,
        slots: [{ group: "Sauce kebab" }],
      },
      { name: "Le Royal", description: "Sauce tomate, mozzarella, emmental, jambon, champignons, Vache qui rit", priceCents: 790 },
    ],
  },
  {
    name: "Menus",
    isPizza: false,
    isMenu: true,
    products: [
      {
        name: "Menu Solo",
        description: "1 pizza au choix, 1 boisson 33 cl, 1 dessert",
        priceCents: 1750,
        slots: [{ group: "Pizza au choix" }, { group: "Cuisson" }, { group: "Boisson du menu Solo" }, { group: "Dessert du menu Solo" }],
      },
      {
        name: "Menu Tribu",
        description: "2 pizzas au choix, 1 bouteille 1,5 L",
        priceCents: 2790,
        slots: [
          { group: "Pizza au choix", label: "Pizza 1" },
          { group: "Pizza au choix", label: "Pizza 2" },
          { group: "Cuisson" },
          { group: "Bouteille du menu" },
        ],
      },
      {
        name: "Menu Maxi",
        description: "3 pizzas au choix, 1 bouteille 1,5 L",
        priceCents: 3890,
        slots: [
          { group: "Pizza au choix", label: "Pizza 1" },
          { group: "Pizza au choix", label: "Pizza 2" },
          { group: "Pizza au choix", label: "Pizza 3" },
          { group: "Cuisson" },
          { group: "Bouteille du menu" },
        ],
      },
      {
        name: "The Box",
        description: "1 pizza Margarita Médium, 4 onion rings, 3 nuggets, 1 sauce au choix",
        priceCents: 990,
        slots: [{ group: "Sauce tex-mex" }],
      },
    ],
  },
  {
    name: "Tex-mex",
    isPizza: false,
    isMenu: false,
    products: [
      { name: "Onion rings x6", description: "Sauce au choix", priceCents: 300, slots: [{ group: "Sauce tex-mex" }] },
      { name: "Nuggets x6", description: "Sauce au choix", priceCents: 400, slots: [{ group: "Sauce tex-mex" }] },
      { name: "Wings x5", description: "Sauce au choix", priceCents: 490, slots: [{ group: "Sauce tex-mex" }] },
    ],
  },
  {
    name: "Desserts",
    isPizza: false,
    isMenu: false,
    products: [
      { name: "Häagen-Dazs 100 ml", priceCents: 330, slots: [{ group: "Parfum Häagen-Dazs" }] },
      { name: "Häagen-Dazs Macadamia 500 ml", priceCents: 730 },
      { name: "Maxi muffin banoffee", priceCents: 330 },
      { name: "Sundae fruits rouges", priceCents: 360 },
      { name: "Brownie crémeux noisette", priceCents: 330 },
      { name: "Maxi muffin choco beurre de cacahuète", priceCents: 330 },
    ],
  },
  {
    name: "Boissons",
    isPizza: false,
    isMenu: false,
    products: [
      { name: "Boisson 33 cl", description: "Canette", priceCents: 150, slots: [{ group: "Canette 33 cl" }] },
      { name: "Bouteille 1,5 L", priceCents: 300, slots: [{ group: "Bouteille 1,5 L" }] },
      { name: "Eau 50 cl", priceCents: 100, slots: [{ group: "Eau 50 cl" }] },
    ],
  },
];

const names = (list: string[], priceCents = 0) => list.map((name) => ({ name, priceCents }));
const single = (name: string, options: { name: string; priceCents: number }[]): OptionGroupSeed => ({ name, minSelect: 1, maxSelect: 1, options });

export const OPTION_GROUPS: OptionGroupSeed[] = [
  single("Taille", [
    { name: "Médium 26 cm", priceCents: 0 },
    { name: "Large 33 cm", priceCents: 200 },
  ]),
  single("Sauce kebab", names(["Algérienne", "Pita"])),
  single("Sauce tex-mex", names(["Algérienne", "Barbecue", "Blanche"])),
  single("Cuisson", names(["Normale", "Bien cuite", "Pas trop cuite"])),
  single("Pizza au choix", [
    { name: "Pizza du moment", priceCents: 100 },
    ...COLLECTORS.map((p) => ({ name: p.name, priceCents: 0 })),
    ...BEST_SELLERS.map((p) => ({ name: p.name, priceCents: 100 })),
    ...PRESTIGES.map((p) => ({ name: p.name, priceCents: 300 })),
    ...CALZONES.map((p) => ({ name: p.name, priceCents: 100 })),
  ]),
  single(
    "Boisson du menu Solo",
    names([
      "Fanta orange",
      "Coca",
      "Coca zéro",
      "Oasis tropical",
      "Oasis pomme-cassis-framboise",
      "Ice tea pêche",
      "7up mojito",
      "Fanta citron",
      "Coca cherry",
      "Eau",
      "Eau pétillante",
    ]),
  ),
  single(
    "Dessert du menu Solo",
    names(["Brownie crémeux noisette", "Maxi muffin choco beurre de cacahuète", "Sundae fruits rouges", "Maxi muffin banoffee"]),
  ),
  single("Bouteille du menu", names(["Pepsi", "Cristaline tropical", "7up", "Eau pétillante"])),
  single("Parfum Häagen-Dazs", names(["Dulce de leche", "Macadamia"])),
  single(
    "Canette 33 cl",
    names([
      "Oasis tropical",
      "Oasis pomme-cassis-framboise",
      "Ice tea pêche",
      "Fanta citron",
      "Fanta orange",
      "Coca cherry",
      "Coca zéro",
      "Coca",
      "7up mojito",
    ]),
  ),
  single("Bouteille 1,5 L", names(["Pepsi", "Cristaline pêche", "7up", "Eau pétillante"])),
  single("Eau 50 cl", names(["Eau plate", "Eau pétillante"])),
];

const family = (f: SupplementFamily, list: [string, number][]) => list.map(([name, priceCents]) => ({ name, priceCents, family: f }));

export const SUPPLEMENTS: { name: string; priceCents: number; family: SupplementFamily }[] = [
  ...family(
    "CHEESE",
    ["Emmental et mozzarella", "Chèvre", "Provolone", "Gorgonzola", "Vache qui rit", "Fromage croq", "Cheddar"].map((n) => [n, 150]),
  ),
  ...family("MEAT", [
    ["Viande hachée", 190],
    ["Merguez", 190],
    ["Poulet curry", 190],
    ["Poulet spicy (mexicain)", 190],
    ["Dés de jambon", 190],
    ["Poulet fumé", 190],
    ["Jambon de dinde", 190],
    ["Magret de canard", 290],
  ]),
  ...family("FISH", [
    ["Moules", 190],
    ["Crevettes", 190],
    ["Thon", 190],
    ["Anchois", 190],
    ["Saumon", 250],
  ]),
  ...family(
    "VEGETABLE",
    ["Champignons", "Oignons", "Poivrons", "Pommes de terre", "Tomates", "Aubergines", "Olives noires"].map((n) => [n, 90]),
  ),
  ...family("OTHER", [
    ["Miel", 50],
    ["Persil", 20],
    ["Persillade", 20],
    ["Œuf", 150],
  ]),
];

/** Pizza du moment: shown in the Best-sellers, as on the current site. */
export const EDITION = {
  number: 1,
  category: "Best-sellers",
  product: pizza(
    "La pizza de mémé",
    "Crème fraîche et quatre fromages AOP : tomme de Cantal, saint-nectaire, fourme d'Ambert, bleu d'Auvergne",
    1000,
  ),
  start: "2026-11-01",
  end: "2026-12-31",
  note: "Quatre fromages AOP, fraîchement sélectionnés et testés par nous pendant un mois.",
};

export const HOURS = [
  ...[1, 2, 3, 4, 5].map((weekday) => ({ weekday, opensAt: "18:00", closesAt: "22:00" })),
  ...[6, 7].flatMap((weekday) => [
    { weekday, opensAt: "12:00", closesAt: "13:30" },
    { weekday, opensAt: "18:00", closesAt: "22:00" },
  ]),
];

export const ZONE = {
  name: "Toulouse",
  postalCodes: ["31000", "31100", "31300", "31400"],
  feeCents: 300,
  minOrderCents: 1400,
  isActive: true,
};
