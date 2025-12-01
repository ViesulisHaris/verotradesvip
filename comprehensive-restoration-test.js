const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// Configuration
const BASE_URL = 'http://localhost:3000';
const TEST_USER = {
  email: 'testuser1000@verotrade.com',
  password: 'TestPassword123!'
};

// Test results storage
let testResults = {
  timestamp: new Date().toISOString(),
  summary: {
    total: 0,
    passed: 0,
    failed: 0,
    skipped: 0
  },
  categories: {
    general: { tests: [], passed: 0, failed: 0 },
    navigation: { tests: [], passed: 0, failed: 0 },
    sidebar: { tests: [], passed: 0, failed: 0 },
    responsive: { tests: [], passed: 0, failed: 0 },
    authentication: { tests: [], passed: 0, failed: 0 },
    dashboard: { tests: [], passed: 0, failed: 0 },
    interactive: { tests: [], passed: 0, failed: 0 }
  },
  screenshots: [],
  errors: []
};

// Helper functions
function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${type.toUpperCase()}] ${message}`;
  console.log(logMessage);
  
  if (type === 'error') {
    testResults.errors.push({
      timestamp,
      message
    });
  }
}

function recordTest(category, testName, passed, details = '') {
  // Validate category
  if (!category || !testResults.categories[category]) {
    log(`Invalid category "${category}" for test "${testName}". Using "general" instead.`, 'error');
    category = 'general';
    
    // Ensure general category exists
    if (!testResults.categories.general) {
      testResults.categories.general = { tests: [], passed: 0, failed: 0 };
    }
  }
  
  const test = {
    name: testName,
    passed,
    details,
    timestamp: new Date().toISOString()
  };
  
  testResults.categories[category].tests.push(test);
  if (passed) {
    testResults.categories[category].passed++;
    testResults.summary.passed++;
  } else {
    testResults.categories[category].failed++;
    testResults.summary.failed++;
  }
  testResults.summary.total++;
  
  log(`Test ${passed ? 'PASSED' : 'FAILED'}: ${testName} - ${details}`, passed ? 'info' : 'error');
}

async function takeScreenshot(page, name, category = 'general') {
  const timestamp = Date.now();
  const filename = `${category}-${name}-${timestamp}.png`;
  const filepath = path.join(__dirname, filename);
  
  try {
    await page.screenshot({ path: filepath, fullPage: true });
    testResults.screenshots.push({
      name,
      category,
      filename,
      filepath,
      timestamp: new Date().toISOString()
    });
    log(`Screenshot saved: ${filename}`);
    return filepath;
  } catch (error) {
    log(`Failed to take screenshot ${name}: ${error.message}`, 'error');
    return null;
  }
}

async function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Test functions
async function testNavigation(page) {
  log('Testing navigation functionality...');
  
  try {
    // Test navigation menu visibility
    const navMenu = await page.locator('nav').first();
    const navVisible = await navMenu.isVisible();
    recordTest('navigation', 'Navigation menu visible', navVisible, 
      navVisible ? 'Navigation menu is visible' : 'Navigation menu not found');
    
    if (navVisible) {
      await takeScreenshot(page, 'navigation-visible', 'navigation');
    }
    
    // Test main navigation links
    const navLinks = ['Home', 'Dashboard', 'Trades', 'Analytics', 'Strategies'];
    for (const linkText of navLinks) {
      try {
        const link = page.locator(`nav a:has-text("${linkText}")`).first();
        const exists = await link.count() > 0;
        recordTest('navigation', `Navigation link "${linkText}" exists`, exists,
          exists ? `Link "${linkText}" found` : `Link "${linkText}" not found`);
        
        if (exists) {
          const isVisible = await link.isVisible();
          recordTest('navigation', `Navigation link "${linkText}" visible`, isVisible,
            isVisible ? `Link "${linkText}" is visible` : `Link "${linkText}" is not visible`);
        }
      } catch (error) {
        recordTest('navigation', `Navigation link "${linkText}" check`, false,
          `Error checking link: ${error.message}`);
      }
    }
    
    // Test navigation to Dashboard
    try {
      const dashboardLink = page.locator('nav a:has-text("Dashboard")').first();
      if (await dashboardLink.count() > 0) {
        await dashboardLink.click();
        await wait(2000);
        await takeScreenshot(page, 'dashboard-navigated', 'navigation');
        
        const currentUrl = page.url();
        const dashboardReached = currentUrl.includes('/dashboard');
        recordTest('navigation', 'Navigate to Dashboard', dashboardReached,
          dashboardReached ? 'Successfully navigated to dashboard' : `Failed to reach dashboard, current URL: ${currentUrl}`);
      }
    } catch (error) {
      recordTest('navigation', 'Navigate to Dashboard', false,
        `Error navigating to dashboard: ${error.message}`);
    }
    
  } catch (error) {
    recordTest('navigation', 'Navigation test setup', false,
      `Navigation test failed: ${error.message}`);
  }
}

async function testSidebar(page) {
  log('Testing sidebar functionality...');
  
  try {
    // Test sidebar visibility on desktop
    const sidebar = page.locator('[data-testid="sidebar"], .sidebar, aside').first();
    const sidebarExists = await sidebar.count() > 0;
    recordTest('sidebar', 'Sidebar element exists', sidebarExists,
      sidebarExists ? 'Sidebar element found' : 'Sidebar element not found');
    
    if (sidebarExists) {
      const sidebarVisible = await sidebar.isVisible();
      recordTest('sidebar', 'Sidebar visible on desktop', sidebarVisible,
        sidebarVisible ? 'Sidebar is visible' : 'Sidebar is not visible');
      
      await takeScreenshot(page, 'sidebar-desktop', 'sidebar');
    }
    
    // Test mobile sidebar toggle
    try {
      // Check for mobile menu button
      const mobileMenuBtn = page.locator('[data-testid="mobile-menu-btn"], button[aria-label="Menu"], .hamburger, .menu-toggle').first();
      const mobileMenuExists = await mobileMenuBtn.count() > 0;
      recordTest('sidebar', 'Mobile menu button exists', mobileMenuExists,
        mobileMenuExists ? 'Mobile menu button found' : 'Mobile menu button not found');
      
      if (mobileMenuExists) {
        // Test mobile viewport
        await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
        await wait(1000);
        
        const mobileMenuVisible = await mobileMenuBtn.isVisible();
        recordTest('sidebar', 'Mobile menu button visible on mobile', mobileMenuVisible,
          mobileMenuVisible ? 'Mobile menu button visible on mobile' : 'Mobile menu button not visible on mobile');
        
        if (mobileMenuVisible) {
          await takeScreenshot(page, 'mobile-menu-visible', 'sidebar');
          
          // Try to toggle mobile menu
          try {
            await mobileMenuBtn.click();
            await wait(1000);
            await takeScreenshot(page, 'mobile-menu-opened', 'sidebar');
            
            const mobileSidebarVisible = await sidebar.isVisible();
            recordTest('sidebar', 'Mobile sidebar opens correctly', mobileSidebarVisible,
              mobileSidebarVisible ? 'Mobile sidebar opened successfully' : 'Mobile sidebar failed to open');
          } catch (toggleError) {
            recordTest('sidebar', 'Mobile sidebar toggle', false,
              `Error toggling mobile sidebar: ${toggleError.message}`);
          }
        }
        
        // Reset to desktop viewport
        await page.setViewportSize({ width: 1280, height: 720 });
        await wait(1000);
      }
    } catch (error) {
      recordTest('sidebar', 'Mobile sidebar test', false,
        `Error testing mobile sidebar: ${error.message}`);
    }
    
  } catch (error) {
    recordTest('sidebar', 'Sidebar test setup', false,
      `Sidebar test failed: ${error.message}`);
  }
}

async function testResponsive(page) {
  log('Testing responsive design...');
  
  const viewports = [
    { name: 'Mobile', width: 375, height: 667 },
    { name: 'Tablet', width: 768, height: 1024 },
    { name: 'Laptop', width: 1024, height: 768 },
    { name: 'Desktop', width: 1280, height: 720 }
  ];
  
  for (const viewport of viewports) {
    try {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await wait(1000);
      
      // Take screenshot for visual verification
      await takeScreenshot(page, `responsive-${viewport.name.toLowerCase()}`, 'responsive');
      
      // Check for horizontal scroll (bad responsive design)
      const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
      const viewportWidth = viewport.width;
      const hasHorizontalScroll = bodyWidth > viewportWidth;
      
      recordTest('responsive', `No horizontal scroll on ${viewport.name}`, !hasHorizontalScroll,
        !hasHorizontalScroll ? 
          `Good responsive design on ${viewport.name} (${bodyWidth}px <= ${viewportWidth}px)` :
          `Horizontal scroll detected on ${viewport.name} (${bodyWidth}px > ${viewportWidth}px)`);
      
      // Check if main content is visible
      const mainContent = page.locator('main, .main-content, #main').first();
      const mainExists = await mainContent.count() > 0;
      if (mainExists) {
        const mainVisible = await mainContent.isVisible();
        recordTest('responsive', `Main content visible on ${viewport.name}`, mainVisible,
          mainVisible ? `Main content visible on ${viewport.name}` : `Main content not visible on ${viewport.name}`);
      }
      
    } catch (error) {
      recordTest('responsive', `Responsive test for ${viewport.name}`, false,
        `Error testing ${viewport.name}: ${error.message}`);
    }
  }
  
  // Reset to desktop
  await page.setViewportSize({ width: 1280, height: 720 });
  await wait(1000);
}

async function testAuthentication(page) {
  log('Testing authentication functionality...');
  
  try {
    // Navigate to login page
    await page.goto(`${BASE_URL}/login`);
    await wait(2000);
    await takeScreenshot(page, 'login-page', 'authentication');
    
    // Check login form elements
    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
    const submitButton = page.locator('button[type="submit"], button:has-text("Login"), button:has-text("Sign In")').first();
    
    const emailExists = await emailInput.count() > 0;
    const passwordExists = await passwordInput.count() > 0;
    const submitExists = await submitButton.count() > 0;
    
    recordTest('authentication', 'Email input exists', emailExists,
      emailExists ? 'Email input found' : 'Email input not found');
    
    recordTest('authentication', 'Password input exists', passwordExists,
      passwordExists ? 'Password input found' : 'Password input not found');
    
    recordTest('authentication', 'Submit button exists', submitExists,
      submitExists ? 'Submit button found' : 'Submit button not found');
    
    if (emailExists && passwordExists && submitExists) {
      // Test login with valid credentials
      try {
        await emailInput.fill(TEST_USER.email);
        await passwordInput.fill(TEST_USER.password);
        await takeScreenshot(page, 'login-form-filled', 'authentication');
        
        await submitButton.click();
        await wait(3000); // Wait for login processing
        
        const currentUrl = page.url();
        const loginSuccessful = !currentUrl.includes('/login') && (currentUrl.includes('/dashboard') || currentUrl.endsWith('/'));
        
        recordTest('authentication', 'Login with valid credentials', loginSuccessful,
          loginSuccessful ? 'Login successful' : `Login failed, current URL: ${currentUrl}`);
        
        if (loginSuccessful) {
          await takeScreenshot(page, 'login-success', 'authentication');
        }
        
      } catch (loginError) {
        recordTest('authentication', 'Login process', false,
          `Error during login: ${loginError.message}`);
      }
    }
    
    // Test logout functionality (if login was successful)
    try {
      const logoutButton = page.locator('button:has-text("Logout"), button:has-text("Sign Out"), [data-testid="logout-btn"]').first();
      const logoutExists = await logoutButton.count() > 0;
      
      if (logoutExists) {
        await logoutButton.click();
        await wait(2000);
        
        const currentUrl = page.url();
        const logoutSuccessful = currentUrl.includes('/login') || currentUrl.includes('/auth');
        
        recordTest('authentication', 'Logout functionality', logoutSuccessful,
          logoutSuccessful ? 'Logout successful' : `Logout may have failed, current URL: ${currentUrl}`);
        
        if (logoutSuccessful) {
          await takeScreenshot(page, 'logout-success', 'authentication');
        }
      } else {
        recordTest('authentication', 'Logout button available', false,
          'Logout button not found');
      }
    } catch (logoutError) {
      recordTest('authentication', 'Logout process', false,
        `Error during logout: ${logoutError.message}`);
    }
    
  } catch (error) {
    recordTest('authentication', 'Authentication test setup', false,
      `Authentication test failed: ${error.message}`);
  }
}

async function testDashboard(page) {
  log('Testing dashboard layout and functionality...');
  
  try {
    // Navigate to dashboard
    await page.goto(`${BASE_URL}/dashboard`);
    await wait(3000);
    await takeScreenshot(page, 'dashboard-full', 'dashboard');
    
    // Check dashboard container
    const dashboardContainer = page.locator('[data-testid="dashboard"], .dashboard, main').first();
    const dashboardExists = await dashboardContainer.count() > 0;
    recordTest('dashboard', 'Dashboard container exists', dashboardExists,
      dashboardExists ? 'Dashboard container found' : 'Dashboard container not found');
    
    if (dashboardExists) {
      const dashboardVisible = await dashboardContainer.isVisible();
      recordTest('dashboard', 'Dashboard visible', dashboardVisible,
        dashboardVisible ? 'Dashboard is visible' : 'Dashboard is not visible');
    }
    
    // Check for common dashboard elements
    const dashboardElements = [
      { selector: '[data-testid="stats-cards"], .stats, .metrics', name: 'Stats cards' },
      { selector: '[data-testid="chart"], .chart, canvas', name: 'Charts' },
      { selector: '[data-testid="recent-trades"], .recent-trades, .trades-table', name: 'Recent trades' },
      { selector: '[data-testid="performance"], .performance', name: 'Performance metrics' }
    ];
    
    for (const element of dashboardElements) {
      try {
        const el = page.locator(element.selector).first();
        const exists = await el.count() > 0;
        recordTest('dashboard', element.name, exists,
          exists ? `${element.name} found` : `${element.name} not found`);
      } catch (error) {
        recordTest('dashboard', element.name, false,
          `Error checking ${element.name}: ${error.message}`);
      }
    }
    
    // Test dashboard centering and layout
    try {
      const dashboardCentered = await page.evaluate(() => {
        const dashboard = document.querySelector('[data-testid="dashboard"], .dashboard, main');
        if (!dashboard) return false;
        
        const styles = window.getComputedStyle(dashboard);
        return styles.marginLeft === 'auto' && styles.marginRight === 'auto' ||
               styles.display === 'flex' && styles.justifyContent === 'center' ||
               styles.display === 'grid' && styles.justifyItems === 'center';
      });
      
      recordTest('dashboard', 'Dashboard properly centered', dashboardCentered,
        dashboardCentered ? 'Dashboard is properly centered' : 'Dashboard may not be properly centered');
      
    } catch (layoutError) {
      recordTest('dashboard', 'Dashboard layout check', false,
        `Error checking dashboard layout: ${layoutError.message}`);
    }
    
  } catch (error) {
    recordTest('dashboard', 'Dashboard test setup', false,
      `Dashboard test failed: ${error.message}`);
  }
}

async function testInteractiveElements(page) {
  log('Testing interactive elements and forms...');
  
  try {
    // Test buttons
    const buttons = page.locator('button').all();
    const buttonCount = await (await buttons).length;
    recordTest('interactive', 'Buttons present', buttonCount > 0,
      `Found ${buttonCount} buttons on the page`);
    
    // Test forms
    const forms = page.locator('form').all();
    const formCount = await (await forms).length;
    recordTest('interactive', 'Forms present', formCount > 0,
      `Found ${formCount} forms on the page`);
    
    // Test input fields
    const inputs = page.locator('input, select, textarea').all();
    const inputCount = await (await inputs).length;
    recordTest('interactive', 'Input fields present', inputCount > 0,
      `Found ${inputCount} input fields on the page`);
    
    // Test clickable elements
    const clickables = page.locator('a, button, [role="button"], [onclick]').all();
    const clickableCount = await (await clickables).length;
    recordTest('interactive', 'Clickable elements present', clickableCount > 0,
      `Found ${clickableCount} clickable elements on the page`);
    
    // Test modal functionality (if modals exist)
    try {
      const modalTriggers = page.locator('[data-testid="modal-trigger"], button:has-text("Add"), button:has-text("Create"), button:has-text("New")').all();
      const modalTriggerCount = await (await modalTriggers).length;
      
      if (modalTriggerCount > 0) {
        const firstTrigger = (await modalTriggers)[0];
        await firstTrigger.click();
        await wait(1000);
        
        const modal = page.locator('[data-testid="modal"], .modal, [role="dialog"]').first();
        const modalExists = await modal.count() > 0;
        recordTest('interactive', 'Modal opens correctly', modalExists,
          modalExists ? 'Modal opened successfully' : 'Modal failed to open');
        
        if (modalExists) {
          await takeScreenshot(page, 'modal-open', 'interactive');
          
          // Try to close modal
          const closeBtn = modal.locator('button:has-text("Close"), button:has-text("Cancel"), [aria-label="Close"]').first();
          if (await closeBtn.count() > 0) {
            await closeBtn.click();
            await wait(500);
            
            const modalVisible = await modal.isVisible();
            recordTest('interactive', 'Modal closes correctly', !modalVisible,
              !modalVisible ? 'Modal closed successfully' : 'Modal failed to close');
          }
        }
      }
    } catch (modalError) {
      recordTest('interactive', 'Modal functionality', false,
        `Error testing modal: ${modalError.message}`);
    }
    
    // Test dropdown/select functionality
    try {
      const selects = page.locator('select, [data-testid="dropdown"], .dropdown').all();
      const selectCount = await (await selects).length;
      
      if (selectCount > 0) {
        recordTest('interactive', 'Dropdown elements present', true,
          `Found ${selectCount} dropdown elements`);
        
        // Test first dropdown
        const firstSelect = (await selects)[0];
        await firstSelect.click();
        await wait(500);
        
        const optionsVisible = await page.locator('option, .dropdown-option, [role="option"]').first().isVisible();
        recordTest('interactive', 'Dropdown options visible', optionsVisible,
          optionsVisible ? 'Dropdown options are visible' : 'Dropdown options not visible');
      }
    } catch (dropdownError) {
      recordTest('interactive', 'Dropdown functionality', false,
        `Error testing dropdown: ${dropdownError.message}`);
    }
    
  } catch (error) {
    recordTest('interactive', 'Interactive elements test setup', false,
      `Interactive elements test failed: ${error.message}`);
  }
}

async function runComprehensiveTest() {
  let browser;
  let page;
  
  try {
    log('Starting comprehensive restoration test...');
    
    // Launch browser
    browser = await chromium.launch({ 
      headless: false, // Set to true for headless mode
      slowMo: 500 // Slow down actions for better visibility
    });
    
    page = await browser.newPage();
    
    // Set default viewport
    await page.setViewportSize({ width: 1280, height: 720 });
    
    // Navigate to base URL
    log(`Navigating to ${BASE_URL}...`);
    await page.goto(BASE_URL);
    await wait(3000); // Wait for initial load
    
    // Take initial screenshot
    await takeScreenshot(page, 'initial-load', 'general');
    
    // Check if page loaded successfully
    let pageLoaded = false;
    let pageTitle = '';
    let loadError = '';
    
    try {
      // Wait for page to be ready
      await page.waitForLoadState('networkidle', { timeout: 10000 });
      
      // Check for page title
      pageTitle = await page.title();
      
      // Check for body content
      const bodyContent = await page.locator('body').textContent();
      const hasContent = bodyContent && bodyContent.length > 0;
      
      // Check for error pages
      const hasError = await page.locator('text=404, text=error, text=Error, text=Application error').count() > 0;
      
      pageLoaded = pageTitle && pageTitle.length > 0 && hasContent && !hasError;
      loadError = hasError ? 'Error page detected' : !hasContent ? 'No page content found' : !pageTitle ? 'No page title found' : '';
      
    } catch (error) {
      loadError = `Page load error: ${error.message}`;
      pageLoaded = false;
    }
    
    recordTest('general', 'Page loads successfully', pageLoaded,
      pageLoaded ? `Page loaded successfully with title: ${pageTitle}` : `Page failed to load: ${loadError}`);
    
    if (!pageLoaded) {
      log(`Page failed to load: ${loadError}. Continuing with limited tests...`, 'error');
      // Don't return, continue with tests to see what we can verify
    }
    
    // Run all test categories
    await testNavigation(page);
    await testSidebar(page);
    await testResponsive(page);
    await testAuthentication(page);
    await testDashboard(page);
    await testInteractiveElements(page);
    
    log('All tests completed!');
    
  } catch (error) {
    log(`Test execution failed: ${error.message}`, 'error');
    testResults.errors.push({
      timestamp: new Date().toISOString(),
      message: `Test execution failed: ${error.message}`,
      stack: error.stack
    });
  } finally {
    if (page) {
      await takeScreenshot(page, 'final-state', 'general');
    }
    
    if (browser) {
      await browser.close();
    }
    
    // Save test results
    const resultsFile = `comprehensive-restoration-test-results-${Date.now()}.json`;
    const resultsPath = path.join(__dirname, resultsFile);
    
    try {
      fs.writeFileSync(resultsPath, JSON.stringify(testResults, null, 2));
      log(`Test results saved to: ${resultsFile}`);
    } catch (writeError) {
      log(`Failed to save test results: ${writeError.message}`, 'error');
    }
    
    // Generate summary report
    generateSummaryReport();
  }
}

function generateSummaryReport() {
  const report = `
