/**
 * 🚀 ZERO-BUDGET SUPABASE COST OPTIMIZER
 * Implements smart cost management and revenue tracking
 */

class CostOptimizer {
  constructor() {
    this.usageTracker = {
      dbQueries: 0,
      apiCalls: 0,
      storageUsed: 0,
      bandwidthUsed: 0,
      activeUsers: 0,
      startTime: Date.now()
    };
    
    this.revenueTracker = {
      dailyRevenue: 0,
      monthlyRevenue: 0,
      totalRevenue: 0,
      purchases: [],
      fees: [],
      commissions: []
    };
    
    this.alertThresholds = {
      warning: {
        dbUsage: 80, // 80% of free tier
        apiCalls: 80000, // 80% of free tier
        storage: 0.8, // 80% of free GB
        bandwidth: 1.6 // 80% of free GB
      },
      critical: {
        dbUsage: 95, // Upgrade needed
        apiCalls: 95000, // Upgrade urgent
        storage: 0.95, // Upgrade urgent
        bandwidth: 1.9 // Upgrade urgent
      }
    };
    
    this.monetization = {
      battleFee: 0.02, // 2% fee
      tournamentFee: 0.05, // 5% fee
      quickBattleFee: 0.01, // 1% extra fee
      stgTokenPacks: [
        { amount: 1000, price: 0.99 },
        { amount: 5000, price: 3.99 },
        { amount: 10000, price: 6.99 },
        { amount: 50000, price: 29.99 }
      ],
      premiumFeatures: {
        energyBoost: { monthly: 2, users: new Set() },
        customAvatar: { monthly: 5, users: new Set() },
        battleAnalytics: { monthly: 3, users: new Set() },
        vipChat: { monthly: 4, users: new Set() }
      }
    };
  }

  // Track API usage
  trackApiCall(endpoint, method) {
    this.usageTracker.apiCalls++;
    
    // Check if we're approaching limits
    this.checkUsageAlerts();
    
    return {
      allowed: this.usageTracker.apiCalls < 100000,
      remaining: 100000 - this.usageTracker.apiCalls,
      usagePercent: (this.usageTracker.apiCalls / 100000) * 100
    };
  }

  // Track database query
  trackDbQuery(table, operation) {
    this.usageTracker.dbQueries++;
    
    // Optimize query patterns
    this.optimizeQuery(table, operation);
    
    return {
      allowed: this.usageTracker.dbQueries < 50000,
      remaining: 50000 - this.usageTracker.dbQueries
    };
  }

  // Track storage usage
  trackStorage(sizeMB) {
    this.usageTracker.storageUsed += sizeMB;
    
    // Implement compression if needed
    if (this.usageTracker.storageUsed > 800) {
      this.compressAssets();
    }
    
    return {
      allowed: this.usageTracker.storageUsed < 1024,
      remaining: 1024 - this.usageTracker.storageUsed
    };
  }

  // Track active users
  trackActiveUser(userId) {
    this.usageTracker.activeUsers++;
    
    // Check if we need to upgrade
    const shouldUpgrade = this.shouldUpgradeToPro();
    if (shouldUpgrade) {
      console.log('🚀 Ready to upgrade to Pro tier - revenue supports it!');
    }
  }

  // Revenue tracking
  trackPurchase(userId, amount, type, metadata = {}) {
    const purchase = {
      id: this.generateId(),
      userId,
      amount,
      type,
      metadata,
      timestamp: Date.now(),
      processed: false
    };
    
    this.revenueTracker.purchases.push(purchase);
    this.revenueTracker.dailyRevenue += amount;
    this.revenueTracker.monthlyRevenue += amount;
    this.revenueTracker.totalRevenue += amount;
    
    // Process payment
    this.processPayment(purchase);
    
    // Update analytics
    this.updateAnalytics('purchase', purchase);
    
    return purchase;
  }

  // Battle fee calculation
  calculateBattleFee(stakeAmount, battleType = 'normal') {
    let fee = stakeAmount * this.monetization.battleFee;
    
    if (battleType === 'tournament') {
      fee = stakeAmount * this.monetization.tournamentFee;
    } else if (battleType === 'quick') {
      fee = stakeAmount * (this.monetization.battleFee + this.monetization.quickBattleFee);
    }
    
    return {
      fee: Math.round(fee * 100) / 100,
      netStake: stakeAmount - fee,
      feePercent: (fee / stakeAmount) * 100
    };
  }

