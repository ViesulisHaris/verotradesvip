/**
 * Test script to verify EmotionRadar data validation fixes SVG path rendering errors
 * This script tests various edge cases that could cause SVG path errors in Recharts
 */

// Import the validation function (we'll need to adapt this for testing)
const VALID_EMOTIONS = ['FOMO', 'REVENGE', 'TILT', 'OVERRISK', 'PATIENCE', 'REGRET', 'DISCIPLINE', 'CONFIDENT', 'ANXIOUS', 'NEUTRAL'];

/**
 * Comprehensive data validation function for EmotionRadar component
 * Validates data structure, emotion names, and numeric values to prevent SVG path rendering errors
 */
function validateEmotionRadarData(data) {
  const warnings = [];
  const validatedData = [];
  
  // Check if data is an array
  if (!Array.isArray(data)) {
    console.error('EmotionRadar: Invalid data - expected array, received:', typeof data, data);
    return { isValid: false, validatedData: [], warnings: ['Data is not an array'] };
  }
  
  // Process each data item
  for (let i = 0; i < data.length; i++) {
    const item = data[i];
    
    // Check if item exists and is an object
    if (!item || typeof item !== 'object') {
      warnings.push(`Item ${i}: Not an object - ${JSON.stringify(item)}`);
      continue;
    }
    
    // Validate subject (emotion name)
    if (typeof item.subject !== 'string' || !item.subject.trim()) {
      warnings.push(`Item ${i}: Missing or invalid subject`);
      continue;
    }
    
    const normalizedSubject = item.subject.toUpperCase().trim();
    if (!VALID_EMOTIONS.includes(normalizedSubject)) {
      warnings.push(`Item ${i}: Invalid emotion "${item.subject}" - not in valid emotions list`);
      continue;
    }
    
    // Validate value (must be a finite number)
    if (typeof item.value !== 'number') {
      warnings.push(`Item ${i}: Value is not a number - ${typeof item.value}`);
      continue;
    }
    
    if (!isFinite(item.value)) {
      warnings.push(`Item ${i}: Value is not finite (${item.value}) - NaN or Infinity detected`);
      continue;
    }
    
    // Check for reasonable value ranges (0-100% for radar chart)
    if (item.value < 0 || item.value > 100) {
      warnings.push(`Item ${i}: Value ${item.value} is outside expected range (0-100)`);
      // We'll still include it but clamp it to valid range
    }
    
    // Validate optional fields with proper defaults
    const leaning = typeof item.leaning === 'string' ? item.leaning.trim() : 'Balanced';
    const side = (item.side === 'Buy' || item.side === 'Sell') ? item.side : 'NULL';
    
    let leaningValue = 0;
    if (typeof item.leaningValue === 'number') {
      if (isFinite(item.leaningValue)) {
        leaningValue = Math.max(-100, Math.min(100, item.leaningValue));
      } else {
        warnings.push(`Item ${i}: leaningValue is not finite (${item.leaningValue})`);
      }
    }
    
    let totalTrades = 0;
    if (typeof item.totalTrades === 'number') {
      if (isFinite(item.totalTrades) && item.totalTrades >= 0) {
        totalTrades = item.totalTrades;
      } else {
        warnings.push(`Item ${i}: totalTrades is invalid (${item.totalTrades})`);
      }
    }
    
    // Create validated data item with sanitized values
    const validatedItem = {
      subject: normalizedSubject,
      value: Math.max(0, Math.min(100, item.value)), // Clamp to 0-100 range
      fullMark: 100, // Standard fullMark for radar chart
      leaning,
      side,
      leaningValue,
      totalTrades
    };
    
    validatedData.push(validatedItem);
  }
  
  // Check if we have any valid data
  if (validatedData.length === 0) {
    console.error('EmotionRadar: No valid data items after validation', { originalData: data, warnings });
    return { isValid: false, validatedData: [], warnings };
  }
  
  // Log warnings if any
  if (warnings.length > 0) {
    console.warn('EmotionRadar: Data validation warnings:', warnings);
  }
  
  return { isValid: true, validatedData, warnings };
}

