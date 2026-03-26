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
| Step 3 | Login Page | ✅ Complete |
| Step 4 | Driver Dashboard | ✅ Complete |
| Step 5 | Shipper Dashboard | ✅ Complete |
| Step 6 | Load Matching Page | ✅ Complete |
| Step 7 | Connect Claude API | ✅ Complete |
| Step 8 | Simulated Escrow Payment | ✅ Complete |
| Step 9 | Ratings & Reviews | ✅ Complete |
| Step 10 | Driver Profile + Admin Analytics | ✅ Complete |

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
| Security | Helmet, express-rate-limit, CORS |

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
  services/paymentService.js — Payment + escrow API calls
  services/aiService.js     — Claude AI chat API calls
  pages/LandingPage.jsx     — Landing page (Step 2)
  pages/DriverDashboard.jsx — Driver view: find loads, my loads, earnings tab
  pages/ShipperDashboard.jsx — Shipper view: my shipments, post load, release payment
  pages/OwnerDashboard.jsx  — Admin view: all payments table + platform stats
  pages/LoadMatchingPage.jsx — AI-powered load search (Step 6+7)
  components/Navbar.jsx     — Sticky navbar with role-aware links
  components/Footer.jsx     — Footer with link columns

server/
  server.js                 — Express entry point (helmet, cors, rate limit, error handler)
  config/db.js              — MongoDB connection
  models/User.js            — Driver / Shipper / Owner schema
  models/Load.js            — Freight load schema
  models/Payment.js         — Escrow payment schema
  routes/auth.js            — POST /api/auth/login|register
  routes/loads.js           — GET/POST/PUT /api/loads
  routes/payments.js        — GET/POST /api/payments
  routes/ai.js              — POST /api/ai/chat
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
POST   /api/payments/release/:id  — Release escrow payment (shipper, requires delivered status)
GET    /api/payments/status/:id   — Escrow status + time until auto-release (owner/shipper/driver only)
GET    /api/payments/all          — All platform payments (owner only)

POST   /api/ai/chat               — AI assistant (Claude API)

GET    /api/users/:id             — Public profile (name, role, score, ratings received)
```

---

## Error Handling Rules
- Always find the ROOT CAUSE of an error before fixing
- Never mask errors with silent try/catch
- Never use workarounds that hide the real issue
- Explain WHY the error happened before fixing it

---

## Security Measures (as of Step 8)
- `helmet()` — security headers on all responses
- `express-rate-limit` — 10 req/15 min on auth routes
- RegExp inputs escaped before filter queries (ReDoS prevention)
- Generic `"Invalid email or password"` for all login failures (no enumeration)
- Payment release blocked unless load status is `delivered`
- Payment status endpoint validates shipper/driver/owner ownership
- `requireRole` null-checks `req.user` defensively

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

## Ratings & Reviews API (Step 9)

```
POST   /api/ratings              — Submit rating (requires delivered load + released payment)
GET    /api/ratings/my           — All ratings current user has submitted
GET    /api/ratings/load/:loadId — Check if current user rated a specific load
GET    /api/ratings/user/:userId — All ratings received by a user
```

Rating rules:
- Score must be 1–5 (whole number)
- Only the driver or shipper on the load can rate
- Payment must be released before rating is allowed
- One rating per load per direction (enforced by unique index `{ load, rater }`)
- Rolling average stored on User: `trustScore` (driver) or `rating` (shipper)

---

## Step 10 — Driver Profile + Admin Analytics (Complete)

### Driver Profile Page (`/driver/:id`)
- Public profile accessible to all authenticated users (driver, shipper, owner)
- Shows: avatar initial, name, role badge, trustScore/rating with stars, total deliveries, member since
- Ratings received section: each card shows rater name/role, star display, comment, load route, date
- Accessible via: driver name links in ShipperLoadCard + OwnerDashboard payments table
- Backend: `GET /api/users/:id` returns limited public fields + populated ratings

### Admin Analytics Tab (Owner Dashboard)
- New "Analytics" tab alongside "All Payments"
- Revenue Over Time: BarChart grouped by month (last 8 months, released payments only)
- Top Drivers by Earnings: horizontal BarChart, top 5 drivers by total released payments
- Platform summary grid: total revenue, funds in escrow, unique drivers, total loads paid
- Charts use Recharts (`BarChart`, `ResponsiveContainer`, `Tooltip`, `CartesianGrid`)
- All analytics computed client-side from existing `getAllPayments()` data — no new backend endpoint

### New Files
```
server/routes/users.js                — GET /api/users/:id (public profile)
client/src/services/userService.js    — getUserProfile(userId)
client/src/pages/DriverProfile.jsx    — profile page component
client/src/pages/DriverProfile.css    — profile page styles
```

---

## Next Session — Step 11 Ideas

Potential next features:
- **Notifications** — in-app alerts for load accepted, delivered, payment released, new rating
- **Load history search** — shipper/driver can filter/search past loads by date range or city
- **Map view** — show load routes on an interactive map (Mapbox / Leaflet)
- **Mobile-responsive polish** — optimize all dashboards for small screens
