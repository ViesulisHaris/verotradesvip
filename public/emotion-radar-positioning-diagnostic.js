/**
 * EmotionRadar Positioning Diagnostic Tool
 * 
 * This tool analyzes the EmotionRadar component positioning issue on the confluence page
 * to identify the root cause of the sliding behavior.
 */

console.log('🔍 [EMOTION_RADAR_DEBUG] Starting EmotionRadar positioning diagnostic...');

// Potential causes of sliding positioning issue:
const POTENTIAL_CAUSES = {
  SIDEBAR_TRANSITIONS: 'Sidebar transitions affecting component positioning',
  CSS_TRANSFORMS: 'CSS transform properties causing layout shifts',
  RESPONSIVE_CONTAINER: 'Responsive container resizing during viewport changes',
  CHART_REPARENTING: 'Recharts library reparenting during updates',
  VIEWPORT_RESIZE: 'Viewport resize handlers triggering position recalculation',
  CSS_CONTAINMENT: 'CSS containment properties interfering with positioning',
  HARDWARE_ACCELERATION: 'Hardware acceleration (translateZ) causing visual shifts',
  ANIMATION_TIMING: 'Animation timing conflicts during sidebar state changes'
};

// Diagnostic state
let diagnosticResults = {};
let isMonitoring = false;
let positionHistory = [];
let sidebarStateHistory = [];

/**
 * Start monitoring the EmotionRadar component position
 */
function startMonitoring() {
  if (isMonitoring) {
    console.log('⚠️ [EMOTION_RADAR_DEBUG] Monitoring already active');
    return;
  }

  console.log('🚀 [EMOTION_RADAR_DEBUG] Starting position monitoring...');
  isMonitoring = true;
  positionHistory = [];
  sidebarStateHistory = [];

  // Monitor EmotionRadar container
  const emotionRadarContainer = document.querySelector('[data-testid="emotion-radar"]') || 
                              document.querySelector('.chart-container-enhanced') ||
                              document.querySelector('div[class*="chart-container"]');

  if (emotionRadarContainer) {
    console.log('✅ [EMOTION_RADAR_DEBUG] Found EmotionRadar container:', emotionRadarContainer);
    
    // Monitor position changes
    const positionObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && 
            (mutation.attributeName === 'style' || mutation.attributeName === 'class')) {
          recordPositionChange(emotionRadarContainer, 'DOM_MUTATION');
        }
      });
    });

    positionObserver.observe(emotionRadarContainer, {
      attributes: true,
      attributeFilter: ['style', 'class'],
      childList: false,
      subtree: false
    });

    // Monitor resize
    const resizeObserver = new ResizeObserver((entries) => {
      entries.forEach((entry) => {
        recordPositionChange(entry.target, 'RESIZE');
      });
    });

    resizeObserver.observe(emotionRadarContainer);

    // Monitor sidebar state changes
    monitorSidebarState();

    // Start continuous position tracking
    startContinuousTracking(emotionRadarContainer);

  } else {
    console.error('❌ [EMOTION_RADAR_DEBUG] EmotionRadar container not found');
  }
}

/**
 * Record position changes with detailed context
 */
function recordPositionChange(element, trigger) {
  const rect = element.getBoundingClientRect();
  const computedStyle = window.getComputedStyle(element);
  const transform = computedStyle.transform;
  const position = computedStyle.position;
  const top = computedStyle.top;
  const left = computedStyle.left;
  const width = computedStyle.width;
  const height = computedStyle.height;

  const positionData = {
    timestamp: Date.now(),
    trigger,
    rect: {
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height,
      bottom: rect.bottom,
      right: rect.right
    },
    styles: {
      transform,
      position,
      top,
      left,
      width,
      height
    },
    sidebarState: getCurrentSidebarState(),
    viewportSize: {
      width: window.innerWidth,
      height: window.innerHeight
    }
  };

  positionHistory.push(positionData);

  // Log significant position changes (> 5px movement)
  if (positionHistory.length > 1) {
    const prevPos = positionHistory[positionHistory.length - 2];
    const deltaY = Math.abs(positionData.rect.top - prevPos.rect.top);
    const deltaX = Math.abs(positionData.rect.left - prevPos.rect.left);

    if (deltaY > 5 || deltaX > 5) {
      console.log(`📍 [EMOTION_RADAR_DEBUG] Significant position change detected:`, {
        trigger,
        deltaY: deltaY.toFixed(2) + 'px',
        deltaX: deltaX.toFixed(2) + 'px',
        currentTop: positionData.rect.top.toFixed(2) + 'px',
        currentLeft: positionData.rect.left.toFixed(2) + 'px',
        transform: transform,
        sidebarState: positionData.sidebarState
      });
    }
  }
}

