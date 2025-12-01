const { chromium } = require('playwright');

async function debugHomePage() {
  console.log('Debugging Home Page...');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // Navigate to home page
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    
    // Get page content
    const pageContent = await page.content();
    console.log('\n=== PAGE HTML CONTENT ===');
    console.log(pageContent.substring(0, 2000) + '...');
    
    // Check for specific elements
    console.log('\n=== ELEMENT CHECKS ===');
    
    // Check for h1 elements
    const h1Elements = await page.locator('h1').count();
    console.log(`H1 elements found: ${h1Elements}`);
    
    if (h1Elements > 0) {
      const h1Texts = await page.locator('h1').allTextContents();
      console.log('H1 texts:', h1Texts);
    }
    
    // Check for h2 elements
    const h2Elements = await page.locator('h2').count();
    console.log(`H2 elements found: ${h2Elements}`);
    
    if (h2Elements > 0) {
      const h2Texts = await page.locator('h2').allTextContents();
      console.log('H2 texts:', h2Texts);
    }
    
    // Check for any element containing "Trading Journal"
    const tradingJournalElements = await page.locator('*:has-text("Trading Journal")').count();
    console.log(`Elements with "Trading Journal" text: ${tradingJournalElements}`);
    
    // Check for any element containing "Welcome"
    const welcomeElements = await page.locator('*:has-text("Welcome")').count();
    console.log(`Elements with "Welcome" text: ${welcomeElements}`);
    
    // Check for body content
    const bodyText = await page.locator('body').textContent();
    console.log(`\nBody text length: ${bodyText.length}`);
    console.log('Body text preview:', bodyText.substring(0, 200));
    
    // Check if AuthGuard is rendering children
    const authGuardElements = await page.locator('*:has-text("Loading")').count();
    console.log(`Loading elements found: ${authGuardElements}`);
    
    // Take screenshot
    await page.screenshot({ path: 'debug-home-page.png', fullPage: true });
    console.log('\nScreenshot saved: debug-home-page.png');
    
  } catch (error) {
    console.error('Error debugging home page:', error);
  } finally {
    await browser.close();
  }
}

debugHomePage().catch(console.error);