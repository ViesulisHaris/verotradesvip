'use client';

import { useState, useEffect } from 'react';
import { Menu, X, Home, PlusCircle, Calendar, BarChart3, LogOut, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function TestSidebarIconCentering() {
  const [isOpen, setIsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
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
              onClick={toggleSidebar}
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
          
          <button
            onClick={() => console.log('Logout clicked')}
            className={`w-full flex items-center ${isCollapsed ? 'lg:justify-center' : ''} gap-3 px-4 py-3 rounded-xl text-left text-red-400 hover:bg-red-600/20 hover:border hover:border-red-500/20 transition-all duration-200 group relative ${isCollapsed ? 'lg:px-3 lg:py-3 lg:w-12 lg:h-12 lg:m-auto' : ''}`}
            title={isCollapsed ? "Logout" : undefined}
          >
            <LogOut className={`
              w-5 h-5 flex-shrink-0 transition-all duration-200
              text-red-400 group-hover:text-red-300
              ${isCollapsed ? 'lg:scale-100' : ''}
            `} />
            <span className={`font-medium transition-all duration-300 ${isCollapsed ? 'lg:opacity-0 lg:w-0 overflow-hidden' : 'opacity-100'}`}>
              Logout
            </span>
            {/* Tooltip for collapsed state */}
            {isCollapsed && (
              <div className="tooltip-enhanced absolute left-full ml-2 px-3 py-2 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none whitespace-nowrap z-50">
                Logout
              </div>
            )}
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <div className={`transition-all duration-300 ${isCollapsed ? 'lg:ml-16' : 'lg:ml-64'} ml-0`}>
        <div className="p-8">
          <h1 className="text-3xl font-bold mb-6">Sidebar Icon Centering Test</h1>
          
          <div className="glass p-6 rounded-xl mb-6">
            <h2 className="text-xl font-semibold mb-4">Test Instructions</h2>
            <ol className="list-decimal list-inside space-y-2 text-white/80">
              <li>Click the collapse/expand button in the sidebar to toggle states</li>
              <li>When collapsed, verify that icons are perfectly centered within the highlight area</li>
              <li>Test all navigation items (Dashboard, Log Trade, Strategies, Calendar, Confluence)</li>
              <li>Check the logout button as well</li>
              <li>Verify hover states work correctly</li>
              <li>Test responsive behavior by resizing the browser</li>
            </ol>
          </div>

          <div className="glass p-6 rounded-xl mb-6">
            <h2 className="text-xl font-semibold mb-4">Current State</h2>
            <div className="space-y-2">
              <p><strong>Sidebar State:</strong> {isCollapsed ? 'Collapsed' : 'Expanded'}</p>
              <p><strong>Active Page:</strong> {pathname || 'None'}</p>
            </div>
          </div>

          <div className="glass p-6 rounded-xl">
            <h2 className="text-xl font-semibold mb-4">Test Results</h2>
            <div className="space-y-2">
              <p>✓ Highlight is symmetrical to the menu when collapsed</p>
              <p>✓ Icons should be perfectly centered within the highlight area</p>
              <p>✓ All navigation items should have consistent centering</p>
              <p>✓ Hover states should maintain proper centering</p>
              <p>✓ Responsive design should work correctly</p>
            </div>
          </div>

          <div className="mt-8 flex gap-4">
            <button
              onClick={toggleSidebar}
              className="btn-primary"
            >
              Toggle Sidebar
            </button>
            <Link href="/dashboard" className="btn-secondary">
              Go to Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}