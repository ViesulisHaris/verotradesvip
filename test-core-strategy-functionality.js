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

async function testBasicStrategyQueries() {
  console.log('=== TESTING BASIC STRATEGY QUERIES ===\n');
  
  try {
    // Test 1: Basic strategy query
    console.log('Test 1: Basic strategy query...');
    const { data: strategies, error: strategiesError } = await supabase
      .from('strategies')
      .select('id, name, is_active, created_at')
      .limit(5);
    
    if (strategiesError) {
      console.log('❌ Basic strategy query failed:', strategiesError.message);
      if (strategiesError.message.includes('strategy_rule_compliance')) {
        console.log('⚠️  Schema cache issue still detected');
        return false;
      }
      return false;
    } else {
      console.log('✅ Basic strategy query successful');
      console.log(`   Found ${strategies.length} strategies`);
      if (strategies.length > 0) {
        console.log(`   Sample strategy: ${strategies[0].name} (ID: ${strategies[0].id})`);
      }
    }
    
    // Test 2: Strategy with trades relationship (without aggregates)
    console.log('\nTest 2: Strategy with trades relationship...');
    if (strategies.length > 0) {
      const { data: strategyWithTrades, error: tradesError } = await supabase
        .from('strategies')
        .select(`
          id,
          name,
          trades:trades(id, profit_amount, trade_date)
        `)
        .eq('id', strategies[0].id)
        .single();
      
      if (tradesError) {
        console.log('❌ Strategy-trades relationship query failed:', tradesError.message);
        return false;
      } else {
        console.log('✅ Strategy-trades relationship query successful');
        console.log(`   Found ${strategyWithTrades.trades?.length || 0} trades for strategy`);
      }
    }
    
    console.log('\n✅ All basic strategy query tests passed');
    return true;
    
  } catch (error) {
    console.error('❌ Error testing basic strategy queries:', error);
    return false;
  }
}

async function testStrategyCRUD() {
  console.log('\n=== TESTING STRATEGY CRUD OPERATIONS ===\n');
  
  try {
    // Get a test user ID from auth.users or create a test record
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError || !authUsers.users || authUsers.users.length === 0) {
      console.log('⚠️  No auth users found, trying to find user in public.users table...');
      
      const { data: publicUsers, error: publicError } = await supabase
        .from('users')
        .select('id')
        .limit(1);
      
      if (publicError || !publicUsers || publicUsers.length === 0) {
        console.log('❌ Could not find any test user for CRUD operations');
        return false;
      }
      
      var userId = publicUsers[0].id;
    } else {
      var userId = authUsers.users[0].id;
    }
    
    console.log(`Using user ID: ${userId}`);
    
    // Test 1: Create strategy
    console.log('\nTest 1: Creating strategy...');
    const testStrategyName = `Test Strategy ${Date.now()}`;
    
    const { data: newStrategy, error: createError } = await supabase
      .from('strategies')
      .insert({
        name: testStrategyName,
        description: 'Test strategy for CRUD verification',
        user_id: userId,
        is_active: true
      })
      .select()
      .single();
    
    if (createError) {
      console.log('❌ Strategy creation failed:', createError.message);
      return false;
    } else {
      console.log('✅ Strategy creation successful');
      console.log(`   Created: ${newStrategy.name} (ID: ${newStrategy.id})`);
    }
    
    // Test 2: Update strategy
    console.log('\nTest 2: Updating strategy...');
    const { data: updatedStrategy, error: updateError } = await supabase
      .from('strategies')
      .update({
        description: 'Updated description',
        is_active: false
      })
      .eq('id', newStrategy.id)
      .select()
      .single();
    
    if (updateError) {
      console.log('❌ Strategy update failed:', updateError.message);
      return false;
    } else {
      console.log('✅ Strategy update successful');
      console.log(`   Updated description: ${updatedStrategy.description}`);
      console.log(`   Updated is_active: ${updatedStrategy.is_active}`);
    }
    
    // Test 3: Delete strategy
    console.log('\nTest 3: Deleting strategy...');
    const { error: deleteError } = await supabase
      .from('strategies')
      .delete()
      .eq('id', newStrategy.id);
    
    if (deleteError) {
      console.log('❌ Strategy deletion failed:', deleteError.message);
      return false;
    } else {
      console.log('✅ Strategy deletion successful');
    }
    
    // Test 4: Verify deletion
    console.log('\nTest 4: Verifying strategy deletion...');
    const { data: deletedCheck, error: verifyError } = await supabase
      .from('strategies')
      .select('id')
      .eq('id', newStrategy.id);
    
    if (verifyError) {
      console.log('❌ Deletion verification failed:', verifyError.message);
      return false;
    } else if (deletedCheck && deletedCheck.length > 0) {
      console.log('❌ Strategy still exists after deletion');
      return false;
    } else {
      console.log('✅ Strategy deletion verified');
    }
    
    console.log('\n✅ All strategy CRUD tests passed');
    return true;
    
  } catch (error) {
    console.error('❌ Error testing strategy CRUD:', error);
    return false;
  }
}

