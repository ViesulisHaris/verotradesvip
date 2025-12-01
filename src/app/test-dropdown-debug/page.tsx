'use client';

import React, { useState, useEffect } from 'react';

export default function DropdownDebugTest() {
  const [testResults, setTestResults] = useState<any[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const addTestResult = (testName: string, result: any) => {
    setTestResults(prev => [...prev, { testName, result, timestamp: new Date().toISOString() }]);
  };

  const testDropdownStyling = () => {
    setIsRunning(true);
    
    // Test 1: Check if dropdown-enhanced class exists
    const dropdownElements = document.querySelectorAll('.dropdown-enhanced');
    addTestResult('Dropdown Elements Found', {
      count: dropdownElements.length,
      elements: Array.from(dropdownElements).map(el => ({
        tagName: el.tagName,
        className: el.className,
        id: el.id
      }))
    });

    // Test 2: Check computed styles for dropdown container
    dropdownElements.forEach((dropdown, index) => {
      const styles = window.getComputedStyle(dropdown);
      addTestResult(`Dropdown ${index} Container Styles`, {
        backgroundColor: styles.backgroundColor,
        color: styles.color,
        backdropFilter: styles.backdropFilter,
        zIndex: styles.zIndex,
        position: styles.position,
        border: styles.border,
        borderRadius: styles.borderRadius
      });
    });

    // Test 3: Check option elements styling
    const allOptions = document.querySelectorAll('.dropdown-enhanced option');
    addTestResult('Option Elements Found', {
      count: allOptions.length,
      elements: Array.from(allOptions).map((option, index) => {
        const styles = window.getComputedStyle(option);
        return {
          index,
          value: (option as HTMLOptionElement).value,
          text: option.textContent,
          backgroundColor: styles.backgroundColor,
          color: styles.color,
          visibility: styles.visibility,
          display: styles.display,
          padding: styles.padding,
          fontSize: styles.fontSize
        };
      })
    });

    // Test 4: Check browser support for option styling
    const testOption = document.createElement('option');
    testOption.style.backgroundColor = 'red';
    testOption.style.color = 'blue';
    testOption.style.padding = '20px';
    document.body.appendChild(testOption);
    const computedTest = window.getComputedStyle(testOption);
    addTestResult('Browser Option Styling Support', {
      originalBg: 'red',
      computedBg: computedTest.backgroundColor,
      originalColor: 'blue',
      computedColor: computedTest.color,
      originalPadding: '20px',
      computedPadding: computedTest.padding,
      bgApplied: computedTest.backgroundColor.includes('red') || computedTest.backgroundColor.includes('255, 0, 0'),
      colorApplied: computedTest.color.includes('blue') || computedTest.color.includes('0, 0, 255'),
      paddingApplied: computedTest.padding !== '0px'
    });
    document.body.removeChild(testOption);

    // Test 5: Check if CSS variables are applied
    const rootStyles = window.getComputedStyle(document.documentElement);
    addTestResult('CSS Variables Check', {
      hasInterFont: rootStyles.fontFamily.includes('Inter'),
      bodyBg: window.getComputedStyle(document.body).background,
      bodyColor: window.getComputedStyle(document.body).color
    });

    // Test 6: Test dropdown visibility by simulating focus
    const firstDropdown = dropdownElements[0] as HTMLSelectElement;
    if (firstDropdown) {
      firstDropdown.focus();
      setTimeout(() => {
        const options = firstDropdown.options;
        const optionData = Array.from(options).map((option, index) => {
          const styles = window.getComputedStyle(option);
          return {
            index,
            text: option.textContent,
            visible: styles.visibility !== 'hidden',
            displayed: styles.display !== 'none',
            bgColor: styles.backgroundColor,
            textColor: styles.color,
            contrast: styles.backgroundColor === styles.color ? 'POOR' : 'GOOD'
          };
        });
        addTestResult('Dropdown Options Visibility Test', optionData);
        setIsRunning(false);
      }, 100);
    } else {
      setIsRunning(false);
    }
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Dropdown Debug Test Page</h1>
        
        <div className="mb-8">
          <button
            onClick={testDropdownStyling}
            disabled={isRunning}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-6 py-3 rounded-lg mr-4"
          >
            {isRunning ? 'Running Tests...' : 'Run Dropdown Tests'}
          </button>
          <button
            onClick={clearResults}
            className="bg-red-600 hover:bg-red-700 px-6 py-3 rounded-lg"
          >
            Clear Results
          </button>
        </div>

        {/* Test Dropdowns */}
        <div className="mb-8 p-6 bg-gray-800 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Test Dropdowns</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Market Dropdown</label>
              <select className="dropdown-enhanced w-full px-4 py-3">
                <option value="">All Markets</option>
                <option value="Stock">Stock</option>
                <option value="Crypto">Crypto</option>
                <option value="Forex">Forex</option>
                <option value="Futures">Futures</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Strategy Dropdown</label>
              <select className="dropdown-enhanced w-full px-4 py-3">
                <option value="">All Strategies</option>
                <option value="strategy1">Strategy 1</option>
                <option value="strategy2">Strategy 2</option>
                <option value="strategy3">Strategy 3</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Side Dropdown</label>
              <select className="dropdown-enhanced w-full px-4 py-3">
                <option value="">All Sides</option>
                <option value="Buy">Buy</option>
                <option value="Sell">Sell</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Sort Dropdown</label>
              <select className="dropdown-enhanced w-full px-4 py-3">
                <option value="">Default</option>
                <option value="trade_date-asc">Date (Oldest)</option>
                <option value="trade_date-desc">Date (Newest)</option>
                <option value="pnl-desc">P&L (High to Low)</option>
                <option value="pnl-asc">P&L (Low to High)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Test Results */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Test Results</h2>
          
          {testResults.length === 0 ? (
            <p className="text-gray-400">No tests run yet. Click "Run Dropdown Tests" to start.</p>
          ) : (
            <div className="space-y-4">
              {testResults.map((result, index) => (
                <div key={index} className="bg-gray-700 rounded p-4">
                  <h3 className="font-semibold mb-2">{result.testName}</h3>
                  <pre className="text-sm text-gray-300 overflow-x-auto">
                    {JSON.stringify(result.result, null, 2)}
                  </pre>
                  <p className="text-xs text-gray-500 mt-2">{result.timestamp}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Manual Testing Instructions */}
        <div className="mt-8 bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Manual Testing Instructions</h2>
          <ol className="list-decimal list-inside space-y-2 text-gray-300">
            <li>Click on each dropdown above to open it</li>
            <li>Observe if the options are visible or appear white/invisible</li>
            <li>Check if you can hover over and select options</li>
            <li>Note any differences between browsers</li>
            <li>Run the automated tests and review the results</li>
          </ol>
        </div>
      </div>
    </div>
  );
}