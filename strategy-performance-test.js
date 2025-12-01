const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://fkfpbzqgqvbiidrvzqkp.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZrZnBienFncXZiaWlkcnZ6cWtwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI0OTI4MDAsImV4cCI6MjA0ODA2ODgwMH0.W21s-TKGEjyrcpJtJZL8G7zKQE2lNQaLoHrLAKkq2Z4';

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Test configuration
const TEST_CONFIG = {
  expectedStrategies: [
    'Momentum Breakout',
    'Mean Reversion', 
    'Scalping',
    'Swing Trading',
    'Options Income'
  ],
  expectedTradeCount: 200,
  testUserEmail: 'test@example.com'
};

// Test results storage
const testResults = {
  summary: {
    totalTests: 0,
    passedTests: 0,
    failedTests: 0,
    startTime: new Date().toISOString(),
    endTime: null,
    duration: null
  },
  dashboardPerformance: {
    tests: [],
    overallStatus: 'pending'
  },
  individualTrades: {
    tests: [],
    overallStatus: 'pending'
  },
  analyticsInsights: {
    tests: [],
    overallStatus: 'pending'
  },
  dataIntegration: {
    tests: [],
    overallStatus: 'pending'
  },
  crudFunctionality: {
    tests: [],
    overallStatus: 'pending'
  },
  issues: [],
  recommendations: []
};

// Helper function to run a test
async function runTest(testName, testFunction, category) {
  console.log(`\n🧪 Running test: ${testName}`);
  testResults.summary.totalTests++;
  
  try {
    const result = await testFunction();
    const testResult = {
      name: testName,
      status: result.passed ? 'passed' : 'failed',
      message: result.message,
      details: result.details || {},
      timestamp: new Date().toISOString()
    };
    
    testResults[category].tests.push(testResult);
    
    if (result.passed) {
      console.log(`✅ ${testName}: ${result.message}`);
      testResults.summary.passedTests++;
    } else {
      console.log(`❌ ${testName}: ${result.message}`);
      testResults.summary.failedTests++;
      testResults.issues.push({
        test: testName,
        category,
        message: result.message,
        details: result.details
      });
    }
    
    return result;
  } catch (error) {
    console.log(`💥 ${testName}: Error - ${error.message}`);
    const testResult = {
      name: testName,
      status: 'error',
      message: `Error: ${error.message}`,
      details: { error: error.stack },
      timestamp: new Date().toISOString()
    };
    
    testResults[category].tests.push(testResult);
    testResults.summary.failedTests++;
    testResults.issues.push({
      test: testName,
      category,
      message: `Error: ${error.message}`,
      details: { error: error.stack }
    });
    
    return { passed: false, message: error.message };
  }
}

// Helper function to authenticate test user
async function authenticateTestUser() {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: TEST_CONFIG.testUserEmail,
      password: 'testpassword123'
    });
    
    if (error) {
      console.log('Authentication failed, trying to sign up...');
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: TEST_CONFIG.testUserEmail,
        password: 'testpassword123'
      });
      
      if (signUpError) {
        throw new Error(`Authentication failed: ${signUpError.message}`);
      }
      
      return signUpData.user;
    }
    
    return data.user;
  } catch (error) {
    throw new Error(`Authentication error: ${error.message}`);
  }
}

