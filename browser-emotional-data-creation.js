const { chromium } = require('playwright');

console.log('🚀 BROWSER EMOTIONAL DATA CREATION');
console.log('===================================');

const REQUIRED_EMOTIONS = ['ANXIOUS', 'CONFIDENT', 'FEARFUL', 'DISCIPLINED', 'IMPULSIVE', 'PATIENT', 'GREEDY', 'CALM'];

const sampleTrades = [
  {
    symbol: 'AAPL',
    market: 'Stock',
    side: 'Buy',
    quantity: 100,
    entry_price: 150.00,
    exit_price: 155.00,
    pnl: 500.00,
    emotional_state: ['CONFIDENT'],
    notes: 'Confident trade - strong technical analysis'
  },
  {
    symbol: 'GOOGL',
    market: 'Stock',
    side: 'Sell',
    quantity: 50,
    entry_price: 2800.00,
    exit_price: 2750.00,
    pnl: 2500.00,
    emotional_state: ['DISCIPLINED'],
    notes: 'Disciplined trade - followed exit plan exactly'
  },
  {
    symbol: 'TSLA',
    market: 'Stock',
    side: 'Buy',
    quantity: 75,
    entry_price: 250.00,
    exit_price: 240.00,
    pnl: -750.00,
    emotional_state: ['ANXIOUS'],
    notes: 'Anxious trade - worried about missing opportunity'
  },
  {
    symbol: 'BTC',
    market: 'Crypto',
    side: 'Buy',
    quantity: 0.5,
    entry_price: 45000.00,
    exit_price: 46000.00,
    pnl: 500.00,
    emotional_state: ['PATIENT'],
    notes: 'Patient trade - waited for right entry point'
  },
  {
    symbol: 'ETH',
    market: 'Crypto',
    side: 'Sell',
    quantity: 2.0,
    entry_price: 3000.00,
    exit_price: 2900.00,
    pnl: 200.00,
    emotional_state: ['CALM'],
    notes: 'Calm trade - no emotional attachment'
  },
  {
    symbol: 'MSFT',
    market: 'Stock',
    side: 'Buy',
    quantity: 150,
    entry_price: 350.00,
    exit_price: 340.00,
    pnl: -1500.00,
    emotional_state: ['FEARFUL'],
    notes: 'Fearful trade - afraid of missing out'
  },
  {
    symbol: 'NVDA',
    market: 'Stock',
    side: 'Buy',
    quantity: 200,
    entry_price: 500.00,
    exit_price: 520.00,
    pnl: 4000.00,
    emotional_state: ['GREEDY'],
    notes: 'Greedy trade - took too much risk'
  },
  {
    symbol: 'META',
    market: 'Stock',
    side: 'Sell',
    quantity: 100,
    entry_price: 200.00,
    exit_price: 180.00,
    pnl: 2000.00,
    emotional_state: ['IMPULSIVE'],
    notes: 'Impulsive trade - quick decision without analysis'
  }
];

