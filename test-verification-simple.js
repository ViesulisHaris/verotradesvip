const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Simple test to check for syntax errors in VERIFICATION.sql
function testVerificationSyntax() {
  console.log('Testing VERIFICATION.sql for syntax errors...');
  
  try {
    // Read the VERIFICATION.sql file
    const sqlFilePath = path.join(__dirname, 'VERIFICATION.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    console.log('✅ VERIFICATION.sql file read successfully');
    
    // Check for common syntax issues
    const issues = [];
    
    // Check for unmatched quotes
    const singleQuotes = (sqlContent.match(/'/g) || []).length;
    if (singleQuotes % 2 !== 0) {
      issues.push('Unmatched single quotes detected');
    }
    
    // Check for unmatched parentheses
    const openParens = (sqlContent.match(/\(/g) || []).length;
    const closeParens = (sqlContent.match(/\)/g) || []).length;
    if (openParens !== closeParens) {
      issues.push('Unmatched parentheses detected');
    }
    
    // Check for DO blocks without proper END
    const doBlocks = (sqlContent.match(/DO \$\$/g) || []).length;
    const endBlocks = (sqlContent.match(/END \$\$/g) || []).length;
    if (doBlocks !== endBlocks) {
      issues.push('Mismatched DO blocks and END blocks');
    }
    
    // Check for the typo we fixed
    if (sqlContent.includes('CLEANSHIP')) {
      issues.push('Found typo: CLEANSIP should be CLEANUP');
    }
    
    // Check for format() function calls (which can cause issues)
    const formatCalls = sqlContent.match(/format\(/g);
    if (formatCalls) {
      console.log(`ℹ️  Found ${formatCalls.length} format() function calls`);
    }
    
    // Check for RAISE NOTICE statements
    const raiseNotices = sqlContent.match(/RAISE NOTICE/g);
    if (raiseNotices) {
      console.log(`ℹ️  Found ${raiseNotices.length} RAISE NOTICE statements`);
    }
    
    if (issues.length > 0) {
      console.log('\n❌ Issues found in VERIFICATION.sql:');
      issues.forEach(issue => console.log(`  - ${issue}`));
      return false;
    } else {
      console.log('\n✅ No syntax issues found in VERIFICATION.sql');
      return true;
    }
    
  } catch (error) {
    console.error('Error reading VERIFICATION.sql:', error);
    return false;
  }
}

// Test the structure of the verification script
function testVerificationStructure() {
  console.log('\nTesting VERIFICATION.sql structure...');
  
  try {
    const sqlFilePath = path.join(__dirname, 'VERIFICATION.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Check for key components
    const checks = [
      { name: 'Temporary table creation', pattern: /CREATE TEMP TABLE.*verification_results/ },
      { name: 'Initialization', pattern: /INSERT INTO verification_results[\s\S]*VERIFICATION_START/ },
      { name: 'Test 1: strategy_rule_compliance removal', pattern: /Test 1: Verifying strategy_rule_compliance/ },
      { name: 'Test 2: strategies table structure', pattern: /Test 2: Verifying strategies table/ },
      { name: 'Test 3: Foreign key relationships', pattern: /Test 3: Verifying foreign key/ },
      { name: 'Test 4: Performance indexes', pattern: /Test 4: Verifying indexes/ },
      { name: 'Test 5: RLS policies', pattern: /Test 5: Verifying RLS/ },
      { name: 'Test 6: Database operations', pattern: /Test 6: Testing basic database/ },
      { name: 'Final verification report', pattern: /Generate final verification report/ },
      { name: 'Results display', pattern: /SELECT.*FROM verification_results/ },
      { name: 'Cleanup', pattern: /DROP TABLE.*verification_results/ }
    ];
    
    const passedChecks = [];
    const failedChecks = [];
    
    checks.forEach(check => {
      if (check.pattern.test(sqlContent)) {
        passedChecks.push(check.name);
      } else {
        failedChecks.push(check.name);
      }
    });
    
    console.log(`\n✅ Passed checks (${passedChecks.length}):`);
    passedChecks.forEach(check => console.log(`  - ${check}`));
    
    if (failedChecks.length > 0) {
      console.log(`\n❌ Failed checks (${failedChecks.length}):`);
      failedChecks.forEach(check => console.log(`  - ${check}`));
      return false;
    }
    
    return true;
    
  } catch (error) {
    console.error('Error testing VERIFICATION.sql structure:', error);
    return false;
  }
}

// Run the tests
console.log('='.repeat(60));
console.log('VERIFICATION.SQL SYNTAX AND STRUCTURE TEST');
console.log('='.repeat(60));

const syntaxTest = testVerificationSyntax();
const structureTest = testVerificationStructure();

console.log('\n' + '='.repeat(60));
console.log('TEST SUMMARY');
console.log('='.repeat(60));

if (syntaxTest && structureTest) {
  console.log('✅ All tests passed! VERIFICATION.sql appears to be correct.');
  console.log('\nThe typo "CLEANSHIP" has been fixed to "CLEANUP".');
  console.log('The script should now execute without the verification test failures.');
} else {
  console.log('❌ Some tests failed. Please review the issues above.');
}

console.log('\nTo fully test the verification script, run it in Supabase SQL Editor.');