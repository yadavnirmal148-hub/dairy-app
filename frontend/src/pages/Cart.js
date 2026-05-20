import React, { useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { CartContext } from '../context/CartContext';
import '../styles/cart.css';

export default function Cart() {
  const navigate = useNavigate();
  const { cart, fetchCart, updateCartItem, removeFromCart } = useContext(CartContext);

  useEffect(() => {
    fetchCart();
  }, []);

  if (!cart) return <div className="loading">⏳ Loading cart...</div>;
  if (cart.items.length === 0) {
    return (
      <div className="empty-cart">
        <h2>🛒 Your cart is empty</h2>
        {/* ✅ अब Dashboard पर ले जाएगा */}
        <button onClick={() => navigate('/dashboard')}>Continue Shopping</button>
      </div>
    );
  }

  return (
    <div className="cart-container">
      <h1>🛒 Shopping Cart</h1>
      <div className="cart-content">
        <div className="cart-items">
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Price</th>
                <th>Quantity</th>
                <th>Total</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {cart.items.map((item) => (
                <tr key={item.productId._id || item.productId}>
                  <td>{item.productName || item.productId?.name || 'Product'}</td>
                  <td>₹{item.price}</td>
                  <td>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) =>
                        updateCartItem(item.productId._id || item.productId, parseInt(e.target.value))
                      }
                    />
                  </td>
                  <td>₹{(item.price * item.quantity).toFixed(2)}</td>
                  <td>
                    <button
                      onClick={() => removeFromCart(item.productId._id || item.productId)}
                      className="remove-btn"
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="cart-summary">
          <h2>Order Summary</h2>
          <div className="summary-row">
            <span>Subtotal:</span>
            <span>₹{cart.totalPrice.toFixed(2)}</span>
          </div>
          <div className="summary-row">
            <span>Delivery:</span>
            <span className="free">FREE</span>
          </div>
          <div className="summary-row total">
            <span>Total:</span>
            <span>₹{cart.totalPrice.toFixed(2)}</span>
          </div>
          <button
            onClick={() => navigate('/checkout')}
            className="checkout-btn"
          >
            Proceed to Checkout →
          </button>
          {/* ✅ अब Dashboard पर ले जाएगा */}
          <button
            onClick={() => navigate('/dashboard')}
            className="continue-btn"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    </div>
  );
}
