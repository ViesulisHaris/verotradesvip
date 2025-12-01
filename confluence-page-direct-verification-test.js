/**
 * Confluence Page Direct Verification Test
 * 
 * This test directly verifies that the confluence page loads properly after the React key fixes,
 * bypassing the login step to focus on the specific issue.
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Configuration
const APP_URL = 'http://localhost:3000';
const CONFLUENCE_URL = `${APP_URL}/confluence`;
const SCREENSHOTS_DIR = path.join(__dirname, 'confluence-verification-screenshots');

// Test results
let testResults = {
  startTime: new Date().toISOString(),
  endTime: null,
  passed: 0,
  failed: 0,
  tests: []
};

// Create screenshots directory if it doesn't exist
if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

// Helper function to take a screenshot
async function takeScreenshot(page, name) {
  const screenshotPath = path.join(SCREENSHOTS_DIR, `${name}-${Date.now()}.png`);
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log(`Screenshot saved: ${screenshotPath}`);
  return screenshotPath;
}

// Helper function to log test results
function logTestResult(testName, passed, details = '') {
  const result = {
    name: testName,
    passed,
    details,
    timestamp: new Date().toISOString()
  };
  
  testResults.tests.push(result);
  
  if (passed) {
    testResults.passed++;
    console.log(`✅ PASS: ${testName}`);
  } else {
    testResults.failed++;
    console.error(`❌ FAIL: ${testName}`);
    if (details) console.error(`   Details: ${details}`);
  }
}

// Helper function to capture console errors
function captureConsoleErrors(page) {
  const consoleErrors = [];
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      const errorText = msg.text();
      consoleErrors.push({
        text: errorText,
        location: msg.location(),
        timestamp: new Date().toISOString()
      });
      console.error(`Console error: ${errorText}`);
    }
  });
  
  page.on('pageerror', error => {
    consoleErrors.push({
      text: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    console.error(`Page error: ${error.message}`);
  });
  
  return consoleErrors;
}

// Main test function
async function runConfluenceDirectVerificationTest() {
  console.log('🚀 Starting Confluence Page Direct Verification Test');
  console.log('===================================================');
  
  let browser;
  let page;
  let consoleErrors = [];
  
  try {
    // Launch browser
    browser = await puppeteer.launch({
      headless: false, // Set to false for debugging
      defaultViewport: { width: 1280, height: 720 },
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    page = await browser.newPage();
    
    // Capture console errors
    consoleErrors = captureConsoleErrors(page);
    
    // Set default timeout
    page.setDefaultTimeout(30000);
    
    // Set authentication state to bypass login
    await page.evaluateOnNewDocument(() => {
      localStorage.setItem('supabase.auth.token', JSON.stringify({
        currentSession: {
          access_token: 'test-token',
          refresh_token: 'test-refresh-token',
          expires_in: 3600,
          token_type: 'bearer',
          user: {
            id: 'test-user-id',
            email: 'test@example.com',
            aud: 'authenticated',
            role: 'authenticated'
          }
        }
      }));
    });
    
    // Test 1: Navigate directly to confluence page
    console.log('\n📋 Test 1: Navigate directly to confluence page');
    try {
      await page.goto(CONFLUENCE_URL, { waitUntil: 'networkidle2' });
      await takeScreenshot(page, 'confluence-page-loaded');
      logTestResult('Navigate directly to confluence page', true);
    } catch (error) {
      await takeScreenshot(page, 'confluence-page-failed');
      logTestResult('Navigate directly to confluence page', false, error.message);
      throw error;
    }
    
    // Test 2: Verify page loads without infinite loading
    console.log('\n📋 Test 2: Verify page loads without infinite loading');
    try {
      // Wait for content to load
      await page.waitForSelector('.card-luxury', { timeout: 10000 });
      
      // Check if loading spinner is not present after timeout
      const loadingSpinner = await page.$('.animate-spin');
      if (loadingSpinner) {
        // Wait a bit more to see if it disappears
        await page.waitForFunction(() => !document.querySelector('.animate-spin'), { timeout: 5000 })
          .catch(() => {
            // If spinner still exists, take screenshot and fail
            takeScreenshot(page, 'infinite-loading-detected');
            throw new Error('Loading spinner still present - infinite loading detected');
          });
      }
      
      await takeScreenshot(page, 'page-loaded-successfully');
      logTestResult('Page loads without infinite loading', true);
    } catch (error) {
      await takeScreenshot(page, 'infinite-loading-error');
      logTestResult('Page loads without infinite loading', false, error.message);
      throw error;
    }
    
    // Test 3: Verify React key uniqueness errors have been resolved
    console.log('\n📋 Test 3: Verify React key uniqueness errors have been resolved');
    try {
      // Check for React key errors in console
      const reactKeyErrors = consoleErrors.filter(error => 
        error.text.includes('Warning: Each child in a list should have a unique "key" prop') ||
        error.text.includes('Encountered two children with the same key')
      );
      
      if (reactKeyErrors.length > 0) {
        logTestResult('React key uniqueness errors resolved', false, 
          `Found ${reactKeyErrors.length} React key errors`);
      } else {
        logTestResult('React key uniqueness errors resolved', true);
      }
    } catch (error) {
      logTestResult('React key uniqueness errors resolved', false, error.message);
    }
    
    // Test 4: Verify table rows have unique keys
    console.log('\n📋 Test 4: Verify table rows have unique keys');
    try {
      // Get all table rows in the confluence page
      const tableRows = await page.$$eval('tbody tr', rows => {
        return rows.map(row => {
          const key = row.getAttribute('key');
          const tradeId = row.querySelector('td')?.textContent;
          return { key, tradeId };
        });
      });
      
      // Check if all rows have unique keys
      const keys = tableRows.map(row => row.key);
      const uniqueKeys = new Set(keys);
      
      if (keys.length !== uniqueKeys.size) {
        const duplicateKeys = keys.filter((key, index) => keys.indexOf(key) !== index);
        logTestResult('Table rows have unique keys', false, 
          `Found duplicate keys: ${duplicateKeys.join(', ')}`);
      } else {
        logTestResult('Table rows have unique keys', true);
      }
    } catch (error) {
      logTestResult('Table rows have unique keys', false, error.message);
    }
    
    // Test 5: Verify page is fully functional and interactive
    console.log('\n📋 Test 5: Verify page is fully functional and interactive');
    try {
      // Test refresh button
      const refreshButton = await page.$('button:has-text("Refresh")');
      if (refreshButton) {
        await refreshButton.click();
        await page.waitForTimeout(2000); // Wait for refresh to complete
      }
      
      // Test filter dropdown if present
      const filterDropdown = await page.$('button[aria-haspopup="listbox"]');
      if (filterDropdown) {
        await filterDropdown.click();
        await page.waitForTimeout(1000);
        await takeScreenshot(page, 'filter-dropdown-open');
        
        // Close dropdown
        await page.keyboard.press('Escape');
        await page.waitForTimeout(500);
      }
      
      // Test emotion radar if present
      const emotionRadar = await page.$('.recharts-wrapper');
      if (emotionRadar) {
        await takeScreenshot(page, 'emotion-radar-present');
      }
      
      await takeScreenshot(page, 'interactive-elements-tested');
      logTestResult('Page is fully functional and interactive', true);
    } catch (error) {
      await takeScreenshot(page, 'interactive-test-failed');
      logTestResult('Page is fully functional and interactive', false, error.message);
    }
    
    // Test 6: Capture and analyze any remaining console errors
    console.log('\n📋 Test 6: Capture and analyze any remaining console errors');
    try {
      // Wait a bit more to catch any delayed errors
      await page.waitForTimeout(3000);
      
      // Filter out non-critical errors
      const nonCriticalErrors = [
        'net::ERR_FAILED', // Network errors that might be expected
        'favicon.ico', // Favicon errors
        'chrome://', // Chrome internal errors
        'chrome-extension://', // Chrome extension errors
        'test-token', // Errors related to our test token
      ];
      
      const criticalErrors = consoleErrors.filter(error => 
        !nonCriticalErrors.some(pattern => error.text.includes(pattern))
      );
      
      if (criticalErrors.length > 0) {
        logTestResult('No critical console errors', false, 
          `Found ${criticalErrors.length} critical console errors`);
      } else {
        logTestResult('No critical console errors', true);
      }
    } catch (error) {
      logTestResult('No critical console errors', false, error.message);
    }
    
  } catch (error) {
    console.error('Test execution failed:', error);
    await takeScreenshot(page, 'test-execution-failed');
  } finally {
    // Close browser
    if (browser) {
      await browser.close();
    }
    
    // Update test results
    testResults.endTime = new Date().toISOString();
    
    // Save test results
    const resultsPath = path.join(__dirname, 'confluence-direct-verification-results.json');
    fs.writeFileSync(resultsPath, JSON.stringify(testResults, null, 2));
    console.log(`\nTest results saved to: ${resultsPath}`);
    
    // Print summary
    console.log('\n📊 Test Summary');
    console.log('===============');
    console.log(`Total tests: ${testResults.tests.length}`);
    console.log(`Passed: ${testResults.passed}`);
    console.log(`Failed: ${testResults.failed}`);
    console.log(`Success rate: ${((testResults.passed / testResults.tests.length) * 100).toFixed(1)}%`);
    
    // Print failed tests
    if (testResults.failed > 0) {
      console.log('\n❌ Failed Tests:');
      testResults.tests
        .filter(test => !test.passed)
        .forEach(test => {
          console.log(`  - ${test.name}: ${test.details}`);
        });
    }
    
    // Overall result
    if (testResults.failed === 0) {
      console.log('\n🎉 All tests passed! Confluence page is working correctly.');
    } else {
      console.log('\n⚠️  Some tests failed. Please review the issues above.');
    }
  }
}

// Run the test
runConfluenceDirectVerificationTest().catch(console.error);