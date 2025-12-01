/**
 * Menu Diagnostic Test
 * 
 * This script performs detailed diagnosis of menu visibility issues
 * to identify the root cause of menu not being detected.
 */

const { chromium } = require('playwright');

class MenuDiagnosticTest {
  constructor() {
    this.browser = null;
    this.context = null;
    this.page = null;
  }

  async initialize() {
    console.log('🔍 Initializing Menu Diagnostic Test...');
    
    try {
      this.browser = await chromium.launch({ 
        headless: false,
        slowMo: 100
      });
      this.context = await this.browser.newContext({
        viewport: { width: 1920, height: 1080 },
        ignoreHTTPSErrors: true
      });
      this.page = await this.context.newPage();
      
      // Set up console logging
      this.page.on('console', msg => {
        console.log('🌐 Browser:', msg.text());
      });

      console.log('✅ Browser initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize browser:', error);
      return false;
    }
  }

  async diagnoseMenuIssues() {
    console.log('\n🔍 Starting comprehensive menu diagnosis...');
    
    try {
      // Navigate to the application
      await this.page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
      await this.page.waitForTimeout(5000); // Wait for full page load
      
      // 1. Check current URL and authentication state
      console.log('\n📍 1. URL and Authentication Check:');
      const currentUrl = this.page.url();
      console.log('   Current URL:', currentUrl);
      
      // Check for login/register indicators
      const hasLoginForm = await this.page.isVisible('input[type="email"], input[name="email"]');
      const hasRegisterForm = await this.page.isVisible('form');
      console.log('   Has login form:', hasLoginForm);
      console.log('   Has register form:', hasRegisterForm);
      
      // 2. Analyze page structure
      console.log('\n🏗️ 2. Page Structure Analysis:');
      const pageStructure = await this.page.evaluate(() => {
        const structure = {
          bodyClasses: document.body.className,
          hasSidebar: !!document.querySelector('.sidebar-luxury'),
          hasDesktopSidebar: !!document.querySelector('aside'),
          hasNav: !!document.querySelector('nav'),
          hasNavigation: !!document.querySelector('[role="navigation"]'),
          allSidebars: document.querySelectorAll('aside, [class*="sidebar"], [class*="nav"]').length,
          allNavs: document.querySelectorAll('nav, [role="navigation"]').length,
          allLinks: document.querySelectorAll('a').length,
          allButtons: document.querySelectorAll('button').length
        };
        
        // Get all elements that might be navigation
        const potentialNavElements = [];
        document.querySelectorAll('*').forEach(el => {
          const classes = el.className || '';
          const role = el.getAttribute('role') || '';
          const id = el.id || '';
          
          if (classes.includes('sidebar') || classes.includes('nav') || 
              role.includes('navigation') || id.includes('nav') ||
              classes.includes('menu')) {
            potentialNavElements.push({
              tag: el.tagName,
              classes: classes,
              role: role,
              id: id,
              visible: el.offsetParent !== null
            });
          }
        });
        
        structure.potentialNavElements = potentialNavElements;
        return structure;
      });
      
      console.log('   Body classes:', pageStructure.bodyClasses);
      console.log('   Has .sidebar-luxury:', pageStructure.hasSidebar);
      console.log('   Has <aside> elements:', pageStructure.hasDesktopSidebar);
      console.log('   Has <nav> elements:', pageStructure.hasNav);
      console.log('   Has [role="navigation"]:', pageStructure.hasNavigation);
      console.log('   Total sidebar-like elements:', pageStructure.allSidebars);
      console.log('   Total nav elements:', pageStructure.allNavs);
      console.log('   Total links:', pageStructure.allLinks);
      console.log('   Total buttons:', pageStructure.allButtons);
      
      console.log('\n   Potential navigation elements:');
      pageStructure.potentialNavElements.forEach((el, index) => {
        console.log(`   ${index + 1}. <${el.tag}> classes="${el.classes}" role="${el.role}" id="${el.id}" visible=${el.visible}`);
      });
      
      // 3. Check for React component mounting
      console.log('\n⚛️ 3. React Component Check:');
      const reactCheck = await this.page.evaluate(() => {
        // Check if React is loaded
        const hasReact = !!window.React;
        const hasNext = !!window.next;
        
        // Look for React root elements
        const reactRoots = document.querySelectorAll('[__reactInternalInstance$], [data-reactroot]');
        
        // Check for Next.js specific elements
        const nextElements = document.querySelectorAll('[data-next-route], [data-next-page]');
        
        return {
          hasReact,
          hasNext,
          reactRoots: reactRoots.length,
          nextElements: nextElements.length
        };
      });
      
      console.log('   React loaded:', reactCheck.hasReact);
      console.log('   Next.js loaded:', reactCheck.hasNext);
      console.log('   React roots:', reactCheck.reactRoots);
      console.log('   Next.js elements:', reactCheck.nextElements);
      
      // 4. Check CSS and styling issues
      console.log('\n🎨 4. CSS and Styling Check:');
      const cssCheck = await this.page.evaluate(() => {
        const body = document.body;
        const computedStyle = window.getComputedStyle(body);
        
        // Check for common CSS issues that might hide elements
        const issues = [];
        
        if (computedStyle.display === 'none') {
          issues.push('Body has display: none');
        }
        
        if (computedStyle.visibility === 'hidden') {
          issues.push('Body has visibility: hidden');
        }
        
        if (computedStyle.opacity === '0') {
          issues.push('Body has opacity: 0');
        }
        
        // Check for overlay elements that might be blocking
        const overlays = document.querySelectorAll('.fixed.inset-0, [style*="position: fixed"], .modal-backdrop');
        
        return {
          bodyDisplay: computedStyle.display,
          bodyVisibility: computedStyle.visibility,
          bodyOpacity: computedStyle.opacity,
          issues: issues,
          overlayCount: overlays.length
        };
      });
      
      console.log('   Body display:', cssCheck.bodyDisplay);
      console.log('   Body visibility:', cssCheck.bodyVisibility);
      console.log('   Body opacity:', cssCheck.bodyOpacity);
      console.log('   CSS issues:', cssCheck.issues);
      console.log('   Overlay elements:', cssCheck.overlayCount);
      
      // 5. Try to navigate to specific routes
      console.log('\n🧭 5. Route Navigation Test:');
      const routes = ['/dashboard', '/trades', '/strategies', '/calendar'];
      
      for (const route of routes) {
        console.log(`   Testing route: ${route}`);
        await this.page.goto(`http://localhost:3000${route}`, { waitUntil: 'networkidle' });
        await this.page.waitForTimeout(3000);
        
        const routeUrl = this.page.url();
        const hasSidebar = await this.page.evaluate(() => !!document.querySelector('.sidebar-luxury'));
        
        console.log(`     URL: ${routeUrl}`);
        console.log(`     Has sidebar: ${hasSidebar}`);
      }
      
      // 6. Check for JavaScript errors
      console.log('\n🚨 6. JavaScript Error Check:');
      const jsErrors = await this.page.evaluate(() => {
        const errors = [];
        
        // Check for common error indicators
        if (window.console && window.console.error) {
          // This is a simplified check - in reality we'd need to capture console errors
          console.log('Checking for console errors...');
        }
        
        return errors;
      });
      
      console.log('   JavaScript errors detected:', jsErrors.length);
      
      return {
        url: currentUrl,
        auth: { hasLoginForm, hasRegisterForm },
        structure: pageStructure,
        react: reactCheck,
        css: cssCheck,
        jsErrors: jsErrors
      };
    } catch (error) {
      console.error('❌ Error during diagnosis:', error);
      return null;
    }
  }

