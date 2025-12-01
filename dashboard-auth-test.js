const { createClient } = require('@supabase/supabase-js');
const { randomUUID } = require('crypto');
require('dotenv').config();

console.log('🧪 DASHBOARD AUTHENTICATION TEST');
console.log('=================================');

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Validate environment variables
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing required environment variables:');
  console.error('  - NEXT_PUBLIC_SUPABASE_URL:', SUPABASE_URL ? 'SET' : 'MISSING');
  console.error('  - NEXT_PUBLIC_SUPABASE_ANON_KEY:', SUPABASE_ANON_KEY ? 'SET' : 'MISSING');
  process.exit(1);
}

console.log('✅ Environment variables validated');

// Test user credentials
const TEST_USER_EMAIL = 'testuser@verotrade.com';
const TEST_USER_PASSWORD = 'TestPassword123!';

// Initialize Supabase client with anon key
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Global variable for authenticated client
let authSupabase = null;
let currentUserId = null;

// Authentication function
async function authenticate() {
  console.log('\n🔐 Authenticating user...');
  
  try {
    // Try to sign in first
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: TEST_USER_EMAIL,
      password: TEST_USER_PASSWORD
    });
    
    if (authError) {
      console.log('🔄 Login failed, trying to sign up...');
      
      // Try to sign up if login fails
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: TEST_USER_EMAIL,
        password: TEST_USER_PASSWORD
      });
      
      if (signUpError) {
        console.error('❌ Sign up failed:', signUpError.message);
        throw signUpError;
      }
      
      console.log('✅ Sign up successful');
      
      // Try to sign in again
      const { data: retryAuthData, error: retryAuthError } = await supabase.auth.signInWithPassword({
        email: TEST_USER_EMAIL,
        password: TEST_USER_PASSWORD
      });
      
      if (retryAuthError) {
        console.error('❌ Retry authentication failed:', retryAuthError.message);
        throw retryAuthError;
      }
      
      var session = retryAuthData.session;
    } else {
      console.log('✅ Authentication successful');
      var session = authData.session;
    }
    
    if (!session) {
      throw new Error('No session obtained after authentication');
    }
    
    // Create authenticated client
    authSupabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      }
    });
    
    currentUserId = session.user.id;
    console.log(`👤 Authenticated user ID: ${currentUserId}`);
    
    return session;
  } catch (error) {
    console.error('❌ Authentication failed:', error.message);
    throw error;
  }
}

// Function to test dashboard data fetching
async function testDashboardData() {
  console.log('\n📊 Testing dashboard data fetching...');
  
  if (!authSupabase || !currentUserId) {
    throw new Error('Not authenticated. Call authenticate() first.');
  }
  
  try {
    // Test trades data fetching
    console.log('📋 Fetching trades data...');
    const { data: trades, error: tradesError } = await authSupabase
      .from('trades')
      .select('*')
      .eq('user_id', currentUserId)
      .order('trade_date', { ascending: true });
    
    if (tradesError) {
      console.error('❌ Error fetching trades:', tradesError.message);
      throw tradesError;
    }
    
    console.log(`✅ Successfully fetched ${trades?.length || 0} trades`);
    
    if (trades && trades.length > 0) {
      // Sample the first few trades to check data structure
      console.log('\n📋 Sample trade data:');
      trades.slice(0, 3).forEach((trade, index) => {
        console.log(`  Trade ${index + 1}:`);
        console.log(`    - Date: ${trade.trade_date}`);
        console.log(`    - P&L: $${trade.pnl}`);
        console.log(`    - Market: ${trade.market}`);
        console.log(`    - Symbol: ${trade.symbol}`);
        console.log(`    - Emotional State: ${JSON.stringify(trade.emotional_state)}`);
      });
      
      // Check if trades have dates
      const tradesWithDates = trades.filter(trade => trade.trade_date);
      console.log(`\n📅 Date Analysis:`);
      console.log(`  - Trades with dates: ${tradesWithDates.length}/${trades.length}`);
      console.log(`  - Trades without dates: ${trades.length - tradesWithDates.length}`);
      
      // Show date range
      if (tradesWithDates.length > 0) {
        const dates = tradesWithDates.map(trade => new Date(trade.trade_date));
        const minDate = new Date(Math.min(...dates));
        const maxDate = new Date(Math.max(...dates));
        
        console.log(`  - Earliest trade date: ${minDate.toISOString().split('T')[0]}`);
        console.log(`  - Latest trade date: ${maxDate.toISOString().split('T')[0]}`);
      }
      
      // Calculate P&L statistics
      const totalPnL = trades.reduce((sum, trade) => sum + (trade.pnl || 0), 0);
      const winningTrades = trades.filter(trade => (trade.pnl || 0) > 0);
      const losingTrades = trades.filter(trade => (trade.pnl || 0) < 0);
      const winRate = trades.length > 0 ? ((winningTrades.length / trades.length) * 100).toFixed(1) : '0';
      
      console.log(`\n💰 P&L Analysis:`);
      console.log(`  - Total P&L: $${totalPnL.toFixed(2)}`);
      console.log(`  - Win Rate: ${winRate}%`);
      console.log(`  - Winning Trades: ${winningTrades.length}`);
      console.log(`  - Losing Trades: ${losingTrades.length}`);
      
      // Test emotional data
      const tradesWithEmotions = trades.filter(trade => trade.emotional_state);
      console.log(`\n😊 Emotional Data Analysis:`);
      console.log(`  - Trades with emotions: ${tradesWithEmotions.length}/${trades.length}`);
      
      if (tradesWithEmotions.length > 0) {
        const emotionCounts = {};
        tradesWithEmotions.forEach(trade => {
          if (Array.isArray(trade.emotional_state)) {
            trade.emotional_state.forEach(emotion => {
              emotionCounts[emotion] = (emotionCounts[emotion] || 0) + 1;
            });
          } else if (typeof trade.emotional_state === 'string') {
            emotionCounts[trade.emotional_state] = (emotionCounts[trade.emotional_state] || 0) + 1;
          }
        });
        
        console.log('  - Emotion distribution:');
        Object.entries(emotionCounts)
          .sort(([,a], [,b]) => b - a)
          .forEach(([emotion, count]) => {
            console.log(`    ${emotion}: ${count} occurrences`);
          });
      }
    } else {
      console.log('⚠️  No trades found for this user');
      console.log('  This might be why the dashboard shows empty state');
    }
    
    return trades;
  } catch (error) {
    console.error('❌ Error testing dashboard data:', error.message);
    throw error;
  }
}

