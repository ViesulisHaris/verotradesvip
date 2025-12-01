/**
 * Comprehensive Responsive Fixes Verification Test
 * 
 * This script tests all the responsive fixes implemented to address
 * the issues identified in the responsive behavior verification report.
 * 
 * Tests:
 * 1. Mobile navigation sidebar visibility and hamburger menu functionality
 * 2. Touch targets (44px minimum) for all interactive elements
 * 3. Responsive breakpoints for navigation collapse behavior
 * 4. Form elements touch optimization
 * 5. Responsive card layouts
 * 6. Charts and data visualization responsiveness
 * 7. Spacing and padding consistency
 * 8. Component adaptation across breakpoints
 */

const puppeteer = require('puppeteer');
const path = require('path');

// Test configuration
const TEST_CONFIG = {
  viewports: [
    { name: 'Mobile', width: 375, height: 667 },
    { name: 'Tablet', width: 768, height: 1024 },
    { name: 'Laptop', width: 1024, height: 768 },
    { name: 'Desktop', width: 1920, height: 1080 }
  ],
  baseUrl: 'http://localhost:3000',
  testPages: [
    '/dashboard',
    '/trades',
    '/strategies',
    '/settings'
  ]
};

class ResponsiveFixesVerifier {
  constructor() {
    this.browser = null;
    this.page = null;
    this.results = {
      navigation: {},
      touchTargets: {},
      responsiveBreakpoints: {},
      formElements: {},
      cardLayouts: {},
      charts: {},
      spacing: {},
      componentAdaptation: {}
    };
  }

