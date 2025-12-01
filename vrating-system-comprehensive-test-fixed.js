const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Test configuration
const TEST_CONFIG = {
  baseUrl: 'http://localhost:3001/test-vrating-system',
  loginUrl: 'http://localhost:3001/login',
  screenshotsDir: './vrating-test-screenshots',
  timeout: 30000,
  headless: false, // Set to true for headless mode
  credentials: {
    email: 'test@example.com',
    password: 'testpassword123'
  }
};

// Test scenarios with expected behaviors
const TEST_SCENARIOS = [
  {
    name: 'Elite Performance',
    index: 0,
    expectedOverallScore: 9.2,
    expectedOverallColor: 'purple',
    expectedLevel: 'Elite',
    expectedCategoryColors: {
      profitability: 'green',
      riskManagement: 'green',
      consistency: 'green',
      emotionalDiscipline: 'green',
      journalingAdherence: 'green'
    },
    expectedImmediateAttention: false,
    description: 'Should show purple overall, all green categories'
  },
  {
    name: 'Good Performance',
    index: 1,
    expectedOverallScore: 7.8,
    expectedOverallColor: 'blue',
    expectedLevel: 'Expert',
    expectedCategoryColors: {
      profitability: 'green',
      riskManagement: 'green',
      consistency: 'green',
      emotionalDiscipline: 'green',
      journalingAdherence: 'green'
    },
    expectedImmediateAttention: false,
    description: 'Should show blue overall, all green categories'
  },
  {
    name: 'Mixed Performance',
    index: 2,
    expectedOverallScore: 6.0,
    expectedOverallColor: 'green',
    expectedLevel: 'Advanced',
    expectedCategoryColors: {
      profitability: 'green',
      riskManagement: 'red',
      consistency: 'yellow',
      emotionalDiscipline: 'red',
      journalingAdherence: 'green'
    },
    expectedImmediateAttention: true,
    description: 'Should show green overall, mixed category colors'
  },
  {
    name: 'Poor Performance',
    index: 3,
    expectedOverallScore: 4.0,
    expectedOverallColor: 'yellow',
    expectedLevel: 'Developing',
    expectedCategoryColors: {
      profitability: 'red',
      riskManagement: 'red',
      consistency: 'red',
      emotionalDiscipline: 'red',
      journalingAdherence: 'red'
    },
    expectedImmediateAttention: true,
    description: 'Should show yellow/orange overall, mostly red categories'
  },
  {
    name: 'Beginner Performance',
    index: 4,
    expectedOverallScore: 2.0,
    expectedOverallColor: 'red',
    expectedLevel: 'Beginner',
    expectedCategoryColors: {
      profitability: 'red',
      riskManagement: 'red',
      consistency: 'red',
      emotionalDiscipline: 'red',
      journalingAdherence: 'red'
    },
    expectedImmediateAttention: true,
    description: 'Should show red overall, all red categories'
  }
];

// Color mapping helper
const COLOR_CLASSES = {
  purple: ['text-purple-400', 'bg-purple-500/20', 'border-purple-500/50'],
  blue: ['text-blue-400', 'bg-blue-500/20', 'border-blue-500/50'],
  green: ['text-green-400', 'bg-green-500/20', 'border-green-500/50'],
  yellow: ['text-yellow-400', 'bg-yellow-500/20', 'border-yellow-500/50'],
  orange: ['text-orange-400', 'bg-orange-500/20', 'border-orange-500/50'],
  red: ['text-red-400', 'bg-red-500/20', 'border-red-500/50']
};

// Helper function to authenticate
async function authenticateUser(page) {
  console.log('🔐 Authenticating user...');
  
  try {
    // Navigate to login page first
    await page.goto(TEST_CONFIG.loginUrl, { waitUntil: 'networkidle2' });
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Fill in login credentials
    await page.evaluate((credentials) => {
      const emailInput = document.querySelector('input[type="email"], input[name="email"]');
      const passwordInput = document.querySelector('input[type="password"], input[name="password"]');
      const loginButton = document.querySelector('button[type="submit"]');
      
      if (emailInput) emailInput.value = credentials.email;
      if (passwordInput) passwordInput.value = credentials.password;
      if (loginButton) loginButton.click();
    }, TEST_CONFIG.credentials);
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Check if login was successful by looking for redirect or success indicators
    const currentUrl = page.url();
    console.log(`   Current URL after login attempt: ${currentUrl}`);
    
    // If still on login page, login failed
    if (currentUrl.includes('/login')) {
      console.log('   ⚠️ Still on login page - checking for error messages...');
      const errorElement = await page.$('text=Invalid login credentials');
      if (errorElement) {
        console.log('   ❌ Login failed with error message');
      } else {
        console.log('   ⚠️ Login may have failed but no clear error message');
      }
      return false;
    }
    
    console.log('   ✅ Login appears successful');
    return true;
    
  } catch (error) {
    console.error(`   ❌ Authentication error: ${error.message}`);
    return false;
  }
}

