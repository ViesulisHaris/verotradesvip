// Comprehensive Graph Glitching Test Script
// Tests the fix for synchronized chart rendering during menu transitions

console.log('🧪 [COMPREHENSIVE TEST] Starting graph glitching validation...');

// Test configuration
const TEST_CONFIG = {
  iterations: 10, // Number of sidebar toggle cycles
  rapidToggleDelay: 100, // Delay between rapid toggles (ms)
  viewports: [
    { width: 1920, height: 1080, name: 'Desktop Large' },
    { width: 1366, height: 768, name: 'Desktop Medium' },
    { width: 768, height: 1024, name: 'Tablet' },
    { width: 375, height: 667, name: 'Mobile' }
  ],
  dataStates: ['empty', 'loaded', 'sample'],
  expectedTiming: {
    debounce: 50, // All charts should use 50ms
    animation: 300, // All charts should use 300ms
    sidebarTransition: 300 // Sidebar transition should be 300ms
  }
};

// Test results tracking
let testResults = {
  timingConsistency: [],
  visualGlitching: [],
  responsiveness: [],
  overall: null
};

// Function to log test events
function logTestEvent(testType, details) {
  const timestamp = Date.now();
  console.log(`🧪 [TEST] ${testType}:`, {
    timestamp: new Date(timestamp).toISOString(),
    timeMs: timestamp,
    ...details
  });
}

// Function to measure timing consistency
function measureTimingConsistency() {
  return new Promise((resolve) => {
    const measurements = [];
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
          measurements.push({
            timestamp: Date.now(),
            element: mutation.target.tagName,
            attribute: mutation.attributeName
          });
        }
      });
    });

    // Observe all chart containers
    const chartContainers = document.querySelectorAll('.recharts-responsive-container');
    chartContainers.forEach(container => {
      observer.observe(container, {
        attributes: true,
        attributeFilter: ['style']
      });
    });

    // Stop observing after 2 seconds
    setTimeout(() => {
      observer.disconnect();
      
      // Analyze timing patterns
      const timingGroups = {};
      measurements.forEach(measurement => {
        const key = `${measurement.element}_${measurement.attribute}`;
        if (!timingGroups[key]) {
          timingGroups[key] = [];
        }
        timingGroups[key].push(measurement.timestamp);
      });

      // Check for consistent timing patterns
      let isConsistent = true;
      Object.values(timingGroups).forEach(timestamps => {
        if (timestamps.length > 1) {
          const intervals = [];
          for (let i = 1; i < timestamps.length; i++) {
            intervals.push(timestamps[i] - timestamps[i-1]);
          }
          
          // Check if intervals are consistent (within expected range)
          const avgInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
          const maxDeviation = Math.max(...intervals.map(interval => Math.abs(interval - avgInterval)));
          
          if (maxDeviation > TEST_CONFIG.expectedTiming.debounce) {
            isConsistent = false;
          }
        }
      });

      resolve({
        isConsistent,
        measurements: measurements.length,
        timingGroups
      });
    }, 2000);
  });
}

// Function to detect visual glitching
function detectVisualGlitching() {
  return new Promise((resolve) => {
    const glitchEvents = [];
    
    // Monitor for layout shifts
    const charts = document.querySelectorAll('.chart-container-enhanced, .recharts-wrapper');
    const initialPositions = new Map();
    
    charts.forEach((chart, index) => {
      const rect = chart.getBoundingClientRect();
      initialPositions.set(index, {
        x: rect.left,
        y: rect.top,
        width: rect.width,
        height: rect.height
      });
    });

    // Monitor position changes during sidebar transitions
    const positionMonitor = setInterval(() => {
      charts.forEach((chart, index) => {
        const rect = chart.getBoundingClientRect();
        const initial = initialPositions.get(index);
        
        if (initial) {
          const deltaX = Math.abs(rect.left - initial.x);
          const deltaY = Math.abs(rect.top - initial.y);
          const deltaWidth = Math.abs(rect.width - initial.width);
          const deltaHeight = Math.abs(rect.height - initial.height);
          
          // Detect significant position changes
          if (deltaX > 5 || deltaY > 5 || deltaWidth > 5 || deltaHeight > 5) {
            glitchEvents.push({
              timestamp: Date.now(),
              chartIndex: index,
              deltaX,
              deltaY,
              deltaWidth,
              deltaHeight,
              severity: deltaX > 20 || deltaY > 20 ? 'high' : 'medium'
            });
          }
        }
      });
    }, 50); // Check every 50ms

    // Stop monitoring after 3 seconds
    setTimeout(() => {
      clearInterval(positionMonitor);
      resolve({
        hasGlitching: glitchEvents.length > 0,
        glitchEvents,
        maxDelta: Math.max(...glitchEvents.map(e => Math.max(e.deltaX, e.deltaY)))
      });
    }, 3000);
  });
}