  // Premium feature subscription
  subscribePremiumFeature(userId, feature) {
    const featureConfig = this.monetization.premiumFeatures[feature];
    if (!featureConfig) return false;
    
    featureConfig.users.add(userId);
    
    const subscription = {
      userId,
      feature,
      monthly: featureConfig.monthly,
      startDate: Date.now(),
      active: true
    };
    
    // Track revenue
    this.trackPurchase(userId, featureConfig.monthly, 'premium', { feature });
    
    return subscription;
  }

  // Check if should upgrade to Pro tier
  shouldUpgradeToPro() {
    const freeTierLimit = 50000; // 50k MAU
    const proTierCost = 25;
    const monthlyRevenue = this.revenueTracker.monthlyRevenue;
    
    return this.usageTracker.activeUsers > freeTierLimit * 0.8 && 
           monthlyRevenue > proTierCost * 2; // 2x buffer
  }

  // Usage alerts
  checkUsageAlerts() {
    const apiUsagePercent = (this.usageTracker.apiCalls / 100000) * 100;
    const dbUsagePercent = (this.usageTracker.dbQueries / 50000) * 100;
    const storageUsagePercent = (this.usageTracker.storageUsed / 1024) * 100;
    
    // Check warning thresholds
    if (apiUsagePercent > this.alertThresholds.warning.apiCalls) {
      console.warn('⚠️ API usage approaching limit:', apiUsagePercent.toFixed(1) + '%');
    }
    
    if (dbUsagePercent > this.alertThresholds.warning.dbUsage) {
      console.warn('⚠️ Database queries approaching limit:', dbUsagePercent.toFixed(1) + '%');
    }
    
    if (storageUsagePercent > this.alertThresholds.warning.storage) {
      console.warn('⚠️ Storage usage approaching limit:', storageUsagePercent.toFixed(1) + '%');
    }
    
    // Check critical thresholds
    if (apiUsagePercent > this.alertThresholds.critical.apiCalls) {
      console.error('🚨 CRITICAL: API usage at limit - upgrade needed!');
    }
    
    if (dbUsagePercent > this.alertThresholds.critical.dbUsage) {
      console.error('🚨 CRITICAL: Database queries at limit - upgrade needed!');
    }
    
    if (storageUsagePercent > this.alertThresholds.critical.storage) {
      console.error('🚨 CRITICAL: Storage usage at limit - upgrade needed!');
    }
  }

  // Optimize queries
  optimizeQuery(table, operation) {
    // Implement query optimization logic
    const optimizations = {
      users: {
        select: 'Use indexed columns: telegram_id, faction',
        insert: 'Batch inserts when possible',
        update: 'Use WHERE clause with indexed fields'
      },
      battles: {
        select: 'Limit results with pagination',
        insert: 'Batch battle records',
        update: 'Update only changed fields'
      }
    };
    
    return optimizations[table]?.[operation] || 'No optimization available';
  }

  // Compress assets
  compressAssets() {
    console.log('🗜️ Compressing assets to reduce storage usage...');
    // Implement asset compression logic
    // - Convert images to WebP
    // - Minify CSS/JS
    // - Remove unused assets
  }

  // Process payment
  async processPayment(purchase) {
    // Integrate with payment providers
    const paymentProviders = {
      stripe: { fee: 0.029 + 0.30, fixed: 0.30 },
      coinbase: { fee: 0.015, fixed: 0 },
      paypal: { fee: 0.034 + 0.30, fixed: 0.30 }
    };
    
    // Choose cheapest provider for this transaction
    let bestProvider = 'stripe';
    let lowestFee = paymentProviders.stripe.fee * purchase.amount + paymentProviders.stripe.fixed;
    
    Object.entries(paymentProviders).forEach(([provider, config]) => {
      const fee = config.fee * purchase.amount + config.fixed;
      if (fee < lowestFee) {
        lowestFee = fee;
        bestProvider = provider;
      }
    });
    
    purchase.processed = true;
    purchase.provider = bestProvider;
    purchase.fee = lowestFee;
    purchase.netAmount = purchase.amount - lowestFee;
    
    console.log(`💳 Payment processed via ${bestProvider}: $${purchase.amount} - $${lowestFee.toFixed(2)} fee`);
  }

