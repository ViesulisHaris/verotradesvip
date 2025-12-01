/**
 * COMPREHENSIVE SIDEBAR NAVIGATION TESTING SCRIPT
 * 
 * This script will systematically test all aspects of the sidebar navigation functionality
 * to verify that the fixes are working properly.
 */

const puppeteer = require('puppeteer');
const path = require('path');

// Test configuration
const config = {
  baseUrl: 'http://localhost:3000',
  headless: false, // Show browser for visual verification
  slowMo: 100, // Slow down actions for better observation
  timeout: 30000,
  viewport: {
    width: 1920,
    height: 1080
  }
};

// Test results tracking
const testResults = {
  sidebarVisibility: {},
  navigationLinks: {},
  pageTransitions: {},
  responsiveBehavior: {},
  consoleErrors: [],
  screenshots: []
};

// Navigation menu items to test
const navigationItems = [
  { name: 'Dashboard', href: '/dashboard', selector: 'a[href="/dashboard"]' },
  { name: 'Trades', href: '/trades', selector: 'a[href="/trades"]' },
  { name: 'Log Trade', href: '/log-trade', selector: 'a[href="/log-trade"]' },
  { name: 'Calendar', href: '/calendar', selector: 'a[href="/calendar"]' },
  { name: 'Strategy', href: '/strategies', selector: 'a[href="/strategies"]' },
  { name: 'Confluence', href: '/confluence', selector: 'a[href="/confluence"]' },
  { name: 'Settings', href: '/settings', selector: 'a[href="/settings"]' }
];

// Viewport sizes for responsive testing
const viewports = [
  { name: 'Desktop', width: 1920, height: 1080 },
  { name: 'Tablet', width: 768, height: 1024 },
  { name: 'Mobile', width: 375, height: 667 }
];

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function takeScreenshot(page, name, description) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `navigation-test-${name}-${timestamp}.png`;
  const screenshotPath = path.join(__dirname, filename);
  
  await page.screenshot({
    path: screenshotPath,
    fullPage: true
  });
  
  testResults.screenshots.push({
    filename,
    description,
    path: screenshotPath
  });
  
  console.log(`📸 Screenshot saved: ${filename} - ${description}`);
  return screenshotPath;
}

async function checkConsoleErrors(page) {
  const errors = await page.evaluate(() => {
    const errors = [];
    const originalError = console.error;
    const originalLog = console.log;
    
    console.error = function(...args) {
      errors.push({
        type: 'error',
        message: args.join(' '),
        timestamp: new Date().toISOString()
      });
      originalError.apply(console, args);
    };
    
    console.log = function(...args) {
      if (args[0] && typeof args[0] === 'string' && args[0].includes('🔧')) {
        errors.push({
          type: 'log',
          message: args.join(' '),
          timestamp: new Date().toISOString()
        });
      }
      originalLog.apply(console, args);
    };
    
    return errors;
  });
  
  testResults.consoleErrors.push(...errors);
  return errors;
}

