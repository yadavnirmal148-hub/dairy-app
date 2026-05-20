import React, { useEffect, useState } from "react";
import { orderAPI, handleAPIError } from "../api";
import { useNavigate } from "react-router-dom";
import "../styles/orders.css";

function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  // Fetch orders from backend
  useEffect(() => {
    if (token) {
      fetchOrders();
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await orderAPI.getAll();
      setOrders(response.data || []);
    } catch (err) {
      const errorInfo = handleAPIError(err);
      setError(errorInfo.message);
      console.log("Orders fetch error:", errorInfo);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="orders-container">
        <h2>📦 My Orders</h2>
        <p>⏳ Loading orders...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="orders-container">
        <h2>📦 My Orders</h2>
        <p style={{ color: "red" }}>❌ Error: {error}</p>
        <button onClick={fetchOrders}>🔄 Retry</button>
        <button onClick={() => navigate(-1)} className="back-btn">
          ← Back
        </button>
      </div>
    );
  }

  return (
    <div className="orders-container">
      <h2>📦 My Orders</h2>
      {orders.length === 0 ? (
        <div>
          <p>No orders found</p>
          <button onClick={() => navigate(-1)} className="back-btn">
            ← Back
          </button>
        </div>
      ) : (
        <div className="orders-list">
          {orders.map((order) => (
            <div key={order._id} className="order-card">
              <div className="order-header">
                <h3>Order #{order.trackingId}</h3>
                <span className="status">
                  {order.orderStatus?.toUpperCase()}
                </span>
              </div>

              <div className="order-details">
                <p>
                  <strong>Payment Status:</strong>{" "}
                  <span
                    className={
                      order.paymentStatus === "paid" ? "paid" : "pending"
                    }
                  >
                    {order.paymentStatus?.toUpperCase()}
                  </span>
                </p>
                <p>
                  <strong>Date:</strong>{" "}
                  {new Date(order.createdAt).toLocaleDateString()}
                </p>
                {/* ✅ Delivery Zone + Street + Pincode */}
                <p>
                  <strong>Delivery Address:</strong>{" "}
                  {order.deliveryAddress?.zone},{" "}
                  {order.deliveryAddress?.street},{" "}
                  {order.deliveryAddress?.pincode}
                </p>
              </div>

              <div className="order-items">
                <h4>Items:</h4>
                {order.items.map((item, j) => (
                  <div key={j} className="order-item">
                    {/* ✅ Product Name */}
                    <span className="item-name">
                      {item.productName || item.productId?.name || "Product"}
                    </span>
                    <span className="item-price">
                      ₹ {(item.price || item.productId?.price)} × {item.quantity}{" "}
                      = ₹{" "}
                      {((item.price || item.productId?.price) * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="order-total">
                <h4>Total: ₹ {order.totalAmount?.toFixed(2)}</h4>
              </div>
            </div>
          ))}
          {/* ✅ Back Button */}
          <button onClick={() => navigate(-1)} className="back-btn">
            ← Back
          </button>
        </div>
      )}
    </div>
  );
}

export default Orders;
