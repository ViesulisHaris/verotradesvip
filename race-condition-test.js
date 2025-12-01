const puppeteer = require('puppeteer');
const fs = require('fs');

async function testRaceCondition() {
  console.log('🚀 Starting race condition test for StrategyPerformanceModal...');
  
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
    
    // Check if user is logged in, if not, navigate to login
    const loginButton = await page.$('a[href="/login"]');
    if (loginButton) {
      console.log('🔐 User not logged in, navigating to login page...');
      await loginButton.click();
      await page.waitForNavigation({ waitUntil: 'networkidle2' });
      
      // Fill in login credentials (you may need to update these)
      await page.type('input[name="email"]', 'test@example.com');
      await page.type('input[name="password"]', 'password123');
      await page.click('button[type="submit"]');
      await page.waitForNavigation({ waitUntil: 'networkidle2' });
    }
    
    // Navigate to dashboard or strategies page
    console.log('📍 Navigating to strategies page...');
    await page.goto('http://localhost:3000/dashboard', { waitUntil: 'networkidle2' });
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Look for strategy cards
    const strategyCards = await page.$$('.strategy-card, [data-testid="strategy-card"], .glass');
    console.log(`📊 Found ${strategyCards.length} potential strategy cards`);
    
    if (strategyCards.length === 0) {
      console.log('❌ No strategy cards found. Trying alternative selectors...');
      // Try other possible selectors
      const alternativeCards = await page.$$('button, .card, [role="button"]');
      console.log(`📊 Found ${alternativeCards.length} alternative elements`);
    }
    
    // Look for "View Performance Details" buttons
    const performanceButtons = await page.$$('button:contains("Performance"), button:contains("View Performance"), button:contains("Details")');
    console.log(`📊 Found ${performanceButtons.length} performance buttons`);
    
    if (performanceButtons.length > 0) {
      console.log('🎯 Clicking on performance details button...');
      await performanceButtons[0].click();
      
      // Wait for modal to appear
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Look for modal
      const modal = await page.$('.fixed.inset-0, [role="dialog"], .modal');
      if (modal) {
        console.log('✅ Modal detected!');
      } else {
        console.log('❌ No modal detected');
      }
    } else {
      // Try to find any clickable elements that might trigger the modal
      const clickableElements = await page.$$('button');
      console.log(`📊 Found ${clickableElements.length} clickable elements`);
      
      if (clickableElements.length > 0) {
        console.log('🎯 Trying to click on first available button...');
        await clickableElements[0].click();
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    // Wait a bit more to capture all console logs
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Save console logs to file
    const logData = {
      timestamp: new Date().toISOString(),
      messages: consoleMessages,
      raceConditionAnalysis: analyzeConsoleLogs(consoleMessages)
    };
    
    fs.writeFileSync(
      `race-condition-test-results-${Date.now()}.json`,
      JSON.stringify(logData, null, 2)
    );
    
    console.log('📝 Test results saved to file');
    
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
  
  return analysis;
}

// Run the test
testRaceCondition().catch(console.error);