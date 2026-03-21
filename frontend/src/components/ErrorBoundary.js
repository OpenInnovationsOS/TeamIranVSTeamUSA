import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styled from 'styled-components';

const ErrorBoundaryContainer = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%);
  padding: 20px;
`;

const ErrorCard = styled(motion.div)`
  background: rgba(255, 255, 255, 0.05);
  border-radius: 20px;
  padding: 30px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  max-width: 500px;
  text-align: center;
`;

const ErrorIcon = styled.div`
  font-size: 64px;
  margin-bottom: 20px;
`;

const ErrorTitle = styled.h2`
  font-size: 24px;
  font-weight: bold;
  color: #e74c3c;
  margin-bottom: 12px;
`;

const ErrorMessage = styled.p`
  font-size: 16px;
  color: rgba(255, 255, 255, 0.8);
  line-height: 1.5;
  margin-bottom: 20px;
`;

const ErrorDetails = styled.div`
  background: rgba(231, 76, 60, 0.1);
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 20px;
  text-align: left;
`;

const ErrorDetail = styled.div`
  font-size: 14px;
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 8px;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const ErrorActions = styled.div`
  display: flex;
  gap: 12px;
  justify-content: center;
`;

const ErrorButton = styled(motion.button)`
  padding: 12px 24px;
  background: linear-gradient(45deg, #e74c3c, #c0392b);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(231, 76, 60, 0.3);
  }
`;

const SecondaryButton = styled(motion.button)`
  padding: 12px 24px;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: translateY(-1px);
  }
`;

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      errorId: null
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    console.error('Error caught by boundary:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo,
      errorId
    });

    // Log error to monitoring service
    this.logError(error, errorInfo, errorId);
  }

  logError = (error, errorInfo, errorId) => {
    const errorData = {
      id: errorId,
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      userId: localStorage.getItem('user_id') || 'anonymous'
    };

    // Send to error logging service
    try {
      fetch('/api/errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(errorData)
      }).catch(err => {
        console.error('Failed to log error:', err);
      });
    } catch (err) {
      console.error('Error logging failed:', err);
    }
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/dashboard';
  };

  render() {
    if (this.state.hasError) {
      return (
        <ErrorBoundaryContainer>
          <ErrorCard
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <ErrorIcon>🚨</ErrorIcon>
            <ErrorTitle>Oops! Something went wrong</ErrorTitle>
            <ErrorMessage>
              We encountered an unexpected error. Don't worry, our team has been notified and is working on a fix.
            </ErrorMessage>
            
            <ErrorDetails>
              <ErrorDetail><strong>Error ID:</strong> {this.state.errorId}</ErrorDetail>
              <ErrorDetail><strong>Time:</strong> {new Date().toLocaleString()}</ErrorDetail>
              <ErrorDetail><strong>Component:</strong> {this.state.errorInfo?.componentStack?.split('\n')[1]?.trim() || 'Unknown'}</ErrorDetail>
            </ErrorDetails>

            <ErrorActions>
              <ErrorButton
                onClick={this.handleReload}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Reload Page
              </ErrorButton>
              <SecondaryButton
                onClick={this.handleGoHome}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Go Home
              </SecondaryButton>
            </ErrorActions>
          </ErrorCard>
        </ErrorBoundaryContainer>
      );
    }

    return this.props.children;
  }
}

