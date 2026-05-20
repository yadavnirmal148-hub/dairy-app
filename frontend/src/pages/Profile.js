import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { handleAPIError } from '../api';
import { useNavigate } from 'react-router-dom';
import { JAIPUR_ZONES } from '../constants/delivery';
import '../styles/profile.css';

export default function Profile() {
  const { user, updateProfile } = useContext(AuthContext);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    zone: '',
    street: '',
    landmark: '',
    city: 'Jaipur',
    pincode: '',
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;
    const addr = user.address || {};
    setFormData({
      name: user.name || '',
      phone: user.phone || '',
      zone: addr.zone || '',
      street: addr.street || '',
      landmark: addr.landmark || '',
      city: addr.city || 'Jaipur',
      pincode: addr.pincode || '',
    });
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.zone) {
      setError('Please select your delivery zone');
      return;
    }
    setLoading(true);
    setSuccess('');
    setError('');

    try {
      await updateProfile({
        name: formData.name,
        phone: formData.phone,
        zone: formData.zone,
        street: formData.street,
        landmark: formData.landmark,
        city: formData.city,
        pincode: formData.pincode,
      });
      setSuccess('Profile & delivery address saved!');
    } catch (err) {
      const errorInfo = handleAPIError(err);
      setError(errorInfo.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="profile-container">
      <h1>My Profile</h1>
      <p className="profile-hint">Set your delivery location — we deliver fresh milk by 6 AM (Jaipur)</p>

      <div className="profile-box premium-card">
        <h2>Personal & delivery details</h2>
        <p className="profile-email">Email: {user?.email}</p>

        {success && <div className="success-message">{success}</div>}
        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Full Name</label>
            <input type="text" name="name" value={formData.name} onChange={handleChange} required />
          </div>

          <div className="form-group">
            <label>Phone</label>
            <input type="tel" name="phone" value={formData.phone} onChange={handleChange} required />
          </div>

          <div className="form-group">
            <label>Delivery zone</label>
            <select name="zone" value={formData.zone} onChange={handleChange} required>
              <option value="">Select area</option>
              {JAIPUR_ZONES.map((z) => (
                <option key={z} value={z}>{z}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>House / street address</label>
            <textarea
              name="street"
              value={formData.street}
              onChange={handleChange}
              rows={2}
              placeholder="Flat, building, street"
              required
            />
          </div>

          <div className="form-group">
            <label>Landmark (optional)</label>
            <input type="text" name="landmark" value={formData.landmark} onChange={handleChange} placeholder="Near park, school..." />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>City</label>
              <input type="text" name="city" value={formData.city} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>Pincode</label>
              <input type="text" name="pincode" value={formData.pincode} onChange={handleChange} required />
            </div>
          </div>

          <button type="submit" disabled={loading} className="save-btn primary-btn">
            {loading ? 'Saving...' : 'Save address & profile'}
          </button>
        </form>

        <button type="button" className="back-btn" onClick={() => navigate(-1)}>
          ← Back
        </button>
      </div>
    </div>
  );
}
