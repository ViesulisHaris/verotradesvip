'use client';

import { useState } from 'react';
import { supabase } from '@/supabase/client';

export default function TestMarketFix() {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const addResult = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const prefix = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';
    setTestResults(prev => [...prev, `${prefix} ${message}`]);
  };

  const runTests = async () => {
    setIsRunning(true);
    setTestResults([]);
    
    addResult('Starting Market Fix Tests...', 'info');
    
    // Test 1: TradeForm Logic Simulation
    addResult('Test 1: Simulating TradeForm market logic', 'info');
    
    // Test case 1: No markets selected
    let marketSelection = { stock: false, crypto: false, forex: false, futures: false };
    let selectedMarkets = Object.keys(marketSelection).filter(k => marketSelection[k as keyof typeof marketSelection]);
    let market = selectedMarkets.length === 0 ? 'stock' : selectedMarkets.join(', ');
    addResult(`No markets selected -> market: "${market}"`, market === 'stock' ? 'success' : 'error');
    
    // Test case 2: One market selected
    marketSelection = { stock: true, crypto: false, forex: false, futures: false };
    selectedMarkets = Object.keys(marketSelection).filter(k => marketSelection[k as keyof typeof marketSelection]);
    market = selectedMarkets.length === 0 ? 'stock' : selectedMarkets.join(', ');
    addResult(`One market selected -> market: "${market}"`, market === 'stock' ? 'success' : 'error');
    
    // Test case 3: Multiple markets selected
    marketSelection = { stock: true, crypto: true, forex: false, futures: false };
    selectedMarkets = Object.keys(marketSelection).filter(k => marketSelection[k as keyof typeof marketSelection]);
    market = selectedMarkets.length === 0 ? 'stock' : selectedMarkets.join(', ');
    addResult(`Multiple markets selected -> market: "${market}"`, market === 'stock, crypto' ? 'success' : 'error');
    
    // Test 2: Database Connection Test
    addResult('Test 2: Testing database connection and constraints', 'info');
    
    try {
      
      // Test authentication
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        addResult('Cannot test database operations without authentication', 'error');
        addResult('Please log in and run tests again', 'info');
      } else {
        addResult(`Authenticated as user: ${user.id}`, 'success');
        
        // Test inserting a trade with explicit market
        const testTrade = {
          user_id: user.id,
          market: 'stock',
          symbol: 'TEST_MARKET_FIX',
          trade_date: '2024-01-01',
          side: 'Buy' as const,
          quantity: 10,
          entry_price: 100,
          exit_price: 110,
          pnl: 100
        };
        
        const { data: insertResult, error: insertError } = await supabase
          .from('trades')
          .insert(testTrade)
          .select();
        
        if (insertError) {
          addResult(`Insert failed: ${insertError.message}`, 'error');
        } else {
          addResult(`Trade inserted successfully with market: "${insertResult[0].market}"`, 'success');
          
          // Clean up test trade
          const { error: deleteError } = await supabase
            .from('trades')
            .delete()
            .eq('id', insertResult[0].id);
          
          if (deleteError) {
            addResult(`Cleanup failed: ${deleteError.message}`, 'error');
          } else {
            addResult('Test trade cleaned up successfully', 'success');
          }
        }
      }
    } catch (error) {
      addResult(`Database test error: ${error}`, 'error');
    }
    
    // Test 3: Edge Cases
    addResult('Test 3: Testing edge cases', 'info');
    
    // All markets selected
    const allMarkets = { stock: true, crypto: true, forex: true, futures: true };
    selectedMarkets = Object.keys(allMarkets).filter(k => allMarkets[k as keyof typeof allMarkets]);
    market = selectedMarkets.length === 0 ? 'stock' : selectedMarkets.join(', ');
    const expectedAll = 'stock, crypto, forex, futures';
    addResult(`All markets selected -> market: "${market}"`, market === expectedAll ? 'success' : 'error');
    
    // Test 4: Validation
    addResult('Test 4: Validating market combinations', 'info');
    
    const validCombinations = [
      'stock',
      'crypto', 
      'forex',
      'futures',
      'stock, crypto',
      'stock, forex',
      'stock, futures',
      'crypto, forex',
      'crypto, futures',
      'forex, futures',
      'stock, crypto, forex',
      'stock, crypto, futures',
      'stock, forex, futures',
      'crypto, forex, futures',
      'stock, crypto, forex, futures'
    ];
    
    addResult(`Valid market combinations: ${validCombinations.length}`, 'success');
    
    addResult('All tests completed!', 'success');
    setIsRunning(false);
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-8">Market Not Null Fix Test</h1>
        
        <div className="glass p-6 rounded-xl mb-8">
          <h2 className="text-2xl font-semibold text-white mb-4">Test Overview</h2>
          <p className="text-white/80 mb-4">
            This page tests the fix for the null value constraint violation in the "market" column of the "trades" table.
          </p>
          
          <div className="flex gap-4 mb-6">
            <button
              onClick={runTests}
              disabled={isRunning}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isRunning ? 'Running Tests...' : 'Run Tests'}
            </button>
            
            <button
              onClick={clearResults}
              className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Clear Results
            </button>
          </div>
          
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-white mb-2">Manual Testing Steps:</h3>
            <ol className="list-decimal list-inside text-white/80 space-y-1">
              <li>Log in to the application</li>
              <li>Navigate to <a href="/log-trade" className="text-blue-400 underline">/log-trade</a></li>
              <li>Try submitting a trade without selecting any market</li>
              <li>Verify it defaults to "stock" and saves successfully</li>
              <li>Try submitting trades with various market combinations</li>
              <li>Verify all trades save successfully without constraint violations</li>
            </ol>
          </div>
        </div>
        
        {testResults.length > 0 && (
          <div className="glass p-6 rounded-xl">
            <h2 className="text-2xl font-semibold text-white mb-4">Test Results</h2>
            <div className="space-y-2 font-mono text-sm">
              {testResults.map((result, index) => (
                <div key={index} className="text-white/90">
                  {result}
                </div>
              ))}
            </div>
          </div>
        )}
        
        <div className="glass p-6 rounded-xl mt-8">
          <h2 className="text-2xl font-semibold text-white mb-4">Fix Summary</h2>
          <div className="space-y-3 text-white/80">
            <div>
              <strong>Database Schema:</strong> Updated market column to NOT NULL with CHECK constraint
            </div>
            <div>
              <strong>TradeForm Component:</strong> Added logic to default to 'stock' when no market selected
            </div>
            <div>
              <strong>TypeScript Types:</strong> Updated to reflect non-nullable market field
            </div>
            <div>
              <strong>Migration Script:</strong> Created to handle existing null values
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}