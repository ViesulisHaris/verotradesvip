const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testTradeLoggingWithoutStrategies() {
  console.log('🚀 Testing trade logging functionality without requiring existing strategies...\n');

  // Test 1: Create a test strategy first
  console.log('Test 1: Creating a test strategy...');
  try {
    const testStrategy = {
      name: 'Test Strategy for Trade Logging',
      description: 'Temporary strategy for testing trade logging functionality',
      is_active: true
    };
    
    const { data: strategyData, error: strategyError } = await supabase
      .from('strategies')
      .insert(testStrategy)
      .select();
    
    if (strategyError) {
      console.log('❌ Test 1 FAILED: Could not create test strategy:', strategyError.message);
      if (strategyError.message.includes('strategy_rule_compliance')) {
        console.log('   This indicates the strategy_rule_compliance error is still present!');
      }
      return;
    }
    
    const strategyId = strategyData[0].id;
    console.log('✅ Test 1 PASSED: Created test strategy with ID:', strategyId);
    
    // Test 2: Test trade logging with the created strategy
    console.log('\nTest 2: Testing trade logging...');
    try {
      const testTrade = {
        strategy_id: strategyId,
        symbol: 'TEST',
        entry_price: 100,
        exit_price: 110,
        quantity: 10,
        entry_date: new Date().toISOString(),
        exit_date: new Date().toISOString(),
        status: 'completed',
        profit_loss: 100
      };
      
      const { data: tradeData, error: tradeError } = await supabase
        .from('trades')
        .insert(testTrade)
        .select();
      
      if (tradeError) {
        console.log('❌ Test 2 FAILED: Could not create trade:', tradeError.message);
        if (tradeError.message.includes('strategy_rule_compliance')) {
          console.log('   This indicates the strategy_rule_compliance error is still present!');
        }
      } else {
        console.log('✅ Test 2 PASSED: Successfully created trade with ID:', tradeData[0].id);
        
        // Test 3: Query trades to verify they can be retrieved
        console.log('\nTest 3: Testing trade retrieval...');
        try {
          const { data: retrievedTrades, error: retrieveError } = await supabase
            .from('trades')
            .select(`
              *,
              strategies:strategy_id (
                name,
                description
              )
            `)
            .eq('id', tradeData[0].id);
          
          if (retrieveError) {
            console.log('❌ Test 3 FAILED: Could not retrieve trade:', retrieveError.message);
            if (retrieveError.message.includes('strategy_rule_compliance')) {
              console.log('   This indicates the strategy_rule_compliance error is still present!');
            }
          } else {
            console.log('✅ Test 3 PASSED: Successfully retrieved trade with strategy info');
            console.log(`   Trade: ${retrievedTrades[0].symbol}, Strategy: ${retrievedTrades[0].strategies.name}`);
          }
        } catch (err) {
          console.log('❌ Test 3 FAILED: Exception occurred:', err.message);
        }
        
        // Clean up: Delete the test trade
        await supabase
          .from('trades')
          .delete()
          .eq('id', tradeData[0].id);
      }
    } catch (err) {
      console.log('❌ Test 2 FAILED: Exception occurred:', err.message);
    }
    
    // Clean up: Delete the test strategy
    await supabase
      .from('strategies')
      .delete()
      .eq('id', strategyId);
    
  } catch (err) {
    console.log('❌ Test 1 FAILED: Exception occurred:', err.message);
  }

  console.log('\n🏁 Trade logging testing complete!');
}

testTradeLoggingWithoutStrategies().catch(console.error);