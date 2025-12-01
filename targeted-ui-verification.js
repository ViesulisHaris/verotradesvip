const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Configuration
const APP_URL = 'http://localhost:3000';
const SCREENSHOT_DIR = './targeted-ui-verification-screenshots';
const REPORT_FILE = './TARGETED_UI_COLOR_REVERSION_REPORT.md';

// Create screenshot directory if it doesn't exist
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

// Verification results
const verificationResults = {
  serverStatus: { status: 'pending', details: '' },
  sidebarComponents: { status: 'pending', details: [] },
  filterPills: { status: 'pending', details: [] },
  chartContainers: { status: 'pending', details: [] },
  scrollbarStyles: { status: 'pending', details: [] },
  buttonFormElements: { status: 'pending', details: [] },
  modalComponents: { status: 'pending', details: [] },
  balatroBackground: { status: 'pending', details: [] },
  visualHarmony: { status: 'pending', details: [] },
  basicFunctionality: { status: 'pending', details: [] }
};

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function takeScreenshot(page, name, description) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `${name}-${timestamp}.png`;
  const filepath = path.join(SCREENSHOT_DIR, filename);
  
  await page.screenshot({ 
    path: filepath, 
    fullPage: false,
    clip: { x: 0, y: 0, width: 1920, height: 1080 }
  });
  
  console.log(`📸 Screenshot saved: ${filename} - ${description}`);
  return filepath;
}

async function verifyServerStatus() {
  console.log('\n🔍 Verifying server status...');
  
  try {
    const browser = await puppeteer.launch({ 
      headless: false,
      defaultViewport: { width: 1920, height: 1080 }
    });
    const page = await browser.newPage();
    
    // Set user agent to avoid any potential issues
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
    
    const response = await page.goto(APP_URL, { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    if (response.status() === 200) {
      verificationResults.serverStatus.status = '✅ PASS';
      verificationResults.serverStatus.details = `Server responded with status 200. Application loaded successfully.`;
      
      // Take initial screenshot
      await takeScreenshot(page, 'app-loaded', 'Application loaded successfully');
      
      await browser.close();
      return true;
    } else {
      verificationResults.serverStatus.status = '❌ FAIL';
      verificationResults.serverStatus.details = `Server responded with status ${response.status()}`;
      await browser.close();
      return false;
    }
  } catch (error) {
    verificationResults.serverStatus.status = '❌ FAIL';
    verificationResults.serverStatus.details = `Error connecting to server: ${error.message}`;
    return false;
  }
}

async function verifySidebarComponents() {
  console.log('\n🔍 Verifying sidebar components...');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1920, height: 1080 }
  });
  const page = await browser.newPage();
  
  try {
    await page.goto(APP_URL, { waitUntil: 'networkidle2' });
    await sleep(3000);
    
    // Check for navigation menu items and sidebar elements
    const navElements = await page.evaluate(() => {
      const results = [];
      
      // Look for navigation elements
      const navItems = document.querySelectorAll('nav a, nav button, .nav-item, [class*="nav"], [class*="menu"]');
      navItems.forEach((item, index) => {
        if (index < 5) { // Limit to first 5 items
          const computed = window.getComputedStyle(item);
          results.push({
            element: `Nav Item ${index + 1}`,
            classes: item.className,
            background: computed.background,
            backgroundColor: computed.backgroundColor,
            borderColor: computed.borderColor,
            boxShadow: computed.boxShadow,
            hasBluePurple: computed.background.includes('59, 130, 246') || 
                         computed.background.includes('147, 51, 234') ||
                         computed.backgroundColor.includes('59, 130, 246') || 
                         computed.backgroundColor.includes('147, 51, 234') ||
                         computed.borderColor.includes('59, 130, 246') || 
                         computed.borderColor.includes('147, 51, 234')
          });
        }
      });
      
      // Look for sidebar or navigation container
      const sidebarContainer = document.querySelector('nav, aside, [class*="sidebar"], [class*="nav"]');
      if (sidebarContainer) {
        const computed = window.getComputedStyle(sidebarContainer);
        results.push({
          element: 'Navigation Container',
          classes: sidebarContainer.className,
          background: computed.background,
          backgroundColor: computed.backgroundColor,
          borderColor: computed.borderColor,
          boxShadow: computed.boxShadow,
          hasBluePurple: computed.background.includes('59, 130, 246') || 
                       computed.background.includes('147, 51, 234') ||
                       computed.backgroundColor.includes('59, 130, 246') || 
                       computed.backgroundColor.includes('147, 51, 234') ||
                       computed.borderColor.includes('59, 130, 246') || 
                       computed.borderColor.includes('147, 51, 234')
        });
      }
      
      return results;
    });
    
    verificationResults.sidebarComponents.details = navElements;
    
    // Determine overall status
    const passedItems = navElements.filter(item => item.hasBluePurple).length;
    const totalItems = navElements.length;
    
    if (passedItems / totalItems >= 0.6) {
      verificationResults.sidebarComponents.status = '✅ PASS';
    } else if (passedItems / totalItems >= 0.3) {
      verificationResults.sidebarComponents.status = '⚠️ PARTIAL';
    } else {
      verificationResults.sidebarComponents.status = '❌ FAIL';
    }
    
    await takeScreenshot(page, 'sidebar-components', 'Sidebar and navigation components');
    
  } catch (error) {
    verificationResults.sidebarComponents.status = '❌ ERROR';
    verificationResults.sidebarComponents.details.push(`Error: ${error.message}`);
  } finally {
    await browser.close();
  }
}

