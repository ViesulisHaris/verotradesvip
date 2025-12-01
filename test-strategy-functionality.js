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

async function testStrategyPerformanceView() {
  console.log('=== TESTING STRATEGY PERFORMANCE VIEW ===\n');
  
  try {
    // Test 1: Basic strategy query
    console.log('Test 1: Basic strategy query...');
    const { data: strategies, error: strategiesError } = await supabase
      .from('strategies')
      .select('id, name, is_active, created_at, updated_at')
      .limit(5);
    
    if (strategiesError) {
      console.log('❌ Basic strategy query failed:', strategiesError.message);
      return false;
    } else {
      console.log('✅ Basic strategy query successful');
      console.log(`   Found ${strategies.length} strategies`);
    }
    
    // Test 2: Strategy with stats (more complex query)
    console.log('\nTest 2: Strategy with performance stats...');
    const { data: strategiesWithStats, error: statsError } = await supabase
      .from('strategies')
      .select(`
        id,
        name,
        is_active,
        created_at,
        trades:trades(count),
        total_profit:trades(profit_amount.sum())
      `)
      .limit(3);
    
    if (statsError) {
      console.log('❌ Strategy stats query failed:', statsError.message);
      return false;
    } else {
      console.log('✅ Strategy stats query successful');
      console.log(`   Found stats for ${strategiesWithStats.length} strategies`);
    }
    
    // Test 3: Individual strategy performance
    if (strategies.length > 0) {
      console.log('\nTest 3: Individual strategy performance...');
      const strategyId = strategies[0].id;
      
      const { data: performance, error: performanceError } = await supabase
        .from('trades')
        .select('profit_amount, entry_price, exit_price, trade_date')
        .eq('strategy_id', strategyId)
        .order('trade_date', { ascending: false })
        .limit(10);
      
      if (performanceError) {
        console.log('❌ Individual strategy performance query failed:', performanceError.message);
        return false;
      } else {
        console.log('✅ Individual strategy performance query successful');
        console.log(`   Found ${performance.length} trades for strategy`);
      }
    }
    
    console.log('\n✅ All strategy performance view tests passed');
    return true;
    
  } catch (error) {
    console.error('❌ Error testing strategy performance view:', error);
    return false;
  }
}

