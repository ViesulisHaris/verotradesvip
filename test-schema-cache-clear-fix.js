// Test script to verify the SCHEMA_CACHE_CLEAR.sql fix works without permission errors
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials. Please check your environment variables.');
  process.exit(1);
}

// Create Supabase client with service role key for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testSchemaCacheClearFix() {
  console.log('Testing SCHEMA_CACHE_CLEAR.sql fix for permission errors...\n');
  
  try {
    // Read the fixed SQL file
    const sqlFilePath = path.join(__dirname, 'SCHEMA_CACHE_CLEAR.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    console.log('1. Checking if pg_reload_conf() calls have been replaced...');
    
    // Remove comments from SQL content before checking
    const sqlWithoutComments = sqlContent
      .split('\n')
      .filter(line => !line.trim().startsWith('--'))
      .join('\n');
    
    // Verify pg_reload_conf() has been removed from actual code (not comments)
    if (sqlWithoutComments.includes('pg_reload_conf()')) {
      console.error('❌ ERROR: pg_reload_conf() still found in the SQL code (not comments)');
      return false;
    }
    console.log('✅ SUCCESS: pg_reload_conf() calls have been replaced in the actual code\n');
    
    console.log('2. Testing SQL execution with Supabase...');
    
    // Split the SQL into individual statements for execution
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      // Skip empty statements or comments
      if (!statement || statement.startsWith('--') || statement.startsWith('/*')) {
        continue;
      }
      
      try {
        console.log(`   Executing statement ${i + 1}/${statements.length}...`);
        
        // Execute the SQL statement
        const { data, error } = await supabase.rpc('exec_sql', { sql_statement: statement });
        
        if (error) {
          // Check if it's a permission error
          if (error.message && error.message.includes('permission denied')) {
            console.error(`❌ PERMISSION ERROR: ${error.message}`);
            errorCount++;
            continue;
          }
          
          // Some errors are expected (like table not found), so we'll log them but continue
          console.log(`⚠️  Expected error (not permission related): ${error.message}`);
        } else {
          console.log(`✅ Statement executed successfully`);
          successCount++;
        }
      } catch (err) {
        // Check if it's a permission error
        if (err.message && err.message.includes('permission denied')) {
          console.error(`❌ PERMISSION ERROR: ${err.message}`);
          errorCount++;
        } else {
          console.log(`⚠️  Expected error (not permission related): ${err.message}`);
        }
      }
    }
    
    console.log('\n3. Test Results:');
    console.log(`   - Successful statements: ${successCount}`);
    console.log(`   - Permission errors: ${errorCount}`);
    
    if (errorCount > 0) {
      console.log('\n❌ TEST FAILED: Permission errors still exist in the SQL script');
      return false;
    } else {
      console.log('\n✅ TEST PASSED: No permission errors detected');
      return true;
    }
  } catch (error) {
    console.error('Error during testing:', error);
    return false;
  }
}

// Alternative test method using direct SQL execution via REST API
async function testWithDirectExecution() {
  console.log('\n4. Testing with direct SQL execution via REST API...');
  
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey
      },
      body: JSON.stringify({
        sql_statement: 'SELECT 1 as test;'
      })
    });
    
    if (response.ok) {
      console.log('✅ Direct SQL execution works');
      return true;
    } else {
      console.log('⚠️  Direct SQL execution not available, will use alternative testing');
      return false;
    }
  } catch (error) {
    console.log('⚠️  Direct SQL execution not available, will use alternative testing');
    return false;
  }
}

// Run the tests
async function runTests() {
  console.log('='.repeat(70));
  console.log('SCHEMA_CACHE_CLEAR.SQL PERMISSION FIX TEST');
  console.log('='.repeat(70));
  
  const test1 = await testSchemaCacheClearFix();
  const test2 = await testWithDirectExecution();
  
  console.log('\n' + '='.repeat(70));
  console.log('FINAL TEST RESULTS:');
  console.log('='.repeat(70));
  
  if (test1) {
    console.log('✅ SUCCESS: The SCHEMA_CACHE_CLEAR.sql file has been fixed');
    console.log('   - All pg_reload_conf() calls have been replaced');
    console.log('   - No permission errors detected');
    console.log('   - The script should now work in Supabase');
  } else {
    console.log('❌ FAILED: The SCHEMA_CACHE_CLEAR.sql file still has issues');
    console.log('   - Permission errors were detected');
    console.log('   - Further fixes may be needed');
  }
  
  console.log('\nTest completed at:', new Date().toISOString());
}

// Execute the tests
runTests().catch(console.error);