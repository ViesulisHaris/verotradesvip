'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function NavigationDiagnosticPage() {
  const [diagnosticLogs, setDiagnosticLogs] = useState<string[]>([]);
  const [navigationTestResults, setNavigationTestResults] = useState<{
    clickReceived: boolean;
    navigationAttempted: boolean;
    cleanupTriggered: boolean;
    navigationCompleted: boolean;
  }>({
    clickReceived: false,
    navigationAttempted: false,
    cleanupTriggered: false,
    navigationCompleted: false
  });

  // Add log to diagnostic display
  const addDiagnosticLog = (message: string) => {
    setDiagnosticLogs(prev => [...prev, `[${new Date().toISOString()}] ${message}`]);
    console.log('🧪 NAVIGATION TEST:', message);
  };

  // Test navigation click handler
  const handleTestNavigation = (href: string, label: string) => {
    addDiagnosticLog(`🖱️ Navigation click detected: ${label} -> ${href}`);
    setNavigationTestResults(prev => ({ ...prev, clickReceived: true }));

    // Check if cleanup function exists
    if ((window as any).cleanupModalOverlays) {
      addDiagnosticLog('🧹 cleanupModalOverlays function found');
      setNavigationTestResults(prev => ({ ...prev, cleanupTriggered: true }));
    } else {
      addDiagnosticLog('❌ cleanupModalOverlays function NOT found');
    }

    // Check if navigation safety exists
    if ((window as any).navigationSafety) {
      addDiagnosticLog('🛡️ navigationSafety object found');
      
      // Test safe navigation
      try {
        addDiagnosticLog('🧪 Attempting safe navigation...');
        (window as any).navigationSafety.safeNavigation(href, label);
        setNavigationTestResults(prev => ({ ...prev, navigationAttempted: true }));
        
        // Simulate navigation completion after delay
        setTimeout(() => {
          addDiagnosticLog('✅ Navigation test completed');
          setNavigationTestResults(prev => ({ ...prev, navigationCompleted: true }));
        }, 1000);
      } catch (error) {
        addDiagnosticLog(`❌ Navigation test failed: ${error}`);
      }
    } else {
      addDiagnosticLog('❌ navigationSafety object NOT found');
    }
  };

  // Test direct DOM manipulation
  const testDOMState = () => {
    addDiagnosticLog('🔍 Testing DOM state...');
    
    // Check for overlays
    const overlays = document.querySelectorAll('.fixed.inset-0, .modal-backdrop, [role="dialog"]');
    addDiagnosticLog(`Found ${overlays.length} potential overlay elements`);
    
    overlays.forEach((overlay, index) => {
      const element = overlay as HTMLElement;
      const computedStyle = window.getComputedStyle(element);
      addDiagnosticLog(`Overlay ${index + 1}: ${element.tagName} (z-index: ${computedStyle.zIndex}, pointer-events: ${computedStyle.pointerEvents})`);
    });

    // Check navigation elements
    const navElements = document.querySelectorAll('nav a, [role="navigation"] a, .nav-link');
    addDiagnosticLog(`Found ${navElements.length} navigation elements`);
    
    navElements.forEach((nav, index) => {
      const element = nav as HTMLElement;
      const computedStyle = window.getComputedStyle(element);
      addDiagnosticLog(`Nav element ${index + 1}: ${element.tagName} (pointer-events: ${computedStyle.pointerEvents})`);
    });

    // Check body state
    const bodyStyle = window.getComputedStyle(document.body);
    addDiagnosticLog(`Body state: pointer-events=${bodyStyle.pointerEvents}, overflow=${bodyStyle.overflow}`);
  };

  // Test cleanup function directly
  const testCleanupFunction = () => {
    addDiagnosticLog('🧪 Testing cleanup function directly...');
    
    if ((window as any).cleanupModalOverlays) {
      try {
        (window as any).cleanupModalOverlays();
        addDiagnosticLog('✅ Cleanup function executed successfully');
      } catch (error) {
        addDiagnosticLog(`❌ Cleanup function failed: ${error}`);
      }
    } else {
      addDiagnosticLog('❌ Cleanup function not available');
    }
  };

  // Clear logs
  const clearLogs = () => {
    setDiagnosticLogs([]);
    setNavigationTestResults({
      clickReceived: false,
      navigationAttempted: false,
      cleanupTriggered: false,
      navigationCompleted: false
    });
  };

  // Reset navigation safety flags
  const resetNavigationFlags = () => {
    addDiagnosticLog('🔄 Manually resetting navigation safety flags...');
    
    if ((window as any).navigationSafety?.resetNavigationSafetyFlags) {
      try {
        (window as any).navigationSafety.resetNavigationSafetyFlags();
        addDiagnosticLog('✅ Navigation safety flags reset successfully');
      } catch (error) {
        addDiagnosticLog(`❌ Failed to reset navigation safety flags: ${error}`);
      }
    } else {
      addDiagnosticLog('❌ resetNavigationSafetyFlags function not available');
    }
  };

  // Test navigation completion detection
  const testNavigationDetection = () => {
    addDiagnosticLog('🔍 Testing navigation completion detection...');
    
    if ((window as any).navigationSafety?.detectNavigationCompletion) {
      try {
        (window as any).navigationSafety.detectNavigationCompletion();
        addDiagnosticLog('✅ Navigation completion detection executed');
      } catch (error) {
        addDiagnosticLog(`❌ Navigation completion detection failed: ${error}`);
      }
    } else {
      addDiagnosticLog('❌ detectNavigationCompletion function not available');
    }
  };

  // Test Trades page special navigation
  const testTradesPageNavigation = () => {
    addDiagnosticLog('🚨 Testing Trades page special navigation...');
    
    if ((window as any).navigationSafety?.handleTradesPageNavigation) {
      try {
        (window as any).navigationSafety.handleTradesPageNavigation('/dashboard', 'Dashboard');
        addDiagnosticLog('✅ Trades page special navigation executed');
      } catch (error) {
        addDiagnosticLog(`❌ Trades page special navigation failed: ${error}`);
      }
    } else {
      addDiagnosticLog('❌ handleTradesPageNavigation function not available');
    }
  };

  // Get current navigation safety state
  const getNavigationSafetyState = () => {
    addDiagnosticLog('📊 Getting current navigation safety state...');
    
    const navSafety = (window as any).navigationSafety;
    if (navSafety) {
      addDiagnosticLog(`Navigation Safety State: ${JSON.stringify({
        isNavigating: navSafety.isNavigating || false,
        userInteractionInProgress: navSafety.userInteractionInProgress || false,
        navigationStartTime: navSafety.navigationStartTime || 0,
        lastCleanupTime: navSafety.lastCleanupTime || 0,
        navigationSafetyEnabled: navSafety.navigationSafetyEnabled !== undefined ? navSafety.navigationSafetyEnabled : true
      }, null, 2)}`);
    } else {
      addDiagnosticLog('❌ Navigation safety object not available');
    }
  };

  // Auto-test on page load
  useEffect(() => {
    addDiagnosticLog('🧪 Navigation diagnostic page loaded');
    addDiagnosticLog(`Current path: ${window.location.pathname}`);
    testDOMState();
  }, []);

  return (
    <div className="min-h-screen bg-primary p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-primary mb-6">Navigation Diagnostic Test</h1>
        
        <div className="card-luxury p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Test Controls</h2>
          <div className="flex flex-wrap gap-4 mb-4">
            <button
              onClick={() => handleTestNavigation('/dashboard', 'Dashboard')}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              Test Dashboard Navigation
            </button>
            <button
              onClick={() => handleTestNavigation('/trades', 'Trades')}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              Test Trades Navigation
            </button>
            <button
              onClick={() => handleTestNavigation('/strategies', 'Strategies')}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              Test Strategies Navigation
            </button>
            <button
              onClick={testDOMState}
              className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/90 transition-colors"
            >
              Test DOM State
            </button>
            <button
              onClick={testCleanupFunction}
              className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/90 transition-colors"
            >
              Test Cleanup Function
            </button>
            <button
              onClick={clearLogs}
              className="px-4 py-2 bg-outline text-primary rounded-lg hover:bg-elevated transition-colors"
            >
              Clear Logs
            </button>
            <button
              onClick={resetNavigationFlags}
              className="px-4 py-2 bg-warning text-warning-foreground rounded-lg hover:bg-warning/90 transition-colors"
            >
              Reset Navigation Flags
            </button>
            <button
              onClick={testNavigationDetection}
              className="px-4 py-2 bg-info text-info-foreground rounded-lg hover:bg-info/90 transition-colors"
            >
              Test Navigation Detection
            </button>
            <button
              onClick={testTradesPageNavigation}
              className="px-4 py-2 bg-success text-success-foreground rounded-lg hover:bg-success/90 transition-colors"
            >
              Test Trades Navigation
            </button>
            <button
              onClick={getNavigationSafetyState}
              className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/90 transition-colors"
            >
              Get Navigation State
            </button>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className={`p-3 rounded-lg ${navigationTestResults.clickReceived ? 'bg-success/20 text-success' : 'bg-error/20 text-error'}`}>
              Click Received: {navigationTestResults.clickReceived ? '✅' : '❌'}
            </div>
            <div className={`p-3 rounded-lg ${navigationTestResults.cleanupTriggered ? 'bg-success/20 text-success' : 'bg-error/20 text-error'}`}>
              Cleanup Triggered: {navigationTestResults.cleanupTriggered ? '✅' : '❌'}
            </div>
            <div className={`p-3 rounded-lg ${navigationTestResults.navigationAttempted ? 'bg-success/20 text-success' : 'bg-error/20 text-error'}`}>
              Navigation Attempted: {navigationTestResults.navigationAttempted ? '✅' : '❌'}
            </div>
            <div className={`p-3 rounded-lg ${navigationTestResults.navigationCompleted ? 'bg-success/20 text-success' : 'bg-error/20 text-error'}`}>
              Navigation Completed: {navigationTestResults.navigationCompleted ? '✅' : '❌'}
            </div>
          </div>
        </div>

        <div className="card-luxury p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Diagnostic Logs</h2>
          <div className="bg-secondary/50 p-4 rounded-lg max-h-96 overflow-y-auto font-mono text-sm">
            {diagnosticLogs.length > 0 ? (
              diagnosticLogs.map((log, index) => (
                <div key={index} className="mb-1">
                  {log}
                </div>
              ))
            ) : (
              <div className="text-muted">No diagnostic logs yet. Perform a test to see logs.</div>
            )}
          </div>
        </div>

        <div className="card-luxury p-6">
          <h2 className="text-xl font-semibold mb-4">Manual Navigation Tests</h2>
          <div className="space-y-2">
            <Link href="/dashboard" className="block p-3 bg-elevated rounded-lg hover:bg-elevated/80 transition-colors">
              Navigate to Dashboard (standard Next.js link)
            </Link>
            <Link href="/trades" className="block p-3 bg-elevated rounded-lg hover:bg-elevated/80 transition-colors">
              Navigate to Trades (standard Next.js link)
            </Link>
            <Link href="/strategies" className="block p-3 bg-elevated rounded-lg hover:bg-elevated/80 transition-colors">
              Navigate to Strategies (standard Next.js link)
            </Link>
            <button 
              onClick={() => window.location.href = '/dashboard'}
              className="w-full text-left p-3 bg-elevated rounded-lg hover:bg-elevated/80 transition-colors"
            >
              Navigate to Dashboard (window.location.href)
            </button>
            <button 
              onClick={() => (window as any).navigationSafety?.safeNavigation('/dashboard', 'Dashboard')}
              className="w-full text-left p-3 bg-elevated rounded-lg hover:bg-elevated/80 transition-colors"
            >
              Navigate to Dashboard (safeNavigation function)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}