async function testStrategyModification() {
  console.log('\n=== TESTING STRATEGY MODIFICATION ===\n');
  
  try {
    // First, get a test user ID
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('id')
      .limit(1);
    
    if (userError || !users || users.length === 0) {
      console.log('❌ Could not find a test user');
      return false;
    }
    
    const userId = users[0].id;
    
    // Test 1: Create a new strategy
    console.log('Test 1: Creating new strategy...');
    const testStrategyName = `Test Strategy ${Date.now()}`;
    
    const { data: newStrategy, error: createError } = await supabase
      .from('strategies')
      .insert({
        name: testStrategyName,
        description: 'Test strategy for modification verification',
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
      console.log(`   Created strategy: ${newStrategy.name} (ID: ${newStrategy.id})`);
    }
    
    // Test 2: Modify the strategy
    console.log('\nTest 2: Modifying strategy...');
    const updatedDescription = 'Updated test strategy description';
    
    const { data: updatedStrategy, error: updateError } = await supabase
      .from('strategies')
      .update({
        description: updatedDescription,
        is_active: false
      })
      .eq('id', newStrategy.id)
      .select()
      .single();
    
    if (updateError) {
      console.log('❌ Strategy modification failed:', updateError.message);
      return false;
    } else {
      console.log('✅ Strategy modification successful');
      console.log(`   Updated description: ${updatedStrategy.description}`);
      console.log(`   Updated is_active: ${updatedStrategy.is_active}`);
    }
    
    // Store the strategy ID for deletion test
    const strategyToDelete = newStrategy.id;
    
    // Test 3: Verify the changes
    console.log('\nTest 3: Verifying strategy changes...');
    const { data: verifiedStrategy, error: verifyError } = await supabase
      .from('strategies')
      .select('name, description, is_active')
      .eq('id', strategyToDelete)
      .single();
    
    if (verifyError) {
      console.log('❌ Strategy verification failed:', verifyError.message);
      return false;
    } else {
      console.log('✅ Strategy verification successful');
      console.log(`   Verified description: ${verifiedStrategy.description}`);
      console.log(`   Verified is_active: ${verifiedStrategy.is_active}`);
    }
    
    console.log('\n✅ All strategy modification tests passed');
    return strategyToDelete; // Return ID for deletion test
    
  } catch (error) {
    console.error('❌ Error testing strategy modification:', error);
    return false;
  }
}

async function testStrategyDeletion(strategyId) {
  console.log('\n=== TESTING STRATEGY DELETION ===\n');
  
  try {
    if (!strategyId) {
      console.log('❌ No strategy ID provided for deletion test');
      return false;
    }
    
    // Test 1: Verify strategy exists before deletion
    console.log('Test 1: Verifying strategy exists before deletion...');
    const { data: existingStrategy, error: checkError } = await supabase
      .from('strategies')
      .select('name')
      .eq('id', strategyId)
      .single();
    
    if (checkError) {
      console.log('❌ Strategy existence check failed:', checkError.message);
      return false;
    } else {
      console.log('✅ Strategy exists for deletion');
      console.log(`   Strategy to delete: ${existingStrategy.name}`);
    }
    
    // Test 2: Delete the strategy
    console.log('\nTest 2: Deleting strategy...');
    const { error: deleteError } = await supabase
      .from('strategies')
      .delete()
      .eq('id', strategyId);
    
    if (deleteError) {
      console.log('❌ Strategy deletion failed:', deleteError.message);
      return false;
    } else {
      console.log('✅ Strategy deletion successful');
    }
    
    // Test 3: Verify strategy is deleted
    console.log('\nTest 3: Verifying strategy is deleted...');
    const { data: deletedStrategy, error: verifyError } = await supabase
      .from('strategies')
      .select('name')
      .eq('id', strategyId);
    
    if (verifyError) {
      console.log('❌ Strategy deletion verification failed:', verifyError.message);
      return false;
    } else if (deletedStrategy && deletedStrategy.length > 0) {
      console.log('❌ Strategy still exists after deletion');
      return false;
    } else {
      console.log('✅ Strategy deletion verified - strategy no longer exists');
    }
    
    console.log('\n✅ All strategy deletion tests passed');
    return true;
    
  } catch (error) {
    console.error('❌ Error testing strategy deletion:', error);
    return false;
  }
}

async function testBrowserStrategyAccess() {
  console.log('\n=== TESTING BROWSER STRATEGY ACCESS ===\n');
  
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    console.log('Test 1: Accessing strategies page...');
    await page.goto('http://localhost:3000/strategies');
    
    // Wait for page to load
    await page.waitForTimeout(3000);
    
    // Check if the page loads without errors
    const pageTitle = await page.title();
    console.log(`✅ Page loaded: ${pageTitle}`);
    
    // Check for strategy-related content
    const hasStrategyContent = await page.locator('body').textContent().then(text => {
      return text.includes('strategy') || text.includes('Strategy') || text.includes('strategies');
    });
    
    if (hasStrategyContent) {
      console.log('✅ Strategy content found on page');
    } else {
      console.log('⚠️  No explicit strategy content found (may need authentication)');
    }
    
    // Check for error messages
    const hasError = await page.locator('body').textContent().then(text => {
      return text.includes('error') || text.includes('Error') || text.includes('unexpected error');
    });
    
    if (hasError) {
      console.log('❌ Error message found on page');
      return false;
    } else {
      console.log('✅ No error messages found on page');
    }
    
    console.log('\n✅ Browser strategy access test passed');
    return true;
    
  } catch (error) {
    console.error('❌ Error testing browser strategy access:', error);
    return false;
  } finally {
    await browser.close();
  }
}

async function main() {
  console.log('🔧 TESTING STRATEGY FUNCTIONALITY AFTER SCHEMA CACHE CLEAR\n');
  
  let allTestsPassed = true;
  
  // Test 1: Strategy Performance View
  const performanceTestPassed = await testStrategyPerformanceView();
  if (!performanceTestPassed) {
    allTestsPassed = false;
    console.log('\n❌ Strategy performance view tests failed');
  }
  
  // Test 2: Strategy Modification
  const strategyId = await testStrategyModification();
  if (!strategyId) {
    allTestsPassed = false;
    console.log('\n❌ Strategy modification tests failed');
  }
  
  // Test 3: Strategy Deletion
  const deletionTestPassed = await testStrategyDeletion(strategyId);
  if (!deletionTestPassed) {
    allTestsPassed = false;
    console.log('\n❌ Strategy deletion tests failed');
  }
  
  // Test 4: Browser Strategy Access
  const browserTestPassed = await testBrowserStrategyAccess();
  if (!browserTestPassed) {
    allTestsPassed = false;
    console.log('\n❌ Browser strategy access tests failed');
  }
  
  // Final Summary
  console.log('\n' + '='.repeat(60));
  console.log('STRATEGY FUNCTIONALITY TEST SUMMARY');
  console.log('='.repeat(60));
  
  if (allTestsPassed) {
    console.log('🎉 ALL TESTS PASSED!');
    console.log('✅ Strategy performance viewing works correctly');
    console.log('✅ Strategy modification works correctly');
    console.log('✅ Strategy deletion works correctly');
    console.log('✅ Browser strategy access works correctly');
    console.log('\n🚀 The schema cache fix has resolved the strategy issues!');
  } else {
    console.log('❌ SOME TESTS FAILED');
    console.log('⚠️  There may still be issues with strategy functionality');
    console.log('🔧 Consider running AGGRESSIVE_SCHEMA_CACHE_CLEAR.sql');
  }
  
  console.log('='.repeat(60));
  
  return allTestsPassed;
}

main().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('Fatal error during testing:', error);
  process.exit(1);
});