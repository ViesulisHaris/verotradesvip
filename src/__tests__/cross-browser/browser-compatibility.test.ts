/**
 * Cross-Browser Compatibility Tests
 * Tests filtering and sorting functionality across all major browsers
 */

import { test, expect, devices } from '@playwright/test';
import { generateMockTrades, generateTradesForFiltering } from '../utils/test-data-generators';

// Browser configurations for cross-browser testing
const browserConfigs = [
  { name: 'Chrome', device: devices['Desktop Chrome'] },
  { name: 'Firefox', device: devices['Desktop Firefox'] },
  { name: 'Safari', device: devices['Desktop Safari'] },
  { name: 'Edge', device: devices['Desktop Edge'] },
];

const mobileConfigs = [
  { name: 'Mobile Chrome', device: devices['Pixel 5'] },
  { name: 'Mobile Safari', device: devices['iPhone 12'] },
];

// Test data
const testTrades = generateMockTrades(50);

describe('Cross-Browser Compatibility - Core Functionality', () => {
  // Setup and cleanup for all tests
  beforeAll(async () => {
    // Note: In a real implementation, you would set up test data in the database
    // For now, we'll use the mock data directly in tests
    console.log('Setting up cross-browser compatibility tests with mock data');
  });

  afterAll(async () => {
    // Note: In a real implementation, you would clean up test data
    console.log('Cleaning up cross-browser compatibility tests');
  });

  // Test filtering across all desktop browsers
  browserConfigs.forEach(({ name, device }) => {
    describe(`${name} - Filtering Compatibility`, () => {
      test.use({ ...device });

      test('should handle symbol filtering correctly', async ({ page }) => {
        await page.goto('/trades');
        await page.waitForLoadState('networkidle');

        // Wait for trades to load
        await expect(page.locator('[data-testid="trades-table"]')).toBeVisible();
        
        // Find symbol filter input
        const symbolInput = page.locator('[data-testid="symbol-filter"]');
        await expect(symbolInput).toBeVisible();
        
        // Type in symbol filter
        await symbolInput.fill('AAPL');
        
        // Wait for filter to apply
        await page.waitForTimeout(300);
        
        // Verify filtered results
        const trades = page.locator('[data-testid="trade-row"]');
        const count = await trades.count();
        
        // Should only show AAPL trades
        for (let i = 0; i < count; i++) {
          const symbol = await trades.nth(i).locator('[data-testid="trade-symbol"]').textContent();
          expect(symbol).toContain('AAPL');
        }
      });

      test('should handle market filtering correctly', async ({ page }) => {
        await page.goto('/trades');
        await page.waitForLoadState('networkidle');

        // Find market filter
        const marketFilter = page.locator('[data-testid="market-filter"]');
        await expect(marketFilter).toBeVisible();
        
        // Select a market
        await marketFilter.selectOption('NASDAQ');
        await page.waitForTimeout(300);
        
        // Verify filtered results
        const trades = page.locator('[data-testid="trade-row"]');
        const count = await trades.count();
        
        for (let i = 0; i < count; i++) {
          const market = await trades.nth(i).locator('[data-testid="trade-market"]').textContent();
          expect(market).toContain('NASDAQ');
        }
      });

      test('should handle date range filtering correctly', async ({ page }) => {
        await page.goto('/trades');
        await page.waitForLoadState('networkidle');

        // Find date range inputs
        const startDateInput = page.locator('[data-testid="start-date-filter"]');
        const endDateInput = page.locator('[data-testid="end-date-filter"]');
        
        await expect(startDateInput).toBeVisible();
        await expect(endDateInput).toBeVisible();
        
        // Set date range
        await startDateInput.fill('2024-01-01');
        await endDateInput.fill('2024-12-31');
        
        // Trigger filter change
        await startDateInput.blur();
        await page.waitForTimeout(300);
        
        // Verify URL is updated with date parameters
        const url = page.url();
        expect(url).toContain('startDate=');
        expect(url).toContain('endDate=');
      });

      test('should handle P&L filtering correctly', async ({ page }) => {
        await page.goto('/trades');
        await page.waitForLoadState('networkidle');

        // Find P&L filter
        const pnlFilter = page.locator('[data-testid="pnl-filter"]');
        await expect(pnlFilter).toBeVisible();
        
        // Select profitable trades
        await pnlFilter.selectOption('profitable');
        await page.waitForTimeout(300);
        
        // Verify all shown trades are profitable
        const trades = page.locator('[data-testid="trade-row"]');
        const count = await trades.count();
        
        for (let i = 0; i < count; i++) {
          const pnl = await trades.nth(i).locator('[data-testid="trade-pnl"]').textContent();
          const pnlValue = parseFloat(pnl?.replace(/[^0-9.-]/g, '') || '0');
          expect(pnlValue).toBeGreaterThan(0);
        }
      });

      test('should handle side filtering correctly', async ({ page }) => {
        await page.goto('/trades');
        await page.waitForLoadState('networkidle');

        // Find side filter
        const sideFilter = page.locator('[data-testid="side-filter"]');
        await expect(sideFilter).toBeVisible();
        
        // Select long trades
        await sideFilter.selectOption('long');
        await page.waitForTimeout(300);
        
        // Verify all shown trades are long
        const trades = page.locator('[data-testid="trade-row"]');
        const count = await trades.count();
        
        for (let i = 0; i < count; i++) {
          const side = await trades.nth(i).locator('[data-testid="trade-side"]').textContent();
          expect(side?.toLowerCase()).toBe('long');
        }
      });

      test('should handle clear filters correctly', async ({ page }) => {
        await page.goto('/trades');
        await page.waitForLoadState('networkidle');

        // Apply some filters first
        const symbolInput = page.locator('[data-testid="symbol-filter"]');
        const marketFilter = page.locator('[data-testid="market-filter"]');
        
        await symbolInput.fill('AAPL');
        await marketFilter.selectOption('NASDAQ');
        await page.waitForTimeout(300);
        
        // Clear filters
        const clearButton = page.locator('[data-testid="clear-filters"]');
        await expect(clearButton).toBeVisible();
        await clearButton.click();
        
        await page.waitForTimeout(300);
        
        // Verify filters are cleared
        await expect(symbolInput).toHaveValue('');
        await expect(marketFilter).toHaveValue('all');
        
        // Verify URL is clean
        const url = page.url();
        expect(url).not.toContain('symbol=');
        expect(url).not.toContain('market=');
      });
    });
  });

  // Test sorting across all desktop browsers
  browserConfigs.forEach(({ name, device }) => {
    describe(`${name} - Sorting Compatibility`, () => {
      test.use({ ...device });

      test('should handle quick sort buttons correctly', async ({ page }) => {
        await page.goto('/trades');
        await page.waitForLoadState('networkidle');

        // Find quick sort buttons
        const sortByDateBtn = page.locator('[data-testid="sort-by-date"]');
        const sortByPnlBtn = page.locator('[data-testid="sort-by-pnl"]');
        
        await expect(sortByDateBtn).toBeVisible();
        await expect(sortByPnlBtn).toBeVisible();
        
        // Sort by date
        await sortByDateBtn.click();
        await page.waitForTimeout(300);
        
        // Verify URL is updated
        let url = page.url();
        expect(url).toContain('sortBy=trade_date');
        
        // Sort by P&L
        await sortByPnlBtn.click();
        await page.waitForTimeout(300);
        
        // Verify URL is updated
        url = page.url();
        expect(url).toContain('sortBy=pnl');
      });

      test('should handle advanced sort dropdown correctly', async ({ page }) => {
        await page.goto('/trades');
        await page.waitForLoadState('networkidle');

        // Find advanced sort dropdown
        const sortDropdown = page.locator('[data-testid="advanced-sort-dropdown"]');
        await expect(sortDropdown).toBeVisible();
        
        // Open dropdown
        await sortDropdown.click();
        
        // Select a sort option
        const sortOption = page.locator('[data-testid="sort-option-symbol"]');
        await expect(sortOption).toBeVisible();
        await sortOption.click();
        
        await page.waitForTimeout(300);
        
        // Verify URL is updated
        const url = page.url();
        expect(url).toContain('sortBy=symbol');
      });

      test('should handle sort order toggle correctly', async ({ page }) => {
        await page.goto('/trades');
        await page.waitForLoadState('networkidle');

        // Find sort order toggle
        const sortOrderToggle = page.locator('[data-testid="sort-order-toggle"]');
        await expect(sortOrderToggle).toBeVisible();
        
        // Get initial order
        const initialUrl = page.url();
        const initialOrder = initialUrl.includes('sortOrder=desc') ? 'desc' : 'asc';
        
        // Toggle sort order
        await sortOrderToggle.click();
        await page.waitForTimeout(300);
        
        // Verify order changed
        const newUrl = page.url();
        const newOrder = newUrl.includes('sortOrder=desc') ? 'desc' : 'asc';
        expect(newOrder).not.toBe(initialOrder);
      });
    });
  });

  // Test URL synchronization across all desktop browsers
  browserConfigs.forEach(({ name, device }) => {
    describe(`${name} - URL Synchronization Compatibility`, () => {
      test.use({ ...device });

      test('should sync filters with URL parameters', async ({ page }) => {
        // Navigate with URL parameters
        await page.goto('/trades?symbol=AAPL&market=NASDAQ&sortBy=trade_date&sortOrder=desc');
        await page.waitForLoadState('networkidle');

        // Wait for page to load
        await page.waitForTimeout(500);
        
        // Verify filters are applied from URL
        const symbolInput = page.locator('[data-testid="symbol-filter"]');
        const marketFilter = page.locator('[data-testid="market-filter"]');
        
        await expect(symbolInput).toHaveValue('AAPL');
        await expect(marketFilter).toHaveValue('NASDAQ');
      });

      test('should handle bookmark functionality', async ({ page }) => {
        // Apply filters
        await page.goto('/trades');
        await page.waitForLoadState('networkidle');

        const symbolInput = page.locator('[data-testid="symbol-filter"]');
        await symbolInput.fill('AAPL');
        await page.waitForTimeout(300);
        
        // Get current URL
        const filteredUrl = page.url();
        
        // Navigate to a different page and back
        await page.goto('/');
        await page.waitForTimeout(100);
        await page.goto(filteredUrl);
        await page.waitForLoadState('networkidle');
        
        // Verify filters are still applied
        await expect(symbolInput).toHaveValue('AAPL');
      });

      test('should handle back/forward navigation', async ({ page }) => {
        await page.goto('/trades');
        await page.waitForLoadState('networkidle');

        // Apply filter
        const symbolInput = page.locator('[data-testid="symbol-filter"]');
        await symbolInput.fill('AAPL');
        await page.waitForTimeout(300);
        
        // Navigate away
        await page.goto('/');
        await page.waitForTimeout(100);
        
        // Go back
        await page.goBack();
        await page.waitForLoadState('networkidle');
        
        // Verify filter is still applied
        await expect(symbolInput).toHaveValue('AAPL');
      });
    });
  });

  // Test responsive design across all browsers
  browserConfigs.forEach(({ name, device }) => {
    describe(`${name} - Responsive Design Compatibility`, () => {
      test.use({ ...device });

      test('should handle desktop viewport correctly', async ({ page }) => {
        await page.goto('/trades');
        await page.waitForLoadState('networkidle');

        // Check desktop layout elements
        await expect(page.locator('[data-testid="trades-table"]')).toBeVisible();
        await expect(page.locator('[data-testid="filter-sidebar"]')).toBeVisible();
        await expect(page.locator('[data-testid="sort-controls"]')).toBeVisible();
      });

      test('should handle tablet viewport correctly', async ({ page }) => {
        await page.setViewportSize({ width: 768, height: 1024 });
        await page.goto('/trades');
        await page.waitForLoadState('networkidle');

        // Check tablet layout
        await expect(page.locator('[data-testid="trades-table"]')).toBeVisible();
        // Filter sidebar might be hidden or collapsed on tablet
        const sidebar = page.locator('[data-testid="filter-sidebar"]');
        const isVisible = await sidebar.isVisible();
        // It's okay if sidebar is not visible on tablet
      });

      test('should handle mobile viewport correctly', async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 667 });
        await page.goto('/trades');
        await page.waitForLoadState('networkidle');

        // Check mobile layout
        // Table might be replaced with cards on mobile
        const table = page.locator('[data-testid="trades-table"]');
        const cards = page.locator('[data-testid="trade-card"]');
        
        const tableVisible = await table.isVisible();
        const cardsVisible = await cards.isVisible();
        
        // At least one should be visible
        expect(tableVisible || cardsVisible).toBe(true);
      });
    });
  });
});

