# Step 5 — Shipper Dashboard Bug Fixes

> 9 issues found and fixed by review agent after Step 5 build.

---

## BUG-S5-C1 — Non-submit buttons missing type="button"

**File:** client/src/pages/ShipperDashboard.jsx
**Severity:** Critical
**Problem:** Seven buttons (tab toggles, Try Again, Post Your First Load,
Release Payment, Yes/No confirm, Cancel form) had no explicit `type` attribute.
Inside a `<form>`, any button without `type="button"` defaults to `type="submit"`,
which triggers form submission and page reload unexpectedly.
**Fix:** Added `type="button"` to all 7 non-submit buttons. The submit button
already had `type="submit"` explicitly.

---

## BUG-S5-C2 — ReleasePaymentButton double-release race condition

**File:** client/src/pages/ShipperDashboard.jsx — ReleasePaymentButton
**Severity:** Critical
**Problem:** `released` state lived in component state. When `onReleased()`
triggered a parent re-render (fetchLoads), React could recreate the component
with fresh state, resetting `released` to false. A second click could then
trigger a second payment release call to the API.
**Fix:** Added `const hasReleased = useRef(false)` which persists across
re-renders. Guard at top of handler: `if (hasReleased.current) return`.
Set `hasReleased.current = true` before the API call. Reset to false only
in the catch block (to allow retry after genuine failure).

---

## BUG-S5-C3 — Cancelled loads not rendered

**File:** client/src/pages/ShipperDashboard.jsx
**Severity:** Critical
**Problem:** Loads with `status: 'cancelled'` were silently dropped — not
shown in any section. Shippers had no visibility into loads that were
cancelled, which could cause confusion about missing loads.
**Fix:** Added `cancelledLoads` filter and a "Cancelled" section rendered
below the Delivered section, using `section-heading--completed` styling.

---

## BUG-S5-M1 — Unused showPostForm state

**File:** client/src/pages/ShipperDashboard.jsx
**Severity:** Medium
**Problem:** `showPostForm` state was declared and set in multiple places
but never read. Tab switching was entirely controlled by `activeTab`. The
dead state created misleading code and extra re-renders on every tab click.
**Fix:** Removed `showPostForm` state and all `setShowPostForm` calls.

---

## BUG-S5-M2 — totalPay preview showed $NaN on partial input

**File:** client/src/pages/ShipperDashboard.jsx — PostLoadForm
**Severity:** Medium
**Problem:** `form.miles && form.ratePerMile` is truthy for any non-empty
string, including "3." or "-" mid-typing. `parseFloat("3.")` returns 3 but
`parseFloat("-")` returns NaN, causing `$NaN` to flash in the preview.
**Fix:** Changed condition to explicitly check `!isNaN(milesVal) &&
!isNaN(rateVal) && milesVal > 0 && rateVal > 0` before computing totalPay.

---

## BUG-S5-M3 — "Total Loads" stat included cancelled loads

**File:** client/src/pages/ShipperDashboard.jsx
**Severity:** Medium
**Problem:** `totalLoads = loads.length` counted cancelled loads. Shippers
would see inflated totals that counted loads that never moved freight.
**Fix:** Changed to `loads.filter(l => l.status !== 'cancelled').length`
so the stat reflects only active/completed business.

---

## BUG-S5-N1 — Error message disappeared on retry in ReleasePaymentButton

**File:** client/src/pages/ShipperDashboard.jsx — ReleasePaymentButton
**Severity:** Minor
**Problem:** `setConfirming(false)` in the catch block collapsed the
confirmation dialog on error. The error message was visible for a moment
then hidden when the dialog closed, making it easy to miss.
**Fix:** Removed `setConfirming(false)` from the catch block. The dialog
stays open on failure, keeping the error banner visible inside it.

---

## BUG-S5-N2 — Confirmation dialog missing ARIA role

**File:** client/src/pages/ShipperDashboard.jsx — ReleasePaymentButton
**Severity:** Minor
**Fix:** Added `role="alertdialog"` and `aria-label="Confirm payment release"`
to the confirmation `<div>` so screen readers announce it as an alert dialog
requiring user action.

---

## BUG-S5-N3 — Tab buttons missing ARIA tab semantics

**File:** client/src/pages/ShipperDashboard.jsx
**Severity:** Minor
**Fix:** Added `role="tab"` and `aria-selected={activeTab === 'loads'|'post'}`
to both dashboard tab buttons so assistive technology correctly identifies
them as tab controls and announces which is active.

---

## Summary

| Severity | Count | Status |
|----------|-------|--------|
| Critical | 3 | All fixed |
| Medium | 3 | All fixed |
| Minor | 3 | All fixed |
| **Total** | **9** | **All fixed** |
