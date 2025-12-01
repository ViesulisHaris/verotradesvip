const puppeteer = require('puppeteer');
const fs = require('fs');

// Diagnostic script to identify why desktop layouts appear mobile-like
async function runResponsiveDiagnostic() {
  console.log('🔍 VeroTrade Responsive Diagnostic - Why Desktop Looks Mobile');
  
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    
    // Test desktop viewport specifically
    await page.setViewport({ width: 1920, height: 1080 });
    
    console.log('\n📊 Testing Desktop Viewport (1920x1080)');
    
    // Navigate to dashboard
    await page.goto('http://localhost:3000/dashboard', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    // Wait for content to load
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Analyze layout issues
    const diagnosticResults = await page.evaluate(() => {
      const issues = [];
      const analysis = {
        viewport: { width: window.innerWidth, height: window.innerHeight },
        bodyMetrics: {
          scrollWidth: document.body.scrollWidth,
          scrollHeight: document.body.scrollHeight,
          offsetWidth: document.body.offsetWidth,
          offsetHeight: document.body.offsetHeight
        },
        gridAnalysis: [],
        containerAnalysis: [],
        sidebarAnalysis: null,
        metricCardsAnalysis: null
      };
      
      // 1. Check for mobile-first CSS issues
      const computedStyles = window.getComputedStyle(document.body);
      if (computedStyles.fontSize && parseFloat(computedStyles.fontSize) < 16) {
        issues.push({
          type: 'desktop_mobile_font_size',
          severity: 'major',
          description: `Desktop using mobile font size: ${computedStyles.fontSize}px (should be 16px+)`,
          element: 'body',
          actual: computedStyles.fontSize,
          expected: '16px+'
        });
      }
      
      // 2. Analyze container widths
      const containers = document.querySelectorAll('.container, .container-luxury, [class*="container"], [class*="max-w"]');
      containers.forEach(container => {
        const styles = window.getComputedStyle(container);
        const rect = container.getBoundingClientRect();
        
        if (rect.width < 1200 && window.innerWidth >= 1920) {
          issues.push({
            type: 'container_too_narrow',
            severity: 'major',
            description: `Container too narrow for desktop: ${rect.width}px`,
            element: container.className,
            actual: rect.width,
            expected: '1200px+'
          });
        }
        
        analysis.containerAnalysis.push({
          element: container.className,
          width: rect.width,
          maxWidth: styles.maxWidth,
          padding: styles.padding
        });
      });
      
      // 3. Analyze grid layouts
      const grids = document.querySelectorAll('[class*="grid"]');
      grids.forEach(grid => {
        const styles = window.getComputedStyle(grid);
        const rect = grid.getBoundingClientRect();
        const children = grid.children;
        
        // Check if grid is using mobile columns on desktop
        if (styles.display === 'grid') {
          const gridCols = styles.gridTemplateColumns;
          if (gridCols.includes('1fr') && children.length > 1 && window.innerWidth >= 1024) {
            issues.push({
              type: 'desktop_using_mobile_grid',
              severity: 'critical',
              description: `Desktop using single-column grid: ${gridCols}`,
              element: grid.className,
              actual: gridCols,
              expected: 'multi-column grid'
            });
          }
        }
        
        analysis.gridAnalysis.push({
          element: grid.className,
          display: styles.display,
          gridTemplateColumns: styles.gridTemplateColumns,
          childCount: children.length,
          width: rect.width
        });
      });
      
      // 4. Check sidebar behavior
      const sidebar = document.querySelector('aside, [class*="sidebar"], [class*="Sidebar"]');
      if (sidebar) {
        const styles = window.getComputedStyle(sidebar);
        const rect = sidebar.getBoundingClientRect();
        
        analysis.sidebarAnalysis = {
          element: sidebar.className,
          width: rect.width,
          display: styles.display,
          position: styles.position,
          transform: styles.transform
        };
        
        // Check if sidebar is collapsed on desktop
        if (rect.width < 200 && window.innerWidth >= 1024) {
          issues.push({
            type: 'sidebar_collapsed_desktop',
            severity: 'major',
            description: `Sidebar collapsed on desktop: ${rect.width}px`,
            element: sidebar.className,
            actual: rect.width,
            expected: '240px+'
          });
        }
      }
      
      // 5. Check metric cards layout
      const metricCards = document.querySelectorAll('[class*="metric"], [class*="card"]');
      if (metricCards.length >= 4) {
        const firstCard = metricCards[0];
        const parent = firstCard.parentElement;
        
        if (parent) {
          const parentStyles = window.getComputedStyle(parent);
          const parentRect = parent.getBoundingClientRect();
          
          analysis.metricCardsAnalysis = {
            parentElement: parent.className,
            display: parentStyles.display,
            gridTemplateColumns: parentStyles.gridTemplateColumns,
            flexDirection: parentStyles.flexDirection,
            cardCount: metricCards.length,
            containerWidth: parentRect.width
          };
          
          // Check if 4-column layout is actually applied
          if (!parentStyles.gridTemplateColumns.includes('repeat(4') && 
              !parentStyles.gridTemplateColumns.includes('grid-cols-4') &&
              window.innerWidth >= 1024) {
            issues.push({
              type: 'missing_4_column_layout',
              severity: 'critical',
              description: `Desktop missing 4-column layout: ${parentStyles.gridTemplateColumns}`,
              element: parent.className,
              actual: parentStyles.gridTemplateColumns,
              expected: '4-column grid'
            });
          }
        }
      }
      
      // 6. Check for CSS custom properties issues
      const rootStyles = window.getComputedStyle(document.documentElement);
      const customProps = {};
      for (let i = 0; i < rootStyles.length; i++) {
        const prop = rootStyles[i];
        if (prop.startsWith('--')) {
          customProps[prop] = rootStyles.getPropertyValue(prop);
        }
      }
      
      // Check if responsive breakpoints are defined
      if (!customProps['--breakpoint-lg'] || !customProps['--breakpoint-xl']) {
        issues.push({
          type: 'missing_breakpoint_vars',
          severity: 'major',
          description: 'CSS custom breakpoint variables missing',
          element: ':root',
          actual: Object.keys(customProps).filter(k => k.includes('breakpoint')),
          expected: ['--breakpoint-sm', '--breakpoint-md', '--breakpoint-lg', '--breakpoint-xl']
        });
      }
      
      return {
        issues,
        analysis,
        customProps
      };
    });
    
    // Take screenshot for visual reference
    await page.screenshot({ 
      path: './desktop-diagnostic-screenshot.png', 
      fullPage: true 
    });
    
    // Output results
    console.log('\n🚨 DIAGNOSTIC RESULTS:');
    console.log('========================');
    
    if (diagnosticResults.issues.length === 0) {
      console.log('✅ No responsive issues detected');
    } else {
      console.log(`❌ Found ${diagnosticResults.issues.length} issues:\n`);
      
      diagnosticResults.issues.forEach((issue, index) => {
        console.log(`${index + 1}. ${issue.type.toUpperCase()}`);
        console.log(`   Severity: ${issue.severity}`);
        console.log(`   Description: ${issue.description}`);
        console.log(`   Element: ${issue.element}`);
        console.log(`   Expected: ${issue.expected}`);
        console.log(`   Actual: ${issue.actual}`);
        console.log('');
      });
    }
    
    console.log('\n📊 ANALYSIS DETAILS:');
    console.log('=====================');
    console.log('Viewport:', diagnosticResults.analysis.viewport);
    console.log('Body Metrics:', diagnosticResults.analysis.bodyMetrics);
    console.log('\nContainer Analysis:', diagnosticResults.analysis.containerAnalysis);
    console.log('\nGrid Analysis:', diagnosticResults.analysis.gridAnalysis);
    console.log('\nSidebar Analysis:', diagnosticResults.analysis.sidebarAnalysis);
    console.log('\nMetric Cards Analysis:', diagnosticResults.analysis.metricCardsAnalysis);
    
    // Save detailed results
    fs.writeFileSync('./responsive-diagnostic-results.json', JSON.stringify(diagnosticResults, null, 2));
    console.log('\n💾 Detailed results saved to: responsive-diagnostic-results.json');
    
  } catch (error) {
    console.error('❌ Diagnostic failed:', error);
  } finally {
    await browser.close();
  }
}

// Run the diagnostic
if (require.main === module) {
  runResponsiveDiagnostic().catch(console.error);
}

module.exports = { runResponsiveDiagnostic };