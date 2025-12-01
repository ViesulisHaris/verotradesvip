// Simple syntax test for VERIFICATION.sql
// This script checks if the SQL file has correct format() syntax

const fs = require('fs');
const path = require('path');

const sqlFile = path.join(__dirname, 'VERIFICATION.sql');
const sqlContent = fs.readFileSync(sqlFile, 'utf8');

console.log('Testing VERIFICATION.sql for format() syntax issues...\n');

// Check for incomplete format specifiers (single % without following specifier)
const incompleteFormatRegex = /format\([^)]*%[^%sIL]/g;
const matches = sqlContent.match(incompleteFormatRegex);

if (matches && matches.length > 0) {
    console.error('❌ Found incomplete format specifiers:');
    matches.forEach(match => console.error(`  - ${match}`));
    process.exit(1);
} else {
    console.log('✅ No incomplete format specifiers found');
}

// Check for proper format specifiers
const properFormatRegex = /format\([^)]*%[sIL]/g;
const properMatches = sqlContent.match(properFormatRegex);

if (properMatches && properMatches.length > 0) {
    console.log(`✅ Found ${properMatches.length} proper format specifiers`);
} else {
    console.log('ℹ️ No format specifiers found');
}

console.log('\n✅ VERIFICATION.sql syntax test passed!');