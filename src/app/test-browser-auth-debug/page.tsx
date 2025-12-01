'use client';

import { useEffect, useState } from 'react';

export default function TestBrowserAuthDebug() {
  const [envVars, setEnvVars] = useState<any>({});
  const [supabaseStatus, setSupabaseStatus] = useState<string>('Loading...');
  const [authStatus, setAuthStatus] = useState<string>('Loading...');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    // Test environment variables in browser
    setEnvVars({
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ SET' : '❌ MISSING',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ SET' : '❌ MISSING',
    });

    // Test Supabase client creation
    const testSupabaseConnection = async () => {
      try {
        const { createClient } = await import('@supabase/supabase-js');
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        
        if (!supabaseUrl || !supabaseAnonKey) {
          setSupabaseStatus('❌ Missing environment variables');
          return;
        }

        const supabase = createClient(supabaseUrl, supabaseAnonKey);
        setSupabaseStatus('✅ Supabase client created');

        // Test auth session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          setAuthStatus(`❌ Auth error: ${error.message}`);
          setError(error.stack || '');
        } else {
          setAuthStatus(`✅ Auth session retrieved: ${session ? 'User logged in' : 'No active session'}`);
        }

        // Test a simple RPC call to verify connection
        try {
          const { data, error } = await supabase.rpc('get_current_timestamp');
          if (error) {
            console.log('RPC call failed:', error);
          } else {
            console.log('RPC call success:', data);
          }
        } catch (rpcError) {
          console.log('RPC call exception:', rpcError);
        }

      } catch (err: any) {
        setSupabaseStatus(`❌ Error: ${err.message}`);
        setError(err.stack || '');
      }
    };

    testSupabaseConnection();
  }, []);

  return (
    <div className="min-h-screen bg-[#121212] text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Browser Authentication Debug Test</h1>
        
        <div className="space-y-6">
          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Environment Variables</h2>
            <div className="space-y-2">
              <div>NEXT_PUBLIC_SUPABASE_URL: {envVars.NEXT_PUBLIC_SUPABASE_URL}</div>
              <div>NEXT_PUBLIC_SUPABASE_ANON_KEY: {envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY}</div>
            </div>
          </div>

          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Supabase Connection</h2>
            <div>{supabaseStatus}</div>
          </div>

          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Authentication Status</h2>
            <div>{authStatus}</div>
          </div>

          {error && (
            <div className="bg-red-900 p-6 rounded-lg">
              <h2 className="text-xl font-semibold mb-4">Error Details</h2>
              <pre className="whitespace-pre-wrap text-sm">{error}</pre>
            </div>
          )}

          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Browser Console</h2>
            <p className="text-gray-400">Check the browser console for additional debug information</p>
          </div>
        </div>
      </div>
    </div>
  );
}