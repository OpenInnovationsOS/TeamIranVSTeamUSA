require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const compression = require('compression');

// Import admin monetization service
const adminMonetizationService = require('./services/adminMonetization');

// Import smart strategy components
const costOptimizer = require('./utils/cost-optimizer');
const monetizationService = require('./services/monetization');

const app = express();
const PORT = process.env.PORT || 3000;

// Rate limiting for tap endpoints
const tapRateLimit = new Map(); // userId -> {count, lastReset}

const rateLimitTap = (req, res, next) => {
  const userId = req.headers['x-user-id'] || 'anonymous';
  const now = Date.now();
  const userLimit = tapRateLimit.get(userId);
  
  // Reset if more than 1 minute has passed
  if (!userLimit || now - userLimit.lastReset > 60000) {
    tapRateLimit.set(userId, {
      count: 1,
      lastReset: now
    });
    return next();
  }
  
  // Check if exceeded limit
  if (userLimit.count >= adminConfig.tap_rate_limit) {
    return res.status(429).json({
      success: false,
      error: 'Rate limit exceeded',
      message: `Too many taps. Maximum ${adminConfig.tap_rate_limit} taps per minute.`,
      retryAfter: Math.ceil((60000 - (now - userLimit.lastReset)) / 1000)
    });
  }
  
  // Increment count
  userLimit.count++;
  next();
};

// Comprehensive error handling middleware
const errorHandler = (err, req, res, next) => {
  console.error('🚨 ERROR:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    userId: req.headers['x-user-id'],
    timestamp: new Date().toISOString()
  });
  
  // Don't send error details in production
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  // Handle specific error types
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      message: 'Invalid input data',
      details: isDevelopment ? err.details : undefined
    });
  }
  
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized',
      message: 'Authentication required'
    });
  }
  
  if (err.name === 'ForbiddenError') {
    return res.status(403).json({
      success: false,
      error: 'Forbidden',
      message: 'Access denied'
    });
  }
  
  if (err.name === 'NotFoundError') {
    return res.status(404).json({
      success: false,
      error: 'Not Found',
      message: 'Resource not found'
    });
  }
  
  // Default error response
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    error: isDevelopment ? err.name : 'Internal Server Error',
    message: statusCode === 500 ? 'Something went wrong' : err.message,
    details: isDevelopment ? err.stack : undefined,
    timestamp: new Date().toISOString()
  });
};

// 404 handler
const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Not Found',
    message: `Route ${req.method} ${req.url} not found`,
    availableRoutes: [
      'GET /api/config',
      'GET /api/stats',
      'POST /api/register',
      'GET /api/leaderboard',
      'GET /api/territories',
      'POST /api/battle',
      'GET /api/tournaments',
      'GET /api/marketplace',
      'GET /api/staking/pools',
      'GET /api/user/profile'
    ]
  });
};

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

// Admin Monetization Analytics Endpoints - MUST be before static file serving
app.get('/api/admin/monetization/overview', (req, res) => {
  costOptimizer.trackDbQuery('admin', 'select');
  
  try {
    const report = adminMonetizationService.getComprehensiveReport();
    
    res.json({
      success: true,
      data: {
        summary: report.summary,
        categories: report.categories,
        growthMetrics: report.growthMetrics,
        projections: report.projections,
        lastUpdated: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Admin monetization overview error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load monetization overview'
    });
  }
});

app.get('/api/admin/monetization/category/:category', (req, res) => {
  costOptimizer.trackDbQuery('admin', 'select');
  
  try {
    const { category } = req.params;
    const topPerformers = adminMonetizationService.getTopPerformers(category, 10);
    
    res.json({
      success: true,
      data: {
        category,
        topPerformers,
        totalRevenue: adminMonetizationService.incomeStreams[category]?.totalRevenue || 0,
        transactionCount: adminMonetizationService.incomeStreams[category]?.transactions?.length || 0
      }
    });
  } catch (error) {
    console.error('Admin monetization category error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load category data'
    });
  }
});

app.get('/api/admin/monetization/daily-revenue', (req, res) => {
  costOptimizer.trackDbQuery('admin', 'select');
  
  try {
    const days = parseInt(req.query.days) || 30;
    const dailyRevenue = adminMonetizationService.getDailyRevenue(days);
    
    res.json({
      success: true,
      data: {
        dailyRevenue,
        period: `${days} days`,
        generatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Admin daily revenue error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load daily revenue data'
    });
  }
});

app.get('/api/admin/monetization/user/:userId', (req, res) => {
  costOptimizer.trackDbQuery('admin', 'select');
  
  try {
    const { userId } = req.params;
    const userSpending = adminMonetizationService.getUserSpendingAnalysis(userId);
    
    res.json({
      success: true,
      data: {
        userId,
        spending: userSpending,
        totalSpent: Object.values(userSpending).reduce((sum, category) => sum + category.totalSpent, 0),
        totalTransactions: Object.values(userSpending).reduce((sum, category) => sum + category.transactionCount, 0)
      }
    });
  } catch (error) {
    console.error('Admin user spending error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load user spending data'
    });
  }
});

// Profile Badges Purchase Endpoint
app.post('/api/admin/monetization/profile-badges/purchase', (req, res) => {
  try {
    costOptimizer.trackDbQuery('monetization', 'insert');
    
    const { badgeType, userId, price } = req.body;
    
    if (!adminMonetizationService.incomeStreams.profileBadges.categories[badgeType]) {
      return res.status(400).json({
        success: false,
        error: 'Invalid badge type'
      });
    }
    
    const transaction = adminMonetizationService.recordProfileBadgeSale(badgeType, userId, price);
    
    res.json({
      success: true,
      data: {
        transaction,
        message: `Profile badge ${badgeType} purchased successfully`
      }
    });
  } catch (error) {
    console.error('Profile badge purchase error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to purchase profile badge'
    });
  }
});

// Tipping Endpoint
app.post('/api/admin/monetization/tipping/send', (req, res) => {
  try {
    costOptimizer.trackDbQuery('monetization', 'insert');
    
    const { source, fromUserId, amount } = req.body;
    
    const transaction = adminMonetizationService.recordTip(source, fromUserId, amount);
    
    res.json({
      success: true,
      data: {
        transaction,
        message: 'Tip sent successfully'
      }
    });
  } catch (error) {
    console.error('Tipping error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send tip'
    });
  }
});

// Gifting Endpoint
app.post('/api/admin/monetization/gifts/send', (req, res) => {
  try {
    costOptimizer.trackDbQuery('monetization', 'insert');
    
    const { giftType, fromUserId, toUserId, price } = req.body;
    
    if (!adminMonetizationService.incomeStreams.gifts.giftTypes[giftType]) {
      return res.status(400).json({
        success: false,
        error: 'Invalid gift type'
      });
    }
    
    const transaction = adminMonetizationService.recordGift(giftType, fromUserId, toUserId, price);
    
    res.json({
      success: true,
      data: {
        transaction,
        message: `Gift ${giftType} sent successfully`
      }
    });
  } catch (error) {
    console.error('Gift sending error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send gift'
    });
  }
});

// Telegram Stars Purchase Endpoint
app.post('/api/admin/monetization/telegram-stars/purchase', (req, res) => {
  try {
    costOptimizer.trackDbQuery('monetization', 'insert');
    
    const { packageId, userId } = req.body;
    
    if (!adminMonetizationService.incomeStreams.telegramStars.packages[packageId]) {
      return res.status(400).json({
        success: false,
        error: 'Invalid stars package'
      });
    }
    
    const transaction = adminMonetizationService.recordTelegramStarsSale(packageId, userId);
    const package = adminMonetizationService.incomeStreams.telegramStars.packages[packageId];
    
    res.json({
      success: true,
      data: {
        transaction,
        message: `${packageData.stars} Telegram Stars purchased successfully`
      }
    });
  } catch (error) {
    console.error('Telegram Stars purchase error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to purchase Telegram Stars'
    });
  }
});

// Telegram Diamonds Purchase Endpoint
app.post('/api/admin/monetization/telegram-diamonds/purchase', (req, res) => {
  try {
    costOptimizer.trackDbQuery('monetization', 'insert');
    
    const { packageId, userId } = req.body;
    
    if (!adminMonetizationService.incomeStreams.telegramDiamonds.packages[packageId]) {
      return res.status(400).json({
        success: false,
        error: 'Invalid diamonds package'
      });
    }
    
    const transaction = adminMonetizationService.recordTelegramDiamondsSale(packageId, userId);
    const package = adminMonetizationService.incomeStreams.telegramDiamonds.packages[packageId];
    
    res.json({
      success: true,
      data: {
        transaction,
        message: `${packageData.diamonds} Telegram Diamonds purchased successfully`
      }
    });
  } catch (error) {
    console.error('Telegram Diamonds purchase error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to purchase Telegram Diamonds'
    });
  }
});

// TON Boosts Purchase Endpoint
app.post('/api/admin/monetization/ton-boosts/purchase', (req, res) => {
  try {
    costOptimizer.trackDbQuery('monetization', 'insert');
    
    const { boostType, userId } = req.body;
    
    if (!adminMonetizationService.incomeStreams.tonBoosts.boostTypes[boostType]) {
      return res.status(400).json({
        success: false,
        error: 'Invalid boost type'
      });
    }
    
    const boost = adminMonetizationService.incomeStreams.tonBoosts.boostTypes[boostType];
    const transaction = adminMonetizationService.recordTonBoostPurchase(boostType, userId, boost.tonPrice);
    
    res.json({
      success: true,
      data: {
        transaction,
        message: `${boostType} boost purchased successfully`,
        boostDetails: boost
      }
    });
  } catch (error) {
    console.error('TON Boost purchase error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to purchase TON boost'
    });
  }
});

// Donations Endpoint
app.post('/api/admin/monetization/donations/contribute', (req, res) => {
  try {
    costOptimizer.trackDbQuery('monetization', 'insert');
    
    const { campaign, userId, amount } = req.body;
    
    if (!adminMonetizationService.incomeStreams.donations.campaigns[campaign]) {
      return res.status(400).json({
        success: false,
        error: 'Invalid donation campaign'
      });
    }
    
    const transaction = adminMonetizationService.recordDonation(campaign, userId, amount);
    
    res.json({
      success: true,
      data: {
        transaction,
        message: `Donation of $${amount} to ${campaign} campaign successful`
      }
    });
  } catch (error) {
    console.error('Donation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process donation'
    });
  }
});

// Get all available products for admin
app.get('/api/admin/monetization/products', (req, res) => {
  try {
    const products = {
      profileBadges: Object.entries(adminMonetizationService.incomeStreams.profileBadges.categories).map(([type, data]) => ({
        type,
        price: data.price,
        description: `${type.charAt(0).toUpperCase() + type.slice(1)} profile badge`
      })),
      gifts: Object.entries(adminMonetizationService.incomeStreams.gifts.giftTypes).map(([type, data]) => ({
        type,
        price: data.price,
        description: `${type.charAt(0).toUpperCase() + type.slice(1)} gift`
      })),
      telegramStars: Object.entries(adminMonetizationService.incomeStreams.telegramStars.packages).map(([id, data]) => ({
        id,
        stars: data.stars,
        stg: data.stg,
        description: `${data.stars} Stars → ${data.stg.toLocaleString()} STG`
      })),
      telegramDiamonds: Object.entries(adminMonetizationService.incomeStreams.telegramDiamonds.packages).map(([id, data]) => ({
        id,
        diamonds: data.diamonds,
        stg: data.stg,
        description: `${data.diamonds} Diamonds → ${data.stg.toLocaleString()} STG`
      })),
      tonBoosts: Object.entries(adminMonetizationService.incomeStreams.tonBoosts.boostTypes).map(([type, data]) => ({
        type,
        tonPrice: data.tonPrice,
        description: `${type} boost - ${data.tonPrice} TON`
      })),
      donationCampaigns: Object.entries(adminMonetizationService.incomeStreams.donations.campaigns).map(([campaign, data]) => ({
        campaign,
        goal: data.goal,
        raised: data.raised,
        description: `Donate to ${campaign} campaign`
      }))
    };
    
    res.json({
      success: true,
      data: products
    });
  } catch (error) {
    console.error('Admin products error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load products'
    });
  }
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
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: '1.0.0'
    }
  });
});

// Test admin route
app.get('/api/admin/test', (req, res) => {
  res.json({
    success: true,
    message: 'Admin routes are working!',
    timestamp: new Date().toISOString()
  });
});

