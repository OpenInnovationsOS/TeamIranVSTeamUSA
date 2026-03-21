import React, { useState, useEffect, useCallback, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styled from 'styled-components';

// Offline detection and caching utilities
const CACHE_PREFIX = 'team_iran_vs_usa_';
const CACHE_VERSION = '1.0';
const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

// Offline status component
const OfflineBanner = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background: linear-gradient(45deg, #e74c3c, #c0392b);
  color: white;
  padding: 12px;
  text-align: center;
  z-index: 10000;
  font-weight: bold;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
`;

const OfflineContent = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
`;

const OfflineIcon = styled.div`
  font-size: 20px;
`;

const OfflineText = styled.div`
  font-size: 14px;
`;

const SyncIndicator = styled(motion.div)`
  position: fixed;
  bottom: 80px;
  right: 20px;
  background: rgba(39, 174, 96, 0.9);
  color: white;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: bold;
  z-index: 1000;
  backdrop-filter: blur(10px);
`;

// Cache management utilities
export const CacheManager = {
  // Set cache item with expiry
  set: (key, data, expiry = CACHE_EXPIRY) => {
    try {
      const cacheData = {
        data,
        timestamp: Date.now(),
        expiry: Date.now() + expiry,
        version: CACHE_VERSION
      };
      
      localStorage.setItem(`${CACHE_PREFIX}${key}`, JSON.stringify(cacheData));
    } catch (error) {
      // Cache set error
    }
  },
  
  // Get cache item
  get: (key) => {
    try {
      const cached = localStorage.getItem(`${CACHE_PREFIX}${key}`);
      if (!cached) return null;
      
      const cacheData = JSON.parse(cached);
      
      // Check version compatibility
      if (cacheData.version !== CACHE_VERSION) {
        CacheManager.remove(key);
        return null;
      }
      
      // Check expiry
      if (Date.now() > cacheData.expiry) {
        CacheManager.remove(key);
        return null;
      }
      
      return cacheData.data;
    } catch (error) {
      // Cache get error
      return null;
    }
  },
  
  // Remove cache item
  remove: (key) => {
    try {
      localStorage.removeItem(`${CACHE_PREFIX}${key}`);
    } catch (error) {
      // Cache remove error
    }
  },
  
  // Clear all cache
  clear: () => {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(CACHE_PREFIX)) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      // Cache clear error
    }
  },
  
  // Get cache size
  getSize: () => {
    try {
      let size = 0;
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(CACHE_PREFIX)) {
          size += localStorage.getItem(key).length;
        }
      });
      return size;
    } catch (error) {
      // Cache size error
      return 0;
    }
  }
};

// Offline queue for actions when offline
export const OfflineQueue = {
  // Add action to queue
  add: (action) => {
    try {
      const queue = OfflineQueue.get();
      queue.push({
        ...action,
        id: Date.now() + Math.random(),
        timestamp: Date.now()
      });
      
      localStorage.setItem(`${CACHE_PREFIX}offline_queue`, JSON.stringify(queue));
    } catch (error) {
      // Queue add error
    }
  },
  
  // Get queue
  get: () => {
    try {
      const queue = localStorage.getItem(`${CACHE_PREFIX}offline_queue`);
      return queue ? JSON.parse(queue) : [];
    } catch (error) {
      // Queue get error
      return [];
    }
  },
  
  // Clear queue
  clear: () => {
    try {
      localStorage.removeItem(`${CACHE_PREFIX}offline_queue`);
    } catch (error) {
      // Queue clear error
    }
  },
  
  // Process queue when back online
  process: async (processFunction) => {
    const queue = OfflineQueue.get();
    
    if (queue.length === 0) return [];
    
    const results = [];
    
    for (const action of queue) {
      try {
        const result = await processFunction(action);
        results.push({ ...action, result, success: true });
      } catch (error) {
        results.push({ ...action, error: error.message, success: false });
      }
    }
    
    OfflineQueue.clear();
    return results;
  }
};

// Offline detection hook
export const useOfflineDetection = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [wasOffline, setWasOffline] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncResults, setSyncResults] = useState([]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setWasOffline(true);
      
      // Process offline queue
      setSyncing(true);
      OfflineQueue.process(async (action) => {
        // Simulate processing - in real implementation, this would make API calls
        await new Promise(resolve => setTimeout(resolve, 1000));
        return { processed: true };
      }).then(results => {
        setSyncResults(results);
        setSyncing(false);
        setTimeout(() => setWasOffline(false), 3000);
      });
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return {
    isOnline,
    wasOffline,
    syncing,
    syncResults
  };
};

