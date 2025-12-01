const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

/**
 * DESKTOP LAYOUT VERIFICATION SCRIPT
 * 
 * This script comprehensively tests desktop layout features after build fix
 * including sidebar functionality, grid layouts, container constraints, and responsive behavior
 */

const VIEWPORTS = {
  mobile: { width: 375, height: 667, name: 'Mobile' },
  tablet: { width: 768, height: 1024, name: 'Tablet' },
  desktop: { width: 1024, height: 768, name: 'Desktop' },
  largeDesktop: { width: 1920, height: 1080, name: 'Large Desktop' }
};

const BASE_URL = 'http://localhost:3000';
const SCREENSHOT_DIR = './desktop-layout-screenshots';
const REPORT_FILE = './DESKTOP_LAYOUT_VERIFICATION_REPORT.md';

class DesktopLayoutVerifier {
  constructor() {
    this.browser = null;
    this.context = null;
    this.page = null;
    this.results = {
      timestamp: new Date().toISOString(),
      summary: {
        totalTests: 0,
        passedTests: 0,
        failedTests: 0,
        skippedTests: 0
      },
      viewportTests: {},
      sidebarTests: {},
      gridTests: {},
      containerTests: {},
      responsiveTests: {},
      screenshots: [],
      issues: []
    };
  }

  async initialize() {
    console.log('🚀 Initializing Desktop Layout Verification...');
    
    // Create screenshot directory
    if (!fs.existsSync(SCREENSHOT_DIR)) {
      fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
    }

    this.browser = await chromium.launch({ 
      headless: false, // Set to true for CI environments
      slowMo: 100 
    });
    
    this.context = await this.browser.newContext({
      viewport: VIEWPORTS.desktop,
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    });
    
    this.page = await this.context.newPage();
    
    // Enable console logging from the page
    this.page.on('console', msg => {
      console.log(`PAGE LOG: ${msg.text()}`);
    });
    
    // Enable network logging
    this.page.on('response', response => {
      if (response.status() >= 400) {
        console.log(`NETWORK ERROR: ${response.url()} - ${response.status()}`);
      }
    });
  }

  async navigateToDashboard() {
    console.log('📍 Navigating to dashboard...');
    
    try {
      // First navigate to home page
      await this.page.goto(BASE_URL, { waitUntil: 'networkidle' });
      await this.page.waitForTimeout(2000);
      
      // Check if we need to login or if we're already authenticated
      const currentUrl = this.page.url();
      
      if (currentUrl.includes('/login') || currentUrl === BASE_URL) {
        console.log('🔐 Authentication required, attempting to login...');
        
        // Try to login with test credentials
        await this.page.fill('input[type="email"]', 'test@example.com');
        await this.page.fill('input[type="password"]', 'testpassword123');
        await this.page.click('button[type="submit"]');
        await this.page.waitForTimeout(3000);
      }
      
      // Navigate to dashboard
      await this.page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle' });
      await this.page.waitForTimeout(3000);
      
      // Wait for dashboard to load
      await this.page.waitForSelector('main', { timeout: 10000 });
      
      console.log('✅ Dashboard loaded successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to navigate to dashboard:', error.message);
      this.results.issues.push(`Navigation failed: ${error.message}`);
      return false;
    }
  }

  async testViewportSizes() {
    console.log('📱 Testing viewport sizes...');
    
    for (const [key, viewport] of Object.entries(VIEWPORTS)) {
      console.log(`  Testing ${viewport.name} (${viewport.width}x${viewport.height})...`);
      
      try {
        // Set viewport
        await this.page.setViewportSize(viewport);
        await this.page.waitForTimeout(1000);
        
        // Take screenshot
        const screenshotPath = path.join(SCREENSHOT_DIR, `viewport-${key}-${Date.now()}.png`);
        await this.page.screenshot({ path: screenshotPath, fullPage: true });
        this.results.screenshots.push({
          type: 'viewport',
          name: viewport.name,
          path: screenshotPath,
          viewport: viewport
        });
        
        // Test viewport-specific features
        const testResult = await this.runViewportTests(key, viewport);
        this.results.viewportTests[key] = testResult;
        
        console.log(`    ${testResult.passed ? '✅' : '❌'} ${testResult.passedTests}/${testResult.totalTests} tests passed`);
        
      } catch (error) {
        console.error(`    ❌ Viewport test failed: ${error.message}`);
        this.results.viewportTests[key] = {
          passed: false,
          error: error.message,
          totalTests: 0,
          passedTests: 0,
          failedTests: 1
        };
      }
    }
  }

