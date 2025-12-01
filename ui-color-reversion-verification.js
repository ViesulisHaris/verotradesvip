const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Configuration
const APP_URL = 'http://localhost:3000';
const SCREENSHOT_DIR = './ui-verification-screenshots';
const REPORT_FILE = './UI_COLOR_REVERSION_VERIFICATION_REPORT.md';

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
    await sleep(3000); // Wait for full load
    
    // Check sidebar toggle button
    const toggleButton = await page.$('.sidebar-toggle-button, [data-testid="sidebar-toggle"], button[aria-label*="menu"], button[aria-label*="sidebar"]');
    if (toggleButton) {
      const styles = await page.evaluate((el) => {
        const computed = window.getComputedStyle(el);
        return {
          background: computed.background,
          backgroundColor: computed.backgroundColor,
          borderColor: computed.borderColor,
          boxShadow: computed.boxShadow
        };
      }, toggleButton);
      
      verificationResults.sidebarComponents.details.push({
        element: 'Toggle Button',
        hasBluePurple: styles.background.includes('59, 130, 246') || styles.background.includes('147, 51, 234') || 
                     styles.backgroundColor.includes('59, 130, 246') || styles.backgroundColor.includes('147, 51, 234') ||
                     styles.borderColor.includes('59, 130, 246') || styles.borderColor.includes('147, 51, 234'),
        styles: styles
      });
      
      await takeScreenshot(page, 'sidebar-toggle', 'Sidebar toggle button');
    }
    
    // Check menu items
    const menuItems = await page.$$('.sidebar-menu-item, .nav-item, nav a, nav button');
    if (menuItems.length > 0) {
      for (let i = 0; i < Math.min(3, menuItems.length); i++) {
        const item = menuItems[i];
        const styles = await page.evaluate((el) => {
          const computed = window.getComputedStyle(el);
          return {
            background: computed.background,
            backgroundColor: computed.backgroundColor,
            borderColor: computed.borderColor,
            color: computed.color
          };
        }, item);
        
        verificationResults.sidebarComponents.details.push({
          element: `Menu Item ${i + 1}`,
          hasBluePurple: styles.background.includes('59, 130, 246') || styles.background.includes('147, 51, 234') || 
                         styles.backgroundColor.includes('59, 130, 246') || styles.backgroundColor.includes('147, 51, 234') ||
                         styles.borderColor.includes('59, 130, 246') || styles.borderColor.includes('147, 51, 234'),
          styles: styles
        });
      }
      
      await takeScreenshot(page, 'sidebar-menu', 'Sidebar menu items');
    }
    
    // Check sidebar overlay/background
    const sidebarOverlay = await page.$('.sidebar-overlay, .sidebar, aside');
    if (sidebarOverlay) {
      const styles = await page.evaluate((el) => {
        const computed = window.getComputedStyle(el);
        return {
          background: computed.background,
          backgroundColor: computed.backgroundColor,
          borderColor: computed.borderColor,
          boxShadow: computed.boxShadow
        };
      }, sidebarOverlay);
      
      verificationResults.sidebarComponents.details.push({
        element: 'Sidebar Overlay',
        hasBluePurple: styles.background.includes('59, 130, 246') || styles.background.includes('147, 51, 234') || 
                       styles.backgroundColor.includes('59, 130, 246') || styles.backgroundColor.includes('147, 51, 234') ||
                       styles.borderColor.includes('59, 130, 246') || styles.borderColor.includes('147, 51, 234'),
        styles: styles
      });
      
      await takeScreenshot(page, 'sidebar-overlay', 'Sidebar overlay/background');
    }
    
    // Determine overall status
    const passedItems = verificationResults.sidebarComponents.details.filter(item => item.hasBluePurple).length;
    const totalItems = verificationResults.sidebarComponents.details.length;
    
    if (passedItems / totalItems >= 0.8) {
      verificationResults.sidebarComponents.status = '✅ PASS';
    } else if (passedItems / totalItems >= 0.5) {
      verificationResults.sidebarComponents.status = '⚠️ PARTIAL';
    } else {
      verificationResults.sidebarComponents.status = '❌ FAIL';
    }
    
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
    
    // Look for filter pills
    const filterPills = await page.$$('.filter-pill, [data-testid*="filter"], button[class*="filter"], button[class*="pill"]');
    
    if (filterPills.length > 0) {
      for (let i = 0; i < Math.min(5, filterPills.length); i++) {
        const pill = filterPills[i];
        const styles = await page.evaluate((el) => {
          const computed = window.getComputedStyle(el);
          return {
            background: computed.background,
            backgroundColor: computed.backgroundColor,
            borderColor: computed.borderColor,
            boxShadow: computed.boxShadow
          };
        }, pill);
        
        verificationResults.filterPills.details.push({
          element: `Filter Pill ${i + 1}`,
          hasBluePurpleGradient: styles.background.includes('59, 130, 246') && styles.background.includes('147, 51, 234'),
          hasBluePurple: styles.background.includes('59, 130, 246') || styles.background.includes('147, 51, 234') || 
                        styles.backgroundColor.includes('59, 130, 246') || styles.backgroundColor.includes('147, 51, 234') ||
                        styles.borderColor.includes('59, 130, 246') || styles.borderColor.includes('147, 51, 234'),
          styles: styles
        });
      }
      
      await takeScreenshot(page, 'filter-pills', 'Filter pills and interactive elements');
    } else {
      verificationResults.filterPills.details.push({
        element: 'Filter Pills',
        hasBluePurple: false,
        note: 'No filter pills found on the page'
      });
    }
    
    // Look for other interactive elements
    const interactiveElements = await page.$$('button:not(.sidebar-toggle-button):not(.sidebar-menu-item), [role="button"], .interactive');
    
    if (interactiveElements.length > 0) {
      for (let i = 0; i < Math.min(3, interactiveElements.length); i++) {
        const element = interactiveElements[i];
        const styles = await page.evaluate((el) => {
          const computed = window.getComputedStyle(el);
          return {
            background: computed.background,
            backgroundColor: computed.backgroundColor,
            borderColor: computed.borderColor,
            boxShadow: computed.boxShadow
          };
        }, element);
        
        verificationResults.filterPills.details.push({
          element: `Interactive Element ${i + 1}`,
          hasBluePurple: styles.background.includes('59, 130, 246') || styles.background.includes('147, 51, 234') || 
                        styles.backgroundColor.includes('59, 130, 246') || styles.backgroundColor.includes('147, 51, 234') ||
                        styles.borderColor.includes('59, 130, 246') || styles.borderColor.includes('147, 51, 234'),
          styles: styles
        });
      }
    }
    
    // Determine overall status
    const passedItems = verificationResults.filterPills.details.filter(item => item.hasBluePurple).length;
    const totalItems = verificationResults.filterPills.details.length;
    
    if (passedItems / totalItems >= 0.8) {
      verificationResults.filterPills.status = '✅ PASS';
    } else if (passedItems / totalItems >= 0.5) {
      verificationResults.filterPills.status = '⚠️ PARTIAL';
    } else {
      verificationResults.filterPills.status = '❌ FAIL';
    }
    
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
    
    // Look for chart containers
    const chartContainers = await page.$$('.chart-container, .chart-wrapper, .chart-enhanced, [class*="chart"]');
    
    if (chartContainers.length > 0) {
      for (let i = 0; i < Math.min(3, chartContainers.length); i++) {
        const container = chartContainers[i];
        const styles = await page.evaluate((el) => {
          const computed = window.getComputedStyle(el);
          return {
            background: computed.background,
            backgroundColor: computed.backgroundColor,
            borderColor: computed.borderColor,
            borderWidth: computed.borderWidth,
            boxShadow: computed.boxShadow
          };
        }, container);
        
        verificationResults.chartContainers.details.push({
          element: `Chart Container ${i + 1}`,
          hasBluePurpleBorder: styles.borderColor.includes('59, 130, 246') || styles.borderColor.includes('147, 51, 234'),
          hasBluePurple: styles.background.includes('59, 130, 246') || styles.background.includes('147, 51, 234') || 
                         styles.backgroundColor.includes('59, 130, 246') || styles.backgroundColor.includes('147, 51, 234'),
          hasBorder: parseFloat(styles.borderWidth) > 0,
          styles: styles
        });
      }
      
      await takeScreenshot(page, 'chart-containers', 'Chart containers');
    } else {
      verificationResults.chartContainers.details.push({
        element: 'Chart Containers',
        hasBluePurple: false,
        note: 'No chart containers found on the page'
      });
    }
    
    // Determine overall status
    const passedItems = verificationResults.chartContainers.details.filter(item => item.hasBluePurpleBorder || item.hasBluePurple).length;
    const totalItems = verificationResults.chartContainers.details.length;
    
    if (passedItems / totalItems >= 0.8) {
      verificationResults.chartContainers.status = '✅ PASS';
    } else if (passedItems / totalItems >= 0.5) {
      verificationResults.chartContainers.status = '⚠️ PARTIAL';
    } else {
      verificationResults.chartContainers.status = '❌ FAIL';
    }
    
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
    
    // Check if custom scrollbar styles are applied
    const scrollbarStyles = await page.evaluate(() => {
      const testElement = document.createElement('div');
      testElement.style.overflow = 'scroll';
      testElement.style.width = '100px';
      testElement.style.height = '100px';
      document.body.appendChild(testElement);
      
      const computed = window.getComputedStyle(testElement);
      const scrollbarWidth = computed.scrollbarWidth;
      const hasCustomStyles = computed.getPropertyValue('--scrollbar-width') || 
                             testElement.className.includes('scrollbar-');
      
      document.body.removeChild(testElement);
      
      return {
        scrollbarWidth,
        hasCustomStyles,
        bodyStyles: {
          scrollbarWidth: window.getComputedStyle(document.body).scrollbarWidth,
          scrollbarColor: window.getComputedStyle(document.body).scrollbarColor
        }
      };
    });
    
    verificationResults.scrollbarStyles.details.push({
      element: 'Scrollbar Styles',
      hasCustomStyles: scrollbarStyles.hasCustomStyles || scrollbarStyles.bodyStyles.scrollbarWidth === 'thin',
      scrollbarColor: scrollbarStyles.bodyStyles.scrollbarColor,
      hasBluePurple: scrollbarStyles.bodyStyles.scrollbarColor.includes('59, 130, 246') || 
                    scrollbarStyles.bodyStyles.scrollbarColor.includes('147, 51, 234'),
      styles: scrollbarStyles
    });
    
    await takeScreenshot(page, 'scrollbar-styles', 'Scrollbar styles demonstration');
    
    // Check for scrollbar classes in the page
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
      
      return Array.from(scrollbarClasses);
    });
    
    verificationResults.scrollbarStyles.details.push({
      element: 'Scrollbar Classes',
      foundClasses: scrollbarClasses,
      hasBluePurpleClasses: scrollbarClasses.some(cls => 
        cls.includes('blue') || cls.includes('purple') || cls.includes('gradient')
      )
    });
    
    // Determine overall status
    const hasBluePurpleScrollbar = verificationResults.scrollbarStyles.details.some(item => item.hasBluePurple);
    const hasCustomScrollbar = verificationResults.scrollbarStyles.details.some(item => item.hasCustomStyles || item.hasBluePurpleClasses);
    
    if (hasBluePurpleScrollbar && hasCustomScrollbar) {
      verificationResults.scrollbarStyles.status = '✅ PASS';
    } else if (hasCustomScrollbar) {
      verificationResults.scrollbarStyles.status = '⚠️ PARTIAL';
    } else {
      verificationResults.scrollbarStyles.status = '❌ FAIL';
    }
    
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
    
    // Check buttons
    const buttons = await page.$$('button:not(.sidebar-toggle-button):not(.sidebar-menu-item), .btn-primary, .btn-secondary');
    
    if (buttons.length > 0) {
      for (let i = 0; i < Math.min(5, buttons.length); i++) {
        const button = buttons[i];
        const styles = await page.evaluate((el) => {
          const computed = window.getComputedStyle(el);
          return {
            background: computed.background,
            backgroundColor: computed.backgroundColor,
            borderColor: computed.borderColor,
            boxShadow: computed.boxShadow,
            color: computed.color
          };
        }, button);
        
        verificationResults.buttonFormElements.details.push({
          element: `Button ${i + 1}`,
          hasBluePurple: styles.background.includes('59, 130, 246') || styles.background.includes('147, 51, 234') || 
                        styles.backgroundColor.includes('59, 130, 246') || styles.backgroundColor.includes('147, 51, 234') ||
                        styles.borderColor.includes('59, 130, 246') || styles.borderColor.includes('147, 51, 234'),
          styles: styles
        });
      }
    }
    
    // Check form elements
    const formElements = await page.$$('input, select, textarea, .metallic-input, .dropdown-enhanced, .date-enhanced');
    
    if (formElements.length > 0) {
      for (let i = 0; i < Math.min(3, formElements.length); i++) {
        const element = formElements[i];
        const styles = await page.evaluate((el) => {
          const computed = window.getComputedStyle(el);
          return {
            background: computed.background,
            backgroundColor: computed.backgroundColor,
            borderColor: computed.borderColor,
            boxShadow: computed.boxShadow,
            color: computed.color
          };
        }, element);
        
        verificationResults.buttonFormElements.details.push({
          element: `Form Element ${i + 1}`,
          hasBluePurple: styles.background.includes('59, 130, 246') || styles.background.includes('147, 51, 234') || 
                        styles.backgroundColor.includes('59, 130, 246') || styles.backgroundColor.includes('147, 51, 234') ||
                        styles.borderColor.includes('59, 130, 246') || styles.borderColor.includes('147, 51, 234'),
          styles: styles
        });
      }
    }
    
    await takeScreenshot(page, 'button-form-elements', 'Button and form elements');
    
    // Determine overall status
    const passedItems = verificationResults.buttonFormElements.details.filter(item => item.hasBluePurple).length;
    const totalItems = verificationResults.buttonFormElements.details.length;
    
    if (passedItems / totalItems >= 0.8) {
      verificationResults.buttonFormElements.status = '✅ PASS';
    } else if (passedItems / totalItems >= 0.5) {
      verificationResults.buttonFormElements.status = '⚠️ PARTIAL';
    } else {
      verificationResults.buttonFormElements.status = '❌ FAIL';
    }
    
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
    
    // Try to trigger a modal (look for buttons that might open modals)
    const modalTriggers = await page.$$('button[aria-label*="add"], button[aria-label*="new"], button[aria-label*="create"], .modal-trigger, [data-testid*="modal"]');
    
    if (modalTriggers.length > 0) {
      // Try to click the first trigger
      try {
        await modalTriggers[0].click();
        await sleep(2000); // Wait for modal to appear
        
        // Check for modal
        const modal = await page.$('.modal, .modal-overlay, [role="dialog"], [data-testid*="modal"]');
        
        if (modal) {
          const styles = await page.evaluate((el) => {
            const computed = window.getComputedStyle(el);
            return {
              background: computed.background,
              backgroundColor: computed.backgroundColor,
              borderColor: computed.borderColor,
              borderWidth: computed.borderWidth,
              boxShadow: computed.boxShadow
            };
          }, modal);
          
          verificationResults.modalComponents.details.push({
            element: 'Modal Container',
            hasBluePurpleBorder: styles.borderColor.includes('59, 130, 246') || styles.borderColor.includes('147, 51, 234'),
            hasBluePurple: styles.background.includes('59, 130, 246') || styles.background.includes('147, 51, 234') || 
                           styles.backgroundColor.includes('59, 130, 246') || styles.backgroundColor.includes('147, 51, 234'),
            hasBorder: parseFloat(styles.borderWidth) > 0,
            styles: styles
          });
          
          await takeScreenshot(page, 'modal-open', 'Modal component opened');
        }
      } catch (clickError) {
        console.log('Could not trigger modal:', clickError.message);
      }
    }
    
    // Check modal backdrop styles
    const modalBackdrop = await page.$('.modal-backdrop, .modal-overlay, [class*="backdrop"]');
    
    if (modalBackdrop) {
      const styles = await page.evaluate((el) => {
        const computed = window.getComputedStyle(el);
        return {
          background: computed.background,
          backgroundColor: computed.backgroundColor,
          borderColor: computed.borderColor,
          boxShadow: computed.boxShadow
        };
      }, modalBackdrop);
      
      verificationResults.modalComponents.details.push({
        element: 'Modal Backdrop',
        hasBluePurple: styles.background.includes('59, 130, 246') || styles.background.includes('147, 51, 234') || 
                       styles.backgroundColor.includes('59, 130, 246') || styles.backgroundColor.includes('147, 51, 234') ||
                       styles.borderColor.includes('59, 130, 246') || styles.borderColor.includes('147, 51, 234'),
        styles: styles
      });
    }
    
    // Check for modal CSS classes in the page
    const modalClasses = await page.evaluate(() => {
      const allElements = document.querySelectorAll('*');
      const modalClasses = new Set();
      
      allElements.forEach(el => {
        el.className.split(' ').forEach(cls => {
          if (cls.includes('modal')) {
            modalClasses.add(cls);
          }
        });
      });
      
      return Array.from(modalClasses);
    });
    
    verificationResults.modalComponents.details.push({
      element: 'Modal Classes',
      foundClasses: modalClasses,
      hasModalStyles: modalClasses.length > 0
    });
    
    // Determine overall status
    const hasBluePurpleModal = verificationResults.modalComponents.details.some(item => item.hasBluePurple || item.hasBluePurpleBorder);
    const hasModalComponents = verificationResults.modalComponents.details.some(item => item.hasModalStyles || item.hasBorder);
    
    if (hasBluePurpleModal && hasModalComponents) {
      verificationResults.modalComponents.status = '✅ PASS';
    } else if (hasModalComponents) {
      verificationResults.modalComponents.status = '⚠️ PARTIAL';
    } else {
      verificationResults.modalComponents.status = '❌ FAIL';
    }
    
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
    
    // Check for Balatro component or dark green background
    const balatroElement = await page.$('[class*="balatro"], [id*="balatro"], [data-testid*="balatro"]');
    
    if (balatroElement) {
      const styles = await page.evaluate((el) => {
        const computed = window.getComputedStyle(el);
        return {
          background: computed.background,
          backgroundColor: computed.backgroundColor,
          backgroundImage: computed.backgroundImage,
          backgroundSize: computed.backgroundSize,
          backgroundPosition: computed.backgroundPosition
        };
      }, balatroElement);
      
      verificationResults.balatroBackground.details.push({
        element: 'Balatro Component',
        hasDarkGreen: styles.background.includes('0, 100, 0') || styles.background.includes('0, 128, 0') || 
                      styles.background.includes('0, 64, 0') || styles.background.includes('green') ||
                      styles.backgroundColor.includes('0, 100, 0') || styles.backgroundColor.includes('0, 128, 0') ||
                      styles.backgroundColor.includes('0, 64, 0') || styles.backgroundColor.includes('green'),
        hasGradient: styles.background.includes('gradient') || styles.backgroundImage.includes('gradient'),
        styles: styles
      });
    } else {
      // Check body background for dark green
      const bodyStyles = await page.evaluate(() => {
        const computed = window.getComputedStyle(document.body);
        return {
          background: computed.background,
          backgroundColor: computed.backgroundColor,
          backgroundImage: computed.backgroundImage,
          backgroundSize: computed.backgroundSize,
          backgroundPosition: computed.backgroundPosition
        };
      });
      
      verificationResults.balatroBackground.details.push({
        element: 'Body Background',
        hasDarkGreen: bodyStyles.background.includes('0, 100, 0') || bodyStyles.background.includes('0, 128, 0') || 
                      bodyStyles.background.includes('0, 64, 0') || bodyStyles.background.includes('green') ||
                      bodyStyles.backgroundColor.includes('0, 100, 0') || bodyStyles.backgroundColor.includes('0, 128, 0') ||
                      bodyStyles.backgroundColor.includes('0, 64, 0') || bodyStyles.backgroundColor.includes('green'),
        hasGradient: bodyStyles.background.includes('gradient') || bodyStyles.backgroundImage.includes('gradient'),
        styles: bodyStyles
      });
    }
    
    // Check for dark green CSS variables or classes
    const darkGreenClasses = await page.evaluate(() => {
      const allElements = document.querySelectorAll('*');
      const greenClasses = new Set();
      
      allElements.forEach(el => {
        el.className.split(' ').forEach(cls => {
          if (cls.includes('green') || cls.includes('balatro')) {
            greenClasses.add(cls);
          }
        });
      });
      
      return Array.from(greenClasses);
    });
    
    verificationResults.balatroBackground.details.push({
      element: 'Dark Green Classes',
      foundClasses: darkGreenClasses,
      hasGreenClasses: darkGreenClasses.length > 0
    });
    
    await takeScreenshot(page, 'balatro-background', 'Balatro dark green background');
    
    // Determine overall status
    const hasDarkGreen = verificationResults.balatroBackground.details.some(item => item.hasDarkGreen);
    const hasGradient = verificationResults.balatroBackground.details.some(item => item.hasGradient);
    
    if (hasDarkGreen && hasGradient) {
      verificationResults.balatroBackground.status = '✅ PASS';
    } else if (hasDarkGreen || hasGradient) {
      verificationResults.balatroBackground.status = '⚠️ PARTIAL';
    } else {
      verificationResults.balatroBackground.status = '❌ FAIL';
    }
    
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
    
    // Check text contrast
    const textElements = await page.evaluate(() => {
      const textElements = document.querySelectorAll('h1, h2, h3, h4, h5, h6, p, span, div, button, a');
      const results = [];
      
      textElements.forEach((el, index) => {
        if (index < 10) { // Check first 10 text elements
          const computed = window.getComputedStyle(el);
          const text = el.textContent.trim();
          
          if (text.length > 0) {
            results.push({
              element: el.tagName.toLowerCase(),
              text: text.substring(0, 50),
              color: computed.color,
              backgroundColor: computed.backgroundColor,
              fontSize: computed.fontSize,
              fontWeight: computed.fontWeight,
              hasTextShadow: computed.textShadow !== 'none',
              hasGoodContrast: computed.color.includes('255, 255, 255') || 
                              computed.color.includes('rgb(255') ||
                              computed.color.includes('#fff') ||
                              computed.color.includes('#ffffff')
            });
          }
        }
      });
      
      return results;
    });
    
    verificationResults.visualHarmony.details.push({
      element: 'Text Contrast',
      textElements: textElements,
      hasGoodContrast: textElements.filter(el => el.hasGoodContrast).length / textElements.length >= 0.8
    });
    
    // Check UI element visibility
    const uiElements = await page.evaluate(() => {
      const elements = document.querySelectorAll('button, input, select, textarea, a');
      const results = [];
      
      elements.forEach((el, index) => {
        if (index < 10) { // Check first 10 interactive elements
          const computed = window.getComputedStyle(el);
          const rect = el.getBoundingClientRect();
          
          results.push({
            element: el.tagName.toLowerCase(),
            isVisible: rect.width > 0 && rect.height > 0 && computed.visibility !== 'hidden',
            hasGoodContrast: computed.color.includes('255, 255, 255') || 
                            computed.color.includes('rgb(255') ||
                            computed.color.includes('#fff') ||
                            computed.color.includes('#ffffff'),
            hasBorder: parseFloat(computed.borderWidth) > 0,
            hasShadow: computed.boxShadow !== 'none'
          });
        }
      });
      
      return results;
    });
    
    verificationResults.visualHarmony.details.push({
      element: 'UI Element Visibility',
      uiElements: uiElements,
      hasVisibleElements: uiElements.filter(el => el.isVisible).length / uiElements.length >= 0.8,
      hasGoodContrast: uiElements.filter(el => el.hasGoodContrast).length / uiElements.length >= 0.8
    });
    
    // Check overall color scheme consistency
    const colorScheme = await page.evaluate(() => {
      const computed = window.getComputedStyle(document.body);
      const allElements = document.querySelectorAll('*');
      const colors = new Set();
      const borderColors = new Set();
      
      allElements.forEach(el => {
        const style = window.getComputedStyle(el);
        if (style.backgroundColor && style.backgroundColor !== 'rgba(0, 0, 0, 0)' && style.backgroundColor !== 'transparent') {
          colors.add(style.backgroundColor);
        }
        if (style.borderColor && style.borderColor !== 'rgba(0, 0, 0, 0)' && style.borderColor !== 'transparent') {
          borderColors.add(style.borderColor);
        }
      });
      
      return {
        bodyBackground: computed.background,
        bodyColor: computed.color,
        uniqueColors: Array.from(colors).slice(0, 10), // First 10 unique colors
        uniqueBorderColors: Array.from(borderColors).slice(0, 10), // First 10 unique border colors
        hasBluePurpleTheme: Array.from(colors).some(color => 
          color.includes('59, 130, 246') || color.includes('147, 51, 234')
        ) || Array.from(borderColors).some(color => 
          color.includes('59, 130, 246') || color.includes('147, 51, 234')
        )
      };
    });
    
    verificationResults.visualHarmony.details.push({
      element: 'Color Scheme',
      colorScheme: colorScheme,
      hasCohesiveTheme: colorScheme.hasBluePurpleTheme
    });
    
    await takeScreenshot(page, 'visual-harmony', 'Visual harmony and readability');
    
    // Determine overall status
    const hasGoodTextContrast = verificationResults.visualHarmony.details.find(item => item.element === 'Text Contrast')?.hasGoodContrast;
    const hasGoodUIVisibility = verificationResults.visualHarmony.details.find(item => item.element === 'UI Element Visibility')?.hasVisibleElements;
    const hasCohesiveTheme = verificationResults.visualHarmony.details.find(item => item.element === 'Color Scheme')?.hasCohesiveTheme;
    
    if (hasGoodTextContrast && hasGoodUIVisibility && hasCohesiveTheme) {
      verificationResults.visualHarmony.status = '✅ PASS';
    } else if (hasGoodTextContrast || hasGoodUIVisibility || hasCohesiveTheme) {
      verificationResults.visualHarmony.status = '⚠️ PARTIAL';
    } else {
      verificationResults.visualHarmony.status = '❌ FAIL';
    }
    
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
    
    // Check for console errors
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    // Test navigation
    const navigationLinks = await page.$$('a[href], nav a, .nav-link');
    let navigationWorking = false;
    
    if (navigationLinks.length > 0) {
      try {
        const firstLink = navigationLinks[0];
        const href = await page.evaluate(el => el.getAttribute('href'), firstLink);
        
        if (href && href.startsWith('/')) {
          await firstLink.click();
          await sleep(2000);
          navigationWorking = true;
        }
      } catch (navError) {
        console.log('Navigation test failed:', navError.message);
      }
    }
    
    verificationResults.basicFunctionality.details.push({
      element: 'Navigation',
      hasNavigationLinks: navigationLinks.length > 0,
      navigationWorking: navigationWorking
    });
    
    // Test form interactions
    const formElements = await page.$$('input, select, textarea, button');
    let formsWorking = false;
    
    if (formElements.length > 0) {
      try {
        const firstFormElement = formElements[0];
        const tagName = await page.evaluate(el => el.tagName.toLowerCase(), firstFormElement);
        
        if (tagName === 'input') {
          await firstFormElement.type('test');
          formsWorking = true;
        } else if (tagName === 'button') {
          await firstFormElement.click();
          formsWorking = true;
        }
      } catch (formError) {
        console.log('Form interaction test failed:', formError.message);
      }
    }
    
    verificationResults.basicFunctionality.details.push({
      element: 'Form Interactions',
      hasFormElements: formElements.length > 0,
      formsWorking: formsWorking
    });
    
    // Test interactive elements
    const interactiveElements = await page.$$('button, [role="button"], .interactive');
    let interactiveWorking = false;
    
    if (interactiveElements.length > 0) {
      try {
        const firstInteractive = interactiveElements[0];
        await firstInteractive.click();
        await sleep(1000);
        interactiveWorking = true;
      } catch (interactiveError) {
        console.log('Interactive element test failed:', interactiveError.message);
      }
    }
    
    verificationResults.basicFunctionality.details.push({
      element: 'Interactive Elements',
      hasInteractiveElements: interactiveElements.length > 0,
      interactiveWorking: interactiveWorking
    });
    
    // Check for console errors after interactions
    await sleep(2000);
    
    verificationResults.basicFunctionality.details.push({
      element: 'Console Errors',
      hasErrors: consoleErrors.length > 0,
      errorCount: consoleErrors.length,
      errors: consoleErrors.slice(0, 5) // First 5 errors
    });
    
    await takeScreenshot(page, 'basic-functionality', 'Basic functionality test');
    
    // Determine overall status
    const hasNavigation = verificationResults.basicFunctionality.details.find(item => item.element === 'Navigation')?.navigationWorking;
    const hasForms = verificationResults.basicFunctionality.details.find(item => item.element === 'Form Interactions')?.formsWorking;
    const hasInteractive = verificationResults.basicFunctionality.details.find(item => item.element === 'Interactive Elements')?.interactiveWorking;
    const hasNoErrors = verificationResults.basicFunctionality.details.find(item => item.element === 'Console Errors')?.errorCount === 0;
    
    const workingFeatures = [hasNavigation, hasForms, hasInteractive, hasNoErrors].filter(Boolean).length;
    
    if (workingFeatures >= 3) {
      verificationResults.basicFunctionality.status = '✅ PASS';
    } else if (workingFeatures >= 2) {
      verificationResults.basicFunctionality.status = '⚠️ PARTIAL';
    } else {
      verificationResults.basicFunctionality.status = '❌ FAIL';
    }
    
  } catch (error) {
    verificationResults.basicFunctionality.status = '❌ ERROR';
    verificationResults.basicFunctionality.details.push(`Error: ${error.message}`);
  } finally {
    await browser.close();
  }
}

