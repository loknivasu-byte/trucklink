# TruckLink — Claude Project Context

## What This Is
A freight matching web app for the US trucking market. Portfolio project.
Shippers post loads → Verified drivers accept → Payment released via escrow within 2 hours of delivery.

---

## Build Progress

| Step | Description | Status |
|------|-------------|--------|
| Step 1 | Project structure setup | ✅ Complete |
| Step 2 | Landing Page | ✅ Complete |
| Step 3 | Login Page | ⬜ Next |
| Step 4 | Driver Dashboard | ⬜ Pending |
| Step 5 | Shipper Dashboard | ⬜ Pending |
| Step 6 | Load Matching Page | ⬜ Pending |
| Step 7 | Connect Claude API | ⬜ Pending |
| Step 8 | Simulated Escrow Payment | ⬜ Pending |

---

## How to Start the Project

```bash
# Terminal 1 — Backend
cd ~/Desktop/TruckLink/server && npm run dev
# Runs on http://localhost:5000

# Terminal 2 — Frontend
cd ~/Desktop/TruckLink/client && npm run dev
# Runs on http://localhost:5173
```

---

## Environment

- MongoDB: installed and running locally (`mongodb://localhost:27017/trucklink`)
- Server: Node.js + Express on port 5000
- Client: React + Vite on port 5173

---

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React + Vite + React Router |
| Backend | Node.js + Express |
| Database | MongoDB + Mongoose |
| Auth | JWT (stored in localStorage as `trucklink_user`) |
| AI | Claude API — Anthropic (Step 7) |
| Payment | Simulated escrow (no real money) |

---

## Test Accounts (password: `password123`)

| Role | Email | Name |
|------|-------|------|
| Driver | marcus@driver.com | Marcus Johnson (142 deliveries) |
| Driver | sarah@driver.com | Sarah Mitchell (98 deliveries) |
| Shipper | robert@shipper.com | Robert Chen — Chen Industrial Supply |
| Shipper | amanda@shipper.com | Amanda Torres — Torres Fresh Produce |
| Owner | dave@owner.com | Big Dave Logistics LLC |

To reload sample data: `cd server && npm run seed`

---

## Key File Locations

```
client/src/
  App.jsx                   — Routes + role-based redirects
  context/AuthContext.jsx   — Global auth state (persists to localStorage)
  services/api.js           — Axios instance, auto-attaches JWT
  services/authService.js   — Login / register API calls
  services/loadService.js   — Load CRUD API calls
  services/aiService.js     — Claude AI chat API calls
  pages/LandingPage.jsx     — Landing page (Step 2)
  components/Navbar.jsx     — Sticky navbar with role-aware links
  components/Footer.jsx     — Footer with link columns

server/
  server.js                 — Express entry point
  config/db.js              — MongoDB connection
  models/User.js            — Driver / Shipper / Owner schema
  models/Load.js            — Freight load schema
  models/Payment.js         — Escrow payment schema
  routes/auth.js            — POST /api/auth/login|register
  routes/loads.js           — GET/POST/PUT /api/loads
  routes/payments.js        — GET/POST /api/payments
  routes/ai.js              — POST /api/ai/chat (placeholder)
  middleware/authMiddleware.js — JWT protect + requireRole
  seed/seedData.js          — Sample US freight data
```

---

## API Routes

```
POST   /api/auth/register         — Register new user
POST   /api/auth/login            — Login, returns JWT

GET    /api/loads                 — Available loads (filtered by city/type)
GET    /api/loads/my              — Shipper's own loads
GET    /api/loads/driver          — Driver's accepted loads
POST   /api/loads                 — Post new load (shipper only)
PUT    /api/loads/:id/accept      — Accept a load (driver only)
PUT    /api/loads/:id/status      — Update status: accepted→in_transit→delivered

GET    /api/payments/my           — Payment history for current user
POST   /api/payments/release/:id  — Release escrow payment (shipper)
GET    /api/payments/status/:id   — Escrow status + time until auto-release

POST   /api/ai/chat               — AI assistant (connected in Step 7)
```

---

## Error Handling Rules
- Always find the ROOT CAUSE of an error before fixing
- Never mask errors with silent try/catch
- Never use workarounds that hide the real issue
- Explain WHY the error happened before fixing it

---

## Design System

```
Colors:
  --navy:        #0f2240   (primary background, navbar, footer)
  --navy-light:  #1a3a6b
  --orange:      #f97316   (accent, CTAs, highlights)
  --gray-*:      standard slate scale

Font: Inter / system-ui
Border radius: 8px (--radius), 16px (--radius-lg)
```

---

## Next Session — Step 3: Login Page

Build a role-based login page with:
- Role selector: Driver / Shipper / Owner (tab or card selection)
- Email + password fields
- JWT auth calling POST /api/auth/login
- Redirects to correct dashboard based on role (`/driver`, `/shipper`, `/owner`)
- Registration option (same page, toggle between login/register)
