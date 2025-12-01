const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

// Test configuration
const CONFIG = {
  baseUrl: 'http://localhost:3000',
  screenshotsDir: './emotion-radar-test-screenshots',
  testTimeout: 30000,
  viewportWidth: 1920,
  viewportHeight: 1080,
  mobileViewportWidth: 375,
  mobileViewportHeight: 667,
  // Test user credentials for authentication
  testUser: {
    email: 'test@example.com',
    password: 'testpassword123'
  }
};

// Test data for verification
const TEST_EMOTIONS = ['FOMO', 'REVENGE', 'TILT', 'OVERRISK', 'PATIENCE', 'REGRET', 'DISCIPLINE', 'CONFIDENT', 'ANXIOUS', 'NEUTRAL'];

// Test results storage
let testResults = {
  summary: {
    totalTests: 0,
    passedTests: 0,
    failedTests: 0,
    startTime: new Date().toISOString(),
    endTime: null,
    duration: null
  },
  dashboard: {
    componentLoaded: false,
    hasData: false,
    visualEnhancements: {
      gradients: false,
      smoothCurves: false,
      glowEffects: false
    },
    responsiveness: {
      desktop: false,
      tablet: false,
      mobile: false
    },
    interactivity: {
      tooltips: false,
      hoverEffects: false
    },
    errors: []
  },
  confluence: {
    componentLoaded: false,
    hasData: false,
    visualEnhancements: {
      gradients: false,
      smoothCurves: false,
      glowEffects: false
    },
    responsiveness: {
      desktop: false,
      tablet: false,
      mobile: false
    },
    interactivity: {
      tooltips: false,
      hoverEffects: false
    },
    errors: []
  },
  screenshots: [],
  detailedResults: []
};

