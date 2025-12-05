const puppeteer = require('puppeteer');
const path = require('path');

class SimpleDurationTest {
  constructor() {
    this.browser = null;
    this.page = null;
    this.testResults = [];
  }

  async init() {
    console.log('🚀 Initializing simple duration test...');
    this.browser = await puppeteer.launch({ 
      headless: false,
      devtools: true
    });
    this.page = await this.browser.newPage();
    
    // Enable console logging from page
    this.page.on('console', msg => {
      console.log('PAGE LOG:', msg.text());
    });
  }

  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async takeScreenshot(name) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `duration-test-${name}-${timestamp}.png`;
    const screenshotPath = path.join(__dirname, filename);
    
    try {
      await this.page.screenshot({ path: screenshotPath, fullPage: false });
      console.log(`📸 Screenshot saved: ${filename}`);
      return screenshotPath;
    } catch (error) {
      console.error(`❌ Failed to take screenshot ${name}:`, error.message);
      return null;
    }
  }

  async testDurationCalculation() {
    console.log('\n🧪 Testing duration calculation feature...');
    
    const testCases = [
      {
        name: 'Same day duration',
        entryTime: '13:00',
        exitTime: '14:10',
        expected: '1h 10min',
        description: 'Entry 13:00, Exit 14:10 should show "1h 10min"'
      },
      {
        name: 'Next day duration',
        entryTime: '13:00',
        exitTime: '12:50',
        expected: '23h 50min',
        description: 'Entry 13:00, Exit 12:50 should show "23h 50min" (next day)'
      },
      {
        name: 'Minutes only duration',
        entryTime: '09:30',
        exitTime: '10:15',
        expected: '45min',
        description: 'Entry 09:30, Exit 10:15 should show "45min"'
      },
      {
        name: 'Zero duration',
        entryTime: '16:00',
        exitTime: '16:00',
        expected: '0min',
        description: 'Entry 16:00, Exit 16:00 should show "0min"'
      },
      {
        name: 'Empty times',
        entryTime: '',
        exitTime: '',
        expected: '',
        description: 'Empty times should not show duration'
      }
    ];

    for (const testCase of testCases) {
      console.log(`\n📋 Testing: ${testCase.name}`);
      console.log(`   ${testCase.description}`);
      
      try {
        // Clear existing times
        await this.page.evaluate(() => {
          const timeInputs = document.querySelectorAll('input[type="time"]');
          timeInputs.forEach(input => input.value = '');
        });
        await this.sleep(500);

        // Fill entry time (first time input)
        if (testCase.entryTime) {
          await this.page.evaluate((time) => {
            const timeInputs = document.querySelectorAll('input[type="time"]');
            if (timeInputs.length > 0) timeInputs[0].value = time;
          }, testCase.entryTime);
          await this.sleep(500);
        }

        // Fill exit time (second time input)
        if (testCase.exitTime) {
          await this.page.evaluate((time) => {
            const timeInputs = document.querySelectorAll('input[type="time"]');
            if (timeInputs.length > 1) timeInputs[1].value = time;
          }, testCase.exitTime);
          await this.sleep(500);
        }

        // Get duration display
        const actualDuration = await this.page.evaluate(() => {
          const durationDiv = document.querySelector('.bg-verotrade-gold-primary\\/10.border-verotrade-gold-primary\\/30');
          if (durationDiv) {
            const durationSpan = durationDiv.querySelector('.text-white.font-medium');
            return durationSpan ? durationSpan.textContent.trim() : null;
          }
          return null;
        });

        // Take screenshot
        await this.takeScreenshot(`${testCase.name.toLowerCase().replace(/\s+/g, '-')}-result`);

        // Verify result
        const passed = actualDuration === testCase.expected;
        console.log(`${passed ? '✅' : '❌'} ${testCase.name}: ${passed ? 'PASSED' : 'FAILED'}`);
        console.log(`   Expected: "${testCase.expected}"`);
        console.log(`   Actual: "${actualDuration}"`);

        this.testResults.push({
          name: testCase.name,
          description: testCase.description,
          expected: testCase.expected,
          actual: actualDuration,
          passed: passed
        });

      } catch (error) {
        console.error(`❌ Error testing ${testCase.name}:`, error.message);
        this.testResults.push({
          name: testCase.name,
          description: testCase.description,
          expected: testCase.expected,
          actual: `ERROR: ${error.message}`,
          passed: false
        });
      }
    }
  }

  async generateReport() {
    console.log('\n📊 Generating test report...');
    
    const passedTests = this.testResults.filter(r => r.passed).length;
    const failedTests = this.testResults.filter(r => !r.passed).length;
    const totalTests = this.testResults.length;

    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalTests,
        passedTests,
        failedTests,
        successRate: totalTests > 0 ? ((passedTests / totalTests) * 100).toFixed(1) + '%' : '0%'
      },
      tests: this.testResults
    };

    // Save JSON report
    const reportFilename = `duration-test-report-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    const reportPath = path.join(__dirname, reportFilename);
    
    try {
      require('fs').writeFileSync(reportPath, JSON.stringify(report, null, 2));
      console.log(`📄 Report saved: ${reportFilename}`);
      
      // Generate console report
      console.log('\n📊 DURATION CALCULATION TEST REPORT');
      console.log('================================');
      console.log(`Total Tests: ${totalTests}`);
      console.log(`Passed: ${passedTests}`);
      console.log(`Failed: ${failedTests}`);
      console.log(`Success Rate: ${report.summary.successRate}`);
      console.log('\nTest Results:');
      
      this.testResults.forEach(test => {
        console.log(`${test.passed ? '✅' : '❌'} ${test.name}:`);
        console.log(`  Expected: "${test.expected}"`);
        console.log(`  Actual: "${test.actual}"`);
        console.log(`  Status: ${test.passed ? 'PASSED' : 'FAILED'}`);
      });
      
      return report;
    } catch (error) {
      console.error('❌ Failed to generate report:', error.message);
      return null;
    }
  }

  async cleanup() {
    console.log('\n🧹 Cleaning up...');
    if (this.browser) {
      await this.browser.close();
    }
  }

  async runTest() {
    try {
      await this.init();
      
      // Navigate to log trade page
      console.log('\n📍 Navigating to log trade page...');
      await this.page.goto('http://localhost:3000/log-trade', { 
        waitUntil: 'networkidle2',
        timeout: 30000 
      });
      
      await this.sleep(2000);
      
      // Check if we need to authenticate
      const currentUrl = this.page.url();
      if (currentUrl.includes('/login')) {
        console.log('⚠️ Authentication required - please login first');
        console.log('⚠️ Skipping duration test - login required');
        await this.cleanup();
        return { success: false, message: 'Authentication required' };
      }
      
      // Fill in required form fields to enable form
      console.log('📝 Filling in required form fields...');
      await this.page.type('input[placeholder*="AAPL"]', 'TEST');
      await this.page.click('button[type="button"]'); // Click first button (stock)
      await this.page.type('input[type="number"]', '100');
      await this.page.type('input[type="date"]', new Date().toISOString().split('T')[0]);
      
      await this.sleep(1000);
      
      // Test duration calculation
      await this.testDurationCalculation();
      
      // Generate report
      const report = await this.generateReport();
      
      await this.cleanup();
      
      return report;
    } catch (error) {
      console.error('❌ Test execution failed:', error.message);
      await this.cleanup();
      return { success: false, error: error.message };
    }
  }
}

// Run test if called directly
if (require.main === module) {
  const tester = new SimpleDurationTest();
  tester.runTest()
    .then(result => {
      if (result && result.success !== false) {
        console.log('\n✅ Duration calculation test completed successfully!');
        process.exit(0);
      } else {
        console.log('\n❌ Duration calculation test failed!');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('💥 Test execution failed:', error);
      process.exit(1);
    });
}

module.exports = SimpleDurationTest;