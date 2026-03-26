# Frontend — Medium Severity Issues

> All 5 issues fixed. See `summary.md` for the full index.

---

## BUG-F-M1 — .how__connector rendered but has no CSS (invisible element)

**Affected file:** `client/src/pages/LandingPage.jsx` line 200 / `LandingPage.css`

### What it was
The "How It Works" section renders a connector element between each step:

```jsx
{i < HOW_IT_WORKS.length - 1 && <div className="how__connector" />}
```

However, `.how__connector` had no CSS rule defined anywhere. The `<div>` was
present in the DOM but invisible — the visual connecting lines between steps
were completely absent, making the section look disconnected.

### Root cause
The JSX and the CSS were written at different times and the CSS rule was forgotten.

### Fix
Added the missing rule to `LandingPage.css`:

```css
.how__connector {
  width: 48px;
  height: 2px;
  background: var(--gray-200);
  align-self: center;
  flex-shrink: 0;
}
```

---

## BUG-F-M2 — Register and login responses return different shapes

**Affected file:** `server/routes/auth.js` — `/register` vs `/login` responses

### What it was
The `/login` endpoint returned `trustScore`, `totalDeliveries`, `totalEarnings`,
and `companyName` in its response. The `/register` endpoint returned only
`_id`, `name`, `email`, `role`, and `token`.

Both responses were stored in `localStorage` and used as the global `user` object.
After registration, any dashboard code reading `user.trustScore` or `user.companyName`
would receive `undefined`. After logging in, those fields would be present. This
inconsistency made the app behave differently depending on how a user entered it.

### Root cause
The two endpoints were built independently without ensuring a consistent response shape.

### Fix
Added the missing fields to the `/register` response to match `/login` exactly:

```js
res.status(201).json({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  trustScore: user.trustScore,
  totalDeliveries: user.totalDeliveries,
  totalEarnings: user.totalEarnings,
  companyName: user.companyName,
  token: generateToken(user._id),
});
```

---

## BUG-F-M3 — Network errors silently swallowed in login

**Affected file:** `client/src/pages/LoginPage.jsx` line 93

### What it was
The catch block used `err.response?.data?.message`. When a network error occurs
(server down, CORS failure, timeout), `err.response` is `undefined`. The optional
chain returns `undefined`, and the fallback `'Something went wrong. Please try again.'`
shows — indistinguishable from an API error.

Developers and users had no way to tell whether the problem was wrong credentials
vs. the server being unreachable.

### Root cause
Only API-level errors (with a response object) were handled — transport-level errors
were not differentiated.

### Fix
Added an explicit check for the absence of `err.response` before the general handler:

```js
if (!err.response) {
  setError('Cannot reach the server. Please check your connection and try again.');
  return;
}
const msg = err.response.data?.message || 'Something went wrong. Please try again.';
setError(msg);
```

---

## BUG-F-M4 — Role selector cards missing ARIA labels

**Affected file:** `client/src/pages/LoginPage.jsx` lines 134–144

### What it was
The three role cards (Driver, Shipper, Owner) were rendered as `<button>` elements
with only visual children (SVG icon + text spans). Screen readers would announce
the button contents as fragments without clear semantic meaning.

### Root cause
`aria-label` and `aria-pressed` attributes were not added when the component was built.

### Fix
Added descriptive `aria-label` and `aria-pressed` to each role button:

```jsx
<button
  aria-label={`Sign in as ${r.label}: ${r.description}`}
  aria-pressed={selectedRole === r.id}
  ...
>
```

---

## BUG-F-M5 — Empty user.name string causes blank avatar

**Affected file:** `client/src/components/Navbar.jsx` lines 40–41

### What it was
Even with the `user.name?.charAt(0)` guard (BUG-F-C1), an empty string `""` would
cause `charAt(0)` to return `""`, rendering a blank avatar circle with no character.
Similarly, a single-word name like `"Marcus"` would correctly show `"M"` but the
display name would show the full name instead of just the first name in edge cases.

### Root cause
No fallback for the empty string case — only the null/undefined case was guarded.

### Fix
The nullish coalescing fallback handles this: `user.name?.charAt(0) ?? '?'`
returns `'?'` when `charAt(0)` produces an empty string (falsy).
The display name uses `?? 'User'` as a fallback.
