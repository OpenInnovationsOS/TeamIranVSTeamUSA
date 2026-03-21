#!/usr/bin/env node

const cluster = require('cluster');
const os = require('os');
const path = require('path');

const numCPUs = os.cpus().length;
const app = require('./server-enhanced');

// Cluster configuration
const clusterConfig = {
  workers: process.env.WORKERS || Math.max(2, Math.min(numCPUs, 4)),
  maxMemory: '2048M',
  gracefulRestart: true,
  watch: false,
  env: {
    NODE_ENV: 'production',
    PORT: process.env.PORT || 3000,
    CLUSTER_WORKER: 'true'
  }
};

// Graceful shutdown handler
const gracefulShutdown = (signal) => {
  console.log(`🔄 Received ${signal}, starting graceful shutdown...`);
  
  // Stop accepting new connections
  if (server) {
    server.close(() => {
      console.log('✅ Server closed gracefully');
      process.exit(0);
    });
    
    // Force close after 30 seconds
    setTimeout(() => {
      console.log('⚠️ Forcing server shutdown');
      process.exit(1);
    }, 30000);
  }
};

// Worker setup
if (cluster.isMaster) {
  console.log(`🚀 Master ${process.pid} is running`);
  console.log(`📊 Starting ${clusterConfig.workers} workers`);
  
  // Fork workers
  const workers = [];
  
  for (let i = 0; i < clusterConfig.workers; i++) {
    const worker = cluster.fork({
      ...clusterConfig.env,
      WORKER_ID: i + 1
    });
    
    workers.push(worker);
    
    worker.on('online', () => {
      console.log(`👷 Worker ${worker.process.pid} (ID: ${i + 1}) is online`);
    });
    
    worker.on('message', (msg) => {
      if (msg.type === 'stats') {
        console.log(`📈 Worker ${worker.id} stats:`, msg.data);
      }
    });
    
    worker.on('error', (error) => {
      console.error(`❌ Worker ${worker.id} error:`, error);
    });
    
    worker.on('exit', (code, signal) => {
      console.log(`💀 Worker ${worker.id} died with code ${code} and signal ${signal}`);
      
      // Restart worker if it wasn't a graceful shutdown
      if (!worker.exitedAfterDisconnect) {
        console.log(`🔄 Restarting worker ${worker.id}`);
        const newWorker = cluster.fork({
          ...clusterConfig.env,
          WORKER_ID: worker.id
        });
        
        newWorker.on('online', () => {
          console.log(`👷 Replaced worker ${newWorker.process.pid} (ID: ${worker.id}) is online`);
        });
        
        workers[i] = newWorker;
      }
    });
  }
  
  // Handle master process signals
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  process.on('SIGUSR2', () => {
    console.log('🔄 Received SIGUSR2, restarting workers...');
    workers.forEach(worker => worker.kill('SIGTERM'));
  });
  
  // Handle worker disconnects
  cluster.on('disconnect', (worker) => {
    console.log(`🔌 Worker ${worker.id} disconnected`);
  });
  
  // Setup logging
  const logStats = () => {
    const stats = workers.map(worker => ({
      id: worker.id,
      pid: worker.process.pid,
      memory: worker.process.memoryUsage(),
      uptime: process.uptime()
    }));
    
    console.log('📊 Worker Stats:', stats);
    
    // Write stats to file for monitoring
    require('fs').writeFileSync(
      path.join(__dirname, 'logs', 'cluster-stats.json'),
      JSON.stringify({
        timestamp: new Date().toISOString(),
        master: process.pid,
        workers: stats
      }, null, 2)
    );
  };
  
  // Log stats every 30 seconds
  setInterval(logStats, 30000);
  
  // Initial stats log
  logStats();
  
} else {
  // Worker process
  const workerId = process.env.WORKER_ID || '1';
  
  console.log(`👷 Worker ${process.pid} (ID: ${workerId}) started`);
  
  // Setup worker-specific logging
  const logWorkerStats = () => {
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    process.send({
      type: 'stats',
      data: {
        workerId,
        memory: memUsage,
        cpu: cpuUsage,
        uptime: process.uptime()
      }
    });
  };
  
  // Send stats every 15 seconds
  setInterval(logWorkerStats, 15000);
  
  // Handle worker signals
  process.on('SIGTERM', () => {
    console.log(`👷 Worker ${workerId} received SIGTERM`);
    process.exit(0);
  });
  
  process.on('SIGINT', () => {
    console.log(`👷 Worker ${workerId} received SIGINT`);
    process.exit(0);
  });
  
  // Start the server
  let server;
  
  try {
    // Create server with worker-specific configuration
    server = app.listen(process.env.PORT || 3000, () => {
      console.log(`🌐 Worker ${workerId} listening on port ${process.env.PORT || 3000}`);
      
      // Notify master that worker is ready
      if (process.send) {
        process.send({
          type: 'ready',
          data: {
            workerId,
            pid: process.pid,
            port: process.env.PORT || 3000
          }
        });
      }
    });
    
    // Handle server errors
    server.on('error', (error) => {
      console.error(`❌ Worker ${workerId} server error:`, error);
      
      if (error.code === 'EADDRINUSE') {
        console.error(`Port ${process.env.PORT || 3000} is already in use`);
      }
      
      process.exit(1);
    });
    
    // Handle worker uncaught exceptions
    process.on('uncaughtException', (error) => {
      console.error(`❌ Worker ${workerId} uncaught exception:`, error);
      
      // Try graceful shutdown
      if (server) {
        server.close(() => {
          process.exit(1);
        });
      } else {
        process.exit(1);
      }
    });
    
    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      console.error(`❌ Worker ${workerId} unhandled rejection at:`, promise, 'reason:', reason);
      
      // Continue running but log the error
      // In production, you might want to restart the worker
    });
    
  } catch (error) {
    console.error(`❌ Worker ${workerId} failed to start:`, error);
    process.exit(1);
  }
}

// Export for external use
module.exports = {
  clusterConfig,
  gracefulShutdown
};