/**
 * Monitor sidebar state changes
 */
function monitorSidebarState() {
  const sidebar = document.querySelector('.verotrade-sidebar') || 
                 document.querySelector('.unified-sidebar') ||
                 document.querySelector('[class*="sidebar"]');

  if (sidebar) {
    const sidebarObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && 
            (mutation.attributeName === 'class' || mutation.attributeName === 'style')) {
          const state = getCurrentSidebarState();
          sidebarStateHistory.push({
            timestamp: Date.now(),
            state,
            trigger: 'SIDEBAR_CHANGE'
          });

          console.log(`🔄 [EMOTION_RADAR_DEBUG] Sidebar state changed:`, state);
        }
      });
    });

    sidebarObserver.observe(sidebar, {
      attributes: true,
      attributeFilter: ['style', 'class']
    });
  }
}

/**
 * Get current sidebar state
 */
function getCurrentSidebarState() {
  const sidebar = document.querySelector('.verotrade-sidebar') || 
                 document.querySelector('.unified-sidebar') ||
                 document.querySelector('[class*="sidebar"]');

  if (!sidebar) return 'NOT_FOUND';

  const computedStyle = window.getComputedStyle(sidebar);
  const transform = computedStyle.transform;
  const width = computedStyle.width;
  const classList = sidebar.classList;

  return {
    transform,
    width,
    classes: Array.from(classList),
    isCollapsed: classList.contains('collapsed'),
    isVisible: !classList.contains('mobile-hidden') && 
               !classList.contains('hidden') &&
               transform !== 'translateX(-100%)'
  };
}

/**
 * Start continuous position tracking
 */
function startContinuousTracking(element) {
  let lastPosition = null;
  
  const trackPosition = () => {
    if (!isMonitoring) return;

    const rect = element.getBoundingClientRect();
    const currentPosition = {
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height
    };

    if (lastPosition) {
      const deltaY = Math.abs(currentPosition.top - lastPosition.top);
      const deltaX = Math.abs(currentPosition.left - lastPosition.left);

      if (deltaY > 2 || deltaX > 2) {
        console.log(`🎯 [EMOTION_RADAR_DEBUG] Continuous tracking - Position shift detected:`, {
          deltaY: deltaY.toFixed(2) + 'px',
          deltaX: deltaX.toFixed(2) + 'px',
          currentTop: currentPosition.top.toFixed(2) + 'px',
          currentLeft: currentPosition.left.toFixed(2) + 'px',
          timestamp: new Date().toISOString()
        });
      }
    }

    lastPosition = currentPosition;
    requestAnimationFrame(trackPosition);
  };

  trackPosition();
}

/**
 * Analyze CSS properties that might cause sliding
 */
function analyzeCSSEffects() {
  console.log('🔬 [EMOTION_RADAR_DEBUG] Analyzing CSS effects...');
  
  const emotionRadarContainer = document.querySelector('[data-testid="emotion-radar"]') || 
                              document.querySelector('.chart-container-enhanced') ||
                              document.querySelector('div[class*="chart-container"]');

  if (emotionRadarContainer) {
    const computedStyle = window.getComputedStyle(emotionRadarContainer);
    const parentElement = emotionRadarContainer.parentElement;
    const parentStyle = parentElement ? window.getComputedStyle(parentElement) : null;

    const cssAnalysis = {
      container: {
        transform: computedStyle.transform,
        position: computedStyle.position,
        top: computedStyle.top,
        left: computedStyle.left,
        width: computedStyle.width,
        height: computedStyle.height,
        willChange: computedStyle.willChange,
        contain: computedStyle.contain,
        transition: computedStyle.transition,
        animation: computedStyle.animation
      },
      parent: parentStyle ? {
        transform: parentStyle.transform,
        position: parentStyle.position,
        overflow: parentStyle.overflow,
        display: parentStyle.display
      } : null
    };

    console.log('📊 [EMOTION_RADAR_DEBUG] CSS Analysis:', cssAnalysis);

    // Check for problematic CSS patterns
    const issues = [];
    
    if (cssAnalysis.container.transform && cssAnalysis.container.transform !== 'none') {
      issues.push('Container has transform property that may cause positioning shifts');
    }
    
    if (cssAnalysis.container.transition && cssAnalysis.container.transition !== 'none') {
      issues.push('Container has transitions that may cause sliding');
    }
    
    if (cssAnalysis.container.animation && cssAnalysis.container.animation !== 'none') {
      issues.push('Container has animations that may cause sliding');
    }

    if (cssAnalysis.parent && cssAnalysis.parent.overflow === 'hidden') {
      issues.push('Parent has overflow:hidden which may clip or reposition content');
    }

    if (issues.length > 0) {
      console.warn('⚠️ [EMOTION_RADAR_DEBUG] Potential CSS issues detected:', issues);
    } else {
      console.log('✅ [EMOTION_RADAR_DEBUG] No obvious CSS issues detected');
    }

    diagnosticResults.cssAnalysis = cssAnalysis;
    diagnosticResults.cssIssues = issues;
  }
}

