/**
 * Test End-to-End Workflow
 * 
 * Purpose: Verify that complete user workflows function correctly
 * after applying the SQL fixes (SCHEMA_CACHE_CLEAR.sql, RELATIONSHIP_REBUILD.sql, VERIFICATION.sql)
 * 
 * Usage: node test-end-to-end-workflow.js [environment]
 * Environment: 'development' (default) or 'production'
 */

const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const fs = require('fs');

// Load environment variables
dotenv.config();

// Test configuration
const config = {
  development: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    key: process.env.SUPABASE_SERVICE_ROLE_KEY,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    testUserEmail: 'test-user-dev@example.com',
    testUserPassword: 'test-password-123'
  },
  production: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    key: process.env.SUPABASE_SERVICE_ROLE_KEY,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
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

// Initialize Supabase clients
const supabaseService = createClient(envConfig.url, envConfig.key);
const supabaseAnon = createClient(envConfig.url, envConfig.anonKey);

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
    const { data, error } = await supabaseService.auth.admin.createUser({
      email: envConfig.testUserEmail,
      password: envConfig.testUserPassword,
      email_confirm: true
    });
    
    if (error && !error.message.includes('already registered')) {
      throw error;
    }
    
    // If user already exists, get their ID
    if (error && error.message.includes('already registered')) {
      const { data: existingUser } = await supabaseService.auth.admin.getUserByEmail(envConfig.testUserEmail);
      return existingUser.user;
    }
    
    return data.user;
  } catch (error) {
    console.error(`Error creating test user: ${error.message}`);
    return null;
  }
}

// Helper function to authenticate user
async function authenticateUser(email, password) {
  try {
    const { data, error } = await supabaseAnon.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) {
      throw error;
    }
    
    // Create a new client with the user's session
    const userClient = createClient(envConfig.url, envConfig.anonKey, {
      auth: {
        persistSession: false
      }
    });
    
    // Set the session
    await userClient.auth.setSession(data.session.access_token, data.session.refresh_token);
    
    return userClient;
  } catch (error) {
    console.error(`Error authenticating user ${email}: ${error.message}`);
    return null;
  }
}

