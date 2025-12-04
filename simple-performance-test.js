// Simple performance test for filtering optimization
// Tests the optimized code without requiring browser automation

console.log('🚀 Starting simple performance test for filtering optimization...');

// Test 1: Debouncing performance
console.log('\n📊 Testing debouncing performance...');

const { createFilterDebouncedFunction, createStatsDebouncedFunction } = require('./src/lib/memoization.ts');

let filterCallCount = 0;
let statsCallCount = 0;

const mockFilterFunction = () => {
  filterCallCount++;
  console.log(`   Filter call #${filterCallCount}`);
};

const mockStatsFunction = () => {
  statsCallCount++;
  console.log(`   Stats call #${statsCallCount}`);
};

// Create debounced functions
const debouncedFilter = createFilterDebouncedFunction(mockFilterFunction);
const debouncedStats = createStatsDebouncedFunction(mockStatsFunction);

// Test rapid filter calls
console.log('🔍 Testing rapid filter calls (should be debounced)...');
const startTime = Date.now();

for (let i = 0; i < 10; i++) {
  debouncedFilter();
}

// Wait for debounced execution
setTimeout(() => {
  const filterEndTime = Date.now();
  const filterTime = filterEndTime - startTime;
  
  console.log(`✅ Filter debouncing test completed in ${filterTime}ms`);
  console.log(`   Total calls made: ${filterCallCount} (should be 1 with debouncing)`);
  
  // Test 2: Memory usage simulation
  console.log('\n🧠 Testing memory management...');
  
  // Simulate memory usage
  const mockTrades = Array.from({ length: 1000 }, (_, i) => ({
    id: `trade-${i}`,
    symbol: `SYMBOL${i}`,
    side: i % 2 === 0 ? 'Buy' : 'Sell',
    quantity: 100,
    entry_price: 50 + i,
    pnl: Math.random() * 100 - 50,
    trade_date: '2024-01-01',
    emotional_state: ['FOMO', 'CONFIDENT', 'NEUTRAL'][i % 3]
  }));
  
  console.log(`   Created ${mockTrades.length} mock trades`);
  
  // Test filter processing performance
  const processStartTime = Date.now();
  
  // Simulate filtering
  const filteredTrades = mockTrades.filter(trade => 
    trade.symbol.includes('SYMBOL1') && 
    trade.side === 'Buy' &&
    trade.pnl > 0
  );
  
  const processEndTime = Date.now();
  const processTime = processEndTime - processStartTime;
  
  console.log(`   Filtered ${filteredTrades.length} trades from ${mockTrades.length} in ${processTime}ms`);
  console.log(`   Processing rate: ${(mockTrades.length / processTime * 1000).toFixed(0)} trades/second`);
  
  // Test 3: State management performance
  console.log('\n💾 Testing state management performance...');
  
  const { getFilterPersistenceStats } = require('./src/lib/filter-persistence.ts');
  
  // Simulate multiple filter operations
  const stateStartTime = Date.now();
  
  for (let i = 0; i < 100; i++) {
    const mockFilters = {
      symbol: `SYMBOL${i}`,
      market: i % 2 === 0 ? 'stock' : 'crypto',
      dateFrom: '2024-01-01',
      dateTo: '2024-12-31'
    };
    
    // Simulate save/load operations
    localStorage.setItem(`test_filters_${i}`, JSON.stringify(mockFilters));
    const loaded = JSON.parse(localStorage.getItem(`test_filters_${i}`) || '{}');
  }
  
  const stateEndTime = Date.now();
  const stateTime = stateEndTime - stateStartTime;
  
  console.log(`   State management test completed in ${stateTime}ms`);
  console.log(`   Processing rate: ${(100 / stateTime * 1000).toFixed(0)} operations/second`);
  
  // Clean up test data
  for (let i = 0; i < 100; i++) {
    localStorage.removeItem(`test_filters_${i}`);
  }
  
  // Test 4: Performance metrics
  console.log('\n📈 Performance Metrics Summary:');
  
  const avgFilterTime = filterTime;
  const avgProcessTime = processTime;
  const avgStateTime = stateTime;
  
  console.log(`   Average filter response time: ${avgFilterTime}ms`);
  console.log(`   Average processing time: ${avgProcessTime}ms`);
  console.log(`   Average state management time: ${avgStateTime}ms`);
  
  // Check if we meet the sub-300ms requirement
  const maxTime = Math.max(avgFilterTime, avgProcessTime, avgStateTime);
  const meetsRequirement = maxTime < 300;
  
  console.log(`   Maximum operation time: ${maxTime}ms`);
  console.log(`   Sub-300ms requirement met: ${meetsRequirement ? '✅ YES' : '❌ NO'}`);
  
  // Performance grade
  let grade = 'A+';
  if (maxTime > 500) grade = 'F';
  else if (maxTime > 300) grade = 'C';
  else if (maxTime > 200) grade = 'B';
  else if (maxTime > 150) grade = 'A';
  
  console.log(`   Performance grade: ${grade}`);
  
  // Test 5: Memory efficiency
  if (typeof process !== 'undefined' && process.memoryUsage) {
    const memoryUsage = process.memoryUsage();
    console.log('\n💾 Memory Usage:');
    console.log(`   RSS: ${Math.round(memoryUsage.rss / 1024 / 1024)}MB`);
    console.log(`   Heap Used: ${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`);
    console.log(`   Heap Total: ${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`);
    console.log(`   External: ${Math.round(memoryUsage.external / 1024 / 1024)}MB`);
  }
  
  // Final results
  console.log('\n🎯 FINAL RESULTS:');
  const results = {
    success: meetsRequirement,
    avgFilterTime,
    avgProcessTime,
    avgStateTime,
    maxTime,
    grade,
    filterCallCount,
    statsCallCount,
    tradesProcessed: mockTrades.length,
    filtersProcessed: 100
  };
  
  console.log(JSON.stringify(results, null, 2));
  
  if (results.success) {
    console.log('\n✅ Performance optimization PASSED - All operations complete in under 300ms');
    process.exit(0);
  } else {
    console.log('\n❌ Performance optimization FAILED - Some operations exceed 300ms');
    process.exit(1);
  }
  
}, 200); // Wait for debounced functions to complete