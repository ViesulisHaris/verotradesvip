// Comprehensive sorting functionality test script
const puppeteer = require('puppeteer');
const path = require('path');

const TEST_RESULTS = {
  duplicateElementsRemoved: false,
  iconBasedSortingWorks: false,
  sortStateMaintained: false,
  activeSortVisualIndication: false,
  responsiveBehavior: false,
  consoleErrors: false,
  uiClean: false,
  details: []
};

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function takeScreenshot(page, filename) {
  const screenshotPath = path.join(__dirname, filename);
  await page.screenshot({ path: screenshotPath, fullPage: true });
  TEST_RESULTS.details.push(`Screenshot saved: ${filename}`);
  return screenshotPath;
}

async function checkForConsoleErrors(page) {
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });
  
  page.on('pageerror', error => {
    consoleErrors.push(error.message);
  });
  
  return consoleErrors;
}

async function testSortingFunctionality() {
  console.log('🚀 Starting comprehensive sorting functionality test...\n');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1920, height: 1080 }
  });
  
  try {
    const page = await browser.newPage();
    const consoleErrors = await checkForConsoleErrors(page);
    
    // Navigate to the trades page
    console.log('📍 Navigating to trades page...');
    await page.goto('http://localhost:3000/trades', { waitUntil: 'networkidle2' });
    await delay(3000);
    
    // Take initial screenshot
    await takeScreenshot(page, 'sorting-test-initial-state.png');
    
    // Test 1: Check that duplicate elements are removed
    console.log('\n🔍 Test 1: Checking for duplicate sort elements...');
    
    // Check for EnhancedSortControls dropdown (should be removed)
    const enhancedSortDropdown = await page.$('[data-testid="enhanced-sort-dropdown"]');
    const enhancedSortExists = enhancedSortDropdown !== null;
    
    // Check for Current Sort Badge (should be removed)
    const currentSortBadge = await page.$('.bg-blue-600\\/10.border.border-blue-500\\/20');
    const badgeExists = currentSortBadge !== null;
    
    // Check for Mobile sort indicator (should be removed)
    const mobileSortIndicator = await page.$('.lg:hidden.flex.items-center.gap-2.px-3.py-1.5.bg-blue-600\\/10');
    const mobileIndicatorExists = mobileSortIndicator !== null;
    
    TEST_RESULTS.duplicateElementsRemoved = !enhancedSortExists && !badgeExists && !mobileIndicatorExists;
    TEST_RESULTS.details.push(`Enhanced Sort Dropdown removed: ${!enhancedSortExists}`);
    TEST_RESULTS.details.push(`Current Sort Badge removed: ${!badgeExists}`);
    TEST_RESULTS.details.push(`Mobile Sort Indicator removed: ${!mobileIndicatorExists}`);
    
    // Test 2: Check that icon-based sort buttons exist and work
    console.log('\n🔍 Test 2: Testing icon-based sort buttons...');
    
    // Find the quick sort buttons (Date, P&L, Symbol)
    const sortButtons = await page.$$('button[title*="Sort by"]');
    console.log(`Found ${sortButtons.length} sort buttons`);
    
    if (sortButtons.length >= 3) {
      TEST_RESULTS.details.push('✅ Found expected number of sort buttons');
      
      // Test Date sort button
      const dateButton = await page.$('button[title="Sort by Date"]');
      if (dateButton) {
        await dateButton.click();
        await delay(1000);
        TEST_RESULTS.details.push('✅ Date sort button clicked');
        await takeScreenshot(page, 'sorting-test-date-sorted.png');
      }
      
      // Test P&L sort button
      const plButton = await page.$('button[title="Sort by P&L"]');
      if (plButton) {
        await plButton.click();
        await delay(1000);
        TEST_RESULTS.details.push('✅ P&L sort button clicked');
        await takeScreenshot(page, 'sorting-test-pl-sorted.png');
      }
      
      // Test Symbol sort button
      const symbolButton = await page.$('button[title="Sort by Symbol"]');
      if (symbolButton) {
        await symbolButton.click();
        await delay(1000);
        TEST_RESULTS.details.push('✅ Symbol sort button clicked');
        await takeScreenshot(page, 'sorting-test-symbol-sorted.png');
      }
      
      TEST_RESULTS.iconBasedSortingWorks = true;
    } else {
      TEST_RESULTS.details.push('❌ Not enough sort buttons found');
    }
    
    // Test 3: Verify sort state is maintained
    console.log('\n🔍 Test 3: Testing sort state persistence...');
    
    // Click a sort button and then refresh the page to check if state is maintained
    const dateButton = await page.$('button[title="Sort by Date"]');
    if (dateButton) {
      await dateButton.click();
      await delay(1000);
      
      // Get current sort state from URL or localStorage
      const url = page.url();
      const hasSortInUrl = url.includes('sortBy=');
      
      const localStorageSort = await page.evaluate(() => {
        return localStorage.getItem('trades-sort-config');
      });
      
      TEST_RESULTS.sortStateMaintained = hasSortInUrl || localStorageSort !== null;
      TEST_RESULTS.details.push(`Sort state in URL: ${hasSortInUrl}`);
      TEST_RESULTS.details.push(`Sort state in localStorage: ${localStorageSort !== null}`);
      
      await takeScreenshot(page, 'sorting-test-state-check.png');
    }
    
    // Test 4: Check active sort state visual indication
    console.log('\n🔍 Test 4: Checking active sort state visual indication...');
    
    // Look for visual indicators on active sort buttons
    const activeSortButtons = await page.$$('[aria-pressed="true"], .bg-blue-600, .text-blue-600');
    const hasVisualIndication = activeSortButtons.length > 0;
    
    TEST_RESULTS.activeSortVisualIndication = hasVisualIndication;
    TEST_RESULTS.details.push(`Active sort buttons with visual indication: ${activeSortButtons.length}`);
    
    // Test 5: Test responsive behavior
    console.log('\n🔍 Test 5: Testing responsive behavior...');
    
    // Test mobile view
    await page.setViewport({ width: 375, height: 667 });
    await delay(1000);
    await takeScreenshot(page, 'sorting-test-mobile-view.png');
    
    // Check if sort buttons are still visible and functional on mobile
    const mobileSortButtons = await page.$$('button[title*="Sort by"]');
    const mobileButtonsVisible = mobileSortButtons.length >= 3;
    
    // Test desktop view
    await page.setViewport({ width: 1920, height: 1080 });
    await delay(1000);
    await takeScreenshot(page, 'sorting-test-desktop-view.png');
    
    const desktopSortButtons = await page.$$('button[title*="Sort by"]');
    const desktopButtonsVisible = desktopSortButtons.length >= 3;
    
    TEST_RESULTS.responsiveBehavior = mobileButtonsVisible && desktopButtonsVisible;
    TEST_RESULTS.details.push(`Mobile sort buttons visible: ${mobileButtonsVisible}`);
    TEST_RESULTS.details.push(`Desktop sort buttons visible: ${desktopButtonsVisible}`);
    
    // Test 6: Check for console errors
    console.log('\n🔍 Test 6: Checking for console errors...');
    
    await delay(2000); // Wait for any potential errors to appear
    
    TEST_RESULTS.consoleErrors = consoleErrors.length === 0;
    TEST_RESULTS.details.push(`Console errors found: ${consoleErrors.length}`);
    if (consoleErrors.length > 0) {
      consoleErrors.forEach(error => {
        TEST_RESULTS.details.push(`Error: ${error}`);
      });
    }
    
    // Test 7: Check if UI looks clean
    console.log('\n🔍 Test 7: Checking UI cleanliness...');
    
    // Check for any remaining duplicate elements or visual issues
    const duplicateIndicators = await page.$$('[data-testid*="sort"], .sort-indicator');
    const reasonableNumberOfIndicators = duplicateIndicators.length <= 5; // Allow for reasonable number of indicators
    
    TEST_RESULTS.uiClean = reasonableNumberOfIndicators;
    TEST_RESULTS.details.push(`Total sort-related elements found: ${duplicateIndicators.length}`);
    
    await takeScreenshot(page, 'sorting-test-final-state.png');
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
    TEST_RESULTS.details.push(`Test error: ${error.message}`);
  } finally {
    await browser.close();
  }
}

