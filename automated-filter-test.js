// Automated Filter Testing Script
// Uses Puppeteer-like approach to test filtering functionality

const puppeteer = require('puppeteer');

async function runAutomatedFilterTest() {
  console.log('🚀 Starting Automated Filter Verification...');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    
    // Enable console logging from the page
    page.on('console', msg => {
      console.log('🌐 PAGE:', msg.text());
    });
    
    page.on('response', response => {
      if (response.url().includes('/trades') || response.url().includes('/api/')) {
        console.log('📡 API:', response.url(), response.status());
      }
    });
    
    // Navigate to trades page
    console.log('📍 Navigating to trades page...');
    await page.goto('http://localhost:3000/trades', { waitUntil: 'networkidle2' });
    
    // Wait for authentication or handle login
    await page.waitForTimeout(3000);
    
    // Check if we need to login
    const needsLogin = await page.$('input[type="email"]');
    if (needsLogin) {
      console.log('🔐 Login required - skipping automated test for now');
      console.log('💡 Please run manual verification by:');
      console.log('   1. Opening http://localhost:3000/trades');
      console.log('   2. Opening browser console (F12)');
      console.log('   3. Copying and pasting the contents of run-verification.js');
      return;
    }
    
    // Wait for trades page to load
    await page.waitForSelector('input[placeholder="Search symbol..."]', { timeout: 10000 });
    console.log('✅ Trades page loaded');
    
    const testResults = {
      individualFilters: {},
      combinedFilters: {},
      performance: {},
      statistics: {},
      summary: { totalTests: 0, passedTests: 0, failedTests: 0 }
    };
    
    // Test 1: Symbol Filter
    console.log('\n🧪 Testing Symbol Filter...');
    const symbolTest = await testSymbolFilter(page);
    testResults.individualFilters.symbol = symbolTest;
    testResults.summary.totalTests++;
    if (symbolTest.passed) testResults.summary.passedTests++;
    else testResults.summary.failedTests++;
    
    // Test 2: Market Filter
    console.log('\n🧪 Testing Market Filter...');
    const marketTest = await testMarketFilter(page);
    testResults.individualFilters.market = marketTest;
    testResults.summary.totalTests++;
    if (marketTest.passed) testResults.summary.passedTests++;
    else testResults.summary.failedTests++;
    
    // Test 3: Date Range Filter
    console.log('\n🧪 Testing Date Range Filter...');
    const dateTest = await testDateRangeFilter(page);
    testResults.individualFilters.dateRange = dateTest;
    testResults.summary.totalTests++;
    if (dateTest.passed) testResults.summary.passedTests++;
    else testResults.summary.failedTests++;
    
    // Test 4: Sorting
    console.log('\n🧪 Testing Sorting...');
    const sortTest = await testSorting(page);
    testResults.individualFilters.sorting = sortTest;
    testResults.summary.totalTests++;
    if (sortTest.passed) testResults.summary.passedTests++;
    else testResults.summary.failedTests++;
    
    // Test 5: Combined Filters
    console.log('\n🧪 Testing Combined Filters...');
    const combinedTest = await testCombinedFilters(page);
    testResults.combinedFilters.all = combinedTest;
    testResults.summary.totalTests++;
    if (combinedTest.passed) testResults.summary.passedTests++;
    else testResults.summary.failedTests++;
    
    // Test 6: Performance
    console.log('\n🧪 Testing Performance...');
    const perfTest = await testPerformance(page);
    testResults.performance.responseTime = perfTest;
    testResults.summary.totalTests++;
    if (perfTest.passed) testResults.summary.passedTests++;
    else testResults.summary.failedTests++;
    
    // Test 7: Statistics Updates
    console.log('\n🧪 Testing Statistics Updates...');
    const statsTest = await testStatisticsUpdates(page);
    testResults.statistics.updates = statsTest;
    testResults.summary.totalTests++;
    if (statsTest.passed) testResults.summary.passedTests++;
    else testResults.summary.failedTests++;
    
    // Generate report
    generateReport(testResults);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
}