// Enhanced fetch with offline support
export const offlineFetch = async (url, options = {}) => {
  const cacheKey = `fetch_${url}_${JSON.stringify(options)}`;
  
  try {
    // Try network request first
    const response = await fetch(url, options);
    
    if (response.ok) {
      const data = await response.json();
      
      // Cache successful response
      CacheManager.set(cacheKey, {
        data,
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      });
      
      return {
        success: true,
        data,
        fromCache: false
      };
    } else {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  } catch (error) {
    // Network error, try cache
    
    const cached = CacheManager.get(cacheKey);
    if (cached) {
      return {
        success: true,
        data: cached.data,
        fromCache: true,
        cachedAt: cached.timestamp
      };
    }
    
    // Add to offline queue if it's a mutating request
    if (options.method && ['POST', 'PUT', 'DELETE'].includes(options.method)) {
      OfflineQueue.add({
        url,
        options,
        type: 'api_request'
      });
    }
    
    throw error;
  }
};

// Data sync manager
export const DataSyncManager = {
  // Sync user data
  syncUserData: async (userId) => {
    try {
      const endpoints = [
        '/api/profile',
        '/api/marketplace',
        '/api/tournaments',
        '/api/staking/pools',
        '/api/guilds'
      ];
      
      const syncPromises = endpoints.map(async endpoint => {
        try {
          const response = await offlineFetch(`http://localhost:3000${endpoint}`, {
            headers: {
              'x-user-id': userId,
              'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
            }
          });
          
          return { endpoint, success: true, data: response.data };
        } catch (error) {
          return { endpoint, success: false, error: error.message };
        }
      });
      
      const results = await Promise.all(syncPromises);
      
      return {
        success: true,
        results,
        syncedAt: Date.now()
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        syncedAt: Date.now()
      };
    }
  },
  
  // Background sync
  startBackgroundSync: (userId, interval = 5 * 60 * 1000) => {
    return setInterval(async () => {
      if (navigator.onLine) {
        await DataSyncManager.syncUserData(userId);
      }
    }, interval);
  }
};

// Offline-aware components
export const OfflineAwareComponent = ({ children, fallback = null }) => {
  const { isOnline } = useOfflineDetection();
  
  if (!isOnline && fallback) {
    return fallback;
  }
  
  return children;
};

// Cache provider component
export const CacheProvider = ({ children }) => {
  const [cacheStats, setCacheStats] = useState({
    size: 0,
    items: 0
  });

  useEffect(() => {
    const updateStats = () => {
      setCacheStats({
        size: CacheManager.getSize(),
        items: Object.keys(localStorage).filter(key => 
          key.startsWith(CACHE_PREFIX) && !key.includes('offline_queue')
        ).length
      });
    };

    updateStats();
    
    // Update stats periodically
    const interval = setInterval(updateStats, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const clearCache = () => {
    CacheManager.clear();
    setCacheStats({ size: 0, items: 0 });
  };

  return (
    <CacheContext.Provider value={{ cacheStats, clearCache }}>
      {children}
    </CacheContext.Provider>
  );
};

// Cache context
export const CacheContext = React.createContext({
  cacheStats: { size: 0, items: 0 },
  clearCache: () => {}
});

export const useCache = () => {
  const context = React.useContext(CacheContext);
  if (!context) {
    throw new Error('useCache must be used within CacheProvider');
  }
  return context;
};

// Service Worker registration
export const registerServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      
      
      // Check for updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New version available, show update notification
              window.dispatchEvent(new CustomEvent('appUpdateAvailable'));
            }
          });
        }
      });
      
      return registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  }
  return null;
};

// Main offline support hook
export const useOfflineSupport = () => {
  const { isOnline, wasOffline, syncing, syncResults } = useOfflineDetection();
  const { cacheStats, clearCache } = useCache();
  
  const addToOfflineQueue = useCallback((action) => {
    OfflineQueue.add(action);
  }, []);
  
  const processOfflineQueue = useCallback(async (processor) => {
    return await OfflineQueue.process(processor);
  }, []);
  
  const cacheData = useCallback((key, data, expiry) => {
    CacheManager.set(key, data, expiry);
  }, []);
  
  const getCachedData = useCallback((key) => {
    return CacheManager.get(key);
  }, []);
  
  const clearCachedData = useCallback((key) => {
    CacheManager.remove(key);
  }, []);
  
  return {
    isOnline,
    wasOffline,
    syncing,
    syncResults,
    cacheStats,
    clearCache,
    addToOfflineQueue,
    processOfflineQueue,
    cacheData,
    getCachedData,
    clearCachedData
  };
};

// Offline status display component
export const OfflineStatus = () => {
  const { isOnline, wasOffline, syncing, syncResults } = useOfflineDetection();
  
  return (
    <>
      <AnimatePresence>
        {!isOnline && (
          <OfflineBanner
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            exit={{ y: -100 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            <OfflineContent>
              <OfflineIcon>📴</OfflineIcon>
              <OfflineText>You're offline. Some features may not be available.</OfflineText>
            </OfflineContent>
          </OfflineBanner>
        )}
      </AnimatePresence>
      
      <AnimatePresence>
        {wasOffline && isOnline && (
          <SyncIndicator
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {syncing ? '🔄 Syncing...' : '✅ Synced'}
          </SyncIndicator>
        )}
      </AnimatePresence>
    </>
  );
};

export default {
  CacheManager,
  OfflineQueue,
  useOfflineDetection,
  offlineFetch,
  DataSyncManager,
  OfflineAwareComponent,
  CacheProvider,
  useCache,
  registerServiceWorker,
  useOfflineSupport,
  OfflineStatus
};
