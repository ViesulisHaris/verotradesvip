// Test script to verify P&L display fix in Recent Trades table
// This script checks that P&L values are displayed as raw numbers without % symbols

const { chromium } = require('playwright');

async function testPnLDisplayFix() {
  console.log('🔍 Testing P&L Display Fix in Recent Trades Table...');
  
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    // Navigate to the dashboard
    await page.goto('http://localhost:3000/dashboard');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Check if we need to login
    const loginButton = await page.locator('button:has-text("Sign In")').first();
    if (await loginButton.isVisible()) {
      console.log('📝 Login required, please login manually to continue the test');
      await page.waitForTimeout(5000);
    }
    
    // Wait for the Recent Trades table to load
    await page.waitForSelector('table', { timeout: 10000 });
    
    // Check for P&L values in the Return column
    const returnCells = await page.locator('table td:nth-child(6)').all();
    
    if (returnCells.length === 0) {
      console.log('❌ No Return cells found in the table');
      return false;
    }
    
    console.log(`📊 Found ${returnCells.length} trades in the Recent Trades table`);
    
    let hasPercentageSymbols = false;
    let validPnLValues = 0;
    
    for (let i = 0; i < Math.min(returnCells.length, 5); i++) {
      const cellText = await returnCells[i].textContent();
      console.log(`📈 Trade ${i + 1} P&L display: "${cellText}"`);
      
      // Check if the text contains a % symbol
      if (cellText && cellText.includes('%')) {
        hasPercentageSymbols = true;
        console.log(`❌ Trade ${i + 1} still shows percentage symbol: ${cellText}`);
      } else {
        validPnLValues++;
        console.log(`✅ Trade ${i + 1} correctly shows raw P&L value: ${cellText}`);
      }
    }
    
    // Test result
    if (hasPercentageSymbols) {
      console.log('❌ FAILED: Some P&L values still contain percentage symbols');
      return false;
    } else if (validPnLValues > 0) {
      console.log('✅ SUCCESS: All P&L values now display as raw numbers without % symbols');
      return true;
    } else {
      console.log('⚠️  WARNING: No P&L values found to verify');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Error during test:', error.message);
    return false;
  } finally {
    await browser.close();
  }
}

// Run the test
testPnLDisplayFix().then(success => {
  process.exit(success ? 0 : 1);
});