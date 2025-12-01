const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Load environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔍 IMPROVED DATABASE DIAGNOSTIC TOOL');
console.log('='.repeat(60));
console.log(`Timestamp: ${new Date().toISOString()}`);
console.log(`URL: ${supabaseUrl ? 'Set' : 'Missing'}`);
console.log(`Anon Key: ${supabaseAnonKey ? 'Set' : 'Missing'}`);
console.log(`Service Key: ${supabaseServiceKey ? 'Set' : 'Missing'}`);
console.log('='.repeat(60));

// Create clients for different authentication scenarios
const anonClient = supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;
const serviceClient = supabaseServiceKey ? createClient(supabaseUrl, supabaseServiceKey) : null;

const diagnosticResults = {
  timestamp: new Date().toISOString(),
  environment: {
    url: supabaseUrl ? 'Set' : 'Missing',
    anonKey: supabaseAnonKey ? 'Set' : 'Missing',
    serviceKey: supabaseServiceKey ? 'Set' : 'Missing'
  },
  tests: {},
  analysis: {
    complianceErrors: [],
    permissionErrors: [],
    cacheErrors: [],
    otherErrors: []
  }
};

// Helper function to log test results
function logTestResult(testName, success, details = {}) {
  console.log(`\n${success ? '✅' : '❌'} ${testName}`);
  if (details.error) {
    console.log(`   Error: ${details.error}`);
  }
  if (details.message) {
    console.log(`   Message: ${details.message}`);
  }
  if (details.data && details.data.length > 0) {
    console.log(`   Data: ${JSON.stringify(details.data, null, 2)}`);
  }
  
  diagnosticResults.tests[testName] = {
    success,
    ...details,
    timestamp: new Date().toISOString()
  };

  // Categorize errors for analysis
  if (!success && details.error) {
    if (details.error.includes('strategy_rule_compliance')) {
      diagnosticResults.analysis.complianceErrors.push({ test: testName, error: details.error });
    } else if (details.error.includes('permission') || details.error.includes('policy')) {
      diagnosticResults.analysis.permissionErrors.push({ test: testName, error: details.error });
    } else if (details.error.includes('schema cache') || details.error.includes('relationship')) {
      diagnosticResults.analysis.cacheErrors.push({ test: testName, error: details.error });
    } else {
      diagnosticResults.analysis.otherErrors.push({ test: testName, error: details.error });
    }
  }
}

// Test strategies table (this is where the main error occurs)
async function testStrategiesTable(client, clientType) {
  if (!client) {
    logTestResult(`${clientType} Strategies Query`, false, { error: 'Client not initialized' });
    return;
  }

  try {
    const { data: strategies, error: strategiesError } = await client
      .from('strategies')
      .select('id, name, user_id, is_active')
      .limit(5);

    if (strategiesError) {
      const hasComplianceError = strategiesError.message.includes('strategy_rule_compliance');
      const hasPermissionError = strategiesError.message.includes('permission') || strategiesError.message.includes('policy');
      const hasCacheError = strategiesError.message.includes('schema cache') || strategiesError.message.includes('relationship');
      
      logTestResult(`${clientType} Strategies Query`, false, { 
        error: strategiesError.message,
        hasComplianceError,
        hasPermissionError,
        hasCacheError,
        errorType: hasComplianceError ? 'COMPLIANCE' : hasPermissionError ? 'PERMISSION' : hasCacheError ? 'CACHE' : 'OTHER'
      });
    } else {
      logTestResult(`${clientType} Strategies Query`, true, { 
        message: `Found ${strategies.length} strategies`,
        data: strategies.map(s => ({ id: s.id, name: s.name, user_id: s.user_id, is_active: s.is_active }))
      });
    }
  } catch (error) {
    logTestResult(`${clientType} Strategies Query`, false, { error: error.message });
  }
}