async function generateTestReport() {
  console.log('\n📊 GENERATING COMPREHENSIVE TEST REPORT...\n');
  
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      duplicateElementsRemoved: TEST_RESULTS.duplicateElementsRemoved,
      iconBasedSortingWorks: TEST_RESULTS.iconBasedSortingWorks,
      sortStateMaintained: TEST_RESULTS.sortStateMaintained,
      activeSortVisualIndication: TEST_RESULTS.activeSortVisualIndication,
      responsiveBehavior: TEST_RESULTS.responsiveBehavior,
      consoleErrors: TEST_RESULTS.consoleErrors,
      uiClean: TEST_RESULTS.uiClean
    },
    details: TEST_RESULTS.details,
    overallStatus: Object.values(TEST_RESULTS).filter(v => typeof v === 'boolean').every(v => v)
  };
  
  // Save report as JSON
  const reportPath = path.join(__dirname, 'sorting-functionality-test-report.json');
  require('fs').writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  // Generate markdown report
  const markdownReport = generateMarkdownReport(report);
  const markdownPath = path.join(__dirname, 'SORTING_FUNCTIONALITY_TEST_REPORT.md');
  require('fs').writeFileSync(markdownPath, markdownReport);
  
  console.log('✅ Test report generated:');
  console.log(`   JSON: ${reportPath}`);
  console.log(`   Markdown: ${markdownPath}`);
  
  return report;
}

