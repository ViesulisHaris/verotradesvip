// JWT Authentication Test Script
// This script will test the JWT authentication issue with different limit values

console.log('🧪 JWT Authentication Test Started');
console.log('==================================');

async function testJWTAuth() {
  try {
    // Test 1: Small limit (should work)
    console.log('\n📊 Test 1: Small limit (50 trades)');
    const smallLimitResponse = await fetch('/api/confluence-trades?limit=50&page=1', {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Small limit response:', {
      status: smallLimitResponse.status,
      ok: smallLimitResponse.ok,
      statusText: smallLimitResponse.statusText
    });

    if (!smallLimitResponse.ok) {
      const errorData = await smallLimitResponse.json();
      console.error('Small limit error:', errorData);
    }

    // Test 2: Large limit (should fail with JWT error)
    console.log('\n📊 Test 2: Large limit (10000 trades)');
    const largeLimitResponse = await fetch('/api/confluence-trades?limit=10000&page=1', {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Large limit response:', {
      status: largeLimitResponse.status,
      ok: largeLimitResponse.ok,
      statusText: largeLimitResponse.statusText
    });

    if (!largeLimitResponse.ok) {
      const errorData = await largeLimitResponse.json();
      console.error('Large limit error:', errorData);
    }

    // Test 3: Medium limit (boundary test)
    console.log('\n📊 Test 3: Medium limit (2000 trades)');
    const mediumLimitResponse = await fetch('/api/confluence-trades?limit=2000&page=1', {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Medium limit response:', {
      status: mediumLimitResponse.status,
      ok: mediumLimitResponse.ok,
      statusText: mediumLimitResponse.statusText
    });

    if (!mediumLimitResponse.ok) {
      const errorData = await mediumLimitResponse.json();
      console.error('Medium limit error:', errorData);
    }

  } catch (error) {
    console.error('Test error:', error);
  }
}

// Check browser console for JWT debug logs
console.log('\n🔍 Check browser console for JWT_DEBUG logs...');
console.log('📝 Open browser devtools and navigate to trades page');
console.log('🎯 Look for logs starting with [JWT_DEBUG]');

// Auto-execute test if in browser environment
if (typeof window !== 'undefined') {
  // Wait for page to load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', testJWTAuth);
  } else {
    testJWTAuth();
  }
} else {
  console.log('⚠️ This script should be run in a browser environment');
}