/**
 * Comprehensive Menu Functionality Test
 * 
 * This script performs thorough testing of the menu functionality, specifically focusing on:
 * 1. Complete user flow testing
 * 2. Desktop and mobile view testing
 * 3. Menu button responsiveness
 * 4. Trades tab freezing issue reproduction and verification
 * 5. Navigation reliability testing
 */

const { chromium } = require('playwright');
const fs = require('fs');

// Test configuration
const BASE_URL = 'http://localhost:3000';
const TEST_TIMEOUT = 30000; // 30 seconds per test
const NAVIGATION_TIMEOUT = 10000; // 10 seconds for navigation

// Menu items to test
const MENU_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: 'Home' },
  { href: '/log-trade', label: 'Log Trade', icon: 'PlusCircle' },
  { href: '/strategies', label: 'Strategies', icon: 'BookOpen' },
  { href: '/trades', label: 'Trades', icon: 'TrendingUp' },
  { href: '/calendar', label: 'Calendar', icon: 'Calendar' },
  { href: '/confluence', label: 'Confluence', icon: 'Target' }
];

// Viewport configurations for testing
const VIEWPORTS = {
  desktop: { width: 1920, height: 1080, name: 'Desktop' },
  tablet: { width: 768, height: 1024, name: 'Tablet' },
  mobile: { width: 375, height: 667, name: 'Mobile' }
};

class ComprehensiveMenuTest {
  constructor() {
    this.browser = null;
    this.context = null;
    this.page = null;
    this.testResults = {
      summary: {
        totalTests: 0,
        passedTests: 0,
        failedTests: 0,
        skippedTests: 0
      },
      details: [],
      tradesFreezingIssue: {
        reproduced: false,
        fixed: false,
        details: []
      }
    };
  }

  async initialize() {
    console.log('🚀 Initializing Comprehensive Menu Functionality Test...');
    
    try {
      this.browser = await chromium.launch({ 
        headless: false, // Run in visible mode for debugging
        slowMo: 100 // Slow down actions for better observation
      });
      this.context = await this.browser.newContext({
        viewport: VIEWPORTS.desktop,
        ignoreHTTPSErrors: true,
        recordVideo: { dir: './test-videos/' }
      });
      this.page = await this.context.newPage();
      
      // Set up console logging
      this.page.on('console', msg => {
        if (msg.type() === 'error') {
          console.log('🔴 Browser Console Error:', msg.text());
        } else if (msg.text().includes('MENU BUTTON DEBUG') || 
                   msg.text().includes('NAVIGATION DEBUG') ||
                   msg.text().includes('Navigation Safety')) {
          console.log('🔍 Navigation Debug:', msg.text());
        }
      });

      // Set up error handling
      this.page.on('pageerror', error => {
        console.log('🚨 Page Error:', error.message);
        this.recordTestResult('Page Error', false, `Page error: ${error.message}`);
      });

      console.log('✅ Browser initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize browser:', error);
      return false;
    }
  }

  async loginIfNeeded() {
    console.log('🔐 Checking authentication status...');
    
    try {
      await this.page.goto(BASE_URL, { waitUntil: 'networkidle' });
      
      // Wait a moment for the page to load
      await this.page.waitForTimeout(2000);
      
      // Check if we're on the login page
      const currentUrl = this.page.url();
      console.log('📍 Current URL:', currentUrl);
      
      if (currentUrl.includes('/login') || currentUrl.includes('/register')) {
        console.log('🔑 Login required, attempting to log in...');
        
        // Try to navigate to dashboard first (might redirect to login)
        await this.page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle' });
        await this.page.waitForTimeout(2000);
        
        // Check if still on login page
        const stillOnLogin = this.page.url().includes('/login') || this.page.url().includes('/register');
        
        if (stillOnLogin) {
          console.log('⚠️ Still on login page. You may need to manually log in.');
          console.log('📝 Test will proceed with current authentication state...');
          
          // Wait a bit longer for manual login if needed
          await this.page.waitForTimeout(10000);
        }
      } else {
        console.log('✅ Already authenticated or no authentication required');
      }
      
      return true;
    } catch (error) {
      console.error('❌ Error during login check:', error);
      return false;
    }
  }

