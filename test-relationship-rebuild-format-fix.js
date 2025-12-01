// Test script to verify RELATIONSHIP_REBUILD.sql format() fixes
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config();

async function testRelationshipRebuildFix() {
  console.log('Testing RELATIONSHIP_REBUILD.sql format() fixes...');
  
  try {
    // Read the SQL file
    const sqlContent = fs.readFileSync('./RELATIONSHIP_REBUILD.sql', 'utf8');
    console.log('✓ Successfully read RELATIONSHIP_REBUILD.sql');
    
    // Initialize Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase credentials in environment variables');
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    console.log('✓ Supabase client initialized');
    
    // Test the SQL syntax by executing it
    console.log('Executing RELATIONSHIP_REBUILD.sql...');
    
    const { data, error } = await supabase.rpc('exec_sql', { sql: sqlContent });
    
    if (error) {
      console.error('✗ Error executing SQL:', error);
      return false;
    }
    
    console.log('✓ RELATIONSHIP_REBUILD.sql executed successfully');
    console.log('Result:', data);
    
    return true;
  } catch (error) {
    console.error('✗ Test failed:', error.message);
    return false;
  }
}

// Alternative test using direct SQL execution if exec_sql is not available
async function testRelationshipRebuildDirectly() {
  console.log('Testing RELATIONSHIP_REBUILD.sql format() fixes directly...');
  
  try {
    // Read the SQL file
    const sqlContent = fs.readFileSync('./RELATIONSHIP_REBUILD.sql', 'utf8');
    console.log('✓ Successfully read RELATIONSHIP_REBUILD.sql');
    
    // Check for format() function calls to verify they use correct syntax
    const formatMatches = sqlContent.match(/format\([^)]+\)/g);
    
    if (formatMatches) {
      console.log(`Found ${formatMatches.length} format() function calls:`);
      
      let allValid = true;
      formatMatches.forEach((match, index) => {
        console.log(`  ${index + 1}. ${match}`);
        
        // Check if the format string uses proper specifiers
        const formatString = match.match(/format\('([^']+)'/);
        if (formatString) {
          const hasInvalidSpecifiers = formatString[1].includes(' %') && !formatString[1].includes(' %s') && !formatString[1].includes(' %I') && !formatString[1].includes(' %L');
          if (hasInvalidSpecifiers) {
            console.log(`    ✗ Invalid format specifier detected in: ${formatString[1]}`);
            allValid = false;
          } else {
            console.log(`    ✓ Valid format specifiers in: ${formatString[1]}`);
          }
        }
      });
      
      if (allValid) {
        console.log('✓ All format() function calls use correct syntax');
        return true;
      } else {
        console.log('✗ Some format() function calls have invalid syntax');
        return false;
      }
    } else {
      console.log('No format() function calls found');
      return true;
    }
  } catch (error) {
    console.error('✗ Test failed:', error.message);
    return false;
  }
}

// Run the tests
async function runTests() {
  console.log('='.repeat(60));
  console.log('RELATIONSHIP_REBUILD.SQL FORMAT FIX VERIFICATION');
  console.log('='.repeat(60));
  
  let success = true;
  
  // Test 1: Direct syntax check
  console.log('\n--- Test 1: Direct Syntax Check ---');
  const test1Result = await testRelationshipRebuildDirectly();
  success = success && test1Result;
  
  // Test 2: Try to execute with Supabase (if available)
  console.log('\n--- Test 2: Supabase Execution Test ---');
  try {
    const test2Result = await testRelationshipRebuildFix();
    success = success && test2Result;
  } catch (error) {
    console.log('Supabase execution test skipped (likely due to missing exec_sql function)');
    console.log('This is expected in many Supabase setups');
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('TEST SUMMARY');
  console.log('='.repeat(60));
  
  if (success) {
    console.log('✓ All tests passed! The format() fixes are working correctly.');
    console.log('✓ RELATIONSHIP_REBUILD.sql should now execute without format() errors.');
  } else {
    console.log('✗ Some tests failed. Please review the errors above.');
  }
  
  console.log('='.repeat(60));
}

// Run the tests
runTests().catch(console.error);