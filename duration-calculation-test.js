const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// Test configuration
const config = {
  baseUrl: 'http://localhost:3000',
  screenshotsDir: './duration-test-screenshots',
  reportFile: './duration-calculation-test-report.json',
  timeout: 30000
};

// Test cases for duration calculation
const testCases = [
  {
    id: 'test-1',
    name: 'Same day duration calculation',
    entryTime: '13:00',
    exitTime: '14:10',
    expectedDuration: '1h 10min',
    description: 'Entry 13:00, Exit 14:10 should show "1h 10min"'
  },
  {
    id: 'test-2',
    name: 'Next day duration calculation',
    entryTime: '13:00',
    exitTime: '12:50',
    expectedDuration: '23h 50min',
    description: 'Entry 13:00, Exit 12:50 should show "23h 50min" (next day)'
  },
  {
    id: 'test-3',
    name: 'Minutes only duration',
    entryTime: '09:30',
    exitTime: '10:15',
    expectedDuration: '45min',
    description: 'Entry 09:30, Exit 10:15 should show "45min"'
  },
  {
    id: 'test-4',
    name: 'Zero duration',
    entryTime: '16:00',
    exitTime: '16:00',
    expectedDuration: '0min',
    description: 'Entry 16:00, Exit 16:00 should show "0min"'
  },
  {
    id: 'test-5',
    name: 'Empty times',
    entryTime: '',
    exitTime: '',
    expectedDuration: '',
    description: 'Empty times should not show duration'
  }
];

// Create screenshots directory if it doesn't exist
if (!fs.existsSync(config.screenshotsDir)) {
  fs.mkdirSync(config.screenshotsDir, { recursive: true });
}

// Initialize test results
const testResults = {
  summary: {
    totalTests: testCases.length,
    passed: 0,
    failed: 0,
    startTime: new Date().toISOString(),
    endTime: null,
    duration: null
  },
  tests: []
};

// Helper function to wait for element and get its text
async function getElementText(page, selector) {
  try {
    const element = await page.waitForSelector(selector, { timeout: 5000 });
    return await element.textContent();
  } catch (error) {
    return null;
  }
}

// Helper function to take screenshot
async function takeScreenshot(page, testName, step) {
  const screenshotPath = path.join(config.screenshotsDir, `${testName}-${step}.png`);
  await page.screenshot({ path: screenshotPath, fullPage: false });
  return screenshotPath;
}

// Helper function to login (simplified for testing)
async function login(page) {
  try {
    // Navigate to login page
    await page.goto(`${config.baseUrl}/login`);
    await page.waitForLoadState('networkidle');
    
    // Fill login form (adjust selectors as needed)
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'testpassword123');
    await page.click('button[type="submit"]');
    
    // Wait for navigation to dashboard
    await page.waitForURL(`${config.baseUrl}/dashboard`);
    await page.waitForLoadState('networkidle');
    
    console.log('✅ Login successful');
    return true;
  } catch (error) {
    console.error('❌ Login failed:', error.message);
    return false;
  }
}

