# O'Frero refonte : plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remplacer le front Next 15 et l'API Express par une seule application Next.js 16 dans `O-FreroApp/web/`. Elle permet de commander sans compte (retrait avec créneau ou livraison par zone), de payer en ligne ou au retrait, d'avoir un compte avec carte à tampons et collection d'éditions, d'afficher une page d'accueil « édition limitée » autour de la pizza du moment, et d'utiliser un admin complet.

**Architecture:** La logique métier pure vit dans `src/domain/` (sans accès base, testée en unitaire). Les services serveur dans `src/server/` utilisent Prisma 7 (adaptateur `pg`) et sont testés en intégration sur une base Postgres de test. Les pages App Router et les Server Actions restent minces et appellent ces services. L'authentification passe par Better Auth (session en cookie) et le paiement par Stripe Payment Element, avec un webhook en Route Handler.

**Tech Stack:** Node 24, Next 16.4.6, React 19.3.1, TypeScript 6.0.3, Tailwind CSS 4.3.5, Prisma 7.10.1 + @prisma/adapter-pg 7.10.1, PostgreSQL 17 (Docker), Better Auth 1.7.25, Stripe 23.1.0 + @stripe/stripe-js 10.3.0 + @stripe/react-stripe-js 7.1.0, Zod 4.6.7, Zustand 5.1.0, @radix-ui/react-dialog 1.3.1, date-fns 4.4.0 + @date-fns/tz 1.5.0, Resend 6.38.1, Motion 14.14.0, Vitest 5.1.0, Playwright 1.65.1, ESLint 9.39.5, tsx 4.23.15, dotenv 18.0.10.

**Spec:** `docs/superpowers/specs/2026-11-16-ofrero-refonte-design.md` (à lire en entier avant de commencer).

## Global Constraints

