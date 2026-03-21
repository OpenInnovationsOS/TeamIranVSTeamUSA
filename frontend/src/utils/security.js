/**
 * Security Utilities
 * Provides security-related helper functions and validations
 */

/**
 * Sanitize user input to prevent XSS attacks
 * @param {string} input - User input to sanitize
 * @returns {string} - Sanitized input
 */
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return '';
  
  return input
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim();
};

/**
 * Validate and sanitize numeric input
 * @param {string|number} input - Input to validate
 * @param {number} min - Minimum allowed value
 * @param {number} max - Maximum allowed value
 * @returns {number|null} - Validated number or null
 */
export const validateNumber = (input, min = 0, max = Number.MAX_SAFE_INTEGER) => {
  const num = typeof input === 'string' ? parseFloat(input) : input;
  
  if (isNaN(num) || !isFinite(num)) {
    return null;
  }
  
  return Math.max(min, Math.min(max, num));
};

/**
 * Validate and sanitize text input
 * @param {string} input - Input to validate
 * @param {number} minLength - Minimum length
 * @param {number} maxLength - Maximum length
 * @param {RegExp} [allowedPattern] - Allowed character pattern
 * @returns {string|null} - Validated string or null
 */
export const validateText = (input, minLength = 0, maxLength = 1000, allowedPattern) => {
  if (typeof input !== 'string') return null;
  
  const sanitized = sanitizeInput(input);
  
  if (sanitized.length < minLength || sanitized.length > maxLength) {
    return null;
  }
  
  if (allowedPattern && !allowedPattern.test(sanitized)) {
    return null;
  }
  
  return sanitized;
};

/**
 * Generate cryptographically secure random string
 * @param {number} length - Length of the random string
 * @param {string} [charset] - Character set to use
 * @returns {string} - Random string
 */
export const generateSecureRandom = (length = 32, charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789') => {
  let result = '';
  const randomValues = new Uint32Array(length);
  
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(randomValues);
    
    for (let i = 0; i < length; i++) {
      result += charset[randomValues[i] % charset.length];
    }
  } else {
    // Fallback for environments without crypto API
    for (let i = 0; i < length; i++) {
      result += charset[Math.floor(Math.random() * charset.length)];
    }
  }
  
  return result;
};

/**
 * Hash a string using simple hash function (for non-cryptographic purposes)
 * @param {string} str - String to hash
 * @returns {string} - Hashed string
 */
export const simpleHash = (str) => {
  let hash = 0;
  if (str.length === 0) return hash.toString();
  
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  return Math.abs(hash).toString(36);
};

/**
 * Check if a password meets security requirements
 * @param {string} password - Password to validate
 * @returns {Object} - Validation result with reasons
 */
export const validatePassword = (password) => {
  const result = {
    isValid: true,
    reasons: []
  };
  
  if (typeof password !== 'string') {
    result.isValid = false;
    result.reasons.push('Password must be a string');
    return result;
  }
  
  if (password.length < 8) {
    result.isValid = false;
    result.reasons.push('Password must be at least 8 characters long');
  }
  
  if (password.length > 128) {
    result.isValid = false;
    result.reasons.push('Password must be less than 128 characters long');
  }
  
  if (!/[a-z]/.test(password)) {
    result.isValid = false;
    result.reasons.push('Password must contain at least one lowercase letter');
  }
  
  if (!/[A-Z]/.test(password)) {
    result.isValid = false;
    result.reasons.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[0-9]/.test(password)) {
    result.isValid = false;
    result.reasons.push('Password must contain at least one number');
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    result.isValid = false;
    result.reasons.push('Password must contain at least one special character');
  }
  
  return result;
};

/**
 * Rate limiting helper
 */
class RateLimiter {
  constructor(maxRequests = 10, windowMs = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    this.requests = new Map();
  }
  
  /**
   * Check if action is allowed
   * @param {string} key - Identifier for the rate limiter (e.g., user ID, IP)
   * @returns {boolean} - Whether action is allowed
   */
  isAllowed(key) {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    
    if (!this.requests.has(key)) {
      this.requests.set(key, []);
    }
    
    const userRequests = this.requests.get(key);
    
    // Remove old requests outside the window
    const recentRequests = userRequests.filter(timestamp => timestamp > windowStart);
    this.requests.set(key, recentRequests);
    
    // Check if under limit
    return recentRequests.length < this.maxRequests;
  }
  