// Test 1: Complete trading workflow
async function testCompleteTradingWorkflow() {
  logTest('Complete Trading Workflow', 'running', 'Testing complete trading workflow from strategy to trades');
  
  try {
    // Create and authenticate test user
    const testUser = await createTestUser();
    if (!testUser) {
      logTest('Complete Trading Workflow', 'skipped', 'Could not create test user');
      return false;
    }
    
    const userClient = await authenticateUser(envConfig.testUserEmail, envConfig.testUserPassword);
    if (!userClient) {
      logTest('Complete Trading Workflow', 'skipped', 'Could not authenticate test user');
      return false;
    }
    
    // Step 1: Create a strategy
    const strategyData = {
      name: 'End-to-End Test Strategy',
      description: 'Strategy for complete workflow testing',
      created_at: new Date().toISOString()
    };
    
    const { data: strategy, error: strategyError } = await userClient
      .from('strategies')
      .insert(strategyData)
      .select()
      .single();
    
    if (strategyError) {
      if (strategyError.message && strategyError.message.includes('strategy_rule_compliance')) {
        logTest('Complete Trading Workflow', 'failed', 'strategy_rule_compliance error when creating strategy', { error: strategyError.message });
        return false;
      }
      
      logTest('Complete Trading Workflow', 'failed', 'Could not create strategy', { error: strategyError.message });
      return false;
    }
    
    // Step 2: Create multiple trades with the strategy
    const tradeCount = 3;
    const createdTrades = [];
    
    for (let i = 0; i < tradeCount; i++) {
      const tradeData = {
        symbol: `WORKFLOW${i + 1}`,
        direction: i % 2 === 0 ? 'long' : 'short',
        entry_price: 100 + (i * 10),
        quantity: 10 + (i * 5),
        entry_date: new Date(Date.now() + (i * 24 * 60 * 60 * 1000)).toISOString(), // Different days
        status: 'open',
        strategy_id: strategy.id
      };
      
      const { data: trade, error: tradeError } = await userClient
        .from('trades')
        .insert(tradeData)
        .select()
        .single();
      
      if (tradeError) {
        if (tradeError.message && tradeError.message.includes('strategy_rule_compliance')) {
          logTest('Complete Trading Workflow', 'failed', 'strategy_rule_compliance error when creating trade', { error: tradeError.message });
          return false;
        }
        
        logTest('Complete Trading Workflow', 'failed', `Could not create trade ${i + 1}`, { error: tradeError.message });
        return false;
      }
      
      createdTrades.push(trade);
    }
    
    // Step 3: Query strategy with related trades
    const { data: strategyWithTrades, error: queryError } = await userClient
      .from('strategies')
      .select(`
        *,
        trades (
          id,
          symbol,
          direction,
          entry_price,
          quantity,
          entry_date,
          status
        )
      `)
      .eq('id', strategy.id)
      .single();
    
    if (queryError) {
      if (queryError.message && queryError.message.includes('strategy_rule_compliance')) {
        logTest('Complete Trading Workflow', 'failed', 'strategy_rule_compliance error in strategy-trades query', { error: queryError.message });
        return false;
      }
      
      logTest('Complete Trading Workflow', 'failed', 'Could not query strategy with trades', { error: queryError.message });
      return false;
    }
    
    // Step 4: Verify workflow completeness
    if (strategyWithTrades && 
        strategyWithTrades.trades && 
        strategyWithTrades.trades.length === tradeCount) {
      
      logTest('Complete Trading Workflow', 'passed', 'Complete trading workflow successful', {
        strategyId: strategy.id,
        tradeCount: strategyWithTrades.trades.length
      });
      
      // Clean up test data
      for (const trade of createdTrades) {
        await userClient.from('trades').delete().eq('id', trade.id);
      }
      await userClient.from('strategies').delete().eq('id', strategy.id);
      
      return true;
    } else {
      logTest('Complete Trading Workflow', 'failed', 'Workflow incomplete - missing trades', {
        expectedTradeCount: tradeCount,
        actualTradeCount: strategyWithTrades ? (strategyWithTrades.trades ? strategyWithTrades.trades.length : 0) : 0
      });
      return false;
    }
  } catch (error) {
    logTest('Complete Trading Workflow', 'failed', 'Unexpected error', { error: error.message });
    return false;
  }
}

