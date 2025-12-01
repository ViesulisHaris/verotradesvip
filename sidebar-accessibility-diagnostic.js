// SIDEBAR ACCESSIBILITY DIAGNOSTIC TEST
// This test validates the sidebar/menu accessibility issue

const puppeteer = require('puppeteer');
const path = require('path');

async function runSidebarAccessibilityTest() {
  console.log('🔍 SIDEBAR ACCESSIBILITY DIAGNOSTIC TEST');
  console.log('='.repeat(60));
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1200, height: 800 }
  });
  
  try {
    const page = await browser.newPage();
    
    // Enable console logging from the page
    page.on('console', msg => {
      console.log('🌐 BROWSER:', msg.text());
    });
    
    // Test 1: Check home page (unauthenticated)
    console.log('\n📋 TEST 1: Home Page (Unauthenticated)');
    console.log('-'.repeat(40));
    
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
    
    // Check if UnifiedLayout is used
    const unifiedLayoutExists = await page.evaluate(() => {
      return document.querySelector('.verotrade-main-content') !== null;
    });
    
    console.log(`UnifiedLayout detected: ${unifiedLayoutExists ? '✅ YES' : '❌ NO'}`);
    
    // Check for sidebar
    const sidebarExists = await page.evaluate(() => {
      return document.querySelector('.verotrade-sidebar-overlay') !== null;
    });
    
    console.log(`Sidebar component exists: ${sidebarExists ? '✅ YES' : '❌ NO'}`);
    
    // Check for mobile menu button
    const mobileMenuButton = await page.evaluate(() => {
      return document.querySelector('.verotrade-mobile-menu-btn') !== null;
    });
    
    console.log(`Mobile menu button exists: ${mobileMenuButton ? '✅ YES' : '❌ NO'}`);
    
    // Check for top navigation
    const topNavExists = await page.evaluate(() => {
      return document.querySelector('.verotrade-persistent-top-nav') !== null;
    });
    
    console.log(`Top navigation exists: ${topNavExists ? '✅ YES' : '❌ NO'}`);
    
    // Test 2: Check mobile view
    console.log('\n📱 TEST 2: Mobile View (Unauthenticated)');
    console.log('-'.repeat(40));
    
    await page.setViewport({ width: 375, height: 667 }); // iPhone size
    await page.waitForTimeout(1000);
    
    const mobileMenuButtonMobile = await page.evaluate(() => {
      return document.querySelector('.verotrade-mobile-menu-btn') !== null;
    });
    
    console.log(`Mobile menu button (mobile view): ${mobileMenuButtonMobile ? '✅ YES' : '❌ NO'}`);
    
    // Test 3: Check login page
    console.log('\n🔐 TEST 3: Login Page');
    console.log('-'.repeat(40));
    
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle2' });
    
    const loginPageSidebar = await page.evaluate(() => {
      return document.querySelector('.verotrade-sidebar-overlay') !== null;
    });
    
    console.log(`Sidebar on login page: ${loginPageSidebar ? '✅ YES' : '❌ NO'}`);
    
    // Test 4: Check dashboard (will redirect to login)
    console.log('\n📊 TEST 4: Dashboard Page (Redirect Test)');
    console.log('-'.repeat(40));
    
    await page.goto('http://localhost:3000/dashboard', { waitUntil: 'networkidle2' });
    
    const currentUrl = page.url();
    const redirectedToLogin = currentUrl.includes('/login');
    
    console.log(`Redirected to login: ${redirectedToLogin ? '✅ YES' : '❌ NO'}`);
    console.log(`Current URL: ${currentUrl}`);
    
    // Test 5: Analyze authentication state
    console.log('\n🔍 TEST 5: Authentication State Analysis');
    console.log('-'.repeat(40));
    
    const authState = await page.evaluate(() => {
      // Check for auth context indicators
      const authGuardDebug = Array.from(document.querySelectorAll('*'))
        .filter(el => el.textContent && el.textContent.includes('AuthGuard State'))
        .map(el => el.textContent.trim());
      
      return {
        authGuardDebugMessages: authGuardDebug,
        hasAuthContext: !!window.__AUTH_CONTEXT__,
        userAuthenticated: false // Will be updated if we can detect auth state
      };
    });
    
    console.log('Auth Guard debug messages:', authState.authGuardDebugMessages);
    console.log(`Auth context available: ${authState.hasAuthContext ? '✅ YES' : '❌ NO'}`);
    
    // Test 6: Component structure analysis
    console.log('\n🏗️ TEST 6: Component Structure Analysis');
    console.log('-'.repeat(40));
    
    const componentStructure = await page.evaluate(() => {
      const sidebar = document.querySelector('.verotrade-sidebar-overlay');
      const topNav = document.querySelector('.verotrade-persistent-top-nav');
      const mainContent = document.querySelector('.verotrade-main-content');
      
      return {
        sidebar: {
          exists: !!sidebar,
          display: sidebar ? window.getComputedStyle(sidebar).display : 'N/A',
          visibility: sidebar ? window.getComputedStyle(sidebar).visibility : 'N/A',
          transform: sidebar ? window.getComputedStyle(sidebar).transform : 'N/A'
        },
        topNav: {
          exists: !!topNav,
          display: topNav ? window.getComputedStyle(topNav).display : 'N/A',
          visibility: topNav ? window.getComputedStyle(topNav).visibility : 'N/A'
        },
        mainContent: {
          exists: !!mainContent,
          display: mainContent ? window.getComputedStyle(mainContent).display : 'N/A'
        }
      };
    });
    
    console.log('Component Structure:');
    console.log(JSON.stringify(componentStructure, null, 2));
    
    // Summary
    console.log('\n📋 DIAGNOSTIC SUMMARY');
    console.log('='.repeat(60));
    console.log('🔍 PRIMARY FINDINGS:');
    console.log(`1. Home page uses UnifiedLayout: ${unifiedLayoutExists ? '✅ YES' : '❌ NO'}`);
    console.log(`2. Sidebar renders for unauthenticated users: ${sidebarExists ? '✅ YES' : '❌ NO'}`);
    console.log(`3. Mobile menu button available: ${mobileMenuButton ? '✅ YES' : '❌ NO'}`);
    console.log(`4. Top navigation available: ${topNavExists ? '✅ YES' : '❌ NO'}`);
    console.log(`5. Auth guard redirects properly: ${redirectedToLogin ? '✅ YES' : '❌ NO'}`);
    
    console.log('\n🎯 LIKELY ISSUES:');
    if (!sidebarExists) {
      console.log('❌ Sidebar is completely hidden for unauthenticated users');
    }
    if (!mobileMenuButton) {
      console.log('❌ Mobile menu button is not available for unauthenticated users');
    }
    if (!unifiedLayoutExists) {
      console.log('❌ Home page does not use UnifiedLayout');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
}

// Run the test
runSidebarAccessibilityTest().catch(console.error);