# Comprehensive Restoration Test Report

## Test Summary
- **Timestamp:** ${testResults.timestamp}
- **Total Tests:** ${testResults.summary.total}
- **Passed:** ${testResults.summary.passed}
- **Failed:** ${testResults.summary.failed}
- **Success Rate:** ${((testResults.summary.passed / testResults.summary.total) * 100).toFixed(2)}%

## Test Categories

### Navigation Tests
- **Total:** ${testResults.categories.navigation.tests.length}
- **Passed:** ${testResults.categories.navigation.passed}
- **Failed:** ${testResults.categories.navigation.failed}

${testResults.categories.navigation.tests.map(test => 
  `- ${test.passed ? '✅' : '❌'} ${test.name}: ${test.details}`
).join('\n')}

### Sidebar Tests
- **Total:** ${testResults.categories.sidebar.tests.length}
- **Passed:** ${testResults.categories.sidebar.passed}
- **Failed:** ${testResults.categories.sidebar.failed}

${testResults.categories.sidebar.tests.map(test => 
  `- ${test.passed ? '✅' : '❌'} ${test.name}: ${test.details}`
).join('\n')}

### Responsive Design Tests
- **Total:** ${testResults.categories.responsive.tests.length}
- **Passed:** ${testResults.categories.responsive.passed}
- **Failed:** ${testResults.categories.responsive.failed}

