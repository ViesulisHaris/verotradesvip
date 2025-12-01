/**
 * Test script to verify that the navigation fix on the trades page is working correctly
 * 
 * This script will:
 * 1. Navigate to the trades page
 * 2. Test all menu buttons to ensure they work correctly
 * 3. Verify that navigation from the trades page to other pages works
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function testTradesNavigationFix() {
  console.log('🧪 Testing Trades Page Navigation Fix...');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // Navigate to the trades page
    console.log('📄 Navigating to trades page...');
    await page.goto('http://localhost:3000/trades');
    
    // Wait for the page to load
    await page.waitForSelector('.verotrade-top-navigation', { state: 'visible' });
    console.log('✅ Trades page loaded successfully');
    
    // Test navigation to all other pages from the trades page
    const navigationTests = [
      { name: 'Dashboard', href: '/dashboard', selector: 'a[href="/dashboard"]' },
      { name: 'Log Trade', href: '/log-trade', selector: 'a[href="/log-trade"]' },
      { name: 'Calendar', href: '/calendar', selector: 'a[href="/calendar"]' },
      { name: 'Strategy', href: '/strategies', selector: 'a[href="/strategies"]' },
      { name: 'Confluence', href: '/confluence', selector: 'a[href="/confluence"]' },
      { name: 'Settings', href: '/settings', selector: 'a[href="/settings"]' }
    ];
    
    for (const test of navigationTests) {
      console.log(`🧭 Testing navigation to ${test.name}...`);
      
      // Click on the navigation link
      await page.click(test.selector);
      
      // Wait for navigation to complete
      await page.waitForURL(`**${test.href}`);
      
      // Verify we're on the correct page
      const currentUrl = page.url();
      if (currentUrl.includes(test.href)) {
        console.log(`✅ Successfully navigated to ${test.name}`);
      } else {
        console.error(`❌ Failed to navigate to ${test.name}. Current URL: ${currentUrl}`);
      }
      
      // Navigate back to the trades page for the next test
      console.log('🔙 Returning to trades page...');
      await page.goto('http://localhost:3000/trades');
      await page.waitForSelector('.verotrade-top-navigation', { state: 'visible' });
    }
    
    console.log('🎉 All navigation tests passed!');
    
    // Take a screenshot for verification
    await page.screenshot({ path: 'trades-navigation-fix-verification.png', fullPage: true });
    console.log('📸 Screenshot saved: trades-navigation-fix-verification.png');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    
    // Take a screenshot for debugging
    await page.screenshot({ path: 'trades-navigation-fix-error.png', fullPage: true });
    console.log('📸 Error screenshot saved: trades-navigation-fix-error.png');
    
  } finally {
    await browser.close();
  }
}

// Run the test
testTradesNavigationFix().catch(console.error);