/**
 * Enhanced API Client with Error Handling
 * Provides consistent API communication with automatic error handling
 */

import errorHandler from './errorHandler';

class ApiClient {
  constructor(baseURL = 'http://localhost:3001/api') {
    this.baseURL = baseURL;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    };
  }

  /**
   * Get authentication headers
   * @returns {Object} - Auth headers
   */
  getAuthHeaders() {
    const token = localStorage.getItem('auth_token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  }

  /**
   * Get user-specific headers
   * @returns {Object} - User headers
   */
  getUserHeaders() {
    const userData = JSON.parse(localStorage.getItem('auth_user') || '{}');
    const headers = {};
    
    if (userData.id) {
      headers['x-user-id'] = userData.id;
    }
    
    if (userData.faction) {
      headers['x-user-faction'] = userData.faction;
    }
    
    return headers;
  }

  /**
   * Make HTTP request with error handling
   * @param {string} url - Request URL
   * @param {Object} options - Fetch options
   * @param {string} context - Request context for error handling
   * @returns {Promise<Object>} - Response data
   */
  async request(url, options = {}, context = 'API') {
    const fullUrl = `${this.baseURL}${url}`;
    
    const config = {
      ...options,
      headers: {
        ...this.defaultHeaders,
        ...this.getAuthHeaders(),
        ...this.getUserHeaders(),
        ...options.headers,
      },
    };

    try {
      const response = await fetch(fullUrl, config);

      if (!response.ok) {
        const error = await errorHandler.handleApiError(response, context);
        throw error;
      }

      // Handle empty responses
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      }
      
      return { success: true };
    } catch (error) {
      // Re-throw network errors and API errors
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw errorHandler.handleNetworkError(error, context);
      }
      
      throw error;
    }
  }

  /**
   * GET request
   * @param {string} url - Endpoint URL
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} - Response data
   */
  async get(url, options = {}) {
    return this.request(url, { ...options, method: 'GET' }, `GET ${url}`);
  }

  /**
   * POST request
   * @param {string} url - Endpoint URL
   * @param {Object} data - Request body data
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} - Response data
   */
  async post(url, data = {}, options = {}) {
    return this.request(url, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data),
    }, `POST ${url}`);
  }

  /**
   * PUT request
   * @param {string} url - Endpoint URL
   * @param {Object} data - Request body data
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} - Response data
   */
  async put(url, data = {}, options = {}) {
    return this.request(url, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data),
    }, `PUT ${url}`);
  }

  /**
   * DELETE request
   * @param {string} url - Endpoint URL
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} - Response data
   */
  async delete(url, options = {}) {
    return this.request(url, { ...options, method: 'DELETE' }, `DELETE ${url}`);
  }

  /**
   * Upload file
   * @param {string} url - Endpoint URL
   * @param {FormData} formData - Form data with file
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} - Response data
   */
  async upload(url, formData, options = {}) {
    const config = {
      ...options,
      method: 'POST',
      body: formData,
      headers: {
        ...this.getAuthHeaders(),
        ...this.getUserHeaders(),
        // Don't set Content-Type for FormData - browser will set it with boundary
      },
    };

    return this.request(url, config, `UPLOAD ${url}`);
  }

  /**
   * Batch multiple requests
   * @param {Array} requests - Array of request objects
   * @returns {Promise<Array>} - Array of responses
   */
  async batch(requests) {
    try {
      const responses = await Promise.allSettled(
        requests.map(req => this.request(req.url, req.options, req.context))
      );

      return responses.map((response, index) => ({
        index,
        status: response.status,
        data: response.status === 'fulfilled' ? response.value : null,
        error: response.status === 'rejected' ? response.reason : null,
      }));
    } catch (error) {
      errorHandler.logError(error, 'Batch Request');
      throw error;
    }
  }

  /**
   * Request with retry logic
   * @param {string} url - Endpoint URL
   * @param {Object} options - Request options
   * @param {number} maxRetries - Maximum retry attempts
   * @param {number} delay - Delay between retries (ms)
   * @returns {Promise<Object>} - Response data
   */
  async requestWithRetry(url, options = {}, maxRetries = 3, delay = 1000) {
    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await this.request(url, options, `RETRY ${url} (attempt ${attempt})`);
      } catch (error) {
        lastError = error;
        
        // Don't retry on client errors (4xx)
        if (error.status >= 400 && error.status < 500) {
          throw error;
        }

        // If this is the last attempt, throw the error
        if (attempt === maxRetries) {
          throw error;
        }

        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delay * attempt));
      }
    }

    throw lastError;
  }
}

// Create singleton instance
const apiClient = new ApiClient();

export default apiClient;