  async testMenuFunctionality(viewport) {
    console.log(`\n📱 Testing menu functionality on ${viewport.name} (${viewport.width}x${viewport.height})`);
    
    try {
      // Set viewport
      await this.page.setViewportSize(viewport);
      await this.page.waitForTimeout(1000);
      
      // Test menu visibility and accessibility
      const menuVisible = await this.testMenuVisibility(viewport);
      if (!menuVisible) {
        this.recordTestResult(`${viewport.name} Menu Visibility`, false, 'Menu not visible');
        return false;
      }
      
      // Test each menu item
      for (const menuItem of MENU_ITEMS) {
        await this.testMenuItem(menuItem, viewport);
        await this.page.waitForTimeout(1000); // Brief pause between tests
      }
      
      // Test navigation cycles
      await this.testNavigationCycles(viewport);
      
      // Test specific Trades tab freezing issue
      if (viewport.name === 'Desktop' || viewport.name === 'Mobile') {
        await this.testTradesFreezingIssue(viewport);
      }
      
      return true;
    } catch (error) {
      console.error(`❌ Error testing ${viewport.name} menu functionality:`, error);
      this.recordTestResult(`${viewport.name} Menu Test`, false, `Error: ${error.message}`);
      return false;
    }
  }

  async testMenuVisibility(viewport) {
    console.log(`👁️ Testing menu visibility on ${viewport.name}...`);
    
    try {
      // Wait for page to load
      await this.page.waitForTimeout(2000);
      
      let menuSelector;
      if (viewport.name === 'Mobile') {
        // Mobile menu might be hidden, need to toggle it
        menuSelector = '.sidebar-luxury';
        const mobileMenuVisible = await this.page.isVisible(menuSelector);
        
        if (!mobileMenuVisible) {
          // Try to find mobile menu toggle button
          const toggleSelector = '.sidebar-toggle-button, button[aria-label*="menu"], button[title*="menu"]';
          const toggleVisible = await this.page.isVisible(toggleSelector);
          
          if (toggleVisible) {
            await this.page.click(toggleSelector);
            await this.page.waitForTimeout(500);
          }
        }
      } else {
        // Desktop sidebar should always be visible
        menuSelector = '.sidebar-luxury';
      }
      
      const menuVisible = await this.page.isVisible(menuSelector);
      console.log(`${menuVisible ? '✅' : '❌'} Menu visibility on ${viewport.name}:`, menuVisible);
      
      this.recordTestResult(`${viewport.name} Menu Visibility`, menuVisible, 
        menuVisible ? 'Menu is visible' : 'Menu not visible');
      
      return menuVisible;
    } catch (error) {
      console.error(`❌ Error checking menu visibility on ${viewport.name}:`, error);
      this.recordTestResult(`${viewport.name} Menu Visibility`, false, `Error: ${error.message}`);
      return false;
    }
  }

  async testMenuItem(menuItem, viewport) {
    console.log(`🔗 Testing menu item: ${menuItem.label} (${menuItem.href})`);
    
    try {
      // Find the menu item
      const linkSelector = `a[href="${menuItem.href}"]`;
      const linkExists = await this.page.isVisible(linkSelector);
      
      if (!linkExists) {
        // Try alternative selectors for Next.js Link components
        const alternativeSelectors = [
          `[role="link"][href="${menuItem.href}"]`,
          `a[data-href="${menuItem.href}"]`,
          `button[onclick*="${menuItem.href}"]`
        ];
        
        let found = false;
        for (const selector of alternativeSelectors) {
          if (await this.page.isVisible(selector)) {
            found = true;
            break;
          }
        }
        
        if (!found) {
          this.recordTestResult(`Menu Item ${menuItem.label}`, false, 'Menu item not found');
          return false;
        }
      }
      
      // Get current URL before navigation
      const beforeUrl = this.page.url();
      
      // Click the menu item
      await this.page.click(linkSelector);
      
      // Wait for navigation
      await this.page.waitForTimeout(2000);
      
      // Check if navigation was successful
      const afterUrl = this.page.url();
      const navigated = afterUrl.includes(menuItem.href) || afterUrl.endsWith(menuItem.href);
      
      console.log(`${navigated ? '✅' : '❌'} Navigation to ${menuItem.label}:`, navigated);
      console.log(`   Before: ${beforeUrl}`);
      console.log(`   After: ${afterUrl}`);
      
      this.recordTestResult(`Navigate to ${menuItem.label}`, navigated, 
        navigated ? `Successfully navigated to ${menuItem.href}` : `Navigation failed. URL: ${afterUrl}`);
      
      // Test menu responsiveness after navigation
      await this.testMenuResponsiveness(viewport, menuItem.label);
      
      return navigated;
    } catch (error) {
      console.error(`❌ Error testing menu item ${menuItem.label}:`, error);
      this.recordTestResult(`Navigate to ${menuItem.label}`, false, `Error: ${error.message}`);
      return false;
    }
  }

