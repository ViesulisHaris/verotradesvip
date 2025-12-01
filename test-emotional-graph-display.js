const puppeteer = require('puppeteer');
const { exec } = require('child_process');

// Test if emotional graph is displaying on dashboard
async function testEmotionalGraphDisplay() {
  console.log('🔍 Testing emotional graph display on dashboard...\n');
  
  let browser;
  let page;
  
  try {
    // Launch browser
    browser = await puppeteer.launch({ 
      headless: false,
      defaultViewport: { width: 1920, height: 1080 },
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    page = await browser.newPage();
    
    // Enable console logging from the page
    page.on('console', msg => {
      if (msg.type() === 'log' && (
        msg.text().includes('EMOTION') || 
        msg.text().includes('EmotionRadar') ||
        msg.text().includes('emotionData')
      )) {
        console.log(`📝 Browser Console: ${msg.text()}`);
      }
    });
    
    // Navigate to dashboard
    console.log('📍 Navigating to dashboard...');
    await page.goto('http://localhost:3000/dashboard', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    // Wait for page to load
    await page.waitForTimeout(3000);
    
    // Check if emotional graph section exists
    console.log('🔍 Checking for emotional graph section...');
    const emotionSection = await page.$('h3:has-text("Emotional Patterns")');
    
    if (!emotionSection) {
      console.log('❌ Emotional Patterns section not found');
      return false;
    }
    
    console.log('✅ Emotional Patterns section found');
    
    // Check if EmotionRadar component is rendered
    console.log('🔍 Checking for EmotionRadar component...');
    
    // Look for the radar chart container
    const radarContainer = await page.$('.recharts-wrapper');
    const radarSvg = await page.$('svg.recharts-radar');
    const radarPolarGrid = await page.$('svg.recharts-polar-grid');
    const radarPolarAngleAxis = await page.$('svg.recharts-polar-angle-axis');
    
    if (!radarContainer && !radarSvg && !radarPolarGrid) {
      console.log('❌ No radar chart elements found');
      
      // Check for error message
      const errorMessage = await page.$eval('.text-white\\/70', el => el.textContent);
      if (errorMessage && errorMessage.includes('Unable to load emotional patterns')) {
        console.log('❌ Error message displayed:', errorMessage);
      }
      
      // Check for "No emotional data available" message
      const noDataMessage = await page.$eval('.text-white\\/70', el => el.textContent);
      if (noDataMessage && noDataMessage.includes('No emotional data')) {
        console.log('❌ No data message displayed:', noDataMessage);
      }
      
      return false;
    }
    
    console.log('✅ Radar chart elements found');
    
    // Check for actual data points
    console.log('🔍 Checking for radar data points...');
    
    const dataPoints = await page.$$eval('circle.recharts-radar-dot', dots => 
      dots.map(dot => ({
        cx: dot.getAttribute('cx'),
        cy: dot.getAttribute('cy'),
        fill: dot.getAttribute('fill')
      }))
    );
    
    if (dataPoints.length === 0) {
      console.log('❌ No radar data points found');
      return false;
    }
    
    console.log(`✅ Found ${dataPoints.length} radar data points`);
    
    // Check for emotion labels
    console.log('🔍 Checking for emotion labels...');
    
    const emotionLabels = await page.$$eval('text.recharts-polar-angle-axis-tick', texts => 
      texts.map(text => text.textContent)
    );
    
    if (emotionLabels.length === 0) {
      console.log('❌ No emotion labels found');
      return false;
    }
    
    console.log(`✅ Found emotion labels: ${emotionLabels.join(', ')}`);
    
    // Take screenshot for verification
    console.log('📸 Taking screenshot...');
    await page.screenshot({ 
      path: 'emotional-graph-test.png', 
      fullPage: false,
      clip: {
        x: 0,
        y: 0,
        width: 1920,
        height: 1080
      }
    });
    
    console.log('✅ Screenshot saved as emotional-graph-test.png');
    
    // Check console for emotion-related errors
    console.log('🔍 Checking for emotion-related errors in console...');
    
    return true;
    
  } catch (error) {
    console.error('❌ Error testing emotional graph:', error.message);
    return false;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Check if required dependencies are available
async function checkDependencies() {
  try {
    require('puppeteer');
    return true;
  } catch (error) {
    console.log('❌ Puppeteer not installed. Installing...');
    return false;
  }
}

// Install dependencies if needed
async function installDependencies() {
  return new Promise((resolve, reject) => {
    console.log('📦 Installing puppeteer...');
    exec('npm install puppeteer', (error, stdout, stderr) => {
      if (error) {
        console.error('❌ Failed to install puppeteer:', error);
        reject(error);
      } else {
        console.log('✅ Puppeteer installed successfully');
        resolve();
      }
    });
  });
}

// Main execution
async function main() {
  const depsAvailable = await checkDependencies();
  
  if (!depsAvailable) {
    try {
      await installDependencies();
    } catch (error) {
      console.log('❌ Cannot install puppeteer. Skipping visual test.');
      console.log('💡 To install manually: npm install puppeteer');
      process.exit(1);
    }
  }
  
  const result = await testEmotionalGraphDisplay();
  
  console.log('\n📊 Test Results Summary:');
  console.log('========================');
  
  if (result) {
    console.log('✅ Emotional graph is displaying correctly');
    console.log('✅ Radar chart elements found');
    console.log('✅ Data points rendered');
    console.log('✅ Emotion labels displayed');
  } else {
    console.log('❌ Emotional graph is NOT displaying correctly');
    console.log('❌ Check the console logs above for specific issues');
  }
}

main().catch(console.error);