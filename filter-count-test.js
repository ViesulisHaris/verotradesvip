// Test script to verify filter count calculation fixes
const { createDefaultTradeFilters } = require('./src/lib/filtering-types');
const { getFilterStats } = require('./src/lib/filter-persistence');

// Test 1: Default filters should show 0 active filters
console.log('Test 1: Default filters');
const defaultFilters = createDefaultTradeFilters();
console.log('Default filters:', defaultFilters);
console.log('Active filter count (should be 0):', Object.entries(defaultFilters).filter(([key, value]) => {
  if (value === undefined || value === null || value === '') return false;
  if (Array.isArray(value) && value.length === 0) return false;
  
  // Exclude default values (same logic as in TradesFilterContext.tsx)
  if (key === 'pnlFilter' && value === 'all') return false;
  if (key === 'sortBy' && value === 'trade_date') return false;
  if (key === 'sortOrder' && value === 'desc') return false;
  if (key === 'strategyId' && value === '') return false;
  
  return true;
}).length);

// Test 2: getFilterStats function with default filters
console.log('\nTest 2: getFilterStats with default filters');
const statsResult = getFilterStats(defaultFilters);
console.log('getFilterStats result (should show 0 active):', statsResult);

// Test 3: Filters with some non-default values
console.log('\nTest 3: Filters with active filters');
const activeFilters = {
  ...defaultFilters,
  symbol: 'AAPL',      // Active
  market: 'stocks',     // Active
  pnlFilter: 'profitable', // Active (changed from default 'all')
  sortBy: 'entry_price',   // Active (changed from default 'trade_date')
  sortOrder: 'asc',        // Active (changed from default 'desc')
  strategyId: '123',        // Active (changed from default '')
};

console.log('Active filters:', activeFilters);
console.log('Active filter count (should be 6):', Object.entries(activeFilters).filter(([key, value]) => {
  if (value === undefined || value === null || value === '') return false;
  if (Array.isArray(value) && value.length === 0) return false;
  
  // Exclude default values
  if (key === 'pnlFilter' && value === 'all') return false;
  if (key === 'sortBy' && value === 'trade_date') return false;
  if (key === 'sortOrder' && value === 'desc') return false;
  if (key === 'strategyId' && value === '') return false;
  
  return true;
}).length);

// Test 4: getFilterStats with active filters
console.log('\nTest 4: getFilterStats with active filters');
const activeStatsResult = getFilterStats(activeFilters);
console.log('getFilterStats result (should show 6 active):', activeStatsResult);

// Test 5: Mixed filters (some defaults, some active)
console.log('\nTest 5: Mixed filters');
const mixedFilters = {
  symbol: 'AAPL',      // Active
  market: '',          // Not active (empty)
  dateFrom: '2023-01-01', // Active
  dateTo: '',          // Not active (empty)
  pnlFilter: 'all',    // Not active (default)
  strategyId: '',       // Not active (empty)
  side: 'Buy',         // Active
  emotionalStates: [],  // Not active (empty array)
  sortBy: 'trade_date', // Not active (default)
  sortOrder: 'desc',    // Not active (default)
};

console.log('Mixed filters:', mixedFilters);
console.log('Active filter count (should be 3):', Object.entries(mixedFilters).filter(([key, value]) => {
  if (value === undefined || value === null || value === '') return false;
  if (Array.isArray(value) && value.length === 0) return false;
  
  // Exclude default values
  if (key === 'pnlFilter' && value === 'all') return false;
  if (key === 'sortBy' && value === 'trade_date') return false;
  if (key === 'sortOrder' && value === 'desc') return false;
  if (key === 'strategyId' && value === '') return false;
  
  return true;
}).length);

// Test 6: getFilterStats with mixed filters
console.log('\nTest 6: getFilterStats with mixed filters');
const mixedStatsResult = getFilterStats(mixedFilters);
console.log('getFilterStats result (should show 3 active):', mixedStatsResult);

console.log('\n✅ All tests completed!');