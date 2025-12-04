/**
 * Mobile Compatibility Tests
 * Tests filtering and sorting functionality on mobile devices across browsers
 */

import { test, expect, devices } from '@playwright/test';

// Mobile device configurations
const mobileDevices = [
  { name: 'iPhone 12', device: devices['iPhone 12'] },
  { name: 'iPhone 13', device: devices['iPhone 13'] },
  { name: 'Pixel 5', device: devices['Pixel 5'] },
  { name: 'Samsung Galaxy S21', device: devices['Galaxy S21'] },
  { name: 'iPad', device: devices['iPad Pro'] },
];

describe('Mobile Compatibility - Touch Interactions', () => {
  mobileDevices.forEach(({ name, device }) => {
    describe(`${name} - Touch Interactions`, () => {
      test.use({ ...device });

      test('should handle filter input touch events', async ({ page }) => {
        await page.goto('/trades');
        await page.waitForLoadState('networkidle');

        // Test touch-friendly filter inputs
        const symbolInput = page.locator('[data-testid="symbol-filter"]');
        await expect(symbolInput).toBeVisible();
        
        // Tap to focus (simulates touch)
        await symbolInput.tap();
        await expect(symbolInput).toBeFocused();
        
        // Type using virtual keyboard
        await symbolInput.fill('AAPL');
        await expect(symbolInput).toHaveValue('AAPL');
        
        // Hide keyboard
        await symbolInput.blur();
        await page.waitForTimeout(300);
        
        // Verify filter applied
        const trades = page.locator('[data-testid="trade-row"], [data-testid="trade-card"]');
        const count = await trades.count();
        expect(count).toBeGreaterThan(0);
      });

      test('should handle dropdown touch interactions', async ({ page }) => {
        await page.goto('/trades');
        await page.waitForLoadState('networkidle');

        // Test dropdown interactions
        const marketFilter = page.locator('[data-testid="market-filter"]');
        await expect(marketFilter).toBeVisible();
        
        // Tap to open dropdown
        await marketFilter.tap();
        
        // Wait for dropdown options to appear
        const options = page.locator('[data-testid="market-option"]');
        await expect(options.first()).toBeVisible();
        
        // Tap an option
        const stockOption = page.locator('[data-testid="market-option"]').filter({ hasText: 'stock' });
        await stockOption.tap();
        
        await page.waitForTimeout(300);
        
        // Verify selection
        await expect(marketFilter).toHaveValue('stock');
      });

      test('should handle button touch interactions', async ({ page }) => {
        await page.goto('/trades');
        await page.waitForLoadState('networkidle');

        // Test button interactions
        const clearButton = page.locator('[data-testid="clear-filters"]');
        await expect(clearButton).toBeVisible();
        
        // Tap button
        await clearButton.tap();
        await page.waitForTimeout(300);
        
        // Verify action completed
        // Button should still be visible and enabled
        await expect(clearButton).toBeVisible();
      });

      test('should handle scroll gestures', async ({ page }) => {
        await page.goto('/trades');
        await page.waitForLoadState('networkidle');

        // Test vertical scrolling
        const tradesContainer = page.locator('[data-testid="trades-container"]');
        await expect(tradesContainer).toBeVisible();
        
        // Scroll down
        await tradesContainer.evaluate((el) => {
          el.scrollTop = 500;
        });
        
        await page.waitForTimeout(500);
        
        // Verify content scrolled
        const scrollTop = await tradesContainer.evaluate((el) => el.scrollTop);
        expect(scrollTop).toBeGreaterThan(0);
        
        // Test horizontal scroll if needed
        const hasHorizontalScroll = await tradesContainer.evaluate((el) => 
          el.scrollWidth > el.clientWidth
        );
        
        if (hasHorizontalScroll) {
          await tradesContainer.evaluate((el) => {
            el.scrollLeft = 200;
          });
          
          await page.waitForTimeout(500);
          
          const scrollLeft = await tradesContainer.evaluate((el) => el.scrollLeft);
          expect(scrollLeft).toBeGreaterThan(0);
        }
      });

      test('should handle pinch to zoom', async ({ page }) => {
        await page.goto('/trades');
        await page.waitForLoadState('networkidle');

        // Get initial viewport
        const initialViewport = page.viewportSize();
        expect(initialViewport).toBeTruthy();

        // Test zoom levels (if supported)
        await page.evaluate(() => {
          document.body.style.zoom = '1.5';
        });
        
        // Verify elements are still accessible
        const filterControls = page.locator('[data-testid="filter-controls"]');
        await expect(filterControls).toBeVisible();
        
        // Reset zoom
        await page.evaluate(() => {
          document.body.style.zoom = '1';
        });
        
        await expect(filterControls).toBeVisible();
      });
    });
  });
});

