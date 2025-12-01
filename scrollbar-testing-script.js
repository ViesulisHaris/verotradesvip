const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// Test configuration
const BASE_URL = 'http://localhost:3001';
const TEST_RESULTS_DIR = './scrollbar-test-results';
const TIMESTAMP = new Date().toISOString().replace(/[:.]/g, '-');

// Create test results directory
if (!fs.existsSync(TEST_RESULTS_DIR)) {
  fs.mkdirSync(TEST_RESULTS_DIR, { recursive: true });
}

// Test results
const testResults = {
  timestamp: TIMESTAMP,
  summary: {
    total: 0,
    passed: 0,
    failed: 0,
    skipped: 0
  },
  details: []
};

// Helper function to take a screenshot
async function takeScreenshot(page, name, description) {
  const screenshotPath = path.join(TEST_RESULTS_DIR, `${name}-${TIMESTAMP}.png`);
  await page.screenshot({ 
    path: screenshotPath, 
    fullPage: false,
    clip: { x: 0, y: 0, width: 1200, height: 800 }
  });
  console.log(`📸 Screenshot saved: ${screenshotPath}`);
  return screenshotPath;
}

// Helper function to test scrollbar properties
async function testScrollbarProperties(page, selector, testName) {
  try {
    const scrollbarInfo = await page.evaluate((selector) => {
      const element = document.querySelector(selector);
      if (!element) return null;
      
      const computedStyle = window.getComputedStyle(element);
      const scrollbarWidth = element.offsetWidth - element.clientWidth;
      
      // Check for custom scrollbar styles
      const hasCustomScrollbar = computedStyle.getPropertyValue('scrollbar-width') !== 'auto' ||
                              computedStyle.getPropertyValue('scrollbar-color') !== 'auto';
      
      // Check for webkit scrollbar styles
      const hasWebkitScrollbar = !!computedStyle.getPropertyValue('::-webkit-scrollbar');
      
      return {
        exists: !!element,
        hasCustomScrollbar,
        hasWebkitScrollbar,
        scrollbarWidth,
        overflow: computedStyle.getPropertyValue('overflow'),
        overflowY: computedStyle.getPropertyValue('overflow-y'),
        overflowX: computedStyle.getPropertyValue('overflow-x'),
        scrollbarClass: element.className.includes('scrollbar-') ? element.className : 'none'
      };
    }, selector);
    
    return scrollbarInfo;
  } catch (error) {
    console.error(`Error testing scrollbar properties for ${testName}:`, error);
    return null;
  }
}

// Helper function to test hover effects
async function testScrollbarHover(page, selector, testName) {
  try {
    const hoverInfo = await page.evaluate((selector) => {
      const element = document.querySelector(selector);
      if (!element) return null;
      
      // Create a mock hover event
      const event = new MouseEvent('mouseover', {
        view: window,
        bubbles: true,
        cancelable: true
      });
      element.dispatchEvent(event);
      
      // Check if the element has hover-related styles
      const computedStyle = window.getComputedStyle(element, ':hover');
      
      return {
        hasHoverStyles: computedStyle.getPropertyValue('transform') !== 'none' ||
                       computedStyle.getPropertyValue('box-shadow') !== 'none',
        hoverTransform: computedStyle.getPropertyValue('transform'),
        hoverBoxShadow: computedStyle.getPropertyValue('box-shadow')
      };
    }, selector);
    
    return hoverInfo;
  } catch (error) {
    console.error(`Error testing hover effects for ${testName}:`, error);
    return null;
  }
}

