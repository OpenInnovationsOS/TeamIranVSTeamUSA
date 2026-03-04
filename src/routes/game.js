const express = require('express');
const GameController = require('../controllers/gameController');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Apply authentication to all game routes
router.use(authMiddleware);

// Tap-to-earn endpoint
router.post('/tap', GameController.tapToEarn);

// Battle endpoints
router.post('/battle/initiate', GameController.initiateBattle);
router.post('/battle/accept', GameController.acceptBattle);
router.get('/battle/history', GameController.getBattleHistory);
router.get('/battle/stats', GameController.getBattleStats);
router.get('/battle/opponents', GameController.getAvailableOpponents);

// Game state and user management
router.get('/state', GameController.getGameState);
router.post('/faction/select', GameController.selectFaction);

// Leaderboard
router.get('/leaderboard', GameController.getLeaderboard);

module.exports = router;