function generateReport() {
  console.log('\n📝 Generating verification report...');
  
  const timestamp = new Date().toISOString();
  
  let report = `# UI Color Reversion Verification Report\n\n`;
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
  });
  report += `\n`;
  
  // Filter Pills
  report += `### 3. Filter Pills and Interactive Elements\n\n`;
  report += `**Status:** ${verificationResults.filterPills.status}\n\n`;
  report += `**Details:**\n`;
  verificationResults.filterPills.details.forEach(item => {
    report += `- **${item.element}:** ${item.hasBluePurple ? '✅' : '❌'} Has blue/purple theme`;
    if (item.hasBluePurpleGradient) {
      report += ` (gradient)`;
    }
    report += `\n`;
  });
  report += `\n`;
  
  // Chart Containers
  report += `### 4. Chart Containers\n\n`;
  report += `**Status:** ${verificationResults.chartContainers.status}\n\n`;
  report += `**Details:**\n`;
  verificationResults.chartContainers.details.forEach(item => {
    report += `- **${item.element}:** ${item.hasBluePurpleBorder || item.hasBluePurple ? '✅' : '❌'} Has blue/purple borders/theme\n`;
  });
  report += `\n`;
  
  // Scrollbar Styles
  report += `### 5. Scrollbar Styles\n\n`;
  report += `**Status:** ${verificationResults.scrollbarStyles.status}\n\n`;
  report += `**Details:**\n`;
  verificationResults.scrollbarStyles.details.forEach(item => {
    report += `- **${item.element}:** ${item.hasBluePurple ? '✅' : '❌'} Has blue/purple scrollbar styles\n`;
  });
  report += `\n`;
  
  // Button and Form Elements
  report += `### 6. Button and Form Elements\n\n`;
  report += `**Status:** ${verificationResults.buttonFormElements.status}\n\n`;
  report += `**Details:**\n`;
  verificationResults.buttonFormElements.details.forEach(item => {
    report += `- **${item.element}:** ${item.hasBluePurple ? '✅' : '❌'} Has blue/purple color scheme\n`;
  });
  report += `\n`;
  
  // Modal Components
  report += `### 7. Modal Components\n\n`;
  report += `**Status:** ${verificationResults.modalComponents.status}\n\n`;
  report += `**Details:**\n`;
  verificationResults.modalComponents.details.forEach(item => {
    report += `- **${item.element}:** ${item.hasBluePurple || item.hasBluePurpleBorder ? '✅' : '❌'} Has blue/purple borders/effects\n`;
  });
  report += `\n`;
  
  // Balatro Background
  report += `### 8. Balatro Dark Green Background\n\n`;
  report += `**Status:** ${verificationResults.balatroBackground.status}\n\n`;
  report += `**Details:**\n`;
  verificationResults.balatroBackground.details.forEach(item => {
    report += `- **${item.element}:** ${item.hasDarkGreen ? '✅' : '❌'} Has dark green background`;
    if (item.hasGradient) {
      report += ` (gradient)`;
    }
    report += `\n`;
  });
  report += `\n`;
  
  // Visual Harmony
  report += `### 9. Visual Harmony and Readability\n\n`;
  report += `**Status:** ${verificationResults.visualHarmony.status}\n\n`;
  report += `**Details:**\n`;
  verificationResults.visualHarmony.details.forEach(item => {
    if (item.element === 'Text Contrast') {
      report += `- **${item.element}:** ${item.hasGoodContrast ? '✅' : '❌'} Good text contrast (${item.textElements.length} elements checked)\n`;
    } else if (item.element === 'UI Element Visibility') {
      report += `- **${item.element}:** ${item.hasVisibleElements ? '✅' : '❌'} UI elements visible (${item.uiElements.length} elements checked)\n`;
    } else if (item.element === 'Color Scheme') {
      report += `- **${item.element}:** ${item.hasCohesiveTheme ? '✅' : '❌'} Cohesive blue/purple theme\n`;
    }
  });
  report += `\n`;
  
  // Basic Functionality
  report += `### 10. Basic Functionality\n\n`;
  report += `**Status:** ${verificationResults.basicFunctionality.status}\n\n`;
  report += `**Details:**\n`;
  verificationResults.basicFunctionality.details.forEach(item => {
    if (item.element === 'Navigation') {
      report += `- **${item.element}:** ${item.navigationWorking ? '✅' : '❌'} Navigation working\n`;
    } else if (item.element === 'Form Interactions') {
      report += `- **${item.element}:** ${item.formsWorking ? '✅' : '❌'} Form interactions working\n`;
    } else if (item.element === 'Interactive Elements') {
      report += `- **${item.element}:** ${item.interactiveWorking ? '✅' : '❌'} Interactive elements working\n`;
    } else if (item.element === 'Console Errors') {
      report += `- **${item.element}:** ${item.hasErrors ? '❌' : '✅'} ${item.errorCount} console errors\n`;
    }
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
      report += `- **Sidebar Components:** Ensure sidebar toggle button, menu items, and overlay use blue/purple theme\n`;
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
  report += `**Report generated by UI Color Reversion Verification Script**\n`;
  report += `**Timestamp:** ${timestamp}\n`;
  
  // Write report to file
  fs.writeFileSync(REPORT_FILE, report);
  
  console.log(`\n📊 Verification complete! Report saved to: ${REPORT_FILE}`);
  console.log(`📸 Screenshots saved to: ${SCREENSHOT_DIR}`);
  
  return report;
}

async function runVerification() {
  console.log('🚀 Starting UI Color Reversion Verification...\n');
  
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
    console.log('VERIFICATION SUMMARY');
    console.log('='.repeat(80));
    
    Object.entries(verificationResults).forEach(([key, result]) => {
      const formattedKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
      console.log(`${formattedKey}: ${result.status}`);
    });
    
    console.log('='.repeat(80));
    
  } catch (error) {
    console.error('❌ Verification failed with error:', error);
  }
}

// Run the verification
runVerification();