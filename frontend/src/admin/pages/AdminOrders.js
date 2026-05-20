import React, { useEffect, useState } from 'react';
import { adminAPI } from '../../api';
import { formatAddress, mapsLink } from '../../constants/delivery';

const badgeClass = (status) => {
  const s = (status || '').toLowerCase();
  if (['paid', 'confirmed', 'delivered'].includes(s)) return 'admin-badge admin-badge--paid';
  if (s === 'cancelled') return 'admin-badge admin-badge--cancelled';
  return 'admin-badge admin-badge--pending';
};

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    adminAPI.getAllOrders().then((res) => setOrders(res.data)).finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const verify = async (id) => {
    await adminAPI.verifyOrder(id);
    load();
  };

  const updateStatus = async (id, orderStatus) => {
    await adminAPI.updateOrderStatus(id, orderStatus);
    load();
  };

  const remove = async (id) => {
    if (window.confirm('Delete this order?')) {
      await adminAPI.deleteOrder(id);
      load();
    }
  };

  if (loading) return <div className="loading">Loading orders...</div>;

  return (
    <div className="admin-page">
      <h1>Orders ({orders.length})</h1>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Tracking</th>
              <th>Customer</th>
              <th>Delivery location</th>
              <th>Amount</th>
              <th>Payment</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o._id}>
                <td>{o.trackingId || o._id.slice(-6)}</td>
                <td>
                  {o.userId?.name || '—'}
                  <br />
                  <small>{o.userId?.phone}</small>
                </td>
                <td className="location-cell">
                  {(() => {
                    const addr =
                      o.deliveryAddress?.zone && o.deliveryAddress.zone !== 'Not provided'
                        ? o.deliveryAddress
                        : o.userId?.address;
                    return (
                      <>
                        <strong>{addr?.zone || '—'}</strong>
                        <br />
                        <small>{formatAddress(addr)}</small>
                        <br />
                        {addr?.street && (
                          <a href={mapsLink(addr)} target="_blank" rel="noreferrer" className="map-link">
                            📍 Map
                          </a>
                        )}
                      </>
                    );
                  })()}
                </td>
                <td>₹{o.totalAmount}</td>
                <td>
                  <span className={badgeClass(o.paymentStatus)}>{o.paymentStatus}</span>
                  <br />
                  <small>{o.paymentMethod}</small>
                </td>
                <td>
                  <span className={badgeClass(o.orderStatus)}>{o.orderStatus}</span>
                </td>
                <td className="admin-actions">
                  {o.paymentStatus !== 'paid' && (
                    <button type="button" className="admin-btn-sm admin-btn-primary" onClick={() => verify(o._id)}>
                      Verify
                    </button>
                  )}
                  <select
                    value={o.orderStatus}
                    onChange={(e) => updateStatus(o._id, e.target.value)}
                    style={{ fontSize: '0.75rem' }}
                  >
                    <option value="pending">pending</option>
                    <option value="confirmed">confirmed</option>
                    <option value="processing">processing</option>
                    <option value="delivered">delivered</option>
                    <option value="cancelled">cancelled</option>
                  </select>
                  <button type="button" className="admin-btn-sm admin-btn-danger" onClick={() => remove(o._id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
