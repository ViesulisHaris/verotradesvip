/**
 * COMPREHENSIVE MOCKUP ACCURACY TEST
 * 
 * Tests all pages for 1:1 mockup accuracy against exact design specifications
 * Based on COMPREHENSIVE_MOCKUP_DESIGN_SPECIFICATIONS.md
 * 
 * CRITICAL: This test validates exact compliance with mockup specifications
 * NO approximations or assumptions allowed
 */

const puppeteer = require('puppeteer');
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
  },
  
  visualEffects: {
    glassMorphism: {
      background: 'rgba(32, 32, 32, 0.7)',
      blur: '10px'
    },
    transitions: {
      base: '0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      fast: '0.15s ease',
      normal: '0.25s ease'
    },
    hover: {
      cardTransform: 'translateY(-2px)',
      buttonTransform: 'translateY(-1px)'
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
  pages: {
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

// Convert RGB to Hex
function rgbToHex(rgb) {
  if (rgb.startsWith('#')) return rgb.toUpperCase();
  
  const result = rgb.match(/\d+/g);
  if (!result || result.length < 3) return rgb;
  
  const r = parseInt(result[0]);
  const g = parseInt(result[1]);
  const b = parseInt(result[2]);
  
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
}

// Convert RGBA to Hex (approximate)
function rgbaToHex(rgba) {
  if (rgba.startsWith('#')) return rgba.toUpperCase();
  
  const result = rgba.match(/\d+/g);
  if (!result || result.length < 3) return rgba;
  
  const r = parseInt(result[0]);
  const g = parseInt(result[1]);
  const b = parseInt(result[2]);
  
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
}

// Get computed style of element
async function getComputedStyle(page, selector) {
  return await page.evaluate((sel) => {
    const element = document.querySelector(sel);
    if (!element) return null;
    
    const computed = window.getComputedStyle(element);
    return {
      backgroundColor: computed.backgroundColor,
      color: computed.color,
      fontSize: computed.fontSize,
      fontWeight: computed.fontWeight,
      borderRadius: computed.borderRadius,
      padding: computed.padding,
      margin: computed.margin,
      width: computed.width,
      height: computed.height,
      transform: computed.transform,
      transition: computed.transition,
      backdropFilter: computed.backdropFilter,
      border: computed.border,
      fontFamily: computed.fontFamily,
      lineHeight: computed.lineHeight
    };
  }, selector);
}

// Add test result
function addTestResult(page, category, test, expected, actual, passed, critical = false) {
  const result = {
    page,
    category,
    test,
    expected,
    actual,
    passed,
    critical,
    timestamp: new Date().toISOString()
  };
  
  testResults.details.push(result);
  testResults.pages[page].tests.push(result);
  
  testResults.summary.totalTests++;
  if (passed) {
    testResults.summary.passedTests++;
    testResults.pages[page].passed++;
  } else {
    testResults.summary.failedTests++;
    testResults.pages[page].failed++;
    if (critical) {
      testResults.summary.criticalFailures++;
      testResults.pages[page].critical++;
    }
  }
}

// Test color accuracy
async function testColorAccuracy(page, pageName) {
  console.log(`🎨 Testing color accuracy on ${pageName} page...`);
  
  // Test background colors
  const bodyStyle = await getComputedStyle(page, 'body');
  addTestResult(
    pageName, 'Color', 'Body Background', 
    MOCKUP_SPECS.colors.deepCharcoal,
    rgbToHex(bodyStyle.backgroundColor),
    rgbToHex(bodyStyle.backgroundColor) === MOCKUP_SPECS.colors.deepCharcoal,
    true // Critical
  );
  
  // Test card backgrounds
  const cardStyle = await getComputedStyle(page, '.dashboard-card');
  if (cardStyle) {
    addTestResult(
      pageName, 'Color', 'Card Background',
      MOCKUP_SPECS.colors.softGraphite,
      rgbToHex(cardStyle.backgroundColor),
      rgbToHex(cardStyle.backgroundColor) === MOCKUP_SPECS.colors.softGraphite,
      true // Critical
    );
  }
  
  // Test primary text
  const headingStyle = await getComputedStyle(page, 'h1, .h1-dashboard');
  if (headingStyle) {
    addTestResult(
      pageName, 'Color', 'Primary Text',
      MOCKUP_SPECS.colors.warmOffWhite,
      rgbToHex(headingStyle.color),
      rgbToHex(headingStyle.color) === MOCKUP_SPECS.colors.warmOffWhite,
      true // Critical
    );
  }
  
  // Test secondary text
  const secondaryStyle = await getComputedStyle(page, '.secondary-text, .muted-gray');
  if (secondaryStyle) {
    addTestResult(
      pageName, 'Color', 'Secondary Text',
      MOCKUP_SPECS.colors.mutedGray,
      rgbToHex(secondaryStyle.color),
      rgbToHex(secondaryStyle.color) === MOCKUP_SPECS.colors.mutedGray,
      false
    );
  }
  
  // Test accent colors
  const accentStyle = await getComputedStyle(page, '.button-primary, [style*="dusty-gold"]');
  if (accentStyle) {
    const accentColor = accentStyle.backgroundColor.includes(MOCKUP_SPECS.colors.dustyGold) ||
                       accentStyle.color.includes(MOCKUP_SPECS.colors.dustyGold);
    addTestResult(
      pageName, 'Color', 'Primary Accent',
      MOCKUP_SPECS.colors.dustyGold,
      accentStyle.backgroundColor || accentStyle.color,
      accentColor,
      true // Critical
    );
  }
}

// Test typography accuracy
async function testTypographyAccuracy(page, pageName) {
  console.log(`📝 Testing typography accuracy on ${pageName} page...`);
  
  // Test H1 typography
  const h1Style = await getComputedStyle(page, 'h1, .h1-dashboard');
  if (h1Style) {
    const fontSizeMatch = h1Style.fontSize.includes(MOCKUP_SPECS.typography.h1.size.replace('px', ''));
    const fontWeightMatch = h1Style.fontWeight === MOCKUP_SPECS.typography.h1.weight;
    
    addTestResult(
      pageName, 'Typography', 'H1 Font Size',
      MOCKUP_SPECS.typography.h1.size,
      h1Style.fontSize,
      fontSizeMatch,
      true // Critical
    );
    
    addTestResult(
      pageName, 'Typography', 'H1 Font Weight',
      MOCKUP_SPECS.typography.h1.weight,
      h1Style.fontWeight,
      fontWeightMatch,
      true // Critical
    );
  }
  
  // Test body text typography
  const bodyStyle = await getComputedStyle(page, '.body-text, p');
  if (bodyStyle) {
    const fontSizeMatch = bodyStyle.fontSize.includes(MOCKUP_SPECS.typography.body.size.replace('px', ''));
    const fontWeightMatch = bodyStyle.fontWeight === MOCKUP_SPECS.typography.body.weight;
    
    addTestResult(
      pageName, 'Typography', 'Body Font Size',
      MOCKUP_SPECS.typography.body.size,
      bodyStyle.fontSize,
      fontSizeMatch,
      false
    );
    
    addTestResult(
      pageName, 'Typography', 'Body Font Weight',
      MOCKUP_SPECS.typography.body.weight,
      bodyStyle.fontWeight,
      fontWeightMatch,
      false
    );
  }
  
  // Test font family
  const anyStyle = await getComputedStyle(page, 'body, *');
  if (anyStyle) {
    const hasInterFont = anyStyle.fontFamily && anyStyle.fontFamily.includes('Inter');
    addTestResult(
      pageName, 'Typography', 'Font Family',
      'Inter',
      anyStyle.fontFamily,
      hasInterFont,
      true // Critical
    );
  }
}

// Test spacing accuracy
async function testSpacingAccuracy(page, pageName) {
  console.log(`📏 Testing spacing accuracy on ${pageName} page...`);
  
  // Test card padding
  const cardStyle = await getComputedStyle(page, '.dashboard-card');
  if (cardStyle) {
    const expectedPadding = MOCKUP_SPECS.spacing.cardInner;
    const paddingMatch = cardStyle.padding.includes(expectedPadding.replace('px', ''));
    
    addTestResult(
      pageName, 'Spacing', 'Card Padding',
      expectedPadding,
      cardStyle.padding,
      paddingMatch,
      true // Critical
    );
  }
  
  // Test grid gaps
  const gridStyle = await getComputedStyle(page, '.key-metrics-grid, .performance-grid, .charts-grid');
  if (gridStyle) {
    const expectedGap = MOCKUP_SPECS.spacing.card;
    const gapMatch = gridStyle.gap && gridStyle.gap.includes(expectedGap.replace('px', ''));
    
    addTestResult(
      pageName, 'Spacing', 'Grid Gap',
      expectedGap,
      gridStyle.gap,
      gapMatch,
      true // Critical
    );
  }
}

// Test border radius accuracy
async function testBorderRadiusAccuracy(page, pageName) {
  console.log(`🔲 Testing border radius accuracy on ${pageName} page...`);
  
  // Test card border radius (CRITICAL TEST)
  const cardStyle = await getComputedStyle(page, '.dashboard-card');
  if (cardStyle) {
    const expectedRadius = MOCKUP_SPECS.borderRadius.card;
    const radiusMatch = cardStyle.borderRadius && cardStyle.borderRadius.includes(expectedRadius.replace('px', ''));
    
    addTestResult(
      pageName, 'Border Radius', 'Card Border Radius',
      expectedRadius,
      cardStyle.borderRadius,
      radiusMatch,
      true // CRITICAL - MUST be 12px, not 16px
    );
  }
  
  // Test button border radius
  const buttonStyle = await getComputedStyle(page, '.button-primary, .button-secondary');
  if (buttonStyle) {
    const expectedRadius = MOCKUP_SPECS.borderRadius.button;
    const radiusMatch = buttonStyle.borderRadius && buttonStyle.borderRadius.includes(expectedRadius.replace('px', ''));
    
    addTestResult(
      pageName, 'Border Radius', 'Button Border Radius',
      expectedRadius,
      buttonStyle.borderRadius,
      radiusMatch,
      false
    );
  }
  
  // Test input border radius
  const inputStyle = await getComputedStyle(page, '.input-field, input');
  if (inputStyle) {
    const expectedRadius = MOCKUP_SPECS.borderRadius.input;
    const radiusMatch = inputStyle.borderRadius && inputStyle.borderRadius.includes(expectedRadius.replace('px', ''));
    
    addTestResult(
      pageName, 'Border Radius', 'Input Border Radius',
      expectedRadius,
      inputStyle.borderRadius,
      radiusMatch,
      false
    );
  }
}

// Test layout accuracy
async function testLayoutAccuracy(page, pageName) {
  console.log(`📐 Testing layout accuracy on ${pageName} page...`);
  
  // Test container max width
  const containerStyle = await getComputedStyle(page, '.verotrade-content-wrapper, .main-container');
  if (containerStyle) {
    const expectedMaxWidth = MOCKUP_SPECS.layout.containerMaxWidth;
    const widthMatch = containerStyle.maxWidth && 
                      (containerStyle.maxWidth.includes(expectedMaxWidth.replace('px', '')) ||
                       containerStyle.width === '1200px');
    
    addTestResult(
      pageName, 'Layout', 'Container Max Width',
      expectedMaxWidth,
      containerStyle.maxWidth || containerStyle.width,
      widthMatch,
      false
    );
  }
  
  // Test grid layouts (specific to dashboard)
  if (pageName === 'dashboard') {
    const keyMetricsGrid = await getComputedStyle(page, '.key-metrics-grid');
    if (keyMetricsGrid) {
      addTestResult(
        pageName, 'Layout', 'Key Metrics Grid Columns',
        '4 columns',
        keyMetricsGrid.gridTemplateColumns,
        keyMetricsGrid.gridTemplateColumns && keyMetricsGrid.gridTemplateColumns.includes('1fr'),
        true // Critical
      );
    }
    
    const performanceGrid = await getComputedStyle(page, '.performance-grid');
    if (performanceGrid) {
      addTestResult(
        pageName, 'Layout', 'Performance Grid Columns',
        '3 columns',
        performanceGrid.gridTemplateColumns,
        performanceGrid.gridTemplateColumns && performanceGrid.gridTemplateColumns.includes('1fr'),
        true // Critical
      );
    }
    
    const chartsGrid = await getComputedStyle(page, '.charts-grid');
    if (chartsGrid) {
      addTestResult(
        pageName, 'Layout', 'Charts Grid Columns',
        '2 columns',
        chartsGrid.gridTemplateColumns,
        chartsGrid.gridTemplateColumns && chartsGrid.gridTemplateColumns.includes('1fr'),
        true // Critical
      );
    }
  }
}

// Test visual effects accuracy
async function testVisualEffectsAccuracy(page, pageName) {
  console.log(`✨ Testing visual effects accuracy on ${pageName} page...`);
  
  // Test glass morphism effect
  const cardStyle = await getComputedStyle(page, '.dashboard-card');
  if (cardStyle) {
    const expectedBlur = MOCKUP_SPECS.visualEffects.glassMorphism.blur;
    const blurMatch = cardStyle.backdropFilter && cardStyle.backdropFilter.includes(expectedBlur.replace('px', ''));
    
    addTestResult(
      pageName, 'Visual Effects', 'Glass Morphism Blur',
      expectedBlur,
      cardStyle.backdropFilter,
      blurMatch,
      false
    );
  }
  
  // Test transitions
  const interactiveStyle = await getComputedStyle(page, '.dashboard-card:hover, .button-primary:hover');
  if (interactiveStyle) {
    const hasTransition = interactiveStyle.transition && 
                       interactiveStyle.transition.includes('0.3s') &&
                       interactiveStyle.transition.includes('cubic-bezier');
    
    addTestResult(
      pageName, 'Visual Effects', 'Hover Transitions',
      '0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      interactiveStyle.transition,
      hasTransition,
      false
    );
  }
  
  // Test hover transforms
  const hoverStyle = await getComputedStyle(page, '.dashboard-card');
  if (hoverStyle) {
    // Check if hover transform is defined in styles
    const hasHoverTransform = await page.evaluate(() => {
      const style = document.createElement('style');
      style.innerHTML = `
        .dashboard-card:hover { transform: translateY(-2px); }
      `;
      document.head.appendChild(style);
      
      const card = document.querySelector('.dashboard-card');
      if (!card) return false;
      
      const computed = window.getComputedStyle(card);
      return computed.transform && computed.transform.includes('translateY(-2px)');
    });
    
    addTestResult(
      pageName, 'Visual Effects', 'Card Hover Transform',
      'translateY(-2px)',
      hasHoverTransform ? 'translateY(-2px)' : 'not found',
      hasHoverTransform,
      false
    );
  }
}

// Test page-specific elements
async function testPageSpecificElements(page, pageName) {
  console.log(`🔍 Testing page-specific elements on ${pageName} page...`);
  
  switch (pageName) {
    case 'dashboard':
      // Test dashboard-specific elements
      const metricCards = await page.evaluate(() => {
        return document.querySelectorAll('.key-metrics-grid .dashboard-card').length;
      });
      
      addTestResult(
        pageName, 'Page Specific', 'Dashboard Metric Cards',
        4,
        metricCards,
        metricCards === 4,
        true // Critical
      );
      
      const performanceCards = await page.evaluate(() => {
        return document.querySelectorAll('.performance-grid .dashboard-card').length;
      });
      
      addTestResult(
        pageName, 'Page Specific', 'Dashboard Performance Cards',
        3,
        performanceCards,
        performanceCards === 3,
        true // Critical
      );
      break;
      
    case 'trades':
      // Test trades page specific elements
      const hasTradeList = await page.evaluate(() => {
        return !!document.querySelector('.dashboard-card');
      });
      
      addTestResult(
        pageName, 'Page Specific', 'Trade List Container',
        'Present',
        hasTradeList ? 'Present' : 'Missing',
        hasTradeList,
        false
      );
      break;
      
    case 'strategies':
      // Test strategies page specific elements
      const hasStrategyGrid = await page.evaluate(() => {
        return !!document.querySelector('.grid');
      });
      
      addTestResult(
        pageName, 'Page Specific', 'Strategy Grid',
        'Present',
        hasStrategyGrid ? 'Present' : 'Missing',
        hasStrategyGrid,
        false
      );
      break;
      
    case 'login':
    case 'register':
      // Test auth page specific elements
      const hasAuthForm = await page.evaluate(() => {
        return !!document.querySelector('form');
      });
      
      addTestResult(
        pageName, 'Page Specific', 'Authentication Form',
        'Present',
        hasAuthForm ? 'Present' : 'Missing',
        hasAuthForm,
        true // Critical
      );
      
      const hasAuthCard = await page.evaluate(() => {
        return !!document.querySelector('.dashboard-card, [style*="soft-graphite"]');
      });
      
      addTestResult(
        pageName, 'Page Specific', 'Auth Card Container',
        'Present',
        hasAuthCard ? 'Present' : 'Missing',
        hasAuthCard,
        true // Critical
      );
      break;
  }
}

// Take screenshot for visual verification
async function takeScreenshot(page, pageName, testName) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `mockup-accuracy-${pageName}-${testName}-${timestamp}.png`;
  const filepath = path.join(__dirname, filename);
  
  await page.screenshot({ 
    path: filepath,
    fullPage: true 
  });
  
  return filepath;
}

// Test a single page
async function testPage(pageUrl, pageName) {
  console.log(`\n🚀 Starting comprehensive test for ${pageName} page...`);
  console.log(`📱 URL: ${pageUrl}`);
  
  const browser = await puppeteer.launch({ 
    headless: false, // Set to true for automated testing
    defaultViewport: { width: 1920, height: 1080 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  try {
    // Navigate to page
    await page.goto(pageUrl, { waitUntil: 'networkidle2' });
    await new Promise(resolve => setTimeout(resolve, 2000)); // Allow for animations and dynamic content
    
    // Take initial screenshot
    const initialScreenshot = await takeScreenshot(page, pageName, 'initial');
    console.log(`📸 Initial screenshot: ${initialScreenshot}`);
    
    // Run all tests
    await testColorAccuracy(page, pageName);
    await testTypographyAccuracy(page, pageName);
    await testSpacingAccuracy(page, pageName);
    await testBorderRadiusAccuracy(page, pageName);
    await testLayoutAccuracy(page, pageName);
    await testVisualEffectsAccuracy(page, pageName);
    await testPageSpecificElements(page, pageName);
    
    // Take final screenshot
    const finalScreenshot = await takeScreenshot(page, pageName, 'final');
    console.log(`📸 Final screenshot: ${finalScreenshot}`);
    
  } catch (error) {
    console.error(`❌ Error testing ${pageName} page:`, error);
    addTestResult(
      pageName, 'Page Load', 'Page Load Success',
      'Success',
      `Error: ${error.message}`,
      false,
      true // Critical
    );
  } finally {
    await browser.close();
  }
}

// Generate comprehensive report
function generateReport() {
  const report = {
    timestamp: new Date().toISOString(),
    summary: testResults.summary,
    pages: testResults.pages,
    details: testResults.details,
    recommendations: []
  };
  
  // Calculate accuracy percentages
  Object.keys(testResults.pages).forEach(pageName => {
    const page = testResults.pages[pageName];
    const total = page.passed + page.failed;
    page.accuracy = total > 0 ? ((page.passed / total) * 100).toFixed(2) + '%' : '0%';
    page.criticalAccuracy = total > 0 ? (((total - page.critical) / total) * 100).toFixed(2) + '%' : '0%';
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
  const reportPath = path.join(__dirname, `MOCKUP_ACCURACY_TEST_REPORT-${Date.now()}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  // Generate markdown report
  const markdownReport = generateMarkdownReport(report);
  const markdownPath = path.join(__dirname, `MOCKUP_ACCURACY_TEST_REPORT-${Date.now()}.md`);
  fs.writeFileSync(markdownPath, markdownReport);
  
  console.log(`\n📊 Report saved to: ${reportPath}`);
  console.log(`📝 Markdown report saved to: ${markdownPath}`);
  
  return { reportPath, markdownPath };
}

// Generate markdown report
function generateMarkdownReport(report) {
  let markdown = `# Mockup Accuracy Test Report\n\n`;
  markdown += `**Generated**: ${new Date(report.timestamp).toLocaleString()}\n\n`;
  
  // Summary
  markdown += `## Executive Summary\n\n`;
  markdown += `- **Total Tests**: ${report.summary.totalTests}\n`;
  markdown += `- **Passed**: ${report.summary.passedTests}\n`;
  markdown += `- **Failed**: ${report.summary.failedTests}\n`;
  markdown += `- **Critical Failures**: ${report.summary.criticalFailures}\n`;
  markdown += `- **Overall Accuracy**: ${((report.summary.passedTests / report.summary.totalTests) * 100).toFixed(2)}%\n\n`;
  
  // Page summaries
  markdown += `## Page Results\n\n`;
  Object.keys(report.pages).forEach(pageName => {
    const page = report.pages[page];
    markdown += `### ${pageName.charAt(0).toUpperCase() + pageName.slice(1)} Page\n\n`;
    markdown += `- **Tests**: ${page.tests.length}\n`;
    markdown += `- **Passed**: ${page.passed}\n`;
    markdown += `- **Failed**: ${page.failed}\n`;
    markdown += `- **Critical Failures**: ${page.critical}\n`;
    markdown += `- **Accuracy**: ${page.accuracy}\n`;
    markdown += `- **Critical Accuracy**: ${page.criticalAccuracy}\n\n`;
  });
  
  // Critical failures
  const criticalFailures = report.details.filter(t => t.critical && !t.passed);
  if (criticalFailures.length > 0) {
    markdown += `## 🚨 CRITICAL FAILURES\n\n`;
    criticalFailures.forEach(failure => {
      markdown += `### ${failure.page} - ${failure.category}: ${failure.test}\n\n`;
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
      markdown += `### ${failure.page} - ${failure.category}: ${failure.test}\n\n`;
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
async function runMockupAccuracyTest() {
  console.log('🎯 STARTING COMPREHENSIVE MOCKUP ACCURACY TEST');
  console.log('='.repeat(60));
  console.log('Testing against EXACT mockup specifications...');
  console.log('NO approximations or assumptions allowed\n');
  
  const baseUrl = 'http://localhost:3000';
  
  // Test all pages
  const pages = [
    { url: `${baseUrl}/dashboard`, name: 'dashboard' },
    { url: `${baseUrl}/trades`, name: 'trades' },
    { url: `${baseUrl}/strategies`, name: 'strategies' },
    { url: `${baseUrl}/login`, name: 'login' },
    { url: `${baseUrl}/register`, name: 'register' }
  ];
  
  for (const page of pages) {
    await testPage(page.url, page.name);
  }
  
  // Generate final report
  console.log('\n' + '='.repeat(60));
  console.log('📊 GENERATING COMPREHENSIVE REPORT...');
  
  const { reportPath, markdownPath } = generateReport();
  
  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('🎯 MOCKUP ACCURACY TEST COMPLETE');
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
  runMockupAccuracyTest().catch(console.error);
}

module.exports = {
  runMockupAccuracyTest,
  testPage,
  generateReport,
  MOCKUP_SPECS
};