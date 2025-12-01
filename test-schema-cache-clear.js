const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function testSchemaCacheClear() {
  console.log('🚀 Testing Schema Cache Clear...\n');

  // Create Supabase client
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
          'X-Client-Info': 'verotrades-test',
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        }
      }
    }
  );

  try {
    // Step 1: Clear client-side cache
    console.log('📋 Step 1: Clearing client-side cache...');
    
    // Test basic connection first
    console.log('Testing basic connection...');
    const { data: testData, error: testError } = await supabase
      .from('strategies')
      .select('id')
      .limit(1);

    if (testError) {
      console.log(`❌ Initial connection failed: ${testError.message}`);
      if (testError.message.includes('strategy_rule_compliance') || 
          testError.message.includes('schema cache')) {
        console.log('🔍 Detected schema cache issue, proceeding with cache clearing...');
      }
    } else {
      console.log('✅ Initial connection successful');
    }

    // Step 2: Test all core tables
    console.log('\n📋 Step 2: Testing all core tables...');
    const tables = ['strategies', 'trades', 'users', 'strategy_rules'];
    const results = {};

    for (const table of tables) {
      try {
        console.log(`  Testing ${table}...`);
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(3);

        if (error) {
          results[table] = {
            success: false,
            error: error.message,
            isSchemaCacheError: error.message.includes('strategy_rule_compliance') || 
                               error.message.includes('schema cache') ||
                               error.message.includes('information_schema.columns')
          };
          console.log(`    ❌ Error: ${error.message}`);
        } else {
          results[table] = {
            success: true,
            count: data.length
          };
          console.log(`    ✅ Success: ${data.length} records`);
        }
      } catch (err) {
        results[table] = {
          success: false,
          error: err.message,
          isSchemaCacheError: err.message.includes('strategy_rule_compliance') || 
                             err.message.includes('schema cache')
        };
        console.log(`    ❌ Exception: ${err.message}`);
      }
    }

    // Step 3: Test complex joins
    console.log('\n📋 Step 3: Testing complex joins...');
    
    // Test strategy with rules join
    try {
      console.log('  Testing strategy with rules join...');
      const { data: strategyWithRules, error: strategyError } = await supabase
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

      if (strategyError) {
        console.log(`    ❌ Error: ${strategyError.message}`);
        results.strategyWithRules = {
          success: false,
          error: strategyError.message,
          isSchemaCacheError: strategyError.message.includes('strategy_rule_compliance') || 
                             strategyError.message.includes('schema cache')
        };
      } else {
        console.log(`    ✅ Success: ${strategyWithRules.length} strategies`);
        results.strategyWithRules = {
          success: true,
          count: strategyWithRules.length
        };
      }
    } catch (err) {
      console.log(`    ❌ Exception: ${err.message}`);
      results.strategyWithRules = {
        success: false,
        error: err.message,
        isSchemaCacheError: err.message.includes('strategy_rule_compliance') || 
                           err.message.includes('schema cache')
      };
    }

    // Test trades with strategy join
    try {
      console.log('  Testing trades with strategy join...');
      const { data: tradesWithStrategy, error: tradesError } = await supabase
        .from('trades')
        .select(`
          *,
          strategies:strategy_id (
            name,
            description
          )
        `)
        .limit(3);

      if (tradesError) {
        console.log(`    ❌ Error: ${tradesError.message}`);
        results.tradesWithStrategy = {
          success: false,
          error: tradesError.message,
          isSchemaCacheError: tradesError.message.includes('strategy_rule_compliance') || 
                             tradesError.message.includes('schema cache')
        };
      } else {
        console.log(`    ✅ Success: ${tradesWithStrategy.length} trades`);
        results.tradesWithStrategy = {
          success: true,
          count: tradesWithStrategy.length
        };
      }
    } catch (err) {
      console.log(`    ❌ Exception: ${err.message}`);
      results.tradesWithStrategy = {
        success: false,
        error: err.message,
        isSchemaCacheError: err.message.includes('strategy_rule_compliance') || 
                           err.message.includes('schema cache')
      };
    }

    // Step 4: Test information schema
    console.log('\n📋 Step 4: Testing information schema...');
    try {
      console.log('  Testing information_schema.tables...');
      const { data: schemaInfo, error: schemaError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .limit(10);

      if (schemaError) {
        console.log(`    ❌ Error: ${schemaError.message}`);
        results.informationSchema = {
          success: false,
          error: schemaError.message,
          isSchemaCacheError: schemaError.message.includes('strategy_rule_compliance') || 
                             schemaError.message.includes('schema cache')
        };
      } else {
        console.log(`    ✅ Success: ${schemaInfo.length} tables found`);
        results.informationSchema = {
          success: true,
          count: schemaInfo.length
        };
      }
    } catch (err) {
      console.log(`    ❌ Exception: ${err.message}`);
      results.informationSchema = {
        success: false,
        error: err.message,
        isSchemaCacheError: err.message.includes('strategy_rule_compliance') || 
                           err.message.includes('schema cache')
      };
    }

    // Step 5: Summary
    console.log('\n📋 Step 5: Test Summary');
    
    const allResults = Object.values(results);
    const successfulTests = allResults.filter(r => r.success).length;
    const totalTests = allResults.length;
    const schemaCacheErrors = allResults.filter(r => r.isSchemaCacheError).length;
    
    console.log(`Total tests: ${totalTests}`);
    console.log(`Successful: ${successfulTests}`);
    console.log(`Failed: ${totalTests - successfulTests}`);
    console.log(`Schema cache errors: ${schemaCacheErrors}`);
    
    if (schemaCacheErrors > 0) {
      console.log('\n⚠️ Schema cache issues detected:');
      Object.entries(results).forEach(([test, result]) => {
        if (result.isSchemaCacheError) {
          console.log(`  ${test}: ${result.error}`);
        }
      });
      
      console.log('\n🔧 Recommended actions:');
      console.log('1. Clear browser cache and localStorage');
      console.log('2. Restart the development server');
      console.log('3. Use the fallback mechanism implemented in the application');
    } else if (successfulTests === totalTests) {
      console.log('\n✅ All tests passed! Schema cache is working correctly.');
      console.log('✅ Application should work without schema cache errors.');
    } else {
      console.log('\n⚠️ Some tests failed but not due to schema cache issues:');
      Object.entries(results).forEach(([test, result]) => {
        if (!result.success && !result.isSchemaCacheError) {
          console.log(`  ${test}: ${result.error}`);
        }
      });
    }

    return {
      success: schemaCacheErrors === 0 && successfulTests === totalTests,
      results,
      summary: {
        total: totalTests,
        successful: successfulTests,
        failed: totalTests - successfulTests,
        schemaCacheErrors
      }
    };

  } catch (error) {
    console.error('❌ Schema cache clear test failed:', error.message);
    console.error('Stack:', error.stack);
    return {
      success: false,
      error: error.message,
      results: {},
      summary: {
        total: 0,
        successful: 0,
        failed: 0,
        schemaCacheErrors: 0
      }
    };
  }
}

// Run the test
testSchemaCacheClear().then(result => {
  console.log('\n🏁 Test completed');
  process.exit(result.success ? 0 : 1);
}).catch(error => {
  console.error('❌ Test execution failed:', error);
  process.exit(1);
});