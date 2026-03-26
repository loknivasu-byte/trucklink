# Frontend — Critical Bugs

> All 4 issues fixed. See `summary.md` for the full index.

---

## BUG-F-C1 — user.name crash in Navbar (runtime TypeError)

**Affected file:** `client/src/components/Navbar.jsx` lines 40–41

### What it was
```jsx
<div className="navbar__avatar">{user.name[0]}</div>
<span className="navbar__name">{user.name.split(' ')[0]}</span>
```

Both calls assume `user.name` is a non-empty string. If the stored user object had
`name: undefined`, `name: null`, or `name: ""`, these lines would throw:
`TypeError: Cannot read properties of undefined (reading '0')` — crashing the
entire Navbar component and making the app unusable while logged in.

### Root cause
The `{user ? ... : ...}` guard only checks if the `user` object exists, not whether
its `name` property is a usable string. The `AuthContext` stores whatever the API
returns; if the API ever returned a user without a name field, no guard caught it.

### Fix
Replaced with optional chaining and nullish coalescing fallbacks:

```jsx
<div className="navbar__avatar">{user.name?.charAt(0) ?? '?'}</div>
<span className="navbar__name">{user.name?.split(' ')[0] ?? 'User'}</span>
```

---

## BUG-F-C2 — useAuth throws no error when used outside AuthProvider

**Affected file:** `client/src/context/AuthContext.jsx` line 28

### What it was
```js
export const useAuth = () => useContext(AuthContext);
```

`useContext(AuthContext)` returns `null` if a component using `useAuth` is rendered
outside the `<AuthProvider>`. The calling component would then try to destructure
`null` (e.g., `const { user, login } = useAuth()`), throwing:
`TypeError: Cannot destructure property 'user' of null`.

### Root cause
No null guard or descriptive error in the hook — the failure message pointed at
the calling component instead of the real cause (missing Provider wrapper).

### Fix
```js
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
```

---

## BUG-F-C3 — Form submits with empty fields (noValidate + no JS fallback)

**Affected file:** `client/src/pages/LoginPage.jsx` line 148

### What it was
The form used `noValidate` (which disables all HTML5 browser validation), but no
JavaScript validation was added to replace it. A user could click "Sign In" with
empty email and password fields — the API call would fire, and the backend's
`400 Bad Request` would appear as a generic error with no field-level guidance.

### Root cause
`noValidate` was added to allow custom-styled error handling, but the corresponding
client-side validation function was never written.

### Fix
Added a `validate()` function that runs before the API call:

```js
const validate = () => {
  if (mode === 'register' && !form.name.trim()) return 'Full name is required.';
  if (!form.email.trim())                       return 'Email address is required.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
                                                return 'Please enter a valid email address.';
  if (!form.password)                           return 'Password is required.';
  if (mode === 'register' && form.password.length < 6)
                                                return 'Password must be at least 6 characters.';
  return null;
};
```

If `validate()` returns a message, it's shown in the error state and the API call
is skipped.

---

## BUG-F-C4 — Wrong role tab produces confusing 403 with no guidance

**Affected file:** `client/src/pages/LoginPage.jsx` line 77 / `server/routes/auth.js` lines 57–59

### What it was
The backend requires the role to be sent with every login request and validates it
against the stored role. If a driver selected the "Shipper" tab and tried to log in,
the server returned:
`403: "This account is registered as a driver, not a shipper"`

The frontend rendered this as a generic red error box with no actionable hint.
Users were left confused with no guidance on what to do next.

### Root cause
The backend error message contained the necessary information, but the frontend
treated all errors identically — it didn't parse the 403 response to guide the user.

### Fix
The error handler now detects 403 responses containing "registered as a", parses
the actual role out of the message, and appends a clear call to action:

```js
if (err.response.status === 403 && msg.includes('registered as a')) {
  const match = msg.match(/registered as a (\w+)/);
  const actualRole = match?.[1];
  setError(
    `${msg}${actualRole
      ? ` — please select the "${actualRole.charAt(0).toUpperCase() + actualRole.slice(1)}" tab above.`
      : ''}`
  );
}
```
