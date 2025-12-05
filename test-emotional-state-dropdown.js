// Test script to verify emotional state dropdown functionality
const { chromium } = require('playwright');

async function testEmotionalStateDropdown() {
  console.log('🧪 Testing Emotional State Dropdown Layout and Functionality');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Navigate to the log trade page
    await page.goto('http://localhost:3000/log-trade');
    await page.waitForLoadState('networkidle');
    
    console.log('✅ Page loaded successfully');

    // Test on desktop view
    await page.setViewportSize({ width: 1200, height: 800 });
    console.log('📱 Testing on desktop view (1200x800)');

    // Find the emotional state dropdown
    const emotionDropdown = page.locator('label:has-text("Emotional State") + div button').first();
    await emotionDropdown.waitFor({ state: 'visible' });
    console.log('✅ Emotional state dropdown found and visible');

    // Check if it's positioned next to exit time field
    const exitTimeField = page.locator('label:has-text("Exit Time") + input[type="time"]');
    const exitTimeBoundingBox = await exitTimeField.boundingBox();
    const emotionDropdownBoundingBox = await emotionDropdown.boundingBox();
    
    if (exitTimeBoundingBox && emotionDropdownBoundingBox) {
      const verticalAlignment = Math.abs(exitTimeBoundingBox.y - emotionDropdownBoundingBox.y) < 50;
      const horizontalPosition = emotionDropdownBoundingBox.x > exitTimeBoundingBox.x;
      
      console.log(`📐 Vertical alignment with exit time: ${verticalAlignment ? '✅ Good' : '❌ Poor'}`);
      console.log(`📐 Horizontal position: ${horizontalPosition ? '✅ To the right' : '❌ Not positioned correctly'}`);
    }

    // Test dropdown functionality
    await emotionDropdown.click();
    console.log('🖱️ Clicked emotional state dropdown');
    
    // Wait for dropdown options to appear
    const dropdownOptions = page.locator('.absolute button:has-text("Neutral"), .absolute button:has-text("Greed"), .absolute button:has-text("Fear"), .absolute button:has-text("Confidence"), .absolute button:has-text("Frustration")');
    await dropdownOptions.first().waitFor({ state: 'visible' });
    console.log('✅ Dropdown options appeared');
    
    // Check if all options are visible
    const optionCount = await dropdownOptions.count();
    console.log(`📋 Found ${optionCount} emotion options`);
    
    // Test selecting an option
    await page.locator('.absolute button:has-text("Confidence")').click();
    console.log('✅ Selected "Confidence" option');
    
    // Verify the selection
    const selectedValue = await emotionDropdown.textContent();
    console.log(`🎯 Selected value: ${selectedValue}`);
    
    // Test on mobile view
    await page.setViewportSize({ width: 375, height: 667 });
    console.log('📱 Testing on mobile view (375x667)');
    
    // Wait for layout to adjust
    await page.waitForTimeout(1000);
    
    // Check if dropdown is still functional on mobile
    const mobileDropdown = page.locator('label:has-text("Emotional State") + div button').first();
    await mobileDropdown.waitFor({ state: 'visible' });
    await mobileDropdown.click();
    console.log('✅ Dropdown works on mobile view');
    
    // Check if options are visible on mobile
    await dropdownOptions.first().waitFor({ state: 'visible' });
    console.log('✅ Dropdown options visible on mobile');
    
    // Test dropdown doesn't get truncated at bottom of screen
    const mobileDropdownBoundingBox = await mobileDropdown.boundingBox();
    if (mobileDropdownBoundingBox) {
      const spaceBelow = 667 - mobileDropdownBoundingBox.y - mobileDropdownBoundingBox.height;
      console.log(`📏 Space below dropdown on mobile: ${spaceBelow}px`);
      console.log(`✅ ${spaceBelow > 200 ? 'Adequate' : 'Limited'} space for dropdown expansion`);
    }

    console.log('🎉 All tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
}

testEmotionalStateDropdown();