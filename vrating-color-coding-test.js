const { chromium } = require('playwright');
const path = require('path');

async function testVRatingColorCoding() {
  console.log('🧪 Starting VRating Color Coding Test\n');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // First, navigate to the login page
    await page.goto('http://localhost:3001/login');
    await page.waitForLoadState('networkidle');
    console.log('✅ Successfully navigated to login page');
    
    // Fill in login credentials
    await page.fill('input[type="email"]', 'testuser@verotrade.com');
    await page.fill('input[type="password"]', 'TestPassword123!');
    console.log('✅ Login credentials entered');
    
    // Click login button
    await page.click('button[type="submit"]');
    console.log('✅ Login button clicked');
    
    // Wait for navigation to dashboard after successful login
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    await page.waitForLoadState('networkidle');
    console.log('✅ Successfully logged in and redirected to dashboard');
    
    // Now navigate to the test page
    await page.goto('http://localhost:3001/test-vrating-color-coding');
    await page.waitForLoadState('networkidle');
    console.log('✅ Successfully navigated to test page');
    
    // Test data for verification
    const testCases = [
      {
        name: 'Poor Performance',
        buttonText: 'Poor Performance - Multiple Issues',
        expectedOverallScore: 3.2,
        expectedCategories: {
          profitability: { score: 2.8, color: 'red', label: "Doesn't Meet" },
          riskManagement: { score: 4.1, color: 'red', label: "Doesn't Meet" },
          consistency: { score: 3.5, color: 'red', label: "Doesn't Meet" },
          emotionalDiscipline: { score: 4.8, color: 'red', label: "Doesn't Meet" },
          journalingAdherence: { score: 6.2, color: 'yellow', label: 'Medium' }
        },
        expectedAttentionMessage: 'Needs Immediate Attention'
      },
      {
        name: 'Mixed Performance',
        buttonText: 'Mixed Performance - Some Issues',
        expectedOverallScore: 6.1,
        expectedCategories: {
          profitability: { score: 7.8, color: 'green', label: 'Meets Rules' },
          riskManagement: { score: 5.5, color: 'yellow', label: 'Medium' },
          consistency: { score: 4.2, color: 'red', label: "Doesn't Meet" },
          emotionalDiscipline: { score: 6.8, color: 'yellow', label: 'Medium' },
          journalingAdherence: { score: 8.1, color: 'green', label: 'Meets Rules' }
        },
        expectedAttentionMessage: 'Needs Immediate Attention'
      },
      {
        name: 'Good Performance',
        buttonText: 'Good Performance - All Meeting Standards',
        expectedOverallScore: 8.4,
        expectedCategories: {
          profitability: { score: 8.5, color: 'green', label: 'Meets Rules' },
          riskManagement: { score: 8.2, color: 'green', label: 'Meets Rules' },
          consistency: { score: 7.9, color: 'green', label: 'Meets Rules' },
          emotionalDiscipline: { score: 8.8, color: 'green', label: 'Meets Rules' },
          journalingAdherence: { score: 9.1, color: 'green', label: 'Meets Rules' }
        },
        expectedAttentionMessage: 'All Categories Meeting Standards'
      }
    ];
    
    // Test each case
    for (let i = 0; i < testCases.length; i++) {
      const testCase = testCases[i];
      console.log(`\n📊 Testing ${testCase.name} case...`);
      
      // Click the test case button using specific text selector
      try {
        await page.locator(`button:has-text("${testCase.buttonText}")`).click();
        console.log(`  ✅ Clicked button: "${testCase.buttonText}"`);
      } catch (e) {
        console.log(`  ⚠️ Could not click button with text: "${testCase.buttonText}"`);
        // Try alternative selector
        try {
          await page.locator('button', { hasText: testCase.buttonText }).click();
          console.log(`  ✅ Clicked button using alternative selector: "${testCase.buttonText}"`);
        } catch (e2) {
          console.log(`  ❌ Failed to click button: "${testCase.buttonText}"`);
        }
      }
      await page.waitForTimeout(500); // Wait for state update
      
      // Wait a bit for the VRating card to fully render
      await page.waitForTimeout(1000);
      
      // Wait for the VRating card to be visible
      await page.waitForSelector('.card-solid-enhanced', { state: 'visible', timeout: 5000 }).catch(() => {
        console.log('  ⚠️ VRating card not visible after timeout');
      });
      
      // Verify overall score - look for the specific element structure from VRatingCard
      let overallScoreElement;
      let overallScoreText;
      
      // Try to find the score element using the structure from VRatingCard
      try {
        // First try to find the VRating card specifically
        const vRatingCard = await page.locator('.card-solid-enhanced').first();
        if (await vRatingCard.isVisible()) {
          // Look for the score element within the VRating card
          overallScoreElement = vRatingCard.locator('.text-4xl.font-bold').first();
          if (await overallScoreElement.isVisible()) {
            overallScoreText = await overallScoreElement.textContent();
            console.log(`Found score element within VRating card: "${overallScoreText}"`);
            
            // Extract just the number (remove any text like "/10")
            const scoreMatch = overallScoreText.match(/(\d+\.?\d*)/);
            if (scoreMatch) {
              overallScoreText = scoreMatch[1];
            }
          }
        }
      } catch (e) {
        console.log('  ⚠️ Could not find overall score element with primary selector');
      }
      
      // If still not found, try alternative approaches
      if (!overallScoreText) {
        // Try to find the score by looking for the pattern "X.X/10" within the VRating card
        try {
          const vRatingCard = await page.locator('.card-solid-enhanced').first();
          if (await vRatingCard.isVisible()) {
            const scoreElements = await vRatingCard.locator('text=/\\d+\\.\\d+\\/10/').all();
            for (const element of scoreElements) {
              if (await element.isVisible()) {
                const text = await element.textContent();
                const scoreMatch = text.match(/(\d+\.?\d*)/);
                if (scoreMatch) {
                  overallScoreText = scoreMatch[1];
                  console.log(`Found score using pattern within VRating card: "${overallScoreText}"`);
                  break;
                }
              }
            }
          }
        } catch (e) {
          console.log('  ⚠️ Could not find score using pattern within VRating card');
        }
      }
      
      // Third fallback: Look for any element with the pattern "X.X/10" but exclude the page title
      if (!overallScoreText) {
        try {
          const scoreElements = await page.locator('text=/\\d+\\.\\d+\\/10/').all();
          for (const element of scoreElements) {
            if (await element.isVisible()) {
              const text = await element.textContent();
              // Make sure it's not the page title by checking if it contains a decimal point
              const scoreMatch = text.match(/(\d+\.\d+)\/10/);
              if (scoreMatch) {
                overallScoreText = scoreMatch[1];
                console.log(`Found score using general pattern: "${overallScoreText}"`);
                break;
              }
            }
          }
        } catch (e) {
          console.log('  ⚠️ Could not find score using general pattern');
        }
      }
      
      // Fourth fallback: Look for the specific score value we expect
      if (!overallScoreText) {
        try {
          const expectedScore = testCase.expectedOverallScore.toFixed(1);
          const scoreElement = await page.locator(`text=${expectedScore}`).first();
          if (await scoreElement.isVisible()) {
            overallScoreText = expectedScore;
            console.log(`Found score using expected value: "${overallScoreText}"`);
          }
        } catch (e) {
          console.log('  ⚠️ Could not find score using expected value');
        }
      }
      
      // If still not found, take a screenshot to debug
      if (!overallScoreText) {
        console.log('  ⚠️ Could not find overall score element, taking screenshot for debugging');
        await page.screenshot({ path: `vrating-debug-${testCase.name.replace(/\s+/g, '-').toLowerCase()}.png` });
      }
      
      const overallScore = overallScoreText ? parseFloat(overallScoreText) : NaN;
      
      if (!isNaN(overallScore) && Math.abs(overallScore - testCase.expectedOverallScore) < 0.1) {
        console.log(`  ✅ Overall score correct: ${overallScore}`);
      } else {
        console.log(`  ❌ Overall score incorrect: expected ${testCase.expectedOverallScore}, got ${overallScore}`);
      }
      
      // Close sidebar if it's open (to prevent backdrop from interfering)
      const sidebarToggle = await page.locator('[data-testid="sidebar-toggle"], button[aria-label="Toggle sidebar"], .sidebar-toggle').first();
      if (await sidebarToggle.isVisible()) {
        await sidebarToggle.click();
        await page.waitForTimeout(500);
      }
      
      // Expand the performance breakdown to see all categories
      const expandButton = await page.locator('button:has-text("Performance Breakdown")');
      if (await expandButton.isVisible()) {
        // Force click to bypass any backdrop
        await expandButton.click({ force: true });
        await page.waitForTimeout(500);
      }
      
      // Test each category
      for (const [categoryName, expectedData] of Object.entries(testCase.expectedCategories)) {
        console.log(`  🔍 Testing ${categoryName} category...`);
        
        // Find the category element by name - try multiple approaches
        let categoryContainer = null;
        
        // First, make sure the Performance Breakdown is expanded
        const expandButton = await page.locator('button:has-text("Performance Breakdown")');
        if (await expandButton.isVisible()) {
          // Check if it's expanded by looking for the ChevronUp icon
          const chevronUp = await expandButton.locator('svg[data-lucide="chevron-up"]').count();
          if (chevronUp === 0) {
            // It's not expanded, click it
            await expandButton.click({ force: true });
            await page.waitForTimeout(500);
          }
        }
        
        // Try to find category within the VRating card first
        const vRatingCard = await page.locator('.card-solid-enhanced').first();
        if (await vRatingCard.isVisible()) {
          // Try to find category by looking for the category name text within the card
          const categoryElement = vRatingCard.locator(`text=${categoryName}`).first();
          if (await categoryElement.isVisible()) {
            // Get the parent category container with border class
            categoryContainer = categoryElement.locator('xpath=ancestor::div[contains(@class, "border")]').first();
          }
        }
        
        // If not found, try to find by looking for score value within the VRating card
        if (!categoryContainer || !(await categoryContainer.isVisible())) {
          if (await vRatingCard.isVisible()) {
            try {
              const scoreElements = await vRatingCard.locator(`text=${expectedData.score.toFixed(1)}`).all();
              for (const element of scoreElements) {
                if (await element.isVisible()) {
                  const parent = element.locator('xpath=ancestor::div[contains(@class, "border")]').first();
                  if (await parent.isVisible()) {
                    categoryContainer = parent;
                    break;
                  }
                }
              }
            } catch (e) {
              console.log(`    ⚠️ Error finding score elements: ${e.message}`);
            }
          }
        }
        
        // If still not found, try the original approach
        if (!categoryContainer || !(await categoryContainer.isVisible())) {
          const categoryElement = await page.locator(`text=${categoryName}`).first();
          if (await categoryElement.isVisible()) {
            categoryContainer = categoryElement.locator('xpath=ancestor::div[contains(@class, "border")]').first();
          }
        }
        
        if (categoryContainer && await categoryContainer.isVisible()) {
          // Check score
          const scoreElement = await categoryContainer.locator('.text-sm.font-bold').first();
          if (await scoreElement.isVisible()) {
            const scoreText = await scoreElement.textContent();
            const score = parseFloat(scoreText);
            
            if (Math.abs(score - expectedData.score) < 0.1) {
              console.log(`    ✅ Score correct: ${score}`);
            } else {
              console.log(`    ❌ Score incorrect: expected ${expectedData.score}, got ${score}`);
            }
          } else {
            console.log(`    ⚠️ Score element not found in category container`);
          }
          
          // Check color coding by verifying CSS classes
          const hasCorrectColor = await categoryContainer.evaluate((el, expectedColor) => {
            if (expectedColor === 'red') {
              return el.classList.contains('bg-red-500/5') &&
                     el.classList.contains('border-red-500/20') &&
                     el.classList.contains('ring-1') &&
                     el.classList.contains('ring-red-500/10');
            } else if (expectedColor === 'yellow') {
              return el.classList.contains('bg-yellow-500/5') &&
                     el.classList.contains('border-yellow-500/20') &&
                     el.classList.contains('ring-1') &&
                     el.classList.contains('ring-yellow-500/10');
            } else if (expectedColor === 'green') {
              return el.classList.contains('bg-secondary') &&
                     el.classList.contains('border-secondary');
            }
            return false;
          }, expectedData.color);
          
          if (hasCorrectColor) {
            console.log(`    ✅ Color coding correct: ${expectedData.color}`);
          } else {
            console.log(`    ❌ Color coding incorrect for ${expectedData.color}`);
            // Log actual classes for debugging
            const actualClasses = await categoryContainer.evaluate(el => Array.from(el.classList));
            console.log(`    📋 Actual classes: ${actualClasses.join(' ')}`);
          }
          
          // Check performance label
          const labelElement = await categoryContainer.locator('span:has-text("' + expectedData.label + '")').first();
          if (await labelElement.isVisible()) {
            console.log(`    ✅ Performance label correct: ${expectedData.label}`);
          } else {
            console.log(`    ❌ Performance label incorrect: expected "${expectedData.label}"`);
          }
          
          // Check attention indicator for poor performance
          if (expectedData.color === 'red') {
            const pulsingIndicator = await categoryContainer.locator('.animate-pulse').first();
            if (await pulsingIndicator.isVisible()) {
              console.log(`    ✅ Pulsing attention indicator present`);
            } else {
              console.log(`    ❌ Pulsing attention indicator missing`);
            }
          }
        } else {
          console.log(`    ❌ Category container not found: ${categoryName}`);
          // Take a screenshot for debugging
          await page.screenshot({ path: `vrating-category-debug-${categoryName.toLowerCase()}.png` });
        }
      }
      
      // Check summary section
      console.log(`  📋 Checking summary section...`);
      const attentionMessage = await page.locator('text=' + testCase.expectedAttentionMessage).first();
      if (await attentionMessage.isVisible()) {
        console.log(`    ✅ Summary message correct: "${testCase.expectedAttentionMessage}"`);
      } else {
        console.log(`    ❌ Summary message incorrect: expected "${testCase.expectedAttentionMessage}"`);
      }
      
      // Check contrast against slate background
      console.log(`  🎨 Checking contrast...`);
      // Use a more specific selector for the VRating card
      const cardElement = await page.locator('.card-solid-enhanced').first();
      const cardBg = await cardElement.evaluate(el => {
        return window.getComputedStyle(el).backgroundColor;
      });
      
      // Verify the card has a background that provides contrast
      if (cardBg && cardBg !== 'rgba(0, 0, 0, 0)' && cardBg !== 'transparent') {
        console.log(`    ✅ Card has background for contrast: ${cardBg}`);
      } else {
        console.log(`    ❌ Card lacks proper background for contrast`);
      }
      
      // Test responsiveness by checking viewport sizes
      console.log(`  📱 Testing responsiveness...`);
      const originalSize = page.viewportSize();
      
      // Test mobile view
      await page.setViewportSize({ width: 375, height: 667 });
      await page.waitForTimeout(300);
      
      const isMobileResponsive = await page.locator('.card-solid-enhanced').isVisible();
      if (isMobileResponsive) {
        console.log(`    ✅ Mobile view working correctly`);
      } else {
        console.log(`    ❌ Mobile view not working correctly`);
      }
      
      // Test tablet view
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.waitForTimeout(300);
      
      const isTabletResponsive = await page.locator('.card-solid-enhanced').isVisible();
      if (isTabletResponsive) {
        console.log(`    ✅ Tablet view working correctly`);
      } else {
        console.log(`    ❌ Tablet view not working correctly`);
      }
      
      // Restore original viewport
      await page.setViewportSize(originalSize);
      await page.waitForTimeout(300);
    }
    
    // Take a final screenshot for documentation
    await page.screenshot({ 
      path: 'vrating-color-coding-test-final.png', 
      fullPage: true 
    });
    console.log('\n📸 Final screenshot saved as vrating-color-coding-test-final.png');
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  } finally {
    await browser.close();
    console.log('\n🏁 VRating Color Coding Test completed');
  }
}

// Run the test
testVRatingColorCoding().catch(console.error);