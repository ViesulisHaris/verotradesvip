const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testDeletedTableFix() {
  console.log('🚀 Testing deleted table fix...\n');

  // Test 1: Verify the deleted table doesn't exist
  console.log('Test 1: Verifying strategy_rule_compliance table does not exist...');
  try {
    const { data, error } = await supabase
      .from('strategy_rule_compliance')
      .select('*')
      .limit(1);
    
    if (error) {
      console.log('✅ Test 1 PASSED: Table correctly returns error:', error.message);
    } else {
      console.log('❌ Test 1 FAILED: Table should not exist but returned data:', data);
    }
  } catch (err) {
    console.log('✅ Test 1 PASSED: Exception thrown as expected:', err.message);
  }

  // Test 2: Test strategies query (most likely to be affected)
  console.log('\nTest 2: Testing strategies query...');
  try {
    const { data, error } = await supabase
      .from('strategies')
      .select('*')
      .limit(5);
    
    if (error) {
      if (error.message.includes('strategy_rule_compliance') ||
          error.message.includes('compliance_table') ||
          error.message.includes('rule_compliance')) {
        console.log('❌ Test 2 FAILED: Still getting deleted table error:', error.message);
      } else {
        console.log('❌ Test 2 FAILED: Different error occurred:', error.message);
      }
    } else {
      console.log('✅ Test 2 PASSED: Strategies query works correctly');
      console.log(`   Retrieved ${data.length} strategies`);
    }
  } catch (err) {
    console.log('❌ Test 2 FAILED: Exception occurred:', err.message);
  }

  // Test 3: Test complex join query
  console.log('\nTest 3: Testing complex join query...');
  try {
    const { data, error } = await supabase
      .from('strategies')
      .select(`
        *,
        trades:trades(count),
        strategy_rules:strategy_rules(count)
      `)
      .limit(5);
    
    if (error) {
      if (error.message.includes('strategy_rule_compliance') ||
          error.message.includes('compliance_table') ||
          error.message.includes('rule_compliance')) {
        console.log('❌ Test 3 FAILED: Still getting deleted table error:', error.message);
      } else {
        console.log('❌ Test 3 FAILED: Different error occurred:', error.message);
      }
    } else {
      console.log('✅ Test 3 PASSED: Complex join query works correctly');
      console.log(`   Retrieved ${data.length} strategies with counts`);
    }
  } catch (err) {
    console.log('❌ Test 3 FAILED: Exception occurred:', err.message);
  }

  // Test 4: Test trade logging functionality
  console.log('\nTest 4: Testing trade logging functionality...');
  try {
    // First get a strategy to use
    const { data: strategies, error: strategyError } = await supabase
      .from('strategies')
      .select('id')
      .limit(1);
    
    if (strategyError) {
      console.log('❌ Test 4 FAILED: Could not fetch strategies:', strategyError.message);
      return;
    }
    
    if (!strategies || strategies.length === 0) {
      console.log('❌ Test 4 FAILED: No strategies found');
      return;
    }
    
    const strategyId = strategies[0].id;
    
    // Test inserting a trade
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
      if (tradeError.message.includes('strategy_rule_compliance')) {
        console.log('❌ Test 4 FAILED: Still getting strategy_rule_compliance error:', tradeError.message);
      } else {
        console.log('❌ Test 4 FAILED: Different error occurred:', tradeError.message);
      }
    } else {
      console.log('✅ Test 4 PASSED: Trade logging works correctly');
      console.log(`   Successfully created trade with ID: ${tradeData[0].id}`);
      
      // Clean up the test trade
      await supabase
        .from('trades')
        .delete()
        .eq('id', tradeData[0].id);
    }
  } catch (err) {
    console.log('❌ Test 4 FAILED: Exception occurred:', err.message);
  }

  console.log('\n🏁 Testing complete!');
}

testDeletedTableFix().catch(console.error);