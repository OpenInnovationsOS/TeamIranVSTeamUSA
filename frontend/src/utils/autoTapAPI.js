/**
 * Auto Tap API Functions
 * Handles all Auto Tap related API calls
 */

import { API_BASE_URL } from './apiClient';

// Get user's active Auto Tap plans
export const getActiveAutoTapPlans = async (userId, token) => {
  try {
    const response = await fetch(`${API_BASE_URL}/autotap/plans/${userId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'x-user-id': userId,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch active plans');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching active plans:', error);
    throw error;
  }
};

// Purchase an Auto Tap plan
export const purchaseAutoTapPlan = async (userId, token, planId, cost) => {
  try {
    const response = await fetch(`${API_BASE_URL}/autotap/purchase`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'x-user-id': userId,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        planId,
        cost,
        timestamp: Date.now()
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to purchase plan');
    }

    return await response.json();
  } catch (error) {
    console.error('Error purchasing plan:', error);
    throw error;
  }
};

// Collect rewards from completed Auto Tap plan
export const collectAutoTapRewards = async (userId, token, planId, rewards) => {
  try {
    const response = await fetch(`${API_BASE_URL}/autotap/collect`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'x-user-id': userId,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        planId,
        rewards,
        timestamp: Date.now()
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to collect rewards');
    }

    return await response.json();
  } catch (error) {
    console.error('Error collecting rewards:', error);
    throw error;
  }
};

// Get Auto Tap plan statistics
export const getAutoTapStatistics = async (userId, token) => {
  try {
    const response = await fetch(`${API_BASE_URL}/autotap/statistics/${userId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'x-user-id': userId,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch statistics');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching statistics:', error);
    throw error;
  }
};

// Get available Auto Tap plans
export const getAvailableAutoTapPlans = async (userId, token) => {
  try {
    const response = await fetch(`${API_BASE_URL}/autotap/plans`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'x-user-id': userId,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch available plans');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching available plans:', error);
    throw error;
  }
};

// Cancel an active Auto Tap plan (if allowed)
export const cancelAutoTapPlan = async (userId, token, planId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/autotap/cancel`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'x-user-id': userId,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        planId,
        timestamp: Date.now()
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to cancel plan');
    }

    return await response.json();
  } catch (error) {
    console.error('Error canceling plan:', error);
    throw error;
  }
};

// Get Auto Tap transaction history
export const getAutoTapHistory = async (userId, token, limit = 50) => {
  try {
    const response = await fetch(`${API_BASE_URL}/autotap/history/${userId}?limit=${limit}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'x-user-id': userId,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch Auto Tap history');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching Auto Tap history:', error);
    throw error;
  }
};

// Calculate potential earnings for a plan
export const calculatePlanEarnings = (plan, userFaction, userLevel) => {
  let baseEarnings = plan.stgReward;
  
  // Apply faction bonus
  if (userFaction === 'iran') {
    baseEarnings *= 1.1; // 10% bonus for Iran
  } else if (userFaction === 'usa') {
    baseEarnings *= 1.05; // 5% bonus for USA
  }
  
  // Apply level bonus (if any)
  const levelBonus = Math.floor(userLevel / 10) * 0.05; // 5% bonus per 10 levels
  baseEarnings *= (1 + levelBonus);
  
  // Apply plan bonus multiplier
  if (plan.bonusMultiplier) {
    baseEarnings *= plan.bonusMultiplier;
  }
  
  return {
    baseEarnings: plan.stgReward,
    factionBonus: userFaction === 'iran' ? 0.1 : userFaction === 'usa' ? 0.05 : 0,
    levelBonus: levelBonus,
    planBonus: plan.bonusMultiplier || 1,
    totalEarnings: baseEarnings
  };
};

// Check if user can purchase a plan
export const canPurchasePlan = (user, plan) => {
  if (!user || !plan) return false;
  
  // Check balance
  if (user.stg_balance < plan.cost) return false;
  
  // Check level requirement
  if (plan.levelRequirement && user.level < plan.levelRequirement) return false;
  
  // Check maximum concurrent plans
  const maxConcurrentPlans = 3; // Could be user-specific
  if (user.activeAutoTapPlans && user.activeAutoTapPlans.length >= maxConcurrentPlans) return false;
  
  // Check purchase cooldown
  const lastPurchaseTime = user.lastAutoTapPurchase || 0;
  const minInterval = 5 * 60 * 1000; // 5 minutes minimum
  if (Date.now() - lastPurchaseTime < minInterval) return false;
  
  return true;
};

// Format Auto Tap plan for display
export const formatPlanForDisplay = (plan, user) => {
  const earnings = calculatePlanEarnings(plan, user?.faction, user?.level);
  const canAfford = user?.stg_balance >= plan.cost;
  const canPurchase = canPurchasePlan(user, plan);
  
  return {
    ...plan,
    ...earnings,
    canAfford,
    canPurchase,
    formattedDuration: formatDuration(plan.duration),
    hourlyRate: plan.stgPerHour,
    roi: ((plan.stgReward - plan.cost) / plan.cost * 100).toFixed(1)
  };
};

// Format duration helper
const formatDuration = (milliseconds) => {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) {
    return `${days}d ${hours % 24}h`;
  } else if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  } else if (minutes > 0) {
    return `${minutes}m`;
  } else {
    return `${seconds}s`;
  }
};

export default {
  getActiveAutoTapPlans,
  purchaseAutoTapPlan,
  collectAutoTapRewards,
  getAutoTapStatistics,
  getAvailableAutoTapPlans,
  cancelAutoTapPlan,
  getAutoTapHistory,
  calculatePlanEarnings,
  canPurchasePlan,
  formatPlanForDisplay
};
