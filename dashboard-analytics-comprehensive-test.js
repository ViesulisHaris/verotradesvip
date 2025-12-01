const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// Test configuration
const TEST_CONFIG = {
  baseUrl: 'http://localhost:3002',
  credentials: {
    email: 'testuser@verotrade.com',
    password: 'TestPassword123!'
  },
  screenshots: {
    dir: './dashboard-test-screenshots',
    enabled: true
  },
  timeout: {
    navigation: 30000,
    element: 10000,
    chart: 15000
  }
};

// Test results tracking
let testResults = {
  passed: 0,
  failed: 0,
  total: 0,
  details: []
};

// Helper functions
function log(message, level = 'INFO') {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level}] ${message}`;
  console.log(logMessage);
  
  testResults.details.push({
    timestamp,
    level,
    message
  });
}

function logTest(testName, passed, details = '') {
  testResults.total++;
  if (passed) {
    testResults.passed++;
    log(`✅ PASS: ${testName} - ${details}`, 'PASS');
  } else {
    testResults.failed++;
    log(`❌ FAIL: ${testName} - ${details}`, 'FAIL');
  }
}

async function takeScreenshot(page, name, description = '') {
  if (!TEST_CONFIG.screenshots.enabled) return;
  
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${name}-${timestamp}.png`;
    const filepath = path.join(TEST_CONFIG.screenshots.dir, filename);
    
    // Ensure directory exists
    if (!fs.existsSync(TEST_CONFIG.screenshots.dir)) {
      fs.mkdirSync(TEST_CONFIG.screenshots.dir, { recursive: true });
    }
    
    await page.screenshot({ 
      path: filepath, 
      fullPage: true,
      type: 'png'
    });
    
    log(`📸 Screenshot saved: ${filename} - ${description}`, 'INFO');
    return filepath;
  } catch (error) {
    log(`Failed to take screenshot: ${error.message}`, 'ERROR');
  }
}

// Test functions
async function testAuthentication(page) {
  log('Testing authentication flow...');
  
  try {
    // Navigate to login page
    await page.goto(`${TEST_CONFIG.baseUrl}/login`, { 
      waitUntil: 'networkidle',
      timeout: TEST_CONFIG.timeout.navigation 
    });
    
    // Fill login form
    await page.fill('input[type="email"]', TEST_CONFIG.credentials.email);
    await page.fill('input[type="password"]', TEST_CONFIG.credentials.password);
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Wait for navigation to dashboard
    await page.waitForURL('**/dashboard', { 
      timeout: TEST_CONFIG.timeout.navigation 
    });
    
    // Verify we're on dashboard
    const currentUrl = page.url();
    const isAuthenticated = currentUrl.includes('/dashboard');
    
    logTest('Authentication Flow', isAuthenticated, `Redirected to ${currentUrl}`);
    await takeScreenshot(page, 'authenticated-dashboard', 'After successful authentication');
    
    return isAuthenticated;
  } catch (error) {
    logTest('Authentication Flow', false, `Error: ${error.message}`);
    return false;
  }
}

async function testPerformanceMetricsCards(page) {
  log('Testing performance metrics cards...');
  
  try {
    // Wait for dashboard to load
    await page.waitForSelector('.min-h-screen', { 
      timeout: TEST_CONFIG.timeout.element 
    });
    
    // Test Total P&L card
    const totalPnLCard = await page.locator('text=Total PnL').first();
    const totalPnLVisible = await totalPnLCard.isVisible();
    const totalPnLValue = await page.locator('text=Total PnL').locator('..').locator('p').first().textContent();
    
    logTest('Total P&L Card Visible', totalPnLVisible, `Value: ${totalPnLValue || 'Not found'}`);
    
    // Test Win Rate card
    const winRateCard = await page.locator('text=Winrate').first();
    const winRateVisible = await winRateCard.isVisible();
    const winRateValue = await page.locator('text=Winrate').locator('..').locator('p').first().textContent();
    
    logTest('Win Rate Card Visible', winRateVisible, `Value: ${winRateValue || 'Not found'}`);
    
    // Test Profit Factor card
    const profitFactorCard = await page.locator('text=Profit Factor').first();
    const profitFactorVisible = await profitFactorCard.isVisible();
    const profitFactorValue = await page.locator('text=Profit Factor').locator('..').locator('p').first().textContent();
    
    logTest('Profit Factor Card Visible', profitFactorVisible, `Value: ${profitFactorValue || 'Not found'}`);
    
    // Test Total Trades card
    const totalTradesCard = await page.locator('text=Total Trades').first();
    const totalTradesVisible = await totalTradesCard.isVisible();
    const totalTradesValue = await page.locator('text=Total Trades').locator('..').locator('p').first().textContent();
    
    logTest('Total Trades Card Visible', totalTradesVisible, `Value: ${totalTradesValue || 'Not found'}`);
    
    await takeScreenshot(page, 'performance-metrics-cards', 'Performance metrics cards');
    
    return totalPnLVisible && winRateVisible && profitFactorVisible && totalTradesVisible;
  } catch (error) {
    logTest('Performance Metrics Cards', false, `Error: ${error.message}`);
    return false;
  }
}

