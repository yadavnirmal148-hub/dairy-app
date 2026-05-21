require('dotenv').config();

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const authenticateToken = require('./middleware/auth');

const app = express();

// ================= ROUTES =================
const paymentRoutes = require('./routes/payments');
const adminRoutes = require('./routes/admin');

// ================= MODELS =================
const User = require('./models/User');
const Product = require('./models/Product');
const Cart = require('./models/Cart');
const Order = require('./models/Order');

// ================= MIDDLEWARE =================
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

app.use(express.json());

app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);

// ================= DATABASE =================
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB Connected');
  })
  .catch((err) => {
    console.log('❌ MongoDB Error:', err.message);
  });

// ================= HELPERS =================
const normalizeEmail = (email) => {
  return (email || '').toLowerCase().trim();
};

// ================= HEALTH =================
app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

// ================= REGISTER (No OTP) =================
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password || !phone) {
      return res.status(400).json({ message: 'All fields required' });
    }

    const existing = await User.findOne({ email: normalizeEmail(email) });
    if (existing) return res.status(400).json({ message: 'Email already registered' });

    const user = new User({
      name,
      email: normalizeEmail(email),
      password,
      phone,
      isEmailVerified: false,
    });

    await user.save();
    res.json({ success: true, message: 'Registered successfully' });
  } catch (err) {
    console.log('❌ Register Error:', err);
    res.status(500).json({ message: 'Registration failed' });
  }
});

// ================= LOGIN =================
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: normalizeEmail(email) });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: 'Invalid credentials' });

    const token = jwt.sign(
      { id: user._id, isAdmin: user.isAdmin || false },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ token, user });
  } catch (err) {
    console.log('❌ Login Error:', err);
    res.status(500).json({ message: 'Login failed' });
  }
});

// ================= PROFILE =================
app.get('/api/auth/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.put('/api/auth/profile', authenticateToken, async (req, res) => {
  try {
    const { name, phone, zone, street, landmark, city, pincode } = req.body;
    const update = {};
    if (name) update.name = name.trim();
    if (phone) update.phone = phone.trim();
    update.address = {
      zone: zone || req.body.address?.zone || '',
      street: street || (typeof req.body.address === 'string' ? req.body.address : req.body.address?.street) || '',
      landmark: landmark || req.body.address?.landmark || '',
      city: city || req.body.address?.city || 'Jaipur',
      pincode: pincode || req.body.address?.pincode || '',
    };

    const user = await User.findByIdAndUpdate(req.user.id, update, { new: true, runValidators: true }).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    console.error('Profile update error:', err);
    res.status(500).json({ message: err.message || 'Profile update failed' });
  }
});

// ================= PRODUCTS =================
app.get('/api/products', async (req, res) => {
  try {
    const products = await Product.find({ isActive: { $ne: false } }).sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ================= CART =================
const enrichCart = async (cart) => {
  return cart;
};

app.get('/api/cart', authenticateToken, async (req, res) => {
  try {
    let cart = await Cart.findOne({ userId: req.user.id });
    if (!cart) { cart = new Cart({ userId: req.user.id, items: [], totalPrice: 0 }); await cart.save(); }
    res.json(await enrichCart(cart));
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
});

app.post('/api/cart/add', authenticateToken, async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    let cart = await Cart.findOne({ userId: req.user.id });
    if (!cart) cart = new Cart({ userId: req.user.id, items: [] });

    const item = cart.items.find(i => i.productId.toString() === productId);
    if (item) { item.quantity += quantity; item.price = product.price; item.productName = product.name; }
    else cart.items.push({ productId, quantity, price: product.price, productName: product.name });

    cart.totalPrice = cart.items.reduce((t, i) => t + i.price * i.quantity, 0);
    await cart.save();
    res.json(await enrichCart(cart));
  } catch (err) { console.error("Cart Add Error:", err); res.status(500).json({ message: 'Server error' }); }
});

app.put('/api/cart/update', authenticateToken, async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    const cart = await Cart.findOne({ userId: req.user.id });
    if (!cart) return res.status(404).json({ message: 'Cart not found' });
    const item = cart.items.find(i => i.productId.toString() === productId);
    if (!item) return res.status(404).json({ message: 'Item not found in cart' });
    item.quantity = quantity;
    cart.totalPrice = cart.items.reduce((t, i) => t + i.price * i.quantity, 0);
    await cart.save();
    res.json(await enrichCart(cart));
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
});

app.delete('/api/cart/remove/:productId', authenticateToken, async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.user.id });
    if (!cart) return res.status(404).json({ message: 'Cart not found' });
    cart.items = cart.items.filter(i => i.productId.toString() !== req.params.productId);
    cart.totalPrice = cart.items.reduce((t, i) => t + i.price * i.quantity, 0);
    await cart.save();
    res.json(await enrichCart(cart));
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
});

app.delete('/api/cart/clear', authenticateToken, async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.user.id });
    if (!cart) return res.status(404).json({ message: 'Cart not found' });
    cart.items = []; cart.totalPrice = 0;
    await cart.save();
    res.json({ message: 'Cart cleared' });
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
});

// ================= ORDERS =================
app.post('/api/orders', authenticateToken, async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.user.id }).populate('items.productId');
    if (!cart || cart.items.length === 0)
      return res.status(400).json({ message: 'Cart is empty' });

    const { deliveryAddress, paymentMethod } = req.body;
    const addr = deliveryAddress || {};

    const orderItems = await Promise.all(
      cart.items.map(async (item) => {
        const pid = item.productId?._id || item.productId;
        const p = item.productId?.name ? item.productId : await Product.findById(pid);
        return { productId: pid, productName: item.productName || p?.name || 'Product', quantity: item.quantity, price: item.price };
      })
    );

    let method = (paymentMethod || 'UPI').toUpperCase();
    if (!['UPI', 'COD', 'RAZORPAY'].includes(method)) method = 'UPI';

    const order = new Order({
      userId: req.user.id, items: orderItems, totalAmount: cart.totalPrice,
      deliveryAddress: { name: addr.name || '', phone: addr.phone || '', zone: addr.zone || '', street: addr.street || '', landmark: addr.landmark || '', city: addr.city || 'Jaipur', pincode: addr.pincode || '' },
      paymentMethod: method, paymentStatus: 'pending', orderStatus: 'pending',
    });

    await order.save();
    cart.items = []; cart.totalPrice = 0;
    await cart.save();
    res.json(order);
  } catch (err) {
    console.error('Order Error:', err);
    res.status(500).json({ message: err.message || 'Server error' });
  }
});

app.get('/api/orders', authenticateToken, async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user.id }).populate('items.productId').sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
});

// ================= SERVER =================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});