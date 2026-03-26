# Step 6 — Load Matching Page Bug Fixes

> 7 issues found and fixed by review agent after Step 6 build.

---

## BUG-S6-C1 — Accept button spinner never stops on success

**File:** client/src/pages/LoadMatchingPage.jsx — LoadCard component
**Severity:** Critical
**Problem:** `setAccepting(false)` was only called in the catch block.
On the happy path, `onAccepted(load._id)` removed the card from the list,
which normally unmounts the component before the stuck state matters.
But if the parent re-render kept the card mounted (e.g., a refresh failed
after accept), the button would stay permanently disabled with a spinner.
**Fix:** Added `setAccepting(false)` immediately before `onAccepted(load._id)`
in the try block so the button always unlocks before the card is removed.

---

## BUG-S6-M1 — Race condition: stale search results overwriting newer ones

**File:** client/src/pages/LoadMatchingPage.jsx — fetchLoads
**Severity:** Medium
**Problem:** No request cancellation. If a user searched "Chicago" then
immediately searched "Dallas" before the first response returned, both
requests were in flight. Whichever resolved last would win — potentially
showing results for the wrong search query.
**Fix:** Added `useRef` to store an `AbortController`. Every call to
`fetchLoads` aborts the previous in-flight request before starting a new
one. Axios forwards the `signal` to the fetch, so cancelled requests
throw a `CanceledError` which is silently swallowed (not shown as an error
to the user). `loadService.getAvailableLoads()` updated to accept and
forward the `signal` parameter.

---

## BUG-S6-M2 — Sticky filter bar misaligned behind navbar

**File:** client/src/pages/LoadMatchingPage.css
**Severity:** Medium
**Problem:** Filter bar `top: 64px` but the Navbar is `height: 68px`
(confirmed in Navbar.css). The 4px gap caused the filter bar to slide
4px behind the navbar bottom edge when scrolling, making the top border
of the filter bar invisible under the navbar.
**Fix:** Changed `top: 64px` to `top: 68px`.

---

## BUG-S6-M3 — Missing CSS variables --gray-300, --gray-500, --gray-700

**File:** client/src/index.css
**Severity:** Medium
**Problem:** `LoadMatchingPage.css` used `--gray-300` (card hover border),
`--gray-500` (pay rate text), and `--gray-700` (tag text). None of these
were defined in `index.css`. Browsers silently fall back to `inherit` or
an empty value, producing wrong colors.
**Fix:** Added the three missing variables to the `:root` block in
`index.css`:
- `--gray-300: #cbd5e1`
- `--gray-500: #64748b`
- `--gray-700: #334155`

---

## BUG-S6-M4 — Truck type select not disabled during loading

**File:** client/src/pages/LoadMatchingPage.jsx
**Severity:** Medium
**Problem:** During a fetch, the Search button and text inputs were
effectively locked (Search shows spinner), but the truck type `<select>`
had no `disabled` attribute. A user could change the truck type while a
request was in flight, creating inconsistency between what was searched
and what would be displayed.
**Fix:** Added `disabled={loading}` to the truck type select element,
matching the disabled state of the Search button.

---

## BUG-S6-N1 — Enter key handlers missing e.preventDefault()

**File:** client/src/pages/LoadMatchingPage.jsx
**Severity:** Minor
**Problem:** `onKeyDown` handlers on the two text inputs called
`handleSearch()` directly without calling `e.preventDefault()` first.
If these inputs were ever moved inside a `<form>`, the default Enter
behavior would fire a form submission in addition to the search.
**Fix:** Changed both handlers to the explicit form:
`if (e.key === 'Enter') { e.preventDefault(); handleSearch(); }`

---

## BUG-S6-N2 — Filter buttons missing :disabled visual styles

**File:** client/src/pages/LoadMatchingPage.css
**Severity:** Minor
**Problem:** When `loading=true`, the Search and Clear buttons have
`disabled` set, but there were no `:disabled` CSS rules. The buttons
inherited `.btn-primary:hover` transform/color transitions while visually
appearing active, giving no feedback that they were locked.
**Fix:** Added:
```css
.filter-search-btn:disabled,
.filter-reset-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}
```

---

## Summary

| Severity | Count | Status |
|----------|-------|--------|
| Critical | 1 | Fixed |
| Medium | 4 | All fixed |
| Minor | 2 | All fixed |
| **Total** | **7** | **All fixed** |