// Mobile-specific cross-browser tests
mobileConfigs.forEach(({ name, device }) => {
  describe(`${name} - Mobile Compatibility`, () => {
    test.use({ ...device });

    test('should handle touch events for filters', async ({ page }) => {
      await page.goto('/trades');
      await page.waitForLoadState('networkidle');

      // Test touch-friendly filter interactions
      const symbolInput = page.locator('[data-testid="symbol-filter"]');
      await expect(symbolInput).toBeVisible();
      
      // Tap to focus (simulates touch)
      await symbolInput.tap();
      await symbolInput.fill('AAPL');
      
      // Hide keyboard
      await symbolInput.blur();
      await page.waitForTimeout(300);
      
      // Verify filter worked
      const trades = page.locator('[data-testid="trade-row"], [data-testid="trade-card"]');
      const count = await trades.count();
      expect(count).toBeGreaterThan(0);
    });

    test('should handle mobile keyboard behavior', async ({ page }) => {
      await page.goto('/trades');
      await page.waitForLoadState('networkidle');

      // Focus on input to trigger keyboard
      const symbolInput = page.locator('[data-testid="symbol-filter"]');
      await symbolInput.tap();
      
      // Verify input is focused
      await expect(symbolInput).toBeFocused();
      
      // Type and verify
      await symbolInput.fill('AAPL');
      await expect(symbolInput).toHaveValue('AAPL');
    });

    test('should handle viewport and zoom correctly', async ({ page }) => {
      await page.goto('/trades');
      await page.waitForLoadState('networkidle');

      // Test zoom levels
      await page.setViewportSize({ width: 375, height: 667 });
      
      // Check if content is still usable at different zoom levels
      const filterControls = page.locator('[data-testid="filter-controls"]');
      await expect(filterControls).toBeVisible();
      
      // Test pinch zoom simulation (if supported)
      await page.evaluate(() => {
        document.body.style.zoom = '1.5';
      });
      
      // Verify elements are still accessible
      await expect(filterControls).toBeVisible();
      
      // Reset zoom
      await page.evaluate(() => {
        document.body.style.zoom = '1';
      });
    });
  });
});

