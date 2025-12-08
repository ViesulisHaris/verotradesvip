const puppeteer = require('puppeteer');

async function testDropdownZIndex() {
  console.log('🔍 Testing dropdown z-index layering fixes...');
  
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    // Navigate to the log-trade page
    await page.goto('http://localhost:3000/log-trade');
    
    // Wait for page to load
    await page.waitForSelector('[data-testid="strategy-dropdown"]', { timeout: 10000 });
    
    console.log('✅ Page loaded successfully');
    
    // Test Strategy Dropdown
    console.log('\n📋 Testing Strategy Dropdown...');
    
    // Click on strategy dropdown to open it
    await page.click('[data-testid="strategy-dropdown"]');
    await page.waitForSelector('[data-testid="strategy-dropdown-menu"]', { visible: true });
    
    // Get the z-index of the dropdown menu
    const strategyDropdownZIndex = await page.evaluate(() => {
      const dropdown = document.querySelector('[data-testid="strategy-dropdown-menu"]');
      if (dropdown) {
        const computedStyle = window.getComputedStyle(dropdown);
        return computedStyle.zIndex;
      }
      return null;
    });
    
    console.log(`Strategy dropdown z-index: ${strategyDropdownZIndex}`);
    
    // Get the z-index of the overlay
    const overlayZIndex = await page.evaluate(() => {
      const overlay = document.querySelector('[data-testid="dropdown-overlay"]');
      if (overlay) {
        const computedStyle = window.getComputedStyle(overlay);
        return computedStyle.zIndex;
      }
      return null;
    });
    
    console.log(`Overlay z-index: ${overlayZIndex}`);
    
    // Check if dropdown is positioned correctly
    const dropdownPosition = await page.evaluate(() => {
      const dropdown = document.querySelector('[data-testid="strategy-dropdown-menu"]');
      const button = document.querySelector('[data-testid="strategy-dropdown"]');
      
      if (dropdown && button) {
        const dropdownRect = dropdown.getBoundingClientRect();
        const buttonRect = button.getBoundingClientRect();
        
        return {
          dropdownVisible: dropdownRect.height > 0,
          dropdownBelowButton: dropdownRect.top >= buttonRect.bottom,
          dropdownAlignedLeft: Math.abs(dropdownRect.left - buttonRect.left) < 10
        };
      }
      return null;
    });
    
    console.log('Dropdown positioning:', dropdownPosition);
    
    // Test Side Dropdown
    console.log('\n📋 Testing Side Dropdown...');
    
    // Close strategy dropdown first
    await page.click('[data-testid="dropdown-overlay"]');
    await page.waitForSelector('[data-testid="strategy-dropdown-menu"]', { hidden: true });
    
    // Click on side dropdown to open it
    await page.click('[data-testid="side-dropdown"]');
    await page.waitForSelector('[data-testid="side-dropdown-menu"]', { visible: true });
    
    // Get the z-index of the side dropdown menu
    const sideDropdownZIndex = await page.evaluate(() => {
      const dropdown = document.querySelector('[data-testid="side-dropdown-menu"]');
      if (dropdown) {
        const computedStyle = window.getComputedStyle(dropdown);
        return computedStyle.zIndex;
      }
      return null;
    });
    
    console.log(`Side dropdown z-index: ${sideDropdownZIndex}`);
    
    // Test Emotional State Dropdown
    console.log('\n📋 Testing Emotional State Dropdown...');
    
    // Close side dropdown first
    await page.click('[data-testid="dropdown-overlay"]');
    await page.waitForSelector('[data-testid="side-dropdown-menu"]', { hidden: true });
    
    // Click on emotion dropdown to open it
    await page.click('[data-testid="emotion-dropdown"]');
    await page.waitForSelector('[data-testid="emotion-dropdown-menu"]', { visible: true });
    
    // Get the z-index of the emotion dropdown menu
    const emotionDropdownZIndex = await page.evaluate(() => {
      const dropdown = document.querySelector('[data-testid="emotion-dropdown-menu"]');
      if (dropdown) {
        const computedStyle = window.getComputedStyle(dropdown);
        return computedStyle.zIndex;
      }
      return null;
    });
    
    console.log(`Emotion dropdown z-index: ${emotionDropdownZIndex}`);
    
    // Test clicking outside to close dropdowns
    console.log('\n📋 Testing click-outside functionality...');
    
    // Check if overlay is present
    const overlayExists = await page.evaluate(() => {
      return !!document.querySelector('[data-testid="dropdown-overlay"]');
    });
    
    console.log(`Overlay exists: ${overlayExists}`);
    
    // Click outside to close dropdown
    await page.click('[data-testid="dropdown-overlay"]');
    
    // Check if dropdown is closed
    const dropdownClosed = await page.evaluate(() => {
      const dropdown = document.querySelector('[data-testid="emotion-dropdown-menu"]');
      return !dropdown || dropdown.offsetParent === null;
    });
    
    console.log(`Dropdown closed after clicking outside: ${dropdownClosed}`);
    
    // Final validation
    console.log('\n🎯 Final Validation Results:');
    console.log(`✅ All dropdowns have z-index: ${strategyDropdownZIndex === sideDropdownZIndex && sideDropdownZIndex === emotionDropdownZIndex ? 'CONSISTENT' : 'INCONSISTENT'}`);
    console.log(`✅ Dropdowns have higher z-index than overlay: ${parseInt(strategyDropdownZIndex) > parseInt(overlayZIndex) ? 'YES' : 'NO'}`);
    console.log(`✅ Click-outside functionality works: ${dropdownClosed ? 'YES' : 'NO'}`);
    
    // Take screenshot for visual verification
    await page.screenshot({ path: 'dropdown-zindex-test.png', fullPage: true });
    console.log('\n📸 Screenshot saved as dropdown-zindex-test.png');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

// Run the test
testDropdownZIndex().then(() => {
  console.log('\n🏁 Dropdown z-index test completed');
}).catch(error => {
  console.error('❌ Test execution failed:', error);
});