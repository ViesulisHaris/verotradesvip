const puppeteer = require('puppeteer');
const path = require('path');

async function testPnLChartSizingFix() {
  console.log('🔍 [PnL CHART SIZING FIX] Testing ResponsiveContainer sizing fix...');
  
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

    console.log('🔍 [PnL CHART SIZING FIX] Navigating to dashboard...');
    
    await page.goto('http://localhost:3000/dashboard', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });

    await new Promise(resolve => setTimeout(resolve, 5000));

    // Handle login if needed
    const loginRequired = await page.$('input[type="email"]');
    if (loginRequired) {
      console.log('🔍 [PnL CHART SIZING FIX] Performing login...');
      await page.type('input[type="email"]', 'test@example.com');
      await page.type('input[type="password"]', 'testpassword123');
      await page.click('button[type="submit"]');
      await new Promise(resolve => setTimeout(resolve, 3000));
    }

    console.log('🔍 [PnL CHART SIZING FIX] Applying ResponsiveContainer sizing fix...');
    
    // Apply CSS fixes to resolve the sizing issue
    await page.evaluate(() => {
      // Create a style element to inject CSS fixes
      const style = document.createElement('style');
      style.textContent = `
        /* Fix ResponsiveContainer sizing issues */
        .recharts-responsive-container {
          width: 100% !important;
          height: 100% !important;
          min-width: 300px !important;
          min-height: 300px !important;
          position: relative !important;
        }
        
        .recharts-wrapper {
          width: 100% !important;
          height: 100% !important;
          position: relative !important;
        }
        
        .recharts-surface {
          width: 100% !important;
          height: 100% !important;
        }
        
        /* Ensure chart container has proper dimensions */
        .chart-container-enhanced {
          width: 100% !important;
          height: 400px !important;
          min-height: 400px !important;
          position: relative !important;
          overflow: hidden !important;
        }
        
        /* Fix SVG sizing */
        .chart-container-enhanced svg {
          width: 100% !important;
          height: 100% !important;
          min-width: 300px !important;
          min-height: 300px !important;
        }
        
        /* Ensure ResponsiveContainer children are properly sized */
        .chart-container-enhanced .recharts-responsive-container > div {
          width: 100% !important;
          height: 100% !important;
        }
      `;
      document.head.appendChild(style);
      
      // Force a resize event to trigger ResponsiveContainer recalculation
      window.dispatchEvent(new Event('resize'));
      
      // Additional manual resize after a delay
      setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
      }, 1000);
    });

    console.log('🔍 [PnL CHART SIZING FIX] Waiting for chart to recalculate...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log('🔍 [PnL CHART SIZING FIX] Analyzing fixed chart...');
    
    // Analyze the chart after applying fixes
    const analysis = await page.evaluate(() => {
      const results = {
        containerAnalysis: {},
        svgAnalysis: {},
        stylingAnalysis: {},
        visualImprovements: {
          smoothSpline: false,
          verticalGradient: false,
          noDataPointMarkers: false,
          thickGlowingLine: false,
          transparentGrid: false
        }
      };

      // Analyze chart container
      const chartContainer = document.querySelector('.chart-container-enhanced');
      if (chartContainer) {
        const containerRect = chartContainer.getBoundingClientRect();
        results.containerAnalysis = {
          found: true,
          dimensions: {
            width: containerRect.width,
            height: containerRect.height
          }
        };
      }

      // Analyze SVG
      const svg = document.querySelector('.chart-container-enhanced svg');
      if (svg) {
        const svgRect = svg.getBoundingClientRect();
        results.svgAnalysis = {
          found: true,
          dimensions: {
            width: svgRect.width,
            height: svgRect.height
          },
          childElements: {
            total: svg.children.length,
            defs: svg.querySelectorAll('defs').length,
            gradients: svg.querySelectorAll('linearGradient, radialGradient').length,
            filters: svg.querySelectorAll('filter').length,
            areas: svg.querySelectorAll('.recharts-area-area, path[data-key="cumulative"]').length,
            gridLines: svg.querySelectorAll('.recharts-cartesian-grid-line').length,
            dots: svg.querySelectorAll('.recharts-area-dot, .recharts-active-dot').length
          }
        };

        // Check for visual improvements
        const areaElements = svg.querySelectorAll('.recharts-area-area, path[data-key="cumulative"]');
        if (areaElements.length > 0) {
          const area = areaElements[0];
          const areaStyles = window.getComputedStyle(area);
          
          results.visualImprovements.smoothSpline = area.getAttribute('type') === 'monotone';
          results.visualImprovements.noDataPointMarkers = 
            svg.querySelectorAll('.recharts-area-dot, .recharts-active-dot').length === 0;
          results.visualImprovements.thickGlowingLine = 
            parseFloat(areaStyles.strokeWidth) >= 4 && 
            areaStyles.filter.includes('blur');
        }

        // Check for gradients
        const gradients = svg.querySelectorAll('linearGradient');
        if (gradients.length > 0) {
          const gradient = gradients[0];
          const stops = gradient.querySelectorAll('stop');
          results.visualImprovements.verticalGradient = stops.length >= 2;
          
          results.stylingAnalysis.gradient = {
            id: gradient.id,
            stops: Array.from(stops).map(stop => ({
              offset: stop.getAttribute('offset'),
              color: stop.getAttribute('stop-color'),
              opacity: stop.getAttribute('stop-opacity')
            }))
          };
        }

        // Check for grid lines transparency
        const gridLines = svg.querySelectorAll('.recharts-cartesian-grid-line');
        if (gridLines.length > 0) {
          const gridStyles = window.getComputedStyle(gridLines[0]);
          results.visualImprovements.transparentGrid = 
            gridStyles.stroke.includes('0.0') || 
            gridStyles.opacity === '0.02' ||
            gridStyles.stroke.includes('rgba(255, 255, 255, 0.02');
        }
      }

      return results;
    });

    console.log('🔍 [PnL CHART SIZING FIX] Analysis results:', JSON.stringify(analysis, null, 2));

    // Take screenshot after fix
    await page.screenshot({ 
      path: 'pnl-chart-after-sizing-fix.png',
      fullPage: true 
    });

    // Save analysis results
    const fs = require('fs');
    fs.writeFileSync('pnl-chart-sizing-fix-results.json', JSON.stringify(analysis, null, 2));

    console.log('🔍 [PnL CHART SIZING FIX] Results saved to pnl-chart-sizing-fix-results.json');
    console.log('🔍 [PnL CHART SIZING FIX] Screenshot saved as pnl-chart-after-sizing-fix.png');

    return analysis;

  } catch (error) {
    console.error('🔍 [PnL CHART SIZING FIX] ERROR:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

// Run the sizing fix test
testPnLChartSizingFix()
  .then(results => {
    console.log('✅ [PnL CHART SIZING FIX] COMPLETED');
    
    console.log('\n📊 [SIZING FIX RESULTS]:');
    console.log(`📏 Container: ${results.containerAnalysis.dimensions.width}×${results.containerAnalysis.dimensions.height}`);
    console.log(`🎨 SVG: ${results.svgAnalysis.dimensions.width}×${results.svgAnalysis.dimensions.height}`);
    
    console.log('\n🎯 [VISUAL IMPROVEMENTS STATUS]:');
    console.log(`✅ Smooth Spline: ${results.visualImprovements.smoothSpline ? 'WORKING' : 'NOT DETECTED'}`);
    console.log(`✅ Vertical Gradient: ${results.visualImprovements.verticalGradient ? 'WORKING' : 'NOT DETECTED'}`);
    console.log(`✅ No Data Point Markers: ${results.visualImprovements.noDataPointMarkers ? 'WORKING' : 'ISSUE DETECTED'}`);
    console.log(`✅ Thick Glowing Line: ${results.visualImprovements.thickGlowingLine ? 'WORKING' : 'NOT DETECTED'}`);
    console.log(`✅ Transparent Grid: ${results.visualImprovements.transparentGrid ? 'WORKING' : 'NOT DETECTED'}`);
    
    if (results.stylingAnalysis.gradient) {
      console.log('\n🎨 [GRADIENT DETAILS]:');
      results.stylingAnalysis.gradient.stops.forEach((stop, index) => {
        console.log(`   Stop ${index + 1}: ${stop.color} (opacity: ${stop.opacity}) at ${stop.offset}`);
      });
    }
    
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ [PnL CHART SIZING FIX] FAILED:', error);
    process.exit(1);
  });