// Test 2: Strategy lifecycle workflow
async function testStrategyLifecycleWorkflow() {
  logTest('Strategy Lifecycle Workflow', 'running', 'Testing complete strategy lifecycle from creation to deletion');
  
  try {
    // Create and authenticate test user
    const testUser = await createTestUser();
    if (!testUser) {
      logTest('Strategy Lifecycle Workflow', 'skipped', 'Could not create test user');
      return false;
    }
    
    const userClient = await authenticateUser(envConfig.testUserEmail, envConfig.testUserPassword);
    if (!userClient) {
      logTest('Strategy Lifecycle Workflow', 'skipped', 'Could not authenticate test user');
      return false;
    }
    
    // Step 1: Create strategy
    const strategyData = {
      name: 'Lifecycle Test Strategy',
      description: 'Strategy for lifecycle testing',
      created_at: new Date().toISOString()
    };
    
    const { data: strategy, error: createError } = await userClient
      .from('strategies')
      .insert(strategyData)
      .select()
      .single();
    
    if (createError) {
      if (createError.message && createError.message.includes('strategy_rule_compliance')) {
        logTest('Strategy Lifecycle Workflow', 'failed', 'strategy_rule_compliance error when creating strategy', { error: createError.message });
        return false;
      }
      
      logTest('Strategy Lifecycle Workflow', 'failed', 'Could not create strategy', { error: createError.message });
      return false;
    }
    
    // Step 2: Update strategy
    const updatedData = {
      name: 'Updated Lifecycle Strategy',
      description: 'This strategy has been updated'
    };
    
    const { data: updatedStrategy, error: updateError } = await userClient
      .from('strategies')
      .update(updatedData)
      .eq('id', strategy.id)
      .select()
      .single();
    
    if (updateError) {
      if (updateError.message && updateError.message.includes('strategy_rule_compliance')) {
        logTest('Strategy Lifecycle Workflow', 'failed', 'strategy_rule_compliance error when updating strategy', { error: updateError.message });
        return false;
      }
      
      logTest('Strategy Lifecycle Workflow', 'failed', 'Could not update strategy', { error: updateError.message });
      return false;
    }
    
    // Step 3: Create trades with strategy
    const tradeData = {
      symbol: 'LIFECYCLE',
      direction: 'long',
      entry_price: 150.00,
      quantity: 20,
      entry_date: new Date().toISOString(),
      status: 'open',
      strategy_id: strategy.id
    };
    
    const { data: trade, error: tradeError } = await userClient
      .from('trades')
      .insert(tradeData)
      .select()
      .single();
    
    if (tradeError) {
      if (tradeError.message && tradeError.message.includes('strategy_rule_compliance')) {
        logTest('Strategy Lifecycle Workflow', 'failed', 'strategy_rule_compliance error when creating trade', { error: tradeError.message });
        return false;
      }
      
      logTest('Strategy Lifecycle Workflow', 'failed', 'Could not create trade with strategy', { error: tradeError.message });
      return false;
    }
    
    // Step 4: Delete strategy (should handle related trades appropriately)
    const { error: deleteError } = await userClient
      .from('strategies')
      .delete()
      .eq('id', strategy.id);
    
    if (deleteError) {
      if (deleteError.message && deleteError.message.includes('strategy_rule_compliance')) {
        logTest('Strategy Lifecycle Workflow', 'failed', 'strategy_rule_compliance error when deleting strategy', { error: deleteError.message });
        return false;
      }
      
      logTest('Strategy Lifecycle Workflow', 'failed', 'Could not delete strategy', { error: deleteError.message });
      return false;
    }
    
    // Step 5: Verify lifecycle completion
    const { data: remainingStrategy } = await userClient
      .from('strategies')
      .select('*')
      .eq('id', strategy.id)
      .single();
    
    const { data: remainingTrade } = await userClient
      .from('trades')
      .select('*')
      .eq('id', trade.id)
      .single();
    
    // Strategy should be deleted, trade handling depends on foreign key constraints
    if (!remainingStrategy) {
      logTest('Strategy Lifecycle Workflow', 'passed', 'Strategy lifecycle completed successfully', {
        strategyId: strategy.id,
        tradeId: trade.id,
        strategyDeleted: !remainingStrategy,
        tradeExists: !!remainingTrade
      });
      
      // Clean up any remaining trade
      if (remainingTrade) {
        await userClient.from('trades').delete().eq('id', trade.id);
      }
      
      return true;
    } else {
      logTest('Strategy Lifecycle Workflow', 'failed', 'Strategy was not deleted', { remainingStrategy });
      return false;
    }
  } catch (error) {
    logTest('Strategy Lifecycle Workflow', 'failed', 'Unexpected error', { error: error.message });
    return false;
  }
}

