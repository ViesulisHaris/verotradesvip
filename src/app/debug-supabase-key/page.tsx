'use client';

import { useEffect, useState } from 'react';

export default function DebugSupabaseKey() {
  const [envInfo, setEnvInfo] = useState<any>({});

  useEffect(() => {
    // Log environment variables on client side
    const clientEnv = {
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      NODE_ENV: process.env.NODE_ENV,
    };

    // Check if the anon key is valid (should start with 'eyJ' for JWT)
    const isValidJwt = clientEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY?.startsWith('eyJ');
    
    setEnvInfo({
      clientEnv,
      isValidJwt,
      keyLength: clientEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length,
      keyPrefix: clientEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 20),
    });

    console.log('🔍 [DEBUG] Client-side environment variables:', clientEnv);
    console.log('🔍 [DEBUG] Is valid JWT format:', isValidJwt);
  }, []);

  return (
    <div className="p-8 bg-gray-900 text-white min-h-screen">
      <h1 className="text-2xl font-bold mb-6">Supabase Key Debug Information</h1>
      
      <div className="space-y-4">
        <div className="bg-gray-800 p-4 rounded">
          <h2 className="text-lg font-semibold mb-2">Environment Variables</h2>
          <pre className="text-sm bg-gray-700 p-3 rounded overflow-auto">
            {JSON.stringify(envInfo.clientEnv, null, 2)}
          </pre>
        </div>

        <div className="bg-gray-800 p-4 rounded">
          <h2 className="text-lg font-semibold mb-2">Key Validation</h2>
          <div className="space-y-2">
            <p>Valid JWT Format: {envInfo.isValidJwt ? '✅ YES' : '❌ NO'}</p>
            <p>Key Length: {envInfo.keyLength}</p>
            <p>Key Prefix: {envInfo.keyPrefix}</p>
          </div>
        </div>

        <div className="bg-gray-800 p-4 rounded">
          <h2 className="text-lg font-semibold mb-2">Diagnosis</h2>
          {!envInfo.isValidJwt && (
            <div className="text-red-400">
              <p>❌ The NEXT_PUBLIC_SUPABASE_ANON_KEY is not in valid JWT format.</p>
              <p>❌ It should start with 'eyJ' but starts with '{envInfo.keyPrefix}'.</p>
              <p>❌ This is causing the 'supabaseKey is required' error.</p>
            </div>
          )}
          {envInfo.isValidJwt && (
            <div className="text-green-400">
              <p>✅ The Supabase key appears to be in valid JWT format.</p>
            </div>
          )}
        </div>

        <div className="bg-gray-800 p-4 rounded">
          <h2 className="text-lg font-semibold mb-2">Recommended Fix</h2>
          <div className="text-yellow-400">
            <p>1. Check the .env.local file for invalid NEXT_PUBLIC_SUPABASE_ANON_KEY</p>
            <p>2. Replace it with the correct JWT token from your .env file</p>
            <p>3. Restart the development server</p>
          </div>
        </div>
      </div>
    </div>
  );
}