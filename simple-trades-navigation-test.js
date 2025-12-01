/**
 * Simple Trades Tab Navigation Test Script
 * 
 * This script tests the Trades tab navigation functionality using a simpler approach
 * to verify that the freezing issue has been resolved.
 */

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

// Test configuration
const BASE_URL = 'http://localhost:3000';
const SCREENSHOT_DIR = './trades-navigation-test-screenshots';

// Create screenshot directory if it doesn't exist
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

// Test results
const testResults = {
  startTime: new Date().toISOString(),
  tests: [],
  summary: { passed: 0, failed: 0, total: 0 }
};

/**
 * Log test result
 */
function logTestResult(testName, passed, details = '', screenshot = '') {
  const result = {
    testName,
    passed,
    details,
    screenshot,
    timestamp: new Date().toISOString()
  };
  
  testResults.tests.push(result);
  testResults.summary.total++;
  if (passed) {
    testResults.summary.passed++;
    console.log(`✅ PASSED: ${testName} - ${details}`);
  } else {
    testResults.summary.failed++;
    console.log(`❌ FAILED: ${testName} - ${details}`);
  }
}

/**
 * Take a screenshot with a descriptive filename
 */
async function takeScreenshot(page, testName, step) {
  const filename = `${testName}_${step}_${Date.now()}.png`;
  const filepath = path.join(SCREENSHOT_DIR, filename);
  await page.screenshot({ path: filepath, fullPage: true });
  console.log(`📸 Screenshot saved: ${filename}`);
  return filepath;
}

/**
 * Wait for a specified time
 */
function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Test navigation to Trades page
 */
async function testNavigationToTrades(page) {
  const testName = 'Navigate to Trades page';
  
  try {
    console.log('🧭 Testing navigation to Trades page...');
    
    // Navigate to home page first
    await page.goto(BASE_URL, { waitUntil: 'networkidle2' });
    await wait(2000);
    
    // Take screenshot before navigation
    await takeScreenshot(page, testName, 'before-navigation');
    
    // Find and click Trades link
    const tradesLink = await page.waitForSelector('a[href="/trades"], nav a[href*="trades"]', { timeout: 10000 });
    await tradesLink.click();
    
    // Wait for navigation
    await wait(3000);
    
    // Check if we're on Trades page
    const currentUrl = page.url();
    const onTradesPage = currentUrl.includes('/trades');
    
    // Take screenshot after navigation
    const screenshot = await takeScreenshot(page, testName, 'after-navigation');
    
    // Check if page loaded correctly
    const pageLoaded = await page.evaluate(() => {
      return document.title && document.body && document.body.innerText.length > 100;
    });
    
    const success = onTradesPage && pageLoaded;
    logTestResult(testName, success, 
      success ? `Successfully navigated to Trades page` : `Failed to navigate to Trades page. Current URL: ${currentUrl}`,
      screenshot
    );
    
    return success;
  } catch (error) {
    const screenshot = await takeScreenshot(page, testName, 'error');
    logTestResult(testName, false, `Error: ${error.message}`, screenshot);
    return false;
  }
}

/**
 * Test navigation away from Trades page
 */
async function testNavigationAwayFromTrades(page) {
  const testName = 'Navigate away from Trades page';
  
  try {
    console.log('🧭 Testing navigation away from Trades page...');
    
    // Ensure we're on Trades page first
    await page.goto(`${BASE_URL}/trades`, { waitUntil: 'networkidle2' });
    await wait(3000);
    
    // Take screenshot before navigation
    await takeScreenshot(page, testName, 'on-trades-page');
    
    // Try to navigate to Dashboard
    const dashboardLink = await page.waitForSelector('a[href="/dashboard"], nav a[href*="dashboard"]', { timeout: 5000 });
    await dashboardLink.click();
    
    // Wait for navigation
    await wait(3000);
    
    // Check if we're on Dashboard page
    const currentUrl = page.url();
    const onDashboardPage = currentUrl.includes('/dashboard');
    
    // Take screenshot after navigation
    const screenshot = await takeScreenshot(page, testName, 'navigated-to-dashboard');
    
    const success = onDashboardPage;
    logTestResult(testName, success, 
      success ? `Successfully navigated away from Trades to Dashboard` : `Failed to navigate away from Trades. Current URL: ${currentUrl}`,
      screenshot
    );
    
    return success;
  } catch (error) {
    const screenshot = await takeScreenshot(page, testName, 'error');
    logTestResult(testName, false, `Error: ${error.message}`, screenshot);
    return false;
  }
}

/**
 * Test menu button responsiveness after visiting Trades
 */
async function testMenuResponsiveness(page) {
  const testName = 'Menu responsiveness after Trades';
  
  try {
    console.log('🖱️ Testing menu button responsiveness...');
    
    // Navigate to Trades page first
    await page.goto(`${BASE_URL}/trades`, { waitUntil: 'networkidle2' });
    await wait(3000);
    
    // Take screenshot on Trades page
    await takeScreenshot(page, testName, 'on-trades-page');
    
    // Check if menu items are visible and clickable
    const menuItems = await page.evaluate(() => {
      const items = document.querySelectorAll('nav a, [role="navigation"] a, .nav-link');
      return Array.from(items).map(el => ({
        href: el.href,
        text: el.textContent?.trim(),
        visible: el.offsetParent !== null,
        hasPointerEvents: window.getComputedStyle(el).pointerEvents !== 'none',
        zIndex: parseInt(window.getComputedStyle(el).zIndex) || 0
      }));
    });
    
    console.log(`📊 Found ${menuItems.length} menu items:`, menuItems);
    
    // Check if we can click on a menu item
    const dashboardLink = await page.waitForSelector('a[href="/dashboard"], nav a[href*="dashboard"]', { timeout: 5000 });
    await dashboardLink.click();
    
    // Wait for navigation
    await wait(2000);
    
    // Check if navigation worked
    const currentUrl = page.url();
    const navigationWorked = currentUrl.includes('/dashboard');
    
    // Take final screenshot
    const screenshot = await takeScreenshot(page, testName, 'after-menu-click');
    
    const visibleMenuItems = menuItems.filter(item => item.visible && item.hasPointerEvents);
    const success = navigationWorked && visibleMenuItems.length > 0;
    
    const details = `Menu items visible: ${visibleMenuItems.length}, Navigation worked: ${navigationWorked}`;
    
    logTestResult(testName, success, details, screenshot);
    
    return success;
  } catch (error) {
    const screenshot = await takeScreenshot(page, testName, 'error');
    logTestResult(testName, false, `Error: ${error.message}`, screenshot);
    return false;
  }
}

