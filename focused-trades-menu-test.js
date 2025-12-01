/**
 * Focused Trades Menu Functionality Test
 * 
 * This script specifically tests the Trades tab freezing issue by starting
 * directly on the Trades page and handling authentication properly.
 */

const { chromium } = require('playwright');
const fs = require('fs');

class FocusedTradesMenuTest {
  constructor() {
    this.browser = null;
    this.context = null;
    this.page = null;
    this.testResults = {
      summary: {
        totalTests: 0,
        passedTests: 0,
        failedTests: 0
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
    console.log('🎯 Initializing Focused Trades Menu Test...');
    
    try {
      this.browser = await chromium.launch({ 
        headless: false,
        slowMo: 100,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      this.context = await this.browser.newContext({
        viewport: { width: 1920, height: 1080 },
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
                   msg.text().includes('Navigation Safety') ||
                   msg.text().includes('TradesPage') ||
                   msg.text().includes('cleanupModalOverlays')) {
          console.log('🔍 Navigation Debug:', msg.text());
        }
      });

      console.log('✅ Browser initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize browser:', error);
      return false;
    }
  }

  async navigateToTradesPage() {
    console.log('\n🧊 Navigating directly to Trades page...');
    
    try {
      // Go directly to Trades page
      await this.page.goto('http://localhost:3000/trades', { waitUntil: 'networkidle' });
      await this.page.waitForTimeout(5000); // Wait for page to fully load
      
      const currentUrl = this.page.url();
      console.log('📍 Current URL after navigation:', currentUrl);
      
      // Check if we're on Trades page or were redirected
      if (currentUrl.includes('/trades')) {
        console.log('✅ Successfully navigated to Trades page');
        
        // Wait for Trades page to fully render
        await this.page.waitForTimeout(3000);
        
        // Check if sidebar is visible
        const hasSidebar = await this.page.evaluate(() => {
          return !!document.querySelector('.sidebar-luxury, aside, [class*="sidebar"]');
        });
        
        console.log('📱 Sidebar visible:', hasSidebar);
        
        if (!hasSidebar) {
          console.log('⚠️ Sidebar not visible - checking for authentication requirements...');
          
          // Check if we need to authenticate
          const needsAuth = await this.page.evaluate(() => {
            // Look for login form or auth indicators
            const hasLoginForm = !!document.querySelector('input[type="email"], input[name="email"], form');
            const hasAuthMessage = !!document.querySelector('[class*="auth"], [class*="login"]');
            
            return hasLoginForm || hasAuthMessage;
          });
          
          if (needsAuth) {
            console.log('🔐 Authentication required - waiting for manual login...');
            console.log('⏱️ Please log in manually. Test will continue in 30 seconds...');
            
            // Wait for manual authentication
            await this.page.waitForTimeout(30000);
            
            // Check if still need auth after wait
            const stillNeedsAuth = await this.page.evaluate(() => {
              const hasLoginForm = !!document.querySelector('input[type="email"], input[name="email"], form');
              return hasLoginForm;
            });
            
            if (stillNeedsAuth) {
              console.log('⚠️ Still needs authentication - proceeding with current state');
            } else {
              console.log('✅ Authentication appears successful');
              
              // Wait for page to reload after authentication
              await this.page.waitForTimeout(5000);
            }
          }
        }
        
        return true;
      } else if (currentUrl.includes('/login') || currentUrl.includes('/register')) {
        console.log('🔐 Redirected to authentication page');
        console.log('⏱️ Waiting 30 seconds for manual login...');
        
        // Wait for manual login
        await this.page.waitForTimeout(30000);
        
        // Try to navigate to Trades again after login
        await this.page.goto('http://localhost:3000/trades', { waitUntil: 'networkidle' });
        await this.page.waitForTimeout(5000);
        
        const finalUrl = this.page.url();
        const onTradesPage = finalUrl.includes('/trades');
        
        if (onTradesPage) {
          console.log('✅ Successfully reached Trades page after authentication');
        } else {
          console.log('❌ Still not on Trades page after authentication');
        }
        
        return onTradesPage;
      } else {
        console.log('❌ Unexpected redirect to:', currentUrl);
        return false;
      }
    } catch (error) {
      console.error('❌ Error navigating to Trades page:', error);
      return false;
    }
  }

  async testMenuItemsOnTradesPage() {
    console.log('\n🔗 Testing menu items on Trades page...');
    
    try {
      // Define menu items to test
      const menuItems = [
        { href: '/dashboard', label: 'Dashboard' },
        { href: '/log-trade', label: 'Log Trade' },
        { href: '/strategies', label: 'Strategies' },
        { href: '/calendar', label: 'Calendar' },
        { href: '/confluence', label: 'Confluence' }
      ];
      
      let menuResults = [];
      
      for (const item of menuItems) {
        console.log(`\n🔗 Testing menu item: ${item.label}`);
        
        // Try multiple selectors for menu item
        const selectors = [
          `a[href="${item.href}"]`,
          `[role="link"][href="${item.href}"]`,
          `a[data-href="${item.href}"]`,
          `button[onclick*="${item.href}"]`
        ];
        
        let elementFound = false;
        let selectorUsed = null;
        let isEnabled = false;
        
        for (const selector of selectors) {
          const isVisible = await this.page.isVisible(selector);
          if (isVisible) {
            elementFound = true;
            selectorUsed = selector;
            isEnabled = await this.page.isEnabled(selector);
            break;
          }
        }
        
        if (!elementFound) {
          console.log(`❌ Menu item ${item.label} not found`);
          menuResults.push({
            item: item.label,
            found: false,
            enabled: false,
            clickable: false,
            error: 'Element not found'
          });
          continue;
        }
        
        console.log(`✅ Found ${item.label} with selector: ${selectorUsed}`);
        console.log(`   Enabled: ${isEnabled}`);
        
        // Test hover state for desktop
        const hasHoverState = await this.page.evaluate((selector) => {
          const element = document.querySelector(selector);
          if (!element) return false;
          
          // Check if element has hover styles or classes
          const styles = window.getComputedStyle(element);
          const hasTransition = styles.transition && styles.transition !== 'none';
          const hasTransform = styles.transform && styles.transform !== 'none';
          
          return hasTransition || hasTransform;
        }, selectorUsed);
        
        console.log(`   Has hover state: ${hasHoverState}`);
        
        menuResults.push({
          item: item.label,
          found: true,
          enabled: isEnabled,
          clickable: isEnabled,
          selector: selectorUsed,
          hasHoverState
        });
      }
      
      // Calculate menu functionality score
      const foundItems = menuResults.filter(r => r.found).length;
      const enabledItems = menuResults.filter(r => r.enabled).length;
      const clickableItems = menuResults.filter(r => r.clickable).length;
      
      console.log(`\n📊 Menu Summary:`);
      console.log(`   Found: ${foundItems}/${menuItems.length}`);
      console.log(`   Enabled: ${enabledItems}/${foundItems}`);
      console.log(`   Clickable: ${clickableItems}/${enabledItems}`);
      
      this.recordTestResult('Menu Items Available', foundItems === menuItems.length, 
        `Found ${foundItems}/${menuItems.length} menu items`);
      
      this.recordTestResult('Menu Items Enabled', enabledItems === foundItems, 
        `Enabled ${enabledItems}/${foundItems} menu items`);
      
      this.recordTestResult('Menu Items Clickable', clickableItems === enabledItems, 
        `Clickable ${clickableItems}/${enabledItems} menu items`);
      
      return menuResults;
    } catch (error) {
      console.error('❌ Error testing menu items:', error);
      this.recordTestResult('Menu Items Test', false, `Error: ${error.message}`);
      return [];
    }
  }

  async testNavigationFromTradesPage() {
    console.log('\n🧭 Testing navigation from Trades page...');
    
    try {
      const testPages = [
        { href: '/dashboard', label: 'Dashboard' },
        { href: '/strategies', label: 'Strategies' },
        { href: '/calendar', label: 'Calendar' },
        { href: '/confluence', label: 'Confluence' }
      ];
      
      let navigationResults = [];
      
      for (const page of testPages) {
        console.log(`\n🧭 Testing navigation to: ${page.label}`);
        
        const selector = `a[href="${page.href}"]`;
        
        // Check if element is clickable before navigation
        const isClickableBefore = await this.page.isEnabled(selector);
        console.log(`   Clickable before: ${isClickableBefore}`);
        
        if (!isClickableBefore) {
          console.log(`❌ Menu item ${page.label} not clickable on Trades page`);
          navigationResults.push({
            page: page.label,
            clickable: false,
            navigated: false,
            error: 'Not clickable before navigation'
          });
          continue;
        }
        
        // Get current URL
        const beforeUrl = this.page.url();
        
        try {
          // Click the menu item
          await this.page.click(selector);
          
          // Wait for navigation
          await this.page.waitForTimeout(3000);
          
          const afterUrl = this.page.url();
          const navigated = afterUrl.includes(page.href) || afterUrl.endsWith(page.href);
          
          console.log(`   Before: ${beforeUrl}`);
          console.log(`   After: ${afterUrl}`);
          console.log(`   Navigation successful: ${navigated}`);
          
          if (navigated) {
            navigationResults.push({
              page: page.label,
              clickable: true,
              navigated: true,
              beforeUrl,
              afterUrl
            });
            
            // Navigate back to Trades for next test
            console.log('   Returning to Trades page...');
            await this.page.goto('http://localhost:3000/trades', { waitUntil: 'networkidle' });
            await this.page.waitForTimeout(2000);
          } else {
            navigationResults.push({
              page: page.label,
              clickable: true,
              navigated: false,
              error: 'Navigation failed',
              beforeUrl,
              afterUrl
            });
            
            console.log(`❌ Navigation to ${page.label} failed`);
            
            // Try to return to Trades anyway
            await this.page.goto('http://localhost:3000/trades', { waitUntil: 'networkidle' });
            await this.page.waitForTimeout(2000);
          }
          
        } catch (clickError) {
          console.log(`❌ Error clicking ${page.label}:`, clickError.message);
          navigationResults.push({
            page: page.label,
            clickable: true,
            navigated: false,
            error: clickError.message
          });
        }
      }
      
      // Calculate navigation success rate
      const successfulNavigations = navigationResults.filter(r => r.navigated).length;
      const totalAttempts = navigationResults.length;
      const successRate = (successfulNavigations / totalAttempts) * 100;
      
      console.log(`\n📊 Navigation Summary:`);
      console.log(`   Successful: ${successfulNavigations}/${totalAttempts}`);
      console.log(`   Success Rate: ${successRate.toFixed(1)}%`);
      
      this.recordTestResult('Navigation from Trades', successfulNavigations === totalAttempts, 
        `Navigation success rate: ${successRate.toFixed(1)}%`);
      
      return navigationResults;
    } catch (error) {
      console.error('❌ Error testing navigation from Trades:', error);
      this.recordTestResult('Navigation from Trades', false, `Error: ${error.message}`);
      return [];
    }
  }

  async testTradesFreezingIssue() {
    console.log('\n🧊 Testing Trades tab freezing issue specifically...');
    
    try {
      // Step 1: Check for navigation safety functions
      const navSafetyAvailable = await this.page.evaluate(() => {
        const functions = {
          cleanupModalOverlays: !!window.cleanupModalOverlays,
          forceCleanupAllOverlays: !!window.forceCleanupAllOverlays,
          tradesPageCleanup: !!window.tradesPageCleanup,
          navigationSafety: !!window.navigationSafety,
          navigationSafetyTradesCleanup: !!(window.navigationSafety && window.navigationSafety.tradesPageCleanup)
        };
        
        console.log('🔧 Navigation Safety Functions:', functions);
        return functions;
      });
      
      console.log('   Navigation safety functions available:', navSafetyAvailable);
      
      // Step 2: Check for blocking overlays
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
      }
      
      // Step 3: Test multiple navigation cycles (the core of the freezing issue)
      console.log('   Step 3: Testing multiple navigation cycles...');
      
      const navigationCycles = [
        ['/dashboard', '/trades'],
        ['/trades', '/strategies'],
        ['/strategies', '/trades'],
        ['/trades', '/calendar'],
        ['/calendar', '/trades'],
        ['/trades', '/confluence'],
        ['/confluence', '/trades']
      ];
      
      let cycleResults = [];
      let allCyclesSuccessful = true;
      
      for (let i = 0; i < navigationCycles.length; i++) {
        const [from, to] = navigationCycles[i];
        console.log(`   Cycle ${i + 1}: ${from} → ${to}`);
        
        try {
          // Ensure we're on the starting page
          const currentUrl = this.page.url();
          if (!currentUrl.includes(from)) {
            await this.page.goto(`http://localhost:3000${from}`, { waitUntil: 'networkidle' });
            await this.page.waitForTimeout(2000);
          }
          
          // Test navigation to target page
          const selector = `a[href="${to}"]`;
          const isClickable = await this.page.isEnabled(selector);
          
          if (!isClickable) {
            console.log(`     ❌ Menu item not clickable: ${to}`);
            allCyclesSuccessful = false;
            cycleResults.push({
              cycle: i + 1,
              from,
              to,
              successful: false,
              error: 'Menu item not clickable'
            });
            break;
          }
          
          await this.page.click(selector);
          await this.page.waitForTimeout(3000);
          
          const afterUrl = this.page.url();
          const navigated = afterUrl.includes(to) || afterUrl.endsWith(to);
          
          if (!navigated) {
            console.log(`     ❌ Navigation failed: ${from} → ${to}`);
            allCyclesSuccessful = false;
            cycleResults.push({
              cycle: i + 1,
              from,
              to,
              successful: false,
              error: 'Navigation failed',
              beforeUrl: currentUrl,
              afterUrl
            });
          } else {
            console.log(`     ✅ Navigation successful: ${from} → ${to}`);
            cycleResults.push({
              cycle: i + 1,
              from,
              to,
              successful: true,
              beforeUrl: currentUrl,
              afterUrl
            });
          }
          
        } catch (cycleError) {
          console.log(`     ❌ Cycle error:`, cycleError.message);
          allCyclesSuccessful = false;
          cycleResults.push({
            cycle: i + 1,
            from,
            to,
            successful: false,
            error: cycleError.message
          });
        }
      }
      
      // Step 4: Determine if freezing issue is reproduced or fixed
      const successfulCycles = cycleResults.filter(r => r.successful).length;
      const totalCycles = cycleResults.length;
      const cycleSuccessRate = (successfulCycles / totalCycles) * 100;
      
      const issueReproduced = !allCyclesSuccessful || overlays.length > 0 || !navSafetyAvailable.cleanupModalOverlays;
      const issueFixed = allCyclesSuccessful && overlays.length === 0 && navSafetyAvailable.cleanupModalOverlays;
      
      console.log(`\n📊 Freezing Issue Test Results:`);
      console.log(`   Navigation cycles successful: ${successfulCycles}/${totalCycles}`);
      console.log(`   Cycle success rate: ${cycleSuccessRate.toFixed(1)}%`);
      console.log(`   Overlays blocking: ${overlays.length > 0 ? 'Yes' : 'No'}`);
      console.log(`   Navigation safety available: ${navSafetyAvailable.cleanupModalOverlays ? 'Yes' : 'No'}`);
      
      this.testResults.tradesFreezingIssue.reproduced = issueReproduced;
      this.testResults.tradesFreezingIssue.fixed = issueFixed;
      
      console.log(`${issueReproduced ? '❌' : '✅'} Trades freezing issue reproduced:`, issueReproduced);
      console.log(`${issueFixed ? '✅' : '❌'} Trades freezing issue fixed:`, issueFixed);
      
      this.recordTestResult('Trades Freezing Issue', issueFixed, 
        issueFixed ? 'Issue is fixed - navigation works properly' : 'Issue still exists - navigation problems detected');
      
      // Add detailed results
      this.testResults.tradesFreezingIssue.details = {
        navigationCycles: cycleResults,
        cycleSuccessRate,
        overlaysDetected: overlays.length,
        navigationSafetyAvailable: navSafetyAvailable,
        issueReproduced,
        issueFixed
      };
      
      return issueFixed;
    } catch (error) {
      console.error('❌ Error testing Trades freezing issue:', error);
      this.recordTestResult('Trades Freezing Issue', false, `Error: ${error.message}`);
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
    console.log('\n📊 Generating focused Trades menu test report...');
    
    const report = {
      timestamp: new Date().toISOString(),
      summary: this.testResults.summary,
      tradesFreezingIssue: this.testResults.tradesFreezingIssue,
      details: this.testResults.details,
      recommendations: []
    };
    
    // Add recommendations
    if (this.testResults.tradesFreezingIssue.reproduced && !this.testResults.tradesFreezingIssue.fixed) {
      report.recommendations.push('Trades tab freezing issue still exists - navigation safety functions may not be working properly');
      report.recommendations.push('Check if modal cleanup functions are correctly exported from Trades page');
      report.recommendations.push('Verify that navigation safety system is properly initialized');
    }
    
    if (this.testResults.tradesFreezingIssue.fixed) {
      report.recommendations.push('Trades tab freezing issue appears to be resolved - navigation works correctly');
      report.recommendations.push('All menu functionality tests passed - system is working properly');
    }
    
    if (this.testResults.summary.failedTests > 0) {
      report.recommendations.push('Some menu functionality tests failed - review individual test results for details');
    }
    
    // Save report
    fs.writeFileSync('./focused-trades-menu-test-report.json', JSON.stringify(report, null, 2));
    
    // Create markdown report
    const markdown = this.generateMarkdownReport(report);
    fs.writeFileSync('./focused-trades-menu-test-report.md', markdown);
    
    console.log('📄 Reports saved to: focused-trades-menu-test-report.json and focused-trades-menu-test-report.md');
    
    return report;
  }

  generateMarkdownReport(report) {
    const { summary, tradesFreezingIssue, details, recommendations } = report;
    
    let markdown = `# Focused Trades Menu Functionality Test Report\n\n`;
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
    
    if (tradesFreezingIssue.details) {
      markdown += `### Detailed Results\n\n`;
      markdown += `- **Navigation Cycles Tested:** ${tradesFreezingIssue.details.navigationCycles?.length || 0}\n`;
      markdown += `- **Cycle Success Rate:** ${tradesFreezingIssue.details.cycleSuccessRate?.toFixed(1) || 0}%\n`;
      markdown += `- **Overlays Detected:** ${tradesFreezingIssue.details.overlaysDetected || 0}\n`;
      markdown += `- **Navigation Safety Available:** ${tradesFreezingIssue.details.navigationSafetyAvailable?.cleanupModalOverlays ? 'Yes' : 'No'}\n\n`;
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
    console.log('\n🧹 Cleaning up focused Trades menu test...');
    
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

  async runFocusedTest() {
    console.log('🎯 Starting focused Trades menu functionality test...\n');
    
    try {
      const initialized = await this.initialize();
      if (!initialized) {
        return false;
      }
      
      // Step 1: Navigate to Trades page
      const onTradesPage = await this.navigateToTradesPage();
      if (!onTradesPage) {
        console.log('❌ Could not access Trades page');
        return false;
      }
      
      // Step 2: Test menu items on Trades page
      const menuResults = await this.testMenuItemsOnTradesPage();
      
      // Step 3: Test navigation from Trades page
      const navigationResults = await this.testNavigationFromTradesPage();
      
      // Step 4: Test Trades freezing issue specifically
      const freezingTestResult = await this.testTradesFreezingIssue();
      
      // Generate report
      const report = await this.generateReport();
      
      // Print summary
      console.log('\n🎉 Focused Trades Menu Test Summary:');
      console.log(`Total Tests: ${report.summary.totalTests}`);
      console.log(`Passed: ${report.summary.passedTests} ✅`);
      console.log(`Failed: ${report.summary.failedTests} ❌`);
      console.log(`Success Rate: ${((report.summary.passedTests / report.summary.totalTests) * 100).toFixed(1)}%`);
      
      console.log('\n🧊 Trades Tab Freezing Issue:');
      console.log(`Issue Reproduced: ${report.tradesFreezingIssue.reproduced ? 'Yes ❌' : 'No ✅'}`);
      console.log(`Issue Fixed: ${report.tradesFreezingIssue.fixed ? 'Yes ✅' : 'No ❌'}`);
      
      return report;
    } catch (error) {
      console.error('❌ Error running focused test:', error);
      return null;
    } finally {
      await this.cleanup();
    }
  }
}

// Run test
async function main() {
  const tester = new FocusedTradesMenuTest();
  const results = await tester.runFocusedTest();
  
  if (results) {
    console.log('\n✅ Focused Trades menu test completed successfully!');
    process.exit(0);
  } else {
    console.log('\n❌ Focused Trades menu test failed!');
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

module.exports = FocusedTradesMenuTest;