describe('Mobile Compatibility - Responsive Design', () => {
  mobileDevices.forEach(({ name, device }) => {
    describe(`${name} - Responsive Layout`, () => {
      test.use({ ...device });

      test('should adapt layout for mobile screen', async ({ page }) => {
        await page.goto('/trades');
        await page.waitForLoadState('networkidle');

        // Check mobile-specific elements
        const mobileMenu = page.locator('[data-testid="mobile-menu"]');
        const mobileFilterToggle = page.locator('[data-testid="mobile-filter-toggle"]');
        
        // At least one should be visible on mobile
        const menuVisible = await mobileMenu.isVisible();
        const toggleVisible = await mobileFilterToggle.isVisible();
        
        expect(menuVisible || toggleVisible).toBe(true);
      });

      test('should handle mobile filter panel', async ({ page }) => {
        await page.goto('/trades');
        await page.waitForLoadState('networkidle');

        // Look for mobile filter controls
        const mobileFilterPanel = page.locator('[data-testid="mobile-filter-panel"]');
        const mobileFilterToggle = page.locator('[data-testid="mobile-filter-toggle"]');
        
        if (await mobileFilterToggle.isVisible()) {
          // Toggle mobile filter panel
          await mobileFilterToggle.tap();
          await page.waitForTimeout(300);
          
          // Panel should be visible
          await expect(mobileFilterPanel).toBeVisible();
          
          // Test filter interaction in mobile panel
          const symbolInput = page.locator('[data-testid="symbol-filter"]');
          if (await symbolInput.isVisible()) {
            await symbolInput.tap();
            await symbolInput.fill('AAPL');
            await page.waitForTimeout(300);
            
            // Apply filter
            const applyButton = page.locator('[data-testid="apply-filters"]');
            if (await applyButton.isVisible()) {
              await applyButton.tap();
              await page.waitForTimeout(500);
            }
          }
        }
      });

      test('should handle mobile navigation', async ({ page }) => {
        await page.goto('/trades');
        await page.waitForLoadState('networkidle');

        // Test mobile navigation elements
        const mobileNav = page.locator('[data-testid="mobile-navigation"]');
        const hamburgerMenu = page.locator('[data-testid="hamburger-menu"]');
        
        if (await hamburgerMenu.isVisible()) {
          // Open mobile menu
          await hamburgerMenu.tap();
          await page.waitForTimeout(300);
          
          // Menu should be visible
          await expect(mobileNav).toBeVisible();
          
          // Test navigation items
          const navItems = page.locator('[data-testid="nav-item"]');
          const itemCount = await navItems.count();
          
          if (itemCount > 0) {
            // Tap first nav item
            await navItems.first().tap();
            await page.waitForTimeout(500);
          }
        }
      });

      test('should display mobile-optimized trade cards', async ({ page }) => {
        await page.goto('/trades');
        await page.waitForLoadState('networkidle');

        // Check for mobile-optimized display
        const tradeCards = page.locator('[data-testid="trade-card"]');
        const tradeTable = page.locator('[data-testid="trades-table"]');
        
        const cardsVisible = await tradeCards.isVisible();
        const tableVisible = await tradeTable.isVisible();
        
        // At least one should be visible
        expect(cardsVisible || tableVisible).toBe(true);
        
        if (cardsVisible) {
          // Test card interactions
          const firstCard = tradeCards.first();
          await expect(firstCard).toBeVisible();
          
          // Test card tap interaction
          await firstCard.tap();
          await page.waitForTimeout(300);
          
          // Card should respond to tap (expand, navigate, etc.)
          // This depends on your specific implementation
        }
      });
    });
  });
});

