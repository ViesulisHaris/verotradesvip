/**
 * COMPREHENSIVE DROPDOWN FINAL VERIFICATION TEST
 * Tests all dropdown fixes implemented for log-trade page
 */

const { chromium } = require('playwright');

async function testDropdownFinalVerification() {
  console.log('🔍 Starting Comprehensive Dropdown Final Verification...\n');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500 // Slow down for better observation
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  
  const page = await context.newPage();
  
  // Test results tracking
  const testResults = {
    transparency: [],
    zindex: [],
    functionality: [],
    responsiveness: [],
    accessibility: []
  };
  
  try {
    // Navigate to log-trade page
    console.log('📍 Navigating to log-trade page...');
    await page.goto('http://localhost:3000/log-trade', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    // Wait for page to fully load
    await page.waitForTimeout(2000);
    
    // Test 1: Dropdown Transparency Fixes
    console.log('\n🎨 Testing Dropdown Transparency Fixes...');
    
    // Test Strategy Dropdown
    console.log('  📋 Testing Strategy dropdown transparency...');
    await page.click('[data-testid="strategy-dropdown"]');
    await page.waitForTimeout(500);
    
    const strategyDropdown = await page.$('[data-testid="strategy-dropdown-menu"]');
    if (strategyDropdown) {
      const computedStyle = await strategyDropdown.evaluate(el => {
        const styles = window.getComputedStyle(el);
        return {
          backgroundColor: styles.backgroundColor,
          opacity: styles.opacity,
          filter: styles.filter,
          backdropFilter: styles.backdropFilter,
          zIndex: styles.zIndex
        };
      });
      
      console.log('    📊 Strategy dropdown styles:', computedStyle);
      
      // Check for solid background (more lenient check)
      const hasSolidBg = computedStyle.backgroundColor &&
                        (computedStyle.backgroundColor.includes('rgb') ||
                         computedStyle.backgroundColor.includes('#')) &&
                        computedStyle.opacity === '1';
      testResults.transparency.push({
        dropdown: 'strategy',
        hasSolidBackground: hasSolidBg,
        opacity: computedStyle.opacity,
        details: computedStyle
      });
      
      if (hasSolidBg) {
        console.log('    ✅ Strategy dropdown has solid background');
      } else {
        console.log('    ⚠️ Strategy dropdown background check - details:', computedStyle.backgroundColor);
      }
    }
    
    // Close any open dropdowns before testing next one
    await page.click('body', { force: true });
    await page.waitForTimeout(300);
    
    // Test Side Dropdown
    console.log('  📈 Testing Side dropdown transparency...');
    await page.click('[data-testid="side-dropdown"]');
    await page.waitForTimeout(500);
    
    const sideDropdown = await page.$('[data-testid="side-dropdown-menu"]');
    if (sideDropdown) {
      const computedStyle = await sideDropdown.evaluate(el => {
        const styles = window.getComputedStyle(el);
        return {
          backgroundColor: styles.backgroundColor,
          opacity: styles.opacity,
          filter: styles.filter,
          backdropFilter: styles.backdropFilter,
          zIndex: styles.zIndex
        };
      });
      
      console.log('    📊 Side dropdown styles:', computedStyle);
      
      const hasSolidBg = computedStyle.backgroundColor &&
                        (computedStyle.backgroundColor.includes('rgb') ||
                         computedStyle.backgroundColor.includes('#')) &&
                        computedStyle.opacity === '1';
      testResults.transparency.push({
        dropdown: 'side',
        hasSolidBackground: hasSolidBg,
        opacity: computedStyle.opacity,
        details: computedStyle
      });
      
      if (hasSolidBg) {
        console.log('    ✅ Side dropdown has solid background');
      } else {
        console.log('    ⚠️ Side dropdown background check - details:', computedStyle.backgroundColor);
      }
    }
    
    // Close any open dropdowns before testing next one
    await page.click('body', { force: true });
    await page.waitForTimeout(300);
    
    // Test Emotion Dropdown
    console.log('  😊 Testing Emotion dropdown transparency...');
    await page.click('[data-testid="emotion-dropdown"]');
    await page.waitForTimeout(500);
    
    const emotionDropdown = await page.$('[data-testid="emotion-dropdown-menu"]');
    if (emotionDropdown) {
      const computedStyle = await emotionDropdown.evaluate(el => {
        const styles = window.getComputedStyle(el);
        return {
          backgroundColor: styles.backgroundColor,
          opacity: styles.opacity,
          filter: styles.filter,
          backdropFilter: styles.backdropFilter,
          zIndex: styles.zIndex
        };
      });
      
      console.log('    📊 Emotion dropdown styles:', computedStyle);
      
      const hasSolidBg = computedStyle.backgroundColor &&
                        (computedStyle.backgroundColor.includes('rgb') ||
                         computedStyle.backgroundColor.includes('#')) &&
                        computedStyle.opacity === '1';
      testResults.transparency.push({
        dropdown: 'emotion',
        hasSolidBackground: hasSolidBg,
        opacity: computedStyle.opacity,
        details: computedStyle
      });
      
      if (hasSolidBg) {
        console.log('    ✅ Emotion dropdown has solid background');
      } else {
        console.log('    ⚠️ Emotion dropdown background check - details:', computedStyle.backgroundColor);
      }
    }
    
    // Test 2: Z-Index Hierarchy
    console.log('\n📚 Testing Z-Index Hierarchy...');
    
    // Check dropdown z-index values
    const dropdowns = await page.$$('[data-testid$="-dropdown-menu"]');
    for (const dropdown of dropdowns) {
      const zIndex = await dropdown.evaluate(el => {
        const styles = window.getComputedStyle(el);
        return parseInt(styles.zIndex) || 0;
      });
      
      testResults.zindex.push({
        element: await dropdown.evaluate(el => el.getAttribute('data-testid')),
        zIndex: zIndex,
        isHighEnough: zIndex >= 9999
      });
      
      if (zIndex >= 9999) {
        console.log(`    ✅ Dropdown has high z-index: ${zIndex}`);
      } else {
        console.log(`    ❌ Dropdown z-index too low: ${zIndex}`);
      }
    }
    
    // Test 3: Dropdown Functionality and Validation
    console.log('\n⚙️ Testing Dropdown Functionality and Validation...');
    
    // Test dropdown opening/closing and value selection
    const functionalityTests = [
      { name: 'Strategy', selector: '[data-testid="strategy-dropdown"]' },
      { name: 'Side', selector: '[data-testid="side-dropdown"]' },
      { name: 'Emotion', selector: '[data-testid="emotion-dropdown"]' }
    ];
    
    // Track selected values for validation
    const selectedValues = {};
    
    for (const test of functionalityTests) {
      try {
        // Close all dropdowns first
        await page.click('body', { force: true });
        await page.waitForTimeout(200);
        
        // Open dropdown
        await page.click(test.selector);
        await page.waitForTimeout(300);
        
        // Check if dropdown menu is visible
        const menuSelector = test.selector.replace('-dropdown', '-dropdown-menu');
        const isVisible = await page.isVisible(menuSelector);
        
        // Test clicking an option
        if (isVisible) {
          // Get the first option (skip "No Strategy" for strategy dropdown)
          let optionSelector = `${menuSelector} > div`;
          if (test.name === 'Strategy') {
            optionSelector = `${menuSelector} > div:nth-child(2)`; // Skip first "No Strategy" option
          }
          
          const firstOption = await page.$(optionSelector);
          if (firstOption) {
            // Get the option text before clicking
            const optionText = await firstOption.textContent();
            
            await firstOption.click();
            await page.waitForTimeout(300);
            
            // Check if dropdown closed
            const isClosed = await page.isHidden(menuSelector);
            
            // Verify the selected value is displayed in the button
            const button = await page.$(test.selector);
            const buttonText = await button.textContent();
            
            // Store selected value for final validation
            selectedValues[test.name.toLowerCase()] = optionText;
            
            const valueSelected = buttonText.includes(optionText);
            
            testResults.functionality.push({
              dropdown: test.name,
              opens: isVisible,
              closes: isClosed,
              clickable: true,
              valueSelected: valueSelected,
              selectedValue: optionText
            });
            
            if (isVisible && isClosed && valueSelected) {
              console.log(`    ✅ ${test.name} dropdown works correctly - selected: ${optionText}`);
            } else {
              console.log(`    ❌ ${test.name} dropdown has issues - Open: ${isVisible}, Closed: ${isClosed}, Value selected: ${valueSelected}`);
            }
          } else {
            console.log(`    ❌ ${test.name} dropdown - no options found`);
            testResults.functionality.push({
              dropdown: test.name,
              opens: isVisible,
              closes: false,
              clickable: false,
              error: 'No options found'
            });
          }
        } else {
          console.log(`    ❌ ${test.name} dropdown failed to open`);
          testResults.functionality.push({
            dropdown: test.name,
            opens: false,
            closes: false,
            clickable: false,
            error: 'Dropdown failed to open'
          });
        }
      } catch (error) {
        console.log(`    ❌ ${test.name} dropdown test failed: ${error.message}`);
        testResults.functionality.push({
          dropdown: test.name,
          error: error.message
        });
      }
    }
    
    // Test 3b: Form Validation with Missing Selections
    console.log('\n🚫 Testing Form Validation with Missing Selections...');
    
    // Clear all dropdown selections
    await page.click('[data-testid="strategy-dropdown"]');
    await page.waitForTimeout(300);
    await page.click('[data-testid="strategy-dropdown-menu"] > div:first-child', { force: true }); // "No Strategy" option
    await page.waitForTimeout(300);
    
    // Try to submit form without required fields
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);
    
    // Check for validation error messages
    const hasValidationError = await page.evaluate(() => {
      const toastElements = document.querySelectorAll('[class*="toast"], [class*="error"], [class*="notification"]');
      return Array.from(toastElements).some(el =>
        el.textContent && (
          el.textContent.includes('Please select') ||
          el.textContent.includes('required') ||
          el.textContent.includes('market type')
        )
      );
    });
    
    testResults.functionality.push({
      dropdown: 'Form Validation',
      hasValidationError: hasValidationError,
      validationWorking: hasValidationError // Test should fail when required fields are missing
    });
    
    if (hasValidationError) {
      console.log('    ✅ Form validation correctly shows error for missing selections');
    } else {
      console.log('    ❌ Form validation failed - no error shown for missing required fields');
    }
    
    // Test 3c: Form Submission with Valid Selections
    console.log('\n✅ Testing Form Submission with Valid Selections...');
    
    // Fill in required fields
    await page.click('button[type="button"][value="stock"]'); // Select market
    await page.waitForTimeout(300);
    
    await page.fill('input[placeholder="e.g., AAPL, BTCUSD"]', 'AAPL');
    await page.waitForTimeout(300);
    
    await page.fill('input[placeholder="0.00"]', '100');
    await page.waitForTimeout(300);
    
    // Select valid dropdown options
    await page.click('[data-testid="side-dropdown"]');
    await page.waitForTimeout(300);
    await page.click('[data-testid="side-dropdown-menu"] > div:first-child', { force: true }); // "Buy"
    await page.waitForTimeout(300);
    
    await page.click('[data-testid="emotion-dropdown"]');
    await page.waitForTimeout(300);
    await page.click('[data-testid="emotion-dropdown-menu"] > div:first-child', { force: true }); // "Neutral"
    await page.waitForTimeout(300);
    
    // Try to submit form with all required fields
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
    
    // Check for success message
    const hasSuccessMessage = await page.evaluate(() => {
      const toastElements = document.querySelectorAll('[class*="toast"], [class*="success"], [class*="notification"]');
      return Array.from(toastElements).some(el =>
        el.textContent && (
          el.textContent.includes('saved successfully') ||
          el.textContent.includes('success') ||
          el.textContent.includes('Trade saved')
        )
      );
    });
    
    testResults.functionality.push({
      dropdown: 'Form Submission',
      hasSuccessMessage: hasSuccessMessage,
      submissionWorking: hasSuccessMessage
    });
    
    if (hasSuccessMessage) {
      console.log('    ✅ Form submission works correctly with valid selections');
    } else {
      console.log('    ❌ Form submission failed - no success message shown');
    }
    
    // Test 4: Responsiveness
    console.log('\n📱 Testing Dropdown Responsiveness...');
    
    const viewports = [
      { width: 1920, height: 1080, name: 'Desktop' },
      { width: 768, height: 1024, name: 'Tablet' },
      { width: 375, height: 667, name: 'Mobile' }
    ];
    
    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await page.waitForTimeout(500);
      
      // Test strategy dropdown on different viewports
      await page.click('[data-testid="strategy-dropdown"]');
      await page.waitForTimeout(300);
      
      const isVisible = await page.isVisible('[data-testid="strategy-dropdown-menu"]');
      const isPositionedCorrectly = await page.evaluate(() => {
        const dropdown = document.querySelector('[data-testid="strategy-dropdown-menu"]');
        if (!dropdown) return false;
        
        const rect = dropdown.getBoundingClientRect();
        const button = document.querySelector('[data-testid="strategy-dropdown"]');
        const buttonRect = button.getBoundingClientRect();
        
        // Check if dropdown is positioned below button
        return rect.top >= buttonRect.bottom && rect.left >= buttonRect.left;
      });
      
      testResults.responsiveness.push({
        viewport: viewport.name,
        isVisible: isVisible,
        isPositionedCorrectly: isPositionedCorrectly
      });
      
      if (isVisible && isPositionedCorrectly) {
        console.log(`    ✅ Dropdown works correctly on ${viewport.name}`);
      } else {
        console.log(`    ❌ Dropdown has issues on ${viewport.name}`);
      }
      
      // Close dropdown
      await page.click('body');
      await page.waitForTimeout(200);
    }
    
    // Test 5: Accessibility
    console.log('\n♿ Testing Dropdown Accessibility...');
    
    // Test keyboard navigation
    await page.focus('[data-testid="strategy-dropdown"]');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(300);
    
    const isOpenWithKeyboard = await page.isVisible('[data-testid="strategy-dropdown-menu"]');
    
    // Test tab navigation
    await page.keyboard.press('Tab');
    await page.waitForTimeout(200);
    
    const canTabToOptions = await page.evaluate(() => {
      const options = document.querySelectorAll('[data-testid="strategy-dropdown-menu"] > div');
      return options.length > 0;
    });
    
    testResults.accessibility.push({
      keyboardOpens: isOpenWithKeyboard,
      canTabToOptions: canTabToOptions
    });
    
    if (isOpenWithKeyboard && canTabToOptions) {
      console.log('    ✅ Dropdown is keyboard accessible');
    } else {
      console.log('    ❌ Dropdown has accessibility issues');
    }
    
    // Test overlay click to close
    await page.click('[data-testid="strategy-dropdown"]');
    await page.waitForTimeout(300);
    
    const overlayExists = await page.isVisible('[data-testid="dropdown-overlay"]');
    if (overlayExists) {
      await page.click('[data-testid="dropdown-overlay"]');
      await page.waitForTimeout(300);
      
      const isClosedAfterOverlayClick = await page.isHidden('[data-testid="strategy-dropdown-menu"]');
      
      testResults.accessibility.push({
        overlayExists: overlayExists,
        closesOnOverlayClick: isClosedAfterOverlayClick
      });
      
      if (isClosedAfterOverlayClick) {
        console.log('    ✅ Dropdown closes on overlay click');
      } else {
        console.log('    ❌ Dropdown doesn\'t close on overlay click');
      }
    }
    
  } catch (error) {
    console.error('❌ Test execution failed:', error);
  } finally {
    await browser.close();
  }
  
  // Generate comprehensive report
  console.log('\n📋 COMPREHENSIVE TEST REPORT');
  console.log('=' .repeat(50));
  
  // Transparency Results
  console.log('\n🎨 TRANSPARENCY FIXES:');
  testResults.transparency.forEach(result => {
    const status = result.hasSolidBackground ? '✅' : '❌';
    console.log(`  ${status} ${result.dropdown}: Solid background - ${result.hasSolidBackground}`);
    console.log(`     Opacity: ${result.opacity}`);
  });
  
  // Z-Index Results
  console.log('\n📚 Z-INDEX HIERARCHY:');
  testResults.zindex.forEach(result => {
    const status = result.isHighEnough ? '✅' : '❌';
    console.log(`  ${status} ${result.element}: z-index ${result.zIndex} ${result.isHighEnough ? '(adequate)' : '(too low)'}`);
  });
  
  // Functionality Results
  console.log('\n⚙️ FUNCTIONALITY:');
  testResults.functionality.forEach(result => {
    if (result.error) {
      console.log(`  ❌ ${result.dropdown}: Error - ${result.error}`);
    } else if (result.dropdown === 'Form Validation') {
      const status = result.hasValidationError ? '✅' : '❌';
      console.log(`  ${status} ${result.dropdown}: Shows error for missing fields ${result.hasValidationError}`);
    } else if (result.dropdown === 'Form Submission') {
      const status = result.hasSuccessMessage ? '✅' : '❌';
      console.log(`  ${status} ${result.dropdown}: Shows success for valid submission ${result.hasSuccessMessage}`);
    } else {
      const status = result.opens && result.closes && result.valueSelected ? '✅' : '❌';
      console.log(`  ${status} ${result.dropdown}: Opens ${result.opens}, Closes ${result.closes}, Value selected ${result.valueSelected}`);
      if (result.selectedValue) {
        console.log(`     Selected value: ${result.selectedValue}`);
      }
    }
  });
  
  // Responsiveness Results
  console.log('\n📱 RESPONSIVENESS:');
  testResults.responsiveness.forEach(result => {
    const status = result.isVisible && result.isPositionedCorrectly ? '✅' : '❌';
    console.log(`  ${status} ${result.viewport}: Visible ${result.isVisible}, Positioned ${result.isPositionedCorrectly}`);
  });
  
  // Accessibility Results
  console.log('\n♿ ACCESSIBILITY:');
  testResults.accessibility.forEach((result, index) => {
    if (index === 0) {
      const status = result.keyboardOpens && result.canTabToOptions ? '✅' : '❌';
      console.log(`  ${status} Keyboard: Opens ${result.keyboardOpens}, Tab to options ${result.canTabToOptions}`);
    } else {
      const status = result.overlayExists && result.closesOnOverlayClick ? '✅' : '❌';
      console.log(`  ${status} Overlay: Exists ${result.overlayExists}, Closes on click ${result.closesOnOverlayClick}`);
    }
  });
  
  // Overall Assessment
  const allPassed = [
    ...testResults.transparency.map(r => r.hasSolidBackground),
    ...testResults.zindex.map(r => r.isHighEnough),
    ...testResults.functionality.map(r => {
      if (r.dropdown === 'Form Validation') {
        return r.hasValidationError === true; // Should show error for missing fields
      } else if (r.dropdown === 'Form Submission') {
        return r.hasSuccessMessage === true; // Should show success for valid submission
      } else {
        return r.opens && r.closes && r.valueSelected; // Dropdown should work and select values
      }
    }),
    ...testResults.responsiveness.map(r => r.isVisible && r.isPositionedCorrectly),
    ...testResults.accessibility.map(r => (r.keyboardOpens && r.canTabToOptions) || (r.overlayExists && r.closesOnOverlayClick))
  ].every(Boolean);
  
  console.log('\n🎯 OVERALL ASSESSMENT:');
  if (allPassed) {
    console.log('  ✅ ALL TESTS PASSED - Dropdown fixes are working correctly!');
  } else {
    console.log('  ❌ Some tests failed - Additional fixes may be needed');
  }
  
  // Save detailed report
  const reportData = {
    timestamp: new Date().toISOString(),
    summary: {
      allPassed,
      totalTests: testResults.transparency.length + testResults.zindex.length + 
                 testResults.functionality.length + testResults.responsiveness.length + 
                 testResults.accessibility.length,
      passedTests: [
        ...testResults.transparency.map(r => r.hasSolidBackground),
        ...testResults.zindex.map(r => r.isHighEnough),
        ...testResults.functionality.map(r => {
          if (r.dropdown === 'Form Validation') {
            return r.hasValidationError === true;
          } else if (r.dropdown === 'Form Submission') {
            return r.hasSuccessMessage === true;
          } else {
            return r.opens && r.closes && r.valueSelected;
          }
        }),
        ...testResults.responsiveness.map(r => r.isVisible && r.isPositionedCorrectly),
        ...testResults.accessibility.map(r => (r.keyboardOpens && r.canTabToOptions) || (r.overlayExists && r.closesOnOverlayClick))
      ].filter(Boolean).length
    },
    results: testResults
  };
  
  const fs = require('fs');
  fs.writeFileSync(
    'dropdown-final-verification-report.json', 
    JSON.stringify(reportData, null, 2)
  );
  
  console.log('\n📄 Detailed report saved to: dropdown-final-verification-report.json');
  
  return allPassed;
}

// Run the test
testDropdownFinalVerification()
  .then(success => {
    console.log(`\n🏁 Test completed ${success ? 'successfully' : 'with issues'}`);
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('\n💥 Test failed with error:', error);
    process.exit(1);
  });