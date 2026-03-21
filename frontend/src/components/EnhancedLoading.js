import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styled from 'styled-components';

// Enhanced Loading States
const LoadingOverlay = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(10, 10, 10, 0.8);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
`;

const LoadingContent = styled.div`
  text-align: center;
  color: white;
`;

const LoadingSpinner = styled(motion.div)`
  width: 40px;
  height: 40px;
  border: 3px solid rgba(255, 255, 255, 0.1);
  border-top: 3px solid #0088cc;
  border-radius: 50%;
  margin: 0 auto 16px;
`;

const LoadingText = styled.div`
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
`;

// Skeleton Loading Components
const SkeletonContainer = styled.div`
  width: 100%;
`;

const SkeletonLine = styled(motion.div)`
  height: ${props => props.height || '16px'};
  background: linear-gradient(90deg, 
    rgba(255, 255, 255, 0.05) 0%, 
    rgba(255, 255, 255, 0.1) 50%, 
    rgba(255, 255, 255, 0.05) 100%
  );
  border-radius: ${props => props.borderRadius || '4px'};
  margin-bottom: ${props => props.marginBottom || '8px'};
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
`;

const SkeletonCard = styled(motion.div)`
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 20px;
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const SkeletonAvatar = styled(motion.div)`
  width: ${props => props.size || '40px'};
  height: ${props => props.size || '40px'};
  border-radius: 50%;
  background: linear-gradient(90deg, 
    rgba(255, 255, 255, 0.1) 0%, 
    rgba(255, 255, 255, 0.2) 50%, 
    rgba(255, 255, 255, 0.1) 100%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
`;

const SkeletonButton = styled(motion.button)`
  height: ${props => props.height || '40px'};
  width: ${props => props.width || '120px'};
  background: linear-gradient(90deg, 
    rgba(255, 255, 255, 0.1) 0%, 
    rgba(255, 255, 255, 0.2) 50%, 
    rgba(255, 255, 255, 0.1) 100%
  );
  border-radius: 8px;
  border: none;
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
`;

// Progress Loading
const ProgressContainer = styled.div`
  width: 100%;
  max-width: 300px;
`;

const ProgressLabel = styled.div`
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 8px;
  text-align: center;
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  overflow: hidden;
`;

const ProgressFill = styled(motion.div)`
  height: 100%;
  background: linear-gradient(90deg, #0088cc, #00a6ff);
  border-radius: 4px;
  origin: left;
`;

// Pulse Loading
const PulseContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
`;

const PulseDot = styled(motion.div)`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #0088cc;
`;

// Dots Loading
const DotsContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
`;

const Dot = styled(motion.div)`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #0088cc;
`;

// Loading Hook
export const useLoading = (initialState = false) => {
  const [isLoading, setIsLoading] = React.useState(initialState);
  const [loadingText, setLoadingText] = React.useState('Loading...');

  const startLoading = React.useCallback((text = 'Loading...') => {
    setIsLoading(true);
    setLoadingText(text);
  }, []);

  const stopLoading = React.useCallback(() => {
    setIsLoading(false);
    setLoadingText('Loading...');
  }, []);

  const setLoadingText = React.useCallback((text) => {
    setLoadingText(text);
  }, []);

  return {
    isLoading,
    loadingText,
    startLoading,
    stopLoading,
    setLoadingText
  };
};

// Loading Components
export const LoadingOverlay = ({ isLoading, text = 'Loading...' }) => {
  return (
    <AnimatePresence>
      {isLoading && (
        <LoadingOverlay
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <LoadingContent>
            <LoadingSpinner
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            />
            <LoadingText>{text}</LoadingText>
          </LoadingContent>
        </LoadingOverlay>
      )}
    </AnimatePresence>
  );
};

export const SkeletonLoader = ({ lines = 3, height = '16px' }) => {
  return (
    <SkeletonContainer>
      {Array.from({ length: lines }).map((_, index) => (
        <SkeletonLine
          key={index}
          height={height}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
        />
      ))}
    </SkeletonContainer>
  );
};

