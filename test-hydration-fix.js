const puppeteer = require('puppeteer');

async function testHydrationFix() {
  console.log('🧪 Starting hydration fix test...');
  
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  
  // Enable console logging
  page.on('console', (msg) => {
    console.log('🔍 Browser Console:', msg.type(), msg.text());
  });
  
  // Enable error logging
  page.on('pageerror', (error) => {
    console.error('🚨 Page Error:', error.message);
  });
  
  // Enable request/response logging for webpack issues
  page.on('requestfailed', (request) => {
    console.error('🚨 Request Failed:', request.url(), request.failure().errorText);
  });
  
  try {
    console.log('🌐 Navigating to test page...');
    await page.goto('http://localhost:3000/test-hydration-debug', { 
      waitUntil: 'networkidle2',
      timeout: 10000 
    });
    
    // Wait for page to load
    await page.waitForTimeout(3000);
    
    // Check for hydration errors
    const hydrationErrors = await page.evaluate(() => {
      const errors = [];
      // Check for React hydration error indicators
      const errorElements = document.querySelectorAll('[data-react-hydration-error]');
      errors.push(...Array.from(errorElements).map(el => el.textContent));
      
      // Check for gray screen (no content)
      const body = document.body;
      const hasContent = body && body.innerText.trim().length > 0;
      if (!hasContent) {
        errors.push('Gray screen detected - no content rendered');
      }
      
      return errors;
    });
    
    if (hydrationErrors.length > 0) {
      console.error('❌ Hydration errors detected:', hydrationErrors);
    } else {
      console.log('✅ No hydration errors detected');
    }
    
    // Take screenshot
    const screenshot = await page.screenshot({ 
      path: 'hydration-test-result.png',
      fullPage: true 
    });
    console.log('📸 Screenshot saved: hydration-test-result.png');
    
    // Check webpack module loading
    const webpackStatus = await page.evaluate(() => {
      return {
        hasWindow: typeof window !== 'undefined',
        hasWebpack: typeof window.webpackJsonp !== 'undefined',
        hasReact: typeof window.React !== 'undefined',
        hasNext: typeof window.next !== 'undefined'
      };
    });
    
    console.log('📦 Webpack Status:', webpackStatus);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

testHydrationFix().catch(console.error);