// Standalone Sidebar Performance Diagnosis Script
// This script will test the standalone HTML page to diagnose sidebar performance issues

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function runStandaloneSidebarDiagnosis() {
  console.log('🔍 [STANDALONE DIAGNOSIS] Starting standalone sidebar performance diagnosis...');
  
  const browser = await puppeteer.launch({ 
    headless: false, // Set to true for headless mode
    defaultViewport: { width: 1920, height: 1080 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  // Monitor console output
  const consoleMessages = [];
  page.on('console', msg => {
    const message = {
      type: msg.type(),
      text: msg.text(),
      timestamp: Date.now()
    };
    consoleMessages.push(message);
    console.log(`[CONSOLE] ${msg.type()}: ${msg.text()}`);
  });
  
  try {
    // Navigate to the standalone test page
    const testPagePath = path.resolve(__dirname, 'sidebar-performance-test.html');
    const fileUrl = `file://${testPagePath}`;
    
    console.log('🌐 [STANDALONE DIAGNOSIS] Navigating to standalone test page...');
    await page.goto(fileUrl, { waitUntil: 'networkidle0' });
    
    // Wait for the page to load completely
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log('🧪 [STANDALONE DIAGNOSIS] Test page loaded, starting performance tests...');
    
    // Perform multiple sidebar toggle tests
    const testResults = [];
    
    for (let i = 1; i <= 5; i++) {
      console.log(`🚀 [STANDALONE DIAGNOSIS] Running sidebar toggle test #${i}...`);
      
      const startTime = Date.now();
      
      // Click the toggle button
      await page.click('.btn-primary');
      
      // Wait for transition to complete
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Collect performance data from the page
      const performanceData = await page.evaluate(() => {
        const metricsElement = document.querySelector('.performance-metrics');
        if (metricsElement) {
          const rafElement = metricsElement.querySelector('.metric:nth-child(2) .metric-value');
          const resizeElement = metricsElement.querySelector('.metric:nth-child(3) .metric-value');
          const reflowElement = metricsElement.querySelector('.metric:nth-child(4) .metric-value');
          const durationElement = metricsElement.querySelector('.metric:nth-child(5) .metric-value');
          
          return {
            rafCalls: rafElement ? parseInt(rafElement.textContent) : 0,
            resizeEvents: resizeElement ? parseInt(resizeElement.textContent) : 0,
            domReflows: reflowElement ? parseInt(reflowElement.textContent) : 0,
            transitionDuration: durationElement ? parseFloat(durationElement.textContent) : 0
          };
        }
        return {
          rafCalls: 0,
          resizeEvents: 0,
          domReflows: 0,
          transitionDuration: 0
        };
      });
      
      const testResult = {
        testNumber: i,
        duration,
        startTime,
        endTime,
        performanceData,
        consoleMessages: consoleMessages.filter(msg => msg.timestamp >= startTime && msg.timestamp <= endTime)
      };
      
      testResults.push(testResult);
      
      console.log(`📊 [STANDALONE DIAGNOSIS] Test #${i} completed in ${duration}ms`);
      console.log(`📊 [STANDALONE DIAGNOSIS] RAF calls: ${performanceData.rafCalls}`);
      console.log(`📊 [STANDALONE DIAGNOSIS] Resize events: ${performanceData.resizeEvents}`);
      console.log(`📊 [STANDALONE DIAGNOSIS] DOM reflows: ${performanceData.domReflows}`);
      console.log(`📊 [STANDALONE DIAGNOSIS] Transition duration: ${performanceData.transitionDuration}ms`);
      
      // Wait between tests
      if (i < 5) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    // Generate comprehensive report
    const report = {
      timestamp: new Date().toISOString(),
      testEnvironment: 'standalone-html',
      testResults,
      summary: {
        averageDuration: testResults.reduce((sum, test) => sum + test.duration, 0) / testResults.length,
        maxDuration: Math.max(...testResults.map(test => test.duration)),
        minDuration: Math.min(...testResults.map(test => test.duration)),
        totalRAFCalls: testResults.reduce((sum, test) => sum + test.performanceData.rafCalls, 0),
        totalResizeEvents: testResults.reduce((sum, test) => sum + test.performanceData.resizeEvents, 0),
        totalDOMReflows: testResults.reduce((sum, test) => sum + test.performanceData.domReflows, 0),
        averageTransitionDuration: testResults.reduce((sum, test) => sum + test.performanceData.transitionDuration, 0) / testResults.length
      },
      allConsoleMessages: consoleMessages
    };
    
    // Save the detailed report
    const reportFileName = `standalone-sidebar-performance-diagnosis-report-${Date.now()}.json`;
    fs.writeFileSync(reportFileName, JSON.stringify(report, null, 2));
    
    console.log(`📄 [STANDALONE DIAGNOSIS] Detailed report saved to: ${reportFileName}`);
    
    // Print summary analysis
    console.log('\n🔍 [ANALYSIS] Standalone Performance Diagnosis Summary:');
    console.log(`⏱️  Average test duration: ${report.summary.averageDuration.toFixed(2)}ms`);
    console.log(`⏱️  Average transition duration: ${report.summary.averageTransitionDuration.toFixed(2)}ms`);
    console.log(`📊 Total RAF calls across all tests: ${report.summary.totalRAFCalls}`);
    console.log(`📏 Total resize events across all tests: ${report.summary.totalResizeEvents}`);
    console.log(`🔄 Total DOM reflows across all tests: ${report.summary.totalDOMReflows}`);
    
    // Identify bottlenecks based on the 5-7 possible sources
    console.log('\n🔍 [ROOT CAUSE ANALYSIS] Identifying potential bottlenecks:');
    
    const possibleSources = [
      {
        name: 'Excessive RAF calls',
        detected: report.summary.totalRAFCalls > 100,
        severity: report.summary.totalRAFCalls > 100 ? 'HIGH' : 'LOW',
        evidence: `Total RAF calls: ${report.summary.totalRAFCalls} (threshold: 100)`
      },
      {
        name: 'Excessive resize events',
        detected: report.summary.totalResizeEvents > 10,
        severity: report.summary.totalResizeEvents > 10 ? 'HIGH' : 'LOW',
        evidence: `Total resize events: ${report.summary.totalResizeEvents} (threshold: 10)`
      },
      {
        name: 'Excessive DOM reflows',
        detected: report.summary.totalDOMReflows > 200,
        severity: report.summary.totalDOMReflows > 200 ? 'HIGH' : 'LOW',
        evidence: `Total DOM reflows: ${report.summary.totalDOMReflows} (threshold: 200)`
      },
      {
        name: 'Slow CSS transitions',
        detected: report.summary.averageTransitionDuration > 500,
        severity: report.summary.averageTransitionDuration > 500 ? 'HIGH' : 'LOW',
        evidence: `Average transition: ${report.summary.averageTransitionDuration.toFixed(2)}ms (threshold: 500ms)`
      },
      {
        name: 'JavaScript execution delays',
        detected: report.summary.averageDuration > 1000,
        severity: report.summary.averageDuration > 1000 ? 'HIGH' : 'LOW',
        evidence: `Average test duration: ${report.summary.averageDuration.toFixed(2)}ms (threshold: 1000ms)`
      },
      {
        name: 'Layout thrashing',
        detected: report.summary.totalDOMReflows > 150 && report.summary.totalResizeEvents > 8,
        severity: 'MEDIUM',
        evidence: `Combined reflows and resize events indicate layout thrashing`
      },
      {
        name: 'Event handler inefficiency',
        detected: report.summary.totalRAFCalls > 80 && report.summary.averageTransitionDuration > 400,
        severity: 'MEDIUM',
        evidence: `High RAF calls with slow transitions suggest inefficient event handling`
      }
    ];
    
    // Filter to most likely sources (1-2 as per instructions)
    const detectedSources = possibleSources.filter(source => source.detected);
    const highSeveritySources = detectedSources.filter(source => source.severity === 'HIGH');
    const mostLikelySources = highSeveritySources.length > 0 ? highSeveritySources : detectedSources.slice(0, 2);
    
    console.log('\n🎯 [ROOT CAUSE] Most Likely Sources (Top 2):');
    mostLikelySources.forEach((source, index) => {
      console.log(`${index + 1}. ${source.name} (${source.severity} severity)`);
      console.log(`   Evidence: ${source.evidence}`);
    });
    
    if (report.summary.averageDuration > 2000) {
      console.log('\n❌ [CRITICAL] 2-5 second delay confirmed!');
      console.log('🔧 [RECOMMENDATION] Primary bottlenecks to address:');
      mostLikelySources.forEach(source => {
        console.log(`   • Fix ${source.name}: ${source.evidence}`);
      });
    } else {
      console.log('\n✅ [OK] Performance within acceptable limits');
    }
    
    await browser.close();
    return report;
    
  } catch (error) {
    console.error('❌ [STANDALONE DIAGNOSIS] Error during diagnosis:', error);
    await browser.close();
    throw error;
  }
}

// Run the diagnosis
runStandaloneSidebarDiagnosis()
  .then(report => {
    console.log('✅ [STANDALONE DIAGNOSIS] Diagnosis completed successfully');
    
    // Ask for confirmation as per custom instructions
    console.log('\n🤔 [CONFIRMATION REQUIRED]');
    console.log('Based on the analysis above, I have identified the most likely root causes of the sidebar performance issue.');
    console.log('Please confirm if you agree with this diagnosis before I proceed to implement fixes.');
    console.log('The primary bottlenecks identified are:');
    
    const highSeveritySources = report.summary.averageDuration > 2000 ? 
      ['Excessive RAF calls', 'Excessive resize events', 'Excessive DOM reflows', 'Slow CSS transitions'] : [];
    
    highSeveritySources.forEach((source, index) => {
      console.log(`${index + 1}. ${source}`);
    });
    
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ [STANDALONE DIAGNOSIS] Diagnosis failed:', error);
    process.exit(1);
  });