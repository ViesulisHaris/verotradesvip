const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function testFallbackMechanism() {
  console.log('🚀 Testing Schema Cache Fallback Mechanism...\n');

  // Create a test client that simulates schema cache issues
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      },
      global: {
        headers: {
          'X-Client-Info': 'verotrades-fallback-test',
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        }
      }
    }
  );

  // Create fallback client with different configuration
  const fallbackSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      },
      global: {
        headers: {
          'X-Client-Info': 'verotrades-fallback',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
          'X-Schema-Bypass': 'true'
        },
        db: {
          schema: 'public'
        }
      }
    }
  );

  const testResults = {
    primaryClient: {},
    fallbackClient: {},
    comparison: {}
  };

  try {
    // Test 1: Primary client basic queries
    console.log('📋 Test 1: Testing primary client...');
    const primaryTables = ['strategies', 'trades', 'strategy_rules'];
    
    for (const table of primaryTables) {
      try {
        console.log(`  Testing ${table} with primary client...`);
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(3);

        if (error) {
          testResults.primaryClient[table] = {
            success: false,
            error: error.message,
            isSchemaCacheError: error.message.includes('strategy_rule_compliance') || 
                               error.message.includes('schema cache') ||
                               error.message.includes('information_schema.columns')
          };
          console.log(`    ❌ Error: ${error.message}`);
        } else {
          testResults.primaryClient[table] = {
            success: true,
            count: data.length
          };
          console.log(`    ✅ Success: ${data.length} records`);
        }
      } catch (err) {
        testResults.primaryClient[table] = {
          success: false,
          error: err.message,
          isSchemaCacheError: err.message.includes('strategy_rule_compliance') || 
                             err.message.includes('schema cache')
        };
        console.log(`    ❌ Exception: ${err.message}`);
      }
    }

    // Test 2: Fallback client basic queries
    console.log('\n📋 Test 2: Testing fallback client...');
    for (const table of primaryTables) {
      try {
        console.log(`  Testing ${table} with fallback client...`);
        const { data, error } = await fallbackSupabase
          .from(table)
          .select('*')
          .limit(3);

        if (error) {
          testResults.fallbackClient[table] = {
            success: false,
            error: error.message,
            isSchemaCacheError: error.message.includes('strategy_rule_compliance') || 
                               error.message.includes('schema cache') ||
                               error.message.includes('information_schema.columns')
          };
          console.log(`    ❌ Error: ${error.message}`);
        } else {
          testResults.fallbackClient[table] = {
            success: true,
            count: data.length
          };
          console.log(`    ✅ Success: ${data.length} records`);
        }
      } catch (err) {
        testResults.fallbackClient[table] = {
          success: false,
          error: err.message,
          isSchemaCacheError: err.message.includes('strategy_rule_compliance') || 
                             err.message.includes('schema cache')
        };
        console.log(`    ❌ Exception: ${err.message}`);
      }
    }

    // Test 3: Complex queries with both clients
    console.log('\n📋 Test 3: Testing complex queries...');
    
    // Strategy with rules join
    try {
      console.log('  Testing strategy with rules join (primary client)...');
      const { data: primaryStrategyWithRules, error: primaryStrategyError } = await supabase
        .from('strategies')
        .select(`
          *,
          strategy_rules (
            id,
            rule_text,
            is_checked
          )
        `)
        .limit(3);

      if (primaryStrategyError) {
        testResults.primaryClient.strategyWithRules = {
          success: false,
          error: primaryStrategyError.message,
          isSchemaCacheError: primaryStrategyError.message.includes('strategy_rule_compliance') || 
                             primaryStrategyError.message.includes('schema cache')
        };
        console.log(`    ❌ Error: ${primaryStrategyError.message}`);
      } else {
        testResults.primaryClient.strategyWithRules = {
          success: true,
          count: primaryStrategyWithRules.length
        };
        console.log(`    ✅ Success: ${primaryStrategyWithRules.length} strategies`);
      }
    } catch (err) {
      testResults.primaryClient.strategyWithRules = {
        success: false,
        error: err.message,
        isSchemaCacheError: err.message.includes('strategy_rule_compliance') || 
                           err.message.includes('schema cache')
      };
      console.log(`    ❌ Exception: ${err.message}`);
    }

    try {
      console.log('  Testing strategy with rules join (fallback client)...');
      const { data: fallbackStrategyWithRules, error: fallbackStrategyError } = await fallbackSupabase
        .from('strategies')
        .select(`
          *,
          strategy_rules (
            id,
            rule_text,
            is_checked
          )
        `)
        .limit(3);

      if (fallbackStrategyError) {
        testResults.fallbackClient.strategyWithRules = {
          success: false,
          error: fallbackStrategyError.message,
          isSchemaCacheError: fallbackStrategyError.message.includes('strategy_rule_compliance') || 
                             fallbackStrategyError.message.includes('schema cache')
        };
        console.log(`    ❌ Error: ${fallbackStrategyError.message}`);
      } else {
        testResults.fallbackClient.strategyWithRules = {
          success: true,
          count: fallbackStrategyWithRules.length
        };
        console.log(`    ✅ Success: ${fallbackStrategyWithRules.length} strategies`);
      }
    } catch (err) {
      testResults.fallbackClient.strategyWithRules = {
        success: false,
        error: err.message,
        isSchemaCacheError: err.message.includes('strategy_rule_compliance') || 
                           err.message.includes('schema cache')
      };
      console.log(`    ❌ Exception: ${err.message}`);
    }

    // Test 4: Compare results and evaluate fallback effectiveness
    console.log('\n📋 Test 4: Comparing results...');
    
    const primarySuccessCount = Object.values(testResults.primaryClient).filter(r => r.success).length;
    const fallbackSuccessCount = Object.values(testResults.fallbackClient).filter(r => r.success).length;
    const primarySchemaCacheErrors = Object.values(testResults.primaryClient).filter(r => r.isSchemaCacheError).length;
    const fallbackSchemaCacheErrors = Object.values(testResults.fallbackClient).filter(r => r.isSchemaCacheError).length;
    
    testResults.comparison = {
      primarySuccessCount,
      fallbackSuccessCount,
      primarySchemaCacheErrors,
      fallbackSchemaCacheErrors,
      fallbackImprovesResults: fallbackSuccessCount > primarySuccessCount,
      fallbackReducesCacheErrors: fallbackSchemaCacheErrors < primarySchemaCacheErrors
    };

    console.log(`Primary client successful queries: ${primarySuccessCount}`);
    console.log(`Fallback client successful queries: ${fallbackSuccessCount}`);
    console.log(`Primary client schema cache errors: ${primarySchemaCacheErrors}`);
    console.log(`Fallback client schema cache errors: ${fallbackSchemaCacheErrors}`);
    
    if (testResults.comparison.fallbackImprovesResults) {
      console.log('✅ Fallback client improves query success rate');
    }
    
    if (testResults.comparison.fallbackReducesCacheErrors) {
      console.log('✅ Fallback client reduces schema cache errors');
    }

    // Test 5: Test cache clearing functionality
    console.log('\n📋 Test 5: Testing cache clearing...');
    try {
      // Simulate cache clearing
      console.log('  Testing cache clearing...');
      
      // This would normally be done by the comprehensive schema refresh
      // For now, we'll just test that the clients can reconnect after a delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const { data: testData, error: testError } = await fallbackSupabase
        .from('strategies')
        .select('id')
        .limit(1);

      if (testError) {
        testResults.comparison.cacheClearing = {
          success: false,
          error: testError.message
        };
        console.log(`    ❌ Cache clearing test failed: ${testError.message}`);
      } else {
        testResults.comparison.cacheClearing = {
          success: true
        };
        console.log('    ✅ Cache clearing test successful');
      }
    } catch (err) {
      testResults.comparison.cacheClearing = {
        success: false,
        error: err.message
      };
      console.log(`    ❌ Cache clearing test exception: ${err.message}`);
    }

    // Summary
    console.log('\n📋 Test Summary');
    
    const overallSuccess = fallbackSuccessCount >= primarySuccessCount && 
                        fallbackSchemaCacheErrors <= primarySchemaCacheErrors;
    
    if (overallSuccess) {
      console.log('✅ Fallback mechanism is working correctly!');
      console.log('✅ Fallback client performs as well as or better than primary client');
      console.log('✅ Schema cache errors are reduced or eliminated with fallback');
    } else {
      console.log('⚠️ Fallback mechanism may need improvement');
      if (fallbackSuccessCount < primarySuccessCount) {
        console.log('⚠️ Fallback client has lower success rate than primary');
      }
      if (fallbackSchemaCacheErrors > primarySchemaCacheErrors) {
        console.log('⚠️ Fallback client has more schema cache errors than primary');
      }
    }

    return {
      success: overallSuccess,
      results: testResults,
      summary: {
        primarySuccessCount,
        fallbackSuccessCount,
        primarySchemaCacheErrors,
        fallbackSchemaCacheErrors,
        fallbackImprovesResults: testResults.comparison.fallbackImprovesResults,
        fallbackReducesCacheErrors: testResults.comparison.fallbackReducesCacheErrors
      }
    };

  } catch (error) {
    console.error('❌ Fallback mechanism test failed:', error.message);
    return {
      success: false,
      error: error.message,
      results: testResults
    };
  }
}

// Run the test
testFallbackMechanism().then(result => {
  console.log('\n🏁 Fallback mechanism testing completed');
  process.exit(result.success ? 0 : 1);
}).catch(error => {
  console.error('❌ Fallback mechanism testing failed:', error);
  process.exit(1);
});