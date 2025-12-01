const puppeteer = require('puppeteer');
const fs = require('fs');

// Navigation test configuration
const BASE_URL = 'http://localhost:3001';
const DASHBOARD_URL = `${BASE_URL}/dashboard`;

// Navigation buttons to test (based on UnifiedSidebar navigationItems)
const NAVIGATION_BUTTONS = [
  {
    name: 'Dashboard',
    selector: 'a[href="/dashboard"]',
    expectedUrl: `${BASE_URL}/dashboard`,
    description: 'Navigation to dashboard page'
  },
  {
    name: 'Trades',
    selector: 'a[href="/trades"]',
    expectedUrl: `${BASE_URL}/trades`,
    description: 'Navigation to trades list page'
  },
  {
    name: 'Log Trade',
    selector: 'a[href="/log-trade"]',
    expectedUrl: `${BASE_URL}/log-trade`,
    description: 'Navigation to trade logging page'
  },
  {
    name: 'Calendar',
    selector: 'a[href="/calendar"]',
    expectedUrl: `${BASE_URL}/calendar`,
    description: 'Navigation to calendar page'
  },
  {
    name: 'Strategy',
    selector: 'a[href="/strategies"]',
    expectedUrl: `${BASE_URL}/strategies`,
    description: 'Navigation to strategies management page'
  },
  {
    name: 'Confluence',
    selector: 'a[href="/confluence"]',
    expectedUrl: `${BASE_URL}/confluence`,
    description: 'Navigation to confluence page'
  },
  {
    name: 'Settings',
    selector: 'a[href="/settings"]',
    expectedUrl: `${BASE_URL}/settings`,
    description: 'Navigation to settings page'
  }
];

class DashboardNavigationTest {
  constructor() {
    this.browser = null;
    this.page = null;
    this.testResults = {
      summary: {
        totalTests: 0,
        passedTests: 0,
        failedTests: 0,
        startTime: new Date().toISOString(),
        endTime: null
      },
      buttonTests: [],
      visualTests: [],
      keyboardTests: [],
      authenticationTests: [],
      consoleErrors: []
    };
  }

