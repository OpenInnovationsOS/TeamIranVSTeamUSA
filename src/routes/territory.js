const express = require('express');
const territoryController = require('../controllers/territoryController');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Public routes
router.get('/map', territoryController.getTerritoryControlMap.bind(territoryController));
router.get('/events', territoryController.getActiveTerritoryEvents.bind(territoryController));

// Protected routes
router.use(authMiddleware);

// Territory operations
router.get('/', territoryController.getAllTerritories.bind(territoryController));
router.get('/:territoryId', territoryController.getTerritory.bind(territoryController));
router.post('/:territoryId/capture', territoryController.captureTerritory.bind(territoryController));

// Leaderboards and stats
router.get('/leaderboard', territoryController.getTerritoryLeaderboard.bind(territoryController));
router.get('/stats', territoryController.getFactionTerritoryStats.bind(territoryController));
router.get('/history', territoryController.getUserTerritoryHistory.bind(territoryController));

// Admin routes
router.post('/events/start', territoryController.startTerritoryEvent.bind(territoryController));
router.post('/events/:eventId/end', territoryController.endTerritoryEvent.bind(territoryController));
router.post('/reset', territoryController.resetTerritories.bind(territoryController));

module.exports = router;
