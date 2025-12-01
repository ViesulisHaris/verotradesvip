const http = require('http');
const https = require('https');
const { URL } = require('url');

async function testApplicationPages() {
  console.log('🚀 Testing Application Pages...\n');

  const pages = [
    { name: 'Main', path: '/' },
    { name: 'Dashboard', path: '/dashboard' },
    { name: 'Strategies', path: '/strategies' },
    { name: 'Trades', path: '/trades' },
    { name: 'Log Trade', path: '/log-trade' },
    { name: 'Login', path: '/login' },
    { name: 'Register', path: '/register' }
  ];

  const results = {};

  for (const page of pages) {
    console.log(`📋 Testing ${page.name} page...`);
    
    try {
      const response = await makeRequest(`http://localhost:3000${page.path}`);
      
      results[page.name] = {
        success: true,
        statusCode: response.statusCode,
        contentType: response.headers['content-type'],
        responseTime: response.responseTime
      };
      
      console.log(`  ✅ ${page.name}: HTTP ${response.statusCode} (${response.responseTime}ms)`);
      
      // Check for error indicators in the response body
      if (response.body) {
        const hasErrorIndicators = response.body.includes('error') || 
                                 response.body.includes('Error') ||
                                 response.body.includes('strategy_rule_compliance') ||
                                 response.body.includes('schema cache');
        
        if (hasErrorIndicators) {
          results[page.name].hasErrorIndicators = true;
          console.log(`  ⚠️ ${page.name}: Contains potential error indicators`);
        }
      }
      
    } catch (error) {
      results[page.name] = {
        success: false,
        error: error.message
      };
      console.log(`  ❌ ${page.name}: ${error.message}`);
    }
  }

  // Summary
  console.log('\n📋 Test Summary');
  const successfulPages = Object.values(results).filter(r => r.success).length;
  const totalPages = Object.keys(results).length;
  
  console.log(`Total pages: ${totalPages}`);
  console.log(`Successful: ${successfulPages}`);
  console.log(`Failed: ${totalPages - successfulPages}`);
  
  const pagesWithErrors = Object.entries(results).filter(([name, result]) => 
    result.success && result.hasErrorIndicators
  );
  
  if (pagesWithErrors.length > 0) {
    console.log(`Pages with error indicators: ${pagesWithErrors.length}`);
    pagesWithErrors.forEach(([name]) => {
      console.log(`  - ${name}`);
    });
  }

  return {
    success: successfulPages === totalPages && pagesWithErrors.length === 0,
    results,
    summary: {
      total: totalPages,
      successful: successfulPages,
      failed: totalPages - successfulPages,
      withErrorIndicators: pagesWithErrors.length
    }
  };
}

function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const parsedUrl = new URL(url);
    
    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port,
      path: parsedUrl.pathname + parsedUrl.search,
      method: 'GET',
      headers: {
        'User-Agent': 'VeroTrades-Test/1.0',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      },
      timeout: 10000
    };

    const client = parsedUrl.protocol === 'https:' ? https : http;
    
    const req = client.request(options, (res) => {
      let body = '';
      
      res.on('data', (chunk) => {
        body += chunk;
      });
      
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: body,
          responseTime: Date.now() - startTime
        });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

// Run the test
testApplicationPages().then(result => {
  console.log('\n🏁 Page testing completed');
  
  if (result.success) {
    console.log('✅ All pages are accessible and working correctly!');
  } else {
    console.log('⚠️ Some pages have issues or errors.');
  }
  
  process.exit(result.success ? 0 : 1);
}).catch(error => {
  console.error('❌ Page testing failed:', error);
  process.exit(1);
});