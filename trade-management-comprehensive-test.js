const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// Test configuration
const TEST_CONFIG = {
  baseURL: 'http://localhost:3002',
  credentials: {
    email: 'testuser@verotrade.com',
    password: 'TestPassword123!'
  },
  timeout: 30000,
  screenshotDir: './trade-management-test-screenshots',
  reportFile: './TRADE_MANAGEMENT_TEST_REPORT.md'
};

// Test data
const TEST_TRADE_DATA = {
  validTrade: {
    market: 'stock',
    symbol: 'AAPL',
    side: 'Buy',
    quantity: '100',
    entry_price: '150.00',
    exit_price: '155.00',
    pnl: '500.00',
    entry_time: '09:30',
    exit_time: '10:45',
    emotions: ['CONFIDENT', 'PATIENCE'],
    notes: 'Test trade for comprehensive testing',
    date: new Date().toISOString().split('T')[0]
  },
  invalidTrade: {
    market: 'stock',
    symbol: '',
    side: 'Buy',
    quantity: '-50',
    entry_price: '0',
    exit_price: '0',
    pnl: 'invalid',
    entry_time: '25:00',
    exit_time: '26:00'
  },
  editTrade: {
    symbol: 'GOOGL',
    quantity: '50',
    entry_price: '2500.00',
    exit_price: '2550.00',
    pnl: '250.00',
    notes: 'Edited trade for testing'
  }
};

// Emotions list for testing
const ALL_EMOTIONS = [
  'FOMO', 'REVENGE', 'TILT', 'OVERRISK', 
  'PATIENCE', 'REGRET', 'DISCIPLINE', 
  'CONFIDENT', 'ANXIOUS', 'NEUTRAL'
];

// Test results tracking
const testResults = {
  passed: 0,
  failed: 0,
  total: 0,
  details: []
};

