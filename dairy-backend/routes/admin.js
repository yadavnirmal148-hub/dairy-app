const express = require('express');
const router = express.Router();

const auth = require('../middleware/auth');
const admin = require('../middleware/admin');

const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');

// ================= ADMIN DASHBOARD =================
router.get('/dashboard', auth, admin, async (req, res) => {
  try {
    const [orders, products, users, revenue] = await Promise.all([
      Order.countDocuments(),
      Product.countDocuments(),
      User.countDocuments(),
      Order.aggregate([
        { $match: { paymentStatus: 'paid' } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } },
      ]),
    ]);
    const pendingOrders = await Order.countDocuments({ orderStatus: 'pending' });
    res.json({
      orders,
      products,
      users,
      pendingOrders,
      revenue: revenue[0]?.total || 0,
    });
  } catch (err) {
    console.error('Dashboard stats error:', err);
    res.status(500).json({ message: 'Failed to load dashboard' });
  }
});

router.get('/products', auth, admin, async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch products' });
  }
});

router.put('/users/:id/admin', auth, admin, async (req, res) => {
  try {
    const { isAdmin } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isAdmin: !!isAdmin },
      { new: true }
    ).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update user' });
  }
});

// ================= ORDERS =================

// Get all orders
router.get('/orders', auth, admin, async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('userId', 'name email phone address')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    console.error("Get all orders error:", err);
    res.status(500).json({ message: 'Failed to fetch orders' });
  }
});

// Delivery locations (orders + users with addresses)
router.get('/locations', auth, admin, async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('userId', 'name phone email address')
      .sort({ createdAt: -1 })
      .limit(200);

    const users = await User.find({
      $or: [
        { 'address.street': { $ne: '' } },
        { 'address.zone': { $ne: '' } },
      ],
    })
      .select('name phone email address')
      .limit(100);

    res.json({ orders, users });
  } catch (err) {
    console.error('Locations error:', err);
    res.status(500).json({ message: 'Failed to fetch locations' });
  }
});

// Verify payment & confirm order
router.put('/orders/:id/verify', auth, admin, async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { paymentStatus: 'paid', orderStatus: 'confirmed' },
      { new: true }
    );
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json({ message: 'Payment Verified & Order Confirmed', order });
  } catch (err) {
    console.error("Verify payment error:", err);
    res.status(500).json({ message: 'Verification failed' });
  }
});

// Update order status
router.put('/orders/:id/status', auth, admin, async (req, res) => {
  try {
    const { orderStatus, paymentStatus } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    if (orderStatus) order.orderStatus = orderStatus.toLowerCase();
    if (paymentStatus) order.paymentStatus = paymentStatus.toLowerCase();

    await order.save();
    res.json(order);
  } catch (err) {
    console.error("Update order status error:", err);
    res.status(500).json({ message: 'Failed to update order status' });
  }
});

// Delete order
router.delete('/orders/:id', auth, admin, async (req, res) => {
  try {
    await Order.findByIdAndDelete(req.params.id);
    res.json({ message: 'Order deleted successfully' });
  } catch (err) {
    console.error("Delete order error:", err);
    res.status(500).json({ message: 'Failed to delete order' });
  }
});

// ================= PRODUCTS =================

// Add product
router.post('/products', auth, admin, async (req, res) => {
  try {
    const product = new Product(req.body);
    await product.save();
    res.json(product);
  } catch (err) {
    console.error("Add product error:", err);
    res.status(500).json({ message: 'Failed to add product' });
  }
});

// Update product
router.put('/products/:id', auth, admin, async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (err) {
    console.error("Update product error:", err);
    res.status(500).json({ message: 'Failed to update product' });
  }
});

// Delete product
router.delete('/products/:id', auth, admin, async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: 'Product deleted successfully' });
  } catch (err) {
    console.error("Delete product error:", err);
    res.status(500).json({ message: 'Failed to delete product' });
  }
});

// ================= USERS =================

// Get all users
router.get('/users', auth, admin, async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (err) {
    console.error("Get all users error:", err);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
});

module.exports = router;
