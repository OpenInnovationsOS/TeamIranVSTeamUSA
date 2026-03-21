/**
 * Performance Monitoring Utility
 * Tracks and reports application performance metrics
 */

class PerformanceMonitor {
  constructor() {
    this.metrics = {
      pageLoad: {},
      apiCalls: [],
      renderTimes: [],
      memoryUsage: [],
      userInteractions: []
    };
    this.observers = new Map();
    this.isMonitoring = false;
  }

  /**
   * Start performance monitoring
   */
  start() {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    this.trackPageLoad();
    this.trackMemoryUsage();
    this.trackUserInteractions();
    
    if ('PerformanceObserver' in window) {
      this.setupPerformanceObservers();
    }
  }

  /**
   * Stop performance monitoring
   */
  stop() {
    this.isMonitoring = false;
    
    // Disconnect all observers
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();
  }

  /**
   * Track page load performance
   */
  trackPageLoad() {
    if ('performance' in window && 'getEntriesByType' in performance) {
      const navigationEntries = performance.getEntriesByType('navigation');
      
      if (navigationEntries.length > 0) {
        const nav = navigationEntries[0];
        this.metrics.pageLoad = {
          domContentLoaded: nav.domContentLoadedEventEnd - nav.domContentLoadedEventStart,
          loadComplete: nav.loadEventEnd - nav.loadEventStart,
          firstPaint: this.getMetric('first-paint'),
          firstContentfulPaint: this.getMetric('first-contentful-paint'),
          largestContentfulPaint: this.getMetric('largest-contentful-paint'),
          cumulativeLayoutShift: this.getMetric('cumulative-layout-shift'),
          firstInputDelay: this.getMetric('first-input-delay')
        };
      }
    }
  }

  /**
   * Get specific performance metric
   * @param {string} metricName - Name of the metric
   * @returns {number|null} - Metric value or null
   */
  getMetric(metricName) {
    try {
      const entries = performance.getEntriesByName(metricName);
      return entries.length > 0 ? entries[0].startTime : null;
    } catch (e) {
      return null;
    }
  }