// Utility functions
function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [${type.toUpperCase()}]`;
  console.log(`${prefix} ${message}`);
}

function logTest(testName, passed, details = '') {
  testResults.summary.totalTests++;
  if (passed) {
    testResults.summary.passedTests++;
    log(`✅ ${testName}: ${details}`, 'success');
  } else {
    testResults.summary.failedTests++;
    log(`❌ ${testName}: ${details}`, 'error');
  }
  
  testResults.detailedResults.push({
    testName,
    passed,
    details,
    timestamp: new Date().toISOString()
  });
}

async function takeScreenshot(page, filename, description = '') {
  try {
    const screenshotPath = path.join(CONFIG.screenshotsDir, filename);
    await page.screenshot({ 
      path: screenshotPath, 
      fullPage: true,
      type: 'png'
    });
    
    testResults.screenshots.push({
      filename,
      path: screenshotPath,
      description,
      timestamp: new Date().toISOString()
    });
    
    log(`📸 Screenshot saved: ${filename} - ${description}`, 'info');
    return screenshotPath;
  } catch (error) {
    log(`❌ Failed to take screenshot: ${error.message}`, 'error');
    return null;
  }
}

async function waitForElement(page, selector, timeout = CONFIG.testTimeout) {
  try {
    await page.waitForSelector(selector, { timeout });
    return true;
  } catch (error) {
    return false;
  }
}

async function checkElementExists(page, selector) {
  try {
    const element = await page.$(selector);
    return element !== null;
  } catch (error) {
    return false;
  }
}

async function checkElementVisible(page, selector) {
  try {
    const isVisible = await page.evaluate((sel) => {
      const element = document.querySelector(sel);
      if (!element) return false;
      
      const style = window.getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      
      return style.display !== 'none' && 
             style.visibility !== 'hidden' && 
             style.opacity !== '0' &&
             rect.width > 0 && 
             rect.height > 0;
    }, selector);
    
    return isVisible;
  } catch (error) {
    return false;
  }
}

async function checkResponsiveContainer(page) {
  try {
    const hasResponsiveContainer = await page.evaluate(() => {
      const responsiveContainers = document.querySelectorAll('div[style*="width"], div[style*="height"]');
      return Array.from(responsiveContainers).some(container => {
        const style = window.getComputedStyle(container);
        return style.width && style.height && 
               style.width !== '0px' && style.height !== '0px';
      });
    });
    
    return hasResponsiveContainer;
  } catch (error) {
    return false;
  }
}

async function checkGradientsAndEffects(page) {
  try {
    const effects = await page.evaluate(() => {
      const results = {
        hasGradients: false,
        hasGlowEffects: false,
        hasSmoothCurves: false
      };
      
      // Check for gradients in SVG elements
      const gradients = document.querySelectorAll('linearGradient, radialGradient');
      results.hasGradients = gradients.length > 0;
      
      // Check for glow effects (filters)
      const filters = document.querySelectorAll('filter');
      results.hasGlowEffects = filters.length > 0;
      
      // Check for smooth curves (RadarChart with rounded paths)
      const paths = document.querySelectorAll('path[stroke-linecap="round"], path[stroke-linejoin="round"]');
      results.hasSmoothCurves = paths.length > 0;
      
      return results;
    });
    
    return effects;
  } catch (error) {
    return { hasGradients: false, hasGlowEffects: false, hasSmoothCurves: false };
  }
}

async function checkTooltips(page) {
  try {
    // Hover over radar chart elements to trigger tooltips
    const radarElements = await page.$$('circle, path');
    
    if (radarElements.length === 0) {
      return { hasTooltips: false, hasHoverEffects: false };
    }
    
    // Hover over first element to check for tooltips
    await radarElements[0].hover();
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const tooltipExists = await checkElementExists(page, '[class*="tooltip"], [role="tooltip"]');
    
    // Check for hover effects by checking if element styles change on hover
    const hasHoverEffects = await page.evaluate(() => {
      const elements = document.querySelectorAll('circle, path');
      return Array.from(elements).some(el => {
        const style = window.getComputedStyle(el);
        return style.transition && style.transition !== 'none';
      });
    });
    
    return { hasTooltips: tooltipExists, hasHoverEffects };
  } catch (error) {
    return { hasTooltips: false, hasHoverEffects: false };
  }
}

async function testEmotionalData(page, pageName) {
  try {
    const dataCheck = await page.evaluate(() => {
      // Look for EmotionRadar component using more specific selectors
      const chartContainers = document.querySelectorAll('.chart-container-enhanced, [class*="chart-container"]');
      const emotionRadarElements = document.querySelectorAll('[class*="emotion"], [class*="radar"]');
      const svgElements = document.querySelectorAll('svg');
      
      // Debug information
      console.log('Desktop viewport debug:', {
        chartContainers: chartContainers.length,
        emotionRadarElements: emotionRadarElements.length,
        svgElements: svgElements.length,
        innerHTML: document.body.innerHTML.substring(0, 500) // First 500 chars of HTML
      });
      
      if (chartContainers.length === 0 && emotionRadarElements.length === 0) {
        return { hasData: false, dataPoints: 0, emotions: [] };
      }
      
      // Check for SVG elements which indicate the chart is rendered
      if (svgElements.length === 0) {
        return { hasData: false, dataPoints: 0, emotions: [] };
      }
      
      // Count data points in the radar chart
      const dataPoints = document.querySelectorAll('circle, text').length;
      
      // Extract emotion labels from the chart
      const emotionLabels = Array.from(document.querySelectorAll('text')).map(el => el.textContent).filter(text =>
        text && ['FOMO', 'REVENGE', 'TILT', 'OVERRISK', 'PATIENCE', 'REGRET', 'DISCIPLINE', 'CONFIDENT', 'ANXIOUS', 'NEUTRAL'].includes(text.toUpperCase())
      );
      
      return {
        hasData: dataPoints > 0,
        dataPoints,
        emotions: emotionLabels
      };
    });
    
    return dataCheck;
  } catch (error) {
    log(`Error checking emotional data on ${pageName}: ${error.message}`, 'error');
    return { hasData: false, dataPoints: 0, emotions: [] };
  }
}

async function testPageWithViewport(page, url, pageName, viewport) {
  log(`Testing ${pageName} with viewport ${viewport.width}x${viewport.height}`, 'info');
  
  try {
    // Set viewport
    await page.setViewport(viewport);
    
    // Navigate to page
    await page.goto(url, { waitUntil: 'networkidle2', timeout: CONFIG.testTimeout });
    
    // Check if redirected to login page (authentication required)
    const currentUrl = page.url();
    if (currentUrl.includes('/login')) {
      log(`🔐 Authentication required for ${pageName}, attempting to login...`, 'info');
      
      // Fill in login credentials
      await page.waitForSelector('input[type="email"]', { timeout: 5000 });
      await page.type('input[type="email"]', CONFIG.testUser.email);
      await page.type('input[type="password"]', CONFIG.testUser.password);
      
      // Submit login form
      await page.click('button[type="submit"]');
      
      // Wait for navigation after login
      await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: CONFIG.testTimeout });
      
      // Check if login was successful
      const postLoginUrl = page.url();
      if (postLoginUrl.includes('/login')) {
        throw new Error(`Login failed for ${pageName} - still on login page`);
      }
      
      log(`✅ Successfully authenticated for ${pageName}`, 'success');
      
      // Navigate to the original page again if not redirected there
      if (!postLoginUrl.includes(url.replace(CONFIG.baseUrl, ''))) {
        await page.goto(url, { waitUntil: 'networkidle2', timeout: CONFIG.testTimeout });
      }
    }
    
    // Wait for page to load
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Take screenshot
    await takeScreenshot(page, `${pageName.toLowerCase()}-${viewport.width}x${viewport.height}.png`, 
      `${pageName} page at ${viewport.width}x${viewport.height}`);
    
    // Check if EmotionRadar component is loaded
    const componentLoaded = await checkElementVisible(page, '[class*="emotion"], [class*="radar"], svg');
    logTest(`${pageName} - Component loaded at ${viewport.width}x${viewport.height}`, componentLoaded);
    
    if (!componentLoaded) {
      return false;
    }
    
    // Check for responsive container
    const hasResponsiveContainer = await checkResponsiveContainer(page);
    logTest(`${pageName} - Responsive container at ${viewport.width}x${viewport.height}`, hasResponsiveContainer);
    
    // Check emotional data
    const emotionalData = await testEmotionalData(page, pageName);
    logTest(`${pageName} - Has emotional data at ${viewport.width}x${viewport.height}`, emotionalData.hasData, 
      `Data points: ${emotionalData.dataPoints}, Emotions: ${emotionalData.emotions.join(', ')}`);
    
    // Check visual enhancements (only on desktop viewport)
    if (viewport.width >= 1024) {
      const effects = await checkGradientsAndEffects(page);
      logTest(`${pageName} - Has gradients`, effects.hasGradients);
      logTest(`${pageName} - Has glow effects`, effects.hasGlowEffects);
      logTest(`${pageName} - Has smooth curves`, effects.hasSmoothCurves);
      
      // Check tooltips and interactivity
      const interactivity = await checkTooltips(page);
      logTest(`${pageName} - Has tooltips`, interactivity.hasTooltips);
      logTest(`${pageName} - Has hover effects`, interactivity.hasHoverEffects);
      
      return {
        componentLoaded,
        hasResponsiveContainer,
        hasData: emotionalData.hasData,
        visualEnhancements: effects,
        interactivity
      };
    }
    
    return {
      componentLoaded,
      hasResponsiveContainer,
      hasData: emotionalData.hasData
    };
    
  } catch (error) {
    log(`Error testing ${pageName} at ${viewport.width}x${viewport.height}: ${error.message}`, 'error');
    return false;
  }
}

async function testDashboardPage(page) {
  log('🔍 Testing Dashboard Page', 'info');
  
  const dashboardUrl = `${CONFIG.baseUrl}/dashboard`;
  const viewports = [
    { width: CONFIG.viewportWidth, height: CONFIG.viewportHeight, name: 'desktop' },
    { width: 768, height: 1024, name: 'tablet' },
    { width: CONFIG.mobileViewportWidth, height: CONFIG.mobileViewportHeight, name: 'mobile' }
  ];
  
  const results = {
    componentLoaded: false,
    hasData: false,
    visualEnhancements: {
      gradients: false,
      smoothCurves: false,
      glowEffects: false
    },
    responsiveness: {
      desktop: false,
      tablet: false,
      mobile: false
    },
    interactivity: {
      tooltips: false,
      hoverEffects: false
    }
  };
  
  for (const viewport of viewports) {
    const testResult = await testPageWithViewport(page, dashboardUrl, 'Dashboard', viewport);
    
    if (viewport.name === 'desktop' && testResult) {
      results.componentLoaded = testResult.componentLoaded;
      results.hasData = testResult.hasData;
      results.visualEnhancements = testResult.visualEnhancements || results.visualEnhancements;
      results.interactivity = testResult.interactivity || results.interactivity;
    }
    
    results.responsiveness[viewport.name] = testResult && testResult.componentLoaded;
  }
  
  testResults.dashboard = { ...results, errors: [] };
  return results;
}

async function testConfluencePage(page) {
  log('🔍 Testing Confluence Page', 'info');
  
  const confluenceUrl = `${CONFIG.baseUrl}/confluence`;
  const viewports = [
    { width: CONFIG.viewportWidth, height: CONFIG.viewportHeight, name: 'desktop' },
    { width: 768, height: 1024, name: 'tablet' },
    { width: CONFIG.mobileViewportWidth, height: CONFIG.mobileViewportHeight, name: 'mobile' }
  ];
  
  const results = {
    componentLoaded: false,
    hasData: false,
    visualEnhancements: {
      gradients: false,
      smoothCurves: false,
      glowEffects: false
    },
    responsiveness: {
      desktop: false,
      tablet: false,
      mobile: false
    },
    interactivity: {
      tooltips: false,
      hoverEffects: false
    }
  };
  
  for (const viewport of viewports) {
    const testResult = await testPageWithViewport(page, confluenceUrl, 'Confluence', viewport);
    
    if (viewport.name === 'desktop' && testResult) {
      results.componentLoaded = testResult.componentLoaded;
      results.hasData = testResult.hasData;
      results.visualEnhancements = testResult.visualEnhancements || results.visualEnhancements;
      results.interactivity = testResult.interactivity || results.interactivity;
    }
    
    results.responsiveness[viewport.name] = testResult && testResult.componentLoaded;
  }
  
  testResults.confluence = { ...results, errors: [] };
  return results;
}

async function generateTestReport() {
  testResults.summary.endTime = new Date().toISOString();
  testResults.summary.duration = new Date(testResults.summary.endTime) - new Date(testResults.summary.startTime);
  
  const report = {
    ...testResults,
    testEnvironment: {
      nodeVersion: process.version,
      puppeteerVersion: require('puppeteer').version || '24.30.0',
      testUrl: CONFIG.baseUrl,
      viewports: {
        desktop: `${CONFIG.viewportWidth}x${CONFIG.viewportHeight}`,
        tablet: '768x1024',
        mobile: `${CONFIG.mobileViewportWidth}x${CONFIG.mobileViewportHeight}`
      }
    },
    recommendations: []
  };
  
  // Add recommendations based on test results
  if (!testResults.dashboard.componentLoaded) {
    report.recommendations.push('Dashboard EmotionRadar component failed to load - check component imports and error handling');
  }
  
  if (!testResults.confluence.componentLoaded) {
    report.recommendations.push('Confluence EmotionRadar component failed to load - check component imports and error handling');
  }
  
  if (!testResults.dashboard.hasData) {
    report.recommendations.push('Dashboard EmotionRadar has no data - check data fetching and processing logic');
  }
  
  if (!testResults.confluence.hasData) {
    report.recommendations.push('Confluence EmotionRadar has no data - check data fetching and processing logic');
  }
  
  if (!testResults.dashboard.visualEnhancements.gradients || !testResults.confluence.visualEnhancements.gradients) {
    report.recommendations.push('Gradients not rendering properly - check SVG gradient definitions');
  }
  
  if (!testResults.dashboard.visualEnhancements.glowEffects || !testResults.confluence.visualEnhancements.glowEffects) {
    report.recommendations.push('Glow effects not working - check SVG filter definitions');
  }
  
  // Write report to file
  const reportPath = path.join(CONFIG.screenshotsDir, `emotional-radar-test-report-${Date.now()}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  // Generate markdown report
  const markdownReport = generateMarkdownReport(report);
  const markdownPath = path.join(CONFIG.screenshotsDir, `emotional-radar-test-report-${Date.now()}.md`);
  fs.writeFileSync(markdownPath, markdownReport);
  
  log(`📊 Test report saved to: ${reportPath}`, 'info');
  log(`📝 Markdown report saved to: ${markdownPath}`, 'info');
  
  return { reportPath, markdownPath };
}

