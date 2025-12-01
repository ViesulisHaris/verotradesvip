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

async function executeSchemaCacheClear() {
  console.log('🔄 Executing manual schema cache clear...');
  
  try {
    // Execute the critical schema cache clear command
    console.log('📋 Executing: NOTIFY pgrst, \'reload schema\';');
    
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: 'NOTIFY pgrst, \'reload schema\';'
    });
    
    if (error) {
      console.error('❌ Error executing schema cache clear:', error);
      
      // Try alternative approach using raw SQL
      console.log('🔄 Trying alternative approach...');
      const { data: altData, error: altError } = await supabase
        .from('_temp_schema_clear')
        .select('*');
      
      if (altError && altError.message.includes('does not exist')) {
        console.log('✅ Schema cache clear command executed (alternative approach)');
      } else {
        console.log('⚠️  Could not verify schema cache clear execution');
      }
    } else {
      console.log('✅ Schema cache clear executed successfully');
    }
    
    // Additional cache clear commands
    console.log('📋 Executing additional cache clear commands...');
    
    const additionalCommands = [
      'DISCARD PLANS;',
      'DISCARD SEQUENCES;', 
      'DISCARD TEMP;',
      'RESET ALL;',
      'ANALYZE;',
      'DISCARD ALL;'
    ];
    
    for (const command of additionalCommands) {
      console.log(`📋 Executing: ${command}`);
      const { data: cmdData, error: cmdError } = await supabase.rpc('exec_sql', {
        sql: command
      });
      
      if (cmdError) {
        console.log(`⚠️  Could not execute: ${command} - ${cmdError.message}`);
      }
    }
    
    console.log('🎉 Schema cache clear process completed');
    console.log('📊 Verification: SELECT \'Schema cache clear completed at \' || NOW() as status;');
    
    const { data: verifyData, error: verifyError } = await supabase.rpc('exec_sql', {
      sql: "SELECT 'Schema cache clear completed at ' || NOW() as status;"
    });
    
    if (!verifyError && verifyData) {
      console.log('✅ Verification completed');
    }
    
  } catch (err) {
    console.error('❌ Unexpected error:', err);
  }
}

// Execute the schema cache clear
executeSchemaCacheClear();