const { chromium } = require('playwright');
const path = require('path');

async function testBackgroundConsistency() {
  console.log('🔍 Testing background consistency between login and register pages...\n');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  
  try {
    // Test login page
    console.log('1. Testing Login Page Background...');
    const loginPage = await context.newPage();
    await loginPage.goto('http://localhost:3000/login');
    
    // Wait for the page to load completely
    await loginPage.waitForLoadState('networkidle');
    await loginPage.waitForTimeout(3000); // Allow Balatro component to initialize
    
    // Check if Balatro component is present
    const balatroContainer = await loginPage.$('.balatro-container');
    const balatroCanvas = await loginPage.$('.balatro-canvas');
    
    console.log('   - Balatro container present:', !!balatroContainer);
    console.log('   - Balatro canvas present:', !!balatroCanvas);
    
    // Take a screenshot
    await loginPage.screenshot({ 
      path: 'auth-test-login-page-background.png', 
      fullPage: true 
    });
    console.log('   - Login page screenshot saved');
    
    // Test register page
    console.log('\n2. Testing Register Page Background...');
    const registerPage = await context.newPage();
    await registerPage.goto('http://localhost:3000/register');
    
    // Wait for the page to load completely
    await registerPage.waitForLoadState('networkidle');
    await registerPage.waitForTimeout(3000); // Allow Balatro component to initialize
    
    // Check if Balatro component is present
    const registerBalatroContainer = await registerPage.$('.balatro-container');
    const registerBalatroCanvas = await registerPage.$('.balatro-canvas');
    
    console.log('   - Balatro container present:', !!registerBalatroContainer);
    console.log('   - Balatro canvas present:', !!registerBalatroCanvas);
    
    // Take a screenshot
    await registerPage.screenshot({ 
      path: 'auth-test-register-page-background.png', 
      fullPage: true 
    });
    console.log('   - Register page screenshot saved');
    
    // Compare the background implementations
    console.log('\n3. Comparing Background Implementations...');
    
    // Get the computed styles for the main container
    const loginContainerStyles = await loginPage.evaluate(() => {
      const container = document.querySelector('.min-h-screen');
      if (!container) return null;
      
      const styles = window.getComputedStyle(container);
      return {
        backgroundColor: styles.backgroundColor,
        backgroundImage: styles.backgroundImage,
        background: styles.background
      };
    });
    
    const registerContainerStyles = await registerPage.evaluate(() => {
      const container = document.querySelector('.min-h-screen');
      if (!container) return null;
      
      const styles = window.getComputedStyle(container);
      return {
        backgroundColor: styles.backgroundColor,
        backgroundImage: styles.backgroundImage,
        background: styles.background
      };
    });
    
    console.log('   - Login container styles:', loginContainerStyles);
    console.log('   - Register container styles:', registerContainerStyles);
    
    // Check if both pages have the same Balatro configuration
    const loginBalatroConfig = await loginPage.evaluate(() => {
      const container = document.querySelector('.balatro-container');
      if (!container) return null;
      
      return {
        hasMouseInteraction: container.classList.contains('mouse-interaction'),
        zIndex: window.getComputedStyle(container).zIndex,
        position: window.getComputedStyle(container).position
      };
    });
    
    const registerBalatroConfig = await registerPage.evaluate(() => {
      const container = document.querySelector('.balatro-container');
      if (!container) return null;
      
      return {
        hasMouseInteraction: container.classList.contains('mouse-interaction'),
        zIndex: window.getComputedStyle(container).zIndex,
        position: window.getComputedStyle(container).position
      };
    });
    
    console.log('   - Login Balatro config:', loginBalatroConfig);
    console.log('   - Register Balatro config:', registerBalatroConfig);
    
    // Determine if backgrounds are consistent
    const isConsistent = 
      !!balatroContainer && !!balatroCanvas && 
      !!registerBalatroContainer && !!registerBalatroCanvas &&
      JSON.stringify(loginBalatroConfig) === JSON.stringify(registerBalatroConfig);
    
    console.log('\n4. Background Consistency Results:');
    console.log('   - Both pages use Balatro component:', isConsistent);
    console.log('   - Login page has Balatro:', !!(balatroContainer && balatroCanvas));
    console.log('   - Register page has Balatro:', !!(registerBalatroContainer && registerBalatroCanvas));
    console.log('   - Same Balatro configuration:', JSON.stringify(loginBalatroConfig) === JSON.stringify(registerBalatroConfig));
    
    // Save test results
    const testResults = {
      timestamp: new Date().toISOString(),
      loginPage: {
        hasBalatroContainer: !!balatroContainer,
        hasBalatroCanvas: !!balatroCanvas,
        containerStyles: loginContainerStyles,
        balatroConfig: loginBalatroConfig
      },
      registerPage: {
        hasBalatroContainer: !!registerBalatroContainer,
        hasBalatroCanvas: !!registerBalatroCanvas,
        containerStyles: registerContainerStyles,
        balatroConfig: registerBalatroConfig
      },
      isConsistent
    };
    
    require('fs').writeFileSync(
      'auth-background-consistency-test-results.json',
      JSON.stringify(testResults, null, 2)
    );
    
    console.log('\n✅ Test completed successfully!');
    console.log('   - Screenshots saved for visual comparison');
    console.log('   - Detailed results saved to auth-background-consistency-test-results.json');
    
    return isConsistent;
    
  } catch (error) {
    console.error('❌ Error during testing:', error);
    return false;
  } finally {
    await browser.close();
  }
}

// Run the test
testBackgroundConsistency().then(isConsistent => {
  console.log(`\n🏁 Background consistency test ${isConsistent ? 'PASSED' : 'FAILED'}`);
  process.exit(isConsistent ? 0 : 1);
});