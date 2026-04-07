# TruckLink — Freight Matching Platform

🚚 **Live Demo → [https://trucklink-ruddy.vercel.app](https://trucklink-ruddy.vercel.app)**

> Try it instantly — no setup needed. Use the demo accounts below or sign up as a new driver or shipper.

A freight matching web application for the US trucking market.
Shippers post loads, verified drivers accept them, and payment is guaranteed through escrow — released automatically within 2 hours of delivery confirmation.

---

## Live URLs

| Service | URL |
|---------|-----|
| Frontend (Vercel) | https://trucklink-ruddy.vercel.app |
| Backend API (Render) | https://trucklink-api.onrender.com |

---

## Features
- **Role-based auth** — separate flows for Drivers, Shippers, and Owners
- **Load marketplace** — filter by city and truck type
- **Atomic load acceptance** — race-condition-safe, first driver wins
- **Escrow payments** — funds locked at posting, released on delivery
- **AI load matching** — Claude AI suggests the best loads for a driver's preferences
- **Ratings & reviews** — mutual rating after every completed delivery
- **Driver public profiles** — trust score, delivery count, ratings received
- **Owner admin panel** — full payments table + revenue analytics charts
- **Driver earnings tab** — payment history with status and escrow countdown
- **Security hardened** — helmet headers, rate limiting, ReDoS protection, ownership validation, idle session timeout

## Tech Stack
- **Frontend**: React + Vite + React Router — deployed on Vercel
- **Backend**: Node.js + Express — deployed on Render
- **Database**: MongoDB Atlas (M0 free tier)
- **Auth**: JWT with 30-minute idle timeout + session expiry check
- **AI**: Claude Haiku via Anthropic API
- **Security**: Helmet, express-rate-limit, CORS, bcrypt

---

## Demo Accounts
All passwords: `password123`

| Role    | Email                  | Name                                    |
|---------|------------------------|-----------------------------------------|
| Driver  | marcus@driver.com      | Marcus Johnson (142 deliveries)         |
| Driver  | sarah@driver.com       | Sarah Mitchell (98 deliveries)          |
| Shipper | robert@shipper.com     | Robert Chen — Chen Industrial Supply    |
| Shipper | amanda@shipper.com     | Amanda Torres — Torres Fresh Produce    |
| Owner   | dave@owner.com         | Big Dave Logistics LLC (admin view)     |

Or just **sign up** as a new driver or shipper — registration is open.

---

## Getting Started (Local Development)

### Prerequisites
- Node.js 18+
- MongoDB running locally (`mongod`)

### Backend
```bash
cd server
npm install
npm run seed     # Populate sample data (required before first login)
npm run dev      # Start on port 5001
```

> **Note:** macOS AirPlay Receiver occupies port 5000. TruckLink uses port **5001**.

### Frontend
```bash
cd client
npm install
npm run dev      # Start on port 5173
```

### Environment Variables

**server/.env**
```
PORT=5001
MONGO_URI=mongodb://localhost:27017/trucklink
JWT_SECRET=your_jwt_secret
CLAUDE_API_KEY=your_anthropic_api_key
NODE_ENV=development
```

**client/.env**
```
VITE_API_URL=http://localhost:5001/api
```

---

## API Routes

### Auth
- `POST /api/auth/register` — Register new user (driver or shipper)
- `POST /api/auth/login` — Login, returns JWT

### Loads
- `GET  /api/loads` — Available loads (filterable by city/truck type, paginated)
- `GET  /api/loads/my` — Shipper's own loads
- `GET  /api/loads/driver` — Driver's accepted loads
- `POST /api/loads` — Post new load (shipper only)
- `PUT  /api/loads/:id/accept` — Accept a load (driver only, atomic)
- `PUT  /api/loads/:id/status` — Progress: accepted → in_transit → delivered

### Payments
- `GET  /api/payments/my` — Payment history for current user
- `GET  /api/payments/status/:loadId` — Escrow status + countdown
- `POST /api/payments/release/:loadId` — Manually release escrow (shipper, after delivery)
- `GET  /api/payments/all` — All platform payments (owner only)

### AI
- `POST /api/ai/chat` — Claude AI load matching assistant

### Ratings
- `POST /api/ratings` — Submit a rating (requires delivered + payment released)
- `GET  /api/ratings/user/:userId` — All ratings received by a user

### Users
- `GET  /api/users/:id` — Public driver/shipper profile

---

## Build Progress

| Step | Description | Status |
|------|-------------|--------|
| 1 | Project structure | ✅ |
| 2 | Landing Page | ✅ |
| 3 | Login / Auth | ✅ |
| 4 | Driver Dashboard | ✅ |
| 5 | Shipper Dashboard | ✅ |
| 6 | Load Matching Page | ✅ |
| 7 | Claude AI Integration | ✅ |
| 8 | Simulated Escrow Payment | ✅ |
| 9 | Ratings & Reviews | ✅ |
| 10 | Driver Profile + Admin Analytics | ✅ |
| — | Security audit + hardening | ✅ |
| — | Deployed to Vercel + Render + MongoDB Atlas | ✅ |

---

## Docs
Bug reports and fix logs for every build step: [`docs/bugs-and-fixes/`](docs/bugs-and-fixes/)
