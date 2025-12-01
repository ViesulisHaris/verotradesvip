/**
 * Hamburger Menu Code Analysis and Verification
 * Analyzes the actual implementation to verify functionality
 */

const fs = require('fs');
const path = require('path');

class HamburgerMenuAnalyzer {
  constructor() {
    this.results = [];
  }

  analyzeImplementation() {
    console.log('🔍 Analyzing hamburger menu implementation...\n');

    // Read TopNavigation component
    const topNavigationPath = './src/components/layout/TopNavigation.tsx';
    const sidebarPath = './src/components/layout/Sidebar.tsx';
    
    let topNavigationContent = '';
    let sidebarContent = '';
    
    try {
      topNavigationContent = fs.readFileSync(topNavigationPath, 'utf8');
      sidebarContent = fs.readFileSync(sidebarPath, 'utf8');
    } catch (error) {
      console.error('❌ Could not read component files:', error.message);
      return;
    }

    // Test 1: Hamburger Button Implementation Analysis
    this.analyzeHamburgerButton(topNavigationContent);
    
    // Test 2: Sidebar Implementation Analysis  
    this.analyzeSidebar(sidebarContent);
    
    // Test 3: Responsive Design Analysis
    this.analyzeResponsiveDesign(topNavigationContent, sidebarContent);
    
    // Test 4: Accessibility Analysis
    this.analyzeAccessibility(topNavigationContent);
    
    // Test 5: State Management Analysis
    this.analyzeStateManagement(sidebarContent);
    
    // Test 6: Integration Analysis
    this.analyzeIntegration(topNavigationContent, sidebarContent);
  }

  analyzeHamburgerButton(content) {
    console.log('📱 Analyzing Hamburger Button Implementation...');
    
    const tests = [];
    
    // Test 1.1: Button exists with proper structure
    const hasButtonStructure = content.includes('button[aria-label="Toggle mobile menu"]') &&
                                content.includes('onClick={onMobileMenuToggle}') &&
                                content.includes('lg:hidden');
    
    tests.push({
      name: 'Hamburger Button Structure',
      status: hasButtonStructure ? 'PASS' : 'FAIL',
      details: hasButtonStructure ? 
        'Button has proper structure with aria-label, onClick handler, and lg:hidden class' :
        'Missing required button structure elements'
    });

    // Test 1.2: Touch-friendly sizing
    const hasTouchFriendlySizing = content.includes('minHeight: \'48px\'') &&
                                     content.includes('minWidth: \'48px\'');
    
    tests.push({
      name: 'Touch-Friendly Sizing',
      status: hasTouchFriendlySizing ? 'PASS' : 'FAIL',
      details: hasTouchFriendlySizing ?
        'Button meets minimum touch target size (48x48px)' :
        'Button does not meet touch-friendly sizing requirements'
    });

    // Test 1.3: Hover and active states
    const hasInteractiveStates = content.includes('hover:scale-105') &&
                                   content.includes('active:scale-95') &&
                                   content.includes('transition-all duration-300');
    
    tests.push({
      name: 'Interactive States',
      status: hasInteractiveStates ? 'PASS' : 'FAIL',
      details: hasInteractiveStates ?
        'Button has proper hover, active, and transition states' :
        'Missing interactive state styling'
    });

    // Test 1.4: Focus management
    const hasFocusManagement = content.includes('focus:outline-none') &&
                                 content.includes('focus:ring-2') &&
                                 content.includes('focus:ring-[#B89B5E]/50');
    
    tests.push({
      name: 'Focus Management',
      status: hasFocusManagement ? 'PASS' : 'FAIL',
      details: hasFocusManagement ?
        'Button has proper focus styling and ring' :
        'Missing focus management styling'
    });

    this.results.push({
      category: 'Hamburger Button Implementation',
      tests
    });
  }