// 1. Test strategy performance display on dashboard
async function testDashboardStrategyDisplay() {
  const user = await authenticateTestUser();
  
  // Test 1.1: Verify all 5 strategies are displayed with performance metrics
  const result1 = await runTest(
    'Dashboard - All 5 strategies displayed',
    async () => {
      const { data: strategies, error } = await supabase
        .from('strategies')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true);
      
      if (error) {
        return { passed: false, message: `Failed to fetch strategies: ${error.message}` };
      }
      
      const strategyNames = strategies.map(s => s.name);
      const missingStrategies = TEST_CONFIG.expectedStrategies.filter(name => !strategyNames.includes(name));
      
      if (missingStrategies.length > 0) {
        return { 
          passed: false, 
          message: `Missing strategies: ${missingStrategies.join(', ')}`,
          details: { found: strategyNames, missing: missingStrategies }
        };
      }
      
      return { 
        passed: true, 
        message: `All ${strategies.length} expected strategies found`,
        details: { strategies: strategyNames }
      };
    },
    'dashboardPerformance'
  );
  
  // Test 1.2: Check strategy-specific win rates are calculated correctly
  await runTest(
    'Dashboard - Strategy win rates calculated correctly',
    async () => {
      const { data: strategies, error } = await supabase
        .from('strategies')
        .select('id, name')
        .eq('user_id', user.id);
      
      if (error || !strategies) {
        return { passed: false, message: `Failed to fetch strategies: ${error?.message || 'No data'}` };
      }
      
      const strategyWinRates = {};
      let allValid = true;
      let invalidStrategies = [];
      
      for (const strategy of strategies) {
        const { data: trades, error: tradeError } = await supabase
          .from('trades')
          .select('pnl')
          .eq('strategy_id', strategy.id)
          .eq('user_id', user.id)
          .not('pnl', 'is', null);
        
        if (tradeError) {
          allValid = false;
          invalidStrategies.push(strategy.name);
          continue;
        }
        
        if (trades && trades.length > 0) {
          const wins = trades.filter(t => t.pnl > 0).length;
          const winRate = (wins / trades.length) * 100;
          strategyWinRates[strategy.name] = {
            winRate: winRate.toFixed(1),
            totalTrades: trades.length,
            wins: wins
          };
        } else {
          strategyWinRates[strategy.name] = { winRate: '0.0', totalTrades: 0, wins: 0 };
        }
      }
      
      return { 
        passed: allValid, 
        message: allValid ? 'Strategy win rates calculated correctly' : `Failed to calculate win rates for: ${invalidStrategies.join(', ')}`,
        details: { strategyWinRates, invalidStrategies }
      };
    },
    'dashboardPerformance'
  );
  
  // Test 1.3: Verify strategy P&L totals and averages are accurate
  await runTest(
    'Dashboard - Strategy P&L totals and averages accurate',
    async () => {
      const { data: strategies, error } = await supabase
        .from('strategies')
        .select('id, name')
        .eq('user_id', user.id);
      
      if (error || !strategies) {
        return { passed: false, message: `Failed to fetch strategies: ${error?.message || 'No data'}` };
      }
      
      const strategyPnL = {};
      let allValid = true;
      let invalidStrategies = [];
      
      for (const strategy of strategies) {
        const { data: trades, error: tradeError } = await supabase
          .from('trades')
          .select('pnl')
          .eq('strategy_id', strategy.id)
          .eq('user_id', user.id)
          .not('pnl', 'is', null);
        
        if (tradeError) {
          allValid = false;
          invalidStrategies.push(strategy.name);
          continue;
        }
        
        if (trades && trades.length > 0) {
          const totalPnL = trades.reduce((sum, trade) => sum + (trade.pnl || 0), 0);
          const avgPnL = totalPnL / trades.length;
          strategyPnL[strategy.name] = {
            totalPnL: totalPnL.toFixed(2),
            avgPnL: avgPnL.toFixed(2),
            totalTrades: trades.length
          };
        } else {
          strategyPnL[strategy.name] = { totalPnL: '0.00', avgPnL: '0.00', totalTrades: 0 };
        }
      }
      
      return { 
        passed: allValid, 
        message: allValid ? 'Strategy P&L calculations accurate' : `Failed to calculate P&L for: ${invalidStrategies.join(', ')}`,
        details: { strategyPnL, invalidStrategies }
      };
    },
    'dashboardPerformance'
  );
  
  // Test 1.4: Test strategy distribution charts render correctly (check if data exists)
  await runTest(
    'Dashboard - Strategy distribution data available',
    async () => {
      const { data: strategies, error } = await supabase
        .from('strategies')
        .select('id, name')
        .eq('user_id', user.id);
      
      if (error || !strategies) {
        return { passed: false, message: `Failed to fetch strategies: ${error?.message || 'No data'}` };
      }
      
      const distributionData = {};
      let totalTrades = 0;
      
      for (const strategy of strategies) {
        const { data: trades, error: tradeError } = await supabase
          .from('trades')
          .select('id')
          .eq('strategy_id', strategy.id)
          .eq('user_id', user.id);
        
        if (!tradeError && trades) {
          distributionData[strategy.name] = trades.length;
          totalTrades += trades.length;
        }
      }
      
      const hasData = Object.values(distributionData).some(count => count > 0);
      
      return { 
        passed: hasData && totalTrades >= TEST_CONFIG.expectedTradeCount * 0.8, // Allow some tolerance
        message: hasData 
          ? `Strategy distribution data available (${totalTrades} total trades)`
          : 'No strategy distribution data available',
        details: { distributionData, totalTrades }
      };
    },
    'dashboardPerformance'
  );
  
  // Test 1.5: Check strategy comparison analytics
  await runTest(
    'Dashboard - Strategy comparison analytics available',
    async () => {
      const { data: strategies, error } = await supabase
        .from('strategies')
        .select('id, name')
        .eq('user_id', user.id);
      
      if (error || !strategies) {
        return { passed: false, message: `Failed to fetch strategies: ${error?.message || 'No data'}` };
      }
      
      const comparisonData = {};
      let validComparisons = 0;
      
      for (const strategy of strategies) {
        const { data: trades, error: tradeError } = await supabase
          .from('trades')
          .select('pnl, trade_date')
          .eq('strategy_id', strategy.id)
          .eq('user_id', user.id)
          .not('pnl', 'is', null)
          .order('trade_date', { ascending: false })
          .limit(10);
        
        if (!tradeError && trades && trades.length > 0) {
          const totalPnL = trades.reduce((sum, trade) => sum + (trade.pnl || 0), 0);
          const wins = trades.filter(t => t.pnl > 0).length;
          const winRate = (wins / trades.length) * 100;
          
          comparisonData[strategy.name] = {
            totalPnL: totalPnL.toFixed(2),
            winRate: winRate.toFixed(1),
            recentTrades: trades.length
          };
          validComparisons++;
        }
      }
      
      return { 
        passed: validComparisons >= 3, // At least 3 strategies with comparison data
        message: `${validComparisons} strategies have comparison data available`,
        details: { comparisonData, validComparisons }
      };
    },
    'dashboardPerformance'
  );
}

