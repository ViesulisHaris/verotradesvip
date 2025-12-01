/**
 * Debug Page Content Test (Fixed)
 * This test checks what's actually being rendered on the dashboard page
 */

const { chromium } = require('playwright');

async function debugPageContent() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('🔍 Debugging Dashboard Page Content...\n');

  try {
    // Navigate to dashboard
    await page.goto('http://localhost:3000/dashboard');
    await page.waitForLoadState('networkidle');
    
    console.log('✅ Dashboard loaded successfully');

    // Get full page HTML content
    const pageContent = await page.content();
    console.log('\n📄 Page Content Analysis:');
    console.log('='.repeat(50));
    
    // Check for authentication state
    const hasAuthElements = await page.evaluate(() => {
      return {
        hasLoginForm: document.querySelector('form') !== null,
        hasAuthElements: document.querySelector('[data-auth], .auth, #auth') !== null,
        hasLoginButton: document.querySelector('button[type="submit"]') !== null,
        hasLogoutButton: document.querySelector('button[aria-label*="logout"]') !== null,
        hasUserElements: document.querySelector('[data-user], .user, #user') !== null,
        bodyText: document.body.textContent?.substring(0, 200) || ''
      };
    });
    
    console.log('Authentication State:');
    console.log(`- Has login form: ${hasAuthElements.hasLoginForm}`);
    console.log(`- Has auth elements: ${hasAuthElements.hasAuthElements}`);
    console.log(`- Has login button: ${hasAuthElements.hasLoginButton}`);
    console.log(`- Has logout button: ${hasAuthElements.hasLogoutButton}`);
    console.log(`- Has user elements: ${hasAuthElements.hasUserElements}`);
    console.log(`- Body text preview: ${hasAuthElements.bodyText}...`);
    
    // Check for navigation elements
    const hasNavigationElements = await page.evaluate(() => {
      return {
        hasSidebar: document.querySelector('aside') !== null,
        hasNav: document.querySelector('nav') !== null,
        hasMobileMenu: document.querySelector('button[aria-label*="menu"]') !== null,
        hasNavLinks: document.querySelectorAll('nav a, aside a').length > 0,
        navLinkCount: document.querySelectorAll('nav a, aside a').length,
        hasModernLayout: document.querySelector('[data-modern-layout]') !== null,
        hasModernNavigation: document.querySelector('[data-modern-navigation]') !== null
      };
    });
    
    console.log('\nNavigation Elements:');
    console.log(`- Has sidebar: ${hasNavigationElements.hasSidebar}`);
    console.log(`- Has nav: ${hasNavigationElements.hasNav}`);
    console.log(`- Has mobile menu: ${hasNavigationElements.hasMobileMenu}`);
    console.log(`- Has nav links: ${hasNavigationElements.hasNavLinks}`);
    console.log(`- Nav link count: ${hasNavigationElements.navLinkCount}`);
    console.log(`- Has ModernLayout: ${hasNavigationElements.hasModernLayout}`);
    console.log(`- Has ModernNavigation: ${hasNavigationElements.hasModernNavigation}`);
    
    // Check for buttons
    const buttonAnalysis = await page.evaluate(() => {
      const buttons = document.querySelectorAll('button');
      return {
        totalButtons: buttons.length,
        clickableButtons: Array.from(buttons).filter(btn => !btn.disabled).length,
        buttonsWithClickHandlers: Array.from(buttons).filter(btn => 
          btn.onclick || btn.hasAttribute('onclick')
        ).length,
        buttonTypes: Array.from(buttons).map(btn => ({
          ariaLabel: btn.getAttribute('aria-label'),
          text: btn.textContent?.trim(),
          disabled: btn.disabled,
          type: btn.type
        }))
      };
    });
    
    console.log('\nButton Analysis:');
    console.log(`- Total buttons: ${buttonAnalysis.totalButtons}`);
    console.log(`- Clickable buttons: ${buttonAnalysis.clickableButtons}`);
    console.log(`- Buttons with click handlers: ${buttonAnalysis.buttonsWithClickHandlers}`);
    console.log('- Button types:');
    buttonAnalysis.buttonTypes.forEach((btn, i) => {
      if (i < 5) { // Only show first 5 to avoid spam
        console.log(`  ${i+1}. ariaLabel: "${btn.ariaLabel}", text: "${btn.text}", disabled: ${btn.disabled}`);
      }
    });
    
    // Check for any console errors
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    // Wait a moment to catch any console errors
    await page.waitForTimeout(2000);
    
    console.log('\nConsole Errors:');
    if (consoleErrors.length === 0) {
      console.log('✅ No console errors detected');
    } else {
      console.log(`❌ Found ${consoleErrors.length} console errors:`);
      consoleErrors.forEach((error, i) => {
        console.log(`  ${i+1}. ${error}`);
      });
    }
    
    // Take a screenshot for visual debugging
    await page.screenshot({ path: 'dashboard-debug.png', fullPage: true });
    console.log('\n📸 Screenshot saved as: dashboard-debug.png');
    
    console.log('\n' + '='.repeat(50));
    console.log('✅ Page Content Debugging Completed');
    console.log('='.repeat(50));

    return true;

  } catch (error) {
    console.error('❌ Debug failed with error:', error);
    return false;
  } finally {
    await browser.close();
  }
}

// Run the debug
debugPageContent()
  .then(success => {
    console.log(`\n🎯 Page Content Debug ${success ? 'COMPLETED' : 'FAILED'}`);
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('💥 Debug execution failed:', error);
    process.exit(1);
  });