async function verifyFilterPills() {
  console.log('\n🔍 Verifying filter pills and interactive elements...');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1920, height: 1080 }
  });
  const page = await browser.newPage();
  
  try {
    await page.goto(APP_URL, { waitUntil: 'networkidle2' });
    await sleep(3000);
    
    // Check for filter controls and interactive elements
    const filterElements = await page.evaluate(() => {
      const results = [];
      
      // Look for filter controls
      const filterControls = document.querySelectorAll('input[type="text"], input[type="date"], select, button, [class*="filter"], [class*="control"]');
      filterControls.forEach((item, index) => {
        if (index < 8) { // Limit to first 8 items
          const computed = window.getComputedStyle(item);
          results.push({
            element: `Filter Control ${index + 1}`,
            classes: item.className,
            background: computed.background,
            backgroundColor: computed.backgroundColor,
            borderColor: computed.borderColor,
            boxShadow: computed.boxShadow,
            hasBluePurple: computed.background.includes('59, 130, 246') || 
                         computed.background.includes('147, 51, 234') ||
                         computed.backgroundColor.includes('59, 130, 246') || 
                         computed.backgroundColor.includes('147, 51, 234') ||
                         computed.borderColor.includes('59, 130, 246') || 
                         computed.borderColor.includes('147, 51, 234')
          });
        }
      });
      
      // Look for specific button elements
      const buttons = document.querySelectorAll('button:not([class*="sidebar"]):not([class*="nav"])');
      buttons.forEach((item, index) => {
        if (index < 5) { // Limit to first 5 buttons
          const computed = window.getComputedStyle(item);
          results.push({
            element: `Button ${index + 1}`,
            classes: item.className,
            background: computed.background,
            backgroundColor: computed.backgroundColor,
            borderColor: computed.borderColor,
            boxShadow: computed.boxShadow,
            hasBluePurple: computed.background.includes('59, 130, 246') || 
                         computed.background.includes('147, 51, 234') ||
                         computed.backgroundColor.includes('59, 130, 246') || 
                         computed.backgroundColor.includes('147, 51, 234') ||
                         computed.borderColor.includes('59, 130, 246') || 
                         computed.borderColor.includes('147, 51, 234')
          });
        }
      });
      
      return results;
    });
    
    verificationResults.filterPills.details = filterElements;
    
    // Determine overall status
    const passedItems = filterElements.filter(item => item.hasBluePurple).length;
    const totalItems = filterElements.length;
    
    if (passedItems / totalItems >= 0.6) {
      verificationResults.filterPills.status = '✅ PASS';
    } else if (passedItems / totalItems >= 0.3) {
      verificationResults.filterPills.status = '⚠️ PARTIAL';
    } else {
      verificationResults.filterPills.status = '❌ FAIL';
    }
    
    await takeScreenshot(page, 'filter-elements', 'Filter pills and interactive elements');
    
  } catch (error) {
    verificationResults.filterPills.status = '❌ ERROR';
    verificationResults.filterPills.details.push(`Error: ${error.message}`);
  } finally {
    await browser.close();
  }
}

async function verifyChartContainers() {
  console.log('\n🔍 Verifying chart containers...');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1920, height: 1080 }
  });
  const page = await browser.newPage();
  
  try {
    await page.goto(APP_URL, { waitUntil: 'networkidle2' });
    await sleep(3000);
    
    // Check for chart containers and data visualization elements
    const chartElements = await page.evaluate(() => {
      const results = [];
      
      // Look for chart containers and cards
      const chartContainers = document.querySelectorAll('[class*="chart"], [class*="card"], [class*="container"], .glass, .card-unified');
      chartContainers.forEach((item, index) => {
        if (index < 6) { // Limit to first 6 items
          const computed = window.getComputedStyle(item);
          results.push({
            element: `Chart Container ${index + 1}`,
            classes: item.className,
            background: computed.background,
            backgroundColor: computed.backgroundColor,
            borderColor: computed.borderColor,
            borderWidth: computed.borderWidth,
            boxShadow: computed.boxShadow,
            hasBluePurpleBorder: computed.borderColor.includes('59, 130, 246') || 
                             computed.borderColor.includes('147, 51, 234'),
            hasBluePurple: computed.background.includes('59, 130, 246') || 
                         computed.background.includes('147, 51, 234') ||
                         computed.backgroundColor.includes('59, 130, 246') || 
                         computed.backgroundColor.includes('147, 51, 234')
          });
        }
      });
      
      return results;
    });
    
    verificationResults.chartContainers.details = chartElements;
    
    // Determine overall status
    const passedItems = chartElements.filter(item => item.hasBluePurpleBorder || item.hasBluePurple).length;
    const totalItems = chartElements.length;
    
    if (passedItems / totalItems >= 0.6) {
      verificationResults.chartContainers.status = '✅ PASS';
    } else if (passedItems / totalItems >= 0.3) {
      verificationResults.chartContainers.status = '⚠️ PARTIAL';
    } else {
      verificationResults.chartContainers.status = '❌ FAIL';
    }
    
    await takeScreenshot(page, 'chart-containers', 'Chart containers and data visualization');
    
  } catch (error) {
    verificationResults.chartContainers.status = '❌ ERROR';
    verificationResults.chartContainers.details.push(`Error: ${error.message}`);
  } finally {
    await browser.close();
  }
}

