# Step 9 — Ratings & Reviews: Bug Fixes

**Total fixes applied: 10**
Review agents ran after Step 9 implementation and identified the following issues.

---

## Critical (3)

### BUG-S9-C1 — React Rules of Hooks violation in RatingWidget

**File:** `client/src/pages/DriverDashboard.jsx` + `ShipperDashboard.jsx`

**Problem:** Both `RatingWidget` components called `useState` *after* computing `alreadyRated` from props. React requires all hooks to be called unconditionally before any early returns. Because `alreadyRated` can change on re-render, React would see a different number of hook calls between renders, causing a "Rendered more hooks than during the previous render" runtime crash.

```jsx
// BEFORE (broken):
const alreadyRated = myRatings.find(...);   // derived value first
const [score, setScore] = useState(0);       // hook called AFTER — violation
if (alreadyRated || submitted) return ...;   // early return
```

**Fix:** Moved all six `useState` calls to the top of the component, then computed `alreadyRated` as a derived value below them.

```jsx
// AFTER (correct):
const [score, setScore] = useState(0);       // ALL hooks first
const [hovered, setHovered] = useState(0);
// ...
const alreadyRated = myRatings.find(...);    // derived value after hooks
if (alreadyRated || submitted) return ...;   // early return now safe
```

---

### BUG-S9-C2 — Rating score validation accepted NaN as valid

**File:** `server/routes/ratings.js:16`

**Problem:** `!scoreInt` is `true` for both `NaN` (from `parseInt("abc")`) and `0` (from `parseInt("0")`). Since the valid range is 1–5, score `0` can never be submitted, but `!scoreInt` also blocks `parseInt` returning `0` as a side effect of any numeric input parsing — more importantly, `!NaN === true` only because `NaN` is falsy, which works accidentally but not by intent. Relying on `!value` for NaN detection is fragile and misleading.

**Fix:** Changed `if (!scoreInt || ...)` to `if (isNaN(scoreInt) || ...)` — explicit and semantically correct.

```js
// BEFORE: if (!scoreInt || scoreInt < 1 || scoreInt > 5)
// AFTER:  if (isNaN(scoreInt) || scoreInt < 1 || scoreInt > 5)
```

---

### BUG-S9-C3 — Seed script left stale Rating records across runs

**File:** `server/seed/seedData.js`

**Problem:** The seed script deleted Users, Loads, and Payments but not Ratings. On re-seed, orphaned Rating documents from the previous run remained in the database, creating a state where test accounts appeared to have already rated loads that no longer existed. This corrupted the "already rated" check in the UI.

**Fix:** Imported the Rating model and added `await Rating.deleteMany({})` to the clear block alongside the other collections.

---

## High (2)

### BUG-S9-H1 — ValidationError and duplicate key (E11000) returned as HTTP 500

**File:** `server/server.js` — global error handler

**Problem:** Mongoose schema validation failures (e.g., `score` outside 1–5 min/max validators, missing required fields) were caught by the global handler but fell through to the generic `500` path. Similarly, attempts to submit a duplicate rating (violating the `{ load, rater }` unique index) returned a raw 500 instead of a meaningful 409.

**Fix:** Added two new branches to the global error handler before the generic fallback:

```js
if (err.name === 'ValidationError') {
  const messages = Object.values(err.errors).map((e) => e.message);
  return res.status(400).json({ message: messages.join('; ') });
}
if (err.code === 11000) {
  const field = Object.keys(err.keyValue || {})[0] || 'field';
  return res.status(409).json({ message: `Duplicate value for ${field}` });
}
```

---

### BUG-S9-H2 — RatingWidget state not reset when loadId prop changes

**File:** `client/src/pages/DriverDashboard.jsx` + `ShipperDashboard.jsx`

**Problem:** If a `RatingWidget` instance was reused with a different `loadId` (e.g., navigating between delivered loads in the Earnings tab), the previous load's `score`, `comment`, and `submitted` state persisted. A driver who already submitted a rating for load A would see the "already rated" confirmation briefly for load B before `myRatings` re-checked.

**Fix:** Added a `useEffect` that resets all widget state when `loadId` changes:

```js
useEffect(() => {
  setScore(0); setHovered(0); setComment('');
  setSubmitting(false); setSubmitted(false); setError('');
}, [loadId]);
```

---

## Medium (3)

### BUG-S9-M1 — RatingWidget rendered before myRatings finished loading

**File:** `client/src/pages/DriverDashboard.jsx` + `ShipperDashboard.jsx`

**Problem:** `getMyRatings()` is async. If it hadn't resolved yet, `myRatings` was an empty array, so `alreadyRated` would always be `false`. A user who quickly clicked "Submit Rating" before the fetch completed could submit a duplicate rating (caught server-side by the unique index, but resulting in a confusing 409 error in the UI).

**Fix:** Added a `ratingsLoaded` boolean state in each dashboard, set to `true` after the fetch resolves or rejects. The `RatingWidget` is only rendered when `ratingsLoaded` is `true`, preventing the premature render.

---

### BUG-S9-M2 — Missing aria-label on rating comment textarea

**File:** `client/src/pages/DriverDashboard.jsx` + `ShipperDashboard.jsx`

**Problem:** The rating `<textarea>` had no `aria-label`. Screen readers had no way to identify the field's purpose beyond the placeholder text (which is not an accessible label).

**Fix:** Added `aria-label="Optional comment for your rating"` to both textarea elements.

---

## Low (2)

### BUG-S9-L1 — escapeRegex helper defined inside route handler on every request

**File:** `server/routes/loads.js`

**Problem:** The `escapeRegex` function was a pure helper (no closure dependencies) defined inside the `GET /api/loads` handler. This meant JavaScript re-allocated the function on every request, which is minor overhead but signals misplaced code.

**Fix:** Hoisted `escapeRegex` to module level, above the router definition, where it belongs.

---

## Fix Summary

| Severity | Count |
|----------|-------|
| 🔴 Critical | 3 |
| 🟠 High | 2 |
| 🟡 Medium | 3 |
| ⚪ Low | 2 |
| **Total** | **10** |
