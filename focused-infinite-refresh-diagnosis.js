const { chromium } = require('playwright');
const fs = require('fs');

async function conductFocusedInfiniteRefreshDiagnosis() {
  console.log('🔍 Starting focused infinite refresh diagnosis...');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 50
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  
  const page = await context.newPage();
  
  // Monitor console for specific patterns
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('useEffect') || text.includes('render') || text.includes('DEBUG')) {
      console.log(`🔍 CONSOLE: ${msg.type()}: ${text}`);
    }
  });
  
  // Monitor network requests for patterns
  const requestLog = [];
  page.on('request', request => {
    requestLog.push({
      url: request.url(),
      method: request.method(),
      timestamp: Date.now()
    });
  });
  
  try {
    console.log('📍 Step 1: Navigating to strategies page...');
    await page.goto('http://localhost:3001/strategies');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Try login with multiple credentials
    const loginAttempts = [
      { email: 'test@example.com', password: 'testpassword123' },
      { email: 'admin@example.com', password: 'admin123' },
      { email: 'user@example.com', password: 'password123' }
    ];
    
    let loginSuccessful = false;
    
    for (const attempt of loginAttempts) {
      try {
        console.log(`🔑 Trying login with ${attempt.email}...`);
        
        // Check if we need to login
        const needsLogin = await page.locator('input[type="email"]').isVisible().catch(() => false);
        
        if (needsLogin) {
          await page.fill('input[type="email"]', attempt.email);
          await page.fill('input[type="password"]', attempt.password);
          await page.click('button[type="submit"]');
          await page.waitForTimeout(3000);
          
          const currentUrl = page.url();
          if (!currentUrl.includes('/login') && !currentUrl.includes('/register')) {
            console.log('✅ Login successful!');
            loginSuccessful = true;
            break;
          }
        } else {
          console.log('✅ Already logged in!');
          loginSuccessful = true;
          break;
        }
      } catch (error) {
        console.log(`❌ Login attempt failed: ${error.message}`);
        continue;
      }
    }
    
    if (!loginSuccessful) {
      console.log('❌ All login attempts failed');
      return;
    }
    
    console.log('📍 Step 2: Looking for strategy cards...');
    
    // Find and click on a strategy
    const strategyCards = await page.$$('.strategy-card, [data-testid*="strategy"], .glass');
    console.log(`Found ${strategyCards.length} strategy cards`);
    
    if (strategyCards.length === 0) {
      console.log('❌ No strategy cards found');
      return;
    }
    
    console.log('📍 Step 3: Clicking on strategy to open modal...');
    await strategyCards[0].click();
    await page.waitForTimeout(2000);
    
    // Look for "View Performance Details" button
    const performanceButton = await page.$('button:has-text("View Performance Details"), button:has-text("Performance")');
    
    if (!performanceButton) {
      console.log('❌ Performance button not found');
      return;
    }
    
    console.log('📍 Step 4: Opening performance modal...');
    await performanceButton.click();
    await page.waitForTimeout(2000);
    
    // Look for Performance tab
    const performanceTab = await page.$('button:has-text("Performance"), [role="tab"]:has-text("Performance")');
    
    if (!performanceTab) {
      console.log('❌ Performance tab not found in modal');
      return;
    }
    
    console.log('📍 Step 5: Clicking Performance tab and monitoring for infinite refresh...');
    await performanceTab.click();
    
    // Start monitoring for infinite refresh patterns
    const refreshData = {
      startTime: Date.now(),
      consoleMessages: [],
      networkRequests: [],
      domSnapshots: [],
      useEffectCalls: 0
    };
    
    // Monitor console for specific debug messages
    const consoleMonitor = setInterval(async () => {
      const messages = await page.evaluate(() => {
        const logs = [];
        const originalLog = console.log;
        console.log = (...args) => {
          const message = args.join(' ');
          if (message.includes('useEffect') || 
              message.includes('DEBUG') || 
              message.includes('render') ||
              message.includes('StrategyPerformanceModal')) {
            logs.push({
              timestamp: Date.now(),
              message: message
            });
          }
          originalLog.apply(console, args);
        };
        return logs;
      });
      
      refreshData.consoleMessages.push(...messages);
      refreshData.useEffectCalls += messages.filter(m => m.message.includes('useEffect')).length;
      
      if (refreshData.useEffectCalls > 10) {
        console.log('⚠️ INFINITE REFRESH PATTERN DETECTED!');
        console.log(`   - useEffect calls: ${refreshData.useEffectCalls}`);
        console.log(`   - Console messages: ${refreshData.consoleMessages.length}`);
      }
    }, 1000);
    
    // Monitor network requests
    const networkMonitor = setInterval(() => {
      const recentRequests = requestLog.filter(r => r.timestamp > refreshData.startTime);
      refreshData.networkRequests.push(...recentRequests);
      
      if (recentRequests.length > 5) {
        console.log('⚠️ HIGH NETWORK ACTIVITY DETECTED!');
        console.log(`   - Requests in last second: ${recentRequests.length}`);
        recentRequests.slice(0, 3).forEach(r => {
          console.log(`   - ${r.method} ${r.url}`);
        });
      }
    }, 1000);
    
    // Take DOM snapshots to detect changes
    let previousDom = await page.content();
    const domMonitor = setInterval(async () => {
      const currentDom = await page.content();
      if (currentDom !== previousDom) {
        refreshData.domSnapshots.push({
          timestamp: Date.now(),
          changed: true
        });
        previousDom = currentDom;
        
        if (refreshData.domSnapshots.length > 5) {
          console.log('⚠️ HIGH DOM ACTIVITY DETECTED!');
          console.log(`   - DOM changes: ${refreshData.domSnapshots.length}`);
        }
      }
    }, 500);
    
    // Monitor for 15 seconds
    console.log('⏱️ Monitoring for infinite refresh patterns for 15 seconds...');
    await page.waitForTimeout(15000);
    
    // Stop monitoring
    clearInterval(consoleMonitor);
    clearInterval(networkMonitor);
    clearInterval(domMonitor);
    
    // Analyze results
    console.log('\n📈 FOCUSED INFINITE REFRESH DIAGNOSIS RESULTS:');
    console.log('================================================');
    
    const totalConsoleMessages = refreshData.consoleMessages.length;
    const totalNetworkRequests = refreshData.networkRequests.length;
    const totalDomChanges = refreshData.domSnapshots.length;
    const totalUseEffectCalls = refreshData.useEffectCalls;
    
    console.log(`Console messages: ${totalConsoleMessages}`);
    console.log(`Network requests: ${totalNetworkRequests}`);
    console.log(`DOM changes: ${totalDomChanges}`);
    console.log(`useEffect calls detected: ${totalUseEffectCalls}`);
    
    // Check for infinite refresh indicators
    const hasInfiniteRefresh = 
      totalUseEffectCalls > 20 || 
      totalNetworkRequests > 30 || 
      totalDomChanges > 10;
    
    if (hasInfiniteRefresh) {
      console.log('\n⚠️ INFINITE REFRESH CONFIRMED!');
      console.log('   Likely causes:');
      console.log('   1. useEffect dependency array issues');
      console.log('   2. Debounced function recreation');
      console.log('   3. Component re-render loops');
    } else {
      console.log('\n✅ No obvious infinite refresh patterns detected');
    }
    
    // Save detailed report
    const report = {
      timestamp: new Date().toISOString(),
      hasInfiniteRefresh,
      metrics: {
        consoleMessages: totalConsoleMessages,
        networkRequests: totalNetworkRequests,
        domChanges: totalDomChanges,
        useEffectCalls: totalUseEffectCalls
      },
      details: refreshData
    };
    
    const reportPath = `focused-infinite-refresh-diagnosis-${Date.now()}.json`;
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log(`\n📄 Detailed diagnosis report saved to: ${reportPath}`);
    
  } catch (error) {
    console.error('❌ Error during diagnosis:', error);
  } finally {
    console.log('\n🔚 Keeping browser open for manual inspection...');
    console.log('Press Ctrl+C to close the browser');
    
    // Wait for manual intervention
    await new Promise(resolve => {
      process.on('SIGINT', resolve);
    });
    
    await browser.close();
    console.log('✅ Diagnosis completed');
  }
}

conductFocusedInfiniteRefreshDiagnosis().catch(console.error);