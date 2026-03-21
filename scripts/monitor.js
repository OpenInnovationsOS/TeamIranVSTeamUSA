#!/usr/bin/env node

// Monitoring and Analytics Script
// Comprehensive monitoring system for production application

const fs = require('fs');
const path = require('path');
const os = require('os');
const { performance } = require('perf_hooks');

// Configuration
const MONITORING_CONFIG = {
  interval: 30000, // 30 seconds
  metricsPath: path.join(__dirname, '..', 'monitoring', 'metrics'),
  alertsPath: path.join(__dirname, '..', 'monitoring', 'alerts'),
  logsPath: path.join(__dirname, '..', 'monitoring', 'logs'),
  thresholds: {
    cpu: 80, // 80%
    memory: 85, // 85%
    disk: 90, // 90%
    responseTime: 2000, // 2 seconds
    errorRate: 5, // 5%
    activeConnections: 1000
  }
};

// Ensure directories exist
[MONITORING_CONFIG.metricsPath, MONITORING_CONFIG.alertsPath, MONITORING_CONFIG.logsPath].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Monitoring system
class MonitoringSystem {
  constructor() {
    this.metrics = {
      system: {},
      application: {},
      business: {},
      alerts: []
    };
    this.startTime = Date.now();
    this.isRunning = false;
    this.interval = null;
  }

  // System metrics collection
  collectSystemMetrics() {
    const cpus = os.cpus();
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;
    const loadAvg = os.loadavg();
    
    // CPU usage calculation
    let totalIdle = 0;
    let totalTick = 0;
    cpus.forEach(cpu => {
      for (const type in cpu.times) {
        totalTick += cpu.times[type];
      }
      totalIdle += cpu.times.idle;
    });
    
    const idle = totalIdle / cpus.length;
    const total = totalTick / cpus.length;
    const cpuUsage = 100 - (idle / total * 100);

    this.metrics.system = {
      timestamp: new Date().toISOString(),
      cpu: {
        usage: Math.round(cpuUsage * 100) / 100,
        cores: cpus.length,
        loadAverage: loadAvg
      },
      memory: {
        total: totalMemory,
        used: usedMemory,
        free: freeMemory,
        usage: Math.round((usedMemory / totalMemory) * 100 * 100) / 100
      },
      uptime: os.uptime(),
      platform: os.platform(),
      arch: os.arch(),
      nodeVersion: process.version,
      pid: process.pid
    };

    // Check for system alerts
    this.checkSystemAlerts();
  }

  // Application metrics collection
  collectApplicationMetrics() {
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    this.metrics.application = {
      timestamp: new Date().toISOString(),
      memory: {
        rss: memUsage.rss,
        heapTotal: memUsage.heapTotal,
        heapUsed: memUsage.heapUsed,
        external: memUsage.external,
        arrayBuffers: memUsage.arrayBuffers
      },
      cpu: {
        user: cpuUsage.user,
        system: cpuUsage.system
      },
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development'
    };

    // Check for application alerts
    this.checkApplicationAlerts();
  }

  // Business metrics collection
  async collectBusinessMetrics() {
    try {
      // Simulate business metrics collection
      const businessMetrics = {
        timestamp: new Date().toISOString(),
        activeUsers: Math.floor(Math.random() * 1000) + 500,
        battlesPerHour: Math.floor(Math.random() * 100) + 50,
        revenue: Math.floor(Math.random() * 10000) + 5000,
        conversionRate: Math.random() * 0.1 + 0.05,
        averageSessionDuration: Math.floor(Math.random() * 1800) + 600,
        errorRate: Math.random() * 5,
        responseTime: Math.floor(Math.random() * 1000) + 200
      };

      this.metrics.business = businessMetrics;
      this.checkBusinessAlerts();
    } catch (error) {
      console.error('Error collecting business metrics:', error);
    }
  }

