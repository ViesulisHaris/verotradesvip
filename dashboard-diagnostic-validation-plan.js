const puppeteer = require('puppeteer');
const fs = require('fs');

// Diagnostic Validation Plan for Dashboard Issues
// This script validates our assumptions about root causes

const DIAGNOSTIC_CONFIG = {
  baseUrl: 'http://localhost:3000',
  dashboardUrl: 'http://localhost:3000/dashboard',
  screenshotsDir: './diagnostic-screenshots',
  reportFile: './diagnostic-validation-report.json'
};

// Validation targets based on our analysis
const VALIDATION_TARGETS = {
  // Test 1: Validate Test Script Issues
  testScriptIssues: {
    waitForTimeoutFix: 'Replace page.waitForTimeout with Promise-based setTimeout',
    selectorAccuracy: 'Check if selectors match actual DOM structure',
    timingIssues: 'Verify components render before testing'
  },
  
  // Test 2: Validate Component Duplication
  componentDuplication: {
    performanceSectionsExist: 'Check if PerformanceSections component renders',
    individualCardsExist: 'Check if individual VRating/Sharpe/Emotion cards render',
    bottomSectionsExist: 'Check if BottomSections component renders',
    duplicationCount: 'Count how many times each metric appears'
  },
  
  // Test 3: Validate Color Implementation
  colorImplementation: {
    primaryBackground: '#121212',
    cardSurface: '#202020',
    missingAccentColors: ['mutedOlive', 'rustRed'],
    borderRadiusMismatch: 'Check actual vs expected border radius'
  },
  
  // Test 4: Validate Accessibility
  accessibility: {
    semanticElements: ['nav', 'main', 'header'],
    ariaLabels: 'Check for ARIA labels on interactive elements',
    keyboardNavigation: 'Test Tab navigation functionality'
  }
};

let diagnosticResults = {
  timestamp: new Date().toISOString(),
  assumptions: {},
  validations: {},
  findings: [],
  recommendations: []
};

/**
 * Initialize browser for diagnostic testing
 */
