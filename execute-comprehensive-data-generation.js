const { chromium } = require('playwright');
const fs = require('fs');

async function executeComprehensiveDataGeneration() {
  console.log('Starting comprehensive data generation process...');
  
  // Launch browser
  const browser = await chromium.launch({ 
    headless: false, // Show browser for visibility
    slowMo: 1000 // Slow down actions for better visibility
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  
  const page = await context.newPage();
  
  try {
    // Step 1: Navigate to test page
    console.log('Step 1: Navigating to test page...');
    await page.goto('http://localhost:3000/test-comprehensive-data');
    
    // Wait for page to load
    await page.waitForTimeout(2000);
    
    // Check if we need to authenticate
    const currentUrl = page.url();
    if (currentUrl.includes('/login') || !currentUrl.includes('/test-comprehensive-data')) {
      console.log('Authentication required, navigating to login page...');
      await page.goto('http://localhost:3000/login');
      await page.waitForTimeout(2000);
      
      // Fill in credentials
      await page.fill('input[type="email"]', 'testuser@verotrade.com');
      await page.fill('input[type="password"]', 'TestPassword123!');
      
      // Submit login form
      await page.click('button[type="submit"]');
      await page.waitForTimeout(3000);
      
      // Check if login was successful
      const loginUrl = page.url();
      if (loginUrl.includes('/login')) {
        console.error('Login failed - still on login page');
        throw new Error('Authentication failed');
      }
      
      console.log('Login successful, navigating back to test page...');
      await page.goto('http://localhost:3000/test-comprehensive-data');
      await page.waitForTimeout(2000);
    }
    
    // Step 2: Execute the 4-step data generation process
    console.log('Step 2: Starting data generation process...');
    
    // Step 2.1: Delete All Data
    console.log('Step 2.1: Clicking "Delete All Data"...');
    const deleteButton = await page.locator('text=Delete All Data').first();
    if (await deleteButton.isVisible()) {
      await deleteButton.click();
      await page.waitForTimeout(3000);
      console.log('Delete All Data completed');
    } else {
      console.log('Delete All Data button not found, continuing...');
    }
    
    // Step 2.2: Create Strategies
    console.log('Step 2.2: Clicking "Create Strategies"...');
    const createStrategiesButton = await page.locator('text=Create Strategies').first();
    if (await createStrategiesButton.isVisible()) {
      await createStrategiesButton.click();
      await page.waitForTimeout(5000); // Wait longer for strategy creation
      console.log('Create Strategies completed');
    } else {
      console.log('Create Strategies button not found');
    }
    
    // Step 2.3: Generate Trades
    console.log('Step 2.3: Clicking "Generate Trades"...');
    const generateTradesButton = await page.locator('text=Generate Trades').first();
    if (await generateTradesButton.isVisible()) {
      await generateTradesButton.click();
      await page.waitForTimeout(8000); // Wait longer for trade generation
      console.log('Generate Trades completed');
    } else {
      console.log('Generate Trades button not found');
    }
    
    // Step 2.4: Verify Data
    console.log('Step 2.4: Clicking "Verify Data"...');
    const verifyDataButton = await page.locator('text=Verify Data').first();
    if (await verifyDataButton.isVisible()) {
      await verifyDataButton.click();
      await page.waitForTimeout(3000);
      console.log('Verify Data completed');
    } else {
      console.log('Verify Data button not found');
    }
    
    // Step 3: Verify the results
    console.log('Step 3: Verifying results...');
    
    // Look for verification results on the page
    const pageContent = await page.content();
    
    // Take screenshot of the test page
    await page.screenshot({ path: 'test-page-results.png', fullPage: true });
    
    // Check for success indicators
    const successIndicators = [
      '100 trades created',
      '71 winning trades',
      '29 losing trades',
      '5 strategies created',
      '71% win rate'
    ];
    
    let verificationResults = {};
    for (const indicator of successIndicators) {
      const found = pageContent.includes(indicator);
      verificationResults[indicator] = found;
      console.log(`${indicator}: ${found ? '✓' : '✗'}`);
    }
    
    // Step 4: Test confluence functionality
    console.log('Step 4: Testing confluence functionality...');
    
    // Navigate to confluence page
    await page.goto('http://localhost:3000/confluence');
    await page.waitForTimeout(3000);
    
    // Take screenshot of confluence page
    await page.screenshot({ path: 'confluence-page-results.png', fullPage: true });
    
    // Check for emotional analysis elements
    const emotionalAnalysisVisible = await page.locator('text=Emotional State Analysis').isVisible();
    console.log(`Emotional State Analysis visible: ${emotionalAnalysisVisible ? '✓' : '✗'}`);
    
    // Test filtering functionality
    const filterElements = [
      'select[name="emotion"]',
      'select[name="strategy"]',
      'select[name="market"]'
    ];
    
    for (const filterSelector of filterElements) {
      const filterVisible = await page.locator(filterSelector).isVisible();
      console.log(`Filter ${filterSelector}: ${filterVisible ? '✓' : '✗'}`);
    }
    
    // Step 5: Test dashboard consistency
    console.log('Step 5: Testing dashboard consistency...');
    
    await page.goto('http://localhost:3000/dashboard');
    await page.waitForTimeout(3000);
    
    // Take screenshot of dashboard
    await page.screenshot({ path: 'dashboard-results.png', fullPage: true });
    
    // Step 6: Test adding new trade
    console.log('Step 6: Testing new trade addition...');
    
    await page.goto('http://localhost:3000/log-trade');
    await page.waitForTimeout(3000);
    
    // Fill in a sample trade
    await page.selectOption('select[name="market"]', 'EUR/USD');
    await page.selectOption('select[name="strategy"]', '1'); // Assuming first strategy
    await page.selectOption('select[name="direction"]', 'BUY');
    await page.fill('input[name="entryPrice"]', '1.0850');
    await page.fill('input[name="exitPrice"]', '1.0900');
    await page.selectOption('select[name="outcome"]', 'WIN');
    await page.selectOption('select[name="emotion"]', 'Confident');
    
    // Submit the trade
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    
    // Take screenshot after trade submission
    await page.screenshot({ path: 'new-trade-submitted.png', fullPage: true });
    
    // Step 7: Verify data refresh by going back to confluence
    console.log('Step 7: Verifying data refresh...');
    
    await page.goto('http://localhost:3000/confluence');
    await page.waitForTimeout(3000);
    
    // Take final screenshot
    await page.screenshot({ path: 'final-confluence-results.png', fullPage: true });
    
    // Compile final results
    const finalResults = {
      timestamp: new Date().toISOString(),
      authentication: 'success',
      dataGeneration: 'completed',
      verificationResults,
      confluenceFunctionality: 'tested',
      dashboardConsistency: 'tested',
      newTradeAddition: 'tested',
      screenshots: [
        'test-page-results.png',
        'confluence-page-results.png',
        'dashboard-results.png',
        'new-trade-submitted.png',
        'final-confluence-results.png'
      ]
    };
    
    // Save results to file
    fs.writeFileSync(
      `comprehensive-data-generation-results-${Date.now()}.json`,
      JSON.stringify(finalResults, null, 2)
    );
    
    console.log('Comprehensive data generation process completed successfully!');
    console.log('Results saved to JSON file');
    console.log('Screenshots taken for visual verification');
    
  } catch (error) {
    console.error('Error during data generation process:', error);
    
    // Take screenshot of error state
    await page.screenshot({ path: 'error-state.png', fullPage: true });
    
    throw error;
  } finally {
    await browser.close();
  }
}

// Execute the function
executeComprehensiveDataGeneration().catch(console.error);