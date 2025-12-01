const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // Navigate to the strategies page
  await page.goto('http://localhost:3000/strategies');
  
  // Wait for the page to load
  await page.waitForLoadState('networkidle');
  
  // Take a screenshot
  await page.screenshot({ path: 'strategies-page-test.png', fullPage: true });
  
  // Check if the page contains the expected content
  const hasStrategiesHeader = await page.locator('h1:has-text("Strategies")').isVisible();
  const hasCreateButton = await page.locator('a:has-text("+ Create Strategy")').first().isVisible();
  const hasUnifiedLayout = await page.locator('.verotrade-content-wrapper').first().isVisible();
  
  console.log('Strategies Header:', hasStrategiesHeader);
  console.log('Create Button:', hasCreateButton);
  console.log('Unified Layout:', hasUnifiedLayout);
  
  // Get the page title
  const title = await page.title();
  console.log('Page Title:', title);
  
  // Get the page HTML
  const html = await page.content();
  console.log('Page HTML length:', html.length);
  
  await browser.close();
})();