# Fidélisation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Faire revenir les clients avec :
- la recommande en deux touches ;
- le vote, la révélation et la collection des éditions ;
- une fidélité visible et le parrainage ;
- Apple Pay et Google Pay ;
- la note après le retrait ;
- les soirs de match ;
- les mesures dans l'admin.

**Architecture :**
- Les règles pures vont dans `src/domain/` : solde de tampons, phrase de progression, créneaux du soir de match, médiane.
- Les accès base vont dans `src/server/`, avec un fichier par sujet : `reorder.ts`, `referrals.ts`, `polls.ts`, `ratings.ts`, `match-nights.ts`, et `admin/stats.ts` étendu.
- L'interface est en composants client avec Motion, déjà installé.
- Ce que garde le téléphone passe par `localStorage`, dans des modules dédiés de `src/lib/device-storage.ts`.

**Tech Stack:** Next.js 16, React 19, Prisma 7, Better Auth 1.7, Stripe (`@stripe/react-stripe-js` déjà installé, `ExpressCheckoutElement`), Motion 14, Zod 4, Vitest 5, Playwright.

**Spec:** `docs/superpowers/specs/2026-11-20-fidelisation-design.md`

Commandes depuis `O-FreroApp/web` avec `export PATH=/Users/sofian/.local/node/bin:$PATH`, avec la base locale sur le port 5433. Les migrations se créent avec `npx prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma --script -o prisma/migrations/<ts>_<nom>/migration.sql`, puis s'appliquent avec `npx prisma migrate deploy && npx prisma generate` (`migrate dev` refuse le mode non interactif). Ne jamais lancer `migrate reset`. Après une migration, redémarre le serveur de dev, qui garde l'ancien client Prisma en mémoire.

## Global Constraints

- Aucun emoji. Interface en français, au tutoiement.
- Rien n'est obligatoire pour commander. Le serveur recalcule les prix et valide les créneaux.
- `localStorage` passe toujours par try/catch, et le site marche sans.
- Les données gardées sur le téléphone n'en sortent pas.
- Les animations respectent `prefers-reduced-motion` : `MotionConfig reducedMotion="user"` est déjà en place.
- Chaque page admin appelle `await requireAdmin()`, et chaque action admin aussi. Le test `admin-guard.test.ts` le vérifie.
- **Fidélité :**
  - pas de tampon en livraison ;
  - parrainage : 1 tampon au parrain et 1 au filleul, à la première commande à emporter COMPLETED du filleul, une seule fois ;
  - aucun double crédit, grâce à `@@unique([orderId, kind])`.
- **Textes exacts :**
  - « Recommander » ;
  - « Oublier ces informations » ;
  - « Connecte-toi pour voter » ;
  - « Alors, c'était comment ? », avec les réponses « Bof », « Bon » et « Excellent » ;
  - « Pour le match » ;
  - « Inviter un ami ».
- **Délais :**
  - la commande du soir de match ouvre dès la veille ;
  - le bandeau s'affiche de 3 jours avant jusqu'au jour J ;
  - le code de parrainage reste sur le téléphone 30 jours ;
  - le commentaire de note fait 280 caractères au plus ;
  - les mesures portent sur 90 jours, les notes du tableau de bord sur 30 jours.

## Review Focus

1. **Recommande d'une commande dont un produit ou une option a disparu.**
   - Les lignes valides passent, les autres sont nommées, et rien ne plante.
   - Test : `checkOrderableLines` en Task 2.
2. **Vote envoyé deux fois ou après la clôture.**
   - Le serveur refuse avec ALREADY_VOTED ou CLOSED.
   - Les pourcentages ne fuient pas avant le vote.
   - Test en Task 5.
3. **Filleul qui termine deux commandes, ou qui se parraine lui-même.**
   - Un seul bonus, et aucun pour soi-même.
   - Test en Task 4.
4. **Créneau « Pour le match » envoyé un autre jour que la veille ou le jour J, ou hors du service du soir.**
   - Refus INVALID_SLOT.
   - Test en Task 7.
5. **Note sur une commande non terminée, ou deuxième note.**
   - Refus NOT_COMPLETED ou ALREADY_RATED.
   - Test en Task 6.

---