  async runViewportTests(key, viewport) {
    const tests = {
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      details: {}
    };

    // Test 1: No horizontal scrolling
    tests.totalTests++;
    try {
      const bodyWidth = await this.page.evaluate(() => document.body.scrollWidth);
      const viewportWidth = await this.page.evaluate(() => window.innerWidth);
      const hasHorizontalScroll = bodyWidth > viewportWidth;
      
      tests.details.noHorizontalScroll = !hasHorizontalScroll;
      if (!hasHorizontalScroll) {
        tests.passedTests++;
      } else {
        tests.failedTests++;
        this.results.issues.push(`Horizontal scrolling detected on ${viewport.name}`);
      }
    } catch (error) {
      tests.failedTests++;
      tests.details.noHorizontalScroll = false;
    }

    // Test 2: Typography accessibility (16px+)
    tests.totalTests++;
    try {
      const minFontSize = await this.page.evaluate(() => {
        const textElements = document.querySelectorAll('p, span, div, h1, h2, h3, h4, h5, h6');
        let minSize = Infinity;
        textElements.forEach(el => {
          const style = window.getComputedStyle(el);
          const size = parseFloat(style.fontSize);
          if (size > 0 && size < minSize) {
            minSize = size;
          }
        });
        return minSize;
      });
      
      const isAccessible = minFontSize >= 16;
      tests.details.minFontSize = minFontSize;
      tests.details.typographyAccessible = isAccessible;
      
      if (isAccessible) {
        tests.passedTests++;
      } else {
        tests.failedTests++;
        this.results.issues.push(`Typography too small on ${viewport.name}: ${minFontSize}px`);
      }
    } catch (error) {
      tests.failedTests++;
      tests.details.typographyAccessible = false;
    }

    // Test 3: Sidebar visibility (desktop only)
    if (viewport.width >= 1024) {
      tests.totalTests++;
      try {
        const sidebarVisible = await this.page.evaluate(() => {
          const sidebar = document.querySelector('aside[class*="sidebar"]');
          if (!sidebar) return false;
          const style = window.getComputedStyle(sidebar);
          return style.display !== 'none' && style.visibility !== 'hidden';
        });
        
        tests.details.sidebarVisible = sidebarVisible;
        if (sidebarVisible) {
          tests.passedTests++;
        } else {
          tests.failedTests++;
          this.results.issues.push(`Sidebar not visible on ${viewport.name}`);
        }
      } catch (error) {
        tests.failedTests++;
        tests.details.sidebarVisible = false;
      }
    }

    tests.passed = tests.failedTests === 0;
    return tests;
  }