  // Alert checking
  checkSystemAlerts() {
    const alerts = [];
    
    // CPU alerts
    if (this.metrics.system.cpu.usage > MONITORING_CONFIG.thresholds.cpu) {
      alerts.push({
        type: 'cpu',
        severity: 'warning',
        message: `CPU usage is ${this.metrics.system.cpu.usage}% (threshold: ${MONITORING_CONFIG.thresholds.cpu}%)`,
        timestamp: new Date().toISOString()
      });
    }
    
    // Memory alerts
    if (this.metrics.system.memory.usage > MONITORING_CONFIG.thresholds.memory) {
      alerts.push({
        type: 'memory',
        severity: 'warning',
        message: `Memory usage is ${this.metrics.system.memory.usage}% (threshold: ${MONITORING_CONFIG.thresholds.memory}%)`,
        timestamp: new Date().toISOString()
      });
    }
    
    // Load average alerts
    if (this.metrics.system.cpu.loadAverage[0] > MONITORING_CONFIG.thresholds.cpu / 100) {
      alerts.push({
        type: 'load',
        severity: 'warning',
        message: `Load average is ${this.metrics.system.cpu.loadAverage[0].toFixed(2)} (threshold: ${(MONITORING_CONFIG.thresholds.cpu / 100).toFixed(2)})`,
        timestamp: new Date().toISOString()
      });
    }
    
    this.metrics.alerts.push(...alerts);
  }

  checkApplicationAlerts() {
    const alerts = [];
    
    // Application memory alerts
    const appMemoryUsage = (this.metrics.application.memory.heapUsed / this.metrics.application.memory.heapTotal) * 100;
    if (appMemoryUsage > MONITORING_CONFIG.thresholds.memory) {
      alerts.push({
        type: 'app_memory',
        severity: 'warning',
        message: `Application memory usage is ${appMemoryUsage.toFixed(2)}%`,
        timestamp: new Date().toISOString()
      });
    }
    
    this.metrics.alerts.push(...alerts);
  }

  checkBusinessAlerts() {
    const alerts = [];
    
    // Error rate alerts
    if (this.metrics.business.errorRate > MONITORING_CONFIG.thresholds.errorRate) {
      alerts.push({
        type: 'error_rate',
        severity: 'critical',
        message: `Error rate is ${this.metrics.business.errorRate.toFixed(2)}% (threshold: ${MONITORING_CONFIG.thresholds.errorRate}%)`,
        timestamp: new Date().toISOString()
      });
    }
    
    // Response time alerts
    if (this.metrics.business.responseTime > MONITORING_CONFIG.thresholds.responseTime) {
      alerts.push({
        type: 'response_time',
        severity: 'warning',
        message: `Response time is ${this.metrics.business.responseTime}ms (threshold: ${MONITORING_CONFIG.thresholds.responseTime}ms)`,
        timestamp: new Date().toISOString()
      });
    }
    
    // Active connections alerts
    if (this.metrics.business.activeUsers > MONITORING_CONFIG.thresholds.activeConnections) {
      alerts.push({
        type: 'active_connections',
        severity: 'info',
        message: `Active users: ${this.metrics.business.activeUsers} (threshold: ${MONITORING_CONFIG.thresholds.activeConnections})`,
        timestamp: new Date().toISOString()
      });
    }
    
    this.metrics.alerts.push(...alerts);
  }

  // Save metrics to file
  saveMetrics() {
    const metricsFile = path.join(MONITORING_CONFIG.metricsPath, `metrics-${Date.now()}.json`);
    fs.writeFileSync(metricsFile, JSON.stringify(this.metrics, null, 2));
    
    // Keep only last 100 metrics files
    const files = fs.readdirSync(MONITORING_CONFIG.metricsPath)
      .filter(file => file.startsWith('metrics-'))
      .sort()
      .reverse();
    
    if (files.length > 100) {
      files.slice(100).forEach(file => {
        fs.unlinkSync(path.join(MONITORING_CONFIG.metricsPath, file));
      });
    }
  }

  // Save alerts to file
  saveAlerts() {
    if (this.metrics.alerts.length > 0) {
      const alertsFile = path.join(MONITORING_CONFIG.alertsPath, `alerts-${Date.now()}.json`);
      fs.writeFileSync(alertsFile, JSON.stringify(this.metrics.alerts, null, 2));
      
      // Log alerts
      this.metrics.alerts.forEach(alert => {
        this.logAlert(alert);
      });
    }
  }

  // Log alerts
  logAlert(alert) {
    const logFile = path.join(MONITORING_CONFIG.logsPath, 'alerts.log');
    const logEntry = `[${alert.timestamp}] [${alert.severity.toUpperCase()}] ${alert.type}: ${alert.message}\n`;
    fs.appendFileSync(logFile, logEntry);
    
    // Also log to console
    console.log(`🚨 [${alert.severity.toUpperCase()}] ${alert.type}: ${alert.message}`);
  }

