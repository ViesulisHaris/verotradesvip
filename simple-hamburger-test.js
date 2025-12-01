const { chromium } = require('playwright');

async function simpleHamburgerTest() {
  console.log('🍔 Simple Hamburger Menu Test');
  console.log('=' .repeat(40));

  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  // Set mobile viewport
  await page.setViewportSize({ width: 375, height: 667 });

  try {
    // Test 1: Check if application loads at all
    console.log('1. Testing application load...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    
    // Wait a bit for any dynamic content
    await page.waitForTimeout(2000);
    
    // Take screenshot for debugging
    await page.screenshot({ path: 'hamburger-test-debug.png' });
    console.log('   📸 Screenshot saved as hamburger-test-debug.png');
    
    // Check page content
    const pageContent = await page.content();
    console.log(`   📄 Page loaded, content length: ${pageContent.length} characters`);
    
    // Test 2: Look for any navigation elements
    console.log('2. Looking for navigation elements...');
    
    // Check for any nav elements
    const navElements = await page.locator('nav').count();
    console.log(`   🧭 Found ${navElements} nav elements`);
    
    // Check for any buttons
    const buttonElements = await page.locator('button').count();
    console.log(`   🔘 Found ${buttonElements} button elements`);
    
    // Test 3: Look for hamburger menu specifically
    console.log('3. Looking for hamburger menu...');
    
    // Try different selectors for hamburger menu
    const hamburgerSelectors = [
      'button[aria-label="Toggle mobile menu"]',
      'button[title="Toggle mobile menu"]',
      'button.lg:hidden',
      'button[class*="lg:hidden"]',
      'button:has(svg)',
      'nav button',
      '.lg:hidden button'
    ];
    
    let hamburgerFound = false;
    for (const selector of hamburgerSelectors) {
      try {
        const element = await page.locator(selector).first();
        if (await element.isVisible()) {
          console.log(`   ✅ Found hamburger menu with selector: ${selector}`);
          hamburgerFound = true;
          
          // Test clicking it
          console.log('4. Testing hamburger click...');
          await element.click();
          await page.waitForTimeout(1000);
          
          // Look for sidebar
          const sidebar = await page.locator('.sidebar-overlay, aside, [class*="sidebar"]').first();
          if (await sidebar.isVisible()) {
            console.log('   ✅ Hamburger click opened sidebar!');
          } else {
            console.log('   ❌ Hamburger click did not open sidebar');
          }
          
          break;
        }
      } catch (error) {
        // Continue to next selector
      }
    }
    
    if (!hamburgerFound) {
      console.log('   ❌ Hamburger menu not found with any selector');
      
      // Debug: List all buttons found
      console.log('   🔍 Debug: Listing all buttons found...');
      const allButtons = await page.locator('button').all();
      for (let i = 0; i < Math.min(allButtons.length, 5); i++) {
        const button = allButtons[i];
        const ariaLabel = await button.getAttribute('aria-label');
        const title = await button.getAttribute('title');
        const className = await button.getAttribute('class');
        console.log(`      Button ${i + 1}: aria-label="${ariaLabel}", title="${title}", class="${className}"`);
      }
    }
    
    // Test 4: Check for any JavaScript errors
    console.log('5. Checking for JavaScript errors...');
    const errors = [];
    page.on('pageerror', error => {
      errors.push(error.message);
    });
    
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    if (errors.length > 0) {
      console.log(`   ❌ Found ${errors.length} JavaScript errors:`);
      errors.forEach((error, index) => {
        console.log(`      ${index + 1}. ${error.substring(0, 100)}...`);
      });
    } else {
      console.log('   ✅ No JavaScript errors found');
    }
    
  } catch (error) {
    console.log(`   ❌ Test error: ${error.message}`);
  } finally {
    await browser.close();
  }

  console.log('\n🍔 Simple Hamburger Test Complete');
}

// Run the test
simpleHamburgerTest().catch(console.error);