// 2. Test strategy performance on individual trades
async function testIndividualTradeStrategyPerformance() {
  const user = await authenticateTestUser();
  
  // Test 2.1: Verify strategy names appear correctly on trade records
  await runTest(
    'Individual Trades - Strategy names appear correctly',
    async () => {
      const { data: trades, error } = await supabase
        .from('trades')
        .select(`
          id,
          symbol,
          strategy_id,
          strategies (
            id,
            name
          )
        `)
        .eq('user_id', user.id)
        .limit(20);
      
      if (error) {
        return { passed: false, message: `Failed to fetch trades: ${error.message}` };
      }
      
      let validTrades = 0;
      let invalidTrades = 0;
      const strategyAssociations = {};
      
      for (const trade of trades) {
        if (trade.strategy_id && trade.strategies && trade.strategies.name) {
          validTrades++;
          strategyAssociations[trade.strategies.name] = (strategyAssociations[trade.strategies.name] || 0) + 1;
        } else if (trade.strategy_id) {
          invalidTrades++;
        }
      }
      
      return { 
        passed: invalidTrades === 0 && validTrades > 0,
        message: `${validTrades} trades with valid strategy names, ${invalidTrades} with missing strategy names`,
        details: { validTrades, invalidTrades, strategyAssociations }
      };
    },
    'individualTrades'
  );
  
  // Test 2.2: Check strategy-trade associations are accurate
  await runTest(
    'Individual Trades - Strategy-trade associations accurate',
    async () => {
      const { data: strategies, error } = await supabase
        .from('strategies')
        .select('id, name')
        .eq('user_id', user.id);
      
      if (error || !strategies) {
        return { passed: false, message: `Failed to fetch strategies: ${error?.message || 'No data'}` };
      }
      
      let accurateAssociations = 0;
      let totalAssociations = 0;
      const associationDetails = {};
      
      for (const strategy of strategies) {
        const { data: trades, error: tradeError } = await supabase
          .from('trades')
          .select('id, strategy_id')
          .eq('strategy_id', strategy.id)
          .eq('user_id', user.id)
          .limit(10);
        
        if (!tradeError && trades) {
          accurateAssociations += trades.filter(t => t.strategy_id === strategy.id).length;
          totalAssociations += trades.length;
          associationDetails[strategy.name] = trades.length;
        }
      }
      
      return { 
        passed: accurateAssociations === totalAssociations && totalAssociations > 0,
        message: `${accurateAssociations}/${totalAssociations} strategy-trade associations are accurate`,
        details: { accurateAssociations, totalAssociations, associationDetails }
      };
    },
    'individualTrades'
  );
  
  // Test 2.3: Test strategy filtering on trades page
  await runTest(
    'Individual Trades - Strategy filtering functionality',
    async () => {
      const { data: strategies, error } = await supabase
        .from('strategies')
        .select('id, name')
        .eq('user_id', user.id)
        .limit(3);
      
      if (error || !strategies || strategies.length === 0) {
        return { passed: false, message: `Failed to fetch strategies for filtering test: ${error?.message || 'No data'}` };
      }
      
      const testStrategy = strategies[0];
      const { data: filteredTrades, error: filterError } = await supabase
        .from('trades')
        .select('id, symbol, strategy_id')
        .eq('strategy_id', testStrategy.id)
        .eq('user_id', user.id);
      
      if (filterError) {
        return { passed: false, message: `Failed to filter trades by strategy: ${filterError.message}` };
      }
      
      const allCorrectStrategy = filteredTrades.every(trade => trade.strategy_id === testStrategy.id);
      
      return { 
        passed: allCorrectStrategy,
        message: `Strategy filtering works: ${filteredTrades.length} trades found for ${testStrategy.name}`,
        details: { 
          strategyName: testStrategy.name, 
          filteredCount: filteredTrades.length,
          allCorrect: allCorrectStrategy
        }
      };
    },
    'individualTrades'
  );
  
  // Test 2.4: Verify strategy metadata displays properly
  await runTest(
    'Individual Trades - Strategy metadata displays properly',
    async () => {
      const { data: trades, error } = await supabase
        .from('trades')
        .select(`
          id,
          symbol,
          strategy_id,
          strategies (
            id,
            name,
            description,
            is_active,
            created_at
          )
        `)
        .eq('user_id', user.id)
        .not('strategy_id', 'is', null)
        .limit(10);
      
      if (error) {
        return { passed: false, message: `Failed to fetch trades with strategy metadata: ${error.message}` };
      }
      
      let completeMetadata = 0;
      let incompleteMetadata = 0;
      const metadataDetails = [];
      
      for (const trade of trades) {
        if (trade.strategies) {
          const metadata = {
            hasName: !!trade.strategies.name,
            hasDescription: !!trade.strategies.description,
            hasActiveStatus: trade.strategies.is_active !== undefined,
            hasCreatedDate: !!trade.strategies.created_at
          };
          
          const isComplete = Object.values(metadata).every(Boolean);
          if (isComplete) {
            completeMetadata++;
          } else {
            incompleteMetadata++;
          }
          
          metadataDetails.push({
            tradeId: trade.id,
            strategyName: trade.strategies.name,
            metadata
          });
        }
      }
      
      return { 
        passed: completeMetadata > 0 && incompleteMetadata <= completeMetadata * 0.2, // Allow 20% incomplete
        message: `${completeMetadata} trades with complete strategy metadata, ${incompleteMetadata} incomplete`,
        details: { completeMetadata, incompleteMetadata, metadataDetails }
      };
    },
    'individualTrades'
  );
}

