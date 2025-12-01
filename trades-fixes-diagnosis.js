/**
 * Trades Navigation Fixes Diagnosis
 * 
 * This script specifically diagnoses the issues found in the verification:
 * 1. Debug Panel Z-Index Fix in ZoomAwareLayout.tsx
 * 2. Modal Overlay Cleanup Fix in trades/page.tsx
 */

const { chromium } = require('playwright');
const fs = require('fs');

async function diagnoseTradesFixes() {
  console.log('🔍 Diagnosing Trades Navigation Fixes...\n');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 200
  });
  
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  
  const page = await context.newPage();
  
  const diagnosis = {
    debugPanelIssues: [],
    modalOverlayIssues: [],
    navigationIssues: [],
    recommendations: []
  };
  
  try {
    // Test 1: Analyze debug panel implementation
    console.log('🔍 Test 1: Analyze Debug Panel Implementation');
    
    await page.goto('http://localhost:3000/login');
    await page.waitForLoadState('networkidle');
    
    // Check debug panel styles and implementation
    const debugPanelAnalysis = await page.evaluate(() => {
      const debugPanel = document.querySelector('.zoom-debug-panel');
      if (!debugPanel) {
        return { exists: false };
      }
      
      const computedStyle = window.getComputedStyle(debugPanel);
      const inlineStyle = debugPanel.getAttribute('style');
      
      return {
        exists: true,
        zIndex: computedStyle.zIndex,
        pointerEvents: computedStyle.pointerEvents,
        userSelect: computedStyle.userSelect,
        position: computedStyle.position,
        inlineStyle: inlineStyle,
        className: debugPanel.className,
        parentElement: debugPanel.parentElement?.tagName,
        nextSibling: debugPanel.nextElementSibling?.tagName
      };
    });
    
    console.log('📊 Debug Panel Analysis:', JSON.stringify(debugPanelAnalysis, null, 2));
    
    if (debugPanelAnalysis.exists) {
      if (parseInt(debugPanelAnalysis.zIndex) > 100) {
        diagnosis.debugPanelIssues.push({
          issue: 'Debug panel z-index is too high',
          current: debugPanelAnalysis.zIndex,
          expected: '≤ 100',
          severity: 'high'
        });
      }
      
      if (debugPanelAnalysis.pointerEvents !== 'none') {
        diagnosis.debugPanelIssues.push({
          issue: 'Debug panel pointer-events is not none',
          current: debugPanelAnalysis.pointerEvents,
          expected: 'none',
          severity: 'high'
        });
      }
      
      if (debugPanelAnalysis.userSelect !== 'none') {
        diagnosis.debugPanelIssues.push({
          issue: 'Debug panel user-select is not none',
          current: debugPanelAnalysis.userSelect,
          expected: 'none',
          severity: 'medium'
        });
      }
    }
    
    // Test 2: Check ZoomAwareLayout source code
    console.log('\n🔍 Test 2: Check ZoomAwareLayout Implementation');
    
    const zoomLayoutCode = await page.evaluate(() => {
      // Look for the debug panel in the DOM and check its inline styles
      const debugPanel = document.querySelector('.zoom-debug-panel');
      if (debugPanel) {
        const style = debugPanel.getAttribute('style');
        return {
          inlineStyle: style,
          hasPointerEventsNone: style && style.includes('pointer-events: none'),
          hasUserSelectNone: style && style.includes('user-select: none'),
          hasZIndex10: style && style.includes('z-index: 10')
        };
      }
      return null;
    });
    
    if (zoomLayoutCode) {
      console.log('📊 ZoomAwareLayout Inline Styles:', zoomLayoutCode);
      
      if (!zoomLayoutCode.hasPointerEventsNone) {
        diagnosis.debugPanelIssues.push({
          issue: 'Debug panel missing pointer-events: none in inline styles',
          severity: 'high'
        });
      }
      
      if (!zoomLayoutCode.hasUserSelectNone) {
        diagnosis.debugPanelIssues.push({
          issue: 'Debug panel missing user-select: none in inline styles',
          severity: 'medium'
        });
      }
      
      if (!zoomLayoutCode.hasZIndex10) {
        diagnosis.debugPanelIssues.push({
          issue: 'Debug panel missing z-index: 10 in inline styles',
          severity: 'high'
        });
      }
    }
    
    // Test 3: Try to access trades page to check modal fixes
    console.log('\n🔍 Test 3: Check Modal Overlay Implementation');
    
    try {
      await page.goto('http://localhost:3000/trades');
      await page.waitForLoadState('networkidle');
      
      // Check for cleanup functions in the page
      const modalCleanupAnalysis = await page.evaluate(() => {
        // Look for cleanup functions in the global scope
        const globalFunctions = Object.keys(window);
        const cleanupFunctions = globalFunctions.filter(name => 
          name.includes('cleanup') || name.includes('modal') || name.includes('overlay')
        );
        
        // Look for cleanup in script tags
        const scripts = Array.from(document.querySelectorAll('script'));
        const cleanupInScripts = scripts.some(script => 
          script.textContent && (
            script.textContent.includes('cleanupModalOverlays') ||
            script.textContent.includes('component unmount') ||
            script.textContent.includes('useEffect.*cleanup')
          )
        );
        
        // Check for modal elements and their z-index
        const modals = document.querySelectorAll('.fixed.inset-0, .modal-backdrop, [role="dialog"]');
        const modalZIndexes = Array.from(modals).map(modal => ({
          element: modal.tagName,
          className: modal.className,
          zIndex: window.getComputedStyle(modal).zIndex
        }));
        
        // Check body styles
        const bodyStyles = {
          pointerEvents: window.getComputedStyle(document.body).pointerEvents,
          overflow: window.getComputedStyle(document.body).overflow,
          classes: document.body.className
        };
        
        return {
          globalFunctions: cleanupFunctions,
          cleanupInScripts,
          modalZIndexes,
          bodyStyles,
          hasTradesPageContent: document.querySelector('h1, .heading-luxury, [class*="trade"]') !== null
        };
      });
      
      console.log('📊 Modal Cleanup Analysis:', JSON.stringify(modalCleanupAnalysis, null, 2));
      
      if (!modalCleanupAnalysis.cleanupInScripts) {
        diagnosis.modalOverlayIssues.push({
          issue: 'Modal cleanup functions not found in page scripts',
          severity: 'high'
        });
      }
      
      if (modalCleanupAnalysis.modalZIndexes.length > 0) {
        const highZIndexModals = modalCleanupAnalysis.modalZIndexes.filter(modal => 
          parseInt(modal.zIndex) > 1000
        );
        
        if (highZIndexModals.length > 0) {
          diagnosis.modalOverlayIssues.push({
            issue: 'Modal elements with high z-index found',
            details: highZIndexModals,
            severity: 'medium'
          });
        }
      }
      
    } catch (error) {
      console.log('⚠️ Could not access trades page (may require authentication):', error.message);
      diagnosis.navigationIssues.push({
        issue: 'Cannot access trades page for modal testing',
        error: error.message,
        severity: 'high'
      });
    }
    
    // Test 4: Navigation flow analysis
    console.log('\n🔍 Test 4: Navigation Flow Analysis');
    
    const navigationTest = await page.evaluate(async () => {
      const results = [];
      
      // Test navigation responsiveness
      const navLinks = document.querySelectorAll('a[href]');
      const clickableNavLinks = Array.from(navLinks).filter(link => {
        const rect = link.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0; // Visible links
      });
      
      // Check for overlay elements that might block clicks
      const overlays = document.querySelectorAll([
        '.fixed.inset-0',
        '.modal-backdrop',
        '[style*="position: fixed"]',
        '.modal-overlay',
        '[role="dialog"]',
        '[aria-modal="true"]',
        '.fixed.z-50',
        '.fixed.z-\\[999999\\]'
      ].join(', '));
      
      const blockingOverlays = Array.from(overlays).filter(overlay => {
        const style = window.getComputedStyle(overlay);
        const zIndex = parseInt(style.zIndex) || 0;
        return zIndex > 100 && (style.position === 'fixed' || style.position === 'absolute');
      });
      
      return {
        totalNavLinks: navLinks.length,
        clickableNavLinks: clickableNavLinks.length,
        totalOverlays: overlays.length,
        blockingOverlays: blockingOverlays.length,
        hasDebugPanel: document.querySelector('.zoom-debug-panel') !== null
      };
    });
    
    console.log('📊 Navigation Analysis:', JSON.stringify(navigationTest, null, 2));
    
    if (navigationTest.blockingOverlays > 0) {
      diagnosis.navigationIssues.push({
        issue: 'Blocking overlays found during navigation',
        count: navigationTest.blockingOverlays,
        severity: 'high'
      });
    }
    
    // Generate recommendations
    console.log('\n💡 Generating Recommendations...');
    
    if (diagnosis.debugPanelIssues.length > 0) {
      diagnosis.recommendations.push({
        category: 'Debug Panel Fix',
        priority: 'high',
        action: 'Update ZoomAwareLayout.tsx to ensure debug panel has z-index: 10, pointer-events: none, and user-select: none',
        code: `
// In ZoomAwareLayout.tsx, line 113, update the debug panel:
<div className="zoom-debug-panel fixed bottom-4 left-4 z-10 bg-elevated border border-gold text-primary p-3 rounded-lg text-xs font-mono max-w-xs pointer-events-none user-select-none">
`
      });
    }
    
    if (diagnosis.modalOverlayIssues.length > 0) {
      diagnosis.recommendations.push({
        category: 'Modal Overlay Fix',
        priority: 'high',
        action: 'Ensure cleanupModalOverlays function is properly implemented and called on component unmount',
        code: `
// In trades/page.tsx, ensure the cleanup function is exported and available:
window.cleanupModalOverlays = cleanupModalOverlays;

// And add proper cleanup on unmount:
useEffect(() => {
  return () => {
    cleanupModalOverlays();
  };
}, [cleanupModalOverlays]);
`
      });
    }
    
    if (diagnosis.navigationIssues.length > 0) {
      diagnosis.recommendations.push({
        category: 'Navigation Fix',
        priority: 'medium',
        action: 'Test navigation with authenticated user to access trades page properly'
      });
    }
    
  } catch (error) {
    console.error('❌ Diagnosis failed:', error);
    diagnosis.navigationIssues.push({
      issue: 'Diagnosis script failed',
      error: error.message,
      severity: 'high'
    });
  } finally {
    await browser.close();
  }
  
  return diagnosis;
}

