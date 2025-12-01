// Test script to verify the RELATIONSHIP_REBUILD.sql table fix
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// ANSI color codes for better output formatting
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

// Validate JWT token format
function isValidJWT(token) {
  if (!token) return false;
  
  // JWT tokens have 3 parts separated by dots
  const parts = token.split('.');
  if (parts.length !== 3) return false;
  
  try {
    // Try to decode the header (first part)
    const header = JSON.parse(Buffer.from(parts[0], 'base64').toString());
    // Check if it has required fields
    return header.alg && header.typ;
  } catch (e) {
    return false;
  }
}

// Supabase connection details
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  logError('Missing Supabase credentials. Please check your environment variables.');
  log('\n📋 Required environment variables:', 'bright');
  log('- NEXT_PUBLIC_SUPABASE_URL', 'yellow');
  log('- SUPABASE_SERVICE_ROLE_KEY', 'yellow');
  log('\n💡 To get the correct credentials:', 'blue');
  log('1. Go to your Supabase dashboard: https://supabase.com/dashboard/project/bzmixuxautbmqbrqtufx', 'blue');
  log('2. Navigate to Settings → API', 'blue');
  log('3. Copy the Project URL and service_role key', 'blue');
  log('4. Update your .env file with these values', 'blue');
  process.exit(1);
}

// Validate the format of the API keys
if (!isValidJWT(supabaseServiceKey)) {
  logError('SERVICE_ROLE_KEY is not in valid JWT format');
  logWarning('Valid JWT should start with "eyJhbGciOiJIUzI1NiIs..."');
  logWarning('Your key appears to be invalid or from a different project');
  log('\n💡 To fix this issue:', 'blue');
  log('1. Get the correct service_role key from your Supabase dashboard', 'blue');
  log('2. Update your .env file with the correct key', 'blue');
  log('3. Run node test-supabase-credentials.js to verify your credentials', 'blue');
  process.exit(1);
}

// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Read the SQL file
const fs = require('fs');
const path = require('path');

const sqlFilePath = path.join(__dirname, 'RELATIONSHIP_REBUILD.sql');
const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

