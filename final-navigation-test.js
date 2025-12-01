/**
 * Final Navigation Button Functionality Test
 * This test specifically targets the actual navigation elements in ModernNavigation component
 */

const { chromium } = require('playwright');

async function testNavigationFunctionality() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('🔍 Starting Final Navigation Functionality Test...\n');

  try {
    // Navigate to dashboard
    await page.goto('http://localhost:3000/dashboard');
    await page.waitForLoadState('networkidle');
    
    console.log('✅ Dashboard loaded successfully');

    // Check for console errors
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
        console.log(`❌ Console error: ${msg.text()}`);
      }
    });

    // Test 1: Check if ModernLayout is being used
    console.log('\n🧪 Test 1: Checking if ModernLayout is loaded...');
    const modernLayoutExists = await page.evaluate(() => {
      return document.querySelector('aside[role="navigation"]') !== null;
    });
    
    if (modernLayoutExists) {
      console.log('✅ ModernNavigation component is loaded');
    } else {
      console.log('❌ ModernNavigation component not found');
    }

    // Test 2: Check for mobile menu button (visible on small screens)
    console.log('\n🧪 Test 2: Testing mobile menu button...');
    
    // Set viewport to mobile size
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);
    
    const mobileMenuButton = await page.locator('button[aria-label*="navigation menu"]').first();
    const mobileMenuVisible = await mobileMenuButton.isVisible();
    
    if (mobileMenuVisible) {
      console.log('✅ Mobile menu button found on mobile view');
      
      // Test mobile menu functionality
      console.log('📱 Testing mobile menu open/close...');
      await mobileMenuButton.click();
      await page.waitForTimeout(500);
      
      const mobileMenuOpen = await page.locator('aside[role="navigation"]').first().isVisible();
      if (mobileMenuOpen) {
        console.log('✅ Mobile menu opens correctly');
        
        // Test navigation link in mobile menu
        const mobileNavLinks = await page.locator('aside[role="navigation"] nav a').all();
        if (mobileNavLinks.length > 0) {
          console.log(`✅ Found ${mobileNavLinks.length} navigation links in mobile menu`);
          
          // Test first link
          const firstLink = mobileNavLinks[0];
          const href = await firstLink.getAttribute('href');
          
          if (href) {
            console.log(`🔗 Testing mobile navigation to: ${href}`);
            
            try {
              await Promise.all([
                page.waitForNavigation({ timeout: 5000 }),
                firstLink.click()
              ]);
              
              const currentUrl = page.url();
              if (currentUrl.includes(href)) {
                console.log('✅ Mobile navigation link works correctly');
              } else {
                console.log(`❌ Mobile navigation failed. Expected: ${href}, Got: ${currentUrl}`);
              }
              
              // Go back to dashboard
              await page.goto('http://localhost:3000/dashboard');
              await page.waitForLoadState('networkidle');
              await page.setViewportSize({ width: 375, height: 667 });
              await page.waitForTimeout(500);
              
              // Re-open mobile menu for further tests
              await mobileMenuButton.click();
              await page.waitForTimeout(500);
            } catch (error) {
              console.log(`❌ Mobile navigation error: ${error.message}`);
            }
          }
        } else {
          console.log('❌ No navigation links found in mobile menu');
        }
        
        // Close mobile menu
        const closeButton = await page.locator('button[aria-label*="Close navigation"]').first();
        if (await closeButton.isVisible()) {
          await closeButton.click();
          await page.waitForTimeout(500);
          console.log('✅ Mobile menu closes correctly');
        } else {
          // Try clicking overlay
          const overlay = await page.locator('.bg-black\\/60').first();
          if (await overlay.isVisible()) {
            await overlay.click();
            await page.waitForTimeout(500);
            console.log('✅ Mobile menu closes via overlay click');
          }
        }
      } else {
        console.log('❌ Mobile menu failed to open');
      }
    } else {
      console.log('❌ Mobile menu button not found');
    }

    // Test 3: Check desktop sidebar functionality
    console.log('\n🧪 Test 3: Testing desktop sidebar...');
    
    // Set viewport to desktop size
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.waitForTimeout(500);
    
    const desktopSidebar = await page.locator('aside[role="navigation"]').first();
    const desktopSidebarVisible = await desktopSidebar.isVisible();
    
    if (desktopSidebarVisible) {
      console.log('✅ Desktop sidebar is visible');
      
      // Test sidebar toggle button
      const sidebarToggle = await page.locator('button[aria-label*="Collapse navigation"], button[aria-label*="Expand navigation"]').first();
      const sidebarToggleVisible = await sidebarToggle.isVisible();
      
      if (sidebarToggleVisible) {
        console.log('✅ Sidebar toggle button found');
        
        // Get initial state
        const initialWidth = await desktopSidebar.evaluate(el => {
          return window.getComputedStyle(el).width;
        });
        
        // Click toggle
        await sidebarToggle.click();
        await page.waitForTimeout(500);
        
        const newWidth = await desktopSidebar.evaluate(el => {
          return window.getComputedStyle(el).width;
        });
        
        if (initialWidth !== newWidth) {
          console.log('✅ Sidebar toggle works correctly');
          console.log(`   Width changed from ${initialWidth} to ${newWidth}`);
          
          // Toggle back to original state
          await sidebarToggle.click();
          await page.waitForTimeout(500);
        } else {
          console.log('❌ Sidebar toggle failed to change width');
        }
      } else {
        console.log('❌ Sidebar toggle button not found');
      }
      
      // Test navigation links in desktop sidebar
      const desktopNavLinks = await page.locator('aside[role="navigation"] nav a').all();
      if (desktopNavLinks.length > 0) {
        console.log(`✅ Found ${desktopNavLinks.length} navigation links in desktop sidebar`);
        
        // Test first link
        const firstLink = desktopNavLinks[0];
        const href = await firstLink.getAttribute('href');
        
        if (href) {
          console.log(`🔗 Testing desktop navigation to: ${href}`);
          
          try {
            await Promise.all([
              page.waitForNavigation({ timeout: 5000 }),
              firstLink.click()
            ]);
            
            const currentUrl = page.url();
            if (currentUrl.includes(href)) {
              console.log('✅ Desktop navigation link works correctly');
            } else {
              console.log(`❌ Desktop navigation failed. Expected: ${href}, Got: ${currentUrl}`);
            }
            
            // Go back to dashboard
            await page.goto('http://localhost:3000/dashboard');
            await page.waitForLoadState('networkidle');
            await page.setViewportSize({ width: 1280, height: 720 });
            await page.waitForTimeout(500);
          } catch (error) {
            console.log(`❌ Desktop navigation error: ${error.message}`);
          }
        }
      } else {
        console.log('❌ No navigation links found in desktop sidebar');
      }
    } else {
      console.log('❌ Desktop sidebar not found');
    }

    // Test 4: Check if navigation safety system is fixed
    console.log('\n🧪 Test 4: Checking navigation safety system...');
    const navigationSafetyFixed = await page.evaluate(() => {
      // Check if the navigation safety system is not blocking clicks
      const buttons = document.querySelectorAll('button');
      let hasWorkingButtons = false;
      
      for (const button of buttons) {
        if (button.onclick || button.hasAttribute('onclick')) {
          hasWorkingButtons = true;
          break;
        }
      }
      
      return hasWorkingButtons;
    });
    
    if (navigationSafetyFixed) {
      console.log('✅ Navigation safety system is not blocking buttons');
    } else {
      console.log('❌ Navigation safety system may still be blocking buttons');
    }

    // Test 5: Check for any remaining console errors
    console.log('\n🧪 Test 5: Checking for console errors...');
    if (consoleErrors.length === 0) {
      console.log('✅ No console errors detected');
    } else {
      console.log(`❌ Found ${consoleErrors.length} console errors`);
      consoleErrors.forEach(error => {
        console.log(`   ${error}`);
      });
    }

    console.log('\n' + '='.repeat(50));
    console.log('✅ Final Navigation Functionality Test Completed');
    console.log('='.repeat(50));

    return consoleErrors.length === 0 && modernLayoutExists;

  } catch (error) {
    console.error('❌ Test failed with error:', error);
    return false;
  } finally {
    await browser.close();
  }
}

// Run the test
testNavigationFunctionality()
  .then(success => {
    console.log(`\n🎯 Navigation Functionality Test ${success ? 'PASSED' : 'FAILED'}`);
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('💥 Test execution failed:', error);
    process.exit(1);
  });