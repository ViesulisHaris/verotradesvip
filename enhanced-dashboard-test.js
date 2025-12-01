
const { chromium } = require('playwright');
const fs = require('fs');

/**
 * Enhanced Comprehensive Dashboard Testing Script
 * 
 * This script performs thorough testing of the VeroTrades dashboard with proper authentication
 * and detailed analysis against mockup specifications
 */

async function runEnhancedDashboardTest() {
  console.log('🚀 Starting Enhanced Comprehensive Dashboard Testing...');
  console.log('📋 Testing against mockup specifications from DASHBOARD_MOCKUP_COMPARISON_REPORT.md');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Test results storage
  const testResults = {
    timestamp: new Date().toISOString(),
    visualVerification: {},
    colorScheme: {},
    functionality: {},
    responsive: {},
    performance: {},
    accessibility: {},
    dataIntegration: {},
    consoleErrors: [],
    summary: {
      totalTests: 0,
      passedTests: 0,
      failedTests: 0
    }
  };

  try {
    // Step 1: Authentication
    console.log('\n🔐 Step 1: Authentication');
    await page.goto('http://localhost:3000/login');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'testpassword123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    console.log('✅ Authentication successful');

    // Step 2: Visual Verification Against Mockup
    console.log('\n🎨 Step 2: Visual Verification Against Mockup');
    await testVisualVerification(page, testResults);

    // Step 3: Color Scheme Verification
    console.log('\n🎨 Step 3: Color Scheme Verification');
    await testColorScheme(page, testResults);

    // Step 4: Layout and Structure
    console.log('\n📐 Step 4: Layout and Structure');
    await testLayoutStructure(page, testResults);

    // Step 5: Interactive Elements
    console.log('\n🖱️ Step 5: Interactive Elements');
    await testInteractiveElements(page, testResults);

    // Step 6: Responsive Design
    console.log('\n📱 Step 6: Responsive Design');
    await testResponsiveDesign(page, testResults);

    // Step 7: Performance and Animations
    console.log('\n⚡ Step 7: Performance and Animations');
    await testPerformanceAnimations(page, testResults);

    // Step 8: Accessibility
    console.log('\n♿ Step 8: Accessibility');
    await testAccessibility(page, testResults);

    // Step 9: Data Integration
    console.log('\n📊 Step 9: Data Integration');
    await testDataIntegration(page, testResults);

    // Step 10: Console Error Analysis
    console.log('\n🐛 Step 10: Console Error Analysis');
    await analyzeConsoleErrors(page, testResults);

    // Generate comprehensive report
    await generateTestReport(testResults);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    testResults.error = error.message;
  } finally {
    await browser.close();
  }
}

async function testVisualVerification(page, results) {
  const tests = [
    {
      name: 'Background Color',
      expected: '#121212',
      actual: await page.evaluate(() => window.getComputedStyle(document.body).backgroundColor),
      selector: 'body'
    },
    {
      name: 'Card Background Colors',
      expected: '#202020',
      actual: await page.locator('[class*="card"], [class*="Card"]').first().evaluate(el => 
        window.getComputedStyle(el).backgroundColor),
      selector: '[class*="card"], [class*="Card"]'
    },
    {
      name: 'Border Radius',
      expected: '12px',
      actual: await page.locator('[class*="card"], [class*="Card"]').first().evaluate(el => 
        window.getComputedStyle(el).borderRadius),
      selector: '[class*="card"], [class*="Card"]'
    },
    {
      name: 'Typography Font Size',
      expected: '32px',
      actual: await page.locator('h1, h2, h3').first().evaluate(el => 
        window.getComputedStyle(el).fontSize),
      selector: 'h1, h2, h3'
    },
    {
      name: 'Typography Font Family',
      expected: 'Inter',
      actual: await page.locator('h1, h2, h3').first().evaluate(el => 
        window.getComputedStyle(el).fontFamily),
      selector: 'h1, h2, h3'
    }
  ];

  results.visualVerification.tests = tests;
  results.visualVerification.passed = tests.filter(t => t.actual.includes(t.expected) || t.expected.includes(t.actual)).length;
  results.visualVerification.failed = tests.length - results.visualVerification.passed;

  tests.forEach(test => {
    const passed = test.actual.includes(test.expected) || test.expected.includes(test.actual);
    console.log(`   ${test.name}: Expected ${test.expected}, Got ${test.actual} - ${passed ? '✅' : '❌'}`);
  });

  results.summary.totalTests += tests.length;
  results.summary.passedTests += results.visualVerification.passed;
  results.summary.failedTests += results.visualVerification.failed;
}