describe('Mobile Compatibility - Performance', () => {
  mobileDevices.forEach(({ name, device }) => {
    describe(`${name} - Performance`, () => {
      test.use({ ...device });

      test('should load efficiently on mobile', async ({ page }) => {
        const startTime = Date.now();
        
        await page.goto('/trades');
        await page.waitForLoadState('networkidle');
        
        const loadTime = Date.now() - startTime;
        
        // Should load within reasonable time on mobile
        expect(loadTime).toBeLessThan(5000); // 5 seconds max for mobile
      });

      test('should handle filter operations efficiently', async ({ page }) => {
        await page.goto('/trades');
        await page.waitForLoadState('networkidle');

        // Measure filter performance
        const startTime = Date.now();
        
        const symbolInput = page.locator('[data-testid="symbol-filter"]');
        await symbolInput.tap();
        await symbolInput.fill('AAPL');
        await symbolInput.blur();
        
        await page.waitForTimeout(500);
        
        const filterTime = Date.now() - startTime;
        
        // Filter should be responsive on mobile
        expect(filterTime).toBeLessThan(2000); // 2 seconds max
      });

      test('should handle scroll performance', async ({ page }) => {
        await page.goto('/trades');
        await page.waitForLoadState('networkidle');

        // Test scroll performance
        const tradesContainer = page.locator('[data-testid="trades-container"]');
        
        // Measure scroll performance
        const startTime = Date.now();
        
        await tradesContainer.evaluate(async (el) => {
          // Simulate multiple scroll events
          for (let i = 0; i < 10; i++) {
            el.scrollTop = i * 100;
            await new Promise(resolve => setTimeout(resolve, 50));
          }
        });
        
        const scrollTime = Date.now() - startTime;
        
        // Scrolling should be smooth
        expect(scrollTime).toBeLessThan(3000); // 3 seconds for 10 scroll steps
      });

      test('should handle memory efficiently', async ({ page }) => {
        // Get initial memory usage
        const initialMemory = await page.evaluate(() => {
          return (performance as any).memory?.usedJSHeapSize || 0;
        });

        // Perform multiple operations
        for (let i = 0; i < 5; i++) {
          await page.goto('/trades');
          await page.waitForLoadState('networkidle');
          
          const symbolInput = page.locator('[data-testid="symbol-filter"]');
          await symbolInput.tap();
          await symbolInput.fill(`SYMBOL${i}`);
          await symbolInput.blur();
          await page.waitForTimeout(300);
        }

        // Get final memory usage
        const finalMemory = await page.evaluate(() => {
          return (performance as any).memory?.usedJSHeapSize || 0;
        });

        const memoryGrowth = finalMemory - initialMemory;
        
        // Memory growth should be reasonable
        expect(memoryGrowth).toBeLessThan(10 * 1024 * 1024); // Less than 10MB
      });
    });
  });
});