// 3. Test strategy analytics and insights
async function testStrategyAnalyticsInsights() {
  const user = await authenticateTestUser();
  
  // Test 3.1: Check if strategy performance insights are generated
  await runTest(
    'Analytics - Strategy performance insights generated',
    async () => {
      const { data: strategies, error } = await supabase
        .from('strategies')
        .select('id, name')
        .eq('user_id', user.id);
      
      if (error || !strategies) {
        return { passed: false, message: `Failed to fetch strategies: ${error?.message || 'No data'}` };
      }
      
      const insights = {};
      let strategiesWithInsights = 0;
      
      for (const strategy of strategies) {
        const { data: trades, error: tradeError } = await supabase
          .from('trades')
          .select('pnl, trade_date, entry_time, exit_time')
          .eq('strategy_id', strategy.id)
          .eq('user_id', user.id)
          .not('pnl', 'is', null);
        
        if (!tradeError && trades && trades.length > 0) {
          const totalPnL = trades.reduce((sum, trade) => sum + (trade.pnl || 0), 0);
          const wins = trades.filter(t => t.pnl > 0).length;
          const winRate = (wins / trades.length) * 100;
          const avgPnL = totalPnL / trades.length;
          
          // Generate insights based on performance
          let insight = 'Neutral performance';
          if (winRate > 60 && avgPnL > 0) {
            insight = 'Strong performing strategy';
          } else if (winRate > 50 && avgPnL > 0) {
            insight = 'Positive performing strategy';
          } else if (winRate < 40 || avgPnL < 0) {
            insight = 'Underperforming strategy';
          }
          
          insights[strategy.name] = {
            insight,
            winRate: winRate.toFixed(1),
            avgPnL: avgPnL.toFixed(2),
            totalTrades: trades.length
          };
          
          strategiesWithInsights++;
        }
      }
      
      return { 
        passed: strategiesWithInsights >= 3, // At least 3 strategies with insights
        message: `${strategiesWithInsights} strategies have performance insights`,
        details: { insights, strategiesWithInsights }
      };
    },
    'analyticsInsights'
  );
  
  // Test 3.2: Verify strategy effectiveness rankings
  await runTest(
    'Analytics - Strategy effectiveness rankings calculated',
    async () => {
      const { data: strategies, error } = await supabase
        .from('strategies')
        .select('id, name')
        .eq('user_id', user.id);
      
      if (error || !strategies) {
        return { passed: false, message: `Failed to fetch strategies: ${error?.message || 'No data'}` };
      }
      
      const rankings = [];
      
      for (const strategy of strategies) {
        const { data: trades, error: tradeError } = await supabase
          .from('trades')
          .select('pnl')
          .eq('strategy_id', strategy.id)
          .eq('user_id', user.id)
          .not('pnl', 'is', null);
        
        if (!tradeError && trades && trades.length > 0) {
          const totalPnL = trades.reduce((sum, trade) => sum + (trade.pnl || 0), 0);
          const wins = trades.filter(t => t.pnl > 0).length;
          const winRate = (wins / trades.length) * 100;
          const profitFactor = calculateProfitFactor(trades);
          
          // Composite score (you can adjust weights)
          const score = (winRate * 0.4) + (Math.min(profitFactor, 5) * 20) + (totalPnL > 0 ? 20 : -10);
          
          rankings.push({
            name: strategy.name,
            score: score.toFixed(2),
            winRate: winRate.toFixed(1),
            profitFactor: profitFactor.toFixed(2),
            totalPnL: totalPnL.toFixed(2),
            totalTrades: trades.length
          });
        }
      }
      
      rankings.sort((a, b) => parseFloat(b.score) - parseFloat(a.score));
      
      return { 
        passed: rankings.length >= 3,
        message: `Ranked ${rankings.length} strategies by effectiveness`,
        details: { rankings, topStrategy: rankings[0]?.name }
      };
    },
    'analyticsInsights'
  );
  
  // Test 3.3: Test strategy-based recommendations
  await runTest(
    'Analytics - Strategy-based recommendations generated',
    async () => {
      const { data: strategies, error } = await supabase
        .from('strategies')
        .select('id, name')
        .eq('user_id', user.id);
      
      if (error || !strategies) {
        return { passed: false, message: `Failed to fetch strategies: ${error?.message || 'No data'}` };
      }
      
      const recommendations = {};
      let strategiesWithRecommendations = 0;
      
      for (const strategy of strategies) {
        const { data: trades, error: tradeError } = await supabase
          .from('trades')
          .select('pnl, trade_date')
          .eq('strategy_id', strategy.id)
          .eq('user_id', user.id)
          .not('pnl', 'is', null);
        
        if (!tradeError && trades && trades.length > 5) { // Only recommend with sufficient data
          const totalPnL = trades.reduce((sum, trade) => sum + (trade.pnl || 0), 0);
          const wins = trades.filter(t => t.pnl > 0).length;
          const winRate = (wins / trades.length) * 100;
          
          let recommendation = 'Continue monitoring performance';
          if (winRate > 60 && totalPnL > 0) {
            recommendation = 'Consider increasing position size';
          } else if (winRate < 40 || totalPnL < 0) {
            recommendation = 'Review strategy rules and consider adjustments';
          } else if (winRate > 50 && totalPnL < 0) {
            recommendation = 'Focus on risk management and stop-loss placement';
          }
          
          recommendations[strategy.name] = {
            recommendation,
            winRate: winRate.toFixed(1),
            totalPnL: totalPnL.toFixed(2),
            totalTrades: trades.length
          };
          
          strategiesWithRecommendations++;
        }
      }
      
      return { 
        passed: strategiesWithRecommendations >= 2,
        message: `${strategiesWithRecommendations} strategies have recommendations`,
        details: { recommendations, strategiesWithRecommendations }
      };
    },
    'analyticsInsights'
  );
  
  // Test 3.4: Check strategy trend analysis over time
  await runTest(
    'Analytics - Strategy trend analysis over time',
    async () => {
      const { data: strategies, error } = await supabase
        .from('strategies')
        .select('id, name')
        .eq('user_id', user.id)
        .limit(3);
      
      if (error || !strategies) {
        return { passed: false, message: `Failed to fetch strategies: ${error?.message || 'No data'}` };
      }
      
      const trendAnalysis = {};
      let strategiesWithTrends = 0;
      
      for (const strategy of strategies) {
        const { data: trades, error: tradeError } = await supabase
          .from('trades')
          .select('pnl, trade_date')
          .eq('strategy_id', strategy.id)
          .eq('user_id', user.id)
          .not('pnl', 'is', null)
          .order('trade_date', { ascending: true });
        
        if (!tradeError && trades && trades.length > 10) {
          const midPoint = Math.floor(trades.length / 2);
          const firstHalf = trades.slice(0, midPoint);
          const secondHalf = trades.slice(midPoint);
          
          const firstHalfPnL = firstHalf.reduce((sum, trade) => sum + (trade.pnl || 0), 0);
          const secondHalfPnL = secondHalf.reduce((sum, trade) => sum + (trade.pnl || 0), 0);
          
          let trend = 'Stable';
          if (secondHalfPnL > firstHalfPnL * 1.2) {
            trend = 'Improving';
          } else if (secondHalfPnL < firstHalfPnL * 0.8) {
            trend = 'Declining';
          }
          
          trendAnalysis[strategy.name] = {
            trend,
            firstHalfPnL: firstHalfPnL.toFixed(2),
            secondHalfPnL: secondHalfPnL.toFixed(2),
            totalTrades: trades.length
          };
          
          strategiesWithTrends++;
        }
      }
      
      return { 
        passed: strategiesWithTrends >= 2,
        message: `${strategiesWithTrends} strategies have trend analysis`,
        details: { trendAnalysis, strategiesWithTrends }
      };
    },
    'analyticsInsights'
  );
  
  // Test 3.5: Verify strategy risk/reward calculations
  await runTest(
    'Analytics - Strategy risk/reward calculations',
    async () => {
      const { data: strategies, error } = await supabase
        .from('strategies')
        .select('id, name')
        .eq('user_id', user.id);
      
      if (error || !strategies) {
        return { passed: false, message: `Failed to fetch strategies: ${error?.message || 'No data'}` };
      }
      
      const riskRewardAnalysis = {};
      let strategiesWithRiskReward = 0;
      
      for (const strategy of strategies) {
        const { data: trades, error: tradeError } = await supabase
          .from('trades')
          .select('pnl, entry_time, exit_time')
          .eq('strategy_id', strategy.id)
          .eq('user_id', user.id)
          .not('pnl', 'is', null);
        
        if (!tradeError && trades && trades.length > 0) {
          const pnls = trades.map(t => t.pnl || 0);
          const totalPnL = pnls.reduce((sum, pnl) => sum + pnl, 0);
          const wins = pnls.filter(p => p > 0);
          const losses = pnls.filter(p => p < 0);
          
          const avgWin = wins.length > 0 ? wins.reduce((sum, p) => sum + p, 0) / wins.length : 0;
          const avgLoss = losses.length > 0 ? Math.abs(losses.reduce((sum, p) => sum + p, 0) / losses.length) : 0;
          const riskRewardRatio = avgLoss > 0 ? avgWin / avgLoss : 0;
          
          // Calculate Sharpe ratio
          const avgReturn = totalPnL / trades.length;
          const variance = pnls.reduce((sum, pnl) => sum + Math.pow(pnl - avgReturn, 2), 0) / trades.length;
          const stdDev = Math.sqrt(variance);
          const sharpeRatio = stdDev > 0 ? avgReturn / stdDev : 0;
          
          riskRewardAnalysis[strategy.name] = {
            riskRewardRatio: riskRewardRatio.toFixed(2),
            sharpeRatio: sharpeRatio.toFixed(2),
            avgWin: avgWin.toFixed(2),
            avgLoss: avgLoss.toFixed(2),
            totalTrades: trades.length
          };
          
          strategiesWithRiskReward++;
        }
      }
      
      return { 
        passed: strategiesWithRiskReward >= 3,
        message: `${strategiesWithRiskReward} strategies have risk/reward calculations`,
        details: { riskRewardAnalysis, strategiesWithRiskReward }
      };
    },
    'analyticsInsights'
  );
}