async function testSidebarVisibility(page) {
  console.log('\n🔍 Testing Sidebar Visibility...');
  
  // Test on dashboard page first
  await page.goto(`${config.baseUrl}/dashboard`, { waitUntil: 'networkidle2' });
  await delay(2000);
  
  // Check if sidebar is visible
  const sidebarVisible = await page.evaluate(() => {
    const sidebar = document.querySelector('.verotrade-sidebar-overlay, aside[style*="position: fixed"]');
    if (!sidebar) return false;
    
    const style = window.getComputedStyle(sidebar);
    const rect = sidebar.getBoundingClientRect();
    
    return {
      exists: true,
      visible: style.visibility !== 'hidden' && style.opacity !== '0',
      position: style.position,
      transform: style.transform,
      left: style.left,
      width: style.width,
      zIndex: style.zIndex,
      rect: {
        width: rect.width,
        height: rect.height,
        left: rect.left,
        top: rect.top
      }
    };
  });
  
  testResults.sidebarVisibility.dashboard = sidebarVisible;
  console.log('📊 Dashboard sidebar visibility:', sidebarVisible);
  
  await takeScreenshot(page, 'dashboard-sidebar', 'Dashboard with sidebar visible');
  
  // Test sidebar toggle functionality
  const toggleButton = await page.$('button[aria-label*="sidebar"], button[aria-label*="Close sidebar"], button[aria-label*="Open sidebar"]');
  if (toggleButton) {
    console.log('🔄 Testing sidebar toggle...');
    await toggleButton.click();
    await delay(1000);
    
    const afterToggle = await page.evaluate(() => {
      const sidebar = document.querySelector('.verotrade-sidebar-overlay, aside[style*="position: fixed"]');
      if (!sidebar) return false;
      
      const style = window.getComputedStyle(sidebar);
      const rect = sidebar.getBoundingClientRect();
      
      return {
        visible: style.visibility !== 'hidden' && style.opacity !== '0',
        transform: style.transform,
        width: style.width,
        rect: {
          width: rect.width,
          left: rect.left
        }
      };
    });
    
    testResults.sidebarVisibility.afterToggle = afterToggle;
    console.log('📊 Sidebar after toggle:', afterToggle);
    
    await takeScreenshot(page, 'dashboard-sidebar-toggled', 'Dashboard after sidebar toggle');
    
    // Toggle back
    await toggleButton.click();
    await delay(1000);
  }
  
  return sidebarVisible;
}

async function testNavigationLinks(page) {
  console.log('\n🔗 Testing Navigation Links...');
  
  for (const item of navigationItems) {
    console.log(`\n📍 Testing navigation to: ${item.name} (${item.href})`);
    
    try {
      // Find and click the navigation link
      const navLink = await page.$(item.selector);
      if (!navLink) {
        console.log(`❌ Navigation link not found: ${item.selector}`);
        testResults.navigationLinks[item.name] = { 
          success: false, 
          error: 'Link not found' 
        };
        continue;
      }
      
      // Check if link is visible and clickable
      const linkInfo = await page.evaluate((selector) => {
        const link = document.querySelector(selector);
        if (!link) return null;
        
        const style = window.getComputedStyle(link);
        const rect = link.getBoundingClientRect();
        
        return {
          visible: style.visibility !== 'hidden' && style.display !== 'none',
          clickable: style.pointerEvents !== 'none',
          text: link.textContent?.trim(),
          href: link.getAttribute('href'),
          rect: {
            width: rect.width,
            height: rect.height,
            left: rect.left,
            top: rect.top
          }
        };
      }, item.selector);
      
      console.log(`📊 Link info for ${item.name}:`, linkInfo);
      
      if (linkInfo && linkInfo.visible && linkInfo.clickable) {
        // Click the link
        await navLink.click();
        await delay(2000); // Wait for navigation
        
        // Check if navigation was successful
        const currentUrl = page.url();
        const navigationSuccess = currentUrl.includes(item.href);
        
        testResults.navigationLinks[item.name] = {
          success: navigationSuccess,
          url: currentUrl,
          expected: item.href,
          linkInfo
        };
        
        console.log(`${navigationSuccess ? '✅' : '❌'} Navigation to ${item.name}: ${currentUrl}`);
        
        // Take screenshot after navigation
        await takeScreenshot(page, `nav-${item.name.toLowerCase()}`, `Page after navigating to ${item.name}`);
        
        // Check if sidebar is still visible after navigation
        const sidebarAfterNav = await page.evaluate(() => {
          const sidebar = document.querySelector('.verotrade-sidebar-overlay, aside[style*="position: fixed"]');
          if (!sidebar) return false;
          
          const style = window.getComputedStyle(sidebar);
          const rect = sidebar.getBoundingClientRect();
          
          return {
            visible: style.visibility !== 'hidden' && style.opacity !== '0',
            width: style.width,
            rect: {
              width: rect.width,
              left: rect.left
            }
          };
        });
        
        testResults.pageTransitions[item.name] = {
          sidebarVisible: sidebarAfterNav,
          url: currentUrl
        };
        
        console.log(`📊 Sidebar after navigating to ${item.name}:`, sidebarAfterNav);
        
      } else {
        testResults.navigationLinks[item.name] = {
          success: false,
          error: 'Link not visible or clickable',
          linkInfo
        };
        console.log(`❌ Link ${item.name} not visible or clickable`);
      }
      
    } catch (error) {
      console.error(`❌ Error testing navigation to ${item.name}:`, error.message);
      testResults.navigationLinks[item.name] = {
        success: false,
        error: error.message
      };
    }
  }
}