  async init() {
    console.log('🚀 Starting Responsive Fixes Verification...');
    this.browser = await puppeteer.launch({
      headless: false,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    this.page = await this.browser.newPage();
    await this.page.setViewport({ width: 1920, height: 1080 });
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  async testNavigationFunctionality(viewport) {
    console.log(`📱 Testing navigation functionality for ${viewport.name}...`);
    
    await this.page.setViewport(viewport);
    await this.page.goto(`${TEST_CONFIG.baseUrl}/dashboard`, { waitUntil: 'networkidle2' });
    await this.page.waitForTimeout(2000);

    const results = {
      mobileMenuButton: false,
      sidebarVisibility: false,
      hamburgerFunctionality: false,
      touchTargets: false
    };

    if (viewport.width <= 767) {
      // Test mobile menu button visibility and functionality
      const menuButton = await this.page.$('.verotrade-mobile-menu-btn');
      if (menuButton) {
        const buttonBox = await menuButton.boundingBox();
        results.mobileMenuButton = buttonBox && buttonBox.width >= 44 && buttonBox.height >= 44;
        
        // Test hamburger menu functionality
        await menuButton.click();
        await this.page.waitForTimeout(500);
        
        const sidebar = await this.page.$('.verotrade-sidebar');
        if (sidebar) {
          const sidebarBox = await sidebar.boundingBox();
          results.sidebarVisibility = sidebarBox && sidebarBox.width > 0;
          results.hamburgerFunctionality = true;
        }
      }

      // Test overlay
      const overlay = await this.page.$('.verotrade-mobile-overlay');
      if (overlay) {
        const overlayVisible = await this.page.evaluate(el => {
          return window.getComputedStyle(el).display !== 'none';
        }, overlay);
        results.overlayFunctionality = overlayVisible;
      }
    } else {
      // Test desktop sidebar visibility
      const sidebar = await this.page.$('.verotrade-sidebar');
      if (sidebar) {
        const sidebarBox = await sidebar.boundingBox();
        results.sidebarVisibility = sidebarBox && sidebarBox.width > 0;
      }
    }

    this.results.navigation[viewport.name] = results;
    return results;
  }

  async testTouchTargets(viewport) {
    console.log(`👆 Testing touch targets for ${viewport.name}...`);
    
    await this.page.setViewport(viewport);
    await this.page.goto(`${TEST_CONFIG.baseUrl}/dashboard`, { waitUntil: 'networkidle2' });
    await this.page.waitForTimeout(2000);

    const touchElements = await this.page.$$(
      '.verotrade-nav-item, .button-primary, .button-secondary, .input-field, .nav-button'
    );

    let validTouchTargets = 0;
    let totalTouchElements = touchElements.length;

    for (const element of touchElements) {
      const box = await element.boundingBox();
      if (box && box.width >= 44 && box.height >= 44) {
        validTouchTargets++;
      }
    }

    const touchTargetScore = totalTouchElements > 0 ? (validTouchTargets / totalTouchElements) * 100 : 0;
    
    this.results.touchTargets[viewport.name] = {
      score: touchTargetScore,
      validTargets: validTouchTargets,
      totalTargets: totalTouchElements,
      passed: touchTargetScore >= 90
    };

    return this.results.touchTargets[viewport.name];
  }

  async testResponsiveBreakpoints(viewport) {
    console.log(`📏 Testing responsive breakpoints for ${viewport.name}...`);
    
    await this.page.setViewport(viewport);
    await this.page.goto(`${TEST_CONFIG.baseUrl}/dashboard`, { waitUntil: 'networkidle2' });
    await this.page.waitForTimeout(2000);

    const results = {
      gridLayouts: false,
      typographyScaling: false,
      contentReflow: false
    };

    // Test grid layouts
    const gridElements = await this.page.$$('.key-metrics-grid, .performance-grid, .charts-grid, .bottom-grid');
    for (const grid of gridElements) {
      const gridStyle = await this.page.evaluate(el => {
        return window.getComputedStyle(el).display;
      }, grid);
      
      if (gridStyle.includes('grid')) {
        results.gridLayouts = true;
      }
    }

    // Test typography scaling
    const typographyElements = await this.page.$$('.h1-dashboard, .h2-section, .metric-value');
    for (const typo of typographyElements) {
      const typoStyle = await this.page.evaluate(el => {
        const style = window.getComputedStyle(el);
        return {
          fontSize: style.fontSize,
          responsive: style.fontSize.includes('clamp') || style.fontSize.includes('vw')
        };
      }, typo);
      
      if (typoStyle.responsive) {
        results.typographyScaling = true;
      }
    }

    // Test content reflow
    const contentWrapper = await this.page.$('.verotrade-content-wrapper');
    if (contentWrapper) {
      const wrapperStyle = await this.page.evaluate(el => {
        const style = window.getComputedStyle(el);
        return {
          padding: style.padding,
          maxWidth: style.maxWidth
        };
      }, contentWrapper);
      
      results.contentReflow = wrapperStyle.padding !== '0px' || wrapperStyle.maxWidth !== 'none';
    }

    this.results.responsiveBreakpoints[viewport.name] = results;
    return results;
  }

  async testFormElements(viewport) {
    console.log(`📝 Testing form elements for ${viewport.name}...`);
    
    await this.page.setViewport(viewport);
    await this.page.goto(`${TEST_CONFIG.baseUrl}/login`, { waitUntil: 'networkidle2' });
    await this.page.waitForTimeout(2000);

    const inputElements = await this.page.$$('.input-field');
    let validFormElements = 0;

    for (const input of inputElements) {
      const box = await input.boundingBox();
      if (box && box.width >= 44 && box.height >= 44) {
        validFormElements++;
      }
      
      // Test font size to prevent iOS zoom
      const fontSize = await this.page.evaluate(el => {
        return window.getComputedStyle(el).fontSize;
      }, input);
      
      if (fontSize && parseInt(fontSize) >= 16) {
        validFormElements++;
      }
    }

    const formScore = inputElements.length > 0 ? (validFormElements / inputElements.length) * 100 : 0;
    
    this.results.formElements[viewport.name] = {
      score: formScore,
      validElements: validFormElements,
      totalElements: inputElements.length,
      passed: formScore >= 90
    };

    return this.results.formElements[viewport.name];
  }

  async testCardLayouts(viewport) {
    console.log(`🃏 Testing card layouts for ${viewport.name}...`);
    
    await this.page.setViewport(viewport);
    await this.page.goto(`${TEST_CONFIG.baseUrl}/dashboard`, { waitUntil: 'networkidle2' });
    await this.page.waitForTimeout(2000);

    const cards = await this.page.$$('.dashboard-card');
    let responsiveCards = 0;

    for (const card of cards) {
      const cardStyle = await this.page.evaluate(el => {
        const style = window.getComputedStyle(el);
        return {
          overflow: style.overflow,
          minWidth: style.minWidth,
          borderRadius: style.borderRadius
        };
      }, card);
      
      // Check if cards are responsive
      if (cardStyle.overflow === 'hidden' || cardStyle.minWidth === '0px') {
        responsiveCards++;
      }
    }

    const cardScore = cards.length > 0 ? (responsiveCards / cards.length) * 100 : 0;
    
    this.results.cardLayouts[viewport.name] = {
      score: cardScore,
      responsiveCards: responsiveCards,
      totalCards: cards.length,
      passed: cardScore >= 80
    };

    return this.results.cardLayouts[viewport.name];
  }

  async testCharts(viewport) {
    console.log(`📊 Testing charts for ${viewport.name}...`);
    
    await this.page.setViewport(viewport);
    await this.page.goto(`${TEST_CONFIG.baseUrl}/dashboard`, { waitUntil: 'networkidle2' });
    await this.page.waitForTimeout(2000);

    const chartContainers = await this.page.$$('.verotrade-h-80');
    let responsiveCharts = 0;

    for (const chart of chartContainers) {
      const chartStyle = await this.page.evaluate(el => {
        const style = window.getComputedStyle(el);
        return {
          minHeight: style.minHeight,
          height: style.height,
          padding: style.padding
        };
      }, chart);
      
      // Check if charts have responsive properties
      if (chartStyle.minHeight && chartStyle.minHeight !== '0px') {
        responsiveCharts++;
      }
    }

    const chartScore = chartContainers.length > 0 ? (responsiveCharts / chartContainers.length) * 100 : 0;
    
    this.results.charts[viewport.name] = {
      score: chartScore,
      responsiveCharts: responsiveCharts,
      totalCharts: chartContainers.length,
      passed: chartScore >= 80
    };

    return this.results.charts[viewport.name];
  }

  async testSpacing(viewport) {
    console.log(`📏 Testing spacing for ${viewport.name}...`);
    
    await this.page.setViewport(viewport);
    await this.page.goto(`${TEST_CONFIG.baseUrl}/dashboard`, { waitUntil: 'networkidle2' });
    await this.page.waitForTimeout(2000);

    const contentWrapper = await this.page.$('.verotrade-content-wrapper');
    let consistentSpacing = false;

    if (contentWrapper) {
      const wrapperStyle = await this.page.evaluate(el => {
        const style = window.getComputedStyle(el);
        return {
          padding: style.padding,
          gap: style.gap
        };
      }, contentWrapper);
      
      // Check if spacing adapts to viewport
      if (viewport.width <= 767) {
        consistentSpacing = wrapperStyle.padding === '12px' || wrapperStyle.padding.includes('12px');
      } else if (viewport.width <= 1023) {
        consistentSpacing = wrapperStyle.padding === '20px' || wrapperStyle.padding.includes('20px');
      } else {
        consistentSpacing = wrapperStyle.padding === '32px' || wrapperStyle.padding.includes('32px');
      }
    }

    this.results.spacing[viewport.name] = {
      consistent: consistentSpacing,
      padding: contentWrapper ? await this.page.evaluate(el => window.getComputedStyle(el).padding, contentWrapper) : 'N/A',
      passed: consistentSpacing
    };

    return this.results.spacing[viewport.name];
  }

  async testComponentAdaptation(viewport) {
    console.log(`🧩 Testing component adaptation for ${viewport.name}...`);
    
    await this.page.setViewport(viewport);
    await this.page.goto(`${TEST_CONFIG.baseUrl}/dashboard`, { waitUntil: 'networkidle2' });
    await this.page.waitForTimeout(2000);

    const components = await this.page.$$('[class*="verotrade-"]');
    let adaptedComponents = 0;

    for (const component of components) {
      const compStyle = await this.page.evaluate(el => {
        const style = window.getComputedStyle(el);
        return {
          display: style.display,
          visibility: style.visibility,
          transform: style.transform
        };
      }, component);
      
      // Check if components adapt properly
      if (compStyle.display !== 'none' && compStyle.visibility !== 'hidden') {
        adaptedComponents++;
      }
    }

    const adaptationScore = components.length > 0 ? (adaptedComponents / components.length) * 100 : 0;
    
    this.results.componentAdaptation[viewport.name] = {
      score: adaptationScore,
      adaptedComponents: adaptedComponents,
      totalComponents: components.length,
      passed: adaptationScore >= 80
    };

    return this.results.componentAdaptation[viewport.name];
  }

  async takeScreenshot(viewport, testName) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `responsive-fixes-${viewport.name.toLowerCase()}-${testName}-${timestamp}.png`;
    const screenshotPath = path.join(__dirname, filename);
    
    await this.page.screenshot({
      path: screenshotPath,
      fullPage: true,
      type: 'png'
    });
    
    console.log(`📸 Screenshot saved: ${filename}`);
    return screenshotPath;
  }

  async runAllTests() {
    console.log('🧪 Running comprehensive responsive fixes verification...\n');
    
    for (const viewport of TEST_CONFIG.viewports) {
      console.log(`\n📱 Testing ${viewport.name} (${viewport.width}x${viewport.height})...`);
      
      // Run all tests for this viewport
      await this.testNavigationFunctionality(viewport);
      await this.takeScreenshot(viewport, 'navigation');
      
      await this.testTouchTargets(viewport);
      await this.takeScreenshot(viewport, 'touch-targets');
      
      await this.testResponsiveBreakpoints(viewport);
      await this.takeScreenshot(viewport, 'breakpoints');
      
      await this.testFormElements(viewport);
      await this.takeScreenshot(viewport, 'forms');
      
      await this.testCardLayouts(viewport);
      await this.takeScreenshot(viewport, 'cards');
      
      await this.testCharts(viewport);
      await this.takeScreenshot(viewport, 'charts');
      
      await this.testSpacing(viewport);
      await this.takeScreenshot(viewport, 'spacing');
      
      await this.testComponentAdaptation(viewport);
      await this.takeScreenshot(viewport, 'components');
    }
  }

  generateReport() {
    console.log('\n📊 GENERATING COMPREHENSIVE REPORT...\n');
    
    let totalScore = 0;
    let maxScore = 0;
    
    // Calculate overall scores
    for (const viewport of TEST_CONFIG.viewports) {
      console.log(`\n📱 ${viewport.name} Results:`);
      
      // Navigation
      if (this.results.navigation[viewport.name]) {
        const navScore = this.results.navigation[viewport.name].mobileMenuButton && 
                          this.results.navigation[viewport.name].sidebarVisibility ? 100 : 50;
        console.log(`  🧭 Navigation: ${navScore}%`);
        totalScore += navScore;
        maxScore += 100;
      }
      
      // Touch Targets
      if (this.results.touchTargets[viewport.name]) {
        console.log(`  👆 Touch Targets: ${this.results.touchTargets[viewport.name].score}% (${this.results.touchTargets[viewport.name].validTargets}/${this.results.touchTargets[viewport.name].totalTargets})`);
        totalScore += this.results.touchTargets[viewport.name].score;
        maxScore += 100;
      }
      
      // Responsive Breakpoints
      if (this.results.responsiveBreakpoints[viewport.name]) {
        const bpScore = (this.results.responsiveBreakpoints[viewport.name].gridLayouts ? 33 : 0) +
                        (this.results.responsiveBreakpoints[viewport.name].typographyScaling ? 33 : 0) +
                        (this.results.responsiveBreakpoints[viewport.name].contentReflow ? 34 : 0);
        console.log(`  📏 Breakpoints: ${bpScore}%`);
        totalScore += bpScore;
        maxScore += 100;
      }
      
      // Form Elements
      if (this.results.formElements[viewport.name]) {
        console.log(`  📝 Forms: ${this.results.formElements[viewport.name].score}%`);
        totalScore += this.results.formElements[viewport.name].score;
        maxScore += 100;
      }
      
      // Card Layouts
      if (this.results.cardLayouts[viewport.name]) {
        console.log(`  🃏 Cards: ${this.results.cardLayouts[viewport.name].score}%`);
        totalScore += this.results.cardLayouts[viewport.name].score;
        maxScore += 100;
      }
      
      // Charts
      if (this.results.charts[viewport.name]) {
        console.log(`  📊 Charts: ${this.results.charts[viewport.name].score}%`);
        totalScore += this.results.charts[viewport.name].score;
        maxScore += 100;
      }
      
      // Spacing
      if (this.results.spacing[viewport.name]) {
        const spacingScore = this.results.spacing[viewport.name].passed ? 100 : 50;
        console.log(`  📏 Spacing: ${spacingScore}%`);
        totalScore += spacingScore;
        maxScore += 100;
      }
      
      // Component Adaptation
      if (this.results.componentAdaptation[viewport.name]) {
        console.log(`  🧩 Components: ${this.results.componentAdaptation[viewport.name].score}%`);
        totalScore += this.results.componentAdaptation[viewport.name].score;
        maxScore += 100;
      }
    }
    
    const overallScore = Math.round((totalScore / maxScore) * 100);
    
    console.log(`\n🎯 OVERALL RESPONSIVE SCORE: ${overallScore}%`);
    
    if (overallScore >= 90) {
      console.log('✅ EXCELLENT: Responsive fixes are working perfectly!');
    } else if (overallScore >= 80) {
      console.log('🟡 GOOD: Responsive fixes are working well with minor issues.');
    } else if (overallScore >= 70) {
      console.log('🟡 FAIR: Responsive fixes have some issues that need attention.');
    } else {
      console.log('❌ POOR: Responsive fixes need significant improvement.');
    }
    
    return {
      overallScore,
      results: this.results,
      timestamp: new Date().toISOString()
    };
  }
}

// Main execution
async function main() {
  const verifier = new ResponsiveFixesVerifier();
  
  try {
    await verifier.init();
    await verifier.runAllTests();
    const report = verifier.generateReport();
    
    // Save report to file
    const fs = require('fs');
    const reportPath = path.join(__dirname, 'RESPONSIVE_FIXES_VERIFICATION_REPORT.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log(`\n📄 Report saved to: ${reportPath}`);
    console.log('\n🎉 Responsive fixes verification completed!');
    
  } catch (error) {
    console.error('❌ Error during verification:', error);
  } finally {
    await verifier.cleanup();
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = ResponsiveFixesVerifier;