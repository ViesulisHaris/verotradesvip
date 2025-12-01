const { chromium } = require('playwright');
const path = require('path');

async function verifyVeroTradeDesignSystem() {
  console.log('🔍 VeroTrade UI Design System Verification');
  console.log('='.repeat(60));

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });

  const pages = [
    { name: 'Dashboard', url: 'http://localhost:3000/dashboard' },
    { name: 'Trades', url: 'http://localhost:3000/trades' },
    { name: 'Strategies', url: 'http://localhost:3000/strategies' },
    { name: 'Login', url: 'http://localhost:3000/login' },
    { name: 'Register', url: 'http://localhost:3000/register' }
  ];

  const results = {
    passed: [],
    failed: [],
    blueElementsFound: [],
    verotradeClassesFound: [],
    luxuryElementsVerified: []
  };

  for (const page of pages) {
    console.log(`\n📄 Testing ${page.name} page...`);
    
    try {
      const pageInstance = await context.newPage();
      await pageInstance.goto(page.url, { waitUntil: 'networkidle' });
      
      // Wait for page to load completely
      await pageInstance.waitForTimeout(2000);

      // Check for VeroTrade classes
      const verotradeElements = await pageInstance.$$('[class*="verotrade-"]');
      const verotradeClassCount = verotradeElements.length;
      
      // Check for blue elements (should be none)
      const blueElements = await pageInstance.evaluate(() => {
        const elements = [];
        const allElements = document.querySelectorAll('*');
        
        for (const element of allElements) {
          const styles = window.getComputedStyle(element);
          const bgColor = styles.backgroundColor;
          const color = styles.color;
          const borderColor = styles.borderColor;
          
          // Check for blue colors
          const isBlueBackground = bgColor && (bgColor.includes('rgb(59, 130, 246') || bgColor.includes('blue') || bgColor.includes('#3B82F6'));
          const isBlueColor = color && (color.includes('rgb(59, 130, 246') || color.includes('blue') || color.includes('#3B82F6'));
          const isBlueBorder = borderColor && (borderColor.includes('rgb(59, 130, 246') || borderColor.includes('blue') || borderColor.includes('#3B82F6'));
          
          if (isBlueBackground || isBlueColor || isBlueBorder) {
            elements.push({
              tag: element.tagName,
              className: element.className,
              background: bgColor,
              color: color,
              border: borderColor
            });
          }
        }
        
        return elements;
      });

      // Check for luxury design elements
      const luxuryElements = await pageInstance.evaluate(() => {
        const luxuryChecks = {
          hasGoldAccents: false,
          hasProperSpacing: false,
          hasElegantTypography: false,
          hasSubtleAnimations: false,
          hasProperContrast: false
        };

        // Check for gold accents
        const goldElements = document.querySelectorAll('[class*="gold"], [class*="amber"]');
        luxuryChecks.hasGoldAccents = goldElements.length > 0;

        // Check for proper spacing (VeroTrade spacing classes)
        const spacingElements = document.querySelectorAll('[class*="gap-"], [class*="p-"], [class*="m-"]');
        luxuryChecks.hasProperSpacing = spacingElements.length > 10;

        // Check for elegant typography
        const typographyElements = document.querySelectorAll('[class*="heading"], [class*="body-text"]');
        luxuryChecks.hasElegantTypography = typographyElements.length > 0;

        // Check for subtle animations
        const animationElements = document.querySelectorAll('[class*="animate"], [class*="transition"]');
        luxuryChecks.hasSubtleAnimations = animationElements.length > 0;

        // Check for proper contrast (light text on dark backgrounds)
        const darkElements = document.querySelectorAll('[class*="bg-black"], [class*="dark"]');
        luxuryChecks.hasProperContrast = darkElements.length > 0;

        return luxuryChecks;
      });

      // Evaluate results
      const pageResults = {
        name: page.name,
        url: page.url,
        verotradeClassCount,
        blueElementCount: blueElements.length,
        blueElements: blueElements.slice(0, 5), // Limit to first 5 for readability
        luxuryChecks: luxuryElements,
        passed: verotradeClassCount > 10 && blueElements.length === 0
      };

      if (pageResults.passed) {
        results.passed.push(pageResults);
        console.log(`✅ ${page.name}: PASSED`);
        console.log(`   - VeroTrade classes: ${pageResults.verotradeClassCount}`);
        console.log(`   - Blue elements: ${pageResults.blueElementCount}`);
        console.log(`   - Luxury elements verified: ${Object.values(pageResults.luxuryChecks).filter(Boolean).length}/5`);
      } else {
        results.failed.push(pageResults);
        console.log(`❌ ${page.name}: FAILED`);
        console.log(`   - VeroTrade classes: ${pageResults.verotradeClassCount}`);
        console.log(`   - Blue elements: ${pageResults.blueElementCount}`);
        
        if (pageResults.blueElementCount > 0) {
          console.log(`   - Blue elements found:`);
          pageResults.blueElements.forEach(el => {
            console.log(`     * ${el.tag}.${el.className} - Background: ${el.background}, Color: ${el.color}`);
          });
        }
        
        console.log(`   - Luxury elements verified: ${Object.values(pageResults.luxuryChecks).filter(Boolean).length}/5`);
      }

      results.verotradeClassesFound.push(verotradeClassCount);
      results.blueElementsFound.push(...blueElements);
      results.luxuryElementsVerified.push(luxuryElements);

      await pageInstance.close();
    } catch (error) {
      console.log(`❌ ${page.name}: ERROR - ${error.message}`);
      results.failed.push({
        name: page.name,
        url: page.url,
        error: error.message,
        passed: false
      });
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 VERIFICATION SUMMARY');
  console.log('='.repeat(60));
  
  const totalPassed = results.passed.length;
  const totalFailed = results.failed.length;
  const totalPages = pages.length;
  
  console.log(`\n📈 Overall Results:`);
  console.log(`   - Pages tested: ${totalPages}`);
  console.log(`   - Pages passed: ${totalPassed}`);
  console.log(`   - Pages failed: ${totalFailed}`);
  console.log(`   - Success rate: ${((totalPassed / totalPages) * 100).toFixed(1)}%`);
  
  console.log(`\n🎨 Design System Analysis:`);
  console.log(`   - Total VeroTrade classes found: ${results.verotradeClassesFound.reduce((a, b) => a + b, 0)}`);
  console.log(`   - Total blue elements found: ${results.blueElementsFound.length}`);
  console.log(`   - Editorial minimalism: ${results.blueElementsFound.length === 0 ? '✅ ACHIEVED' : '❌ NEEDS WORK'}`);
  
  const avgLuxuryScore = results.luxuryElementsVerified.reduce((sum, checks) => {
    return sum + Object.values(checks).filter(Boolean).length;
  }, 0) / results.luxuryElementsVerified.length;
  
  console.log(`   - Luxury feel score: ${avgLuxuryScore.toFixed(1)}/5.0`);
  console.log(`   - Luxury aesthetic: ${avgLuxuryScore >= 4 ? '✅ ACHIEVED' : '❌ NEEDS IMPROVEMENT'}`);

  if (totalFailed > 0) {
    console.log(`\n❌ Failed Pages:`);
    results.failed.forEach(page => {
      console.log(`   - ${page.name}: ${page.error || 'Design system issues'}`);
    });
  }

  // Detailed analysis
  console.log(`\n🔍 Detailed Analysis:`);
  
  if (results.blueElementsFound.length > 0) {
    console.log(`\n🚨 BLUE ELEMENTS DETECTED (These should be removed):`);
    const uniqueBlueElements = [...new Set(results.blueElementsFound.map(el => `${el.tag}.${el.className}`))];
    uniqueBlueElements.slice(0, 10).forEach(el => {
      console.log(`   - ${el}`);
    });
    if (uniqueBlueElements.length > 10) {
      console.log(`   ... and ${uniqueBlueElements.length - 10} more`);
    }
  }

  console.log(`\n🎯 RECOMMENDATIONS:`);
  if (results.blueElementsFound.length > 0) {
    console.log(`   1. Remove all blue elements and replace with VeroTrade color system`);
    console.log(`   2. Use verotrade-info, verotrade-success, verotrade-error, verotrade-warning instead`);
  }
  if (avgLuxuryScore < 4) {
    console.log(`   3. Enhance luxury feel with more gold accents and subtle animations`);
    console.log(`   4. Improve typography hierarchy with VeroTrade heading classes`);
  }
  if (totalPassed < totalPages) {
    console.log(`   5. Ensure all pages use consistent VeroTrade design tokens`);
  }

  console.log(`\n🏆 FINAL STATUS: ${totalPassed === totalPages && results.blueElementsFound.length === 0 ? 'VEROTRADE DESIGN SYSTEM SUCCESSFULLY IMPLEMENTED' : 'VEROTRADE DESIGN SYSTEM NEEDS ADDITIONAL WORK'}`);

  await browser.close();
  
  return {
    success: totalPassed === totalPages && results.blueElementsFound.length === 0,
    summary: {
      totalPages,
      passed: totalPassed,
      failed: totalFailed,
      blueElementsFound: results.blueElementsFound.length,
      verotradeClassesUsed: results.verotradeClassesFound.reduce((a, b) => a + b, 0),
      luxuryScore: avgLuxuryScore
    },
    details: results
  };
}

// Run the verification
verifyVeroTradeDesignSystem().then(result => {
  console.log('\n🎉 Verification completed!');
  process.exit(result.success ? 0 : 1);
}).catch(error => {
  console.error('❌ Verification failed:', error);
  process.exit(1);
});