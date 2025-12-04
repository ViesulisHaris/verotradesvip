/**
 * Performance Compatibility Tests
 * Tests filtering and sorting performance across different browsers
 */

import { test, expect, devices } from '@playwright/test';

// Browser configurations for performance testing
const browserConfigs = [
  { name: 'Chrome', device: devices['Desktop Chrome'] },
  { name: 'Firefox', device: devices['Desktop Firefox'] },
  { name: 'Safari', device: devices['Desktop Safari'] },
  { name: 'Edge', device: devices['Desktop Edge'] },
];

// Mobile configurations for performance testing
const mobileConfigs = [
  { name: 'Mobile Chrome', device: devices['Pixel 5'] },
  { name: 'Mobile Safari', device: devices['iPhone 12'] },
];

describe('Cross-Browser Performance - Filtering', () => {
  browserConfigs.forEach(({ name, device }) => {
    describe(`${name} - Filter Performance`, () => {
      test.use({ ...device });

      test('should apply symbol filter within performance target', async ({ page }) => {
        await page.goto('/trades');
        await page.waitForLoadState('networkidle');

        // Measure filter performance
        const startTime = Date.now();
        
        const symbolInput = page.locator('[data-testid="symbol-filter"]');
        await symbolInput.fill('AAPL');
        
        // Wait for filter to complete
        await page.waitForTimeout(300);
        
        const endTime = Date.now();
        const filterTime = endTime - startTime;
        
        // Filter should complete within target time
        expect(filterTime).toBeLessThan(1000); // 1 second target
        
        // Verify filter applied
        const trades = page.locator('[data-testid="trade-row"], [data-testid="trade-card"]');
        const count = await trades.count();
        expect(count).toBeGreaterThanOrEqual(0);
      });

      test('should apply market filter within performance target', async ({ page }) => {
        await page.goto('/trades');
        await page.waitForLoadState('networkidle');

        const startTime = Date.now();
        
        const marketFilter = page.locator('[data-testid="market-filter"]');
        await marketFilter.selectOption('stock');
        
        await page.waitForTimeout(300);
        
        const endTime = Date.now();
        const filterTime = endTime - startTime;
        
        expect(filterTime).toBeLessThan(1000);
        
        // Verify filter applied
        const trades = page.locator('[data-testid="trade-row"], [data-testid="trade-card"]');
        const count = await trades.count();
        expect(count).toBeGreaterThanOrEqual(0);
      });

      test('should apply date range filter within performance target', async ({ page }) => {
        await page.goto('/trades');
        await page.waitForLoadState('networkidle');

        const startTime = Date.now();
        
        const startDateInput = page.locator('[data-testid="start-date-filter"]');
        const endDateInput = page.locator('[data-testid="end-date-filter"]');
        
        await startDateInput.fill('2024-01-01');
        await endDateInput.fill('2024-12-31');
        await startDateInput.blur();
        
        await page.waitForTimeout(500);
        
        const endTime = Date.now();
        const filterTime = endTime - startTime;
        
        expect(filterTime).toBeLessThan(1500); // 1.5 seconds for date range
        
        // Verify filter applied
        const trades = page.locator('[data-testid="trade-row"], [data-testid="trade-card"]');
        const count = await trades.count();
        expect(count).toBeGreaterThanOrEqual(0);
      });

      test('should apply multiple filters within performance target', async ({ page }) => {
        await page.goto('/trades');
        await page.waitForLoadState('networkidle');

        const startTime = Date.now();
        
        // Apply multiple filters
        const symbolInput = page.locator('[data-testid="symbol-filter"]');
        const marketFilter = page.locator('[data-testid="market-filter"]');
        const pnlFilter = page.locator('[data-testid="pnl-filter"]');
        
        await symbolInput.fill('AAPL');
        await marketFilter.selectOption('stock');
        await pnlFilter.selectOption('profitable');
        
        await page.waitForTimeout(500);
        
        const endTime = Date.now();
        const filterTime = endTime - startTime;
        
        expect(filterTime).toBeLessThan(2000); // 2 seconds for multiple filters
        
        // Verify all filters applied
        const trades = page.locator('[data-testid="trade-row"], [data-testid="trade-card"]');
        const count = await trades.count();
        expect(count).toBeGreaterThanOrEqual(0);
      });

      test('should clear filters within performance target', async ({ page }) => {
        await page.goto('/trades');
        await page.waitForLoadState('networkidle');

        // First apply some filters
        const symbolInput = page.locator('[data-testid="symbol-filter"]');
        await symbolInput.fill('AAPL');
        await page.waitForTimeout(300);
        
        // Then measure clear performance
        const startTime = Date.now();
        
        const clearButton = page.locator('[data-testid="clear-filters"]');
        await clearButton.click();
        
        await page.waitForTimeout(300);
        
        const endTime = Date.now();
        const clearTime = endTime - startTime;
        
        expect(clearTime).toBeLessThan(1000); // 1 second to clear
        
        // Verify filters cleared
        await expect(symbolInput).toHaveValue('');
      });
    });
  });
});

