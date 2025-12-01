const puppeteer = require('puppeteer');
const path = require('path');

async function testEmotionalStateAnalysis() {
  console.log('🧪 Starting Emotional State Analysis Test');
  console.log('=====================================');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1920, height: 1080 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  // Enable console logging from the page
  page.on('console', msg => {
    console.log('🌐 BROWSER CONSOLE:', msg.text());
  });
  
  // Enable network request logging
  page.on('request', request => {
    if (request.url().includes('trades') || request.url().includes('strategies')) {
      console.log('📡 NETWORK REQUEST:', request.method(), request.url());
    }
  });
  
  page.on('response', response => {
    if (response.url().includes('trades') || response.url().includes('strategies')) {
      console.log('📥 NETWORK RESPONSE:', response.status(), response.url());
    }
  });
  
  try {
    // Navigate to dashboard first
    console.log('\n1️⃣ Testing Dashboard Page');
    console.log('---------------------------');
    
    await page.goto('http://localhost:3000/dashboard', { waitUntil: 'networkidle2' });
    await page.waitForTimeout(3000); // Wait for data to load
    
    // Extract emotional state data from dashboard
    const dashboardEmotionData = await page.evaluate(() => {
      // Find the EmotionRadar component and get its data
      const emotionRadarElements = document.querySelectorAll('[data-testid="emotion-radar"]');
      if (emotionRadarElements.length === 0) {
        // Try to find by other means
        const radarElements = Array.from(document.querySelectorAll('div')).filter(el => 
          el.textContent && el.textContent.includes('Emotional Patterns')
        );
        
        if (radarElements.length > 0) {
          const radarContainer = radarElements[0].closest('div');
          // Look for console logs that contain emotion data
          return {
            error: 'EmotionRadar component not found with testid',
            containerFound: true,
            containerText: radarContainer?.textContent?.substring(0, 200) || 'No text'
          };
        }
        
        return { error: 'No emotion radar container found' };
      }
      
      // Try to get data from window if available
      if (window.dashboardEmotionData) {
        return window.dashboardEmotionData;
      }
      
      // Try to extract from console logs
      return { message: 'Checking console logs for emotion data' };
    });
    
    console.log('📊 Dashboard Emotion Data:', dashboardEmotionData);
    
    // Take screenshot of dashboard
    await page.screenshot({ 
      path: 'test-screenshots/dashboard-emotional-analysis.png',
      fullPage: false 
    });
    console.log('📸 Dashboard screenshot saved');
    
    // Navigate to confluence page
    console.log('\n2️⃣ Testing Confluence Page (No Filters)');
    console.log('----------------------------------------');
    
    await page.goto('http://localhost:3000/confluence', { waitUntil: 'networkidle2' });
    await page.waitForTimeout(3000); // Wait for data to load
    
    // Check if any filters are active
    const activeFilters = await page.evaluate(() => {
      const filterPills = document.querySelectorAll('.filter-pill.active');
      const filterInputs = document.querySelectorAll('input[type="date"], input[type="text"]');
      
      let filters = [];
      
      // Check filter pills
      filterPills.forEach(pill => {
        if (pill.textContent && pill.textContent.trim()) {
          filters.push(`Pill: ${pill.textContent.trim()}`);
        }
      });
      
      // Check input values
      filterInputs.forEach(input => {
        if (input.value && input.value.trim()) {
          filters.push(`Input ${input.name || input.type}: ${input.value}`);
        }
      });
      
      return filters;
    });
    
    console.log('🔍 Active filters on confluence page:', activeFilters);
    
    // Reset all filters to ensure clean state
    console.log('🔄 Resetting all filters...');
    await page.click('button:contains("Reset All")');
    await page.waitForTimeout(1000);
    
    // Extract emotional state data from confluence
    const confluenceEmotionData = await page.evaluate(() => {
      // Similar extraction logic as dashboard
      if (window.confluenceEmotionData) {
        return window.confluenceEmotionData;
      }
      
      return { message: 'Checking console logs for emotion data' };
    });
    
    console.log('📊 Confluence Emotion Data:', confluenceEmotionData);
    
    // Take screenshot of confluence
    await page.screenshot({ 
      path: 'test-screenshots/confluence-emotional-analysis.png',
      fullPage: false 
    });
    console.log('📸 Confluence screenshot saved');
    
    // Test filters on confluence page
    console.log('\n3️⃣ Testing Filters on Confluence Page');
    console.log('------------------------------------');
    
    // Apply a filter (e.g., FOMO)
    await page.click('button:contains("FOMO Trades")');
    await page.waitForTimeout(2000);
    
    // Check if emotion data updates
    const filteredEmotionData = await page.evaluate(() => {
      return { message: 'Checking filtered emotion data' };
    });
    
    console.log('📊 Filtered Emotion Data:', filteredEmotionData);
    
    // Reset filters again
    await page.click('button:contains("Reset All")');
    await page.waitForTimeout(2000);
    
    // Compare data sources
    console.log('\n4️⃣ Comparing Data Sources');
    console.log('------------------------');
    
    const dataComparison = await page.evaluate(() => {
      // Get trade data from both pages
      const getAllTrades = () => {
        // This would need to be implemented based on how data is stored
        return window.trades || [];
      };
      
      const getFilteredTrades = () => {
        // This would need to be implemented based on how filtered data is stored
        return window.filteredTrades || [];
      };
      
      return {
        allTradesCount: getAllTrades().length,
        filteredTradesCount: getFilteredTrades().length,
        hasActiveFilters: window.hasActiveFilters || false
      };
    });
    
    console.log('📊 Data Source Comparison:', dataComparison);
    
    // Check for console errors
    console.log('\n5️⃣ Checking for Console Errors');
    console.log('------------------------------');
    
    const consoleErrors = await page.evaluate(() => {
      const errors = [];
      const originalError = console.error;
      const originalWarn = console.warn;
      
      // Capture existing errors
      return {
        errors: window.consoleErrors || [],
        warnings: window.consoleWarnings || []
      };
    });
    
    console.log('🚨 Console Errors:', consoleErrors);
    
  } catch (error) {
    console.error('❌ Test Error:', error);
  } finally {
    await browser.close();
  }
}

// Create screenshots directory if it doesn't exist
const fs = require('fs');
if (!fs.existsSync('test-screenshots')) {
  fs.mkdirSync('test-screenshots');
}

// Run the test
testEmotionalStateAnalysis().then(() => {
  console.log('\n✅ Test completed!');
  console.log('📁 Screenshots saved in test-screenshots directory');
}).catch(error => {
  console.error('❌ Test failed:', error);
});