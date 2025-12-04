/**
 * Test script to verify the trades page statistics calculation fix
 * This script tests that statistics are calculated from all trades rather than just paginated data
 */

const puppeteer = require('puppeteer');
const fs = require('fs');

async function runTests() {
  console.log('🚀 Starting Trades Page Statistics Test');
  console.log('=====================================\n');
  
  const browser = await puppeteer.launch({ headless: false, slowMo: 500 });
  const page = await browser.newPage();
  
  // Enable console logging from the browser
  page.on('console', msg => {
    console.log('BROWSER LOG:', msg.text());
  });
  
  // Enable request logging to track API calls
  page.on('request', request => {
    if (request.url().includes('/rest/v1/trades')) {
      console.log('API REQUEST:', request.url());
    }
  });
  
  try {
    // Test 1: Navigate to the /trades page and observe initial statistics
    console.log('TEST 1: Navigate to /trades page and observe initial statistics');
    await page.goto('http://localhost:3000/trades', { waitUntil: 'networkidle2' });
    
    // Wait for the page to load completely
    await page.waitForSelector('.metric-value', { timeout: 10000 });
    
    // Extract initial statistics
    const initialStats = await extractStatistics(page);
    console.log('Initial Statistics:', initialStats);
    
    // Extract pagination info
    const initialPagination = await extractPaginationInfo(page);
    console.log('Initial Pagination:', initialPagination);
    
    // Test 2: Change the number of trades displayed per page
    console.log('\nTEST 2: Change trades per page and verify statistics remain constant');
    
    // Try different page sizes
    const pageSizes = [10, 25, 50, 100];
    const statsAfterPageSizeChange = [];
    
    for (const pageSize of pageSizes) {
      console.log(`Changing page size to: ${pageSize}`);
      
      // Find the page size selector
      await page.waitForSelector('select[value="25"]', { timeout: 5000 });
      await page.select('select', pageSize.toString());
      
      // Wait for the page to update
      await page.waitForTimeout(1000);
      
      // Extract statistics after page size change
      const stats = await extractStatistics(page);
      const pagination = await extractPaginationInfo(page);
      
      statsAfterPageSizeChange.push({ pageSize, stats, pagination });
      
      // Compare with initial statistics
      const statsMatch = compareStatistics(initialStats, stats);
      console.log(`Page size ${pageSize}: Statistics match initial values? ${statsMatch}`);
      
      if (!statsMatch) {
        console.log('❌ ERROR: Statistics changed when changing page size!');
        console.log('Initial:', initialStats);
        console.log(`After change to ${pageSize}:`, stats);
      }
    }
    
    // Test 3: Navigate between different pages
    console.log('\nTEST 3: Navigate between pages and verify statistics don\'t change');
    
    // Get total pages from pagination
    const totalPages = initialPagination.totalPages;
    const pagesToTest = Math.min(3, totalPages); // Test up to 3 pages
    
    if (totalPages > 1) {
      for (let i = 1; i <= pagesToTest; i++) {
        console.log(`Navigating to page ${i}`);
        
        // Click on the page number if it exists
        const pageButtonSelector = `button:has-text("${i}")`;
        const pageButtonExists = await page.$(pageButtonSelector) !== null;
        
        if (pageButtonExists) {
          await page.click(pageButtonSelector);
          await page.waitForTimeout(1000);
          
          // Extract statistics after page navigation
          const stats = await extractStatistics(page);
          
          // Compare with initial statistics
          const statsMatch = compareStatistics(initialStats, stats);
          console.log(`Page ${i}: Statistics match initial values? ${statsMatch}`);
          
          if (!statsMatch) {
            console.log('❌ ERROR: Statistics changed when navigating to a different page!');
            console.log('Initial:', initialStats);
            console.log(`Page ${i}:`, stats);
          }
        } else {
          console.log(`Page ${i} button not found, skipping.`);
        }
      }
    } else {
      console.log('Only one page of trades, skipping page navigation test.');
    }
    
    // Test 4: Apply filters and verify statistics update correctly
    console.log('\nTEST 4: Apply filters and verify statistics update correctly based on filtered data');
    
    // Test symbol filter
    console.log('Testing symbol filter...');
    await page.waitForSelector('input[placeholder="Search symbol..."]', { timeout: 5000 });
    await page.type('input[placeholder="Search symbol..."]', 'AAPL');
    await page.waitForTimeout(1000);
    
    const filteredStats = await extractStatistics(page);
    console.log('Statistics after symbol filter:', filteredStats);
    
    // Clear symbol filter
    await page.click('button:has-text("Clear Filters")');
    await page.waitForTimeout(1000);
    
    // Test date filter
    console.log('Testing date filter...');
    const today = new Date();
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
    const lastMonthStr = lastMonth.toISOString().split('T')[0];
    
    await page.waitForSelector('input[type="date"]', { timeout: 5000 });
    await page.evaluate((dateStr) => {
      const dateInputs = document.querySelectorAll('input[type="date"]');
      if (dateInputs.length >= 1) {
        dateInputs[0].value = dateStr; // From date
      }
    }, lastMonthStr);
    await page.waitForTimeout(1000);
    
    const dateFilteredStats = await extractStatistics(page);
    console.log('Statistics after date filter:', dateFilteredStats);
    
    // Clear date filter
    await page.click('button:has-text("Clear Filters")');
    await page.waitForTimeout(1000);
    
    // Verify statistics returned to initial values after clearing filters
    const finalStats = await extractStatistics(page);
    const statsMatchAfterClear = compareStatistics(initialStats, finalStats);
    console.log(`Statistics match initial values after clearing filters? ${statsMatchAfterClear}`);
    
    if (!statsMatchAfterClear) {
      console.log('❌ ERROR: Statistics did not return to initial values after clearing filters!');
      console.log('Initial:', initialStats);
      console.log('After clear:', finalStats);
    }
    
    // Test 5: Check for console errors or unexpected behavior
    console.log('\nTEST 5: Checking for console errors...');
    
    // Check for any error messages in the console
    const consoleErrors = await page.evaluate(() => {
      const errors = [];
      const originalError = console.error;
      console.error = (...args) => {
        errors.push(args.join(' '));
        originalError.apply(console, args);
      };
      return errors;
    });
    
    if (consoleErrors.length > 0) {
      console.log('❌ Console errors detected:');
      consoleErrors.forEach(error => console.log('  -', error));
    } else {
      console.log('✅ No console errors detected');
    }
    
    // Generate test report
    const testReport = {
      timestamp: new Date().toISOString(),
      initialStats,
      statsAfterPageSizeChange,
      filteredStats,
      dateFilteredStats,
      finalStats,
      consoleErrors
    };
    
    fs.writeFileSync('trades-statistics-test-report.json', JSON.stringify(testReport, null, 2));
    console.log('\n📊 Test report saved to trades-statistics-test-report.json');
    
    console.log('\n✅ All tests completed!');
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  } finally {
    await browser.close();
  }
}