// Run the diagnosis
diagnoseTradesFixes()
  .then(diagnosis => {
    console.log('\n📋 DIAGNOSIS RESULTS:');
    console.log('=====================');
    
    console.log('\n🔧 Debug Panel Issues:');
    diagnosis.debugPanelIssues.forEach((issue, index) => {
      console.log(`  ${index + 1}. [${issue.severity.toUpperCase()}] ${issue.issue}`);
      if (issue.current) console.log(`     Current: ${issue.current}, Expected: ${issue.expected}`);
    });
    
    console.log('\n🧹 Modal Overlay Issues:');
    diagnosis.modalOverlayIssues.forEach((issue, index) => {
      console.log(`  ${index + 1}. [${issue.severity.toUpperCase()}] ${issue.issue}`);
      if (issue.details) console.log(`     Details: ${JSON.stringify(issue.details)}`);
    });
    
    console.log('\n🧭 Navigation Issues:');
    diagnosis.navigationIssues.forEach((issue, index) => {
      console.log(`  ${index + 1}. [${issue.severity.toUpperCase()}] ${issue.issue}`);
      if (issue.error) console.log(`     Error: ${issue.error}`);
    });
    
    console.log('\n💡 Recommendations:');
    diagnosis.recommendations.forEach((rec, index) => {
      console.log(`  ${index + 1}. [${rec.priority.toUpperCase()}] ${rec.category}: ${rec.action}`);
      if (rec.code) console.log(`     Code fix:\n${rec.code}`);
    });
    
    // Overall assessment
    const totalIssues = diagnosis.debugPanelIssues.length + 
                      diagnosis.modalOverlayIssues.length + 
                      diagnosis.navigationIssues.length;
    
    const highSeverityIssues = [...diagnosis.debugPanelIssues, ...diagnosis.modalOverlayIssues, ...diagnosis.navigationIssues]
      .filter(issue => issue.severity === 'high').length;
    
    console.log('\n🎯 OVERALL ASSESSMENT:');
    console.log(`  Total Issues Found: ${totalIssues}`);
    console.log(`  High Severity Issues: ${highSeverityIssues}`);
    
    if (highSeverityIssues === 0) {
      console.log('  ✅ All critical issues have been resolved');
    } else if (highSeverityIssues <= 2) {
      console.log('  ⚠️ Some high-priority issues remain but navigation should be mostly functional');
    } else {
      console.log('  ❌ Multiple high-priority issues need to be addressed');
    }
    
    // Save diagnosis report
    const reportData = {
      timestamp: new Date().toISOString(),
      diagnosis,
      summary: {
        totalIssues,
        highSeverityIssues,
        needsAttention: highSeverityIssues > 0
      }
    };
    
    fs.writeFileSync(
      'trades-fixes-diagnosis-report.json',
      JSON.stringify(reportData, null, 2)
    );
    
    console.log('\n📄 Detailed diagnosis saved to: trades-fixes-diagnosis-report.json');
    
    return diagnosis;
  })
  .catch(error => {
    console.error('❌ Diagnosis failed:', error);
    process.exit(1);
  });