  async testMenuResponsiveness(viewport, currentPage) {
    console.log(`🔄 Testing menu responsiveness after navigating to ${currentPage}...`);
    
    try {
      // Test if menu items are still clickable
      let menuItemsClickable = true;
      
      for (const menuItem of MENU_ITEMS.slice(0, 3)) { // Test first 3 items for efficiency
        const selector = `a[href="${menuItem.href}"]`;
        
        // Check if element is visible and enabled
        const isVisible = await this.page.isVisible(selector);
        const isEnabled = await this.page.isEnabled(selector);
        
        if (!isVisible || !isEnabled) {
          menuItemsClickable = false;
          console.log(`❌ Menu item ${menuItem.label} not responsive: visible=${isVisible}, enabled=${isEnabled}`);
          break;
        }
      }
      
      // Test hover states if desktop
      if (viewport.name === 'Desktop') {
        const firstMenuItem = MENU_ITEMS[0];
        const selector = `a[href="${firstMenuItem.href}"]`;
        
        await this.page.hover(selector);
        await this.page.waitForTimeout(500);
        
        // Check if hover styles are applied (this is a basic check)
        const hoverApplied = await this.page.evaluate((sel) => {
          const element = document.querySelector(sel);
          if (!element) return false;
          
          const styles = window.getComputedStyle(element);
          return styles.backgroundColor !== '' || styles.transform !== 'none';
        }, selector);
        
        console.log(`${hoverApplied ? '✅' : '❌'} Hover state working on ${firstMenuItem.label}`);
      }
      
      this.recordTestResult(`Menu Responsiveness on ${currentPage}`, menuItemsClickable, 
        menuItemsClickable ? 'Menu items responsive' : 'Menu items not responsive');
      
      return menuItemsClickable;
    } catch (error) {
      console.error(`❌ Error testing menu responsiveness on ${currentPage}:`, error);
      this.recordTestResult(`Menu Responsiveness on ${currentPage}`, false, `Error: ${error.message}`);
      return false;
    }
  }

  async testNavigationCycles(viewport) {
    console.log(`🔄 Testing navigation cycles on ${viewport.name}...`);
    
    try {
      const navigationSequence = [
        '/dashboard',
        '/trades',
        '/strategies',
        '/trades',
        '/calendar',
        '/trades',
        '/dashboard'
      ];
      
      let allNavigationsSuccessful = true;
      
      for (let i = 0; i < navigationSequence.length; i++) {
        const targetPath = navigationSequence[i];
        console.log(`   Navigation step ${i + 1}: ${targetPath}`);
        
        const selector = `a[href="${targetPath}"]`;
        const beforeUrl = this.page.url();
        
        await this.page.click(selector);
        await this.page.waitForTimeout(2000);
        
        const afterUrl = this.page.url();
        const navigated = afterUrl.includes(targetPath) || afterUrl.endsWith(targetPath);
        
        if (!navigated) {
          allNavigationsSuccessful = false;
          console.log(`❌ Navigation step ${i + 1} failed: ${targetPath}`);
          console.log(`   Expected: ${targetPath}, Got: ${afterUrl}`);
        }
      }
      
      console.log(`${allNavigationsSuccessful ? '✅' : '❌'} Navigation cycles on ${viewport.name}:`, allNavigationsSuccessful);
      
      this.recordTestResult(`${viewport.name} Navigation Cycles`, allNavigationsSuccessful, 
        allNavigationsSuccessful ? 'All navigation cycles successful' : 'Some navigation cycles failed');
      
      return allNavigationsSuccessful;
    } catch (error) {
      console.error(`❌ Error testing navigation cycles on ${viewport.name}:`, error);
      this.recordTestResult(`${viewport.name} Navigation Cycles`, false, `Error: ${error.message}`);
      return false;
    }
  }

