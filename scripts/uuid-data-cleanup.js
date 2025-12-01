/**
 * UUID Data Cleanup Script
 * 
 * This script identifies and fixes orphaned records with invalid UUID references
 * in the database. It specifically looks for:
 * 1. Trades with invalid strategy_id references
 * 2. Strategy rules with invalid strategy_id references
 * 3. Any records with 'undefined' or null UUID values
 * 
 * Usage: node scripts/uuid-data-cleanup.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Validates if a string is a proper UUID format
 */
function isValidUUID(value) {
  if (!value || typeof value !== 'string') {
    return false;
  }
  
  const trimmedValue = value.trim();
  if (trimmedValue === '' || trimmedValue === 'undefined' || trimmedValue === 'null') {
    return false;
  }
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(trimmedValue);
}

/**
 * Finds and reports orphaned records
 */
async function findOrphanedRecords() {
  console.log('🔍 Searching for orphaned records with invalid UUID references...\n');
  
  let totalOrphaned = 0;
  
  // 1. Check for trades with invalid strategy_id
  try {
    console.log('📊 Checking trades table...');
    const { data: trades, error: tradesError } = await supabase
      .from('trades')
      .select('id, strategy_id, symbol')
      .not('strategy_id', 'is', null);
    
    if (tradesError) {
      console.error(`   ❌ Error fetching trades: ${tradesError.message}`);
    } else if (trades && trades.length > 0) {
      const orphanedTrades = trades.filter(trade => !isValidUUID(trade.strategy_id));
      
      if (orphanedTrades.length > 0) {
        console.log(`   ⚠️ Found ${orphanedTrades.length} trades with invalid strategy_id references`);
        orphanedTrades.forEach(trade => {
          console.log(`      - Trade ID: ${trade.id}, Strategy ID: ${trade.strategy_id}, Symbol: ${trade.symbol}`);
        });
        totalOrphaned += orphanedTrades.length;
      } else {
        console.log('   ✅ No trades with invalid strategy_id found');
      }
    }
  } catch (error) {
    console.error(`   ❌ Exception checking trades: ${error.message}`);
  }
  
  // 2. Check for strategy rules with invalid strategy_id
  try {
    console.log('\n📊 Checking strategy_rules table...');
    const { data: rules, error: rulesError } = await supabase
      .from('strategy_rules')
      .select('id, strategy_id, rule_text');
    
    if (rulesError) {
      console.error(`   ❌ Error fetching strategy rules: ${rulesError.message}`);
    } else if (rules && rules.length > 0) {
      const orphanedRules = rules.filter(rule => !isValidUUID(rule.strategy_id));
      
      if (orphanedRules.length > 0) {
        console.log(`   ⚠️ Found ${orphanedRules.length} strategy rules with invalid strategy_id references`);
        orphanedRules.forEach(rule => {
          console.log(`      - Rule ID: ${rule.id}, Strategy ID: ${rule.strategy_id}, Rule: ${rule.rule_text.substring(0, 50)}...`);
        });
        totalOrphaned += orphanedRules.length;
      } else {
        console.log('   ✅ No strategy rules with invalid strategy_id found');
      }
    }
  } catch (error) {
    console.error(`   ❌ Exception checking strategy rules: ${error.message}`);
  }
  
  // 3. Check for any records with 'undefined' string values in UUID columns
  try {
    console.log('\n📊 Checking for "undefined" string values in UUID columns...');
    
    // Check strategies table
    const { data: strategies, error: strategiesError } = await supabase
      .from('strategies')
      .select('id, name')
      .filter('id', 'eq', 'undefined');
    
    if (strategiesError) {
      console.error(`   ❌ Error checking strategies for undefined: ${strategiesError.message}`);
    } else if (strategies && strategies.length > 0) {
      console.log(`   ⚠️ Found ${strategies.length} strategies with 'undefined' ID`);
      totalOrphaned += strategies.length;
    } else {
      console.log('   ✅ No strategies with undefined ID found');
    }
    
    // Check trades table for undefined user_id or strategy_id
    const { data: undefinedTrades, error: undefinedTradesError } = await supabase
      .from('trades')
      .select('id, symbol')
      .or('user_id.eq.undefined,strategy_id.eq.undefined');
    
    if (undefinedTradesError) {
      console.error(`   ❌ Error checking trades for undefined: ${undefinedTradesError.message}`);
    } else if (undefinedTrades && undefinedTrades.length > 0) {
      console.log(`   ⚠️ Found ${undefinedTrades.length} trades with 'undefined' UUID values`);
      totalOrphaned += undefinedTrades.length;
    } else {
      console.log('   ✅ No trades with undefined UUID values found');
    }
    
    // Check strategy_rules table for undefined strategy_id
    const { data: undefinedRules, error: undefinedRulesError } = await supabase
      .from('strategy_rules')
      .select('id, rule_text')
      .filter('strategy_id', 'eq', 'undefined');
    
    if (undefinedRulesError) {
      console.error(`   ❌ Error checking strategy rules for undefined: ${undefinedRulesError.message}`);
    } else if (undefinedRules && undefinedRules.length > 0) {
      console.log(`   ⚠️ Found ${undefinedRules.length} strategy rules with 'undefined' strategy_id`);
      totalOrphaned += undefinedRules.length;
    } else {
      console.log('   ✅ No strategy rules with undefined strategy_id found');
    }
  } catch (error) {
    console.error(`   ❌ Exception checking for undefined values: ${error.message}`);
  }
  
  console.log(`\n📈 Summary: Found ${totalOrphaned} total orphaned records`);
  return totalOrphaned;
}

