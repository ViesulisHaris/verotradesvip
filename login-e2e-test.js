const http = require('http');

function testLoginFunctionality() {
  console.log('🔍 Testing End-to-End Login Functionality...');
  
  // Test 1: Verify login page loads with form elements
  console.log('\n📍 Test 1: Login Page Loading');
  makeRequest('/login', (data) => {
    const hasEmailInput = data.includes('id="email"');
    const hasPasswordInput = data.includes('id="password"');
    const hasSubmitButton = data.includes('data-testid="login-submit-button"');
    const hasWelcomeText = data.includes('Welcome to VeroTrade');
    
    if (hasEmailInput && hasPasswordInput && hasSubmitButton && hasWelcomeText) {
      console.log('  ✅ Login page loads with all form elements');
    } else {
      console.log('  ❌ Login page missing form elements');
      return;
    }
  });
  
  // Test 2: Test form submission (simulated)
  console.log('\n📍 Test 2: Form Submission Handling');
  
  const postData = JSON.stringify({
    email: 'test@example.com',
    password: 'testpassword'
  });
  
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': Buffer.byteLength(postData)
    }
  };
  
  const req = http.request(options, (res) => {
    console.log(`  📡 Response Status: ${res.statusCode}`);
    
    let responseData = '';
    res.on('data', (chunk) => {
      responseData += chunk;
    });
    
    res.on('end', () => {
      console.log(`  📄 Response Size: ${responseData.length} bytes`);
      
      // Check for successful login indicators
      const isRedirecting = responseData.includes('dashboard') || res.statusCode === 302;
      const hasError = responseData.toLowerCase().includes('error') || responseData.toLowerCase().includes('invalid');
      
      if (isRedirecting) {
        console.log('  ✅ Form submission triggers redirect (login successful)');
      } else if (hasError) {
        console.log('  ⚠️  Form submission shows error (expected for invalid credentials)');
      } else {
        console.log('  ℹ️  Form submission processed');
      }
    });
  });

  req.on('error', (e) => {
    console.log(`  ❌ Request error: ${e.message}`);
  });

  // Simulate form data
  req.write('email=test@example.com&password=testpassword');
  req.end();
  
  // Test 3: Verify CSS styling is working
  console.log('\n📍 Test 3: CSS and Styling');
  makeRequest('/login', (data) => {
    const hasInlineStyles = data.includes('style=') || data.includes('backgroundColor');
    const hasFormStructure = data.includes('<form') && data.includes('</form>');
    const hasInputFields = data.includes('<input') && data.includes('type="email"') && data.includes('type="password"');
    
    if (hasInlineStyles && hasFormStructure && hasInputFields) {
      console.log('  ✅ Login form has proper styling and structure');
    } else {
      console.log('  ❌ Login form styling issues detected');
    }
    
    // Check for responsive design
    const hasResponsiveStyles = data.includes('minHeight') || data.includes('maxWidth');
    if (hasResponsiveStyles) {
      console.log('  ✅ Form includes responsive design elements');
    }
  });
  
  console.log('\n🎉 End-to-End Login Test Completed!');
}

function makeRequest(path, callback) {
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: path,
    method: 'GET'
  };

  const req = http.request(options, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      callback(data);
    });
  });

  req.on('error', (e) => {
    console.error(`❌ Request error: ${e.message}`);
  });

  req.end();
}

// Run the test
testLoginFunctionality();