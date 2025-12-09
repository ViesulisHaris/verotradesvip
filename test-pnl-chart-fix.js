// Node.js 18+ has built-in fetch

async function testPnLChart() {
  console.log('🔍 Testing PnL Chart Fix...\n');
  
  try {
    // First, let's test the API endpoint that provides data to the dashboard
    const response = await fetch('http://localhost:3000/api/confluence-trades?limit=5&sortBy=trade_date&sortOrder=desc', {
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`);
    }
    
    const data = await response.json();
    
    console.log('✅ API Response Structure:');
    console.log('- Total trades:', data.totalCount);
    console.log('- Returned trades:', data.trades.length);
    
    if (data.trades && data.trades.length > 0) {
      console.log('\n📊 Sample Trade Data Structure:');
      const sampleTrade = data.trades[0];
      Object.keys(sampleTrade).forEach(key => {
        console.log(`  - ${key}:`, sampleTrade[key]);
      });
      
      console.log('\n💰 P&L Values in Sample Trades:');
      data.trades.forEach((trade, index) => {
        console.log(`  Trade ${index + 1}: P&L = ${trade.pnl || 0}`);
      });
      
      // Calculate cumulative P&L to verify what the chart should display
      let cumulativePnL = 0;
      console.log('\n📈 Cumulative P&L Calculation:');
      data.trades.forEach((trade, index) => {
        cumulativePnL += trade.pnl || 0;
        console.log(`  After Trade ${index + 1}: $${cumulativePnL.toLocaleString()}`);
      });
      
      console.log(`\n🎯 Expected Final Chart Value: $${cumulativePnL.toLocaleString()}`);
    } else {
      console.log('⚠️ No trades found in the API response');
    }
    
  } catch (error) {
    console.error('❌ Error testing PnL Chart:', error.message);
  }
}

testPnLChart();