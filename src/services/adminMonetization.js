/**
 * 🏆 ADMIN MONETIZATION ANALYTICS SERVICE
 * Comprehensive direct income tracking for admin dashboard
 * Implements all 7 categories of direct income streams
 */

class AdminMonetizationService {
  constructor() {
    // Initialize income tracking for all categories
    this.incomeStreams = {
      profileBadges: {
        totalRevenue: 0,
        transactions: [],
        categories: {
          bronze: { price: 5, sold: 0, revenue: 0 },
          silver: { price: 15, sold: 0, revenue: 0 },
          gold: { price: 25, sold: 0, revenue: 0 },
          platinum: { price: 50, sold: 0, revenue: 0 },
          diamond: { price: 100, sold: 0, revenue: 0 },
          legendary: { price: 500, sold: 0, revenue: 0 }
        }
      },
      tippings: {
        totalRevenue: 0,
        transactions: [],
        sources: {
          battleVictory: { amount: 0, count: 0 },
          tournamentWin: { amount: 0, count: 0 },
          leaderboard: { amount: 0, count: 0 },
          socialShare: { amount: 0, count: 0 },
          direct: { amount: 0, count: 0 }
        }
      },
      gifts: {
        totalRevenue: 0,
        transactions: [],
        giftTypes: {
          roses: { price: 1, sent: 0, revenue: 0 },
          chocolates: { price: 3, sent: 0, revenue: 0 },
          teddyBears: { price: 5, sent: 0, revenue: 0 },
          jewelry: { price: 10, sent: 0, revenue: 0 },
          luxuryCars: { price: 50, sent: 0, revenue: 0 },
          yachts: { price: 100, sent: 0, revenue: 0 },
          privateJets: { price: 500, sent: 0, revenue: 0 }
        }
      },
      telegramStars: {
        totalRevenue: 0,
        transactions: [],
        packages: {
          starter_50: { stars: 50, stg: 5000, sold: 0, revenue: 0 },
          pro_100: { stars: 100, stg: 12000, sold: 0, revenue: 0 },
          expert_200: { stars: 200, stg: 30000, sold: 0, revenue: 0 },
          master_400: { stars: 400, stg: 75000, sold: 0, revenue: 0 },
          vip_750: { stars: 750, stg: 150000, sold: 0, revenue: 0 }
        }
      },
      telegramDiamonds: {
        totalRevenue: 0,
        transactions: [],
        packages: {
          diamond_10: { diamonds: 10, stg: 25000, sold: 0, revenue: 0 },
          diamond_25: { diamonds: 25, stg: 65000, sold: 0, revenue: 0 },
          diamond_50: { diamonds: 50, stg: 140000, sold: 0, revenue: 0 },
          diamond_100: { diamonds: 100, stg: 300000, sold: 0, revenue: 0 },
          diamond_250: { diamonds: 250, stg: 800000, sold: 0, revenue: 0 }
        }
      },
      tonBoosts: {
        totalRevenue: 0,
        transactions: [],
        boostTypes: {
          tapMultiplier: { multiplier: 2, duration: 3600, tonPrice: 0.5, purchased: 0, revenue: 0 },
          energyRefill: { energy: 100, tonPrice: 0.3, purchased: 0, revenue: 0 },
          criticalChance: { bonus: 0.1, duration: 7200, tonPrice: 1.0, purchased: 0, revenue: 0 },
          instantBattle: { instantWin: true, tonPrice: 2.0, purchased: 0, revenue: 0 },
          shieldProtection: { duration: 14400, tonPrice: 1.5, purchased: 0, revenue: 0 },
          doubleRewards: { duration: 3600, tonPrice: 3.0, purchased: 0, revenue: 0 }
        }
      },
      donations: {
        totalRevenue: 0,
        transactions: [],
        campaigns: {
          serverMaintenance: { goal: 1000, raised: 0, donors: 0 },
          newFeatures: { goal: 5000, raised: 0, donors: 0 },
          tournamentPrizes: { goal: 2000, raised: 0, donors: 0 },
          communityEvents: { goal: 1500, raised: 0, donors: 0 },
          charity: { goal: 3000, raised: 0, donors: 0 }
        },
        tiers: {
          supporter: { min: 1, max: 10, count: 0, total: 0 },
          contributor: { min: 11, max: 50, count: 0, total: 0 },
          patron: { min: 51, max: 100, count: 0, total: 0 },
          champion: { min: 101, max: 500, count: 0, total: 0 },
          legend: { min: 501, max: Infinity, count: 0, total: 0 }
        }
      }
    };

    // Initialize with sample data for demonstration
    this.initializeSampleData();
  }

