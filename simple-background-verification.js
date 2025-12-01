const puppeteer = require('puppeteer');

async function verifySpecificComponents() {
  console.log('Starting specific component background verification...');
  
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: ['--start-maximized']
  });
  
  try {
    const page = await browser.newPage();
    
    // Navigate to the test page that has both components
    await page.goto('http://localhost:3000/test-visual-enhancements');
    
    // Wait for the page to load completely
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Check for SharpeRatioGauge component
    console.log('\n=== Checking SharpeRatioGauge Component ===');
    const sharpeRatioElement = await page.$('[data-testid="sharpe-ratio"]');
    
    if (!sharpeRatioElement) {
      // Try to find it by text content
      const sharpeElements = await page.evaluate(() => {
        const headings = Array.from(document.querySelectorAll('h3'));
        return headings.filter(h => h.textContent.includes('Sharpe Ratio'));
      });
      
      if (sharpeElements.length > 0) {
        const sharpeCard = await page.evaluate(() => {
          const headings = Array.from(document.querySelectorAll('h3'));
          const sharpeHeading = headings.find(h => h.textContent.includes('Sharpe Ratio'));
          return sharpeHeading ? sharpeHeading.closest('.group.relative.overflow-hidden.rounded-xl') : null;
        });
        
        if (sharpeCard) {
          const backgroundStyle = await page.evaluate((el) => {
            return window.getComputedStyle(el).background;
          }, sharpeCard);
          
          const backgroundColor = await page.evaluate((el) => {
            return window.getComputedStyle(el).backgroundColor;
          }, sharpeCard);
          
          const hasBackgroundPattern = backgroundStyle.includes('data:image/svg+xml');
          const isTransparent = backgroundColor === 'rgba(0, 0, 0, 0)' || backgroundColor === 'transparent';
          
          console.log(`Background Style: ${backgroundStyle}`);
          console.log(`Background Color: ${backgroundColor}`);
          console.log(`Has Background Pattern: ${hasBackgroundPattern}`);
          console.log(`Is Transparent: ${isTransparent}`);
          
          if (!hasBackgroundPattern && isTransparent) {
            console.log('✅ SharpeRatioGauge: Background pattern successfully removed');
          } else {
            console.log('⚠️  SharpeRatioGauge: Still has background issues');
          }
        }
      }
    }
    
    // Check for DominantEmotionCard component
    console.log('\n=== Checking DominantEmotionCard Component ===');
    const emotionCard = await page.evaluate(() => {
      const headings = Array.from(document.querySelectorAll('h3'));
      const emotionHeading = headings.find(h => h.textContent.includes('Dominant Emotion'));
      return emotionHeading ? emotionHeading.closest('.group.relative.overflow-hidden.rounded-xl') : null;
    });
      
      if (emotionCard) {
        const backgroundStyle = await page.evaluate((el) => {
          return window.getComputedStyle(el).background;
        }, emotionCard);
        
        const backgroundColor = await page.evaluate((el) => {
          return window.getComputedStyle(el).backgroundColor;
        }, emotionCard);
        
        const hasBackgroundPattern = backgroundStyle.includes('data:image/svg+xml');
        const isTransparent = backgroundColor === 'rgba(0, 0, 0, 0)' || backgroundColor === 'transparent';
        
        console.log(`Background Style: ${backgroundStyle}`);
        console.log(`Background Color: ${backgroundColor}`);
        console.log(`Has Background Pattern: ${hasBackgroundPattern}`);
        console.log(`Is Transparent: ${isTransparent}`);
        
        if (!hasBackgroundPattern && isTransparent) {
          console.log('✅ DominantEmotionCard: Background pattern successfully removed');
        } else {
          console.log('⚠️  DominantEmotionCard: Still has background issues');
        }
      }
    }
    
    // Take a screenshot for visual verification
    await page.screenshot({ 
      path: 'component-background-verification.png', 
      fullPage: true 
    });
    
    console.log('\nScreenshot saved as component-background-verification.png');
    
    // Check the Balatro background visibility
    const balatroBackground = await page.$('#balatro-background');
    if (balatroBackground) {
      const isVisible = await page.evaluate((el) => {
        return el && window.getComputedStyle(el).display !== 'none';
      }, balatroBackground);
      console.log(`\nBalatro Background Visible: ${isVisible}`);
    }
    
  } catch (error) {
    console.error('Error during verification:', error);
  } finally {
    await browser.close();
  }
}

// Run the verification
verifySpecificComponents().then(() => {
  console.log('\nComponent background verification completed.');
}).catch(error => {
  console.error('Verification failed:', error);
});