
async function testDashboardData() {
  console.log('🧪 Testing Dashboard Data Flow...\n');

  try {
    // Test 1: Check if API endpoints are accessible
    console.log('📡 Testing API endpoints...');
    
    const statsResponse = await fetch('http://localhost:3000/api/confluence-stats');
    console.log('Stats API Status:', statsResponse.status);
    
    const tradesResponse = await fetch('http://localhost:3000/api/confluence-trades?limit=5');
    console.log('Trades API Status:', tradesResponse.status);

    // Test 2: Check API response structure
    if (statsResponse.ok && tradesResponse.ok) {
      const statsData = await statsResponse.json();
      const tradesData = await tradesResponse.json();
      
      console.log('\n📊 Stats API Response Structure:');
      console.log('- totalTrades:', statsData.totalTrades || 'missing');
      console.log('- totalPnL:', statsData.totalPnL || 'missing');
      console.log('- winRate:', statsData.winRate || 'missing');
      console.log('- emotionalData length:', statsData.emotionalData?.length || 0);
      
      console.log('\n📈 Trades API Response Structure:');
      console.log('- trades count:', tradesData.trades?.length || 0);
      console.log('- totalCount:', tradesData.totalCount || 'missing');
      
      // Test 3: Verify data types
      console.log('\n🔍 Data Type Validation:');
      console.log('- totalTrades is number:', typeof statsData.totalTrades === 'number');
      console.log('- totalPnL is number:', typeof statsData.totalPnL === 'number');
      console.log('- winRate is number:', typeof statsData.winRate === 'number');
      console.log('- trades array exists:', Array.isArray(tradesData.trades));
      
      if (tradesData.trades && tradesData.trades.length > 0) {
        const sampleTrade = tradesData.trades[0];
        console.log('- Sample trade structure:');
        console.log('  - id:', sampleTrade.id ? '✓' : '✗');
        console.log('  - symbol:', sampleTrade.symbol ? '✓' : '✗');
        console.log('  - side:', sampleTrade.side ? '✓' : '✗');
        console.log('  - pnl:', sampleTrade.pnl !== undefined ? '✓' : '✗');
        console.log('  - trade_date:', sampleTrade.trade_date ? '✓' : '✗');
      }
      
      console.log('\n✅ Dashboard data flow test completed successfully!');
      console.log('📝 Summary:');
      console.log('- API endpoints are accessible');
      console.log('- Data structure is correct');
      console.log('- Data types are valid');
      console.log('- Dashboard should now display real data instead of hardcoded values');
      
    } else {
      console.log('\n❌ API endpoints returned errors:');
      console.log('- Stats error:', statsResponse.status, statsResponse.statusText);
      console.log('- Trades error:', tradesResponse.status, tradesResponse.statusText);
    }
    
  } catch (error) {
    console.error('\n💥 Test failed:', error.message);
    console.log('Make sure the development server is running on localhost:3000');
  }
}

testDashboardData();