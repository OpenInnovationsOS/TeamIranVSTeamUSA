const express = require('express');
const User = require('../models/User');
const { telegramAuth } = require('../middleware/auth');
const telegramBot = require('../telegram/bot');

const router = express.Router();

// Authenticate user via Telegram and get JWT token
router.post('/telegram', telegramAuth, async (req, res) => {
  try {
    const user = req.user;
    
    // Generate JWT token
    const token = telegramBot.generateAuthToken(user);
    
    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        telegram_id: user.telegram_id,
        username: user.username,
        first_name: user.first_name,
        last_name: user.last_name,
        faction: user.faction,
        stg_balance: user.stg_balance,
        win_claimable: user.win_claimable,
        level: user.level,
        experience: user.experience,
        referral_code: user.referral_code,
        ton_wallet_address: user.ton_wallet_address,
        created_at: user.created_at
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Verify JWT token and get user data
router.get('/verify', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    
    if (!user || !user.is_active) {
      return res.status(401).json({ error: 'Invalid token or user not found' });
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        telegram_id: user.telegram_id,
        username: user.username,
        first_name: user.first_name,
        last_name: user.last_name,
        faction: user.faction,
        stg_balance: user.stg_balance,
        win_claimable: user.win_claimable,
        level: user.level,
        experience: user.experience,
        referral_code: user.referral_code,
        ton_wallet_address: user.ton_wallet_address
      }
    });
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

// Refresh JWT token
router.post('/refresh', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    
    if (!user || !user.is_active) {
      return res.status(401).json({ error: 'Invalid token or user not found' });
    }

    // Generate new token
    const newToken = telegramBot.generateAuthToken(user);
    
    res.json({
      success: true,
      token: newToken
    });
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

module.exports = router;