// Main test function
async function runDurationCalculationTests() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  const page = await context.newPage();

  try {
    console.log('🚀 Starting Duration Calculation Tests...\n');

    // Navigate to log trade page
    console.log('📍 Navigating to log trade page...');
    await page.goto(`${config.baseUrl}/log-trade`);
    await page.waitForLoadState('networkidle');
    
    // Take initial screenshot
    await takeScreenshot(page, 'initial', 'page-load');
    
    // Check if we need to login
    const currentUrl = page.url();
    if (currentUrl.includes('/login')) {
      console.log('🔐 Login required, attempting to login...');
      const loginSuccess = await login(page);
      if (!loginSuccess) {
        throw new Error('Failed to login');
      }
      
      // Navigate back to log trade page after login
      await page.goto(`${config.baseUrl}/log-trade`);
      await page.waitForLoadState('networkidle');
    }

    // Fill in required form fields to enable the form
    console.log('📝 Filling in required form fields...');
    await page.fill('input[placeholder="e.g., AAPL, BTCUSD"]', 'TEST');
    await page.click('button[type="button"]:has-text("stock")');
    await page.fill('input[type="number"]', '100');
    await page.fill('input[type="date"]', new Date().toISOString().split('T')[0]);

    // Run each test case
    for (const testCase of testCases) {
      console.log(`\n🧪 Running test: ${testCase.name}`);
      console.log(`   Description: ${testCase.description}`);
      
      const testResult = {
        id: testCase.id,
        name: testCase.name,
        description: testCase.description,
        entryTime: testCase.entryTime,
        exitTime: testCase.exitTime,
        expectedDuration: testCase.expectedDuration,
        actualDuration: null,
        passed: false,
        screenshots: [],
        error: null,
        timestamp: new Date().toISOString()
      };

      try {
        // Clear existing times - use the correct selector approach
        await page.evaluate(() => {
          const timeInputs = document.querySelectorAll('input[type="time"]');
          timeInputs.forEach(input => input.value = '');
        });
        await page.waitForTimeout(500); // Wait for UI to update

        // Fill entry time - use first time input (entry time)
        if (testCase.entryTime) {
          await page.evaluate((time) => {
            const timeInputs = document.querySelectorAll('input[type="time"]');
            if (timeInputs.length > 0) timeInputs[0].value = time;
          }, testCase.entryTime);
          await page.waitForTimeout(500); // Wait for real-time update
        }

        // Take screenshot after entry time
        const entryScreenshot = await takeScreenshot(page, testCase.id, 'after-entry');
        testResult.screenshots.push(entryScreenshot);

        // Fill exit time - use second time input (exit time)
        if (testCase.exitTime) {
          await page.evaluate((time) => {
            const timeInputs = document.querySelectorAll('input[type="time"]');
            if (timeInputs.length > 1) timeInputs[1].value = time;
          }, testCase.exitTime);
          await page.waitForTimeout(500); // Wait for real-time update
        }

        // Take screenshot after exit time
        const exitScreenshot = await takeScreenshot(page, testCase.id, 'after-exit');
        testResult.screenshots.push(exitScreenshot);

        // Get the duration display
        const durationSelector = '.bg-verotrade-gold-primary\\/10 .text-white.font-medium';
        const actualDuration = await getElementText(page, durationSelector);
        
        testResult.actualDuration = actualDuration || '';

        // Verify the result
        if (testCase.expectedDuration === '') {
          // For empty times, duration should not be displayed
          if (actualDuration === null || actualDuration === '') {
            testResult.passed = true;
            console.log(`   ✅ PASSED: Duration correctly not displayed`);
          } else {
            testResult.passed = false;
            testResult.error = `Expected no duration, but got: "${actualDuration}"`;
            console.log(`   ❌ FAILED: Expected no duration, but got: "${actualDuration}"`);
          }
        } else {
          // For non-empty times, check if duration matches expected
          if (actualDuration && actualDuration.trim() === testCase.expectedDuration) {
            testResult.passed = true;
            console.log(`   ✅ PASSED: Duration "${actualDuration}" matches expected "${testCase.expectedDuration}"`);
          } else {
            testResult.passed = false;
            testResult.error = `Expected "${testCase.expectedDuration}", but got: "${actualDuration}"`;
            console.log(`   ❌ FAILED: Expected "${testCase.expectedDuration}", but got: "${actualDuration}"`);
          }
        }

        // Take final screenshot for this test
        const finalScreenshot = await takeScreenshot(page, testCase.id, 'final');
        testResult.screenshots.push(finalScreenshot);

      } catch (error) {
        testResult.passed = false;
        testResult.error = error.message;
        console.log(`   ❌ ERROR: ${error.message}`);
        
        // Take error screenshot
        const errorScreenshot = await takeScreenshot(page, testCase.id, 'error');
        testResult.screenshots.push(errorScreenshot);
      }

      // Update counters
      if (testResult.passed) {
        testResults.summary.passed++;
      } else {
        testResults.summary.failed++;
      }

      testResults.tests.push(testResult);
    }

    // Test real-time updates
    console.log('\n🔄 Testing real-time updates...');
    const realtimeTest = {
      id: 'realtime-test',
      name: 'Real-time update test',
      description: 'Verify duration updates in real-time when times change',
      passed: false,
      screenshots: [],
      error: null,
      timestamp: new Date().toISOString()
    };

    try {
      // Clear times - use the correct selector approach
      await page.evaluate(() => {
        const timeInputs = document.querySelectorAll('input[type="time"]');
        timeInputs.forEach(input => input.value = '');
      });
      await page.waitForTimeout(500);

      // Set entry time - use first time input
      await page.evaluate((time) => {
        const timeInputs = document.querySelectorAll('input[type="time"]');
        if (timeInputs.length > 0) timeInputs[0].value = time;
      }, '10:00');
      await page.waitForTimeout(500);
      
      const afterEntry = await getElementText(page, '.bg-verotrade-gold-primary\\/10 .text-white.font-medium');
      
      // Set exit time - use second time input
      await page.evaluate((time) => {
        const timeInputs = document.querySelectorAll('input[type="time"]');
        if (timeInputs.length > 1) timeInputs[1].value = time;
      }, '11:30');
      await page.waitForTimeout(500);
      
      const afterExit = await getElementText(page, '.bg-verotrade-gold-primary\\/10 .text-white.font-medium');
      
      // Change exit time - use second time input
      await page.evaluate((time) => {
        const timeInputs = document.querySelectorAll('input[type="time"]');
        if (timeInputs.length > 1) timeInputs[1].value = time;
      }, '12:45');
      await page.waitForTimeout(500);
      
      const afterChange = await getElementText(page, '.bg-verotrade-gold-primary\\/10 .text-white.font-medium');

      // Verify real-time updates
      if (afterEntry === null || afterEntry === '') {
        realtimeTest.passed = false;
        realtimeTest.error = 'Duration should not appear with only entry time';
      } else if (afterExit === '1h 30min' && afterChange === '2h 45min') {
        realtimeTest.passed = true;
        console.log('   ✅ PASSED: Real-time updates working correctly');
      } else {
        realtimeTest.passed = false;
        realtimeTest.error = `Expected "1h 30min" then "2h 45min", got "${afterExit}" then "${afterChange}"`;
        console.log(`   ❌ FAILED: Expected "1h 30min" then "2h 45min", got "${afterExit}" then "${afterChange}"`);
      }

      // Take screenshots for real-time test
      const rtScreenshot1 = await takeScreenshot(page, 'realtime', 'after-entry');
      const rtScreenshot2 = await takeScreenshot(page, 'realtime', 'after-exit');
      const rtScreenshot3 = await takeScreenshot(page, 'realtime', 'after-change');
      realtimeTest.screenshots = [rtScreenshot1, rtScreenshot2, rtScreenshot3];

    } catch (error) {
      realtimeTest.passed = false;
      realtimeTest.error = error.message;
      console.log(`   ❌ ERROR: ${error.message}`);
    }

    testResults.tests.push(realtimeTest);
    
    if (realtimeTest.passed) {
      testResults.summary.passed++;
    } else {
      testResults.summary.failed++;
    }

  } catch (error) {
    console.error('💥 Test execution failed:', error);
  } finally {
    await browser.close();
  }

  // Finalize test results
  testResults.summary.endTime = new Date().toISOString();
  testResults.summary.duration = new Date(testResults.summary.endTime) - new Date(testResults.summary.startTime);

  // Save test report
  fs.writeFileSync(config.reportFile, JSON.stringify(testResults, null, 2));
  
  // Print summary
  console.log('\n📊 Test Summary:');
  console.log(`   Total Tests: ${testResults.summary.totalTests}`);
  console.log(`   Passed: ${testResults.summary.passed}`);
  console.log(`   Failed: ${testResults.summary.failed}`);
  console.log(`   Duration: ${testResults.summary.duration}ms`);
  console.log(`   Report saved to: ${config.reportFile}`);
  console.log(`   Screenshots saved to: ${config.screenshotsDir}`);

  return testResults;
}

// Run the tests
if (require.main === module) {
  runDurationCalculationTests()
    .then(results => {
      console.log('\n✅ All tests completed!');
      process.exit(results.summary.failed > 0 ? 1 : 0);
    })
    .catch(error => {
      console.error('💥 Test execution failed:', error);
      process.exit(1);
    });
}

module.exports = { runDurationCalculationTests, testCases };