  async testDesktopSidebar() {
    console.log('🖥️ Testing desktop sidebar functionality...');
    
    // Set desktop viewport
    await this.page.setViewportSize(VIEWPORTS.desktop);
    await this.page.waitForTimeout(1000);
    
    const sidebarTests = {
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      details: {}
    };

    // Test 1: Sidebar is present and visible
    sidebarTests.totalTests++;
    try {
      const sidebarExists = await this.page.evaluate(() => {
        const sidebar = document.querySelector('aside[class*="sidebar"]');
        return sidebar && sidebar.offsetParent !== null;
      });
      
      sidebarTests.details.sidebarExists = sidebarExists;
      if (sidebarExists) {
        sidebarTests.passedTests++;
      } else {
        sidebarTests.failedTests++;
        this.results.issues.push('Desktop sidebar not found or not visible');
      }
    } catch (error) {
      sidebarTests.failedTests++;
      sidebarTests.details.sidebarExists = false;
    }

    // Test 2: Sidebar has correct width
    sidebarTests.totalTests++;
    try {
      const sidebarWidth = await this.page.evaluate(() => {
        const sidebar = document.querySelector('aside[class*="sidebar"]');
        if (!sidebar) return 0;
        const style = window.getComputedStyle(sidebar);
        return parseInt(style.width);
      });
      
      const correctWidth = sidebarWidth === 256 || sidebarWidth === 64; // 64px collapsed, 256px expanded
      sidebarTests.details.sidebarWidth = sidebarWidth;
      sidebarTests.details.correctWidth = correctWidth;
      
      if (correctWidth) {
        sidebarTests.passedTests++;
      } else {
        sidebarTests.failedTests++;
        this.results.issues.push(`Sidebar width incorrect: ${sidebarWidth}px`);
      }
    } catch (error) {
      sidebarTests.failedTests++;
      sidebarTests.details.correctWidth = false;
    }

    // Test 3: Sidebar toggle functionality
    sidebarTests.totalTests++;
    try {
      // Find toggle button
      const toggleButton = await this.page.locator('button[aria-label*="sidebar"], button[title*="sidebar"]').first();
      
      if (await toggleButton.isVisible()) {
        // Get initial state
        const initialWidth = await this.page.evaluate(() => {
          const sidebar = document.querySelector('aside[class*="sidebar"]');
          if (!sidebar) return 0;
          return parseInt(window.getComputedStyle(sidebar).width);
        });
        
        // Click toggle
        await toggleButton.click();
        await this.page.waitForTimeout(500);
        
        // Check if width changed
        const newWidth = await this.page.evaluate(() => {
          const sidebar = document.querySelector('aside[class*="sidebar"]');
          if (!sidebar) return 0;
          return parseInt(window.getComputedStyle(sidebar).width);
        });
        
        const toggleWorks = initialWidth !== newWidth;
        sidebarTests.details.toggleWorks = toggleWorks;
        sidebarTests.details.initialWidth = initialWidth;
        sidebarTests.details.newWidth = newWidth;
        
        if (toggleWorks) {
          sidebarTests.passedTests++;
        } else {
          sidebarTests.failedTests++;
          this.results.issues.push('Sidebar toggle not working');
        }
        
        // Take screenshot of toggled state
        const screenshotPath = path.join(SCREENSHOT_DIR, `sidebar-toggled-${Date.now()}.png`);
        await this.page.screenshot({ path: screenshotPath, fullPage: true });
        this.results.screenshots.push({
          type: 'sidebar',
          name: 'Sidebar Toggled',
          path: screenshotPath
        });
        
      } else {
        sidebarTests.failedTests++;
        sidebarTests.details.toggleWorks = false;
        this.results.issues.push('Sidebar toggle button not found');
      }
    } catch (error) {
      sidebarTests.failedTests++;
      sidebarTests.details.toggleWorks = false;
    }

    // Test 4: Navigation links are present
    sidebarTests.totalTests++;
    try {
      const navLinks = await this.page.evaluate(() => {
        const links = document.querySelectorAll('aside[class*="sidebar"] a[href]');
        return Array.from(links).map(link => ({
          href: link.getAttribute('href'),
          text: link.textContent?.trim()
        }));
      });
      
      const hasNavLinks = navLinks.length > 0;
      sidebarTests.details.navLinks = navLinks;
      sidebarTests.details.hasNavLinks = hasNavLinks;
      
      if (hasNavLinks) {
        sidebarTests.passedTests++;
      } else {
        sidebarTests.failedTests++;
        this.results.issues.push('No navigation links found in sidebar');
      }
    } catch (error) {
      sidebarTests.failedTests++;
      sidebarTests.details.hasNavLinks = false;
    }

    sidebarTests.passed = sidebarTests.failedTests === 0;
    this.results.sidebarTests = sidebarTests;
    
    console.log(`  ${sidebarTests.passed ? '✅' : '❌'} Sidebar: ${sidebarTests.passedTests}/${sidebarTests.totalTests} tests passed`);
  }

