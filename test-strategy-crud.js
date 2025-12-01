/**
 * Test Strategy CRUD Operations
 * 
 * Purpose: Verify that strategy create, read, update, and delete operations work correctly
 * after applying the SQL fixes (SCHEMA_CACHE_CLEAR.sql, RELATIONSHIP_REBUILD.sql, VERIFICATION.sql)
 * 
 * Usage: node test-strategy-crud.js [environment]
 * Environment: 'development' (default) or 'production'
 */

const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

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

// Helper function to create test user with different email
async function createAdditionalTestUser(emailSuffix) {
  const email = `test-user-${emailSuffix}-${environment}@example.com`;
  const password = `test-password-${emailSuffix}`;
  
  try {
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    });
    
    if (error && !error.message.includes('already registered')) {
      throw error;
    }
    
    // If user already exists, get their ID
    if (error && error.message.includes('already registered')) {
      const { data: existingUser } = await supabase.auth.admin.getUserByEmail(email);
      return existingUser.user;
    }
    
    return data.user;
  } catch (error) {
    console.error(`Error creating additional test user: ${error.message}`);
    return null;
  }
}

// Test 1: Verify strategies table structure
async function testStrategiesTableStructure() {
  logTest('Strategies Table Structure', 'running', 'Checking strategies table structure');
  
  try {
    // Check if strategies table exists
    const { data, error } = await supabase
      .from('strategies')
      .select('*')
      .limit(1);
    
    if (error) {
      // Check if error is related to strategy_rule_compliance
      if (error.message && error.message.includes('strategy_rule_compliance')) {
        logTest('Strategies Table Structure', 'failed', 'strategy_rule_compliance error when accessing strategies', { error: error.message });
        return false;
      }
      
      logTest('Strategies Table Structure', 'failed', 'Could not access strategies table', { error: error.message });
      return false;
    }
    
    // Check table structure
    const { data: columns, error: columnError } = await supabase
      .rpc('get_table_columns', { table_name: 'strategies' });
    
    if (columnError) {
      logTest('Strategies Table Structure', 'failed', 'Could not get table columns', { error: columnError.message });
      return false;
    }
    
    // Verify required columns exist
    const requiredColumns = ['id', 'user_id', 'name', 'description', 'created_at', 'updated_at'];
    const foundColumns = columns ? columns.map(col => col.column_name) : [];
    const missingColumns = requiredColumns.filter(col => !foundColumns.includes(col));
    
    if (missingColumns.length > 0) {
      logTest('Strategies Table Structure', 'failed', 'Missing required columns', { missingColumns, foundColumns });
      return false;
    }
    
    logTest('Strategies Table Structure', 'passed', 'Strategies table structure is correct', { columns: foundColumns });
    return true;
  } catch (error) {
    logTest('Strategies Table Structure', 'failed', 'Unexpected error', { error: error.message });
    return false;
  }
}

// Test 2: Create strategy
async function testCreateStrategy() {
  logTest('Create Strategy', 'running', 'Testing strategy creation');
  
  try {
    // Create test user
    const testUser = await createTestUser();
    if (!testUser) {
      logTest('Create Strategy', 'skipped', 'Could not create test user');
      return false;
    }
    
    // Create strategy
    const strategyData = {
      user_id: testUser.id,
      name: 'Test Strategy for CRUD',
      description: 'This is a test strategy for CRUD operations',
      created_at: new Date().toISOString()
    };
    
    const { data: strategy, error } = await supabase
      .from('strategies')
      .insert(strategyData)
      .select()
      .single();
    
    if (error) {
      // Check if error is related to strategy_rule_compliance
      if (error.message && error.message.includes('strategy_rule_compliance')) {
        logTest('Create Strategy', 'failed', 'strategy_rule_compliance error when creating strategy', { error: error.message });
        return false;
      }
      
      logTest('Create Strategy', 'failed', 'Strategy creation failed', { error: error.message });
      return false;
    }
    
    // Verify strategy was created correctly
    if (strategy && 
        strategy.user_id === testUser.id && 
        strategy.name === strategyData.name && 
        strategy.description === strategyData.description) {
      
      logTest('Create Strategy', 'passed', 'Strategy created successfully', { 
        strategyId: strategy.id,
        userId: testUser.id
      });
      
      // Clean up test data
      await supabase.from('strategies').delete().eq('id', strategy.id);
      
      return true;
    } else {
      logTest('Create Strategy', 'failed', 'Strategy created but data is incorrect', { strategy });
      return false;
    }
  } catch (error) {
    logTest('Create Strategy', 'failed', 'Unexpected error', { error: error.message });
    return false;
  }
}

