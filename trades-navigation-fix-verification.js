/**
 * Trades Tab Navigation Fix Verification
 * 
 * This script tests the implemented fixes for the Trades tab freezing issue:
 * 1. Debug panel z-index fixes
 * 2. Modal overlay cleanup enhancements
 * 3. Navigation safety improvements
 */

const puppeteer = require('puppeteer');
const path = require('path');

// Test configuration
const BASE_URL = 'http://localhost:3000';
const TEST_TIMEOUT = 30000; // 30 seconds
const NAVIGATION_DELAY = 2000; // 2 seconds between navigation attempts

// Test results tracking
const testResults = {
  debugPanelFixes: { passed: 0, failed: 0, details: [] },
  modalCleanupFixes: { passed: 0, failed: 0, details: [] },
  navigationSafetyFixes: { passed: 0, failed: 0, details: [] },
  overall: { passed: 0, failed: 0, total: 0 }
};

// Utility functions
function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : type === 'warning' ? '⚠️' : 'ℹ️';
  console.log(`${prefix} [${timestamp}] ${message}`);
}

function recordResult(category, passed, details) {
  testResults[category][passed ? 'passed' : 'failed']++;
  testResults[category].details.push({ passed, details, timestamp: new Date().toISOString() });
  testResults.overall[passed ? 'passed' : 'failed']++;
  testResults.overall.total++;
}

async function waitForNavigation(page, url) {
  try {
    await Promise.race([
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: TEST_TIMEOUT }),
      page.goto(url, { waitUntil: 'networkidle2', timeout: TEST_TIMEOUT })
    ]);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for page to settle
    return true;
  } catch (error) {
    log(`Navigation failed: ${error.message}`, 'error');
    return false;
  }
}

async function loginIfNeeded(page) {
  try {
    // Check if already logged in
    const currentUrl = page.url();
    if (!currentUrl.includes('/login')) {
      log('Already logged in or login not required');
      return true;
    }

    log('Attempting to login...');
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2' });
    
    // Fill login form (adjust selectors as needed)
    await page.waitForSelector('input[type="email"]', { timeout: 5000 });
    await page.type('input[type="email"]', 'test@example.com');
    await page.type('input[type="password"]', 'testpassword123');
    
    // Click login button
    await page.click('button[type="submit"]');
    
    // Wait for navigation after login
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: TEST_TIMEOUT });
    
    log('Login successful');
    return true;
  } catch (error) {
    log(`Login failed: ${error.message}`, 'error');
    return false;
  }
}

// Test 1: Debug Panel Z-Index Fixes
async function testDebugPanelFixes(page) {
  log('Testing Debug Panel Z-Index Fixes...');
  
  try {
    // Navigate to Trades page
    const navigated = await waitForNavigation(page, `${BASE_URL}/trades`);
    if (!navigated) {
      recordResult('debugPanelFixes', false, 'Failed to navigate to Trades page');
      return;
    }
    
    // Check for debug panel presence and z-index
    const debugPanel = await page.$('.zoom-debug-panel');
    if (debugPanel) {
      const zIndex = await page.evaluate(el => {
        return window.getComputedStyle(el).zIndex;
      }, debugPanel);
      
      const pointerEvents = await page.evaluate(el => {
        return window.getComputedStyle(el).pointerEvents;
      }, debugPanel);
      
      const position = await page.evaluate(el => {
        const style = window.getComputedStyle(el);
        return {
          position: style.position,
          bottom: style.bottom,
          left: style.left
        };
      }, debugPanel);
      
      // Verify z-index is low (should be 5 or less)
      const zIndexLow = parseInt(zIndex) <= 5;
      recordResult('debugPanelFixes', zIndexLow, 
        `Debug panel z-index: ${zIndex} (should be ≤ 5)`);
      
      // Verify pointer-events is none
      const pointerEventsNone = pointerEvents === 'none';
      recordResult('debugPanelFixes', pointerEventsNone,
        `Debug panel pointer-events: ${pointerEvents} (should be 'none')`);
      
      // Verify position is fixed and moved higher
      const positionCorrect = position.position === 'fixed' && 
                           parseInt(position.bottom) >= 60; // Should be at least 60px from bottom
      recordResult('debugPanelFixes', positionCorrect,
        `Debug panel position: ${JSON.stringify(position)} (bottom should be ≥ 60px)`);
      
      log('Debug panel z-index fixes verified', 'success');
    } else {
      recordResult('debugPanelFixes', true, 'Debug panel not found (may be production mode)');
    }
    
  } catch (error) {
    recordResult('debugPanelFixes', false, `Error testing debug panel: ${error.message}`);
    log(`Debug panel test error: ${error.message}`, 'error');
  }
}

