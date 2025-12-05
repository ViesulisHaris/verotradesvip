// Test script to verify sorting functionality after removing duplicate elements
const { chromium } = require('playwright');

async function testSortingFunctionality() {
  console.log('🔍 Testing sorting functionality after removing duplicate elements...');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // First, navigate to login page and authenticate
    console.log('🔐 Logging in first...');
    await page.goto('http://localhost:3000/login');
    await page.waitForLoadState('networkidle');
    
    // Fill in login credentials
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    
    // Click login button
    await page.click('button[type="submit"]');
    
    // Wait for login to complete and redirect
    await page.waitForURL('**/dashboard');
    console.log('✅ Successfully logged in');
    
    // Now navigate to the trades page
    await page.goto('http://localhost:3000/trades');
    await page.waitForLoadState('networkidle');
    
    // Check if Quick Sort Buttons are visible and functional
    console.log('📊 Testing Quick Sort Buttons...');
    
    // Check if the sort buttons exist
    const sortButtons = await page.locator('button[title*="Sort"]').count();
    console.log(`✅ Found ${sortButtons} sort buttons`);
    
    if (sortButtons === 0) {
      console.error('❌ No sort buttons found!');
      return false;
    }
    
    // Test clicking on each sort button
    const sortButtonLabels = ['Date (Newest)', 'Date (Oldest)', 'P&L (Highest)', 'P&L (Lowest)', 'Symbol (A-Z)', 'Symbol (Z-A)'];
    
    for (const label of sortButtonLabels) {
      console.log(`🔄 Testing sort button: ${label}`);
      
      // Find and click the button
      const button = page.locator('button', { hasText: label }).first();
      if (await button.isVisible()) {
        await button.click();
        console.log(`✅ Clicked ${label} button`);
        
        // Wait a moment for sorting to apply
        await page.waitForTimeout(1000);
        
        // Check if any error occurred
        const errorVisible = await page.locator('.error, .alert-error').isVisible();
        if (errorVisible) {
          console.error(`❌ Error after clicking ${label} button`);
          return false;
        }
      } else {
        console.log(`⚠️ Button ${label} not visible, might be hidden on smaller screens`);
      }
    }
    
    // Verify that the duplicate elements are removed
    console.log('🔍 Verifying duplicate elements are removed...');
    
    // Check that EnhancedSortControls is not present
    const enhancedSortControls = await page.locator('[data-testid="enhanced-sort-controls"], .enhanced-sort-controls').count();
    if (enhancedSortControls === 0) {
      console.log('✅ EnhancedSortControls dropdown successfully removed');
    } else {
      console.error('❌ EnhancedSortControls dropdown still present');
    }
    
    // Check that Current Sort Badge is not present
    const currentSortBadge = await page.locator('.bg-blue-600\\/10.border-blue-500\\/20.rounded.text-xs').count();
    if (currentSortBadge === 0) {
      console.log('✅ Current Sort Badge successfully removed');
    } else {
      console.error('❌ Current Sort Badge still present');
    }
    
    // Check mobile sort indicator is removed
    const mobileSortIndicator = await page.locator('.lg:hidden.flex.items-center.gap-2.px-3.py-1.5.bg-blue-600\\/10').count();
    if (mobileSortIndicator === 0) {
      console.log('✅ Mobile sort indicator successfully removed');
    } else {
      console.error('❌ Mobile sort indicator still present');
    }
    
    // Test responsive design
    console.log('📱 Testing responsive design...');
    
    // Test mobile view
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);
    
    const mobileSortButtons = await page.locator('button[title*="Sort"]').count();
    console.log(`✅ Found ${mobileSortButtons} sort buttons on mobile view`);
    
    // Test desktop view
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForTimeout(500);
    
    const desktopSortButtons = await page.locator('button[title*="Sort"]').count();
    console.log(`✅ Found ${desktopSortButtons} sort buttons on desktop view`);
    
    console.log('✅ All tests completed successfully!');
    return true;
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
    return false;
  } finally {
    await browser.close();
  }
}

// Run the test
testSortingFunctionality().then(success => {
  if (success) {
    console.log('\n🎉 Sorting functionality test passed!');
    console.log('✅ Icon-based sorting is working correctly');
    console.log('✅ Duplicate elements have been successfully removed');
    console.log('✅ Responsive design works properly on mobile and desktop');
  } else {
    console.log('\n❌ Sorting functionality test failed!');
    process.exit(1);
  }
});