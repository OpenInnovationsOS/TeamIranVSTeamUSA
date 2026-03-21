// Security Middleware
// Comprehensive security protection for the application

const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss');
const hpp = require('hpp');
const crypto = require('crypto');

// Security configuration
const SECURITY_CONFIG = {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      fontSrc: ["'self'", "data:"],
      connectSrc: ["'self'", "wss:", "https:"],
      mediaSrc: ["'self'"],
      objectSrc: ["'none'"],
      frameSrc: ["'self'"],
      frameAncestors: ["'none'"],
      formAction: ["'self'"],
      baseUri: ["'self'"],
      upgradeInsecureRequests: []
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  rateLimiting: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false
  },
  slowDown: {
    windowMs: 15 * 60 * 1000,
    delayAfter: 50,
    delayMs: 500
  }
};

// XSS protection
const xssProtection = (req, res, next) => {
  const sanitize = (obj) => {
    if (typeof obj === 'string') {
      return xss(obj);
    } else if (Array.isArray(obj)) {
      return obj.map(sanitize);
    } else if (obj && typeof obj === 'object') {
      const sanitized = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          sanitized[key] = sanitize(obj[key]);
        }
      }
      return sanitized;
    }
    return obj;
  };

  // Sanitize request body
  if (req.body) {
    req.body = sanitize(req.body);
  }

  // Sanitize query parameters
  if (req.query) {
    req.query = sanitize(req.query);
  }

  // Sanitize params
  if (req.params) {
    req.params = sanitize(req.params);
  }

  next();
};

// SQL injection protection
const sqlInjectionProtection = (req, res, next) => {
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/gi,
    /(\b(OR|AND)\s+\d+\s*=\s*\d+)/gi,
    /(\b(OR|AND)\s+['"][^'"]*['"]\s*=\s*['"][^'"]*['"])/gi,
    /(--|;|\/\*|\*\/|@@|@|char|nchar|varchar|nvarchar|alter|begin|cast|create|cursor|declare|delete|drop|end|exec|execute|fetch|insert|kill|open|select|sys|sysobjects|syscolumns|table|update)/gi
  ];

  const checkString = (str) => {
    if (typeof str !== 'string') return false;
    return sqlPatterns.some(pattern => pattern.test(str));
  };

  const checkObject = (obj) => {
    if (typeof obj === 'string') {
      return checkString(obj);
    } else if (Array.isArray(obj)) {
      return obj.some(checkObject);
    } else if (obj && typeof obj === 'object') {
      return Object.values(obj).some(checkObject);
    }
    return false;
  };

  // Check request body
  if (req.body && checkObject(req.body)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid request detected'
    });
  }

  // Check query parameters
  if (req.query && checkObject(req.query)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid request detected'
    });
  }

  // Check params
  if (req.params && checkObject(req.params)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid request detected'
    });
  }

  next();
};

// Request size limiter
const requestSizeLimiter = (req, res, next) => {
  const maxRequestSize = 10 * 1024 * 1024; // 10MB
  
  if (req.headers['content-length'] && parseInt(req.headers['content-length']) > maxRequestSize) {
    return res.status(413).json({
      success: false,
      error: 'Request too large'
    });
  }

  next();
};

// IP whitelist/blacklist
const ipFilter = (req, res, next) => {
  const clientIP = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;
  
  // Blacklist (example)
  const blacklistedIPs = process.env.BLACKLISTED_IPS ? process.env.BLACKLISTED_IPS.split(',') : [];
  
  if (blacklistedIPs.includes(clientIP)) {
    return res.status(403).json({
      success: false,
      error: 'Access denied'
    });
  }

  // Whitelist (if configured)
  if (process.env.WHITELISTED_IPS) {
    const whitelistedIPs = process.env.WHITELISTED_IPS.split(',');
    if (!whitelistedIPs.includes(clientIP)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }
  }

  next();
};

// Bot detection
const botDetection = (req, res, next) => {
  const userAgent = req.headers['user-agent'] || '';
  const suspiciousPatterns = [
    /bot/i,
    /crawler/i,
    /spider/i,
    /scraper/i,
    /curl/i,
    /wget/i,
    /python/i,
    /java/i,
    /perl/i,
    /php/i
  ];

  // Check for suspicious user agents
  const isSuspicious = suspiciousPatterns.some(pattern => pattern.test(userAgent));
  
  // Check for missing or suspicious headers
  const hasRequiredHeaders = req.headers['user-agent'] && req.headers['accept'];
  
  // Check for rapid requests (simple rate limiting)
  const clientIP = req.ip || req.connection.remoteAddress;
  const now = Date.now();
  
  if (!global.requestTracker) {
    global.requestTracker = {};
  }
  
  if (!global.requestTracker[clientIP]) {
    global.requestTracker[clientIP] = [];
  }
  
  // Clean old requests (older than 1 minute)
  global.requestTracker[clientIP] = global.requestTracker[clientIP].filter(
    timestamp => now - timestamp < 60000
  );
  
  global.requestTracker[clientIP].push(now);
  
  const requestCount = global.requestTracker[clientIP].length;
  
  // Block suspicious requests
  if (isSuspicious || !hasRequiredHeaders || requestCount > 60) {
    return res.status(403).json({
      success: false,
      error: 'Access denied'
    });
  }

  next();
};