async function testAdvancedMetrics(page) {
  log('Testing advanced metrics section...');
  
  try {
    // Test VRating Card
    const vRatingCard = await page.locator('text=VRating Performance').first();
    const vRatingVisible = await vRatingCard.isVisible({ timeout: TEST_CONFIG.timeout.element });
    
    if (vRatingVisible) {
      const vRatingScore = await page.locator('text=VRating Performance').locator('..').locator('span').first().textContent();
      logTest('VRating Card Visible', true, `Score: ${vRatingScore || 'Not found'}`);
      
      // Test VRating expandability
      await vRatingCard.click();
      await page.waitForTimeout(1000);
      const expandedContent = await page.locator('text=Performance Breakdown').isVisible();
      logTest('VRating Card Expandable', expandedContent, 'Performance breakdown section visible');
    } else {
      logTest('VRating Card Visible', false, 'VRating card not found');
    }
    
    // Test Sharpe Ratio Gauge
    const sharpeRatioCard = await page.locator('text=Sharpe Ratio').first();
    const sharpeRatioVisible = await sharpeRatioCard.isVisible({ timeout: TEST_CONFIG.timeout.element });
    
    if (sharpeRatioVisible) {
      const sharpeRatioValue = await page.locator('text=Sharpe Ratio').locator('..').locator('p').first().textContent();
      logTest('Sharpe Ratio Gauge Visible', true, `Value: ${sharpeRatioValue || 'Not found'}`);
    } else {
      logTest('Sharpe Ratio Gauge Visible', false, 'Sharpe Ratio gauge not found');
    }
    
    // Test Dominant Emotion Card
    const dominantEmotionCard = await page.locator('text=Dominant Emotion').first();
    const dominantEmotionVisible = await dominantEmotionCard.isVisible({ timeout: TEST_CONFIG.timeout.element });
    
    if (dominantEmotionVisible) {
      const dominantEmotionValue = await page.locator('text=Dominant Emotion').locator('..').locator('p').first().textContent();
      logTest('Dominant Emotion Card Visible', true, `Emotion: ${dominantEmotionValue || 'Not found'}`);
    } else {
      logTest('Dominant Emotion Card Visible', false, 'Dominant Emotion card not found');
    }
    
    await takeScreenshot(page, 'advanced-metrics', 'Advanced metrics section');
    
    return vRatingVisible && sharpeRatioVisible && dominantEmotionVisible;
  } catch (error) {
    logTest('Advanced Metrics Section', false, `Error: ${error.message}`);
    return false;
  }
}