// Test 2: Modal Overlay Cleanup
async function testModalCleanupFixes(page) {
  log('Testing Modal Overlay Cleanup Fixes...');
  
  try {
    // Navigate to Trades page
    const navigated = await waitForNavigation(page, `${BASE_URL}/trades`);
    if (!navigated) {
      recordResult('modalCleanupFixes', false, 'Failed to navigate to Trades page');
      return;
    }
    
    // Check for modal cleanup function
    const cleanupFunctionExists = await page.evaluate(() => {
      return typeof window.cleanupModalOverlays === 'function';
    });
    
    recordResult('modalCleanupFixes', cleanupFunctionExists,
      'Modal cleanup function available globally');
    
    // Test navigation safety functions
    const navigationSafetyExists = await page.evaluate(() => {
      return !!(window.navigationSafety) &&
               typeof window.navigationSafety.forceCleanupNavigationBlockers === 'function';
    });
    
    recordResult('modalCleanupFixes', navigationSafetyExists,
      'Navigation safety functions available');
    
    // Test actual cleanup by trying to navigate away and back
    log('Testing navigation with cleanup...');
    
    // Try to navigate to Dashboard
    const dashboardLink = await page.$('a[href="/dashboard"]');
    if (dashboardLink) {
      // Check if link is clickable
      const isClickable = await page.evaluate(el => {
        const style = window.getComputedStyle(el);
        const rect = el.getBoundingClientRect();
        return style.pointerEvents !== 'none' && 
               rect.width > 0 && rect.height > 0;
      }, dashboardLink);
      
      recordResult('modalCleanupFixes', isClickable,
        'Dashboard navigation link is clickable');
      
      // Test actual navigation
      const beforeNavUrl = page.url();
      await dashboardLink.click();
      await new Promise(resolve => setTimeout(resolve, NAVIGATION_DELAY));
      
      const afterNavUrl = page.url();
      const navigationSuccessful = afterNavUrl !== beforeNavUrl && afterNavUrl.includes('/dashboard');
      
      recordResult('modalCleanupFixes', navigationSuccessful,
        `Navigation to dashboard successful: ${navigationSuccessful}`);
      
      // Navigate back to trades
      await waitForNavigation(page, `${BASE_URL}/trades`);
    } else {
      recordResult('modalCleanupFixes', false, 'Dashboard navigation link not found');
    }
    
    log('Modal overlay cleanup fixes verified', 'success');
    
  } catch (error) {
    recordResult('modalCleanupFixes', false, `Error testing modal cleanup: ${error.message}`);
    log(`Modal cleanup test error: ${error.message}`, 'error');
  }
}

