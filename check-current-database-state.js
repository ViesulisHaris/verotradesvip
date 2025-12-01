const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function checkCurrentDatabaseState() {
  console.log('🔍 CHECKING CURRENT DATABASE STATE');
  console.log('=====================================\n');

  // Initialize Supabase client
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Missing Supabase configuration in environment variables');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  try {
    // Check authentication first
    console.log('🔐 Checking authentication...');
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.log('⚠️ No authenticated user found, checking with service role...');
      
      // Try with service role key if available
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (serviceRoleKey) {
        const supabaseService = createClient(supabaseUrl, serviceRoleKey);
        
        // Get all users to check data
        const { data: users, error: usersError } = await supabaseService
          .from('profiles')
          .select('id, email');
          
        if (usersError) {
          console.error('❌ Error fetching users:', usersError.message);
          return;
        }
        
        console.log(`📊 Found ${users.length} users in the database`);
        
        // Check data for each user
        for (const user of users) {
          console.log(`\n🔍 Checking data for user: ${user.email || user.id}`);
          
          // Check trades
          const { data: trades, error: tradesError } = await supabaseService
            .from('trades')
            .select('id, symbol, trade_date, pnl, created_at')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });
            
          if (tradesError) {
            console.error(`❌ Error fetching trades for ${user.id}:`, tradesError.message);
          } else {
            console.log(`📈 Found ${trades.length} trades`);
            if (trades.length > 0) {
              console.log(`   Latest trade: ${trades[0].symbol} on ${trades[0].trade_date} (P&L: $${trades[0].pnl})`);
              console.log(`   Earliest trade: ${trades[trades.length-1].symbol} on ${trades[trades.length-1].trade_date}`);
            }
          }
          
          // Check strategies
          const { data: strategies, error: strategiesError } = await supabaseService
            .from('strategies')
            .select('id, name, is_active, created_at')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });
            
          if (strategiesError) {
            console.error(`❌ Error fetching strategies for ${user.id}:`, strategiesError.message);
          } else {
            console.log(`🎯 Found ${strategies.length} strategies`);
            if (strategies.length > 0) {
              console.log(`   Latest strategy: ${strategies[0].name} (${strategies[0].is_active ? 'Active' : 'Inactive'})`);
            }
          }
        }
        
        // Check overall database statistics
        console.log('\n📊 OVERALL DATABASE STATISTICS:');
        const { count: totalTrades, error: totalTradesError } = await supabaseService
          .from('trades')
          .select('*', { count: 'exact', head: true });
          
        const { count: totalStrategies, error: totalStrategiesError } = await supabaseService
          .from('strategies')
          .select('*', { count: 'exact', head: true });
          
        const { count: totalUsers, error: totalUsersError } = await supabaseService
          .from('profiles')
          .select('*', { count: 'exact', head: true });
          
        if (!totalTradesError && !totalStrategiesError && !totalUsersError) {
          console.log(`👥 Total Users: ${totalUsers}`);
          console.log(`📈 Total Trades: ${totalTrades}`);
          console.log(`🎯 Total Strategies: ${totalStrategies}`);
        }
        
      } else {
        console.error('❌ No service role key available for comprehensive check');
      }
    } else {
      console.log(`✅ Authenticated as user: ${user.email || user.id}`);
      
      // Check data for authenticated user
      const userId = user.id;
      
      // Check trades
      const { data: trades, error: tradesError } = await supabase
        .from('trades')
        .select('id, symbol, trade_date, pnl, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
        
      if (tradesError) {
        console.error('❌ Error fetching trades:', tradesError.message);
      } else {
        console.log(`📈 Found ${trades.length} trades for current user`);
        if (trades.length > 0) {
          console.log(`   Latest trade: ${trades[0].symbol} on ${trades[0].trade_date} (P&L: $${trades[0].pnl})`);
          console.log(`   Earliest trade: ${trades[trades.length-1].symbol} on ${trades[trades.length-1].trade_date}`);
        }
      }
      
      // Check strategies
      const { data: strategies, error: strategiesError } = await supabase
        .from('strategies')
        .select('id, name, is_active, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
        
      if (strategiesError) {
        console.error('❌ Error fetching strategies:', strategiesError.message);
      } else {
        console.log(`🎯 Found ${strategies.length} strategies for current user`);
        if (strategies.length > 0) {
          console.log(`   Latest strategy: ${strategies[0].name} (${strategies[0].is_active ? 'Active' : 'Inactive'})`);
        }
      }
    }
    
    // Check for any recent deletion operations in logs (if available)
    console.log('\n🔍 CHECKING FOR RECENT OPERATIONS...');
    
    // Look for any test result files that might indicate recent test runs
    const fs = require('fs');
    const testFiles = fs.readdirSync('.').filter(file => 
      file.includes('test-results') || 
      file.includes('comprehensive-test') ||
      file.includes('data-generation') ||
      file.includes('manual-system-integration')
    ).sort().reverse();
    
    if (testFiles.length > 0) {
      console.log(`📋 Found ${testFiles.length} recent test result files:`);
      testFiles.slice(0, 5).forEach(file => {
        const stats = fs.statSync(file);
        console.log(`   ${file} (Modified: ${stats.mtime.toISOString()})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error checking database state:', error.message);
  }
}

// Run the check
checkCurrentDatabaseState().then(() => {
  console.log('\n✅ Database state check completed');
}).catch(error => {
  console.error('❌ Error during database check:', error);
});