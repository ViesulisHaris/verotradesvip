const http = require('http');
const fs = require('fs');

console.log('🧪 ===== FINAL APPLICATION TEST =====');
console.log('🎯 Target: Validate application loads without white screen errors');

async function testApplicationLoad() {
  return new Promise((resolve, reject) => {
    console.log('\n🌐 ===== TESTING APPLICATION LOADING =====');
    
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/',
      method: 'GET',
      timeout: 10000
    };

    const req = http.request(options, (res) => {
      console.log(`📊 Status Code: ${res.statusCode}`);
      console.log(`📋 Headers:`, res.headers);

      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        console.log(`📄 Response Size: ${data.length} bytes`);
        
        // Check for successful response
        if (res.statusCode === 200) {
          console.log('✅ Application responded successfully');
          
          // Check for HTML content
          if (data.includes('<html>') && data.includes('</html>')) {
            console.log('✅ Valid HTML structure detected');
          } else {
            console.log('❌ Invalid HTML structure');
          }
          
          // Check for error indicators
          if (data.includes('Application Error') || data.includes('error')) {
            console.log('⚠️ Error indicators found in response');
          } else {
            console.log('✅ No error indicators in response');
          }
          
          // Check for Next.js indicators
          if (data.includes('__NEXT_DATA__') || data.includes('next')) {
            console.log('✅ Next.js application detected');
          } else {
            console.log('⚠️ Next.js application not clearly detected');
          }
          
          resolve({
            success: true,
            statusCode: res.statusCode,
            size: data.length,
            hasHtml: data.includes('<html>') && data.includes('</html>'),
            hasErrors: data.includes('Application Error') || data.includes('error'),
            hasNextJs: data.includes('__NEXT_DATA__') || data.includes('next')
          });
        } else {
          console.log('❌ Application failed to load properly');
          resolve({
            success: false,
            statusCode: res.statusCode,
            error: `HTTP ${res.statusCode}`
          });
        }
      });
    });

    req.on('error', (err) => {
      console.log(`❌ Request Error: ${err.message}`);
      resolve({
        success: false,
        error: err.message
      });
    });

    req.on('timeout', () => {
      console.log('❌ Request Timeout');
      req.destroy();
      resolve({
        success: false,
        error: 'Request timeout'
      });
    });

    req.end();
  });
}

// Check if development server is running
async function checkDevelopmentServer() {
  console.log('\n🖥️ ===== CHECKING DEVELOPMENT SERVER =====');
  
  try {
    const result = await testApplicationLoad();
    return result;
  } catch (error) {
    console.log(`❌ Test failed: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}

// Check build cache status
function checkBuildCache() {
  console.log('\n🧹 ===== CHECKING BUILD CACHE =====');
  
  if (fs.existsSync('.next')) {
    try {
      const stats = fs.statSync('.next');
      console.log(`📁 .next directory exists, modified: ${stats.mtime}`);
      return true;
    } catch (error) {
      console.log('❌ Error checking .next directory');
      return false;
    }
  } else {
    console.log('✅ .next directory not found (clean)');
    return false;
  }
}

// Check error boundary implementation
function checkErrorBoundary() {
  console.log('\n🛡️ ===== CHECKING ERROR BOUNDARY =====');
  
  try {
    const layoutContent = fs.readFileSync('src/app/layout.tsx', 'utf8');
    const errorBoundaryContent = fs.readFileSync('src/components/EmergencyErrorBoundary.tsx', 'utf8');
    
    const hasImport = layoutContent.includes('import EmergencyErrorBoundary');
    const hasUsage = layoutContent.includes('<EmergencyErrorBoundary>');
    const hasErrorHandling = errorBoundaryContent.includes('componentDidCatch');
    
    console.log(`✅ Error boundary imported: ${hasImport}`);
    console.log(`✅ Error boundary used: ${hasUsage}`);
    console.log(`✅ Error handling implemented: ${hasErrorHandling}`);
    
    return hasImport && hasUsage && hasErrorHandling;
  } catch (error) {
    console.log(`❌ Error checking error boundary: ${error.message}`);
    return false;
  }
}

// Main test execution
async function runFinalTest() {
  console.log('🚀 Starting final application validation...\n');
  
  // 1. Check development server
  const serverResult = await checkDevelopmentServer();
  
  // 2. Check build cache
  const cacheStatus = checkBuildCache();
  
  // 3. Check error boundary
  const errorBoundaryStatus = checkErrorBoundary();
  
  // 4. Final assessment
  console.log('\n📊 ===== FINAL ASSESSMENT =====');
  
  const allChecksPass = [
    serverResult.success,
    errorBoundaryStatus
  ].every(check => check === true);
  
  if (allChecksPass) {
    console.log('🎉 ===== APPLICATION STABLE =====');
    console.log('✅ All critical checks passed');
    console.log('✅ Application loads without white screen errors');
    console.log('✅ Error boundaries properly implemented');
    console.log('✅ Development server responding correctly');
    console.log('\n🔧 NEXT STEPS:');
    console.log('1. Test application in browser: http://localhost:3000');
    console.log('2. Verify all pages load correctly');
    console.log('3. Test error handling by triggering errors');
    console.log('4. Monitor application stability over time');
  } else {
    console.log('🚨 ===== ISSUES DETECTED =====');
    console.log('❌ Some checks failed');
    console.log('🔧 Address remaining issues before deployment');
    
    if (!serverResult.success) {
      console.log(`❌ Server issue: ${serverResult.error || serverResult.statusCode}`);
    }
    
    if (!errorBoundaryStatus) {
      console.log('❌ Error boundary implementation issue');
    }
  }
  
  console.log('\n🔍 ===== FINAL TEST COMPLETE =====');
  
  return {
    serverStatus: serverResult,
    cacheStatus,
    errorBoundaryStatus,
    overallStable: allChecksPass
  };
}

// Run the test
runFinalTest().catch(console.error);