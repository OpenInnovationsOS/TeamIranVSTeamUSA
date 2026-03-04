const readReplicaManager = require('../database/read-replica-config');
const gamingCache = require('../utils/redis-gaming-cache');

class PerformanceMonitor {
  constructor() {
    this.metrics = {
      queries: new Map(),
      slowQueries: [],
      connections: {
        primary: { active: 0, total: 0 },
        replicas: { active: 0, total: 0 }
      },
      cache: {
        hits: 0,
        misses: 0,
        hitRate: 0
      },
      alerts: []
    };
    
    this.thresholds = {
      slowQuery: 100, // ms
      connectionPool: 0.8, // 80% utilization
      cacheHitRate: 0.7, // 70% hit rate
      memoryUsage: 0.9 // 90% memory usage
    };

    this.isMonitoring = false;
  }

  async initialize() {
    if (this.isMonitoring) return;

    // Initialize monitoring intervals
    this.startQueryMonitoring();
    this.startConnectionMonitoring();
    this.startCacheMonitoring();
    this.startSystemMonitoring();
    this.startAlerting();

    this.isMonitoring = true;
    console.log('✅ Performance monitor initialized');
  }

  // ============================================================================
  // QUERY MONITORING
  // ============================================================================

  startQueryMonitoring() {
    setInterval(async () => {
      await this.collectQueryMetrics();
    }, 30000); // Every 30 seconds
  }

  async collectQueryMetrics() {
    try {
      // Get query statistics from PostgreSQL
      const result = await readReplicaManager.read(`
        SELECT 
          query,
          calls,
          total_exec_time,
          mean_exec_time,
          rows,
          100.0 * shared_blks_hit / nullif(shared_blks_hit + shared_blks_read, 0) AS hit_percent
        FROM pg_stat_statements 
        WHERE calls > 5
        ORDER BY mean_exec_time DESC
        LIMIT 20
      `);

      if (result && result.rows) {
        result.rows.forEach(row => {
          const queryHash = this.hashQuery(row.query);
          
          this.metrics.queries.set(queryHash, {
            query: row.query.substring(0, 100) + '...',
            calls: parseInt(row.calls),
            totalTime: parseFloat(row.total_exec_time),
            avgTime: parseFloat(row.mean_exec_time),
            rows: parseInt(row.rows),
            hitRate: parseFloat(row.hit_percent),
            lastUpdate: new Date()
          });

          // Check for slow queries
          if (row.mean_exec_time > this.thresholds.slowQuery) {
            this.addSlowQuery({
              query: row.query,
              avgTime: row.mean_exec_time,
              calls: row.calls,
              timestamp: new Date()
            });
          }
        });
      }
    } catch (error) {
      console.error('❌ Error collecting query metrics:', error);
    }
  }

  hashQuery(query) {
    // Simple hash for query identification
    return require('crypto')
      .createHash('md5')
      .update(query.replace(/\d+/g, '?')) // Normalize numbers
      .digest('hex')
      .substring(0, 8);
  }

  addSlowQuery(slowQuery) {
    this.metrics.slowQueries.unshift(slowQuery);
    
    // Keep only last 100 slow queries
    if (this.metrics.slowQueries.length > 100) {
      this.metrics.slowQueries = this.metrics.slowQueries.slice(0, 100);
    }

    // Trigger alert for very slow queries
    if (slowQuery.avgTime > this.thresholds.slowQuery * 2) {
      this.addAlert('CRITICAL', `Very slow query detected: ${slowQuery.avgTime.toFixed(2)}ms`, {
        query: slowQuery.query.substring(0, 200),
        avgTime: slowQuery.avgTime
      });
    }
  }

  // ============================================================================
  // CONNECTION MONITORING
  // ============================================================================

  startConnectionMonitoring() {
    setInterval(async () => {
      await this.collectConnectionMetrics();
    }, 10000); // Every 10 seconds
  }

  async collectConnectionMetrics() {
    try {
      const stats = readReplicaManager.getStats();
      
      this.metrics.connections = {
        primary: {
          active: stats.primaryPool.idleCount,
          total: stats.primaryPool.totalCount,
          utilization: stats.primaryPool.totalCount > 0 
            ? stats.primaryPool.waitingCount / stats.primaryPool.totalCount 
            : 0
        },
        replicas: {
          healthy: stats.healthyReplicas,
          total: stats.totalReplicas,
          utilization: stats.healthyReplicas > 0 
            ? (stats.totalReplicas - stats.healthyReplicas) / stats.totalReplicas 
            : 0
        }
      };

      // Check connection pool utilization
      if (this.metrics.connections.primary.utilization > this.thresholds.connectionPool) {
        this.addAlert('WARNING', 'Primary connection pool high utilization', {
          utilization: (this.metrics.connections.primary.utilization * 100).toFixed(1) + '%'
        });
      }

      if (this.metrics.connections.replicas.utilization > this.thresholds.connectionPool) {
        this.addAlert('WARNING', 'Too many unhealthy replicas', {
          healthy: this.metrics.connections.replicas.healthy,
          total: this.metrics.connections.replicas.total
        });
      }
    } catch (error) {
      console.error('❌ Error collecting connection metrics:', error);
    }
  }

