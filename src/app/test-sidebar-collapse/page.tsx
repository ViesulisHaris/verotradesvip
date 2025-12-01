'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/supabase/client';

export default function TestSidebarCollapsePage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarState, setSidebarState] = useState<string>('Unknown');

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    };
    
    checkAuth();
    
    // Check sidebar state from localStorage
    const savedState = localStorage.getItem('sidebar-collapsed');
    if (savedState !== null) {
      setSidebarState(JSON.parse(savedState) ? 'Collapsed' : 'Expanded');
    }
    
    // Listen for sidebar state changes
    const handleStorageChange = () => {
      const savedState = localStorage.getItem('sidebar-collapsed');
      if (savedState !== null) {
        setSidebarState(JSON.parse(savedState) ? 'Collapsed' : 'Expanded');
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('sidebar-state-changed', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('sidebar-state-changed', handleStorageChange);
    };
  }, []);

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
      <h2 className="text-3xl font-bold text-white">Sidebar Collapse Test</h2>
      
      <div className="glass p-6 rounded-xl">
        <h3 className="text-xl font-semibold mb-4 text-white">Test Instructions</h3>
        <ol className="list-decimal list-inside space-y-2 text-white/80">
          <li>Look for the sidebar on the left side of the screen</li>
          <li>Click the collapse/expand button (chevron icon) in the sidebar header</li>
          <li>Verify the sidebar smoothly animates between collapsed and expanded states</li>
          <li>Check that tooltips appear when hovering over collapsed menu items</li>
          <li>Refresh the page to verify state persistence</li>
          <li>Test on different screen sizes (desktop, tablet, mobile)</li>
        </ol>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass p-6 rounded-xl">
          <h3 className="text-xl font-semibold mb-4 text-white">Current Status</h3>
          <div className="space-y-2">
            <p className="text-white/80">
              <span className="font-medium">User:</span> {user.email}
            </p>
            <p className="text-white/80">
              <span className="font-medium">Sidebar State:</span> 
              <span className={`ml-2 px-2 py-1 rounded text-sm ${sidebarState === 'Collapsed' ? 'bg-orange-600/20 text-orange-300' : 'bg-green-600/20 text-green-300'}`}>
                {sidebarState}
              </span>
            </p>
          </div>
        </div>

        <div className="glass p-6 rounded-xl">
          <h3 className="text-xl font-semibold mb-4 text-white">Test Results</h3>
          <div className="space-y-2">
            <label className="flex items-center space-x-2 text-white/80">
              <input type="checkbox" className="rounded" />
              <span>Collapse button visible and functional</span>
            </label>
            <label className="flex items-center space-x-2 text-white/80">
              <input type="checkbox" className="rounded" />
              <span>Smooth animation between states</span>
            </label>
            <label className="flex items-center space-x-2 text-white/80">
              <input type="checkbox" className="rounded" />
              <span>Tooltips appear on collapsed items</span>
            </label>
            <label className="flex items-center space-x-2 text-white/80">
              <input type="checkbox" className="rounded" />
              <span>State persists after refresh</span>
            </label>
            <label className="flex items-center space-x-2 text-white/80">
              <input type="checkbox" className="rounded" />
              <span>Mobile responsiveness maintained</span>
            </label>
          </div>
        </div>
      </div>

      <div className="glass p-6 rounded-xl">
        <h3 className="text-xl font-semibold mb-4 text-white">Manual Tests</h3>
        <div className="space-y-4">
          <div className="border-l-4 border-blue-500 pl-4">
            <h4 className="font-medium text-white mb-2">Test 1: Basic Collapse/Expand</h4>
            <p className="text-white/70 text-sm">Click the chevron button in the sidebar header multiple times to toggle between states.</p>
          </div>
          <div className="border-l-4 border-green-500 pl-4">
            <h4 className="font-medium text-white mb-2">Test 2: State Persistence</h4>
            <p className="text-white/70 text-sm">Collapse the sidebar, refresh the page (F5), and verify it remains collapsed.</p>
          </div>
          <div className="border-l-4 border-purple-500 pl-4">
            <h4 className="font-medium text-white mb-2">Test 3: Responsive Behavior</h4>
            <p className="text-white/70 text-sm">Resize your browser window to test tablet and mobile views.</p>
          </div>
          <div className="border-l-4 border-orange-500 pl-4">
            <h4 className="font-medium text-white mb-2">Test 4: Tooltip Functionality</h4>
            <p className="text-white/70 text-sm">Collapse the sidebar and hover over menu items to see tooltips.</p>
          </div>
        </div>
      </div>

      <div className="glass p-6 rounded-xl">
        <h3 className="text-xl font-semibold mb-4 text-white">Keyboard Shortcuts</h3>
        <p className="text-white/70 mb-2">Press <kbd className="px-2 py-1 bg-slate-700 rounded text-sm">Ctrl + B</kbd> to toggle the sidebar.</p>
        <p className="text-white/70 text-sm">This keyboard shortcut is now implemented and working!</p>
      </div>
    </div>
  );
}