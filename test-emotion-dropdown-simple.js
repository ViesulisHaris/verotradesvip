const { chromium } = require('playwright');

async function testEmotionDropdown() {
  console.log('Testing emotion dropdown height and scrollbar functionality...');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // Navigate to the test page
    await page.goto('http://localhost:3000/test-emotion-dropdown');
    await page.waitForLoadState('networkidle');
    
    // Wait for page to load
    await page.waitForTimeout(2000);
    
    // Try to find the dropdown button by class
    const dropdownButton = page.locator('.dropdown-enhanced.custom-dropdown');
    await dropdownButton.waitFor({ state: 'visible', timeout: 10000 });
    
    console.log('Found dropdown button, clicking to open...');
    await dropdownButton.click();
    await page.waitForTimeout(1000); // Wait for dropdown to open
    
    // Get all emotion options
    const emotionOptions = await page.locator('[role="option"]').all();
    console.log(`Found ${emotionOptions.length} emotion options`);
    
    // Check if all 10 emotions are visible
    const expectedEmotions = [
      'FOMO', 'Revenge', 'Tilt', 'Over Risk', 'Patience', 
      'Regret', 'Discipline', 'Confident', 'Anxious', 'Neutral'
    ];
    
    const visibleEmotions = [];
    for (const option of emotionOptions) {
      const text = await option.textContent();
      const isVisible = await option.isVisible();
      if (isVisible && text) {
        visibleEmotions.push(text.trim());
      }
    }
    
    console.log('Visible emotions:', visibleEmotions);
    
    // Check if all expected emotions are present
    const missingEmotions = expectedEmotions.filter(emotion => !visibleEmotions.includes(emotion));
    
    if (missingEmotions.length === 0) {
      console.log('✅ SUCCESS: All 10 emotions are visible in the dropdown');
    } else {
      console.log(`❌ FAILURE: Missing emotions: ${missingEmotions.join(', ')}`);
    }
    
    // Test scrollbar functionality
    const dropdownContainer = page.locator('.dropdown-options-container');
    const scrollHeight = await dropdownContainer.evaluate(el => el.scrollHeight);
    const clientHeight = await dropdownContainer.evaluate(el => el.clientHeight);
    
    console.log(`Dropdown container height: ${clientHeight}px`);
    console.log(`Dropdown scroll height: ${scrollHeight}px`);
    
    if (scrollHeight > clientHeight) {
      console.log('✅ SUCCESS: Dropdown has scrollable content (scrollbar should be visible)');
    } else {
      console.log('ℹ️ INFO: Dropdown fits within container height (no scrollbar needed)');
    }
    
    // Take a screenshot for visual verification
    await page.screenshot({ path: 'emotion-dropdown-test.png', fullPage: false });
    console.log('Screenshot saved as emotion-dropdown-test.png');
    
    console.log('\n=== TEST SUMMARY ===');
    console.log(`Total emotions found: ${emotionOptions.length}`);
    console.log(`Expected emotions: ${expectedEmotions.length}`);
    console.log(`Missing emotions: ${missingEmotions.length}`);
    console.log(`Dropdown height: ${clientHeight}px`);
    console.log(`Scrollable: ${scrollHeight > clientHeight ? 'Yes' : 'No'}`);
    
  } catch (error) {
    console.error('Error during test:', error);
  } finally {
    await browser.close();
  }
}

testEmotionDropdown();