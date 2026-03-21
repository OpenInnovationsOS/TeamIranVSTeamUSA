import { motion, AnimatePresence } from 'framer-motion';
import styled from 'styled-components';

// Micro-interaction components
export const InteractiveCard = styled(motion.div)`
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
    transition: left 0.5s;
  }
  
  &:hover {
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(0, 136, 204, 0.3);
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
    
    &::before {
      left: 100%;
    }
  }
  
  &:active {
    transform: translateY(0);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
`;

export const RippleButton = styled(motion.button)`
  position: relative;
  overflow: hidden;
  background: linear-gradient(45deg, #0088cc, #00a6ff);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 12px 24px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 20px rgba(0, 136, 204, 0.4);
  }
  
  &:active {
    transform: translateY(0);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

export const FloatingLabel = styled(motion.div)`
  position: absolute;
  left: 12px;
  top: ${props => props.focused || props.hasValue ? '8px' : '16px'};
  font-size: ${props => props.focused || props.hasValue ? '12px' : '14px'};
  color: ${props => props.focused ? '#0088cc' : 'rgba(255, 255, 255, 0.6)'};
  pointer-events: none;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 1;
`;

export const InteractiveInput = styled(motion.input)`
  width: 100%;
  padding: 16px 12px 8px 12px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  color: #ffffff;
  font-size: 14px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  
  &:focus {
    outline: none;
    border-color: #0088cc;
    background: rgba(255, 255, 255, 0.08);
    box-shadow: 0 0 0 3px rgba(0, 136, 204, 0.1);
  }
  
  &:focus + ${FloatingLabel} {
    top: 8px;
    font-size: 12px;
    color: #0088cc;
  }
  
  &::placeholder {
    color: rgba(255, 255, 255, 0.4);
  }
`;

export const PulseIcon = styled(motion.div)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    transform: scale(1.1);
  }
  
  &:active {
    transform: scale(0.95);
  }
`;

export const ShimmerEffect = styled(motion.div)`
  position: relative;
  overflow: hidden;
  
  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 255, 255, 0.2),
      transparent
    );
    animation: shimmer 2s infinite;
  }
`;

export const MagneticButton = styled(motion.button)`
  position: relative;
  background: linear-gradient(45deg, #e74c3c, #f39c12);
  color: white;
  border: none;
  border-radius: 12px;
  padding: 14px 28px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 0;
    height: 0;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.3);
    transform: translate(-50%, -50%);
    transition: width 0.6s, height 0.6s;
  }
  
  &:hover::before {
    width: 300px;
    height: 300px;
  }
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(231, 76, 60, 0.4);
  }
`;

export const ParallaxContainer = styled(motion.div)`
  position: relative;
  overflow: hidden;
`;

export const ParallaxLayer = styled(motion.div)`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  will-change: transform;
`;

// Animation variants
export const microAnimations = {
  // Button animations
  buttonHover: {
    scale: 1.05,
    transition: { duration: 0.2, ease: 'easeOut' }
  },
  buttonTap: {
    scale: 0.95,
    transition: { duration: 0.1, ease: 'easeIn' }
  },
  
  // Card animations
  cardHover: {
    y: -4,
    scale: 1.02,
    boxShadow: '0 12px 30px rgba(0, 0, 0, 0.2)',
    transition: { duration: 0.3, ease: 'easeOut' }
  },
  cardTap: {
    scale: 0.98,
    transition: { duration: 0.1, ease: 'easeIn' }
  },
  
  // Icon animations
  iconBounce: {
    scale: [1, 1.2, 1],
    transition: { duration: 0.3, ease: 'easeInOut' }
  },
  iconRotate: {
    rotate: [0, 360],
    transition: { duration: 0.5, ease: 'easeInOut' }
  },
  iconPulse: {
    scale: [1, 1.1, 1],
    opacity: [1, 0.7, 1],
    transition: { duration: 0.6, ease: 'easeInOut' }
  },
  
  // Text animations
  textGlow: {
    textShadow: '0 0 20px rgba(0, 136, 204, 0.8)',
    transition: { duration: 0.3, ease: 'easeOut' }
  },
  textSlide: {
    x: [0, 10, 0],
    transition: { duration: 0.4, ease: 'easeInOut' }
  },
  
  // Loading animations
  loadingSpin: {
    rotate: 360,
    transition: { duration: 1, repeat: Infinity, ease: 'linear' }
  },
  loadingPulse: {
    scale: [1, 1.1, 1],
    opacity: [1, 0.7, 1],
    transition: { duration: 1, repeat: Infinity, ease: 'easeInOut' }
  },
  
  // Stagger animations
  staggerContainer: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    transition: { duration: 0.3 }
  },
  staggerItem: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.4 }
  }
};

