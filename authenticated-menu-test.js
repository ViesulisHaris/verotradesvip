/**
 * Authenticated Menu Functionality Test
 * 
 * This script tests menu functionality with proper authentication handling
 * to verify the Trades tab freezing issue in a real user scenario.
 */

const { chromium } = require('playwright');
const fs = require('fs');

class AuthenticatedMenuTest {
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
    console.log('🚀 Initializing Authenticated Menu Test...');
    
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
                   msg.text().includes('TradesPage')) {
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

  async waitForAuthAndLoad() {
    console.log('⏳ Waiting for authentication and page load...');
    
    try {
      // Navigate to the application
      await this.page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
      
      // Wait longer for initial load
      await this.page.waitForTimeout(5000);
      
      // Check current state
      const currentUrl = this.page.url();
      console.log('📍 Current URL:', currentUrl);
      
      // If we're on login/register page, we need to handle authentication
      if (currentUrl.includes('/login') || currentUrl.includes('/register')) {
        console.log('🔐 Authentication required - please log in manually');
        console.log('⏱️ Waiting 30 seconds for manual login...');
        
        // Wait for manual login
        await this.page.waitForTimeout(30000);
        
        // Check if still on login page
        const stillOnLogin = this.page.url().includes('/login') || this.page.url().includes('/register');
        if (stillOnLogin) {
          console.log('⚠️ Still on login page - proceeding with current state');
        } else {
          console.log('✅ Authentication appears successful');
        }
      }
      
      // Wait for page to fully load after authentication
      await this.page.waitForTimeout(3000);
      
      // Check if sidebar is now visible
      const hasSidebar = await this.page.evaluate(() => {
        return !!document.querySelector('.sidebar-luxury, aside, [class*="sidebar"]');
      });
      
      console.log('📱 Sidebar visible after auth:', hasSidebar);
      
      if (!hasSidebar) {
        console.log('⚠️ Sidebar still not visible - checking for alternative selectors...');
        
        // Try to find any navigation elements
        const navElements = await this.page.evaluate(() => {
          const elements = [];
          document.querySelectorAll('*').forEach(el => {
            const classes = el.className || '';
            const tag = el.tagName.toLowerCase();
            
            if (classes.includes('sidebar') || classes.includes('nav') || 
                tag === 'aside' || tag === 'nav' ||
                classes.includes('menu')) {
              elements.push({
                tag,
                classes,
                visible: el.offsetParent !== null
              });
            }
          });
          return elements;
        });
        
        console.log('🔍 Found navigation elements:', navElements.length);
        navElements.forEach((el, index) => {
          console.log(`   ${index + 1}. <${el.tag}> classes="${el.classes}" visible=${el.visible}`);
        });
      }
      
      return hasSidebar;
    } catch (error) {
      console.error('❌ Error during auth wait:', error);
      return false;
    }
  }

  async testMenuNavigation() {
    console.log('\n🧭 Testing menu navigation...');
    
    try {
      // Define menu items to test
      const menuItems = [
        { href: '/dashboard', label: 'Dashboard' },
        { href: '/trades', label: 'Trades' },
        { href: '/strategies', label: 'Strategies' },
        { href: '/calendar', label: 'Calendar' },
        { href: '/confluence', label: 'Confluence' }
      ];
      
      let navigationResults = [];
      
      for (const item of menuItems) {
        console.log(`\n🔗 Testing navigation to: ${item.label}`);
        
        // Try multiple selectors for the menu item
        const selectors = [
          `a[href="${item.href}"]`,
          `[role="link"][href="${item.href}"]`,
          `a[data-href="${item.href}"]`,
          `button[onclick*="${item.href}"]`
        ];
        
        let elementFound = false;
        let selectorUsed = null;
        
        for (const selector of selectors) {
          const isVisible = await this.page.isVisible(selector);
          if (isVisible) {
            elementFound = true;
            selectorUsed = selector;
            break;
          }
        }
        
        if (!elementFound) {
          console.log(`❌ Menu item ${item.label} not found with any selector`);
          navigationResults.push({
            item: item.label,
            found: false,
            navigated: false,
            error: 'Element not found'
          });
          continue;
        }
        
        console.log(`✅ Found ${item.label} with selector: ${selectorUsed}`);
        
        // Test navigation
        const beforeUrl = this.page.url();
        
        try {
          await this.page.click(selectorUsed);
          
          // Wait for navigation
          await this.page.waitForTimeout(3000);
          
          const afterUrl = this.page.url();
          const navigated = afterUrl.includes(item.href) || afterUrl.endsWith(item.href);
          
          console.log(`   Before: ${beforeUrl}`);
          console.log(`   After: ${afterUrl}`);
          console.log(`   Navigation successful: ${navigated}`);
          
          navigationResults.push({
            item: item.label,
            found: true,
            navigated,
            beforeUrl,
            afterUrl,
            selector: selectorUsed
          });
          
          if (!navigated) {
            console.log(`❌ Navigation to ${item.label} failed`);
          }
          
        } catch (clickError) {
          console.log(`❌ Error clicking ${item.label}:`, clickError.message);
          navigationResults.push({
            item: item.label,
            found: true,
            navigated: false,
            error: clickError.message
          });
        }
      }
      
      return navigationResults;
    } catch (error) {
      console.error('❌ Error testing menu navigation:', error);
      return [];
    }
  }

  async testTradesFreezingIssue() {
    console.log('\n🧊 Testing Trades tab freezing issue...');
    
    try {
      // Step 1: Navigate to Trades page
      console.log('   Step 1: Navigating to Trades page...');
      
      const tradesSelectors = [
        'a[href="/trades"]',
        '[role="link"][href="/trades"]',
        'a[data-href="/trades"]'
      ];
      
      let tradesLinkFound = false;
      let tradesSelector = null;
      
      for (const selector of tradesSelectors) {
        if (await this.page.isVisible(selector)) {
          tradesLinkFound = true;
          tradesSelector = selector;
          break;
        }
      }
      
      if (!tradesLinkFound) {
        console.log('❌ Trades link not found');
        this.recordTestResult('Trades Link Found', false, 'Trades menu item not found');
        return false;
      }
      
      await this.page.click(tradesSelector);
      await this.page.waitForTimeout(5000); // Wait for Trades page to fully load
      
      const tradesUrl = this.page.url();
      const onTradesPage = tradesUrl.includes('/trades');
      
      if (!onTradesPage) {
        console.log('❌ Failed to navigate to Trades page');
        this.recordTestResult('Navigate to Trades', false, `Navigation failed. URL: ${tradesUrl}`);
        return false;
      }
      
      console.log('✅ Successfully navigated to Trades page');
      
      // Step 2: Check for navigation safety functions
      const navSafetyAvailable = await this.page.evaluate(() => {
        return !!(window.cleanupModalOverlays || 
                  window.forceCleanupAllOverlays || 
                  window.tradesPageCleanup ||
                  (window.navigationSafety && window.navigationSafety.tradesPageCleanup));
      });
      
      console.log('   Navigation safety functions available:', navSafetyAvailable);
      
      // Step 3: Check for blocking overlays
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
      
      // Step 4: Test navigation away from Trades page
      console.log('   Step 2: Testing navigation away from Trades page...');
      
      const testPages = ['/dashboard', '/strategies', '/calendar'];
      let navigationSuccessful = true;
      let navigationResults = [];
      
      for (const page of testPages) {
        console.log(`   Testing navigation to ${page}...`);
        
        const selector = `a[href="${page}"]`;
        const isClickable = await this.page.isEnabled(selector);
        
        if (isClickable) {
          await this.page.click(selector);
          await this.page.waitForTimeout(3000);
          
          const afterUrl = this.page.url();
          const navigated = afterUrl.includes(page) || afterUrl.endsWith(page);
          
          if (!navigated) {
            navigationSuccessful = false;
            console.log(`❌ Navigation to ${page} failed from Trades page`);
          }
          
          navigationResults.push({ page, clickable: isClickable, navigated });
          
          // Navigate back to Trades for next test
          await this.page.click(tradesSelector);
          await this.page.waitForTimeout(3000);
        } else {
          navigationSuccessful = false;
          console.log(`❌ Menu item ${page} not clickable on Trades page`);
          navigationResults.push({ page, clickable: false, navigated: false });
        }
      }
      
      // Step 5: Test multiple navigation cycles
      console.log('   Step 3: Testing multiple navigation cycles...');
      let cyclesSuccessful = true;
      
      for (let cycle = 0; cycle < 3; cycle++) {
        console.log(`   Navigation cycle ${cycle + 1}/3`);
        
        const cycleSteps = ['/dashboard', '/trades', '/strategies', '/trades'];
        
        for (const step of cycleSteps) {
          const selector = `a[href="${step}"]`;
          const isClickable = await this.page.isEnabled(selector);
          
          if (isClickable) {
            await this.page.click(selector);
            await this.page.waitForTimeout(2000);
          } else {
            cyclesSuccessful = false;
            console.log(`❌ Cycle ${cycle + 1}: Menu item ${step} not clickable`);
            break;
          }
        }
      }
      
      // Determine results
      const issueReproduced = !navigationSuccessful || !cyclesSuccessful || overlays.length > 0;
      const issueFixed = navigationSuccessful && cyclesSuccessful && overlays.length === 0 && navSafetyAvailable;
      
      this.testResults.tradesFreezingIssue.reproduced = issueReproduced;
      this.testResults.tradesFreezingIssue.fixed = issueFixed;
      
      console.log(`${issueReproduced ? '❌' : '✅'} Trades freezing issue reproduced:`, issueReproduced);
      console.log(`${issueFixed ? '✅' : '❌'} Trades freezing issue fixed:`, issueFixed);
      
      this.recordTestResult('Trades Freezing Issue', issueFixed, 
        issueFixed ? 'Issue is fixed - navigation works properly' : 'Issue still exists - navigation problems detected');
      
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
    console.log('\n📊 Generating authenticated menu test report...');
    
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
    }
    
    if (this.testResults.summary.failedTests > 0) {
      report.recommendations.push('Some menu functionality tests failed - authentication may be required');
    }
    
    if (this.testResults.summary.passedTests === this.testResults.summary.totalTests) {
      report.recommendations.push('All menu functionality tests passed - system appears to be working correctly');
    }
    
    // Save report
    fs.writeFileSync('./authenticated-menu-test-report.json', JSON.stringify(report, null, 2));
    
    // Create markdown report
    const markdown = this.generateMarkdownReport(report);
    fs.writeFileSync('./authenticated-menu-test-report.md', markdown);
    
    console.log('📄 Reports saved to: authenticated-menu-test-report.json and authenticated-menu-test-report.md');
    
    return report;
  }

  generateMarkdownReport(report) {
    const { summary, tradesFreezingIssue, details, recommendations } = report;
    
    let markdown = `# Authenticated Menu Functionality Test Report\n\n`;
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
    
    // Detailed Results
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
    console.log('\n🧹 Cleaning up authenticated menu test...');
    
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

  async runAuthenticatedTest() {
    console.log('🎯 Starting authenticated menu functionality test...\n');
    
    try {
      const initialized = await this.initialize();
      if (!initialized) {
        return false;
      }
      
      // Wait for authentication and page load
      const authSuccessful = await this.waitForAuthAndLoad();
      
      if (!authSuccessful) {
        console.log('⚠️ Authentication may be required. Tests will proceed with current state.');
      }
      
      // Test menu navigation
      const navigationResults = await this.testMenuNavigation();
      
      // Test Trades freezing issue
      const tradesTestResult = await this.testTradesFreezingIssue();
      
      // Generate report
      const report = await this.generateReport();
      
      // Print summary
      console.log('\n🎉 Authenticated Menu Test Summary:');
      console.log(`Total Tests: ${report.summary.totalTests}`);
      console.log(`Passed: ${report.summary.passedTests} ✅`);
      console.log(`Failed: ${report.summary.failedTests} ❌`);
      console.log(`Success Rate: ${((report.summary.passedTests / report.summary.totalTests) * 100).toFixed(1)}%`);
      
      console.log('\n🧊 Trades Tab Freezing Issue:');
      console.log(`Issue Reproduced: ${report.tradesFreezingIssue.reproduced ? 'Yes ❌' : 'No ✅'}`);
      console.log(`Issue Fixed: ${report.tradesFreezingIssue.fixed ? 'Yes ✅' : 'No ❌'}`);
      
      return report;
    } catch (error) {
      console.error('❌ Error running authenticated test:', error);
      return null;
    } finally {
      await this.cleanup();
    }
  }
}

// Run test
async function main() {
  const tester = new AuthenticatedMenuTest();
  const results = await tester.runAuthenticatedTest();
  
  if (results) {
    console.log('\n✅ Authenticated menu test completed successfully!');
    process.exit(0);
  } else {
    console.log('\n❌ Authenticated menu test failed!');
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

module.exports = AuthenticatedMenuTest;