${testResults.categories.responsive.tests.map(test => 
  `- ${test.passed ? '✅' : '❌'} ${test.name}: ${test.details}`
).join('\n')}

### Authentication Tests
- **Total:** ${testResults.categories.authentication.tests.length}
- **Passed:** ${testResults.categories.authentication.passed}
- **Failed:** ${testResults.categories.authentication.failed}

${testResults.categories.authentication.tests.map(test => 
  `- ${test.passed ? '✅' : '❌'} ${test.name}: ${test.details}`
).join('\n')}

### Dashboard Tests
- **Total:** ${testResults.categories.dashboard.tests.length}
- **Passed:** ${testResults.categories.dashboard.passed}
- **Failed:** ${testResults.categories.dashboard.failed}

${testResults.categories.dashboard.tests.map(test => 
  `- ${test.passed ? '✅' : '❌'} ${test.name}: ${test.details}`
).join('\n')}

### Interactive Elements Tests
- **Total:** ${testResults.categories.interactive.tests.length}
- **Passed:** ${testResults.categories.interactive.passed}
- **Failed:** ${testResults.categories.interactive.failed}

${testResults.categories.interactive.tests.map(test => 
  `- ${test.passed ? '✅' : '❌'} ${test.name}: ${test.details}`
).join('\n')}

