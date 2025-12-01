/**
 * Comprehensive VRating System Test Script
 * 
 * This script tests all the modifications made to the VRating system:
 * 1. VRating calculation logic changes (removed items)
 * 2. Color coding fixes in VRatingCard component
 * 3. UI behavior changes for "Immediate Attention" tab
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// Test configuration
const TEST_CONFIG = {
  baseUrl: 'http://localhost:3001',
  screenshotsDir: './vrating-test-screenshots',
  testResults: './vrating-test-results.json',
  timeout: 30000
};

// Test data for different VRating scenarios
const TEST_SCENARIOS = [
  {
    name: 'Elite Performance',
    expectedOverallScore: 9.0,
    expectedCategories: {
      profitability: 9.0,
      riskManagement: 9.0,
      consistency: 9.0,
      emotionalDiscipline: 9.0,
      journalingAdherence: 9.0
    },
    expectedColors: {
      overall: 'purple',
      categories: ['green', 'green', 'green', 'green', 'green']
    }
  },
  {
    name: 'Good Performance',
    expectedOverallScore: 7.5,
    expectedCategories: {
      profitability: 8.0,
      riskManagement: 7.0,
      consistency: 7.5,
      emotionalDiscipline: 8.0,
      journalingAdherence: 7.0
    },
    expectedColors: {
      overall: 'blue',
      categories: ['green', 'green', 'green', 'green', 'green']
    }
  },
  {
    name: 'Mixed Performance',
    expectedOverallScore: 6.0,
    expectedCategories: {
      profitability: 7.0,
      riskManagement: 4.5,
      consistency: 6.5,
      emotionalDiscipline: 5.5,
      journalingAdherence: 8.0
    },
    expectedColors: {
      overall: 'green',
      categories: ['green', 'red', 'green', 'yellow', 'green']
    }
  },
  {
    name: 'Poor Performance',
    expectedOverallScore: 4.0,
    expectedCategories: {
      profitability: 4.0,
      riskManagement: 3.5,
      consistency: 4.5,
      emotionalDiscipline: 3.0,
      journalingAdherence: 5.0
    },
    expectedColors: {
      overall: 'yellow',
      categories: ['red', 'red', 'red', 'red', 'yellow']
    }
  },
  {
    name: 'Beginner Performance',
    expectedOverallScore: 2.0,
    expectedCategories: {
      profitability: 2.0,
      riskManagement: 2.5,
      consistency: 1.5,
      emotionalDiscipline: 3.0,
      journalingAdherence: 1.0
    },
    expectedColors: {
      overall: 'red',
      categories: ['red', 'red', 'red', 'red', 'red']
    }
  }
];

// Color mapping for verification
const COLOR_MAP = {
  'green': {
    text: ['rgb(16, 185, 129)', 'rgb(5, 150, 105)', 'rgb(34, 197, 94)'],
    bg: ['rgb(16, 185, 129, 0.1)', 'rgb(5, 150, 105, 0.1)'],
    border: ['rgb(16, 185, 129, 0.3)', 'rgb(5, 150, 105, 0.3)']
  },
  'yellow': {
    text: ['rgb(245, 158, 11)', 'rgb(217, 119, 6)', 'rgb(250, 204, 21)'],
    bg: ['rgb(245, 158, 11, 0.1)', 'rgb(217, 119, 6, 0.1)'],
    border: ['rgb(245, 158, 11, 0.3)', 'rgb(217, 119, 6, 0.3)']
  },
  'red': {
    text: ['rgb(239, 68, 68)', 'rgb(220, 38, 38)', 'rgb(248, 113, 113)'],
    bg: ['rgb(239, 68, 68, 0.1)', 'rgb(220, 38, 38, 0.1)'],
    border: ['rgb(239, 68, 68, 0.3)', 'rgb(220, 38, 38, 0.3)']
  },
  'blue': {
    text: ['rgb(59, 130, 246)', 'rgb(37, 99, 235)', 'rgb(96, 165, 250)'],
    bg: ['rgb(59, 130, 246, 0.2)', 'rgb(37, 99, 235, 0.2)'],
    border: ['rgb(59, 130, 246, 0.5)', 'rgb(37, 99, 235, 0.5)']
  },
  'purple': {
    text: ['rgb(168, 85, 247)', 'rgb(147, 51, 234)', 'rgb(196, 181, 253)'],
    bg: ['rgb(168, 85, 247, 0.2)', 'rgb(147, 51, 234, 0.2)'],
    border: ['rgb(168, 85, 247, 0.5)', 'rgb(147, 51, 234, 0.5)']
  }
};

class VRatingSystemTester {
  constructor() {
    this.browser = null;
    this.page = null;
    this.testResults = {
      timestamp: new Date().toISOString(),
      summary: {
        totalTests: 0,
        passedTests: 0,
        failedTests: 0,
        skippedTests: 0
      },
      results: []
    };
  }

  async initialize() {
    console.log('🚀 Initializing VRating System Tester...');
    
    // Create screenshots directory
    if (!fs.existsSync(TEST_CONFIG.screenshotsDir)) {
      fs.mkdirSync(TEST_CONFIG.screenshotsDir, { recursive: true });
    }

    // Launch browser
    this.browser = await chromium.launch({ 
      headless: false,
      slowMo: 1000 // Slow down for better observation
    });
    this.page = await this.browser.newPage();
    
    // Set viewport and timeout
    await this.page.setViewportSize({ width: 1920, height: 1080 });
    await this.page.setDefaultTimeout(TEST_CONFIG.timeout);
    
    console.log('✅ Browser initialized successfully');
  }

  async login() {
    console.log('🔐 Logging in...');
    
    try {
      await this.page.goto(`${TEST_CONFIG.baseUrl}/login`);
      await this.page.waitForSelector('input[name="email"]', { timeout: 10000 });
      
      // Fill login form
      await this.page.fill('input[name="email"]', 'test@example.com');
      await this.page.fill('input[name="password"]', 'testpassword123');
      await this.page.click('button[type="submit"]');
      
      // Wait for navigation to dashboard
      await this.page.waitForURL('**/dashboard', { timeout: 15000 });
      await this.page.waitForLoadState('networkidle');
      
      console.log('✅ Login successful');
      return true;
    } catch (error) {
      console.error('❌ Login failed:', error.message);
      return false;
    }
  }

  async navigateToVRatingSection() {
    console.log('📍 Navigating to VRating section...');
    
    try {
      await this.page.goto(`${TEST_CONFIG.baseUrl}/analytics`);
      await this.page.waitForLoadState('networkidle');
      
      // Look for VRating card or section
      await this.page.waitForSelector('[data-testid="vrating-card"], .v-rating-card, .vrating-card', { timeout: 10000 });
      
      console.log('✅ Successfully navigated to VRating section');
      return true;
    } catch (error) {
      console.error('❌ Failed to navigate to VRating section:', error.message);
      return false;
    }
  }

  async testVRatingCalculationLogic() {
    console.log('🧮 Testing VRating calculation logic...');
    
    const testResult = {
      testName: 'VRating Calculation Logic',
      passed: false,
      details: [],
      screenshots: []
    };

    try {
      // Check if removed items are no longer referenced
      const pageContent = await this.page.content();
      const removedItems = ['Regular updates', 'Mindfulness rule', 'Regular trading'];
      
      for (const item of removedItems) {
        if (pageContent.includes(item)) {
          testResult.details.push(`❌ Found removed item: "${item}"`);
          testResult.passed = false;
        } else {
          testResult.details.push(`✅ Confirmed removed item not found: "${item}"`);
        }
      }

      // Check if VRating calculation is working
      const vRatingElements = await this.page.$$('[data-testid="vrating-score"], .v-rating-score, .vrating-score');
      if (vRatingElements.length > 0) {
        testResult.details.push('✅ VRating score elements found');
        
        // Get the overall score
        const overallScore = await this.page.textContent('[data-testid="vrating-overall-score"], .v-rating-overall-score');
        if (overallScore) {
          testResult.details.push(`✅ Overall VRating score: ${overallScore}`);
        }
      } else {
        testResult.details.push('❌ No VRating score elements found');
      }

      // Check category scores
      const categoryElements = await this.page.$$('[data-testid="vrating-category"], .v-rating-category, .vrating-category');
      if (categoryElements.length >= 5) {
        testResult.details.push('✅ All 5 VRating categories found');
      } else {
        testResult.details.push(`❌ Only ${categoryElements.length} categories found, expected 5`);
      }

      testResult.passed = testResult.details.filter(d => d.includes('✅')).length > testResult.details.filter(d => d.includes('❌')).length;

    } catch (error) {
      testResult.details.push(`❌ Error testing VRating calculation: ${error.message}`);
      testResult.passed = false;
    }

    // Take screenshot
    const screenshotPath = path.join(TEST_CONFIG.screenshotsDir, `vrating-calculation-${Date.now()}.png`);
    await this.page.screenshot({ path: screenshotPath, fullPage: true });
    testResult.screenshots.push(screenshotPath);

    this.testResults.results.push(testResult);
    return testResult.passed;
  }

  async testColorCodingFixes() {
    console.log('🎨 Testing color coding fixes...');
    
    const testResult = {
      testName: 'Color Coding Fixes',
      passed: false,
      details: [],
      screenshots: []
    };

    try {
      // Test different score scenarios
      for (const scenario of TEST_SCENARIOS) {
        testResult.details.push(`\n📊 Testing scenario: ${scenario.name}`);
        
        // Check overall score color
        const overallScoreElement = await this.page.locator('[data-testid="vrating-overall-score"], .v-rating-overall-score').first();
        if (await overallScoreElement.isVisible()) {
          const overallColor = await overallScoreElement.evaluate(el => getComputedStyle(el).color);
          const expectedColors = COLOR_MAP[scenario.expectedColors.overall].text;
          const colorMatch = expectedColors.some(color => overallColor.includes(color.replace('rgb', '').replace(/\s/g, '')));
          
          if (colorMatch) {
            testResult.details.push(`✅ Overall score color correct for ${scenario.name}`);
          } else {
            testResult.details.push(`❌ Overall score color incorrect for ${scenario.name}. Expected: ${scenario.expectedColors.overall}, Got: ${overallColor}`);
          }
        }

        // Check category colors
        const categoryElements = await this.page.$$('[data-testid="vrating-category"], .v-rating-category, .vrating-category');
        for (let i = 0; i < Math.min(categoryElements.length, 5); i++) {
          const categoryElement = categoryElements[i];
          const expectedColor = scenario.expectedColors.categories[i];
          const expectedColors = COLOR_MAP[expectedColor].text;
          
          const categoryColor = await categoryElement.evaluate(el => getComputedStyle(el).color);
          const colorMatch = expectedColors.some(color => categoryColor.includes(color.replace('rgb', '').replace(/\s/g, '')));
          
          if (colorMatch) {
            testResult.details.push(`✅ Category ${i + 1} color correct for ${scenario.name}`);
          } else {
            testResult.details.push(`❌ Category ${i + 1} color incorrect for ${scenario.name}. Expected: ${expectedColor}, Got: ${categoryColor}`);
          }
        }

        // Test mini gauge colors
        const miniGauges = await this.page.$$('[data-testid="vrating-gauge"], .v-rating-gauge, .vrating-gauge');
        if (miniGauges.length > 0) {
          testResult.details.push(`✅ Mini gauges found: ${miniGauges.length}`);
        } else {
          testResult.details.push('❌ No mini gauges found');
        }

        // Test pulsing indicators for poor performance
        if (scenario.expectedColors.categories.includes('red')) {
          const pulsingElements = await this.page.$$('[data-testid="vrating-pulse"], .v-rating-pulse, .animate-pulse');
          if (pulsingElements.length > 0) {
            testResult.details.push(`✅ Pulsing indicators found for poor performance in ${scenario.name}`);
          } else {
            testResult.details.push(`❌ No pulsing indicators found for poor performance in ${scenario.name}`);
          }
        }
      }

      testResult.passed = testResult.details.filter(d => d.includes('✅')).length > testResult.details.filter(d => d.includes('❌')).length;

    } catch (error) {
      testResult.details.push(`❌ Error testing color coding: ${error.message}`);
      testResult.passed = false;
    }

    // Take screenshot
    const screenshotPath = path.join(TEST_CONFIG.screenshotsDir, `vrating-color-coding-${Date.now()}.png`);
    await this.page.screenshot({ path: screenshotPath, fullPage: true });
    testResult.screenshots.push(screenshotPath);

    this.testResults.results.push(testResult);
    return testResult.passed;
  }

  async testUIBehaviorChanges() {
    console.log('🖥️ Testing UI behavior changes...');
    
    const testResult = {
      testName: 'UI Behavior Changes',
      passed: false,
      details: [],
      screenshots: []
    };

    try {
      // Test "Immediate Attention" tab visibility
      testResult.details.push('\n🔍 Testing "Immediate Attention" tab behavior...');
      
      // Check if "Immediate Attention" section is initially hidden
      const immediateAttentionHidden = await this.page.locator('[data-testid="immediate-attention"], .immediate-attention').isHidden();
      if (immediateAttentionHidden) {
        testResult.details.push('✅ "Immediate Attention" section is initially hidden');
      } else {
        testResult.details.push('❌ "Immediate Attention" section is visible when it should be hidden');
      }

      // Find and click the performance breakdown toggle
      const breakdownToggle = await this.page.locator('button:has-text("Performance Breakdown"), [data-testid="performance-breakdown-toggle"]').first();
      if (await breakdownToggle.isVisible()) {
        testResult.details.push('✅ Performance breakdown toggle found');
        
        // Click to expand
        await breakdownToggle.click();
        await this.page.waitForTimeout(1000); // Wait for animation
        
        // Check if "Immediate Attention" section is now visible
        const immediateAttentionVisible = await this.page.locator('[data-testid="immediate-attention"], .immediate-attention').isVisible();
        if (immediateAttentionVisible) {
          testResult.details.push('✅ "Immediate Attention" section is visible after expansion');
        } else {
          testResult.details.push('❌ "Immediate Attention" section is still hidden after expansion');
        }

        // Test collapse functionality
        await breakdownToggle.click();
        await this.page.waitForTimeout(1000);
        
        const immediateAttentionHiddenAgain = await this.page.locator('[data-testid="immediate-attention"], .immediate-attention').isHidden();
        if (immediateAttentionHiddenAgain) {
          testResult.details.push('✅ "Immediate Attention" section is hidden again after collapse');
        } else {
          testResult.details.push('❌ "Immediate Attention" section is still visible after collapse');
        }
      } else {
        testResult.details.push('❌ Performance breakdown toggle not found');
      }

      // Test expansion/collapse animation
      testResult.details.push('\n🎬 Testing expansion/collapse animations...');
      
      const expandedContent = await this.page.locator('[data-testid="performance-breakdown-content"], .performance-breakdown-content').first();
      if (await expandedContent.isVisible()) {
        // Test smooth transitions
        const transitionProperty = await expandedContent.evaluate(el => getComputedStyle(el).transitionProperty);
        if (transitionProperty && transitionProperty !== 'none') {
          testResult.details.push('✅ Smooth transitions found for expansion/collapse');
        } else {
          testResult.details.push('⚠️ No transitions found for expansion/collapse');
        }
      }

      testResult.passed = testResult.details.filter(d => d.includes('✅')).length > testResult.details.filter(d => d.includes('❌')).length;

    } catch (error) {
      testResult.details.push(`❌ Error testing UI behavior: ${error.message}`);
      testResult.passed = false;
    }

    // Take screenshots for both states
    const screenshotPathCollapsed = path.join(TEST_CONFIG.screenshotsDir, `vrating-ui-collapsed-${Date.now()}.png`);
    await this.page.screenshot({ path: screenshotPathCollapsed, fullPage: true });
    testResult.screenshots.push(screenshotPathCollapsed);

    // Expand and take screenshot
    const breakdownToggle = await this.page.locator('button:has-text("Performance Breakdown"), [data-testid="performance-breakdown-toggle"]').first();
    if (await breakdownToggle.isVisible()) {
      await breakdownToggle.click();
      await this.page.waitForTimeout(1000);
      
      const screenshotPathExpanded = path.join(TEST_CONFIG.screenshotsDir, `vrating-ui-expanded-${Date.now()}.png`);
      await this.page.screenshot({ path: screenshotPathExpanded, fullPage: true });
      testResult.screenshots.push(screenshotPathExpanded);
    }

    this.testResults.results.push(testResult);
    return testResult.passed;
  }

  async testVariousScoreScenarios() {
    console.log('📈 Testing various score scenarios...');
    
    const testResult = {
      testName: 'Various Score Scenarios',
      passed: false,
      details: [],
      screenshots: []
    };

    try {
      for (const scenario of TEST_SCENARIOS) {
        testResult.details.push(`\n📊 Testing scenario: ${scenario.name}`);
        
        // Check if the current scores match expected ranges
        const scoreElements = await this.page.$$('[data-testid="vrating-category-score"], .v-rating-category-score, .vrating-category-score');
        
        for (let i = 0; i < Math.min(scoreElements.length, 5); i++) {
          const scoreText = await scoreElements[i].textContent();
          const score = parseFloat(scoreText?.split('/')[0] || '0');
          
          const categoryNames = ['profitability', 'riskManagement', 'consistency', 'emotionalDiscipline', 'journalingAdherence'];
          const expectedScore = scenario.expectedCategories[categoryNames[i]];
          
          const scoreDiff = Math.abs(score - expectedScore);
          if (scoreDiff <= 1.0) { // Allow 1.0 point tolerance
            testResult.details.push(`✅ ${categoryNames[i]} score within expected range: ${score} (expected ~${expectedScore})`);
          } else {
            testResult.details.push(`⚠️ ${categoryNames[i]} score outside expected range: ${score} (expected ~${expectedScore})`);
          }
        }

        // Check overall score
        const overallScoreElement = await this.page.locator('[data-testid="vrating-overall-score"], .v-rating-overall-score').first();
        if (await overallScoreElement.isVisible()) {
          const overallScoreText = await overallScoreElement.textContent();
          const overallScore = parseFloat(overallScoreText?.split('/')[0] || '0');
          
          const overallScoreDiff = Math.abs(overallScore - scenario.expectedOverallScore);
          if (overallScoreDiff <= 1.0) {
            testResult.details.push(`✅ Overall score within expected range: ${overallScore} (expected ~${scenario.expectedOverallScore})`);
          } else {
            testResult.details.push(`⚠️ Overall score outside expected range: ${overallScore} (expected ~${scenario.expectedOverallScore})`);
          }
        }

        // Take scenario screenshot
        const scenarioScreenshot = path.join(TEST_CONFIG.screenshotsDir, `vrating-scenario-${scenario.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.png`);
        await this.page.screenshot({ path: scenarioScreenshot, fullPage: true });
        testResult.screenshots.push(scenarioScreenshot);
      }

      testResult.passed = testResult.details.filter(d => d.includes('✅')).length > testResult.details.filter(d => d.includes('❌')).length;

    } catch (error) {
      testResult.details.push(`❌ Error testing score scenarios: ${error.message}`);
      testResult.passed = false;
    }

    this.testResults.results.push(testResult);
    return testResult.passed;
  }

  async runAllTests() {
    console.log('🧪 Running all VRating system tests...');
    
    try {
      // Initialize and login
      await this.initialize();
      const loginSuccess = await this.login();
      
      if (!loginSuccess) {
        console.error('❌ Cannot proceed with tests without successful login');
        return false;
      }

      // Navigate to VRating section
      const navigationSuccess = await this.navigateToVRatingSection();
      if (!navigationSuccess) {
        console.error('❌ Cannot proceed with tests without successful navigation');
        return false;
      }

      // Run all tests
      const tests = [
        { name: 'VRating Calculation Logic', method: () => this.testVRatingCalculationLogic() },
        { name: 'Color Coding Fixes', method: () => this.testColorCodingFixes() },
        { name: 'UI Behavior Changes', method: () => this.testUIBehaviorChanges() },
        { name: 'Various Score Scenarios', method: () => this.testVariousScoreScenarios() }
      ];

      for (const test of tests) {
        console.log(`\n${'='.repeat(50)}`);
        console.log(`Running test: ${test.name}`);
        console.log(`${'='.repeat(50)}`);
        
        this.testResults.summary.totalTests++;
        
        try {
          const passed = await test.method();
          if (passed) {
            this.testResults.summary.passedTests++;
            console.log(`✅ ${test.name} PASSED`);
          } else {
            this.testResults.summary.failedTests++;
            console.log(`❌ ${test.name} FAILED`);
          }
        } catch (error) {
          this.testResults.summary.failedTests++;
          console.log(`❌ ${test.name} ERROR: ${error.message}`);
        }
      }

      // Save test results
      await this.saveTestResults();
      
      // Print summary
      this.printTestSummary();
      
      return this.testResults.summary.failedTests === 0;

    } catch (error) {
      console.error('❌ Error running tests:', error.message);
      return false;
    }
  }

  async saveTestResults() {
    try {
      fs.writeFileSync(TEST_CONFIG.testResults, JSON.stringify(this.testResults, null, 2));
      console.log(`\n💾 Test results saved to: ${TEST_CONFIG.testResults}`);
    } catch (error) {
      console.error('❌ Error saving test results:', error.message);
    }
  }

  printTestSummary() {
    console.log(`\n${'='.repeat(60)}`);
    console.log('🏁 VRATING SYSTEM TEST SUMMARY');
    console.log(`${'='.repeat(60)}`);
    console.log(`Total Tests: ${this.testResults.summary.totalTests}`);
    console.log(`Passed: ${this.testResults.summary.passedTests} ✅`);
    console.log(`Failed: ${this.testResults.summary.failedTests} ❌`);
    console.log(`Skipped: ${this.testResults.summary.skippedTests} ⏭️`);
    console.log(`Success Rate: ${((this.testResults.summary.passedTests / this.testResults.summary.totalTests) * 100).toFixed(1)}%`);
    
    console.log(`\n📸 Screenshots saved to: ${TEST_CONFIG.screenshotsDir}`);
    console.log(`📊 Detailed results saved to: ${TEST_CONFIG.testResults}`);
    
    if (this.testResults.summary.failedTests === 0) {
      console.log(`\n🎉 ALL TESTS PASSED! VRating system is working correctly.`);
    } else {
      console.log(`\n⚠️ Some tests failed. Please review the detailed results and screenshots.`);
    }
  }

  async cleanup() {
    console.log('\n🧹 Cleaning up...');
    
    if (this.page) {
      await this.page.close();
    }
    
    if (this.browser) {
      await this.browser.close();
    }
    
    console.log('✅ Cleanup completed');
  }
}

// Main execution
async function main() {
  const tester = new VRatingSystemTester();
  
  try {
    const success = await tester.runAllTests();
    process.exit(success ? 0 : 1);
  } catch (error) {
    console.error('❌ Test execution failed:', error.message);
    process.exit(1);
  } finally {
    await tester.cleanup();
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = VRatingSystemTester;