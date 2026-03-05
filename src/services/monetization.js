/**
 * 💰 MONETIZATION SERVICE
 * Handles all revenue generation and payment processing
 */

const costOptimizer = require('../utils/cost-optimizer');

class MonetizationService {
  constructor() {
    this.paymentProviders = {
      stripe: {
        name: 'Stripe',
        setup: 0,
        transaction: 0.029,
        fixed: 0.30,
        monthly: 0,
        crypto: false
      },
      coinbase: {
        name: 'Coinbase',
        setup: 0,
        transaction: 0.015,
        fixed: 0,
        monthly: 0,
        crypto: true
      },
      paypal: {
        name: 'PayPal',
        setup: 0,
        transaction: 0.034,
        fixed: 0.30,
        monthly: 0,
        crypto: false
      }
    };
    
    this.products = {
      stgTokens: [
        { id: 'stg_1k', amount: 1000, price: 1.99, bonus: 0 },
        { id: 'stg_5k', amount: 5000, price: 5.99, bonus: 500 },
        { id: 'stg_10k', amount: 10000, price: 10.99, bonus: 1500 },
        { id: 'stg_50k', amount: 50000, price: 29.99, bonus: 10000 }
      ],
      premiumFeatures: [
        { id: 'energy_boost', name: 'Energy Boost', monthly: 2, description: '2x energy regeneration' },
        { id: 'custom_avatar', name: 'Custom Avatar', monthly: 5, description: 'Exclusive avatars and skins' },
        { id: 'battle_analytics', name: 'Battle Analytics', monthly: 3, description: 'Advanced battle statistics' },
        { id: 'vip_chat', name: 'VIP Chat', monthly: 4, description: 'Priority support and chat features' }
      ],
      battlePasses: [
        { id: 'basic_pass', name: 'Basic Battle Pass', monthly: 10, rewards: ['Daily bonus', 'Exclusive battles'] },
        { id: 'pro_pass', name: 'Pro Battle Pass', monthly: 25, rewards: ['All basic rewards', 'Tournament access', 'Premium items'] }
      ]
    };
    
    this.commissionRates = {
      nftTrading: 0.03, // 3%
      itemMarketplace: 0.05, // 5%
      playerTrading: 0.02, // 2%
      skinSales: 0.10 // 10%
    };
  }

  // Process STG token purchase
  async purchaseSTGTokens(userId, productId, paymentMethod = 'stripe') {
    const product = this.products.stgTokens.find(p => p.id === productId);
    if (!product) {
      throw new Error('Invalid product ID');
    }

    // Calculate total amount with bonus
    const totalTokens = product.amount + (product.bonus || 0);
    const fee = this.calculatePaymentFee(product.price, paymentMethod);
    const totalAmount = product.price + fee;

    // Track purchase
    const purchase = costOptimizer.trackPurchase(userId, product.price, 'stg_tokens', {
      productId,
      tokens: totalTokens,
      paymentMethod,
      fee
    });

    // Process payment
    const paymentResult = await this.processPayment(userId, totalAmount, paymentMethod, purchase.id);
    
    if (paymentResult.success) {
      // Credit user's account
      await this.creditUserTokens(userId, totalTokens);
      
      // Send notification
      await this.sendPurchaseNotification(userId, {
        type: 'stg_tokens',
        amount: totalTokens,
        purchaseId: purchase.id
      });
      
      return {
        success: true,
        purchase,
        tokens: totalTokens,
        payment: paymentResult
      };
    } else {
      throw new Error('Payment failed');
    }
  }

  // Subscribe to premium feature
  async subscribePremiumFeature(userId, featureId, paymentMethod = 'stripe') {
    const feature = this.products.premiumFeatures.find(f => f.id === featureId);
    if (!feature) {
      throw new Error('Invalid feature ID');
    }

    // Calculate monthly fee
    const fee = this.calculatePaymentFee(feature.monthly, paymentMethod);
    const totalAmount = feature.monthly + fee;

    // Track subscription
    const purchase = costOptimizer.trackPurchase(userId, feature.monthly, 'premium', {
      featureId,
      featureName: feature.name,
      paymentMethod,
      fee,
      type: 'subscription'
    });

    // Process payment
    const paymentResult = await this.processPayment(userId, totalAmount, paymentMethod, purchase.id);
    
    if (paymentResult.success) {
      // Activate subscription
      await this.activateSubscription(userId, featureId, feature.monthly);
      
      // Send notification
      await this.sendPurchaseNotification(userId, {
        type: 'premium_feature',
        feature: feature.name,
        purchaseId: purchase.id
      });
      
      return {
        success: true,
        purchase,
        feature,
        payment: paymentResult
      };
    } else {
      throw new Error('Payment failed');
    }
  }