// Test 3: Multi-user concurrent workflow
async function testMultiUserConcurrentWorkflow() {
  logTest('Multi-User Concurrent Workflow', 'running', 'Testing concurrent operations by multiple users');
  
  try {
    // Create additional test users
    const user1Email = `test-user-1-${environment}@example.com`;
    const user2Email = `test-user-2-${environment}@example.com`;
    const user1Password = 'test-password-789';
    const user2Password = 'test-password-012';
    
    const user1 = await supabaseService.auth.admin.createUser({
      email: user1Email,
      password: user1Password,
      email_confirm: true
    });
    
    const user2 = await supabaseService.auth.admin.createUser({
      email: user2Email,
      password: user2Password,
      email_confirm: true
    });
    
    if (!user1.data?.user || !user2.data?.user) {
      logTest('Multi-User Concurrent Workflow', 'skipped', 'Could not create test users');
      return false;
    }
    
    // Authenticate both users
    const user1Client = await authenticateUser(user1Email, user1Password);
    const user2Client = await authenticateUser(user2Email, user2Password);
    
    if (!user1Client || !user2Client) {
      logTest('Multi-User Concurrent Workflow', 'skipped', 'Could not authenticate test users');
      return false;
    }
    
    // Create strategies for both users
    const strategyPromises = [
      user1Client.from('strategies').insert({
        name: 'User 1 Concurrent Strategy',
        description: 'Strategy for concurrent testing',
        created_at: new Date().toISOString()
      }).select().single(),
      
      user2Client.from('strategies').insert({
        name: 'User 2 Concurrent Strategy',
        description: 'Strategy for concurrent testing',
        created_at: new Date().toISOString()
      }).select().single()
    ];
    
    const [strategy1Result, strategy2Result] = await Promise.all(strategyPromises);
    
    if (strategy1Result.error || strategy2Result.error) {
      if ((strategy1Result.error?.message || '').includes('strategy_rule_compliance') || 
          (strategy2Result.error?.message || '').includes('strategy_rule_compliance')) {
        logTest('Multi-User Concurrent Workflow', 'failed', 'strategy_rule_compliance error in concurrent operations', {
          user1Error: strategy1Result.error?.message,
          user2Error: strategy2Result.error?.message
        });
        return false;
      }
      
      logTest('Multi-User Concurrent Workflow', 'failed', 'Could not create strategies concurrently', {
        user1Error: strategy1Result.error?.message,
        user2Error: strategy2Result.error?.message
      });
      return false;
    }
    
    // Create trades for both users
    const tradePromises = [
      user1Client.from('trades').insert({
        symbol: 'CONCURRENT1',
        direction: 'long',
        entry_price: 100.00,
        quantity: 10,
        entry_date: new Date().toISOString(),
        status: 'open',
        strategy_id: strategy1Result.data.id
      }).select().single(),
      
      user2Client.from('trades').insert({
        symbol: 'CONCURRENT2',
        direction: 'short',
        entry_price: 200.00,
        quantity: 20,
        entry_date: new Date().toISOString(),
        status: 'open',
        strategy_id: strategy2Result.data.id
      }).select().single()
    ];
    
    const [trade1Result, trade2Result] = await Promise.all(tradePromises);
    
    if (trade1Result.error || trade2Result.error) {
      if ((trade1Result.error?.message || '').includes('strategy_rule_compliance') || 
          (trade2Result.error?.message || '').includes('strategy_rule_compliance')) {
        logTest('Multi-User Concurrent Workflow', 'failed', 'strategy_rule_compliance error in concurrent trade creation', {
          user1Error: trade1Result.error?.message,
          user2Error: trade2Result.error?.message
        });
        return false;
      }
      
      logTest('Multi-User Concurrent Workflow', 'failed', 'Could not create trades concurrently', {
        user1Error: trade1Result.error?.message,
        user2Error: trade2Result.error?.message
      });
      return false;
    }
    
    // Verify data isolation
    const user1Strategies = await user1Client.from('strategies').select('*');
    const user2Strategies = await user2Client.from('strategies').select('*');
    
    const user1CanSeeUser2Strategy = user1Strategies.data?.some(s => s.id === strategy2Result.data.id);
    const user2CanSeeUser1Strategy = user2Strategies.data?.some(s => s.id === strategy1Result.data.id);
    
    if (!user1CanSeeUser2Strategy && !user2CanSeeUser1Strategy) {
      logTest('Multi-User Concurrent Workflow', 'passed', 'Concurrent operations with proper data isolation', {
        user1StrategyCount: user1Strategies.data?.length || 0,
        user2StrategyCount: user2Strategies.data?.length || 0
      });
      
      // Clean up
      await user1Client.from('trades').delete().eq('id', trade1Result.data.id);
      await user2Client.from('trades').delete().eq('id', trade2Result.data.id);
      await user1Client.from('strategies').delete().eq('id', strategy1Result.data.id);
      await user2Client.from('strategies').delete().eq('id', strategy2Result.data.id);
      await supabaseService.auth.admin.deleteUser(user1.data.user.id);
      await supabaseService.auth.admin.deleteUser(user2.data.user.id);
      
      return true;
    } else {
      logTest('Multi-User Concurrent Workflow', 'failed', 'Data isolation failed in concurrent operations', {
        user1CanSeeUser2: user1CanSeeUser2Strategy,
        user2CanSeeUser1: user2CanSeeUser1Strategy
      });
      return false;
    }
  } catch (error) {
    logTest('Multi-User Concurrent Workflow', 'failed', 'Unexpected error', { error: error.message });
    return false;
  }
}

