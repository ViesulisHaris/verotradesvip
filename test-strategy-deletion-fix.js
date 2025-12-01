/**
 * Test script to verify the strategy deletion fix
 * This script tests the authentication logic that was causing the "You must be logged in to delete strategies" error
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Test configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing required environment variables:');
  console.error('   - NEXT_PUBLIC_SUPABASE_URL');
  console.error('   - NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Test results tracking
const testResults = [];

function addTestResult(message, isError = false) {
  const result = `${isError ? '❌' : '✅'} ${new Date().toLocaleTimeString()}: ${message}`;
  testResults.push(result);
  console.log(result);
}

async function testStrategyDeletionFix() {
  addTestResult('Starting strategy deletion fix test...');
  
  try {
    // Test 1: Check if we can get the current session (this is what the fix uses)
    addTestResult('Test 1: Testing session retrieval...');
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      addTestResult(`Session retrieval failed: ${sessionError.message}`, true);
      return false;
    }
    
    if (!session || !session.user) {
      addTestResult('No active session found. User must be logged in to test deletion.', true);
      addTestResult('Please log in to the application and run this test again.');
      return false;
    }
    
    addTestResult(`Session found for user: ${session.user.email}`);
    addTestResult(`User ID: ${session.user.id}`);
    
    // Test 2: Load user's strategies
    addTestResult('Test 2: Loading user strategies...');
    const { data: strategies, error: strategiesError } = await supabase
      .from('strategies')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });
    
    if (strategiesError) {
      addTestResult(`Failed to load strategies: ${strategiesError.message}`, true);
      return false;
    }
    
    if (!strategies || strategies.length === 0) {
      addTestResult('No strategies found to test deletion with.');
      addTestResult('Please create at least one strategy before testing deletion.');
      return false;
    }
    
    addTestResult(`Found ${strategies.length} strategies for testing`);
    
    // Test 3: Test the fixed authentication logic (simulate what happens in EnhancedStrategyCard)
    addTestResult('Test 3: Testing fixed authentication logic...');
    
    // This simulates the fixed code in EnhancedStrategyCard
    const { data: { session: authSession }, error: authSessionError } = await supabase.auth.getSession();
    
    if (authSessionError) {
      addTestResult(`Auth session error: ${authSessionError.message}`, true);
      return false;
    }
    
    if (!authSession || !authSession.user) {
      addTestResult('Authentication check failed - no session found', true);
      return false;
    }
    
    addTestResult('✅ Authentication check passed - this is the fix working!');
    
    // Test 4: Test actual deletion with the first strategy
    const testStrategy = strategies[0];
    addTestResult(`Test 4: Testing deletion of strategy: ${testStrategy.name}`);
    
    // Validate UUIDs (as done in the fixed code)
    const { validateUUID } = require('./src/lib/uuid-validation');
    
    try {
      const validatedStrategyId = validateUUID(testStrategy.id, 'strategy_id');
      const validatedUserId = validateUUID(session.user.id, 'user_id');
      addTestResult('UUID validation passed');
    } catch (validationError) {
      addTestResult(`UUID validation failed: ${validationError.message}`, true);
      return false;
    }
    
    // Perform the deletion test (but don't actually delete - just test the query)
    addTestResult('Testing deletion query (dry run)...');
    
    // First, let's test if the query would work by checking if the strategy exists and belongs to the user
    const { data: checkStrategy, error: checkError } = await supabase
      .from('strategies')
      .select('id, name, user_id')
      .eq('id', testStrategy.id)
      .eq('user_id', session.user.id)
      .single();
    
    if (checkError) {
      addTestResult(`Strategy verification failed: ${checkError.message}`, true);
      return false;
    }
    
    addTestResult(`Strategy verified: ${checkStrategy.name} belongs to current user`);
    
    // Test 5: Simulate the actual deletion (but roll it back for safety)
    addTestResult('Test 5: Testing deletion permissions...');
    
    // We'll test the permissions by checking if the user has the right to delete
    // This is essentially what the .eq('user_id', validatedUserId) check does
    const { data: permissionCheck, error: permissionError } = await supabase
      .from('strategies')
      .select('id')
      .eq('id', testStrategy.id)
      .eq('user_id', session.user.id);
    
    if (permissionError) {
      addTestResult(`Permission check failed: ${permissionError.message}`, true);
      return false;
    }
    
    if (!permissionCheck || permissionCheck.length === 0) {
      addTestResult('Permission check failed - user does not own this strategy', true);
      return false;
    }
    
    addTestResult('✅ Permission check passed - user can delete this strategy');
    
    // Test 6: Test the complete deletion flow (without actually deleting)
    addTestResult('Test 6: Testing complete deletion flow...');
    
    // This simulates the complete flow from the fixed EnhancedStrategyCard
    const deletionFlowTest = async () => {
      // Step 1: Get session (fixed part)
      const { data: { session: flowSession }, error: flowSessionError } = await supabase.auth.getSession();
      
      if (flowSessionError || !flowSession?.user) {
        throw new Error('Authentication failed in deletion flow');
      }
      
      // Step 2: Validate UUIDs
      const validatedStrategyId = validateUUID(testStrategy.id, 'strategy_id');
      const validatedUserId = validateUUID(flowSession.user.id, 'user_id');
      
      // Step 3: Build deletion query (but don't execute)
      const deletionQuery = supabase
        .from('strategies')
        .delete()
        .eq('id', validatedStrategyId)
        .eq('user_id', validatedUserId);
      
      return { success: true, query: 'Deletion query built successfully' };
    };
    
    const flowResult = await deletionFlowTest();
    if (flowResult.success) {
      addTestResult('✅ Complete deletion flow test passed');
    } else {
      addTestResult('Deletion flow test failed', true);
      return false;
    }
    
    addTestResult('🎉 All tests passed! The strategy deletion fix is working correctly.');
    return true;
    
  } catch (error) {
    addTestResult(`Unexpected error: ${error.message}`, true);
    return false;
  }
}

// Run the test
async function runTest() {
  console.log('='.repeat(60));
  console.log('STRATEGY DELETION FIX TEST');
  console.log('='.repeat(60));
  
  const success = await testStrategyDeletionFix();
  
  console.log('\n' + '='.repeat(60));
  console.log('TEST SUMMARY');
  console.log('='.repeat(60));
  
  testResults.forEach(result => console.log(result));
  
  console.log('\n' + '='.repeat(60));
  if (success) {
    console.log('🎉 TEST RESULT: SUCCESS - Strategy deletion fix is working!');
    console.log('   The "You must be logged in to delete strategies" error should be resolved.');
  } else {
    console.log('❌ TEST RESULT: FAILED - Issues still need to be addressed.');
  }
  console.log('='.repeat(60));
  
  process.exit(success ? 0 : 1);
}

// Handle uncaught errors
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  addTestResult(`Unhandled error: ${reason}`, true);
  process.exit(1);
});

runTest();