'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/supabase/client';
import { getStrategiesWithStats } from '@/lib/strategy-rules-engine';
import { useRouter } from 'next/navigation';
import { validateUUID } from '@/lib/uuid-validation';

interface TestResult {
  step: string;
  status: 'pending' | 'running' | 'success' | 'error';
  message: string;
  details?: string;
  error?: Error;
  timestamp?: string;
}

interface AuthState {
  user: any;
  session: any;
  isAuthenticated: boolean;
}

export default function TestStrategyError() {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [authState, setAuthState] = useState<AuthState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [rawDbResponse, setRawDbResponse] = useState<any>(null);
  const [strategiesData, setStrategiesData] = useState<any[]>([]);
  const router = useRouter();

  const addTestResult = (step: string, status: TestResult['status'], message: string, details?: string, error?: Error) => {
    const result: TestResult = {
      step,
      status,
      message,
      details,
      error,
      timestamp: new Date().toISOString()
    };
    
    setTestResults(prev => {
      const existingIndex = prev.findIndex(r => r.step === step);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = result;
        return updated;
      }
      return [...prev, result];
    });
  };

  const testWithFreshToken = async () => {
    setIsLoading(true);
    setTestResults([]);
    
    try {
      // Step 1: Force session refresh
      addTestResult('Session Refresh', 'running', 'Attempting to refresh authentication session...');
      
      const { data: { session }, error: refreshError } = await supabase.auth.refreshSession();
      
      if (refreshError) {
        addTestResult('Session Refresh', 'error', 'Failed to refresh session', refreshError.message, refreshError);
        return;
      }
      
      addTestResult('Session Refresh', 'success', 'Session refreshed successfully', JSON.stringify(session, null, 2));
      
      // Step 2: Test authentication with fresh token
      await testAuthentication();
      
      // Step 3: Test strategy loading with fresh token
      await testStrategyLoading();
      
    } catch (error) {
      addTestResult('Fresh Token Test', 'error', 'Unexpected error during fresh token test', 
        error instanceof Error ? error.message : 'Unknown error', error instanceof Error ? error : undefined);
    } finally {
      setIsLoading(false);
    }
  };

  const testAuthentication = async () => {
    // Test 1: Check if user is authenticated
    addTestResult('Authentication Check', 'running', 'Checking user authentication...');
    
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        addTestResult('Authentication Check', 'error', 'Authentication failed', userError.message, userError);
        setAuthState({ user: null, session: null, isAuthenticated: false });
        return;
      }
      
      if (!user) {
        addTestResult('Authentication Check', 'error', 'No user found - not authenticated');
        setAuthState({ user: null, session: null, isAuthenticated: false });
        return;
      }
      
      addTestResult('Authentication Check', 'success', `User authenticated: ${user.email || user.id}`, 
        `User ID: ${user.id}\nEmail: ${user.email}\nCreated: ${user.created_at}`);
      
      // Test 2: Check session validity
      addTestResult('Session Check', 'running', 'Checking session validity...');
      
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        addTestResult('Session Check', 'error', 'Session check failed', sessionError.message, sessionError);
        setAuthState({ user, session: null, isAuthenticated: false });
        return;
      }
      
      if (!session) {
        addTestResult('Session Check', 'error', 'No active session found');
        setAuthState({ user, session: null, isAuthenticated: false });
        return;
      }
      
      const expiresAt = new Date((session.expires_at || 0) * 1000);
      const now = new Date();
      const isExpired = expiresAt <= now;
      
      addTestResult('Session Check', isExpired ? 'error' : 'success', 
        isExpired ? 'Session expired' : 'Session valid', 
        `Expires: ${expiresAt.toISOString()}\nNow: ${now.toISOString()}\nExpired: ${isExpired}`);
      
      setAuthState({ user, session, isAuthenticated: !isExpired });
      
    } catch (error) {
      addTestResult('Authentication Check', 'error', 'Authentication check failed', 
        error instanceof Error ? error.message : 'Unknown error', error instanceof Error ? error : undefined);
    }
  };

  const testDatabaseDirectly = async () => {
    if (!authState?.isAuthenticated || !authState?.user?.id) {
      addTestResult('Database Test', 'error', 'Cannot test database - user not authenticated');
      return;
    }
    
    addTestResult('Database Test', 'running', 'Testing direct database access...');
    
    try {
      // Validate user ID
      const validatedUserId = validateUUID(authState.user.id, 'user_id');
      
      // Test 1: Basic connection
      addTestResult('Basic Connection', 'running', 'Testing basic database connection...');
      
      const { data: connectionTest, error: connectionError } = await supabase
        .from('users')
        .select('count', { count: 'exact', head: true });
      
      if (connectionError) {
        addTestResult('Basic Connection', 'error', 'Database connection failed', connectionError.message, connectionError);
        return;
      }
      
      addTestResult('Basic Connection', 'success', 'Database connection successful');
      
      // Test 2: Strategies table access
      addTestResult('Strategies Table', 'running', 'Testing strategies table access...');
      
      const { data: strategiesData, error: strategiesError } = await supabase
        .from('strategies')
        .select('*')
        .eq('user_id', validatedUserId)
        .order('created_at', { ascending: false });
      
      if (strategiesError) {
        addTestResult('Strategies Table', 'error', 'Strategies table access failed', strategiesError.message, strategiesError);
        setRawDbResponse({ error: strategiesError, data: null });
        return;
      }
      
      addTestResult('Strategies Table', 'success', `Successfully accessed strategies table (${strategiesData?.length || 0} strategies)`);
      setRawDbResponse({ error: null, data: strategiesData });
      setStrategiesData(strategiesData || []);
      
      // Test 3: Check user permissions
      addTestResult('User Permissions', 'running', 'Checking user permissions...');
      
      const { data: userData, error: userPermissionError } = await supabase
        .from('users')
        .select('*')
        .eq('id', validatedUserId)
        .single();
      
      if (userPermissionError) {
        addTestResult('User Permissions', 'error', 'User permission check failed', userPermissionError.message, userPermissionError);
        return;
      }
      
      addTestResult('User Permissions', 'success', 'User has permission to access strategies', JSON.stringify(userData, null, 2));
      
    } catch (error) {
      addTestResult('Database Test', 'error', 'Database test failed', 
        error instanceof Error ? error.message : 'Unknown error', error instanceof Error ? error : undefined);
    }
  };

  const testStrategyLoading = async () => {
    if (!authState?.isAuthenticated || !authState?.user?.id) {
      addTestResult('Strategy Loading', 'error', 'Cannot test strategy loading - user not authenticated');
      return;
    }
    
    addTestResult('Strategy Loading', 'running', 'Testing strategy loading with getStrategiesWithStats...');
    
    try {
      // Validate user ID
      const validatedUserId = validateUUID(authState.user.id, 'user_id');
      
      // Call the same function used by the main strategies page
      const strategies = await getStrategiesWithStats(validatedUserId);
      
      addTestResult('Strategy Loading', 'success', `Successfully loaded ${strategies.length} strategies`, 
        JSON.stringify(strategies, null, 2));
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : '';
      
      addTestResult('Strategy Loading', 'error', 'Strategy loading failed', errorMessage, error instanceof Error ? error : undefined);
      
      // Additional error analysis
      if (errorMessage.includes('relation') && errorMessage.includes('does not exist')) {
        addTestResult('Error Analysis', 'error', 'Schema cache issue detected - relation does not exist', 
          'This is likely a schema cache issue. Try clearing the cache or refreshing the page.');
      } else if (errorMessage.includes('invalid input syntax for type uuid')) {
        addTestResult('Error Analysis', 'error', 'UUID validation error detected', 
          'There is an invalid UUID being passed to the database. Check user ID and strategy IDs.');
      } else if (errorMessage.includes('permission denied')) {
        addTestResult('Error Analysis', 'error', 'Permission error detected', 
          'User does not have permission to access the strategies table or related data.');
      } else {
        addTestResult('Error Analysis', 'error', 'Unknown error type detected', 
          'This is an unexpected error. Check the full error details below.');
      }
    }
  };

  const runAllTests = async () => {
    setIsLoading(true);
    setTestResults([]);
    setRawDbResponse(null);
    setStrategiesData([]);
    
    try {
      await testAuthentication();
      await testDatabaseDirectly();
      await testStrategyLoading();
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Run initial authentication check on page load
    testAuthentication();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-green-600 bg-green-50 border-green-200';
      case 'error': return 'text-red-600 bg-red-50 border-red-200';
      case 'running': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'running': return '⏳';
      default: return '⏸️';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Strategy Error Diagnostic Tool</h1>
          <p className="text-lg text-gray-600">
            Focused diagnostic tool to identify the exact error when loading strategies
          </p>
        </div>

        {/* Authentication State */}
        {authState && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Authentication State</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 border rounded-lg">
                <div className="text-sm font-medium text-gray-500 mb-1">User ID</div>
                <div className="text-sm font-mono break-all">{authState.user?.id || 'Not available'}</div>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="text-sm font-medium text-gray-500 mb-1">Email</div>
                <div className="text-sm font-mono break-all">{authState.user?.email || 'Not available'}</div>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="text-sm font-medium text-gray-500 mb-1">Authenticated</div>
                <div className={`text-sm font-bold ${authState.isAuthenticated ? 'text-green-600' : 'text-red-600'}`}>
                  {authState.isAuthenticated ? 'Yes' : 'No'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Diagnostic Actions</h2>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={runAllTests}
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Running Tests...' : 'Run All Tests'}
            </button>
            
            <button
              onClick={testWithFreshToken}
              disabled={isLoading}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Testing...' : 'Test with Fresh Token'}
            </button>
            
            <button
              onClick={testDatabaseDirectly}
              disabled={isLoading || !authState?.isAuthenticated}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Testing...' : 'Check Database Directly'}
            </button>
            
            <button
              onClick={() => router.push('/strategies')}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              Back to Strategies
            </button>
          </div>
        </div>

        {/* Test Results */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Test Results</h2>
          <div className="space-y-4">
            {testResults.length === 0 ? (
              <p className="text-gray-500">No tests run yet. Click one of the action buttons above to start testing.</p>
            ) : (
              testResults.map((result) => (
                <div key={result.step} className={`p-4 border rounded-lg ${getStatusColor(result.status)}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <span className="text-lg">{getStatusIcon(result.status)}</span>
                      <div>
                        <h3 className="font-semibold">{result.step}</h3>
                        <p className="text-sm mt-1">{result.message}</p>
                        {result.timestamp && (
                          <p className="text-xs mt-1 opacity-75">Time: {result.timestamp}</p>
                        )}
                      </div>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(result.status)}`}>
                      {result.status}
                    </span>
                  </div>
                  
                  {result.details && (
                    <details className="mt-3">
                      <summary className="text-sm font-medium cursor-pointer">View Details</summary>
                      <pre className="mt-2 p-3 bg-gray-100 rounded text-xs overflow-x-auto whitespace-pre-wrap">
                        {result.details}
                      </pre>
                    </details>
                  )}
                  
                  {result.error && (
                    <details className="mt-3">
                      <summary className="text-sm font-medium cursor-pointer">View Error Stack Trace</summary>
                      <pre className="mt-2 p-3 bg-red-50 rounded text-xs overflow-x-auto whitespace-pre-wrap">
                        {result.error.stack}
                      </pre>
                    </details>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Raw Database Response */}
        {rawDbResponse && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Raw Database Response</h2>
            <div className="space-y-4">
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-2">Query Result</h3>
                {rawDbResponse.error ? (
                  <div className="text-red-600">
                    <p className="font-medium">Error:</p>
                    <p className="text-sm">{rawDbResponse.error.message}</p>
                    {rawDbResponse.error.details && (
                      <details className="mt-2">
                        <summary className="text-sm cursor-pointer">View Error Details</summary>
                        <pre className="mt-1 p-2 bg-red-50 rounded text-xs overflow-x-auto">
                          {JSON.stringify(rawDbResponse.error, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                ) : (
                  <div>
                    <p className="text-sm text-green-600 mb-2">Query successful</p>
                    <p className="text-sm font-medium">Found {strategiesData.length} strategies</p>
                  </div>
                )}
              </div>
              
              {strategiesData.length > 0 && (
                <div className="p-4 border rounded-lg">
                  <h3 className="font-semibold mb-2">Strategy Data Sample</h3>
                  <pre className="p-3 bg-gray-100 rounded text-xs overflow-x-auto">
                    {JSON.stringify(strategiesData.slice(0, 2), null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">How to Use This Tool</h2>
          <ol className="list-decimal pl-5 space-y-2 text-gray-600">
            <li>Click "Run All Tests" to perform a comprehensive diagnosis of the strategy loading issue</li>
            <li>If authentication issues are suspected, click "Test with Fresh Token" to refresh the session</li>
            <li>To test database access directly, click "Check Database Directly"</li>
            <li>Review the test results to identify the specific step that's failing</li>
            <li>Click "View Details" for any failed tests to see detailed error information</li>
            <li>Check the "Raw Database Response" section to see the exact database query results</li>
            <li>If you see schema cache errors, try refreshing the page or clearing browser cache</li>
          </ol>
        </div>
      </div>
    </div>
  );
}