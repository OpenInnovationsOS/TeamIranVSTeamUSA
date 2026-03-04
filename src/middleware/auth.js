const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    
    if (!user || !user.is_active) {
      return res.status(401).json({ error: 'Invalid token or user not found.' });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token.' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired.' });
    }
    res.status(500).json({ error: 'Server error during authentication.' });
  }
};

const optionalAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId);
      
      if (user && user.is_active) {
        req.user = user;
      }
    }
    
    next();
  } catch (error) {
    // Continue without authentication for optional auth
    next();
  }
};

const telegramAuth = async (req, res, next) => {
  try {
    const { telegram_id, username, first_name, last_name } = req.body;
    
    if (!telegram_id) {
      return res.status(400).json({ error: 'Telegram ID is required.' });
    }

    let user = await User.findByTelegramId(telegram_id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found. Please start the bot first.' });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(500).json({ error: 'Server error during Telegram authentication.' });
  }
};

module.exports = {
  authMiddleware,
  optionalAuth,
  telegramAuth
};
