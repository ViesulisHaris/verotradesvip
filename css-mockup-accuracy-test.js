/**
 * CSS-BASED MOCKUP ACCURACY TEST
 * 
 * Analyzes CSS files and component implementations for 1:1 mockup accuracy
 * Tests against exact design specifications without requiring browser automation
 * 
 * CRITICAL: This test validates exact compliance with mockup specifications
 * NO approximations or assumptions allowed
 */

const fs = require('fs');
const path = require('path');

// Mockup Specifications - EXACT VALUES FROM COMPREHENSIVE_MOCKUP_DESIGN_SPECIFICATIONS.md
const MOCKUP_SPECS = {
  colors: {
    deepCharcoal: '#121212',           // Main application background
    softGraphite: '#202020',           // Card/panel backgrounds
    warmOffWhite: '#EAE6DD',         // Primary text color
    mutedGray: '#9A9A9A',             // Secondary text, subtitles
    dustyGold: '#B89B5E',             // Primary accent, PnL positive
    warmSand: '#D6C7B2',               // Secondary accent, highlights
    mutedOlive: '#4F5B4A',            // Tertiary accent, medium states
    rustRed: '#A7352D',                 // Error/alert states, negative PnL
    softOliveHighlight: '#6A7661',     // Soft olive highlights
    dustyGoldHover: '#9B8049',         // Dusty gold hover state
    borderPrimary: 'rgba(184, 155, 94, 0.3)',
    borderHover: 'rgba(184, 155, 94, 0.5)',
    borderFocus: 'rgba(184, 155, 94, 0.8)'
  },
  
  typography: {
    h1: { size: '32px', weight: '600' },      // Dashboard titles
    h2: { size: '24px', weight: '600' },      // Section headers
    h3: { size: '20px', weight: '600' },      // Subsection headers
    cardTitle: { size: '18px', weight: '500' }, // Card titles
    metric: { size: '24px', weight: '600' },    // Metric values
    body: { size: '14px', weight: '400' },      // Body text
    label: { size: '13px', weight: '400' },      // Labels
    small: { size: '12px', weight: '400' }       // Small text
  },
  
  spacing: {
    section: '32px',        // Between major sections
    card: '16px',          // Between cards
    cardInner: '20px',      // Internal card padding
    dashboardTitle: '40px',  // Dashboard title padding
    component: '12px',      // Between components
    element: '8px',         // Between elements
    tight: '4px',           // Between related items
    formGroup: '16px',      // Between form groups
    buttonGroup: '8px',     // Between buttons
    inputLabel: '8px'       // Between input and label
  },
  
  borderRadius: {
    card: '12px',          // CRITICAL: Exactly 12px, not 16px
    button: '8px',          // Buttons
    input: '8px',          // Input fields
    modal: '12px',          // Modals
    small: '6px'            // Small elements
  },
  
  layout: {
    containerMaxWidth: '1200px',
    sidebarWidth: '256px',   // EXACT: 16rem = 256px
    navHeight: '64px',
    grids: {
      keyMetrics: { columns: 4, gap: '16px' },
      performance: { columns: 3, gap: '16px' },
      charts: { columns: 2, gap: '16px' },
      bottom: { columns: 2, gap: '16px' }
    }
  }
};

// Test Results Storage
const testResults = {
  summary: {
    totalTests: 0,
    passedTests: 0,
    failedTests: 0,
    criticalFailures: 0
  },
  files: {
    designSystem: { tests: [], passed: 0, failed: 0, critical: 0 },
    dashboard: { tests: [], passed: 0, failed: 0, critical: 0 },
    trades: { tests: [], passed: 0, failed: 0, critical: 0 },
    strategies: { tests: [], passed: 0, failed: 0, critical: 0 },
    login: { tests: [], passed: 0, failed: 0, critical: 0 },
    register: { tests: [], passed: 0, failed: 0, critical: 0 }
  },
  details: []
};

/**
 * UTILITY FUNCTIONS
 */

// Add test result
function addTestResult(file, category, test, expected, actual, passed, critical = false) {
  const result = {
    file,
    category,
    test,
    expected,
    actual,
    passed,
    critical,
    timestamp: new Date().toISOString()
  };
  
  testResults.details.push(result);
  testResults.files[file].tests.push(result);
  
  testResults.summary.totalTests++;
  if (passed) {
    testResults.summary.passedTests++;
    testResults.files[file].passed++;
  } else {
    testResults.summary.failedTests++;
    testResults.files[file].failed++;
    if (critical) {
      testResults.summary.criticalFailures++;
      testResults.files[file].critical++;
    }
  }
}

