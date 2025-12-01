const puppeteer = require('puppeteer');
const path = require('path');

async function diagnosePnLChartIssues() {
  console.log('🔍 [PnL CHART DIAGNOSIS] Starting detailed diagnosis of chart rendering issues...');
  
  const browser = await puppeteer.launch({
    headless: false, // Keep visible for debugging
    defaultViewport: { width: 1920, height: 1080 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    
    // Enable console logging from the page
    page.on('console', msg => {
      console.log('🔍 [BROWSER CONSOLE]', msg.text());
    });

    console.log('🔍 [PnL CHART DIAGNOSIS] Navigating to dashboard...');
    
    // Navigate to the dashboard page
    await page.goto('http://localhost:3000/dashboard', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });

    // Wait for authentication and page load
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Check if login is needed and handle it
    const loginRequired = await page.$('input[type="email"]');
    if (loginRequired) {
      console.log('🔍 [PnL CHART DIAGNOSIS] Performing login...');
      await page.type('input[type="email"]', 'test@example.com');
      await page.type('input[type="password"]', 'testpassword123');
      await page.click('button[type="submit"]');
      await new Promise(resolve => setTimeout(resolve, 3000));
    }

    console.log('🔍 [PnL CHART DIAGNOSIS] Performing detailed chart analysis...');
    
    // Comprehensive diagnosis of the chart rendering
    const diagnosis = await page.evaluate(() => {
      const results = {
        containerAnalysis: {},
        svgAnalysis: {},
        stylingAnalysis: {},
        dataAnalysis: {},
        renderingIssues: [],
        recommendations: []
      };

      // 1. Analyze chart container
      const chartContainer = document.querySelector('[class*="chart"], .chart-container-stable, .recharts-wrapper');
      if (chartContainer) {
        const containerStyles = window.getComputedStyle(chartContainer);
        const containerRect = chartContainer.getBoundingClientRect();
        
        results.containerAnalysis = {
          found: true,
          tagName: chartContainer.tagName,
          className: chartContainer.className,
          dimensions: {
            width: containerRect.width,
            height: containerRect.height,
            top: containerRect.top,
            left: containerRect.left
          },
          styles: {
            display: containerStyles.display,
            visibility: containerStyles.visibility,
            opacity: containerStyles.opacity,
            position: containerStyles.position,
            overflow: containerStyles.overflow,
            minHeight: containerStyles.minHeight,
            minWidth: containerStyles.minWidth,
            height: containerStyles.height,
            width: containerStyles.width
          }
        };

        // Check for sizing issues
        if (containerRect.width <= 0 || containerRect.height <= 0) {
          results.renderingIssues.push('Chart container has zero or negative dimensions');
          results.recommendations.push('Ensure chart container has proper width/height');
        }
      } else {
        results.renderingIssues.push('Chart container not found');
        results.recommendations.push('Check if PnLChart component is mounted');
      }

      // 2. Analyze SVG element
      const svg = document.querySelector('svg');
      if (svg) {
        const svgStyles = window.getComputedStyle(svg);
        const svgRect = svg.getBoundingClientRect();
        
        results.svgAnalysis = {
          found: true,
          dimensions: {
            width: svgRect.width,
            height: svgRect.height
          },
          styles: {
            width: svgStyles.width,
            height: svgStyles.height,
            display: svgStyles.display
          },
          childElements: {
            total: svg.children.length,
            defs: svg.querySelectorAll('defs').length,
            gradients: svg.querySelectorAll('linearGradient, radialGradient').length,
            filters: svg.querySelectorAll('filter').length,
            paths: svg.querySelectorAll('path').length,
            areas: svg.querySelectorAll('.recharts-area-area, path[data-key="cumulative"]').length,
            gridLines: svg.querySelectorAll('.recharts-cartesian-grid-line').length,
            dots: svg.querySelectorAll('.recharts-area-dot, .recharts-active-dot').length
          }
        };

        // Check SVG sizing issues
        if (svgRect.width <= 0 || svgRect.height <= 0) {
          results.renderingIssues.push('SVG has zero or negative dimensions');
          results.recommendations.push('Check ResponsiveContainer configuration');
        }

        // Analyze gradients
        const gradients = svg.querySelectorAll('linearGradient, radialGradient');
        gradients.forEach((gradient, index) => {
          const stops = gradient.querySelectorAll('stop');
          const gradientInfo = {
            id: gradient.id,
            type: gradient.tagName,
            stops: []
          };
          
          stops.forEach(stop => {
            gradientInfo.stops.push({
              offset: stop.getAttribute('offset'),
              color: stop.getAttribute('stop-color'),
              opacity: stop.getAttribute('stop-opacity')
            });
          });
          
          results.stylingAnalysis[`gradient_${index}`] = gradientInfo;
        });

        // Analyze filters
        const filters = svg.querySelectorAll('filter');
        filters.forEach((filter, index) => {
          results.stylingAnalysis[`filter_${index}`] = {
            id: filter.id,
            type: filter.tagName,
            childElements: filter.children.length
          };
        });

        // Analyze area elements
        const areaElements = svg.querySelectorAll('.recharts-area-area, path[data-key="cumulative"]');
        areaElements.forEach((area, index) => {
          const areaStyles = window.getComputedStyle(area);
          results.stylingAnalysis[`area_${index}`] = {
            stroke: areaStyles.stroke,
            strokeWidth: areaStyles.strokeWidth,
            fill: areaStyles.fill,
            filter: areaStyles.filter,
            d: area.getAttribute('d') ? 'Path data present' : 'No path data'
          };
        });

        // Analyze grid lines
        const gridLines = svg.querySelectorAll('.recharts-cartesian-grid-line');
        if (gridLines.length > 0) {
          const gridStyles = window.getComputedStyle(gridLines[0]);
          results.stylingAnalysis.gridLines = {
            stroke: gridStyles.stroke,
            strokeWidth: gridStyles.strokeWidth,
            strokeDasharray: gridStyles.strokeDasharray,
            opacity: gridStyles.opacity
          };
        }
      } else {
        results.renderingIssues.push('SVG element not found');
        results.recommendations.push('Chart may not be rendering at all');
      }

      // 3. Analyze data flow
      const pnlChartElements = document.querySelectorAll('[class*="pnl"], [class*="PnL"]');
      results.dataAnalysis = {
        pnlChartElementsFound: pnlChartElements.length,
        debugMessages: []
      };

      // Check for debug messages in console
      if (window.console && window.console.log) {
        // This is a simplified approach - in reality we'd need to capture console logs differently
        results.dataAnalysis.debugMessages = ['Check browser console for PnL Chart debug messages'];
      }

      return results;
    });

    console.log('🔍 [PnL CHART DIAGNOSIS] Detailed diagnosis results:', JSON.stringify(diagnosis, null, 2));

    // Take a screenshot for visual reference
    await page.screenshot({ 
      path: 'pnl-chart-diagnostic-screenshot.png',
      fullPage: true 
    });

    // Save diagnosis results
    const fs = require('fs');
    fs.writeFileSync('pnl-chart-diagnosis-results.json', JSON.stringify(diagnosis, null, 2));

    console.log('🔍 [PnL CHART DIAGNOSIS] Diagnosis saved to pnl-chart-diagnosis-results.json');
    console.log('🔍 [PnL CHART DIAGNOSIS] Screenshot saved as pnl-chart-diagnostic-screenshot.png');

    return diagnosis;

  } catch (error) {
    console.error('🔍 [PnL CHART DIAGNOSIS] ERROR:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

// Run the diagnosis
diagnosePnLChartIssues()
  .then(results => {
    console.log('✅ [PnL CHART DIAGNOSIS] COMPLETED');
    
    // Provide clear diagnosis summary
    console.log('\n📊 [DIAGNOSIS SUMMARY]:');
    
    if (results.renderingIssues.length > 0) {
      console.log('\n❌ [RENDERING ISSUES DETECTED]:');
      results.renderingIssues.forEach(issue => console.log(`   - ${issue}`));
    }
    
    if (results.recommendations.length > 0) {
      console.log('\n💡 [RECOMMENDATIONS]:');
      results.recommendations.forEach(rec => console.log(`   - ${rec}`));
    }
    
    console.log('\n📏 [CONTAINER ANALYSIS]:');
    if (results.containerAnalysis.found) {
      console.log(`   - Container found: ${results.containerAnalysis.tagName}`);
      console.log(`   - Dimensions: ${results.containerAnalysis.dimensions.width}x${results.containerAnalysis.dimensions.height}`);
      console.log(`   - Display: ${results.containerAnalysis.styles.display}`);
      console.log(`   - Visibility: ${results.containerAnalysis.styles.visibility}`);
    } else {
      console.log('   - Container NOT FOUND');
    }
    
    console.log('\n🎨 [SVG ANALYSIS]:');
    if (results.svgAnalysis.found) {
      console.log(`   - SVG found: ${results.svgAnalysis.dimensions.width}x${results.svgAnalysis.dimensions.height}`);
      console.log(`   - Total elements: ${results.svgAnalysis.childElements.total}`);
      console.log(`   - Gradients: ${results.svgAnalysis.childElements.gradients}`);
      console.log(`   - Filters: ${results.svgAnalysis.childElements.filters}`);
      console.log(`   - Areas: ${results.svgAnalysis.childElements.areas}`);
      console.log(`   - Grid lines: ${results.svgAnalysis.childElements.gridLines}`);
      console.log(`   - Dots: ${results.svgAnalysis.childElements.dots}`);
    } else {
      console.log('   - SVG NOT FOUND');
    }
    
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ [PnL CHART DIAGNOSIS] FAILED:', error);
    process.exit(1);
  });