/**
 * Fixes orphaned records by setting invalid UUID references to null
 */
async function fixOrphanedRecords() {
  console.log('🔧 Fixing orphaned records...\n');
  
  let totalFixed = 0;
  
  // 1. Fix trades with invalid strategy_id
  try {
    console.log('🔧 Fixing trades with invalid strategy_id...');
    
    // First, get all trades with invalid strategy_id
    const { data: trades, error: fetchError } = await supabase
      .from('trades')
      .select('id, strategy_id')
      .not('strategy_id', 'is', null);
    
    if (fetchError) {
      console.error(`   ❌ Error fetching trades: ${fetchError.message}`);
    } else if (trades && trades.length > 0) {
      const invalidTrades = trades.filter(trade => !isValidUUID(trade.strategy_id));
      
      if (invalidTrades.length > 0) {
        console.log(`   🔄 Fixing ${invalidTrades.length} trades...`);
        
        // Update each trade to set strategy_id to null
        for (const trade of invalidTrades) {
          const { error: updateError } = await supabase
            .from('trades')
            .update({ strategy_id: null })
            .eq('id', trade.id);
          
          if (updateError) {
            console.error(`     ❌ Failed to update trade ${trade.id}: ${updateError.message}`);
          } else {
            console.log(`     ✅ Fixed trade ${trade.id} (was: ${trade.strategy_id})`);
            totalFixed++;
          }
        }
      } else {
        console.log('   ✅ No trades needed fixing');
      }
    }
  } catch (error) {
    console.error(`   ❌ Exception fixing trades: ${error.message}`);
  }
  
  // 2. Fix strategy rules with invalid strategy_id
  try {
    console.log('\n🔧 Fixing strategy rules with invalid strategy_id...');
    
    // First, get all strategy rules
    const { data: rules, error: fetchError } = await supabase
      .from('strategy_rules')
      .select('id, strategy_id');
    
    if (fetchError) {
      console.error(`   ❌ Error fetching strategy rules: ${fetchError.message}`);
    } else if (rules && rules.length > 0) {
      const invalidRules = rules.filter(rule => !isValidUUID(rule.strategy_id));
      
      if (invalidRules.length > 0) {
        console.log(`   🔄 Fixing ${invalidRules.length} strategy rules...`);
        
        // Delete strategy rules with invalid strategy_id (they can't be fixed)
        for (const rule of invalidRules) {
          const { error: deleteError } = await supabase
            .from('strategy_rules')
            .delete()
            .eq('id', rule.id);
          
          if (deleteError) {
            console.error(`     ❌ Failed to delete rule ${rule.id}: ${deleteError.message}`);
          } else {
            console.log(`     ✅ Deleted orphaned rule ${rule.id} (was: ${rule.strategy_id})`);
            totalFixed++;
          }
        }
      } else {
        console.log('   ✅ No strategy rules needed fixing');
      }
    }
  } catch (error) {
    console.error(`   ❌ Exception fixing strategy rules: ${error.message}`);
  }
  
  // 3. Delete any records with 'undefined' string values
  try {
    console.log('\n🔧 Removing records with "undefined" string values...');
    
    // Delete strategies with undefined ID
    const { error: deleteStrategiesError } = await supabase
      .from('strategies')
      .delete()
      .filter('id', 'eq', 'undefined');
    
    if (deleteStrategiesError) {
      console.error(`   ❌ Error deleting strategies with undefined ID: ${deleteStrategiesError.message}`);
    } else {
      console.log('   ✅ Removed strategies with undefined ID');
    }
    
    // Delete trades with undefined UUID values
    const { error: deleteTradesError } = await supabase
      .from('trades')
      .delete()
      .or('user_id.eq.undefined,strategy_id.eq.undefined');
    
    if (deleteTradesError) {
      console.error(`   ❌ Error deleting trades with undefined UUIDs: ${deleteTradesError.message}`);
    } else {
      console.log('   ✅ Removed trades with undefined UUID values');
    }
    
    // Delete strategy rules with undefined strategy_id
    const { error: deleteRulesError } = await supabase
      .from('strategy_rules')
      .delete()
      .filter('strategy_id', 'eq', 'undefined');
    
    if (deleteRulesError) {
      console.error(`   ❌ Error deleting strategy rules with undefined strategy_id: ${deleteRulesError.message}`);
    } else {
      console.log('   ✅ Removed strategy rules with undefined strategy_id');
    }
  } catch (error) {
    console.error(`   ❌ Exception removing undefined values: ${error.message}`);
  }
  
  console.log(`\n📈 Summary: Fixed ${totalFixed} orphaned records`);
  return totalFixed;
}