// Function to test responsiveness
function testResponsiveness() {
  return new Promise((resolve) => {
    const startTime = Date.now();
    let resizeEvents = [];
    
    // Simulate window resize
    const originalWidth = window.innerWidth;
    const originalHeight = window.innerHeight;
    
    // Add resize listener
    const resizeHandler = () => {
      resizeEvents.push(Date.now());
    };
    
    window.addEventListener('resize', resizeHandler);
    
    // Simulate resize
    window.resizeTo(originalWidth - 200, originalHeight - 200);
    setTimeout(() => {
      window.resizeTo(originalWidth + 100, originalHeight + 100);
      setTimeout(() => {
        window.resizeTo(originalWidth, originalHeight);
      }, 100);
    }, 100);
    
    // Remove listener and analyze
    setTimeout(() => {
      window.removeEventListener('resize', resizeHandler);
      
      const responseTime = resizeEvents.length > 0 ? 
        resizeEvents[resizeEvents.length - 1] - startTime : 0;
      
      resolve({
        responseTime,
        resizeEvents: resizeEvents.length,
        isResponsive: responseTime < 1000 // Should respond within 1 second
      });
    }, 2000);
  });
}

// Main test execution function
async function runComprehensiveTest() {
  logTestEvent('TEST_START', { 
    config: TEST_CONFIG,
    description: 'Starting comprehensive graph glitching validation'
  });

  // Test 1: Timing Consistency
  logTestEvent('TIMING_TEST_START', { test: 'timing_consistency' });
  const timingResult = await measureTimingConsistency();
  testResults.timingConsistency = timingResult;
  
  logTestEvent('TIMING_TEST_RESULT', {
    test: 'timing_consistency',
    result: timingResult.isConsistent ? 'PASS' : 'FAIL',
    details: timingResult
  });

  // Test 2: Visual Glitching Detection
  logTestEvent('GLITCH_TEST_START', { test: 'visual_glitching' });
  const glitchResult = await detectVisualGlitching();
  testResults.visualGlitching = glitchResult;
  
  logTestEvent('GLITCH_TEST_RESULT', {
    test: 'visual_glitching',
    result: glitchResult.hasGlitching ? 'FAIL' : 'PASS',
    details: glitchResult
  });

  // Test 3: Responsiveness
  logTestEvent('RESPONSIVE_TEST_START', { test: 'responsiveness' });
  const responsiveResult = await testResponsiveness();
  testResults.responsiveness = responsiveResult;
  
  logTestEvent('RESPONSIVE_TEST_RESULT', {
    test: 'responsiveness',
    result: responsiveResult.isResponsive ? 'PASS' : 'FAIL',
    details: responsiveResult
  });

  // Calculate overall result
  const passCount = [
    timingResult.isConsistent,
    !glitchResult.hasGlitching,
    responsiveResult.isResponsive
  ].filter(Boolean).length;
  
  testResults.overall = {
    status: passCount === 3 ? 'PASS' : 'FAIL',
    passCount,
    totalTests: 3,
    issues: []
  };

  if (!timingResult.isConsistent) {
    testResults.overall.issues.push('Inconsistent chart timing detected');
  }
  if (glitchResult.hasGlitching) {
    testResults.overall.issues.push(`Visual glitching detected (max delta: ${glitchResult.maxDelta}px)`);
  }
  if (!responsiveResult.isResponsive) {
    testResults.overall.issues.push('Poor chart responsiveness detected');
  }

  logTestEvent('TEST_COMPLETE', {
    overall: testResults.overall,
    summary: `Graph glitching fix validation: ${testResults.overall.status}`,
    recommendations: testResults.overall.issues.length > 0 ? 
      'Issues detected - review implementation' : 
      'All tests passed - fix is working correctly'
  });

  return testResults;
}

// Function to run rapid toggle test
async function runRapidToggleTest() {
  logTestEvent('RAPID_TOGGLE_START', { 
    iterations: TEST_CONFIG.iterations,
    delay: TEST_CONFIG.rapidToggleDelay
  });

  const sidebarToggle = document.querySelector('[data-testid="sidebar-toggle"]') || 
                     document.querySelector('button[aria-label*="sidebar"]') ||
                     document.querySelector('.sidebar-toggle');

  if (!sidebarToggle) {
    logTestEvent('RAPID_TOGGLE_ERROR', { 
      error: 'Sidebar toggle button not found' 
    });
    return false;
  }

  const rapidToggleEvents = [];
  
  for (let i = 0; i < TEST_CONFIG.iterations; i++) {
    logTestEvent('RAPID_TOGGLE_ITERATION', { iteration: i + 1 });
    
    const startTime = Date.now();
    sidebarToggle.click();
    
    // Monitor for events during this toggle
    const iterationEvents = [];
    const eventMonitor = setInterval(() => {
      iterationEvents.push(Date.now());
    }, 10);
    
    // Wait for next iteration
    await new Promise(resolve => setTimeout(resolve, TEST_CONFIG.rapidToggleDelay));
    
    clearInterval(eventMonitor);
    
    rapidToggleEvents.push({
      iteration: i + 1,
      startTime,
      endTime: Date.now(),
      duration: Date.now() - startTime,
      eventsDuringToggle: iterationEvents.length
    });
  }

  logTestEvent('RAPID_TOGGLE_COMPLETE', { 
    totalIterations: TEST_CONFIG.iterations,
    events: rapidToggleEvents
  });

  return rapidToggleEvents;
}

// Export test functions
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    runComprehensiveTest,
    runRapidToggleTest,
    measureTimingConsistency,
    detectVisualGlitching,
    testResponsiveness,
    TEST_CONFIG
  };
}

// Auto-run if in browser environment
if (typeof window !== 'undefined') {
  // Wait for page to load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(runComprehensiveTest, 1000);
    });
  } else {
    setTimeout(runComprehensiveTest, 1000);
  }
}