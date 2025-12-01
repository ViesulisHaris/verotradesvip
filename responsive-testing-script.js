const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Test configuration
const BASE_URL = 'http://localhost:3000';
const OUTPUT_DIR = './responsive-test-results';

// Breakpoints to test
const BREAKPOINTS = {
  mobile: [
    { width: 320, height: 568, name: 'iPhone SE' },
    { width: 375, height: 667, name: 'iPhone 8' },
    { width: 414, height: 896, name: 'iPhone 11' },
    { width: 768, height: 1024, name: 'iPad Mini (Portrait)' }
  ],
  tablet: [
    { width: 768, height: 1024, name: 'iPad Mini (Portrait)' },
    { width: 1024, height: 768, name: 'iPad Mini (Landscape)' },
    { width: 834, height: 1194, name: 'iPad Air (Portrait)' },
    { width: 1194, height: 834, name: 'iPad Air (Landscape)' }
  ],
  desktop: [
    { width: 1024, height: 768, name: 'Small Desktop' },
    { width: 1280, height: 720, name: 'Desktop' },
    { width: 1366, height: 768, name: 'MacBook Air' },
    { width: 1440, height: 900, name: 'MacBook Pro' },
    { width: 1920, height: 1080, name: 'Full HD' }
  ],
  ultrawide: [
    { width: 2560, height: 1440, name: '2K Monitor' },
    { width: 3440, height: 1440, name: 'Ultrawide' }
  ]
};

// Pages to test
const PAGES = [
  { path: '/login', name: 'Login Page' },
  { path: '/dashboard', name: 'Dashboard' },
  { path: '/trades', name: 'Trades Page' },
  { path: '/strategies', name: 'Strategies Page' },
  { path: '/log-trade', name: 'Log Trade Form' }
];

