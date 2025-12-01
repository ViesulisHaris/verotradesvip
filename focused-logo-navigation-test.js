const puppeteer = require('puppeteer');
const path = require('path');

async function testLogoAndNavigation() {
  console.log('🧪 Starting Focused Logo and Navigation Testing...\n');
  
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
    // Navigate to the login page first
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle2' });
    
    // Wait for the page to load completely
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Test 1: Logo Font Verification on Login Page
    console.log('📝 Testing Logo Font on Login Page...');
    const logoFont = await page.evaluate(() => {
      // Try multiple selectors to find the logo text
      const selectors = [
        'span[style*="VeroTrade"]',
        'span:contains("VeroTrade")',
        '.font-bold',
        '[style*="Playfair Display"]',
        'span'
      ];
      
      let logoText = null;
      for (const selector of selectors) {
        try {
          const element = selector.includes(':contains') 
            ? Array.from(document.querySelectorAll('span')).find(el => el.textContent === 'VeroTrade')
            : document.querySelector(selector);
          
          if (element && (element.textContent === 'VeroTrade' || element.style.fontFamily?.includes('Playfair'))) {
            logoText = element;
            break;
          }
        } catch (e) {
          // Continue to next selector
        }
      }
      
      if (!logoText) return null;
      
      const computedStyle = window.getComputedStyle(logoText);
      return {
        fontFamily: computedStyle.fontFamily,
        fontSize: computedStyle.fontSize,
        fontWeight: computedStyle.fontWeight,
        color: computedStyle.color,
        text: logoText.textContent,
        element: logoText.tagName + (logoText.className ? '.' + logoText.className : ''),
        style: logoText.getAttribute('style')
      };
    });
    
    if (logoFont) {
      console.log('Logo font details:', logoFont);
      
      // Check for Playfair Display font
      results.logo.font = logoFont.fontFamily.includes('Playfair Display') || logoFont.style?.includes('Playfair Display');
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
    } else {
      console.log('❌ Logo text element not found');
    }
    
    // Test 2: Check if TopNavigation component is present
    console.log('\n🎨 Testing Navigation Component...');
    const navComponent = await page.evaluate(() => {
      const nav = document.querySelector('nav');
      if (!nav) return null;
      
      const computedStyle = window.getComputedStyle(nav);
      return {
        backgroundColor: computedStyle.backgroundColor,
        background: computedStyle.background,
        height: computedStyle.height,
        position: computedStyle.position,
        top: computedStyle.top,
        zIndex: computedStyle.zIndex
      };
    });
    
    if (navComponent) {
      console.log('Navigation component details:', navComponent);
      // Check for #121212 background
      const bgColor = navComponent.backgroundColor.toUpperCase();
      results.navigation.background = bgColor === 'RGB(18, 18, 18)' || bgColor === '#121212';
      console.log(`✅ Navigation background #121212: ${results.navigation.background ? 'PASS' : 'FAIL'} (${bgColor})`);
    } else {
      console.log('❌ Navigation component not found on login page (expected)');
    }
    
    // Test 3: Try to access dashboard to test logout button
    console.log('\n🔘 Testing Logout Button on Dashboard...');
    try {
      // Try to navigate to dashboard directly
      await page.goto('http://localhost:3000/dashboard', { waitUntil: 'networkidle2' });
      await new Promise(resolve => setTimeout(resolve, 2000));
      
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
                                   logoutButton.border.includes('#B89B5E');
        results.navigation.logoutButton = hasDustyGoldBorder;
        console.log(`✅ Dusty gold border on logout: ${results.navigation.logoutButton ? 'PASS' : 'FAIL'}`);
      } else {
        console.log('⚠️ Logout button not found (may require authentication)');
      }
    } catch (error) {
      console.log('⚠️ Could not access dashboard for logout button test');
    }
    
    // Test 4: Responsive Behavior on Login Page
    console.log('\n📱 Testing Responsive Behavior...');
    
    // Mobile view
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle2' });
    await page.setViewport({ width: 375, height: 667 });
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const mobileLogo = await page.evaluate(() => {
      // Check if logo is visible and properly sized on mobile
      const logoContainer = document.querySelector('div[class*="flex justify-center"]');
      if (!logoContainer) return false;
      
      const logo = logoContainer.querySelector('div');
      if (!logo) return false;
      
      const computedStyle = window.getComputedStyle(logo);
      const width = parseInt(computedStyle.width);
      const height = parseInt(computedStyle.height);
      
      // Should be large size (48px) on login page
      return width === 48 && height === 48;
    });
    
    results.responsive.mobile = mobileLogo;
    console.log(`✅ Mobile responsive (48px logo): ${results.responsive.mobile ? 'PASS' : 'FAIL'}`);
    
    // Take mobile screenshot
    const mobileScreenshot = `logo-navigation-test-mobile-${Date.now()}.png`;
    await page.screenshot({ path: mobileScreenshot, fullPage: false });
    results.screenshots.push(mobileScreenshot);
    console.log(`📸 Mobile screenshot saved: ${mobileScreenshot}`);
    
    // Tablet view
    await page.setViewport({ width: 768, height: 1024 });
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const tabletLogo = await page.evaluate(() => {
      const logoContainer = document.querySelector('div[class*="flex justify-center"]');
      if (!logoContainer) return false;
      
      const logo = logoContainer.querySelector('div');
      if (!logo) return false;
      
      const computedStyle = window.getComputedStyle(logo);
      const width = parseInt(computedStyle.width);
      const height = parseInt(computedStyle.height);
      
      return width === 48 && height === 48;
    });
    
    results.responsive.tablet = tabletLogo;
    console.log(`✅ Tablet responsive (48px logo): ${results.responsive.tablet ? 'PASS' : 'FAIL'}`);
    
    // Take tablet screenshot
    const tabletScreenshot = `logo-navigation-test-tablet-${Date.now()}.png`;
    await page.screenshot({ path: tabletScreenshot, fullPage: false });
    results.screenshots.push(tabletScreenshot);
    console.log(`📸 Tablet screenshot saved: ${tabletScreenshot}`);
    
    // Desktop view
    await page.setViewport({ width: 1920, height: 1080 });
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const desktopLogo = await page.evaluate(() => {
      const logoContainer = document.querySelector('div[class*="flex justify-center"]');
      if (!logoContainer) return false;
      
      const logo = logoContainer.querySelector('div');
      if (!logo) return false;
      
      const computedStyle = window.getComputedStyle(logo);
      const width = parseInt(computedStyle.width);
      const height = parseInt(computedStyle.height);
      
      return width === 48 && height === 48;
    });
    
    results.responsive.desktop = desktopLogo;
    console.log(`✅ Desktop responsive (48px logo): ${results.responsive.desktop ? 'PASS' : 'FAIL'}`);
    
    // Take desktop screenshot
    const desktopScreenshot = `logo-navigation-test-desktop-${Date.now()}.png`;
    await page.screenshot({ path: desktopScreenshot, fullPage: false });
    results.screenshots.push(desktopScreenshot);
    console.log(`📸 Desktop screenshot saved: ${desktopScreenshot}`);
    
    // Take a detailed logo screenshot
    const logoDetailScreenshot = `logo-navigation-test-logo-detail-${Date.now()}.png`;
    await page.evaluate(() => {
      const logo = document.querySelector('div[class*="flex justify-center"]');
      if (logo) {
        logo.scrollIntoView({ behavior: 'instant', block: 'center' });
      }
    });
    await new Promise(resolve => setTimeout(resolve, 1000));
    await page.screenshot({ 
      path: logoDetailScreenshot, 
      clip: { x: 750, y: 200, width: 400, height: 150 }
    });
    results.screenshots.push(logoDetailScreenshot);
    console.log(`📸 Logo detail screenshot saved: ${logoDetailScreenshot}`);
    
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
  console.log(`  Mobile (48px logo): ${results.responsive.mobile ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`  Tablet (48px logo): ${results.responsive.tablet ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`  Desktop (48px logo): ${results.responsive.desktop ? '✅ PASS' : '❌ FAIL'}`);
  
  const logoTestsPassed = results.logo.font && results.logo.color && results.logo.text && results.logo.size;
  const navTestsPassed = results.navigation.background && results.navigation.logoutButton;
  const responsiveTestsPassed = results.responsive.mobile && results.responsive.tablet && results.responsive.desktop;
  
  console.log('\n🎯 DETAILED RESULTS:');
  console.log(`  Logo Implementation: ${logoTestsPassed ? '✅ MATCHES SPECIFICATIONS' : '❌ DOES NOT MATCH SPECIFICATIONS'}`);
  console.log(`  Navigation Implementation: ${navTestsPassed ? '✅ MATCHES SPECIFICATIONS' : '❌ DOES NOT MATCH SPECIFICATIONS'}`);
  console.log(`  Responsive Behavior: ${responsiveTestsPassed ? '✅ MATCHES SPECIFICATIONS' : '❌ DOES NOT MATCH SPECIFICATIONS'}`);
  
  const allPassed = logoTestsPassed && navTestsPassed && responsiveTestsPassed;
  
  console.log('\n🎯 OVERALL RESULT:');
  console.log(`  ${allPassed ? '✅ ALL CHANGES MATCH MOCKUP SPECIFICATIONS' : '❌ SOME CHANGES DO NOT MATCH MOCKUP SPECIFICATIONS'}`);
  
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