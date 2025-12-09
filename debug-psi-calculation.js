// Debug script to investigate PSI calculation and display issues
const { chromium } = require('playwright');

async function debugPSICalculation() {
  console.log('🔍 [DEBUG] Investigating PSI calculation and display issues...\n');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // Navigate to the dashboard
    console.log('🌐 [DEBUG] Navigating to dashboard...');
    await page.goto('http://localhost:3000/dashboard');
    
    // Wait for authentication and page load
    await page.waitForTimeout(3000);
    
    // Check if we need to login
    const loginButton = await page.locator('button:has-text("Login")').first();
    if (await loginButton.isVisible()) {
      console.log('🔐 [DEBUG] Login required, attempting to login...');
      // Add login logic if needed
      await page.waitForTimeout(2000);
    }
    
    // Wait for dashboard to load
    await page.waitForSelector('.psychological-metrics-card', { timeout: 10000 });
    console.log('✅ [DEBUG] Dashboard loaded successfully');
    
    // Extract current values from the DOM
    const disciplineElement = await page.locator('[data-metric="discipline"] .font-bold').first();
    const tiltElement = await page.locator('[data-metric="tilt-control"] .font-bold').first();
    const psiElement = await page.locator('text=Psychological Stability Index').locator('..').locator('.font-bold').first();
    
    const disciplineValue = await disciplineElement.textContent();
    const tiltValue = await tiltElement.textContent();
    const psiValue = await psiElement.textContent();
    
    console.log('\n📊 [DEBUG] Current values displayed:');
    console.log(`   Discipline Level: ${disciplineValue}`);
    console.log(`   Tilt Control: ${tiltValue}`);
    console.log(`   PSI Displayed: ${psiValue}`);
    
    // Parse numeric values
    const disciplineNum = parseFloat(disciplineValue?.replace('%', '') || '0');
    const tiltNum = parseFloat(tiltValue?.replace('%', '') || '0');
    const psiNum = parseFloat(psiValue?.replace('%', '') || '0');
    
    console.log('\n🔢 [DEBUG] Numeric values:');
    console.log(`   Discipline Level: ${disciplineNum}`);
    console.log(`   Tilt Control: ${tiltNum}`);
    console.log(`   PSI Displayed: ${psiNum}`);
    
    // Calculate expected PSI
    const expectedPSI = (disciplineNum + tiltNum) / 2;
    console.log('\n🧮 [DEBUG] PSI Calculation:');
    console.log(`   Expected PSI: (${disciplineNum} + ${tiltNum}) / 2 = ${expectedPSI.toFixed(1)}`);
    console.log(`   Actual PSI: ${psiNum}`);
    console.log(`   Match: ${Math.abs(expectedPSI - psiNum) < 0.1 ? '✅ YES' : '❌ NO'}`);
    
    // Check if values are complementary
    const sum = disciplineNum + tiltNum;
    console.log('\n🔗 [DEBUG] Complementary Check:');
    console.log(`   Sum: ${disciplineNum} + ${tiltNum} = ${sum.toFixed(1)}`);
    console.log(`   Complementary (≈100%): ${Math.abs(sum - 100) < 0.1 ? '✅ YES' : '❌ NO'}`);
    
    // Check console logs for calculation details
    console.log('\n📝 [DEBUG] Checking console logs...');
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('Discipline Level') || text.includes('Tilt Control') || text.includes('PSI') || text.includes('psychological')) {
        console.log(`   Console: ${text}`);
      }
    });
    
    // Wait a bit to collect console logs
    await page.waitForTimeout(3000);
    
    // Test with specific values mentioned in the task
    console.log('\n🎯 [DEBUG] Testing with specific values from task:');
    console.log('   Task mentions: Discipline Level: 51.9% and Tilt Control: 48.1%');
    console.log('   Expected PSI: (51.9 + 48.1) / 2 = 50.0%');
    
    // Check if we can find these specific values in the current state
    const foundTargetValues = Math.abs(disciplineNum - 51.9) < 1 && Math.abs(tiltNum - 48.1) < 1;
    console.log(`   Target values found: ${foundTargetValues ? '✅ YES' : '❌ NO'}`);
    
    if (foundTargetValues) {
      const expectedPSIForTarget = (51.9 + 48.1) / 2;
      const actualPSIForTarget = psiNum;
      console.log(`   Expected PSI for target: ${expectedPSIForTarget.toFixed(1)}%`);
      console.log(`   Actual PSI for target: ${actualPSIForTarget.toFixed(1)}%`);
      console.log(`   Match: ${Math.abs(expectedPSIForTarget - actualPSIForTarget) < 0.1 ? '✅ YES' : '❌ NO'}`);
    }
    
    // Check the PSI calculation logic in the page
    console.log('\n🔍 [DEBUG] Examining PSI calculation in page context...');
    const psiCalculationLogic = await page.evaluate(() => {
      // Look for the PSI calculation in the page
      const psiElements = document.querySelectorAll('span');
      let psiElement = null;
      let psiText = '';
      
      for (const el of psiElements) {
        if (el.textContent && el.textContent.includes('Psychological Stability Index')) {
          // Find the PSI value next to this text
          const parent = el.closest('div');
          if (parent) {
            const valueElement = parent.querySelector('.font-bold');
            if (valueElement) {
              psiElement = valueElement;
              psiText = valueElement.textContent;
              break;
            }
          }
        }
      }
      
      return {
        psiElement: psiElement ? psiElement.outerHTML : null,
        psiText: psiText,
        hasCalculation: psiElement && psiElement.textContent.includes('%')
      };
    });
    
    console.log('   PSI Element HTML:', psiCalculationLogic.psiElement);
    console.log('   PSI Text:', psiCalculationLogic.psiText);
    console.log('   Has Calculation:', psiCalculationLogic.hasCalculation);
    
  } catch (error) {
    console.error('❌ [DEBUG] Error during investigation:', error);
  } finally {
    await browser.close();
  }
  
  console.log('\n🏁 [DEBUG] PSI investigation completed');
}

// Run the debug script
debugPSICalculation().catch(console.error);