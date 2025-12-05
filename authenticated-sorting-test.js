// Authentication-aware sorting functionality test
const puppeteer = require('puppeteer');
const path = require('path');

const TEST_RESULTS = {
  authenticationPassed: false,
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
  await page.screenshot({ path: screenshotPath, fullPage: false });
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

async function testAuthenticatedSortingFunctionality() {
  console.log('🚀 Starting authenticated sorting functionality test...\n');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1920, height: 1080 }
  });
  
  try {
    const page = await browser.newPage();
    const consoleErrors = await checkForConsoleErrors(page);
    
    // First, navigate to the test-auth-bypass page to bypass authentication
    console.log('🔐 Navigating to authentication bypass page...');
    await page.goto('http://localhost:3000/test-auth-bypass', { waitUntil: 'networkidle2' });
    await delay(3000);
    
    // Check if authentication bypass worked
    const authCheck = await page.evaluate(() => {
      const authElements = document.querySelectorAll('[data-testid*="auth"], [class*="auth"]');
      const userElements = document.querySelectorAll('[data-testid*="user"], [class*="user"]');
      return {
        authElements: authElements.length,
        userElements: userElements.length,
        pageContent: document.body.innerText.substring(0, 200)
      };
    });
    
    console.log('Auth bypass check:', authCheck);
    TEST_RESULTS.details.push(`Auth elements found: ${authCheck.authElements}`);
    TEST_RESULTS.details.push(`User elements found: ${authCheck.userElements}`);
    
    await takeScreenshot(page, 'auth-test-bypass-state.png');
    
    // Now navigate to the trades page
    console.log('📍 Navigating to trades page...');
    await page.goto('http://localhost:3000/trades', { waitUntil: 'networkidle2' });
    await delay(5000); // Extra wait for authentication and data loading
    
    // Take initial screenshot
    await takeScreenshot(page, 'authenticated-sorting-test-initial.png');
    
    // Test 1: Check that icon-based sort buttons exist
    console.log('\n🔍 Test 1: Checking for icon-based sort buttons...');
    
    // Look for sort buttons using various selectors
    const sortButtons = await page.evaluate(() => {
      const buttons = [];
      
      // Look for buttons with sort-related titles
      const titleButtons = document.querySelectorAll('button[title*="Sort by"], button[title*="Date"], button[title*="P&L"], button[title*="Symbol"]');
      titleButtons.forEach(btn => buttons.push({
        title: btn.title,
        text: btn.textContent.trim(),
        visible: btn.offsetParent !== null,
        classes: btn.className
      }));
      
      // Look for buttons with sort-related text content
      const allButtons = document.querySelectorAll('button');
      allButtons.forEach(btn => {
        const text = btn.textContent.trim();
        if (text.includes('Date') || text.includes('P&L') || text.includes('Symbol') || 
            text.includes('Newest') || text.includes('Oldest') || text.includes('Highest') || text.includes('Lowest')) {
          buttons.push({
            title: btn.title || '',
            text: text,
            visible: btn.offsetParent !== null,
            classes: btn.className
          });
        }
      });
      
      // Look for buttons with calendar, trending up, or arrow icons
      const iconButtons = document.querySelectorAll('button svg');
      iconButtons.forEach(btn => {
        const parent = btn.closest('button');
        if (parent && parent.offsetParent !== null) {
          const text = parent.textContent.trim();
          if (text.length > 0 && text.length < 50) { // Reasonable button text length
            buttons.push({
              title: parent.title || '',
              text: text,
              visible: true,
              classes: parent.className,
              hasIcon: true
            });
          }
        }
      });
      
      return buttons;
    });
    
    console.log(`Found ${sortButtons.length} sort-related buttons:`, sortButtons);
    TEST_RESULTS.details.push(`Sort buttons found: ${sortButtons.length}`);
    
    if (sortButtons.length >= 3) {
      TEST_RESULTS.iconBasedSortingWorks = true;
      TEST_RESULTS.details.push('✅ Found expected number of sort buttons');
    } else {
      TEST_RESULTS.details.push('❌ Not enough sort buttons found');
    }
    
    // Test 2: Check for duplicate elements (should be removed)
    console.log('\n🔍 Test 2: Checking for removed duplicate elements...');
    
    const duplicateCheck = await page.evaluate(() => {
      const results = {
        enhancedSortDropdown: false,
        currentSortBadge: false,
        mobileSortIndicator: false,
        totalSortElements: 0,
        sortControlsFound: false
      };
      
      // Check for enhanced sort dropdown
      const enhancedDropdown = document.querySelectorAll('[data-testid*="enhanced-sort"], [class*="enhanced-sort"]');
      results.enhancedSortDropdown = enhancedDropdown.length > 0;
      
      // Check for current sort badge
      const sortBadges = document.querySelectorAll('[class*="bg-blue-600"][class*="border"]');
      results.currentSortBadge = sortBadges.length > 0;
      
      // Check for mobile sort indicator
      const mobileIndicators = document.querySelectorAll('[class*="lg:hidden"][class*="bg-blue-600"]');
      results.mobileSortIndicator = mobileIndicators.length > 0;
      
      // Check if TradesSortControls is present
      const sortControls = document.querySelectorAll('[class*="TradesSortControls"], [data-testid*="sort-controls"]');
      results.sortControlsFound = sortControls.length > 0;
      
      // Count total sort-related elements
      const allSortElements = document.querySelectorAll('[class*="sort"], [title*="Sort"], [data-testid*="sort"]');
      results.totalSortElements = allSortElements.length;
      
      return results;
    });
    
    console.log('Duplicate check results:', duplicateCheck);
    
    // The duplicate elements should be removed, so these should be false
    const duplicatesRemoved = !duplicateCheck.enhancedSortDropdown && 
                             !duplicateCheck.currentSortBadge && 
                             !duplicateCheck.mobileSortIndicator;
    
    TEST_RESULTS.duplicateElementsRemoved = duplicatesRemoved;
    TEST_RESULTS.details.push(`Enhanced sort dropdown removed: ${!duplicateCheck.enhancedSortDropdown}`);
    TEST_RESULTS.details.push(`Current sort badge removed: ${!duplicateCheck.currentSortBadge}`);
    TEST_RESULTS.details.push(`Mobile sort indicator removed: ${!duplicateCheck.mobileSortIndicator}`);
    TEST_RESULTS.details.push(`Sort controls present: ${duplicateCheck.sortControlsFound}`);
    TEST_RESULTS.details.push(`Total sort elements: ${duplicateCheck.totalSortElements}`);
    
    // Test 3: Test clicking sort buttons
    console.log('\n🔍 Test 3: Testing sort button functionality...');
    
    if (sortButtons.length > 0) {
      // Click the first sort button that looks like a date sort button
      const dateSortButton = sortButtons.find(btn => 
        btn.title.includes('Date') || btn.text.includes('Date') || btn.text.includes('Newest')
      );
      
      if (dateSortButton) {
        console.log(`Clicking button: ${dateSortButton.title || dateSortButton.text}`);
        
        await page.evaluate((buttonText) => {
          const buttons = Array.from(document.querySelectorAll('button'));
          const targetButton = buttons.find(btn => 
            btn.title === buttonText || 
            btn.textContent.trim() === buttonText ||
            btn.textContent.trim().includes(buttonText)
          );
          if (targetButton) {
            targetButton.click();
            return true;
          }
          return false;
        }, dateSortButton.title || dateSortButton.text);
        
        await delay(2000);
        await takeScreenshot(page, 'authenticated-sorting-test-after-click.png');
        TEST_RESULTS.details.push(`✅ Clicked sort button: ${dateSortButton.title || dateSortButton.text}`);
      } else {
        // Try clicking any button
        const firstButton = sortButtons[0];
        console.log(`Clicking first available button: ${firstButton.title || firstButton.text}`);
        
        await page.evaluate((buttonText) => {
          const buttons = Array.from(document.querySelectorAll('button'));
          const targetButton = buttons.find(btn => 
            btn.textContent.trim() === buttonText
          );
          if (targetButton) {
            targetButton.click();
            return true;
          }
          return false;
        }, firstButton.text);
        
        await delay(2000);
        await takeScreenshot(page, 'authenticated-sorting-test-after-click.png');
        TEST_RESULTS.details.push(`✅ Clicked first available button: ${firstButton.text}`);
      }
    }
    
    // Test 4: Check for active sort state indication
    console.log('\n🔍 Test 4: Checking for active sort state indication...');
    
    const activeStateCheck = await page.evaluate(() => {
      const activeElements = [];
      
      // Look for buttons with active state indicators
      const activeButtons = document.querySelectorAll('button[aria-pressed="true"], button[class*="active"], button[class*="bg-blue-600"], button[class*="text-blue-400"]');
      activeButtons.forEach(btn => {
        if (btn.tagName === 'BUTTON') {
          activeElements.push({
            text: btn.textContent.trim(),
            title: btn.title || '',
            classes: btn.className
          });
        }
      });
      
      return activeElements;
    });
    
    console.log('Active state elements:', activeStateCheck);
    TEST_RESULTS.activeSortVisualIndication = activeStateCheck.length > 0;
    TEST_RESULTS.details.push(`Active sort indicators found: ${activeStateCheck.length}`);
    
    // Test 5: Test responsive behavior
    console.log('\n🔍 Test 5: Testing responsive behavior...');
    
    // Test mobile view
    await page.setViewport({ width: 375, height: 667 });
    await delay(1000);
    await takeScreenshot(page, 'authenticated-sorting-test-mobile.png');
    
    const mobileButtons = await page.evaluate(() => {
      const buttons = document.querySelectorAll('button');
      return Array.from(buttons).filter(btn => btn.offsetParent !== null).length;
    });
    
    // Test desktop view
    await page.setViewport({ width: 1920, height: 1080 });
    await delay(1000);
    await takeScreenshot(page, 'authenticated-sorting-test-desktop.png');
    
    const desktopButtons = await page.evaluate(() => {
      const buttons = document.querySelectorAll('button');
      return Array.from(buttons).filter(btn => btn.offsetParent !== null).length;
    });
    
    TEST_RESULTS.responsiveBehavior = mobileButtons > 0 && desktopButtons > 0;
    TEST_RESULTS.details.push(`Mobile visible buttons: ${mobileButtons}`);
    TEST_RESULTS.details.push(`Desktop visible buttons: ${desktopButtons}`);
    
    // Test 6: Check for console errors
    console.log('\n🔍 Test 6: Checking for console errors...');
    
    await delay(2000);
    TEST_RESULTS.consoleErrors = consoleErrors.length === 0;
    TEST_RESULTS.details.push(`Console errors: ${consoleErrors.length}`);
    if (consoleErrors.length > 0) {
      consoleErrors.forEach(error => {
        TEST_RESULTS.details.push(`Error: ${error}`);
      });
    }
    
    // Test 7: UI cleanliness check
    console.log('\n🔍 Test 7: Checking UI cleanliness...');
    
    const uiCheck = await page.evaluate(() => {
      const sortElements = document.querySelectorAll('[class*="sort"], [title*="Sort"]');
      return {
        totalSortElements: sortElements.length,
        hasDuplicates: sortElements.length > 15 // Reasonable threshold
      };
    });
    
    TEST_RESULTS.uiClean = !uiCheck.hasDuplicates;
    TEST_RESULTS.details.push(`UI clean (no excessive duplicates): ${!uiCheck.hasDuplicates}`);
    TEST_RESULTS.details.push(`Total sort elements: ${uiCheck.totalSortElements}`);
    
    await takeScreenshot(page, 'authenticated-sorting-test-final.png');
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
    TEST_RESULTS.details.push(`Test error: ${error.message}`);
  } finally {
    await browser.close();
  }
}