// Error handling utilities
export const ErrorHandler = {
  // Handle API errors
  handleApiError: (error, context = '') => {
    console.error(`API Error in ${context}:`, error);
    
    const errorData = {
      message: error.message || 'Unknown API error',
      status: error.response?.status,
      statusText: error.response?.statusText,
      url: error.config?.url,
      method: error.config?.method,
      timestamp: new Date().toISOString(),
      context
    };

    // Log to monitoring
    this.logError(errorData);

    // Return user-friendly message
    if (error.response?.status === 401) {
      return 'Your session has expired. Please log in again.';
    } else if (error.response?.status === 403) {
      return 'You do not have permission to perform this action.';
    } else if (error.response?.status === 404) {
      return 'The requested resource was not found.';
    } else if (error.response?.status >= 500) {
      return 'Server error. Please try again later.';
    } else if (error.code === 'NETWORK_ERROR') {
      return 'Network error. Please check your connection.';
    } else {
      return error.message || 'An unexpected error occurred.';
    }
  },

  // Handle WebSocket errors
  handleWebSocketError: (error, context = '') => {
    console.error(`WebSocket Error in ${context}:`, error);
    
    const errorData = {
      type: 'websocket',
      message: error.message || 'WebSocket connection error',
      code: error.code,
      timestamp: new Date().toISOString(),
      context
    };

    this.logError(errorData);
  },

  // Handle async errors
  handleAsyncError: (error, context = '') => {
    console.error(`Async Error in ${context}:`, error);
    
    const errorData = {
      type: 'async',
      message: error.message || 'Async operation failed',
      stack: error.stack,
      timestamp: new Date().toISOString(),
      context
    };

    this.logError(errorData);
  },

  // Log error to monitoring service
  logError: (errorData) => {
    try {
      fetch('/api/errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(errorData)
      }).catch(err => {
        console.error('Failed to log error:', err);
      });
    } catch (err) {
      console.error('Error logging failed:', err);
    }
  },

  // Create error toast
  showErrorToast: (message, error = null) => {
    if (error) {
      console.error('Toast Error:', error);
      this.logError({
        type: 'toast',
        message,
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      });
    }

    // Use toast library (assuming react-hot-toast is available)
    if (typeof window !== 'undefined' && window.toast) {
      window.toast.error(message, {
        duration: 5000,
        style: {
          background: '#e74c3c',
          color: '#ffffff',
          border: '1px solid rgba(255, 255, 255, 0.2)',
        }
      });
    }
  },

  // Create success toast
  showSuccessToast: (message) => {
    if (typeof window !== 'undefined' && window.toast) {
      window.toast.success(message, {
        duration: 3000,
        style: {
          background: '#27ae60',
          color: '#ffffff',
          border: '1px solid rgba(255, 255, 255, 0.2)',
        }
      });
    }
  },

  // Create warning toast
  showWarningToast: (message) => {
    if (typeof window !== 'undefined' && window.toast) {
      window.toast(message, {
        duration: 4000,
        icon: '⚠️',
        style: {
          background: '#f39c12',
          color: '#ffffff',
          border: '1px solid rgba(255, 255, 255, 0.2)',
        }
      });
    }
  }
};

// Error handling hook
export const useErrorHandler = () => {
  const handleAsyncError = React.useCallback((error, context) => {
    ErrorHandler.handleAsyncError(error, context);
  }, []);

  const handleApiError = React.useCallback((error, context) => {
    const message = ErrorHandler.handleApiError(error, context);
    ErrorHandler.showErrorToast(message, error);
  }, []);

  const handleWebSocketError = React.useCallback((error, context) => {
    ErrorHandler.handleWebSocketError(error, context);
  }, []);

  const showError = React.useCallback((message, error) => {
    ErrorHandler.showErrorToast(message, error);
  }, []);

  const showSuccess = React.useCallback((message) => {
    ErrorHandler.showSuccessToast(message);
  }, []);

  const showWarning = React.useCallback((message) => {
    ErrorHandler.showWarningToast(message);
  }, []);

  return {
    handleAsyncError,
    handleApiError,
    handleWebSocketError,
    showError,
    showSuccess,
    showWarning
  };
};

// Async error boundary hook
export const useAsyncErrorBoundary = () => {
  React.useEffect(() => {
    const handleUnhandledRejection = (event) => {
      console.error('Unhandled promise rejection:', event.reason);
      ErrorHandler.handleAsyncError(event.reason, 'unhandled_promise_rejection');
    };

    const handleError = (event) => {
      console.error('Unhandled error:', event.error);
      ErrorHandler.handleAsyncError(event.error, 'unhandled_error');
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleError);

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleError);
    };
  }, []);
};

// Network status hook
export const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = React.useState(navigator.onLine);

  React.useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      ErrorHandler.showSuccessToast('Connection restored');
    };

    const handleOffline = () => {
      setIsOnline(false);
      ErrorHandler.showWarningToast('Connection lost. Some features may not work properly.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
};

export default ErrorBoundary;
