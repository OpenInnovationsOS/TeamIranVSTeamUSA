require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const compression = require('compression');

// Import smart strategy components
const costOptimizer = require('./utils/cost-optimizer');
const monetizationService = require('./services/monetization');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(compression()); // Reduce bandwidth usage
app.use(express.json());

// Track API calls for cost optimization
app.use((req, res, next) => {
  const usage = costOptimizer.trackApiCall(req.path, req.method);
  
  // Add cost headers for monitoring
  res.set('X-API-Usage', `${usage.usagePercent.toFixed(1)}%`);
  res.set('X-API-Remaining', usage.remaining);
  
  if (!usage.allowed) {
    return res.status(429).json({ 
      error: 'API limit exceeded',
      usage: usage,
      message: 'Free tier limit reached - consider upgrading'
    });
  }
  
  next();
});

// Track active users
app.use((req, res, next) => {
  if (req.headers['x-user-id']) {
    costOptimizer.trackActiveUser(req.headers['x-user-id']);
  }
  next();
});

// Serve static files with optimization
app.use(express.static('frontend/build', {
  maxAge: '1y', // Cache static assets for 1 year
  etag: true,
  lastModified: true
}));

// API Routes
app.get('/api/health', (req, res) => {
  costOptimizer.trackDbQuery('health', 'select');
  
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    message: 'Team Iran vs USA Game Server is running!',
    cost: costOptimizer.getCurrentMonthlyCost(),
    profitMargin: costOptimizer.calculateProfitMargin(),
    shouldUpgrade: costOptimizer.shouldUpgradeToPro()
  });
});

// Enhanced user stats with monetization
app.get('/api/user/stats', async (req, res) => {
  costOptimizer.trackDbQuery('users', 'select');
  
  const userId = req.headers['x-user-id'] || 'player123';
  
  // Get user subscriptions
  const subscriptions = await monetizationService.getUserSubscriptions(userId);
  
  res.json({
    id: userId,
    username: 'Player123',
    faction: 'iran',
    level: 15,
    stgTokens: 12450,
    energy: 85,
    maxEnergy: subscriptions.energy_boost ? 200 : 100, // Premium feature
    rank: 247,
    wins: 142,
    losses: 67,
    winRate: 68,
    subscriptions: subscriptions,
    premiumFeatures: subscriptions.map(s => s.id)
  });
});

// Leaderboard with monetization insights
app.get('/api/leaderboard', (req, res) => {
  costOptimizer.trackDbQuery('leaderboard', 'select');
  
  res.json([
    { rank: 1, username: 'ProGamer', faction: 'usa', wins: 542, winRate: 89, premium: true },
    { rank: 2, username: 'IranChamp', faction: 'iran', wins: 487, winRate: 85, premium: false },
    { rank: 3, username: 'BattleKing', faction: 'usa', wins: 423, winRate: 82, premium: true },
    { rank: 247, username: 'Player123', faction: 'iran', wins: 142, winRate: 68, premium: false }
  ]);
});

// Monetization endpoints
app.get('/api/products', (req, res) => {
  costOptimizer.trackDbQuery('products', 'select');
  
  res.json({
    success: true,
    products: monetizationService.getAvailableProducts()
  });
});

