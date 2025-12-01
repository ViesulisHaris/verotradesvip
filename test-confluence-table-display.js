// Test script to verify confluence trades table display
const puppeteer = require('puppeteer');

async function testConfluenceTableDisplay() {
  console.log('🧪 Testing Confluence Table Display...');
  
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    // Navigate to confluence page
    await page.goto('http://localhost:3000/confluence', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    // Wait for data to load
    await page.waitForSelector('[data-testid="confluence-container"]', { timeout: 10000 });
    
    // Wait for trades to load
    await page.waitForFunction(() => {
      const trades = document.querySelectorAll('tbody tr');
      return trades.length > 0;
    }, { timeout: 15000 });
    
    // Check if trades table is visible
    const tableVisible = await page.evaluate(() => {
      const table = document.querySelector('table');
      const tbody = document.querySelector('tbody');
      const trades = document.querySelectorAll('tbody tr');
      
      return {
        tableExists: !!table,
        tbodyExists: !!tbody,
        tradesCount: trades.length,
        tableStyles: {
          display: window.getComputedStyle(table).display,
          visibility: window.getComputedStyle(table).visibility,
          overflow: window.getComputedStyle(table).overflow,
          maxHeight: window.getComputedStyle(table).maxHeight
        },
        containerStyles: {
          display: window.getComputedStyle(table.parentElement).display,
          overflow: window.getComputedStyle(table.parentElement).overflow,
          maxHeight: window.getComputedStyle(table.parentElement).maxHeight
        },
        firstRowData: trades.length > 0 ? {
          symbol: trades[0].querySelector('td:nth-child(1)')?.textContent,
          side: trades[0].querySelector('td:nth-child(2)')?.textContent,
          quantity: trades[0].querySelector('td:nth-child(3)')?.textContent,
          entry: trades[0].querySelector('td:nth-child(4)')?.textContent,
          exit: trades[0].querySelector('td:nth-child(5)')?.textContent,
          pnl: trades[0].querySelector('td:nth-child(6)')?.textContent,
          date: trades[0].querySelector('td:nth-child(7)')?.textContent,
          strategy: trades[0].querySelector('td:nth-child(8)')?.textContent,
          market: trades[0].querySelector('td:nth-child(9)')?.textContent,
          emotions: trades[0].querySelector('td:nth-child(10)')?.textContent
        } : null
      };
    });
    
    console.log('📊 Table Visibility Results:', {
      tableExists: tableVisible.tableExists,
      tbodyExists: tableVisible.tbodyExists,
      tradesCount: tableVisible.tradesCount,
      tableStyles: tableVisible.tableStyles,
      containerStyles: tableVisible.containerStyles,
      firstRowData: tableVisible.firstRowData
    });
    
    // Check pagination
    const paginationVisible = await page.evaluate(() => {
      const pagination = document.querySelector('.flex.items-center.justify-between.mt-4');
      if (!pagination) return null;
      
      const prevBtn = pagination.querySelector('button:first-child');
      const nextBtn = pagination.querySelector('button:last-child');
      const pageInfo = pagination.querySelector('span');
      
      return {
        exists: !!pagination,
        prevButton: {
          exists: !!prevBtn,
          disabled: prevBtn?.disabled
        },
        nextButton: {
          exists: !!nextBtn,
          disabled: nextBtn?.disabled
        },
        pageInfo: pageInfo?.textContent
      };
    });
    
    console.log('📄 Pagination Results:', paginationVisible);
    
    // Take screenshot for visual verification
    await page.screenshot({ 
      path: 'confluence-table-display-test.png',
      fullPage: true 
    });
    
    console.log('📸 Screenshot saved as confluence-table-display-test.png');
    
    // Test scrolling
    const scrollTest = await page.evaluate(() => {
      const container = document.querySelector('.overflow-x-auto');
      if (!container) return { canScroll: false };
      
      const originalScrollTop = container.scrollTop;
      const originalScrollLeft = container.scrollLeft;
      
      // Try to scroll
      container.scrollTop = 100;
      container.scrollLeft = 100;
      
      const canScrollVertical = container.scrollTop !== originalScrollTop;
      const canScrollHorizontal = container.scrollLeft !== originalScrollLeft;
      
      return {
        canScroll: canScrollVertical || canScrollHorizontal,
        canScrollVertical,
        canScrollHorizontal,
        containerHeight: container.scrollHeight,
        containerWidth: container.scrollWidth,
        viewportHeight: container.clientHeight,
        viewportWidth: container.clientWidth
      };
    });
    
    console.log('🔄 Scroll Test Results:', scrollTest);
    
    // Overall test result
    const testPassed = tableVisible.tableExists && 
                     tableVisible.tbodyExists && 
                     tableVisible.tradesCount > 0 &&
                     (scrollTest.canScroll || tableVisible.tradesCount <= 10); // Small tables might not need scroll
    
    console.log(testPassed ? '✅ TEST PASSED: Trades table is visible and functional' : '❌ TEST FAILED: Trades table has issues');
    
    return {
      success: testPassed,
      tableVisible,
      paginationVisible,
      scrollTest,
      screenshot: 'confluence-table-display-test.png'
    };
    
  } catch (error) {
    console.error('❌ Test Error:', error);
    return { success: false, error: error.message };
  } finally {
    await browser.close();
  }
}

// Run the test
testConfluenceTableDisplay().then(result => {
  console.log('\n🏁 FINAL TEST RESULT:', result);
  process.exit(result.success ? 0 : 1);
}).catch(error => {
  console.error('💥 Test failed to run:', error);
  process.exit(1);
});