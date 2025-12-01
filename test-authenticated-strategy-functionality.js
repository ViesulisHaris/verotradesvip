const { createClient } = require('@supabase/supabase-js');
const { chromium } = require('playwright');
require('dotenv').config();

// Get Supabase configuration from environment
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase configuration in environment variables');
  process.exit(1);
}

// Create Supabase client with service role key for admin access
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createTestUser() {
  console.log('=== CREATING TEST USER ===\n');
  
  try {
    // Create a test user with auth
    const testEmail = `test-${Date.now()}@example.com`;
    const testPassword = 'TestPassword123!';
    
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true
    });
    
    if (authError) {
      console.log('❌ Failed to create test user:', authError.message);
      return null;
    }
    
    console.log('✅ Test user created successfully');
    console.log(`   Email: ${testEmail}`);
    console.log(`   User ID: ${authData.user.id}`);
    
    // Create corresponding user record in public.users table
    const { error: userError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        email: testEmail
      });
    
    if (userError) {
      console.log('⚠️  Warning: Could not create public user record:', userError.message);
    } else {
      console.log('✅ Public user record created');
    }
    
    return {
      id: authData.user.id,
      email: testEmail,
      password: testPassword
    };
    
  } catch (error) {
    console.error('❌ Error creating test user:', error);
    return null;
  }
}

async function testAuthenticatedStrategyAccess(testUser) {
  console.log('\n=== TESTING AUTHENTICATED STRATEGY ACCESS ===\n');
  
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    // Step 1: Navigate to login page
    console.log('Step 1: Navigating to login page...');
    await page.goto('http://localhost:3000/login');
    await page.waitForTimeout(2000);
    
    // Step 2: Login with test user
    console.log('Step 2: Logging in with test user...');
    await page.fill('input[type="email"]', testUser.email);
    await page.fill('input[type="password"]', testUser.password);
    await page.click('button[type="submit"]');
    
    // Wait for login to complete
    await page.waitForTimeout(3000);
    
    // Step 3: Navigate to strategies page
    console.log('Step 3: Navigating to strategies page...');
    await page.goto('http://localhost:3000/strategies');
    await page.waitForTimeout(3000);
    
    // Step 4: Check for strategy loading errors
    console.log('Step 4: Checking for strategy loading errors...');
    const pageContent = await page.content();
    
    const hasStrategyError = pageContent.includes('An unexpected error occurred while loading the strategy') ||
                          pageContent.includes('unexpected error occurred while loading') ||
                          pageContent.includes('Please try again');
    
    if (hasStrategyError) {
      console.log('❌ Strategy loading error still present!');
      console.log('   The schema cache fix may not have resolved the issue');
      return false;
    } else {
      console.log('✅ No strategy loading errors found');
    }
    
    // Step 5: Check for strategy content
    const hasStrategyContent = pageContent.includes('Strategy') || 
                             pageContent.includes('strategies') ||
                             pageContent.includes('Create Strategy');
    
    if (hasStrategyContent) {
      console.log('✅ Strategy content found on page');
    } else {
      console.log('⚠️  No explicit strategy content found (page may be loading)');
    }
    
    // Step 6: Try to find strategy creation button
    const createButtonExists = await page.locator('button:has-text("Create"), button:has-text("Add"), button:has-text("New")').count() > 0;
    
    if (createButtonExists) {
      console.log('✅ Strategy creation button found');
    } else {
      console.log('⚠️  No strategy creation button found');
    }
    
    console.log('\n✅ Authenticated strategy access test completed');
    return true;
    
  } catch (error) {
    console.error('❌ Error testing authenticated strategy access:', error);
    return false;
  } finally {
    await browser.close();
  }
}

