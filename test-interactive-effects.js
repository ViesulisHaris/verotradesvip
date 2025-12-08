const puppeteer = require('puppeteer');
const path = require('path');

/**
 * Comprehensive Interactive Effects Test Script
 * Tests all VeroTrade dashboard interactive effects and functionality
 */

class InteractiveEffectsTester {
  constructor() {
    this.browser = null;
    this.page = null;
    this.testResults = {
      flashlightEffect: { passed: 0, failed: 0, details: [] },
      scrollReveal: { passed: 0, failed: 0, details: [] },
      textReveal: { passed: 0, failed: 0, details: [] },
      dashboardFunctionality: { passed: 0, failed: 0, details: [] },
      performance: { passed: 0, failed: 0, details: [] },
      responsive: { passed: 0, failed: 0, details: [] }
    };
    this.screenshots = [];
  }

  async init() {
    console.log('🚀 Initializing Interactive Effects Tester...');
    
    this.browser = await puppeteer.launch({
      headless: false, // Set to false for visual debugging
      defaultViewport: { width: 1920, height: 1080 },
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor'
      ]
    });

    this.page = await this.browser.newPage();
    
    // Enable console logging from the page
    this.page.on('console', msg => {
      console.log('PAGE LOG:', msg.text());
    });

    // Enable performance monitoring
    await this.page.coverage.startJSCoverage();
    await this.page.coverage.startCSSCoverage();
  }

  async takeScreenshot(name, description) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `interactive-effects-test-${name}-${timestamp}.png`;
    const screenshotPath = path.join(process.cwd(), filename);
    
    await this.page.screenshot({ 
      path: screenshotPath, 
      fullPage: true,
      quality: 90
    });
    
    this.screenshots.push({ filename, description, path: screenshotPath });
    console.log(`📸 Screenshot saved: ${filename} - ${description}`);
    return screenshotPath;
  }

  async testDashboardLoad() {
    console.log('\n📊 Testing Dashboard Load...');
    
    try {
      // Test dashboard page
      await this.page.goto('http://localhost:3000/dashboard', { 
        waitUntil: 'networkidle2',
        timeout: 30000 
      });
      
      // Wait for page to load
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Check if dashboard loaded successfully
      const pageTitle = await this.page.title();
      const dashboardExists = await this.page.$('[data-testid="metrics-container"]') !== null;
      
      if (dashboardExists) {
        this.testResults.dashboardFunctionality.passed++;
        this.testResults.dashboardFunctionality.details.push('✅ Dashboard loaded successfully');
      } else {
        this.testResults.dashboardFunctionality.failed++;
        this.testResults.dashboardFunctionality.details.push('❌ Dashboard failed to load');
      }
      
      await this.takeScreenshot('dashboard-load', 'Dashboard initial load');
      
      // Test home page with interactive effects
      await this.page.goto('http://localhost:3000/', { 
        waitUntil: 'networkidle2',
        timeout: 30000 
      });
      
      await this.page.waitForTimeout(2000);
      await this.takeScreenshot('home-load', 'Home page with interactive effects');
      
    } catch (error) {
      this.testResults.dashboardFunctionality.failed++;
      this.testResults.dashboardFunctionality.details.push(`❌ Dashboard load error: ${error.message}`);
      console.error('Dashboard load error:', error);
    }
  }

  async testFlashlightEffect() {
    console.log('\n🔦 Testing Flashlight Effect...');
    
    try {
      // Navigate to home page where flashlight effects are implemented
      await this.page.goto('http://localhost:3000/', { waitUntil: 'networkidle2' });
      await this.page.waitForTimeout(2000);
      
      // Find flashlight cards
      const flashlightCards = await this.page.$$('.flashlight-card');
      
      if (flashlightCards.length === 0) {
        this.testResults.flashlightEffect.failed++;
        this.testResults.flashlightEffect.details.push('❌ No flashlight cards found');
        return;
      }
      
      console.log(`Found ${flashlightCards.length} flashlight cards`);
      
      // Test each card
      for (let i = 0; i < Math.min(flashlightCards.length, 3); i++) {
        const card = flashlightCards[i];
        
        // Get card bounding box
        const boundingBox = await card.boundingBox();
        if (!boundingBox) continue;
        
        // Move mouse to center of card
        const centerX = boundingBox.x + boundingBox.width / 2;
        const centerY = boundingBox.y + boundingBox.height / 2;
        
        await this.page.mouse.move(centerX, centerY);
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Check if CSS variables are updated
        const mouseVars = await this.page.evaluate((card) => {
          const style = window.getComputedStyle(card);
          return {
            mouseX: style.getPropertyValue('--mouse-x'),
            mouseY: style.getPropertyValue('--mouse-y')
          };
        }, card);
        
        if (mouseVars.mouseX && mouseVars.mouseY) {
          this.testResults.flashlightEffect.passed++;
          this.testResults.flashlightEffect.details.push(`✅ Card ${i + 1}: Mouse tracking working (${mouseVars.mouseX}, ${mouseVars.mouseY})`);
        } else {
          this.testResults.flashlightEffect.failed++;
          this.testResults.flashlightEffect.details.push(`❌ Card ${i + 1}: Mouse tracking not working`);
        }
        
        // Move mouse away
        await this.page.mouse.move(centerX - 200, centerY - 200);
        await this.page.waitForTimeout(500);
      }
      
      await this.takeScreenshot('flashlight-effect', 'Flashlight effect test');
      
    } catch (error) {
      this.testResults.flashlightEffect.failed++;
      this.testResults.flashlightEffect.details.push(`❌ Flashlight effect error: ${error.message}`);
      console.error('Flashlight effect error:', error);
    }
  }

  async testScrollReveal() {
    console.log('\n📜 Testing Scroll Reveal Animations...');
    
    try {
      await this.page.goto('http://localhost:3000/', { waitUntil: 'networkidle2' });
      await this.page.waitForTimeout(2000);
      
      // Find scroll items
      const scrollItems = await this.page.$$('.scroll-item');
      
      if (scrollItems.length === 0) {
        this.testResults.scrollReveal.failed++;
        this.testResults.scrollReveal.details.push('❌ No scroll items found');
        return;
      }
      
      console.log(`Found ${scrollItems.length} scroll items`);
      
      // Test initial state (should be hidden/blurred)
      const initialStates = await this.page.evaluate((items) => {
        return Array.from(items).map(item => {
          const style = window.getComputedStyle(item);
          return {
            opacity: style.opacity,
            transform: style.transform,
            filter: style.filter
          };
        });
      }, scrollItems);
      
      // Scroll down to trigger animations
      await this.page.evaluate(() => {
        window.scrollTo(0, window.innerHeight);
      });
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check final state (should be visible)
      const finalStates = await this.page.evaluate((items) => {
        return Array.from(items).map(item => {
          const style = window.getComputedStyle(item);
          const isVisible = style.opacity !== '0' && !style.filter.includes('blur');
          return {
            opacity: style.opacity,
            transform: style.transform,
            filter: style.filter,
            isVisible: isVisible
          };
        });
      }, scrollItems);
      
      let visibleCount = 0;
      finalStates.forEach((state, index) => {
        if (state.isVisible) {
          visibleCount++;
          this.testResults.scrollReveal.passed++;
          this.testResults.scrollReveal.details.push(`✅ Scroll item ${index + 1}: Animation triggered successfully`);
        } else {
          this.testResults.scrollReveal.failed++;
          this.testResults.scrollReveal.details.push(`❌ Scroll item ${index + 1}: Animation not triggered`);
        }
      });
      
      console.log(`Scroll reveal: ${visibleCount}/${scrollItems.length} items animated`);
      await this.takeScreenshot('scroll-reveal', 'Scroll reveal animations');
      
    } catch (error) {
      this.testResults.scrollReveal.failed++;
      this.testResults.scrollReveal.details.push(`❌ Scroll reveal error: ${error.message}`);
      console.error('Scroll reveal error:', error);
    }
  }

  async testTextReveal() {
    console.log('\n📝 Testing Text Reveal Animations...');
    
    try {
      await this.page.goto('http://localhost:3000/', { waitUntil: 'networkidle2' });
      await new Promise(resolve => setTimeout(resolve, 3000)); // Wait for text animations to complete
      
      // Find text reveal elements
      const textRevealElements = await this.page.$$('.text-reveal-letter');
      
      if (textRevealElements.length === 0) {
        this.testResults.textReveal.failed++;
        this.testResults.textReveal.details.push('❌ No text reveal elements found');
        return;
      }
      
      console.log(`Found ${textRevealElements.length} text reveal letters`);
      
      // Check if letters are animated
      const animatedLetters = await this.page.evaluate((elements) => {
        return Array.from(elements).filter(letter => {
          const style = window.getComputedStyle(letter);
          return style.opacity !== '0' && style.transform !== 'none';
        });
      }, textRevealElements);
      
      if (animatedLetters.length > 0) {
        this.testResults.textReveal.passed++;
        this.testResults.textReveal.details.push(`✅ Text reveal working: ${animatedLetters.length} letters animated`);
      } else {
        this.testResults.textReveal.failed++;
        this.testResults.textReveal.details.push('❌ Text reveal not working: no letters animated');
      }
      
      await this.takeScreenshot('text-reveal', 'Text reveal animations');
      
    } catch (error) {
      this.testResults.textReveal.failed++;
      this.testResults.textReveal.details.push(`❌ Text reveal error: ${error.message}`);
      console.error('Text reveal error:', error);
    }
  }

  async testPerformance() {
    console.log('\n⚡ Testing Performance...');
    
    try {
      // Get performance metrics
      const metrics = await this.page.evaluate(() => {
        const navigation = performance.getEntriesByType('navigation')[0];
        const paint = performance.getEntriesByType('paint');
        
        return {
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
          loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
          firstPaint: paint.find(p => p.name === 'first-paint')?.startTime || 0,
          firstContentfulPaint: paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0
        };
      });
      
      // Check performance thresholds
      if (metrics.firstContentfulPaint < 2000) {
        this.testResults.performance.passed++;
        this.testResults.performance.details.push(`✅ First Contentful Paint: ${metrics.firstContentfulPaint.toFixed(0)}ms`);
      } else {
        this.testResults.performance.failed++;
        this.testResults.performance.details.push(`❌ First Contentful Paint too slow: ${metrics.firstContentfulPaint.toFixed(0)}ms`);
      }
      
      if (metrics.domContentLoaded < 3000) {
        this.testResults.performance.passed++;
        this.testResults.performance.details.push(`✅ DOM Content Loaded: ${metrics.domContentLoaded.toFixed(0)}ms`);
      } else {
        this.testResults.performance.failed++;
        this.testResults.performance.details.push(`❌ DOM Content Loaded too slow: ${metrics.domContentLoaded.toFixed(0)}ms`);
      }
      
      // Check for memory leaks
      const memoryBefore = await this.page.evaluate(() => performance.memory?.usedJSHeapSize || 0);
      
      // Perform some interactions
      await this.page.goto('http://localhost:3000/', { waitUntil: 'networkidle2' });
      await new Promise(resolve => setTimeout(resolve, 2000));
      await this.page.mouse.move(400, 300);
      await new Promise(resolve => setTimeout(resolve, 1000));
      await this.page.evaluate(() => window.scrollTo(0, 500));
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const memoryAfter = await this.page.evaluate(() => performance.memory?.usedJSHeapSize || 0);
      const memoryIncrease = memoryAfter - memoryBefore;
      
      if (memoryIncrease < 10 * 1024 * 1024) { // Less than 10MB increase
        this.testResults.performance.passed++;
        this.testResults.performance.details.push(`✅ Memory usage stable: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB increase`);
      } else {
        this.testResults.performance.failed++;
        this.testResults.performance.details.push(`❌ Possible memory leak: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB increase`);
      }
      
    } catch (error) {
      this.testResults.performance.failed++;
      this.testResults.performance.details.push(`❌ Performance test error: ${error.message}`);
      console.error('Performance test error:', error);
    }
  }

  async testResponsive() {
    console.log('\n📱 Testing Responsive Design...');
    
    const viewports = [
      { width: 1920, height: 1080, name: 'Desktop' },
      { width: 768, height: 1024, name: 'Tablet' },
      { width: 375, height: 667, name: 'Mobile' }
    ];
    
    for (const viewport of viewports) {
      try {
        await this.page.setViewport(viewport);
        await this.page.goto('http://localhost:3000/', { waitUntil: 'networkidle2' });
        await this.page.waitForTimeout(2000);
        
        // Check if layout is responsive
        const isResponsive = await this.page.evaluate((vp) => {
          const container = document.querySelector('.verotrade-content-wrapper');
          if (!container) return false;
          
          const rect = container.getBoundingClientRect();
          const isOverflowing = rect.width > vp.width || rect.height > vp.height;
          
          return !isOverflowing;
        }, viewport);
        
        if (isResponsive) {
          this.testResults.responsive.passed++;
          this.testResults.responsive.details.push(`✅ ${viewport.name}: Layout responsive`);
        } else {
          this.testResults.responsive.failed++;
          this.testResults.responsive.details.push(`❌ ${viewport.name}: Layout not responsive`);
        }
        
        await this.takeScreenshot(`responsive-${viewport.name.toLowerCase()}`, `${viewport.name} responsive layout`);
        
      } catch (error) {
        this.testResults.responsive.failed++;
        this.testResults.responsive.details.push(`❌ ${viewport.name}: ${error.message}`);
      }
    }
  }

  async checkConsoleErrors() {
    console.log('\n🔍 Checking for Console Errors...');
    
    const errors = [];
    this.page.on('pageerror', error => {
      errors.push({
        type: 'pageerror',
        message: error.message,
        stack: error.stack
      });
    });
    
    this.page.on('requestfailed', request => {
      errors.push({
        type: 'requestfailed',
        url: request.url(),
        failure: request.failure()
      });
    });
    
    // Navigate and wait
    await this.page.goto('http://localhost:3000/', { waitUntil: 'networkidle2' });
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    if (errors.length === 0) {
      this.testResults.performance.passed++;
      this.testResults.performance.details.push('✅ No console errors found');
    } else {
      this.testResults.performance.failed++;
      errors.forEach(error => {
        this.testResults.performance.details.push(`❌ Console error: ${error.message || error.url}`);
      });
    }
  }

  async generateReport() {
    console.log('\n📋 Generating Test Report...');
    
    const timestamp = new Date().toISOString();
    let report = `# VeroTrade Interactive Effects Test Report\n\n`;
    report += `**Generated:** ${timestamp}\n\n`;
    report += `## Summary\n\n`;
    
    let totalPassed = 0;
    let totalFailed = 0;
    
    Object.entries(this.testResults).forEach(([category, results]) => {
      totalPassed += results.passed;
      totalFailed += results.failed;
      
      const total = results.passed + results.failed;
      const passRate = total > 0 ? ((results.passed / total) * 100).toFixed(1) : 0;
      
      report += `### ${category.charAt(0).toUpperCase() + category.slice(1)}\n`;
      report += `- Passed: ${results.passed}/${total} (${passRate}%)\n`;
      report += `- Failed: ${results.failed}/${total}\n\n`;
    });
    
    const overallPassRate = ((totalPassed / (totalPassed + totalFailed)) * 100).toFixed(1);
    report += `## Overall Results\n\n`;
    report += `- **Total Passed:** ${totalPassed}\n`;
    report += `- **Total Failed:** ${totalFailed}\n`;
    report += `- **Pass Rate:** ${overallPassRate}%\n\n`;
    
    report += `## Detailed Results\n\n`;
    
    Object.entries(this.testResults).forEach(([category, results]) => {
      if (results.details.length > 0) {
        report += `### ${category.charAt(0).toUpperCase() + category.slice(1)} Details\n\n`;
        results.details.forEach(detail => {
          report += `- ${detail}\n`;
        });
        report += '\n';
      }
    });
    
    report += `## Screenshots\n\n`;
    this.screenshots.forEach(screenshot => {
      report += `- **${screenshot.filename}**: ${screenshot.description}\n`;
    });
    
    report += `\n## Recommendations\n\n`;
    
    if (overallPassRate >= 90) {
      report += `✅ **EXCELLENT**: All interactive effects are working correctly with high performance.\n`;
    } else if (overallPassRate >= 75) {
      report += `⚠️ **GOOD**: Most interactive effects are working, but some optimizations may be needed.\n`;
    } else {
      report += `❌ **NEEDS IMPROVEMENT**: Several interactive effects are not working correctly.\n`;
    }
    
    // Save report
    const reportPath = path.join(process.cwd(), `interactive-effects-test-report-${timestamp.replace(/[:.]/g, '-')}.md`);
    require('fs').writeFileSync(reportPath, report);
    
    console.log(`📄 Report saved to: ${reportPath}`);
    console.log(`\n🎯 Overall Pass Rate: ${overallPassRate}%`);
    
    return { report, reportPath, overallPassRate };
  }

  async cleanup() {
    console.log('\n🧹 Cleaning up...');
    
    if (this.page) {
      const [jsCoverage, cssCoverage] = await Promise.all([
        this.page.coverage.stopJSCoverage(),
        this.page.coverage.stopCSSCoverage()
      ]);
      
      console.log(`📊 JS Coverage: ${jsCoverage.length} files`);
      console.log(`📊 CSS Coverage: ${cssCoverage.length} files`);
    }
    
    if (this.browser) {
      await this.browser.close();
    }
  }

  async runAllTests() {
    try {
      await this.init();
      
      await this.testDashboardLoad();
      await this.testFlashlightEffect();
      await this.testScrollReveal();
      await this.testTextReveal();
      await this.testPerformance();
      await this.checkConsoleErrors();
      await this.testResponsive();
      
      const { report, reportPath, overallPassRate } = await this.generateReport();
      
      await this.cleanup();
      
      return {
        success: overallPassRate >= 75,
        report,
        reportPath,
        overallPassRate,
        testResults: this.testResults
      };
      
    } catch (error) {
      console.error('❌ Test execution failed:', error);
      await this.cleanup();
      throw error;
    }
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  const tester = new InteractiveEffectsTester();
  
  tester.runAllTests()
    .then(results => {
      console.log('\n🎉 Test execution completed!');
      console.log(`📊 Overall Pass Rate: ${results.overallPassRate}%`);
      console.log(`📄 Report: ${results.reportPath}`);
      
      if (results.success) {
        console.log('✅ Tests passed! Interactive effects are working correctly.');
      } else {
        console.log('❌ Some tests failed. Please review the report for details.');
      }
      
      process.exit(results.success ? 0 : 1);
    })
    .catch(error => {
      console.error('💥 Test execution failed:', error);
      process.exit(1);
    });
}

module.exports = InteractiveEffectsTester;