/**
 * Test complete navigation cycle
 */
async function testCompleteNavigationCycle(page) {
  const testName = 'Complete navigation cycle';
  
  try {
    console.log('🔄 Testing complete navigation cycle...');
    
    // Start on Dashboard
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle2' });
    await wait(2000);
    await takeScreenshot(page, testName, 'start-dashboard');
    
    // Navigate to Trades
    const tradesLink = await page.waitForSelector('a[href="/trades"], nav a[href*="trades"]', { timeout: 5000 });
    await tradesLink.click();
    await wait(3000);
    await takeScreenshot(page, testName, 'on-trades');
    
    // Navigate to Strategies
    const strategiesLink = await page.waitForSelector('a[href="/strategies"], nav a[href*="strategies"]', { timeout: 5000 });
    await strategiesLink.click();
    await wait(3000);
    await takeScreenshot(page, testName, 'on-strategies');
    
    // Navigate back to Trades
    const backToTradesLink = await page.waitForSelector('a[href="/trades"], nav a[href*="trades"]', { timeout: 5000 });
    await backToTradesLink.click();
    await wait(3000);
    await takeScreenshot(page, testName, 'back-to-trades');
    
    // Navigate to Calendar
    const calendarLink = await page.waitForSelector('a[href="/calendar"], nav a[href*="calendar"]', { timeout: 5000 });
    await calendarLink.click();
    await wait(3000);
    await takeScreenshot(page, testName, 'on-calendar');
    
    // Check final URL
    const finalUrl = page.url();
    const success = finalUrl.includes('/calendar');
    
    const screenshot = await takeScreenshot(page, testName, 'final');
    logTestResult(testName, success, 
      success ? `Successfully completed navigation cycle` : `Navigation cycle failed. Final URL: ${finalUrl}`,
      screenshot
    );
    
    return success;
  } catch (error) {
    const screenshot = await takeScreenshot(page, testName, 'error');
    logTestResult(testName, false, `Error: ${error.message}`, screenshot);
    return false;
  }
}

/**
 * Main test function
 */
async function runSimpleTradesNavigationTest() {
  console.log('🚀 Starting Simple Trades Tab Navigation Test\n');
  
  const browser = await puppeteer.launch({
    headless: false, // Set to true for headless mode
    defaultViewport: null,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    
    // Run tests
    const results = [];
    
    results.push({
      test: 'Navigation to Trades',
      passed: await testNavigationToTrades(page)
    });
    
    results.push({
      test: 'Navigation away from Trades',
      passed: await testNavigationAwayFromTrades(page)
    });
    
    results.push({
      test: 'Menu responsiveness after Trades',
      passed: await testMenuResponsiveness(page)
    });
    
    results.push({
      test: 'Complete navigation cycle',
      passed: await testCompleteNavigationCycle(page)
    });
    
    // Generate final report
    const endTime = new Date().toISOString();
    const finalReport = {
      ...testResults,
      endTime,
      duration: new Date(endTime) - new Date(testResults.startTime),
      testResults: results,
      overallSuccess: results.every(result => result.passed)
    };
    
    // Save report to file
    const reportPath = './simple-trades-navigation-test-report.json';
    fs.writeFileSync(reportPath, JSON.stringify(finalReport, null, 2));
    
    console.log('\n📋 FINAL TEST REPORT');
    console.log('='.repeat(50));
    console.log(`Total tests: ${finalReport.summary.total}`);
    console.log(`Passed: ${finalReport.summary.passed}`);
    console.log(`Failed: ${finalReport.summary.failed}`);
    console.log(`Overall success: ${finalReport.overallSuccess ? '✅ YES' : '❌ NO'}`);
    console.log(`Duration: ${finalReport.duration}ms`);
    console.log(`Report saved to: ${reportPath}`);
    console.log(`Screenshots saved to: ${SCREENSHOT_DIR}`);
    
    console.log('\n📊 Test results:');
    results.forEach(result => {
      console.log(`  ${result.passed ? '✅' : '❌'} ${result.test}`);
    });
    
    await page.close();
    return finalReport;
    
  } finally {
    await browser.close();
  }
}

// Run test if this file is executed directly
if (require.main === module) {
  runSimpleTradesNavigationTest()
    .then((report) => {
      process.exit(report.overallSuccess ? 0 : 1);
    })
    .catch((error) => {
      console.error('Test execution failed:', error);
      process.exit(1);
    });
}

module.exports = {
  runSimpleTradesNavigationTest,
  testNavigationToTrades,
  testNavigationAwayFromTrades,
  testMenuResponsiveness,
  testCompleteNavigationCycle
};