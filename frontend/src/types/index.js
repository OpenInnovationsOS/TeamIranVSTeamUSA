/**
 * Type Definitions and Interfaces
 * Provides type safety for the application
 */

/**
 * User interface
 * @typedef {Object} User
 * @property {string} id - User ID
 * @property {string} username - Username
 * @property {string} first_name - First name
 * @property {string} last_name - Last name
 * @property {string|null} faction - User faction ('iran' | 'usa' | null)
 * @property {number} stg_balance - STG token balance
 * @property {number} level - User level
 * @property {number} experience - User experience points
 * @property {string} referral_code - Referral code
 * @property {number} battles - Number of battles fought
 * @property {number} wins - Number of wins
 * @property {number} losses - Number of losses
 * @property {number} win_rate - Win rate percentage
 * @property {string} created_at - Account creation timestamp
 * @property {string|null} wallet_address - Connected wallet address
 */

/**
 * Battle interface
 * @typedef {Object} Battle
 * @property {string} id - Battle ID
 * @property {string} attacker_id - Attacker user ID
 * @property {string} defender_id - Defender user ID
 * @property {string} attacker_faction - Attacker faction
 * @property {string} defender_faction - Defender faction
 * @property {string} weapon_id - Weapon used
 * @property {string} territory_id - Territory where battle took place
 * @property {number} stg_wager - STG tokens wagered
 * @property {'win'|'lose'|'draw'} result - Battle result
 * @property {'quick'|'struggle'|'domination'} battle_quality - Battle quality
 * @property {boolean} critical_hit - Whether critical hit occurred
 * @property {number} experience_gained - Experience points gained
 * @property {number} stg_reward - STG tokens won
 * @property {Object} territory_bonus - Territory bonuses
 * @property {Object} weapon_bonus - Weapon bonuses
 * @property {Object} faction_bonus - Faction bonuses
 * @property {string} created_at - Battle timestamp
 */

/**
 * Territory interface
 * @typedef {Object} Territory
 * @property {string} id - Territory ID
 * @property {string} name - Territory name
 * @property {'iran'|'usa'|'neutral'} controller - Controlling faction
 * @property {string|null} controller_id - User ID of controller
 * @property {number} attack_bonus - Attack bonus percentage
 * @property {number} defense_bonus - Defense bonus percentage
 * @property {number} daily_revenue - Daily STG revenue
 * @property {number} strategic_value - Strategic value (1-100)
 * @property {string} climate - Climate type
 * @property {'easy'|'normal'|'hard'} difficulty - Difficulty level
 * @property {string|null} last_conquered - Last conquest timestamp
 * @property {string} created_at - Creation timestamp
 * @property {string} updated_at - Last update timestamp
 */

/**
 * Guild interface
 * @typedef {Object} Guild
 * @property {string} id - Guild ID
 * @property {string} name - Guild name
 * @property {string} description - Guild description
 * @property {'iran'|'usa'} faction - Guild faction
 * @property {string} leader_id - Guild leader ID
 * @property {number} max_members - Maximum members
 * @property {number} current_members - Current member count
 * @property {number} power - Guild power level
 * @property {string[]} members - Member user IDs
 * @property {string} created_at - Creation timestamp
 * @property {string} updated_at - Last update timestamp
 */

/**
 * Tournament interface
 * @typedef {Object} Tournament
 * @property {string} id - Tournament ID
 * @property {string} name - Tournament name
 * @property {string} description - Tournament description
 * @property {'elimination'|'round-robin'|'swiss'} type - Tournament type
 * @property {number} duration - Duration in milliseconds
 * @property {number} entry_fee - Entry fee in STG
 * @property {number} max_participants - Maximum participants
 * @property {number} current_participants - Current participants
 * @property {'registration'|'active'|'completed'|'cancelled'} status - Tournament status
 * @property {number} prize_pool - Total prize pool
 * @property {string} start_time - Start timestamp
 * @property {boolean} user_registered - Whether current user is registered
 * @property {Object|null} bracket - Tournament bracket data
 */

/**
 * Staking Pool interface
 * @typedef {Object} StakingPool
 * @property {string} id - Pool ID
 * @property {string} name - Pool name
 * @property {number} apy - Annual percentage yield
 * @property {number} total_staked - Total amount staked
 * @property {number} stakers - Number of stakers
 * @property {number} lock_period - Lock period in milliseconds
 * @property {number} minimum_stake - Minimum stake amount
 * @property {'active'|'inactive'|'full'} status - Pool status
 * @property {string} created_at - Creation timestamp
 * @property {string} updated_at - Last update timestamp
 */

/**
 * Marketplace Item interface
 * @typedef {Object} MarketplaceItem
 * @property {string} id - Item ID
 * @property {string} name - Item name
 * @property {string} description - Item description
 * @property {'weapon'|'armor'|'boost'|'cosmetic'} type - Item type
 * @property {number} price - Price in STG
 * @property {number} ton_price - Price in TON (optional)
 * @property {Object} stats - Item stats/bonuses
 * @property {string} rarity - Item rarity
 * @property {boolean} active - Whether item is available
 * @property {string} created_at - Creation timestamp
 */

/**
 * API Response interface
 * @typedef {Object} ApiResponse
 * @property {boolean} success - Whether request was successful
 * @property {*} data - Response data
 * @property {string|null} error - Error message (if any)
 * @property {Object|null} meta - Additional metadata
 */