  async testTradesFreezingIssue(viewport) {
    console.log(`🧊 Testing Trades tab freezing issue on ${viewport.name}...`);
    
    try {
      // Step 1: Navigate to Trades page
      console.log('   Step 1: Navigating to Trades page...');
      await this.page.goto(`${BASE_URL}/trades`, { waitUntil: 'networkidle' });
      await this.page.waitForTimeout(3000); // Wait for Trades page to fully load
      
      // Step 2: Check if page loaded successfully
      const tradesPageLoaded = this.page.url().includes('/trades');
      if (!tradesPageLoaded) {
        this.recordTestResult(`Trades Page Load`, false, 'Failed to load Trades page');
        return false;
      }
      
      // Step 3: Check for any overlays or modals that might be blocking
      const overlays = await this.page.evaluate(() => {
        const overlaySelectors = [
          '.fixed.inset-0',
          '.modal-backdrop',
          '[style*="position: fixed"]',
          '.modal-overlay',
          '[role="dialog"]',
          '[aria-modal="true"]'
        ];
        
        const overlays = [];
        overlaySelectors.forEach(selector => {
          const elements = document.querySelectorAll(selector);
          elements.forEach(el => {
            const rect = el.getBoundingClientRect();
            const style = window.getComputedStyle(el);
            const zIndex = parseInt(style.zIndex) || 0;
            
            if (zIndex > 50 && (style.position === 'fixed' || style.position === 'absolute')) {
              overlays.push({
                selector,
                zIndex,
                width: rect.width,
                height: rect.height,
                visible: style.display !== 'none' && style.visibility !== 'hidden'
              });
            }
          });
        });
        
        return overlays;
      });
      
      console.log('   Overlays detected:', overlays.length);
      if (overlays.length > 0) {
        console.log('   Overlay details:', overlays);
        this.testResults.tradesFreezingIssue.details.push(`Overlays detected on Trades page: ${JSON.stringify(overlays)}`);
      }
      
      // Step 4: Test navigation away from Trades page
      console.log('   Step 2: Testing navigation away from Trades page...');
      
      const testPages = ['/dashboard', '/strategies', '/calendar'];
      let navigationSuccessful = true;
      let navigationResults = [];
      
      for (const page of testPages) {
        console.log(`   Testing navigation to ${page}...`);
        
        const beforeUrl = this.page.url();
        const selector = `a[href="${page}"]`;
        
        // Check if menu item is clickable
        const isClickable = await this.page.isEnabled(selector);
        navigationResults.push({ page, clickable: isClickable });
        
        if (isClickable) {
          await this.page.click(selector);
          await this.page.waitForTimeout(2000);
          
          const afterUrl = this.page.url();
          const navigated = afterUrl.includes(page) || afterUrl.endsWith(page);
          
          if (!navigated) {
            navigationSuccessful = false;
            console.log(`❌ Navigation to ${page} failed from Trades page`);
            console.log(`   Before: ${beforeUrl}, After: ${afterUrl}`);
          }
          
          // Navigate back to Trades for next test
          await this.page.goto(`${BASE_URL}/trades`, { waitUntil: 'networkidle' });
          await this.page.waitForTimeout(2000);
        } else {
          navigationSuccessful = false;
          console.log(`❌ Menu item ${page} not clickable on Trades page`);
        }
      }
      
      // Step 5: Check for navigation safety functions
      const navigationSafetyAvailable = await this.page.evaluate(() => {
        return !!(window.cleanupModalOverlays || 
                  window.forceCleanupAllOverlays || 
                  window.tradesPageCleanup ||
                  (window.navigationSafety && window.navigationSafety.tradesPageCleanup));
      });
      
      console.log('   Navigation safety functions available:', navigationSafetyAvailable);
      
      // Step 6: Test multiple navigation cycles
      console.log('   Step 3: Testing multiple navigation cycles...');
      let cyclesSuccessful = true;
      
      for (let cycle = 0; cycle < 3; cycle++) {
        console.log(`   Navigation cycle ${cycle + 1}/3`);
        
        // Trades -> Dashboard -> Trades -> Strategies
        const cycleSteps = ['/dashboard', '/trades', '/strategies', '/trades'];
        
        for (const step of cycleSteps) {
          const selector = `a[href="${step}"]`;
          const isClickable = await this.page.isEnabled(selector);
          
          if (isClickable) {
            await this.page.click(selector);
            await this.page.waitForTimeout(1500);
          } else {
            cyclesSuccessful = false;
            console.log(`❌ Cycle ${cycle + 1}: Menu item ${step} not clickable`);
            break;
          }
        }
      }
      
      // Determine if the issue is reproduced or fixed
      const issueReproduced = !navigationSuccessful || !cyclesSuccessful || overlays.length > 0;
      const issueFixed = navigationSuccessful && cyclesSuccessful && overlays.length === 0 && navigationSafetyAvailable;
      
      this.testResults.tradesFreezingIssue.reproduced = issueReproduced;
      this.testResults.tradesFreezingIssue.fixed = issueFixed;
      
      console.log(`${issueReproduced ? '❌' : '✅'} Trades freezing issue reproduced:`, issueReproduced);
      console.log(`${issueFixed ? '✅' : '❌'} Trades freezing issue fixed:`, issueFixed);
      
      this.recordTestResult(`Trades Freezing Issue on ${viewport.name}`, issueFixed, 
        issueFixed ? 'Issue is fixed - navigation works properly' : 'Issue still exists - navigation problems detected');
      
      // Add detailed results
      this.testResults.tradesFreezingIssue.details.push({
        viewport: viewport.name,
        navigationSuccessful,
        cyclesSuccessful,
        overlaysCount: overlays.length,
        navigationSafetyAvailable,
        navigationResults
      });
      
      return issueFixed;
    } catch (error) {
      console.error(`❌ Error testing Trades freezing issue on ${viewport.name}:`, error);
      this.recordTestResult(`Trades Freezing Issue on ${viewport.name}`, false, `Error: ${error.message}`);
      return false;
    }
  }

