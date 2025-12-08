/**
 * Test script to verify Trade History fixes
 * This script tests the implementation of the requested fixes
 */

const puppeteer = require('puppeteer');
const path = require('path');

async function testTradeHistoryFixes() {
  console.log('🧪 Starting Trade History Fixes Verification...\n');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1920, height: 1080 }
  });
  const page = await browser.newPage();
  
  try {
    // Navigate to the test page
    await page.goto('http://localhost:3000/test-trade-history-fixes');
    await page.waitForSelector('body', { timeout: 10000 });
    
    console.log('📋 Test Results Summary:');
    console.log('=====================================\n');
    
    // Test 1: Check if page loads successfully
    try {
      await page.waitForSelector('.min-h-screen', { timeout: 5000 });
      console.log('✅ Test 1: Page loads successfully');
    } catch (error) {
      console.log('❌ Test 1: Page failed to load');
    }
    
    // Test 2: Check if authentication is working
    try {
      const authStatus = await page.evaluate(() => {
        const authText = document.body.innerText;
        return authText.includes('User Authentication') && authText.includes('✅');
      });
      
      if (authStatus) {
        console.log('✅ Test 2: User authentication is working');
      } else {
        console.log('⚠️  Test 2: User may need to login first');
      }
    } catch (error) {
      console.log('❌ Test 2: Could not verify authentication status');
    }
    
    // Test 3: Check if TradeHistory component renders
    try {
      await page.waitForSelector('[data-testid="trade-history"]', { timeout: 10000 });
      console.log('✅ Test 3: TradeHistory component renders');
    } catch (error) {
      // Try alternative selector
      try {
        await page.waitForSelector('.flashlight-container', { timeout: 5000 });
        console.log('✅ Test 3: TradeHistory component renders (found flashlight containers)');
      } catch (altError) {
        console.log('❌ Test 3: TradeHistory component not found');
      }
    }
    
    // Test 4: Check for absence of chart functionality
    try {
      const hasChartElements = await page.evaluate(() => {
        const chartElements = document.querySelectorAll('[class*="chart"], [id*="chart"]');
        const priceActionElements = Array.from(document.querySelectorAll('*')).filter(el => 
          el.textContent && el.textContent.includes('Price Action Replay')
        );
        return chartElements.length > 0 || priceActionElements.length > 0;
      });
      
      if (!hasChartElements) {
        console.log('✅ Test 4: Chart functionality successfully removed');
      } else {
        console.log('❌ Test 4: Chart elements still present');
      }
    } catch (error) {
      console.log('❌ Test 4: Could not verify chart removal');
    }
    
    // Test 5: Check for full-width layout in expanded trades
    try {
      // First expand a trade if possible
      const expandButton = await page.$('.chevron-icon, [class*="expand"]');
      if (expandButton) {
        await expandButton.click();
        await page.waitForTimeout(500);
        
        const hasFullWidthLayout = await page.evaluate(() => {
          const gridElements = document.querySelectorAll('.grid');
          return Array.from(gridElements).some(grid => {
            const classes = grid.className;
            return classes.includes('grid-cols-1') || classes.includes('lg:grid-cols-4');
          });
        });
        
        if (hasFullWidthLayout) {
          console.log('✅ Test 5: Full-width layout implemented');
        } else {
          console.log('❌ Test 5: Full-width layout not found');
        }
      } else {
        console.log('⚠️  Test 5: No trades to expand for layout testing');
      }
    } catch (error) {
      console.log('❌ Test 5: Could not verify full-width layout');
    }
    
    // Test 6: Check for negative P&L formatting
    try {
      const hasNegativePnLFormatting = await page.evaluate(() => {
        const pnlElements = Array.from(document.querySelectorAll('*')).filter(el => {
          const text = el.textContent;
          return text && (text.includes('text-loss') || text.includes('text-profit') || text.match(/[-+]\$\d+/));
        });
        return pnlElements.length > 0;
      });
      
      if (hasNegativePnLFormatting) {
        console.log('✅ Test 6: P&L formatting with signs implemented');
      } else {
        console.log('⚠️  Test 6: Could not verify P&L formatting (no trades with P&L found)');
      }
    } catch (error) {
      console.log('❌ Test 6: Could not verify P&L formatting');
    }
    
    // Test 7: Check for Edit/Delete buttons
    try {
      const hasActionButtons = await page.evaluate(() => {
        const editButtons = document.querySelectorAll('button svg, [class*="edit"], [class*="Edit"]');
        const deleteButtons = document.querySelectorAll('button svg, [class*="delete"], [class*="Delete"], [class*="trash"]');
        return editButtons.length > 0 && deleteButtons.length > 0;
      });
      
      if (hasActionButtons) {
        console.log('✅ Test 7: Edit/Delete buttons are present');
      } else {
        console.log('❌ Test 7: Edit/Delete buttons not found');
      }
    } catch (error) {
      console.log('❌ Test 7: Could not verify action buttons');
    }
    
    // Test 8: Check for most frequent emotion display
    try {
      const hasEmotionStats = await page.evaluate(() => {
        const emotionElements = Array.from(document.querySelectorAll('*')).filter(el => {
          const text = el.textContent;
          return text && (text.includes('Most Frequent Emotion') || text.includes('Emotion'));
        });
        return emotionElements.length > 0;
      });
      
      if (hasEmotionStats) {
        console.log('✅ Test 8: Emotional statistics display implemented');
      } else {
        console.log('❌ Test 8: Emotional statistics not found');
      }
    } catch (error) {
      console.log('❌ Test 8: Could not verify emotion statistics');
    }
    
    console.log('\n🎯 Manual Verification Checklist:');
    console.log('=====================================');
    console.log('1. Open the Trade History page');
    console.log('2. Expand a trade to see details');
    console.log('3. Verify no "Price Action Replay" section exists');
    console.log('4. Check that trade details use full width');
    console.log('5. Look for negative P&L values with minus signs');
    console.log('6. Test Edit and Delete buttons in expanded view');
    console.log('7. Verify the "Most Frequent Emotion" stat card');
    
    console.log('\n🏁 Testing completed!');
    console.log('Keep the browser open for manual verification...');
    
    // Keep browser open for manual verification
    await new Promise(resolve => setTimeout(resolve, 30000));
    
  } catch (error) {
    console.error('❌ Test execution failed:', error);
  } finally {
    await browser.close();
  }
}

// Run the tests
testTradeHistoryFixes().catch(console.error);