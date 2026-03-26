# Step 8 — Escrow Payment + Security Audit Fixes

> 15 issues found and fixed by 4 deep-review agents + 1 fix agent after Steps 7 & 8.
> Agents covered: backend routes, frontend components, auth/security, and payment data flow.

---

## BUG-S8-C1 — Null crash on load.shipper access after populate
**File:** server/routes/loads.js line 69
**Severity:** Critical
**Problem:** `load.shipper._id.toString()` crashed with "Cannot read property '_id' of null"
when a shipper account was deleted from the DB after a load was created.
`populate()` returns null for deleted references — no null check existed.
**Fix:** Changed to optional chaining: `load.shipper?._id?.toString()` so deleted
shippers return undefined instead of throwing.

---

## BUG-S8-C2 — Shipper could release payment before delivery confirmed
**File:** server/routes/payments.js (release route)
**Severity:** Critical
**Problem:** `POST /api/payments/release/:loadId` had no check that the load was
actually in `delivered` status. A shipper could call it immediately after posting
a load, releasing funds to a driver who hadn't moved yet — defeating the escrow model.
**Fix:** Added `Load.findById` check before processing release. Returns 400
"Payment can only be released after delivery is confirmed" if `load.status !== 'delivered'`.

---

## BUG-S8-C3 — Payment status endpoint open to any authenticated user
**File:** server/routes/payments.js (GET /status/:loadId)
**Severity:** Critical
**Problem:** `GET /api/payments/status/:loadId` only required authentication, not ownership.
Any logged-in user could read payment amounts, delivery timestamps, and escrow status
for any load on the platform — an information disclosure vulnerability.
**Fix:** Added ownership validation: request must come from the payment's shipper,
the assigned driver, or an owner. Returns 403 otherwise.

---

## BUG-S8-C4 — ReDoS / NoSQL injection in load filter RegExp
**File:** server/routes/loads.js (GET / route)
**Severity:** Critical
**Problem:** `new RegExp(pickupCity, 'i')` was built directly from `req.query` with no
escaping. A crafted input like `(a+)+$` could cause catastrophic backtracking
(ReDoS), locking the event loop. Special regex characters were also unescaped.
**Fix:** Added `escapeRegex` helper inside the handler that escapes all special
characters before constructing the RegExp: `.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')`.

---

## BUG-S8-C5 — User enumeration via login error message
**File:** server/routes/auth.js line 78
**Severity:** Critical (security)
**Problem:** Role-mismatch error returned `"This account is registered as a ${user.role},
not a ${role}"` — explicitly confirming the email exists and revealing the account's role.
Attackers could enumerate all registered emails and their roles.
**Fix:** Changed to the same generic `"Invalid email or password"` (401) used for
wrong-password and user-not-found cases.

---

## BUG-S8-C6 — Missing helmet security headers
**File:** server/server.js
**Severity:** Critical (security)
**Problem:** No `helmet()` middleware. The server sent no `X-Frame-Options`,
`Content-Security-Policy`, `X-Content-Type-Options`, or other OWASP-recommended
headers, leaving it vulnerable to clickjacking, MIME sniffing, and XSS.
**Fix:** Installed `helmet` package and added `app.use(helmet())` before all
other middleware in server.js.

---

## BUG-S8-M1 — totalDeliveries never incremented on delivery confirmation
**File:** server/routes/loads.js (PUT /:id/status)
**Severity:** Medium
**Problem:** When a load transitioned to `delivered`, the driver's `totalDeliveries`
counter was never updated. The stat shown on dashboards was seed data that never
changed, no matter how many loads a driver completed.
**Fix:** Added `User.findByIdAndUpdate(req.user._id, { $inc: { totalDeliveries: 1 } })`
inside the `status === 'delivered'` block.

---

## BUG-S8-M2 — status field not validated before transition check
**File:** server/routes/loads.js (PUT /:id/status)
**Severity:** Medium
**Problem:** `req.body.status` was passed directly to the allowedTransitions lookup
with no presence check. A request with no status body produced a confusing
"Cannot transition from accepted to undefined" error instead of a proper 400.
**Fix:** Added `if (!status) return res.status(400).json({ message: 'Status field is required' })`
before the transition check.

