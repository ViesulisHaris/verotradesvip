const puppeteer = require('puppeteer');
const fs = require('fs');

async function testEmotionalAnalysis() {
  console.log('🧪 Emotional State Analysis Test');
  console.log('===============================');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1920, height: 1080 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  // Create screenshots directory
  if (!fs.existsSync('test-screenshots')) {
    fs.mkdirSync('test-screenshots');
  }
  
  // Capture console logs
  const consoleMessages = [];
  page.on('console', msg => {
    const text = msg.text();
    consoleMessages.push({
      type: msg.type(),
      text: text,
      timestamp: new Date().toISOString()
    });
    
    // Focus on emotion-related logs
    if (text.includes('EMOTION') || text.includes('emotion') || text.includes('EMOTIONAL')) {
      console.log(`🔍 ${msg.type().toUpperCase()}: ${text}`);
    }
  });
  
  // Capture network requests
  const networkRequests = [];
  page.on('request', request => {
    if (request.url().includes('trades') || request.url().includes('strategies')) {
      networkRequests.push({
        type: 'request',
        url: request.url(),
        method: request.method(),
        timestamp: new Date().toISOString()
      });
    }
  });
  
  page.on('response', response => {
    if (response.url().includes('trades') || response.url().includes('strategies')) {
      networkRequests.push({
        type: 'response',
        url: response.url(),
        status: response.status(),
        timestamp: new Date().toISOString()
      });
    }
  });
  
  try {
    // Test Dashboard Page
    console.log('\n1️⃣ Testing Dashboard Page');
    console.log('---------------------------');
    
    await page.goto('http://localhost:3000/dashboard', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    // Wait for page to fully load
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Look for emotional patterns section
    const dashboardEmotionSection = await page.evaluate(() => {
      const sections = Array.from(document.querySelectorAll('h3'));
      const emotionSection = sections.find(h => 
        h.textContent && h.textContent.includes('Emotional Patterns')
      );
      
      if (emotionSection) {
        const container = emotionSection.closest('div');
        return {
          found: true,
          text: container?.textContent?.substring(0, 500) || 'No text found'
        };
      }
      
      return { found: false };
    });
    
    console.log('📊 Dashboard Emotion Section:', dashboardEmotionSection);
    
    // Take screenshot
    await page.screenshot({
      path: 'test-screenshots/dashboard-emotional-analysis.png'
    });
    console.log('📸 Dashboard screenshot saved');
    
    // Extract emotion data from console logs
    const dashboardEmotionLogs = consoleMessages.filter(msg => 
      msg.text.includes('DASHBOARD EMOTION DEBUG')
    );
    
    console.log('\n📋 Dashboard Emotion Logs:');
    dashboardEmotionLogs.forEach(log => {
      console.log(`  ${log.timestamp}: ${log.text}`);
    });
    
    // Test Confluence Page
    console.log('\n2️⃣ Testing Confluence Page');
    console.log('---------------------------');
    
    await page.goto('http://localhost:3000/confluence', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    // Wait for page to fully load
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Check for active filters
    const filterState = await page.evaluate(() => {
      const filterPills = document.querySelectorAll('.filter-pill.active');
      const inputs = document.querySelectorAll('input[type="date"], input[type="text"], select');
      
      const activeFilters = [];
      
      filterPills.forEach(pill => {
        if (pill.textContent && pill.textContent.trim()) {
          activeFilters.push({
            type: 'pill',
            text: pill.textContent.trim()
          });
        }
      });
      
      inputs.forEach(input => {
        if (input.value && input.value.trim()) {
          activeFilters.push({
            type: 'input',
            name: input.name || input.id || 'unnamed',
            value: input.value.trim()
          });
        }
      });
      
      return {
        activeFilterCount: activeFilters.length,
        activeFilters: activeFilters
      };
    });
    
    console.log('🔍 Confluence Filter State:', filterState);
    
    // Reset filters if any are active
    if (filterState.activeFilterCount > 0) {
      console.log('🔄 Resetting filters...');
      try {
        await page.click('button:contains("Reset All")');
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        console.log('⚠️ Could not reset filters automatically');
      }
    }
    
    // Look for emotional state analysis section
    const confluenceEmotionSection = await page.evaluate(() => {
      const sections = Array.from(document.querySelectorAll('h3'));
      const emotionSection = sections.find(h => 
        h.textContent && h.textContent.includes('Emotional State Analysis')
      );
      
      if (emotionSection) {
        const container = emotionSection.closest('div');
        return {
          found: true,
          text: container?.textContent?.substring(0, 500) || 'No text found'
        };
      }
      
      return { found: false };
    });
    
    console.log('📊 Confluence Emotion Section:', confluenceEmotionSection);
    
    // Take screenshot
    await page.screenshot({
      path: 'test-screenshots/confluence-emotional-analysis.png'
    });
    console.log('📸 Confluence screenshot saved');
    
    // Extract emotion data from console logs
    const confluenceEmotionLogs = consoleMessages.filter(msg => 
      msg.text.includes('CONFLUENCE EMOTION DEBUG')
    );
    
    console.log('\n📋 Confluence Emotion Logs:');
    confluenceEmotionLogs.forEach(log => {
      console.log(`  ${log.timestamp}: ${log.text}`);
    });
    
    // Test Filters
    console.log('\n3️⃣ Testing Filters');
    console.log('------------------');
    
    try {
      // Apply FOMO filter
      await page.click('button:contains("FOMO Trades")');
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const filteredLogs = consoleMessages.filter(msg => 
        msg.text.includes('EMOTION FILTER DEBUG')
      );
      
      console.log('\n📋 Filter Debug Logs:');
      filteredLogs.forEach(log => {
        console.log(`  ${log.timestamp}: ${log.text}`);
      });
      
      // Reset filters
      await page.click('button:contains("Reset All")');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
    } catch (error) {
      console.log('⚠️ Could not test filters:', error.message);
    }
    
    // Compare Data Sources
    console.log('\n4️⃣ Comparing Data Sources');
    console.log('-----------------------');
    
    const dataComparison = {
      dashboardEmotionLogs: dashboardEmotionLogs.length,
      confluenceEmotionLogs: confluenceEmotionLogs.length,
      networkRequests: networkRequests.length,
      consoleErrors: consoleMessages.filter(msg => msg.type === 'error').length,
      consoleWarnings: consoleMessages.filter(msg => msg.type === 'warning').length
    };
    
    console.log('📊 Data Comparison:', dataComparison);
    
    // Save detailed logs
    const testReport = {
      timestamp: new Date().toISOString(),
      dashboard: {
        emotionSectionFound: dashboardEmotionSection.found,
        emotionLogs: dashboardEmotionLogs,
        screenshot: 'test-screenshots/dashboard-emotional-analysis.png'
      },
      confluence: {
        emotionSectionFound: confluenceEmotionSection.found,
        emotionLogs: confluenceEmotionLogs,
        filterState: filterState,
        screenshot: 'test-screenshots/confluence-emotional-analysis.png'
      },
      network: networkRequests,
      console: consoleMessages,
      comparison: dataComparison
    };
    
    fs.writeFileSync(
      'emotional-analysis-test-report.json',
      JSON.stringify(testReport, null, 2)
    );
    
    console.log('\n📄 Detailed test report saved to emotional-analysis-test-report.json');
    
  } catch (error) {
    console.error('❌ Test Error:', error);
  } finally {
    await browser.close();
  }
}

// Run the test
testEmotionalAnalysis().then(() => {
  console.log('\n✅ Test completed!');
}).catch(error => {
  console.error('❌ Test failed:', error);
});