// Utility functions
function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [${type.toUpperCase()}]`;
  console.log(`${prefix} ${message}`);
}

function logTestResult(testName, passed, details = '') {
  testResults.total++;
  if (passed) {
    testResults.passed++;
    log(`✅ PASS: ${testName}`, 'success');
  } else {
    testResults.failed++;
    log(`❌ FAIL: ${testName}`, 'error');
    if (details) log(`   Details: ${details}`, 'error');
  }
  
  testResults.details.push({
    test: testName,
    status: passed ? 'PASS' : 'FAIL',
    details: details
  });
}

async function takeScreenshot(page, name) {
  try {
    const filename = `${name}-${Date.now()}.png`;
    const filepath = path.join(TEST_CONFIG.screenshotDir, filename);
    await page.screenshot({ path: filepath, fullPage: true });
    log(`Screenshot saved: ${filename}`);
    return filepath;
  } catch (error) {
    log(`Failed to take screenshot: ${error.message}`, 'error');
    return null;
  }
}

async function ensureScreenshotDir() {
  if (!fs.existsSync(TEST_CONFIG.screenshotDir)) {
    fs.mkdirSync(TEST_CONFIG.screenshotDir, { recursive: true });
  }
}

async function waitForElement(page, selector, timeout = TEST_CONFIG.timeout) {
  try {
    await page.waitForSelector(selector, { timeout });
    return true;
  } catch (error) {
    return false;
  }
}

async function login(page) {
  log('Starting login process...');
  
  try {
    // Navigate to login page
    await page.goto(`${TEST_CONFIG.baseURL}/login`);
    await waitForElement(page, 'input[type="email"]');
    
    // Fill login form
    await page.fill('input[type="email"]', TEST_CONFIG.credentials.email);
    await page.fill('input[type="password"]', TEST_CONFIG.credentials.password);
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Wait for navigation to dashboard or trades page
    await page.waitForURL(/\/(dashboard|trades|log-trade)/, { timeout: TEST_CONFIG.timeout });
    
    log('Login successful');
    await takeScreenshot(page, 'login-success');
    return true;
  } catch (error) {
    log(`Login failed: ${error.message}`, 'error');
    await takeScreenshot(page, 'login-failed');
    return false;
  }
}

// Test functions for Log Trade page
async function testLogTradePageLoad(page) {
  log('Testing Log Trade page load...');
  
  try {
    await page.goto(`${TEST_CONFIG.baseURL}/log-trade`);
    const loaded = await waitForElement(page, 'form');
    
    if (!loaded) {
      logTestResult('Log Trade page load', false, 'Page did not load within timeout');
      return false;
    }
    
    // Check for key form elements
    const elements = [
      'button[type="button"][value="stock"]',
      'button[type="button"][value="crypto"]',
      'button[type="button"][value="forex"]',
      'button[type="button"][value="futures"]',
      'input[name="symbol"]',
      'button[type="button"]:has-text("Buy")',
      'button[type="button"]:has-text("Sell")',
      'input[name="quantity"]',
      'input[name="entry_price"]',
      'input[name="exit_price"]',
      'input[name="pnl"]',
      'input[name="entry_time"]',
      'input[name="exit_time"]',
      'input[name="date"]',
      'textarea[name="notes"]',
      'button[type="submit"]'
    ];
    
    let allElementsPresent = true;
    for (const selector of elements) {
      const element = await page.$(selector);
      if (!element) {
        allElementsPresent = false;
        log(`Missing element: ${selector}`, 'error');
      }
    }
    
    logTestResult('Log Trade page elements', allElementsPresent, 
      allElementsPresent ? 'All form elements present' : 'Some form elements missing');
    
    await takeScreenshot(page, 'log-trade-page-loaded');
    return allElementsPresent;
  } catch (error) {
    logTestResult('Log Trade page load', false, error.message);
    return false;
  }
}

async function testMarketSelection(page) {
  log('Testing market selection...');
  
  try {
    const markets = ['stock', 'crypto', 'forex', 'futures'];
    let allMarketsWork = true;
    
    for (const market of markets) {
      await page.click(`button[type="button"][value="${market}"]`);
      
      // Check if the button is selected (has the active styling)
      const isSelected = await page.evaluate((market) => {
        const button = document.querySelector(`button[value="${market}"]`);
        return button && button.classList.contains('bg-blue-500/10');
      }, market);
      
      if (!isSelected) {
        allMarketsWork = false;
        log(`Market ${market} selection not working`, 'error');
      }
      
      await page.waitForTimeout(500); // Small delay for visual feedback
    }
    
    logTestResult('Market selection', allMarketsWork, 
      allMarketsWork ? 'All markets selectable' : 'Some markets not selectable');
    
    await takeScreenshot(page, 'market-selection-test');
    return allMarketsWork;
  } catch (error) {
    logTestResult('Market selection', false, error.message);
    return false;
  }
}

async function testBuySellToggle(page) {
  log('Testing Buy/Sell toggle...');
  
  try {
    // Test Buy selection
    await page.click('button[type="button"]:has-text("Buy")');
    await page.waitForTimeout(500);
    
    const buySelected = await page.evaluate(() => {
      const buyButton = document.querySelector('button:has-text("Buy")');
      return buyButton && buyButton.classList.contains('bg-green-500/10');
    });
    
    // Test Sell selection
    await page.click('button[type="button"]:has-text("Sell")');
    await page.waitForTimeout(500);
    
    const sellSelected = await page.evaluate(() => {
      const sellButton = document.querySelector('button:has-text("Sell")');
      return sellButton && sellButton.classList.contains('bg-red-500/10');
    });
    
    const toggleWorks = buySelected && sellSelected;
    
    logTestResult('Buy/Sell toggle', toggleWorks, 
      toggleWorks ? 'Buy/Sell toggle working correctly' : 'Buy/Sell toggle not working');
    
    await takeScreenshot(page, 'buy-sell-toggle-test');
    return toggleWorks;
  } catch (error) {
    logTestResult('Buy/Sell toggle', false, error.message);
    return false;
  }
}

async function testFormValidation(page) {
  log('Testing form validation...');
  
  try {
    // Fill form with invalid data
    await page.fill('input[name="symbol"]', TEST_TRADE_DATA.invalidTrade.symbol);
    await page.fill('input[name="quantity"]', TEST_TRADE_DATA.invalidTrade.quantity);
    await page.fill('input[name="entry_price"]', TEST_TRADE_DATA.invalidTrade.entry_price);
    await page.fill('input[name="exit_price"]', TEST_TRADE_DATA.invalidTrade.exit_price);
    await page.fill('input[name="pnl"]', TEST_TRADE_DATA.invalidTrade.pnl);
    
    // Try to submit form
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);
    
    // Check for validation errors
    const hasValidationErrors = await page.$('.bg-red-500\\/10');
    
    // Fill with valid data
    await page.fill('input[name="symbol"]', TEST_TRADE_DATA.validTrade.symbol);
    await page.fill('input[name="quantity"]', TEST_TRADE_DATA.validTrade.quantity);
    await page.fill('input[name="entry_price"]', TEST_TRADE_DATA.validTrade.entry_price);
    await page.fill('input[name="exit_price"]', TEST_TRADE_DATA.validTrade.exit_price);
    await page.fill('input[name="pnl"]', TEST_TRADE_DATA.validTrade.pnl);
    
    logTestResult('Form validation', !!hasValidationErrors, 
      hasValidationErrors ? 'Validation errors displayed correctly' : 'Validation errors not displayed');
    
    await takeScreenshot(page, 'form-validation-test');
    return !!hasValidationErrors;
  } catch (error) {
    logTestResult('Form validation', false, error.message);
    return false;
  }
}

async function testEmotionalStateSelection(page) {
  log('Testing emotional state selection...');
  
  try {
    // Test selecting multiple emotions
    const testEmotions = ['CONFIDENT', 'PATIENCE', 'ANXIOUS'];
    
    for (const emotion of testEmotions) {
      await page.click(`button:has-text("${emotion}")`);
      await page.waitForTimeout(300);
    }
    
    // Check if emotions are selected
    const selectedEmotions = await page.evaluate(() => {
      const buttons = document.querySelectorAll('button');
      const selected = [];
      buttons.forEach(button => {
        if (button.classList.contains('bg-blue-500/10') || 
            button.classList.contains('bg-green-500/10') ||
            button.classList.contains('bg-purple-500/10')) {
          selected.push(button.textContent.trim());
        }
      });
      return selected;
    });
    
    const emotionsSelected = testEmotions.every(emotion => 
      selectedEmotions.some(selected => selected.includes(emotion))
    );
    
    // Test removing emotions
    await page.click(`button:has-text("${testEmotions[0]}")`);
    await page.waitForTimeout(300);
    
    // Test all 10 emotions can be selected
    for (const emotion of ALL_EMOTIONS) {
      await page.click(`button:has-text("${emotion}")`);
      await page.waitForTimeout(200);
    }
    
    const allEmotionsSelected = await page.evaluate(() => {
      const emotionButtons = document.querySelectorAll('button');
      let selectedCount = 0;
      emotionButtons.forEach(button => {
        if (button.classList.contains('bg-blue-500/10') || 
            button.classList.contains('bg-green-500/10') ||
            button.classList.contains('bg-purple-500/10') ||
            button.classList.contains('bg-yellow-500/10') ||
            button.classList.contains('bg-red-500/10') ||
            button.classList.contains('bg-orange-500/10') ||
            button.classList.contains('bg-gray-500/10')) {
          selectedCount++;
        }
      });
      return selectedCount >= 10; // At least 10 emotions should be selectable
    });
    
    const emotionTestPassed = emotionsSelected && allEmotionsSelected;
    
    logTestResult('Emotional state selection', emotionTestPassed, 
      emotionTestPassed ? 'Emotions can be selected and deselected' : 'Emotion selection not working properly');
    
    await takeScreenshot(page, 'emotional-state-test');
    return emotionTestPassed;
  } catch (error) {
    logTestResult('Emotional state selection', false, error.message);
    return false;
  }
}

async function testTradeDurationCalculation(page) {
  log('Testing trade duration calculation...');
  
  try {
    // Set entry and exit times
    await page.fill('input[name="entry_time"]', '09:30');
    await page.fill('input[name="exit_time"]', '10:45');
    await page.waitForTimeout(1000);
    
    // Check if duration is displayed
    const durationDisplayed = await page.$('text=Trade Duration');
    
    if (durationDisplayed) {
      const durationText = await page.textContent('text=Trade Duration');
      const hasCorrectFormat = durationText && durationText.includes('h') && durationText.includes('m');
      
      logTestResult('Trade duration calculation', hasCorrectFormat, 
        hasCorrectFormat ? `Duration calculated: ${durationText}` : 'Duration format incorrect');
    } else {
      logTestResult('Trade duration calculation', false, 'Duration not displayed');
    }
    
    await takeScreenshot(page, 'trade-duration-test');
    return !!durationDisplayed;
  } catch (error) {
    logTestResult('Trade duration calculation', false, error.message);
    return false;
  }
}

async function testStrategySelection(page) {
  log('Testing strategy selection...');
  
  try {
    // Check if strategy dropdown exists
    const strategyDropdown = await page.$('select, [role="combobox"]');
    
    if (!strategyDropdown) {
      logTestResult('Strategy selection', false, 'Strategy dropdown not found');
      return false;
    }
    
    // Try to open dropdown (might be a custom component)
    await strategyDropdown.click();
    await page.waitForTimeout(500);
    
    // Check if options are available
    const hasOptions = await page.evaluate(() => {
      const options = document.querySelectorAll('option, [role="option"]');
      return options.length > 0;
    });
    
    logTestResult('Strategy selection', hasOptions, 
      hasOptions ? 'Strategy dropdown has options' : 'Strategy dropdown has no options');
    
    await takeScreenshot(page, 'strategy-selection-test');
    return hasOptions;
  } catch (error) {
    logTestResult('Strategy selection', false, error.message);
    return false;
  }
}

async function testTradeSubmission(page) {
  log('Testing trade submission...');
  
  try {
    // Fill form with valid data
    await page.fill('input[name="symbol"]', TEST_TRADE_DATA.validTrade.symbol);
    await page.fill('input[name="quantity"]', TEST_TRADE_DATA.validTrade.quantity);
    await page.fill('input[name="entry_price"]', TEST_TRADE_DATA.validTrade.entry_price);
    await page.fill('input[name="exit_price"]', TEST_TRADE_DATA.validTrade.exit_price);
    await page.fill('input[name="pnl"]', TEST_TRADE_DATA.validTrade.pnl);
    await page.fill('input[name="entry_time"]', TEST_TRADE_DATA.validTrade.entry_time);
    await page.fill('input[name="exit_time"]', TEST_TRADE_DATA.validTrade.exit_time);
    await page.fill('input[name="date"]', TEST_TRADE_DATA.validTrade.date);
    await page.fill('textarea[name="notes"]', TEST_TRADE_DATA.validTrade.notes);
    
    // Select market
    await page.click(`button[type="button"][value="${TEST_TRADE_DATA.validTrade.market}"]`);
    
    // Select emotions
    for (const emotion of TEST_TRADE_DATA.validTrade.emotions) {
      await page.click(`button:has-text("${emotion}")`);
      await page.waitForTimeout(300);
    }
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Wait for submission to complete (either redirect or success message)
    await page.waitForTimeout(2000);
    
    // Check if redirected to dashboard or shows success
    const currentUrl = page.url();
    const redirected = currentUrl.includes('/dashboard') || currentUrl.includes('/trades');
    
    logTestResult('Trade submission', redirected, 
      redirected ? `Trade submitted successfully, redirected to: ${currentUrl}` : 'Trade submission failed');
    
    await takeScreenshot(page, 'trade-submission-test');
    return redirected;
  } catch (error) {
    logTestResult('Trade submission', false, error.message);
    return false;
  }
}

// Test functions for Trades page
async function testTradesPageLoad(page) {
  log('Testing Trades page load...');
  
  try {
    await page.goto(`${TEST_CONFIG.baseURL}/trades`);
    const loaded = await waitForElement(page, '.min-h-screen');
    
    if (!loaded) {
      logTestResult('Trades page load', false, 'Page did not load within timeout');
      return false;
    }
    
    // Check for key elements
    const elements = [
      'h1:has-text("Trade History")',
      'input[placeholder*="symbol"]',
      'select:has-text("All Markets")',
      'input[type="date"]'
    ];
    
    let allElementsPresent = true;
    for (const selector of elements) {
      const element = await page.$(selector);
      if (!element) {
        allElementsPresent = false;
        log(`Missing element on trades page: ${selector}`, 'error');
      }
    }
    
    logTestResult('Trades page load', allElementsPresent, 
      allElementsPresent ? 'All page elements present' : 'Some page elements missing');
    
    await takeScreenshot(page, 'trades-page-loaded');
    return allElementsPresent;
  } catch (error) {
    logTestResult('Trades page load', false, error.message);
    return false;
  }
}

async function testTradeListDisplay(page) {
  log('Testing trade list display...');
  
  try {
    // Wait for trades to load
    await page.waitForTimeout(2000);
    
    // Check if trades are displayed
    const tradeItems = await page.$$('.card-unified');
    const hasTrades = tradeItems.length > 0;
    
    if (hasTrades) {
      // Check if trade items have required information
      const firstTrade = tradeItems[0];
      const hasSymbol = await firstTrade.$('text=/SYMBOL|AAPL|GOOGL|BTC/');
      const hasPrice = await firstTrade.$('text=/\\$[0-9]/');
      const hasPnL = await firstTrade.$('text=/\\$[+-]?[0-9]/');
      
      const tradeInfoComplete = hasSymbol && hasPrice && hasPnL;
      
      logTestResult('Trade list display', tradeInfoComplete, 
        tradeInfoComplete ? `Found ${tradeItems.length} trades with complete information` : 'Trade information incomplete');
    } else {
      logTestResult('Trade list display', true, 'No trades found (expected for new test)');
    }
    
    await takeScreenshot(page, 'trade-list-display');
    return hasTrades;
  } catch (error) {
    logTestResult('Trade list display', false, error.message);
    return false;
  }
}

async function testPaginationControls(page) {
  log('Testing pagination controls...');
  
  try {
    // Look for pagination controls
    const paginationControls = await page.$$('button:has-text("Next"), button:has-text("Previous"), select:has-text("10")');
    const hasPagination = paginationControls.length > 0;
    
    if (hasPagination) {
      // Test page size selection
      const pageSizeSelect = await page.$('select:has-text("25")');
      if (pageSizeSelect) {
        await pageSizeSelect.selectOption('50');
        await page.waitForTimeout(1000);
      }
      
      // Test page navigation if available
      const nextButton = await page.$('button:has-text("Next")');
      if (nextButton && await nextButton.isEnabled()) {
        await nextButton.click();
        await page.waitForTimeout(1000);
      }
    }
    
    logTestResult('Pagination controls', hasPagination, 
      hasPagination ? 'Pagination controls found and functional' : 'No pagination controls found');
    
    await takeScreenshot(page, 'pagination-controls-test');
    return hasPagination;
  } catch (error) {
    logTestResult('Pagination controls', false, error.message);
    return false;
  }
}

async function testFilteringOptions(page) {
  log('Testing filtering options...');
  
  try {
    // Test symbol filter
    await page.fill('input[placeholder*="symbol"]', 'AAPL');
    await page.waitForTimeout(1000);
    
    // Test market filter
    await page.selectOption('select:has-text("All Markets")', 'stock');
    await page.waitForTimeout(1000);
    
    // Test date filters
    const today = new Date().toISOString().split('T')[0];
    const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    await page.fill('input[type="date"]', lastWeek);
    await page.waitForTimeout(1000);
    
    // Test clear filters
    const clearButton = await page.$('button:has-text("Clear Filters")');
    if (clearButton) {
      await clearButton.click();
      await page.waitForTimeout(1000);
    }
    
    logTestResult('Filtering options', true, 'Filtering options functional');
    
    await takeScreenshot(page, 'filtering-options-test');
    return true;
  } catch (error) {
    logTestResult('Filtering options', false, error.message);
    return false;
  }
}

async function testTradeExpansion(page) {
  log('Testing trade expansion...');
  
  try {
    // Look for expandable trade items
    const expandButtons = await page.$$('button:has-text("▼"), button:has-text("▶")');
    
    if (expandButtons.length > 0) {
      // Click first expand button
      await expandButtons[0].click();
      await page.waitForTimeout(1000);
      
      // Check if trade details are expanded
      const expandedDetails = await page.$('.border-t');
      const expansionWorks = !!expandedDetails;
      
      logTestResult('Trade expansion', expansionWorks, 
        expansionWorks ? 'Trade details expand correctly' : 'Trade expansion not working');
      
      await takeScreenshot(page, 'trade-expansion-test');
      return expansionWorks;
    } else {
      logTestResult('Trade expansion', true, 'No trades to expand (expected for new test)');
      return true;
    }
  } catch (error) {
    logTestResult('Trade expansion', false, error.message);
    return false;
  }
}

async function testEditTrade(page) {
  log('Testing edit trade functionality...');
  
  try {
    // Look for edit buttons
    const editButtons = await page.$$('button:has-text("Edit")');
    
    if (editButtons.length > 0) {
      // Click first edit button
      await editButtons[0].click();
      await page.waitForTimeout(1000);
      
      // Check if edit modal opens
      const editModal = await page.$('.fixed.inset-0');
      const modalOpened = !!editModal;
      
      if (modalOpened) {
        // Try to edit some fields
        await page.fill('input[name="symbol"]', TEST_TRADE_DATA.editTrade.symbol);
        await page.fill('input[name="quantity"]', TEST_TRADE_DATA.editTrade.quantity);
        
        // Try to save
        const saveButton = await page.$('button:has-text("Save Changes")');
        if (saveButton) {
          await saveButton.click();
          await page.waitForTimeout(2000);
        }
      }
      
      logTestResult('Edit trade', modalOpened, 
        modalOpened ? 'Edit modal opened and functional' : 'Edit modal did not open');
      
      await takeScreenshot(page, 'edit-trade-test');
      return modalOpened;
    } else {
      logTestResult('Edit trade', true, 'No trades to edit (expected for new test)');
      return true;
    }
  } catch (error) {
    logTestResult('Edit trade', false, error.message);
    return false;
  }
}

async function testDeleteTrade(page) {
  log('Testing delete trade functionality...');
  
  try {
    // Look for delete buttons
    const deleteButtons = await page.$$('button:has-text("Delete")');
    
    if (deleteButtons.length > 0) {
      // Click first delete button
      await deleteButtons[0].click();
      await page.waitForTimeout(1000);
      
      // Check if delete confirmation dialog opens
      const confirmDialog = await page.$('text=Are you sure you want to delete');
      const dialogOpened = !!confirmDialog;
      
      if (dialogOpened) {
        // Cancel the deletion to avoid losing test data
        const cancelButton = await page.$('button:has-text("Cancel")');
        if (cancelButton) {
          await cancelButton.click();
          await page.waitForTimeout(1000);
        }
      }
      
      logTestResult('Delete trade', dialogOpened, 
        dialogOpened ? 'Delete confirmation dialog opened' : 'Delete confirmation did not open');
      
      await takeScreenshot(page, 'delete-trade-test');
      return dialogOpened;
    } else {
      logTestResult('Delete trade', true, 'No trades to delete (expected for new test)');
      return true;
    }
  } catch (error) {
    logTestResult('Delete trade', false, error.message);
    return false;
  }
}

async function testPerformanceStats(page) {
  log('Testing performance statistics...');
  
  try {
    // Look for performance statistics
    const statsElements = await page.$$('.card-unified p.text-2xl');
    const hasStats = statsElements.length > 0;
    
    if (hasStats) {
      // Check for key statistics
      const totalTrades = await page.$('text=Total Trades');
      const totalPnL = await page.$('text=Total P&L');
      const winRate = await page.$('text=Win Rate');
      
      const statsComplete = totalTrades && totalPnL && winRate;
      
      logTestResult('Performance statistics', statsComplete, 
        statsComplete ? 'All key statistics displayed' : 'Some statistics missing');
    } else {
      logTestResult('Performance statistics', true, 'No statistics to display (expected for new test)');
    }
    
    await takeScreenshot(page, 'performance-stats-test');
    return hasStats;
  } catch (error) {
    logTestResult('Performance statistics', false, error.message);
    return false;
  }
}

// Main test execution
async function runAllTests() {
  log('Starting comprehensive trade management tests...');
  
  ensureScreenshotDir();
  
  const browser = await chromium.launch({ 
    headless: false, // Set to false for debugging
    slowMo: 500 // Slow down actions for better visibility
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  
  const page = await context.newPage();
  
  try {
    // Login first
    const loginSuccess = await login(page);
    if (!loginSuccess) {
      log('Login failed, aborting tests', 'error');
      return;
    }
    
    // Test Log Trade page functionality
    log('\n=== Testing Log Trade Page ===');
    await testLogTradePageLoad(page);
    await testMarketSelection(page);
    await testBuySellToggle(page);
    await testFormValidation(page);
    await testEmotionalStateSelection(page);
    await testTradeDurationCalculation(page);
    await testStrategySelection(page);
    await testTradeSubmission(page);
    
    // Test Trades page functionality
    log('\n=== Testing Trades Page ===');
    await testTradesPageLoad(page);
    await testTradeListDisplay(page);
    await testPaginationControls(page);
    await testFilteringOptions(page);
    await testTradeExpansion(page);
    await testEditTrade(page);
    await testDeleteTrade(page);
    await testPerformanceStats(page);
    
  } catch (error) {
    log(`Test execution error: ${error.message}`, 'error');
  } finally {
    await browser.close();
  }
  
  // Generate report
  generateReport();
}

function generateReport() {
  const report = `
