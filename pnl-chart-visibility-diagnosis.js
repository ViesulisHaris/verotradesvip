const puppeteer = require('puppeteer');
const path = require('path');

async function diagnosePnLChartVisibility() {
  console.log('🔍 [PnL CHART VISIBILITY] Diagnosing why P&L graph line is not visible...');
  
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1920, height: 1080 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    
    // Enable console logging
    page.on('console', msg => {
      console.log('🔍 [BROWSER CONSOLE]', msg.text());
    });

    console.log('🔍 [PnL CHART VISIBILITY] Navigating to dashboard...');
    
    await page.goto('http://localhost:3000/dashboard', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });

    await new Promise(resolve => setTimeout(resolve, 5000));

    // Handle login if needed
    const loginRequired = await page.$('input[type="email"]');
    if (loginRequired) {
      console.log('🔍 [PnL CHART VISIBILITY] Performing login...');
      await page.type('input[type="email"]', 'test@example.com');
      await page.type('input[type="password"]', 'testpassword123');
      await page.click('button[type="submit"]');
      await new Promise(resolve => setTimeout(resolve, 3000));
    }

    console.log('🔍 [PnL CHART VISIBILITY] Performing deep visibility analysis...');
    
    // Comprehensive visibility diagnosis
    const visibilityAnalysis = await page.evaluate(() => {
      const results = {
        chartContainer: {},
        svgElements: {},
        areaElements: [],
        pathAnalysis: [],
        dataFlow: {},
        stylingIssues: [],
        visibilityChecks: {}
      };

      // 1. Analyze chart container
      const chartContainer = document.querySelector('.chart-container-enhanced, [class*="chart"]');
      if (chartContainer) {
        const containerRect = chartContainer.getBoundingClientRect();
        const containerStyles = window.getComputedStyle(chartContainer);
        
        results.chartContainer = {
          found: true,
          tagName: chartContainer.tagName,
          className: chartContainer.className,
          rect: {
            width: containerRect.width,
            height: containerRect.height,
            top: containerRect.top,
            left: containerRect.left,
            bottom: containerRect.bottom,
            right: containerRect.right
          },
          styles: {
            display: containerStyles.display,
            visibility: containerStyles.visibility,
            opacity: containerStyles.opacity,
            overflow: containerStyles.overflow,
            position: containerStyles.position,
            zIndex: containerStyles.zIndex
          },
          isVisible: containerRect.width > 0 && containerRect.height > 0 && 
                    containerStyles.display !== 'none' && 
                    containerStyles.visibility !== 'hidden' &&
                    parseFloat(containerStyles.opacity) > 0
        };
      }

      // 2. Analyze SVG and all child elements
      const svg = document.querySelector('svg');
      if (svg) {
        const svgRect = svg.getBoundingClientRect();
        const svgStyles = window.getComputedStyle(svg);
        
        results.svgElements = {
          found: true,
          rect: {
            width: svgRect.width,
            height: svgRect.height
          },
          styles: {
            display: svgStyles.display,
            visibility: svgStyles.visibility,
            opacity: svgStyles.opacity
          },
          children: []
        };

        // Analyze all SVG children
        Array.from(svg.children).forEach((child, index) => {
          const childRect = child.getBoundingClientRect();
          const childStyles = window.getComputedStyle(child);
          
          const childInfo = {
            index,
            tagName: child.tagName,
            className: child.className,
            id: child.id,
            rect: {
              width: childRect.width,
              height: childRect.height,
              top: childRect.top,
              left: childRect.left
            },
            styles: {
              display: childStyles.display,
              visibility: childStyles.visibility,
              opacity: childStyles.opacity,
              fill: childStyles.fill,
              stroke: childStyles.stroke,
              strokeWidth: childStyles.strokeWidth
            },
            isVisible: childRect.width > 0 && childRect.height > 0 &&
                      childStyles.display !== 'none' &&
                      childStyles.visibility !== 'hidden' &&
                      parseFloat(childStyles.opacity) > 0,
            attributes: {}
          };

          // Get all attributes
          Array.from(child.attributes).forEach(attr => {
            childInfo.attributes[attr.name] = attr.value;
          });

          results.svgElements.children.push(childInfo);

          // Special analysis for path elements
          if (child.tagName === 'path') {
            const d = child.getAttribute('d');
            results.pathAnalysis.push({
              index,
              hasPathData: !!d && d.length > 0,
              pathLength: d ? d.length : 0,
              pathPreview: d ? d.substring(0, 100) + '...' : 'No path data',
              boundingBox: childRect,
              isVisible: childInfo.isVisible
            });
          }

          // Special analysis for area elements
          if (child.className && typeof child.className === 'string' && child.className.includes('area')) {
            results.areaElements.push(childInfo);
          }
        });
      }

      // 3. Check for data flow issues
      results.dataFlow = {
        hasChartData: false,
        chartDataPoints: 0,
        dataProcessing: false
      };

      // Look for chart data in console logs or window object
      if (window.performance && window.performance.getEntriesByType) {
        const resources = window.performance.getEntriesByType('resource');
        const apiCalls = resources.filter(r => r.name.includes('trades'));
        results.dataFlow.hasChartData = apiCalls.length > 0;
      }

      // 4. Check for common styling issues
      results.stylingIssues = [];
      
      // Check for overflow issues
      if (results.chartContainer.styles && results.chartContainer.styles.overflow === 'hidden') {
        results.stylingIssues.push('Chart container has overflow:hidden - may clip content');
      }

      // Check for z-index issues
      if (results.chartContainer.styles && parseInt(results.chartContainer.styles.zIndex) < 0) {
        results.stylingIssues.push('Chart container has negative z-index - may be hidden');
      }

      // Check for opacity issues
      if (results.svgElements.styles && parseFloat(results.svgElements.styles.opacity) < 0.1) {
        results.stylingIssues.push('SVG has very low opacity - may be invisible');
      }

      // 5. Visibility checks
      results.visibilityChecks = {
        containerInViewport: results.chartContainer.rect ? 
          (results.chartContainer.rect.top >= 0 && results.chartContainer.rect.left >= 0 &&
           results.chartContainer.rect.bottom <= window.innerHeight && 
           results.chartContainer.rect.right <= window.innerWidth) : false,
        svgInViewport: results.svgElements.rect ?
          (results.svgElements.rect.top >= 0 && results.svgElements.rect.left >= 0 &&
           results.svgElements.rect.bottom <= window.innerHeight && 
           results.svgElements.rect.right <= window.innerWidth) : false,
        hasVisiblePaths: results.pathAnalysis.some(p => p.isVisible && p.hasPathData),
        hasVisibleAreas: results.areaElements.some(a => a.isVisible)
      };

      return results;
    });

    console.log('🔍 [PnL CHART VISIBILITY] Visibility analysis results:', JSON.stringify(visibilityAnalysis, null, 2));

    // Take screenshot for visual reference
    await page.screenshot({ 
      path: 'pnl-chart-visibility-diagnosis.png',
      fullPage: true 
    });

    // Save analysis results
    const fs = require('fs');
    fs.writeFileSync('pnl-chart-visibility-results.json', JSON.stringify(visibilityAnalysis, null, 2));

    console.log('🔍 [PnL CHART VISIBILITY] Analysis saved to pnl-chart-visibility-results.json');
    console.log('🔍 [PnL CHART VISIBILITY] Screenshot saved as pnl-chart-visibility-diagnosis.png');

    return visibilityAnalysis;

  } catch (error) {
    console.error('🔍 [PnL CHART VISIBILITY] ERROR:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

// Run the visibility diagnosis
diagnosePnLChartVisibility()
  .then(results => {
    console.log('✅ [PnL CHART VISIBILITY] DIAGNOSIS COMPLETED');
    
    console.log('\n🔍 [VISIBILITY DIAGNOSIS SUMMARY]:');
    
    console.log('\n📦 [CHART CONTAINER]:');
    console.log(`   Found: ${results.chartContainer.found}`);
    console.log(`   Visible: ${results.chartContainer.isVisible}`);
    console.log(`   Dimensions: ${results.chartContainer.rect?.width}×${results.chartContainer.rect?.height}`);
    console.log(`   Display: ${results.chartContainer.styles?.display}`);
    console.log(`   Visibility: ${results.chartContainer.styles?.visibility}`);
    console.log(`   Opacity: ${results.chartContainer.styles?.opacity}`);
    
    console.log('\n🎨 [SVG ELEMENTS]:');
    console.log(`   Found: ${results.svgElements.found}`);
    console.log(`   Dimensions: ${results.svgElements.rect?.width}×${results.svgElements.rect?.height}`);
    console.log(`   Total children: ${results.svgElements.children?.length}`);
    
    console.log('\n📈 [PATH ANALYSIS]:');
    results.pathAnalysis.forEach((path, index) => {
      console.log(`   Path ${index + 1}: ${path.hasPathData ? 'HAS DATA' : 'NO DATA'} | Visible: ${path.isVisible} | Bounding: ${path.boundingBox.width}×${path.boundingBox.height}`);
    });
    
    console.log('\n🎯 [AREA ELEMENTS]:');
    console.log(`   Count: ${results.areaElements.length}`);
    results.areaElements.forEach((area, index) => {
      console.log(`   Area ${index + 1}: Visible: ${area.isVisible} | Fill: ${area.styles.fill} | Stroke: ${area.styles.stroke}`);
    });
    
    if (results.stylingIssues.length > 0) {
      console.log('\n⚠️ [STYLING ISSUES]:');
      results.stylingIssues.forEach(issue => console.log(`   - ${issue}`));
    }
    
    console.log('\n👁️ [VISIBILITY CHECKS]:');
    console.log(`   Container in viewport: ${results.visibilityChecks.containerInViewport}`);
    console.log(`   SVG in viewport: ${results.visibilityChecks.svgInViewport}`);
    console.log(`   Has visible paths: ${results.visibilityChecks.hasVisiblePaths}`);
    console.log(`   Has visible areas: ${results.visibilityChecks.hasVisibleAreas}`);
    
    // Provide diagnosis
    console.log('\n🔬 [DIAGNOSIS]:');
    if (!results.chartContainer.isVisible) {
      console.log('❌ Chart container is not visible');
    } else if (!results.svgElements.found) {
      console.log('❌ SVG element not found');
    } else if (results.svgElements.rect.width <= 0 || results.svgElements.rect.height <= 0) {
      console.log('❌ SVG has zero dimensions');
    } else if (!results.visibilityChecks.hasVisiblePaths) {
      console.log('❌ No visible path elements with data found');
    } else if (!results.visibilityChecks.hasVisibleAreas) {
      console.log('❌ No visible area elements found');
    } else {
      console.log('✅ Chart elements appear to be present and visible');
      console.log('🤔 Issue may be with data values or rendering logic');
    }
    
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ [PnL CHART VISIBILITY] DIAGNOSIS FAILED:', error);
    process.exit(1);
  });