// Test 3: Navigation Safety
async function testNavigationSafetyFixes(page) {
  log('Testing Navigation Safety Fixes...');
  
  try {
    // Navigate to Trades page
    const navigated = await waitForNavigation(page, `${BASE_URL}/trades`);
    if (!navigated) {
      recordResult('navigationSafetyFixes', false, 'Failed to navigate to Trades page');
      return;
    }
    
    // Test multiple navigation attempts
    const navigationTests = [
      { href: '/dashboard', name: 'Dashboard' },
      { href: '/strategies', name: 'Strategies' },
      { href: '/calendar', name: 'Calendar' },
      { href: '/log-trade', name: 'Log Trade' }
    ];
    
    for (const test of navigationTests) {
      log(`Testing navigation to ${test.name}...`);
      
      // Find navigation link
      const navLink = await page.$(`a[href="${test.href}"]`);
      if (navLink) {
        // Check if link is visible and clickable
        const isVisible = await page.evaluate(el => {
          const style = window.getComputedStyle(el);
          const rect = el.getBoundingClientRect();
          return style.visibility !== 'hidden' && 
                 style.display !== 'none' && 
                 rect.width > 0 && rect.height > 0;
        }, navLink);
        
        const isClickable = await page.evaluate(el => {
          const style = window.getComputedStyle(el);
          return style.pointerEvents !== 'none';
        }, navLink);
        
        recordResult('navigationSafetyFixes', isVisible,
          `${test.name} link is visible`);
        
        recordResult('navigationSafetyFixes', isClickable,
          `${test.name} link is clickable`);
        
        // Test actual navigation
        if (isVisible && isClickable) {
          const beforeUrl = page.url();
          await navLink.click();
          await new Promise(resolve => setTimeout(resolve, NAVIGATION_DELAY));
          
          const afterUrl = page.url();
          const navigationWorked = afterUrl !== beforeUrl && afterUrl.includes(test.href);
          
          recordResult('navigationSafetyFixes', navigationWorked,
            `Navigation to ${test.name} successful: ${navigationWorked}`);
          
          // Navigate back to trades for next test
          if (navigationWorked) {
            await waitForNavigation(page, `${BASE_URL}/trades`);
          }
        }
      } else {
        recordResult('navigationSafetyFixes', false, `${test.name} navigation link not found`);
      }
    }
    
    // Test for overlay elements that might block navigation
    const blockingOverlays = await page.evaluate(() => {
      const overlays = document.querySelectorAll('.fixed.inset-0, .modal-backdrop, [role="dialog"]');
      return Array.from(overlays).filter(el => {
        const style = window.getComputedStyle(el);
        const zIndex = parseInt(style.zIndex) || 0;
        const rect = el.getBoundingClientRect();
        return zIndex > 50 && rect.width > window.innerWidth * 0.8 && rect.height > window.innerHeight * 0.8;
      });
    });
    
    const noBlockingOverlays = blockingOverlays.length === 0;
    recordResult('navigationSafetyFixes', noBlockingOverlays,
      `No blocking overlays found: ${noBlockingOverlays} (found ${blockingOverlays.length})`);
    
    log('Navigation safety fixes verified', 'success');
    
  } catch (error) {
    recordResult('navigationSafetyFixes', false, `Error testing navigation safety: ${error.message}`);
    log(`Navigation safety test error: ${error.message}`, 'error');
  }
}

// Test 4: Responsive Behavior
async function testResponsiveBehavior(page) {
  log('Testing Responsive Behavior...');
  
  try {
    const viewports = [
      { width: 1920, height: 1080, name: 'Desktop' },
      { width: 768, height: 1024, name: 'Tablet' },
      { width: 375, height: 667, name: 'Mobile' }
    ];
    
    for (const viewport of viewports) {
      log(`Testing ${viewport.name} viewport (${viewport.width}x${viewport.height})...`);
      
      await page.setViewport({
        width: viewport.width,
        height: viewport.height,
        deviceScaleFactor: 1,
        isMobile: viewport.width < 768,
        hasTouch: viewport.width < 768
      });
      
      await waitForNavigation(page, `${BASE_URL}/trades`);
      
      // Test navigation links in this viewport
      const navLinks = await page.$$('nav a, [role="navigation"] a');
      let clickableLinks = 0;
      
      for (const link of navLinks) {
        const isClickable = await page.evaluate(el => {
          const style = window.getComputedStyle(el);
          const rect = el.getBoundingClientRect();
          return style.pointerEvents !== 'none' && 
                 rect.width > 0 && rect.height > 0 &&
                 style.visibility !== 'hidden';
        }, link);
        
        if (isClickable) clickableLinks++;
      }
      
      const hasClickableLinks = clickableLinks > 0;
      recordResult('navigationSafetyFixes', hasClickableLinks,
        `${viewport.name}: ${clickableLinks} clickable navigation links`);
      
      // Test debug panel behavior if present
      const debugPanel = await page.$('.zoom-debug-panel');
      if (debugPanel) {
        const zIndex = await page.evaluate(el => {
          return window.getComputedStyle(el).zIndex;
        }, debugPanel);
        
        const zIndexSafe = parseInt(zIndex) <= 5;
        recordResult('debugPanelFixes', zIndexSafe,
          `${viewport.name}: Debug panel z-index safe: ${zIndex}`);
      }
    }
    
    log('Responsive behavior verified', 'success');
    
  } catch (error) {
    recordResult('navigationSafetyFixes', false, `Error testing responsive behavior: ${error.message}`);
    log(`Responsive test error: ${error.message}`, 'error');
  }
}

