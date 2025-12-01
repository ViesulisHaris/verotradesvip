const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

// Configuration for responsive testing
const VIEWPORTS = {
  mobile: [
    { width: 320, height: 568, name: 'iPhone SE' },
    { width: 375, height: 667, name: 'iPhone 8' },
    { width: 414, height: 896, name: 'iPhone 11' },
    { width: 768, height: 1024, name: 'iPad' }
  ],
  tablet: [
    { width: 768, height: 1024, name: 'iPad Portrait' },
    { width: 1024, height: 768, name: 'iPad Landscape' },
    { width: 800, height: 1280, name: 'iPad Pro 10.5"' }
  ],
  desktop: [
    { width: 1024, height: 768, name: 'Small Desktop' },
    { width: 1366, height: 768, name: 'MacBook Air' },
    { width: 1440, height: 900, name: 'MacBook Pro 14"' },
    { width: 1680, height: 1050, name: 'MacBook Pro 16"' },
    { width: 1920, height: 1080, name: 'Full HD Desktop' }
  ],
  largeDesktop: [
    { width: 2560, height: 1440, name: '2K Desktop' },
    { width: 3840, height: 2160, name: '4K Desktop' }
  ]
};

// Warm color scheme verification constants
const WARM_COLORS = {
  dustyGold: '#B89B5E',
  warmSand: '#D6C7B2',
  mutedOlive: '#4F5B4A',
  rustRed: '#A7352D',
  warmOffWhite: '#EAE6DD',
  softGraphite: '#1A1A1A',
  deepCharcoal: '#121212'
};

// Test scenarios
const TEST_SCENARIOS = [
  {
    name: 'Dashboard Layout',
    url: 'http://localhost:3000/dashboard',
    selectors: [
      '.total-pnl-metric .text-2xl',
      '.winrate-metric .text-2xl',
      '.profit-factor-metric .text-2xl',
      '.total-trades-metric .text-2xl',
      '.card-unified',
      '.sidebar-overlay'
    ],
    colorChecks: [
      { selector: '.total-pnl-metric .text-2xl', expectedColor: WARM_COLORS.dustyGold },
      { selector: '.winrate-metric .text-2xl', expectedColor: WARM_COLORS.mutedOlive },
      { selector: '.profit-factor-metric .text-2xl', expectedColor: WARM_COLORS.warmSand },
      { selector: '.total-trades-metric .text-2xl', expectedColor: WARM_COLORS.warmOffWhite }
    ]
  },
  {
    name: 'Trade Form',
    url: 'http://localhost:3000/log-trade',
    selectors: [
      '.glass',
      '.metallic-input',
      '.btn-primary',
      'form'
    ],
    colorChecks: [
      { selector: '.btn-primary', expectedColor: WARM_COLORS.dustyGold },
      { selector: '.metallic-input', expectedColor: WARM_COLORS.warmOffWhite }
    ]
  },
  {
    name: 'Sidebar Navigation',
    url: 'http://localhost:3000/dashboard',
    selectors: [
      '.sidebar-menu-item',
      '.sidebar-toggle-button',
      '.nav-item-active'
    ],
    colorChecks: [
      { selector: '.nav-item-active', expectedColor: WARM_COLORS.dustyGold },
      { selector: '.sidebar-toggle-button', expectedColor: WARM_COLORS.dustyGold }
    ]
  },
  {
    name: 'Charts and Visualizations',
    url: 'http://localhost:3000/dashboard',
    selectors: [
      '.chart-container-enhanced',
      '.recharts-wrapper',
      '.emotion-radar'
    ],
    colorChecks: [
      { selector: '.chart-container-enhanced', expectedColor: WARM_COLORS.dustyGold },
      { selector: '.recharts-wrapper', expectedColor: WARM_COLORS.warmSand }
    ]
  },
  {
    name: 'Market Badges',
    url: 'http://localhost:3000/trades',
    selectors: [
      '.market-badge',
      '.compact',
      '.prominent'
    ],
    colorChecks: [
      { selector: '[data-market="stock"]', expectedColor: WARM_COLORS.dustyGold },
      { selector: '[data-market="crypto"]', expectedColor: WARM_COLORS.rustRed },
      { selector: '[data-market="forex"]', expectedColor: WARM_COLORS.mutedOlive },
      { selector: '[data-market="futures"]', expectedColor: WARM_COLORS.warmSand }
    ]
  }
];

