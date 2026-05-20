const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token provided' });

  jwt.verify(token, process.env.JWT_SECRET || 'secret', (err, decoded) => {
    if (err) return res.status(403).json({ message: 'Invalid token' });
    const id = decoded.id || decoded._id;
    if (!id) return res.status(403).json({ message: 'Invalid token payload' });
    req.user = {
      id: String(id),
      isAdmin: !!decoded.isAdmin,
    };
    next();
  });
};

module.exports = authenticateToken;
