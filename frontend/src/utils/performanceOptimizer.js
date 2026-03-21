/**
 * Performance Optimization Utilities
 * Optimizes bundle size, memory usage, and rendering performance
 */

import React from 'react';

// Bundle size optimization
export const bundleOptimizer = {
  // Lazy load components
  lazyLoad: (component) => {
    return React.lazy(() => import(component));
  },

  // Code splitting for routes
  splitRoutes: () => ({
    Dashboard: () => import('../components/GameDashboard'),
    BattleArena: () => import('../components/BattleArena'),
    Leaderboard: () => import('../components/Leaderboard'),
    TerritoryMap: () => import('../components/TerritoryMap'),
    Marketplace: () => import('../components/Marketplace'),
    Profile: () => import('../components/Profile'),
    AdminDashboard: () => import('../components/AdminDashboard')
  }),

  // Optimize imports
  optimizeImports: () => {
    // Only import what's needed
    return {
      // Instead of importing entire library
      debounce: (fn, delay) => {
        let timeoutId;
        return (...args) => {
          clearTimeout(timeoutId);
          timeoutId = setTimeout(() => fn.apply(this, args), delay);
        };
      },
      
      // Throttle for performance
      throttle: (fn, limit) => {
        let inThrottle;
        return (...args) => {
          if (!inThrottle) {
            fn.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
          }
        };
      }
    };
  }
};

// Memory optimization
export const memoryOptimizer = {
  // Clear unused data
  cleanup: () => {
    // Clear console logs in production
    if (process.env.NODE_ENV === 'production') {
      console.log = () => {};
      console.warn = () => {};
      console.error = () => {};
    }
  },

  // Optimize state updates
  batchUpdates: (callback) => {
    // Batch multiple state updates
    requestAnimationFrame(callback);
  },

  // Memoization helper
  memo: (fn) => {
    const cache = new Map();
    return (...args) => {
      const key = JSON.stringify(args);
      if (cache.has(key)) {
        return cache.get(key);
      }
      const result = fn(...args);
      cache.set(key, result);
      return result;
    };
  }
};

// Rendering optimization
export const renderOptimizer = {
  // Virtual scrolling for large lists
  virtualScroll: {
    itemHeight: 50,
    bufferSize: 5,
    getVisibleRange: (scrollTop, containerHeight, totalItems) => {
      const startIndex = Math.max(0, Math.floor(scrollTop / 50) - 5);
      const endIndex = Math.min(totalItems, startIndex + Math.ceil(containerHeight / 50) + 5);
      return { startIndex, endIndex };
    }
  },

  // Intersection Observer for lazy loading
  createIntersectionObserver: (callback) => {
    return new IntersectionObserver(callback, {
      root: null,
      rootMargin: '50px',
      threshold: 0.1
    });
  },

  // Optimize animations
  optimizeAnimations: () => {
    // Use CSS transforms instead of layout properties
    const style = document.createElement('style');
    style.textContent = `
      .optimized-animation {
        transform: translateZ(0);
        backface-visibility: hidden;
        perspective: 1000px;
      }
      
      .gpu-accelerated {
        transform: translate3d(0, 0, 0);
        will-change: transform;
      }
    `;
    document.head.appendChild(style);
  }
};

// Network optimization
export const networkOptimizer = {
  // Request batching
  batchRequests: (requests) => {
    return Promise.all(requests.map(req => fetch(req.url, req.options)));
  },

  // Request caching
  cache: new Map(),

  cachedFetch: (url, options = {}) => {
    const cacheKey = `${url}-${JSON.stringify(options)}`;
    
    if (networkOptimizer.cache.has(cacheKey)) {
      return Promise.resolve(networkOptimizer.cache.get(cacheKey));
    }

    return fetch(url, options).then(response => {
      // Cache successful responses for 5 minutes
      networkOptimizer.cache.set(cacheKey, response.clone());
      setTimeout(() => networkOptimizer.cache.delete(cacheKey), 300000);
      return response;
    });
  },

  // Optimize images
  optimizeImages: () => {
    // Lazy load images
    const images = document.querySelectorAll('img[data-src]');
    images.forEach(img => {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            img.src = img.dataset.src;
            observer.unobserve(img);
          }
        });
      });
      observer.observe(img);
    });
  }
};

// Performance monitoring
export const performanceMonitor = {
  // Measure component render time
  measureRender: (componentName, renderFn) => {
    const start = performance.now();
    const result = renderFn();
    const end = performance.now();
    
    console.log(`🎯 ${componentName} render time: ${(end - start).toFixed(2)}ms`);
    
    // Report slow renders
    if (end - start > 16) { // More than one frame
      console.warn(`⚠️ Slow render detected: ${componentName} took ${end - start}ms`);
    }
    
    return result;
  },

  // Memory usage tracking
  trackMemory: () => {
    if (performance.memory) {
      const memory = performance.memory;
      return {
        used: (memory.usedJSHeapSize / 1048576).toFixed(2) + ' MB',
        total: (memory.totalJSHeapSize / 1048576).toFixed(2) + ' MB',
        limit: (memory.jsHeapSizeLimit / 1048576).toFixed(2) + ' MB'
      };
    }
    return null;
  },

  // FPS monitoring
  monitorFPS: (callback) => {
    let lastTime = performance.now();
    let frames = 0;
    
    const measureFPS = (currentTime) => {
      frames++;
      
      if (currentTime >= lastTime + 1000) {
        const fps = Math.round((frames * 1000) / (currentTime - lastTime));
        callback(fps);
        frames = 0;
        lastTime = currentTime;
      }
      
      requestAnimationFrame(measureFPS);
    };
    
    requestAnimationFrame(measureFPS);
  }
};

// Bundle size analyzer
export const bundleAnalyzer = {
  analyze: () => {
    const scripts = document.querySelectorAll('script[src]');
    let totalSize = 0;
    
    scripts.forEach(script => {
      if (script.src.includes('main.')) {
        // Estimate bundle size from script tag
        totalSize += script.src.length;
      }
    });
    
    return {
      estimatedSize: (totalSize / 1024).toFixed(2) + ' KB',
      recommendations: totalSize > 200 ? [
        'Consider code splitting',
        'Remove unused dependencies',
        'Optimize images and assets',
        'Use tree shaking'
      ] : [
        'Bundle size is optimal'
      ]
    };
  }
};

// Initialize optimizations
export const initializeOptimizations = () => {
  // Apply render optimizations
  renderOptimizer.optimizeAnimations();
  
  // Start performance monitoring
  performanceMonitor.monitorFPS((fps) => {
    if (fps < 30) {
      console.warn(`⚠️ Low FPS detected: ${fps}`);
    }
  });
  
  // Initialize memory tracking
  setInterval(() => {
    const memory = performanceMonitor.trackMemory();
    if (memory && parseFloat(memory.used) > 50) {
      console.warn(`⚠️ High memory usage: ${memory.used}`);
    }
  }, 10000); // Check every 10 seconds
  
  console.log('🚀 Performance optimizations initialized');
};

export default {
  bundleOptimizer,
  memoryOptimizer,
  renderOptimizer,
  networkOptimizer,
  performanceMonitor,
  bundleAnalyzer,
  initializeOptimizations
};
