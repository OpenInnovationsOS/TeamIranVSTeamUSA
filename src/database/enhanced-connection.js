const { Pool } = require('pg');
const readReplicaManager = require('./read-replica-config');

class EnhancedDatabaseConnection {
  constructor() {
    this.primaryPool = null;
    this.replicaManager = null;
    this.isInitialized = false;
    this.connectionStats = {
      totalQueries: 0,
      totalErrors: 0,
      avgQueryTime: 0,
      slowQueries: 0,
      connectionPoolStats: {
        primary: { active: 0, idle: 0, waiting: 0 },
        replicas: { active: 0, idle: 0, waiting: 0 }
      }
    };
  }

  async initialize() {
    if (this.isInitialized) return;

    try {
      // Initialize read replica manager
      await readReplicaManager.initialize();
      this.replicaManager = readReplicaManager;

      // Initialize primary connection pool with PgBouncer
      this.primaryPool = new Pool({
        connectionString: process.env.DATABASE_URL,
        host: process.env.PGBOUNCER_HOST || 'localhost',
        port: process.env.PGBOUNCER_PORT || 6432,
        user: process.env.PGBOUNCER_USER || 'postgres',
        password: process.env.PGBOUNCER_PASSWORD,
        database: process.env.PGBOUNCER_DATABASE || 'team_iran_vs_usa',
        max: 20, // PgBouncer handles the actual pooling
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
        // Application name for monitoring
        application_name: 'team_iran_vs_usa_gaming',
        // Enable statement timeout
        statement_timeout: 30000,
        // Enable query timeout
        query_timeout: 30000
      });

      // Handle pool events
      this.primaryPool.on('connect', () => {
        console.log('✅ Primary database connected via PgBouncer');
      });

      this.primaryPool.on('error', (err) => {
        console.error('❌ Primary database error:', err);
        this.connectionStats.totalErrors++;
      });

      this.primaryPool.on('remove', () => {
        console.log('🔌 Primary database connection removed');
      });

      // Test the connection
      const client = await this.primaryPool.connect();
      await client.query('SELECT NOW()');
      client.release();

      this.isInitialized = true;
      console.log('✅ Enhanced database connection initialized with PgBouncer');
      
      // Start connection monitoring
      this.startConnectionMonitoring();
      
    } catch (error) {
      console.error('❌ Failed to initialize enhanced database connection:', error);
      throw error;
    }
  }

  // ============================================================================
  // QUERY EXECUTION WITH MONITORING
  // ============================================================================

  async executeQuery(queryType, query, params = [], options = {}) {
    const startTime = Date.now();
    this.connectionStats.totalQueries++;

    try {
      let result;
      
      // Route query based on type
      switch (queryType) {
        case 'write':
          result = await this.executeWriteQuery(query, params, options);
          break;
        case 'read':
          result = await this.executeReadQuery(query, params, options);
          break;
        case 'transaction':
          result = await this.executeTransaction(query, params, options);
          break;
        default:
          throw new Error(`Invalid query type: ${queryType}`);
      }

      // Update statistics
      const queryTime = Date.now() - startTime;
      this.updateQueryStats(queryTime, query);

      return result;
    } catch (error) {
      this.connectionStats.totalErrors++;
      const queryTime = Date.now() - startTime;
      this.updateQueryStats(queryTime, query, error);
      
      throw error;
    }
  }

  async executeWriteQuery(query, params, options) {
    const client = await this.primaryPool.connect();
    try {
      const result = await client.query(query, params);
      
      // Invalidate relevant caches on write operations
      if (options.invalidateCache) {
        await this.invalidateCacheForQuery(query, params);
      }
      
      return result;
    } finally {
      client.release();
    }
  }

  async executeReadQuery(query, params, options) {
    // Use read replica manager for read operations
    return await this.replicaManager.read(query, params);
  }

