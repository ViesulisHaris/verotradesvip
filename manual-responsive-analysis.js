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
    { width: 414, height: 896, name: 'iPhone 11' }
  ],
  tablet: [
    { width: 768, height: 1024, name: 'iPad Mini (Portrait)' },
    { width: 1024, height: 768, name: 'iPad Mini (Landscape)' }
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

// Initialize output directory
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Manual responsive analysis
async function performManualResponsiveAnalysis() {
  console.log('🔍 Starting Manual VeroTrade Responsive Analysis...\n');
  
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const analysisResults = {
    timestamp: new Date().toISOString(),
    pages: {},
    summary: {
      totalIssues: 0,
      criticalIssues: 0,
      majorIssues: 0,
      minorIssues: 0
    }
  };
  
  try {
    for (const pageConfig of PAGES) {
      console.log(`📱 Analyzing: ${pageConfig.name}`);
      
      const pageResults = {
        breakpoints: {},
        overallStatus: 'passed',
        issues: []
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
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            // Take screenshot
            const screenshotPath = path.join(OUTPUT_DIR, `${pageConfig.name.replace(/\s+/g, '_')}_${viewportKey}.png`);
            await page.screenshot({ path: screenshotPath, fullPage: true });
            
            // Perform manual responsive analysis
            const viewportAnalysis = await page.evaluate(() => {
              const issues = [];
              
              // Check for horizontal scroll
              const bodyScrollWidth = document.body.scrollWidth;
              const viewportWidth = window.innerWidth;
              if (bodyScrollWidth > viewportWidth) {
                issues.push({
                  type: 'horizontal_scroll',
                  severity: 'critical',
                  description: `Horizontal scrolling detected: body width ${bodyScrollWidth}px > viewport ${viewportWidth}px`,
                  details: { bodyScrollWidth, viewportWidth }
                });
              }
              
              // Check for common responsive issues
              const allElements = document.querySelectorAll('*');
              const problemElements = [];
              
              for (let el of allElements) {
                const styles = window.getComputedStyle(el);
                const rect = el.getBoundingClientRect();
                
                // Check for elements outside viewport
                if (rect.right > viewportWidth || rect.bottom > window.innerHeight) {
                  if (el.textContent && el.textContent.trim().length > 0) {
                    problemElements.push({
                      element: el.tagName + (el.className ? '.' + el.className : ''),
                      issue: 'Element outside viewport',
                      position: `right: ${rect.right}px, bottom: ${rect.bottom}px`,
                      text: el.textContent.substring(0, 50)
                    });
                  }
                }
                
                // Check for text too small on mobile
                if (window.innerWidth < 768) {
                  const fontSize = parseFloat(styles.fontSize);
                  if (fontSize < 14 && el.textContent && el.textContent.trim().length > 0) {
                    issues.push({
                      type: 'text_too_small',
                      severity: 'major',
                      description: `Text too small: ${fontSize}px for ${el.tagName}`,
                      details: { fontSize, element: el.tagName, text: el.textContent.substring(0, 30) }
                    });
                  }
                }
                
                // Check for touch targets too small on mobile
                if (window.innerWidth < 768) {
                  const clickableEl = el.matches('button, a, input[type="button"], input[type="submit"], [role="button"], .btn-primary, .btn-secondary, .btn-ghost');
                  if (clickableEl) {
                    const minDimension = Math.min(rect.width, rect.height);
                    if (minDimension < 44) {
                      issues.push({
                        type: 'touch_target_too_small',
                        severity: 'critical',
                        description: `Touch target too small: ${minDimension}px < 44px`,
                        details: { width: rect.width, height: rect.height, element: el.tagName }
                      });
                    }
                  }
                }
              }
              
              // Check grid layouts
              const gridElements = document.querySelectorAll('[class*="grid"]');
              for (let grid of gridElements) {
                const styles = window.getComputedStyle(grid);
                if (styles.display === 'grid') {
                  const rect = grid.getBoundingClientRect();
                  const children = grid.children;
                  
                  for (let child of children) {
                    const childRect = child.getBoundingClientRect();
                    if (childRect.left < rect.left || childRect.right > rect.right ||
                        childRect.top < rect.top || childRect.bottom > rect.bottom) {
                      issues.push({
                        type: 'grid_break',
                        severity: 'major',
                        description: `Grid layout break detected`,
                        details: { 
                          grid: grid.tagName + (grid.className ? '.' + grid.className : ''),
                          child: child.tagName + (child.className ? '.' + child.className : '')
                        }
                      });
                    }
                  }
                }
              }
              
              // Check for overlapping elements (simplified)
              const visibleElements = Array.from(document.querySelectorAll('*')).filter(el => {
                const styles = window.getComputedStyle(el);
                return styles.display !== 'none' && 
                       styles.visibility !== 'hidden' && 
                       el.offsetWidth > 0 && 
                       el.offsetHeight > 0;
              });
              
              let overlapCount = 0;
              for (let i = 0; i < Math.min(visibleElements.length, 50); i++) { // Limit to first 50 for performance
                for (let j = i + 1; j < Math.min(visibleElements.length, 50); j++) {
                  const rect1 = visibleElements[i].getBoundingClientRect();
                  const rect2 = visibleElements[j].getBoundingClientRect();
                  
                  if (!(rect1.right < rect2.left || 
                        rect1.left > rect2.right || 
                        rect1.bottom < rect2.top || 
                        rect1.top > rect2.bottom)) {
                    
                    // Check if elements are not nested
                    if (!visibleElements[i].contains(visibleElements[j]) && !visibleElements[j].contains(visibleElements[i])) {
                      overlapCount++;
                      if (overlapCount <= 5) { // Limit overlaps reported
                        issues.push({
                          type: 'overlap',
                          severity: 'major',
                          description: `Overlapping elements detected`,
                          details: {
                            element1: visibleElements[i].tagName + (visibleElements[i].className ? '.' + visibleElements[i].className : ''),
                            element2: visibleElements[j].tagName + (visibleElements[j].className ? '.' + visibleElements[j].className : '')
                          }
                        });
                      }
                    }
                  }
                }
              }
              
              return {
                issues: issues,
                problemElements: problemElements.slice(0, 10), // Limit to first 10
                viewportInfo: {
                  width: window.innerWidth,
                  height: window.innerHeight,
                  devicePixelRatio: window.devicePixelRatio
                },
                layoutInfo: {
                  bodyScrollWidth: document.body.scrollWidth,
                  bodyScrollHeight: document.body.scrollHeight,
                  hasHorizontalScroll: document.body.scrollWidth > window.innerWidth,
                  hasVerticalScroll: document.body.scrollHeight > window.innerHeight
                }
              };
            });
            
            // Process analysis results
            const viewportIssues = [];
            
            if (viewportAnalysis.issues && viewportAnalysis.issues.length > 0) {
              for (const issue of viewportAnalysis.issues) {
                viewportIssues.push(issue);
                pageResults.issues.push(issue);
                
                // Update summary
                analysisResults.summary.totalIssues++;
                if (issue.severity === 'critical') {
                  analysisResults.summary.criticalIssues++;
                } else if (issue.severity === 'major') {
                  analysisResults.summary.majorIssues++;
                } else {
                  analysisResults.summary.minorIssues++;
                }
              }
            }
            
            // Add layout info issues
            if (viewportAnalysis.layoutInfo.hasHorizontalScroll) {
              const horizontalScrollIssue = {
                type: 'horizontal_scroll',
                severity: 'critical',
                description: `Page has horizontal scroll`,
                details: viewportAnalysis.layoutInfo
              };
              viewportIssues.push(horizontalScrollIssue);
              pageResults.issues.push(horizontalScrollIssue);
              analysisResults.summary.totalIssues++;
              analysisResults.summary.criticalIssues++;
            }
            
            pageResults.breakpoints[viewportKey] = {
              viewport: viewport,
              issues: viewportIssues,
              status: viewportIssues.length > 0 ? 'failed' : 'passed',
              analysis: viewportAnalysis
            };
            
            console.log(`    ${viewportIssues.length > 0 ? '❌' : '✅'} ${viewportIssues.length} issues found`);
            
          } catch (error) {
            console.error(`    ❌ Error analyzing ${viewport.name}:`, error.message);
            pageResults.breakpoints[viewportKey] = {
              viewport: viewport,
              issues: [{ type: 'analysis_error', description: 'Analysis failed', severity: 'critical', details: error.message }],
              status: 'failed'
            };
            analysisResults.summary.totalIssues++;
            analysisResults.summary.criticalIssues++;
          } finally {
            await page.close();
          }
        }
      }
      
      if (pageResults.issues.length > 0) {
        pageResults.overallStatus = 'failed';
      }
      
      analysisResults.pages[pageConfig.name] = pageResults;
      console.log(`  📊 Status: ${pageResults.overallStatus === 'passed' ? '✅ PASSED' : '❌ FAILED'} (${pageResults.issues.length} issues)\n`);
    }
    
    // Generate comprehensive report
    await generateManualReport(analysisResults);
    
  } catch (error) {
    console.error('❌ Analysis failed:', error);
  } finally {
    await browser.close();
  }
  
  console.log('🎉 Manual responsive analysis completed!');
  console.log(`📈 Summary: ${analysisResults.summary.totalIssues} total issues found`);
  console.log(`🚨 Issues: ${analysisResults.summary.criticalIssues} critical, ${analysisResults.summary.majorIssues} major, ${analysisResults.summary.minorIssues} minor`);
  console.log(`📁 Results saved to: ${OUTPUT_DIR}`);
}