  async testGridLayout() {
    console.log('📊 Testing grid layouts...');
    
    // Set desktop viewport
    await this.page.setViewportSize(VIEWPORTS.desktop);
    await this.page.waitForTimeout(1000);
    
    const gridTests = {
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      details: {}
    };

    // Test 1: 4-column grid for metrics
    gridTests.totalTests++;
    try {
      const gridInfo = await this.page.evaluate(() => {
        const metricCards = document.querySelectorAll('.grid-cols-1.sm\\:grid-cols-2.lg\\:grid-cols-4 > div, .card-luxury');
        if (metricCards.length === 0) return null;
        
        const parent = metricCards[0].parentElement;
        if (!parent) return null;
        
        const style = window.getComputedStyle(parent);
        return {
          display: style.display,
          gridTemplateColumns: style.gridTemplateColumns,
          childCount: metricCards.length
        };
      });
      
      const has4ColumnGrid = gridInfo && gridInfo.childCount >= 4;
      gridTests.details.metricGrid = gridInfo;
      gridTests.details.has4ColumnGrid = has4ColumnGrid;
      
      if (has4ColumnGrid) {
        gridTests.passedTests++;
      } else {
        gridTests.failedTests++;
        this.results.issues.push('4-column grid layout not found for metrics');
      }
    } catch (error) {
      gridTests.failedTests++;
      gridTests.details.has4ColumnGrid = false;
    }

    // Test 2: 3-column grid for performance sections
    gridTests.totalTests++;
    try {
      const performanceGrid = await this.page.evaluate(() => {
        const performanceCards = document.querySelectorAll('.grid-cols-1.md\\:grid-cols-3 > div');
        if (performanceCards.length === 0) return false;
        
        const parent = performanceCards[0].parentElement;
        if (!parent) return false;
        
        const style = window.getComputedStyle(parent);
        return {
          display: style.display,
          gridTemplateColumns: style.gridTemplateColumns,
          childCount: performanceCards.length
        };
      });
      
      const has3ColumnGrid = performanceGrid && performanceGrid.childCount >= 3;
      gridTests.details.performanceGrid = performanceGrid;
      gridTests.details.has3ColumnGrid = has3ColumnGrid;
      
      if (has3ColumnGrid) {
        gridTests.passedTests++;
      } else {
        gridTests.failedTests++;
        this.results.issues.push('3-column grid layout not found for performance sections');
      }
    } catch (error) {
      gridTests.failedTests++;
      gridTests.details.has3ColumnGrid = false;
    }

    // Test 3: 2-column grid for bottom sections
    gridTests.totalTests++;
    try {
      const bottomGrid = await this.page.evaluate(() => {
        const bottomCards = document.querySelectorAll('.grid-cols-1.lg\\:grid-cols-2 > div');
        if (bottomCards.length === 0) return false;
        
        const parent = bottomCards[0].parentElement;
        if (!parent) return false;
        
        const style = window.getComputedStyle(parent);
        return {
          display: style.display,
          gridTemplateColumns: style.gridTemplateColumns,
          childCount: bottomCards.length
        };
      });
      
      const has2ColumnGrid = bottomGrid && bottomGrid.childCount >= 2;
      gridTests.details.bottomGrid = bottomGrid;
      gridTests.details.has2ColumnGrid = has2ColumnGrid;
      
      if (has2ColumnGrid) {
        gridTests.passedTests++;
      } else {
        gridTests.failedTests++;
        this.results.issues.push('2-column grid layout not found for bottom sections');
      }
    } catch (error) {
      gridTests.failedTests++;
      gridTests.details.has2ColumnGrid = false;
    }

    // Take screenshot of grid layout
    const screenshotPath = path.join(SCREENSHOT_DIR, `grid-layout-${Date.now()}.png`);
    await this.page.screenshot({ path: screenshotPath, fullPage: true });
    this.results.screenshots.push({
      type: 'grid',
      name: 'Grid Layout',
      path: screenshotPath
    });

    gridTests.passed = gridTests.failedTests === 0;
    this.results.gridTests = gridTests;
    
    console.log(`  ${gridTests.passed ? '✅' : '❌'} Grid: ${gridTests.passedTests}/${gridTests.totalTests} tests passed`);
  }