  // Process battle fee
  async processBattleFee(player1Id, player2Id, stakeAmount, battleType = 'normal') {
    const feeCalculation = costOptimizer.calculateBattleFee(stakeAmount, battleType);
    
    // Track fee revenue
    const feePurchase = costOptimizer.trackPurchase('system', feeCalculation.fee, 'battle_fee', {
      player1Id,
      player2Id,
      stakeAmount,
      battleType,
      feeType: 'commission'
    });

    return {
      fee: feeCalculation.fee,
      netStake: feeCalculation.netStake,
      feePurchase
    };
  }

  // Process marketplace commission
  async processMarketplaceCommission(sellerId, buyerId, itemPrice, itemType) {
    const commissionRate = this.commissionRates[itemType] || 0.05;
    const commission = itemPrice * commissionRate;
    
    // Track commission revenue
    const commissionPurchase = costOptimizer.trackPurchase('system', commission, 'marketplace_commission', {
      sellerId,
      buyerId,
      itemPrice,
      itemType,
      commissionRate
    });

    return {
      commission,
      netPrice: itemPrice - commission,
      commissionPurchase
    };
  }

  // Calculate payment fee
  calculatePaymentFee(amount, provider) {
    const providerConfig = this.paymentProviders[provider];
    if (!providerConfig) {
      throw new Error('Invalid payment provider');
    }

    return (amount * providerConfig.transaction) + providerConfig.fixed;
  }

  // Choose best payment provider
  chooseBestProvider(amount, acceptCrypto = false) {
    let bestProvider = 'stripe';
    let lowestFee = this.calculatePaymentFee(amount, 'stripe');

    Object.entries(this.paymentProviders).forEach(([provider, config]) => {
      if (!acceptCrypto && config.crypto) return; // Skip crypto if not accepted
      
      const fee = this.calculatePaymentFee(amount, provider);
      if (fee < lowestFee) {
        lowestFee = fee;
        bestProvider = provider;
      }
    });

    return bestProvider;
  }

  // Process payment
  async processPayment(userId, amount, provider, purchaseId) {
    // In production, integrate with actual payment APIs
    console.log(`💳 Processing payment: $${amount} via ${provider} for user ${userId}`);
    
    // Simulate payment processing
    const processingTime = Math.random() * 2000 + 1000; // 1-3 seconds
    
    return new Promise((resolve) => {
      setTimeout(() => {
        // Simulate 95% success rate
        const success = Math.random() > 0.05;
        
        if (success) {
          resolve({
            success: true,
            transactionId: this.generateTransactionId(),
            provider,
            amount,
            fee: this.calculatePaymentFee(amount, provider),
            processedAt: Date.now()
          });
        } else {
          resolve({
            success: false,
            error: 'Payment declined',
            provider,
            amount
          });
        }
      }, processingTime);
    });
  }

  // Credit user tokens
  async creditUserTokens(userId, amount) {
    console.log(`💰 Credited ${amount} STG tokens to user ${userId}`);
    // In production, update user's token balance in database
    // await db.users.update(userId, { 
    //   $inc: { stg_tokens: amount },
    //   $set: { last_token_credit: Date.now() }
    // });
  }

  // Activate subscription
  async activateSubscription(userId, featureId, monthlyFee) {
    console.log(`⭐ Activated subscription ${featureId} for user ${userId} ($${monthlyFee}/month)`);
    // In production, update user's subscriptions in database
    // await db.subscriptions.create({
    //   userId,
    //   featureId,
    //   monthlyFee,
    //   startDate: Date.now(),
    //   active: true
    // });
  }

  // Send purchase notification
  async sendPurchaseNotification(userId, purchaseDetails) {
    console.log(`📧 Sent purchase notification to user ${userId}:`, purchaseDetails);
    // In production, send email/push notification
    // await notificationService.send(userId, 'purchase_confirmation', purchaseDetails);
  }

  // Get user's active subscriptions
  async getUserSubscriptions(userId) {
    // In production, fetch from database
    return [
      {
        id: 'energy_boost',
        name: 'Energy Boost',
        monthly: 2,
        active: true,
        nextBilling: Date.now() + (30 * 24 * 60 * 60 * 1000)
      }
    ];
  }

  // Get user's purchase history
  async getUserPurchaseHistory(userId, limit = 10) {
    // In production, fetch from database
    return [
      {
        id: 'purchase_1',
        type: 'stg_tokens',
        amount: 6.99,
        tokens: 11500,
        date: Date.now() - (2 * 24 * 60 * 60 * 1000),
        status: 'completed'
      },
      {
        id: 'purchase_2',
        type: 'premium',
        feature: 'Energy Boost',
        amount: 2.00,
        date: Date.now() - (15 * 24 * 60 * 60 * 1000),
        status: 'completed'
      }
    ];
  }

