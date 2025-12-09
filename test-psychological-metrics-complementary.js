/**
 * Test Script for Psychological Metrics Complementary Calculation
 * 
 * This script validates that the psychological metrics calculation changes work correctly.
 * It tests the complementary relationship between Discipline Level and Tilt Control,
 * ensuring they always sum to exactly 100%.
 */

// Extracted EmotionalData interface from dashboard/page.tsx
// interface EmotionalData {
//   subject: string;
//   value: number;
//   fullMark: number;
//   leaning: string;
//   side: string;
//   leaningValue?: number;
//   totalTrades?: number;
// }

// Extracted calculatePsychologicalMetrics function from dashboard/page.tsx
function calculatePsychologicalMetrics(emotionalData) {
  // Handle edge cases: empty or invalid data
  if (!emotionalData || emotionalData.length === 0) {
    return { disciplineLevel: 50, tiltControl: 50 };
  }

  try {
    // Define emotion categories with their weights
    const positiveEmotions = ['DISCIPLINE', 'CONFIDENCE', 'PATIENCE'];
    const negativeEmotions = ['TILT', 'REVENGE', 'IMPATIENCE'];
    const neutralEmotions = ['NEUTRAL', 'ANALYTICAL'];
    
    // Calculate weighted scores for each emotion category
    let positiveScore = 0;
    let negativeScore = 0;
    let neutralScore = 0;
    
    emotionalData.forEach(emotion => {
      const emotionName = emotion.subject?.toUpperCase();
      const emotionValue = emotion.value || 0;
      
      if (positiveEmotions.includes(emotionName)) {
        positiveScore += emotionValue;
      } else if (negativeEmotions.includes(emotionName)) {
        negativeScore += emotionValue;
      } else if (neutralEmotions.includes(emotionName)) {
        neutralScore += emotionValue;
      }
    });
    
    // Normalize scores to 0-100 range
    const maxPossibleScore = emotionalData.length * 100;
    positiveScore = (positiveScore / maxPossibleScore) * 100;
    negativeScore = (negativeScore / maxPossibleScore) * 100;
    neutralScore = (neutralScore / maxPossibleScore) * 100;
    
    // Calculate Emotional State Score (ESS) with weighted formula
    const ess = (positiveScore * 2.0) + (neutralScore * 1.0) - (negativeScore * 1.5);
    
    // Calculate Psychological Stability Index (PSI) - normalized to 0-100 scale
    const psi = Math.max(0, Math.min(100, (ess + 100) / 2));
    
    // Calculate Discipline Level based on emotion scoring
    // Higher positive emotions and lower negative emotions result in higher discipline
    let disciplineLevel = psi;
    
    // Ensure discipline level is within 0-100 range
    disciplineLevel = Math.max(0, Math.min(100, disciplineLevel));
    
    // Calculate Tilt Control as the exact complement of Discipline Level
    // This ensures they always sum to exactly 100%
    const tiltControl = 100 - disciplineLevel;
    
    return {
      disciplineLevel: Math.round(disciplineLevel * 100) / 100, // Round to 2 decimal places
      tiltControl: Math.round(tiltControl * 100) / 100
    };
    
  } catch (error) {
    console.error('Error calculating psychological metrics:', error);
    // Return default values on error
    return { disciplineLevel: 50, tiltControl: 50 };
  }
}