  async testContainerConstraints() {
    console.log('📦 Testing container width constraints...');
    
    // Set large desktop viewport
    await this.page.setViewportSize(VIEWPORTS.largeDesktop);
    await this.page.waitForTimeout(1000);
    
    const containerTests = {
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      details: {}
    };

    // Test 1: Main content has max-w-7xl constraint
    containerTests.totalTests++;
    try {
      const containerInfo = await this.page.evaluate(() => {
        const main = document.querySelector('main');
        if (!main) return null;
        
        const style = window.getComputedStyle(main);
        const computedMaxWidth = style.maxWidth;
        const actualWidth = main.offsetWidth;
        
        // Check if it has max-w-7xl class or equivalent
        const hasMaxW7xl = main.classList.contains('max-w-7xl') || 
                          computedMaxWidth === '80rem' || 
                          computedMaxWidth === '1280px';
        
        return {
          hasMaxW7xl,
          computedMaxWidth,
          actualWidth,
          classes: Array.from(main.classList)
        };
      });
      
      const hasConstraint = containerInfo && containerInfo.hasMaxW7xl;
      containerTests.details.containerConstraint = containerInfo;
      containerTests.details.hasConstraint = hasConstraint;
      
      if (hasConstraint) {
        containerTests.passedTests++;
      } else {
        containerTests.failedTests++;
        this.results.issues.push('Main content container missing max-w-7xl constraint');
      }
    } catch (error) {
      containerTests.failedTests++;
      containerTests.details.hasConstraint = false;
    }

    // Test 2: Container doesn't exceed max width on large screens
    containerTests.totalTests++;
    try {
      const widthCheck = await this.page.evaluate(() => {
        const main = document.querySelector('main');
        if (!main) return null;
        
        const width = main.offsetWidth;
        const maxWidth = 1280; // 7xl = 80rem = 1280px
        const withinLimit = width <= maxWidth;
        
        return {
          width,
          maxWidth,
          withinLimit
        };
      });
      
      const withinLimit = widthCheck && widthCheck.withinLimit;
      containerTests.details.widthCheck = widthCheck;
      containerTests.details.withinLimit = withinLimit;
      
      if (withinLimit) {
        containerTests.passedTests++;
      } else {
        containerTests.failedTests++;
        this.results.issues.push(`Container width exceeds limit: ${widthCheck?.width}px`);
      }
    } catch (error) {
      containerTests.failedTests++;
      containerTests.details.withinLimit = false;
    }

    // Test 3: Container is centered on large screens
    containerTests.totalTests++;
    try {
      const centerCheck = await this.page.evaluate(() => {
        const main = document.querySelector('main');
        if (!main) return null;
        
        const style = window.getComputedStyle(main);
        const marginLeft = style.marginLeft;
        const marginRight = style.marginRight;
        const isAutoCentered = marginLeft === 'auto' && marginRight === 'auto';
        
        return {
          marginLeft,
          marginRight,
          isAutoCentered,
          classes: Array.from(main.classList)
        };
      });
      
      const isCentered = centerCheck && (centerCheck.isAutoCentered || 
                                        centerCheck.classes.includes('mx-auto') ||
                                        centerCheck.classes.includes('container'));
      containerTests.details.centerCheck = centerCheck;
      containerTests.details.isCentered = isCentered;
      
      if (isCentered) {
        containerTests.passedTests++;
      } else {
        containerTests.failedTests++;
        this.results.issues.push('Container not properly centered on large screens');
      }
    } catch (error) {
      containerTests.failedTests++;
      containerTests.details.isCentered = false;
    }

    // Take screenshot of container on large screen
    const screenshotPath = path.join(SCREENSHOT_DIR, `container-constraint-${Date.now()}.png`);
    await this.page.screenshot({ path: screenshotPath, fullPage: true });
    this.results.screenshots.push({
      type: 'container',
      name: 'Container Constraint',
      path: screenshotPath
    });

    containerTests.passed = containerTests.failedTests === 0;
    this.results.containerTests = containerTests;
    
    console.log(`  ${containerTests.passed ? '✅' : '❌'} Container: ${containerTests.passedTests}/${containerTests.totalTests} tests passed`);
  }