// Extract CSS values from content
function extractCSSValues(cssContent, selector) {
  const regex = new RegExp(`${selector}\\s*\\{[^}]*\\}`, 'gi');
  const matches = cssContent.match(regex);
  if (!matches) return null;
  
  const match = matches[0];
  const values = {};
  
  // Extract specific properties
  const colorRegex = /color:\s*([^;]+)/gi;
  const bgRegex = /background(-color)?:\s*([^;]+)/gi;
  const fontSizeRegex = /font-size:\s*([^;]+)/gi;
  const fontWeightRegex = /font-weight:\s*([^;]+)/gi;
  const borderRadiusRegex = /border-radius:\s*([^;]+)/gi;
  const paddingRegex = /padding:\s*([^;]+)/gi;
  const marginRegex = /margin:\s*([^;]+)/gi;
  
  const colorMatch = match.match(colorRegex);
  if (colorMatch) values.color = colorMatch[1].trim();
  
  const bgMatch = match.match(bgRegex);
  if (bgMatch) values.background = bgMatch[1].trim();
  
  const fontSizeMatch = match.match(fontSizeRegex);
  if (fontSizeMatch) values.fontSize = fontSizeMatch[1].trim();
  
  const fontWeightMatch = match.match(fontWeightRegex);
  if (fontWeightMatch) values.fontWeight = fontWeightMatch[1].trim();
  
  const borderRadiusMatch = match.match(borderRadiusRegex);
  if (borderRadiusMatch) values.borderRadius = borderRadiusMatch[1].trim();
  
  const paddingMatch = match.match(paddingRegex);
  if (paddingMatch) values.padding = paddingMatch[1].trim();
  
  const marginMatch = match.match(marginRegex);
  if (marginMatch) values.margin = marginMatch[1].trim();
  
  return values;
}

// Test design system CSS file
function testDesignSystemCSS() {
  console.log('🎨 Testing design system CSS file...');
  
  try {
    const cssPath = path.join(__dirname, 'src/styles/verotrade-design-system.css');
    const cssContent = fs.readFileSync(cssPath, 'utf8');
    
    // Test color variables
    const deepCharcoalMatch = cssContent.match(/--deep-charcoal:\s*([^;]+)/);
    if (deepCharcoalMatch) {
      addTestResult(
        'designSystem', 'Color', 'Deep Charcoal Variable',
        MOCKUP_SPECS.colors.deepCharcoal,
        deepCharcoalMatch[1].trim(),
        deepCharcoalMatch[1].trim() === MOCKUP_SPECS.colors.deepCharcoal,
        true // Critical
      );
    }
    
    const softGraphiteMatch = cssContent.match(/--soft-graphite:\s*([^;]+)/);
    if (softGraphiteMatch) {
      addTestResult(
        'designSystem', 'Color', 'Soft Graphite Variable',
        MOCKUP_SPECS.colors.softGraphite,
        softGraphiteMatch[1].trim(),
        softGraphiteMatch[1].trim() === MOCKUP_SPECS.colors.softGraphite,
        true // Critical
      );
    }
    
    const dustyGoldMatch = cssContent.match(/--dusty-gold:\s*([^;]+)/);
    if (dustyGoldMatch) {
      addTestResult(
        'designSystem', 'Color', 'Dusty Gold Variable',
        MOCKUP_SPECS.colors.dustyGold,
        dustyGoldMatch[1].trim(),
        dustyGoldMatch[1].trim() === MOCKUP_SPECS.colors.dustyGold,
        true // Critical
      );
    }
    
    // Test border radius variable (CRITICAL)
    const cardRadiusMatch = cssContent.match(/--radius-card:\s*([^;]+)/);
    if (cardRadiusMatch) {
      const expectedRadius = MOCKUP_SPECS.borderRadius.card;
      const actualRadius = cardRadiusMatch[1].trim();
      const radiusMatch = actualRadius.includes(expectedRadius.replace('px', ''));
      
      addTestResult(
        'designSystem', 'Border Radius', 'Card Border Radius Variable',
        expectedRadius,
        actualRadius,
        radiusMatch,
        true // CRITICAL - MUST be 12px, not 16px
      );
    }
    
    // Test spacing variables
    const sectionSpacingMatch = cssContent.match(/--spacing-section:\s*([^;]+)/);
    if (sectionSpacingMatch) {
      addTestResult(
        'designSystem', 'Spacing', 'Section Spacing Variable',
        MOCKUP_SPECS.spacing.section,
        sectionSpacingMatch[1].trim(),
        sectionSpacingMatch[1].trim() === MOCKUP_SPECS.spacing.section,
        false
      );
    }
    
    const cardSpacingMatch = cssContent.match(/--spacing-card:\s*([^;]+)/);
    if (cardSpacingMatch) {
      addTestResult(
        'designSystem', 'Spacing', 'Card Spacing Variable',
        MOCKUP_SPECS.spacing.card,
        cardSpacingMatch[1].trim(),
        cardSpacingMatch[1].trim() === MOCKUP_SPECS.spacing.card,
        true // Critical
      );
    }
    
    // Test typography variables
    const h1SizeMatch = cssContent.match(/--text-h1:\s*([^;]+)/);
    if (h1SizeMatch) {
      addTestResult(
        'designSystem', 'Typography', 'H1 Font Size Variable',
        MOCKUP_SPECS.typography.h1.size,
        h1SizeMatch[1].trim(),
        h1SizeMatch[1].trim() === MOCKUP_SPECS.typography.h1.size,
        true // Critical
      );
    }
    
    const h1WeightMatch = cssContent.match(/--font-weight-h1:\s*([^;]+)/);
    if (h1WeightMatch) {
      addTestResult(
        'designSystem', 'Typography', 'H1 Font Weight Variable',
        MOCKUP_SPECS.typography.h1.weight,
        h1WeightMatch[1].trim(),
        h1WeightMatch[1].trim() === MOCKUP_SPECS.typography.h1.weight,
        true // Critical
      );
    }
    
    console.log('✅ Design system CSS analysis complete');
    
  } catch (error) {
    console.error('❌ Error reading design system CSS:', error);
    addTestResult(
      'designSystem', 'File Access', 'Design System CSS Readable',
      'Success',
      `Error: ${error.message}`,
      false,
      true // Critical
    );
  }
}

