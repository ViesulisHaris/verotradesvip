// Test script to verify React key duplication fix in confluence page
const puppeteer = require('puppeteer');

async function testReactKeyFix() {
  console.log('🔍 Testing React key duplication fix in confluence page...');
  
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  
  // Capture console warnings and errors
  const consoleMessages = [];
  page.on('console', msg => {
    consoleMessages.push({
      type: msg.type(),
      text: msg.text()
    });
    if (msg.type() === 'warning') {
      console.log(`⚠️ Console Warning: ${msg.text()}`);
    }
    if (msg.type() === 'error') {
      console.log(`🚨 Console Error: ${msg.text()}`);
    }
  });
  
  try {
    // Navigate to the confluence page (assuming user is already authenticated)
    console.log('📍 Navigating to confluence page...');
    await page.goto('http://localhost:3000/confluence', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    // Wait for the page to load and for any React warnings to appear
    await page.waitForTimeout(5000);
    
    // Check for React key duplication warnings
    const keyWarnings = consoleMessages.filter(msg => 
      msg.type === 'warning' && 
      msg.text.includes('key') && 
      (msg.text.includes('duplicate') || msg.text.includes('unique'))
    );
    
    console.log('\n📊 Test Results:');
    console.log(`Total console messages: ${consoleMessages.length}`);
    console.log(`React key warnings found: ${keyWarnings.length}`);
    
    if (keyWarnings.length === 0) {
      console.log('✅ SUCCESS: No React key duplication warnings found!');
      console.log('✅ The fix has resolved the React key duplication issue.');
    } else {
      console.log('❌ FAILURE: React key duplication warnings still present:');
      keyWarnings.forEach(warning => {
        console.log(`   - ${warning.text}`);
      });
    }
    
    // Take a screenshot for visual verification
    await page.screenshot({ 
      path: 'verotradesvip/confluence-page-after-key-fix.png',
      fullPage: true 
    });
    console.log('📸 Screenshot saved: confluence-page-after-key-fix.png');
    
  } catch (error) {
    console.error('🚨 Test failed with error:', error);
  } finally {
    await browser.close();
  }
}

// Run the test
testReactKeyFix().then(() => {
  console.log('🏁 React key fix test completed.');
}).catch(error => {
  console.error('💥 Test execution failed:', error);
});