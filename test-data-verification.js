const testResults = {
  basicEndpointTest: null,
  statisticalAccuracyTest: null,
  dataCompletenessTest: null,
  errorHandlingTest: null,
  overallAssessment: null
};

async function testBasicEndpoint() {
  console.log('🔍 Testing basic "verify-data" API endpoint...');
  
  try {
    const response = await fetch('http://localhost:3000/api/generate-test-data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action: 'verify-data' })
    });

    const data = await response.json();
    
    if (response.status === 200) {
      console.log('✅ Basic endpoint test passed - Status 200');
      testResults.basicEndpointTest = {
        status: 'PASS',
        statusCode: response.status,
        hasData: !!data.verification,
        hasMessage: !!data.message
      };
      
      // Log the response structure
      console.log('📊 Response structure:');
      console.log('- Has verification object:', !!data.verification);
      console.log('- Has summary:', !!data.verification?.summary);
      console.log('- Has emotionDistribution:', !!data.verification?.emotionDistribution);
      console.log('- Has marketDistribution:', !!data.verification?.marketDistribution);
      console.log('- Has strategyDistribution:', !!data.verification?.strategyDistribution);
      
      return data.verification;
    } else {
      console.log('❌ Basic endpoint test failed - Status:', response.status);
      testResults.basicEndpointTest = {
        status: 'FAIL',
        statusCode: response.status,
        error: data.error || 'Unknown error'
      };
      return null;
    }
  } catch (error) {
    console.log('❌ Basic endpoint test failed with error:', error.message);
    testResults.basicEndpointTest = {
      status: 'FAIL',
      error: error.message
    };
    return null;
  }
}

function verifyStatisticalAccuracy(verificationData) {
  console.log('\n📈 Verifying statistical accuracy...');
  
  if (!verificationData) {
    console.log('❌ No verification data available for statistical testing');
    testResults.statisticalAccuracyTest = {
      status: 'FAIL',
      error: 'No verification data available'
    };
    return;
  }

  const { summary, emotionDistribution, marketDistribution, strategyDistribution } = verificationData;
  const issues = [];
  
  // Test 1: Win rate calculation
  if (summary.tradesWithPnL > 0) {
    const expectedWinRate = ((summary.winningTrades / summary.tradesWithPnL) * 100).toFixed(1);
    const actualWinRate = summary.winRate.toFixed(1);
    
    if (expectedWinRate !== actualWinRate) {
      issues.push(`Win rate mismatch: expected ${expectedWinRate}%, got ${actualWinRate}%`);
    } else {
      console.log('✅ Win rate calculation is accurate');
    }
  } else {
    console.log('⚠️ No trades with P&L to verify win rate');
  }
  
  // Test 2: Emotional state frequencies
  const totalEmotionCount = Object.values(emotionDistribution).reduce((sum, count) => sum + count, 0);
  if (totalEmotionCount === 0 && summary.totalTrades > 0) {
    issues.push('Emotional state distribution is empty but trades exist');
  } else {
    console.log('✅ Emotional state distribution calculated');
  }
  
  // Test 3: Strategy distribution
  const totalStrategyCount = Object.values(strategyDistribution).reduce((sum, count) => sum + count, 0);
  if (totalStrategyCount !== summary.totalTrades && summary.totalTrades > 0) {
    issues.push(`Strategy distribution count (${totalStrategyCount}) doesn't match total trades (${summary.totalTrades})`);
  } else {
    console.log('✅ Strategy distribution matches total trades');
  }
  
  // Test 4: Market distribution
  const totalMarketCount = Object.values(marketDistribution).reduce((sum, count) => sum + count, 0);
  if (totalMarketCount !== summary.totalTrades && summary.totalTrades > 0) {
    issues.push(`Market distribution count (${totalMarketCount}) doesn't match total trades (${summary.totalTrades})`);
  } else {
    console.log('✅ Market distribution matches total trades');
  }
  
  // Test 5: P&L calculation consistency
  const expectedPnLRange = summary.totalTrades > 0 ? 
    (summary.winningTrades * 50 - summary.losingTrades * 300) : 0;
  const maxExpectedPnL = summary.totalTrades > 0 ? 
    (summary.winningTrades * 500 - summary.losingTrades * 25) : 0;
    
  if (summary.totalPnL < expectedPnLRange || summary.totalPnL > maxExpectedPnL) {
    issues.push(`Total P&L ($${summary.totalPnL}) seems outside expected range ($${expectedPnLRange} to $${maxExpectedPnL})`);
  } else {
    console.log('✅ Total P&L within expected range');
  }
  
  if (issues.length > 0) {
    console.log('❌ Statistical accuracy issues found:');
    issues.forEach(issue => console.log(`  - ${issue}`));
    testResults.statisticalAccuracyTest = {
      status: 'FAIL',
      issues
    };
  } else {
    console.log('✅ All statistical accuracy tests passed');
    testResults.statisticalAccuracyTest = {
      status: 'PASS'
    };
  }
}

