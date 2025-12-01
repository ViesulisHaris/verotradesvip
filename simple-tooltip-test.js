const { chromium } = require('playwright');

async function simpleTooltipTest() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Capture console messages
  const consoleMessages = [];
  page.on('console', msg => {
    consoleMessages.push({
      type: msg.type(),
      text: msg.text()
    });
    console.log(`${msg.type()}: ${msg.text()}`);
  });

  page.on('pageerror', error => {
    console.log('Page error:', error.message);
  });

  try {
    console.log('=== Testing Chart Debug Page ===');
    
    // Go to debug page
    await page.goto('http://localhost:3000/test-chart-debug');
    
    // Wait for page to load
    await page.waitForTimeout(3000);
    
    // Check if page loaded successfully
    const title = await page.title();
    console.log('Page title:', title);
    
    // Look for the chart container
    const chartContainer = await page.$('.chart-container-enhanced');
    if (chartContainer) {
      console.log('✅ Chart container found');
      
      // Try to hover over the chart area
      const rechartsWrapper = await page.$('.recharts-wrapper');
      if (rechartsWrapper) {
        console.log('✅ Recharts wrapper found');
        
        // Get bounding box and hover
        const box = await rechartsWrapper.boundingBox();
        if (box) {
          await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
          await page.waitForTimeout(2000);
          console.log('✅ Hovered over chart area');
        }
      }
    } else {
      console.log('❌ Chart container not found');
    }
    
    // Check for specific tooltip error
    const tooltipErrors = consoleMessages.filter(msg => 
      msg.text.includes('Cannot read properties of undefined') && 
      msg.text.includes('value')
    );
    
    if (tooltipErrors.length > 0) {
      console.log('❌ Tooltip errors found:', tooltipErrors.length);
      tooltipErrors.forEach(error => console.log('  -', error.text));
    } else {
      console.log('✅ No tooltip errors found!');
    }
    
    console.log('\n=== Testing Confluence Page ===');
    
    // Go to confluence page
    await page.goto('http://localhost:3000/confluence');
    
    // Wait for page to load
    await page.waitForTimeout(5000);
    
    // Check if page loaded successfully
    const confluenceTitle = await page.title();
    console.log('Page title:', confluenceTitle);
    
    // Look for the chart in confluence page
    const confluenceChart = await page.$('.recharts-wrapper');
    if (confluenceChart) {
      console.log('✅ Confluence chart found');
      
      // Get bounding box and hover
      const box = await confluenceChart.boundingBox();
      if (box) {
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
        await page.waitForTimeout(2000);
        console.log('✅ Hovered over confluence chart area');
      }
    } else {
      console.log('❌ Confluence chart not found');
    }
    
    // Check for specific tooltip error on confluence page
    const confluenceErrors = consoleMessages.filter(msg => 
      msg.text.includes('Cannot read properties of undefined') && 
      msg.text.includes('value')
    );
    
    if (confluenceErrors.length > 0) {
      console.log('❌ Confluence tooltip errors found:', confluenceErrors.length);
      confluenceErrors.forEach(error => console.log('  -', error.text));
    } else {
      console.log('✅ No confluence tooltip errors found!');
    }
    
    console.log('\n=== SUMMARY ===');
    console.log('Total console messages:', consoleMessages.length);
    console.log('Error messages:', consoleMessages.filter(msg => msg.type === 'error').length);
    console.log('Tooltip-specific errors:', tooltipErrors.length + confluenceErrors.length);
    
    if (tooltipErrors.length === 0 && confluenceErrors.length === 0) {
      console.log('🎉 SUCCESS: The CustomTooltip fix is working correctly!');
    } else {
      console.log('❌ FAILURE: Tooltip errors still exist');
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await browser.close();
  }
}

simpleTooltipTest();