function generateMarkdownReport(report) {
  const { summary, dashboard, confluence, screenshots } = report;
  
  let markdown = `# Emotional Radar Functionality Test Report\n\n`;
  markdown += `**Test Date:** ${new Date(summary.startTime).toLocaleString()}\n`;
  markdown += `**Duration:** ${Math.round(summary.duration / 1000)} seconds\n\n`;
  
  // Summary
  markdown += `## Test Summary\n\n`;
  markdown += `- **Total Tests:** ${summary.totalTests}\n`;
  markdown += `- **Passed:** ${summary.passedTests}\n`;
  markdown += `- **Failed:** ${summary.failedTests}\n`;
  markdown += `- **Success Rate:** ${((summary.passedTests / summary.totalTests) * 100).toFixed(1)}%\n\n`;
  
  // Dashboard Results
  markdown += `## Dashboard Page Results\n\n`;
  markdown += `| Test | Status |\n`;
  markdown += `|------|--------|\n`;
  markdown += `| Component Loaded | ${dashboard.componentLoaded ? '✅ Pass' : '❌ Fail'} |\n`;
  markdown += `| Has Data | ${dashboard.hasData ? '✅ Pass' : '❌ Fail'} |\n`;
  markdown += `| Gradients | ${dashboard.visualEnhancements.gradients ? '✅ Pass' : '❌ Fail'} |\n`;
  markdown += `| Glow Effects | ${dashboard.visualEnhancements.glowEffects ? '✅ Pass' : '❌ Fail'} |\n`;
  markdown += `| Smooth Curves | ${dashboard.visualEnhancements.smoothCurves ? '✅ Pass' : '❌ Fail'} |\n`;
  markdown += `| Desktop Responsive | ${dashboard.responsiveness.desktop ? '✅ Pass' : '❌ Fail'} |\n`;
  markdown += `| Tablet Responsive | ${dashboard.responsiveness.tablet ? '✅ Pass' : '❌ Fail'} |\n`;
  markdown += `| Mobile Responsive | ${dashboard.responsiveness.mobile ? '✅ Pass' : '❌ Fail'} |\n`;
  markdown += `| Tooltips | ${dashboard.interactivity.tooltips ? '✅ Pass' : '❌ Fail'} |\n`;
  markdown += `| Hover Effects | ${dashboard.interactivity.hoverEffects ? '✅ Pass' : '❌ Fail'} |\n\n`;
  
  // Confluence Results
  markdown += `## Confluence Page Results\n\n`;
  markdown += `| Test | Status |\n`;
  markdown += `|------|--------|\n`;
  markdown += `| Component Loaded | ${confluence.componentLoaded ? '✅ Pass' : '❌ Fail'} |\n`;
  markdown += `| Has Data | ${confluence.hasData ? '✅ Pass' : '❌ Fail'} |\n`;
  markdown += `| Gradients | ${confluence.visualEnhancements.gradients ? '✅ Pass' : '❌ Fail'} |\n`;
  markdown += `| Glow Effects | ${confluence.visualEnhancements.glowEffects ? '✅ Pass' : '❌ Fail'} |\n`;
  markdown += `| Smooth Curves | ${confluence.visualEnhancements.smoothCurves ? '✅ Pass' : '❌ Fail'} |\n`;
  markdown += `| Desktop Responsive | ${confluence.responsiveness.desktop ? '✅ Pass' : '❌ Fail'} |\n`;
  markdown += `| Tablet Responsive | ${confluence.responsiveness.tablet ? '✅ Pass' : '❌ Fail'} |\n`;
  markdown += `| Mobile Responsive | ${confluence.responsiveness.mobile ? '✅ Pass' : '❌ Fail'} |\n`;
  markdown += `| Tooltips | ${confluence.interactivity.tooltips ? '✅ Pass' : '❌ Fail'} |\n`;
  markdown += `| Hover Effects | ${confluence.interactivity.hoverEffects ? '✅ Pass' : '❌ Fail'} |\n\n`;
  
  // Screenshots
  markdown += `## Screenshots\n\n`;
  screenshots.forEach(screenshot => {
    markdown += `### ${screenshot.filename}\n`;
    markdown += `**Description:** ${screenshot.description}\n`;
    markdown += `**Timestamp:** ${new Date(screenshot.timestamp).toLocaleString()}\n\n`;
  });
  
  // Recommendations
  if (report.recommendations.length > 0) {
    markdown += `## Recommendations\n\n`;
    report.recommendations.forEach((rec, index) => {
      markdown += `${index + 1}. ${rec}\n`;
    });
    markdown += `\n`;
  }
  
  // Detailed Results
  markdown += `## Detailed Test Results\n\n`;
  report.detailedResults.forEach(result => {
    const status = result.passed ? '✅' : '❌';
    markdown += `${status} **${result.testName}** - ${result.details}\n`;
  });
  
  return markdown;
}