async function generateTestReport() {
  console.log('\n📊 GENERATING AUTHENTICATED TEST REPORT...\n');
  
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      authenticationPassed: TEST_RESULTS.authenticationPassed,
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
  const reportPath = path.join(__dirname, 'authenticated-sorting-test-report.json');
  require('fs').writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  // Generate markdown report
  const markdownReport = generateMarkdownReport(report);
  const markdownPath = path.join(__dirname, 'AUTHENTICATED_SORTING_TEST_REPORT.md');
  require('fs').writeFileSync(markdownPath, markdownReport);
  
  console.log('✅ Test report generated:');
  console.log(`   JSON: ${reportPath}`);
  console.log(`   Markdown: ${markdownPath}`);
  
  return report;
}

function generateMarkdownReport(report) {
  return `# Authenticated Sorting Functionality Test Report

**Generated:** ${new Date(report.timestamp).toLocaleString()}

## Executive Summary

${report.overallStatus ? '✅ **ALL TESTS PASSED** - The sorting functionality is working correctly after authentication.' : '❌ **SOME TESTS FAILED** - There are issues that need to be addressed.'}

## Test Results

| Test Category | Status | Details |
|---------------|--------|---------|
| Authentication Passed | ${report.summary.authenticationPassed ? '✅ PASS' : '❌ FAIL'} | ${report.summary.authenticationPassed ? 'Authentication bypass worked correctly' : 'Authentication may have failed'} |
| Duplicate Elements Removed | ${report.summary.duplicateElementsRemoved ? '✅ PASS' : '❌ FAIL'} | ${report.summary.duplicateElementsRemoved ? 'Duplicate sort elements have been removed' : 'Duplicate elements may still be present'} |
| Icon-Based Sorting Works | ${report.summary.iconBasedSortingWorks ? '✅ PASS' : '❌ FAIL'} | ${report.summary.iconBasedSortingWorks ? 'Sort buttons are present and functional' : 'Sort buttons are missing or not working'} |
| Sort State Maintained | ${report.summary.sortStateMaintained ? '✅ PASS' : '❌ FAIL'} | ${report.summary.sortStateMaintained ? 'Sort state is maintained' : 'Sort state persistence needs work'} |
| Active Sort Visual Indication | ${report.summary.activeSortVisualIndication ? '✅ PASS' : '❌ FAIL'} | ${report.summary.activeSortVisualIndication ? 'Active sort state is visually indicated' : 'Visual feedback is missing'} |
| Responsive Behavior | ${report.summary.responsiveBehavior ? '✅ PASS' : '❌ FAIL'} | ${report.summary.responsiveBehavior ? 'Responsive design works correctly' : 'Responsive behavior has issues'} |
| No Console Errors | ${report.summary.consoleErrors ? '✅ PASS' : '❌ FAIL'} | ${report.summary.consoleErrors ? 'No console errors' : 'Console errors detected'} |
| UI Cleanliness | ${report.summary.uiClean ? '✅ PASS' : '❌ FAIL'} | ${report.summary.uiClean ? 'UI is clean without excessive duplicates' : 'UI may have clutter'} |

## Detailed Test Information

${report.details.map(detail => `- ${detail}`).join('\n')}

## Screenshots

The following screenshots were captured during testing:

- \`auth-test-bypass-state.png\` - Authentication bypass state
- \`authenticated-sorting-test-initial.png\` - Initial state after authentication
- \`authenticated-sorting-test-after-click.png\` - After clicking sort button
- \`authenticated-sorting-test-mobile.png\` - Mobile view
- \`authenticated-sorting-test-desktop.png\` - Desktop view
- \`authenticated-sorting-test-final.png\` - Final state

## Conclusion

${report.overallStatus ? 
'The sorting functionality appears to be working correctly with proper authentication. The icon-based sorting buttons are present and functional, and the UI appears clean without excessive duplicate elements.' :
'There are issues that need to be addressed. Please review the detailed test results and screenshots to identify and fix the specific problems.'}

## Recommendations

${report.overallStatus ? 
'✅ **All functionality is working correctly!** 

The duplicate "sort by" elements have been successfully removed while maintaining all sorting functionality. The icon-based sorting buttons work correctly, sort state is maintained, and the UI is clean and responsive.

No further action is needed.' :
`❌ **Issues found that need attention:**

${!report.summary.duplicateElementsRemoved ? '- Some duplicate sort elements may still be present\n' : ''}
${!report.summary.iconBasedSortingWorks ? '- Icon-based sorting buttons are not working correctly\n' : ''}
${!report.summary.sortStateMaintained ? '- Sort state persistence needs to be fixed\n' : ''}
${!report.summary.activeSortVisualIndication ? '- Visual feedback for active sort is missing\n' : ''}
${!report.summary.responsiveBehavior ? '- Responsive behavior needs improvement\n' : ''}
${!report.summary.consoleErrors ? '- Console errors need to be resolved\n' : ''}
${!report.summary.uiClean ? '- UI cleanliness issues need to be addressed\n' : ''}

Please review the detailed logs and screenshots to identify and fix the specific issues.`}
`;
}

// Run the test
async function runTest() {
  await testAuthenticatedSortingFunctionality();
  const report = await generateTestReport();
  
  console.log('\n🎉 Authenticated sorting test completed!');
  console.log(`Overall Status: ${report.overallStatus ? '✅ PASSED' : '❌ FAILED'}`);
  
  return report;
}

// Export for use in other scripts
module.exports = { runTest, TEST_RESULTS };

// Run if called directly
if (require.main === module) {
  runTest().catch(console.error);
}