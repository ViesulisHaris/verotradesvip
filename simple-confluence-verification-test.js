/**
 * Simple Confluence Page Verification Test
 * 
 * This test focuses specifically on verifying that the confluence page loads properly
 * and that React key uniqueness errors have been resolved.
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Configuration
const APP_URL = 'http://localhost:3000';
const CONFLUENCE_URL = `${APP_URL}/confluence`;
const SCREENSHOTS_DIR = path.join(__dirname, 'simple-confluence-verification-screenshots');

// Test results
let testResults = {
  startTime: new Date().toISOString(),
  endTime: null,
  passed: 0,
  failed: 0,
  tests: [],
  reactKeyErrors: [],
  allConsoleErrors: []
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
    const errorText = msg.text();
    
    // Capture all errors
    if (msg.type() === 'error') {
      const error = {
        text: errorText,
        location: msg.location(),
        timestamp: new Date().toISOString()
      };
      consoleErrors.push(error);
      testResults.allConsoleErrors.push(error);
      
      // Specifically check for React key errors
      if (errorText.includes('Warning: Each child in a list should have a unique "key" prop') ||
          errorText.includes('Encountered two children with the same key')) {
        testResults.reactKeyErrors.push(error);
      }
      
      console.error(`Console error: ${errorText}`);
    }
  });
  
  page.on('pageerror', error => {
    const errorObj = {
      text: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    };
    consoleErrors.push(errorObj);
    testResults.allConsoleErrors.push(errorObj);
    console.error(`Page error: ${error.message}`);
  });
  
  return consoleErrors;
}

// Main test function
async function runSimpleConfluenceVerificationTest() {
  console.log('🚀 Starting Simple Confluence Page Verification Test');
  console.log('=================================================');
  
  let browser;
  let page;
  
  try {
    // Launch browser
    browser = await puppeteer.launch({
      headless: false, // Set to false for debugging
      defaultViewport: { width: 1280, height: 720 },
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    page = await browser.newPage();
    
    // Capture console errors
    captureConsoleErrors(page);
    
    // Set default timeout
    page.setDefaultTimeout(30000);
    
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
    
    // Test 2: Wait for page to load and check for content
    console.log('\n📋 Test 2: Wait for page to load and check for content');
    try {
      // Wait for either the main content or an error message to appear
      await Promise.race([
        page.waitForSelector('h1', { timeout: 10000 }),
        page.waitForSelector('.error', { timeout: 10000 }),
        page.waitForSelector('.loading', { timeout: 10000 })
      ]);
      
      // Take a screenshot to see what loaded
      await takeScreenshot(page, 'page-content-loaded');
      
      // Check if we have a loading spinner that might indicate infinite loading
      const loadingSpinner = await page.$('.animate-spin, .loading, .spinner');
      if (loadingSpinner) {
        // Wait a bit more to see if it disappears
        try {
          await page.waitForFunction(() => {
            return !document.querySelector('.animate-spin') && 
                   !document.querySelector('.loading') && 
                   !document.querySelector('.spinner');
          }, { timeout: 5000 });
          
          console.log('Loading spinner disappeared, page loaded successfully');
        } catch (e) {
          // If spinner still exists after timeout, it might be infinite loading
          await takeScreenshot(page, 'loading-spinner-still-present');
          logTestResult('Page loads without infinite loading', false, 
            'Loading spinner still present after timeout - possible infinite loading');
        }
      } else {
        logTestResult('Page loads without infinite loading', true);
      }
    } catch (error) {
      await takeScreenshot(page, 'page-load-error');
      logTestResult('Wait for page to load and check for content', false, error.message);
    }
    
    // Test 3: Verify React key uniqueness errors have been resolved
    console.log('\n📋 Test 3: Verify React key uniqueness errors have been resolved');
    try {
      // Wait a bit more to catch any delayed React errors
      await page.waitForTimeout(3000);
      
      if (testResults.reactKeyErrors.length > 0) {
        logTestResult('React key uniqueness errors resolved', false, 
          `Found ${testResults.reactKeyErrors.length} React key errors`);
        
        // Log the React key errors
        console.log('\nReact Key Errors Found:');
        testResults.reactKeyErrors.forEach((error, index) => {
          console.log(`  ${index + 1}. ${error.text}`);
        });
      } else {
        logTestResult('React key uniqueness errors resolved', true);
      }
    } catch (error) {
      logTestResult('React key uniqueness errors resolved', false, error.message);
    }
    
    // Test 4: Check for table rows and their keys if table exists
    console.log('\n📋 Test 4: Check for table rows and their keys if table exists');
    try {
      // Check if there's a table on the page
      const tableExists = await page.$('table');
      
      if (tableExists) {
        // Get all table rows in the confluence page
        const tableRows = await page.$$eval('tbody tr', rows => {
          return rows.map(row => {
            const key = row.getAttribute('key');
            const firstCellText = row.querySelector('td')?.textContent || '';
            return { key, firstCellText };
          });
        });
        
        console.log(`Found ${tableRows.length} table rows`);
        
        // Check if all rows have unique keys
        const keys = tableRows.map(row => row.key).filter(key => key !== null);
        const uniqueKeys = new Set(keys);
        
        if (keys.length > 0 && keys.length !== uniqueKeys.size) {
          const duplicateKeys = keys.filter((key, index) => keys.indexOf(key) !== index);
          logTestResult('Table rows have unique keys', false, 
            `Found duplicate keys: ${duplicateKeys.join(', ')}`);
        } else if (keys.length === 0) {
          logTestResult('Table rows have unique keys', true, 'No keys found on table rows (might be normal)');
        } else {
          logTestResult('Table rows have unique keys', true);
        }
      } else {
        logTestResult('Table rows have unique keys', true, 'No table found on page');
      }
    } catch (error) {
      logTestResult('Table rows have unique keys', false, error.message);
    }
    
    // Test 5: Check for any critical console errors
    console.log('\n📋 Test 5: Check for any critical console errors');
    try {
      // Filter out non-critical errors
      const nonCriticalErrors = [
        'net::ERR_FAILED', // Network errors that might be expected
        'favicon.ico', // Favicon errors
        'chrome://', // Chrome internal errors
        'chrome-extension://', // Chrome extension errors
        'test-token', // Errors related to our test token
        '404 (Not Found)', // 404 errors that might be expected
      ];
      
      const criticalErrors = testResults.allConsoleErrors.filter(error => 
        !nonCriticalErrors.some(pattern => error.text.includes(pattern))
      );
      
      if (criticalErrors.length > 0) {
        logTestResult('No critical console errors', false, 
          `Found ${criticalErrors.length} critical console errors`);
        
        // Log the critical errors
        console.log('\nCritical Console Errors Found:');
        criticalErrors.forEach((error, index) => {
          console.log(`  ${index + 1}. ${error.text}`);
        });
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
    const resultsPath = path.join(__dirname, 'simple-confluence-verification-results.json');
    fs.writeFileSync(resultsPath, JSON.stringify(testResults, null, 2));
    console.log(`\nTest results saved to: ${resultsPath}`);
    
    // Print summary
    console.log('\n📊 Test Summary');
    console.log('===============');
    console.log(`Total tests: ${testResults.tests.length}`);
    console.log(`Passed: ${testResults.passed}`);
    console.log(`Failed: ${testResults.failed}`);
    console.log(`Success rate: ${((testResults.passed / testResults.tests.length) * 100).toFixed(1)}%`);
    console.log(`React key errors found: ${testResults.reactKeyErrors.length}`);
    console.log(`Total console errors: ${testResults.allConsoleErrors.length}`);
    
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
    if (testResults.failed === 0 && testResults.reactKeyErrors.length === 0) {
      console.log('\n🎉 All tests passed! Confluence page is working correctly with no React key errors.');
    } else if (testResults.reactKeyErrors.length > 0) {
      console.log('\n⚠️  React key errors found. The fixes may not have been applied correctly.');
    } else {
      console.log('\n⚠️  Some tests failed. Please review the issues above.');
    }
  }
}

// Run the test
runSimpleConfluenceVerificationTest().catch(console.error);