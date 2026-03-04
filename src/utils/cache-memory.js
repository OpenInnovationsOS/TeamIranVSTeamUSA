// In-memory cache for Vercel deployment (replaces Redis)
class MemoryCache {
  constructor() {
    this.cache = new Map();
    this.ttlMap = new Map();
    
    // Clean up expired entries every minute
    setInterval(() => this.cleanup(), 60000);
  }

  set(key, value, ttl = 3600) {
    this.cache.set(key, JSON.stringify(value));
    if (ttl > 0) {
      this.ttlMap.set(key, Date.now() + (ttl * 1000));
    }
  }

  get(key) {
    const ttl = this.ttlMap.get(key);
    if (ttl && Date.now() > ttl) {
      this.delete(key);
      return null;
    }
    
    const value = this.cache.get(key);
    return value ? JSON.parse(value) : null;
  }

  delete(key) {
    this.cache.delete(key);
    this.ttlMap.delete(key);
  }

  exists(key) {
    const ttl = this.ttlMap.get(key);
    if (ttl && Date.now() > ttl) {
      this.delete(key);
      return false;
    }
    return this.cache.has(key);
  }

  incr(key) {
    const current = parseInt(this.get(key) || '0');
    const newValue = current + 1;
    this.set(key, newValue);
    return newValue;
  }

  expire(key, ttl) {
    if (this.cache.has(key)) {
      this.ttlMap.set(key, Date.now() + (ttl * 1000));
    }
  }

  // Rate limiting helper
  async checkRateLimit(userId, action, limit, windowMs) {
    const key = `rate_limit:${action}:${userId}`;
    const current = this.incr(key);
    
    if (current === 1) {
      this.expire(key, Math.ceil(windowMs / 1000));
    }
    
    return current <= limit;
  }

  // Tap-to-earn rate limiting
  async checkTapLimit(userId) {
    const key = `tap:${userId}`;
    const taps = this.incr(key);
    
    if (taps === 1) {
      this.expire(key, 60); // 60 seconds window
    }
    
    const maxTaps = parseInt(process.env.MAX_TAPS_PER_MINUTE) || 60;
    return { allowed: taps <= maxTaps, currentTaps: taps, maxTaps };
  }

  // Leaderboard caching (simplified)
  async updateLeaderboard(leaderboard, userId, score) {
    const key = `leaderboard:${leaderboard}`;
    let data = this.get(key) || [];
    
    // Remove existing entry for this user
    data = data.filter(entry => entry.userId !== userId);
    
    // Add new entry
    data.push({ userId, score, timestamp: Date.now() });
    
    // Sort by score (descending) and keep top 100
    data.sort((a, b) => b.score - a.score);
    data = data.slice(0, 100);
    
    this.set(key, data, 300); // 5 minutes TTL
  }

  async getLeaderboard(leaderboard, start = 0, end = 9) {
    const key = `leaderboard:${leaderboard}`;
    const data = this.get(key) || [];
    return data.slice(start, end + 1);
  }

  // Territory control caching
  async setTerritoryControl(territoryId, faction, score) {
    const key = `territory:${territoryId}`;
    this.set(key, { faction, score }, 86400); // 24 hours
  }

  async getTerritoryControl(territoryId) {
    const key = `territory:${territoryId}`;
    return this.get(key);
  }

  // Real-time game state
  async setGameState(userId, gameState) {
    const key = `game_state:${userId}`;
    this.set(key, gameState, 300); // 5 minutes
  }

  async getGameState(userId) {
    const key = `game_state:${userId}`;
    return this.get(key);
  }

  // Cleanup expired entries
  cleanup() {
    const now = Date.now();
    for (const [key, ttl] of this.ttlMap.entries()) {
      if (now > ttl) {
        this.delete(key);
      }
    }
  }

  // Get cache statistics
  getStats() {
    return {
      size: this.cache.size,
      ttlEntries: this.ttlMap.size
    };
  }
}

// Singleton instance
const memoryCache = new MemoryCache();

module.exports = {
  checkRateLimit: (userId, action, limit, windowMs) => memoryCache.checkRateLimit(userId, action, limit, windowMs),
  checkTapLimit: (userId) => memoryCache.checkTapLimit(userId),
  setCache: (key, value, ttl) => memoryCache.set(key, value, ttl),
  getCache: (key) => memoryCache.get(key),
  deleteCache: (key) => memoryCache.delete(key),
  updateLeaderboard: (leaderboard, userId, score) => memoryCache.updateLeaderboard(leaderboard, userId, score),
  getLeaderboard: (leaderboard, start, end) => memoryCache.getLeaderboard(leaderboard, start, end),
  setTerritoryControl: (territoryId, faction, score) => memoryCache.setTerritoryControl(territoryId, faction, score),
  getTerritoryControl: (territoryId) => memoryCache.getTerritoryControl(territoryId),
  setGameState: (userId, gameState) => memoryCache.setGameState(userId, gameState),
  getGameState: (userId) => memoryCache.getGameState(userId),
  getStats: () => memoryCache.getStats()
};
