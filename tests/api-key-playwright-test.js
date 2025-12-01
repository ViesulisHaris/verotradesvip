const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

// Create a timestamp for the report
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const reportDir = path.join(__dirname, 'test-reports');
const screenshotDir = path.join(reportDir, 'screenshots');

// Ensure directories exist
if (!fs.existsSync(reportDir)) {
  fs.mkdirSync(reportDir, { recursive: true });
}
if (!fs.existsSync(screenshotDir)) {
  fs.mkdirSync(screenshotDir, { recursive: true });
}

test.describe('API Key Fix Verification', () => {
  test('should verify API key fix is working correctly', async ({ page }) => {
    // Navigate to the test page
    await page.goto('/test-api-key-fix');
    
    // Wait for the page to load completely
    await page.waitForLoadState('networkidle');
    await page.waitForLoadState('domcontentloaded');
    
    // Wait for the test status to be determined (not in "Testing..." state)
    await expect(page.locator('text=Testing...')).not.toBeVisible({ timeout: 10000 });
    
    // Take a screenshot of the test results
    const screenshotPath = path.join(screenshotDir, `api-key-test-${timestamp}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: true });
    
    // Check if the test shows "SUCCESS" in green
    const successIndicator = page.locator('.bg-green-500');
    const successText = page.locator('text=SUCCESS');
    const failedIndicator = page.locator('.bg-red-500');
    const failedText = page.locator('text=FAILED');
    
    // Generate detailed report
    const reportData = {
      timestamp: new Date().toISOString(),
      testUrl: page.url(),
      screenshotPath,
      status: null,
      environmentVariables: {
        supabaseUrl: null,
        supabaseKey: null
      },
      error: null,
      details: {}
    };
    
    try {
      // Check for success
      const isSuccessVisible = await successIndicator.isVisible();
      const isSuccessTextVisible = await successText.isVisible();
      
      if (isSuccessVisible && isSuccessTextVisible) {
        reportData.status = 'SUCCESS';
        reportData.details.message = 'API key fix is working correctly';
        
        // Log success
        console.log('✅ API Key Fix Test: SUCCESS - API key fix is working correctly');
      } else {
        // Check for failure
        const isFailedVisible = await failedIndicator.isVisible();
        const isFailedTextVisible = await failedText.isVisible();
        
        if (isFailedVisible && isFailedTextVisible) {
          reportData.status = 'FAILED';
          
          // Capture error message if present
          const errorElement = page.locator('.bg-red-900 >> text=Error:');
          if (await errorElement.isVisible()) {
            const errorText = await errorElement.textContent();
            reportData.error = errorText.replace('Error:', '').trim();
            reportData.details.errorMessage = reportData.error;
          }
          
          // Capture environment variable status
          const envVarsSection = page.locator('h2:has-text("Environment Variables")');
          if (await envVarsSection.isVisible()) {
            const urlElement = page.locator('text=Supabase URL:');
            const keyElement = page.locator('text=Supabase Key:');
            
            if (await urlElement.isVisible()) {
              const urlText = await urlElement.textContent();
              const urlMatch = urlText.match(/Supabase URL:\s*(.+)/);
              if (urlMatch && urlMatch[1]) {
                reportData.environmentVariables.supabaseUrl = urlMatch[1];
              }
            }
            
            if (await keyElement.isVisible()) {
              const keyText = await keyElement.textContent();
              const keyMatch = keyText.match(/Supabase Key:\s*(.+)/);
              if (keyMatch && keyMatch[1]) {
                reportData.environmentVariables.supabaseKey = keyMatch[1];
              }
            }
          }
          
          reportData.details.message = 'API key fix test failed';
          
          // Log failure with details
          console.log('❌ API Key Fix Test: FAILED');
          console.log(`   Error: ${reportData.error || 'Unknown error'}`);
          console.log(`   Supabase URL: ${reportData.environmentVariables.supabaseUrl || 'Not available'}`);
          console.log(`   Supabase Key: ${reportData.environmentVariables.supabaseKey || 'Not available'}`);
        } else {
          reportData.status = 'UNKNOWN';
          reportData.details.message = 'Test status could not be determined';
          
          // Log unknown status
          console.log('⚠️ API Key Fix Test: UNKNOWN - Test status could not be determined');
        }
      }
    } catch (error) {
      reportData.status = 'ERROR';
      reportData.error = error.message;
      reportData.details.errorMessage = `Test execution error: ${error.message}`;
      
      // Log execution error
      console.log(`💥 API Key Fix Test: ERROR - ${error.message}`);
    }
    
    // Write detailed report to file
    const reportPath = path.join(reportDir, `api-key-test-report-${timestamp}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
    
    // Generate a human-readable summary
    const summaryPath = path.join(reportDir, `api-key-test-summary-${timestamp}.md`);
    const summaryContent = `# API Key Fix Test Report

## Test Information
- **Timestamp:** ${reportData.timestamp}
- **Test URL:** ${reportData.testUrl}
- **Status:** ${reportData.status}
- **Screenshot:** [View Screenshot](${screenshotPath})

## Results
${reportData.status === 'SUCCESS' ? 
  '✅ **SUCCESS** - API key fix is working correctly' : 
  reportData.status === 'FAILED' ? 
  `❌ **FAILED** - API key fix test failed\n\n**Error:** ${reportData.error || 'Unknown error'}` :
  '⚠️ **UNKNOWN** - Test status could not be determined'
}

## Environment Variables
- **Supabase URL:** ${reportData.environmentVariables.supabaseUrl || 'Not available'}
- **Supabase Key:** ${reportData.environmentVariables.supabaseKey || 'Not available'}

## Details
${reportData.details.message || 'No additional details available.'}

---
*Report generated at ${reportData.timestamp}*
`;
    
    fs.writeFileSync(summaryPath, summaryContent);
    
    // Assert based on test results
    if (reportData.status === 'SUCCESS') {
      // Test passed
      expect(true).toBe(true);
    } else if (reportData.status === 'FAILED') {
      // Test failed with details
      test.fail(`API key fix test failed: ${reportData.error || 'Unknown error'}`);
    } else {
      // Test status unknown
      test.fail('Test status could not be determined');
    }
    
    // Log report location
    console.log(`\n📄 Detailed test report saved to: ${reportPath}`);
    console.log(`📄 Human-readable summary saved to: ${summaryPath}`);
    console.log(`📸 Screenshot saved to: ${screenshotPath}`);
  });
});

// After all tests, print summary
test.afterAll(() => {
  console.log('\n🔍 API Key Fix Test Summary:');
  console.log('   - Test navigated to /test-api-key-fix');
  console.log('   - Waited for page to load completely');
  console.log('   - Checked for SUCCESS/FAILED status');
  console.log('   - Captured error messages and environment variables if failed');
  console.log('   - Took screenshot of test results');
  console.log('   - Generated detailed report of findings');
  console.log('\n   Check the test-reports directory for detailed results.');
});