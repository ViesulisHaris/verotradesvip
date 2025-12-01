const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

// Read the SQL script
const sqlScript = fs.readFileSync(path.join(__dirname, 'CLEAR_SUPABASE_CACHE.sql'), 'utf8');

// Create Supabase client with service role key for admin operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing required environment variables:');
  console.error('- NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'SET' : 'MISSING');
  console.error('- SUPABASE_SERVICE_ROLE_KEY:', serviceRoleKey ? 'SET' : 'MISSING');
  process.exit(1);
}

console.log('🔧 Creating Supabase admin client...');
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

async function executeCacheClear() {
  try {
    console.log('🚀 Starting comprehensive cache clear...');
    
    // Split the SQL script into individual statements
    const statements = sqlScript
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      try {
        console.log(`\n⚡ Executing statement ${i + 1}/${statements.length}:`);
        console.log(`   ${statement.substring(0, 100)}${statement.length > 100 ? '...' : ''}`);
        
        // Execute the statement using RPC
        const { data, error } = await supabase.rpc('exec_sql', {
          sql_query: statement
        });
        
        if (error) {
          console.log(`   ⚠️  Warning: ${error.message}`);
          // Some statements might fail due to permissions or other reasons
          // but we continue with the rest
        } else {
          console.log(`   ✅ Success`);
          successCount++;
        }
      } catch (err) {
        console.error(`   ❌ Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
        errorCount++;
      }
    }
    
    console.log('\n📊 Execution Summary:');
    console.log(`   ✅ Successful: ${successCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
    console.log(`   📝 Total: ${statements.length}`);
    
    // Test the cache clear by running a simple query
    console.log('\n🧪 Testing cache clear with a simple query...');
    const { data: testData, error: testError } = await supabase
      .from('strategies')
      .select('id')
      .limit(1);
    
    if (testError) {
      console.error('❌ Test query failed:', testError.message);
      if (testError.message.includes('strategy_rule_compliance')) {
        console.error('🚨 Cache clear may not have fully resolved the issue');
      }
    } else {
      console.log('✅ Test query successful - cache clear appears to have worked');
    }
    
    // Verify strategy_rule_compliance table is gone
    console.log('\n🔍 Verifying strategy_rule_compliance table is removed...');
    const { data: tableCheck, error: tableError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_name', 'strategy_rule_compliance')
      .eq('table_schema', 'public');
    
    if (tableError) {
      console.error('❌ Table check failed:', tableError.message);
    } else if (tableCheck && tableCheck.length > 0) {
      console.error('🚨 strategy_rule_compliance table still exists!');
    } else {
      console.log('✅ Confirmed: strategy_rule_compliance table does not exist');
    }
    
    console.log('\n🎉 Comprehensive cache clear completed!');
    
  } catch (error) {
    console.error('❌ Critical error during cache clear:', error);
    process.exit(1);
  }
}

// Execute the cache clear
executeCacheClear();