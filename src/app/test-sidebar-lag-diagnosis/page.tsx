'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/supabase/client';
import Script from 'next/script';

// Declare global interface for our diagnostic script
declare global {
  interface Window {
    sidebarDiagnostics?: {
      logs: any[];
      analyze: () => {
        totalEvents: number;
        eventCounts: Record<string, number>;
        timingPatterns: Record<string, any>;
      };
    };
  }
}

export default function TestSidebarLagDiagnosisPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [diagnosticLoaded, setDiagnosticLoaded] = useState(false);
  const [testResults, setTestResults] = useState<string[]>([]);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    };
    
    checkAuth();
  }, []);

  const addTestResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`]);
  };

  const runDiagnosticTests = () => {
    if (!window.sidebarDiagnostics) {
      addTestResult('❌ Diagnostic script not loaded');
      return;
    }

    addTestResult('🔍 Starting diagnostic tests...');
    
    // Test 1: Check for excessive RAF calls
    const analysis = window.sidebarDiagnostics.analyze();
    const rafCount = analysis.eventCounts?.['REQUEST_ANIMATION_FRAME'] || 0;
    if (rafCount > 50) {
      addTestResult('⚠️ HIGH: Excessive RAF calls detected');
    } else {
      addTestResult('✅ RAF calls within normal range');
    }

    // Test 2: Check for resize event storms
    const resizeCount = analysis.eventCounts?.['WINDOW_RESIZE'] || 0;
    if (resizeCount > 10) {
      addTestResult('⚠️ HIGH: Resize event storm detected');
    } else {
      addTestResult('✅ Resize events within normal range');
    }

    // Test 3: Check timing patterns
    const bottlenecks = analysis.timingPatterns ? Object.values(analysis.timingPatterns) : [];
    const highRAFCount = bottlenecks.some((pattern: any) => pattern.subsequentRAFs > 10);
    if (highRAFCount) {
      addTestResult('⚠️ HIGH: Performance bottleneck detected in sidebar transitions');
    } else {
      addTestResult('✅ No obvious performance bottlenecks');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Authentication Required</h2>
          <p className="text-white/70">Please <a href="/login" className="text-blue-400 hover:text-blue-300">login</a> to test sidebar lag diagnosis.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Script 
        src="/sidebar-lag-diagnostic.js"
        onLoad={() => {
          setDiagnosticLoaded(true);
          addTestResult('✅ Diagnostic script loaded');
        }}
        onError={() => {
          addTestResult('❌ Failed to load diagnostic script');
        }}
      />
      
      <div className="space-y-8 p-6">
        <h2 className="text-3xl font-bold text-white">Sidebar Lag Diagnosis</h2>
        
        <div className="glass p-6 rounded-xl">
          <h3 className="text-xl font-semibold mb-4 text-white">Diagnostic Status</h3>
          <div className="space-y-2">
            <p className="text-white/80">
              <span className="font-medium">User:</span> {user.email}
            </p>
            <p className="text-white/80">
              <span className="font-medium">Diagnostic Script:</span> 
              <span className={`ml-2 px-2 py-1 rounded text-sm ${diagnosticLoaded ? 'bg-green-600/20 text-green-300' : 'bg-red-600/20 text-red-300'}`}>
                {diagnosticLoaded ? 'Loaded' : 'Not Loaded'}
              </span>
            </p>
          </div>
        </div>

        <div className="glass p-6 rounded-xl">
          <h3 className="text-xl font-semibold mb-4 text-white">Test Instructions</h3>
          <ol className="list-decimal list-inside space-y-2 text-white/80">
            <li>Wait for diagnostic script to load (status above should show "Loaded")</li>
            <li>Click the "Start Monitoring" button below</li>
            <li>Toggle the sidebar (click chevron button in sidebar header) 2-3 times</li>
            <li>Observe the charts (Emotional Patterns radar and P&L Performance) for lag</li>
            <li>Click "Analyze Results" to see diagnostic findings</li>
            <li>Check browser console for detailed timing logs</li>
          </ol>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="glass p-6 rounded-xl">
            <h3 className="text-xl font-semibold mb-4 text-white">Diagnostic Controls</h3>
            <div className="space-y-4">
              <button
                onClick={() => {
                  if (diagnosticLoaded) {
                    addTestResult('🔍 Monitoring started - toggle sidebar now');
                    console.log('🔍 [USER ACTION] Sidebar monitoring started');
                  } else {
                    addTestResult('❌ Please wait for diagnostic script to load');
                  }
                }}
                className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                disabled={!diagnosticLoaded}
              >
                Start Monitoring
              </button>
              
              <button
                onClick={runDiagnosticTests}
                className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                disabled={!diagnosticLoaded}
              >
                Analyze Results
              </button>
              
              <button
                onClick={() => {
                  setTestResults([]);
                  if (window.sidebarDiagnostics) {
                    window.sidebarDiagnostics.logs = [];
                  }
                  addTestResult('🔄 Results cleared');
                }}
                className="w-full px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
              >
                Clear Results
              </button>
            </div>
          </div>

          <div className="glass p-6 rounded-xl">
            <h3 className="text-xl font-semibold mb-4 text-white">Expected Findings</h3>
            <div className="space-y-2 text-sm text-white/70">
              <p>🔍 <strong>Normal Operation:</strong> 5-15 RAF calls per sidebar toggle</p>
              <p>🔍 <strong>Problem Detected:</strong> 50+ RAF calls per toggle</p>
              <p>🔍 <strong>Normal Resizes:</strong> 1-3 resize events per toggle</p>
              <p>🔍 <strong>Problem Detected:</strong> 10+ resize events per toggle</p>
              <p>🔍 <strong>Lag Indicator:</strong> Sequential instead of parallel animations</p>
            </div>
          </div>
        </div>

        <div className="glass p-6 rounded-xl">
          <h3 className="text-xl font-semibold mb-4 text-white">Diagnostic Results</h3>
          <div className="bg-black/30 rounded-lg p-4 h-64 overflow-y-auto font-mono text-sm">
            {testResults.length === 0 ? (
              <p className="text-white/50">No test results yet. Follow the instructions above.</p>
            ) : (
              testResults.map((result, index) => (
                <div key={index} className="text-green-300 mb-1">
                  {result}
                </div>
              ))
            )}
          </div>
        </div>

        <div className="glass p-6 rounded-xl">
          <h3 className="text-xl font-semibold mb-4 text-white">Manual Validation</h3>
          <div className="space-y-4">
            <div className="border-l-4 border-blue-500 pl-4">
              <h4 className="font-medium text-white mb-2">Test 1: Visual Lag Detection</h4>
              <p className="text-white/70 text-sm">Toggle sidebar and observe if charts lag behind the sidebar animation.</p>
            </div>
            <div className="border-l-4 border-green-500 pl-4">
              <h4 className="font-medium text-white mb-2">Test 2: Timing Measurement</h4>
              <p className="text-white/70 text-sm">Count seconds between sidebar start and chart completion.</p>
            </div>
            <div className="border-l-4 border-purple-500 pl-4">
              <h4 className="font-medium text-white mb-2">Test 3: Browser DevTools</h4>
              <p className="text-white/70 text-sm">Check Performance tab for excessive layout thrashing during transitions.</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}