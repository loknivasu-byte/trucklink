# Backend — Medium Severity Issues

> All 9 issues fixed. See `summary.md` for the full index.

---

## BUG-B-M1 — Race condition on load accept (TOCTOU)

**Affected file:** `server/routes/loads.js` — accept route

### What it was
Two drivers hitting `PUT /api/loads/:id/accept` simultaneously could both pass the
`status === 'available'` check before either write completed. Both would be saved
as the assigned driver — a classic Time-of-Check-Time-of-Use (TOCTOU) bug.

### Root cause
The route fetched the load, checked its status, then saved it in separate operations.
No atomic guarantee existed between the check and the write.

### Fix
Replaced the fetch-check-save pattern with a single atomic `findOneAndUpdate` that
only succeeds if the load is still `available`:

```js
// Before
const load = await Load.findById(req.params.id);
if (!load) return res.status(404)...;
if (load.status !== 'available') return res.status(400)...;
load.driver = req.user._id;
load.status = 'accepted';
await load.save();

// After (atomic — only one driver can win)
const load = await Load.findOneAndUpdate(
  { _id: req.params.id, status: 'available' },
  { driver: req.user._id, status: 'accepted' },
  { new: true }
);
if (!load) return res.status(404).json({ message: 'Load not found or no longer available' });
```

---

## BUG-B-M2 — No numeric field validation on load creation

**Affected file:** `server/routes/loads.js` — POST route

### What it was
`miles`, `ratePerMile`, and `weight` were accepted without checking if they were
positive numbers. A shipper could post a load with `miles: -1` or `weight: 0`,
creating invalid records and corrupt `totalPay` calculations.

### Root cause
The presence check (`if (!miles)`) did not validate sign or zero values.

### Fix
Added an explicit positivity check before `Load.create()`:

```js
if (miles <= 0 || ratePerMile <= 0 || weight <= 0) {
  return res.status(400).json({
    message: 'Miles, rate per mile, and weight must be positive numbers'
  });
}
```

---

## BUG-B-M3 — No email format validation on register and login

**Affected file:** `server/routes/auth.js`

### What it was
Email was only checked for presence (`if (!email)`). A user could register with
`email: "notanemail"` and the server would accept it, polluting the database and
causing confusion when they tried to log in.

### Root cause
No regex or email validation library was applied server-side.

### Fix
Added a regex check applied to both register and login:

```js
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

if (!EMAIL_REGEX.test(email)) {
  return res.status(400).json({ message: 'Please provide a valid email address' });
}
```

---

## BUG-B-M4 — No password minimum length on register

**Affected file:** `server/routes/auth.js` — register route

### What it was
The only password check was `if (!password)` — truthy check only.
Users could register with `password: "1"`, creating insecure accounts.

### Root cause
No length enforcement in the route or the schema.

### Fix
Added a minimum 6-character check on registration:

```js
if (password.length < 6) {
  return res.status(400).json({ message: 'Password must be at least 6 characters' });
}
```

---

## BUG-B-M5 — Payment release does nothing if payment not found

**Affected file:** `server/routes/payments.js` — release route

### What it was
The `findOne({ load, shipper })` query could return `null` if the loadId was wrong
or the payment belonged to a different shipper. Without a null check, the code
would proceed to call `.status` on `null`, throwing a runtime error (or in some
paths, silently doing nothing).

### Root cause
Missing guard after the `findOne` call.

### Fix
Explicit 404 guard immediately after the query:

```js
const payment = await Payment.findOne({ load: req.params.loadId, shipper: req.user._id });
if (!payment) return res.status(404).json({ message: 'Payment not found' });
```

---

## BUG-B-M6 — CORS origin hardcoded to localhost

**Affected file:** `server/server.js`

### What it was
`cors({ origin: 'http://localhost:5173' })` was hardcoded. Deploying the frontend
to any other URL would cause all browser requests to be blocked by CORS with no
easy way to change it without editing source code.

### Root cause
Dev convenience — no environment variable abstraction for the frontend origin.

### Fix
Read the origin from an env variable with a localhost fallback:

```js
const allowedOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
app.use(cors({ origin: allowedOrigin, credentials: true }));
```

`CLIENT_ORIGIN` is now documented in `.env.example`.

---

## BUG-B-M7 — Payment model missing updatedAt timestamp

**Affected file:** `server/models/Payment.js`

### What it was
The Payment schema only had a manual `createdAt` field. There was no `updatedAt`,
making it impossible to audit when a payment status changed (e.g., from `in_escrow`
to `released`). For any payment system, this is a critical audit trail gap.

### Root cause
`updatedAt` was simply not added, and Mongoose's built-in timestamps were not enabled.

### Fix
Replaced the manual `createdAt` field with Mongoose's `{ timestamps: true }` option,
which automatically manages both `createdAt` and `updatedAt`:

```js
const paymentSchema = new mongoose.Schema({ ... }, { timestamps: true });
```

---

## BUG-B-M8 — Seed password double-hash bug (broken login)

**Affected file:** `server/seed/seedData.js`

### What it was
The seed called `bcrypt.hash('password123', 10)` and then passed the result to
`User.create()`. Mongoose's `pre('save')` hook checks `isModified('password')` —
which returns `true` for every new document — and hashes the password again.
The stored password was a bcrypt hash of a bcrypt hash. `bcrypt.compare('password123',
doubleHash)` always returns `false`, making every test account unable to log in.

### Root cause
Pre-hashing in the seed conflicted with the model's pre-save hook. The two ran
independently with no awareness of each other.

### Fix
Switched to `bcrypt.hashSync('password123', 10)` and inserted users via
`User.collection.insertOne()`, which bypasses Mongoose middleware entirely.
The hash is stored as-is without being hashed a second time:

```js
const hashedPassword = bcrypt.hashSync('password123', 10);
await User.collection.insertOne({ name: '...', password: hashedPassword, ... });
```

---

## BUG-B-M9 — No min validators on Load schema numeric fields

**Affected file:** `server/models/Load.js`

### What it was
`miles`, `ratePerMile`, `totalPay`, and `weight` had no `min` validators in the
Mongoose schema. Invalid values (negative numbers, zero) could be stored in MongoDB
even if the route-level check was bypassed or misconfigured.

### Root cause
Schema-level validators were not set — only route-level checks existed (which were
also missing, see BUG-B-M2).

### Fix
Added `min` validators directly in the schema as a second line of defense:

```js
miles:       { type: Number, required: true, min: [1, 'Miles must be a positive number'] },
ratePerMile: { type: Number, required: true, min: [0.01, 'Rate per mile must be positive'] },
totalPay:    { type: Number, required: true, min: [0, 'Total pay cannot be negative'] },
weight:      { type: Number, required: true, min: [1, 'Weight must be a positive number'] },
```
