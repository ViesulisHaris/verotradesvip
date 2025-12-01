const { chromium } = require('playwright');

async function examinePage() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Navigate to the application
  await page.goto('http://localhost:3000');
  
  // Wait for the page to load
  await page.waitForLoadState('networkidle');
  
  // Take a screenshot
  await page.screenshot({ path: 'page-screenshot.png', fullPage: true });
  console.log('Screenshot saved to page-screenshot.png');
  
  // Get the page title
  const title = await page.title();
  console.log('Page title:', title);
  
  // Get the page URL
  const url = page.url();
  console.log('Page URL:', url);
  
  // Get the page content
  const content = await page.content();
  console.log('Page HTML length:', content.length);
  
  // Check if we're on the login page
  const hasEmailInput = await page.$('input[type="email"]');
  const hasPasswordInput = await page.$('input[type="password"]');
  const hasSubmitButton = await page.$('button[type="submit"]');
  
  if (hasEmailInput && hasPasswordInput && hasSubmitButton) {
    console.log('✓ Login page detected');
    
    // Get the login form details
    const emailPlaceholder = await page.$eval('input[type="email"]', el => el.placeholder);
    const passwordPlaceholder = await page.$eval('input[type="password"]', el => el.placeholder);
    const submitButtonText = await page.$eval('button[type="submit"]', el => el.textContent);
    
    console.log('Email input placeholder:', emailPlaceholder);
    console.log('Password input placeholder:', passwordPlaceholder);
    console.log('Submit button text:', submitButtonText);
    
    // Fill in the login form and submit
    console.log('Attempting to login...');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Wait for navigation
    await page.waitForLoadState('networkidle');
    
    // Take another screenshot after login
    await page.screenshot({ path: 'after-login-screenshot.png', fullPage: true });
    console.log('After-login screenshot saved to after-login-screenshot.png');
    
    // Get the new page URL
    const newUrl = page.url();
    console.log('Page URL after login:', newUrl);
    
    // Get the new page title
    const newTitle = await page.title();
    console.log('Page title after login:', newTitle);
  } else {
    console.log('✗ Login page not detected');
  }
  
  // Examine the page structure more thoroughly
  console.log('\n=== Examining Page Structure ===');
  
  // Look for any navigation elements
  const navSelectors = [
    'nav',
    '.nav',
    '.navigation',
    '.sidebar',
    '.menu',
    '.navbar'
  ];
  
  for (const selector of navSelectors) {
    const elements = await page.$$(selector);
    if (elements.length > 0) {
      console.log(`✓ Found ${elements.length} ${selector} element(s)`);
      
      // Get the HTML of the first element
      const html = await elements[0].innerHTML();
      console.log(`  First ${selector} HTML (first 200 chars):`, html.substring(0, 200));
    } else {
      console.log(`✗ No ${selector} elements found`);
    }
  }
  
  // Look for any links
  const links = await page.$$('a');
  console.log(`✓ Found ${links.length} link(s)`);
  
  if (links.length > 0) {
    console.log('  First 10 links:');
    for (let i = 0; i < Math.min(10, links.length); i++) {
      const href = await links[i].getAttribute('href');
      const text = await links[i].textContent();
      console.log(`    ${i + 1}. href="${href}" text="${text}"`);
    }
  }
  
  // Look for any buttons
  const buttons = await page.$$('button');
  console.log(`✓ Found ${buttons.length} button(s)`);
  
  if (buttons.length > 0) {
    console.log('  First 10 buttons:');
    for (let i = 0; i < Math.min(10, buttons.length); i++) {
      const text = await buttons[i].textContent();
      const type = await buttons[i].getAttribute('type');
      const ariaLabel = await buttons[i].getAttribute('aria-label');
      console.log(`    ${i + 1}. text="${text}" type="${type}" aria-label="${ariaLabel}"`);
    }
  }
  
  // Look for any mobile menu indicators
  const mobileMenuIndicators = [
    'button:has-text("Menu")',
    'button:has-text("☰")',
    'button[aria-label*="menu"]',
    'button[aria-label*="Menu"]',
    'button[aria-label*="nav"]',
    'button[aria-label*="Nav"]',
    '.mobile-menu',
    '.menu-toggle',
    '.nav-toggle'
  ];
  
  for (const selector of mobileMenuIndicators) {
    const elements = await page.$$(selector);
    if (elements.length > 0) {
      console.log(`✓ Found ${elements.length} mobile menu indicator(s) with selector: ${selector}`);
    }
  }
  
  // Look for any sidebar indicators
  const sidebarIndicators = [
    '.sidebar',
    '.side-bar',
    '.nav-sidebar',
    '.menu-sidebar',
    '[class*="sidebar"]',
    '[class*="side-bar"]'
  ];
  
  for (const selector of sidebarIndicators) {
    const elements = await page.$$(selector);
    if (elements.length > 0) {
      console.log(`✓ Found ${elements.length} sidebar indicator(s) with selector: ${selector}`);
      
      // Get the class attribute of the first element
      const classAttr = await elements[0].getAttribute('class');
      console.log(`  First ${selector} class attribute:`, classAttr);
    }
  }
  
  // Save the page HTML for further examination
  const fs = require('fs');
  fs.writeFileSync('page-content.html', content);
  console.log('Page HTML saved to page-content.html');
  
  await browser.close();
}

// Run the page examiner
examinePage().catch(console.error);