# 🍕 O’Frero Pizza — MVP Development & Sprint Documentation
<p align="center">
  <img src="/Templates/ofrero-pizza-logo.png" alt="O'Frero Pizza Logo" width="400" />
</p>

##  Project Overview

**O’Frero Pizza** is a full-stack web application for an artisan pizza restaurant.  
The project includes:
- A **back-end API** built with **Express.js** and **Prisma ORM (PostgreSQL)**.
- A **front-end web app** built with **Next.js**, **TypeScript**, and **TailwindCSS**.
- An **admin dashboard** fully connected to the real Prisma database.
- A **client interface** featuring **JWT authentication**, **cart management**, **checkout (Stripe)**, and **order history**.

---

## MVP Goal

The goal of this MVP is to:
- Deliver a functional version of the platform allowing users to order pizzas online.
- Provide an admin interface to manage products and view orders.
- Establish a scalable architecture ready for a future SaaS evolution.

---

## v0. Sprint Planning

###  Objective
Divide development into short, manageable sprints with clear priorities.

###  Methodology: MoSCoW
| Priority | Description |
|-----------|--------------|
| **Must Have** | JWT authentication, cart system, payment flow, product catalog, admin dashboard. |
| **Should Have** | Address management, client order history, admin statistics. |
| **Could Have** | Dark mode, UI animations, product images. |
| **Won’t Have** | Multi-restaurant or geolocation delivery (beyond MVP scope). |

###  Sprint Structure
- **Duration:** 2 weeks per sprint.  
- **Tools:** Trello (or Notion) for planning, GitHub for version control.  
- **Roles:**
  - **Backend Dev:** Express.js, Prisma ORM.
  - **Frontend Dev:** Next.js, API integration.
  - **QA:** Manual and automated testing.
  - **SCM:** Branching, code reviews, and merges.

---

##  1. Execute Development Tasks

###  Backend
- Built with **Express.js + Prisma ORM** connected to **PostgreSQL**.
- REST API Endpoints:
  - `/auth` — Authentication & JWT.
  - `/products` — Product listing.
  - `/categories` — Category management.
  - `/cart` — User cart.
  - `/orders` — User orders.
  - `/admin/products` — Product CRUD for admins.
  - `/admin/orders` — Global order list for admins.
- Input validation handled with **Zod**.
- Secure role-based access control (`requireAuth`, `requireAdmin`).

### Frontend
- Developed using **Next.js**, **TypeScript**, and **TailwindCSS**.
- Pages:
  - `/` — Home
  - `/menu` — Product list
  - `/cart` — User cart
  - `/checkout` — Stripe payment
  - `/login` — User authentication
  - `/admin` — Admin dashboard
- Features:
  - JWT-based authentication with persisted session.
  - Global state via React **Context API**.
  - Dynamic data fetching via `apiAuthed()`.
  - Admin dashboard with CRUD and statistics.

###  SCM & QA
- **Branch strategy:** `main`, `dev`, `feature/*`
- **Testing:**
  - Postman for API testing.
  - Front-end logs and console validation.
- **Reviews:** Pull request approval required before merging.

---

##  2. Monitor Progress and Adjust

### Daily Stand-ups
Each day:
- Review completed tasks.
- Identify blockers.
- Plan the next steps.

###  Tools
- **GitHub Projects** — issue management.
- **MY FAMOUS YELLOW NOTEBOOK**
- **Metrics:**
  - Sprint velocity.
  - % of completed vs planned tasks.
  - Bug count and resolution rate.
  
---

## 🔍 3. Conduct Sprint Reviews & Retrospectives

###  End of Sprint
- MVP demo:
  - Full JWT-based authentication.
  - User checkout process and DB persistence.
  - Admin dashboard: products and orders view.
- Collect feedback and verify user acceptance.

###  Retrospective
| Topic | Notes |
|--------|-------|
| ✅ What went well | Clear architecture (front/back separation), stable Prisma DB, smooth dashboard. |
| ⚠️ What didn’t | CORS issues, JWT persistence, dark mode integration. |
|  What to improve | Automated testing, image uploads, refined UI/UX design. |

---

##  4. Final Integration & QA Testing

###  Full Integration
- Verified complete communication between front-end and back-end:
  - `/cart`, `/checkout/start`, `/admin/products`, `/admin/orders`, etc.
- **Stripe Sandbox**:
  - Order creation, `clientSecret` retrieval, payment confirmation.
- **Admin Dashboard**:
  - Live product list fetched from Prisma DB.
  - Detailed order view (user + items).
  - Product CRUD fully operational.

### 🧩 Fixes Implemented
- Fixed `/admin/products` and `/admin/orders` endpoints.
- Unified front-end requests through `apiAuthed()`.
- Removed local mock data to connect to the live DB.

---

## MVP Delivery Summary

| Feature | Status | Description |
|----------|--------|--------------|
| JWT Authentication | ✅ | Secure login/logout, persisted token. |
| Product Catalog | ✅ | DB-driven, sortable, and searchable. |
| Dynamic Cart | ✅ | User-specific and real-time. |
| Checkout / Payment | ✅ | Stripe integration. |
| Admin Dashboard | ✅ | Products, orders, and statistics. |
| Category Management | ✅ | Full Prisma CRUD. |
| Dark Mode | ⚙️ | Partially implemented (under refinement). |

---

##  Next Steps

1. ✅ Enable **product creation and editing** in the dashboard.  
2. ✅ Add **image uploads** (Cloudinary / Supabase).  
3. ⚙️ Finalize **dark mode synchronization**.  
4.   Deploy to production (Vercel / Railway).

---

## ⚙️ Installation & Setup

###  Requirements
- Node.js ≥ 18  
- PostgreSQL database  
- Stripe account (for checkout)  
- `.env` configuration file  

###  Environment Variables
```env
DATABASE_URL="postgresql://user:password@localhost:5432/ofrero"
FRONT_URL="http://localhost:3000"
PORT=5050
ADMIN_EMAIL=admin@ofrero.fr
ADMIN_PASSWORD= (do you really think i will gonna give you my password haha)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

###  Launch Commands
```bash
# 1. Install dependencies
npm install

# 2. Run Prisma migrations
npx prisma migrate dev

# 3. Start the backend
npm run dev

# 4. Start the frontend (in /ofrero-webfront)
npm run dev
```

###  URLs
| Service | URL |
|----------|-----|
| API Docs | http://localhost:5050/docs |
| API Health | http://localhost:5050/health |
| Frontend | http://localhost:3000 |
| Admin Dashboard | http://localhost:3000/admin |

---

## Resources

- [Prisma Docs](https://www.prisma.io/docs)
- [Express Best Practices](https://expressjs.com/en/advanced/best-practice-performance.html)
- [Stripe Integration Guide](https://stripe.com/docs/payments/accept-a-payment)
- [TailwindCSS Reference](https://tailwindcss.com/docs)
- [Next.js App Router](https://nextjs.org/docs/app)

---

## ACKNOWLEDGEMENTS:

For this end-of-year project, I would like to thank [Fabien Chavonet](https://github.com/fchavonet) for his advice throughout the progress of my project. 

I would also like to thank [Hugo Chilemme](https://github.com/hugo-chilemme) for his expert advice and technical skills, particularly in the area of full stack websites.
I would also like to thank all my teammates in the C-26 cohort in Toulouse and Rodez.

This project taught me a lot, particularly about rigor and how to deal with the difficulties that a full stack developer may encounter during their development journey. 

**© 2025 — O’Frero Pizza**  
Developed by **Messaoui Sofian** 🍕  
*"Pizzeria — Wood-fired oven owned by two brothers."*