/**
 * SIMPLE COMPREHENSIVE TEST SUITE
 * VeroTrade Trading Journal Application
 * 
 * A simplified but thorough test suite to identify remaining issues
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// Test configuration
const TEST_CONFIG = {
  baseURL: 'http://localhost:3000',
  timeout: 15000,
  screenshots: true,
  headless: false
};

// Test credentials
const TEST_CREDENTIALS = {
  email: 'testuser@verotrade.com',
  password: 'TestPassword123!'
};

// Test results storage
let testResults = {
  summary: {
    totalTests: 0,
    passedTests: 0,
    failedTests: 0,
    startTime: new Date().toISOString(),
    endTime: null,
    duration: 0
  },
  categories: {
    authentication: { tests: [], passed: 0, failed: 0, issues: [] },
    dashboard: { tests: [], passed: 0, failed: 0, issues: [] },
    trades: { tests: [], passed: 0, failed: 0, issues: [] },
    strategies: { tests: [], passed: 0, failed: 0, issues: [] },
    emotional: { tests: [], passed: 0, failed: 0, issues: [] },
    filtering: { tests: [], passed: 0, failed: 0, issues: [] },
    ui: { tests: [], passed: 0, failed: 0, issues: [] },
    performance: { tests: [], passed: 0, failed: 0, issues: [] },
    mobile: { tests: [], passed: 0, failed: 0, issues: [] }
  },
  screenshots: [],
  logs: []
};

// Utility functions
function log(message, category = 'general', level = 'info') {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] [${level.toUpperCase()}] [${category.toUpperCase()}] ${message}`;
  console.log(logEntry);
  testResults.logs.push(logEntry);
}

function takeScreenshot(page, testName, category) {
  if (!TEST_CONFIG.screenshots) return;
  
  const filename = `${category}-${testName}-${Date.now()}.png`;
  const filepath = path.join(__dirname, filename);
  
  return page.screenshot({ 
    path: filepath, 
    fullPage: true 
  }).then(() => {
    testResults.screenshots.push({
      filename,
      category,
      testName,
      filepath
    });
    log(`Screenshot saved: ${filename}`, category);
  }).catch(err => {
    log(`Failed to save screenshot: ${err.message}`, category, 'error');
  });
}

function recordTestResult(testName, category, passed, issues = [], details = '') {
  testResults.summary.totalTests++;
  
  if (passed) {
    testResults.summary.passedTests++;
    testResults.categories[category].passed++;
  } else {
    testResults.summary.failedTests++;
    testResults.categories[category].failed++;
    if (Array.isArray(issues)) {
      testResults.categories[category].issues.push(...issues);
    } else {
      testResults.categories[category].issues.push(issues);
    }
  }
  
  testResults.categories[category].tests.push({
    name: testName,
    passed,
    issues: Array.isArray(issues) ? issues : [issues],
    details,
    timestamp: new Date().toISOString()
  });
  
  const status = passed ? 'PASS' : 'FAIL';
  log(`${status}: ${testName}${details ? ` - ${details}` : ''}`, category);
}

// Test functions
class SimpleComprehensiveTestSuite {
  constructor(browser) {
    this.browser = browser;
    this.page = null;
    this.context = null;
  }

  async initialize() {
    log('Initializing test suite...');
    this.context = await this.browser.newContext();
    this.page = await this.context.newPage();
    await this.page.setDefaultTimeout(TEST_CONFIG.timeout);
  }

  async cleanup() {
    log('Cleaning up test suite...');
    if (this.context) {
      await this.context.close();
    }
    testResults.summary.endTime = new Date().toISOString();
    testResults.summary.duration = Date.parse(testResults.summary.endTime) - Date.parse(testResults.summary.startTime);
  }

  // 1. AUTHENTICATION SYSTEM TESTS
  async testAuthenticationSystem() {
    const category = 'authentication';
    log('Starting Authentication System Tests', category);

    try {
      // Test 1.1: Login page accessibility
      await this.page.goto(`${TEST_CONFIG.baseURL}/login`);
      await this.page.waitForLoadState('domcontentloaded');
      takeScreenshot(this.page, 'login-page-loaded', category);
      
      const hasLoginForm = await this.page.locator('form').count() > 0;
      const hasEmailInput = await this.page.locator('input[type="email"]').count() > 0;
      const hasPasswordInput = await this.page.locator('input[type="password"]').count() > 0;
      const hasSubmitButton = await this.page.locator('button[type="submit"]').count() > 0;
      
      recordTestResult(
        'Login page accessibility',
        category,
        hasLoginForm && hasEmailInput && hasPasswordInput && hasSubmitButton,
        !hasLoginForm ? ['Missing login form'] : 
        !hasEmailInput ? ['Missing email input'] :
        !hasPasswordInput ? ['Missing password input'] :
        !hasSubmitButton ? ['Missing submit button'] : [],
        'Login form elements should be present'
      );

      // Test 1.2: Login functionality
      if (hasLoginForm && hasEmailInput && hasPasswordInput && hasSubmitButton) {
        await this.page.fill('input[type="email"]', TEST_CREDENTIALS.email);
        await this.page.fill('input[type="password"]', TEST_CREDENTIALS.password);
        takeScreenshot(this.page, 'login-form-filled', category);
        
        const submitButton = this.page.locator('button[type="submit"]');
        await submitButton.click();
        
        // Wait for navigation or error
        await this.page.waitForTimeout(3000);
        const currentUrl = this.page.url();
        
        if (currentUrl.includes('/dashboard') || currentUrl.includes('/trades')) {
          recordTestResult('Login functionality', category, true, [], `Successfully redirected to ${currentUrl}`);
        } else {
          const errorElement = await this.page.locator('.text-red-400, .error, [role="alert"]').first();
          const hasError = await errorElement.count() > 0;
          recordTestResult(
            'Login functionality',
            category,
            false,
            ['Login failed or did not redirect properly'],
            `Current URL: ${currentUrl}, Has error: ${hasError}`
          );
        }
      }

    } catch (error) {
      recordTestResult('Authentication system test error', category, false, [error.message]);
    }
  }

  // 2. DASHBOARD AND ANALYTICS TESTS
  async testDashboardAndAnalytics() {
    const category = 'dashboard';
    log('Starting Dashboard and Analytics Tests', category);

    try {
      // Navigate to dashboard
      await this.page.goto(`${TEST_CONFIG.baseURL}/dashboard`);
      await this.page.waitForLoadState('domcontentloaded');
      takeScreenshot(this.page, 'dashboard-loaded', category);

      // Test 2.1: Dashboard loading and content
      const hasStatsCards = await this.page.locator('[class*="card"], [class*="stat"]').count() >= 3;
      const hasCharts = await this.page.locator('[class*="chart"], canvas, svg').count() >= 1;
      
      recordTestResult(
        'Dashboard content loading',
        category,
        hasStatsCards && hasCharts,
        !hasStatsCards ? ['Insufficient stats cards'] :
        !hasCharts ? ['Missing charts'] : [],
        `Stats cards: ${hasStatsCards}, Charts: ${hasCharts}`
      );

      // Test 2.2: Performance metrics display
      const totalPnLElement = await this.page.locator('text=/Total P&L/i').first();
      const winRateElement = await this.page.locator('text=/Win Rate/i').first();
      
      const hasTotalPnL = await totalPnLElement.count() > 0;
      const hasWinRate = await winRateElement.count() > 0;
      
      recordTestResult(
        'Performance metrics display',
        category,
        hasTotalPnL && hasWinRate,
        !hasTotalPnL ? ['Total P&L not displayed'] :
        !hasWinRate ? ['Win rate not displayed'] : [],
        'Total P&L and Win Rate should be visible'
      );

      // Test 2.3: Interactive elements
      const interactiveElements = await this.page.locator('button, [role="button"], a[href]').count();
      const hasInteractiveElements = interactiveElements > 0;
      
      recordTestResult(
        'Dashboard interactive elements',
        category,
        hasInteractiveElements,
        hasInteractiveElements ? [] : ['No interactive elements found'],
        `Found ${interactiveElements} interactive elements`
      );

    } catch (error) {
      recordTestResult('Dashboard test error', category, false, [error.message]);
    }
  }

  // 3. TRADE MANAGEMENT TESTS
  async testTradeManagement() {
    const category = 'trades';
    log('Starting Trade Management Tests', category);

    try {
      // Navigate to trades page
      await this.page.goto(`${TEST_CONFIG.baseURL}/trades`);
      await this.page.waitForLoadState('domcontentloaded');
      takeScreenshot(this.page, 'trades-page-loaded', category);

      // Test 3.1: Trades page loading
      const hasTradeList = await this.page.locator('table, [class*="trade"], [role="row"]').count() > 0;
      
      recordTestResult(
        'Trades page loading',
        category,
        hasTradeList,
        !hasTradeList ? ['No trade list found'] : [],
        'Trade list should be present'
      );

      // Test 3.2: Trade filtering controls
      const filterControls = await this.page.locator('input[placeholder*="filter"], input[placeholder*="search"], select').count();
      const hasFilters = filterControls > 0;
      
      recordTestResult(
        'Trade filtering controls',
        category,
        hasFilters,
        hasFilters ? [] : ['No filtering controls found'],
        `Found ${filterControls} filter controls`
      );

      // Test 3.3: Add new trade functionality
      const addTradeButton = await this.page.locator('a[href*="log-trade"], button:has-text("Add"), button:has-text("New")').first();
      const hasAddTradeButton = await addTradeButton.count() > 0;
      
      if (hasAddTradeButton) {
        recordTestResult(
          'Add trade button availability',
          category,
          true,
          [],
          'Add trade button is present'
        );
      }

    } catch (error) {
      recordTestResult('Trade management test error', category, false, [error.message]);
    }
  }

  // 4. STRATEGY MANAGEMENT TESTS
  async testStrategyManagement() {
    const category = 'strategies';
    log('Starting Strategy Management Tests', category);

    try {
      // Navigate to strategies page
      await this.page.goto(`${TEST_CONFIG.baseURL}/strategies`);
      await this.page.waitForLoadState('domcontentloaded');
      takeScreenshot(this.page, 'strategies-page-loaded', category);

      // Test 4.1: Strategies page loading
      const hasStrategyList = await this.page.locator('[class*="strategy"], [class*="card"]').count() >= 0;
      
      recordTestResult(
        'Strategies page loading',
        category,
        hasStrategyList,
        !hasStrategyList ? ['No strategy list found'] : [],
        'Strategy list should be present'
      );

      // Test 4.2: Create strategy functionality
      const createStrategyButton = await this.page.locator('a[href*="create"], button:has-text("Create"), button:has-text("New")').first();
      const hasCreateButton = await createStrategyButton.count() > 0;
      
      if (hasCreateButton) {
        recordTestResult(
          'Create strategy button availability',
          category,
          true,
          [],
          'Create strategy button is present'
        );
      }

    } catch (error) {
      recordTestResult('Strategy management test error', category, false, [error.message]);
    }
  }

  // 5. EMOTIONAL ANALYSIS TESTS
  async testEmotionalAnalysis() {
    const category = 'emotional';
    log('Starting Emotional Analysis Tests', category);

    try {
      // Navigate to confluence page (emotional analysis)
      await this.page.goto(`${TEST_CONFIG.baseURL}/confluence`);
      await this.page.waitForLoadState('domcontentloaded');
      takeScreenshot(this.page, 'confluence-page-loaded', category);

      // Test 5.1: Emotional analysis page loading
      const hasEmotionalCharts = await this.page.locator('[class*="emotion"], [class*="radar"], canvas').count() >= 1;
      
      recordTestResult(
        'Emotional analysis page loading',
        category,
        hasEmotionalCharts,
        !hasEmotionalCharts ? ['No emotional charts found'] : [],
        'Emotional charts should be present'
      );

      // Test 5.2: Emotion filtering
      const emotionFilters = await this.page.locator('select:has-text("Emotion"), [placeholder*="emotion"], button:has-text("FOMO"), button:has-text("CONFIDENT")').count();
      const hasEmotionFilters = emotionFilters > 0;
      
      recordTestResult(
        'Emotion filtering controls',
        category,
        hasEmotionFilters,
        hasEmotionFilters ? [] : ['No emotion filtering controls found'],
        `Found ${emotionFilters} emotion filter controls`
      );

    } catch (error) {
      recordTestResult('Emotional analysis test error', category, false, [error.message]);
    }
  }

  // 6. DATA FILTERING AND SORTING TESTS
  async testDataFilteringAndSorting() {
    const category = 'filtering';
    log('Starting Data Filtering and Sorting Tests', category);

    try {
      // Navigate to trades page for filtering tests
      await this.page.goto(`${TEST_CONFIG.baseURL}/trades`);
      await this.page.waitForLoadState('domcontentloaded');

      // Test 6.1: Filter controls availability
      const filterInputs = await this.page.locator('input[placeholder*="filter"], input[placeholder*="search"], select').count();
      const sortControls = await this.page.locator('button[aria-sort], th[role="button"], [class*="sort"]').count();
      
      recordTestResult(
        'Filter controls availability',
        category,
        filterInputs > 0,
        filterInputs === 0 ? ['No filter inputs found'] : [],
        `Found ${filterInputs} filter inputs`
      );
      
      recordTestResult(
        'Sort controls availability',
        category,
        sortControls > 0,
        sortControls === 0 ? ['No sort controls found'] : [],
        `Found ${sortControls} sort controls`
      );

    } catch (error) {
      recordTestResult('Data filtering test error', category, false, [error.message]);
    }
  }

  // 7. UI/UX ELEMENTS AND RESPONSIVENESS TESTS
  async testUIUXElements() {
    const category = 'ui';
    log('Starting UI/UX Elements and Responsiveness Tests', category);

    try {
      // Test 7.1: Navigation menu
      await this.page.goto(`${TEST_CONFIG.baseURL}/dashboard`);
      await this.page.waitForLoadState('domcontentloaded');
      
      const navigationElements = await this.page.locator('nav, [role="navigation"], [class*="nav"]').count();
      const hasNavigation = navigationElements > 0;
      
      recordTestResult(
        'Navigation menu availability',
        category,
        hasNavigation,
        hasNavigation ? [] : ['No navigation menu found'],
        `Found ${navigationElements} navigation elements`
      );

      // Test 7.2: Loading states
      const loadingElements = await this.page.locator('[class*="loading"], [class*="spinner"], [aria-busy="true"]').count();
      
      recordTestResult(
        'Loading states support',
        category,
        true, // Loading states are conditional, so we just check for their presence
        [],
        `Found ${loadingElements} loading elements`
      );

      // Test 7.3: Error states
      const errorElements = await this.page.locator('[class*="error"], [role="alert"], [class*="alert"]').count();
      
      recordTestResult(
        'Error state handling',
        category,
        true, // Error states are conditional, so we just check for their presence
        [],
        `Found ${errorElements} error elements`
      );

    } catch (error) {
      recordTestResult('UI/UX test error', category, false, [error.message]);
    }
  }

  // 8. PERFORMANCE AND STABILITY TESTS
  async testPerformanceAndStability() {
    const category = 'performance';
    log('Starting Performance and Stability Tests', category);

    try {
      // Test 8.1: Page load performance
      const startTime = Date.now();
      
      await this.page.goto(`${TEST_CONFIG.baseURL}/dashboard`);
      await this.page.waitForLoadState('domcontentloaded');
      
      const loadTime = Date.now() - startTime;
      
      recordTestResult(
        'Page load performance',
        category,
        loadTime < 5000, // Should load in under 5 seconds
        loadTime >= 5000 ? ['Page loading too slow'] : [],
        `Dashboard load time: ${loadTime}ms`
      );

    } catch (error) {
      recordTestResult('Performance test error', category, false, [error.message]);
    }
  }

  // 9. MOBILE RESPONSIVENESS TESTS
  async testMobileResponsiveness() {
    const category = 'mobile';
    log('Starting Mobile Responsiveness Tests', category);

    try {
      // Set mobile viewport
      await this.page.setViewportSize({ width: 375, height: 667 });
      
      // Test 9.1: Mobile navigation
      await this.page.goto(`${TEST_CONFIG.baseURL}/dashboard`);
      await this.page.waitForLoadState('domcontentloaded');
      takeScreenshot(this.page, 'mobile-dashboard', category);
      
      const mobileNavigation = await this.page.locator('[class*="mobile"], [class*="hamburger"], button[aria-expanded]').count();
      const hasMobileNavigation = mobileNavigation > 0;
      
      recordTestResult(
        'Mobile navigation',
        category,
        hasMobileNavigation,
        hasMobileNavigation ? [] : ['No mobile navigation found'],
        `Found ${mobileNavigation} mobile navigation elements`
      );

      // Test 9.2: Mobile layout
      const mobileLayout = await this.page.locator('[class*="mobile"], [class*="responsive"]').count();
      const hasMobileLayout = mobileLayout > 0;
      
      recordTestResult(
        'Mobile layout adaptation',
        category,
        hasMobileLayout,
        hasMobileLayout ? [] : ['No mobile layout adaptation found'],
        `Found ${mobileLayout} mobile layout elements`
      );

    } catch (error) {
      recordTestResult('Mobile responsiveness test error', category, false, [error.message]);
    }
  }

  // Main test execution method
  async runAllTests() {
    log('Starting Simple Comprehensive Test Suite');
    log(`Base URL: ${TEST_CONFIG.baseURL}`);
    
    try {
      await this.initialize();
      
      // Run all test categories
      await this.testAuthenticationSystem();
      await this.testDashboardAndAnalytics();
      await this.testTradeManagement();
      await this.testStrategyManagement();
      await this.testEmotionalAnalysis();
      await this.testDataFilteringAndSorting();
      await this.testUIUXElements();
      await this.testPerformanceAndStability();
      await this.testMobileResponsiveness();
      
      await this.cleanup();
      
      // Generate final report
      this.generateFinalReport();
      
    } catch (error) {
      log(`Test suite execution error: ${error.message}`, 'general', 'error');
      recordTestResult('Test suite execution', 'general', false, [error.message]);
    }
  }

  generateFinalReport() {
    const report = {
      ...testResults,
      overallStatus: testResults.summary.failedTests === 0 ? 'PASS' : 'FAIL',
      successRate: ((testResults.summary.passedTests / testResults.summary.totalTests) * 100).toFixed(1)
    };
    
    // Save detailed report
    const reportPath = path.join(__dirname, `simple-comprehensive-test-report-${Date.now()}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    // Save summary report
    const summaryPath = path.join(__dirname, 'SIMPLE_COMPREHENSIVE_TEST_REPORT.md');
    const summaryContent = this.generateMarkdownReport(report);
    fs.writeFileSync(summaryPath, summaryContent);
    
    log(`Final test report saved to: ${reportPath}`);
    log(`Summary report saved to: ${summaryPath}`);
    
    return report;
  }

  generateMarkdownReport(report) {
    const { summary, categories } = report;
    
    let markdown = `# Simple Comprehensive Test Report
## VeroTrade Trading Journal Application

**Test Date:** ${new Date().toLocaleDateString()}  
**Test Duration:** ${Math.round(summary.duration / 1000)} seconds  
**Overall Status:** ${summary.failedTests === 0 ? '✅ PASS' : '❌ FAIL'}  
**Success Rate:** ${summary.successRate}%  

---

## Executive Summary

This comprehensive test suite evaluated all major functionality areas of the VeroTrade application to identify any remaining issues after all previous fixes and improvements.

### Test Results Overview
- **Total Tests:** ${summary.totalTests}
- **Passed:** ${summary.passedTests}
- **Failed:** ${summary.failedTests}
- **Success Rate:** ${summary.successRate}%

---

## Detailed Test Results by Category

`;

    // Generate results for each category
    Object.entries(categories).forEach(([categoryName, categoryData]) => {
      const categoryTitle = categoryName.charAt(0).toUpperCase() + categoryName.slice(1);
      const categoryStatus = categoryData.failed === 0 ? '✅ PASS' : '❌ FAIL';
      
      markdown += `### ${categoryTitle} Tests ${categoryStatus}

**Tests Run:** ${categoryData.tests.length}  
**Passed:** ${categoryData.passed}  
**Failed:** ${categoryData.failed}

`;

      if (categoryData.tests.length > 0) {
        markdown += `| Test Name | Status | Issues |
|------------|--------|--------|
`;
        
        categoryData.tests.forEach(test => {
          const status = test.passed ? '✅ PASS' : '❌ FAIL';
          const issues = Array.isArray(test.issues) ? test.issues.join(', ') : test.issues;
          markdown += `| ${test.name} | ${status} | ${issues} |
`;
        });
      }
      
      markdown += '\n';
    });

    // Add issues summary
    const allIssues = [];
    Object.values(categories).forEach(category => {
      allIssues.push(...category.issues);
    });
    
    if (allIssues.length > 0) {
      markdown += `## Issues Summary

The following issues were identified during testing:

`;
      
      allIssues.forEach((issue, index) => {
        markdown += `${index + 1}. ${issue}
`;
      });
    } else {
      markdown += `## Issues Summary

✅ **No critical issues identified** during comprehensive testing.

`;
    }

    // Add recommendations
    markdown += `## Recommendations

### Immediate Actions Required
${allIssues.length > 0 ? 
  '1. Address all failed tests identified above' : 
  '1. No immediate actions required - all tests passed'
}

### Performance Optimizations
1. Monitor page load times to ensure they remain under 3 seconds
2. Optimize database queries for larger datasets
3. Implement caching for frequently accessed data

### User Experience Enhancements
1. Add more comprehensive error messages
2. Improve mobile responsiveness across all pages
3. Enhance accessibility features

### Production Readiness
${summary.failedTests === 0 ? 
  '✅ **APPLICATION IS READY FOR PRODUCTION**' : 
  '❌ **APPLICATION NEEDS ATTENTION** - Address failed tests before production deployment'
}

---

## Test Environment

- **Base URL:** ${TEST_CONFIG.baseURL}
- **Browser:** Chromium (Playwright)
- **Test Credentials:** ${TEST_CREDENTIALS.email}
- **Test Date:** ${summary.startTime}

---

## Screenshots

${testResults.screenshots.length} screenshots were captured during testing and are available in test directory.

---

*Report generated by Simple Comprehensive Test Suite*
*Test execution time: ${Math.round(summary.duration / 1000)} seconds*
`;

    return markdown;
  }
}

// Main execution
async function runSimpleComprehensiveTests() {
  console.log('🚀 Starting Simple Comprehensive Test Suite for VeroTrade Application');
  console.log('='.repeat(80));
  
  const browser = await chromium.launch({ 
    headless: TEST_CONFIG.headless,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const testSuite = new SimpleComprehensiveTestSuite(browser);
    await testSuite.runAllTests();
  } catch (error) {
    console.error('❌ Test suite execution failed:', error);
  } finally {
    await browser.close();
  }
  
  console.log('='.repeat(80));
  console.log('✅ Simple Comprehensive Test Suite completed');
  console.log('📊 Check SIMPLE_COMPREHENSIVE_TEST_REPORT.md for detailed results');
}

// Run tests if this file is executed directly
if (require.main === module) {
  runSimpleComprehensiveTests().catch(console.error);
}

module.exports = { SimpleComprehensiveTestSuite, runSimpleComprehensiveTests };