async function testResponsiveBehavior(page) {
  console.log('\n📱 Testing Responsive Behavior...');
  
  for (const viewport of viewports) {
    console.log(`\n📐 Testing ${viewport.name} viewport (${viewport.width}x${viewport.height})`);
    
    // Set viewport size
    await page.setViewport({
      width: viewport.width,
      height: viewport.height
    });
    await delay(1000);
    
    // Go to dashboard
    await page.goto(`${config.baseUrl}/dashboard`, { waitUntil: 'networkidle2' });
    await delay(2000);
    
    // Check sidebar behavior
    const sidebarBehavior = await page.evaluate((viewportName) => {
      const sidebar = document.querySelector('.verotrade-sidebar-overlay, aside[style*="position: fixed"]');
      if (!sidebar) return null;
      
      const style = window.getComputedStyle(sidebar);
      const rect = sidebar.getBoundingClientRect();
      
      // Check for mobile menu button
      const mobileMenuBtn = document.querySelector('.verotrade-mobile-menu-btn');
      
      return {
        viewport: viewportName,
        sidebarExists: !!sidebar,
        sidebarVisible: style.visibility !== 'hidden' && style.opacity !== '0',
        sidebarPosition: style.position,
        sidebarTransform: style.transform,
        sidebarWidth: style.width,
        sidebarLeft: style.left,
        sidebarRect: {
          width: rect.width,
          height: rect.height,
          left: rect.left,
          top: rect.top
        },
        mobileMenuButtonExists: !!mobileMenuBtn,
        mobileMenuButtonVisible: mobileMenuBtn ? 
          window.getComputedStyle(mobileMenuBtn).display !== 'none' : false
      };
    }, viewport.name);
    
    testResults.responsiveBehavior[viewport.name] = sidebarBehavior;
    console.log(`📊 ${viewport.name} sidebar behavior:`, sidebarBehavior);
    
    await takeScreenshot(page, `responsive-${viewport.name.toLowerCase()}`, `${viewport.name} viewport sidebar behavior`);
    
    // Test mobile menu toggle if on mobile
    if (viewport.name === 'Mobile' && sidebarBehavior.mobileMenuButtonExists) {
      console.log('📱 Testing mobile menu toggle...');
      
      const mobileMenuBtn = await page.$('.verotrade-mobile-menu-btn');
      if (mobileMenuBtn) {
        await mobileMenuBtn.click();
        await delay(1000);
        
        const mobileMenuOpen = await page.evaluate(() => {
          const sidebar = document.querySelector('.verotrade-sidebar-overlay, aside[style*="position: fixed"]');
          if (!sidebar) return false;
          
          const style = window.getComputedStyle(sidebar);
          const rect = sidebar.getBoundingClientRect();
          
          return {
            visible: style.visibility !== 'hidden' && style.opacity !== '0',
            transform: style.transform,
            rect: {
              width: rect.width,
              left: rect.left
            }
          };
        });
        
        testResults.responsiveBehavior[viewport.name].mobileMenuOpen = mobileMenuOpen;
        console.log('📊 Mobile menu after toggle:', mobileMenuOpen);
        
        await takeScreenshot(page, 'mobile-menu-open', 'Mobile menu opened');
        
        // Close mobile menu
        await mobileMenuBtn.click();
        await delay(1000);
      }
    }
  }
}

