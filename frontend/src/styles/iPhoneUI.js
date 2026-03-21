// iPhone UI Styled Components for Mobile/Telegram
import styled, { css } from 'styled-components';

// iPhone-specific media queries
const isMobile = css`
  @media (max-width: 768px) {
    /* iPhone-specific styles */
  }
`;

const isIPhone = css`
  @media (max-width: 428px) {
    /* iPhone Pro Max and smaller */
  }
`;

// iPhone Container with native feel
const IPhoneContainer = styled.div`
  max-width: 428px;
  margin: 0 auto;
  min-height: 100vh;
  background: #000000;
  position: relative;
  overflow-x: hidden;
  
  /* iPhone status bar area */
  padding-top: env(safe-area-inset-top);
  padding-bottom: env(safe-area-inset-bottom);
  padding-left: env(safe-area-inset-left);
  padding-right: env(safe-area-inset-right);
  
  ${isIPhone} {
    /* iPhone-specific background */
    background: linear-gradient(180deg, #1a1a1a 0%, #000000 100%);
  }
`;

// iPhone Navigation Bar
const IPhoneNavBar = styled.div`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 83px;
  background: rgba(0, 0, 0, 0.95);
  backdrop-filter: blur(20px);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  justify-content: space-around;
  align-items: center;
  z-index: 1000;
  padding-bottom: env(safe-area-inset-bottom);
  
  ${isIPhone} {
    height: 90px;
  }
`;

// iPhone Navigation Item
const NavItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:active {
    transform: scale(0.95);
  }
  
  ${props => props.active && css`
    color: #007AFF;
  `}
`;

const NavIcon = styled.div`
  font-size: 24px;
  color: ${props => props.active ? '#007AFF' : '#8E8E93'};
`;

const NavLabel = styled.div`
  font-size: 10px;
  font-weight: 500;
  color: ${props => props.active ? '#007AFF' : '#8E8E93'};
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
`;

// iPhone Header
const IPhoneHeader = styled.div`
  position: sticky;
  top: 0;
  left: 0;
  right: 0;
  height: 44px;
  background: rgba(0, 0, 0, 0.95);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  z-index: 999;
  padding-top: env(safe-area-inset-top);
  
  ${isIPhone} {
    height: 54px;
  }
`;

const HeaderTitle = styled.h1`
  font-size: 17px;
  font-weight: 600;
  color: #ffffff;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  margin: 0;
`;

const HeaderButton = styled.button`
  background: none;
  border: none;
  color: #007AFF;
  font-size: 17px;
  font-weight: 400;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  cursor: pointer;
  padding: 0;
  
  &:active {
    opacity: 0.7;
  }
`;

// iPhone Card Component
const IPhoneCard = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 16px;
  margin: 8px 16px;
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  
  ${isIPhone} {
    margin: 6px 12px;
    padding: 14px;
    border-radius: 10px;
  }
`;

// iPhone Button
const IPhoneButton = styled.button`
  background: ${props => props.primary ? '#007AFF' : 'rgba(255, 255, 255, 0.1)'};
  color: ${props => props.primary ? '#ffffff' : '#007AFF'};
  border: none;
  border-radius: 8px;
  padding: 12px 24px;
  font-size: 17px;
  font-weight: 600;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  cursor: pointer;
  transition: all 0.2s ease;
  width: ${props => props.fullWidth ? '100%' : 'auto'};
  
  &:active {
    transform: scale(0.98);
    opacity: 0.8;
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  ${isIPhone} {
    padding: 10px 20px;
    font-size: 16px;
    border-radius: 6px;
  }
`;

// iPhone List Component
const IPhoneList = styled.div`
  margin: 8px 0;
  
  ${isIPhone} {
    margin: 6px 0;
  }
`;

const IPhoneListItem = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border-radius: 0;
  padding: 12px 16px;
  margin: 0;
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:first-child {
    border-top-left-radius: 12px;
    border-top-right-radius: 12px;
  }
  
  &:last-child {
    border-bottom-left-radius: 12px;
    border-bottom-right-radius: 12px;
    border-bottom: none;
  }
  
  &:active {
    background: rgba(255, 255, 255, 0.1);
  }
  
  ${isIPhone} {
    padding: 10px 14px;
  }
