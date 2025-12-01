'use client';

import { useState } from 'react';
import UnifiedSidebar from '@/components/navigation/UnifiedSidebar';

export default function TestSidebarLogoHighlightFix() {
  const [sidebarState, setSidebarState] = useState({
    isCollapsed: false,
    activePage: '/dashboard'
  });

  const handleLogout = () => {
    console.log('Logout clicked');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <UnifiedSidebar />
      
      <div className={`transition-all duration-300 ${sidebarState.isCollapsed ? 'lg:ml-16' : 'lg:ml-64'}`}>
        <div className="p-8">
          <h1 className="text-3xl font-bold text-white mb-6">Sidebar Logo & Highlight Fix Test</h1>
          
          <div className="glass p-6 rounded-xl mb-6">
            <h2 className="text-xl font-semibold text-white mb-4">Test Instructions</h2>
            <div className="space-y-3 text-white/80">
              <p>✅ <strong>VT Logo Removal:</strong> Verify that the VT logo is completely removed from the sidebar header.</p>
              <p>✅ <strong>Highlight Centering:</strong> Toggle the sidebar and verify that highlights are centered around icons in collapsed state.</p>
              <p>✅ <strong>Responsive Testing:</strong> Test on different screen sizes (desktop, tablet, mobile).</p>
              <p>✅ <strong>Navigation Testing:</strong> Click through all navigation items to test highlight behavior.</p>
            </div>
          </div>

          <div className="glass p-6 rounded-xl mb-6">
            <h2 className="text-xl font-semibold text-white mb-4">Current State</h2>
            <div className="space-y-2 text-white/80">
              <p>Sidebar State: <span className="text-blue-300 font-medium">{sidebarState.isCollapsed ? 'Collapsed' : 'Expanded'}</span></p>
              <p>Active Page: <span className="text-blue-300 font-medium">{sidebarState.activePage}</span></p>
            </div>
          </div>

          <div className="glass p-6 rounded-xl mb-6">
            <h2 className="text-xl font-semibold text-white mb-4">Test Navigation Links</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[
                { href: '/dashboard', label: 'Dashboard' },
                { href: '/log-trade', label: 'Log Trade' },
                { href: '/strategies', label: 'Strategies' },
                { href: '/calendar', label: 'Calendar' },
                { href: '/confluence', label: 'Confluence' },
                { href: '/trades', label: 'Trades' },
                { href: '/analytics', label: 'Analytics' },
              ].map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="glass px-4 py-2 rounded-lg text-white/80 hover:text-white hover:bg-blue-600/20 transition-all duration-200 text-center"
                  onClick={() => setSidebarState(prev => ({ ...prev, activePage: item.href }))}
                >
                  {item.label}
                </a>
              ))}
            </div>
          </div>

          <div className="glass p-6 rounded-xl">
            <h2 className="text-xl font-semibold text-white mb-4">Visual Verification Checklist</h2>
            <div className="space-y-2 text-white/80">
              <label className="flex items-center space-x-2">
                <input type="checkbox" className="rounded" />
                <span>VT logo is completely removed from sidebar header</span>
              </label>
              <label className="flex items-center space-x-2">
                <input type="checkbox" className="rounded" />
                <span>Sidebar header shows only collapse/expand toggle button</span>
              </label>
              <label className="flex items-center space-x-2">
                <input type="checkbox" className="rounded" />
                <span>Highlight is properly centered around icons in collapsed state</span>
              </label>
              <label className="flex items-center space-x-2">
                <input type="checkbox" className="rounded" />
                <span>No highlight shifting to the side when sidebar is collapsed</span>
              </label>
              <label className="flex items-center space-x-2">
                <input type="checkbox" className="rounded" />
                <span>Smooth transitions between expanded and collapsed states</span>
              </label>
              <label className="flex items-center space-x-2">
                <input type="checkbox" className="rounded" />
                <span>Proper spacing and alignment after logo removal</span>
              </label>
              <label className="flex items-center space-x-2">
                <input type="checkbox" className="rounded" />
                <span>Mobile responsive behavior works correctly</span>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}