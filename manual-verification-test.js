const puppeteer = require('puppeteer');
const path = require('path');

class ManualVerificationTest {
  constructor() {
    this.browser = null;
    this.page = null;
  }

  async init() {
    console.log('🚀 Initializing manual verification test...');
    this.browser = await puppeteer.launch({ 
      headless: false,
      devtools: true,
      defaultViewport: { width: 1920, height: 1080 },
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    this.page = await this.browser.newPage();
    
    // Enable console logging from page
    this.page.on('console', msg => {
      console.log('PAGE LOG:', msg.text());
    });
  }

  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async testFunctionality() {
    console.log('\n🧪 Testing key functionality manually...');
    
    try {
      // Navigate to log trade page
      await this.page.goto('http://localhost:3000/log-trade', { 
        waitUntil: 'networkidle2',
        timeout: 30000 
      });
      
      await this.sleep(3000);
      
      // Check if we need to authenticate
      const currentUrl = this.page.url();
      if (currentUrl.includes('/login')) {
        console.log('⚠️ Need to authenticate first...');
        // For now, let's just take a screenshot and continue
        await this.takeScreenshot('login-required');
        return;
      }
      
      await this.takeScreenshot('page-loaded');
      
      // Test 1: Market type selection (only one at a time)
      console.log('\n📊 Testing market type selection...');
      
      // Find and click stock button
      const stockButton = await this.page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button[type="button"]'));
        return buttons.find(btn => btn.textContent?.toLowerCase().includes('stock'));
      });
      
      if (stockButton) {
        await this.page.evaluate(() => {
          const buttons = Array.from(document.querySelectorAll('button[type="button"]'));
          const stockBtn = buttons.find(btn => btn.textContent?.toLowerCase().includes('stock'));
          if (stockBtn) stockBtn.click();
        });
        await this.sleep(500);
        
        // Check if only stock is selected
        const marketState = await this.page.evaluate(() => {
          const buttons = Array.from(document.querySelectorAll('button[type="button"]'));
          const marketButtons = buttons.filter(btn => 
            ['stock', 'crypto', 'forex', 'futures'].some(market => 
              btn.textContent?.toLowerCase().includes(market)
            )
          );
          
          return marketButtons.map(btn => ({
            text: btn.textContent?.trim(),
            hasGoldBackground: Array.from(btn.classList).some(cls => 
              cls.includes('bg-verotrade-gold-primary') || cls.includes('bg-verotrade-gold-secondary')
            )
          }));
        });
        
        const selectedMarkets = marketState.filter(m => m.hasGoldBackground);
        console.log('✅ Market selection state:', selectedMarkets);
        console.log(selectedMarkets.length === 1 ? '✅ Only one market selected' : '❌ Multiple markets selected');
      }
      
      // Test 2: Save button color
      console.log('\n💾 Testing save button color...');
      const saveButtonColor = await this.page.evaluate(() => {
        const saveBtn = document.querySelector('button[type="submit"]');
        if (!saveBtn) return null;
        
        return {
          classes: Array.from(saveBtn.classList),
          hasSecondaryGold: Array.from(saveBtn.classList).some(cls => 
            cls.includes('bg-verotrade-gold-secondary')
          ),
          hasPrimaryGold: Array.from(saveBtn.classList).some(cls => 
            cls.includes('bg-verotrade-gold-primary')
          )
        };
      });
      
      console.log('Save button classes:', saveButtonColor);
      console.log(saveButtonColor?.hasSecondaryGold ? '✅ Save button uses less bright gold' : '❌ Save button color issue');
      
      // Test 3: Dropdown z-index
      console.log('\n📋 Testing dropdown z-index...');
      
      // Open emotion dropdown
      await this.page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button[type="button"]'));
        const emotionBtn = buttons.find(btn => btn.textContent?.includes('Neutral'));
        if (emotionBtn) emotionBtn.click();
      });
      await this.sleep(500);
      