// Test trades table (to see if it's strategy-specific)
async function testTradesTable(client, clientType) {
  if (!client) {
    logTestResult(`${clientType} Trades Query`, false, { error: 'Client not initialized' });
    return;
  }

  try {
    const { data: trades, error: tradesError } = await client
      .from('trades')
      .select('id, symbol, strategy_id')
      .limit(5);

    if (tradesError) {
      const hasComplianceError = tradesError.message.includes('strategy_rule_compliance');
      
      logTestResult(`${clientType} Trades Query`, false, { 
        error: tradesError.message,
        hasComplianceError,
        errorType: hasComplianceError ? 'COMPLIANCE' : 'OTHER'
      });
    } else {
      logTestResult(`${clientType} Trades Query`, true, { 
        message: `Found ${trades.length} trades`,
        data: trades.map(t => ({ id: t.id, symbol: t.symbol, strategy_id: t.strategy_id }))
      });
    }
  } catch (error) {
    logTestResult(`${clientType} Trades Query`, false, { error: error.message });
  }
}

// Test profiles table (should work for comparison)
async function testProfilesTable(client, clientType) {
  if (!client) {
    logTestResult(`${clientType} Profiles Query`, false, { error: 'Client not initialized' });
    return;
  }

  try {
    const { data: profiles, error: profilesError } = await client
      .from('profiles')
      .select('id, email')
      .limit(1);

    if (profilesError) {
      logTestResult(`${clientType} Profiles Query`, false, { error: profilesError.message });
    } else {
      logTestResult(`${clientType} Profiles Query`, true, { 
        message: `Found ${profiles.length} profiles`,
        data: profiles.map(p => ({ id: p.id, email: p.email }))
      });
    }
  } catch (error) {
    logTestResult(`${clientType} Profiles Query`, false, { error: error.message });
  }
}

// Test strategies with rules join (this likely triggers the compliance error)
async function testStrategiesJoin(client, clientType) {
  if (!client) {
    logTestResult(`${clientType} Strategies Join Query`, false, { error: 'Client not initialized' });
    return;
  }

  try {
    const { data: joinData, error: joinError } = await client
      .from('strategies')
      .select(`
        *,
        strategy_rules:strategy_id (
          id,
          rule_text,
          is_checked
        )
      `)
      .limit(5);

    if (joinError) {
      const hasComplianceError = joinError.message.includes('strategy_rule_compliance');
      const hasCacheError = joinError.message.includes('schema cache') || joinError.message.includes('relationship');
      
      logTestResult(`${clientType} Strategies Join Query`, false, { 
        error: joinError.message,
        hasComplianceError,
        hasCacheError,
        errorType: hasComplianceError ? 'COMPLIANCE' : hasCacheError ? 'CACHE' : 'OTHER'
      });
    } else {
      logTestResult(`${clientType} Strategies Join Query`, true, { 
        message: `Found ${joinData.length} strategies with rules`
      });
    }
  } catch (error) {
    logTestResult(`${clientType} Strategies Join Query`, false, { error: error.message });
  }
}

// Test complex query with multiple joins
async function testComplexJoin(client, clientType) {
  if (!client) {
    logTestResult(`${clientType} Complex Join Query`, false, { error: 'Client not initialized' });
    return;
  }

  try {
    const { data: complexData, error: complexError } = await client
      .from('trades')
      .select(`
        *,
        strategies:strategy_id (
          name,
          description,
          strategy_rules:strategy_id (
            id,
            rule_text,
            is_checked
          )
        )
      `)
      .limit(5);

    if (complexError) {
      const hasComplianceError = complexError.message.includes('strategy_rule_compliance');
      const hasCacheError = complexError.message.includes('schema cache') || complexError.message.includes('relationship');
      
      logTestResult(`${clientType} Complex Join Query`, false, { 
        error: complexError.message,
        hasComplianceError,
        hasCacheError,
        errorType: hasComplianceError ? 'COMPLIANCE' : hasCacheError ? 'CACHE' : 'OTHER'
      });
    } else {
      logTestResult(`${clientType} Complex Join Query`, true, { 
        message: `Found ${complexData.length} complex records`
      });
    }
  } catch (error) {
    logTestResult(`${clientType} Complex Join Query`, false, { error: error.message });
  }
}

