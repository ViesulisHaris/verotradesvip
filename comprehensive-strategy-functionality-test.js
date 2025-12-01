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
  resultsFile: './comprehensive-strategy-test-results.json'
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
    await page.waitForSelector('input[name="email"]', { timeout: TEST_CONFIG.timeout });
    
    // Fill login form
    await page.fill('input[name="email"]', TEST_CONFIG.credentials.email);
    await page.fill('input[name="password"]', TEST_CONFIG.credentials.password);
    
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
    const strategyList = await page.$('[data-testid="strategy-list"], .strategy-list, table');
    const hasStrategyList = strategyList !== null;
    
    recordTest('Strategy List Display', hasStrategyList, 
      hasStrategyList ? 'Strategy list found' : 'No strategy list detected');
    
    // Check for loading states
    const loadingElement = await page.$('.loading, .spinner, [data-testid="loading"]');
    const hasLoadingState = loadingElement !== null;
    
    recordTest('Strategy Loading State', !hasLoadingState, 
      hasLoadingState ? 'Still loading' : 'Loading completed');
    
    await takeScreenshot(page, 'strategy-list');
    
    return pageLoaded && hasStrategyList;
  } catch (error) {
    recordTest('Strategy List Loading', false, `Error: ${error.message}`);
    await takeScreenshot(page, 'strategy-list-error');
    return false;
  }
}

async function testStrategyPerformanceView(page) {
  log('📊 Testing strategy performance view...');
  
  try {
    // Look for a strategy to view
    const strategyLink = await page.$('a[href*="/strategies/"], .strategy-row, tr');
    
    if (strategyLink) {
      await strategyLink.click();
      await page.waitForTimeout(2000);
      
      const currentUrl = page.url();
      const isOnStrategyPage = currentUrl.includes('/strategies/');
      
      recordTest('Strategy Performance View', isOnStrategyPage, 
        `Navigated to: ${currentUrl}`);
      
      await takeScreenshot(page, 'strategy-performance');
      return isOnStrategyPage;
    } else {
      recordTest('Strategy Performance View', false, 'No strategies found to view');
      return false;
    }
  } catch (error) {
    recordTest('Strategy Performance View', false, `Error: ${error.message}`);
    await takeScreenshot(page, 'strategy-performance-error');
    return false;
  }
}

async function testStrategyEditButton(page) {
  log('✏️ Testing strategy edit button functionality...');
  
  try {
    // Look for edit button
    const editButton = await page.$('button:has-text("Edit"), a:has-text("Edit"), .edit-button, [data-testid="edit-strategy"]');
    
    if (editButton) {
      // Get current URL before clicking
      const beforeUrl = page.url();
      
      await editButton.click();
      await page.waitForTimeout(2000);
      
      const afterUrl = page.url();
      const navigatedToEdit = afterUrl.includes('/edit') || afterUrl !== beforeUrl;
      
      recordTest('Strategy Edit Button Navigation', navigatedToEdit, 
        `From: ${beforeUrl} To: ${afterUrl}`);
      
      await takeScreenshot(page, 'strategy-edit');
      return navigatedToEdit;
    } else {
      recordTest('Strategy Edit Button', false, 'No edit button found');
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
    
    // Look for delete button
    const deleteButton = await page.$('button:has-text("Delete"), .delete-button, [data-testid="delete-strategy"]');
    
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
      recordTest('Strategy Deletion', false, 'No delete button found');
      return false;
    }
  } catch (error) {
    recordTest('Strategy Deletion', false, `Error: ${error.message}`);
    await takeScreenshot(page, 'strategy-deletion-error');
    return false;
  }
}

async function testStrategyCreation(page) {
  log('➕ Testing strategy creation functionality...');
  
  try {
    // Look for create/add strategy button
    const createButton = await page.$('a:has-text("Create"), button:has-text("Add Strategy"), .create-button, [data-testid="create-strategy"]');
    
    if (createButton) {
      await createButton.click();
      await page.waitForTimeout(2000);
      
      const currentUrl = page.url();
      const navigatedToCreate = currentUrl.includes('/create') || currentUrl.includes('/new');
      
      recordTest('Strategy Creation Navigation', navigatedToCreate, 
        `Navigated to: ${currentUrl}`);
      
      await takeScreenshot(page, 'strategy-creation');
      return navigatedToCreate;
    } else {
      recordTest('Strategy Creation', false, 'No create button found');
      return false;
    }
  } catch (error) {
    recordTest('Strategy Creation', false, `Error: ${error.message}`);
    await takeScreenshot(page, 'strategy-creation-error');
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
    const pages = ['/dashboard', '/trades', '/analytics', '/strategies'];
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
async function runComprehensiveTests() {
  log('🚀 Starting comprehensive strategy functionality tests...');
  
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
    await testLogin(page);
    await testSchemaValidationFix(page);
    await testStrategyListLoading(page);
    await testStrategyPerformanceView(page);
    await testStrategyEditButton(page);
    await testStrategyDeletion(page);
    await testStrategyCreation(page);
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
  runComprehensiveTests()
    .then(results => {
      process.exit(results.summary.failed > 0 ? 1 : 0);
    })
    .catch(error => {
      console.error('Test execution failed:', error);
      process.exit(1);
    });
}

module.exports = { runComprehensiveTests, TEST_CONFIG };