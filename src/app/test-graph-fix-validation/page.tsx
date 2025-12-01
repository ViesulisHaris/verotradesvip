'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function GraphFixValidationPage() {
  const router = useRouter();
  const [testResults, setTestResults] = useState<any>(null);
  const [isRunning, setIsRunning] = useState(false);

  const runValidation = async () => {
    setIsRunning(true);
    
    try {
      // Import and run the comprehensive test
      const { runComprehensiveTest, runRapidToggleTest } = await import('../../../graph-glitching-test-comprehensive.js');
      
      // Run comprehensive test
      const comprehensiveResults = await runComprehensiveTest();
      
      // Run rapid toggle test
      const rapidToggleResults = await runRapidToggleTest();
      
      // Type guard to ensure comprehensiveResults has the expected structure
      const overall = (comprehensiveResults as any)?.overall || {};
      const timingConsistency = (comprehensiveResults as any)?.timingConsistency || {};
      const visualGlitching = (comprehensiveResults as any)?.visualGlitching || {};
      const responsiveness = (comprehensiveResults as any)?.responsiveness || {};
      
      const combinedResults = {
        comprehensive: comprehensiveResults,
        rapidToggle: rapidToggleResults,
        timestamp: new Date().toISOString(),
        summary: {
          overallStatus: overall?.status || 'UNKNOWN',
          timingConsistency: timingConsistency?.isConsistent || false,
          visualGlitching: !visualGlitching?.hasGlitching,
          responsiveness: responsiveness?.isResponsive || false,
          issuesDetected: overall?.issues || []
        }
      };
      
      setTestResults(combinedResults);
      
      // Log results to console
      console.log('🧪 [VALIDATION COMPLETE] Graph glitching fix validation results:', combinedResults);
      
    } catch (error) {
      console.error('🧪 [VALIDATION ERROR] Failed to run validation:', error);
      setTestResults({
        error: (error as Error)?.message || 'Unknown error',
        timestamp: new Date().toISOString()
      });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-4">Graph Glitching Fix Validation</h1>
          <p className="text-white/70 mb-8">
            This page validates the comprehensive fix for graph glitching during menu transitions.
            It tests timing consistency, visual stability, and responsiveness across all chart components.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Test Controls */}
          <div className="glass p-6 rounded-xl">
            <h2 className="text-xl font-semibold mb-4 text-white">Test Controls</h2>
            
            <button
              onClick={runValidation}
              disabled={isRunning}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 disabled:opacity-50"
            >
              {isRunning ? 'Running Validation...' : 'Run Comprehensive Validation'}
            </button>

            <div className="mt-6 space-y-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="w-full bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
              >
                Go to Dashboard
              </button>
              
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
              >
                Reload Page
              </button>
            </div>
          </div>

          {/* Test Results */}
          <div className="glass p-6 rounded-xl">
            <h2 className="text-xl font-semibold mb-4 text-white">Validation Results</h2>
            
            {testResults ? (
              <div className="space-y-6">
                {/* Overall Status */}
                <div className="border border-white/20 rounded-lg p-4">
                  <h3 className="text-lg font-medium mb-2 text-white">Overall Status</h3>
                  <div className={`text-2xl font-bold ${
                    testResults.summary?.overallStatus === 'PASS' ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {testResults.summary?.overallStatus || 'UNKNOWN'}
                  </div>
                  
                  <div className="mt-4 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-white/70">Timing Consistency:</span>
                      <span className={testResults.summary?.timingConsistency ? 'text-green-400' : 'text-red-400'}>
                        {testResults.summary?.timingConsistency ? 'PASS' : 'FAIL'}
                      </span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-white/70">Visual Glitching:</span>
                      <span className={testResults.summary?.visualGlitching ? 'text-green-400' : 'text-red-400'}>
                        {testResults.summary?.visualGlitching ? 'PASS' : 'FAIL'}
                      </span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-white/70">Responsiveness:</span>
                      <span className={testResults.summary?.responsiveness ? 'text-green-400' : 'text-red-400'}>
                        {testResults.summary?.responsiveness ? 'PASS' : 'FAIL'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Issues Detected */}
                {testResults.summary?.issuesDetected && testResults.summary.issuesDetected.length > 0 && (
                  <div className="border border-red-500/20 rounded-lg p-4">
                    <h3 className="text-lg font-medium mb-2 text-red-400">Issues Detected</h3>
                    <ul className="space-y-2 text-sm text-red-300">
                      {testResults.summary.issuesDetected.map((issue: string, index: number) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-red-400">⚠️</span>
                          <span>{issue}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Detailed Results */}
                <div className="border border-white/20 rounded-lg p-4">
                  <h3 className="text-lg font-medium mb-4 text-white">Detailed Results</h3>
                  
                  {/* Timing Consistency */}
                  <div className="mb-6">
                    <h4 className="text-md font-medium mb-2 text-blue-300">Timing Consistency</h4>
                    <div className="text-sm text-white/80 space-y-1">
                      <div>Debounce Target: 50ms</div>
                      <div>Animation Target: 300ms</div>
                      <div>Sidebar Transition: 300ms</div>
                      {testResults.comprehensive?.timingConsistency?.measurements && (
                        <div>Measurements: {testResults.comprehensive.timingConsistency.measurements.length} events captured</div>
                      )}
                    </div>
                  </div>

                  {/* Visual Glitching */}
                  <div className="mb-6">
                    <h4 className="text-md font-medium mb-2 text-blue-300">Visual Glitching</h4>
                    <div className="text-sm text-white/80 space-y-1">
                      {testResults.comprehensive?.visualGlitching?.hasGlitching ? (
                        <div className="text-red-300">
                          <div>Glitching Detected: YES</div>
                          <div>Max Delta: {testResults.comprehensive.visualGlitching.maxDelta}px</div>
                          <div>Glitch Events: {testResults.comprehensive.visualGlitching.glitchEvents.length}</div>
                        </div>
                      ) : (
                        <div className="text-green-300">
                          <div>Glitching Detected: NO</div>
                          <div>All charts remained stable during transitions</div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Responsiveness */}
                  <div className="mb-6">
                    <h4 className="text-md font-medium mb-2 text-blue-300">Responsiveness</h4>
                    <div className="text-sm text-white/80 space-y-1">
                      <div>Response Time: {testResults.comprehensive?.responsiveness?.responseTime}ms</div>
                      <div>Resize Events: {testResults.comprehensive?.responsiveness?.resizeEvents}</div>
                      <div>Responsive: {testResults.comprehensive?.responsiveness?.isResponsive ? 'YES' : 'NO'}</div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-white/70 text-center">
                Click "Run Comprehensive Validation" to test the graph glitching fix.
                The test will validate timing consistency, visual stability, and responsiveness.
              </div>
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="glass p-6 rounded-xl">
          <h2 className="text-xl font-semibold mb-4 text-white">Test Instructions</h2>
          <div className="space-y-4 text-sm text-white/80">
            <p>
              <strong>1.</strong> Open browser console to see detailed diagnostic logs
            </p>
            <p>
              <strong>2.</strong> Click "Run Comprehensive Validation" to execute all tests
            </p>
            <p>
              <strong>3.</strong> Tests include:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Timing consistency measurement (50ms debounce, 300ms animation)</li>
              <li>Visual glitching detection during transitions</li>
              <li>Responsiveness testing with simulated resizes</li>
              <li>Rapid sidebar toggle testing</li>
            </ul>
            <p>
              <strong>4.</strong> Expected results after fix:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li className="text-green-300">All charts use consistent 50ms debounce timing</li>
              <li className="text-green-300">All charts use synchronized 300ms animation timing</li>
              <li className="text-green-300">No visual glitching during menu transitions</li>
              <li className="text-green-300">Charts respond smoothly to resize events</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}