// Test component implementations
function testComponentImplementation(filePath, fileName, pageName) {
  console.log(`🔍 Testing ${fileName} component implementation...`);
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Test for hardcoded colors (should use CSS variables)
    const hardcodedColors = content.match(/#[0-9A-Fa-f]{6}/gi) || [];
    const hasHardcodedColors = hardcodedColors.length > 0;
    
    addTestResult(
      pageName, 'Implementation', 'Uses CSS Variables (Not Hardcoded Colors)',
      'No hardcoded colors',
      hasHardcodedColors ? `Found ${hardcodedColors.length} hardcoded colors` : 'No hardcoded colors found',
      !hasHardcodedColors,
      false
    );
    
    // Test for hardcoded spacing (should use CSS variables)
    const hardcodedSpacing = content.match(/(padding|margin):\s*\d+px/gi) || [];
    const hasHardcodedSpacing = hardcodedSpacing.length > 0;
    
    addTestResult(
      pageName, 'Implementation', 'Uses CSS Variables (Not Hardcoded Spacing)',
      'No hardcoded spacing',
      hasHardcodedSpacing ? `Found ${hardcodedSpacing.length} hardcoded spacing values` : 'No hardcoded spacing found',
      !hasHardcodedSpacing,
      false
    );
    
    // Test for incorrect border radius (16px instead of 12px)
    const hasIncorrectBorderRadius = content.includes('16px') && 
                                   (content.includes('border-radius') || content.includes('rounded'));
    
    addTestResult(
      pageName, 'Border Radius', 'No 16px Border Radius (Should be 12px)',
      'No 16px border radius',
      hasIncorrectBorderRadius ? 'Found 16px border radius - should be 12px' : 'No 16px border radius found',
      !hasIncorrectBorderRadius,
      true // Critical
    );
    
    // Test for correct class usage
    const usesCorrectClasses = content.includes('dashboard-card') &&
                              content.includes('h1-dashboard') &&
                              content.includes('body-text');
    
    addTestResult(
      pageName, 'Implementation', 'Uses Correct CSS Classes',
      'Uses design system classes',
      usesCorrectClasses ? 'Uses correct classes' : 'Missing correct class usage',
      usesCorrectClasses,
      false
    );
    
    // Test for Inter font family
    const hasInterFont = content.includes('Inter') || content.includes('font-family-primary');
    
    addTestResult(
      pageName, 'Typography', 'Uses Inter Font Family',
      'Inter font family',
      hasInterFont ? 'Uses Inter font' : 'Missing Inter font',
      hasInterFont,
      true // Critical
    );
    
    console.log(`✅ ${fileName} analysis complete`);
    
  } catch (error) {
    console.error(`❌ Error reading ${fileName}:`, error);
    addTestResult(
      pageName, 'File Access', `${fileName} Readable`,
      'Success',
      `Error: ${error.message}`,
      false,
      true // Critical
    );
  }
}

