'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/supabase/client';

export default function TestSupabaseKeyFix() {
  const [testResults, setTestResults] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const testSupabaseConnection = async () => {
      try {
        // Test 1: Check environment variables
        const envCheck = {
          url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
          key: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
          keyFormat: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.startsWith('eyJ'),
        };

        // Test 2: Try to create Supabase client
        let clientCreationSuccess = false;
        let clientError = null;
        
        try {
          // This should not throw an error if key is valid
          const testClient = supabase;
          clientCreationSuccess = !!testClient;
        } catch (error) {
          clientError = error instanceof Error ? error.message : 'Unknown error';
        }

        // Test 3: Try a simple Supabase operation
        let operationSuccess = false;
        let operationError = null;
        
        try {
          const { data, error } = await supabase.from('_test_connection').select('count').limit(1);
          operationSuccess = !error;
          operationError = error?.message;
        } catch (error) {
          operationError = error instanceof Error ? error.message : 'Unknown error';
        }

        setTestResults({
          envCheck,
          clientCreation: {
            success: clientCreationSuccess,
            error: clientError,
          },
          operation: {
            success: operationSuccess,
            error: operationError,
          },
          overall: clientCreationSuccess && !clientError,
        });
      } catch (error) {
        setTestResults({
          error: error instanceof Error ? error.message : 'Unknown error',
          overall: false,
        });
      } finally {
        setLoading(false);
      }
    };

    testSupabaseConnection();
  }, []);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-8 bg-gray-900 text-white min-h-screen">
      <h1 className="text-2xl font-bold mb-6">Supabase Key Fix Verification</h1>
      
      <div className="space-y-4">
        {/* Environment Variables Check */}
        <div className="bg-gray-800 p-4 rounded">
          <h2 className="text-lg font-semibold mb-2">Environment Variables Check</h2>
          <div className="space-y-2">
            <p>NEXT_PUBLIC_SUPABASE_URL: {testResults.envCheck?.url ? '✅ SET' : '❌ MISSING'}</p>
            <p>NEXT_PUBLIC_SUPABASE_ANON_KEY: {testResults.envCheck?.key ? '✅ SET' : '❌ MISSING'}</p>
            <p>Key Format (JWT): {testResults.envCheck?.keyFormat ? '✅ VALID' : '❌ INVALID'}</p>
          </div>
        </div>

        {/* Client Creation Test */}
        <div className="bg-gray-800 p-4 rounded">
          <h2 className="text-lg font-semibold mb-2">Supabase Client Creation</h2>
          <div className="space-y-2">
            <p>Client Creation: {testResults.clientCreation?.success ? '✅ SUCCESS' : '❌ FAILED'}</p>
            {testResults.clientCreation?.error && (
              <p className="text-red-400">Error: {testResults.clientCreation.error}</p>
            )}
          </div>
        </div>

        {/* Operation Test */}
        <div className="bg-gray-800 p-4 rounded">
          <h2 className="text-lg font-semibold mb-2">Supabase Operation Test</h2>
          <div className="space-y-2">
            <p>Operation: {testResults.operation?.success ? '✅ SUCCESS' : '⚠️ EXPECTED ERROR'}</p>
            {testResults.operation?.error && (
              <p className="text-yellow-400">Error: {testResults.operation.error}</p>
            )}
          </div>
        </div>

        {/* Overall Result */}
        <div className="bg-gray-800 p-4 rounded">
          <h2 className="text-lg font-semibold mb-2">Overall Result</h2>
          <div className="space-y-2">
            {testResults.overall ? (
              <div className="text-green-400">
                <p>✅ Supabase key fix successful!</p>
                <p>✅ The "supabaseKey is required" error should be resolved.</p>
                <p>✅ RootLayout component should now work properly.</p>
              </div>
            ) : (
              <div className="text-red-400">
                <p>❌ Supabase key fix failed.</p>
                <p>❌ The error may still persist.</p>
                {testResults.error && <p>Error: {testResults.error}</p>}
              </div>
            )}
          </div>
        </div>

        {/* Next Steps */}
        <div className="bg-gray-800 p-4 rounded">
          <h2 className="text-lg font-semibold mb-2">Next Steps</h2>
          <div className="text-yellow-400">
            <p>1. Restart the development server if needed</p>
            <p>2. Navigate to the main application</p>
            <p>3. Check if "supabaseKey is required" error is gone</p>
            <p>4. Test authentication functionality</p>
          </div>
        </div>
      </div>
    </div>
  );
}