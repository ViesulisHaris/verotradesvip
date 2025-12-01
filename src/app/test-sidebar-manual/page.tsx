'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/supabase/client';

export default function TestSidebarManualPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [testResults, setTestResults] = useState<any>({});
  const [sidebarState, setSidebarState] = useState<string>('Unknown');

  useEffect(() => {
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
      
      // Check sidebar width
      const sidebar = document.querySelector('aside');
      if (sidebar) {
        const width = window.getComputedStyle(sidebar).width;
        setTestResults((prev: any) => ({ ...prev, sidebarWidth: width }));
      }
    };
    
    checkSidebarState();
    
    // Set up interval to monitor changes
    const interval = setInterval(checkSidebarState, 1000);
    
    return () => clearInterval(interval);
  }, []);

  const runTests = () => {
    const results: any = {};
    
    // Test 1: Sidebar exists
    const sidebar = document.querySelector('aside');
    results.sidebarExists = !!sidebar;
    
    // Test 2: Collapse button exists
    const collapseButton = document.querySelector('button[title*="Collapse"], button[title*="Expand"]');
    results.collapseButtonExists = !!collapseButton;
    
    // Test 3: Mobile menu button exists
    const mobileMenuButton = document.querySelector('button.lg\\:hidden');
    results.mobileMenuButtonExists = !!mobileMenuButton;
    
    // Test 4: Check sidebar width
    if (sidebar) {
      const width = window.getComputedStyle(sidebar).width;
      results.sidebarWidth = width;
      results.isCollapsed = width === '4rem'; // 64px = 4rem
      results.isExpanded = width === '16rem'; // 256px = 16rem
    }
    
    // Test 5: Check localStorage
    const savedState = localStorage.getItem('sidebar-collapsed');
    results.localStorageExists = savedState !== null;
    if (savedState !== null) {
      results.localStorageValue = JSON.parse(savedState);
    }
    
    // Test 6: Check for tooltips
    const tooltips = document.querySelectorAll('.absolute.left-full.ml-2');
    results.tooltipsExist = tooltips.length > 0;
    
    setTestResults(results);
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
          <p className="text-white/70">Please <a href="/login" className="text-blue-400 hover:text-blue-300">login</a> to test the sidebar functionality.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6">
      <h2 className="text-3xl font-bold text-white">Manual Sidebar Tests</h2>
      
      <div className="glass p-6 rounded-xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-white">Test Controls</h3>
          <button
            onClick={runTests}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200"
          >
            Run Tests
          </button>
        </div>
        
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="text-white/70">
            <span className="font-medium">Current Sidebar State:</span>
            <span className={`ml-2 px-2 py-1 rounded text-xs ${sidebarState === 'Collapsed' ? 'bg-orange-600/20 text-orange-300' : 'bg-green-600/20 text-green-300'}`}>
              {sidebarState}
            </span>
          </div>
          <div className="text-white/70">
            <span className="font-medium">Sidebar Width:</span>
            <span className="ml-2 text-white">{testResults.sidebarWidth || 'Unknown'}</span>
          </div>
        </div>
      </div>

      <div className="glass p-6 rounded-xl">
        <h3 className="text-xl font-semibold mb-4 text-white">Test Results</h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center p-3 bg-slate-800/50 rounded-lg">
            <span className="text-white/80">Sidebar Exists</span>
            <span className={`px-3 py-1 rounded text-sm ${testResults.sidebarExists ? 'bg-green-600/20 text-green-300' : 'bg-red-600/20 text-red-300'}`}>
              {testResults.sidebarExists ? 'PASS' : 'FAIL'}
            </span>
          </div>
          
          <div className="flex justify-between items-center p-3 bg-slate-800/50 rounded-lg">
            <span className="text-white/80">Collapse Button Exists</span>
            <span className={`px-3 py-1 rounded text-sm ${testResults.collapseButtonExists ? 'bg-green-600/20 text-green-300' : 'bg-red-600/20 text-red-300'}`}>
              {testResults.collapseButtonExists ? 'PASS' : 'FAIL'}
            </span>
          </div>
          
          <div className="flex justify-between items-center p-3 bg-slate-800/50 rounded-lg">
            <span className="text-white/80">Mobile Menu Button Exists</span>
            <span className={`px-3 py-1 rounded text-sm ${testResults.mobileMenuButtonExists ? 'bg-green-600/20 text-green-300' : 'bg-red-600/20 text-red-300'}`}>
              {testResults.mobileMenuButtonExists ? 'PASS' : 'FAIL'}
            </span>
          </div>
          
          <div className="flex justify-between items-center p-3 bg-slate-800/50 rounded-lg">
            <span className="text-white/80">State Persistence (localStorage)</span>
            <span className={`px-3 py-1 rounded text-sm ${testResults.localStorageExists ? 'bg-green-600/20 text-green-300' : 'bg-red-600/20 text-red-300'}`}>
              {testResults.localStorageExists ? 'PASS' : 'FAIL'}
            </span>
          </div>
          
          <div className="flex justify-between items-center p-3 bg-slate-800/50 rounded-lg">
            <span className="text-white/80">Tooltips Available</span>
            <span className={`px-3 py-1 rounded text-sm ${testResults.tooltipsExist ? 'bg-green-600/20 text-green-300' : 'bg-red-600/20 text-red-300'}`}>
              {testResults.tooltipsExist ? 'PASS' : 'FAIL'}
            </span>
          </div>
        </div>
      </div>

      <div className="glass p-6 rounded-xl">
        <h3 className="text-xl font-semibold mb-4 text-white">Manual Test Instructions</h3>
        <div className="space-y-4">
          <div className="border-l-4 border-blue-500 pl-4">
            <h4 className="font-medium text-white mb-2">1. Test Collapse/Expand Button</h4>
            <p className="text-white/70 text-sm">Click the chevron button in the sidebar header multiple times. The sidebar should smoothly animate between collapsed (64px) and expanded (256px) states.</p>
          </div>
          
          <div className="border-l-4 border-green-500 pl-4">
            <h4 className="font-medium text-white mb-2">2. Test State Persistence</h4>
            <p className="text-white/70 text-sm">Collapse the sidebar, refresh the page (F5), and verify it remains collapsed. The state should be saved to localStorage.</p>
          </div>
          
          <div className="border-l-4 border-purple-500 pl-4">
            <h4 className="font-medium text-white mb-2">3. Test Keyboard Shortcut</h4>
            <p className="text-white/70 text-sm">Press Ctrl+B to toggle the sidebar. This should work the same as clicking the collapse button.</p>
          </div>
          
          <div className="border-l-4 border-orange-500 pl-4">
            <h4 className="font-medium text-white mb-2">4. Test Tooltips</h4>
            <p className="text-white/70 text-sm">Collapse the sidebar and hover over menu items. Tooltips should appear showing the menu item names.</p>
          </div>
          
          <div className="border-l-4 border-cyan-500 pl-4">
            <h4 className="font-medium text-white mb-2">5. Test Responsive Behavior</h4>
            <p className="text-white/70 text-sm">Resize your browser window to test different screen sizes. On mobile, the sidebar should be hidden by default with a hamburger menu.</p>
          </div>
        </div>
      </div>

      <div className="glass p-6 rounded-xl">
        <h3 className="text-xl font-semibold mb-4 text-white">Expected Behavior</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <h4 className="font-medium text-white mb-2">Expanded State:</h4>
            <ul className="list-disc list-inside text-white/70 space-y-1">
              <li>Width: 256px (16rem)</li>
              <li>Full menu text visible</li>
              <li>VeroTrade logo and title visible</li>
              <li>Collapse button shows left arrow</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-white mb-2">Collapsed State:</h4>
            <ul className="list-disc list-inside text-white/70 space-y-1">
              <li>Width: 64px (4rem)</li>
              <li>Only icons visible</li>
              <li>VT logo visible, title hidden</li>
              <li>Expand button shows right arrow</li>
              <li>Tooltips on hover</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}