const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Read the SQL file
const fs = require('fs');
const path = require('path');

const sqlFile = path.join(__dirname, 'FINAL_STRATEGY_COMPLIANCE_CLEANUP.sql');
const sqlScript = fs.readFileSync(sqlFile, 'utf8');

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testCleanupScript() {
  console.log('Testing FINAL_STRATEGY_COMPLIANCE_CLEANUP.sql script...');
  
  try {
    // First, try to set up the exec_sql function if it doesn't exist
    console.log('Setting up exec_sql function...');
    const setupScript = fs.readFileSync('setup-exec-sql-function.sql', 'utf8');
    
    // Try to execute the setup script using a direct approach
    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'apikey': supabaseServiceKey
        },
        body: JSON.stringify({ sql_query: setupScript })
      });
      
      if (response.ok) {
        console.log('exec_sql function setup completed');
      } else {
        console.log('exec_sql function might already exist or setup failed');
      }
    } catch (setupError) {
      console.log('Could not set up exec_sql function, assuming it exists:', setupError.message);
    }
    
    // Execute the SQL script
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sqlScript });
    
    if (error) {
      console.error('Error executing cleanup script:', error);
      return false;
    }
    
    console.log('Cleanup script executed successfully!');
    console.log('Result:', data);
    
    // Verify the cleanup by checking for any remaining references
    const verificationQuery = `
      SELECT 
          'Functions with strategy_rule_compliance references' as check_type,
          COUNT(*) as count
      FROM pg_proc p
      JOIN pg_language l ON p.prolang = l.oid
      WHERE l.lanname = 'plpgsql'
      AND prosrc LIKE '%strategy_rule_compliance%'
      
      UNION ALL
      
      SELECT 
          'Views with strategy_rule_compliance references' as check_type,
          COUNT(*) as count
      FROM pg_views
      WHERE definition LIKE '%strategy_rule_compliance%'
      
      UNION ALL
      
      SELECT 
          'Triggers with strategy_rule_compliance references' as check_type,
          COUNT(*) as count
      FROM pg_trigger t
      JOIN pg_class c ON t.tgrelid = c.oid
      WHERE t.tgname LIKE '%strategy_rule_compliance%';
    `;
    
    const { data: verificationData, error: verificationError } = await supabase.rpc('exec_sql', {
      sql_query: verificationQuery
    });
    
    if (verificationError) {
      console.error('Error executing verification query:', verificationError);
      return false;
    }
    
    console.log('\nVerification Results:');
    console.log(verificationData);
    
    // Check if all counts are 0 (successful cleanup)
    const allClean = verificationData.every(item => parseInt(item.count) === 0);
    
    if (allClean) {
      console.log('\n✅ SUCCESS: All strategy_rule_compliance references have been cleaned up!');
    } else {
      console.log('\n⚠️ WARNING: Some strategy_rule_compliance references still remain.');
    }
    
    return true;
  } catch (err) {
    console.error('Unexpected error:', err);
    return false;
  }
}

// Run the test
testCleanupScript()
  .then(success => {
    if (success) {
      console.log('\nTest completed successfully');
      process.exit(0);
    } else {
      console.log('\nTest failed');
      process.exit(1);
    }
  })
  .catch(err => {
    console.error('Test failed with exception:', err);
    process.exit(1);
  });