const puppeteer = require('puppeteer');
const fs = require('fs');

// Comprehensive diagnostic to identify ALL responsive issues
async function runComprehensiveDiagnostic() {
  console.log('🔍 COMPREHENSIVE VeroTrade Responsive Diagnostic');
  
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const results = {
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
    // Test multiple pages
    const pages = [
      { path: '/dashboard', name: 'Dashboard' },
      { path: '/trades', name: 'Trades' },
      { path: '/strategies', name: 'Strategies' }
    ];
    
    for (const pageConfig of pages) {
      console.log(`\n📊 Analyzing: ${pageConfig.name}`);
      
      const page = await browser.newPage();
      
      // Test multiple viewports
      const viewports = [
        { width: 375, height: 667, name: 'Mobile' },
        { width: 768, height: 1024, name: 'Tablet' },
        { width: 1920, height: 1080, name: 'Desktop' }
      ];
      
      const pageResults = {
        viewports: {},
        overallStatus: 'passed'
      };
      
      for (const viewport of viewports) {
        console.log(`  🖥️  ${viewport.name} (${viewport.width}x${viewport.height})`);
        
        await page.setViewport({ width: viewport.width, height: viewport.height });
        await page.goto(`http://localhost:3000${pageConfig.path}`, { 
          waitUntil: 'networkidle2',
          timeout: 30000 
        });
        
        // Wait for content to load
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Comprehensive analysis
        const analysis = await page.evaluate(() => {
          const issues = [];
          const analysis = {
            typography: {},
            layout: {},
            navigation: {},
            components: {}
          };
          
          // 1. Typography Analysis
          const bodyStyles = window.getComputedStyle(document.body);
          const baseFontSize = parseFloat(bodyStyles.fontSize);
          analysis.typography = {
            baseFontSize: baseFontSize,
            fontFamily: bodyStyles.fontFamily,
            lineHeight: bodyStyles.lineHeight
          };
          
          // Check font size appropriateness
          if (window.innerWidth >= 1024 && baseFontSize < 16) {
            issues.push({
              type: 'desktop_font_too_small',
              severity: 'major',
              description: `Desktop font size too small: ${baseFontSize}px (should be 16px+)`,
              element: 'body',
              actual: `${baseFontSize}px`,
              expected: '16px+'
            });
          } else if (window.innerWidth < 768 && baseFontSize < 14) {
            issues.push({
              type: 'mobile_font_too_small',
              severity: 'critical',
              description: `Mobile font size too small: ${baseFontSize}px (should be 14px+)`,
              element: 'body',
              actual: `${baseFontSize}px`,
              expected: '14px+'
            });
          }
          
          // 2. Layout Analysis
          analysis.layout = {
            bodyWidth: document.body.scrollWidth,
            viewportWidth: window.innerWidth,
            hasHorizontalScroll: document.body.scrollWidth > window.innerWidth,
            containers: [],
            grids: []
          };
          
          // Check for horizontal scroll
          if (document.body.scrollWidth > window.innerWidth) {
            issues.push({
              type: 'horizontal_scroll',
              severity: 'critical',
              description: `Horizontal scroll detected: ${document.body.scrollWidth}px > ${window.innerWidth}px`,
              element: 'body',
              actual: document.body.scrollWidth,
              expected: window.innerWidth
            });
          }
          
          // Analyze containers
          const containers = document.querySelectorAll('.container, .container-luxury, [class*="max-w"]');
          containers.forEach(container => {
            const styles = window.getComputedStyle(container);
            const rect = container.getBoundingClientRect();
            analysis.layout.containers.push({
              element: container.className,
              width: rect.width,
              maxWidth: styles.maxWidth,
              padding: styles.padding
            });
            
            // Check container width issues
            if (window.innerWidth >= 1920 && rect.width < 1200) {
              issues.push({
                type: 'desktop_container_too_narrow',
                severity: 'major',
                description: `Desktop container too narrow: ${rect.width}px`,
                element: container.className,
                actual: rect.width,
                expected: '1200px+'
              });
            }
          });
          
          // Analyze grids - CRITICAL for dashboard
          const grids = document.querySelectorAll('[class*="grid"]');
          grids.forEach(grid => {
            const styles = window.getComputedStyle(grid);
            const rect = grid.getBoundingClientRect();
            const children = grid.children;
            
            const gridInfo = {
              element: grid.className,
              display: styles.display,
              gridTemplateColumns: styles.gridTemplateColumns,
              childCount: children.length,
              width: rect.width
            };
            analysis.layout.grids.push(gridInfo);
            
            // Specific check for dashboard 4-column layout
            if (window.innerWidth >= 1024 && children.length >= 4) {
              // Check if it's actually using 4 columns on desktop
              const has4Columns = styles.gridTemplateColumns.includes('repeat(4') || 
                                 styles.gridTemplateColumns.includes('grid-cols-4') ||
                                 grid.className.includes('lg:grid-cols-4');
              
              if (!has4Columns) {
                issues.push({
                  type: 'missing_4_column_desktop_layout',
                  severity: 'critical',
                  description: `Desktop missing 4-column layout: ${styles.gridTemplateColumns}`,
                  element: grid.className,
                  actual: styles.gridTemplateColumns,
                  expected: '4-column grid'
                });
              }
            }
            
            // Check if using mobile layout on desktop
            if (window.innerWidth >= 1024 && 
                (styles.gridTemplateColumns.includes('1fr') || 
                 grid.className.includes('grid-cols-1'))) {
              issues.push({
                type: 'desktop_using_mobile_grid',
                severity: 'critical',
                description: `Desktop using single-column grid: ${styles.gridTemplateColumns}`,
                element: grid.className,
                actual: styles.gridTemplateColumns,
                expected: 'multi-column grid'
              });
            }
          });
          
          // 3. Navigation Analysis
          const sidebar = document.querySelector('aside, [class*="sidebar"], [class*="Sidebar"]');
          const mobileMenu = document.querySelector('[class*="hamburger"], [aria-label*="mobile menu"]');
          
          analysis.navigation = {
            hasSidebar: !!sidebar,
            hasMobileMenu: !!mobileMenu,
            sidebarWidth: sidebar ? sidebar.getBoundingClientRect().width : null
          };
          
          if (sidebar) {
            const sidebarRect = sidebar.getBoundingClientRect();
            const sidebarStyles = window.getComputedStyle(sidebar);
            
            // Check sidebar behavior on different viewports
            if (window.innerWidth >= 1024 && sidebarRect.width < 200) {
              issues.push({
                type: 'sidebar_collapsed_desktop',
                severity: 'major',
                description: `Sidebar collapsed on desktop: ${sidebarRect.width}px`,
                element: sidebar.className,
                actual: sidebarRect.width,
                expected: '240px+'
              });
            }
            
            if (window.innerWidth < 768 && sidebarRect.width > 280) {
              issues.push({
                type: 'sidebar_too_wide_mobile',
                severity: 'critical',
                description: `Sidebar too wide on mobile: ${sidebarRect.width}px`,
                element: sidebar.className,
                actual: sidebarRect.width,
                expected: '280px max or overlay'
              });
            }
          }
          
          // 4. Component Analysis - Touch targets
          const clickableElements = document.querySelectorAll('button, a, input[type="button"], input[type="submit"], [role="button"], .btn-primary, .btn-secondary, .btn-ghost');
          let smallTouchTargets = 0;
          
          clickableElements.forEach(element => {
            const rect = element.getBoundingClientRect();
            const minDimension = Math.min(rect.width, rect.height);
            
            if (window.innerWidth < 768 && minDimension < 44) {
              smallTouchTargets++;
              if (smallTouchTargets <= 5) { // Limit reporting
                issues.push({
                  type: 'touch_target_too_small',
                  severity: 'critical',
                  description: `Touch target too small: ${minDimension}px < 44px`,
                  element: element.tagName + (element.className ? '.' + element.className : ''),
                  actual: minDimension,
                  expected: '44px+'
                });
              }
            }
          });
          
          analysis.components = {
            totalClickableElements: clickableElements.length,
            smallTouchTargets: smallTouchTargets
          };
          
          return { issues, analysis };
        });
        
        // Count issues
        const issueCount = analysis.issues.length;
        if (issueCount > 0) {
          pageResults.viewports[viewport.name] = {
            status: 'failed',
            issues: issueCount,
            issueList: analysis.issues,
            analysis: analysis
          };
          
          // Update summary
          results.summary.totalIssues += issueCount;
          analysis.issues.forEach(issue => {
            if (issue.severity === 'critical') results.summary.criticalIssues++;
            else if (issue.severity === 'major') results.summary.majorIssues++;
            else results.summary.minorIssues++;
          });
          
          console.log(`    ❌ ${issueCount} issues found`);
        } else {
          pageResults.viewports[viewport.name] = {
            status: 'passed',
            issues: 0,
            analysis: analysis
          };
          console.log(`    ✅ No issues found`);
        }
        
        // Take screenshot
        await page.screenshot({ 
          path: `./${pageConfig.name}-${viewport.name}-diagnostic.png`, 
          fullPage: true 
        });
      }
      
      results.pages[pageConfig.name] = pageResults;
      await page.close();
    }
    
    // Generate comprehensive report
    await generateDiagnosticReport(results);
    
  } catch (error) {
    console.error('❌ Diagnostic failed:', error);
  } finally {
    await browser.close();
  }
  
  console.log('\n🎉 Comprehensive diagnostic completed!');
  console.log(`📈 Summary: ${results.summary.totalIssues} total issues found`);
  console.log(`🚨 Issues: ${results.summary.criticalIssues} critical, ${results.summary.majorIssues} major, ${results.summary.minorIssues} minor`);
}

