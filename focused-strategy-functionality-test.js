const { chromium } = require('playwright');
const fs = require('fs');

// Test configuration
const TEST_CONFIG = {
  baseUrl: 'http://localhost:3000',
  credentials: {
    email: 'testuser@verotrade.com',
    password: 'TestPassword123!'
  },
  timeout: 30000,
  screenshotDir: './test-screenshots',
  resultsFile: './focused-strategy-test-results.json'
};

// Test results tracking
let testResults = {
  timestamp: new Date().toISOString(),
  summary: {
    total: 0,
    passed: 0,
    failed: 0
  },
  tests: [],
  errors: []
};

// Helper functions
function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${type.toUpperCase()}] ${message}`;
  console.log(logMessage);
  
  if (type === 'error') {
    testResults.errors.push({
      timestamp,
      message
    });
  }
}

function recordTest(name, passed, details = '') {
  const test = {
    name,
    passed,
    details,
    timestamp: new Date().toISOString()
  };
  
  testResults.tests.push(test);
  testResults.summary.total++;
  if (passed) {
    testResults.summary.passed++;
    log(`✅ PASS: ${name} - ${details}`);
  } else {
    testResults.summary.failed++;
    log(`❌ FAIL: ${name} - ${details}`, 'error');
  }
}

async function takeScreenshot(page, name) {
  try {
    const screenshotPath = `${TEST_CONFIG.screenshotDir}/${name}-${Date.now()}.png`;
    await page.screenshot({ path: screenshotPath, fullPage: true });
    log(`📸 Screenshot saved: ${screenshotPath}`);
    return screenshotPath;
  } catch (error) {
    log(`Failed to take screenshot: ${error.message}`, 'error');
    return null;
  }
}

async function checkConsoleErrors(page) {
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push({
        text: msg.text(),
        location: msg.location()
      });
    }
  });
  
  // Wait a bit to collect any immediate errors
  await page.waitForTimeout(2000);
  return errors;
}

// Main test functions
async function testLogin(page) {
  log('🔐 Testing login functionality...');
  
  try {
    await page.goto(`${TEST_CONFIG.baseUrl}/login`);
    await page.waitForSelector('input[type="email"]', { timeout: TEST_CONFIG.timeout });
    
    // Fill login form using the correct selectors
    await page.fill('input[type="email"]', TEST_CONFIG.credentials.email);
    await page.fill('input[type="password"]', TEST_CONFIG.credentials.password);
    
    // Submit login
    await page.click('button[type="submit"]');
    
    // Wait for navigation to dashboard
    await page.waitForURL('**/dashboard', { timeout: TEST_CONFIG.timeout });
    
    // Check if login was successful
    const currentUrl = page.url();
    const isLoggedIn = currentUrl.includes('/dashboard');
    
    recordTest('User Login', isLoggedIn, `Redirected to: ${currentUrl}`);
    await takeScreenshot(page, 'login-success');
    
    return isLoggedIn;
  } catch (error) {
    recordTest('User Login', false, `Error: ${error.message}`);
    await takeScreenshot(page, 'login-failed');
    return false;
  }
}

async function testSchemaValidationFix(page) {
  log('🔧 Testing schema validation fix...');
  
  try {
    await page.goto(`${TEST_CONFIG.baseUrl}/fix-schema-validation`);
    await page.waitForSelector('button', { timeout: TEST_CONFIG.timeout });
    
    // Check if the page loads correctly
    const pageTitle = await page.textContent('h1');
    const hasCorrectTitle = pageTitle && pageTitle.includes('Schema Validation Fix');
    
    recordTest('Schema Validation Page Load', hasCorrectTitle, `Page title: ${pageTitle}`);
    
    // Execute the schema fix
    await page.click('button:has-text("Execute Schema Validation Fix")');
    
    // Wait for the fix to complete
    await page.waitForSelector('div:has-text("Execution Logs")', { timeout: TEST_CONFIG.timeout });
    
    // Check for success message
    const successMessage = await page.$('div:has-text("Success")');
    const hasSuccessMessage = successMessage !== null;
    
    recordTest('Schema Validation Fix Execution', hasSuccessMessage, 
      hasSuccessMessage ? 'Fix executed successfully' : 'No success message found');
    
    await takeScreenshot(page, 'schema-validation-fix');
    
    return hasSuccessMessage;
  } catch (error) {
    recordTest('Schema Validation Fix', false, `Error: ${error.message}`);
    await takeScreenshot(page, 'schema-validation-error');
    return false;
  }
}

async function testStrategyListLoading(page) {
  log('📋 Testing strategy list loading...');
  
  try {
    await page.goto(`${TEST_CONFIG.baseUrl}/strategies`);
    await page.waitForTimeout(3000); // Allow time for loading
    
    // Check if the page loads without errors
    const currentUrl = page.url();
    const pageLoaded = currentUrl.includes('/strategies');
    
    recordTest('Strategy List Page Load', pageLoaded, `Loaded URL: ${currentUrl}`);
    
    // Check for strategy list content
    const strategyList = await page.$('.grid:has(.glass), .grid:has(.rounded-xl)');
    const hasStrategyList = strategyList !== null;
    
    recordTest('Strategy List Display', hasStrategyList, 
      hasStrategyList ? 'Strategy list found' : 'No strategy list detected');
    
    // Check for loading states
    const loadingElement = await page.$('.animate-spin');
    const hasLoadingState = loadingElement !== null;
    
    recordTest('Strategy Loading State', !hasLoadingState, 
      hasLoadingState ? 'Still loading' : 'Loading completed');
    
    // Check for error states
    const errorElement = await page.$('button:has-text("Try Again")');
    const hasErrorState = errorElement !== null;
    
    recordTest('Strategy Error State', !hasErrorState, 
      hasErrorState ? 'Error state detected' : 'No errors');
    
    await takeScreenshot(page, 'strategy-list');
    
    return pageLoaded && !hasLoadingState && !hasErrorState;
  } catch (error) {
    recordTest('Strategy List Loading', false, `Error: ${error.message}`);
    await takeScreenshot(page, 'strategy-list-error');
    return false;
  }
}

async function testStrategyCreationButton(page) {
  log('➕ Testing strategy creation button...');
  
  try {
    // Look for create strategy button
    const createButton = await page.$('a[href*="/strategies/create"]');
    
    if (createButton) {
      // Get current URL before clicking
      const beforeUrl = page.url();
      
      await createButton.click();
      await page.waitForTimeout(2000);
      
      const afterUrl = page.url();
      const navigatedToCreate = afterUrl.includes('/strategies/create');
      
      recordTest('Strategy Creation Button Navigation', navigatedToCreate, 
        `From: ${beforeUrl} To: ${afterUrl}`);
      
      await takeScreenshot(page, 'strategy-creation');
      return navigatedToCreate;
    } else {
      recordTest('Strategy Creation Button', false, 'No create button found');
      return false;
    }
  } catch (error) {
    recordTest('Strategy Creation Button', false, `Error: ${error.message}`);
    await takeScreenshot(page, 'strategy-creation-error');
    return false;
  }
}

async function testStrategyEditButton(page) {
  log('✏️ Testing strategy edit button functionality...');
  
  try {
    // Go back to strategies list
    await page.goto(`${TEST_CONFIG.baseUrl}/strategies`);
    await page.waitForTimeout(2000);
    
    // Look for strategy cards
    const strategyCard = await page.$('.glass:has(.rounded-xl)');
    
    if (strategyCard) {
      // Look for edit button within the strategy card
      const editButton = await strategyCard.$('button:has-text("Edit"), .edit-button');
      
      if (editButton) {
        // Get current URL before clicking
        const beforeUrl = page.url();
        
        await editButton.click();
        await page.waitForTimeout(2000);
        
        const afterUrl = page.url();
        const navigatedToEdit = afterUrl.includes('/strategies/edit/') || afterUrl !== beforeUrl;
        
        recordTest('Strategy Edit Button Navigation', navigatedToEdit, 
          `From: ${beforeUrl} To: ${afterUrl}`);
        
        await takeScreenshot(page, 'strategy-edit');
        return navigatedToEdit;
      } else {
        recordTest('Strategy Edit Button', false, 'No edit button found in strategy card');
        return false;
      }
    } else {
      recordTest('Strategy Edit Button', false, 'No strategy cards found');
      return false;
    }
  } catch (error) {
    recordTest('Strategy Edit Button', false, `Error: ${error.message}`);
    await takeScreenshot(page, 'strategy-edit-error');
    return false;
  }
}

async function testStrategyDeletion(page) {
  log('🗑️ Testing strategy deletion functionality...');
  
  try {
    // Go back to strategies list
    await page.goto(`${TEST_CONFIG.baseUrl}/strategies`);
    await page.waitForTimeout(2000);
    
    // Look for strategy cards
    const strategyCard = await page.$('.glass:has(.rounded-xl)');
    
    if (strategyCard) {
      // Look for delete button within the strategy card
      const deleteButton = await strategyCard.$('button:has-text("Delete"), .delete-button');
      
      if (deleteButton) {
        // Handle confirmation dialog if present
        page.on('dialog', async dialog => {
          await dialog.accept();
        });
        
        await deleteButton.click();
        await page.waitForTimeout(3000);
        
        // Check for unexpected error messages
        const errorElement = await page.$('.error, .alert-error:has-text("unexpected error")');
        const hasUnexpectedError = errorElement !== null;
        
        recordTest('Strategy Deletion', !hasUnexpectedError, 
          hasUnexpectedError ? 'Unexpected error occurred' : 'Deletion completed without errors');
        
        await takeScreenshot(page, 'strategy-deletion');
        return !hasUnexpectedError;
      } else {
        recordTest('Strategy Deletion', false, 'No delete button found in strategy card');
        return false;
      }
    } else {
      recordTest('Strategy Deletion', false, 'No strategy cards found');
      return false;
    }
  } catch (error) {
    recordTest('Strategy Deletion', false, `Error: ${error.message}`);
    await takeScreenshot(page, 'strategy-deletion-error');
    return false;
  }
}

async function testConsoleErrors(page) {
  log('🔍 Checking browser console for errors...');
  
  try {
    const consoleErrors = await checkConsoleErrors(page);
    
    recordTest('Browser Console Errors', consoleErrors.length === 0, 
      `Found ${consoleErrors.length} console errors`);
    
    if (consoleErrors.length > 0) {
      consoleErrors.forEach((error, index) => {
        log(`Console Error ${index + 1}: ${error.text}`, 'error');
      });
    }
    
    return consoleErrors.length === 0;
  } catch (error) {
    recordTest('Console Error Check', false, `Error checking console: ${error.message}`);
    return false;
  }
}

async function testApplicationStability(page) {
  log('🏗️ Testing overall application stability...');
  
  try {
    // Test navigation between main pages
    const pages = ['/dashboard', '/trades', '/strategies'];
    let allPagesStable = true;
    
    for (const pagePath of pages) {
      await page.goto(`${TEST_CONFIG.baseUrl}${pagePath}`);
      await page.waitForTimeout(2000);
      
      const currentUrl = page.url();
      const pageLoadedCorrectly = currentUrl.includes(pagePath);
      
      if (!pageLoadedCorrectly) {
        allPagesStable = false;
        log(`Page stability issue: ${pagePath} - Current URL: ${currentUrl}`, 'error');
      }
    }
    
    recordTest('Application Stability', allPagesStable, 
      allPagesStable ? 'All main pages load correctly' : 'Some pages have stability issues');
    
    await takeScreenshot(page, 'application-stability');
    return allPagesStable;
  } catch (error) {
    recordTest('Application Stability', false, `Error: ${error.message}`);
    return false;
  }
}

// Main test execution
async function runFocusedTests() {
  log('🚀 Starting focused strategy functionality tests...');
  
  // Ensure screenshot directory exists
  if (!fs.existsSync(TEST_CONFIG.screenshotDir)) {
    fs.mkdirSync(TEST_CONFIG.screenshotDir, { recursive: true });
  }
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // Set up error handling
    page.on('pageerror', error => {
      log(`Page error: ${error.message}`, 'error');
    });
    
    // Run tests in sequence
    const loginSuccess = await testLogin(page);
    
    if (loginSuccess) {
      await testSchemaValidationFix(page);
      await testStrategyListLoading(page);
      await testStrategyCreationButton(page);
      await testStrategyEditButton(page);
      await testStrategyDeletion(page);
    } else {
      log('⚠️ Login failed, skipping authenticated tests');
    }
    
    await testConsoleErrors(page);
    await testApplicationStability(page);
    
    // Generate final report
    const successRate = (testResults.summary.passed / testResults.summary.total * 100).toFixed(2);
    
    log(`\n📊 TEST SUMMARY:`);
    log(`Total Tests: ${testResults.summary.total}`);
    log(`Passed: ${testResults.summary.passed}`);
    log(`Failed: ${testResults.summary.failed}`);
    log(`Success Rate: ${successRate}%`);
    
    // Save results to file
    fs.writeFileSync(TEST_CONFIG.resultsFile, JSON.stringify(testResults, null, 2));
    log(`\n📄 Detailed results saved to: ${TEST_CONFIG.resultsFile}`);
    
    return testResults;
    
  } catch (error) {
    log(`Test execution failed: ${error.message}`, 'error');
    return testResults;
  } finally {
    await browser.close();
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runFocusedTests()
    .then(results => {
      process.exit(results.summary.failed > 0 ? 1 : 0);
    })
    .catch(error => {
      console.error('Test execution failed:', error);
      process.exit(1);
    });
}

module.exports = { runFocusedTests, TEST_CONFIG };