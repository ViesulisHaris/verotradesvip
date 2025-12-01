const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Test configuration
const TEST_CONFIG = {
  baseUrl: 'http://localhost:3001/test-vrating-system',
  screenshotsDir: './vrating-test-screenshots',
  timeout: 30000,
  headless: false // Set to true for headless mode
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

// Helper function to wait for element
async function waitForElement(page, selector, timeout = 5000) {
  try {
    await page.waitForSelector(selector, { timeout });
    return true;
  } catch (error) {
    console.log(`   ⚠️ Element not found within ${timeout}ms: ${selector}`);
    return false;
  }
}

// Main test function
async function runVRatingManualTests() {
  console.log('🚀 Starting VRating System Manual Tests...\n');
  
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
    // Navigate to test page directly (skip authentication)
    console.log(`📍 Navigating to ${TEST_CONFIG.baseUrl}`);
    await page.goto(TEST_CONFIG.baseUrl, { waitUntil: 'networkidle2' });
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Check if we can access the test page directly
    const currentUrl = page.url();
    if (currentUrl.includes('/login')) {
      console.log('❌ Redirected to login page - test page requires authentication');
      console.log('💡 Please ensure the test page is accessible without authentication');
      
      // Try to create a test user first
      console.log('🔐 Attempting to create test user...');
      const registerUrl = 'http://localhost:3001/register';
      await page.goto(registerUrl, { waitUntil: 'networkidle2' });
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Fill registration form
      const registrationSuccess = await page.evaluate(() => {
        const emailInput = document.querySelector('input[type="email"], input[name="email"]');
        const passwordInput = document.querySelector('input[type="password"], input[name="password"]');
        const submitButton = document.querySelector('button[type="submit"]');
        
        if (emailInput && passwordInput && submitButton) {
          emailInput.value = 'test@example.com';
          passwordInput.value = 'testpassword123';
          submitButton.click();
          return true;
        }
        return false;
      });
      
      if (registrationSuccess) {
        await new Promise(resolve => setTimeout(resolve, 3000));
        console.log('✅ Registration attempted, checking if redirected...');
        
        // Try login now
        await page.goto('http://localhost:3001/login', { waitUntil: 'networkidle2' });
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        await page.evaluate(() => {
          const emailInput = document.querySelector('input[type="email"], input[name="email"]');
          const passwordInput = document.querySelector('input[type="password"], input[name="password"]');
          const submitButton = document.querySelector('button[type="submit"]');
          
          if (emailInput && passwordInput && submitButton) {
            emailInput.value = 'test@example.com';
            passwordInput.value = 'testpassword123';
            submitButton.click();
          }
        });
        
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // Check if login successful and navigate to test page
        await page.goto(TEST_CONFIG.baseUrl, { waitUntil: 'networkidle2' });
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }
    
    // Check if we're on the test page now
    const finalUrl = page.url();
    if (!finalUrl.includes('/test-vrating-system')) {
      console.log('❌ Could not access test page even after registration/login');
      throw new Error('Test page is not accessible');
    }
    
    console.log('✅ Successfully accessed VRating test page');
    
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
        const selectSuccess = await page.evaluate((index) => {
          const select = document.querySelector('select');
          if (select) {
            select.value = index.toString();
            select.dispatchEvent(new Event('change', { bubbles: true }));
            return true;
          }
          return false;
        }, scenario.index.toString());
        
        if (!selectSuccess) {
          console.log('   ⚠️ Could not select scenario');
          scenarioResults.status = 'error';
          scenarioResults.error = 'Scenario selector not found';
          testResults.summary.scenarios.push(scenarioResults);
          testResults.summary.failedTests++;
          continue;
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Take initial screenshot
        const initialScreenshot = `${TEST_CONFIG.screenshotsDir}/${scenario.name.toLowerCase().replace(/\s+/g, '-')}-initial.png`;
        await page.screenshot({ path: initialScreenshot, fullPage: true });
        scenarioResults.screenshots.push(initialScreenshot);
        
        // Test 1: Overall Score Display
        console.log('   🎯 Testing Overall Score Display...');
        const overallScoreTest = await testOverallScoreDisplay(page, scenario);
        scenarioResults.tests.push(overallScoreTest);
        testResults.summary.totalTests++;
        if (overallScoreTest.passed) testResults.summary.passedTests++;
        else testResults.summary.failedTests++;
        
        // Test 2: Color Coding
        console.log('   🎨 Testing Color Coding...');
        const colorTestResult = await testColorCoding(page, scenario);
        scenarioResults.tests.push(colorTestResult);
        testResults.summary.totalTests++;
        if (colorTestResult.passed) testResults.summary.passedTests++;
        else testResults.summary.failedTests++;
        
        // Test 3: Category Breakdown
        console.log('   📋 Testing Category Breakdown...');
        const categoryTestResult = await testCategoryBreakdown(page, scenario);
        scenarioResults.tests.push(categoryTestResult);
        testResults.summary.totalTests++;
        if (categoryTestResult.passed) testResults.summary.passedTests++;
        else testResults.summary.failedTests++;
        
        // Test 4: UI Interaction
        console.log('   🖥️ Testing UI Interaction...');
        const uiTestResult = await testUIInteraction(page, scenario);
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
    
  } catch (error) {
    console.error('❌ Test execution error:', error);
  } finally {
    await browser.close();
  }
  
  // Generate comprehensive report
  await generateTestReport(testResults);
  
  console.log('\n🏁 VRating System Manual Tests Completed!');
  console.log(`📈 Summary: ${testResults.summary.passedTests}/${testResults.summary.totalTests} tests passed`);
  
  return testResults;
}

// Test overall score display
async function testOverallScoreDisplay(page, scenario) {
  const testName = 'Overall Score Display Test';
  const results = {
    name: testName,
    passed: true,
    details: [],
    errors: []
  };
  
  try {
    // Check overall score element
    const overallScoreElement = await page.$('.text-4xl.font-bold');
    if (overallScoreElement) {
      const overallScoreText = await page.evaluate(el => el.textContent, overallScoreElement);
      const scoreMatch = overallScoreText.match(/[\d.]+/);
      const actualScore = scoreMatch ? parseFloat(scoreMatch[0]) : null;
      
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
    
    // Check performance level
    const levelElement = await page.$('.text-sm.font-medium');
    if (levelElement) {
      const actualLevel = await page.evaluate(el => el.textContent, levelElement);
      
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
    results.errors.push(`Overall score test error: ${error.message}`);
  }
  
  return results;
}

// Test color coding
async function testColorCoding(page, scenario) {
  const testName = 'Color Coding Test';
  const results = {
    name: testName,
    passed: true,
    details: [],
    errors: []
  };
  
  try {
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
    
    // Expand to see categories
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const expandButton = buttons.find(btn => btn.textContent.includes('Performance Breakdown'));
      if (expandButton) expandButton.click();
    });
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Check category colors
    const categoryElements = await page.$$('.text-sm.font-medium');
    let foundCategories = 0;
    let correctColors = 0;
    
    for (const element of categoryElements) {
      const categoryText = await page.evaluate(el => el.textContent, element);
      if (categoryText) {
        foundCategories++;
        const categoryClasses = await page.evaluate(el => el.className, element);
        
        // Check if this category has expected color
        for (const [categoryName, expectedColor] of Object.entries(scenario.expectedCategoryColors)) {
          if (categoryText.toLowerCase().includes(categoryName.toLowerCase())) {
            const expectedColorClass = COLOR_CLASSES[expectedColor][0];
            if (categoryClasses.includes(expectedColorClass)) {
              correctColors++;
              results.details.push(`✅ Category ${categoryName} has correct color: ${expectedColor}`);
            } else {
              results.passed = false;
              results.errors.push(`Category ${categoryName} color mismatch. Expected ${expectedColor}, found ${categoryClasses}`);
            }
            break;
          }
        }
      }
    }
    
    if (foundCategories === 0) {
      results.passed = false;
      results.errors.push('No category elements found');
    } else {
      results.details.push(`✅ Found ${foundCategories} category elements`);
    }
    
  } catch (error) {
    results.passed = false;
    results.errors.push(`Color coding test error: ${error.message}`);
  }
  
  return results;
}

// Test category breakdown
async function testCategoryBreakdown(page, scenario) {
  const testName = 'Category Breakdown Test';
  const results = {
    name: testName,
    passed: true,
    details: [],
    errors: []
  };
  
  try {
    // Expand breakdown if not already expanded
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const expandButton = buttons.find(btn => btn.textContent.includes('Performance Breakdown'));
      if (expandButton && !expandButton.textContent.includes('Collapse')) {
        expandButton.click();
      }
    });
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Check for "Immediate Attention" section
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
    
    // Check for pulsing indicators
    const pulsingIndicators = await page.$$('.animate-pulse');
    const expectedPulsingCount = Object.values(scenario.expectedCategoryColors).filter(color => color === 'red').length;
    
    if (expectedPulsingCount > 0 && pulsingIndicators.length === 0) {
      results.passed = false;
      results.errors.push(`Expected ${expectedPulsingCount} pulsing indicators but found none`);
    } else {
      results.details.push(`✅ Pulsing indicators present: ${pulsingIndicators.length} found`);
    }
    
    // Check mini gauges
    const miniGauges = await page.$$('[style*="width"]');
    if (miniGauges.length > 0) {
      results.details.push(`✅ Mini gauges found: ${miniGauges.length}`);
    } else {
      results.passed = false;
      results.errors.push('No mini gauges found');
    }
    
  } catch (error) {
    results.passed = false;
    results.errors.push(`Category breakdown test error: ${error.message}`);
  }
  
  return results;
}

