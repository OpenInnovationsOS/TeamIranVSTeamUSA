import styled, { css } from 'styled-components';

// Breakpoint definitions
export const breakpoints = {
  mobile: '480px',
  tablet: '768px',
  desktop: '1024px',
  large: '1200px',
  xlarge: '1440px'
};

// Media query helpers
export const media = {
  mobile: (...args) => css`
    @media (max-width: ${breakpoints.mobile}) {
      ${css(...args)}
    }
  `,
  tablet: (...args) => css`
    @media (max-width: ${breakpoints.tablet}) {
      ${css(...args)}
    }
  `,
  desktop: (...args) => css`
    @media (min-width: ${breakpoints.desktop}) {
      ${css(...args)}
    }
  `,
  large: (...args) => css`
    @media (min-width: ${breakpoints.large}) {
      ${css(...args)}
    }
  `,
  xlarge: (...args) => css`
    @media (min-width: ${breakpoints.xlarge}) {
      ${css(...args)}
    }
  `,
  // Custom ranges
  between: (min, max, ...args) => css`
    @media (min-width: ${breakpoints[min]}) and (max-width: ${breakpoints[max]}) {
      ${css(...args)}
    }
  `
};

// Responsive container
export const ResponsiveContainer = styled.div`
  width: 100%;
  max-width: ${breakpoints.large};
  margin: 0 auto;
  padding: 0 16px;
  
  ${media.tablet`
    padding: 0 24px;
  `}
  
  ${media.desktop`
    padding: 0 32px;
  `}
`;

// Responsive grid system
export const Grid = styled.div`
  display: grid;
  gap: ${props => props.gap || '16px'};
  grid-template-columns: ${props => {
    switch (props.columns) {
      case 1: return '1fr';
      case 2: return 'repeat(2, 1fr)';
      case 3: return 'repeat(3, 1fr)';
      case 4: return 'repeat(4, 1fr)';
      default: return 'repeat(auto-fit, minmax(250px, 1fr))';
    }
  }};
  
  ${media.tablet`
    grid-template-columns: ${props => {
      switch (props.columns) {
        case 2: return '1fr';
        case 3: return 'repeat(2, 1fr)';
        case 4: return 'repeat(2, 1fr)';
        default: return props.columns > 2 ? 'repeat(2, 1fr)' : '1fr';
      }
    }};
  `}
  
  ${media.mobile`
    grid-template-columns: 1fr;
    gap: ${props => props.mobileGap || '12px'};
  `}
`;

// Flex utilities
export const Flex = styled.div`
  display: flex;
  flex-direction: ${props => props.direction || 'row'};
  align-items: ${props => props.align || 'stretch'};
  justify-content: ${props => props.justify || 'flex-start'};
  gap: ${props => props.gap || '16px'};
  flex-wrap: ${props => props.wrap || 'nowrap'};
  
  ${media.mobile`
    flex-direction: ${props => props.mobileDirection || props.direction || 'column'};
    gap: ${props => props.mobileGap || props.gap || '12px'};
  `}
  
  ${media.tablet`
    flex-direction: ${props => props.tabletDirection || props.direction || 'row'};
    gap: ${props => props.tabletGap || props.gap || '14px'};
  `}
`;

// Responsive text
export const ResponsiveText = styled.div`
  font-size: ${props => {
    switch (props.size) {
      case 'xs': return '12px';
      case 'sm': return '14px';
      case 'md': return '16px';
      case 'lg': return '18px';
      case 'xl': return '24px';
      case 'xxl': return '32px';
      default: return '16px';
    }
  }};
  
  line-height: ${props => props.lineHeight || '1.5'};
  
  ${media.mobile`
    font-size: ${props => {
      switch (props.size) {
        case 'xs': return '11px';
        case 'sm': return '13px';
        case 'md': return '15px';
        case 'lg': return '17px';
        case 'xl': return '20px';
        case 'xxl': return '24px';
        default: return '15px';
      }
    }};
  `}
`;

