// Test script to verify the race condition fix in StrategyPerformanceModal
const { chromium } = require('playwright');

async function testRaceConditionFix() {
  console.log('🚀 Starting race condition fix verification...');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Listen for console events
  const consoleMessages = [];
  page.on('console', msg => {
    const text = msg.text();
    consoleMessages.push(text);
    
    // Filter for relevant debug messages
    if (text.includes('[DEBUG]') && (
      text.includes('Strategy validation') || 
      text.includes('loadTradeData') ||
      text.includes('Cannot load trade data')
    )) {
      console.log('🔍', text);
    }
  });
  
  try {
    // Navigate to the app
    console.log('📍 Navigating to the application...');
    await page.goto('http://localhost:3000');
    
    // Wait for app to load
    await page.waitForTimeout(3000);
    
    // Login with test credentials
    console.log('🔐 Logging in with test credentials...');
    await page.fill('input[type="email"]', 'testuser@verotrade.com');
    await page.fill('input[type="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');
    
    // Wait for login to complete
    await page.waitForTimeout(5000);
    
    // Navigate to strategies page where strategies are displayed
    console.log('📍 Navigating to strategies page...');
    await page.goto('http://localhost:3000/strategies');
    await page.waitForTimeout(3000);
    
    // Look for strategy cards
    console.log('🔍 Looking for strategy cards...');
    const strategyCards = await page.$$('[class*="glass"], [class*="card"], [class*="strategy"]');
    console.log(`📊 Found ${strategyCards.length} potential strategy cards`);
    
    if (strategyCards.length === 0) {
      console.log('❌ No strategy cards found, cannot test race condition');
      return;
    }
    
    // Look for "View Performance Details" button within the strategy cards
    console.log('🔍 Looking for "View Performance Details" button...');
    const performanceButtons = await page.$$('button:has-text("View Performance Details")');
    console.log(`📊 Found ${performanceButtons.length} performance buttons`);
    
    if (performanceButtons.length > 0) {
      // Click on the first "View Performance Details" button
      console.log('🎯 Clicking on "View Performance Details" button...');
      await performanceButtons[0].click();
      await page.waitForTimeout(2000);
    } else {
      // Try clicking the first strategy card
      console.log('🎯 No performance button found, clicking on first strategy card...');
      await strategyCards[0].click();
      await page.waitForTimeout(2000);
    }
    
    // Check if modal is open
    const modalOpen = await page.isVisible('[class*="modal"], [class*="Modal"]');
    console.log(`📋 Modal open: ${modalOpen}`);
    
    if (modalOpen) {
      console.log('✅ Modal detected, monitoring for race condition...');
      
      // Wait for a few seconds to collect debug messages
      await page.waitForTimeout(5000);
      
      // Analyze console messages for race condition indicators
      const validationMessages = consoleMessages.filter(msg => 
        msg.includes('Strategy validation') && msg.includes('completed')
      );
      
      const loadTradeDataMessages = consoleMessages.filter(msg => 
        msg.includes('loadTradeData called')
      );
      
      const errorMessages = consoleMessages.filter(msg => 
        msg.includes('Cannot load trade data: Invalid strategy')
      );
      
      console.log('\n📊 RACE CONDITION ANALYSIS:');
      console.log(`=====================================`);
      console.log(`Validation completion events: ${validationMessages.length}`);
      console.log(`Trade data load attempts: ${loadTradeDataMessages.length}`);
      console.log(`Invalid strategy errors: ${errorMessages.length}`);
      
      // Check if race condition is fixed
      const raceConditionDetected = errorMessages.length > 0;
      
      if (!raceConditionDetected) {
        console.log('✅ RACE CONDITION FIXED: No "Invalid strategy" errors detected');
        
        // Verify proper execution order
        if (validationMessages.length > 0 && loadTradeDataMessages.length > 0) {
          console.log('✅ EXECUTION ORDER: Validation and data loading both occurred');
        }
      } else {
        console.log('❌ RACE CONDITION STILL EXISTS: "Invalid strategy" errors detected');
      }
      
      // Close modal
      await page.keyboard.press('Escape');
      await page.waitForTimeout(1000);
    } else {
      console.log('❌ No modal detected, cannot test race condition');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

// Run the test
testRaceConditionFix().catch(console.error);