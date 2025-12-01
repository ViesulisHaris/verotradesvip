// Dashboard Performance Test Script
// Measures dashboard load time and identifies performance bottlenecks

const puppeteer = require('puppeteer');
const fs = require('fs');

async function measureDashboardPerformance() {
  console.log('🚀 Starting Dashboard Performance Test...');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1920, height: 1080 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  // Enable performance monitoring
  await page.coverage.startJSCoverage();
  await page.coverage.startCSSCoverage();
  
  // Collect performance metrics
  const metrics = {
    testStartTime: Date.now(),
    navigationStart: 0,
    dashboardLoadStart: 0,
    dashboardLoadComplete: 0,
    authComplete: 0,
    firstContentfulPaint: 0,
    largestContentfulPaint: 0,
    cumulativeLayoutShift: 0,
    firstInputDelay: 0,
    networkRequests: [],
    jsExecutionTime: 0,
    cssSize: 0,
    jsSize: 0,
    componentRenderTimes: {},
    bottlenecks: []
  };

  try {
    // Listen for console logs to capture component render times
    page.on('console', (msg) => {
      const text = msg.text();
      if (text.includes('Slow render detected:') || text.includes('PERF') || text.includes('⚡')) {
        console.log('🔍 Console:', text);
        metrics.componentRenderTimes[text] = Date.now();
      }
    });

    // Listen for network requests
    page.on('request', (request) => {
      metrics.networkRequests.push({
        url: request.url(),
        method: request.method(),
        startTime: Date.now()
      });
    });

    page.on('response', (response) => {
      const request = metrics.networkRequests.find(r => r.url === response.url());
      if (request) {
        request.endTime = Date.now();
        request.duration = request.endTime - request.startTime;
        request.status = response.status();
        request.size = response.headers()['content-length'] || 0;
      }
    });

    console.log('📍 Navigating to login page...');
    metrics.navigationStart = Date.now();
    
    // Navigate to login page
    await page.goto('http://localhost:3000/login', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });

    console.log('📍 Waiting for login form...');
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });

    console.log('📍 Filling login credentials...');
    await page.type('input[type="email"]', 'testuser1000@verotrade.com');
    await page.type('input[type="password"]', 'Test123456!');

    console.log('📍 Submitting login form...');
    const loginStartTime = Date.now();
    
    // Click login button and measure redirect time
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }),
      page.click('button[type="submit"]')
    ]);

    const loginCompleteTime = Date.now();
    metrics.authComplete = loginCompleteTime;
    
    console.log(`✅ Login completed in ${loginCompleteTime - loginStartTime}ms`);

    // Wait for dashboard to start loading
    console.log('📍 Waiting for dashboard to load...');
    metrics.dashboardLoadStart = Date.now();

    // Wait for dashboard content to be visible
    try {
      await page.waitForSelector('h1', { timeout: 25000 });
      await page.waitForFunction(() => {
        const h1 = document.querySelector('h1');
        return h1 && h1.textContent && h1.textContent.includes('Trading Dashboard');
      }, { timeout: 25000 });
    } catch (error) {
      console.log('⚠️ Dashboard selector not found, waiting for fallback...');
      await page.waitForTimeout(5000);
    }

    // Wait for dashboard cards to render
    try {
      await page.waitForSelector('[style*="backgroundColor: #1c1c1c"]', { timeout: 10000 });
    } catch (error) {
      console.log('⚠️ Dashboard cards not found within timeout');
    }

    // Additional wait for any remaining async operations
    await new Promise(resolve => setTimeout(resolve, 3000));

    metrics.dashboardLoadComplete = Date.now();

    // Get Web Vitals
    const webVitals = await page.evaluate(() => {
      return new Promise((resolve) => {
        const vitals = {};
        
        // Get performance entries
        const entries = performance.getEntriesByType('navigation');
        if (entries.length > 0) {
          const nav = entries[0];
          vitals.domContentLoaded = nav.domContentLoadedEventEnd - nav.domContentLoadedEventStart;
          vitals.loadComplete = nav.loadEventEnd - nav.loadEventStart;
          vitals.firstPaint = performance.getEntriesByType('paint').find(e => e.name === 'first-paint')?.startTime || 0;
          vitals.firstContentfulPaint = performance.getEntriesByType('paint').find(e => e.name === 'first-contentful-paint')?.startTime || 0;
        }

        // Get LCP if available
        if ('PerformanceObserver' in window) {
          try {
            const observer = new PerformanceObserver((list) => {
              const entries = list.getEntries();
              const lastEntry = entries[entries.length - 1];
              vitals.largestContentfulPaint = lastEntry.startTime;
            });
            observer.observe({ entryTypes: ['largest-contentful-paint'] });
          } catch (e) {
            // LCP not supported
          }
        }

        setTimeout(() => resolve(vitals), 1000);
      });
    });

    // Get memory usage
    const memoryUsage = await page.evaluate(() => {
      if (performance.memory) {
        return {
          usedJSHeapSize: performance.memory.usedJSHeapSize,
          totalJSHeapSize: performance.memory.totalJSHeapSize,
          jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
        };
      }
      return {};
    });

    // Get coverage data
    const [jsCoverage, cssCoverage] = await Promise.all([
      page.coverage.stopJSCoverage(),
      page.coverage.stopCSSCoverage()
    ]);

    metrics.jsSize = jsCoverage.reduce((total, entry) => total + entry.text.length, 0);
    metrics.cssSize = cssCoverage.reduce((total, entry) => total + entry.text.length, 0);

    // Calculate total dashboard load time
    const totalDashboardLoadTime = metrics.dashboardLoadComplete - metrics.dashboardLoadStart;
    const totalPageLoadTime = metrics.dashboardLoadComplete - metrics.navigationStart;

    // Analyze bottlenecks
    const slowNetworkRequests = metrics.networkRequests
      .filter(req => req.duration > 1000)
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 5);

    const largeRequests = metrics.networkRequests
      .filter(req => req.size > 100000)
      .sort((a, b) => b.size - a.size)
      .slice(0, 5);

    // Generate performance report
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalPageLoadTime: totalPageLoadTime,
        dashboardLoadTime: totalDashboardLoadTime,
        loginTime: metrics.authComplete - loginStartTime,
        firstContentfulPaint: webVitals.firstContentfulPaint,
        largestContentfulPaint: webVitals.largestContentfulPaint,
        jsSize: metrics.jsSize,
        cssSize: metrics.cssSize,
        memoryUsage: memoryUsage
      },
      networkAnalysis: {
        totalRequests: metrics.networkRequests.length,
        slowRequests: slowNetworkRequests,
        largeRequests: largeRequests,
        totalDataTransferred: metrics.networkRequests.reduce((sum, req) => sum + (req.size || 0), 0)
      },
      bottlenecks: [
        ...(totalDashboardLoadTime > 3000 ? [{
          type: 'SLOW_DASHBOARD_LOAD',
          severity: 'HIGH',
          description: `Dashboard load time ${totalDashboardLoadTime}ms exceeds 3000ms target`,
          impact: 'User experience severely impacted'
        }] : []),
        ...(slowNetworkRequests.length > 0 ? [{
          type: 'SLOW_NETWORK_REQUESTS',
          severity: 'MEDIUM',
          description: `${slowNetworkRequests.length} requests taking >1s`,
          impact: 'Blocking dashboard rendering'
        }] : []),
        ...(metrics.jsSize > 1000000 ? [{
          type: 'LARGE_JS_BUNDLE',
          severity: 'MEDIUM',
          description: `JS bundle size ${(metrics.jsSize / 1024 / 1024).toFixed(2)}MB`,
          impact: 'Slow parsing and execution'
        }] : [])
      ],
      recommendations: [
        ...(totalDashboardLoadTime > 3000 ? [
          'Implement code splitting for dashboard components',
          'Add lazy loading for non-critical dashboard elements',
          'Optimize data fetching with parallel requests',
          'Add loading states and skeleton screens'
        ] : []),
        ...(slowNetworkRequests.length > 0 ? [
          'Optimize API response times',
          'Implement caching strategies',
          'Use CDN for static assets'
        ] : []),
        ...(metrics.jsSize > 500000 ? [
          'Implement dynamic imports for heavy components',
          'Remove unused dependencies',
          'Minimize and compress JavaScript bundles'
        ] : [])
      ]
    };

    console.log('\n📊 DASHBOARD PERFORMANCE REPORT');
    console.log('=' .repeat(50));
    console.log(`📍 Total Page Load Time: ${totalPageLoadTime}ms`);
    console.log(`📍 Dashboard Load Time: ${totalDashboardLoadTime}ms`);
    console.log(`📍 Login Time: ${report.summary.loginTime}ms`);
    console.log(`📍 First Contentful Paint: ${webVitals.firstContentfulPaint}ms`);
    console.log(`📍 Largest Contentful Paint: ${webVitals.largestContentfulPaint}ms`);
    console.log(`📍 JS Bundle Size: ${(metrics.jsSize / 1024 / 1024).toFixed(2)}MB`);
    console.log(`📍 CSS Bundle Size: ${(metrics.cssSize / 1024).toFixed(2)}KB`);
    console.log(`📍 Network Requests: ${metrics.networkRequests.length}`);
    
    if (memoryUsage.usedJSHeapSize) {
      console.log(`📍 Memory Usage: ${(memoryUsage.usedJSHeapSize / 1024 / 1024).toFixed(2)}MB`);
    }

    if (slowNetworkRequests.length > 0) {
      console.log('\n🐌 Slow Network Requests:');
      slowNetworkRequests.forEach(req => {
        console.log(`   ${req.duration}ms - ${req.url}`);
      });
    }

    if (report.bottlenecks.length > 0) {
      console.log('\n⚠️ Performance Bottlenecks:');
      report.bottlenecks.forEach(bottleneck => {
        console.log(`   ${bottleneck.severity}: ${bottleneck.description}`);
      });
    }

    if (report.recommendations.length > 0) {
      console.log('\n💡 Recommendations:');
      report.recommendations.forEach(rec => {
        console.log(`   • ${rec}`);
      });
    }

    // Save detailed report
    const reportPath = `dashboard-performance-report-${Date.now()}.json`;
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📄 Detailed report saved to: ${reportPath}`);

    // Take screenshot
    const screenshotPath = `dashboard-performance-screenshot-${Date.now()}.png`;
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`📸 Screenshot saved to: ${screenshotPath}`);

    return report;

  } catch (error) {
    console.error('❌ Performance test failed:', error);
    metrics.error = error.message;
    return metrics;
  } finally {
    await browser.close();
  }
}

// Run the test
measureDashboardPerformance()
  .then((results) => {
    console.log('\n✅ Dashboard performance test completed');
    console.log(`🎯 Dashboard load time: ${results.summary?.dashboardLoadTime || 'Unknown'}ms`);
    console.log(`🎯 Target: <3000ms | Status: ${results.summary?.dashboardLoadTime < 3000 ? 'PASS' : 'FAIL'}`);
  })
  .catch((error) => {
    console.error('❌ Test execution failed:', error);
  });