  async testResponsiveTransitions() {
    console.log('🔄 Testing responsive transitions...');
    
    const responsiveTests = {
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      details: {}
    };

    // Test 1: Mobile to Desktop transition
    responsiveTests.totalTests++;
    try {
      // Start with mobile
      await this.page.setViewportSize(VIEWPORTS.mobile);
      await this.page.waitForTimeout(1000);
      
      const mobileState = await this.page.evaluate(() => {
        const sidebar = document.querySelector('aside[class*="sidebar"]');
        if (!sidebar) return { visible: false, width: 0 };
        
        const style = window.getComputedStyle(sidebar);
        return {
          visible: style.display !== 'none',
          width: parseInt(style.width),
          transform: style.transform
        };
      });
      
      // Transition to desktop
      await this.page.setViewportSize(VIEWPORTS.desktop);
      await this.page.waitForTimeout(1000);
      
      const desktopState = await this.page.evaluate(() => {
        const sidebar = document.querySelector('aside[class*="sidebar"]');
        if (!sidebar) return { visible: false, width: 0 };
        
        const style = window.getComputedStyle(sidebar);
        return {
          visible: style.display !== 'none',
          width: parseInt(style.width),
          transform: style.transform
        };
      });
      
      const transitionWorks = !mobileState.visible && desktopState.visible;
      responsiveTests.details.mobileToDesktop = {
        mobileState,
        desktopState,
        transitionWorks
      };
      
      if (transitionWorks) {
        responsiveTests.passedTests++;
      } else {
        responsiveTests.failedTests++;
        this.results.issues.push('Mobile to desktop sidebar transition not working');
      }
    } catch (error) {
      responsiveTests.failedTests++;
      responsiveTests.details.mobileToDesktop = { transitionWorks: false };
    }

    // Test 2: Grid layout transitions
    responsiveTests.totalTests++;
    try {
      // Test mobile grid
      await this.page.setViewportSize(VIEWPORTS.mobile);
      await this.page.waitForTimeout(1000);
      
      const mobileGrid = await this.page.evaluate(() => {
        const metricGrid = document.querySelector('.grid-cols-1.sm\\:grid-cols-2.lg\\:grid-cols-4');
        if (!metricGrid) return null;
        
        const style = window.getComputedStyle(metricGrid);
        return {
          gridTemplateColumns: style.gridTemplateColumns,
          childCount: metricGrid.children.length
        };
      });
      
      // Test desktop grid
      await this.page.setViewportSize(VIEWPORTS.desktop);
      await this.page.waitForTimeout(1000);
      
      const desktopGrid = await this.page.evaluate(() => {
        const metricGrid = document.querySelector('.grid-cols-1.sm\\:grid-cols-2.lg\\:grid-cols-4');
        if (!metricGrid) return null;
        
        const style = window.getComputedStyle(metricGrid);
        return {
          gridTemplateColumns: style.gridTemplateColumns,
          childCount: metricGrid.children.length
        };
      });
      
      const gridTransitionWorks = mobileGrid && desktopGrid && 
                                  mobileGrid.gridTemplateColumns !== desktopGrid.gridTemplateColumns;
      
      responsiveTests.details.gridTransition = {
        mobileGrid,
        desktopGrid,
        transitionWorks: gridTransitionWorks
      };
      
      if (gridTransitionWorks) {
        responsiveTests.passedTests++;
      } else {
        responsiveTests.failedTests++;
        this.results.issues.push('Grid layout transition not working');
      }
    } catch (error) {
      responsiveTests.failedTests++;
      responsiveTests.details.gridTransition = { transitionWorks: false };
    }

    // Test 3: Smooth transitions and animations
    responsiveTests.totalTests++;
    try {
      const transitionInfo = await this.page.evaluate(() => {
        const elements = document.querySelectorAll('.card-luxury, .nav-item-luxury, button');
        let hasTransitions = 0;
        let totalElements = elements.length;
        
        elements.forEach(el => {
          const style = window.getComputedStyle(el);
          if (style.transition && style.transition !== 'none') {
            hasTransitions++;
          }
        });
        
        return {
          totalElements,
          elementsWithTransitions: hasTransitions,
          transitionPercentage: totalElements > 0 ? (hasTransitions / totalElements) * 100 : 0
        };
      });
      
      const hasGoodTransitions = transitionInfo.transitionPercentage >= 50;
      responsiveTests.details.transitions = transitionInfo;
      responsiveTests.details.hasGoodTransitions = hasGoodTransitions;
      
      if (hasGoodTransitions) {
        responsiveTests.passedTests++;
      } else {
        responsiveTests.failedTests++;
        this.results.issues.push(`Insufficient transitions: ${transitionInfo.transitionPercentage.toFixed(1)}%`);
      }
    } catch (error) {
      responsiveTests.failedTests++;
      responsiveTests.details.hasGoodTransitions = false;
    }

    responsiveTests.passed = responsiveTests.failedTests === 0;
    this.results.responsiveTests = responsiveTests;
    
    console.log(`  ${responsiveTests.passed ? '✅' : '❌'} Responsive: ${responsiveTests.passedTests}/${responsiveTests.totalTests} tests passed`);
  }