  // ============================================================================
  // CACHE MONITORING
  // ============================================================================

  startCacheMonitoring() {
    setInterval(async () => {
      await this.collectCacheMetrics();
    }, 30000); // Every 30 seconds
  }

  async collectCacheMetrics() {
    try {
      const cacheStats = gamingCache.getCacheStats();
      const redisInfo = await gamingCache.getRedisInfo();
      
      this.metrics.cache = {
        hits: cacheStats.hits,
        misses: cacheStats.misses,
        hitRate: cacheStats.hitRate,
        memory: redisInfo ? this.parseRedisMemory(redisInfo.memory) : null
      };

      // Check cache hit rate
      if (this.metrics.cache.hitRate < this.thresholds.cacheHitRate) {
        this.addAlert('WARNING', 'Low cache hit rate', {
          hitRate: this.metrics.cache.hitRate.toFixed(1) + '%',
          threshold: (this.thresholds.cacheHitRate * 100) + '%'
        });
      }

      // Check memory usage
      if (this.metrics.cache.memory && 
          this.metrics.cache.memory.usagePercent > this.thresholds.memoryUsage) {
        this.addAlert('CRITICAL', 'Redis memory usage high', {
          usagePercent: this.metrics.cache.memory.usagePercent.toFixed(1) + '%',
          used: this.metrics.cache.memory.used,
          max: this.metrics.cache.memory.max
        });
      }
    } catch (error) {
      console.error('❌ Error collecting cache metrics:', error);
    }
  }

  parseRedisMemory(memoryInfo) {
    const lines = memoryInfo.split('\r\n');
    const memory = {};
    
    lines.forEach(line => {
      if (line.includes('used_memory:')) {
        memory.used = parseInt(line.split(':')[1]);
      }
      if (line.includes('maxmemory:')) {
        memory.max = parseInt(line.split(':')[1]);
      }
    });

    if (memory.used && memory.max) {
      memory.usagePercent = memory.used / memory.max;
    }

    return memory;
  }

  // ============================================================================
  // SYSTEM MONITORING
  // ============================================================================

  startSystemMonitoring() {
    setInterval(async () => {
      await this.collectSystemMetrics();
    }, 60000); // Every minute
  }