// Interactive hooks
export const useRipple = () => {
  const createRipple = (event) => {
    const button = event.currentTarget;
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;
    
    const ripple = document.createElement('span');
    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = x + 'px';
    ripple.style.top = y + 'px';
    ripple.classList.add('ripple');
    
    button.appendChild(ripple);
    
    setTimeout(() => {
      ripple.remove();
    }, 600);
  };
  
  return { createRipple };
};

export const useMagnetic = (strength = 0.3) => {
  const ref = React.useRef(null);
  
  React.useEffect(() => {
    const element = ref.current;
    if (!element) return;
    
    const handleMouseMove = (e) => {
      const rect = element.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      const deltaX = (e.clientX - centerX) * strength;
      const deltaY = (e.clientY - centerY) * strength;
      
      element.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
    };
    
    const handleMouseLeave = () => {
      element.style.transform = 'translate(0, 0)';
    };
    
    element.addEventListener('mousemove', handleMouseMove);
    element.addEventListener('mouseleave', handleMouseLeave);
    
    return () => {
      element.removeEventListener('mousemove', handleMouseMove);
      element.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [strength]);
  
  return ref;
};

export const useParallax = (speed = 0.5) => {
  const ref = React.useRef(null);
  
  React.useEffect(() => {
    const element = ref.current;
    if (!element) return;
    
    const handleScroll = () => {
      const scrolled = window.pageYOffset;
      const yPos = -(scrolled * speed);
      element.style.transform = `translateY(${yPos}px)`;
    };
    
    window.addEventListener('scroll', handleScroll);
    handleScroll();
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [speed]);
  
  return ref;
};

// Enhanced components with micro-interactions
export const EnhancedButton = ({ children, ripple = true, magnetic = false, ...props }) => {
  const { createRipple } = useRipple();
  const magneticRef = useMagnetic();
  const ref = magnetic ? magneticRef : React.useRef(null);
  
  const handleClick = (e) => {
    if (ripple) createRipple(e);
    if (props.onClick) props.onClick(e);
  };
  
  return (
    <RippleButton
      ref={ref}
      onClick={handleClick}
      whileHover={microAnimations.buttonHover}
      whileTap={microAnimations.buttonTap}
      {...props}
    >
      {children}
    </RippleButton>
  );
};

export const EnhancedCard = ({ children, parallax = false, ...props }) => {
  const parallaxRef = useParallax();
  const ref = parallax ? parallaxRef : React.useRef(null);
  
  return (
    <InteractiveCard
      ref={ref}
      whileHover={microAnimations.cardHover}
      whileTap={microAnimations.cardTap}
      {...props}
    >
      {children}
    </InteractiveCard>
  );
};

export const AnimatedIcon = ({ children, animation = 'bounce', ...props }) => {
  const animationVariants = {
    bounce: microAnimations.iconBounce,
    rotate: microAnimations.iconRotate,
    pulse: microAnimations.iconPulse
  };
  
  return (
    <PulseIcon
      whileHover={animationVariants[animation]}
      {...props}
    >
      {children}
    </PulseIcon>
  );
};

// CSS for ripple effect
const style = document.createElement('style');
style.textContent = `
  .ripple {
    position: absolute;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.6);
    transform: scale(0);
    animation: ripple-animation 0.6s ease-out;
    pointer-events: none;
  }
  
  @keyframes ripple-animation {
    to {
      transform: scale(4);
      opacity: 0;
    }
  }
  
  @keyframes shimmer {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(100%); }
  }
`;
document.head.appendChild(style);

export default {
  InteractiveCard,
  RippleButton,
  FloatingLabel,
  InteractiveInput,
  PulseIcon,
  ShimmerEffect,
  MagneticButton,
  ParallaxContainer,
  ParallaxLayer,
  microAnimations,
  useRipple,
  useMagnetic,
  useParallax,
  EnhancedButton,
  EnhancedCard,
  AnimatedIcon
};
