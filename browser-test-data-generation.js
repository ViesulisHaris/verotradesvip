const { chromium } = require('playwright');

async function generateTestDataViaBrowser() {
  console.log('🚀 Starting test data generation via browser...');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // Navigate to the test data generation page
    console.log('📝 Navigating to test data generation page...');
    await page.goto('http://localhost:3000/test-comprehensive-data');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Check if we need to log in first
    if (page.url().includes('/login')) {
      console.log('🔐 Login required, logging in...');
      
      // Fill in login credentials
      await page.fill('input[name="email"]', 'test@example.com');
      await page.fill('input[name="password"]', 'test123456');
      
      // Click login button
      await page.click('button[type="submit"]');
      
      // Wait for login to complete
      await page.waitForLoadState('networkidle');
      
      // Navigate back to test data generation page
      await page.goto('http://localhost:3000/test-comprehensive-data');
      await page.waitForLoadState('networkidle');
    }
    
    console.log('📄 Page loaded successfully');
    
    // Execute the complete 4-step process
    console.log('🚀 Clicking "Execute Complete 4-Step Process" button...');
    
    // Click the execute all steps button
    await page.click('button:has-text("Execute Complete 4-Step Process")');
    
    // Wait for the process to complete (monitor for results)
    console.log('⏳ Waiting for test data generation to complete...');
    
    // Wait for success indicators (check for at least 4 result items)
    await page.waitForFunction(() => {
      const results = document.querySelectorAll('[data-testid="result-item"] .border, .border.rounded-lg');
      return results.length >= 4;
    }, { timeout: 60000 });
    
    // Wait a bit more for all data to be processed
    await page.waitForTimeout(3000);
    
    console.log('✅ Test data generation completed!');
    
    // Extract and display results
    const results = await page.$$eval('.border.rounded-lg', elements => {
      return elements.map(el => {
        const titleEl = el.querySelector('h3');
        const messageEl = el.querySelector('.text-sm');
        const statusEl = el.querySelector('.text-green-600, .text-red-600');
        
        return {
          action: titleEl ? titleEl.textContent.trim() : 'Unknown',
          message: messageEl ? messageEl.textContent.trim() : 'No message',
          status: statusEl ? statusEl.textContent.trim() : 'No status'
        };
      });
    });
    
    console.log('\n📊 Results Summary:');
    results.forEach((result, index) => {
      console.log(`${index + 1}. ${result.action}: ${result.message}`);
    });
    
    // Check for verification data
    const verificationExists = await page.$('.bg-white.rounded-lg.shadow-lg.p-6.mb-8 h2:has-text("Data Verification Results")');
    
    if (verificationExists) {
      console.log('\n🔍 Extracting verification data...');
      
      const verificationData = await page.evaluate(() => {
        // Extract summary data
        const summaryCards = document.querySelectorAll('.grid.grid-cols-1.md\\:grid-cols-2.lg\\:grid-cols-4 .rounded-lg.p-4');
        const summary = {};
        
        summaryCards.forEach(card => {
          const title = card.querySelector('h3')?.textContent.trim();
          const value = card.querySelector('.text-2xl')?.textContent.trim();
          
          if (title && value) {
            if (title.includes('Total Trades')) summary.totalTrades = value;
            if (title.includes('Win Rate')) summary.winRate = value;
            if (title.includes('Total Strategies')) summary.totalStrategies = value;
            if (title.includes('Total P&L')) summary.totalPnL = value;
          }
        });
        
        // Extract emotional states
        const emotionDistribution = {};
        const emotionSection = Array.from(document.querySelectorAll('h3')).find(h => h.textContent.includes('Emotional States'));
        
        if (emotionSection) {
          const emotionItems = emotionSection.parentElement.querySelectorAll('.flex.justify-between');
          emotionItems.forEach(item => {
            const emotion = item.querySelector('.text-gray-600')?.textContent.trim();
            const count = item.querySelector('.font-medium')?.textContent.trim();
            if (emotion && count) {
              emotionDistribution[emotion] = count;
            }
          });
        }
        
        return { summary, emotionDistribution };
      });
      
      console.log('\n📈 Summary:');
      Object.entries(verificationData.summary).forEach(([key, value]) => {
        console.log(`  ${key}: ${value}`);
      });
      
      console.log('\n😊 Emotional States Distribution:');
      Object.entries(verificationData.emotionDistribution).forEach(([emotion, count]) => {
        console.log(`  ${emotion}: ${count}`);
      });
      
      // Check if all 8 emotions are present
      const emotionCount = Object.keys(verificationData.emotionDistribution).length;
      if (emotionCount >= 8) {
        console.log('\n✅ SUCCESS: All 8 emotional states are represented in the data!');
      } else {
        console.log(`\n⚠️  WARNING: Only ${emotionCount} emotional states found (expected 8)`);
      }
    }
    
    console.log('\n🎉 Test data generation completed successfully!');
    console.log('📝 You can now navigate to /confluence or /dashboard to see the emotional analysis in action.');
    
    // Take a screenshot for verification
    await page.screenshot({ path: 'test-data-generation-results.png', fullPage: true });
    console.log('📸 Screenshot saved as test-data-generation-results.png');
    
  } catch (error) {
    console.error('❌ Error during test data generation:', error.message);
    
    // Take a screenshot for debugging
    await page.screenshot({ path: 'test-data-generation-error.png', fullPage: true });
    console.log('📸 Error screenshot saved as test-data-generation-error.png');
    
  } finally {
    await browser.close();
  }
}

// Execute the test data generation
generateTestDataViaBrowser().catch(console.error);