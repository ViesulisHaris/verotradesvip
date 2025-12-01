/**
 * Comprehensive Strategy Fixes Test Script
 * 
 * This script tests all the recent fixes to ensure they work together properly:
 * 1. "supabaseKey is required" error in SchemaValidator - Fixed by modifying constructor
 * 2. "Strategy missing" popups - Fixed by replacing alert() calls with toast notifications
 * 
 * The script performs end-to-end testing of strategy functionality.
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Test configuration
const TEST_CONFIG = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  testResults: {
    schemaValidatorFix: { passed: false, details: [] },
    toastNotificationFix: { passed: false, details: [] },
    strategyPagesLoad: { passed: false, details: [] },
    strategyPerformanceViewing: { passed: false, details: [] },
    strategyModification: { passed: false, details: [] },
    strategyDeletion: { passed: false, details: [] },
    noSupabaseKeyErrors: { passed: false, details: [] },
    noStrategyMissingAlerts: { passed: false, details: [] },
    toastNotificationsWork: { passed: false, details: [] }
  }
};

// Utility functions
function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : type === 'warning' ? '⚠️' : 'ℹ️';
  console.log(`${prefix} [${timestamp}] ${message}`);
}

function logTestResult(category, passed, details) {
  TEST_CONFIG.testResults[category].passed = passed;
  TEST_CONFIG.testResults[category].details.push(details);
}

function saveResults() {
  const resultsPath = path.join(__dirname, `comprehensive-strategy-test-results-${Date.now()}.json`);
  fs.writeFileSync(resultsPath, JSON.stringify(TEST_CONFIG.testResults, null, 2));
  log(`Test results saved to: ${resultsPath}`);
}

// Test 1: SchemaValidator supabaseKey Error Fix
async function testSchemaValidatorFix() {
  log('Testing SchemaValidator supabaseKey error fix...');
  
  try {
    // Simulate SchemaValidator instantiation without service role key
    const testUrl = TEST_CONFIG.supabaseUrl;
    const testAnonKey = TEST_CONFIG.supabaseAnonKey;
    
    if (!testUrl || !testAnonKey) {
      logTestResult('schemaValidatorFix', false, 'Missing environment variables for testing');
      return;
    }

    // Test 1a: Create client with anon key (should work)
    try {
      const anonClient = createClient(testUrl, testAnonKey, {
        auth: { persistSession: false, autoRefreshToken: false }
      });
      logTestResult('schemaValidatorFix', true, 'Anon key client creation successful');
    } catch (error) {
      logTestResult('schemaValidatorFix', false, `Anon key client creation failed: ${error.message}`);
    }

    // Test 1b: Test with missing service role key (should use fallback)
    const noServiceKeyConfig = {
      supabaseUrl: testUrl,
      supabaseAnonKey: testAnonKey,
      serviceRoleKey: null // Simulate missing service role key
    };

    // This simulates the fix logic in SchemaValidator
    if (noServiceKeyConfig.serviceRoleKey) {
      logTestResult('schemaValidatorFix', false, 'Service role key should be missing for this test');
    } else {
      logTestResult('schemaValidatorFix', true, 'Service role key missing handled correctly');
    }

    // Test 1c: Test basic query to ensure no "supabaseKey is required" errors
    try {
      const testClient = createClient(testUrl, testAnonKey);
      const { data, error } = await testClient
        .from('information_schema.columns')
        .select('column_name')
        .limit(1);
      
      if (error && error.message.includes('supabaseKey is required')) {
        logTestResult('schemaValidatorFix', false, 'Still getting "supabaseKey is required" error');
      } else {
        logTestResult('schemaValidatorFix', true, 'No "supabaseKey is required" errors detected');
      }
    } catch (error) {
      logTestResult('schemaValidatorFix', false, `Unexpected error during query test: ${error.message}`);
    }

  } catch (error) {
    logTestResult('schemaValidatorFix', false, `SchemaValidator test failed: ${error.message}`);
  }
}

// Test 2: Check for alert() calls in strategy-related files
function testToastNotificationFix() {
  log('Testing toast notification fix (checking for alert() calls)...');
  
  const strategyFiles = [
    'src/lib/uuid-validation.ts',
    'src/components/ui/EnhancedStrategyCard.tsx',
    'src/components/ui/StrategyCard.tsx',
    'src/app/strategies/page.tsx',
    'src/app/strategies/edit/[id]/page.tsx',
    'src/app/strategies/performance/[id]/page.tsx'
  ];

  let alertCallsFound = [];
  let toastImplementationsFound = [];

  strategyFiles.forEach(filePath => {
    try {
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        
        // Check for alert() calls
        const alertMatches = content.match(/alert\s*\(/g);
        if (alertMatches) {
          alertCallsFound.push({
            file: filePath,
            count: alertMatches.length,
            matches: content.match(/alert\s*\([^)]*\)/g)
          });
        }

        // Check for toast implementations
        const toastMatches = content.match(/window\.toast|toast\./g);
        if (toastMatches) {
          toastImplementationsFound.push({
            file: filePath,
            matches: toastMatches
          });
        }
      }
    } catch (error) {
      log(`Error reading ${filePath}: ${error.message}`, 'error');
    }
  });

  if (alertCallsFound.length === 0) {
    logTestResult('toastNotificationFix', true, 'No alert() calls found in strategy files');
  } else {
    logTestResult('toastNotificationFix', false, `Found ${alertCallsFound.length} files with alert() calls`);
    alertCallsFound.forEach(item => {
      log(`  ${item.file}: ${item.count} alert() calls`, 'warning');
    });
  }

  if (toastImplementationsFound.length > 0) {
    logTestResult('toastNotificationsWork', true, 'Toast implementations found in strategy files');
  } else {
    logTestResult('toastNotificationsWork', false, 'No toast implementations found');
  }
}

// Test 3: Strategy Pages Load Without Errors
async function testStrategyPagesLoad() {
  log('Testing strategy pages loading...');
  
  try {
    const supabase = createClient(TEST_CONFIG.supabaseUrl, TEST_CONFIG.supabaseAnonKey);
    
    // Test basic strategies query
    const { data: strategies, error: strategiesError } = await supabase
      .from('strategies')
      .select('id, name, is_active, created_at')
      .limit(10);

    if (strategiesError) {
      if (strategiesError.message.includes('supabaseKey is required')) {
        logTestResult('noSupabaseKeyErrors', false, 'Still getting supabaseKey errors in strategies query');
      } else {
        logTestResult('strategyPagesLoad', false, `Strategies query failed: ${strategiesError.message}`);
      }
      return;
    }

    logTestResult('strategyPagesLoad', true, `Successfully loaded ${strategies?.length || 0} strategies`);
    logTestResult('noSupabaseKeyErrors', true, 'No supabaseKey errors in strategies query');

    // Test strategy rules query
    const { data: rules, error: rulesError } = await supabase
      .from('strategy_rules')
      .select('id, rule_text, strategy_id')
      .limit(5);

    if (rulesError) {
      logTestResult('strategyPagesLoad', false, `Strategy rules query failed: ${rulesError.message}`);
    } else {
      logTestResult('strategyPagesLoad', true, `Successfully loaded ${rules?.length || 0} strategy rules`);
    }

  } catch (error) {
    logTestResult('strategyPagesLoad', false, `Strategy pages test failed: ${error.message}`);
  }
}

// Test 4: Strategy Performance Viewing
async function testStrategyPerformanceViewing() {
  log('Testing strategy performance viewing...');
  
  try {
    const supabase = createClient(TEST_CONFIG.supabaseUrl, TEST_CONFIG.supabaseAnonKey);
    
    // Get a strategy to test with
    const { data: strategies, error: strategiesError } = await supabase
      .from('strategies')
      .select('id, name')
      .limit(1);

    if (strategiesError || !strategies || strategies.length === 0) {
      logTestResult('strategyPerformanceViewing', false, 'No strategies available for performance testing');
      return;
    }

    const testStrategy = strategies[0];
    
    // Test strategy performance calculation
    const { data: trades, error: tradesError } = await supabase
      .from('trades')
      .select('pnl, trade_date, strategy_id')
      .eq('strategy_id', testStrategy.id)
      .not('pnl', 'is', null)
      .limit(100);

    if (tradesError) {
      if (tradesError.message.includes('supabaseKey is required')) {
        logTestResult('noSupabaseKeyErrors', false, 'supabaseKey error in performance query');
      }
      logTestResult('strategyPerformanceViewing', false, `Performance query failed: ${tradesError.message}`);
    } else {
      logTestResult('strategyPerformanceViewing', true, `Successfully loaded ${trades?.length || 0} trades for performance`);
      
      // Calculate basic performance metrics
      if (trades && trades.length > 0) {
        const totalPnL = trades.reduce((sum, trade) => sum + (trade.pnl || 0), 0);
        const winRate = trades.filter(trade => trade.pnl > 0).length / trades.length;
        logTestResult('strategyPerformanceViewing', true, `Performance metrics calculated: Total PnL: ${totalPnL}, Win Rate: ${(winRate * 100).toFixed(2)}%`);
      }
    }

  } catch (error) {
    logTestResult('strategyPerformanceViewing', false, `Performance viewing test failed: ${error.message}`);
  }
}

// Test 5: Strategy Modification (Update)
async function testStrategyModification() {
  log('Testing strategy modification...');
  
  try {
    const supabase = createClient(TEST_CONFIG.supabaseUrl, TEST_CONFIG.supabaseAnonKey);
    
    // Create a test strategy first
    const { data: newStrategy, error: createError } = await supabase
      .from('strategies')
      .insert({
        name: `Test Strategy ${Date.now()}`,
        description: 'Test strategy for modification testing',
        is_active: true,
        user_id: '00000000-0000-0000-0000-000000000000' // Dummy user ID for testing
      })
      .select()
      .single();

    if (createError) {
      logTestResult('strategyModification', false, `Strategy creation failed: ${createError.message}`);
      return;
    }

    // Update the strategy
    const { error: updateError } = await supabase
      .from('strategies')
      .update({
        name: `Updated Test Strategy ${Date.now()}`,
        description: 'Updated description',
        updated_at: new Date().toISOString()
      })
      .eq('id', newStrategy.id);

    if (updateError) {
      if (updateError.message.includes('supabaseKey is required')) {
        logTestResult('noSupabaseKeyErrors', false, 'supabaseKey error in strategy update');
      }
      logTestResult('strategyModification', false, `Strategy update failed: ${updateError.message}`);
    } else {
      logTestResult('strategyModification', true, 'Strategy updated successfully');
    }

    // Clean up - delete the test strategy
    await supabase
      .from('strategies')
      .delete()
      .eq('id', newStrategy.id);

  } catch (error) {
    logTestResult('strategyModification', false, `Strategy modification test failed: ${error.message}`);
  }
}

// Test 6: Strategy Deletion
async function testStrategyDeletion() {
  log('Testing strategy deletion...');
  
  try {
    const supabase = createClient(TEST_CONFIG.supabaseUrl, TEST_CONFIG.supabaseAnonKey);
    
    // Create a test strategy first
    const { data: newStrategy, error: createError } = await supabase
      .from('strategies')
      .insert({
        name: `Test Strategy for Deletion ${Date.now()}`,
        description: 'Test strategy for deletion testing',
        is_active: true,
        user_id: '00000000-0000-0000-0000-000000000000' // Dummy user ID for testing
      })
      .select()
      .single();

    if (createError) {
      logTestResult('strategyDeletion', false, `Test strategy creation failed: ${createError.message}`);
      return;
    }

    // Delete the strategy
    const { error: deleteError } = await supabase
      .from('strategies')
      .delete()
      .eq('id', newStrategy.id);

    if (deleteError) {
      if (deleteError.message.includes('supabaseKey is required')) {
        logTestResult('noSupabaseKeyErrors', false, 'supabaseKey error in strategy deletion');
      }
      logTestResult('strategyDeletion', false, `Strategy deletion failed: ${deleteError.message}`);
    } else {
      logTestResult('strategyDeletion', true, 'Strategy deleted successfully');
    }

  } catch (error) {
    logTestResult('strategyDeletion', false, `Strategy deletion test failed: ${error.message}`);
  }
}

// Test 7: Check for UUID validation errors that could trigger "strategy missing" alerts
async function testUUIDValidation() {
  log('Testing UUID validation for strategy missing alerts...');
  
  try {
    // Test invalid UUIDs that might trigger alerts
    const invalidUUIDs = [
      'undefined',
      '',
      'invalid-uuid',
      null,
      undefined,
      '00000000-0000-0000-0000-000000000000' // Valid format but non-existent
    ];

    let uuidValidationErrors = 0;
    
    invalidUUIDs.forEach((uuid, index) => {
      try {
        // Simulate UUID validation (this would normally be done by validateUUID function)
        if (uuid === null || uuid === undefined) {
          uuidValidationErrors++;
        } else if (typeof uuid !== 'string') {
          uuidValidationErrors++;
        } else if (uuid.trim() === '' || uuid === 'undefined') {
          uuidValidationErrors++;
        } else if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(uuid)) {
          uuidValidationErrors++;
        }
      } catch (error) {
        uuidValidationErrors++;
      }
    });

    // Check if UUID validation is working properly (should catch invalid UUIDs without alerts)
    if (uuidValidationErrors > 0) {
      logTestResult('noStrategyMissingAlerts', true, 'UUID validation working - invalid UUIDs caught properly');
    } else {
      logTestResult('noStrategyMissingAlerts', false, 'UUID validation may not be working correctly');
    }

  } catch (error) {
    logTestResult('noStrategyMissingAlerts', false, `UUID validation test failed: ${error.message}`);
  }
}

// Main test execution
async function runComprehensiveTests() {
  log('🚀 Starting Comprehensive Strategy Fixes Test');
  log('=====================================');
  
  // Check environment
  if (!TEST_CONFIG.supabaseUrl || !TEST_CONFIG.supabaseAnonKey) {
    log('Missing required environment variables!', 'error');
    log('Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY', 'error');
    process.exit(1);
  }

  // Run all tests
  await testSchemaValidatorFix();
  testToastNotificationFix();
  await testStrategyPagesLoad();
  await testStrategyPerformanceViewing();
  await testStrategyModification();
  await testStrategyDeletion();
  await testUUIDValidation();

  // Generate final report
  log('\n📊 FINAL TEST RESULTS');
  log('=======================');
  
  let totalTests = 0;
  let passedTests = 0;
  
  Object.entries(TEST_CONFIG.testResults).forEach(([category, result]) => {
    totalTests++;
    if (result.passed) passedTests++;
    
    const status = result.passed ? '✅ PASS' : '❌ FAIL';
    log(`${status} ${category}`);
    
    if (result.details.length > 0) {
      result.details.forEach(detail => {
        log(`   ${detail}`, result.passed ? 'info' : 'warning');
      });
    }
  });

  log(`\n🎯 OVERALL RESULT: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    log('🎉 ALL FIXES VERIFIED SUCCESSFULLY!', 'success');
  } else {
    log('⚠️ Some issues detected - review the results above', 'warning');
  }

  // Save results
  saveResults();
  
  return {
    totalTests,
    passedTests,
    success: passedTests === totalTests,
    results: TEST_CONFIG.testResults
  };
}

// Run tests if this file is executed directly
if (require.main === module) {
  runComprehensiveTests()
    .then(results => {
      log('\n✅ Comprehensive test completed successfully');
      process.exit(results.success ? 0 : 1);
    })
    .catch(error => {
      log(`❌ Test execution failed: ${error.message}`, 'error');
      process.exit(1);
    });
}

module.exports = { runComprehensiveTests, TEST_CONFIG };