import { useState, useEffect } from 'react';

export const useTelegram = () => {
  const [telegram, setTelegram] = useState(null);
  const [isTelegramReady, setIsTelegramReady] = useState(false);

  useEffect(() => {
    if (window.Telegram && window.Telegram.WebApp) {
      const webApp = window.Telegram.WebApp;
      
      // Initialize Telegram WebApp
      webApp.ready();
      webApp.expand();
      
      // Set theme colors
      webApp.setHeaderColor('#0a0a0a');
      webApp.setBackgroundColor('#0a0a0a');
      
      // Enable closing confirmation
      webApp.enableClosingConfirmation();
      
      // Set main button
      webApp.MainButton.setText('Play Game');
      webApp.MainButton.color = '#0088cc';
      webApp.MainButton.textColor = '#ffffff';
      
      setTelegram(webApp);
      setIsTelegramReady(true);
    } else {
      // Fallback for development/testing outside Telegram
      console.log('Telegram WebApp not available, using fallback');
      setIsTelegramReady(true);
    }
  }, []);

  const showMainButton = (text, onClick) => {
    if (telegram) {
      telegram.MainButton.setText(text);
      telegram.MainButton.show();
      telegram.MainButton.onClick(onClick);
    }
  };

  const hideMainButton = () => {
    if (telegram) {
      telegram.MainButton.hide();
      telegram.MainButton.offClick();
    }
  };

  const showBackButton = (onClick) => {
    if (telegram) {
      telegram.BackButton.show();
      telegram.BackButton.onClick(onClick);
    }
  };

  const hideBackButton = () => {
    if (telegram) {
      telegram.BackButton.hide();
      telegram.BackButton.offClick();
    }
  };

  const hapticFeedback = (type) => {
    if (telegram && telegram.HapticFeedback) {
      switch (type) {
        case 'impact':
          telegram.HapticFeedback.impactOccurred('medium');
          break;
        case 'success':
          telegram.HapticFeedback.notificationOccurred('success');
          break;
        case 'error':
          telegram.HapticFeedback.notificationOccurred('error');
          break;
        case 'warning':
          telegram.HapticFeedback.notificationOccurred('warning');
          break;
        default:
          telegram.HapticFeedback.impactOccurred('light');
      }
    }
  };

  const showAlert = (message, callback) => {
    if (telegram && telegram.showAlert) {
      telegram.showAlert(message, callback);
    } else {
      // Fallback to browser alert
      alert(message);
      if (callback) callback();
    }
  };

  const showConfirm = (message, callback) => {
    if (telegram && telegram.showConfirm) {
      telegram.showConfirm(message, callback);
    } else {
      // Fallback to browser confirm
      const result = window.confirm(message);
      if (callback) callback(result);
    }
  };

  const openLink = (url) => {
    if (telegram && telegram.openLink) {
      telegram.openLink(url);
    } else {
      window.open(url, '_blank');
    }
  };

  const openTelegramLink = (url) => {
    if (telegram && telegram.openTelegramLink) {
      telegram.openTelegramLink(url);
    } else {
      window.open(url, '_blank');
    }
  };

  const shareScore = (score, faction) => {
    const text = `🎮 Team ${faction === 'iran' ? 'Iran 🇮🇷' : 'USA 🇺🇸'} - I scored ${score} STG tokens! Join the battle!`;
    const url = `https://t.me/share/url?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(text)}`;
    
    if (telegram && telegram.openTelegramLink) {
      telegram.openTelegramLink(url);
    } else {
      window.open(url, '_blank');
    }
  };

  const initData = telegram?.initData || null;
  const initDataUnsafe = telegram?.initDataUnsafe || null;

  return {
    telegram,
    isTelegramReady,
    initData,
    initDataUnsafe,
    showMainButton,
    hideMainButton,
    showBackButton,
    hideBackButton,
    hapticFeedback,
    showAlert,
    showConfirm,
    openLink,
    openTelegramLink,
    shareScore,
  };
};
