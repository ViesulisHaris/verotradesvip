/**
 * Modal Glitch Diagnostic Test
 * 
 * This test specifically checks for the double modal structure issue
 * and validates the diagnostic logging we added.
 */

const { chromium } = require('playwright');
const fs = require('fs');

async function runModalGlitchDiagnostic() {
  console.log('🔍 Starting Modal Glitch Diagnostic Test');
  console.log('=' .repeat(80));

  const browser = await chromium.launch({ 
    headless: false,
    devtools: true
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
    // Navigate to dashboard
    console.log('\n📍 Step 1: Navigating to dashboard...');
    await page.goto('http://localhost:3001/dashboard', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);

    // Look for strategy cards or create test scenario
    console.log('\n📍 Step 2: Looking for strategy cards...');
    
    let strategyCards = 0;
    try {
      // Try to find strategy cards with various selectors
      const selectors = [
        '[data-testid="strategy-card"]',
        '.glass.p-4\\.sm\\:p-6',
        'button[class*="Performance"]',
        'text=View Performance Details'
      ];
      
      for (const selector of selectors) {
        try {
          const count = await page.locator(selector).count();
          if (count > 0) {
            console.log(`📊 Found ${count} elements with selector: ${selector}`);
            strategyCards = count;
            break;
          }
        } catch (e) {
          // Continue to next selector
        }
      }
    } catch (error) {
      console.log('📊 No strategy cards found');
    }

    // If no strategy cards, create test scenario
    if (strategyCards === 0) {
      console.log('🧪 Creating test scenario for modal diagnostic...');
      
      await page.evaluate(() => {
        // Create a test button to trigger modal
        const testButton = document.createElement('button');
        testButton.id = 'diagnostic-modal-trigger';
        testButton.textContent = 'Test Modal Diagnostic';
        testButton.style.cssText = `
          position: fixed;
          top: 20px;
          right: 20px;
          z-index: 9999;
          background: #3b82f6;
          color: white;
          padding: 8px 16px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
        `;
        
        document.body.appendChild(testButton);
        
        // Add click handler to trigger modal
        testButton.addEventListener('click', () => {
          console.log('🔍 [TEST] Modal diagnostic trigger clicked');
          
          // Find and click the actual performance details button
          const performanceButtons = document.querySelectorAll('button[class*="Performance"], text="View Performance Details"]');
          if (performanceButtons.length > 0) {
            performanceButtons[0].click();
            console.log('🔍 [TEST] Performance button clicked');
          } else {
            console.log('🔍 [TEST] No performance buttons found');
          }
        });
      });
      
      await page.waitForTimeout(1000);
    }

    // Step 3: Trigger modal and capture diagnostics
    console.log('\n📍 Step 3: Triggering modal and capturing diagnostics...');
    
    if (strategyCards > 0) {
      // Click first strategy card to trigger modal
      await page.locator('.glass.p-4\\.sm\\:p-6').first().click();
      await page.waitForTimeout(2000);
    } else {
      // Use our test button
      await page.locator('#diagnostic-modal-trigger').click();
      await page.waitForTimeout(2000);
    }

    // Step 4: Analyze diagnostic messages
    console.log('\n📍 Step 4: Analyzing diagnostic messages...');
    
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

    // Step 5: Check for visual modal issues
    console.log('\n📍 Step 5: Checking for visual modal issues...');
    
    const modalBackdrop = await page.locator('[data-testid="strategy-performance-modal-backdrop"]').isVisible().catch(() => false);
    const cardModalWrapper = await page.locator('[data-testid="enhanced-strategy-card-modal-wrapper"]').isVisible().catch(() => false);
    const cardBackdrop = await page.locator('[data-testid="enhanced-strategy-card-backdrop"]').isVisible().catch(() => false);
    
    console.log(`🔍 Modal backdrop visible: ${modalBackdrop}`);
    console.log(`🔍 Card modal wrapper visible: ${cardModalWrapper}`);
    console.log(`🔍 Card backdrop visible: ${cardBackdrop}`);

    // Check for multiple backdrops
    const allBackdrops = await page.locator('[class*="backdrop"]').count();
    console.log(`🔍 Total backdrops found: ${allBackdrops}`);

    // Step 6: Generate diagnostic report
    const diagnosticReport = {
      timestamp: new Date().toISOString(),
      summary: {
        strategyCardsFound: strategyCards,
        modalDebugMessages: modalDebugMessages.length,
        doubleModalEvidence: doubleModalEvidence.length,
        positioningEvidence: positioningEvidence.length,
        multipleBackdrops: allBackdrops,
        modalBackdropVisible: modalBackdrop,
        cardModalWrapperVisible: cardModalWrapper,
        cardBackdropVisible: cardBackdrop
      },
      evidence: {
        modalDebugMessages: modalDebugMessages,
        doubleModalEvidence: doubleModalEvidence,
        positioningEvidence: positioningEvidence,
        consoleMessages: consoleMessages,
        errors: errors
      },
      diagnosis: {
        hasDoubleModalStructure: cardModalWrapper || cardBackdrop,
        hasMultipleBackdrops: allBackdrops > 1,
        hasPositioningConflicts: positioningEvidence.length > 0
      }
    };

    // Save diagnostic report
    const reportPath = `./modal-glitch-diagnostic-${Date.now()}.json`;
    fs.writeFileSync(reportPath, JSON.stringify(diagnosticReport, null, 2));
    console.log(`\n📄 Diagnostic report saved to: ${reportPath}`);

    // Step 7: Provide preliminary diagnosis
    console.log('\n📍 Step 7: Preliminary Diagnosis:');
    console.log(`   Double Modal Structure: ${diagnosticReport.diagnosis.hasDoubleModalStructure ? '❌ DETECTED' : '✅ NOT DETECTED'}`);
    console.log(`   Multiple Backdrops: ${diagnosticReport.diagnosis.hasMultipleBackdrops ? '❌ DETECTED' : '✅ NOT DETECTED'}`);
    console.log(`   Positioning Conflicts: ${diagnosticReport.diagnosis.hasPositioningConflicts ? '❌ DETECTED' : '✅ NOT DETECTED'}`);

    return diagnosticReport;

  } catch (error) {
    console.error('❌ Diagnostic test failed:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

// Run the diagnostic test
if (require.main === module) {
  runModalGlitchDiagnostic()
    .then(report => {
      console.log('\n✅ Modal Glitch Diagnostic Completed!');
      console.log('📊 Diagnostic Summary:');
      console.log(`   - Double Modal Structure: ${report.diagnosis.hasDoubleModalStructure ? '❌ YES' : '✅ NO'}`);
      console.log(`   - Multiple Backdrops: ${report.diagnosis.hasMultipleBackdrops ? '❌ YES' : '✅ NO'}`);
      console.log(`   - Positioning Conflicts: ${report.diagnosis.hasPositioningConflicts ? '❌ YES' : '✅ NO'}`);
      
      if (report.diagnosis.hasDoubleModalStructure || report.diagnosis.hasMultipleBackdrops) {
        console.log('\n🎯 DIAGNOSIS: Double Modal Structure Confirmed');
        console.log('   Recommendation: Remove duplicate modal wrapper from EnhancedStrategyCard');
        process.exit(1);
      } else {
        console.log('\n✅ DIAGNOSIS: No Double Modal Structure Detected');
        console.log('   Recommendation: Investigate other potential causes');
        process.exit(0);
      }
    })
    .catch(error => {
      console.error('❌ Diagnostic test failed:', error);
      process.exit(1);
    });
}

module.exports = { runModalGlitchDiagnostic };