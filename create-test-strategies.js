/**
 * Create Test Strategies for Modal Testing
 * 
 * This script creates test strategies so we can test the StrategyPerformanceModal
 */

const { chromium } = require('playwright');
const fs = require('fs');

async function createTestStrategies() {
  console.log('🚀 Starting Test Strategy Creation');
  console.log('=' .repeat(80));

  const browser = await chromium.launch({ 
    headless: false,
    devtools: true
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  
  const page = await context.newPage();
  
  // Set up console logging
  page.on('console', msg => {
    if (msg.text().includes('🔍 [DEBUG]') || 
        msg.text().includes('Error') ||
        msg.text().includes('Success')) {
      console.log(`📝 [${msg.type().toUpperCase()}] ${msg.text()}`);
    }
  });

  try {
    // Navigate to strategies page
    console.log('\n📍 Step 1: Navigating to strategies page...');
    await page.goto('http://localhost:3001/strategies', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    // Check if we need to login
    console.log('\n📍 Step 2: Checking authentication status...');
    const loginRequired = await page.locator('text=Authentication Required').isVisible().catch(() => false);
    
    if (loginRequired) {
      console.log('🔐 Login required. Please login first and then run this script.');
      await browser.close();
      return;
    }

    // Look for Create Strategy button
    console.log('\n📍 Step 3: Looking for Create Strategy button...');
    
    let createButtonFound = false;
    try {
      // Try multiple selectors for the Create Strategy button
      const possibleSelectors = [
        'a[href="/strategies/create"]',
        'text=Create Strategy',
        'button:has-text("Create Strategy")',
        'href="/strategies/create"'
      ];
      
      for (const selector of possibleSelectors) {
        try {
          await page.waitForSelector(selector, { timeout: 2000 });
          createButtonFound = true;
          console.log(`✅ Found Create Strategy button with selector: ${selector}`);
          break;
        } catch (error) {
          // Continue to next selector
        }
      }
      
      if (!createButtonFound) {
        throw new Error('Could not find Create Strategy button with any selector');
      }
    } catch (error) {
      console.log('❌ Could not find Create Strategy button:', error.message);
      await browser.close();
      return;
    }

    // Navigate to create strategy page
    console.log('\n📍 Step 4: Navigating to Create Strategy page...');
    await page.locator('a[href="/strategies/create"]').click();
    await page.waitForTimeout(2000);

    // Create multiple test strategies
    console.log('\n📍 Step 5: Creating test strategies...');
    
    const testStrategies = [
      {
        name: 'Active Strategy With Rules',
        description: 'A test strategy with rules and active status for modal testing',
        is_active: true,
        rules: ['Buy on dips', 'Use stop loss', 'Take profits at resistance', 'Follow trend']
      },
      {
        name: 'Active Strategy Without Rules',
        description: 'A test strategy without rules but active status',
        is_active: true,
        rules: []
      },
      {
        name: 'Inactive Strategy With Rules',
        description: 'A test strategy with rules but inactive status',
        is_active: false,
        rules: ['Rule 1', 'Rule 2', 'Rule 3']
      },
      {
        name: 'High Performance Strategy',
        description: 'A high-performing strategy for testing positive metrics',
        is_active: true,
        rules: ['Advanced rule 1', 'Advanced rule 2', 'Advanced rule 3', 'Advanced rule 4', 'Advanced rule 5']
      }
    ];

    for (let i = 0; i < testStrategies.length; i++) {
      const strategy = testStrategies[i];
      console.log(`📝 Creating strategy: ${strategy.name}`);
      
      // Fill in the form
      await page.locator('input[name="name"]').fill(strategy.name);
      await page.locator('textarea[name="description"]').fill(strategy.description);
      
      // Set active status
      if (strategy.is_active) {
        await page.locator('input[name="is_active"][value="true"]').check();
      } else {
        await page.locator('input[name="is_active"][value="false"]').check();
      }
      
      // Add rules
      if (strategy.rules && strategy.rules.length > 0) {
        // Clear existing rules first
        const existingRules = await page.locator('.rule-item').count();
        for (let j = 0; j < existingRules; j++) {
          await page.locator('.rule-item').first().locator('button').click();
          await page.waitForTimeout(200);
        }
        
        // Add new rules
        for (const rule of strategy.rules) {
          await page.locator('input[placeholder*="rule"]').fill(rule);
          await page.locator('button:has-text("Add Rule")').click();
          await page.waitForTimeout(500);
        }
      }
      
      // Submit the form
      await page.locator('button[type="submit"]').click();
      await page.waitForTimeout(2000);
      
      // Check for success message or redirect
      console.log(`✅ Strategy ${strategy.name} creation submitted`);
    }

    // Navigate back to strategies page to verify creation
    console.log('\n📍 Step 6: Verifying strategy creation...');
    await page.goto('http://localhost:3001/strategies', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    
    // Count created strategies
    const strategyCards = await page.locator('.glass.p-4\\.sm\\:p-6').count();
    console.log(`📊 Total strategy cards found: ${strategyCards}`);
    
    if (strategyCards > 0) {
      console.log('✅ Test strategies created successfully!');
      console.log('\n📝 Next steps:');
      console.log('1. Run: node strategy-modal-test-simple.js');
      console.log('2. The test will now find strategies and test the modal functionality');
      console.log('3. Check console for race condition errors');
      console.log('4. Verify modal tabs work correctly');
      console.log('5. Test responsiveness on different screen sizes');
    } else {
      console.log('❌ Strategy creation may have failed');
    }
    
  } catch (error) {
    console.error('❌ Test execution failed:', error);
  } finally {
    await browser.close();
  }
}

// Run the test
if (require.main === module) {
  createTestStrategies()
    .then(() => {
      console.log('\n✅ Test strategy creation completed!');
      console.log('📝 You can now run the modal test with: node strategy-modal-test-simple.js');
    })
    .catch(error => {
      console.error('❌ Test failed:', error);
    });
}

module.exports = { createTestStrategies };