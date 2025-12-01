const puppeteer = require('puppeteer');
const path = require('path');

async function testAuthenticatedNavigation() {
  console.log('🧪 Starting Authenticated Navigation Testing...\n');
  
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: ['--start-maximized']
  });
  
  const page = await browser.newPage();
  
  // Enable console logging from the browser
  page.on('console', msg => {
    console.log('Browser:', msg.text());
  });
  
  const results = {
    navigation: {
      background: false,
      logoutButton: false
    },
    responsive: {
      mobile: false,
      tablet: false,
      desktop: false
    },
    screenshots: []
  };
  
  try {
    // Navigate to login page
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle2' });
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Fill in login credentials
    console.log('🔐 Logging in with test credentials...');
    await page.type('input[type="email"]', 'testuser@verotrade.com');
    await page.type('input[type="password"]', 'TestPassword123!');
    
    // Click login button
    await page.click('button[type="submit"]');
    
    // Wait for navigation to dashboard
    await page.waitForNavigation({ waitUntil: 'networkidle2' });
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log('✅ Successfully logged in, testing navigation...');
    
    // Test 1: Navigation Background
    console.log('\n🎨 Testing Navigation Background...');
    const navBackground = await page.evaluate(() => {
      const nav = document.querySelector('nav');
      if (!nav) return null;
      
      const computedStyle = window.getComputedStyle(nav);
      return {
        backgroundColor: computedStyle.backgroundColor,
        background: computedStyle.background,
        height: computedStyle.height,
        position: computedStyle.position
      };
    });
    
    if (navBackground) {
      console.log('Navigation background details:', navBackground);
      // Check for #121212 background
      const bgColor = navBackground.backgroundColor.toUpperCase();
      results.navigation.background = bgColor === 'RGB(18, 18, 18)' || bgColor === '#121212';
      console.log(`✅ Navigation background #121212: ${results.navigation.background ? 'PASS' : 'FAIL'} (${bgColor})`);
    } else {
      console.log('❌ Navigation component not found');
    }
    
    // Test 2: Logout Button Styling
    console.log('\n🔘 Testing Logout Button...');
    const logoutButton = await page.evaluate(() => {
      const button = document.querySelector('button[aria-label="Logout from trading dashboard"]');
      if (!button) return null;
      
      const computedStyle = window.getComputedStyle(button);
      return {
        backgroundColor: computedStyle.backgroundColor,
        border: computedStyle.border,
        borderRadius: computedStyle.borderRadius,
        color: computedStyle.color,
        exists: true
      };
    });
    
    if (logoutButton) {
      console.log('Logout button details:', logoutButton);
      // Check for warm color palette with dusty gold border
      const hasDustyGoldBorder = logoutButton.border.includes('184, 155, 94') || 
                                 logoutButton.border.includes('#B89B5E') ||
                                 logoutButton.border.includes('rgba(184, 155, 94');
      results.navigation.logoutButton = hasDustyGoldBorder;
      console.log(`✅ Dusty gold border on logout: ${results.navigation.logoutButton ? 'PASS' : 'FAIL'}`);
      console.log(`   Border details: ${logoutButton.border}`);
    } else {
      console.log('❌ Logout button not found');
    }
    
    // Test 3: Responsive Behavior
    console.log('\n📱 Testing Responsive Behavior...');
    
    // Mobile view
    await page.setViewport({ width: 375, height: 667 });
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const mobileLogo = await page.evaluate(() => {
      const logoContainer = document.querySelector('.block.sm\\:hidden');
      if (!logoContainer) return false;
      
      const logoText = logoContainer.querySelector('span');
      return logoText === null; // Should not show text on mobile
    });
    
    results.responsive.mobile = mobileLogo;
    console.log(`✅ Mobile responsive (logo only): ${results.responsive.mobile ? 'PASS' : 'FAIL'}`);
    
    // Take mobile screenshot
    const mobileScreenshot = `authenticated-nav-mobile-${Date.now()}.png`;
    await page.screenshot({ path: mobileScreenshot, fullPage: false });
    results.screenshots.push(mobileScreenshot);
    console.log(`📸 Mobile screenshot saved: ${mobileScreenshot}`);
    
    // Tablet view
    await page.setViewport({ width: 768, height: 1024 });
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const tabletLogo = await page.evaluate(() => {
      const logoContainer = document.querySelector('.hidden.sm\\:block.md\\:hidden');
      if (!logoContainer) return false;
      
      const logoText = logoContainer.querySelector('span');
      return logoText !== null; // Should show text on tablet
    });
    
    results.responsive.tablet = tabletLogo;
    console.log(`✅ Tablet responsive (logo + text): ${results.responsive.tablet ? 'PASS' : 'FAIL'}`);
    
    // Take tablet screenshot
    const tabletScreenshot = `authenticated-nav-tablet-${Date.now()}.png`;
    await page.screenshot({ path: tabletScreenshot, fullPage: false });
    results.screenshots.push(tabletScreenshot);
    console.log(`📸 Tablet screenshot saved: ${tabletScreenshot}`);
    
    // Desktop view
    await page.setViewport({ width: 1920, height: 1080 });
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const desktopLogo = await page.evaluate(() => {
      const logoContainer = document.querySelector('.hidden.md\\:block');
      if (!logoContainer) return false;
      
      const logoText = logoContainer.querySelector('span');
      return logoText !== null; // Should show text on desktop
    });
    
    results.responsive.desktop = desktopLogo;
    console.log(`✅ Desktop responsive (logo + text): ${results.responsive.desktop ? 'PASS' : 'FAIL'}`);
    
    // Take desktop screenshot
    const desktopScreenshot = `authenticated-nav-desktop-${Date.now()}.png`;
    await page.screenshot({ path: desktopScreenshot, fullPage: false });
    results.screenshots.push(desktopScreenshot);
    console.log(`📸 Desktop screenshot saved: ${desktopScreenshot}`);
    
    // Take a detailed navigation screenshot
    const navDetailScreenshot = `authenticated-nav-detail-${Date.now()}.png`;
    await page.evaluate(() => {
      const nav = document.querySelector('nav');
      if (nav) {
        nav.scrollIntoView({ behavior: 'instant', block: 'start' });
      }
    });
    await new Promise(resolve => setTimeout(resolve, 1000));
    await page.screenshot({ 
      path: navDetailScreenshot, 
      clip: { x: 0, y: 0, width: 1920, height: 100 }
    });
    results.screenshots.push(navDetailScreenshot);
    console.log(`📸 Navigation detail screenshot saved: ${navDetailScreenshot}`);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
  
  // Generate comprehensive report
  console.log('\n📊 AUTHENTICATED NAVIGATION TEST REPORT');
  console.log('='.repeat(50));
  
  console.log('\n🎯 NAVIGATION TESTS:');
  console.log(`  Background (#121212): ${results.navigation.background ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`  Logout Button (Dusty Gold Border): ${results.navigation.logoutButton ? '✅ PASS' : '❌ FAIL'}`);
  
  console.log('\n🎯 RESPONSIVE TESTS:');
  console.log(`  Mobile (Logo Only): ${results.responsive.mobile ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`  Tablet (Logo + Text): ${results.responsive.tablet ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`  Desktop (Logo + Text): ${results.responsive.desktop ? '✅ PASS' : '❌ FAIL'}`);
  
  const navTestsPassed = results.navigation.background && results.navigation.logoutButton;
  const responsiveTestsPassed = results.responsive.mobile && results.responsive.tablet && results.responsive.desktop;
  
  console.log('\n🎯 DETAILED RESULTS:');
  console.log(`  Navigation Implementation: ${navTestsPassed ? '✅ MATCHES SPECIFICATIONS' : '❌ DOES NOT MATCH SPECIFICATIONS'}`);
  console.log(`  Responsive Behavior: ${responsiveTestsPassed ? '✅ MATCHES SPECIFICATIONS' : '❌ DOES NOT MATCH SPECIFICATIONS'}`);
  
  const allPassed = navTestsPassed && responsiveTestsPassed;
  
  console.log('\n🎯 OVERALL RESULT:');
  console.log(`  ${allPassed ? '✅ ALL NAVIGATION CHANGES MATCH MOCKUP SPECIFICATIONS' : '❌ SOME NAVIGATION CHANGES DO NOT MATCH MOCKUP SPECIFICATIONS'}`);
  
  console.log('\n📸 SCREENSHOTS TAKEN:');
  results.screenshots.forEach(screenshot => {
    console.log(`  - ${screenshot}`);
  });
  
  // Save detailed results to JSON file
  const reportFile = `authenticated-navigation-test-report-${Date.now()}.json`;
  require('fs').writeFileSync(reportFile, JSON.stringify(results, null, 2));
  console.log(`\n📄 Detailed report saved: ${reportFile}`);
  
  return results;
}

// Run the test
testAuthenticatedNavigation().then(results => {
  console.log('\n🏁 Authenticated navigation testing completed!');
  process.exit(0);
}).catch(error => {
  console.error('💥 Test execution failed:', error);
  process.exit(1);
});