// Main test function
async function testScrollbars() {
  console.log('🚀 Starting comprehensive scrollbar testing...\n');
  
  const browser = await chromium.launch({ 
    headless: false, // Set to true for headless mode
    slowMo: 100 // Slow down actions for better visibility
  });
  
  const context = await browser.newContext({
    viewport: { width: 1200, height: 800 }
  });
  
  const page = await context.newPage();
  
  try {
    // Test 1: Main page scrollbar (body element with .scrollbar-global)
    console.log('📋 Test 1: Main page scrollbar (body element with .scrollbar-global)');
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // Wait for animations
    
    const mainScrollbarInfo = await testScrollbarProperties(page, 'body', 'Main Page');
    const mainHoverInfo = await testScrollbarHover(page, 'body', 'Main Page');
    
    await takeScreenshot(page, 'main-page-scrollbar', 'Main page with global scrollbar');
    
    testResults.details.push({
      test: 'Main Page Scrollbar',
      selector: 'body',
      class: 'scrollbar-global',
      info: mainScrollbarInfo,
      hover: mainHoverInfo,
      screenshot: `main-page-scrollbar-${TIMESTAMP}.png`,
      passed: mainScrollbarInfo && mainScrollbarInfo.hasCustomScrollbar
    });
    
    // Test 2: Sidebar navigation scrollbar
    console.log('📋 Test 2: Sidebar navigation scrollbar');
    await page.waitForSelector('nav', { timeout: 5000 });
    const sidebarScrollbarInfo = await testScrollbarProperties(page, 'nav', 'Sidebar Navigation');
    const sidebarHoverInfo = await testScrollbarHover(page, 'nav', 'Sidebar Navigation');
    
    await takeScreenshot(page, 'sidebar-scrollbar', 'Sidebar navigation scrollbar');
    
    testResults.details.push({
      test: 'Sidebar Navigation Scrollbar',
      selector: 'nav',
      class: 'scrollbar-glass',
      info: sidebarScrollbarInfo,
      hover: sidebarHoverInfo,
      screenshot: `sidebar-scrollbar-${TIMESTAMP}.png`,
      passed: sidebarScrollbarInfo && sidebarScrollbarInfo.hasCustomScrollbar
    });
    
    // Test 3: Login and navigate to trades page for modal testing
    console.log('📋 Test 3: Login and navigate to trades page');
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');
    
    // Fill login form
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Navigate to trades page
    await page.goto(`${BASE_URL}/trades`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Test 4: Trade Modal scrollbar
    console.log('📋 Test 4: Trade Modal scrollbar');
    // Try to open a trade modal
    const addTradeButton = await page.$('button:has-text("Add Trade")');
    if (addTradeButton) {
      await addTradeButton.click();
      await page.waitForTimeout(1000);
      
      const tradeModalScrollbarInfo = await testScrollbarProperties(page, '.glass.max-w-5xl', 'Trade Modal');
      const tradeModalHoverInfo = await testScrollbarHover(page, '.glass.max-w-5xl', 'Trade Modal');
      
      await takeScreenshot(page, 'trade-modal-scrollbar', 'Trade modal scrollbar');
      
      testResults.details.push({
        test: 'Trade Modal Scrollbar',
        selector: '.glass.max-w-5xl',
        class: 'scrollbar-glass',
        info: tradeModalScrollbarInfo,
        hover: tradeModalHoverInfo,
        screenshot: `trade-modal-scrollbar-${TIMESTAMP}.png`,
        passed: tradeModalScrollbarInfo && tradeModalScrollbarInfo.hasCustomScrollbar
      });
      
      // Close modal
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
    } else {
      testResults.details.push({
        test: 'Trade Modal Scrollbar',
        selector: '.glass.max-w-5xl',
        class: 'scrollbar-glass',
        info: null,
        hover: null,
        screenshot: null,
        passed: false,
        note: 'Add Trade button not found'
      });
    }
    
    // Test 5: Dropdown scrollbar
    console.log('📋 Test 5: Dropdown scrollbar');
    // Look for dropdown elements
    const dropdownElements = await page.$$('.dropdown-options-container');
    if (dropdownElements.length > 0) {
      // Try to trigger a dropdown
      const dropdownTrigger = await page.$('button[aria-expanded="false"], button[aria-haspopup]');
      if (dropdownTrigger) {
        await dropdownTrigger.click();
        await page.waitForTimeout(500);
      }
      
      const dropdownScrollbarInfo = await testScrollbarProperties(page, '.dropdown-options-container', 'Dropdown');
      const dropdownHoverInfo = await testScrollbarHover(page, '.dropdown-options-container', 'Dropdown');
      
      await takeScreenshot(page, 'dropdown-scrollbar', 'Dropdown scrollbar');
      
      testResults.details.push({
        test: 'Dropdown Scrollbar',
        selector: '.dropdown-options-container',
        class: 'scrollbar-glass',
        info: dropdownScrollbarInfo,
        hover: dropdownHoverInfo,
        screenshot: `dropdown-scrollbar-${TIMESTAMP}.png`,
        passed: dropdownScrollbarInfo && dropdownScrollbarInfo.hasCustomScrollbar
      });
    } else {
      testResults.details.push({
        test: 'Dropdown Scrollbar',
        selector: '.dropdown-options-container',
        class: 'scrollbar-glass',
        info: null,
        hover: null,
        screenshot: null,
        passed: false,
        note: 'No dropdown elements found'
      });
    }
    
    // Test 6: Table overflow scrollbar
    console.log('📋 Test 6: Table overflow scrollbar');
    const tableScrollbarInfo = await testScrollbarProperties(page, '.overflow-x-auto', 'Table Overflow');
    const tableHoverInfo = await testScrollbarHover(page, '.overflow-x-auto', 'Table Overflow');
    
    await takeScreenshot(page, 'table-scrollbar', 'Table overflow scrollbar');
    
    testResults.details.push({
      test: 'Table Overflow Scrollbar',
      selector: '.overflow-x-auto',
      class: 'scrollbar-glass',
      info: tableScrollbarInfo,
      hover: tableHoverInfo,
      screenshot: `table-scrollbar-${TIMESTAMP}.png`,
      passed: tableScrollbarInfo && tableScrollbarInfo.hasCustomScrollbar
    });
    
    // Test 7: Calendar scrollbar
    console.log('📋 Test 7: Calendar scrollbar');
    await page.goto(`${BASE_URL}/calendar`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const calendarScrollbarInfo = await testScrollbarProperties(page, '.max-h-\\[70vh\\]', 'Calendar');
    const calendarHoverInfo = await testScrollbarHover(page, '.max-h-\\[70vh\\]', 'Calendar');
    
    await takeScreenshot(page, 'calendar-scrollbar', 'Calendar scrollbar');
    
    testResults.details.push({
      test: 'Calendar Scrollbar',
      selector: '.max-h-[70vh]',
      class: 'scrollbar-glass',
      info: calendarScrollbarInfo,
      hover: calendarHoverInfo,
      screenshot: `calendar-scrollbar-${TIMESTAMP}.png`,
      passed: calendarScrollbarInfo && calendarScrollbarInfo.hasCustomScrollbar
    });
    
    // Test 8: Strategy Performance Modal scrollbar
    console.log('📋 Test 8: Strategy Performance Modal scrollbar');
    await page.goto(`${BASE_URL}/strategies`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Try to open a strategy modal
    const strategyCards = await page.$$('.cursor-pointer');
    if (strategyCards.length > 0) {
      await strategyCards[0].click();
      await page.waitForTimeout(1000);
      
      const strategyModalScrollbarInfo = await testScrollbarProperties(page, '.glass.w-full.max-w-4xl', 'Strategy Performance Modal');
      const strategyModalHoverInfo = await testScrollbarHover(page, '.glass.w-full.max-w-4xl', 'Strategy Performance Modal');
      
      await takeScreenshot(page, 'strategy-modal-scrollbar', 'Strategy Performance Modal scrollbar');
      
      testResults.details.push({
        test: 'Strategy Performance Modal Scrollbar',
        selector: '.glass.w-full.max-w-4xl',
        class: 'scrollbar-glass',
        info: strategyModalScrollbarInfo,
        hover: strategyModalHoverInfo,
        screenshot: `strategy-modal-scrollbar-${TIMESTAMP}.png`,
        passed: strategyModalScrollbarInfo && strategyModalScrollbarInfo.hasCustomScrollbar
      });
      
      // Close modal
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
    } else {
      testResults.details.push({
        test: 'Strategy Performance Modal Scrollbar',
        selector: '.glass.w-full.max-w-4xl',
        class: 'scrollbar-glass',
        info: null,
        hover: null,
        screenshot: null,
        passed: false,
        note: 'No strategy cards found'
      });
    }
    
    // Test 9: Confluence page scrollbar
    console.log('📋 Test 9: Confluence page scrollbar');
    await page.goto(`${BASE_URL}/confluence`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const confluenceScrollbarInfo = await testScrollbarProperties(page, '.overflow-x-auto', 'Confluence Page');
    const confluenceHoverInfo = await testScrollbarHover(page, '.overflow-x-auto', 'Confluence Page');
    
    await takeScreenshot(page, 'confluence-scrollbar', 'Confluence page scrollbar');
    
    testResults.details.push({
      test: 'Confluence Page Scrollbar',
      selector: '.overflow-x-auto',
      class: 'scrollbar-glass',
      info: confluenceScrollbarInfo,
      hover: confluenceHoverInfo,
      screenshot: `confluence-scrollbar-${TIMESTAMP}.png`,
      passed: confluenceScrollbarInfo && confluenceScrollbarInfo.hasCustomScrollbar
    });
    
    // Test 10: Enhanced Strategy Card scrollbar
    console.log('📋 Test 10: Enhanced Strategy Card scrollbar');
    const strategyCardScrollbarInfo = await testScrollbarProperties(page, '.max-h-\\[80px\\]', 'Enhanced Strategy Card');
    const strategyCardHoverInfo = await testScrollbarHover(page, '.max-h-\\[80px\\]', 'Enhanced Strategy Card');
    
    await takeScreenshot(page, 'strategy-card-scrollbar', 'Enhanced Strategy Card scrollbar');
    
    testResults.details.push({
      test: 'Enhanced Strategy Card Scrollbar',
      selector: '.max-h-[80px]',
      class: 'scrollbar-glass',
      info: strategyCardScrollbarInfo,
      hover: strategyCardHoverInfo,
      screenshot: `strategy-card-scrollbar-${TIMESTAMP}.png`,
      passed: strategyCardScrollbarInfo && strategyCardScrollbarInfo.hasCustomScrollbar
    });
    
  } catch (error) {
    console.error('Error during testing:', error);
  } finally {
    await browser.close();
  }
  
  // Calculate summary
  testResults.summary.total = testResults.details.length;
  testResults.summary.passed = testResults.details.filter(d => d.passed).length;
  testResults.summary.failed = testResults.details.filter(d => !d.passed).length;
  
  // Save test results
  const resultsPath = path.join(TEST_RESULTS_DIR, `scrollbar-test-results-${TIMESTAMP}.json`);
  fs.writeFileSync(resultsPath, JSON.stringify(testResults, null, 2));
  
  // Generate report
  generateReport(testResults);
  
  console.log('\n✅ Testing completed!');
  console.log(`📊 Results: ${testResults.summary.passed}/${testResults.summary.total} tests passed`);
  console.log(`📁 Results saved to: ${TEST_RESULTS_DIR}`);
  console.log(`📄 Report saved to: ${resultsPath}`);
}

// Generate HTML report
function generateReport(results) {
  const reportPath = path.join(TEST_RESULTS_DIR, `scrollbar-test-report-${TIMESTAMP}.html`);
  
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Scrollbar Testing Report</title>
    <style>
        body {
            font-family: 'Inter', system-ui, sans-serif;
            background: linear-gradient(135deg, #0f172a, #1e293b);
            color: white;
            margin: 0;
            padding: 2rem;
            line-height: 1.6;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
        }
        .header {
            text-align: center;
            margin-bottom: 3rem;
        }
        .summary {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1rem;
            margin-bottom: 3rem;
        }
        .summary-card {
            background: rgba(15, 23, 42, 0.8);
            backdrop-filter: blur(16px);
            border: 1px solid rgba(59, 130, 246, 0.2);
            border-radius: 1rem;
            padding: 1.5rem;
            text-align: center;
        }
        .test-item {
            background: rgba(15, 23, 42, 0.8);
            backdrop-filter: blur(16px);
            border: 1px solid rgba(59, 130, 246, 0.2);
            border-radius: 1rem;
            padding: 1.5rem;
            margin-bottom: 1.5rem;
        }
        .test-item.passed {
            border-color: rgba(34, 197, 94, 0.3);
        }
        .test-item.failed {
            border-color: rgba(239, 68, 68, 0.3);
        }
        .status {
            display: inline-block;
            padding: 0.25rem 0.75rem;
            border-radius: 0.5rem;
            font-weight: 600;
            font-size: 0.875rem;
        }
        .status.passed {
            background: rgba(34, 197, 94, 0.2);
            color: #22c55e;
        }
        .status.failed {
            background: rgba(239, 68, 68, 0.2);
            color: #ef4444;
        }
        .screenshot {
            max-width: 100%;
            border-radius: 0.5rem;
            margin-top: 1rem;
        }
        .details {
            background: rgba(0, 0, 0, 0.3);
            padding: 1rem;
            border-radius: 0.5rem;
            margin-top: 1rem;
            font-family: monospace;
            font-size: 0.875rem;
        }
        h1, h2, h3 {
            color: #60a5fa;
        }
        .gradient-text {
            background: linear-gradient(135deg, #60a5fa, #06b6d4);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 class="gradient-text">Scrollbar Implementation Testing Report</h1>
            <p>Generated on ${new Date(results.timestamp).toLocaleString()}</p>
        </div>
        
        <div class="summary">
            <div class="summary-card">
                <h3>Total Tests</h3>
                <div style="font-size: 2rem; font-weight: bold;">${results.summary.total}</div>
            </div>
            <div class="summary-card">
                <h3>Passed</h3>
                <div style="font-size: 2rem; font-weight: bold; color: #22c55e;">${results.summary.passed}</div>
            </div>
            <div class="summary-card">
                <h3>Failed</h3>
                <div style="font-size: 2rem; font-weight: bold; color: #ef4444;">${results.summary.failed}</div>
            </div>
            <div class="summary-card">
                <h3>Success Rate</h3>
                <div style="font-size: 2rem; font-weight: bold;">${Math.round((results.summary.passed / results.summary.total) * 100)}%</div>
            </div>
        </div>
        
        <h2>Test Results</h2>
        ${results.details.map(test => `
            <div class="test-item ${test.passed ? 'passed' : 'failed'}">
                <h3>${test.test} <span class="status ${test.passed ? 'passed' : 'failed'}">${test.passed ? 'PASSED' : 'FAILED'}</span></h3>
                <p><strong>Selector:</strong> <code>${test.selector}</code></p>
                <p><strong>Class:</strong> <code>${test.class}</code></p>
                ${test.note ? `<p><strong>Note:</strong> ${test.note}</p>` : ''}
                ${test.screenshot ? `<img src="${test.screenshot}" alt="${test.test}" class="screenshot">` : ''}
                ${test.info ? `
                    <div class="details">
                        <strong>Scrollbar Info:</strong><br>
                        ${JSON.stringify(test.info, null, 2)}
                    </div>
                ` : ''}
                ${test.hover ? `
                    <div class="details">
                        <strong>Hover Info:</strong><br>
                        ${JSON.stringify(test.hover, null, 2)}
                    </div>
                ` : ''}
            </div>
        `).join('')}
    </div>
</body>
</html>
  `;
  
  fs.writeFileSync(reportPath, html);
  console.log(`📄 HTML report generated: ${reportPath}`);
}

// Run the tests
testScrollbars().catch(console.error);