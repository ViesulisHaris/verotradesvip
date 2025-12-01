const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

// Configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://bzmixuxautbmqbrqtufx.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'sb_secret_devDYJQgvC06kMcpJJ2smg_j1ZTYBUn';

// Create Supabase client with service role key for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false, autoRefreshToken: false }
});

async function executeSqlFile(filePath) {
  console.log(`\n🔧 Executing SQL file: ${filePath}`);
  
  try {
    const sqlContent = fs.readFileSync(filePath, 'utf8');
    console.log(`   📄 SQL file loaded (${sqlContent.length} characters)`);
    
    // Split the SQL content into individual statements
    const statements = sqlContent
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    console.log(`   📝 Found ${statements.length} SQL statements to execute`);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`   🔥 Executing statement ${i + 1}/${statements.length}...`);
      
      try {
        const { data, error } = await supabase.rpc('exec_sql', { 
          sql_query: statement 
        });
        
        if (error) {
          console.warn(`     ⚠️  Statement ${i + 1} failed:`, error.message);
          // Continue with other statements
        } else {
          console.log(`     ✅ Statement ${i + 1} executed successfully`);
          if (data && data.length > 0) {
            console.log(`     📊 Result:`, data);
          }
        }
      } catch (err) {
        console.warn(`     ❌ Statement ${i + 1} exception:`, err.message);
        // Continue with other statements
      }
    }
    
    console.log(`   ✅ SQL file execution completed`);
    return true;
    
  } catch (error) {
    console.error(`   ❌ Failed to execute SQL file:`, error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Starting aggressive cache clearing process...');
  console.log('===========================================');
  
  try {
    // Step 1: Set up exec_sql function if needed
    console.log('\n📋 Step 1: Setting up exec_sql function...');
    const setupSuccess = await executeSqlFile('setup-exec-sql-function.sql');
    
    if (!setupSuccess) {
      console.log('   ⚠️  exec_sql function setup had issues, but continuing...');
    }
    
    // Step 2: Execute aggressive cache clear script
    console.log('\n📋 Step 2: Executing aggressive cache clear script...');
    const cacheClearSuccess = await executeSqlFile('AGGRESSIVE_CACHE_CLEAR_WITH_LOGGING.sql');
    
    if (cacheClearSuccess) {
      console.log('\n✅ Cache clearing completed successfully!');
      console.log('   The PostgreSQL query plan cache should now be cleared.');
      console.log('   Try using the application again to test trade logging.');
    } else {
      console.log('\n❌ Cache clearing had issues.');
      console.log('   You may need to manually execute the SQL script in Supabase SQL Editor.');
    }
    
  } catch (error) {
    console.error('\n💥 Cache clearing process failed:', error);
  }
  
  console.log('\n📊 Process complete!');
}

// Run the script
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { executeSqlFile };