  async executeTransaction(queries, options = {}) {
    const client = await this.primaryPool.connect();
    try {
      await client.query('BEGIN');
      
      const results = [];
      for (const queryObj of queries) {
        const result = await client.query(queryObj.query, queryObj.params);
        results.push(result);
      }
      
      await client.query('COMMIT');
      
      // Invalidate caches after successful transaction
      if (options.invalidateCache) {
        for (const queryObj of queries) {
          await this.invalidateCacheForQuery(queryObj.query, queryObj.params);
        }
      }
      
      return results;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // ============================================================================
  // CACHE INVALIDATION
  // ============================================================================

  async invalidateCacheForQuery(query, params) {
    const gamingCache = require('../utils/redis-gaming-cache');
    
    // User-related queries
    if (query.includes('users') && query.includes('UPDATE')) {
      const userId = params.find(p => typeof p === 'number');
      if (userId) {
        await gamingCache.invalidateUserCache(userId);
      }
    }
    
    // Battle-related queries
    if (query.includes('battles') && query.includes('INSERT')) {
      await gamingCache.invalidateLeaderboardCache();
    }
    
    // Transaction-related queries
    if (query.includes('transactions') && query.includes('INSERT')) {
      const userId = params.find(p => typeof p === 'number');
      if (userId) {
        await gamingCache.invalidateUserCache(userId);
      }
    }
    
    // Territory-related queries
    if (query.includes('territories') && query.includes('UPDATE')) {
      // Invalidate all territory caches
      const cache = require('../utils/redis-gaming-cache');
      // Implementation depends on your caching strategy
    }
  }

  // ============================================================================
  // CONNECTION MONITORING
  // ============================================================================

  startConnectionMonitoring() {
    setInterval(() => {
      this.updateConnectionStats();
    }, 10000); // Every 10 seconds
  }

  updateConnectionStats() {
    try {
      // Get primary pool stats
      const primaryStats = {
        totalCount: this.primaryPool.totalCount,
        idleCount: this.primaryPool.idleCount,
        waitingCount: this.primaryPool.waitingCount
      };
      
      this.connectionStats.connectionPoolStats.primary = primaryStats;
      
      // Get replica stats
      const replicaStats = this.replicaManager.getStats();
      this.connectionStats.connectionPoolStats.replicas = {
        active: replicaStats.healthyReplicas,
        total: replicaStats.totalReplicas,
        utilization: replicaStats.totalReplicas > 0 
          ? (replicaStats.totalReplicas - replicaStats.healthyReplicas) / replicaStats.totalReplicas 
          : 0
      };
      
    } catch (error) {
      console.error('Error updating connection stats:', error);
    }
  }

  updateQueryStats(queryTime, query, error = null) {
    // Update average query time
    const totalQueries = this.connectionStats.totalQueries;
    this.connectionStats.avgQueryTime = 
      (this.connectionStats.avgQueryTime * (totalQueries - 1) + queryTime) / totalQueries;
    
    // Track slow queries
    if (queryTime > 100) { // Queries slower than 100ms
      this.connectionStats.slowQueries++;
      
      // Log slow query
      console.warn('🐌 Slow query detected:', {
        queryTime: `${queryTime}ms`,
        query: query.substring(0, 200) + '...',
        error: error ? error.message : null
      });
    }
    
    // Log errors
    if (error) {
      console.error('❌ Query error:', {
        queryTime: `${queryTime}ms`,
        query: query.substring(0, 200) + '...',
        error: error.message
      });
    }
  }

  // ============================================================================
  // HEALTH CHECKS
  // ============================================================================

  async healthCheck() {
    try {
      // Test primary connection
      const primaryClient = await this.primaryPool.connect();
      await primaryClient.query('SELECT NOW()');
      primaryClient.release();
      
      // Test replica connections
      const replicaStats = this.replicaManager.getStats();
      
      return {
        status: 'healthy',
        timestamp: new Date(),
        connections: {
          primary: {
            status: 'connected',
            pool: this.connectionStats.connectionPoolStats.primary
          },
          replicas: {
            status: replicaStats.healthyReplicas > 0 ? 'connected' : 'degraded',
            healthy: replicaStats.healthyReplicas,
            total: replicaStats.totalReplicas,
            pool: this.connectionStats.connectionPoolStats.replicas
          }
        },
        performance: {
          totalQueries: this.connectionStats.totalQueries,
          totalErrors: this.connectionStats.totalErrors,
          avgQueryTime: Math.round(this.connectionStats.avgQueryTime * 100) / 100,
          slowQueries: this.connectionStats.slowQueries,
          errorRate: this.connectionStats.totalQueries > 0 
            ? (this.connectionStats.totalErrors / this.connectionStats.totalQueries * 100).toFixed(2) + '%'
            : '0%'
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        timestamp: new Date(),
        error: error.message
      };
    }
  }

  // ============================================================================
  // PERFORMANCE ANALYTICS
  // ============================================================================

  getPerformanceReport() {
    return {
      timestamp: new Date(),
      connectionStats: this.connectionStats,
      health: {
        status: this.connectionStats.totalErrors < this.connectionStats.totalQueries * 0.01 ? 'healthy' : 'degraded',
        errorRate: this.connectionStats.totalQueries > 0 
          ? (this.connectionStats.totalErrors / this.connectionStats.totalQueries * 100).toFixed(2) + '%'
          : '0%'
      },
      recommendations: this.getPerformanceRecommendations()
    };
  }

  getPerformanceRecommendations() {
    const recommendations = [];
    
    // Check error rate
    const errorRate = this.connectionStats.totalQueries > 0 
      ? this.connectionStats.totalErrors / this.connectionStats.totalQueries 
      : 0;
    
    if (errorRate > 0.05) { // 5% error rate
      recommendations.push({
        priority: 'HIGH',
        category: 'ERRORS',
        title: 'High error rate detected',
        description: `Error rate: ${(errorRate * 100).toFixed(1)}%`,
        action: 'Check database connectivity and query syntax'
      });
    }
    
    // Check average query time
    if (this.connectionStats.avgQueryTime > 200) { // 200ms average
      recommendations.push({
        priority: 'MEDIUM',
        category: 'PERFORMANCE',
        title: 'Slow average query time',
        description: `Average query time: ${Math.round(this.connectionStats.avgQueryTime)}ms`,
        action: 'Review query optimization and indexing'
      });
    }
    
    // Check slow queries
    if (this.connectionStats.slowQueries > this.connectionStats.totalQueries * 0.1) { // 10% slow queries
      recommendations.push({
        priority: 'MEDIUM',
        category: 'PERFORMANCE',
        title: 'High percentage of slow queries',
        description: `${this.connectionStats.slowQueries} slow queries detected`,
        action: 'Analyze slow query patterns and add appropriate indexes'
      });
    }
    
    // Check connection pool utilization
    const primaryUtilization = this.connectionStats.connectionPoolStats.primary.totalCount > 0 
      ? this.connectionStats.connectionPoolStats.primary.waitingCount / this.connectionStats.connectionPoolStats.primary.totalCount 
      : 0;
    
    if (primaryUtilization > 0.8) { // 80% utilization
      recommendations.push({
        priority: 'HIGH',
        category: 'CONNECTIONS',
        title: 'High connection pool utilization',
        description: `Primary pool utilization: ${(primaryUtilization * 100).toFixed(1)}%`,
        action: 'Consider increasing pool size or optimizing query performance'
      });
    }
    
    return recommendations;
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  async getPoolStats() {
    return {
      primary: {
        totalCount: this.primaryPool.totalCount,
        idleCount: this.primaryPool.idleCount,
        waitingCount: this.primaryPool.waitingCount
      },
      replicas: this.replicaManager.getStats(),
      stats: this.connectionStats
    };
  }

  async resetStats() {
    this.connectionStats = {
      totalQueries: 0,
      totalErrors: 0,
      avgQueryTime: 0,
      slowQueries: 0,
      connectionPoolStats: {
        primary: { active: 0, idle: 0, waiting: 0 },
        replicas: { active: 0, idle: 0, waiting: 0 }
      }
    };
  }

  // ============================================================================
  // GRACEFUL SHUTDOWN
  // ============================================================================

  async close() {
    try {
      if (this.primaryPool) {
        await this.primaryPool.end();
        console.log('✅ Primary database pool closed');
      }
      
      if (this.replicaManager) {
        await this.replicaManager.close();
        console.log('✅ Replica manager closed');
      }
      
      this.isInitialized = false;
      console.log('✅ Enhanced database connection shutdown complete');
    } catch (error) {
      console.error('❌ Error during database shutdown:', error);
      throw error;
    }
  }
}

// Singleton instance
const enhancedDatabase = new EnhancedDatabaseConnection();

module.exports = enhancedDatabase;
