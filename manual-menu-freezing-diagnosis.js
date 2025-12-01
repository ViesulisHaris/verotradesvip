/**
 * Manual Menu Freezing Diagnosis Script
 * 
 * This script provides a comprehensive testing framework to diagnose the menu freezing issue
 * by simulating real user interactions and capturing detailed diagnostic information.
 * 
 * Usage: Run this in the browser console on http://localhost:3000
 */

const MenuFreezingDiagnosis = {
  // Configuration
  config: {
    baseUrl: 'http://localhost:3000',
    testDelay: 2000, // Delay between actions in ms
    navigationTimeout: 10000, // Timeout for navigation attempts
    screenshotDelay: 1000, // Delay before taking screenshots
    viewportSizes: {
      desktop: { width: 1920, height: 1080 },
      tablet: { width: 768, height: 1024 },
      mobile: { width: 375, height: 667 }
    }
  },

  // State tracking
  state: {
    currentTest: null,
    testResults: [],
    navigationAttempts: [],
    consoleErrors: [],
    overlayDetections: [],
    menuResponsiveness: [],
    startTime: null,
    currentViewport: 'desktop'
  },

  // Initialize the diagnosis
  init() {
    console.log('🔍 Menu Freezing Diagnosis Initialized');
    console.log('📍 Testing on:', window.location.href);
    console.log('🖥️  Current viewport:', this.state.currentViewport);
    this.state.startTime = Date.now();
    
    // Set up console error tracking
    this.setupConsoleErrorTracking();
    
    // Set up overlay detection
    this.setupOverlayDetection();
    
    // Set up menu responsiveness tracking
    this.setupMenuResponsivenessTracking();
    
    return this;
  },

  // Setup console error tracking
  setupConsoleErrorTracking() {
    const originalError = console.error;
    const originalWarn = console.warn;
    
    console.error = (...args) => {
      this.state.consoleErrors.push({
        type: 'error',
        message: args.join(' '),
        timestamp: Date.now(),
        url: window.location.href,
        stack: new Error().stack
      });
      originalError.apply(console, args);
    };
    
    console.warn = (...args) => {
      this.state.consoleErrors.push({
        type: 'warn',
        message: args.join(' '),
        timestamp: Date.now(),
        url: window.location.href
      });
      originalWarn.apply(console, args);
    };
  },

  // Setup overlay detection
  setupOverlayDetection() {
    const checkOverlays = () => {
      const overlays = [];
      
      // Check for common overlay selectors
      const overlaySelectors = [
        '.fixed.inset-0',
        '.modal-backdrop',
        '[style*="position: fixed"]',
        '.modal-overlay',
        '[role="dialog"]',
        '[aria-modal="true"]',
        '.fixed.z-50',
        '.zoom-debug-panel'
      ];
      
      overlaySelectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(element => {
          const rect = element.getBoundingClientRect();
          const computedStyle = window.getComputedStyle(element);
          const zIndex = parseInt(computedStyle.zIndex) || 0;
          
          overlays.push({
            selector,
            element: element.tagName,
            zIndex,
            position: computedStyle.position,
            pointerEvents: computedStyle.pointerEvents,
            dimensions: {
              width: rect.width,
              height: rect.height,
              top: rect.top,
              left: rect.left
            },
            coversScreen: rect.width > window.innerWidth * 0.9 && 
                         rect.height > window.innerHeight * 0.9,
            isVisible: computedStyle.display !== 'none' && 
                       computedStyle.visibility !== 'hidden' &&
                       computedStyle.opacity !== '0'
          });
        });
      });
      
      this.state.overlayDetections.push({
        timestamp: Date.now(),
        url: window.location.href,
        overlays,
        totalOverlays: overlays.length
      });
    };
    
    // Check overlays every 2 seconds
    setInterval(checkOverlays, 2000);
  },

  // Setup menu responsiveness tracking
  setupMenuResponsivenessTracking() {
    const trackMenuClick = (event) => {
      const target = event.target;
      const isMenuElement = target.closest('nav, .nav-item-luxury, .nav-link, button[onclick*="navigate"], a[href]');
      
      if (isMenuElement) {
        const element = isMenuElement;
        const computedStyle = window.getComputedStyle(element);
        
        this.state.menuResponsiveness.push({
          timestamp: Date.now(),
          element: element.tagName,
          className: element.className,
          href: element.href || element.getAttribute('href'),
          onclick: element.onclick ? element.onclick.toString() : null,
          pointerEvents: computedStyle.pointerEvents,
          zIndex: parseInt(computedStyle.zIndex) || 0,
          position: computedStyle.position,
          display: computedStyle.display,
          visibility: computedStyle.visibility,
          opacity: computedStyle.opacity,
          url: window.location.href
        });
      }
    };
    
    document.addEventListener('click', trackMenuClick, true);
  },

  // Test manual navigation
  async testManualNavigation(targetUrl, buttonSelector, description) {
    console.log(`🧭 Testing: ${description}`);
    console.log(`🎯 Target URL: ${targetUrl}`);
    console.log(`🔘 Button selector: ${buttonSelector}`);
    
    const testResult = {
      description,
      targetUrl,
      buttonSelector,
      startTime: Date.now(),
      startUrl: window.location.href,
      success: false,
      error: null,
      navigationTime: null,
      overlaysBefore: [],
      overlaysAfter: [],
      consoleErrorsBefore: [],
      consoleErrorsAfter: [],
      menuElementState: null
    };
    
    try {
      // Capture state before navigation
      testResult.overlaysBefore = this.state.overlayDetections.slice(-1);
      testResult.consoleErrorsBefore = this.state.consoleErrors.slice(-5);
      
      // Find and analyze the menu element
      const menuElement = document.querySelector(buttonSelector);
      if (menuElement) {
        testResult.menuElementState = {
          exists: true,
          visible: menuElement.offsetParent !== null,
          pointerEvents: window.getComputedStyle(menuElement).pointerEvents,
          zIndex: window.getComputedStyle(menuElement).zIndex,
          position: window.getComputedStyle(menuElement).position,
          disabled: menuElement.disabled,
          ariaDisabled: menuElement.getAttribute('aria-disabled')
        };
        
        console.log('🔍 Menu element state:', testResult.menuElementState);
        
        // Try to click the element
        console.log('🖱️  Attempting to click menu element...');
        menuElement.click();
        
        // Wait for navigation
        await this.waitForNavigation(targetUrl);
        
        testResult.success = window.location.href.includes(targetUrl.split('/').pop());
        testResult.navigationTime = Date.now() - testResult.startTime;
        
      } else {
        testResult.error = `Menu element not found: ${buttonSelector}`;
        console.error(`❌ Menu element not found: ${buttonSelector}`);
      }
      
      // Capture state after navigation
      testResult.overlaysAfter = this.state.overlayDetections.slice(-1);
      testResult.consoleErrorsAfter = this.state.consoleErrors.slice(-5);
      
    } catch (error) {
      testResult.error = error.message;
      console.error(`❌ Navigation test failed:`, error);
    }
    
    testResult.endTime = Date.now();
    testResult.endUrl = window.location.href;
    
    this.state.testResults.push(testResult);
    console.log(`✅ Test completed:`, testResult);
    
    return testResult;
  },

  // Wait for navigation to complete
  async waitForNavigation(expectedUrl) {
    return new Promise((resolve) => {
      const startTime = Date.now();
      const checkInterval = setInterval(() => {
        if (window.location.href.includes(expectedUrl.split('/').pop()) || 
            Date.now() - startTime > this.config.navigationTimeout) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 100);
    });
  },

  // Test the specific Trades tab issue
  async testTradesTabIssue() {
    console.log('🎯 Testing specific Trades tab issue...');
    
    const tests = [
      {
        name: 'Navigate to Trades page',
        url: '/trades',
        selector: 'a[href="/trades"], .nav-link[href*="trades"]'
      },
      {
        name: 'From Trades, try to navigate to Dashboard',
        url: '/dashboard',
        selector: 'a[href="/dashboard"], .nav-link[href*="dashboard"]'
      },
      {
        name: 'From Dashboard, back to Trades',
        url: '/trades',
        selector: 'a[href="/trades"], .nav-link[href*="trades"]'
      },
      {
        name: 'From Trades, try to navigate to Strategies',
        url: '/strategies',
        selector: 'a[href="/strategies"], .nav-link[href*="strategies"]'
      },
      {
        name: 'From Strategies, back to Trades again',
        url: '/trades',
        selector: 'a[href="/trades"], .nav-link[href*="trades"]'
      }
    ];
    
    for (const test of tests) {
      await this.delay(this.config.testDelay);
      await this.testManualNavigation(test.url, test.selector, test.name);
    }
  },

  // Test menu responsiveness
  async testMenuResponsiveness() {
    console.log('🔘 Testing menu responsiveness...');
    
    const menuSelectors = [
      'nav a',
      '.nav-item-luxury',
      '.nav-link',
      'button[onclick*="navigate"]',
      '.mobile-menu-button',
      '.sidebar-toggle'
    ];
    
    const menuElements = [];
    menuSelectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(element => {
        menuElements.push({
          element,
          selector,
          computedStyle: window.getComputedStyle(element),
          rect: element.getBoundingClientRect()
        });
      });
    });
    
    console.log(`📊 Found ${menuElements.length} menu elements`);
    
    menuElements.forEach((menuElement, index) => {
      const { element, selector, computedStyle, rect } = menuElement;
      
      console.log(`🔍 Menu Element ${index + 1}:`, {
        selector,
        tagName: element.tagName,
        textContent: element.textContent?.trim(),
        href: element.href,
        onclick: element.onclick ? element.onclick.toString() : null,
        visible: rect.width > 0 && rect.height > 0,
        pointerEvents: computedStyle.pointerEvents,
        zIndex: computedStyle.zIndex,
        position: computedStyle.position,
        display: computedStyle.display,
        visibility: computedStyle.visibility,
        opacity: computedStyle.opacity,
        disabled: element.disabled,
        ariaDisabled: element.getAttribute('aria-disabled'),
        rect: {
          width: rect.width,
          height: rect.height,
          top: rect.top,
          left: rect.left
        }
      });
    });
    
    return menuElements;
  },

  // Check for blocking overlays
  checkBlockingOverlays() {
    console.log('🔍 Checking for blocking overlays...');
    
    const blockingOverlays = [];
    const allElements = document.querySelectorAll('*');
    
    allElements.forEach(element => {
      const computedStyle = window.getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      
      // Check if element could be blocking navigation
      if (computedStyle.position === 'fixed' && 
          computedStyle.zIndex > 5 &&
          rect.width > window.innerWidth * 0.5 &&
          rect.height > window.innerHeight * 0.5) {
        
        blockingOverlays.push({
          element: element.tagName,
          className: element.className,
          id: element.id,
          zIndex: computedStyle.zIndex,
          pointerEvents: computedStyle.pointerEvents,
          dimensions: {
            width: rect.width,
            height: rect.height,
            top: rect.top,
            left: rect.left
          },
          coversScreen: rect.width > window.innerWidth * 0.9 && 
                       rect.height > window.innerHeight * 0.9
        });
      }
    });
    
    console.log(`🚫 Found ${blockingOverlays.length} potential blocking overlays:`, blockingOverlays);
    return blockingOverlays;
  },

  // Test viewport changes
  async testViewportChanges() {
    console.log('📱 Testing viewport changes...');
    
    const viewports = ['desktop', 'tablet', 'mobile'];
    
    for (const viewport of viewports) {
      console.log(`🖥️  Testing ${viewport} viewport...`);
      this.state.currentViewport = viewport;
      
      // Set viewport size
      const { width, height } = this.config.viewportSizes[viewport];
      window.resizeTo(width, height);
      
      await this.delay(1000);
      
      // Test menu responsiveness in this viewport
      await this.testMenuResponsiveness();
      
      // Check for blocking overlays
      this.checkBlockingOverlays();
    }
  },

  // Generate comprehensive report
  generateReport() {
    const report = {
      summary: {
        totalTests: this.state.testResults.length,
        successfulTests: this.state.testResults.filter(r => r.success).length,
        failedTests: this.state.testResults.filter(r => !r.success).length,
        totalConsoleErrors: this.state.consoleErrors.length,
        totalOverlayDetections: this.state.overlayDetections.length,
        totalMenuInteractions: this.state.menuResponsiveness.length,
        testDuration: Date.now() - this.state.startTime
      },
      testResults: this.state.testResults,
      consoleErrors: this.state.consoleErrors,
      overlayDetections: this.state.overlayDetections,
      menuResponsiveness: this.state.menuResponsiveness,
      recommendations: this.generateRecommendations()
    };
    
    console.log('📊 Menu Freezing Diagnosis Report:', report);
    return report;
  },

  // Generate recommendations based on findings
  generateRecommendations() {
    const recommendations = [];
    
    // Analyze test results
    const failedTests = this.state.testResults.filter(r => !r.success);
    if (failedTests.length > 0) {
      recommendations.push({
        type: 'navigation',
        priority: 'high',
        issue: `${failedTests.length} navigation tests failed`,
        details: failedTests.map(t => t.description),
        suggestion: 'Investigate navigation event handlers and routing'
      });
    }
    
    // Analyze console errors
    const recentErrors = this.state.consoleErrors.filter(e => 
      Date.now() - e.timestamp < 30000
    );
    if (recentErrors.length > 0) {
      recommendations.push({
        type: 'javascript',
        priority: 'high',
        issue: `${recentErrors.length} console errors detected`,
        details: recentErrors.map(e => e.message),
        suggestion: 'Fix JavaScript errors that may be interfering with navigation'
      });
    }
    
    // Analyze overlays
    const blockingOverlays = this.state.overlayDetections
      .filter(d => d.overlays.some(o => o.coversScreen && o.zIndex > 10));
    
    if (blockingOverlays.length > 0) {
      recommendations.push({
        type: 'overlay',
        priority: 'high',
        issue: `${blockingOverlays.length} blocking overlays detected`,
        details: blockingOverlays.map(d => d.overlays.filter(o => o.coversScreen)),
        suggestion: 'Remove or reposition overlays that block navigation'
      });
    }
    
    // Analyze menu responsiveness
    const unresponsiveMenuItems = this.state.menuResponsiveness.filter(r => 
      r.pointerEvents === 'none' || r.display === 'none' || r.visibility === 'hidden'
    );
    
    if (unresponsiveMenuItems.length > 0) {
      recommendations.push({
        type: 'css',
        priority: 'high',
        issue: `${unresponsiveMenuItems.length} unresponsive menu items detected`,
        details: unresponsiveMenuItems,
        suggestion: 'Fix CSS properties that prevent menu interactions'
      });
    }
    
    return recommendations;
  },

  // Utility delay function
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  },

  // Run complete diagnosis
  async runCompleteDiagnosis() {
    console.log('🚀 Starting complete menu freezing diagnosis...');
    
    try {
      // Initial state check
      await this.testMenuResponsiveness();
      this.checkBlockingOverlays();
      
      // Test the specific Trades tab issue
      await this.testTradesTabIssue();
      
      // Test viewport changes
      await this.testViewportChanges();
      
      // Generate final report
      const report = this.generateReport();
      
      console.log('✅ Complete diagnosis finished!');
      console.log('📋 Summary:', report.summary);
      console.log('💡 Recommendations:', report.recommendations);
      
      return report;
      
    } catch (error) {
      console.error('❌ Diagnosis failed:', error);
      throw error;
    }
  }
};

// Auto-initialize and make available globally
if (typeof window !== 'undefined') {
  window.MenuFreezingDiagnosis = MenuFreezingDiagnosis;
  console.log('🔍 MenuFreezingDiagnosis loaded. Run MenuFreezingDiagnosis.init() to start.');
}