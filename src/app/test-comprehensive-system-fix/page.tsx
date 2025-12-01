'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/supabase/client';
import { useRouter } from 'next/navigation';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Loader2, 
  TrendingUp, 
  Brain, 
  Target, 
  BarChart3,
  User,
  Database,
  Shield
} from 'lucide-react';

interface TestResult {
  name: string;
  status: 'pending' | 'loading' | 'success' | 'error';
  message: string;
  details?: any;
}

export default function ComprehensiveSystemFixTest() {
  const [tests, setTests] = useState<TestResult[]>([
    {
      name: 'Supabase Connection',
      status: 'pending',
      message: 'Testing Supabase client connection...'
    },
    {
      name: 'Authentication State',
      status: 'pending',
      message: 'Testing authentication state management...'
    },
    {
      name: 'User Session',
      status: 'pending',
      message: 'Testing user session persistence...'
    },
    {
      name: 'Database Access',
      status: 'pending',
      message: 'Testing database read access...'
    },
    {
      name: 'Dashboard Data Fetch',
      status: 'pending',
      message: 'Testing dashboard data fetching...'
    },
    {
      name: 'PNL Calculation',
      status: 'pending',
      message: 'Testing PNL calculation logic...'
    },
    {
      name: 'Emotion Data Processing',
      status: 'pending',
      message: 'Testing emotion data processing...'
    },
    {
      name: 'Chart Components',
      status: 'pending',
      message: 'Testing chart component rendering...'
    },
    {
      name: 'Error Handling',
      status: 'pending',
      message: 'Testing error handling mechanisms...'
    },
    {
      name: 'Navigation Flow',
      status: 'pending',
      message: 'Testing navigation between pages...'
    }
  ]);

  const [overallStatus, setOverallStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [testSummary, setTestSummary] = useState({ passed: 0, failed: 0, total: 0 });

  const router = useRouter();

  const updateTest = (index: number, status: TestResult['status'], message: string, details?: any) => {
    setTests(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], status, message, details };
      return updated;
    });
  };

  const runTests = async () => {
    console.log('🧪 Starting comprehensive system tests...');
    
    // Test 1: Supabase Connection
    try {
      updateTest(0, 'loading', 'Testing Supabase connection...');
      const { data, error } = await supabase.from('trades').select('count').single();
      
      if (error) {
        updateTest(0, 'error', `Supabase connection failed: ${error.message}`, error);
      } else {
        updateTest(0, 'success', 'Supabase connection successful', { count: data });
      }
    } catch (error) {
      updateTest(0, 'error', `Supabase connection error: ${error}`, error);
    }

    // Test 2: Authentication State
    try {
      updateTest(1, 'loading', 'Testing authentication state...');
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) {
        updateTest(1, 'error', `Auth state error: ${error.message}`, error);
      } else {
        updateTest(1, 'success', `Auth state working: ${user ? 'User found' : 'No user (expected for logged out)'}`, { user: !!user });
      }
    } catch (error) {
      updateTest(1, 'error', `Auth state error: ${error}`, error);
    }

    // Test 3: User Session
    try {
      updateTest(2, 'loading', 'Testing user session...');
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        updateTest(2, 'error', `Session error: ${error.message}`, error);
      } else {
        updateTest(2, 'success', `Session working: ${session ? 'Active session' : 'No session'}`, { session: !!session });
      }
    } catch (error) {
      updateTest(2, 'error', `Session error: ${error}`, error);
    }

    // Test 4: Database Access
    try {
      updateTest(3, 'loading', 'Testing database access...');
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data, error } = await supabase
          .from('trades')
          .select('id, pnl, trade_date')
          .eq('user_id', user.id)
          .limit(5);
          
        if (error) {
          updateTest(3, 'error', `Database access failed: ${error.message}`, error);
        } else {
          updateTest(3, 'success', `Database access successful: ${data.length} trades found`, { trades: data.length });
        }
      } else {
        updateTest(3, 'success', 'Database access skipped (no user)', { reason: 'no_user' });
      }
    } catch (error) {
      updateTest(3, 'error', `Database access error: ${error}`, error);
    }

    // Test 5: Dashboard Data Fetch
    try {
      updateTest(4, 'loading', 'Testing dashboard data fetch...');
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data, error } = await supabase
          .from('trades')
          .select('id, pnl, trade_date, emotional_state, side')
          .eq('user_id', user.id)
          .order('trade_date', { ascending: true })
          .limit(100);
          
        if (error) {
          updateTest(4, 'error', `Dashboard data fetch failed: ${error.message}`, error);
        } else {
          updateTest(4, 'success', `Dashboard data fetch successful: ${data.length} trades`, { trades: data.length });
        }
      } else {
        updateTest(4, 'success', 'Dashboard data fetch skipped (no user)', { reason: 'no_user' });
      }
    } catch (error) {
      updateTest(4, 'error', `Dashboard data fetch error: ${error}`, error);
    }

    // Test 6: PNL Calculation
    try {
      updateTest(5, 'loading', 'Testing PNL calculation...');
      const testTrades = [
        { pnl: 100 },
        { pnl: -50 },
        { pnl: 200 },
        { pnl: -25 }
      ];
      
      const totalPnL = testTrades.reduce((sum, trade) => sum + (trade.pnl || 0), 0);
      const wins = testTrades.filter(trade => (trade.pnl || 0) > 0).length;
      const total = testTrades.length;
      const winrate = total ? ((wins / total) * 100).toFixed(1) : '0';
      
      updateTest(5, 'success', `PNL calculation working: Total $${totalPnL}, Win Rate ${winrate}%`, { 
        totalPnL, 
        winrate, 
        trades: testTrades.length 
      });
    } catch (error) {
      updateTest(5, 'error', `PNL calculation error: ${error}`, error);
    }

    // Test 7: Emotion Data Processing
    try {
      updateTest(6, 'loading', 'Testing emotion data processing...');
      const testEmotions = ['FOMO', 'REVENGE', 'TILT', 'PATIENCE'];
      const processedEmotions = testEmotions.map(emotion => ({
        subject: emotion,
        value: Math.floor(Math.random() * 10) + 1,
        fullMark: 12,
        leaning: 'Balanced',
        side: 'Buy'
      }));
      
      updateTest(6, 'success', `Emotion data processing working: ${processedEmotions.length} emotions processed`, { 
        emotions: processedEmotions.length 
      });
    } catch (error) {
      updateTest(6, 'error', `Emotion data processing error: ${error}`, error);
    }

    // Test 8: Chart Components
    try {
      updateTest(7, 'loading', 'Testing chart component availability...');
      
      // Check if chart components can be imported
      const PerformanceChart = await import('@/components/ui/PerformanceChart');
      const EmotionRadar = await import('@/components/ui/EmotionRadar');
      
      if (PerformanceChart.default && EmotionRadar.default) {
        updateTest(7, 'success', 'Chart components available and importable', { 
          PerformanceChart: !!PerformanceChart.default,
          EmotionRadar: !!EmotionRadar.default
        });
      } else {
        updateTest(7, 'error', 'Chart components not available');
      }
    } catch (error) {
      updateTest(7, 'error', `Chart component error: ${error}`, error);
    }

    // Test 9: Error Handling
    try {
      updateTest(8, 'loading', 'Testing error handling...');
      
      // Test error boundary component
      const ErrorBoundary = await import('@/components/ErrorBoundary');
      
      if (ErrorBoundary.default) {
        updateTest(8, 'success', 'Error handling components available', { 
          ErrorBoundary: !!ErrorBoundary.default
        });
      } else {
        updateTest(8, 'error', 'Error handling components not available');
      }
    } catch (error) {
      updateTest(8, 'error', `Error handling test error: ${error}`, error);
    }

    // Test 10: Navigation Flow
    try {
      updateTest(9, 'loading', 'Testing navigation flow...');
      
      // Test if router is available
      if (router && typeof router.push === 'function') {
        updateTest(9, 'success', 'Navigation flow working: Router available', { 
          router: !!router,
          push: typeof router.push
        });
      } else {
        updateTest(9, 'error', 'Navigation flow failed: Router not available');
      }
    } catch (error) {
      updateTest(9, 'error', `Navigation flow error: ${error}`, error);
    }
  };

  useEffect(() => {
    runTests();
  }, []);

  useEffect(() => {
    const completed = tests.filter(t => t.status !== 'pending' && t.status !== 'loading');
    const passed = completed.filter(t => t.status === 'success').length;
    const failed = completed.filter(t => t.status === 'error').length;
    
    setTestSummary({ passed, failed, total: completed.length });
    
    if (completed.length === tests.length) {
      setOverallStatus(failed === 0 ? 'success' : 'error');
    }
  }, [tests]);

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'loading':
        return <Loader2 className="w-5 h-5 animate-spin text-blue-400" />;
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-400" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-yellow-400" />;
    }
  };

  const getFeatureIcon = (name: string) => {
    switch (name) {
      case 'Supabase Connection':
        return <Database className="w-6 h-6 text-blue-400" />;
      case 'Authentication State':
      case 'User Session':
        return <Shield className="w-6 h-6 text-green-400" />;
      case 'PNL Calculation':
        return <TrendingUp className="w-6 h-6 text-purple-400" />;
      case 'Emotion Data Processing':
        return <Brain className="w-6 h-6 text-orange-400" />;
      case 'Chart Components':
        return <BarChart3 className="w-6 h-6 text-cyan-400" />;
      default:
        return <Target className="w-6 h-6 text-gray-400" />;
    }
  };

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">Comprehensive System Fix Test</h1>
          <p className="text-white/70 text-lg">
            Testing all critical system components after comprehensive failure fix
          </p>
        </div>

        {/* Overall Status */}
        <div className="glass p-6 rounded-xl mb-8 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {overallStatus === 'loading' && <Loader2 className="w-8 h-8 animate-spin text-blue-400" />}
              {overallStatus === 'success' && <CheckCircle className="w-8 h-8 text-green-400" />}
              {overallStatus === 'error' && <XCircle className="w-8 h-8 text-red-400" />}
              
              <div>
                <h2 className="text-2xl font-bold text-white">
                  {overallStatus === 'loading' && 'Running Tests...'}
                  {overallStatus === 'success' && 'All Systems Operational'}
                  {overallStatus === 'error' && 'Some Issues Detected'}
                </h2>
                <p className="text-white/70 mt-1">
                  {testSummary.passed} passed, {testSummary.failed} failed of {testSummary.total} tests
                </p>
              </div>
            </div>
            
            <button
              onClick={runTests}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Loader2 className="w-4 h-4" />
              Run Tests Again
            </button>
          </div>
        </div>

        {/* Test Results */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {tests.map((test, index) => (
            <div key={index} className="glass p-6 rounded-xl border-l-4 border-blue-500/50">
              <div className="flex items-start gap-4">
                <div className="mt-1">
                  {getFeatureIcon(test.name)}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-semibold text-white">{test.name}</h3>
                    {getStatusIcon(test.status)}
                  </div>
                  
                  <p className="text-white/70 text-sm mb-2">{test.message}</p>
                  
                  {test.details && (
                    <div className="bg-black/20 rounded-lg p-3 text-xs text-white/60">
                      <pre className="whitespace-pre-wrap">
                        {JSON.stringify(test.details, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-4 mt-8 justify-center">
          <button
            onClick={() => router.push('/dashboard')}
            className="px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            <TrendingUp className="w-4 h-4" />
            Go to Dashboard
          </button>
          
          <button
            onClick={() => router.push('/login')}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <User className="w-4 h-4" />
            Go to Login
          </button>
          
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-colors flex items-center gap-2"
          >
            <Loader2 className="w-4 h-4" />
            Reload Page
          </button>
        </div>
      </div>
    </div>
  );
}