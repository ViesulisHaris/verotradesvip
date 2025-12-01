/**
 * Comprehensive Application Test
 * 
 * This script tests all major functionality of the trading journal application
 * to ensure it loads properly without white screen and all features work correctly.
 */

const puppeteer = require('puppeteer');

const testResults = {
  compilation: { passed: false, issues: [] },
  authentication: { passed: false, issues: [] },
  navigation: { passed: false, issues: [] },
  responsive: { passed: false, issues: [] },
  pages: { passed: false, issues: [] },
  overall: { passed: false, issues: [] }
};

async function runComprehensiveTest() {
  console.log('🚀 Starting Comprehensive Application Test...');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1280, height: 720 },
    args: ['--no-sandbox', '--disable-web-security']
  });

  try {
    const page = await browser.newPage();
    
    // Test 1: Application Loading
    console.log('📋 Test 1: Application Loading...');
    await page.goto('http://localhost:3000');
    await page.waitForSelector('body', { timeout: 10000 });
    
    const bodyContent = await page.evaluate(() => document.body.innerHTML);
    if (bodyContent.includes('Loading...') || bodyContent.trim() === '') {
      testResults.compilation.issues.push('Application shows loading screen or white screen');
    } else {
      testResults.compilation.passed = true;
    }
    
    // Test 2: Authentication System
    console.log('🔐 Test 2: Authentication System...');
    await page.goto('http://localhost:3000/login');
    
    // Test login form
    await page.waitForSelector('#email', { timeout: 5000 });
    await page.type('#email', 'test@example.com');
    await page.type('#password', 'testpassword123');
    await page.click('button[type="submit"]');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Check if login redirects to dashboard
    const currentUrl = page.url();
    if (currentUrl.includes('/dashboard')) {
      testResults.authentication.passed = true;
    } else {
      testResults.authentication.issues.push('Login redirect not working');
    }
    
    // Test 3: Navigation System
    console.log('🧭 Test 3: Navigation System...');
    
    // Test if we can access dashboard
    await page.goto('http://localhost:3000/dashboard');
    await page.waitForSelector('main', { timeout: 5000 });
    
    // Check for navigation elements
    const hasNavigation = await page.evaluate(() => {
      const sidebar = document.querySelector('aside');
      const topNav = document.querySelector('nav');
      return !!(sidebar && topNav);
    });
    
    if (hasNavigation) {
      testResults.navigation.issues.push('Navigation elements not found');
    } else {
      testResults.navigation.passed = true;
    }
    
    // Test 4: Responsive Design
    console.log('📱 Test 4: Responsive Design...');
    
    const viewports = [
      { width: 375, height: 667, name: 'Mobile' },
      { width: 768, height: 1024, name: 'Tablet' },
      { width: 1280, height: 720, name: 'Desktop' },
      { width: 1920, height: 1080, name: 'Large Desktop' }
    ];
    
    for (const viewport of viewports) {
      console.log(`📱 Testing ${viewport.name} viewport: ${viewport.width}x${viewport.height}`);
      await page.setViewport(viewport);
      await page.goto('http://localhost:3000/dashboard');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Check for responsive layout issues
      const hasLayoutIssues = await page.evaluate(() => {
        const main = document.querySelector('main');
        const sidebar = document.querySelector('aside');
        
        if (!main || !sidebar) return true;
        
        const mainWidth = main.offsetWidth;
        const sidebarWidth = sidebar.offsetWidth;
        const totalWidth = mainWidth + sidebarWidth;
        const viewportWidth = window.innerWidth;
        
        // Check if layout breaks on smaller screens
        if (viewport.width < 1024 && totalWidth > viewportWidth * 0.95) {
          return true;
        }
        
        return false;
      });
      
      if (hasLayoutIssues) {
        testResults.responsive.issues.push(`Layout issues on ${viewport.name} viewport`);
      }
    }
    
    // Test 5: Page Loading
    console.log('📄 Test 5: Page Loading...');
    const pages = [
      '/strategies',
      '/trades',
      '/log-trade',
      '/calendar',
      '/confluence'
    ];
    
    for (const pageUrl of pages) {
      console.log(`📄 Testing page: ${pageUrl}`);
      await page.goto(`http://localhost:3000${pageUrl}`);
      await page.waitForSelector('body', { timeout: 5000 });
      
      const hasContent = await page.evaluate(() => {
        const body = document.body;
        return body.innerHTML.trim().length > 100;
      });
      
      if (!hasContent) {
        testResults.pages.issues.push(`Page ${pageUrl} appears empty or has loading issues`);
      } else {
        testResults.pages.passed = true;
      }
    }
    
    // Test 6: Error Handling
    console.log('⚠️ Test 6: Error Handling...');
    
    // Test error boundary
    await page.goto('http://localhost:3000/non-existent-page');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const hasErrorPage = await page.evaluate(() => {
      return document.body.innerHTML.includes('Something went wrong') || 
             document.body.innerHTML.includes('404') ||
             document.body.innerHTML.includes('Page not found');
    });
    
    if (hasErrorPage) {
      testResults.compilation.passed = true;
    } else {
      testResults.compilation.issues.push('Error handling not working properly');
    }
    
    // Calculate overall results
    const allTests = [
      testResults.compilation.passed,
      testResults.authentication.passed,
      testResults.navigation.passed,
      testResults.responsive.passed,
      testResults.pages.passed,
      testResults.compilation.passed // Error handling test
    ];
    
    testResults.overall.passed = allTests.every(test => test);
    testResults.overall.issues = [
      ...testResults.compilation.issues,
      ...testResults.authentication.issues,
      ...testResults.navigation.issues,
      ...testResults.responsive.issues,
      ...testResults.pages.issues
    ];
    
    console.log('\n📊 COMPREHENSIVE TEST RESULTS:');
    console.log('✅ Compilation:', testResults.compilation.passed ? 'PASSED' : 'FAILED');
    console.log('✅ Authentication:', testResults.authentication.passed ? 'PASSED' : 'FAILED');
    console.log('✅ Navigation:', testResults.navigation.passed ? 'PASSED' : 'FAILED');
    console.log('✅ Responsive:', testResults.responsive.passed ? 'PASSED' : 'FAILED');
    console.log('✅ Pages:', testResults.pages.passed ? 'PASSED' : 'FAILED');
    console.log('✅ Overall:', testResults.overall.passed ? 'PASSED' : 'FAILED');
    
    if (testResults.overall.issues.length > 0) {
      console.log('\n❌ ISSUES FOUND:');
      testResults.overall.issues.forEach(issue => console.log(`  - ${issue}`));
    }
    
    await browser.close();
    
    return testResults;
  } catch (error) {
    console.error('Comprehensive test failed:', error);
    testResults.overall.issues.push(`Test execution error: ${error.message}`);
    return testResults;
  }
}

// Run the test if this script is executed directly
if (require.main === module) {
  runComprehensiveTest().then(results => {
    console.log('\n🎯 Test completed. Results:', JSON.stringify(results, null, 2));
    process.exit(results.overall.passed ? 0 : 1);
  }).catch(error => {
    console.error('Test failed:', error);
    process.exit(1);
  });
}

module.exports = { runComprehensiveTest };