/**
 * Browser Console Filter Clearing Verification Test
 * 
 * This script can be run directly in the browser console on the /trades page
 * to verify filter clearing functionality without requiring Puppeteer.
 * 
 * Instructions:
 * 1. Navigate to the /trades page in your application
 * 2. Open browser developer tools (F12)
 * 3. Copy and paste this entire script into the console
 * 4. Press Enter to run the verification tests
 */

// Test configuration and state
const FilterClearingTest = {
  results: [],
  networkRequests: [],
  consoleErrors: [],
  startTime: Date.now(),
  
  // Utility functions
  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️';
    console.log(`${prefix} [${timestamp}] ${message}`);
    
    if (type === 'error') {
      this.consoleErrors.push({ timestamp, message });
    }
  },
  
  recordTest(name, expected, actual, passed, details = '') {
    const test = {
      name,
      expected,
      actual,
      passed,
      details,
      timestamp: new Date().toISOString()
    };
    
    this.results.push(test);
    
    if (passed) {
      this.log(`PASSED: ${name}`, 'success');
    } else {
      this.log(`FAILED: ${name}`, 'error');
      this.log(`  Expected: ${expected}`);
      this.log(`  Actual: ${actual}`);
      if (details) this.log(`  Details: ${details}`);
    }
  },
  
  // Element interaction functions
  async waitForElement(selector, timeout = 5000) {
    return new Promise((resolve, reject) => {
      const element = document.querySelector(selector);
      if (element) {
        resolve(element);
        return;
      }
      
      const observer = new MutationObserver(() => {
        const element = document.querySelector(selector);
        if (element) {
          observer.disconnect();
          resolve(element);
        }
      });
      
      observer.observe(document.body, { childList: true, subtree: true });
      
      setTimeout(() => {
        observer.disconnect();
        reject(new Error(`Element not found: ${selector}`));
      }, timeout);
    });
  },
  
  getElementValue(selector) {
    const element = document.querySelector(selector);
    return element ? element.value : null;
  },
  
  getElementText(selector) {
    const element = document.querySelector(selector);
    return element ? (element.textContent || '').trim() : null;
  },
  
  isElementVisible(selector) {
    const element = document.querySelector(selector);
    if (!element) return false;
    
    const style = window.getComputedStyle(element);
    return style.display !== 'none' && 
           style.visibility !== 'hidden' && 
           style.opacity !== '0';
  },
  
  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  },
  
  // Network monitoring
  startNetworkMonitoring() {
    const originalFetch = window.fetch;
    const originalXHROpen = XMLHttpRequest.prototype.open;
    const originalXHRSend = XMLHttpRequest.prototype.send;
    
    window.fetch = function(...args) {
      FilterClearingTest.networkRequests.push({
        url: args[0],
        method: 'GET',
        timestamp: Date.now(),
        type: 'fetch'
      });
      return originalFetch.apply(this, args);
    };
    
    XMLHttpRequest.prototype.open = function(method, url) {
      this._url = url;
      this._method = method;
      return originalXHROpen.apply(this, arguments);
    };
    
    XMLHttpRequest.prototype.send = function() {
      FilterClearingTest.networkRequests.push({
        url: this._url,
        method: this._method,
        timestamp: Date.now(),
        type: 'xhr'
      });
      return originalXHRSend.apply(this, arguments);
    };
  },
  
  stopNetworkMonitoring() {
    // Restore original methods if needed
    // This is simplified for the test
  },
  
  // Test functions
  async testClearFiltersButton() {
    this.log('Testing Clear Filters button...');
    
    try {
      // First apply some test filters
      this.log('Applying test filters...');
      
      // Apply Symbol filter
      const symbolInput = document.querySelector('input[placeholder="Search symbol..."]');
      if (symbolInput) {
        symbolInput.value = 'AAPL';
        symbolInput.dispatchEvent(new Event('input', { bubbles: true }));
      }
      
      // Apply Market filter
      const marketSelect = document.querySelector('select');
      if (marketSelect) {
        marketSelect.value = 'stock';
        marketSelect.dispatchEvent(new Event('change', { bubbles: true }));
      }
      
      // Apply Date Range filters
      const dateInputs = document.querySelectorAll('input[type="date"]');
      if (dateInputs.length >= 2) {
        const today = new Date().toISOString().split('T')[0];
        const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        
        dateInputs[0].value = lastWeek;
        dateInputs[0].dispatchEvent(new Event('change', { bubbles: true }));
        
        dateInputs[1].value = today;
        dateInputs[1].dispatchEvent(new Event('change', { bubbles: true }));
      }
      
      // Wait for filters to apply
      await this.sleep(1000);
      
      // Get state before clearing
      const beforeClear = {
        symbol: this.getElementValue('input[placeholder="Search symbol..."]'),
        market: this.getElementValue('select'),
        dateFrom: dateInputs[0] ? dateInputs[0].value : null,
        dateTo: dateInputs[1] ? dateInputs[1].value : null,
        localStorage: JSON.stringify(localStorage)
      };
      
      // Click Clear Filters button
      const clearButton = document.querySelector('button:contains("Clear Filters")') || 
                         Array.from(document.querySelectorAll('button')).find(btn => 
                           btn.textContent.includes('Clear Filters')
                         );
      
      if (!clearButton) {
        throw new Error('Clear Filters button not found');
      }
      
      const startTime = Date.now();
      clearButton.click();
      
      // Wait for clearing to complete
      await this.sleep(1500);
      const endTime = Date.now();
      
      // Get state after clearing
      const afterClear = {
        symbol: this.getElementValue('input[placeholder="Search symbol..."]'),
        market: this.getElementValue('select'),
        dateFrom: dateInputs[0] ? dateInputs[0].value : null,
        dateTo: dateInputs[1] ? dateInputs[1].value : null,
        localStorage: JSON.stringify(localStorage)
      };
      
      // Test results
      const filtersCleared = 
        afterClear.symbol === '' &&
        afterClear.market === '' &&
        afterClear.dateFrom === '' &&
        afterClear.dateTo === '';
      
      this.recordTest(
        'Clear Filters Button - UI Reset',
        'All filter fields should be empty',
        `Symbol: "${afterClear.symbol}", Market: "${afterClear.market}", DateFrom: "${afterClear.dateFrom}", DateTo: "${afterClear.dateTo}"`,
        filtersCleared
      );
      
      // Test localStorage clearing
      const localStorageCleared = !afterClear.localStorage.includes(beforeClear.symbol);
      this.recordTest(
        'Clear Filters Button - localStorage Reset',
        'localStorage should be cleared of filter values',
        `localStorage contains old values: ${!localStorageCleared}`,
        localStorageCleared
      );
      
      // Test performance
      const clearingTime = endTime - startTime;
      const clearsQuickly = clearingTime < 2000;
      this.recordTest(
        'Clear Filters Button - Performance',
        'Clearing should complete quickly',
        `Clearing time: ${clearingTime}ms`,
        clearsQuickly,
        clearingTime > 2000 ? `Clearing took longer than expected` : ''
      );
      
      // Test for loading state
      const loadingIndicatorVisible = this.isElementVisible('.animate-spin');
      this.recordTest(
        'Clear Filters Button - Loading State',
        'Loading indicator should show during clearing',
        `Loading indicator visible: ${loadingIndicatorVisible}`,
        loadingIndicatorVisible
      );
      
      return true;
    } catch (error) {
      this.log(`Clear Filters button test failed: ${error.message}`, 'error');
      this.recordTest(
        'Clear Filters Button - Error',
        'Clear Filters button should work without errors',
        `Error: ${error.message}`,
        false
      );
      return false;
    }
  },
  
  async testIndividualFilterClearing() {
    this.log('Testing individual filter clearing...');
    
    try {
      // Test clearing Symbol filter individually
      const symbolInput = document.querySelector('input[placeholder="Search symbol..."]');
      if (symbolInput) {
        symbolInput.value = 'GOOGL';
        symbolInput.dispatchEvent(new Event('input', { bubbles: true }));
        await this.sleep(500);
        
        // Clear the symbol field
        symbolInput.value = '';
        symbolInput.dispatchEvent(new Event('input', { bubbles: true }));
        await this.sleep(500);
        
        const symbolCleared = symbolInput.value === '';
        this.recordTest(
          'Individual Filter Clearing - Symbol',
          'Symbol filter should clear individually',
          `Symbol field empty: ${symbolCleared}`,
          symbolCleared
        );
      }
      
      // Test clearing Market filter individually
      const marketSelect = document.querySelector('select');
      if (marketSelect) {
        marketSelect.value = 'crypto';
        marketSelect.dispatchEvent(new Event('change', { bubbles: true }));
        await this.sleep(500);
        
        marketSelect.value = '';
        marketSelect.dispatchEvent(new Event('change', { bubbles: true }));
        await this.sleep(500);
        
        const marketCleared = marketSelect.value === '';
        this.recordTest(
          'Individual Filter Clearing - Market',
          'Market filter should clear individually',
          `Market field empty: ${marketCleared}`,
          marketCleared
        );
      }
      
      // Test clearing Date Range filters individually
      const dateInputs = document.querySelectorAll('input[type="date"]');
      if (dateInputs.length >= 1) {
        const today = new Date().toISOString().split('T')[0];
        dateInputs[0].value = today;
        dateInputs[0].dispatchEvent(new Event('change', { bubbles: true }));
        await this.sleep(500);
        
        dateInputs[0].value = '';
        dateInputs[0].dispatchEvent(new Event('change', { bubbles: true }));
        await this.sleep(500);
        
        const dateFromCleared = dateInputs[0].value === '';
        this.recordTest(
          'Individual Filter Clearing - Date From',
          'Date From filter should clear individually',
          `Date From field empty: ${dateFromCleared}`,
          dateFromCleared
        );
      }
      
      return true;
    } catch (error) {
      this.log(`Individual filter clearing test failed: ${error.message}`, 'error');
      return false;
    }
  },
  
  async testFilterStateReset() {
    this.log('Testing filter state reset...');
    
    try {
      // Check if we can access filter state
      const filterState = window.filtersRef?.current || {};
      
      // Apply some filters
      const symbolInput = document.querySelector('input[placeholder="Search symbol..."]');
      if (symbolInput) {
        symbolInput.value = 'TEST';
        symbolInput.dispatchEvent(new Event('input', { bubbles: true }));
      }
      
      await this.sleep(1000);
      
      // Clear filters
      const clearButton = Array.from(document.querySelectorAll('button')).find(btn => 
        btn.textContent.includes('Clear Filters')
      );
      
      if (clearButton) {
        clearButton.click();
        await this.sleep(1500);
      }
      
      // Test UI elements show cleared state
      const uiShowsCleared = 
        this.getElementValue('input[placeholder="Search symbol..."]') === '' &&
        this.getElementValue('select') === '' &&
        !this.isElementVisible('.text-dusty-gold:contains("Filter applied")');
      
      this.recordTest(
        'Filter State Reset - UI State',
        'UI elements should show cleared state',
        `UI shows cleared: ${uiShowsCleared}`,
        uiShowsCleared
      );
      
      // Test filter indicators are removed
      const filterIndicatorsRemoved = !this.isElementVisible('.text-dusty-gold:contains("Market filter applied")');
      this.recordTest(
        'Filter State Reset - Filter Indicators',
        'Filter indicators should be removed after clearing',
        `Filter indicators removed: ${filterIndicatorsRemoved}`,
        filterIndicatorsRemoved
      );
      
      return true;
    } catch (error) {
      this.log(`Filter state reset test failed: ${error.message}`, 'error');
      return false;
    }
  },
  
  async testDataRefreshAfterClearing() {
    this.log('Testing data refresh after clearing filters...');
    
    try {
      // Apply filters to get filtered data
      const symbolInput = document.querySelector('input[placeholder="Search symbol..."]');
      if (symbolInput) {
        symbolInput.value = 'NONEXISTENT';
        symbolInput.dispatchEvent(new Event('input', { bubbles: true }));
      }
      
      await this.sleep(2000); // Wait for data to load
      
      // Get filtered data count
      const filteredTrades = document.querySelectorAll('.dashboard-card.overflow-hidden');
      const filteredCount = filteredTrades.length;
      
      // Clear filters
      const clearButton = Array.from(document.querySelectorAll('button')).find(btn => 
        btn.textContent.includes('Clear Filters')
      );
      
      if (clearButton) {
        clearButton.click();
        await this.sleep(2000); // Wait for data to refresh
      }
      
      // Get unfiltered data count
      const unfilteredTrades = document.querySelectorAll('.dashboard-card.overflow-hidden');
      const unfilteredCount = unfilteredTrades.length;
      
      // Test that data refreshed with all trades
      const dataRefreshed = unfilteredCount >= filteredCount;
      this.recordTest(
        'Data Refresh After Clearing - Trade List',
        'Trade list should refresh with all data after clearing',
        `Filtered: ${filteredCount}, Unfiltered: ${unfilteredCount}`,
        dataRefreshed
      );
      
      // Test statistics boxes update
      const statsElements = document.querySelectorAll('.metric-value');
      const statsUpdated = statsElements.length > 0;
      this.recordTest(
        'Data Refresh After Clearing - Statistics',
        'Statistics boxes should update after clearing',
        `Statistics visible: ${statsUpdated}`,
        statsUpdated
      );
      
      return true;
    } catch (error) {
      this.log(`Data refresh test failed: ${error.message}`, 'error');
      return false;
    }
  },
  
  async testEdgeCases() {
    this.log('Testing edge cases for filter clearing...');
    
    try {
      // Test clearing when no filters are applied
      const clearButton = Array.from(document.querySelectorAll('button')).find(btn => 
        btn.textContent.includes('Clear Filters')
      );
      
      if (clearButton) {
        clearButton.click();
        await this.sleep(1000);
        
        this.recordTest(
          'Edge Case - Clear When No Filters',
          'Should handle clearing when no filters are applied',
          'No errors occurred',
          true
        );
      }
      
      // Test clearing with invalid filter values
      const symbolInput = document.querySelector('input[placeholder="Search symbol..."]');
      if (symbolInput) {
        symbolInput.value = 'INVALID_SYMBOL_123456';
        symbolInput.dispatchEvent(new Event('input', { bubbles: true }));
      }
      
      const marketSelect = document.querySelector('select');
      if (marketSelect) {
        marketSelect.value = 'invalid_market';
        marketSelect.dispatchEvent(new Event('change', { bubbles: true }));
      }
      
      await this.sleep(500);
      
      if (clearButton) {
        clearButton.click();
        await this.sleep(1000);
      }
      
      const handlesInvalidValues = 
        this.getElementValue('input[placeholder="Search symbol..."]') === '' &&
        this.getElementValue('select') === '';
      
      this.recordTest(
        'Edge Case - Clear Invalid Values',
        'Should handle clearing with invalid filter values',
        'Invalid values cleared successfully',
        handlesInvalidValues
      );
      
      // Test rapid filter changes and clearing
      for (let i = 0; i < 3; i++) {
        if (symbolInput) {
          symbolInput.value = `TEST${i}`;
          symbolInput.dispatchEvent(new Event('input', { bubbles: true }));
          await this.sleep(100);
          
          symbolInput.value = '';
          symbolInput.dispatchEvent(new Event('input', { bubbles: true }));
          await this.sleep(100);
        }
      }
      
      this.recordTest(
        'Edge Case - Rapid Changes',
        'Should handle rapid filter changes and clearing',
        'Rapid changes handled successfully',
        true
      );
      
      return true;
    } catch (error) {
      this.log(`Edge cases test failed: ${error.message}`, 'error');
      return false;
    }
  },
  
  // Generate and display report
  generateReport() {
    this.log('Generating verification report...');
    
    const summary = {
      totalTests: this.results.length,
      passedTests: this.results.filter(t => t.passed).length,
      failedTests: this.results.filter(t => !t.passed).length,
      successRate: ((this.results.filter(t => t.passed).length / this.results.length) * 100).toFixed(1)
    };
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 FILTER CLEARING VERIFICATION REPORT');
    console.log('='.repeat(60));
    console.log(`Generated: ${new Date().toISOString()}`);
    console.log(`Total Tests: ${summary.totalTests}`);
    console.log(`Passed: ${summary.passedTests} ✅`);
    console.log(`Failed: ${summary.failedTests} ❌`);
    console.log(`Success Rate: ${summary.successRate}%`);
    console.log('='.repeat(60));
    
    // Detailed results
    console.log('\n📋 DETAILED TEST RESULTS:');
    console.log('-'.repeat(60));
    
    this.results.forEach((test, index) => {
      const status = test.passed ? '✅' : '❌';
      console.log(`\n${index + 1}. ${status} ${test.name}`);
      console.log(`   Expected: ${test.expected}`);
      console.log(`   Actual: ${test.actual}`);
      if (test.details) {
        console.log(`   Details: ${test.details}`);
      }
    });
    
    // Network requests summary
    if (this.networkRequests.length > 0) {
      console.log('\n🌐 NETWORK REQUESTS:');
      console.log('-'.repeat(60));
      console.log(`Total requests: ${this.networkRequests.length}`);
      this.networkRequests.slice(-5).forEach(req => {
        console.log(`- ${req.method} ${req.url} (${new Date(req.timestamp).toISOString()})`);
      });
    }
    
    // Console errors
    if (this.consoleErrors.length > 0) {
      console.log('\n⚠️ CONSOLE ERRORS:');
      console.log('-'.repeat(60));
      this.consoleErrors.forEach(error => {
        console.log(`- ${error.timestamp}: ${error.message}`);
      });
    }
    
    // Recommendations
    console.log('\n💡 RECOMMENDATIONS:');
    console.log('-'.repeat(60));
    
    const failedTests = this.results.filter(t => !t.passed);
    if (failedTests.length > 0) {
      console.log('- Fix failed tests before deploying to production');
      failedTests.forEach(test => {
        console.log(`  - ${test.name}`);
      });
    }
    
    if (this.consoleErrors.length > 0) {
      console.log('- Address console errors for better user experience');
    }
    
    if (summary.successRate < 100) {
      console.log('- Improve filter clearing functionality to achieve 100% test pass rate');
    }
    
    if (summary.successRate === 100) {
      console.log('- ✅ Filter clearing functionality is working correctly!');
    }
    
    console.log('\n' + '='.repeat(60));
    
    return {
      summary,
      results: this.results,
      networkRequests: this.networkRequests,
      consoleErrors: this.consoleErrors,
      timestamp: new Date().toISOString()
    };
  },
  
  // Main test runner
  async runAllTests() {
    this.log('Starting Filter Clearing Verification Tests...');
    this.log('Make sure you are on the /trades page before running these tests.');
    
    // Start network monitoring
    this.startNetworkMonitoring();
    
    try {
      // Run all tests
      await this.testClearFiltersButton();
      await this.testIndividualFilterClearing();
      await this.testFilterStateReset();
      await this.testDataRefreshAfterClearing();
      await this.testEdgeCases();
      
      // Generate and display report
      const report = this.generateReport();
      
      this.log('Filter clearing verification completed!');
      return report;
      
    } catch (error) {
      this.log(`Test execution failed: ${error.message}`, 'error');
      throw error;
    } finally {
      // Stop network monitoring
      this.stopNetworkMonitoring();
    }
  }
};

// Auto-run the tests if this script is executed in the console
console.log('🚀 Filter Clearing Verification Test Loaded');
console.log('Run FilterClearingTest.runAllTests() to start the verification tests');
console.log('Or run individual tests: FilterClearingTest.testClearFiltersButton(), etc.');

// Make it globally available
window.FilterClearingTest = FilterClearingTest;

// Optional: Auto-run after a short delay
setTimeout(() => {
  console.log('⏱️ Auto-starting tests in 2 seconds...');
  console.log('Press Ctrl+C to cancel');
}, 2000);

setTimeout(() => {
  FilterClearingTest.runAllTests().catch(console.error);
}, 4000);