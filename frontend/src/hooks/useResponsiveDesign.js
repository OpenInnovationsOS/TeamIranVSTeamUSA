import { useState, useEffect } from 'react';

/**
 * 📱 Responsive Design Hook for Mobile Clicker Games
 * Provides responsive utilities and viewport management
 */
export const useResponsiveDesign = () => {
  const [viewportSize, setViewportSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 375,
    height: typeof window !== 'undefined' ? window.innerHeight : 667
  });
  
  const [isMobile, setIsMobile] = useState(true);
  const [isTablet, setIsTablet] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [orientation, setOrientation] = useState('portrait');
  const [telegramViewport, setTelegramViewport] = useState(null);

  // Breakpoints
  const breakpoints = {
    mobile: { max: 768 },
    tablet: { min: 769, max: 1024 },
    desktop: { min: 1025 }
  };

  // Responsive scaling utilities
  const responsiveScale = {
    text: {
      '4xl': (min = 2, max = 2.25) => `clamp(${min}rem, 6vw, ${max}rem)`,
      '3xl': (min = 1.5, max = 1.875) => `clamp(${min}rem, 5vw, ${max}rem)`,
      '2xl': (min = 1.25, max = 1.5) => `clamp(${min}rem, 4vw, ${max}rem)`,
      'xl': (min = 1.125, max = 1.25) => `clamp(${min}rem, 3.5vw, ${max}rem)`,
      'lg': (min = 1, max = 1.125) => `clamp(${min}rem, 3vw, ${max}rem)`,
      'base': (min = 0.875, max = 1) => `clamp(${min}rem, 2.5vw, ${max}rem)`,
      'sm': (min = 0.75, max = 0.875) => `clamp(${min}rem, 2vw, ${max}rem)`
    },
    size: {
      circle: (min = 200, max = 320) => `clamp(${min}px, 50vw, ${max}px)`,
      button: (min = 44, max = 52) => `clamp(${min}px, 3vw, ${max}px)`,
      container: (min = 280, max = 400) => `clamp(${min}px, 90vw, ${max}px)`,
      gap: (min = 8, max = 24) => `clamp(${min}px, 2vw, ${max}px)`
    },
    spacing: {
      padding: (min = 8, max = 32) => `clamp(${min}px, 3vw, ${max}px)`,
      margin: (min = 8, max = 32) => `clamp(${min}px, 3vw, ${max}px)`,
      gap: (min = 8, max = 24) => `clamp(${min}px, 2vw, ${max}px)`
    }
  };

  // Update viewport size and device type
  const updateViewportSize = () => {
    if (typeof window === 'undefined') return;

    const width = window.innerWidth;
    const height = window.innerHeight;
    
    setViewportSize({ width, height });
    
    // Determine device type
    setIsMobile(width <= breakpoints.mobile.max);
    setIsTablet(width >= breakpoints.tablet.min && width <= breakpoints.tablet.max);
    setIsDesktop(width >= breakpoints.desktop.min);
    
    // Determine orientation
    setOrientation(width > height ? 'landscape' : 'portrait');
  };

  // Handle Telegram WebApp viewport changes
  const handleTelegramViewport = () => {
    if (window.Telegram?.WebApp) {
      const webApp = window.Telegram.WebApp;
      
      // Set initial viewport
      setTelegramViewport({
        height: webApp.viewportHeight,
        stableHeight: webApp.viewportStableHeight,
        isExpanded: webApp.isExpanded
      });

      // Listen for viewport changes
      webApp.onViewportChanged(() => {
        setTelegramViewport({
          height: webApp.viewportHeight,
          stableHeight: webApp.viewportStableHeight,
          isExpanded: webApp.isExpanded
        });
        
        // Update CSS custom properties
        document.documentElement.style.setProperty(
          '--tg-viewport-height', 
          `${webApp.viewportHeight}px`
        );
        document.documentElement.style.setProperty(
          '--tg-viewport-stable-height', 
          `${webApp.viewportStableHeight}px`
        );
      });

      // Set initial CSS properties
      document.documentElement.style.setProperty(
        '--tg-viewport-height', 
        `${webApp.viewportHeight}px`
      );
      document.documentElement.style.setProperty(
        '--tg-viewport-stable-height', 
        `${webApp.viewportStableHeight}px`
      );
    }
  };

  // Get responsive value based on viewport
  const getResponsiveValue = (mobile, tablet, desktop) => {
    if (isDesktop && desktop !== undefined) return desktop;
    if (isTablet && tablet !== undefined) return tablet;
    return mobile;
  };

  // Get safe area insets
  const getSafeAreaInsets = () => {
    if (typeof window === 'undefined') return {
      top: 0,
      right: 0,
      bottom: 0,
      left: 0
    };

    const computedStyle = getComputedStyle(document.documentElement);
    
    return {
      top: parseInt(computedStyle.getPropertyValue('env(safe-area-inset-top)')) || 0,
      right: parseInt(computedStyle.getPropertyValue('env(safe-area-inset-right)')) || 0,
      bottom: parseInt(computedStyle.getPropertyValue('env(safe-area-inset-bottom)')) || 0,
      left: parseInt(computedStyle.getPropertyValue('env(safe-area-inset-left)')) || 0
    };
  };

  // Check if touch device
  const isTouchDevice = () => {
    if (typeof window === 'undefined') return false;
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  };

  // Get optimal click target size
  const getClickTargetSize = (size = 'medium') => {
    const sizes = {
      small: { min: 36, ideal: 44 },
      medium: { min: 44, ideal: 48 },
      large: { min: 52, ideal: 56 }
    };
    
    const targetSize = sizes[size] || sizes.medium;
    return Math.max(targetSize.min, targetSize.ideal);
  };

  // Calculate responsive font size
  const getResponsiveFontSize = (baseSize, scale = 1) => {
    const minSize = baseSize * 0.875;
    const maxSize = baseSize * 1.125;
    const vwScale = baseSize * 0.05 * scale;
    
    return `clamp(${minSize}px, ${vwScale}vw, ${maxSize}px)`;
  };

  // Get responsive spacing
  const getResponsiveSpacing = (baseSize, scale = 1) => {
    const minSize = baseSize * 0.5;
    const maxSize = baseSize * 2;
    const vwScale = baseSize * 0.03 * scale;
    
    return `clamp(${minSize}px, ${vwScale}vw, ${maxSize}px)`;
  };

  // Initialize Telegram WebApp
  const initializeTelegramWebApp = () => {
    if (window.Telegram?.WebApp) {
      const webApp = window.Telegram.WebApp;
      
      // Enable viewport expansion
      webApp.expand();
      
      // Set theme colors
      webApp.setHeaderColor('#000000');
      webApp.setBackgroundColor('#000000');
      
      // Enable closing confirmation
      webApp.enableClosingConfirmation();
      
      // Set main button defaults
      webApp.MainButton.color = '#3b82f6';
      webApp.MainButton.textColor = '#ffffff';
      
      return true;
    }
    return false;
  };

  // Setup responsive design
  useEffect(() => {
    updateViewportSize();
    handleTelegramViewport();
    initializeTelegramWebApp();

    // Listen for window resize
    const handleResize = () => {
      updateViewportSize();
    };

    // Listen for orientation change
    const handleOrientationChange = () => {
      setTimeout(updateViewportSize, 100); // Delay for orientation change completion
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleOrientationChange);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleOrientationChange);
      
      // Clean up Telegram listeners
      if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.offViewportChanged?.();
      }
    };
  }, []);

  return {
    // Viewport information
    viewportSize,
    isMobile,
    isTablet,
    isDesktop,
    orientation,
    telegramViewport,
    
    // Responsive utilities
    responsiveScale,
    getResponsiveValue,
    getSafeAreaInsets,
    isTouchDevice: isTouchDevice(),
    
    // Sizing utilities
    getClickTargetSize,
    getResponsiveFontSize,
    getResponsiveSpacing,
    
    // Telegram integration
    initializeTelegramWebApp,
    
    // Breakpoints
    breakpoints,
    
    // Computed values
    isPortrait: orientation === 'portrait',
    isLandscape: orientation === 'landscape',
    isSmallMobile: viewportSize.width <= 480,
    isLargeMobile: viewportSize.width > 480 && viewportSize.width <= 768,
    
    // CSS classes generator
    getResponsiveClasses: (baseClasses, mobileClasses, tabletClasses, desktopClasses) => {
      let classes = baseClasses || '';
      
      if (isDesktop && desktopClasses) {
        classes += ` ${desktopClasses}`;
      } else if (isTablet && tabletClasses) {
        classes += ` ${tabletClasses}`;
      } else if (mobileClasses) {
        classes += ` ${mobileClasses}`;
      }
      
      return classes.trim();
    }
  };
};

