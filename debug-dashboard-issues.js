/**
 * Diagnostic script to identify dashboard issues
 * Tests API endpoints and identifies root causes of stats disappearing
 */

// Use built-in fetch (Node.js 18+)

// Configuration
const BASE_URL = 'http://localhost:3000';
const TEST_TOKEN = process.env.TEST_AUTH_TOKEN || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZlcm90cmFkZXN2aXAiLCJpYXQiOjE3MzY0MDA2MDcsImV4cCI6MjA1MTk3NjYwN30.C3cHr1T8gN8l9nQz7kYJN2QzRQd6W5X8gK9F2L7qM4';

async function testEndpoint(name, url, options = {}) {
  console.log(`\n🔍 Testing ${name}...`);
  console.log(`URL: ${url}`);
  
  const startTime = Date.now();
  
  try {
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`,
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });
    
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    console.log(`Status: ${response.status} ${response.statusText}`);
    console.log(`Response Time: ${responseTime}ms`);
    console.log(`Headers:`, JSON.stringify(Object.fromEntries(response.headers), null, 2));
    
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ ${name} - SUCCESS`);
      console.log(`Data keys:`, Object.keys(data));
      
      if (data.trades) {
        console.log(`Trades count: ${data.trades.length}`);
      }
      if (data.totalTrades !== undefined) {
        console.log(`Total trades: ${data.totalTrades}`);
      }
      if (data.emotionalData) {
        console.log(`Emotional data count: ${data.emotionalData.length}`);
      }
      if (data.validationWarnings) {
        console.log(`Validation warnings: ${data.validationWarnings.length}`);
        data.validationWarnings.forEach((warning, i) => {
          console.log(`  ${i + 1}. ${warning}`);
        });
      }
      
      return { success: true, data, responseTime };
    } else {
      const errorText = await response.text();
      console.log(`❌ ${name} - FAILED`);
      console.log(`Error: ${errorText}`);
      return { success: false, error: errorText, responseTime };
    }
  } catch (error) {
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    console.log(`💥 ${name} - ERROR`);
    console.log(`Error: ${error.message}`);
    return { success: false, error: error.message, responseTime };
  }
}

async function diagnoseDashboardIssues() {
  console.log('🚀 Starting Dashboard Issues Diagnosis');
  console.log('=====================================');
  
  // Test 1: Check if server is running
  console.log('\n📡 Checking server connectivity...');
  try {
    const response = await fetch(`${BASE_URL}/api/health`);
    if (response.ok) {
      console.log('✅ Server is running');
    } else {
      console.log('⚠️ Server may have issues');
    }
  } catch (error) {
    console.log('❌ Server is not accessible');
    console.log(`Error: ${error.message}`);
    return;
  }
  
  // Test 2: Test confluence-stats endpoint
  const statsResult = await testEndpoint(
    'Confluence Stats API',
    `${BASE_URL}/api/confluence-stats`
  );
  
  // Test 3: Test confluence-trades endpoint (the one causing 404s)
  const tradesResult = await testEndpoint(
    'Confluence Trades API (Recent)',
    `${BASE_URL}/api/confluence-trades?limit=5&sortBy=trade_date&sortOrder=desc`
  );
  
  // Test 4: Test confluence-trades with larger limit
  const allTradesResult = await testEndpoint(
    'Confluence Trades API (All)',
    `${BASE_URL}/api/confluence-trades?limit=2000&sortBy=trade_date&sortOrder=asc`
  );
  
  // Analysis
  console.log('\n📊 Analysis Results');
  console.log('==================');
  
  // Check response times
  console.log('\n⏱️ Response Time Analysis:');
  console.log(`Confluence Stats: ${statsResult.responseTime}ms`);
  console.log(`Recent Trades: ${tradesResult.responseTime}ms`);
  console.log(`All Trades: ${allTradesResult.responseTime}ms`);
  
  if (statsResult.responseTime > 500) {
    console.log('⚠️ Confluence Stats API is SLOW (>500ms)');
  }
  
  if (tradesResult.responseTime > 500) {
    console.log('⚠️ Recent Trades API is SLOW (>500ms)');
  }
  
  if (allTradesResult.responseTime > 500) {
    console.log('⚠️ All Trades API is SLOW (>500ms)');
  }
  
  // Check for 404 errors
  console.log('\n🔍 404 Error Analysis:');
  if (!tradesResult.success && tradesResult.error.includes('404')) {
    console.log('❌ CONFIRMED: /api/confluence-trades endpoint returning 404');
  } else {
    console.log('✅ /api/confluence-trades endpoint is accessible');
  }
  
  // Check for validation failures
  console.log('\n🚨 Validation Analysis:');
  if (statsResult.data && statsResult.data.validationWarnings) {
    console.log(`⚠️ Confluence Stats has ${statsResult.data.validationWarnings.length} validation warnings`);
  }
  
  // Check data availability
  console.log('\n📈 Data Availability Analysis:');
  if (statsResult.success) {
    console.log(`✅ Stats API returning data`);
    console.log(`   - Total trades: ${statsResult.data.totalTrades || 0}`);
    console.log(`   - Emotional data points: ${statsResult.data.emotionalData?.length || 0}`);
  } else {
    console.log('❌ Stats API not returning data');
  }
  
  if (tradesResult.success) {
    console.log(`✅ Recent trades API returning data`);
    console.log(`   - Trades returned: ${tradesResult.data.trades?.length || 0}`);
  } else {
    console.log('❌ Recent trades API not returning data');
  }
  
  // Root cause analysis
  console.log('\n🔬 Root Cause Analysis');
  console.log('=====================');
  
  const issues = [];
  
  if (!tradesResult.success) {
    issues.push('404 errors from /api/confluence-trades endpoint');
  }
  
  if (statsResult.responseTime > 500) {
    issues.push('Slow API response times from confluence-stats');
  }
  
  if (!statsResult.success) {
    issues.push('Confluence-stats API failures');
  }
  
  if (statsResult.data && statsResult.data.totalTrades === 0) {
    issues.push('No trade data available');
  }
  
  if (issues.length > 0) {
    console.log('\n🚨 IDENTIFIED ISSUES:');
    issues.forEach((issue, i) => {
      console.log(`   ${i + 1}. ${issue}`);
    });
  } else {
    console.log('\n✅ No critical issues detected');
  }
  
  // Recommendations
  console.log('\n💡 RECOMMENDATIONS');
  console.log('=================');
  
  if (!tradesResult.success) {
    console.log('1. Fix the /api/confluence-trades endpoint routing');
    console.log('2. Check if the route file exists and is properly exported');
  }
  
  if (statsResult.responseTime > 500) {
    console.log('3. Optimize confluence-stats API performance');
    console.log('4. Consider implementing caching for expensive calculations');
    console.log('5. Review validation logic that might be causing delays');
  }
  
  if (statsResult.data && statsResult.data.validationWarnings && statsResult.data.validationWarnings.length > 0) {
    console.log('6. Address validation warnings in psychological metrics');
    console.log('7. Review the validation thresholds in DEFAULT_VALIDATION_CONFIG');
  }
  
  console.log('\n🏁 Diagnosis Complete');
}

// Run the diagnosis
diagnoseDashboardIssues().catch(console.error);