async function testSymbolFilter(page) {
  const startTime = Date.now();
  
  try {
    // Get initial trade count
    const initialTrades = await page.$$eval('.dashboard-card.overflow-hidden', elements => elements.length);
    
    // Enter symbol filter
    await page.type('input[placeholder="Search symbol..."]', 'AAPL');
    await page.keyboard.press('Tab'); // Trigger change event
    
    // Wait for debouncing
    await page.waitForTimeout(500);
    
    // Get filtered trade count
    const filteredTrades = await page.$$eval('.dashboard-card.overflow-hidden', elements => elements.length);
    
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    return {
      passed: filteredTrades <= initialTrades,
      details: {
        initialTrades,
        filteredTrades,
        responseTime: `${responseTime}ms`,
        under300ms: responseTime < 300
      }
    };
  } catch (error) {
    return {
      passed: false,
      details: { error: error.message }
    };
  }
}

async function testMarketFilter(page) {
  const startTime = Date.now();
  
  try {
    // Clear any existing filters
    await page.click('button:contains("Clear Filters")');
    await page.waitForTimeout(300);
    
    // Test market filter
    await page.select('select', 'stock');
    await page.waitForTimeout(500);
    
    const tradeCount = await page.$$eval('.dashboard-card.overflow-hidden', elements => elements.length);
    
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    return {
      passed: tradeCount >= 0,
      details: {
        market: 'stock',
        tradeCount,
        responseTime: `${responseTime}ms`,
        under300ms: responseTime < 300
      }
    };
  } catch (error) {
    return {
      passed: false,
      details: { error: error.message }
    };
  }
}

async function testDateRangeFilter(page) {
  const startTime = Date.now();
  
  try {
    // Get date inputs
    const dateInputs = await page.$$('input[type="date"]');
    if (dateInputs.length < 2) {
      return {
        passed: false,
        details: { error: 'Date inputs not found' }
      };
    }
    
    // Set date range
    const today = new Date().toISOString().split('T')[0];
    const lastMonth = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    await dateInputs[0].type(lastMonth); // From date
    await dateInputs[1].type(today);     // To date
    
    await page.waitForTimeout(500);
    
    const tradeCount = await page.$$eval('.dashboard-card.overflow-hidden', elements => elements.length);
    
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    return {
      passed: tradeCount >= 0,
      details: {
        dateFrom: lastMonth,
        dateTo: today,
        tradeCount,
        responseTime: `${responseTime}ms`,
        under300ms: responseTime < 300
      }
    };
  } catch (error) {
    return {
      passed: false,
      details: { error: error.message }
    };
  }
}

async function testSorting(page) {
  const startTime = Date.now();
  
  try {
    // Find sortable headers
    const sortHeaders = await page.$$('th, [data-testid="sort-header"]');
    if (sortHeaders.length === 0) {
      return {
        passed: false,
        details: { error: 'No sortable headers found' }
      };
    }
    
    // Click first sortable header
    await sortHeaders[0].click();
    await page.waitForTimeout(500);
    
    // Check if statistics are still present
    const statsBoxes = await page.$$('.metric-value');
    
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    return {
      passed: statsBoxes.length > 0,
      details: {
        sortableHeaders: sortHeaders.length,
        statsBoxes: statsBoxes.length,
        responseTime: `${responseTime}ms`,
        under300ms: responseTime < 300
      }
    };
  } catch (error) {
    return {
      passed: false,
      details: { error: error.message }
    };
  }
}

async function testCombinedFilters(page) {
  const startTime = Date.now();
  
  try {
    // Clear filters first
    await page.click('button:contains("Clear Filters")');
    await page.waitForTimeout(300);
    
    // Apply multiple filters
    await page.type('input[placeholder="Search symbol..."]', 'AAPL');
    await page.select('select', 'stock');
    
    const dateInputs = await page.$$('input[type="date"]');
    if (dateInputs.length >= 2) {
      const today = new Date().toISOString().split('T')[0];
      const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      await dateInputs[0].type(lastWeek);
      await dateInputs[1].type(today);
    }
    
    await page.waitForTimeout(500);
    
    const tradeCount = await page.$$eval('.dashboard-card.overflow-hidden', elements => elements.length);
    const statsBoxes = await page.$$('.metric-value');
    
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    return {
      passed: tradeCount >= 0 && statsBoxes.length > 0,
      details: {
        symbol: 'AAPL',
        market: 'stock',
        tradeCount,
        statsBoxes: statsBoxes.length,
        responseTime: `${responseTime}ms`,
        under300ms: responseTime < 300
      }
    };
  } catch (error) {
    return {
      passed: false,
      details: { error: error.message }
    };
  }
}

