import React, { useState, useEffect, useCallback } from 'react';
import { useClickerGameResponsive } from '../hooks/useResponsiveDesign';
import { useTelegram } from '../hooks/useTelegram';

/**
 * 🎮 RESPONSIVE CLICKER GAME COMPONENT
 * Mobile-optimized clicker game with responsive design
 */
const ResponsiveClickerGame = () => {
  const {
    viewportSize,
    isMobile,
    isTablet,
    isDesktop,
    orientation,
    telegramViewport,
    gameConfig,
    getGameStyles,
    getGameClasses,
    getClickTargetSize,
    isTouchDevice
  } = useClickerGameResponsive();

  const { hapticFeedback, isTelegramReady } = useTelegram();

  // Game state
  const [points, setPoints] = useState(0);
  const [level, setLevel] = useState(1);
  const [energy, setEnergy] = useState(100);
  const [multiplier, setMultiplier] = useState(1);
  const [clickPower, setClickPower] = useState(1);
  const [isClicking, setIsClicking] = useState(false);
  const [clickEffects, setClickEffects] = useState([]);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // Upgrades state
  const [upgrades, setUpgrades] = useState([
    {
      id: 1,
      name: 'Power Boost',
      description: 'Increase click power by 1',
      cost: 10,
      level: 0,
      effect: () => setClickPower(prev => prev + 1)
    },
    {
      id: 2,
      name: 'Energy Refill',
      description: 'Refill energy to full',
      cost: 5,
      level: 0,
      effect: () => setEnergy(100)
    },
    {
      id: 3,
      name: 'Multiplier',
      description: 'Double your points',
      cost: 50,
      level: 0,
      effect: () => setMultiplier(prev => prev * 2)
    }
  ]);

  // Handle click with haptic feedback
  const handleClick = useCallback((e) => {
    if (energy <= 0) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Update game state
    const pointsGained = clickPower * multiplier;
    setPoints(prev => prev + pointsGained);
    setEnergy(prev => Math.max(0, prev - 1));
    
    // Check for level up
    if (points >= level * 100) {
      setLevel(prev => prev + 1);
      setEnergy(100); // Refill energy on level up
    }

    // Add click effect
    const effectId = Date.now() + Math.random();
    setClickEffects(prev => [...prev, {
      id: effectId,
      x: x,
      y: y,
      value: pointsGained
    }]);

    // Remove effect after animation
    setTimeout(() => {
      setClickEffects(prev => prev.filter(effect => effect.id !== effectId));
    }, 1000);

    // Haptic feedback
    if (isTelegramReady) {
      hapticFeedback('impact', 'medium');
    }

    // Visual feedback
    setIsClicking(true);
    setTimeout(() => setIsClicking(false), 100);
  }, [energy, clickPower, multiplier, points, level, isTelegramReady, hapticFeedback]);

  // Purchase upgrade
  const purchaseUpgrade = (upgrade) => {
    if (points >= upgrade.cost) {
      setPoints(prev => prev - upgrade.cost);
      upgrade.effect();
      setUpgrades(prev => prev.map(u => 
        u.id === upgrade.id 
          ? { ...u, level: u.level + 1, cost: Math.floor(u.cost * 1.5) }
          : u
      ));
      
      if (isTelegramReady) {
        hapticFeedback('success', 'light');
      }
    }
  };

  // Auto energy regeneration
  useEffect(() => {
    const interval = setInterval(() => {
      setEnergy(prev => Math.min(100, prev + 1));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Responsive classes
  const containerClasses = getGameClasses('container');
  const clickCircleClasses = getGameClasses('clickCircle');
  const statsCardClasses = getGameClasses('statsCard');
  const upgradeButtonClasses = getGameClasses('upgradeButton');

  return (
    <div className={containerClasses} style={getGameStyles('gameContainer')}>
      {/* Game Header */}
      <header className="text-center mb-6 safe-area-top">
        <h1 className="responsive-text-3xl font-bold text-white mb-2">
          Crypto Clicker
        </h1>
        <div className="responsive-flex justify-center gap-4">
          <span className="responsive-text-sm text-gray-400">Level {level}</span>
          <span className="responsive-text-sm text-yellow-400">{points} coins</span>
        </div>
      </header>

      {/* Main Game Area */}
      <main className="flex-1 flex flex-col items-center justify-center py-8">
        {/* Click Circle */}
        <div 
          className={`${clickCircleClasses} ${isClicking ? 'scale-95' : ''}`}
          style={getGameStyles('clickCircle')}
          onClick={handleClick}
        >
          <div 
            className="absolute inset-4 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 shadow-mobile-lg"
            style={getGameStyles('clickCircleInner')}
          >
            <div className="absolute inset-4 rounded-full bg-gradient-to-br from-yellow-300 to-orange-400 flex items-center justify-center">
              <span 
                className="responsive-text-2xl font-bold text-white"
                style={getGameStyles('counter')}
              >
                {clickPower}
              </span>
            </div>
          </div>
        </div>

        {/* Click Effects */}
        {clickEffects.map(effect => (
          <div
            key={effect.id}
            className="absolute pointer-events-none animate-bounce"
            style={{
              left: effect.x,
              top: effect.y,
              transform: 'translate(-50%, -50%)'
            }}
          >
            <span className="responsive-text-lg font-bold text-yellow-400">
              +{effect.value}
            </span>
          </div>
        ))}

        {/* Stats Display */}
        <div className={`w-full max-w-md mt-8 ${statsCardClasses}`} style={getGameStyles('statsCard')}>
          <div className="responsive-grid-2">
            <div className="text-center">
              <p className="responsive-text-xl font-semibold text-green-400">{energy}</p>
              <p className="responsive-text-sm text-gray-400">Energy</p>
            </div>
            <div className="text-center">
              <p className="responsive-text-xl font-semibold text-blue-400">{multiplier}x</p>
              <p className="responsive-text-sm text-gray-400">Multiplier</p>
            </div>
          </div>
          
          {/* Energy Bar */}
          <div className="mt-4">
            <div className="progress-bar">
              <div 
                className="progress-fill bg-green-500" 
                style={{ width: `${energy}%` }}
              />
            </div>
          </div>
        </div>
      </main>

      {/* Upgrade Panel */}
      <section className="safe-area-bottom pb-4">
        <div className="responsive-container">
          <div className="responsive-flex justify-between items-center mb-4">
            <h2 className="responsive-text-lg font-semibold text-white">Upgrades</h2>
            <button 
              className={`${upgradeButtonClasses} bg-blue-600 text-white`}
              onClick={() => setShowUpgradeModal(true)}
            >
              <span className="responsive-text-sm">View All</span>
            </button>
          </div>
          
          <div className="responsive-grid-2">
            {upgrades.slice(0, 2).map(upgrade => (
              <button
                key={upgrade.id}
                className={`${upgradeButtonClasses} ${
                  points >= upgrade.cost ? 'hover:shadow-mobile-lg' : 'opacity-50 cursor-not-allowed'
                }`}
                onClick={() => purchaseUpgrade(upgrade)}
                disabled={points < upgrade.cost}
              >
                <h3 className="responsive-text-base font-semibold text-white mb-1">
                  {upgrade.name}
                </h3>
                <p className="responsive-text-sm text-gray-400 mb-2">
                  {upgrade.description}
                </p>
                <div className="responsive-flex justify-between items-center">
                  <span className="responsive-text-sm text-yellow-400">
                    {upgrade.cost} coins
                  </span>
                  <span className="responsive-text-sm text-gray-400">
                    Lv.{upgrade.level}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="responsive-flex justify-between items-center mb-4">
              <h2 className="responsive-text-xl font-semibold text-white">All Upgrades</h2>
              <button 
                className="touch-target text-gray-400 hover:text-white"
                onClick={() => setShowUpgradeModal(false)}
              >
                <span className="responsive-text-2xl">×</span>
              </button>
            </div>
            
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {upgrades.map(upgrade => (
                <button
                  key={upgrade.id}
                  className={`${upgradeButtonClasses} w-full ${
                    points >= upgrade.cost ? 'hover:shadow-mobile-lg' : 'opacity-50 cursor-not-allowed'
                  }`}
                  onClick={() => purchaseUpgrade(upgrade)}
                  disabled={points < upgrade.cost}
                >
                  <h3 className="responsive-text-base font-semibold text-white mb-1">
                    {upgrade.name}
                  </h3>
                  <p className="responsive-text-sm text-gray-400 mb-2">
                    {upgrade.description}
                  </p>
                  <div className="responsive-flex justify-between items-center">
                    <span className="responsive-text-sm text-yellow-400">
                      {upgrade.cost} coins
                    </span>
                    <span className="responsive-text-sm text-gray-400">
                      Level {upgrade.level}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Debug Info (Development Only) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed top-4 right-4 bg-black bg-opacity-75 text-white p-2 rounded text-xs">
          <p>Viewport: {viewportSize.width}x{viewportSize.height}</p>
          <p>Device: {isMobile ? 'Mobile' : isTablet ? 'Tablet' : 'Desktop'}</p>
          <p>Orientation: {orientation}</p>
          <p>Touch: {isTouchDevice ? 'Yes' : 'No'}</p>
          {telegramViewport && (
            <p>TG Height: {telegramViewport.height}px</p>
          )}
        </div>
      )}
    </div>
  );
};

export default ResponsiveClickerGame;