  // Initialize sample data for demonstration
  initializeSampleData() {
    // Profile Badges Sales
    this.recordProfileBadgeSale('bronze', 'user123', 5);
    this.recordProfileBadgeSale('silver', 'user456', 15);
    this.recordProfileBadgeSale('gold', 'user789', 25);
    this.recordProfileBadgeSale('platinum', 'user101', 50);
    this.recordProfileBadgeSale('diamond', 'user202', 100);
    
    // Tippings
    this.recordTip('battleVictory', 'user333', 2.5);
    this.recordTip('tournamentWin', 'user444', 10);
    this.recordTip('leaderboard', 'user555', 5);
    this.recordTip('socialShare', 'user666', 1);
    
    // Gifts
    this.recordGift('roses', 'user777', 'user888', 1);
    this.recordGift('chocolates', 'user999', 'user000', 3);
    this.recordGift('teddyBears', 'user111', 'user222', 5);
    this.recordGift('jewelry', 'user333', 'user444', 10);
    
    // Telegram Stars
    this.recordTelegramStarsSale('starter_50', 'user555', 50);
    this.recordTelegramStarsSale('pro_100', 'user666', 100);
    this.recordTelegramStarsSale('expert_200', 'user777', 200);
    
    // Telegram Diamonds
    this.recordTelegramDiamondsSale('diamond_10', 'user888', 10);
    this.recordTelegramDiamondsSale('diamond_25', 'user999', 25);
    
    // TON Boosts
    this.recordTonBoostPurchase('tapMultiplier', 'user000', 0.5);
    this.recordTonBoostPurchase('energyRefill', 'user111', 0.3);
    this.recordTonBoostPurchase('criticalChance', 'user222', 1.0);
    
    // Donations
    this.recordDonation('serverMaintenance', 'user333', 25);
    this.recordDonation('newFeatures', 'user444', 50);
    this.recordDonation('tournamentPrizes', 'user555', 15);
  }

  // 1. PROFILE BADGES SYSTEM
  recordProfileBadgeSale(badgeType, userId, price) {
    const transaction = {
      id: `badge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      badgeType,
      price,
      timestamp: Date.now(),
      type: 'profile_badge'
    };

    this.incomeStreams.profileBadges.transactions.push(transaction);
    this.incomeStreams.profileBadges.totalRevenue += price;
    this.incomeStreams.profileBadges.categories[badgeType].sold++;
    this.incomeStreams.profileBadges.categories[badgeType].revenue += price;
    
    return transaction;
  }

  // 2. TIPPING SYSTEM
  recordTip(source, fromUserId, amount) {
    const transaction = {
      id: `tip_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      fromUserId,
      source,
      amount,
      timestamp: Date.now(),
      type: 'tip'
    };

    this.incomeStreams.tippings.transactions.push(transaction);
    this.incomeStreams.tippings.totalRevenue += amount;
    this.incomeStreams.tippings.sources[source].amount += amount;
    this.incomeStreams.tippings.sources[source].count++;
    
    return transaction;
  }

  // 3. GIFTS SYSTEM
  recordGift(giftType, fromUserId, toUserId, price) {
    const transaction = {
      id: `gift_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      fromUserId,
      toUserId,
      giftType,
      price,
      timestamp: Date.now(),
      type: 'gift'
    };

    this.incomeStreams.gifts.transactions.push(transaction);
    this.incomeStreams.gifts.totalRevenue += price;
    this.incomeStreams.gifts.giftTypes[giftType].sent++;
    this.incomeStreams.gifts.giftTypes[giftType].revenue += price;
    
    return transaction;
  }

  // 4. TELEGRAM STARS SYSTEM
  recordTelegramStarsSale(packageId, userId) {
    const packageData = this.incomeStreams.telegramStars.packages[packageId];
    if (!packageData) {
      throw new Error(`Invalid package ID: ${packageId}`);
    }
    
    const transaction = {
      id: `stars_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      packageId,
      stars: packageData.stars,
      stg: packageData.stg,
      timestamp: Date.now(),
      type: 'telegram_stars'
    };

    this.incomeStreams.telegramStars.transactions.push(transaction);
    // Stars revenue is calculated as stars * 0.05 (conversion rate)
    const revenue = packageData.stars * 0.05;
    this.incomeStreams.telegramStars.totalRevenue += revenue;
    packageData.sold++;
    packageData.revenue += revenue;
    
    return transaction;
  }

