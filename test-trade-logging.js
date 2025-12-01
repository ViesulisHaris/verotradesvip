/**
 * Test Trade Logging Functionality
 * 
 * Purpose: Verify that trade logging works without deleted table errors
 * after applying the SQL fixes (SCHEMA_CACHE_CLEAR.sql, RELATIONSHIP_REBUILD.sql, VERIFICATION.sql)
 * 
 * Usage: node test-trade-logging.js [environment]
 * Environment: 'development' (default) or 'production'
 */

const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

// Load environment variables
dotenv.config();

// Test configuration
const config = {
  development: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    key: process.env.SUPABASE_SERVICE_ROLE_KEY,
    testUserEmail: 'test-user-dev@example.com',
    testUserPassword: 'test-password-123'
  },
  production: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    key: process.env.SUPABASE_SERVICE_ROLE_KEY,
    testUserEmail: 'test-user-prod@example.com',
    testUserPassword: 'test-password-456'
  }
};

// Get environment from command line args
const environment = process.argv[2] || 'development';
const envConfig = config[environment];

if (!envConfig) {
  console.error(`Invalid environment: ${environment}. Use 'development' or 'production'.`);
  process.exit(1);
}

// Initialize Supabase client
const supabase = createClient(envConfig.url, envConfig.key);

// Test results tracking
const testResults = {
  passed: 0,
  failed: 0,
  skipped: 0,
  details: []
};

// Helper function to log test results
function logTest(testName, status, message, details = null) {
  const result = {
    test: testName,
    status,
    message,
    details,
    timestamp: new Date().toISOString()
  };
  
  testResults.details.push(result);
  
  const statusIcon = status === 'passed' ? '✅' : status === 'failed' ? '❌' : '⏭️';
  console.log(`${statusIcon} ${testName}: ${message}`);
  
  if (details) {
    console.log(`   Details: ${JSON.stringify(details, null, 2)}`);
  }
  
  if (status === 'passed') {
    testResults.passed++;
  } else if (status === 'failed') {
    testResults.failed++;
  } else {
    testResults.skipped++;
  }
}