// Content type validation
const contentTypeValidation = (req, res, next) => {
  const method = req.method;
  const contentType = req.headers['content-type'];
  
  // Only validate content type for POST/PUT/PATCH requests
  if (['POST', 'PUT', 'PATCH'].includes(method)) {
    const validContentTypes = [
      'application/json',
      'application/x-www-form-urlencoded',
      'multipart/form-data'
    ];
    
    if (!contentType || !validContentTypes.some(type => contentType.includes(type))) {
      return res.status(400).json({
        success: false,
        error: 'Invalid content type'
      });
    }
  }

  next();
};

// Request ID middleware
const requestId = (req, res, next) => {
  req.requestId = req.headers['x-request-id'] || crypto.randomBytes(16).toString('hex');
  res.setHeader('x-request-id', req.requestId);
  next();
};

// Security headers middleware
const securityHeaders = helmet({
  contentSecurityPolicy: SECURITY_CONFIG.contentSecurityPolicy,
  hsts: SECURITY_CONFIG.hsts,
  noSniff: true,
  frameguard: { action: 'deny' },
  xssFilter: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  permittedCrossDomainPolicies: false,
  hidePoweredBy: true,
  ieNoOpen: true,
  dnsPrefetchControl: { allow: false }
});

// Rate limiting middleware
const rateLimiter = rateLimit(SECURITY_CONFIG.rateLimiting);

// Slow down middleware
const slowDownMiddleware = slowDown(SECURITY_CONFIG.slowDown);

// MongoDB sanitization middleware
const mongoSanitizeMiddleware = mongoSanitize();

// HTTP parameter pollution middleware
const hppMiddleware = hpp();

// Combined security middleware
const securityMiddleware = [
  requestId,
  ipFilter,
  botDetection,
  requestSizeLimiter,
  contentTypeValidation,
  securityHeaders,
  rateLimiter,
  slowDownMiddleware,
  hppMiddleware,
  mongoSanitizeMiddleware,
  sqlInjectionProtection,
  xssProtection
];

// API-specific security middleware
const apiSecurity = [
  ...securityMiddleware,
  // Additional API-specific protections
  (req, res, next) => {
    // Validate API key if required
    const apiKey = req.headers['x-api-key'];
    if (process.env.REQUIRE_API_KEY === 'true' && !apiKey) {
      return res.status(401).json({
        success: false,
        error: 'API key required'
      });
    }
    
    // Add API-specific headers
    res.setHeader('X-API-Version', '1.0.0');
    res.setHeader('X-Rate-Limit-Limit', SECURITY_CONFIG.rateLimiting.max);
    res.setHeader('X-Rate-Limit-Remaining', Math.max(0, SECURITY_CONFIG.rateLimiting.max - (req.rateLimit?.remaining || 0)));
    res.setHeader('X-Rate-Limit-Reset', req.rateLimit?.resetTime || Date.now() + SECURITY_CONFIG.rateLimiting.windowMs);
    
    next();
  }
];

// Webhook security middleware
const webhookSecurity = (req, res, next) => {
  const signature = req.headers['x-telegram-bot-api-secret-token'];
  const webhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
  
  if (webhookSecret && signature !== webhookSecret) {
    return res.status(403).json({
      success: false,
      error: 'Invalid webhook signature'
    });
  }
  
  // Additional webhook-specific validations
  const userAgent = req.headers['user-agent'];
  if (!userAgent || !userAgent.includes('TelegramBot')) {
    return res.status(403).json({
      success: false,
      error: 'Invalid webhook source'
    });
  }
  
  next();
};

// Export middleware
module.exports = {
  securityMiddleware,
  apiSecurity,
  webhookSecurity,
  securityHeaders,
  rateLimiter,
  slowDownMiddleware,
  mongoSanitizeMiddleware,
  hppMiddleware,
  sqlInjectionProtection,
  xssProtection,
  ipFilter,
  botDetection,
  requestSizeLimiter,
  contentTypeValidation,
  requestId
};