// Responsive spacing
export const Spacer = styled.div`
  height: ${props => {
    const size = props.size || 'md';
    const sizes = {
      xs: '4px',
      sm: '8px',
      md: '16px',
      lg: '24px',
      xl: '32px',
      xxl: '48px'
    };
    return sizes[size] || '16px';
  }};
  
  ${props => props.vertical && css`
    width: 0;
  `}
  
  ${props => props.horizontal && css`
    height: 0;
    width: ${props => {
      const size = props.size || 'md';
      const sizes = {
        xs: '4px',
        sm: '8px',
        md: '16px',
        lg: '24px',
        xl: '32px',
        xxl: '48px'
      };
      return sizes[size] || '16px';
    }};
  `}
  
  ${media.mobile`
    height: ${props => {
      if (props.mobileSize) {
        const sizes = {
          xs: '2px',
          sm: '4px',
          md: '8px',
          lg: '12px',
          xl: '16px',
          xxl: '24px'
        };
        return sizes[props.mobileSize] || '8px';
      }
      return props.size ? '8px' : '8px';
    }};
  `}
`;

// Responsive card
export const ResponsiveCard = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  padding: 24px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  
  ${media.tablet`
    padding: 20px;
    border-radius: 12px;
  `}
  
  ${media.mobile`
    padding: 16px;
    border-radius: 8px;
    margin: 0 -8px;
    border-left: none;
    border-right: none;
    border-radius: 0;
  `}
`;

// Responsive button
export const ResponsiveButton = styled.button`
  padding: 12px 24px;
  background: linear-gradient(45deg, #0088cc, #00a6ff);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 16px;
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 136, 204, 0.3);
  }
  
  &:active {
    transform: translateY(0);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
  
  ${media.tablet`
    padding: 14px 20px;
    font-size: 15px;
  `}
  
  ${media.mobile`
    width: 100%;
    padding: 16px;
    font-size: 16px;
    border-radius: 0;
    margin: 8px 0;
  `}
  
  ${props => props.variant === 'small' && css`
    padding: 8px 16px;
    font-size: 14px;
    
    ${media.mobile`
      padding: 12px;
      font-size: 14px;
    `}
  `}
  
  ${props => props.variant === 'large' && css`
    padding: 16px 32px;
    font-size: 18px;
    
    ${media.mobile`
      padding: 20px;
      font-size: 18px;
    `}
  `}
`;

// Responsive input
export const ResponsiveInput = styled.input`
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  color: #ffffff;
  font-size: 16px;
  width: 100%;
  transition: all 0.3s ease;
  
  &:focus {
    outline: none;
    border-color: #0088cc;
    background: rgba(255, 255, 255, 0.15);
  }
  
  &::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }
  
  ${media.mobile`
    padding: 16px;
    font-size: 16px;
    border-radius: 0;
    margin: 8px 0;
  `}
`;

// Responsive navigation
export const ResponsiveNav = styled.nav`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background: rgba(26, 26, 46, 0.95);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  
  ${media.mobile`
    padding: 12px 16px;
    flex-wrap: wrap;
    gap: 8px;
  `}
`;

// Responsive modal
export const ResponsiveModal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
  
  ${media.mobile`
    padding: 0;
    align-items: flex-end;
  `}
`;

export const ModalContent = styled.div`
  background: rgba(26, 26, 46, 0.98);
  border-radius: 16px;
  padding: 32px;
  max-width: 500px;
  width: 100%;
  max-height: 80vh;
  overflow-y: auto;
  border: 1px solid rgba(255, 255, 255, 0.1);
  
  ${media.mobile`
    border-radius: 16px 16px 0 0;
    max-height: 70vh;
    padding: 24px 20px;
    width: 100%;
    max-width: none;
  `}
`;

