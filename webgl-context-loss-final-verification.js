const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

/**
 * Comprehensive WebGL Context Loss Final Verification Test
 * 
 * This test verifies that the Balatro component properly handles WebGL context loss
 * and restores the background rendering correctly.
 */

class WebGLContextLossVerification {
  constructor() {
    this.browser = null;
    this.page = null;
    this.testResults = {
      timestamp: new Date().toISOString(),
      browserInfo: {},
      webglInfo: {},
      initialRender: {},
      contextLossTest: {},
      contextRestoreTest: {},
      visualVerification: {},
      performanceMetrics: {},
      overallStatus: 'PENDING'
    };
    this.screenshots = [];
    this.consoleLogs = [];
  }

  async initialize() {
    console.log('[INIT] Starting WebGL Context Loss Final Verification...');
    
    // Launch browser with WebGL support
    this.browser = await puppeteer.launch({
      headless: false, // Keep visible for debugging
      defaultViewport: { width: 1920, height: 1080 },
      args: [
        '--enable-webgl',
        '--enable-webgl2-compute-context',
        '--disable-gpu-driver-bug-workarounds',
        '--no-sandbox',
        '--disable-setuid-sandbox'
      ]
    });

    this.page = await this.browser.newPage();
    
    // Capture console logs
    this.page.on('console', msg => {
      const logEntry = {
        timestamp: new Date().toISOString(),
        type: msg.type(),
        text: msg.text(),
        location: msg.location()
      };
      this.consoleLogs.push(logEntry);
      console.log(`[CONSOLE] ${msg.type()}: ${msg.text()}`);
    });

    // Capture page errors
    this.page.on('pageerror', error => {
      console.error('[PAGE ERROR]', error.message);
      this.testResults.contextLossTest.errors = this.testResults.contextLossTest.errors || [];
      this.testResults.contextLossTest.errors.push({
        timestamp: new Date().toISOString(),
        message: error.message,
        stack: error.stack
      });
    });

    // Get browser info
    const version = await this.page.browser().version();
    this.testResults.browserInfo = {
      version,
      userAgent: await this.page.evaluate(() => navigator.userAgent),
      platform: await this.page.evaluate(() => navigator.platform)
    };

    console.log('[INIT] Browser launched successfully');
    console.log('[INIT] Browser info:', this.testResults.browserInfo);
  }