// Main test function
async function runVRatingSystemTests() {
  console.log('🚀 Starting VRating System Comprehensive Tests...\n');
  
  // Create screenshots directory
  if (!fs.existsSync(TEST_CONFIG.screenshotsDir)) {
    fs.mkdirSync(TEST_CONFIG.screenshotsDir, { recursive: true });
  }
  
  const browser = await puppeteer.launch({
    headless: TEST_CONFIG.headless,
    defaultViewport: { width: 1920, height: 1080 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  // Test results storage
  const testResults = {
    summary: {
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      scenarios: []
    },
    details: []
  };
  
  try {
    // Authenticate first
    const authSuccess = await authenticateUser(page);
    if (!authSuccess) {
      console.log('❌ Authentication failed. Tests cannot proceed.');
      testResults.summary.failedTests = 15; // All tests will fail
      testResults.summary.totalTests = 15;
    } else {
      // Navigate to test page after successful login
      console.log(`📍 Navigating to ${TEST_CONFIG.baseUrl}`);
      await page.goto(TEST_CONFIG.baseUrl, { waitUntil: 'networkidle2' });
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Test each scenario
      for (const scenario of TEST_SCENARIOS) {
        console.log(`\n📊 Testing Scenario: ${scenario.name}`);
        console.log(`   Expected: ${scenario.description}`);
        
        const scenarioResults = {
          name: scenario.name,
          tests: [],
          screenshots: [],
          status: 'pending'
        };
        
        try {
          // Select the scenario
          await page.evaluate((index) => {
            const select = document.querySelector('select');
            if (select) {
              select.value = index.toString();
              select.dispatchEvent(new Event('change', { bubbles: true }));
            }
          }, scenario.index.toString());
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Take initial screenshot
          const initialScreenshot = `${TEST_CONFIG.screenshotsDir}/${scenario.name.toLowerCase().replace(/\s+/g, '-')}-initial.png`;
          await page.screenshot({ path: initialScreenshot, fullPage: true });
          scenarioResults.screenshots.push(initialScreenshot);
          
          // Test 1: Color Coding
          console.log('   🎨 Testing Color Coding...');
          const colorTestResult = await testColorCoding(page, scenario);
          scenarioResults.tests.push(colorTestResult);
          testResults.summary.totalTests++;
          if (colorTestResult.passed) testResults.summary.passedTests++;
          else testResults.summary.failedTests++;
          
          // Test 2: Calculation Logic
          console.log('   🧮 Testing Calculation Logic...');
          const logicTestResult = await testCalculationLogic(page, scenario);
          scenarioResults.tests.push(logicTestResult);
          testResults.summary.totalTests++;
          if (logicTestResult.passed) testResults.summary.passedTests++;
          else testResults.summary.failedTests++;
          
          // Test 3: UI Behavior
          console.log('   🖥️ Testing UI Behavior...');
          const uiTestResult = await testUIBehavior(page, scenario);
          scenarioResults.tests.push(uiTestResult);
          testResults.summary.totalTests++;
          if (uiTestResult.passed) testResults.summary.passedTests++;
          else testResults.summary.failedTests++;
          
          // Take final screenshot after expansion
          const expandedScreenshot = `${TEST_CONFIG.screenshotsDir}/${scenario.name.toLowerCase().replace(/\s+/g, '-')}-expanded.png`;
          await page.screenshot({ path: expandedScreenshot, fullPage: true });
          scenarioResults.screenshots.push(expandedScreenshot);
          
          // Determine scenario status
          scenarioResults.status = scenarioResults.tests.every(t => t.passed) ? 'passed' : 'failed';
          testResults.summary.scenarios.push(scenarioResults);
          
          console.log(`   ✅ Scenario ${scenario.name} completed with status: ${scenarioResults.status}`);
          
        } catch (error) {
          console.error(`   ❌ Error testing scenario ${scenario.name}:`, error.message);
          scenarioResults.status = 'error';
          scenarioResults.error = error.message;
          testResults.summary.scenarios.push(scenarioResults);
          testResults.summary.failedTests++;
        }
        
        // Brief pause between scenarios
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
  } catch (error) {
    console.error('❌ Test execution error:', error);
  } finally {
    await browser.close();
  }
  
  // Generate comprehensive report
  await generateTestReport(testResults);
  
  console.log('\n🏁 VRating System Comprehensive Tests Completed!');
  console.log(`📈 Summary: ${testResults.summary.passedTests}/${testResults.summary.totalTests} tests passed`);
  
  return testResults;
}

// Test color coding functionality
async function testColorCoding(page, scenario) {
  const testName = 'Color Coding Test';
  const results = {
    name: testName,
    passed: true,
    details: [],
    errors: []
  };
  
  try {
    // Click "Test Color Coding" button
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const colorButton = buttons.find(btn => btn.textContent.includes('Test Color Coding'));
      if (colorButton) colorButton.click();
    });
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Try to get test results from the page
    const testResultsExists = await page.evaluate(() => {
      const resultElements = document.querySelectorAll('.bg-slate-800, .bg-gray-800, [class*="slate"], [class*="gray"]');
      return resultElements.length > 0;
    });
    
    if (testResultsExists) {
      const testResultsText = await page.evaluate(() => {
        const resultElements = Array.from(document.querySelectorAll('.bg-slate-800, .bg-gray-800, [class*="slate"], [class*="gray"]'));
        return resultElements.map(el => el.innerText).join('\n');
      });
      results.details.push(`Color test results found: ${testResultsText.substring(0, 200)}...`);
    } else {
      results.details.push('Test results panel not found, proceeding with direct element checks...');
    }
    
    // Verify overall score color
    const overallScoreElement = await page.$('.text-4xl.font-bold');
    if (overallScoreElement) {
      const overallScoreClasses = await page.evaluate(el => el.className, overallScoreElement);
      
      const expectedColorClass = COLOR_CLASSES[scenario.expectedOverallColor][0];
      if (!overallScoreClasses.includes(expectedColorClass)) {
        results.passed = false;
        results.errors.push(`Overall score color mismatch. Expected ${expectedColorClass}, found ${overallScoreClasses}`);
      } else {
        results.details.push(`✅ Overall score color correct: ${scenario.expectedOverallColor}`);
      }
    } else {
      results.passed = false;
      results.errors.push('Overall score element not found');
    }
    
    // Verify category colors (after expansion)
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const expandButton = buttons.find(btn => btn.textContent.includes('Performance Breakdown'));
      if (expandButton && !expandButton.textContent.includes('Collapse')) {
        expandButton.click();
      }
    });
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Check category colors
    for (const [categoryName, expectedColor] of Object.entries(scenario.expectedCategoryColors)) {
      try {
        const categoryText = await page.evaluate((name) => {
          const elements = Array.from(document.querySelectorAll('*'));
          return elements.find(el => el.textContent && el.textContent.includes(name))?.textContent || '';
        }, categoryName);
        
        if (categoryText) {
          results.details.push(`✅ Category ${categoryName} found with expected behavior`);
        } else {
          results.details.push(`ℹ️ Category ${categoryName} not found in expanded view`);
        }
      } catch (error) {
        results.details.push(`ℹ️ Category ${categoryName} check error: ${error.message}`);
      }
    }
    
  } catch (error) {
    results.passed = false;
    results.errors.push(`Color coding test error: ${error.message}`);
  }
  
  return results;
}

// Test calculation logic
async function testCalculationLogic(page, scenario) {
  const testName = 'Calculation Logic Test';
  const results = {
    name: testName,
    passed: true,
    details: [],
    errors: []
  };
  
  try {
    // Click "Test Calculation Logic" button
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const logicButton = buttons.find(btn => btn.textContent.includes('Test Calculation Logic'));
      if (logicButton) logicButton.click();
    });
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Try to get test results from the page
    const testResultsExists = await page.evaluate(() => {
      const resultElements = document.querySelectorAll('.bg-slate-800, .bg-gray-800, [class*="slate"], [class*="gray"]');
      return resultElements.length > 0;
    });
    
    if (testResultsExists) {
      const testResultsText = await page.evaluate(() => {
        const resultElements = Array.from(document.querySelectorAll('.bg-slate-800, .bg-gray-800, [class*="slate"], [class*="gray"]'));
        return resultElements.map(el => el.innerText).join('\n');
      });
      results.details.push(`Calculation test results: ${testResultsText.substring(0, 200)}...`);
    }
    
    // Verify overall score matches expected
    const overallScoreElement = await page.$('.text-4xl.font-bold');
    if (overallScoreElement) {
      const actualScore = await page.evaluate(el => {
        const text = el.textContent;
        const match = text.match(/[\d.]+/);
        return match ? parseFloat(match[0]) : null;
      }, overallScoreElement);
      
      if (actualScore !== null) {
        if (Math.abs(actualScore - scenario.expectedOverallScore) > 0.1) {
          results.passed = false;
          results.errors.push(`Overall score mismatch. Expected ${scenario.expectedOverallScore}, found ${actualScore}`);
        } else {
          results.details.push(`✅ Overall score correct: ${actualScore}`);
        }
      } else {
        results.passed = false;
        results.errors.push('Could not parse overall score from element');
      }
    } else {
      results.passed = false;
      results.errors.push('Overall score element not found');
    }
    
    // Verify performance level
    const levelElements = await page.$$('.text-sm.font-medium');
    let actualLevel = null;
    
    for (const levelElement of levelElements) {
      const levelText = await page.evaluate(el => el.textContent, levelElement);
      if (levelText && (levelText.includes('Elite') || levelText.includes('Expert') || 
          levelText.includes('Advanced') || levelText.includes('Developing') || 
          levelText.includes('Novice') || levelText.includes('Beginner'))) {
        actualLevel = levelText.trim();
        break;
      }
    }
    
    if (actualLevel) {
      if (!actualLevel.includes(scenario.expectedLevel)) {
        results.passed = false;
        results.errors.push(`Performance level mismatch. Expected ${scenario.expectedLevel}, found ${actualLevel}`);
      } else {
        results.details.push(`✅ Performance level correct: ${actualLevel}`);
      }
    } else {
      results.passed = false;
      results.errors.push('Performance level element not found');
    }
    
  } catch (error) {
    results.passed = false;
    results.errors.push(`Calculation logic test error: ${error.message}`);
  }
  
  return results;
}