// Test schema information (service role only)
async function testSchemaInformation(client) {
  if (!client) {
    logTestResult('Schema - Table Existence Check', false, { error: 'Service client not initialized' });
    return;
  }

  // Test table existence
  try {
    const { data: tables, error: tablesError } = await client
      .from('information_schema.tables')
      .select('table_name, table_schema')
      .eq('table_name', 'strategy_rule_compliance')
      .eq('table_schema', 'public');

    if (tablesError) {
      logTestResult('Schema - Table Existence Check', false, { error: tablesError.message });
    } else {
      const exists = tables && tables.length > 0;
      logTestResult('Schema - Table Existence Check', !exists, { 
        message: `Table ${exists ? 'EXISTS' : 'does not exist'}`,
        exists,
        data: tables
      });
    }
  } catch (error) {
    logTestResult('Schema - Table Existence Check', false, { error: error.message });
  }

  // Test for views referencing the table
  try {
    const { data: views, error: viewsError } = await client
      .from('information_schema.views')
      .select('table_name, view_definition')
      .like('view_definition', '%strategy_rule_compliance%');

    if (viewsError) {
      logTestResult('Schema - Views Check', false, { error: viewsError.message });
    } else {
      const hasViews = views && views.length > 0;
      logTestResult('Schema - Views Check', !hasViews, { 
        message: `Found ${hasViews ? views.length : 0} views referencing table`,
        hasViews,
        data: views
      });
    }
  } catch (error) {
    logTestResult('Schema - Views Check', false, { error: error.message });
  }

  // Test for RLS policies
  try {
    const { data: policies, error: policiesError } = await client
      .from('pg_policies')
      .select('policyname, tablename')
      .like('policyname', '%strategy_rule_compliance%');

    if (policiesError) {
      logTestResult('Schema - RLS Policies Check', false, { error: policiesError.message });
    } else {
      const hasPolicies = policies && policies.length > 0;
      logTestResult('Schema - RLS Policies Check', !hasPolicies, { 
        message: `Found ${hasPolicies ? policies.length : 0} RLS policies referencing table`,
        hasPolicies,
        data: policies
      });
    }
  } catch (error) {
    logTestResult('Schema - RLS Policies Check', false, { error: error.message });
  }
}

// Test authentication scenarios
async function testAuthenticationScenarios() {
  console.log('\n🔐 TESTING AUTHENTICATION SCENARIOS');
  console.log('='.repeat(40));

  // Test anon client
  console.log('\n📋 Testing with Anon Key (like the application uses):');
  await testStrategiesTable(anonClient, 'Anon');
  await testTradesTable(anonClient, 'Anon');
  await testProfilesTable(anonClient, 'Anon');
  await testStrategiesJoin(anonClient, 'Anon');
  await testComplexJoin(anonClient, 'Anon');

  // Test service role client
  console.log('\n📋 Testing with Service Role Key (full access):');
  await testStrategiesTable(serviceClient, 'Service');
  await testTradesTable(serviceClient, 'Service');
  await testProfilesTable(serviceClient, 'Service');
  await testStrategiesJoin(serviceClient, 'Service');
  await testComplexJoin(serviceClient, 'Service');
  await testSchemaInformation(serviceClient);
}

