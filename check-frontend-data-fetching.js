const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function checkFrontendDataFetching() {
  console.log('🔍 [FRONTEND DIAGNOSIS] Checking frontend data fetching process...');
  
  // Initialize Supabase client
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ [FRONTEND DIAGNOSIS] Missing environment variables');
    return;
  }
  
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  
  try {
    // 1. Authenticate as testuser@verotrade.com
    console.log('\n🔍 [STEP 1] Authenticating as testuser@verotrade.com...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'testuser@verotrade.com',
      password: 'TestPassword123!'
    });
    
    if (authError) {
      console.error('❌ [STEP 1] Authentication failed:', authError.message);
      return;
    }
    
    const authenticatedUserId = authData.user.id;
    console.log(`✅ [STEP 1] Authenticated successfully with User ID: ${authenticatedUserId}`);
    
    // 2. Simulate the exact query that dashboard/page.tsx makes
    console.log('\n🔍 [STEP 2] Testing dashboard query (exact replica)...');
    console.log('📋 [STEP 2] Query: supabase.from("trades").select("*").eq("user_id", validatedUserId).order("trade_date", { ascending: false })');
    
    const { data: dashboardTrades, error: dashboardError } = await supabase
      .from('trades')
      .select('*')
      .eq('user_id', authenticatedUserId)
      .order('trade_date', { ascending: false });
    
    if (dashboardError) {
      console.error('❌ [STEP 2] Dashboard query failed:', dashboardError.message);
      console.error('❌ [STEP 2] Dashboard error details:', dashboardError);
    } else {
      console.log(`✅ [STEP 2] Dashboard query successful: ${dashboardTrades.length} trades found`);
      if (dashboardTrades.length > 0) {
        console.log('📋 [STEP 2] Sample trade data:');
        console.log(JSON.stringify(dashboardTrades[0], null, 2));
      }
    }
    
    // 3. Simulate the exact query that trades/page.tsx makes
    console.log('\n🔍 [STEP 3] Testing trades page query (with strategy join)...');
    console.log('📋 [STEP 3] Query: supabase.from("trades").select("*, strategies (id, name, rules)").eq("user_id", validatedUserId).order("trade_date", { ascending: false })');
    
    const { data: tradesPageData, error: tradesPageError } = await supabase
      .from('trades')
      .select(`
        *,
        strategies (
          id,
          name,
          rules
        )
      `)
      .eq('user_id', authenticatedUserId)
      .order('trade_date', { ascending: false });
    
    if (tradesPageError) {
      console.error('❌ [STEP 3] Trades page query failed:', tradesPageError.message);
      console.error('❌ [STEP 3] Trades page error details:', tradesPageError);
    } else {
      console.log(`✅ [STEP 3] Trades page query successful: ${tradesPageData.length} trades found`);
      if (tradesPageData.length > 0) {
        console.log('📋 [STEP 3] Sample trade with strategy data:');
        console.log(JSON.stringify(tradesPageData[0], null, 2));
      }
    }
    
    // 4. Test the strategies query
    console.log('\n🔍 [STEP 4] Testing strategies query...');
    console.log('📋 [STEP 4] Query: supabase.from("strategies").select("id, name").eq("user_id", validatedUserId).eq("is_active", true)');
    
    const { data: strategiesData, error: strategiesError } = await supabase
      .from('strategies')
      .select('id, name')
      .eq('user_id', authenticatedUserId)
      .eq('is_active', true);
    
    if (strategiesError) {
      console.error('❌ [STEP 4] Strategies query failed:', strategiesError.message);
      console.error('❌ [STEP 4] Strategies error details:', strategiesError);
    } else {
      console.log(`✅ [STEP 4] Strategies query successful: ${strategiesData.length} strategies found`);
      if (strategiesData.length > 0) {
        console.log('📋 [STEP 4] Strategy data:');
        strategiesData.forEach(strategy => {
          console.log(`  - ${strategy.name} (ID: ${strategy.id})`);
        });
      }
    }
    
    // 5. Check if there are any RLS (Row Level Security) issues
    console.log('\n🔍 [STEP 5] Testing RLS policies...');
    
    // Try to query without authentication (should fail if RLS is working)
    const anonClient = createClient(supabaseUrl, supabaseAnonKey);
    const { data: anonTrades, error: anonError } = await anonClient
      .from('trades')
      .select('id, user_id')
      .limit(1);
    
    if (anonError) {
      console.log('✅ [STEP 5] RLS is working - anonymous access denied:', anonError.message);
    } else {
      console.log('⚠️ [STEP 5] RLS might not be working - anonymous access allowed');
    }
    
    // 6. Check session persistence
    console.log('\n🔍 [STEP 6] Testing session persistence...');
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('❌ [STEP 6] Session check failed:', sessionError.message);
    } else {
      console.log(`✅ [STEP 6] Session is active: ${session ? 'YES' : 'NO'}`);
      if (session) {
        console.log(`📋 [STEP 6] Session User ID: ${session.user.id}`);
        console.log(`📋 [STEP 6] Session Email: ${session.user.email}`);
        console.log(`📋 [STEP 6] Session Expires At: ${session.expires_at}`);
      }
    }
    
    // 7. Summary
    console.log('\n🔍 [FRONTEND DIAGNOSIS] SUMMARY:');
    console.log(`✅ Authentication: SUCCESS`);
    console.log(`📊 Dashboard Query: ${dashboardError ? 'FAILED' : 'SUCCESS'} (${dashboardTrades?.length || 0} trades)`);
    console.log(`📊 Trades Page Query: ${tradesPageError ? 'FAILED' : 'SUCCESS'} (${tradesPageData?.length || 0} trades)`);
    console.log(`📊 Strategies Query: ${strategiesError ? 'FAILED' : 'SUCCESS'} (${strategiesData?.length || 0} strategies)`);
    console.log(`🔒 RLS Status: ${anonError ? 'WORKING' : 'POTENTIAL ISSUE'}`);
    console.log(`🔄 Session Persistence: ${session ? 'ACTIVE' : 'INACTIVE'}`);
    
    if (dashboardError || tradesPageError || strategiesError) {
      console.log('\n🚨 [PROBLEM] Database queries are failing. This could be the root cause of the issue.');
      console.log('🔧 [NEXT STEPS] Check database permissions, RLS policies, and schema consistency.');
    } else if (dashboardTrades.length === 0 && tradesPageData.length === 0) {
      console.log('\n🚨 [PROBLEM] Queries succeed but return no data. Check user ID association.');
    } else {
      console.log('\n✅ [NO BACKEND ISSUE] All database queries work correctly. The issue is likely in the frontend.');
      console.log('🔧 [NEXT STEPS] Check frontend state management, component rendering, and error handling.');
    }
    
  } catch (error) {
    console.error('❌ [FRONTEND DIAGNOSIS] Unexpected error:', error);
  }
}

checkFrontendDataFetching();