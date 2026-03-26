# TruckLink — Freight Matching Platform

A freight matching web application for the US trucking market.
Shippers post loads, verified drivers accept them, and payment is guaranteed through escrow — released automatically 2 hours after delivery confirmation.

## Features
- **Role-based auth** — separate flows for Drivers, Shippers, and Owners
- **Load marketplace** — filter by city and truck type
- **Atomic load acceptance** — race-condition-safe, first driver wins
- **Escrow payments** — funds locked at posting, released on delivery
- **AI load matching** — Claude API suggests best loads for a driver's route
- **Owner admin panel** — full payments table with escrow/released filter
- **Driver earnings tab** — payment history with status and countdown
- **Security hardened** — helmet headers, rate limiting, ReDoS protection, ownership validation

## Tech Stack
- **Frontend**: React + Vite + React Router
- **Backend**: Node.js + Express
- **Database**: MongoDB + Mongoose
- **Auth**: JWT
- **AI**: Claude API (Anthropic)
- **Security**: Helmet, express-rate-limit, CORS

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB running locally (`mongod`)

### Backend
```bash
cd server
npm install
npm run seed     # Populate sample data
npm run dev      # Start on port 5000
```

### Frontend
```bash
cd client
npm install
npm run dev      # Start on port 5173
```

## Test Accounts (after seeding)
All passwords: `password123`

| Role    | Email                  | Name                         |
|---------|------------------------|------------------------------|
| Driver  | marcus@driver.com      | Marcus Johnson (142 deliveries) |
| Driver  | sarah@driver.com       | Sarah Mitchell (98 deliveries)  |
| Shipper | robert@shipper.com     | Robert Chen — Chen Industrial   |
| Shipper | amanda@shipper.com     | Amanda Torres — Torres Produce  |
| Owner   | dave@owner.com         | Big Dave Logistics LLC          |

## API Routes

### Auth
- `POST /api/auth/register` — Register new user
- `POST /api/auth/login` — Login, returns JWT

### Loads
- `GET  /api/loads` — Available loads (filterable by city/truck type)
- `GET  /api/loads/my` — Shipper's own loads
- `GET  /api/loads/driver` — Driver's accepted loads
- `GET  /api/loads/:id` — Single load detail
- `POST /api/loads` — Post new load (shipper only)
- `PUT  /api/loads/:id/accept` — Accept a load (driver only, atomic)
- `PUT  /api/loads/:id/status` — Progress: accepted → in_transit → delivered

### Payments
- `GET  /api/payments/my` — Payment history for current user
- `GET  /api/payments/status/:loadId` — Escrow status + countdown (owner/shipper/driver)
- `POST /api/payments/release/:loadId` — Manually release escrow (shipper, after delivery)
- `GET  /api/payments/all` — All platform payments (owner only)

### AI
- `POST /api/ai/chat` — Claude AI load matching assistant

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

## Docs
Bug reports and fix logs for every build step: [`docs/bugs-and-fixes/`](docs/bugs-and-fixes/)
