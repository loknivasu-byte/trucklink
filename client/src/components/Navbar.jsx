import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setMenuOpen(false);
  };

  const dashboardPath = user ? `/${user.role}` : '/login';

  return (
    <nav className="navbar">
      <div className="container navbar__inner">
        <Link to="/" className="navbar__logo">
          <span className="navbar__logo-icon">🚛</span>
          <span className="navbar__logo-text">TruckLink</span>
        </Link>

        <div className={`navbar__links ${menuOpen ? 'navbar__links--open' : ''}`}>
          <Link to="/" className="navbar__link" onClick={() => setMenuOpen(false)}>Home</Link>
          {user && (
            <Link to="/loads" className="navbar__link" onClick={() => setMenuOpen(false)}>
              Find Loads
            </Link>
          )}
        </div>

        <div className="navbar__actions">
          {user ? (
            <>
              <Link to={dashboardPath} className="navbar__user-info">
                <div className="navbar__avatar">{user.name?.charAt(0) ?? '?'}</div>
                <span className="navbar__name">{user.name?.split(' ')[0] ?? 'User'}</span>
              </Link>
              <button className="btn-outline navbar__logout" onClick={handleLogout}>
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="navbar__link navbar__link--signin">Sign In</Link>
              <Link to="/login" className="btn-primary">Get Started</Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className="navbar__hamburger"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