/**
 * Main function
 */
async function main() {
  console.log('🚀 Starting UUID Data Cleanup Script\n');
  
  try {
    // Step 1: Find orphaned records
    const orphanedCount = await findOrphanedRecords();
    
    if (orphanedCount === 0) {
      console.log('\n✅ No orphaned records found. Database is clean!');
      return;
    }
    
    console.log('\n⚠️ Orphaned records detected. These can cause "invalid input syntax for type uuid" errors.');
    
    // Step 2: Ask for confirmation before fixing
    console.log('\n❓ Do you want to fix these orphaned records?');
    console.log('   This will:');
    console.log('   - Set invalid strategy_id references to null in trades');
    console.log('   - Delete orphaned strategy rules');
    console.log('   - Remove records with "undefined" string values');
    console.log('\n   WARNING: This operation cannot be undone!');
    
    // In a real script, we would use readline for interactive confirmation
    // For now, we'll proceed with a warning
    console.log('\n🔄 Proceeding with cleanup in 5 seconds... (Press Ctrl+C to abort)');
    
    // Wait 5 seconds
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Step 3: Fix orphaned records
    const fixedCount = await fixOrphanedRecords();
    
    console.log(`\n✅ Cleanup completed! Fixed ${fixedCount} records.`);
    
    // Step 4: Verify the cleanup
    console.log('\n🔍 Verifying cleanup...');
    const remainingOrphaned = await findOrphanedRecords();
    
    if (remainingOrphaned === 0) {
      console.log('\n🎉 All orphaned records have been successfully fixed!');
    } else {
      console.log(`\n⚠️ ${remainingOrphaned} orphaned records remain. Manual intervention may be required.`);
    }
    
  } catch (error) {
    console.error(`\n❌ Fatal error: ${error.message}`);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  findOrphanedRecords,
  fixOrphanedRecords,
  isValidUUID
};