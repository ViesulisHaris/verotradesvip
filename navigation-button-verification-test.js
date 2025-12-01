/**
 * Navigation Button Functionality Verification Test
 * This test verifies that all button functionality issues have been resolved
 * after fixing the navigation safety system and updating the dashboard to use ModernLayout
 */

const { chromium } = require('playwright');
const path = require('path');

async function testNavigationButtonFunctionality() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('🔍 Starting Navigation Button Functionality Verification Test...\n');

  try {
    // Navigate to the test page
    await page.goto('http://localhost:3000/test-navigation-buttons');
    await page.waitForLoadState('networkidle');
    
    console.log('✅ Navigation test page loaded successfully');

    // Wait for test results
    await page.waitForSelector('#test-results', { state: 'visible' });
    
    // Get test results
    const results = await page.evaluate(() => {
      const resultsElement = document.getElementById('test-results');
      if (!resultsElement) return null;
      
      return JSON.parse(resultsElement.textContent || '{}');
    });

    if (!results) {
      console.log('❌ Could not retrieve test results');
      return false;
    }

    console.log('\n📊 Test Results Summary:');
    console.log('='.repeat(50));
    
    // Check overall status
    const overallStatus = results.overallStatus;
    console.log(`Overall Status: ${overallStatus === 'passed' ? '✅ PASSED' : '❌ FAILED'}`);
    
    // Check individual tests
    const tests = results.tests || {};
    let allPassed = true;
    
    for (const [testName, testResult] of Object.entries(tests)) {
      const status = testResult.status === 'passed' ? '✅' : '❌';
      console.log(`${status} ${testName}: ${testResult.message}`);
      
      if (testResult.status !== 'passed') {
        allPassed = false;
        console.log(`   Details: ${testResult.details || 'No details available'}`);
      }
    }

    // Check for console errors
    const consoleErrors = results.consoleErrors || [];
    if (consoleErrors.length > 0) {
      console.log('\n⚠️ Console Errors Found:');
      consoleErrors.forEach(error => {
        console.log(`   ${error}`);
      });
      allPassed = false;
    } else {
      console.log('\n✅ No console errors detected');
    }

    // Check for network issues
    const networkIssues = results.networkIssues || [];
    if (networkIssues.length > 0) {
      console.log('\n⚠️ Network Issues Found:');
      networkIssues.forEach(issue => {
        console.log(`   ${issue}`);
      });
      allPassed = false;
    } else {
      console.log('\n✅ No network issues detected');
    }

    // Test navigation to dashboard
    console.log('\n🧪 Testing Dashboard Navigation...');
    await page.goto('http://localhost:3000/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Check if dashboard loaded correctly
    const dashboardLoaded = await page.isVisible('h1:has-text("Trading Dashboard")');
    if (dashboardLoaded) {
      console.log('✅ Dashboard loaded successfully');
    } else {
      console.log('❌ Dashboard failed to load');
      allPassed = false;
    }

    // Test mobile menu button (if visible)
    console.log('\n📱 Testing Mobile Menu Button...');
    const mobileMenuButton = await page.locator('button[aria-label="Toggle mobile menu"]').first();
    if (await mobileMenuButton.isVisible()) {
      console.log('📱 Mobile menu button found, testing functionality...');
      
      // Click to open
      await mobileMenuButton.click();
      await page.waitForTimeout(500);
      
      const mobileMenuOpen = await page.locator('.mobile-menu').first().isVisible();
      if (mobileMenuOpen) {
        console.log('✅ Mobile menu opens correctly');
        
        // Click to close
        await mobileMenuButton.click();
        await page.waitForTimeout(500);
        
        const mobileMenuClosed = await page.locator('.mobile-menu').first().isVisible();
        if (!mobileMenuClosed) {
          console.log('✅ Mobile menu closes correctly');
        } else {
          console.log('❌ Mobile menu failed to close');
          allPassed = false;
        }
      } else {
        console.log('❌ Mobile menu failed to open');
        allPassed = false;
      }
    } else {
      console.log('ℹ️ Mobile menu button not visible (desktop view)');
    }

    // Test desktop sidebar toggle (if visible)
    console.log('\n🖥️ Testing Desktop Sidebar Toggle...');
    const sidebarToggle = await page.locator('button[aria-label="Toggle sidebar"]').first();
    if (await sidebarToggle.isVisible()) {
      console.log('🖥️ Sidebar toggle found, testing functionality...');
      
      // Get initial state
      const sidebarBefore = await page.locator('.sidebar').first().isVisible();
      
      // Click to toggle
      await sidebarToggle.click();
      await page.waitForTimeout(500);
      
      const sidebarAfter = await page.locator('.sidebar').first().isVisible();
      
      if (sidebarBefore !== sidebarAfter) {
        console.log('✅ Sidebar toggle works correctly');
      } else {
        console.log('❌ Sidebar toggle failed to change state');
        allPassed = false;
      }
    } else {
      console.log('ℹ️ Sidebar toggle not visible');
    }

    // Test navigation links
    console.log('\n🔗 Testing Navigation Links...');
    const navLinks = await page.locator('nav a').all();
    
    if (navLinks.length > 0) {
      console.log(`Found ${navLinks.length} navigation links, testing first few...`);
      
      for (let i = 0; i < Math.min(3, navLinks.length); i++) {
        const link = navLinks[i];
        const href = await link.getAttribute('href');
        
        if (href && !href.startsWith('http')) {
          // Test internal link
          try {
            await Promise.all([
              page.waitForNavigation({ timeout: 5000 }),
              link.click()
            ]);
            
            // Check if navigation was successful
            const currentUrl = page.url();
            if (currentUrl.includes(href) || currentUrl.endsWith(href)) {
              console.log(`✅ Navigation link "${href}" works correctly`);
            } else {
              console.log(`❌ Navigation link "${href}" failed to navigate correctly`);
              allPassed = false;
            }
            
            // Go back to dashboard
            await page.goto('http://localhost:3000/dashboard');
            await page.waitForLoadState('networkidle');
          } catch (error) {
            console.log(`❌ Navigation link "${href}" caused an error: ${error.message}`);
            allPassed = false;
          }
        }
      }
    } else {
      console.log('ℹ️ No navigation links found');
    }

    console.log('\n' + '='.repeat(50));
    console.log(`Final Result: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
    console.log('='.repeat(50));

    return allPassed;

  } catch (error) {
    console.error('❌ Test failed with error:', error);
    return false;
  } finally {
    await browser.close();
  }
}

// Run the test
testNavigationButtonFunctionality()
  .then(success => {
    console.log(`\n🎯 Navigation Button Functionality Test ${success ? 'PASSED' : 'FAILED'}`);
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('💥 Test execution failed:', error);
    process.exit(1);
  });