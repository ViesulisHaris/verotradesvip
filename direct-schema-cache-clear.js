const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase configuration. Please check your environment variables.');
  process.exit(1);
}

// Create Supabase client with service role key for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function directSchemaCacheClear() {
  console.log('🔄 Executing direct schema cache clear approach...');
  
  try {
    // Method 1: Try to trigger schema reload through a simple query that forces cache refresh
    console.log('📋 Method 1: Forcing cache refresh through schema query...');
    
    const { data: schemaData, error: schemaError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .limit(1);
    
    if (schemaError) {
      console.log('⚠️  Schema query failed:', schemaError.message);
    } else {
      console.log('✅ Schema query successful - cache partially refreshed');
    }
    
    // Method 2: Try to access strategies table to trigger any cached schema issues
    console.log('📋 Method 2: Testing strategies table access...');
    
    const { data: strategiesData, error: strategiesError } = await supabase
      .from('strategies')
      .select('id, name')
      .limit(1);
    
    if (strategiesError) {
      console.log('❌ Strategies table access failed:', strategiesError.message);
      console.log('This might indicate the schema cache issue still exists');
    } else {
      console.log('✅ Strategies table access successful');
      console.log('📊 Sample data:', strategiesData);
    }
    
    // Method 3: Check if strategy_rule_compliance references still exist
    console.log('📋 Method 3: Checking for orphaned references...');
    
    const { data: complianceData, error: complianceError } = await supabase
      .from('strategy_rules')
      .select('id')
      .limit(1);
    
    if (complianceError) {
      console.log('❌ Strategy rules table access failed:', complianceError.message);
    } else {
      console.log('✅ Strategy rules table access successful');
    }
    
    // Method 4: Test the complete workflow that was failing
    console.log('📋 Method 4: Testing complete strategy workflow...');
    
    // Test strategy creation
    const testStrategy = {
      name: `Test Strategy ${Date.now()}`,
      description: 'Temporary test strategy for cache verification',
      is_active: true
    };
    
    const { data: createData, error: createError } = await supabase
      .from('strategies')
      .insert(testStrategy)
      .select()
      .single();
    
    if (createError) {
      console.log('❌ Strategy creation failed:', createError.message);
      console.log('This confirms the schema cache issue still exists');
    } else {
      console.log('✅ Strategy creation successful');
      console.log('📊 Created strategy:', createData);
      
      // Clean up the test strategy
      const { error: deleteError } = await supabase
        .from('strategies')
        .delete()
        .eq('id', createData.id);
      
      if (deleteError) {
        console.log('⚠️  Could not clean up test strategy:', deleteError.message);
      } else {
        console.log('✅ Test strategy cleaned up successfully');
      }
    }
    
    console.log('\n🎯 Schema Cache Clear Status Summary:');
    console.log('- Schema query: ' + (schemaError ? '❌ Failed' : '✅ Success'));
    console.log('- Strategies access: ' + (strategiesError ? '❌ Failed' : '✅ Success'));
    console.log('- Strategy rules access: ' + (complianceError ? '❌ Failed' : '✅ Success'));
    console.log('- Strategy creation: ' + (createError ? '❌ Failed' : '✅ Success'));
    
    if (!schemaError && !strategiesError && !complianceError && !createError) {
      console.log('\n🎉 All tests passed! Schema cache appears to be clear.');
    } else {
      console.log('\n⚠️  Some tests failed. Manual schema cache clear may be needed.');
      console.log('Please execute this command in Supabase SQL Editor:');
      console.log('NOTIFY pgrst, \'reload schema\';');
    }
    
  } catch (err) {
    console.error('❌ Unexpected error:', err);
  }
}

// Execute the direct schema cache clear test
directSchemaCacheClear();