async function verifyScrollbarStyles() {
  console.log('\n🔍 Verifying scrollbar styles...');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1920, height: 1080 }
  });
  const page = await browser.newPage();
  
  try {
    await page.goto(APP_URL, { waitUntil: 'networkidle2' });
    await sleep(3000);
    
    // Check scrollbar styles
    const scrollbarInfo = await page.evaluate(() => {
      const body = document.body;
      const computed = window.getComputedStyle(body);
      
      return {
        element: 'Body Scrollbar',
        scrollbarWidth: computed.scrollbarWidth,
        scrollbarColor: computed.scrollbarColor,
        hasBluePurpleScrollbar: computed.scrollbarColor.includes('59, 130, 246') || 
                               computed.scrollbarColor.includes('147, 51, 234'),
        classes: body.className
      };
    });
    
    verificationResults.scrollbarStyles.details = [scrollbarInfo];
    
    // Check for custom scrollbar classes
    const scrollbarClasses = await page.evaluate(() => {
      const allElements = document.querySelectorAll('*');
      const scrollbarClasses = new Set();
      
      allElements.forEach(el => {
        el.className.split(' ').forEach(cls => {
          if (cls.includes('scrollbar')) {
            scrollbarClasses.add(cls);
          }
        });
      });
      
      return {
        element: 'Scrollbar Classes',
        foundClasses: Array.from(scrollbarClasses),
        hasBluePurpleClasses: Array.from(scrollbarClasses).some(cls => 
          cls.includes('blue') || cls.includes('purple') || cls.includes('gradient')
        )
      };
    });
    
    verificationResults.scrollbarStyles.details.push(scrollbarClasses);
    
    // Determine overall status
    const hasBluePurpleScrollbar = scrollbarInfo.hasBluePurpleScrollbar || scrollbarClasses.hasBluePurpleClasses;
    
    if (hasBluePurpleScrollbar) {
      verificationResults.scrollbarStyles.status = '✅ PASS';
    } else {
      verificationResults.scrollbarStyles.status = '❌ FAIL';
    }
    
    await takeScreenshot(page, 'scrollbar-styles', 'Scrollbar styles');
    
  } catch (error) {
    verificationResults.scrollbarStyles.status = '❌ ERROR';
    verificationResults.scrollbarStyles.details.push(`Error: ${error.message}`);
  } finally {
    await browser.close();
  }
}

async function verifyButtonFormElements() {
  console.log('\n🔍 Verifying button and form elements...');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1920, height: 1080 }
  });
  const page = await browser.newPage();
  
  try {
    await page.goto(APP_URL, { waitUntil: 'networkidle2' });
    await sleep(3000);
    
    // Check form elements and buttons
    const formElements = await page.evaluate(() => {
      const results = [];
      
      // Look for form elements
      const inputs = document.querySelectorAll('input, select, textarea, [class*="input"], [class*="form"], [class*="metallic"], [class*="dropdown"], [class*="date"]');
      inputs.forEach((item, index) => {
        if (index < 6) { // Limit to first 6 items
          const computed = window.getComputedStyle(item);
          results.push({
            element: `Form Element ${index + 1}`,
            classes: item.className,
            background: computed.background,
            backgroundColor: computed.backgroundColor,
            borderColor: computed.borderColor,
            boxShadow: computed.boxShadow,
            hasBluePurple: computed.background.includes('59, 130, 246') || 
                         computed.background.includes('147, 51, 234') ||
                         computed.backgroundColor.includes('59, 130, 246') || 
                         computed.backgroundColor.includes('147, 51, 234') ||
                         computed.borderColor.includes('59, 130, 246') || 
                         computed.borderColor.includes('147, 51, 234')
          });
        }
      });
      
      return results;
    });
    
    verificationResults.buttonFormElements.details = formElements;
    
    // Determine overall status
    const passedItems = formElements.filter(item => item.hasBluePurple).length;
    const totalItems = formElements.length;
    
    if (passedItems / totalItems >= 0.6) {
      verificationResults.buttonFormElements.status = '✅ PASS';
    } else if (passedItems / totalItems >= 0.3) {
      verificationResults.buttonFormElements.status = '⚠️ PARTIAL';
    } else {
      verificationResults.buttonFormElements.status = '❌ FAIL';
    }
    
    await takeScreenshot(page, 'button-form-elements', 'Button and form elements');
    
  } catch (error) {
    verificationResults.buttonFormElements.status = '❌ ERROR';
    verificationResults.buttonFormElements.details.push(`Error: ${error.message}`);
  } finally {
    await browser.close();
  }
}

