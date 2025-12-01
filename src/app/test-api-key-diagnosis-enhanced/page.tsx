'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { supabase } from '@/supabase/client';

export default function TestApiKeyDiagnosisEnhanced() {
  const [testResults, setTestResults] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [detailedError, setDetailedError] = useState<string>('');

  useEffect(() => {
    const diagnoseApiKeyIssue = async () => {
      try {
        console.log('🔍 [DIAGNOSIS] Starting enhanced API key diagnosis...');
        
        // Test 1: Environment Variables Analysis
        const envAnalysis = {
          url: process.env.NEXT_PUBLIC_SUPABASE_URL,
          urlPresent: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
          urlFormat: process.env.NEXT_PUBLIC_SUPABASE_URL?.startsWith('https'),
          anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
          anonKeyPresent: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
          anonKeyFormat: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.startsWith('eyJ'),
          anonKeyLength: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length,
          serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY?.substring(0, 20) + '...',
          serviceKeyPresent: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
          serviceKeyFormat: process.env.SUPABASE_SERVICE_ROLE_KEY?.startsWith('eyJ'),
          serviceKeyLength: process.env.SUPABASE_SERVICE_ROLE_KEY?.length,
        };

        console.log('🔍 [DIAGNOSIS] Environment Analysis:', envAnalysis);

        // Test 2: Key Type Validation
        let keyTypeValidation = {
          isValidJwt: false,
          isExpired: false,
          keyType: 'unknown',
          issuer: null,
          audience: null,
        };

        try {
          const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
          if (anonKey) {
            const keyParts = anonKey.split('.');
            const payload = keyParts[1] || '';
            const decoded = JSON.parse(atob(payload));
            keyTypeValidation = {
              isValidJwt: true,
              isExpired: decoded.exp * 1000 < Date.now(),
              keyType: decoded.role || 'anon',
              issuer: decoded.iss,
              audience: decoded.aud,
            };
            console.log('🔍 [DIAGNOSIS] Anon Key Decoded:', keyTypeValidation);
          }
        } catch (error) {
          console.error('🔍 [DIAGNOSIS] Failed to decode anon key:', error);
        }

        // Test 3: Direct Client Creation Test
        let directClientTest = {
          success: false,
          error: null,
          clientCreated: false,
        };

        try {
          console.log('🔍 [DIAGNOSIS] Testing direct client creation...');
          const testClient = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
          );
          
          directClientTest.clientCreated = !!testClient;
          directClientTest.success = true;
          
          // Test basic connectivity
          const { error: healthError } = await testClient.from('_health_check').select('count').limit(1);
          if (healthError) {
            directClientTest.error = healthError.message as any;
            console.log('🔍 [DIAGNOSIS] Health check error:', healthError);
          } else {
            directClientTest.success = true;
            console.log('🔍 [DIAGNOSIS] Health check passed');
          }
        } catch (error: any) {
          directClientTest.error = error.message;
          console.error('🔍 [DIAGNOSIS] Direct client creation failed:', error);
        }

        // Test 4: Existing Client Test
        let existingClientTest = {
          success: false,
          error: null,
          authMethods: [],
        };

        try {
          console.log('🔍 [DIAGNOSIS] Testing existing client...');
          if (supabase) {
            existingClientTest.authMethods = Object.keys(supabase.auth || {}) as any;
            
            // Test auth methods
            const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
            if (sessionError) {
              existingClientTest.error = sessionError.message as any;
            } else {
              existingClientTest.success = true;
            }
            
            console.log('🔍 [DIAGNOSIS] Existing client test results:', {
              hasSession: !!sessionData?.session,
              sessionError: sessionError?.message,
            });
          } else {
            existingClientTest.error = 'Supabase client not available' as any;
          }
        } catch (error: any) {
          existingClientTest.error = error.message;
          console.error('🔍 [DIAGNOSIS] Existing client test failed:', error);
        }

        // Test 5: Authentication Test with Different Key Types
        let authTests = {
          anonKeyTest: { success: false, error: null },
          serviceKeyTest: { success: false, error: null },
        };

        // Test with anon key
        try {
          const anonClient = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
          );
          const { error: anonError } = await anonClient.auth.signInWithPassword({
            email: 'test@example.com',
            password: 'testpassword'
          });
          authTests.anonKeyTest.error = anonError?.message || 'Expected auth error for invalid credentials' as any;
          authTests.anonKeyTest.success = true; // Success means we got a response, not necessarily valid login
        } catch (error: any) {
          authTests.anonKeyTest.error = error.message;
        }

        // Test with service key (should fail for client-side auth)
        try {
          const serviceClient = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
          );
          const { error: serviceError } = await serviceClient.auth.signInWithPassword({
            email: 'test@example.com',
            password: 'testpassword'
          });
          authTests.serviceKeyTest.error = serviceError?.message || 'Service key should not work for client auth' as any;
          authTests.serviceKeyTest.success = true;
        } catch (error: any) {
          authTests.serviceKeyTest.error = error.message;
        }

        setTestResults({
          envAnalysis,
          keyTypeValidation,
          directClientTest,
          existingClientTest,
          authTests,
        });

      } catch (error: any) {
        console.error('🔍 [DIAGNOSIS] Diagnosis failed:', error);
        setDetailedError(error.message);
      } finally {
        setLoading(false);
      }
    };

    diagnoseApiKeyIssue();
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
      <h1 className="text-2xl font-bold mb-6">Enhanced API Key Diagnosis</h1>
      
      {detailedError && (
        <div className="bg-red-900 border border-red-700 text-red-100 px-4 py-3 rounded mb-6">
          <h3 className="font-bold mb-2">Diagnosis Failed</h3>
          <p>{detailedError}</p>
        </div>
      )}

      <div className="space-y-6">
        {/* Environment Variables Analysis */}
        <div className="bg-gray-800 p-4 rounded">
          <h2 className="text-lg font-semibold mb-3">Environment Variables Analysis</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p>URL Present: {testResults.envAnalysis?.urlPresent ? '✅ YES' : '❌ NO'}</p>
              <p>URL Format: {testResults.envAnalysis?.urlFormat ? '✅ HTTPS' : '❌ INVALID'}</p>
              <p>Anon Key Present: {testResults.envAnalysis?.anonKeyPresent ? '✅ YES' : '❌ NO'}</p>
              <p>Anon Key Format: {testResults.envAnalysis?.anonKeyFormat ? '✅ JWT' : '❌ INVALID'}</p>
              <p>Anon Key Length: {testResults.envAnalysis?.anonKeyLength || 'N/A'}</p>
            </div>
            <div>
              <p>Service Key Present: {testResults.envAnalysis?.serviceKeyPresent ? '✅ YES' : '❌ NO'}</p>
              <p>Service Key Format: {testResults.envAnalysis?.serviceKeyFormat ? '✅ JWT' : '❌ INVALID'}</p>
              <p>Service Key Length: {testResults.envAnalysis?.serviceKeyLength || 'N/A'}</p>
              <p>Service Key: {testResults.envAnalysis?.serviceKey || 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* JWT Token Analysis */}
        <div className="bg-gray-800 p-4 rounded">
          <h2 className="text-lg font-semibold mb-3">JWT Token Analysis</h2>
          <div className="space-y-2 text-sm">
            <p>Valid JWT: {testResults.keyTypeValidation?.isValidJwt ? '✅ YES' : '❌ NO'}</p>
            <p>Is Expired: {testResults.keyTypeValidation?.isExpired ? '❌ YES' : '✅ NO'}</p>
            <p>Key Type: {testResults.keyTypeValidation?.keyType || 'UNKNOWN'}</p>
            <p>Issuer: {testResults.keyTypeValidation?.issuer || 'UNKNOWN'}</p>
            <p>Audience: {testResults.keyTypeValidation?.audience || 'UNKNOWN'}</p>
          </div>
        </div>

        {/* Direct Client Test */}
        <div className="bg-gray-800 p-4 rounded">
          <h2 className="text-lg font-semibold mb-3">Direct Client Test</h2>
          <div className="space-y-2 text-sm">
            <p>Client Created: {testResults.directClientTest?.clientCreated ? '✅ YES' : '❌ NO'}</p>
            <p>Connection Test: {testResults.directClientTest?.success ? '✅ SUCCESS' : '❌ FAILED'}</p>
            {testResults.directClientTest?.error && (
              <p className="text-yellow-400">Error: {testResults.directClientTest.error}</p>
            )}
          </div>
        </div>

        {/* Existing Client Test */}
        <div className="bg-gray-800 p-4 rounded">
          <h2 className="text-lg font-semibold mb-3">Existing Client Test</h2>
          <div className="space-y-2 text-sm">
            <p>Client Available: {testResults.existingClientTest?.success ? '✅ YES' : '❌ NO'}</p>
            <p>Auth Methods: {testResults.existingClientTest?.authMethods?.join(', ') || 'NONE'}</p>
            {testResults.existingClientTest?.error && (
              <p className="text-yellow-400">Error: {testResults.existingClientTest.error}</p>
            )}
          </div>
        </div>

        {/* Authentication Tests */}
        <div className="bg-gray-800 p-4 rounded">
          <h2 className="text-lg font-semibold mb-3">Authentication Tests</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <h3 className="font-medium mb-2">Anon Key Test</h3>
              <p>Test Result: {testResults.authTests?.anonKeyTest?.success ? '✅ COMPLETED' : '❌ FAILED'}</p>
              {testResults.authTests?.anonKeyTest?.error && (
                <p className="text-yellow-400">Error: {testResults.authTests.anonKeyTest.error}</p>
              )}
            </div>
            <div>
              <h3 className="font-medium mb-2">Service Key Test</h3>
              <p>Test Result: {testResults.authTests?.serviceKeyTest?.success ? '✅ COMPLETED' : '❌ FAILED'}</p>
              {testResults.authTests?.serviceKeyTest?.error && (
                <p className="text-yellow-400">Error: {testResults.authTests.serviceKeyTest.error}</p>
              )}
            </div>
          </div>
        </div>

        {/* Diagnosis Summary */}
        <div className="bg-gray-800 p-4 rounded">
          <h2 className="text-lg font-semibold mb-3">Diagnosis Summary</h2>
          <div className="space-y-3 text-sm">
            <div className="p-3 bg-gray-700 rounded">
              <h3 className="font-medium mb-2">Most Likely Issues:</h3>
              <ul className="list-disc list-inside space-y-1">
                {testResults.envAnalysis?.anonKeyPresent && !testResults.keyTypeValidation?.isValidJwt && (
                  <li className="text-red-400">❌ Anon key is not a valid JWT token</li>
                )}
                {testResults.keyTypeValidation?.isExpired && (
                  <li className="text-red-400">❌ API key has expired</li>
                )}
                {!testResults.envAnalysis?.urlFormat && (
                  <li className="text-red-400">❌ Supabase URL format is invalid</li>
                )}
                {testResults.directClientTest?.error?.includes('Invalid API key') && (
                  <li className="text-red-400">❌ API key is being rejected by Supabase</li>
                )}
                {!testResults.envAnalysis?.anonKeyPresent && (
                  <li className="text-red-400">❌ Anon key is missing from environment</li>
                )}
              </ul>
            </div>
            
            <div className="p-3 bg-gray-700 rounded">
              <h3 className="font-medium mb-2">Recommended Actions:</h3>
              <ul className="list-disc list-inside space-y-1">
                {testResults.keyTypeValidation?.isExpired && (
                  <li className="text-yellow-400">🔄 Regenerate API keys from Supabase dashboard</li>
                )}
                {!testResults.envAnalysis?.anonKeyPresent && (
                  <li className="text-yellow-400">🔄 Add NEXT_PUBLIC_SUPABASE_ANON_KEY to .env file</li>
                )}
                {!testResults.envAnalysis?.urlFormat && (
                  <li className="text-yellow-400">🔄 Fix Supabase URL format (should start with https://)</li>
                )}
                {testResults.directClientTest?.error?.includes('Invalid API key') && (
                  <li className="text-yellow-400">🔄 Verify you're using the correct anon key from Supabase dashboard</li>
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}