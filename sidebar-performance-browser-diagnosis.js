// Browser-based Sidebar Performance Diagnosis Script
// This script will automate the diagnostic process and collect comprehensive performance data

const puppeteer = require('puppeteer');
const fs = require('fs');

async function runSidebarPerformanceDiagnosis() {
  console.log('🔍 [BROWSER DIAGNOSIS] Starting comprehensive sidebar performance diagnosis...');
  
  const browser = await puppeteer.launch({ 
    headless: false, // Set to true for headless mode
    defaultViewport: { width: 1920, height: 1080 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  // Enable performance monitoring
  await page.coverage.startJSCoverage();
  await page.coverage.startCSSCoverage();
  
  // Monitor console output
  const consoleMessages = [];
  page.on('console', msg => {
    consoleMessages.push({
      type: msg.type(),
      text: msg.text(),
      timestamp: Date.now()
    });
    console.log(`[BROWSER CONSOLE] ${msg.type()}: ${msg.text()}`);
  });
  
  // Monitor performance metrics
  const performanceMetrics = [];
  
  try {
    // Navigate to the sidebar performance test page
    console.log('🌐 [BROWSER DIAGNOSIS] Navigating to sidebar performance test page...');
    await page.goto('http://localhost:3000/test-sidebar-performance', { waitUntil: 'networkidle2' });
    
    // Wait for the page to fully load
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // This is a test page, so no authentication should be required
    console.log('🧪 [BROWSER DIAGNOSIS] Using dedicated sidebar performance test page');
    
    // Inject the diagnostic script
    console.log('💉 [BROWSER DIAGNOSIS] Injecting diagnostic script...');
    const diagnosticScript = fs.readFileSync('./sidebar-performance-diagnosis.js', 'utf8');
    await page.evaluate(diagnosticScript);
    
    // Additional enhanced monitoring
    await page.evaluate(() => {
      // Enhanced performance monitoring
      window.performanceData = {
        rafCalls: [],
        reRenders: [],
        localStorageOps: [],
        resizeEvents: [],
        domReflows: []
      };
      
      // Monitor resize events
      const originalResize = window.onresize;
      window.addEventListener('resize', () => {
        window.performanceData.resizeEvents.push({
          timestamp: performance.now(),
          width: window.innerWidth,
          height: window.innerHeight
        });
        console.log(`📏 [ENHANCED] Resize event detected: ${window.innerWidth}x${window.innerHeight}`);
      });
      
      // Monitor DOM reflows using forceLayout
      const originalOffsetHeight = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetHeight');
      Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
        get() {
          const result = originalOffsetHeight.get.call(this);
          if (window.performanceData) {
            window.performanceData.domReflows.push({
              timestamp: performance.now(),
              element: this.tagName + (this.className ? '.' + this.className : ''),
              offsetHeight: result
            });
          }
          return result;
        }
      });
      
      // Enhanced RAF monitoring
      let rafId = 0;
      const originalRAF = window.requestAnimationFrame;
      window.requestAnimationFrame = function(callback) {
        const id = ++rafId;
        const start = performance.now();
        
        return originalRAF(function() {
          const end = performance.now();
          window.performanceData.rafCalls.push({
            id,
            start,
            end,
            duration: end - start
          });
          
          console.log(`📊 [ENHANCED] RAF #${id} took ${(end - start).toFixed(2)}ms`);
          return callback.apply(this, arguments);
        });
      };
      
      console.log('🔧 [ENHANCED] Enhanced monitoring setup complete');
    });
    
    // Find the sidebar toggle button
    console.log('🔍 [BROWSER DIAGNOSIS] Locating sidebar toggle button...');
    
    // Wait for sidebar toggle to be available - use the specific button from the test page
    await page.waitForSelector('.btn-primary', { timeout: 10000 });
    
    // Get initial state
    const initialSidebarState = await page.evaluate(() => {
      const sidebar = document.querySelector('.sidebar, [class*="sidebar"], aside');
      return {
        visible: sidebar ? sidebar.offsetParent !== null : false,
        width: sidebar ? sidebar.offsetWidth : 0,
        collapsed: sidebar ? sidebar.classList.contains('collapsed') : false
      };
    });
    
    console.log('📊 [BROWSER DIAGNOSIS] Initial sidebar state:', initialSidebarState);
    
    // Perform multiple sidebar toggle tests
    const testResults = [];
    
    for (let i = 1; i <= 3; i++) {
      console.log(`🚀 [BROWSER DIAGNOSIS] Running sidebar toggle test #${i}...`);
      
      // Clear previous performance data
      await page.evaluate(() => {
        if (window.performanceData) {
          window.performanceData.rafCalls = [];
          window.performanceData.reRenders = [];
          window.performanceData.localStorageOps = [];
          window.performanceData.resizeEvents = [];
          window.performanceData.domReflows = [];
        }
      });
      
      // Start performance monitoring
      const startTime = Date.now();
      
      // Click the sidebar toggle button - use the specific button from the test page
      await page.click('.btn-primary');
      
      // Wait for the transition to complete (with timeout for slow transitions)
      await new Promise(resolve => setTimeout(resolve, 6000)); // 6 seconds to capture the 2-5 second delay
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Collect performance data
      const performanceData = await page.evaluate(() => {
        return window.performanceData || {};
      });
      
      // Get final sidebar state
      const finalSidebarState = await page.evaluate(() => {
        const sidebar = document.querySelector('.sidebar, [class*="sidebar"], aside');
        return {
          visible: sidebar ? sidebar.offsetParent !== null : false,
          width: sidebar ? sidebar.offsetWidth : 0,
          collapsed: sidebar ? sidebar.classList.contains('collapsed') : false
        };
      });
      
      const testResult = {
        testNumber: i,
        duration,
        startTime,
        endTime,
        initialState: initialSidebarState,
        finalState: finalSidebarState,
        performanceData,
        consoleMessages: consoleMessages.filter(msg => msg.timestamp >= startTime && msg.timestamp <= endTime)
      };
      
      testResults.push(testResult);
      
      console.log(`📊 [BROWSER DIAGNOSIS] Test #${i} completed in ${duration}ms`);
      console.log(`📊 [BROWSER DIAGNOSIS] RAF calls: ${performanceData.rafCalls?.length || 0}`);
      console.log(`📊 [BROWSER DIAGNOSIS] Resize events: ${performanceData.resizeEvents?.length || 0}`);
      console.log(`📊 [BROWSER DIAGNOSIS] DOM reflows: ${performanceData.domReflows?.length || 0}`);
      
      // Wait between tests
      if (i < 3) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    // Generate comprehensive report
    const report = {
      timestamp: new Date().toISOString(),
      testResults,
      summary: {
        averageDuration: testResults.reduce((sum, test) => sum + test.duration, 0) / testResults.length,
        maxDuration: Math.max(...testResults.map(test => test.duration)),
        minDuration: Math.min(...testResults.map(test => test.duration)),
        totalRAFCalls: testResults.reduce((sum, test) => sum + (test.performanceData.rafCalls?.length || 0), 0),
        totalResizeEvents: testResults.reduce((sum, test) => sum + (test.performanceData.resizeEvents?.length || 0), 0),
        totalDOMReflows: testResults.reduce((sum, test) => sum + (test.performanceData.domReflows?.length || 0), 0)
      },
      allConsoleMessages: consoleMessages
    };
    
    // Save the detailed report
    const reportFileName = `sidebar-performance-diagnosis-report-${Date.now()}.json`;
    fs.writeFileSync(reportFileName, JSON.stringify(report, null, 2));
    
    console.log(`📄 [BROWSER DIAGNOSIS] Detailed report saved to: ${reportFileName}`);
    
    // Print summary analysis
    console.log('\n🔍 [ANALYSIS] Performance Diagnosis Summary:');
    console.log(`⏱️  Average sidebar toggle duration: ${report.summary.averageDuration.toFixed(2)}ms`);
    console.log(`📊 Total RAF calls across all tests: ${report.summary.totalRAFCalls}`);
    console.log(`📏 Total resize events across all tests: ${report.summary.totalResizeEvents}`);
    console.log(`🔄 Total DOM reflows across all tests: ${report.summary.totalDOMReflows}`);
    
    // Identify bottlenecks
    if (report.summary.averageDuration > 2000) {
      console.log('❌ [CRITICAL] Sidebar toggle exceeds 2 seconds - PERFORMANCE ISSUE CONFIRMED');
      
      if (report.summary.totalRAFCalls > 60) {
        console.log('❌ [CAUSE] Excessive RAF calls detected - likely animation frame thrashing');
      }
      
      if (report.summary.totalResizeEvents > 6) {
        console.log('❌ [CAUSE] Excessive resize events detected - cascading resize problem');
      }
      
      if (report.summary.totalDOMReflows > 100) {
        console.log('❌ [CAUSE] Excessive DOM reflows detected - layout thrashing');
      }
    } else {
      console.log('✅ [OK] Sidebar toggle performance within acceptable limits');
    }
    
    await browser.close();
    return report;
    
  } catch (error) {
    console.error('❌ [BROWSER DIAGNOSIS] Error during diagnosis:', error);
    await browser.close();
    throw error;
  }
}

// Run the diagnosis
runSidebarPerformanceDiagnosis()
  .then(report => {
    console.log('✅ [BROWSER DIAGNOSIS] Diagnosis completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ [BROWSER DIAGNOSIS] Diagnosis failed:', error);
    process.exit(1);
  });