/**
 * API Error interface
 * @typedef {Object} ApiError
 * @property {string} message - Error message
 * @property {number} status - HTTP status code
 * @property {string} context - Error context
 * @property {Object} response - Error response data
 */

/**
 * Component Props interfaces
 */

/**
 * Navigation component props
 * @typedef {Object} NavigationProps
 * @property {string} [currentView] - Current active view
 * @property {Function} [setCurrentView] - Function to set current view
 */

/**
 * Battle Arena component props
 * @typedef {Object} BattleArenaProps
 * @property {User} user - Current user data
 * @property {Function} [onBattleComplete] - Callback for battle completion
 */

/**
 * Premium Features interface
 * @typedef {Object} PremiumFeature
 * @property {string} id - Feature ID
 * @property {string} name - Feature name
 * @property {string} description - Feature description
 * @property {number} price - Price in TON
 * @property {number} duration - Duration in milliseconds
 * @property {string[]} benefits - List of benefits
 * @property {boolean} user_owned - Whether user owns this feature
 */

/**
 * Achievement interface
 * @typedef {Object} Achievement
 * @property {string} id - Achievement ID
 * @property {string} title - Achievement title
 * @property {string} description - Achievement description
 * @property {boolean} completed - Whether achievement is completed
 * @property {number} reward - STG reward
 * @property {'common'|'rare'|'epic'|'legendary'} rarity - Achievement rarity
 * @property {string} completed_at - Completion timestamp (if completed)
 */

/**
 * Referral interface
 * @typedef {Object} Referral
 * @property {string} id - Referral ID
 * @property {string} username - Referred username
 * @property {string} first_name - Referred first name
 * @property {string} created_at - Referral timestamp
 * @property {number} stg_balance - Referred user's STG balance
 * @property {number} level - Referred user's level
 */

/**
 * Validation schemas
 */

/**
 * User registration data
 * @typedef {Object} UserRegistration
 * @property {string} username - Username (3-20 chars, alphanumeric)
 * @property {string} faction - Faction ('iran' | 'usa')
 * @property {string} referral_code - Optional referral code
 */

/**
 * Battle creation data
 * @typedef {Object} BattleCreation
 * @property {string} opponent_id - Opponent user ID
 * @property {string} weapon_id - Weapon ID to use
 * @property {string} territory_id - Territory ID
 * @property {number} stg_wager - STG amount to wager (min 100)
 */

/**
 * Staking position data
 * @typedef {Object} StakingPosition
 * @property {string} pool_id - Pool ID
 * @property {number} amount - Amount to stake
 * @property {number} duration - Lock duration in milliseconds
 */

/**
 * Constants
 */

export const FACTIONS = {
  IRAN: 'iran',
  USA: 'usa',
  NEUTRAL: 'neutral'
} as const;

export const BATTLE_RESULTS = {
  WIN: 'win',
  LOSE: 'lose',
  DRAW: 'draw'
} as const;

export const TOURNAMENT_STATUS = {
  REGISTRATION: 'registration',
  ACTIVE: 'active',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
} as const;

export const ITEM_RARITY = {
  COMMON: 'common',
  RARE: 'rare',
  EPIC: 'epic',
  LEGENDARY: 'legendary'
} as const;

/**
 * Validation functions
 */

/**
 * Validate username
 * @param {string} username - Username to validate
 * @returns {boolean} - Whether username is valid
 */
export const validateUsername = (username) => {
  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
  return usernameRegex.test(username);
};

/**
 * Validate faction
 * @param {string} faction - Faction to validate
 * @returns {boolean} - Whether faction is valid
 */
export const validateFaction = (faction) => {
  return Object.values(FACTIONS).includes(faction);
};

/**
 * Validate STG amount
 * @param {number} amount - Amount to validate
 * @param {number} [min=0] - Minimum amount
 * @param {number} [max=1000000] - Maximum amount
 * @returns {boolean} - Whether amount is valid
 */
export const validateStgAmount = (amount, min = 0, max = 1000000) => {
  return typeof amount === 'number' && amount >= min && amount <= max;
};

/**
 * Validate email (if needed for future features)
 * @param {string} email - Email to validate
 * @returns {boolean} - Whether email is valid
 */
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Type guards
 */

/**
 * Check if value is a valid API response
 * @param {*} response - Value to check
 * @returns {response is ApiResponse} - Whether value is API response
 */
export const isApiResponse = (response) => {
  return typeof response === 'object' && 
         response !== null && 
         typeof response.success === 'boolean';
};

/**
 * Check if value is a valid user object
 * @param {*} user - Value to check
 * @returns {user is User} - Whether value is a user object
 */
export const isUser = (user) => {
  return typeof user === 'object' && 
         user !== null && 
         typeof user.id === 'string' && 
         typeof user.username === 'string';
};

/**
 * Check if value is a valid battle object
 * @param {*} battle - Value to check
 * @returns {battle is Battle} - Whether value is a battle object
 */
export const isBattle = (battle) => {
  return typeof battle === 'object' && 
         battle !== null && 
         typeof battle.id === 'string' && 
         typeof battle.attacker_id === 'string' && 
         typeof battle.defender_id === 'string';
};

export default {
  // Types are exported as JSDoc for better IDE support
  // Constants
  FACTIONS,
  BATTLE_RESULTS,
  TOURNAMENT_STATUS,
  ITEM_RARITY,
  
  // Validation functions
  validateUsername,
  validateFaction,
  validateStgAmount,
  validateEmail,
  
  // Type guards
  isApiResponse,
  isUser,
  isBattle
};