  // 5. TELEGRAM DIAMONDS SYSTEM
  recordTelegramDiamondsSale(packageId, userId) {
    const packageData = this.incomeStreams.telegramDiamonds.packages[packageId];
    if (!packageData) {
      throw new Error(`Invalid package ID: ${packageId}`);
    }
    
    const transaction = {
      id: `diamonds_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      packageId,
      diamonds: packageData.diamonds,
      stg: packageData.stg,
      timestamp: Date.now(),
      type: 'telegram_diamonds'
    };

    this.incomeStreams.telegramDiamonds.transactions.push(transaction);
    // Diamonds revenue is calculated as diamonds * 0.1 (conversion rate)
    const revenue = packageData.diamonds * 0.1;
    this.incomeStreams.telegramDiamonds.totalRevenue += revenue;
    packageData.sold++;
    packageData.revenue += revenue;
    
    return transaction;
  }

  // 6. TON BOOSTS SYSTEM
  recordTonBoostPurchase(boostType, userId, tonPrice) {
    const boost = this.incomeStreams.tonBoosts.boostTypes[boostType];
    const transaction = {
      id: `boost_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      boostType,
      tonPrice,
      timestamp: Date.now(),
      type: 'ton_boost'
    };

    this.incomeStreams.tonBoosts.transactions.push(transaction);
    this.incomeStreams.tonBoosts.totalRevenue += tonPrice;
    boost.purchased++;
    boost.revenue += tonPrice;
    
    return transaction;
  }

