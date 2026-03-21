import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styled from 'styled-components';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

const Container = styled.nav`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(26, 26, 46, 0.95);
  backdrop-filter: blur(10px);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding: 8px 0;
  z-index: 1000;
`;

const NavItems = styled.div`
  display: flex;
  justify-content: space-around;
  align-items: center;
  max-width: 600px;
  margin: 0 auto;
  position: relative;
`;

const NavItem = styled(motion.button)`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 8px 12px;
  background: none;
  border: none;
  color: ${props => props.active ? '#0088cc' : 'rgba(255, 255, 255, 0.6)'};
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 12px;
  position: relative;
  
  &:hover {
    color: #0088cc;
  }
  
  &:focus {
    outline: 2px solid #0088cc;
    outline-offset: 2px;
  }
`;

const NavIcon = styled.div`
  font-size: 20px;
  position: relative;
`;

const Badge = styled.div`
  position: absolute;
  top: -4px;
  right: -4px;
  background: #ff6b6b;
  color: white;
  border-radius: 50%;
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: bold;
  animation: pulse 2s infinite;
  
  /* Mobile optimizations */
  @media (max-width: 768px) {
    width: 18px;
    height: 18px;
    font-size: 11px;
  }
  
  @media (max-width: 480px) {
    width: 20px;
    height: 20px;
    font-size: 12px;
  }
`;

const MoreButton = styled(NavItem)`
  position: relative;
`;

const Backdrop = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 999;
  
  @media (min-width: 769px) {
    display: none; /* Only show on mobile */
  }
`;

const MoreMenu = styled(motion.div)`
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(26, 26, 46, 0.98);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 8px 0;
  margin-bottom: 8px;
  min-width: 200px;
  max-width: 90vw; /* Mobile responsive */
  width: auto; /* Allow flexible width */
  backdrop-filter: blur(10px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  z-index: 1000; /* Ensure it's above other content */
  max-height: 70vh; /* Prevent menu from going off screen */
  overflow-y: auto; /* Allow scrolling if needed */
  -webkit-overflow-scrolling: touch; /* Smooth scrolling on iOS */
  
  /* Mobile optimizations */
  @media (max-width: 768px) {
    min-width: 280px; /* Larger min width on mobile */
    max-width: 85vw; /* Slightly smaller on very small screens */
    padding: 12px 0; /* More padding on mobile */
    border-radius: 16px; /* Larger radius on mobile */
    max-height: 60vh; /* Smaller max height on mobile */
  }
  
  @media (max-width: 480px) {
    min-width: 260px;
    max-width: 80vw;
    padding: 16px 0;
    border-radius: 20px;
    max-height: 50vh; /* Even smaller on very small screens */
  }
`;

const MoreMenuItem = styled(motion.button)`
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 12px 16px;
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.8);
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 14px;
  border-radius: 8px; /* Add rounded corners */
  
  /* Mobile optimizations */
  @media (max-width: 768px) {
    padding: 16px 20px; /* More padding on mobile */
    gap: 16px; /* Larger gap on mobile */
    font-size: 16px; /* Larger text on mobile */
    border-radius: 12px;
  }
  
  @media (max-width: 480px) {
    padding: 20px 24px; /* Even more padding on very small screens */
    gap: 20px;
    font-size: 18px;
    border-radius: 16px;
  }
  
  &:hover {
    background: rgba(255, 255, 255, 0.1);
    color: #0088cc;
  }
  
  &:active {
    transform: scale(0.98);
  }
`;

const MoreMenuIcon = styled.div`
  font-size: 18px;
  flex-shrink: 0; /* Prevent shrinking on mobile */
  
  @media (max-width: 768px) {
    font-size: 20px; /* Larger icons on mobile */
  }
  
  @media (max-width: 480px) {
    font-size: 22px; /* Even larger on very small screens */
  }
