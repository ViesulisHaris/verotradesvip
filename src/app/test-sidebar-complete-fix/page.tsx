'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/supabase/client';

export default function SidebarCompleteFixTest() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [testResults, setTestResults] = useState<any[]>([]);
  const [sidebarState, setSidebarState] = useState<string>('Unknown');
  const [toggleCount, setToggleCount] = useState(0);
  const [isTesting, setIsTesting] = useState(false);

  useEffect(() => {
    // Check authentication
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    };
    checkAuth();

    // Monitor sidebar state changes
    const checkSidebarState = () => {
      const savedState = localStorage.getItem('sidebar-collapsed');
      if (savedState !== null) {
        setSidebarState(JSON.parse(savedState) ? 'Collapsed' : 'Expanded');
      }
    };

    checkSidebarState();
    const interval = setInterval(checkSidebarState, 500);

    return () => clearInterval(interval);
  }, []);

  const runComprehensiveTests = async () => {
    setIsTesting(true);
    const results = [];

    // Test 1: Sidebar exists in DOM
    const sidebar = document.querySelector('aside');
    results.push({
      name: 'Sidebar Element Exists',
      status: sidebar ? 'pass' : 'fail',
      details: sidebar ? 'Sidebar element found in DOM' : 'Sidebar element not found'
    });

    // Test 2: Toggle button exists and is clickable
    const toggleButton = document.querySelector('button[title*="sidebar"]');
    results.push({
      name: 'Toggle Button Exists',
      status: toggleButton ? 'pass' : 'fail',
      details: toggleButton ? 'Toggle button found' : 'Toggle button not found'
    });

    // Test 3: Initial state from localStorage
    const savedState = localStorage.getItem('sidebar-collapsed');
    results.push({
      name: 'Initial State Loaded',
      status: savedState !== null ? 'pass' : 'fail',
      details: savedState !== null ? `State loaded: ${JSON.parse(savedState) ? 'Collapsed' : 'Expanded'}` : 'No saved state found'
    });

    // Test 4: Multiple toggle functionality test
    let toggleSuccess = true;
    let toggleDetails = [];
    
    for (let i = 0; i < 5; i++) {
      if (toggleButton) {
        const initialState = JSON.parse(localStorage.getItem('sidebar-collapsed') || 'false');
        (toggleButton as HTMLButtonElement).click();
        
        // Wait for state to update
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const newState = JSON.parse(localStorage.getItem('sidebar-collapsed') || 'false');
        const stateChanged = initialState !== newState;
        
        toggleSuccess = toggleSuccess && stateChanged;
        toggleDetails.push(`Toggle ${i + 1}: ${initialState ? 'Collapsed' : 'Expanded'} → ${newState ? 'Collapsed' : 'Expanded'} ${stateChanged ? '✓' : '✗'}`);
        
        setToggleCount(i + 1);
      }
    }
    
    results.push({
      name: 'Multiple Toggle Test (5 cycles)',
      status: toggleSuccess ? 'pass' : 'fail',
      details: toggleDetails.join(', ')
    });

    // Test 5: Icon visibility in collapsed state
    const icons = document.querySelectorAll('nav button svg, nav a svg');
    const iconsVisible = Array.from(icons).every(icon => {
      const styles = window.getComputedStyle(icon);
      return styles.display !== 'none' && styles.visibility !== 'hidden';
    });
    
    results.push({
      name: 'Icon Visibility',
      status: iconsVisible ? 'pass' : 'fail',
      details: iconsVisible ? `All ${icons.length} icons visible` : 'Some icons are hidden'
    });

    // Test 6: Icon highlighting in active state
    const activeLink = document.querySelector('a.nav-item-active');
    const activeIcon = activeLink?.querySelector('svg');
    const activeIconHasCorrectColor = activeIcon ? 
      window.getComputedStyle(activeIcon).color.includes('59, 130, 246') || // blue-500
      window.getComputedStyle(activeIcon).color.includes('147, 197, 253') : // blue-300
      false;
    
    results.push({
      name: 'Active Icon Highlighting',
      status: activeIconHasCorrectColor ? 'pass' : 'fail',
      details: activeIconHasCorrectColor ? 'Active icon has correct blue color' : 'Active icon color incorrect'
    });

    // Test 7: Tooltip functionality in collapsed state
    const isCollapsed = JSON.parse(localStorage.getItem('sidebar-collapsed') || 'false');
    const tooltips = document.querySelectorAll('.tooltip-enhanced');
    const tooltipsCorrectlyHidden = isCollapsed ? 
      Array.from(tooltips).every(tooltip => {
        const styles = window.getComputedStyle(tooltip);
        return styles.opacity === '0' || styles.opacity === '0';
      }) : true;
    
    results.push({
      name: 'Tooltip Functionality',
      status: tooltipsCorrectlyHidden ? 'pass' : 'fail',
      details: tooltipsCorrectlyHidden ? 
        `Tooltips correctly ${isCollapsed ? 'hidden' : 'not applicable'}` : 
        'Tooltips not behaving correctly'
    });

    // Test 8: Sidebar width changes
    const sidebarWidth = sidebar ? (sidebar as HTMLElement).offsetWidth : 0;
    const expectedWidth = isCollapsed ? 64 : 256; // w-16 = 64px, w-64 = 256px
    const widthCorrect = Math.abs(sidebarWidth - expectedWidth) < 10; // Allow 10px tolerance
    
    results.push({
      name: 'Sidebar Width',
      status: widthCorrect ? 'pass' : 'fail',
      details: widthCorrect ? 
        `Width correct: ${sidebarWidth}px (expected: ${expectedWidth}px)` : 
        `Width incorrect: ${sidebarWidth}px (expected: ${expectedWidth}px)`
    });

    // Test 9: Main content margin adjustment
    const mainContent = document.querySelector('main')?.parentElement as HTMLElement;
    const mainMarginLeft = mainContent ? parseInt(window.getComputedStyle(mainContent).marginLeft) || 0 : 0;
    const expectedMargin = isCollapsed ? 64 : 256;
    const marginCorrect = Math.abs(mainMarginLeft - expectedMargin) < 10;
    
    results.push({
      name: 'Main Content Margin',
      status: marginCorrect ? 'pass' : 'fail',
      details: marginCorrect ? 
        `Margin correct: ${mainMarginLeft}px (expected: ${expectedMargin}px)` : 
        `Margin incorrect: ${mainMarginLeft}px (expected: ${expectedMargin}px)`
    });

    // Test 10: Keyboard shortcut (Ctrl+B)
    let keyboardShortcutWorks = false;
    const initialKeyboardState = JSON.parse(localStorage.getItem('sidebar-collapsed') || 'false');
    
    // Simulate Ctrl+B keypress
    const keyboardEvent = new KeyboardEvent('keydown', {
      key: 'b',
      ctrlKey: true,
      bubbles: true
    });
    
    document.dispatchEvent(keyboardEvent);
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const finalKeyboardState = JSON.parse(localStorage.getItem('sidebar-collapsed') || 'false');
    keyboardShortcutWorks = initialKeyboardState !== finalKeyboardState;
    
    results.push({
      name: 'Keyboard Shortcut (Ctrl+B)',
      status: keyboardShortcutWorks ? 'pass' : 'fail',
      details: keyboardShortcutWorks ? 
        'Ctrl+B successfully toggles sidebar' : 
        'Ctrl+B shortcut not working'
    });

    setTestResults(results);
    setIsTesting(false);
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
          <p className="text-white/70">Please <a href="/login" className="text-blue-400 hover:underline">login</a> to test sidebar functionality.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-white">Complete Sidebar Fix Test</h2>
        <button
          onClick={runComprehensiveTests}
          disabled={isTesting}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white font-medium rounded-lg transition-colors duration-200"
        >
          {isTesting ? 'Testing...' : 'Run Complete Tests'}
        </button>
      </div>

      {/* Current State Display */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass p-4 rounded-xl">
          <h3 className="text-lg font-semibold text-white mb-2">Current State</h3>
          <div className="text-white/70">
            <span className="font-medium">Sidebar State:</span>
            <span className={`ml-2 px-2 py-1 rounded text-xs ${sidebarState === 'Collapsed' ? 'bg-orange-600/20 text-orange-300' : 'bg-green-600/20 text-green-300'}`}>
              {sidebarState}
            </span>
          </div>
        </div>
        
        <div className="glass p-4 rounded-xl">
          <h3 className="text-lg font-semibold text-white mb-2">Toggle Test</h3>
          <div className="text-white/70">
            <span className="font-medium">Toggle Cycles:</span>
            <span className="ml-2 text-white">{toggleCount}/5</span>
          </div>
        </div>
        
        <div className="glass p-4 rounded-xl">
          <h3 className="text-lg font-semibold text-white mb-2">Test Status</h3>
          <div className="text-white/70">
            <span className="font-medium">Status:</span>
            <span className={`ml-2 px-2 py-1 rounded text-xs ${isTesting ? 'bg-yellow-600/20 text-yellow-300' : 'bg-blue-600/20 text-blue-300'}`}>
              {isTesting ? 'Running' : 'Ready'}
            </span>
          </div>
        </div>
      </div>

      {/* Test Results */}
      {testResults.length > 0 && (
        <div className="glass p-6 rounded-xl">
          <h3 className="text-xl font-semibold text-white mb-4">Test Results</h3>
          <div className="space-y-3">
            {testResults.map((result, index) => (
              <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-slate-800/50">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                  result.status === 'pass' ? 'bg-green-600/20 text-green-300' : 'bg-red-600/20 text-red-300'
                }`}>
                  {result.status === 'pass' ? '✓' : '✗'}
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-white">{result.name}</h4>
                  <p className="text-sm text-white/70 mt-1">{result.details}</p>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-6 pt-4 border-t border-blue-500/20">
            <div className="flex items-center justify-between">
              <span className="text-white/70">Tests Passed:</span>
              <span className={`font-bold ${
                testResults.filter(r => r.status === 'pass').length === testResults.length 
                  ? 'text-green-400' 
                  : 'text-orange-400'
              }`}>
                {testResults.filter(r => r.status === 'pass').length}/{testResults.length}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Manual Test Instructions */}
      <div className="glass p-6 rounded-xl">
        <h3 className="text-xl font-semibold text-white mb-4">Manual Test Instructions</h3>
        <div className="space-y-3 text-white/70">
          <p>1. <strong>Toggle Test:</strong> Click the collapse/expand button in the sidebar multiple times (at least 5)</p>
          <p>2. <strong>Keyboard Test:</strong> Press Ctrl+B to toggle the sidebar</p>
          <p>3. <strong>Icon Test:</strong> Check that icons are properly colored and visible in both states</p>
          <p>4. <strong>Tooltip Test:</strong> Hover over icons in collapsed state to see tooltips</p>
          <p>5. <strong>Responsive Test:</strong> Resize the browser to test responsive behavior</p>
          <p>6. <strong>State Test:</strong> Refresh the page to verify state persistence</p>
        </div>
      </div>
    </div>
  );
}