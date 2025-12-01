const { chromium } = require('playwright');
const fs = require('fs');

/**
 * DESKTOP LAYOUT DIAGNOSTIC SCRIPT
 * 
 * This script validates our assumptions about the desktop layout issues
 * and provides detailed logging for debugging
 */

async function runDiagnostics() {
  console.log('🔍 DESKTOP LAYOUT DIAGNOSTIC STARTED\n');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Enable console logging
  page.on('console', msg => {
    console.log(`PAGE LOG: ${msg.text()}`);
  });
  
  try {
    // First navigate to home and check authentication
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    // Check if we need to login
    const currentUrl = page.url();
    console.log(`Current URL: ${currentUrl}`);
    
    if (currentUrl.includes('/login') || currentUrl === 'http://localhost:3000/') {
      console.log('Attempting login...');
      try {
        await page.fill('input[type="email"]', 'test@example.com');
        await page.fill('input[type="password"]', 'testpassword123');
        await page.click('button[type="submit"]');
        await page.waitForTimeout(3000);
      } catch (e) {
        console.log('Login attempt failed:', e.message);
      }
    }
    
    // Navigate to dashboard
    await page.goto('http://localhost:3000/dashboard', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    
    // Debug: Log current page content
    const pageContent = await page.evaluate(() => {
      return {
        title: document.title,
        url: window.location.href,
        hasMain: !!document.querySelector('main'),
        bodyClasses: document.body.className
      };
    });
    console.log('Page info:', pageContent);
    
    console.log('📱 DIAGNOSTIC 1: Typography Analysis');
    await diagnoseTypography(page);
    
    console.log('\n🖥️ DIAGNOSTIC 2: Sidebar Structure Analysis');
    await diagnoseSidebar(page);
    
    console.log('\n📦 DIAGNOSTIC 3: Container Analysis');
    await diagnoseContainer(page);
    
    console.log('\n📊 DIAGNOSTIC 4: Grid Layout Analysis');
    await diagnoseGrids(page);
    
    console.log('\n🔄 DIAGNOSTIC 5: Responsive Behavior');
    await diagnoseResponsive(page);
    
  } catch (error) {
    console.error('❌ Diagnostic failed:', error);
  } finally {
    await browser.close();
  }
  
  console.log('\n🏁 DIAGNOSTIC COMPLETED');
}

async function diagnoseTypography(page) {
  const typographyInfo = await page.evaluate(() => {
    // Check root font size
    const html = document.documentElement;
    const htmlStyle = window.getComputedStyle(html);
    const htmlFontSize = htmlStyle.fontSize;
    
    // Check body font size
    const body = document.body;
    const bodyStyle = window.getComputedStyle(body);
    const bodyFontSize = bodyStyle.fontSize;
    
    // Find smallest text element
    const textElements = document.querySelectorAll('p, span, div, h1, h2, h3, h4, h5, h6, button, a');
    let minSize = Infinity;
    let minElement = null;
    
    textElements.forEach(el => {
      const style = window.getComputedStyle(el);
      const size = parseFloat(style.fontSize);
      if (size > 0 && size < minSize) {
        minSize = size;
        minElement = {
          tagName: el.tagName,
          className: el.className,
          text: el.textContent?.slice(0, 50),
          fontSize: size
        };
      }
    });
    
    // Check CSS variables
    const rootStyle = getComputedStyle(document.documentElement);
    const cssVars = {};
    for (let i = 0; i < rootStyle.length; i++) {
      const prop = rootStyle[i];
      if (prop.startsWith('--text-')) {
        cssVars[prop] = rootStyle.getPropertyValue(prop);
      }
    }
    
    return {
      htmlFontSize,
      bodyFontSize,
      minSize,
      minElement,
      cssVars,
      browserZoom: window.devicePixelRatio
    };
  });
  
  console.log('  Typography Details:');
  console.log(`    HTML font-size: ${typographyInfo.htmlFontSize}`);
  console.log(`    Body font-size: ${typographyInfo.bodyFontSize}`);
  console.log(`    Minimum font size: ${typographyInfo.minSize}px`);
  console.log(`    Smallest element:`, typographyInfo.minElement);
  console.log(`    Browser zoom: ${typographyInfo.browserZoom}`);
  console.log(`    CSS --text-base: ${typographyInfo.cssVars['--text-base']}`);
  
  const isProblem = typographyInfo.minSize < 16;
  console.log(`    ❌ Typography issue: ${isProblem ? 'CONFIRMED' : 'NONE'}`);
}

async function diagnoseSidebar(page) {
  const sidebarInfo = await page.evaluate(() => {
    // Find all potential sidebar elements
    const sidebars = Array.from(document.querySelectorAll('aside, [class*="sidebar"], [class*="Sidebar"]'));
    
    const sidebarDetails = sidebars.map((sidebar, index) => {
      const style = window.getComputedStyle(sidebar);
      const rect = sidebar.getBoundingClientRect();
      
      return {
        index,
        tagName: sidebar.tagName,
        className: sidebar.className,
        id: sidebar.id,
        display: style.display,
        visibility: style.visibility,
        width: rect.width,
        height: rect.height,
        position: style.position,
        transform: style.transform,
        zIndex: style.zIndex
      };
    });
    
    // Check for navigation links
    const navLinks = Array.from(document.querySelectorAll('aside a, nav a, [href*="/dashboard"], [href*="/strategies"]'));
    const uniqueLinks = [...new Set(navLinks.map(link => link.href))];
    
    // Check for toggle buttons
    const toggleButtons = Array.from(document.querySelectorAll('button[aria-label*="sidebar"], button[title*="sidebar"], button[class*="toggle"]'));
    
    return {
      sidebarsFound: sidebars.length,
      sidebarDetails,
      navLinksCount: uniqueLinks.length,
      toggleButtonsCount: toggleButtons.length,
      toggleButtonDetails: toggleButtons.map(btn => ({
        className: btn.className,
        ariaLabel: btn.getAttribute('aria-label'),
        title: btn.getAttribute('title'),
        text: btn.textContent
      }))
    };
  });
  
  console.log('  Sidebar Details:');
  console.log(`    Sidebars found: ${sidebarInfo.sidebarsFound}`);
  
  sidebarInfo.sidebarDetails.forEach(sidebar => {
    console.log(`    Sidebar ${sidebar.index}:`);
    console.log(`      Tag: ${sidebar.tagName}`);
    console.log(`      Classes: ${sidebar.className}`);
    console.log(`      Width: ${sidebar.width}px`);
    console.log(`      Display: ${sidebar.display}`);
    console.log(`      Visible: ${sidebar.visibility}`);
  });
  
  console.log(`    Navigation links: ${sidebarInfo.navLinksCount}`);
  console.log(`    Toggle buttons: ${sidebarInfo.toggleButtonsCount}`);
  
  sidebarInfo.toggleButtonDetails.forEach(btn => {
    console.log(`    Toggle button: ${btn.ariaLabel || btn.title || btn.text}`);
  });
  
  const hasSidebar = sidebarInfo.sidebarsFound > 0;
  const hasCorrectWidth = sidebarInfo.sidebarDetails.some(s => s.width === 256 || s.width === 64);
  const hasToggle = sidebarInfo.toggleButtonsCount > 0;
  
  console.log(`    ❌ Sidebar issues: ${!hasSidebar ? 'NO SIDEBAR' : !hasCorrectWidth ? 'WRONG WIDTH' : !hasToggle ? 'NO TOGGLE' : 'NONE'}`);
}

async function diagnoseContainer(page) {
  const containerInfo = await page.evaluate(() => {
    // Find main content area
    const main = document.querySelector('main') || document.querySelector('[class*="main"]') || document.querySelector('div[class*="flex-1"]');
    if (!main) return { error: 'No main element found' };
    
    const mainStyle = window.getComputedStyle(main);
    const mainRect = main.getBoundingClientRect();
    
    // Check all containers with potential max-width
    const containers = Array.from(document.querySelectorAll('[class*="max-w"], [class*="container"], [class*="w-"]'));
    
    const containerDetails = containers.map((container, index) => {
      const style = window.getComputedStyle(container);
      const rect = container.getBoundingClientRect();
      
      return {
        index,
        tagName: container.tagName,
        className: container.className,
        maxWidth: style.maxWidth,
        width: rect.width,
        marginLeft: style.marginLeft,
        marginRight: style.marginRight,
        margin: style.margin
      };
    });
    
    return {
      mainExists: !!main,
      mainClasses: main.className,
      mainMaxWidth: mainStyle.maxWidth,
      mainWidth: mainRect.width,
      mainMarginLeft: mainStyle.marginLeft,
      mainMarginRight: mainStyle.marginRight,
      containersFound: containers.length,
      containerDetails
    };
  });
  
  console.log('  Container Details:');
  console.log(`    Main element exists: ${containerInfo.mainExists}`);
  console.log(`    Main classes: ${containerInfo.mainClasses}`);
  console.log(`    Main max-width: ${containerInfo.mainMaxWidth}`);
  console.log(`    Main width: ${containerInfo.mainWidth}px`);
  console.log(`    Main margins: ${containerInfo.mainMarginLeft} / ${containerInfo.mainMarginRight}`);
  console.log(`    Containers with width classes: ${containerInfo.containersFound}`);
  
  containerInfo.containerDetails.forEach(container => {
    console.log(`    Container ${container.index}:`);
    console.log(`      Classes: ${container.className}`);
    console.log(`      Max-width: ${container.maxWidth}`);
    console.log(`      Width: ${container.width}px`);
  });
  
  const hasMaxW7xl = containerInfo.mainMaxWidth === '80rem' || 
                     containerInfo.mainMaxWidth === '1280px' ||
                     containerInfo.mainClasses.includes('max-w-7xl');
  
  console.log(`    ❌ Container issues: ${!hasMaxW7xl ? 'MISSING MAX-W-7XL' : 'NONE'}`);
}

async function diagnoseGrids(page) {
  const gridInfo = await page.evaluate(() => {
    // Find grid elements
    const gridElements = Array.from(document.querySelectorAll('[class*="grid"]'));
    
    const gridDetails = gridElements.map((grid, index) => {
      const style = window.getComputedStyle(grid);
      const rect = grid.getBoundingClientRect();
      const children = grid.children.length;
      
      return {
        index,
        className: grid.className,
        display: style.display,
        gridTemplateColumns: style.gridTemplateColumns,
        childCount: children,
        width: rect.width
      };
    });
    
    // Look for specific dashboard grids
    const metricGrid = document.querySelector('.grid-cols-1.sm\\:grid-cols-2.lg\\:grid-cols-4');
    const performanceGrid = document.querySelector('.grid-cols-1.md\\:grid-cols-3');
    const bottomGrid = document.querySelector('.grid-cols-1.lg\\:grid-cols-2');
    
    return {
      totalGrids: gridElements.length,
      gridDetails,
      specificGrids: {
        metricGrid: !!metricGrid,
        performanceGrid: !!performanceGrid,
        bottomGrid: !!bottomGrid
      }
    };
  });
  
  console.log('  Grid Details:');
  console.log(`    Total grid elements: ${gridInfo.totalGrids}`);
  
  gridInfo.gridDetails.forEach(grid => {
    console.log(`    Grid ${grid.index}:`);
    console.log(`      Classes: ${grid.className}`);
    console.log(`      Display: ${grid.display}`);
    console.log(`      Grid columns: ${grid.gridTemplateColumns}`);
    console.log(`      Children: ${grid.childCount}`);
  });
  
  console.log(`    Specific dashboard grids:`);
  console.log(`      Metric grid (4-col): ${gridInfo.specificGrids.metricGrid ? '✅' : '❌'}`);
  console.log(`      Performance grid (3-col): ${gridInfo.specificGrids.performanceGrid ? '✅' : '❌'}`);
  console.log(`      Bottom grid (2-col): ${gridInfo.specificGrids.bottomGrid ? '✅' : '❌'}`);
}

async function diagnoseResponsive(page) {
  console.log('  Testing responsive behavior...');
  
  // Test mobile
  await page.setViewportSize({ width: 375, height: 667 });
  await page.waitForTimeout(1000);
  
  const mobileState = await page.evaluate(() => {
    const sidebar = document.querySelector('aside, [class*="sidebar"], [class*="Sidebar"]');
    if (!sidebar) return { visible: false, width: 0 };
    
    const style = window.getComputedStyle(sidebar);
    const rect = sidebar.getBoundingClientRect();
    
    return {
      visible: style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0,
      width: rect.width,
      display: style.display
    };
  });
  
  // Test desktop
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.waitForTimeout(1000);
  
  const desktopState = await page.evaluate(() => {
    const sidebar = document.querySelector('aside, [class*="sidebar"], [class*="Sidebar"]');
    if (!sidebar) return { visible: false, width: 0 };
    
    const style = window.getComputedStyle(sidebar);
    const rect = sidebar.getBoundingClientRect();
    
    return {
      visible: style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0,
      width: rect.width,
      display: style.display
    };
  });
  
  console.log(`    Mobile sidebar: ${mobileState.visible ? 'VISIBLE' : 'HIDDEN'} (${mobileState.width}px)`);
  console.log(`    Desktop sidebar: ${desktopState.visible ? 'VISIBLE' : 'HIDDEN'} (${desktopState.width}px)`);
  
  const responsiveWorking = !mobileState.visible && desktopState.visible;
  console.log(`    ❌ Responsive issues: ${responsiveWorking ? 'NONE' : 'SIDEBAR NOT RESPONSIVE'}`);
}

// Run diagnostics
if (require.main === module) {
  runDiagnostics().catch(console.error);
}

module.exports = { runDiagnostics };