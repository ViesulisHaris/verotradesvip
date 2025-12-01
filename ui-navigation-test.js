/**
 * UI/UX Navigation Test Script
 * Tests all sidebar and navigation functionality after fixes
 */

const { chromium } = require('playwright');

async function runNavigationTests() {
  console.log('🧪 Starting UI/UX Navigation Tests...');
  console.log('='.repeat(60));
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500 // Slow down for better observation
  });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  const page = await context.newPage();

  try {
    // Test 1: Application Loading
    console.log('\n📋 Test 1: Application Loading');
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    console.log('✅ Application loaded successfully');

    // Test 2: Login (if needed)
    console.log('\n📋 Test 2: Authentication');
    const currentUrl = page.url();
    if (currentUrl.includes('/login') || currentUrl === 'http://localhost:3000/') {
      console.log('🔐 Login required, attempting login...');
      
      // Fill login form
      await page.fill('input[type="email"]', 'test@example.com');
      await page.fill('input[type="password"]', 'password123');
      await page.click('button[type="submit"]');
      
      // Wait for navigation
      await page.waitForURL('**/dashboard', { timeout: 10000 });
      console.log('✅ Login successful');
    } else {
      console.log('✅ Already authenticated');
    }

    // Test 3: Sidebar Visibility on Desktop
    console.log('\n📋 Test 3: Sidebar Visibility on Desktop');
    await page.waitForTimeout(2000); // Wait for sidebar to stabilize
    
    const sidebar = await page.locator('.verotrade-sidebar, .verotrade-sidebar-overlay').first();
    const isVisible = await sidebar.isVisible();
    console.log(`📊 Sidebar visible: ${isVisible}`);
    
    if (isVisible) {
      const sidebarWidth = await sidebar.evaluate(el => el.offsetWidth);
      console.log(`📏 Sidebar width: ${sidebarWidth}px`);
      console.log('✅ Sidebar is visible on desktop');
    } else {
      console.log('❌ Sidebar is not visible on desktop');
    }

    // Test 4: Desktop Hamburger Menu Button
    console.log('\n📋 Test 4: Desktop Hamburger Menu Button');
    const desktopMenuBtn = await page.locator('.verotrade-desktop-menu-btn').first();
    const desktopMenuVisible = await desktopMenuBtn.isVisible();
    console.log(`🍔 Desktop menu button visible: ${desktopMenuVisible}`);
    
    if (desktopMenuVisible) {
      // Test toggle functionality
      const sidebarBefore = await sidebar.evaluate(el => el.offsetWidth);
      console.log(`📏 Sidebar width before toggle: ${sidebarBefore}px`);
      
      await desktopMenuBtn.click();
      await page.waitForTimeout(500);
      
      const sidebarAfter = await sidebar.evaluate(el => el.offsetWidth);
      console.log(`📏 Sidebar width after toggle: ${sidebarAfter}px`);
      
      if (sidebarBefore !== sidebarAfter) {
        console.log('✅ Desktop menu toggle works correctly');
      } else {
        console.log('❌ Desktop menu toggle not working');
      }
    } else {
      console.log('❌ Desktop menu button not found');
    }

    // Test 5: Navigation Links
    console.log('\n📋 Test 5: Navigation Links');
    const navLinks = await page.locator('.verotrade-nav-item').all();
    console.log(`🔗 Found ${navLinks.length} navigation links`);
    
    for (let i = 0; i < navLinks.length; i++) {
      const link = navLinks[i];
      const linkText = await link.textContent();
      const linkHref = await link.getAttribute('href');
      console.log(`  📍 ${linkText}: ${linkHref}`);
      
      // Test click on first few links
      if (i < 3) {
        await link.click();
        await page.waitForTimeout(1000);
        
        const currentUrl = page.url();
        if (currentUrl.includes(linkHref) || currentUrl.endsWith(linkHref)) {
          console.log(`    ✅ Navigation to ${linkText} successful`);
        } else {
          console.log(`    ❌ Navigation to ${linkText} failed`);
        }
        
        // Go back to dashboard
        await page.goto('http://localhost:3000/dashboard');
        await page.waitForTimeout(1000);
      }
    }

    // Test 6: Top Bar Visibility
    console.log('\n📋 Test 6: Top Bar Visibility');
    const topNav = await page.locator('.verotrade-persistent-top-nav').first();
    const topNavVisible = await topNav.isVisible();
    console.log(`🎯 Top navigation visible: ${topNavVisible}`);
    
    if (topNavVisible) {
      const topNavHeight = await topNav.evaluate(el => el.offsetHeight);
      console.log(`📏 Top navigation height: ${topNavHeight}px`);
      
      // Check if content is not cut off
      const mainContent = await page.locator('.verotrade-main-content').first();
      const mainContentTop = await mainContent.evaluate(el => {
        const style = window.getComputedStyle(el);
        return parseInt(style.paddingTop);
      });
      console.log(`📏 Main content top padding: ${mainContentTop}px`);
      
      if (mainContentTop >= topNavHeight) {
        console.log('✅ Top bar not cutting off content');
      } else {
        console.log('❌ Top bar may be cutting off content');
      }
    } else {
      console.log('❌ Top navigation not visible');
    }

    // Test 7: Mobile Responsiveness
    console.log('\n📋 Test 7: Mobile Responsiveness');
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone size
    await page.waitForTimeout(1000);
    
    const mobileSidebar = await page.locator('.verotrade-sidebar, .verotrade-sidebar-overlay').first();
    const mobileSidebarVisible = await mobileSidebar.isVisible();
    console.log(`📱 Mobile sidebar visible: ${mobileSidebarVisible}`);
    
    const mobileMenuBtn = await page.locator('.verotrade-mobile-menu-btn').first();
    const mobileMenuVisible = await mobileMenuBtn.isVisible();
    console.log(`📱 Mobile menu button visible: ${mobileMenuVisible}`);
    
    if (mobileMenuVisible && !mobileSidebarVisible) {
      // Test mobile menu toggle
      await mobileMenuBtn.click();
      await page.waitForTimeout(500);
      
      const mobileSidebarAfter = await mobileSidebar.isVisible();
      if (mobileSidebarAfter) {
        console.log('✅ Mobile menu toggle works correctly');
      } else {
        console.log('❌ Mobile menu toggle not working');
      }
    }

    // Test 8: Page Navigation Persistence
    console.log('\n📋 Test 8: Page Navigation Persistence');
    await page.setViewportSize({ width: 1280, height: 720 }); // Back to desktop
    await page.waitForTimeout(1000);
    
    // Navigate to different pages and check sidebar persistence
    const testPages = ['/dashboard', '/trades', '/log-trade', '/calendar'];
    
    for (const pagePath of testPages) {
      await page.goto(`http://localhost:3000${pagePath}`);
      await page.waitForTimeout(1000);
      
      const sidebarOnPage = await page.locator('.verotrade-sidebar, .verotrade-sidebar-overlay').first();
      const sidebarVisibleOnPage = await sidebarOnPage.isVisible();
      
      console.log(`  📍 ${pagePath}: Sidebar visible = ${sidebarVisibleOnPage}`);
      
      if (!sidebarVisibleOnPage) {
        console.log(`    ❌ Sidebar disappeared on ${pagePath}`);
      } else {
        console.log(`    ✅ Sidebar persistent on ${pagePath}`);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('🎉 UI/UX Navigation Tests Completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

// Run the tests
runNavigationTests().catch(console.error);