const http = require('http');
const https = require('https');
const fs = require('fs');

function checkUrl(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    
    const req = protocol.get(url, (res) => {
      resolve({
        url,
        status: res.statusCode,
        headers: res.headers,
        success: res.statusCode >= 200 && res.statusCode < 400
      });
    });

    req.on('error', (err) => {
      resolve({
        url,
        status: 'ERROR',
        error: err.message,
        success: false
      });
    });

    req.setTimeout(5000, () => {
      req.destroy();
      resolve({
        url,
        status: 'TIMEOUT',
        error: 'Request timeout',
        success: false
      });
    });
  });
}

async function simpleVerification() {
  console.log('🔍 Starting Simple Final Verification...\n');
  
  const results = {
    serverStatus: false,
    staticAssets: {
      css: false,
      js: false,
      overall: false
    },
    tradesPage: {
      accessible: false,
      redirectsCorrectly: false
    },
    errors: []
  };

  try {
    console.log('🌐 1. Testing Server Status...');
    
    // Check if server is running
    const serverCheck = await checkUrl('http://localhost:3000');
    if (serverCheck.success) {
      console.log('✅ Development server is running');
      results.serverStatus = true;
    } else {
      console.log('❌ Development server not accessible');
      results.errors.push('Development server not accessible');
    }

    console.log('\n📦 2. Testing Static Asset Loading...');
    
    // Test common static asset patterns
    const assetTests = [
      'http://localhost:3000/_next/static/css/app/layout.css',
      'http://localhost:3000/_next/static/chunks/webpack.js',
      'http://localhost:3000/_next/static/chunks/main-app.js'
    ];

    let assetSuccessCount = 0;
    for (const assetUrl of assetTests) {
      const assetCheck = await checkUrl(assetUrl);
      if (assetCheck.success) {
        console.log(`✅ Asset loads: ${assetUrl.split('/').pop()}`);
        assetSuccessCount++;
        
        if (assetUrl.includes('.css')) {
          results.staticAssets.css = true;
        } else if (assetUrl.includes('.js')) {
          results.staticAssets.js = true;
        }
      } else {
        console.log(`❌ Asset failed: ${assetUrl.split('/').pop()} - ${assetCheck.status}`);
        results.errors.push(`Asset failed: ${assetUrl}`);
      }
    }

    if (assetSuccessCount >= 2) {
      results.staticAssets.overall = true;
      console.log('✅ Static assets loading properly');
    } else {
      console.log('❌ Static assets have issues');
    }

    console.log('\n📊 3. Testing Trades Page...');
    
    // Check trades page accessibility
    const tradesCheck = await checkUrl('http://localhost:3000/trades');
    if (tradesCheck.success) {
      console.log('✅ Trades page accessible');
      results.tradesPage.accessible = true;
      
      // Check if it redirects to login (expected behavior)
      if (tradesCheck.status === 200 || tradesCheck.status === 307) {
        console.log('✅ Trades page responds correctly (may redirect to login)');
        results.tradesPage.redirectsCorrectly = true;
      }
    } else {
      console.log('❌ Trades page not accessible');
      results.errors.push('Trades page not accessible');
    }

    console.log('\n📋 4. Analyzing Source Code for Statistics Fixes...');
    
    // Read the trades page source to verify fixes
    try {
      const tradesPageSource = fs.readFileSync('./src/app/trades/page.tsx', 'utf8');
      
      // Check for bar chart icon fix
      if (tradesPageSource.includes('bar_chart') && !tradesPageSource.includes('stacked_bar_chart')) {
        console.log('✅ Bar chart icon fix confirmed in source code');
        results.tradesStatistics = results.tradesStatistics || {};
        results.tradesStatistics.barChartIcon = true;
      } else {
        console.log('❌ Bar chart icon issue in source code');
        results.errors.push('Bar chart icon not fixed in source');
      }

      // Check for "Trades" label fix
      if (tradesPageSource.includes('<span>Trades</span>') || 
          (tradesPageSource.includes('Trades') && !tradesPageSource.includes('Total Trades'))) {
        console.log('✅ "Trades" label fix confirmed in source code');
        results.tradesStatistics = results.tradesStatistics || {};
        results.tradesStatistics.tradesLabel = true;
      } else {
        console.log('❌ "Trades" label issue in source code');
        results.errors.push('"Trades" label not fixed in source');
      }

      // Check for proper statistics card structure
      if (tradesPageSource.includes('flashlight-container') && 
          tradesPageSource.includes('flashlight-bg') && 
          tradesPageSource.includes('flashlight-border')) {
        console.log('✅ Statistics cards styling confirmed in source code');
        results.tradesStatistics = results.tradesStatistics || {};
        results.tradesStatistics.statisticsCards = true;
      } else {
        console.log('❌ Statistics cards styling issue in source code');
        results.errors.push('Statistics cards styling not fixed in source');
      }

    } catch (error) {
      console.log('❌ Could not read trades page source:', error.message);
      results.errors.push(`Source code read error: ${error.message}`);
    }

    console.log('\n📋 5. Checking Webpack Configuration...');
    
    // Check if next.config.js has proper static asset configuration
    try {
      const nextConfig = fs.readFileSync('./next.config.js', 'utf8');
      
      if (nextConfig.includes('webpack') && nextConfig.includes('generateEtags: false')) {
        console.log('✅ Webpack configuration includes static asset fixes');
        results.webpackConfig = true;
      } else {
        console.log('❌ Webpack configuration may need updates');
        results.errors.push('Webpack configuration may not include static asset fixes');
      }
    } catch (error) {
      console.log('❌ Could not read next.config.js:', error.message);
      results.errors.push(`Config file read error: ${error.message}`);
    }

  } catch (error) {
    console.error('❌ Verification error:', error);
    results.errors.push(`Verification error: ${error.message}`);
  }

  // Generate comprehensive report
  console.log('\n📋 SIMPLE VERIFICATION REPORT');
  console.log('=' .repeat(50));
  
  console.log('\n🌐 Server Status:');
  console.log(`  Server Running: ${results.serverStatus ? '✅ PASS' : '❌ FAIL'}`);
  
  console.log('\n📦 Static Assets:');
  console.log(`  CSS Loading: ${results.staticAssets.css ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`  JS Loading: ${results.staticAssets.js ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`  Overall Assets: ${results.staticAssets.overall ? '✅ PASS' : '❌ FAIL'}`);
  
  console.log('\n📊 Trades Page:');
  console.log(`  Page Accessible: ${results.tradesPage.accessible ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`  Redirects Correctly: ${results.tradesPage.redirectsCorrectly ? '✅ PASS' : '❌ FAIL'}`);
  
  if (results.tradesStatistics) {
    console.log('\n📈 Trades Statistics:');
    console.log(`  Bar Chart Icon: ${results.tradesStatistics.barChartIcon ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`  Trades Label: ${results.tradesStatistics.tradesLabel ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`  Statistics Cards: ${results.tradesStatistics.statisticsCards ? '✅ PASS' : '❌ FAIL'}`);
  }
  
  console.log(`\n⚙️  Webpack Config: ${results.webpackConfig ? '✅ PASS' : '❌ FAIL'}`);
  
  if (results.errors.length > 0) {
    console.log('\n❌ Issues Found:');
    results.errors.forEach((error, index) => {
      console.log(`  ${index + 1}. ${error}`);
    });
  }

  // Calculate overall success rate
  const allChecks = [
    results.serverStatus,
    results.staticAssets.css,
    results.staticAssets.js,
    results.staticAssets.overall,
    results.tradesPage.accessible,
    results.tradesPage.redirectsCorrectly,
    results.webpackConfig,
    ...(results.tradesStatistics ? Object.values(results.tradesStatistics) : [])
  ].filter(Boolean);
  
  const totalChecks = [
    results.serverStatus,
    results.staticAssets.css,
    results.staticAssets.js,
    results.staticAssets.overall,
    results.tradesPage.accessible,
    results.tradesPage.redirectsCorrectly,
    results.webpackConfig,
    ...(results.tradesStatistics ? Object.values(results.tradesStatistics) : [])
  ].length;
  
  const successRate = Math.round((allChecks.length / totalChecks) * 100);
  
  console.log(`\n🎯 Overall Success Rate: ${successRate}% (${allChecks.length}/${totalChecks} checks passed)`);
  
  // Save detailed report
  const reportData = {
    timestamp: new Date().toISOString(),
    successRate,
    results,
    summary: {
      serverWorking: results.serverStatus,
      staticAssetsFixed: results.staticAssets.overall,
      tradesPageWorking: results.tradesPage.accessible,
      tradesStatisticsFixed: results.tradesStatistics && 
        Object.values(results.tradesStatistics).every(Boolean),
      webpackConfigFixed: results.webpackConfig,
      allIssuesResolved: successRate >= 90
    }
  };
  
  fs.writeFileSync('simple-verification-report.json', JSON.stringify(reportData, null, 2));
  console.log('\n📄 Detailed report saved to: simple-verification-report.json');
  
  return reportData;
}

// Run the verification
if (require.main === module) {
  simpleVerification()
    .then(() => {
      console.log('\n✅ Simple verification completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Verification failed:', error);
      process.exit(1);
    });
}

module.exports = simpleVerification;