  async initialize() {
    console.log('🚀 Initializing Dashboard Navigation Test...');
    
    this.browser = await puppeteer.launch({
      headless: false, // Set to false for visual debugging
      defaultViewport: { width: 1920, height: 1080 },
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    this.page = await this.browser.newPage();
    
    // Enable console logging
    this.page.on('console', msg => {
      const logEntry = {
        timestamp: new Date().toISOString(),
        type: msg.type(),
        text: msg.text()
      };
      
      if (msg.type() === 'error') {
        this.testResults.consoleErrors.push(logEntry);
        console.log(`🔴 Console Error: ${msg.text()}`);
      } else if (msg.type() === 'warning') {
        console.log(`🟡 Console Warning: ${msg.text()}`);
      }
    });

    // Enable network monitoring
    this.page.on('response', response => {
      if (response.status() >= 400) {
        console.log(`🔴 Network Error: ${response.url()} - ${response.status()}`);
      }
    });

    console.log('✅ Browser initialized successfully');
  }

  async navigateToDashboard() {
    console.log('📍 Navigating to dashboard...');
    
    try {
      const response = await this.page.goto(DASHBOARD_URL, { 
        waitUntil: 'networkidle2',
        timeout: 30000 
      });
      
      const status = response.status();
      console.log(`📊 Dashboard response status: ${status}`);
      
      if (status !== 200) {
        throw new Error(`Dashboard returned status ${status}`);
      }

      // Wait for dashboard to load
      await this.page.waitForSelector('body', { timeout: 10000 });
      
      // Take a screenshot
      await this.page.screenshot({ 
        path: 'dashboard-navigation-test-initial-state.png',
        fullPage: true 
      });
      
      console.log('✅ Dashboard loaded successfully');
      return true;
    } catch (error) {
      console.error(`❌ Failed to load dashboard: ${error.message}`);
      return false;
    }
  }

  async testNavigationButton(buttonConfig) {
    console.log(`🔍 Testing "${buttonConfig.name}" button...`);
    
    const testResult = {
      name: buttonConfig.name,
      selector: buttonConfig.selector,
      expectedUrl: buttonConfig.expectedUrl,
      description: buttonConfig.description,
      passed: false,
      actualUrl: null,
      httpStatus: null,
      loadTime: null,
      error: null,
      details: {}
    };

    try {
      // Check if button exists
      const buttonExists = await this.page.$(buttonConfig.selector);
      if (!buttonExists) {
        throw new Error(`Button not found with selector: ${buttonConfig.selector}`);
      }

      // Check if button is visible
      const isVisible = await this.page.evaluate((selector) => {
        const element = document.querySelector(selector);
        return element && element.offsetParent !== null;
      }, buttonConfig.selector);

      testResult.details.visible = isVisible;

      // Get button text content
      const buttonText = await this.page.evaluate((selector) => {
        const element = document.querySelector(selector);
        return element ? element.textContent.trim() : '';
      }, buttonConfig.selector);

      testResult.details.buttonText = buttonText;

      // Test hover effects
      await this.page.hover(buttonConfig.selector);
      await this.page.waitForTimeout(500); // Wait for hover effects
      
      // Check if button has hover styles
      const hasHoverStyles = await this.page.evaluate((selector) => {
        const element = document.querySelector(selector);
        if (!element) return false;
        
        const styles = window.getComputedStyle(element);
        return styles.cursor === 'pointer' || styles.transition !== 'none';
      }, buttonConfig.selector);

      testResult.details.hasHoverStyles = hasHoverStyles;

      // Measure navigation start time
      const startTime = Date.now();

      // Click the button
      await Promise.all([
        this.page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 }),
        this.page.click(buttonConfig.selector)
      ]);

      // Measure navigation end time
      const endTime = Date.now();
      testResult.loadTime = endTime - startTime;

      // Get current URL
      testResult.actualUrl = this.page.url();

      // Check if URL matches expected
      const urlMatches = testResult.actualUrl === buttonConfig.expectedUrl;
      testResult.details.urlMatches = urlMatches;

      // Get HTTP status of the target page
      const response = await this.page.goto(testResult.actualUrl, { waitUntil: 'networkidle2' });
      testResult.httpStatus = response.status();

      // Check if page loaded successfully
      const pageLoaded = testResult.httpStatus === 200;
      testResult.details.pageLoaded = pageLoaded;

      // Take screenshot of the target page
      const screenshotName = `navigation-test-${buttonConfig.name.toLowerCase().replace(/\s+/g, '-')}.png`;
      await this.page.screenshot({ 
        path: screenshotName,
        fullPage: true 
      });
      testResult.details.screenshot = screenshotName;

      // Check if page has proper content
      const hasContent = await this.page.evaluate(() => {
        return document.body && document.body.innerText.length > 100;
      });
      testResult.details.hasContent = hasContent;

      // Determine if test passed
      testResult.passed = urlMatches && pageLoaded && isVisible && hasContent;

      console.log(`${testResult.passed ? '✅' : '❌'} "${buttonConfig.name}" test completed`);

    } catch (error) {
      testResult.error = error.message;
      console.log(`❌ "${buttonConfig.name}" test failed: ${error.message}`);
    }

    return testResult;
  }