async function testDataVisualizations(page) {
  log('Testing data visualizations...');
  
  try {
    // Test Emotion Radar Chart
    const emotionRadarContainer = await page.locator('text=Emotional Patterns').first();
    const emotionRadarVisible = await emotionRadarContainer.isVisible({ timeout: TEST_CONFIG.timeout.chart });
    
    if (emotionRadarVisible) {
      // Check for chart elements
      const chartElement = await page.locator('.recharts-wrapper').first();
      const chartRendered = await chartElement.isVisible({ timeout: TEST_CONFIG.timeout.chart });
      logTest('Emotion Radar Chart Rendered', chartRendered, 'Chart container found');
      
      // Test tooltip interaction
      if (chartRendered) {
        await page.hover('.recharts-polygon');
        await page.waitForTimeout(1000);
        const tooltipVisible = await page.locator('.recharts-tooltip-wrapper').isVisible();
        logTest('Emotion Radar Tooltip', tooltipVisible, 'Tooltip appears on hover');
      }
    } else {
      logTest('Emotion Radar Chart Rendered', false, 'Emotional Patterns section not found');
    }
    
    // Test P&L Performance Chart
    const pnlChartContainer = await page.locator('text=P&L Performance').first();
    const pnlChartVisible = await pnlChartContainer.isVisible({ timeout: TEST_CONFIG.timeout.chart });
    
    if (pnlChartVisible) {
      // Check for chart elements
      const pnlChartElement = await page.locator('.recharts-wrapper').nth(1);
      const pnlChartRendered = await pnlChartElement.isVisible({ timeout: TEST_CONFIG.timeout.chart });
      logTest('P&L Performance Chart Rendered', pnlChartRendered, 'Chart container found');
      
      // Test tooltip interaction
      if (pnlChartRendered) {
        await page.hover('.recharts-area');
        await page.waitForTimeout(1000);
        const pnlTooltipVisible = await page.locator('.recharts-tooltip-wrapper').isVisible();
        logTest('P&L Chart Tooltip', pnlTooltipVisible, 'Tooltip appears on hover');
      }
    } else {
      logTest('P&L Performance Chart Rendered', false, 'P&L Performance section not found');
    }
    
    await takeScreenshot(page, 'data-visualizations', 'Data visualizations');
    
    return emotionRadarVisible && pnlChartVisible;
  } catch (error) {
    logTest('Data Visualizations', false, `Error: ${error.message}`);
    return false;
  }
}

async function testInteractiveElements(page) {
  log('Testing interactive elements...');
  
  try {
    // Test card hover effects
    const dashboardCards = await page.locator('.card-solid').all();
    let hoverEffectsWorking = 0;
    
    for (let i = 0; i < Math.min(dashboardCards.length, 3); i++) {
      await dashboardCards[i].hover();
      await page.waitForTimeout(500);
      
      // Check if hover class or style is applied
      const hasHoverEffect = await dashboardCards[i].evaluate(el => {
        const style = window.getComputedStyle(el);
        return style.transform !== 'none' || style.transition !== 'none' || style.boxShadow !== 'none';
      });
      
      if (hasHoverEffect) hoverEffectsWorking++;
    }
    
    logTest('Card Hover Effects', hoverEffectsWorking > 0, `${hoverEffectsWorking}/${Math.min(dashboardCards.length, 3)} cards have hover effects`);
    
    // Test VRating expand/collapse
    const vRatingCard = await page.locator('text=VRating Performance').first();
    if (await vRatingCard.isVisible()) {
      const expandButton = await page.locator('text=Performance Breakdown').first();
      if (await expandButton.isVisible()) {
        await expandButton.click();
        await page.waitForTimeout(1000);
        const expanded = await page.locator('text=Performance Breakdown').locator('..').locator('svg').first().isVisible();
        
        await expandButton.click();
        await page.waitForTimeout(1000);
        const collapsed = !await page.locator('text=Performance Breakdown').locator('..').locator('svg').nth(1).isVisible();
        
        logTest('VRating Expand/Collapse', expanded && collapsed, 'Expandable functionality works');
      }
    }
    
    await takeScreenshot(page, 'interactive-elements', 'Interactive elements test');
    
    return true;
  } catch (error) {
    logTest('Interactive Elements', false, `Error: ${error.message}`);
    return false;
  }
}

