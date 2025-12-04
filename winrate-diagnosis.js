// Winrate Calculation Diagnosis Script
// This script will test the winrate calculation logic and identify issues

// Import the required modules
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Test user ID (replace with actual user ID for testing)
const TEST_USER_ID = 'test-user-id';

async function diagnoseWinrateCalculation() {
  console.log('🔍 [WINRATE DIAGNOSIS] Starting winrate calculation diagnosis...');
  
  try {
    // Test 1: Fetch all trades without filters
    console.log('\n📊 [TEST 1] Fetching all trades without filters...');
    const allTradesQuery = supabase
      .from('trades')
      .select('pnl', { count: 'exact' })
      .eq('user_id', TEST_USER_ID);
    
    const { data: allTradesData, error: allTradesError, count: allTradesCount } = await allTradesQuery;
    
    if (allTradesError) {
      console.error('❌ [TEST 1] Error fetching all trades:', allTradesError);
      return;
    }
    
    console.log('✅ [TEST 1] All trades fetched successfully:', {
      totalCount: allTradesCount,
      dataLength: allTradesData?.length,
      sampleData: allTradesData?.slice(0, 3)
    });
    
    // Calculate winrate manually for verification
    const manualWinrate = calculateManualWinrate(allTradesData || []);
    console.log('📈 [TEST 1] Manual winrate calculation:', manualWinrate);
    
    // Test 2: Fetch trades with market filter (e.g., 'stock')
    console.log('\n📊 [TEST 2] Fetching trades with market filter (stock)...');
    const filteredTradesQuery = supabase
      .from('trades')
      .select('pnl', { count: 'exact' })
      .eq('user_id', TEST_USER_ID)
      .ilike('market', 'stock');
    
    const { data: filteredTradesData, error: filteredTradesError, count: filteredTradesCount } = await filteredTradesQuery;
    
    if (filteredTradesError) {
      console.error('❌ [TEST 2] Error fetching filtered trades:', filteredTradesError);
      return;
    }
    
    console.log('✅ [TEST 2] Filtered trades fetched successfully:', {
      totalCount: filteredTradesCount,
      dataLength: filteredTradesData?.length,
      sampleData: filteredTradesData?.slice(0, 3)
    });
    
    // Calculate winrate for filtered data
    const filteredWinrate = calculateManualWinrate(filteredTradesData || []);
    console.log('📈 [TEST 2] Filtered winrate calculation:', filteredWinrate);
    
    // Test 3: Test the actual fetchTradesStatistics function
    console.log('\n📊 [TEST 3] Testing fetchTradesStatistics function...');
    
    // Import the function (adjust path as needed)
    const { fetchTradesStatistics } = require('./src/lib/optimized-queries.ts');
    
    // Test without filters
    const statsWithoutFilters = await fetchTradesStatistics(TEST_USER_ID, {});
    console.log('✅ [TEST 3a] Stats without filters:', statsWithoutFilters);
    
    // Test with market filter
    const statsWithMarketFilter = await fetchTradesStatistics(TEST_USER_ID, { market: 'stock' });
    console.log('✅ [TEST 3b] Stats with market filter:', statsWithMarketFilter);
    
    // Test 4: Compare results
    console.log('\n🔍 [TEST 4] Comparing results...');
    console.log('Manual calculation (all trades):', manualWinrate);
    console.log('Function result (all trades):', statsWithoutFilters.winRate);
    console.log('Manual calculation (filtered):', filteredWinrate);
    console.log('Function result (filtered):', statsWithMarketFilter.winRate);
    
    // Test 5: Check for caching issues
    console.log('\n🔍 [TEST 5] Testing for caching issues...');
    
    // Call the function multiple times with same parameters
    const stats1 = await fetchTradesStatistics(TEST_USER_ID, { market: 'stock' });
    const stats2 = await fetchTradesStatistics(TEST_USER_ID, { market: 'stock' });
    const stats3 = await fetchTradesStatistics(TEST_USER_ID, { market: 'crypto' });
    
    console.log('First call (stock):', stats1.winRate);
    console.log('Second call (stock):', stats2.winRate);
    console.log('Third call (crypto):', stats3.winRate);
    
    if (stats1.winRate === stats2.winRate) {
      console.log('⚠️ [TEST 5] Possible caching detected - same results for identical calls');
    }
    
    if (stats1.winRate === stats3.winRate) {
      console.log('❌ [TEST 5] CRITICAL ISSUE - Different filters returning same winrate!');
    }
    
    // Test 6: Check data integrity
    console.log('\n🔍 [TEST 6] Checking data integrity...');
    
    // Fetch detailed trade data to verify P&L values
    const detailedQuery = supabase
      .from('trades')
      .select('id, symbol, pnl, market, side')
      .eq('user_id', TEST_USER_ID)
      .limit(10);
    
    const { data: detailedData, error: detailedError } = await detailedQuery;
    
    if (detailedError) {
      console.error('❌ [TEST 6] Error fetching detailed data:', detailedError);
    } else {
      console.log('✅ [TEST 6] Detailed trade data:', detailedData);
      
      // Check for null/undefined P&L values
      const nullPnLTrades = detailedData?.filter(trade => trade.pnl === null || trade.pnl === undefined) || [];
      console.log('📊 [TEST 6] Trades with null/undefined P&L:', nullPnLTrades.length);
      
      // Check for zero P&L values
      const zeroPnLTrades = detailedData?.filter(trade => trade.pnl === 0) || [];
      console.log('📊 [TEST 6] Trades with zero P&L:', zeroPnLTrades.length);
    }
    
  } catch (error) {
    console.error('❌ [WINRATE DIAGNOSIS] Error during diagnosis:', error);
  }
}

