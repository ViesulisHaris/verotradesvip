// Performance test script for optimized filtering functionality
// Tests sub-300ms response time requirement

const puppeteer = require('puppeteer');

async function runPerformanceTest() {
  console.log('🚀 Starting performance test for filtering optimization...');
  
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  
  // Enable performance monitoring
  await page.coverage.startJSCoverage();
  await page.coverage.startCSSCoverage();
  
  try {
    // Navigate to trades page
    console.log('📊 Navigating to trades page...');
    await page.goto('http://localhost:3000/trades', { waitUntil: 'networkidle2' });
    
    // Wait for page to load
    await page.waitForSelector('.dashboard-card', { timeout: 10000 });
    
    // Test 1: Symbol filter performance
    console.log('🔍 Testing symbol filter performance...');
    const symbolFilterStartTime = Date.now();
    
    await page.type('input[placeholder="Search symbol..."]', 'AAPL', { delay: 50 });
    
    // Wait for debounced filter to complete
    await page.waitForTimeout(200);
    
    const symbolFilterEndTime = Date.now();
    const symbolFilterTime = symbolFilterEndTime - symbolFilterStartTime;
    
    console.log(`✅ Symbol filter response time: ${symbolFilterTime}ms`);
    
    // Test 2: Market filter performance
    console.log('🔍 Testing market filter performance...');
    const marketFilterStartTime = Date.now();
    
    await page.select('select', 'stock');
    
    // Wait for debounced filter to complete
    await page.waitForTimeout(200);
    
    const marketFilterEndTime = Date.now();
    const marketFilterTime = marketFilterEndTime - marketFilterStartTime;
    
    console.log(`✅ Market filter response time: ${marketFilterTime}ms`);
    
    // Test 3: Date range filter performance
    console.log('🔍 Testing date range filter performance...');
    const dateFilterStartTime = Date.now();
    
    await page.type('input[type="date"][placeholder*="From"]', '2024-01-01', { delay: 50 });
    await page.type('input[type="date"][placeholder*="To"]', '2024-12-31', { delay: 50 });
    
    // Wait for debounced filter to complete
    await page.waitForTimeout(200);
    
    const dateFilterEndTime = Date.now();
    const dateFilterTime = dateFilterEndTime - dateFilterStartTime;
    
    console.log(`✅ Date range filter response time: ${dateFilterTime}ms`);
    
    // Test 4: Rapid filter changes (stress test)
    console.log('🔍 Testing rapid filter changes...');
    const rapidFilterStartTime = Date.now();
    
    // Simulate rapid typing
    await page.type('input[placeholder="Search symbol..."]', 'GOOGL', { delay: 25 });
    await page.waitForTimeout(50);
    await page.keyboard.press('Backspace');
    await page.keyboard.press('Backspace');
    await page.keyboard.press('Backspace');
    await page.keyboard.press('Backspace');
    await page.waitForTimeout(50);
    await page.type('input[placeholder="Search symbol..."]', 'MSFT', { delay: 25 });
    
    // Wait for final debounced filter to complete
    await page.waitForTimeout(200);
    
    const rapidFilterEndTime = Date.now();
    const rapidFilterTime = rapidFilterEndTime - rapidFilterStartTime;
    
    console.log(`✅ Rapid filter changes response time: ${rapidFilterTime}ms`);
    
    // Test 5: Memory usage check
    console.log('🧠 Checking memory usage...');
    const memoryMetrics = await page.evaluate(() => {
      if (performance.memory) {
        return {
          used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
          total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024),
          limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024)
        };
      }
      return null;
    });
    
    if (memoryMetrics) {
      console.log(`💾 Memory usage: ${memoryMetrics.used}MB / ${memoryMetrics.total}MB (limit: ${memoryMetrics.limit}MB)`);
    }
    
    // Test 6: Console performance logs
    console.log('📝 Checking console performance logs...');
    const consoleLogs = await page.evaluate(() => {
      return window.consoleLogs || [];
    });
    
    const performanceLogs = consoleLogs.filter(log => 
      log.message.includes('queryTime') || 
      log.message.includes('performance') ||
      log.message.includes('MEMORY')
    );
    
    console.log(`📊 Found ${performanceLogs.length} performance-related logs`);
    performanceLogs.forEach(log => {
      console.log(`   ${log.level}: ${log.message}`);
    });
    
    // Calculate overall performance score
    const allFilterTimes = [symbolFilterTime, marketFilterTime, dateFilterTime, rapidFilterTime];
    const avgFilterTime = allFilterTimes.reduce((sum, time) => sum + time, 0) / allFilterTimes.length;
    const maxFilterTime = Math.max(...allFilterTimes);
    
    console.log('\n📈 PERFORMANCE SUMMARY:');
    console.log(`   Average filter response time: ${avgFilterTime.toFixed(2)}ms`);
    console.log(`   Maximum filter response time: ${maxFilterTime}ms`);
    console.log(`   Sub-300ms requirement met: ${maxFilterTime < 300 ? '✅ YES' : '❌ NO'}`);
    
    // Performance grade
    let grade = 'A+';
    if (maxFilterTime > 300) grade = 'F';
    else if (maxFilterTime > 250) grade = 'C';
    else if (maxFilterTime > 200) grade = 'B';
    else if (maxFilterTime > 150) grade = 'A';
    
    console.log(`   Performance grade: ${grade}`);
    
    // Get coverage information
    const [jsCoverage, cssCoverage] = await Promise.all([
      page.coverage.stopJSCoverage(),
      page.coverage.stopCSSCoverage()
    ]);
    
    const totalJSBytes = jsCoverage.reduce((sum, entry) => sum + entry.text.length, 0);
    const usedJSBytes = jsCoverage.reduce((sum, entry) => 
      sum + entry.text.length * (entry.ranges.filter(range => range.used).length / entry.ranges.length), 0
    );
    
    const jsUsagePercentage = ((usedJSBytes / totalJSBytes) * 100).toFixed(2);
    console.log(`   JavaScript usage: ${jsUsagePercentage}%`);
    
    return {
      success: maxFilterTime < 300,
      avgFilterTime,
      maxFilterTime,
      grade,
      memoryMetrics,
      jsUsagePercentage,
      performanceLogs: performanceLogs.length
    };
    
  } catch (error) {
    console.error('❌ Performance test failed:', error);
    return { success: false, error: error.message };
  } finally {
    await browser.close();
  }
}

