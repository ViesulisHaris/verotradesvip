const http = require('http');
const https = require('https');

function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    
    const req = protocol.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });
    
    req.on('error', (err) => {
      reject(err);
    });
    
    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

async function testStrategyPages() {
  console.log('🚀 Testing Strategy Pages...\n');
  
  const pages = [
    { name: 'Dashboard', url: 'http://localhost:3000/dashboard' },
    { name: 'Strategies', url: 'http://localhost:3000/strategies' },
    { name: 'Trade Logging', url: 'http://localhost:3000/log-trade' },
    { name: 'Test Suite', url: 'http://localhost:3000/test-strategy-rule-compliance-fixes' }
  ];
  
  for (const page of pages) {
    console.log(`📍 Testing ${page.name} page...`);
    
    try {
      const response = await makeRequest(page.url);
      
      if (response.statusCode === 200) {
        console.log(`   ✅ ${page.name} page loaded successfully (Status: ${response.statusCode})`);
        
        // Check for error indicators in the HTML
        const hasErrorIndicators = response.body.includes('strategy_rule_compliance') ||
                                  response.body.includes('relation') && response.body.includes('does not exist') ||
                                  response.body.includes('schema cache error');
        
        if (hasErrorIndicators) {
          console.log(`   ⚠️  Potential error indicators found in ${page.name} page`);
        } else {
          console.log(`   ✅ No error indicators found in ${page.name} page`);
        }
        
        // Check for successful loading indicators
        const hasSuccessIndicators = response.body.includes('strategies') ||
                                      response.body.includes('strategy') ||
                                      response.body.includes('dashboard') ||
                                      response.body.includes('trade');
        
        if (hasSuccessIndicators) {
          console.log(`   ✅ Content indicators found in ${page.name} page`);
        }
        
      } else {
        console.log(`   ❌ ${page.name} page failed to load (Status: ${response.statusCode})`);
      }
      
    } catch (error) {
      console.log(`   ❌ Error testing ${page.name} page: ${error.message}`);
    }
    
    console.log('');
  }
  
  console.log('✅ Basic page testing completed!');
  console.log('\n📋 Manual Testing Instructions:');
  console.log('1. Check the browser windows that opened:');
  console.log('   - Strategies page: http://localhost:3000/strategies');
  console.log('   - Test suite page: http://localhost:3000/test-strategy-rule-compliance-fixes');
  console.log('   - Trade logging page: http://localhost:3000/log-trade');
  console.log('');
  console.log('2. On the test suite page:');
  console.log('   - Click "Run Comprehensive Tests" button');
  console.log('   - Look for any red error indicators');
  console.log('   - Check that all tests show green "SUCCESS" status');
  console.log('');
  console.log('3. On the strategies page:');
  console.log('   - Verify strategies load without errors');
  console.log('   - Try clicking on strategy cards/buttons');
  console.log('   - Check browser console for any errors (F12 → Console)');
  console.log('');
  console.log('4. On the trade logging page:');
  console.log('   - Check if strategy dropdown is populated');
  console.log('   - Verify no errors when selecting strategies');
  console.log('   - Check browser console for any errors');
}

// Run the test
testStrategyPages().catch(console.error);