const puppeteer = require('puppeteer');

async function testTooltipFix() {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  // Capture console errors
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  page.on('pageerror', error => {
    consoleErrors.push(error.message);
  });

  try {
    console.log('Testing chart debug page...');
    
    // Test the debug page
    await page.goto('http://localhost:3000/test-chart-debug');
    await page.waitForSelector('.chart-container-enhanced', { timeout: 10000 });
    
    // Wait for the chart to render
    await page.waitForTimeout(2000);
    
    // Try to hover over the chart to trigger tooltip
    const chartArea = await page.$('.recharts-wrapper');
    if (chartArea) {
      await chartArea.hover();
      await page.waitForTimeout(1000);
      
      // Move to different positions to trigger tooltips
      const chartBoundingBox = await chartArea.boundingBox();
      if (chartBoundingBox) {
        await page.mouse.move(
          chartBoundingBox.x + chartBoundingBox.width / 2,
          chartBoundingBox.y + chartBoundingBox.height / 2
        );
        await page.waitForTimeout(1000);
      }
    }
    
    console.log('Debug page test completed. Console errors:', consoleErrors.length);
    
    // Clear errors for next test
    consoleErrors.length = 0;
    
    console.log('Testing confluence page...');
    
    // Test the confluence page
    await page.goto('http://localhost:3000/confluence');
    await page.waitForSelector('.glass-enhanced', { timeout: 10000 });
    
    // Wait for the page to load
    await page.waitForTimeout(3000);
    
    // Test filter interactions
    const marketFilter = await page.$('select[name="market"]');
    if (marketFilter) {
      await marketFilter.select('Stock');
      await page.waitForTimeout(1000);
    }
    
    // Test the chart in confluence page
    const confluenceChart = await page.$('.recharts-wrapper');
    if (confluenceChart) {
      await confluenceChart.hover();
      await page.waitForTimeout(1000);
      
      const chartBoundingBox = await confluenceChart.boundingBox();
      if (chartBoundingBox) {
        await page.mouse.move(
          chartBoundingBox.x + chartBoundingBox.width / 2,
          chartBoundingBox.y + chartBoundingBox.height / 2
        );
        await page.waitForTimeout(1000);
      }
    }
    
    console.log('Confluence page test completed. Console errors:', consoleErrors.length);
    
    // Test results
    console.log('\n=== TEST RESULTS ===');
    console.log('Debug page errors:', consoleErrors.filter(e => e.includes('test-chart-debug')).length);
    console.log('Confluence page errors:', consoleErrors.filter(e => e.includes('confluence')).length);
    console.log('Total console errors:', consoleErrors.length);
    
    if (consoleErrors.length > 0) {
      console.log('\nConsole errors found:');
      consoleErrors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
    } else {
      console.log('\n✅ No console errors found! The tooltip fix appears to be working.');
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await browser.close();
  }
}

testTooltipFix();