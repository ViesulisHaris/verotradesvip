/**
 * Enhanced Modal Glitch Diagnostic Test with Authentication
 * 
 * This test handles authentication properly and provides comprehensive analysis
 * of the double modal structure issue and "trapped in a box" behavior.
 */

const { chromium } = require('playwright');
const fs = require('fs');

async function runEnhancedModalGlitchDiagnostic() {
  console.log('🔍 Starting Enhanced Modal Glitch Diagnostic Test');
  console.log('=' .repeat(80));

  const browser = await chromium.launch({ 
    headless: false,
    devtools: true,
    slowMo: 500 // Slow down for better observation
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  
  const page = await context.newPage();
  
  // Capture all console messages
  const consoleMessages = [];
  page.on('console', msg => {
    const message = {
      type: msg.type(),
      text: msg.text(),
      timestamp: new Date().toISOString()
    };
    consoleMessages.push(message);
    
    // Focus on modal debug messages
    if (msg.text().includes('[MODAL_DEBUG]') || 
        msg.text().includes('[CARD_DEBUG]') ||
        msg.text().includes('[DIAGNOSTIC]') ||
        msg.text().includes('modal')) {
      console.log(`📝 [${msg.type().toUpperCase()}] ${msg.text()}`);
    }
  });

  // Capture page errors
  const errors = [];
  page.on('pageerror', error => {
    errors.push({
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    console.error('❌ Page Error:', error.message);
  });

  try {
    // Step 1: Check authentication status and handle login if needed
    console.log('\n📍 Step 1: Checking authentication status...');
    
    await page.goto('http://localhost:3001', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Check if already authenticated
    const isAuthenticated = await page.evaluate(() => {
      // Check for common auth indicators
      const hasUserElement = document.querySelector('[data-testid="user-info"], [data-testid="user-menu"], .user-info');
      const hasLogoutButton = Array.from(document.querySelectorAll('button')).some(btn =>
        btn.textContent?.includes('Logout') || btn.textContent?.includes('Sign Out')
      );
      const isOnDashboard = window.location.pathname.includes('/dashboard');
      return hasUserElement || hasLogoutButton || isOnDashboard;
    });

    console.log(`🔐 Authentication status: ${isAuthenticated ? 'Already authenticated' : 'Not authenticated'}`);

    if (!isAuthenticated) {
      console.log('🔐 Attempting to login...');
      
      // Navigate to login page
      await page.goto('http://localhost:3001/login', { waitUntil: 'networkidle' });
      await page.waitForTimeout(2000);

      // Try to find login form
      const emailInput = await page.locator('input[type="email"], input[name="email"], input[placeholder*="email"]').first();
      const passwordInput = await page.locator('input[type="password"], input[name="password"], input[placeholder*="password"]').first();
      const loginButton = await page.locator('button:has-text("Login"), button:has-text("Sign In"), button[type="submit"]').first();

      if (await emailInput.isVisible() && await passwordInput.isVisible()) {
        console.log('📝 Found login form, attempting login with test credentials...');
        
        // Try common test credentials
        const testCredentials = [
          { email: 'test@example.com', password: 'password123' },
          { email: 'admin@example.com', password: 'admin123' },
          { email: 'user@example.com', password: 'user123' }
        ];

        let loginSuccess = false;
        for (const creds of testCredentials) {
          try {
            await emailInput.fill(creds.email);
            await passwordInput.fill(creds.password);
            await loginButton.click();
            await page.waitForTimeout(3000);
            
            // Check if login was successful
            const loginSuccessCheck = await page.evaluate(() => {
              const hasUserElement = document.querySelector('[data-testid="user-info"], [data-testid="user-menu"], .user-info');
              const hasLogoutButton = Array.from(document.querySelectorAll('button')).some(btn =>
                btn.textContent?.includes('Logout') || btn.textContent?.includes('Sign Out')
              );
              const isOnDashboard = window.location.pathname.includes('/dashboard');
              return hasUserElement || hasLogoutButton || isOnDashboard;
            });

            if (loginSuccessCheck) {
              console.log(`✅ Login successful with ${creds.email}`);
              loginSuccess = true;
              break;
            } else {
              console.log(`❌ Login failed with ${creds.email}, trying next credentials...`);
            }
          } catch (error) {
            console.log(`❌ Error with ${creds.email}: ${error.message}`);
          }
        }

        if (!loginSuccess) {
          console.log('⚠️ Could not login with test credentials, proceeding without authentication...');
        }
      } else {
        console.log('⚠️ Login form not found, proceeding without authentication...');
      }
    }

    // Step 2: Navigate to where strategy cards are actually displayed
    console.log('\n📍 Step 2: Navigating to strategy cards location...');
    
    // Try different possible locations for strategy cards
    const possibleLocations = [
      '/dashboard',
      '/strategies',
      '/analytics',
      '/trades'
    ];

    let strategyCardsFound = false;
    let currentLocation = '';

    for (const location of possibleLocations) {
      console.log(`🔍 Checking ${location} for strategy cards...`);
      await page.goto(`http://localhost:3001${location}`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(3000);

      // Look for strategy cards
      const strategyCards = await page.locator('.glass.p-4\\.sm\\:p-6, [data-testid="strategy-card"], .strategy-card').count();
      
      if (strategyCards > 0) {
        console.log(`✅ Found ${strategyCards} strategy cards at ${location}`);
        strategyCardsFound = true;
        currentLocation = location;
        break;
      }
    }

    if (!strategyCardsFound) {
      console.log('⚠️ No strategy cards found in standard locations, trying test page...');
      
      // Try the test modal page
      await page.goto('http://localhost:3001/test-modal', { waitUntil: 'networkidle' });
      await page.waitForTimeout(3000);
      
      const testPageCards = await page.locator('.glass.p-4\\.sm\\:p-6, [data-testid="strategy-card"]').count();
      if (testPageCards > 0) {
        console.log(`✅ Found ${testPageCards} strategy cards on test page`);
        strategyCardsFound = true;
        currentLocation = '/test-modal';
      }
    }

    if (!strategyCardsFound) {
      console.log('⚠️ No strategy cards found anywhere, creating test scenario...');
      
      // Create a test scenario
      await page.evaluate(() => {
        // Create a test strategy card with modal
        const testContainer = document.createElement('div');
        testContainer.id = 'diagnostic-test-container';
        testContainer.style.cssText = `
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          z-index: 1000;
          background: rgba(0, 0, 0, 0.8);
          padding: 20px;
          border-radius: 12px;
          border: 2px solid #3b82f6;
        `;
        
        testContainer.innerHTML = `
          <h3 style="color: white; margin-bottom: 15px;">Modal Glitch Diagnostic Test</h3>
          <button id="trigger-modal-test" style="
            background: #3b82f6;
            color: white;
            padding: 12px 24px;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-size: 16px;
            margin-bottom: 10px;
          ">Test Strategy Performance Modal</button>
          <button id="trigger-double-modal-test" style="
            background: #ef4444;
            color: white;
            padding: 12px 24px;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-size: 16px;
          ">Test Double Modal Structure</button>
          <div id="diagnostic-info" style="
            color: white;
            font-size: 12px;
            margin-top: 15px;
            padding: 10px;
            background: rgba(0, 0, 0, 0.5);
            border-radius: 6px;
          ">Click a button to test modal behavior</div>
        `;
        
        document.body.appendChild(testContainer);
        
        // Add diagnostic logging
        document.getElementById('trigger-modal-test').addEventListener('click', () => {
          console.log('🔍 [DIAGNOSTIC] Single modal test triggered');
          const info = document.getElementById('diagnostic-info');
          info.innerHTML = 'Testing single modal... Check console for [MODAL_DEBUG] and [CARD_DEBUG] messages';
          
          // Try to find and click actual performance button
          const performanceButtons = Array.from(document.querySelectorAll('button')).filter(btn =>
            btn.textContent?.includes('Performance') || btn.textContent?.includes('View Performance')
          );
          if (performanceButtons.length > 0) {
            performanceButtons[0].click();
            console.log('🔍 [DIAGNOSTIC] Performance button clicked');
          } else {
            console.log('🔍 [DIAGNOSTIC] No performance buttons found, simulating modal...');
          }
        });
        
        document.getElementById('trigger-double-modal-test').addEventListener('click', () => {
          console.log('🔍 [DIAGNOSTIC] Double modal structure test triggered');
          const info = document.getElementById('diagnostic-info');
          info.innerHTML = 'Testing double modal structure... Check for nested modal containers';
          
          // Analyze current modal structure
          const fixedElements = document.querySelectorAll('[style*="position: fixed"], [class*="fixed"]');
          const modalElements = document.querySelectorAll('[class*="modal"], [data-testid*="modal"]');
          const backdropElements = document.querySelectorAll('[class*="backdrop"]');
          
          console.log('🔍 [DIAGNOSTIC] Modal structure analysis:', {
            fixedElements: fixedElements.length,
            modalElements: modalElements.length,
            backdropElements: backdropElements.length,
            details: {
              fixedElements: Array.from(fixedElements).map(el => ({
                tagName: el.tagName,
                className: el.className,
                zIndex: window.getComputedStyle(el).zIndex
              })),
              modalElements: Array.from(modalElements).map(el => ({
                tagName: el.tagName,
                className: el.className,
                testId: el.getAttribute('data-testid')
              })),
              backdropElements: Array.from(backdropElements).map(el => ({
                tagName: el.tagName,
                className: el.className,
                testId: el.getAttribute('data-testid')
              }))
            }
          });
        });
      });
      
      await page.waitForTimeout(1000);
    }

    // Step 3: Trigger modal and capture comprehensive diagnostics
    console.log('\n📍 Step 3: Triggering modal and capturing comprehensive diagnostics...');
    
    if (strategyCardsFound) {
      // Click on the first strategy card's performance button
      try {
        const performanceButton = await page.locator('button:has-text("Performance"), button:has-text("View Performance Details")').first();
        if (await performanceButton.isVisible()) {
          console.log('🔍 Clicking performance button...');
          await performanceButton.click();
          await page.waitForTimeout(2000);
        } else {
          console.log('⚠️ Performance button not visible, trying card click...');
          await page.locator('.glass.p-4\\.sm\\:p-6').first().click();
          await page.waitForTimeout(2000);
        }
      } catch (error) {
        console.log('⚠️ Could not click performance button:', error.message);
      }
    } else {
      // Use our test buttons
      console.log('🔍 Using test modal trigger...');
      await page.locator('#trigger-modal-test').click();
      await page.waitForTimeout(2000);
    }

    // Step 4: Capture visual evidence and CSS analysis
    console.log('\n📍 Step 4: Capturing visual evidence and CSS analysis...');
    
    const visualAnalysis = await page.evaluate(() => {
      // Check for double modal structure
      const modalBackdrop = document.querySelector('[data-testid="strategy-performance-modal-backdrop"]');
      const cardModalWrapper = document.querySelector('[data-testid="enhanced-strategy-card-modal-wrapper"]');
      const cardBackdrop = document.querySelector('[data-testid="enhanced-strategy-card-backdrop"]');
      
      // Check for multiple backdrops
      const allBackdrops = document.querySelectorAll('[class*="backdrop"]');
      const allModals = document.querySelectorAll('[class*="modal"], [data-testid*="modal"]');
      const allFixedElements = document.querySelectorAll('[style*="position: fixed"], [class*="fixed"]');
      
      // Analyze z-index hierarchy
      const zIndexHierarchy = Array.from(allFixedElements).map(el => ({
        element: el.tagName,
        className: el.className,
        testId: el.getAttribute('data-testid'),
        zIndex: window.getComputedStyle(el).zIndex,
        position: window.getComputedStyle(el).position,
        top: window.getComputedStyle(el).top,
        left: window.getComputedStyle(el).left,
        width: window.getComputedStyle(el).width,
        height: window.getComputedStyle(el).height
      })).sort((a, b) => parseInt(b.zIndex) - parseInt(a.zIndex));
      
      // Check for positioning conflicts
      const positioningConflicts = [];
      zIndexHierarchy.forEach((el, index) => {
        if (index > 0 && el.zIndex === zIndexHierarchy[index - 1].zIndex) {
          positioningConflicts.push({
            conflict: 'Same z-index',
            elements: [el, zIndexHierarchy[index - 1]]
          });
        }
      });
      
      // Check for "trapped in a box" visual indicators
      const trappedInBoxIndicators = {
        hasMultipleBackdrops: allBackdrops.length > 1,
        hasNestedModals: cardModalWrapper && modalBackdrop,
        hasConflictingZIndex: positioningConflicts.length > 0,
        hasOverflowHidden: Array.from(allModals).some(modal => 
          window.getComputedStyle(modal).overflow === 'hidden'
        ),
        hasTransformConflicts: Array.from(allFixedElements).some(el => 
          window.getComputedStyle(el).transform !== 'none'
        )
      };
      
      return {
        modalElements: {
          modalBackdrop: !!modalBackdrop,
          cardModalWrapper: !!cardModalWrapper,
          cardBackdrop: !!cardBackdrop,
          totalBackdrops: allBackdrops.length,
          totalModals: allModals.length,
          totalFixedElements: allFixedElements.length
        },
        zIndexHierarchy,
        positioningConflicts,
        trappedInBoxIndicators,
        viewportInfo: {
          width: window.innerWidth,
          height: window.innerHeight,
          scrollX: window.scrollX,
          scrollY: window.scrollY
        }
      };
    });

    console.log('📊 Visual Analysis Results:');
    console.log(`   Modal Backdrop: ${visualAnalysis.modalElements.modalBackdrop}`);
    console.log(`   Card Modal Wrapper: ${visualAnalysis.modalElements.cardModalWrapper}`);
    console.log(`   Card Backdrop: ${visualAnalysis.modalElements.cardBackdrop}`);
    console.log(`   Total Backdrops: ${visualAnalysis.modalElements.totalBackdrops}`);
    console.log(`   Total Modals: ${visualAnalysis.modalElements.totalModals}`);
    console.log(`   Positioning Conflicts: ${visualAnalysis.positioningConflicts.length}`);
    console.log(`   Trapped in Box Indicators:`, visualAnalysis.trappedInBoxIndicators);

    // Step 5: Analyze diagnostic messages
    console.log('\n📍 Step 5: Analyzing diagnostic messages...');
    
    const modalDebugMessages = consoleMessages.filter(msg => 
      msg.text.includes('[MODAL_DEBUG]') || msg.text.includes('[CARD_DEBUG]')
    );
    
    const doubleModalEvidence = modalDebugMessages.filter(msg => 
      msg.text.includes('hasNestedModal') ||
      msg.text.includes('conflictingElements') ||
      msg.text.includes('cardModalZIndex') ||
      msg.text.includes('modalZIndex')
    );
    
    const positioningEvidence = modalDebugMessages.filter(msg => 
      msg.text.includes('position') ||
      msg.text.includes('zIndex') ||
      msg.text.includes('computedStyle')
    );

    console.log(`📊 Modal debug messages: ${modalDebugMessages.length}`);
    console.log(`🔄 Double modal evidence: ${doubleModalEvidence.length}`);
    console.log(`📐 Positioning evidence: ${positioningEvidence.length}`);

    // Step 6: Take screenshots for visual evidence
    console.log('\n📍 Step 6: Capturing visual evidence...');
    
    const screenshotPath = `./modal-glitch-diagnostic-screenshot-${Date.now()}.png`;
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`📸 Screenshot saved to: ${screenshotPath}`);

    // Step 7: Generate comprehensive diagnostic report
    const diagnosticReport = {
      timestamp: new Date().toISOString(),
      testLocation: currentLocation || 'test-page',
      authentication: {
        wasAuthenticated: isAuthenticated,
        loginAttempted: !isAuthenticated
      },
      summary: {
        strategyCardsFound: strategyCardsFound,
        modalDebugMessages: modalDebugMessages.length,
        doubleModalEvidence: doubleModalEvidence.length,
        positioningEvidence: positioningEvidence.length,
        multipleBackdrops: visualAnalysis.modalElements.totalBackdrops,
        modalBackdropVisible: visualAnalysis.modalElements.modalBackdrop,
        cardModalWrapperVisible: visualAnalysis.modalElements.cardModalWrapper,
        cardBackdropVisible: visualAnalysis.modalElements.cardBackdrop
      },
      evidence: {
        modalDebugMessages: modalDebugMessages,
        doubleModalEvidence: doubleModalEvidence,
        positioningEvidence: positioningEvidence,
        consoleMessages: consoleMessages,
        errors: errors,
        visualAnalysis: visualAnalysis
      },
      diagnosis: {
        hasDoubleModalStructure: visualAnalysis.modalElements.cardModalWrapper || visualAnalysis.modalElements.cardBackdrop,
        hasMultipleBackdrops: visualAnalysis.modalElements.totalBackdrops > 1,
        hasPositioningConflicts: visualAnalysis.positioningConflicts.length > 0,
        hasTrappedInBoxBehavior: Object.values(visualAnalysis.trappedInBoxIndicators).some(v => v === true),
        rootCause: visualAnalysis.modalElements.cardModalWrapper ? 
          'Double modal structure in EnhancedStrategyCard component' : 
          'Unknown - needs further investigation'
      },
      screenshot: screenshotPath
    };

    // Save diagnostic report
    const reportPath = `./enhanced-modal-glitch-diagnostic-${Date.now()}.json`;
    fs.writeFileSync(reportPath, JSON.stringify(diagnosticReport, null, 2));
    console.log(`\n📄 Comprehensive diagnostic report saved to: ${reportPath}`);

    // Step 8: Provide preliminary diagnosis
    console.log('\n📍 Step 8: Comprehensive Diagnosis:');
    console.log(`   Double Modal Structure: ${diagnosticReport.diagnosis.hasDoubleModalStructure ? '❌ CONFIRMED' : '✅ NOT DETECTED'}`);
    console.log(`   Multiple Backdrops: ${diagnosticReport.diagnosis.hasMultipleBackdrops ? '❌ DETECTED' : '✅ NOT DETECTED'}`);
    console.log(`   Positioning Conflicts: ${diagnosticReport.diagnosis.hasPositioningConflicts ? '❌ DETECTED' : '✅ NOT DETECTED'}`);
    console.log(`   Trapped in Box Behavior: ${diagnosticReport.diagnosis.hasTrappedInBoxBehavior ? '❌ DETECTED' : '✅ NOT DETECTED'}`);
    console.log(`   Root Cause: ${diagnosticReport.diagnosis.rootCause}`);

    return diagnosticReport;

  } catch (error) {
    console.error('❌ Enhanced diagnostic test failed:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

// Run the enhanced diagnostic test
if (require.main === module) {
  runEnhancedModalGlitchDiagnostic()
    .then(report => {
      console.log('\n✅ Enhanced Modal Glitch Diagnostic Completed!');
      console.log('📊 Diagnostic Summary:');
      console.log(`   - Double Modal Structure: ${report.diagnosis.hasDoubleModalStructure ? '❌ CONFIRMED' : '✅ NOT DETECTED'}`);
      console.log(`   - Multiple Backdrops: ${report.diagnosis.hasMultipleBackdrops ? '❌ DETECTED' : '✅ NOT DETECTED'}`);
      console.log(`   - Positioning Conflicts: ${report.diagnosis.hasPositioningConflicts ? '❌ DETECTED' : '✅ NOT DETECTED'}`);
      console.log(`   - Trapped in Box Behavior: ${report.diagnosis.hasTrappedInBoxBehavior ? '❌ DETECTED' : '✅ NOT DETECTED'}`);
      console.log(`   - Root Cause: ${report.diagnosis.rootCause}`);
      console.log(`   - Screenshot: ${report.screenshot}`);
      
      if (report.diagnosis.hasDoubleModalStructure || report.diagnosis.hasMultipleBackdrops) {
        console.log('\n🎯 DIAGNOSIS: Double Modal Structure Confirmed');
        console.log('   Evidence: EnhancedStrategyCard creates wrapper modal + StrategyPerformanceModal');
        console.log('   Recommendation: Remove duplicate modal wrapper from EnhancedStrategyCard');
        console.log('   Fix: StrategyPerformanceModal should handle its own backdrop/wrapper');
        process.exit(1);
      } else {
        console.log('\n✅ DIAGNOSIS: No Double Modal Structure Detected');
        console.log('   Recommendation: Investigate other potential causes');
        process.exit(0);
      }
    })
    .catch(error => {
      console.error('❌ Enhanced diagnostic test failed:', error);
      process.exit(1);
    });
}

module.exports = { runEnhancedModalGlitchDiagnostic };