// Test 4: Analytics workflow
async function testAnalyticsWorkflow() {
  logTest('Analytics Workflow', 'running', 'Testing analytics workflow with strategy-trades relationships');
  
  try {
    // Create and authenticate test user
    const testUser = await createTestUser();
    if (!testUser) {
      logTest('Analytics Workflow', 'skipped', 'Could not create test user');
      return false;
    }
    
    const userClient = await authenticateUser(envConfig.testUserEmail, envConfig.testUserPassword);
    if (!userClient) {
      logTest('Analytics Workflow', 'skipped', 'Could not authenticate test user');
      return false;
    }
    
    // Create strategy
    const { data: strategy, error: strategyError } = await userClient
      .from('strategies')
      .insert({
        name: 'Analytics Test Strategy',
        description: 'Strategy for analytics testing',
        created_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (strategyError) {
      if (strategyError.message && strategyError.message.includes('strategy_rule_compliance')) {
        logTest('Analytics Workflow', 'failed', 'strategy_rule_compliance error when creating strategy', { error: strategyError.message });
        return false;
      }
      
      logTest('Analytics Workflow', 'skipped', 'Could not create strategy', { error: strategyError.message });
      return false;
    }
    
    // Create trades with different outcomes
    const trades = [
      {
        symbol: 'ANALYTICS1',
        direction: 'long',
        entry_price: 100.00,
        quantity: 10,
        entry_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
        status: 'closed',
        exit_price: 110.00,
        exit_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
        strategy_id: strategy.id
      },
      {
        symbol: 'ANALYTICS2',
        direction: 'short',
        entry_price: 200.00,
        quantity: 5,
        entry_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
        status: 'closed',
        exit_price: 185.00,
        exit_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
        strategy_id: strategy.id
      },
      {
        symbol: 'ANALYTICS3',
        direction: 'long',
        entry_price: 150.00,
        quantity: 15,
        entry_date: new Date().toISOString(),
        status: 'open',
        strategy_id: strategy.id
      }
    ];
    
    const createdTrades = [];
    for (const tradeData of trades) {
      const { data: trade, error } = await userClient
        .from('trades')
        .insert(tradeData)
        .select()
        .single();
      
      if (error) {
        if (error.message && error.message.includes('strategy_rule_compliance')) {
          logTest('Analytics Workflow', 'failed', 'strategy_rule_compliance error when creating trade', { error: error.message });
          return false;
        }
        
        logTest('Analytics Workflow', 'failed', 'Could not create trade for analytics', { error: error.message });
        return false;
      }
      
      createdTrades.push(trade);
    }
    
    // Query analytics data
    const { data: analyticsData, error: analyticsError } = await userClient
      .from('strategies')
      .select(`
        *,
        trades (
          id,
          symbol,
          direction,
          entry_price,
          exit_price,
          quantity,
          entry_date,
          exit_date,
          status
        )
      `)
      .eq('id', strategy.id)
      .single();
    
    if (analyticsError) {
      if (analyticsError.message && analyticsError.message.includes('strategy_rule_compliance')) {
        logTest('Analytics Workflow', 'failed', 'strategy_rule_compliance error in analytics query', { error: analyticsError.message });
        return false;
      }
      
      logTest('Analytics Workflow', 'failed', 'Could not query analytics data', { error: analyticsError.message });
      return false;
    }
    
    // Verify analytics workflow
    if (analyticsData && 
        analyticsData.trades && 
        analyticsData.trades.length === trades.length) {
      
      // Calculate basic analytics
      const closedTrades = analyticsData.trades.filter(t => t.status === 'closed');
      const totalPnL = closedTrades.reduce((sum, trade) => {
        const pnl = trade.direction === 'long' 
          ? (trade.exit_price - trade.entry_price) * trade.quantity
          : (trade.entry_price - trade.exit_price) * trade.quantity;
        return sum + pnl;
      }, 0);
      
      logTest('Analytics Workflow', 'passed', 'Analytics workflow successful', {
        strategyId: strategy.id,
        totalTrades: analyticsData.trades.length,
        closedTrades: closedTrades.length,
        totalPnL
      });
      
      // Clean up
      for (const trade of createdTrades) {
        await userClient.from('trades').delete().eq('id', trade.id);
      }
      await userClient.from('strategies').delete().eq('id', strategy.id);
      
      return true;
    } else {
      logTest('Analytics Workflow', 'failed', 'Analytics workflow incomplete', {
        expectedTradeCount: trades.length,
        actualTradeCount: analyticsData ? (analyticsData.trades ? analyticsData.trades.length : 0) : 0
      });
      return false;
    }
  } catch (error) {
    logTest('Analytics Workflow', 'failed', 'Unexpected error', { error: error.message });
    return false;
  }
}

// Test 5: Performance workflow
async function testPerformanceWorkflow() {
  logTest('Performance Workflow', 'running', 'Testing performance with realistic data volumes');
  
  try {
    // Create and authenticate test user
    const testUser = await createTestUser();
    if (!testUser) {
      logTest('Performance Workflow', 'skipped', 'Could not create test user');
      return false;
    }
    
    const userClient = await authenticateUser(envConfig.testUserEmail, envConfig.testUserPassword);
    if (!userClient) {
      logTest('Performance Workflow', 'skipped', 'Could not authenticate test user');
      return false;
    }
    
    // Create strategy
    const { data: strategy, error: strategyError } = await userClient
      .from('strategies')
      .insert({
        name: 'Performance Test Strategy',
        description: 'Strategy for performance testing',
        created_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (strategyError) {
      if (strategyError.message && strategyError.message.includes('strategy_rule_compliance')) {
        logTest('Performance Workflow', 'failed', 'strategy_rule_compliance error when creating strategy', { error: strategyError.message });
        return false;
      }
      
      logTest('Performance Workflow', 'skipped', 'Could not create strategy', { error: strategyError.message });
      return false;
    }
    
    // Create a larger number of trades for performance testing
    const tradeCount = 50;
    const startTime = Date.now();
    
    const createdTrades = [];
    for (let i = 0; i < tradeCount; i++) {
      const tradeData = {
        symbol: `PERF${i + 1}`,
        direction: i % 2 === 0 ? 'long' : 'short',
        entry_price: 100 + (Math.random() * 100),
        quantity: 10 + Math.floor(Math.random() * 40),
        entry_date: new Date(Date.now() - (tradeCount - i) * 60 * 60 * 1000).toISOString(),
        status: Math.random() > 0.7 ? 'closed' : 'open',
        strategy_id: strategy.id
      };
      
      const { data: trade, error } = await userClient
        .from('trades')
        .insert(tradeData)
        .select()
        .single();
      
      if (error) {
        if (error.message && error.message.includes('strategy_rule_compliance')) {
          logTest('Performance Workflow', 'failed', 'strategy_rule_compliance error in performance test', { error: error.message });
          return false;
        }
        
        logTest('Performance Workflow', 'failed', `Could not create trade ${i + 1} in performance test`, { error: error.message });
        return false;
      }
      
      createdTrades.push(trade);
    }
    
    const creationTime = Date.now() - startTime;
    
    // Test query performance with strategy-trades join
    const queryStartTime = Date.now();
    const { data: performanceData, error: queryError } = await userClient
      .from('strategies')
      .select(`
        *,
        trades (
          id,
          symbol,
          direction,
          entry_price,
          quantity,
          status
        )
      `)
      .eq('id', strategy.id)
      .single();
    
    const queryTime = Date.now() - queryStartTime;
    
    if (queryError) {
      if (queryError.message && queryError.message.includes('strategy_rule_compliance')) {
        logTest('Performance Workflow', 'failed', 'strategy_rule_compliance error in performance query', { error: queryError.message });
        return false;
      }
      
      logTest('Performance Workflow', 'failed', 'Performance query failed', { error: queryError.message });
      return false;
    }
    
    // Verify performance
    const creationTimePerTrade = creationTime / tradeCount;
    const isCreationPerformanceAcceptable = creationTimePerTrade < 100; // Less than 100ms per trade
    const isQueryPerformanceAcceptable = queryTime < 2000; // Less than 2 seconds for query
    
    if (isCreationPerformanceAcceptable && isQueryPerformanceAcceptable) {
      logTest('Performance Workflow', 'passed', 'Performance workflow successful', {
        strategyId: strategy.id,
        tradeCount: createdTrades.length,
        creationTimePerTrade: `${creationTimePerTrade.toFixed(2)}ms`,
        queryTime: `${queryTime}ms`
      });
      
      // Clean up
      for (const trade of createdTrades) {
        await userClient.from('trades').delete().eq('id', trade.id);
      }
      await userClient.from('strategies').delete().eq('id', strategy.id);
      
      return true;
    } else {
      logTest('Performance Workflow', 'failed', 'Performance not acceptable', {
        creationTimePerTrade: `${creationTimePerTrade.toFixed(2)}ms`,
        queryTime: `${queryTime}ms`,
        creationAcceptable: isCreationPerformanceAcceptable,
        queryAcceptable: isQueryPerformanceAcceptable
      });
      return false;
    }
  } catch (error) {
    logTest('Performance Workflow', 'failed', 'Unexpected error', { error: error.message });
    return false;
  }
}

// Main test execution function
async function runTests() {
  console.log(`\n🧪 Running End-to-End Workflow Tests in ${environment.toUpperCase()} Environment\n`);
  console.log(`📅 Started at: ${new Date().toISOString()}\n`);
  
  // Run all tests
  await testCompleteTradingWorkflow();
  await testStrategyLifecycleWorkflow();
  await testMultiUserConcurrentWorkflow();
  await testAnalyticsWorkflow();
  await testPerformanceWorkflow();
  
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
  
  const reportFileName = `end-to-end-workflow-test-report-${environment}-${Date.now()}.json`;
  fs.writeFileSync(reportFileName, JSON.stringify(reportData, null, 2));
  console.log(`\n📄 Detailed report saved to: ${reportFileName}`);
  
  // Exit with appropriate code
  if (testResults.failed > 0) {
    console.log('\n❌ Some tests failed. Check the detailed report for more information.');
    process.exit(1);
  } else {
    console.log('\n✅ All tests passed! End-to-end workflows are working correctly.');
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