app.post('/api/purchase/stg-tokens', async (req, res) => {
  try {
    costOptimizer.trackDbQuery('purchases', 'insert');
    
    const { productId, paymentMethod } = req.body;
    const userId = req.headers['x-user-id'] || 'player123';
    
    const result = await monetizationService.purchaseSTGTokens(userId, productId, paymentMethod);
    
    res.json({
      success: true,
      purchase: result.purchase,
      tokens: result.tokens,
      message: `Successfully purchased ${result.tokens} STG tokens!`
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

app.post('/api/subscribe/premium', async (req, res) => {
  try {
    costOptimizer.trackDbQuery('subscriptions', 'insert');
    
    const { featureId, paymentMethod } = req.body;
    const userId = req.headers['x-user-id'] || 'player123';
    
    const result = await monetizationService.subscribePremiumFeature(userId, featureId, paymentMethod);
    
    res.json({
      success: true,
      purchase: result.purchase,
      feature: result.feature,
      message: `Successfully subscribed to ${result.feature.name}!`
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

app.post('/api/battle/create', async (req, res) => {
  try {
    costOptimizer.trackDbQuery('battles', 'insert');
    
    const { player1Id, player2Id, stakeAmount, battleType } = req.body;
    
    // Process battle fee
    const feeResult = await monetizationService.processBattleFee(player1Id, player2Id, stakeAmount, battleType);
    
    res.json({
      success: true,
      battle: {
        id: 'battle_' + Date.now(),
        player1Id,
        player2Id,
        stakeAmount: feeResult.netStake,
        fee: feeResult.fee,
        battleType
      },
      message: `Battle created with ${feeResult.fee} STG fee`
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

app.get('/api/user/purchases', async (req, res) => {
  try {
    costOptimizer.trackDbQuery('purchases', 'select');
    
    const userId = req.headers['x-user-id'] || 'player123';
    const purchases = await monetizationService.getUserPurchaseHistory(userId);
    
    res.json({
      success: true,
      purchases
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

app.get('/api/user/subscriptions', async (req, res) => {
  try {
    costOptimizer.trackDbQuery('subscriptions', 'select');
    
    const userId = req.headers['x-user-id'] || 'player123';
    const subscriptions = await monetizationService.getUserSubscriptions(userId);
    
    res.json({
      success: true,
      subscriptions
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Admin endpoints for cost monitoring
app.get('/api/admin/cost-status', (req, res) => {
  costOptimizer.trackDbQuery('admin', 'select');
  
  res.json({
    success: true,
    status: costOptimizer.getStatus(),
    recommendations: costOptimizer.generateRecommendations()
  });
});

app.get('/api/admin/revenue', (req, res) => {
  costOptimizer.trackDbQuery('admin', 'select');
  
  res.json({
    success: true,
    analytics: monetizationService.getRevenueAnalytics(),
    dailyReport: costOptimizer.generateDailyReport()
  });
});

// Admin monetization management endpoints
app.get('/api/admin/monetization/products', (req, res) => {
  costOptimizer.trackDbQuery('admin', 'select');
  
  res.json({
    success: true,
    products: monetizationService.getAvailableProducts()
  });
});

app.put('/api/admin/monetization/token-packs/:id', (req, res) => {
  try {
    costOptimizer.trackDbQuery('admin', 'update');
    
    const { id } = req.params;
    const { amount, price, bonus, active } = req.body;
    
    // Update token pack in monetization service
    const updatedPack = monetizationService.updateTokenPack(id, { amount, price, bonus, active });
    
    res.json({
      success: true,
      pack: updatedPack,
      message: 'Token pack updated successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

app.put('/api/admin/monetization/premium-features/:id', (req, res) => {
  try {
    costOptimizer.trackDbQuery('admin', 'update');
    
    const { id } = req.params;
    const { name, monthly, description, active } = req.body;
    
    // Update premium feature in monetization service
    const updatedFeature = monetizationService.updatePremiumFeature(id, { name, monthly, description, active });
    
    res.json({
      success: true,
      feature: updatedFeature,
      message: 'Premium feature updated successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

app.post('/api/admin/monetization/token-packs', (req, res) => {
  try {
    costOptimizer.trackDbQuery('admin', 'insert');
    
    const { amount, price, bonus, active } = req.body;
    
    // Add new token pack
    const newPack = monetizationService.addTokenPack({ amount, price, bonus, active });
    
    res.json({
      success: true,
      pack: newPack,
      message: 'Token pack added successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

app.post('/api/admin/monetization/premium-features', (req, res) => {
  try {
    costOptimizer.trackDbQuery('admin', 'insert');
    
    const { name, monthly, description, active } = req.body;
    
    // Add new premium feature
    const newFeature = monetizationService.addPremiumFeature({ name, monthly, description, active });
    
    res.json({
      success: true,
      feature: newFeature,
      message: 'Premium feature added successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

app.delete('/api/admin/monetization/token-packs/:id', (req, res) => {
  try {
    costOptimizer.trackDbQuery('admin', 'delete');
    
    const { id } = req.params;
    
    // Delete token pack
    monetizationService.deleteTokenPack(id);
    
    res.json({
      success: true,
      message: 'Token pack deleted successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

app.delete('/api/admin/monetization/premium-features/:id', (req, res) => {
  try {
    costOptimizer.trackDbQuery('admin', 'delete');
    
    const { id } = req.params;
    
    // Delete premium feature
    monetizationService.deletePremiumFeature(id);
    
    res.json({
      success: true,
      message: 'Premium feature deleted successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

app.get('/api/admin/monetization/analytics', (req, res) => {
  costOptimizer.trackDbQuery('admin', 'select');
  
  res.json({
    success: true,
    analytics: monetizationService.getRevenueAnalytics(),
    topProducts: monetizationService.getTopProducts(),
    revenueByType: monetizationService.getRevenueByType()
  });
});

// Promotion code validation
app.post('/api/validate-promotion', async (req, res) => {
  try {
    const { code } = req.body;
    const userId = req.headers['x-user-id'] || 'player123';
    
    const validation = await monetizationService.validatePromotionCode(code, userId);
    
    res.json({
      success: validation.valid,
      ...validation
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Serve React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/build/index.html'));
});

// Start server with cost monitoring
app.listen(PORT, () => {
  console.log(`🎮 Team Iran vs USA Game Server running on port ${PORT}`);
  console.log(`🌐 Game available at: http://localhost:${PORT}`);
  console.log(`📊 API available at: http://localhost:${PORT}/api`);
  console.log(`💰 Monetization endpoints available`);
  console.log(`📈 Cost optimization active`);
  
  // Start daily reporting
  setInterval(() => {
    const report = costOptimizer.generateDailyReport();
    console.log(`📊 Daily Report:`, {
      revenue: `$${report.revenue.daily}`,
      users: report.usage.activeUsers,
      profitMargin: `${report.costs.profitMargin.toFixed(1)}%`
    });
  }, 24 * 60 * 60 * 1000); // Daily
});

module.exports = app;