// Test 3: Read strategy
async function testReadStrategy() {
  logTest('Read Strategy', 'running', 'Testing strategy reading');
  
  try {
    // Create test user
    const testUser = await createTestUser();
    if (!testUser) {
      logTest('Read Strategy', 'skipped', 'Could not create test user');
      return false;
    }
    
    // Create strategy for reading
    const strategyData = {
      user_id: testUser.id,
      name: 'Test Strategy for Reading',
      description: 'This is a test strategy for reading operations',
      created_at: new Date().toISOString()
    };
    
    const { data: createdStrategy, error: createError } = await supabase
      .from('strategies')
      .insert(strategyData)
      .select()
      .single();
    
    if (createError) {
      logTest('Read Strategy', 'skipped', 'Could not create test strategy', { error: createError.message });
      return false;
    }
    
    // Read the strategy
    const { data: readStrategy, error: readError } = await supabase
      .from('strategies')
      .select('*')
      .eq('id', createdStrategy.id)
      .single();
    
    if (readError) {
      // Check if error is related to strategy_rule_compliance
      if (readError.message && readError.message.includes('strategy_rule_compliance')) {
        logTest('Read Strategy', 'failed', 'strategy_rule_compliance error when reading strategy', { error: readError.message });
        return false;
      }
      
      logTest('Read Strategy', 'failed', 'Strategy reading failed', { error: readError.message });
      return false;
    }
    
    // Verify strategy was read correctly
    if (readStrategy && 
        readStrategy.id === createdStrategy.id && 
        readStrategy.user_id === testUser.id && 
        readStrategy.name === strategyData.name) {
      
      logTest('Read Strategy', 'passed', 'Strategy read successfully', { 
        strategyId: createdStrategy.id,
        userId: testUser.id
      });
      
      // Clean up test data
      await supabase.from('strategies').delete().eq('id', createdStrategy.id);
      
      return true;
    } else {
      logTest('Read Strategy', 'failed', 'Strategy read but data is incorrect', { readStrategy });
      return false;
    }
  } catch (error) {
    logTest('Read Strategy', 'failed', 'Unexpected error', { error: error.message });
    return false;
  }
}

// Test 4: Update strategy
async function testUpdateStrategy() {
  logTest('Update Strategy', 'running', 'Testing strategy updating');
  
  try {
    // Create test user
    const testUser = await createTestUser();
    if (!testUser) {
      logTest('Update Strategy', 'skipped', 'Could not create test user');
      return false;
    }
    
    // Create strategy for updating
    const strategyData = {
      user_id: testUser.id,
      name: 'Test Strategy for Updating',
      description: 'This is a test strategy for updating operations',
      created_at: new Date().toISOString()
    };
    
    const { data: createdStrategy, error: createError } = await supabase
      .from('strategies')
      .insert(strategyData)
      .select()
      .single();
    
    if (createError) {
      logTest('Update Strategy', 'skipped', 'Could not create test strategy', { error: createError.message });
      return false;
    }
    
    // Update the strategy
    const updatedData = {
      name: 'Updated Test Strategy',
      description: 'This strategy has been updated'
    };
    
    const { data: updatedStrategy, error: updateError } = await supabase
      .from('strategies')
      .update(updatedData)
      .eq('id', createdStrategy.id)
      .select()
      .single();
    
    if (updateError) {
      // Check if error is related to strategy_rule_compliance
      if (updateError.message && updateError.message.includes('strategy_rule_compliance')) {
        logTest('Update Strategy', 'failed', 'strategy_rule_compliance error when updating strategy', { error: updateError.message });
        return false;
      }
      
      logTest('Update Strategy', 'failed', 'Strategy update failed', { error: updateError.message });
      return false;
    }
    
    // Verify strategy was updated correctly
    if (updatedStrategy && 
        updatedStrategy.id === createdStrategy.id && 
        updatedStrategy.user_id === testUser.id && 
        updatedStrategy.name === updatedData.name && 
        updatedStrategy.description === updatedData.description) {
      
      logTest('Update Strategy', 'passed', 'Strategy updated successfully', { 
        strategyId: createdStrategy.id,
        userId: testUser.id
      });
      
      // Clean up test data
      await supabase.from('strategies').delete().eq('id', createdStrategy.id);
      
      return true;
    } else {
      logTest('Update Strategy', 'failed', 'Strategy updated but data is incorrect', { updatedStrategy });
      return false;
    }
  } catch (error) {
    logTest('Update Strategy', 'failed', 'Unexpected error', { error: error.message });
    return false;
  }
}