export const SkeletonCard = ({ children, isLoading }) => {
  if (isLoading) {
    return (
      <SkeletonCard>
        <SkeletonLine height="20px" marginBottom="12px" width="60%" />
        <SkeletonLine height="14px" marginBottom="8px" />
        <SkeletonLine height="14px" marginBottom="8px" />
        <SkeletonLine height="14px" width="80%" />
      </SkeletonCard>
    );
  }

  return children;
};

export const SkeletonAvatar = ({ isLoading, size = '40px', children }) => {
  if (isLoading) {
    return <SkeletonAvatar size={size} />;
  }

  return children;
};

export const SkeletonButton = ({ isLoading, width, height, children }) => {
  if (isLoading) {
    return <SkeletonButton width={width} height={height} />;
  }

  return children;
};

export const ProgressLoader = ({ progress, text, showPercentage = true }) => {
  return (
    <ProgressContainer>
      {text && <ProgressLabel>{text}</ProgressLabel>}
      <ProgressBar>
        <ProgressFill
          initial={{ scaleX: 0 }}
          animate={{ scaleX: progress / 100 }}
          transition={{ duration: 0.3 }}
        />
      </ProgressBar>
      {showPercentage && (
        <ProgressLabel style={{ marginTop: '8px' }}>
          {Math.round(progress)}%
        </ProgressLabel>
      )}
    </ProgressContainer>
  );
};

export const PulseLoader = ({ dots = 3 }) => {
  return (
    <PulseContainer>
      {Array.from({ length: dots }).map((_, index) => (
        <PulseDot
          key={index}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [1, 0.7, 1]
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            delay: index * 0.2
          }}
        />
      ))}
    </PulseContainer>
  );
};

export const DotsLoader = ({ dots = 3 }) => {
  return (
    <DotsContainer>
      {Array.from({ length: dots }).map((_, index) => (
        <Dot
          key={index}
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.5, 1, 0.5]
          }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            delay: index * 0.15
          }}
        />
      ))}
    </DotsContainer>
  );
};

// Higher-order component for loading states
export const withLoading = (Component) => {
  return function WithLoadingComponent({ isLoading, loadingText, ...props }) {
    return (
      <>
        <LoadingOverlay isLoading={isLoading} text={loadingText} />
        <Component {...props} />
      </>
    );
  };
};

// Context for global loading state
export const LoadingContext = React.createContext({
  globalLoading: false,
  setGlobalLoading: () => {}
});

export const LoadingProvider = ({ children }) => {
  const [globalLoading, setGlobalLoading] = React.useState(false);
  const [loadingText, setLoadingText] = React.useState('');

  const value = {
    globalLoading,
    loadingText,
    setGlobalLoading,
    setLoadingText
  };

  return (
    <LoadingContext.Provider value={value}>
      {children}
    </LoadingContext.Provider>
  );
};

export const useGlobalLoading = () => {
  const context = React.useContext(LoadingContext);
  if (!context) {
    throw new Error('useGlobalLoading must be used within LoadingProvider');
  }
  return context;
};

// Loading animation variants
export const loadingVariants = {
  container: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 }
  },
  item: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 }
  },
  skeleton: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    transition: { duration: 0.3 }
  }
};

// Custom loading animations
export const customAnimations = {
  shimmer: {
    background: [
      'linear-gradient(90deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.05) 100%)',
      'linear-gradient(90deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.15) 50%, rgba(255,255,255,0.05) 100%)',
      'linear-gradient(90deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.05) 100%)'
    ],
    backgroundSize: '200% 100%',
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: 'linear'
    }
  },
  pulse: {
    scale: [1, 1.1, 1],
    opacity: [1, 0.7, 1],
    transition: {
      duration: 1,
      repeat: Infinity,
      ease: 'easeInOut'
    }
  },
  bounce: {
    y: [0, -10, 0],
    transition: {
      duration: 0.8,
      repeat: Infinity,
      ease: 'easeInOut'
    }
  }
};

// Add keyframes for shimmer animation
const style = document.createElement('style');
style.textContent = `
  @keyframes shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }
`;
document.head.appendChild(style);

export default {
  LoadingOverlay,
  SkeletonLoader,
  SkeletonCard,
  SkeletonAvatar,
  SkeletonButton,
  ProgressLoader,
  PulseLoader,
  DotsLoader,
  withLoading,
  LoadingProvider,
  useLoading,
  useGlobalLoading,
  loadingVariants,
  customAnimations
};
