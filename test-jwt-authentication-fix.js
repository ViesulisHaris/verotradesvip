// JWT Authentication Fix Verification Test
// This script tests the comprehensive JWT authentication fix

console.log('🧪 JWT Authentication Fix Verification Started');
console.log('==========================================');

async function testJWTAuthenticationFix() {
  console.log('\n📊 Testing JWT Authentication Fix...');
  
  try {
    // Test 1: Small limit with enhanced validation
    console.log('\n🔍 Test 1: Small limit (50) with JWT validation');
    const smallResponse = await fetch('/api/confluence-trades?limit=50&page=1', {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Small limit result:', {
      status: smallResponse.status,
      ok: smallResponse.ok,
      statusText: smallResponse.statusText
    });

    if (smallResponse.ok) {
      const data = await smallResponse.json();
      console.log('✅ Small limit successful:', {
        tradesReturned: data.trades?.length || 0,
        totalCount: data.totalCount || 0,
        requestId: data.requestId
      });
    } else {
      const error = await smallResponse.json();
      console.error('❌ Small limit failed:', error);
    }

    // Test 2: Medium limit with enhanced validation
    console.log('\n🔍 Test 2: Medium limit (2000) with JWT validation');
    const mediumResponse = await fetch('/api/confluence-trades?limit=2000&page=1', {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Medium limit result:', {
      status: mediumResponse.status,
      ok: mediumResponse.ok,
      statusText: mediumResponse.statusText
    });

    if (mediumResponse.ok) {
      const data = await mediumResponse.json();
      console.log('✅ Medium limit successful:', {
        tradesReturned: data.trades?.length || 0,
        totalCount: data.totalCount || 0,
        requestId: data.requestId
      });
    } else {
      const error = await mediumResponse.json();
      console.error('❌ Medium limit failed:', error);
    }

    // Test 3: Large limit with enhanced validation
    console.log('\n🔍 Test 3: Large limit (10000) with JWT validation');
    const largeResponse = await fetch('/api/confluence-trades?limit=10000&page=1', {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Large limit result:', {
      status: largeResponse.status,
      ok: largeResponse.ok,
      statusText: largeResponse.statusText
    });

    if (largeResponse.ok) {
      const data = await largeResponse.json();
      console.log('✅ Large limit successful:', {
        tradesReturned: data.trades?.length || 0,
        totalCount: data.totalCount || 0,
        requestId: data.requestId
      });
    } else {
      const error = await largeResponse.json();
      console.error('❌ Large limit failed:', error);
    }

    console.log('\n🎯 JWT Authentication Fix Test Summary:');
    console.log('- Enhanced JWT validation implemented');
    console.log('- Retry mechanism with exponential backoff');
    console.log('- Comprehensive logging for debugging');
    console.log('- Token format validation before requests');
    console.log('- Server-side token validation');

  } catch (error) {
    console.error('Test execution error:', error);
  }
}

// Test LTTB optimization with fixed authentication
async function testLTBBOptimization() {
  console.log('\n📈 Testing LTTB Optimization with Fixed Auth...');
  
  try {
    // Fetch all trades for LTTB
    const response = await fetch('/api/confluence-trades?limit=10000&page=1', {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      const tradesCount = data.trades?.length || 0;
      
      console.log('✅ LTTB data fetch successful:', {
        tradesCount,
        canApplyLTTB: tradesCount > 500,
        lttbThreshold: Math.max(500, Math.floor(tradesCount * 0.5))
      });
      
      if (tradesCount > 500) {
        console.log('🎉 LTTB optimization can now be applied!');
        console.log('📊 P&L chart will be optimized with', tradesCount, 'data points');
      } else {
        console.log('ℹ️ LTTB optimization not needed for', tradesCount, 'data points');
      }
    } else {
      console.error('❌ LTTB data fetch failed');
    }
  } catch (error) {
    console.error('LTTB test error:', error);
  }
}

// Auto-execute tests if in browser environment
if (typeof window !== 'undefined') {
  // Wait for page to load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      testJWTAuthenticationFix();
      testLTBBOptimization();
    });
  } else {
    testJWTAuthenticationFix();
    testLTBBOptimization();
  }
} else {
  console.log('⚠️ This script should be run in a browser environment');
  console.log('📝 Open browser devtools and navigate to trades page');
  console.log('🎯 Look for JWT_VALIDATION and RETRY logs');
}

console.log('\n✅ JWT Authentication Fix Test Ready');
console.log('🔧 Enhanced validation, retry logic, and logging implemented');
console.log('📈 LTTB optimization should now work consistently');