// Analyze results and provide diagnosis
function analyzeResults() {
  console.log('\n📊 DIAGNOSTIC ANALYSIS');
  console.log('='.repeat(40));

  const allTests = Object.values(diagnosticResults.tests);
  const failedTests = allTests.filter(test => !test.success);
  const { complianceErrors, permissionErrors, cacheErrors, otherErrors } = diagnosticResults.analysis;

  console.log(`\n📈 SUMMARY:`);
  console.log(`   Total tests: ${allTests.length}`);
  console.log(`   Passed: ${allTests.length - failedTests.length}`);
  console.log(`   Failed: ${failedTests.length}`);
  console.log(`   Compliance errors: ${complianceErrors.length}`);
  console.log(`   Permission errors: ${permissionErrors.length}`);
  console.log(`   Cache errors: ${cacheErrors.length}`);
  console.log(`   Other errors: ${otherErrors.length}`);

  console.log(`\n🔍 ROOT CAUSE ANALYSIS:`);

  if (complianceErrors.length > 0) {
    console.log(`\n🚨 PRIMARY ISSUE: strategy_rule_compliance references detected`);
    console.log(`   Evidence: ${complianceErrors.length} queries failed with compliance errors`);
    complianceErrors.forEach(test => {
      console.log(`   - ${test.test}: ${test.error}`);
    });
    console.log(`   Likely cause: Database schema cache still contains references to deleted table`);
    console.log(`   Recommended fix: Clear schema cache in Supabase SQL editor`);
  }

  if (permissionErrors.length > 0) {
    console.log(`\n🚨 SECONDARY ISSUE: Permission/RLS policy problems`);
    console.log(`   Evidence: ${permissionErrors.length} queries failed with permission errors`);
    permissionErrors.forEach(test => {
      console.log(`   - ${test.test}: ${test.error}`);
    });
    console.log(`   Likely cause: Missing or incorrect RLS policies on strategies table`);
    console.log(`   Recommended fix: Review and fix RLS policies`);
  }

  if (cacheErrors.length > 0) {
    console.log(`\n🚨 SECONDARY ISSUE: Schema cache/relationship problems`);
    console.log(`   Evidence: ${cacheErrors.length} queries failed with cache errors`);
    cacheErrors.forEach(test => {
      console.log(`   - ${test.test}: ${test.error}`);
    });
    console.log(`   Likely cause: Supabase schema cache is out of sync`);
    console.log(`   Recommended fix: Clear schema cache or refresh relationships`);
  }

  if (otherErrors.length > 0) {
    console.log(`\n🚨 OTHER ISSUES: Miscellaneous errors`);
    console.log(`   Evidence: ${otherErrors.length} queries failed with other errors`);
    otherErrors.forEach(test => {
      console.log(`   - ${test.test}: ${test.error}`);
    });
  }

  // Determine most likely causes
  console.log(`\n🎯 MOST LIKELY ROOT CAUSES (in order):`);
  
  if (complianceErrors.length > 0) {
    console.log(`   1. Schema cache references to deleted strategy_rule_compliance table`);
    console.log(`   2. Cached query plans containing the deleted table reference`);
  } else if (cacheErrors.length > 0) {
    console.log(`   1. Supabase schema cache corruption/out of sync`);
    console.log(`   2. Missing relationship definitions in schema cache`);
  } else if (permissionErrors.length > 0) {
    console.log(`   1. Missing or incorrect RLS policies on strategies table`);
    console.log(`   2. User permissions not properly configured`);
  } else {
    console.log(`   1. Connection/authentication issues`);
    console.log(`   2. Environment configuration problems`);
  }

  return {
    complianceErrors: complianceErrors.length,
    permissionErrors: permissionErrors.length,
    cacheErrors: cacheErrors.length,
    otherErrors: otherErrors.length,
    primaryCause: complianceErrors.length > 0 ? 'COMPLIANCE' : 
                  cacheErrors.length > 0 ? 'CACHE' : 
                  permissionErrors.length > 0 ? 'PERMISSION' : 'OTHER'
  };
}

// Main diagnostic function
async function runImprovedDiagnostic() {
  console.log('\n🚀 Starting improved database diagnostic...\n');

  try {
    await testAuthenticationScenarios();
    const analysis = analyzeResults();

    // Save results to file
    const fs = require('fs');
    const reportPath = `improved-database-diagnostic-${Date.now()}.json`;
    fs.writeFileSync(reportPath, JSON.stringify(diagnosticResults, null, 2));
    console.log(`\n💾 Detailed results saved to: ${reportPath}`);

    return { results: diagnosticResults, analysis };

  } catch (error) {
    console.error('\n❌ Diagnostic failed:', error);
    process.exit(1);
  }
}

// Execute the diagnostic
if (require.main === module) {
  runImprovedDiagnostic()
    .then(({ results, analysis }) => {
      console.log('\n✅ Improved diagnostic completed successfully');
      console.log('\n📋 RECOMMENDED NEXT STEPS:');
      
      if (analysis.primaryCause === 'COMPLIANCE') {
        console.log('1. Run schema cache clear in Supabase SQL editor');
        console.log('2. Execute: NOTIFY pgrst, \'reload schema\';');
        console.log('3. Test application functionality');
      } else if (analysis.primaryCause === 'CACHE') {
        console.log('1. Clear Supabase schema cache');
        console.log('2. Refresh table relationships');
        console.log('3. Restart application if needed');
      } else if (analysis.primaryCause === 'PERMISSION') {
        console.log('1. Review RLS policies on strategies table');
        console.log('2. Check user permissions');
        console.log('3. Fix any policy issues');
      } else {
        console.log('1. Check environment configuration');
        console.log('2. Verify API keys');
        console.log('3. Test basic connectivity');
      }
      
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Diagnostic failed:', error);
      process.exit(1);
    });
}

module.exports = { runImprovedDiagnostic };
