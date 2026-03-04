const Redis = require('ioredis');

let redis;

async function connectRedis() {
  try {
    redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT) || 6379,
      password: process.env.REDIS_PASSWORD,
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    });

    redis.on('connect', () => {
      console.log('Redis connected successfully');
    });

    redis.on('error', (err) => {
      console.error('Redis connection error:', err);
    });

    redis.on('close', () => {
      console.log('Redis connection closed');
    });

    await redis.connect();
    return redis;
  } catch (error) {
    console.error('Failed to connect to Redis:', error);
    throw error;
  }
}

function getRedis() {
  if (!redis) {
    throw new Error('Redis not initialized. Call connectRedis() first.');
  }
  return redis;
}

// Rate limiting helper functions
async function checkRateLimit(userId, action, limit, windowMs) {
  const key = `rate_limit:${action}:${userId}`;
  const current = await redis.incr(key);
  
  if (current === 1) {
    await redis.expire(key, Math.ceil(windowMs / 1000));
  }
  
  return current <= limit;
}

// Tap-to-earn rate limiting
async function checkTapLimit(userId) {
  const key = `tap:${userId}`;
  const taps = await redis.incr(key);
  
  if (taps === 1) {
    await redis.expire(key, 60); // 60 seconds window
  }
  
  const maxTaps = parseInt(process.env.MAX_TAPS_PER_MINUTE) || 60;
  return { allowed: taps <= maxTaps, currentTaps: taps, maxTaps };
}

// Cache helper functions
async function setCache(key, value, ttl = 3600) {
  await redis.setex(key, ttl, JSON.stringify(value));
}

async function getCache(key) {
  const value = await redis.get(key);
  return value ? JSON.parse(value) : null;
}

async function deleteCache(key) {
  await redis.del(key);
}

// Leaderboard caching
async function updateLeaderboard(leaderboard, userId, score) {
  await redis.zadd(leaderboard, score, userId);
}

async function getLeaderboard(leaderboard, start = 0, end = 9) {
  return await redis.zrevrange(leaderboard, start, end, 'WITHSCORES');
}

// Faction territory control
async function setTerritoryControl(territoryId, faction, score) {
  const key = `territory:${territoryId}`;
  await redis.hset(key, 'faction', faction, 'score', score);
  await redis.expire(key, 86400); // 24 hours
}

async function getTerritoryControl(territoryId) {
  const key = `territory:${territoryId}`;
  return await redis.hgetall(key);
}

// Real-time game state
async function setGameState(userId, gameState) {
  const key = `game_state:${userId}`;
  await redis.setex(key, 300, JSON.stringify(gameState)); // 5 minutes
}

async function getGameState(userId) {
  const key = `game_state:${userId}`;
  const state = await redis.get(key);
  return state ? JSON.parse(state) : null;
}

module.exports = {
  connectRedis,
  getRedis,
  checkRateLimit,
  checkTapLimit,
  setCache,
  getCache,
  deleteCache,
  updateLeaderboard,
  getLeaderboard,
  setTerritoryControl,
  getTerritoryControl,
  setGameState,
  getGameState
};
