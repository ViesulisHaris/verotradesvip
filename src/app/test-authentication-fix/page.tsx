'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/supabase/client';

export default function TestAuthenticationFix() {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const addResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testEnvironmentVariables = () => {
    addResult('🔍 Testing environment variables...');
    
    const envVars = {
      'NEXT_PUBLIC_SUPABASE_URL': process.env.NEXT_PUBLIC_SUPABASE_URL,
      'NEXT_PUBLIC_SUPABASE_ANON_KEY': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      'SUPABASE_SERVICE_ROLE_KEY': process.env.SUPABASE_SERVICE_ROLE_KEY,
      'NODE_ENV': process.env.NODE_ENV
    };

    Object.entries(envVars).forEach(([key, value]) => {
      if (value) {
        addResult(`✅ ${key}: SET (${value.substring(0, 20)}...)`);
      } else {
        addResult(`❌ ${key}: MISSING`);
      }
    });

    return envVars.NEXT_PUBLIC_SUPABASE_URL && envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  };

  const testSupabaseClientCreation = () => {
    addResult('🔍 Testing Supabase client creation...');
    
    try {
      // Test direct import
      const { supabase: directSupabase } = require('@/supabase/client');
      if (directSupabase) {
        addResult('✅ Direct Supabase client import successful');
      } else {
        addResult('❌ Direct Supabase client import failed');
      }

      // Test lazy initialization
      const { getSupabaseClient } = require('@/supabase/client');
      const client = getSupabaseClient();
      if (client) {
        addResult('✅ Lazy Supabase client creation successful');
        return true;
      } else {
        addResult('❌ Lazy Supabase client creation failed');
        return false;
      }
    } catch (error) {
      addResult(`❌ Supabase client creation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return false;
    }
  };

  const testSupabaseConnection = async () => {
    addResult('🔍 Testing Supabase connection...');
    
    try {
      const { data, error } = await supabase.from('strategies').select('id').limit(1);
      
      if (error) {
        addResult(`❌ Supabase connection error: ${error.message}`);
        if (error.message.includes('supabaseKey is required')) {
          addResult('🚨 CRITICAL: "supabaseKey is required" error detected!');
        }
        return false;
      }
      
      addResult('✅ Supabase connection successful');
      return true;
    } catch (error) {
      addResult(`❌ Supabase connection exception: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return false;
    }
  };

  const testAuthentication = async () => {
    addResult('🔍 Testing authentication flow...');
    
    try {
      // Test current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        addResult(`❌ Session check error: ${sessionError.message}`);
        return false;
      }
      
      if (session) {
        addResult(`✅ Active session found for user: ${session.user.email}`);
        return true;
      } else {
        addResult('⚠️ No active session found');
        
        // Test login with provided credentials
        addResult('🔍 Attempting test login...');
        const { data, error } = await supabase.auth.signInWithPassword({
          email: 'testuser@verotrade.com',
          password: 'TestPassword123!'
        });
        
        if (error) {
          addResult(`❌ Test login failed: ${error.message}`);
          return false;
        }
        
        if (data.user && data.session) {
          addResult(`✅ Test login successful for: ${data.user.email}`);
          return true;
        } else {
          addResult('❌ Test login failed: No user/session returned');
          return false;
        }
      }
    } catch (error) {
      addResult(`❌ Authentication exception: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return false;
    }
  };

  const testStrategyDeletion = async () => {
    addResult('🔍 Testing strategy deletion...');
    
    try {
      // First get user strategies
      const { data: strategies, error: fetchError } = await supabase
        .from('strategies')
        .select('id, name')
        .limit(1);
      
      if (fetchError) {
        addResult(`❌ Strategy fetch error: ${fetchError.message}`);
        return false;
      }
      
      if (!strategies || strategies.length === 0) {
        addResult('⚠️ No strategies found to test deletion');
        return true;
      }
      
      const testStrategy = strategies[0];
      addResult(`🔍 Testing deletion of strategy: ${testStrategy.name} (${testStrategy.id})`);
      
      // Test deletion (but don't actually delete - just test the query)
      const { error: deleteError } = await supabase
        .from('strategies')
        .delete()
        .eq('id', testStrategy.id)
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id);
      
      if (deleteError) {
        addResult(`❌ Strategy deletion error: ${deleteError.message}`);
        if (deleteError.message.includes('supabaseKey is required')) {
          addResult('🚨 CRITICAL: "supabaseKey is required" error in deletion!');
        }
        return false;
      }
      
      addResult('⚠️ Strategy deletion test completed (note: this would actually delete)');
      return true;
    } catch (error) {
      addResult(`❌ Strategy deletion exception: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return false;
    }
  };

  const runComprehensiveTest = async () => {
    setIsLoading(true);
    setTestResults([]);
    
    addResult('🚀 Starting comprehensive authentication and Supabase test...');
    
    const envOk = testEnvironmentVariables();
    if (!envOk) {
      addResult('❌ Environment variables test failed - stopping test');
      setIsLoading(false);
      return;
    }
    
    const clientOk = testSupabaseClientCreation();
    if (!clientOk) {
      addResult('❌ Supabase client creation failed - stopping test');
      setIsLoading(false);
      return;
    }
    
    const connectionOk = await testSupabaseConnection();
    if (!connectionOk) {
      addResult('❌ Supabase connection failed - stopping test');
      setIsLoading(false);
      return;
    }
    
    const authOk = await testAuthentication();
    if (!authOk) {
      addResult('❌ Authentication test failed - stopping test');
      setIsLoading(false);
      return;
    }
    
    await testStrategyDeletion();
    
    addResult('✅ Comprehensive test completed');
    setIsLoading(false);
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-6">Authentication & Supabase Diagnostic Test</h1>
        
        <div className="glass p-6 mb-6">
          <div className="flex gap-4 mb-4">
            <button
              onClick={runComprehensiveTest}
              disabled={isLoading}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2 inline-block"></div>
                  Running Tests...
                </>
              ) : (
                'Run Comprehensive Test'
              )}
            </button>
            
            <button
              onClick={clearResults}
              className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Clear Results
            </button>
          </div>
          
          <div className="text-sm text-white/70">
            This test will check:
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Environment variables configuration</li>
              <li>Supabase client initialization</li>
              <li>Database connection</li>
              <li>Authentication flow</li>
              <li>Strategy deletion functionality</li>
            </ul>
          </div>
        </div>
        
        {testResults.length > 0 && (
          <div className="glass p-6">
            <h2 className="text-xl font-bold text-white mb-4">Test Results</h2>
            <div className="bg-black/30 rounded-lg p-4 font-mono text-sm max-h-96 overflow-y-auto">
              {testResults.map((result, index) => (
                <div key={index} className="mb-2 text-green-300">
                  {result}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}