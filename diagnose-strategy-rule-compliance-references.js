const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Use service role for admin access

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function diagnoseDatabaseReferences() {
  console.log('🔍 DIAGNOSING STRATEGY_RULE_COMPLIANCE REFERENCES...\n');

  try {
    // Check if the table still exists
    console.log('1. Checking if strategy_rule_compliance table still exists...');
    const { data: tableExists, error: tableError } = await supabase
      .rpc('check_table_exists', { table_name: 'strategy_rule_compliance' });
    
    if (tableError) {
      console.log('   ⚠️  Could not check table existence:', tableError.message);
    } else {
      if (tableExists) {
        console.log('   ❌ Table still exists - this is the problem!');
      } else {
        console.log('   ✅ Table does not exist (as expected)');
      }
    }

    // Check for views that reference the table
    console.log('\n2. Checking for views that reference strategy_rule_compliance...');
    const { data: views, error: viewsError } = await supabase
      .rpc('check_views_referencing_table', { table_name: 'strategy_rule_compliance' });
    
    if (viewsError) {
      console.log('   ⚠️  Could not check views:', viewsError.message);
    } else {
      if (views && views.length > 0) {
        console.log('   ❌ Found views referencing the table:');
        views.forEach(view => console.log(`      - ${view.view_name}: ${view.view_definition}`));
      } else {
        console.log('   ✅ No views reference the table');
      }
    }

    // Check for functions that reference the table
    console.log('\n3. Checking for functions that reference strategy_rule_compliance...');
    const { data: functions, error: functionsError } = await supabase
      .rpc('check_functions_referencing_table', { table_name: 'strategy_rule_compliance' });
    
    if (functionsError) {
      console.log('   ⚠️  Could not check functions:', functionsError.message);
    } else {
      if (functions && functions.length > 0) {
        console.log('   ❌ Found functions referencing the table:');
        functions.forEach(func => console.log(`      - ${func.function_name}: ${func.function_definition}`));
      } else {
        console.log('   ✅ No functions reference the table');
      }
    }

    // Check for triggers that reference the table
    console.log('\n4. Checking for triggers that reference strategy_rule_compliance...');
    const { data: triggers, error: triggersError } = await supabase
      .rpc('check_triggers_referencing_table', { table_name: 'strategy_rule_compliance' });
    
    if (triggersError) {
      console.log('   ⚠️  Could not check triggers:', triggersError.message);
    } else {
      if (triggers && triggers.length > 0) {
        console.log('   ❌ Found triggers referencing the table:');
        triggers.forEach(trigger => console.log(`      - ${trigger.trigger_name}`));
      } else {
        console.log('   ✅ No triggers reference the table');
      }
    }

    // Test the actual query that's failing in TradeForm
    console.log('\n5. Testing the actual query from TradeForm...');
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.log('   ⚠️  Could not get user for testing:', userError?.message);
    } else {
      console.log(`   🧪 Testing strategies query for user: ${user.id}`);
      
      const { data: strategies, error: strategiesError } = await supabase
        .from('strategies')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .limit(100);
      
      if (strategiesError) {
        console.log('   ❌ Strategies query failed:');
        console.log(`      Error: ${strategiesError.message}`);
        console.log(`      Code: ${strategiesError.code}`);
        console.log(`      Details: ${strategiesError.details}`);
        
        if (strategiesError.message.includes('strategy_rule_compliance')) {
          console.log('   🎯 CONFIRMED: This is the source of the strategy_rule_compliance error!');
        }
      } else {
        console.log('   ✅ Strategies query succeeded');
        console.log(`   📊 Found ${strategies?.length || 0} strategies`);
      }
    }

    // Test the strategy_rules query from strategy-rules-engine
    console.log('\n6. Testing strategy_rules query...');
    const { data: strategyRules, error: strategyRulesError } = await supabase
      .from('strategy_rules')
      .select('id, rule_text, is_checked')
      .limit(1);
    
    if (strategyRulesError) {
      console.log('   ❌ Strategy rules query failed:');
      console.log(`      Error: ${strategyRulesError.message}`);
      console.log(`      Code: ${strategyRulesError.code}`);
      console.log(`      Details: ${strategyRulesError.details}`);
      
      if (strategyRulesError.message.includes('strategy_rule_compliance')) {
        console.log('   🎯 CONFIRMED: This is another source of the strategy_rule_compliance error!');
      }
    } else {
      console.log('   ✅ Strategy rules query succeeded');
    }

    console.log('\n🏁 DIAGNOSIS COMPLETE');

  } catch (error) {
    console.error('❌ Diagnosis failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Run the diagnosis
diagnoseDatabaseReferences();