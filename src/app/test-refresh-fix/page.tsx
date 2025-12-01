'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/supabase/client';

export default function TestRefreshFix() {
  const [logs, setLogs] = useState<string[]>([]);
  const [testStartTime, setTestStartTime] = useState<Date>(new Date());
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isTestRunning, setIsTestRunning] = useState(false);
  const [refreshCount, setRefreshCount] = useState(0);
  const [dataFetchCount, setDataFetchCount] = useState(0);
  const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
    console.log(`[REFRESH TEST] ${message}`);
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isTestRunning) {
      interval = setInterval(() => {
        setElapsedTime(Math.floor((new Date().getTime() - testStartTime.getTime()) / 1000));
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTestRunning, testStartTime]);

  useEffect(() => {
    // Monitor for actual page refreshes
    const handleBeforeUnload = () => {
      addLog('⚠️ PAGE REFRESH DETECTED - User is refreshing or leaving the page');
    };
    
    // Monitor for visibility changes (tab switching)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        addLog('👁️ Page became hidden (tab switched or minimized)');
      } else {
        addLog('👁️ Page became visible again');
      }
    };
    
    // Monitor for storage events (trade deletion)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'trade-deleted') {
        addLog('🗑️ Trade deletion detected via storage event');
        setRefreshCount(prev => prev + 1);
        setLastRefreshTime(new Date());
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const startTest = () => {
    setTestStartTime(new Date());
    setElapsedTime(0);
    setLogs([]);
    setRefreshCount(0);
    setDataFetchCount(0);
    setLastRefreshTime(null);
    setIsTestRunning(true);
    addLog('🚀 Refresh test started');
    addLog('📊 Monitoring confluence page refresh behavior for 60+ seconds');
    addLog('🔍 Fix implemented: 60-second refresh interval + document.hidden check');
  };

  const stopTest = () => {
    setIsTestRunning(false);
    addLog('🛑 Test stopped');
  };

  const simulateDataFetch = () => {
    setDataFetchCount(prev => prev + 1);
    addLog('📥 Simulated data fetch (like confluence page would do)');
  };

  const simulateTradeDeletion = () => {
    // Simulate the storage event that would trigger a refresh
    localStorage.setItem('trade-deleted', Date.now().toString());
    addLog('🗑️ Simulated trade deletion (triggers storage event)');
    setTimeout(() => {
      localStorage.removeItem('trade-deleted');
    }, 100);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-blue-400">Refresh Fix Test Monitor</h1>
        
        <div className="bg-gray-800 rounded-lg p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Test Status</h2>
              <p className="text-gray-400">Monitoring confluence page refresh behavior</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-mono">{formatTime(elapsedTime)}</div>
              <div className="text-sm text-gray-400">Elapsed Time</div>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="bg-gray-700 rounded p-3">
              <div className="text-2xl font-bold text-green-400">{refreshCount}</div>
              <div className="text-sm text-gray-400">Refresh Events</div>
            </div>
            <div className="bg-gray-700 rounded p-3">
              <div className="text-2xl font-bold text-blue-400">{dataFetchCount}</div>
              <div className="text-sm text-gray-400">Data Fetches</div>
            </div>
            <div className="bg-gray-700 rounded p-3">
              <div className={`text-2xl font-bold ${isTestRunning ? 'text-yellow-400' : 'text-gray-500'}`}>
                {isTestRunning ? 'RUNNING' : 'STOPPED'}
              </div>
              <div className="text-sm text-gray-400">Test State</div>
            </div>
          </div>
          
          <div className="flex gap-3">
            {!isTestRunning ? (
              <button
                onClick={startTest}
                className="px-6 py-2 bg-green-600 hover:bg-green-700 rounded-lg font-semibold transition-colors"
              >
                Start Test
              </button>
            ) : (
              <button
                onClick={stopTest}
                className="px-6 py-2 bg-red-600 hover:bg-red-700 rounded-lg font-semibold transition-colors"
              >
                Stop Test
              </button>
            )}
            <button
              onClick={simulateDataFetch}
              disabled={isTestRunning}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:opacity-50 rounded-lg font-semibold transition-colors"
            >
              Simulate Data Fetch
            </button>
            <button
              onClick={simulateTradeDeletion}
              disabled={isTestRunning}
              className="px-6 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:opacity-50 rounded-lg font-semibold transition-colors"
            >
              Simulate Trade Deletion
            </button>
          </div>
        </div>
        
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-xl font-semibold mb-4">Test Logs</h3>
          <div className="bg-black rounded p-4 h-96 overflow-y-auto font-mono text-sm">
            {logs.length === 0 ? (
              <div className="text-gray-500">No logs yet. Start the test to begin monitoring.</div>
            ) : (
              logs.map((log, index) => (
                <div key={index} className="mb-1">
                  {log}
                </div>
              ))
            )}
          </div>
        </div>
        
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-xl font-semibold mb-4">Test Instructions</h3>
          <ol className="list-decimal list-inside space-y-2 text-gray-300">
            <li>Click "Start Test" to begin monitoring refresh behavior</li>
            <li>Open the confluence page in a separate tab</li>
            <li>Monitor the confluence page for at least 60 seconds without interaction</li>
            <li>Check that no unwanted refreshes occur (should only refresh every 60 seconds when visible)</li>
            <li>Verify that data remains stable during normal viewing</li>
            <li>Test tab switching to confirm background refresh prevention</li>
            <li>Use "Simulate Trade Deletion" to test legitimate refresh triggers</li>
          </ol>
        </div>
        
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-xl font-semibold mb-4">Expected Behavior</h3>
          <div className="space-y-2 text-gray-300">
            <p>✅ Page should only refresh every 60 seconds (not 30)</p>
            <p>✅ No refreshes should occur when page is hidden (tab switched)</p>
            <p>✅ Storage events (trade deletion) should still trigger refreshes</p>
            <p>✅ Data should remain stable during normal viewing</p>
            <p>✅ No random refreshes should occur during the 60-second interval</p>
          </div>
        </div>
      </div>
    </div>
  );
}