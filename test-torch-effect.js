// Test script to verify torch effect implementation
const { chromium } = require('playwright');

async function testTorchEffect() {
  console.log('🔥 Testing Torch Effect Implementation');
  
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    // Navigate to trades page
    await page.goto('http://localhost:3000/trades');
    await page.waitForLoadState('networkidle');
    
    console.log('✅ Page loaded successfully');
    
    // Wait for trades to load
    await page.waitForSelector('.flashlight-container, [data-testid="trade-row"]', { timeout: 10000 });
    console.log('✅ Trade elements found');
    
    // Check if FlashlightCard component is present
    const flashlightCards = await page.$$('.flashlight-card');
    console.log(`📦 Found ${flashlightCards.length} FlashlightCard components`);
    
    // Check if TorchEffect components are present
    const torchEffects = await page.$$('[data-testid="torch-effect"], .torch-effect');
    console.log(`🔥 Found ${torchEffects.length} TorchEffect components`);
    
    // Check for CSS custom properties used by FlashlightCard
    const customProperties = await page.evaluate(() => {
      const elements = document.querySelectorAll('.flashlight-card, .flashlight-container');
      return Array.from(elements).map(el => ({
        element: el.className,
        hasMouseX: getComputedStyle(el).getPropertyValue('--mouse-x') !== '',
        hasMouseY: getComputedStyle(el).getPropertyValue('--mouse-y') !== '',
        hasOpacity: getComputedStyle(el).getPropertyValue('--opacity') !== ''
      }));
    });
    
    console.log('🎨 CSS Custom Properties Check:');
    customProperties.forEach(props => {
      console.log(`  ${props.element}: mouseX=${props.hasMouseX}, mouseY=${props.hasMouseY}, opacity=${props.hasOpacity}`);
    });
    
    // Test mouse movement over trade rows
    const tradeRows = await page.$$('.flashlight-container, .flashlight-card');
    if (tradeRows.length > 0) {
      const firstRow = tradeRows[0];
      const box = await firstRow.boundingBox();
      
      if (box) {
        console.log('🖱️ Testing mouse movement over trade row...');
        
        // Move mouse over the trade row
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
        await page.waitForTimeout(500);
        
        // Check if CSS properties are updated
        const afterMove = await page.evaluate((el) => {
          const style = getComputedStyle(el);
          return {
            mouseX: style.getPropertyValue('--mouse-x'),
            mouseY: style.getPropertyValue('--mouse-y'),
            opacity: style.getPropertyValue('--opacity')
          };
        }, firstRow);
        
        console.log('📊 CSS Properties after mouse move:', afterMove);
      }
    }
    
    // Check useTorchEffect hook functionality
    const hookState = await page.evaluate(() => {
      // Look for any global state or indicators that the hook is working
      return {
        hasWindow: typeof window !== 'undefined',
        hasReact: !!window.React,
        hasNewTradeDetection: document.querySelector('[data-new-trade="true"]') !== null
      };
    });
    
    console.log('🪝 Hook State Check:', hookState);
    
    console.log('✅ Torch effect test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

// Run the test
testTorchEffect().catch(console.error);