async function testBrowserStrategyPage() {
  console.log('\n=== TESTING BROWSER STRATEGY PAGE ===\n');
  
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    console.log('Test 1: Accessing strategies page...');
    await page.goto('http://localhost:3000/strategies');
    
    // Wait for page to load
    await page.waitForTimeout(5000);
    
    // Check page title
    const pageTitle = await page.title();
    console.log(`✅ Page loaded: ${pageTitle}`);
    
    // Check for strategy-related elements
    const pageContent = await page.content();
    
    // Look for strategy content
    const hasStrategyHeading = pageContent.includes('Strategy') || pageContent.includes('strategy');
    const hasError = pageContent.includes('unexpected error') || 
                   pageContent.includes('An unexpected error occurred') ||
                   pageContent.includes('error loading');
    
    if (hasStrategyHeading) {
      console.log('✅ Strategy content found on page');
    } else {
      console.log('⚠️  No explicit strategy heading found');
    }
    
    if (hasError) {
      console.log('❌ Error message found on page');
      console.log('   This indicates the strategy loading issue may still exist');
      return false;
    } else {
      console.log('✅ No error messages found on page');
    }
    
    // Try to find any strategy cards or list items
    const strategyElements = await page.locator('[data-testid*="strategy"], .strategy, #strategies').count();
    if (strategyElements > 0) {
      console.log(`✅ Found ${strategyElements} strategy-related elements`);
    } else {
      console.log('⚠️  No strategy elements found (may need authentication)');
    }
    
    console.log('\n✅ Browser strategy page test completed');
    return true;
    
  } catch (error) {
    console.error('❌ Error testing browser strategy page:', error);
    return false;
  } finally {
    await browser.close();
  }
}

async function main() {
  console.log('🔧 TESTING CORE STRATEGY FUNCTIONALITY AFTER AGGRESSIVE CACHE CLEAR\n');
  
  let allTestsPassed = true;
  
  // Test 1: Basic Strategy Queries
  const queryTestPassed = await testBasicStrategyQueries();
  if (!queryTestPassed) {
    allTestsPassed = false;
    console.log('\n❌ Basic strategy query tests failed');
  }
  
  // Test 2: Strategy CRUD Operations
  const crudTestPassed = await testStrategyCRUD();
  if (!crudTestPassed) {
    allTestsPassed = false;
    console.log('\n❌ Strategy CRUD tests failed');
  }
  
  // Test 3: Browser Strategy Page
  const browserTestPassed = await testBrowserStrategyPage();
  if (!browserTestPassed) {
    allTestsPassed = false;
    console.log('\n❌ Browser strategy page tests failed');
  }
  
  // Final Summary
  console.log('\n' + '='.repeat(70));
  console.log('CORE STRATEGY FUNCTIONALITY TEST SUMMARY');
  console.log('='.repeat(70));
  
  if (allTestsPassed) {
    console.log('🎉 ALL CORE TESTS PASSED!');
    console.log('✅ Basic strategy queries work correctly');
    console.log('✅ Strategy CRUD operations work correctly');
    console.log('✅ Browser strategy page loads without errors');
    console.log('\n🚀 The aggressive schema cache fix has resolved the strategy issues!');
    console.log('   The "An unexpected error occurred while loading the strategy" issue is FIXED');
  } else {
    console.log('❌ SOME CORE TESTS FAILED');
    console.log('⚠️  There may still be issues with strategy functionality');
    console.log('   Further investigation may be needed');
  }
  
  console.log('='.repeat(70));
  
  return allTestsPassed;
}

main().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('Fatal error during testing:', error);
  process.exit(1);
});