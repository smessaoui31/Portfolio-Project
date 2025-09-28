<div align="center">
  <img src="/Templates/ofrero-pizza-logo.png" alt="Logo 1" width="400"/>
  <span style="margin: 0 20px;"></span>
  <img src="/Templates/holberton.png" alt="Logo 2" width="400"/>
</div>

## Table of Contents

- [0) User Stories and Mockups](#0-user-stories-and-mockups)  
  - [0.1 User Stories](#01-user-stories)  
  - [0.2 Mockups (Main Screens)](#02-mockups-main-screens)  
- [1) Design System Architecture](#1-design-system-architecture)  
- [2) Components, Classes & Database Design (MVP)](#2-components-classes--database-design-mvp)  
  - [2.1 Front-end Components (React)](#21-front-end-components-react)  
  - [2.2 Back-end Classes (Node.js + Express)](#22-back-end-classes-nodejs--express)  
  - [Backend Components Overview](#backend-components-overview)  
  - [Relational Database (MVP)](#relational-database-mvp)  
- [3) High-Level Sequence Diagrams (MVP)](#3-high-level-sequence-diagrams-mvp)  
  - [3.1 User Login (JWT)](#31-user-login-jwt)  
  - [3.2 Browsing and add to cart](#32-browsing-and-add-to-cart)  
  - [3.3 Checkout and payment (Stripe)](#33-checkout-and-payment-stripe)  
- [4) API & Methods](#4-api--methods)  
  - [4.1 External APIs Used](#41-external-apis-used)  
  - [4.2 Internal API Endpoints (MVP)](#42-internal-api-endpoints-mvp)  
- [5) SCM & QA Strategy](#5-scm--qa-strategy)  
  - [5.1 Source Control Management (SCM)](#51-source-control-management-scm)  
  - [5.2 QA (Quality Assurance)](#52-qa-quality-assurance)  
  - [5.3 Deployment Pipeline](#53-deployment-pipeline)  

</p>

<p align="center">
  <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg" alt="React" width="80" height="80"/>
  <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nodejs/nodejs-original.svg" alt="Node.js" width="80" height="80"/>
  <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/express/express-original.svg" alt="Express" width="80" height="80"/>
  <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/postgresql/postgresql-original.svg" alt="PostgreSQL" width="80" height="80"/>
  <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/prisma/prisma-original.svg" alt="Prisma" width="80" height="80"/>
  <img src="https://cdn.worldvectorlogo.com/logos/stripe-4.svg" alt="Stripe" width="80" height="80"/>
</p>

<p align="center">
  <b>React</b> • <b>Node.js</b> • <b>Express</b> • <b>PostgreSQL</b> • <b>Prisma</b> • <b>Stripe</b>
</p>

## 0) User Stories and Mockups

### 0.1 User Stories

#### Must Have (essential for MVP)
- As a **customer**, I want to **register and log in**, so that I can place orders securely.  
- As a **customer**, I want to **browse the pizza menu**, so that I can see what products are available.  
- As a **customer**, I want to **add products to my cart**, so that I can prepare my order.  
- As a **customer**, I want to **checkout and pay online with Stripe**, so that I can complete my purchase.  
- As a **customer**, I want to **see my order status**, so that I know if my pizza is being prepared or delivered.  

#### Should Have (important, but not critical for MVP)
- As a **customer**, I want to **filter products by category (pizza, drinks, desserts)**, so that I can quickly find what I want.  
- As an **admin**, I want to **manage the menu (create, update, delete products)**, so that the menu stays up to date.  
- As an **admin**, I want to **see a list of orders**, so that I can process them efficiently.  

#### Could Have (nice to have, future)
- As a **customer**, I want to **save my favorite products**, so that I can reorder faster.  
- As a **customer**, I want to **receive email/SMS confirmation** when my order is placed.  
- As an **admin**, I want to **see sales statistics**, so that I can analyze business performance.  

#### Won’t Have (excluded for MVP)
- As a **customer**, I want to **track delivery on a map in real time** (too complex for MVP).  
- As a **customer**, I want to **use loyalty points or discounts** (future feature).  

---

### 0.2 Mockups (Main Screens)

We designed simple wireframes for the MVP :

- **Login/Register Page** → fields for email + password.  
- **Menu Page** → list of pizzas with “Add to Cart” button.  
- **Cart Page** → list of selected items, total price, “Checkout” button.  
- **Checkout Page** → address + phone form, Stripe payment integration.  
 


## 1) Design System Architecture
---

<p align="center">
  <img src="/Templates/mermaid.png" alt="Flowchart Documentation Architecture" width="1200" />
</p>

Let me explain you now what this flowchart said 
- **Front-end (React)**  
  The client web app and the admin dashboard communicate with the backend using HTTPS.  

- **Backend API (Node.js + Express)**  
  This is the core of the application. It contains three main services:  
  - **Auth Service** → manages user login and authentication (JWT, passwords).  
  - **Menu Service** → provides the pizza menu and manages inventory.  
  - **Order Service** → handles the shopping cart, order creation, and tracking.  

- **Database (PostgreSQL via Prisma)**  
  Stores all persistent data (users, menu items, orders).  

- **Stripe (Payments)**  
  Connected to the Order Service to process payments. Stripe also sends back **webhooks** (automatic callbacks) to confirm whether a payment was successful or failed.  

---

👉 **In short:**  
The **client** makes a request → the **backend** processes it → data is stored in the **database** → payments are handled by **Stripe**.

A little bit data flow for an extra clarity for thoses who doesn't understand clearly our explanation?

Just for you guys : 

`Client (React)` → `Backend API (Node.js/Express)` → `PostgreSQL`

`Client (React)` → `Backend API` → `Stripe (Payment)` → `Webhook` → `Backend API` → `PostgreSQL`

**Step-by-step**
1. Client requests (HTTPS) → Backend API  
2. Backend validates & routes → Auth/Menu/Order services  
3. Services read/write → PostgreSQL (via Prisma)  
4. Checkout: Backend → Stripe (payment intent/confirm)  
5. Stripe → Webhook → Backend (payment status)  
6. Backend updates order status → PostgreSQL → Client sees result


 ## 2) Components, Classes & Database Design (MVP)
### 2.1 Front-end Components (React)

| Component / Page   | Type        | Purpose                                                                 |
|--------------------|-------------|-------------------------------------------------------------------------|
| `HomePage`         | Page        | Landing page with quick access (menu, cart).                           |
| `MenuPage`         | Page        | Displays all pizzas with filters by category.                          |
| `ProductPage/:id`  | Page        | Shows details of one product (size, extras).                           |
| `CartPage`         | Page        | Displays cart content, allows quantity updates.                        |
| `CheckoutPage`     | Page        | Delivery + payment form (Stripe integration).                          |
| `LoginPage`        | Page        | User login with email and password.                                    |
| `RegisterPage`     | Page        | User registration (create account).                                    |
| `AdminDashboard`   | Page        | Protected area for staff (manage products, categories, orders).        |
| `Header`           | UI Component| Logo, navigation links, login state, cart link.                        |
| `ProductCard`      | UI Component| Shows pizza info (image, name, price, “Add to Cart” button).           |
| `CategoryFilter`   | UI Component| Filter products by category.                                           |
| `CartPanel`        | UI Component| Lists items in cart with total price.                                  |
| `CheckoutForm`     | UI Component| Address, phone, and Stripe payment fields.                             |
| `ProtectedRoute`   | Utility     | Redirects user to login if not authenticated (JWT required).            |

---

**Interaction examples:**
- Clicking **Add to Cart** → updates the cart store.  
- **Login/Register** → calls backend `/auth` API and stores JWT.  
- **Checkout** → sends order + delivery info to backend → Stripe handles payment.  
---

### 2.2 Back-end Classes (Node.js + Express)

We group backend logic into **services** and **repositories**.  
Services = contain the business logic.  
Repositories = talk to the database.  

For this part , i will do a simple example of illustration to make sure you will understand how the back end working .
 I did something more illustrative and less technical who looks like a map of responbilities.
 This diagram provides a simple representation of how my back end works

Don’t worry, I’ll give some clear explanations of this diagram right below, presented in a table so that it’s clearer and more pleasant to read for your lovely eyes haha. (Mainly because I know Fabien has a thing for tables 😄 ... or Hugo why not)

<p align="center">
  <img src="/Templates/DiagramBackEndCasses.svg" alt="Diagram Back end Classes" width="1200" />
</p>

### Backend Components Overview

| Component          | Simple meaning            | What it does (job)                                  | Database table used |
|--------------------|---------------------------|-----------------------------------------------------|---------------------|
| **Auth Service**   | Login system              | Manages accounts: register, log in, stay connected. | **Users**           |
| **Menu Service**   | Pizzas list               | Stores products (pizzas, drinks, categories).       | **Products**        |
| **Order Service**  | Shopping cart             | Tracks what customers want to buy (orders).         | **Orders**          |
| **Payment Service**| Credit card / Stripe      | Handles payments and saves results.                 | **Payments**        |

👉 The **Order Service talks to the Payment Service**: when a customer checks out, the order is saved and then the payment is processed with Stripe.

In short:

	•	Auth = Who you are
	•	Menu = What you can buy
	•	Order = What you want to buy like pizza , soft drinks etc
	•	Payment = How you pay (for this case  : Credit card or via Stripe)



### 📌 Relational Database (MVP)

For the relational database we did a diagram directly on mermaid.
Just note , i did this database based on our MVP. It is likely to change in the future with new implementations over time (for example , real-time delivery tracking on the map).

<p align="center">
  <img src="/Templates/dbdiagram.png" alt="Database diagram" width="900" />
</p>


Let me now give you somes explanations about this relational database to understand every tables and make in your mind how our database works.

| Table        | What it represents          | Key fields and purpose                                                                 |
|--------------|-----------------------------|----------------------------------------------------------------------------------------|
| **Users**    | People using the app        | `id` (unique user ID), `email` (unique), `password_hash` (encrypted password), `name`. |
| **Categories** | Groups of products        | `id`, `name` (e.g. “Pizza”, “Drinks”).                                                 |
| **Products** | Items on the menu           | `id`, `name`, `price_cents`, `category_id` (links product to its category).            |
| **Orders**   | Shopping cart or order      | `id`, `user_id` (who placed it), `status` (cart, pending, paid, cancelled), `total`.   |
| **OrderItems** | Details of an order       | `id`, `order_id`, `product_id`, `quantity`, `unit_price`. Each line = one product in an order. |
| **Payments** | Payment information (Stripe)| `id`, `order_id`, `provider` (e.g. Stripe), `status` (succeeded or failed), `intent_id`. |

---

👉 **In short**  
- **Users** = who you are  
- **Categories** = groups of products  
- **Products** = what you can buy  
- **Orders** = what you want to buy  
- **OrderItems** = details of the order  
- **Payments** = how you pay  


## 3) High-Level Sequence Diagrams (MVP)

In the case of the pizzeria website, we identified three common scenarios that users will encounter when placing an order.  

The first scenario, unsurprisingly, is [**User Login**](#31-user-login-jwt).  

The second scenario (you have to eat!) is [**Browsing to view the products**](#32-browsing-and-add-to-cart) offered by the pizzeria and adding them to the cart.  

The third scenario (I don't know of any free pizzerias): [**Verification and Payment**](#33-checkout-and-payment-stripe).  

Below are three critical user flows: **Login**, **Browse & Add to Cart**, and **Checkout & Payment**.

---

### 3.1 User Login (JWT)

For this case , I drew a lot of inspiration from our previous project on HBNB. It was a great resource for illustrating and implementing the back end of the project. Although it was in a different language, the structure and understanding were very similar. 

<p align="center">
  <img src="/Templates/userlogin.png" alt="UserLogin" width="800" />
  </p>

  ### 📝 Explanation

1. **The User** enters their email and password.  
2. The **Frontend** sends the login request to the **Backend**.  
3. The **Backend** checks the credentials in the **Database**.  
4. If the credentials are correct, the **Backend** generates a **JWT token**.  
5. The **Frontend** receives the token.  
6. The **User** is now logged in and can access protected pages.  
---
### 3.2 Browsing and add to cart

We've all placed an order on a website to get a delicious pizza or "dwich", but did we know exactly what was happening behind the scenes? 

<p align="center">
  <img src="/Templates/browseandaddtocart.png" alt="Browse and add to cart" width="800" />
  </p>

  This diagram requires a little more explanation than the previous one. 

  ### 📝 Explanation: Browse Menu & Add to Cart

1. **The User** opens the menu page.  
2. The **Frontend** asks the **Backend** for the list of products.  
3. The **Backend** requests the data from the **Database**.  
4. The **Database** returns the list of products.  
5. The **Backend** sends the product list back to the **Frontend**.  
6. The **Frontend** displays the menu items to the **User**.  

---

7. The **User** clicks "Add to Cart".  
8. The **Frontend** sends an add-to-cart request to the **Backend**.  
9. The **Backend** updates the **Database** (cart and order items).  
10. The **Database** confirms the update.  
11. The **Backend** sends the updated cart back to the **Frontend**.  
12. The **Frontend** shows the updated cart to the **User**.
---
### 3.3 Checkout and payment (Stripe)

This is definitely the most complicated part to explain to you because I'm really starting from scratch, having never used Stripe before. You should know that I relied heavily on the [Stripe](https://stripe.com/fr/resources/more/how-to-integrate-a-payment-gateway-into-a-website) website and the [Stripe's Documentation](https://docs.stripe.com/checkout/fulfillment).

<p align="center">
  <img src="/Templates/CheckoutPayment.png" alt="Checkou and payment" width="800" />
  </p>

  ### 💳 Explanation : Checkout & Payment

  | Step | Who does it?    | What happens                                                                 |
|------|-----------------|------------------------------------------------------------------------------|
| 1    | **User**        | Goes to checkout page and enters delivery info (address, phone).             |
| 2    | **Frontend**    | Sends this information to the **Backend**.                                   |
| 3    | **Backend**     | Checks the cart, calculates the total, and sets the order as *pending*.      |
| 4    | **Backend → Stripe** | Asks Stripe to prepare the payment (*PaymentIntent*).                  |
| 5    | **Stripe**      | Sends back a secret key (*client_secret*) for the payment.                   |
| 6    | **Frontend**    | Shows a Stripe form to enter card details.                                   |
| 7    | **Frontend → Stripe** | Sends the card details securely to Stripe.                             |
| 8    | **Stripe**      | Tells if the payment succeeded or failed.                                    |
| 9    | **Stripe → Backend** | Sends a *webhook* (automatic message) to confirm payment result.        |
| 10   | **Backend → Database** | Updates the order status (paid or failed).                           |
| 11   | **Frontend**    | Shows the final confirmation to the **User** (success or error).             |

👉 **In short:**  
- The **Backend** prepares the payment.  
- The **Frontend** collects card details.  
- **Stripe** processes the payment and informs both sides.  
- The **Database** saves the final status. 


## 4) API & Methods

### 4.1 External APIs Used

| API       | Purpose | Why chosen |
|-----------|---------|------------|
| Stripe | Payment processing | Secure and widely used payment gateway, easy to integrate with Node.js. |
| (Optional future) Google Maps / Mapbox | Address validation, delivery zones | Can be added later to improve delivery features. |
| (Optional future) Twilio / SendGrid | SMS or email notifications | Useful for sending order confirmations, but not required for MVP. |

---

### 4.2 Internal API Endpoints (MVP)

| Method | Endpoint              | Description | Input (JSON / Query) | Output (JSON) |
|--------|-----------------------|-------------|----------------------|---------------|
| **POST** | `/auth/register`    | Register a new user | `{ "email": "string", "password": "string", "fullName": "string" }` | `{ "id": "uuid", "email": "string", "fullName": "string" }` |
| **POST** | `/auth/login`       | Log in user and get JWT | `{ "email": "string", "password": "string" }` | `{ "accessToken": "jwt_token" }` |
| **GET**  | `/me`               | Get logged-in user info (JWT required) | Header: `Authorization: Bearer <token>` | `{ "id": "uuid", "email": "string", "fullName": "string" }` |

---

#### Menu & Products

| Method | Endpoint              | Description | Input | Output |
|--------|-----------------------|-------------|-------|--------|
| **GET**  | `/categories`       | List all product categories | none | `[ { "id": "uuid", "name": "string" } ]` |
| **GET**  | `/products`         | List all products (optionally filter by category) | Query: `?category=uuid` | `[ { "id": "uuid", "name": "string", "priceCents": 1200, "categoryId": "uuid" } ]` |
| **GET**  | `/products/:id`     | Get product details | Path param: `id` | `{ "id": "uuid", "name": "string", "description": "string", "priceCents": 1200 }` |

---

#### Cart & Orders

| Method | Endpoint                  | Description | Input | Output |
|--------|---------------------------|-------------|-------|--------|
| **GET**  | `/cart`                 | Get active cart for logged-in user | JWT required | `{ "id": "uuid", "items": [ ... ], "totalCents": 2400 }` |
| **POST** | `/cart/items`           | Add item to cart | `{ "productId": "uuid", "quantity": 2 }` | Updated cart JSON |
| **PATCH**| `/cart/items/:itemId`   | Update item quantity | `{ "quantity": 3 }` | Updated cart JSON |
| **DELETE**| `/cart/items/:itemId`  | Remove item from cart | none | Updated cart JSON |

---

#### Checkout & Payment

| Method | Endpoint                  | Description | Input | Output |
|--------|---------------------------|-------------|-------|--------|
| **POST** | `/orders/checkout`      | Start checkout process | `{ "addressLine": "string", "city": "string", "postalCode": "string", "phone": "string" }` | `{ "clientSecret": "stripe_secret" }` |
| **POST** | `/webhooks/stripe`      | Receive payment confirmation from Stripe | Stripe webhook payload | `{ "status": "ok" }` |
| **GET**  | `/orders/:id`           | Get order status | Path param: `id` | `{ "id": "uuid", "status": "pending;paid;failed"` |

---

👉 **In short**:  
- **External API:** Stripe for payments.  
- **Internal API:** REST endpoints for Auth, Menu, Cart, and Payment.  
All inputs/outputs are in **JSON** for easy integration with the React frontend.


## 5) SCM & QA Strategy

### 5.1 Source Control Management (SCM)

We use **Git** for version control.

- **main** → always contains production-ready code.  
- **developer** → each new feature or bugfix is developed in its own branch.(Philippe and Sofian) and when its ready we push it in the main branch.




---

### 5.2 QA (Quality Assurance)

We want to make sure the code works and is easy to maintain.

**Testing strategy:**
- **Unit tests** → check small pieces of code (with **Jest**).  
- **API tests** → check endpoints like `/auth/login` (with **Jest + Supertest**).  
- **Manual tests** → check important flows manually (with **Postman**).  

**Tools:**
- **Jest** → run automated tests.  
- **Postman** → test API calls manually.  
- **ESLint + Prettier** → keep the code clean and formatted.  

---

### 5.3 Deployment Pipeline

- **Development** → local machine, quick tests.  
- **Staging** → test environment with real database and Stripe test keys.  
- **Production** → real website, real payments.  (Maybe later but not for the moment)

**Steps:**
1. Push code to `develop`.  
2. CI runs tests automatically.  
3. If all tests pass → deploy to **staging**.  
4. Manual check (login, order, payment).  
5. Merge into `main` → deploy to **production**.  

---

👉 **In short:**  
- Use Git branches (`developer → main`).  
- Write small commits + do code reviews.  
- Run automated tests with Jest.  
- Test APIs with Postman.  
- Deploy first to staging, then to production.