const puppeteer = require('puppeteer');

async function testDesktopLayout() {
  console.log('🔍 Testing desktop layout...');
  
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  
  // Set desktop viewport
  await page.setViewport({ width: 1920, height: 1080 });
  
  try {
    await page.goto('http://localhost:3000/dashboard', { waitUntil: 'networkidle0' });
    
    // Wait for page to load
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log('📊 Analyzing layout...');
    
    // Check for sidebar
    const sidebar = await page.$('aside');
    const sidebarExists = !!sidebar;
    const sidebarStyles = sidebar ? await page.evaluate(el => {
      const styles = window.getComputedStyle(el);
      return {
        display: styles.display,
        width: styles.width,
        visibility: styles.visibility
      };
    }, sidebar) : null;
    
    // Check main content margin
    const mainContent = await page.$('main');
    const mainMargin = mainContent ? await page.evaluate(el => {
      return window.getComputedStyle(el).marginLeft;
    }, mainContent) : null;
    
    // Check grid columns
    const gridContainer = await page.$('.grid');
    const gridStyles = gridContainer ? await page.evaluate(el => {
      return window.getComputedStyle(el).gridTemplateColumns;
    }, gridContainer) : null;
    
    // Check container width
    const container = await page.$('.max-w-7xl');
    const containerWidth = container ? await page.evaluate(el => {
      return window.getComputedStyle(el).maxWidth;
    }, container) : null;
    
    // Check font size
    const fontSize = await page.evaluate(() => {
      return window.getComputedStyle(document.documentElement).fontSize;
    });
    
    console.log('=== DESKTOP LAYOUT ANALYSIS ===');
    console.log('Sidebar exists:', sidebarExists);
    console.log('Sidebar styles:', sidebarStyles);
    console.log('Main margin:', mainMargin);
    console.log('Grid columns:', gridStyles);
    console.log('Container width:', containerWidth);
    console.log('Font size:', fontSize);
    
    // Take screenshot
    await page.screenshot({ path: 'desktop-layout-test.png', fullPage: true });
    console.log('📸 Screenshot saved as desktop-layout-test.png');
    
  } catch (error) {
    console.error('❌ Error testing layout:', error);
  } finally {
    await browser.close();
  }
}

testDesktopLayout();