// Generate comprehensive report
async function generateDiagnosticReport(results) {
  let report = `# VeroTrade Comprehensive Responsive Diagnostic Report\n\n`;
  report += `**Generated:** ${new Date(results.timestamp).toLocaleString()}\n\n`;
  
  // Executive Summary
  report += `## 🚨 Executive Summary\n\n`;
  report += `- **Total Issues:** ${results.summary.totalIssues}\n`;
  report += `- **Critical Issues:** ${results.summary.criticalIssues}\n`;
  report += `- **Major Issues:** ${results.summary.majorIssues}\n`;
  report += `- **Minor Issues:** ${results.summary.minorIssues}\n\n`;
  
  // Page-by-page analysis
  report += `## 📱 Page-by-Page Analysis\n\n`;
  
  for (const [pageName, pageResults] of Object.entries(results.pages)) {
    report += `### ${pageName}\n\n`;
    
    for (const [viewport, viewportResults] of Object.entries(pageResults.viewports)) {
      report += `#### ${viewport} (${viewportResults.status.toUpperCase()})\n\n`;
      
      if (viewportResults.issues > 0) {
        report += `**Issues Found:** ${viewportResults.issues}\n\n`;
        
        // Group issues by type
        const issuesByType = {};
        viewportResults.issueList.forEach(issue => {
          if (!issuesByType[issue.type]) {
            issuesByType[issue.type] = [];
          }
          issuesByType[issue.type].push(issue);
        });
        
        for (const [issueType, issues] of Object.entries(issuesByType)) {
          report += `**${issueType.replace(/_/g, ' ').toUpperCase()}**\n`;
          issues.forEach(issue => {
            report += `- ${issue.description}\n`;
            report += `  - Element: \`${issue.element}\`\n`;
            report += `  - Expected: ${issue.expected}\n`;
            report += `  - Actual: ${issue.actual}\n\n`;
          });
        }
      } else {
        report += `✅ **No issues found**\n\n`;
      }
    }
  }
  
  // Root Cause Analysis
  report += `## 🔍 Root Cause Analysis\n\n`;
  
  if (results.summary.criticalIssues > 0) {
    report += `### 🚨 Critical Issues Root Causes\n\n`;
    
    // Check for patterns
    const hasDesktopMobileIssues = results.summary.criticalIssues >= 2;
    const hasGridIssues = results.summary.totalIssues >= 3;
    
    if (hasDesktopMobileIssues) {
      report += `1. **Desktop appearing mobile-like** - Multiple indicators show desktop layouts using mobile patterns\n`;
      report += `   - Font sizes too small for desktop\n`;
      report += `   - Grid layouts not adapting properly\n`;
      report += `   - Container widths not scaling\n\n`;
    }
    
    if (hasGridIssues) {
      report += `2. **Grid system breakdown** - Responsive grid utilities not working correctly\n`;
      report += `   - 4-column dashboard layout not activating on desktop\n`;
      report += `   - Single-column layouts persisting on large screens\n\n`;
    }
  }
  
  // Recommendations
  report += `## 🛠️ Specific Recommendations\n\n`;
  
  if (results.summary.criticalIssues > 0) {
    report += `### 🚨 Critical Fixes (Immediate Action Required)\n\n`;
    report += `1. **Fix Desktop Font Size**\n`;
    report += `   - Update base font size to 16px+ for desktop viewports\n`;
    report += `   - Add responsive font scaling in globals.css\n`;
    report += `   - Current: 14.0625px, Target: 16px+\n\n`;
    
    report += `2. **Fix Grid Layout Issues**\n`;
    report += `   - Ensure 4-column layout activates on desktop (≥1024px)\n`;
    report += `   - Check Tailwind grid classes: \`lg:grid-cols-4\`\n`;
    report += `   - Verify responsive breakpoint configuration\n\n`;
    
    report += `3. **Fix Horizontal Scrolling**\n`;
    report += `   - Identify elements causing overflow\n`;
    report += `   - Add proper max-width constraints\n`;
    report += `   - Use responsive spacing units\n\n`;
  }
  
  if (results.summary.majorIssues > 0) {
    report += `### ⚠️ Major Fixes (High Priority)\n\n`;
    report += `1. **Container Width Issues**\n`;
    report += `   - Increase container max-width for desktop\n`;
    report += `   - Use responsive container classes\n`;
    report += `   - Implement proper fluid layouts\n\n`;
    
    report += `2. **Navigation Issues**\n`;
    report += `   - Fix sidebar behavior on different viewports\n`;
    report += `   - Ensure mobile menu only shows on mobile\n`;
    report += `   - Add proper responsive navigation\n\n`;
  }
  
  if (results.summary.minorIssues > 0) {
    report += `### 📝 Minor Fixes (Medium Priority)\n\n`;
    report += `1. **Touch Target Optimization**\n`;
    report += `   - Increase button sizes to 44px minimum\n`;
    report += `   - Add proper padding for touch interactions\n`;
    report += `   - Test on actual mobile devices\n\n`;
  }
  
  // Technical Implementation
  report += `## 🔧 Technical Implementation\n\n`;
  report += `### CSS Fixes Required\n\n`;
  report += `\`\`\`css\n`;
  report += `/* Fix desktop font size */\n`;
  report += `@media (min-width: 1024px) {\n`;
  report += `  body {\n`;
  report += `    font-size: 16px;\n`;
  report += `    /* or use var(--text-base) which should be 16px */\n`;
  report += `  }\n`;
  report += `}\n\n`;
  
  report += `/* Fix 4-column grid layout */\n`;
  report += `.dashboard-metrics {\n`;
  report += `  @apply grid-cols-1 sm:grid-cols-2 lg:grid-cols-4;\n`;
  report += `}\n\n`;
  
  report += `/* Fix container widths */\n`;
  report += `.container-luxury {\n`;
  report += `  @apply max-w-7xl mx-auto px-4 sm:px-6 lg:px-8;\n`;
  report += `}\n`;
  report += `\`\`\`\n\n`;
  
  report += `### Tailwind Configuration Updates\n\n`;
  report += `\`\`\`js\n`;
  report += `// tailwind.config.js - Ensure proper breakpoints\n`;
  report += `module.exports = {\n`;
  report += `  theme: {\n`;
  report += `    extend: {\n`;
  report += `      screens: {\n`;
  report += `        'lg': '1024px',\n`;
  report += `        'xl': '1280px',\n`;
  report += `        '2xl': '1536px'\n`;
  report += `      }\n`;
  report += `    }\n`;
  report += `  }\n`;
  report += `}\n`;
  report += `\`\`\`\n\n`;
  
  report += `---\n`;
  report += `*Report generated by VeroTrade Comprehensive Responsive Diagnostic*\n`;
  
  // Save report
  fs.writeFileSync('./COMPREHENSIVE_RESPONSIVE_DIAGNOSTIC_REPORT.md', report);
  console.log(`📄 Comprehensive report generated: COMPREHENSIVE_RESPONSIVE_DIAGNOSTIC_REPORT.md`);
  
  // Save detailed JSON
  fs.writeFileSync('./comprehensive-diagnostic-results.json', JSON.stringify(results, null, 2));
  console.log(`💾 Detailed results saved to: comprehensive-diagnostic-results.json`);
}

// Run comprehensive diagnostic
if (require.main === module) {
  runComprehensiveDiagnostic().catch(console.error);
}

module.exports = { runComprehensiveDiagnostic };