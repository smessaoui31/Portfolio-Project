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