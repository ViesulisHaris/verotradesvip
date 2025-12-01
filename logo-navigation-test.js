const puppeteer = require('puppeteer');
const path = require('path');

async function testLogoAndNavigation() {
  console.log('🧪 Starting Logo and Navigation Testing...\n');
  
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
    logo: {
      font: false,
      color: false,
      text: false,
      size: false
    },
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
    // Navigate to the application
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
    
    // Wait for the page to load completely
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Test 1: Logo Font Verification
    console.log('📝 Testing Logo Font...');
    const logoFont = await page.evaluate(() => {
      const logoText = document.querySelector('span[style*="VeroTrade"]');
      if (!logoText) return null;
      
      const computedStyle = window.getComputedStyle(logoText);
      return {
        fontFamily: computedStyle.fontFamily,
        fontSize: computedStyle.fontSize,
        fontWeight: computedStyle.fontWeight,
        color: computedStyle.color,
        text: logoText.textContent
      };
    });
    
    if (logoFont) {
      console.log('Logo font details:', logoFont);
      
      // Check for Playfair Display font
      results.logo.font = logoFont.fontFamily.includes('Playfair Display');
      console.log(`✅ Playfair Display font: ${results.logo.font ? 'PASS' : 'FAIL'}`);
      
      // Check for Dusty Gold color #B89B5E
      const logoColor = logoFont.color.toUpperCase();
      results.logo.color = logoColor === 'RGB(184, 155, 94)' || logoColor === '#B89B5E';
      console.log(`✅ Dusty Gold color: ${results.logo.color ? 'PASS' : 'FAIL'} (${logoColor})`);
      
      // Check for "VeroTrade" text
      results.logo.text = logoFont.text === 'VeroTrade';
      console.log(`✅ VeroTrade text: ${results.logo.text ? 'PASS' : 'FAIL'}`);
      
      // Check for 24px font size
      const fontSize = parseInt(logoFont.fontSize);
      results.logo.size = fontSize === 24;
      console.log(`✅ 24px font size: ${results.logo.size ? 'PASS' : 'FAIL'} (${fontSize}px)`);
    }
    
    // Test 2: Navigation Background
    console.log('\n🎨 Testing Navigation Background...');
    const navBackground = await page.evaluate(() => {
      const nav = document.querySelector('nav');
      if (!nav) return null;
      
      const computedStyle = window.getComputedStyle(nav);
      return {
        backgroundColor: computedStyle.backgroundColor,
        background: computedStyle.background
      };
    });
    
    if (navBackground) {
      console.log('Navigation background details:', navBackground);
      // Check for #121212 background
      const bgColor = navBackground.backgroundColor.toUpperCase();
      results.navigation.background = bgColor === 'RGB(18, 18, 18)' || bgColor === '#121212';
      console.log(`✅ Navigation background #121212: ${results.navigation.background ? 'PASS' : 'FAIL'} (${bgColor})`);
    }
    
    // Test 3: Logout Button Styling
    console.log('\n🔘 Testing Logout Button...');
    const logoutButton = await page.evaluate(() => {
      const button = document.querySelector('button[aria-label="Logout from trading dashboard"]');
      if (!button) return null;
      
      const computedStyle = window.getComputedStyle(button);
      return {
        backgroundColor: computedStyle.backgroundColor,
        border: computedStyle.border,
        borderRadius: computedStyle.borderRadius,
        color: computedStyle.color
      };
    });
    
    if (logoutButton) {
      console.log('Logout button details:', logoutButton);
      // Check for warm color palette with dusty gold border
      const hasDustyGoldBorder = logoutButton.border.includes('184, 155, 94') || 
                                 logoutButton.border.includes('#B89B5E');
      results.navigation.logoutButton = hasDustyGoldBorder;
      console.log(`✅ Dusty gold border on logout: ${results.navigation.logoutButton ? 'PASS' : 'FAIL'}`);
    }
    
    // Test 4: Responsive Behavior
    console.log('\n📱 Testing Responsive Behavior...');
    
    // Mobile view
    await page.setViewport({ width: 375, height: 667 });
    await new Promise(resolve => setTimeout(resolve, 1000));
    const mobileLogo = await page.evaluate(() => {
      const logoContainer = document.querySelector('.block.sm\\:hidden');
      return logoContainer ? logoContainer.querySelector('span') === null : false;
    });
    results.responsive.mobile = mobileLogo;
    console.log(`✅ Mobile responsive (logo only): ${results.responsive.mobile ? 'PASS' : 'FAIL'}`);
    
    // Take mobile screenshot
    const mobileScreenshot = `logo-navigation-test-mobile-${Date.now()}.png`;
    await page.screenshot({ path: mobileScreenshot, fullPage: false });
    results.screenshots.push(mobileScreenshot);
    console.log(`📸 Mobile screenshot saved: ${mobileScreenshot}`);
    
    // Tablet view
    await page.setViewport({ width: 768, height: 1024 });
    await page.waitForTimeout(1000);
    const tabletLogo = await page.evaluate(() => {
      const logoContainer = document.querySelector('.hidden.sm\\:block.md\\:hidden');
      return logoContainer ? logoContainer.querySelector('span') !== null : false;
    });
    results.responsive.tablet = tabletLogo;
    console.log(`✅ Tablet responsive (logo + text): ${results.responsive.tablet ? 'PASS' : 'FAIL'}`);
    
    // Take tablet screenshot
    const tabletScreenshot = `logo-navigation-test-tablet-${Date.now()}.png`;
    await page.screenshot({ path: tabletScreenshot, fullPage: false });
    results.screenshots.push(tabletScreenshot);
    console.log(`📸 Tablet screenshot saved: ${tabletScreenshot}`);
    
    // Desktop view
    await page.setViewport({ width: 1920, height: 1080 });
    await page.waitForTimeout(1000);
    const desktopLogo = await page.evaluate(() => {
      const logoContainer = document.querySelector('.hidden.md\\:block');
      return logoContainer ? logoContainer.querySelector('span') !== null : false;
    });
    results.responsive.desktop = desktopLogo;
    console.log(`✅ Desktop responsive (logo + text): ${results.responsive.desktop ? 'PASS' : 'FAIL'}`);
    
    // Take desktop screenshot
    const desktopScreenshot = `logo-navigation-test-desktop-${Date.now()}.png`;
    await page.screenshot({ path: desktopScreenshot, fullPage: false });
    results.screenshots.push(desktopScreenshot);
    console.log(`📸 Desktop screenshot saved: ${desktopScreenshot}`);
    
    // Take a detailed navigation screenshot
    await page.setViewport({ width: 1920, height: 1080 });
    const navDetailScreenshot = `logo-navigation-test-detail-${Date.now()}.png`;
    await page.evaluate(() => {
      const nav = document.querySelector('nav');
      if (nav) {
        nav.scrollIntoView({ behavior: 'instant', block: 'start' });
      }
    });
    await page.waitForTimeout(1000);
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
  console.log('\n📊 COMPREHENSIVE TEST REPORT');
  console.log('='.repeat(50));
  
  console.log('\n🎯 LOGO TESTS:');
  console.log(`  Font (Playfair Display): ${results.logo.font ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`  Color (Dusty Gold #B89B5E): ${results.logo.color ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`  Text ("VeroTrade"): ${results.logo.text ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`  Size (24px): ${results.logo.size ? '✅ PASS' : '❌ FAIL'}`);
  
  console.log('\n🎯 NAVIGATION TESTS:');
  console.log(`  Background (#121212): ${results.navigation.background ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`  Logout Button (Dusty Gold Border): ${results.navigation.logoutButton ? '✅ PASS' : '❌ FAIL'}`);
  
  console.log('\n🎯 RESPONSIVE TESTS:');
  console.log(`  Mobile (Logo Only): ${results.responsive.mobile ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`  Tablet (Logo + Text): ${results.responsive.tablet ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`  Desktop (Logo + Text): ${results.responsive.desktop ? '✅ PASS' : '❌ FAIL'}`);
  
  const allPassed = 
    results.logo.font && results.logo.color && results.logo.text && results.logo.size &&
    results.navigation.background && results.navigation.logoutButton &&
    results.responsive.mobile && results.responsive.tablet && results.responsive.desktop;
  
  console.log('\n🎯 OVERALL RESULT:');
  console.log(`  ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
  
  console.log('\n📸 SCREENSHOTS TAKEN:');
  results.screenshots.forEach(screenshot => {
    console.log(`  - ${screenshot}`);
  });
  
  // Save detailed results to JSON file
  const reportFile = `logo-navigation-test-report-${Date.now()}.json`;
  require('fs').writeFileSync(reportFile, JSON.stringify(results, null, 2));
  console.log(`\n📄 Detailed report saved: ${reportFile}`);
  
  return results;
}

// Run the test
testLogoAndNavigation().then(results => {
  console.log('\n🏁 Testing completed!');
  process.exit(0);
}).catch(error => {
  console.error('💥 Test execution failed:', error);
  process.exit(1);
});