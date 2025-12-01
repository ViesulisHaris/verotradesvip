// Graph Glitching Diagnosis Script
// This script will help validate our assumptions about the root causes of graph glitching

console.log('🔍 [GRAPH GLITCHING DIAGNOSIS] Starting comprehensive analysis...');

// Track menu transition timing
let menuTransitionStart = null;
let menuTransitionEnd = null;
let chartRenderEvents = [];

// Function to log chart render events
function logChartRender(chartName, eventType, details = {}) {
  const timestamp = Date.now();
  const event = {
    chartName,
    eventType,
    timestamp,
    timeSinceMenuStart: menuTransitionStart ? timestamp - menuTransitionStart : null,
    timeSinceMenuEnd: menuTransitionEnd ? timestamp - menuTransitionEnd : null,
    details
  };
  
  chartRenderEvents.push(event);
  console.log(`🔍 [CHART RENDER] ${chartName} - ${eventType}:`, event);
}

// Function to log menu transition events
function logMenuTransition(eventType, details = {}) {
  const timestamp = Date.now();
  
  if (eventType === 'start') {
    menuTransitionStart = timestamp;
    menuTransitionEnd = null;
  } else if (eventType === 'end') {
    menuTransitionEnd = timestamp;
  }
  
  console.log(`🔍 [MENU TRANSITION] ${eventType}:`, {
    timestamp,
    details
  });
}

// Function to analyze timing patterns
function analyzeTimingPatterns() {
  console.log('🔍 [TIMING ANALYSIS] Analyzing chart render patterns...');
  
  const charts = ['PnLChart', 'EmotionRadar', 'PerformanceTrendChart', 'EquityGraph'];
  const analysis = {};
  
  charts.forEach(chartName => {
    const chartEvents = chartRenderEvents.filter(event => event.chartName === chartName);
    
    analysis[chartName] = {
      totalRenders: chartEvents.length,
      resizeEvents: chartEvents.filter(e => e.eventType.includes('resize')).length,
      animationEvents: chartEvents.filter(e => e.eventType.includes('animation')).length,
      averageRenderInterval: calculateAverageInterval(chartEvents),
      timingRelativeToMenu: {
        duringTransition: chartEvents.filter(e => 
          menuTransitionStart && menuTransitionEnd &&
          e.timestamp >= menuTransitionStart && e.timestamp <= menuTransitionEnd
        ).length,
        afterTransition: chartEvents.filter(e => 
          menuTransitionEnd && e.timestamp > menuTransitionEnd
        ).length
      }
    };
  });
  
  console.log('🔍 [TIMING ANALYSIS RESULTS]:', analysis);
  return analysis;
}

// Helper function to calculate average interval between renders
function calculateAverageInterval(events) {
  if (events.length < 2) return 0;
  
  const intervals = [];
  for (let i = 1; i < events.length; i++) {
    intervals.push(events[i].timestamp - events[i-1].timestamp);
  }
  
  return intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
}

// Function to detect timing conflicts
function detectTimingConflicts() {
  console.log('🔍 [CONFLICT DETECTION] Analyzing timing conflicts...');
  
  const conflicts = [];
  
  // Check for simultaneous resize events
  const resizeEvents = chartRenderEvents.filter(e => e.eventType.includes('resize'));
  const simultaneousResizes = findSimultaneousEvents(resizeEvents, 50); // Within 50ms
  
  if (simultaneousResizes.length > 0) {
    conflicts.push({
      type: 'SIMULTANEOUS_RESIZES',
      description: 'Multiple charts resizing simultaneously',
      events: simultaneousResizes
    });
  }
  
  // Check for animation timing mismatches
  const animationEvents = chartRenderEvents.filter(e => e.eventType.includes('animation'));
  const animationTimingMismatches = findAnimationTimingMismatches(animationEvents);
  
  if (animationTimingMismatches.length > 0) {
    conflicts.push({
      type: 'ANIMATION_TIMING_MISMATCHES',
      description: 'Charts with different animation durations',
      events: animationTimingMismatches
    });
  }
  
  // Check for debounce inconsistencies
  const debounceInconsistencies = findDebounceInconsistencies();
  
  if (debounceInconsistencies.length > 0) {
    conflicts.push({
      type: 'DEBOUNCE_INCONSISTENCIES',
      description: 'Inconsistent debounce settings across charts',
      details: debounceInconsistencies
    });
  }
  
  console.log('🔍 [CONFLICT DETECTION RESULTS]:', conflicts);
  return conflicts;
}