async function testColorScheme(page, results) {
  const colorTests = [
    {
      name: 'Primary Background',
      expected: '#121212',
      actual: await page.evaluate(() => window.getComputedStyle(document.body).backgroundColor)
    },
    {
      name: 'Card Background',
      expected: '#202020',
      actual: await page.locator('[class*="card"], [class*="Card"]').first().evaluate(el => 
        window.getComputedStyle(el).backgroundColor)
    },
    {
      name: 'Text Color',
      expected: '#ffffff',
      actual: await page.locator('h1, h2, h3').first().evaluate(el => 
        window.getComputedStyle(el).color)
    }
  ];

  results.colorScheme.tests = colorTests;
  results.colorScheme.passed = colorTests.filter(t => 
    t.actual.includes(t.expected.replace('#', 'rgb(')) || 
    t.actual.includes(t.expected.replace('#', 'rgba('))
  ).length;
  results.colorScheme.failed = colorTests.length - results.colorScheme.passed;

  colorTests.forEach(test => {
    const passed = test.actual.includes(test.expected.replace('#', 'rgb(')) ||
                  test.actual.includes(test.expected.replace('#', 'rgba('));
    console.log(`   ${test.name}: Expected ${test.expected}, Got ${test.actual} - ${passed ? '✅' : '❌'}`);
  });

  results.summary.totalTests += colorTests.length;
  results.summary.passedTests += results.colorScheme.passed;
  results.summary.failedTests += results.colorScheme.failed;
}

async function testLayoutStructure(page, results) {
  const layoutTests = [
    {
      name: 'Container Elements',
      expected: '>= 3',
      actual: await page.locator('[class*="container"], [class*="Container"]').count(),
      selector: '[class*="container"], [class*="Container"]'
    },
    {
      name: 'Card Elements',
      expected: '>= 8',
      actual: await page.locator('[class*="card"], [class*="Card"]').count(),
      selector: '[class*="card"], [class*="Card"]'
    },
    {
      name: 'Heading Elements',
      expected: '>= 5',
      actual: await page.locator('h1, h2, h3, h4, h5, h6').count(),
      selector: 'h1, h2, h3, h4, h5, h6'
    }
  ];

  results.layoutStructure = { tests: layoutTests, passed: 0, failed: 0 };
  
  layoutTests.forEach(test => {
    const expectedMin = parseInt(test.expected.replace('>= ', ''));
    const passed = test.actual >= expectedMin;
    if (passed) results.layoutStructure.passed++;
    else results.layoutStructure.failed++;
    
    console.log(`   ${test.name}: Expected ${test.expected}, Got ${test.actual} - ${passed ? '✅' : '❌'}`);
  });

  results.summary.totalTests += layoutTests.length;
  results.summary.passedTests += results.layoutStructure.passed;
  results.summary.failedTests += results.layoutStructure.failed;
}

async function testInteractiveElements(page, results) {
  const interactiveTests = [
    {
      name: 'Button Elements',
      expected: '>= 3',
      actual: await page.locator('button').count(),
      selector: 'button'
    },
    {
      name: 'Clickable Cards',
      expected: '>= 5',
      actual: await page.locator('[class*="card"], [class*="Card"]').filter({ has: page.locator('button, a, [role="button"]') }).count(),
      selector: '[class*="card"]:has(button, a, [role="button"])'
    }
  ];

  results.functionality.interactiveElements = { tests: interactiveTests, passed: 0, failed: 0 };
  
  interactiveTests.forEach(test => {
    const expectedMin = parseInt(test.expected.replace('>= ', ''));
    const passed = test.actual >= expectedMin;
    if (passed) results.functionality.interactiveElements.passed++;
    else results.functionality.interactiveElements.failed++;
    
    console.log(`   ${test.name}: Expected ${test.expected}, Got ${test.actual} - ${passed ? '✅' : '❌'}`);
  });

  results.summary.totalTests += interactiveTests.length;
  results.summary.passedTests += results.functionality.interactiveElements.passed;
  results.summary.failedTests += results.functionality.interactiveElements.failed;
}