async function createTradesWithBrowser() {
  console.log('🌐 Launching browser for trade creation...');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // Step 1: Login
    console.log('🔐 Logging in...');
    await page.goto('http://localhost:3000/login');
    
    // Fill login form
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'testpassword123');
    await page.click('button[type="submit"]');
    
    // Wait for login to complete
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    console.log('✅ Login successful');
    
    // Step 2: Navigate to trade logging
    console.log('📈 Navigating to trade logging...');
    await page.goto('http://localhost:3000/log-trade');
    await page.waitForLoadState('networkidle');
    
    // Step 3: Create trades
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < sampleTrades.length; i++) {
      const trade = sampleTrades[i];
      
      console.log(`\n📊 Creating trade ${i + 1}/${sampleTrades.length}: ${trade.symbol} (${trade.emotional_state[0]})`);
      
      try {
        // Fill form fields
        await page.fill('input[name="symbol"]', trade.symbol);
        await page.selectOption('select[name="market"]', trade.market);
        await page.selectOption('select[name="side"]', trade.side);
        await page.fill('input[name="quantity"]', trade.quantity.toString());
        await page.fill('input[name="entry_price"]', trade.entry_price.toString());
        await page.fill('input[name="exit_price"]', trade.exit_price.toString());
        await page.fill('input[name="pnl"]', trade.pnl.toString());
        
        // Handle emotional state - this might be a multi-select or dropdown
        // Try different approaches for emotional state selection
        try {
          // Look for emotion dropdown or multi-select
          const emotionSelector = await page.locator('select[name="emotional_state"]').count();
          if (emotionSelector > 0) {
            await page.selectOption('select[name="emotional_state"]', trade.emotional_state);
          } else {
            // Look for emotion checkboxes or other input methods
            const emotionInput = await page.locator('input[placeholder*="emotion"]').count();
            if (emotionInput > 0) {
              await page.fill('input[placeholder*="emotion"]', trade.emotional_state[0]);
            } else {
              // Try to find any input that might be for emotions
              const emotionElements = await page.locator('text=emotion').count();
              if (emotionElements > 0) {
                // This is a fallback - we might need to inspect the actual form
                console.log('⚠️  Could not find emotion input, skipping emotion setting');
              }
            }
          }
        } catch (emotionError) {
          console.log('⚠️  Could not set emotion, continuing with trade creation');
        }
        
        // Fill notes
        await page.fill('textarea[name="notes"]', trade.notes);
        
        // Submit form
        await page.click('button[type="submit"]');
        
        // Wait for submission to complete
        await page.waitForTimeout(2000);
        
        // Check for success message or redirect
        const currentUrl = page.url();
        if (currentUrl.includes('trades') || currentUrl.includes('dashboard')) {
          console.log(`✅ Successfully created trade: ${trade.symbol}`);
          successCount++;
          
          // Navigate back to trade logging for next trade
          if (i < sampleTrades.length - 1) {
            await page.goto('http://localhost:3000/log-trade');
            await page.waitForLoadState('networkidle');
          }
        } else {
          console.log(`❌ Failed to create trade: ${trade.symbol}`);
          errorCount++;
        }
        
      } catch (tradeError) {
        console.error(`❌ Error creating trade ${trade.symbol}:`, tradeError.message);
        errorCount++;
        
        // Try to continue with next trade
        await page.goto('http://localhost:3000/log-trade');
        await page.waitForLoadState('networkidle');
      }
    }
    
    console.log(`\n📊 Trade Creation Summary:`);
    console.log(`✅ Successfully created: ${successCount} trades`);
    console.log(`❌ Failed to create: ${errorCount} trades`);
    
    return { successCount, errorCount };
    
  } catch (error) {
    console.error('❌ Browser automation error:', error);
    return { successCount: 0, errorCount: 1 };
  } finally {
    await browser.close();
  }
}

async function verifyTradesInBrowser() {
  console.log('\n🔍 Verifying trades in browser...');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // Login
    await page.goto('http://localhost:3000/login');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'testpassword123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    
    // Check dashboard for emotional analysis
    console.log('📊 Checking dashboard for emotional analysis...');
    await page.waitForTimeout(3000);
    
    // Look for emotional analysis components
    const emotionalAnalysis = await page.locator('text=emotional').count();
    const radarChart = await page.locator('canvas').count();
    
    console.log(`📈 Found ${emotionalAnalysis} emotional analysis elements`);
    console.log(`📈 Found ${radarChart} chart elements`);
    
    // Check confluence page
    console.log('📊 Checking confluence page for emotional analysis...');
    await page.goto('http://localhost:3000/confluence');
    await page.waitForTimeout(3000);
    
    const confluenceEmotionalAnalysis = await page.locator('text=emotional').count();
    const confluenceRadarChart = await page.locator('canvas').count();
    
    console.log(`📈 Found ${confluenceEmotionalAnalysis} emotional analysis elements on confluence`);
    console.log(`📈 Found ${confluenceRadarChart} chart elements on confluence`);
    
    return {
      dashboardEmotionalElements: emotionalAnalysis,
      dashboardChartElements: radarChart,
      confluenceEmotionalElements: confluenceEmotionalAnalysis,
      confluenceChartElements: confluenceRadarChart
    };
    
  } catch (error) {
    console.error('❌ Verification error:', error);
    return null;
  } finally {
    await browser.close();
  }
}

async function main() {
  try {
    console.log('🎯 Starting emotional data creation process...');
    
    // Step 1: Create trades using browser
    const { successCount, errorCount } = await createTradesWithBrowser();
    
    if (successCount === 0) {
      console.error('❌ No trades were created successfully. Exiting.');
      return;
    }
    
    // Step 2: Verify trades and emotional analysis
    const verification = await verifyTradesInBrowser();
    
    if (verification) {
      console.log('\n🎉 VERIFICATION RESULTS:');
      console.log(`Dashboard - Emotional elements: ${verification.dashboardEmotionalElements}`);
      console.log(`Dashboard - Chart elements: ${verification.dashboardChartElements}`);
      console.log(`Confluence - Emotional elements: ${verification.confluenceEmotionalElements}`);
      console.log(`Confluence - Chart elements: ${verification.confluenceChartElements}`);
      
      if (verification.dashboardEmotionalElements > 0 && verification.confluenceEmotionalElements > 0) {
        console.log('\n✅ SUCCESS: Emotional analysis is visible on both pages!');
      } else {
        console.log('\n⚠️  PARTIAL SUCCESS: Trades created but emotional analysis may need refresh.');
      }
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Execute the script
main();