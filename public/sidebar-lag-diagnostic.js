// Sidebar Collapse Animation Lag Diagnostic Script
// This script will help identify the root cause of the 2-5 second lag during sidebar transitions

console.log('🔍 [SIDEBAR LAG DIAGNOSTIC] Starting diagnostic script...');

// Track timing of sidebar state changes
const sidebarTimingLog = [];

// Monitor sidebar state changes in AuthProvider
const originalSetSidebarCollapsed = null;

// Hook into localStorage operations to track when sidebar state is saved
const originalSetItem = localStorage.setItem;
localStorage.setItem = function(key, value) {
  if (key === 'sidebar-collapsed') {
    const timestamp = performance.now();
    const isCollapsed = JSON.parse(value);
    
    sidebarTimingLog.push({
      event: 'LOCALSTORAGE_SAVE',
      timestamp: timestamp,
      isCollapsed: isCollapsed,
      source: 'Sidebar.tsx useEffect'
    });
    
    console.log('🔍 [TIMING] Sidebar state saved to localStorage:', {
      timestamp,
      isCollapsed,
      timeSincePageLoad: timestamp - performance.timeOrigin
    });
  }
  
  return originalSetItem.call(this, key, value);
};

// Monitor window resize events during sidebar transitions
let resizeObserverActive = false;
const originalAddEventListener = window.addEventListener;
window.addEventListener = function(type, listener, options) {
  if (type === 'resize') {
    const wrappedListener = function(...args) {
      const timestamp = performance.now();
      
      sidebarTimingLog.push({
        event: 'WINDOW_RESIZE',
        timestamp: timestamp,
        resizeObserverActive: resizeObserverActive
      });
      
      console.log('🔍 [TIMING] Window resize event:', {
        timestamp,
        resizeObserverActive,
        timeSincePageLoad: timestamp - performance.timeOrigin
      });
      
      return listener.apply(this, args);
    };
    
    return originalAddEventListener.call(this, type, wrappedListener, options);
  }
  
  return originalAddEventListener.call(this, type, listener, options);
};

// Monitor React re-renders by patching requestAnimationFrame
const originalRAF = requestAnimationFrame;
requestAnimationFrame = function(callback) {
  const timestamp = performance.now();
  
  sidebarTimingLog.push({
    event: 'REQUEST_ANIMATION_FRAME',
    timestamp: timestamp
  });
  
  return originalRAF.call(this, callback);
};

// Function to analyze timing logs
function analyzeTimingLogs() {
  console.log('🔍 [ANALYSIS] Sidebar timing logs:', sidebarTimingLog);
  
  // Group events by type
  const events = {};
  sidebarTimingLog.forEach(log => {
    if (!events[log.event]) {
      events[log.event] = [];
    }
    events[log.event].push(log);
  });
  
  // Calculate timing patterns
  const analysis = {
    totalEvents: sidebarTimingLog.length,
    eventCounts: Object.keys(events).reduce((acc, key) => {
      acc[key] = events[key].length;
      return acc;
    }, {}),
    timingPatterns: {}
  };
  
  // Look for timing clusters (indicative of lag)
  if (events.LOCALSTORAGE_SAVE && events.REQUEST_ANIMATION_FRAME) {
    const saveEvents = events.LOCALSTORAGE_SAVE;
    const rafEvents = events.REQUEST_ANIMATION_FRAME;
    
    saveEvents.forEach(saveEvent => {
      const subsequentRAFs = rafEvents.filter(raf => raf.timestamp > saveEvent.timestamp && raf.timestamp < saveEvent.timestamp + 1000);
      analysis.timingPatterns[saveEvent.timestamp] = {
        saveEvent: saveEvent,
        subsequentRAFs: subsequentRAFs.length,
        timeToNextRAF: subsequentRAFs.length > 0 ? subsequentRAFs[0].timestamp - saveEvent.timestamp : null
      };
    });
  }
  
  console.log('🔍 [ANALYSIS] Timing patterns:', analysis);
  
  // Identify potential bottlenecks
  const bottlenecks = [];
  
  // Check for excessive RAF calls after sidebar state change
  if (analysis.timingPatterns) {
    Object.values(analysis.timingPatterns).forEach(pattern => {
      if (pattern.subsequentRAFs > 10) {
        bottlenecks.push({
          type: 'EXCESSIVE_RAF_CALLS',
          severity: 'HIGH',
          description: `${pattern.subsequentRAFs} RAF calls detected after sidebar state change`,
          timestamp: pattern.saveEvent.timestamp
        });
      }
    });
  }
  
  // Check for resize event storms
  if (events.WINDOW_RESIZE && events.WINDOW_RESIZE.length > 5) {
    bottlenecks.push({
      type: 'RESIZE_EVENT_STORM',
      severity: 'HIGH',
      description: `${events.WINDOW_RESIZE.length} resize events detected - likely causing performance issues`,
      timestamp: events.WINDOW_RESIZE[0].timestamp
    });
  }
  
  console.log('🔍 [BOTTLENECKS] Identified bottlenecks:', bottlenecks);
  
  return analysis;
}

// Auto-analyze after 5 seconds of user interaction
setTimeout(() => {
  console.log('🔍 [AUTO-ANALYSIS] Analyzing collected timing data...');
  analyzeTimingLogs();
}, 5000);

// Export for manual analysis
window.sidebarDiagnostics = {
  logs: sidebarTimingLog,
  analyze: analyzeTimingLogs
};

console.log('🔍 [SIDEBAR LAG DIAGNOSTIC] Diagnostic script loaded. Interact with the sidebar to collect timing data.');