  async testKeyboardNavigation() {
    console.log('⌨️ Testing keyboard navigation...');
    
    const keyboardTestResults = [];

    for (const buttonConfig of NAVIGATION_BUTTONS) {
      console.log(`⌨️ Testing keyboard navigation for "${buttonConfig.name}"...`);
      
      const keyboardResult = {
        name: buttonConfig.name,
        selector: buttonConfig.selector,
        expectedUrl: buttonConfig.expectedUrl,
        passed: false,
        error: null,
        details: {}
      };

      try {
        // Navigate back to dashboard
        await this.page.goto(DASHBOARD_URL, { waitUntil: 'networkidle2' });
        
        // Tab to the button
        let elementFocused = false;
        let tabCount = 0;
        const maxTabs = 50; // Prevent infinite loop
        
        while (!elementFocused && tabCount < maxTabs) {
          await this.page.keyboard.press('Tab');
          await new Promise(resolve => setTimeout(resolve, 100));
          
          const focusedElement = await this.page.evaluate(() => document.activeElement);
          const matchesSelector = await this.page.evaluate((selector) => {
            const focused = document.activeElement;
            return focused && focused.matches(selector);
          }, buttonConfig.selector);
          
          if (matchesSelector) {
            elementFocused = true;
            keyboardResult.details.tabCount = tabCount;
          }
          
          tabCount++;
        }

        if (!elementFocused) {
          throw new Error(`Could not focus button with ${tabCount} tabs`);
        }

        // Test Enter key
        const currentUrl = this.page.url();
        await this.page.keyboard.press('Enter');
        await this.page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 });
        
        const newUrl = this.page.url();
        keyboardResult.details.urlChanged = newUrl !== currentUrl;
        keyboardResult.details.finalUrl = newUrl;
        
        // Check if navigation was successful
        keyboardResult.passed = newUrl === buttonConfig.expectedUrl;
        
        console.log(`${keyboardResult.passed ? '✅' : '❌'} Keyboard navigation for "${buttonConfig.name}" ${keyboardResult.passed ? 'passed' : 'failed'}`);
        
      } catch (error) {
        keyboardResult.error = error.message;
        console.log(`❌ Keyboard navigation for "${buttonConfig.name}" failed: ${error.message}`);
      }
      