// Helper function to extract color from computed style
function extractColor(colorValue) {
  if (!colorValue) return null;
  
  // Handle rgb values
  if (colorValue.includes('rgb')) {
    const rgbMatch = colorValue.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (rgbMatch) {
      const r = parseInt(rgbMatch[1]);
      const g = parseInt(rgbMatch[2]);
      const b = parseInt(rgbMatch[3]);
      return rgbToHex(r, g, b);
    }
  }
  
  // Handle hex values
  if (colorValue.includes('#')) {
    return colorValue.trim();
  }
  
  return colorValue.trim();
}

// Convert RGB to Hex
function rgbToHex(r, g, b) {
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

// Compare colors with tolerance
function colorsMatch(color1, color2, tolerance = 20) {
  if (!color1 || !color2) return false;
  
  // Convert to RGB for comparison
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);
  
  if (!rgb1 || !rgb2) return false;
  
  const distance = Math.sqrt(
    Math.pow(rgb2.r - rgb1.r, 2) +
    Math.pow(rgb2.g - rgb1.g, 2) +
    Math.pow(rgb2.b - rgb1.b, 2)
  );
  
  return distance <= tolerance;
}

// Convert Hex to RGB
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

// Main responsive testing function
async function testResponsiveBehavior() {
  console.log('🚀 Starting responsive warm color scheme testing...');
  
  const browser = await puppeteer.launch({
    headless: false,
    args: ['--start-maximized']
  });
  
  const results = {
    timestamp: new Date().toISOString(),
    summary: {
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      issues: []
    },
    viewportResults: []
  };
  
  try {
    // Test each viewport size
    for (const [category, viewports] of Object.entries(VIEWPORTS)) {
      console.log(`\n📱 Testing ${category} viewports...`);
      
      for (const viewport of viewports) {
        console.log(`  🖥️ Testing ${viewport.name} (${viewport.width}x${viewport.height})...`);
        
        const page = await browser.newPage();
        await page.setViewport({
          width: viewport.width,
          height: viewport.height,
          deviceScaleFactor: 1,
          isMobile: category === 'mobile',
          hasTouch: category === 'mobile'
        });
        
        const viewportResult = {
          viewport,
          category,
          scenarios: []
        };
        
        // Test each scenario
        for (const scenario of TEST_SCENARIOS) {
          console.log(`    📋 Testing ${scenario.name}...`);
          
          try {
            // Navigate to the test page
            await page.goto(scenario.url, { waitUntil: 'networkidle2', timeout: 10000 });
            
            // Wait for page to fully load
            await page.waitForTimeout(2000);
            
            const scenarioResult = {
              name: scenario.name,
              url: scenario.url,
              responsiveTests: [],
              colorTests: [],
              layoutIssues: [],
              performanceIssues: []
            };
            
            // Test responsive layout
            for (const selector of scenario.selectors) {
              try {
                const element = await page.$(selector);
                if (element) {
                  const isVisible = await element.isIntersectingViewport();
                  const boundingBox = await element.boundingBox();
                  const computedStyle = await page.evaluate(el => {
                    return window.getComputedStyle(el);
                  }, element);
                  
                  scenarioResult.responsiveTests.push({
                    selector,
                    isVisible,
                    boundingBox,
                    computedStyle: {
                      display: computedStyle.display,
                      position: computedStyle.position,
                      width: computedStyle.width,
                      height: computedStyle.height,
                      overflow: computedStyle.overflow,
                      zIndex: computedStyle.zIndex
                    }
                  });
                  
                  // Check for common responsive issues
                  if (!isVisible && boundingBox) {
                    scenarioResult.layoutIssues.push({
                      type: 'Element not visible',
                      selector,
                      viewport: `${viewport.width}x${viewport.height}`,
                      issue: 'Element exists but is not visible in viewport'
                    });
                  }
                  
                  if (boundingBox && (boundingBox.width < 10 || boundingBox.height < 10)) {
                    scenarioResult.layoutIssues.push({
                      type: 'Element too small',
                      selector,
                      viewport: `${viewport.width}x${viewport.height}`,
                      issue: `Element dimensions too small: ${boundingBox.width}x${boundingBox.height}`
                    });
                  }
                } else {
                  scenarioResult.layoutIssues.push({
                    type: 'Element not found',
                    selector,
                    viewport: `${viewport.width}x${viewport.height}`,
                    issue: 'Element selector not found on page'
                  });
                }
              } catch (error) {
                scenarioResult.layoutIssues.push({
                  type: 'Selector error',
                  selector,
                  viewport: `${viewport.width}x${viewport.height}`,
                  issue: `Error evaluating selector: ${error.message}`
                });
              }
            }
            
            // Test color consistency
            for (const colorCheck of scenario.colorChecks) {
              try {
                const element = await page.$(colorCheck.selector);
                if (element) {
                  const computedColor = await page.evaluate(el => {
                    const style = window.getComputedStyle(el);
                    return style.color || style.backgroundColor || style.borderColor;
                  }, element);
                  
                  const extractedColor = extractColor(computedColor);
                  const colorMatches = colorsMatch(extractedColor, colorCheck.expectedColor);
                  
                  scenarioResult.colorTests.push({
                    selector: colorCheck.selector,
                    expectedColor: colorCheck.expectedColor,
                    actualColor: extractedColor,
                    matches: colorMatches,
                    computedColor
                  });
                  
                  if (!colorMatches) {
                    scenarioResult.layoutIssues.push({
                      type: 'Color mismatch',
                      selector: colorCheck.selector,
                      viewport: `${viewport.width}x${viewport.height}`,
                      issue: `Expected ${colorCheck.expectedColor}, got ${extractedColor}`
                    });
                  }
                } else {
                  scenarioResult.layoutIssues.push({
                    type: 'Color test element not found',
                    selector: colorCheck.selector,
                    viewport: `${viewport.width}x${viewport.height}`,
                    issue: 'Element for color testing not found'
                  });
                }
              } catch (error) {
                scenarioResult.layoutIssues.push({
                  type: 'Color test error',
                  selector: colorCheck.selector,
                  viewport: `${viewport.width}x${viewport.height}`,
                  issue: `Error testing color: ${error.message}`
                });
              }
            }
            
            // Test specific responsive scenarios
            if (scenario.name === 'Dashboard Layout') {
              // Test dashboard card stacking
              try {
                const cards = await page.$$('.card-unified');
                if (cards.length > 0) {
                  const cardLayouts = await Promise.all(cards.map(card => 
                    card.boundingBox()
                  ));
                  
                  // Check if cards are properly stacked on mobile
                  if (category === 'mobile' && viewport.width <= 768) {
                    const firstCardY = cardLayouts[0]?.y;
                    const secondCardY = cardLayouts[1]?.y;
                    
                    if (firstCardY && secondCardY && Math.abs(firstCardY - secondCardY) < 50) {
                      scenarioResult.layoutIssues.push({
                        type: 'Card stacking issue',
                        selector: '.card-unified',
                        viewport: `${viewport.width}x${viewport.height}`,
                        issue: 'Cards should stack vertically on mobile but appear to be overlapping'
                      });
                    }
                  }
                  
                  // Check if cards are properly arranged in grid on desktop
                  if (category === 'desktop' && viewport.width >= 1024) {
                    const firstCardY = cardLayouts[0]?.y;
                    const secondCardY = cardLayouts[1]?.y;
                    
                    if (firstCardY && secondCardY && Math.abs(firstCardY - secondCardY) > 10) {
                      // Cards should be in the same row
                      const firstCardX = cardLayouts[0]?.x;
                      const secondCardX = cardLayouts[1]?.x;
                      
                      if (firstCardX && secondCardX && Math.abs(firstCardX - secondCardX) > 400) {
                        scenarioResult.layoutIssues.push({
                          type: 'Card grid issue',
                          selector: '.card-unified',
                          viewport: `${viewport.width}x${viewport.height}`,
                          issue: 'Cards should be arranged in a grid on desktop'
                        });
                      }
                    }
                  }
                }
              } catch (error) {
                scenarioResult.layoutIssues.push({
                  type: 'Card layout test error',
                  selector: '.card-unified',
                  viewport: `${viewport.width}x${viewport.height}`,
                  issue: `Error testing card layout: ${error.message}`
                });
              }
            }
            
            if (scenario.name === 'Sidebar Navigation') {
              // Test sidebar behavior on mobile
              try {
                const sidebar = await page.$('.sidebar-overlay');
                if (sidebar) {
                  const isInitiallyVisible = await page.evaluate(el => {
                    return el.style.display !== 'none' && el.style.visibility !== 'hidden';
                  }, sidebar);
                  
                  // On mobile, sidebar should be hidden by default
                  if (category === 'mobile' && isInitiallyVisible) {
                    scenarioResult.layoutIssues.push({
                      type: 'Mobile sidebar visibility',
                      selector: '.sidebar-overlay',
                      viewport: `${viewport.width}x${viewport.height}`,
                      issue: 'Sidebar should be hidden by default on mobile'
                    });
                  }
                  
                  // Test toggle button
                  const toggleButton = await page.$('.sidebar-toggle-button');
                  if (toggleButton) {
                    const toggleBox = await toggleButton.boundingBox();
                    
                    // Toggle button should be visible on mobile
                    if (category === 'mobile' && (!toggleBox || toggleBox.width < 30 || toggleBox.height < 30)) {
                      scenarioResult.layoutIssues.push({
                        type: 'Mobile toggle button',
                        selector: '.sidebar-toggle-button',
                        viewport: `${viewport.width}x${viewport.height}`,
                        issue: 'Toggle button should be visible and properly sized on mobile'
                      });
                    }
                  }
                }
              } catch (error) {
                scenarioResult.layoutIssues.push({
                  type: 'Sidebar test error',
                  selector: '.sidebar-overlay',
                  viewport: `${viewport.width}x${viewport.height}`,
                  issue: `Error testing sidebar: ${error.message}`
                });
              }
            }
            
            if (scenario.name === 'Trade Form') {
              // Test form layout on mobile
              try {
                const form = await page.$('form');
                if (form) {
                  const formBox = await form.boundingBox();
                  
                  // Form should be properly contained on mobile
                  if (category === 'mobile' && formBox) {
                    if (formBox.width > viewport.width - 40) {
                      scenarioResult.layoutIssues.push({
                        type: 'Mobile form overflow',
                        selector: 'form',
                        viewport: `${viewport.width}x${viewport.height}`,
                        issue: 'Form should not overflow viewport on mobile'
                      });
                    }
                  }
                  
                  // Test input field sizing
                  const inputs = await page.$$('input, select, textarea');
                  for (let i = 0; i < inputs.length; i++) {
                    const input = inputs[i];
                    const inputBox = await input.boundingBox();
                    
                    if (category === 'mobile' && inputBox) {
                      if (inputBox.height < 44) {
                        scenarioResult.layoutIssues.push({
                          type: 'Mobile input size',
                          selector: `input:nth-child(${i + 1})`,
                          viewport: `${viewport.width}x${viewport.height}`,
                          issue: 'Input fields should be at least 44px tall on mobile for touch accessibility'
                        });
                      }
                    }
                  }
                }
              } catch (error) {
                scenarioResult.layoutIssues.push({
                  type: 'Form test error',
                  selector: 'form',
                  viewport: `${viewport.width}x${viewport.height}`,
                  issue: `Error testing form: ${error.message}`
                });
              }
            }
            
            viewportResult.scenarios.push(scenarioResult);
            
            // Update summary
            results.summary.totalTests++;
            if (scenarioResult.layoutIssues.length === 0) {
              results.summary.passedTests++;
            } else {
              results.summary.failedTests++;
              results.summary.issues.push(...scenarioResult.layoutIssues);
            }
            
          } catch (error) {
            console.error(`    ❌ Error testing ${scenario.name}:`, error.message);
            const errorResult = {
              name: scenario.name,
              url: scenario.url,
              responsiveTests: [],
              colorTests: [],
              layoutIssues: [{
                type: 'Scenario error',
                selector: 'page',
                viewport: `${viewport.width}x${viewport.height}`,
                issue: `Error loading scenario: ${error.message}`
              }]
            };
            viewportResult.scenarios.push(errorResult);
            results.summary.totalTests++;
            results.summary.failedTests++;
            results.summary.issues.push(...errorResult.layoutIssues);
          }
        }
        
        results.viewportResults.push(viewportResult);
        await page.close();
      }
    }
    
  } catch (error) {
    console.error('❌ Error during testing:', error);
    results.summary.issues.push({
      type: 'Testing framework error',
      issue: error.message
    });
  } finally {
    await browser.close();
  }
  
  // Generate report
  const report = generateReport(results);
  
  // Save report to file
  const reportPath = path.join(__dirname, 'WARM_COLOR_RESPONSIVE_TEST_REPORT.md');
  fs.writeFileSync(reportPath, report);
  
  console.log('\n✅ Responsive testing completed!');
  console.log(`📊 Summary: ${results.summary.passedTests}/${results.summary.totalTests} tests passed`);
  console.log(`📄 Report saved to: ${reportPath}`);
  
  return results;
}

