const { chromium } = require('playwright');

(async () => {
  console.log('Testing Reliable Authentication Flow...\n');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Set longer timeouts for more reliable testing
  page.setDefaultTimeout(10000);
  page.setDefaultNavigationTimeout(15000);
  
  try {
    // Test 1: Verify home page is accessible without authentication
    console.log('1. Testing home page accessibility without authentication...');
    await page.goto('http://localhost:3000');
    
    // Wait for page to fully load
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('h1', { state: 'visible' });
    
    const homeTitle = await page.locator('h1').textContent();
    console.log(`   Home page title: "${homeTitle}"`);
    
    if (homeTitle && homeTitle.includes('Trading Journal')) {
      console.log('   ✓ Home page is accessible without authentication');
    } else {
      console.log('   ✗ Home page is not accessible or content is incorrect');
    }
    
    // Test 2: Navigate to login page
    console.log('\n2. Testing navigation to login page...');
    await page.goto('http://localhost:3000/login');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('h1', { state: 'visible' });
    
    const loginTitle = await page.locator('h1').textContent();
    console.log(`   Login page title: "${loginTitle}"`);
    
    if (loginTitle && loginTitle.includes('Sign in')) {
      console.log('   ✓ Login page is accessible');
    } else {
      console.log('   ✗ Login page is not accessible or content is incorrect');
    }
    
    // Test 3: Form validation with empty fields
    console.log('\n3. Testing form validation with empty fields...');
    
    // Wait for form to be stable
    await page.waitForTimeout(500);
    
    // Try to submit empty form
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);
    
    // Check for error message
    const errorMessage = await page.locator('.status-error').isVisible();
    if (errorMessage) {
      const errorText = await page.locator('.status-error p').textContent();
      console.log(`   Form validation error: "${errorText}"`);
      console.log('   ✓ Form validation works correctly');
    } else {
      console.log('   ⚠ No form validation error displayed');
    }
    
    // Test 4: Form validation with invalid email
    console.log('\n4. Testing form validation with invalid email...');
    
    // Clear form and fill with invalid email
    await page.fill('#email', 'invalid-email');
    await page.fill('#password', 'password123');
    
    // Wait for form to be stable
    await page.waitForTimeout(500);
    
    // Try to submit form with invalid email
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);
    
    // Check for error message
    const invalidEmailError = await page.locator('.status-error').isVisible();
    if (invalidEmailError) {
      const errorText = await page.locator('.status-error p').textContent();
      console.log(`   Invalid email error: "${errorText}"`);
      console.log('   ✓ Email validation works correctly');
    } else {
      console.log('   ⚠ No email validation error displayed');
    }
    
    // Test 5: Authentication with invalid credentials
    console.log('\n5. Testing authentication with invalid credentials...');
    
    // Fill form with invalid credentials
    await page.fill('#email', 'nonexistent@example.com');
    await page.fill('#password', 'wrongpassword');
    
    // Wait for form to be stable
    await page.waitForTimeout(500);
    
    // Try to submit form with invalid credentials
    try {
      await Promise.race([
        page.waitForNavigation({ timeout: 5000 }),
        page.click('button[type="submit"]')
      ]);
      await page.waitForTimeout(1000);
    } catch (error) {
      // Expected - no navigation should occur with invalid credentials
    }
    
    // Check for authentication error
    const authError = await page.locator('.status-error').isVisible();
    if (authError) {
      const errorText = await page.locator('.status-error p').textContent();
      console.log(`   Authentication error: "${errorText}"`);
      console.log('   ✓ Authentication error handling works correctly');
    } else {
      console.log('   ⚠ No authentication error displayed');
    }
    
    // Test 6: Authentication with valid credentials (if available)
    console.log('\n6. Testing authentication with valid credentials...');
    
    // Fill form with test credentials (these would need to be valid in your test environment)
    await page.fill('#email', 'test@example.com');
    await page.fill('#password', 'password123');
    
    // Wait for form to be stable
    await page.waitForTimeout(500);
    
    // Try to submit form with valid credentials
    try {
      await Promise.all([
        page.waitForNavigation({ url: '**/dashboard', timeout: 10000 }),
        page.click('button[type="submit"]')
      ]);
      console.log('   ✓ Login successful, redirected to dashboard');
      
      // Verify dashboard loaded
      await page.waitForLoadState('networkidle');
      const currentUrl = page.url();
      console.log(`   Current URL: ${currentUrl}`);
      
      if (currentUrl.includes('/dashboard')) {
        console.log('   ✓ Dashboard navigation successful');
        
        // Test 7: Dashboard navigation structure
        console.log('\n7. Testing dashboard navigation structure...');
        
        // Check if navigation sidebar is present
        const sidebarVisible = await page.locator('aside').isVisible();
        console.log(`   Sidebar visible: ${sidebarVisible}`);
        
        if (sidebarVisible) {
          console.log('   ✓ Dashboard navigation structure is intact');
          
          // Test navigation links
          const navLinks = await page.locator('nav a').all();
          console.log(`   Found ${navLinks.length} navigation links`);
          
          // Test clicking on first navigation link
          if (navLinks.length > 0) {
            const firstLinkText = await navLinks[0].textContent();
            console.log(`   Testing navigation to: "${firstLinkText}"`);
            
            try {
              await Promise.all([
                page.waitForNavigation({ timeout: 10000 }),
                navLinks[0].click()
              ]);
              console.log('   ✓ Navigation link works correctly');
            } catch (error) {
              console.log('   ⚠ Navigation link test failed');
              console.log(`   Error: ${error.message}`);
            }
          }
        } else {
          console.log('   ✗ Dashboard navigation structure is not intact');
        }
        
        // Test 8: Logout functionality
        console.log('\n8. Testing logout functionality...');
        
        try {
          // Try to find and click logout button with multiple selectors
          const logoutButton = page.locator('button:has-text("Logout")').first();
          if (await logoutButton.isVisible()) {
            await Promise.all([
              page.waitForNavigation({ url: '**/login', timeout: 10000 }),
              logoutButton.click()
            ]);
            console.log('   ✓ Logout functionality works correctly');
          } else {
            console.log('   ⚠ Logout button not found or not visible');
          }
        } catch (error) {
          console.log('   ⚠ Logout functionality test failed');
          console.log(`   Error: ${error.message}`);
        }
      } else {
        console.log('   ⚠ Not redirected to dashboard after login');
      }
    } catch (error) {
      console.log('   ⚠ Login test failed or test credentials invalid');
      console.log(`   Error: ${error.message}`);
    }
    
    console.log('\nReliable authentication flow testing completed!');
    
  } catch (error) {
    console.error('Error during authentication testing:', error);
  } finally {
    await browser.close();
  }
})();