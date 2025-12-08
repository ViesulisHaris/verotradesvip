const puppeteer = require('puppeteer');
const path = require('path');

async function testDashboardFunctionality() {
  console.log('🚀 Starting Dashboard Functionality Test...\n');
  
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1920, height: 1080 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  // Enable console logging from the browser
  page.on('console', msg => {
    console.log('🌐 Browser Console:', msg.text());
  });
  
  // Enable request monitoring
  page.on('request', request => {
    if (request.url().includes('/api/')) {
      console.log('📡 API Request:', request.method(), request.url());
    }
  });
  
  page.on('response', response => {
    if (response.url().includes('/api/')) {
      console.log('📡 API Response:', response.status(), response.url());
    }
  });
  
  const testResults = {
    passed: 0,
    failed: 0,
    details: []
  };
  
  try {
    // Test 1: Navigate to dashboard page
    console.log('📍 Test 1: Navigating to dashboard page...');
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle2' });
    
    // Check if we need to login first
    const loginNeeded = await page.$('input[type="email"]') !== null;
    
    if (loginNeeded) {
      console.log('🔐 Login required, performing test login...');
      await page.type('input[type="email"]', 'test@example.com');
      await page.type('input[type="password"]', 'testpassword123');
      await page.click('button[type="submit"]');
      await page.waitForNavigation({ waitUntil: 'networkidle2' });
    }
    
    // Navigate to dashboard
    await page.goto('http://localhost:3000/dashboard', { waitUntil: 'networkidle2' });
    await new Promise(resolve => setTimeout(resolve, 2000)); // Allow animations to load
    
    const currentUrl = page.url();
    if (currentUrl.includes('/dashboard')) {
      console.log('✅ Successfully navigated to dashboard page');
      testResults.passed++;
      testResults.details.push('✅ Navigation to dashboard successful');
    } else {
      console.log('❌ Failed to navigate to dashboard page');
      testResults.failed++;
      testResults.details.push('❌ Navigation to dashboard failed');
    }
    
    // Test 2: Check header component is present and working
    console.log('\n📍 Test 2: Checking header component...');
    const headerExists = await page.$('header.verotrade-top-navigation') !== null;
    if (headerExists) {
      console.log('✅ Header component is present');
      testResults.passed++;
      testResults.details.push('✅ Header component present');
      
      // Check logo
      const logoExists = await page.evaluate(() => {
        const header = document.querySelector('header.verotrade-top-navigation');
        return header && header.textContent.includes('VeroTrade');
      });
      
      if (logoExists) {
        console.log('✅ VeroTrade logo is present in header');
        testResults.passed++;
        testResults.details.push('✅ VeroTrade logo present');
      } else {
        console.log('❌ VeroTrade logo not found in header');
        testResults.failed++;
        testResults.details.push('❌ VeroTrade logo missing');
      }
      
      // Check navigation icons
      const navIcons = await page.$$('nav a');
      if (navIcons.length >= 5) {
        console.log(`✅ Navigation icons present (${navIcons.length} found)`);
        testResults.passed++;
        testResults.details.push(`✅ Navigation icons present: ${navIcons.length}`);
      } else {
        console.log(`❌ Insufficient navigation icons (${navIcons.length} found)`);
        testResults.failed++;
        testResults.details.push(`❌ Insufficient navigation icons: ${navIcons.length}`);
      }
    } else {
      console.log('❌ Header component is missing');
      testResults.failed++;
      testResults.details.push('❌ Header component missing');
    }
    
    // Test 3: Check dashboard title and main content
    console.log('\n📍 Test 3: Checking dashboard main content...');
    // Wait a bit for content to render
    await new Promise(resolve => setTimeout(resolve, 2000));
    const dashboardTitle = await page.evaluate(() => {
      const titleElement = document.querySelector('h1, .text-5xl');
      return titleElement ? titleElement.textContent : null;
    });
    
    console.log(`Found title: "${dashboardTitle}"`);
    
    // Normalize the title by replacing non-breaking spaces and trimming
    const normalizedTitle = dashboardTitle ? dashboardTitle.replace(/\u00A0/g, ' ').trim() : '';
    
    if (normalizedTitle === 'Trading Dashboard' || normalizedTitle.includes('Trading Dashboard')) {
      console.log('✅ Dashboard title is present');
      testResults.passed++;
      testResults.details.push('✅ Dashboard title present');
    } else {
      console.log('❌ Dashboard title not found');
      console.log(`Found title: "${dashboardTitle}"`);
      console.log(`Normalized title: "${normalizedTitle}"`);
      testResults.failed++;
      testResults.details.push('❌ Dashboard title missing');
    }
    
    // Test 4: Check key metrics cards
    console.log('\n📍 Test 4: Checking key metrics cards...');
    const metricsCards = await page.$$('.flashlight-card');
    if (metricsCards.length >= 4) {
      console.log(`✅ Key metrics cards present (${metricsCards.length} found)`);
      testResults.passed++;
      testResults.details.push(`✅ Key metrics cards present: ${metricsCards.length}`);
      
      // Check specific metrics
      const metricsText = await page.evaluate(() => {
        const cards = document.querySelectorAll('.flashlight-card');
        const textContent = [];
        cards.forEach(card => {
          textContent.push(card.textContent);
        });
        return textContent.join(' ');
      });
      
      const expectedMetrics = ['Total PnL', 'Profit Factor', 'Win Rate', 'Total Trades'];
      let metricsFound = 0;
      
      expectedMetrics.forEach(metric => {
        if (metricsText.includes(metric)) {
          metricsFound++;
          console.log(`✅ Found metric: ${metric}`);
        } else {
          console.log(`❌ Missing metric: ${metric}`);
        }
      });
      
      if (metricsFound === expectedMetrics.length) {
        testResults.passed++;
        testResults.details.push('✅ All expected metrics found');
      } else {
        testResults.failed++;
        testResults.details.push(`❌ Only ${metricsFound}/${expectedMetrics.length} metrics found`);
      }
    } else {
      console.log(`❌ Insufficient metrics cards (${metricsCards.length} found)`);
      testResults.failed++;
      testResults.details.push(`❌ Insufficient metrics cards: ${metricsCards.length}`);
    }
    
    // Test 5: Check PnL Chart
    console.log('\n📍 Test 5: Checking PnL Chart...');
    // Wait a bit more for charts to render
    await new Promise(resolve => setTimeout(resolve, 5000));
    const pnlChartExists = await page.evaluate(() => {
      // Check if Chart.js library is loaded
      if (typeof window.Chart === 'undefined') {
        console.log('Chart.js not loaded');
        return false;
      }
      
      const charts = document.querySelectorAll('canvas');
      for (let chart of charts) {
        // Check if Chart.js is attached to this canvas
        if (chart.chart && chart.chart.config && chart.chart.config.type === 'line') {
          return true;
        }
        // Also check if it's a Chart.js instance by checking if Chart is available
        if (window.Chart && window.Chart.getChart && window.Chart.getChart(chart)) {
          try {
            const chartInstance = window.Chart.getChart(chart);
            if (chartInstance.config && chartInstance.config.type === 'line') {
              return true;
            }
          } catch (e) {
            console.log('Error checking chart:', e);
          }
        }
      }
      return false;
    });
    
    if (pnlChartExists) {
      console.log('✅ PnL Chart is present and rendered');
      testResults.passed++;
      testResults.details.push('✅ PnL Chart present and rendered');
    } else {
      console.log('❌ PnL Chart not found or not rendered');
      testResults.failed++;
      testResults.details.push('❌ PnL Chart missing or not rendered');
    }
    
    // Test 6: Check Radar Emotion Chart
    console.log('\n📍 Test 6: Checking Radar Emotion Chart...');
    const radarChartExists = await page.evaluate(() => {
      // Check if Chart.js library is loaded
      if (typeof window.Chart === 'undefined') {
        console.log('Chart.js not loaded');
        return false;
      }
      
      const charts = document.querySelectorAll('canvas');
      for (let chart of charts) {
        // Check if Chart.js is attached to this canvas
        if (chart.chart && chart.chart.config && chart.chart.config.type === 'radar') {
          return true;
        }
        // Also check if it's a Chart.js instance by checking if Chart is available
        if (window.Chart && window.Chart.getChart && window.Chart.getChart(chart)) {
          try {
            const chartInstance = window.Chart.getChart(chart);
            if (chartInstance.config && chartInstance.config.type === 'radar') {
              return true;
            }
          } catch (e) {
            console.log('Error checking chart:', e);
          }
        }
      }
      return false;
    });
    
    if (radarChartExists) {
      console.log('✅ Radar Emotion Chart is present and rendered');
      testResults.passed++;
      testResults.details.push('✅ Radar Emotion Chart present and rendered');
    } else {
      console.log('❌ Radar Emotion Chart not found or not rendered');
      testResults.failed++;
      testResults.details.push('❌ Radar Emotion Chart missing or not rendered');
    }
    
    // Test 7: Check Discipline Level section
    console.log('\n📍 Test 7: Checking Discipline Level section...');
    const disciplineSection = await page.evaluate(() => {
      const sections = document.querySelectorAll('.flashlight-card');
      for (let section of sections) {
        if (section.textContent.includes('Discipline Level') &&
            section.textContent.includes('Discipline') &&
            section.textContent.includes('Tilt Control')) {
          return true;
        }
      }
      return false;
    });
    
    if (disciplineSection) {
      console.log('✅ Discipline Level section is present');
      testResults.passed++;
      testResults.details.push('✅ Discipline Level section present');
    } else {
      console.log('❌ Discipline Level section not found');
      testResults.failed++;
      testResults.details.push('❌ Discipline Level section missing');
    }
    
    // Test 8: Check Recent Trades table
    console.log('\n📍 Test 8: Checking Recent Trades table...');
    const tradesTableExists = await page.$('table') !== null;
    if (tradesTableExists) {
      console.log('✅ Recent Trades table is present');
      testResults.passed++;
      testResults.details.push('✅ Recent Trades table present');
      
      // Check table headers
      const tableHeaders = await page.evaluate(() => {
        const headers = document.querySelectorAll('table th');
        return Array.from(headers).map(th => th.textContent.trim());
      });
      
      const expectedHeaders = ['Date', 'Symbol', 'Side', 'Entry', 'Exit', 'Return'];
      const headersMatch = expectedHeaders.every(header => 
        tableHeaders.some(tableHeader => tableHeader.includes(header))
      );
      
      if (headersMatch) {
        console.log('✅ Table headers are correct');
        testResults.passed++;
        testResults.details.push('✅ Table headers correct');
      } else {
        console.log('❌ Table headers are incorrect');
        console.log('Expected:', expectedHeaders);
        console.log('Found:', tableHeaders);
        testResults.failed++;
        testResults.details.push('❌ Table headers incorrect');
      }
      
      // Check table rows
      const tableRows = await page.$$('table tbody tr');
      if (tableRows.length > 0) {
        console.log(`✅ Table has data rows (${tableRows.length} rows found)`);
        testResults.passed++;
        testResults.details.push(`✅ Table has data rows: ${tableRows.length}`);
      } else {
        console.log('❌ Table has no data rows');
        testResults.failed++;
        testResults.details.push('❌ Table has no data rows');
      }
    } else {
      console.log('❌ Recent Trades table not found');
      testResults.failed++;
      testResults.details.push('❌ Recent Trades table missing');
    }
    
    // Test 9: Check layout and responsive design
    console.log('\n📍 Test 9: Checking layout and responsive design...');
    
    // Check for layout conflicts
    const layoutConflicts = await page.evaluate(() => {
      const header = document.querySelector('header');
      const main = document.querySelector('main');
      const contentWrapper = document.querySelector('.verotrade-content-wrapper');
      const dashboard = document.querySelector('.min-h-screen');
      
      if (!header || !main || !dashboard) {
        return { missing: true, elements: { header: !!header, main: !!main, dashboard: !!dashboard } };
      }
      
      const headerRect = header.getBoundingClientRect();
      const mainRect = main.getBoundingClientRect();
      const contentWrapperRect = contentWrapper ? contentWrapper.getBoundingClientRect() : null;
      const computedStyle = window.getComputedStyle(main);
      const wrapperComputedStyle = contentWrapper ? window.getComputedStyle(contentWrapper) : null;
      
      // Check for overlapping elements - check if content wrapper starts below header
      const overlapping = contentWrapperRect ? headerRect.bottom > contentWrapperRect.top : headerRect.bottom > mainRect.top;
      
      return {
        missing: false,
        overlapping,
        headerHeight: headerRect.height,
        mainTop: mainRect.top,
        contentWrapperTop: contentWrapperRect ? contentWrapperRect.top : null,
        mainPaddingTop: computedStyle.paddingTop,
        wrapperPaddingTop: wrapperComputedStyle ? wrapperComputedStyle.paddingTop : null,
        mainMarginTop: computedStyle.marginTop,
        mainPosition: computedStyle.position,
        mainMinHeight: computedStyle.minHeight,
        mainClasses: main.className,
        mainId: main.id,
        mainStyle: main.getAttribute('style')
      };
    });
    
    if (!layoutConflicts.missing && !layoutConflicts.overlapping) {
      console.log('✅ No layout conflicts detected');
      testResults.passed++;
      testResults.details.push('✅ No layout conflicts');
    } else if (layoutConflicts.missing) {
      console.log('❌ Missing layout elements:', layoutConflicts.elements);
      testResults.failed++;
      testResults.details.push('❌ Missing layout elements');
    } else {
      console.log('❌ Layout conflict detected - header overlapping main content');
      console.log(`Header height: ${layoutConflicts.headerHeight}px, Main top: ${layoutConflicts.mainTop}px`);
      console.log(`Content wrapper top: ${layoutConflicts.contentWrapperTop}px`);
      console.log(`Main padding-top: ${layoutConflicts.mainPaddingTop}`);
      console.log(`Wrapper padding-top: ${layoutConflicts.wrapperPaddingTop}`);
      console.log(`Main margin-top: ${layoutConflicts.mainMarginTop}`);
      console.log(`Main position: ${layoutConflicts.mainPosition}`);
      console.log(`Main min-height: ${layoutConflicts.mainMinHeight}`);
      console.log(`Main classes: ${layoutConflicts.mainClasses}`);
      console.log(`Main ID: ${layoutConflicts.mainId}`);
      console.log(`Main style attribute: ${layoutConflicts.mainStyle}`);
      testResults.failed++;
      testResults.details.push('❌ Layout conflict - header overlapping content');
    }
    
    // Test 10: Check interactive elements
    console.log('\n📍 Test 10: Checking interactive elements...');
    
    // Test hover effects on cards
    const cardHoverTest = await page.evaluate(() => {
      const cards = document.querySelectorAll('.flashlight-card');
      if (cards.length === 0) return false;
      
      // Test first card hover effect
      const firstCard = cards[0];
      
      // Check if flashlight elements are present
      const flashlightBg = firstCard.querySelector('.flashlight-bg');
      const flashlightBorder = firstCard.querySelector('.flashlight-border');
      
      // Test hover by simulating mouse enter
      firstCard.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true, clientX: 100, clientY: 100 }));
      
      // Check if hover state is applied (opacity changes)
      const bgOpacity = flashlightBg ? window.getComputedStyle(flashlightBg).opacity : '0';
      const borderOpacity = flashlightBorder ? window.getComputedStyle(flashlightBorder).opacity : '0';
      
      return flashlightBg && flashlightBorder && (parseFloat(bgOpacity) > 0 || parseFloat(borderOpacity) > 0);
    });
    
    if (cardHoverTest) {
      console.log('✅ Card hover effects are working');
      testResults.passed++;
      testResults.details.push('✅ Card hover effects working');
    } else {
      console.log('❌ Card hover effects not working');
      testResults.failed++;
      testResults.details.push('❌ Card hover effects not working');
    }
    
    // Test navigation links
    const navLinksTest = await page.evaluate(() => {
      const navLinks = document.querySelectorAll('nav a');
      return navLinks.length > 0;
    });
    
    if (navLinksTest) {
      console.log('✅ Navigation links are present');
      testResults.passed++;
      testResults.details.push('✅ Navigation links present');
    } else {
      console.log('❌ Navigation links not found');
      testResults.failed++;
      testResults.details.push('❌ Navigation links missing');
    }
    
    // Test 11: Check animations and transitions
    console.log('\n📍 Test 11: Checking animations and transitions...');
    
    const animationsWorking = await page.evaluate(() => {
      // Check for text reveal elements
      const textRevealElements = document.querySelectorAll('.text-reveal-letter');
      
      // Check for scroll animations
      const scrollItems = document.querySelectorAll('.scroll-item');
      
      return {
        textReveal: textRevealElements.length > 0,
        scrollAnimations: scrollItems.length > 0
      };
    });
    
    if (animationsWorking.textReveal && animationsWorking.scrollAnimations) {
      console.log('✅ Animations are present and working');
      testResults.passed++;
      testResults.details.push('✅ Animations present and working');
    } else {
      console.log('❌ Some animations are missing');
      console.log('Text reveal:', animationsWorking.textReveal);
      console.log('Scroll animations:', animationsWorking.scrollAnimations);
      testResults.failed++;
      testResults.details.push('❌ Some animations missing');
    }
    
    // Take a screenshot for visual verification
    await page.screenshot({ 
      path: 'dashboard-functionality-test.png', 
      fullPage: true 
    });
    console.log('\n📸 Screenshot saved as dashboard-functionality-test.png');
    
  } catch (error) {
    console.error('❌ Test error:', error);
    testResults.failed++;
    testResults.details.push(`❌ Test error: ${error.message}`);
  } finally {
    await browser.close();
  }
  
  // Print final results
  console.log('\n' + '='.repeat(60));
  console.log('📊 DASHBOARD FUNCTIONALITY TEST RESULTS');
  console.log('='.repeat(60));
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`📈 Success Rate: ${((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1)}%`);
  console.log('\n📝 Detailed Results:');
  testResults.details.forEach(detail => console.log(detail));
  
  // Save results to file
  const fs = require('fs');
  const reportData = {
    timestamp: new Date().toISOString(),
    summary: {
      passed: testResults.passed,
      failed: testResults.failed,
      successRate: ((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1)
    },
    details: testResults.details
  };
  
  fs.writeFileSync(
    'dashboard-functionality-test-report.json',
    JSON.stringify(reportData, null, 2)
  );
  
  console.log('\n💾 Detailed report saved to dashboard-functionality-test-report.json');
  
  return testResults;
}

// Run the test
testDashboardFunctionality().then(results => {
  console.log('\n🏁 Dashboard functionality test completed!');
  process.exit(results.failed > 0 ? 1 : 0);
}).catch(error => {
  console.error('💥 Test failed to run:', error);
  process.exit(1);
});