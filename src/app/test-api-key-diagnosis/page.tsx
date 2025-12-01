'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/supabase/client';

export default function APIKeyDiagnosis() {
  const [diagnosis, setDiagnosis] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const runDiagnosis = async () => {
      const results: any = {};

      // Test 1: Check environment variables
      results.environment = {
        NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'MISSING',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'MISSING',
        supabaseUrlLength: process.env.NEXT_PUBLIC_SUPABASE_URL?.length || 0,
        supabaseKeyLength: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length || 0,
        supabaseKeyPrefix: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 20) || '',
        supabaseKeyFormat: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.startsWith('eyJ') ? 'VALID_JWT' : 'INVALID_FORMAT'
      };

      // Test 2: Check if the key is truncated
      const fullKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      if (fullKey) {
        results.keyAnalysis = {
          fullLength: fullKey.length,
          expectedJWTLength: 300, // Typical JWT length
          isTruncated: fullKey.length < 300,
          endsWith: fullKey.substring(fullKey.length - 10),
          hasDots: fullKey.includes('...'),
          appearsComplete: fullKey.endsWith('.') === false
        };
      }

      // Test 3: Try to create a Supabase client directly
      try {
        const { createClient } = await import('@supabase/supabase-js');
        const testClient = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL || '',
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
        );
        results.clientCreation = 'SUCCESS';
      } catch (error: any) {
        results.clientCreation = `FAILED: ${error.message}`;
      }

      // Test 4: Try to use the existing supabase client for auth
      try {
        const authTest = await supabase.auth.getSession();
        results.authTest = {
          success: true,
          hasSession: !!authTest.data.session,
          error: null
        };
      } catch (error: any) {
        results.authTest = {
          success: false,
          hasSession: false,
          error: error.message
        };
      }

      // Test 5: Try a simple API call to test the key
      try {
        const { data, error } = await supabase.from('_test_connection').select('*').limit(1);
        results.apiTest = {
          success: !error,
          error: error?.message || null,
          dataReceived: !!data
        };
      } catch (error: any) {
        results.apiTest = {
          success: false,
          error: error.message,
          dataReceived: false
        };
      }

      setDiagnosis(results);
      setLoading(false);
    };

    runDiagnosis();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">API Key Diagnosis Report</h1>
        
        <div className="space-y-6">
          <div className="glass p-6 border border-blue-500/20">
            <h2 className="text-xl font-semibold text-white mb-4">Environment Variables</h2>
            <pre className="text-green-400 text-sm overflow-auto">
              {JSON.stringify(diagnosis.environment, null, 2)}
            </pre>
          </div>

          {diagnosis.keyAnalysis && (
            <div className="glass p-6 border border-blue-500/20">
              <h2 className="text-xl font-semibold text-white mb-4">Key Analysis</h2>
              <pre className="text-green-400 text-sm overflow-auto">
                {JSON.stringify(diagnosis.keyAnalysis, null, 2)}
              </pre>
            </div>
          )}

          <div className="glass p-6 border border-blue-500/20">
            <h2 className="text-xl font-semibold text-white mb-4">Client Creation Test</h2>
            <pre className="text-green-400 text-sm overflow-auto">
              {JSON.stringify(diagnosis.clientCreation, null, 2)}
            </pre>
          </div>

          <div className="glass p-6 border border-blue-500/20">
            <h2 className="text-xl font-semibold text-white mb-4">Auth Test</h2>
            <pre className="text-green-400 text-sm overflow-auto">
              {JSON.stringify(diagnosis.authTest, null, 2)}
            </pre>
          </div>

          <div className="glass p-6 border border-blue-500/20">
            <h2 className="text-xl font-semibold text-white mb-4">API Test</h2>
            <pre className="text-green-400 text-sm overflow-auto">
              {JSON.stringify(diagnosis.apiTest, null, 2)}
            </pre>
          </div>

          <div className="glass p-6 border border-red-500/20">
            <h2 className="text-xl font-semibold text-white mb-4">Diagnosis Summary</h2>
            <div className="text-white space-y-2">
              <p>• Environment variables: {diagnosis.environment?.NEXT_PUBLIC_SUPABASE_ANON_KEY === 'SET' ? '✅ SET' : '❌ MISSING'}</p>
              <p>• Key format: {diagnosis.environment?.supabaseKeyFormat === 'VALID_JWT' ? '✅ VALID JWT' : '❌ INVALID FORMAT'}</p>
              <p>• Key length: {diagnosis.keyAnalysis?.isTruncated ? '❌ APPEARS TRUNCATED' : '✅ APPEARS COMPLETE'}</p>
              <p>• Client creation: {diagnosis.clientCreation === 'SUCCESS' ? '✅ SUCCESS' : '❌ FAILED'}</p>
              <p>• Auth test: {diagnosis.authTest?.success ? '✅ SUCCESS' : '❌ FAILED'}</p>
              <p>• API test: {diagnosis.apiTest?.success ? '✅ SUCCESS' : '❌ FAILED'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}