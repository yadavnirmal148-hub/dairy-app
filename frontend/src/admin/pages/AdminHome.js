import React, { useEffect, useState } from 'react';
import { adminAPI } from '../../api';

export default function AdminHome() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    adminAPI
      .getDashboard()
      .then((res) => setStats(res.data))
      .catch(() => setError('Failed to load dashboard stats'));
  }, []);

  if (error) {
    return (
      <div className="admin-page">
        <p className="error-message">{error}</p>
      </div>
    );
  }
  if (!stats) return <div className="loading">Loading dashboard...</div>;

  return (
    <div className="admin-page">
      <h1>Dashboard</h1>
      <div className="admin-stats">
        <div className="admin-stat-card">
          <h3>Total Orders</h3>
          <p>{stats.orders}</p>
        </div>
        <div className="admin-stat-card">
          <h3>Pending Orders</h3>
          <p>{stats.pendingOrders}</p>
        </div>
        <div className="admin-stat-card">
          <h3>Products</h3>
          <p>{stats.products}</p>
        </div>
        <div className="admin-stat-card">
          <h3>Users</h3>
          <p>{stats.users}</p>
        </div>
        <div className="admin-stat-card">
          <h3>Revenue (paid)</h3>
          <p>₹{Number(stats.revenue).toFixed(0)}</p>
        </div>
      </div>
    </div>
  );
}
