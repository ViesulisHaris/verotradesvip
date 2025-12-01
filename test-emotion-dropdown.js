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
    
    // Click on the dropdown to open it
    await page.click('[aria-labelledby="emotion-dropdown-button"]');
    await page.waitForTimeout(500); // Wait for dropdown to open
    
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
    
    // Test selecting emotions
    console.log('\nTesting emotion selection...');
    await page.click('[role="option"]:has-text("FOMO")');
    await page.waitForTimeout(200);
    await page.click('[role="option"]:has-text("Patience")');
    await page.waitForTimeout(200);
    await page.click('[role="option"]:has-text("Neutral")');
    await page.waitForTimeout(200);
    
    // Check selected emotions
    const selectedEmotions = await page.locator('.flex.flex-wrap.gap-1 span').all();
    const selectedTexts = [];
    for (const emotion of selectedEmotions) {
      const text = await emotion.textContent();
      if (text && !text.includes('×')) {
        selectedTexts.push(text.trim());
      }
    }
    
    console.log('Selected emotions:', selectedTexts);
    
    if (selectedTexts.includes('FOMO') && selectedTexts.includes('Patience') && selectedTexts.includes('NEUTRAL')) {
      console.log('✅ SUCCESS: Emotion selection works correctly');
    } else {
      console.log('❌ FAILURE: Emotion selection is not working properly');
    }
    
    // Test removing emotions
    console.log('\nTesting emotion removal...');
    await page.click('.flex.flex-wrap.gap-1 span:has-text("FOMO") button');
    await page.waitForTimeout(200);
    
    const remainingEmotions = await page.locator('.flex.flex-wrap.gap-1 span').all();
    const remainingTexts = [];
    for (const emotion of remainingEmotions) {
      const text = await emotion.textContent();
      if (text && !text.includes('×')) {
        remainingTexts.push(text.trim());
      }
    }
    
    console.log('Remaining emotions after removal:', remainingTexts);
    
    if (!remainingTexts.includes('FOMO') && remainingTexts.includes('Patience') && remainingTexts.includes('NEUTRAL')) {
      console.log('✅ SUCCESS: Emotion removal works correctly');
    } else {
      console.log('❌ FAILURE: Emotion removal is not working properly');
    }
    
    console.log('\n=== TEST SUMMARY ===');
    console.log(`Total emotions found: ${emotionOptions.length}`);
    console.log(`Expected emotions: ${expectedEmotions.length}`);
    console.log(`Missing emotions: ${missingEmotions.length}`);
    console.log(`Dropdown height: ${clientHeight}px`);
    console.log(`Scrollable: ${scrollHeight > clientHeight ? 'Yes' : 'No'}`);
    
    // Take a screenshot for visual verification
    await page.screenshot({ path: 'emotion-dropdown-test.png', fullPage: false });
    console.log('Screenshot saved as emotion-dropdown-test.png');
    
  } catch (error) {
    console.error('Error during test:', error);
  } finally {
    await browser.close();
  }
}

testEmotionDropdown();