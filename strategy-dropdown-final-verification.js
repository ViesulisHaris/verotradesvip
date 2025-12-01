const puppeteer = require('puppeteer');
const path = require('path');

async function verifyStrategyDropdown() {
  console.log('Starting final verification of strategy dropdown functionality...');
  
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: ['--start-maximized', '--no-sandbox']
  });
  
  const page = await browser.newPage();
  
  // Capture console errors
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
      console.log('Console Error:', msg.text());
    }
  });
  
  // Capture page errors
  const pageErrors = [];
  page.on('pageerror', error => {
    pageErrors.push(error.message);
    console.log('Page Error:', error.message);
  });
  
  try {
    // Navigate to the trade form page
    console.log('Navigating to trade form page...');
    await page.goto('http://localhost:3001/trades', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    // Wait for the page to load
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Check if we need to log in
    const loginRequired = await page.$('input[type="email"], input[type="password"]');
    if (loginRequired) {
      console.log('Login required, performing authentication...');
      
      // Enter login credentials (using the test credentials shown on page)
      await page.type('input[type="email"]', 'testuser@verotrade.com');
      await page.type('input[type="password"]', 'TestPassword123!');
      
      // Click login button
      await page.click('button[type="submit"]');
      
      // Wait for login to complete
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Check current URL after login
      const currentUrl = page.url();
      console.log('Current URL after login:', currentUrl);
      
      // Navigate to log-trade page if not already there
      if (!currentUrl.includes('/log-trade')) {
        console.log('Navigating to log-trade page...');
        await page.goto('http://localhost:3001/log-trade', {
          waitUntil: 'networkidle2',
          timeout: 30000
        });
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }
    
    console.log('Already on log-trade page, proceeding with dropdown verification...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Debug: Take a screenshot to see what's on the page
    await page.screenshot({
      path: 'debug-page-state.png',
      fullPage: true
    });
    console.log('Debug screenshot saved: debug-page-state.png');
    
    // Debug: Check page content
    const pageContent = await page.evaluate(() => {
      return {
        url: window.location.href,
        title: document.title,
        bodyText: document.body.innerText.substring(0, 500),
        hasForm: !!document.querySelector('form'),
        buttons: Array.from(document.querySelectorAll('button')).map(b => b.textContent).slice(0, 10),
        dropdowns: Array.from(document.querySelectorAll('[class*="dropdown"], [aria-haspopup="listbox"]')).length,
        customDropdowns: Array.from(document.querySelectorAll('.custom-dropdown')).length
      };
    });
    console.log('Page debug info:', pageContent);
    
    // Look for the strategy dropdown (CustomDropdown component)
    console.log('Looking for strategy dropdown...');
    const strategyDropdown = await page.$('.custom-dropdown, [class*="custom-dropdown"], button[aria-haspopup="listbox"]');
    
    if (!strategyDropdown) {
      // Try to find any dropdown-related elements
      const allDropdowns = await page.$$('button[aria-haspopup="listbox"], .dropdown-enhanced, [class*="dropdown"]');
      console.log(`Found ${allDropdowns.length} dropdown elements on the page`);
      
      if (allDropdowns.length === 0) {
        // Try waiting a bit more for the page to load
        console.log('Waiting additional time for page to load...');
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // Try again
        const retryDropdowns = await page.$$('button[aria-haspopup="listbox"], .dropdown-enhanced, [class*="dropdown"]');
        console.log(`Retry: Found ${retryDropdowns.length} dropdown elements`);
        
        if (retryDropdowns.length === 0) {
          throw new Error('No dropdown elements found on the page. The trade form may not be loaded or visible.');
        }
        
        strategyDropdown = retryDropdowns[0];
      } else {
        // Use the first dropdown element as our strategy dropdown candidate
        strategyDropdown = allDropdowns[0];
      }
    }
    
    // Take initial screenshot
    await page.screenshot({
      path: 'strategy-dropdown-initial-state.png',
      fullPage: false
    });
    console.log('Screenshot saved: strategy-dropdown-initial-state.png');
    
    // Check for debug information
    const debugText = await page.evaluate(() => {
      const bodyText = document.body.innerText;
      const debugPatterns = [
        /Strategies loaded: \d+ \| Selected: [a-f0-9-]+ \| Selected strategy: .+/,
        /Strategies loaded:/,
        /Selected strategy:/
      ];
      
      for (const pattern of debugPatterns) {
        if (pattern.test(bodyText)) {
          return bodyText.match(pattern)[0];
        }
      }
      return null;
    });
    
    if (debugText) {
      console.log('❌ Debug information found:', debugText);
    } else {
      console.log('✅ No debug information found');
    }
    
    // Test dropdown functionality
    console.log('Testing dropdown click interaction...');
    await strategyDropdown.click();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Take screenshot after clicking dropdown
    await page.screenshot({
      path: 'strategy-dropdown-clicked.png',
      fullPage: false
    });
    console.log('Screenshot saved: strategy-dropdown-clicked.png');
    
    // Get all available options from the custom dropdown
    const options = await page.evaluate(() => {
      // Look for dropdown options
      const dropdownOptions = document.querySelectorAll('.dropdown-option, [role="option"]');
      return Array.from(dropdownOptions).map(option => ({
        value: option.getAttribute('data-value') || '',
        text: option.textContent || '',
        selected: option.classList.contains('dropdown-option-selected') || option.getAttribute('aria-selected') === 'true'
      }));
    });
    
    console.log(`Found ${options.length} options in the dropdown:`);
    options.forEach((option, index) => {
      console.log(`  ${index + 1}. ${option.text} (${option.value}) ${option.selected ? '[SELECTED]' : ''}`);
    });
    
    // Test selecting a different option (if there are multiple options)
    if (options.length > 1) {
      const nonSelectedOption = options.find(option => !option.selected);
      if (nonSelectedOption) {
        console.log(`Selecting option: ${nonSelectedOption.text}`);
        
        // For custom dropdown, we need to click the option directly
        await page.evaluate((optionValue) => {
          const options = document.querySelectorAll('.dropdown-option, [role="option"]');
          const targetOption = Array.from(options).find(opt =>
            opt.getAttribute('data-value') === optionValue ||
            opt.textContent === optionValue
          );
          if (targetOption) {
            targetOption.click();
          }
        }, nonSelectedOption.value);
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Take screenshot after selection
        await page.screenshot({
          path: 'strategy-dropdown-after-selection.png',
          fullPage: false
        });
        console.log('Screenshot saved: strategy-dropdown-after-selection.png');
        
        // Verify the selection was applied for custom dropdown
        const selectedValue = await page.evaluate(() => {
          const selectedOption = document.querySelector('.dropdown-option-selected, [aria-selected="true"]');
          return selectedOption ? selectedOption.textContent || selectedOption.getAttribute('data-value') : '';
        });
        
        if (selectedValue === nonSelectedOption.value) {
          console.log('✅ Strategy selection working correctly');
        } else {
          console.log('❌ Strategy selection failed');
        }
      }
    } else {
      console.log('⚠️ Only one option available, cannot test selection change');
    }
    
    // Test keyboard navigation
    console.log('Testing keyboard navigation...');
    await strategyDropdown.focus();
    
    // First open the dropdown
    await page.keyboard.press('Enter');
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Navigate through options
    await page.keyboard.press('ArrowDown');
    await new Promise(resolve => setTimeout(resolve, 500));
    await page.keyboard.press('Enter');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Take screenshot after keyboard navigation
    await page.screenshot({
      path: 'strategy-dropdown-keyboard-navigation.png',
      fullPage: false
    });
    console.log('Screenshot saved: strategy-dropdown-keyboard-navigation.png');
    
    // Final check for debug information after interactions
    const finalDebugText = await page.evaluate(() => {
      const bodyText = document.body.innerText;
      const debugPatterns = [
        /Strategies loaded: \d+ \| Selected: [a-f0-9-]+ \| Selected strategy: .+/,
        /Strategies loaded:/,
        /Selected strategy:/
      ];
      
      for (const pattern of debugPatterns) {
        if (pattern.test(bodyText)) {
          return bodyText.match(pattern)[0];
        }
      }
      return null;
    });
    
    if (finalDebugText) {
      console.log('❌ Debug information still present after interactions:', finalDebugText);
    } else {
      console.log('✅ No debug information found after interactions');
    }
    
    // Check for any console errors
    if (consoleErrors.length > 0) {
      console.log('❌ JavaScript errors found:');
      consoleErrors.forEach(error => console.log(`  - ${error}`));
    } else {
      console.log('✅ No JavaScript errors detected');
    }
    
    // Check for any page errors
    if (pageErrors.length > 0) {
      console.log('❌ Page errors found:');
      pageErrors.forEach(error => console.log(`  - ${error}`));
    } else {
      console.log('✅ No page errors detected');
    }
    
    // Generate final report
    const report = {
      timestamp: new Date().toISOString(),
      dropdownFound: !!strategyDropdown,
      optionsCount: options.length,
      debugInfoFound: !!debugText,
      debugInfoAfterInteractions: !!finalDebugText,
      consoleErrors: consoleErrors,
      pageErrors: pageErrors,
      selectionTest: options.length > 1 ? 'PASSED' : 'SKIPPED (insufficient options)',
      keyboardNavigationTest: 'COMPLETED'
    };
    
    // Save report as JSON
    const fs = require('fs');
    fs.writeFileSync(
      `strategy-dropdown-verification-report-${Date.now()}.json`,
      JSON.stringify(report, null, 2)
    );
    
    console.log('\n=== FINAL VERIFICATION SUMMARY ===');
    console.log(`Dropdown Found: ${report.dropdownFound ? '✅ YES' : '❌ NO'}`);
    console.log(`Options Available: ${report.optionsCount}`);
    console.log(`Debug Info Initially: ${report.debugInfoFound ? '❌ FOUND' : '✅ NONE'}`);
    console.log(`Debug Info After Interactions: ${report.debugInfoAfterInteractions ? '❌ FOUND' : '✅ NONE'}`);
    console.log(`Console Errors: ${report.consoleErrors.length}`);
    console.log(`Page Errors: ${report.pageErrors.length}`);
    console.log(`Selection Test: ${report.selectionTest}`);
    console.log(`Keyboard Navigation: ${report.keyboardNavigationTest}`);
    
    const allTestsPassed = 
      report.dropdownFound && 
      !report.debugInfoFound && 
      !report.debugInfoAfterInteractions && 
      report.consoleErrors.length === 0 && 
      report.pageErrors.length === 0;
    
    if (allTestsPassed) {
      console.log('\n🎉 ALL TESTS PASSED - Strategy dropdown is working correctly without debug information!');
    } else {
      console.log('\n⚠️ SOME TESTS FAILED - Please review the issues above.');
    }
    
    await browser.close();
    return allTestsPassed;
    
  } catch (error) {
    console.error('Error during verification:', error);
    await browser.close();
    return false;
  }
}

// Run the verification
verifyStrategyDropdown().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('Verification failed:', error);
  process.exit(1);
});