## Screenshots Taken
${testResults.screenshots.map(screenshot => 
  `- ${screenshot.category}/${screenshot.filename}`
).join('\n')}

## Errors
${testResults.errors.length > 0 ? 
  testResults.errors.map(error => 
    `- [${error.timestamp}] ${error.message}`
  ).join('\n') : 
  'No errors encountered.'
}

## Recommendations
${testResults.summary.failed > 0 ? 
  'Some tests failed. Please review the failed tests and address the issues identified above.' :
  'All tests passed! The application appears to be functioning correctly after the import fixes.'
}
`;
  
  const reportFile = `COMPREHENSIVE_RESTORATION_TEST_REPORT_${new Date().toISOString().replace(/[:.]/g, '-')}.md`;
  const reportPath = path.join(__dirname, reportFile);
  
  try {
    fs.writeFileSync(reportPath, report);
    log(`Summary report saved to: ${reportFile}`);
  } catch (writeError) {
    log(`Failed to save summary report: ${writeError.message}`, 'error');
  }
  
  // Also log to console
  console.log('\n' + '='.repeat(80));
  console.log('COMPREHENSIVE RESTORATION TEST SUMMARY');
  console.log('='.repeat(80));
  console.log(`Total Tests: ${testResults.summary.total}`);
  console.log(`Passed: ${testResults.summary.passed}`);
  console.log(`Failed: ${testResults.summary.failed}`);
  console.log(`Success Rate: ${((testResults.summary.passed / testResults.summary.total) * 100).toFixed(2)}%`);
  console.log('='.repeat(80));
}

// Run the test
if (require.main === module) {
  runComprehensiveTest().catch(error => {
    log(`Test runner failed: ${error.message}`, 'error');
    process.exit(1);
  });
}

module.exports = { runComprehensiveTest };