  // 7. DONATIONS SYSTEM
  recordDonation(campaign, userId, amount) {
    const transaction = {
      id: `donation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      campaign,
      amount,
      timestamp: Date.now(),
      type: 'donation'
    };

    this.incomeStreams.donations.transactions.push(transaction);
    this.incomeStreams.donations.totalRevenue += amount;
    this.incomeStreams.donations.campaigns[campaign].raised += amount;
    this.incomeStreams.donations.campaigns[campaign].donors++;
    
    // Categorize by tier
    const tier = this.getDonationTier(amount);
    this.incomeStreams.donations.tiers[tier].count++;
    this.incomeStreams.donations.tiers[tier].total += amount;
    
    return transaction;
  }

  getDonationTier(amount) {
    if (amount <= 10) return 'supporter';
    if (amount <= 50) return 'contributor';
    if (amount <= 100) return 'patron';
    if (amount <= 500) return 'champion';
    return 'legend';
  }

  // COMPREHENSIVE ANALYTICS METHODS
  getTotalRevenue() {
    return Object.values(this.incomeStreams).reduce((total, stream) => total + stream.totalRevenue, 0);
  }

  getRevenueByCategory() {
    return Object.entries(this.incomeStreams).reduce((revenue, [category, stream]) => {
      revenue[category] = {
        totalRevenue: stream.totalRevenue,
        transactionCount: stream.transactions.length,
        averageTransaction: stream.transactions.length > 0 ? stream.totalRevenue / stream.transactions.length : 0
      };
      return revenue;
    }, {});
  }

  getTopPerformers(category, limit = 5) {
    const stream = this.incomeStreams[category];
    if (!stream) return [];

    switch (category) {
      case 'profileBadges':
        return Object.entries(stream.categories)
          .map(([type, data]) => ({ type, ...data }))
          .sort((a, b) => b.revenue - a.revenue)
          .slice(0, limit);
      
      case 'tippings':
        return Object.entries(stream.sources)
          .map(([source, data]) => ({ source, ...data }))
          .sort((a, b) => b.amount - a.amount)
          .slice(0, limit);
      
      case 'gifts':
        return Object.entries(stream.giftTypes)
          .map(([type, data]) => ({ type, ...data }))
          .sort((a, b) => b.revenue - a.revenue)
          .slice(0, limit);
      
      case 'telegramStars':
      case 'telegramDiamonds':
        return Object.entries(stream.packages)
          .map(([id, data]) => ({ id, ...data }))
          .sort((a, b) => b.revenue - a.revenue)
          .slice(0, limit);
      
      case 'tonBoosts':
        return Object.entries(stream.boostTypes)
          .map(([type, data]) => ({ type, ...data }))
          .sort((a, b) => b.revenue - a.revenue)
          .slice(0, limit);
      
      case 'donations':
        return Object.entries(stream.campaigns)
          .map(([campaign, data]) => ({ campaign, ...data }))
          .sort((a, b) => b.raised - a.raised)
          .slice(0, limit);
      
      default:
        return [];
    }
  }

  getDailyRevenue(days = 30) {
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    const dailyData = {};

    for (let i = days - 1; i >= 0; i--) {
      const dayStart = now - (i * dayMs);
      const dayEnd = dayStart + dayMs;
      const dayKey = new Date(dayStart).toISOString().split('T')[0];
      
      dailyData[dayKey] = {
        totalRevenue: 0,
        transactions: 0,
        categories: {}
      };

      Object.entries(this.incomeStreams).forEach(([category, stream]) => {
        const dayTransactions = stream.transactions.filter(
          tx => tx.timestamp >= dayStart && tx.timestamp < dayEnd
        );
        
        const dayRevenue = dayTransactions.reduce((sum, tx) => {
          if (category === 'telegramStars') {
            return sum + (tx.stars * 0.05);
          } else if (category === 'telegramDiamonds') {
            return sum + (tx.diamonds * 0.1);
          }
          return sum + (tx.price || tx.amount || tx.tonPrice || 0);
        }, 0);

        dailyData[dayKey].categories[category] = {
          revenue: dayRevenue,
          transactions: dayTransactions.length
        };
        dailyData[dayKey].totalRevenue += dayRevenue;
        dailyData[dayKey].transactions += dayTransactions.length;
      });
    }

    return dailyData;
  }

  getUserSpendingAnalysis(userId) {
    const userSpending = {};

    Object.entries(this.incomeStreams).forEach(([category, stream]) => {
      const userTransactions = stream.transactions.filter(tx => tx.userId === userId);
      
      if (userTransactions.length > 0) {
        userSpending[category] = {
          transactionCount: userTransactions.length,
          totalSpent: userTransactions.reduce((sum, tx) => {
            if (category === 'telegramStars') {
              return sum + (tx.stars * 0.05);
            } else if (category === 'telegramDiamonds') {
              return sum + (tx.diamonds * 0.1);
            }
            return sum + (tx.price || tx.amount || tx.tonPrice || 0);
          }, 0),
          averageSpent: 0,
          transactions: userTransactions
        };
        userSpending[category].averageSpent = userSpending[category].totalSpent / userTransactions.length;
      }
    });

    return userSpending;
  }

  getComprehensiveReport() {
    return {
      summary: {
        totalRevenue: this.getTotalRevenue(),
        totalTransactions: Object.values(this.incomeStreams).reduce((total, stream) => total + stream.transactions.length, 0),
        averageTransactionValue: this.getTotalRevenue() / Object.values(this.incomeStreams).reduce((total, stream) => total + stream.transactions.length, 0),
        activeIncomeStreams: Object.values(this.incomeStreams).filter(stream => stream.transactions.length > 0).length
      },
      categories: this.getRevenueByCategory(),
      topPerformers: Object.fromEntries(
        Object.keys(this.incomeStreams).map(category => [
          category,
          this.getTopPerformers(category)
        ])
      ),
      dailyRevenue: this.getDailyRevenue(),
      growthMetrics: this.calculateGrowthMetrics(),
      projections: this.calculateProjections()
    };
  }

  calculateGrowthMetrics() {
    const dailyData = this.getDailyRevenue(30);
    const days = Object.keys(dailyData).sort();
    
    if (days.length < 2) return { weeklyGrowth: 0, monthlyGrowth: 0 };

    const recentWeek = days.slice(-7).reduce((sum, day) => sum + dailyData[day].totalRevenue, 0);
    const previousWeek = days.slice(-14, -7).reduce((sum, day) => sum + dailyData[day].totalRevenue, 0);
    const weeklyGrowth = previousWeek > 0 ? ((recentWeek - previousWeek) / previousWeek) * 100 : 0;

    const recentMonth = days.slice(-30).reduce((sum, day) => sum + dailyData[day].totalRevenue, 0);
    const previousMonth = days.slice(-60, -30).reduce((sum, day) => sum + dailyData[day].totalRevenue, 0);
    const monthlyGrowth = previousMonth > 0 ? ((recentMonth - previousMonth) / previousMonth) * 100 : 0;

    return { weeklyGrowth, monthlyGrowth };
  }

  calculateProjections() {
    const dailyData = this.getDailyRevenue(30);
    const recentRevenue = Object.values(dailyData).slice(-7).reduce((sum, day) => sum + day.totalRevenue, 0);
    const dailyAverage = recentRevenue / 7;

    return {
      dailyProjection: dailyAverage,
      weeklyProjection: dailyAverage * 7,
      monthlyProjection: dailyAverage * 30,
      yearlyProjection: dailyAverage * 365
    };
  }
}

// Global instance
const adminMonetizationService = new AdminMonetizationService();

module.exports = adminMonetizationService;