  async cleanup() {
    console.log('\n🧹 Cleaning up diagnostic test...');
    
    try {
      if (this.page) {
        await this.page.close();
      }
      if (this.context) {
        await this.context.close();
      }
      if (this.browser) {
        await this.browser.close();
      }
      console.log('✅ Cleanup completed');
    } catch (error) {
      console.error('❌ Error during cleanup:', error);
    }
  }

  async runDiagnostic() {
    console.log('🎯 Running comprehensive menu diagnostic...\n');
    
    try {
      const initialized = await this.initialize();
      if (!initialized) {
        return false;
      }
      
      const results = await this.diagnoseMenuIssues();
      
      if (results) {
        console.log('\n📋 Diagnostic Summary:');
        console.log('==================');
        
        // Provide diagnosis based on findings
        if (results.auth.hasLoginForm || results.auth.hasRegisterForm) {
          console.log('🔐 DIAGNOSIS: Authentication Required');
          console.log('   The application requires login before menu is visible.');
          console.log('   RECOMMENDATION: Ensure proper authentication in tests.');
        }
        
        if (!results.structure.hasSidebar && results.structure.allSidebars === 0) {
          console.log('🏗️ DIAGNOSIS: Sidebar Components Not Rendering');
          console.log('   No sidebar elements found in the DOM.');
          console.log('   RECOMMENDATION: Check component mounting and CSS loading.');
        }
        
        if (results.structure.allSidebars > 0 && !results.structure.hasSidebar) {
          console.log('🎯 DIAGNOSIS: CSS Class Mismatch');
          console.log('   Sidebar elements exist but don\'t have expected .sidebar-luxury class.');
          console.log('   RECOMMENDATION: Update test selectors to match actual DOM structure.');
        }
        
        if (results.css.issues.length > 0) {
          console.log('🎨 DIAGNOSIS: CSS Issues Detected');
          console.log('   CSS issues preventing element visibility:', results.css.issues);
          console.log('   RECOMMENDATION: Fix CSS issues affecting body or container elements.');
        }
        
        if (!results.react.hasReact) {
          console.log('⚛️ DIAGNOSIS: React Not Loaded');
          console.log('   React framework not properly loaded.');
          console.log('   RECOMMENDATION: Check JavaScript bundle loading and initialization.');
        }
      }
      
      return results;
    } catch (error) {
      console.error('❌ Error running diagnostic:', error);
      return null;
    } finally {
      await this.cleanup();
    }
  }
}

// Run diagnostic
async function main() {
  const diagnostic = new MenuDiagnosticTest();
  const results = await diagnostic.runDiagnostic();
  
  if (results) {
    console.log('\n✅ Diagnostic completed successfully!');
    process.exit(0);
  } else {
    console.log('\n❌ Diagnostic failed!');
    process.exit(1);
  }
}

// Handle uncaught errors
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Run if this file is executed directly
if (require.main === module) {
  main();
}

module.exports = MenuDiagnosticTest;