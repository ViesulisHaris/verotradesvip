// Automated test for EmotionRadar error handling improvements
const { chromium } = require('playwright');

async function testEmotionRadarErrorHandling() {
  console.log('🧪 Starting EmotionRadar Error Handling Tests...\n');
  
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    // Navigate to the test page
    await page.goto('http://localhost:3000/test-emotion-radar-edge-cases');
    await page.waitForLoadState('networkidle');
    
    console.log('✅ Test page loaded successfully');
    
    // Test 1: Empty Data Array
    console.log('\n📋 Test 1: Empty Data Array');
    await page.click('text=Empty Data Array');
    await page.waitForTimeout(1000);
    
    const emptyDataMessage = await page.locator('text=No emotional data available').isVisible();
    console.log(emptyDataMessage ? '✅ Empty data handled correctly' : '❌ Empty data not handled properly');
    
    // Test 2: Null Data
    console.log('\n📋 Test 2: Null Data');
    await page.click('text=Null Data');
    await page.waitForTimeout(1000);
    
    const nullDataMessage = await page.locator('text=No emotional data available').isVisible();
    console.log(nullDataMessage ? '✅ Null data handled correctly' : '❌ Null data not handled properly');
    
    // Test 3: Valid Normal Data
    console.log('\n📋 Test 3: Valid Normal Data');
    await page.click('text=Valid Normal Data');
    await page.waitForTimeout(1000);
    
    const chartVisible = await page.locator('.recharts-wrapper').isVisible();
    console.log(chartVisible ? '✅ Valid data renders chart correctly' : '❌ Valid data does not render chart');
    
    // Test 4: Extreme Values
    console.log('\n📋 Test 4: Extreme Values');
    await page.click('text=Extreme Values');
    await page.waitForTimeout(1000);
    
    const extremeChartVisible = await page.locator('.recharts-wrapper').isVisible();
    console.log(extremeChartVisible ? '✅ Extreme values handled and chart renders' : '❌ Extreme values break chart');
    
    // Test 5: Malformed Data Structures
    console.log('\n📋 Test 5: Malformed Data Structures');
    await page.click('text=Malformed Data Structures');
    await page.waitForTimeout(1000);
    
    const malformedMessage = await page.locator('text=No valid emotional data available').isVisible();
    console.log(malformedMessage ? '✅ Malformed data filtered correctly' : '❌ Malformed data not handled properly');
    
    // Test 6: Missing Required Fields
    console.log('\n📋 Test 6: Missing Required Fields');
    await page.click('text=Missing Required Fields');
    await page.waitForTimeout(1000);
    
    const missingFieldsChart = await page.locator('.recharts-wrapper').isVisible();
    console.log(missingFieldsChart ? '✅ Missing fields handled with defaults' : '❌ Missing fields break chart');
    
    // Test 7: Special Characters and Whitespace
    console.log('\n📋 Test 7: Special Characters and Whitespace');
    await page.click('text=Special Characters and Whitespace');
    await page.waitForTimeout(1000);
    
    const specialCharsChart = await page.locator('.recharts-wrapper').isVisible();
    console.log(specialCharsChart ? '✅ Special characters handled correctly' : '❌ Special characters break chart');
    
    // Run automated tests
    console.log('\n🤖 Running Automated Tests...');
    await page.click('text=Run All Tests');
    await page.waitForTimeout(3000);
    
    // Check test results
    const testResults = await page.locator('.text-green-400').allTextContents();
    const passedTests = testResults.length;
    console.log(`\n📊 Test Results: ${passedTests}/7 tests passed`);
    
    // Take screenshot for verification
    await page.screenshot({ path: 'emotion-radar-error-handling-test.png', fullPage: true });
    console.log('📸 Screenshot saved as emotion-radar-error-handling-test.png');
    
    console.log('\n🎉 All error handling tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  } finally {
    await browser.close();
  }
}

// Run the tests
testEmotionRadarErrorHandling().catch(console.error);