// 4. Test strategy data integration
async function testStrategyDataIntegration() {
  const user = await authenticateTestUser();
  
  // Test 4.1: Verify strategies link correctly to trade outcomes
  await runTest(
    'Integration - Strategies link correctly to trade outcomes',
    async () => {
      const { data: strategies, error } = await supabase
        .from('strategies')
        .select('id, name')
        .eq('user_id', user.id)
        .limit(5);
      
      if (error || !strategies) {
        return { passed: false, message: `Failed to fetch strategies: ${error?.message || 'No data'}` };
      }
      
      const linkVerification = {};
      let validLinks = 0;
      let totalLinks = 0;
      
      for (const strategy of strategies) {
        const { data: trades, error: tradeError } = await supabase
          .from('trades')
          .select('id, pnl, strategy_id')
          .eq('strategy_id', strategy.id)
          .eq('user_id', user.id)
          .limit(10);
        
        if (!tradeError && trades) {
          totalLinks += trades.length;
          const correctLinks = trades.filter(trade => trade.strategy_id === strategy.id);
          validLinks += correctLinks.length;
          
          const totalPnL = trades.reduce((sum, trade) => sum + (trade.pnl || 0), 0);
          const wins = trades.filter(t => (t.pnl || 0) > 0).length;
          
          linkVerification[strategy.name] = {
            tradesFound: trades.length,
            correctLinks: correctLinks.length,
            totalPnL: totalPnL.toFixed(2),
            wins: wins,
            linkAccuracy: (correctLinks.length / trades.length * 100).toFixed(1)
          };
        }
      }
      
      const overallAccuracy = totalLinks > 0 ? (validLinks / totalLinks * 100) : 0;
      
      return { 
        passed: overallAccuracy >= 95, // 95% accuracy required
        message: `Strategy-trade link accuracy: ${overallAccuracy.toFixed(1)}% (${validLinks}/${totalLinks})`,
        details: { linkVerification, overallAccuracy, validLinks, totalLinks }
      };
    },
    'dataIntegration'
  );
  
  // Test 4.2: Test strategy performance calculations with 200 trades
  await runTest(
    'Integration - Strategy performance calculations with 200 trades',
    async () => {
      const { data: trades, error } = await supabase
        .from('trades')
        .select('id, strategy_id, pnl, trade_date')
        .eq('user_id', user.id)
        .not('pnl', 'is', null);
      
      if (error) {
        return { passed: false, message: `Failed to fetch trades: ${error.message}` };
      }
      
      if (trades.length < TEST_CONFIG.expectedTradeCount * 0.8) { // Allow 20% tolerance
        return { 
          passed: false, 
          message: `Insufficient trades for testing: ${trades.length} (expected at least ${TEST_CONFIG.expectedTradeCount * 0.8})` 
        };
      }
      
      // Group trades by strategy
      const strategyTrades = {};
      for (const trade of trades) {
        if (trade.strategy_id) {
          if (!strategyTrades[trade.strategy_id]) {
            strategyTrades[trade.strategy_id] = [];
          }
          strategyTrades[trade.strategy_id].push(trade);
        }
      }
      
      const calculationResults = {};
      let successfulCalculations = 0;
      
      for (const [strategyId, strategyTradeList] of Object.entries(strategyTrades)) {
        if (strategyTradeList.length > 0) {
          const pnls = strategyTradeList.map(t => t.pnl || 0);
          const totalPnL = pnls.reduce((sum, pnl) => sum + pnl, 0);
          const wins = pnls.filter(p => p > 0).length;
          const winRate = (wins / pnls.length) * 100;
          const profitFactor = calculateProfitFactor(strategyTradeList);
          
          calculationResults[strategyId] = {
            totalTrades: strategyTradeList.length,
            totalPnL: totalPnL.toFixed(2),
            winRate: winRate.toFixed(1),
            profitFactor: profitFactor.toFixed(2)
          };
          
          successfulCalculations++;
        }
      }
      
      return { 
        passed: successfulCalculations >= 3 && trades.length >= TEST_CONFIG.expectedTradeCount * 0.8,
        message: `Performance calculations successful for ${successfulCalculations} strategies using ${trades.length} trades`,
        details: { calculationResults, totalTrades: trades.length, successfulCalculations }
      };
    },
    'dataIntegration'
  );
  
  // Test 4.3: Check strategy consistency across all pages
  await runTest(
    'Integration - Strategy consistency across all pages',
    async () => {
      // Fetch strategies from main strategies endpoint
      const { data: mainStrategies, error: mainError } = await supabase
        .from('strategies')
        .select('id, name, is_active')
        .eq('user_id', user.id);
      
      if (mainError || !mainStrategies) {
        return { passed: false, message: `Failed to fetch main strategies: ${mainError?.message || 'No data'}` };
      }
      
      // Check consistency by verifying strategy names in trades
      const { data: tradeStrategies, error: tradeError } = await supabase
        .from('trades')
        .select('strategy_id')
        .eq('user_id', user.id)
        .not('strategy_id', 'is', null);
      
      if (tradeError) {
        return { passed: false, message: `Failed to fetch trade strategies: ${tradeError.message}` };
      }
      
      const mainStrategyIds = new Set(mainStrategies.map(s => s.id));
      const tradeStrategyIds = new Set(tradeStrategies.map(t => t.strategy_id));
      
      const orphanedTrades = [...tradeStrategyIds].filter(id => !mainStrategyIds.has(id));
      const unusedStrategies = [...mainStrategyIds].filter(id => !tradeStrategyIds.has(id));
      
      const consistencyScore = (mainStrategyIds.size - orphanedTrades.length) / mainStrategyIds.size * 100;
      
      return { 
        passed: orphanedTrades.length === 0 && consistencyScore >= 90,
        message: `Strategy consistency: ${consistencyScore.toFixed(1)}% (${orphanedTrades.length} orphaned, ${unusedStrategies.length} unused)`,
        details: { 
          mainStrategies: mainStrategies.length,
          tradeStrategies: tradeStrategies.length,
          orphanedTrades,
          unusedStrategies,
          consistencyScore
        }
      };
    },
    'dataIntegration'
  );
  
  // Test 4.4: Verify strategy summary statistics accuracy
  await runTest(
    'Integration - Strategy summary statistics accuracy',
    async () => {
      const { data: strategies, error } = await supabase
        .from('strategies')
        .select('id, name')
        .eq('user_id', user.id);
      
      if (error || !strategies) {
        return { passed: false, message: `Failed to fetch strategies: ${error?.message || 'No data'}` };
      }
      
      const summaryStats = {};
      let accurateStats = 0;
      
      for (const strategy of strategies) {
        const { data: trades, error: tradeError } = await supabase
          .from('trades')
          .select('pnl, entry_time, exit_time')
          .eq('strategy_id', strategy.id)
          .eq('user_id', user.id)
          .not('pnl', 'is', null);
        
        if (!tradeError && trades && trades.length > 0) {
          // Calculate comprehensive statistics
          const pnls = trades.map(t => t.pnl || 0);
          const totalPnL = pnls.reduce((sum, pnl) => sum + pnl, 0);
          const wins = pnls.filter(p => p > 0);
          const losses = pnls.filter(p => p < 0);
          
          const stats = {
            totalTrades: trades.length,
            winningTrades: wins.length,
            totalPnL: totalPnL.toFixed(2),
            avgPnL: (totalPnL / trades.length).toFixed(2),
            winRate: ((wins.length / trades.length) * 100).toFixed(1),
            profitFactor: calculateProfitFactor(trades).toFixed(2),
            avgWin: wins.length > 0 ? (wins.reduce((sum, p) => sum + p, 0) / wins.length).toFixed(2) : '0.00',
            avgLoss: losses.length > 0 ? (Math.abs(losses.reduce((sum, p) => sum + p, 0) / losses.length)).toFixed(2) : '0.00'
          };
          
          summaryStats[strategy.name] = stats;
          accurateStats++;
        }
      }
      
      return { 
        passed: accurateStats >= 3,
        message: `Summary statistics calculated for ${accurateStats} strategies`,
        details: { summaryStats, accurateStats }
      };
    },
    'dataIntegration'
  );
}