`;

const ListItemContent = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  gap: 12px;
`;

const ListItemIcon = styled.div`
  font-size: 20px;
  color: #8E8E93;
  width: 24px;
  text-align: center;
`;

const ListItemText = styled.div`
  flex: 1;
`;

const ListItemTitle = styled.div`
  font-size: 17px;
  font-weight: 400;
  color: #ffffff;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  margin-bottom: 2px;
`;

const ListItemSubtitle = styled.div`
  font-size: 15px;
  color: #8E8E93;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
`;

const ListItemArrow = styled.div`
  color: #C7C7CC;
  font-size: 16px;
`;

// iPhone Modal
const IPhoneModal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: flex-end;
  z-index: 2000;
`;

const IPhoneModalContent = styled.div`
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-top-left-radius: 16px;
  border-top-right-radius: 16px;
  padding: 20px;
  max-height: 80vh;
  overflow-y: auto;
  width: 100%;
  padding-bottom: calc(20px + env(safe-area-inset-bottom));
  
  ${isIPhone} {
    border-top-left-radius: 12px;
    border-top-right-radius: 12px;
    padding: 16px;
  }
`;

const ModalHandle = styled.div`
  width: 36px;
  height: 5px;
  background: #C7C7CC;
  border-radius: 2.5px;
  margin: 0 auto 16px;
`;

// iPhone Input
const IPhoneInput = styled.input`
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 10px;
  padding: 12px 16px;
  font-size: 17px;
  color: #ffffff;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  width: 100%;
  outline: none;
  transition: all 0.2s ease;
  
  &:focus {
    border-color: #007AFF;
    background: rgba(255, 255, 255, 0.15);
  }
  
  &::placeholder {
    color: #8E8E93;
  }
  
  ${isIPhone} {
    padding: 10px 14px;
    font-size: 16px;
    border-radius: 8px;
  }
`;

// iPhone Toggle/Switch
const IPhoneSwitch = styled.label`
  position: relative;
  width: 51px;
  height: 31px;
  cursor: pointer;
  
  input {
    opacity: 0;
    width: 0;
    height: 0;
  }
`;

const SwitchSlider = styled.span`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #39393D;
  transition: 0.2s;
  border-radius: 31px;
  
  &:before {
    position: absolute;
    content: "";
    height: 25px;
    width: 25px;
    left: 3px;
    bottom: 3px;
    background-color: white;
    transition: 0.2s;
    border-radius: 50%;
  }
  
  ${props => props.checked && css`
    background-color: #34C759;
    
    &:before {
      transform: translateX(20px);
    }
  `}
`;

// iPhone Badge
const IPhoneBadge = styled.div`
  background: #FF3B30;
  color: #ffffff;
  font-size: 12px;
  font-weight: 600;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  padding: 2px 6px;
  border-radius: 10px;
  min-width: 18px;
  text-align: center;
  
  ${isIPhone} {
    font-size: 11px;
    padding: 1px 5px;
    border-radius: 8px;
    min-width: 16px;
  }
`;

// iPhone Tab Bar
const IPhoneTabBar = styled.div`
  display: flex;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 10px;
  padding: 4px;
  margin: 16px;
  
  ${isIPhone} {
    margin: 12px;
    padding: 3px;
    border-radius: 8px;
  }
`;

const IPhoneTab = styled.div`
  flex: 1;
  padding: 10px;
  border-radius: 6px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 15px;
  font-weight: 500;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  color: #8E8E93;
  
  ${props => props.active && css`
    background: #007AFF;
    color: #ffffff;
  `}
  
  ${isIPhone} {
    padding: 8px;
    font-size: 14px;
    border-radius: 5px;
  }
`;

// iPhone Progress Bar
const IPhoneProgressBar = styled.div`
  height: 4px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
  overflow: hidden;
  margin: 8px 0;
  
  ${isIPhone} {
    height: 3px;
    margin: 6px 0;
  }
