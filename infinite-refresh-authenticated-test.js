const { chromium } = require('playwright');
const fs = require('fs');

async function conductAuthenticatedBrowserTest() {
  console.log('🔍 Starting authenticated browser test for infinite refresh issue...');
  
  const browser = await chromium.launch({ 
    headless: false, // Keep browser visible for observation
    slowMo: 100 // Slow down actions for better observation
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  
  const page = await context.newPage();
  
  // Enable detailed console logging
  page.on('console', msg => {
    console.log(`Browser Console: ${msg.type()}: ${msg.text()}`);
  });
  
  // Monitor network requests
  const requests = [];
  page.on('request', request => {
    requests.push({
      url: request.url(),
      method: request.method(),
      timestamp: Date.now()
    });
  });
  
  try {
    console.log('📍 Step 1: Navigating to login page...');
    await page.goto('http://localhost:3001/login');
    await page.waitForLoadState('networkidle');
    
    console.log('📍 Step 2: Looking for login form...');
    
    // Wait for login form to be visible
    await page.waitForTimeout(2000);
    
    // Try multiple login approaches based on working test
    const loginAttempts = [
      {
        email: 'test@example.com',
        password: 'testpassword123'
      },
      {
        email: 'admin@example.com', 
        password: 'admin123'
      },
      {
        email: 'user@example.com',
        password: 'password123'
      }
    ];
    
    let loginSuccessful = false;
    
    for (const attempt of loginAttempts) {
      try {
        console.log(`🔑 Trying login with ${attempt.email}...`);
        
        // Look for email and password fields
        const emailSelectors = [
          'input[type="email"]',
          'input[name="email"]',
          'input[placeholder*="email"]',
          '#email',
          '.email-input'
        ];
        
        const passwordSelectors = [
          'input[type="password"]',
          'input[name="password"]',
          'input[placeholder*="password"]',
          '#password',
          '.password-input'
        ];
        
        let emailInput = null;
        let passwordInput = null;
        
        for (const selector of emailSelectors) {
          try {
            emailInput = await page.$(selector);
            if (emailInput) {
              console.log(`✅ Found email input with selector: ${selector}`);
              break;
            }
          } catch (e) {
            console.log(`❌ No email input found with selector: ${selector}`);
          }
        }
        
        for (const selector of passwordSelectors) {
          try {
            passwordInput = await page.$(selector);
            if (passwordInput) {
              console.log(`✅ Found password input with selector: ${selector}`);
              break;
            }
          } catch (e) {
            console.log(`❌ No password input found with selector: ${selector}`);
          }
        }
        
        if (emailInput && passwordInput) {
          console.log('📍 Step 3: Filling in login credentials...');
          await emailInput.fill(attempt.email);
          await passwordInput.fill(attempt.password);
          
          // Look for submit button
          const submitSelectors = [
            'button[type="submit"]',
            'button:has-text("Sign In")',
            'button:has-text("Login")',
            'input[type="submit"]',
            '.login-button',
            '#login-button'
          ];
          
          let submitButton = null;
          for (const selector of submitSelectors) {
            try {
              submitButton = await page.$(selector);
              if (submitButton) {
                console.log(`✅ Found submit button with selector: ${selector}`);
                break;
              }
            } catch (e) {
              console.log(`❌ No submit button found with selector: ${selector}`);
            }
          }
          
          if (submitButton) {
            console.log('📍 Step 4: Submitting login form...');
            await submitButton.click();
            await page.waitForTimeout(3000);
            
            // Check if login was successful by looking for redirect or auth indicators
            const currentUrl = page.url();
            console.log(`Current URL after login: ${currentUrl}`);
            
            if (!currentUrl.includes('/login') && !currentUrl.includes('/register')) {
              console.log('✅ Login successful!');
              loginSuccessful = true;
              break;
            }
            
            // Check for error messages
            const errorMessage = await page.locator('text=Invalid, text=Error, text=Failed').first().isVisible();
            if (await errorMessage) {
              console.log('❌ Login failed with error message');
              continue;
            }
          }
        }
      } catch (error) {
        console.log(`❌ Login attempt failed: ${error.message}`);
        continue;
      }
    }
    
    if (!loginSuccessful) {
      console.log('❌ All login attempts failed');
      
      // Take screenshot for debugging
      const screenshot = await page.screenshot();
      fs.writeFileSync('login-failed-debug.png', screenshot);
      console.log('📸 Login failure screenshot saved');
      return;
    }
    
    console.log('✅ Login appears successful, navigating to strategies...');
    
    console.log('📍 Step 5: Navigating to strategies page...');
    await page.goto('http://localhost:3001/strategies');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Look for strategy cards or clickable elements
    const strategySelectors = [
      '[data-testid="strategy-card"]',
      '.strategy-card',
      '[data-strategy-id]',
      'button[onclick*="strategy"]',
      'a[href*="strategy"]',
      '.strategy-item',
      '[role="button"]'
    ];
    
    let strategyElement = null;
    for (const selector of strategySelectors) {
      try {
        strategyElement = await page.$(selector);
        if (strategyElement) {
          console.log(`✅ Found strategy element with selector: ${selector}`);
          break;
        }
      } catch (e) {
        console.log(`❌ No element found with selector: ${selector}`);
      }
    }
    
    if (!strategyElement) {
      console.log('⚠️ No strategy elements found, checking page content...');
      const allClickables = await page.$$('[role="button"], button, a[href]');
      console.log(`Found ${allClickables.length} clickable elements`);
      
      if (allClickables.length > 0) {
        strategyElement = allClickables[0];
        console.log('Using first clickable element as fallback');
      }
    }
    
    if (strategyElement) {
      console.log('📍 Step 6: Clicking on strategy to view details...');
      await strategyElement.click();
      await page.waitForTimeout(3000);
      
      // Look for Performance tab
      console.log('📍 Step 7: Looking for Performance tab...');
      const performanceTabSelectors = [
        '[data-testid="performance-tab"]',
        'button:has-text("Performance")',
        'a:has-text("Performance")',
        '[role="tab"]:has-text("Performance")',
        '.tab-performance',
        '#performance-tab'
      ];
      
      let performanceTab = null;
      for (const selector of performanceTabSelectors) {
        try {
          performanceTab = await page.$(selector);
          if (performanceTab) {
            console.log(`✅ Found Performance tab with selector: ${selector}`);
            break;
          }
        } catch (e) {
          console.log(`❌ No Performance tab found with selector: ${selector}`);
        }
      }
      
      if (performanceTab) {
        console.log('📍 Step 8: Clicking on Performance tab...');
        await performanceTab.click();
        await page.waitForTimeout(2000);
        
        console.log('📍 Step 9: Starting performance monitoring for infinite refresh...');
        
        // Start monitoring for refresh patterns
        const refreshData = {
          startTime: Date.now(),
          networkRequests: [],
          domChanges: [],
          consoleMessages: [],
          screenshots: []
        };
        
        // Monitor network requests for 15 seconds
        const networkMonitor = setInterval(async () => {
          const currentRequests = requests.filter(r => r.timestamp > refreshData.startTime);
          refreshData.networkRequests.push(...currentRequests);
          console.log(`📊 Active requests in last second: ${currentRequests.length}`);
        }, 1000);
        
        // Monitor DOM changes
        let previousDomContent = await page.content();
        const domMonitor = setInterval(async () => {
          const currentDomContent = await page.content();
          if (currentDomContent !== previousDomContent) {
            refreshData.domChanges.push({
              timestamp: Date.now(),
              change: 'DOM content modified'
            });
            console.log('🔄 DOM content changed');
            previousDomContent = currentDomContent;
          }
        }, 500);
        
        // Take screenshots every 2 seconds
        const screenshotMonitor = setInterval(async () => {
          const screenshot = await page.screenshot();
          const screenshotPath = `infinite-refresh-screenshot-${Date.now()}.png`;
          fs.writeFileSync(screenshotPath, screenshot);
          refreshData.screenshots.push(screenshotPath);
          console.log(`📸 Screenshot saved: ${screenshotPath}`);
        }, 2000);
        
        // Monitor for 15 seconds
        console.log('⏱️ Monitoring for 15 seconds...');
        await page.waitForTimeout(15000);
        
        // Stop all monitors
        clearInterval(networkMonitor);
        clearInterval(domMonitor);
        clearInterval(screenshotMonitor);
        
        // Analyze the collected data
        console.log('\n📈 INFINITE REFRESH ANALYSIS RESULTS:');
        console.log('====================================');
        
        const totalRequests = refreshData.networkRequests.length;
        const uniqueUrls = [...new Set(refreshData.networkRequests.map(r => r.url))];
        const domChangeCount = refreshData.domChanges.length;
        
        console.log(`Total network requests: ${totalRequests}`);
        console.log(`Unique URLs requested: ${uniqueUrls.length}`);
        console.log(`DOM changes detected: ${domChangeCount}`);
        console.log(`Screenshots captured: ${refreshData.screenshots.length}`);
        
        if (uniqueUrls.length > 0) {
          console.log('\n🔗 Most requested URLs:');
          const urlCounts = {};
          refreshData.networkRequests.forEach(r => {
            urlCounts[r.url] = (urlCounts[r.url] || 0) + 1;
          });
          Object.entries(urlCounts)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5)
            .forEach(([url, count]) => {
              console.log(`  ${count}x: ${url}`);
            });
        }
        
        // Check for infinite refresh patterns
        const hasInfiniteRefresh = domChangeCount > 5 || totalRequests > 20;
        
        if (hasInfiniteRefresh) {
          console.log('\n⚠️ INFINITE REFRESH DETECTED!');
          console.log(`   - High DOM activity: ${domChangeCount} changes`);
          console.log(`   - High network activity: ${totalRequests} requests`);
        } else {
          console.log('\n✅ No obvious infinite refresh patterns detected');
        }
        
        // Save detailed report
        const report = {
          timestamp: new Date().toISOString(),
          hasInfiniteRefresh,
          summary: {
            totalRequests,
            uniqueUrls: uniqueUrls.length,
            domChanges: domChangeCount,
            screenshots: refreshData.screenshots.length,
            monitoringDuration: 15000
          },
          details: refreshData
        };
        
        const reportPath = `infinite-refresh-test-report-${Date.now()}.json`;
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        
        console.log(`\n📄 Detailed report saved to: ${reportPath}`);
        
      } else {
        console.log('❌ Performance tab not found. Available elements:');
        const allTabs = await page.$$('[role="tab"], button, a');
        for (let i = 0; i < Math.min(allTabs.length, 10); i++) {
          const text = await allTabs[i].textContent();
          console.log(`  - ${text || 'No text'}`);
        }
      }
    } else {
      console.log('❌ No strategy elements found to click');
      
      // Take a screenshot to see what's on the page
      const screenshot = await page.screenshot();
      fs.writeFileSync('strategies-page-debug.png', screenshot);
      console.log('📸 Debug screenshot saved as strategies-page-debug.png');
    }
    
  } catch (error) {
    console.error('❌ Error during testing:', error);
  } finally {
    console.log('\n🔚 Keeping browser open for manual inspection...');
    console.log('Press Ctrl+C to close the browser and end the test');
    
    // Wait for manual intervention
    await new Promise(resolve => {
      process.on('SIGINT', resolve);
    });
    
    await browser.close();
    console.log('✅ Test completed');
  }
}

conductAuthenticatedBrowserTest().catch(console.error);