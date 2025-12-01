const puppeteer = require('puppeteer');
const path = require('path');

async function testImmediateAttentionUI() {
  console.log('🔍 Starting Immediate Attention UI Behavior Tests...\n');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: null,
    args: ['--start-maximized']
  });
  
  const page = await browser.newPage();
  
  // Enable console logging from the page
  page.on('console', msg => {
    console.log('PAGE LOG:', msg.text());
  });
  
  // Enable error logging
  page.on('pageerror', error => {
    console.error('PAGE ERROR:', error.message);
  });
  
  try {
    // Navigate to test page
    console.log('📍 Navigating to test page...');
    await page.goto('http://localhost:3001/test-vrating-system');
    await page.waitForNavigation({ waitUntil: 'networkidle2' });
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const testResults = [];
    const scenarios = ['Elite Performance', 'Good Performance', 'Mixed Performance', 'Poor Performance', 'Beginner Performance'];
    
    for (let i = 0; i < scenarios.length; i++) {
      const scenarioName = scenarios[i];
      console.log(`\n🧪 Testing scenario: ${scenarioName}`);
      
      // Select scenario
      await page.select('select', i.toString());
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Test 1: Default state - Immediate Attention should be hidden
      console.log('  🔍 Testing default state (collapsed)...');
      const immediateAttentionHidden = await page.evaluate(() => {
        const expandedContent = document.querySelector('[class*="mt-4 space-y-3"]');
        const immediateAttentionSection = Array.from(document.querySelectorAll('div')).find(el => 
          el.textContent && el.textContent.includes('Needs Immediate Attention')
        );
        return {
          isExpanded: expandedContent && expandedContent.style.display !== 'none',
          immediateAttentionVisible: immediateAttentionSection && 
            immediateAttentionSection.offsetParent !== null
        };
      });
      
      testResults.push({
        scenario: scenarioName,
        test: 'Default State - Collapsed',
        expected: 'Immediate Attention hidden',
        actual: immediateAttentionHidden.immediateAttentionVisible ? 'Visible' : 'Hidden',
        passed: !immediateAttentionHidden.immediateAttentionVisible && !immediateAttentionHidden.isExpanded,
        details: immediateAttentionHidden
      });
      
      // Test 2: Click Performance Breakdown to expand
      console.log('  🔍 Testing expand functionality...');
      await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const targetButton = buttons.find(btn => btn.textContent.includes('Performance Breakdown'));
        if (targetButton) targetButton.click();
      });
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Test 3: Expanded state - Immediate Attention should be visible if there are poor/medium categories
      console.log('  🔍 Testing expanded state...');
      const afterExpansion = await page.evaluate(() => {
        const expandedContent = document.querySelector('[class*="mt-4 space-y-3"]');
        const immediateAttentionSection = Array.from(document.querySelectorAll('div')).find(el => 
          el.textContent && (el.textContent.includes('Needs Immediate Attention') || 
                           el.textContent.includes('Areas for Improvement') ||
                           el.textContent.includes('All Categories Meeting Standards'))
        );
        
        // Check for poor and medium categories
        const categoryScores = Array.from(document.querySelectorAll('[class*="text-sm font-bold"]'))
          .map(el => parseFloat(el.textContent))
          .filter(score => !isNaN(score));
        
        const hasPoorCategories = categoryScores.some(score => score < 5.0);
        const hasMediumCategories = categoryScores.some(score => score >= 5.0 && score < 7.0);
        
        return {
          isExpanded: expandedContent && expandedContent.offsetParent !== null,
          immediateAttentionVisible: immediateAttentionSection && 
            immediateAttentionSection.offsetParent !== null,
          hasPoorCategories,
          hasMediumCategories,
          categoryScores,
          immediateAttentionText: immediateAttentionSection ? immediateAttentionSection.textContent : null
        };
      });
      
      // Determine if Immediate Attention should be visible
      const shouldShowImmediateAttention = afterExpansion.hasPoorCategories || afterExpansion.hasMediumCategories;
      
      testResults.push({
        scenario: scenarioName,
        test: 'Expanded State - Immediate Attention Visibility',
        expected: shouldShowImmediateAttention ? 'Visible' : 'Hidden',
        actual: afterExpansion.immediateAttentionVisible ? 'Visible' : 'Hidden',
        passed: afterExpansion.immediateAttentionVisible === shouldShowImmediateAttention,
        details: afterExpansion
      });
      
      // Test 4: Check for proper pulsing indicators on poor categories
      if (afterExpansion.hasPoorCategories) {
        console.log('  🔍 Testing pulsing indicators for poor categories...');
        const pulsingIndicators = await page.evaluate(() => {
          const pulsingElements = Array.from(document.querySelectorAll('.animate-pulse'));
          return {
            count: pulsingElements.length,
            elements: pulsingElements.map(el => ({
              tagName: el.tagName,
              className: el.className,
              textContent: el.parentElement ? el.parentElement.textContent : ''
            }))
          };
        });
        
        testResults.push({
          scenario: scenarioName,
          test: 'Pulsing Indicators for Poor Categories',
          expected: 'Pulsing indicators present',
          actual: `${pulsingIndicators.count} pulsing elements found`,
          passed: pulsingIndicators.count > 0,
          details: pulsingIndicators
        });
      }
      
      // Test 5: Test collapse functionality
      console.log('  🔍 Testing collapse functionality...');
      await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const targetButton = buttons.find(btn => btn.textContent.includes('Performance Breakdown'));
        if (targetButton) targetButton.click();
      });
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const afterCollapse = await page.evaluate(() => {
        const expandedContent = document.querySelector('[class*="mt-4 space-y-3"]');
        const immediateAttentionSection = Array.from(document.querySelectorAll('div')).find(el => 
          el.textContent && el.textContent.includes('Needs Immediate Attention')
        );
        return {
          isExpanded: expandedContent && expandedContent.offsetParent !== null,
          immediateAttentionVisible: immediateAttentionSection && 
            immediateAttentionSection.offsetParent !== null
        };
      });
      
      testResults.push({
        scenario: scenarioName,
        test: 'Collapse Functionality',
        expected: 'Immediate Attention hidden after collapse',
        actual: afterCollapse.immediateAttentionVisible ? 'Visible' : 'Hidden',
        passed: !afterCollapse.immediateAttentionVisible && !afterCollapse.isExpanded,
        details: afterCollapse
      });
      
      // Test 6: Test multiple expand/collapse cycles
      console.log('  🔍 Testing multiple expand/collapse cycles...');
      for (let cycle = 1; cycle <= 3; cycle++) {
        await page.evaluate(() => {
          const buttons = Array.from(document.querySelectorAll('button'));
          const targetButton = buttons.find(btn => btn.textContent.includes('Performance Breakdown'));
          if (targetButton) targetButton.click();
        });
        await new Promise(resolve => setTimeout(resolve, 300));
        
        const cycleState = await page.evaluate(() => {
          const expandedContent = document.querySelector('[class*="mt-4 space-y-3"]');
          return {
            cycle: cycle,
            isExpanded: expandedContent && expandedContent.offsetParent !== null
          };
        });
        
        testResults.push({
          scenario: scenarioName,
          test: `Expand/Collapse Cycle ${cycle}`,
          expected: cycle % 2 === 1 ? 'Expanded' : 'Collapsed',
          actual: cycleState.isExpanded ? 'Expanded' : 'Collapsed',
          passed: (cycle % 2 === 1) === cycleState.isExpanded,
          details: cycleState
        });
      }
    }
    
    // Generate comprehensive report
    console.log('\n📊 GENERATING COMPREHENSIVE TEST REPORT...\n');
    
    let passedTests = 0;
    let totalTests = 0;
    
    testResults.forEach(result => {
      totalTests++;
      if (result.passed) passedTests++;
      
      console.log(`${result.passed ? '✅' : '❌'} [${result.scenario}] ${result.test}`);
      console.log(`   Expected: ${result.expected}`);
      console.log(`   Actual: ${result.actual}`);
      if (!result.passed) {
        console.log(`   Details: ${JSON.stringify(result.details, null, 2)}`);
      }
      console.log('');
    });
    
    const successRate = ((passedTests / totalTests) * 100).toFixed(1);
    
    console.log('='.repeat(80));
    console.log('📋 IMMEDIATE ATTENTION UI BEHAVIOR TEST SUMMARY');
    console.log('='.repeat(80));
    console.log(`Total Tests: ${totalTests}`);
    console.log(`Passed: ${passedTests}`);
    console.log(`Failed: ${totalTests - passedTests}`);
    console.log(`Success Rate: ${successRate}%`);
    console.log('');
    
    // Check for specific issues
    const failedTests = testResults.filter(r => !r.passed);
    if (failedTests.length > 0) {
      console.log('❌ ISSUES FOUND:');
      failedTests.forEach(test => {
        console.log(`  • [${test.scenario}] ${test.test}: Expected "${test.expected}" but got "${test.actual}"`);
      });
      console.log('');
    }
    
    // Test for console errors
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    if (consoleErrors.length > 0) {
      console.log('🚨 CONSOLE ERRORS DETECTED:');
      consoleErrors.forEach(error => {
        console.log(`  • ${error}`);
      });
      console.log('');
    } else {
      console.log('✅ No console errors detected during testing');
    }
    
    // Take final screenshot
    await page.screenshot({ 
      path: 'immediate-attention-ui-test-final-state.png',
      fullPage: true 
    });
    console.log('📸 Final screenshot saved: immediate-attention-ui-test-final-state.png');
    
    await browser.close();
    
    return {
      success: passedTests === totalTests,
      passedTests,
      totalTests,
      successRate: parseFloat(successRate),
      testResults,
      consoleErrors
    };
    
  } catch (error) {
    console.error('❌ Test execution failed:', error);
    await browser.close();
    throw error;
  }
}

// Run the test
testImmediateAttentionUI()
  .then(results => {
    console.log('\n🎉 Test execution completed!');
    process.exit(results.success ? 0 : 1);
  })
  .catch(error => {
    console.error('💥 Test failed with error:', error);
    process.exit(1);
  });