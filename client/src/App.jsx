import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import DriverDashboard from './pages/DriverDashboard';
import ShipperDashboard from './pages/ShipperDashboard';
import LoadMatchingPage from './pages/LoadMatchingPage';
import OwnerDashboard from './pages/OwnerDashboard';

// Redirects to login if not authenticated, or wrong role
const PrivateRoute = ({ children, allowedRoles }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

const AppRoutes = () => {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route
        path="/login"
        element={user ? <Navigate to={`/${user.role}`} replace /> : <LoginPage />}
      />
      <Route
        path="/driver"
        element={
          <PrivateRoute allowedRoles={['driver']}>
            <DriverDashboard />
          </PrivateRoute>
        }
      />
      <Route
        path="/shipper"
        element={
          <PrivateRoute allowedRoles={['shipper']}>
            <ShipperDashboard />
          </PrivateRoute>
        }
      />
      <Route
        path="/loads"
        element={
          <PrivateRoute allowedRoles={['driver', 'shipper', 'owner']}>
            <LoadMatchingPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/owner"
        element={
          <PrivateRoute allowedRoles={['owner']}>
            <OwnerDashboard />
          </PrivateRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

const App = () => (
  <BrowserRouter>
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  </BrowserRouter>
);

export default App;
