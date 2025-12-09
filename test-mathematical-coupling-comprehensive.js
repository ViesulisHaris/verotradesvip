/**
 * Comprehensive Test Suite for Mathematical Coupling Algorithm
 * Tests both backend and frontend implementations to ensure:
 * 1. Impossible state prevention (100% discipline with 0% tilt control)
 * 2. Mathematical consistency and coupling effectiveness
 * 3. Edge case handling and boundary conditions
 * 4. Performance validation
 */

// Extract the calculatePsychologicalMetrics function from both implementations
// Backend implementation (from route.ts lines 44-126)
function calculatePsychologicalMetricsBackend(emotionalData) {
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
    
    // Coupling Algorithm - ensures mathematical dependency between discipline and tilt control
    const couplingFactor = 0.6; // Strength of the relationship between metrics
    
    // Calculate base values using PSI as the foundation
    const baseDiscipline = psi;
    const baseTiltControl = psi;
    
    // Apply coupling to ensure inverse relationship
    const disciplineAdjustment = baseDiscipline * couplingFactor * (1 - baseDiscipline / 100);
    const tiltControlAdjustment = baseTiltControl * couplingFactor * (1 - baseTiltControl / 100);
    
    // Final calculations with normalization to ensure 0-100 range
    let disciplineLevel = Math.max(0, Math.min(100, baseDiscipline + disciplineAdjustment));
    let tiltControl = Math.max(0, Math.min(100, baseTiltControl + tiltControlAdjustment));
    
    // Additional normalization to ensure mathematical consistency
    const averageLevel = (disciplineLevel + tiltControl) / 2;
    const maxDeviation = 30; // Maximum allowed difference between metrics
    
    if (Math.abs(disciplineLevel - tiltControl) > maxDeviation) {
      if (disciplineLevel > tiltControl) {
        tiltControl = Math.max(0, disciplineLevel - maxDeviation);
      } else {
        disciplineLevel = Math.max(0, tiltControl - maxDeviation);
      }
    }
    
    // Final validation to ensure 0-100 range
    disciplineLevel = Math.max(0, Math.min(100, disciplineLevel));
    tiltControl = Math.max(0, Math.min(100, tiltControl));
    
    return {
      disciplineLevel: Math.round(disciplineLevel * 100) / 100,
      tiltControl: Math.round(tiltControl * 100) / 100
    };
    
  } catch (error) {
    console.error('Error calculating psychological metrics:', error);
    return { disciplineLevel: 50, tiltControl: 50 };
  }
}