  /**
   * Record an action
   * @param {string} key - Identifier for the rate limiter
   */
  record(key) {
    if (!this.requests.has(key)) {
      this.requests.set(key, []);
    }
    
    this.requests.get(key).push(Date.now());
  }
  
  /**
   * Get remaining requests for a key
   * @param {string} key - Identifier for the rate limiter
   * @returns {number} - Number of remaining requests
   */
  getRemaining(key) {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    
    if (!this.requests.has(key)) {
      return this.maxRequests;
    }
    
    const userRequests = this.requests.get(key);
    const recentRequests = userRequests.filter(timestamp => timestamp > windowStart);
    
    return Math.max(0, this.maxRequests - recentRequests.length);
  }
  
  /**
   * Get reset time for a key
   * @param {string} key - Identifier for the rate limiter
   * @returns {number} - Timestamp when limit resets
   */
  getResetTime(key) {
    if (!this.requests.has(key)) {
      return 0;
    }
    
    const userRequests = this.requests.get(key);
    if (userRequests.length === 0) {
      return 0;
    }
    
    const oldestRequest = Math.min(...userRequests);
    return oldestRequest + this.windowMs;
  }
}

/**
 * Content Security Policy helper
 */
export const cspDirectives = {
  'default-src': ["'self'"],
  'script-src': ["'self'", "'unsafe-inline'"], // Required for React development
  'style-src': ["'self'", "'unsafe-inline'"], // Required for styled-components
  'img-src': ["'self'", 'data:', 'https:'],
  'font-src': ["'self'", 'data:'],
  'connect-src': ["'self'", 'http://localhost:3000', 'https://localhost:3000', 'http://localhost:3001', 'https://localhost:3001', 'https://your-backend.railway.app'],
  'frame-ancestors': ["'none'"],
  'base-uri': ["'self'"],
  'form-action': ["'self'"]
};

/**
 * Generate CSP header value
 * @returns {string} - CSP header value
 */
export const generateCSP = () => {
  return Object.entries(cspDirectives)
    .map(([directive, sources]) => `${directive} ${sources.join(' ')}`)
    .join('; ');
};

/**
 * Input validation patterns
 */
export const patterns = {
  username: /^[a-zA-Z0-9_]{3,20}$/,
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  telegramUsername: /^[a-zA-Z0-9_]{5,32}$/,
  referralCode: /^[A-Z0-9]{8}$/,
  stgAmount: /^\d+(\.\d{1,2})?$/,
  tonAmount: /^\d+(\.\d{1,9})?$/,
  weaponId: /^weapon_[a-z_]+$/,
  territoryId: /^[a-z_]+$/,
  guildName: /^.{3,50}$/,
  tournamentName: /^.{3,100}$/
};

/**
 * Validate common input patterns
 * @param {string} type - Pattern type to validate against
 * @param {string} input - Input to validate
 * @returns {boolean} - Whether input matches pattern
 */
export const validatePattern = (type, input) => {
  const pattern = patterns[type];
  return pattern ? pattern.test(input) : false;
};

/**
 * Security headers for API responses
 */
export const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Content-Security-Policy': generateCSP()
};

/**
 * Check if request is from same origin
 * @param {string} origin - Request origin
 * @param {string} allowedOrigin - Allowed origin
 * @returns {boolean} - Whether origin is allowed
 */
export const isSameOrigin = (origin, allowedOrigin = window.location.origin) => {
  return origin === allowedOrigin;
};

/**
 * Create rate limiters for common actions
 */
export const rateLimiters = {
  login: new RateLimiter(5, 15 * 60 * 1000), // 5 attempts per 15 minutes
  register: new RateLimiter(3, 60 * 60 * 1000), // 3 attempts per hour
  battle: new RateLimiter(10, 60 * 1000), // 10 battles per minute
  trade: new RateLimiter(20, 60 * 1000), // 20 trades per minute
  chat: new RateLimiter(30, 60 * 1000) // 30 chat messages per minute
};

export default {
  sanitizeInput,
  validateNumber,
  validateText,
  generateSecureRandom,
  simpleHash,
  validatePassword,
  RateLimiter,
  cspDirectives,
  generateCSP,
  patterns,
  validatePattern,
  securityHeaders,
  isSameOrigin,
  rateLimiters
};