async function verifyModalComponents() {
  console.log('\n🔍 Verifying modal components...');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1920, height: 1080 }
  });
  const page = await browser.newPage();
  
  try {
    await page.goto(APP_URL, { waitUntil: 'networkidle2' });
    await sleep(3000);
    
    // Try to trigger a modal by looking for buttons that might open modals
    await page.evaluate(() => {
      // Look for buttons that might open modals
      const modalTriggers = document.querySelectorAll('button[onclick*="modal"], button[onclick*="dialog"], button[aria-label*="edit"], button[aria-label*="add"], [class*="modal"]');
      modalTriggers.forEach((trigger, index) => {
        if (index < 3) {
          trigger.click();
        }
      });
    });
    
    await sleep(2000); // Wait for modals to potentially appear
    
    // Check for modal components
    const modalElements = await page.evaluate(() => {
      const results = [];
      
      // Look for modal elements
      const modals = document.querySelectorAll('[class*="modal"], [role="dialog"], [class*="overlay"], [class*="backdrop"]');
      modals.forEach((item, index) => {
        if (index < 3) { // Limit to first 3 modals
          const computed = window.getComputedStyle(item);
          results.push({
            element: `Modal Element ${index + 1}`,
            classes: item.className,
            background: computed.background,
            backgroundColor: computed.backgroundColor,
            borderColor: computed.borderColor,
            boxShadow: computed.boxShadow,
            hasBluePurpleBorder: computed.borderColor.includes('59, 130, 246') || 
                             computed.borderColor.includes('147, 51, 234'),
            hasBluePurple: computed.background.includes('59, 130, 246') || 
                         computed.background.includes('147, 51, 234') ||
                         computed.backgroundColor.includes('59, 130, 246') || 
                         computed.backgroundColor.includes('147, 51, 234')
          });
        }
      });
      
      return results;
    });
    
    verificationResults.modalComponents.details = modalElements;
    
    // Determine overall status
    const passedItems = modalElements.filter(item => item.hasBluePurpleBorder || item.hasBluePurple).length;
    const totalItems = modalElements.length;
    
    if (passedItems / totalItems >= 0.6) {
      verificationResults.modalComponents.status = '✅ PASS';
    } else if (passedItems / totalItems >= 0.3) {
      verificationResults.modalComponents.status = '⚠️ PARTIAL';
    } else {
      verificationResults.modalComponents.status = '❌ FAIL';
    }
    
    await takeScreenshot(page, 'modal-components', 'Modal components');
    
  } catch (error) {
    verificationResults.modalComponents.status = '❌ ERROR';
    verificationResults.modalComponents.details.push(`Error: ${error.message}`);
  } finally {
    await browser.close();
  }
}

async function verifyBalatroBackground() {
  console.log('\n🔍 Verifying Balatro component dark green gradient background...');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1920, height: 1080 }
  });
  const page = await browser.newPage();
  
  try {
    await page.goto(APP_URL, { waitUntil: 'networkidle2' });
    await sleep(3000);
    
    // Check for Balatro component
    const balatroInfo = await page.evaluate(() => {
      const results = [];
      
      // Look for Balatro component
      const balatroContainer = document.querySelector('[class*="balatro"]');
      if (balatroContainer) {
        const computed = window.getComputedStyle(balatroContainer);
        results.push({
          element: 'Balatro Container',
          classes: balatroContainer.className,
          background: computed.background,
          backgroundColor: computed.backgroundColor,
          backgroundImage: computed.backgroundImage,
          hasDarkGreen: computed.background.includes('0, 100, 0') || 
                       computed.background.includes('0, 64, 0') ||
                       computed.background.includes('13, 40, 24') ||
                       computed.background.includes('26, 77, 46') ||
                       computed.background.includes('green') ||
                       computed.backgroundColor.includes('0, 100, 0') || 
                       computed.backgroundColor.includes('0, 64, 0') ||
                       computed.backgroundColor.includes('13, 40, 24') ||
                       computed.backgroundColor.includes('26, 77, 46') ||
                       computed.backgroundColor.includes('green'),
          hasGradient: computed.background.includes('gradient') || computed.backgroundImage.includes('gradient')
        });
      }
      
      // Check canvas element
      const canvas = document.querySelector('canvas[class*="balatro"]');
      if (canvas) {
        const computed = window.getComputedStyle(canvas);
        results.push({
          element: 'Balatro Canvas',
          classes: canvas.className,
          background: computed.background,
          backgroundColor: computed.backgroundColor,
          backgroundImage: computed.backgroundImage,
          hasDarkGreen: computed.background.includes('0, 100, 0') || 
                       computed.background.includes('0, 64, 0') ||
                       computed.background.includes('13, 40, 24') ||
                       computed.background.includes('26, 77, 46') ||
                       computed.background.includes('green') ||
                       computed.backgroundColor.includes('0, 100, 0') || 
                       computed.backgroundColor.includes('0, 64, 0') ||
                       computed.backgroundColor.includes('13, 40, 24') ||
                       computed.backgroundColor.includes('26, 77, 46') ||
                       computed.backgroundColor.includes('green')
        });
      }
      
      return results;
    });
    
    verificationResults.balatroBackground.details = balatroInfo;
    
    // Determine overall status
    const hasDarkGreen = balatroInfo.some(item => item.hasDarkGreen);
    const hasGradient = balatroInfo.some(item => item.hasGradient);
    
    if (hasDarkGreen && hasGradient) {
      verificationResults.balatroBackground.status = '✅ PASS';
    } else if (hasDarkGreen || hasGradient) {
      verificationResults.balatroBackground.status = '⚠️ PARTIAL';
    } else {
      verificationResults.balatroBackground.status = '❌ FAIL';
    }
    
    await takeScreenshot(page, 'balatro-background', 'Balatro dark green gradient background');
    
  } catch (error) {
    verificationResults.balatroBackground.status = '❌ ERROR';
    verificationResults.balatroBackground.details.push(`Error: ${error.message}`);
  } finally {
    await browser.close();
  }
}