// Add console logging capture
async function setupConsoleLogging(page) {
  await page.evaluateOnNewDocument(() => {
    window.consoleLogs = [];
    
    const originalLog = console.log;
    const originalWarn = console.warn;
    const originalError = console.error;
    
    console.log = function(...args) {
      window.consoleLogs.push({
        level: 'log',
        message: args.join(' '),
        timestamp: Date.now()
      });
      originalLog.apply(console, args);
    };
    
    console.warn = function(...args) {
      window.consoleLogs.push({
        level: 'warn',
        message: args.join(' '),
        timestamp: Date.now()
      });
      originalWarn.apply(console, args);
    };
    
    console.error = function(...args) {
      window.consoleLogs.push({
        level: 'error',
        message: args.join(' '),
        timestamp: Date.now()
      });
      originalError.apply(console, args);
    };
  });
}

// Run the test
if (require.main === module) {
  runPerformanceTest().then(results => {
    console.log('\n🎯 FINAL RESULTS:');
    console.log(JSON.stringify(results, null, 2));
    
    if (results.success) {
      console.log('\n✅ Performance optimization PASSED - All filters respond in under 300ms');
      process.exit(0);
    } else {
      console.log('\n❌ Performance optimization FAILED - Some filters exceed 300ms');
      process.exit(1);
    }
  }).catch(error => {
    console.error('❌ Test execution failed:', error);
    process.exit(1);
  });
}

module.exports = { runPerformanceTest, setupConsoleLogging };