function verifyDataCompleteness(verificationData) {
  console.log('\n🔍 Testing data completeness and mapping...');
  
  if (!verificationData) {
    console.log('❌ No verification data available for completeness testing');
    testResults.dataCompletenessTest = {
      status: 'FAIL',
      error: 'No verification data available'
    };
    return;
  }

  const { summary, emotionDistribution, marketDistribution, strategyDistribution, trades } = verificationData;
  const issues = [];
  
  // Test 1: Required summary fields
  const requiredSummaryFields = [
    'totalTrades', 'tradesWithPnL', 'winningTrades', 'losingTrades', 
    'totalPnL', 'winRate', 'totalStrategies', 'activeStrategies'
  ];
  
  requiredSummaryFields.forEach(field => {
    if (summary[field] === undefined || summary[field] === null) {
      issues.push(`Missing required summary field: ${field}`);
    }
  });
  
  // Test 2: Trade sample structure
  if (trades && trades.length > 0) {
    const requiredTradeFields = ['id', 'symbol', 'market', 'pnl', 'strategyId', 'emotions'];
    trades.forEach((trade, index) => {
      requiredTradeFields.forEach(field => {
        if (trade[field] === undefined || trade[field] === null) {
          issues.push(`Trade ${index} missing required field: ${field}`);
        }
      });
    });
    console.log('✅ Trade sample structure is complete');
  } else {
    console.log('⚠️ No trade samples available for verification');
  }
  
  // Test 3: Emotional states mapping
  const expectedEmotions = ['CONFIDENT', 'FEARFUL', 'DISCIPLINED', 'IMPULSIVE', 'PATIENT', 'ANXIOUS', 'GREEDY', 'CALM'];
  const foundEmotions = Object.keys(emotionDistribution);
  const missingEmotions = expectedEmotions.filter(emotion => !foundEmotions.includes(emotion));
  
  if (missingEmotions.length > 0 && summary.totalTrades > 0) {
    console.log(`⚠️ Some expected emotions not found: ${missingEmotions.join(', ')}`);
  } else {
    console.log('✅ Emotional state mapping is complete');
  }
  
  // Test 4: Market distribution completeness
  const expectedMarkets = ['Stock', 'Crypto', 'Forex', 'Futures'];
  const foundMarkets = Object.keys(marketDistribution);
  const missingMarkets = expectedMarkets.filter(market => !foundMarkets.includes(market));
  
  if (missingMarkets.length > 0 && summary.totalTrades > 0) {
    console.log(`⚠️ Some expected markets not found: ${missingMarkets.join(', ')}`);
  } else {
    console.log('✅ Market distribution is complete');
  }
  
  // Test 5: Strategy name mapping
  if (Object.keys(strategyDistribution).length === 0 && summary.totalStrategies > 0) {
    issues.push('Strategy distribution is empty but strategies exist');
  } else {
    console.log('✅ Strategy name mapping is working');
  }
  
  if (issues.length > 0) {
    console.log('❌ Data completeness issues found:');
    issues.forEach(issue => console.log(`  - ${issue}`));
    testResults.dataCompletenessTest = {
      status: 'FAIL',
      issues
    };
  } else {
    console.log('✅ All data completeness tests passed');
    testResults.dataCompletenessTest = {
      status: 'PASS'
    };
  }
}