async function verifyVisualHarmony() {
  console.log('\n🔍 Verifying visual harmony and readability...');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1920, height: 1080 }
  });
  const page = await browser.newPage();
  
  try {
    await page.goto(APP_URL, { waitUntil: 'networkidle2' });
    await sleep(3000);
    
    // Check visual harmony
    const visualInfo = await page.evaluate(() => {
      const results = [];
      
      // Check text elements for contrast
      const textElements = document.querySelectorAll('h1, h2, h3, h4, h5, h6, p, span, div, button, a');
      let goodContrastCount = 0;
      let totalTextElements = 0;
      
      textElements.forEach((element, index) => {
        if (index < 10) { // Limit to first 10 text elements
          const computed = window.getComputedStyle(element);
          const color = computed.color;
          const bgColor = computed.backgroundColor;
          
          // Check if text has good contrast (white or light colors on dark background)
          const hasGoodContrast = color.includes('255, 255, 255') || 
                                color.includes('rgb(255') || 
                                color.includes('#fff') ||
                                color.includes('white') ||
                                color.includes('196, 181, 253') || // Light purple
                                color.includes('96, 165, 250') || // Light blue
                                color.includes('147, 197, 253') || // Light purple
                                color.includes('74, 222, 128') || // Light green
                                color.includes('251, 191, 36'); // Light yellow
          
          if (hasGoodContrast) goodContrastCount++;
          totalTextElements++;
          
          results.push({
            element: `Text Element ${index + 1}`,
            color: color,
            backgroundColor: bgColor,
            hasGoodContrast: hasGoodContrast
          });
        }
      });
      
      // Check overall color scheme consistency
      const bodyElement = document.body;
      const bodyComputed = window.getComputedStyle(bodyElement);
      
      results.push({
        element: 'Overall Color Scheme',
        bodyBackground: bodyComputed.background,
        bodyColor: bodyComputed.color,
        hasCohesiveTheme: bodyComputed.background.includes('59, 130, 246') || 
                           bodyComputed.background.includes('147, 51, 234') ||
                           bodyComputed.color.includes('255, 255, 255') ||
                           bodyComputed.color.includes('196, 181, 253') ||
                           bodyComputed.color.includes('96, 165, 250')
      });
      
      return {
        textElements: results,
        goodContrastRatio: totalTextElements > 0 ? goodContrastCount / totalTextElements : 0,
        totalTextElements: totalTextElements
      };
    });
    
    verificationResults.visualHarmony.details = visualInfo;
    
    // Determine overall status
    const goodContrastRatio = visualInfo.goodContrastRatio;
    const hasCohesiveTheme = visualInfo.textElements.some(item => item.element === 'Overall Color Scheme' && item.hasCohesiveTheme);
    
    if (goodContrastRatio >= 0.7 && hasCohesiveTheme) {
      verificationResults.visualHarmony.status = '✅ PASS';
    } else if (goodContrastRatio >= 0.5 || hasCohesiveTheme) {
      verificationResults.visualHarmony.status = '⚠️ PARTIAL';
    } else {
      verificationResults.visualHarmony.status = '❌ FAIL';
    }
    
    await takeScreenshot(page, 'visual-harmony', 'Visual harmony and readability');
    
  } catch (error) {
    verificationResults.visualHarmony.status = '❌ ERROR';
    verificationResults.visualHarmony.details.push(`Error: ${error.message}`);
  } finally {
    await browser.close();
  }
}

