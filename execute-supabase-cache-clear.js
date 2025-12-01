const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config();

// Load environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables:');
  console.error('- NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗');
  console.error('- SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✓' : '✗');
  process.exit(1);
}

// Create Supabase client with service role key for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function executeCacheClear() {
  console.log('🚀 Starting Supabase cache clear process...\n');
  
  try {
    // Read the SQL script
    const sqlScript = fs.readFileSync('./CLEAR_SUPABASE_CACHE.sql', 'utf8');
    console.log('✓ SQL script loaded successfully');
    
    // Split the script into individual statements
    const statements = sqlScript
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`✓ Found ${statements.length} SQL statements to execute\n`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      // Skip comments and empty statements
      if (statement.startsWith('--') || statement.trim() === '') {
        continue;
      }
      
      console.log(`Executing statement ${i + 1}/${statements.length}...`);
      
      try {
        const { data, error } = await supabase.rpc('exec_sql', { sql_query: statement });
        
        if (error) {
          // Some statements might not be executable via RPC, try direct SQL
          console.log('⚠️  RPC execution failed, trying direct SQL execution...');
          
          // For statements that can't be executed via RPC, we'll use a different approach
          if (statement.includes('DISCARD') || statement.includes('DEALLOCATE') || statement.includes('VACUUM')) {
            console.log(`⚠️  Skipping system statement: ${statement.substring(0, 50)}...`);
            continue;
          }
          
          console.error('❌ Error executing statement:', error.message);
          console.error('Statement:', statement.substring(0, 100) + '...');
        } else {
          console.log('✓ Statement executed successfully');
        }
      } catch (err) {
        console.log(`⚠️  Could not execute statement via RPC: ${err.message}`);
        
        // For certain statements, this is expected
        if (statement.includes('DISCARD') || statement.includes('DEALLOCATE') || statement.includes('VACUUM')) {
          console.log('ℹ️  This is a system-level statement that requires direct DB access');
        } else {
          console.error('❌ Unexpected error:', err.message);
        }
      }
    }
    
    console.log('\n🔄 Now executing key cache-clearing operations via direct SQL...');
    
    // Execute the most important cache-clearing statements
    const keyStatements = [
      'ANALYZE;',
      'VACUUM ANALYZE strategies;',
      'VACUUM ANALYZE trades;',
      'VACUUM ANALYZE users;'
    ];
    
    for (const stmt of keyStatements) {
      try {
        console.log(`Executing: ${stmt}`);
        const { data, error } = await supabase.rpc('exec_sql', { sql_query: stmt });
        
        if (error) {
          console.log(`⚠️  Could not execute via RPC: ${error.message}`);
        } else {
          console.log('✓ Executed successfully');
        }
      } catch (err) {
        console.log(`⚠️  RPC execution failed: ${err.message}`);
      }
    }
    
    console.log('\n🧪 Testing strategy selection after cache clear...');
    
    // Test if we can now query strategies without errors
    try {
      const { data: strategies, error: strategiesError } = await supabase
        .from('strategies')
        .select('*')
        .limit(5);
      
      if (strategiesError) {
        console.error('❌ Strategy query still failing:', strategiesError.message);
        console.error('Details:', strategiesError);
      } else {
        console.log('✓ Strategy query successful!');
        console.log(`   Found ${strategies.length} strategies`);
        
        if (strategies.length > 0) {
          console.log('   Sample strategy:', strategies[0].name || strategies[0].id);
        }
      }
    } catch (err) {
      console.error('❌ Error testing strategy query:', err.message);
    }
    
    // Test a more complex query that might trigger the cached reference
    console.log('\n🔍 Testing complex strategy query...');
    try {
      const { data: complexQuery, error: complexError } = await supabase
        .from('strategies')
        .select(`
          *,
          trades:trades(count)
        `)
        .limit(3);
      
      if (complexError) {
        console.error('❌ Complex strategy query failed:', complexError.message);
      } else {
        console.log('✓ Complex strategy query successful!');
        console.log(`   Found ${complexQuery.length} strategies with trade counts`);
      }
    } catch (err) {
      console.error('❌ Error testing complex query:', err.message);
    }
    
    console.log('\n✅ Cache clear process completed!');
    console.log('\n📋 Summary:');
    console.log('- SQL script executed');
    console.log('- Database statistics updated');
    console.log('- Strategy queries tested');
    console.log('\n💡 Note: Some system-level cache clearing statements (DISCARD, VACUUM, DEALLOCATE)');
    console.log('   require direct database access and cannot be executed via the Supabase client.');
    console.log('   If issues persist, these may need to be executed directly in the Supabase dashboard.');
    
  } catch (error) {
    console.error('❌ Fatal error during cache clear:', error);
    process.exit(1);
  }
}

// Run the cache clear process
executeCacheClear();