async function testStrategyCRUDWithAuth(testUser) {
  console.log('\n=== TESTING STRATEGY CRUD WITH AUTHENTICATION ===\n');
  
  try {
    // Create a client with the test user's session
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: testUser.email,
      password: testUser.password
    });
    
    if (signInError) {
      console.log('❌ Failed to sign in test user:', signInError.message);
      return false;
    }
    
    // Create a client with the user's session
    const userClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });
    
    // Set the session
    await userClient.auth.setSession(signInData.session);
    
    // Test 1: Create strategy as authenticated user
    console.log('Test 1: Creating strategy as authenticated user...');
    const { data: newStrategy, error: createError } = await userClient
      .from('strategies')
      .insert({
        name: `Authenticated Test Strategy ${Date.now()}`,
        description: 'Test strategy created by authenticated user',
        user_id: testUser.id,
        is_active: true
      })
      .select()
      .single();
    
    if (createError) {
      console.log('❌ Authenticated strategy creation failed:', createError.message);
      return false;
    } else {
      console.log('✅ Authenticated strategy creation successful');
      console.log(`   Created: ${newStrategy.name} (ID: ${newStrategy.id})`);
    }
    
    // Test 2: Update strategy as authenticated user
    console.log('\nTest 2: Updating strategy as authenticated user...');
    const { data: updatedStrategy, error: updateError } = await userClient
      .from('strategies')
      .update({
        description: 'Updated by authenticated user',
        is_active: false
      })
      .eq('id', newStrategy.id)
      .select()
      .single();
    
    if (updateError) {
      console.log('❌ Authenticated strategy update failed:', updateError.message);
      return false;
    } else {
      console.log('✅ Authenticated strategy update successful');
      console.log(`   Updated description: ${updatedStrategy.description}`);
    }
    
    // Test 3: Delete strategy as authenticated user
    console.log('\nTest 3: Deleting strategy as authenticated user...');
    const { error: deleteError } = await userClient
      .from('strategies')
      .delete()
      .eq('id', newStrategy.id);
    
    if (deleteError) {
      console.log('❌ Authenticated strategy deletion failed:', deleteError.message);
      return false;
    } else {
      console.log('✅ Authenticated strategy deletion successful');
    }
    
    // Test 4: Verify deletion
    console.log('\nTest 4: Verifying authenticated strategy deletion...');
    const { data: deletedCheck, error: verifyError } = await userClient
      .from('strategies')
      .select('id')
      .eq('id', newStrategy.id);
    
    if (verifyError) {
      console.log('❌ Deletion verification failed:', verifyError.message);
      return false;
    } else if (deletedCheck && deletedCheck.length > 0) {
      console.log('❌ Strategy still exists after authenticated deletion');
      return false;
    } else {
      console.log('✅ Authenticated strategy deletion verified');
    }
    
    console.log('\n✅ All authenticated strategy CRUD tests passed');
    return true;
    
  } catch (error) {
    console.error('❌ Error testing authenticated strategy CRUD:', error);
    return false;
  }
}

async function cleanupTestUser(testUser) {
  console.log('\n=== CLEANING UP TEST USER ===\n');
  
  try {
    // Delete user's strategies first
    const { error: strategiesError } = await supabase
      .from('strategies')
      .delete()
      .eq('user_id', testUser.id);
    
    if (strategiesError) {
      console.log('⚠️  Warning: Could not delete user strategies:', strategiesError.message);
    }
    
    // Delete user from auth
    const { error: authError } = await supabase.auth.admin.deleteUser(testUser.id);
    
    if (authError) {
      console.log('⚠️  Warning: Could not delete auth user:', authError.message);
    } else {
      console.log('✅ Auth user deleted');
    }
    
    // Delete user from public.users table
    const { error: userError } = await supabase
      .from('users')
      .delete()
      .eq('id', testUser.id);
    
    if (userError) {
      console.log('⚠️  Warning: Could not delete public user:', userError.message);
    } else {
      console.log('✅ Public user deleted');
    }
    
    console.log('✅ Test user cleanup completed');
    
  } catch (error) {
    console.error('❌ Error cleaning up test user:', error);
  }
}

async function main() {
  console.log('🔧 TESTING AUTHENTICATED STRATEGY FUNCTIONALITY AFTER SCHEMA CACHE FIX\n');
  
  let testUser = null;
  let allTestsPassed = true;
  
  try {
    // Create test user
    testUser = await createTestUser();
    if (!testUser) {
      console.log('\n❌ Failed to create test user');
      allTestsPassed = false;
    }
    
    if (testUser) {
      // Test 1: Authenticated Strategy Access
      const accessTestPassed = await testAuthenticatedStrategyAccess(testUser);
      if (!accessTestPassed) {
        allTestsPassed = false;
        console.log('\n❌ Authenticated strategy access tests failed');
      }
      
      // Test 2: Authenticated Strategy CRUD
      const crudTestPassed = await testStrategyCRUDWithAuth(testUser);
      if (!crudTestPassed) {
        allTestsPassed = false;
        console.log('\n❌ Authenticated strategy CRUD tests failed');
      }
    }
    
  } finally {
    // Cleanup test user
    if (testUser) {
      await cleanupTestUser(testUser);
    }
  }
  
  // Final Summary
  console.log('\n' + '='.repeat(80));
  console.log('AUTHENTICATED STRATEGY FUNCTIONALITY TEST SUMMARY');
  console.log('='.repeat(80));
  
  if (allTestsPassed) {
    console.log('🎉 ALL AUTHENTICATED TESTS PASSED!');
    console.log('✅ Authenticated users can access strategies without errors');
    console.log('✅ Authenticated users can create, update, and delete strategies');
    console.log('✅ No "An unexpected error occurred while loading the strategy" messages');
    console.log('\n🚀 THE SCHEMA CACHE FIX HAS SUCCESSFULLY RESOLVED THE STRATEGY ISSUES!');
    console.log('   Users can now access and manage their strategies properly');
  } else {
    console.log('❌ SOME AUTHENTICATED TESTS FAILED');
    console.log('⚠️  There may still be issues with strategy functionality');
    console.log('   The schema cache fix may need additional work');
  }
  
  console.log('='.repeat(80));
  
  return allTestsPassed;
}

main().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('Fatal error during testing:', error);
  process.exit(1);
});