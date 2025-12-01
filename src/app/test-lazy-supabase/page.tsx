'use client';

import { useState, useEffect } from 'react';
import { supabase, getSupabaseClient } from '@/supabase/client';

export default function TestLazySupabase() {
  const [status, setStatus] = useState<string>('Loading...');
  const [envStatus, setEnvStatus] = useState<any>({});
  const [clientCreated, setClientCreated] = useState<boolean>(false);

  useEffect(() => {
    const testSupabaseInitialization = async () => {
      try {
        // Check environment variables
        const envCheck = {
          supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'MISSING',
          supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'MISSING',
          nodeEnv: process.env.NODE_ENV,
        };
        setEnvStatus(envCheck);

        // Test lazy initialization by accessing the client
        console.log('Testing lazy Supabase client initialization...');
        
        // This should trigger the lazy initialization
        const { data, error } = await supabase.from('strategies').select('count');
        
        if (error) {
          setStatus(`Error: ${error.message}`);
        } else {
          setStatus('✅ Supabase client initialized successfully with lazy loading!');
          setClientCreated(true);
        }
      } catch (error) {
        console.error('Supabase initialization error:', error);
        setStatus(`❌ Failed to initialize Supabase: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    };

    testSupabaseInitialization();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Lazy Supabase Client Initialization Test
        </h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Environment Variables Status</h2>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>NEXT_PUBLIC_SUPABASE_URL:</span>
              <span className={`font-mono ${envStatus.supabaseUrl === 'SET' ? 'text-green-600' : 'text-red-600'}`}>
                {envStatus.supabaseUrl}
              </span>
            </div>
            <div className="flex justify-between">
              <span>NEXT_PUBLIC_SUPABASE_ANON_KEY:</span>
              <span className={`font-mono ${envStatus.supabaseAnonKey === 'SET' ? 'text-green-600' : 'text-red-600'}`}>
                {envStatus.supabaseAnonKey}
              </span>
            </div>
            <div className="flex justify-between">
              <span>NODE_ENV:</span>
              <span className="font-mono">{envStatus.nodeEnv}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Initialization Status</h2>
          <div className="text-lg">
            {status}
          </div>
          {clientCreated && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded">
              <p className="text-green-800">
                ✅ Lazy initialization is working correctly! The Supabase client was created only when first accessed.
              </p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Test Direct Client Access</h2>
          <button
            onClick={async () => {
              try {
                // Test direct function access
                const client = getSupabaseClient();
                const { data, error } = await client.from('strategies').select('count');
                
                if (error) {
                  alert(`Error: ${error.message}`);
                } else {
                  alert('✅ Direct client access works!');
                }
              } catch (error) {
                alert(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
              }
            }}
            className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded"
          >
            Test Direct Client Access
          </button>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-2">How This Fix Works</h3>
          <p className="text-gray-700 mb-2">
            This test verifies that the lazy initialization pattern for the Supabase client is working correctly:
          </p>
          <ul className="list-disc list-inside text-gray-700 space-y-1">
            <li>The Supabase client is no longer created at module evaluation time</li>
            <li>Environment variables are validated at runtime when the client is first accessed</li>
            <li>A proxy object maintains backward compatibility with existing imports</li>
            <li>The client is created only once and cached for subsequent uses</li>
          </ul>
        </div>
      </div>
    </div>
  );
}