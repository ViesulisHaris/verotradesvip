'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/supabase/client';
import { CheckCircle, XCircle, AlertTriangle, RefreshCw, User, Shield, Server, Monitor } from 'lucide-react';
import Link from 'next/link';

interface TestResult {
  page: string;
  authType: 'server' | 'client';
  status: 'pending' | 'testing' | 'pass' | 'fail';
  message: string;
  details?: any;
}

export default function GlobalAuthFixTestPage() {
  const [testResults, setTestResults] = useState<TestResult[]>([
    {
      page: 'Trades Page',
      authType: 'server',
      status: 'pending',
      message: 'Not tested yet'
    },
    {
      page: 'Analytics Page',
      authType: 'server',
      status: 'pending',
      message: 'Not tested yet'
    },
    {
      page: 'Dashboard Page',
      authType: 'client',
      status: 'pending',
      message: 'Not tested yet'
    },
    {
      page: 'Strategies Page',
      authType: 'client',
      status: 'pending',
      message: 'Not tested yet'
    }
  ]);

  const [isRunning, setIsRunning] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const updateTestResult = (pageIndex: number, status: TestResult['status'], message: string, details?: any) => {
    setTestResults(prev => {
      const updated = [...prev];
      updated[pageIndex] = {
        ...updated[pageIndex],
        status,
        message,
        details
      };
      return updated;
    });
  };

  const testServerAuthAPI = async () => {
    try {
      const response = await fetch('/api/test-server-auth', {
        method: 'GET',
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Server auth API test failed:', error);
      throw error;
    }
  };

  const runTests = async () => {
    setIsRunning(true);
    
    // Reset all tests to pending
    setTestResults(prev => prev.map(test => ({ ...test, status: 'pending' as const, message: 'Not tested yet' })));

    // Test 1: Check current user authentication
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) {
        console.error('Auth check error:', error);
      }
      setCurrentUser(user);
    } catch (error) {
      console.error('Auth check exception:', error);
    }

    // Test 2: Server-side authentication (Trades & Analytics pages)
    try {
      updateTestResult(0, 'testing', 'Testing server-side authentication for Trades page...');
      updateTestResult(1, 'testing', 'Testing server-side authentication for Analytics page...');
      
      const serverAuthResult = await testServerAuthAPI();
      
      if (serverAuthResult.success) {
        updateTestResult(0, 'pass', `Server auth working - User: ${serverAuthResult.user?.email || 'Unknown'}`, serverAuthResult);
        updateTestResult(1, 'pass', `Server auth working - User: ${serverAuthResult.user?.email || 'Unknown'}`, serverAuthResult);
      } else {
        updateTestResult(0, 'fail', `Server auth failed: ${serverAuthResult.error || 'Unknown error'}`, serverAuthResult);
        updateTestResult(1, 'fail', `Server auth failed: ${serverAuthResult.error || 'Unknown error'}`, serverAuthResult);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      updateTestResult(0, 'fail', `Server auth exception: ${errorMessage}`, error);
      updateTestResult(1, 'fail', `Server auth exception: ${errorMessage}`, error);
    }

    // Test 3: Client-side authentication (Dashboard page)
    try {
      updateTestResult(2, 'testing', 'Testing client-side authentication for Dashboard page...');
      
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) {
        updateTestResult(2, 'fail', `Client auth error: ${error.message}`, error);
      } else if (user) {
        updateTestResult(2, 'pass', `Client auth working - User: ${user.email || 'Unknown'}`, user);
      } else {
        updateTestResult(2, 'fail', 'No user found - client authentication failed', null);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      updateTestResult(2, 'fail', `Client auth exception: ${errorMessage}`, error);
    }

    // Test 4: Client-side authentication (Strategies page)
    try {
      updateTestResult(3, 'testing', 'Testing client-side authentication for Strategies page...');
      
      // Simulate the same authentication pattern used in strategies page
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        updateTestResult(3, 'fail', `Strategies auth error: ${userError.message}`, userError);
      } else if (user) {
        updateTestResult(3, 'pass', `Strategies auth working - User: ${user.email || 'Unknown'}`, user);
      } else {
        updateTestResult(3, 'fail', 'No user found - strategies authentication failed', null);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      updateTestResult(3, 'fail', `Strategies auth exception: ${errorMessage}`, error);
    }

    setIsRunning(false);
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'pass':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'fail':
        return <XCircle className="w-5 h-5 text-red-400" />;
      case 'testing':
        return <RefreshCw className="w-5 h-5 text-blue-400 animate-spin" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-yellow-400" />;
    }
  };

  const getAuthTypeIcon = (authType: 'server' | 'client') => {
    return authType === 'server' ? 
      <Server className="w-4 h-4 text-purple-400" /> : 
      <Monitor className="w-4 h-4 text-blue-400" />;
  };

  const allTestsPassed = testResults.every(test => test.status === 'pass');
  const hasFailures = testResults.some(test => test.status === 'fail');

  return (
    <div className="space-y-8 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Global Authentication Fix Test</h1>
          <p className="text-white/70 mt-2">Comprehensive test of authentication across all pages</p>
        </div>
        <button
          onClick={runTests}
          disabled={isRunning}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
        >
          {isRunning ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              Testing...
            </>
          ) : (
            <>
              <Shield className="w-4 h-4" />
              Run All Tests
            </>
          )}
        </button>
      </div>

      {/* Current User Status */}
      <div className="glass p-6 rounded-xl">
        <h2 className="text-xl font-semibold mb-4 text-white flex items-center gap-2">
          <User className="w-5 h-5" />
          Current Authentication Status
        </h2>
        {currentUser ? (
          <div className="space-y-2">
            <p className="text-green-400">✅ User is authenticated</p>
            <p className="text-white/70">Email: {currentUser.email || 'Not available'}</p>
            <p className="text-white/70">ID: {currentUser.id || 'Not available'}</p>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-yellow-400">⚠️ No user authenticated</p>
            <p className="text-white/70">Please log in to test authentication functionality</p>
            <Link href="/login" className="text-blue-400 hover:text-blue-300 underline">
              Go to Login Page
            </Link>
          </div>
        )}
      </div>

      {/* Test Results */}
      <div className="glass p-6 rounded-xl">
        <h2 className="text-xl font-semibold mb-4 text-white">Test Results</h2>
        <div className="space-y-4">
          {testResults.map((test, index) => (
            <div key={index} className="border border-white/10 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  {getStatusIcon(test.status)}
                  <div>
                    <h3 className="text-white font-medium flex items-center gap-2">
                      {test.page}
                      <span className="text-xs px-2 py-1 rounded bg-white/10 flex items-center gap-1">
                        {getAuthTypeIcon(test.authType)}
                        {test.authType === 'server' ? 'Server-side' : 'Client-side'}
                      </span>
                    </h3>
                    <p className="text-white/70 text-sm mt-1">{test.message}</p>
                  </div>
                </div>
              </div>
              
              {test.details && (
                <details className="mt-3">
                  <summary className="text-white/50 text-sm cursor-pointer hover:text-white/70">
                    View Details
                  </summary>
                  <pre className="mt-2 p-3 bg-black/30 rounded text-xs text-white/70 overflow-auto">
                    {JSON.stringify(test.details, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Overall Status */}
      <div className="glass p-6 rounded-xl">
        <h2 className="text-xl font-semibold mb-4 text-white">Overall Status</h2>
        {allTestsPassed ? (
          <div className="flex items-center gap-3 text-green-400">
            <CheckCircle className="w-6 h-6" />
            <div>
              <p className="font-medium">All Tests Passed! ✅</p>
              <p className="text-white/70 text-sm">Authentication is working correctly across all pages</p>
            </div>
          </div>
        ) : hasFailures ? (
          <div className="flex items-center gap-3 text-red-400">
            <XCircle className="w-6 h-6" />
            <div>
              <p className="font-medium">Some Tests Failed ❌</p>
              <p className="text-white/70 text-sm">Authentication issues detected - check individual test results</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 text-yellow-400">
            <AlertTriangle className="w-6 h-6" />
            <div>
              <p className="font-medium">Tests Not Run</p>
              <p className="text-white/70 text-sm">Click "Run All Tests" to verify authentication</p>
            </div>
          </div>
        )}
      </div>

      {/* Quick Navigation */}
      <div className="glass p-6 rounded-xl">
        <h2 className="text-xl font-semibold mb-4 text-white">Quick Navigation</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link href="/trades" className="p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors text-center">
            <p className="text-white font-medium">Trades</p>
            <p className="text-white/50 text-xs">Server Auth</p>
          </Link>
          <Link href="/analytics" className="p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors text-center">
            <p className="text-white font-medium">Analytics</p>
            <p className="text-white/50 text-xs">Server Auth</p>
          </Link>
          <Link href="/dashboard" className="p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors text-center">
            <p className="text-white font-medium">Dashboard</p>
            <p className="text-white/50 text-xs">Client Auth</p>
          </Link>
          <Link href="/strategies" className="p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors text-center">
            <p className="text-white font-medium">Strategies</p>
            <p className="text-white/50 text-xs">Client Auth</p>
          </Link>
        </div>
      </div>
    </div>
  );
}