// Test cases that would cause SVG path rendering errors
const testCases = [
  {
    name: 'Valid data',
    data: [
      { subject: 'FOMO', value: 75, leaning: 'Buy Leaning', side: 'Buy' },
      { subject: 'PATIENCE', value: 50, leaning: 'Balanced', side: 'NULL' }
    ],
    shouldPass: true
  },
  {
    name: 'NaN values',
    data: [
      { subject: 'FOMO', value: NaN, leaning: 'Buy Leaning', side: 'Buy' },
      { subject: 'PATIENCE', value: 50, leaning: 'Balanced', side: 'NULL' }
    ],
    shouldPass: true // Should pass with partial data (PATIENCE is valid)
  },
  {
    name: 'Infinity values',
    data: [
      { subject: 'FOMO', value: Infinity, leaning: 'Buy Leaning', side: 'Buy' },
      { subject: 'PATIENCE', value: -Infinity, leaning: 'Balanced', side: 'NULL' }
    ],
    shouldPass: false
  },
  {
    name: 'Negative values',
    data: [
      { subject: 'FOMO', value: -10, leaning: 'Buy Leaning', side: 'Buy' },
      { subject: 'PATIENCE', value: 50, leaning: 'Balanced', side: 'NULL' }
    ],
    shouldPass: true // Should pass but with warning and clamping
  },
  {
    name: 'Values > 100',
    data: [
      { subject: 'FOMO', value: 150, leaning: 'Buy Leaning', side: 'Buy' },
      { subject: 'PATIENCE', value: 200, leaning: 'Balanced', side: 'NULL' }
    ],
    shouldPass: true // Should pass but with warning and clamping
  },
  {
    name: 'Invalid emotion names',
    data: [
      { subject: 'INVALID_EMOTION', value: 75, leaning: 'Buy Leaning', side: 'Buy' },
      { subject: 'PATIENCE', value: 50, leaning: 'Balanced', side: 'NULL' }
    ],
    shouldPass: true // Should pass with partial data (PATIENCE is valid)
  },
  {
    name: 'Missing required fields',
    data: [
      { leaning: 'Buy Leaning', side: 'Buy' }, // Missing subject and value
      { subject: 'PATIENCE', leaning: 'Balanced', side: 'NULL' } // Missing value
    ],
    shouldPass: false
  },
  {
    name: 'Non-array data',
    data: { subject: 'FOMO', value: 75 }, // Object instead of array
    shouldPass: false
  },
  {
    name: 'Empty array',
    data: [],
    shouldPass: false
  },
  {
    name: 'Mixed valid and invalid',
    data: [
      { subject: 'FOMO', value: 75, leaning: 'Buy Leaning', side: 'Buy' }, // Valid
      { subject: 'INVALID', value: NaN, leaning: 'Invalid', side: 'Invalid' }, // Invalid
      { subject: 'PATIENCE', value: 50, leaning: 'Balanced', side: 'NULL' } // Valid
    ],
    shouldPass: true // Should pass with partial data
  }
];

// Run tests
console.log('🧪 Testing EmotionRadar data validation...\n');

let passedTests = 0;
let totalTests = testCases.length;

testCases.forEach((testCase, index) => {
  console.log(`Test ${index + 1}: ${testCase.name}`);
  
  const result = validateEmotionRadarData(testCase.data);
  
  const actualPass = result.isValid;
  const expectedPass = testCase.shouldPass;
  const passed = actualPass === expectedPass;
  
  if (passed) {
    console.log('✅ PASSED');
    passedTests++;
  } else {
    console.log('❌ FAILED');
    console.log(`   Expected: ${expectedPass ? 'Valid' : 'Invalid'}`);
    console.log(`   Actual: ${actualPass ? 'Valid' : 'Invalid'}`);
  }
  
  if (result.warnings.length > 0) {
    console.log('   Warnings:', result.warnings);
  }
  
  if (result.isValid && result.validatedData.length > 0) {
    console.log('   Validated data:', result.validatedData);
  }
  
  console.log('');
});

// Summary
console.log(`\n📊 Test Summary: ${passedTests}/${totalTests} tests passed`);

if (passedTests === totalTests) {
  console.log('🎉 All tests passed! The validation function should prevent SVG path rendering errors.');
} else {
  console.log('⚠️  Some tests failed. Review the validation function.');
}

// Test specific SVG path error scenarios
console.log('\n🔍 Testing specific SVG path error scenarios...');

// Test case 1: All NaN values (would cause SVG path errors)
const allNaN = [
  { subject: 'FOMO', value: NaN },
  { subject: 'PATIENCE', value: NaN }
];
const result1 = validateEmotionRadarData(allNaN);
console.log('All NaN values:', result1.isValid ? '❌ Should be invalid' : '✅ Correctly rejected');

// Test case 2: Mixed NaN and valid values
const mixedNaN = [
  { subject: 'FOMO', value: NaN },
  { subject: 'PATIENCE', value: 50 }
];
const result2 = validateEmotionRadarData(mixedNaN);
console.log('Mixed NaN/valid:', result2.isValid ? '✅ Partially accepted' : '❌ Should accept partial data');

// Test case 3: Extreme values that could cause rendering issues
const extremeValues = [
  { subject: 'FOMO', value: Number.MAX_VALUE },
  { subject: 'PATIENCE', value: Number.MIN_VALUE }
];
const result3 = validateEmotionRadarData(extremeValues);
console.log('Extreme values:', result3.isValid ? '✅ Handled gracefully' : '❌ Should handle gracefully');

console.log('\n✨ EmotionRadar validation test complete!');