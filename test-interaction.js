/**
 * Test Interaction Functionality
 * This test checks if the interactive elements on the dashboard are actually working
 */

const { chromium } = require('playwright');

async function testInteraction() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('🔍 Testing Interaction Functionality...\n');

  try {
    // Navigate to dashboard
    await page.goto('http://localhost:3000/dashboard');
    
    // Wait for page to be ready
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    console.log('✅ Dashboard loaded successfully');

    // Get all interactive elements
    const interactiveElements = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button:not([disabled])'));
      const links = Array.from(document.querySelectorAll('a[href]:not([href^="javascript"])'));
      const inputs = Array.from(document.querySelectorAll('input:not([disabled])'));
      
      return {
        buttons: buttons.map(btn => ({
          text: btn.textContent?.trim() || '',
          ariaLabel: btn.getAttribute('aria-label') || '',
          hasClickHandler: btn.onclick !== null || btn.hasAttribute('onclick'),
          tagName: btn.tagName
        })),
        links: links.map(link => ({
          text: link.textContent?.trim() || '',
          href: link.getAttribute('href') || '',
          tagName: link.tagName
        })),
        inputs: inputs.map(input => ({
          type: input.type,
          name: input.name,
          tagName: input.tagName
        }))
      };
    });
    
    console.log('\n🖱️ Interactive Elements Found:');
    console.log('='.repeat(50));
    console.log(`Buttons: ${interactiveElements.buttons.length}`);
    console.log(`Links: ${interactiveElements.links.length}`);
    console.log(`Inputs: ${interactiveElements.inputs.length}`);
    
    // Test button clicks
    console.log('\n🧪 Testing Button Clicks:');
    for (let i = 0; i < interactiveElements.buttons.length; i++) {
      const button = interactiveElements.buttons[i];
      console.log(`\nTesting button ${i+1}: "${button.text || button.ariaLabel}"`);
      
      try {
        // Click the button
        await page.click('button', { timeout: 5000 });
        await page.waitForTimeout(1000);
        
        // Check if anything happened
        const afterClickState = await page.evaluate(() => {
          return {
            url: window.location.href,
            hasModal: document.querySelector('[role="dialog"], .modal, [class*="modal"]') !== null,
            hasMenu: document.querySelector('[role="navigation"], nav, aside') !== null,
            bodyClasses: document.body.className
          };
        });
        
        console.log(`  - Click successful`);
        console.log(`  - URL after click: ${afterClickState.url}`);
        console.log(`  - Has modal/menu: ${afterClickState.hasModal || afterClickState.hasMenu}`);
        
        // If modal or menu opened, try to close it
        if (afterClickState.hasModal) {
          console.log('  - Closing modal...');
          await page.keyboard.press('Escape');
          await page.waitForTimeout(1000);
        }
        
        if (afterClickState.hasMenu) {
          console.log('  - Closing menu...');
          const closeButton = await page.locator('button[aria-label*="Close"], button[aria-label*="cancel"]').first();
          if (await closeButton.isVisible()) {
            await closeButton.click();
            await page.waitForTimeout(1000);
          } else {
            await page.keyboard.press('Escape');
            await page.waitForTimeout(1000);
          }
        }
        
      } catch (error) {
        console.log(`  - Click failed: ${error.message}`);
      }
    }
    
    // Test link navigation
    console.log('\n🔗 Testing Link Navigation:');
    for (let i = 0; i < Math.min(2, interactiveElements.links.length); i++) {
      const link = interactiveElements.links[i];
      if (link.href && !link.href.startsWith('http') && !link.href.includes('#')) {
        console.log(`\nTesting link ${i+1}: "${link.text}" -> ${link.href}`);
        
        try {
          const beforeUrl = page.url();
          
          // Click the link
          await Promise.all([
            page.waitForNavigation({ timeout: 5000 }),
            page.click(`a[href="${link.href}"]`)
          ]);
          
          const afterUrl = page.url();
          console.log(`  - Navigation successful`);
          console.log(`  - From: ${beforeUrl}`);
          console.log(`  - To: ${afterUrl}`);
          
          // Go back to dashboard
          await page.goto('http://localhost:3000/dashboard');
          await page.waitForLoadState('networkidle');
          await page.waitForTimeout(1000);
          
        } catch (error) {
          console.log(`  - Navigation failed: ${error.message}`);
        }
      }
    }
    
    // Test input interaction
    console.log('\n📝 Testing Input Interaction:');
    for (let i = 0; i < Math.min(2, interactiveElements.inputs.length); i++) {
      const input = interactiveElements.inputs[i];
      console.log(`\nTesting input ${i+1}: ${input.type} (${input.name})`);
      
      try {
        // Focus the input
        await page.focus(`input[name="${input.name}"], input[type="${input.type}"]`);
        await page.waitForTimeout(500);
        
        // Type some text if it's a text input
        if (input.type === 'text' || input.type === 'email' || input.type === 'password') {
          await page.keyboard.type('test input', { delay: 100 });
          await page.waitForTimeout(500);
          
          // Check if value was entered
          const value = await page.inputValue(`input[name="${input.name}"], input[type="${input.type}"]`);
          console.log(`  - Text input successful: "${value}"`);
          
          // Clear the input
          await page.click(`input[name="${input.name}"], input[type="${input.type}"]`, { clickCount: 3 });
          await page.keyboard.press('Control+A');
          await page.keyboard.press('Backspace');
          await page.waitForTimeout(500);
        } else {
          // For other input types, just press space
          await page.keyboard.press('Space');
          await page.waitForTimeout(500);
          console.log(`  - Input interaction successful`);
        }
        
      } catch (error) {
        console.log(`  - Input interaction failed: ${error.message}`);
      }
    }
    
    // Check for any console errors during interaction
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
        console.log(`❌ Console error during interaction: ${msg.text()}`);
      }
    });
    
    await page.waitForTimeout(2000);
    
    console.log('\n📋 Console Errors Summary:');
    if (consoleErrors.length === 0) {
      console.log('✅ No console errors during interaction');
    } else {
      console.log(`❌ Found ${consoleErrors.length} console errors during interaction`);
    }
    
    // Take screenshot
    await page.screenshot({ path: 'interaction-test.png', fullPage: true });
    console.log('\n📸 Screenshot saved as: interaction-test.png');
    
    console.log('\n' + '='.repeat(50));
    console.log('✅ Interaction Test Completed');
    console.log('='.repeat(50));
    
    return consoleErrors.length === 0;

  } catch (error) {
    console.error('❌ Test failed with error:', error);
    return false;
  } finally {
    await browser.close();
  }
}

// Run the test
testInteraction()
  .then(success => {
    console.log(`\n🎯 Interaction Test ${success ? 'PASSED' : 'FAILED'}`);
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('💥 Test execution failed:', error);
    process.exit(1);
  });