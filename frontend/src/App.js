import React, { useContext } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from 'react-router-dom';
import { AuthContext } from './context/AuthContext';

import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Products from './pages/Product';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Orders from './pages/Orders';
import Profile from './pages/Profile';
import Dashboard from './pages/Dashboard';
import AdminApp from './admin/AdminApp';
import Footer from './components/Footer';
import Navbar from './components/Navbar';
import './styles/App.css';

function ProtectedRoute({ children, adminOnly = false }) {
  const { token, user, loading } = useContext(AuthContext);

  if (loading) return <div className="loading">Loading...</div>;
  if (!token) return <Navigate to="/login" replace />;
  if (adminOnly && !user?.isAdmin) return <Navigate to="/dashboard" replace />;

  return children;
}

function AppLayout() {
  const location = useLocation();
  const fullWidthRoutes = ['/', '/dashboard'];
  const hideNavRoutes = ['/', '/dashboard'];
  const hideFooterRoutes = ['/admin'];
  const isAdminRoute = location.pathname.startsWith('/admin');

  const isFullWidth = fullWidthRoutes.includes(location.pathname);
  const showNav = !hideNavRoutes.includes(location.pathname) && !isAdminRoute;
  const showFooter = !hideFooterRoutes.some((p) => location.pathname.startsWith(p));

  return (
    <div className="app">
      {showNav && <Navbar />}
      <main className={`main-content${isFullWidth || isAdminRoute ? ' main-content--full' : ''}`}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/products" element={<Products />} />
          <Route path="/Product" element={<Navigate to="/products" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/cart"
            element={
              <ProtectedRoute>
                <Cart />
              </ProtectedRoute>
            }
          />
          <Route path="/Cart" element={<Navigate to="/cart" replace />} />
          <Route
            path="/checkout"
            element={
              <ProtectedRoute>
                <Checkout />
              </ProtectedRoute>
            }
          />
          <Route path="/Checkout" element={<Navigate to="/checkout" replace />} />
          <Route
            path="/orders"
            element={
              <ProtectedRoute>
                <Orders />
              </ProtectedRoute>
            }
          />
          <Route path="/Orders" element={<Navigate to="/orders" replace />} />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route path="/Profile" element={<Navigate to="/profile" replace />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/*"
            element={
              <ProtectedRoute adminOnly>
                <AdminApp />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      {showFooter && <Footer />}
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppLayout />
    </Router>
  );
}

export default App;
