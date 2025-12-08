/**
 * Test script to verify log-trade page fixes
 * Tests for:
 * 1. Market type selector allowing only one selection
 * 2. Dropdown transparency and scrolling fixes
 */

const puppeteer = require('puppeteer');
const path = require('path');

async function testLogTradeFixes() {
  console.log('Starting log-trade page fixes test...\n');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1280, height: 800 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    
    // Navigate to the log-trade page
    await page.goto('http://localhost:3000/log-trade');
    await page.waitForSelector('form', { timeout: 10000 });
    
    console.log('✓ Page loaded successfully');
    
    // Test 1: Market Type Selector - Only One Selection
    console.log('\n--- Testing Market Type Selector ---');
    
    // Get all market type buttons
    const marketButtons = await page.$$('.grid button[type="button"]');
    
    // Click Stock market button
    await marketButtons[0].click();
    await page.waitForTimeout(500);
    
    // Check if Stock is selected and others are not
    const stockSelected = await page.evaluate(() => {
      const stockBtn = document.querySelectorAll('.grid button[type="button"]')[0];
      return stockBtn.classList.contains('bg-[var(--gold)]/20') || 
             stockBtn.style.backgroundColor.includes('197, 160, 101');
    });
    
    const cryptoSelected = await page.evaluate(() => {
      const cryptoBtn = document.querySelectorAll('.grid button[type="button"]')[1];
      return cryptoBtn.classList.contains('bg-[var(--gold)]/20') || 
             cryptoBtn.style.backgroundColor.includes('197, 160, 101');
    });
    
    console.log(stockSelected ? '✓ Stock market selected correctly' : '✗ Stock market not selected');
    console.log(!cryptoSelected ? '✓ Crypto market not selected (as expected)' : '✗ Crypto market incorrectly selected');
    
    // Click Crypto market button
    await marketButtons[1].click();
    await page.waitForTimeout(500);
    
    // Check if Crypto is now selected and Stock is not
    const cryptoSelectedAfter = await page.evaluate(() => {
      const cryptoBtn = document.querySelectorAll('.grid button[type="button"]')[1];
      return cryptoBtn.classList.contains('bg-[var(--gold)]/20') || 
             cryptoBtn.style.backgroundColor.includes('197, 160, 101');
    });
    
    const stockSelectedAfter = await page.evaluate(() => {
      const stockBtn = document.querySelectorAll('.grid button[type="button"]')[0];
      return stockBtn.classList.contains('bg-[var(--gold)]/20') || 
             stockBtn.style.backgroundColor.includes('197, 160, 101');
    });
    
    console.log(cryptoSelectedAfter ? '✓ Crypto market selected correctly after switch' : '✗ Crypto market not selected');
    console.log(!stockSelectedAfter ? '✓ Stock market deselected correctly' : '✗ Stock market still selected');
    
    // Test 2: Dropdown Transparency and Scrolling
    console.log('\n--- Testing Dropdown Fixes ---');
    
    // Test Strategy Dropdown
    await page.click('button:has-text("Select Strategy")');
    await page.waitForTimeout(500);
    
    // Check if dropdown is visible and not transparent
    const dropdownVisible = await page.evaluate(() => {
      const dropdown = document.querySelector('.absolute.z-50');
      if (!dropdown) return false;
      
      const styles = window.getComputedStyle(dropdown);
      return (
        styles.display !== 'none' &&
        styles.opacity !== '0' &&
        styles.backgroundColor !== 'transparent' &&
        !styles.backgroundColor.includes('rgba(0, 0, 0, 0)')
      );
    });
    
    console.log(dropdownVisible ? '✓ Strategy dropdown is visible with proper background' : '✗ Strategy dropdown has transparency issues');
    
    // Check if dropdown has proper z-index
    const dropdownZIndex = await page.evaluate(() => {
      const dropdown = document.querySelector('.absolute.z-50');
      return dropdown ? window.getComputedStyle(dropdown).zIndex : '0';
    });
    
    console.log(dropdownZIndex >= '50' ? `✓ Dropdown has proper z-index (${dropdownZIndex})` : `✗ Dropdown has low z-index (${dropdownZIndex})`);
    
    // Test dropdown scrolling
    const hasScrollableClass = await page.evaluate(() => {
      const dropdown = document.querySelector('.absolute.z-50');
      return dropdown ? dropdown.classList.contains('overflow-y-auto') : false;
    });
    
    console.log(hasScrollableClass ? '✓ Dropdown has overflow-y-auto for scrolling' : '✗ Dropdown missing scrolling class');
    
    // Test clicking outside to close dropdown
    await page.click('.fixed.inset-0.z-40');
    await page.waitForTimeout(500);
    
    const dropdownClosed = await page.evaluate(() => {
      const dropdown = document.querySelector('.absolute.z-50');
      return !dropdown || dropdown.style.display === 'none';
    });
    
    console.log(dropdownClosed ? '✓ Dropdown closes when clicking outside' : '✗ Dropdown does not close when clicking outside');
    
    // Test Side Dropdown
    await page.click('button:has-text("Buy")');
    await page.waitForTimeout(500);
    
    const sideDropdownVisible = await page.evaluate(() => {
      const dropdowns = document.querySelectorAll('.absolute.z-50');
      return dropdowns.length > 0 && window.getComputedStyle(dropdowns[dropdowns.length - 1]).display !== 'none';
    });
    
    console.log(sideDropdownVisible ? '✓ Side dropdown is visible' : '✗ Side dropdown not visible');
    
    // Close side dropdown
    await page.click('.fixed.inset-0.z-40');
    await page.waitForTimeout(500);
    
    // Test Emotional State Dropdown
    await page.click('button:has-text("Neutral")');
    await page.waitForTimeout(500);
    
    const emotionDropdownVisible = await page.evaluate(() => {
      const dropdowns = document.querySelectorAll('.absolute.z-50');
      return dropdowns.length > 0 && window.getComputedStyle(dropdowns[dropdowns.length - 1]).display !== 'none';
    });
    
    console.log(emotionDropdownVisible ? '✓ Emotional state dropdown is visible' : '✗ Emotional state dropdown not visible');
    
    // Test dropdown option hover states
    const hasHoverStates = await page.evaluate(() => {
      const dropdownItems = document.querySelectorAll('.absolute.z-50 > div > div');
      if (dropdownItems.length === 0) return false;
      
      const firstItem = dropdownItems[0];
      const styles = window.getComputedStyle(firstItem);
      
      return styles.transition && styles.transition.includes('background-color');
    });
    
    console.log(hasHoverStates ? '✓ Dropdown options have hover transitions' : '✗ Dropdown options missing hover states');
    
    // Close emotion dropdown
    await page.click('.fixed.inset-0.z-40');
    await page.waitForTimeout(500);
    
    console.log('\n--- Test Summary ---');
    console.log('All tests completed. Check the results above to verify fixes.');
    
    // Take a screenshot for visual verification
    await page.screenshot({ path: 'log-trade-fixes-verification.png', fullPage: true });
    console.log('\n📸 Screenshot saved as log-trade-fixes-verification.png');
    
  } catch (error) {
    console.error('Test failed with error:', error);
  } finally {
    await browser.close();
  }
}

// Run the test
testLogTradeFixes().catch(console.error);