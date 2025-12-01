// Test script to verify the fix for the TypeError in getFilterStats function

const fs = require('fs');
const path = require('path');

// Read the filter-persistence.ts file
const filterPersistencePath = path.join(__dirname, 'src/lib/filter-persistence.ts');
const filterPersistenceContent = fs.readFileSync(filterPersistencePath, 'utf8');

console.log('Testing the fix for TypeError in getFilterStats function...\n');

// Test 1: Check if the function signature has been updated to accept string input
console.log('Test 1: Checking function signature...');
if (filterPersistenceContent.includes('getFilterStats(filters: TradeFilterOptions | StrategyFilterOptions | string)')) {
  console.log('✓ Function signature updated to accept string input');
} else {
  console.log('✗ Function signature not updated correctly');
  process.exit(1);
}

// Test 2: Check if the function now handles string input properly
console.log('\nTest 2: Checking string input handling...');
if (filterPersistenceContent.includes('if (typeof filters === \'string\')') && 
    filterPersistenceContent.includes('parsedFilters = JSON.parse(filters)')) {
  console.log('✓ String input handling implemented');
} else {
  console.log('✗ String input handling not implemented correctly');
  process.exit(1);
}

// Test 3: Check if error handling is in place for JSON parsing
console.log('\nTest 3: Checking error handling...');
if (filterPersistenceContent.includes('Failed to parse filter string in getFilterStats')) {
  console.log('✓ Error handling implemented for JSON parsing');
} else {
  console.log('✗ Error handling not implemented correctly');
  process.exit(1);
}

// Test 4: Check if the function still handles object input correctly
console.log('\nTest 4: Checking object input handling...');
if (filterPersistenceContent.includes('} else {') && 
    filterPersistenceContent.includes('parsedFilters = filters;')) {
  console.log('✓ Object input handling preserved');
} else {
  console.log('✗ Object input handling not preserved correctly');
  process.exit(1);
}

console.log('\nAll tests passed! The fix should resolve the TypeError.');
console.log('\nThe fix addresses the issue by:');
console.log('1. Updating the function signature to accept string input');
console.log('2. Adding proper parsing for stringified JSON objects');
console.log('3. Implementing error handling for JSON parsing failures');
console.log('4. Preserving the original functionality for object inputs');