  async generateReport() {
    console.log('📋 Generating comprehensive report...');
    
    // Calculate summary
    const allTests = [
      this.results.viewportTests,
      this.results.sidebarTests,
      this.results.gridTests,
      this.results.containerTests,
      this.results.responsiveTests
    ];
    
    this.results.summary.totalTests = allTests.reduce((sum, test) => sum + (test.totalTests || 0), 0);
    this.results.summary.passedTests = allTests.reduce((sum, test) => sum + (test.passedTests || 0), 0);
    this.results.summary.failedTests = allTests.reduce((sum, test) => sum + (test.failedTests || 0), 0);
    this.results.summary.overallStatus = this.results.summary.failedTests === 0 ? 'PASSED' : 'FAILED';
    
    // Generate markdown report
    const report = this.generateMarkdownReport();
    fs.writeFileSync(REPORT_FILE, report);
    
    // Generate JSON report
    const jsonReport = JSON.stringify(this.results, null, 2);
    fs.writeFileSync(REPORT_FILE.replace('.md', '.json'), jsonReport);
    
    console.log(`📄 Report generated: ${REPORT_FILE}`);
    console.log(`📊 Overall Status: ${this.results.summary.overallStatus}`);
    console.log(`✅ Passed: ${this.results.summary.passedTests}/${this.results.summary.totalTests}`);
    
    if (this.results.summary.failedTests > 0) {
      console.log(`❌ Failed: ${this.results.summary.failedTests}`);
      console.log(`🔍 Issues found: ${this.results.issues.length}`);
    }
  }

  generateMarkdownReport() {
    const { results } = this;
    
    let report = `# DESKTOP LAYOUT VERIFICATION REPORT\n\n`;
    report += `**Generated:** ${new Date(results.timestamp).toLocaleString()}\n`;
    report += `**Overall Status:** ${results.summary.overallStatus === 'PASSED' ? '✅ PASSED' : '❌ FAILED'}\n\n`;
    
    // Summary
    report += `## 📊 Summary\n\n`;
    report += `- **Total Tests:** ${results.summary.totalTests}\n`;
    report += `- **Passed:** ${results.summary.passedTests}\n`;
    report += `- **Failed:** ${results.summary.failedTests}\n`;
    report += `- **Success Rate:** ${((results.summary.passedTests / results.summary.totalTests) * 100).toFixed(1)}%\n\n`;
    
    // Issues
    if (results.issues.length > 0) {
      report += `## 🚨 Issues Found\n\n`;
      results.issues.forEach((issue, index) => {
        report += `${index + 1}. ${issue}\n`;
      });
      report += `\n`;
    }
    
    // Viewport Tests
    report += `## 📱 Viewport Tests\n\n`;
    Object.entries(results.viewportTests).forEach(([key, test]) => {
      const viewport = VIEWPORTS[key];
      report += `### ${viewport.name} (${viewport.width}x${viewport.height})\n\n`;
      report += `- **Status:** ${test.passed ? '✅ PASSED' : '❌ FAILED'}\n`;
      report += `- **Tests:** ${test.passedTests}/${test.totalTests} passed\n\n`;
      
      if (test.details) {
        report += `**Details:**\n`;
        Object.entries(test.details).forEach(([detailKey, value]) => {
          if (typeof value === 'boolean') {
            report += `- ${detailKey}: ${value ? '✅' : '❌'}\n`;
          } else {
            report += `- ${detailKey}: ${value}\n`;
          }
        });
        report += `\n`;
      }
    });
    
    // Sidebar Tests
    report += `## 🖥️ Desktop Sidebar Tests\n\n`;
    report += `- **Status:** ${results.sidebarTests.passed ? '✅ PASSED' : '❌ FAILED'}\n`;
    report += `- **Tests:** ${results.sidebarTests.passedTests}/${results.sidebarTests.totalTests} passed\n\n`;
    
    if (results.sidebarTests.details) {
      report += `**Details:**\n`;
      Object.entries(results.sidebarTests.details).forEach(([key, value]) => {
        if (typeof value === 'boolean') {
          report += `- ${key}: ${value ? '✅' : '❌'}\n`;
        } else if (typeof value === 'object') {
          report += `- ${key}: ${JSON.stringify(value, null, 2)}\n`;
        } else {
          report += `- ${key}: ${value}\n`;
        }
      });
      report += `\n`;
    }
    
    // Grid Tests
    report += `## 📊 Grid Layout Tests\n\n`;
    report += `- **Status:** ${results.gridTests.passed ? '✅ PASSED' : '❌ FAILED'}\n`;
    report += `- **Tests:** ${results.gridTests.passedTests}/${results.gridTests.totalTests} passed\n\n`;
    
    if (results.gridTests.details) {
      report += `**Details:**\n`;
      Object.entries(results.gridTests.details).forEach(([key, value]) => {
        if (typeof value === 'boolean') {
          report += `- ${key}: ${value ? '✅' : '❌'}\n`;
        } else if (typeof value === 'object') {
          report += `- ${key}: ${JSON.stringify(value, null, 2)}\n`;
        } else {
          report += `- ${key}: ${value}\n`;
        }
      });
      report += `\n`;
    }
    
    // Container Tests
    report += `## 📦 Container Constraint Tests\n\n`;
    report += `- **Status:** ${results.containerTests.passed ? '✅ PASSED' : '❌ FAILED'}\n`;
    report += `- **Tests:** ${results.containerTests.passedTests}/${results.containerTests.totalTests} passed\n\n`;
    
    if (results.containerTests.details) {
      report += `**Details:**\n`;
      Object.entries(results.containerTests.details).forEach(([key, value]) => {
        if (typeof value === 'boolean') {
          report += `- ${key}: ${value ? '✅' : '❌'}\n`;
        } else if (typeof value === 'object') {
          report += `- ${key}: ${JSON.stringify(value, null, 2)}\n`;
        } else {
          report += `- ${key}: ${value}\n`;
        }
      });
      report += `\n`;
    }
    
    // Responsive Tests
    report += `## 🔄 Responsive Transition Tests\n\n`;
    report += `- **Status:** ${results.responsiveTests.passed ? '✅ PASSED' : '❌ FAILED'}\n`;
    report += `- **Tests:** ${results.responsiveTests.passedTests}/${results.responsiveTests.totalTests} passed\n\n`;
    
    if (results.responsiveTests.details) {
      report += `**Details:**\n`;
      Object.entries(results.responsiveTests.details).forEach(([key, value]) => {
        if (typeof value === 'boolean') {
          report += `- ${key}: ${value ? '✅' : '❌'}\n`;
        } else if (typeof value === 'object') {
          report += `- ${key}: ${JSON.stringify(value, null, 2)}\n`;
        } else {
          report += `- ${key}: ${value}\n`;
        }
      });
      report += `\n`;
    }
    
    // Screenshots
    report += `## 📸 Screenshots\n\n`;
    results.screenshots.forEach((screenshot, index) => {
      report += `${index + 1}. **${screenshot.name}** (${screenshot.type})\n`;
      report += `   - Path: \`${screenshot.path}\`\n`;
      if (screenshot.viewport) {
        report += `   - Viewport: ${screenshot.viewport.name} (${screenshot.viewport.width}x${screenshot.viewport.height})\n`;
      }
      report += `\n`;
    });
    
    return report;
  }

