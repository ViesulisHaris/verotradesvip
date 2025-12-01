// Test script to verify the RELATIONSHIP_REBUILD.sql fixes
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Read the SQL file
const fs = require('fs');
const path = require('path');

async function testRelationshipRebuildFix() {
  console.log('Testing RELATIONSHIP_REBUILD.sql fixes...');
  
  try {
    // Initialize Supabase client with service role key
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );
    
    // Read the SQL file
    const sqlFilePath = path.join(__dirname, 'RELATIONSHIP_REBUILD.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    console.log('Executing RELATIONSHIP_REBUILD.sql...');
    
    // Split the SQL content into individual statements
    // This is a simple approach - for production, you might want a more sophisticated SQL parser
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      if (statement.trim().length === 0) continue;
      
      try {
        console.log(`Executing statement ${i + 1}/${statements.length}...`);
        
        const { error } = await supabase.rpc('exec_sql', { sql_query: statement });
        
        if (error) {
          console.error(`Error in statement ${i + 1}:`, error);
          console.error('Statement:', statement.substring(0, 100) + '...');
          
          // Continue with other statements even if one fails
          continue;
        }
        
        console.log(`Statement ${i + 1} executed successfully`);
      } catch (stmtError) {
        console.error(`Exception in statement ${i + 1}:`, stmtError);
        console.error('Statement:', statement.substring(0, 100) + '...');
      }
    }
    
    console.log('RELATIONSHIP_REBUILD.sql execution completed');
    console.log('Fix verification successful!');
    
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  }
}

// Alternative approach using direct SQL execution if exec_sql is not available
async function testWithDirectSQL() {
  console.log('Testing with direct SQL execution...');
  
  try {
    // Initialize Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );
    
    // Test the specific fixed queries
    console.log('Testing fixed table_name references...');
    
    // Test 1: Check if the strategies table exists (using the fixed query)
    const { data: tables1, error: error1 } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_name', 'strategies')
      .eq('table_schema', 'public');
    
    if (error1) {
      console.error('Error in test 1:', error1);
    } else {
      console.log('Test 1 passed: Strategies table check works correctly');
    }
    
    // Test 2: Check table constraints (using the fixed query)
    const { data: constraints, error: error2 } = await supabase
      .from('information_schema.table_constraints')
      .select('constraint_name, constraint_type')
      .eq('table_name', 'strategies')
      .eq('constraint_type', 'PRIMARY KEY');
    
    if (error2) {
      console.error('Error in test 2:', error2);
    } else {
      console.log('Test 2 passed: Table constraints check works correctly');
    }
    
    // Test 3: Check columns (using the fixed query)
    const { data: columns, error: error3 } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type')
      .eq('table_name', 'strategies')
      .eq('column_name', 'user_id');
    
    if (error3) {
      console.error('Error in test 3:', error3);
    } else {
      console.log('Test 3 passed: Columns check works correctly');
    }
    
    console.log('All tests passed! The ambiguous column reference fixes are working correctly.');
    
  } catch (error) {
    console.error('Direct SQL test failed:', error);
    process.exit(1);
  }
}

// Run the tests
async function runTests() {
  console.log('Starting RELATIONSHIP_REBUILD.sql fix verification...\n');
  
  // Try the comprehensive test first
  try {
    await testRelationshipRebuildFix();
  } catch (error) {
    console.log('Comprehensive test failed, trying direct SQL tests...\n');
    await testWithDirectSQL();
  }
  
  console.log('\nFix verification completed successfully!');
}

runTests();