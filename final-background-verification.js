const puppeteer = require('puppeteer');

async function verifyComponentBackgrounds() {
  console.log('Starting final component background verification...');
  
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
    
    // Check both components using a single evaluate call
    const results = await page.evaluate(() => {
      const componentInfo = {
        sharpeRatio: { found: false, backgroundStyle: '', backgroundColor: '', hasPattern: false, isTransparent: false },
        dominantEmotion: { found: false, backgroundStyle: '', backgroundColor: '', hasPattern: false, isTransparent: false }
      };
      
      // Find all cards with the specific class pattern
      const cards = document.querySelectorAll('.group.relative.overflow-hidden.rounded-xl');
      
      cards.forEach(card => {
        const heading = card.querySelector('h3');
        if (heading) {
          const headingText = heading.textContent.trim();
          const bgStyle = window.getComputedStyle(card).background;
          const bgColor = window.getComputedStyle(card).backgroundColor;
          
          if (headingText.includes('Sharpe Ratio')) {
            componentInfo.sharpeRatio = {
              found: true,
              backgroundStyle: bgStyle,
              backgroundColor: bgColor,
              hasPattern: bgStyle.includes('data:image/svg+xml'),
              isTransparent: bgColor === 'rgba(0, 0, 0, 0)' || bgColor === 'transparent'
            };
          } else if (headingText.includes('Dominant Emotion')) {
            componentInfo.dominantEmotion = {
              found: true,
              backgroundStyle: bgStyle,
              backgroundColor: bgColor,
              hasPattern: bgStyle.includes('data:image/svg+xml'),
              isTransparent: bgColor === 'rgba(0, 0, 0, 0)' || bgColor === 'transparent'
            };
          }
        }
      });
      
      return componentInfo;
    });
    
    // Log SharpeRatioGauge results
    console.log('\n=== SharpeRatioGauge Component ===');
    if (results.sharpeRatio.found) {
      console.log(`Background Style: ${results.sharpeRatio.backgroundStyle}`);
      console.log(`Background Color: ${results.sharpeRatio.backgroundColor}`);
      console.log(`Has Background Pattern: ${results.sharpeRatio.hasPattern}`);
      console.log(`Is Transparent: ${results.sharpeRatio.isTransparent}`);
      
      if (!results.sharpeRatio.hasPattern && results.sharpeRatio.isTransparent) {
        console.log('✅ SUCCESS: SharpeRatioGauge has transparent background with no patterns');
      } else {
        console.log('⚠️  ISSUE: SharpeRatioGauge still has background problems');
      }
    } else {
      console.log('❌ NOT FOUND: SharpeRatioGauge component not found');
    }
    
    // Log DominantEmotionCard results
    console.log('\n=== DominantEmotionCard Component ===');
    if (results.dominantEmotion.found) {
      console.log(`Background Style: ${results.dominantEmotion.backgroundStyle}`);
      console.log(`Background Color: ${results.dominantEmotion.backgroundColor}`);
      console.log(`Has Background Pattern: ${results.dominantEmotion.hasPattern}`);
      console.log(`Is Transparent: ${results.dominantEmotion.isTransparent}`);
      
      if (!results.dominantEmotion.hasPattern && results.dominantEmotion.isTransparent) {
        console.log('✅ SUCCESS: DominantEmotionCard has transparent background with no patterns');
      } else {
        console.log('⚠️  ISSUE: DominantEmotionCard still has background problems');
      }
    } else {
      console.log('❌ NOT FOUND: DominantEmotionCard component not found');
    }
    
    // Check the Balatro background
    const balatroVisible = await page.evaluate(() => {
      const balatro = document.getElementById('balatro-background');
      return balatro ? window.getComputedStyle(balatro).display !== 'none' : false;
    });
    
    console.log(`\nBalatro Background Visible: ${balatroVisible}`);
    
    // Take a screenshot for visual verification
    await page.screenshot({ 
      path: 'final-background-verification.png', 
      fullPage: true 
    });
    
    console.log('\nScreenshot saved as final-background-verification.png');
    
    // Final verdict
    const sharpeFixed = results.sharpeRatio.found && !results.sharpeRatio.hasPattern && results.sharpeRatio.isTransparent;
    const emotionFixed = results.dominantEmotion.found && !results.dominantEmotion.hasPattern && results.dominantEmotion.isTransparent;
    
    console.log('\n=== FINAL VERDICT ===');
    console.log(`SharpeRatioGauge: ${sharpeFixed ? '✅ FIXED' : '❌ NEEDS WORK'}`);
    console.log(`DominantEmotionCard: ${emotionFixed ? '✅ FIXED' : '❌ NEEDS WORK'}`);
    console.log(`Overall Status: ${sharpeFixed && emotionFixed ? '✅ ALL COMPONENTS FIXED' : '⚠️  SOME COMPONENTS NEED ATTENTION'}`);
    
  } catch (error) {
    console.error('Error during verification:', error);
  } finally {
    await browser.close();
  }
}

// Run the verification
verifyComponentBackgrounds().then(() => {
  console.log('\nFinal component background verification completed.');
}).catch(error => {
  console.error('Verification failed:', error);
});