// Generate comprehensive manual report
async function generateManualReport(results) {
  const reportPath = path.join(OUTPUT_DIR, 'MANUAL_RESPONSIVE_ANALYSIS_REPORT.md');
  
  let report = `# VeroTrade Manual Responsive Analysis Report\n\n`;
  report += `**Generated:** ${new Date(results.timestamp).toLocaleString()}\n\n`;
  
  // Executive Summary
  report += `## 📊 Executive Summary\n\n`;
  report += `- **Total Issues:** ${results.summary.totalIssues}\n`;
  report += `- **Critical Issues:** ${results.summary.criticalIssues}\n`;
  report += `- **Major Issues:** ${results.summary.majorIssues}\n`;
  report += `- **Minor Issues:** ${results.summary.minorIssues}\n\n`;
  
  // Issues by type
  const issuesByType = {};
  for (const [pageName, pageResults] of Object.entries(results.pages)) {
    for (const [viewport, viewportResults] of Object.entries(pageResults.breakpoints)) {
      for (const issue of viewportResults.issues) {
        if (!issuesByType[issue.type]) {
          issuesByType[issue.type] = { count: 0, severity: issue.severity, description: issue.description, pages: [] };
        }
        issuesByType[issue.type].count++;
        issuesByType[issue.type].pages.push({ page: pageName, viewport: viewportResults.viewport.name });
      }
    }
  }
  
  report += `## 🚨 Issues by Type\n\n`;
  for (const [issueType, issueData] of Object.entries(issuesByType)) {
    report += `### ${issueType.replace(/_/g, ' ').toUpperCase()}\n\n`;
    report += `- **Severity:** ${issueData.severity.toUpperCase()}\n`;
    report += `- **Count:** ${issueData.count} occurrences\n`;
    report += `- **Description:** ${issueData.description}\n`;
    report += `- **Affected Pages:**\n`;
    for (const page of issueData.pages) {
      report += `  - ${page.page} (${page.viewport})\n`;
    }
    report += `\n`;
  }
  
  // Detailed Results
  report += `## 📱 Detailed Analysis\n\n`;
  
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
          issues: viewportResults.issues,
          analysis: viewportResults.analysis
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
            if (problem.details) {
              report += `  - Details: ${JSON.stringify(problem.details, null, 2)}\n`;
            }
          }
          
          // Add analysis insights
          if (issue.analysis) {
            report += `- **Viewport Info:** ${issue.analysis.viewportInfo.width}x${issue.analysis.viewportInfo.height}\n`;
            report += `- **Layout Issues:** Horizontal scroll: ${issue.analysis.layoutInfo.hasHorizontalScroll ? 'YES' : 'NO'}, Vertical scroll: ${issue.analysis.layoutInfo.hasVerticalScroll ? 'YES' : 'NO'}\n`;
            if (issue.analysis.problemElements && issue.analysis.problemElements.length > 0) {
              report += `- **Problem Elements:** ${issue.analysis.problemElements.length} elements outside viewport\n`;
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
    report += `1. **Fix horizontal scrolling** - Ensure content fits within viewport width\n`;
    report += `2. **Increase touch target sizes** to minimum 44px for mobile devices\n`;
    report += `3. **Review grid layouts** for proper responsive behavior\n\n`;
  }
  
  if (results.summary.majorIssues > 0) {
    report += `### ⚠️ Major Issues (High Priority)\n\n`;
    report += `1. **Increase text sizes** for better mobile readability (minimum 14px)\n`;
    report += `2. **Fix grid layout breaks** on smaller screens\n`;
    report += `3. **Resolve overlapping elements** in complex layouts\n\n`;
  }
  
  if (results.summary.totalIssues === 0) {
    report += `🎉 **Excellent!** No responsive issues found. The application works perfectly across all tested devices.\n\n`;
  }
  
  // Design System Analysis
  report += `## 🎨 Design System Consistency\n\n`;
  report += `### Color Consistency\n`;
  report += `- Gold accent color (#B89B5E) should be consistent across all breakpoints\n`;
  report += `- Status colors (success: #4A7C59, error: #C46A5A) should maintain contrast\n\n`;
  
  report += `### Typography Consistency\n`;
  report += `- Font sizes should scale appropriately: Mobile (14px+), Tablet (16px+), Desktop (16px+)\n`;
  report += `- Line height should be 1.5x font size for readability\n\n`;
  
  report += `### Spacing Consistency\n`;
  report += `- 8px grid system should be maintained across breakpoints\n`;
  report += `- Card padding should scale: Mobile (16px), Tablet (20px), Desktop (24px)\n\n`;
  
  // Testing Methodology
  report += `## 🧪 Testing Methodology\n\n`;
  report += `### Manual Analysis Approach\n`;
  report += `- Visual inspection of each breakpoint\n`;
  report += `- Layout validation using DOM analysis\n`;
  report += `- Touch target compliance checking (44px minimum)\n`;
  report += `- Text readability assessment (14px minimum)\n`;
  report += `- Grid layout verification\n\n`;
  
  report += `### Devices Tested\n\n`;
  for (const [deviceType, breakpoints] of Object.entries(BREAKPOINTS)) {
    report += `**${deviceType.charAt(0).toUpperCase() + deviceType.slice(1)}:**\n`;
    for (const bp of breakpoints) {
      report += `- ${bp.name} (${bp.width}x${bp.height})\n`;
    }
    report += `\n`;
  }
  
  report += `---\n`;
  report += `*Report generated by VeroTrade Manual Responsive Analysis*\n`;
  
  fs.writeFileSync(reportPath, report);
  console.log(`📄 Detailed manual analysis report generated: ${reportPath}`);
}

// Run manual analysis
if (require.main === module) {
  performManualResponsiveAnalysis().catch(console.error);
}

module.exports = { performManualResponsiveAnalysis, BREAKPOINTS, PAGES };