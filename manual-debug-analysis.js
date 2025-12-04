const fs = require('fs');

// Debug report structure
const debugReport = {
  timestamp: new Date().toISOString(),
  marketFilter: {
    issue: 'Market filter doesn\'t work correctly',
    findings: [],
    rootCause: null,
    recommendations: []
  },
  statisticsBoxes: {
    issue: 'Statistics boxes stop working when sorting',
    findings: [],
    rootCause: null,
    recommendations: []
  },
  recentOptimizations: {
    analysis: [],
    potentialImpacts: []
  }
};

// Helper function to log debug info
function logDebug(category, message, data = null) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    category,
    message,
    data
  };
  
  console.log(`[${timestamp}] [${category}] ${message}`);
  if (data) {
    console.log(JSON.stringify(data, null, 2));
  }
  
  return logEntry;
}

// Analyze Market Filter Implementation
function analyzeMarketFilterImplementation() {
  logDebug('MARKET_FILTER', 'Analyzing Market filter implementation in code');
  
  try {
    // Read the trades page implementation
    const tradesPagePath = './src/app/trades/page.tsx';
    if (!fs.existsSync(tradesPagePath)) {
      const finding = logDebug('MARKET_FILTER', 'Trades page file not found');
      debugReport.marketFilter.findings.push(finding);
      return false;
    }
    
    const tradesPageContent = fs.readFileSync(tradesPagePath, 'utf8');
    
    // Check for market filter implementation
    const marketFilterChecks = {
      marketDropdownExists: tradesPageContent.includes('name="market"') || tradesPageContent.includes('value={filters.market}'),
      marketFilterState: tradesPageContent.includes('market:') || tradesPageContent.includes('filters.market'),
      marketFilterHandler: tradesPageContent.includes('setFilters(prev => ({ ...prev, market:') || tradesPageContent.includes('onChange={(e) => setFilters(prev => ({ ...prev, market:'),
      marketFilterPassedToAPI: false // Will check in optimized-queries
    };
    
    logDebug('MARKET_FILTER', 'Market filter implementation checks', marketFilterChecks);
    
    // Check if market filter is properly integrated with state
    if (!marketFilterChecks.marketDropdownExists) {
      const finding = logDebug('MARKET_FILTER', 'Market dropdown not properly implemented in JSX');
      debugReport.marketFilter.findings.push(finding);
    }
    
    if (!marketFilterChecks.marketFilterState) {
      const finding = logDebug('MARKET_FILTER', 'Market filter state not properly defined');
      debugReport.marketFilter.findings.push(finding);
    }
    
    if (!marketFilterChecks.marketFilterHandler) {
      const finding = logDebug('MARKET_FILTER', 'Market filter change handler not properly implemented');
      debugReport.marketFilter.findings.push(finding);
    }
    
    // Check optimized-queries.ts for market filter handling
    const queriesPath = './src/lib/optimized-queries.ts';
    if (fs.existsSync(queriesPath)) {
      const queriesContent = fs.readFileSync(queriesPath, 'utf8');
      
      const marketQueryChecks = {
        marketFilterInFetchTrades: queriesContent.includes('options.market') || queriesContent.includes('.eq(\'market\''),
        marketFilterInFetchStats: queriesContent.includes('options.market') || queriesContent.includes('.eq(\'market\''),
        marketFilterAppliedCorrectly: queriesContent.includes('if (options.market)') || queriesContent.includes('query = query.eq(\'market\'')
      };
      
      marketFilterChecks.marketFilterPassedToAPI = marketQueryChecks.marketFilterInFetchTrades && marketQueryChecks.marketFilterInFetchStats;
      
      logDebug('MARKET_FILTER', 'Market filter API integration checks', marketQueryChecks);
      
      if (!marketQueryChecks.marketFilterInFetchTrades) {
        const finding = logDebug('MARKET_FILTER', 'Market filter not properly passed to fetchTradesPaginated function');
        debugReport.marketFilter.findings.push(finding);
      }
      
      if (!marketQueryChecks.marketFilterInFetchStats) {
        const finding = logDebug('MARKET_FILTER', 'Market filter not properly passed to fetchTradesStatistics function');
        debugReport.marketFilter.findings.push(finding);
      }
      
      if (!marketQueryChecks.marketFilterAppliedCorrectly) {
        const finding = logDebug('MARKET_FILTER', 'Market filter condition not properly applied in query');
        debugReport.marketFilter.findings.push(finding);
      }
    }
    
    // Check useEffect dependencies for market filter
    const useEffectChecks = {
      marketInDeps: tradesPageContent.includes('filters, sortConfig') || tradesPageContent.includes('filtersRef.current'),
      marketInDebounce: tradesPageContent.includes('debouncedFetchTrades') || tradesPageContent.includes('createFilterDebouncedFunction')
    };
    
    logDebug('MARKET_FILTER', 'Market filter useEffect checks', useEffectChecks);
    
    if (!useEffectChecks.marketInDeps) {
      const finding = logDebug('MARKET_FILTER', 'Market filter not properly included in useEffect dependencies');
      debugReport.marketFilter.findings.push(finding);
    }
    
    return marketFilterChecks.marketDropdownExists && marketFilterChecks.marketFilterState && 
           marketFilterChecks.marketFilterHandler && marketFilterChecks.marketFilterPassedToAPI;
    
  } catch (error) {
    const errorFinding = logDebug('MARKET_FILTER', 'Error analyzing market filter implementation', { error: error.message });
    debugReport.marketFilter.findings.push(errorFinding);
    return false;
  }
}

