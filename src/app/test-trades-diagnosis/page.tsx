'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext-simple';
import { fetchTradesPaginated, fetchTradesStatistics } from '@/lib/optimized-queries';
import AuthGuard from '@/components/AuthGuard';

export default function TradesDiagnosisTest() {
  const { user, loading: authLoading, authInitialized } = useAuth();
  const [testResults, setTestResults] = useState<any[]>([]);
  
  const addTestResult = (test: string, status: 'pass' | 'fail' | 'pending', message: string, data?: any) => {
    setTestResults(prev => [...prev, {
      test,
      status,
      message,
      data,
      timestamp: new Date().toISOString()
    }]);
  };

  useEffect(() => {
    console.log('🔍 [TRADES_DIAGNOSIS_TEST] Component mounted with auth state:', {
      user: user ? `Present (${user.id})` : 'NULL',
      userEmail: user?.email || 'N/A',
      authLoading,
      authInitialized,
      timestamp: new Date().toISOString()
    });

    // Test 1: Check authentication state
    if (authInitialized) {
      addTestResult('Authentication Initialization', 'pass', `Auth initialized successfully`);
    } else {
      addTestResult('Authentication Initialization', 'pending', 'Waiting for auth initialization...');
    }

    // Test 2: Check if user is available
    if (user) {
      addTestResult('User Availability', 'pass', `User available: ${user.email}`);
      
      // Test 3: Try to fetch trades data
      const testTradesFetch = async () => {
        try {
          addTestResult('Trades Fetch Test', 'pending', 'Starting trades fetch test...');
          
          console.log('🔍 [TRADES_DIAGNOSIS_TEST] Starting trades fetch for user:', user.id);
          
          const tradesResult = await fetchTradesPaginated(user.id, {
            page: 1,
            limit: 10
          });
          
          console.log('🔍 [TRADES_DIAGNOSIS_TEST] Trades fetch result:', tradesResult);
          
          addTestResult('Trades Fetch Test', 'pass', `Successfully fetched ${tradesResult.data.length} trades`, {
            totalCount: tradesResult.totalCount,
            dataLength: tradesResult.data.length,
            sampleData: tradesResult.data.slice(0, 2)
          });
          
          // Test 4: Try to fetch statistics
          addTestResult('Statistics Fetch Test', 'pending', 'Starting statistics fetch test...');
          
          const statsResult = await fetchTradesStatistics(user.id);
          
          console.log('🔍 [TRADES_DIAGNOSIS_TEST] Statistics fetch result:', statsResult);
          
          addTestResult('Statistics Fetch Test', 'pass', `Successfully fetched statistics`, statsResult);
          
        } catch (error) {
          console.error('🔍 [TRADES_DIAGNOSIS_TEST] Error during data fetch test:', error);
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          addTestResult('Data Fetch Test', 'fail', `Error: ${errorMessage}`, error);
        }
      };

      // Delay the test to ensure auth is fully ready
      setTimeout(testTradesFetch, 1000);
      
    } else {
      addTestResult('User Availability', 'fail', 'No user available - authentication failed');
    }
  }, [user, authLoading, authInitialized]);

  return (
    <div className="min-h-screen bg-[#050505] text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-gold">Trades Data Diagnosis Test</h1>
        
        <div className="mb-8 p-6 bg-[#1a1a1a] rounded-lg border border-white/10">
          <h2 className="text-xl font-semibold mb-4">Authentication State</h2>
          <div className="space-y-2 font-mono text-sm">
            <div>User: {user ? `${user.email} (${user.id})` : 'NULL'}</div>
            <div>Loading: {authLoading ? 'YES' : 'NO'}</div>
            <div>Initialized: {authInitialized ? 'YES' : 'NO'}</div>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold mb-4">Test Results</h2>
          {testResults.map((result, index) => (
            <div 
              key={index}
              className={`p-4 rounded-lg border ${
                result.status === 'pass' ? 'bg-green-900/20 border-green-500/30' :
                result.status === 'fail' ? 'bg-red-900/20 border-red-500/30' :
                'bg-yellow-900/20 border-yellow-500/30'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold">{result.test}</span>
                <span className={`px-2 py-1 rounded text-xs ${
                  result.status === 'pass' ? 'bg-green-600' :
                  result.status === 'fail' ? 'bg-red-600' :
                  'bg-yellow-600'
                }`}>
                  {result.status.toUpperCase()}
                </span>
              </div>
              <div className="text-sm text-gray-300 mb-2">{result.message}</div>
              {result.data && (
                <div className="text-xs font-mono bg-black/30 p-2 rounded mt-2">
                  <pre>{JSON.stringify(result.data, null, 2)}</pre>
                </div>
              )}
              <div className="text-xs text-gray-500 mt-2">{result.timestamp}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}