/**
 * Mockup Design Verification Test
 * 
 * This script verifies that the trading journal application
 * matches the colorcodeexample.png mockup specifications exactly (1:1)
 * 
 * Key Areas Tested:
 * 1. Color System Compliance
 * 2. Border Radius Consistency (12px)
 * 3. CSS Variable Usage
 * 4. Typography Specifications
 * 5. Layout Structure
 * 6. Responsive Behavior
 */

const { chromium } = require('playwright');

async function runMockupDesignVerification() {
  console.log('🎨 Starting Mockup Design Verification Test...\n');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000 // Slow down for better observation
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
      colorSystem: {},
      borderRadius: {},
      cssVariables: {},
      typography: {},
      layout: {},
      responsive: {}
    };
    
    // 1. COLOR SYSTEM VERIFICATION
    console.log('\n🎨 1. COLOR SYSTEM VERIFICATION');
    console.log('=' .repeat(50));
    
    // Check primary background color
    const bodyBg = await page.$eval('body', el => {
      return window.getComputedStyle(el).backgroundColor;
    });
    results.colorSystem.bodyBackground = bodyBg;
    console.log(`📊 Body Background: ${bodyBg}`);
    console.log(`   Expected: rgb(18, 18, 18) (#121212)`);
    console.log(`   ✅ ${bodyBg.includes('18, 18, 18') ? 'PASS' : 'FAIL'}`);
    
    // Check card backgrounds
    const cardElements = await page.$$('.dashboard-card');
    if (cardElements.length > 0) {
      const cardBg = await cardElements[0].evaluate(el => {
        return window.getComputedStyle(el).backgroundColor;
      });
      results.colorSystem.cardBackground = cardBg;
      console.log(`📊 Card Background: ${cardBg}`);
      console.log(`   Expected: rgb(32, 32, 32) (#202020)`);
      console.log(`   ✅ ${cardBg.includes('32, 32, 32') ? 'PASS' : 'FAIL'}`);
    }
    
    // Check accent colors
    const accentElements = await page.$$('[style*="B89B5E"], [style*="dusty-gold"], .metric-value');
    if (accentElements.length > 0) {
      const accentColor = await accentElements[0].$eval(el => {
        const style = window.getComputedStyle(el);
        return style.color || style.backgroundColor;
      });
      results.colorSystem.accentColors = accentColor;
      console.log(`📊 Accent Colors: ${accentColor}`);
      console.log(`   Expected: #B89B5E (Dusty Gold) variations`);
      console.log(`   ✅ ${accentColor.includes('184, 155, 94') || accentColor.includes('B89B5E') ? 'PASS' : 'FAIL'}`);
    }
    
    // 2. BORDER RADIUS VERIFICATION
    console.log('\n📐 2. BORDER RADIUS VERIFICATION');
    console.log('=' .repeat(50));
    
    // Check card border radius (CRITICAL: Must be 12px)
    const cardRadius = await cardElements[0].evaluate(el => {
      return window.getComputedStyle(el).borderRadius;
    });
    results.borderRadius.cardRadius = cardRadius;
    console.log(`📊 Card Border Radius: ${cardRadius}`);
    console.log(`   Expected: 12px (CRITICAL)`);
    console.log(`   ✅ ${cardRadius.includes('12px') ? 'PASS' : 'FAIL'}`);
    
    // Check button border radius
    const buttonElements = await page.$$('button, .button-primary');
    if (buttonElements.length > 0) {
      const buttonRadius = await buttonElements[0].evaluate(el => {
        return window.getComputedStyle(el).borderRadius;
      });
      results.borderRadius.buttonRadius = buttonRadius;
      console.log(`📊 Button Border Radius: ${buttonRadius}`);
      console.log(`   Expected: 8px`);
      console.log(`   ✅ ${buttonRadius.includes('8px') ? 'PASS' : 'FAIL'}`);
    }
    
    // 3. CSS VARIABLES USAGE VERIFICATION
    console.log('\n🔧 3. CSS VARIABLES USAGE VERIFICATION');
    console.log('=' .repeat(50));
    
    // Check if CSS variables are properly defined
    const cssVariables = await page.evaluate(() => {
      const style = getComputedStyle(document.documentElement);
      const variables = {};
      for (let i = 0; i < style.length; i++) {
        const property = style[i];
        if (property && property.startsWith('--')) {
          variables[property] = style.getPropertyValue(property);
        }
      }
      return variables;
    });
    
    results.cssVariables.variables = cssVariables;
    const criticalVariables = [
      '--deep-charcoal',
      '--soft-graphite', 
      '--warm-off-white',
      '--muted-gray',
      '--dusty-gold',
      '--radius-card'
    ];
    
    criticalVariables.forEach(variable => {
      const exists = cssVariables.hasOwnProperty(variable);
      console.log(`📊 ${variable}: ${exists ? 'DEFINED' : 'MISSING'}`);
      console.log(`   ✅ ${exists ? 'PASS' : 'FAIL'}`);
    });
    
    // 4. TYPOGRAPHY VERIFICATION
    console.log('\n📝 4. TYPOGRAPHY VERIFICATION');
    console.log('=' .repeat(50));
    
    // Check heading typography
    const headingElements = await page.$$('h1, .h1-dashboard');
    if (headingElements.length > 0) {
      const headingStyle = await headingElements[0].evaluate(el => {
        const style = window.getComputedStyle(el);
        return {
          fontSize: style.fontSize,
          fontWeight: style.fontWeight,
          color: style.color
        };
      });
      results.typography.heading = headingStyle;
      console.log(`📊 H1 Typography:`);
      console.log(`   Font Size: ${headingStyle.fontSize} (Expected: 32px)`);
      console.log(`   Font Weight: ${headingStyle.fontWeight} (Expected: 600)`);
      console.log(`   Color: ${headingStyle.color} (Expected: #EAE6DD)`);
      console.log(`   ✅ ${headingStyle.fontSize.includes('32') && headingStyle.fontWeight.includes('600') ? 'PASS' : 'FAIL'}`);
    }
    
    // Check metric value typography
    const metricElements = await page.$$('.metric-value');
    if (metricElements.length > 0) {
      const metricStyle = await metricElements[0].evaluate(el => {
        const style = window.getComputedStyle(el);
        return {
          fontSize: style.fontSize,
          fontWeight: style.fontWeight,
          color: style.color
        };
      });
      results.typography.metric = metricStyle;
      console.log(`📊 Metric Value Typography:`);
      console.log(`   Font Size: ${metricStyle.fontSize} (Expected: 24px)`);
      console.log(`   Font Weight: ${metricStyle.fontWeight} (Expected: 600)`);
      console.log(`   Color: ${metricStyle.color} (Expected: #EAE6DD)`);
      console.log(`   ✅ ${metricStyle.fontSize.includes('24') && metricStyle.fontWeight.includes('600') ? 'PASS' : 'FAIL'}`);
    }
    
    // 5. LAYOUT STRUCTURE VERIFICATION
    console.log('\n📐 5. LAYOUT STRUCTURE VERIFICATION');
    console.log('=' .repeat(50));
    
    // Check grid layouts
    const gridElements = await page.$$('.key-metrics-grid, .performance-grid, .charts-grid');
    results.layout.gridCount = gridElements.length;
    console.log(`📊 Grid Elements Found: ${gridElements.length} (Expected: 3+)`);
    console.log(`   ✅ ${gridElements.length >= 3 ? 'PASS' : 'FAIL'}`);
    
    // Check card count
    const allCards = await page.$$('.dashboard-card');
    results.layout.cardCount = allCards.length;
    console.log(`📊 Dashboard Cards: ${allCards.length} (Expected: 9+)`);
    console.log(`   ✅ ${allCards.length >= 9 ? 'PASS' : 'FAIL'}`);
    
    // Check sidebar
    const sidebarElement = await page.$('.verotrade-sidebar');
    results.layout.sidebarExists = !!sidebarElement;
    console.log(`📊 Sidebar Present: ${!!sidebarElement ? 'YES' : 'NO'} (Expected: YES)`);
    console.log(`   ✅ ${sidebarElement ? 'PASS' : 'FAIL'}`);
    
    // 6. RESPONSIVE BEHAVIOR VERIFICATION
    console.log('\n📱 6. RESPONSIVE BEHAVIOR VERIFICATION');
    console.log('=' .repeat(50));
    
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(1000);
    
    const mobileGrid = await page.$$('.key-metrics-grid');
    const mobileGridColumns = await mobileGrid[0].evaluate(el => {
      return window.getComputedStyle(el).gridTemplateColumns;
    });
    results.responsive.mobileGrid = mobileGridColumns;
    console.log(`📊 Mobile Grid: ${mobileGridColumns} (Expected: 1fr)`);
    console.log(`   ✅ ${mobileGridColumns.includes('1fr') ? 'PASS' : 'FAIL'}`);
    
    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForTimeout(1000);
    
    const desktopGrid = await page.$$('.key-metrics-grid');
    const desktopGridColumns = await desktopGrid[0].evaluate(el => {
      return window.getComputedStyle(el).gridTemplateColumns;
    });
    results.responsive.desktopGrid = desktopGridColumns;
    console.log(`📊 Desktop Grid: ${desktopGridColumns} (Expected: repeat(4, 1fr))`);
    console.log(`   ✅ ${desktopGridColumns.includes('4') ? 'PASS' : 'FAIL'}`);
    
    // Calculate overall score
    console.log('\n📊 OVERALL VERIFICATION RESULTS');
    console.log('=' .repeat(50));
    
    const allTests = [
      bodyBg.includes('18, 18, 18'),
      cardRadius.includes('12px'),
      cssVariables['--deep-charcoal'],
      cssVariables['--dusty-gold'],
      cssVariables['--radius-card'],
      headingStyle?.fontSize?.includes('32'),
      metricStyle?.fontSize?.includes('24'),
      gridElements.length >= 3,
      allCards.length >= 9,
      !!sidebarElement,
      mobileGridColumns.includes('1fr'),
      desktopGridColumns.includes('4')
    ];
    
    const passedTests = allTests.filter(Boolean).length;
    const totalTests = allTests.length;
    const scorePercentage = Math.round((passedTests / totalTests) * 100);
    
    console.log(`📊 Tests Passed: ${passedTests}/${totalTests} (${scorePercentage}%)`);
    console.log(`📊 Mockup Compliance: ${scorePercentage >= 90 ? 'EXCELLENT' : scorePercentage >= 75 ? 'GOOD' : scorePercentage >= 50 ? 'NEEDS WORK' : 'MAJOR ISSUES'}`);
    
    // Take screenshots for documentation
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.screenshot({ 
      path: 'mockup-verification-desktop.png',
      fullPage: true 
    });
    
    await page.setViewportSize({ width: 375, height: 667 });
    await page.screenshot({ 
      path: 'mockup-verification-mobile.png',
      fullPage: true 
    });
    
    console.log('\n📸 Screenshots saved:');
    console.log('   - mockup-verification-desktop.png');
    console.log('   - mockup-verification-mobile.png');
    
    // Generate detailed report
    const report = {
      timestamp: new Date().toISOString(),
      score: {
        passed: passedTests,
        total: totalTests,
        percentage: scorePercentage,
        compliance: scorePercentage >= 90 ? 'EXCELLENT' : scorePercentage >= 75 ? 'GOOD' : scorePercentage >= 50 ? 'NEEDS WORK' : 'MAJOR ISSUES'
      },
      results,
      recommendations: generateRecommendations(results, scorePercentage)
    };
    
    // Save report
    require('fs').writeFileSync(
      'mockup-design-verification-report.json',
      JSON.stringify(report, null, 2)
    );
    
    console.log('\n📄 Detailed report saved to: mockup-design-verification-report.json');
    
  } catch (error) {
    console.error('❌ Error during verification:', error);
  } finally {
    await browser.close();
  }
}

function generateRecommendations(results, score) {
  const recommendations = [];
  
  if (!results.colorSystem.bodyBackground?.includes('18, 18, 18')) {
    recommendations.push('CRITICAL: Fix primary background color to #121212');
  }
  
  if (!results.borderRadius.cardRadius?.includes('12px')) {
    recommendations.push('CRITICAL: Fix card border radius to exactly 12px');
  }
  
  if (!results.cssVariables.variables?.['--deep-charcoal']) {
    recommendations.push('HIGH: Ensure all CSS variables are properly defined');
  }
  
  if (!results.typography.heading?.fontSize?.includes('32')) {
    recommendations.push('MEDIUM: Fix H1 typography to 32px');
  }
  
  if (results.layout.cardCount < 9) {
    recommendations.push('MEDIUM: Ensure all dashboard cards are rendered');
  }
  
  if (!results.responsive.mobileGrid?.includes('1fr')) {
    recommendations.push('MEDIUM: Fix mobile responsive grid layout');
  }
  
  if (recommendations.length === 0) {
    recommendations.push('EXCELLENT: All mockup specifications are correctly implemented!');
  }
  
  return recommendations;
}

// Run the verification
runMockupDesignVerification().catch(console.error);