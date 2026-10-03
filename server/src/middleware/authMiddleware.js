const jwt = require('jsonwebtoken');
require('dotenv').config();

const authenticate = (req, res, next) => {
  const token = req.cookies?.token || (req.header('Authorization') && req.header('Authorization').startsWith('Bearer ') ? req.header('Authorization').split(' ')[1] : null);

  if (!token) {
    return res.status(401).json({ error: 'Access denied. No valid token provided.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Contains id and other info from token payload
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid or expired token.' });
  }
};

module.exports = authenticate;
