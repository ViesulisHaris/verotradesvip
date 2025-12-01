'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/supabase/client';
import { useAuth } from '@/contexts/AuthContext-simple';
import UnifiedLayout from '@/components/layout/UnifiedLayout';
import EmotionRadar from '@/components/ui/EmotionRadar';
import { Brain, Bug, Play, Square, Activity } from 'lucide-react';

// Type declaration for the diagnostic script
declare global {
  interface Window {
    emotionRadarDiagnostic?: {
      startMonitoring: () => void;
      stopMonitoring: () => void;
      analyzeCSSEffects: () => void;
      testViewportResize: () => void;
      generateReport: () => any;
      POTENTIAL_CAUSES: Record<string, string>;
    };
  }
}

// Test data for EmotionRadar
const testEmotionData = [
  { subject: 'FOMO', value: 75, fullMark: 100, leaning: 'Buy Leaning', side: 'Buy', leaningValue: 25, totalTrades: 12 },
  { subject: 'REVENGE', value: 45, fullMark: 100, leaning: 'Sell Leaning', side: 'Sell', leaningValue: -15, totalTrades: 8 },
  { subject: 'TILT', value: 60, fullMark: 100, leaning: 'Balanced', side: 'NULL', leaningValue: 0, totalTrades: 10 },
  { subject: 'PATIENCE', value: 80, fullMark: 100, leaning: 'Buy Leaning', side: 'Buy', leaningValue: 30, totalTrades: 15 },
  { subject: 'DISCIPLINE', value: 90, fullMark: 100, leaning: 'Buy Leaning', side: 'Buy', leaningValue: 40, totalTrades: 18 }
];

