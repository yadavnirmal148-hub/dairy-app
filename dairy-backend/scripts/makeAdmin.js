/**
 * Run: node scripts/makeAdmin.js your@email.com
 * Makes a user admin in MongoDB (for first-time setup).
 */
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const email = process.argv[2];
if (!email) {
  console.error('Usage: node scripts/makeAdmin.js user@email.com');
  process.exit(1);
}

mongoose
  .connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/gokul_fresh')
  .then(async () => {
    const user = await User.findOneAndUpdate(
      { email: email.toLowerCase() },
      { isAdmin: true },
      { new: true }
    );
    if (!user) {
      console.error('User not found:', email);
      process.exit(1);
    }
    console.log('✅ Admin granted to:', user.email);
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
