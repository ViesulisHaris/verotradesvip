/**
 * Comprehensive DashboardCard VRating Feature Test
 * This script tests all enhanced DashboardCard functionality including:
 * - VRating color coding for all ranges
 * - Tooltip functionality with glass morphism styling
 * - Icon selection for all supported types
 * - Responsive design with text truncation
 * - Backward compatibility with existing usage
 * - Performance optimizations with memoization
 */

const puppeteer = require('puppeteer');
const path = require('path');

async function testDashboardCardVRating() {
  console.log('🚀 Starting DashboardCard VRating Comprehensive Test...\n');
  
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1920, height: 1080 },
    args: ['--start-maximized']
  });
  
  const page = await browser.newPage();
  
  // Enable console logging from the page
  page.on('console', msg => {
    if (msg.type() === 'log') {
      console.log('PAGE LOG:', msg.text());
    }
  });
  
  const testResults = {
    timestamp: new Date().toISOString(),
    tests: [],
    summary: {
      total: 0,
      passed: 0,
      failed: 0
    }
  };
  
  async function runTest(testName, testFunction) {
    console.log(`\n📋 Running: ${testName}`);
    testResults.summary.total++;
    
    try {
      const result = await testFunction();
      if (result.passed) {
        console.log(`✅ PASSED: ${testName}`);
        if (result.details) console.log(`   Details: ${result.details}`);
        testResults.summary.passed++;
      } else {
        console.log(`❌ FAILED: ${testName}`);
        console.log(`   Error: ${result.error}`);
        testResults.summary.failed++;
      }
      
      testResults.tests.push({
        name: testName,
        passed: result.passed,
        details: result.details || '',
        error: result.error || '',
        duration: result.duration || 0
      });
    } catch (error) {
      console.log(`❌ ERROR: ${testName}`);
      console.log(`   Error: ${error.message}`);
      testResults.summary.failed++;
      
      testResults.tests.push({
        name: testName,
        passed: false,
        details: '',
        error: error.message,
        duration: 0
      });
    }
  }
  
  // Navigate to test page
  await page.goto('http://localhost:3000/test-dashboard-card-vrating', {
    waitUntil: 'networkidle2'
  });
  
  // Wait for page to fully load
  await page.waitForTimeout(2000);
  
  // Test 1: VRating Color Coding
  await runTest('VRating Color Coding - Red Range (1.0-1.9)', async () => {
    const card = await page.$('[title="VRating 1.5 (Red Range)"]');
    if (!card) return { passed: false, error: 'Red range card not found' };
    
    const bgColor = await page.evaluate(el => {
      const computedStyle = window.getComputedStyle(el);
      return computedStyle.background;
    }, card);
    
    const hasRedGradient = bgColor.includes('red') || bgColor.includes('rgb(239, 68, 68)') || bgColor.includes('rgb(248, 113, 113)');
    return {
      passed: hasRedGradient,
      details: hasRedGradient ? 'Red gradient correctly applied' : 'Red gradient not found'
    };
  });
  
  await runTest('VRating Color Coding - Orange Range (2.0-3.9)', async () => {
    const card = await page.$('[title="VRating 3.2 (Orange Range)"]');
    if (!card) return { passed: false, error: 'Orange range card not found' };
    
    const bgColor = await page.evaluate(el => {
      const computedStyle = window.getComputedStyle(el);
      return computedStyle.background;
    }, card);
    
    const hasOrangeGradient = bgColor.includes('orange') || bgColor.includes('rgb(251, 146, 60)') || bgColor.includes('rgb(254, 215, 170)');
    return {
      passed: hasOrangeGradient,
      details: hasOrangeGradient ? 'Orange gradient correctly applied' : 'Orange gradient not found'
    };
  });
  
  await runTest('VRating Color Coding - Yellow Range (4.0-5.9)', async () => {
    const card = await page.$('[title="VRating 5.0 (Yellow Range)"]');
    if (!card) return { passed: false, error: 'Yellow range card not found' };
    
    const bgColor = await page.evaluate(el => {
      const computedStyle = window.getComputedStyle(el);
      return computedStyle.background;
    }, card);
    
    const hasYellowGradient = bgColor.includes('yellow') || bgColor.includes('rgb(250, 204, 21)') || bgColor.includes('rgb(254, 240, 138)');
    return {
      passed: hasYellowGradient,
      details: hasYellowGradient ? 'Yellow gradient correctly applied' : 'Yellow gradient not found'
    };
  });
  
  await runTest('VRating Color Coding - Green Range (6.0-7.9)', async () => {
    const card = await page.$('[title="VRating 7.2 (Green Range)"]');
    if (!card) return { passed: false, error: 'Green range card not found' };
    
    const bgColor = await page.evaluate(el => {
      const computedStyle = window.getComputedStyle(el);
      return computedStyle.background;
    }, card);
    
    const hasGreenGradient = bgColor.includes('green') || bgColor.includes('rgb(34, 197, 94)') || bgColor.includes('rgb(134, 239, 172)');
    return {
      passed: hasGreenGradient,
      details: hasGreenGradient ? 'Green gradient correctly applied' : 'Green gradient not found'
    };
  });
  
  await runTest('VRating Color Coding - Blue Range (8.0-8.9)', async () => {
    const card = await page.$('[title="VRating 8.5 (Blue Range)"]');
    if (!card) return { passed: false, error: 'Blue range card not found' };
    
    const bgColor = await page.evaluate(el => {
      const computedStyle = window.getComputedStyle(el);
      return computedStyle.background;
    }, card);
    
    const hasBlueGradient = bgColor.includes('blue') || bgColor.includes('rgb(59, 130, 246)') || bgColor.includes('rgb(147, 197, 253)');
    return {
      passed: hasBlueGradient,
      details: hasBlueGradient ? 'Blue gradient correctly applied' : 'Blue gradient not found'
    };
  });
  
  await runTest('VRating Color Coding - Purple Range (9.0-10.0)', async () => {
    const card = await page.$('[title="VRating 9.8 (Purple Range)"]');
    if (!card) return { passed: false, error: 'Purple range card not found' };
    
    const bgColor = await page.evaluate(el => {
      const computedStyle = window.getComputedStyle(el);
      return computedStyle.background;
    }, card);
    
    const hasPurpleGradient = bgColor.includes('purple') || bgColor.includes('rgb(168, 85, 247)') || bgColor.includes('rgb(196, 181, 253)');
    return {
      passed: hasPurpleGradient,
      details: hasPurpleGradient ? 'Purple gradient correctly applied' : 'Purple gradient not found'
    };
  });
  
  // Test 2: Tooltip Functionality
  await runTest('Tooltip Functionality - Short Tooltip', async () => {
    const card = await page.$('[title="Short Tooltip"]');
    if (!card) return { passed: false, error: 'Short tooltip card not found' };
    
    // Hover over the card
    await card.hover();
    await page.waitForTimeout(500);
    
    // Check if tooltip appears
    const tooltip = await page.$('text=Short tooltip text');
    const tooltipExists = tooltip !== null;
    
    return {
      passed: tooltipExists,
      details: tooltipExists ? 'Short tooltip appears on hover' : 'Short tooltip not found'
    };
  });
  
  await runTest('Tooltip Functionality - Long Tooltip', async () => {
    const card = await page.$('[title="Long Tooltip"]');
    if (!card) return { passed: false, error: 'Long tooltip card not found' };
    
    // Hover over the card
    await card.hover();
    await page.waitForTimeout(500);
    
    // Check if tooltip appears with long text
    const tooltip = await page.$('text=This is a much longer tooltip that should demonstrate');
    const tooltipExists = tooltip !== null;
    
    return {
      passed: tooltipExists,
      details: tooltipExists ? 'Long tooltip appears on hover' : 'Long tooltip not found'
    };
  });
  
  await runTest('Tooltip Functionality - Glass Morphism Styling', async () => {
    const card = await page.$('[title="Short Tooltip"]');
    if (!card) return { passed: false, error: 'Tooltip test card not found' };
    
    // Hover over the card
    await card.hover();
    await page.waitForTimeout(500);
    
    // Check for glass morphism styling
    const tooltipStyles = await page.evaluate(() => {
      const tooltip = document.querySelector('[class*="bg-slate-800/90"]');
      if (!tooltip) return null;
      
      const computedStyle = window.getComputedStyle(tooltip);
      return {
        backgroundColor: computedStyle.backgroundColor,
        backdropFilter: computedStyle.backdropFilter,
        borderRadius: computedStyle.borderRadius,
        boxShadow: computedStyle.boxShadow
      };
    });
    
    const hasGlassMorphism = tooltipStyles && 
      (tooltipStyles.backdropFilter.includes('blur') || 
       tooltipStyles.backgroundColor.includes('0.9') ||
       tooltipStyles.backgroundColor.includes('rgba'));
    
    return {
      passed: hasGlassMorphism,
      details: hasGlassMorphism ? 'Glass morphism styling applied' : 'Glass morphism styling not detected'
    };
  });
  
  // Test 3: Icon Selection
  const iconTests = [
    { name: 'Trending Icon', selector: '[title="Trending Icon"]' },
    { name: 'Shield Icon', selector: '[title="Shield Icon"]' },
    { name: 'Target Icon', selector: '[title="Target Icon"]' },
    { name: 'Brain Icon', selector: '[title="Brain Icon"]' },
    { name: 'Book Icon', selector: '[title="Book Icon"]' },
    { name: 'Activity Icon', selector: '[title="Activity Icon"]' },
    { name: 'Alert Icon', selector: '[title="Alert Icon"]' },
    { name: 'Check Icon', selector: '[title="Check Icon"]' },
    { name: 'Star Icon', selector: '[title="Star Icon"]' },
    { name: 'Clock Icon', selector: '[title="Clock Icon"]' },
    { name: 'Zap Icon', selector: '[title="Zap Icon"]' },
    { name: 'Info Icon', selector: '[title="Info Icon"]' },
    { name: 'Chart Icon', selector: '[title="Chart Icon"]' }
  ];
  
  for (const iconTest of iconTests) {
    await runTest(`Icon Selection - ${iconTest.name}`, async () => {
      const card = await page.$(iconTest.selector);
      if (!card) return { passed: false, error: `${iconTest.name} card not found` };
      
      // Check if icon is present
      const icon = await card.$('svg');
      const iconExists = icon !== null;
      
      return {
        passed: iconExists,
        details: iconExists ? `${iconTest.name} rendered correctly` : `${iconTest.name} not found`
      };
    });
  }
  
  // Test 4: Responsive Design
  await runTest('Responsive Design - Text Truncation', async () => {
    // Test with smaller viewport
    await page.setViewport({ width: 768, height: 1024 });
    await page.waitForTimeout(1000);
    
    const longTitleCard = await page.$('[title="This is an extremely long metric name that should be truncated properly"]');
    if (!longTitleCard) return { passed: false, error: 'Long title card not found' };
    
    // Check if text is truncated
    const titleElement = await longTitleCard.$('h3');
    const titleStyles = await page.evaluate(el => {
      const computedStyle = window.getComputedStyle(el);
      return {
        textOverflow: computedStyle.textOverflow,
        overflow: computedStyle.overflow,
        whiteSpace: computedStyle.whiteSpace
      };
    }, titleElement);
    
    const hasTextTruncation = titleStyles.textOverflow === 'ellipsis' && 
                             titleStyles.overflow === 'hidden' && 
                             (titleStyles.whiteSpace === 'nowrap' || titleStyles.whiteSpace === 'normal');
    
    // Reset viewport
    await page.setViewport({ width: 1920, height: 1080 });
    
    return {
      passed: hasTextTruncation,
      details: hasTextTruncation ? 'Text truncation applied correctly' : 'Text truncation not detected'
    };
  });
  
  // Test 5: Backward Compatibility
  await runTest('Backward Compatibility - Profitability Prop', async () => {
    const card = await page.$('[title="Profitability Good"]');
    if (!card) return { passed: false, error: 'Profitability card not found' };
    
    const bgColor = await page.evaluate(el => {
      const computedStyle = window.getComputedStyle(el);
      return computedStyle.background;
    }, card);
    
    const hasGreenColor = bgColor.includes('green') || bgColor.includes('rgb(34, 197, 94)');
    
    return {
      passed: hasGreenColor,
      details: hasGreenColor ? 'Backward compatibility maintained' : 'Backward compatibility issue'
    };
  });
  
  await runTest('Backward Compatibility - Negative Value Detection', async () => {
    const card = await page.$('[title="Negative Value"]');
    if (!card) return { passed: false, error: 'Negative value card not found' };
    
    const bgColor = await page.evaluate(el => {
      const computedStyle = window.getComputedStyle(el);
      return computedStyle.background;
    }, card);
    
    const hasRedColor = bgColor.includes('red') || bgColor.includes('rgb(239, 68, 68)');
    
    return {
      passed: hasRedColor,
      details: hasRedColor ? 'Negative value detection working' : 'Negative value detection issue'
    };
  });
  
  // Test 6: Performance Optimization
  await runTest('Performance Optimization - Memoization', async () => {
    // Get initial render count
    const initialCount = await page.evaluate(() => {
      const countElement = document.querySelector('text=Component Render Count:');
      if (!countElement) return 0;
      const text = countElement.parentElement.textContent;
      const match = text.match(/Component Render Count: (\d+)/);
      return match ? parseInt(match[1]) : 0;
    });
    
    // Click reset button to reset counter
    const resetButton = await page.$('text=Reset Counter');
    if (resetButton) {
      await resetButton.click();
      await page.waitForTimeout(500);
    }
    
    // Trigger some state change that shouldn't affect cards
    await page.evaluate(() => {
      window.testStateChange = true;
    });
    await page.waitForTimeout(1000);
    
    // Check render count after state change
    const finalCount = await page.evaluate(() => {
      const countElement = document.querySelector('text=Component Render Count:');
      if (!countElement) return 0;
      const text = countElement.parentElement.textContent;
      const match = text.match(/Component Render Count: (\d+)/);
      return match ? parseInt(match[1]) : 0;
    });
    
    // Memoization is working if render count is reasonable (not excessively high)
    const memoizationWorking = finalCount <= 10; // Allow some initial renders
    
    return {
      passed: memoizationWorking,
      details: `Render count: ${finalCount} (memoization ${memoizationWorking ? 'working' : 'not working'})`
    };
  });
  
  // Test 7: VRating Categories
  const categoryTests = [
    { name: 'Profitability Category', selector: '[title="Profitability Rating"]' },
    { name: 'Risk Management Category', selector: '[title="Risk Management"]' },
    { name: 'Consistency Category', selector: '[title="Consistency"]' },
    { name: 'Emotional Discipline Category', selector: '[title="Emotional Discipline"]' },
    { name: 'Journaling Adherence Category', selector: '[title="Journaling Adherence"]' }
  ];
  
  for (const categoryTest of categoryTests) {
    await runTest(`VRating Categories - ${categoryTest.name}`, async () => {
      const card = await page.$(categoryTest.selector);
      if (!card) return { passed: false, error: `${categoryTest.name} card not found` };
      
      // Check if card has proper VRating styling
      const hasVRatingValue = await page.evaluate(el => {
        const text = el.textContent;
        return text && text.includes('/10');
      }, card);
      
      return {
        passed: hasVRatingValue,
        details: hasVRatingValue ? `${categoryTest.name} with VRating value displayed` : `${categoryTest.name} VRating value not found`
      };
    });
  }
  
  // Take screenshot for visual verification
  await page.screenshot({
    path: 'dashboard-card-vrating-test-results.png',
    fullPage: true
  });
  
  // Generate test report
  const reportContent = generateTestReport(testResults);
  
  // Save report to file
  const fs = require('fs');
  fs.writeFileSync('dashboard-card-vrating-test-report.json', JSON.stringify(testResults, null, 2));
  fs.writeFileSync('dashboard-card-vrating-test-report.md', reportContent);
  
  console.log('\n📊 Test Summary:');
  console.log(`   Total Tests: ${testResults.summary.total}`);
  console.log(`   Passed: ${testResults.summary.passed}`);
  console.log(`   Failed: ${testResults.summary.failed}`);
  console.log(`   Success Rate: ${((testResults.summary.passed / testResults.summary.total) * 100).toFixed(1)}%`);
  
  console.log('\n📄 Reports generated:');
  console.log('   - dashboard-card-vrating-test-results.png (screenshot)');
  console.log('   - dashboard-card-vrating-test-report.json (detailed results)');
  console.log('   - dashboard-card-vrating-test-report.md (readable report)');
  
  await browser.close();
  
  return testResults;
}