  // Generate monitoring report
  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      uptime: Date.now() - this.startTime,
      system: this.metrics.system,
      application: this.metrics.application,
      business: this.metrics.business,
      alerts: this.metrics.alerts,
      summary: {
        totalAlerts: this.metrics.alerts.length,
        criticalAlerts: this.metrics.alerts.filter(a => a.severity === 'critical').length,
        warningAlerts: this.metrics.alerts.filter(a => a.severity === 'warning').length,
        infoAlerts: this.metrics.alerts.filter(a => a.severity === 'info').length
      }
    };
    
    const reportFile = path.join(MONITORING_CONFIG.metricsPath, `report-${Date.now()}.json`);
    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
    
    return report;
  }

  // Start monitoring
  start() {
    if (this.isRunning) {
      console.log('⚠️ Monitoring is already running');
      return;
    }
    
    console.log('🚀 Starting monitoring system...');
    this.isRunning = true;
    
    // Collect initial metrics
    this.collectSystemMetrics();
    this.collectApplicationMetrics();
    this.collectBusinessMetrics();
    this.saveMetrics();
    this.saveAlerts();
    
    // Start periodic collection
    this.interval = setInterval(async () => {
      try {
        this.collectSystemMetrics();
        this.collectApplicationMetrics();
        await this.collectBusinessMetrics();
        this.saveMetrics();
        this.saveAlerts();
        
        // Generate hourly report
        if (Date.now() % (60 * 60 * 1000) < MONITORING_CONFIG.interval) {
          this.generateReport();
        }
      } catch (error) {
        console.error('❌ Error in monitoring loop:', error);
      }
    }, MONITORING_CONFIG.interval);
    
    console.log(`✅ Monitoring started (interval: ${MONITORING_CONFIG.interval / 1000}s)`);
  }

  // Stop monitoring
  stop() {
    if (!this.isRunning) {
      console.log('⚠️ Monitoring is not running');
      return;
    }
    
    console.log('🛑 Stopping monitoring system...');
    this.isRunning = false;
    
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    
    // Generate final report
    const report = this.generateReport();
    console.log(`📊 Final monitoring report generated: ${report.summary.totalAlerts} alerts`);
    
    console.log('✅ Monitoring stopped');
  }

  // Get current metrics
  getMetrics() {
    return this.metrics;
  }

  // Get health status
  getHealthStatus() {
    const system = this.metrics.system;
    const application = this.metrics.application;
    const business = this.metrics.business;
    
    const status = {
      overall: 'healthy',
      system: {
        cpu: system.cpu?.usage < MONITORING_CONFIG.thresholds.cpu ? 'healthy' : 'warning',
        memory: system.memory?.usage < MONITORING_CONFIG.thresholds.memory ? 'healthy' : 'warning',
        uptime: system.uptime > 300 ? 'healthy' : 'warning'
      },
      application: {
        memory: application.memory ? 
          (application.memory.heapUsed / application.memory.heapTotal) * 100 < MONITORING_CONFIG.thresholds.memory ? 'healthy' : 'warning' : 'unknown',
        uptime: application.uptime > 300 ? 'healthy' : 'warning'
      },
      business: {
        errorRate: business.errorRate < MONITORING_CONFIG.thresholds.errorRate ? 'healthy' : 'critical',
        responseTime: business.responseTime < MONITORING_CONFIG.thresholds.responseTime ? 'healthy' : 'warning'
      }
    };
    
    // Determine overall status
    const statuses = Object.values(status.system).concat(Object.values(status.application)).concat(Object.values(status.business));
    if (statuses.includes('critical')) {
      status.overall = 'critical';
    } else if (statuses.includes('warning')) {
      status.overall = 'warning';
    }
    
    return status;
  }
}

// Analytics system
class AnalyticsSystem {
  constructor() {
    this.events = [];
    this.aggregations = {};
  }

  // Track event
  trackEvent(event) {
    const eventWithTimestamp = {
      ...event,
      timestamp: new Date().toISOString()
    };
    
    this.events.push(eventWithTimestamp);
    
    // Keep only last 10000 events
    if (this.events.length > 10000) {
      this.events = this.events.slice(-10000);
    }
    
    // Update aggregations
    this.updateAggregations(eventWithTimestamp);
  }

