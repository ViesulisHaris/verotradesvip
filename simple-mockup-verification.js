/**
 * Simple Mockup Design Verification Test
 * 
 * This test verifies the critical fixes we made to match the colorcodeexample.png mockup
 * 
 * Key Areas Tested:
 * 1. Primary Background Color (#121212)
 * 2. Card Border Radius (12px) 
 * 3. CSS Variables Usage
 * 4. Color System Compliance
 */

const { chromium } = require('playwright');

async function runSimpleMockupVerification() {
  console.log('🎨 Starting Simple Mockup Design Verification...\n');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  
  const page = await context.newPage();
  
  try {
    // Navigate to dashboard
    console.log('📍 Navigating to dashboard...');
    await page.goto('http://localhost:3000/dashboard');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    const results = {
      backgroundColor: false,
      borderRadius: false,
      cssVariables: false,
      colorSystem: false
    };
    
    // 1. CHECK PRIMARY BACKGROUND COLOR
    console.log('\n🎨 1. PRIMARY BACKGROUND COLOR CHECK');
    console.log('=' .repeat(40));
    
    const bodyBg = await page.evaluate(() => {
      return window.getComputedStyle(document.body).backgroundColor;
    });
    
    console.log(`📊 Body Background: ${bodyBg}`);
    console.log(`   Expected: rgb(18, 18, 18) (#121212)`);
    
    if (bodyBg.includes('18, 18, 18') || bodyBg.includes('#121212')) {
      results.backgroundColor = true;
      console.log('   ✅ PASS - Correct deep charcoal background');
    } else {
      console.log('   ❌ FAIL - Background color does not match mockup');
    }
    
    // 2. CHECK CARD BORDER RADIUS (CRITICAL: Must be 12px)
    console.log('\n📐 2. CARD BORDER RADIUS CHECK');
    console.log('=' .repeat(40));
    
    const cardRadius = await page.evaluate(() => {
      const cards = document.querySelectorAll('.dashboard-card');
      if (cards.length > 0) {
        return window.getComputedStyle(cards[0]).borderRadius;
      }
      return null;
    });
    
    console.log(`📊 Card Border Radius: ${cardRadius}`);
    console.log(`   Expected: 12px (CRITICAL - not 16px)`);
    
    if (cardRadius && cardRadius.includes('12px')) {
      results.borderRadius = true;
      console.log('   ✅ PASS - Correct 12px border radius');
    } else {
      console.log('   ❌ FAIL - Border radius does not match mockup specification');
    }
    
    // 3. CHECK CSS VARIABLES
    console.log('\n🔧 3. CSS VARIABLES CHECK');
    console.log('=' .repeat(40));
    
    const cssVarsCheck = await page.evaluate(() => {
      const rootStyle = getComputedStyle(document.documentElement);
      const criticalVars = [
        '--deep-charcoal',
        '--soft-graphite',
        '--warm-off-white',
        '--muted-gray',
        '--dusty-gold',
        '--radius-card'
      ];
      
      const found = criticalVars.filter(varName => {
        const value = rootStyle.getPropertyValue(varName);
        return value && value.trim() !== '';
      });
      
      return {
        found: found.length,
        total: criticalVars.length,
        details: found
      };
    });
    
    console.log(`📊 CSS Variables Found: ${cssVarsCheck.found}/${cssVarsCheck.total}`);
    
    if (cssVarsCheck.found >= cssVarsCheck.total * 0.8) { // 80% of variables found
      results.cssVariables = true;
      console.log('   ✅ PASS - Most critical CSS variables are defined');
    } else {
      console.log('   ❌ FAIL - Missing critical CSS variables');
    }
    
    // 4. CHECK COLOR SYSTEM
    console.log('\n🎨 4. COLOR SYSTEM CHECK');
    console.log('=' .repeat(40));
    
    const colorCheck = await page.evaluate(() => {
      const cards = document.querySelectorAll('.dashboard-card');
      if (cards.length === 0) return { found: false };
      
      const cardStyle = getComputedStyle(cards[0]);
      const bg = cardStyle.backgroundColor;
      
      // Check if it's using the correct soft graphite color
      const isCorrectBg = bg.includes('32, 32, 32') || bg.includes('#202020');
      
      return {
        found: true,
        background: bg,
        isCorrect: isCorrectBg
      };
    });
    
    console.log(`📊 Card Background Color: ${colorCheck.background}`);
    console.log(`   Expected: rgb(32, 32, 32) (#202020)`);
    
    if (colorCheck.isCorrect) {
      results.colorSystem = true;
      console.log('   ✅ PASS - Correct soft graphite card background');
    } else {
      console.log('   ❌ FAIL - Card background color does not match mockup');
    }
    
    // OVERALL RESULTS
    console.log('\n📊 OVERALL VERIFICATION RESULTS');
    console.log('=' .repeat(40));
    
    const passedTests = [
      results.backgroundColor,
      results.borderRadius,
      results.cssVariables,
      results.colorSystem
    ].filter(Boolean).length;
    
    const totalTests = 4;
    const scorePercentage = Math.round((passedTests / totalTests) * 100);
    
    console.log(`📊 Tests Passed: ${passedTests}/${totalTests} (${scorePercentage}%)`);
    
    if (scorePercentage === 100) {
      console.log('🎉 EXCELLENT - Perfect mockup compliance achieved!');
    } else if (scorePercentage >= 75) {
      console.log('✅ GOOD - Strong mockup compliance');
    } else if (scorePercentage >= 50) {
      console.log('⚠️  NEEDS WORK - Partial mockup compliance');
    } else {
      console.log('❌ MAJOR ISSUES - Significant mockup deviations');
    }
    
    // Take screenshot for documentation
    await page.screenshot({ 
      path: 'mockup-verification-result.png',
      fullPage: true 
    });
    
    console.log('\n📸 Screenshot saved: mockup-verification-result.png');
    
    // Generate report
    const report = {
      timestamp: new Date().toISOString(),
      results,
      score: {
        passed: passedTests,
        total: totalTests,
        percentage: scorePercentage
      },
      status: scorePercentage >= 75 ? 'COMPLIANT' : 'NEEDS_WORK'
    };
    
    require('fs').writeFileSync(
      'mockup-verification-report.json',
      JSON.stringify(report, null, 2)
    );
    
    console.log('\n📄 Report saved: mockup-verification-report.json');
    
  } catch (error) {
    console.error('❌ Error during verification:', error);
  } finally {
    await browser.close();
  }
}

// Run the verification
runSimpleMockupVerification().catch(console.error);