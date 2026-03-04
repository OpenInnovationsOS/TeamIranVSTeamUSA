const express = require('express');
const blockchainController = require('../controllers/blockchainController');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Public routes
router.get('/win/info', blockchainController.getWINTokenInfo.bind(blockchainController));
router.get('/payment/info', blockchainController.getPaymentInfo.bind(blockchainController));
router.get('/transaction/:txHash', blockchainController.verifyTransaction.bind(blockchainController));

// Protected routes
router.use(authMiddleware);

// WIN token operations
router.get('/win/balance', blockchainController.getUserWINBalance.bind(blockchainController));
router.post('/win/claim', blockchainController.claimWIN.bind(blockchainController));

// Transaction history
router.get('/transactions', blockchainController.getTransactionHistory.bind(blockchainController));

// Payment processing (webhook)
router.post('/payment/process', blockchainController.processTONPayment.bind(blockchainController));

// Admin routes (require additional admin authentication)
router.post('/admin/win/mint', blockchainController.mintWIN.bind(blockchainController));
router.post('/admin/win/disable', blockchainController.disableWINMinting.bind(blockchainController));
router.post('/admin/treasury/withdraw', blockchainController.withdrawFromTreasury.bind(blockchainController));

module.exports = router;
