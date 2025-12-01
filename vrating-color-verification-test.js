const puppeteer = require('puppeteer');
const fs = require('fs');

// Test configuration
const TEST_CONFIG = {
  baseUrl: 'http://localhost:3001',
  testPage: '/test-vrating-system',
  scenarios: ['Elite Performance', 'Good Performance', 'Mixed Performance', 'Poor Performance', 'Beginner Performance'],
  screenshotDir: './vrating-color-test-screenshots',
  reportFile: './VRATING_COLOR_CODING_VERIFICATION_REPORT.md'
};

// Expected color mappings based on requirements
const EXPECTED_COLORS = {
  // Category performance levels (getCategoryPerformanceLevel function)
  category: {
    good: { // score >= 7.0
      text: 'text-green-400',
      bg: 'bg-green-500/10',
      border: 'border-green-500/30',
      indicator: 'bg-green-500',
      label: 'Meets Rules',
      miniGauge: 'linear-gradient(90deg, #10b981, #059669)' // green gradient
    },
    medium: { // score >= 5.0 && score < 7.0
      text: 'text-yellow-400',
      bg: 'bg-yellow-500/10',
      border: 'border-yellow-500/30',
      indicator: 'bg-yellow-500',
      label: 'Medium',
      miniGauge: 'linear-gradient(90deg, #f59e0b, #d97706)' // yellow/amber gradient
    },
    poor: { // score < 5.0
      text: 'text-red-400',
      bg: 'bg-red-500/10',
      border: 'border-red-500/30',
      indicator: 'bg-red-500',
      label: "Doesn't Meet",
      miniGauge: 'linear-gradient(90deg, #ef4444, #dc2626)' // red gradient
    }
  },
  // Overall performance levels (getPerformanceLevel function)
  overall: {
    elite: { // score >= 9
      level: 'Elite',
      color: 'text-purple-400',
      bg: 'bg-purple-500/20',
      border: 'border-purple-500/50',
      gauge: 'bg-gradient-to-r from-purple-600 to-purple-400'
    },
    expert: { // score >= 7.5
      level: 'Expert',
      color: 'text-blue-400',
      bg: 'bg-blue-500/20',
      border: 'border-blue-500/50',
      gauge: 'bg-gradient-to-r from-blue-600 to-blue-400'
    },
    advanced: { // score >= 6
      level: 'Advanced',
      color: 'text-green-400',
      bg: 'bg-green-500/20',
      border: 'border-green-500/50',
      gauge: 'bg-gradient-to-r from-green-600 to-green-400'
    },
    developing: { // score >= 4.5
      level: 'Developing',
      color: 'text-yellow-400',
      bg: 'bg-yellow-500/20',
      border: 'border-yellow-500/50',
      gauge: 'bg-gradient-to-r from-yellow-600 to-yellow-400'
    },
    novice: { // score >= 3
      level: 'Novice',
      color: 'text-orange-400',
      bg: 'bg-orange-500/20',
      border: 'border-orange-500/50',
      gauge: 'bg-gradient-to-r from-orange-600 to-orange-400'
    },
    beginner: { // score < 3
      level: 'Beginner',
      color: 'text-red-400',
      bg: 'bg-red-500/20',
      border: 'border-red-500/50',
      gauge: 'bg-gradient-to-r from-red-600 to-red-400'
    }
  }
};

// Expected scores for each test scenario
const EXPECTED_SCORES = {
  'Elite Performance': {
    overall: 9.2,
    categories: {
      profitability: 9.5,
      riskManagement: 9.0,
      consistency: 9.1,
      emotionalDiscipline: 9.3,
      journalingAdherence: 8.8
    }
  },
  'Good Performance': {
    overall: 7.8,
    categories: {
      profitability: 8.2,
      riskManagement: 7.5,
      consistency: 7.8,
      emotionalDiscipline: 8.0,
      journalingAdherence: 7.2
    }
  },
  'Mixed Performance': {
    overall: 6.0,
    categories: {
      profitability: 7.5,
      riskManagement: 4.2,
      consistency: 6.8,
      emotionalDiscipline: 5.5,
      journalingAdherence: 8.0
    }
  },
  'Poor Performance': {
    overall: 4.0,
    categories: {
      profitability: 4.2,
      riskManagement: 3.5,
      consistency: 4.8,
      emotionalDiscipline: 3.0,
      journalingAdherence: 5.0
    }
  },
  'Beginner Performance': {
    overall: 2.0,
    categories: {
      profitability: 2.0,
      riskManagement: 2.5,
      consistency: 1.5,
      emotionalDiscipline: 3.0,
      journalingAdherence: 1.0
    }
  }
};