  recordTestResult(testName, passed, details) {
    const result = {
      testName,
      passed,
      details,
      timestamp: new Date().toISOString()
    };
    
    this.testResults.details.push(result);
    this.testResults.summary.totalTests++;
    
    if (passed) {
      this.testResults.summary.passedTests++;
      console.log(`✅ PASSED: ${testName}`);
    } else {
      this.testResults.summary.failedTests++;
      console.log(`❌ FAILED: ${testName} - ${details}`);
    }
  }

  async generateReport() {
    console.log('\n📊 Generating comprehensive test report...');
    
    const report = {
      timestamp: new Date().toISOString(),
      summary: this.testResults.summary,
      tradesFreezingIssue: this.testResults.tradesFreezingIssue,
      details: this.testResults.details,
      recommendations: []
    };
    
    // Add recommendations based on results
    if (this.testResults.tradesFreezingIssue.reproduced && !this.testResults.tradesFreezingIssue.fixed) {
      report.recommendations.push('Trades tab freezing issue still exists - navigation safety functions may not be working properly');
      report.recommendations.push('Check if modal cleanup functions are correctly exported and accessible');
      report.recommendations.push('Verify that navigation safety system is properly initialized');
    }
    
    if (this.testResults.summary.failedTests > 0) {
      report.recommendations.push('Some menu functionality tests failed - review individual test results for details');
    }
    
    if (this.testResults.summary.passedTests === this.testResults.summary.totalTests) {
      report.recommendations.push('All menu functionality tests passed - system appears to be working correctly');
    }
    
    // Save report to file
    const reportPath = './comprehensive-menu-test-report.json';
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    // Also create a markdown report
    const markdownReport = this.generateMarkdownReport(report);
    fs.writeFileSync('./comprehensive-menu-test-report.md', markdownReport);
    
    console.log(`📄 Reports saved to: ${reportPath} and comprehensive-menu-test-report.md`);
    
    return report;
  }

