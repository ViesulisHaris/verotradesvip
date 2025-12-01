'use client';

import { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { supabase } from '@/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export default function SimpleCalendarTest() {
  const { user, session, loading: authLoading, authInitialized } = useAuth();
  const [testData, setTestData] = useState<any>({
    authStatus: 'checking',
    tradesCount: 0,
    sampleTrades: [],
    calendarDays: 0,
    error: null
  });

  useEffect(() => {
    const runTest = async () => {
      try {
        // Test 1: Check auth status
        setTestData((prev: any) => ({ ...prev, authStatus: authInitialized ? (user ? 'authenticated' : 'not authenticated') : 'loading' }));

        if (!authInitialized || !user) {
          return;
        }

        // Test 2: Fetch trades
        const currentDate = new Date();
        const { data, error } = await supabase
          .from('trades')
          .select('*')
          .eq('user_id', user.id)
          .gte('trade_date', format(startOfMonth(currentDate), 'yyyy-MM-dd'))
          .lte('trade_date', format(endOfMonth(currentDate), 'yyyy-MM-dd'))
          .limit(10);

        if (error) {
          setTestData((prev: any) => ({ ...prev, error: error.message }));
          return;
        }

        // Test 3: Generate calendar days
        const days = eachDayOfInterval({ 
          start: startOfMonth(currentDate), 
          end: endOfMonth(currentDate) 
        });

        setTestData({
          authStatus: 'authenticated',
          tradesCount: data?.length || 0,
          sampleTrades: data?.slice(0, 3) || [],
          calendarDays: days.length,
          error: null
        });

      } catch (err) {
        setTestData((prev: any) => ({
          ...prev, 
          error: err instanceof Error ? err.message : 'Unknown error' 
        }));
      }
    };

    if (authInitialized) {
      runTest();
    }
  }, [authInitialized, user]);

  return (
    <div className="min-h-screen p-8 bg-gray-900 text-white">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Simple Calendar Test</h1>
        
        <div className="space-y-6">
          <div className="p-6 bg-gray-800 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Authentication Status</h2>
            <p className="text-lg">Status: <span className={`font-bold ${
              testData.authStatus === 'authenticated' ? 'text-green-400' : 
              testData.authStatus === 'not authenticated' ? 'text-red-400' : 'text-yellow-400'
            }`}>{testData.authStatus}</span></p>
            <p className="text-sm text-gray-400">User ID: {user?.id || 'N/A'}</p>
            <p className="text-sm text-gray-400">Loading: {authLoading ? 'Yes' : 'No'}</p>
            <p className="text-sm text-gray-400">Initialized: {authInitialized ? 'Yes' : 'No'}</p>
          </div>

          <div className="p-6 bg-gray-800 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Calendar Data</h2>
            <p className="text-lg">Calendar Days Generated: <span className="font-bold text-blue-400">{testData.calendarDays}</span></p>
            <p className="text-lg">Trades Found: <span className="font-bold text-blue-400">{testData.tradesCount}</span></p>
          </div>

          {testData.error && (
            <div className="p-6 bg-red-900/50 border border-red-500 rounded-lg">
              <h2 className="text-xl font-semibold mb-4 text-red-400">Error</h2>
              <p className="text-red-300">{testData.error}</p>
            </div>
          )}

          {testData.sampleTrades.length > 0 && (
            <div className="p-6 bg-gray-800 rounded-lg">
              <h2 className="text-xl font-semibold mb-4">Sample Trades</h2>
              <div className="space-y-2">
                {testData.sampleTrades.map((trade: any, index: number) => (
                  <div key={index} className="p-3 bg-gray-700 rounded text-sm">
                    <p><strong>ID:</strong> {trade.id}</p>
                    <p><strong>Symbol:</strong> {trade.symbol}</p>
                    <p><strong>Date:</strong> {trade.trade_date}</p>
                    <p><strong>P&L:</strong> ${trade.pnl || 0}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="p-6 bg-gray-800 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Actions</h2>
            <div className="space-x-4">
              <button 
                onClick={() => window.location.href = '/calendar'}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              >
                Go to Calendar Page
              </button>
              <button 
                onClick={() => window.location.href = '/log-trade'}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
              >
                Add Test Trade
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}