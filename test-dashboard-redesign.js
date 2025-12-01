const puppeteer = require('puppeteer');
const path = require('path');

async function testDashboardRedesign() {
  console.log('🧪 Testing Dashboard Redesign Implementation...');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1920, height: 1080 }
  });
  
  try {
    const page = await browser.newPage();
    
    // Navigate to the home page first
    console.log('📍 Navigating to home page...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
    
    // Wait a moment for any animations
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Try to navigate to dashboard (will redirect to login if not authenticated)
    console.log('📍 Attempting to access dashboard...');
    await page.goto('http://localhost:3000/dashboard', { waitUntil: 'networkidle2' });
    
    // Wait for page to load
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Check if we're on the login page or dashboard
    const currentUrl = page.url();
    console.log(`🔍 Current URL: ${currentUrl}`);
    
    if (currentUrl.includes('/login')) {
      console.log('🔐 Redirected to login page - authentication required');
      
      // Check if login form is present
      const loginForm = await page.$('form');
      if (loginForm) {
        console.log('✅ Login form detected');
      } else {
        console.log('❌ Login form not found');
      }
    } else if (currentUrl.includes('/dashboard')) {
      console.log('📊 Dashboard accessed successfully');
      
      // Test key elements of the redesign
      console.log('🔍 Testing dashboard redesign elements...');
      
      // Check for VeroTrade logo
      const veroTradeLogo = await page.$('text=VeroTrade');
      if (veroTradeLogo) {
        console.log('✅ VeroTrade logo found');
      } else {
        console.log('❌ VeroTrade logo not found');
      }
      
      // Check for Trading Dashboard title
      const dashboardTitle = await page.$('text=Trading Dashboard');
      if (dashboardTitle) {
        console.log('✅ Trading Dashboard title found');
      } else {
        console.log('❌ Trading Dashboard title not found');
      }
      
      // Check for Total PnL card
      const totalPnLCard = await page.$('text=Total PnL');
      if (totalPnLCard) {
        console.log('✅ Total PnL card found');
      } else {
        console.log('❌ Total PnL card not found');
      }
      
      // Check for Profit Factor card
      const profitFactorCard = await page.$('text=Profit Factor');
      if (profitFactorCard) {
        console.log('✅ Profit Factor card found');
      } else {
        console.log('❌ Profit Factor card not found');
      }
      
      // Check for VRating Performance card
      const vRatingCard = await page.$('text=VRating Performance');
      if (vRatingCard) {
        console.log('✅ VRating Performance card found');
      } else {
        console.log('❌ VRating Performance card not found');
      }
      
      // Check for Sharpe Ratio card
      const sharpeRatioCard = await page.$('text=øSharpe Ratio');
      if (sharpeRatioCard) {
        console.log('✅ Sharpe Ratio card found');
      } else {
        console.log('❌ Sharpe Ratio card not found');
      }
      
      // Check for Prop certs card
      const propCertsCard = await page.$('text=Prop certs');
      if (propCertsCard) {
        console.log('✅ Prop certs card found');
      } else {
        console.log('❌ Prop certs card not found');
      }
      
      // Check for Dominant Emotion section
      const dominantEmotionSection = await page.$('text=Dominant Emotion');
      if (dominantEmotionSection) {
        console.log('✅ Dominant Emotion section found');
      } else {
        console.log('❌ Dominant Emotion section not found');
      }
      
      // Check for logout button
      const logoutButton = await page.$('button:has-text("Logout")');
      if (logoutButton) {
        console.log('✅ Logout button found');
      } else {
        console.log('❌ Logout button not found');
      }
      
      // Take a screenshot for visual verification
      await page.screenshot({ 
        path: path.join(__dirname, 'dashboard-redesign-test.png'),
        fullPage: true 
      });
      console.log('📸 Screenshot saved: dashboard-redesign-test.png');
      
      // Check the background color
      const backgroundColor = await page.evaluate(() => {
        return window.getComputedStyle(document.body).backgroundColor;
      });
      console.log(`🎨 Background color: ${backgroundColor}`);
      
      if (backgroundColor === 'rgb(0, 0, 0)' || backgroundColor === '#000000') {
        console.log('✅ Black background color verified');
      } else {
        console.log('❌ Background color is not black');
      }
    } else {
      console.log('❌ Unexpected page:', currentUrl);
    }
    
    console.log('🎉 Dashboard redesign test completed!');
    
  } catch (error) {
    console.error('❌ Error during test:', error);
  } finally {
    await browser.close();
  }
}

// Run the test
testDashboardRedesign().catch(console.error);