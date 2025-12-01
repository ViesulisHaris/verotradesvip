/**
 * Test Dashboard Loading
 * This test checks if the dashboard page is actually loading and rendering content
 */

const { chromium } = require('playwright');

async function testDashboardLoading() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('🔍 Testing Dashboard Loading...\n');

  try {
    // Navigate to dashboard
    await page.goto('http://localhost:3000/dashboard');
    
    // Wait for either content or error
    await Promise.race([
      page.waitForSelector('h1, .heading, [class*="heading"]', { timeout: 10000 }),
      page.waitForSelector('.error, .loading, [class*="error"], [class*="loading"]', { timeout: 10000 }),
      page.waitForTimeout(10000)
    ]);
    
    console.log('✅ Initial page load completed');

    // Wait additional time for full rendering
    await page.waitForTimeout(3000);
    
    // Check page state
    const pageState = await page.evaluate(() => {
      const body = document.body;
      return {
        bodyHTML: body.innerHTML.substring(0, 500),
        bodyClasses: body.className,
        hasContent: body.querySelector('h1, .heading, [class*="heading"], main, .main') !== null,
        hasLoading: body.querySelector('[class*="loading"], .animate-spin, .pulse') !== null,
        hasError: body.querySelector('.error, [class*="error"]') !== null,
        hasNextLoading: body.innerHTML.includes('__next_f') !== null,
        readyState: document.readyState,
        allScriptsLoaded: Array.from(document.querySelectorAll('script')).every(script => 
          script.hasAttribute('src') ? script.complete || script.async : true
        )
      };
    });
    
    console.log('\n📄 Page State Analysis:');
    console.log('='.repeat(50));
    console.log(`- Ready state: ${pageState.readyState}`);
    console.log(`- All scripts loaded: ${pageState.allScriptsLoaded}`);
    console.log(`- Has content: ${pageState.hasContent}`);
    console.log(`- Has loading: ${pageState.hasLoading}`);
    console.log(`- Has error: ${pageState.hasError}`);
    console.log(`- Has Next.js loading: ${pageState.hasNextLoading}`);
    console.log(`- Body classes: ${pageState.bodyClasses}`);
    console.log(`- Body HTML preview: ${pageState.bodyHTML}...`);
    
    // Wait more if still loading
    if (pageState.hasNextLoading || pageState.hasLoading) {
      console.log('\n⏳ Waiting for page to finish loading...');
      await page.waitForTimeout(5000);
      
      // Check state again
      const updatedState = await page.evaluate(() => {
        const body = document.body;
        return {
          hasContent: body.querySelector('h1, .heading, [class*="heading"], main, .main') !== null,
          hasLoading: body.querySelector('[class*="loading"], .animate-spin, .pulse') !== null,
          hasError: body.querySelector('.error, [class*="error"]') !== null,
          hasNextLoading: body.innerHTML.includes('__next_f') !== null,
          bodyHTML: body.innerHTML.substring(0, 1000)
        };
      });
      
      console.log('Updated state after waiting:');
      console.log(`- Has content: ${updatedState.hasContent}`);
      console.log(`- Has loading: ${updatedState.hasLoading}`);
      console.log(`- Has error: ${updatedState.hasError}`);
      console.log(`- Has Next.js loading: ${updatedState.hasNextLoading}`);
      console.log(`- Body HTML: ${updatedState.bodyHTML}...`);
    }
    
    // Take screenshot
    await page.screenshot({ path: 'dashboard-loading-test.png', fullPage: true });
    console.log('\n📸 Screenshot saved as: dashboard-loading-test.png');
    
    // Check if we can find any interactive elements
    const interactiveElements = await page.evaluate(() => {
      const buttons = document.querySelectorAll('button');
      const links = document.querySelectorAll('a');
      const inputs = document.querySelectorAll('input');
      
      return {
        buttons: buttons.length,
        clickableButtons: Array.from(buttons).filter(b => !b.disabled).length,
        links: links.length,
        inputs: inputs.length,
        totalInteractive: buttons.length + links.length + inputs.length
      };
    });
    
    console.log('\n🖱️ Interactive Elements:');
    console.log(`- Total buttons: ${interactiveElements.buttons}`);
    console.log(`- Clickable buttons: ${interactiveElements.clickableButtons}`);
    console.log(`- Links: ${interactiveElements.links}`);
    console.log(`- Inputs: ${interactiveElements.inputs}`);
    console.log(`- Total interactive: ${interactiveElements.totalInteractive}`);
    
    // Check for console errors
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    await page.waitForTimeout(2000);
    
    console.log('\n📋 Console Errors:');
    if (consoleErrors.length === 0) {
      console.log('✅ No console errors');
    } else {
      console.log(`❌ Found ${consoleErrors.length} errors:`);
      consoleErrors.forEach((error, i) => {
        console.log(`  ${i+1}. ${error}`);
      });
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('✅ Dashboard Loading Test Completed');
    console.log('='.repeat(50));
    
    return pageState.hasContent && !pageState.hasError;

  } catch (error) {
    console.error('❌ Test failed with error:', error);
    return false;
  } finally {
    await browser.close();
  }
}

// Run the test
testDashboardLoading()
  .then(success => {
    console.log(`\n🎯 Dashboard Loading Test ${success ? 'PASSED' : 'FAILED'}`);
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('💥 Test execution failed:', error);
    process.exit(1);
  });