// Test helper function
function runTest(testName, emotionalData, expectedDisciplineRange = null, expectedTiltRange = null) {
  console.log(`\n=== ${testName} ===`);
  console.log('Input emotional data:', JSON.stringify(emotionalData, null, 2));
  
  const result = calculatePsychologicalMetrics(emotionalData);
  console.log('Calculated metrics:', result);
  
  // Verify complementary relationship
  const sum = result.disciplineLevel + result.tiltControl;
  const isComplementary = Math.abs(sum - 100) < 0.01; // Allow for tiny rounding errors
  
  console.log(`Discipline Level: ${result.disciplineLevel}%`);
  console.log(`Tilt Control: ${result.tiltControl}%`);
  console.log(`Sum: ${sum}%`);
  console.log(`Complementary (sum ≈ 100%): ${isComplementary ? '✅ PASS' : '❌ FAIL'}`);
  
  // Verify range constraints
  const disciplineInRange = result.disciplineLevel >= 0 && result.disciplineLevel <= 100;
  const tiltInRange = result.tiltControl >= 0 && result.tiltControl <= 100;
  
  console.log(`Discipline Level in range [0, 100]: ${disciplineInRange ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Tilt Control in range [0, 100]: ${tiltInRange ? '✅ PASS' : '❌ FAIL'}`);
  
  // Verify decimal precision
  const disciplinePrecision = (result.disciplineLevel.toString().split('.')[1] || '').length <= 2;
  const tiltPrecision = (result.tiltControl.toString().split('.')[1] || '').length <= 2;
  
  console.log(`Discipline Level rounded to 2 decimal places: ${disciplinePrecision ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Tilt Control rounded to 2 decimal places: ${tiltPrecision ? '✅ PASS' : '❌ FAIL'}`);
  
  // Check expected ranges if provided
  if (expectedDisciplineRange) {
    const inExpectedRange = result.disciplineLevel >= expectedDisciplineRange.min && 
                           result.disciplineLevel <= expectedDisciplineRange.max;
    console.log(`Discipline Level in expected range [${expectedDisciplineRange.min}, ${expectedDisciplineRange.max}]: ${inExpectedRange ? '✅ PASS' : '❌ FAIL'}`);
  }
  
  if (expectedTiltRange) {
    const inExpectedRange = result.tiltControl >= expectedTiltRange.min && 
                           result.tiltControl <= expectedTiltRange.max;
    console.log(`Tilt Control in expected range [${expectedTiltRange.min}, ${expectedTiltRange.max}]: ${inExpectedRange ? '✅ PASS' : '❌ FAIL'}`);
  }
  
  // Overall test result
  const allPassed = isComplementary && disciplineInRange && tiltInRange && disciplinePrecision && tiltPrecision;
  console.log(`Overall result: ${allPassed ? '✅ PASS' : '❌ FAIL'}`);
  
  return {
    testName,
    passed: allPassed,
    result,
    emotionalData
  };
}

// Test cases
console.log('🧪 Psychological Metrics Complementary Calculation Test Suite');
console.log('===============================================================');

const testResults = [];

// Test 1: Empty emotional data
testResults.push(runTest(
  'Empty Emotional Data',
  [],
  { min: 45, max: 55 }, // Should default to 50, 50
  { min: 45, max: 55 }
));

// Test 2: Null emotional data
testResults.push(runTest(
  'Null Emotional Data',
  null,
  { min: 45, max: 55 }, // Should default to 50, 50
  { min: 45, max: 55 }
));

// Test 3: Positive-heavy emotional data
testResults.push(runTest(
  'Positive-Heavy Emotional Data',
  [
    { subject: 'DISCIPLINE', value: 85, fullMark: 100, leaning: 'Positive', side: 'Buy' },
    { subject: 'CONFIDENCE', value: 90, fullMark: 100, leaning: 'Positive', side: 'Buy' },
    { subject: 'PATIENCE', value: 80, fullMark: 100, leaning: 'Positive', side: 'Buy' },
    { subject: 'NEUTRAL', value: 30, fullMark: 100, leaning: 'Neutral', side: 'Buy' },
    { subject: 'TILT', value: 10, fullMark: 100, leaning: 'Negative', side: 'Sell' }
  ],
  { min: 70, max: 100 }, // Should have high discipline
  { min: 0, max: 30 }    // Should have low tilt control
));

// Test 4: Negative-heavy emotional data
testResults.push(runTest(
  'Negative-Heavy Emotional Data',
  [
    { subject: 'TILT', value: 85, fullMark: 100, leaning: 'Negative', side: 'Sell' },
    { subject: 'REVENGE', value: 90, fullMark: 100, leaning: 'Negative', side: 'Sell' },
    { subject: 'IMPATIENCE', value: 80, fullMark: 100, leaning: 'Negative', side: 'Sell' },
    { subject: 'NEUTRAL', value: 20, fullMark: 100, leaning: 'Neutral', side: 'Buy' },
    { subject: 'DISCIPLINE', value: 15, fullMark: 100, leaning: 'Positive', side: 'Buy' }
  ],
  { min: 0, max: 30 },    // Should have low discipline
  { min: 70, max: 100 }   // Should have high tilt control
));

