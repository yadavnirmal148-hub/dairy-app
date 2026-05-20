const User = require('../models/User');

const isAdmin = async (req, res, next) => {
  try {
    // अगर user ही नहीं मिला
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized: No user found' });
    }

    // DB से user निकालो
    const userId = req.user?.id || req.user?._id;
    if (!userId) {
      return res.status(401).json({ message: 'Invalid session. Please login again.' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(401).json({ message: 'Session expired. Please login again.' });
    }

    // ✅ अब isAdmin flag check करो
    if (!user.isAdmin) {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    // अगर सब ठीक है → आगे बढ़ो
    next();
  } catch (error) {
    console.error('Admin middleware error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = isAdmin;