async function initializeDiagnosticBrowser() {
  console.log('🔬 Initializing diagnostic browser...');
  
  const browser = await puppeteer.launch({
    headless: false,
    slowMo: 50,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  
  return { browser, page };
}

/**
 * Take diagnostic screenshot
 */
async function takeDiagnosticScreenshot(page, testName) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `diagnostic-${testName}-${timestamp}.png`;
  const filepath = `${DIAGNOSTIC_CONFIG.screenshotsDir}/${filename}`;
  
  if (!fs.existsSync(DIAGNOSTIC_CONFIG.screenshotsDir)) {
    fs.mkdirSync(DIAGNOSTIC_CONFIG.screenshotsDir, { recursive: true });
  }
  
  await page.screenshot({ path: filepath, fullPage: true });
  console.log(`📸 Diagnostic screenshot: ${filename}`);
  return filepath;
}

/**
 * Validation 1: Test Script Issues
 */
async function validateTestScriptIssues(page) {
  console.log('\n🔍 VALIDATION 1: Test Script Issues...');
  
  const results = {};
  
  // Test waitForTimeout issue
  try {
    // This should fail in original test script
    await page.evaluate(() => {
      return new Promise(resolve => setTimeout(resolve, 300));
    });
    results.waitForTimeoutFix = 'SUCCESS: Promise-based setTimeout works';
  } catch (error) {
    results.waitForTimeoutFix = `FAILED: ${error.message}`;
  }
  
  // Test selector accuracy
  try {
    const navExists = await page.$('nav');
    const mainExists = await page.$('main');
    const h1Exists = await page.$('h1');
    const gridExists = await page.$('.grid');
    const cardExists = await page.$('.card-unified');
    
    results.selectorAccuracy = {
      nav: !!navExists,
      main: !!mainExists,
      h1: !!h1Exists,
      grid: !!gridExists,
      card: !!cardExists
    };
  } catch (error) {
    results.selectorAccuracy = `ERROR: ${error.message}`;
  }
  
  // Test component render timing
  try {
    await page.waitForSelector('.card-unified', { timeout: 5000 });
    await page.waitForSelector('h1', { timeout: 5000 });
    results.timingIssues = 'SUCCESS: Components render within timeout';
  } catch (error) {
    results.timingIssues = `FAILED: Components not rendering - ${error.message}`;
  }
  
  diagnosticResults.validations.testScriptIssues = results;
  
  await takeDiagnosticScreenshot(page, 'test-script-issues');
}

/**
 * Validation 2: Component Duplication
 */
async function validateComponentDuplication(page) {
  console.log('\n🔍 VALIDATION 2: Component Duplication...');
  
  const results = {};
  
  try {
    // Check for component existence
    const performanceSections = await page.evaluate(() => {
      const elements = document.querySelectorAll('[data-testid="performance-sections"]');
      return elements.length;
    });
    
    const vRatingCards = await page.evaluate(() => {
      const elements = document.querySelectorAll('[data-testid="v-rating-card"]');
      return elements.length;
    });
    
    const sharpeRatioGauges = await page.evaluate(() => {
      const elements = document.querySelectorAll('[data-testid="sharpe-ratio-gauge"]');
      return elements.length;
    });
    
    const dominantEmotionCards = await page.evaluate(() => {
      const elements = document.querySelectorAll('[data-testid="dominant-emotion-card"]');
      return elements.length;
    });
    
    const bottomSections = await page.evaluate(() => {
      const elements = document.querySelectorAll('[data-testid="bottom-sections"]');
      return elements.length;
    });
    
    // Count actual component instances by looking for their content
    const vRatingCount = await page.evaluate(() => {
      const text = document.body.innerText;
      const matches = text.match(/VRating|V\s*Rating/gi);
      return matches ? matches.length : 0;
    });
    
    const sharpeCount = await page.evaluate(() => {
      const text = document.body.innerText;
      const matches = text.match(/Sharpe\s*Ratio/gi);
      return matches ? matches.length : 0;
    });
    
    const emotionCount = await page.evaluate(() => {
      const text = document.body.innerText;
      const matches = text.match(/Dominant\s*Emotion|Emotional/gi);
      return matches ? matches.length : 0;
    });
    
    results.performanceSectionsExist = performanceSections > 0;
    results.vRatingCardsExist = vRatingCards > 0;
    results.sharpeRatioGaugesExist = sharpeRatioGauges > 0;
    results.dominantEmotionCardsExist = dominantEmotionCards > 0;
    results.bottomSectionsExist = bottomSections > 0;
    results.duplicationCount = {
      vRating: vRatingCount,
      sharpeRatio: sharpeCount,
      emotion: emotionCount
    };
    
    // Determine if duplication exists
    results.hasDuplication = (vRatingCount > 1) || (sharpeCount > 1) || (emotionCount > 1);
    
  } catch (error) {
    results.error = error.message;
  }
  
  diagnosticResults.validations.componentDuplication = results;
  
  await takeDiagnosticScreenshot(page, 'component-duplication');
}

/**
 * Validation 3: Color Implementation
 */
async function validateColorImplementation(page) {
  console.log('\n🔍 VALIDATION 3: Color Implementation...');
  
  const results = {};
  
  try {
    // Check actual colors
    const actualColors = await page.evaluate(() => {
      const body = window.getComputedStyle(document.body);
      const card = document.querySelector('.card-unified');
      const cardStyle = card ? window.getComputedStyle(card) : null;
      
      return {
        primaryBackground: body.backgroundColor,
        cardSurface: cardStyle ? cardStyle.backgroundColor : null,
        borderRadius: cardStyle ? cardStyle.borderRadius : null
      };
    });
    
    // Check for accent colors
    const accentColors = await page.evaluate(() => {
      const elements = document.querySelectorAll('*');
      const colors = new Set();
      
      elements.forEach(el => {
        const styles = window.getComputedStyle(el);
        const color = styles.color;
        const bgColor = styles.backgroundColor;
        const borderColor = styles.borderColor;
        
        [color, bgColor, borderColor].forEach(c => {
          if (c && c !== 'rgba(0, 0, 0, 0)' && c !== 'transparent') {
            colors.add(c.toUpperCase());
          }
        });
      });
      
      return Array.from(colors);
    });
    
    const hasDustyGold = accentColors.some(c => c.includes('B89B5E'));
    const hasWarmSand = accentColors.some(c => c.includes('D6C7B2'));
    const hasMutedOlive = accentColors.some(c => c.includes('4F5B4A'));
    const hasRustRed = accentColors.some(c => c.includes('A7352D'));
    
    results.primaryBackground = {
      expected: VALIDATION_TARGETS.colorImplementation.primaryBackground,
      actual: actualColors.primaryBackground,
      matches: actualColors.primaryBackground === VALIDATION_TARGETS.colorImplementation.primaryBackground
    };
    
    results.cardSurface = {
      expected: VALIDATION_TARGETS.colorImplementation.cardSurface,
      actual: actualColors.cardSurface,
      matches: actualColors.cardSurface === VALIDATION_TARGETS.colorImplementation.cardSurface
    };
    
    results.borderRadiusMismatch = {
      expected: '12px',
      actual: actualColors.borderRadius,
      matches: actualColors.borderRadius === '12px'
    };
    
    results.missingAccentColors = {
      dustyGold: hasDustyGold,
      warmSand: hasWarmSand,
      mutedOlive: hasMutedOlive,
      rustRed: hasRustRed,
      allPresent: hasDustyGold && hasWarmSand && hasMutedOlive && hasRustRed
    };
    
  } catch (error) {
    results.error = error.message;
  }
  
  diagnosticResults.validations.colorImplementation = results;
  
  await takeDiagnosticScreenshot(page, 'color-implementation');
}

/**
 * Validation 4: Accessibility
 */
async function validateAccessibility(page) {
  console.log('\n🔍 VALIDATION 4: Accessibility...');
  
  const results = {};
  
  try {
    // Check semantic elements
    const semanticElements = await page.evaluate(() => {
      return {
        nav: !!document.querySelector('nav'),
        main: !!document.querySelector('main'),
        header: !!document.querySelector('h1, h2, h3'),
        landmarks: !!document.querySelector('[role="main"], [role="navigation"], [role="article"]')
      };
    });
    
    // Check ARIA labels
    const ariaLabels = await page.evaluate(() => {
      const elementsWithAria = document.querySelectorAll('[aria-label], [role], [aria-describedby]');
      return elementsWithAria.length;
    });
    
    // Test keyboard navigation
    await page.keyboard.press('Tab');
    const focusedElement = await page.evaluate(() => {
      const active = document.activeElement;
      return {
        tagName: active.tagName,
        hasFocus: active.tagName !== 'BODY'
      };
    });
    
    results.semanticElements = semanticElements;
    results.ariaLabels = {
      count: ariaLabels,
      hasLabels: ariaLabels > 0
    };
    results.keyboardNavigation = {
      works: focusedElement.hasFocus,
      focusedElement: focusedElement.tagName
    };
    
    results.overallAccessibility = 
      semanticElements.nav && 
      semanticElements.main && 
      semanticElements.header && 
      ariaLabels > 0 && 
      focusedElement.hasFocus;
    
  } catch (error) {
    results.error = error.message;
  }
  
  diagnosticResults.validations.accessibility = results;
  
  await takeDiagnosticScreenshot(page, 'accessibility');
}

/**
 * Generate diagnostic report
 */
function generateDiagnosticReport() {
  // Analyze validation results
  const findings = [];
  const recommendations = [];
  
  // Analyze test script issues
  const testScriptResults = diagnosticResults.validations.testScriptIssues;
  if (testScriptResults.waitForTimeoutFix.includes('SUCCESS')) {
    findings.push('✅ Test script timeout issue can be fixed with Promise-based setTimeout');
  } else {
    findings.push('❌ Test script timeout issue confirmed');
    recommendations.push('Replace page.waitForTimeout with new Promise(resolve => setTimeout(resolve, 300))');
  }
  
  // Analyze component duplication
  const duplicationResults = diagnosticResults.validations.componentDuplication;
  if (duplicationResults.hasDuplication) {
    findings.push(`⚠️ Component duplication confirmed: VRating (${duplicationResults.duplicationCount.vRating}), Sharpe (${duplicationResults.duplicationCount.sharpeRatio}), Emotion (${duplicationResults.duplicationCount.emotion})`);
    recommendations.push('Remove duplicate component rendering - choose either PerformanceSections OR individual cards');
  } else {
    findings.push('✅ No component duplication found');
  }
  
  // Analyze color implementation
  const colorResults = diagnosticResults.validations.colorImplementation;
  if (!colorResults.primaryBackground.matches) {
    findings.push(`❌ Primary background mismatch: expected ${colorResults.primaryBackground.expected}, got ${colorResults.primaryBackground.actual}`);
    recommendations.push('Fix primary background color to match #121212 specification');
  }
  
  if (!colorResults.borderRadiusMismatch.matches) {
    findings.push(`❌ Border radius mismatch: expected 12px, got ${colorResults.borderRadiusMismatch.actual}`);
    recommendations.push('Update card border radius from 16px to 12px');
  }
  
  if (!colorResults.missingAccentColors.allPresent) {
    findings.push(`❌ Missing accent colors: mutedOlive (${colorResults.missingAccentColors.mutedOlive}), rustRed (${colorResults.missingAccentColors.rustRed})`);
    recommendations.push('Implement missing accent colors in color scheme');
  }
  
  // Analyze accessibility
  const accessibilityResults = diagnosticResults.validations.accessibility;
  if (!accessibilityResults.overallAccessibility) {
    findings.push('❌ Accessibility issues found');
    recommendations.push('Add semantic HTML elements and ARIA labels');
  } else {
    findings.push('✅ Accessibility implementation looks good');
  }
  
  diagnosticResults.findings = findings;
  diagnosticResults.recommendations = recommendations;
  
  // Save report
  fs.writeFileSync(DIAGNOSTIC_CONFIG.reportFile, JSON.stringify(diagnosticResults, null, 2));
  
  console.log('\n' + '='.repeat(80));
  console.log('🔬 DIAGNOSTIC VALIDATION REPORT');
  console.log('='.repeat(80));
  
  console.log('\n📋 FINDINGS:');
  findings.forEach((finding, index) => {
    console.log(`  ${index + 1}. ${finding}`);
  });
  
  console.log('\n💡 RECOMMENDATIONS:');
  recommendations.forEach((rec, index) => {
    console.log(`  ${index + 1}. ${rec}`);
  });
  
  console.log(`\n📁 Full report saved to: ${DIAGNOSTIC_CONFIG.reportFile}`);
  console.log('='.repeat(80));
  
  return diagnosticResults;
}

/**
 * Main diagnostic execution
 */
async function runDiagnosticValidation() {
  console.log('🔬 Starting Diagnostic Validation Plan...');
  console.log(`📅 Started at: ${new Date().toISOString()}`);
  
  let browser, page;
  
  try {
    // Initialize browser
    ({ browser, page } = await initializeDiagnosticBrowser());
    
    // Navigate to dashboard
    console.log(`\n🌐 Navigating to dashboard: ${DIAGNOSTIC_CONFIG.dashboardUrl}`);
    await page.goto(DIAGNOSTIC_CONFIG.dashboardUrl, { waitUntil: 'networkidle2' });
    
    // Handle authentication if needed
    const currentUrl = page.url();
    if (currentUrl.includes('/login')) {
      console.log('🔐 Authentication required - logging in...');
      await page.type('input[type="email"]', 'testuser@verotrade.com');
      await page.type('input[type="password"]', 'TestPassword123!');
      await page.click('button[type="submit"]');
      await page.waitForNavigation({ waitUntil: 'networkidle2' });
    }
    
    // Wait for dashboard to load
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Run all validations
    await validateTestScriptIssues(page);
    await validateComponentDuplication(page);
    await validateColorImplementation(page);
    await validateAccessibility(page);
    
    // Generate report
    const report = generateDiagnosticReport();
    
    return report;
    
  } catch (error) {
    console.error('❌ Diagnostic validation failed:', error);
    diagnosticResults.error = error.message;
    return diagnosticResults;
    
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run if called directly
if (require.main === module) {
  runDiagnosticValidation()
    .then(() => {
      console.log('\n✅ Diagnostic validation completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Diagnostic validation failed:', error);
      process.exit(1);
    });
}

module.exports = {
  runDiagnosticValidation,
  VALIDATION_TARGETS,
  DIAGNOSTIC_CONFIG
};