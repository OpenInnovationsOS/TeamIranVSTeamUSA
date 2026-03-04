const express = require('express');
const authRoutes = require('./auth');
const gameRoutes = require('./game');
const blockchainRoutes = require('./blockchain');
const referralRoutes = require('./referral');
const territoryRoutes = require('./territory');

const router = express.Router();

// API routes
router.use('/auth', authRoutes);
router.use('/game', gameRoutes);
router.use('/blockchain', blockchainRoutes);
router.use('/referral', referralRoutes);
router.use('/territory', territoryRoutes);

// API info endpoint
router.get('/', (req, res) => {
  res.json({
    name: 'Team Iran vs Team USA - Telegram Game API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      game: '/api/game',
      blockchain: '/api/blockchain',
      referral: '/api/referral',
      territory: '/api/territory',
      health: '/health'
    },
    documentation: 'https://your-docs-url.com'
  });
});

module.exports = router;
