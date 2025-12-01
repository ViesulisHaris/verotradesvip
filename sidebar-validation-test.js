const { chromium } = require('playwright');
const fs = require('fs');

async function validateSidebarEnhancements() {
  console.log('🔍 Starting Sidebar Aesthetic Enhancements Validation...\n');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // Set viewport to desktop size
    await page.setViewportSize({ width: 1920, height: 1080 });
    
    // Navigate to login page
    await page.goto('http://localhost:3000/login');
    await page.waitForLoadState('networkidle');
    
    // Login with test credentials
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'testpassword123');
    await page.click('button[type="submit"]');
    
    // Wait for dashboard
    await page.waitForURL('http://localhost:3000/dashboard', { timeout: 10000 });
    await page.waitForLoadState('networkidle');
    
    console.log('✅ Successfully authenticated and reached dashboard\n');
    
    // Test 1: Glass Morphism Effect
    console.log('🎨 Testing Glass Morphism Effect...');
    const sidebar = await page.locator('aside').first();
    const glassEffect = await sidebar.evaluate(el => {
      const styles = window.getComputedStyle(el);
      return {
        backdropFilter: styles.backdropFilter,
        backgroundColor: styles.backgroundColor,
        border: styles.border,
        boxShadow: styles.boxShadow,
        hasGlassClass: el.classList.contains('glass-enhanced')
      };
    });
    
    console.log(`   Backdrop Filter: ${glassEffect.backdropFilter}`);
    console.log(`   Background: ${glassEffect.backgroundColor}`);
    console.log(`   Border: ${glassEffect.border}`);
    console.log(`   Box Shadow: ${glassEffect.boxShadow}`);
    console.log(`   Has Glass Class: ${glassEffect.hasGlassClass}`);
    console.log(`   ✅ Glass morphism effect: ${glassEffect.backdropFilter !== 'none' && glassEffect.hasGlassClass ? 'PRESENT' : 'MISSING'}\n`);
    
    // Test 2: Fixed Dimensions
    console.log('📏 Testing Fixed Dimensions...');
    const dimensions = await sidebar.evaluate(el => {
      const styles = window.getComputedStyle(el);
      return {
        width: styles.width,
        minWidth: styles.minWidth,
        maxWidth: styles.maxWidth,
        actualWidth: el.offsetWidth
      };
    });
    
    console.log(`   Current Width: ${dimensions.width}`);
    console.log(`   Min Width: ${dimensions.minWidth}`);
    console.log(`   Max Width: ${dimensions.maxWidth}`);
    console.log(`   Actual Width: ${dimensions.actualWidth}px`);
    console.log(`   ✅ Fixed dimensions: ${dimensions.minWidth === '64px' ? 'CORRECT' : 'INCORRECT'}\n`);
    
    // Test 3: Toggle Functionality
    console.log('🔄 Testing Toggle Functionality...');
    const toggleButton = await page.locator('button[title="Toggle sidebar"]').first();
    
    // Get initial state
    const initialState = await sidebar.evaluate(el => ({
      width: el.offsetWidth,
      isCollapsed: el.classList.contains('sidebar-collapsed'),
      isExpanded: el.classList.contains('sidebar-expanded')
    }));
    
    console.log(`   Initial state: ${initialState.width}px, Collapsed: ${initialState.isCollapsed}, Expanded: ${initialState.isExpanded}`);
    
    // Toggle to expanded
    await toggleButton.click();
    await page.waitForTimeout(350); // Wait for transition
    
    const expandedState = await sidebar.evaluate(el => ({
      width: el.offsetWidth,
      isCollapsed: el.classList.contains('sidebar-collapsed'),
      isExpanded: el.classList.contains('sidebar-expanded')
    }));
    
    console.log(`   Expanded state: ${expandedState.width}px, Collapsed: ${expandedState.isCollapsed}, Expanded: ${expandedState.isExpanded}`);
    
    // Toggle back to collapsed
    await toggleButton.click();
    await page.waitForTimeout(350);
    
    const finalState = await sidebar.evaluate(el => ({
      width: el.offsetWidth,
      isCollapsed: el.classList.contains('sidebar-collapsed'),
      isExpanded: el.classList.contains('sidebar-expanded')
    }));
    
    console.log(`   Final state: ${finalState.width}px, Collapsed: ${finalState.isCollapsed}, Expanded: ${finalState.isExpanded}`);
    console.log(`   ✅ Toggle functionality: ${initialState.width !== expandedState.width ? 'WORKING' : 'NOT WORKING'}\n`);
    
    // Test 4: Menu Item Styling
    console.log('🎯 Testing Menu Item Styling...');
    const menuItems = await page.locator('nav a').all();
    
    if (menuItems.length > 0) {
      const firstMenuItem = menuItems[0];
      const menuItemStyles = await firstMenuItem.evaluate(el => {
        const styles = window.getComputedStyle(el);
        return {
          transition: styles.transition,
          transform: styles.transform,
          borderRadius: styles.borderRadius,
          hasHoverClass: el.classList.contains('group'),
          hasOverflow: el.classList.contains('overflow-hidden')
        };
      });
      
      console.log(`   Transition: ${menuItemStyles.transition}`);
      console.log(`   Transform: ${menuItemStyles.transform}`);
      console.log(`   Border Radius: ${menuItemStyles.borderRadius}`);
      console.log(`   Has Hover Class: ${menuItemStyles.hasHoverClass}`);
      console.log(`   Has Overflow Hidden: ${menuItemStyles.hasOverflow}`);
      console.log(`   ✅ Menu item styling: ${menuItemStyles.transition.includes('all') && menuItemStyles.hasHoverClass ? 'ENHANCED' : 'BASIC'}\n`);
    }
    
    // Test 5: Pointer Events Fix
    console.log('🖱️ Testing Pointer Events Fix...');
    const overlayElements = await page.locator('.absolute').all();
    let problematicOverlays = 0;
    
    for (const overlay of overlayElements.slice(0, 10)) { // Check first 10 overlays
      const pointerEvents = await overlay.evaluate(el => {
        const styles = window.getComputedStyle(el);
        return styles.pointerEvents;
      });
      
      if (pointerEvents === 'auto') {
        problematicOverlays++;
      }
    }
    
    console.log(`   Checked overlays: ${Math.min(overlayElements.length, 10)}`);
    console.log(`   Problematic overlays (pointer-events: auto): ${problematicOverlays}`);
    console.log(`   ✅ Pointer events fix: ${problematicOverlays === 0 ? 'FIXED' : 'NEEDS ATTENTION'}\n`);
    
    // Test 6: Performance Optimization
    console.log('⚡ Testing Performance Optimization...');
    const performanceStyles = await sidebar.evaluate(el => {
      const styles = window.getComputedStyle(el);
      return {
        willChange: styles.willChange,
        transform: styles.transform,
        transition: styles.transition,
        hasPerformanceClass: el.classList.contains('sidebar-performance-optimized')
      };
    });
    
    console.log(`   Will Change: ${performanceStyles.willChange}`);
    console.log(`   Transform: ${performanceStyles.transform}`);
    console.log(`   Transition: ${performanceStyles.transition}`);
    console.log(`   Has Performance Class: ${performanceStyles.hasPerformanceClass}`);
    console.log(`   ✅ Performance optimization: ${performanceStyles.hasPerformanceClass ? 'OPTIMIZED' : 'NOT OPTIMIZED'}\n`);
    
    // Take screenshot for visual verification
    await page.screenshot({ path: './sidebar-validation-screenshot.png', fullPage: true });
    console.log('📸 Screenshot saved: ./sidebar-validation-screenshot.png\n');
    
    // Generate validation report
    const validationReport = {
      timestamp: new Date().toISOString(),
      glassMorphism: {
        present: glassEffect.backdropFilter !== 'none' && glassEffect.hasGlassClass,
        backdropFilter: glassEffect.backdropFilter,
        hasGlassClass: glassEffect.hasGlassClass
      },
      fixedDimensions: {
        correct: dimensions.minWidth === '64px',
        currentWidth: dimensions.width,
        minWidth: dimensions.minWidth,
        maxWidth: dimensions.maxWidth
      },
      toggleFunctionality: {
        working: initialState.width !== expandedState.width,
        initialState: initialState,
        expandedState: expandedState,
        finalState: finalState
      },
      menuItemStyling: {
        enhanced: menuItems.length > 0 && menuItemStyles && menuItemStyles.transition.includes('all') && menuItemStyles.hasHoverClass,
        transition: menuItemStyles ? menuItemStyles.transition : 'N/A',
        hasHoverClass: menuItemStyles ? menuItemStyles.hasHoverClass : false
      },
      pointerEventsFix: {
        fixed: problematicOverlays === 0,
        problematicOverlays: problematicOverlays
      },
      performanceOptimization: {
        optimized: performanceStyles.hasPerformanceClass,
        hasPerformanceClass: performanceStyles.hasPerformanceClass
      }
    };
    
    fs.writeFileSync('./SIDEBAR_VALIDATION_REPORT.json', JSON.stringify(validationReport, null, 2));
    
    console.log('📊 Validation Summary:');
    console.log(`   Glass Morphism: ${validationReport.glassMorphism.present ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`   Fixed Dimensions: ${validationReport.fixedDimensions.correct ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`   Toggle Functionality: ${validationReport.toggleFunctionality.working ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`   Menu Item Styling: ${validationReport.menuItemStyling.enhanced ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`   Pointer Events Fix: ${validationReport.pointerEventsFix.fixed ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`   Performance Optimization: ${validationReport.performanceOptimization.optimized ? '✅ PASS' : '❌ FAIL'}`);
    console.log('\n📄 Detailed report saved to: ./SIDEBAR_VALIDATION_REPORT.json');
    
  } catch (error) {
    console.error('❌ Validation failed:', error);
  } finally {
    await browser.close();
  }
}

validateSidebarEnhancements();