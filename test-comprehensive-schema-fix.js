const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Import the comprehensive schema refresh
const { comprehensiveSchemaRefresh } = require('./src/lib/comprehensive-schema-refresh.ts');

async function testComprehensiveSchemaFix() {
  console.log('🚀 Testing Comprehensive Schema Cache Fix...\n');

  try {
    // Step 1: Execute comprehensive schema refresh
    console.log('📋 Step 1: Executing comprehensive schema refresh...');
    const refreshResult = await comprehensiveSchemaRefresh.refreshSchema();
    
    console.log('Schema Refresh Results:');
    console.log(`  Success: ${refreshResult.success}`);
    console.log(`  Message: ${refreshResult.message}`);
    console.log(`  Cache Cleared: ${refreshResult.details.cacheCleared}`);
    console.log(`  Schema Rebuilt: ${refreshResult.details.schemaRebuilt}`);
    console.log(`  Validation Passed: ${refreshResult.details.validationPassed}`);
    console.log(`  Queries Tested: ${refreshResult.details.queriesTested}`);
    
    if (refreshResult.details.errors.length > 0) {
      console.log('\nErrors encountered:');
      refreshResult.details.errors.forEach(error => {
        console.log(`  ❌ ${error}`);
      });
    }

    // Step 2: Test basic database connectivity
    console.log('\n📋 Step 2: Testing basic database connectivity...');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false
        }
      }
    );

    const tables = ['strategies', 'trades', 'users', 'strategy_rules'];
    const connectionResults = {};

    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);

        if (error) {
          connectionResults[table] = `❌ Error: ${error.message}`;
        } else {
          connectionResults[table] = `✅ Connected (${data.length} records)`;
        }
      } catch (err) {
        connectionResults[table] = `❌ Exception: ${err.message}`;
      }
    }

    console.log('Connection Test Results:');
    Object.entries(connectionResults).forEach(([table, result]) => {
      console.log(`  ${table}: ${result}`);
    });

    // Step 3: Test complex queries
    console.log('\n📋 Step 3: Testing complex queries...');
    
    // Test strategy with rules join
    try {
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
        console.log(`  Strategy with rules join: ❌ ${strategyError.message}`);
      } else {
        console.log(`  Strategy with rules join: ✅ ${strategyWithRules.length} strategies`);
      }
    } catch (err) {
      console.log(`  Strategy with rules join: ❌ ${err.message}`);
    }

    // Test trades with strategy join
    try {
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
        console.log(`  Trades with strategy join: ❌ ${tradesError.message}`);
      } else {
        console.log(`  Trades with strategy join: ✅ ${tradesWithStrategy.length} trades`);
      }
    } catch (err) {
      console.log(`  Trades with strategy join: ❌ ${err.message}`);
    }

    // Step 4: Test information schema access
    console.log('\n📋 Step 4: Testing information schema access...');
    try {
      const { data: schemaInfo, error: schemaError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .limit(10);

      if (schemaError) {
        console.log(`  Information schema: ❌ ${schemaError.message}`);
      } else {
        console.log(`  Information schema: ✅ ${schemaInfo.length} tables found`);
      }
    } catch (err) {
      console.log(`  Information schema: ❌ ${err.message}`);
    }

    // Step 5: Summary
    console.log('\n📋 Step 5: Test Summary');
    const allConnectionsSuccessful = Object.values(connectionResults).every(result => result.includes('✅'));
    
    if (refreshResult.success && allConnectionsSuccessful) {
      console.log('✅ Comprehensive schema cache fix completed successfully!');
      console.log('✅ All database connections are working properly!');
      console.log('✅ Application should now work without schema cache errors!');
    } else {
      console.log('⚠️ Schema cache fix completed with some issues:');
      if (!refreshResult.success) {
        console.log('  - Schema refresh had errors');
      }
      if (!allConnectionsSuccessful) {
        console.log('  - Some database connections failed');
      }
    }

  } catch (error) {
    console.error('❌ Comprehensive schema fix test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Run the test
testComprehensiveSchemaFix();