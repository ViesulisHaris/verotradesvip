const http = require('http');
const fs = require('fs');

function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const request = http.request(url, (response) => {
      let data = '';
      response.on('data', (chunk) => {
        data += chunk;
      });
      response.on('end', () => {
        resolve({
          statusCode: response.statusCode,
          headers: response.headers,
          data: data
        });
      });
    });
    
    request.on('error', (error) => {
      reject(error);
    });
    
    request.setTimeout(10000, () => {
      request.destroy();
      reject(new Error('Request timeout'));
    });
    
    request.end();
  });
}

async function verifyErrorBoundary() {
  console.log('🧪 Simple ErrorBoundary Verification\n');
  
  const results = {
    serverResponding: false,
    mainAppAccessible: false,
    errorBoundaryPageAccessible: false,
    hasErrorBoundaryComponent: false,
    hasUseClientDirective: false,
    errors: []
  };
  
  try {
    console.log('1️⃣ Testing server response on port 3001...');
    
    // Test if server is responding
    const response = await makeRequest('http://localhost:3001');
    results.serverResponding = true;
    console.log('✅ Server is responding (Status:', response.statusCode, ')');
    
    if (response.statusCode === 200) {
      results.mainAppAccessible = true;
      console.log('✅ Main application is accessible');
      
      // Check if the response contains HTML content
      if (response.data.includes('<html') && response.data.length > 1000) {
        console.log('✅ Application appears to be loading properly (no white screen)');
      } else {
        console.log('❌ Application may have loading issues (insufficient content)');
        results.errors.push('Application response has insufficient content');
      }
    } else {
      console.log('❌ Main application returned status:', response.statusCode);
      results.errors.push(`Main application returned status ${response.statusCode}`);
    }
    
    console.log('\n2️⃣ Testing ErrorBoundary test page...');
    
    // Test ErrorBoundary test page
    try {
      const errorPageResponse = await makeRequest('http://localhost:3001/test-error-boundary');
      if (errorPageResponse.statusCode === 200) {
        results.errorBoundaryPageAccessible = true;
        console.log('✅ ErrorBoundary test page is accessible');
        
        if (errorPageResponse.data.includes('ErrorBoundary Test Page')) {
          console.log('✅ ErrorBoundary test page contains expected content');
        } else {
          console.log('❌ ErrorBoundary test page missing expected content');
          results.errors.push('ErrorBoundary test page missing expected content');
        }
      } else {
        console.log('❌ ErrorBoundary test page returned status:', errorPageResponse.statusCode);
        results.errors.push(`ErrorBoundary test page returned status ${errorPageResponse.statusCode}`);
      }
    } catch (error) {
      console.log('❌ Error accessing ErrorBoundary test page:', error.message);
      results.errors.push(`Error accessing ErrorBoundary test page: ${error.message}`);
    }
    
    console.log('\n3️⃣ Checking ErrorBoundary component file...');
    
    // Check if ErrorBoundary component exists and has the correct structure
    try {
      const errorBoundaryPath = './src/components/ErrorBoundary.tsx';
      if (fs.existsSync(errorBoundaryPath)) {
        results.hasErrorBoundaryComponent = true;
        const errorBoundaryContent = fs.readFileSync(errorBoundaryPath, 'utf8');
        
        if (errorBoundaryContent.startsWith("'use client';")) {
          results.hasUseClientDirective = true;
          console.log('✅ ErrorBoundary component has "use client" directive at the top');
        } else {
          console.log('❌ ErrorBoundary component missing "use client" directive at the top');
          results.errors.push('ErrorBoundary component missing "use client" directive at the top');
        }
        
        if (errorBoundaryContent.includes('class ErrorBoundary') && 
            errorBoundaryContent.includes('componentDidCatch') &&
            errorBoundaryContent.includes('getDerivedStateFromError')) {
          console.log('✅ ErrorBoundary component has proper error handling methods');
        } else {
          console.log('❌ ErrorBoundary component missing required error handling methods');
          results.errors.push('ErrorBoundary component missing required error handling methods');
        }
      } else {
        console.log('❌ ErrorBoundary component file not found');
        results.errors.push('ErrorBoundary component file not found');
      }
    } catch (error) {
      console.log('❌ Error checking ErrorBoundary component:', error.message);
      results.errors.push(`Error checking ErrorBoundary component: ${error.message}`);
    }
    
    console.log('\n4️⃣ Checking test-error-boundary page...');
    
    // Check if the test page exists and has the correct structure
    try {
      const testPagePath = './src/app/test-error-boundary/page.tsx';
      if (fs.existsSync(testPagePath)) {
        const testPageContent = fs.readFileSync(testPagePath, 'utf8');
        
        if (testPageContent.startsWith("'use client';")) {
          console.log('✅ Test page has "use client" directive at the top');
        } else {
          console.log('❌ Test page missing "use client" directive at the top');
          results.errors.push('Test page missing "use client" directive at the top');
        }
        
        if (testPageContent.includes('ErrorBoundary') && 
            testPageContent.includes('ErrorThrowingComponent')) {
          console.log('✅ Test page has proper ErrorBoundary testing structure');
        } else {
          console.log('❌ Test page missing ErrorBoundary testing structure');
          results.errors.push('Test page missing ErrorBoundary testing structure');
        }
      } else {
        console.log('❌ Test page file not found');
        results.errors.push('Test page file not found');
      }
    } catch (error) {
      console.log('❌ Error checking test page:', error.message);
      results.errors.push(`Error checking test page: ${error.message}`);
    }
    
  } catch (error) {
    console.log('❌ Verification failed:', error.message);
    results.errors.push(`Verification failed: ${error.message}`);
  }
  
  // Generate report
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      serverResponding: results.serverResponding,
      mainAppAccessible: results.mainAppAccessible,
      errorBoundaryPageAccessible: results.errorBoundaryPageAccessible,
      hasErrorBoundaryComponent: results.hasErrorBoundaryComponent,
      hasUseClientDirective: results.hasUseClientDirective,
      overallSuccess: results.serverResponding && results.mainAppAccessible && 
                     results.errorBoundaryPageAccessible && results.hasErrorBoundaryComponent && 
                     results.hasUseClientDirective
    },
    details: results,
    recommendations: []
  };
  
  // Add recommendations
  if (!results.serverResponding) {
    report.recommendations.push('Development server is not responding - check if server is running');
  }
  if (!results.mainAppAccessible) {
    report.recommendations.push('Main application is not accessible - check routing and server configuration');
  }
  if (!results.errorBoundaryPageAccessible) {
    report.recommendations.push('ErrorBoundary test page is not accessible - verify file exists and routing works');
  }
  if (!results.hasErrorBoundaryComponent) {
    report.recommendations.push('ErrorBoundary component is missing - create the component file');
  }
  if (!results.hasUseClientDirective) {
    report.recommendations.push('"use client" directive is missing or misplaced - ensure it\'s at the very top of the file');
  }
  
  // Save report
  fs.writeFileSync(
    'verotradesvip/SIMPLE_ERRORBOUNDARY_VERIFICATION_REPORT.json', 
    JSON.stringify(report, null, 2)
  );
  
  console.log('\n📋 VERIFICATION SUMMARY:');
  console.log('========================');
  console.log(`✅ Server Responding: ${results.serverResponding ? 'PASS' : 'FAIL'}`);
  console.log(`✅ Main App Accessible: ${results.mainAppAccessible ? 'PASS' : 'FAIL'}`);
  console.log(`✅ ErrorBoundary Page Accessible: ${results.errorBoundaryPageAccessible ? 'PASS' : 'FAIL'}`);
  console.log(`✅ Has ErrorBoundary Component: ${results.hasErrorBoundaryComponent ? 'PASS' : 'FAIL'}`);
  console.log(`✅ Has "use client" Directive: ${results.hasUseClientDirective ? 'PASS' : 'FAIL'}`);
  console.log(`\n🎯 OVERALL RESULT: ${report.summary.overallSuccess ? 'SUCCESS ✅' : 'FAILED ❌'}`);
  
  if (results.errors.length > 0) {
    console.log('\n❌ ERRORS ENCOUNTERED:');
    results.errors.forEach((error, index) => {
      console.log(`   ${index + 1}. ${error}`);
    });
  }
  
  if (report.recommendations.length > 0) {
    console.log('\n💡 RECOMMENDATIONS:');
    report.recommendations.forEach((rec, index) => {
      console.log(`   ${index + 1}. ${rec}`);
    });
  }
  
  console.log('\n📄 Full report saved to: SIMPLE_ERRORBOUNDARY_VERIFICATION_REPORT.json');
  
  return report;
}

// Run the verification
verifyErrorBoundary().catch(console.error);