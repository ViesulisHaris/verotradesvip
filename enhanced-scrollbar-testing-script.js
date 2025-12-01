const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// Test configuration
const BASE_URL = 'http://localhost:3001';
const TEST_RESULTS_DIR = './enhanced-scrollbar-test-results';
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
      
      // Check if element has scrollbar class
      const scrollbarClass = Array.from(element.classList).find(c => c.includes('scrollbar-'));
      
      return {
        exists: !!element,
        hasCustomScrollbar,
        hasWebkitScrollbar,
        scrollbarWidth,
        overflow: computedStyle.getPropertyValue('overflow'),
        overflowY: computedStyle.getPropertyValue('overflow-y'),
        overflowX: computedStyle.getPropertyValue('overflow-x'),
        scrollbarClass: scrollbarClass || 'none',
        className: element.className
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
      
      // Check if element has hover-related styles
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

// Helper function to wait for element with multiple selectors
async function waitForAnySelector(page, selectors, timeout = 5000) {
  for (const selector of selectors) {
    try {
      await page.waitForSelector(selector, { timeout });
      return selector;
    } catch (error) {
      // Continue to next selector
    }
  }
  return null;
}

// Main test function
async function testScrollbars() {
  console.log('🚀 Starting enhanced comprehensive scrollbar testing...\n');
  
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
    // Try multiple selectors for navigation
    const navSelector = await waitForAnySelector(page, [
      'nav',
      '.flex-1.p-4.space-y-2.overflow-y-auto',
      '[class*="overflow-y-auto"]',
      '[class*="scrollbar-glass"]'
    ]);
    
    if (navSelector) {
      const sidebarScrollbarInfo = await testScrollbarProperties(page, navSelector, 'Sidebar Navigation');
      const sidebarHoverInfo = await testScrollbarHover(page, navSelector, 'Sidebar Navigation');
      
      await takeScreenshot(page, 'sidebar-scrollbar', 'Sidebar navigation scrollbar');
      
      testResults.details.push({
        test: 'Sidebar Navigation Scrollbar',
        selector: navSelector,
        class: 'scrollbar-glass',
        info: sidebarScrollbarInfo,
        hover: sidebarHoverInfo,
        screenshot: `sidebar-scrollbar-${TIMESTAMP}.png`,
        passed: sidebarScrollbarInfo && sidebarScrollbarInfo.hasCustomScrollbar
      });
    } else {
      testResults.details.push({
        test: 'Sidebar Navigation Scrollbar',
        selector: 'nav',
        class: 'scrollbar-glass',
        info: null,
        hover: null,
        screenshot: null,
        passed: false,
        note: 'Navigation element not found'
      });
    }
    
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
    const addTradeButton = await page.$('button:has-text("Add Trade"), button:has-text("New Trade"), button[aria-label*="Trade"]');
    if (addTradeButton) {
      await addTradeButton.click();
      await page.waitForTimeout(1000);
      
      // Try multiple selectors for the modal
      const modalSelector = await waitForAnySelector(page, [
        '.glass.max-w-5xl',
        '.glass.rounded-2xl',
        '[class*="scrollbar-glass"]',
        '[role="dialog"]'
      ]);
      
      if (modalSelector) {
        const tradeModalScrollbarInfo = await testScrollbarProperties(page, modalSelector, 'Trade Modal');
        const tradeModalHoverInfo = await testScrollbarHover(page, modalSelector, 'Trade Modal');
        
        await takeScreenshot(page, 'trade-modal-scrollbar', 'Trade modal scrollbar');
        
        testResults.details.push({
          test: 'Trade Modal Scrollbar',
          selector: modalSelector,
          class: 'scrollbar-glass',
          info: tradeModalScrollbarInfo,
          hover: tradeModalHoverInfo,
          screenshot: `trade-modal-scrollbar-${TIMESTAMP}.png`,
          passed: tradeModalScrollbarInfo && tradeModalScrollbarInfo.hasCustomScrollbar
        });
      } else {
        testResults.details.push({
          test: 'Trade Modal Scrollbar',
          selector: '.glass.max-w-5xl',
          class: 'scrollbar-glass',
          info: null,
          hover: null,
          screenshot: null,
          passed: false,
          note: 'Trade modal not found after clicking Add Trade'
        });
      }
      
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
    const dropdownSelector = await waitForAnySelector(page, [
      '.dropdown-options-container',
      '[class*="dropdown"]',
      '[role="listbox"]',
      '[aria-haspopup="true"]'
    ]);
    
    if (dropdownSelector) {
      // Try to trigger a dropdown
      const dropdownTrigger = await page.$('button[aria-expanded="false"], button[aria-haspopup], select');
      if (dropdownTrigger) {
        await dropdownTrigger.click();
        await page.waitForTimeout(500);
      }
      
      const dropdownScrollbarInfo = await testScrollbarProperties(page, dropdownSelector, 'Dropdown');
      const dropdownHoverInfo = await testScrollbarHover(page, dropdownSelector, 'Dropdown');
      
      await takeScreenshot(page, 'dropdown-scrollbar', 'Dropdown scrollbar');
      
      testResults.details.push({
        test: 'Dropdown Scrollbar',
        selector: dropdownSelector,
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
    const tableSelector = await waitForAnySelector(page, [
      '.overflow-x-auto',
      'table',
      '[class*="overflow"]'
    ]);
    
    if (tableSelector) {
      const tableScrollbarInfo = await testScrollbarProperties(page, tableSelector, 'Table Overflow');
      const tableHoverInfo = await testScrollbarHover(page, tableSelector, 'Table Overflow');
      
      await takeScreenshot(page, 'table-scrollbar', 'Table overflow scrollbar');
      
      testResults.details.push({
        test: 'Table Overflow Scrollbar',
        selector: tableSelector,
        class: 'scrollbar-glass',
        info: tableScrollbarInfo,
        hover: tableHoverInfo,
        screenshot: `table-scrollbar-${TIMESTAMP}.png`,
        passed: tableScrollbarInfo && tableScrollbarInfo.hasCustomScrollbar
      });
    } else {
      testResults.details.push({
        test: 'Table Overflow Scrollbar',
        selector: '.overflow-x-auto',
        class: 'scrollbar-glass',
        info: null,
        hover: null,
        screenshot: null,
        passed: false,
        note: 'No table elements found'
      });
    }
    
    // Test 7: Calendar scrollbar
    console.log('📋 Test 7: Calendar scrollbar');
    await page.goto(`${BASE_URL}/calendar`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const calendarSelector = await waitForAnySelector(page, [
      '.max-h-\\[70vh\\]',
      '[class*="scrollbar-glass"]',
      '[class*="overflow-y-auto"]',
      '.glass.p-6'
    ]);
    
    if (calendarSelector) {
      const calendarScrollbarInfo = await testScrollbarProperties(page, calendarSelector, 'Calendar');
      const calendarHoverInfo = await testScrollbarHover(page, calendarSelector, 'Calendar');
      
      await takeScreenshot(page, 'calendar-scrollbar', 'Calendar scrollbar');
      
      testResults.details.push({
        test: 'Calendar Scrollbar',
        selector: calendarSelector,
        class: 'scrollbar-glass',
        info: calendarScrollbarInfo,
        hover: calendarHoverInfo,
        screenshot: `calendar-scrollbar-${TIMESTAMP}.png`,
        passed: calendarScrollbarInfo && calendarScrollbarInfo.hasCustomScrollbar
      });
    } else {
      testResults.details.push({
        test: 'Calendar Scrollbar',
        selector: '.max-h-[70vh]',
        class: 'scrollbar-glass',
        info: null,
        hover: null,
        screenshot: null,
        passed: false,
        note: 'Calendar elements not found'
      });
    }
    
    // Test 8: Strategy Performance Modal scrollbar
    console.log('📋 Test 8: Strategy Performance Modal scrollbar');
    await page.goto(`${BASE_URL}/strategies`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Try to open a strategy modal
    const strategyCards = await page.$$('.cursor-pointer, [class*="cursor-pointer"], button');
    if (strategyCards.length > 0) {
      await strategyCards[0].click();
      await page.waitForTimeout(1000);
      
      const strategyModalSelector = await waitForAnySelector(page, [
        '.glass.w-full.max-w-4xl',
        '[role="dialog"]',
        '[class*="scrollbar-glass"]',
        '.modal'
      ]);
      
      if (strategyModalSelector) {
        const strategyModalScrollbarInfo = await testScrollbarProperties(page, strategyModalSelector, 'Strategy Performance Modal');
        const strategyModalHoverInfo = await testScrollbarHover(page, strategyModalSelector, 'Strategy Performance Modal');
        
        await takeScreenshot(page, 'strategy-modal-scrollbar', 'Strategy Performance Modal scrollbar');
        
        testResults.details.push({
          test: 'Strategy Performance Modal Scrollbar',
          selector: strategyModalSelector,
          class: 'scrollbar-glass',
          info: strategyModalScrollbarInfo,
          hover: strategyModalHoverInfo,
          screenshot: `strategy-modal-scrollbar-${TIMESTAMP}.png`,
          passed: strategyModalScrollbarInfo && strategyModalScrollbarInfo.hasCustomScrollbar
        });
      } else {
        testResults.details.push({
          test: 'Strategy Performance Modal Scrollbar',
          selector: '.glass.w-full.max-w-4xl',
          class: 'scrollbar-glass',
          info: null,
          hover: null,
          screenshot: null,
          passed: false,
          note: 'Strategy modal not found after clicking strategy card'
        });
      }
      
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
    
    const confluenceSelector = await waitForAnySelector(page, [
      '.overflow-x-auto',
      'table',
      '[class*="scrollbar-glass"]',
      '[class*="overflow"]'
    ]);
    
    if (confluenceSelector) {
      const confluenceScrollbarInfo = await testScrollbarProperties(page, confluenceSelector, 'Confluence Page');
      const confluenceHoverInfo = await testScrollbarHover(page, confluenceSelector, 'Confluence Page');
      
      await takeScreenshot(page, 'confluence-scrollbar', 'Confluence page scrollbar');
      
      testResults.details.push({
        test: 'Confluence Page Scrollbar',
        selector: confluenceSelector,
        class: 'scrollbar-glass',
        info: confluenceScrollbarInfo,
        hover: confluenceHoverInfo,
        screenshot: `confluence-scrollbar-${TIMESTAMP}.png`,
        passed: confluenceScrollbarInfo && confluenceScrollbarInfo.hasCustomScrollbar
      });
    } else {
      testResults.details.push({
        test: 'Confluence Page Scrollbar',
        selector: '.overflow-x-auto',
        class: 'scrollbar-glass',
        info: null,
        hover: null,
        screenshot: null,
        passed: false,
        note: 'Confluence page elements not found'
      });
    }
    
    // Test 10: Enhanced Strategy Card scrollbar
    console.log('📋 Test 10: Enhanced Strategy Card scrollbar');
    const strategyCardSelector = await waitForAnySelector(page, [
      '.max-h-\\[80px\\]',
      '[class*="max-h"]',
      '[class*="scrollbar-glass"]'
    ]);
    
    if (strategyCardSelector) {
      const strategyCardScrollbarInfo = await testScrollbarProperties(page, strategyCardSelector, 'Enhanced Strategy Card');
      const strategyCardHoverInfo = await testScrollbarHover(page, strategyCardSelector, 'Enhanced Strategy Card');
      
      await takeScreenshot(page, 'strategy-card-scrollbar', 'Enhanced Strategy Card scrollbar');
      
      testResults.details.push({
        test: 'Enhanced Strategy Card Scrollbar',
        selector: strategyCardSelector,
        class: 'scrollbar-glass',
        info: strategyCardScrollbarInfo,
        hover: strategyCardHoverInfo,
        screenshot: `strategy-card-scrollbar-${TIMESTAMP}.png`,
        passed: strategyCardScrollbarInfo && strategyCardScrollbarInfo.hasCustomScrollbar
      });
    } else {
      testResults.details.push({
        test: 'Enhanced Strategy Card Scrollbar',
        selector: '.max-h-[80px]',
        class: 'scrollbar-glass',
        info: null,
        hover: null,
        screenshot: null,
        passed: false,
        note: 'Enhanced Strategy Card elements not found'
      });
    }
    
    // Test 11: Test all scrollbar classes found in the code
    console.log('📋 Test 11: Test all scrollbar classes found in the code');
    const scrollbarClasses = [
      'scrollbar-glass',
      'scrollbar-blue',
      'scrollbar-cyan',
      'scrollbar-gradient',
      'scrollbar-global'
    ];
    
    for (const scrollbarClass of scrollbarClasses) {
      const elementsWithClass = await page.$$(`.${scrollbarClass}`);
      if (elementsWithClass.length > 0) {
        const classTestInfo = await testScrollbarProperties(page, `.${scrollbarClass}`, `Class: ${scrollbarClass}`);
        const classTestHover = await testScrollbarHover(page, `.${scrollbarClass}`, `Class: ${scrollbarClass}`);
        
        await takeScreenshot(page, `class-${scrollbarClass}`, `Scrollbar class: ${scrollbarClass}`);
        
        testResults.details.push({
          test: `Scrollbar Class: ${scrollbarClass}`,
          selector: `.${scrollbarClass}`,
          class: scrollbarClass,
          info: classTestInfo,
          hover: classTestHover,
          screenshot: `class-${scrollbarClass}-${TIMESTAMP}.png`,
          passed: classTestInfo && classTestInfo.hasCustomScrollbar,
          elementCount: elementsWithClass.length
        });
      }
    }
    
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
  const resultsPath = path.join(TEST_RESULTS_DIR, `enhanced-scrollbar-test-results-${TIMESTAMP}.json`);
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
  const reportPath = path.join(TEST_RESULTS_DIR, `enhanced-scrollbar-test-report-${TIMESTAMP}.html`);
  
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Enhanced Scrollbar Testing Report</title>
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
        .element-count {
            background: rgba(59, 130, 246, 0.2);
            color: #60a5fa;
            padding: 0.25rem 0.5rem;
            border-radius: 0.25rem;
            font-size: 0.75rem;
            font-weight: 600;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 class="gradient-text">Enhanced Scrollbar Implementation Testing Report</h1>
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
                ${test.elementCount ? `<p><strong>Elements Found:</strong> <span class="element-count">${test.elementCount}</span></p>` : ''}
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

// Run tests
testScrollbars().catch(console.error);