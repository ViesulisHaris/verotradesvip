// Webpack Module Loading Diagnostic Tool
// This script helps identify module ID 242 and diagnose webpack runtime issues

console.log('🔍 [WEBPACK_DIAGNOSTIC] Starting webpack module diagnostic...');

// Function to intercept webpack module loading and log details
function interceptWebpackModules() {
  if (typeof window !== 'undefined' && window.__webpack_require__) {
    console.log('🔍 [WEBPACK_DIAGNOSTIC] Webpack detected, intercepting module loading...');
    
    const originalRequire = window.__webpack_require__;
    const moduleCache = {};
    
    // Intercept webpack require to track module loading
    window.__webpack_require__ = function(moduleId) {
      console.log('🔍 [WEBPACK_DIAGNOSTIC] Loading module:', {
        moduleId,
        timestamp: new Date().toISOString(),
        stack: new Error().stack
      });
      
      try {
        const result = originalRequire.call(this, moduleId);
        
        // Check if this is module 242
        if (moduleId === 242) {
          console.log('🚨 [WEBPACK_DIAGNOSTIC] MODULE 242 DETECTED!', {
            moduleId,
            result,
            resultType: typeof result,
            hasFactory: result && typeof result.factory === 'function',
            timestamp: new Date().toISOString()
          });
          
          // Try to inspect the module factory
          if (result && result.factory) {
            console.log('🔍 [WEBPACK_DIAGNOSTIC] Module 242 factory details:', {
              factoryType: typeof result.factory,
              factoryLength: result.factory.length,
              factoryString: result.factory.toString().substring(0, 200) + '...'
            });
          } else {
            console.error('❌ [WEBPACK_DIAGNOSTIC] Module 242 factory is undefined or missing!', {
              moduleId,
              result,
              hasFactory: result && typeof result.factory === 'function'
            });
          }
        }
        
        moduleCache[moduleId] = result;
        return result;
      } catch (error) {
        console.error('🚨 [WEBPACK_DIAGNOSTIC] Module loading failed:', {
          moduleId,
          error: error.message,
          stack: error.stack,
          timestamp: new Date().toISOString()
        });
        throw error;
      }
    };
    
    // Also intercept the chunk loading
    if (window.__webpack_require__.cache) {
      console.log('🔍 [WEBPACK_DIAGNOSTIC] Webpack cache detected:', {
        cacheKeys: Object.keys(window.__webpack_require__.cache),
        cacheSize: Object.keys(window.__webpack_require__.cache).length
      });
    }
    
    return true;
  }
  
  return false;
}

// Function to check for async module loading issues
function checkAsyncModuleLoading() {
  if (typeof window !== 'undefined') {
    console.log('🔍 [WEBPACK_DIAGNOSTIC] Checking async module loading...');
    
    // Monitor for requireAsyncModule errors
    const originalConsoleError = console.error;
    console.error = function(...args) {
      const message = args.join(' ');
      
      if (message.includes('requireAsyncModule') || 
          message.includes('Cannot read properties of undefined') ||
          message.includes('reading \'call\'')) {
        console.error('🚨 [WEBPACK_DIAGNOSTIC] Async module loading error detected:', {
          message,
          args,
          timestamp: new Date().toISOString(),
          stack: new Error().stack
        });
      }
      
      originalConsoleError.apply(console, args);
    };
    
    // Monitor for unhandled promise rejections (often related to chunk loading)
    window.addEventListener('unhandledrejection', function(event) {
      if (event.reason && 
          (event.reason.message?.includes('requireAsyncModule') ||
           event.reason.message?.includes('ChunkLoadError') ||
           event.reason.message?.includes('Loading chunk'))) {
        console.error('🚨 [WEBPACK_DIAGNOSTIC] Chunk loading error detected:', {
          reason: event.reason,
          timestamp: new Date().toISOString()
        });
      }
    });
  }
}

// Function to analyze loaded chunks
function analyzeLoadedChunks() {
  if (typeof window !== 'undefined' && document.querySelectorAll) {
    console.log('🔍 [WEBPACK_DIAGNOSTIC] Analyzing loaded chunks...');
    
    const scripts = document.querySelectorAll('script[src]');
    const chunkScripts = Array.from(scripts).filter(script => 
      script.src.includes('chunk') || script.src.includes('_next/static/chunks')
    );
    
    console.log('🔍 [WEBPACK_DIAGNOSTIC] Chunk analysis:', {
      totalScripts: scripts.length,
      chunkScripts: chunkScripts.length,
      chunkDetails: chunkScripts.map(script => ({
        src: script.src,
        loaded: script.readyState || 'unknown',
        error: script.onerror ? 'error handler present' : 'no error handler'
      }))
    });
  }
}

// Function to check for hydration errors
function checkHydrationErrors() {
  if (typeof window !== 'undefined') {
    console.log('🔍 [WEBPACK_DIAGNOSTIC] Checking for hydration errors...');
    
    // Monitor for hydration-specific errors
    const originalConsoleError = console.error;
    console.error = function(...args) {
      const message = args.join(' ');
      
      if (message.includes('hydration') || 
          message.includes('Server-rendered HTML') ||
          message.includes('Client-rendered HTML') ||
          message.includes('Text content does not match')) {
        console.error('🚨 [WEBPACK_DIAGNOSTIC] Hydration error detected:', {
          message,
          args,
          timestamp: new Date().toISOString()
        });
      }
      
      originalConsoleError.apply(console, args);
    };
  }
}

// Main diagnostic function
function runWebpackDiagnostic() {
  console.log('🔍 [WEBPACK_DIAGNOSTIC] Starting comprehensive webpack diagnostic...');
  
  setTimeout(() => {
    const webpackIntercepted = interceptWebpackModules();
    checkAsyncModuleLoading();
    analyzeLoadedChunks();
    checkHydrationErrors();
    
    console.log('🔍 [WEBPACK_DIAGNOSTIC] Diagnostic setup complete:', {
      webpackIntercepted,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    });
    
    // Check if we can find module 242 in the cache
    if (webpackIntercepted && window.__webpack_require__.cache) {
      const module242 = window.__webpack_require__.cache[242];
      if (module242) {
        console.log('🚨 [WEBPACK_DIAGNOSTIC] Module 242 found in cache:', {
          module242,
          hasFactory: module242.factory !== undefined,
          factoryType: typeof module242.factory,
          exports: module242.exports
        });
      } else {
        console.log('🔍 [WEBPACK_DIAGNOSTIC] Module 242 not found in cache');
      }
    }
  }, 1000);
}

// Auto-run if in browser
if (typeof window !== 'undefined') {
  runWebpackDiagnostic();
}

// Export for manual execution
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    runWebpackDiagnostic,
    interceptWebpackModules,
    checkAsyncModuleLoading,
    analyzeLoadedChunks,
    checkHydrationErrors
  };
}