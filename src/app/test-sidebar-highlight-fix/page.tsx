'use client';

import { useState, useEffect } from 'react';
import { Menu, X, Home, PlusCircle, Calendar, BarChart3, LogOut, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function TestSidebarHighlightFix() {
  const [isOpen, setIsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [testResults, setTestResults] = useState<string[]>([]);
  const pathname = usePathname();

  // Load sidebar state from localStorage on mount
  useEffect(() => {
    try {
      const savedState = localStorage.getItem('sidebar-collapsed');
      if (savedState !== null) {
        const parsedState = JSON.parse(savedState);
        setIsCollapsed(parsedState);
      }
    } catch (error) {
      console.error('Error loading sidebar state:', error);
    }
  }, []);

  // Save sidebar state to localStorage when it changes
  useEffect(() => {
    try {
      localStorage.setItem('sidebar-collapsed', JSON.stringify(isCollapsed));
    } catch (error) {
      console.error('Error saving sidebar state:', error);
    }
  }, [isCollapsed]);

  const links = [
    { href: '/dashboard', label: 'Dashboard', icon: Home },
    { href: '/log-trade', label: 'Log Trade', icon: PlusCircle },
    { href: '/strategies', label: 'Strategies', icon: BarChart3 },
    { href: '/calendar', label: 'Calendar', icon: Calendar },
    { href: '/confluence', label: 'Confluence', icon: BarChart3 },
  ];

  const toggleSidebar = () => {
    setIsCollapsed(prev => !prev);
  };

  const runAlignmentTest = () => {
    const results = [];
    
    // Test 1: Check if sidebar has correct collapsed class
    const sidebar = document.querySelector('.sidebar-collapsed');
    if (sidebar) {
      results.push('✅ Sidebar has sidebar-collapsed class');
    } else {
      results.push('❌ Sidebar missing sidebar-collapsed class');
    }

    // Test 2: Check active navigation item
    const activeNavItem = document.querySelector('.nav-item-active');
    if (activeNavItem) {
      results.push('✅ Active navigation item found');
      
      // Test 3: Check computed styles
      const computedStyles = window.getComputedStyle(activeNavItem);
      const width = computedStyles.width;
      const height = computedStyles.height;
      const display = computedStyles.display;
      const alignItems = computedStyles.alignItems;
      const justifyContent = computedStyles.justifyContent;
      
      results.push(`📏 Active item dimensions: ${width} x ${height}`);
      results.push(`🎯 Display: ${display}, Align: ${alignItems}, Justify: ${justifyContent}`);
      
      // Test 4: Check if icon is centered
      const icon = activeNavItem.querySelector('svg');
      if (icon) {
        const iconRect = icon.getBoundingClientRect();
        const containerRect = activeNavItem.getBoundingClientRect();
        
        const iconCenterX = iconRect.left + iconRect.width / 2;
        const iconCenterY = iconRect.top + iconRect.height / 2;
        const containerCenterX = containerRect.left + containerRect.width / 2;
        const containerCenterY = containerRect.top + containerRect.height / 2;
        
        const xOffset = Math.abs(iconCenterX - containerCenterX);
        const yOffset = Math.abs(iconCenterY - containerCenterY);
        
        results.push(`🎯 Icon center offset: X=${xOffset.toFixed(2)}px, Y=${yOffset.toFixed(2)}px`);
        
        if (xOffset < 1 && yOffset < 1) {
          results.push('✅ Icon is perfectly centered');
        } else {
          results.push('❌ Icon is not perfectly centered');
        }
      }
    } else {
      results.push('❌ No active navigation item found');
    }

    setTestResults(results);
  };

  const toggleSidebarTest = () => {
    toggleSidebar();
    setTimeout(() => {
      runAlignmentTest();
    }, 350); // Wait for transition to complete
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white">
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed top-4 left-4 z-50 p-3 glass rounded-xl lg:hidden hover:bg-blue-600/20 transition-colors duration-200"
      >
        <Menu className="w-6 h-6 text-white" />
      </button>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 glass border-r border-blue-500/20 transform transition-all duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0
        ${isCollapsed ? 'lg:w-16 sidebar-collapsed' : 'lg:w-64 sidebar-expanded'} w-64
      `}>
        <div className={`flex items-center justify-end p-4 border-b border-blue-500/20 ${isCollapsed ? 'lg:justify-center' : ''}`}>
          <div className={`flex items-center ${isCollapsed ? 'lg:justify-center' : 'gap-2'}`}>
            {/* Desktop Collapse Toggle - Always visible on desktop */}
            <button
              onClick={toggleSidebarTest}
              className="hidden lg:flex p-2 rounded-lg hover:bg-blue-600/20 transition-all duration-200 items-center justify-center"
              title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {isCollapsed ? (
                <ChevronRight className="w-5 h-5 text-white hover:text-blue-300 transition-colors" />
              ) : (
                <ChevronLeft className="w-5 h-5 text-white hover:text-blue-300 transition-colors" />
              )}
            </button>
            
            {/* Mobile Close Button */}
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 rounded-lg hover:bg-blue-600/20 lg:hidden transition-all duration-200"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        <nav className={`p-4 space-y-2 ${isCollapsed ? 'lg:px-2' : ''}`}>
          {links.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`
                flex items-center ${isCollapsed ? 'lg:justify-center' : ''} gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative
                ${pathname === href
                  ? 'nav-item-active bg-blue-600/20 border border-blue-500/30'
                  : 'text-white/70 hover:bg-blue-600/10 hover:border hover:border-blue-500/20 hover:text-white'
                }
                ${isCollapsed ? 'lg:px-3 lg:py-3 lg:w-12 lg:h-12 lg:m-auto' : ''}
              `}
              onClick={() => setIsOpen(false)}
              title={isCollapsed ? label : undefined}
            >
              <Icon className={`
                w-5 h-5 transition-all duration-200 flex-shrink-0
                ${pathname === href
                  ? 'text-blue-300'
                  : 'text-white/70 group-hover:text-blue-300'
                }
                ${isCollapsed ? 'lg:scale-100' : ''}
              `} />
              <span className={`font-medium transition-all duration-300 ${isCollapsed ? 'lg:opacity-0 lg:w-0 overflow-hidden' : 'opacity-100'}`}>
                {label}
              </span>
              {/* Tooltip for collapsed state */}
              {isCollapsed && (
                <div className="tooltip-enhanced absolute left-full ml-2 px-3 py-2 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none whitespace-nowrap z-50">
                  {label}
                </div>
              )}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <div className={`transition-all duration-300 ${isCollapsed ? 'lg:ml-16' : 'lg:ml-64'} ml-0`}>
        <div className="p-8">
          <h1 className="text-3xl font-bold mb-6 text-gradient">Sidebar Highlight Alignment Test</h1>
          
          <div className="glass p-6 rounded-xl mb-6">
            <h2 className="text-xl font-semibold mb-4">Test Controls</h2>
            <div className="flex flex-wrap gap-4">
              <button
                onClick={runAlignmentTest}
                className="btn-primary"
              >
                Run Alignment Test
              </button>
              <button
                onClick={toggleSidebarTest}
                className="btn-secondary"
              >
                Toggle Sidebar & Test
              </button>
              <Link
                href="/dashboard"
                className="btn-secondary"
              >
                Go to Dashboard
              </Link>
            </div>
          </div>

          {testResults.length > 0 && (
            <div className="glass p-6 rounded-xl mb-6">
              <h2 className="text-xl font-semibold mb-4">Test Results</h2>
              <div className="space-y-2 font-mono text-sm">
                {testResults.map((result, index) => (
                  <div key={index} className={result.startsWith('✅') ? 'text-green-400' : result.startsWith('❌') ? 'text-red-400' : 'text-blue-300'}>
                    {result}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="glass p-6 rounded-xl">
            <h2 className="text-xl font-semibold mb-4">Test Instructions</h2>
            <ol className="list-decimal list-inside space-y-2 text-white/80">
              <li>Click "Run Alignment Test" to check current highlight positioning</li>
              <li>Click "Toggle Sidebar & Test" to collapse/expand and automatically test</li>
              <li>Navigate to different pages to test active state changes</li>
              <li>Check that the blue highlight is perfectly centered on icons in collapsed state</li>
              <li>Verify there's no 8-12px upward shift when sidebar is collapsed</li>
              <li>Test hover states and transitions</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}