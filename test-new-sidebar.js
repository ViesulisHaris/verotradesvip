const { chromium } = require('playwright');

async function testNewSidebar() {
  console.log('🧪 [SIDEBAR_TEST] Starting new sidebar functionality test...');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Navigate to dashboard
    await page.goto('http://localhost:3000/dashboard');
    await page.waitForLoadState('networkidle');
    
    console.log('📱 [SIDEBAR_TEST] Testing desktop sidebar functionality...');
    
    // Test 1: Check if toggle button is present and minimal
    const toggleButton = await page.locator('button[aria-label="Toggle menu"]').first();
    const isVisible = await toggleButton.isVisible();
    const boundingBox = await toggleButton.boundingBox();
    
    console.log('🔍 [SIDEBAR_TEST] Toggle button analysis:', {
      isVisible,
      size: boundingBox ? { width: boundingBox.width, height: boundingBox.height } : null,
      position: boundingBox ? { x: boundingBox.x, y: boundingBox.y } : null,
      isMinimal: boundingBox ? (boundingBox.width < 60 && boundingBox.height < 60) : false
    });
    
    // Test 2: Click toggle button to open sidebar
    await toggleButton.click();
    await page.waitForTimeout(500); // Wait for animation
    
    // Check if sidebar is open
    const sidebar = await page.locator('aside').first();
    const sidebarVisible = await sidebar.isVisible();
    const sidebarBoundingBox = await sidebar.boundingBox();
    
    console.log('🔍 [SIDEBAR_TEST] Sidebar open analysis:', {
      isOpen: sidebarVisible,
      isOverlay: sidebarBoundingBox ? (sidebarBoundingBox.x === 0) : false,
      width: sidebarBoundingBox ? sidebarBoundingBox.width : null,
      hasGlassMorphism: await sidebar.evaluate(el => {
        const styles = window.getComputedStyle(el);
        return styles.backdropFilter && styles.backdropFilter.includes('blur');
      })
    });
    
    // Test 3: Check menu items
    const menuItems = await page.locator('nav a').all();
    console.log('🔍 [SIDEBAR_TEST] Menu items analysis:', {
      count: menuItems.length,
      items: await Promise.all(menuItems.map(async (item, index) => {
        const text = await item.textContent();
        const isVisible = await item.isVisible();
        return { index, text: text?.trim(), isVisible };
      }))
    });
    
    // Test 4: Click outside to close
    await page.click('body', { position: { x: 400, y: 300 } });
    await page.waitForTimeout(500);
    
    const sidebarClosed = await sidebar.isVisible();
    console.log('🔍 [SIDEBAR_TEST] Click outside to close:', {
      successfullyClosed: !sidebarClosed
    });
    
    // Test 5: Mobile responsiveness
    console.log('📱 [SIDEBAR_TEST] Testing mobile responsiveness...');
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE size
    
    const mobileToggleVisible = await toggleButton.isVisible();
    await toggleButton.click();
    await page.waitForTimeout(500);
    
    const mobileSidebar = await page.locator('aside').first();
    const mobileSidebarVisible = await mobileSidebar.isVisible();
    const mobileSidebarBoundingBox = await mobileSidebar.boundingBox();
    
    console.log('📱 [SIDEBAR_TEST] Mobile sidebar analysis:', {
      toggleVisible: mobileToggleVisible,
      sidebarOpen: mobileSidebarVisible,
      isFullWidth: mobileSidebarBoundingBox ? (mobileSidebarBoundingBox.width >= 300) : false,
      hasBackdrop: await page.locator('.sidebar-backdrop').isVisible()
    });
    
    // Test 6: Escape key functionality
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
    const escapeClosed = await mobileSidebar.isVisible();
    
    console.log('⌨️ [SIDEBAR_TEST] Escape key test:', {
      successfullyClosed: !escapeClosed
    });
    
    // Test 7: Navigation functionality
    await toggleButton.click();
    await page.waitForTimeout(500);
    
    const strategiesLink = await page.locator('a[href="/strategies"]').first();
    await strategiesLink.click();
    await page.waitForTimeout(1000);
    
    const currentUrl = page.url();
    console.log('🧭 [SIDEBAR_TEST] Navigation test:', {
      navigatedToStrategies: currentUrl.includes('/strategies'),
      sidebarClosedAfterNavigation: !(await mobileSidebar.isVisible())
    });
    
    console.log('✅ [SIDEBAR_TEST] New sidebar test completed successfully!');
    
    // Take screenshots for documentation
    await page.screenshot({ path: 'new-sidebar-desktop-test.png', fullPage: true });
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('http://localhost:3000/dashboard');
    await page.waitForLoadState('networkidle');
    await toggleButton.click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'new-sidebar-mobile-test.png', fullPage: true });
    
    console.log('📸 [SIDEBAR_TEST] Screenshots saved for documentation');
    
  } catch (error) {
    console.error('❌ [SIDEBAR_TEST] Test failed:', error);
  } finally {
    await context.close();
    await browser.close();
  }
}

testNewSidebar().catch(console.error);