// Test script to verify the functionality of the fixed getFilterStats function

// Mock the required types and dependencies
const TradeFilterOptions = {
  symbol: '',
  market: '',
  dateFrom: '',
  dateTo: '',
  pnlFilter: 'all',
  strategyId: '',
  side: '',
  emotionalStates: [],
  sortBy: 'trade_date',
  sortOrder: 'desc',
};

const StrategyFilterOptions = {
  search: '',
  isActive: null,
  performanceMin: undefined,
  performanceMax: undefined,
  minTrades: undefined,
  hasRules: null,
  sortBy: 'created_at',
  sortOrder: 'desc',
};

// Mock implementation of the fixed getFilterStats function
function getFilterStats(filters) {
  let activeFilters = 0;
  
  // Handle case where filters might be a stringified JSON object
  let parsedFilters;
  
  if (typeof filters === 'string') {
    try {
      parsedFilters = JSON.parse(filters);
    } catch (error) {
      console.warn('Failed to parse filter string in getFilterStats:', error);
      return {
        activeFilters: 0,
        hasActiveFilters: false,
      };
    }
  } else {
    parsedFilters = filters;
  }
  
  // Now safely check properties on the parsed object
  if ('symbol' in parsedFilters) {
    const tradeFilters = parsedFilters;
    if (tradeFilters.symbol) activeFilters++;
    if (tradeFilters.market) activeFilters++;
    if (tradeFilters.dateFrom) activeFilters++;
    if (tradeFilters.dateTo) activeFilters++;
    if (tradeFilters.pnlFilter && tradeFilters.pnlFilter !== 'all') activeFilters++;
    if (tradeFilters.strategyId) activeFilters++;
    if (tradeFilters.side) activeFilters++;
    if (tradeFilters.emotionalStates && tradeFilters.emotionalStates.length > 0) activeFilters++;
  } else {
    const strategyFilters = parsedFilters;
    if (strategyFilters.search) activeFilters++;
    if (strategyFilters.isActive !== null) activeFilters++;
    if (strategyFilters.performanceMin !== undefined) activeFilters++;
    if (strategyFilters.performanceMax !== undefined) activeFilters++;
    if (strategyFilters.minTrades !== undefined) activeFilters++;
    if (strategyFilters.hasRules !== null) activeFilters++;
  }
  
  return {
    activeFilters,
    hasActiveFilters: activeFilters > 0,
  };
}

console.log('Testing getFilterStats functionality...\n');

// Test 1: Test with empty trade filter object
console.log('Test 1: Empty trade filter object');
const emptyTradeFilters = { ...TradeFilterOptions };
const result1 = getFilterStats(emptyTradeFilters);
console.log('Result:', result1);
console.log('Expected: { activeFilters: 0, hasActiveFilters: false }');
console.log(result1.activeFilters === 0 && result1.hasActiveFilters === false ? '✓ Passed' : '✗ Failed');

// Test 2: Test with trade filter object with active filters
console.log('\nTest 2: Trade filter object with active filters');
const activeTradeFilters = { 
  ...TradeFilterOptions, 
  symbol: 'AAPL', 
  market: 'NASDAQ',
  emotionalStates: ['confident', 'greedy']
};
const result2 = getFilterStats(activeTradeFilters);
console.log('Result:', result2);
console.log('Expected: { activeFilters: 3, hasActiveFilters: true }');
console.log(result2.activeFilters === 3 && result2.hasActiveFilters === true ? '✓ Passed' : '✗ Failed');

// Test 3: Test with empty strategy filter object
console.log('\nTest 3: Empty strategy filter object');
const emptyStrategyFilters = { ...StrategyFilterOptions };
const result3 = getFilterStats(emptyStrategyFilters);
console.log('Result:', result3);
console.log('Expected: { activeFilters: 0, hasActiveFilters: false }');
console.log(result3.activeFilters === 0 && result3.hasActiveFilters === false ? '✓ Passed' : '✗ Failed');

// Test 4: Test with strategy filter object with active filters
console.log('\nTest 4: Strategy filter object with active filters');
const activeStrategyFilters = { 
  ...StrategyFilterOptions, 
  search: 'momentum', 
  isActive: true,
  performanceMin: 10
};
const result4 = getFilterStats(activeStrategyFilters);
console.log('Result:', result4);
console.log('Expected: { activeFilters: 3, hasActiveFilters: true }');
console.log(result4.activeFilters === 3 && result4.hasActiveFilters === true ? '✓ Passed' : '✗ Failed');

// Test 5: Test with stringified JSON of trade filters
console.log('\nTest 5: Stringified JSON of trade filters');
const stringifiedTradeFilters = JSON.stringify(activeTradeFilters);
const result5 = getFilterStats(stringifiedTradeFilters);
console.log('Result:', result5);
console.log('Expected: { activeFilters: 3, hasActiveFilters: true }');
console.log(result5.activeFilters === 3 && result5.hasActiveFilters === true ? '✓ Passed' : '✗ Failed');

// Test 6: Test with stringified JSON of strategy filters
console.log('\nTest 6: Stringified JSON of strategy filters');
const stringifiedStrategyFilters = JSON.stringify(activeStrategyFilters);
const result6 = getFilterStats(stringifiedStrategyFilters);
console.log('Result:', result6);
console.log('Expected: { activeFilters: 3, hasActiveFilters: true }');
console.log(result6.activeFilters === 3 && result6.hasActiveFilters === true ? '✓ Passed' : '✗ Failed');

// Test 7: Test with invalid JSON string
console.log('\nTest 7: Invalid JSON string');
const invalidJson = '{"symbol": "AAPL", "market": "NASDAQ"'; // Missing closing brace
const result7 = getFilterStats(invalidJson);
console.log('Result:', result7);
console.log('Expected: { activeFilters: 0, hasActiveFilters: false }');
console.log(result7.activeFilters === 0 && result7.hasActiveFilters === false ? '✓ Passed' : '✗ Failed');

console.log('\nAll functionality tests completed!');