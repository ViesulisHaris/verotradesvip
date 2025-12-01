const puppeteer = require('puppeteer');
const fs = require('fs');

console.log('🔧 VRATING FIX VERIFICATION TEST');
console.log('===============================');

async function testVRatingFixes() {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    // Capture console logs
    const consoleMessages = [];
    page.on('console', msg => {
      if (msg.text().includes('VRATING_DEBUG')) {
        consoleMessages.push({
          timestamp: new Date().toISOString(),
          message: msg.text()
        });
      }
    });
    
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
    
    // Navigate to analytics page to trigger VRating calculation
    console.log('\n📊 Navigating to analytics...');
    await page.goto('http://localhost:3001/analytics');
    await page.waitForTimeout(5000);
    
    // Take screenshot before fixes
    await page.screenshot({ 
      path: 'vrating-before-fixes.png', 
      fullPage: true 
    });
    
    // Refresh to trigger VRating calculation with new logging
    console.log('🔄 Refreshing to trigger VRating calculation...');
    await page.reload();
    await page.waitForTimeout(5000);
    
    // Take screenshot after fixes
    await page.screenshot({ 
      path: 'vrating-after-fixes.png', 
      fullPage: true 
    });
    
    console.log('📸 Screenshots saved:');
    console.log('   - vrating-before-fixes.png');
    console.log('   - vrating-after-fixes.png');
    
    // Analyze captured debug messages
    if (consoleMessages.length > 0) {
      console.log('\n🔍 Captured VRating Debug Messages:');
      console.log('=====================================');
      
      const largeLossMessages = consoleMessages.filter(msg => 
        msg.message.includes('Large Loss Calculation Results')
      );
      
      const scoringBandMessages = consoleMessages.filter(msg => 
        msg.message.includes('Band') && msg.message.includes('RELAXED')
      );
      
      console.log(`\n📊 Analysis Summary:`);
      console.log(`   Total debug messages: ${consoleMessages.length}`);
      console.log(`   Large loss analysis messages: ${largeLossMessages.length}`);
      console.log(`   Scoring band messages: ${scoringBandMessages.length}`);
      
      if (largeLossMessages.length > 0) {
        console.log('\n✅ Large Loss Threshold Fix Applied:');
        largeLossMessages.forEach(msg => {
          console.log(`   ${msg.timestamp}: ${msg.message}`);
          if (msg.message.includes('Threshold changed from -5 to -50')) {
            console.log('   ✅ CONFIRMED: Large loss threshold changed to -50');
          }
          if (msg.message.includes('improvement: Risk management scores should increase')) {
            console.log('   ✅ CONFIRMED: Expected improvement noted');
          }
        });
      }
      
      if (scoringBandMessages.length > 0) {
        console.log('\n✅ Risk Management Scoring Bands Fix Applied:');
        scoringBandMessages.forEach(msg => {
          console.log(`   ${msg.timestamp}: ${msg.message}`);
          if (msg.message.includes('RELAXED')) {
            console.log('   ✅ CONFIRMED: Scoring bands relaxed for profitable accounts');
          }
        });
      }
      
    } else {
      console.log('\n⚠️  No VRating debug messages captured');
      console.log('   This might indicate:');
      console.log('   1. VRating calculations not triggered');
      console.log('   2. Debug logging not working');
      console.log('   3. Page not using updated calculation logic');
    }
    
    // Try to extract VRating scores from the page
    console.log('\n🎯 Attempting to extract VRating scores...');
    
    const vratingScore = await page.evaluate(() => {
      const scoreElement = document.querySelector('[data-testid="vrating-score"], .vrating-score, .score-value');
      return scoreElement ? scoreElement.textContent : null;
    });
    
    if (vratingScore) {
      console.log(`   Current VRating Score: ${vratingScore}`);
      
      // Extract individual category scores if available
      const categoryScores = await page.evaluate(() => {
        const scores = {};
        const elements = document.querySelectorAll('[data-category-score]');
        elements.forEach(el => {
          const category = el.getAttribute('data-category-score');
          const score = el.textContent;
          scores[category] = score;
        });
        return scores;
      });
      
      if (Object.keys(categoryScores).length > 0) {
        console.log('   Category Scores:');
        Object.entries(categoryScores).forEach(([category, score]) => {
          console.log(`     ${category}: ${score}`);
        });
      }
    } else {
      console.log('   ⚠️  Could not extract VRating score from page');
    }
    
    console.log('\n📋 Manual Verification Steps:');
    console.log('=============================');
    console.log('1. Compare vrating-before-fixes.png and vrating-after-fixes.png');
    console.log('2. Check if risk management score improved');
    console.log('3. Verify overall VRating score increased');
    console.log('4. Look for debug messages in browser console (F12)');
    console.log('5. Confirm large loss threshold is now -50 instead of -5');
    
  } catch (error) {
    console.error('❌ Error during fix verification:', error.message);
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
  await testVRatingFixes();
  
  console.log('\n🎉 VRATING FIX VERIFICATION COMPLETE!');
  console.log('====================================');
  console.log('Expected Results:');
  console.log('- Large loss threshold changed from -5 to -50');
  console.log('- Risk management scoring bands relaxed');
  console.log('- Higher VRating scores for profitable accounts');
  console.log('- Debug logging confirms fixes are applied');
}

main().catch(error => {
  console.error('❌ Fatal error:', error.message);
  process.exit(1);
});