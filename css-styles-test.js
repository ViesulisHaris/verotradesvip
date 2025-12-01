const puppeteer = require('puppeteer');

async function cssStylesTest() {
  console.log('🔍 Running CSS styles test...');
  
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  
  // Enable console log from the browser
  page.on('console', msg => console.log('BROWSER:', msg.text()));
  
  try {
    // Navigate to home page
    console.log('Navigating to home page...');
    await page.goto('http://localhost:3000');
    
    // Wait for authentication to initialize
    console.log('Waiting for authentication to initialize...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Check CSS variables
    console.log('Checking CSS variables and styles...');
    const cssVariables = await page.evaluate(() => {
      const rootStyles = getComputedStyle(document.documentElement);
      const bodyStyles = getComputedStyle(document.body);
      
      return {
        // Check VeroTrade design system CSS variables
        cssVars: {
          '--deep-charcoal': rootStyles.getPropertyValue('--deep-charcoal') || 'not defined',
          '--soft-graphite': rootStyles.getPropertyValue('--soft-graphite') || 'not defined',
          '--warm-off-white': rootStyles.getPropertyValue('--warm-off-white') || 'not defined',
          '--muted-gray': rootStyles.getPropertyValue('--muted-gray') || 'not defined',
          '--dusty-gold': rootStyles.getPropertyValue('--dusty-gold') || 'not defined',
          '--warm-sand': rootStyles.getPropertyValue('--warm-sand') || 'not defined',
          '--border-primary': rootStyles.getPropertyValue('--border-primary') || 'not defined',
          '--font-family-primary': rootStyles.getPropertyValue('--font-family-primary') || 'not defined',
        },
        // Check body styles
        bodyStyles: {
          backgroundColor: bodyStyles.backgroundColor,
          color: bodyStyles.color,
          fontFamily: bodyStyles.fontFamily,
          fontSize: bodyStyles.fontSize,
        },
        // Check if Tailwind classes are applied
        hasTailwind: Array.from(document.body.classList).some(cls => cls.startsWith('bg-') || cls.startsWith('text-')),
        bodyClasses: Array.from(document.body.classList),
      };
    });
    
    console.log('\n=== CSS STYLES TEST RESULTS ===');
    console.log('CSS Variables:', JSON.stringify(cssVariables.cssVars, null, 2));
    console.log('\nBody Styles:', JSON.stringify(cssVariables.bodyStyles, null, 2));
    console.log('\nHas Tailwind classes:', cssVariables.hasTailwind);
    console.log('Body classes:', cssVariables.bodyClasses);
    
    // Evaluate test results
    const definedVars = Object.values(cssVariables.cssVars).filter(val => val !== 'not defined' && val !== '').length;
    const totalVars = Object.keys(cssVariables.cssVars).length;
    
    console.log(`\nCSS Variables defined: ${definedVars}/${totalVars}`);
    
    if (definedVars > 0) {
      console.log('✅ Test PASSED: CSS variables are being applied');
    } else {
      console.log('❌ Test FAILED: No CSS variables are defined');
    }
    
    if (cssVariables.hasTailwind) {
      console.log('✅ Test PASSED: Tailwind CSS classes are being applied');
    } else {
      console.log('❌ Test FAILED: No Tailwind CSS classes found');
    }
    
    // Take a screenshot for visual verification
    await page.screenshot({ path: 'css-styles-test.png', fullPage: true });
    console.log('Screenshot saved as css-styles-test.png');
    
  } catch (error) {
    console.error('Error during CSS styles test:', error);
  } finally {
    await browser.close();
  }
}

cssStylesTest();