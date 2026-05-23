import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI, wakeServer } from '../api';
import BrandLogo from '../components/BrandLogo';
import '../styles/Register.css';

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    otp: '',
  });
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [waking, setWaking] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await wakeServer();
      } catch {}
      finally {
        if (!cancelled) setWaking(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const set = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
    if (e.target.name === 'email') {
      setOtpSent(false);
      setMessage('');
    }
  };

  const sendOtp = async () => {
    if (!form.email.trim()) return setError('Enter your email first');

    setOtpLoading(true);
    setError('');
    setMessage('');
    try {
      const res = await authAPI.sendOTP(form.email.trim().toLowerCase());
      setOtpSent(true);
      setMessage(
        res.data?.devOtp
          ? `${res.data.message} OTP: ${res.data.devOtp}`
          : res.data?.message || 'OTP sent to your email'
      );
    } catch (err) {
      setOtpSent(false);
      setError(err.response?.data?.message || 'OTP send failed. Please try again.');
    } finally {
      setOtpLoading(false);
    }
  };

  const register = async () => {
    if (!form.name.trim()) return setError('Enter your full name');
    if (!form.email.trim()) return setError('Enter your email');
    if (!form.phone.trim()) return setError('Enter your phone number');
    if (form.password.length < 6) return setError('Password must be at least 6 characters');
    if (form.password !== form.confirmPassword) return setError('Passwords do not match');
    if (!form.otp.trim()) return setError('Enter the OTP sent to your email');

    setLoading(true);
    setError('');
    setMessage('');
    try {
      await authAPI.register({
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
        password: form.password,
        otp: form.otp.trim(),
      });
      setMessage('Registration successful! Redirecting to login...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="register-box premium-card">
        <div className="auth-logo-wrap">
          <BrandLogo to="/" size="xl" showTagline centered />
        </div>
        <h1>Create Account</h1>
        <p className="auth-subtitle">Farm-fresh dairy delivered to your doorstep in Jaipur</p>

        {waking && (
          <p className="auth-subtitle" style={{ color: '#1f8f4a', fontWeight: 600 }}>
            Starting server… first visit may take up to 2 minutes.
          </p>
        )}

        {error && <div className="error-message">{error}</div>}
        {message && <div className="success-message">{message}</div>}

        <div className="form-group">
          <label>Full name</label>
          <input name="name" value={form.name} onChange={set} required />
        </div>
        <div className="form-group">
          <label>Email</label>
          <input name="email" type="email" value={form.email} onChange={set} required />
        </div>
        <button
          type="button"
          onClick={sendOtp}
          disabled={otpLoading || waking || !form.email.trim()}
          className="secondary-btn"
        >
          {otpLoading ? 'Sending OTP...' : otpSent ? 'Resend OTP' : 'Send OTP'}
        </button>
        <div className="form-group">
          <label>OTP</label>
          <input
            name="otp"
            inputMode="numeric"
            maxLength="6"
            value={form.otp}
            onChange={set}
            placeholder="Enter 6-digit OTP"
            required
          />
        </div>
        <div className="form-group">
          <label>Phone</label>
          <input name="phone" value={form.phone} onChange={set} required />
        </div>
        <div className="form-group">
          <label>Password</label>
          <input name="password" type="password" value={form.password} onChange={set} required />
        </div>
        <div className="form-group">
          <label>Confirm password</label>
          <input name="confirmPassword" type="password" value={form.confirmPassword} onChange={set} required />
        </div>

        <button
          type="button"
          onClick={register}
          disabled={loading || waking || !otpSent}
          className="submit-btn primary-btn"
        >
          {loading ? 'Creating account...' : waking ? 'Starting server...' : 'Create Account →'}
        </button>

        <p className="auth-footer-link">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
}
