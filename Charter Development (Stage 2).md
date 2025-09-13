<p align="center">
  <img src="ofrero-pizza-logo.png" alt="O'Frero Pizza Logo" width="150" />
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
|                | **Philippe** (Developer)            | Implements core features (frontend & backend), ensures code quality, and contributes to testing. |
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