  // Update aggregations
  updateAggregations(event) {
    const type = event.type;
    const date = new Date(event.timestamp).toISOString().split('T')[0];
    
    if (!this.aggregations[type]) {
      this.aggregations[type] = {};
    }
    
    if (!this.aggregations[type][date]) {
      this.aggregations[type][date] = {
        count: 0,
        uniqueUsers: new Set(),
        totalValue: 0,
        avgValue: 0
      };
    }
    
    const aggregation = this.aggregations[type][date];
    aggregation.count++;
    
    if (event.userId) {
      aggregation.uniqueUsers.add(event.userId);
    }
    
    if (event.value) {
      aggregation.totalValue += event.value;
      aggregation.avgValue = aggregation.totalValue / aggregation.count;
    }
  }

  // Get analytics data
  getAnalytics(startDate, endDate) {
    const filtered = this.events.filter(event => {
      const eventDate = new Date(event.timestamp);
      return eventDate >= new Date(startDate) && eventDate <= new Date(endDate);
    });
    
    return {
      totalEvents: filtered.length,
      eventsByType: this.groupByType(filtered),
      eventsByDate: this.groupByDate(filtered),
      aggregations: this.aggregations
    };
  }

  // Group events by type
  groupByType(events) {
    const grouped = {};
    events.forEach(event => {
      if (!grouped[event.type]) {
        grouped[event.type] = 0;
      }
      grouped[event.type]++;
    });
    return grouped;
  }

  // Group events by date
  groupByDate(events) {
    const grouped = {};
    events.forEach(event => {
      const date = new Date(event.timestamp).toISOString().split('T')[0];
      if (!grouped[date]) {
        grouped[date] = 0;
      }
      grouped[date]++;
    });
    return grouped;
  }

  // Export analytics
  exportAnalytics() {
    const exportData = {
      timestamp: new Date().toISOString(),
      events: this.events,
      aggregations: this.aggregations
    };
    
    const exportFile = path.join(MONITORING_CONFIG.metricsPath, `analytics-${Date.now()}.json`);
    fs.writeFileSync(exportFile, JSON.stringify(exportData, null, 2));
    
    return exportFile;
  }
}

// Main execution
async function main() {
  const [command] = process.argv.slice(2);
  
  const monitoring = new MonitoringSystem();
  const analytics = new AnalyticsSystem();
  
  switch (command) {
    case 'start':
      monitoring.start();
      break;
      
    case 'stop':
      monitoring.stop();
      break;
      
    case 'status':
      const status = monitoring.getHealthStatus();
      console.log('🏥 Health Status:');
      console.log('================');
      console.log(`Overall: ${status.overall}`);
      console.log('System:', status.system);
      console.log('Application:', status.application);
      console.log('Business:', status.business);
      break;
      
    case 'metrics':
      const metrics = monitoring.getMetrics();
      console.log('📊 Current Metrics:');
      console.log('====================');
      console.log(JSON.stringify(metrics, null, 2));
      break;
      
    case 'report':
      const report = monitoring.generateReport();
      console.log('📊 Monitoring Report:');
      console.log('======================');
      console.log(`Total Alerts: ${report.summary.totalAlerts}`);
      console.log(`Critical: ${report.summary.criticalAlerts}`);
      console.log(`Warnings: ${report.summary.warningAlerts}`);
      console.log(`Info: ${report.summary.infoAlerts}`);
      break;
      
    case 'track':
      // Example: node monitor.js track battle_completed --userId test123 --value 100
      const event = {
        type: process.argv[3],
        userId: process.argv[5],
        value: parseInt(process.argv[7]) || 0,
        metadata: {}
      };
      
      analytics.trackEvent(event);
      console.log('✅ Event tracked:', event);
      break;
      
    case 'analytics':
      const analyticsData = analytics.getAnalytics(
        new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
        new Date().toISOString()
      );
      console.log('📈 Analytics Data:');
      console.log('==================');
      console.log(JSON.stringify(analyticsData, null, 2));
      break;
      
    case 'export':
      const exportFile = analytics.exportAnalytics();
      console.log(`📤 Analytics exported to: ${exportFile}`);
      break;
      
    default:
      console.log(`
📊 Monitoring & Analytics CLI

Usage: node monitor.js <command> [options]

Commands:
  start         Start monitoring system
  stop          Stop monitoring system
  status        Get health status
  metrics       Get current metrics
  report        Generate monitoring report
  track         Track analytics event
  analytics     Get analytics data
  export        Export analytics data

Examples:
  node monitor.js start
  node monitor.js status
  node monitor.js track battle_completed --userId test123 --value 100
  node monitor.js analytics
  node monitor.js export
      `);
      break;
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  MonitoringSystem,
  AnalyticsSystem
};
