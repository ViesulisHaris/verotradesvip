const { chromium } = require('playwright');
const fs = require('fs');

// Test configuration
const BASE_URL = 'http://localhost:3000';
const TEST_RESULTS = {
  timestamp: new Date().toISOString(),
  originalErrorFound: false,
  pageLoadSuccess: false,
  screenshots: [],
  consoleErrors: [],
  pageContent: '',
  detailedFindings: []
};

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function takeScreenshot(page, name) {
  const screenshotPath = `test-screenshots/focused-verification-${name}-${Date.now()}.png`;
  try {
    await page.screenshot({ path: screenshotPath, fullPage: true });
    TEST_RESULTS.screenshots.push(screenshotPath);
    console.log(`Screenshot saved: ${screenshotPath}`);
  } catch (error) {
    console.error(`Failed to take screenshot ${name}:`, error.message);
  }
}

async function logFinding(description, isPositive = true) {
  const finding = {
    description,
    isPositive,
    timestamp: new Date().toISOString()
  };
  TEST_RESULTS.detailedFindings.push(finding);
  
  const status = isPositive ? '✅' : '❌';
  console.log(`${status} ${description}`);
}

async function monitorConsoleErrors(page) {
  page.on('console', msg => {
    if (msg.type() === 'error') {
      TEST_RESULTS.consoleErrors.push({
        text: msg.text(),
        timestamp: new Date().toISOString()
      });
    }
  });

  page.on('pageerror', error => {
    TEST_RESULTS.consoleErrors.push({
      text: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
  });
}

async function checkForOriginalErrorMessage(page) {
  const originalErrorText = "An unexpected error occurred while loading the strategy. Please try again.";
  
  // Check multiple ways the error might appear
  const checks = [
    // Direct text search
    async () => {
      const content = await page.content();
      return content.includes(originalErrorText);
    },
    
    // Body text search
    async () => {
      const bodyText = await page.evaluate(() => document.body.innerText);
      return bodyText.includes(originalErrorText);
    },
    
    // Error element selectors
    async () => {
      const errorSelectors = [
        '[data-testid="error-message"]',
        '.error-message',
        '.alert-error',
        '[role="alert"]',
        '.error',
        '.alert'
      ];
      
      for (const selector of errorSelectors) {
        try {
          const elements = await page.$$(selector);
          for (const element of elements) {
            const text = await element.textContent();
            if (text && text.includes(originalErrorText)) {
              return true;
            }
          }
        } catch (error) {
          // Continue checking other selectors
        }
      }
      return false;
    }
  ];
  
  for (const check of checks) {
    try {
      if (await check()) {
        return true;
      }
    } catch (error) {
      console.log('Error during check:', error.message);
    }
  }
  
  return false;
}

async function analyzePageContent(page) {
  const content = await page.content();
  const bodyText = await page.evaluate(() => document.body.innerText);
  
  TEST_RESULTS.pageContent = bodyText;
  
  // Look for indicators of strategy page functionality
  const indicators = {
    hasStrategyElements: bodyText.toLowerCase().includes('strategy'),
    hasPerformanceData: bodyText.toLowerCase().includes('performance') || bodyText.toLowerCase().includes('profit'),
    hasErrorElements: bodyText.toLowerCase().includes('error') || bodyText.toLowerCase().includes('failed'),
    hasLoadingElements: bodyText.toLowerCase().includes('loading') || bodyText.toLowerCase().includes('please wait'),
    hasEmptyState: bodyText.toLowerCase().includes('no strategies') || bodyText.toLowerCase().includes('create your first strategy'),
    pageHasContent: bodyText.length > 100
  };
  
  return indicators;
}

async function performFocusedVerification() {
  console.log('Starting focused verification for schema cache corruption fix...\n');
  
  // Create screenshots directory
  if (!fs.existsSync('test-screenshots')) {
    fs.mkdirSync('test-screenshots');
  }
  
  let browser;
  let page;
  
  try {
    // Launch browser
    browser = await chromium.launch({
      headless: false, // Set to false for visual verification
      viewport: { width: 1920, height: 1080 }
    });
    
    page = await browser.newPage();
    await monitorConsoleErrors(page);
    
    console.log('=== Navigating to Strategies Page ===');
    
    // Navigate to strategies page
    await page.goto(`${BASE_URL}/strategies`, { waitUntil: 'networkidle' });
    await sleep(3000); // Give extra time for any dynamic content to load
    
    await takeScreenshot(page, 'strategies-page-load');
    
    console.log('\n=== Checking for Original Error Message ===');
    
    // Check specifically for the original error message
    const hasOriginalError = await checkForOriginalErrorMessage(page);
    TEST_RESULTS.originalErrorFound = hasOriginalError;
    
    if (hasOriginalError) {
      await logFinding('Original error message "An unexpected error occurred while loading the strategy. Please try again." FOUND', false);
    } else {
      await logFinding('Original error message "An unexpected error occurred while loading the strategy. Please try again." NOT FOUND - This indicates the fix is working!', true);
    }
    
    console.log('\n=== Analyzing Page Content ===');
    
    // Analyze page content and structure
    const indicators = await analyzePageContent(page);
    
    await logFinding(`Page has content: ${indicators.pageHasContent}`, indicators.pageHasContent);
    await logFinding(`Page contains strategy-related elements: ${indicators.hasStrategyElements}`, indicators.hasStrategyElements);
    await logFinding(`Page contains performance data: ${indicators.hasPerformanceData}`, indicators.hasPerformanceData);
    await logFinding(`Page contains error indicators: ${indicators.hasErrorElements}`, !indicators.hasErrorElements);
    await logFinding(`Page contains loading indicators: ${indicators.hasLoadingElements}`, !indicators.hasLoadingElements);
    await logFinding(`Page shows empty state: ${indicators.hasEmptyState}`, indicators.hasEmptyState);
    
    // Check page title
    const pageTitle = await page.title();
    await logFinding(`Page title: ${pageTitle}`, true);
    
    // Check for specific strategy page elements
    const strategySelectors = [
      '[data-testid="strategy-list"]',
      '.strategy-container',
      '.strategies-grid',
      '.strategy-card',
      '.strategy-row',
      '.strategy-item'
    ];
    
    let hasStrategyElements = false;
    for (const selector of strategySelectors) {
      try {
        const elements = await page.$$(selector);
        if (elements.length > 0) {
          hasStrategyElements = true;
          await logFinding(`Found strategy elements with selector: ${selector} (${elements.length} elements)`, true);
          break;
        }
      } catch (error) {
        // Continue checking other selectors
      }
    }
    
    if (!hasStrategyElements) {
      await logFinding('No strategy elements found with common selectors', false);
    }
    
    // Check for error state vs empty state
    const errorStateIndicators = [
      'error',
      'failed',
      'something went wrong',
      'unable to load',
      'unexpected error'
    ];
    
    const emptyStateIndicators = [
      'no strategies',
      'create your first strategy',
      'get started',
      'add strategy',
      'no data'
    ];
    
    const bodyText = bodyText.toLowerCase();
    const hasErrorState = errorStateIndicators.some(indicator => bodyText.includes(indicator));
    const hasEmptyState = emptyStateIndicators.some(indicator => bodyText.includes(indicator));
    
    if (hasErrorState) {
      await logFinding('Page shows error state', false);
    } else if (hasEmptyState) {
      await logFinding('Page shows empty state (this is normal when no strategies exist)', true);
    } else if (hasStrategyElements) {
      await logFinding('Page shows strategy content', true);
    } else {
      await logFinding('Page state unclear - no clear indicators found', false);
    }
    
    // Determine overall page load success
    TEST_RESULTS.pageLoadSuccess = !hasOriginalError && indicators.pageHasContent && !hasErrorState;
    
    await browser.close();
    
    return TEST_RESULTS;
    
  } catch (error) {
    console.error('Verification failed:', error);
    if (browser) await browser.close();
    throw error;
  }
}

async function generateFocusedReport(results) {
  console.log('\n=== FOCUSED VERIFICATION REPORT ===');
  
  const report = {
    ...results,
    summary: {
      originalErrorGone: !results.originalErrorFound,
      pageLoadSuccessful: results.pageLoadSuccess,
      consoleErrorsCount: results.consoleErrors.length,
      screenshotsTaken: results.screenshots.length
    }
  };
  
  // Save detailed report
  const reportPath = `focused-strategy-fix-verification-${Date.now()}.json`;
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  console.log(`\n=== KEY FINDINGS ===`);
  console.log(`Original Error Message Status: ${results.originalErrorFound ? '❌ STILL PRESENT' : '✅ GONE'}`);
  console.log(`Page Load Status: ${results.pageLoadSuccess ? '✅ SUCCESSFUL' : '❌ FAILED'}`);
  console.log(`Console Errors: ${results.consoleErrors.length}`);
  console.log(`Screenshots: ${results.screenshots.length}`);
  console.log(`Report saved to: ${reportPath}`);
  
  if (results.consoleErrors.length > 0) {
    console.log(`\n=== Console Errors ===`);
    results.consoleErrors.forEach((error, index) => {
      console.log(`${index + 1}. ${error.text}`);
    });
  }
  
  return report;
}

// Run the focused verification
if (require.main === module) {
  performFocusedVerification()
    .then(results => {
      const report = generateFocusedReport(results);
      
      console.log('\n=== FINAL CONCLUSION ===');
      if (!results.originalErrorFound && results.pageLoadSuccess) {
        console.log('✅ SCHEMA CACHE CORRUPTION FIX VERIFICATION: SUCCESS');
        console.log('The original error "An unexpected error occurred while loading the strategy. Please try again." is no longer present.');
        console.log('The strategies page loads successfully without the schema cache corruption issue.');
      } else if (results.originalErrorFound) {
        console.log('❌ SCHEMA CACHE CORRUPTION FIX VERIFICATION: FAILED');
        console.log('The original error is still present, indicating the fix may not be working properly.');
      } else {
        console.log('⚠️  SCHEMA CACHE CORRUPTION FIX VERIFICATION: PARTIAL');
        console.log('The original error is gone, but there may be other issues affecting the page.');
      }
      
      process.exit(!results.originalErrorFound && results.pageLoadSuccess ? 0 : 1);
    })
    .catch(error => {
      console.error('Focused verification failed:', error);
      process.exit(1);
    });
}

module.exports = { performFocusedVerification };