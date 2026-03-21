// Telegram WebApp Integration
// Enhanced Telegram Mini-App integration with game features

class TelegramWebAppIntegration {
  constructor() {
    this.webApp = null;
    this.user = null;
    this.initData = null;
    this.isReady = false;
    this.callbacks = new Map();
    
    this.init();
  }

  // Initialize Telegram WebApp
  init() {
    if (window.Telegram && window.Telegram.WebApp) {
      this.webApp = window.Telegram.WebApp;
      this.initData = this.webApp.initDataUnsafe;
      this.user = this.initData.user;
      
      console.log('🤖 Telegram WebApp detected');
      console.log('User:', this.user);
      console.log('Init Data:', this.initData);
      
      this.setupWebApp();
      this.isReady = true;
    } else {
      console.warn('⚠️ Telegram WebApp not detected');
      this.setupMockWebApp();
    }
  }

  // Setup WebApp
  setupWebApp() {
    // Enable WebApp
    this.webApp.ready();
    
    // Set theme
    this.webApp.setHeaderColor('#1a1a1a');
    this.webApp.setBackgroundColor('#0a0a0a');
    
    // Enable closing confirmation
    this.webApp.enableClosingConfirmation();
    
    // Expand WebApp
    this.webApp.expand();
    
    // Setup event listeners
    this.setupEventListeners();
    
    // Setup main button
    this.setupMainButton();
    
    // Setup back button
    this.setupBackButton();
  }

  // Setup mock WebApp for development
  setupMockWebApp() {
    this.webApp = {
      ready: () => console.log('Mock: WebApp ready'),
      expand: () => console.log('Mock: WebApp expanded'),
      close: () => console.log('Mock: WebApp closed'),
      setHeaderColor: (color) => console.log('Mock: Set header color', color),
      setBackgroundColor: (color) => console.log('Mock: Set background color', color),
      enableClosingConfirmation: () => console.log('Mock: Enable closing confirmation'),
      sendData: (data) => console.log('Mock: Send data', data),
      openLink: (url) => window.open(url, '_blank'),
      openTelegramLink: (url) => window.open(url, '_blank'),
      openInvoice: (url) => console.log('Mock: Open invoice', url),
      showPopup: (popup) => console.log('Mock: Show popup', popup),
      showAlert: (message) => alert(message),
      showConfirm: (message) => confirm(message),
      showScanQrPopup: (params) => console.log('Mock: Show QR popup', params),
      closeScanQrPopup: () => console.log('Mock: Close QR popup'),
      readTextFromClipboard: () => Promise.resolve(''),
      requestWriteAccess: () => Promise.resolve(true),
      requestContact: () => Promise.resolve(null),
      ready: true,
      isVersionAtLeast: (version) => true,
      platform: 'tdesktop',
      colorScheme: 'dark',
      themeParams: {
        bg_color: '#0a0a0a',
        text_color: '#ffffff',
        hint_color: '#999999',
        link_color: '#2481cc',
        button_color: '#2481cc',
        button_text_color: '#ffffff'
      },
      initData: '',
      initDataUnsafe: {},
      viewportHeight: 768,
      viewportStableHeight: 768,
      headerColor: '#0a0a0a',
      backgroundColor: '#0a0a0a',
      isExpanded: true,
      MainButton: {
        text: 'Continue',
        color: '#2481cc',
        textColor: '#ffffff',
        isVisible: false,
        isActive: true,
        setText: (text) => { this.text = text; },
        onClick: (callback) => { this.callback = callback; },
        show: () => { this.isVisible = true; },
        hide: () => { this.isVisible = false; },
        enable: () => { this.isActive = true; },
        disable: () => { this.isActive = false; },
        setParams: (params) => Object.assign(this, params)
      },
      BackButton: {
        isVisible: false,
        show: () => { this.isVisible = true; },
        hide: () => { this.isVisible = false; },
        onClick: (callback) => { this.callback = callback; }
      }
    };
    
    // Mock user data
    this.user = {
      id: 123456789,
      first_name: 'Test',
      last_name: 'User',
      username: 'testuser',
      language_code: 'en',
      is_premium: false
    };
    
    this.initData = {
      user: this.user,
      query_id: 'mock_query_id',
      auth_date: new Date().toISOString()
    };
    
    this.isReady = true;
  }

