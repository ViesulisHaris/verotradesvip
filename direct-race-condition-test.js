const puppeteer = require('puppeteer');
const fs = require('fs');

async function testRaceConditionDirectly() {
  console.log('🚀 Starting direct race condition test for StrategyPerformanceModal...');
  
  const browser = await puppeteer.launch({
    headless: false, // Set to false to see the browser
    defaultViewport: null,
    args: ['--start-maximized']
  });

  try {
    const page = await browser.newPage();
    
    // Capture console logs
    const consoleMessages = [];
    page.on('console', msg => {
      const text = msg.text();
      consoleMessages.push({
        timestamp: new Date().toISOString(),
        type: msg.type(),
        text: text
      });
      console.log(`[${msg.type()}] ${text}`);
    });

    // Navigate to the application
    console.log('📍 Navigating to the application...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
    
    // Wait for the page to load
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Login with correct credentials
    console.log('🔐 Logging in with test credentials...');
    await page.type('input[type="email"]', 'testuser@verotrade.com');
    await page.type('input[type="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Navigate to dashboard to see strategies
    console.log('📍 Navigating to dashboard...');
    await page.goto('http://localhost:3000/dashboard', { waitUntil: 'networkidle2' });
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Look for strategy cards or elements that might trigger the modal
    console.log('🔍 Looking for strategy elements...');
    
    // Try to find and click on strategy elements
    const strategyElements = await page.$$('button, .glass, [role="button"], .card');
    console.log(`📊 Found ${strategyElements.length} potential strategy elements`);
    
    // Try to find elements with strategy-related text
    const performanceButtons = await page.evaluate(() => {
      const allButtons = Array.from(document.querySelectorAll('button, div[role="button"], .glass'));
      return allButtons.filter(el => {
        const text = el.textContent || el.innerText || '';
        return text.toLowerCase().includes('performance') || 
               text.toLowerCase().includes('view') || 
               text.toLowerCase().includes('details') ||
               text.toLowerCase().includes('strategy');
      }).map(el => ({
        text: el.textContent || el.innerText || '',
        tagName: el.tagName,
        className: el.className
      }));
    });
    
    console.log('📊 Strategy-related elements found:', performanceButtons.length);
    performanceButtons.forEach((btn, index) => {
      console.log(`  ${index + 1}. "${btn.text}" (${btn.tagName})`);
    });
    
    if (performanceButtons.length > 0) {
      console.log('🎯 Clicking on first strategy-related element...');
      await page.evaluate((index) => {
        const allButtons = Array.from(document.querySelectorAll('button, div[role="button"], .glass'));
        const targetButtons = allButtons.filter(el => {
          const text = el.textContent || el.innerText || '';
          return text.toLowerCase().includes('performance') || 
                 text.toLowerCase().includes('view') || 
                 text.toLowerCase().includes('details') ||
                 text.toLowerCase().includes('strategy');
        });
        
        if (targetButtons[index]) {
          targetButtons[index].click();
          return true;
        }
        return false;
      }, 0);
      
      await new Promise(resolve => setTimeout(resolve, 3000));
    } else {
      // If no specific buttons found, try to inject and test the modal directly
      console.log('🔬 No strategy buttons found, attempting to directly test StrategyPerformanceModal...');
      
      // Directly inject and test the StrategyPerformanceModal component
      await page.evaluate(() => {
        // Create a mock strategy object
        const mockStrategy = {
          id: 'test-strategy-id-' + Date.now(),
          name: 'Test Strategy for Race Condition',
          description: 'Test strategy to reproduce race condition',
          is_active: true,
          stats: {
            winrate: 65.5,
            profit_factor: 1.8,
            total_pnl: 2500,
            total_trades: 50,
            winning_trades: 33,
            gross_profit: 5000,
            gross_loss: 2500,
            max_drawdown: -500,
            sharpe_ratio: 1.2,
            avg_hold_period: 120
          },
          rules: ['Rule 1: Buy when RSI < 30', 'Rule 2: Sell when RSI > 70']
        };
        
        console.log('🧪 Mock strategy created:', mockStrategy);
        
        // Try to find React and trigger the modal
        if (window.React && window.React.createElement) {
          console.log('✅ React detected, attempting to trigger modal...');
          
          // Look for any existing strategy modals or components
          const modals = document.querySelectorAll('.fixed.inset-0, [role="dialog"], .modal');
          console.log('🔍 Existing modals found:', modals.length);
          
          // Try to find any buttons that might trigger strategy modals
          const buttons = document.querySelectorAll('button');
          console.log('🔍 Total buttons found:', buttons.length);
          
          buttons.forEach((btn, index) => {
            if (index < 5) { // Only check first 5 buttons
              console.log(`🔍 Button ${index + 1}: "${btn.textContent}"`);
            }
          });
          
          return { success: true, strategy: mockStrategy };
        } else {
          console.log('❌ React not detected or not accessible');
          return { success: false, error: 'React not detected' };
        }
      });
    }
    
    // Wait for modal to appear
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Look for modal
    const modal = await page.$('.fixed.inset-0, [role="dialog"], .modal');
    if (modal) {
      console.log('✅ Modal detected!');
    } else {
      console.log('❌ No modal detected');
    }
    
    // Wait a bit more to capture all console logs
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Save console logs to file
    const logData = {
      timestamp: new Date().toISOString(),
      messages: consoleMessages,
      raceConditionAnalysis: analyzeConsoleLogs(consoleMessages)
    };
    
    const filename = `direct-race-condition-test-results-${Date.now()}.json`;
    fs.writeFileSync(filename, JSON.stringify(logData, null, 2));
    
    console.log(`📝 Test results saved to ${filename}`);
    
    // Print analysis summary
    console.log('\n📊 RACE CONDITION ANALYSIS SUMMARY:');
    console.log('=====================================');
    const analysis = logData.raceConditionAnalysis;
    console.log(`Race condition detected: ${analysis.hasRaceCondition ? 'YES' : 'NO'}`);
    console.log(`Validation events: ${analysis.validationEvents.length}`);
    console.log(`Trade data events: ${analysis.tradeDataEvents.length}`);
    console.log(`Errors: ${analysis.errors.length}`);
    
    if (analysis.hasRaceCondition) {
      console.log('\n🚨 RACE CONDITION CONFIRMED!');
      console.log('Description:', analysis.raceConditionDescription);
      console.log('\n🔍 Event sequence:');
      analysis.sequence.forEach((event, index) => {
        console.log(`${index + 1}. [${event.timestamp}] ${event.text}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error during test:', error);
  } finally {
    await browser.close();
  }
}

function analyzeConsoleLogs(messages) {
  const analysis = {
    hasRaceCondition: false,
    sequence: [],
    validationEvents: [],
    tradeDataEvents: [],
    errors: []
  };
  
  // Look for specific debug messages
  messages.forEach(msg => {
    if (msg.text.includes('🔍 [DEBUG]')) {
      analysis.sequence.push(msg);
      
      if (msg.text.includes('Strategy validation useEffect triggered')) {
        analysis.validationEvents.push(msg);
      }
      
      if (msg.text.includes('loadTradeData called') || msg.text.includes('StrategyPerformanceModal mounted useEffect triggered')) {
        analysis.tradeDataEvents.push(msg);
      }
      
      if (msg.text.includes('Cannot load trade data: Invalid strategy') || msg.text.includes('Invalid strategy ID')) {
        analysis.errors.push(msg);
        analysis.hasRaceCondition = true;
      }
    }
  });
  
  // Check for race condition pattern
  if (analysis.tradeDataEvents.length > 0 && analysis.validationEvents.length > 0) {
    const firstValidation = analysis.validationEvents[0];
    const firstTradeDataCall = analysis.tradeDataEvents[0];
    
    if (firstTradeDataCall.timestamp < firstValidation.timestamp) {
      analysis.hasRaceCondition = true;
      analysis.raceConditionDescription = 'Trade data loading triggered before strategy validation completed';
    }
  }
  
  // Check for additional race condition patterns
  const invalidStrategyErrors = messages.filter(msg => 
    msg.text.includes('Cannot load trade data: Invalid strategy')
  );
  
  if (invalidStrategyErrors.length > 0) {
    analysis.hasRaceCondition = true;
    analysis.raceConditionDescription = analysis.raceConditionDescription || 
      'loadTradeData called when isValidStrategy was false';
  }
  
  return analysis;
}

// Run the test
testRaceConditionDirectly().catch(console.error);