async function testResponsiveDesign(page, results) {
  const viewports = [
    { name: 'Mobile', width: 375, height: 667 },
    { name: 'Tablet', width: 768, height: 1024 },
    { name: 'Desktop', width: 1920, height: 1080 }
  ];

  results.responsive.tests = [];
  results.responsive.passed = 0;
  results.responsive.failed = 0;

  for (const viewport of viewports) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.waitForTimeout(1000);
    
    const hasHorizontalScroll = await page.evaluate(() =>
      document.body.scrollWidth > document.body.clientWidth);
    
    const test = {
      name: `${viewport.name} (${viewport.width}x${viewport.height})`,
      expected: 'No horizontal scroll',
      actual: hasHorizontalScroll ? 'Has horizontal scroll' : 'No horizontal scroll',
      passed: !hasHorizontalScroll
    };
    
    results.responsive.tests.push(test);
    if (test.passed) results.responsive.passed++;
    else results.responsive.failed++;
    
    console.log(`   ${test.name}: Expected ${test.expected}, Got ${test.actual} - ${test.passed ? '✅' : '❌'}`);
  }

  results.summary.totalTests += viewports.length;
  results.summary.passedTests += results.responsive.passed;
  results.summary.failedTests += results.responsive.failed;
}

async function testPerformanceAnimations(page, results) {
  const performanceTests = [
    {
      name: 'Page Load Time',
      measurement: await page.evaluate(() => performance.timing.loadEventEnd - performance.timing.navigationStart),
      threshold: 3000 // 3 seconds
    },
    {
      name: 'DOM Content Loaded',
      measurement: await page.evaluate(() => performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart),
      threshold: 2000 // 2 seconds
    }
  ];

  results.performance.tests = [];
  results.performance.passed = 0;
  results.performance.failed = 0;

  performanceTests.forEach(test => {
    const passed = test.measurement <= test.threshold;
    const testResult = {
      name: test.name,
      actual: `${test.measurement}ms`,
      expected: `<= ${test.threshold}ms`,
      passed: passed
    };
    
    results.performance.tests.push(testResult);
    if (passed) results.performance.passed++;
    else results.performance.failed++;
    
    console.log(`   ${test.name}: ${testResult.actual} - ${passed ? '✅' : '❌'}`);
  });

  results.summary.totalTests += performanceTests.length;
  results.summary.passedTests += results.performance.passed;
  results.summary.failedTests += results.performance.failed;
}

async function testAccessibility(page, results) {
  const accessibilityTests = [
    {
      name: 'Alt Text for Images',
      expected: 'All images have alt text',
      actual: await page.locator('img:not([alt])').count(),
      passed: false // Will be updated based on actual count
    },
    {
      name: 'Button Accessibility',
      expected: 'Buttons have accessible names',
      actual: await page.locator('button:not([aria-label]):not([aria-labelledby])').count(),
      passed: false // Will be updated based on actual count
    }
  ];

  results.accessibility.tests = [];
  results.accessibility.passed = 0;
  results.accessibility.failed = 0;

  accessibilityTests.forEach(test => {
    test.passed = test.actual === 0; // No issues found
    const testResult = {
      name: test.name,
      expected: test.expected,
      actual: test.actual === 0 ? 'No issues found' : `${test.actual} issues found`,
      passed: test.passed
    };
    
    results.accessibility.tests.push(testResult);
    if (test.passed) results.accessibility.passed++;
    else results.accessibility.failed++;
    
    console.log(`   ${test.name}: ${testResult.actual} - ${test.passed ? '✅' : '❌'}`);
  });

  results.summary.totalTests += accessibilityTests.length;
  results.summary.passedTests += results.accessibility.passed;
  results.summary.failedTests += results.accessibility.failed;
}

