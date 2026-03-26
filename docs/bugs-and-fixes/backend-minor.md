# Backend — Minor Issues

> All 8 issues fixed or addressed. See `summary.md` for the full index.

---

## BUG-B-N1 — No .env.example file

**Affected:** Project root — missing file

### What it was
No `.env.example` existed. New developers cloning the repo had no way to know
which environment variables were required to run the server. The actual `.env`
file should never be committed to version control.

### Fix
Created `server/.env.example` documenting all required and optional variables:

```
MONGO_URI=mongodb://localhost:27017/trucklink
JWT_SECRET=your_jwt_secret_here
PORT=5000
CLIENT_ORIGIN=http://localhost:5173
CLAUDE_API_KEY=your_claude_api_key_here
```

---

## BUG-B-N2 — CLAUDE_API_KEY defined but unused

**Affected file:** `server/.env`

### What it was
`CLAUDE_API_KEY` was defined in `.env` as a placeholder for Step 7 (Claude AI
integration), but no code referenced it yet. It appeared as dead configuration.

### Root cause
Placeholder added ahead of its implementation step.

### Note
Not a bug — kept intentionally for Step 7. Now documented in `.env.example`
with a clear comment: `# Claude API key (used in Step 7)`.

---

## BUG-B-N3 — Inconsistent populate() syntax in loads.js

**Affected file:** `server/routes/loads.js` — accept route (line 113)

### What it was
The accept route used `load.populate(['shipper', 'driver'])` — an array of plain
strings with no field selection. All other routes used
`.populate('field', 'selectedFields')`. This inconsistency meant the accept route
returned all user fields (including hashed passwords) in the populated response.

### Root cause
Different populate syntax used during development without standardization.

### Fix
Standardized to the explicit object form with field selection:

```js
const populated = await load.populate([
  { path: 'shipper', select: 'name companyName rating' },
  { path: 'driver',  select: 'name trustScore totalDeliveries' },
]);
```

---

## BUG-B-N4 — CDL number not marked unique in User schema

**Affected file:** `server/models/User.js` line 27

### What it was
`cdlNumber` was defined as `{ type: String }` with no uniqueness constraint.
Two drivers could register with the same CDL number, making identity verification
unreliable in a real-world scenario.

### Root cause
`unique: true` was never added to the field definition.

### Fix
Added `unique: true` with `sparse: true`. The `sparse` option is required because
shippers and owners have no CDL — without it, every non-driver user's null/absent
CDL value would conflict with each other on the unique index.

```js
cdlNumber: { type: String, unique: true, sparse: true },
```

---

## BUG-B-N5 — No request logging

**Affected file:** `server/server.js`

### What it was
No HTTP request logging middleware. There was no visibility into which endpoints
were being called, response times, or status codes during development or debugging.

### Root cause
No logging library installed or configured during initial setup.

### Fix
Installed `morgan` and added it before the routes:

```js
const morgan = require('morgan');
app.use(morgan('dev'));
```

`morgan('dev')` logs: `GET /api/loads 200 14ms` style output to the console.

---

## BUG-B-N6 — No rate limiting on auth routes

**Affected file:** `server/server.js`

### What it was
The `/api/auth/login` endpoint had no request rate limiting. An attacker could make
unlimited password-guessing attempts against any account with no throttling.

### Root cause
No rate limiting library installed or configured.

### Fix
Installed `express-rate-limit` and applied a limiter specifically to `/api/auth`:

```js
const rateLimit = require('express-rate-limit');

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: { message: 'Too many login attempts. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/auth', authLimiter, require('./routes/auth'));
```

---

## BUG-B-N7 — Owner role redirected to wrong dashboard

**Affected file:** `client/src/App.jsx` line 58

### What it was
The `/owner` route rendered `<LoadMatchingPage />` as a placeholder. Owner-role
users landing there would see a shipper/driver interface with no relevance to their
actual role, causing confusion.

### Root cause
Owner dashboard page had not yet been created.

### Fix
Created `client/src/pages/OwnerDashboard.jsx` (and `OwnerDashboard.css`) with a
clean "Coming Soon" page that shows the user's name, lists planned features (fleet
management, driver hiring, earnings overview), and a sign out button.

Updated `App.jsx` to point the `/owner` route to `<OwnerDashboard />`.

---

## BUG-B-N8 — No HTTPS / production config

**Affected file:** `server/server.js`

### What it was
No HTTPS redirect or production configuration. JWTs are transmitted over plain
HTTP in development. CORS is set to HTTP localhost.

### Root cause
Development-only configuration — no production environment handling.

### Note
Acceptable for a local portfolio project. In a production deployment, this would
require HTTPS termination (via a reverse proxy like nginx or a hosting platform),
HSTS headers, and a secure `CLIENT_ORIGIN`. Documented here for future reference.