async function testDataLoadingAndErrorHandling(page) {
  log('Testing data loading and error handling...');
  
  try {
    // Check for loading states
    await page.goto(`${TEST_CONFIG.baseUrl}/dashboard`, { 
      waitUntil: 'domcontentloaded',
      timeout: TEST_CONFIG.timeout.navigation 
    });
    
    // Look for loading spinner
    const loadingSpinner = await page.locator('.animate-spin').first();
    const loadingExists = await loadingSpinner.isVisible({ timeout: 3000 });
    logTest('Loading State Display', loadingExists, 'Loading spinner shown during data fetch');
    
    // Wait for content to load
    await page.waitForSelector('.min-h-screen', { 
      timeout: TEST_CONFIG.timeout.navigation 
    });
    
    // Check for error states
    const errorElements = await page.locator('text=error,Error,ERROR').all();
    const hasErrors = errorElements.length > 0;
    logTest('No Error States', !hasErrors, `${errorElements.length} error elements found`);
    
    // Test data persistence by refreshing
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForSelector('.min-h-screen', { 
      timeout: TEST_CONFIG.timeout.navigation 
    });
    
    const dataPersistent = await page.locator('text=Total PnL').first().isVisible();
    logTest('Data Persistence on Refresh', dataPersistent, 'Data remains after page refresh');
    
    await takeScreenshot(page, 'data-loading', 'Data loading and error handling');
    
    return !hasErrors;
  } catch (error) {
    logTest('Data Loading and Error Handling', false, `Error: ${error.message}`);
    return false;
  }
}

async function testAnalyticsPage(page) {
  log('Testing analytics page functionality...');
  
  try {
    // Navigate to analytics page
    await page.goto(`${TEST_CONFIG.baseUrl}/analytics`, { 
      waitUntil: 'networkidle',
      timeout: TEST_CONFIG.timeout.navigation 
    });
    
    // Check if page loads
    const analyticsHeader = await page.locator('text=Analytics').first();
    const analyticsPageLoaded = await analyticsHeader.isVisible({ timeout: TEST_CONFIG.timeout.element });
    logTest('Analytics Page Loads', analyticsPageLoaded, 'Analytics page header visible');
    
    // Check for under construction message
    const underConstruction = await page.locator('text=under construction').first();
    const isUnderConstruction = await underConstruction.isVisible();
    
    if (isUnderConstruction) {
      logTest('Analytics Page Status', true, 'Page shows under construction message');
    } else {
      // If not under construction, check for analytics components
      const analyticsComponents = await page.locator('.glass-enhanced').all();
      logTest('Analytics Components Present', analyticsComponents.length > 0, `${analyticsComponents.length} components found`);
    }
    
    await takeScreenshot(page, 'analytics-page', 'Analytics page');
    
    return analyticsPageLoaded;
  } catch (error) {
    logTest('Analytics Page', false, `Error: ${error.message}`);
    return false;
  }
}

async function testResponsiveDesign(page) {
  log('Testing responsive design...');
  
  try {
    // Test desktop view
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForTimeout(1000);
    
    const desktopCards = await page.locator('.grid-cols-1.md\\:grid-cols-2.lg\\:grid-cols-4').first();
    const desktopLayout = await desktopCards.isVisible();
    logTest('Desktop Layout', desktopLayout, '4-column grid layout on desktop');
    
    // Test tablet view
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(1000);
    
    const tabletCards = await page.locator('.grid-cols-1.md\\:grid-cols-2').first();
    const tabletLayout = await tabletCards.isVisible();
    logTest('Tablet Layout', tabletLayout, '2-column grid layout on tablet');
    
    // Test mobile view
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(1000);
    
    const mobileCards = await page.locator('.grid-cols-1').first();
    const mobileLayout = await mobileCards.isVisible();
    logTest('Mobile Layout', mobileLayout, '1-column grid layout on mobile');
    
    // Test chart responsiveness
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForTimeout(1000);
    
    const desktopChart = await page.locator('.recharts-wrapper').first();
    const desktopChartSize = await desktopChart.boundingBox();
    
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(1000);
    
    const mobileChart = await page.locator('.recharts-wrapper').first();
    const mobileChartSize = await mobileChart.boundingBox();
    
    const chartResponsive = desktopChartSize && mobileChartSize && 
                          desktopChartSize.width > mobileChartSize.width;
    logTest('Chart Responsiveness', chartResponsive, `Chart size adjusts: ${desktopChartSize?.width}px → ${mobileChartSize?.width}px`);
    
    await takeScreenshot(page, 'responsive-design-mobile', 'Mobile responsive design');
    
    await page.setViewportSize({ width: 1920, height: 1080 });
    await takeScreenshot(page, 'responsive-design-desktop', 'Desktop responsive design');
    
    return desktopLayout && tabletLayout && mobileLayout;
  } catch (error) {
    logTest('Responsive Design', false, `Error: ${error.message}`);
    return false;
  }
}

