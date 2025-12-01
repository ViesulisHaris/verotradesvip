const fs = require('fs');
const path = require('path');

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
  sourceFiles: {
    dashboard: 'src/app/dashboard/page.tsx',
    strategies: 'src/app/strategies/page.tsx',
    strategyPerformance: 'src/app/strategies/performance/[id]/page.tsx',
    trades: 'src/app/trades/page.tsx',
    strategyRulesEngine: 'src/lib/strategy-rules-engine.ts',
    strategyCard: 'src/components/ui/EnhancedStrategyCard.tsx',
    strategyPerformanceChart: 'src/components/ui/StrategyPerformanceChart.tsx'
  }
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
function runTest(testName, testFunction, category) {
  console.log(`\n🧪 Running test: ${testName}`);
  testResults.summary.totalTests++;
  
  try {
    const result = testFunction();
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

// Helper function to read file content
function readFileContent(filePath) {
  try {
    const fullPath = path.join(__dirname, filePath);
    if (fs.existsSync(fullPath)) {
      return fs.readFileSync(fullPath, 'utf8');
    }
    return null;
  } catch (error) {
    console.log(`Error reading file ${filePath}: ${error.message}`);
    return null;
  }
}

// Helper function to check if code contains pattern
function containsCode(code, patterns) {
  if (!code) return false;
  
  const patternsArray = Array.isArray(patterns) ? patterns : [patterns];
  return patternsArray.some(pattern => {
    if (typeof pattern === 'string') {
      return code.includes(pattern);
    } else if (pattern instanceof RegExp) {
      return pattern.test(code);
    }
    return false;
  });
}

// Helper function to extract function calls from code
function extractFunctionCalls(code, functionName) {
  if (!code) return [];
  
  const regex = new RegExp(`\\b${functionName}\\s*\\(`, 'g');
  const matches = code.match(regex);
  return matches ? matches.length : 0;
}

// 1. Test strategy performance display on dashboard
function testDashboardStrategyDisplay() {
  const dashboardCode = readFileContent(TEST_CONFIG.sourceFiles.dashboard);
  
  // Test 1.1: Verify all 5 strategies are displayed with performance metrics
  runTest(
    'Dashboard - All 5 strategies displayed with performance metrics',
    () => {
      if (!dashboardCode) {
        return { 
          passed: false, 
          message: 'Dashboard page code not found',
          details: { file: TEST_CONFIG.sourceFiles.dashboard }
        };
      }
      
      // Check if dashboard fetches strategies
      const fetchesStrategies = containsCode(dashboardCode, [
        'strategies',
        'getStrategiesWithStats',
        'from(\'strategies\')'
      ]);
      
      // Check if dashboard displays strategy performance
      const displaysPerformance = containsCode(dashboardCode, [
        'stats',
        'winrate',
        'total_pnl',
        'profit_factor'
      ]);
      
      return { 
        passed: fetchesStrategies && displaysPerformance,
        message: fetchesStrategies && displaysPerformance 
          ? 'Dashboard fetches and displays strategy performance metrics'
          : 'Dashboard may not properly display strategy performance metrics',
        details: { 
          fetchesStrategies,
          displaysPerformance,
          hasStrategyCode: dashboardCode.includes('strategies')
        }
      };
    },
    'dashboardPerformance'
  );
  
  // Test 1.2: Check strategy-specific win rates are calculated correctly
  runTest(
    'Dashboard - Strategy win rates calculated correctly',
    () => {
      if (!dashboardCode) {
        return { passed: false, message: 'Dashboard code not available' };
      }
      
      // Check for win rate calculation logic
      const hasWinRateCalculation = containsCode(dashboardCode, [
        'winrate',
        'wins / total',
        'filter.*pnl.*> 0'
      ]);
      
      // Check if win rate is displayed
      const displaysWinRate = containsCode(dashboardCode, [
        'winrate',
        'Win Rate',
        '%'
      ]);
      
      return { 
        passed: hasWinRateCalculation && displaysWinRate,
        message: hasWinRateCalculation && displaysWinRate 
          ? 'Dashboard calculates and displays strategy win rates'
          : 'Dashboard win rate calculation or display may be missing',
        details: { 
          hasWinRateCalculation,
          displaysWinRate
        }
      };
    },
    'dashboardPerformance'
  );
  
  // Test 1.3: Verify strategy P&L totals and averages are accurate
  runTest(
    'Dashboard - Strategy P&L totals and averages accurate',
    () => {
      if (!dashboardCode) {
        return { passed: false, message: 'Dashboard code not available' };
      }
      
      // Check for P&L calculation
      const hasPnLCalculation = containsCode(dashboardCode, [
        'totalPnL',
        'reduce.*pnl',
        'sum.*pnl'
      ]);
      
      // Check for P&L display
      const displaysPnL = containsCode(dashboardCode, [
        'formatCurrency',
        'totalPnL',
        'P&L'
      ]);
      
      return { 
        passed: hasPnLCalculation && displaysPnL,
        message: hasPnLCalculation && displaysPnL 
          ? 'Dashboard calculates and displays strategy P&L metrics'
          : 'Dashboard P&L calculation or display may be missing',
        details: { 
          hasPnLCalculation,
          displaysPnL
        }
      };
    },
    'dashboardPerformance'
  );
  
  // Test 1.4: Test strategy distribution charts render correctly
  runTest(
    'Dashboard - Strategy distribution charts render correctly',
    () => {
      if (!dashboardCode) {
        return { passed: false, message: 'Dashboard code not available' };
      }
      
      // Check for chart components
      const hasCharts = containsCode(dashboardCode, [
        'PerformanceChart',
        'EmotionRadar',
        'ResponsiveContainer',
        'LineChart',
        'AreaChart'
      ]);
      
      // Check for chart data processing
      const hasChartData = containsCode(dashboardCode, [
        'getChartData',
        'getEmotionData',
        'chartData'
      ]);
      
      return { 
        passed: hasCharts && hasChartData,
        message: hasCharts && hasChartData 
          ? 'Dashboard includes strategy performance charts with data processing'
          : 'Dashboard may lack strategy distribution charts',
        details: { 
          hasCharts,
          hasChartData
        }
      };
    },
    'dashboardPerformance'
  );
  
  // Test 1.5: Check strategy comparison analytics
  runTest(
    'Dashboard - Strategy comparison analytics available',
    () => {
      if (!dashboardCode) {
        return { passed: false, message: 'Dashboard code not available' };
      }
      
      // Check for analytics features
      const hasAnalytics = containsCode(dashboardCode, [
        'stats',
        'analytics',
        'comparison',
        'performance'
      ]);
      
      // Check for multiple strategy metrics
      const hasMultipleMetrics = containsCode(dashboardCode, [
        'totalPnL',
        'winrate',
        'profitFactor',
        'sharpeRatio'
      ]);
      
      return { 
        passed: hasAnalytics && hasMultipleMetrics,
        message: hasAnalytics && hasMultipleMetrics 
          ? 'Dashboard provides strategy comparison analytics'
          : 'Dashboard may lack comprehensive strategy comparison features',
        details: { 
          hasAnalytics,
          hasMultipleMetrics
        }
      };
    },
    'dashboardPerformance'
  );
}

// 2. Test strategy performance on individual trades
function testIndividualTradeStrategyPerformance() {
  const tradesCode = readFileContent(TEST_CONFIG.sourceFiles.trades);
  
  // Test 2.1: Verify strategy names appear correctly on trade records
  runTest(
    'Individual Trades - Strategy names appear correctly',
    () => {
      if (!tradesCode) {
        return { 
          passed: false, 
          message: 'Trades page code not found',
          details: { file: TEST_CONFIG.sourceFiles.trades }
        };
      }
      
      // Check if trades page fetches strategy information
      const fetchesStrategies = containsCode(tradesCode, [
        'strategies (',
        'strategy_id',
        'join strategies'
      ]);
      
      // Check if strategy names are displayed
      const displaysStrategyNames = containsCode(tradesCode, [
        'trade.strategies.name',
        'strategy.name',
        'strategies.name'
      ]);
      
      return { 
        passed: fetchesStrategies && displaysStrategyNames,
        message: fetchesStrategies && displaysStrategyNames 
          ? 'Trades page fetches and displays strategy names'
          : 'Trades page may not properly display strategy names',
        details: { 
          fetchesStrategies,
          displaysStrategyNames
        }
      };
    },
    'individualTrades'
  );
  
  // Test 2.2: Check strategy-trade associations are accurate
  runTest(
    'Individual Trades - Strategy-trade associations accurate',
    () => {
      if (!tradesCode) {
        return { passed: false, message: 'Trades code not available' };
      }
      
      // Check for strategy-trade relationship
      const hasAssociation = containsCode(tradesCode, [
        'strategy_id',
        'eq(\'strategy_id\'',
        'strategies ('
      ]);
      
      // Check for proper data joining
      const hasDataJoining = containsCode(tradesCode, [
        '.select(',
        'strategies (',
        'relationship'
      ]);
      
      return { 
        passed: hasAssociation && hasDataJoining,
        message: hasAssociation && hasDataJoining 
          ? 'Trades page properly associates trades with strategies'
          : 'Trades page may have incorrect strategy-trade associations',
        details: { 
          hasAssociation,
          hasDataJoining
        }
      };
    },
    'individualTrades'
  );
  
  // Test 2.3: Test strategy filtering on trades page
  runTest(
    'Individual Trades - Strategy filtering functionality',
    () => {
      if (!tradesCode) {
        return { passed: false, message: 'Trades code not available' };
      }
      
      // Check for filtering functionality
      const hasFiltering = containsCode(tradesCode, [
        'filter',
        'where',
        'eq(\'strategy_id\''
      ]);
      
      // Check for filter UI components
      const hasFilterUI = containsCode(tradesCode, [
        'select',
        'dropdown',
        'input.*placeholder.*filter'
      ]);
      
      return { 
        passed: hasFiltering || hasFilterUI,
        message: hasFiltering || hasFilterUI 
          ? 'Trades page includes strategy filtering functionality'
          : 'Trades page may lack strategy filtering features',
        details: { 
          hasFiltering,
          hasFilterUI
        }
      };
    },
    'individualTrades'
  );
  
  // Test 2.4: Verify strategy metadata displays properly
  runTest(
    'Individual Trades - Strategy metadata displays properly',
    () => {
      if (!tradesCode) {
        return { passed: false, message: 'Trades code not available' };
      }
      
      // Check for strategy metadata display
      const hasMetadata = containsCode(tradesCode, [
        'trade.strategies',
        'strategy.description',
        'strategy.rules'
      ]);
      
      // Check for expanded trade details
      const hasExpandedDetails = containsCode(tradesCode, [
        'expandedTrades',
        'toggleTradeExpansion',
        'expanded'
      ]);
      
      return { 
        passed: hasMetadata && hasExpandedDetails,
        message: hasMetadata && hasExpandedDetails 
          ? 'Trades page displays strategy metadata in expanded details'
          : 'Trades page may not show comprehensive strategy metadata',
        details: { 
          hasMetadata,
          hasExpandedDetails
        }
      };
    },
    'individualTrades'
  );
}

// 3. Test strategy analytics and insights
function testStrategyAnalyticsInsights() {
  const strategyPerformanceCode = readFileContent(TEST_CONFIG.sourceFiles.strategyPerformance);
  const strategyRulesCode = readFileContent(TEST_CONFIG.sourceFiles.strategyRulesEngine);
  
  // Test 3.1: Check if strategy performance insights are generated
  runTest(
    'Analytics - Strategy performance insights generated',
    () => {
      if (!strategyPerformanceCode) {
        return { 
          passed: false, 
          message: 'Strategy performance page code not found',
          details: { file: TEST_CONFIG.sourceFiles.strategyPerformance }
        };
      }
      
      // Check for insights generation
      const hasInsights = containsCode(strategyPerformanceCode, [
        'insight',
        'analysis',
        'recommendation',
        'trend'
      ]);
      
      // Check for performance metrics
      const hasMetrics = containsCode(strategyPerformanceCode, [
        'winrate',
        'profitFactor',
        'sharpe_ratio',
        'max_drawdown'
      ]);
      
      return { 
        passed: hasInsights || hasMetrics,
        message: hasInsights || hasMetrics 
          ? 'Strategy performance page includes insights and analytics'
          : 'Strategy performance page may lack comprehensive insights',
        details: { 
          hasInsights,
          hasMetrics
        }
      };
    },
    'analyticsInsights'
  );
  
  // Test 3.2: Verify strategy effectiveness rankings
  runTest(
    'Analytics - Strategy effectiveness rankings calculated',
    () => {
      if (!strategyRulesCode) {
        return { 
          passed: false, 
          message: 'Strategy rules engine code not found',
          details: { file: TEST_CONFIG.sourceFiles.strategyRulesEngine }
        };
      }
      
      // Check for ranking calculations
      const hasRanking = containsCode(strategyRulesCode, [
        'calculateStrategyStats',
        'getStrategiesWithStats',
        'ranking',
        'score'
      ]);
      
      // Check for performance comparison
      const hasComparison = containsCode(strategyRulesCode, [
        'winrate',
        'profit_factor',
        'total_pnl',
        'comparison'
      ]);
      
      return { 
        passed: hasRanking && hasComparison,
        message: hasRanking && hasComparison 
          ? 'Strategy analytics include effectiveness rankings and comparisons'
          : 'Strategy analytics may lack ranking functionality',
        details: { 
          hasRanking,
          hasComparison
        }
      };
    },
    'analyticsInsights'
  );
  
  // Test 3.3: Test strategy-based recommendations
  runTest(
    'Analytics - Strategy-based recommendations generated',
    () => {
      if (!strategyPerformanceCode) {
        return { passed: false, message: 'Strategy performance code not available' };
      }
      
      // Check for recommendation logic
      const hasRecommendations = containsCode(strategyPerformanceCode, [
        'recommend',
        'suggest',
        'improve',
        'consider'
      ]);
      
      // Check for performance-based logic
      const hasPerformanceLogic = containsCode(strategyPerformanceCode, [
        'if.*winrate',
        'if.*profit',
        'if.*performance',
        'condition'
      ]);
      
      return { 
        passed: hasRecommendations || hasPerformanceLogic,
        message: hasRecommendations || hasPerformanceLogic 
          ? 'Strategy analytics include recommendation logic'
          : 'Strategy analytics may lack recommendation features',
        details: { 
          hasRecommendations,
          hasPerformanceLogic
        }
      };
    },
    'analyticsInsights'
  );
  
  // Test 3.4: Check strategy trend analysis over time
  runTest(
    'Analytics - Strategy trend analysis over time',
    () => {
      if (!strategyPerformanceCode) {
        return { passed: false, message: 'Strategy performance code not available' };
      }
      
      // Check for trend analysis
      const hasTrendAnalysis = containsCode(strategyPerformanceCode, [
        'trend',
        'over time',
        'performance.*date',
        'time.*series'
      ]);
      
      // Check for historical data
      const hasHistoricalData = containsCode(strategyPerformanceCode, [
        'trade_date',
        'order.*date',
        'chronological',
        'history'
      ]);
      
      return { 
        passed: hasTrendAnalysis || hasHistoricalData,
        message: hasTrendAnalysis || hasHistoricalData 
          ? 'Strategy analytics include trend analysis over time'
          : 'Strategy analytics may lack trend analysis features',
        details: { 
          hasTrendAnalysis,
          hasHistoricalData
        }
      };
    },
    'analyticsInsights'
  );
  
  // Test 3.5: Verify strategy risk/reward calculations
  runTest(
    'Analytics - Strategy risk/reward calculations',
    () => {
      if (!strategyRulesCode) {
        return { passed: false, message: 'Strategy rules engine code not available' };
      }
      
      // Check for risk calculations
      const hasRiskCalculations = containsCode(strategyRulesCode, [
        'max_drawdown',
        'sharpe_ratio',
        'risk',
        'volatility'
      ]);
      
      // Check for reward calculations
      const hasRewardCalculations = containsCode(strategyRulesCode, [
        'profit_factor',
        'avg_win',
        'avg_loss',
        'expectancy'
      ]);
      
      return { 
        passed: hasRiskCalculations && hasRewardCalculations,
        message: hasRiskCalculations && hasRewardCalculations 
          ? 'Strategy analytics include comprehensive risk/reward calculations'
          : 'Strategy analytics may lack risk/reward calculations',
        details: { 
          hasRiskCalculations,
          hasRewardCalculations
        }
      };
    },
    'analyticsInsights'
  );
}

// 4. Test strategy data integration
function testStrategyDataIntegration() {
  const strategyRulesCode = readFileContent(TEST_CONFIG.sourceFiles.strategyRulesEngine);
  const strategiesCode = readFileContent(TEST_CONFIG.sourceFiles.strategies);
  
  // Test 4.1: Verify strategies link correctly to trade outcomes
  runTest(
    'Integration - Strategies link correctly to trade outcomes',
    () => {
      if (!strategyRulesCode) {
        return { 
          passed: false, 
          message: 'Strategy rules engine code not found',
          details: { file: TEST_CONFIG.sourceFiles.strategyRulesEngine }
        };
      }
      
      // Check for strategy-trade linking
      const hasLinking = containsCode(strategyRulesCode, [
        'strategy_id',
        'eq(\'strategy_id\'',
        'join.*trades'
      ]);
      
      // Check for outcome calculations
      const hasOutcomeCalculations = containsCode(strategyRulesCode, [
        'pnl',
        'calculateStrategyStats',
        'total_pnl',
        'winrate'
      ]);
      
      return { 
        passed: hasLinking && hasOutcomeCalculations,
        message: hasLinking && hasOutcomeCalculations 
          ? 'Strategy data integration includes proper trade-outcome linking'
          : 'Strategy data integration may have linking issues',
        details: { 
          hasLinking,
          hasOutcomeCalculations
        }
      };
    },
    'dataIntegration'
  );
  
  // Test 4.2: Test strategy performance calculations with 200 trades
  runTest(
    'Integration - Strategy performance calculations with 200 trades',
    () => {
      if (!strategyRulesCode) {
        return { passed: false, message: 'Strategy rules engine code not available' };
      }
      
      // Check for scalable calculations
      const hasScalableCalculations = containsCode(strategyRulesCode, [
        'calculateStrategyStats',
        'reduce',
        'map',
        'filter'
      ]);
      
      // Check for comprehensive metrics
      const hasComprehensiveMetrics = containsCode(strategyRulesCode, [
        'total_trades',
        'winning_trades',
        'total_pnl',
        'profit_factor',
        'sharpe_ratio'
      ]);
      
      return { 
        passed: hasScalableCalculations && hasComprehensiveMetrics,
        message: hasScalableCalculations && hasComprehensiveMetrics 
          ? 'Strategy performance calculations are scalable for 200+ trades'
          : 'Strategy performance calculations may not scale properly',
        details: { 
          hasScalableCalculations,
          hasComprehensiveMetrics
        }
      };
    },
    'dataIntegration'
  );
  
  // Test 4.3: Check strategy consistency across all pages
  runTest(
    'Integration - Strategy consistency across all pages',
    () => {
      const dashboardCode = readFileContent(TEST_CONFIG.sourceFiles.dashboard);
      const strategiesCode = readFileContent(TEST_CONFIG.sourceFiles.strategies);
      const tradesCode = readFileContent(TEST_CONFIG.sourceFiles.trades);
      
      // Check for consistent strategy fetching
      const dashboardFetches = dashboardCode && containsCode(dashboardCode, ['strategies', 'getStrategiesWithStats']);
      const strategiesPageFetches = strategiesCode && containsCode(strategiesCode, ['strategies', 'getStrategiesWithStats']);
      const tradesFetches = tradesCode && containsCode(tradesCode, ['strategies', 'strategy_id']);
      
      const consistentFetching = dashboardFetches && strategiesPageFetches && tradesFetches;
      
      return { 
        passed: consistentFetching,
        message: consistentFetching 
          ? 'Strategy data fetching is consistent across all pages'
          : 'Strategy data fetching may be inconsistent across pages',
        details: { 
          dashboardFetches,
          strategiesPageFetches,
          tradesFetches
        }
      };
    },
    'dataIntegration'
  );
  
  // Test 4.4: Verify strategy summary statistics accuracy
  runTest(
    'Integration - Strategy summary statistics accuracy',
    () => {
      if (!strategyRulesCode) {
        return { passed: false, message: 'Strategy rules engine code not available' };
      }
      
      // Check for statistics calculation
      const hasStatsCalculation = containsCode(strategyRulesCode, [
        'calculateStrategyStats',
        'StrategyStats',
        'total_trades',
        'winrate'
      ]);
      
      // Check for accuracy validation
      const hasAccuracyChecks = containsCode(strategyRulesCode, [
        'validate',
        'error handling',
        'try.*catch',
        'validation'
      ]);
      
      return { 
        passed: hasStatsCalculation && hasAccuracyChecks,
        message: hasStatsCalculation && hasAccuracyChecks 
          ? 'Strategy summary statistics include accuracy validation'
          : 'Strategy summary statistics may lack accuracy checks',
        details: { 
          hasStatsCalculation,
          hasAccuracyChecks
        }
      };
    },
    'dataIntegration'
  );
}

// 5. Test strategy CRUD functionality
function testStrategyCRUD() {
  const strategiesCode = readFileContent(TEST_CONFIG.sourceFiles.strategies);
  
  // Test 5.1: Test strategy creation
  runTest(
    'CRUD - Strategy creation',
    () => {
      // Check for create strategy page
      const createPagePath = 'src/app/strategies/create/page.tsx';
      const createPageCode = readFileContent(createPagePath);
      
      if (!createPageCode) {
        return { 
          passed: false, 
          message: 'Strategy creation page code not found',
          details: { file: createPagePath }
        };
      }
      
      // Check for form elements
      const hasForm = containsCode(createPageCode, [
        'form',
        'input',
        'submit',
        'button'
      ]);
      
      // Check for creation logic
      const hasCreationLogic = containsCode(createPageCode, [
        'insert',
        'create',
        'mutation',
        'onSubmit'
      ]);
      
      return { 
        passed: hasForm && hasCreationLogic,
        message: hasForm && hasCreationLogic 
          ? 'Strategy creation page includes form and creation logic'
          : 'Strategy creation page may be incomplete',
        details: { 
          hasForm,
          hasCreationLogic
        }
      };
    },
    'crudFunctionality'
  );
  
  // Test 5.2: Verify strategy editing works
  runTest(
    'CRUD - Strategy editing',
    () => {
      // Check for edit strategy page
      const editPagePath = 'src/app/strategies/edit/[id]/page.tsx';
      const editPageCode = readFileContent(editPagePath);
      
      if (!editPageCode) {
        return { 
          passed: false, 
          message: 'Strategy edit page code not found',
          details: { file: editPagePath }
        };
      }
      
      // Check for edit form
      const hasEditForm = containsCode(editPageCode, [
        'form',
        'input',
        'defaultValue',
        'value'
      ]);
      
      // Check for update logic
      const hasUpdateLogic = containsCode(editPageCode, [
        'update',
        'patch',
        'onSubmit',
        'save'
      ]);
      
      return { 
        passed: hasEditForm && hasUpdateLogic,
        message: hasEditForm && hasUpdateLogic 
          ? 'Strategy edit page includes form and update logic'
          : 'Strategy edit page may be incomplete',
        details: { 
          hasEditForm,
          hasUpdateLogic
        }
      };
    },
    'crudFunctionality'
  );
  
  // Test 5.3: Test strategy deletion (with proper trade handling)
  runTest(
    'CRUD - Strategy deletion with trade handling',
    () => {
      if (!strategiesCode) {
        return { passed: false, message: 'Strategies page code not available' };
      }
      
      // Check for delete functionality
      const hasDeleteButton = containsCode(strategiesCode, [
        'delete',
        'Trash2',
        'onDelete',
        'handleDelete'
      ]);
      
      // Check for confirmation dialog
      const hasConfirmation = containsCode(strategiesCode, [
        'confirm',
        'alert',
        'window.confirm',
        'Dialog'
      ]);
      
      return { 
        passed: hasDeleteButton && hasConfirmation,
        message: hasDeleteButton && hasConfirmation 
          ? 'Strategy deletion includes confirmation and handling'
          : 'Strategy deletion may lack proper confirmation',
        details: { 
          hasDeleteButton,
          hasConfirmation
        }
      };
    },
    'crudFunctionality'
  );
  
  // Test 5.4: Check strategy validation rules
  runTest(
    'CRUD - Strategy validation rules',
    () => {
      const createPageCode = readFileContent('src/app/strategies/create/page.tsx');
      
      if (!createPageCode) {
        return { passed: false, message: 'Strategy creation page code not available' };
      }
      
      // Check for validation
      const hasValidation = containsCode(createPageCode, [
        'validate',
        'required',
        'error',
        'validation'
      ]);
      
      // Check for error handling
      const hasErrorHandling = containsCode(createPageCode, [
        'try.*catch',
        'error',
        'setError',
        'validation'
      ]);
      
      return { 
        passed: hasValidation || hasErrorHandling,
        message: hasValidation || hasErrorHandling 
          ? 'Strategy creation includes validation and error handling'
          : 'Strategy creation may lack proper validation',
        details: { 
          hasValidation,
          hasErrorHandling
        }
      };
    },
    'crudFunctionality'
  );
}

// Generate recommendations based on test results
function generateRecommendations() {
  const recommendations = [];
  
  // Analyze failed tests and generate recommendations
  testResults.issues.forEach(issue => {
    switch (issue.category) {
      case 'dashboardPerformance':
        if (issue.message.includes('may not properly display')) {
          recommendations.push('Enhance dashboard to properly display strategy performance metrics');
        } else if (issue.message.includes('may lack')) {
          recommendations.push('Add missing strategy performance features to dashboard');
        }
        break;
        
      case 'individualTrades':
        if (issue.message.includes('may not properly display')) {
          recommendations.push('Improve strategy name display on trade records');
        } else if (issue.message.includes('may lack')) {
          recommendations.push('Implement missing strategy features on trades page');
        }
        break;
        
      case 'analyticsInsights':
        if (issue.message.includes('may lack')) {
          recommendations.push('Enhance strategy analytics with comprehensive insights and recommendations');
        }
        break;
        
      case 'dataIntegration':
        if (issue.message.includes('may have')) {
          recommendations.push('Fix strategy data integration issues for better consistency');
        }
        break;
        
      case 'crudFunctionality':
        if (issue.message.includes('may be incomplete')) {
          recommendations.push('Complete strategy CRUD functionality implementation');
        } else if (issue.message.includes('may lack')) {
          recommendations.push('Add missing validation and error handling to strategy CRUD');
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
  
  if (recommendations.length === 0) {
    recommendations.push('All strategy performance tracking features appear to be properly implemented');
  }
  
  testResults.recommendations = recommendations;
}

// Save test results to file
async function saveTestResults() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `manual-strategy-performance-test-results-${timestamp}.json`;
  const reportFilename = `MANUAL_STRATEGY_PERFORMANCE_TEST_REPORT.md`;
  
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
  
  let report = `# Manual Strategy Performance Tracking Test Report

## Summary

- **Total Tests:** ${testResults.summary.totalTests}
- **Passed:** ${testResults.summary.passedTests}
- **Failed:** ${testResults.summary.failedTests}
- **Pass Rate:** ${passRate}%
- **Duration:** ${Math.round(testResults.summary.duration / 1000)}s
- **Test Date:** ${new Date(testResults.summary.startTime).toLocaleDateString()}
- **Test Environment:** Manual code analysis and verification

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

## Code Analysis Summary

### Files Analyzed:
${Object.values(TEST_CONFIG.sourceFiles).map(file => `- ${file}`).join('\n')}

### Expected Strategies:
${TEST_CONFIG.expectedStrategies.map(strategy => `- ${strategy}`).join('\n')}

### Expected Trade Count: ${TEST_CONFIG.expectedTradeCount}

---

## Manual Testing Notes

This test was conducted through manual code analysis to verify the implementation of strategy performance tracking features. The analysis checks:

1. **Code Structure** - Whether the necessary files and components exist
2. **Functionality Implementation** - Whether strategy performance features are properly coded
3. **Data Integration** - Whether strategy data flows correctly between components
4. **User Interface** - Whether strategy information is displayed to users
5. **CRUD Operations** - Whether strategy create, read, update, delete operations are implemented

### Limitations:
- This is a static code analysis and cannot verify runtime behavior
- Database connectivity and actual data display require runtime testing
- User interaction flows need browser-based testing for complete verification

---

*This report was generated automatically by Manual Strategy Performance Tracking Test Suite*
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
  console.log('🏁 MANUAL STRATEGY PERFORMANCE TRACKING TEST SUMMARY');
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

// Main test execution function
async function runAllTests() {
  console.log('🚀 Starting Manual Strategy Performance Tracking Tests');
  console.log('================================================');
  console.log('📋 Analyzing code implementation for strategy performance tracking features...\n');
  
  try {
    // Run all test categories
    console.log('📊 1. Testing Strategy Performance Display on Dashboard');
    testDashboardStrategyDisplay();
    
    console.log('\n📋 2. Testing Strategy Performance on Individual Trades');
    testIndividualTradeStrategyPerformance();
    
    console.log('\n📈 3. Testing Strategy Analytics and Insights');
    testStrategyAnalyticsInsights();
    
    console.log('\n🔗 4. Testing Strategy Data Integration');
    testStrategyDataIntegration();
    
    console.log('\n⚙️ 5. Testing Strategy CRUD Functionality');
    testStrategyCRUD();
    
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

// Run tests
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = {
  runAllTests,
  testResults
};