const { chromium } = require('playwright');

(async () => {
  console.log('🔍 [DEBUG] Starting Menu Shuffling Freeze Test');
  
  const browser = await chromium.launch({ 
    headless: false,
    args: ['--disable-blink-features=AutomationControlled']
  });
  
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
  });
  
  const page = await context.newPage();
  
  // Track console logs for debugging
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('NAVIGATION DEBUG') || text.includes('ZoomAwareLayout') || 
        text.includes('ERROR') || text.includes('WARNING')) {
      console.log(`[CONSOLE ${msg.type()}] ${text}`);
    }
  });
  
  page.on('pageerror', error => {
    console.log(`[PAGE ERROR] ${error.message}`);
  });
  
  try {
    // Navigate to login page first
    console.log('🔐 Navigating to login page...');
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle' });
    
    // Wait for login form to be ready
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    
    // Fill in login credentials
    console.log('🔑 Logging in...');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    
    // Click login button
    await page.click('button[type="submit"]');
    
    // Wait for navigation to complete
    await page.waitForURL('http://localhost:3000/dashboard', { timeout: 15000 });
    console.log('✅ Login successful, redirected to dashboard');
    
    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle');
    
    // Check if desktop sidebar is visible
    const sidebarVisible = await page.isVisible('nav.w-64');
    console.log(`📱 Desktop sidebar visible: ${sidebarVisible}`);
    
    if (!sidebarVisible) {
      console.log('❌ Desktop sidebar not visible, checking for mobile menu...');
      const mobileMenuVisible = await page.isVisible('button[aria-label="Toggle menu"]');
      console.log(`📱 Mobile menu button visible: ${mobileMenuVisible}`);
    }
    
    // List of menu items to shuffle between
    const menuItems = [
      { name: 'Dashboard', selector: 'a[href="/dashboard"]' },
      { name: 'Log Trade', selector: 'a[href="/log-trade"]' },
      { name: 'Strategies', selector: 'a[href="/strategies"]' },
      { name: 'Trades', selector: 'a[href="/trades"]' },
      { name: 'Calendar', selector: 'a[href="/calendar"]' },
      { name: 'Confluence', selector: 'a[href="/confluence"]' }
    ];
    
    // Verify all menu items are present
    console.log('🔍 Checking for all menu items...');
    for (const item of menuItems) {
      const isVisible = await page.isVisible(item.selector);
      console.log(`  ${item.name}: ${isVisible ? '✅' : '❌'}`);
    }
    
    // Simulate rapid menu shuffling
    console.log('🔄 Simulating rapid menu shuffling...');
    const shuffleCycles = 10;
    let clickFailures = 0;
    let navigationFailures = 0;
    let slowNavigations = 0;
    
    for (let cycle = 1; cycle <= shuffleCycles; cycle++) {
      console.log(`\n🔄 Shuffle Cycle ${cycle}/${shuffleCycles}`);
      
      for (const item of menuItems) {
        try {
          console.log(`  Clicking ${item.name}...`);
          
          // Check if element is clickable
          const isClickable = await page.isVisible(item.selector) && 
                              await page.isEnabled(item.selector);
          
          if (!isClickable) {
            console.log(`    ❌ ${item.name} not clickable`);
            clickFailures++;
            continue;
          }
          
          // Click the menu item
          const clickStart = Date.now();
          await page.click(item.selector);
          const clickTime = Date.now() - clickStart;
          
          console.log(`    ✅ Clicked ${item.name} in ${clickTime}ms`);
          
          // Wait for navigation to complete
          const navStart = Date.now();
          try {
            await page.waitForURL(`http://localhost:3000${item.selector.match(/href="([^"]+)"/)[1]}`, { 
              timeout: 5000 
            });
            const navTime = Date.now() - navStart;
            
            if (navTime > 2000) {
              console.log(`    ⚠️  Slow navigation: ${navTime}ms`);
              slowNavigations++;
            } else {
              console.log(`    ✅ Navigated in ${navTime}ms`);
            }
            
            // Wait for page to stabilize
            await page.waitForLoadState('networkidle', { timeout: 3000 });
            
          } catch (navError) {
            console.log(`    ❌ Navigation failed: ${navError.message}`);
            navigationFailures++;
          }
          
          // Small delay between clicks to simulate user behavior
          await page.waitForTimeout(200);
          
        } catch (error) {
          console.log(`    ❌ Error clicking ${item.name}: ${error.message}`);
          clickFailures++;
        }
      }
    }
    
    // Test for freezing after shuffling
    console.log('\n🧊 Testing for freeze after shuffling...');
    
    // Try to click a menu item after shuffling
    try {
      console.log('  Testing final click on Dashboard...');
      const finalClickStart = Date.now();
      await page.click('a[href="/dashboard"]', { timeout: 5000 });
      const finalClickTime = Date.now() - finalClickStart;
      
      if (finalClickTime > 3000) {
        console.log(`  ❌ Final click took too long: ${finalClickTime}ms - possible freeze`);
      } else {
        console.log(`  ✅ Final click successful in ${finalClickTime}ms`);
      }
    } catch (error) {
      console.log(`  ❌ Final click failed: ${error.message} - likely frozen`);
    }
    
    // Test page responsiveness
    console.log('\n📊 Testing page responsiveness...');
    try {
      // Try to interact with a non-menu element
      const responsiveTestStart = Date.now();
      await page.waitForSelector('body', { timeout: 3000 });
      await page.click('body', { position: { x: 50, y: 50 } });
      const responsiveTestTime = Date.now() - responsiveTestStart;
      
      if (responsiveTestTime > 2000) {
        console.log(`  ❌ Page is unresponsive: ${responsiveTestTime}ms`);
      } else {
        console.log(`  ✅ Page is responsive: ${responsiveTestTime}ms`);
      }
    } catch (error) {
      console.log(`  ❌ Page is frozen: ${error.message}`);
    }
    
    // Summary of results
    console.log('\n📋 Menu Shuffling Freeze Test Summary:');
    console.log('=========================================');
    console.log(`✅ Shuffle cycles completed: ${shuffleCycles}`);
    console.log(`❌ Click failures: ${clickFailures}`);
    console.log(`❌ Navigation failures: ${navigationFailures}`);
    console.log(`⚠️  Slow navigations: ${slowNavigations}`);
    console.log(`🔄 Total menu item clicks attempted: ${shuffleCycles * menuItems.length}`);
    
    if (clickFailures > 0 || navigationFailures > 0) {
      console.log('\n❌ ISSUES DETECTED:');
      console.log('   - Menu buttons are becoming unresponsive during shuffling');
      console.log('   - Navigation is failing after multiple clicks');
      console.log('   - This confirms the reported freezing issue');
    } else if (slowNavigations > 3) {
      console.log('\n⚠️  PERFORMANCE ISSUES DETECTED:');
      console.log('   - Navigation is becoming progressively slower');
      console.log('   - This could lead to freezing with more shuffling');
    } else {
      console.log('\n✅ NO SIGNIFICANT ISSUES DETECTED:');
      console.log('   - Menu buttons remain responsive during shuffling');
      console.log('   - Navigation remains stable');
    }
    
  } catch (error) {
    console.error(`❌ Test failed: ${error.message}`);
  } finally {
    await browser.close();
    console.log('🔍 [DEBUG] Menu Shuffling Freeze Test Complete');
  }
})();