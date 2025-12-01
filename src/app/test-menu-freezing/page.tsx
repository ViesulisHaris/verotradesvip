'use client';

import { useEffect, useState } from 'react';

export default function TestMenuFreezingPage() {
  const [testResults, setTestResults] = useState<any>(null);
  const [isRunning, setIsRunning] = useState(false);

  const runDiagnosticTest = async () => {
    setIsRunning(true);
    
    try {
      // Load and run the diagnostic script
      const script = document.createElement('script');
      script.src = '/menu-freezing-diagnostic-test.js';
      script.onload = () => {
        // Script loaded, wait for results
        setTimeout(() => {
          const results = localStorage.getItem('menu-freezing-diagnostic-report');
          if (results) {
            setTestResults(JSON.parse(results));
          }
          setIsRunning(false);
        }, 10000); // Wait 10 seconds for tests to complete
      };
      document.head.appendChild(script);
    } catch (error) {
      console.error('Failed to run diagnostic test:', error);
      setIsRunning(false);
    }
  };

  return (
    <div className="min-h-screen bg-primary p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gold mb-6">Menu Freezing Diagnostic Test</h1>
        
        <div className="card-luxury p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Test Instructions</h2>
          <ol className="list-decimal list-inside space-y-2 text-primary">
            <li>Click "Run Diagnostic Test" below</li>
            <li>The test will automatically navigate to different pages</li>
            <li>It will check for menu freezing issues</li>
            <li>Results will appear below when complete</li>
          </ol>
          
          <button
            onClick={runDiagnosticTest}
            disabled={isRunning}
            className="btn-primary mt-4 disabled:opacity-50"
          >
            {isRunning ? 'Running Tests...' : 'Run Diagnostic Test'}
          </button>
        </div>

        {isRunning && (
          <div className="card-luxury p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Test Status</h2>
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gold"></div>
              <span>Running comprehensive menu freezing diagnostic tests...</span>
            </div>
            <p className="text-sm text-secondary mt-2">
              This may take up to 30 seconds. The test will automatically navigate through the application.
            </p>
          </div>
        )}

        {testResults && (
          <div className="card-luxury p-6">
            <h2 className="text-xl font-semibold mb-4">Test Results</h2>
            
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-2">Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-elevated rounded">
                  <div className="text-2xl font-bold text-gold">{testResults.summary.totalTests}</div>
                  <div className="text-sm text-secondary">Total Tests</div>
                </div>
                <div className="p-4 bg-elevated rounded">
                  <div className="text-2xl font-bold text-success">{testResults.summary.passed}</div>
                  <div className="text-sm text-secondary">Passed</div>
                </div>
                <div className="p-4 bg-elevated rounded">
                  <div className="text-2xl font-bold text-error">{testResults.summary.failed}</div>
                  <div className="text-sm text-secondary">Failed</div>
                </div>
              </div>
            </div>

            {testResults.summary.failed > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-2 text-error">Critical Issues Found</h3>
                <div className="space-y-2">
                  {testResults.testResults.navigationTests?.filter((t: any) => !t.success).map((test: any, index: number) => (
                    <div key={index} className="p-3 bg-error-subtle rounded border border-error/30">
                      <div className="font-medium">{test.testName}</div>
                      <div className="text-sm text-secondary">{test.error || 'Navigation blocked'}</div>
                      {test.navigationBlocked && <div className="text-sm text-error">⚠️ Navigation appears to be blocked</div>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mb-6">
              <h3 className="text-lg font-medium mb-2">Likely Root Causes</h3>
              <div className="space-y-2">
                {testResults.summary.likelyCauses.blockingOverlays && (
                  <div className="p-3 bg-warning-subtle rounded border border-warning/30">
                    <div className="font-medium">🎭 Blocking Overlays/Modals</div>
                    <div className="text-sm text-secondary">Overlays with high z-index are blocking navigation</div>
                  </div>
                )}
                {testResults.summary.likelyCauses.blockedElements && (
                  <div className="p-3 bg-warning-subtle rounded border border-warning/30">
                    <div className="font-medium">👂 Blocked Event Listeners</div>
                    <div className="text-sm text-secondary">Navigation elements have blocked pointer events</div>
                  </div>
                )}
                {testResults.summary.likelyCauses.highZIndex && (
                  <div className="p-3 bg-warning-subtle rounded border border-warning/30">
                    <div className="font-medium">🎨 High Z-Index Elements</div>
                    <div className="text-sm text-secondary">Elements with high z-index are interfering with navigation</div>
                  </div>
                )}
                {testResults.summary.likelyCauses.navigationIssues && (
                  <div className="p-3 bg-warning-subtle rounded border border-warning/30">
                    <div className="font-medium">🧭 Navigation System Issues</div>
                    <div className="text-sm text-secondary">Direct navigation failures detected</div>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6">
              <button
                onClick={() => {
                  const dataStr = JSON.stringify(testResults, null, 2);
                  const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
                  const exportFileDefaultName = `menu-freezing-diagnostic-${new Date().toISOString().split('T')[0]}.json`;
                  const linkElement = document.createElement('a');
                  linkElement.setAttribute('href', dataUri);
                  linkElement.setAttribute('download', exportFileDefaultName);
                  linkElement.click();
                }}
                className="btn-secondary"
              >
                Download Full Report
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}