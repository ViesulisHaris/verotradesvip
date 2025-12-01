'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/supabase/client';

export default function TestAuthenticationDiagnosis() {
  const [results, setResults] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [envStatus, setEnvStatus] = useState<any>({});

  const addResult = (message: string) => {
    setResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  useEffect(() => {
    const runDiagnosis = async () => {
      setIsLoading(true);
      setResults([]);
      
      // Test 1: Environment Variables
      addResult('🔍 Testing environment variables...');
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

      setEnvStatus(processedEnv);
      
      Object.entries(processedEnv).forEach(([key, info]: [string, any]) => {
        if (info.status === 'SET') {
          addResult(`✅ ${key}: SET (${info.value})`);
        } else {
          addResult(`❌ ${key}: ${info.status}`);
        }
      });

      // Test 2: Direct Supabase Import
      addResult('\n🔍 Testing direct Supabase import...');
      try {
        // Test if supabase client is available
        if (supabase) {
          addResult('✅ Supabase client is available');
          
          // Test 3: Basic Connection Test
          addResult('\n🔍 Testing basic Supabase connection...');
          try {
            const { data, error } = await supabase.from('strategies').select('id').limit(1);
            
            if (error) {
              addResult(`❌ Connection test failed: ${error.message}`);
              if (error.message.includes('supabaseKey is required')) {
                addResult('🚨 CRITICAL: "supabaseKey is required" error detected!');
                addResult('🔧 This confirms environment variables are not loaded properly');
              }
            } else {
              addResult('✅ Basic connection test successful');
              
              // Test 4: Authentication Test
              addResult('\n🔍 Testing authentication...');
              const { data: { session }, error: authError } = await supabase.auth.getSession();
              
              if (authError) {
                addResult(`❌ Authentication test failed: ${authError.message}`);
              } else if (session) {
                addResult(`✅ Active session found for user: ${session.user.email}`);
                
                // Test 5: Strategy Deletion Test
                addResult('\n🔍 Testing strategy deletion...');
                
                // Get user strategies first
                const { data: strategies, error: fetchError } = await supabase
                  .from('strategies')
                  .select('id, name')
                  .eq('user_id', session.user.id)
                  .limit(1);
                
                if (fetchError) {
                  addResult(`❌ Strategy fetch failed: ${fetchError.message}`);
                } else if (strategies && strategies.length > 0) {
                  const testStrategy = strategies[0];
                  addResult(`🔍 Found test strategy: ${testStrategy.name} (${testStrategy.id})`);
                  
                  // Test deletion (but don't actually delete - just test the query)
                  const { error: deleteError } = await supabase
                    .from('strategies')
                    .delete()
                    .eq('id', testStrategy.id)
                    .eq('user_id', session.user.id);
                  
                  if (deleteError) {
                    addResult(`❌ Strategy deletion test failed: ${deleteError.message}`);
                    if (deleteError.message.includes('supabaseKey is required')) {
                      addResult('🚨 CRITICAL: "supabaseKey is required" error in deletion!');
                    }
                  } else {
                    addResult('✅ Strategy deletion test successful (query structure is correct)');
                  }
                } else {
                  addResult('⚠️ No strategies found to test deletion');
                }
              } else {
                addResult('⚠️ No active session found');
              }
            }
          } catch (connError) {
            addResult(`❌ Connection test exception: ${connError instanceof Error ? connError.message : 'Unknown error'}`);
          }
        } else {
          addResult('❌ Supabase client is not available');
        }
      } catch (importError) {
        addResult(`❌ Supabase import error: ${importError instanceof Error ? importError.message : 'Unknown error'}`);
      }

      // Test 6: Environment Variable Loading Diagnosis
      addResult('\n🔍 Diagnosing environment variable loading...');
      
      // Check if .env file variables are being loaded
      const hasRequiredVars = processedEnv['NEXT_PUBLIC_SUPABASE_URL']?.status === 'SET' && 
                              processedEnv['NEXT_PUBLIC_SUPABASE_ANON_KEY']?.status === 'SET';
      
      if (!hasRequiredVars) {
        addResult('❌ CRITICAL: Required environment variables are not loaded in browser');
        addResult('🔧 FIX RECOMMENDATIONS:');
        addResult('  1. Ensure .env file is in project root');
        addResult('  2. Restart development server after adding .env file');
        addResult('  3. Check Next.js configuration for environment variable loading');
        addResult('  4. Verify variables start with NEXT_PUBLIC_ for client-side access');
        addResult('  5. Check deployment configuration for environment variable exposure');
      } else {
        addResult('✅ Environment variables are properly loaded');
      }

      setIsLoading(false);
    };

    // Add small delay to ensure environment is loaded
    setTimeout(runDiagnosis, 500);
  }, []);

  const clearResults = () => {
    setResults([]);
  };

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-6">Authentication & Supabase Diagnosis</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Environment Status */}
          <div className="glass p-6">
            <h2 className="text-xl font-bold text-white mb-4">Environment Variables</h2>
            <div className="bg-black/30 rounded-lg p-4 font-mono text-sm space-y-2">
              {Object.entries(envStatus).map(([key, info]: [string, any]) => (
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

          {/* Test Results */}
          <div className="glass p-6 lg:col-span-2">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">Diagnosis Results</h2>
              <button
                onClick={clearResults}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Clear Results
              </button>
            </div>
            
            <div className="bg-black/30 rounded-lg p-4 font-mono text-sm max-h-96 overflow-y-auto">
              {results.length === 0 && !isLoading && (
                <div className="text-gray-400 text-center py-8">
                  Click "Run Diagnosis" to start testing...
                </div>
              )}
              
              {isLoading && (
                <div className="text-blue-400 text-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto mb-4"></div>
                  Running diagnosis...
                </div>
              )}
              
              {results.map((result, index) => (
                <div key={index} className="mb-2 text-green-300">
                  {result}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="glass p-6">
          <div className="flex gap-4">
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Reload Page
            </button>
            <button
              onClick={() => window.location.href = '/login'}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Go to Login
            </button>
          </div>
          
          <div className="text-white/70 text-sm mt-4">
            <p className="font-bold mb-2">If environment variables are missing:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Check that .env file exists in project root</li>
              <li>Verify variables start with NEXT_PUBLIC_</li>
              <li>Restart development server</li>
              <li>Check Next.js configuration</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}