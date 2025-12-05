/**
 * Simple TorchCard Test Script
 * 
 * This script tests the TorchCard component on the trades page
 * to verify the torch effect is working as designed.
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// Test configuration
const TEST_CONFIG = {
  baseURL: 'http://localhost:3000',
  tradesURL: 'http://localhost:3000/trades',
  timeout: 30000,
  screenshotDir: './torch-card-test-screenshots',
  testResults: {
    passed: 0,
    failed: 0,
    total: 0,
    details: []
  }
};

// Helper function to log test results
function logTestResult(testName, passed, details = '') {
  TEST_CONFIG.testResults.total++;
  if (passed) {
    TEST_CONFIG.testResults.passed++;
    console.log(`✅ PASS: ${testName}`);
    if (details) console.log(`   Details: ${details}`);
  } else {
    TEST_CONFIG.testResults.failed++;
    console.log(`❌ FAIL: ${testName}`);
    if (details) console.log(`   Details: ${details}`);
  }
  
  TEST_CONFIG.testResults.details.push({
    test: testName,
    passed,
    details,
    timestamp: new Date().toISOString()
  });
}

// Helper function to take screenshot
async function takeScreenshot(page, name, description) {
  const screenshotPath = path.join(TEST_CONFIG.screenshotDir, `${name}.png`);
  await page.screenshot({ 
    path: screenshotPath, 
    fullPage: false,
    clip: { x: 0, y: 0, width: 1200, height: 800 }
  });
  console.log(`📸 Screenshot saved: ${screenshotPath}`);
  return screenshotPath;
}

// Test 1: Check if TorchCard component is properly implemented
async function testTorchCardImplementation(page) {
  console.log('\n=== Test 1: TorchCard Implementation ===');
  
  // Check if TorchCard component is loaded
  const torchCardExists = await page.evaluate(() => {
    // Check if TorchCard component is defined in the React component tree
    const elements = document.querySelectorAll('[class*="relative overflow-hidden rounded-xl"]');
    return elements.length > 0;
  });
  
  logTestResult(
    'TorchCard component exists in DOM',
    torchCardExists,
    `Found ${torchCardExists ? 'TorchCard elements' : 'no TorchCard elements'}`
  );
  
  // Count TorchCard elements
  const torchCardCount = await page.evaluate(() => {
    return document.querySelectorAll('[class*="relative overflow-hidden rounded-xl"]').length;
  });
  
  logTestResult(
    'TorchCard component count',
    torchCardCount >= 4, // At least 4 statistics cards
    `Found ${torchCardCount} TorchCard elements`
  );
}

// Test 2: Test visual appearance of torch effect
async function testTorchEffectVisual(page) {
  console.log('\n=== Test 2: Torch Effect Visual Appearance ===');
  
  // Find a TorchCard element to test
  const torchCard = await page.locator('[class*="relative overflow-hidden rounded-xl"]').first();
  
  if (!await torchCard.isVisible()) {
    logTestResult(
      'Torch Effect Visual - No TorchCard found',
      false,
      'No TorchCard elements found to test visual effect'
    );
    return;
  }
  
  // Take screenshot before hover
  await takeScreenshot(page, 'torch-before-hover', 'TorchCard before hover');
  
  // Hover over the TorchCard
  await torchCard.hover();
  await page.waitForTimeout(500); // Wait for hover effect to apply
  
  // Take screenshot during hover
  await takeScreenshot(page, 'torch-during-hover', 'TorchCard during hover');
  
  // Check if torch effect elements are created on hover
  const hasTorchEffect = await page.evaluate(() => {
    const torchCards = document.querySelectorAll('[class*="relative overflow-hidden rounded-xl"]');
    if (torchCards.length === 0) return false;
    
    const firstCard = torchCards[0];
    const torchLayers = firstCard.querySelectorAll('div[class*="pointer-events-none absolute"]');
    
    return torchLayers.length >= 2; // Should have at least 2 layers (inner glow and border beam)
  });
  
  logTestResult(
    'Torch Effect Visual - Layers Created',
    hasTorchEffect,
    'Torch effect layers created on hover'
  );
  
  // Check opacity values
  const opacityCorrect = await page.evaluate(() => {
    const torchCards = document.querySelectorAll('[class*="relative overflow-hidden rounded-xl"]');
    if (torchCards.length === 0) return false;
    
    const firstCard = torchCards[0];
    const torchLayers = firstCard.querySelectorAll('div[class*="pointer-events-none absolute"]');
    
    if (torchLayers.length < 2) return false;
    
    // Check first layer (inner glow) - should have very low opacity
    const innerGlow = torchLayers[0];
    const innerGlowOpacity = innerGlow.style.opacity;
    
    // Check second layer (border beam) - should have higher opacity
    const borderBeam = torchLayers[1];
    const borderBeamOpacity = borderBeam.style.opacity;
    
    return {
      innerGlowOpacity,
      borderBeamOpacity,
      innerGlowLow: parseFloat(innerGlowOpacity) <= 0.1, // Should be very low
      borderBeamHigher: parseFloat(borderBeamOpacity) >= 0.5 // Should be higher
    };
  });
  
  if (opacityCorrect) {
    logTestResult(
      'Torch Effect Visual - Opacity Values',
      true,
      `Inner glow: ${opacityCorrect.innerGlowOpacity}, Border beam: ${opacityCorrect.borderBeamOpacity}`
    );
    
    logTestResult(
      'Torch Effect Visual - Inner Glow Opacity',
      opacityCorrect.innerGlowLow,
      'Inner glow has very low opacity (≤0.1)'
    );
    
    logTestResult(
      'Torch Effect Visual - Border Beam Opacity',
      opacityCorrect.borderBeamHigher,
      'Border beam has higher opacity (≥0.5)'
    );
  } else {
    logTestResult(
      'Torch Effect Visual - Opacity Values',
      false,
      'Could not verify opacity values'
    );
  }
  
  // Check color values
  const colorCorrect = await page.evaluate(() => {
    const torchCards = document.querySelectorAll('[class*="relative overflow-hidden rounded-xl"]');
    if (torchCards.length === 0) return false;
    
    const firstCard = torchCards[0];
    const torchLayers = firstCard.querySelectorAll('div[class*="pointer-events-none absolute"]');
    
    if (torchLayers.length < 2) return false;
    
    // Check inner glow - should be white
    const innerGlow = torchLayers[0];
    const innerGlowBg = innerGlow.style.background;
    
    // Check border beam - should be gold
    const borderBeam = torchLayers[1];
    const borderBeamBg = borderBeam.style.background;
    
    return {
      innerGlowBg,
      borderBeamBg,
      innerGlowWhite: innerGlowBg && innerGlowBg.includes('255, 255, 255'), // White RGB
      borderBeamGold: borderBeamBg && borderBeamBg.includes('197, 160, 101') // Gold RGB
    };
  });
  
  if (colorCorrect) {
    logTestResult(
      'Torch Effect Visual - Inner Glow Color',
      colorCorrect.innerGlowWhite,
      'Inner glow is white (RGB 255, 255, 255)'
    );
    
    logTestResult(
      'Torch Effect Visual - Border Beam Color',
      colorCorrect.borderBeamGold,
      'Border beam is gold (RGB 197, 160, 101)'
    );
  } else {
    logTestResult(
      'Torch Effect Visual - Colors',
      false,
      'Could not verify color values'
    );
  }
  
  // Move mouse away to hide effect
  await page.mouse.move(0, 0);
  await page.waitForTimeout(500);
  
  // Take screenshot after hover
  await takeScreenshot(page, 'torch-after-hover', 'TorchCard after hover');
}

// Test 3: Test mouse tracking functionality
async function testMouseTracking(page) {
  console.log('\n=== Test 3: Mouse Tracking Functionality ===');
  
  // Find a TorchCard element
  const torchCard = await page.locator('[class*="relative overflow-hidden rounded-xl"]').first();
  
  if (!await torchCard.isVisible()) {
    logTestResult(
      'Mouse Tracking - No TorchCard found',
      false,
      'No TorchCard elements found to test mouse tracking'
    );
    return;
  }
  
  // Get bounding box of TorchCard
  const boundingBox = await torchCard.boundingBox();
  
  if (!boundingBox) {
    logTestResult(
      'Mouse Tracking - Cannot get bounding box',
      false,
      'Could not get bounding box of TorchCard'
    );
    return;
  }
  
  // Test mouse tracking at different positions
  const testPositions = [
    { x: boundingBox.x + 10, y: boundingBox.y + 10, name: 'Top-left corner' },
    { x: boundingBox.x + boundingBox.width / 2, y: boundingBox.y + 10, name: 'Top-center' },
    { x: boundingBox.x + boundingBox.width - 10, y: boundingBox.y + 10, name: 'Top-right corner' },
    { x: boundingBox.x + 10, y: boundingBox.y + boundingBox.height / 2, name: 'Middle-left' },
    { x: boundingBox.x + boundingBox.width / 2, y: boundingBox.y + boundingBox.height / 2, name: 'Center' },
    { x: boundingBox.x + boundingBox.width - 10, y: boundingBox.y + boundingBox.height / 2, name: 'Middle-right' },
    { x: boundingBox.x + 10, y: boundingBox.y + boundingBox.height - 10, name: 'Bottom-left corner' },
    { x: boundingBox.x + boundingBox.width / 2, y: boundingBox.y + boundingBox.height - 10, name: 'Bottom-center' },
    { x: boundingBox.x + boundingBox.width - 10, y: boundingBox.y + boundingBox.height - 10, name: 'Bottom-right corner' }
  ];
  
  for (const position of testPositions) {
    // Move mouse to position
    await page.mouse.move(position.x, position.y);
    await page.waitForTimeout(200); // Wait for effect to update
    
    // Check if torch effect follows cursor
    const trackingWorks = await page.evaluate((pos) => {
      const torchCards = document.querySelectorAll('[class*="relative overflow-hidden rounded-xl"]');
      if (torchCards.length === 0) return false;
      
      const firstCard = torchCards[0];
      const torchLayers = firstCard.querySelectorAll('div[class*="pointer-events-none absolute"]');
      
      if (torchLayers.length < 2) return false;
      
      // Check if background position follows cursor
      const innerGlow = torchLayers[0];
      const borderBeam = torchLayers[1];
      
      const innerGlowBg = innerGlow.style.background;
      const borderBeamBg = borderBeam.style.background;
      
      // Background should include cursor position
      const rect = firstCard.getBoundingClientRect();
      const relativeX = pos.x - rect.left;
      const relativeY = pos.y - rect.top;
      
      return innerGlowBg && innerGlowBg.includes(`${relativeX}px ${relativeY}px`) &&
             borderBeamBg && borderBeamBg.includes(`${relativeX}px ${relativeY}px`);
    }, { x: position.x, y: position.y });
    
    logTestResult(
      `Mouse Tracking - ${position.name}`,
      trackingWorks,
      `Torch effect follows cursor at ${position.name}`
    );
  }
  
  // Move mouse away to hide effect
  await page.mouse.move(0, 0);
  await page.waitForTimeout(500);
}

// Test 4: Test torch effect only appears on hover
async function testHoverBehavior(page) {
  console.log('\n=== Test 4: Hover Behavior ===');
  
  // Find a TorchCard element
  const torchCard = await page.locator('[class*="relative overflow-hidden rounded-xl"]').first();
  
  if (!await torchCard.isVisible()) {
    logTestResult(
      'Hover Behavior - No TorchCard found',
      false,
      'No TorchCard elements found to test hover behavior'
    );
    return;
  }
  
  // Check initial state (no hover)
  await page.mouse.move(0, 0); // Move mouse away
  await page.waitForTimeout(500);
  
  const noHoverOpacity = await page.evaluate(() => {
    const torchCards = document.querySelectorAll('[class*="relative overflow-hidden rounded-xl"]');
    if (torchCards.length === 0) return null;
    
    const firstCard = torchCards[0];
    const torchLayers = firstCard.querySelectorAll('div[class*="pointer-events-none absolute"]');
    
    if (torchLayers.length < 2) return null;
    
    return {
      innerGlow: torchLayers[0].style.opacity,
      borderBeam: torchLayers[1].style.opacity
    };
  });
  
  // Hover over the TorchCard
  await torchCard.hover();
  await page.waitForTimeout(500);
  
  const hoverOpacity = await page.evaluate(() => {
    const torchCards = document.querySelectorAll('[class*="relative overflow-hidden rounded-xl"]');
    if (torchCards.length === 0) return null;
    
    const firstCard = torchCards[0];
    const torchLayers = firstCard.querySelectorAll('div[class*="pointer-events-none absolute"]');
    
    if (torchLayers.length < 2) return null;
    
    return {
      innerGlow: torchLayers[0].style.opacity,
      borderBeam: torchLayers[1].style.opacity
    };
  });
  
  // Move mouse away again
  await page.mouse.move(0, 0);
  await page.waitForTimeout(500);
  
  const afterHoverOpacity = await page.evaluate(() => {
    const torchCards = document.querySelectorAll('[class*="relative overflow-hidden rounded-xl"]');
    if (torchCards.length === 0) return null;
    
    const firstCard = torchCards[0];
    const torchLayers = firstCard.querySelectorAll('div[class*="pointer-events-none absolute"]');
    
    if (torchLayers.length < 2) return null;
    
    return {
      innerGlow: torchLayers[0].style.opacity,
      borderBeam: torchLayers[1].style.opacity
    };
  });
  
  // Analyze results
  if (noHoverOpacity && hoverOpacity && afterHoverOpacity) {
    // Check that effect is hidden initially
    const initiallyHidden = parseFloat(noHoverOpacity.innerGlow) === 0 && 
                         parseFloat(noHoverOpacity.borderBeam) === 0;
    
    logTestResult(
      'Hover Behavior - Initially Hidden',
      initiallyHidden,
      `Initial opacity: inner=${noHoverOpacity.innerGlow}, border=${noHoverOpacity.borderBeam}`
    );
    
    // Check that effect appears on hover
    const appearsOnHover = parseFloat(hoverOpacity.innerGlow) > 0 && 
                          parseFloat(hoverOpacity.borderBeam) > 0;
    
    logTestResult(
      'Hover Behavior - Appears on Hover',
      appearsOnHover,
      `Hover opacity: inner=${hoverOpacity.innerGlow}, border=${hoverOpacity.borderBeam}`
    );
    
    // Check that effect disappears when mouse leaves
    const disappearsAfterHover = parseFloat(afterHoverOpacity.innerGlow) === 0 && 
                             parseFloat(afterHoverOpacity.borderBeam) === 0;
    
    logTestResult(
      'Hover Behavior - Disappears After Hover',
      disappearsAfterHover,
      `After hover opacity: inner=${afterHoverOpacity.innerGlow}, border=${afterHoverOpacity.borderBeam}`
    );
  } else {
    logTestResult(
      'Hover Behavior - Could not test',
      false,
      'Could not get opacity values'
    );
  }
}

// Test 5: Check for console errors or warnings
async function testConsoleErrors(page) {
  console.log('\n=== Test 5: Console Errors and Warnings ===');
  
  const consoleMessages = [];
  
  // Capture console messages
  page.on('console', msg => {
    if (msg.type() === 'error' || msg.type() === 'warning') {
      consoleMessages.push({
        type: msg.type(),
        text: msg.text(),
        location: msg.location()
      });
    }
  });
  
  // Navigate to trades page to trigger any console messages
  await page.goto(TEST_CONFIG.tradesURL, { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000); // Wait for any async operations
  
  // Check for TorchCard-related errors
  const torchCardErrors = consoleMessages.filter(msg => 
    (msg.text && msg.text.toLowerCase().includes('torchcard')) ||
    (msg.text && msg.text.toLowerCase().includes('torch')) ||
    (msg.text && msg.text.toLowerCase().includes('mouse')) ||
    (msg.text && msg.text.toLowerCase().includes('position')) ||
    (msg.text && msg.text.toLowerCase().includes('opacity'))
  );
  
  if (torchCardErrors.length === 0) {
    logTestResult(
      'Console Errors - No TorchCard errors',
      true,
      'No TorchCard-related errors or warnings found'
    );
  } else {
    logTestResult(
      'Console Errors - TorchCard errors found',
      false,
      `Found ${torchCardErrors.length} TorchCard-related errors/warnings`
    );
    
    torchCardErrors.forEach(error => {
      console.log(`   ${error.type.toUpperCase()}: ${error.text}`);
      if (error.location) {
        console.log(`   Location: ${error.location.url}:${error.location.lineNumber}`);
      }
    });
  }
  
  // Check for any JavaScript errors
  const jsErrors = consoleMessages.filter(msg => msg.type === 'error');
  
  if (jsErrors.length === 0) {
    logTestResult(
      'Console Errors - No JavaScript errors',
      true,
      'No JavaScript errors found'
    );
  } else {
    logTestResult(
      'Console Errors - JavaScript errors found',
      false,
      `Found ${jsErrors.length} JavaScript errors`
    );
    
    jsErrors.forEach(error => {
      console.log(`   ERROR: ${error.text}`);
      if (error.location) {
        console.log(`   Location: ${error.location.url}:${error.location.lineNumber}`);
      }
    });
  }
}

// Main test function
async function runTests() {
  console.log('🔥 Starting TorchCard Simple Test\n');
  
  // Create screenshot directory
  if (!fs.existsSync(TEST_CONFIG.screenshotDir)) {
    fs.mkdirSync(TEST_CONFIG.screenshotDir, { recursive: true });
  }
  
  const browser = await chromium.launch({ 
    headless: false, // Set to true for headless mode
    slowMo: 100 // Slow down actions for better visibility
  });
  
  const context = await browser.newContext({
    viewport: { width: 1200, height: 800 }
  });
  
  const page = await context.newPage();
  
  try {
    // Navigate to trades page
    console.log(`📱 Navigating to ${TEST_CONFIG.tradesURL}`);
    await page.goto(TEST_CONFIG.tradesURL, { waitUntil: 'networkidle' });
    
    // Wait for page to load
    await page.waitForTimeout(3000);
    
    // Take initial screenshot
    await takeScreenshot(page, 'trades-page-initial', 'Trades page initial state');
    
    // Run all tests
    await testTorchCardImplementation(page);
    await testTorchEffectVisual(page);
    await testMouseTracking(page);
    await testHoverBehavior(page);
    await testConsoleErrors(page);
    
  } catch (error) {
    console.error('❌ Test execution error:', error);
    logTestResult(
      'Test Execution',
      false,
      `Error during test execution: ${error.message}`
    );
  } finally {
    await browser.close();
  }
  
  // Generate test report
  generateTestReport();
}

// Generate test report
function generateTestReport() {
  console.log('\n📊 TEST REPORT');
  console.log('='.repeat(50));
  console.log(`Total Tests: ${TEST_CONFIG.testResults.total}`);
  console.log(`Passed: ${TEST_CONFIG.testResults.passed}`);
  console.log(`Failed: ${TEST_CONFIG.testResults.failed}`);
  console.log(`Success Rate: ${((TEST_CONFIG.testResults.passed / TEST_CONFIG.testResults.total) * 100).toFixed(1)}%`);
  console.log('='.repeat(50));
  
  // Save detailed report to file
  const reportData = {
    summary: {
      total: TEST_CONFIG.testResults.total,
      passed: TEST_CONFIG.testResults.passed,
      failed: TEST_CONFIG.testResults.failed,
      successRate: ((TEST_CONFIG.testResults.passed / TEST_CONFIG.testResults.total) * 100).toFixed(1)
    },
    details: TEST_CONFIG.testResults.details,
    timestamp: new Date().toISOString()
  };
  
  const reportPath = path.join(TEST_CONFIG.screenshotDir, 'torch-card-simple-test-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
  
  console.log(`\n📄 Detailed report saved to: ${reportPath}`);
  console.log(`📸 Screenshots saved to: ${TEST_CONFIG.screenshotDir}`);
  
  return reportData;
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = {
  runTests,
  generateTestReport,
  TEST_CONFIG
};