  // Setup event listeners
  setupEventListeners() {
    // Viewport changed
    this.webApp.onEvent('viewportChanged', (event) => {
      console.log('Viewport changed:', event);
      this.triggerCallback('viewportChanged', event);
    });

    // Theme changed
    this.webApp.onEvent('themeChanged', (event) => {
      console.log('Theme changed:', event);
      this.triggerCallback('themeChanged', event);
    });

    // Main button clicked
    this.webApp.MainButton.onClick(() => {
      this.triggerCallback('mainButtonClicked');
    });

    // Back button clicked
    this.webApp.BackButton.onClick(() => {
      this.triggerCallback('backButtonClicked');
    });

    // WebApp closed
    this.webApp.onEvent('close', () => {
      this.triggerCallback('webAppClosed');
    });
  }

  // Setup main button
  setupMainButton() {
    this.webApp.MainButton.setParams({
      color: '#2481cc',
      text_color: '#ffffff',
      is_active: true
    });
  }

  // Setup back button
  setupBackButton() {
    this.webApp.BackButton.hide();
  }

  // Register callback
  on(event, callback) {
    if (!this.callbacks.has(event)) {
      this.callbacks.set(event, []);
    }
    this.callbacks.get(event).push(callback);
  }

  // Trigger callback
  triggerCallback(event, data) {
    const callbacks = this.callbacks.get(event);
    if (callbacks) {
      callbacks.forEach(callback => callback(data));
    }
  }

  // Show main button
  showMainButton(text, onClick) {
    if (text) {
      this.webApp.MainButton.setText(text);
    }
    if (onClick) {
      this.webApp.MainButton.onClick(onClick);
    }
    this.webApp.MainButton.show();
  }

  // Hide main button
  hideMainButton() {
    this.webApp.MainButton.hide();
  }

  // Show back button
  showBackButton(onClick) {
    if (onClick) {
      this.webApp.BackButton.onClick(onClick);
    }
    this.webApp.BackButton.show();
  }

  // Hide back button
  hideBackButton() {
    this.webApp.BackButton.hide();
  }

  // Send data to bot
  sendData(data) {
    if (this.webApp.sendData) {
      this.webApp.sendData(JSON.stringify(data));
    }
  }

  // Open link
  openLink(url) {
    if (this.webApp.openLink) {
      this.webApp.openLink(url);
    } else {
      window.open(url, '_blank');
    }
  }

  // Open Telegram link
  openTelegramLink(url) {
    if (this.webApp.openTelegramLink) {
      this.webApp.openTelegramLink(url);
    } else {
      window.open(url, '_blank');
    }
  }

  // Show popup
  showPopup(title, message, buttons) {
    if (this.webApp.showPopup) {
      return this.webApp.showPopup({
        title,
        message,
        buttons: buttons || [
          { text: 'OK', type: 'default' }
        ]
      });
    } else {
      return Promise.resolve({ button_id: 'OK' });
    }
  }

  // Show alert
  showAlert(message) {
    if (this.webApp.showAlert) {
      this.webApp.showAlert(message);
    } else {
      alert(message);
    }
  }

  // Show confirm
  showConfirm(message) {
    if (this.webApp.showConfirm) {
      return this.webApp.showConfirm(message);
    } else {
      return Promise.resolve(confirm(message));
    }
  }

  // Request write access
  async requestWriteAccess() {
    if (this.webApp.requestWriteAccess) {
      return await this.webApp.requestWriteAccess();
    }
    return Promise.resolve(true);
  }

  // Request contact
  async requestContact() {
    if (this.webApp.requestContact) {
      return await this.webApp.requestContact();
    }
    return Promise.resolve(null);
  }

  // Read text from clipboard
  async readTextFromClipboard() {
    if (this.webApp.readTextFromClipboard) {
      return await this.webApp.readTextFromClipboard();
    }
    return Promise.resolve('');
  }

  // Get user info
  getUser() {
    return this.user;
  }

  // Get init data
  getInitData() {
    return this.initData;
  }

  // Get theme params
  getThemeParams() {
    return this.webApp.themeParams || {};
  }

  // Get viewport info
  getViewportInfo() {
    return {
      height: this.webApp.viewportHeight || 768,
      stableHeight: this.webApp.viewportStableHeight || 768,
      isExpanded: this.webApp.isExpanded || false
    };
  }

  // Check if ready
  isReady() {
    return this.isReady;
  }

  // Check if in Telegram
  isInTelegram() {
    return this.webApp && this.webApp.ready;
  }

