const express = require('express');
const referralController = require('../controllers/referralController');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Public routes
router.get('/validate/:referralCode', referralController.validateReferralCode.bind(referralController));

// Protected routes
router.use(authMiddleware);

// Referral operations
router.post('/process', referralController.processReferral.bind(referralController));
router.get('/stats', referralController.getReferralStats.bind(referralController));
router.get('/referrals', referralController.getUserReferrals.bind(referralController));
router.get('/leaderboard', referralController.getReferralLeaderboard.bind(referralController));

// Social sharing
router.post('/share', referralController.processSocialShare.bind(referralController));
router.get('/share/stats', referralController.getSocialShareStats.bind(referralController));
router.get('/share/content', referralController.generateShareContent.bind(referralController));

// Admin routes
router.get('/metrics', referralController.getViralMetrics.bind(referralController));

module.exports = router;
