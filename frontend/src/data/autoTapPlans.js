/**
 * Auto Tap Plans - Automated STG Generation System
 * Players can purchase plans that automatically generate STG over time
 */

export const AUTO_TAP_PLANS = {
  // Basic Plans
  '6h_basic': {
    id: '6h_basic',
    name: '6 Hours Basic',
    duration: 6 * 60 * 60 * 1000, // 6 hours in milliseconds
    stgReward: 2, // 2 STG total
    stgPerHour: 0.33,
    cost: 0.5, // 0.5 STG to purchase
    icon: '⚡',
    description: 'Generate 2 STG over 6 hours',
    tier: 'basic',
    popularity: 85
  },
  
  '12h_basic': {
    id: '12h_basic',
    name: '12 Hours Basic',
    duration: 12 * 60 * 60 * 1000, // 12 hours
    stgReward: 4,
    stgPerHour: 0.33,
    cost: 1, // 1 STG to purchase
    icon: '⚡',
    description: 'Generate 4 STG over 12 hours',
    tier: 'basic',
    popularity: 75
  },
  
  '24h_basic': {
    id: '24h_basic',
    name: '24 Hours Basic',
    duration: 24 * 60 * 60 * 1000, // 24 hours
    stgReward: 10,
    stgPerHour: 0.42,
    cost: 2, // 2 STG to purchase
    icon: '⚡',
    description: 'Generate 10 STG over 24 hours',
    tier: 'basic',
    popularity: 90
  },
  
  // Premium Plans
  '12h_premium': {
    id: '12h_premium',
    name: '12 Hours Premium',
    duration: 12 * 60 * 60 * 1000, // 12 hours
    stgReward: 8,
    stgPerHour: 0.67,
    cost: 2, // 2 STG to purchase
    icon: '💎',
    description: 'Generate 8 STG over 12 hours',
    tier: 'premium',
    popularity: 60,
    bonusMultiplier: 1.5
  },
  
  '24h_premium': {
    id: '24h_premium',
    name: '24 Hours Premium',
    duration: 24 * 60 * 60 * 1000, // 24 hours
    stgReward: 20,
    stgPerHour: 0.83,
    cost: 4, // 4 STG to purchase
    icon: '💎',
    description: 'Generate 20 STG over 24 hours',
    tier: 'premium',
    popularity: 70,
    bonusMultiplier: 1.5
  },
  
  '48h_premium': {
    id: '48h_premium',
    name: '48 Hours Premium',
    duration: 48 * 60 * 60 * 1000, // 48 hours
    stgReward: 50,
    stgPerHour: 1.04,
    cost: 8, // 8 STG to purchase
    icon: '💎',
    description: 'Generate 50 STG over 48 hours',
    tier: 'premium',
    popularity: 55,
    bonusMultiplier: 1.5
  },
  
  // Elite Plans
  '24h_elite': {
    id: '24h_elite',
    name: '24 Hours Elite',
    duration: 24 * 60 * 60 * 1000, // 24 hours
    stgReward: 35,
    stgPerHour: 1.46,
    cost: 6, // 6 STG to purchase
    icon: '👑',
    description: 'Generate 35 STG over 24 hours',
    tier: 'elite',
    popularity: 40,
    bonusMultiplier: 2.0
  },
  
  '72h_elite': {
    id: '72h_elite',
    name: '72 Hours Elite',
    duration: 72 * 60 * 60 * 1000, // 72 hours
    stgReward: 120,
    stgPerHour: 1.67,
    cost: 15, // 15 STG to purchase
    icon: '👑',
    description: 'Generate 120 STG over 72 hours',
    tier: 'elite',
    popularity: 35,
    bonusMultiplier: 2.0
  },
  
  '7d_elite': {
    id: '7d_elite',
    name: '7 Days Elite',
    duration: 7 * 24 * 60 * 60 * 1000, // 7 days
    stgReward: 300,
    stgPerHour: 1.79,
    cost: 30, // 30 STG to purchase
    icon: '👑',
    description: 'Generate 300 STG over 7 days',
    tier: 'elite',
    popularity: 25,
    bonusMultiplier: 2.0
  },
  
  // VIP Plans
  '7d_vip': {
    id: '7d_vip',
    name: '7 Days VIP',
    duration: 7 * 24 * 60 * 60 * 1000, // 7 days
    stgReward: 500,
    stgPerHour: 2.98,
    cost: 50, // 50 STG to purchase
    icon: '🌟',
    description: 'Generate 500 STG over 7 days',
    tier: 'vip',
    popularity: 15,
    bonusMultiplier: 3.0
  },
  
  '30d_vip': {
    id: '30d_vip',
    name: '30 Days VIP',
    duration: 30 * 24 * 60 * 60 * 1000, // 30 days
    stgReward: 2500,
    stgPerHour: 3.47,
    cost: 200, // 200 STG to purchase
    icon: '🌟',
    description: 'Generate 2500 STG over 30 days',
    tier: 'vip',
    popularity: 10,
    bonusMultiplier: 3.0
  }
};