export default function TestEmotionRadarPositioning() {
  const { user } = useAuth();
  const [diagnosticActive, setDiagnosticActive] = useState(false);
  const [diagnosticResults, setDiagnosticResults] = useState<any>(null);
  const [testScenarios, setTestScenarios] = useState<string[]>([]);

  useEffect(() => {
    // Load diagnostic script
    const script = document.createElement('script');
    script.src = '/emotion-radar-positioning-diagnostic.js';
    script.async = true;
    document.head.appendChild(script);

    script.onload = () => {
      console.log('🚀 [TEST_PAGE] Diagnostic script loaded');
      setTestScenarios(Object.keys(window.emotionRadarDiagnostic?.POTENTIAL_CAUSES || {}));
    };

    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, []);

  const startDiagnostic = () => {
    if (window.emotionRadarDiagnostic) {
      console.log('🎯 [TEST_PAGE] Starting diagnostic...');
      setDiagnosticActive(true);
      window.emotionRadarDiagnostic.startMonitoring();
      
      // Generate report after 10 seconds
      setTimeout(() => {
        const report = window.emotionRadarDiagnostic?.generateReport();
        if (report) {
          setDiagnosticResults(report);
          console.log('📊 [TEST_PAGE] Diagnostic completed:', report);
        }
      }, 10000);
    }
  };

  const stopDiagnostic = () => {
    if (window.emotionRadarDiagnostic) {
      console.log('🛑 [TEST_PAGE] Stopping diagnostic...');
      window.emotionRadarDiagnostic.stopMonitoring();
      setDiagnosticActive(false);
    }
  };

  const testCSSEffects = () => {
    if (window.emotionRadarDiagnostic) {
      console.log('🔬 [TEST_PAGE] Testing CSS effects...');
      window.emotionRadarDiagnostic.analyzeCSSEffects();
    }
  };

  const testViewportResize = () => {
    if (window.emotionRadarDiagnostic) {
      console.log('📱 [TEST_PAGE] Testing viewport resize...');
      window.emotionRadarDiagnostic.testViewportResize();
    }
  };

  const triggerSidebarToggle = () => {
    // Find and click sidebar toggle button
    const toggleBtn = document.querySelector('.verotrade-desktop-menu-btn, .unified-desktop-menu-btn, [class*="menu-btn"]');
    if (toggleBtn) {
      console.log('🔄 [TEST_PAGE] Triggering sidebar toggle...');
      (toggleBtn as HTMLElement).click();
    } else {
      console.warn('⚠️ [TEST_PAGE] Sidebar toggle button not found');
    }
  };

  return (
    <UnifiedLayout>
      <div className="min-h-screen space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="heading-luxury text-2xl sm:text-3xl">EmotionRadar Positioning Diagnostic</h1>
            <p className="body-text text-sm sm:text-base mt-2">
              Test and analyze EmotionRadar component positioning issues on the confluence page
            </p>
          </div>
          <div className="flex gap-3">
            {diagnosticActive && (
              <div className="flex items-center gap-2 text-red-400">
                <Activity className="w-4 h-4 animate-pulse" />
                <span className="text-sm">Monitoring Active</span>
              </div>
            )}
          </div>
        </div>

        {/* Test Controls */}
        <div className="card-luxury p-6">
          <h2 className="text-lg font-semibold text-primary mb-4 flex items-center gap-2">
            <Bug className="w-5 h-5 text-dusty-gold" />
            Diagnostic Controls
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <button
              onClick={startDiagnostic}
              disabled={diagnosticActive}
              className="btn-primary flex items-center gap-2"
            >
              <Play className="w-4 h-4" />
              Start Monitoring
            </button>
            
            <button
              onClick={stopDiagnostic}
              disabled={!diagnosticActive}
              className="btn-secondary flex items-center gap-2"
            >
              <Square className="w-4 h-4" />
              Stop Monitoring
            </button>
            
            <button
              onClick={testCSSEffects}
              className="btn-secondary flex items-center gap-2"
            >
              <Brain className="w-4 h-4" />
              Analyze CSS
            </button>
            
            <button
              onClick={testViewportResize}
              className="btn-secondary flex items-center gap-2"
            >
              <Activity className="w-4 h-4" />
              Test Resize
            </button>
            
            <button
              onClick={triggerSidebarToggle}
              className="btn-secondary flex items-center gap-2"
            >
              <Brain className="w-4 h-4" />
              Toggle Sidebar
            </button>
          </div>
        </div>

        {/* Potential Causes */}
        {testScenarios.length > 0 && (
          <div className="card-luxury p-6">
            <h2 className="text-lg font-semibold text-primary mb-4">Potential Causes Being Tested</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {testScenarios.map((cause, index) => (
                <div key={index} className="flex items-center gap-2 p-3 bg-soft-graphite rounded-lg">
                  <div className="w-2 h-2 bg-dusty-gold rounded-full"></div>
                  <span className="text-sm text-primary">{cause}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* EmotionRadar Test Area */}
        <div className="card-luxury p-6">
          <h2 className="text-lg font-semibold text-primary mb-4 flex items-center gap-2">
            <Brain className="w-5 h-5 text-dusty-gold" />
            EmotionRadar Test Component
          </h2>
          
          <div className="relative" data-testid="emotion-radar-test-container">
            <EmotionRadar data={testEmotionData} />
          </div>
        </div>

        {/* Diagnostic Results */}
        {diagnosticResults && (
          <div className="card-luxury p-6">
            <h2 className="text-lg font-semibold text-primary mb-4">Diagnostic Results</h2>
            
            <div className="space-y-4">
              {/* Summary */}
              <div className="bg-soft-graphite p-4 rounded-lg">
                <h3 className="text-md font-medium text-primary mb-2">Summary</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-muted-gray">Position Changes:</span>
                    <p className="text-primary font-medium">{diagnosticResults.summary.totalPositionChanges}</p>
                  </div>
                  <div>
                    <span className="text-muted-gray">Sidebar Changes:</span>
                    <p className="text-primary font-medium">{diagnosticResults.summary.sidebarStateChanges}</p>
                  </div>
                  <div>
                    <span className="text-muted-gray">CSS Issues:</span>
                    <p className="text-primary font-medium">{diagnosticResults.cssIssues?.length || 0}</p>
                  </div>
                  <div>
                    <span className="text-muted-gray">Status:</span>
                    <p className="text-primary font-medium">{diagnosticResults.summary.monitoringDuration}</p>
                  </div>
                </div>
              </div>

              {/* CSS Analysis */}
              {diagnosticResults.cssAnalysis && (
                <div className="bg-soft-graphite p-4 rounded-lg">
                  <h3 className="text-md font-medium text-primary mb-2">CSS Analysis</h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-muted-gray">Container Transform:</span>
                      <code className="ml-2 px-2 py-1 bg-deep-charcoal rounded text-dusty-gold">
                        {diagnosticResults.cssAnalysis.container?.transform || 'none'}
                      </code>
                    </div>
                    <div>
                      <span className="text-muted-gray">Container Position:</span>
                      <code className="ml-2 px-2 py-1 bg-deep-charcoal rounded text-dusty-gold">
                        {diagnosticResults.cssAnalysis.container?.position || 'static'}
                      </code>
                    </div>
                    <div>
                      <span className="text-muted-gray">Container Transition:</span>
                      <code className="ml-2 px-2 py-1 bg-deep-charcoal rounded text-dusty-gold">
                        {diagnosticResults.cssAnalysis.container?.transition || 'none'}
                      </code>
                    </div>
                  </div>
                </div>
              )}

              {/* Issues */}
              {diagnosticResults.cssIssues && diagnosticResults.cssIssues.length > 0 && (
                <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-lg">
                  <h3 className="text-md font-medium text-red-400 mb-2">Issues Detected</h3>
                  <ul className="space-y-1 text-sm text-red-300">
                    {diagnosticResults.cssIssues.map((issue: string, index: number) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-red-400 mt-1">•</span>
                        <span>{issue}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Recommendations */}
              {diagnosticResults.recommendations && diagnosticResults.recommendations.length > 0 && (
                <div className="bg-dusty-gold/10 border border-dusty-gold/30 p-4 rounded-lg">
                  <h3 className="text-md font-medium text-dusty-gold mb-2">Recommendations</h3>
                  <div className="space-y-3">
                    {diagnosticResults.recommendations.map((rec: any, index: number) => (
                      <div key={index} className="text-sm">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            rec.priority === 'HIGH' ? 'bg-red-500/20 text-red-400' :
                            rec.priority === 'MEDIUM' ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-green-500/20 text-green-400'
                          }`}>
                            {rec.priority}
                          </span>
                          <span className="text-primary font-medium">{rec.issue}</span>
                        </div>
                        <p className="text-muted-gray ml-2">{rec.solution}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Position History */}
              {diagnosticResults.positionHistory && diagnosticResults.positionHistory.length > 0 && (
                <div className="bg-soft-graphite p-4 rounded-lg">
                  <h3 className="text-md font-medium text-primary mb-2">Recent Position Changes</h3>
                  <div className="space-y-2 text-sm max-h-40 overflow-y-auto">
                    {diagnosticResults.positionHistory.map((change: any, index: number) => (
                      <div key={index} className="border-b border-border-primary pb-2">
                        <div className="flex justify-between items-center">
                          <span className="text-muted-gray">{change.trigger}</span>
                          <span className="text-primary">
                            Top: {change.rect.top.toFixed(1)}px, Left: {change.rect.left.toFixed(1)}px
                          </span>
                        </div>
                        {change.sidebarState && (
                          <div className="text-xs text-muted-gray mt-1">
                            Sidebar: {change.sidebarState.isCollapsed ? 'Collapsed' : 'Expanded'}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="card-luxury p-6">
          <h2 className="text-lg font-semibold text-primary mb-4">How to Use</h2>
          <ol className="space-y-2 text-sm text-primary list-decimal list-inside">
            <li>Click "Start Monitoring" to begin tracking EmotionRadar position changes</li>
            <li>Toggle the sidebar using the menu button or "Toggle Sidebar" button</li>
            <li>Resize the browser window to test responsive behavior</li>
            <li>Click "Analyze CSS" to check for problematic CSS properties</li>
            <li>Click "Stop Monitoring" to generate the final diagnostic report</li>
            <li>Check the browser console for detailed logging information</li>
          </ol>
        </div>
      </div>
    </UnifiedLayout>
  );
}