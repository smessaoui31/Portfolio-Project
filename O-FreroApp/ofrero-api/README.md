# O-Frero API - MVP 

## Overview
Backend API for O-Frero, the MVP built during Stage 4 of the Holberton Portfolio Project.
Implements a minimal but functional e-commerce backend with authentication, products, and Stripe integration.

## Tech Stack 
- Node.js + TypeScript
- Express 5
- Prisma + PostgreSQL
- JWT Auth + bcryptjs
- Stripe
- Zod validation
- Swagger UI at /docs
- dotenv for configuration

## Database (from Prisma)
Models: User, Product, Cart, CartItem, Order, OrderItem
Enums: UserRole, OrderStatus
See prisma/schema.prisma for structure.

## Quick Start
```bash
cp .env.example .env
npm install
npx prisma generate
npx prisma migrate dev
npm run dev:5050   # http://localhost:5050
```

## API Documentation
Swagger UI: http://localhost:5050/docs
Healthcheck: http://localhost:5050/health

Implemented routes:
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET    | /products/       | Public        | List all products |
| GET    | /products/:id    | Public        | Get product by ID |
| POST   | /products/       | Auth + Admin  | Create product    |
| POST   | /checkout/webhook| None          | Stripe webhook    |

## Environment Variables
See .env.example for the full list: PORT, DATABASE_URL, JWT_SECRET,
ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_FULLNAME, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET.

## Testing

### QA Checklist (manual)
- GET /health returns `{ ok: true }`
- GET /products returns list or [] (seed)
- GET /products/:id returns 200 or 404
- Stripe CLI: `stripe listen --forward-to localhost:5050/checkout/webhook` then `stripe trigger payment_intent.succeeded` â†’ webhook received


## Agile Workflow 

- Sprint planning: lightweight sprints with clear goals (Products API + Swagger, then Stripe webhook + database).
- Daily syncs: brief Discord updates to track progress and blockers.
- Code reviews: work on feature branches; merge via PR into mr-philips, then into main.
- QA: manual tests with Postman/curl; Stripe webhook verified with Stripe CLI.
- Sprint review: demo of completed endpoints; backlog adjusted for next iteration.
- Documentation: README and Technical Documentation updated at the end of each sprint.

Use Postman or curl to test endpoints.
- GET /products -> list all products
- GET /health -> returns { ok: true, service: "ofrero-api" }
- POST /products -> requires admin JWT

## Documentation

- API Reference (Swagger UI): `/docs` (served from `openapi/openapi.json`)
- Technical Documentation : `docs/Technical_Documentation_Stage4.md`

## Deployment
Build and start:
```bash
npm run build && npm start
```
Use Render/Railway/Fly.io with the same environment variables as .env.

## Authors
- Philippe Doudou - Developer
- Sofiane Messaoui - Project Lead
Holberton School - Portfolio Project, Stage 4.

## Quick Start
```bash
cp .env.example .env
npm install
npx prisma generate
npx prisma migrate dev
npm run dev:5050   # http://localhost:5050
```

## API Documentation
Swagger UI: http://localhost:5050/docs
Healthcheck: http://localhost:5050/health

Implemented routes:
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET    | /products/        | Public       | List all products |
| GET    | /products/:id     | Public       | Get product by ID |
| POST   | /products/        | Auth + Admin | Create product |
| POST   | /checkout/webhook | None         | Stripe webhook |

## Environment Variables
See .env.example for the full list:
PORT, DATABASE_URL, JWT_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_FULLNAME, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET.

## Team ## Team & Roles Roles 

- **Project Manager / QA (PM)** â€“ *Sofiane Messaoui*  
  Oversees project planning, sprint organization, and progress tracking.  
  Coordinates task distribution, manages deadlines, and ensures quality through testing and validation.

- **Developer / SCM** â€“ *Philippe Doudou*  
  Contributes to backend development (Express, Prisma, Stripe).  
  Manages the `mr-philips` branch and handles version control with Git.

> *Agile Duo Workflow:*  
> Sofiane drives project vision, sprint planning, and QA testing,  
> while Philippe ensures clean development, Git workflow, and documentation.


---

## í³„ Technical Documentation

For full backend specifications, including database schema, API endpoints, and QA evidence:  
í±‰ [**docs/Technical_Documentation_Stage4.md**](docs/Technical_Documentation_Stage4.md)


---

## Technical Documentation

For full backend specifications, including database schema, API endpoints, and QA evidence:  
[**docs/Technical_Documentation_Stage4.md**](docs/Technical_Documentation_Stage4.md)