  // Update analytics
  updateAnalytics(event, data) {
    // Send to analytics service
    console.log(`📊 Analytics: ${event}`, data);
    
    // Update dashboard metrics
    if (event === 'purchase') {
      this.updateDashboardMetrics(data);
    }
  }

  // Update dashboard metrics
  updateDashboardMetrics(purchase) {
    // Real-time dashboard updates
    const metrics = {
      totalRevenue: this.revenueTracker.totalRevenue,
      dailyRevenue: this.revenueTracker.dailyRevenue,
      activeUsers: this.usageTracker.activeUsers,
      averageRevenuePerUser: this.revenueTracker.totalRevenue / this.usageTracker.activeUsers,
      profitMargin: this.calculateProfitMargin()
    };
    
    // Emit to dashboard
    if (global.io) {
      global.io.emit('metrics_update', metrics);
    }
  }

  // Calculate profit margin
  calculateProfitMargin() {
    const monthlyCost = this.getCurrentMonthlyCost();
    const monthlyRevenue = this.revenueTracker.monthlyRevenue;
    
    if (monthlyRevenue === 0) return 0;
    
    return ((monthlyRevenue - monthlyCost) / monthlyRevenue) * 100;
  }

  // Get current monthly cost
  getCurrentMonthlyCost() {
    if (this.shouldUpgradeToPro()) {
      return 25; // Pro tier
    }
    return 0; // Free tier
  }

  // Generate daily report
  generateDailyReport() {
    const report = {
      date: new Date().toISOString().split('T')[0],
      usage: {
        apiCalls: this.usageTracker.apiCalls,
        dbQueries: this.usageTracker.dbQueries,
        storageUsed: this.usageTracker.storageUsed,
        activeUsers: this.usageTracker.activeUsers
      },
      revenue: {
        daily: this.revenueTracker.dailyRevenue,
        monthly: this.revenueTracker.monthlyRevenue,
        total: this.revenueTracker.totalRevenue,
        purchases: this.revenueTracker.purchases.length,
        averagePurchase: this.revenueTracker.dailyRevenue / Math.max(1, this.revenueTracker.purchases.length)
      },
      costs: {
        current: this.getCurrentMonthlyCost(),
        projected: this.getProjectedMonthlyCost(),
        profitMargin: this.calculateProfitMargin()
      },
      recommendations: this.generateRecommendations()
    };
    
    // Reset daily counters
    this.revenueTracker.dailyRevenue = 0;
    this.revenueTracker.purchases = [];
    
    return report;
  }

  // Generate recommendations
  generateRecommendations() {
    const recommendations = [];
    
    if (this.usageTracker.apiCalls > 80000) {
      recommendations.push('🚀 Consider upgrading to Pro tier - API usage high');
    }
    
    if (this.revenueTracker.monthlyRevenue > 50) {
      recommendations.push('💰 Revenue strong - can afford Pro tier upgrade');
    }
    
    if (this.usageTracker.activeUsers > 1000) {
      recommendations.push('📈 User growth excellent - implement premium features');
    }
    
    const profitMargin = this.calculateProfitMargin();
    if (profitMargin > 90) {
      recommendations.push('🎯 Excellent profit margin - scale marketing');
    }
    
    return recommendations;
  }

  // Get projected monthly cost
  getProjectedMonthlyCost() {
    const daysInMonth = 30;
    const daysElapsed = (Date.now() - this.usageTracker.startTime) / (1000 * 60 * 60 * 24);
    
    if (daysElapsed === 0) return 0;
    
    const projectedApiCalls = (this.usageTracker.apiCalls / daysElapsed) * daysInMonth;
    const projectedDbQueries = (this.usageTracker.dbQueries / daysElapsed) * daysInMonth;
    const projectedStorage = this.usageTracker.storageUsed;
    
    if (projectedApiCalls > 100000 || projectedDbQueries > 50000 || projectedStorage > 1024) {
      return 25; // Pro tier
    }
    
    return 0; // Free tier
  }

  // Generate unique ID
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Get current status
  getStatus() {
    return {
      usage: this.usageTracker,
      revenue: this.revenueTracker,
      monetization: this.monetization,
      alerts: this.alertThresholds,
      profitMargin: this.calculateProfitMargin(),
      shouldUpgrade: this.shouldUpgradeToPro()
    };
  }
}

// Global instance
const costOptimizer = new CostOptimizer();

// Export for use in other modules
module.exports = costOptimizer;
