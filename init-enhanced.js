
// Enhanced Systems Initialization
console.log('🚀 Initializing enhanced gaming systems...');

// Database optimizations
console.log('🗄️ Applying database optimizations...');
const { Client } = require('pg');
const client = new Client({
  connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/team_iran_vs_usa'
});

client.connect().then(async () => {
  // Enable extensions
  await client.query('CREATE EXTENSION IF NOT EXISTS "pg_stat_statements"');
  await client.query('CREATE EXTENSION IF NOT EXISTS "pg_trgm"');
  
  // Create critical indexes
  const indexes = [
    'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_telegram_id_unique ON users(telegram_id)',
    'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_faction_balance_desc ON users(faction, stg_balance DESC, level DESC)',
    'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_battles_status_created ON battles(status, created_at DESC)',
    'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_battles_battle_data_gin ON battles USING GIN (battle_data)',
    'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transactions_user_type_created ON transactions(user_id, type, created_at DESC)'
  ];
  
  for (const index of indexes) {
    try {
      await client.query(index);
      console.log('✅ Index created:', index.split('idx_')[1].split(' ')[0]);
    } catch (err) {
      console.log('⚠️ Index may already exist:', err.message);
    }
  }
  
  await client.end();
  console.log('✅ Database optimizations complete');
}).catch(err => {
  console.error('❌ Database optimization failed:', err.message);
});

// Redis cache initialization
console.log('🗄️ Initializing Redis cache...');
try {
  const gamingCache = require('./utils/redis-gaming-cache');
  gamingCache.initialize().then(() => {
    console.log('✅ Redis cache initialized');
    gamingCache.warmupCache().then(() => {
      console.log('✅ Cache warmup completed');
    });
  });
} catch (err) {
  console.error('❌ Redis cache failed:', err.message);
}

// Performance monitoring
console.log('📊 Starting performance monitoring...');
try {
  const performanceMonitor = require('./monitoring/performance-monitor');
  performanceMonitor.initialize().then(() => {
    console.log('✅ Performance monitoring active');
    
    // Log performance every minute
    setInterval(() => {
      const report = performanceMonitor.getPerformanceReport();
      console.log('📊 Performance:', {
        queries: report.summary.totalQueries,
        cacheHitRate: report.summary.cacheHitRate,
        connections: report.summary.connectionUtilization
      });
    }, 60000);
  });
} catch (err) {
  console.error('❌ Performance monitoring failed:', err.message);
}

console.log('🎮 Enhanced systems initialization complete!');
