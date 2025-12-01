'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function MenuNavigationTest() {
  const [testResults, setTestResults] = useState<string[]>([]);
  const pathname = usePathname();

  const addResult = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setTestResults(prev => [...prev, `[${timestamp}] ${type.toUpperCase()}: ${message}`]);
  };

  const testMenuItems = () => {
    addResult('Starting menu navigation test...', 'info');
    
    // Test 1: Check if menu items exist in DOM
    const menuLinks = document.querySelectorAll('nav a[href]');
    if (menuLinks.length > 0) {
      addResult(`Found ${menuLinks.length} menu links in DOM`, 'success');
      menuLinks.forEach((link, index) => {
        const href = link.getAttribute('href');
        const text = link.textContent?.trim();
        addResult(`Menu item ${index + 1}: ${text} -> ${href}`, 'success');
      });
    } else {
      addResult('No menu links found in DOM', 'error');
    }

    // Test 2: Check if menu items are clickable
    menuLinks.forEach((link, index) => {
      const isClickable = (link as HTMLElement).style.pointerEvents !== 'none' &&
                         window.getComputedStyle(link).pointerEvents !== 'none';
      if (isClickable) {
        addResult(`Menu item ${index + 1} is clickable`, 'success');
      } else {
        addResult(`Menu item ${index + 1} is NOT clickable`, 'error');
      }
    });

    // Test 3: Check if logout button exists and is clickable
    const logoutButton = document.querySelector('button[onClick*="logout"], button[onClick*="Logout"]');
    if (logoutButton) {
      const isClickable = (logoutButton as HTMLElement).style.pointerEvents !== 'none' &&
                         window.getComputedStyle(logoutButton).pointerEvents !== 'none';
      if (isClickable) {
        addResult('Logout button is clickable', 'success');
      } else {
        addResult('Logout button is NOT clickable', 'error');
      }
    } else {
      addResult('Logout button not found', 'error');
    }

    // Test 4: Check sidebar toggle buttons
    const toggleButtons = document.querySelectorAll('button[onClick*="toggle"], button[aria-label*="menu"]');
    if (toggleButtons.length > 0) {
      addResult(`Found ${toggleButtons.length} toggle buttons`, 'success');
    } else {
      addResult('No toggle buttons found', 'error');
    }

    // Test 5: Check current page highlighting
    const activeMenuItem = document.querySelector('.nav-item-active');
    if (activeMenuItem) {
      addResult('Active menu item is highlighted', 'success');
    } else {
      addResult('No active menu item found', 'info');
    }

    addResult('Menu navigation test completed', 'info');
  };

  const testResponsiveNavigation = () => {
    addResult('Testing responsive navigation...', 'info');
    
    // Test mobile menu button
    const mobileMenuButton = document.querySelector('button[class*="lg:hidden"]');
    if (mobileMenuButton) {
      addResult('Mobile menu button found', 'success');
    } else {
      addResult('Mobile menu button not found', 'error');
    }

    // Test sidebar visibility
    const sidebar = document.querySelector('aside');
    if (sidebar) {
      const isVisible = window.getComputedStyle(sidebar).display !== 'none';
      if (isVisible) {
        addResult('Sidebar is visible', 'success');
      } else {
        addResult('Sidebar is hidden', 'info');
      }
    } else {
      addResult('Sidebar not found', 'error');
    }

    addResult('Responsive navigation test completed', 'info');
  };

  const simulateClicks = () => {
    addResult('Simulating menu clicks...', 'info');
    
    const menuLinks = document.querySelectorAll('nav a[href]');
    menuLinks.forEach((link, index) => {
      try {
        // Create a mock click event
        const clickEvent = new MouseEvent('click', {
          bubbles: true,
          cancelable: true,
          view: window
        });
        
        // Check if the link has an onClick handler
        const hasOnClick = link.getAttribute('onClick') || (link as HTMLElement).onclick;
        if (hasOnClick) {
          addResult(`Menu item ${index + 1} has click handler`, 'success');
        } else {
          addResult(`Menu item ${index + 1} relies on default link behavior`, 'info');
        }
        
        // Don't actually click to avoid navigation, just test the event
        addResult(`Menu item ${index + 1} click event can be created`, 'success');
      } catch (error) {
        addResult(`Menu item ${index + 1} click simulation failed: ${error}`, 'error');
      }
    });
    
    addResult('Click simulation completed', 'info');
  };

  useEffect(() => {
    // Run tests when component mounts
    setTimeout(() => {
      testMenuItems();
      testResponsiveNavigation();
      simulateClicks();
    }, 1000);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">Menu Navigation Test</h1>
        
        <div className="glass p-6 rounded-xl mb-6">
          <h2 className="text-xl font-semibold mb-4">Test Controls</h2>
          <div className="flex gap-4 flex-wrap">
            <button
              onClick={testMenuItems}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              Test Menu Items
            </button>
            <button
              onClick={testResponsiveNavigation}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
            >
              Test Responsive Navigation
            </button>
            <button
              onClick={simulateClicks}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
            >
              Simulate Clicks
            </button>
            <button
              onClick={() => setTestResults([])}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
            >
              Clear Results
            </button>
          </div>
        </div>

        <div className="glass p-6 rounded-xl">
          <h2 className="text-xl font-semibold mb-4">Test Results</h2>
          <div className="bg-black/30 rounded-lg p-4 h-96 overflow-y-auto font-mono text-sm">
            {testResults.length === 0 ? (
              <p className="text-white/50">No test results yet. Click the test buttons above.</p>
            ) : (
              testResults.map((result, index) => (
                <div 
                  key={index} 
                  className={`mb-1 ${
                    result.includes('SUCCESS') ? 'text-green-400' : 
                    result.includes('ERROR') ? 'text-red-400' : 
                    'text-blue-400'
                  }`}
                >
                  {result}
                </div>
              ))
            )}
          </div>
        </div>

        <div className="glass p-6 rounded-xl mt-6">
          <h2 className="text-xl font-semibold mb-4">Manual Test Instructions</h2>
          <div className="space-y-2 text-white/80">
            <p>1. Try clicking each menu item in the sidebar:</p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>Dashboard</li>
              <li>Log Trade</li>
              <li>Strategies</li>
              <li>Calendar</li>
              <li>Confluence</li>
            </ul>
            <p>2. Test the logout button</p>
            <p>3. Test the sidebar collapse/expand toggle</p>
            <p>4. Test mobile menu button (resize window to mobile size)</p>
            <p>5. Check if the current page is highlighted in the menu</p>
          </div>
        </div>
      </div>
    </div>
  );
}