      const dropdownZIndex = await this.page.evaluate(() => {
        const dropdown = document.querySelector('div.absolute.top-full.left-0.right-0');
        if (!dropdown) return null;
        
        const computedStyle = getComputedStyle(dropdown);
        return {
          zIndex: computedStyle.zIndex,
          isVisible: computedStyle.display !== 'none' && computedStyle.visibility !== 'hidden'
        };
      });
      
      console.log('Dropdown z-index:', dropdownZIndex);
      console.log(dropdownZIndex?.zIndex === '9999' ? '✅ Dropdown has proper z-index' : '❌ Dropdown z-index issue');
      
      // Test 4: Entry/Exit time functionality
      console.log('\n⏰ Testing entry/exit time functionality...');
      
      await this.page.evaluate(() => {
        const entryTimeInput = document.querySelector('input[type="time"]');
        if (entryTimeInput) {
          entryTimeInput.value = '09:30';
          entryTimeInput.dispatchEvent(new Event('input', { bubbles: true }));
          entryTimeInput.dispatchEvent(new Event('change', { bubbles: true }));
        }
      });
      
      await this.sleep(300);
      
      const entryTimeValue = await this.page.evaluate(() => {
        const entryTimeInput = document.querySelector('input[type="time"]');
        return entryTimeInput ? entryTimeInput.value : null;
      });
      
      console.log('Entry time value:', entryTimeValue);
      console.log(entryTimeValue === '09:30' ? '✅ Entry time input working' : '❌ Entry time input issue');
      
      await this.takeScreenshot('functionality-test');
      
      // Test 5: Form inputs
      console.log('\n📝 Testing form inputs...');
      
      await this.page.evaluate(() => {
        const symbolInput = document.querySelector('input[placeholder*="AAPL"], input[placeholder*="BTCUSD"]');
        if (symbolInput) {
          symbolInput.value = 'AAPL';
          symbolInput.dispatchEvent(new Event('input', { bubbles: true }));
        }
        
        const quantityInput = document.querySelector('input[placeholder*="0.00"]');
        if (quantityInput) {
          quantityInput.value = '100';
          quantityInput.dispatchEvent(new Event('input', { bubbles: true }));
        }
      });
      
      await this.sleep(300);
      
      const formValues = await this.page.evaluate(() => {
        const symbolInput = document.querySelector('input[placeholder*="AAPL"], input[placeholder*="BTCUSD"]');
        const quantityInput = document.querySelector('input[placeholder*="0.00"]');
        
        return {
          symbol: symbolInput ? symbolInput.value : null,
          quantity: quantityInput ? quantityInput.value : null
        };
      });
      
      console.log('Form values:', formValues);
      console.log(formValues.symbol === 'AAPL' && formValues.quantity === '100' ? '✅ Form inputs working' : '❌ Form inputs issue');
      
      await this.takeScreenshot('final-state');
      
    } catch (error) {
      console.error('❌ Test failed:', error.message);
    }
  }

  async takeScreenshot(name) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `manual-test-${name}-${timestamp}.png`;
    const screenshotPath = path.join(__dirname, filename);
    
    try {
      await this.page.screenshot({ path: screenshotPath, fullPage: true });
      console.log(`📸 Screenshot saved: ${filename}`);
      return screenshotPath;
    } catch (error) {
      console.error(`❌ Failed to take screenshot ${name}:`, error.message);
      return null;
    }
  }

  async cleanup() {
    console.log('\n🧹 Cleaning up...');
    if (this.browser) {
      await this.browser.close();
    }
  }

  async runTest() {
    try {
      await this.init();
      await this.testFunctionality();
      console.log('\n✅ Manual verification test completed!');
    } catch (error) {
      console.error('❌ Test failed:', error.message);
    } finally {
      await this.cleanup();
    }
  }
}

// Run test
if (require.main === module) {
  const tester = new ManualVerificationTest();
  tester.runTest();
}

module.exports = ManualVerificationTest;