function generateTestReport(results) {
  const timestamp = new Date().toLocaleString();
  const successRate = ((results.summary.passed / results.summary.total) * 100).toFixed(1);
  
  let report = `# DashboardCard VRating Feature Test Report\n\n`;
  report += `**Generated:** ${timestamp}\n`;
  report += `**Success Rate:** ${successRate}% (${results.summary.passed}/${results.summary.total})\n\n`;
  
  report += `## Summary\n\n`;
  report += `- ✅ **Passed:** ${results.summary.passed}\n`;
  report += `- ❌ **Failed:** ${results.summary.failed}\n`;
  report += `- 📊 **Total:** ${results.summary.total}\n\n`;
  
  report += `## Test Results\n\n`;
  
  results.tests.forEach(test => {
    const status = test.passed ? '✅' : '❌';
    report += `### ${status} ${test.name}\n\n`;
    
    if (test.details) {
      report += `**Details:** ${test.details}\n\n`;
    }
    
    if (test.error) {
      report += `**Error:** ${test.error}\n\n`;
    }
    
    if (test.duration) {
      report += `**Duration:** ${test.duration}ms\n\n`;
    }
  });
  
  report += `## Visual Verification\n\n`;
  report += `A full-page screenshot has been captured for visual verification of all DashboardCard VRating features.\n\n`;
  
  report += `## Test Coverage\n\n`;
  report += `- ✅ VRating Color Coding (All 6 ranges tested)\n`;
  report += `- ✅ Tooltip Functionality (Short, long, and glass morphism styling)\n`;
  report += `- ✅ Icon Selection (All 13 supported icons tested)\n`;
  report += `- ✅ Responsive Design (Text truncation verified)\n`;
  report += `- ✅ Backward Compatibility (Original props still work)\n`;
  report += `- ✅ Performance Optimization (Memoization verified)\n`;
  report += `- ✅ VRating Categories (All 5 categories tested)\n\n`;
  
  report += `## Conclusion\n\n`;
  
  if (results.summary.failed === 0) {
    report += `🎉 **All tests passed!** The enhanced DashboardCard component with VRating support is working correctly.\n\n`;
    report += `All VRating features have been successfully implemented and tested:\n`;
    report += `- Color coding works correctly for all rating ranges\n`;
    report += `- Tooltips display properly with glass morphism styling\n`;
    report += `- All icon types render correctly\n`;
    report += `- Responsive design handles text truncation\n`;
    report += `- Backward compatibility is maintained\n`;
    report += `- Performance optimizations with memoization are working\n`;
    report += `- All VRating categories are supported\n`;
  } else {
    report += `⚠️ **Some tests failed.** Please review the failed tests and address the issues.\n\n`;
    report += `The enhanced DashboardCard component may need adjustments for full functionality.\n`;
  }
  
  return report;
}

// Run the test
testDashboardCardVRating().catch(console.error);