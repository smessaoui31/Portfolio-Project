# O'Frero Pizza

Site de commande en ligne d'une pizzeria au feu de bois tenue par deux frères à Toulouse (288 rue Henri Desbals, 06 15 80 51 47).

Le client commande sans compte, à emporter (avec un créneau horaire) ou en livraison (selon la zone). Il paie en ligne, ou au retrait pour la vente à emporter. Un compte, facultatif, garde sa carte de fidélité (10 tampons, la 10e pizza offerte), l'historique de ses commandes avec « recommander pareil » et sa collection d'éditions.

La page d'accueil est construite autour de **la pizza du moment**, une édition limitée qui dure deux mois. Elle affiche un numéro d'édition, un compte à rebours et l'archive des éditions passées. L'admin gère les commandes en service (son à chaque nouvelle commande, ticket imprimable), la carte, les éditions, les zones de livraison, les horaires et la fidélité.

- Design : [docs/superpowers/specs/2026-11-16-ofrero-refonte-design.md](docs/superpowers/specs/2026-11-16-ofrero-refonte-design.md)
- Plan d'implémentation : [docs/superpowers/plans/2026-11-16-ofrero-refonte.md](docs/superpowers/plans/2026-11-16-ofrero-refonte.md)
- Documentation Holberton : [Stage 1](<Team Formation and Idea Development (Stage 1).md>), [Stage 2](<Charter Development (Stage 2).md>), [Stage 3](<Technical Documentation (Stage3).md>), [Stage 4](<MVP Development and Execution (Stage 4).md>). Ces documents décrivent la première version (Next.js et une API Express séparée), remplacée par cette refonte.

## Stack

Une seule application Next.js dans [`O-FreroApp/web`](O-FreroApp/web).

| Rôle | Outil | Version |
|---|---|---|
| Runtime | Node.js | 24 |
| Framework | Next.js (App Router, Turbopack) | 16.4.6 |
| UI | React | 19.3.1 |
| Styles | Tailwind CSS | 4.3.5 |
| Langage | TypeScript | 6.0.3 |
| Base de données | PostgreSQL et Prisma (adaptateur `pg`) | 17 et 7.10.1 |
| Authentification | Better Auth (e-mail et mot de passe, session en cookie) | 1.7.25 |
| Paiement | Stripe (Payment Element et webhook) | 23.1.0 |
| E-mails | Resend (facultatif) | 6.38.1 |
| Validation | Zod | 4.6.7 |
| Panier côté client | Zustand | 5.1.0 |
| Tests | Vitest et Playwright | 5.1.0 et 1.65.1 |

TypeScript reste en 6.0.3 et ESLint en 9.39.5, parce que les plugins de lint de Next 16 ne prennent pas encore en charge TypeScript 7 ni ESLint 10.

## Organisation du code

```
O-FreroApp/web/
  prisma/            schéma, migrations, seed (carte, horaires, zone, éditions, admin)
  src/domain/        règles métier pures : créneaux, prix, livraison, fidélité, éditions, statuts
  src/server/        services avec accès base, testés en intégration
  src/app/(site)/    pages publiques : accueil, carte, éditions, commande, suivi, compte
  src/app/admin/     back-office
  src/app/api/       auth, webhook Stripe, suivi de commande, alerte nouvelles commandes
  e2e/               parcours Playwright
```

Le serveur recalcule toujours les prix. Toutes les heures sont calculées dans le fuseau `Europe/Paris`.

## Démarrer en local

Les commandes se lancent depuis `O-FreroApp/web`, avec Node 24.

```bash
cd O-FreroApp/web
```

```bash
npm install
```

Ensuite, démarre PostgreSQL. Tu as deux possibilités :

- **Sans Docker** : une vraie instance PostgreSQL 17 locale, sur le port 5433, avec les bases `ofrero` et `ofrero_test` créées automatiquement. Laisse ce terminal ouvert.

  ```bash
  npm run db:local
  ```

- **Avec Docker** : le conteneur écoute sur le port 5433. Il faut ensuite créer une fois la base de test.

  ```bash
  npm run db:up
  ```

  ```bash
  docker compose exec db createdb -U ofrero ofrero_test
  ```

Configure ensuite l'environnement. Copie les deux fichiers d'exemple, puis remplis `BETTER_AUTH_SECRET` (avec `openssl rand -base64 32`) et `ADMIN_PASSWORD` dans `.env` :

```bash
cp .env.example .env
```

```bash
cp .env.test.example .env.test
```

Crée les tables et remplis la base :

```bash
npm run db:migrate
```

```bash
npm run db:seed
```

Puis lance le site :

```bash
npm run dev
```

Le site est sur http://localhost:3000 et l'admin sur http://localhost:3000/admin, avec `ADMIN_EMAIL` et `ADMIN_PASSWORD`.

Sans clé Resend, les e-mails (confirmation de commande, vérification d'adresse, mot de passe) s'affichent dans la console du serveur.

Pour simuler une autre date, par exemple entre deux éditions, lance le serveur avec `OFRERO_NOW` :

```bash
OFRERO_NOW=2027-01-05T18:00:00Z npm run dev
```

## Paiement Stripe en local

1. Mets les clés de test dans `.env` : `STRIPE_SECRET_KEY` et `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`.
2. Transfère les webhooks avec la CLI Stripe, puis copie le secret qu'elle affiche dans `STRIPE_WEBHOOK_SECRET` :

   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```

3. Paie avec la carte `4242 4242 4242 4242`. La commande passe à « Reçue » quand le webhook arrive.

Sans clés Stripe, seule la vente à emporter payée au retrait est proposée.

## Tests

| Commande | Ce qu'elle lance |
|---|---|
| `npm run test:unit` | Règles métier (créneaux, prix, fidélité, éditions) |
| `npm run test:int` | Services sur la base `ofrero_test` |
| `npm test` | Les deux |
| `npm run test:e2e` | Parcours complets dans Chromium, sur un build de production (port 3100) |
| `npm run lint` | ESLint |
| `npm run typecheck` | Vérification des types |

Avant le premier lancement des tests de bout en bout, installe Chromium :

```bash
npx playwright install chromium
```

Le paiement Stripe réel n'est testé qu'avec `E2E_STRIPE=1`, des clés de test dans `.env.test` et `stripe listen` actif. Les tests vident et remplissent à nouveau la base `ofrero_test`, jamais `ofrero`.

## Déploiement

Le site est prévu pour Vercel, avec une base PostgreSQL hébergée (Neon, Supabase…).

1. Variables d'environnement : toutes celles de `.env.example`. `BETTER_AUTH_URL` doit être l'URL publique du site.
2. Base de données :

   ```bash
   npx prisma migrate deploy
   ```

   ```bash
   npm run db:seed
   ```

3. Dans le tableau de bord Stripe, crée un webhook vers `https://<domaine>/api/stripe/webhook` avec les événements `payment_intent.succeeded` et `payment_intent.canceled`, puis copie son secret dans `STRIPE_WEBHOOK_SECRET`.
   Pour Apple Pay et Google Pay : active-les dans Stripe (Paramètres > Moyens de paiement), puis enregistre le domaine du site (Paramètres > Domaines de paiement). Les boutons n'apparaissent qu'ensuite, et seulement sur les appareils qui les proposent.
4. Pour envoyer de vrais e-mails, ajoute `RESEND_API_KEY` et un `EMAIL_FROM` dont le domaine est vérifié chez Resend.
5. Complète les mentions légales et les CGV : les passages à remplir sont marqués « À compléter ».
