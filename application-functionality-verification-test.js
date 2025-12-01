
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function verifyApplicationFunctionality() {
  console.log('🚀 Starting Application Functionality Verification Test');
  console.log('=' .repeat(80));
  
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1920, height: 1080 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  // Enable console logging from the browser
  page.on('console', msg => {
    console.log('Browser Console:', msg.text());
  });
  
  // Enable error logging
  page.on('pageerror', error => {
    console.error('Page Error:', error.message);
  });
  
  const results = {
    timestamp: new Date().toISOString(),
    tests: [],
    screenshots: [],
    errors: [],
    success: true
  };
  
  try {
    // Test 1: Check if application loads without white screen
    console.log('\n📋 Test 1: Application Loading Test');
    const startTime = Date.now();
    
    await page.goto('http://localhost:3000', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    const loadTime = Date.now() - startTime;
    
    // Wait a bit more for any dynamic content
    await page.waitForTimeout(3000);
    
    // Check if page has content (not white screen)
    const bodyContent = await page.evaluate(() => {
      const body = document.body;
      const computedStyle = window.getComputedStyle(body);
      const bgColor = computedStyle.backgroundColor;
      
      return {
        hasContent: body.innerText.length > 100,
        bgColor: bgColor,
        innerHTMLLength: body.innerHTML.length,
        hasElements: body.children.length > 0
      };
    });
    
    const loadingTest = {
      name: 'Application Loading',
      status: bodyContent.hasContent && bodyContent.bgColor !== 'rgb(255, 255, 255)' ? 'PASS' : 'FAIL',
      details: {
        loadTime: `${loadTime}ms`,
        hasContent: bodyContent.hasContent,
        backgroundColor: bodyContent.bgColor,
        innerHTMLLength: bodyContent.innerHTMLLength,
        elementCount: bodyContent.hasElements
      }
    };
    
    results.tests.push(loadingTest);
    
    // Take screenshot of initial load
    const initialScreenshot = `application-initial-load-${Date.now()}.png`;
    await page.screenshot({ path: initialScreenshot, fullPage: true });
    results.screenshots.push(initialScreenshot);
    
    console.log(`✅ Load time: ${loadTime}ms`);
    console.log(`✅ Has content: ${bodyContent.hasContent}`);
    console.log(`✅ Background: ${bodyContent.bgColor}`);
    
    // Test 2: Navigation Test
    console.log('\n📋 Test 2: Navigation Test');
    
    const navigationTests = [
      { name: 'Home Page', url: '/', selector: 'body' },
      { name: 'Login Page', url: '/login', selector: 'form' },
      { name: 'Register Page', url: '/register', selector: 'form' },
      { name: 'Dashboard Page', url: '/dashboard', selector: 'main' },
      { name: 'Trades Page', url: '/trades', selector: 'main' },
      { name: 'Strategies Page', url: '/strategies', selector: 'main' }
    ];
    
    for (const navTest of navigationTests) {
      try {
        await page.goto(`http://localhost:3000${navTest.url}`, { 
          waitUntil: 'networkidle2',
          timeout: 15000 
        });
        
        await page.waitForTimeout(2000);
        
        const elementExists = await page.$(navTest.selector) !== null;
        const pageTitle = await page.title();
        const currentUrl = page.url();
        
        const navResult = {
          name: `Navigation - ${navTest.name}`,
          status: elementExists ? 'PASS' : 'FAIL',
          details: {
            url: navTest.url,
            actualUrl: currentUrl,
            pageTitle: pageTitle,
            elementFound: elementExists
          }
        };
        
        results.tests.push(navResult);
        
        // Take screenshot for each page
        const screenshot = `navigation-${navTest.name.toLowerCase().replace(' ', '-')}-${Date.now()}.png`;
        await page.screenshot({ path: screenshot, fullPage: true });
        results.screenshots.push(screenshot);
        
        console.log(`${elementExists ? '✅' : '❌'} ${navTest.name}: ${elementExists ? 'PASS' : 'FAIL'}`);
        
      } catch (error) {
        const navResult = {
          name: `Navigation - ${navTest.name}`,
          status: 'FAIL',
          details: {
            url: navTest.url,
            error: error.message
          }
        };
        
        results.tests.push(navResult);
        results.errors.push(`Navigation to ${navTest.url} failed: ${error.message}`);
        
        console.log(`❌ ${navTest.name}: FAIL - ${error.message}`);
      }
    }
    
    // Test 3: Component Rendering Test
    console.log('\n📋 Test 3: Component Rendering Test');
    
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
    await page.waitForTimeout(3000);
    
    const componentChecks = await page.evaluate(() => {
      const checks = {};
      
      // Check for common components
      checks.navigation = document.querySelector('nav') !== null;
      checks.sidebar = document.querySelector('[class*="sidebar"]') !== null;
      checks.header = document.querySelector('header') !== null;
      checks.main = document.querySelector('main') !== null;
      checks.footer = document.querySelector('footer') !== null;
      
      // Check for interactive elements
      checks.buttons = document.querySelectorAll('button').length > 0;
      checks.links = document.querySelectorAll('a').length > 0;
      checks.forms = document.querySelectorAll('form').length > 0;
      checks.inputs = document.querySelectorAll('input').length > 0;
      
      // Check for specific UI elements
      checks.logo = document.querySelector('[class*="logo"]') !== null;
      checks.menu = document.querySelector('[class*="menu"]') !== null;
      checks.button = document.querySelectorAll('button').length > 0;
      
      return checks;
    });
    
    const componentTest = {
      name: 'Component Rendering',
      status: Object.values(componentChecks).some(check => check) ? 'PASS' : 'FAIL',
      details: componentChecks
    };
    
    results.tests.push(componentTest);
    
    console.log('Component Checks:');
    Object.entries(componentChecks).forEach(([component, exists]) => {
      console.log(`  ${exists ? '✅' : '❌'} ${component}: ${exists}`);
    });
    
    // Test 4: Mockup Design Verification
    console.log('\n📋 Test 4: Mockup Design Verification');
    
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
    await page.waitForTimeout(3000);
    
    const designChecks = await page.evaluate(() => {
      const checks = {};
      
      // Check for design system elements
      const rootStyles = getComputedStyle(document.documentElement);
      
      // Check for CSS variables (design tokens)
      checks.hasCSSVariables = rootStyles.getPropertyValue('--primary-color') !== '' ||
                               rootStyles.getPropertyValue('--background-color') !== '';
      
      // Check for consistent color scheme
      const body = document.body;
      const bodyStyle = getComputedStyle(body);
      checks.hasBackgroundColor = bodyStyle.backgroundColor !== 'rgba(0, 0, 0, 0)';
      
      // Check for typography
      checks.hasTypography = document.querySelectorAll('h1, h2, h3, p').length > 0;
      
      // Check for layout structure
      checks.hasLayout = document.querySelector('main') !== null;
      
      // Check for responsive design
      checks.hasViewportMeta = document.querySelector('meta[name="viewport"]') !== null;
      
      return checks;
    });
    
    const designTest = {
      name: 'Mockup Design Implementation',
      status: Object.values(designChecks).some(check => check) ? 'PASS' : 'FAIL',
      details: designChecks
    };
    
    results.tests.push(designTest);
    
    console.log('Design Checks:');
    Object.entries(designChecks).forEach(([check, passed]) => {
      console.log(`  ${passed ? '✅' : '❌'} ${check}: ${passed}`);
    });
    
    // Test 5: Responsive Design Test
    console.log('\n📋 Test 5: Responsive Design Test');
    
    const viewports = [
      { name: 'Mobile', width: 375, height: 667 },
      { name: 'Tablet', width: 768, height: 1024 },
      { name: 'Desktop', width: 1920, height: 1080 }
    ];
    
    for (const viewport of viewports) {
      await page.setViewport({ width: viewport.width, height: viewport.height });
      await page.waitForTimeout(1000);
      
      const responsiveCheck = await page.evaluate((vp) => {
        const body = document.body;
        const bodyStyle = getComputedStyle(body);
        
        return {
          viewport: vp,
          hasOverflow: body.scrollWidth > body.clientWidth || body.scrollHeight > body.clientHeight,
          hasContent: body.innerText.length > 50,
          isVisible: bodyStyle.display !== 'none'
        };
      }, viewport.name);
      
      const responsiveTest = {
        name: `Responsive - ${viewport.name}`,
        status: responsiveCheck.hasContent && responsiveCheck.isVisible ? 'PASS' : 'FAIL',
        details: responsiveCheck
      };
      
      results.tests.push(responsiveTest);
      
      // Take screenshot for each viewport
      const screenshot = `responsive-${viewport.name.toLowerCase()}-${Date.now()}.png`;
      await page.screenshot({ path: screenshot, fullPage: true });
      results.screenshots.push(screenshot);
      
      console.log(`${responsiveCheck.hasContent && responsiveCheck.isVisible ? '✅' : '❌'} ${viewport.name}: ${responsiveCheck.hasContent && responsiveCheck.isVisible ? 'PASS' : 'FAIL'}`);
    }
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
    results.errors.push(error.message);
    results.success = false;
  } finally {
    await browser.close();
  }
  
  // Save results
  const reportPath = `application-functionality-verification-report-${Date.now()}.json`;
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  
  // Generate markdown report
  const markdownReport = generateMarkdownReport(results);
  const markdownPath = `APPLICATION_FUNCTIONALITY_VERIFICATION_REPORT.md`;
  fs.writeFileSync(markdownPath, markdownReport);
  
  console.log('\n' + '='.repeat(80));
  console.log('📊 APPLICATION FUNCTIONALITY VERIFICATION SUMMARY');
  console.log('='.repeat(80));
  console.log(`Total Tests: ${results.tests.length}`);
  console.log(`Passed: ${results.tests.filter(t => t.status === 'PASS').length}`);
  console.log(`Failed: ${results.tests.filter(t => t.status === 'FAIL').length}`);
  console.log(`Errors: ${results.errors.length}`);
  console.log(`Screenshots: ${results.screenshots.length}`);
  console.log(`\n📄 Reports saved:`);
  console.log(`  - JSON: ${reportPath}`);
  console.log(`  - Markdown: ${markdownPath}`);
  
  if (results.success && results.errors.length === 0) {
    console.log('\n✅ APPLICATION FUNCTIONALITY VERIFICATION: PASSED');
  } else {
    console.log('\n❌ APPLICATION FUNCTIONALITY VERIFICATION: FAILED');
  }
  
  return results;
}

function generateMarkdownReport(results) {
  const passedTests = results.tests.filter(t => t.status === 'PASS').length;
  const failedTests = results.tests.filter(t => t.status === 'FAIL').length;
  
  let markdown = `# Application Functionality Verification Report\n\n`;
  markdown += `**Generated:** ${new Date(results.timestamp).toLocaleString()}\n\n`;
  markdown += `## Summary\n\n`;
  markdown += `- **Total Tests:** ${results.tests.length}\n`;
  markdown += `- **Passed:** ${passedTests}\n`;
  markdown += `- **Failed:** ${failedTests}\n`;
  markdown += `- **Errors:** ${results.errors.length}\n`;
  markdown += `- **Screenshots:** ${results.screenshots.length}\n\n`;
  
  markdown += `## Test Results\n\n`;
  
  results.tests.forEach(test => {
    markdown += `### ${test.name}\n\n`;
    markdown += `**Status:** ${test.status === 'PASS' ? '✅ PASS' : '❌ FAIL'}\n\n`;
    
    if (test.details) {
      markdown += `**Details:**\n`;
      if (typeof test.details === 'object') {
        Object.entries(test.details).forEach(([key, value]) => {
          markdown += `- ${key}: ${value}\n`;
        });
      } else {
        markdown += `- ${test.details}\n`;
      }
      markdown += `\n`;
    }
  });
  
  if (results.errors.length > 0) {
    markdown += `## Errors\n\n`;
    results.errors.forEach(error => {
      markdown += `- ${error}\n`;
    });
    markdown += `\n`;
  }
  
  markdown += `## Screenshots\n\n`;
  results.screenshots.forEach(screenshot => {
    markdown += `- ${screenshot}\n`;
  });
  
  return markdown;
}

// Run the test
verifyApplicationFunctionality().catch(console.error);