'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/supabase/client';
import { validateUUID } from '@/lib/uuid-validation';

export default function TestStrategyDeletionFix() {
  const [user, setUser] = useState<any>(null);
  const [strategies, setStrategies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [testResults, setTestResults] = useState<string[]>([]);

  const addTestResult = (message: string, isError: boolean = false) => {
    setTestResults(prev => [...prev, `${isError ? '❌' : '✅'} ${new Date().toLocaleTimeString()}: ${message}`]);
  };

  useEffect(() => {
    const initializeTest = async () => {
      try {
        addTestResult('Starting strategy deletion fix test...');
        
        // Check user authentication
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          addTestResult(`Session error: ${sessionError.message}`, true);
          setLoading(false);
          return;
        }
        
        if (!session || !session.user) {
          addTestResult('No authenticated user found. Please log in first.', true);
          setLoading(false);
          return;
        }
        
        setUser(session.user);
        addTestResult(`User authenticated: ${session.user.email}`);
        
        // Load user's strategies
        const { data: strategiesData, error: strategiesError } = await supabase
          .from('strategies')
          .select('*')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false });
        
        if (strategiesError) {
          addTestResult(`Error loading strategies: ${strategiesError.message}`, true);
        } else {
          setStrategies(strategiesData || []);
          addTestResult(`Loaded ${strategiesData?.length || 0} strategies`);
        }
        
      } catch (error) {
        addTestResult(`Initialization error: ${error instanceof Error ? error.message : 'Unknown error'}`, true);
      } finally {
        setLoading(false);
      }
    };
    
    initializeTest();
  }, []);

  const testDeletion = async (strategyId: string, strategyName: string) => {
    try {
      addTestResult(`Testing deletion of strategy: ${strategyName}`);
      
      // Test the fixed authentication logic
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        addTestResult(`Session error during deletion test: ${sessionError.message}`, true);
        return;
      }
      
      if (!session || !session.user) {
        addTestResult('No authenticated session during deletion test', true);
        return;
      }
      
      addTestResult('Authentication check passed - user is logged in');
      
      // Validate UUIDs
      const validatedStrategyId = validateUUID(strategyId, 'strategy_id');
      const validatedUserId = validateUUID(session.user.id, 'user_id');
      
      addTestResult('UUID validation passed');
      
      // Test the deletion operation
      const { error } = await supabase
        .from('strategies')
        .delete()
        .eq('id', validatedStrategyId)
        .eq('user_id', validatedUserId);
      
      if (error) {
        addTestResult(`Deletion failed: ${error.message}`, true);
        if (error.code) {
          addTestResult(`Error code: ${error.code}`);
        }
      } else {
        addTestResult(`Successfully deleted strategy: ${strategyName}`);
        
        // Refresh strategies list
        const { data: updatedStrategies } = await supabase
          .from('strategies')
          .select('*')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false });
        
        setStrategies(updatedStrategies || []);
        addTestResult(`Strategies list refreshed - now have ${updatedStrategies?.length || 0} strategies`);
      }
      
    } catch (error) {
      addTestResult(`Exception during deletion test: ${error instanceof Error ? error.message : 'Unknown error'}`, true);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p>Loading test environment...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">Strategy Deletion Fix Test</h1>
        
        {/* User Info */}
        <div className="glass p-6 mb-6">
          <h2 className="text-xl font-semibold text-white mb-4">Authentication Status</h2>
          {user ? (
            <div className="text-green-400">
              <p>✅ Logged in as: {user.email}</p>
              <p>User ID: {user.id}</p>
            </div>
          ) : (
            <div className="text-red-400">
              <p>❌ Not logged in</p>
            </div>
          )}
        </div>
        
        {/* Test Results */}
        <div className="glass p-6 mb-6">
          <h2 className="text-xl font-semibold text-white mb-4">Test Results</h2>
          <div className="bg-black/30 rounded-lg p-4 h-64 overflow-y-auto">
            {testResults.length === 0 ? (
              <p className="text-gray-400">No test results yet...</p>
            ) : (
              testResults.map((result, index) => (
                <div key={index} className="text-sm text-white/80 mb-2 font-mono">
                  {result}
                </div>
              ))
            )}
          </div>
        </div>
        
        {/* Strategies List */}
        <div className="glass p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Available Strategies for Testing</h2>
          {strategies.length === 0 ? (
            <p className="text-gray-400">No strategies found to test deletion.</p>
          ) : (
            <div className="space-y-4">
              {strategies.map((strategy) => (
                <div key={strategy.id} className="bg-black/30 rounded-lg p-4 flex justify-between items-center">
                  <div>
                    <h3 className="text-white font-semibold">{strategy.name}</h3>
                    <p className="text-gray-400 text-sm">{strategy.description || 'No description'}</p>
                    <p className="text-gray-500 text-xs">ID: {strategy.id}</p>
                  </div>
                  <button
                    onClick={() => {
                      if (confirm(`Are you sure you want to delete "${strategy.name}"? This is a test deletion.`)) {
                        testDeletion(strategy.id, strategy.name);
                      }
                    }}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Test Deletion
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Instructions */}
        <div className="glass p-6 mt-6">
          <h2 className="text-xl font-semibold text-white mb-4">Test Instructions</h2>
          <ol className="text-white/80 space-y-2 list-decimal list-inside">
            <li>Ensure you are logged in (check Authentication Status above)</li>
            <li>Select a strategy from the list below to test deletion</li>
            <li>Click "Test Deletion" to attempt deleting the strategy</li>
            <li>Monitor the Test Results section for detailed feedback</li>
            <li>The test will verify authentication, UUID validation, and the actual deletion operation</li>
          </ol>
        </div>
      </div>
    </div>
  );
}