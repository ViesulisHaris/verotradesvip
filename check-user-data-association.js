const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function checkUserDataAssociation() {
  console.log('🔍 [DIAGNOSIS] Checking user data association...');
  
  // Initialize Supabase client
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ [DIAGNOSIS] Missing environment variables');
    return;
  }
  
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  
  try {
    // 1. Check if we can authenticate as testuser@verotrade.com
    console.log('\n🔍 [STEP 1] Checking authentication for testuser@verotrade.com...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'testuser@verotrade.com',
      password: 'TestPassword123!'
    });
    
    if (authError) {
      console.error('❌ [STEP 1] Authentication failed:', authError.message);
      return;
    }
    
    const authenticatedUserId = authData.user.id;
    console.log('✅ [STEP 1] Authentication successful');
    console.log(`📋 [STEP 1] Authenticated User ID: ${authenticatedUserId}`);
    console.log(`📋 [STEP 1] Authenticated User Email: ${authData.user.email}`);
    
    // 2. Check all trades in the database
    console.log('\n🔍 [STEP 2] Checking all trades in database...');
    const { data: allTrades, error: allTradesError } = await supabase
      .from('trades')
      .select('id, user_id, symbol, pnl, created_at');
    
    if (allTradesError) {
      console.error('❌ [STEP 2] Error fetching all trades:', allTradesError.message);
      return;
    }
    
    console.log(`📊 [STEP 2] Total trades in database: ${allTrades.length}`);
    
    if (allTrades.length > 0) {
      // Group trades by user_id
      const tradesByUser = {};
      allTrades.forEach(trade => {
        if (!tradesByUser[trade.user_id]) {
          tradesByUser[trade.user_id] = [];
        }
        tradesByUser[trade.user_id].push(trade);
      });
      
      console.log('\n📊 [STEP 2] Trades distribution by user:');
      Object.entries(tradesByUser).forEach(([userId, trades]) => {
        console.log(`  User ID: ${userId}`);
        console.log(`  Trade Count: ${trades.length}`);
        console.log(`  Sample Symbols: ${trades.slice(0, 3).map(t => t.symbol).join(', ')}`);
        console.log(`  Total P&L: $${trades.reduce((sum, t) => sum + (t.pnl || 0), 0).toFixed(2)}`);
        console.log('  ---');
      });
    }
    
    // 3. Check trades for authenticated user
    console.log('\n🔍 [STEP 3] Checking trades for authenticated user...');
    const { data: userTrades, error: userTradesError } = await supabase
      .from('trades')
      .select('id, symbol, pnl, created_at')
      .eq('user_id', authenticatedUserId);
    
    if (userTradesError) {
      console.error('❌ [STEP 3] Error fetching user trades:', userTradesError.message);
      return;
    }
    
    console.log(`📊 [STEP 3] Trades for authenticated user: ${userTrades.length}`);
    
    // 4. Check all strategies
    console.log('\n🔍 [STEP 4] Checking all strategies in database...');
    const { data: allStrategies, error: allStrategiesError } = await supabase
      .from('strategies')
      .select('id, user_id, name, is_active');
    
    if (allStrategiesError) {
      console.error('❌ [STEP 4] Error fetching all strategies:', allStrategiesError.message);
      return;
    }
    
    console.log(`📊 [STEP 4] Total strategies in database: ${allStrategies.length}`);
    
    if (allStrategies.length > 0) {
      // Group strategies by user_id
      const strategiesByUser = {};
      allStrategies.forEach(strategy => {
        if (!strategiesByUser[strategy.user_id]) {
          strategiesByUser[strategy.user_id] = [];
        }
        strategiesByUser[strategy.user_id].push(strategy);
      });
      
      console.log('\n📊 [STEP 4] Strategies distribution by user:');
      Object.entries(strategiesByUser).forEach(([userId, strategies]) => {
        console.log(`  User ID: ${userId}`);
        console.log(`  Strategy Count: ${strategies.length}`);
        console.log(`  Strategy Names: ${strategies.map(s => s.name).join(', ')}`);
        console.log('  ---');
      });
    }
    
    // 5. Check strategies for authenticated user
    console.log('\n🔍 [STEP 5] Checking strategies for authenticated user...');
    const { data: userStrategies, error: userStrategiesError } = await supabase
      .from('strategies')
      .select('id, name, is_active')
      .eq('user_id', authenticatedUserId);
    
    if (userStrategiesError) {
      console.error('❌ [STEP 5] Error fetching user strategies:', userStrategiesError.message);
      return;
    }
    
    console.log(`📊 [STEP 5] Strategies for authenticated user: ${userStrategies.length}`);
    
    // 6. Diagnosis
    console.log('\n🔍 [DIAGNOSIS] SUMMARY:');
    console.log(`✅ Authenticated User ID: ${authenticatedUserId}`);
    console.log(`📊 Total trades in DB: ${allTrades.length}`);
    console.log(`📊 Trades for authenticated user: ${userTrades.length}`);
    console.log(`📊 Total strategies in DB: ${allStrategies.length}`);
    console.log(`📊 Strategies for authenticated user: ${userStrategies.length}`);
    
    if (allTrades.length > 0 && userTrades.length === 0) {
      console.log('\n🚨 [PROBLEM DETECTED] There are trades in the database but NONE are associated with the authenticated user!');
      console.log('🔧 [SOLUTION] The trades are likely associated with a different user ID than the authenticated testuser@verotrade.com');
      
      // Find the user ID that has trades
      const tradesByUser = {};
      allTrades.forEach(trade => {
        if (!tradesByUser[trade.user_id]) {
          tradesByUser[trade.user_id] = [];
        }
        tradesByUser[trade.user_id].push(trade);
      });
      
      const userWithTrades = Object.keys(tradesByUser);
      if (userWithTrades.length > 0) {
        console.log(`🎯 [TARGET] User ID with trades: ${userWithTrades[0]}`);
        console.log(`🔄 [ACTION] Need to update trades from user_id=${userWithTrades[0]} to user_id=${authenticatedUserId}`);
      }
    } else if (userTrades.length > 0) {
      console.log('\n✅ [NO PROBLEM] Authenticated user has trades. The issue might be elsewhere.');
    } else {
      console.log('\n📝 [INFO] No trades found in database at all.');
    }
    
  } catch (error) {
    console.error('❌ [DIAGNOSIS] Unexpected error:', error);
  }
}

checkUserDataAssociation();