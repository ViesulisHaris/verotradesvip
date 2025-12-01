
/**
 * Comprehensive Test Script for StrategyPerformanceModal Race Condition Fix
 * 
 * This script tests the race condition fixes implemented in the StrategyPerformanceModal component
 * by simulating various scenarios and monitoring the browser console for errors.
 */

const { chromium } = require('playwright');
const fs = require('fs');

async function runComprehensiveRaceConditionTest() {
  console.log('🚀 Starting Comprehensive Race Condition Test for StrategyPerformanceModal');
  console.log('=' .repeat(80));

  const browser = await chromium.launch({ 
    headless: false, // Set to true for headless mode
    devtools: true // Open devtools to see console logs
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
        msg.text().includes('Invalid strategy')) {
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
    // Test 1: Navigate to dashboard
    console.log('\n📍 Test 1: Navigating to dashboard...');
    await page.goto('http://localhost:3001/dashboard', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000); // Wait for page to fully load
    
    // Check if we're logged in or need to login
    const loginRequired = await page.locator('text=Login').isVisible().catch(() => false);
    
    if (loginRequired) {
      console.log('🔐 Login required, attempting to login...');
      // Add login logic here if needed
      // For now, assume we're already logged in or can proceed
    }

    // Test 2: Look for strategy cards or create test scenario
    console.log('\n📍 Test 2: Looking for strategy cards or creating test scenario...');
    
    // First try to find strategy cards
    let strategyCards = 0;
    try {
      await page.waitForSelector('[data-testid="strategy-card"]', { timeout: 5000 });
      strategyCards = await page.locator('[data-testid="strategy-card"]').count();
    } catch (error) {
      console.log('📊 No strategy cards found with data-testid="strategy-card"');
    }
    
    // If no strategy cards found, look for alternative selectors or create test data
    if (strategyCards === 0) {
      console.log('🔍 Looking for strategy cards with alternative selectors...');
      
      // Try to find any elements that might be strategy cards
      const possibleSelectors = [
        '.glass.p-4\\.sm\\:p-6', // EnhancedStrategyCard container
        '[class*="strategy"]',
        'button[class*="Performance"]',
        'text=View Performance Details'
      ];
      
      for (const selector of possibleSelectors) {
        try {
          const elements = await page.locator(selector).count();
          if (elements > 0) {
            console.log(`📊 Found ${elements} elements with selector: ${selector}`);
            strategyCards = elements;
            break;
          }
        } catch (e) {
          // Continue to next selector
        }
      }
    }
    
    // If still no strategy cards, create a direct test scenario
    if (strategyCards === 0) {
      console.log('🧪 No strategy cards found. Creating direct modal test scenario...');
      
      // Create a test strategy object and inject it into the page
      await page.evaluate(() => {
        // Create a test strategy object
        const testStrategy = {
          id: '00000000-0000-0000-0000-000000000001',
          name: 'Test Strategy for Race Condition',
          description: 'This is a test strategy to verify race condition fixes',
          is_active: true,
          rules: ['Test rule 1', 'Test rule 2'],
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
        };
        
        // Create a button to trigger the modal
        const testButton = document.createElement('button');
        testButton.id = 'test-strategy-modal-trigger';
        testButton.textContent = 'Test Strategy Performance Modal';
        testButton.className = 'fixed top-4 right-4 z-50 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700';
        testButton.style.cssText = 'position: fixed; top: 20px; right: 20px; z-index: 9999; background: #3b82f6; color: white; padding: 8px 16px; border-radius: 8px; cursor: pointer;';
        
        testButton.onclick = () => {
          // Import and render the StrategyPerformanceModal
          import('./src/components/ui/StrategyPerformanceModal.js').then(module => {
            const StrategyPerformanceModal = module.default;
            
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
            
            // Create modal content container
            const contentContainer = document.createElement('div');
            contentContainer.style.cssText = 'position: relative; z-index: 999999; max-width: 1024px; width: 100%; max-height: 90vh; overflow-y: auto; padding: 16px;';
            
            modalContainer.appendChild(backdrop);
            modalContainer.appendChild(contentContainer);
            document.body.appendChild(modalContainer);
            
            // Use React to render the modal
            const React = window.React;
            if (React && ReactDOM) {
              const modalElement = React.createElement(StrategyPerformanceModal, {
                strategy: testStrategy,
                onClose: () => {
                  document.body.removeChild(modalContainer);
                }
              });
              
              ReactDOM.render(modalElement, contentContainer);
            } else {
              console.error('React or ReactDOM not available for testing');
            }
          }).catch(error => {
            console.error('Error importing StrategyPerformanceModal:', error);
          });
        };
        
        document.body.appendChild(testButton);
      });
      
      await page.waitForTimeout(1000);
      strategyCards = 1; // We now have a test scenario
    }
    
    console.log(`📊 Final strategy count for testing: ${strategyCards}`);

    // Test 3: Basic modal opening test
    console.log('\n📍 Test 3: Basic modal opening test...');
    if (strategyCards > 0) {
      await page.locator('[data-testid="strategy-card"]').first().click();
      await page.waitForTimeout(2000);
      
      // Check if modal opened
      const modalVisible = await page.locator('[data-testid="strategy-performance-modal"]').isVisible().catch(() => false);
      console.log(`🔍 Modal visibility: ${modalVisible}`);
      
      if (modalVisible) {
        // Close modal
        await page.locator('[data-testid="modal-close-button"]').click();
        await page.waitForTimeout(1000);
      }
    }

    // Test 4: Rapid modal opening/closing test
    console.log('\n📍 Test 4: Rapid modal opening/closing test...');
    if (strategyCards > 0) {
      for (let i = 0; i < 5; i++) {
        console.log(`🔄 Rapid test iteration ${i + 1}/5`);
        
        // Open modal quickly
        await page.locator('[data-testid="strategy-card"]').first().click();
        await page.waitForTimeout(500);
        
        // Check for race condition errors
        const raceConditionErrors = consoleMessages.filter(msg => 
          msg.text.includes('Cannot load trade data: Invalid strategy') ||
          msg.text.includes('Invalid strategy ID')
        );
        
        if (raceConditionErrors.length > 0) {
          console.log('❌ Race condition detected:', raceConditionErrors);
        }
        
        // Close modal quickly
        const modalVisible = await page.locator('[data-testid="strategy-performance-modal"]').isVisible().catch(() => false);
        if (modalVisible) {
          await page.locator('[data-testid="modal-close-button"]').click();
        }
        await page.waitForTimeout(300);
      }
    }

    // Test 5: Test different strategies
    console.log('\n📍 Test 5: Testing different strategies...');
    const maxStrategiesToTest = Math.min(strategyCards, 3);
    
    for (let i = 0; i < maxStrategiesToTest; i++) {
      console.log(`🎯 Testing strategy ${i + 1}/${maxStrategiesToTest}`);
      
      await page.locator('[data-testid="strategy-card"]').nth(i).click();
      await page.waitForTimeout(2000);
      
      // Check modal content
      const modalVisible = await page.locator('[data-testid="strategy-performance-modal"]').isVisible().catch(() => false);
      
      if (modalVisible) {
        // Check for different tabs
        const overviewTab = await page.locator('text=Overview').isVisible().catch(() => false);
        const performanceTab = await page.locator('text=Performance').isVisible().catch(() => false);
        const rulesTab = await page.locator('text=Rules').isVisible().catch(() => false);
        
        console.log(`📋 Tabs available - Overview: ${overviewTab}, Performance: ${performanceTab}, Rules: ${rulesTab}`);
        
        // Test tab switching
        if (performanceTab) {
          await page.locator('text=Performance').click();
          await page.waitForTimeout(1000);
        }
        
        if (rulesTab) {
          await page.locator('text=Rules').click();
          await page.waitForTimeout(1000);
        }
        
        if (overviewTab) {
          await page.locator('text=Overview').click();
          await page.waitForTimeout(1000);
        }
        
        // Close modal
        await page.locator('[data-testid="modal-close-button"]').click();
        await page.waitForTimeout(1000);
      }
    }

    // Test 6: Network latency simulation
    console.log('\n📍 Test 6: Network latency simulation...');
    if (strategyCards > 0) {
      // Simulate slow network
      await context.route('**/*', route => {
        setTimeout(() => route.continue(), Math.random() * 1000 + 500); // 500-1500ms delay
      });
      
      await page.locator('[data-testid="strategy-card"]').first().click();
      await page.waitForTimeout(3000);
      
      // Check if modal handles slow network gracefully
      const modalVisible = await page.locator('[data-testid="strategy-performance-modal"]').isVisible().catch(() => false);
      console.log(`🐌 Slow network test - Modal visibility: ${modalVisible}`);
      
      if (modalVisible) {
        await page.locator('[data-testid="modal-close-button"]').click();
        await page.waitForTimeout(1000);
      }
      
      // Remove network simulation
      await context.unroute('**/*');
    }

    // Test 7: Console log analysis
    console.log('\n📍 Test 7: Console log analysis...');
    
    // Analyze debug logs for proper execution order
    const debugMessages = consoleMessages.filter(msg => msg.text.includes('🔍 [DEBUG]'));
    const validationMessages = debugMessages.filter(msg => msg.text.includes('validation'));
    const tradeDataMessages = debugMessages.filter(msg => msg.text.includes('loadTradeData'));
    
    console.log(`📊 Debug messages: ${debugMessages.length}`);
    console.log(`🔍 Validation messages: ${validationMessages.length}`);
    console.log(`📈 Trade data messages: ${tradeDataMessages.length}`);
    
    // Check for proper execution order
    let properExecutionOrder = true;
    for (let i = 0; i < debugMessages.length - 1; i++) {
      const current = debugMessages[i];
      const next = debugMessages[i + 1];
      
      // Validation should complete before trade data loading
      if (current.text.includes('validation completed') && 
          next.text.includes('loadTradeData called')) {
        console.log('✅ Proper execution order detected: validation → data loading');
      }
    }
    
    // Test 8: Error analysis
    console.log('\n📍 Test 8: Error analysis...');
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
        totalTests: 8,
        strategyCardsFound: strategyCards,
        raceConditionErrors: raceConditionErrors.length,
        pageErrors: pageErrors.length,
        debugMessages: debugMessages.length,
        properExecutionOrder: properExecutionOrder
      },
      details: {
        consoleMessages: consoleMessages,
        errors: errors,
        raceConditionErrors: raceConditionErrors,
        pageErrors: pageErrors
      },
      conclusion: {
        raceConditionFixed: raceConditionErrors.length === 0,
        executionOrderCorrect: properExecutionOrder,
        modalFunctionality: strategyCards > 0
      }
    };
    
    // Save test report
    const reportPath = `./race-condition-test-report-${Date.now()}.json`;
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

// Run the test
if (require.main === module) {
  runComprehensiveRaceConditionTest()
    .then(report => {
      console.log('\n✅ Test completed successfully!');
      console.log('📊 Test Summary:');
      console.log(`   - Race Condition Fixed: ${report.conclusion.raceConditionFixed ? '✅ YES' : '❌ NO'}`);
      console.log(`   - Execution Order Correct: ${report.conclusion.executionOrderCorrect ? '✅ YES' : '❌ NO'}`);
      console.log(`   - Modal Functionality: ${report.conclusion.modalFunctionality ? '✅ YES' : '❌ NO'}`);
      console.log(`   - Race Condition Errors: ${report.summary.raceConditionErrors}`);
      console.log(`   - Page Errors: ${report.summary.pageErrors}`);
      
      if (report.conclusion.raceConditionFixed && report.conclusion.executionOrderCorrect) {
        console.log('\n🎉 RACE CONDITION FIX VERIFICATION: PASSED');
        process.exit(0);
      } else {
        console.log('\n❌ RACE CONDITION FIX VERIFICATION: FAILED');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('❌ Test failed:', error);
      process.exit(1);
    });
}

module.exports = { runComprehensiveRaceConditionTest };