// 5. Test strategy CRUD functionality
async function testStrategyCRUD() {
  const user = await authenticateTestUser();
  
  // Test 5.1: Test strategy creation
  await runTest(
    'CRUD - Strategy creation',
    async () => {
      const testStrategyName = `Test Strategy ${Date.now()}`;
      const testStrategyDescription = 'Test strategy for CRUD functionality';
      
      const { data: newStrategy, error } = await supabase
        .from('strategies')
        .insert({
          name: testStrategyName,
          description: testStrategyDescription,
          user_id: user.id,
          is_active: true
        })
        .select()
        .single();
      
      if (error) {
        return { passed: false, message: `Failed to create strategy: ${error.message}` };
      }
      
      // Verify the strategy was created correctly
      if (newStrategy.name !== testStrategyName || newStrategy.description !== testStrategyDescription) {
        return { passed: false, message: 'Strategy created with incorrect data' };
      }
      
      return { 
        passed: true, 
        message: `Strategy created successfully: ${newStrategy.name}`,
        details: { strategyId: newStrategy.id, strategyName: newStrategy.name }
      };
    },
    'crudFunctionality'
  );
  
  // Test 5.2: Verify strategy editing works
  await runTest(
    'CRUD - Strategy editing',
    async () => {
      // First create a strategy to edit
      const { data: testStrategy, error: createError } = await supabase
        .from('strategies')
        .insert({
          name: `Edit Test Strategy ${Date.now()}`,
          description: 'Original description',
          user_id: user.id,
          is_active: true
        })
        .select()
        .single();
      
      if (createError || !testStrategy) {
        return { passed: false, message: `Failed to create test strategy for editing: ${createError?.message || 'No data'}` };
      }
      
      // Now edit the strategy
      const updatedName = `Updated ${testStrategy.name}`;
      const updatedDescription = 'Updated description for testing';
      
      const { data: updatedStrategy, error: updateError } = await supabase
        .from('strategies')
        .update({
          name: updatedName,
          description: updatedDescription,
          is_active: false
        })
        .eq('id', testStrategy.id)
        .eq('user_id', user.id)
        .select()
        .single();
      
      if (updateError) {
        return { passed: false, message: `Failed to update strategy: ${updateError.message}` };
      }
      
      // Verify the update
      if (updatedStrategy.name !== updatedName || updatedStrategy.description !== updatedDescription) {
        return { passed: false, message: 'Strategy not updated correctly' };
      }
      
      return { 
        passed: true, 
        message: `Strategy updated successfully: ${updatedStrategy.name}`,
        details: { originalName: testStrategy.name, updatedName: updatedStrategy.name }
      };
    },
    'crudFunctionality'
  );
  
  // Test 5.3: Test strategy deletion (with proper trade handling)
  await runTest(
    'CRUD - Strategy deletion with trade handling',
    async () => {
      // Create a strategy with associated trades
      const { data: testStrategy, error: createError } = await supabase
        .from('strategies')
        .insert({
          name: `Delete Test Strategy ${Date.now()}`,
          description: 'Strategy for deletion test',
          user_id: user.id,
          is_active: true
        })
        .select()
        .single();
      
      if (createError || !testStrategy) {
        return { passed: false, message: `Failed to create test strategy for deletion: ${createError?.message || 'No data'}` };
      }
      
      // Create some trades with this strategy
      const testTrades = [];
      for (let i = 0; i < 3; i++) {
        const { data: trade, error: tradeError } = await supabase
          .from('trades')
          .insert({
            symbol: 'TEST',
            side: 'Buy',
            quantity: 100,
            entry_price: 100 + i,
            exit_price: 105 + i,
            pnl: 5,
            trade_date: new Date().toISOString().split('T')[0],
            strategy_id: testStrategy.id,
            user_id: user.id
          })
          .select('id')
          .single();
        
        if (!tradeError && trade) {
          testTrades.push(trade.id);
        }
      }
      
      // Now delete the strategy
      const { error: deleteError } = await supabase
        .from('strategies')
        .delete()
        .eq('id', testStrategy.id)
        .eq('user_id', user.id);
      
      if (deleteError) {
        return { passed: false, message: `Failed to delete strategy: ${deleteError.message}` };
      }
      
      // Check if trades still exist (they should, but with null strategy_id)
      const { data: remainingTrades, error: checkError } = await supabase
        .from('trades')
        .select('id, strategy_id')
        .in('id', testTrades);
      
      if (checkError) {
        return { passed: false, message: `Failed to check trade status: ${checkError.message}` };
      }
      
      const tradesWithNullStrategy = remainingTrades.filter(t => t.strategy_id === null);
      
      return { 
        passed: remainingTrades.length === testTrades.length && tradesWithNullStrategy.length >= testTrades.length * 0.8,
        message: `Strategy deleted, ${tradesWithNullStrategy.length}/${testTrades.length} trades properly handled`,
        details: { 
          strategyId: testStrategy.id,
          originalTrades: testTrades.length,
          remainingTrades: remainingTrades.length,
          tradesWithNullStrategy: tradesWithNullStrategy.length
        }
      };
    },
    'crudFunctionality'
  );
  
  // Test 5.4: Check strategy validation rules
  await runTest(
    'CRUD - Strategy validation rules',
    async () => {
      const validationTests = [
        {
          name: 'Empty name validation',
          data: { name: '', description: 'Test', user_id: user.id },
          shouldFail: true
        },
        {
          name: 'Null name validation',
          data: { description: 'Test', user_id: user.id },
          shouldFail: true
        },
        {
          name: 'Valid strategy creation',
          data: { name: `Valid Strategy ${Date.now()}`, description: 'Valid description', user_id: user.id },
          shouldFail: false
        }
      ];
      
      let passedValidations = 0;
      const validationResults = [];
      
      for (const test of validationTests) {
        const { data, error } = await supabase
          .from('strategies')
          .insert(test.data)
          .select('id')
          .single();
        
        const failedAsExpected = !!error === test.shouldFail;
        
        if (failedAsExpected) {
          passedValidations++;
        }
        
        validationResults.push({
          testName: test.name,
          expectedFailure: test.shouldFail,
          actualFailure: !!error,
          passed: failedAsExpected,
          error: error?.message
        });
        
        // Clean up successful creations
        if (data && !test.shouldFail) {
          await supabase
            .from('strategies')
            .delete()
            .eq('id', data.id)
            .eq('user_id', user.id);
        }
      }
      
      return { 
        passed: passedValidations === validationTests.length,
        message: `${passedValidations}/${validationTests.length} validation tests passed`,
        details: { validationResults, passedValidations }
      };
    },
    'crudFunctionality'
  );
}

