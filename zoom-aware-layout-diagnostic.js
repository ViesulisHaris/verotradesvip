const { chromium } = require('playwright');

(async () => {
  console.log('🔍 [DEBUG] Starting ZoomAwareLayout Diagnostic Test');
  
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
  const renderCounts = {
    'ZoomAwareLayout': 0,
    'Sidebar': 0,
    'DesktopSidebar': 0
  };
  
  page.on('console', msg => {
    const text = msg.text();
    
    // Count ZoomAwareLayout renders
    if (text.includes('NAVIGATION DEBUG: ZoomAwareLayout rendered')) {
      renderCounts['ZoomAwareLayout']++;
      console.log(`[RENDER #${renderCounts['ZoomAwareLayout']}] ${text}`);
    }
    // Count Sidebar renders
    else if (text.includes('NAVIGATION DEBUG: Sidebar rendered')) {
      renderCounts['Sidebar']++;
      console.log(`[RENDER #${renderCounts['Sidebar']}] ${text}`);
    }
    // Count DesktopSidebar renders
    else if (text.includes('NAVIGATION DEBUG: DesktopSidebar rendered')) {
      renderCounts['DesktopSidebar']++;
      console.log(`[RENDER #${renderCounts['DesktopSidebar']}] ${text}`);
    }
    // Log other important messages
    else if (text.includes('ERROR') || text.includes('WARNING') || text.includes('zoom-aware')) {
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
    
    // Log initial render counts
    console.log('📊 Initial render counts on login page:');
    console.log(`   ZoomAwareLayout: ${renderCounts['ZoomAwareLayout']}`);
    console.log(`   Sidebar: ${renderCounts['Sidebar']}`);
    console.log(`   DesktopSidebar: ${renderCounts['DesktopSidebar']}`);
    
    // Fill in login credentials
    console.log('🔑 Logging in...');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    
    // Click login button
    await page.click('button[type="submit"]');
    
    // Wait for navigation to complete with shorter timeout
    try {
      await page.waitForURL('http://localhost:3000/dashboard', { timeout: 5000 });
      console.log('✅ Login successful, redirected to dashboard');
    } catch (error) {
      console.log('❌ Login navigation timed out, continuing with test...');
    }
    
    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle');
    
    // Log render counts after login
    console.log('📊 Render counts after login:');
    console.log(`   ZoomAwareLayout: ${renderCounts['ZoomAwareLayout']}`);
    console.log(`   Sidebar: ${renderCounts['Sidebar']}`);
    console.log(`   DesktopSidebar: ${renderCounts['DesktopSidebar']}`);
    
    // Check if desktop sidebar is visible
    const sidebarVisible = await page.isVisible('nav.w-64');
    console.log(`📱 Desktop sidebar visible: ${sidebarVisible}`);
    
    // List of menu items to test
    const menuItems = [
      { name: 'Dashboard', selector: 'a[href="/dashboard"]' },
      { name: 'Log Trade', selector: 'a[href="/log-trade"]' },
      { name: 'Strategies', selector: 'a[href="/strategies"]' },
      { name: 'Trades', selector: 'a[href="/trades"]' },
      { name: 'Calendar', selector: 'a[href="/calendar"]' },
      { name: 'Confluence', selector: 'a[href="/confluence"]' }
    ];
    
    // Test rapid navigation between menu items
    console.log('🔄 Testing rapid navigation between menu items...');
    const navigationCycles = 5;
    const renderCountsBefore = { ...renderCounts };
    
    for (let cycle = 1; cycle <= navigationCycles; cycle++) {
      console.log(`\n🔄 Navigation Cycle ${cycle}/${navigationCycles}`);
      
      for (const item of menuItems) {
        try {
          console.log(`  Navigating to ${item.name}...`);
          
          // Check if element is clickable
          const isClickable = await page.isVisible(item.selector) && 
                              await page.isEnabled(item.selector);
          
          if (!isClickable) {
            console.log(`    ❌ ${item.name} not clickable`);
            continue;
          }
          
          // Click the menu item
          await page.click(item.selector);
          
          // Wait a short time for navigation
          await page.waitForTimeout(1000);
          
          // Log current render counts
          console.log(`    Render counts after ${item.name}:`);
          console.log(`      ZoomAwareLayout: ${renderCounts['ZoomAwareLayout']}`);
          console.log(`      Sidebar: ${renderCounts['Sidebar']}`);
          console.log(`      DesktopSidebar: ${renderCounts['DesktopSidebar']}`);
          
        } catch (error) {
          console.log(`    ❌ Error navigating to ${item.name}: ${error.message}`);
        }
      }
    }
    
    // Calculate render increases
    const renderIncreases = {
      'ZoomAwareLayout': renderCounts['ZoomAwareLayout'] - renderCountsBefore['ZoomAwareLayout'],
      'Sidebar': renderCounts['Sidebar'] - renderCountsBefore['Sidebar'],
      'DesktopSidebar': renderCounts['DesktopSidebar'] - renderCountsBefore['DesktopSidebar']
    };
    
    console.log('\n📊 Render Count Analysis:');
    console.log('=========================');
    console.log(`Total ZoomAwareLayout renders: ${renderCounts['ZoomAwareLayout']}`);
    console.log(`Total Sidebar renders: ${renderCounts['Sidebar']}`);
    console.log(`Total DesktopSidebar renders: ${renderCounts['DesktopSidebar']}`);
    console.log('');
    console.log(`ZoomAwareLayout renders during navigation: ${renderIncreases['ZoomAwareLayout']}`);
    console.log(`Sidebar renders during navigation: ${renderIncreases['Sidebar']}`);
    console.log(`DesktopSidebar renders during navigation: ${renderIncreases['DesktopSidebar']}`);
    
    // Analyze results
    console.log('\n🔍 Analysis:');
    if (renderIncreases['ZoomAwareLayout'] > 20) {
      console.log('❌ CRITICAL: Excessive ZoomAwareLayout re-renders detected');
      console.log('   This is likely causing the freezing issue');
    } else if (renderIncreases['ZoomAwareLayout'] > 10) {
      console.log('⚠️  WARNING: High number of ZoomAwareLayout re-renders');
      console.log('   This could contribute to performance issues');
    } else {
      console.log('✅ ZoomAwareLayout render count is within normal range');
    }
    
    if (renderIncreases['Sidebar'] > navigationCycles * 2) {
      console.log('❌ CRITICAL: Excessive Sidebar re-renders detected');
    } else if (renderIncreases['Sidebar'] > navigationCycles) {
      console.log('⚠️  WARNING: High number of Sidebar re-renders');
    } else {
      console.log('✅ Sidebar render count is within normal range');
    }
    
    if (renderIncreases['DesktopSidebar'] > navigationCycles * 2) {
      console.log('❌ CRITICAL: Excessive DesktopSidebar re-renders detected');
    } else if (renderIncreases['DesktopSidebar'] > navigationCycles) {
      console.log('⚠️  WARNING: High number of DesktopSidebar re-renders');
    } else {
      console.log('✅ DesktopSidebar render count is within normal range');
    }
    
    // Test for freezing after navigation
    console.log('\n🧊 Testing for freeze after navigation...');
    try {
      const freezeTestStart = Date.now();
      await page.click('body', { timeout: 3000 });
      const freezeTestTime = Date.now() - freezeTestStart;
      
      if (freezeTestTime > 1000) {
        console.log(`❌ Page appears to be frozen: ${freezeTestTime}ms response time`);
      } else {
        console.log(`✅ Page is responsive: ${freezeTestTime}ms response time`);
      }
    } catch (error) {
      console.log(`❌ Page is completely frozen: ${error.message}`);
    }
    
  } catch (error) {
    console.error(`❌ Test failed: ${error.message}`);
  } finally {
    await browser.close();
    console.log('🔍 [DEBUG] ZoomAwareLayout Diagnostic Test Complete');
  }
})();