`;

const IPhoneProgressFill = styled.div`
  height: 100%;
  background: linear-gradient(90deg, #007AFF, #5AC8FA);
  border-radius: 2px;
  transition: width 0.3s ease;
  width: ${props => props.percentage}%;
`;

// iPhone Alert/Toast
const IPhoneAlert = styled.div`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 14px;
  padding: 20px;
  min-width: 270px;
  max-width: 90%;
  z-index: 3000;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
  
  ${isIPhone} {
    border-radius: 12px;
    padding: 16px;
    min-width: 250px;
  }
`;

const AlertTitle = styled.h3`
  font-size: 17px;
  font-weight: 600;
  color: #000000;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  margin: 0 0 8px 0;
  text-align: center;
`;

const AlertMessage = styled.p`
  font-size: 15px;
  color: #3C3C43;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  margin: 0 0 20px 0;
  text-align: center;
  line-height: 1.4;
`;

const AlertButtons = styled.div`
  display: flex;
  gap: 8px;
`;

const AlertButton = styled.button`
  flex: 1;
  background: none;
  border: none;
  padding: 10px;
  font-size: 17px;
  font-weight: 400;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  cursor: pointer;
  border-radius: 8px;
  color: ${props => props.cancel ? '#007AFF' : '#FF3B30'};
  
  &:active {
    background: rgba(0, 0, 0, 0.1);
  }
`;

// iPhone Stats Display
const IPhoneStats = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin: 16px;
  
  ${isIPhone} {
    gap: 10px;
    margin: 12px;
  }
`;

const IPhoneStatCard = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 16px;
  text-align: center;
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  
  ${isIPhone} {
    padding: 14px;
    border-radius: 10px;
  }
`;

const StatValue = styled.div`
  font-size: 24px;
  font-weight: 700;
  color: #ffffff;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  margin-bottom: 4px;
  
  ${isIPhone} {
    font-size: 22px;
  }
`;

const StatLabel = styled.div`
  font-size: 13px;
  color: #8E8E93;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-weight: 500;
`;

// iPhone Avatar
const IPhoneAvatar = styled.div`
  width: ${props => props.size || 40}px;
  height: ${props => props.size || 40}px;
  border-radius: 50%;
  background: linear-gradient(135deg, #007AFF, #5AC8FA);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: ${props => (props.size || 40) * 0.4}px;
  color: #ffffff;
  font-weight: 600;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  border: 2px solid rgba(255, 255, 255, 0.2);
  
  ${isIPhone} {
    border: 1px solid rgba(255, 255, 255, 0.15);
  }
`;

// iPhone Floating Action Button
const IPhoneFAB = styled.button`
  position: fixed;
  bottom: 100px;
  right: 20px;
  width: 56px;
  height: 56px;
  border-radius: 28px;
  background: linear-gradient(135deg, #007AFF, #5AC8FA);
  border: none;
  color: #ffffff;
  font-size: 24px;
  cursor: pointer;
  box-shadow: 0 4px 20px rgba(0, 122, 255, 0.4);
  z-index: 998;
  transition: all 0.2s ease;
  
  &:active {
    transform: scale(0.95);
  }
  
  ${isIPhone} {
    bottom: 110px;
    right: 16px;
    width: 50px;
    height: 50px;
    border-radius: 25px;
    font-size: 20px;
  }
`;

export {
  IPhoneContainer,
  IPhoneNavBar,
  NavItem,
  NavIcon,
  NavLabel,
  IPhoneHeader,
  HeaderTitle,
  HeaderButton,
  IPhoneCard,
  IPhoneButton,
  IPhoneList,
  IPhoneListItem,
  ListItemContent,
  ListItemIcon,
  ListItemText,
  ListItemTitle,
  ListItemSubtitle,
  ListItemArrow,
  IPhoneModal,
  IPhoneModalContent,
  ModalHandle,
  IPhoneInput,
  IPhoneSwitch,
  SwitchSlider,
  IPhoneBadge,
  IPhoneTabBar,
  IPhoneTab,
  IPhoneProgressBar,
  IPhoneProgressFill,
  IPhoneAlert,
  AlertTitle,
  AlertMessage,
  AlertButtons,
  AlertButton,
  IPhoneStats,
  IPhoneStatCard,
  StatValue,
  StatLabel,
  IPhoneAvatar,
  IPhoneFAB,
  isMobile,
  isIPhone
};
