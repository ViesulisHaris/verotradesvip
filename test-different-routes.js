const http = require('http');

// Test different routes to see which ones trigger middleware
async function testDifferentRoutes() {
  const routes = ['/calendar', '/dashboard', '/analytics', '/trades', '/strategies'];
  
  for (const route of routes) {
    try {
      console.log(`\n🧪 Testing route: ${route}`);
      const response = await fetch(`http://localhost:3000${route}`);
      console.log(`${route} response status: ${response.status}`);
      
      // Check if middleware headers are present
      const middlewareTest = response.headers.get('X-Middleware-Test');
      console.log(`${route} X-Middleware-Test header: ${middlewareTest}`);
      
      if (middlewareTest) {
        console.log(`✅ Middleware was called for ${route}`);
      } else {
        console.log(`❌ Middleware was NOT called for ${route}`);
      }
    } catch (error) {
      console.error(`Error testing ${route}:`, error.message);
    }
  }
}

testDifferentRoutes();