// SIMPLE SIDEBAR ACCESSIBILITY TEST
const puppeteer = require('puppeteer');

async function runSimpleSidebarTest() {
  console.log('🔍 SIMPLE SIDEBAR ACCESSIBILITY TEST');
  console.log('='.repeat(50));
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1200, height: 800 }
  });
  
  try {
    const page = await browser.newPage();
    
    // Test 1: Home page
    console.log('\n📋 Home Page Test:');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
    
    const homePageAnalysis = await page.evaluate(() => {
      return {
        title: document.title,
        url: window.location.href,
        hasUnifiedLayout: !!document.querySelector('.verotrade-main-content'),
        hasSidebar: !!document.querySelector('.verotrade-sidebar-overlay'),
        hasTopNav: !!document.querySelector('.verotrade-persistent-top-nav'),
        hasMobileMenu: !!document.querySelector('.verotrade-mobile-menu-btn'),
        bodyText: document.body.innerText.substring(0, 200)
      };
    });
    
    console.log(JSON.stringify(homePageAnalysis, null, 2));
    
    // Test 2: Dashboard page (should redirect)
    console.log('\n📊 Dashboard Page Test:');
    await page.goto('http://localhost:3000/dashboard', { waitUntil: 'networkidle2' });
    
    const dashboardAnalysis = await page.evaluate(() => {
      return {
        title: document.title,
        url: window.location.href,
        hasUnifiedLayout: !!document.querySelector('.verotrade-main-content'),
        hasSidebar: !!document.querySelector('.verotrade-sidebar-overlay'),
        hasTopNav: !!document.querySelector('.verotrade-persistent-top-nav'),
        hasMobileMenu: !!document.querySelector('.verotrade-mobile-menu-btn'),
        bodyText: document.body.innerText.substring(0, 200)
      };
    });
    
    console.log(JSON.stringify(dashboardAnalysis, null, 2));
    
    // Test 3: Login page
    console.log('\n🔐 Login Page Test:');
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle2' });
    
    const loginAnalysis = await page.evaluate(() => {
      return {
        title: document.title,
        url: window.location.href,
        hasUnifiedLayout: !!document.querySelector('.verotrade-main-content'),
        hasSidebar: !!document.querySelector('.verotrade-sidebar-overlay'),
        hasTopNav: !!document.querySelector('.verotrade-persistent-top-nav'),
        hasMobileMenu: !!document.querySelector('.verotrade-mobile-menu-btn'),
        bodyText: document.body.innerText.substring(0, 200)
      };
    });
    
    console.log(JSON.stringify(loginAnalysis, null, 2));
    
    console.log('\n🎯 SUMMARY:');
    console.log('='.repeat(30));
    console.log('Home page uses UnifiedLayout:', homePageAnalysis.hasUnifiedLayout ? '✅' : '❌');
    console.log('Home page has sidebar:', homePageAnalysis.hasSidebar ? '✅' : '❌');
    console.log('Dashboard redirects correctly:', dashboardAnalysis.url.includes('/login') ? '✅' : '❌');
    console.log('Login page has sidebar:', loginAnalysis.hasSidebar ? '✅' : '❌');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    setTimeout(() => browser.close(), 2000); // Give time to see results
  }
}

runSimpleSidebarTest();