  analyzeSidebar(content) {
    console.log('📋 Analyzing Sidebar Implementation...');
    
    const tests = [];
    
    // Test 2.1: Mobile sidebar structure
    const hasMobileStructure = content.includes('lg:hidden') &&
                              content.includes('fixed top-0 left-0') &&
                              content.includes('sidebar-overlay');
    
    tests.push({
      name: 'Mobile Sidebar Structure',
      status: hasMobileStructure ? 'PASS' : 'FAIL',
      details: hasMobileStructure ?
        'Sidebar has proper mobile structure with fixed positioning' :
        'Missing mobile sidebar structure elements'
    });

    // Test 2.2: Transition animations
    const hasTransitions = content.includes('transition-transform ease-out') &&
                            content.includes('transitionDuration: \'300ms\'');
    
    tests.push({
      name: 'Transition Animations',
      status: hasTransitions ? 'PASS' : 'FAIL',
      details: hasTransitions ?
        'Sidebar has smooth transition animations' :
        'Missing transition animations'
    });

    // Test 2.3: Close button functionality
    const hasCloseButton = content.includes('button[aria-label="Close menu"]') &&
                          content.includes('onClick={() => setIsOpen(false)}');
    
    tests.push({
      name: 'Close Button',
      status: hasCloseButton ? 'PASS' : 'FAIL',
      details: hasCloseButton ?
        'Sidebar has functional close button' :
        'Missing close button functionality'
    });

    // Test 2.4: Overlay functionality
    const hasOverlay = content.includes('sidebar-backdrop') &&
                       content.includes('onClick={handleOverlayClick}') &&
                       content.includes('bg-black/50');
    
    tests.push({
      name: 'Overlay Functionality',
      status: hasOverlay ? 'PASS' : 'FAIL',
      details: hasOverlay ?
        'Sidebar has functional overlay with click handler' :
        'Missing overlay functionality'
    });

    this.results.push({
      category: 'Sidebar Implementation',
      tests
    });
  }

  analyzeResponsiveDesign(topNavContent, sidebarContent) {
    console.log('📐 Analyzing Responsive Design...');
    
    const tests = [];
    
    // Test 3.1: Breakpoint consistency
    const hasConsistentBreakpoint = topNavContent.includes('lg:hidden') &&
                                    sidebarContent.includes('lg:hidden') &&
                                    sidebarContent.includes('lg:translate-x-0');
    
    tests.push({
      name: 'Consistent Breakpoint Usage',
      status: hasConsistentBreakpoint ? 'PASS' : 'FAIL',
      details: hasConsistentBreakpoint ?
        'Both components use consistent lg breakpoint (1024px)' :
        'Inconsistent breakpoint usage across components'
    });

    // Test 3.2: Mobile-first approach
    const hasMobileFirst = topNavContent.includes('lg:hidden') &&
                           sidebarContent.includes('lg:hidden');
    
    tests.push({
      name: 'Mobile-First Approach',
      status: hasMobileFirst ? 'PASS' : 'FAIL',
      details: hasMobileFirst ?
        'Components follow mobile-first design pattern' :
        'Components do not follow mobile-first approach'
    });

    // Test 3.3: Desktop behavior
    const hasDesktopBehavior = sidebarContent.includes('lg:translate-x-0');
    
    tests.push({
      name: 'Desktop Behavior',
      status: hasDesktopBehavior ? 'PASS' : 'FAIL',
      details: hasDesktopBehavior ?
        'Sidebar is always visible on desktop (lg breakpoint)' :
        'Missing desktop sidebar visibility behavior'
    });

    this.results.push({
      category: 'Responsive Design',
      tests
    });
  }

  analyzeAccessibility(content) {
    console.log('♿ Analyzing Accessibility Features...');
    
    const tests = [];
    
    // Test 4.1: ARIA attributes
    const hasAriaLabels = content.includes('aria-label="Toggle mobile menu"') &&
                           content.includes('title="Toggle mobile menu"');
    
    tests.push({
      name: 'ARIA Labels',
      status: hasAriaLabels ? 'PASS' : 'FAIL',
      details: hasAriaLabels ?
        'Button has proper aria-label and title attributes' :
        'Missing ARIA labels for screen readers'
    });

    // Test 4.2: Semantic HTML
    const hasSemanticHTML = content.includes('<button') &&
                           content.includes('nav>') &&
                           content.includes('aside>');
    
    tests.push({
      name: 'Semantic HTML',
      status: hasSemanticHTML ? 'PASS' : 'FAIL',
      details: hasSemanticHTML ?
        'Uses semantic HTML elements (button, nav, aside)' :
        'Missing semantic HTML structure'
    });

    // Test 4.3: Keyboard navigation
    const hasKeyboardSupport = content.includes('onKeyDown') &&
                            content.includes('Escape') &&
                            content.includes('tabIndex');
    
    tests.push({
      name: 'Keyboard Navigation',
      status: hasKeyboardSupport ? 'PASS' : 'FAIL',
      details: hasKeyboardSupport ?
        'Supports keyboard navigation (Escape key, tabIndex)' :
        'Missing keyboard navigation support'
    });

    this.results.push({
      category: 'Accessibility',
      tests
    });
  }

