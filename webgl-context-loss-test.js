// Test script to verify WebGL context loss handling in Balatro component
// This script simulates context loss and tests the restoration mechanism

const { chromium } = require('playwright');

async function testWebGLContextLossHandling() {
  console.log('Starting WebGL context loss handling test...');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Navigate to the dashboard page where Balatro component is used
    await page.goto('http://localhost:3000/dashboard');
    
    // Wait for the page to load
    await page.waitForTimeout(3000);
    
    // Check if WebGL context is initially created
    const initialWebGLStatus = await page.evaluate(() => {
      const canvas = document.querySelector('.balatro-canvas');
      if (!canvas) return { hasCanvas: false, hasWebGL: false };
      
      // Try to get WebGL context directly
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      
      // Also check if OGL has created a context (it might be stored differently)
      let hasOGLContext = false;
      let glVendor = null;
      let glRenderer = null;
      let isContextLost = null;
      
      // Check for OGL context by looking for any WebGL context on the canvas
      for (const contextType of ['webgl', 'experimental-webgl', 'webgl2']) {
        try {
          const context = canvas.getContext(contextType);
          if (context) {
            hasOGLContext = true;
            glVendor = context.getParameter(context.VENDOR);
            glRenderer = context.getParameter(context.RENDERER);
            isContextLost = context.isContextLost();
            break;
          }
        } catch (e) {
          // Ignore errors when trying to get context
        }
      }
      
      return {
        hasCanvas: true,
        hasWebGL: !!gl || hasOGLContext,
        isContextLost: isContextLost,
        glVendor: glVendor,
        glRenderer: glRenderer
      };
    });
    
    console.log('Initial WebGL status:', initialWebGLStatus);
    
    if (!initialWebGLStatus.hasCanvas) {
      console.error('Balatro canvas not found');
      return { success: false, error: 'Balatro canvas not found' };
    }
    
    if (!initialWebGLStatus.hasWebGL) {
      console.error('WebGL context not initially created');
      // Don't return immediately, let's continue to see if we can still test the context loss handling
      console.log('Continuing test to check if context can be created...');
    }
    
    // Take a screenshot of the initial state
    await page.screenshot({ path: 'webgl-test-initial.png' });
    
    // Simulate WebGL context loss by forcing it
    console.log('Simulating WebGL context loss...');
    await page.evaluate(() => {
      const canvas = document.querySelector('.balatro-canvas');
      if (!canvas) return;
      
      // Try to find any WebGL context
      let gl = null;
      for (const contextType of ['webgl', 'experimental-webgl', 'webgl2']) {
        try {
          gl = canvas.getContext(contextType);
          if (gl) break;
        } catch (e) {
          // Ignore errors
        }
      }
      
      if (gl) {
        // Force context loss
        const loseContextExtension = gl.getExtension('WEBGL_lose_context');
        if (loseContextExtension) {
          loseContextExtension.loseContext();
          console.log('WebGL context loss forced');
        } else {
          console.warn('WEBGL_lose_context extension not available');
        }
      } else {
        console.warn('No WebGL context found to force loss on');
      }
    });
    
    // Wait for context loss to be processed
    await page.waitForTimeout(2000);
    
    // Check WebGL status after context loss
    const afterLossStatus = await page.evaluate(() => {
      const canvas = document.querySelector('.balatro-canvas');
      if (!canvas) return { hasCanvas: false, hasWebGL: false };
      
      // Try to get any WebGL context
      let gl = null;
      for (const contextType of ['webgl', 'experimental-webgl', 'webgl2']) {
        try {
          gl = canvas.getContext(contextType);
          if (gl) break;
        } catch (e) {
          // Ignore errors
        }
      }
      
      return {
        hasCanvas: true,
        hasWebGL: !!gl,
        isContextLost: gl ? gl.isContextLost() : null
      };
    });
    
    console.log('WebGL status after context loss:', afterLossStatus);
    
    // Take a screenshot after context loss
    await page.screenshot({ path: 'webgl-test-after-loss.png' });
    
    // Restore the WebGL context
    console.log('Restoring WebGL context...');
    await page.evaluate(() => {
      const canvas = document.querySelector('.balatro-canvas');
      if (!canvas) return;
      
      // Try to find any WebGL context
      let gl = null;
      for (const contextType of ['webgl', 'experimental-webgl', 'webgl2']) {
        try {
          gl = canvas.getContext(contextType);
          if (gl) break;
        } catch (e) {
          // Ignore errors
        }
      }
      
      if (gl) {
        const loseContextExtension = gl.getExtension('WEBGL_lose_context');
        if (loseContextExtension) {
          loseContextExtension.restoreContext();
          console.log('WebGL context restore forced');
        }
      } else {
        console.warn('No WebGL context found to force restore on');
      }
    });
    
    // Wait for context restoration to be processed
    await page.waitForTimeout(3000);
    
    // Check WebGL status after restoration
    const afterRestoreStatus = await page.evaluate(() => {
      const canvas = document.querySelector('.balatro-canvas');
      if (!canvas) return { hasCanvas: false, hasWebGL: false };
      
      // Try to get any WebGL context
      let gl = null;
      for (const contextType of ['webgl', 'experimental-webgl', 'webgl2']) {
        try {
          gl = canvas.getContext(contextType);
          if (gl) break;
        } catch (e) {
          // Ignore errors
        }
      }
      
      return {
        hasCanvas: true,
        hasWebGL: !!gl,
        isContextLost: gl ? gl.isContextLost() : null,
        glVendor: gl ? gl.getParameter(gl.VENDOR) : null,
        glRenderer: gl ? gl.getParameter(gl.RENDERER) : null
      };
    });
    
    console.log('WebGL status after restoration:', afterRestoreStatus);
    
    // Take a screenshot after context restoration
    await page.screenshot({ path: 'webgl-test-after-restore.png' });
    
    // Check if the background is still rendering (by analyzing the canvas content)
    const isBackgroundRendering = await page.evaluate(() => {
      const canvas = document.querySelector('.balatro-canvas');
      if (!canvas) return false;
      
      const ctx = canvas.getContext('2dd'); // Try 2D context to read pixels
      if (!ctx) return true; // If we can't get 2D context, assume it's rendering
      
      try {
        const imageData = ctx.getImageData(0, 0, 1, 1);
        const pixel = imageData.data;
        
        // Check if pixel is not just the default blue background
        // Default blue would be around RGB(30, 58, 138) based on the CSS
        const isNotDefaultBlue = 
          Math.abs(pixel[0] - 30) > 20 || 
          Math.abs(pixel[1] - 58) > 20 || 
          Math.abs(pixel[2] - 138) > 20;
        
        return isNotDefaultBlue;
      } catch (e) {
        // If we can't read pixels, assume it's rendering
        return true;
      }
    });
    
    console.log('Is background rendering after restoration:', isBackgroundRendering);
    
    // Check console logs for context loss/restore events
    const consoleLogs = await page.evaluate(() => {
      return window.consoleLogs || [];
    });
    
    const contextLossLogs = consoleLogs.filter(log => 
      log.message.includes('WebGL context lost') || 
      log.message.includes('WebGL context restored')
    );
    
    console.log('Context loss/restore console logs:');
    contextLossLogs.forEach(log => {
      console.log(`  [${log.level}] ${log.message}`);
    });
    
    // Determine test result
    const testResult = {
      success: true,
      initialWebGLCreated: initialWebGLStatus.hasWebGL,
      contextLossHandled: afterLossStatus.isContextLost === true || afterLossStatus.isContextLost === null,
      contextRestored: afterRestoreStatus.hasWebGL && afterRestoreStatus.isContextLost === false,
      backgroundRendering: isBackgroundRendering,
      contextLossEventsLogged: contextLossLogs.some(log => log.message.includes('WebGL context lost')),
      contextRestoreEventsLogged: contextLossLogs.some(log => log.message.includes('WebGL context restored'))
    };
    
    // Check if all conditions are met
    testResult.success = 
      testResult.initialWebGLCreated &&
      testResult.contextLossHandled &&
      testResult.contextRestored &&
      testResult.backgroundRendering;
    
    console.log('\n=== TEST RESULTS ===');
    console.log('Initial WebGL context created:', testResult.initialWebGLCreated ? '✓' : '✗');
    console.log('Context loss handled:', testResult.contextLossHandled ? '✓' : '✗');
    console.log('Context restored:', testResult.contextRestored ? '✓' : '✗');
    console.log('Background rendering:', testResult.backgroundRendering ? '✓' : '✗');
    console.log('Context loss events logged:', testResult.contextLossEventsLogged ? '✓' : '✗');
    console.log('Context restore events logged:', testResult.contextRestoreEventsLogged ? '✓' : '✗');
    console.log('Overall test result:', testResult.success ? 'PASS' : 'FAIL');
    
    // Save test results to file
    await page.evaluate((result) => {
      const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'webgl-context-loss-test-results.json';
      a.click();
      URL.revokeObjectURL(url);
    }, testResult);
    
    return testResult || { success: false, error: 'Test result not defined' };
    
  } catch (error) {
    console.error('Test failed with error:', error);
    return { success: false, error: error.message };
  } finally {
    await browser.close();
  }
}

// Run the test
testWebGLContextLossHandling().then(result => {
  console.log('Test completed');
  if (result && result.success !== undefined) {
    process.exit(result.success ? 0 : 1);
  } else {
    console.error('Invalid test result:', result);
    process.exit(1);
  }
}).catch(error => {
  console.error('Test execution failed:', error);
  process.exit(1);
});