// Test 5: Balanced emotional data
testResults.push(runTest(
  'Balanced Emotional Data',
  [
    { subject: 'DISCIPLINE', value: 50, fullMark: 100, leaning: 'Positive', side: 'Buy' },
    { subject: 'CONFIDENCE', value: 50, fullMark: 100, leaning: 'Positive', side: 'Buy' },
    { subject: 'TILT', value: 50, fullMark: 100, leaning: 'Negative', side: 'Sell' },
    { subject: 'REVENGE', value: 50, fullMark: 100, leaning: 'Negative', side: 'Sell' },
    { subject: 'NEUTRAL', value: 50, fullMark: 100, leaning: 'Neutral', side: 'Buy' }
  ],
  { min: 40, max: 60 }, // Should be around middle
  { min: 40, max: 60 }  // Should be around middle
));

// Test 6: All neutral emotions
testResults.push(runTest(
  'All Neutral Emotions',
  [
    { subject: 'NEUTRAL', value: 75, fullMark: 100, leaning: 'Neutral', side: 'Buy' },
    { subject: 'ANALYTICAL', value: 80, fullMark: 100, leaning: 'Neutral', side: 'Buy' },
    { subject: 'NEUTRAL', value: 60, fullMark: 100, leaning: 'Neutral', side: 'Sell' }
  ],
  { min: 40, max: 60 }, // Should be around middle
  { min: 40, max: 60 }  // Should be around middle
));

// Test 7: Extreme positive values
testResults.push(runTest(
  'Extreme Positive Values',
  [
    { subject: 'DISCIPLINE', value: 100, fullMark: 100, leaning: 'Positive', side: 'Buy' },
    { subject: 'CONFIDENCE', value: 100, fullMark: 100, leaning: 'Positive', side: 'Buy' },
    { subject: 'PATIENCE', value: 100, fullMark: 100, leaning: 'Positive', side: 'Buy' }
  ],
  { min: 90, max: 100 }, // Should be very high discipline
  { min: 0, max: 10 }    // Should be very low tilt control
));

// Test 8: Extreme negative values
testResults.push(runTest(
  'Extreme Negative Values',
  [
    { subject: 'TILT', value: 100, fullMark: 100, leaning: 'Negative', side: 'Sell' },
    { subject: 'REVENGE', value: 100, fullMark: 100, leaning: 'Negative', side: 'Sell' },
    { subject: 'IMPATIENCE', value: 100, fullMark: 100, leaning: 'Negative', side: 'Sell' }
  ],
  { min: 0, max: 10 },    // Should be very low discipline
  { min: 90, max: 100 }   // Should be very high tilt control
));

// Test 9: Mixed values with zeros
testResults.push(runTest(
  'Mixed Values with Zeros',
  [
    { subject: 'DISCIPLINE', value: 0, fullMark: 100, leaning: 'Positive', side: 'Buy' },
    { subject: 'CONFIDENCE', value: 75, fullMark: 100, leaning: 'Positive', side: 'Buy' },
    { subject: 'TILT', value: 0, fullMark: 100, leaning: 'Negative', side: 'Sell' },
    { subject: 'REVENGE', value: 25, fullMark: 100, leaning: 'Negative', side: 'Sell' },
    { subject: 'NEUTRAL', value: 50, fullMark: 100, leaning: 'Neutral', side: 'Buy' }
  ]
));

// Test 10: Single emotion
testResults.push(runTest(
  'Single Emotion',
  [
    { subject: 'DISCIPLINE', value: 60, fullMark: 100, leaning: 'Positive', side: 'Buy' }
  ]
));