### Task 1: Schéma et solde de tampons

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/20261120200000_retention/migration.sql`
- Modify:
  - `src/domain/loyalty.ts`, `src/domain/loyalty.test.ts`
  - `src/server/test/db.ts` (TABLES), `src/server/test/fixtures.ts`

**Interfaces:**
- **Produces, schéma :**
  - `enum OrderSource { WEB REORDER }` et `Order.source OrderSource @default(WEB)` ;
  - `enum LoyaltyKind { EARN REDEEM REFERRER_BONUS REFEREE_BONUS }` ;
  - `User.referralCode String? @unique` et `User.referredById String?`, avec une relation self `referredBy`/`referrals` en `onDelete: SetNull` ;
  - `Poll { id, title, closesAt DateTime, candidates PollCandidate[], votes PollVote[], createdAt }` ;
  - `PollCandidate { id, pollId, name, description String?, position Int }`, en Cascade ;
  - `PollVote { id, pollId, candidateId, userId, createdAt, @@unique([pollId, userId]) }`, en Cascade sur le sondage, le candidat et l'utilisateur ;
  - `OrderRating { orderId String @id, score Int, comment String?, createdAt }` : relation 1-1 avec `Order`, en Cascade ;
  - `MatchNight { id, date String @unique, title String, message String?, createdAt }` : `date` est un jour de Paris au format « YYYY-MM-DD ».
- **Produces, domaine :** `stampBalance` compte REFERRER_BONUS et REFEREE_BONUS comme des gains.
- **Produces, fixtures :**
  - `makeOrder` accepte `source?`, `customerEmail?` et `createdAt?`, et `completed` passe par `status` ;
  - `makeUser` accepte `referredById?` et `referralCode?`.

- [ ] **Step 1: Failing test** (`loyalty.test.ts`)

```ts
test("referral bonuses count as earned stamps", () => {
  expect(stampBalance([{ kind: "EARN", stamps: 3 }, { kind: "REFERRER_BONUS", stamps: 1 }, { kind: "REFEREE_BONUS", stamps: 1 }, { kind: "REDEEM", stamps: 2 }])).toBe(3);
});
```

- [ ] **Step 2:** `npx vitest run src/domain/loyalty.test.ts`. Expected : FAIL (erreur de type, puis 3 ≠ 1).
- [ ] **Step 3:**
  - Modifie le schéma, génère et édite la migration, applique-la et régénère le client.
  - `stampBalance(entries: { kind: LoyaltyKind; stamps: number }[])` : tout ce qui n'est pas REDEEM s'ajoute.
  - Ajoute les nouvelles tables à `TABLES`, enfants avant parents : `PollVote`, `PollCandidate`, `Poll`, `OrderRating`, `MatchNight`.
- [ ] **Step 4:** `npx vitest run && npm run typecheck`. Expected : tout est vert.
- [ ] **Step 5: Commit** `feat(db): polls, ratings, match nights, referrals and order source`

### Task 2: Recommander en deux touches

**Files:**
- Create:
  - `src/server/reorder.ts`, `src/server/reorder.test.ts`
  - `src/lib/device-storage.ts`
  - `src/components/home/ReorderCard.tsx`
- Modify:
  - `src/server/account-orders.ts` (`reorderLines` réutilise `checkOrderableLines`)
  - `src/app/actions/cart.ts` (action `checkLinesAction`), `src/app/actions/account.ts`
  - `src/server/orders.ts` (`source`)
  - `src/components/order/Checkout.tsx`, `src/components/account/ReorderButton.tsx`
  - `src/app/(site)/page.tsx`

**Interfaces:**
- **Produces, serveur :**
  - `checkOrderableLines(lines: CartLineInput[], now: Date): Promise<{ lines: DescribedLine[]; skipped: string[] }>`, dans `src/server/reorder.ts`.
    - Une ligne est gardée si son produit est disponible, en stock, dans son édition, et si `resolveChoices` réussit.
    - Les suppléments qui ne sont plus permis sont retirés, sans écarter la ligne.
    - Une ligne écartée ajoute son nom à `skipped`, le nom venant de la ligne elle-même s'il est fourni (champ `name?`), sinon `"Un produit"`.
  - `getLastAccountOrderSummary(userId: string): Promise<{ orderId: string; summary: string } | null>`.
  - `checkLinesAction(lines)`, avec le même retour.
- **Produces, commande :** `placeOrderSchema.source: z.enum(["WEB", "REORDER"]).default("WEB")` est stocké dans `Order.source`.
- **Produces, téléphone (`device-storage.ts`) :**
  - `saveLastOrder(o: LastOrder)`, `readLastOrder(): LastOrder | null` et `forgetLastOrder()` ;
  - `LastOrder = { lines: CartItem[]; mode: FulfillmentMode; customer: { firstName; phone; email }; address?: { line1; line2?; postalCode; city }; savedAt: string }`, sous la clé `"ofrero-last-order-v1"` ;
  - `markReorder()` et `takeReorderFlag(): boolean`, en `sessionStorage` sous `"ofrero-reorder"`.
- **Produces, interface :**
  - `Checkout` appelle `saveLastOrder` dès que `placeOrderAction` réussit, avant le paiement ou la redirection. Il envoie `source: takeReorderFlag() ? "REORDER" : "WEB"` et préremplit le client depuis `readLastOrder()` quand il n'y a pas de compte, ou que les champs du compte sont vides.
  - `ReorderCard` (client) reçoit `account?: { orderId; summary }`. Il lit `readLastOrder()`, sinon utilise `account`.
    - Il affiche le résumé (`2 × Reine · Taille : Large 33 cm, 1 × Boisson 33 cl`) et le total (via `quoteCartAction`).
    - Le bouton « Recommander » appelle `checkLinesAction` ou `reorderAction`, remplace le panier par les lignes gardées, appelle `markReorder()`, puis va sur `/commande`. Les produits écartés s'affichent dans un message.
    - Le lien « Oublier ces informations » appelle `forgetLastOrder()` et masque la carte.
  - `ReorderButton` appelle `markReorder()`.

- [ ] **Step 1: Failing tests** (`reorder.test.ts`, avec les fixtures et un groupe Taille)

```ts
test("keeps orderable lines and names the skipped ones", async () => {
  const r = await checkOrderableLines([valid, { ...valid, productId: unavailable.id, name: "Hawaïenne" }, { ...valid, choices: [{ slotId: slot.id, optionId: "gone" }], name: "Reine" }], NOW);
  expect(r.lines).toHaveLength(1);
  expect(r.skipped).toEqual(["Hawaïenne", "Reine"]);
});
test("drops supplements that are no longer offered but keeps the line", async () => { expect(r.lines[0].supplementIds).toEqual([]); });
test("placeOrder stores the reorder source", async () => { expect(order.source).toBe("REORDER"); });
test("last account order summary lists items with choices", async () => { expect(s?.summary).toBe("2 × Reine · Taille : Large 33 cm"); });
```

- [ ] **Step 2:** `npx vitest run src/server/reorder.test.ts`. Expected : FAIL.
- [ ] **Step 3: Implement.** `reorderLines` garde son comportement : les tests existants de `account.test.ts` restent verts.
- [ ] **Step 4:** `npx vitest run src/server && npm run typecheck && npm run lint`. Expected : tout est vert.
- [ ] **Step 5: Commit** `feat: reorder the last order in two taps`

### Task 3: Fidélité visible

**Files:**
- Create: `src/domain/loyalty-hint.ts`, `src/domain/loyalty-hint.test.ts`, `src/components/loyalty/PizzaStampCard.tsx`, `src/components/loyalty/StampHint.tsx`
- Modify: `src/components/home/LoyaltyCard.tsx`, `src/components/cart/CartSheet.tsx`, `src/components/order/DetailsStep.tsx`, `src/app/actions/cart.ts`

**Interfaces:**
- **Produces, domaine :** `stampHint(o: { signedIn: boolean; mode: FulfillmentMode | null; balance: number; stampsForReward: number }): string | null`.
  - En livraison, il renvoie `null`.
  - Pour un invité à emporter ou sans mode, il renvoie « Avec un compte, cette commande te rapporterait 1 tampon. ».
  - Pour un compte dont le solde atteint le seuil, il renvoie « Ta pizza offerte t'attend. ».
  - Sinon, il renvoie « Cette commande te rapporte 1 tampon : plus que N commande(s) avant ta pizza offerte. », avec N = seuil − solde − 1 ; à 0, « Cette commande te rapporte 1 tampon : ta prochaine pizza sera offerte. ».
- **Produces, action :** `loyaltyHintAction(): Promise<{ signedIn: boolean; balance: number; stampsForReward: number }>`.
- **Produces, interface :**
  - `PizzaStampCard({ filled, total })` : une pizza en SVG découpée en `total` parts. Les parts `< filled` sont garnies, avec une apparition décalée via Motion. Elle remplace l'affichage des tampons dans `LoyaltyCard`, et garde ses textes.
  - `StampHint` affiche la phrase. Elle est sous le total du `CartSheet` (mode `null`, via l'action) et dans `DetailsStep` (mode réel). Le lien d'inscription n'apparaît que pour l'invité.

- [ ] **Step 1: Failing tests** (`loyalty-hint.test.ts`)

```ts
test("delivery shows nothing", () => expect(stampHint({ signedIn: true, mode: "DELIVERY", balance: 3, stampsForReward: 10 })).toBeNull());
test("guest is invited", () => expect(stampHint({ signedIn: false, mode: "PICKUP", balance: 0, stampsForReward: 10 })).toBe("Avec un compte, cette commande te rapporterait 1 tampon."));
test("counts what is left", () => expect(stampHint({ signedIn: true, mode: "PICKUP", balance: 7, stampsForReward: 10 })).toBe("Cette commande te rapporte 1 tampon : plus que 2 commandes avant ta pizza offerte."));
test("last one before the reward", () => expect(stampHint({ signedIn: true, mode: "PICKUP", balance: 9, stampsForReward: 10 })).toBe("Cette commande te rapporte 1 tampon : ta prochaine pizza sera offerte."));
test("reward ready", () => expect(stampHint({ signedIn: true, mode: null, balance: 10, stampsForReward: 10 })).toBe("Ta pizza offerte t'attend."));
```

- [ ] **Step 2:** `npx vitest run src/domain/loyalty-hint.test.ts`. Expected : FAIL.
- [ ] **Step 3: Implement**, then the components.
- [ ] **Step 4:** `npx vitest run src/domain && npm run typecheck && npm run lint`. Expected : tout est vert.
- [ ] **Step 5: Commit** `feat: illustrated stamp card and loyalty progress in the cart`

### Task 4: Parrainage

**Files:**
- Create:
  - `src/server/referrals.ts`, `src/server/referrals.test.ts`
  - `src/components/account/ReferralCard.tsx`, `src/components/site/ReferralCapture.tsx`
- Modify:
  - `src/lib/auth.ts` (champ additionnel + hook), `src/components/account/AuthForms.tsx`
  - `src/server/lifecycle.ts` (`creditStamps`)
  - `src/app/(site)/compte/page.tsx`, `src/app/(site)/layout.tsx`
  - `src/lib/device-storage.ts`

**Interfaces:**
- **Produces, serveur :**
  - `generateReferralCode(): string` : 6 caractères tirés de `ABCDEFGHJKMNPQRSTUVWXYZ23456789`.
  - `ensureReferralCode(userId: string): Promise<string>` : crée le code si absent, et réessaie en cas de collision (P2002).
  - `resolveReferrer(code: string | undefined | null): Promise<string | null>` : renvoie l'id de l'utilisateur, ou null. Le code est mis en majuscules, sans espaces.
  - `creditReferralBonus(tx, order: { id; userId; mode })`, appelé par `creditStamps` après le tampon normal.
    - Si la commande est à emporter, que l'utilisateur a un `referredById` différent de lui-même et qu'aucune entrée REFEREE_BONUS n'existe pour lui, il crée REFEREE_BONUS (1, filleul) et REFERRER_BONUS (1, parrain) sur cette commande.
  - `getReferralSummary(userId): Promise<{ code: string; friends: number; stampsEarned: number }>`.
- **Produces, inscription :**
  - Better Auth `user.additionalFields.referralCodeUsed` (string, `input: true`, `required: false`).
  - `databaseHooks.user.create.before` fixe `referredById` avec `resolveReferrer(user.referralCodeUsed)`. Vérifie la signature du hook dans les types de `better-auth`.
- **Produces, téléphone et interface :**
  - `saveReferralCode(code)` et `readReferralCode()`, sous la clé `"ofrero-parrain"`, avec une expiration à 30 jours.
  - `ReferralCapture` (client, dans le layout du site) lit `?parrain=` au montage et l'enregistre.
  - Le formulaire d'inscription gagne le champ facultatif « Code de parrainage », prérempli depuis le téléphone.
  - `ReferralCard`, sur la page Compte, montre le lien `${origin}/?parrain=CODE` et le bouton « Inviter un ami » : `navigator.share` s'il existe, sinon copie avec la confirmation « Lien copié ». Il affiche « N ami(s) parrainé(s) · N tampon(s) gagné(s) ».

- [ ] **Step 1: Failing tests**

```ts
test("codes avoid ambiguous characters", () => expect(generateReferralCode()).toMatch(/^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{6}$/));
test("resolveReferrer normalises the code", async () => expect(await resolveReferrer(" ab3k9z ")).toBe(parrain.id));
test("first completed pickup order of the referee credits both once", async () => {
  // filleul.referredById = parrain.id; two pickup orders completed in turn
  expect(await balance(filleul.id)).toBe(1 + 1 + 1); // two normal stamps + one bonus
  expect(await balance(parrain.id)).toBe(1);
});
test("delivery orders and self-referral give no bonus", async () => { expect(await balance(parrain.id)).toBe(0); });
test("sign-up with a code stores the referrer", async () => { expect(user.referredById).toBe(parrain.id); }); // via auth.api.signUpEmail with referralCodeUsed
```

- [ ] **Step 2:** `npx vitest run src/server/referrals.test.ts`. Expected : FAIL.
- [ ] **Step 3: Implement**, then the UI.
- [ ] **Step 4:** `npx vitest run src/server && npm run typecheck && npm run lint`. Expected : tout est vert.
- [ ] **Step 5: Commit** `feat: referral codes with a stamp for both friends`

### Task 5: L'édition comme rendez-vous (vote, révélation, collection)

**Files:**
- Create:
  - `src/server/polls.ts`, `src/server/polls.test.ts`
  - `src/app/actions/polls.ts`
  - `src/components/home/PollCard.tsx`, `src/components/home/NextEditionTeaser.tsx`, `src/components/home/CollectionProgress.tsx`
  - `src/app/admin/votes/page.tsx`, `src/components/admin/PollsManager.tsx`
- Modify:
  - `src/server/catalog.ts` (`getHomeData.next`), `src/components/admin/AdminNav.tsx`
  - `src/app/(site)/page.tsx`, `src/app/(site)/editions/page.tsx`, `src/app/(site)/compte/page.tsx`
  - `src/components/home/EditionsArchive.tsx`

**Interfaces:**
- **Produces, vote :**
  - `getPollView(now: Date, userId: string | null): Promise<PollView | null>`.
    - Il renvoie le dernier sondage tant que `now < closesAt`, ou s'il est clos et qu'aucune édition n'a commencé entre `closesAt` et `now`.
    - `PollView = { id; title; closesAt: string; closed: boolean; myCandidateId: string | null; candidates: { id; name; description: string | null; percent: number | null }[] }`.
    - `percent` vaut null tant que l'utilisateur n'a pas voté et que le vote est ouvert. Une fois connu, il est arrondi à l'entier, et la gagnante passe en tête si le vote est clos.
  - `castVote(userId: string, candidateId: string, now: Date): Promise<{ ok: true } | { ok: false; error: "NOT_FOUND" | "CLOSED" | "ALREADY_VOTED" }>`.
  - `voteAction(candidateId)` : sans session, il renvoie `{ ok: false, error: "SIGN_IN" }`.
  - Admin : `listPollsAdmin()`, `createPoll({ title; closesOn: "YYYY-MM-DD"; candidates: { name; description? }[] })` et `deletePoll(id)`.
    - `createPoll` exige exactement 3 candidats aux noms non vides. La clôture est fixée à minuit, heure de Paris, le lendemain de `closesOn`.
- **Produces, révélation :** `HomeData.next: { number: number; startsAt: string } | null`, la première édition dont `startsAt > now`. Ni le nom ni le produit ne sont envoyés.
- **Produces, collection :** `CollectionProgress({ tasted, total, newIds })` affiche « X éditions goûtées sur Y ».
  - Les ids goûtés absents de `localStorage["ofrero-collection-seen"]` reçoivent l'animation « Nouvelle dans ta collection », puis sont mémorisés.

- [ ] **Step 1: Failing tests**

```ts
test("percentages stay hidden until the user votes", async () => { expect(view!.candidates.every((c) => c.percent === null)).toBe(true); });
test("a second vote is refused and votes after closing too", async () => {
  expect(await castVote(u.id, a.id, NOW)).toEqual({ ok: true });
  expect(await castVote(u.id, b.id, NOW)).toEqual({ ok: false, error: "ALREADY_VOTED" });
  expect(await castVote(v.id, a.id, AFTER_CLOSE)).toEqual({ ok: false, error: "CLOSED" });
});
test("results show the winner first once closed", async () => { expect(view!.candidates[0]).toMatchObject({ name: "Burrata", percent: 67 }); });
test("the poll disappears once the next edition has started", async () => { expect(await getPollView(AFTER_NEXT_EDITION, null)).toBeNull(); });
test("createPoll needs three named candidates", async () => { expect(await createPoll({ title: "x", closesOn: "2026-12-20", candidates: [{ name: "a" }, { name: "b" }] })).toMatchObject({ ok: false }); });
test("home data reveals only the number and start of the next edition", async () => { expect(home.next).toEqual({ number: 2, startsAt: "2026-12-31T23:00:00.000Z" }); expect(JSON.stringify(home)).not.toContain("Secrète"); });
```

- [ ] **Step 2:** `npx vitest run src/server/polls.test.ts`. Expected : FAIL.
- [ ] **Step 3: Implement** the server, actions, admin page, then the UI.
  - Le vote s'affiche sous l'affiche de l'édition, sur l'accueil et sur la page Éditions.
  - Le teaser apparaît sous le vote quand `next` existe, avec un compte à rebours (réutilise `Countdown`) et une silhouette : une pizza floutée avec un point d'interrogation.
- [ ] **Step 4:** `npx vitest run && npm run typecheck && npm run lint`. Expected : tout est vert.
- [ ] **Step 5: Commit** `feat: vote for the next edition, reveal countdown and collection progress`

### Task 6: Note après le retrait

**Files:**
- Create: `src/server/ratings.ts`, `src/server/ratings.test.ts`, `src/components/order/RateOrder.tsx`
- Modify:
  - `src/app/actions/order.ts` (`rateOrderAction`)
  - `src/server/lifecycle.ts` (`TrackingView.rating`, `TrackingView.canRate`)
  - `src/components/order/TrackingView.tsx`
  - `src/server/admin/orders.ts`, `src/app/admin/commandes/[id]/page.tsx`

**Interfaces:**
- **Produces :**
  - `rateOrder(token: string, score: 1 | 2 | 3, comment?: string): Promise<{ ok: true } | { ok: false; error: "NOT_FOUND" | "NOT_COMPLETED" | "ALREADY_RATED" | "INVALID" }>`. Le commentaire est nettoyé, et vaut null s'il est vide ou fait plus de 280 caractères (INVALID).
  - `RATING_LABELS = { 1: "Bof", 2: "Bon", 3: "Excellent" }`, dans `src/domain/ratings.ts`.
  - `TrackingView` gagne `rating: { score; comment } | null` et `canRate: boolean` (statut COMPLETED et pas encore noté).
  - `RateOrder` affiche « Alors, c'était comment ? » avec les trois boutons et un commentaire facultatif, puis le remerciement « Merci, c'est noté. ».

- [ ] **Step 1: Failing tests**

```ts
test("only completed orders can be rated, once", async () => {
  expect(await rateOrder(received.trackingToken, 3)).toEqual({ ok: false, error: "NOT_COMPLETED" });
  expect(await rateOrder(done.trackingToken, 3, "  Top  ")).toEqual({ ok: true });
  expect(await rateOrder(done.trackingToken, 1)).toEqual({ ok: false, error: "ALREADY_RATED" });
  expect(await prisma.orderRating.findUnique({ where: { orderId: done.id } })).toMatchObject({ score: 3, comment: "Top" });
});
test("too long comments are refused", async () => { expect(await rateOrder(done2.trackingToken, 2, "x".repeat(281))).toEqual({ ok: false, error: "INVALID" }); });
test("tracking exposes canRate", async () => { expect((await getTracking(done3.trackingToken))?.canRate).toBe(true); });
```

- [ ] **Step 2:** `npx vitest run src/server/ratings.test.ts`. Expected : FAIL.
- [ ] **Step 3: Implement**, then the UI.
- [ ] **Step 4:** `npx vitest run src/server && npm run typecheck && npm run lint`. Expected : tout est vert.
- [ ] **Step 5: Commit** `feat: one-tap rating after pickup`

### Task 7: Soirs de match

**Files:**
- Create:
  - `src/server/match-nights.ts`, `src/server/match-nights.test.ts`
  - `src/components/site/MatchBanner.tsx`
  - `src/app/admin/soirees/page.tsx`, `src/components/admin/MatchNightsManager.tsx`
- Modify:
  - `src/domain/slots.ts` (+ test)
  - `src/app/actions/order.ts` (`SlotsResult.match`), `src/server/orders.ts` (validation du créneau)
  - `src/components/order/ModeStep.tsx`
  - `src/app/(site)/layout.tsx`, `src/components/admin/AdminNav.tsx`

**Interfaces:**
- **Produces, domaine :** `eveningSlots(o: SlotOptions, day: string): Date[]`.
  - Il prend le dernier service ouvert (`ServiceWindow`) du jour `day` (« YYYY-MM-DD », Paris).
  - Il en génère les créneaux avec les mêmes règles que `computeSlots` : délai depuis `now`, pas de 15 minutes, `lastSlotBeforeCloseMinutes`.
  - Il renvoie `[]` si le jour est fermé ou dans `closures`.
- **Produces, serveur :**
  - `getMatchForOrdering(now: Date): Promise<{ title: string; day: string } | null>` : une soirée dont la date est aujourd'hui ou demain, à Paris.
  - `getBannerMatch(now: Date): Promise<{ title; message: string | null; day: string } | null>` : une soirée dans les 3 prochains jours, aujourd'hui compris.
  - `matchSlotsFor(mode, now): Promise<{ title; day; slots: Date[] } | null>`.
  - `placeOrder` accepte un créneau valide pour `computeSlots`, ou présent dans `matchSlotsFor`. Sinon INVALID_SLOT.
  - `SlotsResult.match: { title: string; dayLabel: string; slots: string[] } | null`.
  - Admin : `listMatchNightsAdmin()`, `addMatchNight({ date, title, message? })` et `deleteMatchNight(id)`. Les dates passées sont refusées.
- **Produces, interface :**
  - `ModeStep` montre, quand `match` existe, deux onglets « Maintenant » et « Pour le match », avec `Segmented`. « Pour le match » affiche les créneaux du soir de match avec le même sélecteur.
  - `MatchBanner` (serveur, dans le layout du site) affiche « Soir de match · {titre} · {jour} » et le message.

- [ ] **Step 1: Failing tests**

```ts
// slots.test.ts
test("eveningSlots gives tomorrow's evening service the day before", () => {
  const s = eveningSlots(opts("2026-11-20T10:00:00Z"), "2026-11-21");
  expect(formatParisTime(s[0])).toBe("18:00");
  expect(formatParisTime(s.at(-1)!)).toBe("21:45");
});
test("eveningSlots respects closures", () => expect(eveningSlots(opts("2026-11-20T10:00:00Z", { closures: ["2026-11-21"] }), "2026-11-21")).toEqual([]));
// match-nights.test.ts
test("a pickup order for tomorrow's match evening is accepted the day before", async () => { expect(r).toMatchObject({ ok: true }); });
test("the same slot without a match night is refused", async () => { expect(r).toMatchObject({ ok: false, error: "INVALID_SLOT" }); });
test("a match two days ahead does not open ordering yet but shows the banner", async () => {
  expect(await getMatchForOrdering(NOW)).toBeNull();
  expect(await getBannerMatch(NOW)).toMatchObject({ title: "France – Angleterre" });
});
```

- [ ] **Step 2:** `npx vitest run src/domain/slots.test.ts src/server/match-nights.test.ts`. Expected : FAIL.
- [ ] **Step 3: Implement**, then the UI.
- [ ] **Step 4:** `npx vitest run && npm run typecheck && npm run lint`. Expected : tout est vert.
- [ ] **Step 5: Commit** `feat: match nights with a banner and evening pre-orders`

### Task 8: Apple Pay et Google Pay

**Files:** Modify `src/components/order/StripePayment.tsx` and `README.md` (section Stripe).

**Interfaces:**
- **Produces :** `ExpressCheckoutElement` au-dessus de `PaymentElement`.
  - Son conteneur reste masqué tant que `onReady` n'indique aucun moyen disponible (`event.availablePaymentMethods`).
  - `onConfirm` appelle `stripe.confirmPayment({ elements, confirmParams: { return_url } })` avec le même `return_url` que « Payer ».
  - Un séparateur « ou par carte » s'affiche quand les boutons sont visibles.
- **Produces, README :** activer Apple Pay et Google Pay dans Stripe, et enregistrer le domaine en production.

- [ ] **Step 1:** Implement. Vérifie les noms des props dans `node_modules/@stripe/react-stripe-js/dist/react-stripe.d.ts`.
- [ ] **Step 2:** `npm run typecheck && npm run lint && npm run build`. Expected : vert. Sans clés Stripe, le parcours local est inchangé.
- [ ] **Step 3: Commit** `feat: Apple Pay and Google Pay on the payment step`

### Task 9: Mesures dans l'admin

**Files:**
- Modify: `src/server/admin/stats.ts` (+ `stats.test.ts`), `src/app/admin/page.tsx`
- Create: `src/domain/stats.ts` (+ test)

**Interfaces:**
- **Produces, domaine :** `median(values: number[]): number | null`.
- **Produces, serveur :** `getRetentionStats(now: Date): Promise<RetentionStats>`.
  - `RetentionStats = { customers: number; returningPercent: number; medianDaysBetweenOrders: number | null; reorderPercent: number; referrals: number; ratingAverage: number | null; ratingCount: number }`, sur 90 jours.
  - Il ne compte que les commandes RECEIVED à COMPLETED et NOT_COLLECTED. Un client est identifié par son `customerEmail`.
  - `referrals` compte les entrées REFEREE_BONUS de la période. La note moyenne est arrondie à une décimale.
- **Produces, notes :** `getRecentRatings(now)` renvoie la moyenne sur 30 jours et les 5 derniers commentaires.
- **Produces, interface :** le tableau de bord affiche le bloc « Clients qui reviennent » et le bloc « Notes ».

- [ ] **Step 1: Failing tests**

```ts
test("median", () => { expect(median([])).toBeNull(); expect(median([3, 1, 2])).toBe(2); expect(median([1, 2, 3, 4])).toBe(2.5); });
test("retention over 90 days", async () => {
  // a@: orders on day 0 and day 10 (one REORDER); b@: one order; c@: one CANCELLED order (ignored)
  expect(await getRetentionStats(NOW)).toMatchObject({ customers: 2, returningPercent: 50, medianDaysBetweenOrders: 10, reorderPercent: 33 });
});
```

- [ ] **Step 2:** `npx vitest run src/domain/stats.test.ts src/server/admin/stats.test.ts`. Expected : FAIL.
- [ ] **Step 3: Implement**, then the UI.
- [ ] **Step 4:** `npx vitest run && npm run typecheck && npm run lint`. Expected : tout est vert.
- [ ] **Step 5: Commit** `feat(admin): retention and ratings dashboard`

### Task 10: Parcours de bout en bout et vérification

**Files:** Create `e2e/retention.spec.ts`. Modify `e2e/helpers.ts` if needed.

- [ ] **Step 1: E2E**, avec `OFRERO_NOW` = 2026-11-19 19:02.

```ts
test("a guest reorders the last order from the home page in two taps", async ({ page }) => {
  // place a pickup order with Margarita, then go home
  await page.goto("/");
  await page.getByRole("button", { name: "Recommander" }).click();
  await expect(page).toHaveURL(/\/commande$/);
  await page.getByRole("button", { name: "19:30", exact: true }).click();
  await page.getByRole("button", { name: "Continuer" }).click();
  await expect(page.getByLabel("Prénom")).toHaveValue("Léa");
});
test("a completed order can be rated from its tracking page", async ({ page, browser }) => { /* admin completes, then tap "Excellent" */ await expect(page.getByText("Merci, c'est noté.")).toBeVisible(); });
```

- [ ] **Step 2: Full verification.** `npm run lint && npm run typecheck && npm test && npm run build && npm run test:e2e`. Expected : tout est vert, sauf le paiement Stripe réel, ignoré.
- [ ] **Step 3: Commit** `test(e2e): reorder and rating flows`
