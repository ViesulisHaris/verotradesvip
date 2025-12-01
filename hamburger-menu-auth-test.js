const { chromium } = require('playwright');

async function testHamburgerMenuWithAuth() {
  console.log('🍔 Hamburger Menu Test with Authentication Flow');
  console.log('=' .repeat(60));

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  
  // Test mobile viewport
  await context.setDefaultViewport({ width: 375, height: 667 });

  try {
    const page = await context.newPage();
    
    // Test 1: Navigate to login page first
    console.log('1. Navigating to login page...');
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle' });
    
    // Wait for login form to load
    await page.waitForSelector('form', { timeout: 10000 });
    console.log('   ✅ Login page loaded successfully');
    
    // Test 2: Fill and submit login form
    console.log('2. Attempting login...');
    
    // Wait for form inputs to be available
    await page.waitForSelector('input[type="email"]', { timeout: 5000 });
    await page.waitForSelector('input[type="password"]', { timeout: 5000 });
    
    // Fill the form
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'testpassword123');
    
    // Submit the form
    await page.click('button[type="submit"]');
    
    // Wait for redirect to dashboard
    console.log('3. Waiting for redirect to dashboard...');
    try {
      await page.waitForURL('**/dashboard', { timeout: 15000 });
      console.log('   ✅ Successfully redirected to dashboard');
    } catch (error) {
      console.log('   ⚠️  Redirect timeout, checking current URL...');
      const currentUrl = page.url();
      console.log(`   📍 Current URL: ${currentUrl}`);
      
      if (currentUrl.includes('/dashboard')) {
        console.log('   ✅ Already on dashboard');
      } else {
        console.log('   ❌ Failed to reach dashboard');
        // Take screenshot for debugging
        await page.screenshot({ path: 'login-failed-debug.png' });
        console.log('   📸 Screenshot saved as login-failed-debug.png');
        return;
      }
    }
    
    // Wait for page to fully load
    await page.waitForTimeout(3000);
    
    // Test 4: Look for hamburger menu
    console.log('4. Looking for hamburger menu on dashboard...');
    
    // Try different selectors for hamburger menu
    const hamburgerSelectors = [
      'button[aria-label="Toggle mobile menu"]',
      'button[title="Toggle mobile menu"]',
      'button.lg:hidden',
      'nav button',
      'button:has(svg.lucide-menu)'
    ];
    
    let hamburgerFound = false;
    for (const selector of hamburgerSelectors) {
      try {
        const element = page.locator(selector).first();
        if (await element.isVisible({ timeout: 2000 })) {
          console.log(`   ✅ Found hamburger menu with selector: ${selector}`);
          hamburgerFound = true;
          
          // Test 5: Test hamburger click functionality
          console.log('5. Testing hamburger menu click...');
          await element.click();
          await page.waitForTimeout(1000);
          
          // Look for sidebar
          const sidebarSelectors = [
            '.sidebar-overlay',
            'aside',
            '[class*="sidebar"]',
            '.fixed.top-0.left-0'
          ];
          
          let sidebarFound = false;
          for (const sidebarSelector of sidebarSelectors) {
            try {
              const sidebar = page.locator(sidebarSelector).first();
              if (await sidebar.isVisible({ timeout: 2000 })) {
                console.log(`   ✅ Sidebar opened with selector: ${sidebarSelector}`);
                sidebarFound = true;
                
                // Test 6: Test sidebar overlay
                console.log('6. Testing sidebar overlay functionality...');
                
                // Look for overlay backdrop
                const overlaySelectors = [
                  '.sidebar-backdrop',
                  '[class*="backdrop"]',
                  '.fixed.inset-0'
                ];
                
                let overlayFound = false;
                for (const overlaySelector of overlaySelectors) {
                  try {
                    const overlay = page.locator(overlaySelector).first();
                    if (await overlay.isVisible({ timeout: 2000 })) {
                      console.log(`   ✅ Overlay found with selector: ${overlaySelector}`);
                      overlayFound = true;
                      
                      // Test clicking overlay to close
                      await overlay.click();
                      await page.waitForTimeout(1000);
                      
                      // Check if sidebar is hidden
                      if (!(await sidebar.isVisible({ timeout: 2000 }))) {
                        console.log('   ✅ Sidebar closes when overlay is clicked');
                      } else {
                        console.log('   ❌ Sidebar failed to close when overlay clicked');
                      }
                      break;
                    }
                  } catch (error) {
                    // Continue to next selector
                  }
                }
                
                if (!overlayFound) {
                  console.log('   ❌ No overlay backdrop found');
                }
                
                break;
              }
            } catch (error) {
              // Continue to next selector
            }
          }
          
          if (!sidebarFound) {
            console.log('   ❌ No sidebar found after hamburger click');
          }
          
          break;
        }
      } catch (error) {
        // Continue to next selector
      }
    }
    
    if (!hamburgerFound) {
      console.log('   ❌ Hamburger menu not found');
      
      // Debug: Check if we're on the right page and what's actually rendered
      console.log('   🔍 Debug: Analyzing page content...');
      
      // Check page title
      const title = await page.title();
      console.log(`      Page title: ${title}`);
      
      // Check for navigation elements
      const navCount = await page.locator('nav').count();
      const buttonCount = await page.locator('button').count();
      console.log(`      Nav elements: ${navCount}`);
      console.log(`      Button elements: ${buttonCount}`);
      
      // List all buttons with their attributes
      if (buttonCount > 0) {
        console.log('      Buttons found:');
        const buttons = await page.locator('button').all();
        for (let i = 0; i < Math.min(buttons.length, 5); i++) {
          const button = buttons[i];
          const ariaLabel = await button.getAttribute('aria-label');
          const title = await button.getAttribute('title');
          const className = await button.getAttribute('class');
          console.log(`        Button ${i + 1}: aria-label="${ariaLabel}", title="${title}"`);
        }
      }
      
      // Take screenshot for debugging
      await page.screenshot({ path: 'dashboard-debug.png' });
      console.log('   📸 Screenshot saved as dashboard-debug.png');
    }
    
    await page.close();
    
  } catch (error) {
    console.log(`   ❌ Test error: ${error.message}`);
  } finally {
    await browser.close();
  }

  console.log('\n🍔 Hamburger Menu Test Complete');
}

// Run the test
testHamburgerMenuWithAuth().catch(console.error);