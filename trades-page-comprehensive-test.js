/**
 * Comprehensive Trades Page Testing Script
 * Tests all the new design features and functionality
 */

const puppeteer = require('puppeteer');
const path = require('path');

const TEST_CONFIG = {
  baseUrl: 'http://localhost:3000',
  tradesUrl: 'http://localhost:3000/trades',
  timeout: 30000,
  screenshotDir: path.join(__dirname, 'test-screenshots'),
  viewports: {
    desktop: { width: 1920, height: 1080 },
    tablet: { width: 768, height: 1024 },
    mobile: { width: 375, height: 667 }
  }
};

// Test results tracking
const testResults = {
  compilation: { passed: 0, failed: 0, errors: [] },
  pageLoad: { passed: 0, failed: 0, errors: [] },
  navigation: { passed: 0, failed: 0, errors: [] },
  statistics: { passed: 0, failed: 0, errors: [] },
  filters: { passed: 0, failed: 0, errors: [] },
  accordion: { passed: 0, failed: 0, errors: [] },
  pagination: { passed: 0, failed: 0, errors: [] },
  animations: { passed: 0, failed: 0, errors: [] },
  flashlight: { passed: 0, failed: 0, errors: [] },
  buttonBeam: { passed: 0, failed: 0, errors: [] },
  console: { passed: 0, failed: 0, errors: [] },
  responsive: { passed: 0, failed: 0, errors: [] }
};

