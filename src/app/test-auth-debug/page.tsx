'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/supabase/client';

export default function AuthDebugPage() {
  const [envInfo, setEnvInfo] = useState<any>({});
  const [sessionInfo, setSessionInfo] = useState<any>({});
  const [connectionStatus, setConnectionStatus] = useState<string>('Checking...');
  const [authConfig, setAuthConfig] = useState<any>({});

  useEffect(() => {
    // Check environment variables
    const environmentInfo = {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || 'NOT FOUND',
      supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'MISSING',
      nodeEnv: process.env.NODE_ENV || 'NOT FOUND',
      isBrowser: typeof window !== 'undefined',
      hasLocalStorage: typeof window !== 'undefined' && !!window.localStorage,
      hasCookies: typeof window !== 'undefined' && !!navigator.cookieEnabled,
      timestamp: new Date().toISOString()
    };
    
    setEnvInfo(environmentInfo);
    
    // Check Supabase connection
    const checkConnection = async () => {
      try {
        console.log('🔍 [DEBUG] Testing Supabase connection...');
        
        // Test basic connection
        const { data, error } = await supabase.from('information_schema.tables').select('table_name').limit(1);
        
        if (error) {
          console.error('❌ [DEBUG] Connection test failed:', error);
          setConnectionStatus(`FAILED: ${error.message}`);
        } else {
          console.log('✅ [DEBUG] Connection test successful');
          setConnectionStatus('SUCCESS');
        }
      } catch (err) {
        console.error('❌ [DEBUG] Connection test exception:', err);
        setConnectionStatus(`EXCEPTION: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    };
    
    // Check current session
    const checkSession = async () => {
      try {
        console.log('🔍 [DEBUG] Checking current session...');
        
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ [DEBUG] Session check failed:', error);
          setSessionInfo({ error: error.message });
        } else {
          console.log('✅ [DEBUG] Session check result:', session);
          setSessionInfo({
            hasSession: !!session,
            userId: session?.user?.id,
            email: session?.user?.email,
            expiresAt: session?.expires_at,
            accessToken: session?.access_token ? 'PRESENT' : 'MISSING',
            refreshToken: session?.refresh_token ? 'PRESENT' : 'MISSING'
          });
        }
      } catch (err) {
        console.error('❌ [DEBUG] Session check exception:', err);
        setSessionInfo({ error: err instanceof Error ? err.message : 'Unknown error' });
      }
    };
    
    // Get auth configuration
    const getAuthConfig = () => {
      try {
        // Access the Supabase client configuration
        const client = supabase;
        const config = {
          supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
          hasAuth: !!client.auth,
          hasRealtime: !!client.realtime,
          hasStorage: !!client.storage,
          hasFrom: !!client.from,
          authMethods: Object.keys(client.auth || {})
        };
        
        console.log('🔍 [DEBUG] Auth configuration:', config);
        setAuthConfig(config);
      } catch (err) {
        console.error('❌ [DEBUG] Auth config exception:', err);
        setAuthConfig({ error: err instanceof Error ? err.message : 'Unknown error' });
      }
    };
    
    // Check cookies
    const checkCookies = () => {
      try {
        if (typeof window === 'undefined') return;
        
        const cookies = document.cookie.split(';').reduce((acc, cookie) => {
          const [key, value] = cookie.trim().split('=');
          if (key) {
            acc[key] = value || 'EMPTY';
          }
          return acc;
        }, {} as Record<string, string>);
        
        const authCookies = Object.keys(cookies).filter(key => 
          key.includes('sb-') || 
          key.includes('supabase') ||
          key.includes('auth')
        );
        
        console.log('🔍 [DEBUG] Found cookies:', authCookies);
        
        return {
          totalCookies: Object.keys(cookies).length,
          authCookies: authCookies.length,
          authCookieNames: authCookies
        };
      } catch (err) {
        console.error('❌ [DEBUG] Cookie check exception:', err);
        return { error: err instanceof Error ? err.message : 'Unknown error' };
      }
    };
    
    // Run all checks
    checkConnection();
    checkSession();
    getAuthConfig();
    const cookieInfo = checkCookies();
    
    // Add cookie info to state
    setEnvInfo((prev: any) => ({ ...prev, cookies: cookieInfo }));
    
    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event: any, session: any) => {
      console.log('🔄 [DEBUG] Auth state change:', { event, hasSession: !!session });
      setSessionInfo((prev: any) => ({
        ...prev,
        lastEvent: event,
        lastEventTime: new Date().toISOString()
      }));
    });
    
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Authentication Debug Page</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Environment Variables */}
          <div className="bg-slate-800 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Environment Variables</h2>
            <pre className="text-sm bg-slate-700 p-4 rounded overflow-auto">
              {JSON.stringify(envInfo, null, 2)}
            </pre>
          </div>
          
          {/* Connection Status */}
          <div className="bg-slate-800 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Connection Status</h2>
            <div className="space-y-2">
              <p><strong>Status:</strong> {connectionStatus}</p>
              <p><strong>Timestamp:</strong> {new Date().toISOString()}</p>
            </div>
          </div>
          
          {/* Session Information */}
          <div className="bg-slate-800 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Session Information</h2>
            <pre className="text-sm bg-slate-700 p-4 rounded overflow-auto">
              {JSON.stringify(sessionInfo, null, 2)}
            </pre>
          </div>
          
          {/* Auth Configuration */}
          <div className="bg-slate-800 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Auth Configuration</h2>
            <pre className="text-sm bg-slate-700 p-4 rounded overflow-auto">
              {JSON.stringify(authConfig, null, 2)}
            </pre>
          </div>
        </div>
        
        {/* Test Authentication Button */}
        <div className="mt-8 bg-slate-800 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Test Authentication</h2>
          <div className="space-y-4">
            <button
              onClick={async () => {
                try {
                  console.log('🧪 [DEBUG] Testing sign in...');
                  const { data, error } = await supabase.auth.signInWithPassword({
                    email: 'testuser@verotrade.com',
                    password: 'TestPassword123!'
                  });
                  
                  if (error) {
                    console.error('❌ [DEBUG] Sign in test failed:', error);
                    alert(`Sign in failed: ${error.message}`);
                  } else {
                    console.log('✅ [DEBUG] Sign in test successful:', data);
                    alert('Sign in successful! Check console for details.');
                  }
                } catch (err) {
                  console.error('❌ [DEBUG] Sign in test exception:', err);
                  alert(`Sign in exception: ${err instanceof Error ? err.message : 'Unknown error'}`);
                }
              }}
              className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded"
            >
              Test Sign In
            </button>
            
            <button
              onClick={async () => {
                try {
                  console.log('🧪 [DEBUG] Testing sign out...');
                  const { error } = await supabase.auth.signOut();
                  
                  if (error) {
                    console.error('❌ [DEBUG] Sign out test failed:', error);
                    alert(`Sign out failed: ${error.message}`);
                  } else {
                    console.log('✅ [DEBUG] Sign out test successful');
                    alert('Sign out successful!');
                  }
                } catch (err) {
                  console.error('❌ [DEBUG] Sign out test exception:', err);
                  alert(`Sign out exception: ${err instanceof Error ? err.message : 'Unknown error'}`);
                }
              }}
              className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded ml-4"
            >
              Test Sign Out
            </button>
            
            <button
              onClick={async () => {
                try {
                  console.log('🧪 [DEBUG] Testing session refresh...');
                  const { data, error } = await supabase.auth.refreshSession();
                  
                  if (error) {
                    console.error('❌ [DEBUG] Session refresh failed:', error);
                    alert(`Session refresh failed: ${error.message}`);
                  } else {
                    console.log('✅ [DEBUG] Session refresh successful:', data);
                    alert('Session refresh successful! Check console for details.');
                  }
                } catch (err) {
                  console.error('❌ [DEBUG] Session refresh exception:', err);
                  alert(`Session refresh exception: ${err instanceof Error ? err.message : 'Unknown error'}`);
                }
              }}
              className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded ml-4"
            >
              Test Session Refresh
            </button>
          </div>
        </div>
        
        {/* Console Logs */}
        <div className="mt-8 bg-slate-800 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Console Logs</h2>
          <p className="text-sm text-gray-400">
            Check the browser console for detailed authentication logs. All authentication actions are logged with [DEBUG] prefix.
          </p>
        </div>
      </div>
    </div>
  );
}