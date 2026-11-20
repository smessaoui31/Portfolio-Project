# Migration de la carte Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reprendre la carte de ofreropizza.com dans la nouvelle app, avec des groupes de choix réutilisables, les nouvelles règles de fidélité et de livraison, et La pizza de mémé comme édition en cours.

**Architecture:**
- La validation et le prix des choix vivent dans le domaine pur (`src/domain/options.ts`, `pricing.ts`).
- Le serveur charge les « emplacements » de choix d'un produit (un rattachement produit-groupe = un emplacement), revalide tout à la commande et fige un instantané des choix dans `OrderItemChoice`.
- La carte réelle est un fichier de données lu par le seed.

**Tech Stack:** Next.js 16, React 19, Prisma 7 (`prisma-client`, Postgres), Zod 4, Zustand 5, Vitest 5, Playwright 1.65.

**Spec:** `docs/superpowers/specs/2026-11-20-migration-carte-design.md` (annexe A = la carte de référence)

Toutes les commandes se lancent depuis `O-FreroApp/web` avec `export PATH=/Users/sofian/.local/node/bin:$PATH`, avec la base locale sur le port 5433 (`npm run db:local`).

## Global Constraints

- Aucun emoji nulle part (code, commentaires, commits).
- Textes de l'interface en français, avec tutoiement, comme l'existant.
- Le serveur recalcule toujours les prix. Un prix venu du client n'est jamais cru.
- Ne jamais lancer `prisma migrate reset` (garde-fou IA de Prisma) : créer les migrations avec `npx prisma migrate dev --create-only`, les appliquer avec `npx prisma migrate deploy`.
- **Cuisson :**
  - valeurs `WELL_DONE` « Bien cuite », `NORMAL` « Normale » (par défaut), `LIGHTLY_COOKED` « Pas trop cuite », dans cet ordre ;
  - `EXTRA_CRISPY` est renommée, pas recréée.
- **Affichage d'un choix :** `${label} : ${name}`, par exemple « Taille : Large 33 cm ».
- **Livraison :** zone « Toulouse » avec les codes 31000, 31100, 31300 et 31400, frais de 300 centimes, minimum de 1400 centimes.
- **Fidélité :**
  - Le tampon est au maximum 1 par commande, uniquement à emporter, uniquement si la commande contient au moins un article pizza ou menu et n'utilise pas la pizza offerte.
  - La pizza offerte est réservée au retrait. Elle vaut le prix de base remisé plus les options d'une unité, sans les suppléments.
- **Remise :** elle s'applique au prix de base seulement.
- **Présélection :** un groupe obligatoire à choix unique (min = max = 1) dont la première option active coûte 0 est présélectionné sur cette option. Les autres groupes ne le sont pas.
- **Mention bouteille, texte exact :** « 3 pizzas Large à emporter : une bouteille 1,5 L offerte. »
- **Mot des frères de l'édition N°01, texte exact :** « Quatre fromages AOP, fraîchement sélectionnés et testés par nous pendant un mois. »

## Review Focus

1. **Panier enregistré ou recommande** avec un emplacement retiré du produit ou une option désactivée depuis : la ligne est refusée proprement, sans plantage (test en Task 4, `reorderLines`).
2. **Pizza offerte demandée en livraison**, par un client qui change de mode après l'avoir cochée : le serveur refuse avec un message clair (test en Task 4), et l'interface décoche la pizza offerte (Task 5, Step 2).
3. **Deux lignes identiques sauf l'ordre des choix envoyés** : elles fusionnent en une seule ligne (test en Task 2, `lineKey`).
4. **Ancien panier dans le stockage du navigateur**, avec des produits de démonstration et sans `choices` : il est ignoré, sans plantage (Task 5, nom de stockage changé).
5. **Option envoyée deux fois dans le même emplacement** à choix multiple : elle est comptée une seule fois, et n'est payée qu'une fois (test en Task 2).

---

