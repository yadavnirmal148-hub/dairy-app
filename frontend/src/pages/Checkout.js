import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';
import { orderAPI, paymentAPI } from '../api';
import { JAIPUR_ZONES } from '../constants/delivery';
import '../styles/checkout.css';

export default function Checkout() {
  const { cart, clearCart, fetchCart } = useContext(CartContext);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [address, setAddress] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    zone: user?.address?.zone || '',
    street: user?.address?.street || '',
    landmark: user?.address?.landmark || '',
    pincode: user?.address?.pincode || '',
  });
  const [placing, setPlacing] = useState(false);
  const [orderId, setOrderId] = useState('');
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');
  const [upiLink, setUpiLink] = useState('');
  const [txnRef, setTxnRef] = useState('');
  const [expiry, setExpiry] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [qrCode, setQrCode] = useState('');
  const [payOptions, setPayOptions] = useState({ upi: true, cod: true, razorpay: false });

  useEffect(() => {
    fetchCart();
    paymentAPI
      .getStatus()
      .then((res) => setPayOptions(res.data))
      .catch(() => setPayOptions({ upi: true, cod: true, razorpay: false }));
  }, []);

  const items = cart?.items || [];
  const subtotal = items.reduce(
    (sum, item) =>
      sum + (item.productId?.price || item.price || 0) * (item.quantity || 1),
    0
  );
  const total = parseFloat(subtotal.toFixed(2));

  useEffect(() => {
    if (cart && cart.items?.length === 0) {
      navigate('/cart');
    }
  }, [cart, navigate]);

  useEffect(() => {
    if (!expiry) return undefined;
    const interval = setInterval(() => {
      setTimeLeft(Math.max(0, Math.floor((expiry - Date.now()) / 1000)));
    }, 1000);
    return () => clearInterval(interval);
  }, [expiry]);

  const set = (e) => {
    setAddress((p) => ({ ...p, [e.target.name]: e.target.value }));
    setError('');
  };

  const validateAddress = () => {
    if (!address.zone || !JAIPUR_ZONES.includes(address.zone)) {
      setError('Please select a valid Jaipur delivery zone.');
      return false;
    }
    if (!address.name?.trim() || !address.phone?.trim() || !address.street?.trim() || !address.pincode?.trim()) {
      setError('Please fill all address fields.');
      return false;
    }
    if (total < 1) {
      setError('Minimum order amount is ₹1.');
      return false;
    }
    return true;
  };

  const deliveryPayload = () => ({
    name: address.name,
    phone: address.phone,
    zone: address.zone,
    street: address.street,
    landmark: address.landmark,
    city: 'Jaipur',
    pincode: address.pincode,
  });

  const itemLabel = (item) =>
    item.productName || item.productId?.name || 'Product';

  const loadRazorpayScript = () =>
    new Promise((resolve, reject) => {
      if (window.Razorpay) return resolve(true);
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => reject(new Error('Razorpay SDK failed to load'));
      document.body.appendChild(script);
    });

  const goToUPIPayment = async () => {
    if (!validateAddress()) return;
    setPlacing(true);
    setError('');
    try {
      const resOrder = await orderAPI.create({
        deliveryAddress: deliveryPayload(),
        paymentMethod: 'UPI',
      });
      const created = resOrder.data;
      setOrder(created);
      setOrderId(created._id);

      const res = await paymentAPI.initiate(total);
      setUpiLink(res.data.upiLink);
      setTxnRef(res.data.txnRef);
      setExpiry(res.data.expiresAt);
      setQrCode(res.data.qrCode);
      setStep(1);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not start UPI payment');
    } finally {
      setPlacing(false);
    }
  };

  const goToRazorpayPayment = async () => {
    if (!validateAddress()) return;
    setPlacing(true);
    setError('');
    try {
      const { data: razorpayOrder } = await paymentAPI.createOrder(total);
      await loadRazorpayScript();

      const razorpayKey =
        razorpayOrder.key_id || process.env.REACT_APP_RAZORPAY_KEY_ID;
      if (!razorpayKey) {
        throw new Error('Razorpay key missing. Check frontend .env file.');
      }

      const options = {
        key: razorpayKey,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        name: 'Gokul Fresh',
        description: 'Dairy order payment',
        order_id: razorpayOrder.id,
        handler: async (response) => {
          try {
            const resOrder = await orderAPI.create({
              deliveryAddress: deliveryPayload(),
              paymentMethod: 'RAZORPAY',
            });
            const created = resOrder.data;
            await paymentAPI.confirm(created._id, response.razorpay_payment_id);
            setOrder(created);
            setOrderId(created._id);
            await clearCart();
            setStep(2);
          } catch (err) {
            setError(err.response?.data?.message || 'Payment received but order failed. Contact support.');
          }
        },
        prefill: {
          name: address.name || user?.name || '',
          email: user?.email || '',
          contact: address.phone || user?.phone || '',
        },
        theme: { color: '#1a7a4a' },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', () => setError('Payment failed. Try UPI or try again.'));
      rzp.open();
    } catch (err) {
      const msg = err.response?.data?.message;
      setError(
        msg ||
          'Card/UPI gateway unavailable. Use UPI QR or Cash on Delivery.'
      );
    } finally {
      setPlacing(false);
    }
  };

  const placeCODOrder = async () => {
    if (!validateAddress()) return;
    setPlacing(true);
    setError('');
    try {
      const resOrder = await orderAPI.create({
        deliveryAddress: deliveryPayload(),
        paymentMethod: 'COD',
      });
      const created = resOrder.data;
      await paymentAPI.confirm(created._id, `COD${Date.now()}`);
      setOrder(created);
      setOrderId(created._id);
      await clearCart();
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not place COD order');
    } finally {
      setPlacing(false);
    }
  };

  const confirmUPIPayment = async () => {
    setPlacing(true);
    setError('');
    try {
      await paymentAPI.confirm(orderId, txnRef);
      await clearCart();
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || 'Payment confirmation failed');
    } finally {
      setPlacing(false);
    }
  };

  if (!cart) return <div className="loading">Loading checkout...</div>;

  if (step === 2) {
    return (
      <div className="success-page">
        <div className="success-card">
          <h1>✅ Payment Successful!</h1>
          <p>Your order has been placed. Delivery by tomorrow 6 AM.</p>
          <p><strong>Order ID:</strong> {order?.trackingId || orderId}</p>
          <p><strong>Amount:</strong> ₹{order?.totalAmount ?? total}</p>
          <button type="button" onClick={() => navigate('/orders')} className="primary-btn">
            View Orders
          </button>
          <button type="button" onClick={() => navigate('/dashboard')} className="secondary-btn">
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-container">
      {step === 0 && (
        <div className="address-card">
          <h2>Delivery Address</h2>
          {error && <div className="error-message">{error}</div>}

          <select name="zone" value={address.zone} onChange={set} required>
            <option value="">Select Zone (Jaipur)</option>
            {JAIPUR_ZONES.map((z) => (
              <option key={z} value={z}>{z}</option>
            ))}
          </select>
          <input name="name" value={address.name} onChange={set} placeholder="Full name" required />
          <input name="phone" value={address.phone} onChange={set} placeholder="Phone" required />
          <input name="street" value={address.street} onChange={set} placeholder="House / street address" required />
          <input name="landmark" value={address.landmark} onChange={set} placeholder="Landmark (optional)" />
          <input name="pincode" value={address.pincode} onChange={set} placeholder="Pincode" required />

          <div style={{ marginTop: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {payOptions.upi !== false && (
              <button type="button" onClick={goToUPIPayment} disabled={placing} className="primary-btn">
                {placing ? 'Please wait...' : 'Pay via UPI QR'}
              </button>
            )}
            {payOptions.cod !== false && (
              <button type="button" onClick={placeCODOrder} disabled={placing} className="primary-btn">
                {placing ? 'Please wait...' : 'Cash on Delivery'}
              </button>
            )}
            {payOptions.razorpay?.working && (
              <button type="button" onClick={goToRazorpayPayment} disabled={placing} className="secondary-btn">
                Pay via Razorpay
              </button>
            )}
          </div>
          {!payOptions.razorpay?.working && (
            <p style={{ marginTop: 8, fontSize: 14, color: '#555' }}>
              Card gateway off until valid Razorpay keys are in backend .env — use UPI QR or COD.
            </p>
          )}
          <button type="button" onClick={() => navigate('/cart')} className="back-btn" style={{ marginTop: 12 }}>
            ← Back to Cart
          </button>
        </div>
      )}

      {step === 1 && (
        <div className="payment-card">
          <h2>Scan QR To Pay</h2>
          {qrCode && (
            <img src={qrCode} alt="UPI QR" width="250" style={{ margin: '20px auto', display: 'block' }} />
          )}
          <p><strong>Amount:</strong> ₹{total}</p>
          <p><strong>Expires in:</strong> {timeLeft} sec</p>
          {error && <div className="error-message">{error}</div>}
          <a href={upiLink} className="primary-btn" style={{ display: 'inline-block', marginBottom: 12, textDecoration: 'none' }}>
            Open UPI App
          </a>
          <button type="button" onClick={confirmUPIPayment} disabled={placing} className="primary-btn">
            {placing ? 'Confirming...' : 'I Have Paid'}
          </button>
          <button type="button" onClick={() => setStep(0)} className="back-btn">← Back</button>
        </div>
      )}

      <div className="summary-card">
        <h3>Order Summary</h3>
        {items.map((item, i) => (
          <div key={i} className="summary-item">
            <span>
              {itemLabel(item)} × {item.quantity}
            </span>
            <span>₹{((item.productId?.price || item.price) * item.quantity).toFixed(2)}</span>
          </div>
        ))}
        <div className="summary-row">
          <span>Subtotal:</span>
          <span>₹{subtotal.toFixed(2)}</span>
        </div>
        <div className="summary-row">
          <span>Delivery:</span>
          <span>FREE</span>
        </div>
        <div className="summary-row total">
          <span>Total:</span>
          <span>₹{total.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}
