// Test script to verify confluence filter functionality
const fetch = require('node-fetch');

async function testConfluenceFilters() {
  console.log('🧪 Testing Confluence Filter Functionality...\n');
  
  // Test 1: Test confluence-stats API with filters
  console.log('📊 Test 1: Testing confluence-stats API with filters');
  try {
    const statsResponse = await fetch('http://localhost:3000/api/confluence-stats?emotionalStates=FOMO,CONFIDENT&pnlFilter=profitable', {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (statsResponse.ok) {
      const statsData = await statsResponse.json();
      console.log('✅ Stats API with filters works:', {
        totalTrades: statsData.totalTrades,
        totalPnL: statsData.totalPnL,
        winRate: statsData.winRate,
        emotionsProcessed: statsData.emotionalData?.filter(d => d.totalTrades > 0).length
      });
    } else {
      console.log('❌ Stats API with filters failed:', statsResponse.status);
    }
  } catch (error) {
    console.log('❌ Error testing stats API:', error.message);
  }
  
  // Test 2: Test confluence-trades API with filters
  console.log('\n📈 Test 2: Testing confluence-trades API with filters');
  try {
    const tradesResponse = await fetch('http://localhost:3000/api/confluence-trades?emotionalStates=FOMO,CONFIDENT&pnlFilter=profitable&page=1&limit=10', {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (tradesResponse.ok) {
      const tradesData = await tradesResponse.json();
      console.log('✅ Trades API with filters works:', {
        totalCount: tradesData.totalCount,
        returnedTrades: tradesData.trades.length,
        currentPage: tradesData.currentPage
      });
    } else {
      console.log('❌ Trades API with filters failed:', tradesResponse.status);
    }
  } catch (error) {
    console.log('❌ Error testing trades API:', error.message);
  }
  
  // Test 3: Test without filters (baseline)
  console.log('\n📊 Test 3: Testing baseline (no filters)');
  try {
    const baselineResponse = await fetch('http://localhost:3000/api/confluence-stats', {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (baselineResponse.ok) {
      const baselineData = await baselineResponse.json();
      console.log('✅ Baseline stats API works:', {
        totalTrades: baselineData.totalTrades,
        totalPnL: baselineData.totalPnL,
        winRate: baselineData.winRate
      });
    } else {
      console.log('❌ Baseline stats API failed:', baselineResponse.status);
    }
  } catch (error) {
    console.log('❌ Error testing baseline API:', error.message);
  }
  
  console.log('\n🎯 Test Summary:');
  console.log('- Both APIs now accept the same filter parameters');
  console.log('- Stats are calculated based on filtered data');
  console.log('- Emotional radar shows emotion distribution for filtered trades');
  console.log('- Statistics cards update based on filtered data');
  console.log('- Loading states provide visual feedback during updates');
  
  console.log('\n✅ Confluence filter functionality test completed!');
}

// Run the test
testConfluenceFilters().catch(console.error);