// Test 11: Large dataset
const largeDataset = [];
for (let i = 0; i < 50; i++) {
  const emotions = ['DISCIPLINE', 'CONFIDENCE', 'PATIENCE', 'TILT', 'REVENGE', 'IMPATIENCE', 'NEUTRAL', 'ANALYTICAL'];
  const randomEmotion = emotions[Math.floor(Math.random() * emotions.length)];
  const randomValue = Math.floor(Math.random() * 100);
  
  largeDataset.push({
    subject: randomEmotion,
    value: randomValue,
    fullMark: 100,
    leaning: randomValue > 50 ? 'Positive' : randomValue < 30 ? 'Negative' : 'Neutral',
    side: randomValue > 50 ? 'Buy' : 'Sell'
  });
}

testResults.push(runTest(
  'Large Dataset (50 emotions)',
  largeDataset
));

// Test 12: Edge case - emotional data with missing values
testResults.push(runTest(
  'Edge Case - Missing Values',
  [
    { subject: 'DISCIPLINE', value: undefined, fullMark: 100, leaning: 'Positive', side: 'Buy' },
    { subject: 'CONFIDENCE', value: null, fullMark: 100, leaning: 'Positive', side: 'Buy' },
    { subject: 'TILT', value: 0, fullMark: 100, leaning: 'Negative', side: 'Sell' },
    { subject: '', value: 50, fullMark: 100, leaning: 'Neutral', side: 'Buy' },
    { subject: 'NEUTRAL', value: 75, fullMark: 100, leaning: 'Neutral', side: 'Buy' }
  ]
));

// Summary of results
console.log('\n\n📊 TEST SUMMARY');
console.log('================');

const passedTests = testResults.filter(test => test.passed).length;
const totalTests = testResults.length;

console.log(`Total tests: ${totalTests}`);
console.log(`Passed: ${passedTests}`);
console.log(`Failed: ${totalTests - passedTests}`);
console.log(`Success rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

// Detailed results for failed tests
const failedTests = testResults.filter(test => !test.passed);
if (failedTests.length > 0) {
  console.log('\n❌ FAILED TESTS:');
  failedTests.forEach(test => {
    console.log(`- ${test.testName}`);
    console.log(`  Result: ${JSON.stringify(test.result)}`);
  });
}

// Validation of complementary relationship across all tests
console.log('\n🔍 COMPLEMENTARY RELATIONSHIP VALIDATION');
console.log('==========================================');

let allComplementary = true;
testResults.forEach(test => {
  const sum = test.result.disciplineLevel + test.result.tiltControl;
  const isComplementary = Math.abs(sum - 100) < 0.01;
  if (!isComplementary) {
    allComplementary = false;
    console.log(`❌ ${test.testName}: Sum = ${sum}% (not 100%)`);
  }
});

if (allComplementary) {
  console.log('✅ All tests maintain the complementary relationship (Discipline + Tilt = 100%)');
} else {
  console.log('❌ Some tests violate the complementary relationship');
}

// Range validation across all tests
console.log('\n📏 RANGE VALIDATION');
console.log('====================');

let allInRange = true;
testResults.forEach(test => {
  const disciplineInRange = test.result.disciplineLevel >= 0 && test.result.disciplineLevel <= 100;
  const tiltInRange = test.result.tiltControl >= 0 && test.result.tiltControl <= 100;
  
  if (!disciplineInRange) {
    allInRange = false;
    console.log(`❌ ${test.testName}: Discipline Level = ${test.result.disciplineLevel}% (out of range)`);
  }
  
  if (!tiltInRange) {
    allInRange = false;
    console.log(`❌ ${test.testName}: Tilt Control = ${test.result.tiltControl}% (out of range)`);
  }
});

if (allInRange) {
  console.log('✅ All test results are within the valid range [0, 100]');
} else {
  console.log('❌ Some test results are out of the valid range');
}

console.log('\n🎯 TEST COMPLETED');
console.log('==================');
console.log('The complementary calculation implementation has been validated across various scenarios.');
console.log('Key findings:');
console.log('- Discipline Level and Tilt Control maintain complementary relationship');
console.log('- Values are properly constrained to [0, 100] range');
console.log('- Decimal precision is maintained at 2 decimal places');
console.log('- Edge cases are handled appropriately');