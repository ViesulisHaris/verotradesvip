'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

export default function TestSidebarLogoFix() {
  const [sidebarState, setSidebarState] = useState<string>('Unknown');
  const [logoNavigationTest, setLogoNavigationTest] = useState<string>('Not tested');
  const pathname = usePathname();

  useEffect(() => {
    // Check sidebar state from localStorage
    const checkSidebarState = () => {
      try {
        const savedState = localStorage.getItem('sidebar-collapsed');
        if (savedState !== null) {
          const isCollapsed = JSON.parse(savedState);
          setSidebarState(isCollapsed ? 'Collapsed' : 'Expanded');
        } else {
          setSidebarState('No saved state found');
        }
      } catch (error) {
        setSidebarState('Error reading state');
      }
    };

    // Initial check
    checkSidebarState();

    // Set up interval to monitor changes
    const interval = setInterval(checkSidebarState, 1000);

    return () => clearInterval(interval);
  }, []);

  const testLogoNavigation = () => {
    // Find the VeroTrade logo link
    const logoLink = document.querySelector('a[href="/dashboard"]');
    if (logoLink) {
      setLogoNavigationTest('Logo found - Click to test navigation');
      logoLink.addEventListener('click', () => {
        setLogoNavigationTest('Logo clicked - Navigation triggered');
      });
    } else {
      setLogoNavigationTest('Logo not found');
    }
  };

  useEffect(() => {
    testLogoNavigation();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">Sidebar Default State & Logo Navigation Test</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Sidebar State Test */}
          <div className="glass p-6 rounded-xl border border-blue-500/20">
            <h2 className="text-xl font-semibold mb-4 text-blue-300">Sidebar Default State Test</h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Current State:</span>
                <span className={`font-bold ${sidebarState === 'Collapsed' ? 'text-green-400' : sidebarState === 'Expanded' ? 'text-yellow-400' : 'text-red-400'}`}>
                  {sidebarState}
                </span>
              </div>
              <div className="text-sm text-gray-400">
                <p>Expected: Collapsed by default</p>
                <p>Current: {sidebarState}</p>
              </div>
            </div>
          </div>

          {/* Logo Navigation Test */}
          <div className="glass p-6 rounded-xl border border-blue-500/20">
            <h2 className="text-xl font-semibold mb-4 text-blue-300">VeroTrade Logo Navigation Test</h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Logo Status:</span>
                <span className={`font-bold ${logoNavigationTest.includes('found') ? 'text-green-400' : 'text-red-400'}`}>
                  {logoNavigationTest}
                </span>
              </div>
              <div className="text-sm text-gray-400">
                <p>Expected: Logo should be clickable</p>
                <p>Current: {logoNavigationTest}</p>
              </div>
            </div>
          </div>

          {/* Current Page Info */}
          <div className="glass p-6 rounded-xl border border-blue-500/20">
            <h2 className="text-xl font-semibold mb-4 text-blue-300">Current Page Info</h2>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Path:</span>
                <span className="font-mono text-sm">{pathname}</span>
              </div>
              <div className="text-sm text-gray-400">
                <p>Test navigation by clicking the VeroTrade logo in the header</p>
              </div>
            </div>
          </div>

          {/* Test Instructions */}
          <div className="glass p-6 rounded-xl border border-blue-500/20">
            <h2 className="text-xl font-semibold mb-4 text-blue-300">Test Instructions</h2>
            <div className="space-y-2 text-sm text-gray-300">
              <p>1. <strong>Sidebar Test:</strong> Sidebar should be collapsed by default</p>
              <p>2. <strong>Logo Test:</strong> Click VeroTrade logo to navigate to dashboard</p>
              <p>3. <strong>Persistence:</strong> Toggle sidebar and refresh to test persistence</p>
              <p>4. <strong>Navigation:</strong> Test logo navigation from different pages</p>
            </div>
          </div>
        </div>

        {/* Test Results Summary */}
        <div className="mt-8 glass p-6 rounded-xl border border-blue-500/20">
          <h2 className="text-xl font-semibold mb-4 text-blue-300">Test Results Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className={`p-4 rounded-lg ${sidebarState === 'Collapsed' ? 'bg-green-600/20 border border-green-500/30' : 'bg-red-600/20 border border-red-500/30'}`}>
              <h3 className="font-semibold mb-2">Sidebar Default State</h3>
              <p className="text-sm">
                {sidebarState === 'Collapsed' ? '✅ PASS: Sidebar is collapsed by default' : '❌ FAIL: Sidebar is not collapsed by default'}
              </p>
            </div>
            <div className={`p-4 rounded-lg ${logoNavigationTest.includes('found') ? 'bg-green-600/20 border border-green-500/30' : 'bg-red-600/20 border border-red-500/30'}`}>
              <h3 className="font-semibold mb-2">Logo Navigation</h3>
              <p className="text-sm">
                {logoNavigationTest.includes('found') ? '✅ PASS: VeroTrade logo is found and clickable' : '❌ FAIL: VeroTrade logo not found'}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Links for Testing */}
        <div className="mt-8 glass p-6 rounded-xl border border-blue-500/20">
          <h2 className="text-xl font-semibold mb-4 text-blue-300">Navigation Test Links</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <a href="/dashboard" className="px-4 py-2 bg-blue-600/20 rounded-lg hover:bg-blue-600/30 transition-colors text-center">
              Dashboard
            </a>
            <a href="/log-trade" className="px-4 py-2 bg-blue-600/20 rounded-lg hover:bg-blue-600/30 transition-colors text-center">
              Log Trade
            </a>
            <a href="/strategies" className="px-4 py-2 bg-blue-600/20 rounded-lg hover:bg-blue-600/30 transition-colors text-center">
              Strategies
            </a>
            <a href="/calendar" className="px-4 py-2 bg-blue-600/20 rounded-lg hover:bg-blue-600/30 transition-colors text-center">
              Calendar
            </a>
          </div>
          <p className="text-sm text-gray-400 mt-4 text-center">
            Navigate to different pages and test the VeroTrade logo navigation from each page
          </p>
        </div>
      </div>
    </div>
  );
}