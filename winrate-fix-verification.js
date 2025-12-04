// Winrate Fix Verification Script
// This script tests the winrate calculation fix in the browser console

console.log('🔍 [WINRATE FIX VERIFICATION] Starting winrate fix verification...');

// Test function to simulate winrate calculation
function testWinrateCalculation() {
  console.log('🧪 [WINRATE TEST] Testing winrate calculation logic...');
  
  // Test Case 1: Normal data
  const testData1 = [
    { pnl: 100 },  // Win
    { pnl: -50 },  // Loss
    { pnl: 25 },   // Win
    { pnl: 0 },    // Neither (shouldn't count as win or loss)
    { pnl: -10 }   // Loss
  ];
  
  const result1 = calculateWinrate(testData1);
  console.log('📊 [WINRATE TEST] Test Case 1 - Mixed data:', {
    data: testData1,
    result: result1,
    expected: '40.0% (2 wins out of 5 trades with P&L)'
  });
  
  // Test Case 2: All wins
  const testData2 = [
    { pnl: 50 },
    { pnl: 25 },
    { pnl: 100 }
  ];
  
  const result2 = calculateWinrate(testData2);
  console.log('📊 [WINRATE TEST] Test Case 2 - All wins:', {
    data: testData2,
    result: result2,
    expected: '100.0% (3 wins out of 3 trades)'
  });
  
  // Test Case 3: All losses
  const testData3 = [
    { pnl: -50 },
    { pnl: -25 },
    { pnl: -10 }
  ];
  
  const result3 = calculateWinrate(testData3);
  console.log('📊 [WINRATE TEST] Test Case 3 - All losses:', {
    data: testData3,
    result: result3,
    expected: '0.0% (0 wins out of 3 trades)'
  });
  
  // Test Case 4: Empty data
  const testData4 = [];
  const result4 = calculateWinrate(testData4);
  console.log('📊 [WINRATE TEST] Test Case 4 - Empty data:', {
    data: testData4,
    result: result4,
    expected: '0.0% (0 wins out of 0 trades)'
  });
  
  // Test Case 5: Data with null/undefined P&L values
  const testData5 = [
    { pnl: 100 },
    { pnl: null },
    { pnl: undefined },
    { pnl: -50 }
  ];
  
  const result5 = calculateWinrate(testData5);
  console.log('📊 [WINRATE TEST] Test Case 5 - Null/Undefined P&L:', {
    data: testData5,
    result: result5,
    expected: '50.0% (1 win out of 2 valid trades, null/undefined treated as 0)'
  });
  
  console.log('✅ [WINRATE TEST] All test cases completed!');
  console.log('🔍 [WINRATE FIX VERIFICATION] Manual verification complete.');
  
  return {
    test1: result1,
    test2: result2,
    test3: result3,
    test4: result4,
    test5: result5
  };
}

function calculateWinrate(trades) {
  if (!trades || trades.length === 0) {
    return {
      winRate: 0,
      totalTrades: 0,
      winningTrades: 0,
      losingTrades: 0,
      totalPnL: 0
    };
  }
  
  let winningTrades = 0;
  let losingTrades = 0;
  let totalPnL = 0;
  
  trades.forEach(trade => {
    const pnl = trade.pnl || 0;  // Treat null/undefined as 0
    totalPnL += pnl;
    
    if (pnl > 0) {
      winningTrades++;
    } else if (pnl < 0) {
      losingTrades++;
    }
    // Note: pnl === 0 is neither win nor loss
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

// Test the actual fetchTradesStatistics function if available
async function testFetchTradesStatistics() {
  console.log('🔍 [WINRATE FIX VERIFICATION] Testing actual fetchTradesStatistics function...');
  
  try {
    // This would need to be run in the actual application context
    if (typeof window !== 'undefined' && window.fetchTradesStatistics) {
      console.log('📊 [WINRATE FIX VERIFICATION] fetchTradesStatistics function found, testing...');
      
      // Test with different filters
      const testCases = [
        { name: 'No filters', filters: {} },
        { name: 'Stock market', filters: { market: 'stock' } },
        { name: 'Crypto market', filters: { market: 'crypto' } },
        { name: 'Profitable only', filters: { pnlFilter: 'profitable' } },
        { name: 'Buy trades only', filters: { side: 'Buy' } }
      ];
      
      for (const testCase of testCases) {
        console.log(`🧪 [WINRATE FIX VERIFICATION] Testing: ${testCase.name}`);
        const result = await window.fetchTradesStatistics('test-user-id', testCase.filters);
        console.log(`📊 [WINRATE FIX VERIFICATION] Result for ${testCase.name}:`, result);
        
        // Add delay between tests
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    } else {
      console.log('⚠️ [WINRATE FIX VERIFICATION] fetchTradesStatistics function not available in window context');
      console.log('💡 [WINRATE FIX VERIFICATION] Please run this test in the actual application');
    }
  } catch (error) {
    console.error('❌ [WINRATE FIX VERIFICATION] Error testing fetchTradesStatistics:', error);
  }
}

// Auto-run tests when script loads
console.log('🚀 [WINRATE FIX VERIFICATION] Auto-running winrate calculation tests...');
testWinrateCalculation();

// Test actual function if in browser context
if (typeof window !== 'undefined') {
  console.log('🌐 [WINRATE FIX VERIFICATION] Browser context detected, testing actual function...');
  testFetchTradesStatistics();
}

// Export for manual testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    testWinrateCalculation,
    calculateWinrate,
    testFetchTradesStatistics
  };
}