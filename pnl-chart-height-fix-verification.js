const { chromium } = require('playwright');
const fs = require('fs');

async function verifyPnLChartHeightFix() {
  console.log('🔍 Verifying PnL Chart height fix...');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  
  const page = await context.newPage();
  
  // Monitor console logs for chart debug info
  const consoleMessages = [];
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('PNL CHART DEBUG') || text.includes('EMOTION RADAR DEBUG')) {
      console.log(`🔍 Console: ${text}`);
      consoleMessages.push({
        type: msg.type(),
        text: text,
        timestamp: new Date().toISOString()
      });
    }
  });
  
  try {
    // Navigate to dashboard directly (assuming user is already logged in or can access)
    console.log('🔍 Navigating to dashboard...');
    await page.goto('http://localhost:3000/dashboard');
    
    // Wait for dashboard to load
    await page.waitForTimeout(3000);
    
    // Get dimensions of both charts after fix
    console.log('🔍 Measuring chart dimensions after fix...');
    
    const chartDimensions = await page.evaluate(() => {
      const pnlContainer = document.querySelector('[class*="chart-container-enhanced"]');
      const emotionContainers = document.querySelectorAll('[class*="chart-container-enhanced"]');
      
      let pnlChart = null;
      let emotionRadar = null;
      
      // Find PnL Chart (first one with h-[320px] class)
      if (pnlContainer) {
        pnlChart = {
          container: {
            width: pnlContainer.offsetWidth,
            height: pnlContainer.offsetHeight,
            className: pnlContainer.className
          },
          responsiveContainer: null,
          svg: null
        };
        
        const responsiveContainer = pnlContainer.querySelector('.recharts-responsive-container');
        if (responsiveContainer) {
          pnlChart.responsiveContainer = {
            width: responsiveContainer.offsetWidth,
            height: responsiveContainer.offsetHeight
          };
        }
        
        const svg = pnlContainer.querySelector('svg');
        if (svg) {
          pnlChart.svg = {
            width: svg.getAttribute('width'),
            height: svg.getAttribute('height'),
            actualWidth: svg.getBoundingClientRect().width,
            actualHeight: svg.getBoundingClientRect().height
          };
        }
      }
      
      // Find EmotionRadar (second one)
      if (emotionContainers.length > 1) {
        const radarContainer = emotionContainers[1]; // Second container should be EmotionRadar
        emotionRadar = {
          container: {
            width: radarContainer.offsetWidth,
            height: radarContainer.offsetHeight,
            className: radarContainer.className
          },
          svg: null
        };
        
        const svg = radarContainer.querySelector('svg');
        if (svg) {
          emotionRadar.svg = {
            width: svg.getAttribute('width'),
            height: svg.getAttribute('height'),
            actualWidth: svg.getBoundingClientRect().width,
            actualHeight: svg.getBoundingClientRect().height
          };
        }
      }
      
      return { pnlChart, emotionRadar };
    });
    
    console.log('🔍 PnL Chart Dimensions after fix:', JSON.stringify(chartDimensions.pnlChart, null, 2));
    console.log('🔍 EmotionRadar Dimensions:', JSON.stringify(chartDimensions.emotionRadar, null, 2));
    
    // Check if heights now match
    const heightMatch = chartDimensions.pnlChart?.container?.height === chartDimensions.emotionRadar?.container?.height;
    const heightDifference = Math.abs(
      (chartDimensions.pnlChart?.container?.height || 0) - 
      (chartDimensions.emotionRadar?.container?.height || 0)
    );
    
    console.log('🔍 Height Analysis:');
    console.log(`  - PnL Chart height: ${chartDimensions.pnlChart?.container?.height}px`);
    console.log(`  - EmotionRadar height: ${chartDimensions.emotionRadar?.container?.height}px`);
    console.log(`  - Height difference: ${heightDifference}px`);
    console.log(`  - Heights match: ${heightMatch}`);
    
    // Take screenshot for evidence
    await page.screenshot({ 
      path: 'pnl-chart-height-fix-evidence.png',
      fullPage: true 
    });
    
    // Create verification report
    const report = {
      timestamp: new Date().toISOString(),
      fixApplied: 'PnL Chart height updated to match EmotionRadar',
      dimensions: chartDimensions,
      heightAnalysis: {
        heightMatch,
        heightDifference,
        pnlChartHeight: chartDimensions.pnlChart?.container?.height,
        emotionRadarHeight: chartDimensions.emotionRadar?.container?.height
      },
      consoleMessages,
      success: heightDifference <= 5 // Allow 5px tolerance
    };
    
    // Save report
    fs.writeFileSync(
      'pnl-chart-height-fix-verification-report.json',
      JSON.stringify(report, null, 2)
    );
    
    console.log('🔍 Verification complete!');
    console.log(`✅ Height fix ${report.success ? 'SUCCESSFUL' : 'NEEDS ADJUSTMENT'}`);
    console.log(`📊 Height difference: ${heightDifference}px`);
    console.log('📸 Screenshot saved: pnl-chart-height-fix-evidence.png');
    console.log('📄 Report saved: pnl-chart-height-fix-verification-report.json');
    
  } catch (error) {
    console.error('❌ Error during verification:', error);
  } finally {
    await browser.close();
  }
}

// Run the verification
verifyPnLChartHeightFix().catch(console.error);