async function verifyBasicFunctionality() {
  console.log('\n🔍 Verifying basic functionality...');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1920, height: 1080 }
  });
  const page = await browser.newPage();
  
  try {
    await page.goto(APP_URL, { waitUntil: 'networkidle2' });
    await sleep(3000);
    
    // Check basic functionality
    const functionalityInfo = await page.evaluate(() => {
      const results = [];
      
      // Check for navigation links
      const navLinks = document.querySelectorAll('a[href]');
      let workingNavLinks = 0;
      navLinks.forEach((link, index) => {
        if (index < 5) {
          const href = link.getAttribute('href');
          if (href && href.startsWith('/')) {
            workingNavLinks++;
          }
        }
      });
      
      results.push({
        element: 'Navigation Links',
        totalFound: navLinks.length,
        workingLinks: workingNavLinks,
        hasWorkingNavigation: workingNavLinks > 0
      });
      
      // Check for interactive elements
      const interactiveElements = document.querySelectorAll('button, input, select, textarea');
      let workingInteractiveElements = 0;
      interactiveElements.forEach((element, index) => {
        if (index < 5) {
          const computed = window.getComputedStyle(element);
          const isVisible = computed.display !== 'none' && 
                           computed.visibility !== 'hidden' &&
                           parseFloat(computed.opacity) > 0;
          const isClickable = element.tagName.toLowerCase() === 'button' || 
                            element.tagName.toLowerCase() === 'input' || 
                            element.tagName.toLowerCase() === 'select' || 
                            element.tagName.toLowerCase() === 'textarea';
          
          if (isVisible && isClickable) workingInteractiveElements++;
        }
      });
      
      results.push({
        element: 'Interactive Elements',
        totalFound: interactiveElements.length,
        workingElements: workingInteractiveElements,
        hasWorkingInteractive: workingInteractiveElements > 0
      });
      
      // Check for console errors (basic check)
      results.push({
        element: 'Console Errors',
        hasConsoleErrors: false, // We can't easily detect this from page eval
        errorCount: 0
      });
      
      return results;
    });
    
    verificationResults.basicFunctionality.details = functionalityInfo;
    
    // Determine overall status
    const hasWorkingNavigation = functionalityInfo.some(item => item.element === 'Navigation Links' && item.hasWorkingNavigation);
    const hasWorkingInteractive = functionalityInfo.some(item => item.element === 'Interactive Elements' && item.hasWorkingInteractive);
    
    if (hasWorkingNavigation && hasWorkingInteractive) {
      verificationResults.basicFunctionality.status = '✅ PASS';
    } else if (hasWorkingNavigation || hasWorkingInteractive) {
      verificationResults.basicFunctionality.status = '⚠️ PARTIAL';
    } else {
      verificationResults.basicFunctionality.status = '❌ FAIL';
    }
    
    await takeScreenshot(page, 'basic-functionality', 'Basic functionality test');
    
  } catch (error) {
    verificationResults.basicFunctionality.status = '❌ ERROR';
    verificationResults.basicFunctionality.details.push(`Error: ${error.message}`);
  } finally {
    await browser.close();
  }
}

