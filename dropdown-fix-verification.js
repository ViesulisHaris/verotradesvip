/**
 * Dropdown Fix Verification Test
 * This script will verify that the dropdown visibility fix is working correctly
 */

const { chromium } = require('playwright');

async function runDropdownFixVerification() {
  console.log('🚀 Starting dropdown fix verification test...');
  
  const browser = await chromium.launch({ 
    headless: false,
    devtools: true
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  
  const page = await context.newPage();
  
  // Capture console logs
  const consoleMessages = [];
  page.on('console', msg => {
    if (msg.text().includes('🔍 DEBUG:')) {
      console.log(`📝 Console: ${msg.text()}`);
    }
  });
  
  try {
    console.log('📍 Navigating to /log-trade page...');
    await page.goto('http://localhost:3000/log-trade', { 
      waitUntil: 'networkidle',
      timeout: 10000 
    });
    
    // Wait for page to load
    await page.waitForTimeout(2000);
    
    console.log('\n🔍 Step 1: Testing Strategy Dropdown Fix...');
    
    const strategyButton = await page.locator('[data-testid="strategy-dropdown"]').first();
    await strategyButton.click();
    await page.waitForTimeout(500);
    
    const strategyMenu = await page.locator('[data-testid="strategy-dropdown-menu"]').first();
    const strategyMenuExists = await strategyMenu.count() > 0;
    const strategyMenuVisible = await strategyMenu.isVisible();
    
    console.log('   Strategy dropdown menu exists:', strategyMenuExists);
    console.log('   Strategy dropdown menu visible:', strategyMenuVisible);
    
    if (strategyMenuExists && strategyMenuVisible) {
      // Check computed styles
      const computedStyles = await strategyMenu.evaluate(el => {
        const styles = window.getComputedStyle(el);
        return {
          display: styles.display,
          visibility: styles.visibility,
          opacity: styles.opacity,
          position: styles.position,
          zIndex: styles.zIndex,
          backgroundColor: styles.backgroundColor,
          transform: styles.transform,
          filter: styles.filter
        };
      });
      
      console.log('   Strategy dropdown computed styles:', computedStyles);
      
      // Check if background is properly set
      const hasValidBackground = computedStyles.backgroundColor !== 'rgba(0, 0, 0, 0)' && 
                               computedStyles.backgroundColor !== 'transparent';
      console.log('   Strategy dropdown has valid background:', hasValidBackground);
      
      // Test interaction
      const firstItem = await strategyMenu.locator('div').first();
      const itemExists = await firstItem.count() > 0;
      const itemVisible = await firstItem.isVisible();
      
      console.log('   Strategy dropdown items exist:', itemExists);
      console.log('   Strategy dropdown items visible:', itemVisible);
      
      if (itemExists && itemVisible) {
        console.log('   ✅ Strategy dropdown is working correctly!');
        await firstItem.click();
        await page.waitForTimeout(500);
      }
    } else {
      console.log('   ❌ Strategy dropdown fix failed');
    }
    
    console.log('\n🔍 Step 2: Testing Side Dropdown Fix...');
    
    const sideButton = await page.locator('[data-testid="side-dropdown"]').first();
    await sideButton.click();
    await page.waitForTimeout(500);
    
    const sideMenu = await page.locator('[data-testid="side-dropdown-menu"]').first();
    const sideMenuExists = await sideMenu.count() > 0;
    const sideMenuVisible = await sideMenu.isVisible();
    
    console.log('   Side dropdown menu exists:', sideMenuExists);
    console.log('   Side dropdown menu visible:', sideMenuVisible);
    
    if (sideMenuExists && sideMenuVisible) {
      // Check computed styles
      const computedStyles = await sideMenu.evaluate(el => {
        const styles = window.getComputedStyle(el);
        return {
          display: styles.display,
          visibility: styles.visibility,
          opacity: styles.opacity,
          position: styles.position,
          zIndex: styles.zIndex,
          backgroundColor: styles.backgroundColor,
          transform: styles.transform,
          filter: styles.filter
        };
      });
      
      console.log('   Side dropdown computed styles:', computedStyles);
      
      // Check if background is properly set
      const hasValidBackground = computedStyles.backgroundColor !== 'rgba(0, 0, 0, 0)' && 
                               computedStyles.backgroundColor !== 'transparent';
      console.log('   Side dropdown has valid background:', hasValidBackground);
      
      // Test interaction
      const firstItem = await sideMenu.locator('div').first();
      const itemExists = await firstItem.count() > 0;
      const itemVisible = await firstItem.isVisible();
      
      console.log('   Side dropdown items exist:', itemExists);
      console.log('   Side dropdown items visible:', itemVisible);
      
      if (itemExists && itemVisible) {
        console.log('   ✅ Side dropdown is working correctly!');
        await firstItem.click();
        await page.waitForTimeout(500);
      }
    } else {
      console.log('   ❌ Side dropdown fix failed');
    }
    
    console.log('\n🔍 Step 3: Testing Emotion Dropdown Fix...');
    
    const emotionButton = await page.locator('[data-testid="emotion-dropdown"]').first();
    await emotionButton.click();
    await page.waitForTimeout(500);
    
    const emotionMenu = await page.locator('[data-testid="emotion-dropdown-menu"]').first();
    const emotionMenuExists = await emotionMenu.count() > 0;
    const emotionMenuVisible = await emotionMenu.isVisible();
    
    console.log('   Emotion dropdown menu exists:', emotionMenuExists);
    console.log('   Emotion dropdown menu visible:', emotionMenuVisible);
    
    if (emotionMenuExists && emotionMenuVisible) {
      // Check computed styles
      const computedStyles = await emotionMenu.evaluate(el => {
        const styles = window.getComputedStyle(el);
        return {
          display: styles.display,
          visibility: styles.visibility,
          opacity: styles.opacity,
          position: styles.position,
          zIndex: styles.zIndex,
          backgroundColor: styles.backgroundColor,
          transform: styles.transform,
          filter: styles.filter
        };
      });
      
      console.log('   Emotion dropdown computed styles:', computedStyles);
      
      // Check if background is properly set
      const hasValidBackground = computedStyles.backgroundColor !== 'rgba(0, 0, 0, 0)' && 
                               computedStyles.backgroundColor !== 'transparent';
      console.log('   Emotion dropdown has valid background:', hasValidBackground);
      
      // Test interaction
      const firstItem = await emotionMenu.locator('div').first();
      const itemExists = await firstItem.count() > 0;
      const itemVisible = await firstItem.isVisible();
      
      console.log('   Emotion dropdown items exist:', itemExists);
      console.log('   Emotion dropdown items visible:', itemVisible);
      
      if (itemExists && itemVisible) {
        console.log('   ✅ Emotion dropdown is working correctly!');
        await firstItem.click();
        await page.waitForTimeout(500);
      }
    } else {
      console.log('   ❌ Emotion dropdown fix failed');
    }
    
    console.log('\n🔍 Step 4: Taking verification screenshots...');
    
    // Take screenshot of the form area
    const formArea = await page.locator('form').first();
    if (await formArea.isVisible()) {
      await formArea.screenshot({ 
        path: 'dropdown-fix-verification.png' 
      });
      console.log('   📸 Verification screenshot saved: dropdown-fix-verification.png');
    }
    
    // Generate final report
    const verificationResults = {
      timestamp: new Date().toISOString(),
      strategyDropdown: {
        menuExists: strategyMenuExists,
        menuVisible: strategyMenuVisible,
        working: strategyMenuExists && strategyMenuVisible
      },
      sideDropdown: {
        menuExists: sideMenuExists,
        menuVisible: sideMenuVisible,
        working: sideMenuExists && sideMenuVisible
      },
      emotionDropdown: {
        menuExists: emotionMenuExists,
        menuVisible: emotionMenuVisible,
        working: emotionMenuExists && emotionMenuVisible
      },
      overallSuccess: (strategyMenuExists && strategyMenuVisible) && 
                      (sideMenuExists && sideMenuVisible) && 
                      (emotionMenuExists && emotionMenuVisible)
    };
    
    console.log('\n📊 Verification Results:');
    console.log('   Strategy Dropdown:', verificationResults.strategyDropdown.working ? '✅ PASS' : '❌ FAIL');
    console.log('   Side Dropdown:', verificationResults.sideDropdown.working ? '✅ PASS' : '❌ FAIL');
    console.log('   Emotion Dropdown:', verificationResults.emotionDropdown.working ? '✅ PASS' : '❌ FAIL');
    console.log('   Overall Status:', verificationResults.overallSuccess ? '🎉 ALL TESTS PASSED!' : '⚠️  SOME TESTS FAILED');
    
    // Save verification report
    const fs = require('fs');
    fs.writeFileSync('dropdown-fix-verification-report.json', JSON.stringify(verificationResults, null, 2));
    console.log('   📄 Verification report saved: dropdown-fix-verification-report.json');
    
  } catch (error) {
    console.error('❌ Verification test failed:', error);
  } finally {
    await browser.close();
    console.log('🔚 Browser closed');
  }
}

// Run the verification test
runDropdownFixVerification().catch(console.error);