async function testConsoleErrors(page) {
  console.log('\n🐛 Testing for Console Errors...');
  
  // Set up console error tracking
  const errors = [];
  
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      errors.push({
        type: 'error',
        text: msg.text(),
        location: msg.location(),
        timestamp: new Date().toISOString()
      });
      console.log(`❌ Console error: ${msg.text()}`);
    }
    
    if (msg.text().includes('🔧') || msg.text().includes('🚨')) {
      errors.push({
        type: 'debug',
        text: msg.text(),
        timestamp: new Date().toISOString()
      });
      console.log(`🔍 Debug log: ${msg.text()}`);
    }
  });
  
  page.on('pageerror', (error) => {
    errors.push({
      type: 'pageerror',
      text: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    console.log(`❌ Page error: ${error.message}`);
  });
  
  // Navigate through all pages to catch errors
  for (const item of navigationItems) {
    try {
      await page.goto(`${config.baseUrl}${item.href}`, { waitUntil: 'networkidle2' });
      await delay(2000);
    } catch (error) {
      errors.push({
        type: 'navigation',
        text: `Failed to navigate to ${item.href}: ${error.message}`,
        timestamp: new Date().toISOString()
      });
    }
  }
  
  testResults.consoleErrors = errors;
  return errors;
}

async function generateTestReport() {
  console.log('\n📋 Generating Test Report...');
  
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      consoleErrors: testResults.consoleErrors.length
    },
    details: {
      sidebarVisibility: testResults.sidebarVisibility,
      navigationLinks: testResults.navigationLinks,
      pageTransitions: testResults.pageTransitions,
      responsiveBehavior: testResults.responsiveBehavior,
      consoleErrors: testResults.consoleErrors,
      screenshots: testResults.screenshots
    }
  };
  
  // Calculate summary
  Object.values(testResults.navigationLinks).forEach(result => {
    report.summary.totalTests++;
    if (result.success) {
      report.summary.passedTests++;
    } else {
      report.summary.failedTests++;
    }
  });
  
  // Save report
  const reportPath = path.join(__dirname, `navigation-test-report-${Date.now()}.json`);
  require('fs').writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  console.log(`\n📊 Test Report Summary:`);
  console.log(`Total Tests: ${report.summary.totalTests}`);
  console.log(`Passed: ${report.summary.passedTests}`);
  console.log(`Failed: ${report.summary.failedTests}`);
  console.log(`Console Errors: ${report.summary.consoleErrors}`);
  console.log(`Screenshots: ${testResults.screenshots.length}`);
  console.log(`\n📄 Full report saved to: ${reportPath}`);
  
  return report;
}

async function runComprehensiveNavigationTest() {
  console.log('🚀 Starting Comprehensive Sidebar Navigation Test...');
  console.log(`🌐 Base URL: ${config.baseUrl}`);
  
  let browser;
  let page;
  
  try {
    // Launch browser
    browser = await puppeteer.launch({
      headless: config.headless,
      slowMo: config.slowMo,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    page = await browser.newPage();
    await page.setViewport(config.viewport);
    
    // Set timeout
    page.setDefaultTimeout(config.timeout);
    
    console.log('\n🔧 Browser launched successfully');
    
    // Run tests in sequence
    await testSidebarVisibility(page);
    await testNavigationLinks(page);
    await testResponsiveBehavior(page);
    await testConsoleErrors(page);
    
    // Generate final report
    const report = await generateTestReport();
    
    console.log('\n✅ Comprehensive navigation test completed!');
    
    return report;
    
  } catch (error) {
    console.error('\n❌ Test execution failed:', error);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
      console.log('🔧 Browser closed');
    }
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  runComprehensiveNavigationTest()
    .then(() => {
      console.log('\n🎉 All tests completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Test failed:', error);
      process.exit(1);
    });
}

module.exports = {
  runComprehensiveNavigationTest,
  testSidebarVisibility,
  testNavigationLinks,
  testResponsiveBehavior,
  testConsoleErrors,
  generateTestReport
};