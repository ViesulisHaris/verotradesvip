const http = require('http');

// Simple test to check if middleware is being called at all
async function testMiddlewareBasic() {
  console.log('🧪 Testing if middleware is being called at all...');
  
  try {
    const response = await fetch('http://localhost:3000/calendar');
    console.log(`Calendar response status: ${response.status}`);
    
    // Check if middleware headers are present
    const authChecked = response.headers.get('X-Auth-Checked');
    console.log(`X-Auth-Checked header: ${authChecked}`);
    
    if (authChecked) {
      console.log('✅ Middleware was called for /calendar');
    } else {
      console.log('❌ Middleware was NOT called for /calendar');
    }
    
  } catch (error) {
    console.error('Error testing middleware:', error.message);
  }
}

testMiddlewareBasic();