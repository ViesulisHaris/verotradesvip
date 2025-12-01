const puppeteer = require('puppeteer');

async function comprehensiveUITest() {
  console.log('🔍 Running comprehensive UI test...');
  
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  
  // Enable console log from the browser
  page.on('console', msg => console.log('BROWSER:', msg.text()));
  
  try {
    // Navigate to home page
    console.log('Navigating to home page...');
    await page.goto('http://localhost:3000');
    
    // Wait for authentication to initialize
    console.log('Waiting for authentication to initialize...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Check page content and styling
    console.log('Checking page content and styling...');
    const pageData = await page.evaluate(() => {
      // Get all computed styles for the body
      const bodyStyles = getComputedStyle(document.body);
      
      // Check if the page has the expected title
      const title = document.title;
      
      // Check if there are any visible elements
      const visibleElements = document.querySelectorAll('*:not(script):not(style):not(link):not(meta)');
      const visibleTexts = Array.from(visibleElements)
        .filter(el => el.textContent && el.textContent.trim() && 
                     el.offsetParent !== null && 
                     getComputedStyle(el).display !== 'none' &&
                     getComputedStyle(el).visibility !== 'hidden')
        .map(el => el.textContent.trim());
      
      // Check for specific UI components
      const hasSidebar = document.querySelector('.verotrade-sidebar') !== null;
      const hasMainContent = document.querySelector('.verotrade-main-content') !== null;
      const hasNavigation = document.querySelector('nav') !== null;
      
      return {
        title,
        bodyStyles: {
          backgroundColor: bodyStyles.backgroundColor,
          color: bodyStyles.color,
          fontFamily: bodyStyles.fontFamily,
          fontSize: bodyStyles.fontSize,
        },
        visibleTexts: visibleTexts.slice(0, 10), // Limit to first 10 texts
        hasComponents: {
          sidebar: hasSidebar,
          mainContent: hasMainContent,
          navigation: hasNavigation,
        },
        bodyClasses: Array.from(document.body.classList),
      };
    });
    
    console.log('\n=== COMPREHENSIVE UI TEST RESULTS ===');
    console.log('Page Title:', pageData.title);
    console.log('\nBody Styles:', JSON.stringify(pageData.bodyStyles, null, 2));
    console.log('\nVisible Texts:', pageData.visibleTexts);
    console.log('\nComponents Found:', JSON.stringify(pageData.hasComponents, null, 2));
    console.log('\nBody Classes:', pageData.bodyClasses);
    
    // Evaluate test results
    let testsPassed = 0;
    let totalTests = 5;
    
    // Test 1: Page title
    if (pageData.title === 'VeroTrade') {
      console.log('✅ Test PASSED: Page title is correct');
      testsPassed++;
    } else {
      console.log('❌ Test FAILED: Page title is incorrect');
    }
    
    // Test 2: Body has styling
    if (pageData.bodyStyles.backgroundColor !== 'rgba(0, 0, 0, 0)' && 
        pageData.bodyStyles.color !== 'rgb(0, 0, 0)') {
      console.log('✅ Test PASSED: Body has styling applied');
      testsPassed++;
    } else {
      console.log('❌ Test FAILED: Body styling not applied');
    }
    
    // Test 3: Visible content
    if (pageData.visibleTexts.length > 0) {
      console.log('✅ Test PASSED: Page has visible content');
      testsPassed++;
    } else {
      console.log('❌ Test FAILED: No visible content found');
    }
    
    // Test 4: UI components
    if (pageData.hasComponents.sidebar || pageData.hasComponents.mainContent || pageData.hasComponents.navigation) {
      console.log('✅ Test PASSED: UI components found');
      testsPassed++;
    } else {
      console.log('❌ Test FAILED: No UI components found');
    }
    
    // Test 5: Body has custom classes
    if (pageData.bodyClasses.length > 0 && pageData.bodyClasses.some(cls => cls !== 'h-full')) {
      console.log('✅ Test PASSED: Body has custom classes');
      testsPassed++;
    } else {
      console.log('❌ Test FAILED: No custom body classes found');
    }
    
    console.log(`\nTests Passed: ${testsPassed}/${totalTests}`);
    
    if (testsPassed === totalTests) {
      console.log('🎉 ALL TESTS PASSED: Application is displaying correctly with proper styling');
    } else {
      console.log('⚠️  SOME TESTS FAILED: Application has issues with styling or content display');
    }
    
    // Take a screenshot for visual verification
    await page.screenshot({ path: 'comprehensive-ui-test.png', fullPage: true });
    console.log('Screenshot saved as comprehensive-ui-test.png');
    
  } catch (error) {
    console.error('Error during comprehensive UI test:', error);
  } finally {
    await browser.close();
  }
}

comprehensiveUITest();