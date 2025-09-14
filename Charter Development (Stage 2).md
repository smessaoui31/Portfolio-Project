<p align="center">
  <img src="/Templates/ofrero-pizza-logo.png" alt="O'Frero Pizza Logo" width="400" />
</p>

<h1 align="center">🍕 O'Frero Pizza</h1>

<p align="center">
  <b>A modern and responsive e-commerce website for a local pizzeria</b><br>
  Built with Next.js, Tailwind CSS, Prisma & Stripe
</p>

<p align="center">
  <a href="#-smart-method">🎯 SMART Method</a> •
  <a href="#-identify-stakeholders-and-team-roles">👥 Stakeholders</a> •
  <a href="#-project-scope">📌 Scope</a> •
  <a href="#-identify-risks">⚠️ Risks</a> •
  <a href="#-project-timeline">📅 Timeline</a>
</p>

---



# 🍕 O’Frero Pizza – Project Documentation

---

## 🎯 SMART Method

| **Criterion** | **Description** |
|---------------|-----------------|
| **Specific**  | The goal is to set up an **e-commerce website** for a pizzeria to support and expand its business. |
| **Measurable** | The website should increase the **number of customers**, the **traffic on the site**, and ultimately lead to higher **sales revenue** for the business. |
| **Achievable** | The project is feasible using the frameworks and technologies at hand. Some parts may be challenging (e.g., integrating **Stripe** for payments), but overall it is achievable within **60 days**. |
| **Relevant**   | Highly relevant for a local pizzeria. Their previous site already simplified orders, and today a modern site is essential to compete with big players like **Pizza Hut** or **Domino’s Pizza**. |
| **Time-bound** | The project must be delivered by **the end of October or early November** (see Gantt chart for planning). |

---

## 👥 Identify Stakeholders and Team Roles

### Stakeholders

| **Type**       | **Stakeholder**                     | **Description / Interest** |
|----------------|-------------------------------------|----------------------------|
| **Internal**   | **Sofian Messaoui** (Project Manager) | Planning, coordination, and delivery of the project. Acts as the main point of contact. |
|                | **Doudou Philippe Fofana** (Developer)            | Implements core features (frontend & backend), ensures code quality, and contributes to testing. |
|                | Project Team (if expanded)          | Additional contributors (design, QA). |
| **External**   | **Hugo Chilemme, Fabien Chavonet**  | Provide guidance, evaluate progress, and validate the final project. |
|                | **Pierre Dusart & Boris Dusart** (Customers) | Local pizzeria staff and clients who will use the website to order pizzas. |
|                | **Payment Partners** (Stripe, PayPal) | Provide the online payment infrastructure integrated into the site. |

---

### Team Roles

| **Role**            | **Assigned To**      | **Responsibilities** |
|----------------------|----------------------|-----------------------|
| **Project Manager**  | Sofian Messaoui      | Oversees timeline, ensures tasks are completed, communicates with stakeholders, and manages risks. |
| **Developer**        | Philippe & Sofian    | Build features (frontend & backend), integrate payments, maintain codebase. |
| **QA / Tester**      | Shared               | Perform functional and end-to-end testing to ensure quality. |
| **Documentation Lead** | Sofian Messaoui    | Prepares project documentation (README, reports, presentations). |

---

## 📌 Project Scope

| **Category**   | **Description** |
|----------------|-----------------|
| **In-Scope**   | - Responsive website (desktop + mobile)<br>- Pizza menu browsing by categories<br>- Product pages (sizes, options, description, price)<br>- Shopping cart with Pickup or Delivery option<br>- Checkout with Stripe (Card, Apple Pay, Google Pay) and PayPal<br>- Order storage in database<br>- Basic Admin Panel (view/update orders)<br>- Deployment (Vercel + Supabase) |
| **Out-of-Scope** | - Coupons, discounts, loyalty programs<br>- Subscription services (e.g., monthly pizza box)<br>- Real-time delivery tracking with GPS/maps<br>- Complex logistics (delivery optimization, route planning)<br>- Multi-language support (EN/FR)<br>- Push notifications or automated emails<br>- PWA with offline mode |

---

## ⚠️ Identify Risks

### Purpose
To think ahead about possible problems during the project and how to solve them.

### Risks and Solutions

| **Risk Area**  | **What could go wrong?** | **How to reduce the risk (solution)** |
|----------------|--------------------------|---------------------------------------|
| **Technology** | Difficulty using some tools (e.g., Stripe for payments). | Learn early, follow tutorials, and keep extra time for payment integration. |
| **Timeline**   | Project may take longer than expected. | Follow the schedule week by week, check progress, and keep one week at the end for testing/bugs. |
| **Team**       | Only 2 main members → delays if one is unavailable. | Share tasks clearly, use GitHub to track work, hold regular sync meetings. |
| **Testing**    | Not enough testing could leave bugs. | Test features as soon as they’re built, write small tests, reserve time for final tests. |
| **Deployment** | Problems putting the site online (DB or settings issues). | Use Vercel test environment, document all steps, and test online before the final deadline. |
| **Scope**      | Risk of adding too many features before MVP is done. | Focus only on MVP; extras added only after delivery. |

---

## 🗺️ 4. Develop a High-Level Plan

### Purpose
To explain the main steps of the project in simple terms, from the start to the final delivery.

### High-Level Plan

| Step | What we do | What we get at the end |
|------|-------------|-------------------------|
| **1. Setup & Tools** | Create the GitHub repo, install Next.js + Tailwind, connect the database. | Project ready with an empty app and database. |
| **2. Design** | Choose colors, fonts, and style. Create basic components (buttons, navbar, cards). | A simple and modern design system. |
| **3. Frontend Pages** | Build the main pages: Home, Menu, Pizza detail, Cart, Checkout. | Website pages that the user can navigate. |
| **4. Backend** | Create API routes for pizzas, orders, and cart. Add demo pizzas in the database. | A working backend with sample data. |
| **5. Payments** | Add Stripe (Card, Apple Pay, Google Pay) and PayPal. | Checkout system working in test mode. |
| **6. Admin Panel** | Make a page to view and update orders. | Admin dashboard for the pizzeria. |
| **7. Testing** | Connect frontend and backend. Test the full order flow. Write small tests. | Confirmed that everything works. |
| **8. Deployment** | Put the site online with Vercel and Supabase. Improve performance and SEO. | Live website available online. |
| **9. Final Review** | Fix bugs, write documentation, prepare presentation. | Project ready to show at school. |

---

### Timeline
You can see our timeline with the following Gantt Chart made by Philippe.
<p align="center">
  <img src="/Templates/gantt.png" alt="Gantt chart project" width="800" />
</p>