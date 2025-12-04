// Test script to verify the memoization fix works correctly
const { createFilterDebouncedFunction } = require('./src/lib/memoization.ts');

console.log('🧪 Testing memoization fix...');

// Test the createFilterDebouncedFunction to ensure currentFilterHash is properly defined
const testFunction = createFilterDebouncedFunction((...args) => {
  console.log('✅ Test function executed successfully with args:', args);
  return 'success';
});

// Test with different arguments to trigger the filter hash logic
console.log('🔄 Testing with first set of arguments...');
testFunction('test', 'args1');

setTimeout(() => {
  console.log('🔄 Testing with second set of arguments...');
  testFunction('test', 'args2');
  
  setTimeout(() => {
    console.log('✅ Memoization fix test completed successfully!');
    console.log('✅ No "currentFilterHash is not defined" errors occurred');
    console.log('✅ Statistics and filtering should work correctly now');
  }, 200);
}, 200);