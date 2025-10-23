## 1. Scope

- MVP backend for O-Frero: products catalog, healthcheck, and Stripe webhook.
- Goal: deliver a functional, documented API that can be demoed and extended.
- Out of scope (current): full checkout flow UI; advanced admin panel.

- MVP backend for O-Frero: products catalog, healthcheck, and Stripe webhook.
- Goal: deliver a functional, documented API that can be demoed and extended.
- Out of scope (current): full checkout flow UI; advanced admin panel.
## 2. Tech Stack

- Node.js & TypeScript
- Express 5
- Prisma ORM & PostgreSQL
- JWT & bcryptjs
- Stripe (webhook endpoint)
- Zod validation
- Swagger UI (/docs) & dotenv

- Node.js & TypeScript
- Express 5
- Prisma ORM & PostgreSQL
- JWT & bcryptjs
- Stripe (webhook endpoint)
- Zod validation
- Swagger UI (/docs) & dotenv
## 3. Database Schema — Prisma

**Models:** User, Product, Cart, CartItem, Order, OrderItem
**Enums:** UserRole, OrderStatus
See `prisma/schema.prisma` for details.

**Models:** User, Product, Cart, CartItem, Order, OrderItem
**Enums:** UserRole, OrderStatus
See `prisma/schema.prisma` for details.
## 4. API Endpoints — from code

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /health | Public | Service healthcheck |
| GET | /products | Public | List products |
| GET | /products/:id | Public | Get product by ID |
| POST | /products | Admin | Create product |
| POST | /checkout/webhook | None | Stripe webhook receiver |

_Mounted in `src/app.ts`; products handlers in `src/routes/products.routes.ts`._

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /health | Public | Service healthcheck |
| GET | /products | Public | List products |
| GET | /products/:id | Public | Get product by ID |
| POST | /products | Admin | Create product |
| POST | /checkout/webhook | None | Stripe webhook receiver |

_Mounted in `src/app.ts`; products handlers in `src/routes/products.routes.ts`._

## 5. OpenAPI Endpoints

- Served at `/docs` via Swagger UI.
- Source file: `openapi/openapi.json`.
- Keep parity with real routes; add missing entries in next iteration.


## 6. Environment & Configuration

- Required env vars:
  - PORT, DATABASE_URL, JWT_SECRET
  - ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_FULLNAME
  - STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET
- See `.env.example`. Used in `src/app.ts`, `src/routes/checkout.routes.ts`, etc.


## 7. Run & Dev

```bash
cp .env.example .env
npm install
npx prisma generate
npx prisma migrate dev
npm run dev:5050   # http://localhost:5050
```
Build/Start: `npm run build && npm start`


## 8. Team & Roles

- **Project Manager / QA – Sofiane Messaoui**: planning, sprints, testing/validation.
- **Developer / SCM – Philippe Doudou**: backend (Express, Prisma, Stripe), Git workflow (`mr-philips`).

_Agile duo: Sofiane handles planning & QA; Philippe focuses on development, Git, and documentation._


## 9. Agile Workflow

- Sprint planning: Products API + Swagger, then Stripe webhook + database.
- Daily syncs: short Discord updates to unblock quickly.
- Code reviews: feature branches → `mr-philips` → `main`.
- QA: Postman/curl; Stripe CLI for webhook.
- Sprint review: demo endpoints; adjust backlog; update docs.


## 10. Testing & QA

- `GET /health` → `{ ok: true }`
- `GET /products` → returns list or [] (seed)
- `GET /products/:id` → 200 or 404
- Stripe CLI: `stripe listen --forward-to localhost:5050/checkout/webhook` + `stripe trigger payment_intent.succeeded` → webhook received OK.


## 11. Proof of Implementation

- Routes mounted: `src/app.ts` (health, docs, products, checkout).
- Handlers: `src/routes/products.routes.ts`, `src/routes/checkout.routes.ts`.
- Env usage: `src/app.ts`, `src/services/auth.service.ts` (JWT).
- Server bootstrap: `src/index.ts`.
- Prisma schema: `prisma/schema.prisma`.


## Summary

- MVP backend implemented with real endpoints and database schema.
- Agile workflow applied with clear team roles and QA evidence.
- Documentation (README + this file + Swagger) kept aligned with the codebase.