// Plan Tiers Configuration
export const PLAN_TIERS = {
  basic: {
    name: 'Basic',
    color: '#4CAF50',
    bgColor: 'rgba(76, 175, 80, 0.1)',
    borderColor: '#4CAF50',
    description: 'Affordable plans for casual players'
  },
  premium: {
    name: 'Premium',
    color: '#2196F3',
    bgColor: 'rgba(33, 150, 243, 0.1)',
    borderColor: '#2196F3',
    description: 'Enhanced rewards for dedicated players'
  },
  elite: {
    name: 'Elite',
    color: '#FF9800',
    bgColor: 'rgba(255, 152, 0, 0.1)',
    borderColor: '#FF9800',
    description: 'High-value plans for serious players'
  },
  vip: {
    name: 'VIP',
    color: '#9C27B0',
    bgColor: 'rgba(156, 39, 176, 0.1)',
    borderColor: '#9C27B0',
    description: 'Maximum rewards for elite players'
  }
};

// Auto Tap Status Types
export const AUTO_TAP_STATUS = {
  INACTIVE: 'inactive',
  ACTIVE: 'active',
  COMPLETED: 'completed',
  EXPIRED: 'expired',
  PAUSED: 'paused'
};

// Helper Functions
export const getPlanById = (planId) => {
  return AUTO_TAP_PLANS[planId] || null;
};

export const getPlansByTier = (tier) => {
  return Object.values(AUTO_TAP_PLANS).filter(plan => plan.tier === tier);
};

export const calculateRemainingTime = (startTime, duration) => {
  const elapsed = Date.now() - startTime;
  const remaining = duration - elapsed;
  return Math.max(0, remaining);
};

export const calculateProgress = (startTime, duration) => {
  const elapsed = Date.now() - startTime;
  return Math.min(100, (elapsed / duration) * 100);
};

export const calculateCurrentEarnings = (startTime, duration, totalReward) => {
  const elapsed = Date.now() - startTime;
  const progress = Math.min(1, elapsed / duration);
  return totalReward * progress;
};

export const formatDuration = (milliseconds) => {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) {
    return `${days}d ${hours % 24}h`;
  } else if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
};

export const getPlansSortedByPopularity = () => {
  return Object.values(AUTO_TAP_PLANS).sort((a, b) => b.popularity - a.popularity);
};

export const getBestValuePlans = () => {
  return Object.values(AUTO_TAP_PLANS)
    .filter(plan => plan.stgPerHour >= 1.0)
    .sort((a, b) => b.stgPerHour - a.stgPerHour);
};

export const getAffordablePlans = (userBalance) => {
  return Object.values(AUTO_TAP_PLANS).filter(plan => plan.cost <= userBalance);
};

// Auto Tap Configuration
export const AUTO_TAP_CONFIG = {
  maxConcurrentPlans: 3, // Maximum plans a user can have active
  minPlanInterval: 1000 * 60 * 5, // 5 minutes minimum between purchases
  autoCollectDelay: 1000 * 60 * 30, // Auto-collect after 30 minutes of completion
  notificationThreshold: 0.9, // Notify at 90% completion
  bonusMultiplierForFaction: {
    iran: 1.1, // 10% bonus for Iran faction
    usa: 1.05 // 5% bonus for USA faction
  }
};

export default AUTO_TAP_PLANS;
