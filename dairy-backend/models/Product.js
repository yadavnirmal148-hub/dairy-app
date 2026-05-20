const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    price: { type: Number, required: true },
    image: { type: String, default: '' },
    category: {
      type: String,
      enum: ['Milk', 'Ghee', 'Curd', 'Paneer', 'Butter', 'Dairy'],
      default: 'Dairy',
    },
    stock: { type: Number, default: 0 },
    unit: { type: String, default: '1L' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// 👇 Explicitly bind to "products" collection
module.exports = mongoose.model('Product', productSchema, 'products');