// Stats endpoint for GameDashboard
app.get('/api/stats', async (req, res) => {
  costOptimizer.trackDbQuery('stats', 'select');
  
  const userId = req.headers['x-user-id'] || 'player123';
  
  res.json({
    success: true,
    user: {
      id: userId,
      username: 'Player123',
      faction: 'iran',
      level: 15,
      stg_balance: 12450, // Fixed property name
      stgTokens: 12450,
      energy: 85,
      maxEnergy: 100,
      rank: 247,
      wins: 142,
      losses: 67,
      winRate: 68
    },
    game: {
      total_players: 15234,
      active_battles: 47,
      daily_rewards: 100
    }
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
  
  // Generate comprehensive leaderboard data
  const leaderboardData = [
    { 
      id: 1, 
      rank: 1, 
      username: 'ProGamer', 
      first_name: 'Pro',
      faction: 'usa', 
      stg_balance: 50000, 
      level: 25, 
      wins: 542, 
      losses: 67,
      winRate: 89, 
      experience: 2500,
      premium: true 
    },
    { 
      id: 2, 
      rank: 2, 
      username: 'IranChamp', 
      first_name: 'Iran',
      faction: 'iran', 
      stg_balance: 45000, 
      level: 23, 
      wins: 487, 
      losses: 86,
      winRate: 85, 
      experience: 2300,
      premium: false 
    },
    { 
      id: 3, 
      rank: 3, 
      username: 'BattleKing', 
      first_name: 'Battle',
      faction: 'usa', 
      stg_balance: 40000, 
      level: 22, 
      wins: 423, 
      losses: 93,
      winRate: 82, 
      experience: 2200,
      premium: true 
    },
    { 
      id: 4, 
      rank: 4, 
      username: 'EliteWarrior', 
      first_name: 'Elite',
      faction: 'iran', 
      stg_balance: 35000, 
      level: 21, 
      wins: 380, 
      losses: 95,
      winRate: 80, 
      experience: 2100,
      premium: false 
    },
    { 
      id: 5, 
      rank: 5, 
      username: 'SkilledFighter', 
      first_name: 'Skilled',
      faction: 'usa', 
      stg_balance: 30000, 
      level: 20, 
      wins: 340, 
      losses: 102,
      winRate: 77, 
      experience: 2000,
      premium: false 
    },
    { 
      id: 6, 
      rank: 6, 
      username: 'VeteranPlayer', 
      first_name: 'Veteran',
      faction: 'iran', 
      stg_balance: 25000, 
      level: 19, 
      wins: 298, 
      losses: 112,
      winRate: 73, 
      experience: 1900,
      premium: false 
    },
    { 
      id: 7, 
      rank: 7, 
      username: 'ExperiencedGamer', 
      first_name: 'Experienced',
      faction: 'usa', 
      stg_balance: 20000, 
      level: 18, 
      wins: 256, 
      losses: 124,
      winRate: 67, 
      experience: 1800,
      premium: false 
    },
    { 
      id: 8, 
      rank: 8, 
      username: 'RisingStar', 
      first_name: 'Rising',
      faction: 'iran', 
      stg_balance: 18000, 
      level: 17, 
      wins: 224, 
      losses: 136,
      winRate: 62, 
      experience: 1700,
      premium: false 
    }
  ];
  
  res.json({
    success: true,
    leaderboard: leaderboardData,
    total_players: 1247,
    last_updated: new Date().toISOString()
  });
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

// Real battle calculation system
function calculateBattleOutcome(attacker, defender, territory, attackerWeapon, defenderWeapon) {
  // Base stats from user levels
  let attackPower = (attacker.level || 1) * 10 + (attackerWeapon?.power || 5);
  let defensePower = (defender.level || 1) * 8 + (defenderWeapon?.defense || 3);
  
  // Faction bonuses - Iran has defense advantage, USA has attack advantage
  if (attacker.faction === 'usa') attackPower *= 1.2; // USA gets 20% attack bonus
  if (defender.faction === 'iran') defensePower *= 1.2; // Iran gets 20% defense bonus
  
  // Territory control bonuses
  const territoryBonus = getTerritoryBonus(territory, attacker.faction);
  attackPower += territoryBonus.attack;
  defensePower += territoryBonus.defense;
  
  // Weapon mastery bonuses
  if (attackerWeapon) {
    const factionWeaponBonus = attackerWeapon.faction_bonus?.[attacker.faction] || 1.0;
    attackPower *= factionWeaponBonus;
  }
  
  if (defenderWeapon) {
    const factionWeaponBonus = defenderWeapon.faction_bonus?.[defender.faction] || 1.0;
    defensePower *= factionWeaponBonus;
  }
  
  // Skill factor (small random element, but strategy dominates)
  const skillFactor = 0.85 + Math.random() * 0.3; // 85-115% range
  
  // Final calculations
  const finalAttack = Math.round(attackPower * skillFactor);
  const finalDefense = Math.round(defensePower * skillFactor);
  
  // Critical hit calculation
  const criticalChance = 0.05 + ((attacker.level || 1) * 0.01); // 5% + 1% per level
  const isCritical = Math.random() < criticalChance;
  const criticalMultiplier = isCritical ? 2.0 : 1.0;
  
  const damage = Math.max(1, (finalAttack - finalDefense) * criticalMultiplier);
  
  return {
    winner: finalAttack > finalDefense ? attacker : defender,
    loser: finalAttack > finalDefense ? defender : attacker,
    attack_power: finalAttack,
    defense_power: finalDefense,
    damage: damage,
    critical_hit: isCritical,
    critical_chance: criticalChance,
    skill_factor: skillFactor,
    territory_bonus: territoryBonus,
    experience_gained: Math.max(10, Math.round(damage * 0.5)),
    battle_quality: finalAttack > finalDefense * 1.5 ? 'domination' : 
                    finalAttack > finalDefense * 1.2 ? 'victory' : 
                    finalAttack > finalDefense ? 'win' : 'struggle'
  };
}

// Territory bonus system
function getTerritoryBonus(territoryId, userFaction) {
  const territories = {
    tehran: { controller: 'iran', attack_bonus: 5, defense_bonus: 10, exp_bonus: 1.2 },
    new_york: { controller: 'usa', attack_bonus: 10, defense_bonus: 5, exp_bonus: 1.2 },
    los_angeles: { controller: 'usa', attack_bonus: 8, defense_bonus: 7, exp_bonus: 1.1 },
    isfahan: { controller: 'iran', attack_bonus: 3, defense_bonus: 12, exp_bonus: 1.3 },
    chicago: { controller: 'usa', attack_bonus: 12, defense_bonus: 4, exp_bonus: 1.1 },
    mashhad: { controller: 'iran', attack_bonus: 4, defense_bonus: 11, exp_bonus: 1.2 }
  };
  
  const territory = territories[territoryId] || territories.tehran;
  const controllingFaction = territory.controller;
  
  if (userFaction === controllingFaction) {
    // 50% bonus for controlling your own territory
    return {
      attack: territory.attack_bonus * 1.5,
      defense: territory.defense_bonus * 1.5,
      experience: territory.exp_bonus * 1.3,
      controller: true
    };
  }
  
  return {
    attack: territory.attack_bonus,
    defense: territory.defense_bonus,
    experience: territory.exp_bonus,
    controller: false
  };
}

// Enhanced Weapon System
const weapons = {
  basic_sword: { name: "Basic Sword", power: 10, defense: 5, critical_chance: 0.05, faction_bonus: { iran: 1.2, usa: 1.0 }, tier: 1, cost: 0 },
  advanced_rifle: { name: "Advanced Rifle", power: 15, defense: 3, critical_chance: 0.08, faction_bonus: { iran: 1.0, usa: 1.3 }, tier: 2, cost: 500 },
  battle_axe: { name: "Battle Axe", power: 12, defense: 8, critical_chance: 0.06, faction_bonus: { iran: 1.3, usa: 1.1 }, tier: 2, cost: 400 },
  sniper_rifle: { name: "Sniper Rifle", power: 18, defense: 2, critical_chance: 0.12, faction_bonus: { iran: 1.0, usa: 1.4 }, tier: 3, cost: 1000 },
  shield: { name: "Energy Shield", power: 2, defense: 15, critical_chance: 0.02, faction_bonus: { iran: 1.4, usa: 1.2 }, tier: 2, cost: 600 },
  plasma_cannon: { name: "Plasma Cannon", power: 25, defense: 1, critical_chance: 0.15, faction_bonus: { iran: 1.1, usa: 1.5 }, tier: 4, cost: 2000 },
  quantum_blade: { name: "Quantum Blade", power: 22, defense: 12, critical_chance: 0.10, faction_bonus: { iran: 1.6, usa: 1.2 }, tier: 4, cost: 1800 },
  stealth_dagger: { name: "Stealth Dagger", power: 8, defense: 3, critical_chance: 0.25, faction_bonus: { iran: 1.4, usa: 1.0 }, tier: 3, cost: 1200 },
  heavy_mortar: { name: "Heavy Mortar", power: 30, defense: 0, critical_chance: 0.05, faction_bonus: { iran: 1.0, usa: 1.3 }, tier: 4, cost: 2200 },
  energy_staff: { name: "Energy Staff", power: 14, defense: 10, critical_chance: 0.08, faction_bonus: { iran: 1.5, usa: 1.1 }, tier: 3, cost: 800 }
};

// Enhanced Territory Management System
const territories = {
  tehran: { 
    name: 'Tehran', 
    controller: 'iran', 
    attack_bonus: 5, 
    defense_bonus: 10, 
    exp_bonus: 1.2,
    economic_bonus: 1.1,
    population: 8_693_706,
    strategic_value: 95,
    resource_output: 'oil',
    daily_revenue: 1500,
    defense_level: 8,
    climate: 'arid',
    difficulty: 'medium'
  },
  new_york: { 
    name: 'New York', 
    controller: 'usa', 
    attack_bonus: 10, 
    defense_bonus: 5, 
    exp_bonus: 1.2,
    economic_bonus: 1.3,
    population: 8_336_817,
    strategic_value: 98,
    resource_output: 'finance',
    daily_revenue: 2000,
    defense_level: 9,
    climate: 'temperate',
    difficulty: 'hard'
  },
  los_angeles: { 
    name: 'Los Angeles', 
    controller: 'usa', 
    attack_bonus: 8, 
    defense_bonus: 7, 
    exp_bonus: 1.1,
    economic_bonus: 1.2,
    population: 3_979_576,
    strategic_value: 85,
    resource_output: 'technology',
    daily_revenue: 1200,
    defense_level: 7,
    climate: 'mediterranean',
    difficulty: 'medium'
  },
  isfahan: { 
    name: 'Isfahan', 
    controller: 'iran', 
    attack_bonus: 3, 
    defense_bonus: 12, 
    exp_bonus: 1.3,
    economic_bonus: 1.0,
    population: 1_961_421,
    strategic_value: 75,
    resource_output: 'nuclear',
    daily_revenue: 800,
    defense_level: 6,
    climate: 'arid',
    difficulty: 'medium'
  },
  chicago: { 
    name: 'Chicago', 
    controller: 'usa', 
    attack_bonus: 12, 
    defense_bonus: 4, 
    exp_bonus: 1.1,
    economic_bonus: 1.1,
    population: 2_693_976,
    strategic_value: 80,
    resource_output: 'manufacturing',
    daily_revenue: 1000,
    defense_level: 7,
    climate: 'continental',
    difficulty: 'medium'
  },
  mashhad: { 
    name: 'Mashhad', 
    controller: 'iran', 
    attack_bonus: 4, 
    defense_bonus: 11, 
    exp_bonus: 1.2,
    economic_bonus: 0.9,
    population: 3_001_184,
    strategic_value: 70,
    resource_output: 'agriculture',
    daily_revenue: 600,
    defense_level: 5,
    climate: 'arid',
    difficulty: 'easy'
  },
  london: { 
    name: 'London', 
    controller: 'neutral', 
    attack_bonus: 6, 
    defense_bonus: 6, 
    exp_bonus: 1.0,
    economic_bonus: 1.4,
    population: 9_002_488,
    strategic_value: 88,
    resource_output: 'finance',
    daily_revenue: 1800,
    defense_level: 8,
    climate: 'temperate',
    difficulty: 'hard'
  },
  paris: { 
    name: 'Paris', 
    controller: 'neutral', 
    attack_bonus: 5, 
    defense_bonus: 7, 
    exp_bonus: 1.0,
    economic_bonus: 1.3,
    population: 2_140_526,
    strategic_value: 82,
    resource_output: 'culture',
    daily_revenue: 900,
    defense_level: 6,
    climate: 'temperate',
    difficulty: 'medium'
  },
  moscow: { 
    name: 'Moscow', 
    controller: 'neutral', 
    attack_bonus: 8, 
    defense_bonus: 8, 
    exp_bonus: 1.1,
    economic_bonus: 1.1,
    population: 12_615_882,
    strategic_value: 92,
    resource_output: 'military',
    daily_revenue: 1600,
    defense_level: 9,
    climate: 'continental',
    difficulty: 'hard'
  },
  beijing: { 
    name: 'Beijing', 
    controller: 'neutral', 
    attack_bonus: 9, 
    defense_bonus: 6, 
    exp_bonus: 1.1,
    economic_bonus: 1.2,
    population: 21_540_000,
    strategic_value: 96,
    resource_output: 'technology',
    daily_revenue: 2200,
    defense_level: 10,
    climate: 'temperate',
    difficulty: 'hard'
  },
  dubai: { 
    name: 'Dubai', 
    controller: 'neutral', 
    attack_bonus: 7, 
    defense_bonus: 9, 
    exp_bonus: 1.2,
    economic_bonus: 1.5,
    population: 3_331_420,
    strategic_value: 87,
    resource_output: 'trade',
    daily_revenue: 1900,
    defense_level: 7,
    climate: 'arid',
    difficulty: 'medium'
  },
  singapore: { 
    name: 'Singapore', 
    controller: 'neutral', 
    attack_bonus: 11, 
    defense_bonus: 5, 
    exp_bonus: 1.1,
    economic_bonus: 1.6,
    population: 5_686_116,
    strategic_value: 90,
    resource_output: 'trade',
    daily_revenue: 2100,
    defense_level: 8,
    climate: 'tropical',
    difficulty: 'hard'
  },
  tokyo: { 
    name: 'Tokyo', 
    controller: 'neutral', 
    attack_bonus: 10, 
    defense_bonus: 8, 
    exp_bonus: 1.1,
    economic_bonus: 1.4,
    population: 13_960_236,
    strategic_value: 94,
    resource_output: 'technology',
    daily_revenue: 2300,
    defense_level: 9,
    climate: 'temperate',
    difficulty: 'hard'
  },
  sydney: { 
    name: 'Sydney', 
    controller: 'neutral', 
    attack_bonus: 6, 
    defense_bonus: 7, 
    exp_bonus: 1.0,
    economic_bonus: 1.2,
    population: 5_312_163,
    strategic_value: 78,
    resource_output: 'mining',
    daily_revenue: 1100,
    defense_level: 6,
    climate: 'temperate',
    difficulty: 'medium'
  },
  mumbai: { 
    name: 'Mumbai', 
    controller: 'neutral', 
    attack_bonus: 8, 
    defense_bonus: 6, 
    exp_bonus: 1.1,
    economic_bonus: 1.3,
    population: 20_411_274,
    strategic_value: 86,
    resource_output: 'trade',
    daily_revenue: 1700,
    defense_level: 7,
    climate: 'tropical',
    difficulty: 'medium'
  },
  cairo: { 
    name: 'Cairo', 
    controller: 'neutral', 
    attack_bonus: 5, 
    defense_bonus: 10, 
    exp_bonus: 1.2,
    economic_bonus: 1.0,
    population: 20_484_965,
    strategic_value: 81,
    resource_output: 'culture',
    daily_revenue: 950,
    defense_level: 6,
    climate: 'arid',
    difficulty: 'medium'
  }
};

// Weapon shop endpoints
app.get('/api/weapons', (req, res) => {
  costOptimizer.trackDbQuery('weapons', 'select');
  
  const userFaction = req.headers['x-user-faction'] || 'iran';
  const weaponList = Object.entries(weapons).map(([id, weapon]) => ({
    id,
    ...weapon,
    faction_bonus_multiplier: weapon.faction_bonus[userFaction] || 1.0,
    effective_power: Math.round(weapon.power * (weapon.faction_bonus[userFaction] || 1.0)),
    effective_defense: Math.round(weapon.defense * (weapon.faction_bonus[userFaction] || 1.0)),
    can_afford: true // In real implementation, check user balance
  }));
  
  res.json({
    success: true,
    weapons: weaponList,
    user_faction: userFaction
  });
});

app.post('/api/weapons/:id/purchase', (req, res) => {
  try {
    costOptimizer.trackDbQuery('weapons', 'update');
    
    const weaponId = req.params.id;
    const userId = req.headers['x-user-id'] || 'player123';
    
    const weapon = weapons[weaponId];
    if (!weapon) {
      return res.status(404).json({
        success: false,
        error: 'Weapon not found'
      });
    }
    
    // Check if user can afford (mock check)
    const userBalance = 5000; // Mock balance
    if (userBalance < weapon.cost) {
      return res.status(400).json({
        success: false,
        error: 'Insufficient STG tokens'
      });
    }
    
    // Add weapon to user inventory
    const profile = userProfiles[userId];
    if (profile) {
      if (!profile.equipment.weapons_owned.includes(weaponId)) {
        profile.equipment.weapons_owned.push(weaponId);
        profile.stg_balance -= weapon.cost;
      }
    }
    
    console.log(`⚔️ WEAPON PURCHASED: ${userId} bought ${weapon.name} for ${weapon.cost} STG`);
    
    res.json({
      success: true,
      weapon: {
        id: weaponId,
        ...weapon
      },
      message: `🎉 Successfully purchased ${weapon.name}!`
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Territory control tracking
let territoryControl = {
  iran: ['tehran', 'isfahan', 'mashhad'],
  usa: ['new_york', 'los_angeles', 'chicago'],
  neutral: ['london', 'paris', 'moscow', 'beijing']
};

// Add user tap boosts storage
const userTapBoosts = {};

// Economic System - Marketplace & Staking
const marketplace = {
  items: [],
  transactions: [],
  tap_boost_packages: [
    {
      id: 'tap_basic',
      name: 'Basic Tap Boost',
      description: '2x tap power for 30 minutes',
      duration: 1800, // 30 minutes in seconds
      multiplier: 2,
      ton_price: 0.5, // TON price
      stg_price: 100, // Alternative STG price
      active: true
    },
    {
      id: 'tap_premium',
      name: 'Premium Tap Boost',
      description: '3x tap power for 1 hour',
      duration: 3600, // 1 hour in seconds
      multiplier: 3,
      ton_price: 1.0, // TON price
      stg_price: 200, // Alternative STG price
      active: true
    },
    {
      id: 'tap_ultra',
      name: 'Ultra Tap Boost',
      description: '5x tap power for 2 hours',
      duration: 7200, // 2 hours in seconds
      multiplier: 5,
      ton_price: 2.5, // TON price
      stg_price: 500, // Alternative STG price
      active: true
    }
  ],
  staking_pools: {
    conservative: {
      name: 'Conservative Pool',
      apy: 5.0,
      total_staked: 0,
      stakers: [],
      lock_period: 7 * 24 * 60 * 60 * 1000, // 7 days
      minimum_stake: 100
    },
    aggressive: {
      name: 'Aggressive Pool',
      apy: 12.0,
      total_staked: 0,
      stakers: [],
      lock_period: 30 * 24 * 60 * 60 * 1000, // 30 days
      minimum_stake: 500
    },
    elite: {
      name: 'Elite Pool',
      apy: 25.0,
      total_staked: 0,
      stakers: [],
      lock_period: 90 * 24 * 60 * 60 * 1000, // 90 days
      minimum_stake: 2000
    }
  }
};

// Tap Boost endpoints
app.get('/api/marketplace/tap-boosts', (req, res) => {
  costOptimizer.trackDbQuery('marketplace', 'select');
  
  res.json({
    success: true,
    packages: marketplace.tap_boost_packages.filter(pkg => pkg.active)
  });
});

app.post('/api/marketplace/tap-boosts/:id/purchase', (req, res) => {
  try {
    costOptimizer.trackDbQuery('marketplace', 'update');
    
    const packageId = req.params.id;
    const userId = req.headers['x-user-id'] || 'player123';
    const { payment_method } = req.body; // 'ton' or 'stg'
    
    const package = marketplace.tap_boost_packages.find(pkg => pkg.id === packageId);
    if (!package || !package.active) {
      return res.status(404).json({
        success: false,
        error: 'Package not found or inactive'
      });
    }
    
    const price = payment_method === 'ton' ? package.ton_price : package.stg_price;
    
    // Process payment (mock for TON, real for STG)
    if (payment_method === 'ton') {
      // In production, integrate with TON blockchain
      console.log(`💎 TON PAYMENT: ${userId} purchasing ${package.name} for ${price} TON`);
      console.log(`💰 WALLET: ${adminConfig.ton_wallet_address}`);
    } else {
      // Deduct STG tokens
      const user = userProfiles[userId];
      if (!user || user.stg_balance < price) {
        return res.status(400).json({
          success: false,
          error: 'Insufficient STG balance'
        });
      }
      user.stg_balance -= price;
    }
    
    // Apply tap boost to user
    if (!userTapBoosts[userId]) {
      userTapBoosts[userId] = [];
    }
    
    userTapBoosts[userId].push({
      id: 'boost_' + Date.now(),
      package_id: packageId,
      multiplier: package.multiplier,
      expires_at: Date.now() + (package.duration * 1000),
      active: true
    });
    
    // Record transaction
    marketplace.transactions.push({
      id: 'tx_' + Date.now(),
      buyer_id: userId,
      item_id: packageId,
      item_name: package.name,
      price: price,
      currency: payment_method,
      type: 'tap_boost',
      timestamp: new Date().toISOString()
    });
    
    console.log(`⚡ TAP BOOST: ${userId} purchased ${package.name} with ${payment_method.toUpperCase()}`);
    
    res.json({
      success: true,
      message: `Tap boost activated! ${package.multiplier}x power for ${package.duration/60} minutes`,
      boost: {
        multiplier: package.multiplier,
        duration: package.duration,
        expires_at: Date.now() + (package.duration * 1000)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// User tap boosts endpoint
app.get('/api/user/tap-boosts', (req, res) => {
  const userId = req.headers['x-user-id'] || 'player123';
  const now = Date.now();
  
  // Clean expired boosts
  if (userTapBoosts[userId]) {
    userTapBoosts[userId] = userTapBoosts[userId].filter(boost => boost.expires_at > now);
  }
  
  const activeBoosts = userTapBoosts[userId] || [];
  const currentMultiplier = activeBoosts.length > 0 ? 
    Math.max(...activeBoosts.map(boost => boost.multiplier)) : 1;
  
  res.json({
    success: true,
    active_boosts: activeBoosts,
    current_multiplier: currentMultiplier,
    next_boost_expires: activeBoosts.length > 0 ? 
      Math.min(...activeBoosts.map(boost => boost.expires_at)) : null
  });
});

// Marketplace endpoints
app.get('/api/marketplace', (req, res) => {
  costOptimizer.trackDbQuery('marketplace', 'select');
  
  // Generate marketplace items
  const items = [
    {
      id: 'item_1',
      name: 'Energy Boost',
      type: 'consumable',
      description: 'Increase battle power by 20% for 1 hour',
      price: 200,
      seller: 'system',
      rarity: 'common',
      effect: { power_bonus: 1.2, duration: 3600000 }
    },
    {
      id: 'item_2',
      name: 'Critical Charm',
      type: 'consumable',
      description: 'Increase critical hit chance by 10% for 2 hours',
      price: 350,
      seller: 'system',
      rarity: 'rare',
      effect: { critical_bonus: 1.1, duration: 7200000 }
    },
    {
      id: 'item_3',
      name: 'Territory Shield',
      type: 'consumable',
      description: 'Protect territory from conquest for 12 hours',
      price: 500,
      seller: 'system',
      rarity: 'epic',
      effect: { protection: true, duration: 43200000 }
    },
    {
      id: 'item_4',
      name: 'Experience Elixir',
      type: 'consumable',
      description: 'Double experience gains for 3 hours',
      price: 400,
      seller: 'system',
      rarity: 'rare',
      effect: { exp_bonus: 2.0, duration: 10800000 }
    }
  ];
  
  res.json({
    success: true,
    items: items,
    total_items: items.length
  });
});

app.post('/api/marketplace/:id/buy', (req, res) => {
  try {
    costOptimizer.trackDbQuery('marketplace', 'update');
    
    const itemId = req.params.id;
    const userId = req.headers['x-user-id'] || 'player123';
    
    // Mock item lookup
    const item = {
      id: itemId,
      name: 'Energy Boost',
      price: 200,
      type: 'consumable'
    };
    
    // Check user balance
    const profile = userProfiles[userId];
    if (!profile || profile.stg_balance < item.price) {
      return res.status(400).json({
        success: false,
        error: 'Insufficient STG tokens'
      });
    }
    
    // Process purchase
    profile.stg_balance -= item.price;
    
    // Add to inventory (mock)
    if (!profile.equipment.boosters) {
      profile.equipment.boosters = [];
    }
    profile.equipment.boosters.push({
      id: itemId,
      name: item.name,
      type: item.type,
      purchased_at: new Date().toISOString(),
      uses: item.type === 'consumable' ? 3 : 1
    });
    
    // Record transaction
    marketplace.transactions.push({
      id: 'tx_' + Date.now(),
      buyer_id: userId,
      item_id: itemId,
      price: item.price,
      timestamp: new Date().toISOString()
    });
    
    console.log(`🛒 MARKETPLACE: ${userId} bought ${item.name} for ${item.price} STG`);
    
    res.json({
      success: true,
      item: item,
      new_balance: profile.stg_balance,
      message: `🎉 Successfully purchased ${item.name}!`
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Staking endpoints
app.get('/api/staking/pools', (req, res) => {
  costOptimizer.trackDbQuery('staking', 'select');
  
  const pools = Object.entries(marketplace.staking_pools).map(([id, pool]) => ({
    id,
    ...pool,
      user_staked: pool.stakers.find(s => s.user_id === (req.headers['x-user-id'] || 'player123'))?.amount || 0,
      can_stake: true,
      can_unstake: pool.stakers.find(s => s.user_id === (req.headers['x-user-id'] || 'player123'))?.unlock_time < Date.now()
  }));
  
  res.json({
    success: true,
    pools: pools,
    total_staked: Object.values(marketplace.staking_pools).reduce((sum, pool) => sum + pool.total_staked, 0)
  });
});

app.post('/api/staking/:pool_id/stake', (req, res) => {
  try {
    costOptimizer.trackDbQuery('staking', 'update');
    
    const poolId = req.params.pool_id;
    const { amount } = req.body;
    const userId = req.headers['x-user-id'] || 'player123';
    
    const pool = marketplace.staking_pools[poolId];
    if (!pool) {
      return res.status(404).json({
        success: false,
        error: 'Staking pool not found'
      });
    }
    
    if (amount < pool.minimum_stake) {
      return res.status(400).json({
        success: false,
        error: `Minimum stake is ${pool.minimum_stake} STG`
      });
    }
    
    // Check user balance
    const profile = userProfiles[userId];
    if (!profile || profile.stg_balance < amount) {
      return res.status(400).json({
        success: false,
        error: 'Insufficient STG tokens'
      });
    }
    
    // Process staking
    profile.stg_balance -= amount;
    pool.total_staked += amount;
    
    // Add or update staker record
    const existingStaker = pool.stakers.find(s => s.user_id === userId);
    if (existingStaker) {
      existingStaker.amount += amount;
      existingStaker.unlock_time = Date.now() + pool.lock_period;
    } else {
      pool.stakers.push({
        user_id: userId,
        amount: amount,
        staked_at: Date.now(),
        unlock_time: Date.now() + pool.lock_period,
        last_claimed: Date.now()
      });
    }
    
    console.log(`💰 STAKING: ${userId} staked ${amount} STG in ${pool.name}`);
    
    res.json({
      success: true,
      pool: {
        id: poolId,
        ...pool,
        user_staked: pool.stakers.find(s => s.user_id === userId)?.amount || 0
      },
      message: `💰 Successfully staked ${amount} STG in ${pool.name}!`
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

app.post('/api/staking/:pool_id/unstake', (req, res) => {
  try {
    costOptimizer.trackDbQuery('staking', 'update');
    
    const poolId = req.params.pool_id;
    const userId = req.headers['x-user-id'] || 'player123';
    
    const pool = marketplace.staking_pools[poolId];
    if (!pool) {
      return res.status(404).json({
        success: false,
        error: 'Staking pool not found'
      });
    }
    
    const staker = pool.stakers.find(s => s.user_id === userId);
    if (!staker) {
      return res.status(400).json({
        success: false,
        error: 'No staking position found'
      });
    }
    
    if (staker.unlock_time > Date.now()) {
      return res.status(400).json({
        success: false,
        error: 'Staking position is still locked'
      });
    }
    
    // Calculate rewards
    const stakingDuration = (Date.now() - staker.staked_at) / (365 * 24 * 60 * 60 * 1000); // in years
    const rewards = Math.round(staker.amount * pool.apy * stakingDuration);
    const totalUnstaked = staker.amount + rewards;
    
    // Process unstaking
    const profile = userProfiles[userId];
    if (profile) {
      profile.stg_balance += totalUnstaked;
    }
    
    pool.total_staked -= staker.amount;
    pool.stakers = pool.stakers.filter(s => s.user_id !== userId);
    
    console.log(`💰 UNSTAKING: ${userId} unstaked ${staker.amount} STG + ${rewards} rewards from ${pool.name}`);
    
    res.json({
      success: true,
      amount: staker.amount,
      rewards: rewards,
      total: totalUnstaked,
      new_balance: profile?.stg_balance || 0,
      message: `💰 Successfully unstaked ${totalUnstaked} STG (${rewards} STG rewards)!`
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

app.post('/api/staking/:pool_id/claim', (req, res) => {
  try {
    costOptimizer.trackDbQuery('staking', 'update');
    
    const poolId = req.params.pool_id;
    const userId = req.headers['x-user-id'] || 'player123';
    
    const pool = marketplace.staking_pools[poolId];
    if (!pool) {
      return res.status(404).json({
        success: false,
        error: 'Staking pool not found'
      });
    }
    
    const staker = pool.stakers.find(s => s.user_id === userId);
    if (!staker) {
      return res.status(400).json({
        success: false,
        error: 'No staking position found'
      });
    }
    
    // Calculate rewards since last claim
    const timeSinceLastClaim = Date.now() - staker.last_claimed;
    const stakingDuration = timeSinceLastClaim / (365 * 24 * 60 * 60 * 1000); // in years
    const rewards = Math.round(staker.amount * pool.apy * stakingDuration);
    
    if (rewards < 1) {
      return res.status(400).json({
        success: false,
        error: 'No rewards available to claim'
      });
    }
    
    // Process claim
    const profile = userProfiles[userId];
    if (profile) {
      profile.stg_balance += rewards;
    }
    
    staker.last_claimed = Date.now();
    
    console.log(`💰 CLAIM REWARDS: ${userId} claimed ${rewards} STG from ${pool.name}`);
    
    res.json({
      success: true,
      rewards: rewards,
      new_balance: profile?.stg_balance || 0,
      message: `💰 Successfully claimed ${rewards} STG rewards!`
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Monetization System - Premium Features
const premiumFeatures = {
  battle_pass: {
    name: 'Battle Pass',
    description: 'Unlock exclusive rewards and bonuses',
    price: 9.99,
    duration: 30 * 24 * 60 * 60 * 1000, // 30 days
    benefits: [
      '2x experience gains',
      '10% battle rewards bonus',
      'Exclusive weapons access',
      'Premium missions',
      'Custom profile badge'
    ]
  },
  vip_status: {
    name: 'VIP Status',
    description: 'Premium membership with exclusive perks',
    price: 19.99,
    duration: 30 * 24 * 60 * 60 * 1000, // 30 days
    benefits: [
      '3x experience gains',
      '20% battle rewards bonus',
      'Priority matchmaking',
      'Exclusive territories',
      'Premium chat features',
      'Advanced analytics'
    ]
  },
  starter_pack: {
    name: 'Starter Pack',
    description: 'Perfect for new players',
    price: 4.99,
    duration: null, // one-time purchase
    benefits: [
      '5000 STG tokens',
      'Advanced Rifle weapon',
      '3 Energy Boosts',
      '2 Critical Charms',
      '7 days of Battle Pass'
    ]
  },
  warrior_pack: {
    name: 'Warrior Pack',
    description: 'For experienced players',
    price: 14.99,
    duration: null, // one-time purchase
    benefits: [
      '15000 STG tokens',
      'Plasma Cannon weapon',
      '5 Energy Boosts',
      '3 Critical Charms',
      'Quantum Blade blueprint'
    ]
  },
  energy_boost: {
    name: 'Energy Boost',
    description: 'Increase battle power by 20% for 1 hour',
    price: 0.99,
    duration: 60 * 60 * 1000, // 1 hour
    benefits: [
      '20% battle power increase',
      '10% critical hit chance',
      'Instant activation'
    ]
  },
  critical_boost: {
    name: 'Critical Boost',
    description: 'Double critical hit chance for 2 hours',
    price: 1.99,
    duration: 2 * 60 * 60 * 1000, // 2 hours
    benefits: [
      '2x critical hit chance',
      '15% critical damage',
      'Instant activation'
    ]
  }
};

// User premium subscriptions
const userPremium = {};

// Premium endpoints
app.get('/api/premium/features', (req, res) => {
  costOptimizer.trackDbQuery('premium', 'select');
  
  const features = Object.entries(premiumFeatures).map(([id, feature]) => ({
    id,
    ...feature,
    user_owned: userPremium[req.headers['x-user-id']]?.subscriptions?.includes(id) || false,
    can_purchase: true
  }));
  
  res.json({
    success: true,
    features: features,
    user_premium_status: userPremium[req.headers['x-user-id']]?.status || 'free'
  });
});

app.post('/api/premium/:feature_id/purchase', (req, res) => {
  try {
    costOptimizer.trackDbQuery('premium', 'update');
    
    const featureId = req.params.feature_id;
    const userId = req.headers['x-user-id'] || 'player123';
    
    const feature = premiumFeatures[featureId];
    if (!feature) {
      return res.status(404).json({
        success: false,
        error: 'Feature not found'
      });
    }
    
    // Mock payment processing
    const paymentSuccessful = true; // In real implementation, integrate with payment provider
    
    if (!paymentSuccessful) {
      return res.status(400).json({
        success: false,
        error: 'Payment failed'
      });
    }
    
    // Initialize user premium if not exists
    if (!userPremium[userId]) {
      userPremium[userId] = {
        status: 'free',
        subscriptions: [],
        purchases: [],
        active_boosts: []
      };
    }
    
    const userPremiumData = userPremium[userId];
    
    // Process purchase
    if (feature.duration) {
      // Subscription
      const existingSubscription = userPremiumData.subscriptions.find(s => s.feature_id === featureId);
      if (existingSubscription) {
        existingSubscription.expires_at = Math.max(existingSubscription.expires_at, Date.now()) + feature.duration;
      } else {
        userPremiumData.subscriptions.push({
          feature_id: featureId,
          purchased_at: Date.now(),
          expires_at: Date.now() + feature.duration
        });
      }
      
      // Update status
      if (featureId === 'vip_status') {
        userPremiumData.status = 'vip';
      } else if (featureId === 'battle_pass' && userPremiumData.status === 'free') {
        userPremiumData.status = 'premium';
      }
    } else {
      // One-time purchase
      userPremiumData.purchases.push({
        feature_id: featureId,
        purchased_at: Date.now()
      });
      
      // Apply immediate benefits for consumables
      if (featureId === 'energy_boost' || featureId === 'critical_boost') {
        userPremiumData.active_boosts.push({
          feature_id: featureId,
          activated_at: Date.now(),
          expires_at: Date.now() + feature.duration
        });
      }
    }
    
    console.log(`💎 PREMIUM: ${userId} purchased ${feature.name} for $${feature.price}`);
    
    res.json({
      success: true,
      feature: feature,
      premium_status: userPremiumData.status,
      message: `🎉 Successfully purchased ${feature.name}!`
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

app.get('/api/premium/status', (req, res) => {
  costOptimizer.trackDbQuery('premium', 'select');
  
  const userId = req.headers['x-user-id'] || 'player123';
  const userPremiumData = userPremium[userId] || {
    status: 'free',
    subscriptions: [],
    purchases: [],
    active_boosts: []
  };
  
  // Check for expired subscriptions
  const now = Date.now();
  userPremiumData.subscriptions = userPremiumData.subscriptions.filter(s => s.expires_at > now);
  userPremiumData.active_boosts = userPremiumData.active_boosts.filter(b => b.expires_at > now);
  
  // Update status if no active subscriptions
  if (userPremiumData.subscriptions.length === 0 && userPremiumData.status !== 'free') {
    userPremiumData.status = 'free';
  }
  
  const activeFeatures = userPremiumData.subscriptions.map(s => premiumFeatures[s.feature_id]);
  const activeBoosts = userPremiumData.active_boosts.map(b => ({
    ...premiumFeatures[b.feature_id],
    expires_at: b.expires_at,
    time_remaining: b.expires_at - now
  }));
  
  res.json({
    success: true,
    status: userPremiumData.status,
    active_features: activeFeatures,
    active_boosts: activeBoosts,
    total_spent: userPremiumData.purchases.length,
    benefits: getPremiumBenefits(userPremiumData.status)
  });
});

app.post('/api/premium/boost/:boost_id/activate', (req, res) => {
  try {
    costOptimizer.trackDbQuery('premium', 'update');
    
    const boostId = req.params.boost_id;
    const userId = req.headers['x-user-id'] || 'player123';
    
    const boost = premiumFeatures[boostId];
    if (!boost || !boost.duration) {
      return res.status(404).json({
        success: false,
        error: 'Boost not found'
      });
    }
    
    const userPremiumData = userPremium[userId];
    if (!userPremiumData) {
      return res.status(400).json({
        success: false,
        error: 'User premium data not found'
      });
    }
    
    // Check if user owns the boost
    const ownsBoost = userPremiumData.purchases.some(p => p.feature_id === boostId);
    if (!ownsBoost) {
      return res.status(400).json({
        success: false,
        error: 'You need to purchase this boost first'
      });
    }
    
    // Activate boost
    userPremiumData.active_boosts.push({
      feature_id: boostId,
      activated_at: Date.now(),
      expires_at: Date.now() + boost.duration
    });
    
    console.log(`⚡ BOOST ACTIVATED: ${userId} activated ${boost.name}`);
    
    res.json({
      success: true,
      boost: {
        ...boost,
        expires_at: Date.now() + boost.duration
      },
      message: `⚡ ${boost.name} activated!`
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Helper function to get premium benefits
function getPremiumBenefits(status) {
  switch (status) {
    case 'vip':
      return {
        experience_multiplier: 3.0,
        reward_multiplier: 1.2,
        critical_chance_bonus: 0.15,
        exclusive_access: ['vip_territories', 'premium_weapons', 'advanced_missions']
      };
    case 'premium':
      return {
        experience_multiplier: 2.0,
        reward_multiplier: 1.1,
        critical_chance_bonus: 0.10,
        exclusive_access: ['premium_weapons', 'advanced_missions']
      };
    default:
      return {
        experience_multiplier: 1.0,
        reward_multiplier: 1.0,
        critical_chance_bonus: 0.0,
        exclusive_access: []
      };
  }
}

// Apply premium benefits to battle calculations
function applyPremiumBenefits(userId, battleData) {
  const userPremiumData = userPremium[userId];
  if (!userPremiumData) return battleData;
  
  const benefits = getPremiumBenefits(userPremiumData.status);
  
  // Apply experience multiplier
  battleData.experience = Math.round(battleData.experience * benefits.experience_multiplier);
  
  // Apply reward multiplier
  battleData.reward = Math.round(battleData.reward * benefits.reward_multiplier);
  
  // Apply critical chance bonus
  if (battleData.critical_hit) {
    battleData.damage = Math.round(battleData.damage * (1 + benefits.critical_chance_bonus));
  }
  
  return battleData;
}

// Tournament System - Competitive Events
const tournaments = {
  weekly_brawl: {
    name: 'Weekly Brawl',
    description: 'Intense 3-day battle tournament',
    type: 'elimination',
    duration: 3 * 24 * 60 * 60 * 1000, // 3 days
    entry_fee: 100,
    max_participants: 128,
    current_participants: 0,
    status: 'registration', // registration, active, completed
    prize_pool: 0,
    rewards: {
      1: { stg: 5000, experience: 1000, weapon: 'plasma_cannon' },
      2: { stg: 3000, experience: 750, weapon: 'quantum_blade' },
      3: { stg: 2000, experience: 500, weapon: 'sniper_rifle' },
      4_8: { stg: 1000, experience: 250 },
      9_16: { stg: 500, experience: 100 },
      17_32: { stg: 250, experience: 50 }
    },
    rules: [
      'Single elimination bracket',
      'Best of 3 battles per round',
      'Random weapon assignments',
      'Territory bonuses disabled',
      'No consumables allowed'
    ],
    starts_at: Date.now() + 24 * 60 * 60 * 1000, // starts in 24 hours
    created_at: Date.now()
  },
  faction_war: {
    name: 'Faction War',
    description: 'Epic 7-day faction-based tournament',
    type: 'faction',
    duration: 7 * 24 * 60 * 60 * 1000, // 7 days
    entry_fee: 200,
    max_participants: 500,
    current_participants: 0,
    status: 'registration',
    prize_pool: 0,
    rewards: {
      winning_faction: { stg_per_player: 3000, experience: 800, territory_bonus: 7 },
      mvp: { stg: 10000, experience: 2000, weapon: 'energy_staff' },
      top_contributors: { stg: 2000, experience: 500 }
    },
    rules: [
      'Faction vs Faction competition',
      'Points for battles won',
      'Bonus points for territory control',
      'Daily faction objectives',
      'MVP based on performance'
    ],
    starts_at: Date.now() + 3 * 24 * 60 * 60 * 1000, // starts in 3 days
    created_at: Date.now()
  },
  weekend_championship: {
    name: 'Weekend Championship',
    description: '2-day rapid-fire tournament',
    type: 'round_robin',
    duration: 2 * 24 * 60 * 60 * 1000, // 2 days
    entry_fee: 50,
    max_participants: 64,
    current_participants: 0,
    status: 'registration',
    prize_pool: 0,
    rewards: {
      1: { stg: 2500, experience: 500 },
      2: { stg: 1500, experience: 350 },
      3: { stg: 1000, experience: 250 },
      4_8: { stg: 500, experience: 125 },
      9_16: { stg: 250, experience: 75 }
    },
    rules: [
      'Round robin group stage',
      'Top 2 from each group advance',
      'Single elimination playoffs',
      '15-minute battle rounds',
      'All weapons allowed'
    ],
    starts_at: Date.now() + 5 * 24 * 60 * 60 * 1000, // starts in 5 days
    created_at: Date.now()
  }
};

// Tournament participants and matches
const tournamentParticipants = {};
const tournamentMatches = {};
const tournamentResults = {};

// Tournament endpoints
app.get('/api/tournaments', (req, res) => {
  costOptimizer.trackDbQuery('tournaments', 'select');
  
  const userId = req.headers['x-user-id'] || 'player123';
  const tournamentList = Object.entries(tournaments).map(([id, tournament]) => ({
    id,
    ...tournament,
    user_registered: tournamentParticipants[id]?.includes(userId) || false,
    user_can_register: tournament.status === 'registration' && 
                          tournament.current_participants < tournament.max_participants &&
                          !tournamentParticipants[id]?.includes(userId),
    time_until_start: tournament.starts_at - Date.now(),
    prize_pool_display: tournament.prize_pool > 0 ? `$${(tournament.prize_pool / 100).toFixed(2)}` : 'TBD'
  }));
  
  res.json({
    success: true,
    tournaments: tournamentList,
    total_active: Object.values(tournaments).filter(t => t.status !== 'completed').length
  });
});

app.post('/api/tournaments/:id/register', (req, res) => {
  try {
    costOptimizer.trackDbQuery('tournaments', 'update');
    
    const tournamentId = req.params.id;
    const userId = req.headers['x-user-id'] || 'player123';
    
    const tournament = tournaments[tournamentId];
    if (!tournament) {
      return res.status(404).json({
        success: false,
        error: 'Tournament not found'
      });
    }
    
    if (tournament.status !== 'registration') {
      return res.status(400).json({
        success: false,
        error: 'Tournament registration is closed'
      });
    }
    
    if (tournament.current_participants >= tournament.max_participants) {
      return res.status(400).json({
        success: false,
        error: 'Tournament is full'
      });
    }
    
    if (tournamentParticipants[tournamentId]?.includes(userId)) {
      return res.status(400).json({
        success: false,
        error: 'Already registered for this tournament'
      });
    }
    
    // Check user balance
    const profile = userProfiles[userId];
    if (!profile || profile.stg_balance < tournament.entry_fee) {
      return res.status(400).json({
        success: false,
        error: 'Insufficient STG tokens for entry fee'
      });
    }
    
    // Process registration
    profile.stg_balance -= tournament.entry_fee;
    tournament.current_participants += 1;
    tournament.prize_pool += tournament.entry_fee;
    
    if (!tournamentParticipants[tournamentId]) {
      tournamentParticipants[tournamentId] = [];
    }
    tournamentParticipants[tournamentId].push(userId);
    
    console.log(`🏆 TOURNAMENT: ${userId} registered for ${tournament.name} (${tournament.entry_fee} STG)`);
    
    res.json({
      success: true,
      tournament: {
        ...tournament,
        user_registered: true
      },
      message: `🎉 Successfully registered for ${tournament.name}!`
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

app.get('/api/tournaments/:id', (req, res) => {
  costOptimizer.trackDbQuery('tournaments', 'select');
  
  const tournamentId = req.params.id;
  const tournament = tournaments[tournamentId];
  
  if (!tournament) {
    return res.status(404).json({
      success: false,
      error: 'Tournament not found'
    });
  }
  
  const userId = req.headers['x-user-id'] || 'player123';
  const isRegistered = tournamentParticipants[tournamentId]?.includes(userId) || false;
  
  // Get tournament participants with stats
  const participants = tournamentParticipants[tournamentId]?.map(participantId => {
    const profile = userProfiles[participantId];
    return {
      id: participantId,
      username: profile?.username || 'Unknown',
      faction: profile?.faction || 'neutral',
      level: profile ? calculatePlayerLevel(profile.experience || 0) : 1,
      experience: profile?.experience || 0,
      wins: profile?.stats?.wins || 0,
      win_rate: profile?.stats?.battles_fought ? 
        ((profile.stats.wins || 0) / profile.stats.battles_fought * 100).toFixed(1) : 0
    };
  }) || [];
  
  // Sort participants by level and experience
  participants.sort((a, b) => {
    if (b.level !== a.level) return b.level - a.level;
    return b.experience - a.experience;
  });
  
  // Get matches if tournament is active
  const matches = tournamentMatches[tournamentId] || [];
  
  res.json({
    success: true,
    tournament: {
      ...tournament,
      user_registered: isRegistered,
      participants: participants,
      matches: matches,
      current_round: getCurrentRound(tournamentId),
      total_prize_pool: tournament.prize_pool
    }
  });
});

app.get('/api/tournaments/:id/leaderboard', (req, res) => {
  costOptimizer.trackDbQuery('tournaments', 'select');
  
  const tournamentId = req.params.id;
  const tournament = tournaments[tournamentId];
  
  if (!tournament) {
    return res.status(404).json({
      success: false,
      error: 'Tournament not found'
    });
  }
  
  // Get tournament results or current standings
  if (tournament.status === 'completed') {
    const results = tournamentResults[tournamentId] || [];
    res.json({
      success: true,
      tournament_id: tournamentId,
      status: 'completed',
      results: results,
      total_participants: tournament.current_participants
    });
  } else {
    // Return current participants sorted by performance
    const participants = tournamentParticipants[tournamentId]?.map(participantId => {
      const profile = userProfiles[participantId];
      const userMatches = (tournamentMatches[tournamentId] || [])
        .filter(match => match.attacker_id === participantId || match.defender_id === participantId);
      
      const wins = userMatches.filter(match => 
        (match.attacker_id === participantId && match.result === 'win') ||
        (match.defender_id === participantId && match.result === 'lose')
      ).length;
      
      const losses = userMatches.length - wins;
      
      return {
        id: participantId,
        username: profile?.username || 'Unknown',
        faction: profile?.faction || 'neutral',
        level: profile ? calculatePlayerLevel(profile.experience || 0) : 1,
        wins: wins,
        losses: losses,
        total_matches: userMatches.length,
        win_rate: userMatches.length > 0 ? (wins / userMatches.length * 100).toFixed(1) : 0
      };
    }) || [];
    
    participants.sort((a, b) => {
      if (b.wins !== a.wins) return b.wins - a.wins;
      if (b.win_rate !== a.win_rate) return b.win_rate - a.win_rate;
      return b.level - a.level;
    });
    
    res.json({
      success: true,
      tournament_id: tournamentId,
      status: tournament.status,
      leaderboard: participants,
      total_participants: tournament.current_participants
    });
  }
});

// Helper functions for tournaments
function getCurrentRound(tournamentId) {
  const matches = tournamentMatches[tournamentId] || [];
  const tournament = tournaments[tournamentId];
  
  if (tournament.type === 'elimination') {
    const maxParticipants = tournament.max_participants;
    const currentMatches = matches.filter(m => m.round === (matches.length > 0 ? matches[matches.length - 1].round : 1));
    
    if (matches.length === 0) return 'Round of ' + maxParticipants;
    
    const lastRound = matches[matches.length - 1].round;
    const participantsInRound = maxParticipants / Math.pow(2, lastRound - 1);
    
    if (participantsInRound === 2) return 'Finals';
    if (participantsInRound === 4) return 'Semifinals';
    if (participantsInRound === 8) return 'Quarterfinals';
    
    return 'Round of ' + participantsInRound;
  }
  
  return 'Group Stage';
}

function generateTournamentBracket(tournamentId) {
  const participants = tournamentParticipants[tournamentId] || [];
  const tournament = tournaments[tournamentId];
  
  if (tournament.type === 'elimination') {
    // Generate single elimination bracket
    const bracket = [];
    const shuffled = [...participants].sort(() => Math.random() - 0.5);
    
    for (let i = 0; i < shuffled.length; i += 2) {
      if (i + 1 < shuffled.length) {
        bracket.push({
          id: 'match_' + Date.now() + '_' + i,
          round: 1,
          attacker_id: shuffled[i],
          defender_id: shuffled[i + 1],
          status: 'pending',
          tournament_id: tournamentId
        });
      }
    }
    
    tournamentMatches[tournamentId] = bracket;
  }
}

// Auto-start tournaments when registration closes
function checkTournamentStatus() {
  const now = Date.now();
  
  Object.entries(tournaments).forEach(([id, tournament]) => {
    if (tournament.status === 'registration' && tournament.starts_at <= now) {
      tournament.status = 'active';
      generateTournamentBracket(id);
      console.log(`🏆 TOURNAMENT STARTED: ${tournament.name} with ${tournament.current_participants} participants`);
    }
  });
}

// Check tournament status every minute
setInterval(checkTournamentStatus, 60 * 1000);

// Analytics Dashboard - Admin Panel
const analytics = {
  daily_stats: {},
  user_metrics: {},
  economic_metrics: {},
  battle_metrics: {},
  territory_metrics: {},
  tournament_metrics: {}
};

// Admin configuration
const adminConfig = {
  ton_wallet_address: 'EQDxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', // Default TON wallet
  tap_boost_enabled: true,
  marketplace_enabled: true,
  commission_rate: 0.05, // 5% commission
  // Tap Button Appearance
  tap_button_text: '👆',
  tap_button_size: 80,
  tap_button_color: '#0088cc',
  tap_button_gradient_start: '#0088cc',
  tap_button_gradient_end: '#00a6ff',
  tap_button_border_radius: 50,
  tap_button_shadow: true,
  // Tap Behavior
  base_reward_min: 1,
  base_reward_max: 10,
  reward_notification_frequency: 10,
  tap_rate_limit: 60,
  tap_cooldown_ms: 1000,
  haptic_feedback_enabled: true,
  haptic_feedback_type: 'impact',
  // Visual Effects
  tap_animation_enabled: true,
  tap_animation_type: 'scale',
  reward_popup_enabled: true,
  reward_popup_duration: 2000,
  particle_effects_enabled: true,
  particle_color: '#ffd700',
  // Sound Settings
  tap_sound_enabled: false,
  tap_sound_volume: 0.5,
  tap_sound_type: 'click'
};

// Admin authentication (simple for demo)
const adminKeys = ['admin123', 'superadmin456'];

// Analytics endpoints
app.get('/api/admin/stats', (req, res) => {
  const adminKey = req.headers['x-admin-key'];
  
  if (!adminKeys.includes(adminKey)) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized access'
    });
  }
  
  costOptimizer.trackDbQuery('analytics', 'select');
  
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  
  // Generate comprehensive analytics
  const stats = {
    overview: {
      total_users: Object.keys(userProfiles).length,
      active_users_today: Math.floor(Object.keys(userProfiles).length * 0.7),
      total_battles: Object.keys(userProfiles).reduce((sum, userId) => 
        sum + (userProfiles[userId]?.stats?.battles_fought || 0), 0),
      total_stg_in_circulation: Object.values(userProfiles).reduce((sum, profile) => 
        sum + (profile.stg_balance || 0), 0),
      total_territories_controlled: Object.entries(territories).filter(([id, territory]) => 
        territory.controller !== 'neutral').length,
      active_tournaments: Object.values(tournaments).filter(t => t.status === 'active').length,
      premium_subscribers: Object.values(userPremium).filter(p => p.status !== 'free').length,
      total_guilds: Object.keys(guilds).length
    },
    user_engagement: {
      daily_active_users: Math.floor(Object.keys(userProfiles).length * 0.65),
      weekly_active_users: Math.floor(Object.keys(userProfiles).length * 0.85),
      monthly_active_users: Object.keys(userProfiles).length,
      average_session_duration: 25, // minutes
      retention_rate: 0.78,
      churn_rate: 0.05
    },
    economic_metrics: {
      total_stg_volume: Object.values(userProfiles).reduce((sum, profile) => 
        sum + (profile.stg_balance || 0), 0),
      daily_stg_earned: 15000,
      daily_stg_spent: 12000,
      marketplace_transactions: marketplace.transactions.length,
      staking_total: Object.values(marketplace.staking_pools).reduce((sum, pool) => 
        sum + pool.total_staked, 0),
      premium_revenue: Object.values(userPremium).filter(p => p.status === 'vip').length * 19.99 +
                       Object.values(userPremium).filter(p => p.status === 'premium').length * 9.99
    },
    battle_analytics: {
      battles_today: 450,
      average_wager: 250,
      win_rate_distribution: {
        iran: 0.52,
        usa: 0.48
      },
      popular_weapons: [
        { weapon: 'basic_sword', usage: 35 },
        { weapon: 'advanced_rifle', usage: 28 },
        { weapon: 'sniper_rifle', usage: 18 },
        { weapon: 'battle_axe', usage: 12 },
        { weapon: 'plasma_cannon', usage: 7 }
      ],
      battle_quality_distribution: {
        domination: 15,
        victory: 25,
        win: 40,
        struggle: 20
      }
    },
    territory_analytics: {
      control_distribution: {
        iran: 3,
        usa: 3,
        neutral: 10
      },
      most_contested: 'beijing',
      highest_revenue: 'beijing',
      territory_changes_today: 2,
      average_defense_level: 7.2
    },
    tournament_analytics: {
      active_tournaments: Object.values(tournaments).filter(t => t.status === 'active').length,
      total_participants: Object.values(tournaments).reduce((sum, t) => sum + t.current_participants, 0),
      total_prize_pools: Object.values(tournaments).reduce((sum, t) => sum + t.prize_pool, 0),
      average_participants: Object.values(tournaments).reduce((sum, t) => sum + t.current_participants, 0) / 
                           Object.keys(tournaments).length
    },
    performance_metrics: {
      api_response_time: 45, // ms
      server_uptime: 99.8, // %
      error_rate: 0.02, // %
      concurrent_users: 125,
      memory_usage: 68, // %
      cpu_usage: 42 // %
    }
  };
  
  res.json({
    success: true,
    stats: stats,
    generated_at: new Date().toISOString()
  });
});

app.get('/api/admin/users', (req, res) => {
  const adminKey = req.headers['x-admin-key'];
  
  if (!adminKeys.includes(adminKey)) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized access'
    });
  }
  
  costOptimizer.trackDbQuery('admin', 'select');
  
  const users = Object.entries(userProfiles).map(([id, profile]) => ({
    id,
    username: profile.username,
    faction: profile.faction,
    level: calculatePlayerLevel(profile.experience || 0),
    experience: profile.experience || 0,
    stg_balance: profile.stg_balance || 0,
    stats: profile.stats || {},
    premium_status: userPremium[id]?.status || 'free',
    last_active: profile.last_active,
    created_at: profile.created_at
  }));
  
  users.sort((a, b) => b.level - a.level);
  
  res.json({
    success: true,
    users: users.slice(0, 100), // Limit to 100 for performance
    total_users: users.length
  });
});

app.get('/api/admin/economy', (req, res) => {
  const adminKey = req.headers['x-admin-key'];
  
  if (!adminKeys.includes(adminKey)) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized access'
    });
  }
  
  costOptimizer.trackDbQuery('admin', 'select');
  
  const economy = {
    stg_metrics: {
      total_supply: Object.values(userProfiles).reduce((sum, profile) => sum + (profile.stg_balance || 0), 0),
      total_earned: Object.values(userProfiles).reduce((sum, profile) => sum + (profile.stats?.total_earned || 0), 0),
      total_staked: Object.values(marketplace.staking_pools).reduce((sum, pool) => sum + pool.total_staked, 0),
      circulation_velocity: 2.3,
      inflation_rate: 0.05
    },
    marketplace: {
      total_transactions: marketplace.transactions.length,
      total_volume: marketplace.transactions.reduce((sum, tx) => sum + (tx.price || 0), 0),
      average_transaction_value: marketplace.transactions.length > 0 ? 
        marketplace.transactions.reduce((sum, tx) => sum + (tx.price || 0), 0) / marketplace.transactions.length : 0,
      most_popular_items: ['Energy Boost', 'Critical Charm', 'Experience Elixir']
    },
    staking: {
      total_staked: Object.values(marketplace.staking_pools).reduce((sum, pool) => sum + pool.total_staked, 0),
      total_stakers: Object.values(marketplace.staking_pools).reduce((sum, pool) => sum + pool.stakers.length, 0),
      average_stake_amount: 850,
      pool_distribution: Object.entries(marketplace.staking_pools).map(([id, pool]) => ({
        name: pool.name,
        total_staked: pool.total_staked,
        stakers: pool.stakers.length,
        apy: pool.apy
      }))
    },
    premium: {
      total_subscribers: Object.values(userPremium).filter(p => p.status !== 'free').length,
      vip_subscribers: Object.values(userPremium).filter(p => p.status === 'vip').length,
      premium_subscribers: Object.values(userPremium).filter(p => p.status === 'premium').length,
      monthly_revenue: Object.values(userPremium).filter(p => p.status === 'vip').length * 19.99 +
                     Object.values(userPremium).filter(p => p.status === 'premium').length * 9.99,
      most_popular_features: ['battle_pass', 'vip_status', 'starter_pack']
    }
  };
  
  res.json({
    success: true,
    economy: economy
  });
});

app.get('/api/admin/events', (req, res) => {
  const adminKey = req.headers['x-admin-key'];
  
  if (!adminKeys.includes(adminKey)) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized access'
    });
  }
  
  costOptimizer.trackDbQuery('admin', 'select');
  
  // Generate recent events
  const events = [
    {
      id: 'event_1',
      type: 'battle',
      description: 'Player123 vs Player456 - Player123 won',
      user_id: 'player123',
      timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
      data: { wager: 200, reward: 400 }
    },
    {
      id: 'event_2',
      type: 'territory_conquest',
      description: 'Iran conquered New York',
      user_id: 'player789',
      timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
      data: { territory: 'new_york', previous_controller: 'usa' }
    },
    {
      id: 'event_3',
      type: 'tournament_registration',
      description: 'Player101 registered for Weekly Brawl',
      user_id: 'player101',
      timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      data: { tournament: 'weekly_brawl', entry_fee: 100 }
    },
    {
      id: 'event_4',
      type: 'premium_purchase',
      description: 'Player202 purchased VIP Status',
      user_id: 'player202',
      timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
      data: { feature: 'vip_status', price: 19.99 }
    },
    {
      id: 'event_5',
      type: 'staking',
      description: 'Player303 staked 1000 STG in Aggressive Pool',
      user_id: 'player303',
      timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
      data: { pool: 'aggressive', amount: 1000 }
    }
  ];
  
  res.json({
    success: true,
    events: events,
    total_events: 1000 // Mock total
  });
});

app.post('/api/admin/action/:type', (req, res) => {
  const adminKey = req.headers['x-admin-key'];
  
  if (!adminKeys.includes(adminKey)) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized access'
    });
  }
  
  try {
    const actionType = req.params.type;
    const { target, value } = req.body;
    
    switch (actionType) {
      case 'give_stg':
        const userId = target;
        const amount = parseInt(value);
        
        if (!userProfiles[userId]) {
          return res.status(404).json({
            success: false,
            error: 'User not found'
          });
        }
        
        userProfiles[userId].stg_balance += amount;
        
        console.log(`👑 ADMIN: Gave ${amount} STG to ${userId}`);
        
        res.json({
          success: true,
          message: `Successfully gave ${amount} STG to ${userId}`,
          new_balance: userProfiles[userId].stg_balance
        });
        break;
        
      case 'reset_territory':
        const territoryId = target;
        const newController = value;
        
        if (!territories[territoryId]) {
          return res.status(404).json({
            success: false,
            error: 'Territory not found'
          });
        }
        
        territories[territoryId].controller = newController;
        
        console.log(`👑 ADMIN: Reset ${territoryId} to ${newController} control`);
        
        res.json({
          success: true,
          message: `Successfully reset ${territoryId} to ${newController} control`
        });
        break;
        
      case 'start_tournament':
        const tournamentId = target;
        
        if (!tournaments[tournamentId]) {
          return res.status(404).json({
            success: false,
            error: 'Tournament not found'
          });
        }
        
        tournaments[tournamentId].status = 'active';
        tournaments[tournamentId].starts_at = Date.now();
        generateTournamentBracket(tournamentId);
        
        console.log(`👑 ADMIN: Manually started ${tournamentId}`);
        
        res.json({
          success: true,
          message: `Successfully started ${tournamentId}`
        });
        break;
        
      default:
        res.status(400).json({
          success: false,
          error: 'Unknown action type'
        });
    }
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Daily Missions endpoint
app.get('/api/daily-missions', (req, res) => {
  costOptimizer.trackDbQuery('missions', 'select');
  
  const userId = req.headers['x-user-id'] || 'player123';
  
  // Generate dynamic missions based on user progress
  const missions = [
    {
      id: 1,
      title: 'Tap Master',
      description: 'Perform 100 taps to earn STG tokens',
      mission_type: 'taps',
      target_value: 100,
      stg_reward: 500,
      win_reward: 10,
      current_progress: Math.floor(Math.random() * 100),
      is_completed: false,
      claimed: false,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 2,
      title: 'Battle Winner',
      description: 'Win 5 PvP battles against other players',
      mission_type: 'pvp_wins',
      target_value: 5,
      stg_reward: 1000,
      win_reward: 25,
      current_progress: Math.floor(Math.random() * 5),
      is_completed: false,
      claimed: false,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 3,
      title: 'Faction Loyalist',
      description: 'Earn 1000 STG for your faction through gameplay',
      mission_type: 'stg_earned',
      target_value: 1000,
      stg_reward: 750,
      win_reward: 15,
      current_progress: Math.floor(Math.random() * 1000),
      is_completed: false,
      claimed: false,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 4,
      title: 'Social Butterfly',
      description: 'Share your achievements 3 times on social media',
      mission_type: 'social_shares',
      target_value: 3,
      stg_reward: 300,
      win_reward: 5,
      current_progress: Math.floor(Math.random() * 3),
      is_completed: false,
      claimed: false,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 5,
      title: 'Territory Conqueror',
      description: 'Participate in 10 territory control battles',
      mission_type: 'territory_battles',
      target_value: 10,
      stg_reward: 800,
      win_reward: 20,
      current_progress: Math.floor(Math.random() * 10),
      is_completed: false,
      claimed: false,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    }
  ];
  
  res.json({
    success: true,
    missions: missions,
    user_stats: {
      total_completed: 12,
      total_rewards: 8500,
      streak_days: 3
    },
    refreshes_in: '23h 45m 12s'
  });
});

app.post('/api/daily-missions/:missionId/claim', (req, res) => {
  try {
    costOptimizer.trackDbQuery('missions', 'update');
    
    const missionId = parseInt(req.params.missionId);
    const userId = req.headers['x-user-id'] || 'player123';
    
    // Mock mission claim logic
    const mission = {
      id: missionId,
      stg_reward: 500,
      win_reward: 10
    };
    
    res.json({
      success: true,
      message: `Successfully claimed ${mission.stg_reward} STG and ${mission.win_reward} wins!`,
      rewards: {
        stg: mission.stg_reward,
        wins: mission.win_reward
      },
      new_balance: 12500 // Mock new balance
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Territory endpoints
app.get('/api/territories', (req, res) => {
  costOptimizer.trackDbQuery('territories', 'select');
  
  const territoryData = Object.entries(territories).map(([id, territory]) => ({
    id,
    ...territory,
    control_score: Math.floor(Math.random() * 1000) + 500,
    conflict_level: Math.random() > 0.7 ? 'high' : Math.random() > 0.4 ? 'medium' : 'low',
    last_battle: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
    available_for_attack: territory.controller !== 'neutral'
  }));
  
  res.json({
    success: true,
    territories: territoryData,
    global_control: {
      iran: territoryControl.iran.length,
      usa: territoryControl.usa.length,
      neutral: territoryControl.neutral.length
    }
  });
});

app.post('/api/territory/attack', async (req, res) => {
  try {
    costOptimizer.trackDbQuery('territories', 'update');
    
    const { territory_id, attack_force, weapon_id } = req.body;
    const userId = req.headers['x-user-id'] || 'player123';
    
    const territory = territories[territory_id];
    if (!territory) {
      return res.status(400).json({
        success: false,
        error: 'Territory not found'
      });
    }
    
    // Calculate attack success
    const baseAttackPower = attack_force || 100;
    const defensePower = territory.defense_level * 10;
    const randomFactor = 0.8 + Math.random() * 0.4;
    
    const finalAttack = Math.round(baseAttackPower * randomFactor);
    const success = finalAttack > defensePower;
    
    if (success) {
      // Territory changes control
      const attackerFaction = Math.random() > 0.5 ? 'iran' : 'usa';
      const previousController = territory.controller;
      
      // Update territory control
      territory.controller = attackerFaction;
      
      // Update control tracking
      Object.keys(territoryControl).forEach(faction => {
        territoryControl[faction] = territoryControl[faction].filter(id => id !== territory_id);
      });
      
      if (!territoryControl[attackerFaction]) {
        territoryControl[attackerFaction] = [];
      }
      territoryControl[attackerFaction].push(territory_id);
      
      // Calculate rewards
      const reward = Math.round(territory.daily_revenue * (0.5 + Math.random() * 0.5));
      const experience = Math.round(territory.strategic_value * 2);
      
      console.log(`🏁 TERRITORY CONQUERED: ${territory.name} by ${attackerFaction} from ${previousController}`);
      
      res.json({
        success: true,
        conquered: true,
        territory: {
          ...territory,
          new_controller: attackerFaction,
          previous_controller: previousController
        },
        rewards: {
          stg_tokens: reward,
          experience: experience,
          faction_bonus: attackerFaction === 'iran' ? 'defense' : 'attack'
        },
        message: `🏁 ${territory.name} conquered by ${attackerFaction.toUpperCase()}! +${reward} STG +${experience} XP`
      });
    } else {
      res.json({
        success: true,
        conquered: false,
        territory: territory,
        damage: Math.round(finalAttack * 0.1),
        message: `❌ Attack on ${territory.name} failed! Defense too strong.`
      });
    }
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

app.get('/api/territory/:id', (req, res) => {
  costOptimizer.trackDbQuery('territories', 'select');
  
  const territoryId = req.params.id;
  const territory = territories[territoryId];
  
  if (!territory) {
    return res.status(404).json({
      success: false,
      error: 'Territory not found'
    });
  }
  
  // Generate detailed territory information
  const territoryDetails = {
    ...territory,
    id: territoryId,
    current_battles: Math.floor(Math.random() * 5),
    recent_history: [
      {
        timestamp: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString(),
        event: 'battle',
        attacker: 'Player' + Math.floor(Math.random() * 1000),
        defender: 'Player' + Math.floor(Math.random() * 1000),
        result: Math.random() > 0.5 ? 'victory' : 'defeat'
      }
    ],
    economic_status: {
      daily_income: territory.daily_revenue,
      weekly_trend: Math.random() > 0.5 ? 'up' : 'down',
      efficiency: 0.8 + Math.random() * 0.2
    },
    military_status: {
      defense_strength: territory.defense_level * 10,
      troop_count: Math.floor(Math.random() * 10000) + 5000,
      readiness: 0.7 + Math.random() * 0.3
    }
  };
  
  res.json({
    success: true,
    territory: territoryDetails
  });
});
// Daily Missions System
const missionTemplates = {
  daily_battles: {
    name: 'Daily Battles',
    description: 'Win 3 battles today',
    type: 'battles',
    target: 3,
    reward_stg: 500,
    reward_exp: 100,
    difficulty: 'easy'
  },
  territory_conquest: {
    name: 'Territory Conquest',
    description: 'Conquer 1 territory',
    type: 'territory',
    target: 1,
    reward_stg: 1000,
    reward_exp: 200,
    difficulty: 'medium'
  },
  token_collector: {
    name: 'Token Collector',
    description: 'Earn 2000 STG tokens',
    type: 'tokens',
    target: 2000,
    reward_stg: 300,
    reward_exp: 150,
    difficulty: 'easy'
  },
  faction_warrior: {
    name: 'Faction Warrior',
    description: 'Win 5 battles against opposing faction',
    type: 'faction_battles',
    target: 5,
    reward_stg: 800,
    reward_exp: 250,
    difficulty: 'medium'
  },
  critical_master: {
    name: 'Critical Master',
    description: 'Land 3 critical hits',
    type: 'critical_hits',
    target: 3,
    reward_stg: 600,
    reward_exp: 180,
    difficulty: 'hard'
  },
  territory_defender: {
    name: 'Territory Defender',
    description: 'Defend your faction territory 2 times',
    type: 'defense',
    target: 2,
    reward_stg: 700,
    reward_exp: 200,
    difficulty: 'medium'
  },
  high_roller: {
    name: 'High Roller',
    description: 'Win a battle with 500+ STG wager',
    type: 'high_wager',
    target: 1,
    reward_stg: 1200,
    reward_exp: 300,
    difficulty: 'hard'
  },
  streak_master: {
    name: 'Streak Master',
    description: 'Win 3 battles in a row',
    type: 'streak',
    target: 3,
    reward_stg: 900,
    reward_exp: 220,
    difficulty: 'hard'
  }
};

// User mission progress tracking
let userMissions = {};

// Mission endpoints
app.get('/api/missions', (req, res) => {
  costOptimizer.trackDbQuery('missions', 'select');
  
  const userId = req.headers['x-user-id'] || 'player123';
  
  // Initialize user missions if not exists
  if (!userMissions[userId]) {
    userMissions[userId] = generateDailyMissions(userId);
  }
  
  const missions = userMissions[userId].map(mission => ({
    ...mission,
    progress: calculateMissionProgress(userId, mission),
    completed: isMissionCompleted(userId, mission)
  }));
  
  res.json({
    success: true,
    missions: missions,
    daily_reset_in: getTimeUntilReset(),
    total_completed: missions.filter(m => isMissionCompleted(userId, m)).length,
    available_rewards: missions.filter(m => isMissionCompleted(userId, m) && !m.claimed).length
  });
});

app.post('/api/missions/:id/claim', (req, res) => {
  try {
    costOptimizer.trackDbQuery('missions', 'update');
    
    const userId = req.headers['x-user-id'] || 'player123';
    const missionId = req.params.id;
    
    if (!userMissions[userId]) {
      return res.status(400).json({
        success: false,
        error: 'No missions available'
      });
    }
    
    const mission = userMissions[userId].find(m => m.id === missionId);
    if (!mission) {
      return res.status(404).json({
        success: false,
        error: 'Mission not found'
      });
    }
    
    if (!isMissionCompleted(userId, mission)) {
      return res.status(400).json({
        success: false,
        error: 'Mission not completed'
      });
    }
    
    if (mission.claimed) {
      return res.status(400).json({
        success: false,
        error: 'Reward already claimed'
      });
    }
    
    // Mark as claimed
    mission.claimed = true;
    mission.claimed_at = new Date().toISOString();
    
    console.log(`🎯 MISSION COMPLETED: ${mission.name} by ${userId} - +${mission.reward_stg} STG +${mission.reward_exp} XP`);
    
    res.json({
      success: true,
      mission: mission,
      rewards: {
        stg_tokens: mission.reward_stg,
        experience: mission.reward_exp
      },
      message: `🎯 Mission "${mission.name}" completed! +${mission.reward_stg} STG +${mission.reward_exp} XP`
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

app.post('/api/missions/progress', (req, res) => {
  try {
    costOptimizer.trackDbQuery('missions', 'update');
    
    const userId = req.headers['x-user-id'] || 'player123';
    const { mission_type, progress_data } = req.body;
    
    if (!userMissions[userId]) {
      userMissions[userId] = generateDailyMissions(userId);
    }
    
    // Update relevant missions
    const updatedMissions = userMissions[userId].map(mission => {
      if (mission.type === mission_type) {
        mission.progress = (mission.progress || 0) + (progress_data.amount || 1);
        mission.last_updated = new Date().toISOString();
      }
      return mission;
    });
    
    userMissions[userId] = updatedMissions;
    
    res.json({
      success: true,
      updated_missions: updatedMissions.filter(m => m.type === mission_type),
      message: `Progress updated for ${mission_type} missions`
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Helper functions
function generateDailyMissions(userId) {
  const missionTypes = Object.keys(missionTemplates);
  const dailyMissionCount = 5;
  const selectedMissions = [];
  
  // Select random missions for the day
  while (selectedMissions.length < dailyMissionCount) {
    const randomType = missionTypes[Math.floor(Math.random() * missionTypes.length)];
    const template = missionTemplates[randomType];
    
    if (!selectedMissions.find(m => m.type === randomType)) {
      selectedMissions.push({
        id: `mission_${Date.now()}_${selectedMissions.length}`,
        ...template,
        progress: 0,
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        claimed: false
      });
    }
  }
  
  return selectedMissions;
}

function calculateMissionProgress(userId, mission) {
  // In real implementation, this would query actual game data
  // For now, return current progress
  return mission.progress || 0;
}

function isMissionCompleted(userId, mission) {
  return (mission.progress || 0) >= mission.target;
}

function getTimeUntilReset() {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  
  const msUntilReset = tomorrow - now;
  const hours = Math.floor(msUntilReset / (1000 * 60 * 60));
  const minutes = Math.floor((msUntilReset % (1000 * 60 * 60)) / (1000 * 60));
  
  return `${hours}h ${minutes}m`;
}

// Profile System
const userProfiles = {};

// Profile endpoints
app.get('/api/profile', (req, res) => {
  costOptimizer.trackDbQuery('profiles', 'select');
  
  const userId = req.headers['x-user-id'] || 'player123';
  
  // Initialize user profile if not exists
  if (!userProfiles[userId]) {
    userProfiles[userId] = generateUserProfile(userId);
  }
  
  const profile = userProfiles[userId];
  
  // Calculate dynamic stats
  const totalBattles = (profile.stats.wins || 0) + (profile.stats.losses || 0);
  const winRate = totalBattles > 0 ? ((profile.stats.wins || 0) / totalBattles * 100).toFixed(1) : 0;
  
  res.json({
    success: true,
    profile: {
      ...profile,
      stats: {
        ...profile.stats,
        total_battles: totalBattles,
        win_rate: parseFloat(winRate),
        rank: calculatePlayerRank(profile),
        level: calculatePlayerLevel(profile.experience || 0)
      },
      achievements: calculateAchievements(profile),
      recent_activity: getRecentActivity(userId),
      social_stats: getSocialStats(userId)
    }
  });
});

app.post('/api/profile/update', (req, res) => {
  try {
    costOptimizer.trackDbQuery('profiles', 'update');
    
    const userId = req.headers['x-user-id'] || 'player123';
    const updates = req.body;
    
    if (!userProfiles[userId]) {
      userProfiles[userId] = generateUserProfile(userId);
    }
    
    // Update allowed fields
    const allowedFields = ['display_name', 'bio', 'favorite_weapon', 'preferred_territory', 'public_profile'];
    const profile = userProfiles[userId];
    
    allowedFields.forEach(field => {
      if (updates[field] !== undefined) {
        profile[field] = updates[field];
      }
    });
    
    profile.updated_at = new Date().toISOString();
    
    res.json({
      success: true,
      profile: profile,
      message: 'Profile updated successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

app.get('/api/profile/achievements', (req, res) => {
  costOptimizer.trackDbQuery('profiles', 'select');
  
  const userId = req.headers['x-user-id'] || 'player123';
  
  if (!userProfiles[userId]) {
    userProfiles[userId] = generateUserProfile(userId);
  }
  
  const achievements = calculateAchievements(userProfiles[userId]);
  
  res.json({
    success: true,
    achievements: achievements,
    total_achievements: achievements.length,
    completed_achievements: achievements.filter(a => a.completed).length,
    completion_percentage: Math.round((achievements.filter(a => a.completed).length / achievements.length) * 100)
  });
});

app.get('/api/profile/stats', (req, res) => {
  costOptimizer.trackDbQuery('profiles', 'select');
  
  const userId = req.headers['x-user-id'] || 'player123';
  
  if (!userProfiles[userId]) {
    userProfiles[userId] = generateUserProfile(userId);
  }
  
  const profile = userProfiles[userId];
  const stats = calculateDetailedStats(profile);
  
  res.json({
    success: true,
    stats: stats,
    global_ranking: getGlobalRanking(userId),
    faction_ranking: getFactionRanking(userId, profile.faction)
  });
});

// Profile helper functions
function generateUserProfile(userId) {
  return {
    id: userId,
    username: 'Player' + Math.floor(Math.random() * 10000),
    display_name: null,
    bio: null,
    faction: Math.random() > 0.5 ? 'iran' : 'usa',
    level: 1,
    experience: 0,
    stg_balance: 1000 + Math.floor(Math.random() * 5000),
    win_claimable: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    last_active: new Date().toISOString(),
    favorite_weapon: null,
    preferred_territory: null,
    public_profile: true,
    stats: {
      wins: 0,
      losses: 0,
      battles_fought: 0,
      territories_conquered: 0,
      critical_hits: 0,
      highest_wager: 0,
      total_earned: 0,
      missions_completed: 0,
      streak_best: 0,
      faction_contributions: 0
    },
    equipment: {
      weapons_owned: ['basic_sword'],
      current_weapon: 'basic_sword',
      armor_level: 1,
      boosters: []
    },
    social: {
      friends: [],
      faction_mates: [],
      rivals: [],
      reputation: 50
    }
  };
}

function calculatePlayerRank(profile) {
  const totalBattles = (profile.stats.wins || 0) + (profile.stats.losses || 0);
  const experience = profile.experience || 0;
  const contributions = profile.stats.faction_contributions || 0;
  
  const battleScore = totalBattles * 10;
  const winScore = (profile.stats.wins || 0) * 25;
  const experienceScore = experience * 0.5;
  const contributionScore = contributions * 15;
  
  const totalScore = battleScore + winScore + experienceScore + contributionScore;
  
  if (totalScore >= 10000) return 'Legend';
  if (totalScore >= 5000) return 'Master';
  if (totalScore >= 2500) return 'Elite';
  if (totalScore >= 1000) return 'Veteran';
  if (totalScore >= 500) return 'Expert';
  if (totalScore >= 200) return 'Skilled';
  if (totalScore >= 50) return 'Apprentice';
  return 'Novice';
}

function calculatePlayerLevel(experience) {
  let level = 1;
  let requiredXP = 100;
  
  while (experience >= requiredXP) {
    experience -= requiredXP;
    level++;
    requiredXP = Math.floor(requiredXP * 1.2);
  }
  
  return level;
}

function calculateAchievements(profile) {
  const achievements = [
    {
      id: 'first_battle',
      name: 'First Battle',
      description: 'Complete your first battle',
      completed: (profile.stats.battles_fought || 0) >= 1,
      reward: '100 STG',
      icon: '⚔️'
    },
    {
      id: 'first_win',
      name: 'First Victory',
      description: 'Win your first battle',
      completed: (profile.stats.wins || 0) >= 1,
      reward: '200 STG',
      icon: '🏆'
    },
    {
      id: 'battle_veteran',
      name: 'Battle Veteran',
      description: 'Fight 50 battles',
      completed: (profile.stats.battles_fought || 0) >= 50,
      reward: '500 STG',
      icon: '🛡️'
    },
    {
      id: 'critical_master',
      name: 'Critical Master',
      description: 'Land 10 critical hits',
      completed: (profile.stats.critical_hits || 0) >= 10,
      reward: '300 STG',
      icon: '⚡'
    },
    {
      id: 'territory_conqueror',
      name: 'Territory Conqueror',
      description: 'Conquer 5 territories',
      completed: (profile.stats.territories_conquered || 0) >= 5,
      reward: '1000 STG',
      icon: '🏁'
    },
    {
      id: 'high_roller',
      name: 'High Roller',
      description: 'Win a battle with 1000+ STG wager',
      completed: (profile.stats.highest_wager || 0) >= 1000,
      reward: '750 STG',
      icon: '💰'
    },
    {
      id: 'streak_master',
      name: 'Streak Master',
      description: 'Win 5 battles in a row',
      completed: (profile.stats.streak_best || 0) >= 5,
      reward: '400 STG',
      icon: '🔥'
    },
    {
      id: 'faction_hero',
      name: 'Faction Hero',
      description: 'Contribute 1000 points to your faction',
      completed: (profile.stats.faction_contributions || 0) >= 1000,
      reward: '800 STG',
      icon: '🎖️'
    },
    {
      id: 'mission_runner',
      name: 'Mission Runner',
      description: 'Complete 25 daily missions',
      completed: (profile.stats.missions_completed || 0) >= 25,
      reward: '600 STG',
      icon: '🎯'
    },
    {
      id: 'wealth_collector',
      name: 'Wealth Collector',
      description: 'Earn 10,000 STG total',
      completed: (profile.stats.total_earned || 0) >= 10000,
      reward: '1200 STG',
      icon: '💎'
    }
  ];
  
  return achievements;
}

function getRecentActivity(userId) {
  return [
    {
      type: 'battle',
      description: 'Won battle against Player123',
      timestamp: new Date(Date.now() - Math.random() * 3600000).toISOString(),
      reward: '+250 STG'
    },
    {
      type: 'mission',
      description: 'Completed "Daily Battles" mission',
      timestamp: new Date(Date.now() - Math.random() * 7200000).toISOString(),
      reward: '+500 STG'
    },
    {
      type: 'territory',
      description: 'Conquered Tehran',
      timestamp: new Date(Date.now() - Math.random() * 86400000).toISOString(),
      reward: '+1500 STG'
    }
  ];
}

function getSocialStats(userId) {
  return {
    friends_count: Math.floor(Math.random() * 50),
    faction_mates_count: Math.floor(Math.random() * 100),
    rivals_count: Math.floor(Math.random() * 10),
    reputation_score: 50 + Math.floor(Math.random() * 50),
    social_ranking: Math.floor(Math.random() * 1000) + 1
  };
}

function calculateDetailedStats(profile) {
  return {
    battle_performance: {
      total_battles: profile.stats.battles_fought || 0,
      wins: profile.stats.wins || 0,
      losses: profile.stats.losses || 0,
      win_rate: ((profile.stats.wins || 0) / Math.max(1, profile.stats.battles_fought || 0) * 100).toFixed(1),
      average_wager: profile.stats.highest_wager ? Math.round(profile.stats.highest_wager * 0.3) : 0,
      critical_hit_rate: profile.stats.critical_hits ? ((profile.stats.critical_hits / Math.max(1, profile.stats.battles_fought || 0)) * 100).toFixed(1) : 0
    },
    economic_performance: {
      total_earned: profile.stats.total_earned || 0,
      current_balance: profile.stg_balance || 0,
      average_earnings_per_battle: profile.stats.battles_fought ? Math.round((profile.stats.total_earned || 0) / profile.stats.battles_fought) : 0,
      highest_single_win: profile.stats.highest_wager ? profile.stats.highest_wager * 2 : 0,
      profit_margin: profile.stats.total_earned && profile.stats.battles_fought ? Math.round(((profile.stats.total_earned - (profile.stats.battles_fought * 100)) / profile.stats.total_earned) * 100) : 0
    },
    progression: {
      current_level: calculatePlayerLevel(profile.experience || 0),
      total_experience: profile.experience || 0,
      experience_to_next_level: calculateXPToNextLevel(profile.experience || 0),
      achievements_unlocked: calculateAchievements(profile).filter(a => a.completed).length,
      missions_completed: profile.stats.missions_completed || 0,
      territories_conquered: profile.stats.territories_conquered || 0
    }
  };
}

function calculateXPToNextLevel(currentXP) {
  let level = 1;
  let requiredXP = 100;
  
  while (currentXP >= requiredXP) {
    currentXP -= requiredXP;
    level++;
    requiredXP = Math.floor(requiredXP * 1.2);
  }
  
  return requiredXP - currentXP;
}

function getGlobalRanking(userId) {
  return {
    rank: Math.floor(Math.random() * 10000) + 1,
    total_players: 50000,
    percentile: Math.floor(Math.random() * 100)
  };
}

function getFactionRanking(userId, faction) {
  return {
    rank: Math.floor(Math.random() * 5000) + 1,
    total_faction_players: 25000,
    percentile: Math.floor(Math.random() * 100)
  };
}

// Guild System
const guilds = {
  iran_elite: {
    name: 'Iran Elite Guard',
    faction: 'iran',
    members: [],
    level: 1,
    experience: 0,
    territories_controlled: [],
    created_at: new Date().toISOString(),
    description: 'Elite warriors defending Iranian sovereignty',
    tag: 'IRG',
    power: 1000
  },
  usa_special_forces: {
    name: 'USA Special Forces',
    faction: 'usa',
    members: [],
    level: 1,
    experience: 0,
    territories_controlled: [],
    created_at: new Date().toISOString(),
    description: 'Special operations forces for freedom',
    tag: 'USF',
    power: 1000
  }
};

// Global leaderboard
const globalLeaderboard = [];
const factionLeaderboards = { iran: [], usa: [] };

// Guild endpoints
app.get('/api/guilds', (req, res) => {
  costOptimizer.trackDbQuery('guilds', 'select');
  
  const userFaction = req.headers['x-user-faction'] || 'iran';
  const availableGuilds = Object.entries(guilds)
    .filter(([id, guild]) => guild.faction === userFaction)
    .map(([id, guild]) => ({
      id,
      ...guild,
      member_count: guild.members.length,
      is_full: guild.members.length >= 50
    }));
  
  res.json({
    success: true,
    guilds: availableGuilds
  });
});

app.post('/api/guilds/:id/join', (req, res) => {
  try {
    costOptimizer.trackDbQuery('guilds', 'update');
    
    const guildId = req.params.id;
    const userId = req.headers['x-user-id'] || 'player123';
    const userFaction = req.headers['x-user-faction'] || 'iran';
    
    const guild = guilds[guildId];
    if (!guild) {
      return res.status(404).json({
        success: false,
        error: 'Guild not found'
      });
    }
    
    if (guild.faction !== userFaction) {
      return res.status(400).json({
        success: false,
        error: 'Cannot join guild of different faction'
      });
    }
    
    if (guild.members.length >= 50) {
      return res.status(400).json({
        success: false,
        error: 'Guild is full'
      });
    }
    
    if (guild.members.includes(userId)) {
      return res.status(400).json({
        success: false,
        error: 'Already a member of this guild'
      });
    }
    
    guild.members.push(userId);
    guild.power += 100;
    
    console.log(`🏰 GUILD JOIN: ${userId} joined ${guild.name}`);
    
    res.json({
      success: true,
      guild: {
        ...guild,
        member_count: guild.members.length
      },
      message: `🎉 Successfully joined ${guild.name}!`
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

app.get('/api/guilds/:id', (req, res) => {
  costOptimizer.trackDbQuery('guilds', 'select');
  
  const guildId = req.params.id;
  const guild = guilds[guildId];
  
  if (!guild) {
    return res.status(404).json({
      success: false,
      error: 'Guild not found'
    });
  }
  
  res.json({
    success: true,
    guild: {
      ...guild,
      member_count: guild.members.length,
      territories_controlled_count: guild.territories_controlled.length,
      rank: calculateGuildRank(guild)
    }
  });
});

// Enhanced Leaderboard endpoints
app.get('/api/leaderboard/global', (req, res) => {
  costOptimizer.trackDbQuery('leaderboard', 'select');
  
  // Generate comprehensive global leaderboard
  const players = Object.entries(userProfiles).map(([id, profile]) => ({
    id,
    username: profile.username,
    faction: profile.faction,
    level: calculatePlayerLevel(profile.experience || 0),
    experience: profile.experience || 0,
    stg_balance: profile.stg_balance || 0,
    wins: profile.stats.wins || 0,
    losses: profile.stats.losses || 0,
    total_battles: profile.stats.battles_fought || 0,
    win_rate: profile.stats.battles_fought ? ((profile.stats.wins || 0) / profile.stats.battles_fought * 100).toFixed(1) : 0,
    territories_conquered: profile.stats.territories_conquered || 0,
    guild_id: Object.entries(guilds).find(([id, guild]) => guild.members.includes(id))?.[0] || null,
    rank: calculatePlayerRank(profile)
  }));
  
  // Sort by level, then experience, then win rate
  players.sort((a, b) => {
    if (b.level !== a.level) return b.level - a.level;
    if (b.experience !== a.experience) return b.experience - a.experience;
    return b.win_rate - a.win_rate;
  });
  
  // Add rank positions
  players.forEach((player, index) => {
    player.global_rank = index + 1;
  });
  
  // Update global leaderboard
  globalLeaderboard.length = 0;
  globalLeaderboard.push(...players.slice(0, 100));
  
  res.json({
    success: true,
    leaderboard: players.slice(0, 50),
    total_players: players.length,
    user_rank: players.find(p => p.id === (req.headers['x-user-id'] || 'player123'))?.global_rank || null
  });
});

app.get('/api/leaderboard/faction/:faction', (req, res) => {
  costOptimizer.trackDbQuery('leaderboard', 'select');
  
  const faction = req.params.faction;
  const userId = req.headers['x-user-id'] || 'player123';
  
  const players = Object.entries(userProfiles)
    .filter(([id, profile]) => profile.faction === faction)
    .map(([id, profile]) => ({
      id,
      username: profile.username,
      level: calculatePlayerLevel(profile.experience || 0),
      experience: profile.experience || 0,
      stg_balance: profile.stg_balance || 0,
      wins: profile.stats.wins || 0,
      losses: profile.stats.losses || 0,
      total_battles: profile.stats.battles_fought || 0,
      win_rate: profile.stats.battles_fought ? ((profile.stats.wins || 0) / profile.stats.battles_fought * 100).toFixed(1) : 0,
      territories_conquered: profile.stats.territories_conquered || 0,
      rank: calculatePlayerRank(profile)
    }));
  
  // Sort by level, then experience
  players.sort((a, b) => {
    if (b.level !== a.level) return b.level - a.level;
    return b.experience - a.experience;
  });
  
  // Add faction rank
  players.forEach((player, index) => {
    player.faction_rank = index + 1;
  });
  
  // Update faction leaderboard
  factionLeaderboards[faction].length = 0;
  factionLeaderboards[faction].push(...players.slice(0, 50));
  
  res.json({
    success: true,
    faction: faction,
    leaderboard: players.slice(0, 25),
    total_faction_players: players.length,
    user_rank: players.find(p => p.id === userId)?.faction_rank || null
  });
});

app.get('/api/leaderboard/guilds', (req, res) => {
  costOptimizer.trackDbQuery('leaderboard', 'select');
  
  const guildLeaderboard = Object.entries(guilds).map(([id, guild]) => ({
    id,
    name: guild.name,
    tag: guild.tag,
    faction: guild.faction,
    level: guild.level,
    experience: guild.experience,
    power: guild.power,
    member_count: guild.members.length,
    territories_controlled: guild.territories_controlled.length,
    average_member_level: calculateGuildAverageLevel(guild),
    created_at: guild.created_at
  }));
  
  // Sort by power, then experience
  guildLeaderboard.sort((a, b) => {
    if (b.power !== a.power) return b.power - a.power;
    return b.experience - a.experience;
  });
  
  // Add guild rank
  guildLeaderboard.forEach((guild, index) => {
    guild.rank = index + 1;
  });
  
  res.json({
    success: true,
    leaderboard: guildLeaderboard,
    total_guilds: guildLeaderboard.length
  });
});

// Helper functions for guilds and leaderboards
function calculateGuildRank(guild) {
  const totalPower = guild.power + (guild.experience * 0.1) + (guild.territories_controlled.length * 500);
  
  if (totalPower >= 10000) return 'Legendary';
  if (totalPower >= 5000) return 'Elite';
  if (totalPower >= 2500) return 'Veteran';
  if (totalPower >= 1000) return 'Skilled';
  if (totalPower >= 500) return 'Apprentice';
  return 'Rookie';
}

function calculateGuildAverageLevel(guild) {
  if (guild.members.length === 0) return 1;
  
  const totalLevel = guild.members.reduce((sum, memberId) => {
    const profile = userProfiles[memberId];
    return sum + (profile ? calculatePlayerLevel(profile.experience || 0) : 1);
  }, 0);
  
  return Math.round(totalLevel / guild.members.length);
}

// Battle execution endpoint
app.post('/api/battle', async (req, res) => {
  try {
    costOptimizer.trackDbQuery('battles', 'insert');
    
    const { opponent_id, wager, weapon_id, territory_id } = req.body;
    const userId = req.headers['x-user-id'] || 'player123';
    
    // Validate wager
    if (wager < 100) {
      return res.status(400).json({
        success: false,
        error: 'Minimum wager is 100 STG'
      });
    }
    
    // Get user data (in production, fetch from database)
    const attacker = {
      id: userId,
      username: 'Player' + Math.floor(Math.random() * 1000),
      level: Math.floor(Math.random() * 20) + 1,
      faction: Math.random() > 0.5 ? 'iran' : 'usa',
      stg_balance: 5000 + Math.floor(Math.random() * 10000)
    };
    
    const defender = {
      id: opponent_id,
      username: 'Opponent' + Math.floor(Math.random() * 1000),
      level: Math.floor(Math.random() * 20) + 1,
      faction: Math.random() > 0.5 ? 'iran' : 'usa',
      stg_balance: 5000 + Math.floor(Math.random() * 10000)
    };
    
    // Get weapons
    const attackerWeapon = weapons[weapon_id] || weapons.basic_sword;
    const defenderWeapon = weapons[Math.random() > 0.5 ? 'advanced_rifle' : 'battle_axe'];
    
    // Get territory
    const territory = territory_id || (Math.random() > 0.5 ? 'tehran' : 'new_york');
    
    // REAL BATTLE CALCULATION
    const battleResult = calculateBattleOutcome(attacker, defender, territory, attackerWeapon, defenderWeapon);
    
    // Calculate rewards based on battle quality
    const baseReward = wager * 2;
    const qualityMultiplier = 
      battleResult.battle_quality === 'domination' ? 1.5 :
      battleResult.battle_quality === 'victory' ? 1.2 :
      battleResult.battle_quality === 'win' ? 1.0 : 0.8;
    
    const finalReward = Math.round(baseReward * qualityMultiplier);
    const experienceGained = Math.round(battleResult.experience_gained * battleResult.territory_bonus.experience);
    
    // Create comprehensive battle record
    const battle = {
      id: 'battle_' + Date.now(),
      attacker_id: attacker.id,
      defender_id: defender.id,
      attacker_faction: attacker.faction,
      defender_faction: defender.faction,
      attacker_weapon: attackerWeapon.name,
      defender_weapon: defenderWeapon.name,
      territory: territory,
      wager: wager,
      result: battleResult.winner.id === attacker.id ? 'win' : 'lose',
      reward: battleResult.winner.id === attacker.id ? finalReward : 0,
      damage_dealt: battleResult.damage,
      critical_hit: battleResult.critical_hit,
      battle_quality: battleResult.battle_quality,
      experience_gained: experienceGained,
      attack_power: battleResult.attack_power,
      defense_power: battleResult.defense_power,
      territory_bonus: battleResult.territory_bonus,
      timestamp: new Date().toISOString(),
      battle_data: {
        skill_factor: battleResult.skill_factor,
        critical_chance: battleResult.critical_chance,
        weapon_advantage: attackerWeapon.power - defenderWeapon.power,
        faction_advantage: (attacker.faction === 'usa' && defender.faction === 'iran') ? 'usa_attack' :
                        (attacker.faction === 'iran' && defender.faction === 'usa') ? 'iran_defense' : 'neutral'
      }
    };
    
    console.log(`🎮 REAL BATTLE EXECUTED:`, {
      attacker: attacker.username,
      defender: defender.username,
      winner: battleResult.winner.username,
      quality: battleResult.battle_quality,
      damage: battleResult.damage,
      critical: battleResult.critical_hit,
      reward: finalReward
    });
    
    res.json({
      success: true,
      result: battleResult.winner.id === attacker.id ? 'win' : 'lose',
      reward: finalReward,
      experience: experienceGained,
      battle: battle,
      message: `${battleResult.winner.id === attacker.id ? '🎉 VICTORY!' : '💀 DEFEAT'} ${battleResult.critical_hit ? '⚡ CRITICAL HIT!' : ''} ${battleResult.winner.id === attacker.id ? `+${finalReward} STG` : ''}`,
      battle_quality: battleResult.battle_quality,
      critical_hit: battleResult.critical_hit,
      territory_controlled: battleResult.territory_bonus.controller
    });
  } catch (error) {
    console.error('Battle calculation error:', error);
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

// User registration endpoint (with rate limiting for taps)
app.post('/api/register', rateLimitTap, async (req, res) => {
  try {
    costOptimizer.trackDbQuery('users', 'insert');
    
    const { username, faction } = req.body;
    const userId = req.headers['x-user-id'] || 'user_' + Date.now();
    
    // Handle tap action specifically
    if (username === 'tap_action' && faction === 'tap') {
      const reward = Math.floor(Math.random() * (adminConfig.base_reward_max - adminConfig.base_reward_min + 1)) + adminConfig.base_reward_min;
      
      return res.json({
        success: true,
        data: {
          reward: reward,
          message: `+${reward} STG earned!`,
          rateLimit: {
            current: tapRateLimit.get(userId)?.count || 1,
            max: adminConfig.tap_rate_limit,
            resetIn: Math.ceil((60000 - (Date.now() - (tapRateLimit.get(userId)?.lastReset || 0))) / 1000)
          }
        },
        message: 'Tap successful!'
      });
    }
    
    // Create user (in production, save to database)
    const user = {
      id: userId,
      username: username || 'Player' + Math.floor(Math.random() * 10000),
      faction: faction || null,
      level: 1,
      stgTokens: 1000,
      energy: 100,
      maxEnergy: 100,
      rank: 0,
      wins: 0,
      losses: 0,
      winRate: 0,
      createdAt: new Date().toISOString()
    };
    
    res.json({
      success: true,
      data: {
        token: 'mock_token_' + Date.now(),
        user: user
      },
      message: 'User registered successfully!'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Users register endpoint (alias)
app.post('/api/users/register', async (req, res) => {
  try {
    costOptimizer.trackDbQuery('users', 'insert');
    
    const { username, faction } = req.body;
    const userId = req.headers['x-user-id'] || 'user_' + Date.now();
    
    // Create user (in production, save to database)
    const user = {
      id: userId,
      username: username || 'Player' + Math.floor(Math.random() * 10000),
      faction: faction || null,
      level: 1,
      stgTokens: 1000,
      energy: 100,
      maxEnergy: 100,
      rank: 0,
      wins: 0,
      losses: 0,
      winRate: 0,
      createdAt: new Date().toISOString()
    };
    
    res.json({
      success: true,
      data: {
        token: 'mock_token_' + Date.now(),
        user: user
      },
      message: 'User registered successfully!'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Faction selection endpoint
app.post('/api/game/faction/select', async (req, res) => {
  try {
    costOptimizer.trackDbQuery('users', 'update');
    
    const { faction } = req.body;
    const userId = req.headers['x-user-id'] || 'player123';
    
    // Validate faction
    if (!['iran', 'usa'].includes(faction)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid faction. Must be either "iran" or "usa"'
      });
    }
    
    // Update user faction (in production, save to database)
    const user = {
      id: userId,
      username: 'Player123',
      faction: faction,
      level: 1,
      stgTokens: 1000,
      energy: 100,
      maxEnergy: 100,
      rank: 0,
      wins: 0,
      losses: 0,
      winRate: 0,
      updatedAt: new Date().toISOString()
    };
    
    res.json({
      success: true,
      user: user,
      message: `Successfully joined Team ${faction.toUpperCase()}!`
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Game status endpoint
app.get('/api/game/status', (req, res) => {
  costOptimizer.trackDbQuery('game', 'select');
  
  res.json({
    success: true,
    status: 'active',
    version: '1.0.0',
    players: {
      total: 15234,
      iran: 7892,
      usa: 7342
    },
    battles: {
      today: 1247,
      total: 45678
    },
    rewards: {
      stg_pool: 5000000,
      daily_bonus: 100
    }
  });
});

// Admin configuration management endpoints
app.get('/api/admin/config', (req, res) => {
  const adminKey = req.headers['x-admin-key'];
  
  if (!adminKeys.includes(adminKey)) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized access'
    });
  }
  
  costOptimizer.trackDbQuery('admin', 'select');
  
  res.json({
    success: true,
    config: adminConfig
  });
});

app.put('/api/admin/config', (req, res) => {
  const adminKey = req.headers['x-admin-key'];
  
  if (!adminKeys.includes(adminKey)) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized access'
    });
  }
  
  try {
    costOptimizer.trackDbQuery('admin', 'update');
    
    // Handle all possible config updates
    const configUpdates = req.body;
    
    // Basic config
    if (configUpdates.ton_wallet_address) adminConfig.ton_wallet_address = configUpdates.ton_wallet_address;
    if (typeof configUpdates.tap_boost_enabled === 'boolean') adminConfig.tap_boost_enabled = configUpdates.tap_boost_enabled;
    if (typeof configUpdates.marketplace_enabled === 'boolean') adminConfig.marketplace_enabled = configUpdates.marketplace_enabled;
    if (typeof configUpdates.commission_rate === 'number') adminConfig.commission_rate = configUpdates.commission_rate;
    
    // Tap Button Appearance
    if (configUpdates.tap_button_text) adminConfig.tap_button_text = configUpdates.tap_button_text;
    if (typeof configUpdates.tap_button_size === 'number') adminConfig.tap_button_size = configUpdates.tap_button_size;
    if (configUpdates.tap_button_color) adminConfig.tap_button_color = configUpdates.tap_button_color;
    if (configUpdates.tap_button_gradient_start) adminConfig.tap_button_gradient_start = configUpdates.tap_button_gradient_start;
    if (configUpdates.tap_button_gradient_end) adminConfig.tap_button_gradient_end = configUpdates.tap_button_gradient_end;
    if (typeof configUpdates.tap_button_border_radius === 'number') adminConfig.tap_button_border_radius = configUpdates.tap_button_border_radius;
    if (typeof configUpdates.tap_button_shadow === 'boolean') adminConfig.tap_button_shadow = configUpdates.tap_button_shadow;
    
    // Tap Behavior
    if (typeof configUpdates.base_reward_min === 'number') adminConfig.base_reward_min = configUpdates.base_reward_min;
    if (typeof configUpdates.base_reward_max === 'number') adminConfig.base_reward_max = configUpdates.base_reward_max;
    if (typeof configUpdates.reward_notification_frequency === 'number') adminConfig.reward_notification_frequency = configUpdates.reward_notification_frequency;
    if (typeof configUpdates.tap_rate_limit === 'number') adminConfig.tap_rate_limit = configUpdates.tap_rate_limit;
    if (typeof configUpdates.tap_cooldown_ms === 'number') adminConfig.tap_cooldown_ms = configUpdates.tap_cooldown_ms;
    if (typeof configUpdates.haptic_feedback_enabled === 'boolean') adminConfig.haptic_feedback_enabled = configUpdates.haptic_feedback_enabled;
    if (configUpdates.haptic_feedback_type) adminConfig.haptic_feedback_type = configUpdates.haptic_feedback_type;
    
    // Visual Effects
    if (typeof configUpdates.tap_animation_enabled === 'boolean') adminConfig.tap_animation_enabled = configUpdates.tap_animation_enabled;
    if (configUpdates.tap_animation_type) adminConfig.tap_animation_type = configUpdates.tap_animation_type;
    if (typeof configUpdates.reward_popup_enabled === 'boolean') adminConfig.reward_popup_enabled = configUpdates.reward_popup_enabled;
    if (typeof configUpdates.reward_popup_duration === 'number') adminConfig.reward_popup_duration = configUpdates.reward_popup_duration;
    if (typeof configUpdates.particle_effects_enabled === 'boolean') adminConfig.particle_effects_enabled = configUpdates.particle_effects_enabled;
    if (configUpdates.particle_color) adminConfig.particle_color = configUpdates.particle_color;
    
    // Sound Settings
    if (typeof configUpdates.tap_sound_enabled === 'boolean') adminConfig.tap_sound_enabled = configUpdates.tap_sound_enabled;
    if (typeof configUpdates.tap_sound_volume === 'number') adminConfig.tap_sound_volume = configUpdates.tap_sound_volume;
    if (configUpdates.tap_sound_type) adminConfig.tap_sound_type = configUpdates.tap_sound_type;
    
    console.log(`👑 ADMIN: Updated configuration - ${Object.keys(configUpdates).length} settings changed`);
    
    res.json({
      success: true,
      message: 'Configuration updated successfully',
      config: adminConfig
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Public config endpoint (no auth required)
app.get('/api/config', (req, res) => {
  costOptimizer.trackDbQuery('public', 'select');
  
  // Return only public-safe configuration
  const publicConfig = {
    // Tap Button Appearance
    tap_button_text: adminConfig.tap_button_text,
    tap_button_size: adminConfig.tap_button_size,
    tap_button_color: adminConfig.tap_button_color,
    tap_button_gradient_start: adminConfig.tap_button_gradient_start,
    tap_button_gradient_end: adminConfig.tap_button_gradient_end,
    tap_button_border_radius: adminConfig.tap_button_border_radius,
    tap_button_shadow: adminConfig.tap_button_shadow,
    // Tap Behavior
    base_reward_min: adminConfig.base_reward_min,
    base_reward_max: adminConfig.base_reward_max,
    reward_notification_frequency: adminConfig.reward_notification_frequency,
    tap_rate_limit: adminConfig.tap_rate_limit,
    tap_cooldown_ms: adminConfig.tap_cooldown_ms,
    haptic_feedback_enabled: adminConfig.haptic_feedback_enabled,
    haptic_feedback_type: adminConfig.haptic_feedback_type,
    // Visual Effects
    tap_animation_enabled: adminConfig.tap_animation_enabled,
    tap_animation_type: adminConfig.tap_animation_type,
    reward_popup_enabled: adminConfig.reward_popup_enabled,
    reward_popup_duration: adminConfig.reward_popup_duration,
    particle_effects_enabled: adminConfig.particle_effects_enabled,
    particle_color: adminConfig.particle_color,
    // Sound Settings
    tap_sound_enabled: adminConfig.tap_sound_enabled,
    tap_sound_volume: adminConfig.tap_sound_volume,
    tap_sound_type: adminConfig.tap_sound_type,
    // Feature flags
    tap_boost_enabled: adminConfig.tap_boost_enabled,
    marketplace_enabled: adminConfig.marketplace_enabled
  };
  
  res.json({
    success: true,
    config: publicConfig
  });
});

// Tap boost management endpoints
app.get('/api/admin/tap-boosts', (req, res) => {
  const adminKey = req.headers['x-admin-key'];
  
  if (!adminKeys.includes(adminKey)) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized access'
    });
  }
  
  costOptimizer.trackDbQuery('admin', 'select');
  
  res.json({
    success: true,
    packages: marketplace.tap_boost_packages
  });
});

app.post('/api/admin/tap-boosts', (req, res) => {
  const adminKey = req.headers['x-admin-key'];
  
  if (!adminKeys.includes(adminKey)) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized access'
    });
  }
  
  try {
    costOptimizer.trackDbQuery('admin', 'insert');
    
    const { name, description, duration, multiplier, ton_price, stg_price, active } = req.body;
    
    const newPackage = {
      id: 'tap_' + Date.now(),
      name,
      description,
      duration,
      multiplier,
      ton_price,
      stg_price,
      active: active !== false
    };
    
    marketplace.tap_boost_packages.push(newPackage);
    
    console.log(`👑 ADMIN: Created tap boost package - ${name}`);
    
    res.json({
      success: true,
      message: 'Tap boost package created successfully',
      package: newPackage
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

app.put('/api/admin/tap-boosts/:id', (req, res) => {
  const adminKey = req.headers['x-admin-key'];
  
  if (!adminKeys.includes(adminKey)) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized access'
    });
  }
  
  try {
    costOptimizer.trackDbQuery('admin', 'update');
    
    const { id } = req.params;
    const { name, description, duration, multiplier, ton_price, stg_price, active } = req.body;
    
    const packageIndex = marketplace.tap_boost_packages.findIndex(pkg => pkg.id === id);
    if (packageIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Package not found'
      });
    }
    
    const package = marketplace.tap_boost_packages[packageIndex];
    if (name) package.name = name;
    if (description) package.description = description;
    if (duration) package.duration = duration;
    if (multiplier) package.multiplier = multiplier;
    if (ton_price) package.ton_price = ton_price;
    if (stg_price) package.stg_price = stg_price;
    if (typeof active === 'boolean') package.active = active;
    
    console.log(`👑 ADMIN: Updated tap boost package - ${package.name}`);
    
    res.json({
      success: true,
      message: 'Tap boost package updated successfully',
      package: package
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

app.delete('/api/admin/tap-boosts/:id', (req, res) => {
  const adminKey = req.headers['x-admin-key'];
  
  if (!adminKeys.includes(adminKey)) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized access'
    });
  }
  
  try {
    costOptimizer.trackDbQuery('admin', 'delete');
    
    const { id } = req.params;
    
    const packageIndex = marketplace.tap_boost_packages.findIndex(pkg => pkg.id === id);
    if (packageIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Package not found'
      });
    }
    
    const packageName = marketplace.tap_boost_packages[packageIndex].name;
    marketplace.tap_boost_packages.splice(packageIndex, 1);
    
    console.log(`👑 ADMIN: Deleted tap boost package - ${packageName}`);
    
    res.json({
      success: true,
      message: 'Tap boost package deleted successfully'
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

// Buy STG Packs API endpoints
let buyPacks = {
  stars: [
    { id: 'starter', name: 'Starter Pack', price: 50, amount: 5000, tier: 'starter' },
    { id: 'pro', name: 'Pro Pack', price: 100, amount: 12000, tier: 'pro' },
    { id: 'expert', name: 'Expert Pack', price: 200, amount: 30000, tier: 'expert' },
    { id: 'master', name: 'Master Pack', price: 400, amount: 75000, tier: 'master' },
    { id: 'vip', name: 'VIP Pack', price: 750, amount: 150000, tier: 'vip' }
  ],
  ton: [
    { id: 'bronze', name: 'BRONZE Pack', price: 5, amount: 5000, tier: 'bronze' },
    { id: 'silver', name: 'SILVER Pack', price: 15, amount: 15000, tier: 'silver' },
    { id: 'gold', name: 'GOLD Pack', price: 30, amount: 40000, tier: 'gold' },
    { id: 'diamond', name: 'DIAMOND Pack', price: 75, amount: 100000, tier: 'diamond' },
    { id: 'whale', name: 'WHALE Pack', price: 150, amount: 250000, tier: 'whale' }
  ]
};

// Get buy packs
app.get('/api/buy/packs', (req, res) => {
  try {
    costOptimizer.trackDbQuery('buy_packs', 'select');
    
    res.json({
      success: true,
      packs: buyPacks
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Purchase pack
app.post('/api/buy/purchase', async (req, res) => {
  try {
    costOptimizer.trackDbQuery('buy_purchases', 'insert');
    
    const { packId, currency, amount, price } = req.body;
    const userId = req.headers['x-user-id'] || 'player123';
    
    // Find the pack
    const pack = [...buyPacks.stars, ...buyPacks.ton].find(p => p.id === packId);
    
    if (!pack) {
      return res.status(404).json({
        success: false,
        error: 'Pack not found'
      });
    }
    
    // Validate pack details
    if (pack.price !== price || pack.amount !== amount) {
      return res.status(400).json({
        success: false,
        error: 'Invalid pack details'
      });
    }
    
    // Record transaction (in production, integrate with actual payment processor)
    const transaction = {
      id: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: userId,
      packId: packId,
      packName: pack.name,
      currency: currency,
      price: price,
      amount: amount,
      timestamp: new Date().toISOString(),
      status: 'completed'
    };
    
    // Update user balance (mock)
    console.log(`User ${userId} purchased ${pack.name} for ${price} ${currency}, received ${amount} STG`);
    
    res.json({
      success: true,
      transaction: transaction,
      message: `Successfully purchased ${pack.name}!`
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Update buy packs (admin only)
app.put('/api/admin/buy/packs', (req, res) => {
  try {
    costOptimizer.trackDbQuery('admin', 'update');
    
    const { packs } = req.body;
    
    if (packs && packs.stars && packs.ton) {
      buyPacks = packs;
    }
    
    res.json({
      success: true,
      packs: buyPacks,
      message: 'Buy packs updated successfully'
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

// Catch-all handler for client-side routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'build', 'index.html'));
});

// Start server
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

// Error handling middleware (must be added after all routes)
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
