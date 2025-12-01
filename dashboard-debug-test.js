// Dashboard Debug Test Script
// This script will help diagnose the blank UI issue

const puppeteer = require('puppeteer');
const path = require('path');

async function debugDashboard() {
  console.log('🔍 Starting dashboard debug test...');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1920, height: 1080 }
  });
  
  const page = await browser.newPage();
  
  // Enable console logging from the page
  page.on('console', msg => {
    console.log('🔍 BROWSER CONSOLE:', msg.text());
  });
  
  // Enable error logging
  page.on('pageerror', error => {
    console.log('🔍 PAGE ERROR:', error.message);
  });
  
  try {
    console.log('🔍 Navigating to dashboard...');
    await page.goto('http://localhost:3001/dashboard', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    // Wait for page to load
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log('🔍 Checking page content...');
    
    // Check if dashboard elements exist
    const dashboardExists = await page.$('.min-h-screen');
    const balatroExists = await page.$('.balatro-container');
    const cardsExist = await page.$$('.card-unified');
    const textElements = await page.$$('h1, h2, h3, p, span');
    
    console.log('🔍 Element existence check:', {
      dashboardExists: !!dashboardExists,
      balatroExists: !!balatroExists,
      cardsCount: cardsExist.length,
      textElementsCount: textElements.length
    });
    
    // Check computed styles
    if (dashboardExists) {
      const dashboardStyles = await page.evaluate(() => {
        const dashboard = document.querySelector('.min-h-screen');
        if (!dashboard) return null;
        
        const styles = window.getComputedStyle(dashboard);
        return {
          display: styles.display,
          visibility: styles.visibility,
          opacity: styles.opacity,
          backgroundColor: styles.backgroundColor,
          zIndex: styles.zIndex,
          position: styles.position,
          width: styles.width,
          height: styles.height
        };
      });
      
      console.log('🔍 Dashboard computed styles:', dashboardStyles);
    }
    
    if (balatroExists) {
      const balatroStyles = await page.evaluate(() => {
        const balatro = document.querySelector('.balatro-container');
        if (!balatro) return null;
        
        const styles = window.getComputedStyle(balatro);
        return {
          display: styles.display,
          visibility: styles.visibility,
          opacity: styles.opacity,
          backgroundColor: styles.backgroundColor,
          zIndex: styles.zIndex,
          position: styles.position,
          width: styles.width,
          height: styles.height
        };
      });
      
      console.log('🔍 Balatro computed styles:', balatroStyles);
    }
    
    // Check text visibility
    const textVisibility = await page.evaluate(() => {
      const textElements = document.querySelectorAll('h1, h2, h3, p, span');
      const results = [];
      
      textElements.forEach((el, index) => {
        if (index < 5) { // Check first 5 text elements
          const styles = window.getComputedStyle(el);
          results.push({
            tag: el.tagName,
            text: el.textContent?.substring(0, 50),
            display: styles.display,
            visibility: styles.visibility,
            opacity: styles.opacity,
            color: styles.color,
            fontSize: styles.fontSize
          });
        }
      });
      
      return results;
    });
    
    console.log('🔍 Text element visibility:', textVisibility);
    
    // Take screenshot
    const screenshot = await page.screenshot({ 
      path: 'dashboard-debug-screenshot.png',
      fullPage: true 
    });
    
    console.log('🔍 Screenshot saved to dashboard-debug-screenshot.png');
    
  } catch (error) {
    console.error('🔍 Error during debug test:', error);
  } finally {
    await browser.close();
  }
}

debugDashboard().catch(console.error);