/**
 * 🎮 Clicker Game Specific Responsive Hook
 */
export const useClickerGameResponsive = () => {
  const responsive = useResponsiveDesign();
  
  // Game-specific responsive configurations
  const gameConfig = {
    clickCircle: {
      size: responsive.getResponsiveValue(
        responsive.responsiveScale.size.circle(180, 280), // Mobile
        responsive.responsiveScale.size.circle(220, 320), // Tablet
        responsive.responsiveScale.size.circle(280, 400)  // Desktop
      ),
      innerSize: responsive.getResponsiveValue(
        responsive.responsiveScale.size.circle(140, 220),
        responsive.responsiveScale.size.circle(180, 260),
        responsive.responsiveScale.size.circle(220, 320)
      )
    },
    
    buttonSize: responsive.getClickTargetSize('medium'),
    fontSize: {
      counter: responsive.getResponsiveFontSize(48, 1.2),
      stats: responsive.getResponsiveFontSize(16, 1),
      button: responsive.getResponsiveFontSize(14, 0.9)
    },
    
    spacing: {
      container: responsive.getResponsiveSpacing(16, 1.5),
      card: responsive.getResponsiveSpacing(12, 1),
      gap: responsive.getResponsiveSpacing(8, 1.2)
    }
  };

  // Game-specific responsive styles
  const getGameStyles = (element) => {
    const styles = {
      clickCircle: {
        width: gameConfig.clickCircle.size,
        height: gameConfig.clickCircle.size,
        aspectRatio: '1',
        maxWidth: '90vw',
        maxHeight: '50vh'
      },
      
      clickCircleInner: {
        width: gameConfig.clickCircle.innerSize,
        height: gameConfig.clickCircle.innerSize,
        aspectRatio: '1'
      },
      
      counter: {
        fontSize: gameConfig.fontSize.counter,
        lineHeight: 1.2
      },
      
      statsCard: {
        padding: gameConfig.spacing.card,
        gap: gameConfig.spacing.gap
      },
      
      gameContainer: {
        padding: gameConfig.spacing.container,
        minHeight: responsive.telegramViewport?.height 
          ? `${responsive.telegramViewport.height}px`
          : '100vh'
      }
    };

    return styles[element] || {};
  };

  // Responsive game layout classes
  const getGameClasses = (element) => {
    const baseClasses = {
      container: 'clicker-game-container',
      clickCircle: 'click-circle touch-target responsive-touch',
      statsCard: 'stats-card',
      upgradeButton: 'upgrade-button',
      modal: 'modal-overlay',
      modalContent: 'modal-content'
    };

    const responsiveClasses = {
      container: responsive.getResponsiveClasses(
        baseClasses.container,
        'p-4', // Mobile
        'p-6', // Tablet
        'p-8'  // Desktop
      ),
      
      clickCircle: baseClasses.clickCircle,
      statsCard: baseClasses.statsCard,
      upgradeButton: baseClasses.upgradeButton,
      modal: baseClasses.modal,
      modalContent: baseClasses.modalContent
    };

    return responsiveClasses[element] || baseClasses[element] || '';
  };

  return {
    ...responsive,
    gameConfig,
    getGameStyles,
    getGameClasses
  };
};

export default useResponsiveDesign;