async function testDataIntegration(page, results) {
  const dataTests = [
    {
      name: 'Data Loading Indicators',
      expected: 'No loading indicators after 3 seconds',
      actual: await page.locator('[class*="loading"], [class*="spinner"]').count(),
      passed: false
    },
    {
      name: 'Error Messages',
      expected: 'No error messages visible',
      actual: await page.locator('.error, .alert, [role="alert"]').count(),
      passed: false
    }
  ];

  results.dataIntegration.tests = [];
  results.dataIntegration.passed = 0;
  results.dataIntegration.failed = 0;

  dataTests.forEach(test => {
    test.passed = test.actual === 0;
    const testResult = {
      name: test.name,
      expected: test.expected,
      actual: test.actual === 0 ? 'No issues found' : `${test.actual} issues found`,
      passed: test.passed
    };
    
    results.dataIntegration.tests.push(testResult);
    if (test.passed) results.dataIntegration.passed++;
    else results.dataIntegration.failed++;
    
    console.log(`   ${test.name}: ${testResult.actual} - ${test.passed ? '✅' : '❌'}`);
  });

  results.summary.totalTests += dataTests.length;
  results.summary.passedTests += results.dataIntegration.passed;
  results.summary.failedTests += results.dataIntegration.failed;
}

async function analyzeConsoleErrors(page, results) {
  const logs = [];
  page.on('console', msg => {
    if (msg.type() === 'error' || msg.type() === 'warning') {
      logs.push({ type: msg.type(), text: msg.text() });
    }
  });
  
  await page.reload();
  await page.waitForTimeout(3000);
  
  results.consoleErrors = logs;
  console.log(`   Found ${logs.length} console errors/warnings`);
  logs.forEach(log => console.log(`     ${log.type.toUpperCase()}: ${log.text.substring(0, 100)}...`));
}