describe('Mobile Compatibility - Orientation', () => {
  mobileDevices.forEach(({ name, device }) => {
    describe(`${name} - Orientation Changes`, () => {
      test.use({ ...device });

      test('should handle portrait orientation', async ({ page }) => {
        // Set portrait orientation
        await page.setViewportSize({ width: 375, height: 667 });
        
        await page.goto('/trades');
        await page.waitForLoadState('networkidle');

        // Check portrait layout
        const filterControls = page.locator('[data-testid="filter-controls"]');
        await expect(filterControls).toBeVisible();
        
        // Verify elements fit in portrait
        const viewportHeight = page.viewportSize()?.height || 667;
        const controlsHeight = await filterControls.evaluate(el => {
          if (el instanceof HTMLElement) {
            return el.offsetHeight;
          }
          return 0;
        });
        
        expect(controlsHeight).toBeLessThan(viewportHeight * 0.3); // Max 30% of height
      });

      test('should handle landscape orientation', async ({ page }) => {
        // Set landscape orientation
        await page.setViewportSize({ width: 667, height: 375 });
        
        await page.goto('/trades');
        await page.waitForLoadState('networkidle');

        // Check landscape layout
        const filterControls = page.locator('[data-testid="filter-controls"]');
        await expect(filterControls).toBeVisible();
        
        // Verify elements adapt to landscape
        const viewportWidth = page.viewportSize()?.width || 667;
        const controlsWidth = await filterControls.evaluate(el => {
          if (el instanceof HTMLElement) {
            return el.offsetWidth;
          }
          return 0;
        });
        
        expect(controlsWidth).toBeLessThan(viewportWidth); // Should fit horizontally
      });

      test('should handle orientation change', async ({ page }) => {
        // Start in portrait
        await page.setViewportSize({ width: 375, height: 667 });
        await page.goto('/trades');
        await page.waitForLoadState('networkidle');

        // Get initial state
        const symbolInput = page.locator('[data-testid="symbol-filter"]');
        await symbolInput.tap();
        await symbolInput.fill('AAPL');
        
        // Change to landscape
        await page.setViewportSize({ width: 667, height: 375 });
        await page.waitForTimeout(500);
        
        // Verify state preserved
        await expect(symbolInput).toHaveValue('AAPL');
        await expect(symbolInput).toBeVisible();
        
        // Verify layout adapted
        const filterControls = page.locator('[data-testid="filter-controls"]');
        await expect(filterControls).toBeVisible();
      });
    });
  });
});

describe('Mobile Compatibility - Keyboard', () => {
  mobileDevices.forEach(({ name, device }) => {
    describe(`${name} - Virtual Keyboard`, () => {
      test.use({ ...device });

      test('should handle virtual keyboard appearance', async ({ page }) => {
        await page.goto('/trades');
        await page.waitForLoadState('networkidle');

        const symbolInput = page.locator('[data-testid="symbol-filter"]');
        
        // Focus input to trigger keyboard
        await symbolInput.tap();
        await expect(symbolInput).toBeFocused();
        
        // Wait for potential keyboard adjustment
        await page.waitForTimeout(500);
        
        // Input should still be visible and accessible
        await expect(symbolInput).toBeVisible();
        
        // Type with keyboard
        await symbolInput.fill('AAPL');
        await expect(symbolInput).toHaveValue('AAPL');
      });

      test('should handle keyboard dismissal', async ({ page }) => {
        await page.goto('/trades');
        await page.waitForLoadState('networkidle');

        const symbolInput = page.locator('[data-testid="symbol-filter"]');
        
        // Focus input
        await symbolInput.tap();
        await symbolInput.fill('AAPL');
        
        // Dismiss keyboard (tap outside or press done)
        await symbolInput.blur();
        await page.waitForTimeout(300);
        
        // Value should be preserved
        await expect(symbolInput).toHaveValue('AAPL');
        
        // Layout should return to normal
        const filterControls = page.locator('[data-testid="filter-controls"]');
        await expect(filterControls).toBeVisible();
      });

      test('should handle keyboard navigation', async ({ page }) => {
        await page.goto('/trades');
        await page.waitForLoadState('networkidle');

        // Test tab navigation between inputs
        const symbolInput = page.locator('[data-testid="symbol-filter"]');
        const marketFilter = page.locator('[data-testid="market-filter"]');
        
        await symbolInput.tap();
        
        // Try to navigate to next input
        await page.keyboard.press('Tab');
        await page.waitForTimeout(200);
        
        // Should focus on next input
        const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
        expect(focusedElement === 'INPUT' || focusedElement === 'SELECT').toBe(true);
      });
    });
  });
});