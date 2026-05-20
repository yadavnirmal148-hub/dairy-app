require('dotenv').config();

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const paymentRoutes = require('./routes/payments');
const adminRoutes = require('./routes/admin');
const app = express();

// ================= MIDDLEWARE =================
app.use(
  cors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  })
);
app.use(express.json());
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);
// ================= DB CONNECT =================
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/gokul_fresh')
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// ================= MODELS =================
const User = require('./models/User');
const Product = require('./models/Product');
const Cart = require('./models/Cart');
const Order = require('./models/Order');
const Otp = require('./models/Otp');

// ================= AUTH MIDDLEWARE =================
const authenticateToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token provided' });

  jwt.verify(token, process.env.JWT_SECRET || 'secret', (err, decoded) => {
    if (err) return res.status(403).json({ message: 'Invalid token' });
    const id = decoded.id || decoded._id;
    if (!id) return res.status(403).json({ message: 'Invalid token' });
    req.user = { id: String(id), isAdmin: !!decoded.isAdmin };
    next();
  });
};

// Enrich cart items with product details (fixes "Unnamed Product")
async function enrichCart(cart) {
  if (!cart) return null;
  const doc = cart.toObject ? cart.toObject() : cart;
  const enrichedItems = await Promise.all(
    (doc.items || []).map(async (item) => {
      const pid = item.productId?._id || item.productId;
      const product = await Product.findById(pid);
      const name = product?.name || item.productName || 'Product';
      return {
        ...item,
        productName: name,
        productId: product
          ? {
              _id: product._id,
              name: product.name,
              price: product.price,
              image: product.image,
              unit: product.unit,
            }
          : { _id: pid, name, price: item.price },
      };
    })
  );
  return { ...doc, items: enrichedItems };
}

const OTP_TTL_MS = 10 * 60 * 1000;
const normalizeEmail = (email) => (email || '').toLowerCase().trim();

app.get('/api/health', (req, res) => {
  res.json({ ok: true, service: 'Gokul Fresh API' });
});

// ================= AUTH ROUTES =================

// SEND OTP
app.post('/api/auth/send-otp', async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    if (!email) return res.status(400).json({ message: 'Email required' });

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'Email already registered. Please login.' });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + OTP_TTL_MS);
    await Otp.findOneAndUpdate(
      { email },
      { otp, expiresAt },
      { upsert: true, new: true }
    );

    console.log('OTP for', email, ':', otp);

    let emailSent = false;
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      try {
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        });
        await transporter.sendMail({
          from: process.env.SENDER_EMAIL || process.env.SMTP_USER,
          to: email,
          subject: 'Gokul Fresh — Your OTP',
          text: `Your verification code is ${otp}. Valid for 10 minutes.`,
        });
        emailSent = true;
      } catch (mailErr) {
        console.error('Mail Error:', mailErr.message);
      }
    }

    const isDev = process.env.NODE_ENV !== 'production';
    if (!emailSent) {
      return res.json({
        message: isDev
          ? 'OTP generated (use code below)'
          : 'OTP ready — use the code shown below (enable SMTP on server for email delivery)',
        devOtp: otp,
      });
    }

    res.json({
      message: 'OTP sent to your email',
      ...(isDev ? { devOtp: otp } : {}),
    });
  } catch (err) {
    console.error('Send OTP Error:', err);
    res.status(500).json({ message: 'Failed to send OTP' });
  }
});

// REGISTER (with OTP verification)
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, password, phone, otp } = req.body;
    const email = normalizeEmail(req.body.email);

    if (!name || !email || !password || !phone || !otp) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: 'Email already registered. Please login instead.' });
    }

    const stored = await Otp.findOne({ email });
    if (!stored || stored.otp !== String(otp).trim()) {
      return res.status(400).json({ message: 'Invalid OTP. Click "Resend OTP" and try again.' });
    }
    if (new Date() > stored.expiresAt) {
      await Otp.deleteOne({ email });
      return res.status(400).json({ message: 'OTP expired. Please request a new one.' });
    }

    const user = new User({
      name: name.trim(),
      email,
      password,
      phone: phone.trim(),
      isEmailVerified: true,
    });
    await user.save();

    await Otp.deleteOne({ email });

    res.json({ message: 'Registered successfully! You can login now.' });
  } catch (err) {
    console.error('Register Error:', err);
    if (err.code === 11000) {
      return res.status(400).json({ message: 'Email already registered. Please login.' });
    }
    res.status(500).json({ message: err.message || 'Registration failed' });
  }
});

