const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Test script to validate AuthSessionMissingError diagnosis
async function runAuthDiagnosis() {
  console.log('🔍 Starting calendar authentication diagnosis...');
  
  // Check environment variables
  console.log('🔍 Test 1: Environment variables check:');
  console.log(`   - NEXT_PUBLIC_SUPABASE_URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'MISSING'}`);
  console.log(`   - NEXT_PUBLIC_SUPABASE_ANON_KEY: ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'MISSING'}`);
  
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.error('❌ Environment variables are missing');
    return;
  }
  
  // Create Supabase client
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
        storageKey: 'sb-auth-token',
      }
    }
  );
  
  console.log('✅ Test 2: Supabase client created successfully');
  
  // Test 3: Immediate session check (simulating calendar page behavior)
  console.log('🔍 Test 3: Immediate session check (simulating calendar page)...');
  const immediateSessionStart = Date.now();
  
  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    const immediateSessionEnd = Date.now();
    
    console.log(`   - Session check time: ${immediateSessionEnd - immediateSessionStart}ms`);
    console.log(`   - Has session: ${!!session}`);
    console.log(`   - User ID: ${session?.user?.id || 'None'}`);
    console.log(`   - Error: ${sessionError?.message || 'None'}`);
    
    // Test 4: Try getUser() immediately (this is where the error occurs)
    console.log('🔍 Test 4: Immediate getUser() call (this is where AuthSessionMissingError occurs)...');
    const getUserStart = Date.now();
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    const getUserEnd = Date.now();
    
    console.log(`   - getUser() time: ${getUserEnd - getUserStart}ms`);
    console.log(`   - Has user: ${!!user}`);
    console.log(`   - User ID: ${user?.id || 'None'}`);
    console.log(`   - Error: ${userError?.message || 'None'}`);
    
    if (userError?.name === 'AuthSessionMissingError') {
      console.log('🚨 CONFIRMED: AuthSessionMissingError detected!');
      console.log(`   - Error details: ${JSON.stringify(userError, null, 2)}`);
    }
    
    // Test 5: Wait and retry (simulating proper initialization)
    console.log('🔍 Test 5: Waiting 500ms for AuthProvider initialization...');
    await new Promise(resolve => setTimeout(resolve, 500));
    
    console.log('🔍 Test 6: Session check after wait...');
    const { data: { session: waitedSession }, error: waitedSessionError } = await supabase.auth.getSession();
    
    console.log(`   - Has session: ${!!waitedSession}`);
    console.log(`   - User ID: ${waitedSession?.user?.id || 'None'}`);
    console.log(`   - Error: ${waitedSessionError?.message || 'None'}`);
    
    // Test 7: Try getUser() after wait
    if (waitedSession) {
      console.log('🔍 Test 7: getUser() call after confirmed session...');
      const { data: { user: confirmedUser }, error: confirmedError } = await supabase.auth.getUser();
      
      console.log(`   - Has user: ${!!confirmedUser}`);
      console.log(`   - User ID: ${confirmedUser?.id || 'None'}`);
      console.log(`   - Error: ${confirmedError?.message || 'None'}`);
    }
    
    // Test 8: Simulate calendar page fetchTrades behavior
    console.log('🔍 Test 8: Simulating calendar page fetchTrades() behavior...');
    try {
      // First getSession() (like calendar page does)
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.log(`   - Session error: ${sessionError.message}`);
        return;
      }
      
      if (!session) {
        console.log(`   - No session found, would skip fetch`);
        return;
      }
      
      // Then getUser() (like calendar page does)
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        console.log(`   - User error: ${userError.message}`);
        if (userError.name === 'AuthSessionMissingError') {
          console.log('🚨 CONFIRMED: Race condition detected! Session exists but getUser() fails.');
        }
        return;
      }
      
      if (!user) {
        console.log(`   - No user found despite having session`);
        return;
      }
      
      console.log(`   - Successfully authenticated: ${user.id}`);
      
      // Try to fetch trades (like calendar page does)
      const { data: trades, error: tradesError } = await supabase
        .from('trades')
        .select('*')
        .eq('user_id', user.id)
        .limit(5);
        
      if (tradesError) {
        console.log(`   - Trades error: ${tradesError.message}`);
      } else {
        console.log(`   - Successfully fetched ${trades?.length || 0} trades`);
      }
      
    } catch (error) {
      console.log(`🚨 Exception in fetchTrades simulation: ${error.message}`);
    }
    
  } catch (error) {
    console.error('🚨 Test failed with exception:', error.message);
  }
  
  console.log('✅ Authentication diagnosis completed!');
}

// Run the diagnosis
runAuthDiagnosis().catch(console.error);