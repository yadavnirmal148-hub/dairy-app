const mongoose = require('mongoose');

// ── Order Item Schema ─────────────────────────
const orderItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  productName: {
    type: String, // ✅ अब product name भी save होगा
  },
  quantity: {
    type: Number,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
});

// ── Main Order Schema ─────────────────────────
const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    items: [orderItemSchema],

    totalAmount: {
      type: Number,
      required: true,
    },

    // ✅ अब address object के रूप में save होगा
    deliveryAddress: {
      name: { type: String, default: '' },
      phone: { type: String, default: '' },
      zone: { type: String, default: '' },
      street: { type: String, default: '' },
      landmark: { type: String, default: '' },
      city: { type: String, default: 'Jaipur' },
      pincode: { type: String, default: '' },
    },

    paymentMethod: {
      type: String,
      enum: ['UPI', 'COD', 'RAZORPAY'],
      default: 'UPI',
    },

    // 🔥 Payment Flow
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'not_paid'],
      default: 'pending',
    },

    // 🔥 Order Flow
    orderStatus: {
      type: String,
      enum: ['pending', 'confirmed', 'processing', 'delivered', 'cancelled'],
      default: 'pending',
    },

    // Transaction Reference (auto from backend)
    paymentRef: {
      type: String,
    },

    // Unique tracking ID (customer visible)
    trackingId: {
      type: String,
      unique: true,
    },
  },
  { timestamps: true }
);

// 🔥 Auto-generate tracking ID before save
orderSchema.pre('save', async function () {
  if (!this.trackingId) {
    this.trackingId = 'GF' + Date.now();
  }
});

module.exports = mongoose.model('Order', orderSchema);
