const { Pool } = require('pg');

class ReadReplicaManager {
  constructor() {
    this.primaryPool = null;
    this.replicaPools = [];
    this.currentReplica = 0;
    this.isInitialized = false;
  }

  async initialize() {
    if (this.isInitialized) return;

    // Primary database (write operations)
    this.primaryPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 20, // Connection pool size
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    });

    // Read replicas (read operations)
    const replicaUrls = this.getReplicaUrls();
    
    for (const replicaUrl of replicaUrls) {
      const replicaPool = new Pool({
        connectionString: replicaUrl,
        max: 30, // Larger pool for reads
        idleTimeoutMillis: 60000,
        connectionTimeoutMillis: 2000,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      });
      
      this.replicaPools.push({
        pool: replicaPool,
        isHealthy: true,
        lastCheck: new Date(),
        url: replicaUrl
      });
    }

    // Start health checking
    this.startHealthChecking();
    
    this.isInitialized = true;
    console.log('✅ Read replica manager initialized with', this.replicaPools.length, 'replicas');
  }

  getReplicaUrls() {
    // Environment variables for read replicas
    const replicaUrls = [];
    
    if (process.env.DATABASE_REPLICA_1) {
      replicaUrls.push(process.env.DATABASE_REPLICA_1);
    }
    if (process.env.DATABASE_REPLICA_2) {
      replicaUrls.push(process.env.DATABASE_REPLICA_2);
    }
    if (process.env.DATABASE_REPLICA_3) {
      replicaUrls.push(process.env.DATABASE_REPLICA_3);
    }

    // Fallback to primary if no replicas configured
    return replicaUrls.length > 0 ? replicaUrls : [process.env.DATABASE_URL];
  }

  // Write operations - always use primary
  async write(query, params = []) {
    const client = await this.primaryPool.connect();
    try {
      const result = await client.query(query, params);
      return result;
    } finally {
      client.release();
    }
  }

  // Read operations - use round-robin load balancing
  async read(query, params = []) {
    const healthyReplicas = this.replicaPools.filter(r => r.isHealthy);
    
    if (healthyReplicas.length === 0) {
      // Fallback to primary if no healthy replicas
      console.warn('⚠️ No healthy replicas, falling back to primary');
      return this.write(query, params);
    }

    // Round-robin selection
    const replica = healthyReplicas[this.currentReplica % healthyReplicas.length];
    this.currentReplica++;

    const client = await replica.pool.connect();
    try {
      const result = await client.query(query, params);
      return result;
    } catch (error) {
      console.error('❌ Replica query failed:', error.message);
      // Mark replica as unhealthy and fallback to next
      replica.isHealthy = false;
      return this.read(query, params); // Retry with next replica
    } finally {
      client.release();
    }
  }

  // Transaction operations - always use primary
  async transaction(callback) {
    const client = await this.primaryPool.connect();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Health checking for replicas
  async startHealthChecking() {
    setInterval(async () => {
      for (const replica of this.replicaPools) {
        try {
          const client = await replica.pool.connect();
          await client.query('SELECT 1');
          client.release();
          
          if (!replica.isHealthy) {
            console.log('✅ Replica recovered:', replica.url);
          }
          replica.isHealthy = true;
          replica.lastCheck = new Date();
        } catch (error) {
          if (replica.isHealthy) {
            console.error('❌ Replica unhealthy:', replica.url, error.message);
          }
          replica.isHealthy = false;
        }
      }
    }, 30000); // Check every 30 seconds
  }

  // Get statistics
  getStats() {
    return {
      totalReplicas: this.replicaPools.length,
      healthyReplicas: this.replicaPools.filter(r => r.isHealthy).length,
      currentReplica: this.currentReplica,
      primaryPool: {
        totalCount: this.primaryPool.totalCount,
        idleCount: this.primaryPool.idleCount,
        waitingCount: this.primaryPool.waitingCount
      }
    };
  }

  // Graceful shutdown
  async close() {
    await this.primaryPool.end();
    
    for (const replica of this.replicaPools) {
      await replica.pool.end();
    }
    
    console.log('✅ All database connections closed');
  }
}

// Singleton instance
const readReplicaManager = new ReadReplicaManager();

module.exports = readReplicaManager;
