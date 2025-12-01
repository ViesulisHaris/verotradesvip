const { chromium } = require('playwright');

async function testMenuButtons() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Navigate to the application
  await page.goto('http://localhost:3000');
  
  // Wait for the page to load
  await page.waitForLoadState('networkidle');
  
  // Set up console logging to capture diagnostic logs
  const consoleLogs = [];
  page.on('console', msg => {
    consoleLogs.push(msg.text());
    console.log('CONSOLE LOG:', msg.text());
  });

  // Test results
  const testResults = {
    mobileMenuToggle: { working: false, details: '' },
    desktopButtons: {},
    mobileButtons: {},
    logoutButtons: { working: false, details: '' },
    pageStructure: {}
  };

  // Test 1: Check if we're on the login page and authenticate if needed
  console.log('=== Testing Authentication ===');
  const loginPage = await page.$('input[type="email"]');
  if (loginPage) {
    console.log('Login page detected, attempting to authenticate...');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Wait for navigation after login
    await page.waitForLoadState('networkidle');
    console.log('Authentication completed');
  }

  // Test 2: Examine page structure to identify correct selectors
  console.log('\n=== Examining Page Structure ===');
  
  // Check for mobile menu toggle button
  const mobileMenuToggleSelectors = [
    'button[aria-label="Toggle mobile menu"]',
    'button[aria-label="Menu"]',
    'button[aria-label="Open menu"]',
    'button:has-text("Menu")',
    'button:has-text("☰")',
    '.md\\:hidden button',
    '.mobile-menu-toggle button',
    'button[data-testid="mobile-menu-toggle"]'
  ];
  
  let mobileMenuToggleFound = false;
  for (const selector of mobileMenuToggleSelectors) {
    const element = await page.$(selector);
    if (element) {
      testResults.pageStructure.mobileMenuToggle = selector;
      mobileMenuToggleFound = true;
      console.log(`✓ Mobile menu toggle found with selector: ${selector}`);
      break;
    }
  }
  
  if (!mobileMenuToggleFound) {
    console.log('✗ Mobile menu toggle button not found with any selector');
  }

  // Check for mobile sidebar
  const mobileSidebarSelectors = [
    '.fixed.inset-y-0.left-0.z-50',
    '.mobile-sidebar',
    '.sidebar-mobile',
    '[data-testid="mobile-sidebar"]'
  ];
  
  let mobileSidebarFound = false;
  for (const selector of mobileSidebarSelectors) {
    const element = await page.$(selector);
    if (element) {
      testResults.pageStructure.mobileSidebar = selector;
      mobileSidebarFound = true;
      console.log(`✓ Mobile sidebar found with selector: ${selector}`);
      break;
    }
  }
  
  if (!mobileSidebarFound) {
    console.log('✗ Mobile sidebar not found with any selector');
  }

  // Check for desktop sidebar
  const desktopSidebarSelectors = [
    '.hidden.md\\:flex',
    '.desktop-sidebar',
    '.sidebar-desktop',
    '[data-testid="desktop-sidebar"]'
  ];
  
  let desktopSidebarFound = false;
  for (const selector of desktopSidebarSelectors) {
    const element = await page.$(selector);
    if (element) {
      testResults.pageStructure.desktopSidebar = selector;
      desktopSidebarFound = true;
      console.log(`✓ Desktop sidebar found with selector: ${selector}`);
      break;
    }
  }
  
  if (!desktopSidebarFound) {
    console.log('✗ Desktop sidebar not found with any selector');
  }

  // Check for navigation links
  const navLinkSelectors = [
    'a[href="/dashboard"]',
    'a[href="/log-trade"]',
    'a[href="/strategies"]',
    'a[href="/trades"]',
    'a[href="/calendar"]',
    'a[href="/confluence"]'
  ];
  
  const navLinksFound = {};
  for (const href of navLinkSelectors) {
    const element = await page.$(href);
    if (element) {
      navLinksFound[href] = true;
      console.log(`✓ Navigation link found: ${href}`);
    } else {
      navLinksFound[href] = false;
      console.log(`✗ Navigation link not found: ${href}`);
    }
  }
  
  testResults.pageStructure.navLinks = navLinksFound;

  // Test 3: Mobile Menu Toggle Button
  console.log('\n=== Testing Mobile Menu Toggle Button ===');
  try {
    if (testResults.pageStructure.mobileMenuToggle) {
      const mobileMenuToggle = await page.$(testResults.pageStructure.mobileMenuToggle);
      if (mobileMenuToggle) {
        console.log('Mobile menu toggle button found');
        
        // Click the button to open the mobile menu
        await mobileMenuToggle.click();
        
        // Wait for potential animation
        await page.waitForTimeout(500);
        
        // Check if the mobile sidebar is now visible
        let mobileSidebarVisible = false;
        if (testResults.pageStructure.mobileSidebar) {
          mobileSidebarVisible = await page.isVisible(testResults.pageStructure.mobileSidebar);
        }
        
        if (mobileSidebarVisible) {
          testResults.mobileMenuToggle.working = true;
          testResults.mobileMenuToggle.details = 'Mobile menu toggle button successfully opens the mobile sidebar';
          console.log('✓ Mobile menu toggle button is working');
        } else {
          testResults.mobileMenuToggle.details = 'Mobile menu toggle button clicked but sidebar did not become visible';
          console.log('✗ Mobile menu toggle button clicked but sidebar did not become visible');
        }
      } else {
        testResults.mobileMenuToggle.details = 'Mobile menu toggle button not found';
        console.log('✗ Mobile menu toggle button not found');
      }
    } else {
      testResults.mobileMenuToggle.details = 'Mobile menu toggle selector not identified';
      console.log('✗ Mobile menu toggle selector not identified');
    }
  } catch (error) {
    testResults.mobileMenuToggle.details = `Error testing mobile menu toggle: ${error.message}`;
    console.log('✗ Error testing mobile menu toggle:', error.message);
  }

  // Test 4: Mobile Sidebar Navigation Buttons
  console.log('\n=== Testing Mobile Sidebar Navigation Buttons ===');
  const mobileButtons = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Log Trade', href: '/log-trade' },
    { label: 'Strategies', href: '/strategies' },
    { label: 'Trades', href: '/trades' },
    { label: 'Calendar', href: '/calendar' },
    { label: 'Confluence', href: '/confluence' }
  ];

  // Ensure mobile menu is open
  if (testResults.pageStructure.mobileMenuToggle) {
    const mobileMenuToggle = await page.$(testResults.pageStructure.mobileMenuToggle);
    if (mobileMenuToggle) {
      let mobileSidebarVisible = false;
      if (testResults.pageStructure.mobileSidebar) {
        mobileSidebarVisible = await page.isVisible(testResults.pageStructure.mobileSidebar);
      }
      
      if (!mobileSidebarVisible) {
        await mobileMenuToggle.click();
        await page.waitForTimeout(500);
      }
    }
  }

  for (const button of mobileButtons) {
    try {
      console.log(`Testing mobile button: ${button.label}`);
      
      // Find the link in the mobile sidebar
      let mobileButton = null;
      if (testResults.pageStructure.mobileSidebar) {
        mobileButton = await page.$(`${testResults.pageStructure.mobileSidebar} a[href="${button.href}"]`);
      }
      
      // If not found in mobile sidebar, try to find it anywhere on the page
      if (!mobileButton) {
        mobileButton = await page.$(`a[href="${button.href}"]`);
      }
      
      if (mobileButton) {
        console.log(`Mobile button "${button.label}" found`);
        
        // Get the current URL
        const initialUrl = page.url();
        
        // Click the button
        await mobileButton.click();
        
        // Wait for navigation
        await page.waitForLoadState('networkidle');
        
        // Check if navigation occurred
        const finalUrl = page.url();
        if (finalUrl.includes(button.href) || finalUrl !== initialUrl) {
          testResults.mobileButtons[button.label] = { working: true, details: `Successfully navigated to ${button.href}` };
          console.log(`✓ Mobile button "${button.label}" is working`);
        } else {
          testResults.mobileButtons[button.label] = { working: false, details: `Button clicked but navigation did not occur` };
          console.log(`✗ Mobile button "${button.label}" clicked but navigation did not occur`);
        }
        
        // Re-open mobile menu for next test
        if (testResults.pageStructure.mobileMenuToggle) {
          const mobileMenuToggle = await page.$(testResults.pageStructure.mobileMenuToggle);
          if (mobileMenuToggle) {
            await mobileMenuToggle.click();
            await page.waitForTimeout(500);
          }
        }
      } else {
        testResults.mobileButtons[button.label] = { working: false, details: `Button not found in mobile sidebar` };
        console.log(`✗ Mobile button "${button.label}" not found`);
      }
    } catch (error) {
      testResults.mobileButtons[button.label] = { working: false, details: `Error testing button: ${error.message}` };
      console.log(`✗ Error testing mobile button "${button.label}":`, error.message);
    }
  }

  // Test 5: Desktop Sidebar Navigation Buttons
  console.log('\n=== Testing Desktop Sidebar Navigation Buttons ===');
  
  // Switch to desktop viewport
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.waitForLoadState('networkidle');
  
  for (const button of mobileButtons) {
    try {
      console.log(`Testing desktop button: ${button.label}`);
      
      // Find the link in the desktop sidebar
      let desktopButton = null;
      if (testResults.pageStructure.desktopSidebar) {
        desktopButton = await page.$(`${testResults.pageStructure.desktopSidebar} a[href="${button.href}"]`);
      }
      
      // If not found in desktop sidebar, try to find it anywhere on the page
      if (!desktopButton) {
        desktopButton = await page.$(`a[href="${button.href}"]`);
      }
      
      if (desktopButton) {
        console.log(`Desktop button "${button.label}" found`);
        
        // Get the current URL
        const initialUrl = page.url();
        
        // Click the button
        await desktopButton.click();
        
        // Wait for navigation
        await page.waitForLoadState('networkidle');
        
        // Check if navigation occurred
        const finalUrl = page.url();
        if (finalUrl.includes(button.href) || finalUrl !== initialUrl) {
          testResults.desktopButtons[button.label] = { working: true, details: `Successfully navigated to ${button.href}` };
          console.log(`✓ Desktop button "${button.label}" is working`);
        } else {
          testResults.desktopButtons[button.label] = { working: false, details: `Button clicked but navigation did not occur` };
          console.log(`✗ Desktop button "${button.label}" clicked but navigation did not occur`);
        }
      } else {
        testResults.desktopButtons[button.label] = { working: false, details: `Button not found in desktop sidebar` };
        console.log(`✗ Desktop button "${button.label}" not found`);
      }
    } catch (error) {
      testResults.desktopButtons[button.label] = { working: false, details: `Error testing button: ${error.message}` };
      console.log(`✗ Error testing desktop button "${button.label}":`, error.message);
    }
  }

  // Test 6: Logout Buttons
  console.log('\n=== Testing Logout Buttons ===');
  
  // Test mobile logout button
  try {
    console.log('Testing mobile logout button');
    
    // Ensure mobile menu is open
    if (testResults.pageStructure.mobileMenuToggle) {
      const mobileMenuToggle = await page.$(testResults.pageStructure.mobileMenuToggle);
      if (mobileMenuToggle) {
        let mobileSidebarVisible = false;
        if (testResults.pageStructure.mobileSidebar) {
          mobileSidebarVisible = await page.isVisible(testResults.pageStructure.mobileSidebar);
        }
        
        if (!mobileSidebarVisible) {
          await mobileMenuToggle.click();
          await page.waitForTimeout(500);
        }
      }
    }
    
    // Look for logout button in mobile sidebar
    let mobileLogoutButton = null;
    if (testResults.pageStructure.mobileSidebar) {
      mobileLogoutButton = await page.$(`${testResults.pageStructure.mobileSidebar} button:has-text("Logout")`);
    }
    
    // If not found in mobile sidebar, try to find it anywhere on the page
    if (!mobileLogoutButton) {
      mobileLogoutButton = await page.$('button:has-text("Logout")');
    }
    
    if (mobileLogoutButton) {
      console.log('Mobile logout button found');
      
      // Click the logout button
      await mobileLogoutButton.click();
      
      // Wait for potential navigation
      await page.waitForTimeout(1000);
      
      // Check if we've been redirected to login page
      const currentUrl = page.url();
      if (currentUrl.includes('/login') || currentUrl.includes('/auth')) {
        testResults.logoutButtons.working = true;
        testResults.logoutButtons.details = 'Mobile logout button successfully logged out';
        console.log('✓ Mobile logout button is working');
      } else {
        testResults.logoutButtons.details = 'Mobile logout button clicked but logout did not occur';
        console.log('✗ Mobile logout button clicked but logout did not occur');
      }
    } else {
      console.log('✗ Mobile logout button not found');
    }
  } catch (error) {
    testResults.logoutButtons.details = `Error testing mobile logout button: ${error.message}`;
    console.log('✗ Error testing mobile logout button:', error.message);
  }

  // Test desktop logout button
  try {
    console.log('Testing desktop logout button');
    
    // Switch to desktop viewport
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.waitForLoadState('networkidle');
    
    // Navigate back to dashboard if we're on login page
    const currentUrl = page.url();
    if (currentUrl.includes('/login') || currentUrl.includes('/auth')) {
      await page.goto('http://localhost:3000');
      await page.waitForLoadState('networkidle');
      
      // Login again
      await page.fill('input[type="email"]', 'test@example.com');
      await page.fill('input[type="password"]', 'password123');
      await page.click('button[type="submit"]');
      await page.waitForLoadState('networkidle');
    }
    
    // Look for logout button in desktop sidebar
    let desktopLogoutButton = null;
    if (testResults.pageStructure.desktopSidebar) {
      desktopLogoutButton = await page.$(`${testResults.pageStructure.desktopSidebar} button:has-text("Logout")`);
    }
    
    // If not found in desktop sidebar, try to find it anywhere on the page
    if (!desktopLogoutButton) {
      desktopLogoutButton = await page.$('button:has-text("Logout")');
    }
    
    if (desktopLogoutButton) {
      console.log('Desktop logout button found');
      
      // Click the logout button
      await desktopLogoutButton.click();
      
      // Wait for potential navigation
      await page.waitForTimeout(1000);
      
      // Check if we've been redirected to login page
      const finalUrl = page.url();
      if (finalUrl.includes('/login') || finalUrl.includes('/auth')) {
        testResults.logoutButtons.working = true;
        testResults.logoutButtons.details = 'Desktop logout button successfully logged out';
        console.log('✓ Desktop logout button is working');
      } else {
        testResults.logoutButtons.details = 'Desktop logout button clicked but logout did not occur';
        console.log('✗ Desktop logout button clicked but logout did not occur');
      }
    } else {
      console.log('✗ Desktop logout button not found');
    }
  } catch (error) {
    testResults.logoutButtons.details = `Error testing desktop logout button: ${error.message}`;
    console.log('✗ Error testing desktop logout button:', error.message);
  }

  // Print summary
  console.log('\n=== Test Results Summary ===');
  console.log('Mobile Menu Toggle:', testResults.mobileMenuToggle.working ? '✓ Working' : '✗ Not working');
  console.log('Logout Buttons:', testResults.logoutButtons.working ? '✓ Working' : '✗ Not working');
  
  console.log('\nMobile Buttons:');
  for (const [button, result] of Object.entries(testResults.mobileButtons)) {
    console.log(`  ${button}: ${result.working ? '✓ Working' : '✗ Not working'} - ${result.details}`);
  }
  
  console.log('\nDesktop Buttons:');
  for (const [button, result] of Object.entries(testResults.desktopButtons)) {
    console.log(`  ${button}: ${result.working ? '✓ Working' : '✗ Not working'} - ${result.details}`);
  }
  
  console.log('\n=== Page Structure ===');
  console.log('Mobile Menu Toggle Selector:', testResults.pageStructure.mobileMenuToggle || 'Not found');
  console.log('Mobile Sidebar Selector:', testResults.pageStructure.mobileSidebar || 'Not found');
  console.log('Desktop Sidebar Selector:', testResults.pageStructure.desktopSidebar || 'Not found');
  console.log('Navigation Links:');
  for (const [href, found] of Object.entries(testResults.pageStructure.navLinks || {})) {
    console.log(`  ${href}: ${found ? '✓ Found' : '✗ Not found'}`);
  }
  
  console.log('\n=== Console Logs ===');
  console.log('Diagnostic logs from button clicks:');
  for (const log of consoleLogs) {
    if (log.includes('MENU_BUTTON_TEST') || log.includes('MENU_BUTTON_CLICKED') || 
        log.includes('MOBILE_MENU_TOGGLE') || log.includes('LOGOUT_BUTTON_CLICKED')) {
      console.log(log);
    }
  }

  // Save test results to a file
  const fs = require('fs');
  fs.writeFileSync('improved-menu-button-test-results.json', JSON.stringify({
    testResults,
    consoleLogs,
    timestamp: new Date().toISOString()
  }, null, 2));
  
  console.log('\nTest results saved to improved-menu-button-test-results.json');
  
  await browser.close();
  return testResults;
}

// Run the test
testMenuButtons().catch(console.error);