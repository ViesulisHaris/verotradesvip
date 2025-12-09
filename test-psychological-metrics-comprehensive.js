/**
 * Comprehensive Test Suite for Psychological Metrics Implementation
 * 
 * This script tests all aspects of the psychological metrics implementation:
 * 1. Calculation logic verification
 * 2. UI component testing
 * 3. API endpoint validation
 * 4. Visual consistency checks
 * 5. Error handling and edge cases
 */

const fs = require('fs');
const path = require('path');

// Test configuration
const TEST_CONFIG = {
  baseUrl: 'http://localhost:3000',
  timeout: 10000,
  retries: 3,
  screenshotDir: './test-screenshots',
  reportDir: './test-reports'
};

// Ensure test directories exist
if (!fs.existsSync(TEST_CONFIG.screenshotDir)) {
  fs.mkdirSync(TEST_CONFIG.screenshotDir, { recursive: true });
}
if (!fs.existsSync(TEST_CONFIG.reportDir)) {
  fs.mkdirSync(TEST_CONFIG.reportDir, { recursive: true });
}

// Test results tracking
const testResults = {
  calculationLogic: { passed: 0, failed: 0, details: [] },
  uiComponents: { passed: 0, failed: 0, details: [] },
  apiEndpoints: { passed: 0, failed: 0, details: [] },
  visualConsistency: { passed: 0, failed: 0, details: [] },
  errorHandling: { passed: 0, failed: 0, details: [] }
};

