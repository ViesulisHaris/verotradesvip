/**
 * Diagnostic Script for "Error Fetching Trades" Issue
 * 
 * This script will help identify the root cause of the flashing "error fetching trades" message
 * by testing different components of the data fetching pipeline.
 */

console.log('🔍 [TRADES_FETCHING_DEBUG] Starting comprehensive trades fetching diagnosis...');

// Test 1: Check Supabase Client Configuration
console.log('\n=== TEST 1: Supabase Client Configuration ===');
try {
  // Import and test Supabase client
  const { supabase, getSupabaseClient, getSupabaseInitializationStatus } = require('./src/supabase/client.ts');
  
  const status = getSupabaseInitializationStatus();
  console.log('Supabase Initialization Status:', status);
  
  if (!status.isInitialized) {
    console.error('❌ Supabase client not initialized:', status.error);
  } else {
    console.log('✅ Supabase client initialized successfully');
  }
  
  // Test client functionality
  const client = getSupabaseClient();
  console.log('Client available:', !!client);
  console.log('Client auth available:', !!client?.auth);
  
} catch (error) {
  console.error('❌ Error testing Supabase client:', error.message);
}

// Test 2: Authentication State
console.log('\n=== TEST 2: Authentication State ===');
try {
  // Check if we can get current session
  if (typeof window !== 'undefined') {
    const { supabase } = require('./src/supabase/client.ts');
    
    supabase.auth.getSession().then(({ data, error }) => {
      console.log('Session check result:', {
        hasSession: !!data.session,
        hasError: !!error,
        error: error?.message,
        userEmail: data.session?.user?.email
      });
      
      if (error) {
        console.error('❌ Authentication error:', error);
      } else if (!data.session) {
        console.warn('⚠️ No active session found');
      } else {
        console.log('✅ Valid authentication session');
      }
    });
  }
} catch (error) {
  console.error('❌ Error checking authentication:', error.message);
}

// Test 3: Direct Database Query Test
console.log('\n=== TEST 3: Direct Database Query Test ===');
try {
  const { supabase } = require('./src/supabase/client.ts');
  
  // Test simple query to trades table
  const testQuery = async () => {
    try {
      console.log('Testing basic trades query...');
      
      // First, get current session
      const { data: sessionData } = await supabase.auth.getSession();
      
      if (!sessionData.session?.user?.id) {
        console.error('❌ No authenticated user for query test');
        return;
      }
      
      console.log('Testing with user ID:', sessionData.session.user.id);
      
      // Test basic query
      const { data, error, count } = await supabase
        .from('trades')
        .select('*', { count: 'exact' })
        .eq('user_id', sessionData.session.user.id)
        .limit(1);
      
      console.log('Basic query result:', {
        hasData: !!data,
        dataLength: data?.length || 0,
        hasError: !!error,
        error: error?.message,
        count,
        errorCode: error?.code,
        errorDetails: error?.details
      });
      
      if (error) {
        console.error('❌ Database query error:', error);
        
        // Analyze specific error types
        if (error.code === 'PGRST116') {
          console.error('Schema/permission error - check RLS policies');
        } else if (error.code?.startsWith('42')) {
          console.error('PostgreSQL error - check database connection');
        } else if (error.message?.includes('JWT')) {
          console.error('JWT/authentication error');
        }
      } else {
        console.log('✅ Basic query successful');
      }
      
      // Test with pagination (like fetchTradesPaginated)
      console.log('Testing paginated query...');
      const { data: paginatedData, error: paginatedError } = await supabase
        .from('trades')
        .select(`
          *,
          strategies (
            id,
            name,
            rules
          )
        `, { count: 'exact' })
        .eq('user_id', sessionData.session.user.id)
        .range(0, 24)
        .order('trade_date', { ascending: false });
      
      console.log('Paginated query result:', {
        hasData: !!paginatedData,
        dataLength: paginatedData?.length || 0,
        hasError: !!paginatedError,
        error: paginatedError?.message,
        errorCode: paginatedError?.code
      });
      
      if (paginatedError) {
        console.error('❌ Paginated query error:', paginatedError);
      } else {
        console.log('✅ Paginated query successful');
      }
      
    } catch (queryError) {
      console.error('❌ Exception during query test:', queryError);
    }
  };
  
  testQuery();
  
} catch (error) {
  console.error('❌ Error setting up database test:', error.message);
}

