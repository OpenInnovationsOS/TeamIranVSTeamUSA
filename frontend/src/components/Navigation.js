import React from 'react';
import { motion } from 'framer-motion';
import styled from 'styled-components';
import { useLocation, useNavigate } from 'react-router-dom';

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
  
  &:hover {
    color: #0088cc;
  }
`;

const NavIcon = styled.div`
  font-size: 20px;
`;

const Navigation = ({ currentView, setCurrentView }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { id: 'dashboard', icon: '🏠', label: 'Home', path: '/dashboard' },
    { id: 'battle', icon: '⚔️', label: 'Battle', path: '/battle' },
    { id: 'territory', icon: '🗺️', label: 'Territory', path: '/territory' },
    { id: 'missions', icon: '🎯', label: 'Missions', path: '/missions' },
    { id: 'profile', icon: '👤', label: 'Profile', path: '/profile' },
  ];

  const handleNavClick = (item) => {
    setCurrentView(item.id);
    navigate(item.path);
  };

  const getActiveView = () => {
    const path = location.pathname;
    if (path === '/dashboard') return 'dashboard';
    if (path === '/battle') return 'battle';
    if (path === '/territory') return 'territory';
    if (path === '/missions') return 'missions';
    if (path === '/profile') return 'profile';
    return 'dashboard';
  };

  const activeView = getActiveView();

  return (
    <Container>
      <NavItems>
        {navItems.map((item) => (
          <NavItem
            key={item.id}
            active={activeView === item.id}
            onClick={() => handleNavClick(item)}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <NavIcon>{item.icon}</NavIcon>
            <span>{item.label}</span>
          </NavItem>
        ))}
      </NavItems>
    </Container>
  );
};

export default Navigation;