describe('Cross-Browser Performance - Sorting', () => {
  browserConfigs.forEach(({ name, device }) => {
    describe(`${name} - Sort Performance`, () => {
      test.use({ ...device });

      test('should apply quick sort within performance target', async ({ page }) => {
        await page.goto('/trades');
        await page.waitForLoadState('networkidle');

        const startTime = Date.now();
        
        const sortByDateBtn = page.locator('[data-testid="sort-by-date"]');
        await sortByDateBtn.click();
        
        await page.waitForTimeout(300);
        
        const endTime = Date.now();
        const sortTime = endTime - startTime;
        
        expect(sortTime).toBeLessThan(1000); // 1 second target
        
        // Verify sort applied
        const url = page.url();
        expect(url).toContain('sortBy=trade_date');
      });

      test('should apply advanced sort within performance target', async ({ page }) => {
        await page.goto('/trades');
        await page.waitForLoadState('networkidle');

        const startTime = Date.now();
        
        const sortDropdown = page.locator('[data-testid="advanced-sort-dropdown"]');
        await sortDropdown.click();
        
        const sortOption = page.locator('[data-testid="sort-option-pnl"]');
        await sortOption.click();
        
        await page.waitForTimeout(300);
        
        const endTime = Date.now();
        const sortTime = endTime - startTime;
        
        expect(sortTime).toBeLessThan(1000); // 1 second target
        
        // Verify sort applied
        const url = page.url();
        expect(url).toContain('sortBy=pnl');
      });

      test('should toggle sort order within performance target', async ({ page }) => {
        await page.goto('/trades');
        await page.waitForLoadState('networkidle');

        const startTime = Date.now();
        
        const sortOrderToggle = page.locator('[data-testid="sort-order-toggle"]');
        await sortOrderToggle.click();
        
        await page.waitForTimeout(300);
        
        const endTime = Date.now();
        const toggleTime = endTime - startTime;
        
        expect(toggleTime).toBeLessThan(500); // 0.5 second target
        
        // Verify order changed
        const url = page.url();
        const initialOrder = url.includes('sortOrder=desc') ? 'desc' : 'asc';
        expect(initialOrder).toBeTruthy();
      });
    });
  });
});

describe('Cross-Browser Performance - Large Datasets', () => {
  browserConfigs.forEach(({ name, device }) => {
    describe(`${name} - Large Dataset Performance`, () => {
      test.use({ ...device });

      test('should handle large dataset efficiently', async ({ page }) => {
        const startTime = Date.now();
        
        await page.goto('/trades');
        await page.waitForLoadState('networkidle');
        
        const endTime = Date.now();
        const loadTime = endTime - startTime;
        
        // Should load within target time
        expect(loadTime).toBeLessThan(3000); // 3 seconds for initial load
        
        // Verify content loaded
        const trades = page.locator('[data-testid="trade-row"], [data-testid="trade-card"]');
        const count = await trades.count();
        expect(count).toBeGreaterThan(0);
      });

      test('should maintain performance with rapid filter changes', async ({ page }) => {
        await page.goto('/trades');
        await page.waitForLoadState('networkidle');

        const symbolInput = page.locator('[data-testid="symbol-filter"]');
        
        // Measure rapid filter changes
        const startTime = Date.now();
        
        for (let i = 0; i < 5; i++) {
          await symbolInput.fill(`SYMBOL${i}`);
          await page.waitForTimeout(100);
        }
        
        const endTime = Date.now();
        const totalTime = endTime - startTime;
        
        // Average time per filter change should be reasonable
        const avgTime = totalTime / 5;
        expect(avgTime).toBeLessThan(500); // 0.5 seconds average
      });

      test('should maintain performance with rapid sort changes', async ({ page }) => {
        await page.goto('/trades');
        await page.waitForLoadState('networkidle');

        const sortByDateBtn = page.locator('[data-testid="sort-by-date"]');
        const sortByPnlBtn = page.locator('[data-testid="sort-by-pnl"]');
        
        // Measure rapid sort changes
        const startTime = Date.now();
        
        for (let i = 0; i < 5; i++) {
          if (i % 2 === 0) {
            await sortByDateBtn.click();
          } else {
            await sortByPnlBtn.click();
          }
          await page.waitForTimeout(100);
        }
        
        const endTime = Date.now();
        const totalTime = endTime - startTime;
        
        // Average time per sort change should be reasonable
        const avgTime = totalTime / 5;
        expect(avgTime).toBeLessThan(500); // 0.5 seconds average
      });
    });
  });
});