// Test 5: Delete strategy
async function testDeleteStrategy() {
  logTest('Delete Strategy', 'running', 'Testing strategy deletion');
  
  try {
    // Create test user
    const testUser = await createTestUser();
    if (!testUser) {
      logTest('Delete Strategy', 'skipped', 'Could not create test user');
      return false;
    }
    
    // Create strategy for deletion
    const strategyData = {
      user_id: testUser.id,
      name: 'Test Strategy for Deletion',
      description: 'This is a test strategy for deletion operations',
      created_at: new Date().toISOString()
    };
    
    const { data: createdStrategy, error: createError } = await supabase
      .from('strategies')
      .insert(strategyData)
      .select()
      .single();
    
    if (createError) {
      logTest('Delete Strategy', 'skipped', 'Could not create test strategy', { error: createError.message });
      return false;
    }
    
    // Delete the strategy
    const { error: deleteError } = await supabase
      .from('strategies')
      .delete()
      .eq('id', createdStrategy.id);
    
    if (deleteError) {
      // Check if error is related to strategy_rule_compliance
      if (deleteError.message && deleteError.message.includes('strategy_rule_compliance')) {
        logTest('Delete Strategy', 'failed', 'strategy_rule_compliance error when deleting strategy', { error: deleteError.message });
        return false;
      }
      
      logTest('Delete Strategy', 'failed', 'Strategy deletion failed', { error: deleteError.message });
      return false;
    }
    
    // Verify strategy was deleted
    const { data: deletedStrategy } = await supabase
      .from('strategies')
      .select('*')
      .eq('id', createdStrategy.id)
      .single();
    
    if (!deletedStrategy) {
      logTest('Delete Strategy', 'passed', 'Strategy deleted successfully', { 
        strategyId: createdStrategy.id,
        userId: testUser.id
      });
      
      return true;
    } else {
      logTest('Delete Strategy', 'failed', 'Strategy still exists after deletion', { deletedStrategy });
      return false;
    }
  } catch (error) {
    logTest('Delete Strategy', 'failed', 'Unexpected error', { error: error.message });
    return false;
  }
}

// Test 6: List user strategies
async function testListUserStrategies() {
  logTest('List User Strategies', 'running', 'Testing listing user strategies');
  
  try {
    // Create test user
    const testUser = await createTestUser();
    if (!testUser) {
      logTest('List User Strategies', 'skipped', 'Could not create test user');
      return false;
    }
    
    // Create multiple strategies for the user
    const strategyCount = 3;
    const createdStrategies = [];
    
    for (let i = 0; i < strategyCount; i++) {
      const strategyData = {
        user_id: testUser.id,
        name: `Test Strategy ${i + 1} for Listing`,
        description: `This is test strategy ${i + 1} for listing operations`,
        created_at: new Date().toISOString()
      };
      
      const { data: strategy, error } = await supabase
        .from('strategies')
        .insert(strategyData)
        .select()
        .single();
      
      if (error) {
        logTest('List User Strategies', 'skipped', `Could not create test strategy ${i + 1}`, { error: error.message });
        // Clean up any created strategies
        for (const s of createdStrategies) {
          await supabase.from('strategies').delete().eq('id', s.id);
        }
        return false;
      }
      
      createdStrategies.push(strategy);
    }
    
    // List the user's strategies
    const { data: userStrategies, error } = await supabase
      .from('strategies')
      .select('*')
      .eq('user_id', testUser.id)
      .order('created_at', { ascending: true });
    
    if (error) {
      // Check if error is related to strategy_rule_compliance
      if (error.message && error.message.includes('strategy_rule_compliance')) {
        logTest('List User Strategies', 'failed', 'strategy_rule_compliance error when listing strategies', { error: error.message });
        return false;
      }
      
      logTest('List User Strategies', 'failed', 'Strategy listing failed', { error: error.message });
      return false;
    }
    
    // Verify all user strategies are listed
    if (userStrategies && userStrategies.length === strategyCount) {
      logTest('List User Strategies', 'passed', 'User strategies listed successfully', { 
        userId: testUser.id,
        strategyCount: userStrategies.length
      });
      
      // Clean up test data
      for (const strategy of createdStrategies) {
        await supabase.from('strategies').delete().eq('id', strategy.id);
      }
      
      return true;
    } else {
      logTest('List User Strategies', 'failed', 'Incorrect number of strategies listed', { 
        expected: strategyCount,
        actual: userStrategies ? userStrategies.length : 0
      });
      return false;
    }
  } catch (error) {
    logTest('List User Strategies', 'failed', 'Unexpected error', { error: error.message });
    return false;
  }
}

