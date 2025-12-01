const { chromium } = require('playwright');

async function testResponsiveDesign() {
  console.log('📱 VeroTrade Responsive Design Test');
  console.log('='.repeat(60));

  const browser = await chromium.launch({ headless: false });
  
  const viewports = [
    { name: 'Mobile', width: 375, height: 667 },
    { name: 'Tablet', width: 768, height: 1024 },
    { name: 'Laptop', width: 1024, height: 768 },
    { name: 'Desktop', width: 1920, height: 1080 }
  ];

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
    responsiveIssues: []
  };

  for (const viewport of viewports) {
    console.log(`\n🖥️ Testing ${viewport.name} (${viewport.width}x${viewport.height})...`);
    
    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height }
    });

    for (const page of pages) {
      try {
        const pageInstance = await context.newPage();
        await pageInstance.goto(page.url, { waitUntil: 'networkidle' });
        await pageInstance.waitForTimeout(2000);

        // Test responsive design
        const responsiveTest = await pageInstance.evaluate((vp) => {
          const issues = [];
          
          // Check for horizontal scrollbars (indicates overflow)
          if (document.body.scrollWidth > document.body.clientWidth) {
            issues.push('Horizontal scrollbar detected - content overflow');
          }
          
          // Check for elements that are too close to edges
          const viewportWidth = window.innerWidth;
          const elementsNearEdge = [];
          
          document.querySelectorAll('*').forEach(el => {
            const rect = el.getBoundingClientRect();
            const computedStyle = window.getComputedStyle(el);
            
            // Check if element extends beyond viewport
            if (rect.right > viewportWidth + 10) {
              elementsNearEdge.push({
                element: el.tagName + '.' + el.className,
                issue: `Extends ${Math.round(rect.right - viewportWidth)}px beyond viewport`
              });
            }
            
            // Check for unreadable text (too small)
            const fontSize = parseFloat(computedStyle.fontSize);
            if (fontSize < 12 && el.textContent && el.textContent.trim().length > 0) {
              issues.push(`Text too small (${fontSize}px) on ${el.tagName}.${el.className}`);
            }
          });
          
          // Check navigation accessibility
          const navElements = document.querySelectorAll('nav, [role="navigation"]');
          if (navElements.length === 0) {
            issues.push('No navigation elements found');
          }
          
          // Check button accessibility (minimum touch target 44px)
          const buttons = document.querySelectorAll('button, [role="button"], a[href]');
          let smallButtons = 0;
          buttons.forEach(btn => {
            const rect = btn.getBoundingClientRect();
            if (rect.width < 44 || rect.height < 44) {
              smallButtons++;
            }
          });
          
          if (smallButtons > 0) {
            issues.push(`${smallButtons} buttons too small for touch interaction`);
          }
          
          // Check for VeroTrade responsive classes
          const responsiveClasses = document.querySelectorAll('[class*="sm:"], [class*="md:"], [class*="lg:"], [class*="xl:"]');
          
          return {
            issues,
            elementsNearEdge,
            navElementsFound: navElements.length > 0,
            buttonsFound: buttons.length,
            smallButtons,
            responsiveClassesUsed: responsiveClasses.length,
            hasHorizontalScroll: document.body.scrollWidth > document.body.clientWidth,
            viewportWidth: window.innerWidth,
            viewportHeight: window.innerHeight
          };
        }, viewport);

        const testResult = {
          page: page.name,
          viewport: viewport.name,
          ...responsiveTest,
          passed: responsiveTest.issues.length === 0 && 
                  responsiveTest.elementsNearEdge.length === 0 &&
                  responsiveTest.navElementsFound &&
                  responsiveTest.smallButtons === 0
        };

        if (testResult.passed) {
          results.passed.push(testResult);
          console.log(`  ✅ ${page.name}: PASSED`);
        } else {
          results.failed.push(testResult);
          console.log(`  ❌ ${page.name}: FAILED`);
          
          if (testResult.issues.length > 0) {
            console.log(`    Issues: ${testResult.issues.join(', ')}`);
          }
          if (testResult.elementsNearEdge.length > 0) {
            console.log(`    Elements near edge: ${testResult.elementsNearEdge.length}`);
          }
          if (testResult.smallButtons > 0) {
            console.log(`    Small buttons: ${testResult.smallButtons}`);
          }
        }

        await pageInstance.close();
      } catch (error) {
        console.log(`  ❌ ${page.name}: ERROR - ${error.message}`);
        results.failed.push({
          page: page.name,
          viewport: viewport.name,
          error: error.message,
          passed: false
        });
      }
    }

    await context.close();
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 RESPONSIVE DESIGN SUMMARY');
  console.log('='.repeat(60));
  
  const totalTests = viewports.length * pages.length;
  const totalPassed = results.passed.length;
  const totalFailed = results.failed.length;
  const successRate = ((totalPassed / totalTests) * 100).toFixed(1);
  
  console.log(`\n📈 Overall Results:`);
  console.log(`   - Total tests: ${totalTests}`);
  console.log(`   - Passed: ${totalPassed}`);
  console.log(`   - Failed: ${totalFailed}`);
  console.log(`   - Success rate: ${successRate}%`);

  // Analyze by viewport
  console.log(`\n🖥️ Results by Viewport:`);
  viewports.forEach(vp => {
    const vpResults = results.passed.filter(r => r.viewport === vp.name);
    const vpFailed = results.failed.filter(r => r.viewport === vp.name);
    console.log(`   - ${vp.name}: ${vpResults.length}/${pages.length} passed`);
  });

  // Analyze by page
  console.log(`\n📄 Results by Page:`);
  pages.forEach(page => {
    const pageResults = results.passed.filter(r => r.page === page.name);
    const pageFailed = results.failed.filter(r => r.page === page.name);
    console.log(`   - ${page.name}: ${pageResults.length}/${viewports.length} viewports passed`);
  });

  // Common issues
  const allIssues = results.failed.flatMap(r => r.issues || []);
  const commonIssues = {};
  allIssues.forEach(issue => {
    commonIssues[issue] = (commonIssues[issue] || 0) + 1;
  });

  if (Object.keys(commonIssues).length > 0) {
    console.log(`\n🚨 Common Issues:`);
    Object.entries(commonIssues)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .forEach(([issue, count]) => {
        console.log(`   - ${issue}: ${count} occurrences`);
      });
  }

  console.log(`\n🏆 FINAL STATUS: ${totalFailed === 0 ? 'RESPONSIVE DESIGN SUCCESSFUL' : 'RESPONSIVE DESIGN NEEDS IMPROVEMENT'}`);

  await browser.close();
  
  return {
    success: totalFailed === 0,
    summary: {
      totalTests,
      passed: totalPassed,
      failed: totalFailed,
      successRate: parseFloat(successRate)
    },
    details: results
  };
}

// Run responsive design test
testResponsiveDesign().then(result => {
  console.log('\n🎉 Responsive design test completed!');
  process.exit(result.success ? 0 : 1);
}).catch(error => {
  console.error('❌ Responsive design test failed:', error);
  process.exit(1);
});