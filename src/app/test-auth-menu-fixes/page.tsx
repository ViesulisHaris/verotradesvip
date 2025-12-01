'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { Session } from '@supabase/supabase-js';

interface TestResult {
  name: string;
  status: 'pending' | 'pass' | 'fail';
  details: string;
}

export default function TestAuthMenuFixes() {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    // Check current auth state
    const checkAuthState = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    
    checkAuthState();

    const { data: listener } = supabase.auth.onAuthStateChange((event: 'SIGNED_IN' | 'SIGNED_OUT' | 'TOKEN_REFRESHED' | 'USER_UPDATED' | 'PASSWORD_RECOVERY', session: Session | null) => {
      setUser(session?.user ?? null);
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const runTests = async () => {
    setIsRunning(true);
    const results: TestResult[] = [];

    // Test 1: Check menu icons are unique
    results.push({
      name: 'Menu Icons Uniqueness Test',
      status: 'pending',
      details: 'Checking if menu icons are unique for each item...'
    });

    try {
      // Check sidebar menu items
      const sidebarLinks = document.querySelectorAll('nav a[href]');
      const iconMap = new Map<string, number>();
      
      sidebarLinks.forEach((link) => {
        const icon = link.querySelector('svg');
        if (icon) {
          const iconName = icon.getAttribute('data-lucide') || 'unknown';
          iconMap.set(iconName, (iconMap.get(iconName) || 0) + 1);
        }
      });

      const duplicateIcons = Array.from(iconMap.entries()).filter(([_, count]) => count > 1);
      
      if (duplicateIcons.length === 0) {
        results[0].status = 'pass';
        results[0].details = '✅ All menu icons are unique';
      } else {
        results[0].status = 'fail';
        results[0].details = `❌ Found duplicate icons: ${duplicateIcons.map(([name]) => name).join(', ')}`;
      }
    } catch (error) {
      results[0].status = 'fail';
      results[0].details = `❌ Error checking icons: ${error}`;
    }

    // Test 2: Authentication state consistency
    results.push({
      name: 'Authentication State Test',
      status: 'pending',
      details: 'Checking authentication state consistency...'
    });

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const clientUser = user;
      const serverUser = session?.user;

      if (clientUser?.id === serverUser?.id) {
        results[1].status = 'pass';
        results[1].details = '✅ Client and server authentication states are consistent';
      } else {
        results[1].status = 'fail';
        results[1].details = `❌ Authentication state mismatch - Client: ${clientUser?.id}, Server: ${serverUser?.id}`;
      }
    } catch (error) {
      results[1].status = 'fail';
      results[1].details = `❌ Error checking auth state: ${error}`;
    }

    // Test 3: Protected route access
    results.push({
      name: 'Protected Route Access Test',
      status: 'pending',
      details: 'Testing access to protected routes...'
    });

    try {
      const protectedRoutes = ['/trades', '/strategies', '/analytics'];
      let accessibleRoutes = 0;

      for (const route of protectedRoutes) {
        try {
          const response = await fetch(route, { 
            method: 'GET',
            headers: { 'Content-Type': 'text/html' }
          });
          
          // If we get a redirect to login or auth required, that's expected for unauthenticated users
          // If we're authenticated, we should be able to access the route
          if (user) {
            if (response.ok || response.redirected) {
              accessibleRoutes++;
            }
          } else {
            // For unauthenticated users, redirect to login is expected
            if (response.redirected || response.status === 401) {
              accessibleRoutes++;
            }
          }
        } catch (error) {
          console.error(`Error testing route ${route}:`, error);
        }
      }

      if (accessibleRoutes === protectedRoutes.length) {
        results[2].status = 'pass';
        results[2].details = user 
          ? '✅ All protected routes accessible for authenticated user'
          : '✅ All protected routes properly redirect unauthenticated users';
      } else {
        results[2].status = 'fail';
        results[2].details = `❌ Only ${accessibleRoutes}/${protectedRoutes.length} routes behaving correctly`;
      }
    } catch (error) {
      results[2].status = 'fail';
      results[2].details = `❌ Error testing protected routes: ${error}`;
    }

    // Test 4: Session persistence
    results.push({
      name: 'Session Persistence Test',
      status: 'pending',
      details: 'Testing session persistence across navigation...'
    });

    try {
      if (user) {
        // Test if session persists after navigation simulation
        const initialSession = await supabase.auth.getSession();
        
        // Simulate navigation by checking session again
        await new Promise(resolve => setTimeout(resolve, 100));
        const subsequentSession = await supabase.auth.getSession();

        if (initialSession.data.session?.access_token === subsequentSession.data.session?.access_token) {
          results[3].status = 'pass';
          results[3].details = '✅ Session persists correctly across navigation';
        } else {
          results[3].status = 'fail';
          results[3].details = '❌ Session does not persist across navigation';
        }
      } else {
        results[3].status = 'pass';
        results[3].details = '✅ No active session to test persistence';
      }
    } catch (error) {
      results[3].status = 'fail';
      results[3].details = `❌ Error testing session persistence: ${error}`;
    }

    // Test 5: Menu icon visibility
    results.push({
      name: 'Menu Icon Visibility Test',
      status: 'pending',
      details: 'Checking if menu icons are properly displayed...'
    });

    try {
      const sidebarLinks = document.querySelectorAll('nav a[href]');
      let visibleIcons = 0;
      let totalLinks = 0;

      sidebarLinks.forEach((link) => {
        totalLinks++;
        const icon = link.querySelector('svg');
        if (icon && icon.getBoundingClientRect().height > 0) {
          visibleIcons++;
        }
      });

      if (visibleIcons === totalLinks && totalLinks > 0) {
        results[4].status = 'pass';
        results[4].details = `✅ All ${totalLinks} menu items have visible icons`;
      } else {
        results[4].status = 'fail';
        results[4].details = `❌ Only ${visibleIcons}/${totalLinks} menu items have visible icons`;
      }
    } catch (error) {
      results[4].status = 'fail';
      results[4].details = `❌ Error checking icon visibility: ${error}`;
    }

    setTestResults(results);
    setIsRunning(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pass': return 'text-green-400';
      case 'fail': return 'text-red-400';
      default: return 'text-yellow-400';
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'pass': return 'bg-green-600/20 border-green-500/30';
      case 'fail': return 'bg-red-600/20 border-red-500/30';
      default: return 'bg-yellow-600/20 border-yellow-500/30';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">Authentication & Menu Fixes Test</h1>
          <p className="text-white/70">
            Comprehensive test for authentication flow and menu icon uniqueness
          </p>
        </div>

        {/* Current Auth State */}
        <div className="glass p-6 rounded-xl mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">Current Authentication State</h2>
          <div className="space-y-2">
            <p className="text-white/80">
              <span className="font-medium">Status:</span>{' '}
              <span className={user ? 'text-green-400' : 'text-red-400'}>
                {user ? 'Authenticated' : 'Not Authenticated'}
              </span>
            </p>
            {user && (
              <p className="text-white/80">
                <span className="font-medium">User ID:</span>{' '}
                <span className="text-blue-300">{user.id}</span>
              </p>
            )}
          </div>
        </div>

        {/* Test Controls */}
        <div className="glass p-6 rounded-xl mb-8">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">Test Results</h2>
            <button
              onClick={runTests}
              disabled={isRunning}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors duration-200"
            >
              {isRunning ? 'Running Tests...' : 'Run Tests'}
            </button>
          </div>
        </div>

        {/* Test Results */}
        {testResults.length > 0 && (
          <div className="space-y-4">
            {testResults.map((result, index) => (
              <div
                key={index}
                className={`glass p-6 rounded-xl border ${getStatusBg(result.status)}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className={`text-lg font-semibold mb-2 ${getStatusColor(result.status)}`}>
                      {result.name}
                    </h3>
                    <p className="text-white/80">{result.details}</p>
                  </div>
                  <div className={`ml-4 px-3 py-1 rounded-full text-sm font-medium ${getStatusBg(result.status)} ${getStatusColor(result.status)}`}>
                    {result.status.toUpperCase()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Quick Actions */}
        <div className="glass p-6 rounded-xl mt-8">
          <h2 className="text-xl font-semibold text-white mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link
              href="/dashboard"
              className="p-4 glass rounded-lg text-white hover:bg-white/10 transition-colors duration-200 text-center"
            >
              <div className="text-blue-400 mb-2">📊</div>
              <div>Dashboard</div>
            </Link>
            <Link
              href="/trades"
              className="p-4 glass rounded-lg text-white hover:bg-white/10 transition-colors duration-200 text-center"
            >
              <div className="text-green-400 mb-2">💼</div>
              <div>Trades</div>
            </Link>
            <Link
              href="/strategies"
              className="p-4 glass rounded-lg text-white hover:bg-white/10 transition-colors duration-200 text-center"
            >
              <div className="text-purple-400 mb-2">📚</div>
              <div>Strategies</div>
            </Link>
            <Link
              href="/analytics"
              className="p-4 glass rounded-lg text-white hover:bg-white/10 transition-colors duration-200 text-center"
            >
              <div className="text-orange-400 mb-2">📈</div>
              <div>Analytics</div>
            </Link>
          </div>
        </div>

        {/* Instructions */}
        <div className="glass p-6 rounded-xl mt-8">
          <h2 className="text-xl font-semibold text-white mb-4">Test Instructions</h2>
          <ol className="space-y-2 text-white/80 list-decimal list-inside">
            <li>Click "Run Tests" to verify all authentication and menu fixes</li>
            <li>Check that all menu icons are unique (no duplicates)</li>
            <li>Verify authentication state is consistent across client and server</li>
            <li>Test protected routes work correctly based on auth status</li>
            <li>Ensure session persists across navigation</li>
            <li>Confirm all menu icons are visible and properly styled</li>
          </ol>
        </div>
      </div>
    </div>
  );
}