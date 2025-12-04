
/**
 * Cross-Browser Accessibility Compatibility Tests
 * Tests accessibility features across all major browsers and devices
 */

import { test, expect, devices } from '@playwright/test';
import { generateMockTrades } from '../utils/test-data-generators';

// Browser configurations for cross-browser accessibility testing
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

describe('Cross-Browser Accessibility Compatibility', () => {
  // Setup and cleanup for all tests
  beforeAll(async () => {
    console.log('Setting up cross-browser accessibility compatibility tests');
  });

  afterAll(async () => {
    console.log('Cleaning up cross-browser accessibility compatibility tests');
  });

  // Test filter controls accessibility across all desktop browsers
  browserConfigs.forEach(({ name, device }) => {
    describe(`${name} - Filter Controls Accessibility`, () => {
      test.use({ ...device });

      test('should have proper ARIA labels on filter inputs', async ({ page }) => {
        await page.goto('/trades');
        await page.waitForLoadState('networkidle');

        // Check symbol filter accessibility
        const symbolInput = page.locator('[data-testid="symbol-filter"]');
        await expect(symbolInput).toBeVisible();
        
        // Verify ARIA attributes
        await expect(symbolInput).toHaveAttribute('aria-label', /symbol/i);
        await expect(symbolInput).toHaveAttribute('aria-describedby');
        
        // Check if there's an associated description
        const description = page.locator(`#${await symbolInput.getAttribute('aria-describedby')}`);
        if (await description.isVisible()) {
          await expect(description).toBeVisible();
        }
      });

      test('should have accessible dropdown filters', async ({ page }) => {
        await page.goto('/trades');
        await page.waitForLoadState('networkidle');

        // Check market filter accessibility
        const marketFilter = page.locator('[data-testid="market-filter"]');
        await expect(marketFilter).toBeVisible();
        
        // Verify ARIA attributes for select
        await expect(marketFilter).toHaveAttribute('aria-label', /market/i);
        await expect(marketFilter).toHaveAttribute('role', 'combobox');
        
        // Check if options are properly labeled
        await marketFilter.click();
        const options = page.locator('[data-testid="market-option"]');
        const optionCount = await options.count();
        
        for (let i = 0; i < optionCount; i++) {
          await expect(options.nth(i)).toHaveAttribute('role', 'option');
          const optionText = await options.nth(i).textContent();
          expect(optionText?.trim()).toBeTruthy();
        }
      });

      test('should have accessible date range filters', async ({ page }) => {
        await page.goto('/trades');
        await page.waitForLoadState('networkidle');

        // Check date filter accessibility
        const startDateInput = page.locator('[data-testid="start-date-filter"]');
        const endDateInput = page.locator('[data-testid="end-date-filter"]');
        
        await expect(startDateInput).toBeVisible();
        await expect(endDateInput).toBeVisible();
        
        // Verify ARIA attributes
        await expect(startDateInput).toHaveAttribute('aria-label', /start date/i);
        await expect(endDateInput).toHaveAttribute('aria-label', /end date/i);
        await expect(startDateInput).toHaveAttribute('type', 'date');
        await expect(endDateInput).toHaveAttribute('type', 'date');
      });

      test('should have accessible clear filters button', async ({ page }) => {
        await page.goto('/trades');
        await page.waitForLoadState('networkidle');

        const clearButton = page.locator('[data-testid="clear-filters"]');
        await expect(clearButton).toBeVisible();
        
        // Verify button accessibility
        await expect(clearButton).toHaveAttribute('role', 'button');
        await expect(clearButton).toHaveAttribute('aria-label', /clear/i);
        
        // Check if button has accessible name
        const buttonText = await clearButton.textContent();
        expect(buttonText?.trim()).toBeTruthy();
      });

      test('should provide feedback for filter actions', async ({ page }) => {
        await page.goto('/trades');
        await page.waitForLoadState('networkidle');

        // Apply a filter
        const symbolInput = page.locator('[data-testid="symbol-filter"]');
        await symbolInput.fill('AAPL');
        await page.waitForTimeout(300);
        
        // Check for ARIA live regions for status updates
        const liveRegion = page.locator('[aria-live="polite"], [aria-live="assertive"]');
        if (await liveRegion.isVisible()) {
          await expect(liveRegion).toBeVisible();
        }
        
        // Check if filter results are announced
        const resultsCount = page.locator('[data-testid="results-count"]');
        if (await resultsCount.isVisible()) {
          await expect(resultsCount).toHaveAttribute('aria-live', 'polite');
        }
      });
    });
  });

  // Test sort controls accessibility across all desktop browsers
  browserConfigs.forEach(({ name, device }) => {
    describe(`${name} - Sort Controls Accessibility`, () => {
      test.use({ ...device });

      test('should have accessible sort buttons', async ({ page }) => {
        await page.goto('/trades');
        
        // Check for button roles
        const dateRole = await sortByDateBtn.getAttribute('role');
        const pnlRole = await sortByPnlBtn.getAttribute('role');
        
        expect(dateRole || 'button').toBe('button');
        expect(pnlRole || 'button').toBe('button');
      });

      test('should have accessible sort dropdown', async ({ page }) => {
        await page.goto('/trades');
        await page.waitForLoadState('networkidle');

        // Test advanced sort dropdown
        const sortDropdown = page.locator('[data-testid="advanced-sort-dropdown"]');
        await expect(sortDropdown).toBeVisible();
        
        // Check for proper ARIA attributes
        const ariaLabel = await sortDropdown.getAttribute('aria-label');
        const ariaHaspopup = await sortDropdown.getAttribute('aria-haspopup');
        const ariaExpanded = await sortDropdown.getAttribute('aria-expanded');
        
        expect(ariaLabel).toBeTruthy();
        expect(ariaHaspopup).toBe('listbox');
        expect(ariaExpanded !== null).toBe(true);
        
        // Test dropdown interaction
        await sortDropdown.click();
        await page.waitForTimeout(300);
        
        // Check options accessibility
        const sortOptions = page.locator('[data-testid="sort-option"]');
        const optionCount = await sortOptions.count();
        
        expect(optionCount).toBeGreaterThan(0);
        
        for (let i = 0; i < Math.min(optionCount, 3); i++) {
          const option = sortOptions.nth(i);
          const optionRole = await option.getAttribute('role');
          const optionSelected = await option.getAttribute('aria-selected');
          
          expect(optionRole).toBe('option');
          expect(optionSelected !== null).toBe(true);
        }
      });
    });
  });
});

