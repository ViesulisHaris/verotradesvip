const http = require('http');

function testLoginPage() {
  console.log('🔍 Testing Login Page Response...');
  
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/login',
    method: 'GET',
    headers: {
      'Content-Type': 'text/html'
    }
  };

  const req = http.request(options, (res) => {
    console.log(`📡 Status: ${res.statusCode}`);
    console.log(`📋 Headers:`, res.headers);
    
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log(`📄 Page size: ${data.length} bytes`);
      
      // Check for key login form elements
      const hasEmailInput = data.includes('id="email"');
      const hasPasswordInput = data.includes('id="password"');
      const hasSubmitButton = data.includes('data-testid="login-submit-button"');
      const hasWelcomeText = data.includes('Welcome to VeroTrade');
      const hasLoginForm = data.includes('<form');
      
      console.log('\n🔍 Login Form Elements Check:');
      console.log(`  - Form tag: ${hasLoginForm ? '✅ FOUND' : '❌ MISSING'}`);
      console.log(`  - Email input: ${hasEmailInput ? '✅ FOUND' : '❌ MISSING'}`);
      console.log(`  - Password input: ${hasPasswordInput ? '✅ FOUND' : '❌ MISSING'}`);
      console.log(`  - Submit button: ${hasSubmitButton ? '✅ FOUND' : '❌ MISSING'}`);
      console.log(`  - Welcome text: ${hasWelcomeText ? '✅ FOUND' : '❌ MISSING'}`);
      
      if (hasEmailInput && hasPasswordInput && hasSubmitButton && hasWelcomeText) {
        console.log('\n✅ SUCCESS: All login form elements are present in the HTML!');
        console.log('🎉 Login form should be visible and functional');
      } else {
        console.log('\n❌ ISSUE: Some login form elements are missing from the HTML');
      }
      
      // Check for any error indicators
      const hasErrorText = data.toLowerCase().includes('error');
      const hasLoadingText = data.toLowerCase().includes('loading');
      
      console.log('\n🔍 Additional Checks:');
      console.log(`  - Error text: ${hasErrorText ? '⚠️  FOUND' : '✅ NONE'}`);
      console.log(`  - Loading text: ${hasLoadingText ? '⚠️  FOUND' : '✅ NONE'}`);
      
      // Save HTML for manual inspection if needed
      require('fs').writeFileSync('login-page-response.html', data);
      console.log('\n💾 HTML saved to login-page-response.html for inspection');
    });
  });

  req.on('error', (e) => {
    console.error(`❌ Request error: ${e.message}`);
  });

  req.end();
}

// Run the test
testLoginPage();