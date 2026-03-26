import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './OwnerDashboard.css';

const OwnerDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="owner-dashboard">
      <div className="owner-dashboard__card">
        <div className="owner-dashboard__icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
        </div>

        <h1>Owner Dashboard</h1>
        <p className="owner-dashboard__welcome">Welcome back, {user?.name?.split(' ')[0] ?? 'Owner'}</p>

        <div className="owner-dashboard__badge">Coming Soon</div>

        <p className="owner-dashboard__desc">
          The Owner Dashboard is under construction. Fleet management, driver hiring,
          and truck availability tools will be available here in a future update.
        </p>

        <div className="owner-dashboard__features">
          <div className="owner-feature">
            <span className="owner-feature__icon">🚛</span>
            <span>Manage your fleet</span>
          </div>
          <div className="owner-feature">
            <span className="owner-feature__icon">👷</span>
            <span>Hire & assign drivers</span>
          </div>
          <div className="owner-feature">
            <span className="owner-feature__icon">📊</span>
            <span>Fleet earnings overview</span>
          </div>
        </div>

        <button className="btn-outline owner-dashboard__logout" onClick={handleLogout}>
          Sign Out
        </button>
      </div>
    </div>
  );
};

export default OwnerDashboard;
