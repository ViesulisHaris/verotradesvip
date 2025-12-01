/**
 * Zoom Detection Verification Test
 * 
 * This script tests the zoom detection functionality to verify it works correctly
 * after all the fixes that were implemented.
 */

const puppeteer = require('puppeteer');
const path = require('path');

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testZoomDetection() {
  console.log('🔍 Starting Zoom Detection Verification Test...\n');
  
  const browser = await puppeteer.launch({
    headless: false, // Show browser for manual verification
    defaultViewport: null,
    args: ['--start-maximized']
  });
  
  const page = await browser.newPage();
  
  // Enable console logging from the page
  page.on('console', msg => {
    console.log('📱 Browser Console:', msg.text());
  });
  
  // Enable request interception to check for errors
  page.on('requestfailed', request => {
    console.error('❌ Request failed:', request.url(), request.failure());
  });
  
  try {
    // Test 1: Navigate to the application and check if zoom detection is loaded
    console.log('📍 Test 1: Loading application and checking zoom detection availability...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
    await sleep(2000);
    
    // Check if zoom detection is available in the window object
    const zoomDetectionAvailable = await page.evaluate(() => {
      return typeof window !== 'undefined' && 
             (window.__zoomInfo !== undefined || 
              document.querySelector('.zoom-debug-panel') !== null ||
              document.querySelector('.zoom-indicator') !== null);
    });
    
    console.log(`   Zoom detection available: ${zoomDetectionAvailable ? '✅ YES' : '❌ NO'}`);
    
    // Test 2: Check if ZoomAwareLayout component is being used
    console.log('\n📍 Test 2: Checking if ZoomAwareLayout is integrated...');
    const zoomAwareLayoutUsed = await page.evaluate(() => {
      // Check for zoom-aware CSS classes
      const body = document.body;
      const hasZoomClasses = body.classList.contains('zoom-low') || 
                           body.classList.contains('zoom-normal') || 
                           body.classList.contains('zoom-high') ||
                           body.classList.contains('zoom-very-high');
      
      // Check for CSS custom properties
      const hasZoomVars = body.style.getPropertyValue('--zoom-level') !== '' ||
                        body.style.getPropertyValue('--zoom-percentage') !== '';
      
      // Check for zoom-aware layout wrapper
      const zoomLayout = document.querySelector('.zoom-aware-layout');
      
      return hasZoomClasses || hasZoomVars || zoomLayout;
    });
    
    console.log(`   ZoomAwareLayout integrated: ${zoomAwareLayoutUsed ? '✅ YES' : '❌ NO'}`);
    
    // Test 3: Test zoom detection at different zoom levels
    console.log('\n📍 Test 3: Testing zoom detection at different zoom levels...');
    
    const zoomLevels = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];
    const zoomResults = [];
    
    for (const zoomLevel of zoomLevels) {
      console.log(`   Testing zoom level: ${zoomLevel * 100}%`);
      
      // Set zoom level
      await page.evaluate((zoom) => {
        document.body.style.zoom = zoom.toString();
      }, zoomLevel);
      
      await sleep(1000);
      
      // Check zoom detection
      const zoomInfo = await page.evaluate(() => {
        const zoomInfo = window.__zoomInfo;
        if (zoomInfo) {
          return {
            detected: true,
            level: zoomInfo.level,
            percentage: zoomInfo.percentage,
            effectiveWidth: zoomInfo.effectiveWidth,
            breakpoint: zoomInfo.breakpoint
          };
        }
        return { detected: false };
      });
      
      zoomResults.push({
        zoomLevel,
        detected: zoomInfo.detected,
        info: zoomInfo
      });
      
      console.log(`     Detected: ${zoomInfo.detected ? '✅ YES' : '❌ NO'}`);
      if (zoomInfo.detected) {
        console.log(`     Level: ${zoomInfo.level}, Percentage: ${zoomInfo.percentage}%`);
        console.log(`     Effective Width: ${zoomInfo.effectiveWidth}px, Breakpoint: ${zoomInfo.breakpoint}`);
      }
    }
    
    // Test 4: Test responsive layout behavior
    console.log('\n📍 Test 4: Testing responsive layout behavior...');
    
    const viewportSizes = [
      { width: 375, height: 667, name: 'Mobile' },   // iPhone
      { width: 768, height: 1024, name: 'Tablet' },  // iPad
      { width: 1024, height: 768, name: 'Desktop' },  // Desktop
      { width: 1920, height: 1080, name: 'Large Desktop' }
    ];
    
    const responsiveResults = [];
    
    for (const viewport of viewportSizes) {
      console.log(`   Testing ${viewport.name} (${viewport.width}x${viewport.height})`);
      
      await page.setViewport({ width: viewport.width, height: viewport.height });
      await sleep(1000);
      
      const layoutInfo = await page.evaluate(() => {
        const zoomInfo = window.__zoomInfo;
        const body = document.body;
        
        return {
          zoomDetected: !!zoomInfo,
          zoomLevel: zoomInfo?.level || 1,
          zoomPercentage: zoomInfo?.percentage || 100,
          effectiveWidth: zoomInfo?.effectiveWidth || window.innerWidth,
          breakpoint: zoomInfo?.breakpoint || 'unknown',
          isDesktop: zoomInfo?.isDesktop || false,
          isTablet: zoomInfo?.isTablet || false,
          isMobile: zoomInfo?.isMobile || false,
          bodyClasses: Array.from(body.classList),
          zoomVars: {
            zoomLevel: body.style.getPropertyValue('--zoom-level'),
            zoomPercentage: body.style.getPropertyValue('--zoom-percentage'),
            actualWidth: body.style.getPropertyValue('--actual-width'),
            effectiveWidth: body.style.getPropertyValue('--effective-width')
          }
        };
      });
      
      responsiveResults.push({
        viewport: viewport.name,
        ...layoutInfo
      });
      
      console.log(`     Zoom detected: ${layoutInfo.zoomDetected ? '✅ YES' : '❌ NO'}`);
      console.log(`     View type: ${layoutInfo.isDesktop ? 'Desktop' : layoutInfo.isTablet ? 'Tablet' : 'Mobile'}`);
      console.log(`     Breakpoint: ${layoutInfo.breakpoint}`);
    }
    
    // Test 5: Check for zoom-related errors
    console.log('\n📍 Test 5: Checking for zoom-related errors...');
    
    const consoleErrors = [];
    const consoleWarnings = [];
    
    page.on('console', msg => {
      const text = msg.text();
      if (text.toLowerCase().includes('zoom') || 
          text.toLowerCase().includes('ssr') || 
          text.toLowerCase().includes('window is undefined')) {
        if (msg.type() === 'error') {
          consoleErrors.push(text);
        } else if (msg.type() === 'warning') {
          consoleWarnings.push(text);
        }
      }
    });
    
    // Trigger some zoom changes to catch errors
    for (let i = 0; i < 3; i++) {
      await page.evaluate((zoom) => {
        document.body.style.zoom = zoom.toString();
        window.dispatchEvent(new Event('resize'));
      }, 0.8 + (i * 0.2));
      await sleep(500);
    }
    
    console.log(`   Zoom-related errors: ${consoleErrors.length} ❌`);
    consoleErrors.forEach(error => console.log(`     - ${error}`));
    
    console.log(`   Zoom-related warnings: ${consoleWarnings.length} ⚠️`);
    consoleWarnings.forEach(warning => console.log(`     - ${warning}`));
    
    // Test 6: Test sidebar behavior (if present)
    console.log('\n📍 Test 6: Testing sidebar behavior with zoom...');
    
    const sidebarTest = await page.evaluate(() => {
      const sidebar = document.querySelector('.sidebar, .desktop-sidebar, [class*="sidebar"]');
      if (!sidebar) {
        return { present: false };
      }
      
      const isVisible = sidebar.offsetParent !== null;
      const displayStyle = window.getComputedStyle(sidebar).display;
      const visibilityStyle = window.getComputedStyle(sidebar).visibility;
      
      return {
        present: true,
        visible: isVisible,
        display: displayStyle,
        visibility: visibilityStyle,
        classes: Array.from(sidebar.classList)
      };
    });
    
    console.log(`   Sidebar present: ${sidebarTest.present ? '✅ YES' : '❌ NO'}`);
    if (sidebarTest.present) {
      console.log(`   Sidebar visible: ${sidebarTest.visible ? '✅ YES' : '❌ NO'}`);
      console.log(`   Display: ${sidebarTest.display}, Visibility: ${sidebarTest.visibility}`);
    }
    
    // Generate test results
    const testResults = {
      timestamp: new Date().toISOString(),
      summary: {
        zoomDetectionAvailable,
        zoomAwareLayoutUsed,
        zoomTests: zoomResults,
        responsiveTests: responsiveResults,
        errors: consoleErrors,
        warnings: consoleWarnings,
        sidebarTest
      },
      issues: []
    };
    
    // Identify issues
    if (!zoomDetectionAvailable) {
      testResults.issues.push('Zoom detection is not available in the application');
    }
    
    if (!zoomAwareLayoutUsed) {
      testResults.issues.push('ZoomAwareLayout component is not integrated into the application');
    }
    
    if (consoleErrors.length > 0) {
      testResults.issues.push(`${consoleErrors.length} zoom-related errors detected`);
    }
    
    if (zoomResults.some(r => !r.detected)) {
      testResults.issues.push('Zoom detection failed at some zoom levels');
    }
    
    // Save results
    const resultsPath = path.join(__dirname, `zoom-detection-test-results-${Date.now()}.json`);
    require('fs').writeFileSync(resultsPath, JSON.stringify(testResults, null, 2));
    
    console.log('\n📊 Test Results Summary:');
    console.log(`   Zoom detection available: ${zoomDetectionAvailable ? '✅ YES' : '❌ NO'}`);
    console.log(`   ZoomAwareLayout integrated: ${zoomAwareLayoutUsed ? '✅ YES' : '❌ NO'}`);
    console.log(`   Zoom levels tested: ${zoomResults.length}`);
    console.log(`   Successful zoom detections: ${zoomResults.filter(r => r.detected).length}`);
    console.log(`   Viewport sizes tested: ${responsiveResults.length}`);
    console.log(`   Console errors: ${consoleErrors.length}`);
    console.log(`   Console warnings: ${consoleWarnings.length}`);
    console.log(`   Issues found: ${testResults.issues.length}`);
    
    if (testResults.issues.length > 0) {
      console.log('\n🚨 Issues Identified:');
      testResults.issues.forEach((issue, index) => {
        console.log(`   ${index + 1}. ${issue}`);
      });
    }
    
    console.log(`\n💾 Detailed results saved to: ${resultsPath}`);
    
    await sleep(3000); // Keep browser open for manual inspection
    await browser.close();
    
    return testResults;
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
    await browser.close();
    throw error;
  }
}

// Run the test
if (require.main === module) {
  testZoomDetection()
    .then(results => {
      console.log('\n✅ Zoom detection test completed');
      process.exit(results.issues.length > 0 ? 1 : 0);
    })
    .catch(error => {
      console.error('\n❌ Zoom detection test failed:', error);
      process.exit(1);
    });
}

module.exports = { testZoomDetection };