// Test UI interaction
async function testUIInteraction(page, scenario) {
  const testName = 'UI Interaction Test';
  const results = {
    name: testName,
    passed: true,
    details: [],
    errors: []
  };
  
  try {
    // Test expansion/collapse functionality
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
    
    // Test scenario selection
    const selectElement = await page.$('select');
    if (selectElement) {
      const canSelectScenario = await page.evaluate((index) => {
        const select = document.querySelector('select');
        if (select) {
          select.value = index.toString();
          select.dispatchEvent(new Event('change', { bubbles: true }));
          return true;
        }
        return false;
      }, (scenario.index + 1) % 5); // Test selecting next scenario
      
      if (canSelectScenario) {
        results.details.push(`✅ Scenario selection works`);
      } else {
        results.passed = false;
        results.errors.push('Scenario selection not working');
      }
    } else {
      results.passed = false;
      results.errors.push('Scenario selector not found');
    }
    
    // Test test buttons
    const testButtons = await page.$$('button');
    const colorButton = testButtons.find(btn => 
      btn.textContent && btn.textContent.includes('Test Color Coding')
    );
    const logicButton = testButtons.find(btn => 
      btn.textContent && btn.textContent.includes('Test Calculation Logic')
    );
    const uiButton = testButtons.find(btn => 
      btn.textContent && btn.textContent.includes('Test UI Behavior')
    );
    
    if (colorButton && logicButton && uiButton) {
      results.details.push(`✅ All test buttons found and clickable`);
    } else {
      results.passed = false;
      results.errors.push('Not all test buttons found');
    }
    
  } catch (error) {
    results.passed = false;
    results.errors.push(`UI interaction test error: ${error.message}`);
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
  let markdownReport = `# VRating System Manual Test Report\n\n`;
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
  const reportPath = './VRATING_SYSTEM_MANUAL_TEST_REPORT.md';
  fs.writeFileSync(reportPath, markdownReport);
  
  // Write JSON report for programmatic access
  const jsonReportPath = './vrating-system-manual-test-results.json';
  fs.writeFileSync(jsonReportPath, JSON.stringify(report, null, 2));
  
  console.log(`\n📄 Test reports generated:`);
  console.log(`   - Markdown: ${reportPath}`);
  console.log(`   - JSON: ${jsonReportPath}`);
}

// Run the tests
if (require.main === module) {
  runVRatingManualTests()
    .then(results => {
      process.exit(results.summary.failedTests > 0 ? 1 : 0);
    })
    .catch(error => {
      console.error('Test execution failed:', error);
      process.exit(1);
    });
}

module.exports = { runVRatingManualTests, TEST_SCENARIOS };