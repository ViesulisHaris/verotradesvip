const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// Test configuration
const BASE_URL = 'http://localhost:3000';
const SCREENSHOT_DIR = path.join(__dirname, 'test-screenshots');

// Create screenshot directory if it doesn't exist
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

// Test data
const testTrade = {
  symbol: 'TEST',
  market: 'Stock',
  side: 'Buy',
  quantity: 100,
  entryPrice: 50.00,
  exitPrice: 55.00,
  tradeDate: new Date().toISOString().split('T')[0],
  emotionalState: ['FOMO', 'CONFIDENT'],
  strategy: 'Test Strategy',
  notes: 'Test trade for emotional analysis verification'
};

// Utility functions
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function timestamp() {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

async function takeScreenshot(page, name) {
  const filename = `${timestamp()}-${name}.png`;
  const filepath = path.join(SCREENSHOT_DIR, filename);
  await page.screenshot({ path: filepath, fullPage: true });
  console.log(`📸 Screenshot saved: ${filename}`);
  return filepath;
}

async function main() {
  console.log('🚀 Starting Manual Emotional Analysis Test...');
  console.log('=' .repeat(60));
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();
  
  try {
    // Step 1: Navigate to dashboard and capture initial state
    console.log('📊 Step 1: Capturing initial dashboard emotional state...');
    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForLoadState('networkidle');
    await delay(3000); // Allow charts to render
    
    // Monitor console for emotion data
    const dashboardEmotionData = await page.evaluate(() => {
      return new Promise((resolve) => {
        const emotionData = [];
        const originalLog = console.log;
        
        console.log = (...args) => {
          originalLog.apply(console, args);
          
          const logMessage = args.join(' ');
          if (logMessage.includes('DASHBOARD EMOTION DEBUG') && logMessage.includes('Emotion data result')) {
            try {
              const match = logMessage.match(/Emotion data result: (.+)/);
              if (match) {
                emotionData.push(JSON.parse(match[1]));
              }
            } catch (e) {
              console.error('Failed to parse emotion data:', e);
            }
          }
        };
        
        setTimeout(() => {
          console.log = originalLog;
          resolve(emotionData[emotionData.length - 1]);
        }, 3000);
      });
    });
    
    await takeScreenshot(page, 'dashboard-initial');
    console.log('📈 Dashboard emotional data:', dashboardEmotionData ? `${dashboardEmotionData.length} emotions` : 'No data captured');
    
    // Step 2: Navigate to confluence and capture initial state
    console.log('📊 Step 2: Capturing initial confluence emotional state...');
    await page.goto(`${BASE_URL}/confluence`);
    await page.waitForLoadState('networkidle');
    await delay(3000); // Allow charts to render
    
    const confluenceEmotionData = await page.evaluate(() => {
      return new Promise((resolve) => {
        const emotionData = [];
        const originalLog = console.log;
        
        console.log = (...args) => {
          originalLog.apply(console, args);
          
          const logMessage = args.join(' ');
          if (logMessage.includes('CONFLUENCE EMOTION DEBUG') && logMessage.includes('Final emotion data result')) {
            try {
              const match = logMessage.match(/Final emotion data result: (.+)/);
              if (match) {
                emotionData.push(JSON.parse(match[1]));
              }
            } catch (e) {
              console.error('Failed to parse emotion data:', e);
            }
          }
        };
        
        setTimeout(() => {
          console.log = originalLog;
          resolve(emotionData[emotionData.length - 1]);
        }, 3000);
      });
    });
    
    await takeScreenshot(page, 'confluence-initial');
    console.log('📈 Confluence emotional data:', confluenceEmotionData ? `${confluenceEmotionData.length} emotions` : 'No data captured');
    
    // Step 3: Navigate to log-trade page
    console.log('📝 Step 3: Navigating to log-trade page...');
    await page.goto(`${BASE_URL}/log-trade`);
    await page.waitForLoadState('networkidle');
    await delay(2000);
    
    await takeScreenshot(page, 'log-trade-page');
    
    // Step 4: Try to fill form (if user is logged in)
    console.log('📝 Step 4: Attempting to fill trade form...');
    
    try {
      // Check if we're on the form or redirected to login
      const isLoginForm = await page.locator('input[type="email"]').isVisible();
      
      if (isLoginForm) {
        console.log('❌ User not logged in - cannot complete trade logging test');
        console.log('💡 This test requires an authenticated user session');
        console.log('🔧 Please log in manually and run the test again');
      } else {
        // Fill trade form
        await page.fill('input[name="symbol"]', testTrade.symbol);
        await page.selectOption('select[name="market"]', testTrade.market);
        await page.selectOption('select[name="side"]', testTrade.side);
        await page.fill('input[name="quantity"]', testTrade.quantity.toString());
        await page.fill('input[name="entryPrice"]', testTrade.entryPrice.toString());
        await page.fill('input[name="exitPrice"]', testTrade.exitPrice.toString());
        await page.fill('input[name="tradeDate"]', testTrade.tradeDate);
        
        // Select emotional states
        for (const emotion of testTrade.emotionalState) {
          try {
            await page.click(`text=${emotion}`);
            console.log(`✅ Selected emotion: ${emotion}`);
          } catch (e) {
            console.log(`❌ Could not select emotion: ${emotion}`);
          }
        }
        
        await page.fill('textarea[name="notes"]', testTrade.notes);
        
        await takeScreenshot(page, 'trade-form-filled');
        
        // Submit form
        await page.click('button[type="submit"]');
        
        // Wait for submission
        await page.waitForLoadState('networkidle');
        await delay(3000);
        
        await takeScreenshot(page, 'trade-submission-result');
        
        // Check for success message
        const successMessage = await page.locator('text=Trade successfully logged').isVisible();
        if (successMessage) {
          console.log('✅ Trade successfully logged');
        } else {
          console.log('❌ Trade submission may have failed');
        }
      }
    } catch (error) {
      console.error('❌ Error filling trade form:', error.message);
    }
    
    // Step 5: Check dashboard for updates
    console.log('📊 Step 5: Checking dashboard for emotional data updates...');
    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForLoadState('networkidle');
    await delay(5000); // Longer wait for potential updates
    
    const updatedDashboardEmotionData = await page.evaluate(() => {
      return new Promise((resolve) => {
        const emotionData = [];
        const originalLog = console.log;
        
        console.log = (...args) => {
          originalLog.apply(console, args);
          
          const logMessage = args.join(' ');
          if (logMessage.includes('DASHBOARD EMOTION DEBUG') && logMessage.includes('Emotion data result')) {
            try {
              const match = logMessage.match(/Emotion data result: (.+)/);
              if (match) {
                emotionData.push(JSON.parse(match[1]));
              }
            } catch (e) {
              console.error('Failed to parse emotion data:', e);
            }
          }
        };
        
        setTimeout(() => {
          console.log = originalLog;
          resolve(emotionData[emotionData.length - 1]);
        }, 3000);
      });
    });
    
    await takeScreenshot(page, 'dashboard-updated');
    console.log('📈 Updated dashboard emotional data:', updatedDashboardEmotionData ? `${updatedDashboardEmotionData.length} emotions` : 'No data captured');
    
    // Step 6: Check confluence for updates
    console.log('📊 Step 6: Checking confluence for emotional data updates...');
    await page.goto(`${BASE_URL}/confluence`);
    await page.waitForLoadState('networkidle');
    await delay(5000); // Longer wait for potential updates
    
    const updatedConfluenceEmotionData = await page.evaluate(() => {
      return new Promise((resolve) => {
        const emotionData = [];
        const originalLog = console.log;
        
        console.log = (...args) => {
          originalLog.apply(console, args);
          
          const logMessage = args.join(' ');
          if (logMessage.includes('CONFLUENCE EMOTION DEBUG') && logMessage.includes('Final emotion data result')) {
            try {
              const match = logMessage.match(/Final emotion data result: (.+)/);
              if (match) {
                emotionData.push(JSON.parse(match[1]));
              }
            } catch (e) {
              console.error('Failed to parse emotion data:', e);
            }
          }
        };
        
        setTimeout(() => {
          console.log = originalLog;
          resolve(emotionData[emotionData.length - 1]);
        }, 3000);
      });
    });
    
    await takeScreenshot(page, 'confluence-updated');
    console.log('📈 Updated confluence emotional data:', updatedConfluenceEmotionData ? `${updatedConfluenceEmotionData.length} emotions` : 'No data captured');
    
    // Step 7: Compare results
    console.log('=' .repeat(60));
    console.log('📋 TEST RESULTS SUMMARY:');
    
    const initialDashboardCount = dashboardEmotionData ? dashboardEmotionData.length : 0;
    const updatedDashboardCount = updatedDashboardEmotionData ? updatedDashboardEmotionData.length : 0;
    const initialConfluenceCount = confluenceEmotionData ? confluenceEmotionData.length : 0;
    const updatedConfluenceCount = updatedConfluenceEmotionData ? updatedConfluenceEmotionData.length : 0;
    
    console.log(`📊 Dashboard emotions - Before: ${initialDashboardCount}, After: ${updatedDashboardCount}`);
    console.log(`📊 Confluence emotions - Before: ${initialConfluenceCount}, After: ${updatedConfluenceCount}`);
    
    const dashboardUpdated = updatedDashboardCount > initialDashboardCount;
    const confluenceUpdated = updatedConfluenceCount > initialConfluenceCount;
    
    console.log(`✅ Dashboard updated: ${dashboardUpdated}`);
    console.log(`✅ Confluence updated: ${confluenceUpdated}`);
    
    if (dashboardUpdated || confluenceUpdated) {
      console.log('🎉 SUCCESS: Emotional analysis data is updating correctly!');
    } else {
      console.log('❌ ISSUE: Emotional analysis data is NOT updating as expected');
      console.log('🔍 This confirms the reported issue with emotional state analysis updates');
    }
    
    // Step 8: Generate test report
    const testReport = {
      timestamp: new Date().toISOString(),
      testTrade,
      results: {
        initialDashboardEmotions: initialDashboardCount,
        updatedDashboardEmotions: updatedDashboardCount,
        initialConfluenceEmotions: initialConfluenceCount,
        updatedConfluenceEmotions: updatedConfluenceCount,
        dashboardUpdated,
        confluenceUpdated,
        overallSuccess: dashboardUpdated || confluenceUpdated
      }
    };
    
    const reportPath = path.join(__dirname, `manual-emotional-analysis-test-${timestamp()}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(testReport, null, 2));
    console.log(`📄 Test report saved to: ${reportPath}`);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    await takeScreenshot(page, 'test-error');
  } finally {
    await browser.close();
  }
  
  console.log('=' .repeat(60));
  console.log('🏁 Test completed');
}

// Run the test
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main, testTrade };