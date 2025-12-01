'use client';

import { useEffect, useState } from 'react';

export default function TestBrowserEnv() {
  const [envInfo, setEnvInfo] = useState<any>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const testEnvironment = () => {
      const envVars = {
        'NEXT_PUBLIC_SUPABASE_URL': process.env.NEXT_PUBLIC_SUPABASE_URL,
        'NEXT_PUBLIC_SUPABASE_ANON_KEY': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        'SUPABASE_SERVICE_ROLE_KEY': process.env.SUPABASE_SERVICE_ROLE_KEY,
        'NODE_ENV': process.env.NODE_ENV,
        'Browser typeof window': typeof window,
        'Browser location': typeof window !== 'undefined' ? window.location.href : 'N/A'
      };

      const processedEnv: any = {};
      Object.entries(envVars).forEach(([key, value]) => {
        if (value) {
          processedEnv[key] = {
            status: 'SET',
            value: value.substring(0, 20) + (value.length > 20 ? '...' : ''),
            length: value.length
          };
        } else {
          processedEnv[key] = {
            status: 'MISSING',
            value: null,
            length: 0
          };
        }
      });

      setEnvInfo(processedEnv);
      setIsLoading(false);
    };

    // Small delay to ensure environment is loaded
    setTimeout(testEnvironment, 100);
  }, []);

  const testSupabaseImport = async () => {
    try {
      const { supabase } = await import('@/supabase/client');
      console.log('Supabase import result:', supabase);
      return supabase;
    } catch (error) {
      console.error('Supabase import error:', error);
      return null;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
        <div className="text-white">Loading environment information...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-6">Browser Environment Test</h1>
        
        <div className="glass p-6 mb-6">
          <h2 className="text-xl font-bold text-white mb-4">Environment Variables</h2>
          <div className="bg-black/30 rounded-lg p-4 font-mono text-sm space-y-2">
            {Object.entries(envInfo).map(([key, info]: [string, any]) => (
              <div key={key} className="mb-2">
                <div className={`font-bold ${info.status === 'SET' ? 'text-green-400' : 'text-red-400'}`}>
                  {key}: {info.status}
                </div>
                {info.status === 'SET' && (
                  <div className="text-gray-300 ml-4">
                    Value: {info.value} (Length: {info.length})
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="glass p-6 mb-6">
          <h2 className="text-xl font-bold text-white mb-4">Supabase Client Test</h2>
          <button
            onClick={testSupabaseImport}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mb-4"
          >
            Test Supabase Import
          </button>
          <p className="text-white/70 text-sm">
            Click the button above and check the browser console for Supabase import results.
          </p>
        </div>

        <div className="glass p-6">
          <h2 className="text-xl font-bold text-white mb-4">Debug Information</h2>
          <div className="text-white/70 text-sm space-y-2">
            <p>If environment variables are missing in the browser but present in .env file:</p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>Check that .env file is in the project root</li>
              <li>Restart the development server</li>
              <li>Check Next.js configuration</li>
              <li>Verify variables start with NEXT_PUBLIC_ for client-side access</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}