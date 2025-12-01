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

function extractEmotionData(emotionData) {
  if (!emotionData || !Array.isArray(emotionData)) return {};
  
  const result = {};
  emotionData.forEach(item => {
    if (item && item.subject) {
      result[item.subject] = {
        value: item.value || 0,
        leaning: item.leaning || 'Balanced',
        side: item.side || 'NULL',
        totalTrades: item.totalTrades || 0
      };
    }
  });
  return result;
}

async function takeScreenshot(page, name) {
  const filename = `${timestamp()}-${name}.png`;
  const filepath = path.join(SCREENSHOT_DIR, filename);
  await page.screenshot({ path: filepath, fullPage: true });
  console.log(`📸 Screenshot saved: ${filename}`);
  return filepath;
}

async function loginIfNeeded(page) {
  console.log('🔐 Checking authentication status...');
  await page.goto(BASE_URL);
  
  // Check if already logged in by looking for dashboard or login form
  try {
    await page.waitForSelector('text=Dashboard', { timeout: 3000 });
    console.log('✅ Already logged in');
    return true;
  } catch (error) {
    console.log('❌ Not logged in, attempting to log in...');
    
    // Navigate to login page
    await page.goto(`${BASE_URL}/login`);
    
    // Fill login form (assuming test credentials exist)
    try {
      await page.fill('input[type="email"]', 'test@example.com');
      await page.fill('input[type="password"]', 'testpassword123');
      await page.click('button[type="submit"]');
      
      // Wait for login to complete
      await page.waitForSelector('text=Dashboard', { timeout: 10000 });
      console.log('✅ Login successful');
      return true;
    } catch (loginError) {
      console.log('❌ Login failed:', loginError.message);
      return false;
    }
  }
}