  async cleanup() {
    console.log('🧹 Cleaning up...');
    
    if (this.page) {
      await this.page.close();
    }
    
    if (this.context) {
      await this.context.close();
    }
    
    if (this.browser) {
      await this.browser.close();
    }
  }

  async run() {
    try {
      await this.initialize();
      
      const dashboardLoaded = await this.navigateToDashboard();
      if (!dashboardLoaded) {
        console.error('❌ Cannot proceed without dashboard access');
        return false;
      }
      
      await this.testViewportSizes();
      await this.testDesktopSidebar();
      await this.testGridLayout();
      await this.testContainerConstraints();
      await this.testResponsiveTransitions();
      
      await this.generateReport();
      
      return this.results.summary.overallStatus === 'PASSED';
      
    } catch (error) {
      console.error('❌ Verification failed:', error);
      this.results.issues.push(`Verification error: ${error.message}`);
      return false;
    } finally {
      await this.cleanup();
    }
  }
}

// Run the verification
async function main() {
  console.log('🔍 DESKTOP LAYOUT VERIFICATION STARTED\n');
  
  const verifier = new DesktopLayoutVerifier();
  const success = await verifier.run();
  
  console.log(`\n🏁 VERIFICATION ${success ? 'COMPLETED SUCCESSFULLY' : 'COMPLETED WITH ISSUES'}`);
  
  if (!success) {
    process.exit(1);
  }
}

// Handle unhandled errors
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

module.exports = DesktopLayoutVerifier;