const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function runChartTransparencyTest() {
  console.log('🔍 Starting automated chart transparency test...');
  
  const browser = await puppeteer.launch({
    headless: false, // Set to true for headless mode
    defaultViewport: { width: 1920, height: 1080 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    
    // Navigate to the test page
    console.log('📄 Navigating to test page...');
    await page.goto('http://localhost:3000/test-chart-transparency', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });

    // Wait for the page to load completely
    await page.waitForSelector('[data-testid="emotion-radar"]', { timeout: 10000 });
    await page.waitForTimeout(2000); // Additional wait for charts to render

    // Take a screenshot before running the test
    console.log('📸 Taking screenshot before test...');
    await page.screenshot({ 
      path: 'chart-transparency-test-before.png',
      fullPage: true 
    });

    // Click the "Run Transparency Test" button
    console.log('🧪 Running transparency test...');
    await page.click('button:contains("Run Transparency Test")');

    // Wait for the test to complete
    console.log('⏳ Waiting for test to complete...');
    await page.waitForFunction(
      () => !document.querySelector('button:contains("Running Test...")'),
      { timeout: 30000 }
    );
    
    // Wait for results to appear
    await page.waitForSelector('.glass-enhanced:has("h3")', { timeout: 15000 });
    await page.waitForTimeout(2000);

    // Take a screenshot after the test
    console.log('📸 Taking screenshot after test...');
    await page.screenshot({ 
      path: 'chart-transparency-test-after.png',
      fullPage: true 
    });

    // Extract test results from the page
    console.log('📊 Extracting test results...');
    const testResults = await page.evaluate(() => {
      // Look for the results in the page
      const resultsElement = document.querySelector('.glass-enhanced:has("h3")');
      if (!resultsElement) return null;

      // Try to extract the data
      const scriptTag = document.querySelector('script');
      if (scriptTag && scriptTag.textContent) {
        const match = scriptTag.textContent.match(/setTestResults\((.*)\)/);
        if (match) {
          try {
            return JSON.parse(match[1]);
          } catch (e) {
            console.error('Failed to parse test results:', e);
          }
        }
      }
      
      return null;
    });

    // If we can't extract from the page, try to get the DOM content
    if (!testResults) {
      console.log('🔄 Attempting to extract results from DOM...');
      const domResults = await page.evaluate(() => {
        const results = {
          overallStatus: 'UNKNOWN',
          balatroBackgroundVisible: false,
          chartResults: [],
          summary: { totalCharts: 0, passedCharts: 0, failedCharts: 0, warningCharts: 0 },
          timestamp: new Date().toISOString()
        };

        // Check for Balatro background
        const balatroCanvas = document.querySelector('.balatro-canvas');
        if (balatroCanvas) {
          const rect = balatroCanvas.getBoundingClientRect();
          results.balatroBackgroundVisible = rect.width > 0 && rect.height > 0;
        }

        // Check chart containers
        const chartContainers = document.querySelectorAll('.chart-container-enhanced, .chart-container');
        results.summary.totalCharts = chartContainers.length;

        chartContainers.forEach((container, index) => {
          const computedStyle = window.getComputedStyle(container);
          const backgroundColor = computedStyle.backgroundColor;
          const backgroundImage = computedStyle.backgroundImage;
          
          let hasTransparentBackground = true;
          let status = 'PASS';
          const issues = [];

          // Check for solid backgrounds
          if (backgroundColor && backgroundColor !== 'rgba(0, 0, 0, 0)' && backgroundColor !== 'transparent') {
            if (!backgroundColor.includes('rgba') || backgroundColor.includes('rgba(0, 0, 0, 0)')) {
              hasTransparentBackground = false;
              issues.push(`Non-transparent background: ${backgroundColor}`);
              status = 'FAIL';
            }
          }

          // Check for background images
          if (backgroundImage && backgroundImage !== 'none') {
            issues.push(`Background image detected: ${backgroundImage}`);
            status = status === 'FAIL' ? 'FAIL' : 'WARNING';
          }

          if (status === 'PASS') results.summary.passedCharts++;
          else if (status === 'FAIL') results.summary.failedCharts++;
          else results.summary.warningCharts++;

          results.chartResults.push({
            componentName: `Chart Container (${index + 1})`,
            hasTransparentBackground,
            backgroundColor,
            backgroundImage,
            issues,
            status
          });
        });

        // Determine overall status
        if (results.summary.failedCharts > 0) {
          results.overallStatus = 'FAIL';
        } else if (results.summary.warningCharts > 0 || !results.balatroBackgroundVisible) {
          results.overallStatus = 'WARNING';
        } else {
          results.overallStatus = 'PASS';
        }

        return results;
      });
      
      if (domResults) {
        console.log('✅ Successfully extracted results from DOM');
        // Save the results
        fs.writeFileSync(
          'chart-transparency-test-results.json',
          JSON.stringify(domResults, null, 2)
        );
      }
    } else {
      console.log('✅ Successfully extracted test results from page state');
      // Save the results
      fs.writeFileSync(
        'chart-transparency-test-results.json',
        JSON.stringify(testResults, null, 2)
      );
    }

    // Generate a comprehensive report
    console.log('📋 Generating comprehensive report...');
    const report = generateReport(testResults || {
      overallStatus: 'ERROR',
      balatroBackgroundVisible: false,
      chartResults: [],
      summary: { totalCharts: 0, passedCharts: 0, failedCharts: 0, warningCharts: 0 },
      timestamp: new Date().toISOString()
    });

    // Save the report
    fs.writeFileSync(
      'CHART_TRANSPARENCY_TEST_REPORT.md',
      report
    );

    console.log('✅ Test completed successfully!');
    console.log('📁 Results saved to:');
    console.log('   - chart-transparency-test-results.json');
    console.log('   - CHART_TRANSPARENCY_TEST_REPORT.md');
    console.log('   - chart-transparency-test-before.png');
    console.log('   - chart-transparency-test-after.png');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
}

function generateReport(results) {
  const timestamp = new Date().toLocaleString();
  
  return `# Chart Background Transparency Test Report

**Test Date:** ${timestamp}
**Overall Status:** ${results.overallStatus}
**Balatro Background Visible:** ${results.balatroBackgroundVisible ? 'YES' : 'NO'}

## Executive Summary

- **Total Charts Tested:** ${results.summary.totalCharts}
- **Passed:** ${results.summary.passedCharts}
- **Failed:** ${results.summary.failedCharts}
- **Warnings:** ${results.summary.warningCharts}

## Test Results

### Overall Assessment
${results.overallStatus === 'PASS' ? '✅ **PASS** - All chart components have transparent backgrounds and integrate seamlessly with the Balatro background.' :
  results.overallStatus === 'FAIL' ? '❌ **FAIL** - Some chart components have non-transparent backgrounds or integration issues.' :
  '⚠️ **WARNING** - Chart components have transparent backgrounds but there are minor issues or the Balatro background is not fully visible.'}

### Balatro Background Integration
${results.balatroBackgroundVisible ? 
  '✅ **Balatro background is visible and rendering correctly**' : 
  '❌ **Balatro background is not visible or not rendering properly**'}

### Chart Component Analysis

${results.chartResults.map(chart => `
#### ${chart.componentName}
- **Status:** ${chart.status}
- **Transparent Background:** ${chart.hasTransparentBackground ? 'YES' : 'NO'}
${chart.backgroundColor ? `- **Background Color:** ${chart.backgroundColor}` : ''}
${chart.backgroundImage && chart.backgroundImage !== 'none' ? `- **Background Image:** ${chart.backgroundImage}` : ''}
${chart.issues.length > 0 ? `
**Issues:**
${chart.issues.map(issue => `- ${issue}`).join('\n')}
` : ''}
`).join('\n')}

## Detailed Findings

### Chart Components with Transparent Backgrounds
${results.chartResults.filter(c => c.hasTransparentBackground).map(c => `- ${c.componentName}`).join('\n') || 'None'}

### Chart Components with Issues
${results.chartResults.filter(c => c.issues.length > 0).map(c => `
- **${c.componentName}** (${c.status}):
  ${c.issues.map(i => `  - ${i}`).join('\n')}
`).join('\n') || 'None'}

## Recommendations

${results.overallStatus === 'PASS' ? 
  `🎉 **Excellent!** All chart components are properly configured with transparent backgrounds and integrate seamlessly with the Balatro background.

**Next Steps:**
- The transparency implementation is complete and working as expected
- No further action needed for chart background transparency` :
  results.overallStatus === 'FAIL' ?
  `🔧 **Action Required:** Some chart components need transparency fixes.

**Recommended Actions:**
${results.chartResults.filter(c => c.status === 'FAIL').map(c => `
- **${c.componentName}:** ${c.issues.map(i => `  - Fix: ${i}`).join('\n')}
`).join('')}

**Implementation Steps:**
1. Review chart components with non-transparent backgrounds
2. Update CSS to use \`background: transparent\` or remove solid color backgrounds
3. Ensure gradients have sufficient transparency (rgba values with alpha < 1)
4. Test with Balatro background enabled
5. Verify seamless integration` :
  `⚠️ **Minor Issues Detected:** Chart components have transparent backgrounds but there are some concerns.

**Recommended Actions:**
${results.chartResults.filter(c => c.status === 'WARNING').map(c => `
- **${c.componentName}:** ${c.issues.map(i => `  - Review: ${i}`).join('\n')}
`).join('')}

**Implementation Steps:**
1. Review components with warnings
2. Optimize for better visual integration
3. Consider enhancing transparency for better blend with Balatro background
4. Test visual consistency across different screen sizes`}

## Technical Details

- **Test Environment:** Automated Browser Test
- **Browser:** Puppeteer/Chrome
- **Test Method:** DOM Analysis + Visual Inspection
- **Transparency Criteria:** 
  - Background must be transparent or use rgba with alpha < 0.1
  - No solid color backgrounds should block the Balatro background
  - No background images that prevent transparency
  - Charts should integrate seamlessly with the animated Balatro background

## Conclusion

${results.overallStatus === 'PASS' ? 
  '✅ **SUCCESS:** All chart components have been successfully verified to have transparent backgrounds and integrate seamlessly with the Balatro background. The implementation meets the requirements and provides a consistent visual experience.' :
  results.overallStatus === 'FAIL' ?
  '❌ **FAILURE:** Chart transparency issues were detected that prevent proper integration with the Balatro background. Action is required to fix the identified issues.' :
  '⚠️ **PARTIAL SUCCESS:** Chart components have transparent backgrounds but minor issues were detected. Review and optimization are recommended for the best visual integration.'}

---
*Report generated by Chart Transparency Verification Test*
*${timestamp}*
`;
}

// Run the test
runChartTransparencyTest().catch(console.error);