// Test 7: Strategy with trades relationship
async function testStrategyWithTradesRelationship() {
  logTest('Strategy with Trades Relationship', 'running', 'Testing strategy-trades relationship');
  
  try {
    // Create test user
    const testUser = await createTestUser();
    if (!testUser) {
      logTest('Strategy with Trades Relationship', 'skipped', 'Could not create test user');
      return false;
    }
    
    // Create strategy
    const strategyData = {
      user_id: testUser.id,
      name: 'Test Strategy for Relationship',
      description: 'This is a test strategy for relationship testing',
      created_at: new Date().toISOString()
    };
    
    const { data: strategy, error: strategyError } = await supabase
      .from('strategies')
      .insert(strategyData)
      .select()
      .single();
    
    if (strategyError) {
      logTest('Strategy with Trades Relationship', 'skipped', 'Could not create test strategy', { error: strategyError.message });
      return false;
    }
    
    // Create trades for the strategy
    const tradeCount = 2;
    const createdTrades = [];
    
    for (let i = 0; i < tradeCount; i++) {
      const tradeData = {
        user_id: testUser.id,
        strategy_id: strategy.id,
        symbol: `TEST${i + 1}`,
        direction: i % 2 === 0 ? 'long' : 'short',
        entry_price: 100 + (i * 10),
        quantity: 10 + (i * 5),
        entry_date: new Date().toISOString(),
        status: 'open'
      };
      
      const { data: trade, error } = await supabase
        .from('trades')
        .insert(tradeData)
        .select()
        .single();
      
      if (error) {
        logTest('Strategy with Trades Relationship', 'skipped', `Could not create test trade ${i + 1}`, { error: error.message });
        // Clean up
        await supabase.from('strategies').delete().eq('id', strategy.id);
        for (const t of createdTrades) {
          await supabase.from('trades').delete().eq('id', t.id);
        }
        return false;
      }
      
      createdTrades.push(trade);
    }
    
    // Query strategy with related trades
    const { data: strategyWithTrades, error: queryError } = await supabase
      .from('strategies')
      .select(`
        *,
        trades (
          id,
          symbol,
          direction,
          entry_price,
          quantity
        )
      `)
      .eq('id', strategy.id)
      .single();
    
    if (queryError) {
      // Check if error is related to strategy_rule_compliance
      if (queryError.message && queryError.message.includes('strategy_rule_compliance')) {
        logTest('Strategy with Trades Relationship', 'failed', 'strategy_rule_compliance error in relationship query', { error: queryError.message });
        return false;
      }
      
      logTest('Strategy with Trades Relationship', 'failed', 'Strategy-trades relationship query failed', { error: queryError.message });
      return false;
    }
    
    // Verify relationship works correctly
    if (strategyWithTrades && 
        strategyWithTrades.id === strategy.id && 
        strategyWithTrades.trades && 
        strategyWithTrades.trades.length === tradeCount) {
      
      logTest('Strategy with Trades Relationship', 'passed', 'Strategy-trades relationship works correctly', { 
        strategyId: strategy.id,
        tradeCount: strategyWithTrades.trades.length
      });
      
      // Clean up test data
      for (const trade of createdTrades) {
        await supabase.from('trades').delete().eq('id', trade.id);
      }
      await supabase.from('strategies').delete().eq('id', strategy.id);
      
      return true;
    } else {
      logTest('Strategy with Trades Relationship', 'failed', 'Strategy-trades relationship query returned incorrect data', { 
        strategyId: strategy.id,
        expectedTradeCount: tradeCount,
        actualTradeCount: strategyWithTrades ? (strategyWithTrades.trades ? strategyWithTrades.trades.length : 0) : 0
      });
      return false;
    }
  } catch (error) {
    logTest('Strategy with Trades Relationship', 'failed', 'Unexpected error', { error: error.message });
    return false;
  }
}