// Touch-friendly utilities
export const TouchTarget = styled.div`
  min-height: 44px;
  min-width: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  
  ${media.mobile`
    min-height: 48px;
    min-width: 48px;
  `}
`;

// Safe area insets for mobile
export const SafeAreaContainer = styled.div`
  padding-top: env(safe-area-inset-top, 0);
  padding-bottom: env(safe-area-inset-bottom, 0);
  padding-left: env(safe-area-inset-left, 0);
  padding-right: env(safe-area-inset-right, 0);
`;

import React from 'react';

// Responsive hooks
export const useResponsive = () => {
  const [windowSize, setWindowSize] = React.useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
    height: typeof window !== 'undefined' ? window.innerHeight : 768
  });

  const [breakpoint, setBreakpoint] = React.useState('desktop');

  React.useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      setWindowSize({ width, height });
      
      if (width <= breakpoints.mobile) {
        setBreakpoint('mobile');
      } else if (width <= breakpoints.tablet) {
        setBreakpoint('tablet');
      } else {
        setBreakpoint('desktop');
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const isMobile = breakpoint === 'mobile';
  const isTablet = breakpoint === 'tablet';
  const isDesktop = breakpoint === 'desktop';

  return {
    windowSize,
    breakpoint,
    isMobile,
    isTablet,
    isDesktop,
    breakpoints
  };
};

// Orientation hook
export const useOrientation = () => {
  const [orientation, setOrientation] = React.useState(
    typeof window !== 'undefined' && window.innerWidth > window.innerHeight 
      ? 'landscape' 
      : 'portrait'
  );

  React.useEffect(() => {
    const handleOrientationChange = () => {
      setOrientation(window.innerWidth > window.innerHeight ? 'landscape' : 'portrait');
    };

    window.addEventListener('resize', handleOrientationChange);
    
    return () => {
      window.removeEventListener('resize', handleOrientationChange);
    };
  }, []);

  return orientation;
};

// Touch detection hook
export const useTouch = () => {
  const [isTouch, setIsTouch] = React.useState(false);

  React.useEffect(() => {
    const checkTouch = () => {
      setIsTouch(
        'ontouchstart' in window || 
        navigator.maxTouchPoints > 0 ||
        navigator.msMaxTouchPoints > 0
      );
    };

    checkTouch();
    window.addEventListener('touchstart', checkTouch, { once: true });
    
    return () => {
      window.removeEventListener('touchstart', checkTouch);
    };
  }, []);

  return isTouch;
};

// Viewport meta tag updater
export const updateViewportMeta = () => {
  if (typeof document !== 'undefined') {
    let viewport = document.querySelector('meta[name="viewport"]');
    if (!viewport) {
      viewport = document.createElement('meta');
      viewport.name = 'viewport';
      document.head.appendChild(viewport);
    }
    
    viewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover';
  }
};

// Responsive utility functions
export const responsive = {
  getValue: (mobile, tablet, desktop) => {
    const width = typeof window !== 'undefined' ? window.innerWidth : 1024;
    
    if (width <= breakpoints.mobile) return mobile;
    if (width <= breakpoints.tablet) return tablet;
    return desktop;
  },
  
  isMobile: () => {
    return typeof window !== 'undefined' && window.innerWidth <= breakpoints.mobile;
  },
  
  isTablet: () => {
    return typeof window !== 'undefined' && window.innerWidth <= breakpoints.tablet;
  },
  
  isDesktop: () => {
    return typeof window !== 'undefined' && window.innerWidth > breakpoints.tablet;
  }
};

export default {
  breakpoints,
  media,
  ResponsiveContainer,
  Grid,
  Flex,
  ResponsiveText,
  Spacer,
  ResponsiveCard,
  ResponsiveButton,
  ResponsiveInput,
  ResponsiveNav,
  ResponsiveModal,
  ModalContent,
  TouchTarget,
  SafeAreaContainer,
  useResponsive,
  useOrientation,
  useTouch,
  updateViewportMeta,
  responsive
};
