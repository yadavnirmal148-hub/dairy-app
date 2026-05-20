const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },

  email: { 
    type: String, 
    required: true, 
    unique: true, 
    lowercase: true, 
    trim: true 
  },

  phone: { type: String },

  address: {
    zone: { type: String, default: '' },
    street: { type: String, default: '' },
    landmark: { type: String, default: '' },
    city: { type: String, default: 'Jaipur' },
    pincode: { type: String, default: '' },
  },

  password: { type: String, required: true },

  isEmailVerified: { type: Boolean, default: false }, // ✅ OTP verification use

  isAdmin: { type: Boolean, default: false } // ✅ admin flag
}, { timestamps: true });

// Password hash before save (Mongoose 9 — no next() in async hooks)
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 10);
});

// 🔑 Compare password method
userSchema.methods.matchPassword = async function(password) {
  return await bcrypt.compare(password, this.password);
};

module.exports = mongoose.model('User', userSchema);
