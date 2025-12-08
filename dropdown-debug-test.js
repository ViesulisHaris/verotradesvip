/**
 * Comprehensive Dropdown Debug Test Script
 * This script will systematically test the dropdown functionality on the /log-trade page
 * and capture detailed debugging information.
 */

const { chromium } = require('playwright');

async function runDropdownDebugTest() {
  console.log('🚀 Starting comprehensive dropdown debug test...');
  
  const browser = await chromium.launch({ 
    headless: false, // Set to true for headless mode
    devtools: true // Open DevTools by default
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  
  const page = await context.newPage();
  
  // Capture console logs
  const consoleMessages = [];
  page.on('console', msg => {
    consoleMessages.push({
      type: msg.type(),
      text: msg.text(),
      location: msg.location()
    });
    if (msg.text().includes('🔍 DEBUG:')) {
      console.log(`📝 Console: ${msg.text()}`);
    }
  });
  
  // Capture network errors
  page.on('pageerror', error => {
    console.log(`❌ Page Error: ${error.message}`);
  });
  
  try {
    console.log('📍 Navigating to /log-trade page...');
    await page.goto('http://localhost:3000/log-trade', { 
      waitUntil: 'networkidle',
      timeout: 10000 
    });
    
    // Wait for page to load
    await page.waitForTimeout(2000);
    
    console.log('🔍 Step 1: Checking initial page state...');
    const pageTitle = await page.title();
    console.log(`   Page title: ${pageTitle}`);
    
    // Check if dropdown buttons exist
    const strategyButton = await page.locator('[data-testid="strategy-dropdown"]').first();
    const sideButton = await page.locator('[data-testid="side-dropdown"]').first();
    const emotionButton = await page.locator('[data-testid="emotion-dropdown"]').first();
    
    console.log('   Strategy button exists:', await strategyButton.isVisible());
    console.log('   Side button exists:', await sideButton.isVisible());
    console.log('   Emotion button exists:', await emotionButton.isVisible());
    
    console.log('\n🔍 Step 2: Testing Strategy Dropdown...');
    
    // Clear console before testing
    consoleMessages.length = 0;
    
    // Click strategy dropdown
    console.log('   Clicking strategy dropdown button...');
    await strategyButton.click();
    
    // Wait a moment for any state changes
    await page.waitForTimeout(500);
    
    // Check if dropdown menu exists in DOM
    const strategyMenu = await page.locator('[data-testid="strategy-dropdown-menu"]').first();
    const strategyMenuExists = await strategyMenu.count() > 0;
    console.log('   Strategy dropdown menu in DOM:', strategyMenuExists);
    
    if (strategyMenuExists) {
      // Check visibility and computed styles
      const isVisible = await strategyMenu.isVisible();
      const computedStyles = await strategyMenu.evaluate(el => {
        const styles = window.getComputedStyle(el);
        return {
          display: styles.display,
          visibility: styles.visibility,
          opacity: styles.opacity,
          position: styles.position,
          zIndex: styles.zIndex,
          transform: styles.transform,
          filter: styles.filter,
          backgroundColor: styles.backgroundColor,
          width: styles.width,
          height: styles.height,
          top: styles.top,
          left: styles.left
        };
      });
      
      console.log('   Strategy dropdown visible:', isVisible);
      console.log('   Strategy dropdown computed styles:', computedStyles);
      
      // Check bounding box
      const boundingBox = await strategyMenu.boundingBox();
      console.log('   Strategy dropdown bounding box:', boundingBox);
      
      // Try to interact with dropdown items
      const firstStrategyItem = await strategyMenu.locator('div').first();
      const itemExists = await firstStrategyItem.count() > 0;
      console.log('   Strategy dropdown items exist:', itemExists);
      
      if (itemExists) {
        const itemVisible = await firstStrategyItem.isVisible();
        console.log('   First strategy item visible:', itemVisible);
        
        if (itemVisible) {
          console.log('   Clicking first strategy item...');
          await firstStrategyItem.click();
          await page.waitForTimeout(500);
        }
      }
    } else {
      console.log('   ❌ Strategy dropdown menu not found in DOM');
    }
    
    console.log('\n🔍 Step 3: Testing Side Dropdown...');
    
    // Clear console before testing
    consoleMessages.length = 0;
    
    // Click side dropdown
    console.log('   Clicking side dropdown button...');
    await sideButton.click();
    
    // Wait a moment for any state changes
    await page.waitForTimeout(500);
    
    // Check if dropdown menu exists in DOM
    const sideMenu = await page.locator('[data-testid="side-dropdown-menu"]').first();
    const sideMenuExists = await sideMenu.count() > 0;
    console.log('   Side dropdown menu in DOM:', sideMenuExists);
    
    if (sideMenuExists) {
      // Check visibility and computed styles
      const isVisible = await sideMenu.isVisible();
      const computedStyles = await sideMenu.evaluate(el => {
        const styles = window.getComputedStyle(el);
        return {
          display: styles.display,
          visibility: styles.visibility,
          opacity: styles.opacity,
          position: styles.position,
          zIndex: styles.zIndex,
          transform: styles.transform,
          filter: styles.filter,
          backgroundColor: styles.backgroundColor,
          width: styles.width,
          height: styles.height,
          top: styles.top,
          left: styles.left
        };
      });
      
      console.log('   Side dropdown visible:', isVisible);
      console.log('   Side dropdown computed styles:', computedStyles);
      
      // Check bounding box
      const boundingBox = await sideMenu.boundingBox();
      console.log('   Side dropdown bounding box:', boundingBox);
      
      // Try to interact with dropdown items
      const firstSideItem = await sideMenu.locator('div').first();
      const itemExists = await firstSideItem.count() > 0;
      console.log('   Side dropdown items exist:', itemExists);
      
      if (itemExists) {
        const itemVisible = await firstSideItem.isVisible();
        console.log('   First side item visible:', itemVisible);
        
        if (itemVisible) {
          console.log('   Clicking first side item...');
          await firstSideItem.click();
          await page.waitForTimeout(500);
        }
      }
    } else {
      console.log('   ❌ Side dropdown menu not found in DOM');
    }
    
    console.log('\n🔍 Step 4: Testing Emotion Dropdown...');
    
    // Clear console before testing
    consoleMessages.length = 0;
    
    // Click emotion dropdown
    console.log('   Clicking emotion dropdown button...');
    await emotionButton.click();
    
    // Wait a moment for any state changes
    await page.waitForTimeout(500);
    
    // Check if dropdown menu exists in DOM
    const emotionMenu = await page.locator('[data-testid="emotion-dropdown-menu"]').first();
    const emotionMenuExists = await emotionMenu.count() > 0;
    console.log('   Emotion dropdown menu in DOM:', emotionMenuExists);
    
    if (emotionMenuExists) {
      // Check visibility and computed styles
      const isVisible = await emotionMenu.isVisible();
      const computedStyles = await emotionMenu.evaluate(el => {
        const styles = window.getComputedStyle(el);
        return {
          display: styles.display,
          visibility: styles.visibility,
          opacity: styles.opacity,
          position: styles.position,
          zIndex: styles.zIndex,
          transform: styles.transform,
          filter: styles.filter,
          backgroundColor: styles.backgroundColor,
          width: styles.width,
          height: styles.height,
          top: styles.top,
          left: styles.left
        };
      });
      
      console.log('   Emotion dropdown visible:', isVisible);
      console.log('   Emotion dropdown computed styles:', computedStyles);
      
      // Check bounding box
      const boundingBox = await emotionMenu.boundingBox();
      console.log('   Emotion dropdown bounding box:', boundingBox);
      
      // Try to interact with dropdown items
      const firstEmotionItem = await emotionMenu.locator('div').first();
      const itemExists = await firstEmotionItem.count() > 0;
      console.log('   Emotion dropdown items exist:', itemExists);
      
      if (itemExists) {
        const itemVisible = await firstEmotionItem.isVisible();
        console.log('   First emotion item visible:', itemVisible);
        
        if (itemVisible) {
          console.log('   Clicking first emotion item...');
          await firstEmotionItem.click();
          await page.waitForTimeout(500);
        }
      }
    } else {
      console.log('   ❌ Emotion dropdown menu not found in DOM');
    }
    
    console.log('\n🔍 Step 5: Analyzing CSS and Layout...');
    
    // Check for any CSS conflicts
    const cssAnalysis = await page.evaluate(() => {
      const dropdowns = document.querySelectorAll('[data-testid$="-dropdown-menu"]');
      const results = [];
      
      dropdowns.forEach((dropdown, index) => {
        const computedStyle = window.getComputedStyle(dropdown);
        const parent = dropdown.parentElement;
        const parentStyle = parent ? window.getComputedStyle(parent) : null;
        
        results.push({
          index,
          testId: dropdown.getAttribute('data-testid'),
          element: dropdown.tagName.toLowerCase(),
          className: dropdown.className,
          id: dropdown.id,
          computedStyle: {
            display: computedStyle.display,
            visibility: computedStyle.visibility,
            opacity: computedStyle.opacity,
            position: computedStyle.position,
            zIndex: computedStyle.zIndex,
            transform: computedStyle.transform,
            filter: computedStyle.filter,
            backgroundColor: computedStyle.backgroundColor,
            width: computedStyle.width,
            height: computedStyle.height,
            top: computedStyle.top,
            left: computedStyle.left
          },
          parentStyle: parentStyle ? {
            overflow: parentStyle.overflow,
            overflowX: parentStyle.overflowX,
            overflowY: parentStyle.overflowY,
            position: parentStyle.position,
            zIndex: parentStyle.zIndex,
            transform: parentStyle.transform,
            filter: parentStyle.filter,
            opacity: parentStyle.opacity,
            visibility: parentStyle.visibility
          } : null,
          rect: dropdown.getBoundingClientRect(),
          inDOM: document.contains(dropdown)
        });
      });
      
      // Check for any overlay elements
      const overlays = document.querySelectorAll('[style*="position: fixed"], [style*="position: absolute"]');
      const overlayInfo = Array.from(overlays).map(overlay => ({
        tagName: overlay.tagName.toLowerCase(),
        className: overlay.className,
        zIndex: window.getComputedStyle(overlay).zIndex,
        position: window.getComputedStyle(overlay).position,
        rect: overlay.getBoundingClientRect()
      })).filter(overlay => 
        overlay.position === 'fixed' || overlay.position === 'absolute'
      ).sort((a, b) => parseInt(b.zIndex) - parseInt(a.zIndex));
      
      return {
        dropdowns: results,
        overlays: overlayInfo,
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
        pageYOffset: window.pageYOffset,
        pageXOffset: window.pageXOffset
      };
    });
    
    console.log('   CSS Analysis:', JSON.stringify(cssAnalysis, null, 2));
    
    console.log('\n🔍 Step 6: Capturing debug console messages...');
    const debugMessages = consoleMessages.filter(msg => msg.text.includes('🔍 DEBUG:'));
    console.log(`   Found ${debugMessages.length} debug messages:`);
    debugMessages.forEach((msg, index) => {
      console.log(`   ${index + 1}. [${msg.type}] ${msg.text}`);
    });
    
    console.log('\n🔍 Step 7: Taking screenshots...');
    
    // Take a screenshot of the full page
    await page.screenshot({ 
      path: 'dropdown-debug-full-page.png', 
      fullPage: true 
    });
    
    // Take a screenshot of just the form area
    const formArea = await page.locator('form').first();
    if (await formArea.isVisible()) {
      await formArea.screenshot({ 
        path: 'dropdown-debug-form-area.png' 
      });
    }
    
    console.log('   Screenshots saved:');
    console.log('   - dropdown-debug-full-page.png');
    console.log('   - dropdown-debug-form-area.png');
    
    console.log('\n✅ Dropdown debug test completed!');
    
    // Generate a summary report
    const report = {
      timestamp: new Date().toISOString(),
      testResults: {
        strategyDropdown: {
          buttonExists: await strategyButton.isVisible(),
          menuExists: await strategyMenu.count() > 0,
          menuVisible: await strategyMenu.isVisible()
        },
        sideDropdown: {
          buttonExists: await sideButton.isVisible(),
          menuExists: await sideMenu.count() > 0,
          menuVisible: await sideMenu.isVisible()
        },
        emotionDropdown: {
          buttonExists: await emotionButton.isVisible(),
          menuExists: await emotionMenu.count() > 0,
          menuVisible: await emotionMenu.isVisible()
        }
      },
      cssAnalysis,
      debugMessages: debugMessages.map(msg => ({
        type: msg.type,
        text: msg.text,
        location: msg.location
      })),
      screenshots: [
        'dropdown-debug-full-page.png',
        'dropdown-debug-form-area.png'
      ]
    };
    
    // Save the report
    const fs = require('fs');
    fs.writeFileSync('dropdown-debug-report.json', JSON.stringify(report, null, 2));
    console.log('   📄 Report saved to: dropdown-debug-report.json');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    
    // Take error screenshot
    try {
      await page.screenshot({ 
        path: 'dropdown-debug-error.png', 
        fullPage: true 
      });
      console.log('   📸 Error screenshot saved: dropdown-debug-error.png');
    } catch (screenshotError) {
      console.log('   Could not save error screenshot:', screenshotError.message);
    }
  } finally {
    await browser.close();
    console.log('🔚 Browser closed');
  }
}

// Run the test
runDropdownDebugTest().catch(console.error);