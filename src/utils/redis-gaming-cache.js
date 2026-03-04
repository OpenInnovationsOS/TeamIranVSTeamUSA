const Redis = require('ioredis');

class GamingCacheManager {
  constructor() {
    this.redis = null;
    this.isInitialized = false;
    this.cacheStats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0
    };
  }

  async initialize() {
    if (this.isInitialized) return;

    try {
      this.redis = new Redis({
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT) || 6379,
        password: process.env.REDIS_PASSWORD,
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 3,
        lazyConnect: true,
        keyPrefix: 'team_iran_vs_usa:',
        enableOfflineQueue: false,
        maxMemoryPolicy: 'allkeys-lru', // Evict least recently used keys
      });

      // Event handlers
      this.redis.on('connect', () => {
        console.log('✅ Redis cache connected');
      });

      this.redis.on('error', (err) => {
        console.error('❌ Redis cache error:', err);
      });

      this.redis.on('close', () => {
        console.log('🔌 Redis cache disconnected');
      });

      await this.redis.connect();
      this.isInitialized = true;
      
      // Start stats reporting
      this.startStatsReporting();
      
      console.log('✅ Gaming cache manager initialized');
    } catch (error) {
      console.error('❌ Failed to initialize Redis cache:', error);
      throw error;
    }
  }

  // ============================================================================
  // USER DATA CACHING
  // ============================================================================

  async cacheUser(userId, userData, ttl = 300) {
    const key = `user:${userId}`;
    await this.redis.setex(key, ttl, JSON.stringify(userData));
    this.cacheStats.sets++;
  }

  async getUser(userId) {
    const key = `user:${userId}`;
    const data = await this.redis.get(key);
    
    if (data) {
      this.cacheStats.hits++;
      return JSON.parse(data);
    } else {
      this.cacheStats.misses++;
      return null;
    }
  }

  async invalidateUser(userId) {
    const key = `user:${userId}`;
    await this.redis.del(key);
    this.cacheStats.deletes++;
  }

  // ============================================================================
  // LEADERBOARD CACHING
  // ============================================================================

  async cacheLeaderboard(type, data, ttl = 60) {
    const key = `leaderboard:${type}`;
    await this.redis.setex(key, ttl, JSON.stringify(data));
    this.cacheStats.sets++;
  }

  async getLeaderboard(type) {
    const key = `leaderboard:${type}`;
    const data = await this.redis.get(key);
    
    if (data) {
      this.cacheStats.hits++;
      return JSON.parse(data);
    } else {
      this.cacheStats.misses++;
      return null;
    }
  }

  async updateLeaderboardScore(type, userId, score) {
    const key = `leaderboard:${type}`;
    await this.redis.zadd(key, score, userId);
    await this.redis.expire(key, 300); // 5 minutes TTL
    this.cacheStats.sets++;
  }

  async getTopLeaderboard(type, start = 0, end = 49) {
    const key = `leaderboard:${type}`;
    return await this.redis.zrevrange(key, start, end, 'WITHSCORES');
  }

  // ============================================================================
  // BATTLE CACHING
  // ============================================================================

  async cacheActiveBattle(battleId, battleData, ttl = 600) {
    const key = `battle:active:${battleId}`;
    await this.redis.setex(key, ttl, JSON.stringify(battleData));
    this.cacheStats.sets++;
  }

  async getActiveBattle(battleId) {
    const key = `battle:active:${battleId}`;
    const data = await this.redis.get(key);
    
    if (data) {
      this.cacheStats.hits++;
      return JSON.parse(data);
    } else {
      this.cacheStats.misses++;
      return null;
    }
  }

  async removeActiveBattle(battleId) {
    const key = `battle:active:${battleId}`;
    await this.redis.del(key);
    this.cacheStats.deletes++;
  }

  // ============================================================================
  // TERRITORY CONTROL CACHING
  // ============================================================================

  async cacheTerritoryControl(territoryId, faction, score, ttl = 86400) {
    const key = `territory:${territoryId}`;
    const data = { faction, score, lastUpdate: Date.now() };
    await this.redis.setex(key, ttl, JSON.stringify(data));
    this.cacheStats.sets++;
  }

  async getTerritoryControl(territoryId) {
    const key = `territory:${territoryId}`;
    const data = await this.redis.get(key);
    
    if (data) {
      this.cacheStats.hits++;
      return JSON.parse(data);
    } else {
      this.cacheStats.misses++;
      return null;
    }
  }

  async updateTerritoryScore(territoryId, faction, scoreChange) {
    const key = `territory:${territoryId}`;
    const current = await this.getTerritoryControl(territoryId);
    
    if (current) {
      current.faction = faction;
      current.score += scoreChange;
      current.lastUpdate = Date.now();
      await this.redis.setex(key, 86400, JSON.stringify(current));
    }
    
    this.cacheStats.sets++;
  }

  // ============================================================================
  // RATE LIMITING
  // ============================================================================

  async checkRateLimit(userId, action, limit, windowMs) {
    const key = `rate_limit:${action}:${userId}`;
    const current = await this.redis.incr(key);
    
    if (current === 1) {
      await this.redis.expire(key, Math.ceil(windowMs / 1000));
    }
    
    return current <= limit;
  }

  async checkTapLimit(userId) {
    const key = `tap:${userId}`;
    const taps = await this.redis.incr(key);
    
    if (taps === 1) {
      await this.redis.expire(key, 60); // 60 seconds window
    }
    
    const maxTaps = parseInt(process.env.MAX_TAPS_PER_MINUTE) || 60;
    return { 
      allowed: taps <= maxTaps, 
      currentTaps: taps, 
      maxTaps,
      resetTime: Date.now() + 60000
    };
  }

  // ============================================================================
  // GAME STATE CACHING
  // ============================================================================

  async cacheGameState(userId, gameState, ttl = 300) {
    const key = `game_state:${userId}`;
    await this.redis.setex(key, ttl, JSON.stringify(gameState));
    this.cacheStats.sets++;
  }

  async getGameState(userId) {
    const key = `game_state:${userId}`;
    const data = await this.redis.get(key);
    
    if (data) {
      this.cacheStats.hits++;
      return JSON.parse(data);
    } else {
      this.cacheStats.misses++;
      return null;
    }
  }

  async updateGameState(userId, updates) {
    const key = `game_state:${userId}`;
    const current = await this.getGameState(userId);
    
    if (current) {
      const updated = { ...current, ...updates, lastUpdate: Date.now() };
      await this.redis.setex(key, 300, JSON.stringify(updated));
      this.cacheStats.sets++;
    }
  }

  // ============================================================================
  // FACTION WARFARE CACHING
  // ============================================================================

  async cacheFactionStats(faction, stats, ttl = 120) {
    const key = `faction:${faction}`;
    await this.redis.setex(key, ttl, JSON.stringify(stats));
    this.cacheStats.sets++;
  }

  async getFactionStats(faction) {
    const key = `faction:${faction}`;
    const data = await this.redis.get(key);
    
    if (data) {
      this.cacheStats.hits++;
      return JSON.parse(data);
    } else {
      this.cacheStats.misses++;
      return null;
    }
  }

  async incrementFactionScore(faction, points) {
    const key = `faction:${faction}:score`;
    const newScore = await this.redis.incrby(key, points);
    await this.redis.expire(key, 86400); // 24 hours
    return newScore;
  }

  // ============================================================================
  // REAL-TIME EVENTS CACHING
  // ============================================================================

  async publishGameEvent(eventType, data) {
    const channel = `game_events:${eventType}`;
    await this.redis.publish(channel, JSON.stringify(data));
  }

  async subscribeToGameEvents(eventType, callback) {
    const channel = `game_events:${eventType}`;
    const subscriber = this.redis.duplicate();
    
    await subscriber.subscribe(channel);
    subscriber.on('message', (channel, message) => {
      try {
        callback(JSON.parse(message));
      } catch (error) {
        console.error('Error parsing game event:', error);
      }
    });
    
    return subscriber;
  }

  // ============================================================================
  // CACHE WARMING AND PRECOMPUTATION
  // ============================================================================

  async warmupCache() {
    console.log('🔥 Warming up cache...');
    
    try {
      // Cache top leaderboards
      await this.precomputeLeaderboards();
      
      // Cache faction statistics
      await this.precomputeFactionStats();
      
      // Cache active territories
      await this.precomputeTerritories();
      
      console.log('✅ Cache warmup completed');
    } catch (error) {
      console.error('❌ Cache warmup failed:', error);
    }
  }

  async precomputeLeaderboards() {
    // This would typically call database functions and cache results
    const leaderboardTypes = ['global', 'iran', 'usa', 'daily', 'weekly'];
    
    for (const type of leaderboardTypes) {
      // Simulate precomputation
      await this.cacheLeaderboard(type, { 
        type, 
        data: [], 
        lastUpdate: Date.now() 
      }, 300);
    }
  }

  async precomputeFactionStats() {
    const factions = ['iran', 'usa'];
    
    for (const faction of factions) {
      const stats = {
        totalPlayers: 0,
        totalScore: 0,
        territories: 0,
        lastUpdate: Date.now()
      };
      
      await this.cacheFactionStats(faction, stats, 120);
    }
  }

  async precomputeTerritories() {
    // This would fetch all territories and cache them
    // Implementation depends on your territory data structure
    console.log('🗺️ Precomputing territory data...');
  }

  // ============================================================================
  // CACHE INVALIDATION STRATEGIES
  // ============================================================================

  async invalidateUserCache(userId) {
    const patterns = [
      `user:${userId}`,
      `game_state:${userId}`,
      `rate_limit:*:${userId}`,
      `tap:${userId}`
    ];
    
    for (const pattern of patterns) {
      if (pattern.includes('*')) {
        const keys = await this.redis.keys(pattern);
        if (keys.length > 0) {
          await this.redis.del(...keys);
        }
      } else {
        await this.redis.del(pattern);
      }
    }
    
    this.cacheStats.deletes += patterns.length;
  }

  async invalidateLeaderboardCache(type = null) {
    if (type) {
      await this.redis.del(`leaderboard:${type}`);
    } else {
      const keys = await this.redis.keys('leaderboard:*');
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    }
    
    this.cacheStats.deletes++;
  }

  // ============================================================================
  // MONITORING AND STATISTICS
  // ============================================================================

  getCacheStats() {
    const hitRate = this.cacheStats.hits + this.cacheStats.misses > 0 
      ? (this.cacheStats.hits / (this.cacheStats.hits + this.cacheStats.misses)) * 100 
      : 0;

    return {
      ...this.cacheStats,
      hitRate: Math.round(hitRate * 100) / 100,
      totalOperations: this.cacheStats.hits + this.cacheStats.misses + this.cacheStats.sets + this.cacheStats.deletes
    };
  }

  async getRedisInfo() {
    try {
      const info = await this.redis.info('memory');
      const keyspace = await this.redis.info('keyspace');
      
      return {
        memory: info,
        keyspace: keyspace,
        cacheStats: this.getCacheStats()
      };
    } catch (error) {
      console.error('Error getting Redis info:', error);
      return null;
    }
  }

  startStatsReporting() {
    setInterval(() => {
      const stats = this.getCacheStats();
      console.log('📊 Cache Stats:', {
        hitRate: `${stats.hitRate}%`,
        hits: stats.hits,
        misses: stats.misses,
        sets: stats.sets,
        deletes: stats.deletes
      });
    }, 60000); // Report every minute
  }

  // ============================================================================
  // GRACEFUL SHUTDOWN
  // ============================================================================

  async close() {
    if (this.redis) {
      await this.redis.quit();
      console.log('✅ Redis cache connection closed');
    }
  }
}

// Singleton instance
const gamingCache = new GamingCacheManager();

module.exports = gamingCache;
