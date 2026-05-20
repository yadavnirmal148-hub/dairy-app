import React, { useEffect, useState } from 'react';
import { adminAPI } from '../../api';
import { formatAddress, mapsLink, JAIPUR_ZONES } from '../../constants/delivery';

export default function AdminLocations() {
  const [data, setData] = useState({ orders: [], users: [] });
  const [zoneFilter, setZoneFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminAPI
      .getLocations()
      .then((res) => setData(res.data))
      .finally(() => setLoading(false));
  }, []);

  const filteredOrders = data.orders.filter((o) => {
    if (zoneFilter === 'all') return true;
    return o.deliveryAddress?.zone === zoneFilter;
  });

  if (loading) return <div className="loading">Loading delivery map...</div>;

  return (
    <div className="admin-page">
      <h1>Delivery locations</h1>
      <p className="admin-subtitle">Customer addresses for routing — Country Delight style</p>

      <div className="admin-zone-filter">
        <label>Filter zone: </label>
        <select value={zoneFilter} onChange={(e) => setZoneFilter(e.target.value)}>
          <option value="all">All zones</option>
          {JAIPUR_ZONES.map((z) => (
            <option key={z} value={z}>{z}</option>
          ))}
        </select>
      </div>

      <h2>Recent orders ({filteredOrders.length})</h2>
      <div className="admin-locations-grid">
        {filteredOrders.map((o) => (
          <div key={o._id} className="location-card premium-card">
            <div className="location-card__head">
              <strong>{o.userId?.name || 'Customer'}</strong>
              <span className="admin-badge admin-badge--pending">{o.deliveryAddress?.zone}</span>
            </div>
            <p className="location-card__phone">📞 {o.userId?.phone || '—'}</p>
            <p className="location-card__addr">{formatAddress(o.deliveryAddress)}</p>
            <p className="location-card__meta">
              Order ₹{o.totalAmount} · {o.orderStatus}
            </p>
            <a
              href={mapsLink(o.deliveryAddress)}
              target="_blank"
              rel="noreferrer"
              className="admin-btn-sm admin-btn-primary"
              style={{ display: 'inline-block', marginTop: 8, textDecoration: 'none' }}
            >
              Open in Google Maps →
            </a>
          </div>
        ))}
      </div>

      <h2 style={{ marginTop: '2rem' }}>Saved customer addresses</h2>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Phone</th>
              <th>Zone</th>
              <th>Address</th>
              <th>Map</th>
            </tr>
          </thead>
          <tbody>
            {data.users.map((u) => (
              <tr key={u._id}>
                <td>{u.name}</td>
                <td>{u.phone}</td>
                <td>{u.address?.zone || '—'}</td>
                <td>{formatAddress(u.address)}</td>
                <td>
                  {u.address?.street ? (
                    <a href={mapsLink(u.address)} target="_blank" rel="noreferrer">Map</a>
                  ) : (
                    '—'
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
