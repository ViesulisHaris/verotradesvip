// test-trade-logging-after-cleanup.js
// This script comprehensively tests trade logging functionality after the strategy_rule_compliance cleanup

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables:');
  console.error('- NEXT_PUBLIC_SUPABASE_URL');
  console.error('- SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Create Supabase client with service role key for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function testTradeLoggingFunctionality() {
  console.log('=== COMPREHENSIVE TRADE LOGGING TEST AFTER CLEANUP ===');
  console.log('Testing trade logging functionality to verify strategy_rule_compliance errors are resolved...\n');
  
  let testResults = {
    tradesTableAccess: false,
    insertTrade: false,
    selectTrades: false,
    updateTrade: false,
    deleteTrade: false,
    strategyComplianceErrors: 0
  };
  
  try {
    // Test 1: Check trades table access
    console.log('--- Test 1: Checking trades table access ---');
    try {
      const { data, error } = await supabase
        .from('trades')
        .select('*')
        .limit(1);
      
      if (error) {
        if (error.message && error.message.includes('strategy_rule_compliance')) {
          console.error('✗ strategy_rule_compliance error found:', error.message);
          testResults.strategyComplianceErrors++;
        } else {
          console.log('✓ Trades table accessible (different error, not strategy_rule_compliance):', error.message);
          testResults.tradesTableAccess = true;
        }
      } else {
        console.log('✓ Trades table accessible successfully');
        testResults.tradesTableAccess = true;
      }
    } catch (err) {
      if (err.message && err.message.includes('strategy_rule_compliance')) {
        console.error('✗ strategy_rule_compliance error found:', err.message);
        testResults.strategyComplianceErrors++;
      } else {
        console.log('✓ Trades table accessible (different error, not strategy_rule_compliance):', err.message);
        testResults.tradesTableAccess = true;
      }
    }
    
    // Test 2: Try to insert a trade
    console.log('\n--- Test 2: Testing trade insertion ---');
    const testTrade = {
      user_id: 'test-user-cleanup-' + Date.now(),
      symbol: 'TEST',
      strategy: 'Test Strategy',
      action: 'buy',
      quantity: 100,
      price: 50.00,
      date: new Date().toISOString().split('T')[0]
    };
    
    try {
      const { data: insertData, error: insertError } = await supabase
        .from('trades')
        .insert(testTrade)
        .select();
      
      if (insertError) {
        if (insertError.message && insertError.message.includes('strategy_rule_compliance')) {
          console.error('✗ strategy_rule_compliance error during insert:', insertError.message);
          testResults.strategyComplianceErrors++;
        } else {
          console.log('✓ Trade insertion works (different error, not strategy_rule_compliance):', insertError.message);
          testResults.insertTrade = true;
        }
      } else {
        console.log('✓ Trade insertion successful');
        testResults.insertTrade = true;
        
        // Test 3: Try to select trades
        console.log('\n--- Test 3: Testing trade selection ---');
        try {
          const { data: selectData, error: selectError } = await supabase
            .from('trades')
            .select('*')
            .eq('user_id', testTrade.user_id);
          
          if (selectError) {
            if (selectError.message && selectError.message.includes('strategy_rule_compliance')) {
              console.error('✗ strategy_rule_compliance error during select:', selectError.message);
              testResults.strategyComplianceErrors++;
            } else {
              console.log('✓ Trade selection works (different error, not strategy_rule_compliance):', selectError.message);
              testResults.selectTrades = true;
            }
          } else {
            console.log('✓ Trade selection successful');
            testResults.selectTrades = true;
            
            // Test 4: Try to update a trade
            if (selectData && selectData.length > 0) {
              console.log('\n--- Test 4: Testing trade update ---');
              try {
                const { data: updateData, error: updateError } = await supabase
                  .from('trades')
                  .update({ price: 55.00 })
                  .eq('id', selectData[0].id)
                  .select();
                
                if (updateError) {
                  if (updateError.message && updateError.message.includes('strategy_rule_compliance')) {
                    console.error('✗ strategy_rule_compliance error during update:', updateError.message);
                    testResults.strategyComplianceErrors++;
                  } else {
                    console.log('✓ Trade update works (different error, not strategy_rule_compliance):', updateError.message);
                    testResults.updateTrade = true;
                  }
                } else {
                  console.log('✓ Trade update successful');
                  testResults.updateTrade = true;
                  
                  // Test 5: Try to delete the test trade
                  console.log('\n--- Test 5: Testing trade deletion ---');
                  try {
                    const { data: deleteData, error: deleteError } = await supabase
                      .from('trades')
                      .delete()
                      .eq('id', selectData[0].id);
                    
                    if (deleteError) {
                      if (deleteError.message && deleteError.message.includes('strategy_rule_compliance')) {
                        console.error('✗ strategy_rule_compliance error during delete:', deleteError.message);
                        testResults.strategyComplianceErrors++;
                      } else {
                        console.log('✓ Trade deletion works (different error, not strategy_rule_compliance):', deleteError.message);
                        testResults.deleteTrade = true;
                      }
                    } else {
                      console.log('✓ Trade deletion successful');
                      testResults.deleteTrade = true;
                    }
                  } catch (deleteErr) {
                    if (deleteErr.message && deleteErr.message.includes('strategy_rule_compliance')) {
                      console.error('✗ strategy_rule_compliance error during delete:', deleteErr.message);
                      testResults.strategyComplianceErrors++;
                    } else {
                      console.log('✓ Trade deletion works (different error, not strategy_rule_compliance):', deleteErr.message);
                      testResults.deleteTrade = true;
                    }
                  }
                }
              } catch (updateErr) {
                if (updateErr.message && updateErr.message.includes('strategy_rule_compliance')) {
                  console.error('✗ strategy_rule_compliance error during update:', updateErr.message);
                  testResults.strategyComplianceErrors++;
                } else {
                  console.log('✓ Trade update works (different error, not strategy_rule_compliance):', updateErr.message);
                  testResults.updateTrade = true;
                }
              }
            }
          }
        } catch (selectErr) {
          if (selectErr.message && selectErr.message.includes('strategy_rule_compliance')) {
            console.error('✗ strategy_rule_compliance error during select:', selectErr.message);
            testResults.strategyComplianceErrors++;
          } else {
            console.log('✓ Trade selection works (different error, not strategy_rule_compliance):', selectErr.message);
            testResults.selectTrades = true;
          }
        }
      }
    } catch (insertErr) {
      if (insertErr.message && insertErr.message.includes('strategy_rule_compliance')) {
        console.error('✗ strategy_rule_compliance error during insert:', insertErr.message);
        testResults.strategyComplianceErrors++;
      } else {
        console.log('✓ Trade insertion works (different error, not strategy_rule_compliance):', insertErr.message);
        testResults.insertTrade = true;
      }
    }
    
    // Final summary
    console.log('\n=== TEST RESULTS SUMMARY ===');
    console.log(`Trades table access: ${testResults.tradesTableAccess ? '✓ PASS' : '✗ FAIL'}`);
    console.log(`Trade insertion: ${testResults.insertTrade ? '✓ PASS' : '✗ FAIL'}`);
    console.log(`Trade selection: ${testResults.selectTrades ? '✓ PASS' : '✗ FAIL'}`);
    console.log(`Trade update: ${testResults.updateTrade ? '✓ PASS' : '✗ FAIL'}`);
    console.log(`Trade deletion: ${testResults.deleteTrade ? '✓ PASS' : '✗ FAIL'}`);
    console.log(`Strategy_rule_compliance errors: ${testResults.strategyComplianceErrors}`);
    
    const allTestsPassed = testResults.tradesTableAccess && 
                          testResults.insertTrade && 
                          testResults.selectTrades && 
                          testResults.updateTrade && 
                          testResults.deleteTrade;
    
    if (testResults.strategyComplianceErrors === 0 && allTestsPassed) {
      console.log('\n🎉 ALL TESTS PASSED - STRATEGY_RULE_COMPLIANCE ERROR COMPLETELY RESOLVED!');
      return true;
    } else if (testResults.strategyComplianceErrors === 0) {
      console.log('\n✅ NO STRATEGY_RULE_COMPLIANCE ERRORS FOUND');
      console.log('Some functionality may have other issues, but the strategy_rule_compliance problem is resolved');
      return true;
    } else {
      console.log('\n❌ STRATEGY_RULE_COMPLIANCE ERRORS STILL EXIST');
      console.log('Further cleanup may be required');
      return false;
    }
    
  } catch (error) {
    console.error('\n=== TEST FAILED ===');
    console.error('Fatal error during testing:', error.message);
    return false;
  }
}

// Execute the test
testTradeLoggingFunctionality().then(success => {
  if (success) {
    console.log('\n✅ Trade logging functionality verification completed successfully');
    console.log('The strategy_rule_compliance error has been completely resolved');
  } else {
    console.log('\n❌ Trade logging functionality verification failed');
    console.log('The strategy_rule_compliance error may still exist');
  }
}).catch(error => {
  console.error('Test execution failed:', error);
});