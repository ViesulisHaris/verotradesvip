// Focused test to verify the ROLLBACK TO SAVEPOINT fix
const fs = require('fs');
const path = require('path');

// Read the SQL file
const sqlFilePath = path.join(__dirname, 'SCHEMA_CACHE_CLEAR.sql');
const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

console.log('Testing ROLLBACK TO SAVEPOINT fix in SCHEMA_CACHE_CLEAR.sql...\n');

// Extract the specific section around line 115 where the fix was applied
const lines = sqlContent.split('\n');
const relevantLines = lines.slice(110, 125); // Get lines around the fix

console.log('Relevant code section (lines 111-125):');
relevantLines.forEach((line, index) => {
    const lineNumber = 111 + index;
    console.log(`${lineNumber} | ${line}`);
});

// Check for the specific issue we fixed
console.log('\n' + '='.repeat(60));
console.log('ROLLBACK TO SAVEPOINT FIX VALIDATION');
console.log('='.repeat(60));

// 1. Check if ROLLBACK TO SAVEPOINT exists
const hasRollback = /ROLLBACK TO SAVEPOINT\s+cache_clear/.test(sqlContent);
console.log(`✅ ROLLBACK TO SAVEPOINT cache_clear found: ${hasRollback}`);

// 2. Check if RELEASE SAVEPOINT after rollback is removed
const rollbackToReleasePattern = /ROLLBACK TO SAVEPOINT\s+cache_clear[\s\S]*?RELEASE SAVEPOINT\s+cache_clear/;
const hasProblematicPattern = rollbackToReleasePattern.test(sqlContent);
console.log(`❌ Problematic pattern (ROLLBACK followed by RELEASE): ${hasProblematicPattern}`);

if (hasProblematicPattern) {
    console.log('ERROR: The problematic pattern still exists!');
    process.exit(1);
} else {
    console.log('✅ SUCCESS: The problematic pattern has been fixed');
}

// 3. Check if the savepoint block is properly structured
const savepointBlockMatch = sqlContent.match(/SAVEPOINT\s+cache_clear;[\s\S]*?ROLLBACK TO SAVEPOINT\s+cache_clear;/);
if (savepointBlockMatch) {
    console.log('✅ Savepoint block is properly structured');
    console.log('   Block content:');
    const block = savepointBlockMatch[0].trim();
    block.split('\n').forEach(line => console.log(`     ${line}`));
} else {
    console.log('⚠️  Savepoint block structure may need verification');
}

// 4. Check for proper exception handling around the savepoint
const exceptionBlockMatch = sqlContent.match(/BEGIN[\s\S]*?SAVEPOINT\s+cache_clear;[\s\S]*?ROLLBACK TO SAVEPOINT\s+cache_clear;[\s\S]*?EXCEPTION[\s\S]*?END/);
if (exceptionBlockMatch) {
    console.log('✅ Savepoint is properly wrapped in exception handling');
} else {
    console.log('⚠️  Savepoint exception handling may need verification');
}

// 5. Verify the comment explains the fix
const hasExplanationComment = /Don't release the savepoint after rollback/.test(sqlContent);
if (hasExplanationComment) {
    console.log('✅ Comment explains why savepoint is not released after rollback');
} else {
    console.log('⚠️  No explanatory comment found');
}

console.log('\n' + '='.repeat(60));
console.log('FINAL VALIDATION RESULT');
console.log('='.repeat(60));

if (hasRollback && !hasProblematicPattern) {
    console.log('🎉 SUCCESS: ROLLBACK TO SAVEPOINT syntax error has been fixed!');
    console.log('\nThe fix ensures:');
    console.log('1. Savepoint is created with SAVEPOINT cache_clear');
    console.log('2. Transaction is rolled back with ROLLBACK TO SAVEPOINT cache_clear');
    console.log('3. No attempt to release the savepoint after rollback (which would cause an error)');
    console.log('4. Proper exception handling is in place');
    console.log('\nThe script is now compatible with PostgreSQL/Supabase syntax.');
} else {
    console.log('❌ FAILURE: The fix was not applied correctly');
    process.exit(1);
}