// Analyze Statistics Boxes Implementation
function analyzeStatisticsBoxesImplementation() {
  logDebug('STATISTICS_BOXES', 'Analyzing Statistics boxes implementation in code');
  
  try {
    // Read trades page implementation
    const tradesPagePath = './src/app/trades/page.tsx';
    if (!fs.existsSync(tradesPagePath)) {
      const finding = logDebug('STATISTICS_BOXES', 'Trades page file not found');
      debugReport.statisticsBoxes.findings.push(finding);
      return false;
    }
    
    const tradesPageContent = fs.readFileSync(tradesPagePath, 'utf8');
    
    // Check for statistics boxes implementation
    const statsChecks = {
      statisticsStateExists: tradesPageContent.includes('const [statistics, setStatistics]'),
      fetchStatisticsExists: tradesPageContent.includes('fetchStatistics') || tradesPageContent.includes('fetchTradesStatistics'),
      statisticsInJSX: tradesPageContent.includes('statistics?.totalPnL') || tradesPageContent.includes('statistics?.winRate'),
      statisticsDisplayed: tradesPageContent.includes('Total P&L') || tradesPageContent.includes('Win Rate'),
      debouncedStatistics: tradesPageContent.includes('debouncedFetchStatistics') || tradesPageContent.includes('createStatsDebouncedFunction')
    };
    
    logDebug('STATISTICS_BOXES', 'Statistics boxes implementation checks', statsChecks);
    
    if (!statsChecks.statisticsStateExists) {
      const finding = logDebug('STATISTICS_BOXES', 'Statistics state not properly defined');
      debugReport.statisticsBoxes.findings.push(finding);
    }
    
    if (!statsChecks.fetchStatisticsExists) {
      const finding = logDebug('STATISTICS_BOXES', 'fetchStatistics function not implemented');
      debugReport.statisticsBoxes.findings.push(finding);
    }
    
    if (!statsChecks.statisticsInJSX) {
      const finding = logDebug('STATISTICS_BOXES', 'Statistics not properly displayed in JSX');
      debugReport.statisticsBoxes.findings.push(finding);
    }
    
    if (!statsChecks.debouncedStatistics) {
      const finding = logDebug('STATISTICS_BOXES', 'Statistics fetching not properly debounced');
      debugReport.statisticsBoxes.findings.push(finding);
    }
    
    // Check useEffect dependencies for statistics
    const useEffectRegex = /useEffect\(\(\) => \{[\s\S]*?\}, \[([\s\S]*?)\]\)/g;
    const useEffectMatches = tradesPageContent.match(useEffectRegex);
    
    let statisticsInUseEffectDeps = false;
    let sortConfigInUseEffectDeps = false;
    let potentialIssueFound = false;
    
    if (useEffectMatches) {
      useEffectMatches.forEach((match, index) => {
        const deps = match.split(', [')[1]?.replace(']', '') || '';
        
        if (deps.includes('fetchStatistics') || deps.includes('debouncedFetchStatistics')) {
          statisticsInUseEffectDeps = true;
        }
        
        if (deps.includes('sortConfig')) {
          sortConfigInUseEffectDeps = true;
        }
        
        // Check for potential issue: sortConfig in dependencies but statistics not properly updated
        if (deps.includes('sortConfig') && !deps.includes('debouncedFetchStatistics')) {
          potentialIssueFound = true;
          const finding = logDebug('STATISTICS_BOXES', `Potential issue in useEffect #${index + 1}: sortConfig in dependencies but statistics may not update during sorting`, {
            dependencies: deps
          });
          debugReport.statisticsBoxes.findings.push(finding);
        }
      });
    }
    
    const useEffectChecks = {
      statisticsInUseEffectDeps,
      sortConfigInUseEffectDeps,
      potentialIssueFound
    };
    
    logDebug('STATISTICS_BOXES', 'Statistics useEffect checks', useEffectChecks);
    
    // Check for React.memo usage
    const memoChecks = {
      componentMemoized: tradesPageContent.includes('memo(function TradesPageContent') || tradesPageContent.includes('React.memo'),
      useCallbackUsed: tradesPageContent.includes('useCallback') || tradesPageContent.includes('fetchStatistics = useCallback')
    };
    
    logDebug('STATISTICS_BOXES', 'React optimization checks', memoChecks);
    
    if (!memoChecks.componentMemoized) {
      const finding = logDebug('STATISTICS_BOXES', 'Component not properly memoized, may cause unnecessary re-renders');
      debugReport.statisticsBoxes.findings.push(finding);
    }
    
    if (!memoChecks.useCallbackUsed) {
      const finding = logDebug('STATISTICS_BOXES', 'fetchStatistics not properly wrapped in useCallback');
      debugReport.statisticsBoxes.findings.push(finding);
    }
    
    // Check for specific issue: statistics not updating during sort
    const sortHandlerRegex = /setSortConfig|onSort|sort.*=.*{/g;
    const sortHandlerMatches = tradesPageContent.match(sortHandlerRegex);
    
    if (sortHandlerMatches) {
      // Check if statistics are updated when sort changes
      const statisticsUpdateInSort = sortHandlerMatches.some(match => 
        tradesPageContent.substring(tradesPageContent.indexOf(match), tradesPageContent.indexOf(match) + 500).includes('fetchStatistics') ||
        tradesPageContent.substring(tradesPageContent.indexOf(match), tradesPageContent.indexOf(match) + 500).includes('debouncedFetchStatistics')
      );
      
      if (!statisticsUpdateInSort) {
        const finding = logDebug('STATISTICS_BOXES', 'Statistics not being updated when sort configuration changes');
        debugReport.statisticsBoxes.findings.push(finding);
      }
    }
    
    return statsChecks.statisticsStateExists && statsChecks.fetchStatisticsExists && 
           statsChecks.statisticsInJSX && statsChecks.debouncedStatistics;
    
  } catch (error) {
    const errorFinding = logDebug('STATISTICS_BOXES', 'Error analyzing statistics boxes implementation', { error: error.message });
    debugReport.statisticsBoxes.findings.push(errorFinding);
    return false;
  }
}

// Analyze Recent Optimizations
function analyzeRecentOptimizations() {
  logDebug('OPTIMIZATIONS', 'Analyzing recent optimizations for potential impacts');
  
  try {
    const optimizationAnalysis = {
      memoizationFile: false,
      filterPersistenceFile: false,
      optimizedQueriesFile: false,
      tradesPageOptimized: false
    };
    
    // Check if optimization files exist
    if (fs.existsSync('./src/lib/memoization.ts')) {
      optimizationAnalysis.memoizationFile = true;
      const memoizationContent = fs.readFileSync('./src/lib/memoization.ts', 'utf8');
      
      // Check for specific optimizations that might cause issues
      const memoizationChecks = {
        debouncingImplemented: memoizationContent.includes('createDebouncedFunction') || memoizationContent.includes('createFilterDebouncedFunction'),
        statsDebouncing: memoizationContent.includes('createStatsDebouncedFunction'),
        cacheImplementation: memoizationContent.includes('MemoCache') || memoizationContent.includes('memoCache')
      };
      
      logDebug('OPTIMIZATIONS', 'Memoization optimizations', memoizationChecks);
      debugReport.recentOptimizations.analysis.push(memoizationChecks);
    }
    
    if (fs.existsSync('./src/lib/filter-persistence.ts')) {
      optimizationAnalysis.filterPersistenceFile = true;
      const persistenceContent = fs.readFileSync('./src/lib/filter-persistence.ts', 'utf8');
      
      const persistenceChecks = {
        localStorageCaching: persistenceContent.includes('localStorageCache') || persistenceContent.includes('CACHE_TTL'),
        crossTabSync: persistenceContent.includes('useFilterSync') || persistenceContent.includes('storage event'),
        performanceMonitoring: persistenceContent.includes('readOperations') || persistenceContent.includes('writeOperations')
      };
      
      logDebug('OPTIMIZATIONS', 'Filter persistence optimizations', persistenceChecks);
      debugReport.recentOptimizations.analysis.push(persistenceChecks);
    }
    
    if (fs.existsSync('./src/lib/optimized-queries.ts')) {
      optimizationAnalysis.optimizedQueriesFile = true;
      const queriesContent = fs.readFileSync('./src/lib/optimized-queries.ts', 'utf8');
      
      const queriesChecks = {
        performanceMonitoring: queriesContent.includes('performance.now()') || queriesContent.includes('queryTime'),
        selectiveFetching: queriesContent.includes('.select(') || queriesContent.includes('head: true'),
        queryOptimization: queriesContent.includes('optimized') || queriesContent.includes('performance')
      };
      
      logDebug('OPTIMIZATIONS', 'Query optimizations', queriesChecks);
      debugReport.recentOptimizations.analysis.push(queriesChecks);
    }
    
    if (fs.existsSync('./src/app/trades/page.tsx')) {
      const tradesPageContent = fs.readFileSync('./src/app/trades/page.tsx', 'utf8');
      
      const tradesPageChecks = {
        memoUsed: tradesPageContent.includes('memo(function') || tradesPageContent.includes('React.memo'),
        useCallbackUsed: tradesPageContent.includes('useCallback'),
        useEffectOptimized: tradesPageContent.includes('useEffect') && tradesPageContent.includes('debouncedFetchTrades'),
        refsUsed: tradesPageContent.includes('useRef') || tradesPageContent.includes('filtersRef'),
        performanceOptimized: tradesPageContent.includes('performance.now()') || tradesPageContent.includes('startTime')
      };
      
      optimizationAnalysis.tradesPageOptimized = true;
      logDebug('OPTIMIZATIONS', 'Trades page optimizations', tradesPageChecks);
      debugReport.recentOptimizations.analysis.push(tradesPageChecks);
      
      // Check for potential issues with optimizations
      if (tradesPageChecks.useEffectOptimized) {
        // Look for the specific useEffect that handles data fetching
        const dataFetchEffectRegex = /useEffect\(\(\) => \{[\s\S]*?debouncedFetchTrades[\s\S]*?debouncedFetchStatistics[\s\S]*?\}, \[([\s\S]*?)\]\)/g;
        const dataFetchMatch = tradesPageContent.match(dataFetchEffectRegex);
        
        if (dataFetchMatch) {
          const deps = dataFetchMatch[0].split(', [')[1]?.split(']')[0] || '';
          
          // Check if both filters and sortConfig are in dependencies
          const hasFilters = deps.includes('filters');
          const hasSortConfig = deps.includes('sortConfig');
          const hasDebouncedFunctions = deps.includes('debouncedFetchTrades') && deps.includes('debouncedFetchStatistics');
          
          if (hasFilters && hasSortConfig && !hasDebouncedFunctions) {
            const finding = logDebug('OPTIMIZATIONS', 'Potential issue: useEffect has filters and sortConfig in dependencies but missing debounced functions', {
              dependencies: deps
            });
            debugReport.recentOptimizations.potentialImpacts.push(finding);
          }
        }
      }
    }
    
    return optimizationAnalysis;
    
  } catch (error) {
    const errorFinding = logDebug('OPTIMIZATIONS', 'Error analyzing optimizations', { error: error.message });
    debugReport.recentOptimizations.analysis.push(errorFinding);
    return false;
  }
}

// Identify Root Causes
function identifyRootCauses() {
  logDebug('ROOT_CAUSE_ANALYSIS', 'Identifying root causes for both issues');
  
  // Market Filter Root Cause Analysis
  if (debugReport.marketFilter.findings.length > 0) {
    const marketFilterIssues = debugReport.marketFilter.findings.map(f => f.message);
    
    // Check for most likely root cause
    if (marketFilterIssues.some(issue => issue.includes('not properly passed to fetchTradesPaginated'))) {
      debugReport.marketFilter.rootCause = 'Market filter value is not being passed to the API query function';
      debugReport.marketFilter.recommendations.push('Ensure market filter is included in the options parameter passed to fetchTradesPaginated');
      debugReport.marketFilter.recommendations.push('Verify that the market filter condition is applied in the Supabase query');
    } else if (marketFilterIssues.some(issue => issue.includes('not properly included in useEffect dependencies'))) {
      debugReport.marketFilter.rootCause = 'Market filter not properly included in useEffect dependencies, causing filter changes to not trigger data refetch';
      debugReport.marketFilter.recommendations.push('Add filters to the useEffect dependency array');
      debugReport.marketFilter.recommendations.push('Ensure filter changes trigger the debounced fetch function');
    } else if (marketFilterIssues.some(issue => issue.includes('Market dropdown not properly implemented'))) {
      debugReport.marketFilter.rootCause = 'Market dropdown UI component is not properly implemented or connected to state';
      debugReport.marketFilter.recommendations.push('Verify the market dropdown has correct name attribute and value binding');
      debugReport.marketFilter.recommendations.push('Ensure onChange handler properly updates the filter state');
    }
  }
  
  // Statistics Boxes Root Cause Analysis
  if (debugReport.statisticsBoxes.findings.length > 0) {
    const statisticsIssues = debugReport.statisticsBoxes.findings.map(f => f.message);
    
    // Check for most likely root cause
    if (statisticsIssues.some(issue => issue.includes('sortConfig in dependencies but statistics may not update during sorting'))) {
      debugReport.statisticsBoxes.rootCause = 'useEffect dependencies include sortConfig but statistics are not properly updated during sorting operations';
      debugReport.statisticsBoxes.recommendations.push('Ensure debouncedFetchStatistics is included in useEffect dependencies');
      debugReport.statisticsBoxes.recommendations.push('Add explicit statistics update when sortConfig changes');
    } else if (statisticsIssues.some(issue => issue.includes('fetchStatistics not properly wrapped in useCallback'))) {
      debugReport.statisticsBoxes.rootCause = 'fetchStatistics function is not memoized, causing unnecessary re-renders and potential state conflicts';
      debugReport.statisticsBoxes.recommendations.push('Wrap fetchStatistics in useCallback with proper dependencies');
      debugReport.statisticsBoxes.recommendations.push('Ensure fetchStatistics uses stable references to filters and sortConfig');
    } else if (statisticsIssues.some(issue => issue.includes('Statistics not being updated when sort configuration changes'))) {
      debugReport.statisticsBoxes.rootCause = 'Statistics calculation is not triggered when sorting changes, only when filters change';
      debugReport.statisticsBoxes.recommendations.push('Add sortConfig to the dependencies of the statistics fetch effect');
      debugReport.statisticsBoxes.recommendations.push('Ensure sorting changes trigger statistics recalculation');
    }
  }
  
  // Cross-issue Analysis
  if (debugReport.recentOptimizations.potentialImpacts.length > 0) {
    const optimizationIssues = debugReport.recentOptimizations.potentialImpacts.map(f => f.message);
    
    if (optimizationIssues.some(issue => issue.includes('useEffect has filters and sortConfig in dependencies but missing debounced functions'))) {
      logDebug('ROOT_CAUSE_ANALYSIS', 'Cross-issue optimization problem identified');
      debugReport.marketFilter.recommendations.push('Review useEffect dependencies to ensure proper debounced function inclusion');
      debugReport.statisticsBoxes.recommendations.push('Review useEffect dependencies to ensure proper debounced function inclusion');
    }
  }
}

// Main debugging function
function runDebugAnalysis() {
  logDebug('MAIN', 'Starting manual code analysis debugging');
  
  try {
    // Test 1: Market Filter Functionality
    const marketFilterResult = analyzeMarketFilterImplementation();
    
    // Test 2: Statistics Boxes During Sorting
    const statisticsBoxesResult = analyzeStatisticsBoxesImplementation();
    
    // Test 3: Analyze Recent Optimizations
    const optimizationsResult = analyzeRecentOptimizations();
    
    // Test 4: Identify Root Causes
    identifyRootCauses();
    
    logDebug('MAIN', 'Debug analysis completed', {
      marketFilterResult,
      statisticsBoxesResult,
      optimizationsResult
    });
    
    // Save debug report
    const reportPath = `manual-debug-report-${Date.now()}.json`;
    fs.writeFileSync(reportPath, JSON.stringify(debugReport, null, 2));
    console.log(`\nDebug report saved to: ${reportPath}`);
    
    // Print summary
    console.log('\n=== DEBUG ANALYSIS SUMMARY ===');
    console.log('Market Filter Issues:', debugReport.marketFilter.findings.length);
    console.log('Statistics Boxes Issues:', debugReport.statisticsBoxes.findings.length);
    console.log('Optimization Analysis Items:', debugReport.recentOptimizations.analysis.length);
    
    // Print root causes
    if (debugReport.marketFilter.rootCause) {
      console.log('\n=== MARKET FILTER ROOT CAUSE ===');
      console.log(debugReport.marketFilter.rootCause);
      console.log('\nRecommendations:');
      debugReport.marketFilter.recommendations.forEach(rec => console.log(`- ${rec}`));
    }
    
    if (debugReport.statisticsBoxes.rootCause) {
      console.log('\n=== STATISTICS BOXES ROOT CAUSE ===');
      console.log(debugReport.statisticsBoxes.rootCause);
      console.log('\nRecommendations:');
      debugReport.statisticsBoxes.recommendations.forEach(rec => console.log(`- ${rec}`));
    }
    
} catch (error) {
  logDebug('MAIN', 'Error during debug analysis', { error: error.message });
}
}

// Run the debug analysis
if (require.main === module) {
runDebugAnalysis();
}
      // Save debug report
      const reportPath = `manual-debug-report-${Date.now()}.json`;
      fs.writeFileSync(reportPath, JSON.stringify(debugReport, null, 2));
      console.log(`\nDebug report saved to: ${reportPath}`);
      
      // Print summary
      console.log('\n=== DEBUG ANALYSIS SUMMARY ===');
      console.log('Market Filter Issues:', debugReport.marketFilter.findings.length);
      console.log('Statistics Boxes Issues:', debugReport.statisticsBoxes.findings.length);
      console.log('Optimization Analysis Items:', debugReport.recentOptimizations.analysis.length);
      
      // Print root causes
      if (debugReport.marketFilter.rootCause) {
        console.log('\n=== MARKET FILTER ROOT CAUSE ===');
        console.log(debugReport.marketFilter.rootCause);
        console.log('\nRecommendations:');
        debugReport.marketFilter.recommendations.forEach(rec => console.log(`- ${rec}`));
      }
      
      if (debugReport.statisticsBoxes.rootCause) {
        console.log('\n=== STATISTICS BOXES ROOT CAUSE ===');
        console.log(debugReport.statisticsBoxes.rootCause);
        console.log('\nRecommendations:');
        debugReport.statisticsBoxes.recommendations.forEach(rec => console.log(`- ${rec}`));
      }
      
      process.exit(0);
    })
    .catch(error => {
      console.error('Debug analysis failed:', error);
      process.exit(1);
    });
}

module.exports = {
  analyzeMarketFilterImplementation,
  analyzeStatisticsBoxesImplementation,
  analyzeRecentOptimizations,
  identifyRootCauses,
  debugReport
};