const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function investigateBackgroundPattern() {
  console.log('Starting background pattern investigation...');
  
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1920, height: 1080 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    
    // Enable console logging from the browser
    page.on('console', msg => {
      console.log('BROWSER:', msg.text());
    });

    // Navigate to the dashboard (assuming we need to login first)
    console.log('Navigating to application...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
    
    // Wait a bit for any animations to load
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Check if we need to login
    const loginForm = await page.$('form[action*="login"], form[action*="auth"]');
    if (loginForm) {
      console.log('Login form detected, attempting to login with test credentials...');
      
      // Try to fill in login credentials (adjust selectors as needed)
      await page.type('input[name="email"], input[type="email"]', 'test@example.com');
      await page.type('input[name="password"], input[type="password"]', 'password123');
      
      // Click login button
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle2' }),
        page.click('button[type="submit"], input[type="submit"]')
      ]);
      
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    // Navigate to dashboard if needed
    if (!page.url().includes('dashboard')) {
      await page.goto('http://localhost:3000/dashboard', { waitUntil: 'networkidle2' });
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
    
    console.log('Current URL:', page.url());
    
    // Take a full page screenshot first
    await page.screenshot({
      path: 'background-pattern-investigation-full-page.png',
      fullPage: true
    });
    
    // Look for the Vperformance card specifically
    console.log('Looking for Vperformance card...');
    
    // Try different selectors that might match the Vperformance card
    const vperformanceSelectors = [
      '[data-testid*="performance"]',
      '[class*="performance"]',
      '[id*="performance"]',
      'text/Vperformance',
      'text/Performance',
      '[class*="v-performance"]',
      '[class*="Vperformance"]'
    ];
    
    let vperformanceCard = null;
    for (const selector of vperformanceSelectors) {
      try {
        vperformanceCard = await page.$(selector);
        if (vperformanceCard) {
          console.log(`Found Vperformance card with selector: ${selector}`);
          break;
        }
      } catch (e) {
        // Continue trying other selectors
      }
    }
    
    if (vperformanceCard) {
      // Take a screenshot of just the Vperformance card
      await vperformanceCard.screenshot({
        path: 'background-pattern-investigation-vperformance-card.png'
      });
      
      // Get the bounding box to analyze its position
      const boundingBox = await vperformanceCard.boundingBox();
      console.log('Vperformance card bounding box:', boundingBox);
    } else {
      console.log('Vperformance card not found with any selector. Taking screenshots of potential card areas...');
      
      // Look for any card-like elements
      const cards = await page.$$('[class*="card"], [class*="Card"], [class*="metric"], [class*="Metric"]');
      console.log(`Found ${cards.length} potential card elements`);
      
      // Take screenshots of the first few cards
      for (let i = 0; i < Math.min(cards.length, 5); i++) {
        try {
          await cards[i].screenshot({
            path: `background-pattern-investigation-card-${i}.png`
          });
          
          // Get the class names to identify which might be the Vperformance card
          const classNames = await page.evaluate(el => el.className, cards[i]);
          console.log(`Card ${i} classes: ${classNames}`);
        } catch (e) {
          console.log(`Could not screenshot card ${i}:`, e.message);
        }
      }
    }
    
    // Get computed styles for the body and main elements to check background
    const bodyStyles = await page.evaluate(() => {
      const body = document.body;
      const computedStyle = window.getComputedStyle(body);
      
      return {
        background: computedStyle.background,
        backgroundColor: computedStyle.backgroundColor,
        backgroundImage: computedStyle.backgroundImage,
        backgroundSize: computedStyle.backgroundSize,
        backgroundPosition: computedStyle.backgroundPosition,
        backgroundRepeat: computedStyle.backgroundRepeat
      };
    });
    
    console.log('Body computed styles:', bodyStyles);
    
    // Check for any canvas elements (WebGL context)
    const canvasElements = await page.$$('canvas');
    console.log(`Found ${canvasElements.length} canvas elements`);
    
    if (canvasElements.length > 0) {
      for (let i = 0; i < canvasElements.length; i++) {
        const isVisible = await page.evaluate(el => {
          const style = window.getComputedStyle(el);
          return style.display !== 'none' && style.visibility !== 'hidden' && el.offsetWidth > 0 && el.offsetHeight > 0;
        }, canvasElements[i]);
        
        console.log(`Canvas ${i} visible: ${isVisible}`);
        
        if (isVisible) {
          await canvasElements[i].screenshot({
            path: `background-pattern-investigation-canvas-${i}.png`
          });
        }
      }
    }
    
    // Check for any elements with backdrop-filter or blur effects
    const blurredElements = await page.$$('[style*="backdrop-filter"], [style*="blur"]');
    console.log(`Found ${blurredElements.length} elements with blur/backdrop-filter`);
    
    // Get the HTML content to analyze structure
    const htmlContent = await page.content();
    fs.writeFileSync('background-pattern-investigation-html.html', htmlContent);
    
    console.log('Investigation complete. Check the generated screenshots and files.');
    
  } catch (error) {
    console.error('Error during investigation:', error);
  } finally {
    await browser.close();
  }
}

investigateBackgroundPattern();