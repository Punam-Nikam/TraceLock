// authMiddleware.js
// This file protects routes — only logged-in users with valid tokens can access them.
// HOW JWT WORKS (simple):
//   Login → server creates a token with user's ID inside → sends to frontend
//   Next request → frontend sends token → server VERIFIES it → gets user ID → continues
// Each user gets their OWN token. No shared state. That's why multiple users can login!

const jwt = require('jsonwebtoken');
require('dotenv').config();

const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expired, please login again' });
    }
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

module.exports = { verifyToken };