// Responsive issues to check for
const RESPONSIVE_CHECKS = {
  horizontalScroll: {
    description: 'Horizontal scrolling detected',
    severity: 'critical',
    check: async (page) => {
      const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
      const viewportWidth = await page.evaluate(() => window.innerWidth);
      return bodyWidth > viewportWidth;
    }
  },
  contentOverflow: {
    description: 'Content overflow detected',
    severity: 'major',
    check: async (page) => {
      return await page.evaluate(() => {
        const elements = document.querySelectorAll('*');
        const overflowElements = [];
        
        for (let el of elements) {
          const styles = window.getComputedStyle(el);
          if (styles.overflow === 'hidden' || styles.overflow === 'scroll' || styles.overflow === 'auto') {
            const rect = el.getBoundingClientRect();
            if (rect.width < el.scrollWidth || rect.height < el.scrollHeight) {
              overflowElements.push({
                element: el.tagName + (el.className ? '.' + el.className : ''),
                width: rect.width,
                scrollWidth: el.scrollWidth,
                height: rect.height,
                scrollHeight: el.scrollHeight
              });
            }
          }
        }
        return overflowElements.length > 0 ? overflowElements : false;
      });
    }
  },
  textTooSmall: {
    description: 'Text too small for mobile',
    severity: 'major',
    check: async (page, viewport) => {
      if (viewport.width < 768) {
        return await page.evaluate(() => {
          const elements = document.querySelectorAll('p, span, div, h1, h2, h3, h4, h5, h6');
          const smallTextElements = [];
          
          for (let el of elements) {
            const styles = window.getComputedStyle(el);
            const fontSize = parseFloat(styles.fontSize);
            
            if (fontSize < 14 && el.textContent.trim().length > 0) {
              smallTextElements.push({
                element: el.tagName + (el.className ? '.' + el.className : ''),
                fontSize: fontSize,
                text: el.textContent.substring(0, 50) + (el.textContent.length > 50 ? '...' : '')
              });
            }
          }
          return smallTextElements.length > 0 ? smallTextElements : false;
        });
      }
      return false;
    }
  },
  touchTargetsTooSmall: {
    description: 'Touch targets too small (<44px)',
    severity: 'critical',
    check: async (page, viewport) => {
      if (viewport.width < 768) {
        return await page.evaluate(() => {
          const clickableElements = document.querySelectorAll('button, a, input[type="button"], input[type="submit"], [role="button"]');
          const smallTargets = [];
          
          for (let el of clickableElements) {
            const rect = el.getBoundingClientRect();
            const minDimension = Math.min(rect.width, rect.height);
            
            if (minDimension < 44) {
              smallTargets.push({
                element: el.tagName + (el.className ? '.' + el.className : ''),
                width: rect.width,
                height: rect.height,
                text: el.textContent || el.placeholder || ''
              });
            }
          }
          return smallTargets.length > 0 ? smallTargets : false;
        });
      }
      return false;
    }
  },
  overlappingElements: {
    description: 'Overlapping elements detected',
    severity: 'major',
    check: async (page) => {
      return await page.evaluate(() => {
        const elements = document.querySelectorAll('*');
        const overlaps = [];
        
        for (let i = 0; i < elements.length; i++) {
          for (let j = i + 1; j < elements.length; j++) {
            const rect1 = elements[i].getBoundingClientRect();
            const rect2 = elements[j].getBoundingClientRect();
            
            if (!(rect1.right < rect2.left || 
                  rect1.left > rect2.right || 
                  rect1.bottom < rect2.top || 
                  rect1.top > rect2.bottom)) {
              
              // Check if elements are visible and not nested
              const styles1 = window.getComputedStyle(elements[i]);
              const styles2 = window.getComputedStyle(elements[j]);
              
              if (styles1.display !== 'none' && styles2.display !== 'none' &&
                  styles1.visibility !== 'hidden' && styles2.visibility !== 'hidden' &&
                  !elements[i].contains(elements[j]) && !elements[j].contains(elements[i])) {
                
                overlaps.push({
                  element1: elements[i].tagName + (elements[i].className ? '.' + elements[i].className : ''),
                  element2: elements[j].tagName + (elements[j].className ? '.' + elements[j].className : '')
                });
              }
            }
          }
        }
        return overlaps.length > 5 ? overlaps.slice(0, 5) : false; // Limit to first 5 overlaps
      });
    }
  },
  gridBreaks: {
    description: 'Grid layout breaks',
    severity: 'major',
    check: async (page) => {
      return await page.evaluate(() => {
        const gridElements = document.querySelectorAll('[class*="grid"]');
        const brokenGrids = [];
        
        for (let grid of gridElements) {
          const styles = window.getComputedStyle(grid);
          if (styles.display === 'grid') {
            const rect = grid.getBoundingClientRect();
            const children = grid.children;
            
            for (let child of children) {
              const childRect = child.getBoundingClientRect();
              if (childRect.left < rect.left || childRect.right > rect.right ||
                  childRect.top < rect.top || childRect.bottom > rect.bottom) {
                brokenGrids.push({
                  element: grid.tagName + (grid.className ? '.' + grid.className : ''),
                  childElement: child.tagName + (child.className ? '.' + child.className : '')
                });
              }
            }
          }
        }
        return brokenGrids.length > 0 ? brokenGrids : false;
      });
    }
  }
};

