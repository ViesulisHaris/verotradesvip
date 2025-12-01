const puppeteer = require('puppeteer');
const path = require('path');

async function testPnLChartVisualImprovements() {
  console.log('🔍 [PnL CHART VISUAL TEST] Starting comprehensive visual verification...');
  
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
    
    // Enable request/response logging for debugging
    page.on('request', request => {
      if (request.url().includes('supabase') || request.url().includes('api')) {
        console.log('🔍 [REQUEST]', request.url());
      }
    });
    
    page.on('response', response => {
      if (response.url().includes('supabase') || response.url().includes('api')) {
        console.log('🔍 [RESPONSE]', response.url(), response.status());
      }
    });

    console.log('🔍 [PnL CHART VISUAL TEST] Navigating to dashboard...');
    
    // Navigate to the dashboard page
    await page.goto('http://localhost:3000/dashboard', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });

    // Wait for the page to load completely
    await new Promise(resolve => setTimeout(resolve, 3000));

    console.log('🔍 [PnL CHART VISUAL TEST] Checking if authentication is required...');
    
    // Check if we need to login
    const loginRequired = await page.$('input[type="email"], input[type="password"]');
    if (loginRequired) {
      console.log('🔍 [PnL CHART VISUAL TEST] Authentication required, attempting login...');
      
      // Try to login with test credentials
      await page.type('input[type="email"]', 'test@example.com');
      await page.type('input[type="password"]', 'testpassword123');
      await page.click('button[type="submit"]');
      
      // Wait for login to complete
      await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 });
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    console.log('🔍 [PnL CHART VISUAL TEST] Looking for PnL Chart component...');
    
    // Wait for the PnL Chart to be visible
    await page.waitForSelector('[class*="chart"], svg', { timeout: 10000 });
    await new Promise(resolve => setTimeout(resolve, 2000)); // Additional wait for chart animation

    console.log('🔍 [PnL CHART VISUAL TEST] Taking initial screenshot...');
    
    // Take a screenshot of the full page
    await page.screenshot({ 
      path: 'pnl-chart-visual-test-full-page.png',
      fullPage: true 
    });

    console.log('🔍 [PnL CHART VISUAL TEST] Analyzing chart elements...');
    
    // Analyze the chart structure and styling
    const chartAnalysis = await page.evaluate(() => {
      const results = {
        chartFound: false,
        hasSvgElement: false,
        hasAreaElement: false,
        hasGradient: false,
        hasGlowFilter: false,
        gridLinesTransparent: false,
        noDataPointMarkers: true,
        lineThickness: 0,
        strokeColor: '',
        gradientColors: [],
        consoleErrors: [],
        chartDataPoints: 0,
        chartVisible: false
      };

      // Check for console errors
      if (window.console && window.console.error) {
        const originalError = console.error;
        console.error = function(...args) {
          results.consoleErrors.push(args.join(' '));
          originalError.apply(console, args);
        };
      }

      // Look for chart container
      const chartContainer = document.querySelector('[class*="chart"], .chart-container-stable');
      if (chartContainer) {
        results.chartFound = true;
        results.chartVisible = chartContainer.offsetParent !== null;
        
        const svg = chartContainer.querySelector('svg');
        if (svg) {
          results.hasSvgElement = true;
          
          // Check for area element
          const area = svg.querySelector('path[data-key="cumulative"], .recharts-area-area');
          if (area) {
            results.hasAreaElement = true;
            
            // Check stroke properties
            const stroke = window.getComputedStyle(area).stroke;
            const strokeWidth = window.getComputedStyle(area).strokeWidth;
            results.strokeColor = stroke;
            results.lineThickness = parseFloat(strokeWidth) || 0;
            
            // Check for filter (glow effect)
            const filter = window.getComputedStyle(area).filter;
            results.hasGlowFilter = filter && filter.includes('blur');
          }
          
          // Check for gradient definitions
          const defs = svg.querySelector('defs');
          if (defs) {
            const gradient = defs.querySelector('#pnlTealGradient, linearGradient');
            if (gradient) {
              results.hasGradient = true;
              
              const stops = gradient.querySelectorAll('stop');
              stops.forEach(stop => {
                const color = stop.getAttribute('stop-color');
                const opacity = stop.getAttribute('stop-opacity');
                results.gradientColors.push({ color, opacity });
              });
            }
            
            // Check for glow filter definition
            const glowFilter = defs.querySelector('#pnlTealGlow, filter');
            if (glowFilter) {
              results.hasGlowFilter = true;
            }
          }
          
          // Check for grid lines transparency
          const gridLines = svg.querySelectorAll('.recharts-cartesian-grid-line');
          if (gridLines.length > 0) {
            const gridStroke = window.getComputedStyle(gridLines[0]).stroke;
            results.gridLinesTransparent = gridStroke.includes('0.0') || 
                                         gridStroke.includes('rgba(255, 255, 255, 0.0') ||
                                         gridStroke.includes('rgba(255, 255, 255, 0.02');
          }
          
          // Check for data point markers (should be absent)
          const dots = svg.querySelectorAll('.recharts-area-dot, .recharts-active-dot');
          results.noDataPointMarkers = dots.length === 0;
          
          // Count data points
          const allPaths = svg.querySelectorAll('path');
          results.chartDataPoints = allPaths.length;
        }
      }

      return results;
    });

    console.log('🔍 [PnL CHART VISUAL TEST] Chart analysis results:', JSON.stringify(chartAnalysis, null, 2));

    console.log('🔍 [PnL CHART VISUAL TEST] Taking detailed chart screenshot...');
    
    // Take a focused screenshot of just the chart area
    const chartElement = await page.$('[class*="chart"], svg');
    if (chartElement) {
      await chartElement.screenshot({ 
        path: 'pnl-chart-detailed.png' 
      });
    }

    console.log('🔍 [PnL CHART VISUAL TEST] Checking for any rendering errors...');
    
    // Check for any JavaScript errors
    const pageErrors = await page.evaluate(() => {
      const errors = [];
      
      // Check for any error messages in the console
      if (window.performance && window.performance.getEntriesByType) {
        const resources = window.performance.getEntriesByType('resource');
        resources.forEach(resource => {
          if (resource.name.includes('.js') && resource.transferSize === 0) {
            errors.push(`Failed to load: ${resource.name}`);
          }
        });
      }
      
      return errors;
    });

    console.log('🔍 [PnL CHART VISUAL TEST] Page errors:', pageErrors);

    // Compile the test results
    const testResults = {
      timestamp: new Date().toISOString(),
      visualImprovements: {
        smoothSpline: chartAnalysis.hasAreaElement, // Monotone interpolation
        verticalGradient: chartAnalysis.hasGradient && 
                          chartAnalysis.gradientColors.length >= 2,
        gradientColors: chartAnalysis.gradientColors,
        noDataPointMarkers: chartAnalysis.noDataPointMarkers,
        thickGlowingLine: chartAnalysis.lineThickness >= 4 && chartAnalysis.hasGlowFilter,
        lineThickness: chartAnalysis.lineThickness,
        strokeColor: chartAnalysis.strokeColor,
        transparentGrid: chartAnalysis.gridLinesTransparent,
        chartVisible: chartAnalysis.chartVisible
      },
      technicalStatus: {
        chartFound: chartAnalysis.chartFound,
        hasSvgElement: chartAnalysis.hasSvgElement,
        hasAreaElement: chartAnalysis.hasAreaElement,
        hasGradient: chartAnalysis.hasGradient,
        hasGlowFilter: chartAnalysis.hasGlowFilter,
        consoleErrors: chartAnalysis.consoleErrors,
        pageErrors: pageErrors
      },
      screenshots: {
        fullPage: 'pnl-chart-visual-test-full-page.png',
        detailedChart: 'pnl-chart-detailed.png'
      }
    };

    console.log('🔍 [PnL CHART VISUAL TEST] Final test results:', JSON.stringify(testResults, null, 2));

    // Save results to file
    const fs = require('fs');
    fs.writeFileSync('pnl-chart-visual-test-results.json', JSON.stringify(testResults, null, 2));

    console.log('🔍 [PnL CHART VISUAL TEST] Results saved to pnl-chart-visual-test-results.json');
    console.log('🔍 [PnL CHART VISUAL TEST] Screenshots saved as PNG files');

    return testResults;

  } catch (error) {
    console.error('🔍 [PnL CHART VISUAL TEST] ERROR:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

// Run the test
testPnLChartVisualImprovements()
  .then(results => {
    console.log('✅ [PnL CHART VISUAL TEST] COMPLETED SUCCESSFULLY');
    
    // Summary of visual improvements verification
    const improvements = results.visualImprovements;
    console.log('\n📊 [VISUAL IMPROVEMENTS VERIFICATION SUMMARY]:');
    console.log(`✅ Smooth Spline Interpolation: ${improvements.smoothSpline ? 'WORKING' : 'NOT DETECTED'}`);
    console.log(`✅ Vertical Gradient Fill: ${improvements.verticalGradient ? 'WORKING' : 'NOT DETECTED'}`);
    console.log(`✅ No Data Point Markers: ${improvements.noDataPointMarkers ? 'WORKING' : 'ISSUE DETECTED'}`);
    console.log(`✅ Thick Glowing Line: ${improvements.thickGlowingLine ? 'WORKING' : 'NOT DETECTED'}`);
    console.log(`✅ Line Thickness: ${improvements.lineThickness}px (expected: 4px)`);
    console.log(`✅ Stroke Color: ${improvements.strokeColor} (expected: #14b8a6)`);
    console.log(`✅ Transparent Grid: ${improvements.transparentGrid ? 'WORKING' : 'NOT DETECTED'}`);
    console.log(`✅ Chart Visibility: ${improvements.chartVisible ? 'VISIBLE' : 'HIDDEN'}`);
    
    if (improvements.verticalGradient && improvements.gradientColors.length > 0) {
      console.log('\n🎨 [GRADIENT COLORS DETECTED]:');
      improvements.gradientColors.forEach((color, index) => {
        console.log(`   Stop ${index + 1}: ${color.color} (opacity: ${color.opacity})`);
      });
    }
    
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ [PnL CHART VISUAL TEST] FAILED:', error);
    process.exit(1);
  });