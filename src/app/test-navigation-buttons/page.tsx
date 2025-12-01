'use client';

import { useEffect, useState } from 'react';
import AuthGuard from '@/components/AuthGuard';

export default function NavigationButtonTestPage() {
  const [testResults, setTestResults] = useState<any[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    // Load and run the diagnostic test
    const runDiagnostic = async () => {
      setIsRunning(true);
      
      try {
        // Import and run the diagnostic test
        const diagnosticScript = document.createElement('script');
        diagnosticScript.src = '/navigation-button-diagnostic-test.js';
        diagnosticScript.onload = () => {
          console.log('🔍 Diagnostic script loaded');
          
          // Listen for test results
          const originalLog = console.log;
          const logs: any[] = [];
          
          console.log = (...args) => {
            logs.push(args);
            originalLog.apply(console, args);
            
            // Update results in state
            if (args[0] && args[0].includes('🚨 ISSUE:')) {
              setTestResults(prev => [...prev, { type: 'error', message: args.join(' ') }]);
            } else if (args[0] && args[0].includes('✅')) {
              setTestResults(prev => [...prev, { type: 'success', message: args.join(' ') }]);
            }
          };
          
          // Run tests after a short delay
          setTimeout(() => {
            if (typeof window !== 'undefined' && (window as any).runAllTests) {
              (window as any).runAllTests();
              
              // Restore console.log after tests complete
              setTimeout(() => {
                console.log = originalLog;
                setIsRunning(false);
              }, 3000);
            }
          }, 1000);
        };
        
        document.head.appendChild(diagnosticScript);
      } catch (error) {
        console.error('Failed to load diagnostic script:', error);
        setIsRunning(false);
      }
    };

    // Run diagnostic when component mounts
    if (typeof window !== 'undefined') {
      runDiagnostic();
    }
  }, []);

  return (
    <AuthGuard>
      <div className="min-h-screen bg-primary p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-yellow-600 mb-8">Navigation Button Diagnostic Test</h1>
          
          <div className="mb-8">
            <div className="bg-yellow-900/10 border border-yellow-700/30 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-yellow-600 mb-4">Test Status</h2>
              {isRunning ? (
                <div className="flex items-center gap-3">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-yellow-600"></div>
                  <span>Running diagnostic tests...</span>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 bg-green-600 rounded-full"></div>
                  <span>Diagnostic tests completed</span>
                </div>
              )}
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-xl font-semibold text-yellow-600 mb-4">Test Results</h2>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {testResults.length === 0 && !isRunning && (
                <div className="text-gray-500">No test results available. Check browser console for detailed output.</div>
              )}
              {testResults.map((result, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg border ${
                    result.type === 'error'
                      ? 'bg-red-900/10 border-red-700/30 text-red-400'
                      : 'bg-green-900/10 border-green-700/30 text-green-400'
                  }`}
                >
                  {result.message}
                </div>
              ))}
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-xl font-semibold text-yellow-600 mb-4">Manual Tests</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => {
                  console.log('🧪 Manual test: Mobile menu button clicked');
                  const mobileMenuBtn = document.querySelector('button[aria-label*="menu"]');
                  if (mobileMenuBtn) {
                    (mobileMenuBtn as HTMLElement).click();
                    console.log('✅ Mobile menu button found and clicked');
                  } else {
                    console.log('❌ Mobile menu button not found');
                  }
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
              >
                Test Mobile Menu Button
              </button>
              
              <button
                onClick={() => {
                  console.log('🧪 Manual test: Navigation toggle clicked');
                  const navToggle = document.querySelector('button[aria-label*="navigation"]');
                  if (navToggle) {
                    (navToggle as HTMLElement).click();
                    console.log('✅ Navigation toggle found and clicked');
                  } else {
                    console.log('❌ Navigation toggle not found');
                  }
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
              >
                Test Navigation Toggle
              </button>
              
              <button
                onClick={() => {
                  console.log('🧪 Manual test: Dashboard link clicked');
                  const dashboardLink = document.querySelector('a[href="/dashboard"]');
                  if (dashboardLink) {
                    (dashboardLink as HTMLElement).click();
                    console.log('✅ Dashboard link found and clicked');
                  } else {
                    console.log('❌ Dashboard link not found');
                  }
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
              >
                Test Dashboard Link
              </button>
              
              <button
                onClick={() => {
                  console.log('🧪 Manual test: Reset navigation safety');
                  if (typeof window !== 'undefined' && (window as any).navigationSafety) {
                    (window as any).navigationSafety.resetNavigationSafetyFlags();
                    console.log('✅ Navigation safety flags reset');
                  } else {
                    console.log('❌ Navigation safety not available');
                  }
                }}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
              >
                Reset Navigation Safety
              </button>
            </div>
          </div>

          <div className="bg-yellow-900/10 border border-yellow-700/30 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-yellow-600 mb-4">Instructions</h2>
            <ol className="list-decimal list-inside space-y-2 text-gray-300">
              <li>Open browser developer tools and check the console</li>
              <li>Look for diagnostic output starting with "🔍 NAVIGATION BUTTON DIAGNOSTIC TEST"</li>
              <li>Check for issues marked with "🚨 ISSUE:"</li>
              <li>Try the manual test buttons above</li>
              <li>If navigation safety flags are stuck, use the "Reset Navigation Safety" button</li>
            </ol>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}