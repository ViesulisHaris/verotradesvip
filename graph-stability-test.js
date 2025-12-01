/**
 * Graph Stability Test After Menu Transition Fixes
 * 
 * This script tests the stability of EmotionRadar and PnLChart components
 * during menu transitions to verify the fixes for graph shifting issues.
 * 
 * Fixes Applied:
 * - ResponsiveContainer debounce increased from 1ms to 300ms
 * - Added overflow-hidden to chart container divs
 * - Matches sidebar transition duration of 300ms
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Test configuration
const TEST_CONFIG = {
  baseUrl: 'http://localhost:3000',
  viewports: [
    { name: 'Desktop', width: 1920, height: 1080 },
    { name: 'Tablet', width: 768, height: 1024 },
    { name: 'Mobile', width: 375, height: 667 }
  ],
  testPages: [
    { name: 'Dashboard', path: '/dashboard', hasCharts: true },
    { name: 'Confluence', path: '/confluence', hasCharts: true }
  ],
  menuTransitionDuration: 300, // ms - matches the CSS transition duration
  debounceDelay: 300, // ms - matches the ResponsiveContainer debounce
  screenshotDelay: 100 // ms - small delay after transition for visual capture
};

// Test results storage
const testResults = {
  timestamp: new Date().toISOString(),
  summary: {
    totalTests: 0,
    passedTests: 0,
    failedTests: 0,
    skippedTests: 0
  },
  viewportResults: {},
  detailedResults: []
};

/**
 * Utility function to wait for a specified time
 */
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Utility function to take a screenshot with error handling
 */
const takeScreenshot = async (page, filename, description) => {
  try {
    const screenshotPath = path.join(__dirname, 'graph-stability-screenshots', filename);
    await page.screenshot({ 
      path: screenshotPath, 
      fullPage: false,
      clip: { x: 0, y: 0, width: page.viewport().width, height: page.viewport().height }
    });
    console.log(`📸 Screenshot saved: ${filename} - ${description}`);
    return screenshotPath;
  } catch (error) {
    console.error(`❌ Failed to take screenshot ${filename}:`, error.message);
    return null;
  }
};

/**
 * Get the position and dimensions of chart elements
 */
const getChartMetrics = async (page, chartType) => {
  try {
    const chartSelector = chartType === 'emotionRadar' 
      ? '.chart-container-enhanced' 
      : '.stable-chart';
    
    const metrics = await page.evaluate((selector) => {
      const element = document.querySelector(selector);
      if (!element) return null;
      
      const rect = element.getBoundingClientRect();
      return {
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height,
        scrollTop: window.pageYOffset,
        scrollLeft: window.pageXOffset
      };
    }, chartSelector);
    
    return metrics;
  } catch (error) {
    console.error(`❌ Error getting ${chartType} metrics:`, error.message);
    return null;
  }
};

/**
 * Check if sidebar is collapsed or expanded
 */
const getSidebarState = async (page) => {
  try {
    const isCollapsed = await page.evaluate(() => {
      const sidebar = document.querySelector('aside');
      if (!sidebar) return null;
      return sidebar.classList.contains('sidebar-collapsed');
    });
    return isCollapsed;
  } catch (error) {
    console.error('❌ Error getting sidebar state:', error.message);
    return null;
  }
};

/**
 * Toggle the sidebar state
 */
const toggleSidebar = async (page) => {
  try {
    // Try keyboard shortcut first (Ctrl+B)
    await page.keyboard.down('Control');
    await page.keyboard.press('b');
    await page.keyboard.up('Control');
    await wait(50);
    
    // Fallback to clicking the toggle button
    const toggleButton = await page.$('button[title*="sidebar"], button[title*="Sidebar"]');
    if (toggleButton) {
      await toggleButton.click();
    }
    
    // Wait for transition to complete
    await wait(TEST_CONFIG.menuTransitionDuration + TEST_CONFIG.screenshotDelay);
  } catch (error) {
    console.error('❌ Error toggling sidebar:', error.message);
  }
};

/**
 * Test graph stability during menu transitions
 */