// Generate comprehensive report
function generateReport(results) {
  const timestamp = new Date().toISOString();
  
  let report = `# Warm Color Scheme Responsive Behavior Test Report

**Generated:** ${timestamp}

## Executive Summary

- **Total Tests:** ${results.summary.totalTests}
- **Passed:** ${results.summary.passedTests}
- **Failed:** ${results.summary.failedTests}
- **Success Rate:** ${((results.summary.passedTests / results.summary.totalTests) * 100).toFixed(1)}%

## Warm Color Scheme Analysis

The application has been tested with the new warm color palette:
- **Dusty Gold:** #B89B5E (Primary accents, PnL metrics)
- **Warm Sand:** #D6C7B2 (Secondary accents, Profit Factor)
- **Muted Olive:** #4F5B4A (Tertiary accents, Winrate)
- **Rust Red:** #A7352D (Warning states, Crypto market)
- **Warm Off-White:** #EAE6DD (Text, Total Trades)
- **Soft Graphite:** #1A1A1A (Card backgrounds)
- **Deep Charcoal:** #121212 (Main background)

## Viewport Test Results

`;

  // Generate results for each viewport category
  for (const [category, viewports] of Object.entries(VIEWPORTS)) {
    report += `### ${category.charAt(0).toUpperCase() + category.slice(1)} Devices\n\n`;
    
    for (const viewport of viewports) {
      const viewportResult = results.viewportResults.find(vr => 
        vr.viewport.width === viewport.width && vr.viewport.height === viewport.height
      );
      
      if (viewportResult) {
        report += `#### ${viewport.name} (${viewport.width}x${viewport.height})\n\n`;
        
        for (const scenario of viewportResult.scenarios) {
          report += `**${scenario.name}**\n\n`;
          
          if (scenario.layoutIssues.length === 0) {
            report += `✅ All responsive tests passed\n\n`;
          } else {
            report += `❌ Issues found:\n\n`;
            
            for (const issue of scenario.layoutIssues) {
              report += `- **${issue.type}:** ${issue.issue}\n`;
              report += `  - Selector: \`${issue.selector}\`\n`;
              report += `  - Viewport: ${issue.viewport}\n\n`;
            }
          }
          
          if (scenario.colorTests.length > 0) {
            report += `**Color Consistency Tests:**\n\n`;
            
            for (const colorTest of scenario.colorTests) {
              const status = colorTest.matches ? '✅' : '❌';
              report += `${status} \`${colorTest.selector}\`: Expected ${colorTest.expectedColor}, got ${colorTest.actualColor}\n\n`;
            }
          }
        }
      }
    }
  }
  
  // Add issues summary
  if (results.summary.issues.length > 0) {
    report += `## Issues Summary\n\n`;
    
    const issuesByType = {};
    for (const issue of results.summary.issues) {
      if (issue.type && !issuesByType[issue.type]) {
        issuesByType[issue.type] = [];
      }
      if (issue.type) {
        issuesByType[issue.type].push(issue);
      }
    }
    
    for (const [type, issues] of Object.entries(issuesByType)) {
      report += `### ${type}\n\n`;
      
      for (const issue of issues.slice(0, 5)) { // Limit to first 5 issues per type
        report += `- ${issue.issue} (${issue.viewport})\n`;
      }
      
      if (issues.length > 5) {
        report += `- ... and ${issues.length - 5} more issues\n`;
      }
      
      report += '\n';
    }
  }
  
  // Add recommendations
  report += `## Recommendations\n\n`;
  
  const colorIssues = results.summary.issues.filter(i => i.type && i.type.includes('Color'));
  const layoutIssues = results.summary.issues.filter(i => i.type && (i.type.includes('Element') || i.type.includes('layout')));
  const mobileIssues = results.summary.issues.filter(i => i.viewport && (i.viewport.includes('768') || i.viewport.includes('320') || i.viewport.includes('375')));
  
  if (colorIssues.length > 0) {
    report += `### Color Consistency\n\n`;
    report += `- Review color variable usage across components to ensure warm color scheme consistency\n`;
    report += `- Consider adding CSS custom properties for better color management\n`;
    report += `- Test color contrast ratios for accessibility compliance\n`;
  }
  
  if (layoutIssues.length > 0) {
    report += `### Responsive Layout\n\n`;
    report += `- Review media queries for proper breakpoint handling\n`;
    report += `- Ensure proper element stacking and positioning\n`;
    report += `- Test touch target sizes for mobile accessibility\n`;
  }
  
  if (mobileIssues.length > 0) {
    report += `### Mobile Optimization\n\n`;
    report += `- Optimize sidebar behavior for mobile devices\n`;
    report += `- Ensure proper form field sizing for touch input\n`;
    report += `- Review card stacking and grid layouts on small screens\n`;
  }
  
  report += `### General Improvements\n\n`;
  report += `- Implement responsive typography scaling\n`;
  report += `- Add proper focus states for keyboard navigation\n`;
  report += `- Test with real devices in addition to emulation\n`;
  report += `- Consider using CSS Grid for more robust layouts\n`;
  report += `- Implement proper loading states for different screen sizes\n`;
  
  report += `## Technical Details\n\n`;
  report += `- **Testing Framework:** Puppeteer\n`;
  report += `- **Color Tolerance:** 20 RGB units\n`;
  report += `- **Viewports Tested:** ${Object.values(VIEWPORTS).flat().length}\n`;
  report += `- **Scenarios Tested:** ${TEST_SCENARIOS.length}\n\n`;
  
  report += `---\n`;
  report += `*Report generated by automated responsive testing framework*`;
  
  return report;
}

// Run the test
if (require.main === module) {
  testResponsiveBehavior()
    .then(results => {
      console.log('\n🎉 Testing completed successfully!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n💥 Testing failed:', error);
      process.exit(1);
    });
}

module.exports = { testResponsiveBehavior, WARM_COLORS, VIEWPORTS, TEST_SCENARIOS };