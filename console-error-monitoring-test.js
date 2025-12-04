/**
 * Comprehensive Console Error Monitoring Test for /trades Page Filter Interactions
 * 
 * This script systematically monitors and analyzes console errors during all types of
 * filter interactions on the trades page, providing detailed categorization and analysis.
 */

const ConsoleErrorMonitor = {
  // Error storage and categorization
  errors: {
    critical: [],
    warning: [],
    info: [],
    network: [],
    performance: [],
    react: [],
    javascript: [],
    undefined: [],
    memory: [],
    compatibility: []
  },

  // Test execution tracking
  testResults: {
    symbolFilter: { errors: [], warnings: [], interactions: 0 },
    marketFilter: { errors: [], warnings: [], interactions: 0 },
    dateRangeFilter: { errors: [], warnings: [], interactions: 0 },
    sortingOperations: { errors: [], warnings: [], interactions: 0 },
    filterClearing: { errors: [], warnings: [], interactions: 0 },
    rapidChanges: { errors: [], warnings: [], interactions: 0 },
    edgeCases: { errors: [], warnings: [], interactions: 0 },
    performanceTests: { errors: [], warnings: [], interactions: 0 }
  },

  // Console monitoring setup
  originalConsole: {
    error: null,
    warn: null,
    info: null,
    log: null
  },

  // Performance monitoring
  performanceMetrics: {
    filterOperations: [],
    memoryUsage: [],
    networkRequests: [],
    renderTimes: []
  },

  // State monitoring
  stateChanges: [],
  useEffectTriggers: [],
  apiCalls: [],

  // Initialize console monitoring
  initialize() {
    console.log('🔍 [CONSOLE_MONITOR] Initializing comprehensive console error monitoring...');
    
    // Store original console methods
    this.originalConsole.error = console.error;
    this.originalConsole.warn = console.warn;
    this.originalConsole.info = console.info;
    this.originalConsole.log = console.log;

    // Override console methods to capture all messages
    this.setupConsoleCapture();
    
    // Setup performance monitoring
    this.setupPerformanceMonitoring();
    
    // Setup network monitoring
    this.setupNetworkMonitoring();
    
    // Setup state change monitoring
    this.setupStateMonitoring();
    
    console.log('✅ [CONSOLE_MONITOR] Console error monitoring initialized successfully');
  },

  // Setup console message capture
  setupConsoleCapture() {
    const self = this;
    
    // Capture console errors
    console.error = function(...args) {
      self.categorizeAndStore('error', args);
      self.originalConsole.error.apply(console, args);
    };

    // Capture console warnings
    console.warn = function(...args) {
      self.categorizeAndStore('warn', args);
      self.originalConsole.warn.apply(console, args);
    };

    // Capture console info
    console.info = function(...args) {
      self.categorizeAndStore('info', args);
      self.originalConsole.info.apply(console, args);
    };

    // Capture console logs (for debugging messages)
    console.log = function(...args) {
      // Only capture logs that contain error-related keywords
      const message = args.join(' ');
      if (message.toLowerCase().includes('error') || 
          message.toLowerCase().includes('warning') ||
          message.toLowerCase().includes('failed') ||
          message.toLowerCase().includes('exception')) {
        self.categorizeAndStore('log', args);
      }
      self.originalConsole.log.apply(console, args);
    };
  },

  // Categorize and store console messages
  categorizeAndStore(type, args) {
    const message = args.join(' ');
    const timestamp = new Date().toISOString();
    const stackTrace = new Error().stack;
    
    const errorEntry = {
      timestamp,
      type,
      message,
      args: args.map(arg => {
        if (typeof arg === 'object') {
          try {
            return JSON.stringify(arg, null, 2);
          } catch (e) {
            return '[Object]';
          }
        }
        return String(arg);
      }),
      stackTrace,
      url: window.location.href,
      userAgent: navigator.userAgent
    };

    // Categorize by error type
    if (type === 'error') {
      if (message.includes('network') || message.includes('fetch') || message.includes('axios')) {
        this.errors.network.push(errorEntry);
      } else if (message.includes('React') || message.includes('component') || message.includes('render')) {
        this.errors.react.push(errorEntry);
      } else if (message.includes('undefined') || message.includes('null') || message.includes('Cannot read property')) {
        this.errors.undefined.push(errorEntry);
      } else if (message.includes('memory') || message.includes('Memory')) {
        this.errors.memory.push(errorEntry);
      } else {
        this.errors.javascript.push(errorEntry);
      }
    } else if (type === 'warn') {
      this.errors.warning.push(errorEntry);
    } else if (type === 'info') {
      this.errors.info.push(errorEntry);
    }

    // Check for performance-related issues
    if (message.includes('timeout') || message.includes('slow') || message.includes('performance')) {
      this.errors.performance.push(errorEntry);
    }

    // Check for compatibility issues
    if (message.includes('deprecated') || message.includes('browser') || message.includes('compatibility')) {
      this.errors.compatibility.push(errorEntry);
    }
  },

  // Setup performance monitoring
  setupPerformanceMonitoring() {
    const self = this;
    
    // Monitor filter operation performance
    const originalSetTimeout = window.setTimeout;
    window.setTimeout = function(callback, delay) {
      if (delay > 1000) { // Long-running operations
        self.performanceMetrics.filterOperations.push({
          type: 'timeout',
          delay,
          timestamp: new Date().toISOString(),
          stack: new Error().stack
        });
      }
      return originalSetTimeout.call(this, callback, delay);
    };

    // Monitor memory usage
    if (performance.memory) {
      setInterval(() => {
        self.performanceMetrics.memoryUsage.push({
          used: performance.memory.usedJSHeapSize,
          total: performance.memory.totalJSHeapSize,
          limit: performance.memory.jsHeapSizeLimit,
          timestamp: new Date().toISOString()
        });
      }, 5000);
    }

    // Monitor long tasks
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.duration > 50) { // Tasks taking longer than 50ms
            self.performanceMetrics.filterOperations.push({
              type: 'long_task',
              duration: entry.duration,
              name: entry.name,
              timestamp: new Date().toISOString()
            });
          }
        });
      });
      
      try {
        observer.observe({ entryTypes: ['longtask'] });
      } catch (e) {
        console.log('Long task monitoring not supported');
      }
    }
  },

  // Setup network monitoring
  setupNetworkMonitoring() {
    const self = this;
    
    // Intercept fetch requests
    const originalFetch = window.fetch;
    window.fetch = function(...args) {
      const startTime = performance.now();
      const url = args[0];
      
      return originalFetch.apply(this, args)
        .then(response => {
          const endTime = performance.now();
          const duration = endTime - startTime;
          
          self.performanceMetrics.networkRequests.push({
            url,
            method: args[1]?.method || 'GET',
            status: response.status,
            duration,
            timestamp: new Date().toISOString(),
            success: response.ok
          });
          
          // Log slow requests
          if (duration > 2000) {
            console.warn(`🐌 [NETWORK] Slow request detected: ${url} took ${duration.toFixed(2)}ms`);
          }
          
          return response;
        })
        .catch(error => {
          const endTime = performance.now();
          const duration = endTime - startTime;
          
          self.performanceMetrics.networkRequests.push({
            url,
            method: args[1]?.method || 'GET',
            error: error.message,
            duration,
            timestamp: new Date().toISOString(),
            success: false
          });
          
          console.error(`🚫 [NETWORK] Request failed: ${url} - ${error.message}`);
          throw error;
        });
    };
  },

  // Setup state change monitoring
  setupStateMonitoring() {
    const self = this;
    
    // Monitor React state changes (if possible)
    let stateChangeCount = 0;
    
    // Create a mutation observer to detect DOM changes
    if ('MutationObserver' in window) {
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'childList' && mutation.target.classList?.contains('dashboard-card')) {
            stateChangeCount++;
            self.stateChanges.push({
              type: 'dom_change',
              target: mutation.target.tagName,
              timestamp: new Date().toISOString(),
              changeCount: stateChangeCount
            });
          }
        });
      });
      
      observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['class', 'style']
      });
    }
  },

  // Test filter interactions systematically
  async runFilterInteractionTests() {
    console.log('🧪 [CONSOLE_MONITOR] Starting comprehensive filter interaction tests...');
    
    try {
      // Wait for page to load
      await this.waitForPageLoad();
      
      // Test 1: Symbol filter interactions
      await this.testSymbolFilterInteractions();
      
      // Test 2: Market filter dropdown
      await this.testMarketFilterDropdown();
      
      // Test 3: Date range filter operations
      await this.testDateRangeFilterOperations();
      
      // Test 4: Sorting operations
      await this.testSortingOperations();
      
      // Test 5: Filter clearing operations
      await this.testFilterClearingOperations();
      
      // Test 6: Rapid filter changes
      await this.testRapidFilterChanges();
      
      // Test 7: Edge cases
      await this.testEdgeCases();
      
      // Test 8: Performance-related testing
      await this.testPerformanceScenarios();
      
      console.log('✅ [CONSOLE_MONITOR] All filter interaction tests completed');
      
    } catch (error) {
      console.error('❌ [CONSOLE_MONITOR] Error during filter interaction tests:', error);
    }
  },

  // Wait for page to fully load
  async waitForPageLoad() {
    return new Promise((resolve) => {
      if (document.readyState === 'complete') {
        resolve();
      } else {
        window.addEventListener('load', resolve, { once: true });
      }
    });
  },

  // Test symbol filter interactions
  async testSymbolFilterInteractions() {
    console.log('🔍 [SYMBOL_FILTER] Testing symbol filter interactions...');
    
    const symbolInput = document.querySelector('input[placeholder="Search symbol..."]');
    if (!symbolInput) {
      console.warn('⚠️ [SYMBOL_FILTER] Symbol input not found');
      return;
    }

    const testSymbols = ['AAPL', 'GOOGL', 'MSFT', '', 'INVALID_SYMBOL', '123', '!@#$%'];
    
    for (const symbol of testSymbols) {
      this.testResults.symbolFilter.interactions++;
      
      try {
        // Clear input
        symbolInput.value = '';
        symbolInput.dispatchEvent(new Event('input', { bubbles: true }));
        
        // Type symbol
        symbolInput.value = symbol;
        symbolInput.dispatchEvent(new Event('input', { bubbles: true }));
        symbolInput.dispatchEvent(new Event('change', { bubbles: true }));
        
        // Wait for debounced effect
        await this.sleep(300);
        
        // Check for errors
        this.checkForErrors('symbolFilter', `Symbol: ${symbol}`);
        
      } catch (error) {
        this.testResults.symbolFilter.errors.push({
          symbol,
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    }
    
    console.log('✅ [SYMBOL_FILTER] Symbol filter interactions completed');
  },

  // Test market filter dropdown
  async testMarketFilterDropdown() {
    console.log('🔍 [MARKET_FILTER] Testing market filter dropdown...');
    
    const marketSelect = document.querySelector('select');
    if (!marketSelect) {
      console.warn('⚠️ [MARKET_FILTER] Market select not found');
      return;
    }

    const markets = ['', 'stock', 'crypto', 'forex', 'futures', 'INVALID_MARKET'];
    
    for (const market of markets) {
      this.testResults.marketFilter.interactions++;
      
      try {
        // Change market selection
        marketSelect.value = market;
        marketSelect.dispatchEvent(new Event('change', { bubbles: true }));
        
        // Wait for debounced effect
        await this.sleep(300);
        
        // Check for errors
        this.checkForErrors('marketFilter', `Market: ${market}`);
        
      } catch (error) {
        this.testResults.marketFilter.errors.push({
          market,
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    }
    
    console.log('✅ [MARKET_FILTER] Market filter dropdown tests completed');
  },

  // Test date range filter operations
  async testDateRangeFilterOperations() {
    console.log('🔍 [DATE_FILTER] Testing date range filter operations...');
    
    const dateInputs = document.querySelectorAll('input[type="date"]');
    if (dateInputs.length < 2) {
      console.warn('⚠️ [DATE_FILTER] Date inputs not found');
      return;
    }

    const [fromInput, toInput] = dateInputs;
    const dateRanges = [
      { from: '', to: '' },
      { from: '2024-01-01', to: '2024-12-31' },
      { from: '2024-06-01', to: '2024-06-30' },
      { from: '2024-12-31', to: '2024-01-01' }, // Invalid range
      { from: 'INVALID_DATE', to: 'INVALID_DATE' },
      { from: '2025-01-01', to: '2025-12-31' } // Future dates
    ];
    
    for (const range of dateRanges) {
      this.testResults.dateRangeFilter.interactions++;
      
      try {
        // Set date values
        fromInput.value = range.from;
        toInput.value = range.to;
        
        fromInput.dispatchEvent(new Event('change', { bubbles: true }));
        toInput.dispatchEvent(new Event('change', { bubbles: true }));
        
        // Wait for debounced effect
        await this.sleep(300);
        
        // Check for errors
        this.checkForErrors('dateRangeFilter', `Range: ${range.from} - ${range.to}`);
        
      } catch (error) {
        this.testResults.dateRangeFilter.errors.push({
          range,
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    }
    
    console.log('✅ [DATE_FILTER] Date range filter operations completed');
  },

  // Test sorting operations
  async testSortingOperations() {
    console.log('🔍 [SORTING] Testing sorting operations...');
    
    // Find sort controls
    const sortButtons = document.querySelectorAll('[data-testid*="sort"], button[onclick*="sort"]');
    if (sortButtons.length === 0) {
      console.warn('⚠️ [SORTING] Sort buttons not found');
      return;
    }
    
    for (let i = 0; i < Math.min(sortButtons.length, 5); i++) {
      this.testResults.sortingOperations.interactions++;
      
      try {
        const button = sortButtons[i];
        button.click();
        
        // Wait for sorting to complete
        await this.sleep(500);
        
        // Check for errors
        this.checkForErrors('sortingOperations', `Sort button ${i}`);
        
      } catch (error) {
        this.testResults.sortingOperations.errors.push({
          buttonIndex: i,
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    }
    
    console.log('✅ [SORTING] Sorting operations completed');
  },

  // Test filter clearing operations
  async testFilterClearingOperations() {
    console.log('🔍 [CLEAR_FILTERS] Testing filter clearing operations...');
    
    const clearButton = document.querySelector('button:contains("Clear Filters"), button[onclick*="clear"]');
    if (!clearButton) {
      console.warn('⚠️ [CLEAR_FILTERS] Clear filters button not found');
      return;
    }
    
    for (let i = 0; i < 3; i++) {
      this.testResults.filterClearing.interactions++;
      
      try {
        // First, set some filters
        const symbolInput = document.querySelector('input[placeholder="Search symbol..."]');
        const marketSelect = document.querySelector('select');
        
        if (symbolInput) symbolInput.value = 'TEST';
        if (marketSelect) marketSelect.value = 'stock';
        
        // Then clear them
        clearButton.click();
        
        // Wait for clearing to complete
        await this.sleep(300);
        
        // Check for errors
        this.checkForErrors('filterClearing', `Clear operation ${i}`);
        
      } catch (error) {
        this.testResults.filterClearing.errors.push({
          operation: i,
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    }
    
    console.log('✅ [CLEAR_FILTERS] Filter clearing operations completed');
  },

  // Test rapid filter changes
  async testRapidFilterChanges() {
    console.log('🔍 [RAPID_CHANGES] Testing rapid filter changes...');
    
    const symbolInput = document.querySelector('input[placeholder="Search symbol..."]');
    const marketSelect = document.querySelector('select');
    
    if (!symbolInput || !marketSelect) {
      console.warn('⚠️ [RAPID_CHANGES] Filter inputs not found');
      return;
    }
    
    const rapidChanges = [
      () => { symbolInput.value = 'AAPL'; symbolInput.dispatchEvent(new Event('input')); },
      () => { marketSelect.value = 'stock'; marketSelect.dispatchEvent(new Event('change')); },
      () => { symbolInput.value = 'GOOGL'; symbolInput.dispatchEvent(new Event('input')); },
      () => { marketSelect.value = 'crypto'; marketSelect.dispatchEvent(new Event('change')); },
      () => { symbolInput.value = ''; symbolInput.dispatchEvent(new Event('input')); }
    ];
    
    for (let i = 0; i < rapidChanges.length; i++) {
      this.testResults.rapidChanges.interactions++;
      
      try {
        rapidChanges[i]();
        
        // Minimal delay to simulate rapid changes
        await this.sleep(50);
        
        // Check for errors
        this.checkForErrors('rapidChanges', `Rapid change ${i}`);
        
      } catch (error) {
        this.testResults.rapidChanges.errors.push({
          changeIndex: i,
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    }
    
    console.log('✅ [RAPID_CHANGES] Rapid filter changes completed');
  },

  // Test edge cases
  async testEdgeCases() {
    console.log('🔍 [EDGE_CASES] Testing edge cases...');
    
    const edgeCases = [
      // Very long symbol names
      () => {
        const symbolInput = document.querySelector('input[placeholder="Search symbol..."]');
        if (symbolInput) {
          symbolInput.value = 'VERY_LONG_SYMBOL_NAME_THAT_MIGHT_CAUSE_ISSUES_WITH_RENDERING_OR_PROCESSING';
          symbolInput.dispatchEvent(new Event('input'));
        }
      },
      
      // Special characters
      () => {
        const symbolInput = document.querySelector('input[placeholder="Search symbol..."]');
        if (symbolInput) {
          symbolInput.value = '!@#$%^&*()_+-=[]{}|;:,.<>?';
          symbolInput.dispatchEvent(new Event('input'));
        }
      },
      
      // Unicode characters
      () => {
        const symbolInput = document.querySelector('input[placeholder="Search symbol..."]');
        if (symbolInput) {
          symbolInput.value = '🚀📈📉💹📊';
          symbolInput.dispatchEvent(new Event('input'));
        }
      },
      
      // Null/undefined values
      () => {
        const symbolInput = document.querySelector('input[placeholder="Search symbol..."]');
        if (symbolInput) {
          symbolInput.value = 'null';
          symbolInput.dispatchEvent(new Event('input'));
        }
      }
    ];
    
    for (let i = 0; i < edgeCases.length; i++) {
      this.testResults.edgeCases.interactions++;
      
      try {
        edgeCases[i]();
        await this.sleep(200);
        
        // Check for errors
        this.checkForErrors('edgeCases', `Edge case ${i}`);
        
      } catch (error) {
        this.testResults.edgeCases.errors.push({
          caseIndex: i,
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    }
    
    console.log('✅ [EDGE_CASES] Edge case testing completed');
  },

  // Test performance scenarios
  async testPerformanceScenarios() {
    console.log('🔍 [PERFORMANCE] Testing performance scenarios...');
    
    // Test with many rapid filter changes
    const symbolInput = document.querySelector('input[placeholder="Search symbol..."]');
    if (!symbolInput) {
      console.warn('⚠️ [PERFORMANCE] Symbol input not found');
      return;
    }
    
    const startTime = performance.now();
    const iterations = 50;
    
    for (let i = 0; i < iterations; i++) {
      this.testResults.performanceTests.interactions++;
      
      try {
        symbolInput.value = `TEST${i}`;
        symbolInput.dispatchEvent(new Event('input'));
        
        // Very small delay to simulate rapid typing
        await this.sleep(10);
        
        // Check for performance issues
        if (i % 10 === 0) {
          this.checkForErrors('performanceTests', `Performance test iteration ${i}`);
        }
        
      } catch (error) {
        this.testResults.performanceTests.errors.push({
          iteration: i,
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    }
    
    const endTime = performance.now();
    const totalTime = endTime - startTime;
    
    console.log(`📊 [PERFORMANCE] Performance test completed: ${iterations} iterations in ${totalTime.toFixed(2)}ms`);
    
    // Check for memory leaks
    if (performance.memory) {
      const memoryUsage = performance.memory.usedJSHeapSize;
      console.log(`💾 [PERFORMANCE] Memory usage: ${(memoryUsage / 1024 / 1024).toFixed(2)} MB`);
    }
  },

  // Check for errors during specific operations
  checkForErrors(testCategory, operation) {
    // This would be called after each operation to check if any errors occurred
    // The actual error checking is done by the console overrides
    console.log(`🔍 [ERROR_CHECK] Checking for errors in ${testCategory}: ${operation}`);
  },

  // Helper function to sleep
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  },

  // Generate comprehensive report
  generateReport() {
    console.log('📊 [REPORT] Generating comprehensive console error analysis report...');
    
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalErrors: Object.values(this.errors).flat().length,
        criticalErrors: this.errors.critical.length,
        warnings: this.errors.warning.length,
        networkErrors: this.errors.network.length,
        reactErrors: this.errors.react.length,
        javascriptErrors: this.errors.javascript.length,
        undefinedErrors: this.errors.undefined.length,
        memoryErrors: this.errors.memory.length,
        compatibilityErrors: this.errors.compatibility.length
      },
      testResults: this.testResults,
      performanceMetrics: this.performanceMetrics,
      errors: this.errors,
      recommendations: this.generateRecommendations()
    };
    
    return report;
  },

  // Generate recommendations based on findings
  generateRecommendations() {
    const recommendations = [];
    
    if (this.errors.network.length > 0) {
      recommendations.push({
        severity: 'high',
        category: 'network',
        issue: 'Network errors detected during filter operations',
        recommendation: 'Implement proper error handling for API calls and add retry logic'
      });
    }
    
    if (this.errors.react.length > 0) {
      recommendations.push({
        severity: 'high',
        category: 'react',
        issue: 'React rendering errors detected',
        recommendation: 'Review component lifecycle methods and state management'
      });
    }
    
    if (this.errors.undefined.length > 0) {
      recommendations.push({
        severity: 'medium',
        category: 'undefined',
        issue: 'Undefined/null access errors detected',
        recommendation: 'Add proper null checks and default values'
      });
    }
    
    if (this.errors.memory.length > 0) {
      recommendations.push({
        severity: 'medium',
        category: 'memory',
        issue: 'Memory-related errors detected',
        recommendation: 'Optimize memory usage and implement proper cleanup'
      });
    }
    
    if (this.performanceMetrics.filterOperations.some(op => op.duration > 1000)) {
      recommendations.push({
        severity: 'medium',
        category: 'performance',
        issue: 'Slow filter operations detected',
        recommendation: 'Optimize filter logic and implement better debouncing'
      });
    }
    
    if (this.performanceMetrics.networkRequests.some(req => req.duration > 2000)) {
      recommendations.push({
        severity: 'low',
        category: 'performance',
        issue: 'Slow network requests detected',
        recommendation: 'Consider implementing caching or optimizing API endpoints'
      });
    }
    
    return recommendations;
  },

  // Restore original console methods
  cleanup() {
    console.log('🧹 [CONSOLE_MONITOR] Cleaning up console monitoring...');
    
    if (this.originalConsole.error) console.error = this.originalConsole.error;
    if (this.originalConsole.warn) console.warn = this.originalConsole.warn;
    if (this.originalConsole.info) console.info = this.originalConsole.info;
    if (this.originalConsole.log) console.log = this.originalConsole.log;
    
    console.log('✅ [CONSOLE_MONITOR] Console monitoring cleaned up');
  }
};

// Auto-execute the monitoring when the script loads
(async function() {
  try {
    // Initialize monitoring
    ConsoleErrorMonitor.initialize();
    
    // Wait for page to be ready
    if (document.readyState === 'loading') {
      await new Promise(resolve => {
        document.addEventListener('DOMContentLoaded', resolve);
      });
    }
    
    // Run comprehensive tests
    await ConsoleErrorMonitor.runFilterInteractionTests();
    
    // Generate and save report
    const report = ConsoleErrorMonitor.generateReport();
    
    // Save report to localStorage for later retrieval
    localStorage.setItem('consoleErrorReport', JSON.stringify(report, null, 2));
    
    // Also save as a downloadable file
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `console-error-report-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    console.log('📄 [REPORT] Console error report generated and saved');
    
    // Cleanup
    ConsoleErrorMonitor.cleanup();
    
  } catch (error) {
    console.error('❌ [CONSOLE_MONITOR] Fatal error during monitoring:', error);
    ConsoleErrorMonitor.cleanup();
  }
})();

// Export for manual execution if needed
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ConsoleErrorMonitor;
}