- Node est dans `/Users/sofian/.local/node/bin`, qui n'est pas dans le PATH par défaut : préfixer chaque commande par `export PATH=/Users/sofian/.local/node/bin:$PATH;`.
- Toutes les commandes `npm` se lancent depuis `O-FreroApp/web/`, sauf mention contraire.
- Les versions sont épinglées exactement comme dans la Tech Stack (sans `^`). Ne pas monter TypeScript en 7, ni ESLint en 10, ni Prisma en 8.
- Le texte visible par l'utilisateur est en français. Le code (identifiants) est en anglais.
- Aucun emoji nulle part : code, contenu, commits.
- Les montants sont des entiers en centimes et s'affichent avec `formatEuros(cents)` (« 14,90 € », avec espace insécable).
- Toutes les heures métier sont calculées dans le fuseau `Europe/Paris` et les dates sont stockées en UTC.
- Dans les pages, actions et routes, l'heure courante vient toujours de `now()` (`@/lib/clock`, tâche 3), jamais de `new Date()`. Les services reçoivent `now` en paramètre.
- Couleurs (tokens CSS dans `globals.css`) : `--bg #0d0a08`, `--fg #f3e9d8`, `--muted #a8998a`, `--muted-2 #cbbfae`, `--surface #1a1410`, `--surface-2 #221a14`, `--line #241c16`, `--line-2 #3a2e25`, `--ember #ff5a1f`. `--ember` est réservé aux actions principales et à l'édition.
- Typographies : Anton (titres d'affiche, en capitales) et Inter (texte), chargées via `next/font/google`.
- Les animations sont coupées sous `prefers-reduced-motion: reduce`. Aucune animation ne retarde l'affichage du bouton « Commander ».
- Les coordonnées du site, affichées partout, viennent de `src/lib/site.ts` : nom « O'Frero Pizza », adresse « 288 rue Henri Desbals, 31100 Toulouse », téléphone « 06 15 80 51 47 », lien `tel:+33615805147`.
- Le prix, la remise et le stock sont toujours recalculés côté serveur. Le serveur ne fait jamais confiance à un prix envoyé par le client.
- Le travail se fait sur la branche `refonte`, avec un commit par tâche. Les messages de commit sont en anglais au format `type: sujet` et se terminent par `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

1. **Commande passée juste avant la fermeture, ou pendant un changement d'heure** : les créneaux basculent sur le service suivant, à la bonne heure de Paris. Testé dans la tâche 3 (`slots across DST`, `21:40 Thursday rolls to Friday`).
2. **Panier falsifié** (supplément non autorisé pour le produit, quantité 0 ou 99, produit d'une édition terminée) : la commande est refusée avec un message clair, et rien n'est créé. Testé dans les tâches 4 et 8.
3. **Webhook Stripe reçu deux fois, ou après une annulation** : aucun double effet (pas de double e-mail, pas de double remise en stock). Testé dans la tâche 9 (`webhook is idempotent`).
4. **Code postal saisi avec des espaces ou au mauvais format** (« 31 100 », « 31100 », « 3110 ») : il est normalisé ou refusé avec le motif INVALID_POSTAL_CODE. Testé dans la tâche 4.
5. **E-mail saisi avec une casse différente entre la commande invitée et le compte** (« Karim@Exemple.fr » puis « karim@exemple.fr ») : les commandes se rattachent quand même. Testé dans la tâche 6.

---

## Structure des fichiers (`O-FreroApp/web/`)

```
docker-compose.yml          Postgres 17 local (bases ofrero et ofrero_test)
.env.example                toutes les variables documentées
prisma.config.ts            config Prisma 7 (schema, migrations, seed, datasource)
prisma/schema.prisma        modèle complet (Better Auth + métier)
prisma/seed.ts              carte, horaires, zone, éditions, réglages, admin
vitest.config.ts            projets "unit" (src/domain) et "integration" (src/server)
playwright.config.ts        e2e sur next start port 3100
e2e/*.spec.ts               parcours de bout en bout
public/images/pizzas/*      images reprises de l'ancien front
public/logo.png             logo repris (ofrero-pizza-logo.png)
src/
  lib/       env.ts, db.ts, auth.ts, auth-client.ts, session.ts, stripe.ts, email.ts, money.ts, time.ts, site.ts
  domain/    types.ts, slots.ts, delivery.ts, pricing.ts, cart.ts, loyalty.ts, editions.ts, order-status.ts (pur, sans I/O)
  server/    catalog.ts, settings.ts, orders.ts, payments.ts, lifecycle.ts, accounts.ts, loyalty.ts, cart.ts, admin/*.ts
  server/test/  db.ts (resetDb), fixtures.ts (constructeurs de données)
  app/       pages publiques, /compte, /admin, /api/auth, /api/stripe/webhook, /api/suivi/[token], /api/admin/orders/latest
  components/ ui/, site/, home/, menu/, cart/, order/, account/, admin/
```

---

### Task 1: Créer l'application et l'outillage

**Files:**
- Create: `O-FreroApp/web/` (via create-next-app), `docker-compose.yml`, `.env.example`, `vitest.config.ts`, `src/lib/env.ts`, `src/lib/site.ts`, `src/lib/money.ts`
- Test: `src/lib/env.test.ts`, `src/lib/money.test.ts`
- Modify: `.gitignore` (racine), en ajoutant `O-FreroApp/web/.env*` sauf `.env.example`, `O-FreroApp/web/test-results/`, `O-FreroApp/web/playwright-report/` et `O-FreroApp/web/src/generated/`

**Interfaces:**
- Produces: `parseEnv(source: Record<string, string | undefined>): Env` et `env: Env` (dans `src/lib/env.ts`). `Env` contient : `DATABASE_URL`, `BETTER_AUTH_SECRET` (au moins 32 caractères), `BETTER_AUTH_URL` (URL), `STRIPE_SECRET_KEY?`, `STRIPE_WEBHOOK_SECRET?`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?`, `RESEND_API_KEY?`, `EMAIL_FROM` (par défaut `"O'Frero <commandes@ofrero.fr>"`), `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME` (par défaut `"Admin O'Frero"`).
- Produces: `formatEuros(cents: number): string` (dans `src/lib/money.ts`).
- Produces: `SITE` (dans `src/lib/site.ts`) avec `name`, `address`, `postalCity`, `phoneDisplay`, `phoneHref`.

- [ ] **Step 1: Créer la branche `refonte` et commiter le spec et le plan**

```bash
git checkout -b refonte
git add docs/superpowers .gitignore
git commit -m "docs: add redesign spec and implementation plan"
```

- [ ] **Step 2: Générer l'application**

Run (depuis `O-FreroApp/`) : `npx -y create-next-app@16.4.6 web --ts --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm --disable-git --no-agent-feedback --yes`
Expected : le dossier `web/` existe et `npm run build` passe sur le gabarit.

- [ ] **Step 3: Épingler les versions et ajouter les dépendances**

Mettre `typescript` à `6.0.3` et `eslint` à `9.39.5` exactement. Installer toutes les versions exactes de la Tech Stack (`-E`), plus `pg@8.23.1`, `@types/pg@8.23.1`, `@types/react@19.3.0` et `@types/react-dom`, en version alignée.
Scripts de `package.json` : `dev`, `build`, `start`, `lint` (`eslint .`), `typecheck` (`tsc --noEmit`), `test` (`vitest run`), `test:unit` (`vitest run --project unit`), `test:int` (`vitest run --project integration`), `test:e2e` (`playwright test`), `db:up` (`docker compose up -d`), `db:migrate` (`prisma migrate dev`), `db:reset` (`prisma migrate reset --force`), `db:seed` (`prisma db seed`), `db:generate` (`prisma generate`), `postinstall` (`prisma generate`).

- [ ] **Step 4: Écrire les tests qui échouent**

```ts
// src/lib/env.test.ts
test("parseEnv rejects a missing DATABASE_URL", () => {
  expect(() => parseEnv({ BETTER_AUTH_SECRET: "x".repeat(32), BETTER_AUTH_URL: "http://localhost:3000", ADMIN_EMAIL: "a@b.fr", ADMIN_PASSWORD: "secret123" })).toThrow(/DATABASE_URL/);
});
test("parseEnv applies EMAIL_FROM default", () => {
  expect(parseEnv(validSource).EMAIL_FROM).toBe("O'Frero <commandes@ofrero.fr>");
});
// src/lib/money.test.ts
test("formatEuros formats cents in French", () => {
  expect(formatEuros(1490)).toBe("14,90 €");
  expect(formatEuros(0)).toBe("0,00 €");
});
```

- [ ] **Step 5: Configurer Vitest avec deux projets, puis vérifier l'échec**

`vitest.config.ts` définit deux projets. Le projet `unit` couvre `src/domain/**/*.test.ts` et `src/lib/**/*.test.ts`. Le projet `integration` couvre `src/server/**/*.test.ts`, s'exécute en séquentiel (`fileParallelism: false`) et lit `.env.test`. L'alias `@/` pointe sur `src/`.
Run : `npm run test:unit`
Expected : FAIL, car `parseEnv` et `formatEuros` ne sont pas définis.

- [ ] **Step 6: Implémenter `env.ts` (schéma Zod, l'erreur nomme les clés manquantes), `money.ts` (`Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" })`) et `site.ts`**

- [ ] **Step 7: Ajouter `docker-compose.yml` et `.env.example`**

Le service `db` utilise l'image `postgres:17`, le port `5432`, l'utilisateur et le mot de passe `ofrero`, la base `ofrero` et un volume nommé. Un script d'init crée en plus la base `ofrero_test`. `.env.example` liste toutes les clés de `Env`, avec un commentaire en français pour chacune. Le dépôt contient aussi un `.env.test.example`, qui pointe sur `ofrero_test` et utilise `BETTER_AUTH_URL=http://localhost:3100`.

- [ ] **Step 8: Vérifier**

Run : `npm run test:unit && npm run lint && npm run typecheck && npm run build`
Expected : tout passe.

- [ ] **Step 9: Commit** (`feat: scaffold Next 16 app with env, money and test tooling`)

---

### Task 2: Schéma de base de données, client Prisma et seed

**Files:**
- Create: `prisma.config.ts`, `prisma/schema.prisma`, `prisma/seed.ts`, `src/lib/db.ts`, `src/server/test/db.ts`, `src/server/test/fixtures.ts`
- Copy: `../ofrero-webfront/public/images/pizzas/*` vers `public/images/pizzas/`, et `../ofrero-webfront/public/ofrero-pizza-logo.png` vers `public/logo.png`
- Test: `src/server/seed.test.ts`

**Interfaces:**
- Produces: `prisma` (dans `src/lib/db.ts`), un singleton `PrismaClient` importé depuis `@/generated/prisma/client` et construit avec `new PrismaPg({ connectionString: env.DATABASE_URL })`. Il est mis en cache sur `globalThis` en développement.
- Produces: `resetDb(): Promise<void>` (TRUNCATE de toutes les tables métier et d'authentification avec CASCADE) et des constructeurs de fixtures : `makeCategory`, `makeProduct`, `makeSupplement`, `makeZone`, `makeHours`, `makeEdition`, `makeUser`, `makeOrder`, tous asynchrones et renvoyant l'enregistrement créé. Leurs signatures :
  - `makeUser(o?: { email?: string; role?: "USER" | "ADMIN"; emailVerified?: boolean; stamps?: number })` : `stamps` crée une entrée EARN rattachée à une commande COMPLETED factice ;
  - `makeOrder(o?: { customerEmail?: string; userId?: string | null; status?: OrderStatus; mode?: FulfillmentMode; paymentMethod?: PaymentMethod; pizzas?: number; editionId?: string; stripePaymentIntentId?: string; totalCents?: number; createdAt?: Date })` : `pizzas` (par défaut 1) crée autant d'unités d'une pizza à 10,50 sur une seule ligne.
- Produces: `runSeed(db: PrismaClient): Promise<void>` (exporté depuis `prisma/seed.ts`, que le script appelle).

- [ ] **Step 1: Écrire `prisma.config.ts`**

Utiliser `defineConfig` de `prisma/config`, avec `import "dotenv/config"`, `schema: "prisma/schema.prisma"`, `migrations: { path: "prisma/migrations", seed: "tsx prisma/seed.ts" }` et `datasource: { url: process.env.DATABASE_URL }`. Ne pas lancer `prisma init`, qui ajoute des fichiers d'agent dans le projet.

- [ ] **Step 2: Écrire `prisma/schema.prisma`**

Générateur : `provider = "prisma-client"`, `output = "../src/generated/prisma"`. Le bloc `datasource db` ne contient que `provider = "postgresql"`.
Pour les modèles Better Auth, lancer `npx -y auth@1.7.25 generate --adapter prisma --dialect postgresql --output prisma/better-auth.prisma` une fois `src/lib/auth.ts` minimal créé (`betterAuth` + `prismaAdapter` + `user.additionalFields.role`), puis reporter les modèles `User`, `Session`, `Account` et `Verification` dans `schema.prisma`. Le modèle `User` a en plus `role Role @default(USER)` ainsi que les relations `orders`, `addresses`, `cart` et `loyaltyEntries`.
Modèles métier (les noms de champ sont fixés, le reste est libre) :
- `Category` : `name @unique`, `description?`, `displayOrder Int`, `isPizza Boolean @default(false)`.
- `Product` : `name`, `description?`, `priceCents Int`, `discountPercent Int @default(0)`, `imageUrl?`, `categoryId?`, `isAvailable Boolean @default(true)`, `stockQuantity Int?`, `isEditionOnly Boolean @default(false)`.
- `Supplement` : `name @unique`, `priceCents`, `isActive`. `ProductSupplement` : clé composée, `overridePriceCents Int?`.
- `Edition` : `number Int @unique`, `productId`, `startsAt DateTime`, `endsAt DateTime` (borne exclusive), `brothersNote String`.
- `DeliveryZone` : `name`, `postalCodes String[]`, `feeCents`, `minOrderCents`, `isActive`.
- `ServiceWindow` : `weekday Int` (1 = lundi, 7 = dimanche), `opensAt String` et `closesAt String` au format "HH:MM".
- `Closure` : `date String @unique` (format "YYYY-MM-DD", jour à Paris) et `reason?`.
- `Settings` : `id Int @id @default(1)`, `featuredProductId?`, `stampsForReward Int @default(10)`, `pickupLeadMinutes Int @default(15)`, `deliveryLeadMinutes Int @default(30)`.
- `Order` : `number Int @unique @default(autoincrement())`, `trackingToken String @unique`, `userId?`, `customerFirstName`, `customerPhone`, `customerEmail` (stocké en minuscules), `mode FulfillmentMode`, `slotAt DateTime`, `paymentMethod PaymentMethod`, `status OrderStatus`, `subtotalCents`, `rewardCents @default(0)`, `deliveryFeeCents @default(0)`, `totalCents`, `addressLine1?`, `addressLine2?`, `postalCode?`, `city?`, `editionId?`, `stripePaymentIntentId String? @unique`, `confirmationSentAt DateTime?`, `createdAt`, `updatedAt`. Les index sont `@@index([customerEmail])` et `@@index([status, slotAt])`.
- `OrderItem` : `productId`, `name`, `unitPriceCents`, `quantity`, `cooking Cooking`, `supplementsTotalCents`, `isPizza Boolean`, `isReward Boolean @default(false)` et la relation `supplements OrderItemSupplement[]` (avec `name` et `unitPriceCents`).
- `OrderLog` : `status`, `message?`, `createdBy?`, `createdAt`.
- `Address` : `userId`, `label?`, `line1`, `line2?`, `postalCode`, `city`, `isDefault`.
- `Cart` : `userId @unique`, `lines Json`, `updatedAt`.
- `LoyaltyEntry` : `userId`, `orderId`, `kind LoyaltyKind` (EARN ou REDEEM), `stamps Int`, `createdAt`, avec `@@unique([orderId, kind])`.
- Enums : `Role` (USER, ADMIN), `FulfillmentMode` (PICKUP, DELIVERY), `PaymentMethod` (ONLINE, AT_PICKUP), `Cooking` (NORMAL, WELL_DONE, EXTRA_CRISPY), `OrderStatus` (PENDING_PAYMENT, RECEIVED, IN_OVEN, READY, OUT_FOR_DELIVERY, COMPLETED, NOT_COLLECTED, CANCELLED, FAILED), `LoyaltyKind`.

- [ ] **Step 3: Générer la première migration**

Run : `npm run db:up && npx prisma migrate dev --name init`
Expected : la migration est créée et le client est généré dans `src/generated/prisma`.

- [ ] **Step 4: Écrire le test du seed qui échoue**

```ts
// src/server/seed.test.ts
test("seed creates the menu, hours, zone, editions and an admin", async () => {
  await resetDb();
  await runSeed(prisma);
  expect(await prisma.category.findFirstOrThrow({ where: { name: "Pizzas" } })).toMatchObject({ isPizza: true });
  expect(await prisma.serviceWindow.count()).toBe(11);
  expect(await prisma.edition.count()).toBe(4);
  const current = await prisma.edition.findUniqueOrThrow({ where: { number: 7 }, include: { product: true } });
  expect(current.product).toMatchObject({ name: "Savoyarde d'hiver", priceCents: 1490, isEditionOnly: true });
  expect(await prisma.user.findFirstOrThrow({ where: { role: "ADMIN" } })).toMatchObject({ emailVerified: true });
  expect(await prisma.settings.findUniqueOrThrow({ where: { id: 1 } })).toMatchObject({ stampsForReward: 10 });
});
```

- [ ] **Step 5: Vérifier l'échec**

Run : `npm run test:int -- seed`
Expected : FAIL, car `runSeed` n'existe pas.

- [ ] **Step 6: Implémenter `runSeed` (idempotent, avec des upserts)**

Données fixées par le spec : les horaires Lun–Jeu 11:30–13:30 et 18:00–22:00, Ven 18:00–22:00, Sam–Dim 12:00–13:30 et 18:00–22:00 (11 fenêtres), et les réglages par défaut. Données de démonstration, au choix du constructeur et modifiables dans l'admin :
- les catégories Pizzas (`isPizza`), Desserts et Boissons ;
- les pizzas Margherita 10,50, Reine 12,00, Pepperoni 12,50, 4 Fromages 13,00, BBQ Chicken 13,50 et Hawaïenne 12,50 ;
- les desserts Tiramisu 5,50 et Cannoli 4,50 ;
- les boissons Coca-Cola 33 cl, Oasis Tropical et 7Up Mojito, à 2,50 chacune ;
- les suppléments Œuf 1,00, Mozzarella 1,50, Jambon 2,00, Champignons 1,00 et Piment 0,50, liés à toutes les pizzas ;
- une zone « Toulouse » (codes 31000, 31100, 31200, 31300, 31400, 31500), avec 2,50 € de frais et 20,00 € de minimum.

Éditions (produits `isEditionOnly` de la catégorie Pizzas) :
- n°07 « Savoyarde d'hiver », 14,90 €, du 2026-11-01 au 2026-12-31 inclus, image `savoyarde.webp` ;
- n°06, n°05 et n°04, sur les bimestres précédents, avec les images `bbq-chicken.jpg`, `4-fromages.jpg` et `pepperoni.jpg`.

Chaque édition a un mot des frères. Les dates `startsAt` et `endsAt` sont à minuit heure de Paris, et `endsAt` est le lendemain de la date de fin.
L'admin est créé avec `auth.api.signUpEmail`, à partir de `ADMIN_EMAIL`, `ADMIN_PASSWORD` et `ADMIN_NAME`, puis on lui met `role: ADMIN` et `emailVerified: true`.

- [ ] **Step 7: Vérifier**

Run : `npm run test:int -- seed && npm run db:seed`
Expected : PASS, et le seed se relance sans erreur.

- [ ] **Step 8: Commit** (`feat: add Prisma 7 schema, seed and test db helpers`)

---

### Task 3: Heures de Paris et créneaux

**Files:**
- Create: `src/domain/types.ts`, `src/lib/time.ts`, `src/lib/clock.ts`, `src/domain/slots.ts`
- Test: `src/domain/slots.test.ts`, `src/lib/clock.test.ts`

**Interfaces:**
- Produces: dans `types.ts`, `FulfillmentMode`, `PaymentMethod`, `Cooking`, `OrderStatus` (unions de chaînes qui reprennent les enums Prisma), `ServiceWindowLike { weekday: number; opensAt: string; closesAt: string }` et `CartLineInput { productId: string; quantity: number; cooking: Cooking; supplementIds: string[] }`.
- Produces: dans `time.ts`, `PARIS = "Europe/Paris"`, `parisDateKey(d: Date): string` (au format "YYYY-MM-DD"), `parisWeekday(d: Date): number` (de 1 à 7), `atParisTime(dateKey: string, hhmm: string): Date` et `formatParisTime(d: Date): string` (au format "20:00"). Tout passe par `TZDate` de `@date-fns/tz`.
- Produces: dans `clock.ts`, `now(): Date`. Elle renvoie `new Date(process.env.OFRERO_NOW)` si `OFRERO_NOW` est défini et que `NODE_ENV !== "production"` ou que `E2E === "1"`, et `new Date()` sinon. Tests : `OFRERO_NOW` est respecté en test et ignoré si `NODE_ENV=production` sans `E2E`.
- Produces: dans `slots.ts`, `SlotOptions { now: Date; hours: ServiceWindowLike[]; closures: string[]; leadMinutes: number; slotMinutes?: number; searchDays?: number }`, `computeSlots(o: SlotOptions): { slots: Date[]; asap: Date } | null` et `isValidSlot(slot: Date, o: SlotOptions): boolean`.

Règle (spec, section 6) : `earliest` est égal à `now + leadMinutes`, arrondi au quart d'heure supérieur. Le service retenu est le premier service (aujourd'hui puis les jours suivants, au plus `searchDays = 7` jours, en sautant les jours de `closures`) qui contient au moins un créneau `>= max(earliest, opensAt)` et `< closesAt`. On renvoie tous les créneaux de ce service seul, et `asap` est le premier d'entre eux. `isValidSlot` vaut `true` seulement si `slot` appartient à `computeSlots(o).slots`.

- [ ] **Step 1: Écrire les tests qui échouent**

Utiliser les horaires du seed (`HOURS`) et la constante `P = (iso) => new Date(iso)`. 2026-11-19 est un jeudi.

```ts
test("Thursday 19:02 pickup starts at 19:30 and ends at 21:45", () => {
  const r = computeSlots({ now: P("2026-11-19T18:02:00Z"), hours: HOURS, closures: [], leadMinutes: 15 })!;
  expect(r.slots.map(formatParisTime)).toEqual(["19:30","19:45","20:00","20:15","20:30","20:45","21:00","21:15","21:30","21:45"]);
  expect(formatParisTime(r.asap)).toBe("19:30");
});
test("exact quarter stays on the quarter", () => {
  expect(formatParisTime(computeSlots({ now: P("2026-11-19T18:00:00Z"), hours: HOURS, closures: [], leadMinutes: 15 })!.asap)).toBe("19:15");
});
test("21:40 Thursday rolls to Friday 18:00", () => {
  const r = computeSlots({ now: P("2026-11-19T20:40:00Z"), hours: HOURS, closures: [], leadMinutes: 15 })!;
  expect(parisDateKey(r.asap)).toBe("2026-11-20");
  expect(formatParisTime(r.asap)).toBe("18:00");
});
test("Friday noon (no lunch service) gives Friday 18:00", () => { /* now 2026-11-20T11:00:00Z -> 2026-11-20 18:00 */ });
test("closure skips the day", () => { /* closures ["2026-11-20"], now Friday 11:00Z -> 2026-11-21 12:00 */ });
test("before opening gives the opening slot", () => { /* Monday 2026-11-16T09:00:00Z -> 11:30 */ });
test("delivery lead of 30 minutes", () => { /* Thursday 18:02Z, lead 30 -> asap 19:45 */ });
test("slots across DST spring-forward", () => {
  const r = computeSlots({ now: P("2027-03-27T22:00:00Z"), hours: HOURS, closures: [], leadMinutes: 15 })!;
  expect(r.asap.toISOString()).toBe("2027-03-28T10:00:00.000Z");
});
test("isValidSlot rejects too early, off-quarter, and later-service slots", () => {
  const o = { now: P("2026-11-19T18:02:00Z"), hours: HOURS, closures: [], leadMinutes: 15 };
  expect(isValidSlot(P("2026-11-19T18:30:00Z"), o)).toBe(true);
  expect(isValidSlot(P("2026-11-19T18:15:00Z"), o)).toBe(false);
  expect(isValidSlot(P("2026-11-19T18:37:00Z"), o)).toBe(false);
  expect(isValidSlot(P("2026-11-20T17:00:00Z"), o)).toBe(false);
});
```

- [ ] **Step 2: Vérifier l'échec**, avec `npm run test:unit -- slots clock`

- [ ] **Step 3: Implémenter `time.ts`, `clock.ts` puis `slots.ts`**

- [ ] **Step 4: Vérifier** que `npm run test:unit -- slots clock` passe (PASS).

- [ ] **Step 5: Commit** (`feat: add Paris time helpers, test clock and pickup/delivery slots`)

---

### Task 4: Prix, panier et livraison

**Files:**
- Create: `src/domain/pricing.ts`, `src/domain/delivery.ts`, `src/domain/cart.ts`
- Test: `src/domain/pricing.test.ts`, `src/domain/delivery.test.ts`, `src/domain/cart.test.ts`

**Interfaces:**
- Produces (`pricing.ts`) :
  - `PricedProduct { id; name; priceCents; discountPercent; isPizza; isAvailable; stockQuantity: number | null; isEditionOnly; allowedSupplements: { id; name; priceCents }[] }`, où `priceCents` d'un supplément tient déjà compte de `overridePriceCents`.
  - `unitPriceCents(p: { priceCents: number; discountPercent: number }): number`, qui vaut `Math.round(priceCents * (100 - discountPercent) / 100)`.
  - `PricedLine { productId; name; quantity; cooking; unitPriceCents; supplements: { id; name; unitPriceCents }[]; supplementsTotalCents; lineTotalCents; isPizza; isReward }`, où `supplementsTotalCents` est la somme des suppléments × la quantité, et `lineTotalCents = (unit + Σsupp) × qty`.
  - `PricedCart { lines: PricedLine[]; subtotalCents; rewardCents; pizzaCount }`.
  - `priceCart(lines: CartLineInput[], products: Map<string, PricedProduct>, opts?: { rewardLineIndex?: number; currentEditionProductId?: string | null }): PricedCart`.
  - `orderTotalCents(cart: PricedCart, deliveryFeeCents: number): number`, qui vaut `subtotal - reward + fee`.
  - `CartError` (étend `Error`), avec `code` parmi `"EMPTY" | "INVALID_QUANTITY" | "UNKNOWN_PRODUCT" | "UNAVAILABLE" | "OUT_OF_STOCK" | "SUPPLEMENT_NOT_ALLOWED" | "EDITION_OVER" | "REWARD_NOT_PIZZA"` et `productName?`.
- Produces (`delivery.ts`) :
  - `ZoneLike { id; name; postalCodes: string[]; feeCents; minOrderCents; isActive }`.
  - `normalizePostalCode(input: string): string | null`, qui retire les espaces et n'accepte que 5 chiffres.
  - `quoteDelivery(postalCode: string, subtotalCents: number, zones: ZoneLike[]): { ok: true; zone: ZoneLike; feeCents: number } | { ok: false; reason: "INVALID_POSTAL_CODE" | "OUT_OF_ZONE" | "BELOW_MINIMUM"; minOrderCents?: number }`. Le minimum se compare au sous-total après la réduction de fidélité. Les zones inactives sont ignorées.
- Produces (`cart.ts`) :
  - `lineKey(l: CartLineInput): string`, construit à partir du produit, de la cuisson et des suppléments triés.
  - `mergeCartLines(a: CartLineInput[], b: CartLineInput[]): CartLineInput[]`, qui additionne les quantités à clé égale (plafond 20) et garde l'ordre de `a` puis les nouvelles lignes de `b`.
  - `MAX_LINE_QUANTITY = 20`.

Règles : une quantité est un entier entre 1 et 20. La pizza offerte (`rewardLineIndex`) doit être une ligne `isPizza`. `rewardCents` vaut le `unitPriceCents` de cette ligne, pour une seule unité (les suppléments restent payants), et la ligne est marquée `isReward`. Un produit `isEditionOnly` dont l'id n'est pas `currentEditionProductId` lève `EDITION_OVER`. Le stock n'est contrôlé que si `stockQuantity !== null`, en comparant à la quantité totale du produit dans le panier. `pizzaCount` est la somme des quantités des lignes `isPizza`.

- [ ] **Step 1: Écrire les tests qui échouent**

```ts
test("unitPriceCents applies discount with rounding", () => { expect(unitPriceCents({ priceCents: 1250, discountPercent: 15 })).toBe(1063); });
test("priceCart sums supplements per unit times quantity", () => {
  const c = priceCart([{ productId: "marg", quantity: 2, cooking: "NORMAL", supplementIds: ["egg"] }], PRODUCTS);
  expect(c.lines[0]).toMatchObject({ unitPriceCents: 1050, supplementsTotalCents: 200, lineTotalCents: 2300 });
  expect(c).toMatchObject({ subtotalCents: 2300, pizzaCount: 2, rewardCents: 0 });
});
test("reward frees one unit price, supplements stay paid", () => {
  const c = priceCart([{ productId: "marg", quantity: 2, cooking: "NORMAL", supplementIds: ["egg"] }], PRODUCTS, { rewardLineIndex: 0 });
  expect(c.rewardCents).toBe(1050);
  expect(orderTotalCents(c, 0)).toBe(1250);
});
test.each([
  [[{ productId: "marg", quantity: 0, cooking: "NORMAL", supplementIds: [] }], "INVALID_QUANTITY"],
  [[{ productId: "marg", quantity: 99, cooking: "NORMAL", supplementIds: [] }], "INVALID_QUANTITY"],
  [[{ productId: "marg", quantity: 1, cooking: "NORMAL", supplementIds: ["ham-not-allowed"] }], "SUPPLEMENT_NOT_ALLOWED"],
  [[{ productId: "old-edition", quantity: 1, cooking: "NORMAL", supplementIds: [] }], "EDITION_OVER"],
  [[{ productId: "coke", quantity: 1, cooking: "NORMAL", supplementIds: [] }], "REWARD_NOT_PIZZA"], // with rewardLineIndex 0
  [[], "EMPTY"],
])("priceCart rejects tampered cart %#", (lines, code) => { /* expect CartError with code */ });
test("stock counts all lines of the same product", () => { /* stockQuantity 2, two lines of 1 + 2 -> OUT_OF_STOCK */ });
test("normalizePostalCode", () => {
  expect(normalizePostalCode(" 31 100 ")).toBe("31100");
  expect(normalizePostalCode("3110")).toBeNull();
  expect(normalizePostalCode("31100a")).toBeNull();
});
test("quoteDelivery", () => {
  expect(quoteDelivery("31 100", 2500, ZONES)).toMatchObject({ ok: true, feeCents: 250 });
  expect(quoteDelivery("75001", 2500, ZONES)).toMatchObject({ ok: false, reason: "OUT_OF_ZONE" });
  expect(quoteDelivery("31100", 1500, ZONES)).toMatchObject({ ok: false, reason: "BELOW_MINIMUM", minOrderCents: 2000 });
  expect(quoteDelivery("3110", 2500, ZONES)).toMatchObject({ ok: false, reason: "INVALID_POSTAL_CODE" });
});
test("mergeCartLines sums equal lines regardless of supplement order and caps at 20", () => { /* ["egg","ham"] vs ["ham","egg"] -> one line; 15 + 10 -> 20 */ });
```

- [ ] **Step 2: Vérifier l'échec**, avec `npm run test:unit -- pricing delivery cart`

- [ ] **Step 3: Implémenter les trois modules**

- [ ] **Step 4: Vérifier** que ces mêmes tests passent (PASS).

- [ ] **Step 5: Commit** (`feat: add server-side pricing, delivery quote and cart merge`)

---

### Task 5: Fidélité, éditions et statuts de commande

**Files:**
- Create: `src/domain/loyalty.ts`, `src/domain/editions.ts`, `src/domain/order-status.ts`
- Test: `src/domain/loyalty.test.ts`, `src/domain/editions.test.ts`, `src/domain/order-status.test.ts`

**Interfaces:**
- Produces (`loyalty.ts`) :
  - `stampsEarned(c: { pizzaCount: number; rewardCents: number }): number`, qui vaut `pizzaCount - (rewardCents > 0 ? 1 : 0)`, avec un minimum de 0.
  - `stampBalance(entries: { kind: "EARN" | "REDEEM"; stamps: number }[]): number`.
  - `canRedeem(balance: number, stampsForReward: number): boolean`.
- Produces (`editions.ts`) :
  - `EditionLike { id: string; number: number; startsAt: Date; endsAt: Date }`.
  - `currentEdition<T extends EditionLike>(list: T[], now: Date): T | null`. Elle vérifie `startsAt <= now < endsAt` ; si plusieurs éditions conviennent, c'est le `startsAt` le plus récent qui l'emporte.
  - `pastEditions<T extends EditionLike>(list: T[], now: Date): T[]`, triées par `number` décroissant.
  - `editionProgress(e: EditionLike, now: Date): { dayIndex: number; totalDays: number; ratio: number; remainingMs: number }`. `dayIndex` part de 1 et le ratio est compris entre 0 et 1.
  - `splitRemaining(ms: number): { days: number; hours: number; minutes: number }`.
  - `editionBounds(startDate: string, endDate: string): { startsAt: Date; endsAt: Date }`, qui renvoie minuit à Paris pour le début et minuit à Paris le lendemain de `endDate` pour la fin.
- Produces (`order-status.ts`) :
  - `nextStatuses(status: OrderStatus, mode: FulfillmentMode): OrderStatus[]`.
  - `STATUS_LABELS: Record<OrderStatus, string>` : « En attente de paiement », « Reçue », « Au four », « Prête », « En livraison », « Terminée », « Non récupérée », « Annulée », « Paiement échoué ».
  - `trackingSteps(mode): { status: OrderStatus; label: string }[]` : pour le retrait, Reçue, Au four, Prête, Récupérée ; pour la livraison, Reçue, Au four, En livraison, Livrée.
  - `TERMINAL_STATUSES`.

Transitions :
- PENDING_PAYMENT → [CANCELLED] côté admin. RECEIVED et FAILED ne sont atteints que par le webhook.
- RECEIVED → [IN_OVEN, CANCELLED].
- IN_OVEN → [READY, CANCELLED] pour le retrait, [OUT_FOR_DELIVERY, CANCELLED] pour la livraison.
- READY → [COMPLETED, NOT_COLLECTED].
- OUT_FOR_DELIVERY → [COMPLETED].
- Statuts terminaux : COMPLETED, NOT_COLLECTED, CANCELLED, FAILED.

- [ ] **Step 1: Écrire les tests qui échouent**

```ts
test("stampsEarned excludes the free pizza", () => { expect(stampsEarned({ pizzaCount: 3, rewardCents: 1050 })).toBe(2); expect(stampsEarned({ pizzaCount: 0, rewardCents: 0 })).toBe(0); });
test("stampBalance and canRedeem", () => { expect(stampBalance([{ kind: "EARN", stamps: 12 }, { kind: "REDEEM", stamps: 10 }])).toBe(2); expect(canRedeem(10, 10)).toBe(true); expect(canRedeem(9, 10)).toBe(false); });
test("currentEdition uses an exclusive end", () => { /* edition 7 bounds 2026-11-01..2026-12-31; now 2026-12-31T22:59:59Z -> edition 7; now 2026-12-31T23:00:00Z -> null */ });
test("editionProgress on day 23 of 61", () => { /* now 2026-11-23T12:00:00Z -> dayIndex 23, totalDays 61 */ });
test("splitRemaining", () => { expect(splitRemaining(((38 * 24 + 4) * 60 + 12) * 60000)).toEqual({ days: 38, hours: 4, minutes: 12 }); });
test("nextStatuses depends on mode", () => {
  expect(nextStatuses("IN_OVEN", "PICKUP")).toEqual(["READY", "CANCELLED"]);
  expect(nextStatuses("IN_OVEN", "DELIVERY")).toEqual(["OUT_FOR_DELIVERY", "CANCELLED"]);
  expect(nextStatuses("READY", "PICKUP")).toEqual(["COMPLETED", "NOT_COLLECTED"]);
  expect(nextStatuses("COMPLETED", "PICKUP")).toEqual([]);
});
```

- [ ] **Step 2: Vérifier l'échec, implémenter, puis vérifier le succès** (`npm run test:unit`)

- [ ] **Step 3: Commit** (`feat: add loyalty, editions and order status rules`)

---

### Task 6: Authentification, e-mails et rattachement des commandes invitées

**Files:**
- Create: `src/lib/auth.ts`, `src/lib/auth-client.ts`, `src/lib/session.ts`, `src/lib/email.ts`, `src/app/api/auth/[...all]/route.ts`, `src/server/accounts.ts`, `src/emails/templates.ts`
- Test: `src/server/accounts.test.ts`, `src/lib/email.test.ts`

**Interfaces:**
- Produces: `auth` (dans `src/lib/auth.ts`), construit avec `betterAuth`. Configuration :
  - `database: prismaAdapter(prisma, { provider: "postgresql" })`, importé depuis `better-auth/adapters/prisma` ;
  - `emailAndPassword: { enabled: true, minPasswordLength: 8, sendResetPassword }` ;
  - `emailVerification: { sendOnSignUp: true, autoSignInAfterVerification: true, sendVerificationEmail, afterEmailVerification: (user) => attachGuestOrders(user.id, user.email) }` ;
  - `user: { additionalFields: { role: { type: "string", defaultValue: "USER", input: false } } }` ;
  - `plugins: [nextCookies()]`, avec `nextCookies` importé depuis `better-auth/next-js`.
- Produces: `authClient` (dans `auth-client.ts`), via `createAuthClient` de `better-auth/react`.
- Produces (`session.ts`) : `getSession(): Promise<{ user: { id; email; name; role; emailVerified } } | null>`, qui appelle `auth.api.getSession({ headers: await headers() })`, et `requireAdmin(): Promise<Session>`, qui appelle `notFound()` si l'utilisateur n'est pas admin.
- Produces (`email.ts`) : `sendEmail(msg: { to: string; subject: string; html: string; text: string }): Promise<{ delivered: boolean }>`. Avec `RESEND_API_KEY`, l'envoi passe par `new Resend(key).emails.send({ from: env.EMAIL_FROM, ... })`. Sans clé, la fonction fait un `console.info("[email]", to, subject, text)` et renvoie `{ delivered: false }`.
- Produces (`templates.ts`) : `verificationEmail(url)`, `resetPasswordEmail(url)` et `orderConfirmationEmail(order: { number: number; firstName: string; slotLabel: string; modeLabel: string; totalLabel: string; trackingUrl: string; payAtPickup: boolean })`. Chacune renvoie `{ subject, html, text }`, en français et sans emoji.
- Produces (`accounts.ts`) : `attachGuestOrders(userId: string, email: string): Promise<{ attached: number; stampsCredited: number }>`. La fonction est idempotente. Elle compare l'e-mail en minuscules et ne touche qu'aux commandes avec `userId = null`. Pour chaque commande COMPLETED rattachée, elle crée une `LoyaltyEntry` EARN de `stampsEarned` (en ignorant le conflit sur `orderId + kind`).
- Route : `export const { GET, POST } = toNextJsHandler(auth)`.

- [ ] **Step 1: Écrire les tests qui échouent**

```ts
test("attachGuestOrders attaches case-insensitively and credits completed orders", async () => {
  await resetDb();
  const user = await makeUser({ email: "karim@exemple.fr" });
  await makeOrder({ customerEmail: "karim@exemple.fr", status: "COMPLETED", pizzas: 2 });
  await makeOrder({ customerEmail: "karim@exemple.fr", status: "RECEIVED", pizzas: 1 });
  await makeOrder({ customerEmail: "autre@exemple.fr", status: "COMPLETED", pizzas: 3 });
  expect(await attachGuestOrders(user.id, "Karim@Exemple.fr")).toEqual({ attached: 2, stampsCredited: 2 });
  expect(await attachGuestOrders(user.id, "karim@exemple.fr")).toEqual({ attached: 0, stampsCredited: 0 });
});
test("sendEmail without key logs and reports not delivered", async () => {
  expect(await sendEmail({ to: "a@b.fr", subject: "s", html: "<p>t</p>", text: "t" })).toEqual({ delivered: false });
});
```

`makeOrder` enregistre `customerEmail` en minuscules, comme le fera `placeOrder`.

- [ ] **Step 2: Vérifier l'échec, implémenter, puis vérifier le succès** (`npm run test:int -- accounts && npm run test:unit -- email`)

- [ ] **Step 3: Vérifier le parcours d'inscription à la main**

Run : `npm run dev`, puis inscription via `POST /api/auth/sign-up/email`.
Expected : la console du serveur affiche le lien de vérification, et l'ouvrir marque `emailVerified` à `true`.

- [ ] **Step 4: Commit** (`feat: add Better Auth with email verification and guest order attachment`)

---

### Task 7: Lecture du catalogue et des réglages

**Files:**
- Create: `src/server/catalog.ts`, `src/server/settings.ts`
- Test: `src/server/catalog.test.ts`

**Interfaces:**
- Produces (`settings.ts`) : `getSettings()` (crée la ligne `id = 1` si elle manque), `getServiceWindows(): Promise<ServiceWindowLike[]>`, `getClosures(): Promise<string[]>`, `getActiveZones(): Promise<ZoneLike[]>` et `getSlotOptions(mode: FulfillmentMode, now: Date): Promise<SlotOptions>`.
- Produces (`catalog.ts`) :
  - `getMenu(now: Date): Promise<{ id; name; isPizza; products: MenuProduct[] }[]>`, trié par `displayOrder`. Le menu exclut les produits indisponibles et les produits `isEditionOnly` qui ne sont pas l'édition en cours. `MenuProduct = { id; name; description; imageUrl; priceCents; unitPriceCents; discountPercent; isPizza; supplements: { id; name; priceCents }[] }`.
  - `getPricedProducts(ids: string[]): Promise<Map<string, PricedProduct>>`.
  - `getHomeData(now: Date): Promise<{ edition: (EditionLike & { brothersNote: string; product: MenuProduct }) | null; featured: MenuProduct | null; past: { number: number; name: string; imageUrl: string | null; id: string }[]; preview: MenuProduct[] }>`. `featured` vient de `Settings.featuredProductId`, ou à défaut de la première pizza. `preview` contient trois pizzas.
  - `getCurrentEditionProductId(now: Date): Promise<string | null>`.

- [ ] **Step 1: Écrire les tests qui échouent**

```ts
test("getMenu hides past edition products and shows the current one", async () => {
  await resetDb(); await runSeed(prisma);
  const names = (await getMenu(new Date("2026-11-20T12:00:00Z"))).flatMap((c) => c.products.map((p) => p.name));
  expect(names).toContain("Savoyarde d'hiver");
  expect(names).not.toContain(PAST_EDITION_6_NAME);
});
test("getHomeData returns edition 7 and three past editions", async () => {
  const h = await getHomeData(new Date("2026-11-20T12:00:00Z"));
  expect(h.edition?.number).toBe(7);
  expect(h.past.map((p) => p.number)).toEqual([6, 5, 4]);
});
test("getHomeData falls back to featured product between editions", async () => {
  const h = await getHomeData(new Date("2027-01-05T12:00:00Z"));
  expect(h.edition).toBeNull(); expect(h.featured).not.toBeNull();
});
```

- [ ] **Step 2: Vérifier l'échec, implémenter, puis vérifier le succès** (`npm run test:int -- catalog`)

- [ ] **Step 3: Commit** (`feat: add catalog and settings read services`)

---

### Task 8: Passer une commande (invité ou compte, retrait ou livraison)

**Files:**
- Create: `src/server/orders.ts`, `src/server/payments.ts`, `src/server/notifications.ts`, `src/lib/stripe.ts`
- Test: `src/server/orders.test.ts`

**Interfaces:**
- Consumes : `priceCart`, `orderTotalCents`, `quoteDelivery`, `isValidSlot`, `stampBalance`, `canRedeem`, `getSlotOptions`, `getPricedProducts`, `getCurrentEditionProductId`, `sendEmail` et `orderConfirmationEmail`.
- Produces (`notifications.ts`) : `notifyOrderReceived(orderId: string): Promise<void>`. Elle n'envoie l'e-mail de confirmation que si `confirmationSentAt` est vide, le renseigne dans un `updateMany` conditionnel (`where: { id, confirmationSentAt: null }`) et n'envoie rien si `count === 0`. L'URL de suivi est `${env.BETTER_AUTH_URL}/suivi/${trackingToken}`.
- Produces (`lib/stripe.ts`) : `getStripe(): Stripe`, construit avec `new Stripe(env.STRIPE_SECRET_KEY!)`. Elle lève une erreur explicite si la clé manque.
- Produces (`payments.ts`) : `createPaymentIntent(order: { id: string; number: number; totalCents: number; customerEmail: string }): Promise<{ intentId: string; clientSecret: string }>`, qui utilise `amount`, `currency: "eur"`, `automatic_payment_methods: { enabled: true }`, `metadata: { orderId }` et `receipt_email`.
- Produces (`orders.ts`) :
  - `PlaceOrderInput`, un schéma Zod exporté sous le nom `placeOrderSchema`, avec les champs `mode`, `slotAt` (chaîne ISO), `paymentMethod`, `customer: { firstName (1 à 40 caractères), phone (format FR : 10 chiffres commençant par 0, ou +33 suivi de 9 chiffres, espaces ignorés), email }`, `address?: { line1; line2?; postalCode; city }`, `lines: CartLineInput[]` et `rewardLineIndex?: number`.
  - `PlaceOrderError`, parmi `"VALIDATION" | "INVALID_SLOT" | "DELIVERY_REQUIRES_ONLINE" | "ADDRESS_REQUIRED" | "INVALID_POSTAL_CODE" | "OUT_OF_ZONE" | "BELOW_MINIMUM" | "REWARD_UNAVAILABLE" | "PAYMENT_UNAVAILABLE" | CartError["code"]`.
  - `ORDER_ERROR_MESSAGES: Record<PlaceOrderError, string>` (en français ; le message BELOW_MINIMUM affiche le minimum en euros).
  - `placeOrder(input: unknown, ctx: { userId: string | null; now: Date }): Promise<{ ok: true; orderId: string; number: number; trackingToken: string; clientSecret: string | null } | { ok: false; error: PlaceOrderError; message: string }>`.

Comportement :
- Tout se fait dans une seule transaction Prisma. On valide les données, on vérifie le créneau avec `isValidSlot` (selon le délai du mode), puis on calcule le prix et le devis de livraison.
- La récompense n'est acceptée que si l'utilisateur est connecté et que son solde le permet (sinon REWARD_UNAVAILABLE). Dans ce cas, on crée une `LoyaltyEntry` REDEEM de `stampsForReward`.
- Le stock est décompté.
- La commande est créée avec `trackingToken = randomBytes(24).toString("base64url")` et `customerEmail` en minuscules. `editionId` est rempli si le panier contient le produit de l'édition en cours.
- Le statut initial est `PENDING_PAYMENT` en paiement en ligne, et `RECEIVED` en paiement au retrait.
- Une `OrderLog` initiale est ajoutée.
- Après le commit : en paiement en ligne, on appelle `createPaymentIntent`, puis on enregistre `stripePaymentIntentId`. Sans clé Stripe, la commande est annulée, le stock et la récompense sont rendus, et on renvoie PAYMENT_UNAVAILABLE. En paiement au retrait, on appelle `notifyOrderReceived(orderId)`.

- [ ] **Step 1: Écrire les tests qui échouent**

`@/server/payments` est remplacé par un mock dans `vi.mock`, qui renvoie `{ intentId: "pi_test", clientSecret: "cs_test" }`. `now` vaut un jeudi à 18:02 UTC.

```ts
test("guest pickup paid at pickup is RECEIVED with no client secret", async () => {
  const r = await placeOrder(validPickup({ paymentMethod: "AT_PICKUP" }), { userId: null, now: NOW });
  expect(r).toMatchObject({ ok: true, clientSecret: null });
  const o = await prisma.order.findUniqueOrThrow({ where: { id: r.ok ? r.orderId : "" } });
  expect(o).toMatchObject({ status: "RECEIVED", userId: null, customerEmail: "karim@exemple.fr", totalCents: 2300 });
});
test("guest delivery online creates PENDING_PAYMENT with fee and client secret", async () => {
  const r = await placeOrder(validDelivery({ address: { line1: "12 rue des Lois", postalCode: "31 000", city: "Toulouse" } }), { userId: null, now: NOW });
  expect(r).toMatchObject({ ok: true, clientSecret: "cs_test" });
  // order.deliveryFeeCents === 250, status PENDING_PAYMENT, postalCode "31000"
});
test.each([
  ["delivery paid at pickup", validDelivery({ paymentMethod: "AT_PICKUP" }), "DELIVERY_REQUIRES_ONLINE"],
  ["slot too early", validPickup({ slotAt: "2026-11-19T18:15:00Z" }), "INVALID_SLOT"],
  ["out of zone", validDelivery({ address: { line1: "1 rue", postalCode: "75001", city: "Paris" } }), "OUT_OF_ZONE"],
  ["tampered supplement", validPickup({ lines: [{ productId: MARG, quantity: 1, cooking: "NORMAL", supplementIds: [NOT_LINKED] }] }), "SUPPLEMENT_NOT_ALLOWED"],
  ["reward as guest", validPickup({ rewardLineIndex: 0 }), "REWARD_UNAVAILABLE"],
])("rejects %s and creates nothing", async (_n, input, error) => {
  const before = await prisma.order.count();
  expect(await placeOrder(input, { userId: null, now: NOW })).toMatchObject({ ok: false, error });
  expect(await prisma.order.count()).toBe(before);
});
test("account with 10 stamps redeems a pizza and decrements stock", async () => { /* balance 10 -> REDEEM 10, rewardCents 1050, stock 5 -> 4 */ });
test("edition product after its end is refused", async () => { /* now 2027-01-05 -> EDITION_OVER */ });
```

- [ ] **Step 2: Vérifier l'échec, implémenter, puis vérifier le succès** (`npm run test:int -- orders`)

- [ ] **Step 3: Commit** (`feat: place guest and account orders with slot, zone and reward checks`)

---

### Task 9: Cycle de vie des commandes, webhook Stripe et suivi

**Files:**
- Create: `src/server/lifecycle.ts`, `src/app/api/stripe/webhook/route.ts`, `src/app/api/suivi/[token]/route.ts`
- Test: `src/server/lifecycle.test.ts`

**Interfaces:**
- Produces (`lifecycle.ts`) :
  - `advanceOrderStatus(orderId: string, to: OrderStatus, actor: string): Promise<{ ok: true } | { ok: false; error: "NOT_FOUND" | "INVALID_TRANSITION" }>`, qui s'appuie sur `nextStatuses`.
  - `markOrderPaid(intentId: string): Promise<void>`, qui fait passer de PENDING_PAYMENT à RECEIVED.
  - `markOrderFailed(intentId: string): Promise<void>`, qui fait passer de PENDING_PAYMENT à FAILED.
  - `handleStripeEvent(event: Stripe.Event): Promise<void>`, qui traite `payment_intent.succeeded` et `payment_intent.payment_failed` et ignore le reste.
  - `getTracking(token: string): Promise<TrackingView | null>`, avec `TrackingView = { number; status; mode; paymentMethod; slotAt: string; firstName; items: { name; quantity; cooking; supplements: string[] }[]; totalCents; addressShort: string | null; steps: { status; label; done: boolean }[] }`. Cette vue n'expose ni l'e-mail ni le téléphone.

Effets de bord, dans la même transaction que le changement de statut, avec une `OrderLog` à chaque fois :
- RECEIVED → `notifyOrderReceived` (tâche 8) est appelé après le commit.
- COMPLETED avec un `userId` → une entrée EARN de `stampsEarned` (en ignorant le conflit).
- CANCELLED ou FAILED → le stock est rendu pour les produits dont `stockQuantity` n'est pas nul, et l'entrée REDEEM de la commande est supprimée.

Toutes ces opérations sont idempotentes : la mise à jour se fait par `updateMany`, avec une condition sur le statut attendu, et s'arrête si `count === 0`.
Route webhook : elle lit `await request.text()`, appelle `getStripe().webhooks.constructEvent(body, signature, env.STRIPE_WEBHOOK_SECRET!)` (et répond 400 si la signature est invalide), puis `handleStripeEvent` et répond 200.
Route de suivi : elle renvoie `getTracking` en JSON avec `Cache-Control: no-store`, ou une 404.

- [ ] **Step 1: Écrire les tests qui échouent**

```ts
test("webhook is idempotent", async () => {
  const { orderId } = await placeOnline(); // intent pi_test
  await handleStripeEvent(succeeded("pi_test")); await handleStripeEvent(succeeded("pi_test"));
  expect(await prisma.order.findUniqueOrThrow({ where: { id: orderId } })).toMatchObject({ status: "RECEIVED" });
  expect(sendEmailMock).toHaveBeenCalledTimes(1);
  expect(await prisma.orderLog.count({ where: { orderId, status: "RECEIVED" } })).toBe(1);
});
test("failed payment restocks and refunds the reward once", async () => { /* stock 5 -> 4 at place -> 5 after failed x2; REDEEM entry deleted */ });
test("late success after cancel does nothing", async () => { /* advance to CANCELLED from PENDING_PAYMENT, then succeeded -> stays CANCELLED, no email */ });
test("pickup lifecycle credits stamps on completion only", async () => {
  // RECEIVED -> IN_OVEN -> READY -> COMPLETED with user; EARN = 2 after COMPLETED, 0 before
});
test("invalid transitions are refused", async () => {
  expect(await advanceOrderStatus(deliveryOrderId, "READY", "admin@x")).toEqual({ ok: false, error: "INVALID_TRANSITION" });
});
test("getTracking hides contact details", async () => { /* keys of result exclude customerEmail and customerPhone */ });
```

- [ ] **Step 2: Vérifier l'échec, implémenter, puis vérifier le succès** (`npm run test:int -- lifecycle`)

- [ ] **Step 3: Tester la route webhook**

Ajouter un test sur `POST` de la route, avec une signature produite par `getStripe().webhooks.generateTestHeaderString({ payload, secret })` : il doit répondre 200 si la signature est valide et 400 si elle est fausse.

- [ ] **Step 4: Commit** (`feat: add order lifecycle, Stripe webhook and public tracking`)

---

### Task 10: Fondations visuelles et coque du site

**Files:**
- Create : `src/app/globals.css` (tokens de la section Global Constraints, `@theme` Tailwind 4) et `src/app/layout.tsx` (polices, `lang="fr"`, métadonnées « O'Frero Pizza, pizzeria au feu de bois à Toulouse »).
- Create, composants d'interface :
  - `src/components/ui/Button.tsx` (variantes `primary` braise, `secondary` surface, `ghost`, tailles `md` et `lg`) ;
  - `Sheet.tsx` (Radix Dialog, depuis le bas sur téléphone et depuis la droite à partir de 768 px) ;
  - `Field.tsx` (libellé, aide, erreur) ;
  - `Segmented.tsx` (radiogroup accessible).
- Create, coque du site :
  - `src/components/site/Header.tsx` (logo, liens La carte, Les éditions, Compte, et le panier avec un compteur) ;
  - `ActionBar.tsx` (collée en bas sous 768 px, avec Commander + prix et Appeler `tel:`, masquée sur `/commande` et `/admin`) ;
  - `Footer.tsx` (horaires, adresse, téléphone, liens légaux).
- Create : `src/app/mentions-legales/page.tsx`, `src/app/cgv/page.tsx`
- Delete : les fichiers du gabarit (`page.tsx` par défaut, SVG de `public/`).

**Interfaces:**
- Produces : `<ActionBar priceCents?: number; href: string; onOrder?: () => void />`. Sur l'accueil, la page fournit `onOrder`.
- Produces : `<Sheet open onOpenChange title>{children}</Sheet>`.

- [ ] **Step 1: Implémenter**

Le contenu légal est un texte de base, avec des emplacements à compléter clairement marqués « À compléter : numéro SIRET », etc.

- [ ] **Step 2: Vérifier**

Run : `npm run lint && npm run typecheck && npm run build`, puis `npm run dev` et contrôle à 375 px et à 1280 px dans le navigateur.
Expected : l'en-tête, la barre d'action et le pied de page s'affichent avec les bons tokens, les contrastes sont AA et la navigation au clavier est visible (anneau de focus braise).

- [ ] **Step 3: Commit** (`feat: add design tokens, UI primitives and site shell`)

---

### Task 11: Page d'accueil « édition limitée » et archive des éditions

**Files:**
- Create : `src/app/page.tsx` (Server Component qui appelle `getHomeData(now())` et `getSession()`) et `src/app/editions/page.tsx`.
- Create, composants de `src/components/home/` :
  - `EditionPoster.tsx` : numéro « ÉDITION N°07 · NOV — DÉC », nom en Anton sur 2 lignes, photo ronde qui tourne en 40 s, ingrédients et prix ;
  - `Countdown.tsx` : client, « Disparaît dans », « 38 J 04 H 12 MIN », barre de progression et « J+23 / 61 », mis à jour chaque minute ;
  - `BrothersNote.tsx`, `MenuPreview.tsx` (onglets par catégorie, trois produits avec « + » qui ouvre `ProductSheet`), `EditionsArchive.tsx` (en couleur avec anneau braise si goûtée, sinon en gris), `LoyaltyCard.tsx` (10 tampons, solde réel si connecté, sinon CTA « Créer mon compte »), `VisitInfo.tsx`.

**Interfaces:**
- Consumes : `getHomeData`, `editionProgress`, `splitRemaining`, `getLoyaltySummary` (tâche 14, dont la signature est fixée ici : `getLoyaltySummary(userId: string): Promise<{ balance: number; stampsForReward: number; tastedEditionIds: string[] }>`. Créer `src/server/loyalty.ts` dans cette tâche s'il n'existe pas encore). `ProductSheet` vient de la tâche 12 : construire d'abord la tâche 12 si besoin, ou brancher le « + » à la fin de la tâche 12.
- Entre deux éditions, `EditionPoster` affiche `featured` sans numéro ni compte à rebours.

- [ ] **Step 1: Implémenter**, d'après la maquette validée (`.superpowers/brainstorm/*/content/accueil-a-complet.html`)

L'ordre des sections est celui de la section 8 du spec. « Commander » sur l'affiche ouvre `ProductSheet` pour le produit de l'édition. Une fois la pizza ajoutée, le panier s'ouvre avec « Continuer » (vers `/commande`) et « Ajouter autre chose » (vers `/carte`).

- [ ] **Step 2: Vérifier**

Run : `npm run build`, puis le navigateur à 375 px et à 1280 px, en mouvement normal et réduit (émulation `prefers-reduced-motion`).
Expected : sans édition en cours (relancer `npm run dev` avec `OFRERO_NOW=2027-01-05T12:00:00Z`), l'affiche bascule sur la pizza mise en avant. En mouvement réduit, la pizza ne tourne pas. Sur téléphone, le bouton Commander est visible sans défiler.

- [ ] **Step 3: Commit** (`feat: add limited-edition home page and editions archive`)

---

### Task 12: Carte, personnalisation et panier

**Files:**
- Create : `src/app/carte/page.tsx`, `src/components/menu/MenuList.tsx` et `src/components/menu/ProductSheet.tsx` (cuisson en `Segmented`, suppléments en cases à cocher, quantité, prix total en direct).
- Create : `src/components/cart/cart-store.ts` (Zustand `persist`, clé localStorage `ofrero-cart-v1`), `src/components/cart/CartSheet.tsx` et `src/components/cart/CartSync.tsx`.
- Create : `src/server/cart.ts` et `src/app/(cart)/actions.ts`.
- Test : `src/server/cart.test.ts`

**Interfaces:**
- Produces : `useCart()`, qui expose `{ lines: CartLineInput[]; add(line); setQuantity(index, q); remove(index); clear(); replace(lines) }`.
- Produces (`server/cart.ts`) : `loadCart(userId): Promise<CartLineInput[]>`, `saveCart(userId, lines): Promise<void>` et `mergeIntoAccount(userId, local: CartLineInput[]): Promise<CartLineInput[]>`, qui utilise `mergeCartLines`, enregistre et renvoie le résultat fusionné.
- Produces (actions) : `syncCartAction(lines)` (qui enregistre si l'utilisateur est connecté) et `mergeCartAction(local)`.
- Produces : `quoteCartAction(lines, rewardLineIndex?)`, qui renvoie `PricedCart` ou `{ error, message }`. C'est le seul calcul de prix affiché dans le panier : le client ne fait jamais lui-même le calcul.
- `CartSync` : à la connexion, il appelle `mergeCartAction(local)` une seule fois puis `replace(result)`. Ensuite, chaque changement envoie `syncCartAction` (avec un délai de 500 ms).

- [ ] **Step 1: Écrire le test qui échoue**

```ts
test("mergeIntoAccount merges stored and local carts", async () => { /* stored marg x1, local marg x2 + coke x1 -> marg x3, coke x1 saved */ });
```

- [ ] **Step 2: Vérifier l'échec, implémenter, puis vérifier le succès** (`npm run test:int -- cart`)

- [ ] **Step 3: Vérifier dans le navigateur**

Expected : on ajoute une pizza avec des suppléments, le panier affiche le total calculé par le serveur et il survit à un rechargement.

- [ ] **Step 4: Commit** (`feat: add menu, product customization and persistent cart`)

---

### Task 13: Parcours de commande, paiement, confirmation et suivi

**Files:**
- Create : `src/app/commande/page.tsx` (client, 3 étapes dans la même page avec un état d'étape), `src/app/commande/actions.ts`, `src/components/order/ModeStep.tsx`, `DetailsStep.tsx`, `StripePayment.tsx`, `Confirmation.tsx`.
- Create : `src/app/suivi/[token]/page.tsx` et `src/components/order/TrackingView.tsx`.

**Interfaces:**
- Produces (actions) :
  - `getSlotsAction(mode): Promise<{ slots: string[]; asap: string; serviceLabel: string } | null>`, où `serviceLabel` vaut « ce soir », « ce midi », « demain midi » ou « vendredi soir », selon la date à Paris ;
  - `quoteDeliveryAction(postalCode, lines, rewardLineIndex?)` ;
  - `placeOrderAction(input)`, qui appelle `placeOrder(input, { userId: session?.user.id ?? null, now: new Date() })`.
- Étape 1 (ModeStep) : `Segmented` À emporter / Livraison, puis la grille des créneaux (quarts d'heure) plus « Dès que possible ~N min ». En livraison, un champ d'adresse avec le code postal vérifié en direct (frais, minimum ou refus avec « Appeler » et « Passer en retrait »).
- Étape 2 (DetailsStep) : le récapitulatif calculé par `quoteCartAction`, les coordonnées (préremplies depuis la session et l'adresse par défaut), le choix « Utiliser ma pizza offerte » si `canRedeem` (choix de la ligne), puis le paiement : « Payer en ligne » et « Payer au retrait » (cette seconde option seulement en retrait).
- Paiement en ligne : `<Elements stripe={loadStripe(pk)} options={{ clientSecret, appearance }}>` avec `<PaymentElement />`, puis `stripe.confirmPayment({ elements, confirmParams: { return_url: "<origin>/suivi/<token>?paye=1" } })`.
- Étape 3 (Confirmation) et `/suivi/[token]` : l'heure en grand en Anton braise, l'adresse ou « à régler sur place », les étapes de `trackingSteps`, une interrogation de `/api/suivi/[token]` toutes les 10 s jusqu'à un statut terminal, et la carte « Cette commande vaut N tampons, Garder mes tampons » (vers `/compte/inscription?email=`) pour un invité.
- Après une commande réussie, le panier est vidé.

- [ ] **Step 1: Implémenter**, d'après la maquette `parcours-commande.html`

- [ ] **Step 2: Vérifier dans le navigateur**

Avec `npm run dev` et la base seedée, passer une commande invitée à emporter payée au retrait.
Expected : `/suivi/<token>` affiche « Reçue ». Faire avancer le statut avec `advanceOrderStatus` (via Prisma Studio ou l'admin une fois la tâche 15 faite) : la page suit, à 10 s près. Avec des clés Stripe de test et `stripe listen --forward-to localhost:3000/api/stripe/webhook`, le paiement par la carte 4242 4242 4242 4242 fait passer la commande à « Reçue ».

- [ ] **Step 3: Commit** (`feat: add three-step checkout, Stripe payment and order tracking`)

---

### Task 14: Espace compte

**Files:**
- Create : `src/app/compte/page.tsx` (tableau de bord), `src/app/compte/connexion/page.tsx`, `src/app/compte/inscription/page.tsx`, `src/app/compte/verification/page.tsx`, `src/app/compte/mot-de-passe/page.tsx`, `src/app/compte/actions.ts` et `src/components/account/*`.
- Create : `src/server/loyalty.ts` (s'il n'a pas été créé à la tâche 11), `src/server/account-orders.ts`
- Test : `src/server/loyalty.test.ts`

**Interfaces:**
- Produces : `getLoyaltySummary(userId)` (la signature est fixée à la tâche 11), `getOrderHistory(userId): Promise<{ id; number; createdAt; status; totalCents; trackingToken; lines: CartLineInput[]; summary: string }[]>` et `reorderAction(orderId)`. Cette dernière renvoie les lignes encore commandables (en filtrant les produits indisponibles et les éditions terminées), avec la liste des produits ignorés.
- Produces : les actions CRUD sur les adresses (`listAddresses`, `saveAddress`, `deleteAddress`, `setDefaultAddress`), toutes limitées à l'utilisateur connecté.
- L'inscription accepte `?email=` prérempli. Après l'inscription, une page affiche « Vérifie ta boîte mail : tes commandes passées avec cette adresse seront rattachées après vérification ».
- Le tableau de bord contient : la carte à tampons (solde sur `stampsForReward`), la collection d'éditions, l'historique avec « Recommander pareil » (qui remplit le panier puis mène à `/commande`) et les adresses.

- [ ] **Step 1: Écrire le test qui échoue**

```ts
test("getLoyaltySummary counts earn minus redeem and lists tasted editions", async () => { /* EARN 12, REDEEM 10, completed order with edition 6 -> { balance: 2, tastedEditionIds: [ed6] } */ });
```

- [ ] **Step 2: Vérifier l'échec, implémenter, puis vérifier le succès** (`npm run test:int -- loyalty`)

- [ ] **Step 3: Vérifier dans le navigateur**

Expected : inscription, lien affiché dans la console, vérification. Les commandes invitées avec le même e-mail apparaissent dans l'historique, et le solde est correct.

- [ ] **Step 4: Commit** (`feat: add account area with loyalty card, history and addresses`)

---

### Task 15: Admin, coque, tableau de bord et commandes

**Files:**
- Create : `src/app/admin/layout.tsx` (appelle `requireAdmin()` ; barre latérale sur ordinateur, menu sur téléphone), `src/app/admin/page.tsx`, `src/app/admin/commandes/page.tsx`, `src/app/admin/commandes/[id]/page.tsx`, `src/app/admin/commandes/[id]/ticket/page.tsx` et `src/app/api/admin/orders/latest/route.ts`.
- Create : `src/server/admin/orders.ts`, `src/server/admin/stats.ts` et `src/components/admin/*` (`NewOrderAlert` avec un bip Web Audio, `StatusActions`, `OrdersTable`, `BarChart` en SVG fait main).
- Test : `src/server/admin/stats.test.ts`

**Interfaces:**
- Produces :
  - `listOrders(filter: { status?: OrderStatus; mode?: FulfillmentMode; date?: string }): Promise<AdminOrderRow[]>`, trié par `slotAt` croissant pour le jour donné. `AdminOrderRow = { id; number; slotAt; mode; paymentMethod; status; firstName; phone; totalCents; itemsCount }`.
  - `getAdminOrder(id)`, qui renvoie la commande complète avec ses lignes, ses suppléments, ses logs et son client.
  - `getDashboardStats(now: Date): Promise<{ todayCount; todayRevenueCents; weekRevenueCents; toCollectCents; byStatus: Record<OrderStatus, number>; last14Days: { date: string; revenueCents: number }[] }>`. Le chiffre d'affaires ne compte que les commandes COMPLETED, et `toCollectCents` correspond aux commandes AT_PICKUP qui ne sont pas encore terminales.
- Route `latest` : `GET ?since=<iso>` renvoie `{ count, newest }` pour les commandes RECEIVED créées après `since` (réservé à l'admin, sinon 404). `NewOrderAlert` l'interroge toutes les 15 s et joue un bip (oscillateur de 880 Hz pendant 200 ms, deux fois) quand le compte est supérieur à 0. Un bouton « Activer le son » permet de débloquer l'audio dans le navigateur.
- Le détail d'une commande montre :
  - des boutons pour chaque `nextStatuses`, qui appellent `advanceOrderStatus` avec l'e-mail de l'admin comme `actor` ;
  - « Non récupérée » seulement quand le statut est READY et le mode PICKUP ;
  - le badge « À ENCAISSER » quand la commande est AT_PICKUP et non terminale ;
  - « Imprimer le ticket », qui ouvre `/admin/commandes/[id]/ticket`.
- Le ticket est une page en largeur 80 mm (`@page { size: 80mm auto }`) qui lance `window.print()` au chargement. Il contient : numéro, date, mode et créneau, client et téléphone, adresse si livraison, lignes avec cuisson et suppléments, total, et « À ENCAISSER » ou « PAYÉ EN LIGNE ».

- [ ] **Step 1: Écrire le test qui échoue**

```ts
test("getDashboardStats counts only completed revenue and pending cash", async () => { /* COMPLETED 2300 today, AT_PICKUP RECEIVED 1500 today, CANCELLED 999 -> todayRevenueCents 2300, toCollectCents 1500 */ });
```

- [ ] **Step 2: Vérifier l'échec, implémenter, puis vérifier le succès** (`npm run test:int -- stats`)

- [ ] **Step 3: Vérifier dans le navigateur**

Connexion avec le compte admin du seed : passer une commande dans un autre onglet, le bip retentit en 15 s au plus, puis faire avancer la commande jusqu'à COMPLETED et imprimer le ticket. Un utilisateur non admin reçoit une 404 sur `/admin`.

- [ ] **Step 4: Commit** (`feat: add admin shell, dashboard, orders and ticket printing`)

---

### Task 16: Admin, catalogue

**Files:**
- Create : `src/app/admin/produits/page.tsx`, `src/app/admin/produits/[id]/page.tsx` (création si `id = nouveau`), `src/app/admin/categories/page.tsx`, `src/app/admin/supplements/page.tsx`, `src/server/admin/catalog.ts` et `src/app/admin/(catalog)/actions.ts`.
- Test : `src/server/admin/catalog.test.ts`

**Interfaces:**
- Produces :
  - `upsertProduct(input)` avec les champs `name`, `description`, `priceCents`, `discountPercent` (de 0 à 90), `categoryId`, `imageUrl` (chemin sous `/images/` ou URL https), `isAvailable`, `stockQuantity | null`, `isEditionOnly` et `supplementIds` ;
  - `deleteProduct(id)`, qui refuse avec « Produit déjà commandé, rends-le indisponible » si des `OrderItem` existent ;
  - `upsertCategory`, `reorderCategories(ids: string[])`, `deleteCategory` (refusée si des produits y sont rattachés), `upsertSupplement` et `deleteSupplement`.
- Toutes les actions appellent `requireAdmin()` et valident les données avec Zod.
- Les prix se saisissent en euros (« 12,50 ») et sont convertis en centimes par `parseEuros(input: string): number | null`, à ajouter dans `src/lib/money.ts`, avec ses propres tests unitaires (`"12,50" -> 1250`, `"12.5" -> 1250`, `"abc" -> null`).

- [ ] **Step 1: Écrire les tests qui échouent** (`parseEuros`, plus `deleteProduct refuses ordered product`)

- [ ] **Step 2: Vérifier l'échec, implémenter, puis vérifier le succès** (`npm run test:unit -- money && npm run test:int -- admin/catalog`)

- [ ] **Step 3: Commit** (`feat: add admin catalog management`)

---

### Task 17: Admin, éditions, livraison, horaires, fidélité et utilisateurs

**Files:**
- Create : `src/app/admin/editions/page.tsx`, `src/app/admin/livraison/page.tsx`, `src/app/admin/horaires/page.tsx`, `src/app/admin/fidelite/page.tsx`, `src/app/admin/utilisateurs/page.tsx`, `src/app/admin/utilisateurs/[id]/page.tsx`, `src/server/admin/settings.ts` et ses actions.
- Test : `src/server/admin/settings.test.ts`

**Interfaces:**
- Produces :
  - `upsertEdition({ number, productId, startDate, endDate, brothersNote })` : elle utilise `editionBounds`, refuse un chevauchement avec une autre édition (message « Une édition couvre déjà cette période (n°X) ») et exige un produit `isEditionOnly` d'une catégorie `isPizza` ;
  - `upsertZone({ name, postalCodes: string, feeCents, minOrderCents, isActive })` : `postalCodes` est saisi séparé par des virgules ou des espaces, puis normalisé ; un code invalide est refusé avec son nom ;
  - `saveServiceWindows(windows: ServiceWindowLike[])` : elle remplace tout et refuse « HH:MM » invalide, `opensAt >= closesAt` et les fenêtres qui se chevauchent le même jour ;
  - `addClosure(date, reason?)` et `removeClosure(date)` ;
  - `saveLoyaltySettings({ stampsForReward (2 à 50), featuredProductId, pickupLeadMinutes (5 à 120), deliveryLeadMinutes (10 à 180) })` ;
  - `setUserRole(userId, role)`, qui refuse de retirer le rôle ADMIN au dernier admin.
- La page Éditions liste les éditions passées, en cours et à venir, avec un aperçu de l'affiche.
- La page Utilisateurs liste les comptes avec leur solde de tampons et leur nombre de commandes. Le détail affiche l'historique.

- [ ] **Step 1: Écrire les tests qui échouent**

```ts
test("upsertEdition refuses overlapping periods", async () => { /* existing 7: 2026-11-01..2026-12-31; new 8: 2026-12-15..2027-02-28 -> error mentioning "n°7" */ });
test("upsertZone normalizes and rejects invalid codes", async () => { /* "31 000, 31100 31200" -> ["31000","31100","31200"]; "31000, 3110" -> error mentioning "3110" */ });
test("saveServiceWindows rejects overlaps", async () => { /* weekday 1: 11:30-14:00 and 13:30-15:00 -> error */ });
test("setUserRole keeps at least one admin", async () => { /* single admin -> USER refused */ });
```

- [ ] **Step 2: Vérifier l'échec, implémenter, puis vérifier le succès** (`npm run test:int -- admin/settings`)

- [ ] **Step 3: Commit** (`feat: add admin editions, delivery zones, hours, loyalty and users`)

---

### Task 18: Tests de bout en bout

**Files:**
- Create : `playwright.config.ts`, `e2e/global-setup.ts` (`prisma migrate reset --force` puis seed, sur la base de test), `e2e/fixtures.ts` (horloge du navigateur via Playwright `page.clock.setFixedTime`, alignée sur `OFRERO_NOW` côté serveur), `e2e/guest-pickup.spec.ts`, `e2e/guest-delivery.spec.ts`, `e2e/account.spec.ts` et `e2e/admin.spec.ts`.

**Interfaces:**
- `webServer` : `npm run build && npm run start -- -p 3100`, avec `env` chargé depuis `.env.test`, `E2E=1` et `OFRERO_NOW=2026-11-19T18:02:00Z`.

Scénarios (spec, section 10) :
- `guest-pickup` : depuis l'accueil, « Commander » sur la Savoyarde, ajout, Continuer, mode à emporter avec le créneau 19:30, coordonnées, « Payer au retrait ». La confirmation affiche « 19:30 » et « à régler sur place ».
- `guest-delivery` : le code postal 75001 affiche le refus hors zone, 31100 affiche 2,50 € de frais. Le paiement Stripe ne tourne que si `STRIPE_SECRET_KEY` commence par `sk_test_` (sinon le test est sauté et le rapport l'indique) : carte 4242, retour sur `/suivi`, puis l'état « Reçue » est attendu (webhook via `stripe listen`, documenté dans le README).
- `account` : une commande invitée avec `e2e@exemple.fr`, puis l'inscription avec le même e-mail. Le lien de vérification est lu dans la table `verification` via Prisma, puis ouvert. Le compte voit la commande et 0 tampon. L'admin fait passer la commande à COMPLETED, puis le compte voit 2 tampons. Un compte seedé avec 10 tampons utilise sa pizza offerte, et le total baisse du prix de la pizza.
- `admin` : connexion, la nouvelle commande apparaît, les étapes avancent, et la page `/suivi` (dans un second contexte) affiche « Prête » en 10 s au plus.

- [ ] **Step 1: Écrire les scénarios et vérifier qu'ils échouent ou passent selon ce qui est déjà construit**

Run : `npx playwright install chromium && npm run test:e2e`

- [ ] **Step 2: Corriger les écarts trouvés**, en ajoutant un test unitaire ou d'intégration pour chaque bug de logique trouvé

- [ ] **Step 3: Vérifier**

Run : `npm run test:e2e`
Expected : tous les tests passent, sauf le paiement Stripe, qui est sauté sans clé de test.

- [ ] **Step 4: Commit** (`test: add end-to-end flows for guest, account and admin`)

---

### Task 19: Nettoyage, documentation et vérification finale

**Files:**
- Delete : `O-FreroApp/ofrero-webfront/`, `O-FreroApp/ofrero-api/`, `O-FreroApp/.eslintrc.json`, `package.json` (racine).
- Create : `README.md` (racine), qui décrit le projet, la stack et ses versions, le démarrage local (Node 24, `npm run db:up`, `cp .env.example .env`, `npm run db:migrate`, `npm run db:seed`, `npm run dev`), les tests, Stripe en local (`stripe listen`), les e-mails (Resend facultatif) et le déploiement (Vercel + Postgres hébergé, variables à définir, webhook Stripe à créer). Il renvoie aussi vers la documentation Holberton.
- Ne pas toucher : les fichiers `* (Stage N).md` et `Templates/`.

- [ ] **Step 1: Supprimer les anciens dossiers et le `package.json` racine, puis vérifier qu'aucun fichier de `web/` ne les référence**

Run (depuis la racine) : `grep -rn "ofrero-webfront\|ofrero-api" O-FreroApp/web --include=*.ts --include=*.tsx --include=*.json`
Expected : aucun résultat.

- [ ] **Step 2: Écrire le README**

- [ ] **Step 3: Faire la vérification complète**

Run : `npm run lint && npm run typecheck && npm test && npm run build && npm run test:e2e`
Expected : tout passe. Noter le nombre de tests de chaque suite dans le message final.

- [ ] **Step 4: Faire le contrôle visuel final**

Dans le navigateur, à 375 px et à 1280 px, vérifier l'accueil, la carte, la commande, le suivi, le compte et l'admin, en mouvement normal et réduit, sans erreur dans la console.

- [ ] **Step 5: Commit** (`chore: remove legacy apps and rewrite README`)