      keyboardTestResults.push(keyboardResult);
    }

    return keyboardTestResults;
  }

  async testAuthenticationState() {
    console.log('🔐 Testing authentication state during navigation...');
    
    const authTestResults = [];

    for (const buttonConfig of NAVIGATION_BUTTONS) {
      console.log(`🔐 Testing auth state for "${buttonConfig.name}" navigation...`);
      
      const authResult = {
        name: buttonConfig.name,
        selector: buttonConfig.selector,
        expectedUrl: buttonConfig.expectedUrl,
        passed: false,
        error: null,
        details: {}
      };

      try {
        // Navigate to dashboard
        await this.page.goto(DASHBOARD_URL, { waitUntil: 'networkidle2' });
        
        // Check initial auth state
        const initialAuthState = await this.page.evaluate(() => {
          // Check for auth indicators (user menu, logout button, etc.)
          const logoutButton = document.querySelector('button[onclick*="logout"], button[data-testid="logout"], .logout-btn');
          const userMenu = document.querySelector('.user-menu, [data-testid="user-menu"], .user-profile');
          return {
            hasLogoutButton: !!logoutButton,
            hasUserMenu: !!userMenu,
            isAuthenticated: !!(logoutButton || userMenu)
          };
        });

        authResult.details.initialAuthState = initialAuthState;

        // Navigate to target page
        await this.page.click(buttonConfig.selector);
        await this.page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 });
        
        // Check auth state after navigation
        const finalAuthState = await this.page.evaluate(() => {
          const logoutButton = document.querySelector('button[onclick*="logout"], button[data-testid="logout"], .logout-btn');
          const userMenu = document.querySelector('.user-menu, [data-testid="user-menu"], .user-profile');
          return {
            hasLogoutButton: !!logoutButton,
            hasUserMenu: !!userMenu,
            isAuthenticated: !!(logoutButton || userMenu)
          };
        });

        authResult.details.finalAuthState = finalAuthState;
        
        // Check if auth state is maintained
        const authStateMaintained = initialAuthState.isAuthenticated === finalAuthState.isAuthenticated;
        authResult.details.authStateMaintained = authStateMaintained;
        
        // Check if we're not redirected to login page
        const notRedirectedToLogin = !this.page.url().includes('/login');
        authResult.details.notRedirectedToLogin = notRedirectedToLogin;
        
        authResult.passed = authStateMaintained && notRedirectedToLogin;
        
        console.log(`${authResult.passed ? '✅' : '❌'} Auth state for "${buttonConfig.name}" ${authResult.passed ? 'maintained' : 'not maintained'}`);
        
      } catch (error) {
        authResult.error = error.message;
        console.log(`❌ Auth state test for "${buttonConfig.name}" failed: ${error.message}`);
      }
      
      authTestResults.push(authResult);
    }

    return authTestResults;
  }

  async runAllTests() {
    console.log('🧪 Starting comprehensive navigation tests...');
    
    try {
      // Initialize browser
      await this.initialize();
      
      // Navigate to dashboard
      const dashboardLoaded = await this.navigateToDashboard();
      if (!dashboardLoaded) {
        throw new Error('Failed to load dashboard');
      }

      // Test each navigation button
      console.log('\n🔘 Testing navigation buttons...');
      for (const buttonConfig of NAVIGATION_BUTTONS) {
        const result = await this.testNavigationButton(buttonConfig);
        this.testResults.buttonTests.push(result);
        this.testResults.summary.totalTests++;
        if (result.passed) {
          this.testResults.summary.passedTests++;
        } else {
          this.testResults.summary.failedTests++;
        }
        
        // Return to dashboard for next test
        await this.page.goto(DASHBOARD_URL, { waitUntil: 'networkidle2' });
      }

      // Test keyboard navigation
      console.log('\n⌨️ Testing keyboard navigation...');
      const keyboardResults = await this.testKeyboardNavigation();
      this.testResults.keyboardTests = keyboardResults;
      this.testResults.summary.totalTests += keyboardResults.length;
      this.testResults.summary.passedTests += keyboardResults.filter(r => r.passed).length;
      this.testResults.summary.failedTests += keyboardResults.filter(r => !r.passed).length;

      // Test authentication state
      console.log('\n🔐 Testing authentication state...');
      const authResults = await this.testAuthenticationState();
      this.testResults.authenticationTests = authResults;
      this.testResults.summary.totalTests += authResults.length;
      this.testResults.summary.passedTests += authResults.filter(r => r.passed).length;
      this.testResults.summary.failedTests += authResults.filter(r => !r.passed).length;

      this.testResults.summary.endTime = new Date().toISOString();

    } catch (error) {
      console.error(`❌ Test execution failed: ${error.message}`);
      this.testResults.error = error.message;
    } finally {
      if (this.browser) {
        await this.browser.close();
      }
    }
  }

  generateReport() {
    console.log('\n📊 Generating test report...');
    
    const report = {
      ...this.testResults,
      generatedAt: new Date().toISOString(),
      testDuration: this.testResults.summary.endTime ? 
        new Date(this.testResults.summary.endTime) - new Date(this.testResults.summary.startTime) : 
        null
    };

    // Save detailed report as JSON
    fs.writeFileSync(
      'dashboard-navigation-test-report.json',
      JSON.stringify(report, null, 2)
    );

    // Generate markdown report
    const markdownReport = this.generateMarkdownReport(report);
    fs.writeFileSync(
      'dashboard-navigation-test-report.md',
      markdownReport
    );

    console.log('📄 Reports saved:');
    console.log('  - dashboard-navigation-test-report.json');
    console.log('  - dashboard-navigation-test-report.md');

    return report;
  }

  generateMarkdownReport(report) {
    const { summary, buttonTests, keyboardTests, authenticationTests, consoleErrors } = report;
    
    let markdown = `# Dashboard Navigation Test Report\n\n`;
    markdown += `**Generated:** ${new Date(report.generatedAt).toLocaleString()}\n\n`;
    
    // Summary section
    markdown += `## 📊 Test Summary\n\n`;
    markdown += `- **Total Tests:** ${summary.totalTests}\n`;
    markdown += `- **Passed:** ${summary.passedTests} ✅\n`;
    markdown += `- **Failed:** ${summary.failedTests} ❌\n`;
    markdown += `- **Success Rate:** ${summary.totalTests > 0 ? ((summary.passedTests / summary.totalTests) * 100).toFixed(1) : 0}%\n`;
    if (report.testDuration) {
      markdown += `- **Test Duration:** ${(report.testDuration / 1000).toFixed(2)} seconds\n`;
    }
    markdown += `\n`;

    // Navigation button tests
    markdown += `## 🔘 Navigation Button Tests\n\n`;
    buttonTests.forEach(test => {
      markdown += `### ${test.name}\n\n`;
      markdown += `- **Status:** ${test.passed ? '✅ PASSED' : '❌ FAILED'}\n`;
      markdown += `- **Selector:** \`${test.selector}\`\n`;
      markdown += `- **Expected URL:** ${test.expectedUrl}\n`;
      markdown += `- **Actual URL:** ${test.actualUrl}\n`;
      markdown += `- **HTTP Status:** ${test.httpStatus}\n`;
      markdown += `- **Load Time:** ${test.loadTime}ms\n`;
      markdown += `- **Visible:** ${test.details.visible ? '✅' : '❌'}\n`;
      markdown += `- **Button Text:** "${test.details.buttonText}"\n`;
      markdown += `- **Has Hover Styles:** ${test.details.hasHoverStyles ? '✅' : '❌'}\n`;
      markdown += `- **URL Matches:** ${test.details.urlMatches ? '✅' : '❌'}\n`;
      markdown += `- **Page Loaded:** ${test.details.pageLoaded ? '✅' : '❌'}\n`;
      markdown += `- **Has Content:** ${test.details.hasContent ? '✅' : '❌'}\n`;
      if (test.error) {
        markdown += `- **Error:** ${test.error}\n`;
      }
      if (test.details.screenshot) {
        markdown += `- **Screenshot:** ${test.details.screenshot}\n`;
      }
      markdown += `\n`;
    });

    // Keyboard navigation tests
    markdown += `## ⌨️ Keyboard Navigation Tests\n\n`;
    keyboardTests.forEach(test => {
      markdown += `### ${test.name}\n\n`;
      markdown += `- **Status:** ${test.passed ? '✅ PASSED' : '❌ FAILED'}\n`;
      markdown += `- **Tab Count to Focus:** ${test.details.tabCount}\n`;
      markdown += `- **URL Changed:** ${test.details.urlChanged ? '✅' : '❌'}\n`;
      markdown += `- **Final URL:** ${test.details.finalUrl}\n`;
      if (test.error) {
        markdown += `- **Error:** ${test.error}\n`;
      }
      markdown += `\n`;
    });

    // Authentication state tests
    markdown += `## 🔐 Authentication State Tests\n\n`;
    authenticationTests.forEach(test => {
      markdown += `### ${test.name}\n\n`;
      markdown += `- **Status:** ${test.passed ? '✅ PASSED' : '❌ FAILED'}\n`;
      markdown += `- **Auth State Maintained:** ${test.details.authStateMaintained ? '✅' : '❌'}\n`;
      markdown += `- **Not Redirected to Login:** ${test.details.notRedirectedToLogin ? '✅' : '❌'}\n`;
      markdown += `- **Initial Auth State:** ${JSON.stringify(test.details.initialAuthState)}\n`;
      markdown += `- **Final Auth State:** ${JSON.stringify(test.details.finalAuthState)}\n`;
      if (test.error) {
        markdown += `- **Error:** ${test.error}\n`;
      }
      markdown += `\n`;
    });

    // Console errors
    if (consoleErrors.length > 0) {
      markdown += `## 🔴 Console Errors\n\n`;
      consoleErrors.forEach(error => {
        markdown += `- **${error.type.toUpperCase()}** (${error.timestamp}): ${error.text}\n`;
      });
      markdown += `\n`;
    }

    // Conclusion
    markdown += `## 🎯 Conclusion\n\n`;
    if (summary.failedTests === 0) {
      markdown += `🎉 All navigation tests passed! The dashboard navigation is working correctly.\n`;
    } else {
      markdown += `⚠️ ${summary.failedTests} test(s) failed. Please review the issues above.\n`;
    }

    return markdown;
  }
}

// Run the tests
async function main() {
  const test = new DashboardNavigationTest();
  await test.runAllTests();
  const report = test.generateReport();
  
  console.log('\n🎉 Dashboard Navigation Testing Complete!');
  console.log(`📊 Results: ${report.summary.passedTests}/${report.summary.totalTests} tests passed`);
  
  if (report.summary.failedTests > 0) {
    console.log(`❌ ${report.summary.failedTests} tests failed - check the report for details`);
    process.exit(1);
  } else {
    console.log('✅ All tests passed successfully!');
    process.exit(0);
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Run the main function
if (require.main === module) {
  main().catch(error => {
    console.error('Test execution failed:', error);
    process.exit(1);
  });
}

module.exports = DashboardNavigationTest;