  // Get available products
  getAvailableProducts() {
    return {
      stgTokens: this.products.stgTokens,
      premiumFeatures: this.products.premiumFeatures,
      battlePasses: this.products.battlePasses
    };
  }

  // Get revenue analytics
  getRevenueAnalytics(timeframe = 'month') {
    const revenue = costOptimizer.revenueTracker;
    
    return {
      totalRevenue: revenue.totalRevenue,
      timeframeRevenue: revenue.monthlyRevenue,
      averagePurchase: revenue.monthlyRevenue / Math.max(1, revenue.purchases.length),
      topProducts: this.getTopProducts(),
      revenueByType: this.getRevenueByType(),
      profitMargin: costOptimizer.calculateProfitMargin()
    };
  }

  // Get top performing products
  getTopProducts() {
    // In production, analyze actual purchase data
    return [
      { id: 'stg_5k', name: '5,000 STG Tokens', revenue: 1596, purchases: 400 },
      { id: 'energy_boost', name: 'Energy Boost', revenue: 800, purchases: 400 },
      { id: 'stg_10k', name: '10,000 STG Tokens', revenue: 699, purchases: 100 }
    ];
  }

  // Get revenue by type
  getRevenueByType() {
    return {
      stg_tokens: 2895,
      premium: 1200,
      battle_fees: 450,
      marketplace_commissions: 280
    };
  }

  // Generate transaction ID
  generateTransactionId() {
    return 'txn_' + Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Validate promotion code
  async validatePromotionCode(code, userId) {
    const promotions = {
      'WELCOME10': { discount: 0.10, type: 'percentage', maxUses: 1000, currentUses: 234 },
      'BOOST20': { discount: 20, type: 'fixed', maxUses: 500, currentUses: 89 },
      'VIP50': { discount: 0.50, type: 'percentage', maxUses: 100, currentUses: 12 }
    };
    
    const promotion = promotions[code];
    if (!promotion) {
      return { valid: false, error: 'Invalid promotion code' };
    }
    
    if (promotion.currentUses >= promotion.maxUses) {
      return { valid: false, error: 'Promotion code expired' };
    }
    
    // Check if user has already used this code
    const userUsage = await this.checkUserPromotionUsage(userId, code);
    if (userUsage) {
      return { valid: false, error: 'Promotion code already used' };
    }
    
    return { 
      valid: true, 
      discount: promotion.discount,
      type: promotion.type
    };
  }

  // Check user promotion usage
  async checkUserPromotionUsage(userId, code) {
    // In production, check database
    return false;
  }

  // Apply promotion to purchase
  applyPromotion(amount, promotion) {
    if (promotion.type === 'percentage') {
      return amount * (1 - promotion.discount);
    } else if (promotion.type === 'fixed') {
      return Math.max(0, amount - promotion.discount);
    }
    return amount;
  }

  // Admin management methods
  updateTokenPack(id, updates) {
    const packIndex = this.products.stgTokens.findIndex(p => p.id === id);
    if (packIndex === -1) {
      throw new Error('Token pack not found');
    }
    
    this.products.stgTokens[packIndex] = { ...this.products.stgTokens[packIndex], ...updates };
    return this.products.stgTokens[packIndex];
  }

  updatePremiumFeature(id, updates) {
    const featureIndex = this.products.premiumFeatures.findIndex(f => f.id === id);
    if (featureIndex === -1) {
      throw new Error('Premium feature not found');
    }
    
    this.products.premiumFeatures[featureIndex] = { ...this.products.premiumFeatures[featureIndex], ...updates };
    return this.products.premiumFeatures[featureIndex];
  }

  addTokenPack(packData) {
    const newPack = {
      id: `stg_${Date.now()}`,
      ...packData
    };
    
    this.products.stgTokens.push(newPack);
    return newPack;
  }

  addPremiumFeature(featureData) {
    const newFeature = {
      id: `feature_${Date.now()}`,
      ...featureData
    };
    
    this.products.premiumFeatures.push(newFeature);
    return newFeature;
  }

  deleteTokenPack(id) {
    const packIndex = this.products.stgTokens.findIndex(p => p.id === id);
    if (packIndex === -1) {
      throw new Error('Token pack not found');
    }
    
    this.products.stgTokens.splice(packIndex, 1);
  }

  deletePremiumFeature(id) {
    const featureIndex = this.products.premiumFeatures.findIndex(f => f.id === id);
    if (featureIndex === -1) {
      throw new Error('Premium feature not found');
    }
    
    this.products.premiumFeatures.splice(featureIndex, 1);
  }
}

// Global instance
const monetizationService = new MonetizationService();

module.exports = monetizationService;