async function generateTestReport(results) {
  const reportContent = `# Comprehensive Dashboard Test Report

**Generated:** ${results.timestamp}

## Executive Summary

- **Total Tests:** ${results.summary.totalTests}
- **Passed:** ${results.summary.passedTests} (${((results.summary.passedTests / results.summary.totalTests) * 100).toFixed(1)}%)
- **Failed:** ${results.summary.failedTests} (${((results.summary.failedTests / results.summary.totalTests) * 100).toFixed(1)}%)

## Test Results

### 1. Visual Verification Against Mockup
**Passed:** ${results.visualVerification.passed}/${results.visualVerification.passed + results.visualVerification.failed}

${results.visualVerification.tests ? results.visualVerification.tests.map(test =>
  `- **${test.name}**: Expected ${test.expected}, Got ${test.actual}`
).join('\n') : 'N/A'}

### 2. Color Scheme Verification
**Passed:** ${results.colorScheme.passed}/${results.colorScheme.passed + results.colorScheme.failed}

${results.colorScheme.tests ? results.colorScheme.tests.map(test =>
  `- **${test.name}**: Expected ${test.expected}, Got ${test.actual}`
).join('\n') : 'N/A'}

### 3. Layout and Structure
**Passed:** ${results.layoutStructure.passed}/${results.layoutStructure.passed + results.layoutStructure.failed}

${results.layoutStructure.tests ? results.layoutStructure.tests.map(test =>
  `- **${test.name}**: Expected ${test.expected}, Got ${test.actual}`
).join('\n') : 'N/A'}

### 4. Interactive Elements
**Passed:** ${results.functionality.interactiveElements.passed}/${results.functionality.interactiveElements.passed + results.functionality.interactiveElements.failed}

${results.functionality.interactiveElements.tests ? results.functionality.interactiveElements.tests.map(test =>
  `- **${test.name}**: Expected ${test.expected}, Got ${test.actual}`
).join('\n') : 'N/A'}

### 5. Responsive Design
**Passed:** ${results.responsive.passed}/${results.responsive.passed + results.responsive.failed}

${results.responsive.tests ? results.responsive.tests.map(test =>
  `- **${test.name}**: Expected ${test.expected}, Got ${test.actual}`
).join('\n') : 'N/A'}

### 6. Performance and Animations
**Passed:** ${results.performance.passed}/${results.performance.passed + results.performance.failed}

${results.performance.tests ? results.performance.tests.map(test =>
  `- **${test.name}**: ${test.actual} (Expected: ${test.expected})`
).join('\n') : 'N/A'}

### 7. Accessibility
**Passed:** ${results.accessibility.passed}/${results.accessibility.passed + results.accessibility.failed}

${results.accessibility.tests ? results.accessibility.tests.map(test =>
  `- **${test.name}**: ${test.actual} (Expected: ${test.expected})`
).join('\n') : 'N/A'}

### 8. Data Integration
**Passed:** ${results.dataIntegration.passed}/${results.dataIntegration.passed + results.dataIntegration.failed}

${results.dataIntegration.tests ? results.dataIntegration.tests.map(test =>
  `- **${test.name}**: ${test.actual} (Expected: ${test.expected})`
).join('\n') : 'N/A'}

### 9. Console Errors and Warnings
**Total Issues:** ${results.consoleErrors.length}

${results.consoleErrors.map(log =>
  `- **${log.type.toUpperCase()}**: ${log.text}`
).join('\n')}

## Key Findings

### Critical Issues
${results.summary.failedTests > 0 ?
  `- ${results.summary.failedTests} tests failed, requiring attention` :
  '- All critical tests passed'
}

### Color Scheme Discrepancies
${results.colorScheme.failed > 0 ?
  `- Color scheme does not match mockup specifications` :
  '- Color scheme matches specifications'
}

### Performance Issues
${results.performance.failed > 0 ?
  `- Performance metrics exceed acceptable thresholds` :
  '- Performance is within acceptable ranges'
}

### Accessibility Concerns
${results.accessibility.failed > 0 ?
  `- Accessibility improvements needed` :
  '- Accessibility standards met'
}

## Recommendations

### Immediate Actions Required
1. **Fix Color Scheme**: Update background and card colors to match mockup specifications
2. **Resolve Console Warnings**: Address chart sizing issues and missing image properties
3. **Improve Accessibility**: Add proper alt text and ARIA labels where missing

### Performance Optimizations
1. **Chart Sizing**: Implement proper container sizing for charts
2. **Image Optimization**: Add sizes prop to Next.js Image components

### Long-term Improvements
1. **Responsive Testing**: Expand responsive testing to more devices
2. **Cross-browser Testing**: Implement cross-browser compatibility tests
3. **Automated Testing**: Integrate these tests into CI/CD pipeline

## Conclusion

The dashboard demonstrates solid functionality with ${results.summary.passedTests > results.summary.failedTests ? 'good overall performance' : 'areas requiring improvement'}.
The main focus should be on ${results.colorScheme.failed > 0 ? 'color scheme alignment' : 'performance optimization'} and addressing the identified console warnings.

---

*This report was generated automatically by the comprehensive dashboard testing suite.*
`;

  const reportPath = `verotradesvip/COMPREHENSIVE_DASHBOARD_TEST_REPORT_${Date.now()}.md`;
  fs.writeFileSync(reportPath, reportContent);
  
  console.log(`\n📄 Comprehensive test report generated: ${reportPath}`);
  console.log(`\n📊 Final Summary:`);
  console.log(`   Total Tests: ${results.summary.totalTests}`);
  console.log(`   Passed: ${results.summary.passedTests} (${((results.summary.passedTests / results.summary.totalTests) * 100).toFixed(1)}%)`);
  console.log(`   Failed: ${results.summary.failedTests} (${((results.summary.failedTests / results.summary.totalTests) * 100).toFixed(1)}%)`);
}

// Run the enhanced test
runEnhancedDashboardTest().catch(console.error);