async function testRelationshipRebuildFix() {
  log('\n🔍 Testing RELATIONSHIP_REBUILD.sql fix for missing table error...', 'bright');
  
  try {
    logInfo('Executing RELATIONSHIP_REBUILD.sql...');
    
    // Split the SQL content into individual statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      // Skip empty statements or comments
      if (!statement || statement.startsWith('--') || statement.startsWith('/*')) {
        continue;
      }
      
      try {
        logInfo(`Executing statement ${i + 1}/${statements.length}...`);
        
        // Execute the SQL statement
        const { data, error } = await supabase.rpc('exec_sql', { sql_query: statement });
        
        if (error) {
          // Check if it's the specific error we're trying to fix
          if (error.message && error.message.includes('relation "relationship_fix_log" does not exist')) {
            logError('The original error still exists: ' + error.message);
            log('\n🔧 Possible solutions:', 'yellow');
            log('1. Make sure you have run the RELATIONSHIP_REBUILD.sql script completely', 'yellow');
            log('2. Check if there were any errors during the script execution', 'yellow');
            log('3. Verify your Supabase credentials have sufficient permissions', 'yellow');
            return false;
          } else if (error.message && error.message.includes('function exec_sql')) {
            logError('exec_sql function does not exist in your Supabase project');
            log('\n🔧 To fix this issue:', 'blue');
            log('1. Run setup-exec-sql-function.sql in your Supabase SQL Editor', 'blue');
            log('2. Go to https://supabase.com/dashboard/project/bzmixuxautbmqbrqtufx/sql', 'blue');
            log('3. Click "New Query" and paste the SQL from setup-exec-sql-function.sql', 'blue');
            log('4. Run the script to create the exec_sql function', 'blue');
            log('5. Run this test script again', 'blue');
            return false;
          } else if (error.message && (error.message.includes('JWT') || error.message.includes('invalid'))) {
            logError('API key authentication failed: ' + error.message);
            log('\n🔧 To fix this issue:', 'blue');
            log('1. Get the correct service_role key from your Supabase dashboard', 'blue');
            log('2. Update your .env file with the correct key', 'blue');
            log('3. Run node test-supabase-credentials.js to verify your credentials', 'blue');
            return false;
          } else {
            logWarning('Warning: ' + error.message);
          }
        } else {
          logSuccess('Statement executed successfully');
        }
      } catch (err) {
        // Check if it's the specific error we're trying to fix
        if (err.message && err.message.includes('relation "relationship_fix_log" does not exist')) {
          logError('The original error still exists: ' + err.message);
          log('\n🔧 Possible solutions:', 'yellow');
          log('1. Make sure you have run the RELATIONSHIP_REBUILD.sql script completely', 'yellow');
          log('2. Check if there were any errors during the script execution', 'yellow');
          log('3. Verify your Supabase credentials have sufficient permissions', 'yellow');
          return false;
        } else if (err.message && err.message.includes('function exec_sql')) {
          logError('exec_sql function does not exist in your Supabase project');
          log('\n🔧 To fix this issue:', 'blue');
          log('1. Run setup-exec-sql-function.sql in your Supabase SQL Editor', 'blue');
          log('2. Go to https://supabase.com/dashboard/project/bzmixuxautbmqbrqtufx/sql', 'blue');
          log('3. Click "New Query" and paste the SQL from setup-exec-sql-function.sql', 'blue');
          log('4. Run the script to create the exec_sql function', 'blue');
          log('5. Run this test script again', 'blue');
          return false;
        } else if (err.message && (err.message.includes('JWT') || err.message.includes('invalid'))) {
          logError('API key authentication failed: ' + err.message);
          log('\n🔧 To fix this issue:', 'blue');
          log('1. Get the correct service_role key from your Supabase dashboard', 'blue');
          log('2. Update your .env file with the correct key', 'blue');
          log('3. Run node test-supabase-credentials.js to verify your credentials', 'blue');
          return false;
        } else {
          logWarning('Warning: ' + err.message);
        }
      }
    }
    
    logSuccess('RELATIONSHIP_REBUILD.sql executed without the "relationship_fix_log does not exist" error');
    logSuccess('The fix successfully resolves the missing table issue.');
    return true;
    
  } catch (error) {
    logError('Error executing RELATIONSHIP_REBUILD.sql: ' + error.message);
    if (error.message && error.message.includes('function exec_sql')) {
      log('\n🔧 To fix this issue:', 'blue');
      log('1. Run setup-exec-sql-function.sql in your Supabase SQL Editor', 'blue');
      log('2. Go to https://supabase.com/dashboard/project/bzmixuxautbmqbrqtufx/sql', 'blue');
      log('3. Click "New Query" and paste the SQL from setup-exec-sql-function.sql', 'blue');
      log('4. Run the script to create the exec_sql function', 'blue');
      log('5. Run this test script again', 'blue');
    }
    return false;
  }
}