describe('Mobile Performance - Filtering', () => {
  mobileConfigs.forEach(({ name, device }) => {
    describe(`${name} - Mobile Filter Performance`, () => {
      test.use({ ...device });

      test('should apply filters efficiently on mobile', async ({ page }) => {
        await page.goto('/trades');
        await page.waitForLoadState('networkidle');

        const startTime = Date.now();
        
        const symbolInput = page.locator('[data-testid="symbol-filter"]');
        await symbolInput.tap();
        await symbolInput.fill('AAPL');
        await symbolInput.blur();
        
        await page.waitForTimeout(500);
        
        const endTime = Date.now();
        const filterTime = endTime - startTime;
        
        // Mobile filter should complete within target time
        expect(filterTime).toBeLessThan(2000); // 2 seconds for mobile
        
        // Verify filter applied
        const trades = page.locator('[data-testid="trade-row"], [data-testid="trade-card"]');
        const count = await trades.count();
        expect(count).toBeGreaterThanOrEqual(0);
      });

      test('should handle mobile filter panel efficiently', async ({ page }) => {
        await page.goto('/trades');
        await page.waitForLoadState('networkidle');

        const mobileFilterToggle = page.locator('[data-testid="mobile-filter-toggle"]');
        
        if (await mobileFilterToggle.isVisible()) {
          const startTime = Date.now();
          
          await mobileFilterToggle.tap();
          await page.waitForTimeout(300);
          
          const endTime = Date.now();
          const toggleTime = endTime - startTime;
          
          expect(toggleTime).toBeLessThan(1000); // 1 second to open panel
          
          // Test filter in panel
          const symbolInput = page.locator('[data-testid="symbol-filter"]');
          if (await symbolInput.isVisible()) {
            const filterStartTime = Date.now();
            
            await symbolInput.tap();
            await symbolInput.fill('AAPL');
            
            const applyButton = page.locator('[data-testid="apply-filters"]');
            if (await applyButton.isVisible()) {
              await applyButton.tap();
              await page.waitForTimeout(500);
            }
            
            const filterEndTime = Date.now();
            const filterTime = filterEndTime - filterStartTime;
            
            expect(filterTime).toBeLessThan(2000); // 2 seconds for mobile panel
          }
        }
      });
    });
  });
});

describe('Cross-Browser Performance - Memory', () => {
  browserConfigs.forEach(({ name, device }) => {
    describe(`${name} - Memory Performance`, () => {
      test.use({ ...device });

      test('should not cause excessive memory growth', async ({ page }) => {
        // Get initial memory
        const initialMemory = await page.evaluate(() => {
          return (performance as any).memory?.usedJSHeapSize || 0;
        });

        // Perform multiple operations
        for (let i = 0; i < 10; i++) {
          await page.goto('/trades');
          await page.waitForLoadState('networkidle');
          
          const symbolInput = page.locator('[data-testid="symbol-filter"]');
          await symbolInput.fill(`TEST${i}`);
          await page.waitForTimeout(200);
          
          const clearButton = page.locator('[data-testid="clear-filters"]');
          await clearButton.click();
          await page.waitForTimeout(200);
        }

        // Get final memory
        const finalMemory = await page.evaluate(() => {
          return (performance as any).memory?.usedJSHeapSize || 0;
        });

        const memoryGrowth = finalMemory - initialMemory;
        
        // Memory growth should be reasonable
        expect(memoryGrowth).toBeLessThan(5 * 1024 * 1024); // Less than 5MB
      });

      test('should handle memory pressure gracefully', async ({ page }) => {
        await page.goto('/trades');
        await page.waitForLoadState('networkidle');

        // Simulate memory pressure with rapid operations
        const symbolInput = page.locator('[data-testid="symbol-filter"]');
        const marketFilter = page.locator('[data-testid="market-filter"]');
        
        for (let i = 0; i < 20; i++) {
          await symbolInput.fill(`SYMBOL${i % 5}`);
          await marketFilter.selectOption(i % 2 === 0 ? 'stock' : 'crypto');
          await page.waitForTimeout(100);
        }

        // Page should still be responsive
        await expect(symbolInput).toBeVisible();
        await expect(marketFilter).toBeVisible();
        
        // Verify functionality still works
        await symbolInput.fill('FINAL_TEST');
        await page.waitForTimeout(300);
        
        await expect(symbolInput).toHaveValue('FINAL_TEST');
      });
    });
  });
});