  async navigateToTestPage() {
    console.log('[NAVIGATE] Navigating to Balatro test page...');
    
    // Navigate to the simple Balatro test page
    await this.page.goto('http://localhost:3000/test-balatro-simple', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    // Wait for the page to load completely
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log('[NAVIGATE] Page loaded successfully');
  }

  async captureInitialWebGLState() {
    console.log('[WEBGL] Capturing initial WebGL state...');
    
    const webglInfo = await this.page.evaluate(() => {
      const canvas = document.querySelector('.balatro-canvas');
      if (!canvas) return { error: 'Balatro canvas not found' };

      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
      if (!gl) return { error: 'WebGL context not available' };

      return {
        canvas: {
          width: canvas.width,
          height: canvas.height,
          clientWidth: canvas.clientWidth,
          clientHeight: canvas.clientHeight
        },
        webgl: {
          version: gl.getParameter(gl.VERSION),
          vendor: gl.getParameter(gl.VENDOR),
          renderer: gl.getParameter(gl.RENDERER),
          shadingLanguageVersion: gl.getParameter(gl.SHADING_LANGUAGE_VERSION)
        },
        extensions: gl.getSupportedExtensions() || []
      };
    });

    this.testResults.webglInfo = webglInfo;
    console.log('[WEBGL] Initial WebGL state captured:', webglInfo);

    if (webglInfo.error) {
      throw new Error(`WebGL initialization failed: ${webglInfo.error}`);
    }
  }

  async verifyInitialRender() {
    console.log('[RENDER] Verifying initial render...');
    
    // Wait for initial render
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Take initial screenshot
    const initialScreenshot = `balatro-initial-render-${Date.now()}.png`;
    await this.page.screenshot({ 
      path: initialScreenshot,
      fullPage: false 
    });
    this.screenshots.push(initialScreenshot);
    
    // Check if background is visible (not just blue)
    const backgroundCheck = await this.page.evaluate(() => {
      const canvas = document.querySelector('.balatro-canvas');
      if (!canvas) return { visible: false, reason: 'Canvas not found' };

      const ctx = canvas.getContext('2d') || canvas.getContext('webgl2') || canvas.getContext('webgl');
      if (!ctx) return { visible: false, reason: 'No context available' };

      // Sample some pixels to check for gradient effect
      const imageData = ctx.readPixels ? 
        (() => {
          const pixels = new Uint8Array(canvas.width * canvas.height * 4);
          ctx.readPixels(0, 0, canvas.width, canvas.height, ctx.RGBA, ctx.UNSIGNED_BYTE, pixels);
          return pixels;
        })() : null;

      if (!imageData) {
        return { visible: false, reason: 'Cannot read pixels' };
      }

      // Check for color variation (not just solid blue)
      let colorVariation = false;
      let sampleColors = [];
      
      for (let i = 0; i < Math.min(100, imageData.length / 4); i++) {
        const r = imageData[i * 4];
        const g = imageData[i * 4 + 1];
        const b = imageData[i * 4 + 2];
        sampleColors.push({ r, g, b });
      }

      // Check if we have variation in the sampled colors
      const avgR = sampleColors.reduce((sum, c) => sum + c.r, 0) / sampleColors.length;
      const avgG = sampleColors.reduce((sum, c) => sum + c.g, 0) / sampleColors.length;
      const avgB = sampleColors.reduce((sum, c) => sum + c.b, 0) / sampleColors.length;

      colorVariation = sampleColors.some(c => 
        Math.abs(c.r - avgR) > 10 || Math.abs(c.g - avgG) > 10 || Math.abs(c.b - avgB) > 10
      );

      return {
        visible: colorVariation,
        averageColor: { r: Math.round(avgR), g: Math.round(avgG), b: Math.round(avgB) },
        colorVariation,
        sampleCount: sampleColors.length
      };
    });

    this.testResults.initialRender = {
      screenshot: initialScreenshot,
      backgroundCheck,
      timestamp: new Date().toISOString()
    };

    console.log('[RENDER] Initial render verification:', backgroundCheck);
    return backgroundCheck.visible;
  }

  async simulateContextLoss() {
    console.log('[CONTEXT LOSS] Simulating WebGL context loss...');
    
    const contextLossResult = await this.page.evaluate(() => {
      return new Promise((resolve) => {
        const canvas = document.querySelector('.balatro-canvas');
        if (!canvas) {
          resolve({ success: false, error: 'Canvas not found' });
          return;
        }

        const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
        if (!gl) {
          resolve({ success: false, error: 'WebGL context not found' });
          return;
        }

        console.log('[CONTEXT LOSS] Found WebGL context, simulating loss...');
        
        // Store the original context for comparison
        const originalContext = gl;
        
        // Listen for context loss event
        let lossEventFired = false;
        const lossHandler = (event) => {
          console.log('[CONTEXT LOSS] Context loss event fired:', event);
          lossEventFired = true;
        };
        
        canvas.addEventListener('webglcontextlost', lossHandler);
        
        // Force context loss using the extension if available
        const loseContext = gl.getExtension('WEBGL_lose_context');
        if (loseContext) {
          console.log('[CONTEXT LOSS] Using WEBGL_lose_context extension');
          loseContext.loseContext();
          
          // Give some time for the event to propagate
          setTimeout(() => {
            canvas.removeEventListener('webglcontextlost', lossHandler);
            resolve({
              success: true,
              method: 'WEBGL_lose_context extension',
              lossEventFired,
              timestamp: new Date().toISOString()
            });
          }, 1000);
        } else {
          // Fallback: force context loss by removing canvas
          console.log('[CONTEXT LOSS] Extension not available, using fallback method');
          const parent = canvas.parentNode;
          if (parent) {
            parent.removeChild(canvas);
            
            setTimeout(() => {
              parent.appendChild(canvas);
              canvas.removeEventListener('webglcontextlost', lossHandler);
              resolve({
                success: true,
                method: 'Canvas removal/reinsertion',
                lossEventFired,
                timestamp: new Date().toISOString()
              });
            }, 1000);
          } else {
            canvas.removeEventListener('webglcontextlost', lossHandler);
            resolve({ success: false, error: 'Could not simulate context loss' });
          }
        }
      });
    });

    this.testResults.contextLossTest = {
      ...contextLossResult,
      timestamp: new Date().toISOString()
    };

    console.log('[CONTEXT LOSS] Context loss simulation result:', contextLossResult);
    
    // Wait for context loss to be processed
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    return contextLossResult.success;
  }

  async verifyContextLossState() {
    console.log('[CONTEXT LOSS] Verifying context loss state...');
    
    // Take screenshot after context loss
    const lossScreenshot = `balatro-context-loss-${Date.now()}.png`;
    await this.page.screenshot({ 
      path: lossScreenshot,
      fullPage: false 
    });
    this.screenshots.push(lossScreenshot);

    // Check if background is still rendering (should be degraded or gone)
    const lossStateCheck = await this.page.evaluate(() => {
      const canvas = document.querySelector('.balatro-canvas');
      if (!canvas) return { state: 'NO_CANVAS', reason: 'Canvas not found' };

      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
      if (!gl) return { state: 'NO_CONTEXT', reason: 'WebGL context lost' };

      // Check if context is lost
      if (gl.isContextLost && gl.isContextLost()) {
        return { state: 'CONTEXT_LOST', reason: 'WebGL context is lost' };
      }

      // Try to read pixels to see if rendering is working
      try {
        const pixels = new Uint8Array(4);
        gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
        return { state: 'STILL_RENDERING', pixels: Array.from(pixels) };
      } catch (error) {
        return { state: 'ERROR', reason: error.message };
      }
    });

    this.testResults.contextLossTest.stateCheck = lossStateCheck;
    console.log('[CONTEXT LOSS] Context loss state verification:', lossStateCheck);
    
    return lossStateCheck;
  }

  async simulateContextRestore() {
    console.log('[CONTEXT RESTORE] Simulating WebGL context restoration...');
    
    const restoreResult = await this.page.evaluate(() => {
      return new Promise((resolve) => {
        const canvas = document.querySelector('.balatro-canvas');
        if (!canvas) {
          resolve({ success: false, error: 'Canvas not found' });
          return;
        }

        console.log('[CONTEXT RESTORE] Attempting to restore context...');
        
        // Listen for context restore event
        let restoreEventFired = false;
        const restoreHandler = (event) => {
          console.log('[CONTEXT RESTORE] Context restore event fired:', event);
          restoreEventFired = true;
        };
        
        canvas.addEventListener('webglcontextrestored', restoreHandler);
        
        // Force context restore using the extension if available
        const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
        const loseContext = gl ? gl.getExtension('WEBGL_lose_context') : null;
        
        if (loseContext) {
          console.log('[CONTEXT RESTORE] Using WEBGL_lose_context extension to restore');
          loseContext.restoreContext();
          
          // Give more time for restoration and resource recreation
          setTimeout(() => {
            canvas.removeEventListener('webglcontextrestored', restoreHandler);
            resolve({
              success: true,
              method: 'WEBGL_lose_context extension',
              restoreEventFired,
              timestamp: new Date().toISOString()
            });
          }, 3000);
        } else {
          // Fallback: trigger a resize to force recreation
          console.log('[CONTEXT RESTORE] Extension not available, using fallback method');
          const originalWidth = canvas.width;
          const originalHeight = canvas.height;
          
          canvas.width = 1;
          canvas.height = 1;
          
          setTimeout(() => {
            canvas.width = originalWidth;
            canvas.height = originalHeight;
            
            // Additional wait for full restoration
            setTimeout(() => {
              canvas.removeEventListener('webglcontextrestored', restoreHandler);
              resolve({
                success: true,
                method: 'Canvas resize trigger',
                restoreEventFired,
                timestamp: new Date().toISOString()
              });
            }, 2000);
          }, 1000);
        }
      });
    });

    this.testResults.contextRestoreTest = {
      ...restoreResult,
      timestamp: new Date().toISOString()
    };

    console.log('[CONTEXT RESTORE] Context restore simulation result:', restoreResult);
    
    // Wait for context restoration to complete
    await new Promise(resolve => setTimeout(resolve, 4000));
    
    return restoreResult.success;
  }

  async verifyRestoredRender() {
    console.log('[RESTORE] Verifying restored render...');
    
    // Take screenshot after context restore
    const restoreScreenshot = `balatro-context-restored-${Date.now()}.png`;
    await this.page.screenshot({ 
      path: restoreScreenshot,
      fullPage: false 
    });
    this.screenshots.push(restoreScreenshot);

    // Check if background is rendering properly again
    const restoreCheck = await this.page.evaluate(() => {
      const canvas = document.querySelector('.balatro-canvas');
      if (!canvas) return { restored: false, reason: 'Canvas not found' };

      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
      if (!gl) return { restored: false, reason: 'WebGL context not available' };

      // Check if context is still lost
      if (gl.isContextLost && gl.isContextLost()) {
        return { restored: false, reason: 'WebGL context is still lost' };
      }

      // Try to read pixels to verify rendering
      try {
        const pixels = new Uint8Array(canvas.width * canvas.height * 4);
        gl.readPixels(0, 0, canvas.width, canvas.height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
        
        // Check for color variation (gradient effect)
        let colorVariation = false;
        let sampleColors = [];
        
        // Sample pixels across the canvas
        const sampleCount = Math.min(100, pixels.length / 4);
        for (let i = 0; i < sampleCount; i++) {
          const idx = i * 4;
          const r = pixels[idx];
          const g = pixels[idx + 1];
          const b = pixels[idx + 2];
          sampleColors.push({ r, g, b });
        }

        // Calculate average and check for variation
        const avgR = sampleColors.reduce((sum, c) => sum + c.r, 0) / sampleColors.length;
        const avgG = sampleColors.reduce((sum, c) => sum + c.g, 0) / sampleColors.length;
        const avgB = sampleColors.reduce((sum, c) => sum + c.b, 0) / sampleColors.length;

        colorVariation = sampleColors.some(c => 
          Math.abs(c.r - avgR) > 5 || Math.abs(c.g - avgG) > 5 || Math.abs(c.b - avgB) > 5
        );

        return {
          restored: colorVariation,
          averageColor: { r: Math.round(avgR), g: Math.round(avgG), b: Math.round(avgB) },
          colorVariation,
          sampleCount: sampleColors.length,
          canvasSize: { width: canvas.width, height: canvas.height }
        };
      } catch (error) {
        return { restored: false, reason: `Pixel read failed: ${error.message}` };
      }
    });

    this.testResults.contextRestoreTest.restoreCheck = restoreCheck;
    console.log('[RESTORE] Context restore verification:', restoreCheck);
    
    return restoreCheck.restored;
  }

  async performVisualComparison() {
    console.log('[VISUAL] Performing visual comparison...');
    
    // Compare initial and restored renders
    const comparison = await this.page.evaluate(() => {
      const canvas = document.querySelector('.balatro-canvas');
      if (!canvas) return { success: false, reason: 'Canvas not found' };

      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
      if (!gl) return { success: false, reason: 'WebGL context not available' };

      // Check if animation is running
      const animationCheck = {
        contextActive: !gl.isContextLost || !gl.isContextLost(),
        canvasVisible: canvas.offsetWidth > 0 && canvas.offsetHeight > 0,
        mouseInteraction: canvas.classList.contains('mouse-interaction')
      };

      return {
        success: true,
        animationCheck,
        timestamp: new Date().toISOString()
      };
    });

    this.testResults.visualVerification = comparison;
    console.log('[VISUAL] Visual comparison result:', comparison);
    
    return comparison.success;
  }

  async measurePerformance() {
    console.log('[PERFORMANCE] Measuring performance metrics...');
    
    const performanceMetrics = await this.page.evaluate(() => {
      if (window.performance && window.performance.memory) {
        return {
          memory: {
            usedJSHeapSize: window.performance.memory.usedJSHeapSize,
            totalJSHeapSize: window.performance.memory.totalJSHeapSize,
            jsHeapSizeLimit: window.performance.memory.jsHeapSizeLimit
          },
          timing: window.performance.timing ? {
            loadEventEnd: window.performance.timing.loadEventEnd,
            domContentLoadedEventEnd: window.performance.timing.domContentLoadedEventEnd
          } : null
        };
      }
      return { error: 'Performance API not available' };
    });

    this.testResults.performanceMetrics = performanceMetrics;
    console.log('[PERFORMANCE] Performance metrics:', performanceMetrics);
  }

  async generateReport() {
    console.log('[REPORT] Generating final verification report...');
    
    // Determine overall status
    const initialRenderSuccess = this.testResults.initialRender.backgroundCheck?.visible || false;
    const contextLossSuccess = this.testResults.contextLossTest.success || false;
    const contextRestoreSuccess = this.testResults.contextRestoreTest.success || false;
    const restoredRenderSuccess = this.testResults.contextRestoreTest.restoreCheck?.restored || false;
    
    if (initialRenderSuccess && contextLossSuccess && contextRestoreSuccess && restoredRenderSuccess) {
      this.testResults.overallStatus = 'PASSED';
    } else {
      this.testResults.overallStatus = 'FAILED';
    }

    // Create comprehensive report
    const report = {
      summary: {
        status: this.testResults.overallStatus,
        timestamp: this.testResults.timestamp,
        testDuration: Date.now() - new Date(this.testResults.timestamp).getTime(),
        screenshots: this.screenshots.length,
        consoleLogs: this.consoleLogs.length
      },
      results: this.testResults,
      screenshots: this.screenshots,
      consoleLogs: this.consoleLogs,
      recommendations: this.generateRecommendations()
    };

    // Save report to file
    const reportFile = `webgl-context-loss-verification-report-${Date.now()}.json`;
    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
    
    console.log(`[REPORT] Report saved to: ${reportFile}`);
    console.log(`[REPORT] Overall test status: ${this.testResults.overallStatus}`);
    
    return report;
  }

  generateRecommendations() {
    const recommendations = [];
    
    if (!this.testResults.initialRender.backgroundCheck?.visible) {
      recommendations.push('Initial render failed - check WebGL initialization and shader compilation');
    }
    
    if (!this.testResults.contextLossTest.success) {
      recommendations.push('Context loss simulation failed - verify context loss event handling');
    }
    
    if (!this.testResults.contextRestoreTest.success) {
      recommendations.push('Context restore failed - verify context restoration mechanism');
    }
    
    if (!this.testResults.contextRestoreTest.restoreCheck?.restored) {
      recommendations.push('Post-restore rendering failed - check resource recreation logic');
    }
    
    if (this.testResults.contextLossTest.errors && this.testResults.contextLossTest.errors.length > 0) {
      recommendations.push('Errors detected during context loss - review error handling');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('All tests passed - WebGL context loss handling is working correctly');
    }
    
    return recommendations;
  }

  async cleanup() {
    console.log('[CLEANUP] Cleaning up test environment...');
    
    if (this.page) {
      await this.page.close();
    }
    
    if (this.browser) {
      await this.browser.close();
    }
    
    console.log('[CLEANUP] Cleanup completed');
  }

  async runFullTest() {
    try {
      await this.initialize();
      await this.navigateToTestPage();
      await this.captureInitialWebGLState();
      
      const initialSuccess = await this.verifyInitialRender();
      if (!initialSuccess) {
        console.warn('[WARNING] Initial render failed, but continuing with test...');
      }
      
      const contextLossSuccess = await this.simulateContextLoss();
      if (!contextLossSuccess) {
        throw new Error('Context loss simulation failed');
      }
      
      await this.verifyContextLossState();
      
      const contextRestoreSuccess = await this.simulateContextRestore();
      if (!contextRestoreSuccess) {
        throw new Error('Context restore simulation failed');
      }
      
      const restoredSuccess = await this.verifyRestoredRender();
      if (!restoredSuccess) {
        console.warn('[WARNING] Post-restore render verification failed');
      }
      
      await this.performVisualComparison();
      await this.measurePerformance();
      
      const report = await this.generateReport();
      
      return report;
      
    } catch (error) {
      console.error('[ERROR] Test failed:', error);
      this.testResults.overallStatus = 'ERROR';
      this.testResults.error = {
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      };
      
      const report = await this.generateReport();
      return report;
      
    } finally {
      await this.cleanup();
    }
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  console.log('='.repeat(80));
  console.log('WEBGL CONTEXT LOSS FINAL VERIFICATION TEST');
  console.log('='.repeat(80));
  
  const test = new WebGLContextLossVerification();
  
  test.runFullTest()
    .then(report => {
      console.log('\n' + '='.repeat(80));
      console.log('TEST COMPLETED');
      console.log('='.repeat(80));
      console.log(`Overall Status: ${report.summary.status}`);
      console.log(`Test Duration: ${report.summary.testDuration}ms`);
      console.log(`Screenshots: ${report.summary.screenshots}`);
      console.log(`Console Logs: ${report.summary.consoleLogs}`);
      
      if (report.recommendations.length > 0) {
        console.log('\nRecommendations:');
        report.recommendations.forEach((rec, i) => {
          console.log(`${i + 1}. ${rec}`);
        });
      }
      
      process.exit(report.summary.status === 'PASSED' ? 0 : 1);
    })
    .catch(error => {
      console.error('Test execution failed:', error);
      process.exit(1);
    });
}

module.exports = WebGLContextLossVerification;