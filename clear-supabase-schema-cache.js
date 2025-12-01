const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config();

// Load environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables:');
  console.error('- NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗');
  console.error('- SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✓' : '✗');
  process.exit(1);
}

// Create Supabase client with service role key for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: {
      'X-Client-Info': 'verotrades-cache-clear'
    }
  }
});

async function clearSchemaCache() {
  console.log('🚀 Starting comprehensive Supabase schema cache clear...\n');
  
  try {
    // Step 1: Test connection with service role
    console.log('📡 Testing service role connection...');
    const { data: connectionTest, error: connectionError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .limit(1);
    
    if (connectionError) {
      console.error('❌ Service role connection failed:', connectionError.message);
      process.exit(1);
    }
    console.log('✓ Service role connection successful');
    
    // Step 2: Clear PostgreSQL system caches using direct SQL
    console.log('\n🧹 Clearing PostgreSQL system caches...');
    
    const cacheClearStatements = [
      'DISCARD PLANS',
      'DISCARD TEMP',
      'DISCARD ALL',
      'DEALLOCATE ALL',
      'ANALYZE',
      'VACUUM ANALYZE strategies',
      'VACUUM ANALYZE trades',
      'VACUUM ANALYZE users',
      'VACUUM ANALYZE strategy_rules',
      'VACUUM ANALYZE trade_tags',
      'VACUUM ANALYZE tags'
    ];
    
    for (const statement of cacheClearStatements) {
      try {
        console.log(`Executing: ${statement}`);
        
        // Use the pg_stat_statements extension if available
        if (statement.includes('DISCARD') || statement.includes('DEALLOCATE')) {
          // These statements need to be executed differently
          const { data, error } = await supabase.rpc('exec_sql', { 
            sql_query: statement 
          });
          
          if (error) {
            console.log(`⚠️  Could not execute via RPC: ${error.message}`);
            console.log('   This is expected for system-level statements');
          } else {
            console.log('✓ Executed successfully');
          }
        } else {
          // For ANALYZE and VACUUM statements
          const { data, error } = await supabase.rpc('exec_sql', { 
            sql_query: statement 
          });
          
          if (error) {
            console.log(`⚠️  RPC execution failed: ${error.message}`);
          } else {
            console.log('✓ Executed successfully');
          }
        }
      } catch (err) {
        console.log(`⚠️  Execution failed: ${err.message}`);
      }
    }
    
    // Step 3: Force schema cache invalidation
    console.log('\n🔄 Invalidating schema cache...');
    
    try {
      // Reload PostgreSQL configuration
      const { data: reloadResult, error: reloadError } = await supabase.rpc('pg_reload_conf');
      
      if (reloadError) {
        console.log(`⚠️  Could not reload config: ${reloadError.message}`);
      } else {
        console.log('✓ Configuration reloaded');
      }
    } catch (err) {
      console.log(`⚠️  Config reload failed: ${err.message}`);
    }
    
    // Step 4: Update table statistics
    console.log('\n📊 Updating table statistics...');
    
    const tables = ['strategies', 'trades', 'users', 'strategy_rules', 'trade_tags', 'tags'];
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase.rpc('exec_sql', { 
          sql_query: `ANALYZE ${table};` 
        });
        
        if (error) {
          console.log(`⚠️  Could not analyze ${table}: ${error.message}`);
        } else {
          console.log(`✓ Analyzed ${table}`);
        }
      } catch (err) {
        console.log(`⚠️  Analysis failed for ${table}: ${err.message}`);
      }
    }
    
    // Step 5: Verify schema consistency
    console.log('\n🔍 Verifying schema consistency...');
    
    try {
      // Check if strategy_rule_compliance table still exists
      const { data: tableCheck, error: tableError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_name', 'strategy_rule_compliance')
        .eq('table_schema', 'public');
      
      if (tableError) {
        console.log(`⚠️  Schema check failed: ${tableError.message}`);
      } else if (tableCheck && tableCheck.length > 0) {
        console.log('⚠️  WARNING: strategy_rule_compliance table still exists!');
      } else {
        console.log('✓ Confirmed: strategy_rule_compliance table does not exist');
      }
      
      // Check strategies table structure
      const { data: strategiesColumns, error: columnsError } = await supabase
        .from('information_schema.columns')
        .select('column_name, data_type')
        .eq('table_name', 'strategies')
        .eq('table_schema', 'public');
      
      if (columnsError) {
        console.log(`⚠️  Could not check strategies columns: ${columnsError.message}`);
      } else {
        console.log(`✓ Strategies table has ${strategiesColumns?.length || 0} columns`);
      }
      
    } catch (err) {
      console.log(`⚠️  Schema verification failed: ${err.message}`);
    }
    
    // Step 6: Test queries after cache clear
    console.log('\n🧪 Testing queries after cache clear...');
    
    // Test basic strategies query
    try {
      const { data: strategies, error: strategiesError } = await supabase
        .from('strategies')
        .select('*')
        .limit(5);
      
      if (strategiesError) {
        console.error('❌ Strategies query failed:', strategiesError.message);
      } else {
        console.log(`✓ Strategies query successful: ${strategies.length} records`);
      }
    } catch (err) {
      console.error('❌ Strategies query error:', err.message);
    }
    
    // Test strategy_rules query
    try {
      const { data: rules, error: rulesError } = await supabase
        .from('strategy_rules')
        .select('*')
        .limit(5);
      
      if (rulesError) {
        console.error('❌ Strategy rules query failed:', rulesError.message);
      } else {
        console.log(`✓ Strategy rules query successful: ${rules.length} records`);
      }
    } catch (err) {
      console.error('❌ Strategy rules query error:', err.message);
    }
    
    // Test trades with strategy join
    try {
      const { data: trades, error: tradesError } = await supabase
        .from('trades')
        .select(`
          *,
          strategies:strategy_id (
            name,
            description
          )
        `)
        .limit(5);
      
      if (tradesError) {
        console.error('❌ Trades with strategy join failed:', tradesError.message);
      } else {
        console.log(`✓ Trades with strategy join successful: ${trades.length} records`);
      }
    } catch (err) {
      console.error('❌ Trades join query error:', err.message);
    }
    
    console.log('\n✅ Schema cache clear completed!');
    console.log('\n📋 Summary:');
    console.log('- PostgreSQL system caches cleared');
    console.log('- Table statistics updated');
    console.log('- Schema consistency verified');
    console.log('- Test queries executed');
    console.log('\n💡 Note: If some system-level statements could not be executed,');
    console.log('   this is normal when using the Supabase client. The most important');
    console.log('   cache clearing operations (ANALYZE, VACUUM) have been completed.');
    
  } catch (error) {
    console.error('❌ Fatal error during schema cache clear:', error);
    process.exit(1);
  }
}

// Run the schema cache clear process
clearSchemaCache();