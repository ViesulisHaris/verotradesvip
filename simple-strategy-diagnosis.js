const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Load environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing required environment variables:');
  console.error('- NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'Set' : 'Missing');
  console.error('- NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'Set' : 'Missing');
  process.exit(1);
}

// Initialize Supabase client with anon key (like the app uses)
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function diagnoseStrategyIssues() {
  console.log('🔍 SIMPLE STRATEGY DIAGNOSIS (using anon key)\n');
  console.log('===============================================\n');

  try {
    // 1. Test basic connection
    console.log('1️⃣ Testing basic Supabase connection...');
    try {
      const { data, error } = await supabase.from('_test_connection').select('*').limit(1);
      if (error && !error.message.includes('does not exist')) {
        console.log(`   ❌ Connection error: ${error.message}`);
        return;
      } else {
        console.log('   ✅ Basic connection successful');
      }
    } catch (error) {
      console.log(`   ❌ Connection exception: ${error.message}`);
      return;
    }

    // 2. Test strategies query (this is where the error occurs)
    console.log('\n2️⃣ Testing strategies query (main issue)...');
    try {
      const { data: strategies, error: strategiesError } = await supabase
        .from('strategies')
        .select('id, name, user_id, is_active')
        .limit(5);

      if (strategiesError) {
        console.log(`   ❌ Error querying strategies: ${strategiesError.message}`);
        
        // Check if it's the strategy_rule_compliance error
        if (strategiesError.message.includes('strategy_rule_compliance')) {
          console.log('   🔍 CONFIRMED: This is the strategy_rule_compliance error!');
          console.log('   📍 The database still has references to the deleted table');
        } else if (strategiesError.message.includes('permission') || strategiesError.message.includes('policy')) {
          console.log('   🔍 CONFIRMED: This is a permission issue!');
          console.log('   📍 RLS policies are blocking access to strategies');
        } else {
          console.log('   🔍 This is a different type of error');
        }
      } else {
        console.log(`   ✅ Strategies query successful: ${strategies.length} strategies found`);
        if (strategies.length > 0) {
          console.log('   📋 Sample strategies:');
          strategies.forEach(s => console.log(`      - ${s.name} (user: ${s.user_id}, active: ${s.is_active})`));
        } else {
          console.log('   📋 No strategies found (might be due to permissions or no data)');
        }
      }
    } catch (error) {
      console.log(`   ❌ Exception querying strategies: ${error.message}`);
    }

    // 3. Test trades query (to see if it's strategy-specific)
    console.log('\n3️⃣ Testing trades query...');
    try {
      const { data: trades, error: tradesError } = await supabase
        .from('trades')
        .select('id, symbol, strategy_id')
        .limit(5);

      if (tradesError) {
        console.log(`   ❌ Error querying trades: ${tradesError.message}`);
        if (tradesError.message.includes('strategy_rule_compliance')) {
          console.log('   🔍 strategy_rule_compliance error also affects trades table');
        }
      } else {
        console.log(`   ✅ Trades query successful: ${trades.length} trades found`);
      }
    } catch (error) {
      console.log(`   ❌ Exception querying trades: ${error.message}`);
    }

    // 4. Test a simple table that shouldn't have issues
    console.log('\n4️⃣ Testing a simple table (for comparison)...');
    try {
      const { data: simpleData, error: simpleError } = await supabase
        .from('profiles')
        .select('id, email')
        .limit(1);

      if (simpleError) {
        console.log(`   ❌ Error querying profiles: ${simpleError.message}`);
      } else {
        console.log(`   ✅ Profiles query successful: ${simpleData.length} profiles found`);
      }
    } catch (error) {
      console.log(`   ❌ Exception querying profiles: ${error.message}`);
    }

    console.log('\n===============================================');
    console.log('🏁 DIAGNOSIS COMPLETE\n');
    
    console.log('📋 SUMMARY OF FINDINGS:');
    console.log('1. If strategies query fails with "strategy_rule_compliance" error:');
    console.log('   → The database schema cache still has references to the deleted table');
    console.log('   → Need to run schema cache clear in Supabase SQL editor');
    console.log('');
    console.log('2. If strategies query fails with permission/policy error:');
    console.log('   → RLS policies are blocking access');
    console.log('   → Need to check/fix RLS policies on strategies table');
    console.log('');
    console.log('3. If other tables work but strategies don\'t:');
    console.log('   → Issue is specific to strategies table');
    console.log('   → Could be missing RLS policies or table corruption');

  } catch (error) {
    console.error('Error during diagnosis:', error);
    process.exit(1);
  }
}

// Execute the diagnosis
diagnoseStrategyIssues();