// Test 4: UUID Validation
console.log('\n=== TEST 4: UUID Validation ===');
try {
  const { validateUUID, isValidUUID } = require('./src/lib/uuid-validation.ts');
  
  // Test various UUID scenarios
  const testUUIDs = [
    '123e4567-e89b-12d3-a456-426614174000', // Valid
    'invalid-uuid', // Invalid format
    '', // Empty
    null, // Null
    undefined, // Undefined
    'undefined' // String 'undefined'
  ];
  
  testUUIDs.forEach((uuid, index) => {
    try {
      const result = validateUUID(uuid, `testUUIDs[${index}]`);
      console.log(`✅ UUID ${index}: Valid - ${result}`);
    } catch (error) {
      console.log(`❌ UUID ${index}: Invalid - ${error.message}`);
    }
  });
  
} catch (error) {
  console.error('❌ Error testing UUID validation:', error.message);
}

// Test 5: Network/Environment Issues
console.log('\n=== TEST 5: Network & Environment ===');
try {
  console.log('Environment variables check:');
  console.log('NODE_ENV:', process.env.NODE_ENV);
  console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'MISSING');
  console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'MISSING');
  
  if (typeof window !== 'undefined') {
    console.log('Browser info:');
    console.log('User agent:', navigator.userAgent);
    console.log('Online status:', navigator.onLine);
    
    // Test network connectivity to Supabase
    const { supabase } = require('./src/supabase/client.ts');
    const url = supabase.supabaseUrl;
    console.log('Testing connectivity to:', url);
    
    fetch(url + '/rest/v1/', { 
      method: 'HEAD',
      mode: 'no-cors'
    }).then(response => {
      console.log('✅ Network connectivity test - Status:', response.status);
    }).catch(error => {
      console.error('❌ Network connectivity test failed:', error.message);
    });
  }
  
} catch (error) {
  console.error('❌ Error checking environment:', error.message);
}

// Test 6: Error Message Display Analysis
console.log('\n=== TEST 6: Error Message Display Analysis ===');
console.log('Looking for components that display "Error fetching trades"...');

// Check if error message appears in trades page
try {
  const fs = require('fs');
  const tradesPageContent = fs.readFileSync('./src/app/trades/page.tsx', 'utf8');
  
  const errorMatches = tradesPageContent.match(/Error fetching trades/gi);
  if (errorMatches) {
    console.log(`✅ Found "${errorMatches[0]}" in trades page ${errorMatches.length} times`);
    
    // Find the lines where error is set
    const lines = tradesPageContent.split('\n');
    lines.forEach((line, index) => {
      if (line.includes('Error fetching trades')) {
        console.log(`Line ${index + 1}: ${line.trim()}`);
      }
    });
  } else {
    console.log('❌ "Error fetching trades" not found in trades page');
  }
  
  // Check dashboard page too
  const dashboardPageContent = fs.readFileSync('./src/app/dashboard/page.tsx', 'utf8');
  const dashboardErrorMatches = dashboardPageContent.match(/Failed to load dashboard data/gi);
  if (dashboardErrorMatches) {
    console.log(`✅ Found "${dashboardErrorMatches[0]}" in dashboard page ${dashboardErrorMatches.length} times`);
  } else {
    console.log('❌ Dashboard error message not found');
  }
  
} catch (error) {
  console.error('❌ Error analyzing error messages:', error.message);
}

console.log('\n=== DIAGNOSTIC COMPLETE ===');
console.log('🔍 Review the results above to identify the root cause of "Error fetching trades"');
console.log('📝 Common causes to look for:');
console.log('   1. Authentication/session issues');
console.log('   2. Supabase client initialization problems');
console.log('   3. Database query errors (permissions, schema)');
console.log('   4. UUID validation failures');
console.log('   5. Network connectivity issues');
console.log('   6. Environment variable problems');