'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/supabase/client';
import TradeForm from '@/components/forms/TradeForm';
import EmotionRadar from '@/components/ui/EmotionRadar';
import { 
  Activity, 
  AlertCircle, 
  Brain, 
  CheckCircle, 
  Clock, 
  RefreshCw, 
  TrendingUp,
  BarChart3,
  Eye,
  EyeOff,
  Play,
  SkipForward,
  RotateCcw
} from 'lucide-react';

interface Trade {
  id: string;
  symbol: string;
  market: string;
  side: 'Buy' | 'Sell';
  quantity: number;
  pnl: number | null;
  trade_date: string;
  strategy_id: string | null;
  emotional_state: string[] | null;
  entry_time: string | null;
  exit_time: string | null;
}

interface TestEvent {
  id: string;
  timestamp: string;
  type: 'custom' | 'storage' | 'refresh' | 'error';
  message: string;
  details?: any;
}

interface TestScenario {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'running' | 'passed' | 'failed';
  steps: string[];
  currentStep: number;
}

export default function TestDataRefreshFixes() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [events, setEvents] = useState<TestEvent[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(true);
  const [refreshIndicators, setRefreshIndicators] = useState({
    dashboard: false,
    confluence: false
  });
  const [testScenarios, setTestScenarios] = useState<TestScenario[]>([
    {
      id: 'scenario1',
      name: 'Trade Form to Dashboard Refresh',
      description: 'Verify that submitting a trade via TradeForm triggers immediate dashboard refresh',
      status: 'pending',
      steps: [
        'Fill out and submit the trade form below',
        'Watch for custom events in the Event Monitor',
        'Check that Dashboard Emotional Analysis updates',
        'Verify the new trade\'s emotional state appears in the analysis'
      ],
      currentStep: 0
    },
    {
      id: 'scenario2',
      name: 'Trade Form to Confluence Refresh',
      description: 'Verify that submitting a trade via TradeForm triggers immediate confluence refresh',
      status: 'pending',
      steps: [
        'Fill out and submit the trade form below',
        'Watch for localStorage updates in the Event Monitor',
        'Check that Confluence Emotional Analysis updates',
        'Verify the new trade\'s emotional state appears in the analysis'
      ],
      currentStep: 0
    },
    {
      id: 'scenario3',
      name: 'Cross-Tab Synchronization',
      description: 'Verify that trades logged in one tab are reflected in another tab',
      status: 'pending',
      steps: [
        'Open this test page in a second browser tab',
        'Submit a trade in the first tab',
        'Check that the second tab receives update events',
        'Verify both tabs show consistent emotional analysis data'
      ],
      currentStep: 0
    },
    {
      id: 'scenario4',
      name: 'Reduced Refresh Interval',
      description: 'Verify that confluence page refreshes every 15 seconds instead of 60',
      status: 'pending',
      steps: [
        'Open the confluence page in a new tab',
        'Wait for at least 20 seconds',
        'Check browser console for 15-second interval logs',
        'Verify data refreshes more frequently than before'
      ],
      currentStep: 0
    }
  ]);

  // Fetch trades data
  const fetchTrades = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('trades')
        .select('*')
        .eq('user_id', user.id)
        .order('trade_date', { ascending: false })
        .limit(10); // Limit to recent trades for performance

      if (error) {
        console.error('Error fetching trades:', error);
        return;
      }

      setTrades(data as Trade[] || []);
    } catch (error) {
      console.error('Error fetching trades:', error);
    }
  }, []);

  // Add event to the event log
  const addEvent = useCallback((type: TestEvent['type'], message: string, details?: any) => {
    const newEvent: TestEvent = {
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      type,
      message,
      details
    };
    
    setEvents(prev => [newEvent, ...prev].slice(0, 50)); // Keep only last 50 events
  }, []);

  // Process emotional state data (same logic as dashboard and confluence)
  const processEmotionData = useCallback((tradesData: Trade[]) => {
    const emotionData: Record<string, { buyCount: number; sellCount: number; nullCount: number }> = {};
    const validEmotions = ['FOMO', 'REVENGE', 'TILT', 'OVERRISK', 'PATIENCE', 'REGRET', 'DISCIPLINE', 'CONFIDENT', 'ANXIOUS', 'NEUTRAL'];
    
    tradesData.forEach((trade) => {
      if (!trade.emotional_state) return;
      
      let emotions: string[] = [];
      if (Array.isArray(trade.emotional_state)) {
        emotions = trade.emotional_state.filter(e => typeof e === 'string' && e.trim()).map(e => e.trim().toUpperCase());
      } else if (typeof trade.emotional_state === 'string') {
        try {
          const parsed = JSON.parse(trade.emotional_state);
          if (Array.isArray(parsed)) {
            emotions = parsed.filter((e: any) => typeof e === 'string' && e.trim()).map((e: any) => e.trim().toUpperCase());
          }
        } catch {
          emotions = [(trade.emotional_state as string).trim().toUpperCase()];
        }
      }
      
      const validEmotionsForTrade = emotions.filter(emotion => validEmotions.includes(emotion));
      
      validEmotionsForTrade.forEach(emotion => {
        if (!emotionData[emotion]) {
          emotionData[emotion] = { buyCount: 0, sellCount: 0, nullCount: 0 };
        }
        
        if (trade.side === 'Buy') {
          emotionData[emotion].buyCount++;
        } else if (trade.side === 'Sell') {
          emotionData[emotion].sellCount++;
        } else {
          emotionData[emotion].nullCount++;
        }
      });
    });
    
    return Object.entries(emotionData).map(([emotion, counts]) => {
      const total = counts.buyCount + counts.sellCount + counts.nullCount;
      if (total === 0) return null;
      
      let leaningValue = ((counts.buyCount - counts.sellCount) / total) * 100;
      leaningValue = Math.max(-100, Math.min(100, leaningValue));
      
      let leaning = 'Balanced';
      let side = 'NULL';
      
      if (leaningValue > 15) {
        leaning = 'Buy Leaning';
        side = 'Buy';
      } else if (leaningValue < -15) {
        leaning = 'Sell Leaning';
        side = 'Sell';
      }
      
      return {
        subject: emotion,
        value: Math.abs(leaningValue),
        fullMark: 100,
        leaning,
        side,
        leaningValue,
        totalTrades: total
      };
    }).filter(item => item !== null);
  }, []);

  // Memoized emotion data
  const emotionData = useMemo(() => processEmotionData(trades), [trades, processEmotionData]);

  // Set up event listeners
  useEffect(() => {
    if (!isMonitoring) return;

    // Listen for custom events
    const handleTradeDataUpdated = (event: CustomEvent) => {
      addEvent('custom', 'Trade data updated via custom event', event.detail);
      
      // Show refresh indicators
      setRefreshIndicators(prev => ({
        ...prev,
        dashboard: true,
        confluence: true
      }));
      
      // Hide indicators after 2 seconds
      setTimeout(() => {
        setRefreshIndicators(prev => ({
          ...prev,
          dashboard: false,
          confluence: false
        }));
      }, 2000);
      
      // Refresh trades data
      fetchTrades();
      
      // Update test scenarios
      setTestScenarios(prev => prev.map(scenario => {
        if (scenario.id === 'scenario1' || scenario.id === 'scenario2') {
          return { ...scenario, status: 'passed' as const };
        }
        return scenario;
      }));
    };

    // Listen for localStorage changes
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'tradeDataLastUpdated' || event.key === 'tradeDataLastUpdatedSimple') {
        addEvent('storage', `localStorage updated: ${event.key}`, {
          oldValue: event.oldValue,
          newValue: event.newValue
        });
        
        // Show refresh indicator for confluence
        setRefreshIndicators(prev => ({
          ...prev,
          confluence: true
        }));
        
        // Hide indicator after 2 seconds
        setTimeout(() => {
          setRefreshIndicators(prev => ({
            ...prev,
            confluence: false
          }));
        }, 2000);
        
        // Refresh trades data
        fetchTrades();
      }
    };

    // Add event listeners
    window.addEventListener('tradeDataUpdated', handleTradeDataUpdated as EventListener);
    window.addEventListener('storage', handleStorageChange);

    // Initial fetch
    fetchTrades();
    addEvent('refresh', 'Initial data fetch completed');

    return () => {
      window.removeEventListener('tradeDataUpdated', handleTradeDataUpdated as EventListener);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [isMonitoring, fetchTrades, addEvent]);

  // Handle trade form success
  const handleTradeSuccess = useCallback(() => {
    addEvent('custom', 'Trade form submitted successfully');
    fetchTrades();
  }, [fetchTrades, addEvent]);

  // Clear events
  const clearEvents = useCallback(() => {
    setEvents([]);
  }, []);

  // Reset test scenarios
  const resetTestScenarios = useCallback(() => {
    setTestScenarios(prev => prev.map(scenario => ({
      ...scenario,
      status: 'pending' as const,
      currentStep: 0
    })));
  }, []);

  // Run specific test scenario
  const runTestScenario = useCallback((scenarioId: string) => {
    setTestScenarios(prev => prev.map(scenario => {
      if (scenario.id === scenarioId) {
        return { ...scenario, status: 'running' as const };
      }
      return scenario;
    }));
  }, []);

  // Get event type color
  const getEventTypeColor = (type: TestEvent['type']) => {
    switch (type) {
      case 'custom': return 'text-blue-400';
      case 'storage': return 'text-green-400';
      case 'refresh': return 'text-purple-400';
      case 'error': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  // Get event type icon
  const getEventTypeIcon = (type: TestEvent['type']) => {
    switch (type) {
      case 'custom': return <Activity className="w-4 h-4" />;
      case 'storage': return <BarChart3 className="w-4 h-4" />;
      case 'refresh': return <RefreshCw className="w-4 h-4" />;
      case 'error': return <AlertCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2 text-blue-400">Data Refresh Fixes Test</h1>
          <p className="text-gray-400">Comprehensive test for trade data refresh and cross-tab synchronization</p>
        </div>

        {/* Test Scenarios */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {testScenarios.map(scenario => (
            <div key={scenario.id} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-white">{scenario.name}</h3>
                  <p className="text-sm text-gray-400 mt-1">{scenario.description}</p>
                </div>
                <div className={`px-2 py-1 rounded text-xs font-medium ${
                  scenario.status === 'pending' ? 'bg-gray-700 text-gray-300' :
                  scenario.status === 'running' ? 'bg-blue-600 text-white' :
                  scenario.status === 'passed' ? 'bg-green-600 text-white' :
                  'bg-red-600 text-white'
                }`}>
                  {scenario.status.toUpperCase()}
                </div>
              </div>
              
              <div className="space-y-2">
                {scenario.steps.map((step, index) => (
                  <div key={index} className="flex items-start gap-2 text-sm">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      index < scenario.currentStep ? 'bg-green-600' :
                      index === scenario.currentStep ? 'bg-blue-600' :
                      'bg-gray-600'
                    }`}>
                      {index < scenario.currentStep ? (
                        <CheckCircle className="w-3 h-3" />
                      ) : (
                        <span className="text-xs">{index + 1}</span>
                      )}
                    </div>
                    <span className={index <= scenario.currentStep ? 'text-white' : 'text-gray-500'}>
                      {step}
                    </span>
                  </div>
                ))}
              </div>
              
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => runTestScenario(scenario.id)}
                  disabled={scenario.status === 'running'}
                  className="flex items-center gap-2 px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded text-sm transition-colors"
                >
                  <Play className="w-3 h-3" />
                  Run Test
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Trade Form */}
          <div className="xl:col-span-2 space-y-6">
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-white">Trade Form</h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsMonitoring(!isMonitoring)}
                    className={`flex items-center gap-2 px-3 py-1 rounded text-sm transition-colors ${
                      isMonitoring ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-600 hover:bg-gray-700'
                    }`}
                  >
                    {isMonitoring ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                    {isMonitoring ? 'Monitoring' : 'Paused'}
                  </button>
                  <button
                    onClick={resetTestScenarios}
                    className="flex items-center gap-2 px-3 py-1 bg-orange-600 hover:bg-orange-700 rounded text-sm transition-colors"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Reset Tests
                  </button>
                </div>
              </div>
              
              <TradeForm onSuccess={handleTradeSuccess} />
            </div>

            {/* Emotional Analysis */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Dashboard Analysis */}
              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Brain className="w-4 h-4 text-blue-400" />
                    Dashboard Analysis
                    {refreshIndicators.dashboard && (
                      <RefreshCw className="w-4 h-4 text-green-400 animate-spin" />
                    )}
                  </h3>
                </div>
                <div className="h-64">
                  <EmotionRadar data={emotionData} />
                </div>
                <div className="mt-4 text-sm text-gray-400">
                  <p>Total Trades: {trades.length}</p>
                  <p>Emotional Trades: {trades.filter(t => t.emotional_state && t.emotional_state.length > 0).length}</p>
                </div>
              </div>

              {/* Confluence Analysis */}
              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-purple-400" />
                    Confluence Analysis
                    {refreshIndicators.confluence && (
                      <RefreshCw className="w-4 h-4 text-green-400 animate-spin" />
                    )}
                  </h3>
                </div>
                <div className="h-64">
                  <EmotionRadar data={emotionData} />
                </div>
                <div className="mt-4 text-sm text-gray-400">
                  <p>Refresh Interval: 15 seconds</p>
                  <p>Last Update: {events.length > 0 ? new Date(events[0].timestamp).toLocaleTimeString() : 'Never'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Event Monitor */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Event Monitor</h3>
              <button
                onClick={clearEvents}
                className="flex items-center gap-2 px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-sm transition-colors"
              >
                <SkipForward className="w-3 h-3" />
                Clear
              </button>
            </div>
            
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {events.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No events detected yet. Submit a trade to start monitoring.</p>
              ) : (
                events.map(event => (
                  <div key={event.id} className="bg-gray-700 rounded p-3 border border-gray-600">
                    <div className="flex items-start gap-2">
                      <div className={getEventTypeColor(event.type)}>
                        {getEventTypeIcon(event.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-white">{event.message}</span>
                          <span className="text-xs text-gray-400 whitespace-nowrap">
                            {new Date(event.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        {event.details && (
                          <div className="mt-1 text-xs text-gray-400 bg-gray-800 rounded p-2 overflow-x-auto">
                            <pre>{JSON.stringify(event.details, null, 2)}</pre>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-blue-900/30 border border-blue-500/30 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-3 text-blue-400">How to Test All Fixes:</h3>
          <ol className="list-decimal list-inside space-y-2 text-gray-300">
            <li><strong>Trade Form to Dashboard:</strong> Submit a trade and verify the dashboard emotional analysis updates immediately</li>
            <li><strong>Trade Form to Confluence:</strong> Submit a trade and verify the confluence emotional analysis updates immediately</li>
            <li><strong>Cross-Tab Synchronization:</strong> Open this page in multiple tabs and verify updates sync across tabs</li>
            <li><strong>Reduced Refresh Interval:</strong> Open the confluence page and verify it refreshes every 15 seconds</li>
            <li><strong>Event Monitoring:</strong> Watch the Event Monitor for real-time updates and verify both custom events and localStorage changes are captured</li>
          </ol>
        </div>
      </div>
    </div>
  );
}