const puppeteer = require('puppeteer');
const path = require('path');

async function verifyDashboardRedesign() {
  console.log('🧪 Verifying Dashboard Redesign Implementation...');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1920, height: 1080 }
  });
  
  try {
    const page = await browser.newPage();
    
    // Navigate to the login page
    console.log('📍 Navigating to login page...');
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle2' });
    
    // Wait for page to load
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Check if login form is present
    const loginForm = await page.$('form');
    if (loginForm) {
      console.log('✅ Login form detected');
      
      // Fill in login credentials (using test credentials)
      await page.type('input[type="email"]', 'test@example.com');
      await page.type('input[type="password"]', 'password123');
      
      // Submit login form
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle2' }),
        page.click('button[type="submit"]')
      ]);
      
      // Wait for dashboard to load
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Check if we're on the dashboard
      const currentUrl = page.url();
      console.log(`🔍 Current URL after login: ${currentUrl}`);
      
      if (currentUrl.includes('/dashboard')) {
        console.log('📊 Successfully accessed dashboard');
        
        // Test key elements of the redesign
        console.log('🔍 Testing dashboard redesign elements...');
        
        // Check for VeroTrade logo
        const veroTradeLogo = await page.evaluate(() => {
          const elements = Array.from(document.querySelectorAll('*'));
          return elements.find(el => el.textContent === 'VeroTrade') !== undefined;
        });
        
        if (veroTradeLogo) {
          console.log('✅ VeroTrade logo found');
        } else {
          console.log('❌ VeroTrade logo not found');
        }
        
        // Check for Trading Dashboard title
        const dashboardTitle = await page.evaluate(() => {
          const elements = Array.from(document.querySelectorAll('*'));
          return elements.find(el => el.textContent === 'Trading Dashboard') !== undefined;
        });
        
        if (dashboardTitle) {
          console.log('✅ Trading Dashboard title found');
        } else {
          console.log('❌ Trading Dashboard title not found');
        }
        
        // Check for Total PnL card
        const totalPnLCard = await page.evaluate(() => {
          const elements = Array.from(document.querySelectorAll('*'));
          return elements.find(el => el.textContent === 'Total PnL') !== undefined;
        });
        
        if (totalPnLCard) {
          console.log('✅ Total PnL card found');
        } else {
          console.log('❌ Total PnL card not found');
        }
        
        // Check for Profit Factor card
        const profitFactorCard = await page.evaluate(() => {
          const elements = Array.from(document.querySelectorAll('*'));
          return elements.find(el => el.textContent === 'Profit Factor') !== undefined;
        });
        
        if (profitFactorCard) {
          console.log('✅ Profit Factor card found');
        } else {
          console.log('❌ Profit Factor card not found');
        }
        
        // Check for VRating Performance card
        const vRatingCard = await page.evaluate(() => {
          const elements = Array.from(document.querySelectorAll('*'));
          return elements.find(el => el.textContent === 'VRating Performance') !== undefined;
        });
        
        if (vRatingCard) {
          console.log('✅ VRating Performance card found');
        } else {
          console.log('❌ VRating Performance card not found');
        }
        
        // Check for Sharpe Ratio card
        const sharpeRatioCard = await page.evaluate(() => {
          const elements = Array.from(document.querySelectorAll('*'));
          return elements.find(el => el.textContent.includes('Sharpe Ratio')) !== undefined;
        });
        
        if (sharpeRatioCard) {
          console.log('✅ Sharpe Ratio card found');
        } else {
          console.log('❌ Sharpe Ratio card not found');
        }
        
        // Check for Prop certs card
        const propCertsCard = await page.evaluate(() => {
          const elements = Array.from(document.querySelectorAll('*'));
          return elements.find(el => el.textContent === 'Prop certs') !== undefined;
        });
        
        if (propCertsCard) {
          console.log('✅ Prop certs card found');
        } else {
          console.log('❌ Prop certs card not found');
        }
        
        // Check for Dominant Emotion section
        const dominantEmotionSection = await page.evaluate(() => {
          const elements = Array.from(document.querySelectorAll('*'));
          return elements.find(el => el.textContent === 'Dominant Emotion') !== undefined;
        });
        
        if (dominantEmotionSection) {
          console.log('✅ Dominant Emotion section found');
        } else {
          console.log('❌ Dominant Emotion section not found');
        }
        
        // Check for logout button
        const logoutButton = await page.evaluate(() => {
          const elements = Array.from(document.querySelectorAll('button'));
          return elements.find(el => el.textContent === 'Logout') !== undefined;
        });
        
        if (logoutButton) {
          console.log('✅ Logout button found');
        } else {
          console.log('❌ Logout button not found');
        }
        
        // Check for black background
        const backgroundColor = await page.evaluate(() => {
          return window.getComputedStyle(document.body).backgroundColor;
        });
        console.log(`🎨 Background color: ${backgroundColor}`);
        
        if (backgroundColor === 'rgb(0, 0, 0)' || backgroundColor === '#000000' || backgroundColor === 'rgba(0, 0, 0, 1)') {
          console.log('✅ Black background color verified');
        } else {
          console.log('❌ Background color is not black');
        }
        
        // Take a screenshot for visual verification
        await page.screenshot({ 
          path: path.join(__dirname, 'dashboard-redesign-verification.png'),
          fullPage: true 
        });
        console.log('📸 Screenshot saved: dashboard-redesign-verification.png');
        
      } else {
        console.log('❌ Failed to access dashboard after login');
      }
    } else {
      console.log('❌ Login form not found');
      
      // Take a screenshot to see what's on the page
      await page.screenshot({ 
        path: path.join(__dirname, 'login-page-debug.png'),
        fullPage: true 
      });
      console.log('📸 Login page screenshot saved: login-page-debug.png');
    }
    
    console.log('🎉 Dashboard redesign verification completed!');
    
  } catch (error) {
    console.error('❌ Error during verification:', error);
  } finally {
    await browser.close();
  }
}

// Run the verification
verifyDashboardRedesign().catch(console.error);