import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { login as loginApi, register as registerApi } from '../services/authService';
import './LoginPage.css';

const ROLES = [
  {
    id: 'driver',
    label: 'Driver',
    description: 'Find & haul loads',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="3" width="15" height="13" rx="1" />
        <path d="M16 8h4l3 5v3h-7V8z" />
        <circle cx="5.5" cy="18.5" r="2.5" />
        <circle cx="18.5" cy="18.5" r="2.5" />
      </svg>
    ),
  },
  {
    id: 'shipper',
    label: 'Shipper',
    description: 'Post & track loads',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
        <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
        <line x1="12" y1="22.08" x2="12" y2="12" />
      </svg>
    ),
  },
  {
    id: 'owner',
    label: 'Owner',
    description: 'Manage your fleet',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
];

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [selectedRole, setSelectedRole] = useState('driver');
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    companyName: '',
    cdlNumber: '',
    truckType: '',
    currentLocation: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const validate = () => {
    if (mode === 'register' && !form.name.trim()) return 'Full name is required.';
    if (!form.email.trim()) return 'Email address is required.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return 'Please enter a valid email address.';
    if (!form.password) return 'Password is required.';
    if (mode === 'register' && form.password.length < 6) return 'Password must be at least 6 characters.';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) { setError(validationError); return; }

    setError('');
    setLoading(true);

    try {
      let userData;
      if (mode === 'login') {
        userData = await loginApi(form.email, form.password, selectedRole);
      } else {
        userData = await registerApi({
          name: form.name,
          email: form.email,
          password: form.password,
          role: selectedRole,
          companyName: form.companyName,
          cdlNumber: form.cdlNumber,
          truckType: form.truckType,
          currentLocation: form.currentLocation,
        });
      }
      login(userData);
      navigate(`/${userData.role}`, { replace: true });
    } catch (err) {
      if (!err.response) {
        setError('Cannot reach the server. Please check your connection and try again.');
        return;
      }
      const msg = err.response.data?.message || 'Something went wrong. Please try again.';
      // Guide user to correct role tab if they logged in under the wrong one
      if (err.response.status === 403 && msg.includes('registered as a')) {
        const match = msg.match(/registered as a (\w+)/);
        const actualRole = match?.[1];
        setError(
          `${msg}${actualRole ? ` — please select the "${actualRole.charAt(0).toUpperCase() + actualRole.slice(1)}" tab above.` : ''}`
        );
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setMode((m) => (m === 'login' ? 'register' : 'login'));
    setError('');
  };

  return (
    <div className="login-page">
      <div className="login-bg" />

      <div className="login-card">
        {/* Logo */}
        <Link to="/" className="login-logo">
          <span className="login-logo-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="1" y="3" width="15" height="13" rx="1" />
              <path d="M16 8h4l3 5v3h-7V8z" />
              <circle cx="5.5" cy="18.5" r="2.5" />
              <circle cx="18.5" cy="18.5" r="2.5" />
            </svg>
          </span>
          TruckLink
        </Link>

        <h1 className="login-title">
          {mode === 'login' ? 'Welcome back' : 'Create your account'}
        </h1>
        <p className="login-subtitle">
          {mode === 'login'
            ? 'Sign in to your account to continue'
            : 'Join the TruckLink network today'}
        </p>

        {/* Role Selector */}
        <div className="role-selector">
          {ROLES.map((r) => (
            <button
              key={r.id}
              type="button"
              className={`role-card ${selectedRole === r.id ? 'role-card--active' : ''}`}
              onClick={() => { setSelectedRole(r.id); setError(''); }}
              aria-label={`Sign in as ${r.label}: ${r.description}`}
              aria-pressed={selectedRole === r.id}
              disabled={loading}
            >
              <span className="role-card-icon">{r.icon}</span>
              <span className="role-card-label">{r.label}</span>
              <span className="role-card-desc">{r.description}</span>
            </button>
          ))}
        </div>

        {/* Form */}
        <form className="login-form" onSubmit={handleSubmit} noValidate>
          {mode === 'register' && (
            <div className="form-group">
              <label htmlFor="name">Full Name</label>
              <input
                id="name"
                name="name"
                type="text"
                placeholder="Your full name"
                value={form.name}
                onChange={handleChange}
                required
                autoComplete="name"
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange}
              required
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              placeholder={mode === 'register' ? 'Create a password' : 'Enter your password'}
              value={form.password}
              onChange={handleChange}
              required
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            />
          </div>

          {/* Role-specific registration fields */}
          {mode === 'register' && selectedRole === 'driver' && (
            <div className="role-fields">
              <div className="form-group">
                <label htmlFor="cdlNumber">CDL Number <span className="optional">(optional)</span></label>
                <input
                  id="cdlNumber"
                  name="cdlNumber"
                  type="text"
                  placeholder="e.g. CDL-TX-123456"
                  value={form.cdlNumber}
                  onChange={handleChange}
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="truckType">Truck Type <span className="optional">(optional)</span></label>
                  <select
                    id="truckType"
                    name="truckType"
                    value={form.truckType}
                    onChange={handleChange}
                  >
                    <option value="">Select type</option>
                    <option value="Dry Van">Dry Van</option>
                    <option value="Flatbed">Flatbed</option>
                    <option value="Refrigerated">Refrigerated</option>
                    <option value="Tanker">Tanker</option>
                    <option value="Lowboy">Lowboy</option>
                    <option value="Step Deck">Step Deck</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="currentLocation">Current Location <span className="optional">(optional)</span></label>
                  <input
                    id="currentLocation"
                    name="currentLocation"
                    type="text"
                    placeholder="e.g. Dallas, TX"
                    value={form.currentLocation}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>
          )}

          {mode === 'register' && selectedRole === 'shipper' && (
            <div className="role-fields">
              <div className="form-group">
                <label htmlFor="companyName">Company Name <span className="optional">(optional)</span></label>
                <input
                  id="companyName"
                  name="companyName"
                  type="text"
                  placeholder="e.g. Acme Logistics Inc."
                  value={form.companyName}
                  onChange={handleChange}
                />
              </div>
            </div>
          )}

          {error && (
            <div className="form-error" role="alert">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {error}
            </div>
          )}

          <button type="submit" className="btn-primary login-submit" disabled={loading}>
            {loading ? (
              <span className="spinner" />
            ) : mode === 'login' ? (
              'Sign In'
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        {/* Toggle mode */}
        <p className="login-toggle">
          {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}{' '}
          <button type="button" onClick={switchMode} className="toggle-btn">
            {mode === 'login' ? 'Register' : 'Sign In'}
          </button>
        </p>

        {/* Test credentials hint */}
        {mode === 'login' && (
          <div className="test-hint">
            <strong>Demo accounts</strong> — password: <code>password123</code><br />
            Driver: <code>marcus@driver.com</code> &nbsp;·&nbsp; Shipper: <code>robert@shipper.com</code>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoginPage;
