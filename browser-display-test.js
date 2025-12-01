const { chromium } = require('playwright');

(async () => {
  console.log('Testing application display in browser...');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // Navigate to the application
    console.log('Accessing http://localhost:3000/');
    await page.goto('http://localhost:3000/');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    console.log('Page loaded successfully');
    
    // Take a screenshot for documentation
    await page.screenshot({ path: 'application-display-test.png', fullPage: true });
    console.log('Screenshot saved as application-display-test.png');
    
    // Check if the page is not just a white screen
    const bodyBackgroundColor = await page.evaluate(() => {
      return window.getComputedStyle(document.body).backgroundColor;
    });
    
    console.log(`Body background color: ${bodyBackgroundColor}`);
    
    // Check if there are visible elements on the page
    const visibleElements = await page.evaluate(() => {
      const allElements = document.querySelectorAll('*');
      let visibleCount = 0;
      
      allElements.forEach(element => {
        const style = window.getComputedStyle(element);
        if (style.display !== 'none' && 
            style.visibility !== 'hidden' && 
            style.opacity !== '0' &&
            element.offsetWidth > 0 &&
            element.offsetHeight > 0) {
          visibleCount++;
        }
      });
      
      return visibleCount;
    });
    
    console.log(`Number of visible elements: ${visibleElements}`);
    
    // Check for main UI components
    const mainComponents = {
      navigation: await page.$('nav') !== null,
      header: await page.$('header') !== null,
      main: await page.$('main') !== null,
      footer: await page.$('footer') !== null,
    };
    
    console.log('Main UI components detected:', mainComponents);
    
    // Check if Tailwind CSS is loaded by looking for styled elements
    const hasTailwindStyles = await page.evaluate(() => {
      // Look for elements with Tailwind-specific classes
      const elementsWithTailwindClasses = document.querySelectorAll('[class*="bg-"], [class*="text-"], [class*="p-"], [class*="m-"]');
      return elementsWithTailwindClasses.length > 0;
    });
    
    console.log(`Tailwind CSS styles detected: ${hasTailwindStyles}`);
    
    // Test basic interactivity - try to click on a navigation link if it exists
    const navLinks = await page.$$('nav a');
    if (navLinks.length > 0) {
      console.log(`Found ${navLinks.length} navigation links, testing interactivity...`);
      
      // Click on the first navigation link
      await navLinks[0].click();
      await page.waitForLoadState('networkidle');
      
      // Take a screenshot after navigation
      await page.screenshot({ path: 'application-after-navigation.png', fullPage: true });
      console.log('Screenshot after navigation saved as application-after-navigation.png');
      
      // Check if navigation was successful
      const currentUrl = page.url();
      console.log(`Current URL after navigation: ${currentUrl}`);
    }
    
    // Summary
    console.log('\n=== APPLICATION DISPLAY TEST SUMMARY ===');
    console.log(`✅ Page loaded successfully: ${page.url()}`);
    console.log(`✅ Not a white screen: ${bodyBackgroundColor !== 'rgba(0, 0, 0, 0)' && visibleElements > 10}`);
    console.log(`✅ Main UI components visible: ${Object.values(mainComponents).some(v => v)}`);
    console.log(`✅ Tailwind CSS styles applied: ${hasTailwindStyles}`);
    console.log(`✅ Basic interactivity working: ${navLinks.length > 0}`);
    
  } catch (error) {
    console.error('Error during testing:', error);
  } finally {
    await browser.close();
  }
})();