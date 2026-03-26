# Step 4 — Driver Dashboard Bug Fixes

> 14 issues found and fixed by review agent after Step 4 build.

---

## BUG-S4-C1 — Silent error swallowing in fetchActiveLoads
**File:** client/src/pages/DriverDashboard.jsx
**Severity:** Critical
**Problem:** Empty catch block made API failures indistinguishable
from empty results. Driver saw "No loads yet" with no indication
something went wrong.
**Fix:** Added activeError state. Catch block sets the error message.
JSX shows error banner with "Try Again" button.

---

## BUG-S4-C2 — Silent error swallowing in fetchAvailableLoads
**File:** client/src/pages/DriverDashboard.jsx
**Severity:** Critical
**Problem:** Same empty catch pattern. Failed search showed empty
state — user assumed no loads existed.
**Fix:** Added availableError state with same error banner pattern.

---

## BUG-S4-C3 — EscrowTimer has no error state
**File:** client/src/pages/DriverDashboard.jsx — EscrowTimer component
**Severity:** Critical
**Problem:** Payment status fetch failure caused the timer to silently
not render. No spinner, no message, nothing shown to driver.
**Fix:** Added loading, error, and success states. Error renders
"Unable to load payment status" with warning styling.

---

## BUG-S4-C4 — alert() used for accept-load errors
**File:** client/src/pages/DriverDashboard.jsx — handleAccept
**Severity:** Critical
**Problem:** Browser alert() used for the most important action
in the dashboard. Jarring UX, blocks the thread, inconsistent
with the rest of the app.
**Fix:** Replaced with acceptError state displayed as inline
error banner above the loads grid. Clears on next accept attempt.

---

## BUG-S4-M1 — Filters firing API request on every keystroke
**File:** client/src/pages/DriverDashboard.jsx
**Severity:** Medium
**Problem:** fetchAvailableLoads had filters in useCallback deps.
Every character typed rebuilt the function and triggered useEffect,
sending an API request per keystroke.
**Fix:** fetchAvailableLoads now takes params as an argument with
empty useCallback deps. Only fires on mount and on Search button click.

---

## BUG-S4-M2 — fetchActiveLoads missing loading state reset
**File:** client/src/pages/DriverDashboard.jsx
**Severity:** Medium
**Problem:** loadingActive started as true but fetchActiveLoads
never reset it to true before re-fetching. Status update refreshes
showed no loading indicator.
**Fix:** Added setLoadingActive(true) as first line of fetchActiveLoads.

---

## BUG-S4-M3 — toLocaleString() called on potentially undefined values
**File:** client/src/pages/DriverDashboard.jsx
**Severity:** Medium
**Problem:** load.miles.toLocaleString(), load.weight.toLocaleString()
etc. threw TypeError if API returned a load with missing numeric fields.
**Fix:** All numeric renders guarded with optional chaining and fallback:
load.miles?.toLocaleString() ?? '—' across both card components.

---

## BUG-S4-N1 — Filter inputs missing aria-labels
**File:** client/src/pages/DriverDashboard.jsx
**Severity:** Minor
**Fix:** Added aria-label to all three filter inputs
(pickup city, delivery city, truck type).

---

## BUG-S4-N2 — Search button not disabled while loading
**File:** client/src/pages/DriverDashboard.jsx
**Severity:** Minor
**Fix:** Search button now has disabled={loadingAvailable}
and shows spinner while loading.

---

## BUG-S4-N3 — Optimistic accept has no rollback
**File:** client/src/pages/DriverDashboard.jsx
**Severity:** Minor
**Problem:** Load removed from available list optimistically.
If fetchActiveLoads then failed, the load vanished from both lists.
**Fix:** Nested try/catch — accept success and refresh failure
handled separately. Load reappears if refresh fails.

---

## BUG-S4-N4 — Missing CSS for error and loading states
**File:** client/src/pages/DriverDashboard.css
**Severity:** Minor
**Fix:** Added rules for .escrow-info--error, .escrow-info--loading,
.escrow-spinner, .error-state, .section-error.

---

## BUG-S4-N5 — Unused sub prop on StatCard
**File:** client/src/pages/DriverDashboard.jsx
**Severity:** Minor
**Fix:** Removed sub prop from StatCard definition and all usages.

---

## BUG-S4-N6 — Unused useNavigate import
**File:** client/src/pages/DriverDashboard.jsx
**Severity:** Minor
**Fix:** Removed unused useNavigate import.

---

## Summary

| Severity | Count | Status |
|----------|-------|--------|
| Critical | 4 | All fixed |
| Medium | 3 | All fixed |
| Minor | 6 | All fixed |
| **Total** | **14** | **All fixed** |
