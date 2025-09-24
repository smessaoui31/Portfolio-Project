### 📌 Design System Architecture
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

For this part , i will make two example of illustration to make sure you will understand how the back end working .
For the first one , i did something more illustrative and less technical who looks like a map of responbilities.

Don’t worry, I’ll give some clear explanations of this diagram right below.

<p align="center">
  <img src="/Templates/DiagramBackEndCasses.svg" alt="Diagram Back end Classes" width="1200" />
</p>