// Initialize output directory
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Main testing function
async function runResponsiveTests() {
  console.log('🚀 Starting VeroTrade Responsive Testing...\n');
  
  const browser = await puppeteer.launch({
    headless: false, // Set to true for headless testing
    defaultViewport: null,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const results = {
    timestamp: new Date().toISOString(),
    summary: {
      totalTests: 0,
      passed: 0,
      failed: 0,
      criticalIssues: 0,
      majorIssues: 0,
      minorIssues: 0
    },
    pages: {}
  };
  
  try {
    for (const pageConfig of PAGES) {
      console.log(`📱 Testing: ${pageConfig.name}`);
      
      const pageResults = {
        breakpoints: {},
        overallStatus: 'passed'
      };
      
      for (const [deviceType, breakpoints] of Object.entries(BREAKPOINTS)) {
        for (const viewport of breakpoints) {
          const viewportKey = `${viewport.width}x${viewport.height}`;
          console.log(`  🖥️  ${viewport.name} (${viewport.width}x${viewport.height})`);
          
          const page = await browser.newPage();
          await page.setViewport({ width: viewport.width, height: viewport.height });
          
          try {
            // Navigate to page
            await page.goto(`${BASE_URL}${pageConfig.path}`, { 
              waitUntil: 'networkidle2',
              timeout: 30000 
            });
            
            // Wait for content to load
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Take screenshot
            const screenshotPath = path.join(OUTPUT_DIR, `${pageConfig.name.replace(/\s+/g, '_')}_${viewportKey}.png`);
            await page.screenshot({ path: screenshotPath, fullPage: true });
            
            // Run responsive checks
            const viewportResults = {
              viewport: viewport,
              issues: [],
              status: 'passed'
            };
            
            for (const [checkName, checkConfig] of Object.entries(RESPONSIVE_CHECKS)) {
              try {
                const issue = await checkConfig.check(page, viewport);
                if (issue) {
                  viewportResults.issues.push({
                    type: checkName,
                    description: checkConfig.description,
                    severity: checkConfig.severity,
                    details: issue
                  });
                  viewportResults.status = 'failed';
                  
                  if (checkConfig.severity === 'critical') {
                    results.summary.criticalIssues++;
                  } else if (checkConfig.severity === 'major') {
                    results.summary.majorIssues++;
                  } else {
                    results.summary.minorIssues++;
                  }
                }
              } catch (error) {
                console.error(`    ❌ Error in ${checkName} check:`, error.message);
              }
            }
            
            pageResults.breakpoints[viewportKey] = viewportResults;
            results.summary.totalTests++;
            
            if (viewportResults.status === 'passed') {
              results.summary.passed++;
            } else {
              results.summary.failed++;
              pageResults.overallStatus = 'failed';
            }
            
            console.log(`    ${viewportResults.status === 'passed' ? '✅' : '❌'} ${viewportResults.issues.length} issues found`);
            
          } catch (error) {
            console.error(`    ❌ Error testing ${viewport.name}:`, error.message);
            pageResults.breakpoints[viewportKey] = {
              viewport: viewport,
              issues: [{ type: 'navigation_error', description: 'Failed to load page', severity: 'critical', details: error.message }],
              status: 'failed'
            };
            results.summary.failed++;
            results.summary.criticalIssues++;
          } finally {
            await page.close();
          }
        }
      }
      
      results.pages[pageConfig.name] = pageResults;
      console.log(`  📊 Status: ${pageResults.overallStatus === 'passed' ? '✅ PASSED' : '❌ FAILED'}\n`);
    }
    
    // Generate report
    await generateReport(results);
    
  } catch (error) {
    console.error('❌ Test execution failed:', error);
  } finally {
    await browser.close();
  }
  
  console.log('🎉 Responsive testing completed!');
  console.log(`📈 Summary: ${results.summary.passed}/${results.summary.totalTests} tests passed`);
  console.log(`🚨 Issues: ${results.summary.criticalIssues} critical, ${results.summary.majorIssues} major, ${results.summary.minorIssues} minor`);
  console.log(`📁 Results saved to: ${OUTPUT_DIR}`);
}

// Generate comprehensive report
async function generateReport(results) {
  const reportPath = path.join(OUTPUT_DIR, 'RESPONSIVE_TESTING_REPORT.md');
  
  let report = `# VeroTrade Responsive Testing Report\n\n`;
  report += `**Generated:** ${new Date(results.timestamp).toLocaleString()}\n\n`;
  
  // Executive Summary
  report += `## 📊 Executive Summary\n\n`;
  report += `- **Total Tests:** ${results.summary.totalTests}\n`;
  report += `- **Passed:** ${results.summary.passed}\n`;
  report += `- **Failed:** ${results.summary.failed}\n`;
  report += `- **Success Rate:** ${((results.summary.passed / results.summary.totalTests) * 100).toFixed(1)}%\n\n`;
  
  report += `### 🚨 Issues by Severity\n\n`;
  report += `- **Critical:** ${results.summary.criticalIssues}\n`;
  report += `- **Major:** ${results.summary.majorIssues}\n`;
  report += `- **Minor:** ${results.summary.minorIssues}\n\n`;
  
  // Detailed Results
  report += `## 📱 Detailed Results\n\n`;
  
  for (const [pageName, pageResults] of Object.entries(results.pages)) {
    report += `### ${pageName}\n\n`;
    report += `**Overall Status:** ${pageResults.overallStatus === 'passed' ? '✅ PASSED' : '❌ FAILED'}\n\n`;
    
    // Group issues by device type
    const deviceIssues = {
      mobile: [],
      tablet: [],
      desktop: [],
      ultrawide: []
    };
    
    for (const [viewport, viewportResults] of Object.entries(pageResults.breakpoints)) {
      const width = parseInt(viewport.split('x')[0]);
      
      let deviceType;
      if (width < 768) deviceType = 'mobile';
      else if (width < 1024) deviceType = 'tablet';
      else if (width < 1440) deviceType = 'desktop';
      else deviceType = 'ultrawide';
      
      if (viewportResults.issues.length > 0) {
        deviceIssues[deviceType].push({
          viewport: viewportResults.viewport,
          issues: viewportResults.issues
        });
      }
    }
    
    // Report issues by device type
    for (const [deviceType, issues] of Object.entries(deviceIssues)) {
      if (issues.length > 0) {
        report += `#### ${deviceType.charAt(0).toUpperCase() + deviceType.slice(1)} Issues\n\n`;
        
        for (const issue of issues) {
          report += `**${issue.viewport.name} (${issue.viewport.width}x${issue.viewport.height}):**\n`;
          
          for (const problem of issue.issues) {
            report += `- **${problem.severity.toUpperCase()}:** ${problem.description}\n`;
            if (problem.details && typeof problem.details === 'object') {
              if (Array.isArray(problem.details)) {
                report += `  - Found ${problem.details.length} instances\n`;
              } else {
                report += `  - Details: ${JSON.stringify(problem.details, null, 2)}\n`;
              }
            }
          }
          report += `\n`;
        }
      }
    }
    
    if (Object.values(deviceIssues).every(issues => issues.length === 0)) {
      report += `✅ No responsive issues found on any device.\n\n`;
    }
  }
  
  // Recommendations
  report += `## 🛠️ Recommendations\n\n`;
  
  if (results.summary.criticalIssues > 0) {
    report += `### 🚨 Critical Issues (Immediate Action Required)\n\n`;
    report += `1. **Fix horizontal scrolling** on mobile devices\n`;
    report += `2. **Increase touch target sizes** to minimum 44px for mobile\n`;
    report += `3. **Resolve navigation errors** that prevent page loading\n\n`;
  }
  
  if (results.summary.majorIssues > 0) {
    report += `### ⚠️ Major Issues (High Priority)\n\n`;
    report += `1. **Fix content overflow** in grid layouts\n`;
    report += `2. **Increase text sizes** for better mobile readability\n`;
    report += `3. **Resolve overlapping elements** in complex layouts\n\n`;
  }
  
  if (results.summary.minorIssues > 0) {
    report += `### 💡 Minor Issues (Medium Priority)\n\n`;
    report += `1. **Fine-tune spacing** for better visual hierarchy\n`;
    report += `2. **Optimize grid layouts** for ultrawide displays\n\n`;
  }
  
  if (results.summary.failed === 0) {
    report += `🎉 **Excellent!** No responsive issues found. The application works perfectly across all tested devices.\n\n`;
  }
  
  // Testing methodology
  report += `## 🧪 Testing Methodology\n\n`;
  report += `### Devices Tested\n\n`;
  
  for (const [deviceType, breakpoints] of Object.entries(BREAKPOINTS)) {
    report += `**${deviceType.charAt(0).toUpperCase() + deviceType.slice(1)}:**\n`;
    for (const bp of breakpoints) {
      report += `- ${bp.name} (${bp.width}x${bp.height})\n`;
    }
    report += `\n`;
  }
  
  report += `### Checks Performed\n\n`;
  for (const [checkName, checkConfig] of Object.entries(RESPONSIVE_CHECKS)) {
    report += `- **${checkName}:** ${checkConfig.description}\n`;
  }
  
  report += `\n---\n`;
  report += `*Report generated by VeroTrade Responsive Testing Script*\n`;
  
  fs.writeFileSync(reportPath, report);
  console.log(`📄 Detailed report generated: ${reportPath}`);
}

// Run the tests
if (require.main === module) {
  runResponsiveTests().catch(console.error);
}

module.exports = { runResponsiveTests, BREAKPOINTS, PAGES, RESPONSIVE_CHECKS };