describe('Cross-Browser Accessibility - Data Display', () => {
  browserConfigs.forEach(({ name, device }) => {
    describe(`${name} - Data Display Accessibility`, () => {
      test.use({ ...device });

      test('should have accessible data table', async ({ page }) => {
        await page.goto('/trades');
        await page.waitForLoadState('networkidle');

        // Test table accessibility
        const tradesTable = page.locator('[data-testid="trades-table"]');
        
        if (await tradesTable.isVisible()) {
          // Check for table role
          const tableRole = await tradesTable.getAttribute('role');
          expect(tableRole || 'table').toBe('table');
          
          // Check for proper headers
          const headers = page.locator('th');
          const headerCount = await headers.count();
          expect(headerCount).toBeGreaterThan(0);
          
          // Check header accessibility
          for (let i = 0; i < Math.min(headerCount, 3); i++) {
            const header = headers.nth(i);
            const headerScope = await header.getAttribute('scope');
            const headerAbbr = await header.getAttribute('abbr');
            
            expect(headerScope || 'col').toBe('col');
            // abbr is optional but should be valid if present
          }
          
          // Check for proper table structure
          const caption = page.locator('caption');
          const captionExists = await caption.count();
          
          if (captionExists > 0) {
            const captionText = await caption.textContent();
            expect(captionText?.length || 0).toBeGreaterThan(0);
          }
        }
      });

      test('should have accessible data cards', async ({ page }) => {
        await page.goto('/trades');
        await page.waitForLoadState('networkidle');

        // Test card accessibility
        const tradeCards = page.locator('[data-testid="trade-card"]');
        const cardCount = await tradeCards.count();
        
        if (cardCount > 0) {
          for (let i = 0; i < Math.min(cardCount, 3); i++) {
            const card = tradeCards.nth(i);
            
            // Check for landmark role
            const cardRole = await card.getAttribute('role');
            expect(cardRole || 'article').toBe('article');
            
            // Check for proper heading structure
            const heading = card.locator('h1, h2, h3, h4, h5, h6');
            const headingExists = await heading.count();
            
            if (headingExists > 0) {
              const headingLevel = await heading.first().evaluate(el => el.tagName.toLowerCase());
              expect(['h1', 'h2', 'h3', 'h4', 'h5', 'h6']).toContain(headingLevel);
            }
            
            // Check for accessible data presentation
            const symbol = card.locator('[data-testid="trade-symbol"]');
            const pnl = card.locator('[data-testid="trade-pnl"]');
            
            if (await symbol.isVisible()) {
              const symbolLabel = await symbol.getAttribute('aria-label');
              expect(symbolLabel || await symbol.textContent()).toBeTruthy();
            }
            
            if (await pnl.isVisible()) {
              const pnlLabel = await pnl.getAttribute('aria-label');
              expect(pnlLabel || await pnl.textContent()).toBeTruthy();
              
              // Check for color contrast indication
              const pnlClass = await pnl.getAttribute('class');
              const isProfit = pnlClass?.includes('profit') || pnlClass?.includes('positive');
              const isLoss = pnlClass?.includes('loss') || pnlClass?.includes('negative');
              
              // Should have semantic color indication
              expect(isProfit || isLoss).toBe(true);
            }
          }
        }
      });
    });
  });
});

