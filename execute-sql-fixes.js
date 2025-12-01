const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config();

// Initialize Supabase client with service role key
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function executeSqlFile(filename, description) {
  try {
    console.log(`\n===========================================`);
    console.log(`Executing: ${description}`);
    console.log(`File: ${filename}`);
    console.log(`===========================================`);
    
    // Read SQL script
    const sqlScript = fs.readFileSync(filename, 'utf8');
    
    // Split the script into individual statements
    const statements = sqlScript
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`Found ${statements.length} SQL statements to execute`);
    
    let successCount = 0;
    let errorCount = 0;
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      try {
        // Skip RAISE NOTICE and other non-executable statements
        if (statement.toUpperCase().includes('RAISE NOTICE') || 
            statement.toUpperCase().includes('DO $$') ||
            statement.toUpperCase().includes('END $$') ||
            statement.trim() === '') {
          continue;
        }
        
        console.log(`\nExecuting statement ${i + 1}/${statements.length}:`);
        console.log(`${statement.substring(0, 100)}${statement.length > 100 ? '...' : ''}`);
        
        const { data, error } = await supabase.rpc('exec_sql', { sql: statement });
        
        if (error) {
          console.error(`Error in statement ${i + 1}:`, error);
          errorCount++;
        } else {
          console.log(`Statement ${i + 1} executed successfully`);
          if (data) {
            console.log('Result:', data);
          }
          successCount++;
        }
      } catch (err) {
        console.error(`Unexpected error in statement ${i + 1}:`, err.message);
        errorCount++;
      }
    }
    
    console.log(`\nExecution summary for ${filename}:`);
    console.log(`Successful statements: ${successCount}`);
    console.log(`Failed statements: ${errorCount}`);
    
    return { successCount, errorCount };
    
  } catch (err) {
    console.error(`Error reading or executing ${filename}:`, err);
    return { successCount: 0, errorCount: 1 };
  }
}

async function executeAllFixes() {
  console.log('Starting SQL fix execution process...');
  
  // Execute scripts in order
  const scripts = [
    { file: 'SCHEMA_CACHE_CLEAR.sql', desc: 'Schema Cache Clear' },
    { file: 'RELATIONSHIP_REBUILD.sql', desc: 'Relationship Rebuild' },
    { file: 'VERIFICATION.sql', desc: 'Verification' }
  ];
  
  let totalSuccess = 0;
  let totalErrors = 0;
  
  for (const script of scripts) {
    const result = await executeSqlFile(script.file, script.desc);
    totalSuccess += result.successCount;
    totalErrors += result.errorCount;
    
    if (result.errorCount > 0) {
      console.log(`\nWARNING: ${script.file} had ${result.errorCount} errors`);
    } else {
      console.log(`\nSUCCESS: ${script.file} executed without errors`);
    }
  }
  
  console.log('\n===========================================');
  console.log('FINAL EXECUTION SUMMARY');
  console.log('===========================================');
  console.log(`Total successful statements: ${totalSuccess}`);
  console.log(`Total failed statements: ${totalErrors}`);
  
  if (totalErrors === 0) {
    console.log('\n✅ ALL SQL FIXES EXECUTED SUCCESSFULLY');
    console.log('The database issues should now be resolved.');
  } else {
    console.log(`\n⚠️  EXECUTION COMPLETED WITH ${totalErrors} ERRORS`);
    console.log('Some issues may not be fully resolved.');
  }
}

// Run the execution
executeAllFixes().catch(console.error);