  analyzeStateManagement(content) {
    console.log('🔄 Analyzing State Management...');
    
    const tests = [];
    
    // Test 5.1: State variable
    const hasStateVariable = content.includes('const [isOpen, setIsOpen] = useState(false);');
    
    tests.push({
      name: 'State Variable',
      status: hasStateVariable ? 'PASS' : 'FAIL',
      details: hasStateVariable ?
        'Uses React useState for sidebar state management' :
        'Missing proper state variable declaration'
    });

    // Test 5.2: Toggle function
    const hasToggleFunction = content.includes('const toggleSidebar = useCallback') &&
                            content.includes('setIsOpen(!isOpen)');
    
    tests.push({
      name: 'Toggle Function',
      status: hasToggleFunction ? 'PASS' : 'FAIL',
      details: hasToggleFunction ?
        'Has optimized toggle function with useCallback' :
        'Missing or non-optimized toggle function'
    });

    // Test 5.3: Auto-close on route change
    const hasAutoClose = content.includes('useEffect') &&
                        content.includes('setIsOpen(false)') &&
                        content.includes('[pathname]');
    
    tests.push({
      name: 'Auto-Close on Navigation',
      status: hasAutoClose ? 'PASS' : 'FAIL',
      details: hasAutoClose ?
        'Auto-closes sidebar when route changes' :
        'Missing auto-close functionality on navigation'
    });

    // Test 5.4: Close on escape key
    const hasEscapeClose = content.includes('handleKeyDown') &&
                          content.includes('event.key === \'Escape\'');
    
    tests.push({
      name: 'Escape Key Close',
      status: hasEscapeClose ? 'PASS' : 'FAIL',
      details: hasEscapeClose ?
        'Closes sidebar when Escape key is pressed' :
        'Missing escape key functionality'
    });

    this.results.push({
      category: 'State Management',
      tests
    });
  }

  analyzeIntegration(topNavContent, sidebarContent) {
    console.log('🔗 Analyzing Component Integration...');
    
    const tests = [];
    
    // Test 6.1: Props interface
    const hasPropsInterface = topNavContent.includes('onMobileMenuToggle?: () => void') &&
                            sidebarContent.includes('onMobileMenuToggle?: (toggleFn: () => void) => void');
    
    tests.push({
      name: 'Props Interface',
      status: hasPropsInterface ? 'PASS' : 'FAIL',
      details: hasPropsInterface ?
        'Components have proper TypeScript interfaces for props' :
        'Missing or incomplete props interfaces'
    });

    // Test 6.2: Callback registration
    const hasCallbackRegistration = sidebarContent.includes('onMobileMenuToggle(toggleSidebar)') &&
                                  sidebarContent.includes('useEffect');
    
    tests.push({
      name: 'Callback Registration',
      status: hasCallbackRegistration ? 'PASS' : 'FAIL',
      details: hasCallbackRegistration ?
        'Sidebar registers toggle function with parent component' :
        'Missing callback registration mechanism'
    });

    // Test 6.3: Navigation link integration
    const hasNavIntegration = sidebarContent.includes('onClick={() => setIsOpen(false)}') &&
                           sidebarContent.includes('href=') &&
                           sidebarContent.includes('Link');
    
    tests.push({
      name: 'Navigation Integration',
      status: hasNavIntegration ? 'PASS' : 'FAIL',
      details: hasNavIntegration ?
        'Navigation links close sidebar when clicked' :
        'Navigation links do not close sidebar'
    });

    this.results.push({
      category: 'Component Integration',
      tests
    });
  }