// Helper function to find events that occur simultaneously
function findSimultaneousEvents(events, thresholdMs) {
  const simultaneous = [];
  
  for (let i = 0; i < events.length; i++) {
    for (let j = i + 1; j < events.length; j++) {
      const timeDiff = Math.abs(events[i].timestamp - events[j].timestamp);
      if (timeDiff <= thresholdMs) {
        simultaneous.push([events[i], events[j]]);
      }
    }
  }
  
  return simultaneous;
}

// Helper function to find animation timing mismatches
function findAnimationTimingMismatches(animationEvents) {
  const mismatches = [];
  const chartAnimationDurations = {};
  
  animationEvents.forEach(event => {
    const chartName = event.chartName;
    const duration = event.details.duration;
    
    if (!chartAnimationDurations[chartName]) {
      chartAnimationDurations[chartName] = [];
    }
    chartAnimationDurations[chartName].push(duration);
  });
  
  const uniqueDurations = Object.values(chartAnimationDurations).map(durations => [...new Set(durations)]);
  const hasDifferentDurations = uniqueDurations.some(durations => durations.length > 1);
  
  if (hasDifferentDurations) {
    mismatches.push({
      chartDurations: chartAnimationDurations
    });
  }
  
  return mismatches;
}

// Helper function to find debounce inconsistencies
function findDebounceInconsistencies() {
  // These are the actual debounce values found in the code
  const chartDebounceSettings = {
    'PnLChart': 0,
    'EmotionRadar': 100,
    'PerformanceTrendChart': 1,
    'EquityGraph': 0
  };
  
  const uniqueValues = [...new Set(Object.values(chartDebounceSettings))];
  
  if (uniqueValues.length > 1) {
    return [{
      type: 'INCONSISTENT_DEBOUNCE_VALUES',
      settings: chartDebounceSettings,
      uniqueValues
    }];
  }
  
  return [];
}

// Main diagnosis function
function runDiagnosis() {
  console.log('🔍 [DIAGNOSIS] Starting comprehensive graph glitching diagnosis...');
  
  // Clear previous data
  chartRenderEvents = [];
  menuTransitionStart = null;
  menuTransitionEnd = null;
  
  // Set up event listeners for menu transitions
  setupMenuTransitionListeners();
  
  // Set up event listeners for chart renders
  setupChartRenderListeners();
  
  // Run analysis after a transition
  setTimeout(() => {
    analyzeTimingPatterns();
    detectTimingConflicts();
    generateRecommendations();
  }, 5000);
}

// Function to set up menu transition listeners
function setupMenuTransitionListeners() {
  // This would be integrated with the actual sidebar component
  console.log('🔍 [SETUP] Menu transition listeners would be attached here');
}

// Function to set up chart render listeners
function setupChartRenderListeners() {
  // This would be integrated with the actual chart components
  console.log('🔍 [SETUP] Chart render listeners would be attached here');
}

// Function to generate recommendations based on analysis
function generateRecommendations() {
  console.log('🔍 [RECOMMENDATIONS] Generating fix recommendations...');
  
  const recommendations = [
    {
      issue: 'TIMING_SYNCHRONIZATION',
      priority: 'HIGH',
      description: 'Charts have inconsistent debounce and animation settings',
      solution: 'Standardize all charts to use consistent timing values',
      implementation: [
        'Set all ResponsiveContainer debounce to 50ms',
        'Set all animation durations to 300ms',
        'Synchronize animation start/end with menu transitions'
      ]
    },
    {
      issue: 'RESIZE_EVENT_CONFLICTS',
      priority: 'HIGH', 
      description: 'PnLChart ResizeObserver conflicts with ResponsiveContainer',
      solution: 'Remove custom ResizeObserver and rely on ResponsiveContainer',
      implementation: [
        'Remove ResizeObserver from PnLChart',
        'Remove setRenderKey forced re-renders',
        'Add consistent CSS stability properties to all charts'
      ]
    },
    {
      issue: 'CSS_TRANSITION_MISMATCH',
      priority: 'MEDIUM',
      description: 'Sidebar transition (300ms) doesn\'t align with chart animations',
      solution: 'Align all transition and animation durations',
      implementation: [
        'Set sidebar transition to 300ms',
        'Set chart animations to 300ms',
        'Add coordinated timing delays'
      ]
    }
  ];
  
  console.log('🔍 [RECOMMENDATIONS]:', recommendations);
  return recommendations;
}

// Export functions for integration with the actual application
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    logChartRender,
    logMenuTransition,
    analyzeTimingPatterns,
    detectTimingConflicts,
    runDiagnosis
  };
}

// Auto-run diagnosis if in browser environment
if (typeof window !== 'undefined') {
  console.log('🔍 [GRAPH GLITCHING DIAGNOSIS] Script loaded. Run runDiagnosis() to start analysis.');
}