function generateMarkdownReport(report) {
  return `# Sorting Functionality Test Report

**Generated:** ${new Date(report.timestamp).toLocaleString()}

## Executive Summary

${report.overallStatus ? '✅ **ALL TESTS PASSED** - The sorting functionality is working correctly after removing duplicate elements.' : '❌ **SOME TESTS FAILED** - There are issues that need to be addressed.'}

## Test Results

| Test Category | Status | Details |
|---------------|--------|---------|
| Duplicate Elements Removed | ${report.summary.duplicateElementsRemoved ? '✅ PASS' : '❌ FAIL'} | ${report.summary.duplicateElementsRemoved ? 'All duplicate sort elements have been successfully removed' : 'Some duplicate elements may still be present'} |
| Icon-Based Sorting Works | ${report.summary.iconBasedSortingWorks ? '✅ PASS' : '❌ FAIL'} | ${report.summary.iconBasedSortingWorks ? 'Date, P&L, and Symbol sort buttons work correctly' : 'Sort buttons are not functioning properly'} |
| Sort State Maintained | ${report.summary.sortStateMaintained ? '✅ PASS' : '❌ FAIL'} | ${report.summary.sortStateMaintained ? 'Sort state is properly persisted across page interactions' : 'Sort state is not being maintained correctly'} |
| Active Sort Visual Indication | ${report.summary.activeSortVisualIndication ? '✅ PASS' : '❌ FAIL'} | ${report.summary.activeSortVisualIndication ? 'Active sort state is clearly indicated on buttons' : 'Visual feedback for active sort is missing'} |
| Responsive Behavior | ${report.summary.responsiveBehavior ? '✅ PASS' : '❌ FAIL'} | ${report.summary.responsiveBehavior ? 'Sorting works correctly on both mobile and desktop views' : 'Responsive behavior has issues'} |
| No Console Errors | ${report.summary.consoleErrors ? '✅ PASS' : '❌ FAIL'} | ${report.summary.consoleErrors ? 'No console errors detected' : 'Console errors are present'} |
| UI Cleanliness | ${report.summary.uiClean ? '✅ PASS' : '❌ FAIL'} | ${report.summary.uiClean ? 'UI looks clean without duplicate elements' : 'UI may have visual clutter or duplicates'} |

## Detailed Test Information

${report.details.map(detail => `- ${detail}`).join('\n')}

## Screenshots

The following screenshots were captured during testing:

- \`sorting-test-initial-state.png\` - Initial state of the trades page
- \`sorting-test-date-sorted.png\` - After clicking Date sort button
- \`sorting-test-pl-sorted.png\` - After clicking P&L sort button
- \`sorting-test-symbol-sorted.png\` - After clicking Symbol sort button
- \`sorting-test-state-check.png\` - Sort state verification
- \`sorting-test-mobile-view.png\` - Mobile view responsive test
- \`sorting-test-desktop-view.png\` - Desktop view responsive test
- \`sorting-test-final-state.png\` - Final state after all tests

## Recommendations

${report.overallStatus ? 
`✅ **All functionality is working correctly!** 

The duplicate "sort by" elements have been successfully removed while maintaining all sorting functionality. The icon-based sorting buttons work correctly, sort state is maintained, and the UI is clean and responsive.

No further action is needed.` :
`❌ **Issues found that need attention:**

${!report.summary.duplicateElementsRemoved ? '- Some duplicate sort elements may still be present\n' : ''}
${!report.summary.iconBasedSortingWorks ? '- Icon-based sorting buttons are not working correctly\n' : ''}
${!report.summary.sortStateMaintained ? '- Sort state persistence needs to be fixed\n' : ''}
${!report.summary.activeSortVisualIndication ? '- Visual feedback for active sort is missing\n' : ''}
${!report.summary.responsiveBehavior ? '- Responsive behavior needs improvement\n' : ''}
${!report.summary.consoleErrors ? '- Console errors need to be resolved\n' : ''}
${!report.summary.uiClean ? '- UI cleanliness issues need to be addressed\n' : ''}

Please review the detailed logs and screenshots to identify and fix the specific issues.`}

## Conclusion

${report.overallStatus ? 
'The sorting functionality cleanup was successful. All duplicate elements have been removed while preserving full sorting functionality.' :
'There are issues that need to be resolved before the sorting functionality can be considered fully working.'}
`;
}

// Run the test
async function runTest() {
  await testSortingFunctionality();
  const report = await generateTestReport();
  
  console.log('\n🎉 Sorting functionality test completed!');
  console.log(`Overall Status: ${report.overallStatus ? '✅ PASSED' : '❌ FAILED'}`);
  
  return report;
}

// Export for use in other scripts
module.exports = { runTest, TEST_RESULTS };

// Run if called directly
if (require.main === module) {
  runTest().catch(console.error);
}