// Function to generate P&L chart data
function generatePnLChartData(trades) {
  console.log('\n📈 Generating P&L chart data...');
  
  if (!trades || trades.length === 0) {
    console.log('⚠️  No trades to generate chart data from');
    return [];
  }
  
  // Sort trades by date to ensure proper cumulative calculation
  const sortedTrades = [...trades].sort((a, b) => {
    if (!a.trade_date) return 1; // Put trades without dates at the end
    if (!b.trade_date) return -1;
    return new Date(a.trade_date) - new Date(b.trade_date);
  });
  
  const chartData = sortedTrades.map((trade, index) => {
    const pnlValue = trade.pnl || 0;
    const cumulative = sortedTrades.slice(0, index + 1).reduce((sum, t) => sum + (t.pnl || 0), 0);
    
    // Format the date for display - use trade_date if available, otherwise fallback to Trade X
    let dateLabel = `Trade ${index + 1}`;
    if (trade.trade_date) {
      try {
        const date = new Date(trade.trade_date);
        dateLabel = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      } catch (error) {
        console.warn('Error formatting trade date:', error);
        // Keep the default label if date parsing fails
      }
    }
    
    return {
      date: dateLabel,
      pnl: pnlValue,
      cumulative: cumulative,
      trade_date: trade.trade_date // Keep original date for reference
    };
  });
  
  console.log(`✅ Generated ${chartData.length} data points for P&L chart`);
  
  // Show sample of chart data
  if (chartData.length > 0) {
    console.log('\n📋 Sample P&L chart data:');
    chartData.slice(0, 3).forEach((data, index) => {
      console.log(`  Point ${index + 1}:`);
      console.log(`    - Display Label: ${data.date}`);
      console.log(`    - Original Date: ${data.trade_date || 'N/A'}`);
      console.log(`    - P&L: $${data.pnl.toFixed(2)}`);
      console.log(`    - Cumulative: $${data.cumulative.toFixed(2)}`);
    });
    
    console.log(`\n📊 Chart Data Summary:`);
    console.log(`  - Final Cumulative P&L: $${chartData[chartData.length - 1].cumulative.toFixed(2)}`);
    console.log(`  - Data Points with Date Labels: ${chartData.filter(d => d.date !== `Trade ${chartData.indexOf(d) + 1}`).length}`);
  }
  
  return chartData;
}

// Main execution function
async function main() {
  try {
    console.log('🚀 Starting dashboard authentication test...\n');
    
    // Step 1: Authenticate
    await authenticate();
    
    // Step 2: Test dashboard data fetching
    const trades = await testDashboardData();
    
    // Step 3: Generate P&L chart data
    const chartData = generatePnLChartData(trades);
    
    // Step 4: Test summary
    console.log('\n🎯 DASHBOARD TEST SUMMARY:');
    console.log('========================');
    console.log(`✅ Authentication: SUCCESS`);
    console.log(`✅ Data Fetching: ${trades ? 'SUCCESS' : 'FAILED'}`);
    console.log(`✅ Chart Data Generation: ${chartData ? 'SUCCESS' : 'FAILED'}`);
    
    if (trades && chartData) {
      console.log('\n📊 DATA QUALITY CHECKS:');
      console.log(`  - Total Trades: ${trades.length}`);
      console.log(`  - Trades with Dates: ${trades.filter(t => t.trade_date).length}`);
      console.log(`  - Trades with P&L: ${trades.filter(t => t.pnl !== null && t.pnl !== undefined).length}`);
      console.log(`  - Chart Data Points: ${chartData.length}`);
      console.log(`  - Date Labels (not "Trade X"): ${chartData.filter(d => !d.date.startsWith('Trade ')).length}`);
      
      const dateLabelPercentage = ((chartData.filter(d => !d.date.startsWith('Trade ')).length / chartData.length) * 100).toFixed(1);
      console.log(`  - Date Label Coverage: ${dateLabelPercentage}%`);
      
      if (parseFloat(dateLabelPercentage) > 90) {
        console.log('✅ EXCELLENT: Most chart labels show actual dates!');
      } else if (parseFloat(dateLabelPercentage) > 50) {
        console.log('✅ GOOD: More than half of chart labels show actual dates');
      } else {
        console.log('⚠️  NEEDS IMPROVEMENT: Many chart labels still show "Trade X"');
      }
    }
    
    console.log('\n🎉 DASHBOARD AUTHENTICATION TEST COMPLETED!');
    
  } catch (error) {
    console.error('\n❌ FATAL ERROR during dashboard test:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Execute the script
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Unhandled error:', error);
    process.exit(1);
  });
}

module.exports = { main, authenticate, testDashboardData, generatePnLChartData };