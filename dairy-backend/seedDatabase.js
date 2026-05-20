const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/gokul_fresh', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const productSchema = new mongoose.Schema({
  name: String,
  description: String,
  price: Number,
  image: String,
  category: String,
  stock: Number,
  unit: String,
  createdAt: { type: Date, default: Date.now },
});

const Product = mongoose.model('Product', productSchema);

const seedProducts = [
  {
    name: 'Pure Desi Milk',
    description: '100% Pure Desi Cow Milk - Fresh from Farm',
    price: 65,
    image: 'https://via.placeholder.com/300?text=Desi+Milk',
    category: 'Milk',
    stock: 100,
    unit: 'liter',
  },
  {
    name: 'A2 Milk',
    description: 'Pure A2 Cow Milk - High in Nutrients',
    price: 85,
    image: 'https://via.placeholder.com/300?text=A2+Milk',
    category: 'Milk',
    stock: 80,
    unit: 'liter',
  },
  {
    name: 'Whole Milk 500ml',
    description: 'Fresh Whole Milk in 500ml Bottle',
    price: 35,
    image: 'https://via.placeholder.com/300?text=Whole+Milk',
    category: 'Milk',
    stock: 150,
    unit: '500ml',
  },
  {
    name: 'Ghee (Pure Desi)',
    description: 'Pure Desi Cow Ghee - 500g',
    price: 450,
    image: 'https://via.placeholder.com/300?text=Ghee',
    category: 'Ghee',
    stock: 50,
    unit: '500g',
  },
  {
    name: 'Fresh Curd',
    description: 'Homemade Fresh Curd - 500g',
    price: 45,
    image: 'https://via.placeholder.com/300?text=Curd',
    category: 'Dairy Products',
    stock: 60,
    unit: '500g',
  },
  {
    name: 'Paneer Block',
    description: 'Fresh Paneer (Cottage Cheese) - 250g',
    price: 120,
    image: 'https://via.placeholder.com/300?text=Paneer',
    category: 'Dairy Products',
    stock: 75,
    unit: '250g',
  },
  {
    name: 'Butter (Salted)',
    description: 'Pure Butter - 200g',
    price: 180,
    image: 'https://via.placeholder.com/300?text=Butter',
    category: 'Dairy Products',
    stock: 40,
    unit: '200g',
  },
  {
    name: 'Buttermilk',
    description: 'Fresh Buttermilk - 1 Liter',
    price: 40,
    image: 'https://via.placeholder.com/300?text=Buttermilk',
    category: 'Milk',
    stock: 90,
    unit: '1L',
  },
  {
    name: 'Mozzarella Cheese',
    description: 'Fresh Mozzarella Cheese - 200g',
    price: 200,
    image: 'https://via.placeholder.com/300?text=Mozzarella',
    category: 'Dairy Products',
    stock: 35,
    unit: '200g',
  },
  {
    name: 'Flavored Yogurt',
    description: 'Homemade Flavored Yogurt - 500g (Mango/Strawberry)',
    price: 60,
    image: 'https://via.placeholder.com/300?text=Yogurt',
    category: 'Dairy Products',
    stock: 55,
    unit: '500g',
  },
];

const seedDatabase = async () => {
  try {
    // Clear existing products
    await Product.deleteMany({});
    console.log('Cleared existing products');

    // Insert new products
    const result = await Product.insertMany(seedProducts);
    console.log(`✅ Seeded ${result.length} products successfully!`);

    console.log('\nProducts added:');
    result.forEach((product) => {
      console.log(`- ${product.name} (₹${product.price}/${product.unit})`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
