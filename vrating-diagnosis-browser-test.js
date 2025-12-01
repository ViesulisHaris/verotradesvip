const puppeteer = require('puppeteer');
const fs = require('fs');

console.log('🔍 VRATING DIAGNOSIS BROWSER TEST');
console.log('==================================');

async function runBrowserDiagnosis() {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    console.log('\n🌐 Navigating to app...');
    await page.goto('http://localhost:3001/login');
    
    // Wait for login page
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    
    console.log('🔐 Logging in...');
    await page.type('input[type="email"]', 'testuser@verotrade.com');
    await page.type('input[type="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');
    
    // Wait for dashboard
    await page.waitForSelector('[data-testid="vrating-card"], .vrating-card, h2:has-text("VRating")', { timeout: 15000 });
    await page.waitForTimeout(2000);
    
    console.log('✅ Logged in successfully');
    
    // Navigate to analytics page to see VRating calculation
    console.log('\n📊 Navigating to analytics...');
    await page.goto('http://localhost:3001/analytics');
    await page.waitForTimeout(3000);
    
    // Check if we can see VRating information
    const vratingElements = await page.$$('text=/VRating|vrating|VRating Score/i');
    
    if (vratingElements.length > 0) {
      console.log('✅ Found VRating elements on analytics page');
    } else {
      console.log('⚠️  No VRating elements found on analytics page');
    }
    
    // Take screenshot for visual verification
    await page.screenshot({ 
      path: 'vrating-diagnosis-screenshot.png', 
      fullPage: true 
    });
    console.log('📸 Screenshot saved as vrating-diagnosis-screenshot.png');
    
    // Try to extract console logs from browser
    const consoleMessages = [];
    page.on('console', msg => {
      if (msg.text().includes('VRATING_DEBUG')) {
        consoleMessages.push(msg.text());
      }
    });
    
    // Refresh page to trigger VRating calculations
    await page.reload();
    await page.waitForTimeout(5000);
    
    // Print captured debug messages
    if (consoleMessages.length > 0) {
      console.log('\n🔍 Captured VRating Debug Messages:');
      console.log('=====================================');
      consoleMessages.forEach(msg => console.log(msg));
    } else {
      console.log('\n⚠️  No VRating debug messages captured');
      console.log('   This might mean:');
      console.log('   1. VRating calculations are not being triggered');
      console.log('   2. Debug logs are not being output');
      console.log('   3. Page is not loading the updated calculation logic');
    }
    
    console.log('\n📋 Manual Diagnosis Steps:');
    console.log('==========================');
    console.log('1. Check the screenshot for VRating display');
    console.log('2. Look in browser console (F12) for VRATING_DEBUG messages');
    console.log('3. Compare displayed scores with expected values');
    console.log('4. Verify if risk management score is unusually low');
    
  } catch (error) {
    console.error('❌ Error during browser diagnosis:', error.message);
  } finally {
    await browser.close();
  }
}

// Check if development server is running
async function checkServer() {
  try {
    const response = await fetch('http://localhost:3001');
    return response.ok;
  } catch (error) {
    return false;
  }
}

// Main execution
async function main() {
  console.log('🔍 Checking if development server is running...');
  
  const serverRunning = await checkServer();
  if (!serverRunning) {
    console.log('❌ Development server is not running on http://localhost:3001');
    console.log('Please start it with: cd verotradesvip && npm run dev:3001');
    process.exit(1);
  }
  
  console.log('✅ Development server is running');
  await runBrowserDiagnosis();
}

main().catch(error => {
  console.error('❌ Fatal error:', error.message);
  process.exit(1);
});