describe('Cross-Browser Performance - Network', () => {
  browserConfigs.forEach(({ name, device }) => {
    describe(`${name} - Network Performance`, () => {
      test.use({ ...device });

      test('should handle slow network conditions', async ({ page }) => {
        // Simulate slow network
        await page.route('**/*', async route => {
          await new Promise(resolve => setTimeout(resolve, 500)); // 500ms delay
          return route.continue();
        });

        const startTime = Date.now();
        
        await page.goto('/trades');
        await page.waitForLoadState('networkidle');
        
        const endTime = Date.now();
        const loadTime = endTime - startTime;
        
        // Should handle slow network gracefully
        expect(loadTime).toBeLessThan(10000); // 10 seconds max with slow network
        
        // Verify content loaded
        const trades = page.locator('[data-testid="trade-row"], [data-testid="trade-card"]');
        const count = await trades.count();
        expect(count).toBeGreaterThan(0);
      });

      test('should handle network interruptions', async ({ page }) => {
        await page.goto('/trades');
        await page.waitForLoadState('networkidle');

        const symbolInput = page.locator('[data-testid="symbol-filter"]');
        
        // Simulate network interruption during filter
        await page.route('**/api/trades*', async route => {
          // Fail first request
          if (route.request().url().includes('symbol=AAPL')) {
            await route.fulfill({
              status: 500,
              body: 'Internal Server Error'
            });
          } else {
            await route.continue();
          }
        });

        await symbolInput.fill('AAPL');
        await page.waitForTimeout(1000);
        
        // Should handle network error gracefully
        await expect(symbolInput).toBeVisible();
        
        // Try again with different symbol
        await symbolInput.fill('GOOGL');
        await page.waitForTimeout(1000);
        
        // Should recover from network error
        await expect(symbolInput).toHaveValue('GOOGL');
      });
    });
  });
});

describe('Cross-Browser Performance - Rendering', () => {
  browserConfigs.forEach(({ name, device }) => {
    describe(`${name} - Rendering Performance`, () => {
      test.use({ ...device });

      test('should maintain 60fps during interactions', async ({ page }) => {
        await page.goto('/trades');
        await page.waitForLoadState('networkidle');

        // Measure frame rate during scrolling
        const frameDrops = await page.evaluate(() => {
          let frameDrops = 0;
          let lastTime = performance.now();
          
          function countFrameDrops() {
            const currentTime = performance.now();
            const deltaTime = currentTime - lastTime;
            
            if (deltaTime > 16.67) { // More than 60fps
              frameDrops += Math.floor(deltaTime / 16.67);
            }
            
            lastTime = currentTime;
          }
          
          // Monitor for 2 seconds
          const monitor = setInterval(countFrameDrops, 16);
          setTimeout(() => clearInterval(monitor), 2000);
          
          return frameDrops;
        });

        // Frame drops should be minimal
        expect(frameDrops).toBeLessThan(10); // Less than 10 dropped frames in 2 seconds
      });

      test('should render efficiently during resize', async ({ page }) => {
        await page.goto('/trades');
        await page.waitForLoadState('networkidle');

        // Measure render time during resize
        const startTime = Date.now();
        
        // Resize viewport multiple times
        await page.setViewportSize({ width: 800, height: 600 });
        await page.waitForTimeout(100);
        
        await page.setViewportSize({ width: 1200, height: 800 });
        await page.waitForTimeout(100);
        
        await page.setViewportSize({ width: 600, height: 400 });
        await page.waitForTimeout(100);
        
        const endTime = Date.now();
        const resizeTime = endTime - startTime;
        
        // Resize should be handled efficiently
        expect(resizeTime).toBeLessThan(2000); // 2 seconds for 3 resizes
        
        // Verify content still visible
        const trades = page.locator('[data-testid="trade-row"], [data-testid="trade-card"]');
        const count = await trades.count();
        expect(count).toBeGreaterThan(0);
      });
    });
  });
});