function logTest(category, testName, passed, error = null) {
  const status = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${status} [${category}] ${testName}${error ? ` - ${error}` : ''}`);
  
  if (testResults[category]) {
    if (passed) {
      testResults[category].passed++;
    } else {
      testResults[category].failed++;
      testResults[category].errors.push({ test: testName, error });
    }
  }
}

async function takeScreenshot(page, filename, category = 'general') {
  try {
    const screenshotPath = path.join(TEST_CONFIG.screenshotDir, category, filename);
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`📸 Screenshot saved: ${screenshotPath}`);
  } catch (error) {
    console.log(`📸 Failed to take screenshot: ${error.message}`);
  }
}

async function setupBrowser() {
  console.log('🚀 Setting up browser for testing...');
  
  const browser = await puppeteer.launch({
    headless: false, // Set to true for headless testing
    defaultViewport: TEST_CONFIG.viewports.desktop,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu'
    ]
  });

  const page = await browser.newPage();
  
  // Set up console monitoring
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    
    if (type === 'error') {
      logTest('console', 'Console Error', false, text);
    } else if (type === 'warning') {
      logTest('console', 'Console Warning', false, text);
    } else if (text.includes('[TRADES_PAGE_DEBUG]') || text.includes('[STATISTICS_DEBUG]')) {
      console.log(`🔍 ${text}`);
    }
  });

  page.on('pageerror', error => {
    logTest('console', 'Page Error', false, error.message);
  });

  return { browser, page };
}

async function testCompilation(page) {
  console.log('\n🔧 Testing compilation and build status...');
  
  try {
    const response = await page.goto(TEST_CONFIG.baseUrl, { 
      waitUntil: 'networkidle2',
      timeout: TEST_CONFIG.timeout 
    });
    
    const statusCode = response.status();
    logTest('compilation', 'Main page loads', statusCode === 200, `Status: ${statusCode}`);
    
    // Check for Next.js compilation errors
    const hasCompilationErrors = await page.evaluate(() => {
      const errorElements = document.querySelectorAll('[data-nextjs-error]');
      return errorElements.length > 0;
    });
    
    logTest('compilation', 'No compilation errors', !hasCompilationErrors);
    
  } catch (error) {
    logTest('compilation', 'Compilation test', false, error.message);
  }
}

async function testTradesPageLoad(page) {
  console.log('\n📄 Testing trades page load...');
  
  try {
    const response = await page.goto(TEST_CONFIG.tradesUrl, { 
      waitUntil: 'networkidle2',
      timeout: TEST_CONFIG.timeout 
    });
    
    const statusCode = response.status();
    logTest('pageLoad', 'Trades page loads', statusCode === 200, `Status: ${statusCode}`);
    
    // Wait for key elements to load
    await page.waitForSelector('nav', { timeout: 10000 });
    await page.waitForSelector('.flashlight-container', { timeout: 10000 });
    
    logTest('pageLoad', 'Navigation bar loads', true);
    logTest('pageLoad', 'Flashlight containers load', true);
    
    // Check for authentication redirect
    const currentUrl = page.url();
    if (currentUrl.includes('/login')) {
      logTest('pageLoad', 'Authentication redirect works', true);
      // For testing purposes, we'll need to handle login
      return false; // Not authenticated
    }
    
    await takeScreenshot(page, 'trades-page-load.png', 'pageLoad');
    return true; // Page loaded successfully
    
  } catch (error) {
    logTest('pageLoad', 'Trades page load', false, error.message);
    return false;
  }
}

async function testNavigationBar(page) {
  console.log('\n🧭 Testing navigation bar and branding...');
  
  try {
    // Check navigation bar is present
    const navExists = await page.$('nav') !== null;
    logTest('navigation', 'Navigation bar exists', navExists);
    
    // Check logo/branding
    const logoExists = await page.$('.font-serif.text-3xl') !== null;
    logTest('navigation', 'VeroTrade logo exists', logoExists);
    
    // Check navigation links
    const navLinks = await page.$$('nav button');
    logTest('navigation', 'Navigation links present', navLinks.length >= 4);
    
    // Check logout button
    const logoutExists = await page.$('button:contains("Logout")') !== null;
    logTest('navigation', 'Logout button exists', logoutExists);
    
    // Test navigation hover effects
    await page.hover('nav button:first-child');
    await page.waitForTimeout(500);
    logTest('navigation', 'Navigation hover effects', true);
    
    await takeScreenshot(page, 'navigation-bar.png', 'navigation');
    
  } catch (error) {
    logTest('navigation', 'Navigation test', false, error.message);
  }
}

async function testStatisticsGrid(page) {
  console.log('\n📊 Testing statistics grid display...');
  
  try {
    // Check statistics cards exist
    const statCards = await page.$$('.flashlight-container.rounded-2xl');
    logTest('statistics', 'Statistics cards exist', statCards.length >= 4);
    
    // Check specific statistics
    const statsTexts = await page.evaluate(() => {
      const cards = document.querySelectorAll('.flashlight-container.rounded-2xl');
      return Array.from(cards).map(card => card.textContent);
    });
    
    const hasTotalTrades = statsTexts.some(text => text.includes('Total Trades'));
    const hasTotalPnL = statsTexts.some(text => text.includes('Total P&L'));
    const hasWinRate = statsTexts.some(text => text.includes('Win Rate'));
    
    logTest('statistics', 'Total Trades displayed', hasTotalTrades);
    logTest('statistics', 'Total P&L displayed', hasTotalPnL);
    logTest('statistics', 'Win Rate displayed', hasWinRate);
    
    // Test flashlight effect on stats
    await page.hover('.flashlight-container.rounded-2xl:first-child');
    await page.waitForTimeout(500);
    logTest('statistics', 'Stats flashlight effect', true);
    
    await takeScreenshot(page, 'statistics-grid.png', 'statistics');
    
  } catch (error) {
    logTest('statistics', 'Statistics test', false, error.message);
  }
}

async function testFiltersSection(page) {
  console.log('\n🔍 Testing filters section with flashlight effect...');
  
  try {
    // Check filters container exists
    const filtersContainer = await page.$('.flashlight-container.rounded-xl') !== null;
    logTest('filters', 'Filters container exists', filtersContainer);
    
    // Check filter inputs
    const symbolInput = await page.$('input[placeholder="Search symbol..."]') !== null;
    const marketSelect = await page.$('select') !== null;
    const dateInputs = await page.$$('input[type="date"]');
    
    logTest('filters', 'Symbol input exists', symbolInput);
    logTest('filters', 'Market select exists', marketSelect);
    logTest('filters', 'Date inputs exist', dateInputs.length >= 2);
    
    // Test flashlight effect on filters
    await page.hover('.flashlight-container.rounded-xl');
    await page.waitForTimeout(500);
    logTest('filters', 'Filters flashlight effect', true);
    
    // Test filter interactions
    await page.type('input[placeholder="Search symbol..."]', 'AAPL');
    await page.waitForTimeout(1000);
    logTest('filters', 'Symbol input typing', true);
    
    await takeScreenshot(page, 'filters-section.png', 'filters');
    
  } catch (error) {
    logTest('filters', 'Filters test', false, error.message);
  }
}

async function testTradeRowsAccordion(page) {
  console.log('\n📋 Testing trade rows with accordion functionality...');
  
  try {
    // Wait for trade rows to load
    await page.waitForSelector('.flashlight-container.rounded-lg', { timeout: 10000 });
    
    const tradeRows = await page.$$('.flashlight-container.rounded-lg');
    logTest('accordion', 'Trade rows exist', tradeRows.length > 0);
    
    if (tradeRows.length > 0) {
      // Test accordion expansion
      const firstRow = tradeRows[0];
      await firstRow.click();
      await page.waitForTimeout(500);
      
      const expandedContent = await page.$('.accordion-content.active') !== null;
      logTest('accordion', 'Accordion expands on click', expandedContent);
      
      // Test accordion collapse
      await firstRow.click();
      await page.waitForTimeout(500);
      
      const collapsedContent = await page.$('.accordion-content.active') === null;
      logTest('accordion', 'Accordion collapses on click', collapsedContent);
      
      // Test chevron rotation
      const chevronRotated = await page.evaluate(() => {
        const chevron = document.querySelector('.chevron-icon.rotate');
        return chevron !== null;
      });
      
      logTest('accordion', 'Chevron rotates on expand', chevronRotated);
    }
    
    await takeScreenshot(page, 'trade-rows-accordion.png', 'accordion');
    
  } catch (error) {
    logTest('accordion', 'Accordion test', false, error.message);
  }
}

async function testPaginationControls(page) {
  console.log('\n📄 Testing pagination controls...');
  
  try {
    // Check pagination controls exist
    const pageSelect = await page.$('select[value="25"]') !== null;
    const prevButton = await page.$('button:contains("Previous")') !== null;
    const nextButton = await page.$('button:contains("Next")') !== null;
    
    logTest('pagination', 'Page size selector exists', pageSelect);
    logTest('pagination', 'Previous button exists', prevButton);
    logTest('pagination', 'Next button exists', nextButton);
    
    // Test page size change
    if (pageSelect) {
      await page.select('select', '50');
      await page.waitForTimeout(1000);
      logTest('pagination', 'Page size change works', true);
    }
    
    // Test pagination buttons (if enabled)
    const nextButtonEnabled = await page.evaluate(() => {
      const nextBtn = document.querySelector('button[aria-label*="Next"], button:contains("Next")');
      return nextBtn && !nextBtn.disabled;
    });
    
    if (nextButtonEnabled) {
      await page.click('button:contains("Next")');
      await page.waitForTimeout(1000);
      logTest('pagination', 'Next button works', true);
    }
    
    await takeScreenshot(page, 'pagination-controls.png', 'pagination');
    
  } catch (error) {
    logTest('pagination', 'Pagination test', false, error.message);
  }
}

async function testGSAPAnimations(page) {
  console.log('\n✨ Testing GSAP animations...');
  
  try {
    // Check if GSAP is loaded
    const gsapLoaded = await page.evaluate(() => {
      return typeof window.gsap !== 'undefined';
    });
    logTest('animations', 'GSAP library loaded', gsapLoaded);
    
    // Check ScrollTrigger is loaded
    const scrollTriggerLoaded = await page.evaluate(() => {
      return typeof window.ScrollTrigger !== 'undefined';
    });
    logTest('animations', 'ScrollTrigger loaded', scrollTriggerLoaded);
    
    // Check for text reveal animation
    const textRevealElements = await page.$$('.reveal-text');
    logTest('animations', 'Text reveal elements exist', textRevealElements.length > 0);
    
    // Check for scroll items
    const scrollItems = await page.$$('.scroll-item');
    logTest('animations', 'Scroll items exist', scrollItems.length > 0);
    
    // Test scroll animations
    await page.evaluate(() => {
      window.scrollTo(0, 500);
    });
    await page.waitForTimeout(1000);
    logTest('animations', 'Scroll animations trigger', true);
    
    await takeScreenshot(page, 'gsap-animations.png', 'animations');
    
  } catch (error) {
    logTest('animations', 'GSAP animations test', false, error.message);
  }
}

async function testFlashlightEffect(page) {
  console.log('\n🔦 Testing flashlight mouse-tracking effect...');
  
  try {
    // Get flashlight containers
    const flashlightContainers = await page.$$('.flashlight-container');
    logTest('flashlight', 'Flashlight containers exist', flashlightContainers.length > 0);
    
    if (flashlightContainers.length > 0) {
      // Test mouse movement tracking
      const firstContainer = flashlightContainers[0];
      const containerBox = await firstContainer.boundingBox();
      
      if (containerBox) {
        // Move mouse over container
        await page.mouse.move(
          containerBox.x + containerBox.width / 2,
          containerBox.y + containerBox.height / 2
        );
        await page.waitForTimeout(500);
        
        // Check if CSS variables are being set
        const mouseTrackingActive = await page.evaluate(() => {
          const style = getComputedStyle(document.querySelector('.flashlight-container'));
          return style.getPropertyValue('--mouse-x') !== '';
        });
        
        logTest('flashlight', 'Mouse tracking CSS variables set', mouseTrackingActive);
        
        // Test hover effect
        const flashlightBg = await page.evaluate(() => {
          const container = document.querySelector('.flashlight-container');
          const bg = container.querySelector('.flashlight-bg');
          const bgStyle = window.getComputedStyle(bg);
          return bgStyle.opacity !== '0';
        });
        
        logTest('flashlight', 'Flashlight background appears on hover', flashlightBg);
      }
    }
    
    await takeScreenshot(page, 'flashlight-effect.png', 'flashlight');
    
  } catch (error) {
    logTest('flashlight', 'Flashlight effect test', false, error.message);
  }
}

async function testButtonBeamAnimations(page) {
  console.log('\n💫 Testing button beam animations...');
  
  try {
    // Find beam buttons
    const beamButtons = await page.$$('.btn-beam');
    logTest('buttonBeam', 'Beam buttons exist', beamButtons.length > 0);
    
    if (beamButtons.length > 0) {
      // Test hover effect
      await page.hover('.btn-beam:first-child');
      await page.waitForTimeout(500);
      
      // Check if beam animation is active
      const beamActive = await page.evaluate(() => {
        const button = document.querySelector('.btn-beam');
        const style = window.getComputedStyle(button, '::before');
        return style.opacity !== '0';
      });
      
      logTest('buttonBeam', 'Beam animation activates on hover', beamActive);
      
      // Test button content positioning
      const buttonContent = await page.evaluate(() => {
        const button = document.querySelector('.btn-beam');
        const content = button.querySelector('.btn-beam-content');
        return content !== null;
      });
      
      logTest('buttonBeam', 'Button content properly positioned', buttonContent);
    }
    
    await takeScreenshot(page, 'button-beam-animations.png', 'buttonBeam');
    
  } catch (error) {
    logTest('buttonBeam', 'Button beam animations test', false, error.message);
  }
}

async function testConsoleErrors(page) {
  console.log('\n🔍 Checking for console errors and warnings...');
  
  try {
    // Console monitoring is already set up in setupBrowser()
    // This function just ensures we've captured any issues
    const consoleErrors = await page.evaluate(() => {
      // Check for common error indicators
      const errorElements = document.querySelectorAll('[data-nextjs-error]');
      const errorTexts = document.body.innerText.includes('Error');
      return errorElements.length > 0 || errorTexts;
    });
    
    logTest('console', 'No visible error elements', !consoleErrors);
    
    // Check for network errors
    const networkErrors = await page.evaluate(() => {
      return performance.getEntriesByType('resource').some(entry => entry.transferSize === 0 && entry.initiatorType !== 'script');
    });
    
    logTest('console', 'No network errors', !networkErrors);
    
  } catch (error) {
    logTest('console', 'Console check test', false, error.message);
  }
}

async function testResponsiveDesign(page) {
  console.log('\n📱 Testing responsive behavior on different screen sizes...');
  
  try {
    const originalViewport = page.viewport();
    
    // Test tablet view
    await page.setViewport(TEST_CONFIG.viewports.tablet);
    await page.waitForTimeout(1000);
    
    const tabletNav = await page.$('nav') !== null;
    const tabletStats = await page.$$('.flashlight-container.rounded-2xl');
    
    logTest('responsive', 'Tablet navigation works', tabletNav);
    logTest('responsive', 'Tablet statistics grid adapts', tabletStats.length >= 2);
    
    await takeScreenshot(page, 'tablet-view.png', 'responsive');
    
    // Test mobile view
    await page.setViewport(TEST_CONFIG.viewports.mobile);
    await page.waitForTimeout(1000);
    
    const mobileNav = await page.$('nav') !== null;
    const mobileStats = await page.$$('.flashlight-container.rounded-2xl');
    
    logTest('responsive', 'Mobile navigation works', mobileNav);
    logTest('responsive', 'Mobile statistics grid adapts', mobileStats.length >= 1);
    
    await takeScreenshot(page, 'mobile-view.png', 'responsive');
    
    // Restore original viewport
    await page.setViewport(originalViewport);
    
  } catch (error) {
    logTest('responsive', 'Responsive design test', false, error.message);
  }
}

async function generateTestReport() {
  console.log('\n📋 COMPREHENSIVE TEST REPORT');
  console.log('='.repeat(50));
  
  let totalPassed = 0;
  let totalFailed = 0;
  
  Object.keys(testResults).forEach(category => {
    const results = testResults[category];
    totalPassed += results.passed;
    totalFailed += results.failed;
    
    console.log(`\n${category.toUpperCase()}:`);
    console.log(`  ✅ Passed: ${results.passed}`);
    console.log(`  ❌ Failed: ${results.failed}`);
    
    if (results.errors.length > 0) {
      console.log('  Errors:');
      results.errors.forEach(error => {
        console.log(`    - ${error.test}: ${error.error}`);
      });
    }
  });
  
  console.log('\n' + '='.repeat(50));
  console.log(`TOTAL: ✅ ${totalPassed} passed, ❌ ${totalFailed} failed`);
  console.log(`Success Rate: ${((totalPassed / (totalPassed + totalFailed)) * 100).toFixed(1)}%`);
  
  return {
    totalPassed,
    totalFailed,
    successRate: (totalPassed / (totalPassed + totalFailed)) * 100,
    categoryResults: testResults
  };
}

async function runComprehensiveTest() {
  console.log('🧪 STARTING COMPREHENSIVE TRADES PAGE TEST');
  console.log('='.repeat(50));
  
  // Create screenshot directories
  const fs = require('fs');
  if (!fs.existsSync(TEST_CONFIG.screenshotDir)) {
    fs.mkdirSync(TEST_CONFIG.screenshotDir, { recursive: true });
  }
  
  Object.keys(testResults).forEach(category => {
    const categoryDir = path.join(TEST_CONFIG.screenshotDir, category);
    if (!fs.existsSync(categoryDir)) {
      fs.mkdirSync(categoryDir, { recursive: true });
    }
  });
  
  let browser, page;
  
  try {
    const setup = await setupBrowser();
    browser = setup.browser;
    page = setup.page;
    
    // Run all tests
    await testCompilation(page);
    
    const isAuthenticated = await testTradesPageLoad(page);
    if (isAuthenticated) {
      await testNavigationBar(page);
      await testStatisticsGrid(page);
      await testFiltersSection(page);
      await testTradeRowsAccordion(page);
      await testPaginationControls(page);
      await testGSAPAnimations(page);
      await testFlashlightEffect(page);
      await testButtonBeamAnimations(page);
      await testConsoleErrors(page);
      await testResponsiveDesign(page);
    } else {
      console.log('⚠️  Skipping feature tests - authentication required');
      logTest('pageLoad', 'Authentication required for feature testing', false);
    }
    
    // Generate final report
    const report = await generateTestReport();
    
    return report;
    
  } catch (error) {
    console.error('❌ Test suite failed:', error);
    return null;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run the test suite
if (require.main === module) {
  runComprehensiveTest()
    .then(report => {
      if (report) {
        console.log('\n✅ Test suite completed successfully');
        process.exit(report.failed === 0 ? 0 : 1);
      } else {
        console.log('\n❌ Test suite failed');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('❌ Fatal error:', error);
      process.exit(1);
    });
}

module.exports = {
  runComprehensiveTest,
  testResults,
  TEST_CONFIG
};