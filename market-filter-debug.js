// Market Filter Debug Script
// This script checks the database to understand market values and identify the issue

console.log('🔍 [MARKET_FILTER_DEBUG] Starting market filter database investigation...');

// Simulate database query to check market values
// In a real scenario, this would query the actual database
const mockTradeData = [
  { id: '1', symbol: 'AAPL', market: 'stock', side: 'Buy', pnl: 100 },
  { id: '2', symbol: 'BTC', market: 'crypto', side: 'Sell', pnl: -50 },
  { id: '3', symbol: 'EURUSD', market: 'forex', side: 'Buy', pnl: 25 },
  { id: '4', symbol: 'ES', market: 'futures', side: 'Sell', pnl: 75 },
  { id: '5', symbol: 'GOOGL', market: null, side: 'Buy', pnl: 150 },
  { id: '6', symbol: 'ETH', market: '', side: 'Sell', pnl: -25 },
  { id: '7', symbol: 'TSLA', market: 'Stock', side: 'Buy', pnl: 200 },
  { id: '8', symbol: 'USDJPY', market: 'FOREX', side: 'Sell', pnl: 50 }
];

console.log('\n📊 [DATABASE_ANALYSIS] Analyzing trade market data...');
console.log('Total trades:', mockTradeData.length);

// Analyze market values
const marketCounts = {};
const uniqueMarkets = new Set();

mockTradeData.forEach(trade => {
  const market = trade.market;
  uniqueMarkets.add(market);
  
  if (market) {
    marketCounts[market] = (marketCounts[market] || 0) + 1;
  }
});

console.log('\n🏷️ [MARKET_VALUES] Unique market values found:');
console.log('All market values (including null/empty):', Array.from(uniqueMarkets));
console.log('Non-null market values:', Object.keys(marketCounts));

console.log('\n📈 [MARKET_COUNTS] Market distribution:');
Object.entries(marketCounts).forEach(([market, count]) => {
  console.log(`${market}: ${count} trades`);
});

// Test different filter scenarios
console.log('\n🧪 [FILTER_TEST] Testing market filter scenarios...');

const filterScenarios = [
  { filter: 'stock', expected: 2, description: 'Lowercase "stock" filter' },
  { filter: 'crypto', expected: 1, description: 'Lowercase "crypto" filter' },
  { filter: 'forex', expected: 1, description: 'Lowercase "forex" filter' },
  { filter: 'futures', expected: 1, description: 'Lowercase "futures" filter' },
  { filter: 'Stock', expected: 1, description: 'Uppercase "Stock" filter' },
  { filter: 'FOREX', expected: 1, description: 'Uppercase "FOREX" filter' },
];

filterScenarios.forEach(scenario => {
  const filteredCount = mockTradeData.filter(trade => trade.market === scenario.filter).length;
  const status = filteredCount === scenario.expected ? '✅' : '❌';
  console.log(`${status} ${scenario.description}: ${filteredCount} trades (expected ${scenario.expected})`);
});

// Identify potential issues
console.log('\n🔍 [ISSUE_ANALYSIS] Potential market filter issues:');

// Issue 1: Case sensitivity
const hasCaseIssues = mockTradeData.some(trade => 
  trade.market && trade.market !== trade.market.toLowerCase()
);
if (hasCaseIssues) {
  console.log('❌ CASE_SENSITIVITY: Market values have inconsistent casing');
  console.log('   Found values like "Stock" and "FOREX" instead of lowercase');
}

// Issue 2: Null/empty values
const nullOrEmptyCount = mockTradeData.filter(trade => !trade.market).length;
if (nullOrEmptyCount > 0) {
  console.log(`❌ NULL_VALUES: ${nullOrEmptyCount} trades have null/empty market values`);
}

// Issue 3: Data type mismatches
const hasInvalidTypes = mockTradeData.some(trade => 
  trade.market !== null && typeof trade.market !== 'string'
);
if (hasInvalidTypes) {
  console.log('❌ TYPE_MISMATCH: Some market values are not strings');
}

// Issue 4: Filter value mismatch
const validMarketValues = ['stock', 'crypto', 'forex', 'futures'];
const invalidMarketValues = Object.keys(marketCounts).filter(
  market => !validMarketValues.includes(market.toLowerCase())
);
if (invalidMarketValues.length > 0) {
  console.log('❌ FILTER_MISMATCH: Market values don match filter options');
  console.log('   Invalid values:', invalidMarketValues);
}

console.log('\n💡 [SOLUTIONS] Recommended fixes:');
console.log('1. Standardize market values to lowercase in database');
console.log('2. Handle null/empty market values in queries');
console.log('3. Use case-insensitive filtering in database queries');
console.log('4. Add data validation for market field');
console.log('5. Update UI to show actual available markets');

// Generate test query
console.log('\n🔧 [QUERY_GENERATION] Example database queries:');

console.log('// Current query (case-sensitive):');
console.log('supabase.from("trades").eq("market", "stock")');

console.log('\n// Fixed query (case-insensitive):');
console.log('supabase.from("trades").ilike("market", "stock")');

console.log('\n// Query with null handling:');
console.log('supabase.from("trades").or("market.eq.stock,market.is.null")');

console.log('\n✅ [MARKET_FILTER_DEBUG] Database analysis completed!');