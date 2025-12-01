'use client';

import { useEffect, useState } from 'react';
import Script from 'next/script';

export default function SidebarFixVerificationPage() {
  const [testResults, setTestResults] = useState<any>(null);
  const [isRunningTest, setIsRunningTest] = useState(false);

  const runComprehensiveTest = () => {
    setIsRunningTest(true);
    
    setTimeout(() => {
      const sidebar = document.querySelector('aside');
      if (!sidebar) {
        setTestResults({
          success: false,
          error: 'No sidebar element found'
        });
        setIsRunningTest(false);
        return;
      }

      // Test 1: Check if sidebar is visible when collapsed
      const hasCollapsedClass = sidebar.classList.contains('collapsed');
      const computedStyle = window.getComputedStyle(sidebar);
      const rect = sidebar.getBoundingClientRect();
      
      const isVisible = rect.width > 0 && rect.height > 0 && rect.left >= 0;
      const transform = computedStyle.transform;
      const width = computedStyle.width;
      
      // Test 2: Check toggle button
      const toggleButton = document.querySelector('button[aria-label*="sidebar"], button[title*="sidebar"]');
      const toggleVisible = toggleButton && window.getComputedStyle(toggleButton).display !== 'none';
      
      // Test 3: Check if sidebar can be expanded
      let expandTestPassed = false;
      if (toggleVisible && hasCollapsedClass) {
        try {
          (toggleButton as HTMLButtonElement).click();
          setTimeout(() => {
            const isNowExpanded = !sidebar.classList.contains('collapsed');
            expandTestPassed = isNowExpanded;
          }, 300);
        } catch (error) {
          console.error('Toggle test failed:', error);
        }
      }
      
      // Test 4: Check if sidebar can be collapsed again
      let collapseTestPassed = false;
      setTimeout(() => {
        if (expandTestPassed && toggleVisible) {
          try {
            (toggleButton as HTMLButtonElement).click();
            setTimeout(() => {
              const isNowCollapsed = sidebar.classList.contains('collapsed');
              collapseTestPassed = isNowCollapsed;
            }, 300);
          } catch (error) {
            console.error('Collapse test failed:', error);
          }
        }
      }, 1000);
      
      // Final results
      setTimeout(() => {
        const allTestsPassed = isVisible && toggleVisible && expandTestPassed && collapseTestPassed;
        
        setTestResults({
          sidebarVisible: isVisible,
          sidebarWidth: width,
          sidebarTransform: transform,
          toggleButtonVisible: toggleVisible,
          expandTestPassed,
          collapseTestPassed,
          allTestsPassed,
          success: allTestsPassed,
          details: {
            collapsedClass: hasCollapsedClass,
            boundingRect: {
              x: rect.x,
              y: rect.y,
              width: rect.width,
              height: rect.height,
              left: rect.left
            }
          }
        });
        setIsRunningTest(false);
      }, 2000);
    }, 100);
  };

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-center">Sidebar Fix Verification</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Test Instructions */}
          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
            <h2 className="text-2xl font-semibold mb-4 text-amber-400">Test Instructions</h2>
            <ol className="list-decimal list-inside space-y-3 text-gray-300">
              <li>Open browser DevTools (F12)</li>
              <li>Go to Console tab</li>
              <li>Navigate to any authenticated page (e.g., /dashboard)</li>
              <li>Click "Run Comprehensive Test" button below</li>
              <li>Wait for test to complete (3-4 seconds)</li>
              <li>Check results for pass/fail status</li>
            </ol>
            
            <div className="mt-6 p-4 bg-gray-900 rounded-lg">
              <h3 className="text-lg font-semibold mb-2 text-amber-300">Expected Behavior After Fix</h3>
              <ul className="list-disc list-inside space-y-2 text-sm text-gray-300">
                <li>✅ Sidebar should be visible when collapsed (80px width)</li>
                <li>✅ Toggle button should be accessible</li>
                <li>✅ Sidebar should expand/collapse smoothly</li>
                <li>✅ No CSS transform hiding the sidebar</li>
              </ul>
            </div>
          </div>

          {/* Test Results */}
          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
            <h2 className="text-2xl font-semibold mb-4 text-amber-400">Test Results</h2>
            
            {isRunningTest && (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-amber-400"></div>
                <p className="mt-4 text-gray-400">Running comprehensive test...</p>
              </div>
            )}
            
            {!isRunningTest && !testResults && (
              <div className="text-center py-8">
                <p className="text-gray-400 mb-4">Click "Run Comprehensive Test" to start verification</p>
              </div>
            )}
            
            {testResults && (
              <div className="space-y-4">
                <div className={`p-4 rounded-lg border ${
                  testResults.success ? 'bg-green-900/20 border-green-600' : 'bg-red-900/20 border-red-600'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold">
                      {testResults.success ? '✅ TEST PASSED' : '❌ TEST FAILED'}
                    </h3>
                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                      testResults.success ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
                    }`}>
                      {testResults.success ? 'SUCCESS' : 'FAILED'}
                    </span>
                  </div>
                </div>
                
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Sidebar Visible:</span>
                    <span className={testResults.sidebarVisible ? 'text-green-400' : 'text-red-400'}>
                      {testResults.sidebarVisible ? '✅ YES' : '❌ NO'}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-400">Sidebar Width:</span>
                    <span className="text-gray-300">{testResults.sidebarWidth}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-400">Transform:</span>
                    <span className="text-gray-300 font-mono">{testResults.sidebarTransform}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-400">Toggle Button:</span>
                    <span className={testResults.toggleButtonVisible ? 'text-green-400' : 'text-red-400'}>
                      {testResults.toggleButtonVisible ? '✅ VISIBLE' : '❌ HIDDEN'}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-400">Expand/Collapse:</span>
                    <span className={testResults.expandTestPassed && testResults.collapseTestPassed ? 'text-green-400' : 'text-red-400'}>
                      {testResults.expandTestPassed && testResults.collapseTestPassed ? '✅ WORKING' : '❌ BROKEN'}
                    </span>
                  </div>
                </div>
                
                {testResults.details && (
                  <div className="mt-4 p-3 bg-gray-900 rounded text-xs">
                    <h4 className="font-semibold mb-2 text-gray-300">Technical Details:</h4>
                    <pre className="text-gray-400 overflow-x-auto">
{JSON.stringify(testResults.details, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Fix Summary */}
        <div className="mt-8 bg-gray-800 p-6 rounded-xl border border-gray-700">
          <h2 className="text-2xl font-semibold mb-4 text-amber-400">Fix Summary</h2>
          <div className="space-y-3 text-gray-300">
            <p><strong>Problem:</strong> Sidebar was hidden when collapsed due to CSS transform issue</p>
            <p><strong>Root Cause:</strong> <code className="bg-gray-700 px-1 rounded">translateX(-100%)</code> was applied even when collapsed</p>
            <p><strong>Solution Applied:</strong></p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>Fixed CSS: <code className="bg-gray-700 px-1 rounded">transform: translateX(0)</code> for collapsed sidebar</li>
              <li>Fixed state logic: Sidebar now always visible on desktop</li>
              <li>Fixed toggle logic: Properly handles collapsed vs overlay states</li>
              <li>Fixed initial state: Sidebar starts collapsed by default</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}