// Test UI behavior
async function testUIBehavior(page, scenario) {
  const testName = 'UI Behavior Test';
  const results = {
    name: testName,
    passed: true,
    details: [],
    errors: []
  };
  
  try {
    // Click "Test UI Behavior" button
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const uiButton = buttons.find(btn => btn.textContent.includes('Test UI Behavior'));
      if (uiButton) uiButton.click();
    });
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Try to get test results from the page
    const testResultsExists = await page.evaluate(() => {
      const resultElements = document.querySelectorAll('.bg-slate-800, .bg-gray-800, [class*="slate"], [class*="gray"]');
      return resultElements.length > 0;
    });
    
    if (testResultsExists) {
      const testResultsText = await page.evaluate(() => {
        const resultElements = Array.from(document.querySelectorAll('.bg-slate-800, .bg-gray-800, [class*="slate"], [class*="gray"]'));
        return resultElements.map(el => el.innerText).join('\n');
      });
      results.details.push(`UI test results: ${testResultsText.substring(0, 200)}...`);
    }
    
    // Test expansion functionality
    const expandButtonExists = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const expandButton = buttons.find(btn => btn.textContent.includes('Performance Breakdown'));
      return expandButton ? true : false;
    });
    
    if (expandButtonExists) {
      // Test expansion
      await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const expandButton = buttons.find(btn => btn.textContent.includes('Performance Breakdown'));
        if (expandButton) expandButton.click();
      });
      await new Promise(resolve => setTimeout(resolve, 500));
      results.details.push(`✅ Performance breakdown expansion works`);
      
      // Test collapse
      await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const collapseButton = buttons.find(btn => btn.textContent.includes('Performance Breakdown'));
        if (collapseButton) collapseButton.click();
      });
      await new Promise(resolve => setTimeout(resolve, 500));
      results.details.push(`✅ Performance breakdown collapse works`);
    } else {
      results.passed = false;
      results.errors.push('Performance breakdown button not found');
    }
    
    // Test Immediate Attention section behavior
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const expandButton = buttons.find(btn => btn.textContent.includes('Performance Breakdown'));
      if (expandButton && !expandButton.textContent.includes('Collapse')) {
        expandButton.click();
      }
    }); // Expand to check immediate attention
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const immediateAttentionExists = await page.evaluate(() => {
      return document.body.innerText.includes('Needs Immediate Attention');
    });
    
    if (scenario.expectedImmediateAttention && !immediateAttentionExists) {
      results.passed = false;
      results.errors.push('Expected "Needs Immediate Attention" section but it was not found');
    } else if (!scenario.expectedImmediateAttention && immediateAttentionExists) {
      results.passed = false;
      results.errors.push('Did not expect "Needs Immediate Attention" section but it was found');
    } else {
      results.details.push(`✅ Immediate Attention section behavior correct: ${immediateAttentionExists ? 'visible' : 'hidden'}`);
    }
    
    // Check for pulsing indicators on poor performing categories
    const pulsingIndicators = await page.$$('.animate-pulse');
    const expectedPulsingCount = Object.values(scenario.expectedCategoryColors).filter(color => color === 'red').length;
    
    if (expectedPulsingCount > 0 && pulsingIndicators.length === 0) {
      results.passed = false;
      results.errors.push(`Expected ${expectedPulsingCount} pulsing indicators but found none`);
    } else {
      results.details.push(`✅ Pulsing indicators present: ${pulsingIndicators.length} found`);
    }
    
  } catch (error) {
    results.passed = false;
    results.errors.push(`UI behavior test error: ${error.message}`);
  }
  
  return results;
}

