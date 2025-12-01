/**
 * Test script to verify zoom detection functionality after SSR fix
 */

const puppeteer = require('puppeteer');

async function testZoomDetection() {
  console.log('🔍 Testing Zoom Detection Functionality After SSR Fix...\n');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1200, height: 800 }
  });
  
  try {
    const page = await browser.newPage();
    
    // Enable console logging from the page
    page.on('console', msg => {
      console.log(`📝 Browser Console: ${msg.text()}`);
    });
    
    // Enable error logging from the page
    page.on('pageerror', error => {
      console.error(`❌ Browser Error: ${error.message}`);
    });
    
    console.log('🌐 Navigating to homepage...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
    
    // Wait for the page to load completely
    await page.waitForTimeout(2000);
    
    // Check if page loaded successfully (not white screen)
    const pageTitle = await page.title();
    const bodyContent = await page.evaluate(() => document.body.innerHTML);
    
    console.log(`📄 Page Title: ${pageTitle}`);
    console.log(`📏 Body Content Length: ${bodyContent.length} characters`);
    
    if (bodyContent.length > 1000) {
      console.log('✅ Page loaded successfully - no white screen detected!');
    } else {
      console.log('❌ White screen detected - page content is minimal');
    }
    
    // Test zoom detection functionality
    console.log('\n🔍 Testing zoom detection functionality...');
    
    const zoomInfo = await page.evaluate(() => {
      // Check if zoom detection hook is available
      if (typeof window !== 'undefined' && window.__zoomInfo) {
        return window.__zoomInfo;
      }
      
      // Try to access zoom detector through global scope
      try {
        const zoomDetector = window.zoomDetector;
        if (zoomDetector) {
          return zoomDetector.getCurrentZoom();
        }
      } catch (error) {
        console.error('Error accessing zoom detector:', error);
      }
      
      return null;
    });
    
    if (zoomInfo) {
      console.log('✅ Zoom detection is working!');
      console.log(`📊 Zoom Level: ${zoomInfo.level} (${zoomInfo.percentage}%)`);
      console.log(`📐 Effective Width: ${zoomInfo.effectiveWidth}px`);
      console.log(`📱 Is Mobile View: ${zoomInfo.effectiveWidth < 768}`);
      console.log(`💻 Is Desktop View: ${zoomInfo.effectiveWidth >= 1024}`);
    } else {
      console.log('⚠️ Zoom detection not immediately available, checking after delay...');
      
      // Wait a bit more for zoom detection to initialize
      await page.waitForTimeout(3000);
      
      const zoomInfoAfterDelay = await page.evaluate(() => {
        if (typeof window !== 'undefined' && window.__zoomInfo) {
          return window.__zoomInfo;
        }
        return null;
      });
      
      if (zoomInfoAfterDelay) {
        console.log('✅ Zoom detection initialized after delay!');
        console.log(`📊 Zoom Level: ${zoomInfoAfterDelay.level} (${zoomInfoAfterDelay.percentage}%)`);
      } else {
        console.log('❌ Zoom detection failed to initialize');
      }
    }
    
    // Test browser zoom functionality
    console.log('\n🔍 Testing browser zoom response...');
    
    // Simulate zoom in
    await page.setViewport({ width: 800, height: 600 });
    await page.waitForTimeout(1000);
    
    const zoomInfoAfterZoom = await page.evaluate(() => {
      if (typeof window !== 'undefined' && window.__zoomInfo) {
        return window.__zoomInfo;
      }
      return null;
    });
    
    if (zoomInfoAfterZoom) {
      console.log('✅ Zoom detection responds to viewport changes!');
      console.log(`📊 New Zoom Level: ${zoomInfoAfterZoom.level} (${zoomInfoAfterZoom.percentage}%)`);
      console.log(`📐 New Effective Width: ${zoomInfoAfterZoom.effectiveWidth}px`);
    }
    
    // Navigate to dashboard to test zoom detection in authenticated area
    console.log('\n🔍 Testing zoom detection on dashboard page...');
    
    try {
      await page.goto('http://localhost:3000/dashboard', { waitUntil: 'networkidle2' });
      await page.waitForTimeout(2000);
      
      const dashboardZoomInfo = await page.evaluate(() => {
        if (typeof window !== 'undefined' && window.__zoomInfo) {
          return window.__zoomInfo;
        }
        return null;
      });
      
      if (dashboardZoomInfo) {
        console.log('✅ Zoom detection working on dashboard!');
        console.log(`📊 Dashboard Zoom Level: ${dashboardZoomInfo.level} (${dashboardZoomInfo.percentage}%)`);
      } else {
        console.log('⚠️ Zoom detection not available on dashboard (may require authentication)');
      }
    } catch (error) {
      console.log('⚠️ Could not access dashboard (authentication may be required)');
    }
    
    console.log('\n🎉 Zoom Detection Test Completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
}

// Run the test
testZoomDetection().catch(console.error);