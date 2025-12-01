'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/supabase/client';
import { useRouter } from 'next/navigation';

export default function TestAuthRevert() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [testResult, setTestResult] = useState<string>('');
  const router = useRouter();

  useEffect(() => {
    // Check current auth state
    const checkAuth = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
        setTestResult(user ? `✅ User authenticated: ${user.email}` : '❌ No user authenticated');
      } catch (error) {
        console.error('Auth check error:', error);
        setTestResult(`❌ Auth check error: ${error}`);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event: string, session: any) => {
      setUser(session?.user ?? null);
      setTestResult(session?.user ? `✅ User authenticated: ${session.user.email}` : '❌ No user authenticated');
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleTestLogin = async () => {
    setLoading(true);
    setTestResult('Testing login...');
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: 'testuser@verotrade.com',
        password: 'TestPassword123!'
      });
      
      if (error) {
        setTestResult(`❌ Login failed: ${error.message}`);
      } else if (data.user) {
        setTestResult(`✅ Login successful: ${data.user.email}`);
        setUser(data.user);
      } else {
        setTestResult('❌ Login failed: No user data returned');
      }
    } catch (error) {
      setTestResult(`❌ Login exception: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const handleTestLogout = async () => {
    setLoading(true);
    setTestResult('Testing logout...');
    
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        setTestResult(`❌ Logout failed: ${error.message}`);
      } else {
        setTestResult('✅ Logout successful');
        setUser(null);
      }
    } catch (error) {
      setTestResult(`❌ Logout exception: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const handleTestTradesAccess = () => {
    router.push('/trades');
  };

  return (
    <div className="min-h-screen p-8 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-white mb-6">Authentication Revert Test</h1>
        
        <div className="glass p-6 rounded-xl">
          <h2 className="text-xl font-semibold text-white mb-4">Current Authentication Status</h2>
          <div className="space-y-2">
            <p className="text-white/80">Loading: {loading ? 'Yes' : 'No'}</p>
            <p className="text-white/80">User: {user ? user.email : 'None'}</p>
            <p className="text-white/80">User ID: {user ? user.id : 'None'}</p>
          </div>
        </div>

        <div className="glass p-6 rounded-xl">
          <h2 className="text-xl font-semibold text-white mb-4">Test Result</h2>
          <p className="text-white/80 font-mono">{testResult || 'No test run yet'}</p>
        </div>

        <div className="glass p-6 rounded-xl">
          <h2 className="text-xl font-semibold text-white mb-4">Test Actions</h2>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={handleTestLogin}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed"
            >
              Test Login
            </button>
            
            <button
              onClick={handleTestLogout}
              disabled={loading}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed"
            >
              Test Logout
            </button>
            
            <button
              onClick={handleTestTradesAccess}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Test Trades Access
            </button>
          </div>
        </div>

        <div className="glass p-6 rounded-xl">
          <h2 className="text-xl font-semibold text-white mb-4">Test Instructions</h2>
          <ol className="list-decimal list-inside space-y-2 text-white/80">
            <li>Click "Test Login" to verify login functionality works</li>
            <li>Check if the test result shows successful authentication</li>
            <li>Click "Test Trades Access" to verify you can access the trades page</li>
            <li>Verify that the trades page loads without "Authentication Required" error</li>
            <li>Click "Test Logout" to verify logout functionality</li>
          </ol>
        </div>
      </div>
    </div>
  );
}