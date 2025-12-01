'use client';

import { useEffect, useState } from 'react';
import Script from 'next/script';

interface TestResult {
  issue: string;
  severity: string;
  description: string;
}

export default function SidebarCollapseValidationPage() {
  const [testResults, setTestResults] = useState<TestResult | null>(null);
  const [fixApplied, setFixApplied] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Listen for test results from the validation script
    const handleTestResult = (event: CustomEvent) => {
      setTestResults(event.detail);
      setIsLoading(false);
    };

    window.addEventListener('sidebarTestResult', handleTestResult as EventListener);
    
    // Listen for fix applied event
    const handleFixApplied = (event: CustomEvent) => {
      setFixApplied(event.detail.success);
    };

    window.addEventListener('sidebarFixApplied', handleFixApplied as EventListener);

    return () => {
      window.removeEventListener('sidebarTestResult', handleTestResult as EventListener);
      window.removeEventListener('sidebarFixApplied', handleFixApplied as EventListener);
    };
  }, []);

  const runManualTest = () => {
    // Access the global test result from the validation script
    const result = (window as any).sidebarTestResult;
    if (result) {
      setTestResults(result);
      setIsLoading(false);
    }
  };

  const applyManualFix = () => {
    const sidebar = document.querySelector('aside');
    if (sidebar) {
      sidebar.style.setProperty('transform', 'translateX(0)', 'important');
      setFixApplied(true);
      
      // Check if fix worked
      setTimeout(() => {
        const rect = sidebar.getBoundingClientRect();
        const isNowVisible = rect.left >= 0;
        setFixApplied(isNowVisible);
      }, 100);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-center">Sidebar Collapse Validation Test</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Test Instructions */}
          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
            <h2 className="text-2xl font-semibold mb-4 text-amber-400">Test Instructions</h2>
            <ol className="list-decimal list-inside space-y-3 text-gray-300">
              <li>Open browser DevTools (F12)</li>
              <li>Go to Console tab</li>
              <li>Navigate to any authenticated page (e.g., /dashboard)</li>
              <li>Wait for validation script to run (2 seconds)</li>
              <li>Check console output for detailed analysis</li>
              <li>Look at results below for automated diagnosis</li>
            </ol>
            
            <div className="mt-6 p-4 bg-gray-900 rounded-lg">
              <h3 className="text-lg font-semibold mb-2 text-amber-400">Expected Behavior</h3>
              <ul className="list-disc list-inside space-y-2 text-sm text-gray-300">
                <li>Collapsed sidebar should be visible (80px width)</li>
                <li>Should show only icons, no text</li>
                <li>Toggle button should be accessible</li>
                <li>Sidebar should NOT be completely hidden</li>
              </ul>
            </div>
          </div>

          {/* Test Results */}
          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
            <h2 className="text-2xl font-semibold mb-4 text-amber-400">Test Results</h2>
            
            {isLoading && (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-amber-400"></div>
                <p className="mt-4 text-gray-400">Running validation test...</p>
              </div>
            )}
            
            {!isLoading && !testResults && (
              <div className="text-center py-8">
                <p className="text-gray-400 mb-4">Test completed but no results captured</p>
                <button 
                  onClick={runManualTest}
                  className="px-4 py-2 bg-amber-600 text-black rounded-lg hover:bg-amber-500 transition-colors"
                >
                  Check Results Manually
                </button>
              </div>
            )}
            
            {testResults && (
              <div className="space-y-4">
                <div className={`p-4 rounded-lg border ${
                  testResults.severity === 'HIGH' ? 'bg-red-900/20 border-red-600' :
                  testResults.severity === 'MEDIUM' ? 'bg-yellow-900/20 border-yellow-600' :
                  testResults.severity === 'OK' ? 'bg-green-900/20 border-green-600' :
                  'bg-gray-900/20 border-gray-600'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold">Issue: {testResults.issue}</h3>
                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                      testResults.severity === 'HIGH' ? 'bg-red-600 text-white' :
                      testResults.severity === 'MEDIUM' ? 'bg-yellow-600 text-black' :
                      testResults.severity === 'OK' ? 'bg-green-600 text-white' :
                      'bg-gray-600 text-white'
                    }`}>
                      {testResults.severity}
                    </span>
                  </div>
                  <p className="text-gray-300">{testResults.description}</p>
                </div>
                
                {testResults.issue === 'CSS_TRANSFORM_HIDDEN' && (
                  <div className="mt-4">
                    <button 
                      onClick={applyManualFix}
                      className="w-full px-4 py-3 bg-amber-600 text-black rounded-lg hover:bg-amber-500 transition-colors font-semibold"
                    >
                      {fixApplied ? 'Fix Applied ✅' : 'Apply CSS Fix'}
                    </button>
                    {fixApplied && (
                      <p className="mt-2 text-green-400 text-sm">✅ Sidebar transform has been fixed!</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Technical Details */}
        <div className="mt-8 bg-gray-800 p-6 rounded-xl border border-gray-700">
          <h2 className="text-2xl font-semibold mb-4 text-amber-400">Technical Analysis</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold mb-3 text-amber-300">Root Cause Analysis</h3>
              <div className="space-y-2 text-sm text-gray-300">
                <p><strong>Primary Issue:</strong> CSS Transform Conflict</p>
                <p>The sidebar gets <code className="bg-gray-700 px-1 rounded">translateX(-100%)</code> when collapsed, which moves it completely off-screen.</p>
                <p>Expected: <code className="bg-gray-700 px-1 rounded">translateX(0)</code> to keep it visible at left edge.</p>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-3 text-amber-300">CSS Problem Location</h3>
              <div className="bg-gray-900 p-3 rounded text-sm overflow-x-auto">
                <pre className="text-green-400">
{`/* File: verotrade-design-system.css, Line 305 */
.verotrade-sidebar.collapsed {
  width: 80px;
  transform: translateX(-100%); /* ← PROBLEM: Hides sidebar */
}`}
                </pre>
              </div>
            </div>
          </div>
        </div>

        {/* Next Steps */}
        <div className="mt-8 bg-gray-800 p-6 rounded-xl border border-gray-700">
          <h2 className="text-2xl font-semibold mb-4 text-amber-400">Next Steps</h2>
          <div className="space-y-3 text-gray-300">
            <p>1. <strong>Validation:</strong> The test script will automatically detect the CSS transform issue</p>
            <p>2. <strong>Auto-Fix:</strong> If detected, script attempts to apply inline style override</p>
            <p>3. <strong>Manual Fix:</strong> Use "Apply CSS Fix" button if auto-fix doesn't work</p>
            <p>4. <strong>Permanent Fix:</strong> Update the CSS file to use correct transform value</p>
          </div>
        </div>
      </div>

      <Script
        src="/test-sidebar-collapse-validation.js"
        strategy="afterInteractive"
        onLoad={() => {
          console.log('🧪 Validation script loaded');
        }}
        onError={() => {
          setTestResults({
            issue: 'SCRIPT_LOAD_ERROR',
            severity: 'HIGH',
            description: 'Failed to load validation script'
          });
          setIsLoading(false);
        }}
      />
    </div>
  );
}