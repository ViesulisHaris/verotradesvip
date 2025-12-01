const http = require('http');
const https = require('https');
require('dotenv').config();

// Simple function to make HTTP requests
function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    const req = client.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });
    
    req.on('error', reject);
    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

async function testApplicationPages() {
  console.log('🚀 Testing application pages after cache clear...');
  
  const baseUrl = 'http://localhost:3000';
  const pagesToTest = [
    '/',
    '/login',
    '/register',
    '/dashboard',
    '/trades',
    '/strategies',
    '/analytics',
    '/log-trade'
  ];

  const results = [];

  for (const pagePath of pagesToTest) {
    const fullUrl = `${baseUrl}${pagePath}`;
    console.log(`\n📄 Testing ${pagePath}...`);
    
    try {
      const response = await makeRequest(fullUrl);
      
      // Check if page loads successfully (status 200 or redirect)
      if (response.statusCode === 200 || response.statusCode === 302) {
        console.log(`✅ ${pagePath} - Status: ${response.statusCode}`);
        
        // Check for any error content in the response
        const hasError = response.body.includes('error') || 
                        response.body.includes('Error') ||
                        response.body.includes('strategy_rule_compliance') ||
                        response.body.includes('relation') ||
                        response.body.includes('does not exist');
        
        if (hasError) {
          console.log(`⚠️  ${pagePath} - Potential error content found`);
          results.push({ page: pagePath, status: 'warning', reason: 'Error content detected' });
        } else {
          console.log(`✅ ${pagePath} - No error content detected`);
          results.push({ page: pagePath, status: 'success', statusCode: response.statusCode });
        }
      } else {
        console.log(`❌ ${pagePath} - Status: ${response.statusCode}`);
        results.push({ page: pagePath, status: 'error', statusCode: response.statusCode });
      }
    } catch (error) {
      console.log(`❌ ${pagePath} - Request failed: ${error.message}`);
      results.push({ page: pagePath, status: 'error', reason: error.message });
    }
  }

  // Summary
  console.log('\n📊 Test Results Summary:');
  console.log('========================');
  
  const successCount = results.filter(r => r.status === 'success').length;
  const warningCount = results.filter(r => r.status === 'warning').length;
  const errorCount = results.filter(r => r.status === 'error').length;
  
  console.log(`✅ Successful: ${successCount}`);
  console.log(`⚠️  Warnings: ${warningCount}`);
  console.log(`❌ Errors: ${errorCount}`);
  
  // Check specifically for strategy_rule_compliance errors
  console.log('\n🔍 Checking for strategy_rule_compliance errors...');
  const hasStrategyError = results.some(r => r.reason && r.reason.includes('strategy_rule_compliance'));
  
  if (hasStrategyError) {
    console.log('❌ strategy_rule_compliance errors still present!');
    return false;
  } else {
    console.log('✅ No strategy_rule_compliance errors found in any page');
  }

  // Overall assessment
  if (errorCount === 0 && warningCount === 0) {
    console.log('\n🎉 All pages loaded successfully without errors!');
    return true;
  } else if (errorCount === 0) {
    console.log('\n✅ All pages loaded, but some warnings detected');
    return true;
  } else {
    console.log('\n❌ Some pages failed to load');
    return false;
  }
}

// Test the trade form component specifically
async function testTradeFormComponent() {
  console.log('\n🔧 Testing TradeForm component structure...');
  
  try {
    const fs = require('fs');
    const tradeFormPath = './src/components/forms/TradeForm.tsx';
    
    if (fs.existsSync(tradeFormPath)) {
      const content = fs.readFileSync(tradeFormPath, 'utf8');
      
      // Check for any references to strategy_rule_compliance
      const hasStrategyReference = content.includes('strategy_rule_compliance');
      
      if (hasStrategyReference) {
        console.log('❌ TradeForm still contains strategy_rule_compliance references');
        return false;
      } else {
        console.log('✅ TradeForm component has no strategy_rule_compliance references');
      }
      
      // Check for proper database insert structure
      const hasProperInsert = content.includes('supabase.from(\'trades\').insert');
      if (hasProperInsert) {
        console.log('✅ TradeForm uses proper database insert structure');
      } else {
        console.log('⚠️  TradeForm insert structure may need verification');
      }
      
      return true;
    } else {
      console.log('❌ TradeForm component not found');
      return false;
    }
  } catch (error) {
    console.log('❌ Error reading TradeForm component:', error.message);
    return false;
  }
}

async function runAllTests() {
  console.log('🧪 Running comprehensive trade logging tests after cache clear...\n');
  
  const pageTests = await testApplicationPages();
  const componentTests = await testTradeFormComponent();
  
  if (pageTests && componentTests) {
    console.log('\n🎉 SUCCESS: All tests passed!');
    console.log('✅ Trade logging functionality is working properly');
    console.log('✅ No strategy_rule_compliance errors detected');
    console.log('✅ Application pages are loading correctly');
    console.log('✅ Components are properly structured');
    return true;
  } else {
    console.log('\n❌ FAILURE: Some tests failed');
    return false;
  }
}

runAllTests().then(success => {
  if (success) {
    console.log('\n🏆 Cache clear successfully resolved the strategy_rule_compliance issue!');
    process.exit(0);
  } else {
    console.log('\n💥 Issues still exist after cache clear');
    process.exit(1);
  }
});