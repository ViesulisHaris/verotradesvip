// Test sidebar isolation page
const puppeteer = require('puppeteer');

async function testSidebarIsolation() {
  console.log('🔍 Testing sidebar isolation page...\n');
  
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  
  page.on('console', msg => {
    console.log('🌐 Browser:', msg.text());
  });
  
  page.on('pageerror', error => {
    console.log('❌ Page Error:', error.message);
  });
  
  try {
    console.log('📍 Navigating to sidebar isolation test page...');
    await page.goto('http://localhost:3000/test-sidebar-isolation', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    // Wait for page to load
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log('\n🔍 Checking for sidebar elements...');
    
    // Check for any sidebar elements
    const sidebarElements = await page.evaluate(() => {
      const aside = document.querySelector('aside');
      const testSections = document.querySelectorAll('[class*="border"]');
      
      return {
        hasAside: !!aside,
        asideHTML: aside ? aside.outerHTML.substring(0, 200) + '...' : null,
        testSectionsCount: testSections.length,
        bodyHTML: document.body.innerHTML.substring(0, 500) + '...'
      };
    });
    
    console.log('Sidebar elements:', sidebarElements);
    
    // Check for console errors
    const consoleErrors = await page.evaluate(() => {
      return window.consoleErrors || [];
    });
    console.log('Console errors:', consoleErrors);
    
  } catch (error) {
    console.error('❌ Error during test:', error);
  } finally {
    await browser.close();
  }
}

testSidebarIsolation().then(() => {
  console.log('\n✅ Sidebar isolation test completed');
}).catch(error => {
  console.error('❌ Test failed:', error);
});