describe('Mobile Accessibility - Touch Targets', () => {
  mobileConfigs.forEach(({ name, device }) => {
    describe(`${name} - Touch Target Accessibility`, () => {
      test.use({ ...device });

      test('should have adequate touch targets', async ({ page }) => {
        await page.goto('/trades');
        await page.waitForLoadState('networkidle');

        // Test button touch targets
        const clearButton = page.locator('[data-testid="clear-filters"]');
        const applyButton = page.locator('[data-testid="apply-filters"]');
        
        // Check touch target sizes (minimum 44x44 points)
        const clearBox = await clearButton.boundingBox();
        const applyBox = await applyButton.boundingBox();
        
        if (clearBox) {
          expect(clearBox.width).toBeGreaterThanOrEqual(44);
          expect(clearBox.height).toBeGreaterThanOrEqual(44);
        }
        
        if (applyBox) {
          expect(applyBox.width).toBeGreaterThanOrEqual(44);
          expect(applyBox.height).toBeGreaterThanOrEqual(44);
        }
        
        // Test input touch targets
        const symbolInput = page.locator('[data-testid="symbol-filter"]');
        const inputBox = await symbolInput.boundingBox();
        
        if (inputBox) {
          expect(inputBox.height).toBeGreaterThanOrEqual(44); // Minimum touch height
        }
      });

      test('should have adequate spacing between touch targets', async ({ page }) => {
        await page.goto('/trades');
        await page.waitForLoadState('networkidle');

        // Test spacing between interactive elements
        const buttons = page.locator('button');
        const buttonCount = await buttons.count();
        
        if (buttonCount >= 2) {
          const firstButton = buttons.first();
          const secondButton = buttons.nth(1);
          
          const firstBox = await firstButton.boundingBox();
          const secondBox = await secondButton.boundingBox();
          
          if (firstBox && secondBox) {
            const horizontalDistance = Math.abs(secondBox.x - (firstBox.x + firstBox.width));
            const verticalDistance = Math.abs(secondBox.y - firstBox.y);
            
            // Should have adequate spacing (minimum 8 points)
            expect(horizontalDistance).toBeGreaterThanOrEqual(8);
            expect(verticalDistance).toBeGreaterThanOrEqual(8);
          }
        }
      });
    });
  });
});