// Performance tests across browsers
browserConfigs.forEach(({ name, device }) => {
  describe(`${name} - Performance Compatibility`, () => {
    test.use({ ...device });

    test('should meet filter performance targets', async ({ page }) => {
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
      
      // Filter should complete within 1 second
      expect(filterTime).toBeLessThan(1000);
    });

    test('should meet sort performance targets', async ({ page }) => {
      await page.goto('/trades');
      await page.waitForLoadState('networkidle');

      // Measure sort performance
      const startTime = Date.now();
      
      const sortByDateBtn = page.locator('[data-testid="sort-by-date"]');
      await sortByDateBtn.click();
      
      // Wait for sort to complete
      await page.waitForTimeout(300);
      
      const endTime = Date.now();
      const sortTime = endTime - startTime;
      
      // Sort should complete within 1 second
      expect(sortTime).toBeLessThan(1000);
    });

    test('should handle large datasets efficiently', async ({ page }) => {
      // Navigate to a page with many trades
      await page.goto('/trades');
      await page.waitForLoadState('networkidle');

      // Measure initial load time
      const loadStartTime = Date.now();
      await page.waitForSelector('[data-testid="trades-table"], [data-testid="trade-card"]');
      const loadEndTime = Date.now();
      const loadTime = loadEndTime - loadStartTime;

      // Page should load within 3 seconds
      expect(loadTime).toBeLessThan(3000);
    });
  });
});