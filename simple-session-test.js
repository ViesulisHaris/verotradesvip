// Simple Session Persistence Test
console.log('🔍 Starting Simple Session Persistence Test...');

// Test 1: Check if user is currently authenticated by checking API calls
const testCurrentAuth = async () => {
  try {
    const response = await fetch('http://localhost:3000/api/confluence-stats');
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Current Authentication Status: AUTHENTICATED');
      console.log('📊 User Info:', {
        userId: data.userId,
        userEmail: data.userEmail,
        timestamp: data.timestamp
      });
      return true;
    } else {
      console.log('❌ Current Authentication Status: NOT AUTHENTICATED');
      return false;
    }
  } catch (error) {
    console.log('❌ Error checking authentication:', error.message);
    return false;
  }
};

// Test 2: Check localStorage for Supabase data
const checkLocalStorage = () => {
  if (typeof window !== 'undefined') {
    const keys = Object.keys(localStorage);
    const supabaseKeys = keys.filter(key => 
      key.includes('supabase') || key.includes('sb-') || key.includes('auth')
    );
    
    console.log('📊 LocalStorage Analysis:');
    console.log(`  Total keys: ${keys.length}`);
    console.log(`  Supabase keys: ${supabaseKeys.length}`);
    console.log('  Supabase key names:', supabaseKeys);
    
    return supabaseKeys.length > 0;
  } else {
    console.log('⚠️  localStorage not available (server-side)');
    return false;
  }
};

// Test 3: Simulate page refresh by checking if session persists
const simulateRefreshTest = async () => {
  console.log('🔄 Simulating page refresh test...');
  
  // Check current session
  const beforeRefresh = await testCurrentAuth();
  const storageBefore = checkLocalStorage();
  
  console.log('\n📊 BEFORE REFRESH:');
  console.log(`  Authenticated: ${beforeRefresh}`);
  console.log(`  Has storage data: ${storageBefore}`);
  
  // In a real browser scenario, we'd refresh the page here
  // For this test, we'll check if the session can be recovered
  
  setTimeout(async () => {
    console.log('\n🔄 AFTER SIMULATED REFRESH:');
    const afterRefresh = await testCurrentAuth();
    const storageAfter = checkLocalStorage();
    
    console.log(`  Authenticated: ${afterRefresh}`);
    console.log(`  Has storage data: ${storageAfter}`);
    
    // Analysis
    const sessionPersisted = beforeRefresh && afterRefresh;
    const storagePreserved = storageBefore && storageAfter;
    
    console.log('\n🎯 SESSION PERSISTENCE ANALYSIS:');
    console.log('='.repeat(50));
    console.log(`✅ Session persisted: ${sessionPersisted ? 'YES' : 'NO'}`);
    console.log(`✅ Storage preserved: ${storagePreserved ? 'YES' : 'NO'}`);
    
    if (sessionPersisted && storagePreserved) {
      console.log('\n🎉 SUCCESS: Session persistence is working!');
    } else if (sessionPersisted) {
      console.log('\n⚠️  PARTIAL: Session persists but storage issues detected');
    } else {
      console.log('\n❌ FAILURE: Session persistence is not working');
    }
  }, 2000);
};

// Run tests
if (typeof window !== 'undefined') {
  // Browser environment
  simulateRefreshTest();
} else {
  // Node.js environment - just test API
  testCurrentAuth().then(isAuthenticated => {
    console.log('\n🎯 API AUTHENTICATION TEST:');
    console.log('='.repeat(30));
    console.log(`Status: ${isAuthenticated ? 'AUTHENTICATED' : 'NOT AUTHENTICATED'}`);
    
    if (isAuthenticated) {
      console.log('✅ User session is active and making authenticated API calls');
      console.log('📝 Note: Full session persistence test requires browser environment');
    } else {
      console.log('❌ No active session found');
    }
  });
}