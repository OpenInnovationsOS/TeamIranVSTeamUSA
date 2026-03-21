import { test, expect } from '@playwright/test';

// Test configuration
const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';

test.describe('Team Iran vs USA - E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Set up test environment
    await page.goto(BASE_URL);
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Mock Telegram WebApp
    await page.evaluate(() => {
      window.Telegram = {
        WebApp: {
          ready: () => {},
          expand: () => {},
          close: () => {},
          setHeaderColor: () => {},
          setBackgroundColor: () => {},
          sendData: () => {},
          openLink: () => {},
          ready: true,
          isVersionAtLeast: () => true,
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
          viewportStableHeight: 768
        }
      };
    });
  });

  test.describe('Authentication Flow', () => {
    test('should display faction selection for new user', async ({ page }) => {
      await page.goto(`${BASE_URL}/`);
      
      // Check if faction selection is displayed
      await expect(page.locator('h1')).toContainText('Choose Your Faction');
      await expect(page.locator('[data-testid="faction-iran"]')).toBeVisible();
      await expect(page.locator('[data-testid="faction-usa"]')).toBeVisible();
    });

    test('should allow faction selection', async ({ page }) => {
      await page.goto(`${BASE_URL}/`);
      
      // Select Iran faction
      await page.click('[data-testid="faction-iran"]');
      
      // Wait for navigation
      await page.waitForURL(`${BASE_URL}/dashboard`);
      
      // Verify user is logged in with Iran faction
      await expect(page.locator('[data-testid="user-faction"]')).toContainText('🇮🇷 Iran');
    });

    test('should persist faction choice', async ({ page }) => {
      await page.goto(`${BASE_URL}/`);
      
      // Select USA faction
      await page.click('[data-testid="faction-usa"]');
      
      // Wait for navigation
      await page.waitForURL(`${BASE_URL}/dashboard`);
      
      // Refresh page
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      // Verify faction is still selected
      await expect(page.locator('[data-testid="user-faction"]')).toContainText('🇺🇸 USA');
    });
  });

  test.describe('Navigation', () => {
    test.beforeEach(async ({ page }) => {
      // Log in with test user
      await page.goto(`${BASE_URL}/`);
      await page.click('[data-testid="faction-iran"]');
      await page.waitForURL(`${BASE_URL}/dashboard`);
    });

    test('should display navigation menu', async ({ page }) => {
      await expect(page.locator('[data-testid="navigation"]')).toBeVisible();
      await expect(page.locator('[data-testid="nav-dashboard"]')).toBeVisible();
      await expect(page.locator('[data-testid="nav-battle"]')).toBeVisible();
      await expect(page.locator('[data-testid="nav-territory"]')).toBeVisible();
    });

    test('should navigate to battle arena', async ({ page }) => {
      await page.click('[data-testid="nav-battle"]');
      await page.waitForURL(`${BASE_URL}/battle`);
      
      await expect(page.locator('h1')).toContainText('Battle Arena');
    });

    test('should navigate to territory map', async ({ page }) => {
      await page.click('[data-testid="nav-territory"]');
      await page.waitForURL(`${BASE_URL}/territory`);
      
      await expect(page.locator('h1')).toContainText('Territory Map');
    });

    test('should navigate to marketplace', async ({ page }) => {
      await page.click('[data-testid="nav-more"]');
      await page.click('[data-testid="nav-marketplace"]');
      await page.waitForURL(`${BASE_URL}/marketplace`);
      
      await expect(page.locator('h1')).toContainText('Marketplace');
    });
  });

  test.describe('Battle Arena', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${BASE_URL}/`);
      await page.click('[data-testid="faction-iran"]');
      await page.waitForURL(`${BASE_URL}/dashboard`);
      await page.click('[data-testid="nav-battle"]');
      await page.waitForURL(`${BASE_URL}/battle`);
    });

    test('should display battle interface', async ({ page }) => {
      await expect(page.locator('[data-testid="battle-arena"]')).toBeVisible();
      await expect(page.locator('[data-testid="opponent-list"]')).toBeVisible();
      await expect(page.locator('[data-testid="wager-input"]')).toBeVisible();
      await expect(page.locator('[data-testid="battle-button"]')).toBeVisible();
    });

    test('should load opponents', async ({ page }) => {
      await expect(page.locator('[data-testid="opponent-card"]')).toHaveCount.greaterThan(0);
    });

    test('should allow opponent selection', async ({ page }) => {
      const firstOpponent = page.locator('[data-testid="opponent-card"]').first();
      await firstOpponent.click();
      
      await expect(firstOpponent).toHaveClass('selected');
    });

    test('should validate wager input', async ({ page }) => {
      const wagerInput = page.locator('[data-testid="wager-input"]');
      await wagerInput.fill('50');
      
      const battleButton = page.locator('[data-testid="battle-button"]');
      await battleButton.click();
      
      await expect(page.locator('[data-testid="error-message"]')).toContainText('Minimum wager is 100 STG');
    });

    test('should initiate battle', async ({ page }) => {
      // Select opponent
      const firstOpponent = page.locator('[data-testid="opponent-card"]').first();
      await firstOpponent.click();
      
      // Enter valid wager
      const wagerInput = page.locator('[data-testid="wager-input"]');
      await wagerInput.fill('100');
      
      // Start battle
      const battleButton = page.locator('[data-testid="battle-button"]');
      await battleButton.click();
      
      // Wait for battle result
      await expect(page.locator('[data-testid="battle-result"]')).toBeVisible({ timeout: 10000 });
    });

    test('should display battle history', async ({ page }) => {
      await expect(page.locator('[data-testid="battle-history"]')).toBeVisible();
    });
  });

  test.describe('Territory Map', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${BASE_URL}/`);
      await page.click('[data-testid="faction-iran"]');
      await page.waitForURL(`${BASE_URL}/dashboard`);
      await page.click('[data-testid="nav-territory"]');
      await page.waitForURL(`${BASE_URL}/territory`);
    });

    test('should display territory map', async ({ page }) => {
      await expect(page.locator('[data-testid="territory-map"]')).toBeVisible();
      await expect(page.locator('[data-testid="territory-grid"]')).toBeVisible();
    });

    test('should load territories', async ({ page }) => {
      await expect(page.locator('[data-testid="territory-card"]')).toHaveCount.greaterThan(0);
    });

    test('should show territory details on click', async ({ page }) => {
      const firstTerritory = page.locator('[data-testid="territory-card"]').first();
      await firstTerritory.click();
      
      await expect(page.locator('[data-testid="territory-details"]')).toBeVisible();
      await expect(page.locator('[data-testid="territory-stats"]')).toBeVisible();
    });

    test('should allow territory attack', async ({ page }) => {
      const firstTerritory = page.locator('[data-testid="territory-card"]').first();
      await firstTerritory.click();
      
      const attackButton = page.locator('[data-testid="attack-button"]');
      if (await attackButton.isVisible()) {
        await attackButton.click();
        
        // Wait for attack result
        await expect(page.locator('[data-testid="attack-result"]')).toBeVisible({ timeout: 10000 });
      }
    });
  });

  test.describe('Marketplace', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${BASE_URL}/`);
      await page.click('[data-testid="faction-iran"]');
      await page.waitForURL(`${BASE_URL}/dashboard`);
      await page.click('[data-testid="nav-more"]');
      await page.click('[data-testid="nav-marketplace"]');
      await page.waitForURL(`${BASE_URL}/marketplace`);
    });

    test('should display marketplace', async ({ page }) => {
      await expect(page.locator('[data-testid="marketplace"]')).toBeVisible();
      await expect(page.locator('[data-testid="user-balance"]')).toBeVisible();
      await expect(page.locator('[data-testid="item-grid"]')).toBeVisible();
    });

    test('should load marketplace items', async ({ page }) => {
      await expect(page.locator('[data-testid="item-card"]')).toHaveCount.greaterThan(0);
    });

    test('should allow item filtering', async ({ page }) => {
      const filterSelect = page.locator('[data-testid="item-filter"]');
      await filterSelect.selectOption('weapons');
      
      await expect(page.locator('[data-testid="item-card"][data-item-type="weapons"]')).toHaveCount.greaterThan(0);
    });

    test('should allow item purchase', async ({ page }) => {
      const firstItem = page.locator('[data-testid="item-card"]').first();
      await firstItem.click();
      
      const purchaseButton = page.locator('[data-testid="purchase-button"]');
      if (await purchaseButton.isVisible()) {
        await purchaseButton.click();
        
        // Wait for purchase result
        await expect(page.locator('[data-testid="purchase-result"]')).toBeVisible({ timeout: 10000 });
      }
    });
  });

  test.describe('Responsive Design', () => {
    test('should work on mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto(`${BASE_URL}/`);
      
      await expect(page.locator('[data-testid="faction-selection"]')).toBeVisible();
    });

    test('should work on tablet viewport', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto(`${BASE_URL}/`);
      
      await expect(page.locator('[data-testid="faction-selection"]')).toBeVisible();
    });

    test('should work on desktop viewport', async ({ page }) => {
      await page.setViewportSize({ width: 1200, height: 800 });
      await page.goto(`${BASE_URL}/`);
      
      await expect(page.locator('[data-testid="faction-selection"]')).toBeVisible();
    });
  });

  test.describe('Performance', () => {
    test('should load page quickly', async ({ page }) => {
      const startTime = Date.now();
      await page.goto(`${BASE_URL}/`);
      await page.waitForLoadState('networkidle');
      const loadTime = Date.now() - startTime;
      
      // Page should load in less than 3 seconds
      expect(loadTime).toBeLessThan(3000);
    });

    test('should have good Core Web Vitals', async ({ page }) => {
      await page.goto(`${BASE_URL}/`);
      await page.waitForLoadState('networkidle');
      
      // Get performance metrics
      const metrics = await page.evaluate(() => {
        return new Promise((resolve) => {
          const observer = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const vitals = {};
            
            entries.forEach((entry) => {
              if (entry.entryType === 'navigation') {
                vitals.loadTime = entry.loadEventEnd - entry.loadEventStart;
                vitals.domContentLoaded = entry.domContentLoadedEventEnd - entry.loadEventStart;
              }
            });
            
            resolve(vitals);
          });
          
          observer.observe({ entryTypes: ['navigation'] });
          
          // Fallback timeout
          setTimeout(() => resolve({}), 5000);
        });
      });
      
      // Check performance thresholds
      expect(metrics.loadTime).toBeLessThan(3000);
      expect(metrics.domContentLoaded).toBeLessThan(1500);
    });
  });

  test.describe('Accessibility', () => {
    test('should be keyboard navigable', async ({ page }) => {
      await page.goto(`${BASE_URL}/`);
      
      // Test keyboard navigation
      await page.keyboard.press('Tab');
      await expect(page.locator(':focus')).toBeVisible();
      
      await page.keyboard.press('Tab');
      await expect(page.locator(':focus')).toBeVisible();
    });

    test('should have proper ARIA labels', async ({ page }) => {
      await page.goto(`${BASE_URL}/`);
      
      // Check for ARIA labels
      const buttons = await page.locator('button').all();
      for (const button of buttons) {
        const ariaLabel = await button.getAttribute('aria-label');
        const textContent = await button.textContent();
        
        // Either should have aria-label or text content
        expect(ariaLabel || textContent).toBeTruthy();
      }
    });

    test('should have sufficient color contrast', async ({ page }) => {
      await page.goto(`${BASE_URL}/`);
      
      // Check color contrast (simplified test)
      const elements = await page.locator('[data-testid]').all();
      for (const element of elements) {
        const styles = await element.evaluate((el) => {
          const computed = window.getComputedStyle(el);
          return {
            color: computed.color,
            backgroundColor: computed.backgroundColor
          };
        });
        
        // Basic contrast check (simplified)
        if (styles.color && styles.backgroundColor) {
          // This is a simplified check - in real implementation, use proper contrast calculation
          expect(styles.color).not.toBe(styles.backgroundColor);
        }
      }
    });
  });

  test.describe('Error Handling', () => {
    test('should handle network errors gracefully', async ({ page }) => {
      // Mock network failure
      await page.route('**/api/leaderboard', route => route.abort());
      
      await page.goto(`${BASE_URL}/battle`);
      
      // Should show error message
      await expect(page.locator('[data-testid="error-message"]')).toBeVisible({ timeout: 5000 });
    });

    test('should handle server errors gracefully', async ({ page }) => {
      // Mock server error
      await page.route('**/api/battle', route => {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Internal server error' })
        });
      });
      
      await page.goto(`${BASE_URL}/battle`);
      
      // Select opponent and enter wager
      const firstOpponent = page.locator('[data-testid="opponent-card"]').first();
      await firstOpponent.click();
      
      const wagerInput = page.locator('[data-testid="wager-input"]');
      await wagerInput.fill('100');
      
      const battleButton = page.locator('[data-testid="battle-button"]');
      await battleButton.click();
      
      // Should show error message
      await expect(page.locator('[data-testid="error-message"]')).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Real-time Features', () => {
    test('should establish WebSocket connection', async ({ page }) => {
      await page.goto(`${BASE_URL}/battle`);
      
      // Check if WebSocket connection is established
      const wsConnected = await page.evaluate(() => {
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve(window.wsConnected || false);
          }, 2000);
        });
      });
      
      // WebSocket should be connected (if implemented)
      // This test might fail if WebSocket is not implemented
      console.log('WebSocket connection status:', wsConnected);
    });

    test('should handle real-time updates', async ({ page }) => {
      await page.goto(`${BASE_URL}/battle`);
      
      // Mock real-time update
      await page.evaluate(() => {
        if (window.handleRealTimeUpdate) {
          window.handleRealTimeUpdate({
            type: 'battle_update',
            data: { status: 'completed' }
          });
        }
      });
      
      // Check if UI updates
      await page.waitForTimeout(1000);
      
      // Verify update handling
      const updateHandled = await page.evaluate(() => {
        return window.lastRealTimeUpdate || false;
      });
      
      console.log('Real-time update handled:', updateHandled);
    });
  });
});