/**
 * Test viewport resize behavior
 */
function testViewportResize() {
  console.log('📱 [EMOTION_RADAR_DEBUG] Testing viewport resize behavior...');
  
  const originalWidth = window.innerWidth;
  const originalHeight = window.innerHeight;
  
  // Simulate small resize
  window.resizeTo(originalWidth - 50, originalHeight);
  
  setTimeout(() => {
    console.log('📏 [EMOTION_RADAR_DEBUG] After resize -50px:', {
      viewportSize: {
        width: window.innerWidth,
        height: window.innerHeight
      }
    });
    
    // Restore original size
    window.resizeTo(originalWidth, originalHeight);
    
    setTimeout(() => {
      console.log('📏 [EMOTION_RADAR_DEBUG] After restore to original:', {
        viewportSize: {
          width: window.innerWidth,
          height: window.innerHeight
        }
      });
    }, 100);
  }, 100);
}

/**
 * Generate diagnostic report
 */
function generateReport() {
  console.log('📋 [EMOTION_RADAR_DEBUG] Generating diagnostic report...');
  
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalPositionChanges: positionHistory.length,
      sidebarStateChanges: sidebarStateHistory.length,
      monitoringDuration: isMonitoring ? 'Active' : 'Stopped'
    },
    positionHistory: positionHistory.slice(-10), // Last 10 changes
    sidebarStateHistory: sidebarStateHistory.slice(-5), // Last 5 changes
    cssAnalysis: diagnosticResults.cssAnalysis,
    cssIssues: diagnosticResults.cssIssues || [],
    recommendations: generateRecommendations()
  };

  console.log('📄 [EMOTION_RADAR_DEBUG] Diagnostic Report:', report);
  
  // Save report to localStorage for later analysis
  localStorage.setItem('emotion-radar-diagnostic-report', JSON.stringify(report, null, 2));
  
  return report;
}

/**
 * Generate recommendations based on findings
 */
function generateRecommendations() {
  const recommendations = [];
  
  if (diagnosticResults.cssIssues && diagnosticResults.cssIssues.length > 0) {
    recommendations.push({
      issue: 'CSS Transform/Transition Issues',
      solution: 'Remove or modify transform/transition properties on EmotionRadar container',
      priority: 'HIGH'
    });
  }
  
  if (sidebarStateHistory.length > 0) {
    recommendations.push({
      issue: 'Sidebar State Changes Affecting Position',
      solution: 'Isolate EmotionRadar from sidebar transition effects',
      priority: 'HIGH'
    });
  }
  
  if (positionHistory.length > 5) {
    recommendations.push({
      issue: 'Frequent Position Changes',
      solution: 'Implement position stabilization with fixed positioning or containment',
      priority: 'MEDIUM'
    });
  }
  
  return recommendations;
}

/**
 * Stop monitoring
 */
function stopMonitoring() {
  console.log('🛑 [EMOTION_RADAR_DEBUG] Stopping position monitoring...');
  isMonitoring = false;
  generateReport();
}

// Auto-start when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
      startMonitoring();
      analyzeCSSEffects();
    }, 1000); // Wait for page to fully load
  });
} else {
  setTimeout(() => {
    startMonitoring();
    analyzeCSSEffects();
  }, 1000);
}

// Expose functions to global scope for manual testing
window.emotionRadarDiagnostic = {
  startMonitoring,
  stopMonitoring,
  analyzeCSSEffects,
  testViewportResize,
  generateReport,
  POTENTIAL_CAUSES
};

console.log('✅ [EMOTION_RADAR_DEBUG] EmotionRadar positioning diagnostic loaded');
console.log('🎯 [EMOTION_RADAR_DEBUG] Available commands:', Object.keys(window.emotionRadarDiagnostic));