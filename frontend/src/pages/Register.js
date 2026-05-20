import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../api';
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
  const [savedEmail, setSavedEmail] = useState('');
  const [step, setStep] = useState(0);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [devOtp, setDevOtp] = useState('');

  const set = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  const sendOTP = async () => {
    if (!form.name.trim()) return setError('Enter your full name');
    if (!form.email.trim()) return setError('Enter your email');
    if (!form.phone.trim()) return setError('Enter your phone number');
    if (form.password.length < 6) return setError('Password must be at least 6 characters');
    if (form.password !== form.confirmPassword) return setError('Passwords do not match');

    setLoading(true);
    setError('');
    setMessage('');
    setDevOtp('');
    try {
      const email = form.email.trim().toLowerCase();
      const res = await authAPI.sendOTP(email);
      setSavedEmail(email);
      setStep(1);
      setMessage(res.data.message || 'OTP sent to your email');
      if (res.data.devOtp) setDevOtp(res.data.devOtp);
    } catch (err) {
      if (err.code === 'ECONNABORTED') {
        setError('Server slow — wait 1 minute, open dairy-app-lahk.onrender.com/api/health, then try again.');
      } else {
        setError(err.response?.data?.message || 'Failed to send OTP. Check Netlify REACT_APP_API_URL ends with /api');
      }
    } finally {
      setLoading(false);
    }
  };

  const register = async () => {
    if (!form.otp.trim()) return setError('Enter the OTP');
    setLoading(true);
    setError('');
    setMessage('');
    try {
      await authAPI.register({
        name: form.name.trim(),
        email: savedEmail || form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
        password: form.password,
        otp: form.otp.trim(),
      });
      setMessage('Registration successful! Redirecting to login...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Registration failed. Try Resend OTP or login if you already have an account.'
      );
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

        {error && <div className="error-message">{error}</div>}
        {message && <div className="success-message">{message}</div>}
        {devOtp && (
          <div className="dev-otp-hint">
            <strong>Your OTP (development):</strong> {devOtp}
          </div>
        )}

        {step === 0 ? (
          <>
            <div className="form-group">
              <label>Full name</label>
              <input name="name" value={form.name} onChange={set} required />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input name="email" type="email" value={form.email} onChange={set} required />
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
            <button type="button" onClick={sendOTP} disabled={loading} className="submit-btn primary-btn">
              {loading ? 'Sending OTP...' : 'Send OTP →'}
            </button>
          </>
        ) : (
          <>
            <div className="form-group">
              <label>Enter OTP</label>
              <input name="otp" value={form.otp} onChange={set} placeholder="6-digit code" maxLength={6} />
            </div>
            <button type="button" onClick={register} disabled={loading} className="submit-btn primary-btn">
              {loading ? 'Please wait...' : '✓ Complete Registration'}
            </button>
            <button type="button" onClick={sendOTP} disabled={loading} className="secondary-btn" style={{ marginTop: 8 }}>
              Resend OTP
            </button>
            <button type="button" onClick={() => setStep(0)} className="back-link" style={{ marginTop: 12 }}>
              ← Change details
            </button>
          </>
        )}

        <p className="auth-footer-link">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
}