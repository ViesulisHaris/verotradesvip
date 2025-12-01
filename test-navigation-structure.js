const { chromium } = require('playwright');

(async () => {
  console.log('Testing Navigation Structure Implementation...\n');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // Test 1: Home page accessibility without authentication
    console.log('1. Testing home page accessibility without authentication...');
    await page.goto('http://localhost:3000');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Check if home page content is displayed
    const homeTitle = await page.locator('h1').textContent();
    const homeMessage = await page.locator('p').textContent();
    
    console.log(`   Home page title: "${homeTitle}"`);
    console.log(`   Home page message: "${homeMessage}"`);
    
    if (homeTitle && homeTitle.includes('Trading Journal')) {
      console.log('   ✓ Home page is accessible without authentication');
    } else {
      console.log('   ✗ Home page is not accessible or content is incorrect');
    }
    
    // Test 2: Navigation to login page
    console.log('\n2. Testing navigation to login page...');
    await page.goto('http://localhost:3000/login');
    await page.waitForLoadState('networkidle');
    
    const loginTitle = await page.locator('h1').textContent();
    console.log(`   Login page title: "${loginTitle}"`);
    
    if (loginTitle && loginTitle.includes('Sign in')) {
      console.log('   ✓ Login page is accessible');
    } else {
      console.log('   ✗ Login page is not accessible or content is incorrect');
    }
    
    // Test 3: Authentication flow
    console.log('\n3. Testing authentication flow...');
    
    // Fill in login form with test credentials
    await page.fill('#email', 'test@example.com');
    await page.fill('#password', 'password123');
    
    // Wait for form to be stable before clicking
    await page.waitForTimeout(500);
    
    // Click login button with error handling for potential DOM detachment
    try {
      await Promise.all([
        page.waitForNavigation({ url: '**/dashboard', timeout: 10000 }),
        page.click('button[type="submit"]')
      ]);
      console.log('   ✓ Login button clicked successfully');
    } catch (error) {
      console.log('   ⚠ Login navigation failed or test credentials invalid');
      console.log(`   Error: ${error.message}`);
    }
    
    // Test 4: Dashboard navigation (if login successful)
    try {
      const currentUrl = page.url();
      if (currentUrl.includes('/dashboard')) {
        console.log('\n4. Testing dashboard navigation...');
        console.log(`   Current URL: ${currentUrl}`);
        
        // Check if navigation sidebar is present
        const sidebarVisible = await page.locator('aside').isVisible();
        console.log(`   Sidebar visible: ${sidebarVisible}`);
        
        if (sidebarVisible) {
          console.log('   ✓ Dashboard navigation structure is intact');
          
          // Test navigation links
          const navLinks = await page.locator('nav a').all();
          console.log(`   Found ${navLinks.length} navigation links`);
          
          for (let i = 0; i < Math.min(navLinks.length, 3); i++) {
            const linkText = await navLinks[i].textContent();
            console.log(`   Link ${i+1}: "${linkText}"`);
          }
        } else {
          console.log('   ✗ Dashboard navigation structure is not intact');
        }
      }
    } catch (error) {
      console.log('   ⚠ Could not test dashboard navigation');
      console.log(`   Error: ${error.message}`);
    }
    
    // Test 5: Logout functionality
    console.log('\n5. Testing logout functionality...');
    try {
      // Try to find and click logout button
      const logoutButton = page.locator('button:has-text("Logout")').first();
      if (await logoutButton.isVisible()) {
        await logoutButton.click();
        await page.waitForTimeout(1000);
        console.log('   ✓ Logout button clicked');
      } else {
        console.log('   ⚠ Logout button not found or not visible');
      }
    } catch (error) {
      console.log('   ⚠ Logout functionality test failed');
      console.log(`   Error: ${error.message}`);
    }
    
    console.log('\nNavigation structure testing completed!');
    
  } catch (error) {
    console.error('Error during navigation testing:', error);
  } finally {
    await browser.close();
  }
})();