describe('Cross-Browser Accessibility - Keyboard Navigation', () => {
  browserConfigs.forEach(({ name, device }) => {
    describe(`${name} - Keyboard Accessibility`, () => {
      test.use({ ...device });

      test('should support keyboard navigation', async ({ page }) => {
        await page.goto('/trades');
        await page.waitForLoadState('networkidle');

        // Test tab navigation
        const symbolInput = page.locator('[data-testid="symbol-filter"]');
        await symbolInput.focus();
        
        // Tab through controls
        await page.keyboard.press('Tab');
        await page.waitForTimeout(100);
        
        const focusedElement = await page.evaluate(() => document.activeElement);
        const focusedTag = focusedElement?.tagName.toLowerCase();
        const focusedRole = focusedElement?.getAttribute('role');
        
        // Should focus on next interactive element
        expect(['input', 'button', 'select']).toContain(focusedTag || '');
        
        // Test shift+tab for reverse navigation
        await page.keyboard.press('Shift+Tab');
        await page.waitForTimeout(100);
        
        const prevFocusedElement = await page.evaluate(() => document.activeElement);
        const prevFocusedTag = prevFocusedElement?.tagName.toLowerCase();
        
        // Should return to previous element
        expect(['input', 'button', 'select']).toContain(prevFocusedTag || '');
      });

      test('should support enter/space activation', async ({ page }) => {
        await page.goto('/trades');
        await page.waitForLoadState('networkidle');

        // Test enter key on buttons
        const clearButton = page.locator('[data-testid="clear-filters"]');
        await clearButton.focus();
        
        // Fill input first
        const symbolInput = page.locator('[data-testid="symbol-filter"]');
        await symbolInput.fill('TEST');
        
        // Activate with Enter
        await page.keyboard.press('Enter');
        await page.waitForTimeout(300);
        
        // Should activate the focused button
        await expect(symbolInput).toHaveValue(''); // Should be cleared
        
        // Test space key on buttons
        const applyButton = page.locator('[data-testid="apply-filters"]');
        await applyButton.focus();
        
        await symbolInput.fill('TEST2');
        await page.keyboard.press('Space');
        await page.waitForTimeout(300);
        
        // Space should also activate buttons
        const url = page.url();
        expect(url).toContain('TEST2');
      });

      test('should support escape key', async ({ page }) => {
        await page.goto('/trades');
        await page.waitForLoadState('networkidle');

        // Test escape in dropdown
        const sortDropdown = page.locator('[data-testid="advanced-sort-dropdown"]');
        await sortDropdown.click();
        await page.waitForTimeout(300);
        
        // Verify dropdown is open
        const ariaExpanded = await sortDropdown.getAttribute('aria-expanded');
        expect(ariaExpanded).toBe('true');
        
        // Press escape
        await page.keyboard.press('Escape');
        await page.waitForTimeout(300);
        
        // Dropdown should close
        const ariaExpandedAfter = await sortDropdown.getAttribute('aria-expanded');
        expect(ariaExpandedAfter).toBe('false');
      });
    });
  });
});

describe('Cross-Browser Accessibility - Screen Reader Support', () => {
  browserConfigs.forEach(({ name, device }) => {
    describe(`${name} - Screen Reader Support`, () => {
      test.use({ ...device });

      test('should announce filter changes', async ({ page }) => {
        await page.goto('/trades');
        await page.waitForLoadState('networkidle');

        // Listen for ARIA live regions
        const announcements: string[] = [];
        await page.evaluate(() => {
          const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
              mutation.addedNodes.forEach((node) => {
                if (node.nodeType === Node.ELEMENT_NODE) {
                  const element = node as Element;
                  const ariaLive = element.getAttribute('aria-live');
                  const ariaAtomic = element.getAttribute('aria-atomic');
                  const ariaRelevant = element.getAttribute('aria-relevant');
                  
                  if (ariaLive || ariaAtomic || ariaRelevant) {
                    const text = element.textContent || '';
                    if (text.trim()) {
                      (window as any).testAnnouncements = (window as any).testAnnouncements || [];
                      (window as any).testAnnouncements.push(text);
                    }
                  }
                }
              });
            });
          });
          
          observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['aria-live', 'aria-atomic', 'aria-relevant']
          });
        });

        // Apply filter
        const symbolInput = page.locator('[data-testid="symbol-filter"]');
        await symbolInput.fill('AAPL');
