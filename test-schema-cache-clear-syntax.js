// Test script to verify SCHEMA_CACHE_CLEAR.sql syntax
// This script checks if the SQL file has valid syntax before execution

const fs = require('fs');
const path = require('path');

function testSQLSyntax() {
  console.log('Testing SCHEMA_CACHE_CLEAR.sql syntax...\n');
  
  try {
    // Read the SQL file
    const sqlFilePath = path.join(__dirname, 'SCHEMA_CACHE_CLEAR.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Basic syntax checks
    const issues = [];
    
    // Check for the problematic ROLLBACK TO SAVEPOINT syntax that was causing errors
    if (sqlContent.includes('ROLLBACK TO SAVEPOINT')) {
      issues.push('Found ROLLBACK TO SAVEPOINT - this was causing the original syntax error');
    }
    
    // Check for unclosed DO blocks
    const doBlockMatches = sqlContent.match(/DO \$\$/g);
    const endBlockMatches = sqlContent.match(/\$\$;/g);
    
    if (doBlockMatches && endBlockMatches) {
      if (doBlockMatches.length !== endBlockMatches.length) {
        issues.push(`Mismatched DO blocks: ${doBlockMatches.length} opening, ${endBlockMatches.length} closing`);
      }
    } else if (doBlockMatches && !endBlockMatches) {
      issues.push('Found DO blocks without proper closing');
    }
    
    // Check for unclosed quote marks
    const singleQuotes = (sqlContent.match(/'/g) || []).length;
    if (singleQuotes % 2 !== 0) {
      issues.push(`Odd number of single quotes (${singleQuotes}) - possible unclosed string`);
      
      // Find lines with unbalanced quotes
      const lines = sqlContent.split('\n');
      lines.forEach((line, index) => {
        const lineQuotes = (line.match(/'/g) || []).length;
        if (lineQuotes % 2 !== 0) {
          issues.push(`  Line ${index + 1}: ${lineQuotes} quotes - "${line.trim()}"`);
        }
      });
    }
    
    // Check for basic SQL structure
    if (!sqlContent.includes('DISCARD PLANS')) {
      issues.push('Missing DISCARD PLANS statement');
    }
    
    if (!sqlContent.includes('ANALYZE')) {
      issues.push('Missing ANALYZE statement for statistics rebuild');
    }
    
    // Report results
    if (issues.length === 0) {
      console.log('✅ SYNTAX CHECK PASSED');
      console.log('✅ No problematic ROLLBACK TO SAVEPOINT statements found');
      console.log('✅ DO blocks appear to be properly closed');
      console.log('✅ Quote marks appear to be balanced');
      console.log('✅ Essential cache clearing statements are present');
      console.log('\nThe simplified SCHEMA_CACHE_CLEAR.sql should execute without syntax errors in Supabase.');
    } else {
      console.log('❌ SYNTAX ISSUES FOUND:');
      issues.forEach(issue => console.log(`  - ${issue}`));
    }
    
    // Show file statistics
    const lines = sqlContent.split('\n').length;
    console.log(`\nFile statistics:`);
    console.log(`  - Lines: ${lines}`);
    console.log(`  - Characters: ${sqlContent.length}`);
    console.log(`  - DO blocks: ${doBlockMatches ? doBlockMatches.length : 0}`);
    
    return issues.length === 0;
  } catch (error) {
    console.error('Error reading SQL file:', error.message);
    return false;
  }
}

// Run the test
const success = testSQLSyntax();
process.exit(success ? 0 : 1);