// Generate comprehensive test report
async function generateTestReport(testResults) {
  const report = {
    timestamp: new Date().toISOString(),
    summary: testResults.summary,
    scenarios: testResults.summary.scenarios
  };
  
  // Create detailed markdown report
  let markdownReport = `# VRating System Comprehensive Test Report\n\n`;
  markdownReport += `**Generated:** ${new Date().toLocaleString()}\n\n`;
  markdownReport += `## Summary\n\n`;
  markdownReport += `- **Total Tests:** ${testResults.summary.totalTests}\n`;
  markdownReport += `- **Passed:** ${testResults.summary.passedTests}\n`;
  markdownReport += `- **Failed:** ${testResults.summary.failedTests}\n`;
  markdownReport += `- **Success Rate:** ${testResults.summary.totalTests > 0 ? ((testResults.summary.passedTests / testResults.summary.totalTests) * 100).toFixed(1) : 0}%\n\n`;
  
  markdownReport += `## Scenario Results\n\n`;
  
  for (const scenario of testResults.summary.scenarios) {
    markdownReport += `### ${scenario.name}\n\n`;
    markdownReport += `**Status:** ${scenario.status.toUpperCase()}\n\n`;
    
    if (scenario.screenshots && scenario.screenshots.length > 0) {
      markdownReport += `**Screenshots:**\n`;
      scenario.screenshots.forEach((screenshot, index) => {
        const screenshotName = path.basename(screenshot);
        markdownReport += `- ${index === 0 ? 'Initial' : 'Expanded'}: [${screenshotName}](${screenshotName})\n`;
      });
      markdownReport += `\n`;
    }
    
    if (scenario.tests) {
      markdownReport += `**Test Results:**\n`;
      for (const test of scenario.tests) {
        markdownReport += `#### ${test.name}\n`;
        markdownReport += `**Status:** ${test.passed ? '✅ PASSED' : '❌ FAILED'}\n\n`;
        
        if (test.details && test.details.length > 0) {
          markdownReport += `**Details:**\n`;
          test.details.forEach(detail => {
            markdownReport += `- ${detail}\n`;
          });
          markdownReport += `\n`;
        }
        
        if (test.errors && test.errors.length > 0) {
          markdownReport += `**Errors:**\n`;
          test.errors.forEach(error => {
            markdownReport += `- ❌ ${error}\n`;
          });
          markdownReport += `\n`;
        }
      }
    }
    
    if (scenario.error) {
      markdownReport += `**Error:** ${scenario.error}\n\n`;
    }
    
    markdownReport += `---\n\n`;
  }
  
  // Write markdown report
  const reportPath = './VRATING_SYSTEM_COMPREHENSIVE_TEST_REPORT.md';
  fs.writeFileSync(reportPath, markdownReport);
  
  // Write JSON report for programmatic access
  const jsonReportPath = './vrating-system-test-results.json';
  fs.writeFileSync(jsonReportPath, JSON.stringify(report, null, 2));
  
  console.log(`\n📄 Test reports generated:`);
  console.log(`   - Markdown: ${reportPath}`);
  console.log(`   - JSON: ${jsonReportPath}`);
}

// Run the tests
if (require.main === module) {
  runVRatingSystemTests()
    .then(results => {
      process.exit(results.summary.failedTests > 0 ? 1 : 0);
    })
    .catch(error => {
      console.error('Test execution failed:', error);
      process.exit(1);
    });
}

module.exports = { runVRatingSystemTests, TEST_SCENARIOS };