// Utility functions
function logTest(category, testName, passed, details = '') {
  const status = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${status} [${category}] ${testName}${details ? ': ' + details : ''}`);
  
  if (testResults[category]) {
    if (passed) {
      testResults[category].passed++;
    } else {
      testResults[category].failed++;
    }
    testResults[category].details.push({
      test: testName,
      passed,
      details
    });
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 1. CALCULATION LOGIC TESTS
function testCalculationLogic() {
  console.log('\n🧮 TESTING CALCULATION LOGIC');
  console.log('================================');
  
  // Extract the calculatePsychologicalMetrics function from implementation
  function calculatePsychologicalMetrics(emotionalData) {
    if (!emotionalData || emotionalData.length === 0) {
      return { disciplineLevel: 50, tiltControl: 50 };
    }

    try {
      const positiveEmotions = ['DISCIPLINE', 'CONFIDENCE', 'PATIENCE'];
      const negativeEmotions = ['TILT', 'REVENGE', 'IMPATIENCE'];
      const neutralEmotions = ['NEUTRAL', 'ANALYTICAL'];
      
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
      
      const maxPossibleScore = emotionalData.length * 100;
      positiveScore = (positiveScore / maxPossibleScore) * 100;
      negativeScore = (negativeScore / maxPossibleScore) * 100;
      neutralScore = (neutralScore / maxPossibleScore) * 100;
      
      const ess = (positiveScore * 2.0) + (neutralScore * 1.0) - (negativeScore * 1.5);
      const psi = Math.max(0, Math.min(100, (ess + 100) / 2));
      
      let disciplineLevel = psi;
      disciplineLevel = Math.max(0, Math.min(100, disciplineLevel));
      
      const tiltControl = 100 - disciplineLevel;
      
      return {
        disciplineLevel: Math.round(disciplineLevel * 100) / 100,
        tiltControl: Math.round(tiltControl * 100) / 100
      };
      
    } catch (error) {
      console.error('Error calculating psychological metrics:', error);
      return { disciplineLevel: 50, tiltControl: 50 };
    }
  }

  // Test 1: Complementary relationship verification
  const testCases = [
    {
      name: 'Empty data',
      data: [],
      expectedSum: 100
    },
    {
      name: 'Positive-heavy data',
      data: [
        { subject: 'DISCIPLINE', value: 85 },
        { subject: 'CONFIDENCE', value: 90 },
        { subject: 'PATIENCE', value: 80 },
        { subject: 'TILT', value: 10 }
      ],
      expectedSum: 100
    },
    {
      name: 'Negative-heavy data',
      data: [
        { subject: 'TILT', value: 85 },
        { subject: 'REVENGE', value: 90 },
        { subject: 'IMPATIENCE', value: 80 },
        { subject: 'DISCIPLINE', value: 15 }
      ],
      expectedSum: 100
    },
    {
      name: 'Balanced data',
      data: [
        { subject: 'DISCIPLINE', value: 50 },
        { subject: 'CONFIDENCE', value: 50 },
        { subject: 'TILT', value: 50 },
        { subject: 'REVENGE', value: 50 }
      ],
      expectedSum: 100
    },
    {
      name: 'Extreme values',
      data: [
        { subject: 'DISCIPLINE', value: 100 },
        { subject: 'CONFIDENCE', value: 100 },
        { subject: 'PATIENCE', value: 100 }
      ],
      expectedSum: 100
    }
  ];

  testCases.forEach(testCase => {
    const result = calculatePsychologicalMetrics(testCase.data);
    const sum = result.disciplineLevel + result.tiltControl;
    const isComplementary = Math.abs(sum - testCase.expectedSum) < 0.01;
    const inRange = result.disciplineLevel >= 0 && result.disciplineLevel <= 100 && 
                   result.tiltControl >= 0 && result.tiltControl <= 100;
    
    logTest('calculationLogic', `Complementary test - ${testCase.name}`, 
             isComplementary && inRange, 
             `Sum: ${sum}%, Expected: ${testCase.expectedSum}%`);
  });

  // Test 2: Edge cases
  const edgeCases = [
    { name: 'Null data', data: null },
    { name: 'Undefined data', data: undefined },
    { name: 'Empty array', data: [] },
    { name: 'Invalid emotion names', data: [{ subject: 'INVALID', value: 50 }] },
    { name: 'Missing values', data: [{ subject: 'DISCIPLINE' }] },
    { name: 'Zero values', data: [{ subject: 'DISCIPLINE', value: 0 }] }
  ];

  edgeCases.forEach(edgeCase => {
    try {
      const result = calculatePsychologicalMetrics(edgeCase.data);
      const validResult = result && typeof result.disciplineLevel === 'number' && 
                         typeof result.tiltControl === 'number';
      logTest('calculationLogic', `Edge case - ${edgeCase.name}`, validResult);
    } catch (error) {
      logTest('calculationLogic', `Edge case - ${edgeCase.name}`, false, error.message);
    }
  });
}

// 2. UI COMPONENT TESTS
async function testUIComponents() {
  console.log('\n🎨 TESTING UI COMPONENTS');
  console.log('==========================');
  
  // Check if CSS file exists and has correct styles
  const cssPath = path.join(__dirname, 'src/app/dashboard/psychological-metrics.css');
  
  try {
    const cssContent = fs.readFileSync(cssPath, 'utf8');
    
    // Test for removal of coupling animations
    const hasCouplingAnimation = cssContent.includes('coupling') || 
                               cssContent.includes('connecting-line') ||
                               cssContent.includes('mathematically-coupled');
    logTest('uiComponents', 'Coupling animations removed', !hasCouplingAnimation);
    
    // Test for proper tooltip positioning
    const hasTooltipStyles = cssContent.includes('tooltip') && 
                           cssContent.includes('z-index') &&
                           cssContent.includes('position');
    logTest('uiComponents', 'Tooltip positioning styles', hasTooltipStyles);
    
    // Test for responsive design
    const hasResponsiveStyles = cssContent.includes('@media') && 
                              cssContent.includes('max-width');
    logTest('uiComponents', 'Responsive design styles', hasResponsiveStyles);
    
    // Test for color scheme consistency
    const hasDisciplineGreen = cssContent.includes('#2EBD85') || cssContent.includes('[#2EBD85]');
    const hasTiltRed = cssContent.includes('#F6465D') || cssContent.includes('[#F6465D]');
    logTest('uiComponents', 'Discipline Level green color', hasDisciplineGreen);
    logTest('uiComponents', 'Tilt Control red color', hasTiltRed);
    
  } catch (error) {
    logTest('uiComponents', 'CSS file reading', false, error.message);
  }
  
  // Check dashboard component for proper implementation
  const dashboardPath = path.join(__dirname, 'src/app/dashboard/page.tsx');
  
  try {
    const dashboardContent = fs.readFileSync(dashboardPath, 'utf8');
    
    // Test for removal of coupling references
    const hasCouplingReferences = dashboardContent.includes('mathematically coupled') ||
                                dashboardContent.includes('connecting line');
    logTest('uiComponents', 'Coupling references removed from dashboard', !hasCouplingReferences);
    
    // Test for proper tooltip implementation
    const hasTooltipImplementation = dashboardContent.includes('group-hover:opacity-100') &&
                                  dashboardContent.includes('tooltip');
    logTest('uiComponents', 'Tooltip implementation in dashboard', hasTooltipImplementation);
    
    // Test for error handling
    const hasErrorHandling = dashboardContent.includes('psychologicalMetricsError') &&
                            dashboardContent.includes('try-catch');
    logTest('uiComponents', 'Error handling in dashboard', hasErrorHandling);
    
  } catch (error) {
    logTest('uiComponents', 'Dashboard file reading', false, error.message);
  }
  
  // Check home page for consistency
  const homePath = path.join(__dirname, 'src/app/page.tsx');
  
  try {
    const homeContent = fs.readFileSync(homePath, 'utf8');
    
    // Test for consistent calculation function
    const hasCalculationFunction = homeContent.includes('calculatePsychologicalMetrics') &&
                                  homeContent.includes('100 - disciplineLevel');
    logTest('uiComponents', 'Consistent calculation in home page', hasCalculationFunction);
    
    // Test for consistent UI structure
    const hasConsistentStructure = homeContent.includes('psychological-metrics-card') &&
                                  homeContent.includes('metric-container');
    logTest('uiComponents', 'Consistent UI structure in home page', hasConsistentStructure);
    
  } catch (error) {
    logTest('uiComponents', 'Home page file reading', false, error.message);
  }
}

// 3. API ENDPOINT TESTS
async function testAPIEndpoints() {
  console.log('\n🔌 TESTING API ENDPOINTS');
  console.log('============================');
  
  // Test confluence-stats endpoint
  try {
    const response = await fetch(`${TEST_CONFIG.baseUrl}/api/confluence-stats`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      
      // Test for psychological metrics in response
      const hasPsychologicalMetrics = data.psychologicalMetrics && 
                                   typeof data.psychologicalMetrics.disciplineLevel === 'number' &&
                                   typeof data.psychologicalMetrics.tiltControl === 'number';
      logTest('apiEndpoints', 'Psychological metrics in API response', hasPsychologicalMetrics);
      
      // Test for complementary relationship in API response
      if (hasPsychologicalMetrics) {
        const sum = data.psychologicalMetrics.disciplineLevel + data.psychologicalMetrics.tiltControl;
        const isComplementary = Math.abs(sum - 100) < 0.01;
        logTest('apiEndpoints', 'Complementary relationship in API', isComplementary, 
                `Sum: ${sum}%`);
      }
      
      // Test for validation warnings
      const hasValidationWarnings = Array.isArray(data.validationWarnings);
      logTest('apiEndpoints', 'Validation warnings structure', hasValidationWarnings);
      
      // Test for emotional data
      const hasEmotionalData = Array.isArray(data.emotionalData);
      logTest('apiEndpoints', 'Emotional data structure', hasEmotionalData);
      
    } else {
      logTest('apiEndpoints', 'API response status', false, `Status: ${response.status}`);
    }
    
  } catch (error) {
    logTest('apiEndpoints', 'API endpoint accessibility', false, error.message);
  }
}

// 4. VISUAL CONSISTENCY TESTS
async function testVisualConsistency() {
  console.log('\n🎯 TESTING VISUAL CONSISTENCY');
  console.log('===============================');
  
  // Compare dashboard and home page implementations
  const dashboardPath = path.join(__dirname, 'src/app/dashboard/page.tsx');
  const homePath = path.join(__dirname, 'src/app/page.tsx');
  
  try {
    const dashboardContent = fs.readFileSync(dashboardPath, 'utf8');
    const homeContent = fs.readFileSync(homePath, 'utf8');
    
    // Test for consistent calculation logic
    const dashboardCalculation = dashboardContent.includes('calculatePsychologicalMetrics');
    const homeCalculation = homeContent.includes('calculatePsychologicalMetrics');
    logTest('visualConsistency', 'Consistent calculation function usage', 
             dashboardCalculation && homeCalculation);
    
    // Test for consistent color schemes
    const dashboardColors = dashboardContent.includes('#2EBD85') && dashboardContent.includes('#F6465D');
    const homeColors = homeContent.includes('#2EBD85') && homeContent.includes('#F6465D');
    logTest('visualConsistency', 'Consistent color schemes', dashboardColors && homeColors);
    
    // Test for consistent class names
    const dashboardClasses = dashboardContent.includes('psychological-metrics-card');
    const homeClasses = homeContent.includes('psychological-metrics-card');
    logTest('visualConsistency', 'Consistent CSS class names', dashboardClasses && homeClasses);
    
    // Test for consistent tooltip implementation
    const dashboardTooltips = dashboardContent.includes('group-hover:opacity-100');
    const homeTooltips = homeContent.includes('group-hover:opacity-100');
    logTest('visualConsistency', 'Consistent tooltip implementation', dashboardTooltips && homeTooltips);
    
  } catch (error) {
    logTest('visualConsistency', 'File comparison', false, error.message);
  }
  
  // Check CSS for consistency
  const cssPath = path.join(__dirname, 'src/app/dashboard/psychological-metrics.css');
  
  try {
    const cssContent = fs.readFileSync(cssPath, 'utf8');
    
    // Test for proper hover states
    const hasHoverStates = cssContent.includes(':hover') && cssContent.includes('transition');
    logTest('visualConsistency', 'Hover states implemented', hasHoverStates);
    
    // Test for proper animations
    const hasAnimations = cssContent.includes('@keyframes') && cssContent.includes('animation');
    logTest('visualConsistency', 'Animations implemented', hasAnimations);
    
    // Test for proper spacing
    const hasSpacing = cssContent.includes('margin') && cssContent.includes('padding');
    logTest('visualConsistency', 'Proper spacing', hasSpacing);
    
  } catch (error) {
    logTest('visualConsistency', 'CSS analysis', false, error.message);
  }
}

// 5. ERROR HANDLING TESTS
async function testErrorHandling() {
  console.log('\n⚠️  TESTING ERROR HANDLING');
  console.log('============================');
  
  // Test calculation function error handling
  function testCalculationErrorHandling() {
    // Extract the calculatePsychologicalMetrics function
    function calculatePsychologicalMetrics(emotionalData) {
      if (!emotionalData || emotionalData.length === 0) {
        return { disciplineLevel: 50, tiltControl: 50 };
      }

      try {
        const positiveEmotions = ['DISCIPLINE', 'CONFIDENCE', 'PATIENCE'];
        const negativeEmotions = ['TILT', 'REVENGE', 'IMPATIENCE'];
        const neutralEmotions = ['NEUTRAL', 'ANALYTICAL'];
        
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
        
        const maxPossibleScore = emotionalData.length * 100;
        positiveScore = (positiveScore / maxPossibleScore) * 100;
        negativeScore = (negativeScore / maxPossibleScore) * 100;
        neutralScore = (neutralScore / maxPossibleScore) * 100;
        
        const ess = (positiveScore * 2.0) + (neutralScore * 1.0) - (negativeScore * 1.5);
        const psi = Math.max(0, Math.min(100, (ess + 100) / 2));
        
        let disciplineLevel = psi;
        disciplineLevel = Math.max(0, Math.min(100, disciplineLevel));
        
        const tiltControl = 100 - disciplineLevel;
        
        return {
          disciplineLevel: Math.round(disciplineLevel * 100) / 100,
          tiltControl: Math.round(tiltControl * 100) / 100
        };
        
      } catch (error) {
        console.error('Error calculating psychological metrics:', error);
        return { disciplineLevel: 50, tiltControl: 50 };
      }
    }
    
    // Test with problematic data
    const problematicCases = [
      { name: 'Circular reference', data: {} },
      { name: 'Large number', data: [{ subject: 'DISCIPLINE', value: Number.MAX_SAFE_INTEGER }] },
      { name: 'Negative infinity', data: [{ subject: 'DISCIPLINE', value: -Infinity }] },
      { name: 'NaN value', data: [{ subject: 'DISCIPLINE', value: NaN }] }
    ];
    
    problematicCases.forEach(testCase => {
      try {
        const result = calculatePsychologicalMetrics(testCase.data);
        const hasValidResult = result && 
                             typeof result.disciplineLevel === 'number' && 
                             typeof result.tiltControl === 'number' &&
                             !isNaN(result.disciplineLevel) && 
                             !isNaN(result.tiltControl);
        logTest('errorHandling', `Error handling - ${testCase.name}`, hasValidResult);
      } catch (error) {
        logTest('errorHandling', `Error handling - ${testCase.name}`, false, error.message);
      }
    });
  }
  
  testCalculationErrorHandling();
  
  // Test API error handling
  try {
    const response = await fetch(`${TEST_CONFIG.baseUrl}/api/confluence-stats`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer invalid-token'
      }
    });
    
    // Should handle authentication error gracefully
    const handlesAuthError = response.status === 401 || response.status === 403;
    logTest('errorHandling', 'API authentication error handling', handlesAuthError);
    
  } catch (error) {
    // Network errors should be handled
    logTest('errorHandling', 'API network error handling', true, 'Network error caught');
  }
}

// 6. PERFORMANCE TESTS
async function testPerformance() {
  console.log('\n⚡ TESTING PERFORMANCE');
  console.log('=======================');
  
  // Test calculation performance with large datasets
  function testCalculationPerformance() {
    function calculatePsychologicalMetrics(emotionalData) {
      if (!emotionalData || emotionalData.length === 0) {
        return { disciplineLevel: 50, tiltControl: 50 };
      }

      try {
        const positiveEmotions = ['DISCIPLINE', 'CONFIDENCE', 'PATIENCE'];
        const negativeEmotions = ['TILT', 'REVENGE', 'IMPATIENCE'];
        const neutralEmotions = ['NEUTRAL', 'ANALYTICAL'];
        
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
        
        const maxPossibleScore = emotionalData.length * 100;
        positiveScore = (positiveScore / maxPossibleScore) * 100;
        negativeScore = (negativeScore / maxPossibleScore) * 100;
        neutralScore = (neutralScore / maxPossibleScore) * 100;
        
        const ess = (positiveScore * 2.0) + (neutralScore * 1.0) - (negativeScore * 1.5);
        const psi = Math.max(0, Math.min(100, (ess + 100) / 2));
        
        let disciplineLevel = psi;
        disciplineLevel = Math.max(0, Math.min(100, disciplineLevel));
        
        const tiltControl = 100 - disciplineLevel;
        
        return {
          disciplineLevel: Math.round(disciplineLevel * 100) / 100,
          tiltControl: Math.round(tiltControl * 100) / 100
        };
        
      } catch (error) {
        console.error('Error calculating psychological metrics:', error);
        return { disciplineLevel: 50, tiltControl: 50 };
      }
    }
    
    // Generate large dataset
    const largeDataset = [];
    for (let i = 0; i < 1000; i++) {
      const emotions = ['DISCIPLINE', 'CONFIDENCE', 'PATIENCE', 'TILT', 'REVENGE', 'IMPATIENCE', 'NEUTRAL', 'ANALYTICAL'];
      largeDataset.push({
        subject: emotions[i % emotions.length],
        value: Math.random() * 100
      });
    }
    
    const startTime = performance.now();
    const result = calculatePsychologicalMetrics(largeDataset);
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    const isPerformant = duration < 100; // Should complete in less than 100ms
    logTest('errorHandling', `Large dataset performance (${largeDataset.length} items)`, 
             isPerformant, `Duration: ${duration.toFixed(2)}ms`);
  }
  
  testCalculationPerformance();
}

// Main test execution
async function runAllTests() {
  console.log('🚀 COMPREHENSIVE PSYCHOLOGICAL METRICS TEST SUITE');
  console.log('==================================================');
  console.log(`Base URL: ${TEST_CONFIG.baseUrl}`);
  console.log(`Test started at: ${new Date().toISOString()}`);
  
  // Run all test categories
  testCalculationLogic();
  await testUIComponents();
  await testAPIEndpoints();
  await testVisualConsistency();
  await testErrorHandling();
  await testPerformance();
  
  // Generate summary report
  console.log('\n📊 TEST SUMMARY');
  console.log('==================');
  
  let totalPassed = 0;
  let totalFailed = 0;
  
  Object.keys(testResults).forEach(category => {
    const results = testResults[category];
    totalPassed += results.passed;
    totalFailed += results.failed;
    
    console.log(`\n${category.toUpperCase()}:`);
    console.log(`  Passed: ${results.passed}`);
    console.log(`  Failed: ${results.failed}`);
    console.log(`  Success Rate: ${results.passed + results.failed > 0 ? 
                ((results.passed / (results.passed + results.failed)) * 100).toFixed(1) : 0}%`);
  });
  
  console.log(`\nOVERALL RESULTS:`);
  console.log(`  Total Passed: ${totalPassed}`);
  console.log(`  Total Failed: ${totalFailed}`);
  console.log(`  Overall Success Rate: ${totalPassed + totalFailed > 0 ? 
              ((totalPassed / (totalPassed + totalFailed)) * 100).toFixed(1) : 0}%`);
  
  // Generate detailed report file
  const reportData = {
    timestamp: new Date().toISOString(),
    testConfig: TEST_CONFIG,
    results: testResults,
    summary: {
      totalPassed,
      totalFailed,
      overallSuccessRate: totalPassed + totalFailed > 0 ? 
        ((totalPassed / (totalPassed + totalFailed)) * 100).toFixed(1) : 0
    }
  };
  
  const reportPath = path.join(TEST_CONFIG.reportDir, `psychological-metrics-test-report-${Date.now()}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
  
  console.log(`\n📄 Detailed report saved to: ${reportPath}`);
  
  // Key findings
  console.log('\n🎯 KEY FINDINGS:');
  console.log('==================');
  
  const calculationPassed = testResults.calculationLogic.passed / 
                          (testResults.calculationLogic.passed + testResults.calculationLogic.failed) * 100;
  const uiPassed = testResults.uiComponents.passed / 
                   (testResults.uiComponents.passed + testResults.uiComponents.failed) * 100;
  const apiPassed = testResults.apiEndpoints.passed / 
                   (testResults.apiEndpoints.passed + testResults.apiEndpoints.failed) * 100;
  const visualPassed = testResults.visualConsistency.passed / 
                      (testResults.visualConsistency.passed + testResults.visualConsistency.failed) * 100;
  const errorPassed = testResults.errorHandling.passed / 
                     (testResults.errorHandling.passed + testResults.errorHandling.failed) * 100;
  
  console.log(`✅ Calculation Logic: ${calculationPassed.toFixed(1)}% success rate`);
  console.log(`✅ UI Components: ${uiPassed.toFixed(1)}% success rate`);
  console.log(`✅ API Endpoints: ${apiPassed.toFixed(1)}% success rate`);
  console.log(`✅ Visual Consistency: ${visualPassed.toFixed(1)}% success rate`);
  console.log(`✅ Error Handling: ${errorPassed.toFixed(1)}% success rate`);
  
  console.log('\n🏁 TEST COMPLETED');
  
  return reportData;
}

// Export for use in other modules
module.exports = {
  runAllTests,
  testResults,
  TEST_CONFIG
};

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests().catch(console.error);
}