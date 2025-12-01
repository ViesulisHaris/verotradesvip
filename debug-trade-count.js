// Debug script to investigate trade count discrepancy
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function debugTradeCount() {
  console.log('🔍 DEBUGGING TRADE COUNT DISCREPANCY...\n');
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing environment variables');
    return;
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  try {
    // Test 1: Check if we can authenticate and get user
    console.log('📋 Step 1: Checking authentication...');
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('❌ Authentication failed:', authError?.message);
      return;
    }
    
    console.log(`✅ User authenticated: ${user.id}`);
    
    // Test 2: Count all trades in database (no user filter)
    console.log('\n📋 Step 2: Counting ALL trades in database...');
    const { data: allTrades, error: allTradesError } = await supabase
      .from('trades')
      .select('id, user_id');
    
    if (allTradesError) {
      console.error('❌ Error fetching all trades:', allTradesError.message);
      return;
    }
    
    console.log(`📊 Total trades in database: ${allTrades?.length || 0}`);
    
    if (allTrades && allTrades.length > 0) {
      const userCounts = {};
      allTrades.forEach(trade => {
        userCounts[trade.user_id] = (userCounts[trade.user_id] || 0) + 1;
      });
      console.log('👥 Trades per user:', userCounts);
    }
    
    // Test 3: Count trades for current user
    console.log('\n📋 Step 3: Counting trades for current user...');
    const { data: userTrades, error: userTradesError } = await supabase
      .from('trades')
      .select('*')
      .eq('user_id', user.id);
    
    if (userTradesError) {
      console.error('❌ Error fetching user trades:', userTradesError.message);
      return;
    }
    
    console.log(`📊 Trades for current user (${user.id}): ${userTrades?.length || 0}`);
    
    // Test 4: Check strategies
    console.log('\n📋 Step 4: Checking strategies...');
    const { data: strategies, error: strategiesError } = await supabase
      .from('strategies')
      .select('*')
      .eq('user_id', user.id);
    
    if (strategiesError) {
      console.error('❌ Error fetching strategies:', strategiesError.message);
      return;
    }
    
    console.log(`📋 Strategies for current user: ${strategies?.length || 0}`);
    
    // Test 5: Try to simulate the API call that UI pages make
    console.log('\n📋 Step 5: Simulating UI data fetch...');
    const { data: uiTrades, error: uiTradesError } = await supabase
      .from('trades')
      .select('*')
      .eq('user_id', user.id)
      .order('trade_date', { ascending: false });
    
    if (uiTradesError) {
      console.error('❌ Error in UI-style fetch:', uiTradesError.message);
      return;
    }
    
    console.log(`📊 UI-style fetch result: ${uiTrades?.length || 0} trades`);
    
    // Summary
    console.log('\n📊 === DEBUG SUMMARY ===');
    console.log(`All trades in DB: ${allTrades?.length || 0}`);
    console.log(`Trades for current user: ${userTrades?.length || 0}`);
    console.log(`UI fetch result: ${uiTrades?.length || 0}`);
    console.log(`Strategies for user: ${strategies?.length || 0}`);
    
    if (userTrades?.length !== 100) {
      console.log('\n🚨 ISSUE IDENTIFIED:');
      console.log(`Expected: 100 trades`);
      console.log(`Actual: ${userTrades?.length || 0} trades`);
      console.log(`Missing: ${100 - (userTrades?.length || 0)} trades`);
      
      if (userTrades?.length === 0) {
        console.log('\n💡 HYPOTHESIS: No test data has been generated yet.');
        console.log('   The test data generation process may not have been run.');
        console.log('   Or it failed silently without reporting errors.');
      } else if (userTrades?.length === 30) {
        console.log('\n💡 HYPOTHESIS: Partial data generation or filtering issue.');
        console.log('   Exactly 30 trades suggests a LIMIT clause or batch processing issue.');
      }
    } else {
      console.log('\n✅ Trade count looks correct!');
    }
    
  } catch (error) {
    console.error('❌ Debug script failed:', error.message);
  }
}

debugTradeCount().then(() => {
  console.log('\n✅ Debug investigation completed');
}).catch(console.error);