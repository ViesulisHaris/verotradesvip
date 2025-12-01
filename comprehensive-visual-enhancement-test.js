/**
 * COMPREHENSIVE VISUAL ENHANCEMENT TEST
 * Tests all dashboard visual enhancements to ensure they work properly
 * 
 * Testing Scope:
 * 1. EmotionRadar enhancements - gradients, glow effects, animations
 * 2. PnLChart enhancements - gradient colors, animated gradients, glow effects
 * 3. DashboardCard glass morphism - backdrop blur, transparency, animations
 * 4. SharpeRatioGauge glass morphism - backdrop blur, transparency, animations
 * 5. DominantEmotionCard glass morphism - backdrop blur, transparency, animations
 * 6. VRatingCard glass morphism - backdrop blur, transparency, animations
 */

const puppeteer = require('puppeteer');
const path = require('path');

// Test configuration
const TEST_CONFIG = {
  baseUrl: 'http://localhost:3000',
  viewport: { width: 1920, height: 1080 },
  timeout: 30000,
  screenshotPath: './visual-enhancement-test-screenshots',
  performanceThreshold: 300 // 300ms sidebar transition performance
};

// Test data for components
const TEST_DATA = {
  emotionRadar: [
    { subject: 'FOMO', value: 75, leaning: 'Buy Leaning', side: 'Buy', leaningValue: 65, totalTrades: 12 },
    { subject: 'PATIENCE', value: 60, leaning: 'Balanced', side: 'NULL', leaningValue: 0, totalTrades: 8 },
    { subject: 'DISCIPLINE', value: 85, leaning: 'Sell Leaning', side: 'Sell', leaningValue: -45, totalTrades: 15 },
    { subject: 'REVENGE', value: 30, leaning: 'Balanced', side: 'NULL', leaningValue: 10, totalTrades: 3 },
    { subject: 'TILT', value: 45, leaning: 'Buy Leaning', side: 'Buy', leaningValue: 35, totalTrades: 6 }
  ],
  pnlChart: [
    { date: '2025-01-01', pnl: 150.50, cumulative: 150.50 },
    { date: '2025-01-02', pnl: -75.25, cumulative: 75.25 },
    { date: '2025-01-03', pnl: 200.00, cumulative: 275.25 },
    { date: '2025-01-04', pnl: 125.75, cumulative: 401.00 },
    { date: '2025-01-05', pnl: -50.00, cumulative: 351.00 }
  ],
  dashboardCard: {
    title: 'Total P&L',
    value: '$2,547.50',
    profitability: 'good',
    icon: 'trending',
    tooltip: 'Total profit and loss across all trades'
  },
  sharpeRatio: 1.85,
  dominantEmotion: {
    emotion: 'DISCIPLINE',
    emotionData: {
      'DISCIPLINE': 15,
      'PATIENCE': 8,
      'FOMO': 12,
      'REVENGE': 3,
      'TILT': 6
    }
  },
  vRatingData: {
    overallScore: 7.8,
    categories: {
      profitability: { name: 'Profitability', score: 8.2, weight: 25, contribution: 2.05, keyMetrics: ['Win Rate', 'Avg Profit', 'Profit Factor'] },
      riskManagement: { name: 'Risk Management', score: 7.5, weight: 20, contribution: 1.50, keyMetrics: ['Max Drawdown', 'Risk/Reward', 'Position Sizing'] },
      consistency: { name: 'Consistency', score: 7.0, weight: 20, contribution: 1.40, keyMetrics: ['Monthly Std Dev', 'Win Streak', 'Loss Streak'] },
      emotionalDiscipline: { name: 'Emotional Discipline', score: 8.5, weight: 20, contribution: 1.70, keyMetrics: ['Tilt Control', 'Patience Score', 'Revenge Trading'] },
      journalingAdherence: { name: 'Journaling Adherence', score: 7.8, weight: 15, contribution: 1.17, keyMetrics: ['Entry Rate', 'Exit Rate', 'Detail Level'] }
    },
    adjustments: [
      { type: 'bonus', description: 'Consistent profitability', value: 0.3 },
      { type: 'penalty', description: 'High volatility periods', value: -0.2 }
    ],
    calculatedAt: new Date().toISOString()
  }
};

// Test results storage
let testResults = {
  emotionRadar: { passed: 0, failed: 0, details: [] },
  pnlChart: { passed: 0, failed: 0, details: [] },
  dashboardCard: { passed: 0, failed: 0, details: [] },
  sharpeRatioGauge: { passed: 0, failed: 0, details: [] },
  dominantEmotionCard: { passed: 0, failed: 0, details: [] },
  vRatingCard: { passed: 0, failed: 0, details: [] },
  performance: { sidebarTransition: 0, animations: 0 },
  summary: { totalPassed: 0, totalFailed: 0, issues: [] }
};