// LOGIN
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: normalizeEmail(email) });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ message: 'Invalid credentials' });

    const token = jwt.sign(
      { id: user._id.toString(), isAdmin: !!user.isAdmin },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        isAdmin: user.isAdmin,
      },
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET PROFILE
app.get('/api/auth/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// UPDATE PROFILE
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

    const user = await User.findByIdAndUpdate(req.user.id, update, {
      new: true,
      runValidators: true,
    }).select('-password');

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
app.get('/api/cart', authenticateToken, async (req, res) => {
  try {
    let cart = await Cart.findOne({ userId: req.user.id });
    if (!cart) {
      cart = new Cart({ userId: req.user.id, items: [], totalPrice: 0 });
      await cart.save();
    }
    res.json(await enrichCart(cart));
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/cart/add', authenticateToken, async (req, res) => {
  try {
    console.log("User:", req.user);
    console.log("Body:", req.body);

    const { productId, quantity } = req.body;
    const product = await Product.findById(productId);
    console.log("Product:", product);

    if (!product) return res.status(404).json({ message: 'Product not found' });

    let cart = await Cart.findOne({ userId: req.user.id });
    if (!cart) cart = new Cart({ userId: req.user.id, items: [] });

    const item = cart.items.find(i => i.productId.toString() === productId);
    if (item) {
      item.quantity += quantity;
      item.price = product.price;
      item.productName = product.name;
    } else {
      cart.items.push({
        productId,
        quantity,
        price: product.price,
        productName: product.name,
      });
    }

    cart.totalPrice = cart.items.reduce((t, i) => t + i.price * i.quantity, 0);
    await cart.save();

    res.json(await enrichCart(cart));
  } catch (err) {
    console.error("Cart Add Error:", err);
    res.status(500).json({ message: 'Server error' });
  }
});
// ================= CART UPDATE =================
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
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});
app.delete('/api/cart/remove/:productId', authenticateToken, async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.user.id });
    if (!cart) return res.status(404).json({ message: 'Cart not found' });

    cart.items = cart.items.filter(i => i.productId.toString() !== req.params.productId);
    cart.totalPrice = cart.items.reduce((t, i) => t + i.price * i.quantity, 0);
    await cart.save();

    res.json(await enrichCart(cart));
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});
app.delete('/api/cart/clear', authenticateToken, async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.user.id });
    if (!cart) return res.status(404).json({ message: 'Cart not found' });

    cart.items = [];
    cart.totalPrice = 0;
    await cart.save();

    res.json({ message: 'Cart cleared' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ================= ORDERS =================
app.post('/api/orders', authenticateToken, async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.user.id }).populate('items.productId');
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: 'Cart is empty' });
    }

    const { deliveryAddress, paymentMethod } = req.body;
    const addr = deliveryAddress || {};

    const orderItems = await Promise.all(
      cart.items.map(async (item) => {
        const pid = item.productId?._id || item.productId;
        const p = item.productId?.name
          ? item.productId
          : await Product.findById(pid);
        return {
          productId: pid,
          productName: item.productName || p?.name || 'Product',
          quantity: item.quantity,
          price: item.price,
        };
      })
    );

    let method = (paymentMethod || 'UPI').toUpperCase();
    if (!['UPI', 'COD', 'RAZORPAY'].includes(method)) method = 'UPI';

    const order = new Order({
      userId: req.user.id,
      items: orderItems,
      totalAmount: cart.totalPrice,
      deliveryAddress: {
        name: addr.name || '',
        phone: addr.phone || '',
        zone: addr.zone || '',
        street: addr.street || '',
        landmark: addr.landmark || '',
        city: addr.city || 'Jaipur',
        pincode: addr.pincode || '',
      },
      paymentMethod: method,
      paymentStatus: 'pending',
      orderStatus: 'pending',
    });

    await order.save();
    cart.items = [];
    cart.totalPrice = 0;
    await cart.save();

    res.json(order);
  } catch (err) {
    console.error('Order Error:', err);
    res.status(500).json({ message: err.message || 'Server error' });
  }
});

app.get('/api/orders', authenticateToken, async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user.id })
      .populate('items.productId')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ================= SERVER =================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

