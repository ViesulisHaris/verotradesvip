/**
 * Trades Tab Menu Freezing Test
 * 
 * Focused test specifically for the trades tab menu freezing issue
 * This test will help identify if our fixes are working correctly
 */

const { chromium } = require('playwright');
const fs = require('fs');

async function runTradesTabMenuFreezingTest() {
  console.log('🎯 Starting Trades Tab Menu Freezing Test...\n');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  
  const page = await context.newPage();
  
  // Capture console logs for debugging
  const consoleMessages = [];
  page.on('console', msg => {
    consoleMessages.push({
      type: msg.type(),
      text: msg.text(),
      timestamp: new Date().toISOString()
    });
  });
  
  try {
    // Step 1: Login to the application
    console.log('📝 Step 1: Logging in...');
    await page.goto('http://localhost:3000/login');
    await page.waitForLoadState('networkidle');
    
    // Fill login form
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'testpassword123');
    await page.click('button[type="submit"]');
    
    // Wait for dashboard
    await page.waitForURL('http://localhost:3000/dashboard', { timeout: 10000 });
    await page.waitForLoadState('networkidle');
    console.log('✅ Successfully logged in');
    
    // Step 2: Navigate to Trades page
    console.log('📊 Step 2: Navigating to Trades page...');
    
    // Try multiple selectors for the trades link
    const tradesSelectors = [
      'a[href="/trades"]',
      'nav a[href="/trades"]',
      '.nav-item-luxury a[href="/trades"]',
      '[data-testid="trades-link"]',
      'a:has-text("Trades")'
    ];
    
    let tradesLinkFound = false;
    for (const selector of tradesSelectors) {
      try {
        const tradesLink = page.locator(selector).first();
        if (await tradesLink.isVisible({ timeout: 2000 })) {
          console.log(`🔍 Found trades link with selector: ${selector}`);
          await tradesLink.click();
          tradesLinkFound = true;
          break;
        }
      } catch (e) {
        // Continue to next selector
      }
    }
    
    if (!tradesLinkFound) {
      // Direct navigation as fallback
      console.log('🔄 Using direct navigation to trades page...');
      await page.goto('http://localhost:3000/trades');
    }
    
    await page.waitForLoadState('networkidle');
    console.log('✅ Successfully navigated to Trades page');
    
    // Step 3: Check if navigation elements are visible and interactive
    console.log('👆 Step 3: Testing navigation element visibility...');
    
    // Wait a moment for any potential freezing to occur
    await page.waitForTimeout(2000);
    
    // Check all navigation links
    const navigationSelectors = [
      { selector: 'a[href="/dashboard"]', name: 'Dashboard' },
      { selector: 'a[href="/trades"]', name: 'Trades' },
      { selector: 'a[href="/strategies"]', name: 'Strategies' },
      { selector: 'a[href="/calendar"]', name: 'Calendar' },
      { selector: 'a[href="/log-trade"]', name: 'Log Trade' }
    ];
    
    let visibleNavigationItems = 0;
    let interactiveNavigationItems = 0;
    
    for (const nav of navigationSelectors) {
      try {
        const navElement = page.locator(nav.selector).first();
        
        // Check visibility
        const isVisible = await navElement.isVisible({ timeout: 1000 });
        console.log(`   ${nav.name}: ${isVisible ? '✅ Visible' : '❌ Hidden'}`);
        
        if (isVisible) {
          visibleNavigationItems++;
          
          // Check interactivity by trying to hover
          try {
            await navElement.hover({ timeout: 1000 });
            interactiveNavigationItems++;
            console.log(`   ${nav.name}: ✅ Interactive`);
          } catch (hoverError) {
            console.log(`   ${nav.name}: ❌ Not interactive (${hoverError.message})`);
          }
        }
        
        // Check computed styles for potential blocking
        const computedStyles = await navElement.evaluate(el => {
          const styles = window.getComputedStyle(el);
          return {
            pointerEvents: styles.pointerEvents,
            zIndex: styles.zIndex,
            display: styles.display,
            visibility: styles.visibility,
            opacity: styles.opacity
          };
        });
        
        console.log(`   ${nav.name} Styles:`, computedStyles);
        
      } catch (error) {
        console.log(`   ${nav.name}: ❌ Error checking element - ${error.message}`);
      }
    }
    
    console.log(`\n📊 Navigation Summary: ${visibleNavigationItems}/${navigationSelectors.length} visible, ${interactiveNavigationItems}/${navigationSelectors.length} interactive`);
    
    // Step 4: Test navigation away from trades page
    console.log('\n🔄 Step 4: Testing navigation away from Trades page...');
    
    if (visibleNavigationItems > 1) {
      try {
        // Try to navigate to dashboard
        const dashboardLink = page.locator('a[href="/dashboard"]').first();
        if (await dashboardLink.isVisible()) {
          await dashboardLink.click();
          await page.waitForURL('http://localhost:3000/dashboard', { timeout: 5000 });
          await page.waitForLoadState('networkidle');
          console.log('✅ Successfully navigated away from Trades page');
          
          // Test navigation back to trades
          const tradesLinkAgain = page.locator('a[href="/trades"]').first();
          if (await tradesLinkAgain.isVisible()) {
            await tradesLinkAgain.click();
            await page.waitForURL('http://localhost:3000/trades', { timeout: 5000 });
            console.log('✅ Successfully navigated back to Trades page');
          } else {
            console.log('❌ Trades link not visible after returning to dashboard');
          }
        } else {
          console.log('❌ Dashboard link not visible');
        }
      } catch (navError) {
        console.log(`❌ Navigation failed: ${navError.message}`);
      }
    } else {
      console.log('❌ Cannot test navigation - too few visible navigation items');
    }
    
    // Step 5: Check for overlay elements that might be blocking navigation
    console.log('\n🔍 Step 5: Checking for blocking overlays...');
    
    const overlaySelectors = [
      '.modal-backdrop',
      '.modal-overlay',
      '.fixed.inset-0',
      '[style*="position: fixed"]',
      '.zoom-debug-panel'
    ];
    
    for (const selector of overlaySelectors) {
      try {
        const overlays = page.locator(selector);
        const count = await overlays.count();
        if (count > 0) {
          console.log(`   Found ${count} element(s) with selector: ${selector}`);
          
          for (let i = 0; i < count; i++) {
            const overlay = overlays.nth(i);
            const isVisible = await overlay.isVisible();
            const computedStyles = await overlay.evaluate(el => {
              const styles = window.getComputedStyle(el);
              return {
                zIndex: styles.zIndex,
                pointerEvents: styles.pointerEvents,
                position: styles.position
              };
            });
            
            console.log(`     Element ${i + 1}: visible=${isVisible}, z-index=${computedStyles.zIndex}, pointer-events=${computedStyles.pointerEvents}`);
          }
        }
      } catch (error) {
        // Ignore errors for overlay checks
      }
    }
    
    // Step 6: Analyze console logs for navigation safety messages
    console.log('\n📋 Step 6: Analyzing console logs...');
    
    const navigationLogs = consoleMessages.filter(msg => 
      msg.text.includes('Navigation Safety') || 
      msg.text.includes('navigation') ||
      msg.text.includes('cleanup')
    );
    
    if (navigationLogs.length > 0) {
      console.log(`Found ${navigationLogs.length} navigation-related log messages:`);
      navigationLogs.forEach(log => {
        console.log(`   [${log.type.toUpperCase()}] ${log.text}`);
      });
    } else {
      console.log('No navigation-related log messages found');
    }
    
    // Step 7: Final assessment
    console.log('\n🎯 Step 7: Final Assessment');
    
    const isMenuFrozen = visibleNavigationItems < 3 || interactiveNavigationItems < 3;
    
    if (isMenuFrozen) {
      console.log('❌ MENU FREEZING DETECTED');
      console.log(`   - Visible navigation items: ${visibleNavigationItems}/${navigationSelectors.length}`);
      console.log(`   - Interactive navigation items: ${interactiveNavigationItems}/${navigationSelectors.length}`);
      console.log('   - The menu freezing issue is still present');
    } else {
      console.log('✅ NO MENU FREEZING DETECTED');
      console.log(`   - Visible navigation items: ${visibleNavigationItems}/${navigationSelectors.length}`);
      console.log(`   - Interactive navigation items: ${interactiveNavigationItems}/${navigationSelectors.length}`);
      console.log('   - The menu freezing issue appears to be resolved');
    }
    
    // Take final screenshot
    await page.screenshot({ path: 'trades-tab-menu-freezing-test-final.png', fullPage: true });
    console.log('\n📸 Final screenshot saved: trades-tab-menu-freezing-test-final.png');
    
    // Save test results
    const testResults = {
      timestamp: new Date().toISOString(),
      menuFrozen: isMenuFrozen,
      visibleNavigationItems,
      interactiveNavigationItems,
      totalNavigationItems: navigationSelectors.length,
      consoleMessages: navigationLogs,
      success: !isMenuFrozen
    };
    
    fs.writeFileSync('trades-tab-menu-freezing-test-results.json', JSON.stringify(testResults, null, 2));
    console.log('\n💾 Test results saved to: trades-tab-menu-freezing-test-results.json');
    
    return !isMenuFrozen;
    
  } catch (error) {
    console.error('💥 Test execution error:', error);
    return false;
  } finally {
    await browser.close();
  }
}

// Run the test
if (require.main === module) {
  runTradesTabMenuFreezingTest()
    .then(success => {
      console.log(`\n🏁 Test completed. Menu freezing ${success ? 'RESOLVED' : 'STILL PRESENT'}`);
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('💥 Test execution failed:', error);
      process.exit(1);
    });
}

module.exports = { runTradesTabMenuFreezingTest };