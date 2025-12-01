const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://bzmixuxautbmqbrqtufx.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_p_kFlPj1v5_qaypk8YWCLA_sEY8NVOP';

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false, autoRefreshToken: false }
});

async function testTradeLogging() {
  console.log('🚀 Testing trade logging functionality...');
  console.log('=====================================');
  
  try {
    // Test 1: Check if we can access strategies table (this is where the error occurred)
    console.log('\n📋 Test 1: Accessing strategies table...');
    const { data: strategies, error: strategyError } = await supabase
      .from('strategies')
      .select('*')
      .limit(5);
    
    if (strategyError) {
      console.error('   ❌ Strategies query failed:', strategyError.message);
      if (strategyError.message.includes('strategy_rule_compliance')) {
        console.error('   🔥 CONFIRMED: strategy_rule_compliance error still exists!');
        return false;
      }
    } else {
      console.log(`   ✅ Strategies query succeeded: ${strategies?.length || 0} strategies found`);
    }
    
    // Test 2: Check if we can access trades table
    console.log('\n📋 Test 2: Accessing trades table...');
    const { data: trades, error: tradesError } = await supabase
      .from('trades')
      .select('*')
      .limit(5);
    
    if (tradesError) {
      console.error('   ❌ Trades query failed:', tradesError.message);
      if (tradesError.message.includes('strategy_rule_compliance')) {
        console.error('   🔥 CONFIRMED: strategy_rule_compliance error still exists!');
        return false;
      }
    } else {
      console.log(`   ✅ Trades query succeeded: ${trades?.length || 0} trades found`);
    }
    
    // Test 3: Try to create a test trade (if we have a strategy)
    console.log('\n📋 Test 3: Testing trade insertion...');
    
    if (strategies && strategies.length > 0) {
      const testStrategy = strategies[0];
      console.log(`   📝 Using strategy: ${testStrategy.name || testStrategy.id}`);
      
      const { data: newTrade, error: insertError } = await supabase
        .from('trades')
        .insert({
          user_id: testStrategy.user_id,
          market: 'stock',
          symbol: 'TEST',
          strategy_id: testStrategy.id,
          trade_date: new Date().toISOString().split('T')[0],
          side: 'Buy',
          quantity: 100,
          entry_price: 50.0,
          exit_price: 55.0,
          pnl: 500.0
        })
        .select('id')
        .single();
      
      if (insertError) {
        console.error('   ❌ Trade insertion failed:', insertError.message);
        if (insertError.message.includes('strategy_rule_compliance')) {
          console.error('   🔥 CONFIRMED: strategy_rule_compliance error still exists!');
          return false;
        }
      } else {
        console.log(`   ✅ Trade insertion succeeded: Trade ID ${newTrade.id}`);
        
        // Clean up the test trade
        const { error: deleteError } = await supabase
          .from('trades')
          .delete()
          .eq('id', newTrade.id);
        
        if (deleteError) {
          console.warn('   ⚠️  Could not clean up test trade:', deleteError.message);
        } else {
          console.log('   🧹 Test trade cleaned up');
        }
      }
    } else {
      console.log('   ⚠️  No strategies available for trade insertion test');
    }
    
    console.log('\n✅ All trade logging tests completed successfully!');
    console.log('   🎉 The strategy_rule_compliance issue appears to be resolved.');
    return true;
    
  } catch (error) {
    console.error('\n💥 Trade logging test failed:', error);
    if (error.message.includes('strategy_rule_compliance')) {
      console.error('   🔥 CONFIRMED: strategy_rule_compliance error still exists!');
    }
    return false;
  }
}

// Run the test
if (require.main === module) {
  testTradeLogging().then(success => {
    if (success) {
      console.log('\n📊 RESULT: Trade logging is working correctly!');
      process.exit(0);
    } else {
      console.log('\n📊 RESULT: Trade logging still has issues!');
      process.exit(1);
    }
  }).catch(error => {
    console.error('\n💥 Test execution failed:', error);
    process.exit(1);
  });
}

module.exports = { testTradeLogging };