// Test 8: Strategy validation
async function testStrategyValidation() {
  logTest('Strategy Validation', 'running', 'Testing strategy validation rules');
  
  try {
    // Create test user
    const testUser = await createTestUser();
    if (!testUser) {
      logTest('Strategy Validation', 'skipped', 'Could not create test user');
      return false;
    }
    
    let validationTestsPassed = 0;
    const totalValidationTests = 3;
    
    // Test 1: Strategy without name
    const { error: noNameError } = await supabase
      .from('strategies')
      .insert({
        user_id: testUser.id,
        description: 'Strategy without name'
      });
    
    if (noNameError) {
      validationTestsPassed++;
    } else {
      logTest('Strategy Validation', 'failed', 'Strategy without name was accepted');
    }
    
    // Test 2: Strategy without user_id
    const { error: noUserIdError } = await supabase
      .from('strategies')
      .insert({
        name: 'Strategy without user_id',
        description: 'Strategy without user_id'
      });
    
    if (noUserIdError) {
      validationTestsPassed++;
    } else {
      logTest('Strategy Validation', 'failed', 'Strategy without user_id was accepted');
    }
    
    // Test 3: Valid strategy
    const { data: validStrategy, error: validError } = await supabase
      .from('strategies')
      .insert({
        user_id: testUser.id,
        name: 'Valid Strategy',
        description: 'This is a valid strategy'
      })
      .select()
      .single();
    
    if (validError) {
      logTest('Strategy Validation', 'failed', 'Valid strategy was rejected', { error: validError.message });
    } else {
      validationTestsPassed++;
      
      // Clean up valid strategy
      await supabase.from('strategies').delete().eq('id', validStrategy.id);
    }
    
    // Check if all validation tests passed
    if (validationTestsPassed === totalValidationTests) {
      logTest('Strategy Validation', 'passed', 'All validation rules work correctly');
      return true;
    } else {
      logTest('Strategy Validation', 'failed', 'Some validation rules failed', { 
        passed: validationTestsPassed,
        total: totalValidationTests
      });
      return false;
    }
  } catch (error) {
    logTest('Strategy Validation', 'failed', 'Unexpected error', { error: error.message });
    return false;
  }
}

// Main test execution function
async function runTests() {
  console.log(`\n🧪 Running Strategy CRUD Tests in ${environment.toUpperCase()} Environment\n`);
  console.log(`📅 Started at: ${new Date().toISOString()}\n`);
  
  // Run all tests
  await testStrategiesTableStructure();
  await testCreateStrategy();
  await testReadStrategy();
  await testUpdateStrategy();
  await testDeleteStrategy();
  await testListUserStrategies();
  await testStrategyWithTradesRelationship();
  await testStrategyValidation();
  
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
  
  const reportFileName = `strategy-crud-test-report-${environment}-${Date.now()}.json`;
  fs.writeFileSync(reportFileName, JSON.stringify(reportData, null, 2));
  console.log(`\n📄 Detailed report saved to: ${reportFileName}`);
  
  // Exit with appropriate code
  if (testResults.failed > 0) {
    console.log('\n❌ Some tests failed. Check the detailed report for more information.');
    process.exit(1);
  } else {
    console.log('\n✅ All tests passed! Strategy CRUD operations are working correctly.');
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