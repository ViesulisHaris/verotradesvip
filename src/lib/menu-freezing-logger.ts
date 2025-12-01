/**
 * MENU FREEZING LOGGER
 * 
 * This module adds comprehensive logging to validate our root cause assumptions
 * about the menu freezing issue.
 */

// Global state for tracking menu freezing events
let menuFreezingEvents: any[] = [];
let isLogging = false;

// Log levels
const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3
};

let currentLogLevel = LOG_LEVELS.DEBUG;

function log(level: number, message: string, data?: any) {
  if (level >= currentLogLevel) {
    const timestamp = new Date().toISOString();
    const levelName = Object.keys(LOG_LEVELS)[level];
    const logEntry = {
      timestamp,
      level: levelName,
      message,
      data
    };
    
    console.log(`🔍 MENU FREEZING LOGGER [${levelName}]: ${message}`, data || '');
    
    menuFreezingEvents.push(logEntry);
    
    // Keep only last 100 events to prevent memory issues
    if (menuFreezingEvents.length > 100) {
      menuFreezingEvents = menuFreezingEvents.slice(-100);
    }
  }
}

// Start logging function
export function startMenuFreezingLogger() {
  if (isLogging) return;
  
  isLogging = true;
  log(LOG_LEVELS.INFO, 'Menu freezing logger started');
  
  // Log debug panel creation and changes
  observeDebugPanels();
  
  // Log navigation safety system activity
  observeNavigationSafety();
  
  // Log navigation element interactions
  observeNavigationElements();
  
  // Log modal/overlay activity
  observeModalActivity();
  
  // Log body style changes
  // observeBodyStyleChanges(); // Functionality already covered by modalObserver
}

// Helper function to safely check if an element's className contains a specific string
function safeClassNameIncludes(element: Element, searchString: string): boolean {
  try {
    // First, try using classList which is the most reliable method
    if (element.classList) {
      const classListArray = Array.from(element.classList);
      if (classListArray.some(className => className.includes(searchString))) {
        return true;
      }
    }
    
    // If classList doesn't work, check className property
    const classNameValue = element.className;
    
    // If className is a string, use includes directly
    if (typeof classNameValue === 'string') {
      return classNameValue.includes(searchString);
    }
    
    // If className is not null/undefined and has a toString method, convert to string
    if (classNameValue != null && typeof (classNameValue as any).toString === 'function') {
      const classNameStr = (classNameValue as any).toString();
      return classNameStr.includes(searchString);
    }
    
    // For SVG elements with SVGAnimatedString
    if (classNameValue != null && typeof (classNameValue as any).baseVal === 'string') {
      return (classNameValue as any).baseVal.includes(searchString);
    }
    
    // If all else fails, return false
    return false;
  } catch (error) {
    // If any error occurs, log it and return false
    log(LOG_LEVELS.WARN, 'Error checking className', {
      error: error instanceof Error ? error.message : String(error),
      element: element.tagName,
      className: element.className
    });
    return false;
  }
}

// Observe debug panels (PRIMARY SUSPECT #1)
function observeDebugPanels() {
  const debugPanelObserver = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const element = node as Element;
          if (element.classList.contains('zoom-debug-panel') ||
              safeClassNameIncludes(element, 'debug-panel')) {
            
            const styles = window.getComputedStyle(element);
            log(LOG_LEVELS.WARN, 'DEBUG PANEL DETECTED', {
              element: element.tagName,
              className: element.className,
              zIndex: styles.zIndex,
              pointerEvents: styles.pointerEvents,
              position: styles.position,
              display: styles.display,
              visibility: styles.visibility,
              rect: element.getBoundingClientRect()
            });
            
            // Check if it could block navigation
            const zIndex = parseInt(styles.zIndex) || 0;
            if (zIndex > 10) {
              log(LOG_LEVELS.ERROR, 'HIGH Z-INDEX DEBUG PANEL - POTENTIAL BLOCKER', {
                zIndex,
                pointerEvents: styles.pointerEvents
              });
            }
          }
        }
      });
      
      mutation.removedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const element = node as Element;
          
          if (element.classList.contains('zoom-debug-panel') ||
              safeClassNameIncludes(element, 'debug-panel')) {
            log(LOG_LEVELS.INFO, 'Debug panel removed', {
              className: element.className
            });
          }
        }
      });
    });
  });
  
  debugPanelObserver.observe(document.body, {
    childList: true,
    subtree: true
  });
}