async function captureInitialEmotionalData(page) {
  console.log('📊 Capturing initial emotional state data...');
  
  const results = {
    dashboard: null,
    confluence: null
  };
  
  // Capture dashboard emotional data
  try {
    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForLoadState('networkidle');
    await delay(2000); // Allow charts to render
    
    // Get emotion data from console logs
    const dashboardEmotionData = await page.evaluate(() => {
      return new Promise((resolve) => {
        const emotionData = [];
        const originalLog = console.log;
        
        console.log = (...args) => {
          originalLog.apply(console, args);
          
          // Look for emotion debug logs
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
        
        // Trigger a refresh to get fresh data
        setTimeout(() => {
          console.log = originalLog;
          resolve(emotionData[emotionData.length - 1]); // Get the last emotion data
        }, 3000);
      });
    });
    
    results.dashboard = extractEmotionData(dashboardEmotionData);
    await takeScreenshot(page, 'dashboard-before');
    console.log('📈 Dashboard emotional data captured:', Object.keys(results.dashboard).length, 'emotions');
  } catch (error) {
    console.error('❌ Failed to capture dashboard emotional data:', error.message);
  }
  
  // Capture confluence emotional data
  try {
    await page.goto(`${BASE_URL}/confluence`);
    await page.waitForLoadState('networkidle');
    await delay(2000); // Allow charts to render
    
    // Get emotion data from console logs
    const confluenceEmotionData = await page.evaluate(() => {
      return new Promise((resolve) => {
        const emotionData = [];
        const originalLog = console.log;
        
        console.log = (...args) => {
          originalLog.apply(console, args);
          
          // Look for emotion debug logs
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
        
        // Trigger a refresh to get fresh data
        setTimeout(() => {
          console.log = originalLog;
          resolve(emotionData[emotionData.length - 1]); // Get the last emotion data
        }, 3000);
      });
    });
    
    results.confluence = extractEmotionData(confluenceEmotionData);
    await takeScreenshot(page, 'confluence-before');
    console.log('📈 Confluence emotional data captured:', Object.keys(results.confluence).length, 'emotions');
  } catch (error) {
    console.error('❌ Failed to capture confluence emotional data:', error.message);
  }
  
  return results;
}

async function logNewTrade(page) {
  console.log('📝 Logging new trade with emotional state...');
  
  try {
    await page.goto(`${BASE_URL}/log-trade`);
    await page.waitForLoadState('networkidle');
    
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
      await page.click(`text=${emotion}`);
    }
    
    await page.fill('textarea[name="notes"]', testTrade.notes);
    
    await takeScreenshot(page, 'trade-form-filled');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Wait for submission to complete
    await page.waitForLoadState('networkidle');
    await delay(2000);
    
    // Check if trade was successfully logged
    const successMessage = await page.locator('text=Trade successfully logged').isVisible();
    if (successMessage) {
      console.log('✅ Trade successfully logged');
      return true;
    } else {
      console.log('❌ Trade submission may have failed or redirected without confirmation');
      await takeScreenshot(page, 'trade-submission-result');
      return false;
    }
  } catch (error) {
    console.error('❌ Failed to log new trade:', error.message);
    await takeScreenshot(page, 'trade-form-error');
    return false;
  }
}

async function verifyEmotionalDataUpdate(page, initialData) {
  console.log('🔍 Verifying emotional state data updates...');
  
  const results = {
    dashboard: null,
    confluence: null,
    updatesFound: false
  };
  
  // Check dashboard emotional data
  try {
    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForLoadState('networkidle');
    await delay(3000); // Allow charts to render and data to update
    
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
    
    results.dashboard = extractEmotionData(dashboardEmotionData);
    await takeScreenshot(page, 'dashboard-after');
    console.log('📈 Dashboard emotional data after trade:', Object.keys(results.dashboard).length, 'emotions');
  } catch (error) {
    console.error('❌ Failed to capture updated dashboard emotional data:', error.message);
  }
  
  // Check confluence emotional data
  try {
    await page.goto(`${BASE_URL}/confluence`);
    await page.waitForLoadState('networkidle');
    await delay(3000); // Allow charts to render and data to update
    
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
    
    results.confluence = extractEmotionData(confluenceEmotionData);
    await takeScreenshot(page, 'confluence-after');
    console.log('📈 Confluence emotional data after trade:', Object.keys(results.confluence).length, 'emotions');
  } catch (error) {
    console.error('❌ Failed to capture updated confluence emotional data:', error.message);
  }
  
  // Compare initial and updated data
  if (initialData.dashboard && results.dashboard) {
    const dashboardChanges = compareEmotionalData(initialData.dashboard, results.dashboard);
    console.log('📊 Dashboard emotional data changes:', dashboardChanges);
    if (dashboardChanges.hasChanges) {
      results.updatesFound = true;
    }
  }
  
  if (initialData.confluence && results.confluence) {
    const confluenceChanges = compareEmotionalData(initialData.confluence, results.confluence);
    console.log('📊 Confluence emotional data changes:', confluenceChanges);
    if (confluenceChanges.hasChanges) {
      results.updatesFound = true;
    }
  }
  
  return results;
}

function compareEmotionalData(initial, updated) {
  const changes = {
    hasChanges: false,
    newEmotions: [],
    updatedEmotions: [],
    removedEmotions: []
  };
  
  // Check for new emotions
  for (const emotion in updated) {
    if (!initial[emotion]) {
      changes.newEmotions.push(emotion);
      changes.hasChanges = true;
    } else if (initial[emotion].totalTrades !== updated[emotion].totalTrades) {
      changes.updatedEmotions.push({
        emotion,
        before: initial[emotion].totalTrades,
        after: updated[emotion].totalTrades
      });
      changes.hasChanges = true;
    }
  }
  
  // Check for removed emotions (unlikely in this scenario)
  for (const emotion in initial) {
    if (!updated[emotion]) {
      changes.removedEmotions.push(emotion);
      changes.hasChanges = true;
    }
  }
  
  return changes;
}

async function monitorNetworkRequests(page) {
  console.log('🌐 Monitoring network requests...');
  
  const requests = [];
  page.on('request', request => {
    if (request.url().includes('/trades') || request.url().includes('/api/')) {
      requests.push({
        url: request.url(),
        method: request.method(),
        timestamp: new Date().toISOString()
      });
    }
  });
  
  return requests;
}

async function analyzeConsoleLogs(page) {
  console.log('📋 Analyzing console logs...');
  
  const logs = await page.evaluate(() => {
    return new Promise((resolve) => {
      const logs = [];
      const originalLog = console.log;
      const originalError = console.error;
      const originalWarn = console.warn;
      
      console.log = (...args) => {
        logs.push({ type: 'log', message: args.join(' '), timestamp: new Date().toISOString() });
        originalLog.apply(console, args);
      };
      
      console.error = (...args) => {
        logs.push({ type: 'error', message: args.join(' '), timestamp: new Date().toISOString() });
        originalError.apply(console, args);
      };
      
      console.warn = (...args) => {
        logs.push({ type: 'warn', message: args.join(' '), timestamp: new Date().toISOString() });
        originalWarn.apply(console, args);
      };
      
      setTimeout(() => {
        console.log = originalLog;
        console.error = originalError;
        console.warn = originalWarn;
        resolve(logs);
      }, 5000);
    });
  });
  
  return logs;
}

async function main() {
  console.log('🚀 Starting Emotional Analysis Update Test...');
  console.log('=' .repeat(60));
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();
  
  try {
    // Step 1: Login if needed
    const isLoggedIn = await loginIfNeeded(page);
    if (!isLoggedIn) {
      throw new Error('Failed to login to the application');
    }
    
    // Step 2: Monitor network requests
    const networkRequests = await monitorNetworkRequests(page);
    
    // Step 3: Capture initial emotional state data
    const initialData = await captureInitialEmotionalData(page);
    
    // Step 4: Log a new trade with emotional state
    const tradeLogged = await logNewTrade(page);
    if (!tradeLogged) {
      throw new Error('Failed to log new trade');
    }
    
    // Step 5: Verify emotional data updates
    const updatedData = await verifyEmotionalDataUpdate(page, initialData);
    
    // Step 6: Analyze console logs
    const consoleLogs = await analyzeConsoleLogs(page);
    
    // Step 7: Generate test report
    const testReport = {
      timestamp: new Date().toISOString(),
      testTrade,
      initialData,
      updatedData,
      networkRequests,
      consoleLogs,
      results: {
        tradeLogged,
        emotionalDataUpdated: updatedData.updatesFound,
        dashboardUpdated: Object.keys(updatedData.dashboard || {}).length > 0,
        confluenceUpdated: Object.keys(updatedData.confluence || {}).length > 0
      }
    };
    
    // Save test report
    const reportPath = path.join(__dirname, `emotional-analysis-test-report-${timestamp()}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(testReport, null, 2));
    
    console.log('=' .repeat(60));
    console.log('📋 TEST RESULTS SUMMARY:');
    console.log(`✅ Trade logged: ${testReport.results.tradeLogged}`);
    console.log(`✅ Emotional data updated: ${testReport.results.emotionalDataUpdated}`);
    console.log(`✅ Dashboard updated: ${testReport.results.dashboardUpdated}`);
    console.log(`✅ Confluence updated: ${testReport.results.confluenceUpdated}`);
    console.log(`📄 Full report saved to: ${reportPath}`);
    console.log('=' .repeat(60));
    
    // Print detailed comparison
    if (initialData.dashboard && updatedData.dashboard) {
      console.log('\n📊 Dashboard Emotional Data Comparison:');
      const dashboardChanges = compareEmotionalData(initialData.dashboard, updatedData.dashboard);
      console.log(JSON.stringify(dashboardChanges, null, 2));
    }
    
    if (initialData.confluence && updatedData.confluence) {
      console.log('\n📊 Confluence Emotional Data Comparison:');
      const confluenceChanges = compareEmotionalData(initialData.confluence, updatedData.confluence);
      console.log(JSON.stringify(confluenceChanges, null, 2));
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    await takeScreenshot(page, 'test-error');
  } finally {
    await browser.close();
  }
}

// Run the test
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main, testTrade };