async function testRealTimeDataFetching(page) {
  log('Testing real-time data fetching...');
  
  try {
    // Monitor network requests
    const networkRequests = [];
    page.on('request', request => {
      if (request.url().includes('/trades') || request.url().includes('/analytics')) {
        networkRequests.push({
          url: request.url(),
          method: request.method(),
          timestamp: new Date().toISOString()
        });
      }
    });
    
    // Navigate to dashboard
    await page.goto(`${TEST_CONFIG.baseUrl}/dashboard`, { 
      waitUntil: 'networkidle',
      timeout: TEST_CONFIG.timeout.navigation 
    });
    
    // Wait for initial data load
    await page.waitForSelector('.min-h-screen', { 
      timeout: TEST_CONFIG.timeout.navigation 
    });
    
    // Check if data requests were made
    const dataRequestsMade = networkRequests.length > 0;
    logTest('Data Requests Made', dataRequestsMade, `${networkRequests.length} API requests detected`);
    
    // Test data refresh by simulating a refresh
    const initialData = await page.locator('text=Total PnL').locator('..').locator('p').first().textContent();
    
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForSelector('.min-h-screen', { 
      timeout: TEST_CONFIG.timeout.navigation 
    });
    
    const refreshedData = await page.locator('text=Total PnL').locator('..').locator('p').first().textContent();
    const dataRefreshed = initialData === refreshedData; // Should be same data
    
    logTest('Data Refresh', dataRefreshed, 'Data consistency maintained after refresh');
    
    await takeScreenshot(page, 'realtime-data', 'Real-time data fetching test');
    
    return dataRequestsMade;
  } catch (error) {
    logTest('Real-time Data Fetching', false, `Error: ${error.message}`);
    return false;
  }
}

async function testCalculationsAccuracy(page) {
  log('Testing calculations accuracy...');
  
  try {
    // Wait for dashboard to fully load
    await page.waitForSelector('.min-h-screen', { 
      timeout: TEST_CONFIG.timeout.navigation 
    });
    
    // Extract displayed values
    const totalPnLText = await page.locator('text=Total PnL').locator('..').locator('p').first().textContent();
    const winRateText = await page.locator('text=Winrate').locator('..').locator('p').first().textContent();
    const profitFactorText = await page.locator('text=Profit Factor').locator('..').locator('p').first().textContent();
    const totalTradesText = await page.locator('text=Total Trades').locator('..').locator('p').first().textContent();
    
    // Parse numeric values
    const totalPnL = parseFloat(totalPnLText?.replace(/[^0-9.-]/g, '') || '0');
    const winRate = parseFloat(winRateText?.replace(/[^0-9.]/g, '') || '0');
    const profitFactor = parseFloat(profitFactorText?.replace(/[^0-9.]/g, '') || '0');
    const totalTrades = parseInt(totalTradesText?.replace(/[^0-9]/g, '') || '0');
    
    // Validate value formats
    const totalPnLValid = !isNaN(totalPnL);
    const winRateValid = !isNaN(winRate) && winRate >= 0 && winRate <= 100;
    const profitFactorValid = !isNaN(profitFactor) && profitFactor >= 0;
    const totalTradesValid = !isNaN(totalTrades) && totalTrades >= 0;
    
    logTest('Total P&L Format Valid', totalPnLValid, `Value: ${totalPnL}`);
    logTest('Win Rate Format Valid', winRateValid, `Value: ${winRate}%`);
    logTest('Profit Factor Format Valid', profitFactorValid, `Value: ${profitFactor}`);
    logTest('Total Trades Format Valid', totalTradesValid, `Value: ${totalTrades}`);
    
    // Test logical consistency
    const logicalConsistency = (totalTrades > 0) || (totalPnL === 0 && winRate === 0);
    logTest('Logical Data Consistency', logicalConsistency, 'Data relationships make sense');
    
    await takeScreenshot(page, 'calculations-accuracy', 'Calculations accuracy test');
    
    return totalPnLValid && winRateValid && profitFactorValid && totalTradesValid;
  } catch (error) {
    logTest('Calculations Accuracy', false, `Error: ${error.message}`);
    return false;
  }
}

