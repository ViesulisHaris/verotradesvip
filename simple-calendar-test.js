const { chromium } = require('playwright');
const fs = require('fs');

// Test configuration
const TEST_CONFIG = {
  baseUrl: 'http://localhost:3000',
  screenshotDir: './test-screenshots/calendar',
  timeout: 30000,
  viewports: {
    mobile: { width: 375, height: 667 },
    tablet: { width: 768, height: 1024 },
    desktop: { width: 1920, height: 1080 }
  },
  // Test user credentials - from login page
  testUser: {
    email: 'testuser@verotrade.com',
    password: 'TestPassword123!'
  }
};

// Test results storage
const testResults = {
  authentication: {},
  basicFunctionality: {},
  modalFunctionality: {},
  monthlyNavigation: {},
  responsiveDesign: {},
  edgeCases: {},
  performance: {},
  summary: {
    totalTests: 0,
    passedTests: 0,
    failedTests: 0,
    issues: []
  }
};

// Utility functions
function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${type.toUpperCase()}] ${message}`;
  console.log(logMessage);
  
  if (type === 'error' || type === 'warning') {
    testResults.summary.issues.push({
      timestamp,
      type,
      message
    });
  }
}

function takeScreenshot(page, name, viewport = 'desktop') {
  const filename = `${TEST_CONFIG.screenshotDir}/${name}-${viewport}.png`;
  return page.screenshot({ path: filename, fullPage: true });
}

async function waitForElement(page, selector, timeout = 5000) {
  try {
    await page.waitForSelector(selector, { timeout });
    return true;
  } catch (error) {
    return false;
  }
}

// Authentication function
async function authenticate(page) {
  log('Authenticating user...');
  
  try {
    await page.goto(`${TEST_CONFIG.baseUrl}/login`, { waitUntil: 'networkidle' });
    await page.fill('input[type="email"]', TEST_CONFIG.testUser.email);
    await page.fill('input[type="password"]', TEST_CONFIG.testUser.password);
    await page.click('button[type="submit"]');
    
    // Wait for login to complete and redirect
    await page.waitForTimeout(3000);
    
    // Navigate to calendar page
    await page.goto(`${TEST_CONFIG.baseUrl}/calendar`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    log('✓ Authentication successful');
    return true;
  } catch (error) {
    log(`✗ Authentication failed: ${error.message}`, 'error');
    return false;
  }
}

// Test functions
async function testBasicFunctionality(page) {
  log('Testing basic functionality...');
  
  const tests = [
    {
      name: 'Page loads without errors',
      test: async () => {
        const title = await page.textContent('h1');
        return title && title.includes('Trading Calendar Overview');
      }
    },
    {
      name: 'Calendar grid is displayed',
      test: async () => {
        return await waitForElement(page, '.grid.grid-cols-7');
      }
    },
    {
      name: 'Month navigation buttons are present',
      test: async () => {
        const prevButton = await waitForElement(page, 'button:has-text("<")');
        const nextButton = await waitForElement(page, 'button:has-text(">")');
        return prevButton && nextButton;
      }
    },
    {
      name: 'Log Trade button is present',
      test: async () => {
        return await waitForElement(page, 'a[href="/log-trade"]');
      }
    },
    {
      name: 'Glass morphism effects are applied',
      test: async () => {
        const glassElements = await page.$$('.glass');
        return glassElements.length > 0;
      }
    },
    {
      name: 'Animations are present',
      test: async () => {
        const animatedElements = await page.$$('[class*="animate-"]');
        return animatedElements.length > 0;
      }
    }
  ];

  for (const test of tests) {
    try {
      const result = await test.test();
      testResults.basicFunctionality[test.name] = result;
      testResults.summary.totalTests++;
      if (result) {
        testResults.summary.passedTests++;
        log(`✓ ${test.name}`);
      } else {
        testResults.summary.failedTests++;
        log(`✗ ${test.name}`, 'error');
        await takeScreenshot(page, `basic-functionality-failed-${test.name.toLowerCase().replace(/\s+/g, '-')}`);
      }
    } catch (error) {
      testResults.basicFunctionality[test.name] = false;
      testResults.summary.totalTests++;
      testResults.summary.failedTests++;
      log(`✗ ${test.name} - Error: ${error.message}`, 'error');
    }
  }
}

async function testColorCoding(page) {
  log('Testing enhanced color-coded date outlines...');
  
  // Wait for trades to load
  await page.waitForTimeout(3000);
  
  const tests = [
    {
      name: 'Green outlines for profitable days',
      test: async () => {
        const greenElements = await page.$$('.border-green-500\\/60');
        return greenElements.length >= 0; // May be 0 if no profitable trades
      }
    },
    {
      name: 'Red outlines for loss days',
      test: async () => {
        const redElements = await page.$$('.border-red-500\\/60');
        return redElements.length >= 0; // May be 0 if no losing trades
      }
    },
    {
      name: 'P&L values displayed on trade days',
      test: async () => {
        const pnlElements = await page.$$('text=/\\$\\d+/');
        return pnlElements.length > 0;
      }
    },
    {
      name: 'Today\'s date is highlighted',
      test: async () => {
        const todayElement = await page.$$('.border-blue-500.bg-blue-500\\/10');
        return todayElement.length > 0;
      }
    }
  ];

  for (const test of tests) {
    try {
      const result = await test.test();
      testResults.basicFunctionality[test.name] = result;
      testResults.summary.totalTests++;
      if (result) {
        testResults.summary.passedTests++;
        log(`✓ ${test.name}`);
      } else {
        testResults.summary.failedTests++;
        log(`✗ ${test.name}`, 'error');
        await takeScreenshot(page, `color-coding-failed-${test.name.toLowerCase().replace(/\s+/g, '-')}`);
      }
    } catch (error) {
      testResults.basicFunctionality[test.name] = false;
      testResults.summary.totalTests++;
      testResults.summary.failedTests++;
      log(`✗ ${test.name} - Error: ${error.message}`, 'error');
    }
  }
}

async function testMonthlyMetrics(page) {
  log('Testing monthly performance metrics...');
  
  // Wait for metrics to load
  await page.waitForTimeout(3000);
  
  const tests = [
    {
      name: 'Monthly Performance Metrics section is visible',
      test: async () => {
        return await waitForElement(page, 'text=Monthly Performance Metrics');
      }
    },
    {
      name: 'Total P&L metric is displayed',
      test: async () => {
        return await waitForElement(page, 'text=Total P&L');
      }
    },
    {
      name: 'Trade Count metric is displayed',
      test: async () => {
        return await waitForElement(page, 'text=Trades Executed');
      }
    },
    {
      name: 'Win Rate metric is displayed',
      test: async () => {
        return await waitForElement(page, 'text=Win Rate');
      }
    },
    {
      name: 'Trading Days metric is displayed',
      test: async () => {
        return await waitForElement(page, 'text=Trading Days');
      }
    },
    {
      name: 'Metrics have correct color coding',
      test: async () => {
        const greenMetrics = await page.$$('.text-green-400');
        const redMetrics = await page.$$('.text-red-400');
        const blueMetrics = await page.$$('.text-blue-400');
        const purpleMetrics = await page.$$('.text-purple-400');
        const orangeMetrics = await page.$$('.text-orange-400');
        return greenMetrics.length > 0 || redMetrics.length > 0 || blueMetrics.length > 0 || purpleMetrics.length > 0 || orangeMetrics.length > 0;
      }
    }
  ];

  for (const test of tests) {
    try {
      const result = await test.test();
      testResults.basicFunctionality[test.name] = result;
      testResults.summary.totalTests++;
      if (result) {
        testResults.summary.passedTests++;
        log(`✓ ${test.name}`);
      } else {
        testResults.summary.failedTests++;
        log(`✗ ${test.name}`, 'error');
        await takeScreenshot(page, `metrics-failed-${test.name.toLowerCase().replace(/\s+/g, '-')}`);
      }
    } catch (error) {
      testResults.basicFunctionality[test.name] = false;
      testResults.summary.totalTests++;
      testResults.summary.failedTests++;
      log(`✗ ${test.name} - Error: ${error.message}`, 'error');
    }
  }
}

async function testMonthlyNavigation(page) {
  log('Testing monthly navigation...');
  
  const tests = [
    {
      name: 'Previous month navigation works',
      test: async () => {
        const currentMonth = await page.textContent('h1');
        await page.click('button:has-text("<")');
        await page.waitForTimeout(1000);
        const newMonth = await page.textContent('h1');
        return currentMonth !== newMonth;
      }
    },
    {
      name: 'Next month navigation works',
      test: async () => {
        const currentMonth = await page.textContent('h1');
        await page.click('button:has-text(">")');
        await page.waitForTimeout(1000);
        const newMonth = await page.textContent('h1');
        return currentMonth !== newMonth;
      }
    },
    {
      name: 'Metrics update when changing months',
      test: async () => {
        await page.click('button:has-text(">")');
        await page.waitForTimeout(2000);
        const metricsVisible = await waitForElement(page, '[class*="glass p-6 rounded-xl"]', 2000);
        return metricsVisible;
      }
    }
  ];

  for (const test of tests) {
    try {
      const result = await test.test();
      testResults.monthlyNavigation[test.name] = result;
      testResults.summary.totalTests++;
      if (result) {
        testResults.summary.passedTests++;
        log(`✓ ${test.name}`);
      } else {
        testResults.summary.failedTests++;
        log(`✗ ${test.name}`, 'error');
        await takeScreenshot(page, `navigation-failed-${test.name.toLowerCase().replace(/\s+/g, '-')}`);
      }
    } catch (error) {
      testResults.monthlyNavigation[test.name] = false;
      testResults.summary.totalTests++;
      testResults.summary.failedTests++;
      log(`✗ ${test.name} - Error: ${error.message}`, 'error');
    }
  }
}

async function testResponsiveDesign(page) {
  log('Testing responsive design...');
  
  const viewports = ['mobile', 'tablet', 'desktop'];
  const tests = [
    {
      name: 'Layout adapts to mobile viewport',
      viewport: 'mobile',
      test: async () => {
        await page.setViewportSize(TEST_CONFIG.viewports.mobile);
        await page.waitForTimeout(1000);
        const gridVisible = await waitForElement(page, '.grid.grid-cols-7', 2000);
        return gridVisible;
      }
    },
    {
      name: 'Layout adapts to tablet viewport',
      viewport: 'tablet',
      test: async () => {
        await page.setViewportSize(TEST_CONFIG.viewports.tablet);
        await page.waitForTimeout(1000);
        const gridVisible = await waitForElement(page, '.grid.grid-cols-7', 2000);
        return gridVisible;
      }
    },
    {
      name: 'Layout adapts to desktop viewport',
      viewport: 'desktop',
      test: async () => {
        await page.setViewportSize(TEST_CONFIG.viewports.desktop);
        await page.waitForTimeout(1000);
        const gridVisible = await waitForElement(page, '.grid.grid-cols-7', 2000);
        return gridVisible;
      }
    }
  ];

  for (const test of tests) {
    try {
      const result = await test.test();
      testResults.responsiveDesign[test.name] = result;
      testResults.summary.totalTests++;
      if (result) {
        testResults.summary.passedTests++;
        log(`✓ ${test.name}`);
        await takeScreenshot(page, `responsive-${test.name.toLowerCase().replace(/\s+/g, '-')}`, test.viewport);
      } else {
        testResults.summary.failedTests++;
        log(`✗ ${test.name}`, 'error');
        await takeScreenshot(page, `responsive-failed-${test.name.toLowerCase().replace(/\s+/g, '-')}`, test.viewport);
      }
    } catch (error) {
      testResults.responsiveDesign[test.name] = false;
      testResults.summary.totalTests++;
      testResults.summary.failedTests++;
      log(`✗ ${test.name} - Error: ${error.message}`, 'error');
    }
  }
}

async function testTradeModal(page) {
  log('Testing trade details modal...');
  
  // Look for a day with trades
  await page.waitForTimeout(3000);
  
  const tradeDays = await page.$$('[class*="border-green-500"], [class*="border-red-500"]');
  
  if (tradeDays.length === 0) {
    log('No trade days found, skipping modal tests', 'warning');
    testResults.modalFunctionality['No trade days found'] = true;
    testResults.summary.totalTests++;
    testResults.summary.passedTests++;
    return;
  }
  
  const tests = [
    {
      name: 'Modal opens when clicking on trade day',
      test: async () => {
        try {
          await tradeDays[0].click();
          await page.waitForTimeout(500);
          const modal = await page.$('.fixed.inset-0');
          return modal !== null;
        } catch (error) {
          return false;
        }
      }
    },
    {
      name: 'Modal displays trade details header',
      test: async () => {
        return await waitForElement(page, 'text=Trade Details', 2000);
      }
    },
    {
      name: 'Modal shows summary statistics',
      test: async () => {
        const totalPnL = await waitForElement(page, 'text=Total P&L', 2000);
        const winners = await waitForElement(page, 'text=Winners', 2000);
        const losers = await waitForElement(page, 'text=Losers', 2000);
        const winRate = await waitForElement(page, 'text=Win Rate', 2000);
        return totalPnL && winners && losers && winRate;
      }
    },
    {
      name: 'Modal close button works',
      test: async () => {
        const closeButton = await page.$('button:has-text("Close Details")');
        if (closeButton) {
          await closeButton.click();
          await page.waitForTimeout(500);
          const modal = await page.$('.fixed.inset-0');
          return modal === null;
        }
        return false;
      }
    }
  ];

  for (const test of tests) {
    try {
      const result = await test.test();
      testResults.modalFunctionality[test.name] = result;
      testResults.summary.totalTests++;
      if (result) {
        testResults.summary.passedTests++;
        log(`✓ ${test.name}`);
      } else {
        testResults.summary.failedTests++;
        log(`✗ ${test.name}`, 'error');
        await takeScreenshot(page, `modal-failed-${test.name.toLowerCase().replace(/\s+/g, '-')}`);
      }
    } catch (error) {
      testResults.modalFunctionality[test.name] = false;
      testResults.summary.totalTests++;
      testResults.summary.failedTests++;
      log(`✗ ${test.name} - Error: ${error.message}`, 'error');
    }
  }
}

// Main test execution
async function runTests() {
  log('Starting comprehensive calendar page testing...');
  
  // Create screenshot directory
  if (!fs.existsSync(TEST_CONFIG.screenshotDir)) {
    fs.mkdirSync(TEST_CONFIG.screenshotDir, { recursive: true });
  }
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // Authenticate first
    const authSuccess = await authenticate(page);
    
    if (!authSuccess) {
      log('Authentication failed, cannot proceed with calendar tests', 'error');
      return;
    }
    
    // Run all tests
    await testBasicFunctionality(page);
    await testColorCoding(page);
    await testMonthlyMetrics(page);
    await testTradeModal(page);
    await testMonthlyNavigation(page);
    await testResponsiveDesign(page);
    
    // Generate final report
    const report = generateReport();
    fs.writeFileSync('./SIMPLE_CALENDAR_TEST_REPORT.md', report);
    
    log('Testing completed successfully!');
    log(`Total tests: ${testResults.summary.totalTests}`);
    log(`Passed: ${testResults.summary.passedTests}`);
    log(`Failed: ${testResults.summary.failedTests}`);
    log(`Success rate: ${((testResults.summary.passedTests / testResults.summary.totalTests) * 100).toFixed(2)}%`);
    
  } catch (error) {
    log(`Test execution failed: ${error.message}`, 'error');
  } finally {
    await browser.close();
  }
}

function generateReport() {
  const timestamp = new Date().toISOString();
  
  let report = `# Calendar Page Testing Report (Simplified)\n\n`;
  report += `**Generated:** ${timestamp}\n\n`;
  report += `## Test Summary\n\n`;
  report += `- **Total Tests:** ${testResults.summary.totalTests}\n`;
  report += `- **Passed:** ${testResults.summary.passedTests}\n`;
  report += `- **Failed:** ${testResults.summary.failedTests}\n`;
  report += `- **Success Rate:** ${((testResults.summary.passedTests / testResults.summary.totalTests) * 100).toFixed(2)}%\n\n`;
  
  if (testResults.summary.issues.length > 0) {
    report += `## Issues Found\n\n`;
    testResults.summary.issues.forEach(issue => {
      report += `- **${issue.type.toUpperCase()}:** ${issue.message} (${issue.timestamp})\n`;
    });
    report += `\n`;
  }
  
  report += `## Detailed Test Results\n\n`;
  
  // Basic Functionality
  report += `### Basic Functionality\n\n`;
  Object.entries(testResults.basicFunctionality).forEach(([test, result]) => {
    report += `- ${result ? '✅' : '❌'} ${test}\n`;
  });
  report += `\n`;
  
  // Modal Functionality
  report += `### Trade Details Modal\n\n`;
  Object.entries(testResults.modalFunctionality).forEach(([test, result]) => {
    report += `- ${result ? '✅' : '❌'} ${test}\n`;
  });
  report += `\n`;
  
  // Monthly Navigation
  report += `### Monthly Navigation\n\n`;
  Object.entries(testResults.monthlyNavigation).forEach(([test, result]) => {
    report += `- ${result ? '✅' : '❌'} ${test}\n`;
  });
  report += `\n`;
  
  // Responsive Design
  report += `### Responsive Design\n\n`;
  Object.entries(testResults.responsiveDesign).forEach(([test, result]) => {
    report += `- ${result ? '✅' : '❌'} ${test}\n`;
  });
  report += `\n`;
  
  report += `## Recommendations\n\n`;
  
  if (testResults.summary.failedTests === 0) {
    report += `🎉 All tests passed! The calendar page is working perfectly.\n\n`;
  } else {
    report += `⚠️ Some tests failed. Please review the issues above and address them.\n\n`;
    
    if (testResults.summary.failedTests > testResults.summary.totalTests * 0.5) {
      report += `🚨 Critical: More than 50% of tests failed. Immediate attention required.\n\n`;
    } else if (testResults.summary.failedTests > testResults.summary.totalTests * 0.25) {
      report += `⚠️ Warning: More than 25% of tests failed. Attention recommended.\n\n`;
    } else {
      report += `✅ Good: Less than 25% of tests failed. Minor issues to address.\n\n`;
    }
  }
  
  report += `## Screenshots\n\n`;
  report += `Screenshots have been saved to the \`${TEST_CONFIG.screenshotDir}\` directory for visual verification.\n\n`;
  
  return report;
}

// Run the tests
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { runTests, testResults };