# Frontend — Minor Issues

> All 6 issues fixed. See `summary.md` for the full index.

---

## BUG-F-N1 — --gray-700 CSS variable not in design system

**Affected file:** `client/src/pages/LandingPage.css` line 566

### What it was
```css
color: var(--gray-700, #374151);
```

`--gray-700` is not defined in `index.css`. The design system uses
`--gray-50`, `--gray-100`, `--gray-200`, `--gray-400`, `--gray-600`, and `--gray-800`
— skipping `--gray-700` entirely. The hardcoded fallback `#374151` prevented a visual
regression, but the inconsistency made the design system less trustworthy.

### Fix
Replaced with the nearest defined variable:

```css
color: var(--gray-600);
```

---

## BUG-F-N2 — Role cards remain interactive during form submission

**Affected file:** `client/src/pages/LoginPage.jsx` lines 134–144

### What it was
When the submit button entered its loading/disabled state, the role selector cards
remained fully interactive. A user could click a different role while the API call
was in flight, which could cause confusing state if the request resolved mid-switch.

### Root cause
The `disabled` prop was only applied to the submit button, not the role cards.

### Fix
Added `disabled={loading}` to each role card button:

```jsx
<button
  type="button"
  disabled={loading}
  onClick={() => { setSelectedRole(r.id); setError(''); }}
  ...
>
```

---

## BUG-F-N3 — Email validation bypassed by noValidate

**Affected file:** `client/src/pages/LoginPage.jsx` lines 167–177

### What it was
The email input had `type="email"` and `required`, but the form's `noValidate`
attribute disabled the browser's built-in email format checking. Users could
submit `"notanemail"` or `"test@"` without any client-side rejection.

### Root cause
`noValidate` was added to allow custom error display, but no manual email
regex was added to compensate.

### Fix
Covered by the `validate()` function added in BUG-F-C3:

```js
if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
  return 'Please enter a valid email address.';
}
```

---

## BUG-F-N4 — No password minimum length on registration form

**Affected file:** `client/src/pages/LoginPage.jsx` lines 179–191

### What it was
The registration password field had no minimum length constraint. Users could
create an account with a 1-character password. While the backend now enforces 6
characters (BUG-B-M4), the user would only find out after a network round trip.

### Root cause
No frontend-side length check before submission.

### Fix
Covered by the `validate()` function added in BUG-F-C3:

```js
if (mode === 'register' && form.password.length < 6) {
  return 'Password must be at least 6 characters.';
}
```

---

## BUG-F-N5 — Missing name validation on registration form

**Affected file:** `client/src/pages/LoginPage.jsx`

### What it was
The "Full Name" field in register mode had `required` but since `noValidate` was
set, that attribute did nothing. An empty or whitespace-only name could be submitted.

### Root cause
Same root as BUG-F-N3 — `noValidate` removed browser validation without a manual
replacement.

### Fix
Covered by the `validate()` function added in BUG-F-C3:

```js
if (mode === 'register' && !form.name.trim()) {
  return 'Full name is required.';
}
```

---

## BUG-F-N6 — Owner role routed to wrong page (LoadMatchingPage)

**Affected file:** `client/src/App.jsx` line 58

### What it was
Owner-role users logging in were redirected to `/owner`, which rendered
`<LoadMatchingPage />` — a shipper/driver freight interface with no relevance
to fleet owners. The comment in the code even acknowledged this:
`{/* Owner uses load matching page for now */}`.

### Root cause
The owner dashboard page had not been created yet.

### Fix
Created `client/src/pages/OwnerDashboard.jsx` with a polished "Coming Soon" page
that includes:
- Welcome message with the user's name
- "Coming Soon" badge
- Preview of planned features (fleet management, driver hiring, earnings)
- Sign out button

Updated `App.jsx` to import and render `<OwnerDashboard />` on the `/owner` route.