  /**
   * Setup performance observers
   */
  setupPerformanceObservers() {
    // Observe long tasks
    try {
      const longTaskObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          this.recordLongTask(entry);
        });
      });
      longTaskObserver.observe({ entryTypes: ['longtask'] });
      this.observers.set('longtask', longTaskObserver);
    } catch (e) {
      console.warn('Long task observer not supported');
    }

    // Observe resource loading
    try {
      const resourceObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          this.recordResourceLoad(entry);
        });
      });
      resourceObserver.observe({ entryTypes: ['resource'] });
      this.observers.set('resource', resourceObserver);
    } catch (e) {
      console.warn('Resource observer not supported');
    }
  }

  /**
   * Record long task
   * @param {PerformanceEntry} entry - Long task entry
   */
  recordLongTask(entry) {
    this.metrics.userInteractions.push({
      type: 'long-task',
      duration: entry.duration,
      startTime: entry.startTime,
      timestamp: Date.now()
    });
  }

  /**
   * Record resource load
   * @param {PerformanceEntry} entry - Resource entry
   */
  recordResourceLoad(entry) {
    // Only track slow resources (> 100ms)
    if (entry.duration > 100) {
      this.metrics.userInteractions.push({
        type: 'slow-resource',
        name: entry.name,
        duration: entry.duration,
        size: entry.transferSize || 0,
        timestamp: Date.now()
      });
    }
  }

  /**
   * Track memory usage periodically
   */
  trackMemoryUsage() {
    if (!('memory' in performance)) return;

    const recordMemory = () => {
      if (!this.isMonitoring) return;
      
      const memory = performance.memory;
      this.metrics.memoryUsage.push({
        used: memory.usedJSHeapSize,
        total: memory.totalJSHeapSize,
        limit: memory.jsHeapSizeLimit,
        timestamp: Date.now()
      });

      // Keep only last 100 entries
      if (this.metrics.memoryUsage.length > 100) {
        this.metrics.memoryUsage.shift();
      }
    };

    // Record every 5 seconds
    const interval = setInterval(recordMemory, 5000);
    
    // Cleanup on stop
    this.stop = () => {
      clearInterval(interval);
      this.isMonitoring = false;
      this.observers.forEach(observer => observer.disconnect());
      this.observers.clear();
    };
  }

  /**
   * Track user interactions
   */
  trackUserInteractions() {
    // Track clicks
    document.addEventListener('click', (event) => {
      if (!this.isMonitoring) return;
      
      this.metrics.userInteractions.push({
        type: 'click',
        target: event.target.tagName,
        timestamp: Date.now()
      });
    });

    // Track scroll events (throttled)
    let scrollTimeout;
    document.addEventListener('scroll', () => {
      if (!this.isMonitoring) return;
      
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        this.metrics.userInteractions.push({
          type: 'scroll',
          scrollY: window.scrollY,
          timestamp: Date.now()
        });
      }, 100);
    });
  }

  /**
   * Measure render time for a component
   * @param {string} componentName - Name of the component
   * @param {Function} renderFunction - Function to measure
   * @returns {*} - Result of the render function
   */
  measureRender(componentName, renderFunction) {
    const startTime = performance.now();
    const result = renderFunction();
    const endTime = performance.now();
    
    this.metrics.renderTimes.push({
      component: componentName,
      duration: endTime - startTime,
      timestamp: Date.now()
    });

    return result;
  }

  /**
   * Track API call performance
   * @param {string} endpoint - API endpoint
   * @param {string} method - HTTP method
   * @param {number} duration - Call duration in ms
   * @param {number} status - HTTP status code
   */
  trackApiCall(endpoint, method, duration, status) {
    this.metrics.apiCalls.push({
      endpoint,
      method,
      duration,
      status,
      timestamp: Date.now()
    });

    // Keep only last 100 API calls
    if (this.metrics.apiCalls.length > 100) {
      this.metrics.apiCalls.shift();
    }
  }

  /**
   * Get performance summary
   * @returns {Object} - Performance summary
   */
  getSummary() {
    const summary = {
      pageLoad: this.metrics.pageLoad,
      apiCalls: {
        total: this.metrics.apiCalls.length,
        averageDuration: this.calculateAverage(this.metrics.apiCalls, 'duration'),
        slowestCalls: this.getSlowest(this.metrics.apiCalls, 'duration', 5)
      },
      renderTimes: {
        total: this.metrics.renderTimes.length,
        averageDuration: this.calculateAverage(this.metrics.renderTimes, 'duration'),
        slowestRenders: this.getSlowest(this.metrics.renderTimes, 'duration', 5)
      },
      memoryUsage: {
        current: this.getCurrentMemory(),
        peak: this.getPeakMemory(),
        average: this.calculateAverage(this.metrics.memoryUsage, 'used')
      },
      userInteractions: {
        total: this.metrics.userInteractions.length,
        longTasks: this.metrics.userInteractions.filter(i => i.type === 'long-task').length,
        slowResources: this.metrics.userInteractions.filter(i => i.type === 'slow-resource').length
      }
    };

    return summary;
  }

  /**
   * Calculate average of metric values
   * @param {Array} data - Array of metric objects
   * @param {string} field - Field to average
   * @returns {number} - Average value
   */
  calculateAverage(data, field) {
    if (data.length === 0) return 0;
    const sum = data.reduce((acc, item) => acc + (item[field] || 0), 0);
    return Math.round(sum / data.length);
  }

  /**
   * Get slowest entries
   * @param {Array} data - Array of metric objects
   * @param {string} field - Field to sort by
   * @param {number} limit - Number of entries to return
   * @returns {Array} - Slowest entries
   */
  getSlowest(data, field, limit = 5) {
    return data
      .slice()
      .sort((a, b) => b[field] - a[field])
      .slice(0, limit);
  }

  /**
   * Get current memory usage
   * @returns {Object|null} - Current memory usage
   */
  getCurrentMemory() {
    if (!('memory' in performance) || this.metrics.memoryUsage.length === 0) {
      return null;
    }
    
    return this.metrics.memoryUsage[this.metrics.memoryUsage.length - 1];
  }

  /**
   * Get peak memory usage
   * @returns {Object|null} - Peak memory usage
   */
  getPeakMemory() {
    if (this.metrics.memoryUsage.length === 0) return null;
    
    return this.metrics.memoryUsage.reduce((peak, current) => 
      current.used > peak.used ? current : peak
    );
  }

  /**
   * Export metrics for analysis
   * @returns {Object} - All collected metrics
   */
  exportMetrics() {
    return {
      ...this.metrics,
      summary: this.getSummary(),
      exportedAt: new Date().toISOString()
    };
  }

  /**
   * Clear all metrics
   */
  clear() {
    this.metrics = {
      pageLoad: {},
      apiCalls: [],
      renderTimes: [],
      memoryUsage: [],
      userInteractions: []
    };
  }
}

// Create singleton instance
const performanceMonitor = new PerformanceMonitor();

export default performanceMonitor;
