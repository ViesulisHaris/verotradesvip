/**
 * Strategy Selection Issue Diagnosis Script
 * 
 * This script tests the trade logging functionality to identify
 * issues with strategy selection in the TradeForm component.
 */

const puppeteer = require('puppeteer');
const path = require('path');

async function diagnoseStrategySelection() {
  console.log('🔍 Starting Strategy Selection Diagnosis...');
  
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: ['--start-maximized', '--no-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    
    // Navigate to the login page first
    console.log('📍 Navigating to login page...');
    await page.goto('http://localhost:3001/login', { waitUntil: 'networkidle2' });
    
    // Wait for login form
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    
    // Fill in login credentials (assuming test user exists)
    console.log('🔐 Logging in...');
    await page.type('input[type="email"]', 'test@example.com');
    await page.type('input[type="password"]', 'testpassword123');
    await page.click('button[type="submit"]');
    
    // Wait for navigation to dashboard
    await page.waitForNavigation({ waitUntil: 'networkidle2' });
    console.log('✅ Logged in successfully');
    
    // Navigate to trade logging page
    console.log('📍 Navigating to trade logging page...');
    await page.goto('http://localhost:3001/log-trade', { waitUntil: 'networkidle2' });
    
    // Wait for trade form to load
    await page.waitForSelector('form', { timeout: 10000 });
    console.log('✅ Trade form loaded');
    
    // Check if strategies are loaded
    console.log('🔍 Checking strategy dropdown...');
    
    // Wait for strategies to load (check for option elements)
    try {
      await page.waitForFunction(() => {
        const select = document.querySelector('select[name="strategy_id"]');
        return select && select.options.length > 1; // More than just "None" option
      }, { timeout: 15000 });
      
      const strategyOptions = await page.evaluate(() => {
        const select = document.querySelector('select[name="strategy_id"]');
        if (!select) return { error: 'Strategy dropdown not found' };
        
        const options = Array.from(select.options);
        return {
          count: options.length,
          options: options.map(opt => ({
            value: opt.value,
            text: opt.text,
            selected: opt.selected
          }))
        };
      });
      
      console.log('📊 Strategy dropdown analysis:', strategyOptions);
      
      if (strategyOptions.error) {
        console.error('❌ Error:', strategyOptions.error);
        return;
      }
      
      if (strategyOptions.count <= 1) {
        console.warn('⚠️ Warning: Only "None" option found. Strategies may not be loading properly.');
        
        // Check for JavaScript errors
        const errors = await page.evaluate(() => {
          const errors = [];
          const originalError = console.error;
          console.error = function(...args) {
            errors.push(args.join(' '));
            originalError.apply(console, args);
          };
          return errors;
        });
        
        if (errors.length > 0) {
          console.log('🐛 JavaScript errors detected:', errors);
        }
        
        // Check network requests for strategies
        page.on('response', response => {
          if (response.url().includes('strategies')) {
            console.log('🌐 Strategy request:', response.url(), response.status());
            if (response.status() !== 200) {
              console.error('❌ Strategy request failed:', response.status(), response.statusText());
            }
          }
        });
        
      } else {
        console.log('✅ Strategies loaded successfully');
        
        // Test strategy selection
        console.log('🖱️ Testing strategy selection...');
        
        // Select a strategy (if available)
        if (strategyOptions.options.length > 1) {
          const strategyToSelect = strategyOptions.options[1]; // Select first real strategy
          console.log(`📝 Selecting strategy: ${strategyToSelect.text}`);
          
          await page.select('select[name="strategy_id"]', strategyToSelect.value);
          
          // Check if strategy rules appear
          await page.waitForTimeout(1000);
          
          const strategyRulesVisible = await page.evaluate(() => {
            const rulesContainer = document.querySelector('[data-strategy-rules]');
            return rulesContainer && rulesContainer.offsetParent !== null;
          });
          
          console.log('📋 Strategy rules visible:', strategyRulesVisible);
          
          // Test form submission with selected strategy
          console.log('🧪 Testing form submission...');
          
          // Fill minimal required fields
          await page.select('select[name="market"]', 'stock');
          await page.type('input[name="symbol"]', 'TEST');
          await page.select('select[name="side"]', 'Buy');
          await page.type('input[name="quantity"]', '100');
          await page.type('input[name="entry_price"]', '50');
          await page.type('input[name="exit_price"]', '55');
          await page.type('input[name="pnl"]', '500');
          
          // Check if strategy ID is properly set in form
          const formState = await page.evaluate(() => {
            const form = document.querySelector('form');
            const formData = new FormData(form);
            return {
              strategy_id: formData.get('strategy_id'),
              hasStrategyId: !!formData.get('strategy_id')
            };
          });
          
          console.log('📝 Form state before submission:', formState);
          
          if (!formState.hasStrategyId || formState.strategy_id === '') {
            console.error('❌ Strategy ID not properly set in form!');
          } else {
            console.log('✅ Strategy ID properly set in form');
          }
        }
      }
      
    } catch (error) {
      console.error('❌ Error waiting for strategies:', error.message);
      
      // Check for network issues
      const networkErrors = await page.evaluate(() => {
        return window.performance.getEntries()
          .filter(entry => entry.initiatorType === 'fetch' || entry.initiatorType === 'xmlhttprequest')
          .filter(entry => entry.response && entry.response.status >= 400);
      });
      
      if (networkErrors.length > 0) {
        console.log('🌐 Network errors detected:', networkErrors);
      }
    }
    
    // Take screenshot for visual verification
    const screenshot = await page.screenshot({ 
      path: 'strategy-selection-diagnosis.png',
      fullPage: true 
    });
    console.log('📸 Screenshot saved: strategy-selection-diagnosis.png');
    
  } catch (error) {
    console.error('❌ Diagnosis failed:', error);
  } finally {
    await browser.close();
  }
}

// Run the diagnosis
diagnoseStrategySelection().then(() => {
  console.log('🏁 Strategy selection diagnosis completed');
  process.exit(0);
}).catch(error => {
  console.error('💥 Diagnosis failed:', error);
  process.exit(1);
});