async function testErrorHandling() {
  console.log('\n🚨 Testing error handling scenarios...');
  
  const issues = [];
  
  // Test 1: Invalid action
  try {
    const response = await fetch('http://localhost:3000/api/generate-test-data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action: 'invalid-action' })
    });

    const data = await response.json();
    
    if (response.status !== 400) {
      issues.push(`Invalid action should return 400, got ${response.status}`);
    } else {
      console.log('✅ Invalid action properly handled with 400 status');
    }
    
    if (!data.error) {
      issues.push('Invalid action response should include error message');
    } else {
      console.log('✅ Invalid action response includes error message');
    }
  } catch (error) {
    issues.push(`Error testing invalid action: ${error.message}`);
  }
  
  // Test 2: Missing action
  try {
    const response = await fetch('http://localhost:3000/api/generate-test-data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({})
    });

    const data = await response.json();
    
    if (response.status !== 400) {
      issues.push(`Missing action should return 400, got ${response.status}`);
    } else {
      console.log('✅ Missing action properly handled with 400 status');
    }
  } catch (error) {
    issues.push(`Error testing missing action: ${error.message}`);
  }
  
  if (issues.length > 0) {
    console.log('❌ Error handling issues found:');
    issues.forEach(issue => console.log(`  - ${issue}`));
    testResults.errorHandlingTest = {
      status: 'FAIL',
      issues
    };
  } else {
    console.log('✅ All error handling tests passed');
    testResults.errorHandlingTest = {
      status: 'PASS'
    };
  }
}

async function runAllTests() {
  console.log('🧪 Starting comprehensive data verification tests...\n');
  
  // Test 1: Basic endpoint functionality
  const verificationData = await testBasicEndpoint();
  
  // Test 2: Statistical accuracy (only if we have data)
  if (verificationData) {
    verifyStatisticalAccuracy(verificationData);
    verifyDataCompleteness(verificationData);
  }
  
  // Test 3: Error handling
  await testErrorHandling();
  
  // Generate overall assessment
  const allTests = [
    testResults.basicEndpointTest,
    testResults.statisticalAccuracyTest,
    testResults.dataCompletenessTest,
    testResults.errorHandlingTest
  ];
  
  const passedTests = allTests.filter(test => test && test.status === 'PASS').length;
  const totalTests = allTests.filter(test => test).length;
  
  if (passedTests === totalTests) {
    testResults.overallAssessment = {
      status: 'PASS',
      message: `All ${totalTests} test categories passed successfully`,
      passedTests,
      totalTests
    };
  } else {
    testResults.overallAssessment = {
      status: 'FAIL',
      message: `${passedTests}/${totalTests} test categories passed`,
      passedTests,
      totalTests,
      failedTests: totalTests - passedTests
    };
  }
  
  console.log('\n📋 FINAL TEST RESULTS:');
  console.log('========================');
  console.log(`Overall Status: ${testResults.overallAssessment.status}`);
  console.log(`Tests Passed: ${testResults.overallAssessment.passedTests}/${testResults.overallAssessment.totalTests}`);
  
  if (verificationData) {
    console.log('\n📊 Verification Data Summary:');
    console.log(`- Total Trades: ${verificationData.summary.totalTrades}`);
    console.log(`- Win Rate: ${verificationData.summary.winRate}%`);
    console.log(`- Total P&L: $${verificationData.summary.totalPnL}`);
    console.log(`- Strategies: ${verificationData.summary.totalStrategies}`);
    console.log(`- Emotional States: ${Object.keys(verificationData.emotionDistribution).length}`);
    console.log(`- Markets: ${Object.keys(verificationData.marketDistribution).length}`);
  }
  
  // Save results to file
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const resultsFilename = `data-verification-test-results-${timestamp}.json`;
  
  try {
    const fs = require('fs');
    fs.writeFileSync(resultsFilename, JSON.stringify({
      timestamp: new Date().toISOString(),
      testResults,
      verificationData
    }, null, 2));
    console.log(`\n💾 Detailed results saved to: ${resultsFilename}`);
  } catch (error) {
    console.log(`\n⚠️ Could not save results file: ${error.message}`);
  }
  
  return testResults;
}

// Run the tests
runAllTests().then(results => {
  console.log('\n✅ Data verification testing completed!');
}).catch(error => {
  console.error('❌ Testing failed with error:', error);
});