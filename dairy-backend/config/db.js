// config/db.js

const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(
      process.env.MONGODB_URI || 'mongodb://localhost:27017/gokul_fresh',
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }
    );

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);

  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error.message);
    process.exit(1); // app बंद कर देगा अगर DB connect fail हो
  }
};

module.exports = connectDB;