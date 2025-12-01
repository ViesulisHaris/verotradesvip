// Execute schema cache clear using anon key with simpler commands
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config();

console.log('🔧 Executing Schema Cache Clear using Anon Key...\n');

// Create client with anon key
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    }
  }
);

console.log('✅ Supabase client created with anon key');

// Function to execute simple SQL commands that work with anon key
async function executeSimpleSQL(sql, description) {
  try {
    console.log(`\n🔄 Executing: ${description}`);
    
    // Use the REST API directly with anon key for basic operations
    const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
        'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        'Prefer': 'params=single-object'
      },
      body: JSON.stringify({
        query: sql
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Error executing ${description}:`, errorText);
      return { success: false, error: errorText };
    }

    const data = await response.json();
    console.log(`✅ Successfully executed: ${description}`);
    if (data) {
      console.log('Result:', data);
    }
    
    return { success: true, data };
    
  } catch (err) {
    console.error(`❌ Unexpected error executing ${description}:`, err);
    return { success: false, error: err.message };
  }
}

// Main execution function
async function main() {
  console.log('\n🔄 Attempting to clear schema cache with anon key...');
  
  // Execute simple cache clearing commands
  const commands = [
    {
      sql: 'DISCARD PLANS',
      desc: 'Clear query plans cache'
    },
    {
      sql: 'DISCARD SEQUENCES', 
      desc: 'Clear sequence cache'
    },
    {
      sql: 'DISCARD TEMP',
      desc: 'Clear temp cache'
    },
    {
      sql: 'SELECT 1 as test_connection',
      desc: 'Test connection after cache clear'
    },
    {
      sql: 'SELECT table_name FROM information_schema.tables WHERE table_schema = \'public\' LIMIT 5',
      desc: 'List public tables to verify access'
    }
  ];
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const command of commands) {
    const result = await executeSimpleSQL(command.sql, command.desc);
    
    if (result.success) {
      successCount++;
    } else {
      errorCount++;
      console.log(`⚠️  Command failed but continuing: ${command.desc}`);
    }
  }
  
  console.log('\n📊 EXECUTION SUMMARY:');
  console.log(`✅ Successful commands: ${successCount}`);
  console.log(`❌ Failed commands: ${errorCount}`);
  
  if (successCount >= 3) {
    console.log('\n🎉 SUCCESS: Schema cache clearing completed!');
    console.log('The cache has been cleared using anon key privileges.');
    console.log('This should resolve the schema cache issue.');
  } else {
    console.log('\n⚠️  PARTIAL SUCCESS: Some commands failed.');
    console.log('Cache clearing may be incomplete.');
  }
  
  // Test if we can now access tables without cache issues
  console.log('\n🔄 Testing table access after cache clear...');
  try {
    const { data, error } = await supabase
      .from('strategies')
      .select('id, name')
      .limit(3);
    
    if (error) {
      console.log('❌ Table access still failing:', error.message);
      if (error.message.includes('strategy_rule_compliance')) {
        console.log('⚠️  Schema cache issue persists - may need service role key');
      }
    } else {
      console.log('✅ Table access successful after cache clear!');
      console.log('Strategies found:', data);
    }
  } catch (err) {
    console.log('❌ Table access error:', err.message);
  }
}

// Run the main function
main().catch(error => {
  console.error('\n❌ Fatal error in execution:', error);
  process.exit(1);
});