// Main test function
async function runTests() {
  log('Starting Trades Tab Navigation Fix Verification...');
  
  const browser = await puppeteer.launch({
    headless: false, // Set to true for headless mode
    defaultViewport: { width: 1920, height: 1080 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  try {
    // Enable console logging from the page
    page.on('console', msg => {
      if (msg.type() === 'error') {
        log(`Browser console error: ${msg.text()}`, 'error');
      } else if (msg.text().includes('Navigation Safety') || 
                 msg.text().includes('TradesPage') ||
                 msg.text().includes('NAVIGATION DEBUG')) {
        log(`Browser console: ${msg.text()}`);
      }
    });
    
    // Login if needed
    const loginSuccess = await loginIfNeeded(page);
    if (!loginSuccess) {
      log('Login failed, continuing with tests anyway...', 'warning');
    }
    
    // Run all tests
    await testDebugPanelFixes(page);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await testModalCleanupFixes(page);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await testNavigationSafetyFixes(page);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await testResponsiveBehavior(page);
    
  } catch (error) {
    log(`Test execution error: ${error.message}`, 'error');
  } finally {
    await browser.close();
  }
  
  // Generate final report
  generateReport();
}

// Generate final report
function generateReport() {
  log('\n' + '='.repeat(80));
  log('TRADES TAB NAVIGATION FIX VERIFICATION REPORT');
  log('='.repeat(80));
  
  const categories = ['debugPanelFixes', 'modalCleanupFixes', 'navigationSafetyFixes'];
  
  for (const category of categories) {
    const results = testResults[category];
    const categoryName = category.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
    
    log(`\n${categoryName}:`);
    log(`  Passed: ${results.passed}`);
    log(`  Failed: ${results.failed}`);
    log(`  Total:  ${results.passed + results.failed}`);
    
    if (results.details.length > 0) {
      log('  Details:');
      results.details.forEach(detail => {
        const status = detail.passed ? '✅' : '❌';
        log(`    ${status} ${detail.details}`);
      });
    }
  }
  
  log(`\nOVERALL RESULTS:`);
  log(`  Total Tests: ${testResults.overall.total}`);
  log(`  Passed: ${testResults.overall.passed}`);
  log(`  Failed: ${testResults.overall.failed}`);
  log(`  Success Rate: ${((testResults.overall.passed / testResults.overall.total) * 100).toFixed(1)}%`);
  
  const allPassed = testResults.overall.failed === 0;
  log(`\nCONCLUSION: ${allPassed ? '✅ ALL FIXES VERIFIED - Trades tab navigation issue has been resolved' : '❌ SOME ISSUES REMAIN - Further investigation needed'}`);
  
  // Save report to file
  const reportData = {
    timestamp: new Date().toISOString(),
    summary: testResults,
    conclusion: allPassed ? 'ALL FIXES VERIFIED - Trades tab navigation issue has been resolved' : 'SOME ISSUES REMAIN - Further investigation needed'
  };
  
  const fs = require('fs');
  fs.writeFileSync(
    path.join(__dirname, 'trades-navigation-fix-verification-report.json'),
    JSON.stringify(reportData, null, 2)
  );
  
  log('\nReport saved to: trades-navigation-fix-verification-report.json');
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().catch(error => {
    log(`Test execution failed: ${error.message}`, 'error');
    process.exit(1);
  });
}

module.exports = {
  runTests,
  testDebugPanelFixes,
  testModalCleanupFixes,
  testNavigationSafetyFixes,
  testResponsiveBehavior
};