// Frontend implementation (from page.tsx lines 282-367)
function calculatePsychologicalMetricsFrontend(emotionalData) {
  // Handle edge cases: empty or invalid data
  if (!emotionalData || emotionalData.length === 0) {
    return { disciplineLevel: 50, tiltControl: 50 };
  }

  try {
    // Define emotion categories with their weights
    const positiveEmotions = ['DISCIPLINE', 'CONFIDENCE', 'PATIENCE'];
    const negativeEmotions = ['TILT', 'FRUSTRATION', 'IMPATIENCE'];
    const neutralEmotions = ['NEUTRAL', 'ANALYTICAL'];
    
    // Calculate weighted scores for each emotion category
    let positiveScore = 0;
    let negativeScore = 0;
    let neutralScore = 0;
    
    emotionalData.forEach(emotion => {
      const emotionName = emotion.subject.toUpperCase();
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
    
    // Coupling Algorithm - ensures mathematical dependency between discipline and tilt control
    const couplingFactor = 0.6; // Strength of the relationship between metrics
    
    // Calculate base values using PSI as the foundation
    const baseDiscipline = psi;
    const baseTiltControl = psi;
    
    // Apply coupling to ensure inverse relationship
    // High discipline should correlate with high tilt control (low tilt)
    const disciplineAdjustment = baseDiscipline * couplingFactor * (1 - baseDiscipline / 100);
    const tiltControlAdjustment = baseTiltControl * couplingFactor * (1 - baseTiltControl / 100);
    
    // Final calculations with normalization to ensure 0-100 range
    let disciplineLevel = Math.max(0, Math.min(100, baseDiscipline + disciplineAdjustment));
    let tiltControl = Math.max(0, Math.min(100, baseTiltControl + tiltControlAdjustment));
    
    // Additional normalization to ensure mathematical consistency
    // If one metric is high, the other should also be relatively high
    const averageLevel = (disciplineLevel + tiltControl) / 2;
    const maxDeviation = 30; // Maximum allowed difference between metrics
    
    if (Math.abs(disciplineLevel - tiltControl) > maxDeviation) {
      if (disciplineLevel > tiltControl) {
        tiltControl = Math.max(0, disciplineLevel - maxDeviation);
      } else {
        disciplineLevel = Math.max(0, tiltControl - maxDeviation);
      }
    }
    
    // Final validation to ensure 0-100 range
    disciplineLevel = Math.max(0, Math.min(100, disciplineLevel));
    tiltControl = Math.max(0, Math.min(100, tiltControl));
    
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

// Test framework
class TestRunner {
  constructor() {
    this.tests = [];
    this.results = [];
  }

  addTest(name, description, testFunction) {
    this.tests.push({ name, description, testFunction });
  }

  async runTests() {
    console.log('🧪 Starting Comprehensive Mathematical Coupling Algorithm Tests\n');
    console.log('=' .repeat(80));
    
    for (const test of this.tests) {
      console.log(`\n📋 Test: ${test.name}`);
      console.log(`📝 Description: ${test.description}`);
      console.log('-'.repeat(60));
      
      try {
        const startTime = performance.now();
        const result = await test.testFunction();
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        this.results.push({
          name: test.name,
          description: test.description,
          passed: result.passed,
          details: result.details,
          duration: duration,
          performance: duration < 50 ? 'PASS' : 'FAIL'
        });
        
        console.log(`\n✅ Status: ${result.passed ? 'PASSED' : 'FAILED'}`);
        console.log(`⏱️  Duration: ${duration.toFixed(2)}ms`);
        console.log(`📊 Performance: ${duration < 50 ? 'PASS' : 'FAIL'} (< 50ms required)`);
        console.log(`📋 Details:`, result.details);
        
      } catch (error) {
        console.log(`\n❌ Status: ERROR`);
        console.log(`🔍 Error: ${error.message}`);
        this.results.push({
          name: test.name,
          description: test.description,
          passed: false,
          details: { error: error.message },
          duration: 0,
          performance: 'FAIL'
        });
      }
    }
    
    this.generateReport();
  }

  generateReport() {
    console.log('\n' + '=' .repeat(80));
    console.log('📊 COMPREHENSIVE TEST REPORT');
    console.log('=' .repeat(80));
    
    const totalTests = this.results.length;
    const passedTests = this.results.filter(r => r.passed).length;
    const failedTests = totalTests - passedTests;
    const performanceTests = this.results.filter(r => r.performance === 'PASS').length;
    
    console.log(`\n📈 SUMMARY:`);
    console.log(`   Total Tests: ${totalTests}`);
    console.log(`   Passed: ${passedTests} ✅`);
    console.log(`   Failed: ${failedTests} ❌`);
    console.log(`   Performance (< 50ms): ${performanceTests}/${totalTests} ⚡`);
    console.log(`   Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
    
    console.log(`\n📋 DETAILED RESULTS:`);
    this.results.forEach((result, index) => {
      const status = result.passed ? '✅' : '❌';
      const performance = result.performance === 'PASS' ? '⚡' : '🐌';
      console.log(`\n${index + 1}. ${status} ${performance} ${result.name}`);
      console.log(`   Description: ${result.description}`);
      console.log(`   Duration: ${result.duration.toFixed(2)}ms`);
      
      if (!result.passed) {
        console.log(`   ❌ Failure Details:`, result.details);
      }
    });
    
    // Critical analysis for impossible states
    this.analyzeImpossibleStates();
    
    // Coupling effectiveness analysis
    this.analyzeCouplingEffectiveness();
  }

  analyzeImpossibleStates() {
    console.log('\n' + '=' .repeat(80));
    console.log('🚫 IMPOSSIBLE STATES ANALYSIS');
    console.log('=' .repeat(80));
    
    const impossibleStateTests = this.results.filter(r => 
      r.name.includes('Impossible State') || r.name.includes('Prevention')
    );
    
    const impossibleStatesPrevented = impossibleStateTests.filter(t => t.passed).length;
    const totalImpossibleStateTests = impossibleStateTests.length;
    
    console.log(`\n🛡️  Impossible State Prevention:`);
    console.log(`   Tests Passed: ${impossibleStatesPrevented}/${totalImpossibleStateTests}`);
    console.log(`   Prevention Rate: ${totalImpossibleStateTests > 0 ? ((impossibleStatesPrevented / totalImpossibleStateTests) * 100).toFixed(1) : 0}%`);
    
    if (impossibleStatesPrevented === totalImpossibleStateTests && totalImpossibleStateTests > 0) {
      console.log(`   ✅ CONCLUSION: Algorithm successfully prevents all impossible psychological states`);
    } else {
      console.log(`   ❌ CONCLUSION: Algorithm has vulnerabilities in impossible state prevention`);
    }
  }

  analyzeCouplingEffectiveness() {
    console.log('\n' + '=' .repeat(80));
    console.log('🔗 COUPLING EFFECTIVENESS ANALYSIS');
    console.log('=' .repeat(80));
    
    const couplingTests = this.results.filter(r => 
      r.name.includes('Coupling') || r.name.includes('Consistency')
    );
    
    const effectiveCoupling = couplingTests.filter(t => t.passed).length;
    const totalCouplingTests = couplingTests.length;
    
    console.log(`\n🔗 Mathematical Coupling Effectiveness:`);
    console.log(`   Tests Passed: ${effectiveCoupling}/${totalCouplingTests}`);
    console.log(`   Effectiveness Rate: ${totalCouplingTests > 0 ? ((effectiveCoupling / totalCouplingTests) * 100).toFixed(1) : 0}%`);
    
    if (effectiveCoupling === totalCouplingTests && totalCouplingTests > 0) {
      console.log(`   ✅ CONCLUSION: Mathematical coupling is working effectively`);
    } else {
      console.log(`   ❌ CONCLUSION: Mathematical coupling has issues that need addressing`);
    }
  }
}

// Create test runner instance
const testRunner = new TestRunner();

// Helper function to create emotional data
function createEmotionalData(emotions) {
  return emotions.map(emotion => ({
    subject: emotion.name,
    value: emotion.value,
    fullMark: 100,
    leaning: 'Balanced',
    side: 'NULL'
  }));
}

// Test 1: All Positive Emotions (should create high discipline + high tilt control)
testRunner.addTest(
  'All Positive Emotions',
  'Test with all positive emotions should create high discipline + high tilt control',
  () => {
    const emotionalData = createEmotionalData([
      { name: 'DISCIPLINE', value: 100 },
      { name: 'CONFIDENCE', value: 100 },
      { name: 'PATIENCE', value: 100 }
    ]);
    
    const backendResult = calculatePsychologicalMetricsBackend(emotionalData);
    const frontendResult = calculatePsychologicalMetricsFrontend(emotionalData);
    
    const passed = 
      backendResult.disciplineLevel > 70 && backendResult.tiltControl > 70 &&
      frontendResult.disciplineLevel > 70 && frontendResult.tiltControl > 70 &&
      Math.abs(backendResult.disciplineLevel - frontendResult.disciplineLevel) < 5 &&
      Math.abs(backendResult.tiltControl - frontendResult.tiltControl) < 5;
    
    return {
      passed,
      details: {
        backend: backendResult,
        frontend: frontendResult,
        bothHigh: backendResult.disciplineLevel > 70 && backendResult.tiltControl > 70,
        consistency: Math.abs(backendResult.disciplineLevel - frontendResult.disciplineLevel) < 5
      }
    };
  }
);

// Test 2: All Negative Emotions (should create low discipline + low tilt control)
testRunner.addTest(
  'All Negative Emotions',
  'Test with all negative emotions should create low discipline + low tilt control',
  () => {
    const emotionalData = createEmotionalData([
      { name: 'TILT', value: 100 },
      { name: 'REVENGE', value: 100 },
      { name: 'IMPATIENCE', value: 100 }
    ]);
    
    const backendResult = calculatePsychologicalMetricsBackend(emotionalData);
    const frontendResult = calculatePsychologicalMetricsFrontend(emotionalData);
    
    const passed = 
      backendResult.disciplineLevel < 50 && backendResult.tiltControl < 50 &&
      frontendResult.disciplineLevel < 50 && frontendResult.tiltControl < 50 &&
      Math.abs(backendResult.disciplineLevel - frontendResult.disciplineLevel) < 5 &&
      Math.abs(backendResult.tiltControl - frontendResult.tiltControl) < 5;
    
    return {
      passed,
      details: {
        backend: backendResult,
        frontend: frontendResult,
        bothLow: backendResult.disciplineLevel < 50 && backendResult.tiltControl < 50,
        consistency: Math.abs(backendResult.disciplineLevel - frontendResult.disciplineLevel) < 5
      }
    };
  }
);

// Test 3: Impossible State Prevention - 100% Discipline with 0% Tilt Control
testRunner.addTest(
  'Impossible State Prevention - High Discipline/Low Tilt',
  'Try to create 100% discipline with 0% tilt control (should be prevented)',
  () => {
    // Create data that would theoretically lead to high discipline but low tilt control
    const emotionalData = createEmotionalData([
      { name: 'DISCIPLINE', value: 100 },
      { name: 'CONFIDENCE', value: 100 },
      { name: 'TILT', value: 0 },
      { name: 'REVENGE', value: 0 }
    ]);
    
    const backendResult = calculatePsychologicalMetricsBackend(emotionalData);
    const frontendResult = calculatePsychologicalMetricsFrontend(emotionalData);
    
    // Check that the algorithm prevents impossible states
    const backendImpossiblePrevented = !(backendResult.disciplineLevel > 90 && backendResult.tiltControl < 10);
    const frontendImpossiblePrevented = !(frontendResult.disciplineLevel > 90 && frontendResult.tiltControl < 10);
    const maxDeviationRespected = Math.abs(backendResult.disciplineLevel - backendResult.tiltControl) <= 30;
    
    const passed = backendImpossiblePrevented && frontendImpossiblePrevented && maxDeviationRespected;
    
    return {
      passed,
      details: {
        backend: backendResult,
        frontend: frontendResult,
        backendImpossiblePrevented,
        frontendImpossiblePrevented,
        maxDeviationRespected,
        deviation: Math.abs(backendResult.disciplineLevel - backendResult.tiltControl)
      }
    };
  }
);

// Test 4: Impossible State Prevention - 0% Discipline with 100% Tilt Control
testRunner.addTest(
  'Impossible State Prevention - Low Discipline/High Tilt',
  'Try to create 0% discipline with 100% tilt control (should be prevented)',
  () => {
    // Create data that would theoretically lead to low discipline but high tilt control
    const emotionalData = createEmotionalData([
      { name: 'DISCIPLINE', value: 0 },
      { name: 'CONFIDENCE', value: 0 },
      { name: 'TILT', value: 100 },
      { name: 'REVENGE', value: 100 }
    ]);
    
    const backendResult = calculatePsychologicalMetricsBackend(emotionalData);
    const frontendResult = calculatePsychologicalMetricsFrontend(emotionalData);
    
    // Check that the algorithm prevents impossible states
    const backendImpossiblePrevented = !(backendResult.disciplineLevel < 10 && backendResult.tiltControl > 90);
    const frontendImpossiblePrevented = !(frontendResult.disciplineLevel < 10 && frontendResult.tiltControl > 90);
    const maxDeviationRespected = Math.abs(backendResult.disciplineLevel - backendResult.tiltControl) <= 30;
    
    const passed = backendImpossiblePrevented && frontendImpossiblePrevented && maxDeviationRespected;
    
    return {
      passed,
      details: {
        backend: backendResult,
        frontend: frontendResult,
        backendImpossiblePrevented,
        frontendImpossiblePrevented,
        maxDeviationRespected,
        deviation: Math.abs(backendResult.disciplineLevel - backendResult.tiltControl)
      }
    };
  }
);

// Test 5: Coupling Factor Effectiveness
testRunner.addTest(
  'Coupling Factor Effectiveness',
  'Test coupling factor effectiveness (currently 0.6)',
  () => {
    const emotionalData = createEmotionalData([
      { name: 'DISCIPLINE', value: 75 },
      { name: 'CONFIDENCE', value: 50 },
      { name: 'PATIENCE', value: 25 },
      { name: 'TILT', value: 25 },
      { name: 'REVENGE', value: 10 }
    ]);
    
    const backendResult = calculatePsychologicalMetricsBackend(emotionalData);
    const frontendResult = calculatePsychologicalMetricsFrontend(emotionalData);
    
    // Check that metrics are reasonably coupled (not too far apart)
    const backendCoupled = Math.abs(backendResult.disciplineLevel - backendResult.tiltControl) <= 30;
    const frontendCoupled = Math.abs(frontendResult.disciplineLevel - frontendResult.tiltControl) <= 30;
    const consistentResults = Math.abs(backendResult.disciplineLevel - frontendResult.disciplineLevel) < 5;
    
    const passed = backendCoupled && frontendCoupled && consistentResults;
    
    return {
      passed,
      details: {
        backend: backendResult,
        frontend: frontendResult,
        backendCoupled,
        frontendCoupled,
        consistentResults,
        backendDeviation: Math.abs(backendResult.disciplineLevel - backendResult.tiltControl),
        frontendDeviation: Math.abs(frontendResult.disciplineLevel - frontendResult.tiltControl)
      }
    };
  }
);

// Test 6: Maximum Deviation Constraint
testRunner.addTest(
  'Maximum Deviation Constraint',
  'Test maximum deviation constraint (currently 30%)',
  () => {
    // Test with extreme values that should trigger the deviation constraint
    const emotionalData = createEmotionalData([
      { name: 'DISCIPLINE', value: 100 },
      { name: 'CONFIDENCE', value: 100 },
      { name: 'PATIENCE', value: 100 },
      { name: 'TILT', value: 0 },
      { name: 'REVENGE', value: 0 },
      { name: 'IMPATIENCE', value: 0 }
    ]);
    
    const backendResult = calculatePsychologicalMetricsBackend(emotionalData);
    const frontendResult = calculatePsychologicalMetricsFrontend(emotionalData);
    
    // Check that deviation never exceeds 30%
    const backendDeviationOk = Math.abs(backendResult.disciplineLevel - backendResult.tiltControl) <= 30;
    const frontendDeviationOk = Math.abs(frontendResult.disciplineLevel - frontendResult.tiltControl) <= 30;
    
    const passed = backendDeviationOk && frontendDeviationOk;
    
    return {
      passed,
      details: {
        backend: backendResult,
        frontend: frontendResult,
        backendDeviationOk,
        frontendDeviationOk,
        backendDeviation: Math.abs(backendResult.disciplineLevel - backendResult.tiltControl),
        frontendDeviation: Math.abs(frontendResult.disciplineLevel - frontendResult.tiltControl)
      }
    };
  }
);

// Test 7: Boundary Conditions - 0% Values
testRunner.addTest(
  'Boundary Conditions - 0% Values',
  'Test boundary conditions with 0% values',
  () => {
    const emotionalData = createEmotionalData([
      { name: 'DISCIPLINE', value: 0 },
      { name: 'CONFIDENCE', value: 0 },
      { name: 'PATIENCE', value: 0 },
      { name: 'TILT', value: 0 },
      { name: 'REVENGE', value: 0 },
      { name: 'IMPATIENCE', value: 0 }
    ]);
    
    const backendResult = calculatePsychologicalMetricsBackend(emotionalData);
    const frontendResult = calculatePsychologicalMetricsFrontend(emotionalData);
    
    // Should handle gracefully and stay within bounds
    const backendValid = backendResult.disciplineLevel >= 0 && backendResult.disciplineLevel <= 100 &&
                        backendResult.tiltControl >= 0 && backendResult.tiltControl <= 100;
    const frontendValid = frontendResult.disciplineLevel >= 0 && frontendResult.disciplineLevel <= 100 &&
                         frontendResult.tiltControl >= 0 && frontendResult.tiltControl <= 100;
    const consistent = Math.abs(backendResult.disciplineLevel - frontendResult.disciplineLevel) < 5;
    
    const passed = backendValid && frontendValid && consistent;
    
    return {
      passed,
      details: {
        backend: backendResult,
        frontend: frontendResult,
        backendValid,
        frontendValid,
        consistent
      }
    };
  }
);

// Test 8: Boundary Conditions - 100% Values
testRunner.addTest(
  'Boundary Conditions - 100% Values',
  'Test boundary conditions with 100% values',
  () => {
    const emotionalData = createEmotionalData([
      { name: 'DISCIPLINE', value: 100 },
      { name: 'CONFIDENCE', value: 100 },
      { name: 'PATIENCE', value: 100 },
      { name: 'TILT', value: 100 },
      { name: 'REVENGE', value: 100 },
      { name: 'IMPATIENCE', value: 100 }
    ]);
    
    const backendResult = calculatePsychologicalMetricsBackend(emotionalData);
    const frontendResult = calculatePsychologicalMetricsFrontend(emotionalData);
    
    // Should handle gracefully and stay within bounds
    const backendValid = backendResult.disciplineLevel >= 0 && backendResult.disciplineLevel <= 100 &&
                        backendResult.tiltControl >= 0 && backendResult.tiltControl <= 100;
    const frontendValid = frontendResult.disciplineLevel >= 0 && frontendResult.disciplineLevel <= 100 &&
                         frontendResult.tiltControl >= 0 && frontendResult.tiltControl <= 100;
    const consistent = Math.abs(backendResult.disciplineLevel - frontendResult.disciplineLevel) < 5;
    const deviationOk = Math.abs(backendResult.disciplineLevel - backendResult.tiltControl) <= 30;
    
    const passed = backendValid && frontendValid && consistent && deviationOk;
    
    return {
      passed,
      details: {
        backend: backendResult,
        frontend: frontendResult,
        backendValid,
        frontendValid,
        consistent,
        deviationOk,
        deviation: Math.abs(backendResult.disciplineLevel - backendResult.tiltControl)
      }
    };
  }
);

// Test 9: Empty Emotional Data
testRunner.addTest(
  'Empty Emotional Data',
  'Test with empty emotional data (should default to 50, 50)',
  () => {
    const backendResult = calculatePsychologicalMetricsBackend([]);
    const frontendResult = calculatePsychologicalMetricsFrontend([]);
    
    const backendDefault = backendResult.disciplineLevel === 50 && backendResult.tiltControl === 50;
    const frontendDefault = frontendResult.disciplineLevel === 50 && frontendResult.tiltControl === 50;
    
    const passed = backendDefault && frontendDefault;
    
    return {
      passed,
      details: {
        backend: backendResult,
        frontend: frontendResult,
        backendDefault,
        frontendDefault
      }
    };
  }
);

// Test 10: Invalid Emotional Data
testRunner.addTest(
  'Invalid Emotional Data',
  'Test with invalid emotional data (should handle gracefully)',
  () => {
    const invalidData = [
      { subject: null, value: undefined },
      { subject: '', value: -50 },
      { subject: 'INVALID_EMOTION', value: 150 },
      { value: 50 }, // missing subject
      { subject: 'DISCIPLINE' } // missing value
    ];
    
    const backendResult = calculatePsychologicalMetricsBackend(invalidData);
    const frontendResult = calculatePsychologicalMetricsFrontend(invalidData);
    
    // Should handle gracefully and stay within bounds
    const backendValid = backendResult.disciplineLevel >= 0 && backendResult.disciplineLevel <= 100 &&
                        backendResult.tiltControl >= 0 && backendResult.tiltControl <= 100;
    const frontendValid = frontendResult.disciplineLevel >= 0 && frontendResult.disciplineLevel <= 100 &&
                         frontendResult.tiltControl >= 0 && frontendResult.tiltControl <= 100;
    
    const passed = backendValid && frontendValid;
    
    return {
      passed,
      details: {
        backend: backendResult,
        frontend: frontendResult,
        backendValid,
        frontendValid
      }
    };
  }
);

// Test 11: Mixed Emotions
testRunner.addTest(
  'Mixed Emotions',
  'Test with mixed emotions (should create balanced, coupled metrics)',
  () => {
    const emotionalData = createEmotionalData([
      { name: 'DISCIPLINE', value: 75 },
      { name: 'CONFIDENCE', value: 60 },
      { name: 'PATIENCE', value: 45 },
      { name: 'TILT', value: 30 },
      { name: 'REVENGE', value: 15 },
      { name: 'IMPATIENCE', value: 25 },
      { name: 'NEUTRAL', value: 50 }
    ]);
    
    const backendResult = calculatePsychologicalMetricsBackend(emotionalData);
    const frontendResult = calculatePsychologicalMetricsFrontend(emotionalData);
    
    // Should create balanced but coupled metrics
    const backendBalanced = Math.abs(backendResult.disciplineLevel - 50) <= 40 &&
                          Math.abs(backendResult.tiltControl - 50) <= 40;
    const frontendBalanced = Math.abs(frontendResult.disciplineLevel - 50) <= 40 &&
                           Math.abs(frontendResult.tiltControl - 50) <= 40;
    const backendCoupled = Math.abs(backendResult.disciplineLevel - backendResult.tiltControl) <= 30;
    const frontendCoupled = Math.abs(frontendResult.disciplineLevel - frontendResult.tiltControl) <= 30;
    const consistent = Math.abs(backendResult.disciplineLevel - frontendResult.disciplineLevel) < 5;
    
    const passed = backendBalanced && frontendBalanced && backendCoupled && frontendCoupled && consistent;
    
    return {
      passed,
      details: {
        backend: backendResult,
        frontend: frontendResult,
        backendBalanced,
        frontendBalanced,
        backendCoupled,
        frontendCoupled,
        consistent,
        backendDeviation: Math.abs(backendResult.disciplineLevel - backendResult.tiltControl),
        frontendDeviation: Math.abs(frontendResult.disciplineLevel - frontendResult.tiltControl)
      }
    };
  }
);

// Test 12: Extreme Emotion Values
testRunner.addTest(
  'Extreme Emotion Values',
  'Test with extreme emotion values (should normalize correctly)',
  () => {
    const emotionalData = createEmotionalData([
      { name: 'DISCIPLINE', value: 1000 }, // Extremely high
      { name: 'CONFIDENCE', value: -100 }, // Negative
      { name: 'PATIENCE', value: 500 },
      { name: 'TILT', value: 0 },
      { name: 'REVENGE', value: 200 }
    ]);
    
    const backendResult = calculatePsychologicalMetricsBackend(emotionalData);
    const frontendResult = calculatePsychologicalMetricsFrontend(emotionalData);
    
    // Should normalize correctly and stay within bounds
    const backendValid = backendResult.disciplineLevel >= 0 && backendResult.disciplineLevel <= 100 &&
                        backendResult.tiltControl >= 0 && backendResult.tiltControl <= 100;
    const frontendValid = frontendResult.disciplineLevel >= 0 && frontendResult.disciplineLevel <= 100 &&
                         frontendResult.tiltControl >= 0 && frontendResult.tiltControl <= 100;
    const deviationOk = Math.abs(backendResult.disciplineLevel - backendResult.tiltControl) <= 30;
    
    const passed = backendValid && frontendValid && deviationOk;
    
    return {
      passed,
      details: {
        backend: backendResult,
        frontend: frontendResult,
        backendValid,
        frontendValid,
        deviationOk,
        deviation: Math.abs(backendResult.disciplineLevel - backendResult.tiltControl)
      }
    };
  }
);

// Test 13: Backend-Frontend Consistency
testRunner.addTest(
  'Backend-Frontend Consistency',
  'Test that backend and frontend implementations produce consistent results',
  () => {
    const testCases = [
      // Case 1: Mixed emotions
      createEmotionalData([
        { name: 'DISCIPLINE', value: 75 },
        { name: 'CONFIDENCE', value: 50 },
        { name: 'TILT', value: 25 }
      ]),
      // Case 2: All positive
      createEmotionalData([
        { name: 'DISCIPLINE', value: 100 },
        { name: 'CONFIDENCE', value: 80 },
        { name: 'PATIENCE', value: 60 }
      ]),
      // Case 3: All negative
      createEmotionalData([
        { name: 'TILT', value: 90 },
        { name: 'REVENGE', value: 70 },
        { name: 'IMPATIENCE', value: 50 }
      ])
    ];
    
    let allConsistent = true;
    const results = [];
    
    testCases.forEach((emotionalData, index) => {
      const backendResult = calculatePsychologicalMetricsBackend(emotionalData);
      const frontendResult = calculatePsychologicalMetricsFrontend(emotionalData);
      
      const disciplineDiff = Math.abs(backendResult.disciplineLevel - frontendResult.disciplineLevel);
      const tiltDiff = Math.abs(backendResult.tiltControl - frontendResult.tiltControl);
      const consistent = disciplineDiff < 5 && tiltDiff < 5;
      
      results.push({
        case: index + 1,
        backend: backendResult,
        frontend: frontendResult,
        disciplineDiff,
        tiltDiff,
        consistent
      });
      
      if (!consistent) {
        allConsistent = false;
      }
    });
    
    return {
      passed: allConsistent,
      details: {
        allConsistent,
        results
      }
    };
  }
);

// Test 14: High Discipline Always Corresponds to High Tilt Control
testRunner.addTest(
  'High Discipline Correlation',
  'Test that high discipline always corresponds to high tilt control',
  () => {
    const testCases = [
      // Various scenarios that should produce high discipline
      createEmotionalData([
        { name: 'DISCIPLINE', value: 100 },
        { name: 'CONFIDENCE', value: 90 },
        { name: 'PATIENCE', value: 80 }
      ]),
      createEmotionalData([
        { name: 'DISCIPLINE', value: 95 },
        { name: 'CONFIDENCE', value: 85 },
        { name: 'NEUTRAL', value: 75 }
      ]),
      createEmotionalData([
        { name: 'DISCIPLINE', value: 90 },
        { name: 'PATIENCE', value: 85 },
        { name: 'ANALYTICAL', value: 80 }
      ])
    ];
    
    let allCorrelated = true;
    const results = [];
    
    testCases.forEach((emotionalData, index) => {
      const backendResult = calculatePsychologicalMetricsBackend(emotionalData);
      const frontendResult = calculatePsychologicalMetricsFrontend(emotionalData);
      
      // High discipline should correspond to high tilt control (both > 70)
      const backendCorrelated = backendResult.disciplineLevel > 70 && backendResult.tiltControl > 70;
      const frontendCorrelated = frontendResult.disciplineLevel > 70 && frontendResult.tiltControl > 70;
      const correlated = backendCorrelated && frontendCorrelated;
      
      results.push({
        case: index + 1,
        backend: backendResult,
        frontend: frontendResult,
        backendCorrelated,
        frontendCorrelated,
        correlated
      });
      
      if (!correlated) {
        allCorrelated = false;
      }
    });
    
    return {
      passed: allCorrelated,
      details: {
        allCorrelated,
        results
      }
    };
  }
);

// Test 15: Performance Test
testRunner.addTest(
  'Performance Test',
  'Test performance should be acceptable (< 50ms per calculation)',
  () => {
    const emotionalData = createEmotionalData([
      { name: 'DISCIPLINE', value: 75 },
      { name: 'CONFIDENCE', value: 60 },
      { name: 'PATIENCE', value: 45 },
      { name: 'TILT', value: 30 },
      { name: 'REVENGE', value: 15 },
      { name: 'IMPATIENCE', value: 25 },
      { name: 'NEUTRAL', value: 50 },
      { name: 'ANALYTICAL', value: 40 }
    ]);
    
    const iterations = 100;
    const backendTimes = [];
    const frontendTimes = [];
    
    // Test backend performance
    for (let i = 0; i < iterations; i++) {
      const startTime = performance.now();
      calculatePsychologicalMetricsBackend(emotionalData);
      const endTime = performance.now();
      backendTimes.push(endTime - startTime);
    }
    
    // Test frontend performance
    for (let i = 0; i < iterations; i++) {
      const startTime = performance.now();
      calculatePsychologicalMetricsFrontend(emotionalData);
      const endTime = performance.now();
      frontendTimes.push(endTime - startTime);
    }
    
    const avgBackendTime = backendTimes.reduce((a, b) => a + b, 0) / backendTimes.length;
    const avgFrontendTime = frontendTimes.reduce((a, b) => a + b, 0) / frontendTimes.length;
    
    const backendPerformant = avgBackendTime < 50;
    const frontendPerformant = avgFrontendTime < 50;
    
    const passed = backendPerformant && frontendPerformant;
    
    return {
      passed,
      details: {
        iterations,
        avgBackendTime,
        avgFrontendTime,
        backendPerformant,
        frontendPerformant,
        maxBackendTime: Math.max(...backendTimes),
        maxFrontendTime: Math.max(...frontendTimes)
      }
    };
  }
);

// Run all tests
testRunner.runTests().catch(console.error);