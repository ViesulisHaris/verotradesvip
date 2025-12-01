'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function TestMobileNavigationPage() {
  const [testResults, setTestResults] = useState<any[]>([]);
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });
  const pathname = usePathname();

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const runTests = () => {
    const results = [];

    // Test 1: Check if hamburger menu button exists
    const hamburgerButton = document.querySelector('button.lg\\:hidden');
    results.push({
      name: 'Hamburger Menu Button Exists',
      status: hamburgerButton ? 'pass' : 'fail',
      details: hamburgerButton ? 'Hamburger menu button found in DOM' : 'Hamburger menu button not found'
    });

    // Test 2: Check if hamburger menu is only visible on mobile
    const isVisible = hamburgerButton && (hamburgerButton as HTMLElement).offsetParent !== null;
    const shouldBeVisible = windowSize.width < 1024; // lg breakpoint
    results.push({
      name: 'Hamburger Menu Responsive Visibility',
      status: (isVisible === shouldBeVisible) ? 'pass' : 'fail',
      details: `Window width: ${windowSize.width}px, Button visible: ${isVisible}, Should be visible: ${shouldBeVisible}`
    });

    // Test 3: Check if sidebar exists
    const sidebar = document.querySelector('aside');
    results.push({
      name: 'Sidebar Exists',
      status: sidebar ? 'pass' : 'fail',
      details: sidebar ? 'Sidebar element found in DOM' : 'Sidebar element not found'
    });

    // Test 4: Check if sidebar has correct mobile classes
    const hasMobileClasses = sidebar && sidebar.classList.contains('lg:hidden');
    results.push({
      name: 'Sidebar Mobile Classes',
      status: hasMobileClasses ? 'pass' : 'fail',
      details: hasMobileClasses ? 'Sidebar has lg:hidden class' : 'Sidebar missing lg:hidden class'
    });

    // Test 5: Check if overlay exists
    const overlay = document.querySelector('.sidebar-backdrop');
    results.push({
      name: 'Sidebar Overlay Exists',
      status: overlay ? 'pass' : 'fail',
      details: overlay ? 'Sidebar overlay found in DOM' : 'Sidebar overlay not found'
    });

    // Test 6: Check z-index values
    const hamburgerZIndex = hamburgerButton ? window.getComputedStyle(hamburgerButton as HTMLElement).zIndex : '0';
    const sidebarZIndex = sidebar ? window.getComputedStyle(sidebar as HTMLElement).zIndex : '0';
    const overlayZIndex = overlay ? window.getComputedStyle(overlay as HTMLElement).zIndex : '0';
    
    results.push({
      name: 'Z-Index Stacking',
      status: 'info',
      details: `Hamburger: ${hamburgerZIndex}, Sidebar: ${sidebarZIndex}, Overlay: ${overlayZIndex}`
    });

    // Test 7: Check touch-friendly sizing
    const hamburgerSize = hamburgerButton ? (hamburgerButton as HTMLElement).offsetWidth : 0;
    const isTouchFriendly = hamburgerSize >= 44; // Minimum touch target size
    results.push({
      name: 'Touch-Friendly Sizing',
      status: isTouchFriendly ? 'pass' : 'fail',
      details: `Hamburger button size: ${hamburgerSize}px (minimum: 44px)`
    });

    setTestResults(results);
  };

  useEffect(() => {
    runTests();
  }, [windowSize]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pass': return 'text-green-400';
      case 'fail': return 'text-red-400';
      case 'info': return 'text-blue-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass': return '✅';
      case 'fail': return '❌';
      case 'info': return 'ℹ️';
      default: return '❓';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-6">Mobile Navigation Test</h1>
        
        <div className="glass p-6 rounded-xl border border-blue-500/20 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-blue-300">Window Information</h2>
          <div className="space-y-2 text-white/80">
            <p>Width: <span className="text-blue-300 font-mono">{windowSize.width}px</span></p>
            <p>Height: <span className="text-blue-300 font-mono">{windowSize.height}px</span></p>
            <p>Current Path: <span className="text-blue-300 font-mono">{pathname}</span></p>
            <p>Device Type: <span className="text-blue-300 font-mono">
              {windowSize.width < 640 ? 'Mobile' : 
               windowSize.width < 1024 ? 'Tablet' : 'Desktop'}
            </span></p>
          </div>
        </div>

        <div className="glass p-6 rounded-xl border border-blue-500/20 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-blue-300">Test Results</h2>
            <button
              onClick={runTests}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200"
            >
              Run Tests
            </button>
          </div>
          
          <div className="space-y-3">
            {testResults.map((result, index) => (
              <div key={index} className="p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
                <div className="flex items-start gap-3">
                  <span className="text-lg">{getStatusIcon(result.status)}</span>
                  <div className="flex-1">
                    <h3 className={`font-medium ${getStatusColor(result.status)}`}>
                      {result.name}
                    </h3>
                    <p className="text-sm text-gray-300 mt-1">{result.details}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass p-6 rounded-xl border border-blue-500/20">
          <h2 className="text-xl font-semibold mb-4 text-blue-300">Manual Testing Instructions</h2>
          <div className="space-y-3 text-white/80">
            <p>1. <strong>Resize Test:</strong> Resize your browser window to test different screen sizes</p>
            <p>2. <strong>Hamburger Visibility:</strong> The hamburger menu should only be visible on screens smaller than 1024px</p>
            <p>3. <strong>Menu Toggle:</strong> Click the hamburger menu to open/close the sidebar</p>
            <p>4. <strong>Overlay Click:</strong> Click the overlay backdrop to close the sidebar</p>
            <p>5. <strong>Escape Key:</strong> Press the Escape key to close the sidebar</p>
            <p>6. <strong>Navigation:</strong> Click menu items to navigate and auto-close the sidebar</p>
            <p>7. <strong>Touch Test:</strong> On mobile devices, test touch interactions and responsiveness</p>
          </div>
        </div>
      </div>
    </div>
  );
}