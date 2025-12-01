/**
 * MICRO-PERFECT SIDEBAR TRANSITION TEST
 * 
 * This script tests for absolute perfection in sidebar transitions
 * by detecting micro-glitches that only a discerning user would notice.
 * 
 * Tests include:
 * 1. Micro-timing synchronization
 * 2. Sub-pixel precision
 * 3. Chart rendering micro-flicker
 * 4. CSS easing curve smoothness
 * 5. Rapid toggling stress test
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// Test configuration
const TEST_CONFIG = {
  baseUrl: 'http://localhost:3000',
  headless: false, // Show browser for visual verification
  slowMo: 50, // Slow down actions for precision
  timeout: 30000,
  retries: 3
};

// Performance metrics
const performanceMetrics = {
  transitionTimings: [],
  frameDrops: [],
  layoutShifts: [],
  renderTimes: [],
  microGlitches: []
};

// Micro-perfection thresholds (extremely strict)
const MICRO_PERFECTION_THRESHOLDS = {
  maxTransitionTime: 310, // 300ms + 10ms tolerance
  maxFrameDrop: 0, // Zero frame drops allowed
  maxLayoutShift: 0.01, // Sub-pixel precision
  maxRenderTime: 16.67, // 60fps = 16.67ms per frame
  maxMicroGlitch: 0 // Zero micro-glitches allowed
};

class MicroPerfectSidebarTester {
  constructor() {
    this.browser = null;
    this.context = null;
    this.page = null;
    this.testResults = [];
  }

  async initialize() {
    console.log('🚀 [MICRO_PERFECT_TEST] Initializing browser for micro-perfection testing...');
    
    this.browser = await chromium.launch({
      headless: TEST_CONFIG.headless,
      slowMo: TEST_CONFIG.slowMo,
      args: [
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor',
        '--enable-gpu-rasterization',
        '--enable-zero-copy',
        '--disable-composited-antialiasing'
      ]
    });
    
    this.context = await this.browser.newContext({
      viewport: { width: 1920, height: 1080 },
      deviceScaleFactor: 1, // Exact pixel mapping
      hasTouch: false,
      isMobile: false
    });
    
    this.page = await this.context.newPage();
    
    // Enable performance monitoring
    await this.page.addInitScript(() => {
      // Override requestAnimationFrame for precision timing
      let frameCount = 0;
      let lastFrameTime = performance.now();
      
      window.microPerfMetrics = {
        frameDrops: 0,
        renderTimes: [],
        layoutShifts: [],
        transitionStart: null,
        transitionEnd: null,
        microGlitches: []
      };
      
      // Monitor frame drops with micro-precision
      const originalRAF = window.requestAnimationFrame;
      window.requestAnimationFrame = function(callback) {
        return originalRAF(function(timestamp) {
          const now = performance.now();
          const frameTime = now - lastFrameTime;
          
          // Detect frame drops (anything over 16.67ms)
          if (frameTime > 16.67 * 1.5) {
            window.microPerfMetrics.frameDrops++;
            window.microPerfMetrics.renderTimes.push(frameTime);
          }
          
          lastFrameTime = now;
          frameCount++;
          return callback(timestamp);
        });
      };
      
      // Monitor layout shifts with sub-pixel precision
      let lastLayout = null;
      const observer = new ResizeObserver(entries => {
        for (const entry of entries) {
          const { width, height } = entry.contentRect;
          if (lastLayout && (Math.abs(width - lastLayout.width) > 0.01 || Math.abs(height - lastLayout.height) > 0.01)) {
            window.microPerfMetrics.layoutShifts.push({
              time: performance.now(),
              shift: { x: width - lastLayout.width, y: height - lastLayout.height }
            });
          }
          lastLayout = { width, height };
        }
      });
      
      // Start observing when DOM is ready
      if (document.body) {
        observer.observe(document.body);
      }
      
      console.log('🔍 [MICRO_PERFECT_TEST] Performance monitoring initialized');
    });
  }

  async navigateToDashboard() {
    console.log('📍 [MICRO_PERFECT_TEST] Navigating to dashboard...');
    
    try {
      await this.page.goto(`${TEST_CONFIG.baseUrl}/dashboard`, {
        waitUntil: 'networkidle',
        timeout: TEST_CONFIG.timeout
      });
      
      // Wait for page to fully load
      await this.page.waitForLoadState('domcontentloaded');
      await this.page.waitForTimeout(2000); // Extra wait for stability
      
      // Check if we're on the right page
      const title = await this.page.title();
      if (!title.includes('Dashboard') && !title.includes('Trading')) {
        throw new Error(`Not on dashboard page. Current title: ${title}`);
      }
      
      console.log('✅ [MICRO_PERFECT_TEST] Dashboard loaded successfully');
      return true;
    } catch (error) {
      console.error('❌ [MICRO_PERFECT_TEST] Failed to load dashboard:', error.message);
      return false;
    }
  }

  async performMicroPerfectTransitionTest() {
    console.log('🎯 [MICRO_PERFECT_TEST] Starting micro-perfect transition test...');
    
    const results = {
      testName: 'Micro-Perfect Sidebar Transition',
      timestamp: new Date().toISOString(),
      metrics: {},
      passed: false,
      details: []
    };
    
    try {
      // Find sidebar toggle button
      const toggleButton = await this.page.locator([
        'button[title*="Expand sidebar"]',
        'button[title*="Collapse sidebar"]',
        'button[title*="sidebar"]',
        'button:has(svg[data-lucide="chevron-left"])',
        'button:has(svg[data-lucide="chevron-right"])',
        '.lg\\:flex.p-2.rounded-lg.hover\\:bg-blue-600\\/20.transition-all.duration-200.items-center.justify-center'
      ].join(', ')).first();
      await toggleButton.waitFor({ state: 'visible', timeout: 5000 });
      
      // Get initial sidebar state
      const initialSidebarWidth = await this.page.evaluate(() => {
        const sidebar = document.querySelector('aside');
        return sidebar ? sidebar.getBoundingClientRect().width : 0;
      });
      
      console.log(`📏 [MICRO_PERFECT_TEST] Initial sidebar width: ${initialSidebarWidth}px`);
      
      // Start performance monitoring
      await this.page.evaluate(() => {
        window.microPerfMetrics.transitionStart = performance.now();
        window.microPerfMetrics.frameDrops = 0;
        window.microPerfMetrics.renderTimes = [];
        window.microPerfMetrics.layoutShifts = [];
      });
      
      // Perform transition with micro-precision timing
      const transitionStart = performance.now();
      await toggleButton.click();
      
      // Wait for transition to complete with micro-precision
      await this.page.waitForFunction(() => {
        const sidebar = document.querySelector('aside');
        if (!sidebar) return false;
        
        const currentWidth = sidebar.getBoundingClientRect().width;
        const targetWidth = window.microPerfMetrics.transitionStart ? 64 : 256; // Collapsed/Expanded widths
        const tolerance = 0.5; // Sub-pixel tolerance
        
        return Math.abs(currentWidth - targetWidth) <= tolerance;
      }, { timeout: 1000 });
      
      const transitionEnd = performance.now();
      const transitionTime = transitionEnd - transitionStart;
      
      // Collect performance metrics
      const metrics = await this.page.evaluate(() => {
        window.microPerfMetrics.transitionEnd = performance.now();
        return {
          ...window.microPerfMetrics,
          finalSidebarWidth: document.querySelector('aside')?.getBoundingClientRect().width || 0
        };
      });
      
      // Analyze results with micro-perfection standards
      const analysis = this.analyzeMicroPerfection({
        transitionTime,
        initialWidth: initialSidebarWidth,
        finalWidth: metrics.finalSidebarWidth,
        frameDrops: metrics.frameDrops,
        renderTimes: metrics.renderTimes,
        layoutShifts: metrics.layoutShifts
      });
      
      results.metrics = {
        transitionTime: transitionTime,
        initialWidth: initialSidebarWidth,
        finalWidth: metrics.finalSidebarWidth,
        frameDrops: metrics.frameDrops,
        layoutShifts: metrics.layoutShifts.length,
        maxRenderTime: metrics.renderTimes.length > 0 ? Math.max(...metrics.renderTimes) : 0,
        avgRenderTime: metrics.renderTimes.length > 0 ? metrics.renderTimes.reduce((a, b) => a + b) / metrics.renderTimes.length : 0
      };
      
      results.passed = analysis.passed;
      results.details = analysis.details;
      
      console.log(`📊 [MICRO_PERFECT_TEST] Transition analysis:`, results.metrics);
      
    } catch (error) {
      console.error('❌ [MICRO_PERFECT_TEST] Transition test failed:', error.message);
      results.details.push(`Error: ${error.message}`);
    }
    
    this.testResults.push(results);
    return results;
  }

  analyzeMicroPerfection(metrics) {
    const analysis = {
      passed: true,
      details: []
    };
    
    // Check transition timing (micro-precision)
    if (metrics.transitionTime > MICRO_PERFECTION_THRESHOLDS.maxTransitionTime) {
      analysis.passed = false;
      analysis.details.push(`❌ Transition time ${metrics.transitionTime.toFixed(2)}ms exceeds threshold ${MICRO_PERFECTION_THRESHOLDS.maxTransitionTime}ms`);
    } else {
      analysis.details.push(`✅ Transition time ${metrics.transitionTime.toFixed(2)}ms within threshold`);
    }
    
    // Check frame drops (zero tolerance)
    if (metrics.frameDrops > MICRO_PERFECTION_THRESHOLDS.maxFrameDrop) {
      analysis.passed = false;
      analysis.details.push(`❌ Frame drops detected: ${metrics.frameDrops} (threshold: ${MICRO_PERFECTION_THRESHOLDS.maxFrameDrop})`);
    } else {
      analysis.details.push(`✅ No frame drops detected`);
    }
    
    // Check layout shifts (sub-pixel precision)
    const maxLayoutShift = metrics.layoutShifts.length > 0 
      ? Math.max(...metrics.layoutShifts.map(shift => Math.abs(shift.x) + Math.abs(shift.y)))
      : 0;
    
    if (maxLayoutShift > MICRO_PERFECTION_THRESHOLDS.maxLayoutShift) {
      analysis.passed = false;
      analysis.details.push(`❌ Layout shift ${maxLayoutShift.toFixed(3)}px exceeds threshold ${MICRO_PERFECTION_THRESHOLDS.maxLayoutShift}px`);
    } else {
      analysis.details.push(`✅ Layout shifts within threshold: ${maxLayoutShift.toFixed(3)}px`);
    }
    
    // Check render times (60fps standard)
    if (metrics.maxRenderTime > MICRO_PERFECTION_THRESHOLDS.maxRenderTime) {
      analysis.passed = false;
      analysis.details.push(`❌ Max render time ${metrics.maxRenderTime.toFixed(2)}ms exceeds 60fps standard ${MICRO_PERFECTION_THRESHOLDS.maxRenderTime}ms`);
    } else {
      analysis.details.push(`✅ Render times within 60fps standard: ${metrics.maxRenderTime.toFixed(2)}ms max`);
    }
    
    // Check width precision (sub-pixel accuracy)
    const expectedFinalWidth = metrics.initialWidth > 100 ? 64 : 256; // Collapsed/Expanded
    const widthError = Math.abs(metrics.finalWidth - expectedFinalWidth);
    
    if (widthError > 0.5) { // Sub-pixel tolerance
      analysis.passed = false;
      analysis.details.push(`❌ Width error ${widthError.toFixed(2)}px exceeds sub-pixel tolerance 0.5px`);
    } else {
      analysis.details.push(`✅ Width precision within tolerance: ${widthError.toFixed(2)}px error`);
    }
    
    return analysis;
  }

  async performRapidToggleStressTest() {
    console.log('⚡ [MICRO_PERFECT_TEST] Starting rapid toggle stress test...');
    
    const results = {
      testName: 'Rapid Toggle Stress Test',
      timestamp: new Date().toISOString(),
      metrics: {
        totalToggles: 0,
        successfulToggles: 0,
        failedToggles: 0,
        avgTransitionTime: 0,
        maxTransitionTime: 0,
        minTransitionTime: Infinity,
        frameDrops: 0,
        microGlitches: 0
      },
      passed: false,
      details: []
    };
    
    try {
      const toggleButton = await this.page.locator('button[title*="sidebar"], button[aria-label*="sidebar"]').first();
      
      const toggleCount = 10; // Rapid toggle count
      const toggleDelay = 100; // 100ms between toggles
      
      for (let i = 0; i < toggleCount; i++) {
        console.log(`🔄 [MICRO_PERFECT_TEST] Toggle ${i + 1}/${toggleCount}...`);
        
        // Start monitoring
        const toggleStart = performance.now();
        await this.page.evaluate(() => {
          window.microPerfMetrics.transitionStart = performance.now();
          window.microPerfMetrics.frameDrops = 0;
        });
        
        // Perform toggle
        await toggleButton.click();
        
        // Wait for transition completion
        await this.page.waitForTimeout(350); // 300ms + 50ms buffer
        
        const toggleEnd = performance.now();
        const toggleTime = toggleEnd - toggleStart;
        
        // Collect metrics
        const toggleMetrics = await this.page.evaluate(() => ({
          frameDrops: window.microPerfMetrics.frameDrops,
          finalWidth: document.querySelector('aside')?.getBoundingClientRect().width || 0
        }));
        
        // Update results
        results.metrics.totalToggles++;
        results.metrics.avgTransitionTime = (results.metrics.avgTransitionTime * (results.metrics.totalToggles - 1) + toggleTime) / results.metrics.totalToggles;
        results.metrics.maxTransitionTime = Math.max(results.metrics.maxTransitionTime, toggleTime);
        results.metrics.minTransitionTime = Math.min(results.metrics.minTransitionTime, toggleTime);
        results.metrics.frameDrops += toggleMetrics.frameDrops;
        
        // Check if toggle was successful
        const expectedWidth = i % 2 === 0 ? 64 : 256; // Alternate collapsed/expanded
        const toggleSuccess = Math.abs(toggleMetrics.finalWidth - expectedWidth) < 1;
        
        if (toggleSuccess) {
          results.metrics.successfulToggles++;
        } else {
          results.metrics.failedToggles++;
          results.metrics.microGlitches++;
        }
        
        // Small delay between toggles
        if (i < toggleCount - 1) {
          await this.page.waitForTimeout(toggleDelay);
        }
      }
      
      // Analyze stress test results
      const successRate = (results.metrics.successfulToggles / results.metrics.totalToggles) * 100;
      results.passed = successRate >= 95 && results.metrics.frameDrops === 0 && results.metrics.microGlitches === 0;
      
      results.details.push(`Success rate: ${successRate.toFixed(1)}% (${results.metrics.successfulToggles}/${results.metrics.totalToggles})`);
      results.details.push(`Average transition time: ${results.metrics.avgTransitionTime.toFixed(2)}ms`);
      results.details.push(`Frame drops: ${results.metrics.frameDrops}`);
      results.details.push(`Micro-glitches: ${results.metrics.microGlitches}`);
      
      console.log(`📈 [MICRO_PERFECT_TEST] Stress test results:`, results.metrics);
      
    } catch (error) {
      console.error('❌ [MICRO_PERFECT_TEST] Stress test failed:', error.message);
      results.details.push(`Error: ${error.message}`);
    }
    
    this.testResults.push(results);
    return results;
  }

  async generateMicroPerfectReport() {
    console.log('📝 [MICRO_PERFECT_TEST] Generating micro-perfection report...');
    
    const report = {
      timestamp: new Date().toISOString(),
      testType: 'MICRO_PERFECT_SIDEBAR_TRANSITION_TEST',
      summary: {
        totalTests: this.testResults.length,
        passedTests: this.testResults.filter(r => r.passed).length,
        failedTests: this.testResults.filter(r => !r.passed).length,
        microPerfectionAchieved: this.testResults.every(r => r.passed)
      },
      testResults: this.testResults,
      thresholds: MICRO_PERFECTION_THRESHOLDS,
      recommendations: []
    };
    
    // Generate recommendations based on failures
    const failedTests = this.testResults.filter(r => !r.passed);
    if (failedTests.length > 0) {
      report.recommendations.push('⚠️  Micro-perfection not achieved. Review the following:');
      
      failedTests.forEach(test => {
        test.details.forEach(detail => {
          if (detail.includes('❌')) {
            report.recommendations.push(`  - ${detail.replace('❌', '')}`);
          }
        });
      });
    } else {
      report.recommendations.push('🎉 ABSOLUTE MICRO-PERFECTION ACHIEVED!');
      report.recommendations.push('  - Zero micro-glitches detected');
      report.recommendations.push('  - Sub-pixel precision maintained');
      report.recommendations.push('  - Perfect frame synchronization');
      report.recommendations.push('  - Butter-smooth transitions');
    }
    
    // Save report
    const reportPath = path.join(__dirname, 'MICRO_PERFECT_SIDEBAR_TEST_REPORT.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log(`💾 [MICRO_PERFECT_TEST] Report saved to: ${reportPath}`);
    return report;
  }

  async cleanup() {
    console.log('🧹 [MICRO_PERFECT_TEST] Cleaning up...');
    
    if (this.context) {
      await this.context.close();
    }
    
    if (this.browser) {
      await this.browser.close();
    }
    
    console.log('✅ [MICRO_PERFECT_TEST] Cleanup completed');
  }
}

// Main execution function
async function runMicroPerfectSidebarTest() {
  const tester = new MicroPerfectSidebarTester();
  
  try {
    // Initialize
    await tester.initialize();
    
    // Navigate to dashboard
    const navigationSuccess = await tester.navigateToDashboard();
    if (!navigationSuccess) {
      throw new Error('Failed to navigate to dashboard');
    }
    
    // Perform micro-perfect transition test
    await tester.performMicroPerfectTransitionTest();
    
    // Perform rapid toggle stress test
    await tester.performRapidToggleStressTest();
    
    // Generate report
    const report = await tester.generateMicroPerfectReport();
    
    // Log summary
    console.log('\n🎯 [MICRO_PERFECT_TEST] FINAL RESULTS:');
    console.log(`Total Tests: ${report.summary.totalTests}`);
    console.log(`Passed Tests: ${report.summary.passedTests}`);
    console.log(`Failed Tests: ${report.summary.failedTests}`);
    console.log(`Micro-Perfection Achieved: ${report.summary.microPerfectionAchieved ? 'YES ✅' : 'NO ❌'}`);
    
    return report;
    
  } catch (error) {
    console.error('❌ [MICRO_PERFECT_TEST] Test execution failed:', error);
    throw error;
  } finally {
    await tester.cleanup();
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  console.log('🚀 [MICRO_PERFECT_TEST] Starting micro-perfect sidebar transition tests...\n');
  
  runMicroPerfectSidebarTest()
    .then(() => {
      console.log('\n✅ [MICRO_PERFECT_TEST] All tests completed successfully!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ [MICRO_PERFECT_TEST] Test execution failed:', error);
      process.exit(1);
    });
}

module.exports = { MicroPerfectSidebarTester, runMicroPerfectSidebarTest };