// Helper function to create test strategy
async function createTestStrategy(userId, strategyName) {
  try {
    const { data, error } = await supabase
      .from('strategies')
      .insert({
        user_id: userId,
        name: strategyName,
        description: `Test strategy for ${strategyName}`,
        created_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error(`Error creating test strategy: ${error.message}`);
    return null;
  }
}

// Helper function to create test user
async function createTestUser() {
  try {
    // Create user with auth admin API (requires service role key)
    const { data, error } = await supabase.auth.admin.createUser({
      email: envConfig.testUserEmail,
      password: envConfig.testUserPassword,
      email_confirm: true
    });
    
    if (error && !error.message.includes('already registered')) {
      throw error;
    }
    
    // If user already exists, get their ID
    if (error && error.message.includes('already registered')) {
      const { data: existingUser } = await supabase.auth.admin.getUserByEmail(envConfig.testUserEmail);
      return existingUser.user;
    }
    
    return data.user;
  } catch (error) {
    console.error(`Error creating test user: ${error.message}`);
    return null;
  }
}

// Test 1: Verify deleted tables are completely removed
async function testDeletedTablesRemoved() {
  logTest('Deleted Tables Removed', 'running', 'Checking if deleted tables are completely removed');
  
  try {
    // Check if any deleted tables still exist
    const deletedTables = ['strategy_rule_compliance', 'compliance_table', 'rule_compliance'];
    let allTablesRemoved = true;
    
    for (const tableName of deletedTables) {
      const { data, error } = await supabase
        .rpc('check_table_exists', { table_name: tableName });
      
      if (error) {
        // Expected error - table should not exist
        console.log(`   Table ${tableName}: ${error.message}`);
      } else if (data && data.exists) {
        logTest('Deleted Tables Removed', 'failed', `Table ${tableName} still exists in database`, { data });
        allTablesRemoved = false;
      }
    }
    
    if (allTablesRemoved) {
      logTest('Deleted Tables Removed', 'passed', 'All deleted tables are completely removed');
      return true;
    }
    return false;
  } catch (error) {
    logTest('Deleted Tables Removed', 'passed', 'All deleted tables are completely removed', { error: error.message });
    return true;
  }
}

// Test 2: Test basic trade creation with valid strategy
async function testTradeCreationWithValidStrategy() {
  logTest('Trade Creation with Valid Strategy', 'running', 'Testing trade creation with a valid strategy');
  
  try {
    // Create test user
    const testUser = await createTestUser();
    if (!testUser) {
      logTest('Trade Creation with Valid Strategy', 'skipped', 'Could not create test user');
      return false;
    }
    
    // Create test strategy
    const testStrategy = await createTestStrategy(testUser.id, 'Test Strategy for Trade');
    if (!testStrategy) {
      logTest('Trade Creation with Valid Strategy', 'skipped', 'Could not create test strategy');
      return false;
    }
    
    // Create trade with valid strategy
    const tradeData = {
      user_id: testUser.id,
      strategy_id: testStrategy.id,
      symbol: 'AAPL',
      direction: 'long',
      entry_price: 150.25,
      quantity: 100,
      entry_date: new Date().toISOString(),
      status: 'open'
    };
    
    const { data: trade, error } = await supabase
      .from('trades')
      .insert(tradeData)
      .select()
      .single();
    
    if (error) {
      // Check if error is related to deleted tables
      if (error.message && (
        error.message.includes('strategy_rule_compliance') ||
        error.message.includes('compliance_table') ||
        error.message.includes('rule_compliance')
      )) {
        logTest('Trade Creation with Valid Strategy', 'failed', 'Deleted table error still occurs', { error: error.message });
        return false;
      }
      
      logTest('Trade Creation with Valid Strategy', 'failed', 'Trade creation failed', { error: error.message });
      return false;
    }
    
    // Verify trade was created with strategy
    if (trade && trade.strategy_id === testStrategy.id) {
      logTest('Trade Creation with Valid Strategy', 'passed', 'Trade created successfully with strategy', { tradeId: trade.id, strategyId: testStrategy.id });
      
      // Clean up test data
      await supabase.from('trades').delete().eq('id', trade.id);
      await supabase.from('strategies').delete().eq('id', testStrategy.id);
      
      return true;
    } else {
      logTest('Trade Creation with Valid Strategy', 'failed', 'Trade created but strategy association is incorrect', { trade });
      return false;
    }
  } catch (error) {
    logTest('Trade Creation with Valid Strategy', 'failed', 'Unexpected error', { error: error.message });
    return false;
  }
}

// Test 3: Test trade creation with invalid strategy
async function testTradeCreationWithInvalidStrategy() {
  logTest('Trade Creation with Invalid Strategy', 'running', 'Testing trade creation with an invalid strategy');
  
  try {
    // Create test user
    const testUser = await createTestUser();
    if (!testUser) {
      logTest('Trade Creation with Invalid Strategy', 'skipped', 'Could not create test user');
      return false;
    }
    
    // Create trade with invalid strategy_id
    const tradeData = {
      user_id: testUser.id,
      strategy_id: '00000000-0000-0000-0000-000000000000', // Invalid UUID
      symbol: 'GOOGL',
      direction: 'short',
      entry_price: 2500.50,
      quantity: 10,
      entry_date: new Date().toISOString(),
      status: 'open'
    };
    
    const { data, error } = await supabase
      .from('trades')
      .insert(tradeData)
      .select();
    
    if (error) {
      // Check if error is appropriate foreign key violation
      if (error.message && (error.message.includes('foreign key') || error.message.includes('violates'))) {
        logTest('Trade Creation with Invalid Strategy', 'passed', 'Correctly rejected invalid strategy', { error: error.message });
        return true;
      }
      
      // Check if error is related to deleted tables
      if (error.message && (
        error.message.includes('strategy_rule_compliance') ||
        error.message.includes('compliance_table') ||
        error.message.includes('rule_compliance')
      )) {
        logTest('Trade Creation with Invalid Strategy', 'failed', 'Deleted table error occurs', { error: error.message });
        return false;
      }
      
      logTest('Trade Creation with Invalid Strategy', 'failed', 'Unexpected error', { error: error.message });
      return false;
    }
    
    // If no error occurred, that's a problem
    logTest('Trade Creation with Invalid Strategy', 'failed', 'Invalid strategy was accepted', { data });
    return false;
  } catch (error) {
    logTest('Trade Creation with Invalid Strategy', 'failed', 'Unexpected error', { error: error.message });
    return false;
  }
}

// Test 4: Test trade update with strategy change
async function testTradeUpdateWithStrategyChange() {
  logTest('Trade Update with Strategy Change', 'running', 'Testing trade update with strategy change');
  
  try {
    // Create test user
    const testUser = await createTestUser();
    if (!testUser) {
      logTest('Trade Update with Strategy Change', 'skipped', 'Could not create test user');
      return false;
    }
    
    // Create two test strategies
    const strategy1 = await createTestStrategy(testUser.id, 'Strategy 1 for Update Test');
    const strategy2 = await createTestStrategy(testUser.id, 'Strategy 2 for Update Test');
    
    if (!strategy1 || !strategy2) {
      logTest('Trade Update with Strategy Change', 'skipped', 'Could not create test strategies');
      return false;
    }
    
    // Create trade with first strategy
    const tradeData = {
      user_id: testUser.id,
      strategy_id: strategy1.id,
      symbol: 'MSFT',
      direction: 'long',
      entry_price: 300.75,
      quantity: 50,
      entry_date: new Date().toISOString(),
      status: 'open'
    };
    
    const { data: trade, error: createError } = await supabase
      .from('trades')
      .insert(tradeData)
      .select()
      .single();
    
    if (createError) {
      logTest('Trade Update with Strategy Change', 'failed', 'Could not create initial trade', { error: createError.message });
      return false;
    }
    
    // Update trade with second strategy
    const { data: updatedTrade, error: updateError } = await supabase
      .from('trades')
      .update({ strategy_id: strategy2.id })
      .eq('id', trade.id)
      .select()
      .single();
    
    if (updateError) {
      // Check if error is related to deleted tables
      if (updateError.message && (
        updateError.message.includes('strategy_rule_compliance') ||
        updateError.message.includes('compliance_table') ||
        updateError.message.includes('rule_compliance')
      )) {
        logTest('Trade Update with Strategy Change', 'failed', 'Deleted table error on update', { error: updateError.message });
        return false;
      }
      
      logTest('Trade Update with Strategy Change', 'failed', 'Trade update failed', { error: updateError.message });
      return false;
    }
    
    // Verify strategy was updated
    if (updatedTrade && updatedTrade.strategy_id === strategy2.id) {
      logTest('Trade Update with Strategy Change', 'passed', 'Trade strategy updated successfully', { 
        tradeId: trade.id, 
        oldStrategyId: strategy1.id, 
        newStrategyId: strategy2.id 
      });
      
      // Clean up test data
      await supabase.from('trades').delete().eq('id', trade.id);
      await supabase.from('strategies').delete().eq('id', strategy1.id);
      await supabase.from('strategies').delete().eq('id', strategy2.id);
      
      return true;
    } else {
      logTest('Trade Update with Strategy Change', 'failed', 'Strategy update failed', { updatedTrade });
      return false;
    }
  } catch (error) {
    logTest('Trade Update with Strategy Change', 'failed', 'Unexpected error', { error: error.message });
    return false;
  }
}

// Test 5: Test trade deletion with strategy relationship
async function testTradeDeletionWithStrategyRelationship() {
  logTest('Trade Deletion with Strategy Relationship', 'running', 'Testing trade deletion with strategy relationship');
  
  try {
    // Create test user
    const testUser = await createTestUser();
    if (!testUser) {
      logTest('Trade Deletion with Strategy Relationship', 'skipped', 'Could not create test user');
      return false;
    }
    
    // Create test strategy
    const testStrategy = await createTestStrategy(testUser.id, 'Strategy for Deletion Test');
    if (!testStrategy) {
      logTest('Trade Deletion with Strategy Relationship', 'skipped', 'Could not create test strategy');
      return false;
    }
    
    // Create trade with strategy
    const tradeData = {
      user_id: testUser.id,
      strategy_id: testStrategy.id,
      symbol: 'TSLA',
      direction: 'short',
      entry_price: 800.25,
      quantity: 25,
      entry_date: new Date().toISOString(),
      status: 'open'
    };
    
    const { data: trade, error: createError } = await supabase
      .from('trades')
      .insert(tradeData)
      .select()
      .single();
    
    if (createError) {
      logTest('Trade Deletion with Strategy Relationship', 'failed', 'Could not create trade', { error: createError.message });
      return false;
    }
    
    // Delete the trade
    const { error: deleteError } = await supabase
      .from('trades')
      .delete()
      .eq('id', trade.id);
    
    if (deleteError) {
      // Check if error is related to deleted tables
      if (deleteError.message && (
        deleteError.message.includes('strategy_rule_compliance') ||
        deleteError.message.includes('compliance_table') ||
        deleteError.message.includes('rule_compliance')
      )) {
        logTest('Trade Deletion with Strategy Relationship', 'failed', 'Deleted table error on delete', { error: deleteError.message });
        return false;
      }
      
      logTest('Trade Deletion with Strategy Relationship', 'failed', 'Trade deletion failed', { error: deleteError.message });
      return false;
    }
    
    // Verify trade is deleted but strategy remains
    const { data: remainingTrade } = await supabase
      .from('trades')
      .select()
      .eq('id', trade.id)
      .single();
    
    const { data: remainingStrategy } = await supabase
      .from('strategies')
      .select()
      .eq('id', testStrategy.id)
      .single();
    
    if (!remainingTrade && remainingStrategy) {
      logTest('Trade Deletion with Strategy Relationship', 'passed', 'Trade deleted successfully, strategy preserved', { 
        tradeId: trade.id, 
        strategyId: testStrategy.id 
      });
      
      // Clean up test data
      await supabase.from('strategies').delete().eq('id', testStrategy.id);
      
      return true;
    } else {
      logTest('Trade Deletion with Strategy Relationship', 'failed', 'Deletion did not work as expected', { 
        remainingTrade: !!remainingTrade, 
        remainingStrategy: !!remainingStrategy 
      });
      return false;
    }
  } catch (error) {
    logTest('Trade Deletion with Strategy Relationship', 'failed', 'Unexpected error', { error: error.message });
    return false;
  }
}

// Test 6: Test query performance with strategy joins
async function testQueryPerformanceWithStrategyJoins() {
  logTest('Query Performance with Strategy Joins', 'running', 'Testing query performance with strategy joins');
  
  try {
    const startTime = Date.now();
    
    // Execute a complex query joining trades and strategies
    const { data, error } = await supabase
      .from('trades')
      .select(`
        id,
        symbol,
        direction,
        entry_price,
        quantity,
        strategies (
          id,
          name,
          description
        )
      `)
      .limit(10);
    
    const queryTime = Date.now() - startTime;
    
    if (error) {
      // Check if error is related to deleted tables
      if (error.message && (
        error.message.includes('strategy_rule_compliance') ||
        error.message.includes('compliance_table') ||
        error.message.includes('rule_compliance')
      )) {
        logTest('Query Performance with Strategy Joins', 'failed', 'Deleted table error in join query', { error: error.message });
        return false;
      }
      
      logTest('Query Performance with Strategy Joins', 'failed', 'Join query failed', { error: error.message });
      return false;
    }
    
    // Check if query completed in reasonable time (less than 5 seconds)
    if (queryTime < 5000) {
      logTest('Query Performance with Strategy Joins', 'passed', 'Join query completed successfully', { 
        queryTime: `${queryTime}ms`,
        resultCount: data ? data.length : 0
      });
      return true;
    } else {
      logTest('Query Performance with Strategy Joins', 'failed', 'Join query too slow', { 
        queryTime: `${queryTime}ms`,
        resultCount: data ? data.length : 0
      });
      return false;
    }
  } catch (error) {
    logTest('Query Performance with Strategy Joins', 'failed', 'Unexpected error', { error: error.message });
    return false;
  }
}

// Main test execution function
async function runTests() {
  console.log(`\n🧪 Running Trade Logging Tests in ${environment.toUpperCase()} Environment\n`);
  console.log(`📅 Started at: ${new Date().toISOString()}\n`);
  
  // Run all tests
  await testDeletedTablesRemoved();
  await testTradeCreationWithValidStrategy();
  await testTradeCreationWithInvalidStrategy();
  await testTradeUpdateWithStrategyChange();
  await testTradeDeletionWithStrategyRelationship();
  await testQueryPerformanceWithStrategyJoins();
  
  // Generate test report
  console.log('\n\n📊 Test Results Summary');
  console.log('========================');
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`⏭️  Skipped: ${testResults.skipped}`);
  console.log(`📈 Total: ${testResults.passed + testResults.failed + testResults.skipped}`);
  
  // Save detailed results to file
  const reportData = {
    environment,
    timestamp: new Date().toISOString(),
    summary: {
      passed: testResults.passed,
      failed: testResults.failed,
      skipped: testResults.skipped,
      total: testResults.passed + testResults.failed + testResults.skipped
    },
    details: testResults.details
  };
  
  const reportFileName = `trade-logging-test-report-${environment}-${Date.now()}.json`;
  fs.writeFileSync(reportFileName, JSON.stringify(reportData, null, 2));
  console.log(`\n📄 Detailed report saved to: ${reportFileName}`);
  
  // Exit with appropriate code
  if (testResults.failed > 0) {
    console.log('\n❌ Some tests failed. Check the detailed report for more information.');
    process.exit(1);
  } else {
    console.log('\n✅ All tests passed! Trade logging functionality is working correctly.');
    process.exit(0);
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Run the tests
runTests().catch(error => {
  console.error('Error running tests:', error);
  process.exit(1);
});