/**
 * Centralized Error Handler
 * Provides consistent error handling across the application
 */

class ErrorHandler {
  constructor() {
    this.errorLog = [];
    this.maxLogSize = 100;
  }

  /**
   * Log an error with context
   * @param {Error} error - The error object
   * @param {string} context - Where the error occurred
   * @param {Object} additionalInfo - Additional context data
   */
  logError(error, context = 'Unknown', additionalInfo = {}) {
    const errorEntry = {
      timestamp: new Date().toISOString(),
      message: error.message || 'Unknown error',
      stack: error.stack,
      context,
      additionalInfo,
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    this.errorLog.push(errorEntry);
    
    // Keep log size manageable
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog.shift();
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error(`[${context}]`, error, additionalInfo);
    }

    // Send to error reporting service in production
    if (process.env.NODE_ENV === 'production') {
      this.reportError(errorEntry);
    }
  }

  /**
   * Handle API errors consistently
   * @param {Response} response - Fetch response object
   * @param {string} context - API endpoint context
   * @returns {Promise<Error>} - Processed error
   */
  async handleApiError(response, context = 'API') {
    let errorData;
    
    try {
      errorData = await response.json();
    } catch (e) {
      errorData = { message: 'Failed to parse error response' };
    }

    const error = new Error(errorData.message || `HTTP ${response.status}`);
    error.status = response.status;
    error.context = context;
    error.response = errorData;

    this.logError(error, context, {
      status: response.status,
      statusText: response.statusText,
      url: response.url
    });

    return error;
  }

  /**
   * Handle network errors
   * @param {Error} error - Network error
   * @param {string} context - Network operation context
   */
  handleNetworkError(error, context = 'Network') {
    const networkError = new Error(
      error.message === 'Failed to fetch' 
        ? 'Network connection failed. Please check your internet connection.'
        : error.message
    );
    
    networkError.originalError = error;
    networkError.context = context;

    this.logError(networkError, context, {
      type: 'network',
      message: error.message
    });

    return networkError;
  }

  /**
   * Report errors to external service
   * @param {Object} errorEntry - Error data to report
   */
  async reportError(errorEntry) {
    try {
      // In a real app, this would send to Sentry, LogRocket, etc.
      // For now, we'll just store it locally
      const existingErrors = JSON.parse(localStorage.getItem('error_reports') || '[]');
      existingErrors.push(errorEntry);
      
      // Keep only last 50 errors
      if (existingErrors.length > 50) {
        existingErrors.shift();
      }
      
      localStorage.setItem('error_reports', JSON.stringify(existingErrors));
    } catch (e) {
      // Fail silently for error reporting to avoid infinite loops
      console.warn('Failed to report error:', e);
    }
  }

  /**
   * Get recent errors for debugging
   * @param {number} limit - Number of recent errors to return
   * @returns {Array} - Recent error entries
   */
  getRecentErrors(limit = 10) {
    return this.errorLog.slice(-limit);
  }

  /**
   * Clear error log
   */
  clearErrors() {
    this.errorLog = [];
    localStorage.removeItem('error_reports');
  }

  /**
   * Create user-friendly error message
   * @param {Error} error - The error to format
   * @returns {string} - User-friendly message
   */
  getUserMessage(error) {
    // Network errors
    if (error.message.includes('fetch') || error.message.includes('network')) {
      return 'Network connection failed. Please check your internet connection and try again.';
    }

    // Authentication errors
    if (error.status === 401 || error.message.includes('auth')) {
      return 'Authentication failed. Please log in again.';
    }

    // Permission errors
    if (error.status === 403) {
      return 'You don\'t have permission to perform this action.';
    }

    // Not found errors
    if (error.status === 404) {
      return 'The requested resource was not found.';
    }

    // Server errors
    if (error.status >= 500) {
      return 'Server error occurred. Please try again later.';
    }

    // Default message
    return error.message || 'An unexpected error occurred. Please try again.';
  }
}

// Create singleton instance
const errorHandler = new ErrorHandler();

export default errorHandler;
