const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Use the anon key for basic operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testStrategySelection() {
  console.log('🧪 Testing strategy selection after cache clear...\n');
  
  try {
    // Test 1: Simple strategy query
    console.log('1. Testing simple strategy query...');
    const { data: strategies, error: strategiesError } = await supabase
      .from('strategies')
      .select('*')
      .limit(5);
    
    if (strategiesError) {
      console.error('❌ Simple strategy query failed:', strategiesError.message);
      console.error('Details:', strategiesError);
      
      if (strategiesError.message.includes('strategy_rule_compliance')) {
        console.log('\n🔍 Confirmed: The error is still related to strategy_rule_compliance table');
        console.log('This indicates the cache still has references to the deleted table');
      }
    } else {
      console.log('✅ Simple strategy query successful!');
      console.log(`   Found ${strategies.length} strategies`);
      
      if (strategies.length > 0) {
        console.log('   Sample strategy:', strategies[0].name || strategies[0].id);
      }
    }
    
    // Test 2: Query with joins that might trigger cached references
    console.log('\n2. Testing strategy query with potential joins...');
    const { data: joinedQuery, error: joinedError } = await supabase
      .from('strategies')
      .select(`
        id,
        name,
        description,
        created_at
      `)
      .limit(3);
    
    if (joinedError) {
      console.error('❌ Joined strategy query failed:', joinedError.message);
    } else {
      console.log('✅ Joined strategy query successful!');
      console.log(`   Found ${joinedQuery.length} strategies with basic fields`);
    }
    
    // Test 3: Test trades query to ensure other functionality works
    console.log('\n3. Testing trades query to verify other functionality...');
    const { data: trades, error: tradesError } = await supabase
      .from('trades')
      .select('*')
      .limit(3);
    
    if (tradesError) {
      console.error('❌ Trades query failed:', tradesError.message);
    } else {
      console.log('✅ Trades query successful!');
      console.log(`   Found ${trades.length} trades`);
    }
    
    // Test 4: Test users query
    console.log('\n4. Testing users query...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, created_at')
      .limit(3);
    
    if (usersError) {
      console.error('❌ Users query failed:', usersError.message);
    } else {
      console.log('✅ Users query successful!');
      console.log(`   Found ${users.length} users`);
    }
    
    console.log('\n📊 Test Summary:');
    console.log('- Strategy queries tested');
    console.log('- Other table functionality verified');
    console.log('\n💡 If strategy queries are still failing with "strategy_rule_compliance" errors,');
    console.log('   the cache may need to be cleared directly in the Supabase dashboard SQL editor.');
    console.log('   You can run the following commands in the Supabase dashboard:');
    console.log('   1. DISCARD PLANS;');
    console.log('   2. DISCARD TEMP;');
    console.log('   3. DISCARD ALL;');
    console.log('   4. VACUUM ANALYZE strategies;');
    console.log('   5. ANALYZE;');
    
  } catch (error) {
    console.error('❌ Unexpected error during testing:', error);
  }
}

// Run the test
testStrategySelection();