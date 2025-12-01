// Diagnostic script to capture query execution plans and cache details
// when strategy_rule_compliance errors occur during trade logging

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://bzmixuxautbmqbrqtufx.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_p_kFlPj1v5_qaypk8YWCLA_sEY8NVOP';

// Create multiple Supabase clients with different configurations
const clients = {
  primary: createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  }),
  cacheBypass: createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'X-Client-Info': 'diagnostic-cache-bypass'
      }
    }
  }),
  fresh: createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      headers: {
        'X-Client-Info': 'diagnostic-fresh',
        'X-Request-ID': `diag-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      }
    }
  })
};

// Diagnostic data collection
const diagnosticData = {
  timestamp: new Date().toISOString(),
  tests: [],
  errors: [],
  queryPlans: [],
  cacheInfo: {}
};

// Helper function to log diagnostic information
function logDiagnostic(testName, data, error = null) {
  const entry = {
    testName,
    timestamp: new Date().toISOString(),
    data,
    error: error ? {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code
    } : null
  };
  
  diagnosticData.tests.push(entry);
  
  if (error) {
    diagnosticData.errors.push({
      testName,
      error: entry.error,
      timestamp: entry.timestamp
    });
  }
  
  console.log(`\n🔍 [DIAGNOSTIC] ${testName}:`, error ? '❌ ERROR' : '✅ SUCCESS');
  if (error) {
    console.error('   Error:', error.message);
    if (error.details) console.error('   Details:', error.details);
    if (error.hint) console.error('   Hint:', error.hint);
  } else {
    console.log('   Data:', JSON.stringify(data, null, 2));
  }
}

// Function to test query with EXPLAIN ANALYZE to capture execution plan
async function explainQuery(client, tableName, whereClause = '') {
  try {
    const explainQuery = `
      EXPLAIN (FORMAT JSON, ANALYZE, BUFFERS, VERBOSE) 
      SELECT * FROM ${tableName} ${whereClause} LIMIT 5
    `;
    
    console.log(`\n📊 [EXPLAIN] Getting execution plan for: ${tableName}`);
    const { data, error } = await client.rpc('exec_sql', { 
      sql_query: explainQuery 
    });
    
    if (error) {
      console.warn('   Could not get execution plan:', error.message);
      return null;
    }
    
    const planData = data || [];
    diagnosticData.queryPlans.push({
      tableName,
      whereClause,
      plan: planData,
      timestamp: new Date().toISOString()
    });
    
    console.log('   ✅ Execution plan captured');
    return planData;
  } catch (err) {
    console.warn('   Exception getting execution plan:', err.message);
    return null;
  }
}

// Function to test cache behavior
async function testCacheBehavior() {
  console.log('\n🧪 Testing cache behavior...');
  
  // Test 1: Direct table access
  logDiagnostic('Direct strategies table access', await testDirectAccess());
  
  // Test 2: Query with user filter (like TradeForm)
  logDiagnostic('Strategies query with user filter', await testUserFilterQuery());
  
  // Test 3: Complex join query
  logDiagnostic('Complex strategies join query', await testComplexJoin());
  
  // Test 4: Trade insertion simulation
  logDiagnostic('Trade insertion simulation', await testTradeInsertion());
}

// Test direct table access
async function testDirectAccess() {
  const results = {};
  
  for (const [clientName, client] of Object.entries(clients)) {
    try {
      const { data, error } = await client
        .from('strategies')
        .select('*')
        .limit(1);
      
      results[clientName] = {
        success: !error,
        count: data?.length || 0,
        error: error?.message || null
      };
      
      // Get execution plan for this query
      if (clientName === 'primary') {
        await explainQuery(client, 'strategies', 'LIMIT 1');
      }
      
    } catch (err) {
      results[clientName] = {
        success: false,
        count: 0,
        error: err.message
      };
    }
  }
  
  return results;
}

// Test user filter query (similar to TradeForm)
async function testUserFilterQuery() {
  const results = {};
  
  // First get a user ID (we'll use a test approach)
  const { data: { user } } = await clients.primary.auth.getUser();
  const userId = user?.id || 'test-user-id';
  
  for (const [clientName, client] of Object.entries(clients)) {
    try {
      const { data, error } = await client
        .from('strategies')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .limit(5);
      
      results[clientName] = {
        success: !error,
        count: data?.length || 0,
        error: error?.message || null,
        hasStrategyRuleComplianceError: error?.message?.includes('strategy_rule_compliance') || false
      };
      
      // Get execution plan for this query
      if (clientName === 'primary') {
        await explainQuery(client, 'strategies', `WHERE user_id = '${userId}' AND is_active = true LIMIT 5`);
      }
      
    } catch (err) {
      results[clientName] = {
        success: false,
        count: 0,
        error: err.message,
        hasStrategyRuleComplianceError: err.message?.includes('strategy_rule_compliance') || false
      };
    }
  }
  
  return results;
}

// Test complex join query
async function testComplexJoin() {
  const results = {};
  
  for (const [clientName, client] of Object.entries(clients)) {
    try {
      const { data, error } = await client
        .from('strategies')
        .select(`
          *,
          trades:trades(count)
        `)
        .eq('is_active', true)
        .limit(5);
      
      results[clientName] = {
        success: !error,
        count: data?.length || 0,
        error: error?.message || null,
        hasStrategyRuleComplianceError: error?.message?.includes('strategy_rule_compliance') || false
      };
      
    } catch (err) {
      results[clientName] = {
        success: false,
        count: 0,
        error: err.message,
        hasStrategyRuleComplianceError: err.message?.includes('strategy_rule_compliance') || false
      };
    }
  }
  
  return results;
}

// Test trade insertion (simulate TradeForm submission)
async function testTradeInsertion() {
  const results = {};
  
  // Get user ID
  const { data: { user } } = await clients.primary.auth.getUser();
  const userId = user?.id || 'test-user-id';
  
  for (const [clientName, client] of Object.entries(clients)) {
    try {
      // First, try to get strategies (this is where the error occurs)
      const { data: strategies, error: strategyError } = await client
        .from('strategies')
        .select('id, name')
        .eq('user_id', userId)
        .eq('is_active', true)
        .limit(1);
      
      if (strategyError) {
        results[clientName] = {
          success: false,
          step: 'strategies_query',
          error: strategyError.message,
          hasStrategyRuleComplianceError: strategyError.message?.includes('strategy_rule_compliance') || false
        };
        continue;
      }
      
      // If strategies query succeeded, try trade insertion
      const strategyId = strategies?.[0]?.id || null;
      
      const { data: trade, error: tradeError } = await client
        .from('trades')
        .insert({
          user_id: userId,
          market: 'stock',
          symbol: 'TEST',
          strategy_id: strategyId,
          trade_date: new Date().toISOString().split('T')[0],
          side: 'Buy',
          quantity: 100,
          entry_price: 50.0,
          exit_price: 55.0,
          pnl: 500.0
        })
        .select('id')
        .single();
      
      results[clientName] = {
        success: !tradeError,
        step: 'trade_insertion',
        tradeId: trade?.id || null,
        error: tradeError?.message || null,
        hasStrategyRuleComplianceError: tradeError?.message?.includes('strategy_rule_compliance') || false
      };
      
      // Clean up test trade if it was created
      if (trade?.id && !tradeError) {
        await client
          .from('trades')
          .delete()
          .eq('id', trade.id);
      }
      
    } catch (err) {
      results[clientName] = {
        success: false,
        step: 'exception',
        error: err.message,
        hasStrategyRuleComplianceError: err.message?.includes('strategy_rule_compliance') || false
      };
    }
  }
  
  return results;
}

// Function to check database metadata
async function checkDatabaseMetadata() {
  console.log('\n🔍 Checking database metadata...');
  
  const metadata = {};
  
  // Check if strategy_rule_compliance table exists in system catalogs
  try {
    const { data, error } = await clients.primary.rpc('exec_sql', {
      sql_query: `
        SELECT 
          schemaname,
          tablename,
          tableowner
        FROM pg_tables 
        WHERE tablename LIKE '%strategy_rule_compliance%'
        OR tablename = 'strategy_rule_compliance'
      `
    });
    
    metadata.tableExists = data || [];
    metadata.tableError = error?.message || null;
    
  } catch (err) {
    metadata.tableExists = [];
    metadata.tableError = err.message;
  }
  
  // Check for remaining dependencies
  try {
    const { data, error } = await clients.primary.rpc('exec_sql', {
      sql_query: `
        SELECT 
          d.classid::regclass as table_name,
          d.refobjid::regclass as ref_table,
          d.refobjsubid as ref_column
        FROM pg_depend d
        JOIN pg_class c ON d.refobjid = c.oid
        WHERE c.relname = 'strategy_rule_compliance'
      `
    });
    
    metadata.dependencies = data || [];
    metadata.dependenciesError = error?.message || null;
    
  } catch (err) {
    metadata.dependencies = [];
    metadata.dependenciesError = err.message;
  }
  
  // Check for cached query plans
  try {
    const { data, error } = await clients.primary.rpc('exec_sql', {
      sql_query: `
        SELECT 
          query,
          calls,
          total_time,
          mean_time,
          rows
        FROM pg_stat_statements 
        WHERE query ILIKE '%strategy_rule_compliance%'
        ORDER BY total_time DESC
        LIMIT 10
      `
    });
    
    metadata.cachedQueries = data || [];
    metadata.cachedQueriesError = error?.message || null;
    
  } catch (err) {
    metadata.cachedQueries = [];
    metadata.cachedQueriesError = err.message;
  }
  
  diagnosticData.cacheInfo = metadata;
  
  console.log('   Table existence check:', metadata.tableExists.length > 0 ? '❌ Found references' : '✅ No references');
  console.log('   Dependencies check:', metadata.dependencies.length > 0 ? '❌ Found dependencies' : '✅ No dependencies');
  console.log('   Cached queries check:', metadata.cachedQueries.length > 0 ? '❌ Found cached queries' : '✅ No cached queries');
  
  return metadata;
}

// Main diagnostic function
async function runDiagnostics() {
  console.log('🚀 Starting comprehensive strategy_rule_compliance diagnostics...');
  console.log('==================================================');
  
  try {
    // Step 1: Check database metadata
    await checkDatabaseMetadata();
    
    // Step 2: Test cache behavior
    await testCacheBehavior();
    
    // Step 3: Analyze results
    analyzeResults();
    
    // Step 4: Save diagnostic report
    await saveDiagnosticReport();
    
  } catch (error) {
    console.error('\n💥 Diagnostic failed:', error);
    diagnosticData.errors.push({
      error: {
        message: error.message,
        stack: error.stack
      },
      timestamp: new Date().toISOString()
    });
  }
  
  console.log('\n📊 Diagnostic complete!');
}

// Analyze diagnostic results
function analyzeResults() {
  console.log('\n📈 Analyzing diagnostic results...');
  
  const strategyRuleComplianceErrors = diagnosticData.errors.filter(
    e => e.error.message?.includes('strategy_rule_compliance')
  );
  
  const cacheBypassSuccess = diagnosticData.tests.find(
    t => t.testName === 'Strategies query with user filter' && 
    t.data?.cacheBypass?.success && 
    !t.data?.cacheBypass?.hasStrategyRuleComplianceError
  );
  
  const primaryClientFails = diagnosticData.tests.filter(
    t => t.data?.primary?.hasStrategyRuleComplianceError
  );
  
  console.log(`\n🎯 Key Findings:`);
  console.log(`   • Strategy_rule_compliance errors: ${strategyRuleComplianceErrors.length}`);
  console.log(`   • Cache bypass works: ${cacheBypassSuccess ? '✅ Yes' : '❌ No'}`);
  console.log(`   • Primary client fails: ${primaryClientFails.length} tests`);
  
  if (strategyRuleComplianceErrors.length > 0 && !cacheBypassSuccess) {
    console.log(`\n🔥 DIAGNOSIS: PostgreSQL query plan cache issue detected`);
    console.log(`   → Primary client fails with strategy_rule_compliance errors`);
    console.log(`   → Cache bypass also fails (rules out client-side caching)`);
    console.log(`   → Likely cause: PostgreSQL server-side query plan cache`);
  } else if (strategyRuleComplianceErrors.length > 0 && cacheBypassSuccess) {
    console.log(`\n🔥 DIAGNOSIS: Supabase client-side cache issue detected`);
    console.log(`   → Primary client fails with strategy_rule_compliance errors`);
    console.log(`   → Cache bypass succeeds (rules out server-side cache)`);
    console.log(`   → Likely cause: Supabase client metadata cache`);
  } else if (strategyRuleComplianceErrors.length === 0) {
    console.log(`\n✅ DIAGNOSIS: No strategy_rule_compliance errors detected`);
    console.log(`   → Issue may be resolved or intermittent`);
  } else {
    console.log(`\n❓ DIAGNOSIS: Unclear pattern detected`);
    console.log(`   → Further investigation needed`);
  }
}

// Save diagnostic report
async function saveDiagnosticReport() {
  const reportPath = path.join(process.cwd(), `strategy-rule-compliance-diagnostic-${Date.now()}.json`);
  
  try {
    await fs.promises.writeFile(
      reportPath,
      JSON.stringify(diagnosticData, null, 2),
      'utf8'
    );
    
    console.log(`\n💾 Diagnostic report saved to: ${reportPath}`);
    
    // Also save a human-readable summary
    const summaryPath = path.join(process.cwd(), `strategy-rule-compliance-summary-${Date.now()}.md`);
    const summary = generateHumanReadableSummary();
    await fs.promises.writeFile(summaryPath, summary, 'utf8');
    
    console.log(`📄 Human-readable summary saved to: ${summaryPath}`);
    
  } catch (error) {
    console.error('Failed to save diagnostic report:', error);
  }
}

// Generate human-readable summary
function generateHumanReadableSummary() {
  const strategyRuleComplianceErrors = diagnosticData.errors.filter(
    e => e.error.message?.includes('strategy_rule_compliance')
  );
  
  let summary = `# Strategy Rule Compliance Diagnostic Report\n\n`;
  summary += `**Generated:** ${diagnosticData.timestamp}\n\n`;
  
  summary += `## Executive Summary\n\n`;
  
  if (strategyRuleComplianceErrors.length > 0) {
    summary += `- ❌ **ISSUE DETECTED**: Found ${strategyRuleComplianceErrors.length} strategy_rule_compliance errors\n`;
    summary += `- 🔍 **LIKELY CAUSE**: PostgreSQL query plan cache or Supabase schema cache\n`;
    summary += `- 🛠️ **RECOMMENDED FIX**: Execute aggressive cache clearing with DISCARD ALL and ANALYZE\n`;
  } else {
    summary += `- ✅ **NO ISSUES**: No strategy_rule_compliance errors detected\n`;
    summary += `- 🎉 **STATUS**: System appears to be working correctly\n`;
  }
  
  summary += `\n## Detailed Findings\n\n`;
  
  // Add test results
  summary += `### Test Results\n\n`;
  for (const test of diagnosticData.tests) {
    const status = test.error ? '❌ FAILED' : '✅ PASSED';
    summary += `#### ${test.testName}: ${status}\n\n`;
    
    if (test.error) {
      summary += `**Error:** ${test.error.message}\n\n`;
    }
    
    if (test.data) {
      summary += `**Results:**\n\`\`\`json\n${JSON.stringify(test.data, null, 2)}\n\`\`\`\n\n`;
    }
  }
  
  // Add cache information
  if (diagnosticData.cacheInfo) {
    summary += `### Database Cache Information\n\n`;
    summary += `- **Table References Found:** ${diagnosticData.cacheInfo.tableExists?.length || 0}\n`;
    summary += `- **Dependencies Found:** ${diagnosticData.cacheInfo.dependencies?.length || 0}\n`;
    summary += `- **Cached Queries Found:** ${diagnosticData.cacheInfo.cachedQueries?.length || 0}\n\n`;
  }
  
  // Add recommendations
  summary += `## Recommendations\n\n`;
  
  if (strategyRuleComplianceErrors.length > 0) {
    summary += `1. **Execute AGGRESSIVE_CACHE CLEAR**:\n`;
    summary += `   \`\`\`sql\n`;
    summary += `   DISCARD ALL;\n`;
    summary += `   ANALYZE;\n`;
    summary += `   RESET ALL;\n`;
    summary += `   \`\`\`\n\n`;
    
    summary += `2. **Try Fresh Client Approach**:\n`;
    summary += `   Create new Supabase client with unique headers for each request\n\n`;
    
    summary += `3. **Direct SQL Execution**:\n`;
    summary += `   Execute problematic queries directly in Supabase SQL Editor\n\n`;
  }
  
  return summary;
}

// Run diagnostics if this file is executed directly
if (require.main === module) {
  runDiagnostics().catch(console.error);
}

module.exports = { runDiagnostics, testCacheBehavior, checkDatabaseMetadata };