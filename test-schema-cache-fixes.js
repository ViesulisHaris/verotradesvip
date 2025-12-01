const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Load environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing required environment variables:');
  console.error('- NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗');
  console.error('- NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✓' : '✗');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  },
  global: {
    headers: {
      'X-Client-Info': 'verotrades-schema-test',
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    }
  }
});

async function testSchemaCacheFixes() {
  console.log('🧪 Testing Schema Cache Fixes...\n');
  
  const testResults = [];
  
  // Test 1: Basic strategies query
  console.log('📊 Test 1: Basic strategies query');
  try {
    const { data, error } = await supabase
      .from('strategies')
      .select('*')
      .limit(5);
    
    if (error) {
      console.error('❌ Failed:', error.message);
      testResults.push({ test: 'Basic strategies query', success: false, error: error.message });
    } else {
      console.log(`✅ Success: ${data.length} strategies returned`);
      testResults.push({ test: 'Basic strategies query', success: true, count: data.length });
    }
  } catch (err) {
    console.error('❌ Exception:', err.message);
    testResults.push({ test: 'Basic strategies query', success: false, error: err.message });
  }

  // Test 2: Strategy rules query
  console.log('\n📋 Test 2: Strategy rules query');
  try {
    const { data, error } = await supabase
      .from('strategy_rules')
      .select('*')
      .limit(5);
    
    if (error) {
      console.error('❌ Failed:', error.message);
      testResults.push({ test: 'Strategy rules query', success: false, error: error.message });
    } else {
      console.log(`✅ Success: ${data.length} rules returned`);
      testResults.push({ test: 'Strategy rules query', success: true, count: data.length });
    }
  } catch (err) {
    console.error('❌ Exception:', err.message);
    testResults.push({ test: 'Strategy rules query', success: false, error: err.message });
  }

  // Test 3: Trades query
  console.log('\n💰 Test 3: Trades query');
  try {
    const { data, error } = await supabase
      .from('trades')
      .select('*')
      .limit(5);
    
    if (error) {
      console.error('❌ Failed:', error.message);
      testResults.push({ test: 'Trades query', success: false, error: error.message });
    } else {
      console.log(`✅ Success: ${data.length} trades returned`);
      testResults.push({ test: 'Trades query', success: true, count: data.length });
    }
  } catch (err) {
    console.error('❌ Exception:', err.message);
    testResults.push({ test: 'Trades query', success: false, error: err.message });
  }

  // Test 4: Complex join query (trades with strategies)
  console.log('\n🔗 Test 4: Complex join query (trades with strategies)');
  try {
    const { data, error } = await supabase
      .from('trades')
      .select(`
        *,
        strategies:strategy_id (
          name,
          description
        )
      `)
      .limit(5);
    
    if (error) {
      console.error('❌ Failed:', error.message);
      testResults.push({ test: 'Complex join query', success: false, error: error.message });
    } else {
      console.log(`✅ Success: ${data.length} trades with strategies returned`);
      testResults.push({ test: 'Complex join query', success: true, count: data.length });
    }
  } catch (err) {
    console.error('❌ Exception:', err.message);
    testResults.push({ test: 'Complex join query', success: false, error: err.message });
  }

  // Test 5: Strategy with rules join
  console.log('\n📝 Test 5: Strategy with rules join');
  try {
    const { data, error } = await supabase
      .from('strategies')
      .select(`
        *,
        strategy_rules (
          id,
          rule_text,
          is_checked
        )
      `)
      .limit(5);
    
    if (error) {
      console.error('❌ Failed:', error.message);
      testResults.push({ test: 'Strategy with rules join', success: false, error: error.message });
    } else {
      console.log(`✅ Success: ${data.length} strategies with rules returned`);
      testResults.push({ test: 'Strategy with rules join', success: true, count: data.length });
    }
  } catch (err) {
    console.error('❌ Exception:', err.message);
    testResults.push({ test: 'Strategy with rules join', success: false, error: err.message });
  }

  // Test 6: Information schema access
  console.log('\n🗂️ Test 6: Information schema access');
  try {
    const { data, error } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type')
      .eq('table_name', 'strategies')
      .eq('table_schema', 'public')
      .limit(10);
    
    if (error) {
      console.error('❌ Failed:', error.message);
      testResults.push({ test: 'Information schema access', success: false, error: error.message });
    } else {
      console.log(`✅ Success: ${data.length} columns returned`);
      testResults.push({ test: 'Information schema access', success: true, count: data.length });
    }
  } catch (err) {
    console.error('❌ Exception:', err.message);
    testResults.push({ test: 'Information schema access', success: false, error: err.message });
  }

  // Test 7: Check for deleted table references
  console.log('\n🔍 Test 7: Check for deleted table references');
  try {
    const { data, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_name', 'strategy_rule_compliance')
      .eq('table_schema', 'public');
    
    if (error) {
      console.error('❌ Failed:', error.message);
      testResults.push({ test: 'Deleted table check', success: false, error: error.message });
    } else {
      if (data && data.length > 0) {
        console.log('⚠️ Warning: strategy_rule_compliance table still exists!');
        testResults.push({ test: 'Deleted table check', success: false, warning: 'Table still exists' });
      } else {
        console.log('✅ Success: strategy_rule_compliance table does not exist');
        testResults.push({ test: 'Deleted table check', success: true, message: 'Table properly removed' });
      }
    }
  } catch (err) {
    console.error('❌ Exception:', err.message);
    testResults.push({ test: 'Deleted table check', success: false, error: err.message });
  }

  // Summary
  console.log('\n📋 Test Results Summary:');
  console.log('========================');
  
  const successCount = testResults.filter(r => r.success).length;
  const failureCount = testResults.filter(r => !r.success).length;
  
  testResults.forEach((result, index) => {
    const status = result.success ? '✅' : '❌';
    const details = result.error || result.warning || result.message || `${result.count} records`;
    console.log(`${status} ${result.test}: ${details}`);
  });
  
  console.log('\n📊 Overall Results:');
  console.log(`- Successful tests: ${successCount}/${testResults.length}`);
  console.log(`- Failed tests: ${failureCount}/${testResults.length}`);
  console.log(`- Success rate: ${((successCount / testResults.length) * 100).toFixed(1)}%`);
  
  if (failureCount === 0) {
    console.log('\n🎉 All tests passed! Schema cache issues appear to be resolved.');
  } else {
    console.log('\n⚠️ Some tests failed. Schema cache issues may still exist.');
    
    // Check for schema cache specific errors
    const schemaCacheErrors = testResults.filter(r => 
      r.error && (
        r.error.includes('strategy_rule_compliance') ||
        r.error.includes('schema cache') ||
        r.error.includes('information_schema.columns')
      )
    );
    
    if (schemaCacheErrors.length > 0) {
      console.log('\n🔧 Schema cache related errors detected:');
      schemaCacheErrors.forEach(error => {
        console.log(`   - ${error.test}: ${error.error}`);
      });
      console.log('\n💡 Recommendation: Run the aggressive schema cache clear script.');
    }
  }
}

// Run the tests
testSchemaCacheFixes();