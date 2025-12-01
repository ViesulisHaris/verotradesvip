const http = require('http');

// Test basic routing functionality
async function testRouting() {
  console.log('🔍 Testing basic routing functionality...');
  
  const baseUrl = 'http://localhost:3000';
  const testRoutes = ['/', '/dashboard', '/login'];
  
  for (const route of testRoutes) {
    try {
      console.log(`\n📡 Testing route: ${route}`);
      
      const response = await fetch(`${baseUrl}${route}`);
      const status = response.status;
      
      console.log(`✅ Route ${route} - Status: ${status}`);
      
      if (status === 200) {
        const text = await response.text();
        
        // Check for chunk loading errors
        const hasChunkErrors = text.includes('404') && text.includes('chunks');
        const hasMainApp = text.includes('main-app.js');
        const hasAppInternals = text.includes('app-pages-internals.js');
        
        console.log(`📊 Chunk Analysis for ${route}:`);
        console.log(`   - Has chunk errors: ${hasChunkErrors}`);
        console.log(`   - Main app chunk present: ${hasMainApp}`);
        console.log(`   - App internals present: ${hasAppInternals}`);
        
        if (!hasChunkErrors && hasMainApp && hasAppInternals) {
          console.log(`✅ Route ${route} is working properly!`);
        } else {
          console.log(`❌ Route ${route} has chunk loading issues`);
        }
      } else {
        console.log(`❌ Route ${route} returned status ${status}`);
      }
    } catch (error) {
      console.log(`❌ Error testing route ${route}:`, error.message);
    }
  }
}

// Run the test
testRouting().then(() => {
  console.log('\n🏁 Routing test completed');
}).catch(error => {
  console.error('❌ Test failed:', error);
});