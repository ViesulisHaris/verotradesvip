'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/supabase/client';

export default function DebugAuthPage() {
  const [envVars, setEnvVars] = useState<{url: string, key: string}>({url: '', key: ''});
  const [connectionTest, setConnectionTest] = useState<{status: string, message: string}>({status: 'pending', message: 'Not tested'});
  const [authTest, setAuthTest] = useState<{status: string, message: string}>({status: 'pending', message: 'Not tested'});

  useEffect(() => {
    // Check environment variables
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'NOT FOUND';
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'NOT FOUND';
    
    setEnvVars({url, key});
    
    console.log('🔍 Environment Variables Check:');
    console.log(`URL: ${url}`);
    console.log(`Key: ${key.substring(0, 20)}...`);
    
    // Test Supabase connection
    testSupabaseConnection();
  }, []);

  const testSupabaseConnection = async () => {
    try {
      console.log('🔄 Testing Supabase connection...');
      
      // Test basic connection by getting session
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('❌ Supabase connection failed:', error);
        setConnectionTest({
          status: 'error',
          message: `Connection failed: ${error.message}`
        });
      } else {
        console.log('✅ Supabase connection successful');
        setConnectionTest({
          status: 'success',
          message: 'Connection successful'
        });
      }
    } catch (exception) {
      console.error('❌ Exception during connection test:', exception);
      setConnectionTest({
        status: 'error',
        message: `Exception: ${exception}`
      });
    }
  };

  const testDirectAuth = async () => {
    try {
      console.log('🔄 Testing direct authentication...');
      setAuthTest({status: 'loading', message: 'Testing authentication...'});
      
      // Test with dummy credentials to see API response
      const { data, error } = await supabase.auth.signInWithPassword({
        email: 'test@example.com',
        password: 'testpassword'
      });
      
      console.log('📥 Auth test response:', { data, error });
      
      if (error) {
        setAuthTest({
          status: 'error',
          message: `Auth failed: ${error.message} (Code: ${error.status || 'N/A'})`
        });
      } else {
        setAuthTest({
          status: 'success',
          message: 'Auth API responded (unexpected success with dummy credentials)'
        });
      }
    } catch (exception) {
      console.error('❌ Exception during auth test:', exception);
      setAuthTest({
        status: 'error',
        message: `Exception: ${exception}`
      });
    }
  };

  const testSupabaseClient = () => {
    console.log('🔍 Supabase Client Analysis:');
    console.log('Client object:', supabase);
    console.log('Auth object:', supabase.auth);
    // Note: Some properties are protected, but we can still access the auth functionality
    console.log('Client has auth method:', typeof supabase.auth.signInWithPassword);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-black to-gray-900 text-white animate-fade-in">
      <div className="max-w-6xl mx-auto space-y-8 p-4">
        <h1 className="text-4xl md:text-5xl font-bold text-white text-shadow-lg mb-8 animate-pulse-slow">
          Authentication Debug Page
        </h1>
        
        <div className="premium-card p-6 mb-8 transform transition-all duration-300 hover:scale-105">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500/20 to-blue-600/10 flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h2a1 1 0 011 1s-4 0 1-1 1H4z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-white">Environment Variables</h2>
          </div>
          <div className="space-y-3 font-mono text-sm bg-gray-800/50 p-4 rounded-lg border border-gray-700">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-400">NEXT_PUBLIC_SUPABASE_URL:</span>
              <span className="text-green-400 font-mono">{envVars.url}</span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-400">NEXT_PUBLIC_SUPABASE_ANON_KEY:</span>
              <span className="text-yellow-400 font-mono">{envVars.key.substring(0, 20)}...</span>
            </div>
          </div>
        </div>
        
        <div className="premium-card p-6 mb-8 transform transition-all duration-300 hover:scale-105">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500/20 to-green-600/10 flex items-center justify-center">
              <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2a2 2 0 012-2 2-2-2 2z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-white">Supabase Connection Test</h2>
          </div>
          <div className={`p-6 rounded-lg border transition-all duration-300 ${
            connectionTest.status === 'success' ? 'bg-green-900/50 border-green-500/50' :
            connectionTest.status === 'error' ? 'bg-red-900/50 border-red-500/50' :
            'bg-gray-800/50 border-gray-700'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <div className="font-semibold text-white">Status:</div>
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                connectionTest.status === 'success' ? 'bg-green-600 text-white' :
                connectionTest.status === 'error' ? 'bg-red-600 text-white' :
                'bg-gray-600 text-white'
              }`}>
                {connectionTest.status}
              </div>
            </div>
            <div className="text-sm text-gray-300 mt-2">{connectionTest.message}</div>
            <button
              onClick={testSupabaseConnection}
              className="mt-4 luxury-button"
            >
              Retest Connection
            </button>
          </div>
        </div>
        
        <div className="premium-card p-6 mb-8 transform transition-all duration-300 hover:scale-105">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-500/20 to-amber-600/10 flex items-center justify-center">
              <svg className="w-6 h-6 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l2.828 2.828a2.828 2.828 0 5.657 5.657-2.828-2.828-6.343 6.343z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-white">Direct Authentication Test</h2>
          </div>
          <div className={`p-6 rounded-lg border transition-all duration-300 ${
            authTest.status === 'success' ? 'bg-green-900/50 border-green-500/50' :
            authTest.status === 'error' ? 'bg-red-900/50 border-red-500/50' :
            authTest.status === 'loading' ? 'bg-yellow-900/50 border-yellow-500/50' :
            'bg-gray-800/50 border-gray-700'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <div className="font-semibold text-white">Status:</div>
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                authTest.status === 'success' ? 'bg-green-600 text-white' :
                authTest.status === 'error' ? 'bg-red-600 text-white' :
                authTest.status === 'loading' ? 'bg-yellow-600 text-white animate-pulse-slow' :
                'bg-gray-600 text-white'
              }`}>
                {authTest.status}
              </div>
            </div>
            <div className="text-sm text-gray-300 mt-2">{authTest.message}</div>
            <button
              onClick={testDirectAuth}
              disabled={authTest.status === 'loading'}
              className="mt-4 luxury-button"
            >
              Test Authentication API
            </button>
          </div>
        </div>
        
        <div className="premium-card p-6 mb-8 transform transition-all duration-300 hover:scale-105">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500/20 to-purple-600/10 flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 12h6a2 2 0 00-2 2v2a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-white">Client Analysis</h2>
          </div>
          <button
            onClick={testSupabaseClient}
            className="luxury-button"
          >
            Log Client Details to Console
          </button>
          <p className="text-sm text-gray-400 mt-2">
            Check browser console for detailed client information
          </p>
        </div>
        
        <div className="premium-card p-6 mb-8 border border-amber-500/30 bg-gradient-to-br from-amber-900/20 to-amber-800/10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-500/20 to-yellow-600/10 flex items-center justify-center">
              <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v1a.586.414 0 001.586.414 0 1.414 1.414 0 8.828 8.828 0 8.828-1.414 1.414z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-white">Key Findings</h2>
          </div>
          <ul className="space-y-3 text-sm bg-gray-800/50 p-4 rounded-lg border border-gray-700">
            <li className="flex items-start gap-3 text-yellow-400">
              <div className="w-2 h-2 rounded-full bg-yellow-400 mt-1"></div>
              The Supabase anon key format appears to be incorrect
            </li>
            <li className="flex items-start gap-3 text-gray-400">
              <div className="w-2 h-2 rounded-full bg-blue-400 mt-1"></div>
              Standard Supabase keys start with eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
            </li>
            <li className="flex items-start gap-3 text-gray-400">
              <div className="w-2 h-2 rounded-full bg-amber-400 mt-1"></div>
              This suggests the key might be truncated or from a different auth system
            </li>
            <li className="flex items-start gap-3 text-gray-400">
              <div className="w-2 h-2 rounded-full bg-red-400 mt-1"></div>
              Check the Supabase project settings for the correct anon key
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}