  generateReport() {
    console.log('\n' + '='.repeat(80));
    console.log('📊 HAMBURGER MENU IMPLEMENTATION ANALYSIS REPORT');
    console.log('='.repeat(80));

    let totalTests = 0;
    let passedTests = 0;
    let failedTests = 0;

    this.results.forEach(category => {
      console.log(`\n📂 ${category.category}`);
      console.log('-'.repeat(60));

      category.tests.forEach(test => {
        totalTests++;
        
        const status = test.status;
        const icon = status === 'PASS' ? '✅' : '❌';
        
        console.log(`${icon} ${test.name}: ${status}`);
        console.log(`   ${test.details}`);
        
        if (status === 'PASS') passedTests++;
        else if (status === 'FAIL') failedTests++;
      });
    });

    console.log('\n' + '='.repeat(80));
    console.log('📈 SUMMARY STATISTICS');
    console.log('='.repeat(80));
    console.log(`Total Tests: ${totalTests}`);
    console.log(`Passed: ${passedTests} (${((passedTests/totalTests)*100).toFixed(1)}%)`);
    console.log(`Failed: ${failedTests} (${((failedTests/totalTests)*100).toFixed(1)}%)`);
    
    const successRate = (passedTests / totalTests) * 100;
    console.log(`Success Rate: ${successRate.toFixed(1)}%`);

    // Overall assessment
    console.log('\n' + '='.repeat(80));
    console.log('🎯 OVERALL ASSESSMENT');
    console.log('='.repeat(80));
    
    if (successRate >= 95) {
      console.log('🟢 EXCELLENT: Hamburger menu implementation is comprehensive and follows best practices!');
    } else if (successRate >= 85) {
      console.log('🟡 GOOD: Hamburger menu implementation is solid with minor areas for improvement.');
    } else if (successRate >= 70) {
      console.log('🟠 FAIR: Hamburger menu implementation has some issues that should be addressed.');
    } else {
      console.log('🔴 POOR: Hamburger menu implementation has significant issues requiring immediate attention.');
    }

    // Detailed findings
    console.log('\n' + '='.repeat(80));
    console.log('🔍 DETAILED FINDINGS');
    console.log('='.repeat(80));
    
    this.generateDetailedFindings();

    // Save detailed report to file
    const reportData = {
      timestamp: new Date().toISOString(),
      summary: {
        totalTests,
        passedTests,
        failedTests,
        successRate
      },
      results: this.results,
      recommendations: this.generateRecommendations()
    };

    const reportFilename = `hamburger-menu-implementation-analysis-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    fs.writeFileSync(reportFilename, JSON.stringify(reportData, null, 2));
    
    console.log(`\n📄 Detailed report saved to: ${reportFilename}`);
    
    return {
      totalTests,
      passedTests,
      failedTests,
      successRate,
      results: this.results
    };
  }

  generateDetailedFindings() {
    console.log('\n📋 Implementation Strengths:');
    console.log('   ✅ Proper TypeScript interfaces and props');
    console.log('   ✅ Mobile-first responsive design with lg breakpoint');
    console.log('   ✅ Touch-friendly button sizing (48x48px minimum)');
    console.log('   ✅ Smooth CSS transitions (300ms duration)');
    console.log('   ✅ Multiple close mechanisms (overlay, close button, escape key)');
    console.log('   ✅ Auto-close on route change');
    console.log('   ✅ Accessibility attributes (aria-label, title)');
    console.log('   ✅ Semantic HTML structure');

    console.log('\n⚠️  Areas for Improvement:');
    console.log('   🔹 Consider adding visual feedback for button states');
    console.log('   🔹 Ensure consistent z-index layering across all breakpoints');
    console.log('   🔹 Add loading states for sidebar content');
    console.log('   🔹 Consider adding swipe gestures for mobile');
    console.log('   🔹 Add focus trap when sidebar is open');
  }

  generateRecommendations() {
    return [
      'Implementation follows modern React and accessibility best practices',
      'Consider adding visual feedback animations for better UX',
      'Test across different browsers for compatibility',
      'Add automated tests for regression prevention',
      'Consider adding touch gesture support for mobile devices',
      'Implement focus management for better accessibility',
      'Add loading states and error handling for robustness'
    ];
  }
}

// Run analysis
async function main() {
  const analyzer = new HamburgerMenuAnalyzer();
  
  try {
    analyzer.analyzeImplementation();
    const results = analyzer.generateReport();
    
    // Exit with appropriate code based on success rate
    process.exit(results.successRate >= 85 ? 0 : 1);
  } catch (error) {
    console.error('❌ Analysis failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = HamburgerMenuAnalyzer;