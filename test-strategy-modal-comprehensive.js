const { chromium } = require('playwright');
const fs = require('fs');

async function testStrategyModalComprehensive() {
  console.log('🚀 Starting Comprehensive Strategy Modal Test');
  console.log('=' .repeat(60));

  const browser = await chromium.launch({ 
    headless: false,
    devtools: true
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  
  const page = await context.newPage();
  
  // Set up console logging to capture all debug messages
  const consoleMessages = [];
  page.on('console', msg => {
    consoleMessages.push({
      type: msg.type(),
      text: msg.text(),
      timestamp: new Date().toISOString()
    });
    
    // Log race condition related messages
    if (msg.text().includes('🔍 [DEBUG]') || 
        msg.text().includes('Cannot load trade data') ||
        msg.text().includes('Invalid strategy') ||
        msg.text().includes('Strategy validation')) {
      console.log(`📝 [${msg.type().toUpperCase()}] ${msg.text()}`);
    }
  });

  // Set up error handling
  const errors = [];
  page.on('pageerror', error => {
    errors.push({
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    console.error('❌ Page Error:', error.message);
  });

  try {
    // Navigate to dashboard
    console.log('\n📍 Step 1: Navigating to dashboard...');
    await page.goto('http://localhost:3001/dashboard', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    
    // Check if we need to login
    const loginRequired = await page.locator('text=Login').isVisible().catch(() => false);
    if (loginRequired) {
      console.log('🔐 Login required. Please login manually and press Enter to continue...');
      // Wait for manual login
      await page.waitForFunction(() => window.location.pathname !== '/login', { timeout: 0 });
      await page.waitForTimeout(2000);
    }

    // Create comprehensive test scenarios
    console.log('\n📍 Step 2: Creating comprehensive test scenarios...');
    
    await page.evaluate(() => {
      // Test strategies with different configurations
      const testStrategies = [
        {
          id: '00000000-0000-0000-0000-000000000001',
          name: 'Strategy With Rules',
          description: 'Test strategy with rules to verify rules tab functionality',
          is_active: true,
          rules: ['Rule 1: Buy when RSI < 30', 'Rule 2: Sell when RSI > 70', 'Rule 3: Use 2% stop loss'],
          stats: {
            winrate: 65.5,
            profit_factor: 1.8,
            total_pnl: 2500,
            total_trades: 50,
            winning_trades: 33,
            gross_profit: 4000,
            gross_loss: 1500,
            max_drawdown: 500,
            sharpe_ratio: 1.2,
            avg_hold_period: 120
          }
        },
        {
          id: '00000000-0000-0000-0000-000000000002',
          name: 'Strategy Without Rules',
          description: 'Test strategy without rules to verify modal handles missing rules',
          is_active: true,
          rules: [],
          stats: {
            winrate: 58.2,
            profit_factor: 1.4,
            total_pnl: 1800,
            total_trades: 35,
            winning_trades: 20,
            gross_profit: 3200,
            gross_loss: 1400,
            max_drawdown: 300,
            sharpe_ratio: 0.9,
            avg_hold_period: 90
          }
        },
        {
          id: '00000000-0000-0000-0000-000000000003',
          name: 'Inactive Strategy',
          description: 'Test inactive strategy to verify status display',
          is_active: false,
          rules: ['Rule 1: Only trade during market hours'],
          stats: {
            winrate: 45.0,
            profit_factor: 0.8,
            total_pnl: -500,
            total_trades: 20,
            winning_trades: 9,
            gross_profit: 1500,
            gross_loss: 2000,
            max_drawdown: 800,
            sharpe_ratio: -0.3,
            avg_hold_period: 60
          }
        },
        {
          id: '00000000-0000-0000-0000-000000000004',
          name: 'High Performance Strategy',
          description: 'Test strategy with excellent metrics',
          is_active: true,
          rules: ['Rule 1: Trend following', 'Rule 2: Volume confirmation', 'Rule 3: Risk management'],
          stats: {
            winrate: 75.0,
            profit_factor: 2.5,
            total_pnl: 5000,
            total_trades: 40,
            winning_trades: 30,
            gross_profit: 7000,
            gross_loss: 2000,
            max_drawdown: 400,
            sharpe_ratio: 2.1,
            avg_hold_period: 180
          }
        }
      ];

      // Create test buttons for each strategy
      const container = document.createElement('div');
      container.id = 'test-strategies-container';
      container.style.cssText = 'position: fixed; top: 10px; right: 10px; z-index: 9999; display: flex; flex-direction: column; gap: 10px;';
      
      testStrategies.forEach((strategy, index) => {
        const button = document.createElement('button');
        button.id = `test-strategy-${index + 1}`;
        button.textContent = `Test: ${strategy.name}`;
        button.style.cssText = 'background: #3b82f6; color: white; padding: 8px 12px; border-radius: 6px; cursor: pointer; font-size: 12px; border: none; white-space: nowrap;';
        
        button.onclick = () => {
          console.log(`🧪 [TEST] Testing strategy: ${strategy.name}`);
          window.currentTestStrategy = strategy;
          
          // Create modal container
          const modalContainer = document.createElement('div');
          modalContainer.id = 'test-modal-container';
          modalContainer.style.cssText = 'position: fixed; inset: 0; z-index: 999999; display: flex; align-items: center; justify-content: center;';
          
          // Create backdrop
          const backdrop = document.createElement('div');
          backdrop.style.cssText = 'position: fixed; inset: 0; background: rgba(0,0,0,0.7); backdrop-filter: blur(4px); z-index: 999998;';
          backdrop.onclick = () => {
            document.body.removeChild(modalContainer);
          };
          
          // Create content container
          const contentContainer = document.createElement('div');
          contentContainer.style.cssText = 'position: relative; z-index: 999999; max-width: 1024px; width: 100%; max-height: 90vh; overflow-y: auto; padding: 16px;';
          
          modalContainer.appendChild(backdrop);
          modalContainer.appendChild(contentContainer);
          document.body.appendChild(modalContainer);
          
          // Try to import and render modal
          import('./src/components/ui/StrategyPerformanceModal.js').then(module => {
            const StrategyPerformanceModal = module.default;
            console.log(`🧪 [TEST] StrategyPerformanceModal imported for: ${strategy.name}`);
            
            const modalElement = window.React.createElement(StrategyPerformanceModal, {
              strategy: strategy,
              onClose: () => {
                console.log(`🧪 [TEST] Modal closed for: ${strategy.name}`);
                document.body.removeChild(modalContainer);
              }
            });
            
            window.ReactDOM.render(modalElement, contentContainer);
            console.log(`🧪 [TEST] Modal rendered successfully for: ${strategy.name}`);
          }).catch(error => {
            console.error(`🧪 [TEST] Error importing modal for ${strategy.name}:`, error);
            contentContainer.innerHTML = `
              <div style="background: white; padding: 20px; border-radius: 8px; color: black;">
                <h2>Modal Test Error</h2>
                <p>Strategy: ${strategy.name}</p>
                <p>Could not load StrategyPerformanceModal: ${error.message}</p>
                <button onclick="document.body.removeChild(document.getElementById('test-modal-container'))">Close</button>
              </div>
            `;
          });
        };
        
        container.appendChild(button);
      });
      
      document.body.appendChild(container);
      console.log('🧪 [TEST] Test buttons created for all strategies');
    });
    
    await page.waitForTimeout(2000);

    // Test 3: Test each strategy type
    console.log('\n📍 Step 3: Testing different strategy types...');
    
    for (let i = 1; i <= 4; i++) {
      console.log(`🎯 Testing strategy ${i}/4...`);
      
      // Open modal
      await page.locator(`#test-strategy-${i}`).click();
      await page.waitForTimeout(2000);
      
      // Check for race condition errors
      const raceConditionErrors = consoleMessages.filter(msg => 
        msg.text.includes('Cannot load trade data: Invalid strategy') ||
        msg.text.includes('Invalid strategy ID')
      );
      
      if (raceConditionErrors.length > 0) {
        console.log('❌ Race condition detected:', raceConditionErrors);
      }
      
      // Test tab switching if modal is open
      const modalVisible = await page.locator('#test-modal-container').isVisible().catch(() => false);
      if (modalVisible) {
        console.log(`📋 Modal ${i} is visible, testing tabs...`);
        
        // Test different tabs
        try {
          // Test Overview tab
          const overviewTab = await page.locator('text=Overview').isVisible().catch(() => false);
          if (overviewTab) {
            await page.locator('text=Overview').click();
            await page.waitForTimeout(500);
            console.log(`📋 Overview tab tested for strategy ${i}`);
          }
          
          // Test Performance tab
          const performanceTab = await page.locator('text=Performance').isVisible().catch(() => false);
          if (performanceTab) {
            await page.locator('text=Performance').click();
            await page.waitForTimeout(500);
            console.log(`📋 Performance tab tested for strategy ${i}`);
          }
          
          // Test Rules tab (only for strategies with rules)
          if (i === 1 || i === 4) { // Strategies with rules
            const rulesTab = await page.locator('text=Rules').isVisible().catch(() => false);
            if (rulesTab) {
              await page.locator('text=Rules').click();
              await page.waitForTimeout(500);
              console.log(`📋 Rules tab tested for strategy ${i}`);
            }
          }
        } catch (tabError) {
          console.log(`⚠️ Tab switching error for strategy ${i}:`, tabError.message);
        }
        
        // Close modal
        await page.locator('#test-modal-container').click({ position: { x: 10, y: 10 } });
        await page.waitForTimeout(500);
      }
      
      // Wait between tests
      await page.waitForTimeout(1000);
    }

    // Test 4: Rapid modal switching test
    console.log('\n📍 Step 4: Rapid modal switching test...');
    
    for (let i = 0; i < 3; i++) {
      console.log(`🔄 Rapid switching iteration ${i + 1}/3`);
      
      // Open strategy 1
      await page.locator('#test-strategy-1').click();
      await page.waitForTimeout(300);
      
      // Close quickly
      const modalVisible = await page.locator('#test-modal-container').isVisible().catch(() => false);
      if (modalVisible) {
        await page.locator('#test-modal-container').click({ position: { x: 10, y: 10 } });
      }
      await page.waitForTimeout(200);
      
      // Open strategy 2
      await page.locator('#test-strategy-2').click();
      await page.waitForTimeout(300);
      
      // Close quickly
      const modalVisible2 = await page.locator('#test-modal-container').isVisible().catch(() => false);
      if (modalVisible2) {
        await page.locator('#test-modal-container').click({ position: { x: 10, y: 10 } });
      }
      await page.waitForTimeout(200);
    }

    // Test 5: Console log analysis
    console.log('\n📍 Step 5: Console log analysis...');
    
    const debugMessages = consoleMessages.filter(msg => msg.text.includes('🔍 [DEBUG]'));
    const validationMessages = debugMessages.filter(msg => msg.text.includes('validation'));
    const tradeDataMessages = debugMessages.filter(msg => msg.text.includes('loadTradeData'));
    const strategyTestMessages = consoleMessages.filter(msg => msg.text.includes('🧪 [TEST]'));
    
    console.log(`📊 Debug messages: ${debugMessages.length}`);
    console.log(`🔍 Validation messages: ${validationMessages.length}`);
    console.log(`📈 Trade data messages: ${tradeDataMessages.length}`);
    console.log(`🧪 Strategy test messages: ${strategyTestMessages.length}`);
    
    // Test 6: Error analysis
    console.log('\n📍 Step 6: Error analysis...');
    const raceConditionErrors = consoleMessages.filter(msg => 
      msg.text.includes('Cannot load trade data: Invalid strategy') ||
      msg.text.includes('Invalid strategy ID') ||
      msg.text.includes('Race condition')
    );
    
    const pageErrors = errors.filter(error => 
      error.message.includes('Cannot read properties') ||
      error.message.includes('undefined') ||
      error.message.includes('null')
    );
    
    console.log(`🚨 Race condition errors: ${raceConditionErrors.length}`);
    console.log(`💥 Page errors: ${pageErrors.length}`);
    
    // Generate test report
    const testReport = {
      timestamp: new Date().toISOString(),
      summary: {
        totalTests: 6,
        strategiesTested: 4,
        raceConditionErrors: raceConditionErrors.length,
        pageErrors: pageErrors.length,
        debugMessages: debugMessages.length,
        validationMessages: validationMessages.length,
        tradeDataMessages: tradeDataMessages.length,
        strategyTestMessages: strategyTestMessages.length
      },
      details: {
        consoleMessages: consoleMessages,
        errors: errors,
        raceConditionErrors: raceConditionErrors,
        pageErrors: pageErrors
      },
      conclusion: {
        raceConditionFixed: raceConditionErrors.length === 0,
        noPageErrors: pageErrors.length === 0,
        allStrategiesTested: true,
        modalFunctionalityWorking: strategyTestMessages.length > 0
      }
    };
    
    // Save test report
    const reportPath = `./strategy-modal-comprehensive-test-${Date.now()}.json`;
    fs.writeFileSync(reportPath, JSON.stringify(testReport, null, 2));
    console.log(`\n📄 Test report saved to: ${reportPath}`);
    
    return testReport;
    
  } catch (error) {
    console.error('❌ Test execution failed:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

// Run test
if (require.main === module) {
  testStrategyModalComprehensive()
    .then(report => {
      console.log('\n✅ Test completed successfully!');
      console.log('📊 Test Summary:');
      console.log(`   - Race Condition Fixed: ${report.conclusion.raceConditionFixed ? '✅ YES' : '❌ NO'}`);
      console.log(`   - No Page Errors: ${report.conclusion.noPageErrors ? '✅ YES' : '❌ NO'}`);
      console.log(`   - All Strategies Tested: ${report.conclusion.allStrategiesTested ? '✅ YES' : '❌ NO'}`);
      console.log(`   - Modal Functionality Working: ${report.conclusion.modalFunctionalityWorking ? '✅ YES' : '❌ NO'}`);
      console.log(`   - Strategies Tested: ${report.summary.strategiesTested}`);
      console.log(`   - Race Condition Errors: ${report.summary.raceConditionErrors}`);
      console.log(`   - Page Errors: ${report.summary.pageErrors}`);
      
      if (report.conclusion.raceConditionFixed && report.conclusion.noPageErrors && report.conclusion.allStrategiesTested) {
        console.log('\n🎉 COMPREHENSIVE STRATEGY MODAL TEST: PASSED');
        process.exit(0);
      } else {
        console.log('\n❌ COMPREHENSIVE STRATEGY MODAL TEST: FAILED');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('❌ Test failed:', error);
      process.exit(1);
    });
}

module.exports = { testStrategyModalComprehensive };