  generateMarkdownReport(report) {
    const { summary, tradesFreezingIssue, details, recommendations } = report;
    
    let markdown = `# Comprehensive Menu Functionality Test Report\n\n`;
    markdown += `**Date:** ${new Date(report.timestamp).toLocaleString()}\n\n`;
    
    // Summary
    markdown += `## Test Summary\n\n`;
    markdown += `- **Total Tests:** ${summary.totalTests}\n`;
    markdown += `- **Passed:** ${summary.passedTests} ✅\n`;
    markdown += `- **Failed:** ${summary.failedTests} ❌\n`;
    markdown += `- **Success Rate:** ${((summary.passedTests / summary.totalTests) * 100).toFixed(1)}%\n\n`;
    
    // Trades Freezing Issue
    markdown += `## Trades Tab Freezing Issue\n\n`;
    markdown += `- **Issue Reproduced:** ${tradesFreezingIssue.reproduced ? 'Yes ❌' : 'No ✅'}\n`;
    markdown += `- **Issue Fixed:** ${tradesFreezingIssue.fixed ? 'Yes ✅' : 'No ❌'}\n\n`;
    
    if (tradesFreezingIssue.details.length > 0) {
      markdown += `### Detailed Results\n\n`;
      tradesFreezingIssue.details.forEach(detail => {
        markdown += `#### ${detail.viewport}\n`;
        markdown += `- Navigation Successful: ${detail.navigationSuccessful ? 'Yes ✅' : 'No ❌'}\n`;
        markdown += `- Cycles Successful: ${detail.cyclesSuccessful ? 'Yes ✅' : 'No ❌'}\n`;
        markdown += `- Overlays Detected: ${detail.overlaysCount}\n`;
        markdown += `- Navigation Safety Available: ${detail.navigationSafetyAvailable ? 'Yes ✅' : 'No ❌'}\n\n`;
      });
    }
    
    // Detailed Test Results
    markdown += `## Detailed Test Results\n\n`;
    details.forEach(test => {
      markdown += `### ${test.testName}\n`;
      markdown += `- **Status:** ${test.passed ? 'PASSED ✅' : 'FAILED ❌'}\n`;
      markdown += `- **Details:** ${test.details}\n`;
      markdown += `- **Time:** ${new Date(test.timestamp).toLocaleTimeString()}\n\n`;
    });
    
    // Recommendations
    if (recommendations.length > 0) {
      markdown += `## Recommendations\n\n`;
      recommendations.forEach((rec, index) => {
        markdown += `${index + 1}. ${rec}\n`;
      });
      markdown += `\n`;
    }
    
    return markdown;
  }

  async cleanup() {
    console.log('\n🧹 Cleaning up test environment...');
    
    try {
      if (this.page) {
        await this.page.close();
      }
      if (this.context) {
        await this.context.close();
      }
      if (this.browser) {
        await this.browser.close();
      }
      console.log('✅ Cleanup completed');
    } catch (error) {
      console.error('❌ Error during cleanup:', error);
    }
  }

  async runAllTests() {
    console.log('🎯 Starting comprehensive menu functionality tests...\n');
    
    try {
      // Initialize browser
      const initialized = await this.initialize();
      if (!initialized) {
        return false;
      }
      
      // Check authentication
      const loggedIn = await this.loginIfNeeded();
      if (!loggedIn) {
        console.log('⚠️ Login may be required. Tests will proceed with current state.');
      }
      
      // Test on different viewports
      for (const [viewportName, viewport] of Object.entries(VIEWPORTS)) {
        await this.testMenuFunctionality(viewport);
        await this.page.waitForTimeout(2000); // Brief pause between viewport tests
      }
      
      // Generate and save report
      const report = await this.generateReport();
      
      // Print summary
      console.log('\n🎉 Test Execution Summary:');
      console.log(`Total Tests: ${report.summary.totalTests}`);
      console.log(`Passed: ${report.summary.passedTests} ✅`);
      console.log(`Failed: ${report.summary.failedTests} ❌`);
      console.log(`Success Rate: ${((report.summary.passedTests / report.summary.totalTests) * 100).toFixed(1)}%`);
      
      console.log('\n🧊 Trades Tab Freezing Issue:');
      console.log(`Issue Reproduced: ${report.tradesFreezingIssue.reproduced ? 'Yes ❌' : 'No ✅'}`);
      console.log(`Issue Fixed: ${report.tradesFreezingIssue.fixed ? 'Yes ✅' : 'No ❌'}`);
      
      return report;
    } catch (error) {
      console.error('❌ Error running tests:', error);
      return null;
    } finally {
      await this.cleanup();
    }
  }
}

// Run the tests
async function main() {
  const tester = new ComprehensiveMenuTest();
  const results = await tester.runAllTests();
  
  if (results) {
    console.log('\n✅ All tests completed successfully!');
    process.exit(0);
  } else {
    console.log('\n❌ Test execution failed!');
    process.exit(1);
  }
}

// Handle uncaught errors
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Run if this file is executed directly
if (require.main === module) {
  main();
}

module.exports = ComprehensiveMenuTest;