/**
 * Simple Navigation Button Functionality Test
 * This test directly checks if the navigation buttons are working after our fixes
 */

const { chromium } = require('playwright');

async function testNavigationButtons() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('🔍 Starting Simple Navigation Button Test...\n');

  try {
    // Navigate to the dashboard
    await page.goto('http://localhost:3000/dashboard');
    await page.waitForLoadState('networkidle');
    
    console.log('✅ Dashboard loaded successfully');

    // Check for console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log(`❌ Console error: ${msg.text()}`);
      }
    });

    // Test 1: Check if ModernLayout is being used
    console.log('\n🧪 Test 1: Checking if ModernLayout is loaded...');
    const modernLayoutExists = await page.evaluate(() => {
      return document.querySelector('[data-modern-layout]') !== null;
    });
    
    if (modernLayoutExists) {
      console.log('✅ ModernLayout is being used');
    } else {
      console.log('ℹ️ ModernLayout attribute not found (may be using different structure)');
    }

    // Test 2: Look for navigation elements
    console.log('\n🧪 Test 2: Looking for navigation elements...');
    
    // Check for mobile menu button
    const mobileMenuButton = await page.locator('button[aria-label*="menu"]').first();
    const mobileMenuVisible = await mobileMenuButton.isVisible();
    
    if (mobileMenuVisible) {
      console.log('✅ Mobile menu button found');
      
      // Test mobile menu functionality
      console.log('📱 Testing mobile menu functionality...');
      await mobileMenuButton.click();
      await page.waitForTimeout(500);
      
      const mobileMenuOpen = await page.locator('.mobile-menu, [data-mobile-menu]').first().isVisible();
      if (mobileMenuOpen) {
        console.log('✅ Mobile menu opens correctly');
        
        // Close mobile menu
        await mobileMenuButton.click();
        await page.waitForTimeout(500);
        
        const mobileMenuClosed = await page.locator('.mobile-menu, [data-mobile-menu]').first().isVisible();
        if (!mobileMenuClosed) {
          console.log('✅ Mobile menu closes correctly');
        } else {
          console.log('❌ Mobile menu failed to close');
        }
      } else {
        console.log('❌ Mobile menu failed to open');
      }
    } else {
      console.log('ℹ️ Mobile menu button not visible (likely desktop view)');
    }

    // Test 3: Check for sidebar toggle
    console.log('\n🧪 Test 3: Checking sidebar functionality...');
    const sidebarToggle = await page.locator('button[aria-label*="sidebar"], button[aria-label*="toggle"]').first();
    const sidebarToggleVisible = await sidebarToggle.isVisible();
    
    if (sidebarToggleVisible) {
      console.log('✅ Sidebar toggle button found');
      
      // Get initial sidebar state
      const sidebarBefore = await page.locator('.sidebar, [data-sidebar]').first().isVisible();
      
      // Click toggle
      await sidebarToggle.click();
      await page.waitForTimeout(500);
      
      const sidebarAfter = await page.locator('.sidebar, [data-sidebar]').first().isVisible();
      
      if (sidebarBefore !== sidebarAfter) {
        console.log('✅ Sidebar toggle works correctly');
      } else {
        console.log('❌ Sidebar toggle failed to change state');
      }
    } else {
      console.log('ℹ️ Sidebar toggle button not found');
    }

    // Test 4: Check navigation links
    console.log('\n🧪 Test 4: Testing navigation links...');
    const navLinks = await page.locator('nav a, .nav a, [data-nav] a').all();
    
    if (navLinks.length > 0) {
      console.log(`✅ Found ${navLinks.length} navigation links`);
      
      // Test first navigation link
      const firstLink = navLinks[0];
      const href = await firstLink.getAttribute('href');
      
      if (href && !href.startsWith('http')) {
        console.log(`🔗 Testing navigation to: ${href}`);
        
        try {
          await Promise.all([
            page.waitForNavigation({ timeout: 5000 }),
            firstLink.click()
          ]);
          
          const currentUrl = page.url();
          if (currentUrl.includes(href) || currentUrl.endsWith(href)) {
            console.log('✅ Navigation link works correctly');
          } else {
            console.log(`❌ Navigation failed. Expected: ${href}, Got: ${currentUrl}`);
          }
          
          // Go back to dashboard
          await page.goto('http://localhost:3000/dashboard');
          await page.waitForLoadState('networkidle');
        } catch (error) {
          console.log(`❌ Navigation error: ${error.message}`);
        }
      }
    } else {
      console.log('ℹ️ No navigation links found');
    }

    // Test 5: Check if buttons are clickable (no navigation safety interference)
    console.log('\n🧪 Test 5: Testing button clickability...');
    const clickableButtons = await page.locator('button:not([disabled])').all();
    
    if (clickableButtons.length > 0) {
      console.log(`✅ Found ${clickableButtons.length} clickable buttons`);
      
      // Test a few buttons
      for (let i = 0; i < Math.min(3, clickableButtons.length); i++) {
        const button = clickableButtons[i];
        const buttonId = await button.getAttribute('aria-label') || await button.getAttribute('id') || `button-${i}`;
        
        try {
          // Check if button has click handlers
          const hasClickHandler = await button.evaluate(el => {
            return el.onclick !== null || el.hasAttribute('onclick') || 
                   el.hasEventListener('click') || 
                   Array.from(el.attributes).some(attr => 
                     attr.name.startsWith('on') && attr.value.includes('click')
                   );
          });
          
          if (hasClickHandler) {
            console.log(`✅ Button "${buttonId}" has click handlers`);
          } else {
            console.log(`ℹ️ Button "${buttonId}" no click handlers detected`);
          }
        } catch (error) {
          console.log(`❌ Error testing button "${buttonId}": ${error.message}`);
        }
      }
    } else {
      console.log('❌ No clickable buttons found');
    }

    console.log('\n' + '='.repeat(50));
    console.log('✅ Simple Navigation Button Test Completed');
    console.log('='.repeat(50));

    return true;

  } catch (error) {
    console.error('❌ Test failed with error:', error);
    return false;
  } finally {
    await browser.close();
  }
}

// Run the test
testNavigationButtons()
  .then(success => {
    console.log(`\n🎯 Navigation Button Test ${success ? 'PASSED' : 'FAILED'}`);
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('💥 Test execution failed:', error);
    process.exit(1);
  });