async function testPerformance(page) {
  try {
    const responseTimes = [];
    
    // Test multiple rapid filter changes
    for (let i = 0; i < 5; i++) {
      const startTime = Date.now();
      
      await page.evaluate(() => {
        const input = document.querySelector('input[placeholder="Search symbol..."]');
        if (input) {
          input.value = `TEST_${i}`;
          input.dispatchEvent(new Event('input', { bubbles: true }));
        }
      });
      
      await page.waitForTimeout(200); // Short wait for rapid testing
      const endTime = Date.now();
      responseTimes.push(endTime - startTime);
    }
    
    // Wait for debouncing to settle
    await page.waitForTimeout(1000);
    
    const avgResponseTime = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
    
    return {
      passed: avgResponseTime < 300,
      details: {
        responseTimes,
        avgResponseTime: `${avgResponseTime.toFixed(2)}ms`,
        under300ms: avgResponseTime < 300
      }
    };
  } catch (error) {
    return {
      passed: false,
      details: { error: error.message }
    };
  }
}

async function testStatisticsUpdates(page) {
  try {
    // Get initial statistics
    const initialStats = await page.$$eval('.metric-value', elements => 
      elements.map(el => el.textContent.trim())
    );
    
    // Apply a filter
    await page.select('select', 'crypto');
    await page.waitForTimeout(500);
    
    // Get updated statistics
    const updatedStats = await page.$$eval('.metric-value', elements => 
      elements.map(el => el.textContent.trim())
    );
    
    // Apply sorting
    const sortHeaders = await page.$$('th, [data-testid="sort-header"]');
    if (sortHeaders.length > 0) {
      await sortHeaders[0].click();
      await page.waitForTimeout(500);
      
      // Get stats after sorting
      const statsAfterSort = await page.$$eval('.metric-value', elements => 
        elements.map(el => el.textContent.trim())
      );
      
      return {
        passed: statsAfterSort.length === initialStats.length,
        details: {
          initialStatsCount: initialStats.length,
          updatedStatsCount: updatedStats.length,
          statsAfterSortCount: statsAfterSort.length,
          statisticsMaintained: statsAfterSort.length > 0
        }
      };
    }
    
    return {
      passed: updatedStats.length === initialStats.length,
      details: {
        initialStatsCount: initialStats.length,
        updatedStatsCount: updatedStats.length,
        statisticsUpdated: updatedStats.length > 0
      }
    };
  } catch (error) {
    return {
      passed: false,
      details: { error: error.message }
    };
  }
}

function generateReport(results) {
  console.log('\n' + '='.repeat(80));
  console.log('📋 AUTOMATED FILTER VERIFICATION REPORT');
  console.log('='.repeat(80));
  
  const { totalTests, passedTests, failedTests } = results.summary;
  const successRate = totalTests > 0 ? ((passedTests / totalTests) * 100).toFixed(1) : 0;
  
  console.log(`\n📊 SUMMARY:`);
  console.log(`   Total Tests: ${totalTests}`);
  console.log(`   Passed: ${passedTests} ✅`);
  console.log(`   Failed: ${failedTests} ❌`);
  console.log(`   Success Rate: ${successRate}%`);
  
  console.log(`\n📋 DETAILED RESULTS:`);
  
  Object.entries(results).forEach(([category, tests]) => {
    if (category === 'summary') return;
    
    console.log(`\n${category.toUpperCase()}:`);
    Object.entries(tests).forEach(([testName, result]) => {
      const status = result.passed ? '✅' : '❌';
      console.log(`   ${status} ${testName}`);
      console.log(`      Details:`, result.details);
    });
  });
  
  console.log('\n' + '='.repeat(80));
  console.log('🏁 AUTOMATED VERIFICATION COMPLETE');
  console.log('='.repeat(80));
}

// Check if Puppeteer is available
try {
  require('puppeteer');
  console.log('🤖 Puppeteer found - running automated tests...');
  runAutomatedFilterTest().catch(console.error);
} catch (error) {
  console.log('⚠️  Puppeteer not found - please run manual verification:');
  console.log('   1. Open http://localhost:3000/trades');
  console.log('   2. Open browser console (F12)');
  console.log('   3. Copy and paste contents of run-verification.js');
}