require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../models/Product');

const samples = [
  { name: 'Fresh Cow Milk', price: 60, unit: '1 L', category: 'Milk', image: '', stock: 100 },
  { name: 'Buffalo Milk', price: 70, unit: '1 L', category: 'Milk', image: '', stock: 100 },
  { name: 'Curd', price: 45, unit: '500 g', category: 'Dairy', image: '', stock: 50 },
  { name: 'Paneer', price: 90, unit: '250 g', category: 'Dairy', image: '', stock: 40 },
  { name: 'Ghee', price: 550, unit: '500 ml', category: 'Dairy', image: '', stock: 20 },
];

async function run() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/gokul_fresh');
  for (const p of samples) {
    await Product.findOneAndUpdate({ name: p.name }, p, { upsert: true, new: true });
  }
  console.log('✅ Products seeded:', samples.map((s) => s.name).join(', '));
  await mongoose.disconnect();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
