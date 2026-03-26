# TruckLink - Freight Matching Platform

A freight matching web application for the US trucking market.
Shippers post loads, verified drivers accept them, and payment is guaranteed through escrow — with a 2-hour payment guarantee after delivery.

## Tech Stack
- **Frontend**: React + Vite + React Router
- **Backend**: Node.js + Express
- **Database**: MongoDB
- **Auth**: JWT
- **AI**: Claude API (Anthropic)

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

| Role    | Email                  | Name                    |
|---------|------------------------|-------------------------|
| Driver  | marcus@driver.com      | Marcus Johnson          |
| Driver  | sarah@driver.com       | Sarah Mitchell          |
| Shipper | robert@shipper.com     | Robert Chen             |
| Shipper | amanda@shipper.com     | Amanda Torres           |
| Owner   | dave@owner.com         | Big Dave Trucking       |

## API Routes
- `POST /api/auth/register` — Register new user
- `POST /api/auth/login` — Login, returns JWT
- `GET  /api/loads` — Available loads (drivers)
- `POST /api/loads` — Post new load (shippers)
- `PUT  /api/loads/:id/accept` — Accept a load (drivers)
- `PUT  /api/loads/:id/status` — Update load status
- `GET  /api/payments/my` — Payment history
- `POST /api/ai/chat` — AI assistant (Step 7)