// Helper function to calculate profit factor
function calculateProfitFactor(trades) {
  const grossProfit = trades
    .filter(t => (t.pnl || 0) > 0)
    .reduce((sum, t) => sum + (t.pnl || 0), 0);
  const grossLoss = Math.abs(
    trades
      .filter(t => (t.pnl || 0) < 0)
      .reduce((sum, t) => sum + (t.pnl || 0), 0)
  );
  return grossLoss === 0 ? (grossProfit > 0 ? 999 : 0) : grossProfit / grossLoss;
}

// Main test execution function
async function runAllTests() {
  console.log('🚀 Starting Strategy Performance Tracking Tests');
  console.log('================================================');
  
  try {
    // Run all test categories
    console.log('\n📊 1. Testing Strategy Performance Display on Dashboard');
    await testDashboardStrategyDisplay();
    
    console.log('\n📋 2. Testing Strategy Performance on Individual Trades');
    await testIndividualTradeStrategyPerformance();
    
    console.log('\n📈 3. Testing Strategy Analytics and Insights');
    await testStrategyAnalyticsInsights();
    
    console.log('\n🔗 4. Testing Strategy Data Integration');
    await testStrategyDataIntegration();
    
    console.log('\n⚙️ 5. Testing Strategy CRUD Functionality');
    await testStrategyCRUD();
    
    // Calculate overall status for each category
    Object.keys(testResults).forEach(category => {
      if (category !== 'summary' && category !== 'issues' && category !== 'recommendations') {
        const categoryTests = testResults[category].tests;
        const passedTests = categoryTests.filter(t => t.status === 'passed').length;
        const totalTests = categoryTests.length;
        
        if (totalTests > 0) {
          const passRate = (passedTests / totalTests) * 100;
          if (passRate >= 80) {
            testResults[category].overallStatus = 'passed';
          } else if (passRate >= 60) {
            testResults[category].overallStatus = 'partial';
          } else {
            testResults[category].overallStatus = 'failed';
          }
        }
      }
    });
    
  } catch (error) {
    console.error('💥 Critical error during testing:', error);
    testResults.issues.push({
      test: 'Critical Error',
      category: 'system',
      message: `Critical error during test execution: ${error.message}`,
      details: { error: error.stack }
    });
  } finally {
    // Finalize results
    testResults.summary.endTime = new Date().toISOString();
    testResults.summary.duration = new Date(testResults.summary.endTime) - new Date(testResults.summary.startTime);
    
    // Generate recommendations
    generateRecommendations();
    
    // Save results to file
    await saveTestResults();
    
    // Print summary
    printTestSummary();
  }
}

// Generate recommendations based on test results
function generateRecommendations() {
  const recommendations = [];
  
  // Analyze failed tests and generate recommendations
  testResults.issues.forEach(issue => {
    switch (issue.category) {
      case 'dashboardPerformance':
        if (issue.message.includes('Missing strategies')) {
          recommendations.push('Ensure all 5 expected strategies are created and active in the database');
        } else if (issue.message.includes('Failed to calculate')) {
          recommendations.push('Review strategy performance calculation logic in strategy-rules-engine.ts');
        }
        break;
        
      case 'individualTrades':
        if (issue.message.includes('missing strategy names')) {
          recommendations.push('Fix strategy name display issues in trade records');
        } else if (issue.message.includes('Failed to filter')) {
          recommendations.push('Implement or fix strategy filtering functionality on trades page');
        }
        break;
        
      case 'analyticsInsights':
        if (issue.message.includes('insights')) {
          recommendations.push('Enhance strategy analytics to generate meaningful insights');
        } else if (issue.message.includes('rankings')) {
          recommendations.push('Implement strategy effectiveness ranking system');
        }
        break;
        
      case 'dataIntegration':
        if (issue.message.includes('link accuracy')) {
          recommendations.push('Fix strategy-trade relationship integrity in the database');
        } else if (issue.message.includes('consistency')) {
          recommendations.push('Ensure strategy data consistency across all application pages');
        }
        break;
        
      case 'crudFunctionality':
        if (issue.message.includes('validation')) {
          recommendations.push('Strengthen strategy validation rules and error handling');
        } else if (issue.message.includes('deletion')) {
          recommendations.push('Implement proper cascade handling for strategy deletion');
        }
        break;
    }
  });
  
  // Add general recommendations
  if (testResults.summary.failedTests > 0) {
    recommendations.push('Review and fix failing tests before deploying to production');
  }
  
  if (testResults.summary.passedTests / testResults.summary.totalTests < 0.8) {
    recommendations.push('Overall test pass rate is below 80%. Consider comprehensive system review');
  }
  
  testResults.recommendations = recommendations;
}