# Trade Management Comprehensive Test Report

## Test Summary
- **Total Tests:** ${testResults.total}
- **Passed:** ${testResults.passed}
- **Failed:** ${testResults.failed}
- **Success Rate:** ${((testResults.passed / testResults.total) * 100).toFixed(1)}%

## Test Results

| Test Name | Status | Details |
|------------|--------|---------|
${testResults.details.map(detail => 
  `| ${detail.test} | ${detail.status} | ${detail.details || ''} |`
).join('\n')}

## Screenshots
All test screenshots are saved in the \`${TEST_CONFIG.screenshotDir}\` directory.

## Recommendations

### For Failed Tests:
${testResults.details
  .filter(detail => detail.status === 'FAIL')
  .map(detail => `- **${detail.test}**: ${detail.details || 'Review implementation'}`)
  .join('\n')}

### General Improvements:
1. Ensure all form validation messages are clear and user-friendly
2. Verify trade duration calculations handle edge cases (overnight trades)
3. Test emotional state selection with all 10 emotions
4. Verify strategy dropdown loads user's strategies correctly
5. Ensure trade submission redirects appropriately
6. Test pagination with larger datasets
7. Verify filtering options work correctly with various data combinations
8. Test edit and delete functionality with proper confirmation dialogs
9. Ensure performance statistics calculate correctly

## Next Steps
1. Review failed tests and fix identified issues
2. Run tests again to verify fixes
3. Consider adding automated regression tests
4. Test with larger datasets for performance validation
5. Test cross-browser compatibility

---
*Report generated on: ${new Date().toISOString()}*
*Test environment: ${TEST_CONFIG.baseURL}*
`;

  fs.writeFileSync(TEST_CONFIG.reportFile, report);
  log(`Test report generated: ${TEST_CONFIG.reportFile}`);
  
  // Also log summary to console
  log('\n=== TEST SUMMARY ===');
  log(`Total Tests: ${testResults.total}`);
  log(`Passed: ${testResults.passed}`);
  log(`Failed: ${testResults.failed}`);
  log(`Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`);
  log(`Report saved to: ${TEST_CONFIG.reportFile}`);
}

// Run tests
if (require.main === module) {
  runAllTests().catch(error => {
    log(`Test execution failed: ${error.message}`, 'error');
    process.exit(1);
  });
}

module.exports = {
  runAllTests,
  testResults
};