async function extractStatistics(page) {
  return await page.evaluate(() => {
    const totalTradesElement = document.querySelector('.metric-value');
    const totalPnLElements = document.querySelectorAll('.metric-value');
    
    // Extract values from the statistics cards
    let totalTrades = 0;
    let totalPnL = 0;
    let winRate = 0;
    
    // Find the correct elements based on their context
    const metricCards = document.querySelectorAll('.dashboard-card');
    
    metricCards.forEach(card => {
      const labelElement = card.querySelector('h3');
      const valueElement = card.querySelector('.metric-value');
      
      if (labelElement && valueElement) {
        const labelText = labelElement.textContent.trim();
        
        if (labelText.includes('Total Trades')) {
          totalTrades = parseInt(valueElement.textContent.trim()) || 0;
        } else if (labelText.includes('Total P&L')) {
          // Extract numeric value from currency format
          const pnlText = valueElement.textContent.trim().replace(/[^0-9.-]/g, '');
          totalPnL = parseFloat(pnlText) || 0;
        } else if (labelText.includes('Win Rate')) {
          // Extract percentage value
          const winRateText = valueElement.textContent.trim().replace(/[^0-9.]/g, '');
          winRate = parseFloat(winRateText) || 0;
        }
      }
    });
    
    return {
      totalTrades,
      totalPnL,
      winRate
    };
  });
}

async function extractPaginationInfo(page) {
  return await page.evaluate(() => {
    const pageInfoElement = document.querySelector('.metric-value');
    const paginationInfo = document.querySelector('span:has-text("Page")');
    
    // Extract pagination information
    let currentPage = 1;
    let totalPages = 1;
    
    // Find pagination info
    const paginationElements = document.querySelectorAll('span');
    paginationElements.forEach(element => {
      const text = element.textContent.trim();
      if (text.includes('Page') && text.includes('of')) {
        const matches = text.match(/Page (\d+) of (\d+)/);
        if (matches) {
          currentPage = parseInt(matches[1]) || 1;
          totalPages = parseInt(matches[2]) || 1;
        }
      }
    });
    
    return {
      currentPage,
      totalPages
    };
  });
}

function compareStatistics(stats1, stats2) {
  // Compare statistics with a small tolerance for floating point values
  const tolerance = 0.01;
  
  return (
    stats1.totalTrades === stats2.totalTrades &&
    Math.abs(stats1.totalPnL - stats2.totalPnL) < tolerance &&
    Math.abs(stats1.winRate - stats2.winRate) < tolerance
  );
}

// Run the tests
runTests().catch(console.error);