// Generate comprehensive report
function generateReport() {
  const report = {
    timestamp: new Date().toISOString(),
    summary: testResults.summary,
    files: testResults.files,
    details: testResults.details,
    recommendations: []
  };
  
  // Calculate accuracy percentages
  Object.keys(testResults.files).forEach(fileName => {
    const file = testResults.files[fileName];
    const total = file.passed + file.failed;
    file.accuracy = total > 0 ? ((file.passed / total) * 100).toFixed(2) + '%' : '0%';
    file.criticalAccuracy = total > 0 ? (((total - file.critical) / total) * 100).toFixed(2) + '%' : '0%';
  });
  
  // Generate recommendations
  if (testResults.summary.criticalFailures > 0) {
    report.recommendations.push('CRITICAL: Fix critical failures immediately - these affect core mockup compliance');
  }
  
  // Find common failure patterns
  const colorFailures = testResults.details.filter(t => t.category === 'Color' && !t.passed);
  if (colorFailures.length > 0) {
    report.recommendations.push('Review color system implementation - multiple color inaccuracies detected');
  }
  
  const typographyFailures = testResults.details.filter(t => t.category === 'Typography' && !t.passed);
  if (typographyFailures.length > 0) {
    report.recommendations.push('Review typography system - multiple font size/weight inaccuracies detected');
  }
  
  const spacingFailures = testResults.details.filter(t => t.category === 'Spacing' && !t.passed);
  if (spacingFailures.length > 0) {
    report.recommendations.push('Review spacing system - multiple spacing inaccuracies detected');
  }
  
  const borderFailures = testResults.details.filter(t => t.category === 'Border Radius' && !t.passed);
  if (borderFailures.length > 0) {
    report.recommendations.push('CRITICAL: Review border radius - ensure 12px for cards (not 16px)');
  }
  
  // Save report
  const reportPath = path.join(__dirname, `CSS_MOCKUP_ACCURACY_TEST_REPORT-${Date.now()}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  // Generate markdown report
  const markdownReport = generateMarkdownReport(report);
  const markdownPath = path.join(__dirname, `CSS_MOCKUP_ACCURACY_TEST_REPORT-${Date.now()}.md`);
  fs.writeFileSync(markdownPath, markdownReport);
  
  console.log(`\n📊 Report saved to: ${reportPath}`);
  console.log(`📝 Markdown report saved to: ${markdownPath}`);
  
  return { reportPath, markdownPath };
}

// Generate markdown report
function generateMarkdownReport(report) {
  let markdown = `# CSS-Based Mockup Accuracy Test Report\n\n`;
  markdown += `**Generated**: ${new Date(report.timestamp).toLocaleString()}\n\n`;
  markdown += `**Methodology**: Static CSS and component analysis for exact mockup compliance\n\n`;
  
  // Summary
  markdown += `## Executive Summary\n\n`;
  markdown += `- **Total Tests**: ${report.summary.totalTests}\n`;
  markdown += `- **Passed**: ${report.summary.passedTests}\n`;
  markdown += `- **Failed**: ${report.summary.failedTests}\n`;
  markdown += `- **Critical Failures**: ${report.summary.criticalFailures}\n`;
  markdown += `- **Overall Accuracy**: ${((report.summary.passedTests / report.summary.totalTests) * 100).toFixed(2)}%\n\n`;
  
  // File summaries
  markdown += `## File Results\n\n`;
  Object.keys(report.files).forEach(fileName => {
    const file = report.files[fileName];
    if (file.tests.length === 0) return;
    
    markdown += `### ${fileName.charAt(0).toUpperCase() + fileName.slice(1)}\n\n`;
    markdown += `- **Tests**: ${file.tests.length}\n`;
    markdown += `- **Passed**: ${file.passed}\n`;
    markdown += `- **Failed**: ${file.failed}\n`;
    markdown += `- **Critical Failures**: ${file.critical}\n`;
    markdown += `- **Accuracy**: ${file.accuracy}\n`;
    markdown += `- **Critical Accuracy**: ${file.criticalAccuracy}\n\n`;
  });
  
  // Critical failures
  const criticalFailures = report.details.filter(t => t.critical && !t.passed);
  if (criticalFailures.length > 0) {
    markdown += `## 🚨 CRITICAL FAILURES\n\n`;
    criticalFailures.forEach(failure => {
      markdown += `### ${failure.file} - ${failure.category}: ${failure.test}\n\n`;
      markdown += `- **Expected**: ${failure.expected}\n`;
      markdown += `- **Actual**: ${failure.actual}\n`;
      markdown += `- **Impact**: ${failure.critical ? 'CRITICAL' : 'Minor'}\n\n`;
    });
  }
  
  // All failures
  const allFailures = report.details.filter(t => !t.passed);
  if (allFailures.length > 0) {
    markdown += `## All Failures\n\n`;
    allFailures.forEach(failure => {
      markdown += `### ${failure.file} - ${failure.category}: ${failure.test}\n\n`;
      markdown += `- **Expected**: ${failure.expected}\n`;
      markdown += `- **Actual**: ${failure.actual}\n`;
      markdown += `- **Critical**: ${failure.critical ? 'Yes' : 'No'}\n\n`;
    });
  }
  
  // Recommendations
  if (report.recommendations.length > 0) {
    markdown += `## Recommendations\n\n`;
    report.recommendations.forEach(rec => {
      markdown += `- ${rec}\n`;
    });
    markdown += `\n`;
  }
  
  // Conclusion
  markdown += `## Conclusion\n\n`;
  if (report.summary.criticalFailures === 0) {
    markdown += `✅ **PASS**: No critical failures detected. Implementation meets mockup specifications.\n\n`;
  } else {
    markdown += `❌ **FAIL**: ${report.summary.criticalFailures} critical failures detected. Immediate fixes required.\n\n`;
  }
  
  return markdown;
}

// Main execution function
async function runCSSMockupAccuracyTest() {
  console.log('🎯 STARTING CSS-BASED MOCKUP ACCURACY TEST');
  console.log('='.repeat(60));
  console.log('Testing CSS files and components against EXACT mockup specifications...');
  console.log('NO approximations or assumptions allowed\n');
  
  // Test design system
  testDesignSystemCSS();
  
  // Test component files
  const componentTests = [
    { path: 'src/app/dashboard/page.tsx', name: 'dashboard', pageName: 'dashboard' },
    { path: 'src/app/trades/page.tsx', name: 'trades', pageName: 'trades' },
    { path: 'src/app/strategies/page.tsx', name: 'strategies', pageName: 'strategies' },
    { path: 'src/app/(auth)/login/page.tsx', name: 'login', pageName: 'login' },
    { path: 'src/app/(auth)/register/page.tsx', name: 'register', pageName: 'register' }
  ];
  
  for (const test of componentTests) {
    const fullPath = path.join(__dirname, test.path);
    if (fs.existsSync(fullPath)) {
      testComponentImplementation(fullPath, test.name, test.pageName);
    } else {
      console.warn(`⚠️  File not found: ${test.path}`);
      addTestResult(
        test.pageName, 'File Access', `${test.name} File Exists`,
        'File exists',
        'File not found',
        false,
        true // Critical
      );
    }
  }
  
  // Generate final report
  console.log('\n' + '='.repeat(60));
  console.log('📊 GENERATING COMPREHENSIVE REPORT...');
  
  const { reportPath, markdownPath } = generateReport();
  
  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('🎯 CSS-BASED MOCKUP ACCURACY TEST COMPLETE');
  console.log('='.repeat(60));
  console.log(`📊 Total Tests: ${testResults.summary.totalTests}`);
  console.log(`✅ Passed: ${testResults.summary.passedTests}`);
  console.log(`❌ Failed: ${testResults.summary.failedTests}`);
  console.log(`🚨 Critical: ${testResults.summary.criticalFailures}`);
  console.log(`📈 Overall Accuracy: ${((testResults.summary.passedTests / testResults.summary.totalTests) * 100).toFixed(2)}%`);
  
  if (testResults.summary.criticalFailures === 0) {
    console.log('\n🎉 SUCCESS: Implementation meets mockup specifications!');
  } else {
    console.log('\n⚠️  WARNING: Critical failures detected - review required!');
  }
  
  console.log(`\n📄 Detailed Report: ${markdownPath}`);
  console.log(`📊 JSON Data: ${reportPath}`);
  
  return testResults;
}

// Run if called directly
if (require.main === module) {
  runCSSMockupAccuracyTest().catch(console.error);
}

module.exports = {
  runCSSMockupAccuracyTest,
  testDesignSystemCSS,
  testComponentImplementation,
  generateReport,
  MOCKUP_SPECS
};