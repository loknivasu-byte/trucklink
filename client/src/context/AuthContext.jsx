import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';

const AuthContext = createContext(null);

const STORAGE_KEY = 'trucklink_user';
// Session-scoped storage: cleared automatically when the tab/browser is closed
const storage = sessionStorage;

const IDLE_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes of inactivity

// Decode JWT and check if it has expired (client-side check only)
const isTokenExpired = (token) => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 < Date.now();
  } catch {
    return true; // treat unreadable tokens as expired
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const stored = storage.getItem(STORAGE_KEY);
      if (!stored) return null;
      const parsed = JSON.parse(stored);
      // Reject expired tokens immediately on page load
      if (!parsed?.token || isTokenExpired(parsed.token)) {
        storage.removeItem(STORAGE_KEY);
        return null;
      }
      return parsed;
    } catch {
      storage.removeItem(STORAGE_KEY);
      return null;
    }
  });

  const idleTimerRef = useRef(null);

  const logout = useCallback(() => {
    storage.removeItem(STORAGE_KEY);
    setUser(null);
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
  }, []);

  // Reset the idle timer on any user activity
  const resetIdleTimer = useCallback(() => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(() => {
      logout();
    }, IDLE_TIMEOUT_MS);
  }, [logout]);

  useEffect(() => {
    if (!user) return;

    // Start idle timer and attach activity listeners
    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    resetIdleTimer();
    events.forEach((e) => window.addEventListener(e, resetIdleTimer));

    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      events.forEach((e) => window.removeEventListener(e, resetIdleTimer));
    };
  }, [user, resetIdleTimer]);

  // Periodically check if JWT has expired (catches expiry while tab is open)
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(() => {
      if (isTokenExpired(user.token)) {
        logout();
      }
    }, 60 * 1000); // check every minute
    return () => clearInterval(interval);
  }, [user, logout]);

  const login = (userData) => {
    storage.setItem(STORAGE_KEY, JSON.stringify(userData));
    setUser(userData);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
