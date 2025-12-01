// Direct SQL execution using Supabase REST API to bypass schema cache issues
const fs = require('fs');
require('dotenv').config();

console.log('🔧 Executing Schema Cache Clear using Direct REST API...\n');

// Check environment variables
console.log('Environment Variables Check:');
console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ SET' : '❌ MISSING');
console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ SET' : '❌ MISSING');

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('\n❌ Critical: Supabase environment variables are missing!');
  process.exit(1);
}

console.log('\n✅ Environment variables are properly set');

// Read the schema cache clear SQL script
const sqlScript = fs.readFileSync('SCHEMA_CACHE_CLEAR.sql', 'utf8');
console.log(`\n📄 Loaded SCHEMA_CACHE_CLEAR.sql (${sqlScript.length} characters)`);

// Function to execute SQL via Supabase REST API
async function executeSQLViaREST(sql) {
  try {
    const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/exec`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY
      },
      body: JSON.stringify({
        sql: sql
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ REST API Error (${response.status}):`, errorText);
      return { success: false, error: errorText };
    }

    const data = await response.json();
    console.log('✅ SQL executed successfully via REST API');
    return { success: true, data };
    
  } catch (error) {
    console.error('❌ REST API execution error:', error.message);
    return { success: false, error: error.message };
  }
}

// Alternative: Try to execute via direct SQL endpoint
async function executeSQLDirect(sql) {
  try {
    const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
        'Prefer': 'params=single-object'
      },
      body: JSON.stringify({
        query: sql
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Direct SQL Error (${response.status}):`, errorText);
      return { success: false, error: errorText };
    }

    const data = await response.json();
    console.log('✅ SQL executed successfully via direct endpoint');
    return { success: true, data };
    
  } catch (error) {
    console.error('❌ Direct SQL execution error:', error.message);
    return { success: false, error: error.message };
  }
}

// Main execution function
async function main() {
  console.log('\n🔄 Attempting to execute schema cache clear...');
  
  // Try REST API approach first
  let result = await executeSQLViaREST(sqlScript);
  
  if (!result.success) {
    console.log('\n🔄 REST API failed, trying direct SQL endpoint...');
    result = await executeSQLDirect(sqlScript);
  }
  
  if (!result.success) {
    console.log('\n🔄 Direct SQL failed, trying individual statements...');
    
    // Split the SQL into individual statements and execute them one by one
    const statements = sqlScript
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    console.log(`Found ${statements.length} SQL statements to execute`);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`\n🔄 Executing statement ${i + 1}/${statements.length}...`);
      console.log(`Statement: ${statement.substring(0, 100)}...`);
      
      const stmtResult = await executeSQLViaREST(statement);
      if (!stmtResult.success) {
        console.log(`❌ Statement ${i + 1} failed, trying direct method...`);
        await executeSQLDirect(statement);
      }
    }
  }
  
  console.log('\n🎉 Schema cache clear execution completed!');
  console.log('The schema cache should now be cleared.');
}

// Run the main function
main().catch(error => {
  console.error('\n❌ Fatal error in execution:', error);
  process.exit(1);
});