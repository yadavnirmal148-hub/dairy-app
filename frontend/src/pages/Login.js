import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { handleAPIError } from '../api';
import BrandLogo from '../components/BrandLogo';
import '../styles/Login.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email.toLowerCase(), password);
      navigate('/dashboard');
    } catch (err) {
      setError(handleAPIError(err).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="login-box premium-card">
        <div className="auth-logo-wrap">
          <BrandLogo to="/" size="xl" showTagline centered />
        </div>
        <h1>Welcome back</h1>
        <p className="auth-subtitle">Login to order fresh dairy</p>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <button type="submit" disabled={loading} className="submit-btn primary-btn">
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        <p className="auth-footer-link">
          New here? <Link to="/register">Create account</Link>
        </p>
      </div>
    </div>
  );
}
