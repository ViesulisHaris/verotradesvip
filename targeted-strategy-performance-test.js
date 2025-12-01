const { chromium } = require('playwright');
const { createClient } = require('@supabase/supabase-js');

/**
 * Targeted Strategy Performance Test
 * 
 * This test specifically focuses on the strategy performance page
 * to ensure the infinite refresh loop fix is working properly
 * when there's actual data to display.
 */

async function targetedStrategyPerformanceTest() {
  console.log('🎯 === TARGETED STRATEGY PERFORMANCE TEST ===\n');
  
  // First, create test data if needed
  await createTestDataIfNeeded();
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500 
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  
  const page = await context.newPage();
  
  // Track network requests specifically for strategy performance
  const performanceRequests = [];
  page.on('request', request => {
    if (request.url().includes('/strategies') || request.url().includes('/performance')) {
      performanceRequests.push({
        url: request.url(),
        method: request.method(),
        timestamp: Date.now()
      });
    }
  });
  
  // Track console logs for infinite loop indicators
  const consoleLogs = [];
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('INFINITE REFRESH') || 
        text.includes('useEffect triggered') ||
        text.includes('COMPONENT FUNCTION CALLED') ||
        text.includes('DIAGNOSTIC')) {
      consoleLogs.push({
        type: msg.type(),
        text: text,
        timestamp: Date.now()
      });
    }
  });
  
  try {
    // Navigate to login
    console.log('🔐 Navigating to login...');
    await page.goto('http://localhost:3001/login');
    await page.waitForLoadState('networkidle');
    
    // Check if we need to login
    const loginForm = await page.locator('form').first();
    if (await loginForm.isVisible()) {
      console.log('📝 Logging in with test credentials...');
      await page.fill('input[type="email"]', 'test@example.com');
      await page.fill('input[type="password"]', 'testpassword');
      await page.click('button[type="submit"]');
      await page.waitForLoadState('networkidle');
    }
    
    // Navigate to strategies
    console.log('📊 Navigating to strategies page...');
    await page.goto('http://localhost:3001/strategies');
    await page.waitForLoadState('networkidle');
    
    // Wait for strategies to load
    await page.waitForTimeout(3000);
    
    // Check for strategy cards
    const strategyCards = await page.locator('[data-testid="strategy-card"], .strategy-card, [class*="strategy"]').count();
    console.log(`📋 Found ${strategyCards} strategy card(s)`);
    
    if (strategyCards > 0) {
      // Click on the first strategy to view performance
      console.log('🎯 Clicking on first strategy to view performance...');
      await page.locator('[data-testid="strategy-card"], .strategy-card, [class*="strategy"]').first().click();
      await page.waitForLoadState('networkidle');
      
      // Wait for performance page to fully load
      await page.waitForTimeout(5000);
      
      // Monitor for potential infinite refresh for 15 seconds
      console.log('⏱️ Monitoring strategy performance page for 15 seconds...');
      
      const startTime = Date.now();
      const monitoringDuration = 15000; // 15 seconds
      
      // Reset tracking
      performanceRequests.length = 0;
      consoleLogs.length = 0;
      
      await page.waitForTimeout(monitoringDuration);
      
      const endTime = Date.now();
      const timeWindow = endTime - startTime;
      
      // Analyze results
      const requestsInWindow = performanceRequests.filter(req => 
        req.timestamp >= startTime && req.timestamp <= endTime
      );
      
      const logsInWindow = consoleLogs.filter(log => 
        log.timestamp >= startTime && log.timestamp <= endTime
      );
      
      // Calculate metrics
      const avgRequestsPerSecond = requestsInWindow.length / (timeWindow / 1000);
      const refreshRequests = requestsInWindow.filter(req => 
        req.url.includes('/strategies/performance') || 
        req.url.includes('/strategies')
      );
      
      const loopIndicators = logsInWindow.filter(log => 
        log.text.includes('INFINITE REFRESH') ||
        log.text.includes('useEffect triggered') ||
        log.text.includes('COMPONENT FUNCTION CALLED')
      );
      
      console.log('\n📊 ANALYSIS RESULTS:');
      console.log(`   Time monitored: ${timeWindow / 1000} seconds`);
      console.log(`   Total requests: ${requestsInWindow.length}`);
      console.log(`   Average requests/sec: ${avgRequestsPerSecond.toFixed(2)}`);
      console.log(`   Refresh requests: ${refreshRequests.length}`);
      console.log(`   Loop indicators: ${loopIndicators.length}`);
      
      // Check for performance metrics
      const metrics = await page.locator('[class*="winrate"], [class*="profit"], [class*="pnl"], [class*="trades"]').count();
      const charts = await page.locator('[class*="chart"], canvas, svg').count();
      const tabs = await page.locator('button:has-text("Overview"), button:has-text("Performance"), button:has-text("Rules")').count();
      
      console.log('\n🎯 PAGE CONTENT ANALYSIS:');
      console.log(`   Performance metrics found: ${metrics}`);
      console.log(`   Chart elements found: ${charts}`);
      console.log(`   Tab elements found: ${tabs}`);
      
      // Test tab switching
      if (tabs > 0) {
        console.log('\n🔄 Testing tab switching...');
        
        const performanceTab = await page.locator('button:has-text("Performance")').first();
        if (await performanceTab.isVisible()) {
          await performanceTab.click();
          await page.waitForTimeout(2000);
          console.log('   ✅ Switched to Performance tab');
        }
        
        const overviewTab = await page.locator('button:has-text("Overview")').first();
        if (await overviewTab.isVisible()) {
          await overviewTab.click();
          await page.waitForTimeout(2000);
          console.log('   ✅ Switched to Overview tab');
        }
      }
      
      // Final verdict
      console.log('\n🎯 FINAL VERDICT:');
      
      let hasInfiniteLoop = false;
      let issues = [];
      
      if (avgRequestsPerSecond > 2) {
        hasInfiniteLoop = true;
        issues.push(`High request frequency: ${avgRequestsPerSecond.toFixed(2)} req/sec`);
      }
      
      if (loopIndicators.length > 5) {
        hasInfiniteLoop = true;
        issues.push(`Excessive loop indicators: ${loopIndicators.length}`);
      }
      
      if (refreshRequests.length > 10) {
        hasInfiniteLoop = true;
        issues.push(`Excessive refresh requests: ${refreshRequests.length}`);
      }
      
      if (hasInfiniteLoop) {
        console.log('   ❌ INFINITE REFRESH LOOP DETECTED!');
        issues.forEach(issue => console.log(`   ❌ ${issue}`));
      } else {
        console.log('   ✅ NO INFINITE REFRESH LOOP DETECTED');
        console.log('   ✅ Request patterns are normal');
        console.log('   ✅ No excessive loop indicators');
      }
      
      if (metrics > 0 && charts > 0) {
        console.log('   ✅ Performance data is loading correctly');
        console.log('   ✅ Charts are rendering properly');
      } else {
        console.log('   ⚠️ Some performance elements may be missing');
      }
      
    } else {
      console.log('⚠️ No strategies found - cannot test performance page');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
}

async function createTestDataIfNeeded() {
  console.log('🔧 Checking if test data is needed...');
  
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      console.log('⚠️ Supabase credentials not available, skipping test data creation');
      return;
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Check if user exists
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.log('⚠️ No authenticated user found, skipping test data creation');
      return;
    }
    
    // Check if strategies exist
    const { data: strategies, error } = await supabase
      .from('strategies')
      .select('id')
      .eq('user_id', user.id)
      .limit(1);
    
    if (error) {
      console.log('⚠️ Error checking strategies:', error.message);
      return;
    }
    
    if (!strategies || strategies.length === 0) {
      console.log('📝 No strategies found, creating test strategy...');
      
      const { data: newStrategy, error: createError } = await supabase
        .from('strategies')
        .insert({
          user_id: user.id,
          name: 'Test Strategy for Performance',
          description: 'A test strategy to verify performance page functionality',
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (createError) {
        console.log('⚠️ Error creating test strategy:', createError.message);
      } else {
        console.log('✅ Test strategy created successfully');
        
        // Create some test trades
        const trades = [];
        for (let i = 0; i < 10; i++) {
          trades.push({
            strategy_id: newStrategy.id,
            user_id: user.id,
            market: 'TEST',
            symbol: 'TESTUSD',
            type: i % 2 === 0 ? 'BUY' : 'SELL',
            entry_price: 100 + Math.random() * 10,
            exit_price: 100 + Math.random() * 10,
            quantity: 1,
            entry_date: new Date(Date.now() - (i * 24 * 60 * 60 * 1000)).toISOString(),
            exit_date: new Date(Date.now() - (i * 24 * 60 * 60 * 1000) + 60 * 60 * 1000).toISOString(),
            pnl: (Math.random() - 0.5) * 20,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        }
        
        const { error: tradesError } = await supabase
          .from('trades')
          .insert(trades);
        
        if (tradesError) {
          console.log('⚠️ Error creating test trades:', tradesError.message);
        } else {
          console.log('✅ Test trades created successfully');
        }
      }
    } else {
      console.log('✅ Strategies already exist, proceeding with test');
    }
    
  } catch (error) {
    console.log('⚠️ Error in test data creation:', error.message);
  }
}

// Run the test
if (require.main === module) {
  targetedStrategyPerformanceTest()
    .then(() => {
      console.log('\n🎯 Test completed');
      process.exit(0);
    })
    .catch(error => {
      console.error('Test failed:', error);
      process.exit(1);
    });
}

module.exports = { targetedStrategyPerformanceTest };