`;

const Navigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [showMore, setShowMore] = useState(false);
  const { isAdmin } = useAuthStore();

  const primaryNavItems = [
    { id: 'dashboard', icon: '🏠', label: 'Home', path: '/dashboard' },
    { id: 'battle', icon: '⚔️', label: 'Battle', path: '/battle' },
    { id: 'territory', icon: '🗺️', label: 'Territory', path: '/territory' },
    { id: 'missions', icon: '🎯', label: 'Missions', path: '/missions' },
  ];

  const moreNavItems = [
    { id: 'guilds', icon: '🏰', label: 'Guilds', path: '/guilds', badge: null },
    { id: 'marketplace', icon: '🛒', label: 'Marketplace', path: '/marketplace', badge: '2' },
    { id: 'tournaments', icon: '🏆', label: 'Tournaments', path: '/tournaments', badge: '1' },
    { id: 'staking', icon: '💰', label: 'Staking', path: '/staking', badge: null },
    { id: 'autotap', icon: '⚡', label: 'Auto Tap', path: '/autotap', badge: 'NEW' },
    { id: 'gifts', icon: '🎁', label: 'Gifts', path: '/gifts', badge: 'HOT' },
    { id: 'tipping', icon: '💰', label: 'Tipping', path: '/tipping', badge: 'NEW' },
    { id: 'chat', icon: '💬', label: 'Chat', path: '/chat', badge: 'NEW' },
    { id: 'premium', icon: '💎', label: 'Premium', path: '/premium', badge: null },
    { id: 'buy', icon: '⭐', label: 'Buy STG', path: '/buy', badge: null },
    { id: 'profile', icon: '👤', label: 'Profile', path: '/profile', badge: null },
    ...(isAdmin ? [
      { id: 'admin', icon: '⚙️', label: 'Admin', path: '/admin', badge: null }
    ] : [])
  ];

  const handleNavClick = (item) => {
    navigate(item.path);
    setShowMore(false);
  };

  const handleBackdropClick = () => {
    setShowMore(false);
  };

  // Close menu when pressing Escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        setShowMore(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  const getActiveView = () => {
    const path = location.pathname;
    if (path === '/dashboard') return 'dashboard';
    if (path === '/battle') return 'battle';
    if (path === '/territory') return 'territory';
    if (path === '/missions') return 'missions';
    if (path === '/guilds') return 'guilds';
    if (path === '/gifts') return 'gifts';
    if (path === '/tipping') return 'tipping';
    if (path === '/chat') return 'chat';
    if (path === '/marketplace') return 'marketplace';
    if (path === '/tournaments') return 'tournaments';
    if (path === '/staking') return 'staking';
    if (path === '/autotap') return 'autotap';
    if (path === '/premium') return 'premium';
    if (path === '/buy') return 'buy';
    if (path === '/admin') return 'admin';
    if (path === '/profile') return 'profile';
    return 'dashboard';
  };

  const activeView = getActiveView();

  return (
    <Container>
      <NavItems>
        {primaryNavItems.map((item) => (
          <NavItem
            key={item.id}
            active={activeView === item.id}
            onClick={() => handleNavClick(item)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            aria-label={item.label}
            role="button"
            tabIndex={0}
          >
            <NavIcon>
              {item.icon}
              {item.badge && <Badge>{item.badge}</Badge>}
            </NavIcon>
            <span>{item.label}</span>
          </NavItem>
        ))}
        
        <MoreButton
          active={showMore || moreNavItems.some(item => activeView === item.id)}
          onClick={() => setShowMore(!showMore)}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          aria-label="More options"
          role="button"
          tabIndex={0}
        >
          <NavIcon>
            ⋯
          </NavIcon>
          <span>More</span>
          
          <AnimatePresence>
            {showMore && (
              <>
                <Backdrop onClick={handleBackdropClick} />
                <MoreMenu
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                >
                  {moreNavItems.map((item, index) => (
                    <MoreMenuItem
                      key={item.id}
                      onClick={() => handleNavClick(item)}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ x: 5 }}
                      whileTap={{ scale: 0.95 }} /* Better touch feedback */
                      aria-label={item.label}
                      role="button"
                      tabIndex={0}
                    >
                      <MoreMenuIcon>
                        {item.icon}
                        {item.badge && <Badge>{item.badge}</Badge>}
                      </MoreMenuIcon>
                      <span>{item.label}</span>
                    </MoreMenuItem>
                  ))}
                </MoreMenu>
              </>
            )}
          </AnimatePresence>
        </MoreButton>
      </NavItems>
    </Container>
  );
};

export default Navigation;
