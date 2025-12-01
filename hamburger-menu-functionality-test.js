const { chromium } = require('playwright');

async function testHamburgerMenuFunctionality() {
  console.log('🍔 Starting Hamburger Menu Functionality Test...');
  console.log('=' .repeat(60));

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  
  // Test different mobile screen sizes
  const mobileViewports = [
    { width: 320, height: 568, name: 'iPhone SE' },
    { width: 375, height: 667, name: 'iPhone 8' },
    { width: 414, height: 896, name: 'iPhone 11' },
    { width: 768, height: 1024, name: 'iPad' }
  ];

  let testResults = {
    totalTests: 0,
    passedTests: 0,
    failedTests: 0,
    details: []
  };

  for (const viewport of mobileViewports) {
    console.log(`\n📱 Testing on ${viewport.name} (${viewport.width}x${viewport.height})`);
    console.log('-'.repeat(50));
    
    const page = await context.newPage();
    await page.setViewportSize(viewport);

    try {
      // Test 1: Application Loading
      testResults.totalTests++;
      console.log('1. Testing application loading...');
      await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle' });
      
      // Check if login page loads
      const loginForm = await page.locator('form').first();
      if (await loginForm.isVisible()) {
        console.log('   ✅ Login page loaded successfully');
        testResults.passedTests++;
        testResults.details.push(`✅ ${viewport.name}: Login page loads`);
      } else {
        console.log('   ❌ Login page failed to load');
        testResults.failedTests++;
        testResults.details.push(`❌ ${viewport.name}: Login page failed to load`);
        continue;
      }

      // Test 2: Login and Navigate to Dashboard
      testResults.totalTests++;
      console.log('2. Testing login process...');
      
      // Fill login form (using test credentials)
      await page.fill('input[type="email"]', 'test@example.com');
      await page.fill('input[type="password"]', 'testpassword123');
      await page.click('button[type="submit"]');
      
      // Wait for navigation to dashboard
      await page.waitForURL('**/dashboard', { timeout: 10000 });
      
      const currentUrl = page.url();
      if (currentUrl.includes('/dashboard')) {
        console.log('   ✅ Login successful, redirected to dashboard');
        testResults.passedTests++;
        testResults.details.push(`✅ ${viewport.name}: Login successful`);
      } else {
        console.log('   ❌ Login failed or incorrect redirect');
        testResults.failedTests++;
        testResults.details.push(`❌ ${viewport.name}: Login failed`);
        continue;
      }

      // Test 3: Hamburger Menu Visibility
      testResults.totalTests++;
      console.log('3. Testing hamburger menu visibility...');
      
      // Look for hamburger menu button
      const hamburgerButton = page.locator('button[aria-label="Toggle mobile menu"]');
      
      if (await hamburgerButton.isVisible()) {
        console.log('   ✅ Hamburger menu button is visible');
        testResults.passedTests++;
        testResults.details.push(`✅ ${viewport.name}: Hamburger menu visible`);
      } else {
        console.log('   ❌ Hamburger menu button not found');
        testResults.failedTests++;
        testResults.details.push(`❌ ${viewport.name}: Hamburger menu not visible`);
        continue;
      }

      // Test 4: Hamburger Menu Click Functionality
      testResults.totalTests++;
      console.log('4. Testing hamburger menu click functionality...');
      
      // Click hamburger menu
      await hamburgerButton.click();
      
      // Wait for sidebar to appear
      await page.waitForTimeout(500);
      
      // Check if sidebar is visible
      const sidebar = page.locator('.sidebar-overlay');
      
      if (await sidebar.isVisible()) {
        console.log('   ✅ Hamburger menu click opens sidebar');
        testResults.passedTests++;
        testResults.details.push(`✅ ${viewport.name}: Hamburger click opens sidebar`);
      } else {
        console.log('   ❌ Hamburger menu click failed to open sidebar');
        testResults.failedTests++;
        testResults.details.push(`❌ ${viewport.name}: Hamburger click failed`);
        continue;
      }

      // Test 5: Sidebar Overlay Functionality
      testResults.totalTests++;
      console.log('5. Testing sidebar overlay functionality...');
      
      // Check if overlay backdrop is present
      const overlay = page.locator('.sidebar-backdrop');
      
      if (await overlay.isVisible()) {
        console.log('   ✅ Sidebar overlay backdrop is visible');
        testResults.passedTests++;
        testResults.details.push(`✅ ${viewport.name}: Sidebar overlay visible`);
      } else {
        console.log('   ❌ Sidebar overlay backdrop not found');
        testResults.failedTests++;
        testResults.details.push(`❌ ${viewport.name}: Sidebar overlay not found`);
      }

      // Test 6: Sidebar Close Functionality
      testResults.totalTests++;
      console.log('6. Testing sidebar close functionality...');
      
      // Click on overlay to close sidebar
      await overlay.click();
      await page.waitForTimeout(500);
      
      // Check if sidebar is hidden
      if (!(await sidebar.isVisible())) {
        console.log('   ✅ Sidebar closes when overlay clicked');
        testResults.passedTests++;
        testResults.details.push(`✅ ${viewport.name}: Sidebar closes on overlay click`);
      } else {
        console.log('   ❌ Sidebar failed to close when overlay clicked');
        testResults.failedTests++;
        testResults.details.push(`❌ ${viewport.name}: Sidebar close failed`);
      }

      // Test 7: Complete Mobile Navigation Workflow
      testResults.totalTests++;
      console.log('7. Testing complete mobile navigation workflow...');
      
      // Open sidebar again
      await hamburgerButton.click();
      await page.waitForTimeout(500);
      
      // Click on a navigation link
      const tradesLink = page.locator('a[href="/trades"]');
      await tradesLink.click();
      await page.waitForTimeout(500);
      
      // Check if navigated to trades page and sidebar closed
      const currentUrlAfterNav = page.url();
      const sidebarAfterNav = page.locator('.sidebar-overlay');
      
      if (currentUrlAfterNav.includes('/trades') && !(await sidebarAfterNav.isVisible())) {
        console.log('   ✅ Complete navigation workflow successful');
        testResults.passedTests++;
        testResults.details.push(`✅ ${viewport.name}: Complete workflow successful`);
      } else {
        console.log('   ❌ Navigation workflow failed');
        testResults.failedTests++;
        testResults.details.push(`❌ ${viewport.name}: Navigation workflow failed`);
      }

    } catch (error) {
      console.log(`   ❌ Test error: ${error.message}`);
      testResults.failedTests++;
      testResults.details.push(`❌ ${viewport.name}: Test error - ${error.message}`);
    } finally {
      await page.close();
    }
  }

  await browser.close();

  // Print final results
  console.log('\n' + '='.repeat(60));
  console.log('🍔 HAMBURGER MENU FUNCTIONALITY TEST RESULTS');
  console.log('='.repeat(60));
  console.log(`Total Tests: ${testResults.totalTests}`);
  console.log(`Passed: ${testResults.passedTests} ✅`);
  console.log(`Failed: ${testResults.failedTests} ❌`);
  console.log(`Success Rate: ${((testResults.passedTests / testResults.totalTests) * 100).toFixed(1)}%`);
  
  console.log('\n📋 Detailed Results:');
  testResults.details.forEach(detail => console.log(`   ${detail}`));

  // Determine overall status
  const successRate = (testResults.passedTests / testResults.totalTests) * 100;
  
  if (successRate >= 90) {
    console.log('\n🎉 EXCELLENT: Hamburger menu functionality is working perfectly!');
  } else if (successRate >= 75) {
    console.log('\n✅ GOOD: Hamburger menu functionality is mostly working with minor issues.');
  } else if (successRate >= 50) {
    console.log('\n⚠️  NEEDS WORK: Hamburger menu functionality has significant issues.');
  } else {
    console.log('\n❌ CRITICAL: Hamburger menu functionality is severely broken.');
  }

  return testResults;
}

// Run the test
testHamburgerMenuFunctionality().catch(console.error);