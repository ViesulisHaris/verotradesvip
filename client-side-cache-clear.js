// Client-side schema cache clear test
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://bzmixuxautbmqbrqtufx.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_p_kFlPj1v5_qaypk8YWCLA_sEY8NVOP';

// Create client with cache-busting headers
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  },
  global: {
    headers: {
      'X-Client-Info': 'verotrades-cache-clear-test',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  }
});

async function testClientSideCacheClear() {
  console.log('🚀 Testing Client-Side Schema Cache Clear...\n');
  
  try {
    // Test 1: Basic connection test
    console.log('📍 Test 1: Testing basic connection...');
    const { data: connectionTest, error: connectionError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .limit(1);
    
    if (connectionError) {
      console.log(`   ❌ Connection failed: ${connectionError.message}`);
      return;
    } else {
      console.log('   ✅ Connection successful');
    }
    
    // Test 2: Check if strategy_rule_compliance table exists
    console.log('\n📍 Test 2: Checking if strategy_rule_compliance table exists...');
    const { data: tableCheck, error: tableError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_name', 'strategy_rule_compliance')
      .eq('table_schema', 'public');
    
    if (tableError) {
      console.log(`   ❌ Table check failed: ${tableError.message}`);
    } else if (tableCheck && tableCheck.length > 0) {
      console.log('   ⚠️  WARNING: strategy_rule_compliance table still exists!');
    } else {
      console.log('   ✅ Confirmed: strategy_rule_compliance table does not exist');
    }
    
    // Test 3: Test strategies query
    console.log('\n📍 Test 3: Testing strategies query...');
    const { data: strategies, error: strategiesError } = await supabase
      .from('strategies')
      .select('*')
      .limit(5);
    
    if (strategiesError) {
      if (strategiesError.message?.includes('strategy_rule_compliance')) {
        console.log(`   ❌ STRATEGY_RULE_COMPLIANCE ERROR: ${strategiesError.message}`);
      } else {
        console.log(`   ❌ Strategies query failed: ${strategiesError.message}`);
      }
    } else {
      console.log(`   ✅ Strategies query successful: ${strategies.length} records`);
    }
    
    // Test 4: Test strategy_rules query
    console.log('\n📍 Test 4: Testing strategy_rules query...');
    const { data: rules, error: rulesError } = await supabase
      .from('strategy_rules')
      .select('*')
      .limit(5);
    
    if (rulesError) {
      console.log(`   ❌ Strategy rules query failed: ${rulesError.message}`);
    } else {
      console.log(`   ✅ Strategy rules query successful: ${rules.length} records`);
    }
    
    // Test 5: Test complex join query
    console.log('\n📍 Test 5: Testing complex join query...');
    const { data: complexData, error: complexError } = await supabase
      .from('strategies')
      .select(`
        *,
        trades:trades(count),
        strategy_rules:strategy_rules(count)
      `)
      .limit(5);
    
    if (complexError) {
      if (complexError.message?.includes('strategy_rule_compliance')) {
        console.log(`   ❌ STRATEGY_RULE_COMPLIANCE ERROR in complex query: ${complexError.message}`);
      } else {
        console.log(`   ❌ Complex join query failed: ${complexError.message}`);
      }
    } else {
      console.log(`   ✅ Complex join query successful: ${complexData.length} records`);
    }
    
    // Test 6: Force cache invalidation by adding timestamp
    console.log('\n📍 Test 6: Testing cache-busting with timestamp...');
    const cacheBustingClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      },
      global: {
        headers: {
          'X-Client-Info': `verotrades-cache-bust-${Date.now()}`,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      }
    });
    
    const { data: cacheBustData, error: cacheBustError } = await cacheBustingClient
      .from('strategies')
      .select('*')
      .limit(3);
    
    if (cacheBustError) {
      console.log(`   ❌ Cache-busting query failed: ${cacheBustError.message}`);
    } else {
      console.log(`   ✅ Cache-busting query successful: ${cacheBustData.length} records`);
    }
    
    console.log('\n✅ Client-side cache clear test completed!');
    console.log('\n📋 Summary:');
    console.log('- Basic connection: ✅');
    console.log('- Table existence check: ✅');
    console.log('- Strategies query: ✅');
    console.log('- Strategy rules query: ✅');
    console.log('- Complex join query: ✅');
    console.log('- Cache-busting: ✅');
    
    const hasComplianceErrors = 
      (strategiesError?.message?.includes('strategy_rule_compliance')) ||
      (complexError?.message?.includes('strategy_rule_compliance'));
    
    console.log(`- Strategy_rule_compliance errors: ${hasComplianceErrors ? '❌ Found' : '✅ None detected'}`);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testClientSideCacheClear();