async function authenticate(page) {
  log('🔐 Authenticating user...', 'info');
  
  try {
    // Navigate to login page
    await page.goto(`${CONFIG.baseUrl}/login`, { waitUntil: 'networkidle2', timeout: CONFIG.testTimeout });
    
    // Wait for login form to be visible
    await page.waitForSelector('input[type="email"]', { timeout: 5000 });
    
    // Fill in login credentials
    await page.type('input[type="email"]', CONFIG.testUser.email);
    await page.type('input[type="password"]', CONFIG.testUser.password);
    
    // Submit login form
    await page.click('button[type="submit"]');
    
    // Wait for navigation after login
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: CONFIG.testTimeout });
    
    // Check if login was successful
    const currentUrl = page.url();
    if (currentUrl.includes('/login')) {
      throw new Error('Login failed - still on login page');
    }
    
    log('✅ Authentication successful', 'success');
    return true;
    
  } catch (error) {
    log(`❌ Authentication failed: ${error.message}`, 'error');
    return false;
  }
}

async function runTests() {
  log('🚀 Starting Emotional Radar Functionality Tests with Authentication', 'info');
  
  // Create screenshots directory
  if (!fs.existsSync(CONFIG.screenshotsDir)) {
    fs.mkdirSync(CONFIG.screenshotsDir, { recursive: true });
  }
  
  let browser;
  let page;
  
  try {
    // Launch browser
    browser = await puppeteer.launch({
      headless: false, // Set to false for debugging
      defaultViewport: null,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    page = await browser.newPage();
    
    // Authenticate first
    const authSuccess = await authenticate(page);
    if (!authSuccess) {
      throw new Error('Authentication failed - cannot proceed with tests');
    }
    
    // Test Dashboard Page
    await testDashboardPage(page);
    
    // Test Confluence Page
    await testConfluencePage(page);
    
    // Generate test report
    const reportPaths = await generateTestReport();
    
    log('✅ All tests completed successfully with authentication!', 'success');
    log(`📊 Report available at: ${reportPaths.reportPath}`, 'info');
    log(`📝 Markdown report at: ${reportPaths.markdownPath}`, 'info');
    
    return reportPaths;
    
  } catch (error) {
    log(`❌ Test execution failed: ${error.message}`, 'error');
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  runTests()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('Test execution failed:', error);
      process.exit(1);
    });
}

module.exports = { runTests, testResults, CONFIG };