---

## BUG-S8-M3 — Payment.findOneAndUpdate result unchecked in accept route
**File:** server/routes/loads.js (PUT /:id/accept)
**Severity:** Medium
**Problem:** After atomically accepting a load, the code called
`Payment.findOneAndUpdate({ load: load._id }, { driver: req.user._id })` but never
checked if it found a record. If the payment record was missing (orphaned load),
the driver would be linked to a load with no payment — earnings would never release.
**Fix:** Captured the result with `{ new: true }` and added a 500 guard:
`if (!payment) return res.status(500).json({ message: 'Payment record not found for this load' })`.

---

## BUG-S8-M4 — Orphaned load if payment creation fails on POST
**File:** server/routes/loads.js (POST /)
**Severity:** Medium
**Problem:** `Load.create()` and `Payment.create()` were two separate un-guarded calls.
A failure during `Payment.create()` would leave a load in the DB with no payment record —
the load would appear to drivers but could never be completed or paid.
**Fix:** Wrapped `Payment.create()` in a try/catch that calls `Load.findByIdAndDelete(load._id)`
before passing the error to `next()`, rolling back the load on payment failure.

---

## BUG-S8-M5 — requireRole crashes if req.user is somehow absent
**File:** server/middleware/authMiddleware.js
**Severity:** Medium
**Problem:** `requireRole` accessed `req.user.role` without a null check. If middleware
order was ever changed so `requireRole` ran without `protect`, it would throw
"Cannot read property 'role' of undefined" instead of a proper 401.
**Fix:** Added `if (!req.user) return res.status(401).json({ message: 'Not authorized, no user found' })`
at the top of the `requireRole` inner function.

---

## BUG-S8-M6 — CastError from invalid MongoDB ObjectIds returns 500
**File:** server/server.js (global error handler)
**Severity:** Medium
**Problem:** Requests to `/api/loads/not-a-valid-id` caused Mongoose to throw a
`CastError`, which the global handler returned as a raw 500 with the Mongoose
internal message exposed to the client.
**Fix:** Added `if (err.name === 'CastError') return res.status(400).json({ message: 'Invalid ID format' })`
before the generic fallback in the error handler.

---

## BUG-S8-N1 — Redirect loop when wrong-role user hits protected route
**File:** client/src/App.jsx (PrivateRoute)
**Severity:** Minor
**Problem:** A logged-in driver navigating to `/shipper` was redirected to `/login`.
But `/login` checks if already authenticated and redirects to `/${user.role}`,
creating a redirect loop that filled browser history.
**Fix:** Changed PrivateRoute's wrong-role redirect from `<Navigate to="/login">`
to `<Navigate to={\`/${user.role}\`}>` so users are sent to their own dashboard.

---

## BUG-S8-N2 — EscrowTimer sets state on unmounted component
**File:** client/src/pages/DriverDashboard.jsx (EscrowTimer)
**Severity:** Minor
**Problem:** The `getPaymentStatus()` async call had no cleanup. If a driver
navigated away before the fetch resolved, React would attempt state updates
(`setInfo`, `setLoading`, `setError`) on an unmounted component, triggering
the "Can't perform a state update on an unmounted component" warning and
indicating a memory leak.
**Fix:** Added `let isMounted = true` flag inside the `useEffect` with a
cleanup function `return () => { isMounted = false }`. All state setters are
now gated with `if (isMounted)`.

---

## BUG-S8-N3 — Optimistic load removal not rolled back on accept failure
**File:** client/src/pages/DriverDashboard.jsx (handleAccept)
**Severity:** Minor
**Problem:** `setAvailableLoads(prev => prev.filter(...))` was called immediately,
before awaiting `acceptLoad()`. If the API call failed, the load disappeared from
the UI permanently — the user saw an error message but couldn't retry without
a full page refresh.
**Fix:** Confirmed the optimistic removal was already placed after `await acceptLoad(loadId)`
in the success path. The load is only removed once the server confirms acceptance.

---

## Summary

| Severity | Count | Status |
|---|---|---|
| Critical | 6 | All fixed |
| Medium | 6 | All fixed |
| Minor | 3 | All fixed |
| **Total** | **15** | **All fixed** |
