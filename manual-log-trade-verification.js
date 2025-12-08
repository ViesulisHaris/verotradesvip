// Manual verification script for dropdown functionality
// This addresses the Puppeteer selector limitations in the automated test

const puppeteer = require('puppeteer');

const manualVerification = async () => {
  console.log('🔍 Starting Manual Verification for Dropdown Functionality...\n');
  
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1920, height: 1080 }
  });
  
  const page = await browser.newPage();
  
  try {
    await page.goto('http://localhost:3000/log-trade', { 
      waitUntil: 'networkidle2' 
    });
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Test Strategy Dropdown
    console.log('📋 Testing Strategy Dropdown...');
    const strategyButton = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.find(btn => btn.textContent.includes('Select Strategy') || btn.textContent.includes('Strategy'));
    });
    
    if (strategyButton) {
      await page.evaluate((btn) => btn.click(), strategyButton);
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const dropdownOpen = await page.evaluate(() => {
        const dropdowns = document.querySelectorAll('.absolute.z-20, [style*="position: absolute"]');
        return Array.from(dropdowns).some(dd => 
          dd.style.display !== 'none' && dd.offsetHeight > 0
        );
      });
      
      console.log(dropdownOpen ? '✅ Strategy dropdown opens' : '❌ Strategy dropdown failed to open');
      
      // Test selecting an option
      const optionSelected = await page.evaluate(() => {
        const options = document.querySelectorAll('.absolute.z-20 > div, [style*="position: absolute"] > div');
        if (options.length > 0) {
          options[0].click();
          return true;
        }
        return false;
      });
      
      console.log(optionSelected ? '✅ Strategy option selectable' : '❌ Strategy option selection failed');
    } else {
      console.log('❌ Strategy button not found');
    }
    
    // Test Side Dropdown
    console.log('\n📋 Testing Side Dropdown...');
    const sideButton = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.find(btn => btn.textContent.includes('Buy') || btn.textContent.includes('Sell'));
    });
    
    if (sideButton) {
      await page.evaluate((btn) => btn.click(), sideButton);
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const dropdownOpen = await page.evaluate(() => {
        const dropdowns = document.querySelectorAll('.absolute.z-20, [style*="position: absolute"]');
        return Array.from(dropdowns).some(dd => 
          dd.style.display !== 'none' && dd.offsetHeight > 0
        );
      });
      
      console.log(dropdownOpen ? '✅ Side dropdown opens' : '❌ Side dropdown failed to open');
    } else {
      console.log('❌ Side button not found');
    }
    
    // Test Emotional State Dropdown
    console.log('\n📋 Testing Emotional State Dropdown...');
    const emotionButton = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.find(btn => btn.textContent.includes('Neutral') || btn.textContent.includes('Emotional'));
    });
    
    if (emotionButton) {
      await page.evaluate((btn) => btn.click(), emotionButton);
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const dropdownOpen = await page.evaluate(() => {
        const dropdowns = document.querySelectorAll('.absolute.z-20, [style*="position: absolute"]');
        return Array.from(dropdowns).some(dd => 
          dd.style.display !== 'none' && dd.offsetHeight > 0
        );
      });
      
      console.log(dropdownOpen ? '✅ Emotional state dropdown opens' : '❌ Emotional state dropdown failed to open');
    } else {
      console.log('❌ Emotional state button not found');
    }
    
    // Test Market Type Buttons
    console.log('\n📋 Testing Market Type Buttons...');
    const marketButtons = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.filter(btn => 
        btn.textContent.includes('Stock') || 
        btn.textContent.includes('Crypto') || 
        btn.textContent.includes('Forex') || 
        btn.textContent.includes('Futures')
      );
    });
    
    if (marketButtons.length > 0) {
      const stockButton = marketButtons.find(btn => btn.textContent.includes('Stock'));
      if (stockButton) {
        await page.evaluate((btn) => btn.click(), stockButton);
        await new Promise(resolve => setTimeout(resolve, 200));
        
        const isActive = await page.evaluate((btn) => {
          return btn.classList.contains('bg-[var(--gold)]') ||
                 btn.style.backgroundColor.includes('197, 160, 101') ||
                 btn.classList.contains('text-[var(--gold)]');
        }, stockButton);
        
        console.log(isActive ? '✅ Market type buttons work' : '❌ Market type buttons not responding');
      }
    } else {
      console.log('❌ Market type buttons not found');
    }
    
    // Test PnL Color Change
    console.log('\n📋 Testing PnL Color Change...');
    const pnlInput = await page.evaluate(() => {
      const inputs = Array.from(document.querySelectorAll('input'));
      return inputs.find(input => input.placeholder.includes('PnL'));
    });
    
    if (pnlInput) {
      // Test positive value
      await page.evaluate((input) => {
        input.value = '100';
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }, pnlInput);
      await new Promise(resolve => setTimeout(resolve, 200));
      
      const positiveColor = await page.evaluate((input) => {
        const style = window.getComputedStyle(input);
        return style.backgroundColor.includes('46, 189, 133') || // Green
               style.borderColor.includes('46, 189, 133') ||
               input.classList.contains('border-green-500') ||
               input.classList.contains('bg-green-500');
      }, pnlInput);
      
      // Test negative value
      await page.evaluate((input) => {
        input.value = '-100';
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }, pnlInput);
      await new Promise(resolve => setTimeout(resolve, 200));
      
      const negativeColor = await page.evaluate((input) => {
        const style = window.getComputedStyle(input);
        return style.backgroundColor.includes('246, 70, 93') || // Red
               style.borderColor.includes('246, 70, 93') ||
               input.classList.contains('border-red-500') ||
               input.classList.contains('bg-red-500');
      }, pnlInput);
      
      console.log(positiveColor && negativeColor ? '✅ PnL color changes work' : '❌ PnL color changes not working');
    } else {
      console.log('❌ PnL input not found');
    }
    
    console.log('\n📸 Taking final verification screenshot...');
    await page.screenshot({ 
      path: './log-trade-test-screenshots/manual-verification-final.png', 
      fullPage: true 
    });
    
  } catch (error) {
    console.error('❌ Manual verification failed:', error);
  } finally {
    await browser.close();
  }
  
  console.log('\n🏁 Manual Verification Complete');
};

if (require.main === module) {
  manualVerification().catch(console.error);
}

module.exports = { manualVerification };