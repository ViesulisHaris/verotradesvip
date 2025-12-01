const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function diagnoseDatabaseSchema() {
  console.log('🔍 SIMPLE DATABASE SCHEMA DIAGNOSTIC...\n');

  try {
    // Test 1: Check if strategies table works
    console.log('1. Testing strategies table...');
    const { data: strategies, error: strategiesError } = await supabase
      .from('strategies')
      .select('*')
      .limit(1);
    
    if (strategiesError) {
      console.log('   ❌ Strategies query failed:');
      console.log(`      Error: ${strategiesError.message}`);
      console.log(`      Code: ${strategiesError.code}`);
      
      if (strategiesError.message.includes('strategy_rule_compliance')) {
        console.log('   🎯 FOUND IT! Strategies query references strategy_rule_compliance');
      }
    } else {
      console.log('   ✅ Strategies query works');
      console.log(`   📊 Columns: ${Object.keys(strategies[0] || {}).join(', ')}`);
    }

    // Test 2: Check strategy_rules table structure
    console.log('\n2. Testing strategy_rules table...');
    const { data: strategyRules, error: strategyRulesError } = await supabase
      .from('strategy_rules')
      .select('*')
      .limit(1);
    
    if (strategyRulesError) {
      console.log('   ❌ Strategy rules query failed:');
      console.log(`      Error: ${strategyRulesError.message}`);
      console.log(`      Code: ${strategyRulesError.code}`);
      
      if (strategyRulesError.message.includes('strategy_rule_compliance')) {
        console.log('   🎯 FOUND IT! Strategy rules query references strategy_rule_compliance');
      }
    } else {
      console.log('   ✅ Strategy rules query works');
      console.log(`   📊 Columns: ${Object.keys(strategyRules[0] || {}).join(', ')}`);
    }

    // Test 3: Check if strategy_rule_compliance is referenced in any view
    console.log('\n3. Checking for database views...');
    try {
      const { data: views, error: viewsError } = await supabase
        .rpc('get_database_views');
      
      if (viewsError) {
        console.log('   ⚠️  Could not check views (function may not exist)');
      } else {
        console.log(`   📊 Found ${views?.length || 0} views`);
        views?.forEach(view => {
          if (view.definition && view.definition.includes('strategy_rule_compliance')) {
            console.log(`   🎯 FOUND VIEW referencing strategy_rule_compliance: ${view.viewname}`);
          }
        });
      }
    } catch (e) {
      console.log('   ⚠️  Could not check views');
    }

    // Test 4: Direct SQL query to check for dependencies
    console.log('\n4. Checking table dependencies...');
    try {
      const { data, error } = await supabase
        .rpc('exec_sql', { 
          sql: `
            SELECT 
              tc.table_name, 
              tc.constraint_name, 
              tc.constraint_type,
              kcu.column_name,
              ccu.table_name AS foreign_table_name,
              ccu.column_name AS foreign_column_name 
            FROM information_schema.table_constraints AS tc 
            JOIN information_schema.key_column_usage AS kcu
              ON tc.constraint_name = kcu.constraint_name
              AND tc.table_schema = kcu.table_schema
            JOIN information_schema.constraint_column_usage AS ccu
              ON ccu.constraint_name = tc.constraint_name
              AND ccu.table_schema = tc.table_schema
            WHERE tc.constraint_type IN ('FOREIGN KEY', 'CHECK') 
            AND (tc.table_name LIKE '%strategy%' OR ccu.table_name LIKE '%strategy%')
            AND (tc.table_name = 'strategy_rule_compliance' OR ccu.table_name = 'strategy_rule_compliance');
          `
        });
      
      if (error) {
        console.log('   ⚠️  Could not check constraints');
      } else {
        console.log(`   📊 Found ${data?.length || 0} constraints referencing strategy_rule_compliance`);
        data?.forEach(constraint => {
          console.log(`   🎯 FOUND CONSTRAINT: ${constraint.constraint_name} on ${constraint.table_name}`);
        });
      }
    } catch (e) {
      console.log('   ⚠️  Could not check constraints');
    }

    // Test 5: Check information_schema for any references
    console.log('\n5. Checking information_schema for references...');
    try {
      const { data, error } = await supabase
        .rpc('exec_sql', { 
          sql: `
            SELECT table_name, table_type 
            FROM information_schema.tables 
            WHERE table_name LIKE '%strategy_rule_compliance%' 
            OR table_name LIKE '%compliance%'
            OR table_name LIKE '%strategy_rule%'
            ORDER BY table_name;
          `
        });
      
      if (error) {
        console.log('   ⚠️  Could not check information_schema');
      } else {
        console.log(`   📊 Found ${data?.length || 0} tables with strategy/compliance in name`);
        data?.forEach(table => {
          console.log(`   📋 ${table.table_name} (${table.table_type})`);
        });
      }
    } catch (e) {
      console.log('   ⚠️  Could not check information_schema');
    }

    console.log('\n🏁 DIAGNOSTIC COMPLETE');

  } catch (error) {
    console.error('❌ Diagnostic failed:', error.message);
  }
}

// Run the diagnostic
diagnoseDatabaseSchema();