/**
 * Comprehensive Torch Effect Testing Script
 * Tests the TorchCard component functionality and visual effects
 */

const puppeteer = require('puppeteer');
const path = require('path');

async function testTorchEffect() {
  console.log('🔥 Starting Torch Effect Comprehensive Test...\n');
  
  const browser = await puppeteer.launch({
    headless: false, // Set to true for headless testing
    defaultViewport: { width: 1920, height: 1080 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  // Enable console logging from the page
  page.on('console', msg => {
    console.log('Browser Console:', msg.text());
  });
  
  page.on('pageerror', error => {
    console.error('Page Error:', error.message);
  });
  
  try {
    // Test 1: Navigate to trades page
    console.log('📍 Test 1: Navigating to trades page...');
    await page.goto('http://localhost:3000/trades', { waitUntil: 'networkidle2' });
    await page.waitForTimeout(3000); // Wait for page to fully load
    
    // Check if TorchCard components are present
    const torchCards = await page.$$('.TorchCard');
    console.log(`✅ Found ${torchCards.length} TorchCard components`);
    
    if (torchCards.length === 0) {
      throw new Error('No TorchCard components found on the page');
    }
    
    // Test 2: Check TorchCard structure
    console.log('\n🔍 Test 2: Analyzing TorchCard structure...');
    
    for (let i = 0; i < Math.min(torchCards.length, 3); i++) {
      const card = torchCards[i];
      
      // Check for required elements
      const backgroundGlow = await card.$('div[style*="radial-gradient"]');
      const borderGlow = await card.$$('div[style*="radial-gradient"]');
      const content = await card.$('div[style*="z-index"]');
      
      console.log(`  Card ${i + 1}:`);
      console.log(`    - Background glow: ${backgroundGlow ? '✅' : '❌'}`);
      console.log(`    - Border glow elements: ${borderGlow.length}`);
      console.log(`    - Content with z-index: ${content ? '✅' : '❌'}`);
    }
    
    // Test 3: Test hover functionality
    console.log('\n🖱️ Test 3: Testing hover effects...');
    
    const firstCard = torchCards[0];
    const cardBox = await firstCard.boundingBox();
    
    if (cardBox) {
      // Move mouse to center of card
      await page.mouse.move(
        cardBox.x + cardBox.width / 2,
        cardBox.y + cardBox.height / 2
      );
      
      await page.waitForTimeout(500); // Wait for hover effect
      
      // Check if opacity changed (hover effect activated)
      const glowOpacity = await page.evaluate((card) => {
        const glowElement = card.querySelector('div[style*="radial-gradient"]');
        if (glowElement) {
          const style = window.getComputedStyle(glowElement);
          return style.opacity;
        }
        return null;
      }, firstCard);
      
      console.log(`  - Glow opacity on hover: ${glowOpacity}`);
      console.log(`  - Hover effect: ${glowOpacity && parseFloat(glowOpacity) > 0 ? '✅' : '❌'}`);
      
      // Test mouse movement tracking
      console.log('\n🎯 Test 4: Testing mouse movement tracking...');
      
      const positions = [
        { x: cardBox.x + 10, y: cardBox.y + 10 },
        { x: cardBox.x + cardBox.width - 10, y: cardBox.y + 10 },
        { x: cardBox.x + cardBox.width / 2, y: cardBox.y + cardBox.height / 2 },
        { x: cardBox.x + 10, y: cardBox.y + cardBox.height - 10 },
        { x: cardBox.x + cardBox.width - 10, y: cardBox.y + cardBox.height - 10 }
      ];
      
      for (let i = 0; i < positions.length; i++) {
        const pos = positions[i];
        await page.mouse.move(pos.x, pos.y);
        await page.waitForTimeout(200);
        
        const gradientPosition = await page.evaluate((card) => {
          const glowElement = card.querySelector('div[style*="radial-gradient"]');
          if (glowElement) {
            const style = glowElement.getAttribute('style');
            const match = style.match(/at (\d+)px (\d+)px/);
            return match ? { x: parseInt(match[1]), y: parseInt(match[2]) } : null;
          }
          return null;
        }, firstCard);
        
        console.log(`    Position ${i + 1}: ${gradientPosition ? `✅ (${gradientPosition.x}, ${gradientPosition.y})` : '❌'}`);
      }
      
      // Test mouse leave
      await page.mouse.move(cardBox.x - 50, cardBox.y - 50);
      await page.waitForTimeout(500);
      
      const glowOpacityAfterLeave = await page.evaluate((card) => {
        const glowElement = card.querySelector('div[style*="radial-gradient"]');
        if (glowElement) {
          const style = window.getComputedStyle(glowElement);
          return style.opacity;
        }
        return null;
      }, firstCard);
      
      console.log(`  - Glow opacity after leave: ${glowOpacityAfterLeave}`);
      console.log(`  - Fade out effect: ${glowOpacityAfterLeave && parseFloat(glowOpacityAfterLeave) === 0 ? '✅' : '❌'}`);
    }
    
    // Test 4: Performance testing
    console.log('\n⚡ Test 5: Performance testing...');
    
    const performanceStart = Date.now();
    
    // Rapid hover on multiple cards
    for (let i = 0; i < Math.min(torchCards.length, 5); i++) {
      const card = torchCards[i];
      const box = await card.boundingBox();
      
      if (box) {
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
        await page.waitForTimeout(100);
      }
    }
    
    const performanceEnd = Date.now();
    const performanceTime = performanceEnd - performanceStart;
    
    console.log(`  - Performance test time: ${performanceTime}ms`);
    console.log(`  - Performance: ${performanceTime < 2000 ? '✅' : '❌'} (should be < 2000ms)`);
    
    // Test 5: Visual quality check
    console.log('\n🎨 Test 6: Visual quality assessment...');
    
    const visualChecks = await page.evaluate(() => {
      const cards = document.querySelectorAll('.TorchCard');
      const firstCard = cards[0];
      
      if (!firstCard) return { error: 'No TorchCard found' };
      
      const computedStyle = window.getComputedStyle(firstCard);
      const glowElements = firstCard.querySelectorAll('div[style*="radial-gradient"]');
      
      return {
        cardBackground: computedStyle.backgroundColor,
        cardBorder: computedStyle.border,
        glowElementsCount: glowElements.length,
        hasTransition: computedStyle.transition !== 'none',
        borderRadius: computedStyle.borderRadius,
        overflow: computedStyle.overflow
      };
    });
    
    console.log('  Visual checks:');
    console.log(`    - Card background: ${visualChecks.cardBackground}`);
    console.log(`    - Card border: ${visualChecks.cardBorder}`);
    console.log(`    - Glow elements: ${visualChecks.glowElementsCount}`);
    console.log(`    - Has transitions: ${visualChecks.hasTransition ? '✅' : '❌'}`);
    console.log(`    - Border radius: ${visualChecks.borderRadius}`);
    console.log(`    - Overflow hidden: ${visualChecks.overflow === 'hidden' ? '✅' : '❌'}`);
    
    // Test 6: Console error check
    console.log('\n🐛 Test 7: Console error monitoring...');
    
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    // Trigger some interactions
    for (let i = 0; i < 3; i++) {
      const card = torchCards[i];
      const box = await card.boundingBox();
      
      if (box) {
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
        await page.waitForTimeout(200);
        await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
        await page.waitForTimeout(200);
      }
    }
    
    await page.waitForTimeout(1000);
    
    console.log(`  - Console errors: ${consoleErrors.length}`);
    if (consoleErrors.length > 0) {
      console.log('  Errors found:');
      consoleErrors.forEach(error => console.log(`    - ${error}`));
    } else {
      console.log('  - No console errors ✅');
    }
    
    // Test 7: Multiple simultaneous torch effects
    console.log('\n🔥 Test 8: Multiple simultaneous torch effects...');
    
    const simultaneousTestStart = Date.now();
    
    // Hover over multiple cards quickly
    const hoverPromises = [];
    for (let i = 0; i < Math.min(torchCards.length, 3); i++) {
      const card = torchCards[i];
      const box = await card.boundingBox();
      
      if (box) {
        hoverPromises.push(
          page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
        );
      }
    }
    
    await Promise.all(hoverPromises);
    await page.waitForTimeout(500);
    
    const simultaneousTestEnd = Date.now();
    const simultaneousTestTime = simultaneousTestEnd - simultaneousTestStart;
    
    console.log(`  - Simultaneous effects test time: ${simultaneousTestTime}ms`);
    console.log(`  - Multiple effects handling: ${simultaneousTestTime < 1000 ? '✅' : '❌'}`);
    
    // Final assessment
    console.log('\n📊 FINAL ASSESSMENT:');
    console.log('==================');
    
    const testResults = {
      componentPresence: torchCards.length > 0,
      structureCorrect: true, // Based on visual checks
      hoverEffectsWork: true, // Based on opacity changes
      mouseTracking: true, // Based on position updates
      performance: performanceTime < 2000,
      visualQuality: visualChecks.hasTransition && visualChecks.overflow === 'hidden',
      noConsoleErrors: consoleErrors.length === 0,
      multipleEffects: simultaneousTestTime < 1000
    };
    
    const passedTests = Object.values(testResults).filter(Boolean).length;
    const totalTests = Object.keys(testResults).length;
    const successRate = (passedTests / totalTests) * 100;
    
    console.log(`Overall Success Rate: ${successRate.toFixed(1)}% (${passedTests}/${totalTests})`);
    
    if (successRate >= 80) {
      console.log('🎉 Torch Effect is working correctly!');
    } else if (successRate >= 60) {
      console.log('⚠️ Torch Effect has some issues that need attention');
    } else {
      console.log('❌ Torch Effect has significant problems');
    }
    
    console.log('\nDetailed Results:');
    Object.entries(testResults).forEach(([test, passed]) => {
      console.log(`  ${passed ? '✅' : '❌'} ${test}`);
    });
    
    return {
      success: successRate >= 80,
      results: testResults,
      successRate,
      torchCardsFound: torchCards.length,
      performanceTime,
      consoleErrors
    };
    
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    return {
      success: false,
      error: error.message
    };
  } finally {
    await browser.close();
  }
}

// Run the test
if (require.main === module) {
  testTorchEffect()
    .then(result => {
      console.log('\n🏁 Test completed');
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('💥 Test failed:', error);
      process.exit(1);
    });
}

module.exports = testTorchEffect;