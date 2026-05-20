import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import BrandLogo from './BrandLogo';
import '../styles/Navbar.css';

export default function Navbar() {
  const { user, token, isAdmin, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  return (
    <nav className="navbar navbar--premium">
      <div className="navbar-container">
        <BrandLogo to="/" size="md" showTagline />

        <ul className="nav-links">
          <li><Link to="/">Home</Link></li>
          <li><Link to="/products">Products</Link></li>
          {token && <li><Link to="/cart">Cart</Link></li>}
          {token && <li><Link to="/orders">Orders</Link></li>}
          {token && <li><Link to="/dashboard">Shop</Link></li>}
          {token && isAdmin && <li><Link to="/admin">Admin</Link></li>}
        </ul>

        <div className="nav-right">
          {token ? (
            <>
              <Link to="/profile" className="profile-link">👤 {user?.name}</Link>
              <button type="button" onClick={() => { logout(); navigate('/'); }} className="logout-btn">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="login-link">Login</Link>
              <Link to="/register" className="register-link">Sign up</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
