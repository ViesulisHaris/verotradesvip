const { chromium } = require('playwright');

async function testEmotionFunctionality() {
  console.log('Testing emotion dropdown functionality with all 10 emotions...');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // Navigate to confluence page
    await page.goto('http://localhost:3000/confluence');
    await page.waitForLoadState('networkidle');
    
    // Wait for page to load
    await page.waitForTimeout(3000);
    
    // Test 1: Check if dropdown opens and shows all emotions
    console.log('\n=== TEST 1: Dropdown Visibility ===');
    const dropdownButton = page.locator('.dropdown-enhanced.custom-dropdown');
    await dropdownButton.waitFor({ state: 'visible', timeout: 10000 });
    
    // Click to open dropdown
    await dropdownButton.click();
    await page.waitForTimeout(500);
    
    // Count emotion options
    const emotionOptions = await page.locator('[role="option"]').all();
    console.log(`Found ${emotionOptions.length} emotion options in dropdown`);
    
    // Get text of all options
    const optionTexts = [];
    for (const option of emotionOptions) {
      const text = await option.textContent();
      if (text) {
        optionTexts.push(text.trim());
      }
    }
    
    console.log('Available emotions:', optionTexts);
    
    // Check if all 10 expected emotions are present
    const expectedEmotions = ['FOMO', 'Revenge', 'Tilt', 'Over Risk', 'Patience', 'Regret', 'Discipline', 'Confident', 'Anxious', 'Neutral'];
    const missingEmotions = expectedEmotions.filter(emotion => !optionTexts.includes(emotion));
    
    if (missingEmotions.length === 0) {
      console.log('✅ SUCCESS: All 10 emotions are visible in dropdown');
    } else {
      console.log(`❌ FAILURE: Missing emotions: ${missingEmotions.join(', ')}`);
    }
    
    // Test 2: Select "Discipline" emotion
    console.log('\n=== TEST 2: Select Discipline Emotion ===');
    const disciplineOption = page.locator('[role="option"]:has-text("Discipline")');
    if (await disciplineOption.isVisible()) {
      await disciplineOption.click();
      await page.waitForTimeout(500);
      console.log('✅ SUCCESS: Discipline emotion selected');
      
      // Check if discipline appears as selected pill
      const selectedPills = page.locator('.flex.flex-wrap.gap-1 span');
      const hasDisciplinePill = await selectedPills.filter({ hasText: 'DISCIPLINE' }).count() > 0;
      
      if (hasDisciplinePill) {
        console.log('✅ SUCCESS: Discipline appears as selected pill');
      } else {
        console.log('❌ FAILURE: Discipline does not appear as selected pill');
      }
    } else {
      console.log('❌ FAILURE: Discipline option not found');
    }
    
    // Test 3: Filter functionality with Discipline
    console.log('\n=== TEST 3: Filter with Discipline ===');
    
    // Wait for filtering to apply
    await page.waitForTimeout(1000);
    
    // Check if any trades are filtered
    const tradesTable = page.locator('table tbody tr');
    const tradeCount = await tradesTable.count();
    console.log(`Found ${tradeCount} trades in table`);
    
    if (tradeCount > 0) {
      console.log('✅ SUCCESS: Filtering appears to be working');
      
      // Check if filtered trades actually have discipline emotion
      const firstTrade = tradesTable.first();
      const emotionCell = firstTrade.locator('td').filter({ hasText: /emotional/i }).first();
      
      if (await emotionCell.isVisible()) {
        const emotionText = await emotionCell.textContent();
        console.log(`First trade emotions: ${emotionText}`);
        
        if (emotionText && emotionText.toLowerCase().includes('discipline')) {
          console.log('✅ SUCCESS: Filtered trades contain discipline emotion');
        } else {
          console.log('❌ FAILURE: Filtered trades do not contain discipline emotion');
        }
      }
    } else {
      console.log('ℹ️ INFO: No trades found (may be expected if no trades with discipline exist)');
    }
    
    // Test 4: Check radar chart for discipline
    console.log('\n=== TEST 4: Radar Chart ===');
    const radarChart = page.locator('.recharts-wrapper').first();
    
    if (await radarChart.isVisible()) {
      console.log('✅ SUCCESS: Emotion radar chart is visible');
      
      // Check if radar has data points
      const radarDataPoints = page.locator('.recharts-radar .recharts-radar-dot');
      const dotCount = await radarDataPoints.count();
      console.log(`Radar chart has ${dotCount} data points`);
      
      if (dotCount > 0) {
        console.log('✅ SUCCESS: Radar chart displays emotion data');
      } else {
        console.log('❌ FAILURE: Radar chart has no data points');
      }
    } else {
      console.log('❌ FAILURE: Emotion radar chart not visible');
    }
    
    // Take screenshot for visual verification
    await page.screenshot({ path: 'emotion-functionality-test.png', fullPage: false });
    console.log('\n=== TEST SUMMARY ===');
    console.log(`1. Dropdown emotions: ${emotionOptions.length}/10`);
    console.log(`2. Missing emotions: ${missingEmotions.length}`);
    console.log(`3. Discipline selection: ${hasDisciplinePill ? 'Working' : 'Failed'}`);
    console.log(`4. Filter results: ${tradeCount} trades`);
    console.log(`5. Radar chart: ${await radarChart.isVisible() ? 'Visible' : 'Not visible'}`);
    console.log('Screenshot saved as emotion-functionality-test.png');
    
  } catch (error) {
    console.error('Error during test:', error);
  } finally {
    await browser.close();
  }
}

testEmotionFunctionality();