function generateReport() {
  console.log('\n📝 Generating targeted verification report...');
  
  const timestamp = new Date().toISOString();
  
  let report = `# Targeted UI Color Reversion Verification Report\n\n`;
  report += `**Generated:** ${timestamp}\n`;
  report += `**Application URL:** ${APP_URL}\n\n`;
  
  report += `## Executive Summary\n\n`;
  
  const allChecks = Object.values(verificationResults);
  const passedChecks = allChecks.filter(check => check.status.includes('PASS')).length;
  const partialChecks = allChecks.filter(check => check.status.includes('PARTIAL')).length;
  const failedChecks = allChecks.filter(check => check.status.includes('FAIL') || check.status.includes('ERROR')).length;
  
  report += `- **Total Checks:** ${allChecks.length}\n`;
  report += `- **Passed:** ${passedChecks}\n`;
  report += `- **Partial:** ${partialChecks}\n`;
  report += `- **Failed:** ${failedChecks}\n`;
  report += `- **Success Rate:** ${Math.round((passedChecks / allChecks.length) * 100)}%\n\n`;
  
  if (passedChecks === allChecks.length) {
    report += `🎉 **All verification checks passed!** The UI color reversion has been successfully completed.\n\n`;
  } else if (passedChecks >= allChecks.length * 0.8) {
    report += `✅ **Most verification checks passed!** The UI color reversion is largely successful with minor issues.\n\n`;
  } else {
    report += `⚠️ **Several verification checks failed.** The UI color reversion needs attention.\n\n`;
  }
  
  report += `## Detailed Results\n\n`;
  
  // Server Status
  report += `### 1. Server Status\n\n`;
  report += `**Status:** ${verificationResults.serverStatus.status}\n\n`;
  report += `**Details:** ${verificationResults.serverStatus.details}\n\n`;
  
  // Sidebar Components
  report += `### 2. Sidebar Components\n\n`;
  report += `**Status:** ${verificationResults.sidebarComponents.status}\n\n`;
  report += `**Details:**\n`;
  verificationResults.sidebarComponents.details.forEach(item => {
    report += `- **${item.element}:** ${item.hasBluePurple ? '✅' : '❌'} Has blue/purple theme\n`;
    report += `  - Classes: ${item.classes || 'N/A'}\n`;
    report += `  - Background: ${item.background || 'N/A'}\n`;
  });
  report += `\n`;
  
  // Filter Pills
  report += `### 3. Filter Pills and Interactive Elements\n\n`;
  report += `**Status:** ${verificationResults.filterPills.status}\n\n`;
  report += `**Details:**\n`;
  verificationResults.filterPills.details.forEach(item => {
    report += `- **${item.element}:** ${item.hasBluePurple ? '✅' : '❌'} Has blue/purple theme\n`;
    report += `  - Classes: ${item.classes || 'N/A'}\n`;
    report += `  - Background: ${item.background || 'N/A'}\n`;
  });
  report += `\n`;
  
  // Chart Containers
  report += `### 4. Chart Containers\n\n`;
  report += `**Status:** ${verificationResults.chartContainers.status}\n\n`;
  report += `**Details:**\n`;
  verificationResults.chartContainers.details.forEach(item => {
    report += `- **${item.element}:** ${item.hasBluePurpleBorder || item.hasBluePurple ? '✅' : '❌'} Has blue/purple borders/theme\n`;
    report += `  - Classes: ${item.classes || 'N/A'}\n`;
    report += `  - Border: ${item.borderColor || 'N/A'}\n`;
  });
  report += `\n`;
  
  // Scrollbar Styles
  report += `### 5. Scrollbar Styles\n\n`;
  report += `**Status:** ${verificationResults.scrollbarStyles.status}\n\n`;
  report += `**Details:**\n`;
  verificationResults.scrollbarStyles.details.forEach(item => {
    report += `- **${item.element}:** ${item.hasBluePurpleScrollbar || item.hasBluePurpleClasses ? '✅' : '❌'} Has blue/purple scrollbar styles\n`;
    report += `  - Classes: ${item.classes || 'N/A'}\n`;
    if (item.scrollbarColor) report += `  - Scrollbar Color: ${item.scrollbarColor || 'N/A'}\n`;
    if (item.foundClasses) report += `  - Found Classes: ${item.foundClasses.join(', ') || 'N/A'}\n`;
  });
  report += `\n`;
  
  // Button and Form Elements
  report += `### 6. Button and Form Elements\n\n`;
  report += `**Status:** ${verificationResults.buttonFormElements.status}\n\n`;
  report += `**Details:**\n`;
  verificationResults.buttonFormElements.details.forEach(item => {
    report += `- **${item.element}:** ${item.hasBluePurple ? '✅' : '❌'} Has blue/purple color scheme\n`;
    report += `  - Classes: ${item.classes || 'N/A'}\n`;
    report += `  - Background: ${item.background || 'N/A'}\n`;
  });
  report += `\n`;
  
  // Modal Components
  report += `### 7. Modal Components\n\n`;
  report += `**Status:** ${verificationResults.modalComponents.status}\n\n`;
  report += `**Details:**\n`;
  verificationResults.modalComponents.details.forEach(item => {
    report += `- **${item.element}:** ${item.hasBluePurpleBorder || item.hasBluePurple ? '✅' : '❌'} Has blue/purple borders/effects\n`;
    report += `  - Classes: ${item.classes || 'N/A'}\n`;
    report += `  - Background: ${item.background || 'N/A'}\n`;
  });
  report += `\n`;
  
  // Balatro Background
  report += `### 8. Balatro Dark Green Background\n\n`;
  report += `**Status:** ${verificationResults.balatroBackground.status}\n\n`;
  report += `**Details:**\n`;
  verificationResults.balatroBackground.details.forEach(item => {
    report += `- **${item.element}:** ${item.hasDarkGreen ? '✅' : '❌'} Has dark green background`;
    if (item.hasGradient) report += ` (with gradient)`;
    report += `\n`;
    report += `  - Classes: ${item.classes || 'N/A'}\n`;
    report += `  - Background: ${item.background || 'N/A'}\n`;
  });
  report += `\n`;
  
  // Visual Harmony
  report += `### 9. Visual Harmony and Readability\n\n`;
  report += `**Status:** ${verificationResults.visualHarmony.status}\n\n`;
  report += `**Details:**\n`;
  if (verificationResults.visualHarmony.details.textElements) {
    const textInfo = verificationResults.visualHarmony.details.textElements;
    report += `- **Text Contrast:** ${textInfo.goodContrastRatio >= 0.7 ? '✅' : '❌'} Good contrast (${Math.round(textInfo.goodContrastRatio * 100)}% of elements)\n`;
    report += `- **Color Scheme:** ${textInfo.some(item => item.element === 'Overall Color Scheme' && item.hasCohesiveTheme) ? '✅' : '❌'} Cohesive blue/purple theme\n`;
  }
  report += `\n`;
  
  // Basic Functionality
  report += `### 10. Basic Functionality\n\n`;
  report += `**Status:** ${verificationResults.basicFunctionality.status}\n\n`;
  report += `**Details:**\n`;
  verificationResults.basicFunctionality.details.forEach(item => {
    report += `- **${item.element}:** ${item.hasWorkingNavigation || item.hasWorkingInteractive ? '✅' : '❌'} Working\n`;
    if (item.totalFound !== undefined) report += `  - Found: ${item.totalFound} elements\n`;
    if (item.workingLinks !== undefined) report += `  - Working: ${item.workingLinks} links\n`;
    if (item.workingElements !== undefined) report += `  - Working: ${item.workingElements} elements\n`;
  });
  report += `\n`;
  
  // Screenshots
  report += `## Screenshots\n\n`;
  report += `All verification screenshots have been saved to the \`${SCREENSHOT_DIR}\` directory:\n\n`;
  
  const screenshotFiles = fs.readdirSync(SCREENSHOT_DIR).filter(file => file.endsWith('.png'));
  screenshotFiles.forEach(file => {
    report += `- ${file}\n`;
  });
  report += `\n`;
  
  // Recommendations
  report += `## Recommendations\n\n`;
  
  if (failedChecks > 0) {
    report += `### Priority Issues to Fix\n\n`;
    
    if (verificationResults.sidebarComponents.status.includes('FAIL')) {
      report += `- **Sidebar Components:** Ensure navigation and sidebar elements use blue/purple theme\n`;
    }
    
    if (verificationResults.filterPills.status.includes('FAIL')) {
      report += `- **Filter Pills:** Ensure filter pills and interactive elements have blue/purple gradients\n`;
    }
    
    if (verificationResults.chartContainers.status.includes('FAIL')) {
      report += `- **Chart Containers:** Ensure chart containers have blue/purple borders\n`;
    }
    
    if (verificationResults.scrollbarStyles.status.includes('FAIL')) {
      report += `- **Scrollbar Styles:** Ensure scrollbar styles use blue/purple gradients\n`;
    }
    
    if (verificationResults.buttonFormElements.status.includes('FAIL')) {
      report += `- **Button/Form Elements:** Ensure buttons and form elements have blue/purple color schemes\n`;
    }
    
    if (verificationResults.modalComponents.status.includes('FAIL')) {
      report += `- **Modal Components:** Ensure modal components have blue/purple borders and effects\n`;
    }
    
    if (verificationResults.balatroBackground.status.includes('FAIL')) {
      report += `- **Balatro Background:** Ensure Balatro component has dark green gradient background\n`;
    }
    
    if (verificationResults.visualHarmony.status.includes('FAIL')) {
      report += `- **Visual Harmony:** Improve text contrast and UI element visibility\n`;
    }
    
    if (verificationResults.basicFunctionality.status.includes('FAIL')) {
      report += `- **Basic Functionality:** Fix console errors and improve interactive functionality\n`;
    }
  }
  
  if (partialChecks > 0) {
    report += `### Minor Improvements\n\n`;
    report += `- Consider enhancing the partially implemented features for better consistency\n`;
    report += `- Review the elements that only partially meet the blue/purple theme requirements\n`;
  }
  
  if (passedChecks === allChecks.length) {
    report += `### Excellent Work!\n\n`;
    report += `- The UI color reversion has been successfully completed\n`;
    report += `- All components are properly themed with blue/purple colors\n`;
    report += `- The Balatro dark green background is preserved\n`;
    report += `- Visual harmony and readability are excellent\n`;
    report += `- Basic functionality is working correctly\n`;
  }
  
  report += `\n---\n\n`;
  report += `**Report generated by Targeted UI Color Reversion Verification Script**\n`;
  report += `**Timestamp:** ${timestamp}\n`;
  
  // Write report to file
  fs.writeFileSync(REPORT_FILE, report);
  
  console.log(`\n📊 Verification complete! Report saved to: ${REPORT_FILE}`);
  console.log(`📸 Screenshots saved to: ${SCREENSHOT_DIR}`);
  
  return report;
}

async function runVerification() {
  console.log('🚀 Starting Targeted UI Color Reversion Verification...\n');
  
  try {
    // Run all verification checks
    const serverOk = await verifyServerStatus();
    
    if (!serverOk) {
      console.log('❌ Server verification failed. Cannot continue with other checks.');
      return;
    }
    
    await verifySidebarComponents();
    await verifyFilterPills();
    await verifyChartContainers();
    await verifyScrollbarStyles();
    await verifyButtonFormElements();
    await verifyModalComponents();
    await verifyBalatroBackground();
    await verifyVisualHarmony();
    await verifyBasicFunctionality();
    
    // Generate and display report
    const report = generateReport();
    console.log('\n' + '='.repeat(80));
    console.log('TARGETED VERIFICATION SUMMARY');
    console.log('='.repeat(80));
    
    Object.entries(verificationResults).forEach(([key, result]) => {
      const formattedKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, '');
      console.log(`${formattedKey}: ${result.status}`);
    });
    
  } catch (error) {
    console.error('❌ Verification failed with error:', error);
  }
}

// Run the verification
runVerification();