// Observe navigation safety system (PRIMARY SUSPECT #2)
function observeNavigationSafety() {
  // Check if navigation safety functions exist and are being called
  const originalForceCleanup = (window as any).navigationSafety?.forceCleanupNavigationBlockers;
  const originalSafeNavigation = (window as any).navigationSafety?.safeNavigation;
  
  if (originalForceCleanup) {
    (window as any).navigationSafety.forceCleanupNavigationBlockers = function(...args: any[]) {
      log(LOG_LEVELS.INFO, 'NAVIGATION SAFETY: forceCleanupNavigationBlockers called', args);
      
      const result = originalForceCleanup.apply(this, args);
      
      // Check what elements are being removed
      setTimeout(() => {
        const overlays = document.querySelectorAll('.fixed.inset-0, .modal-backdrop, [role="dialog"]');
        log(LOG_LEVELS.DEBUG, 'Navigation safety cleanup result', {
          overlaysFound: overlays.length,
          bodyStyles: {
            pointerEvents: window.getComputedStyle(document.body).pointerEvents,
            overflow: window.getComputedStyle(document.body).overflow
          }
        });
      }, 100);
      
      return result;
    };
  }
  
  if (originalSafeNavigation) {
    (window as any).navigationSafety.safeNavigation = function(href: string, label?: string) {
      log(LOG_LEVELS.INFO, 'NAVIGATION SAFETY: safeNavigation called', { href, label });
      
      const result = originalSafeNavigation.apply(this, arguments);
      
      // Check if navigation actually happens
      setTimeout(() => {
        const currentUrl = window.location.href;
        const navigated = currentUrl.includes(href) || 
                          (label && currentUrl.toLowerCase().includes(label.toLowerCase()));
        
        log(LOG_LEVELS.DEBUG, 'Navigation safety result', {
          href,
          currentUrl,
          navigated
        });
        
        if (!navigated) {
          log(LOG_LEVELS.ERROR, 'NAVIGATION BLOCKED - MENU FREEZING SUSPECTED', {
            attemptedHref: href,
            currentUrl
          });
        }
      }, 1000);
      
      return result;
    };
  }
}

// Observe navigation elements
function observeNavigationElements() {
  const navElements = document.querySelectorAll('nav a, [role="navigation"] a, .nav-link, .nav-item-luxury');
  
  navElements.forEach((element, index) => {
    const navElement = element as HTMLElement;
    
    // Add click tracking
    navElement.addEventListener('click', (event) => {
      const styles = window.getComputedStyle(navElement);
      log(LOG_LEVELS.INFO, 'NAVIGATION ELEMENT CLICKED', {
        index,
        tagName: navElement.tagName,
        textContent: navElement.textContent?.substring(0, 20),
        href: (navElement as HTMLAnchorElement).href,
        pointerEvents: styles.pointerEvents,
        zIndex: styles.zIndex,
        position: styles.position,
        visible: navElement.offsetParent !== null
      });
      
      // Check if click is being blocked
      setTimeout(() => {
        const currentUrl = window.location.href;
        const targetUrl = (navElement as HTMLAnchorElement).href;
        
        if (targetUrl && !currentUrl.includes(targetUrl)) {
          log(LOG_LEVELS.ERROR, 'NAVIGATION CLICK BLOCKED - MENU FREEZING', {
            targetUrl,
            currentUrl,
            elementStyles: styles
          });
        }
      }, 500);
    });
    
    // Log initial state
    const styles = window.getComputedStyle(navElement);
    log(LOG_LEVELS.DEBUG, 'Navigation element initial state', {
      index,
      pointerEvents: styles.pointerEvents,
      zIndex: styles.zIndex,
      position: styles.position,
      visible: navElement.offsetParent !== null
    });
  });
}

// Observe modal/overlay activity
function observeModalActivity() {
  const modalObserver = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
        const target = mutation.target as HTMLElement;
        if (target === document.body) {
          const styles = window.getComputedStyle(document.body);
          log(LOG_LEVELS.DEBUG, 'Body styles changed', {
            pointerEvents: styles.pointerEvents,
            overflow: styles.overflow,
            userSelect: styles.userSelect,
            classes: document.body.className
          });
          
          // Check for problematic styles
          if (styles.pointerEvents === 'none') {
            log(LOG_LEVELS.WARN, 'Body pointer-events set to none - POTENTIAL MENU FREEZING');
          }
          
          if (styles.overflow === 'hidden') {
            log(LOG_LEVELS.WARN, 'Body overflow set to hidden - POTENTIAL MENU FREEZING');
          }
        }
      }
      
      // Check for new overlays
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const element = node as Element;
          const styles = window.getComputedStyle(element);
          const zIndex = parseInt(styles.zIndex) || 0;
          
          if (zIndex > 1000 && (styles.position === 'fixed' || styles.position === 'absolute')) {
            log(LOG_LEVELS.WARN, 'HIGH Z-INDEX OVERLAY DETECTED', {
              tagName: element.tagName,
              className: element.className,
              zIndex,
              position: styles.position,
              pointerEvents: styles.pointerEvents
            });
          }
        }
      });
    });
  });
  
  modalObserver.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['style', 'class']
  });
}

// Get logged events
export function getMenuFreezingEvents() {
  return [...menuFreezingEvents];
}

// Clear logged events
export function clearMenuFreezingEvents() {
  menuFreezingEvents = [];
  log(LOG_LEVELS.INFO, 'Menu freezing events cleared');
}

// Export logs for analysis
export function exportMenuFreezingLogs() {
  const logData = {
    timestamp: new Date().toISOString(),
    events: menuFreezingEvents,
    summary: {
      totalEvents: menuFreezingEvents.length,
      errorEvents: menuFreezingEvents.filter(e => e.level === 'ERROR').length,
      warnEvents: menuFreezingEvents.filter(e => e.level === 'WARN').length
    }
  };
  
  // Save to localStorage
  localStorage.setItem('menu-freezing-logs', JSON.stringify(logData, null, 2));
  
  return logData;
}

// Auto-start if in browser
if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startMenuFreezingLogger);
  } else {
    setTimeout(startMenuFreezingLogger, 1000);
  }
}