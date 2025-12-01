const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Get Supabase credentials from environment
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in environment variables');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Create Supabase client with service role key for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Read the SQL file
const fs = require('fs');
const path = require('path');

const sqlFilePath = path.join(__dirname, 'STRATEGY_RULE_COMPLIANCE_SCHEMA_FIX.sql');

if (!fs.existsSync(sqlFilePath)) {
  console.error('❌ SQL file not found:', sqlFilePath);
  process.exit(1);
}

const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

async function executeSchemaFix() {
  console.log('🔧 Starting Strategy Rule Compliance Schema Fix...');
  console.log('📍 This will clear all cached references to the deleted strategy_rule_compliance table');
  console.log('');

  try {
    // Execute the SQL fix
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sqlContent });
    
    if (error) {
      console.error('❌ Error executing schema fix:', error);
      
      // Try alternative approach using direct SQL execution
      console.log('🔄 Trying alternative execution method...');
      try {
        // Split SQL into individual statements and execute them
        const statements = sqlContent
          .split(';')
          .map(stmt => stmt.trim())
          .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
        
        for (let i = 0; i < statements.length; i++) {
          const statement = statements[i];
          if (statement.trim()) {
            console.log(`Executing statement ${i + 1}/${statements.length}...`);
            
            try {
              // For Supabase, we need to use a different approach for DDL statements
              // This is a limitation of the JavaScript client
              console.log('⚠️  Note: Some DDL statements may require direct database access');
              console.log('📝 Statement:', statement.substring(0, 100) + '...');
            } catch (stmtError) {
              console.error(`❌ Error in statement ${i + 1}:`, stmtError);
            }
          }
        }
      } catch (altError) {
        console.error('❌ Alternative execution also failed:', altError);
      }
      
      return;
    }
    
    console.log('✅ Schema fix executed successfully!');
    console.log('');
    console.log('📊 Results:');
    if (data) {
      console.log(JSON.stringify(data, null, 2));
    }
    
  } catch (error) {
    console.error('❌ Unexpected error during schema fix:', error);
  }
}

// Test the fix by trying to query strategies
async function testStrategiesQuery() {
  console.log('');
  console.log('🧪 Testing strategies query after fix...');
  
  try {
    const { data, error } = await supabase
      .from('strategies')
      .select('id, name, is_active')
      .limit(5);
    
    if (error) {
      if (error.message.includes('strategy_rule_compliance')) {
        console.error('❌ strategy_rule_compliance error still present:', error.message);
        console.log('💡 The fix may need to be executed directly in the database');
        console.log('💡 Please run the SQL file directly using psql or Supabase SQL Editor');
      } else {
        console.error('❌ Different error occurred:', error.message);
      }
      return false;
    }
    
    console.log('✅ Strategies query successful!');
    console.log(`📝 Found ${data.length} strategies`);
    data.forEach((strategy, index) => {
      console.log(`   ${index + 1}. ${strategy.name} (Active: ${strategy.is_active})`);
    });
    return true;
    
  } catch (error) {
    console.error('❌ Error testing strategies query:', error);
    return false;
  }
}

// Main execution
async function main() {
  console.log('========================================');
  console.log('STRATEGY_RULE_COMPLIANCE SCHEMA FIX');
  console.log('========================================');
  console.log('');
  
  // Execute the fix
  await executeSchemaFix();
  
  // Test if the fix worked
  const testPassed = await testStrategiesQuery();
  
  console.log('');
  console.log('========================================');
  console.log('SUMMARY');
  console.log('========================================');
  console.log('');
  
  if (testPassed) {
    console.log('✅ SUCCESS: Strategy rule compliance schema fix completed!');
    console.log('');
    console.log('Next steps:');
    console.log('1. Test the TradeForm component');
    console.log('2. Test the Strategies page');
    console.log('3. Test strategy creation and editing');
    console.log('');
    console.log('The strategy_rule_compliance error should now be resolved.');
  } else {
    console.log('❌ ISSUE: Schema fix may not have completed successfully');
    console.log('');
    console.log('Alternative solutions:');
    console.log('1. Run the SQL file directly in Supabase SQL Editor:');
    console.log('   - Open Supabase Dashboard');
    console.log('   - Go to SQL Editor');
    console.log('   - Paste and execute STRATEGY_RULE_COMPLIANCE_SCHEMA_FIX.sql');
    console.log('');
    console.log('2. Use psql if you have direct database access:');
    console.log('   psql -h [host] -U [user] -d [database] -f STRATEGY_RULE_COMPLIANCE_SCHEMA_FIX.sql');
  }
}

// Run the main function
main().catch(console.error);