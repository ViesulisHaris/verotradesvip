/**
 * Simple Hamburger Menu Diagnostic Test
 * Tests the core issues without complex automation
 */

const { chromium } = require('playwright');

async function runSimpleDiagnostic() {
  console.log('🔍 Starting Simple Hamburger Menu Diagnostic...\n');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 100 
  });
  
  const page = await browser.newContext().then(ctx => ctx.newPage());
  
  try {
    // Test 1: Check if application loads at all
    console.log('📱 Testing application loading...');
    await page.goto('http://localhost:3000/dashboard', { 
      waitUntil: 'networkidle',
      timeout: 10000 
    });
    
    // Wait a bit to see if page loads
    await page.waitForTimeout(3000);
    
    // Check for error messages
    const pageContent = await page.content();
    const hasError = pageContent.includes('error') || pageContent.includes('Error');
    
    if (hasError) {
      console.log('❌ Application has errors - checking console...');
      const consoleErrors = await page.evaluate(() => {
        return window.consoleErrors || [];
      });
      console.log('Console errors:', consoleErrors);
    }
    
    // Test 2: Check if navigation element exists
    console.log('\n🧭 Testing navigation elements...');
    const navExists = await page.locator('nav').count() > 0;
    console.log(`Navigation element exists: ${navExists ? '✅' : '❌'}`);
    
    if (navExists) {
      const navHTML = await page.locator('nav').innerHTML();
      console.log('Navigation HTML length:', navHTML.length);
      
      // Check for hamburger button
      const hasHamburger = navHTML.includes('Menu') || navHTML.includes('hamburger') || navHTML.includes('aria-label="Toggle mobile menu"');
      console.log(`Hamburger menu found in nav: ${hasHamburger ? '✅' : '❌'}`);
    }
    
    // Test 3: Check for TopNavigation component
    console.log('\n🔧 Testing component rendering...');
    const bodyHTML = await page.locator('body').innerHTML();
    const hasTopNavigation = bodyHTML.includes('TopNavigation') || bodyHTML.includes('aria-label="Toggle mobile menu"');
    console.log(`TopNavigation component rendered: ${hasTopNavigation ? '✅' : '❌'}`);
    
    // Test 4: Check for authentication state
    console.log('\n🔐 Testing authentication...');
    const hasLoginForm = await page.locator('input[type="email"]').count() > 0;
    console.log(`Login form present: ${hasLoginForm ? '✅' : '❌'}`);
    
    if (hasLoginForm) {
      console.log('User is not authenticated - this might be the issue');
    }
    
    // Test 5: Check CSS loading
    console.log('\n🎨 Testing CSS...');
    const computedStyles = await page.evaluate(() => {
      const testElement = document.body;
      return {
        backgroundColor: window.getComputedStyle(testElement).backgroundColor,
        color: window.getComputedStyle(testElement).color
      };
    });
    console.log('Body styles:', computedStyles);
    
    // Take screenshot for visual inspection
    await page.screenshot({ 
      path: `hamburger-diagnostic-${Date.now()}.png`,
      fullPage: true 
    });
    console.log('\n📸 Screenshot saved for visual inspection');
    
  } catch (error) {
    console.error('❌ Diagnostic failed:', error.message);
  } finally {
    await browser.close();
  }
}

// Run the diagnostic
runSimpleDiagnostic().catch(console.error);