// Helper function to determine expected category performance level
function getCategoryPerformanceLevel(score) {
  if (score >= 7.0) return 'good';
  else if (score >= 5.0) return 'medium';
  else return 'poor';
}

// Helper function to determine expected overall performance level
function getOverallPerformanceLevel(score) {
  if (score >= 9) return 'elite';
  else if (score >= 7.5) return 'expert';
  else if (score >= 6) return 'advanced';
  else if (score >= 4.5) return 'developing';
  else if (score >= 3) return 'novice';
  else return 'beginner';
}

// Create screenshot directory if it doesn't exist
if (!fs.existsSync(TEST_CONFIG.screenshotDir)) {
  fs.mkdirSync(TEST_CONFIG.screenshotDir, { recursive: true });
}

// Initialize test results
const testResults = {
  timestamp: new Date().toISOString(),
  summary: {
    totalTests: 0,
    passedTests: 0,
    failedTests: 0,
    scenarios: TEST_CONFIG.scenarios.length
  },
  scenarioResults: [],
  issues: [],
  screenshots: []
};

async function runColorVerificationTests() {
  console.log('🚀 Starting VRating Color Coding Verification Tests...');
  
  const browser = await puppeteer.launch({ 
    headless: false, // Set to false for debugging
    defaultViewport: { width: 1920, height: 1080 }
  });
  
  try {
    const page = await browser.newPage();
    
    // Navigate to test page
    console.log(`📍 Navigating to ${TEST_CONFIG.baseUrl}${TEST_CONFIG.testPage}`);
    await page.goto(`${TEST_CONFIG.baseUrl}${TEST_CONFIG.testPage}`, { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    // Wait for page to load
    await page.waitForSelector('select', { timeout: 10000 });
    
    // Test each scenario
    for (let i = 0; i < TEST_CONFIG.scenarios.length; i++) {
      const scenarioName = TEST_CONFIG.scenarios[i];
      console.log(`\n📊 Testing scenario: ${scenarioName}`);
      
      // Select scenario
      await page.select('select', i.toString());
      await page.waitForTimeout(1000);
      
      // Run color coding test
      await page.click('button:contains("Test Color Coding")');
      await page.waitForTimeout(2000);
      
      // Take screenshot
      const screenshotPath = `${TEST_CONFIG.screenshotDir}/vrating-${scenarioName.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.png`;
      await page.screenshot({ path: screenshotPath, fullPage: true });
      testResults.screenshots.push({
        scenario: scenarioName,
        path: screenshotPath
      });
      
      // Verify color coding
      const scenarioResult = await verifyColorCoding(page, scenarioName);
      testResults.scenarioResults.push(scenarioResult);
      
      // Update summary
      testResults.summary.totalTests += scenarioResult.tests.length;
      testResults.summary.passedTests += scenarioResult.passed;
      testResults.summary.failedTests += scenarioResult.failed;
    }
    
    // Generate report
    generateReport();
    
  } catch (error) {
    console.error('❌ Test execution failed:', error);
    testResults.issues.push({
      type: 'execution_error',
      message: error.message,
      stack: error.stack
    });
  } finally {
    await browser.close();
  }
}

async function verifyColorCoding(page, scenarioName) {
  const expectedScores = EXPECTED_SCORES[scenarioName];
  const scenarioResult = {
    scenario: scenarioName,
    expectedOverallScore: expectedScores.overall,
    expectedCategories: expectedScores.categories,
    tests: [],
    passed: 0,
    failed: 0
  };
  
  // Test overall score color
  const expectedOverallLevel = getOverallPerformanceLevel(expectedScores.overall);
  const expectedOverallColors = EXPECTED_COLORS.overall[expectedOverallLevel];
  
  // Check if overall score displays correct color
  const overallScoreElement = await page.$('.text-4xl');
  if (overallScoreElement) {
    const overallScoreClasses = await page.evaluate(el => el.className, overallScoreElement);
    
    scenarioResult.tests.push({
      test: `Overall Score Color (${expectedScores.overall})`,
      expected: expectedOverallColors.color,
      actual: overallScoreClasses,
      passed: overallScoreClasses.includes(expectedOverallColors.color),
      description: `Overall score ${expectedScores.overall} should show ${expectedOverallLevel} level with ${expectedOverallColors.color}`
    });
  }
  
  // Test category colors
  const categoryElements = await page.$$('div[class*="p-3 rounded-lg border"]');
  
  for (const [categoryName, expectedScore] of Object.entries(expectedScores.categories)) {
    const expectedLevel = getCategoryPerformanceLevel(expectedScore);
    const expectedColors = EXPECTED_COLORS.category[expectedLevel];
    
    // Find category element by name
    const categoryElement = await findCategoryElement(page, categoryName);
    if (categoryElement) {
      // Check category text color
      const categoryTextElement = await categoryElement.$('.text-sm.font-medium');
      if (categoryTextElement) {
        const textClasses = await page.evaluate(el => el.className, categoryTextElement);
        
        scenarioResult.tests.push({
          test: `Category Text Color - ${categoryName} (${expectedScore})`,
          expected: expectedColors.text,
          actual: textClasses,
          passed: textClasses.includes(expectedColors.text),
          description: `${categoryName} with score ${expectedScore} should have ${expectedColors.text}`
        });
      }
      
      // Check category background and border colors
      const categoryClasses = await page.evaluate(el => el.className, categoryElement);
      
      scenarioResult.tests.push({
        test: `Category Background/Border - ${categoryName} (${expectedScore})`,
        expected: `${expectedColors.bg} ${expectedColors.borderColor}`,
        actual: categoryClasses,
        passed: categoryClasses.includes(expectedColors.bg) && categoryClasses.includes(expectedColors.borderColor),
        description: `${categoryName} with score ${expectedScore} should have ${expectedColors.bg} and ${expectedColors.borderColor}`
      });
      
      // Check mini gauge color
      const miniGaugeElement = await categoryElement.$('div[style*="background"]');
      if (miniGaugeElement) {
        const gaugeStyle = await page.evaluate(el => el.getAttribute('style'), miniGaugeElement);
        
        scenarioResult.tests.push({
          test: `Mini Gauge Color - ${categoryName} (${expectedScore})`,
          expected: expectedColors.miniGauge,
          actual: gaugeStyle,
          passed: gaugeStyle.includes(expectedColors.miniGauge.replace(/[\s,]/g, '').substring(0, 20)), // Partial match
          description: `${categoryName} mini gauge should show ${expectedColors.miniGauge}`
        });
      }
      
      // Check pulsing indicator for poor performance
      if (expectedLevel === 'poor') {
        const indicatorElement = await categoryElement.$('.animate-pulse');
        scenarioResult.tests.push({
          test: `Pulsing Indicator - ${categoryName} (${expectedScore})`,
          expected: 'animate-pulse class present',
          actual: indicatorElement ? 'animate-pulse class present' : 'animate-pulse class missing',
          passed: !!indicatorElement,
          description: `${categoryName} with score ${expectedScore} should have pulsing indicator`
        });
      }
    } else {
      scenarioResult.tests.push({
        test: `Category Element Found - ${categoryName}`,
        expected: 'Category element should be found',
        actual: 'Category element not found',
        passed: false,
        description: `Could not find category element for ${categoryName}`
      });
    }
  }
  
  // Count passed and failed tests
  scenarioResult.passed = scenarioResult.tests.filter(test => test.passed).length;
  scenarioResult.failed = scenarioResult.tests.filter(test => !test.passed).length;
  
  // Add any failed tests to issues
  scenarioResult.tests.filter(test => !test.passed).forEach(test => {
    testResults.issues.push({
      scenario: scenarioName,
      test: test.test,
      expected: test.expected,
      actual: test.actual,
      description: test.description
    });
  });
  
  return scenarioResult;
}

async function findCategoryElement(page, categoryName) {
  // Try to find category element by looking for the category name in the text
  const categoryElements = await page.$$('div[class*="p-3 rounded-lg border"]');
  
  for (const element of categoryElements) {
    const textContent = await page.evaluate(el => el.textContent, element);
    if (textContent && textContent.includes(categoryName)) {
      return element;
    }
  }
  
  return null;
}

function generateReport() {
  console.log('\n📋 Generating verification report...');
  
  let reportContent = `# VRating Color Coding Verification Report

**Generated:** ${new Date().toLocaleString()}  
**Test URL:** ${TEST_CONFIG.baseUrl}${TEST_CONFIG.testPage}

## Executive Summary

- **Total Scenarios Tested:** ${testResults.summary.scenarios}
- **Total Tests:** ${testResults.summary.totalTests}
- **Passed Tests:** ${testResults.summary.passedTests} (${((testResults.summary.passedTests / testResults.summary.totalTests) * 100).toFixed(1)}%)
- **Failed Tests:** ${testResults.summary.failedTests} (${((testResults.summary.failedTests / testResults.summary.totalTests) * 100).toFixed(1)}%)

## Test Results by Scenario

`;

  // Add results for each scenario
  testResults.scenarioResults.forEach(scenario => {
    reportContent += `### ${scenario.scenario}

**Expected Overall Score:** ${scenario.expectedOverallScore}  
**Tests Passed:** ${scenario.passed}/${scenario.tests.length} (${((scenario.passed / scenario.tests.length) * 100).toFixed(1)}%)

#### Test Details

| Test | Expected | Actual | Status |
|------|----------|--------|--------|
`;

    scenario.tests.forEach(test => {
      const status = test.passed ? '✅ PASS' : '❌ FAIL';
      reportContent += `| ${test.test} | ${test.expected} | ${test.actual} | ${status} |\n`;
    });

    reportContent += '\n';
  });

  // Add issues section if there are any
  if (testResults.issues.length > 0) {
    reportContent += `## Issues Found

`;

    testResults.issues.forEach(issue => {
      reportContent += `### ${issue.test} (${issue.scenario})

- **Expected:** ${issue.expected}
- **Actual:** ${issue.actual}
- **Description:** ${issue.description}

`;
    });
  }

  // Add screenshots section
  reportContent += `## Screenshots

`;

  testResults.screenshots.forEach(screenshot => {
    reportContent += `- ${screenshot.scenario}: ${screenshot.path}\n`;
  });

  // Add conclusion
  const successRate = (testResults.summary.passedTests / testResults.summary.totalTests) * 100;
  reportContent += `
## Conclusion

${successRate >= 95 ? 
  '✅ **EXCELLENT**: Color coding is working correctly with minimal issues.' : 
  successRate >= 80 ? 
  '⚠️ **GOOD**: Color coding is mostly working but some issues need attention.' : 
  '❌ **NEEDS WORK**: Significant color coding issues found that require fixing.'
}

### Recommendations

${testResults.issues.length === 0 ? 
  'No issues found. Color coding implementation is working as expected.' :
  testResults.issues.map(issue => `- Fix ${issue.test} in ${issue.scenario} scenario`).join('\n')
}

---

*This report was generated automatically by the VRating Color Coding Verification Test.*
`;

  // Write report to file
  fs.writeFileSync(TEST_CONFIG.reportFile, reportContent);
  console.log(`📄 Report saved to: ${TEST_CONFIG.reportFile}`);
  
  // Print summary to console
  console.log('\n📊 Test Summary:');
  console.log(`Total Tests: ${testResults.summary.totalTests}`);
  console.log(`Passed: ${testResults.summary.passedTests} (${((testResults.summary.passedTests / testResults.summary.totalTests) * 100).toFixed(1)}%)`);
  console.log(`Failed: ${testResults.summary.failedTests} (${((testResults.summary.failedTests / testResults.summary.totalTests) * 100).toFixed(1)}%)`);
  
  if (testResults.issues.length > 0) {
    console.log('\n⚠️ Issues Found:');
    testResults.issues.forEach(issue => {
      console.log(`- ${issue.test} (${issue.scenario})`);
    });
  } else {
    console.log('\n✅ All tests passed! Color coding is working correctly.');
  }
}

// Run the tests
runColorVerificationTests().catch(console.error);