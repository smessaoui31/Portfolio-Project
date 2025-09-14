# 🍕 O’Frero Pizza – Project README

## 0. Team Formation 
- **Initial Meeting**: Team members introduced themselves, shared backgrounds, strengths, and interests.
- **Roles Assigned**: A temporary **Project Manager** was nominated to coordinate the first stage.
- **Team Norms**:
  - Communication via **Discord**.
  - Task management with **GitHub Projects**.
  - Weekly sync meeting every Monday.

---

## 1. Research and Brainstorming
- **Individual Research**: Each member explored e-commerce trends, modern pizza websites, and payment system integrations.
- **Group Brainstorming**:
  - **Mind Mapping**: Explored ideas around food delivery, reservations, loyalty programs, and eco-friendly packaging.
  - **SCAMPER Framework**: Focused on innovating the pizza ordering experience (e.g., customizable pizzas, subscription models).
  - **“How Might We”** Questions: 
    - How might we simplify pizza ordering in 3 clicks?
    - How might we integrate multiple payment options seamlessly?
    - How might we make the site fresh, modern, and mobile-friendly?

---

## 2. Idea Evaluation 
- **Criteria Defined**:
  - Feasibility for a beginner developer.
  - Potential impact for customers (ease of use, accessibility).
  - Technical alignment with modern frameworks (Next.js, Tailwind, Stripe).
  - Scalability for future SaaS model.

### Priorities.
- **MVP 🔴** → Mandatory task to make the site functional.  
- **Important  🟡** → For a better experience for the client.  
- **Optional 🟣** → Some add-on and extra to add it.  
- **Future  🔵** → Improve the futur roadmap and scalling the site.  

| **Feature**                    | **Notes**                                                                               | **Feasibility** | **Risks** | **Priority** |
|--------------------------------|-----------------------------------------------------------------------------------------|:---------------:|:----------|:------------:|
| Home + Menu + Pizza Details              | Show the restaurant’s welcome page, a browsable menu, and a pizza detail page with ingredients, sizes, and price. Include “Add to Cart” on the detail page.                 | 5/5             | None.     | 🔴           |
| Cart + Delivery / Pickup Option|Let users review items, change quantity, and see the total. Provide a clear toggle to choose Delivery or Pickup, with address input for Delivery. | 5/5             | None | 🔴 |
| Checkout (Stripe with Credit Card / Apple Pay / Google Pay)| Use Stripe’s secure checkout. Support major cards and wallets. Validate user info and show the final total before payment. | 3/5             | Never explored this kind of add-on, need more documentation but so neccessary now     | 🔴           |
| 	Database that records the order | Save the order, items, prices, customer info, delivery/pickup choice, and payment status. Store timestamps for tracking..         | 4/5             | None | 🔴 |
| Success Page (confirmation) | After payment, show an order confirmation with order number and summary. Offer an option to receive the receipt by email.| 4/5             | None.     | 🔴          |  
| Order Tracking  | Setting up automation for order tracking progress                       | 2/5             |    | 🔵         |
| Mobile Version                   | Responsive Site| 5/5             |So much necessary now to do a responsive website| 🔴|
| Geolocated the delivery     | The client can follow the delivery directly on the maps in real time | 1/5             | Learning how to use geolocation. | 🔵 |
|Commmentary and Grading Zone |Client can grading and comment directly the products on the site  | 3/5| None| 🟣|
|Link the phone number|The client can call directly the pizzeria from the site|5/5|None|🟡|
|Newsletter| Setup a newsletter to share the pizzeria's actuality , promote the moment's pizza and new products| 3/5 | Spamming box mail |🟣|
|Social media     | Share directly on the site new post from the social media | 2/5| None | 🔵| 



- **Risks Identified**:
  - Payment integration complexity (Stripe, PayPal).
  - Managing delivery logistics and zones.
  - Time management for project deadline.

---

## 3. Decision and Refinement
- **Final MVP Selected**: Modern responsive pizza ordering website (**O’Frero Pizza**).
- **Problem Solved**: Current pizza ordering processes can be slow, outdated, or lack modern payment options.
- **Target Audience**: Local customers looking for take-out or delivery, preferring mobile-first experiences.
- **Key Features**:
  - Menu browsing by categories.
  - Add pizzas to cart with sizes/options.
  - Checkout with **Stripe (Card, Apple Pay, Google Pay)** and **PayPal**.
  - Order stored in database.
  - Basic admin panel to view orders.
- **Expected Outcome**: A functional MVP demonstrating a complete pizza ordering flow from homepage to payment confirmation.

---

## 4. Idea Development Documentation 
- **Ideas Considered**:
  - **Reservation system**: Rejected (complexity vs MVP scope).
  - **Pizza subscription service**: Rejected (too ambitious for timeline).
  - **Eco-friendly packaging platform**: Interesting but not aligned with restaurant focus.
  - **Responsive pizza ordering site**: Selected (balanced feasibility and impact).
- **Selected MVP Summary**:
  - **Rationale**: Achievable within timeframe, aligned with industry needs, and supports optional future enhancements (admin, delivery tracking, coupons).
  - **Potential Impact**: Smooth ordering experience improves customer satisfaction and loyalty.
- **Team Overview**:
  - Formed a collaborative group with clear communication norms.
  - Followed structured brainstorming and evaluation steps.

---

## 📊 User Journey MVP
![User Journey MVP](/Templates/user_journey_mvp_pizza_vertical_color.svg)

### Steps
1. **Home** → landing page introducing O’Frero Pizza.
2. **Pizza Menu** → browse pizzas by categories.
3. **Pizza Page** → select size/options and add to cart.
4. **Cart** → choose Pickup or Delivery.
5. **Checkout** → pay via Stripe (Card, Apple Pay, Google Pay) or PayPal.
6. **Order Confirmation** → see order details and success message.