const testGraphStability = async (page, viewport, pageInfo) => {
  const viewportName = viewport.name;
  const pageName = pageInfo.name;
  const testId = `${viewportName}-${pageName}`;
  
  console.log(`\n🧪 Testing graph stability on ${viewportName} - ${pageName}`);
  
  const testResult = {
    testId,
    viewport: viewportName,
    page: pageName,
    timestamp: new Date().toISOString(),
    tests: []
  };
  
  try {
    // Navigate to the test page
    await page.goto(`${TEST_CONFIG.baseUrl}${pageInfo.path}`, { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    await wait(2000); // Wait for charts to fully render
    
    // Take initial screenshot
    const initialScreenshot = await takeScreenshot(
      page, 
      `${testId}-initial.png`, 
      'Initial state before menu transitions'
    );
    
    // Get initial chart metrics
    const initialEmotionRadarMetrics = await getChartMetrics(page, 'emotionRadar');
    const initialPnLChartMetrics = await getChartMetrics(page, 'pnlChart');
    
    testResult.tests.push({
      name: 'Initial State Capture',
      status: 'completed',
      details: {
        emotionRadarMetrics: initialEmotionRadarMetrics,
        pnlChartMetrics: initialPnLChartMetrics,
        screenshot: initialScreenshot
      }
    });
    
    if (!pageInfo.hasCharts) {
      testResult.tests.push({
        name: 'Charts Available',
        status: 'skipped',
        details: 'Page does not contain charts'
      });
      return testResult;
    }
    
    // Test 1: Single menu toggle (collapse to expand)
    console.log(`  📊 Test 1: Single menu toggle on ${viewportName}`);
    const beforeToggleMetrics = {
      emotionRadar: await getChartMetrics(page, 'emotionRadar'),
      pnlChart: await getChartMetrics(page, 'pnlChart')
    };
    
    await toggleSidebar(page);
    
    const afterToggleMetrics = {
      emotionRadar: await getChartMetrics(page, 'emotionRadar'),
      pnlChart: await getChartMetrics(page, 'pnlChart')
    };
    
    const toggleScreenshot = await takeScreenshot(
      page,
      `${testId}-after-toggle.png`,
      'After single menu toggle'
    );
    
    // Check for position shifts (allowing for small variations due to responsive design)
    const positionStability = {
      emotionRadar: {
        xShift: Math.abs((beforeToggleMetrics.emotionRadar?.x || 0) - (afterToggleMetrics.emotionRadar?.x || 0)),
        yShift: Math.abs((beforeToggleMetrics.emotionRadar?.y || 0) - (afterToggleMetrics.emotionRadar?.y || 0)),
        widthChange: Math.abs((beforeToggleMetrics.emotionRadar?.width || 0) - (afterToggleMetrics.emotionRadar?.width || 0)),
        heightChange: Math.abs((beforeToggleMetrics.emotionRadar?.height || 0) - (afterToggleMetrics.emotionRadar?.height || 0))
      },
      pnlChart: {
        xShift: Math.abs((beforeToggleMetrics.pnlChart?.x || 0) - (afterToggleMetrics.pnlChart?.x || 0)),
        yShift: Math.abs((beforeToggleMetrics.pnlChart?.y || 0) - (afterToggleMetrics.pnlChart?.y || 0)),
        widthChange: Math.abs((beforeToggleMetrics.pnlChart?.width || 0) - (afterToggleMetrics.pnlChart?.width || 0)),
        heightChange: Math.abs((beforeToggleMetrics.pnlChart?.height || 0) - (afterToggleMetrics.pnlChart?.height || 0))
      }
    };
    
    // Define acceptable thresholds (higher for mobile due to responsive behavior)
    const thresholds = viewportName === 'Mobile' ? 50 : 20;
    
    const toggleTestPassed = 
      positionStability.emotionRadar.xShift <= thresholds &&
      positionStability.emotionRadar.yShift <= thresholds &&
      positionStability.pnlChart.xShift <= thresholds &&
      positionStability.pnlChart.yShift <= thresholds;
    
    testResult.tests.push({
      name: 'Single Menu Toggle',
      status: toggleTestPassed ? 'passed' : 'failed',
      details: {
        positionStability,
        thresholds,
        beforeMetrics: beforeToggleMetrics,
        afterMetrics: afterToggleMetrics,
        screenshot: toggleScreenshot
      }
    });
    
    // Test 2: Multiple rapid menu toggles
    console.log(`  📊 Test 2: Multiple rapid menu toggles on ${viewportName}`);
    const rapidToggleMetrics = [];
    
    for (let i = 0; i < 5; i++) {
      await toggleSidebar(page);
      const metrics = {
        emotionRadar: await getChartMetrics(page, 'emotionRadar'),
        pnlChart: await getChartMetrics(page, 'pnlChart'),
        timestamp: Date.now()
      };
      rapidToggleMetrics.push(metrics);
      
      if (i < 4) { // Don't wait after the last toggle
        await wait(100); // Small delay between rapid toggles
      }
    }
    
    const rapidToggleScreenshot = await takeScreenshot(
      page,
      `${testId}-after-rapid-toggles.png`,
      'After multiple rapid menu toggles'
    );
    
    // Check for stability across rapid toggles
    const rapidStability = {
      emotionRadar: {
        maxXShift: Math.max(...rapidToggleMetrics.map((m, i) => 
          i > 0 ? Math.abs((m.emotionRadar?.x || 0) - (rapidToggleMetrics[i-1].emotionRadar?.x || 0)) : 0
        )),
        maxYShift: Math.max(...rapidToggleMetrics.map((m, i) => 
          i > 0 ? Math.abs((m.emotionRadar?.y || 0) - (rapidToggleMetrics[i-1].emotionRadar?.y || 0)) : 0
        ))
      },
      pnlChart: {
        maxXShift: Math.max(...rapidToggleMetrics.map((m, i) => 
          i > 0 ? Math.abs((m.pnlChart?.x || 0) - (rapidToggleMetrics[i-1].pnlChart?.x || 0)) : 0
        )),
        maxYShift: Math.max(...rapidToggleMetrics.map((m, i) => 
          i > 0 ? Math.abs((m.pnlChart?.y || 0) - (rapidToggleMetrics[i-1].pnlChart?.y || 0)) : 0
        ))
      }
    };
    
    const rapidToggleTestPassed = 
      rapidStability.emotionRadar.maxXShift <= thresholds &&
      rapidStability.emotionRadar.maxYShift <= thresholds &&
      rapidStability.pnlChart.maxXShift <= thresholds &&
      rapidStability.pnlChart.maxYShift <= thresholds;
    
    testResult.tests.push({
      name: 'Multiple Rapid Menu Toggles',
      status: rapidToggleTestPassed ? 'passed' : 'failed',
      details: {
        rapidStability,
        thresholds,
        metricsHistory: rapidToggleMetrics,
        screenshot: rapidToggleScreenshot
      }
    });
    
    // Test 3: Chart rendering after transition completion
    console.log(`  📊 Test 3: Chart rendering verification on ${viewportName}`);
    await wait(TEST_CONFIG.debounceDelay + 200); // Wait for debounce to complete
    
    const finalMetrics = {
      emotionRadar: await getChartMetrics(page, 'emotionRadar'),
      pnlChart: await getChartMetrics(page, 'pnlChart')
    };
    
    const finalScreenshot = await takeScreenshot(
      page,
      `${testId}-final.png`,
      'Final state after all transitions'
    );
    
    // Check if charts are still properly rendered
    const chartsStillRendered = 
      finalMetrics.emotionRadar && 
      finalMetrics.emotionRadar.width > 0 && 
      finalMetrics.emotionRadar.height > 0 &&
      finalMetrics.pnlChart && 
      finalMetrics.pnlChart.width > 0 && 
      finalMetrics.pnlChart.height > 0;
    
    testResult.tests.push({
      name: 'Chart Rendering After Transitions',
      status: chartsStillRendered ? 'passed' : 'failed',
      details: {
        finalMetrics,
        chartsRendered: chartsStillRendered,
        screenshot: finalScreenshot
      }
    });
    
  } catch (error) {
    console.error(`❌ Error during ${testId} test:`, error.message);
    testResult.tests.push({
      name: 'Test Execution Error',
      status: 'failed',
      details: { error: error.message }
    });
  }
  
  return testResult;
};

/**
 * Main test execution function
 */
const runTests = async () => {
  console.log('🚀 Starting Graph Stability Tests After Menu Transition Fixes\n');
  console.log(`📋 Test Configuration:`);
  console.log(`   - Base URL: ${TEST_CONFIG.baseUrl}`);
  console.log(`   - Menu Transition Duration: ${TEST_CONFIG.menuTransitionDuration}ms`);
  console.log(`   - ResponsiveContainer Debounce: ${TEST_CONFIG.debounceDelay}ms`);
  console.log(`   - Viewports: ${TEST_CONFIG.viewports.map(v => v.name).join(', ')}`);
  console.log(`   - Test Pages: ${TEST_CONFIG.testPages.map(p => p.name).join(', ')}\n`);
  
  // Create screenshots directory
  const screenshotDir = path.join(__dirname, 'graph-stability-screenshots');
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }
  
  const browser = await puppeteer.launch({
    headless: false, // Set to false for debugging
    defaultViewport: null,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    for (const viewport of TEST_CONFIG.viewports) {
      console.log(`\n📱 Testing on ${viewport.name} (${viewport.width}x${viewport.height})`);
      console.log('='.repeat(60));
      
      const page = await browser.newPage();
      await page.setViewport({ width: viewport.width, height: viewport.height });
      
      testResults.viewportResults[viewport.name] = {
        viewport,
        pageResults: {},
        summary: { passed: 0, failed: 0, skipped: 0 }
      };
      
      for (const pageInfo of TEST_CONFIG.testPages) {
        const testResult = await testGraphStability(page, viewport, pageInfo);
        testResults.detailedResults.push(testResult);
        testResults.viewportResults[viewport.name].pageResults[pageInfo.name] = testResult;
        
        // Update summary counts
        testResult.tests.forEach(test => {
          testResults.summary.totalTests++;
          testResults.viewportResults[viewport.name].summary.totalTests = 
            (testResults.viewportResults[viewport.name].summary.totalTests || 0) + 1;
          
          if (test.status === 'passed') {
            testResults.summary.passedTests++;
            testResults.viewportResults[viewport.name].summary.passed++;
          } else if (test.status === 'failed') {
            testResults.summary.failedTests++;
            testResults.viewportResults[viewport.name].summary.failed++;
          } else if (test.status === 'skipped') {
            testResults.summary.skippedTests++;
            testResults.viewportResults[viewport.name].summary.skipped++;
          }
        });
      }
      
      await page.close();
    }
    
    // Generate test report
    await generateTestReport();
    
  } catch (error) {
    console.error('❌ Critical error during test execution:', error);
  } finally {
    await browser.close();
  }
};

/**
 * Generate comprehensive test report
 */
const generateTestReport = async () => {
  console.log('\n📊 Generating Test Report...\n');
  
  const reportPath = path.join(__dirname, 'GRAPH_STABILITY_TEST_REPORT.md');
  
  let report = `# Graph Stability Test Report\n\n`;
  report += `**Test Date:** ${new Date().toLocaleString()}\n`;
  report += `**Purpose:** Verify graph stability after menu transition fixes\n\n`;
  
  report += `## Fixes Applied\n\n`;
  report += `- ResponsiveContainer debounce increased from 1ms to 300ms\n`;
  report += `- Added overflow-hidden to chart container divs\n`;
  report += `- Matches sidebar transition duration of 300ms\n\n`;
  
  report += `## Test Configuration\n\n`;
  report += `- **Base URL:** ${TEST_CONFIG.baseUrl}\n`;
  report += `- **Menu Transition Duration:** ${TEST_CONFIG.menuTransitionDuration}ms\n`;
  report += `- **ResponsiveContainer Debounce:** ${TEST_CONFIG.debounceDelay}ms\n`;
  report += `- **Viewports Tested:** ${TEST_CONFIG.viewports.map(v => v.name).join(', ')}\n`;
  report += `- **Test Pages:** ${TEST_CONFIG.testPages.map(p => p.name).join(', ')}\n\n`;
  
  report += `## Summary\n\n`;
  report += `- **Total Tests:** ${testResults.summary.totalTests}\n`;
  report += `- **Passed:** ${testResults.summary.passedTests}\n`;
  report += `- **Failed:** ${testResults.summary.failedTests}\n`;
  report += `- **Skipped:** ${testResults.summary.skippedTests}\n`;
  report += `- **Success Rate:** ${((testResults.summary.passedTests / testResults.summary.totalTests) * 100).toFixed(1)}%\n\n`;
  
  // Detailed results by viewport
  for (const [viewportName, viewportData] of Object.entries(testResults.viewportResults)) {
    report += `## ${viewportName} Results\n\n`;
    report += `**Viewport:** ${viewportData.viewport.width}x${viewportData.viewport.height}\n\n`;
    
    for (const [pageName, pageResult] of Object.entries(viewportData.pageResults)) {
      report += `### ${pageName} Page\n\n`;
      
      pageResult.tests.forEach(test => {
        const statusIcon = test.status === 'passed' ? '✅' : test.status === 'failed' ? '❌' : '⏭️';
        report += `${statusIcon} **${test.name}**: ${test.status.toUpperCase()}\n\n`;
        
        if (test.status === 'failed' && test.details) {
          report += `**Error Details:**\n`;
          report += `\`\`\`json\n${JSON.stringify(test.details, null, 2)}\n\`\`\`\n\n`;
        }
      });
      
      report += `---\n\n`;
    }
  }
  
  // Overall assessment
  report += `## Overall Assessment\n\n`;
  
  const successRate = (testResults.summary.passedTests / testResults.summary.totalTests) * 100;
  
  if (successRate >= 90) {
    report += `🎉 **EXCELLENT**: Graph stability fixes are working effectively (${successRate.toFixed(1)}% success rate)\n\n`;
    report += `The menu transition fixes have successfully resolved the graph shifting issues:\n`;
    report += `- Charts remain stable during 300ms menu transitions\n`;
    report += `- No visual layout shifts detected\n`;
    report += `- Charts render correctly after transitions complete\n`;
    report += `- Stable across all tested viewports\n\n`;
  } else if (successRate >= 70) {
    report += `⚠️ **GOOD**: Graph stability fixes are mostly working (${successRate.toFixed(1)}% success rate)\n\n`;
    report += `The menu transition fixes have improved graph stability, but some issues remain:\n`;
    report += `- Most transitions are stable\n`;
    report += `- Minor issues detected on some viewports\n`;
    report += `- Consider reviewing failed tests for optimization opportunities\n\n`;
  } else {
    report += `❌ **NEEDS IMPROVEMENT**: Graph stability fixes require further work (${successRate.toFixed(1)}% success rate)\n\n`;
    report += `Significant issues remain with graph stability during menu transitions:\n`;
    report += `- Multiple test failures detected\n`;
    report += `- Graph shifting still occurs\n`;
    report += `- Additional optimization required\n\n`;
  }
  
  report += `## Recommendations\n\n`;
  report += `1. **Monitor Performance**: Continue to monitor chart performance during menu transitions\n`;
  report += `2. **User Testing**: Conduct real-world user testing to validate the fixes\n`;
  report += `3. **Cross-browser Testing**: Test the fixes across different browsers\n`;
  report += `4. **Performance Metrics**: Consider adding performance monitoring for chart rendering\n\n`;
  
  report += `## Screenshots\n\n`;
  report += `All test screenshots have been saved to the \`graph-stability-screenshots\` directory for visual verification.\n\n`;
  
  report += `---\n\n`;
  report += `*Report generated on ${new Date().toISOString()}*\n`;
  
  fs.writeFileSync(reportPath, report);
  console.log(`📋 Test report saved to: ${reportPath}`);
  
  // Also save JSON results for programmatic access
  const jsonResultsPath = path.join(__dirname, 'graph-stability-test-results.json');
  fs.writeFileSync(jsonResultsPath, JSON.stringify(testResults, null, 2));
  console.log(`📊 JSON results saved to: ${jsonResultsPath}`);
  
  // Print summary to console
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total Tests: ${testResults.summary.totalTests}`);
  console.log(`Passed: ${testResults.summary.passedTests}`);
  console.log(`Failed: ${testResults.summary.failedTests}`);
  console.log(`Skipped: ${testResults.summary.skippedTests}`);
  console.log(`Success Rate: ${successRate.toFixed(1)}%`);
  console.log('='.repeat(60));
};

// Run the tests
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { runTests, TEST_CONFIG };