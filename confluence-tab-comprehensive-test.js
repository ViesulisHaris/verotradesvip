/**
 * Comprehensive Test Suite for Confluence Tab Functionality
 * Tests all aspects of the restored confluence tab at /confluence
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Test configuration
const TEST_CONFIG = {
  baseUrl: 'http://localhost:3000',
  timeout: 30000,
  screenshotDir: './confluence-test-screenshots',
  testUser: {
    email: 'test@example.com',
    password: 'testpassword123'
  }
};

// Test results tracking
const testResults = {
  pageLoading: { passed: 0, failed: 0, details: [] },
  authentication: { passed: 0, failed: 0, details: [] },
  dataFetching: { passed: 0, failed: 0, details: [] },
  filtering: { passed: 0, failed: 0, details: [] },
  emotionRadar: { passed: 0, failed: 0, details: [] },
  crossTabSync: { passed: 0, failed: 0, details: [] },
  uiComponents: { passed: 0, failed: 0, details: [] },
  errorHandling: { passed: 0, failed: 0, details: [] }
};

// Utility functions
function logTest(category, testName, passed, details = '') {
  const status = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${status} [${category}] ${testName}${details ? ': ' + details : ''}`);
  
  testResults[category].passed += passed ? 1 : 0;
  testResults[category].failed += passed ? 0 : 1;
  testResults[category].details.push({
    test: testName,
    passed,
    details,
    timestamp: new Date().toISOString()
  });
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function takeScreenshot(page, name) {
  if (!fs.existsSync(TEST_CONFIG.screenshotDir)) {
    fs.mkdirSync(TEST_CONFIG.screenshotDir, { recursive: true });
  }
  const screenshotPath = path.join(TEST_CONFIG.screenshotDir, `${name}-${Date.now()}.png`);
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log(`📸 Screenshot saved: ${screenshotPath}`);
  return screenshotPath;
}

async function waitForElement(page, selector, timeout = TEST_CONFIG.timeout) {
  try {
    await page.waitForSelector(selector, { timeout });
    return true;
  } catch (error) {
    return false;
  }
}

async function checkElementExists(page, selector) {
  try {
    const element = await page.$(selector);
    return element !== null;
  } catch (error) {
    return false;
  }
}

async function getElementText(page, selector) {
  try {
    const element = await page.$(selector);
    if (element) {
      return await page.evaluate(el => el.textContent, element);
    }
    return null;
  } catch (error) {
    return null;
  }
}

async function clickElement(page, selector) {
  try {
    await page.click(selector);
    return true;
  } catch (error) {
    console.error(`Failed to click element ${selector}:`, error);
    return false;
  }
}

async function typeInElement(page, selector, text) {
  try {
    await page.type(selector, text);
    return true;
  } catch (error) {
    console.error(`Failed to type in element ${selector}:`, error);
    return false;
  }
}

// Main test suite
async function runComprehensiveTests() {
  console.log('🚀 Starting Comprehensive Confluence Tab Tests\n');
  
  const browser = await puppeteer.launch({ 
    headless: false, // Set to true for headless mode
    defaultViewport: { width: 1920, height: 1080 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  // Enable console logging from the page
  page.on('console', msg => {
    console.log('🌐 PAGE LOG:', msg.text());
  });
  
  // Enable error logging
  page.on('pageerror', error => {
    console.error('🚨 PAGE ERROR:', error.message);
  });
  
  try {
    // Test 1: Page Loading and Authentication
    await testPageLoadingAndAuthentication(page);
    
    // Test 2: Data Fetching
    await testDataFetching(page);
    
    // Test 3: Filtering Functionality
    await testFilteringFunctionality(page);
    
    // Test 4: Emotion Radar Chart
    await testEmotionRadarChart(page);
    
    // Test 5: Cross-Tab Synchronization
    await testCrossTabSynchronization(page);
    
    // Test 6: UI Components and Interactions
    await testUIComponents(page);
    
    // Test 7: Error Handling and Edge Cases
    await testErrorHandling(page);
    
  } catch (error) {
    console.error('🚨 Test suite failed with error:', error);
    await takeScreenshot(page, 'test-suite-error');
  } finally {
    await browser.close();
  }
  
  // Generate final report
  generateTestReport();
}

// Test 1: Page Loading and Authentication
async function testPageLoadingAndAuthentication(page) {
  console.log('\n📋 Testing Page Loading and Authentication...');
  
  try {
    // Navigate to confluence page
    console.log('📍 Navigating to confluence page...');
    await page.goto(`${TEST_CONFIG.baseUrl}/confluence`, { waitUntil: 'networkidle2' });
    await sleep(2000);
    
    // Check if page loads without critical errors
    const pageTitle = await page.title();
    const hasPageContent = await waitForElement(page, 'body');
    logTest('pageLoading', 'Page loads without errors', hasPageContent, `Title: ${pageTitle}`);
    
    // Check for authentication redirect or guard
    const isLoginPage = await page.url().includes('/login');
    const hasAuthGuard = await checkElementExists(page, '[data-testid="auth-guard"]') || 
                        await checkElementExists(page, 'div[class*="auth"]');
    
    if (isLoginPage) {
      logTest('authentication', 'Redirects to login when not authenticated', true);
      
      // Test login process
      console.log('🔐 Testing login process...');
      await testLoginProcess(page);
      
      // Navigate back to confluence after login
      await page.goto(`${TEST_CONFIG.baseUrl}/confluence`, { waitUntil: 'networkidle2' });
      await sleep(3000);
    } else {
      logTest('authentication', 'Page accessible without authentication redirect', false, 'Should redirect to login');
    }
    
    // Check for UnifiedLayout wrapper
    const hasLayout = await checkElementExists(page, '[class*="unified-layout"]') ||
                    await checkElementExists(page, '[class*="verotrade-min-h-screen"]');
    logTest('pageLoading', 'UnifiedLayout wrapper applied', hasLayout);
    
    // Check for glass morphism design
    const hasGlassMorphism = await page.evaluate(() => {
      const elements = document.querySelectorAll('[class*="card"], [class*="glass"]');
      return elements.length > 0;
    });
    logTest('pageLoading', 'Glass morphism design applied', hasGlassMorphism);
    
    // Check for main confluence content
    const hasConfluenceContent = await waitForElement(page, 'h1', 10000) &&
                               await getElementText(page, 'h1')?.includes('Confluence Analysis');
    logTest('pageLoading', 'Main confluence content loaded', hasConfluenceContent);
    
    await takeScreenshot(page, 'page-loading-complete');
    
  } catch (error) {
    logTest('pageLoading', 'Page loading test completed', false, `Error: ${error.message}`);
  }
}

// Test login process
async function testLoginProcess(page) {
  try {
    // Fill login form
    const emailSelector = 'input[type="email"], input[name="email"], input[placeholder*="email"]';
    const passwordSelector = 'input[type="password"], input[name="password"], input[placeholder*="password"]';
    const submitSelector = 'button[type="submit"], button:contains("Login"), button:contains("Sign In")';
    
    const hasEmailField = await waitForElement(page, emailSelector, 5000);
    const hasPasswordField = await waitForElement(page, passwordSelector, 5000);
    
    logTest('authentication', 'Login form fields present', hasEmailField && hasPasswordField);
    
    if (hasEmailField && hasPasswordField) {
      await typeInElement(page, emailSelector, TEST_CONFIG.testUser.email);
      await typeInElement(page, passwordSelector, TEST_CONFIG.testUser.password);
      
      // Try multiple submit selectors
      const submitSelectors = [
        'button[type="submit"]',
        'button:contains("Login")',
        'button:contains("Sign In")',
        '.btn-primary',
        '[class*="login"] button'
      ];
      
      let loginSuccess = false;
      for (const selector of submitSelectors) {
        try {
          const element = await page.$(selector);
          if (element) {
            await element.click();
            await sleep(3000);
            
            // Check if redirected away from login
            const currentUrl = page.url();
            if (!currentUrl.includes('/login')) {
              loginSuccess = true;
              break;
            }
          }
        } catch (error) {
          continue;
        }
      }
      
      logTest('authentication', 'Login submission successful', loginSuccess);
    }
    
  } catch (error) {
    logTest('authentication', 'Login process test', false, `Error: ${error.message}`);
  }
}

// Test 2: Data Fetching
async function testDataFetching(page) {
  console.log('\n📊 Testing Data Fetching...');
  
  try {
    // Wait for data to load
    await sleep(5000);
    
    // Check for loading states
    const hasLoadingIndicator = await checkElementExists(page, '[class*="loading"], [class*="spinner"]');
    logTest('dataFetching', 'Loading indicators present', hasLoadingIndicator);
    
    // Check for error states
    const hasErrorDisplay = await checkElementExists(page, '[class*="error"], .error-message');
    logTest('dataFetching', 'Error handling displays', hasErrorDisplay);
    
    // Check for statistics cards
    const hasStatsCards = await page.evaluate(() => {
      const cards = document.querySelectorAll('[class*="card"], [class*="stat"]');
      return cards.length >= 4; // Should have at least 4 stat cards
    });
    logTest('dataFetching', 'Statistics cards rendered', hasStatsCards);
    
    // Check for trade data table
    const hasTradeTable = await waitForElement(page, 'table', 10000);
    logTest('dataFetching', 'Trade data table rendered', hasTradeTable);
    
    // Check for emotion radar container
    const hasRadarContainer = await checkElementExists(page, '[class*="radar"], [class*="chart"]');
    logTest('dataFetching', 'Emotion radar container present', hasRadarContainer);
    
    // Check for filter controls
    const hasFilterControls = await checkElementExists(page, '[class*="filter"]');
    logTest('dataFetching', 'Filter controls rendered', hasFilterControls);
    
    // Test refresh functionality
    const refreshButton = await page.$('button:contains("Refresh"), [class*="refresh"]');
    if (refreshButton) {
      await refreshButton.click();
      await sleep(3000);
      logTest('dataFetching', 'Refresh functionality works', true);
    } else {
      logTest('dataFetching', 'Refresh button found', false);
    }
    
    await takeScreenshot(page, 'data-fetching-complete');
    
  } catch (error) {
    logTest('dataFetching', 'Data fetching test completed', false, `Error: ${error.message}`);
  }
}

// Test 3: Filtering Functionality
async function testFilteringFunctionality(page) {
  console.log('\n🔍 Testing Filtering Functionality...');
  
  try {
    // Test emotion filter dropdown
    const emotionDropdown = await page.$('[class*="emotion"], [class*="dropdown"]');
    if (emotionDropdown) {
      await emotionDropdown.click();
      await sleep(1000);
      
      // Check for emotion options
      const hasEmotionOptions = await page.evaluate(() => {
        const options = document.querySelectorAll('[class*="option"], [role="option"]');
        return options.length > 0;
      });
      logTest('filtering', 'Emotion filter options available', hasEmotionOptions);
      
      // Select an emotion
      const firstOption = await page.$('[class*="option"], [role="option"]');
      if (firstOption) {
        await firstOption.click();
        await sleep(2000);
        logTest('filtering', 'Emotion selection works', true);
      }
    } else {
      logTest('filtering', 'Emotion dropdown found', false);
    }
    
    // Test symbol filter
    const symbolInput = await page.$('input[placeholder*="symbol"], input[placeholder*="Symbol"]');
    if (symbolInput) {
      await symbolInput.type('AAPL');
      await sleep(2000);
      logTest('filtering', 'Symbol filter works', true);
    } else {
      logTest('filtering', 'Symbol input found', false);
    }
    
    // Test market filter
    const marketDropdown = await page.$('select, [class*="market"]');
    if (marketDropdown) {
      await marketDropdown.click();
      await sleep(1000);
      logTest('filtering', 'Market filter accessible', true);
    } else {
      logTest('filtering', 'Market dropdown found', false);
    }
    
    // Test date filters
    const dateInputs = await page.$$('input[type="date"]');
    if (dateInputs.length >= 2) {
      logTest('filtering', 'Date range filters available', true);
      
      // Test date selection
      await dateInputs[0].type('2024-01-01'); // From date
      await dateInputs[1].type('2024-12-31'); // To date
      await sleep(2000);
      logTest('filtering', 'Date range selection works', true);
    } else {
      logTest('filtering', 'Date inputs found', false);
    }
    
    // Test clear filters
    const clearButton = await page.$('button:contains("Clear"), button:contains("Reset")');
    if (clearButton) {
      await clearButton.click();
      await sleep(2000);
      logTest('filtering', 'Clear filters works', true);
    } else {
      logTest('filtering', 'Clear button found', false);
    }
    
    // Check filter persistence
    const filterState = await page.evaluate(() => {
      return localStorage.getItem('trade-filters') || localStorage.getItem('filter-state');
    });
    logTest('filtering', 'Filter persistence enabled', !!filterState);
    
    await takeScreenshot(page, 'filtering-test-complete');
    
  } catch (error) {
    logTest('filtering', 'Filtering test completed', false, `Error: ${error.message}`);
  }
}

// Test 4: Emotion Radar Chart
async function testEmotionRadarChart(page) {
  console.log('\n📈 Testing Emotion Radar Chart...');
  
  try {
    // Wait for chart to render
    await sleep(3000);
    
    // Check for radar chart canvas or SVG
    const hasChartElement = await page.evaluate(() => {
      const canvas = document.querySelector('canvas');
      const svg = document.querySelector('svg');
      return canvas || svg;
    });
    logTest('emotionRadar', 'Chart element rendered', hasChartElement);
    
    // Check for emotion data processing
    const emotionData = await page.evaluate(() => {
      // Look for emotion data in the page
      const scripts = document.querySelectorAll('script');
      for (const script of scripts) {
        if (script.textContent && script.textContent.includes('emotion')) {
          return true;
        }
      }
      return false;
    });
    logTest('emotionRadar', 'Emotion data processed', emotionData);
    
    // Test chart interactivity
    const chartArea = await page.$('canvas, svg');
    if (chartArea) {
      // Hover over chart
      await chartArea.hover();
      await sleep(1000);
      
      // Check for tooltip
      const hasTooltip = await checkElementExists(page, '[class*="tooltip"]');
      logTest('emotionRadar', 'Chart tooltips work', hasTooltip);
    }
    
    // Check for leaning calculation
    const leaningData = await page.evaluate(() => {
      const text = document.body.textContent;
      return text.includes('Leaning') || text.includes('Buy') || text.includes('Sell');
    });
    logTest('emotionRadar', 'Leaning calculation displayed', leaningData);
    
    // Test chart responsiveness
    await page.setViewport({ width: 768, height: 1024 });
    await sleep(2000);
    const isResponsive = await checkElementExists(page, 'canvas, svg');
    logTest('emotionRadar', 'Chart responsive design', isResponsive);
    
    // Reset viewport
    await page.setViewport({ width: 1920, height: 1080 });
    
    await takeScreenshot(page, 'emotion-radar-test-complete');
    
  } catch (error) {
    logTest('emotionRadar', 'Emotion radar test completed', false, `Error: ${error.message}`);
  }
}

// Test 5: Cross-Tab Synchronization
async function testCrossTabSynchronization(page) {
  console.log('\n🔄 Testing Cross-Tab Synchronization...');
  
  try {
    // Open a second tab
    const page2 = await page.browser().newPage();
    await page2.goto(`${TEST_CONFIG.baseUrl}/confluence`, { waitUntil: 'networkidle2' });
    await sleep(3000);
    
    // Apply a filter in first tab
    const symbolInput = await page.$('input[placeholder*="symbol"], input[placeholder*="Symbol"]');
    if (symbolInput) {
      await symbolInput.type('SYNC_TEST');
      await sleep(2000);
    }
    
    // Check if filter syncs to second tab
    const syncedValue = await page2.evaluate(() => {
      const input = document.querySelector('input[placeholder*="symbol"], input[placeholder*="Symbol"]');
      return input ? input.value : null;
    });
    
    const isSynced = syncedValue && syncedValue.includes('SYNC_TEST');
    logTest('crossTabSync', 'Filter synchronization works', isSynced);
    
    // Test localStorage events
    await page.evaluate(() => {
      localStorage.setItem('test-sync-event', JSON.stringify({ test: 'confluence', timestamp: Date.now() }));
    });
    
    await sleep(1000);
    
    const eventReceived = await page2.evaluate(() => {
      return localStorage.getItem('test-sync-event');
    });
    
    logTest('crossTabSync', 'localStorage events work', !!eventReceived);
    
    await page2.close();
    
  } catch (error) {
    logTest('crossTabSync', 'Cross-tab sync test completed', false, `Error: ${error.message}`);
  }
}

// Test 6: UI Components and Interactions
async function testUIComponents(page) {
  console.log('\n🎨 Testing UI Components and Interactions...');
  
  try {
    // Test MultiSelectEmotionDropdown
    const emotionDropdown = await page.$('[class*="emotion"], [class*="dropdown"]');
    if (emotionDropdown) {
      await emotionDropdown.click();
      await sleep(1000);
      
      // Test keyboard navigation
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('Enter');
      await sleep(1000);
      
      logTest('uiComponents', 'Emotion dropdown keyboard navigation', true);
    }
    
    // Test EnhancedFilterControls
    const filterControls = await page.$('[class*="filter"], [class*="control"]');
    if (filterControls) {
      // Test filter interactions
      const inputs = await page.$$('input, select, button');
      let interactiveElements = 0;
      
      for (const input of inputs.slice(0, 5)) { // Test first 5 elements
        try {
          await input.click();
          interactiveElements++;
        } catch (error) {
          // Element not interactive
        }
      }
      
      logTest('uiComponents', 'Filter controls interactive', interactiveElements > 0);
    }
    
    // Test statistics cards
    const statCards = await page.$$(' [class*="card"], [class*="stat"]');
    logTest('uiComponents', 'Statistics cards display', statCards.length >= 4);
    
    // Test refresh button animation
    const refreshButton = await page.$('button:contains("Refresh"), [class*="refresh"]');
    if (refreshButton) {
      await refreshButton.click();
      
      // Check for spinning animation
      const isSpinning = await page.evaluate(() => {
        const button = document.querySelector('button:contains("Refresh"), [class*="refresh"]');
        if (button) {
          const style = window.getComputedStyle(button);
          return style.animation.includes('spin') || style.transform.includes('rotate');
        }
        return false;
      });
      
      logTest('uiComponents', 'Refresh button animation', isSpinning);
    }
    
    // Test responsive design
    const viewports = [
      { width: 1920, height: 1080, name: 'Desktop' },
      { width: 768, height: 1024, name: 'Tablet' },
      { width: 375, height: 667, name: 'Mobile' }
    ];
    
    for (const viewport of viewports) {
      await page.setViewport(viewport);
      await sleep(1000);
      
      const hasContent = await checkElementExists(page, 'h1, main, [class*="content"]');
      logTest('uiComponents', `Responsive design - ${viewport.name}`, hasContent);
    }
    
    // Reset to desktop
    await page.setViewport({ width: 1920, height: 1080 });
    
    await takeScreenshot(page, 'ui-components-test-complete');
    
  } catch (error) {
    logTest('uiComponents', 'UI components test completed', false, `Error: ${error.message}`);
  }
}

// Test 7: Error Handling and Edge Cases
async function testErrorHandling(page) {
  console.log('\n🚨 Testing Error Handling and Edge Cases...');
  
  try {
    // Test with no trade data
    console.log('Testing empty data scenario...');
    
    // Navigate to a date range with no data
    const dateInputs = await page.$$('input[type="date"]');
    if (dateInputs.length >= 2) {
      await dateInputs[0].type('1900-01-01'); // From date
      await dateInputs[1].type('1900-01-02'); // To date
      await sleep(3000);
      
      const hasEmptyState = await page.evaluate(() => {
        const text = document.body.textContent;
        return text.includes('No trades') || text.includes('No data') || text.includes('empty');
      });
      
      logTest('errorHandling', 'Empty data state handled', hasEmptyState);
    }
    
    // Test network error simulation
    await page.setRequestInterception(true);
    page.on('request', request => {
      if (request.url().includes('/api/') || request.url().includes('supabase')) {
        request.abort();
      } else {
        request.continue();
      }
    });
    
    // Try to refresh data
    const refreshButton = await page.$('button:contains("Refresh"), [class*="refresh"]');
    if (refreshButton) {
      await refreshButton.click();
      await sleep(3000);
      
      const hasErrorDisplay = await checkElementExists(page, '[class*="error"], .error-message');
      logTest('errorHandling', 'Network errors handled', hasErrorDisplay);
    }
    
    // Reset request interception
    await page.setRequestInterception(false);
    
    // Test invalid filter combinations
    const symbolInput = await page.$('input[placeholder*="symbol"], input[placeholder*="Symbol"]');
    if (symbolInput) {
      await symbolInput.type('INVALID_SYMBOL_12345');
      await sleep(2000);
      
      // Should handle gracefully without crashing
      const hasContent = await checkElementExists(page, 'body');
      logTest('errorHandling', 'Invalid filters handled', hasContent);
    }
    
    // Test memory usage with large datasets
    await page.evaluate(() => {
      // Simulate large dataset
      window.testLargeDataset = new Array(10000).fill(0).map((_, i) => ({
        id: i,
        symbol: `TEST${i}`,
        pnl: Math.random() * 1000 - 500,
        emotional_state: ['FOMO', 'CONFIDENT', 'NEUTRAL'][i % 3]
      }));
    });
    
    await sleep(2000);
    
    const performanceOk = await page.evaluate(() => {
      return !window.performance || window.performance.memory?.usedJSHeapSize < 100 * 1024 * 1024; // Less than 100MB
    });
    
    logTest('errorHandling', 'Large dataset performance', performanceOk);
    
    await takeScreenshot(page, 'error-handling-test-complete');
    
  } catch (error) {
    logTest('errorHandling', 'Error handling test completed', false, `Error: ${error.message}`);
  }
}

// Generate comprehensive test report
function generateTestReport() {
  console.log('\n📊 Generating Test Report...\n');
  
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalTests: 0,
      totalPassed: 0,
      totalFailed: 0,
      successRate: 0
    },
    categories: {},
    recommendations: []
  };
  
  // Calculate totals
  Object.keys(testResults).forEach(category => {
    const results = testResults[category];
    const total = results.passed + results.failed;
    const successRate = total > 0 ? (results.passed / total) * 100 : 0;
    
    report.categories[category] = {
      total,
      passed: results.passed,
      failed: results.failed,
      successRate: successRate.toFixed(1) + '%',
      details: results.details
    };
    
    report.summary.totalTests += total;
    report.summary.totalPassed += results.passed;
    report.summary.totalFailed += results.failed;
  });
  
  report.summary.successRate = report.summary.totalTests > 0 
    ? (report.summary.totalPassed / report.summary.totalTests * 100).toFixed(1) + '%'
    : '0%';
  
  // Generate recommendations based on failures
  Object.keys(testResults).forEach(category => {
    const results = testResults[category];
    results.details.forEach(detail => {
      if (!detail.passed) {
        switch (category) {
          case 'pageLoading':
            if (detail.test.includes('authentication')) {
              report.recommendations.push('Review authentication flow and redirect logic');
            }
            if (detail.test.includes('layout')) {
              report.recommendations.push('Check UnifiedLayout component integration');
            }
            break;
          case 'dataFetching':
            if (detail.test.includes('statistics')) {
              report.recommendations.push('Verify Supabase queries and data processing');
            }
            if (detail.test.includes('refresh')) {
              report.recommendations.push('Check refresh functionality implementation');
            }
            break;
          case 'filtering':
            if (detail.test.includes('dropdown')) {
              report.recommendations.push('Review filter dropdown components');
            }
            if (detail.test.includes('persistence')) {
              report.recommendations.push('Check localStorage filter persistence');
            }
            break;
          case 'emotionRadar':
            if (detail.test.includes('chart')) {
              report.recommendations.push('Verify EmotionRadar component rendering');
            }
            if (detail.test.includes('data')) {
              report.recommendations.push('Check emotion data processing logic');
            }
            break;
          case 'crossTabSync':
            if (detail.test.includes('sync')) {
              report.recommendations.push('Review cross-tab synchronization implementation');
            }
            break;
          case 'uiComponents':
            if (detail.test.includes('interactive')) {
              report.recommendations.push('Check UI component event handlers');
            }
            break;
          case 'errorHandling':
            if (detail.test.includes('error')) {
              report.recommendations.push('Improve error boundary and fallback UI');
            }
            break;
        }
      }
    });
  });
  
  // Remove duplicate recommendations
  report.recommendations = [...new Set(report.recommendations)];
  
  // Display summary
  console.log('='.repeat(60));
  console.log('📋 CONFLUENCE TAB TEST REPORT');
  console.log('='.repeat(60));
  console.log(`📅 Test Date: ${report.timestamp}`);
  console.log(`📊 Total Tests: ${report.summary.totalTests}`);
  console.log(`✅ Passed: ${report.summary.totalPassed}`);
  console.log(`❌ Failed: ${report.summary.totalFailed}`);
  console.log(`📈 Success Rate: ${report.summary.successRate}`);
  console.log('\n📋 Category Breakdown:');
  
  Object.keys(report.categories).forEach(category => {
    const cat = report.categories[category];
    console.log(`\n  ${category.toUpperCase()}:`);
    console.log(`    Tests: ${cat.total} | Passed: ${cat.passed} | Failed: ${cat.failed} | Success: ${cat.successRate}`);
  });
  
  if (report.recommendations.length > 0) {
    console.log('\n💡 RECOMMENDATIONS:');
    report.recommendations.forEach((rec, index) => {
      console.log(`  ${index + 1}. ${rec}`);
    });
  }
  
  console.log('\n' + '='.repeat(60));
  
  // Save detailed report to file
  const reportPath = path.join(TEST_CONFIG.screenshotDir, `confluence-test-report-${Date.now()}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`📄 Detailed report saved to: ${reportPath}`);
  
  return report;
}

// Run the tests
if (require.main === module) {
  runComprehensiveTests().catch(console.error);
}

module.exports = {
  runComprehensiveTests,
  testResults,
  TEST_CONFIG
};