// Main test execution
async function runDashboardAnalyticsTests() {
  log('🚀 Starting VeroTrade Dashboard & Analytics Comprehensive Tests');
  log(`Testing against: ${TEST_CONFIG.baseUrl}`);
  
  const browser = await chromium.launch({ 
    headless: false, // Set to true for headless mode
    slowMo: 100 // Slow down actions for better observation
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    userAgent: 'VeroTrade-Test/1.0'
  });
  
  const page = await context.newPage();
  
  try {
    // Test authentication first
    const authSuccess = await testAuthentication(page);
    if (!authSuccess) {
      log('❌ Authentication failed. Skipping remaining tests.', 'ERROR');
      return;
    }
    
    // Run all dashboard tests
    await testPerformanceMetricsCards(page);
    await testAdvancedMetrics(page);
    await testDataVisualizations(page);
    await testInteractiveElements(page);
    await testDataLoadingAndErrorHandling(page);
    await testResponsiveDesign(page);
    await testRealTimeDataFetching(page);
    await testCalculationsAccuracy(page);
    
    // Test analytics page
    await testAnalyticsPage(page);
    
  } catch (error) {
    log(`Fatal error during testing: ${error.message}`, 'ERROR');
  } finally {
    await browser.close();
  }
}

// Generate test report
function generateTestReport() {
  const report = {
    summary: {
      total: testResults.total,
      passed: testResults.passed,
      failed: testResults.failed,
      passRate: testResults.total > 0 ? ((testResults.passed / testResults.total) * 100).toFixed(2) + '%' : '0%'
    },
    details: testResults.details,
    timestamp: new Date().toISOString(),
    testConfig: TEST_CONFIG
  };
  
  const reportPath = './dashboard-analytics-test-report.json';
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  // Generate markdown report
  const markdownReport = `# VeroTrade Dashboard & Analytics Comprehensive Test Report

## Test Summary

- **Total Tests:** ${report.summary.total}
- **Passed:** ${report.summary.passed}
- **Failed:** ${report.summary.failed}
- **Pass Rate:** ${report.summary.passRate}
- **Timestamp:** ${report.timestamp}

## Test Configuration

- **Base URL:** ${TEST_CONFIG.baseUrl}
- **Screenshots:** ${TEST_CONFIG.screenshots.enabled ? 'Enabled' : 'Disabled'}
- **Screenshot Directory:** ${TEST_CONFIG.screenshots.dir}

## Detailed Results

${testResults.details.map(detail => 
  `- [${detail.level}] ${detail.timestamp}: ${detail.message}`
).join('\n')}

## Recommendations

${testResults.failed > 0 ? 
  `### ⚠️ Issues Found (${testResults.failed} failures)

Please review the failed tests and address the issues identified.` :
  `### ✅ All Tests Passed

The dashboard and analytics features are working correctly.`
}

## Next Steps

1. Review any failed tests and implement fixes
2. Run tests again to verify fixes
3. Consider adding more edge case tests
4. Implement automated regression testing

---
*Report generated by VeroTrade Dashboard & Analytics Test Suite*
`;
  
  const markdownPath = './DASHBOARD_ANALYTICS_TEST_REPORT.md';
  fs.writeFileSync(markdownPath, markdownReport);
  
  log(`📊 Test report generated: ${reportPath}`);
  log(`📝 Markdown report generated: ${markdownPath}`);
  
  return report;
}

// Execute tests
async function main() {
  try {
    await runDashboardAnalyticsTests();
    const report = generateTestReport();
    
    console.log('\n' + '='.repeat(60));
    console.log('🏁 TEST EXECUTION COMPLETE');
    console.log('='.repeat(60));
    console.log(`Total Tests: ${report.summary.total}`);
    console.log(`Passed: ${report.summary.passed}`);
    console.log(`Failed: ${report.summary.failed}`);
    console.log(`Pass Rate: ${report.summary.passRate}`);
    console.log('='.repeat(60));
    
    if (report.summary.failed > 0) {
      console.log('⚠️  Some tests failed. Please review the report for details.');
      process.exit(1);
    } else {
      console.log('✅ All tests passed successfully!');
      process.exit(0);
    }
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

module.exports = {
  runDashboardAnalyticsTests,
  generateTestReport,
  TEST_CONFIG
};