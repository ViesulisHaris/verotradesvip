/**
 * Test Strategy Permissions with Different User Roles
 * 
 * Purpose: Verify that Row Level Security (RLS) policies work correctly for strategies
 * after applying the SQL fixes (SCHEMA_CACHE_CLEAR.sql, RELATIONSHIP_REBUILD.sql, VERIFICATION.sql)
 * 
 * Usage: node test-strategy-permissions.js [environment]
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
    users: [
      { email: 'test-user-dev@example.com', password: 'test-password-123', role: 'regular' },
      { email: 'test-admin-dev@example.com', password: 'test-admin-123', role: 'admin' },
      { email: 'test-user2-dev@example.com', password: 'test-password-456', role: 'regular' }
    ]
  },
  production: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    key: process.env.SUPABASE_SERVICE_ROLE_KEY,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    users: [
      { email: 'test-user-prod@example.com', password: 'test-password-123', role: 'regular' },
      { email: 'test-admin-prod@example.com', password: 'test-admin-123', role: 'admin' },
      { email: 'test-user2-prod@example.com', password: 'test-password-456', role: 'regular' }
    ]
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
async function createTestUser(email, password, role) {
  try {
    // Create user with auth admin API (requires service role key)
    const { data, error } = await supabaseService.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { role }
    });
    
    if (error && !error.message.includes('already registered')) {
      throw error;
    }
    
    // If user already exists, get their ID
    if (error && error.message.includes('already registered')) {
      const { data: existingUser } = await supabaseService.auth.admin.getUserByEmail(email);
      return existingUser.user;
    }
    
    return data.user;
  } catch (error) {
    console.error(`Error creating test user ${email}: ${error.message}`);
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

// Helper function to create strategy for user
async function createStrategyForUser(client, userId, strategyName) {
  try {
    const { data, error } = await client
      .from('strategies')
      .insert({
        user_id: userId,
        name: strategyName,
        description: `Test strategy: ${strategyName}`,
        created_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error(`Error creating strategy for user ${userId}: ${error.message}`);
    return null;
  }
}

// Test 1: Verify RLS is enabled on strategies table
async function testRLSEnabled() {
  logTest('RLS Enabled on Strategies', 'running', 'Checking if RLS is enabled on strategies table');
  
  try {
    // Check if RLS is enabled using service role
    const { data, error } = await supabaseService
      .rpc('check_rls_enabled', { table_name: 'strategies' });
    
    if (error) {
      logTest('RLS Enabled on Strategies', 'failed', 'Could not check RLS status', { error: error.message });
      return false;
    }
    
    if (data && data.enabled) {
      logTest('RLS Enabled on Strategies', 'passed', 'RLS is enabled on strategies table');
      return true;
    } else {
      logTest('RLS Enabled on Strategies', 'failed', 'RLS is not enabled on strategies table', { data });
      return false;
    }
  } catch (error) {
    logTest('RLS Enabled on Strategies', 'failed', 'Unexpected error', { error: error.message });
    return false;
  }
}

// Test 2: Unauthenticated user cannot access strategies
async function testUnauthenticatedAccess() {
  logTest('Unauthenticated Access', 'running', 'Testing unauthenticated user access to strategies');
  
  try {
    // Try to access strategies without authentication
    const { data, error } = await supabaseAnon
      .from('strategies')
      .select('*');
    
    if (error) {
      // Expected error - unauthenticated users should not have access
      if (error.message && (error.message.includes('permission') || error.message.includes('authorization'))) {
        logTest('Unauthenticated Access', 'passed', 'Unauthenticated users correctly denied access', { error: error.message });
        return true;
      }
      
      // Check if error is related to strategy_rule_compliance
      if (error.message && error.message.includes('strategy_rule_compliance')) {
        logTest('Unauthenticated Access', 'failed', 'strategy_rule_compliance error for unauthenticated access', { error: error.message });
        return false;
      }
      
      logTest('Unauthenticated Access', 'failed', 'Unexpected error for unauthenticated access', { error: error.message });
      return false;
    }
    
    // If no error, that's a problem - unauthenticated users should not see any strategies
    if (data && data.length > 0) {
      logTest('Unauthenticated Access', 'failed', 'Unauthenticated users can see strategies', { count: data.length });
      return false;
    }
    
    // Empty result is acceptable
    logTest('Unauthenticated Access', 'passed', 'Unauthenticated users cannot see any strategies');
    return true;
  } catch (error) {
    logTest('Unauthenticated Access', 'failed', 'Unexpected error', { error: error.message });
    return false;
  }
}

// Test 3: User can access their own strategies
async function testOwnStrategyAccess() {
  logTest('Own Strategy Access', 'running', 'Testing user access to their own strategies');
  
  try {
    // Create test users
    const user1 = await createTestUser(envConfig.users[0].email, envConfig.users[0].password, envConfig.users[0].role);
    if (!user1) {
      logTest('Own Strategy Access', 'skipped', 'Could not create test user 1');
      return false;
    }
    
    // Authenticate user
    const user1Client = await authenticateUser(envConfig.users[0].email, envConfig.users[0].password);
    if (!user1Client) {
      logTest('Own Strategy Access', 'skipped', 'Could not authenticate test user 1');
      return false;
    }
    
    // Create strategy for user
    const strategy = await createStrategyForUser(user1Client, user1.id, 'User 1 Strategy');
    if (!strategy) {
      logTest('Own Strategy Access', 'skipped', 'Could not create test strategy');
      return false;
    }
    
    // Try to access the strategy
    const { data, error } = await user1Client
      .from('strategies')
      .select('*')
      .eq('id', strategy.id);
    
    if (error) {
      // Check if error is related to strategy_rule_compliance
      if (error.message && error.message.includes('strategy_rule_compliance')) {
        logTest('Own Strategy Access', 'failed', 'strategy_rule_compliance error when accessing own strategy', { error: error.message });
        return false;
      }
      
      logTest('Own Strategy Access', 'failed', 'User cannot access their own strategy', { error: error.message });
      return false;
    }
    
    if (data && data.length > 0 && data[0].id === strategy.id) {
      logTest('Own Strategy Access', 'passed', 'User can access their own strategies', { 
        userId: user1.id,
        strategyId: strategy.id
      });
      
      // Clean up
      await supabaseService.from('strategies').delete().eq('id', strategy.id);
      await supabaseService.auth.admin.deleteUser(user1.id);
      
      return true;
    } else {
      logTest('Own Strategy Access', 'failed', 'User cannot see their own strategy', { data });
      return false;
    }
  } catch (error) {
    logTest('Own Strategy Access', 'failed', 'Unexpected error', { error: error.message });
    return false;
  }
}

// Test 4: User cannot access another user's strategies
async function testOtherUserStrategyAccess() {
  logTest('Other User Strategy Access', 'running', 'Testing user access to another user\'s strategies');
  
  try {
    // Create test users
    const user1 = await createTestUser(envConfig.users[0].email, envConfig.users[0].password, envConfig.users[0].role);
    const user2 = await createTestUser(envConfig.users[1].email, envConfig.users[1].password, envConfig.users[1].role);
    
    if (!user1 || !user2) {
      logTest('Other User Strategy Access', 'skipped', 'Could not create test users');
      return false;
    }
    
    // Authenticate user 2
    const user2Client = await authenticateUser(envConfig.users[1].email, envConfig.users[1].password);
    if (!user2Client) {
      logTest('Other User Strategy Access', 'skipped', 'Could not authenticate test user 2');
      return false;
    }
    
    // Create strategy for user 1 using service role
    const { data: strategy, error: createError } = await supabaseService
      .from('strategies')
      .insert({
        user_id: user1.id,
        name: 'User 1 Strategy for Access Test',
        description: 'This strategy belongs to user 1',
        created_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (createError) {
      logTest('Other User Strategy Access', 'skipped', 'Could not create test strategy', { error: createError.message });
      return false;
    }
    
    // Try to access user 1's strategy with user 2's client
    const { data, error } = await user2Client
      .from('strategies')
      .select('*')
      .eq('id', strategy.id);
    
    if (error) {
      // Expected error - user should not access another user's strategy
      if (error.message && (error.message.includes('permission') || error.message.includes('authorization'))) {
        logTest('Other User Strategy Access', 'passed', 'User correctly denied access to another user\'s strategy', { error: error.message });
        
        // Clean up
        await supabaseService.from('strategies').delete().eq('id', strategy.id);
        await supabaseService.auth.admin.deleteUser(user1.id);
        await supabaseService.auth.admin.deleteUser(user2.id);
        
        return true;
      }
      
      // Check if error is related to strategy_rule_compliance
      if (error.message && error.message.includes('strategy_rule_compliance')) {
        logTest('Other User Strategy Access', 'failed', 'strategy_rule_compliance error when accessing other user\'s strategy', { error: error.message });
        return false;
      }
      
      logTest('Other User Strategy Access', 'failed', 'Unexpected error when accessing other user\'s strategy', { error: error.message });
      return false;
    }
    
    // If no error, check if user can see the strategy
    if (data && data.length > 0) {
      logTest('Other User Strategy Access', 'failed', 'User can access another user\'s strategy', { 
        userId: user2.id,
        strategyId: strategy.id,
        strategyOwnerId: user1.id
      });
      return false;
    }
    
    // Empty result is acceptable - user cannot see other user's strategy
    logTest('Other User Strategy Access', 'passed', 'User cannot access another user\'s strategies');
    
    // Clean up
    await supabaseService.from('strategies').delete().eq('id', strategy.id);
    await supabaseService.auth.admin.deleteUser(user1.id);
    await supabaseService.auth.admin.deleteUser(user2.id);
    
    return true;
  } catch (error) {
    logTest('Other User Strategy Access', 'failed', 'Unexpected error', { error: error.message });
    return false;
  }
}

// Test 5: User can only see their own strategies in list
async function testStrategyListIsolation() {
  logTest('Strategy List Isolation', 'running', 'Testing strategy list isolation between users');
  
  try {
    // Create test users
    const user1 = await createTestUser(envConfig.users[0].email, envConfig.users[0].password, envConfig.users[0].role);
    const user2 = await createTestUser(envConfig.users[1].email, envConfig.users[1].password, envConfig.users[1].role);
    
    if (!user1 || !user2) {
      logTest('Strategy List Isolation', 'skipped', 'Could not create test users');
      return false;
    }
    
    // Authenticate users
    const user1Client = await authenticateUser(envConfig.users[0].email, envConfig.users[0].password);
    const user2Client = await authenticateUser(envConfig.users[1].email, envConfig.users[1].password);
    
    if (!user1Client || !user2Client) {
      logTest('Strategy List Isolation', 'skipped', 'Could not authenticate test users');
      return false;
    }
    
    // Create strategies for each user
    const strategy1 = await createStrategyForUser(user1Client, user1.id, 'User 1 Strategy for List Test');
    const strategy2 = await createStrategyForUser(user2Client, user2.id, 'User 2 Strategy for List Test');
    
    if (!strategy1 || !strategy2) {
      logTest('Strategy List Isolation', 'skipped', 'Could not create test strategies');
      return false;
    }
    
    // Get user 1's strategies
    const { data: user1Strategies, error: user1Error } = await user1Client
      .from('strategies')
      .select('*');
    
    if (user1Error) {
      logTest('Strategy List Isolation', 'failed', 'User 1 cannot list strategies', { error: user1Error.message });
      return false;
    }
    
    // Get user 2's strategies
    const { data: user2Strategies, error: user2Error } = await user2Client
      .from('strategies')
      .select('*');
    
    if (user2Error) {
      logTest('Strategy List Isolation', 'failed', 'User 2 cannot list strategies', { error: user2Error.message });
      return false;
    }
    
    // Verify isolation
    const user1CanSeeOwnStrategy = user1Strategies && user1Strategies.some(s => s.id === strategy1.id);
    const user1CanSeeUser2Strategy = user1Strategies && user1Strategies.some(s => s.id === strategy2.id);
    const user2CanSeeOwnStrategy = user2Strategies && user2Strategies.some(s => s.id === strategy2.id);
    const user2CanSeeUser1Strategy = user2Strategies && user2Strategies.some(s => s.id === strategy1.id);
    
    if (user1CanSeeOwnStrategy && !user1CanSeeUser2Strategy && 
        user2CanSeeOwnStrategy && !user2CanSeeUser1Strategy) {
      
      logTest('Strategy List Isolation', 'passed', 'Strategy list isolation works correctly', {
        user1Strategies: user1Strategies.length,
        user2Strategies: user2Strategies.length
      });
      
      // Clean up
      await supabaseService.from('strategies').delete().eq('id', strategy1.id);
      await supabaseService.from('strategies').delete().eq('id', strategy2.id);
      await supabaseService.auth.admin.deleteUser(user1.id);
      await supabaseService.auth.admin.deleteUser(user2.id);
      
      return true;
    } else {
      logTest('Strategy List Isolation', 'failed', 'Strategy list isolation failed', {
        user1CanSeeOwn: user1CanSeeOwnStrategy,
        user1CanSeeUser2: user1CanSeeUser2Strategy,
        user2CanSeeOwn: user2CanSeeOwnStrategy,
        user2CanSeeUser1: user2CanSeeUser1Strategy
      });
      return false;
    }
  } catch (error) {
    logTest('Strategy List Isolation', 'failed', 'Unexpected error', { error: error.message });
    return false;
  }
}

// Test 6: User cannot modify another user's strategies
async function testStrategyModificationProtection() {
  logTest('Strategy Modification Protection', 'running', 'Testing protection against modifying another user\'s strategies');
  
  try {
    // Create test users
    const user1 = await createTestUser(envConfig.users[0].email, envConfig.users[0].password, envConfig.users[0].role);
    const user2 = await createTestUser(envConfig.users[1].email, envConfig.users[1].password, envConfig.users[1].role);
    
    if (!user1 || !user2) {
      logTest('Strategy Modification Protection', 'skipped', 'Could not create test users');
      return false;
    }
    
    // Authenticate user 2
    const user2Client = await authenticateUser(envConfig.users[1].email, envConfig.users[1].password);
    if (!user2Client) {
      logTest('Strategy Modification Protection', 'skipped', 'Could not authenticate test user 2');
      return false;
    }
    
    // Create strategy for user 1 using service role
    const { data: strategy, error: createError } = await supabaseService
      .from('strategies')
      .insert({
        user_id: user1.id,
        name: 'User 1 Strategy for Modification Test',
        description: 'This strategy belongs to user 1',
        created_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (createError) {
      logTest('Strategy Modification Protection', 'skipped', 'Could not create test strategy', { error: createError.message });
      return false;
    }
    
    // Try to update user 1's strategy with user 2's client
    const { data, error } = await user2Client
      .from('strategies')
      .update({
        name: 'Hacked Strategy',
        description: 'This should not be possible'
      })
      .eq('id', strategy.id);
    
    if (error) {
      // Expected error - user should not modify another user's strategy
      if (error.message && (error.message.includes('permission') || error.message.includes('authorization'))) {
        logTest('Strategy Modification Protection', 'passed', 'User correctly denied modification of another user\'s strategy', { error: error.message });
        
        // Clean up
        await supabaseService.from('strategies').delete().eq('id', strategy.id);
        await supabaseService.auth.admin.deleteUser(user1.id);
        await supabaseService.auth.admin.deleteUser(user2.id);
        
        return true;
      }
      
      // Check if error is related to strategy_rule_compliance
      if (error.message && error.message.includes('strategy_rule_compliance')) {
        logTest('Strategy Modification Protection', 'failed', 'strategy_rule_compliance error when modifying other user\'s strategy', { error: error.message });
        return false;
      }
      
      logTest('Strategy Modification Protection', 'failed', 'Unexpected error when modifying other user\'s strategy', { error: error.message });
      return false;
    }
    
    // If no error, check if strategy was actually modified
    const { data: checkStrategy } = await supabaseService
      .from('strategies')
      .select('*')
      .eq('id', strategy.id)
      .single();
    
    if (checkStrategy && checkStrategy.name === 'Hacked Strategy') {
      logTest('Strategy Modification Protection', 'failed', 'User was able to modify another user\'s strategy', { 
        originalName: strategy.name,
        modifiedName: checkStrategy.name
      });
      return false;
    }
    
    logTest('Strategy Modification Protection', 'passed', 'User cannot modify another user\'s strategies');
    
    // Clean up
    await supabaseService.from('strategies').delete().eq('id', strategy.id);
    await supabaseService.auth.admin.deleteUser(user1.id);
    await supabaseService.auth.admin.deleteUser(user2.id);
    
    return true;
  } catch (error) {
    logTest('Strategy Modification Protection', 'failed', 'Unexpected error', { error: error.message });
    return false;
  }
}

// Test 7: User cannot delete another user's strategies
async function testStrategyDeletionProtection() {
  logTest('Strategy Deletion Protection', 'running', 'Testing protection against deleting another user\'s strategies');
  
  try {
    // Create test users
    const user1 = await createTestUser(envConfig.users[0].email, envConfig.users[0].password, envConfig.users[0].role);
    const user2 = await createTestUser(envConfig.users[1].email, envConfig.users[1].password, envConfig.users[1].role);
    
    if (!user1 || !user2) {
      logTest('Strategy Deletion Protection', 'skipped', 'Could not create test users');
      return false;
    }
    
    // Authenticate user 2
    const user2Client = await authenticateUser(envConfig.users[1].email, envConfig.users[1].password);
    if (!user2Client) {
      logTest('Strategy Deletion Protection', 'skipped', 'Could not authenticate test user 2');
      return false;
    }
    
    // Create strategy for user 1 using service role
    const { data: strategy, error: createError } = await supabaseService
      .from('strategies')
      .insert({
        user_id: user1.id,
        name: 'User 1 Strategy for Deletion Test',
        description: 'This strategy belongs to user 1',
        created_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (createError) {
      logTest('Strategy Deletion Protection', 'skipped', 'Could not create test strategy', { error: createError.message });
      return false;
    }
    
    // Try to delete user 1's strategy with user 2's client
    const { data, error } = await user2Client
      .from('strategies')
      .delete()
      .eq('id', strategy.id);
    
    if (error) {
      // Expected error - user should not delete another user's strategy
      if (error.message && (error.message.includes('permission') || error.message.includes('authorization'))) {
        logTest('Strategy Deletion Protection', 'passed', 'User correctly denied deletion of another user\'s strategy', { error: error.message });
        
        // Clean up
        await supabaseService.from('strategies').delete().eq('id', strategy.id);
        await supabaseService.auth.admin.deleteUser(user1.id);
        await supabaseService.auth.admin.deleteUser(user2.id);
        
        return true;
      }
      
      // Check if error is related to strategy_rule_compliance
      if (error.message && error.message.includes('strategy_rule_compliance')) {
        logTest('Strategy Deletion Protection', 'failed', 'strategy_rule_compliance error when deleting other user\'s strategy', { error: error.message });
        return false;
      }
      
      logTest('Strategy Deletion Protection', 'failed', 'Unexpected error when deleting other user\'s strategy', { error: error.message });
      return false;
    }
    
    // If no error, check if strategy was actually deleted
    const { data: checkStrategy } = await supabaseService
      .from('strategies')
      .select('*')
      .eq('id', strategy.id)
      .single();
    
    if (!checkStrategy) {
      logTest('Strategy Deletion Protection', 'failed', 'User was able to delete another user\'s strategy', { 
        strategyId: strategy.id,
        ownerId: user1.id
      });
      return false;
    }
    
    logTest('Strategy Deletion Protection', 'passed', 'User cannot delete another user\'s strategies');
    
    // Clean up
    await supabaseService.from('strategies').delete().eq('id', strategy.id);
    await supabaseService.auth.admin.deleteUser(user1.id);
    await supabaseService.auth.admin.deleteUser(user2.id);
    
    return true;
  } catch (error) {
    logTest('Strategy Deletion Protection', 'failed', 'Unexpected error', { error: error.message });
    return false;
  }
}

// Test 8: Verify RLS policies exist
async function testRLSPoliciesExist() {
  logTest('RLS Policies Exist', 'running', 'Checking if RLS policies exist for strategies table');
  
  try {
    // Check RLS policies using service role
    const { data, error } = await supabaseService
      .from('pg_policies')
      .select('*')
      .eq('tablename', 'strategies');
    
    if (error) {
      logTest('RLS Policies Exist', 'failed', 'Could not check RLS policies', { error: error.message });
      return false;
    }
    
    if (data && data.length > 0) {
      logTest('RLS Policies Exist', 'passed', 'RLS policies exist for strategies table', { 
        policyCount: data.length,
        policies: data.map(p => p.policyname)
      });
      return true;
    } else {
      logTest('RLS Policies Exist', 'failed', 'No RLS policies found for strategies table');
      return false;
    }
  } catch (error) {
    logTest('RLS Policies Exist', 'failed', 'Unexpected error', { error: error.message });
    return false;
  }
}

// Main test execution function
async function runTests() {
  console.log(`\n🧪 Running Strategy Permissions Tests in ${environment.toUpperCase()} Environment\n`);
  console.log(`📅 Started at: ${new Date().toISOString()}\n`);
  
  // Run all tests
  await testRLSEnabled();
  await testUnauthenticatedAccess();
  await testOwnStrategyAccess();
  await testOtherUserStrategyAccess();
  await testStrategyListIsolation();
  await testStrategyModificationProtection();
  await testStrategyDeletionProtection();
  await testRLSPoliciesExist();
  
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
  
  const reportFileName = `strategy-permissions-test-report-${environment}-${Date.now()}.json`;
  fs.writeFileSync(reportFileName, JSON.stringify(reportData, null, 2));
  console.log(`\n📄 Detailed report saved to: ${reportFileName}`);
  
  // Exit with appropriate code
  if (testResults.failed > 0) {
    console.log('\n❌ Some tests failed. Check the detailed report for more information.');
    process.exit(1);
  } else {
    console.log('\n✅ All tests passed! Strategy permissions are working correctly.');
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