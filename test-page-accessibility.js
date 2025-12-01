const http = require('http');
const { exec } = require('child_process');

// Test if pages are accessible
async function testPageAccessibility() {
  console.log('🔍 Testing page accessibility...\n');
  
  const pages = [
    { path: '/', name: 'Home' },
    { path: '/dashboard', name: 'Dashboard' },
    { path: '/confluence', name: 'Confluence' },
    { path: '/calendar', name: 'Calendar' },
    { path: '/strategies', name: 'Strategies' },
    { path: '/trades', name: 'Trades' },
    { path: '/log-trade', name: 'Log Trade' },
    { path: '/analytics', name: 'Analytics' }
  ];
  
  const baseUrl = 'http://localhost:3000';
  const results = [];
  
  for (const page of pages) {
    try {
      console.log(`Testing ${page.name} (${page.path})...`);
      
      const response = await fetch(`${baseUrl}${page.path}`, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        redirect: 'manual'
      }).catch(err => {
        return { status: 0, error: err.message };
      });
      
      if (response && response.status) {
        const status = response.status;
        const isSuccess = status >= 200 && status < 300;
        const isNotFound = status === 404;
        
        results.push({
          page: page.name,
          path: page.path,
          status,
          success: isSuccess,
          isNotFound
        });
        
        console.log(`  Status: ${status} ${isSuccess ? '✅' : isNotFound ? '❌' : '⚠️'}`);
      } else {
        results.push({
          page: page.name,
          path: page.path,
          status: 0,
          success: false,
          isNotFound: false,
          error: response?.error || 'Connection failed'
        });
        
        console.log(`  Status: Connection failed ❌`);
      }
    } catch (error) {
      results.push({
        page: page.name,
        path: page.path,
        status: 0,
        success: false,
        isNotFound: false,
        error: error.message
      });
      
      console.log(`  Status: Error - ${error.message} ❌`);
    }
  }
  
  console.log('\n📊 Test Results Summary:');
  console.log('========================');
  
  const successCount = results.filter(r => r.success).length;
  const notFoundCount = results.filter(r => r.isNotFound).length;
  const errorCount = results.length - successCount - notFoundCount;
  
  console.log(`✅ Successful: ${successCount}`);
  console.log(`❌ 404 Errors: ${notFoundCount}`);
  console.log(`⚠️ Other Errors: ${errorCount}`);
  console.log(`📈 Total Pages: ${results.length}`);
  
  if (notFoundCount > 0) {
    console.log('\n❌ Pages with 404 errors:');
    results.filter(r => r.isNotFound).forEach(r => {
      console.log(`  - ${r.name} (${r.path})`);
    });
  }
  
  if (errorCount > 0) {
    console.log('\n⚠️ Pages with other errors:');
    results.filter(r => !r.success && !r.isNotFound).forEach(r => {
      console.log(`  - ${r.name} (${r.path}): ${r.error || 'Unknown error'}`);
    });
  }
  
  return results;
}

// Check if Next.js dev server is running
async function checkDevServer() {
  try {
    console.log('🔍 Checking if Next.js dev server is running...');
    const response = await fetch('http://localhost:3000', { 
      method: 'HEAD',
      timeout: 5000 
    });
    return response.status === 200;
  } catch (error) {
    console.log('❌ Dev server is not accessible:', error.message);
    return false;
  }
}

// Main execution
async function main() {
  const serverRunning = await checkDevServer();
  
  if (!serverRunning) {
    console.log('\n⚠️ Please make sure the Next.js dev server is running on port 3000');
    console.log('   Run: cd verotradesvip && npm run dev');
    process.exit(1);
  }
  
  await testPageAccessibility();
}

main().catch(console.error);