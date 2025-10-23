# O-Frero API - MVP (Stage 4)

## Overview
Backend API for O-Frero, the MVP built during Stage 4 of the Holberton Portfolio Project.
Implements a minimal but functional e-commerce backend with authentication, products, and Stripe integration.

## Tech Stack (real)
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
Use Postman or curl to test endpoints.
- GET /products -> list all products
- GET /health -> returns { ok: true, service: "ofrero-api" }
- POST /products -> requires admin JWT

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

## Testing
Use Postman or curl to test endpoints:
- GET /products -> list all products
- GET /health -> returns { ok: true, service: 'ofrero-api' }
- POST /products -> requires admin JWT

## Deployment
```bash
npm run build && npm start
```
Use Render / Railway / Fly.io with the same environment variables as .env.

## Authors
- Philippe Doudou - Developer
- Sofiane Messaoui - Project Lead
Holberton School - Portfolio Project, Stage 4.

---

### í¼Ÿ Team & Roles (real)

- **í·­ Project Manager (PM)** â€“ *Sofiane Messaoui*  
  Oversees project planning, sprint organization, and progress tracking.  
  Coordinates task distribution, manages deadlines, and ensures project alignment with MVP goals.

- **í²» Developer / SCM / QA** â€“ *Philippe Doudou*  
  Contributes to backend development (Express, Prisma, Stripe).  
  Manages the \`mr-philips\` branch, performs manual testing (Postman, curl),  
  and ensures code quality and stability before merging into \`main\`.

> í±¥ *Agile Duo Workflow:*  
> Sofiane drives the project vision, sprint management, and reviews,  
> while Philippe ensures technical quality, documentation, and continuous delivery.