function calculateManualWinrate(trades) {
  console.log('🔧 [MANUAL CALCULATION] Processing', trades.length, 'trades');
  
  if (!trades || trades.length === 0) {
    return { winRate: 0, totalTrades: 0, winningTrades: 0, losingTrades: 0 };
  }
  
  let winningTrades = 0;
  let losingTrades = 0;
  let totalPnL = 0;
  
  trades.forEach(trade => {
    const pnl = trade.pnl || 0;
    totalPnL += pnl;
    
    if (pnl > 0) {
      winningTrades++;
    } else if (pnl < 0) {
      losingTrades++;
    }
    
    console.log(`🔧 [TRADE] P&L: ${pnl}, Running totals - Wins: ${winningTrades}, Losses: ${losingTrades}, Total P&L: ${totalPnL}`);
  });
  
  const winRate = trades.length > 0 ? (winningTrades / trades.length) * 100 : 0;
  
  return {
    winRate: parseFloat(winRate.toFixed(2)),
    totalTrades: trades.length,
    winningTrades,
    losingTrades,
    totalPnL: parseFloat(totalPnL.toFixed(2))
  };
}

// Test different filter scenarios
async function testFilterScenarios() {
  console.log('\n🔍 [FILTER SCENARIOS] Testing different filter scenarios...');
  
  const { fetchTradesStatistics } = require('./src/lib/optimized-queries.ts');
  
  const scenarios = [
    { name: 'No filters', filters: {} },
    { name: 'Stock market only', filters: { market: 'stock' } },
    { name: 'Crypto market only', filters: { market: 'crypto' } },
    { name: 'Forex market only', filters: { market: 'forex' } },
    { name: 'Profitable trades only', filters: { pnlFilter: 'profitable' } },
    { name: 'Loss trades only', filters: { pnlFilter: 'lossable' } },
    { name: 'Buy trades only', filters: { side: 'Buy' } },
    { name: 'Sell trades only', filters: { side: 'Sell' } }
  ];
  
  for (const scenario of scenarios) {
    console.log(`\n📊 [SCENARIO] Testing: ${scenario.name}`);
    try {
      const stats = await fetchTradesStatistics(TEST_USER_ID, scenario.filters);
      console.log(`✅ [SCENARIO] ${scenario.name}:`, {
        winRate: stats.winRate,
        totalTrades: stats.totalTrades,
        winningTrades: stats.winningTrades,
        losingTrades: stats.losingTrades,
        totalPnL: stats.totalPnL
      });
    } catch (error) {
      console.error(`❌ [SCENARIO] Error testing ${scenario.name}:`, error);
    }
  }
}

// Run the diagnosis
async function runDiagnosis() {
  console.log('🚀 [WINRATE DIAGNOSIS] Starting comprehensive winrate diagnosis...');
  
  await diagnoseWinrateCalculation();
  await testFilterScenarios();
  
  console.log('\n✅ [WINRATE DIAGNOSIS] Diagnosis complete!');
  console.log('📝 [WINRATE DIAGNOSIS] Check the logs above for any issues identified.');
}

// Execute the diagnosis
runDiagnosis().catch(console.error);