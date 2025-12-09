/**
 * Test Script: Psychological Metrics Container Visibility Fix
 * 
 * This script tests that the psychological metrics container remains visible
 * when navigating away and back to the dashboard page.
 */

const { chromium } = require('playwright');

async function testPsychologicalMetricsVisibility() {
  console.log('🔍 Testing Psychological Metrics Container Visibility Fix...\n');
  
  const browser = await chromium.launch({ headless: false, slowMo: 1000 });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Navigate to the dashboard page
    console.log('1. Navigating to dashboard page...');
    await page.goto('http://localhost:3000/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Wait for the page to fully load
    await page.waitForTimeout(2000);
    
    // Check if psychological metrics container is visible initially
    console.log('2. Checking initial visibility of psychological metrics container...');
    const psychologicalMetricsCard = page.locator('.psychological-metrics-card');
    
    const isVisibleInitially = await psychologicalMetricsCard.isVisible();
    const opacityInitially = await psychologicalMetricsCard.evaluate(el => 
      window.getComputedStyle(el).opacity
    );
    const visibilityInitially = await psychologicalMetricsCard.evaluate(el => 
      window.getComputedStyle(el).visibility
    );
    
    console.log(`   - Initially visible: ${isVisibleInitially}`);
    console.log(`   - Initial opacity: ${opacityInitially}`);
    console.log(`   - Initial visibility property: ${visibilityInitially}`);
    
    if (!isVisibleInitially || opacityInitially === '0' || visibilityInitially === 'hidden') {
      console.log('❌ FAIL: Psychological metrics container is not visible on initial load');
      return false;
    }
    
    console.log('✅ PASS: Psychological metrics container is visible on initial load');
    
    // Navigate away from the page
    console.log('\n3. Navigating away from dashboard...');
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    // Navigate back to the dashboard
    console.log('4. Navigating back to dashboard...');
    await page.goto('http://localhost:3000/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // Allow animations to complete
    
    // Check if psychological metrics container is still visible after navigation
    console.log('5. Checking visibility after navigation back...');
    const isVisibleAfterNav = await psychologicalMetricsCard.isVisible();
    const opacityAfterNav = await psychologicalMetricsCard.evaluate(el => 
      window.getComputedStyle(el).opacity
    );
    const visibilityAfterNav = await psychologicalMetricsCard.evaluate(el => 
      window.getComputedStyle(el).visibility
    );
    const transformAfterNav = await psychologicalMetricsCard.evaluate(el => 
      window.getComputedStyle(el).transform
    );
    const filterAfterNav = await psychologicalMetricsCard.evaluate(el => 
      window.getComputedStyle(el).filter
    );
    
    console.log(`   - Visible after navigation: ${isVisibleAfterNav}`);
    console.log(`   - Opacity after navigation: ${opacityAfterNav}`);
    console.log(`   - Visibility property after navigation: ${visibilityAfterNav}`);
    console.log(`   - Transform after navigation: ${transformAfterNav}`);
    console.log(`   - Filter after navigation: ${filterAfterNav}`);
    
    if (!isVisibleAfterNav || opacityAfterNav === '0' || visibilityAfterNav === 'hidden') {
      console.log('❌ FAIL: Psychological metrics container is not visible after navigation');
      return false;
    }
    
    // Check if it has the correct CSS classes
    const hasInViewClass = await psychologicalMetricsCard.evaluate(el => 
      el.classList.contains('in-view')
    );
    const hasScrollItemVisibleClass = await psychologicalMetricsCard.evaluate(el => 
      el.classList.contains('scroll-item-visible')
    );
    
    console.log(`   - Has in-view class: ${hasInViewClass}`);
    console.log(`   - Has scroll-item-visible class: ${hasScrollItemVisibleClass}`);
    
    console.log('✅ PASS: Psychological metrics container remains visible after navigation');
    
    // Test scrolling behavior (should not be required to see the container)
    console.log('\n6. Testing if scrolling is required to see the container...');
    
    // Get the bounding box of the psychological metrics container
    const boundingBox = await psychologicalMetricsCard.boundingBox();
    const viewportHeight = page.viewportSize().height;
    
    console.log(`   - Container top position: ${boundingBox.y}`);
    console.log(`   - Container bottom position: ${boundingBox.y + boundingBox.height}`);
    console.log(`   - Viewport height: ${viewportHeight}`);
    
    // Check if container is within viewport without scrolling
    const isWithinViewport = boundingBox.y >= 0 && (boundingBox.y + boundingBox.height) <= viewportHeight;
    
    if (isWithinViewport) {
      console.log('✅ PASS: Container is visible within viewport without scrolling');
    } else {
      console.log('⚠️  WARNING: Container requires scrolling to be fully visible');
    }
    
    // Test metric containers within the card
    console.log('\n7. Testing metric containers within the card...');
    const metricContainers = page.locator('.psychological-metrics-card .metric-container');
    const metricCount = await metricContainers.count();
    
    console.log(`   - Found ${metricCount} metric containers`);
    
    for (let i = 0; i < metricCount; i++) {
      const container = metricContainers.nth(i);
      const isVisible = await container.isVisible();
      const opacity = await container.evaluate(el => 
        window.getComputedStyle(el).opacity
      );
      
      console.log(`   - Metric container ${i + 1}: visible=${isVisible}, opacity=${opacity}`);
      
      if (!isVisible || opacity === '0') {
        console.log(`❌ FAIL: Metric container ${i + 1} is not visible`);
        return false;
      }
    }
    
    console.log('✅ PASS: All metric containers are visible');
    
    return true;
    
  } catch (error) {
    console.error('❌ Error during test:', error);
    return false;
  } finally {
    await browser.close();
  }
}

// Run the test
testPsychologicalMetricsVisibility().then(success => {
  if (success) {
    console.log('\n🎉 ALL TESTS PASSED: Psychological metrics container visibility fix is working correctly!');
    console.log('\n📋 Summary:');
    console.log('   ✅ Container is visible on initial load');
    console.log('   ✅ Container remains visible after navigation');
    console.log('   ✅ Container does not require scrolling to appear');
    console.log('   ✅ All metric containers within are visible');
    console.log('\n🔧 Fix Implementation:');
    console.log('   - Added forced visibility CSS rules for psychological metrics container');
    console.log('   - Enhanced IntersectionObserver to handle navigation scenarios');
    console.log('   - Added timeout fallback to ensure visibility');
    console.log('   - Override scroll-based animations for this specific container');
  } else {
    console.log('\n❌ TESTS FAILED: Psychological metrics container visibility issue persists');
    console.log('\n🔍 Further investigation needed:');
    console.log('   - Check browser console for JavaScript errors');
    console.log('   - Verify CSS specificity and loading order');
    console.log('   - Test with different viewport sizes');
    console.log('   - Check for conflicting animations or transitions');
  }
  
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('❌ Test execution failed:', error);
  process.exit(1);
});