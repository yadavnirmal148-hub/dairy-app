const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const authMiddleware = require('../middleware/auth');
const isAdmin = require('../middleware/admin');

// ── CREATE NEW ORDER (from cart) ─────────────────────────
router.post('/create', authMiddleware, async (req, res) => {
  try {
    const { deliveryAddress, paymentMethod } = req.body;

    // Get user cart
    const cart = await Cart.findOne({ userId: req.user.id }).populate('items.productId');
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: 'Cart is empty' });
    }

    // Prepare order items
    const items = cart.items.map(i => ({
      productId: i.productId._id,
      productName: i.productId.name,   // ✅ product name save
      quantity: i.quantity,
      price: i.price
    }));

    const order = new Order({
      userId: req.user.id,
      items,
      totalAmount: cart.totalPrice,
      deliveryAddress: {
        zone: deliveryAddress?.zone  ,
        street: deliveryAddress?.street || "",
        pincode: deliveryAddress?.pincode || ""
      },
      paymentMethod: paymentMethod || 'UPI',
      paymentStatus: paymentMethod === 'COD' ? 'not_paid' : 'pending', // ✅ enum safe
      orderStatus: 'pending' // ✅ default status
    });

    await order.save();

    // Clear cart after order
    cart.items = [];
    cart.totalPrice = 0;
    await cart.save();

    res.status(201).json(order);
  } catch (err) {
    console.error("Order create error:", err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ── GET MY ORDERS ─────────────────────────
router.get('/my', authMiddleware, async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    console.error("Get my orders error:", err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ── GET ALL ORDERS (Admin only) ─────────────────────────
router.get('/', authMiddleware, isAdmin, async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('userId', 'name email')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    console.error("Get all orders error:", err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ── UPDATE ORDER STATUS (Admin only) ─────────────────────────
router.put('/:id/status', authMiddleware, isAdmin, async (req, res) => {
  try {
    const { orderStatus, paymentStatus } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    if (orderStatus) order.orderStatus = orderStatus.toLowerCase();   // ✅ enum safe
    if (paymentStatus) order.paymentStatus = paymentStatus.toLowerCase(); // ✅ enum safe

    await order.save();
    res.json(order);
  } catch (err) {
    console.error("Update order status error:", err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ── DELETE ORDER (Admin only) ─────────────────────────
router.delete('/:id', authMiddleware, isAdmin, async (req, res) => {
  try {
    await Order.findByIdAndDelete(req.params.id);
    res.json({ message: 'Order deleted successfully' });
  } catch (err) {
    console.error("Delete order error:", err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