  async collectSystemMetrics() {
    try {
      const memUsage = process.memoryUsage();
      const cpuUsage = process.cpuUsage();
      
      const systemMetrics = {
        memory: {
          rss: memUsage.rss,
          heapTotal: memUsage.heapTotal,
          heapUsed: memUsage.heapUsed,
          external: memUsage.external
        },
        cpu: {
          user: cpuUsage.user,
          system: cpuUsage.system
        },
        uptime: process.uptime(),
        timestamp: new Date()
      };

      // Store system metrics (could be sent to monitoring service)
      this.metrics.system = systemMetrics;

      // Check for memory leaks
      if (memUsage.heapUsed > 500 * 1024 * 1024) { // 500MB
        this.addAlert('WARNING', 'High memory usage detected', {
          heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024) + 'MB'
        });
      }
    } catch (error) {
      console.error('❌ Error collecting system metrics:', error);
    }
  }

  // ============================================================================
  // ALERTING SYSTEM
  // ============================================================================

  startAlerting() {
    // Clean old alerts every hour
    setInterval(() => {
      this.cleanupOldAlerts();
    }, 3600000);
  }

  addAlert(level, message, metadata = {}) {
    const alert = {
      id: Date.now() + Math.random(),
      level,
      message,
      metadata,
      timestamp: new Date()
    };

    this.metrics.alerts.unshift(alert);
    
    // Keep only last 100 alerts
    if (this.metrics.alerts.length > 100) {
      this.metrics.alerts = this.metrics.alerts.slice(0, 100);
    }

    // Log alert
    console.log(`🚨 [${level}] ${message}`, metadata);

    // Could send to external monitoring service here
    // await this.sendAlertToService(alert);
  }

  cleanupOldAlerts() {
    const oneHourAgo = Date.now() - 3600000;
    this.metrics.alerts = this.metrics.alerts.filter(
      alert => alert.timestamp.getTime() > oneHourAgo
    );
  }

  // ============================================================================
  // PERFORMANCE ANALYSIS
  // ============================================================================

  getPerformanceReport() {
    const topSlowQueries = this.metrics.slowQueries
      .slice(0, 10)
      .map(q => ({
        query: q.query.substring(0, 100) + '...',
        avgTime: q.avgTime.toFixed(2) + 'ms',
        calls: q.calls,
        timestamp: q.timestamp
      }));

    const topQueriesByCalls = Array.from(this.metrics.queries.values())
      .sort((a, b) => b.calls - a.calls)
      .slice(0, 10)
      .map(q => ({
        query: q.query,
        calls: q.calls,
        avgTime: q.avgTime.toFixed(2) + 'ms',
        hitRate: q.hitRate.toFixed(1) + '%'
      }));

    return {
      timestamp: new Date(),
      summary: {
        totalQueries: this.metrics.queries.size,
        slowQueries: this.metrics.slowQueries.length,
        cacheHitRate: this.metrics.cache.hitRate.toFixed(1) + '%',
        connectionUtilization: {
          primary: (this.metrics.connections.primary.utilization * 100).toFixed(1) + '%',
          replicas: (this.metrics.connections.replicas.utilization * 100).toFixed(1) + '%'
        }
      },
      topSlowQueries,
      topQueriesByCalls,
      recentAlerts: this.metrics.alerts.slice(0, 5),
      system: this.metrics.system
    };
  }

  // ============================================================================
  // OPTIMIZATION RECOMMENDATIONS
  // ============================================================================

  getOptimizationRecommendations() {
    const recommendations = [];

    // Analyze slow queries
    const verySlowQueries = this.metrics.slowQueries.filter(q => q.avgTime > 500);
    if (verySlowQueries.length > 0) {
      recommendations.push({
        priority: 'HIGH',
        category: 'QUERIES',
        title: 'Optimize slow queries',
        description: `${verySlowQueries.length} queries running slower than 500ms`,
        action: 'Review query execution plans and add appropriate indexes'
      });
    }

    // Analyze cache performance
    if (this.metrics.cache.hitRate < 0.7) {
      recommendations.push({
        priority: 'MEDIUM',
        category: 'CACHE',
        title: 'Improve cache hit rate',
        description: `Current hit rate: ${(this.metrics.cache.hitRate * 100).toFixed(1)}%`,
        action: 'Review caching strategy and TTL values'
      });
    }

    // Analyze connection usage
    if (this.metrics.connections.primary.utilization > 0.8) {
      recommendations.push({
        priority: 'HIGH',
        category: 'CONNECTIONS',
        title: 'Increase connection pool size',
        description: `Primary pool utilization: ${(this.metrics.connections.primary.utilization * 100).toFixed(1)}%`,
        action: 'Consider increasing max connections or adding read replicas'
      });
    }

    // Analyze replica health
    if (this.metrics.connections.replicas.healthy < this.metrics.connections.replicas.total) {
      recommendations.push({
        priority: 'HIGH',
        category: 'REPLICAS',
        title: 'Unhealthy read replicas detected',
        description: `${this.metrics.connections.replicas.total - this.metrics.connections.replicas.healthy} replicas down`,
        action: 'Check replica connectivity and configuration'
      });
    }

    return recommendations.sort((a, b) => {
      const priorityOrder = { 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  // ============================================================================
  // HEALTH CHECK ENDPOINT
  // ============================================================================

  async getHealthStatus() {
    const report = this.getPerformanceReport();
    const recommendations = this.getOptimizationRecommendations();
    
    const criticalAlerts = this.metrics.alerts.filter(a => a.level === 'CRITICAL');
    const warningAlerts = this.metrics.alerts.filter(a => a.level === 'WARNING');
    
    let status = 'healthy';
    if (criticalAlerts.length > 0) {
      status = 'critical';
    } else if (warningAlerts.length > 0) {
      status = 'warning';
    }

    return {
      status,
      timestamp: new Date(),
      metrics: report,
      recommendations,
      alerts: {
        critical: criticalAlerts.length,
        warning: warningAlerts.length,
        total: this.metrics.alerts.length
      }
    };
  }

  // ============================================================================
  // GRACEFUL SHUTDOWN
  // ============================================================================

  async shutdown() {
    this.isMonitoring = false;
    console.log('📊 Performance monitor shutdown complete');
  }
}

// Singleton instance
const performanceMonitor = new PerformanceMonitor();

module.exports = performanceMonitor;