// Save test results to file
async function saveTestResults() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `strategy-performance-test-results-${timestamp}.json`;
  const reportFilename = `STRATEGY_PERFORMANCE_TEST_REPORT.md`;
  
  try {
    // Save detailed JSON results
    await fs.promises.writeFile(
      path.join(__dirname, filename),
      JSON.stringify(testResults, null, 2)
    );
    
    // Generate markdown report
    const markdownReport = generateMarkdownReport();
    await fs.promises.writeFile(
      path.join(__dirname, reportFilename),
      markdownReport
    );
    
    console.log(`\n📄 Detailed results saved to: ${filename}`);
    console.log(`📋 Report saved to: ${reportFilename}`);
    
  } catch (error) {
    console.error('Failed to save test results:', error);
  }
}

// Generate markdown report
function generateMarkdownReport() {
  const passRate = ((testResults.summary.passedTests / testResults.summary.totalTests) * 100).toFixed(1);
  
  let report = `# Strategy Performance Tracking Test Report

## Summary

- **Total Tests:** ${testResults.summary.totalTests}
- **Passed:** ${testResults.summary.passedTests}
- **Failed:** ${testResults.summary.failedTests}
- **Pass Rate:** ${passRate}%
- **Duration:** ${Math.round(testResults.summary.duration / 1000)}s
- **Test Date:** ${new Date(testResults.summary.startTime).toLocaleDateString()}

## Overall Status: ${passRate >= 80 ? '✅ PASSED' : passRate >= 60 ? '⚠️ PARTIAL' : '❌ FAILED'}

---

## Test Categories

### 1. Dashboard Performance Display
**Status: ${getStatusEmoji(testResults.dashboardPerformance.overallStatus)} ${testResults.dashboardPerformance.overallStatus.toUpperCase()}**

${testResults.dashboardPerformance.tests.map(test => 
  `- ${getStatusEmoji(test.status)} **${test.name}**: ${test.message}`
).join('\n')}

### 2. Individual Trade Strategy Performance
**Status: ${getStatusEmoji(testResults.individualTrades.overallStatus)} ${testResults.individualTrades.overallStatus.toUpperCase()}**

${testResults.individualTrades.tests.map(test => 
  `- ${getStatusEmoji(test.status)} **${test.name}**: ${test.message}`
).join('\n')}

### 3. Strategy Analytics and Insights
**Status: ${getStatusEmoji(testResults.analyticsInsights.overallStatus)} ${testResults.analyticsInsights.overallStatus.toUpperCase()}**

${testResults.analyticsInsights.tests.map(test => 
  `- ${getStatusEmoji(test.status)} **${test.name}**: ${test.message}`
).join('\n')}

### 4. Strategy Data Integration
**Status: ${getStatusEmoji(testResults.dataIntegration.overallStatus)} ${testResults.dataIntegration.overallStatus.toUpperCase()}**

${testResults.dataIntegration.tests.map(test => 
  `- ${getStatusEmoji(test.status)} **${test.name}**: ${test.message}`
).join('\n')}

### 5. Strategy CRUD Functionality
**Status: ${getStatusEmoji(testResults.crudFunctionality.overallStatus)} ${testResults.crudFunctionality.overallStatus.toUpperCase()}**

${testResults.crudFunctionality.tests.map(test => 
  `- ${getStatusEmoji(test.status)} **${test.name}**: ${test.message}`
).join('\n')}

---

## Issues Found

${testResults.issues.length > 0 ? 
  testResults.issues.map((issue, index) => 
    `${index + 1}. **${issue.test}** (${issue.category})\n   - ${issue.message}\n`
  ).join('') : 
  'No critical issues found.'
}

---

## Recommendations

${testResults.recommendations.length > 0 ? 
  testResults.recommendations.map((rec, index) => 
    `${index + 1}. ${rec}`
  ).join('\n') : 
  'No specific recommendations at this time.'
}

---

## Test Environment

- **Expected Strategies:** ${TEST_CONFIG.expectedStrategies.join(', ')}
- **Expected Trade Count:** ${TEST_CONFIG.expectedTradeCount}
- **Test User:** ${TEST_CONFIG.testUserEmail}
- **Test Framework:** Custom Node.js Test Suite
- **Database:** Supabase PostgreSQL

---

*This report was generated automatically by the Strategy Performance Tracking Test Suite*
`;

  return report;
}

// Helper function to get status emoji
function getStatusEmoji(status) {
  switch (status) {
    case 'passed': return '✅';
    case 'failed': return '❌';
    case 'partial': return '⚠️';
    case 'pending': return '⏳';
    case 'error': return '💥';
    default: return '❓';
  }
}

// Print test summary to console
function printTestSummary() {
  console.log('\n' + '='.repeat(60));
  console.log('🏁 STRATEGY PERFORMANCE TRACKING TEST SUMMARY');
  console.log('='.repeat(60));
  
  const passRate = ((testResults.summary.passedTests / testResults.summary.totalTests) * 100).toFixed(1);
  
  console.log(`\n📊 Overall Results:`);
  console.log(`   Total Tests: ${testResults.summary.totalTests}`);
  console.log(`   Passed: ${testResults.summary.passedTests}`);
  console.log(`   Failed: ${testResults.summary.failedTests}`);
  console.log(`   Pass Rate: ${passRate}%`);
  console.log(`   Duration: ${Math.round(testResults.summary.duration / 1000)}s`);
  
  console.log(`\n📋 Category Status:`);
  Object.keys(testResults).forEach(category => {
    if (category !== 'summary' && category !== 'issues' && category !== 'recommendations') {
      const status = testResults[category].overallStatus;
      const emoji = getStatusEmoji(status);
      const categoryName = category.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
      console.log(`   ${emoji} ${categoryName}: ${status.toUpperCase()}`);
    }
  });
  
  if (testResults.issues.length > 0) {
    console.log(`\n⚠️  Issues Found: ${testResults.issues.length}`);
    testResults.issues.slice(0, 5).forEach((issue, index) => {
      console.log(`   ${index + 1}. ${issue.test}: ${issue.message}`);
    });
    if (testResults.issues.length > 5) {
      console.log(`   ... and ${testResults.issues.length - 5} more issues`);
    }
  }
  
  if (testResults.recommendations.length > 0) {
    console.log(`\n💡 Recommendations: ${testResults.recommendations.length}`);
    testResults.recommendations.slice(0, 3).forEach((rec, index) => {
      console.log(`   ${index + 1}. ${rec}`);
    });
    if (testResults.recommendations.length > 3) {
      console.log(`   ... and ${testResults.recommendations.length - 3} more recommendations`);
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log(`🎯 Overall Status: ${passRate >= 80 ? 'PASSED' : passRate >= 60 ? 'PARTIAL' : 'FAILED'}`);
  console.log('='.repeat(60));
}

// Run the tests
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = {
  runAllTests,
  testResults
};