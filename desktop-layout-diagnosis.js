/**
 * Desktop Layout Diagnosis Script
 * 
 * This script validates assumptions about why the desktop layout verification failed
 */

const puppeteer = require('puppeteer');
const fs = require('fs');

async function diagnoseDesktopLayout() {
  console.log('🔍 Diagnosing Desktop Layout Issues...');
  
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  try {
    // Set desktop viewport
    await page.setViewport({ width: 1920, height: 1080 });
    
    // Enable console logging from the page
    page.on('console', msg => console.log('PAGE:', msg.text()));
    page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
    
    console.log('\n📱 Navigating to dashboard...');
    await page.goto('http://localhost:3000/dashboard', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    // Wait a bit more for any dynamic content
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log('\n🔍 Checking page state...');
    
    // Check if we're on the right page
    const currentUrl = page.url();
    console.log('Current URL:', currentUrl);
    
    // Check for authentication redirects
    const isLoginPage = await page.evaluate(() => {
      return window.location.pathname.includes('/login') || 
             window.location.pathname.includes('/auth');
    });
    console.log('Is login/auth page:', isLoginPage);
    
    // Check page title
    const title = await page.title();
    console.log('Page title:', title);
    
    // Check for any error messages
    const errorElements = await page.evaluate(() => {
      const errors = document.querySelectorAll('[class*="error"], [class*="Error"]');
      return Array.from(errors).map(el => el.textContent);
    });
    console.log('Error elements found:', errorElements);
    
    console.log('\n🏗️ Analyzing DOM structure...');
    
    // Get all elements with their classes
    const domAnalysis = await page.evaluate(() => {
      const analysis = {
        bodyClasses: document.body.className,
        hasAside: !!document.querySelector('aside'),
        hasMain: !!document.querySelector('main'),
        hasGrid: !!document.querySelector('.grid'),
        hasMaxW7xl: !!document.querySelector('.max-w-7xl'),
        allGridClasses: [],
        allAsideElements: [],
        allMainElements: [],
        responsiveBreakpoints: {}
      };
      
      // Find all grid-related classes
      const allElements = document.querySelectorAll('*');
      allElements.forEach(el => {
        const classes = el.className.split(' ').filter(cls => cls.includes('grid'));
        if (classes.length > 0) {
          analysis.allGridClasses.push(...classes);
        }
      });
      
      // Find all aside elements
      document.querySelectorAll('aside').forEach(el => {
        analysis.allAsideElements.push({
          classes: el.className,
          display: window.getComputedStyle(el).display,
          visibility: window.getComputedStyle(el).visibility,
          width: window.getComputedStyle(el).width
        });
      });
      
      // Find all main elements
      document.querySelectorAll('main').forEach(el => {
        analysis.allMainElements.push({
          classes: el.className,
          display: window.getComputedStyle(el).display,
          marginLeft: window.getComputedStyle(el).marginLeft,
          width: window.getComputedStyle(el).width
        });
      });
      
      // Check viewport width and responsive classes
      analysis.responsiveBreakpoints = {
        viewportWidth: window.innerWidth,
        isDesktop: window.innerWidth >= 1024,
        hasLgClasses: document.querySelectorAll('[class*="lg:"]').length,
        hasMdClasses: document.querySelectorAll('[class*="md:"]').length,
        hasSmClasses: document.querySelectorAll('[class*="sm:"]').length
      };
      
      return analysis;
    });
    
    console.log('DOM Analysis:', JSON.stringify(domAnalysis, null, 2));
    
    console.log('\n🎯 Checking specific CSS selectors...');
    
    // Test specific selectors the verification script uses
    const selectorTests = await page.evaluate(() => {
      const tests = {
        'aside': !!document.querySelector('aside'),
        '.grid-cols-4': !!document.querySelector('.grid-cols-4'),
        '[class*="grid-cols-4"]': !!document.querySelector('[class*="grid-cols-4"]'),
        '.max-w-7xl': !!document.querySelector('.max-w-7xl'),
        'main': !!document.querySelector('main'),
        '.grid': !!document.querySelector('.grid'),
        '[class*="grid"]': !!document.querySelector('[class*="grid"]'),
        'button[aria-label*="sidebar"]': !!document.querySelector('button[aria-label*="sidebar"]'),
        'button[title*="sidebar"]': !!document.querySelector('button[title*="sidebar"]'),
        'button[aria-label*="Sidebar"]': !!document.querySelector('button[aria-label*="Sidebar"]'),
        'button[title*="Sidebar"]': !!document.querySelector('button[title*="Sidebar"]')
      };
      
      return tests;
    });
    
    console.log('Selector Tests:', selectorTests);
    
    console.log('\n📸 Taking screenshot for visual analysis...');
    await page.screenshot({ 
      path: './desktop-layout-diagnosis.png', 
      fullPage: true 
    });
    
    console.log('\n🔍 Checking for React component mounting...');
    
    // Check if React components are mounted
    const reactAnalysis = await page.evaluate(() => {
      const hasReact = !!window.__REACT_DEVTOOLS_GLOBAL_HOOK__;
      const hasDesktopSidebar = !!document.querySelector('[data-testid="desktop-sidebar"]');
      const hasLayoutDiagnostic = !!document.querySelector('[data-testid="layout-diagnostic"]');
      
      // Look for any React-specific attributes
      const reactElements = document.querySelectorAll('[data-reactroot], [data-reactid]');
      
      return {
        hasReact,
        hasDesktopSidebar,
        hasLayoutDiagnostic,
        reactElementCount: reactElements.length
      };
    });
    
    console.log('React Analysis:', reactAnalysis);
    
    console.log('\n🎯 Final Diagnosis Summary:');
    console.log('1. Authentication Issue:', isLoginPage ? 'YES - Being redirected to login' : 'NO');
    console.log('2. Sidebar Element Found:', domAnalysis.hasAside ? 'YES' : 'NO');
    console.log('3. Grid Classes Found:', domAnalysis.allGridClasses.length > 0 ? 'YES' : 'NO');
    console.log('4. Container Classes Found:', domAnalysis.hasMaxW7xl ? 'YES' : 'NO');
    console.log('5. Viewport Width:', domAnalysis.responsiveBreakpoints.viewportWidth + 'px');
    console.log('6. Is Desktop Viewport:', domAnalysis.responsiveBreakpoints.isDesktop ? 'YES' : 'NO');
    
  } catch (error) {
    console.error('❌ Diagnosis failed:', error);
  } finally {
    await browser.close();
  }
}

// Run diagnosis
diagnoseDesktopLayout();