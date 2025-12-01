const puppeteer = require('puppeteer');
const path = require('path');

async function simpleHomeTest() {
  console.log('🔍 Running simple home page test...');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1280, height: 720 }
  });
  
  const page = await browser.newPage();
  
  // Enable console log monitoring
  page.on('console', msg => {
    console.log(`BROWSER: ${msg.text()}`);
  });
  
  // Navigate to home page
  console.log('Navigating to home page...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
  
  // Wait for authentication to initialize
  console.log('Waiting for authentication to initialize...');
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  // Check if home page content is visible
  console.log('Checking home page content...');
  const pageContent = await page.evaluate(() => {
    const body = document.body;
    const h1 = document.querySelector('h1');
    const title = h1 ? h1.textContent : 'No h1 found';
    
    return {
      title: title,
      bodyBackground: window.getComputedStyle(body).backgroundColor,
      bodyColor: window.getComputedStyle(body).color,
      innerHTML: body.innerHTML.substring(0, 500) + '...'
    };
  });
  
  console.log('Page content:', pageContent);
  
  // Take a screenshot
  await page.screenshot({ 
    path: path.join(__dirname, 'simple-home-test-result.png'),
    fullPage: true
  });
  
  await browser.close();
  
  return pageContent;
}

simpleHomeTest().then(result => {
  console.log('\n=== TEST RESULTS ===');
  console.log(`Title: ${result.title}`);
  console.log(`Background: ${result.bodyBackground}`);
  console.log(`Text color: ${result.bodyColor}`);
  
  const success = result.title && result.title.includes('VeroTrade');
  console.log(`\nTest ${success ? 'PASSED' : 'FAILED'}: Home page ${success ? 'is displaying correctly' : 'is not displaying correctly'}`);
}).catch(console.error);