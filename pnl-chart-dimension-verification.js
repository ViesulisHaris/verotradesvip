const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function verifyPnLChartDimensions() {
  console.log('🔍 Starting PnL Chart dimension verification...');
  
  const browser = await chromium.launch({ 
    headless: false, // Set to false to see the browser
    slowMo: 1000 // Slow down actions for better visibility
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  
  const page = await context.newPage();
  
  // Monitor console logs
  const consoleMessages = [];
  page.on('console', msg => {
    const text = msg.text();
    consoleMessages.push({
      type: msg.type(),
      text: text,
      timestamp: new Date().toISOString()
    });
    
    if (text.includes('PNL CHART DEBUG') || text.includes('EMOTION RADAR DEBUG')) {
      console.log(`🔍 Console: ${text}`);
    }
  });
  
  try {
    // Navigate to the login page first
    console.log('🔍 Navigating to login page...');
    await page.goto('http://localhost:3000/login');
    
    // Wait for page to load
    await page.waitForTimeout(2000);
    
    // Try to login if needed
    const emailInput = await page.$('input[type="email"]');
    if (emailInput) {
      console.log('🔍 Logging in...');
      await emailInput.fill('test@example.com');
      const passwordInput = await page.$('input[type="password"]');
      if (passwordInput) {
        await passwordInput.fill('password123');
        const loginButton = await page.$('button[type="submit"]');
        if (loginButton) {
          await loginButton.click();
          await page.waitForTimeout(3000);
        }
      }
    }
    
    // Navigate to dashboard
    console.log('🔍 Navigating to dashboard...');
    await page.goto('http://localhost:3000/dashboard');
    
    // Wait for dashboard to load
    await page.waitForTimeout(3000);
    
    // Take initial screenshot
    await page.screenshot({ 
      path: 'pnl-chart-initial-state.png',
      fullPage: true 
    });
    
    // Get dimensions of both charts
    console.log('🔍 Measuring chart dimensions...');
    
    const pnlChartDimensions = await page.evaluate(() => {
      const pnlContainer = document.querySelector('[class*="h-64 lg:h-80"]');
      if (pnlContainer) {
        const rect = pnlContainer.getBoundingClientRect();
        const responsiveContainer = pnlContainer.querySelector('.recharts-responsive-container');
        const svgElement = pnlContainer.querySelector('svg');
        
        return {
          container: {
            width: rect.width,
            height: rect.height,
            element: pnlContainer.className
          },
          responsiveContainer: responsiveContainer ? {
            width: responsiveContainer.offsetWidth,
            height: responsiveContainer.offsetHeight
          } : null,
          svg: svgElement ? {
            width: svgElement.getAttribute('width'),
            height: svgElement.getAttribute('height'),
            actualWidth: svgElement.getBoundingClientRect().width,
            actualHeight: svgElement.getBoundingClientRect().height
          } : null
        };
      }
      return null;
    });
    
    const emotionRadarDimensions = await page.evaluate(() => {
      const radarContainers = document.querySelectorAll('[class*="chart-container-enhanced"]');
      for (const container of radarContainers) {
        const svgElement = container.querySelector('svg');
        if (svgElement && container.querySelector('RadarChart')) {
          const rect = container.getBoundingClientRect();
          return {
            container: {
              width: rect.width,
              height: rect.height,
              element: container.className
            },
            svg: {
              width: svgElement.getAttribute('width'),
              height: svgElement.getAttribute('height'),
              actualWidth: svgElement.getBoundingClientRect().width,
              actualHeight: svgElement.getBoundingClientRect().height
            }
          };
        }
      }
      return null;
    });
    
    console.log('🔍 PnL Chart Dimensions:', JSON.stringify(pnlChartDimensions, null, 2));
    console.log('🔍 Emotion Radar Dimensions:', JSON.stringify(emotionRadarDimensions, null, 2));
    
    // Check for visual styling issues
    const stylingAnalysis = await page.evaluate(() => {
      const pnlContainer = document.querySelector('[class*="h-64 lg:h-80"]');
      const analysis = {
        hasGradient: false,
        hasGlow: false,
        hasSmoothSpline: false,
        hasDataPoints: false,
        chartHeightRatio: 0,
        containerHeightRatio: 0
      };
      
      if (pnlContainer) {
        const svg = pnlContainer.querySelector('svg');
        if (svg) {
          // Check for gradient
          const gradients = svg.querySelectorAll('linearGradient');
          analysis.hasGradient = gradients.length > 0;
          
          // Check for glow filter
          const filters = svg.querySelectorAll('filter');
          analysis.hasGlow = filters.length > 0;
          
          // Check for spline (monotone type)
          const area = svg.querySelector('recharts-area');
          if (area) {
            // This is harder to detect directly, but we can check the path
            const path = svg.querySelector('path[fill="url(#pnlTealGradient)"]');
            if (path) {
              const d = path.getAttribute('d');
              analysis.hasSmoothSpline = d && d.includes('C'); // Cubic bezier curves
            }
          }
          
          // Check for data points
          const dots = svg.querySelectorAll('circle.recharts-area-dot');
          analysis.hasDataPoints = dots.length > 0;
          
          // Calculate height ratios
          const containerRect = pnlContainer.getBoundingClientRect();
          const svgRect = svg.getBoundingClientRect();
          analysis.chartHeightRatio = svgRect.height / containerRect.height;
          analysis.containerHeightRatio = containerRect.height / window.innerHeight;
        }
      }
      
      return analysis;
    });
    
    console.log('🔍 Styling Analysis:', JSON.stringify(stylingAnalysis, null, 2));
    
    // Wait a bit more for any animations
    await page.waitForTimeout(2000);
    
    // Take final screenshot
    await page.screenshot({ 
      path: 'pnl-chart-final-state.png',
      fullPage: true 
    });
    
    // Create verification report
    const report = {
      timestamp: new Date().toISOString(),
      pnlChartDimensions,
      emotionRadarDimensions,
      stylingAnalysis,
      consoleMessages: consoleMessages.filter(msg => 
        msg.text.includes('PNL CHART DEBUG') || 
        msg.text.includes('EMOTION RADAR DEBUG') ||
        msg.type === 'error'
      ),
      diagnosis: {
        isStretched: pnlChartDimensions?.container?.height !== emotionRadarDimensions?.container?.height,
        dimensionMismatch: pnlChartDimensions?.svg?.actualHeight !== emotionRadarDimensions?.svg?.actualHeight,
        visualIssues: {
          missingGradient: !stylingAnalysis.hasGradient,
          missingGlow: !stylingAnalysis.hasGlow,
          hasDataPoints: stylingAnalysis.hasDataPoints, // Should be false
          notSmooth: !stylingAnalysis.hasSmoothSpline
        }
      }
    };
    
    // Save report
    fs.writeFileSync(
      'pnl-chart-dimension-verification-report.json',
      JSON.stringify(report, null, 2)
    );
    
    console.log('🔍 Verification complete. Report saved to pnl-chart-dimension-verification-report.json');
    
  } catch (error) {
    console.error('❌ Error during verification:', error);
  } finally {
    await browser.close();
  }
}

// Run the verification
verifyPnLChartDimensions().catch(console.error);