// Alternative test using direct SQL execution
async function testWithDirectSQL() {
  log('\n🔍 Testing with direct SQL execution...', 'bright');
  
  try {
    // Create a test version of the problematic part of the script
    const testSQL = `
    -- Start transaction
    BEGIN;
    
    -- Create the temporary table
    CREATE TEMP TABLE IF NOT EXISTS relationship_fix_log (
        step_number INTEGER,
        operation TEXT,
        table_name TEXT,
        constraint_name TEXT,
        status TEXT,
        message TEXT,
        created_at TIMESTAMP DEFAULT NOW()
    );
    
    -- Insert a test record
    INSERT INTO relationship_fix_log (step_number, operation, table_name, status, message)
    VALUES (1, 'TEST', 'test_table', 'INFO', 'Testing table creation');
    
    -- Get the error count (this was failing before)
    SELECT COUNT(*) as error_count FROM relationship_fix_log WHERE status = 'ERROR';
    
    -- Drop the table
    DROP TABLE IF EXISTS relationship_fix_log;
    
    -- Commit transaction
    COMMIT;
    `;
    
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: testSQL });
    
    if (error) {
      if (error.message && error.message.includes('function exec_sql')) {
        logError('exec_sql function does not exist in your Supabase project');
        log('\n🔧 To fix this issue:', 'blue');
        log('1. Run setup-exec-sql-function.sql in your Supabase SQL Editor', 'blue');
        log('2. Go to https://supabase.com/dashboard/project/bzmixuxautbmqbrqtufx/sql', 'blue');
        log('3. Click "New Query" and paste the SQL from setup-exec-sql-function.sql', 'blue');
        log('4. Run the script to create the exec_sql function', 'blue');
        log('5. Run this test script again', 'blue');
      } else if (error.message && (error.message.includes('JWT') || error.message.includes('invalid'))) {
        logError('API key authentication failed: ' + error.message);
        log('\n🔧 To fix this issue:', 'blue');
        log('1. Get the correct service_role key from your Supabase dashboard', 'blue');
        log('2. Update your .env file with the correct key', 'blue');
        log('3. Run node test-supabase-credentials.js to verify your credentials', 'blue');
      } else {
        logError('Direct SQL test failed: ' + error.message);
      }
      return false;
    }
    
    logSuccess('Direct SQL test passed');
    return true;
    
  } catch (error) {
    if (error.message && error.message.includes('function exec_sql')) {
      logError('exec_sql function does not exist in your Supabase project');
      log('\n🔧 To fix this issue:', 'blue');
      log('1. Run setup-exec-sql-function.sql in your Supabase SQL Editor', 'blue');
      log('2. Go to https://supabase.com/dashboard/project/bzmixuxautbmqbrqtufx/sql', 'blue');
      log('3. Click "New Query" and paste the SQL from setup-exec-sql-function.sql', 'blue');
      log('4. Run the script to create the exec_sql function', 'blue');
      log('5. Run this test script again', 'blue');
    } else if (error.message && (error.message.includes('JWT') || error.message.includes('invalid'))) {
      logError('API key authentication failed: ' + error.message);
      log('\n🔧 To fix this issue:', 'blue');
      log('1. Get the correct service_role key from your Supabase dashboard', 'blue');
      log('2. Update your .env file with the correct key', 'blue');
      log('3. Run node test-supabase-credentials.js to verify your credentials', 'blue');
    } else {
      logError('Direct SQL test error: ' + error.message);
    }
    return false;
  }
}

// Run the tests
async function runTests() {
  log('\n' + '='.repeat(80), 'cyan');
  log('RELATIONSHIP_REBUILD.SQL TABLE FIX TEST', 'bright');
  log('='.repeat(80), 'cyan');
  
  const test1 = await testRelationshipRebuildFix();
  const test2 = await testWithDirectSQL();
  
  log('\n' + '='.repeat(80), 'cyan');
  log('TEST SUMMARY', 'bright');
  log('='.repeat(80), 'cyan');
  
  if (test1 && test2) {
    logSuccess('ALL TESTS PASSED');
    logSuccess('The RELATIONSHIP_REBUILD.sql fix successfully resolves the missing table error.');
  } else {
    logError('SOME TESTS FAILED');
    logError('The fix may not have fully resolved the issue.');
    log('\n📋 Next steps:', 'bright');
    log('1. Run node test-supabase-credentials.js to verify your Supabase credentials', 'yellow');
    log('2. Run setup-exec-sql-function.sql in your Supabase SQL Editor', 'yellow');
    log('3. Update your .env file with the correct API keys', 'yellow');
    log('4. Run this test script again after fixing the issues', 'yellow');
  }
  
  log('='.repeat(80), 'cyan');
}

// Run the tests
runTests().catch(console.error);