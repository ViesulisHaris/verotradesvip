'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/supabase/client';
import { getStrategiesWithStats, calculateStrategyStats } from '@/lib/strategy-rules-engine';

export default function TestStrategyDiagnosisPage() {
  const [logs, setLogs] = useState<string[]>([]);
  const [diagnosis, setDiagnosis] = useState<any>({});

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
  };

  const runDiagnosis = async () => {
    try {
      addLog('🔍 Starting comprehensive strategy diagnosis...');
      
      // Test 1: Authentication
      addLog('\n🔍 Test 1: Checking authentication...');
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        addLog(`❌ Authentication failed: ${authError?.message || 'No user found'}`);
        return;
      }
      addLog(`✅ User authenticated: ${user.id}`);
      
      // Test 2: Check strategies table structure
      addLog('\n🔍 Test 2: Checking strategies table structure...');
      const { data: strategiesSample, error: strategiesError } = await supabase
        .from('strategies')
        .select('*')
        .eq('user_id', user.id)
        .limit(1);
      
      if (strategiesError) {
        addLog(`❌ Strategies table error: ${strategiesError.message}`);
      } else {
        addLog(`✅ Strategies table accessible`);
        if (strategiesSample && strategiesSample.length > 0) {
          const columns = Object.keys(strategiesSample[0]);
          addLog(`   Columns found: ${columns.join(', ')}`);
          
          // Check for critical columns
          const criticalColumns = ['id', 'name', 'user_id', 'is_active', 'description', 'rules'];
          const missingColumns = criticalColumns.filter(col => !columns.includes(col));
          
          if (missingColumns.length > 0) {
            addLog(`❌ Missing critical columns: ${missingColumns.join(', ')}`);
          } else {
            addLog(`✅ All critical columns present`);
          }
        } else {
          addLog(`⚠️ No strategies found for user`);
        }
      }
      
      // Test 3: Check strategy_stats table
      addLog('\n🔍 Test 3: Checking strategy_stats table...');
      const { data: statsData, error: statsError } = await supabase
        .from('strategy_stats')
        .select('*')
        .limit(1);
      
      if (statsError) {
        addLog(`❌ strategy_stats table error: ${statsError.message}`);
        addLog(`   This is likely the ROOT CAUSE - table doesn't exist`);
      } else {
        addLog(`✅ strategy_stats table exists`);
      }
      
      // Test 4: Check strategy_rules table
      addLog('\n🔍 Test 4: Checking strategy_rules table...');
      const { data: rulesData, error: rulesError } = await supabase
        .from('strategy_rules')
        .select('*')
        .limit(1);
      
      if (rulesError) {
        addLog(`❌ strategy_rules table error: ${rulesError.message}`);
      } else {
        addLog(`✅ strategy_rules table exists`);
        if (rulesData && rulesData.length > 0) {
          const ruleColumns = Object.keys(rulesData[0]);
          addLog(`   Rule columns: ${ruleColumns.join(', ')}`);
        }
      }
      
      // Test 5: Test getStrategiesWithStats function
      addLog('\n🔍 Test 5: Testing getStrategiesWithStats function...');
      const strategiesWithStats = await getStrategiesWithStats(user.id);
      
      if (strategiesWithStats && strategiesWithStats.length > 0) {
        addLog(`✅ getStrategiesWithStats returned ${strategiesWithStats.length} strategies`);
        const firstStrategy = strategiesWithStats[0];
        addLog(`   First strategy: ${firstStrategy?.name || 'Unknown'}`);
        addLog(`   Has stats: ${firstStrategy?.stats ? 'Yes' : 'No'}`);
        
        if (firstStrategy?.stats) {
          addLog(`   Stats keys: ${Object.keys(firstStrategy.stats).join(', ')}`);
        }
      } else {
        addLog(`❌ getStrategiesWithStats returned no strategies`);
      }
      
      // Test 6: Test calculateStrategyStats function
      if (strategiesWithStats && strategiesWithStats.length > 0) {
        addLog('\n🔍 Test 6: Testing calculateStrategyStats function...');
        const firstStrategyId = strategiesWithStats[0]?.id;
        if (firstStrategyId) {
          const calculatedStats = await calculateStrategyStats(firstStrategyId);
          
          if (calculatedStats) {
            addLog(`✅ calculateStrategyStats returned stats`);
            addLog(`   Total trades: ${calculatedStats.total_trades}`);
            addLog(`   Win rate: ${calculatedStats.winrate?.toFixed(1)}%`);
          } else {
            addLog(`❌ calculateStrategyStats returned null (no trades?)`);
          }
        }
      }
      
      // Test 7: Check trades table
      addLog('\n🔍 Test 7: Checking trades table...');
      const { data: tradesData, error: tradesError } = await supabase
        .from('trades')
        .select('id, strategy_id, pnl')
        .eq('user_id', user.id)
        .not('pnl', 'is', null)
        .limit(5);
      
      if (tradesError) {
        addLog(`❌ Trades table error: ${tradesError.message}`);
      } else {
        addLog(`✅ Found ${tradesData?.length || 0} trades with PnL`);
      }
      
      // Final Diagnosis
      setDiagnosis({
        authenticated: !!user,
        strategiesTable: !strategiesError,
        strategyStatsTable: !statsError,
        strategyRulesTable: !rulesError,
        strategiesCount: strategiesWithStats?.length || 0,
        tradesCount: tradesData?.length || 0
      });
      
    } catch (error) {
      addLog(`❌ Diagnosis exception: ${error}`);
    }
  };

  const clearLogs = () => {
    setLogs([]);
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-white mb-6">Strategy Tab Diagnosis</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Controls */}
        <div className="space-y-4">
          <div className="glass p-6 rounded-xl">
            <h2 className="text-xl font-semibold text-white mb-4">Diagnosis Controls</h2>
            
            <div className="space-y-3">
              <button
                onClick={runDiagnosis}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Run Strategy Diagnosis
              </button>
              
              <button
                onClick={clearLogs}
                className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Clear Logs
              </button>
            </div>
          </div>
          
          {/* Diagnosis Summary */}
          {Object.keys(diagnosis).length > 0 && (
            <div className="glass p-6 rounded-xl">
              <h2 className="text-xl font-semibold text-white mb-4">Diagnosis Summary</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-white/70">Authentication:</span>
                  <span className={diagnosis.authenticated ? 'text-green-400' : 'text-red-400'}>
                    {diagnosis.authenticated ? '✅ OK' : '❌ Failed'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/70">Strategies Table:</span>
                  <span className={diagnosis.strategiesTable ? 'text-green-400' : 'text-red-400'}>
                    {diagnosis.strategiesTable ? '✅ OK' : '❌ Error'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/70">Strategy Stats Table:</span>
                  <span className={diagnosis.strategyStatsTable ? 'text-green-400' : 'text-red-400'}>
                    {diagnosis.strategyStatsTable ? '✅ OK' : '❌ Missing'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/70">Strategy Rules Table:</span>
                  <span className={diagnosis.strategyRulesTable ? 'text-green-400' : 'text-red-400'}>
                    {diagnosis.strategyRulesTable ? '✅ OK' : '❌ Error'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/70">Strategies Found:</span>
                  <span className="text-white">
                    {diagnosis.strategiesCount}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/70">Trades Found:</span>
                  <span className="text-white">
                    {diagnosis.tradesCount}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Logs */}
        <div className="glass p-6 rounded-xl">
          <h2 className="text-xl font-semibold text-white mb-4">Diagnosis Logs</h2>
          <div className="bg-black/50 rounded-lg p-4 h-96 overflow-y-auto font-mono text-xs">
            {logs.length === 0 ? (
              <div className="text-gray-400">No logs yet. Run diagnosis to see output.</div>
            ) : (
              logs.map((log, index) => (
                <div key={index} className={`mb-1 ${log.includes('❌') ? 'text-red-400' : log.includes('✅') ? 'text-green-400' : log.includes('🔍') ? 'text-blue-400' : log.includes('⚠️') ? 'text-yellow-400' : 'text-gray-300'}`}>
                  {log}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}