# Backend — Critical Bugs

> All 6 issues fixed. See `summary.md` for the full index.

---

## BUG-B-C1 — No try-catch on async route handlers

**Affected files:** `server/routes/auth.js`, `server/routes/loads.js`, `server/routes/payments.js`
**All route handlers (every async function)**

### What it was
Every route handler used `async (req, res) => { ... }` with zero error handling.
If any `await` call threw (bad ObjectId, MongoDB disconnect, schema validation error),
the rejected promise went unhandled — the request would hang indefinitely, and in some
Node.js versions, the server process would crash.

### Root cause
Express versions below 5.x do not catch rejected promises from async route handlers
automatically. Without a `try-catch` or a wrapper utility, thrown errors are invisible
to Express's error pipeline.

### Fix
Wrapped every async route handler body in `try { ... } catch (err) { next(err); }`.
The `next(err)` call forwards to the global error handler (BUG-B-C2).

```js
// Before
router.get('/', protect, async (req, res) => {
  const loads = await Load.find({});
  res.json(loads);
});

// After
router.get('/', protect, async (req, res, next) => {
  try {
    const loads = await Load.find({});
    res.json(loads);
  } catch (err) {
    next(err);
  }
});
```

---

## BUG-B-C2 — No global error handler middleware in server.js

**Affected file:** `server/server.js` (missing entirely)

### What it was
`server.js` had no `app.use((err, req, res, next) => { ... })` middleware.
Errors forwarded via `next(err)` had nowhere to go, resulting in default Express
HTML error pages or silent failures depending on the Node version.

### Root cause
Error handling middleware was never added during initial project setup.

### Fix
Added a 4-argument error handler at the bottom of `server.js`, after all routes:

```js
app.use((err, req, res, next) => {
  console.error(`[Error] ${req.method} ${req.path} —`, err.message);
  res.status(err.status || 500).json({ message: err.message || 'Internal server error' });
});
```

---

## BUG-B-C3 — Authorization bypass on PUT /api/loads/:id/status

**Affected file:** `server/routes/loads.js` — status update route

### What it was
The status update endpoint (`accepted → in_transit → delivered`) only had `protect`
middleware. Any authenticated user — including shippers — could mark any load as
delivered, which schedules the escrow payment release. A malicious shipper could flip
their own load to "delivered" without a driver ever touching it.

### Root cause
`requireRole('driver')` was missing, and there was no ownership check verifying
that the requesting user is the driver assigned to that load.

### Fix
Added `requireRole('driver')` to the middleware chain and an explicit ownership check:

```js
// Before
router.put('/:id/status', protect, async (req, res) => { ... });

// After
router.put('/:id/status', protect, requireRole('driver'), async (req, res, next) => {
  try {
    const load = await Load.findById(req.params.id);
    if (!load) return res.status(404).json({ message: 'Load not found' });

    if (!load.driver || load.driver.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this load' });
    }
    // ... transition logic
  } catch (err) { next(err); }
});
```

---

## BUG-B-C4 — Information disclosure on GET /api/loads/:id

**Affected file:** `server/routes/loads.js` — single load detail route

### What it was
`GET /api/loads/:id` only had `protect` middleware. Any authenticated user could fetch
full details of any load regardless of status, including shipper email addresses,
full pickup/delivery addresses, and assigned driver info.

### Root cause
No role or ownership check on the detail endpoint — it was treated as fully public
to all logged-in users.

### Fix
Available loads remain viewable to all authenticated users (drivers need to preview
before accepting). Non-available loads (accepted, in_transit, delivered) are
restricted to the shipper, assigned driver, or owner role:

```js
if (load.status !== 'available') {
  const isShipper = load.shipper._id.toString() === req.user._id.toString();
  const isDriver  = load.driver && load.driver._id.toString() === req.user._id.toString();
  const isOwner   = req.user.role === 'owner';
  if (!isShipper && !isDriver && !isOwner) {
    return res.status(403).json({ message: 'Not authorized to view this load' });
  }
}
```

---

## BUG-B-C5 — JWT_SECRET used without existence check

**Affected file:** `server/routes/auth.js` line 7

### What it was
`jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' })` was called without
verifying that `JWT_SECRET` was set. If `.env` failed to load or the variable was
missing, `jwt.sign` would receive `undefined` as the secret — either throwing or
silently producing tokens that cannot be verified consistently.

### Root cause
No startup validation of required environment variables.

### Fix
Added an env guard in `server.js` that runs before any other code:

```js
const requiredEnv = ['JWT_SECRET', 'MONGO_URI'];
const missingEnv = requiredEnv.filter((key) => !process.env[key]);
if (missingEnv.length) {
  console.error(`[TruckLink] Missing required environment variables: ${missingEnv.join(', ')}`);
  process.exit(1);
}
```

---

## BUG-B-C6 — MONGO_URI used without existence check

**Affected file:** `server/config/db.js` line 5

### What it was
`mongoose.connect(process.env.MONGO_URI)` was called with no guard. If `MONGO_URI`
was missing, Mongoose would throw a cryptic `MongoParseError` or attempt to connect
to `undefined`, leaving developers with no clear error message about the real cause.

### Root cause
Same as BUG-B-C5 — no env validation on boot.

### Fix
Covered by the same startup guard added in `server.js` for BUG-B-C5.
Both `JWT_SECRET` and `MONGO_URI` are checked before `connectDB()` is called.
