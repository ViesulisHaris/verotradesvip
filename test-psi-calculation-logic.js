// Test script to verify PSI calculation logic directly
console.log('🔍 [TEST] Testing PSI calculation logic directly...\n');

// Test case from the task description
const disciplineLevel = 51.9;
const tiltControl = 48.1;

console.log('📊 [TEST] Input values:');
console.log(`   Discipline Level: ${disciplineLevel}%`);
console.log(`   Tilt Control: ${tiltControl}%`);

// Current implementation from dashboard/page.tsx (line 690)
const currentPSI = ((disciplineLevel + tiltControl) / 2).toFixed(1);
console.log('\n🧮 [TEST] Current PSI calculation:');
console.log(`   Formula: ((disciplineLevel + tiltControl) / 2).toFixed(1)`);
console.log(`   Calculation: ((${disciplineLevel} + ${tiltControl}) / 2).toFixed(1)`);
console.log(`   Result: ${currentPSI}%`);

// Expected PSI from task description
const expectedPSI = 50.0;
console.log('\n🎯 [TEST] Expected PSI from task:');
console.log(`   Expected: ${expectedPSI}%`);
console.log(`   Match: ${parseFloat(currentPSI) === expectedPSI ? '✅ YES' : '❌ NO'}`);

// Check if values are complementary
const sum = disciplineLevel + tiltControl;
console.log('\n🔗 [TEST] Complementary relationship check:');
console.log(`   Sum: ${disciplineLevel} + ${tiltControl} = ${sum.toFixed(1)}`);
console.log(`   Complementary (≈100%): ${Math.abs(sum - 100) < 0.1 ? '✅ YES' : '❌ NO'}`);

// Analysis of the issue
console.log('\n🔍 [ANALYSIS] Issue identification:');
console.log('   The task asks if PSI is showing the correct %.');
console.log('   Current implementation calculates PSI as average of Discipline and Tilt Control.');
console.log('   Since Discipline and Tilt Control are complementary (sum to 100%),');
console.log('   their average will always be 50% regardless of the individual values.');
console.log('   This means PSI will always show 50.0% when the complementary relationship is maintained.');

console.log('\n💡 [ANALYSIS] Potential issues:');
console.log('   1. PSI calculation might be redundant since it always equals 50% for complementary values');
console.log('   2. PSI might need to be calculated differently from the emotional data directly');
console.log('   3. PSI might need to use a different formula that considers the actual values, not just the average');

// Test with different values to confirm the issue
console.log('\n🧪 [TEST] Testing with different values:');
const testCases = [
  { discipline: 80, tilt: 20 },
  { discipline: 30, tilt: 70 },
  { discipline: 95, tilt: 5 },
  { discipline: 10, tilt: 90 }
];

testCases.forEach((testCase, index) => {
  const psi = ((testCase.discipline + testCase.tilt) / 2).toFixed(1);
  const sum = testCase.discipline + testCase.tilt;
  console.log(`   Case ${index + 1}: Discipline=${testCase.discipline}%, Tilt=${testCase.tilt}% → PSI=${psi}% (Sum=${sum}%)`);
});

console.log('\n🔍 [CONCLUSION] All test cases show PSI = 50% when values are complementary');

// Check the actual calculation function from the code
console.log('\n📋 [CODE] Examining calculation function from dashboard/page.tsx:');
console.log('   Line 690: {(((stats?.disciplineLevel ?? 0) + (stats?.tiltControl ?? 0)) / 2).toFixed(1)}%');
console.log('   This confirms PSI is calculated as simple average of the two complementary values.');

// Check the calculation function from API route
console.log('\n📋 [CODE] Examining calculation function from API route:');
console.log('   The API route calculates Discipline Level and Tilt Control from emotional data');
console.log('   using the same complementary formula: tiltControl = 100 - disciplineLevel');
console.log('   So the issue exists in both frontend and backend calculations.');

// Potential solutions
console.log('\n💡 [SOLUTIONS] Potential approaches:');
console.log('   1. Calculate PSI directly from emotional data instead of averaging Discipline/Tilt');
console.log('   2. Use the original PSI value (line 322 in route.ts) instead of calculating average');
console.log('   3. Change the formula to consider the actual distribution, not just average');

console.log('\n🏁 [TEST] PSI calculation logic test completed');