// Utility functions
function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [${type.toUpperCase()}]`;
  console.log(`${prefix} ${message}`);
}

function recordResult(component, testName, passed, details = '') {
  const result = { test: testName, passed, details, timestamp: new Date().toISOString() };
  
  if (testResults[component]) {
    testResults[component].details.push(result);
    if (passed) {
      testResults[component].passed++;
    } else {
      testResults[component].failed++;
    }
  }
  
  if (passed) {
    log(`✅ ${component} - ${testName}: ${details}`, 'success');
  } else {
    log(`❌ ${component} - ${testName}: ${details}`, 'error');
    testResults.summary.issues.push(`${component} - ${testName}: ${details}`);
  }
}

async function takeScreenshot(page, name, description = '') {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `${name}-${timestamp}.png`;
  const filepath = path.join(TEST_CONFIG.screenshotPath, filename);
  
  try {
    await page.screenshot({ path: filepath, fullPage: false });
    log(`📸 Screenshot saved: ${filename} - ${description}`, 'info');
    return filepath;
  } catch (error) {
    log(`Failed to take screenshot: ${error.message}`, 'error');
    return null;
  }
}

async function measurePerformance(page, actionName) {
  const startTime = Date.now();
  await page.evaluate(() => performance.mark(`${actionName}-start`));
  
  return {
    startTime,
    endTime: null,
    duration: null,
    markEnd: async () => {
      await page.evaluate((name) => performance.mark(`${name}-end`), actionName);
      await page.evaluate((name) => performance.measure(name, `${name}-start`, `${name}-end`), actionName);
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      return { endTime, duration };
    }
  };
}

// Test functions for each component
async function testEmotionRadarEnhancements(page) {
  log('Testing EmotionRadar visual enhancements...', 'info');
  
  try {
    // Navigate to a test page with EmotionRadar
    await page.goto(`${TEST_CONFIG.baseUrl}/test-emotion-radar-mixed`, { waitUntil: 'networkidle2' });
    await page.waitForTimeout(2000);
    
    // Test 1: Enhanced gradients are visible
    const gradientExists = await page.evaluate(() => {
      const gradients = document.querySelectorAll('#tealGradient, #pulseGradient, #hoverGradient');
      return gradients.length > 0;
    });
    recordResult('emotionRadar', 'Enhanced gradients visible', gradientExists, 
      `Found ${gradientExists ? 'gradient definitions' : 'no gradient definitions'}`);
    
    // Test 2: Glow effects are applied
    const glowEffects = await page.evaluate(() => {
      const glowFilters = document.querySelectorAll('#tealGlow, #hoverGlow');
      const radarElements = document.querySelectorAll('[style*="filter"]');
      return { 
        filters: glowFilters.length,
        elementsWithGlow: Array.from(radarElements).filter(el => 
          el.style.filter && el.style.filter.includes('blur')
        ).length
      };
    });
    recordResult('emotionRadar', 'Glow effects applied', 
      glowEffects.filters > 0 && glowEffects.elementsWithGlow > 0,
      `Found ${glowEffects.filters} glow filters and ${glowEffects.elementsWithGlow} elements with glow`);
    
    // Test 3: Animated gradient is visible and smooth
    const animatedGradient = await page.evaluate(() => {
      const pulseGradient = document.querySelector('#pulseGradient animate');
      if (!pulseGradient) return false;
      
      const animateElements = pulseGradient.getAttribute('animate');
      return animateElements && animateElements.includes('repeatCount="indefinite"');
    });
    recordResult('emotionRadar', 'Animated gradient visible', animatedGradient,
      animatedGradient ? 'Pulse animation found' : 'No pulse animation detected');
    
    // Test 4: Hover effects on data points work
    await page.hover('.recharts-radar-dot');
    await page.waitForTimeout(500);
    
    const hoverEffectActive = await page.evaluate(() => {
      const activeDots = document.querySelectorAll('.recharts-radar-dot[style*="cursor: pointer"]');
      return activeDots.length > 0;
    });
    recordResult('emotionRadar', 'Hover effects on data points', hoverEffectActive,
      hoverEffectActive ? 'Interactive data points found' : 'No interactive data points');
    
    // Test 5: Performance during sidebar transitions
    const sidebarPerf = await measurePerformance(page, 'emotionRadar-sidebar');
    
    // Toggle sidebar
    await page.click('[data-testid="sidebar-toggle"] || .sidebar-toggle || button[aria-label*="menu"]');
    const perfResult = await sidebarPerf.markEnd();
    
    const performanceMaintained = perfResult.duration <= TEST_CONFIG.performanceThreshold;
    recordResult('emotionRadar', 'Performance during sidebar transitions', performanceMaintained,
      `Sidebar transition took ${perfResult.duration}ms (threshold: ${TEST_CONFIG.performanceThreshold}ms)`);
    
    testResults.performance.sidebarTransition = perfResult.duration;
    
    await takeScreenshot(page, 'emotionRadar-enhanced', 'EmotionRadar with all enhancements');
    
  } catch (error) {
    recordResult('emotionRadar', 'Component loading', false, `Error: ${error.message}`);
  }
}

async function testPnLChartEnhancements(page) {
  log('Testing PnLChart visual enhancements...', 'info');
  
  try {
    // Navigate to analytics page with PnLChart
    await page.goto(`${TEST_CONFIG.baseUrl}/analytics`, { waitUntil: 'networkidle2' });
    await page.waitForTimeout(2000);
    
    // Test 1: Enhanced gradient colors are displaying correctly
    const gradientColors = await page.evaluate(() => {
      const pnlGradient = document.querySelector('#pnlTealGradient');
      if (!pnlGradient) return false;
      
      const stops = pnlGradient.querySelectorAll('stop');
      return stops.length >= 2 && 
             stops[0].getAttribute('stopColor') === '#5eead4' &&
             stops[1].getAttribute('stopColor') === '#0f766e';
    });
    recordResult('pnlChart', 'Enhanced gradient colors', gradientColors,
      gradientColors ? 'Correct gradient colors found' : 'Incorrect or missing gradient colors');
    
    // Test 2: Animated gradient is creating visual depth
    const visualDepth = await page.evaluate(() => {
      const areaElement = document.querySelector('.recharts-area-area');
      if (!areaElement) return false;
      
      const style = window.getComputedStyle(areaElement);
      return style.fill && style.fill.includes('url') && 
             style.opacity && parseFloat(style.opacity) > 0.5;
    });
    recordResult('pnlChart', 'Animated gradient visual depth', visualDepth,
      visualDepth ? 'Visual depth effects present' : 'No visual depth detected');
    
    // Test 3: Enhanced glow effects on the chart line
    const glowEffects = await page.evaluate(() => {
      const glowFilter = document.querySelector('#pnlTealGlow');
      const areaElements = document.querySelectorAll('.recharts-area-area');
      
      let hasGlow = false;
      areaElements.forEach(el => {
        const style = window.getComputedStyle(el);
        if (style.filter && style.filter.includes('blur')) {
          hasGlow = true;
        }
      });
      
      return { filterExists: !!glowFilter, hasGlowEffect: hasGlow };
    });
    recordResult('pnlChart', 'Enhanced glow effects', 
      glowEffects.filterExists && glowEffects.hasGlowEffect,
      `Filter exists: ${glowEffects.filterExists}, Glow effect: ${glowEffects.hasGlowEffect}`);
    
    // Test 4: Cursor styling improvements are visible
    await page.hover('.recharts-area-area');
    await page.waitForTimeout(500);
    
    const cursorStyling = await page.evaluate(() => {
      const cursorElements = document.querySelectorAll('[style*="cursor"]');
      return cursorElements.length > 0;
    });
    recordResult('pnlChart', 'Cursor styling improvements', cursorStyling,
      cursorStyling ? 'Enhanced cursor styling found' : 'No cursor styling improvements');
    
    // Test 5: Increased stroke width improves visibility
    const strokeWidth = await page.evaluate(() => {
      const pathElements = document.querySelectorAll('.recharts-area-curve');
      if (pathElements.length === 0) return false;
      
      const style = window.getComputedStyle(pathElements[0]);
      return style.strokeWidth && parseFloat(style.strokeWidth) >= 3;
    });
    recordResult('pnlChart', 'Increased stroke width', strokeWidth,
      strokeWidth ? 'Enhanced stroke width detected' : 'Stroke width not increased');
    
    await takeScreenshot(page, 'pnlChart-enhanced', 'PnLChart with all enhancements');
    
  } catch (error) {
    recordResult('pnlChart', 'Component loading', false, `Error: ${error.message}`);
  }
}

async function testDashboardCardGlassMorphism(page) {
  log('Testing DashboardCard glass morphism effects...', 'info');
  
  try {
    // Navigate to dashboard page
    await page.goto(`${TEST_CONFIG.baseUrl}/analytics`, { waitUntil: 'networkidle2' });
    await page.waitForTimeout(2000);
    
    // Test 1: Backdrop blur is creating proper glass effect
    const backdropBlur = await page.evaluate(() => {
      const cards = document.querySelectorAll('[class*="group"], [class*="card"]');
      let hasBackdropBlur = false;
      
      cards.forEach(card => {
        const style = window.getComputedStyle(card);
        if (style.backdropFilter && style.backdropFilter.includes('blur')) {
          hasBackdropBlur = true;
        }
      });
      
      return hasBackdropBlur;
    });
    recordResult('dashboardCard', 'Backdrop blur glass effect', backdropBlur,
      backdropBlur ? 'Backdrop blur effect found' : 'No backdrop blur detected');
    
    // Test 2: Background transparency is working correctly
    const transparency = await page.evaluate(() => {
      const cards = document.querySelectorAll('[class*="group"], [class*="card"]');
      let hasTransparency = false;
      
      cards.forEach(card => {
        const style = window.getComputedStyle(card);
        if (style.background && style.background.includes('rgba') && 
            style.background.includes('0.6') || style.background.includes('0.7')) {
          hasTransparency = true;
        }
      });
      
      return hasTransparency;
    });
    recordResult('dashboardCard', 'Background transparency', transparency,
      transparency ? 'Background transparency working' : 'No transparency detected');
    
    // Test 3: Animated background patterns are visible
    const animatedPatterns = await page.evaluate(() => {
      const patternElements = document.querySelectorAll('[style*="animation"]');
      return patternElements.length > 0;
    });
    recordResult('dashboardCard', 'Animated background patterns', animatedPatterns,
      animatedPatterns ? `Found ${animatedPatterns.length} animated elements` : 'No animated patterns found');
    
    // Test 4: Hover effects with enhanced glass morphism
    await page.hover('[class*="group"]:first-of-type');
    await page.waitForTimeout(500);
    
    const hoverEffects = await page.evaluate(() => {
      const hoveredCards = document.querySelectorAll(':hover');
      let hasGlassHover = false;
      
      hoveredCards.forEach(card => {
        const style = window.getComputedStyle(card);
        if (style.transform && style.transform.includes('translateY') ||
            style.boxShadow && style.boxShadow.includes('0px')) {
          hasGlassHover = true;
        }
      });
      
      return hasGlassHover;
    });
    recordResult('dashboardCard', 'Enhanced glass morphism hover effects', hoverEffects,
      hoverEffects ? 'Enhanced hover effects working' : 'No enhanced hover effects');
    
    // Test 5: Tooltip enhancements are working
    const tooltipEnhancements = await page.evaluate(() => {
      const tooltips = document.querySelectorAll('[class*="tooltip"], [role="tooltip"]');
      if (tooltips.length === 0) return false;
      
      let hasEnhancedTooltip = false;
      tooltips.forEach(tooltip => {
        const style = window.getComputedStyle(tooltip);
        if (style.backdropFilter && style.backdropFilter.includes('blur')) {
          hasEnhancedTooltip = true;
        }
      });
      
      return hasEnhancedTooltip;
    });
    recordResult('dashboardCard', 'Tooltip enhancements', tooltipEnhancements,
      tooltipEnhancements ? 'Enhanced tooltips found' : 'No tooltip enhancements');
    
    await takeScreenshot(page, 'dashboardCard-glass', 'DashboardCard with glass morphism');
    
  } catch (error) {
    recordResult('dashboardCard', 'Component loading', false, `Error: ${error.message}`);
  }
}

async function testSharpeRatioGaugeGlassMorphism(page) {
  log('Testing SharpeRatioGauge glass morphism effects...', 'info');
  
  try {
    // Navigate to analytics page
    await page.goto(`${TEST_CONFIG.baseUrl}/analytics`, { waitUntil: 'networkidle2' });
    await page.waitForTimeout(2000);
    
    // Look for Sharpe ratio gauge component
    const sharpeGaugeExists = await page.evaluate(() => {
      const sharpeElements = Array.from(document.querySelectorAll('*')).filter(el => 
        el.textContent && el.textContent.toLowerCase().includes('sharpe')
      );
      return sharpeElements.length > 0;
    });
    
    if (!sharpeGaugeExists) {
      recordResult('sharpeRatioGauge', 'Component presence', false, 'SharpeRatioGauge not found on page');
      return;
    }
    
    // Test 1: Backdrop blur is creating proper glass effect
    const backdropBlur = await page.evaluate(() => {
      const sharpeElements = Array.from(document.querySelectorAll('*')).filter(el => 
        el.textContent && el.textContent.toLowerCase().includes('sharpe')
      );
      
      let hasBackdropBlur = false;
      sharpeElements.forEach(element => {
        const style = window.getComputedStyle(element);
        if (style.backdropFilter && style.backdropFilter.includes('blur')) {
          hasBackdropBlur = true;
        }
      });
      
      return hasBackdropBlur;
    });
    recordResult('sharpeRatioGauge', 'Backdrop blur glass effect', backdropBlur,
      backdropBlur ? 'Backdrop blur effect found' : 'No backdrop blur detected');
    
    // Test 2: Background transparency is working correctly
    const transparency = await page.evaluate(() => {
      const sharpeElements = Array.from(document.querySelectorAll('*')).filter(el => 
        el.textContent && el.textContent.toLowerCase().includes('sharpe')
      );
      
      let hasTransparency = false;
      sharpeElements.forEach(element => {
        const style = window.getComputedStyle(element);
        if (style.background && style.background.includes('rgba')) {
          hasTransparency = true;
        }
      });
      
      return hasTransparency;
    });
    recordResult('sharpeRatioGauge', 'Background transparency', transparency,
      transparency ? 'Background transparency working' : 'No transparency detected');
    
    // Test 3: Animated elements are functioning
    const animatedElements = await page.evaluate(() => {
      const sharpeElements = Array.from(document.querySelectorAll('*')).filter(el => 
        el.textContent && el.textContent.toLowerCase().includes('sharpe')
      );
      
      let hasAnimation = false;
      sharpeElements.forEach(element => {
        const style = window.getComputedStyle(element);
        if (style.animation && style.animation !== 'none') {
          hasAnimation = true;
        }
      });
      
      return hasAnimation;
    });
    recordResult('sharpeRatioGauge', 'Animated elements', animatedElements,
      animatedElements ? 'Animated elements found' : 'No animated elements');
    
    // Test 4: Enhanced gauge bar animations
    const gaugeAnimations = await page.evaluate(() => {
      const progressBars = document.querySelectorAll('[class*="gauge"], [class*="progress"], [class*="bar"]');
      let hasAnimatedGauge = false;
      
      progressBars.forEach(bar => {
        const style = window.getComputedStyle(bar);
        if (style.transition && style.transition.includes('width')) {
          hasAnimatedGauge = true;
        }
      });
      
      return hasAnimatedGauge;
    });
    recordResult('sharpeRatioGauge', 'Enhanced gauge bar animations', gaugeAnimations,
      gaugeAnimations ? 'Animated gauge bars found' : 'No gauge animations');
    
    // Test 5: Glow effects on hover
    // Find and hover over Sharpe ratio element
    await page.evaluate(() => {
      const sharpeElements = Array.from(document.querySelectorAll('*')).filter(el => 
        el.textContent && el.textContent.toLowerCase().includes('sharpe')
      );
      if (sharpeElements.length > 0) {
        sharpeElements[0].dispatchEvent(new Event('mouseenter', { bubbles: true }));
      }
    });
    await page.waitForTimeout(500);
    
    const glowEffects = await page.evaluate(() => {
      const elementsWithGlow = document.querySelectorAll('[style*="glow"], [style*="shadow"]');
      return elementsWithGlow.length > 0;
    });
    recordResult('sharpeRatioGauge', 'Glow effects on hover', glowEffects,
      glowEffects ? 'Glow effects found' : 'No glow effects');
    
    await takeScreenshot(page, 'sharpeRatioGauge-glass', 'SharpeRatioGauge with glass morphism');
    
  } catch (error) {
    recordResult('sharpeRatioGauge', 'Component testing', false, `Error: ${error.message}`);
  }
}

async function testDominantEmotionCardGlassMorphism(page) {
  log('Testing DominantEmotionCard glass morphism effects...', 'info');
  
  try {
    // Navigate to analytics page
    await page.goto(`${TEST_CONFIG.baseUrl}/analytics`, { waitUntil: 'networkidle2' });
    await page.waitForTimeout(2000);
    
    // Look for dominant emotion card component
    const emotionCardExists = await page.evaluate(() => {
      const emotionElements = Array.from(document.querySelectorAll('*')).filter(el => 
        el.textContent && (
          el.textContent.toLowerCase().includes('dominant emotion') ||
          el.textContent.toLowerCase().includes('emotion') && el.textContent.includes('%')
        )
      );
      return emotionElements.length > 0;
    });
    
    if (!emotionCardExists) {
      recordResult('dominantEmotionCard', 'Component presence', false, 'DominantEmotionCard not found on page');
      return;
    }
    
    // Test 1: Backdrop blur is creating proper glass effect
    const backdropBlur = await page.evaluate(() => {
      const emotionElements = Array.from(document.querySelectorAll('*')).filter(el => 
        el.textContent && (
          el.textContent.toLowerCase().includes('dominant emotion') ||
          el.textContent.toLowerCase().includes('emotion') && el.textContent.includes('%')
        )
      );
      
      let hasBackdropBlur = false;
      emotionElements.forEach(element => {
        const style = window.getComputedStyle(element);
        if (style.backdropFilter && style.backdropFilter.includes('blur')) {
          hasBackdropBlur = true;
        }
      });
      
      return hasBackdropBlur;
    });
    recordResult('dominantEmotionCard', 'Backdrop blur glass effect', backdropBlur,
      backdropBlur ? 'Backdrop blur effect found' : 'No backdrop blur detected');
    
    // Test 2: Background transparency is working correctly
    const transparency = await page.evaluate(() => {
      const emotionElements = Array.from(document.querySelectorAll('*')).filter(el => 
        el.textContent && (
          el.textContent.toLowerCase().includes('dominant emotion') ||
          el.textContent.toLowerCase().includes('emotion') && el.textContent.includes('%')
        )
      );
      
      let hasTransparency = false;
      emotionElements.forEach(element => {
        const style = window.getComputedStyle(element);
        if (style.background && style.background.includes('rgba')) {
          hasTransparency = true;
        }
      });
      
      return hasTransparency;
    });
    recordResult('dominantEmotionCard', 'Background transparency', transparency,
      transparency ? 'Background transparency working' : 'No transparency detected');
    
    // Test 3: Animated background patterns are visible
    const animatedPatterns = await page.evaluate(() => {
      const emotionElements = Array.from(document.querySelectorAll('*')).filter(el => 
        el.textContent && (
          el.textContent.toLowerCase().includes('dominant emotion') ||
          el.textContent.toLowerCase().includes('emotion') && el.textContent.includes('%')
        )
      );
      
      let hasAnimation = false;
      emotionElements.forEach(element => {
        const style = window.getComputedStyle(element);
        if (style.animation && style.animation !== 'none') {
          hasAnimation = true;
        }
      });
      
      return hasAnimation;
    });
    recordResult('dominantEmotionCard', 'Animated background patterns', animatedPatterns,
      animatedPatterns ? 'Animated patterns found' : 'No animated patterns');
    
    // Test 4: Enhanced emotion distribution bar animations
    const distributionBarAnimations = await page.evaluate(() => {
      const progressBars = document.querySelectorAll('[class*="bar"], [class*="progress"]');
      let hasAnimatedBar = false;
      
      progressBars.forEach(bar => {
        const style = window.getComputedStyle(bar);
        if (style.transition && style.transition.includes('width')) {
          hasAnimatedBar = true;
        }
      });
      
      return hasAnimatedBar;
    });
    recordResult('dominantEmotionCard', 'Enhanced emotion distribution bar animations', distributionBarAnimations,
      distributionBarAnimations ? 'Animated distribution bars found' : 'No distribution bar animations');
    
    // Test 5: Glow effects on hover
    await page.evaluate(() => {
      const emotionElements = Array.from(document.querySelectorAll('*')).filter(el => 
        el.textContent && (
          el.textContent.toLowerCase().includes('dominant emotion') ||
          el.textContent.toLowerCase().includes('emotion') && el.textContent.includes('%')
        )
      );
      if (emotionElements.length > 0) {
        emotionElements[0].dispatchEvent(new Event('mouseenter', { bubbles: true }));
      }
    });
    await page.waitForTimeout(500);
    
    const glowEffects = await page.evaluate(() => {
      const elementsWithGlow = document.querySelectorAll('[style*="glow"], [style*="shadow"]');
      return elementsWithGlow.length > 0;
    });
    recordResult('dominantEmotionCard', 'Glow effects on hover', glowEffects,
      glowEffects ? 'Glow effects found' : 'No glow effects');
    
    await takeScreenshot(page, 'dominantEmotionCard-glass', 'DominantEmotionCard with glass morphism');
    
  } catch (error) {
    recordResult('dominantEmotionCard', 'Component testing', false, `Error: ${error.message}`);
  }
}

async function testVRatingCardGlassMorphism(page) {
  log('Testing VRatingCard glass morphism effects...', 'info');
  
  try {
    // Navigate to analytics page
    await page.goto(`${TEST_CONFIG.baseUrl}/analytics`, { waitUntil: 'networkidle2' });
    await page.waitForTimeout(2000);
    
    // Look for VRating card component
    const vRatingCardExists = await page.evaluate(() => {
      const vRatingElements = Array.from(document.querySelectorAll('*')).filter(el => 
        el.textContent && (
          el.textContent.toLowerCase().includes('vrating') ||
          el.textContent.toLowerCase().includes('performance') && el.textContent.includes('/10')
        )
      );
      return vRatingElements.length > 0;
    });
    
    if (!vRatingCardExists) {
      recordResult('vRatingCard', 'Component presence', false, 'VRatingCard not found on page');
      return;
    }
    
    // Test 1: Backdrop blur is creating proper glass effect
    const backdropBlur = await page.evaluate(() => {
      const vRatingElements = Array.from(document.querySelectorAll('*')).filter(el => 
        el.textContent && (
          el.textContent.toLowerCase().includes('vrating') ||
          el.textContent.toLowerCase().includes('performance') && el.textContent.includes('/10')
        )
      );
      
      let hasBackdropBlur = false;
      vRatingElements.forEach(element => {
        const style = window.getComputedStyle(element);
        if (style.backdropFilter && style.backdropFilter.includes('blur')) {
          hasBackdropBlur = true;
        }
      });
      
      return hasBackdropBlur;
    });
    recordResult('vRatingCard', 'Backdrop blur glass effect', backdropBlur,
      backdropBlur ? 'Backdrop blur effect found' : 'No backdrop blur detected');
    
    // Test 2: Background transparency is working correctly
    const transparency = await page.evaluate(() => {
      const vRatingElements = Array.from(document.querySelectorAll('*')).filter(el => 
        el.textContent && (
          el.textContent.toLowerCase().includes('vrating') ||
          el.textContent.toLowerCase().includes('performance') && el.textContent.includes('/10')
        )
      );
      
      let hasTransparency = false;
      vRatingElements.forEach(element => {
        const style = window.getComputedStyle(element);
        if (style.background && style.background.includes('rgba')) {
          hasTransparency = true;
        }
      });
      
      return hasTransparency;
    });
    recordResult('vRatingCard', 'Background transparency', transparency,
      transparency ? 'Background transparency working' : 'No transparency detected');
    
    // Test 3: Animated background patterns are visible
    const animatedPatterns = await page.evaluate(() => {
      const vRatingElements = Array.from(document.querySelectorAll('*')).filter(el => 
        el.textContent && (
          el.textContent.toLowerCase().includes('vrating') ||
          el.textContent.toLowerCase().includes('performance') && el.textContent.includes('/10')
        )
      );
      
      let hasAnimation = false;
      vRatingElements.forEach(element => {
        const style = window.getComputedStyle(element);
        if (style.animation && style.animation !== 'none') {
          hasAnimation = true;
        }
      });
      
      return hasAnimation;
    });
    recordResult('vRatingCard', 'Animated background patterns', animatedPatterns,
      animatedPatterns ? 'Animated patterns found' : 'No animated patterns');
    
    // Test 4: Enhanced performance gauge animations
    const gaugeAnimations = await page.evaluate(() => {
      const progressBars = document.querySelectorAll('[class*="gauge"], [class*="progress"], [class*="bar"]');
      let hasAnimatedGauge = false;
      
      progressBars.forEach(bar => {
        const style = window.getComputedStyle(bar);
        if (style.transition && style.transition.includes('width')) {
          hasAnimatedGauge = true;
        }
      });
      
      return hasAnimatedGauge;
    });
    recordResult('vRatingCard', 'Enhanced performance gauge animations', gaugeAnimations,
      gaugeAnimations ? 'Animated performance gauges found' : 'No gauge animations');
    
    // Test 5: Glow effects on hover
    await page.evaluate(() => {
      const vRatingElements = Array.from(document.querySelectorAll('*')).filter(el => 
        el.textContent && (
          el.textContent.toLowerCase().includes('vrating') ||
          el.textContent.toLowerCase().includes('performance') && el.textContent.includes('/10')
        )
      );
      if (vRatingElements.length > 0) {
        vRatingElements[0].dispatchEvent(new Event('mouseenter', { bubbles: true }));
      }
    });
    await page.waitForTimeout(500);
    
    const glowEffects = await page.evaluate(() => {
      const elementsWithGlow = document.querySelectorAll('[style*="glow"], [style*="shadow"]');
      return elementsWithGlow.length > 0;
    });
    recordResult('vRatingCard', 'Glow effects on hover', glowEffects,
      glowEffects ? 'Glow effects found' : 'No glow effects');
    
    await takeScreenshot(page, 'vRatingCard-glass', 'VRatingCard with glass morphism');
    
  } catch (error) {
    recordResult('vRatingCard', 'Component testing', false, `Error: ${error.message}`);
  }
}

// Main test execution function
async function runVisualEnhancementTests() {
  log('Starting comprehensive visual enhancement tests...', 'info');
  
  const browser = await puppeteer.launch({
    headless: false, // Set to false for visual debugging
    defaultViewport: TEST_CONFIG.viewport,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  try {
    // Set up screenshot directory
    const fs = require('fs');
    if (!fs.existsSync(TEST_CONFIG.screenshotPath)) {
      fs.mkdirSync(TEST_CONFIG.screenshotPath, { recursive: true });
    }
    
    // Enable performance monitoring
    await page.coverage.startCSSCoverage();
    
    // Run all component tests
    await testEmotionRadarEnhancements(page);
    await testPnLChartEnhancements(page);
    await testDashboardCardGlassMorphism(page);
    await testSharpeRatioGaugeGlassMorphism(page);
    await testDominantEmotionCardGlassMorphism(page);
    await testVRatingCardGlassMorphism(page);
    
    // Stop coverage monitoring
    const [cssCoverage] = await Promise.all([
      page.coverage.stopCSSCoverage()
    ]);
    
    // Calculate summary
    testResults.summary.totalPassed = 
      testResults.emotionRadar.passed +
      testResults.pnlChart.passed +
      testResults.dashboardCard.passed +
      testResults.sharpeRatioGauge.passed +
      testResults.dominantEmotionCard.passed +
      testResults.vRatingCard.passed;
    
    testResults.summary.totalFailed = 
      testResults.emotionRadar.failed +
      testResults.pnlChart.failed +
      testResults.dashboardCard.failed +
      testResults.sharpeRatioGauge.failed +
      testResults.dominantEmotionCard.failed +
      testResults.vRatingCard.failed;
    
    // Generate test report
    const reportData = {
      timestamp: new Date().toISOString(),
      testConfig: TEST_CONFIG,
      results: testResults,
      coverage: {
        css: cssCoverage.map(entry => ({
          url: entry.url,
          totalBytes: entry.text.length,
          usedBytes: entry.ranges.reduce((sum, range) => sum + (range.end - range.start), 0)
        }))
      }
    };
    
    const reportPath = path.join('./visual-enhancement-test-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
    
    log(`Test report saved to: ${reportPath}`, 'success');
    
  } catch (error) {
    log(`Test execution failed: ${error.message}`, 'error');
  } finally {
    await browser.close();
  }
}

// Generate summary report
function generateSummaryReport() {
  const totalTests = testResults.summary.totalPassed + testResults.summary.totalFailed;
  const passRate = totalTests > 0 ? ((testResults.summary.totalPassed / totalTests) * 100).toFixed(2) : 0;
  
  console.log('\n' + '='.repeat(80));
  console.log('COMPREHENSIVE VISUAL ENHANCEMENT TEST SUMMARY');
  console.log('='.repeat(80));
  console.log(`Total Tests: ${totalTests}`);
  console.log(`Passed: ${testResults.summary.totalPassed}`);
  console.log(`Failed: ${testResults.summary.totalFailed}`);
  console.log(`Pass Rate: ${passRate}%`);
  console.log(`Performance (Sidebar Transition): ${testResults.performance.sidebarTransition}ms`);
  
  console.log('\nComponent Results:');
  console.log(`- EmotionRadar: ${testResults.emotionRadar.passed}/${testResults.emotionRadar.passed + testResults.emotionRadar.failed} passed`);
  console.log(`- PnLChart: ${testResults.pnlChart.passed}/${testResults.pnlChart.passed + testResults.pnlChart.failed} passed`);
  console.log(`- DashboardCard: ${testResults.dashboardCard.passed}/${testResults.dashboardCard.passed + testResults.dashboardCard.failed} passed`);
  console.log(`- SharpeRatioGauge: ${testResults.sharpeRatioGauge.passed}/${testResults.sharpeRatioGauge.passed + testResults.sharpeRatioGauge.failed} passed`);
  console.log(`- DominantEmotionCard: ${testResults.dominantEmotionCard.passed}/${testResults.dominantEmotionCard.passed + testResults.dominantEmotionCard.failed} passed`);
  console.log(`- VRatingCard: ${testResults.vRatingCard.passed}/${testResults.vRatingCard.passed + testResults.vRatingCard.failed} passed`);
  
  if (testResults.summary.issues.length > 0) {
    console.log('\nIssues Found:');
    testResults.summary.issues.forEach((issue, index) => {
      console.log(`${index + 1}. ${issue}`);
    });
  }
  
  console.log('\nOverall Assessment:');
  if (passRate >= 90) {
    console.log('✅ EXCELLENT: All visual enhancements are working properly');
  } else if (passRate >= 75) {
    console.log('✅ GOOD: Most visual enhancements are working properly');
  } else if (passRate >= 50) {
    console.log('⚠️  FAIR: Some visual enhancements need attention');
  } else {
    console.log('❌ POOR: Many visual enhancements are not working');
  }
  
  console.log('='.repeat(80));
}

// Run tests if this file is executed directly
if (require.main === module) {
  runVisualEnhancementTests()
    .then(() => {
      generateSummaryReport();
      process.exit(0);
    })
    .catch((error) => {
      log(`Test execution failed: ${error.message}`, 'error');
      process.exit(1);
    });
}

module.exports = {
  runVisualEnhancementTests,
  testResults,
  TEST_CONFIG
};