  // Get platform
  getPlatform() {
    return this.webApp.platform || 'unknown';
  }

  // Get color scheme
  getColorScheme() {
    return this.webApp.colorScheme || 'dark';
  }

  // Set theme
  setTheme(colorScheme) {
    if (this.webApp.colorScheme !== colorScheme) {
      if (colorScheme === 'dark') {
        this.webApp.setHeaderColor('#1a1a1a');
        this.webApp.setBackgroundColor('#0a0a0a');
      } else {
        this.webApp.setHeaderColor('#ffffff');
        this.webApp.setBackgroundColor('#ffffff');
      }
    }
  }

  // Haptic feedback
  hapticFeedback(type, style) {
    if (this.webApp.HapticFeedback) {
      switch (type) {
        case 'impact':
          this.webApp.HapticFeedback.impactOccurred(style || 'medium');
          break;
        case 'notification':
          this.webApp.HapticFeedback.notificationOccurred(style || 'success');
          break;
        case 'selection':
          this.webApp.HapticFeedback.selectionChanged();
          break;
      }
    }
  }

  // Cloud storage
  cloudStorage = {
    set: async (key, value) => {
      if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.CloudStorage) {
        return await window.Telegram.WebApp.CloudStorage.setItem(key, value);
      }
      localStorage.setItem(key, value);
    },
    
    get: async (key) => {
      if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.CloudStorage) {
        return await window.Telegram.WebApp.CloudStorage.getItem(key);
      }
      return localStorage.getItem(key);
    },
    
    remove: async (key) => {
      if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.CloudStorage) {
        return await window.Telegram.WebApp.CloudStorage.removeItem(key);
      }
      localStorage.removeItem(key);
    },
    
    getKeys: async () => {
      if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.CloudStorage) {
        return await window.Telegram.WebApp.CloudStorage.getKeys();
      }
      return Object.keys(localStorage);
    }
  };

  // Biometric authentication
  biometric = {
    isAvailable: () => {
      return window.Telegram && 
             window.Telegram.WebApp && 
             window.Telegram.WebApp.BiometricManager &&
             window.Telegram.WebApp.BiometricManager.isInited();
    },
    
    authenticate: async (reason) => {
      if (window.Telegram && 
          window.Telegram.WebApp && 
          window.Telegram.WebApp.BiometricManager) {
        return await window.Telegram.WebApp.BiometricManager.authenticate(reason);
      }
      return Promise.resolve(true);
    },
    
    requestAccess: async (reason) => {
      if (window.Telegram && 
          window.Telegram.WebApp && 
          window.Telegram.WebApp.BiometricManager) {
        return await window.Telegram.WebApp.BiometricManager.requestAccess(reason);
      }
      return Promise.resolve(true);
    }
  };

  // Accelerometer
  accelerometer = {
    start: (callback) => {
      if (window.Telegram && 
          window.Telegram.WebApp && 
          window.Telegram.WebApp.Accelerometer) {
        window.Telegram.WebApp.Accelerometer.start(callback);
      }
    },
    
    stop: () => {
      if (window.Telegram && 
          window.Telegram.WebApp && 
          window.Telegram.WebApp.Accelerometer) {
        window.Telegram.WebApp.Accelerometer.stop();
      }
    }
  };

  // Device orientation
  deviceOrientation = {
    start: (callback) => {
      if (window.Telegram && 
          window.Telegram.WebApp && 
          window.Telegram.WebApp.DeviceOrientation) {
        window.Telegram.WebApp.DeviceOrientation.start(callback);
      }
    },
    
    stop: () => {
      if (window.Telegram && 
          window.Telegram.WebApp && 
          window.Telegram.WebApp.DeviceOrientation) {
        window.Telegram.WebApp.DeviceOrientation.stop();
      }
    }
  };

  // Location
  location = {
    request: async () => {
      if (window.Telegram && 
          window.Telegram.WebApp && 
          window.Telegram.WebApp.LocationManager) {
        return await window.Telegram.WebApp.LocationManager.requestLocation();
      }
      return new Promise((resolve, reject) => {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => resolve({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude
            }),
            reject
          );
        } else {
          reject(new Error('Geolocation not supported'));
        }
      });
    }
  };
}

// Export singleton instance
const telegramWebApp = new TelegramWebAppIntegration();

export default telegramWebApp;
export { TelegramWebAppIntegration };
