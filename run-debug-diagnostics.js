const { chromium } = require('playwright');

async function runDebugDiagnostics() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    console.log('Navigating to debug strategy loading page...');
    await page.goto('http://localhost:3000/debug-strategy-loading');
    
    // Wait for page to load
    await page.waitForSelector('button', { timeout: 10000 });
    
    console.log('Running diagnostics...');
    await page.click('button:has-text("Run Diagnostics")');
    
    // Wait for diagnostics to complete
    await page.waitForTimeout(10000);
    
    // Capture the results
    const results = await page.evaluate(() => {
      const testResults = [];
      const testElements = document.querySelectorAll('div[class*="bg-gray-800 rounded-lg p-4"]');
      
      testElements.forEach(element => {
        const testName = element.querySelector('h3')?.textContent;
        const statusElement = element.querySelector('span[class*="rounded-full"]');
        const status = statusElement?.textContent;
        const details = element.querySelector('p.text-gray-300')?.textContent;
        const errorElement = element.querySelector('div[class*="bg-red-900"]');
        const error = errorElement?.textContent?.trim();
        
        if (testName && status) {
          testResults.push({
            testName,
            status,
            details,
            error
          });
        }
      });
      
      return testResults;
    });
    
    console.log('\n=== DIAGNOSTIC RESULTS ===');
    results.forEach(result => {
      console.log(`\n${result.testName}:`);
      console.log(`  Status: ${result.status}`);
      if (result.details) console.log(`  Details: ${result.details}`);
      if (result.error) console.log(`  Error: ${result.error}`);
    });
    
    // Check for schema cache issues
    const hasSchemaCacheIssues = results.some(result => 
      result.error && (
        result.error.includes('strategy_rule_compliance') ||
        result.error.includes('SCHEMA CACHE') ||
        result.error.includes('schema cache')
      )
    );
    
    if (hasSchemaCacheIssues) {
      console.log('\n✅ SCHEMA CACHE ISSUES CONFIRMED');
      console.log('The diagnostic confirms schema cache corruption related to strategy_rule_compliance table.');
    } else {
      console.log('\n❌ No schema cache issues detected');
    }
    
    // Take a screenshot for documentation
    await page.screenshot({ path: 'debug-diagnostics-results.png', fullPage: true });
    console.log('\nScreenshot saved as debug-diagnostics-results.png');
    
  } catch (error) {
    console.error('Error running diagnostics:', error);
  } finally {
    await browser.close();
  }
}

runDebugDiagnostics();