### Task 1: Schéma, migrations et fixtures

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/<horodatage>_options_and_menu/migration.sql` (généré avec `--create-only`, puis édité pour la cuisson)
- Modify: `src/domain/types.ts`, `src/app/actions/cart.ts:17`, `src/server/orders.ts:26`, `src/server/cart.ts:9` (enum cuisson)
- Modify: `src/server/test/db.ts` (liste `TABLES`), `e2e/reset-db.ts` (même liste si elle existe là)
- Modify: `src/server/test/fixtures.ts`
- Test: `src/server/test/fixtures.test.ts` (nouveau)

**Interfaces:**
- **Produces, schéma :**
  - `enum Cooking { NORMAL WELL_DONE LIGHTLY_COOKED }` ;
  - `enum SupplementFamily { CHEESE MEAT FISH VEGETABLE OTHER }` et `Supplement.family SupplementFamily @default(OTHER)` ;
  - `Category.isMenu Boolean @default(false)` et `OrderItem.isMenu Boolean @default(false)` ;
  - `OrderItem.choicesTotalCents Int @default(0)` ;
  - `Settings.deliveryCutoffMinutes Int @default(30)`.
- **Produces, nouveaux modèles :**
  - `OptionGroup { id, name @unique, minSelect Int @default(1), maxSelect Int @default(1), options OptionChoice[], attachments ProductOptionGroup[], createdAt, updatedAt }`.
  - `OptionChoice { id, groupId, name, priceCents Int @default(0), displayOrder Int @default(0), isActive Boolean @default(true), @@unique([groupId, name]) }`. La relation est en Cascade.
  - `ProductOptionGroup { id, productId, groupId, label String?, position Int @default(0), @@index([productId]) }`. Relation Cascade vers le produit, Restrict vers le groupe.
  - `OrderItemChoice { id, orderItemId, slotId String?, optionId String?, label String, name String, unitPriceCents Int }`. Relation Cascade vers `OrderItem`, et `slotId`/`optionId` sans clé étrangère.
- **Produces, code :**
  - `type Cooking = "NORMAL" | "WELL_DONE" | "LIGHTLY_COOKED"` ;
  - `COOKING_LABELS`, avec ses clés dans l'ordre WELL_DONE, NORMAL, LIGHTLY_COOKED.
- **Produces, fixtures :**
  - `makeOptionGroup(o: { name?: string; minSelect?: number; maxSelect?: number; options?: { name: string; priceCents?: number; isActive?: boolean }[] })`, qui renvoie le groupe avec `options` triées ;
  - `attachGroup(productId: string, groupId: string, o?: { label?: string; position?: number })`, qui renvoie le `ProductOptionGroup` ;
  - `makeCategory`, qui accepte `isMenu?: boolean` ;
  - `makeSupplement`, qui accepte `family?`.

- [ ] **Step 1: Write the failing test** `src/server/test/fixtures.test.ts`

```ts
test("an option group attaches twice to one product with labels", async () => {
  const group = await makeOptionGroup({ name: "Pizza au choix", options: [{ name: "Reine" }, { name: "Duchesse", priceCents: 300 }] });
  const product = await makeProduct({ categoryId: (await makeCategory({ isMenu: true })).id });
  await attachGroup(product.id, group.id, { label: "Pizza 1", position: 0 });
  await attachGroup(product.id, group.id, { label: "Pizza 2", position: 1 });
  const slots = await prisma.productOptionGroup.findMany({ where: { productId: product.id }, orderBy: { position: "asc" } });
  expect(slots.map((s) => s.label)).toEqual(["Pizza 1", "Pizza 2"]);
  expect(group.options.map((o) => [o.name, o.priceCents])).toEqual([["Reine", 0], ["Duchesse", 300]]);
});
test("cooking keeps the renamed value", async () => {
  expect(Object.keys(COOKING_LABELS)).toEqual(["WELL_DONE", "NORMAL", "LIGHTLY_COOKED"]);
  expect(COOKING_LABELS.LIGHTLY_COOKED).toBe("Pas trop cuite");
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/server/test/fixtures.test.ts`
Expected: FAIL (`makeOptionGroup` absent).

- [ ] **Step 3: Edit the schema and create the migration**

Run: `npx prisma migrate dev --create-only --name options_and_menu`
- Dans le SQL généré, remplace tout ce qui recrée l'enum `Cooking` par `ALTER TYPE "Cooking" RENAME VALUE 'EXTRA_CRISPY' TO 'LIGHTLY_COOKED';`.
- Puis lance `npx prisma migrate deploy && npx prisma generate`.
- Pour la base de tests, `vitest` lance déjà `migrate deploy` dans son `globalSetup`.

- [ ] **Step 4: Update the cooking enum everywhere and add the fixtures**

- Remplace `EXTRA_CRISPY` dans les trois schémas zod et dans `types.ts`.
- Ajoute les nouvelles tables à `TABLES` : `OrderItemChoice` avant `OrderItem`, et `ProductOptionGroup`, `OptionChoice`, `OptionGroup` avant `Product`.

- [ ] **Step 5: Run tests and typecheck**

Run: `npx vitest run src/server/test/fixtures.test.ts && npm run typecheck`
Expected: PASS, aucune erreur de type.

- [ ] **Step 6: Commit**

```bash
git add prisma src/domain/types.ts src/app/actions/cart.ts src/server/orders.ts src/server/cart.ts src/server/test e2e/reset-db.ts
git commit -m "feat(db): add option groups, menu flag, supplement families and rename cooking"
```

### Task 2: Domaine, choix et prix

**Files:**
- Create: `src/domain/options.ts`, `src/domain/options.test.ts`
- Modify: `src/domain/types.ts` (`CartLineInput`), `src/domain/cart.ts`, `src/domain/pricing.ts`
- Test: `src/domain/pricing.test.ts`, `src/domain/cart.test.ts`

**Interfaces:**
- **Produces (`options.ts`) :**
  - `interface OptionSlot { id: string; label: string; minSelect: number; maxSelect: number; options: { id: string; name: string; priceCents: number }[] }`. Les options sont actives et ordonnées.
  - `interface LineChoice { slotId: string; optionId: string }`
  - `interface PricedChoice { slotId: string; optionId: string; label: string; name: string; unitPriceCents: number }`
  - `resolveChoices(slots: OptionSlot[], choices: LineChoice[]): { ok: true; choices: PricedChoice[] } | { ok: false; code: "OPTION_NOT_ALLOWED" | "OPTIONS_INCOMPLETE" }`.
    - Il dédoublonne les paires.
    - Un emplacement ou une option inconnus donnent OPTION_NOT_ALLOWED.
    - Un nombre de choix hors de [min, max] donne OPTIONS_INCOMPLETE.
    - Le résultat est trié dans l'ordre des emplacements, puis des options.
  - `defaultChoices(slots: OptionSlot[]): LineChoice[]`, selon la règle de présélection des contraintes globales.
  - `choiceText(c: { label: string; name: string }): string`
- **Produces (types et panier) :**
  - `CartLineInput` gagne `choices: LineChoice[]`.
  - `lineKey` inclut les paires `slotId:optionId` triées.
- **Produces (`pricing.ts`) :**
  - `PricedProduct` gagne `isMenu: boolean` et `optionSlots: OptionSlot[]`.
  - `PricedLine` gagne `choices: PricedChoice[]`, `choicesTotalCents` (options d'une unité × quantité) et `isMenu: boolean`.
  - `lineTotalCents = (unit + options/unité + suppléments/unité) × quantité`.
  - `rewardCents = unitPriceCents + options d'une unité de la ligne offerte`.
  - `CartErrorCode` gagne `"OPTION_NOT_ALLOWED" | "OPTIONS_INCOMPLETE"`, levés avec le nom du produit.

- [ ] **Step 1: Write the failing tests**

```ts
// options.test.ts
const size: OptionSlot = { id: "s1", label: "Taille", minSelect: 1, maxSelect: 1, options: [{ id: "m", name: "Médium 26 cm", priceCents: 0 }, { id: "l", name: "Large 33 cm", priceCents: 200 }] };
const pizza: OptionSlot = { id: "p1", label: "Pizza 1", minSelect: 1, maxSelect: 1, options: [{ id: "moment", name: "Pizza du moment", priceCents: 100 }, { id: "reine", name: "Reine", priceCents: 0 }] };
const extras: OptionSlot = { id: "x", label: "Extras", minSelect: 0, maxSelect: 3, options: [{ id: "a", name: "A", priceCents: 50 }] };
test("resolves and prices a valid choice", () => {
  expect(resolveChoices([size], [{ slotId: "s1", optionId: "l" }])).toEqual({ ok: true, choices: [{ slotId: "s1", optionId: "l", label: "Taille", name: "Large 33 cm", unitPriceCents: 200 }] });
});
test("a required slot left empty is incomplete", () => {
  expect(resolveChoices([size], [])).toEqual({ ok: false, code: "OPTIONS_INCOMPLETE" });
});
test("an unknown option or slot is not allowed", () => {
  expect(resolveChoices([size], [{ slotId: "s1", optionId: "zz" }])).toEqual({ ok: false, code: "OPTION_NOT_ALLOWED" });
  expect(resolveChoices([size], [{ slotId: "other", optionId: "l" }])).toEqual({ ok: false, code: "OPTION_NOT_ALLOWED" });
});
test("two options in a single-choice slot is incomplete", () => {
  expect(resolveChoices([size], [{ slotId: "s1", optionId: "m" }, { slotId: "s1", optionId: "l" }])).toEqual({ ok: false, code: "OPTIONS_INCOMPLETE" });
});
test("a duplicated pair counts once", () => {
  const r = resolveChoices([extras], [{ slotId: "x", optionId: "a" }, { slotId: "x", optionId: "a" }]);
  expect(r.ok && r.choices).toHaveLength(1);
});
test("preselects only a free first option of a required single choice", () => {
  expect(defaultChoices([size, pizza, extras])).toEqual([{ slotId: "s1", optionId: "m" }]);
});
// pricing.test.ts (adapt makePriced helper: optionSlots: [size], isMenu: false)
test("options add to the unit price and the free pizza covers them", () => {
  const cart = priceCart([{ productId: "reine", quantity: 2, cooking: "NORMAL", supplementIds: ["chevre"], choices: [{ slotId: "s1", optionId: "l" }] }], products, { rewardLineIndex: 0 });
  expect(cart.lines[0]).toMatchObject({ unitPriceCents: 900, choicesTotalCents: 400, supplementsTotalCents: 300, lineTotalCents: 2600 });
  expect(cart.rewardCents).toBe(1100);
});
test("missing size is refused with the product name", () => {
  expect(() => priceCart([{ productId: "reine", quantity: 1, cooking: "NORMAL", supplementIds: [], choices: [] }], products)).toThrow(expect.objectContaining({ code: "OPTIONS_INCOMPLETE", productName: "Reine" }));
});
test("a menu cannot be the free pizza", () => {
  expect(() => priceCart([menuLine], products, { rewardLineIndex: 0 })).toThrow(expect.objectContaining({ code: "REWARD_NOT_PIZZA" }));
});
// cart.test.ts
test("line identity ignores the order of choices", () => {
  const a = { productId: "p", quantity: 1, cooking: "NORMAL" as const, supplementIds: [], choices: [{ slotId: "1", optionId: "a" }, { slotId: "2", optionId: "b" }] };
  expect(lineKey(a)).toBe(lineKey({ ...a, choices: [...a.choices].reverse() }));
  expect(lineKey(a)).not.toBe(lineKey({ ...a, choices: [{ slotId: "1", optionId: "a" }] }));
});
```

Dans `pricing.test.ts`, le produit « Reine » est à 900, avec un supplément « chevre » à 150 et l'emplacement `size`. `menuLine` vise un produit `isMenu: true, isPizza: false`.

- [ ] **Step 2: Run to verify they fail**

Run: `npx vitest run src/domain`
Expected: FAIL (`options.ts` absent, `choices` inconnu).

- [ ] **Step 3: Implement** `options.ts`, then the changes in `types.ts`, `cart.ts` and `pricing.ts` described in Interfaces. Mets à jour les tests existants de `pricing.test.ts` et `cart.test.ts` avec `choices: []`.

- [ ] **Step 4: Run tests**

Run: `npx vitest run src/domain`
Expected: PASS.

- [ ] **Step 5: Commit** `git commit -m "feat(domain): price and validate product choices"`

### Task 3: Domaine, fidélité et créneaux de livraison

**Files:**
- Modify: `src/domain/loyalty.ts`, `src/domain/slots.ts`
- Test: `src/domain/loyalty.test.ts`, `src/domain/slots.test.ts`

**Interfaces:**
- **Produces :**
  - `stampsEarned(order: { mode: FulfillmentMode; rewardCents: number; hasPizzaOrMenu: boolean }): 0 | 1`
  - `SlotOptions.lastSlotBeforeCloseMinutes?: number`. Quand il est défini, un créneau t vérifie `t <= fermeture - valeur`. Sinon, `t < fermeture` comme aujourd'hui.

- [ ] **Step 1: Write the failing tests**

```ts
test("one stamp per pickup order, whatever the number of pizzas", () => {
  expect(stampsEarned({ mode: "PICKUP", rewardCents: 0, hasPizzaOrMenu: true })).toBe(1);
});
test("no stamp in delivery, with the free pizza, or without pizza or menu", () => {
  expect(stampsEarned({ mode: "DELIVERY", rewardCents: 0, hasPizzaOrMenu: true })).toBe(0);
  expect(stampsEarned({ mode: "PICKUP", rewardCents: 900, hasPizzaOrMenu: true })).toBe(0);
  expect(stampsEarned({ mode: "PICKUP", rewardCents: 0, hasPizzaOrMenu: false })).toBe(0);
});
// slots.test.ts: windows 18:00-22:00 and 12:00-13:30 on 2026-11-21 (samedi), now = 2026-11-21T10:00:00Z
test("delivery stops 30 minutes before each closing", () => {
  const r = computeSlots({ ...base, leadMinutes: 30, lastSlotBeforeCloseMinutes: 30 })!;
  expect(formatParisTime(r.slots.at(-1)!)).toBe("13:00");
});
test("pickup keeps its slots until closing", () => {
  expect(formatParisTime(computeSlots({ ...base, leadMinutes: 15 })!.slots.at(-1)!)).toBe("13:15");
});
```

Ajoute le même test le soir (`now` à 19:00 Paris) : dernier créneau 21:30 en livraison, 21:45 au retrait.

- [ ] **Step 2: Run to verify they fail**: `npx vitest run src/domain/loyalty.test.ts src/domain/slots.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implement both changes.**
- [ ] **Step 4: Run**: same command. Expected: PASS. Les appelants de `stampsEarned` ne compilent plus : c'est corrigé en Task 4.
- [ ] **Step 5: Commit** `git commit -m "feat(domain): one stamp per pickup order and delivery cutoff"`

### Task 4: Serveur (catalogue, panier, commande, fidélité, recommande)

**Files:**
- Modify: `src/server/catalog.ts`, `src/server/cart.ts`, `src/app/actions/cart.ts`, `src/server/orders.ts`, `src/server/lifecycle.ts`, `src/server/accounts.ts`, `src/server/account-orders.ts`, `src/server/settings.ts`
- Test: `src/server/catalog.test.ts`, `src/server/orders.test.ts`, `src/server/lifecycle.test.ts`, `src/server/account.test.ts`, `src/server/cart.test.ts`

**Interfaces:**
- **Consumes :** Task 2 (`OptionSlot`, `LineChoice`, `PricedLine.choices`, `isMenu`) et Task 3.
- **Produces, catalogue et panier :**
  - `MenuProduct` gagne `isMenu: boolean`, `optionSlots: OptionSlot[]` et `supplements[].family: SupplementFamily`.
  - `getPricedProducts` remplit `isMenu` et `optionSlots`. Les emplacements suivent la position ; les options sont actives et triées par `displayOrder` ; `label` vaut `attachment.label ?? group.name`.
  - `DescribedLine` gagne `choices` et `choiceNames: string[]`, au format `choiceText`.
  - Le schéma de ligne zod partagé gagne `choices: z.array(z.object({ slotId: z.string(), optionId: z.string() })).max(12).default([])`. C'est le cas dans `cart.ts`, `actions/cart.ts` et `orders.ts`.
- **Produces, commande :**
  - `placeOrder` crée `OrderItem.choices` (instantané), `choicesTotalCents` et `isMenu`.
  - Avec la pizza offerte en `mode: "DELIVERY"`, il échoue avec le nouveau code `REWARD_PICKUP_ONLY`, message « La pizza offerte est réservée aux commandes à emporter. ».
  - Messages des nouveaux codes avec nom de produit :
    - OPTION_NOT_ALLOWED : « Un choix n'est pas proposé pour {nom}. » ;
    - OPTIONS_INCOMPLETE : « Il manque un choix pour {nom}. »
- **Produces, fidélité et suivi :**
  - `creditStamps`, `getTracking().stamps` et `attachGuestOrders` utilisent `stampsEarned({ mode, rewardCents, hasPizzaOrMenu: items.some(i => i.isPizza || i.isMenu) })`.
  - `TrackingView.items[]` gagne `choices: string[]`.
- **Produces, créneaux :** `getSlotOptions("DELIVERY")` passe `lastSlotBeforeCloseMinutes: settings.deliveryCutoffMinutes`.
- **Produces, recommande :** `reorderLines` reprend les choix depuis `OrderItemChoice.slotId/optionId`. Si l'un d'eux n'est plus valide, ou si `resolveChoices` échoue, l'article va dans `skipped`.

- [ ] **Step 1: Write the failing tests** (avec les fixtures de la Task 1)

```ts
// orders.test.ts
test("stores the chosen size and charges it", async () => { /* Reine 900 + Taille(Médium 0, Large 200) ; commande 1 × Large */
  const result = await placeOrder(pickupInput({ lines: [{ ...line, choices: [{ slotId: slot.id, optionId: large.id }] }] }), ctx);
  const item = await prisma.orderItem.findFirstOrThrow({ where: { order: { id: result.ok ? result.orderId : "" } }, include: { choices: true } });
  expect(item).toMatchObject({ choicesTotalCents: 200 });
  expect(item.choices).toEqual([expect.objectContaining({ label: "Taille", name: "Large 33 cm", unitPriceCents: 200, slotId: slot.id, optionId: large.id })]);
});
test("refuses an order without the required size", async () => {
  expect(await placeOrder(pickupInput({ lines: [{ ...line, choices: [] }] }), ctx)).toMatchObject({ ok: false, error: "OPTIONS_INCOMPLETE" });
});
test("refuses an inactive option", async () => { /* large désactivée */ expect(...).toMatchObject({ ok: false, error: "OPTION_NOT_ALLOWED" }); });
test("refuses the free pizza in delivery", async () => {
  expect(await placeOrder(deliveryInput({ rewardLineIndex: 0 }), userCtx)).toMatchObject({ ok: false, error: "REWARD_PICKUP_ONLY" });
});
// lifecycle.test.ts
test("a completed pickup order with three pizzas earns one stamp", async () => { /* 3 × pizza, statut COMPLETED */ expect(balance).toBe(1); });
test("a completed delivery order earns no stamp", async () => { expect(balance).toBe(0); });
test("a completed pickup order with only a menu earns one stamp", async () => { expect(balance).toBe(1); });
// account.test.ts
test("attaching two completed guest orders credits two stamps", async () => { expect(result.stampsCredited).toBe(2); });
// catalog.test.ts
test("menu products expose their slots with labels and active options only", async () => {
  expect(menu.optionSlots.map((s) => s.label)).toEqual(["Pizza 1", "Pizza 2"]);
  expect(menu.optionSlots[0].options.map((o) => o.name)).toEqual(["Reine"]); // "Duchesse" désactivée
});
// account-orders (dans account.test.ts)
test("reorder skips a line whose option was deactivated", async () => { expect(result.skipped).toEqual(["Reine"]); expect(result.lines).toEqual([]); });
```

Adapte les assertions existantes qui supposaient « un tampon par pizza ».

- [ ] **Step 2: Run to verify they fail**: `npx vitest run src/server`. Expected: FAIL.
- [ ] **Step 3: Implement** the changes described in Interfaces.
- [ ] **Step 4: Run**: `npx vitest run src/server && npm run typecheck`. Expected: PASS, aucune erreur de type, sauf dans les composants traités en Task 5 et Task 6. Si `typecheck` signale ces composants, passe directement à la Task 5 avant de committer.
- [ ] **Step 5: Commit** `git commit -m "feat(server): validate, store and reorder product choices; new stamp rule"`

### Task 5: Interface client

**Files:**
- Modify:
  - `src/components/menu/ProductSheet.tsx`, `src/components/menu/MenuList.tsx` (ou `src/app/(site)/carte/page.tsx`)
  - `src/components/cart/cart-store.ts`, `src/components/cart/CartSheet.tsx`
  - `src/components/order/DetailsStep.tsx`, `src/components/order/Checkout.tsx`, `src/components/order/TrackingView.tsx`
  - `src/app/actions/account.ts` si besoin
  - `src/lib/site.ts`, `src/components/site/Footer.tsx`, `src/app/(site)/mentions-legales/page.tsx`

**Interfaces:**
- **Consumes :** `MenuProduct.optionSlots`, `defaultChoices`, `resolveChoices`, `choiceText` et `DescribedLine.choiceNames`.
- **Produces :**
  - `CartItem` gagne `choiceNames: string[]`.
  - Le stockage persistant s'appelle `ofrero-cart-v2`, ce qui abandonne les anciens paniers.
  - `SITE` gagne `phone2Display: "09 83 53 05 55"`, `phone2Href: "tel:+33983530555"` et `email: "siteofreropizza@gmail.com"`.

- [ ] **Step 1: Product sheet**
  - **Choix :**
    - État initial : `defaultChoices(product.optionSlots)`.
    - Un emplacement `maxSelect === 1` s'affiche en liste de boutons radio, avec « + prix » quand le prix est > 0.
    - Les autres emplacements s'affichent en cases à cocher, limitées à `maxSelect`.
    - Le titre de section reprend le libellé, suivi de « (obligatoire) » quand `minSelect > 0`.
  - **Suppléments :** ils sont regroupés par famille, dans l'ordre Fromages, Viandes, Poissons, Légumes, Autres, chaque famille avec son titre.
  - **Prix affiché :** base + options + suppléments, × quantité.
  - **Bouton d'ajout :** il est désactivé tant que `resolveChoices` échoue, avec le texte « Fais tes choix ».
  - **Cuisson :** elle reste réservée aux produits `isPizza`.
- [ ] **Step 2: Cart and checkout display**
  - `CartSheet`, `DetailsStep` et `TrackingView` affichent les choix (`choiceNames` ou `item.choices`) entre la cuisson et les suppléments.
  - `Checkout` envoie `choices` dans les lignes.
  - Au passage à `DELIVERY`, `Checkout` remet `rewardLineIndex` à `undefined`.
  - `DetailsStep` n'affiche pas le bloc pizza offerte quand `mode === "DELIVERY"`.
- [ ] **Step 3: Carte and contact**
  - La mention bouteille, avec son texte exact, apparaît au-dessus de la première catégorie pizza de la carte.
  - Le second numéro et l'e-mail apparaissent dans `Footer` et sur la page des mentions légales.
- [ ] **Step 4: Verify**: `npm run lint && npm run typecheck`. Expected: aucune erreur. Le comportement est vérifié par les e2e en Task 8.
- [ ] **Step 5: Commit** `git commit -m "feat(ui): product choices, grouped supplements, pickup-only reward, contact"`

### Task 6: Admin

**Files:**
- Create: `src/server/admin/options.ts`, `src/server/admin/options.test.ts`, `src/app/actions/admin-options.ts`, `src/app/admin/choix/page.tsx`, `src/components/admin/OptionGroupsManager.tsx`
- Modify:
  - `src/components/admin/AdminNav.tsx` (entrée « Choix »)
  - `src/server/admin/catalog.ts` (produit, catégorie, supplément), `src/app/actions/admin-catalog.ts`
  - `src/components/admin/ProductForm.tsx`, `src/app/admin/produits/[id]/page.tsx`
  - `src/components/admin/SupplementsManager.tsx`, `src/components/admin/CategoriesManager.tsx`
  - `src/server/admin/settings.ts` (`loyaltySchema`), `src/components/admin/LoyaltySettingsForm.tsx`
  - `src/server/admin/orders.ts`, `src/app/admin/commandes/[id]/page.tsx`, `src/app/admin/commandes/[id]/ticket/page.tsx`
- Test: `src/server/admin/options.test.ts`, `src/server/admin/catalog.test.ts`, `src/server/admin/settings.test.ts`, `src/app/admin/admin-guard.test.ts` (déjà générique, doit couvrir la nouvelle page)

**Interfaces:**
- **Produces, groupes de choix :**
  - `listOptionGroupsAdmin()` renvoie les groupes, leurs options triées et le nombre de produits rattachés.
  - `upsertOptionGroup(input: { id?: string; name: string; minSelect: number; maxSelect: number; options: { id?: string; name: string; priceCents: number; isActive: boolean }[] }): Promise<Result>`.
    - Validation : `0 <= minSelect <= maxSelect`, `maxSelect >= 1`, au moins une option, noms non vides et uniques dans le groupe.
    - `displayOrder` vaut l'index. Une option absente de la liste est supprimée.
  - `deleteOptionGroup(id): Promise<Done>` renvoie `{ ok: false, message: "Ce groupe est utilisé par N produit(s)." }` quand il est rattaché.
- **Produces, produit :**
  - `productSchema` gagne `optionGroups: { id?: string; groupId: string; label?: string }[]`.
  - `upsertProduct` garde l'`id` des rattachements fournis, supprime les autres, crée les nouveaux, avec `position` = index.
- **Produces, catégorie, supplément et réglages :**
  - `saveCategoryAction` et `upsertCategory` gagnent `isMenu: boolean`.
  - Le supplément gagne `family`.
  - `saveLoyaltySettings` gagne `deliveryCutoffMinutes` (entier de 0 à 120).
- **Produces, commandes :** le détail et le ticket affichent `item.choices` au format `choiceText`.

- [ ] **Step 1: Write the failing tests**

```ts
test("saves a group with ordered options and refuses min above max", async () => {
  expect(await upsertOptionGroup({ name: "Taille", minSelect: 1, maxSelect: 1, options: [{ name: "Médium 26 cm", priceCents: 0, isActive: true }, { name: "Large 33 cm", priceCents: 200, isActive: true }] })).toMatchObject({ ok: true });
  expect((await listOptionGroupsAdmin())[0].options.map((o) => o.name)).toEqual(["Médium 26 cm", "Large 33 cm"]);
  expect(await upsertOptionGroup({ name: "X", minSelect: 2, maxSelect: 1, options: [{ name: "a", priceCents: 0, isActive: true }] })).toMatchObject({ ok: false });
});
test("refuses to delete a group still attached", async () => {
  expect(await deleteOptionGroup(group.id)).toMatchObject({ ok: false, message: "Ce groupe est utilisé par 1 produit(s)." });
});
test("saving a product keeps existing slot ids", async () => {
  await upsertProduct({ ...input, optionGroups: [{ id: slot.id, groupId: group.id, label: "Pizza 1" }, { groupId: group.id, label: "Pizza 2" }] });
  const slots = await prisma.productOptionGroup.findMany({ where: { productId }, orderBy: { position: "asc" } });
  expect(slots[0].id).toBe(slot.id);
  expect(slots.map((s) => s.label)).toEqual(["Pizza 1", "Pizza 2"]);
});
test("saves the delivery cutoff", async () => { /* deliveryCutoffMinutes: 45 */ });
```

- [ ] **Step 2: Run to verify they fail**: `npx vitest run src/server/admin`. Expected: FAIL.
- [ ] **Step 3: Implement the server functions and actions.** Chaque action appelle `requireAdmin()`, comme dans `admin-catalog.ts`.
- [ ] **Step 4: Build the UI**
  - La page « Choix » s'inspire de `SupplementsManager` : liste des groupes ; édition du nom, du min et du max et des options (nom, prix en euros avec `parseEuros`, actif) ; ajout, retrait et ordre par boutons haut et bas.
  - `ProductForm` reçoit une liste ordonnée de rattachements (sélecteur de groupe, libellé facultatif, haut, bas, retirer).
  - Le formulaire des suppléments gagne un sélecteur de famille, et les catégories une case « Menu ».
  - Le formulaire de réglages gagne « Fin des livraisons avant la fermeture (min) ».
- [ ] **Step 5: Run**: `npx vitest run src/server/admin src/app/admin && npm run lint && npm run typecheck`. Expected: PASS.
- [ ] **Step 6: Commit** `git commit -m "feat(admin): manage option groups, product slots, menu flag, supplement families"`

### Task 7: E-mail de confirmation

**Files:**
- Modify: `src/emails/templates.ts`, `src/server/notifications.ts`
- Test: `src/emails/templates.test.ts` (créer s'il n'existe pas)

**Interfaces:**
- **Produces :** `orderConfirmationEmail` gagne `items: string[]`.
  - Chaque ligne a la forme `"2 × Reine (Taille : Large 33 cm, + Chèvre)"` ; sans choix ni supplément, `"1 × Coca"`.
  - `notifyOrderReceived` charge les articles avec leurs choix et suppléments.

- [ ] **Step 1: Failing test**

```ts
test("the confirmation lists items with their choices", () => {
  const mail = orderConfirmationEmail({ ...base, items: ["2 × Reine (Taille : Large 33 cm, + Chèvre)"] });
  expect(mail.text).toContain("2 × Reine (Taille : Large 33 cm, + Chèvre)");
  expect(mail.html).toContain("2 × Reine (Taille : Large 33 cm, + Chèvre)");
});
```

- [ ] **Step 2: Run to verify it fails**: `npx vitest run src/emails`. Expected: FAIL.
- [ ] **Step 3: Implement.** Les lignes sont échappées dans le HTML avec `escape`.
- [ ] **Step 4: Run**: same command. Expected: PASS.
- [ ] **Step 5: Commit** `git commit -m "feat(email): list ordered items and choices in the confirmation"`

### Task 8: Carte réelle, seed, base locale et e2e

**Files:**
- Create: `prisma/data/catalog.ts`, `scripts/reseed-local.ts`
- Modify: `prisma/seed.ts`, `src/server/seed.test.ts`, `package.json` (script `db:reseed`)
- Modify: `e2e/*.spec.ts`, `e2e/helpers.ts`

**Interfaces:**
- **Produces (`prisma/data/catalog.ts`), en reprenant l'annexe A du spec à l'identique (noms, prix en centimes, descriptions, ordre) :**
  - `CATEGORIES: { name; displayOrder; isPizza; isMenu; products: { name; description; priceCents; slots: { group: string; label?: string }[] }[] }[]`
  - `OPTION_GROUPS: { name; minSelect; maxSelect; options: { name; priceCents }[] }[]`
  - `SUPPLEMENTS: { name; priceCents; family }[]`
  - `EDITION`, `HOURS`, `ZONE`
- **Particularités du fichier :**
  - Le groupe « Cuisson (menus) » s'appelle « Cuisson », avec l'ordre Normale, Bien cuite, Pas trop cuite.
  - Le groupe « Pizza au choix » liste « Pizza du moment » puis les pizzas dans l'ordre de l'annexe.
  - Les produits sont sans image (`imageUrl: null`).
  - Les suppléments sont reliés à tous les produits des catégories `isPizza` et au produit d'édition.
- **Produces (seed) :**
  - `runSeed(db)` reste idempotent, avec un upsert par nom.
  - Les rattachements d'un produit sont remplacés à chaque passage.
  - Pas d'éditions d'exemple.
  - Admin depuis l'environnement, comme aujourd'hui.
- **Produces (`scripts/reseed-local.ts`) :**
  - Le script refuse si `DATABASE_URL` ne vise pas `localhost` ou `127.0.0.1`, ou si l'argument `--yes` est absent.
  - Il vide toutes les tables (même liste que `src/server/test/db.ts`), puis appelle `runSeed`.
  - Script npm : `"db:reseed": "tsx scripts/reseed-local.ts"`.

- [ ] **Step 1: Failing seed test** (remplace les assertions actuelles)

```ts
test("seed loads the real menu", async () => {
  expect((await prisma.category.findMany({ orderBy: { displayOrder: "asc" } })).map((c) => c.name)).toEqual(["Collectors", "Best-sellers", "Prestiges", "Calzones", "Pizzaninis", "Menus", "Tex-mex", "Desserts", "Boissons"]);
  expect(await prisma.product.count({ where: { isEditionOnly: false } })).toBe(47);
  expect(await prisma.product.findFirstOrThrow({ where: { name: "Reine" } })).toMatchObject({ priceCents: 900 });
  expect(await prisma.product.findFirstOrThrow({ where: { name: "Menu Maxi" } })).toMatchObject({ priceCents: 3890 });
  expect(await prisma.serviceWindow.count()).toBe(9);
  expect(await prisma.deliveryZone.findFirstOrThrow()).toMatchObject({ postalCodes: ["31000", "31100", "31300", "31400"], feeCents: 300, minOrderCents: 1400 });
  const edition = await prisma.edition.findFirstOrThrow({ include: { product: true } });
  expect(edition).toMatchObject({ number: 1, brothersNote: "Quatre fromages AOP, fraîchement sélectionnés et testés par nous pendant un mois." });
  expect(edition.product).toMatchObject({ name: "La pizza de mémé", priceCents: 1000, isEditionOnly: true });
  const maxi = await prisma.productOptionGroup.findMany({ where: { product: { name: "Menu Maxi" } }, orderBy: { position: "asc" } });
  expect(maxi.map((s) => s.label)).toEqual(["Pizza 1", "Pizza 2", "Pizza 3", null, null]);
  expect(await prisma.supplement.count()).toBe(31);
});
test("seed can run twice without duplicating data", async () => {
  await runSeed(prisma);
  expect(await prisma.product.count({ where: { name: "Reine" } })).toBe(1);
  expect(await prisma.optionGroup.count({ where: { name: "Taille" } })).toBe(1);
  expect(await prisma.productOptionGroup.count({ where: { product: { name: "Menu Maxi" } } })).toBe(5);
});
```

47 = 8 + 8 + 4 + 5 + 6 + 4 + 3 + 6 + 3 (hors édition) ; 31 suppléments = 7 + 8 + 5 + 7 + 4. Si ton décompte de l'annexe diffère, corrige le test d'après l'annexe et ledgerise l'écart.

- [ ] **Step 2: Run to verify it fails**: `npx vitest run src/server/seed.test.ts`. Expected: FAIL.
- [ ] **Step 3: Write `prisma/data/catalog.ts` and rewrite `prisma/seed.ts`.**
- [ ] **Step 4: Run**: same command. Expected: PASS.
- [ ] **Step 5: Reseed the local database**
  - Run: `npx prisma migrate deploy && npm run db:reseed -- --yes`.
  - Expected : la sortie confirme le seed. `http://localhost:3000/carte` montre les 9 catégories, et l'accueil montre « La pizza de mémé ».
- [ ] **Step 6: Update the e2e**
  - « Margherita » devient « Margarita », et « Savoyarde d'hiver » devient « La pizza de mémé ».
  - Recalcule les totaux attendus avec les nouveaux prix : Margarita à 9,00 €, livraison à 3,00 €.
  - Ajoute un parcours : ajouter un « Menu Tribu » en choisissant Pizza 1 = Reine et Pizza 2 = Duchesse (+3 €), puis vérifier que le panier affiche « Pizza 2 : Duchesse » et 30,90 €.
- [ ] **Step 7: Full verification**
  - Run: `npm run lint && npm run typecheck && npm test && npm run build && npm run test:e2e`.
  - Expected : tout est vert. Le seul test ignoré est le paiement Stripe réel, comme aujourd'hui.
- [ ] **Step 8: Commit** `git commit -m "feat(seed): load the real ofreropizza.com menu"`
