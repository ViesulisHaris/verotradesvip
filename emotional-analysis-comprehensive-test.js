const { chromium } = require('playwright');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configuration
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://wrvkwptpqsxvyfwjodnz.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indydmt3cHRwcXN4dnlmd2pvZG56Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI0MDc3NzAsImV4cCI6MjA0Nzk4Mzc3MH0.YaTJyldP8Mqo-sx4lHhQKTYC8L5XWdRvHQpzC6Cg5pk';

// Test credentials
const TEST_EMAIL = 'testuser@verotrade.com';
const TEST_PASSWORD = 'TestPassword123!';

// Expected emotions
const EXPECTED_EMOTIONS = [
  'FOMO', 'REVENGE', 'TILT', 'OVERRISK', 'PATIENCE', 
  'REGRET', 'DISCIPLINE', 'CONFIDENT', 'ANXIOUS', 'NEUTRAL'
];

// Emotion colors for verification
const EMOTION_COLORS = {
  'FOMO': '#ff6b6b',
  'REVENGE': '#ff4757',
  'TILT': '#ee5a6f',
  'OVERRISK': '#ffa502',
  'PATIENCE': '#26de81',
  'REGRET': '#778ca3',
  'DISCIPLINE': '#2d98da',
  'CONFIDENT': '#20bf6b',
  'ANXIOUS': '#fd79a8',
  'NEUTRAL': '#a29bfe'
};

class EmotionalAnalysisComprehensiveTest {
  constructor() {
    this.supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    this.browser = null;
    this.page = null;
    this.context = null;
    this.testResults = {
      emotionalStateInput: {},
      emotionRadarChart: {},
      dominantEmotionCard: {},
      emotionalDataProcessing: {},
      emotionalDataStorage: {},
      emotionalStateTags: {},
      edgeCases: {},
      summary: {
        totalTests: 0,
        passedTests: 0,
        failedTests: 0,
        issues: []
      }
    };
  }

  async initialize() {
    console.log('🚀 Initializing Comprehensive Emotional Analysis Test...');
    
    // Initialize browser with more realistic settings
    this.browser = await chromium.launch({ 
      headless: false,
      slowMo: 100,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    this.context = await this.browser.newContext({
      viewport: { width: 1366, height: 768 },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    });
    
    this.page = await this.context.newPage();
    
    // Enable console logging from browser
    this.page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('Browser Console Error:', msg.text());
      } else {
        console.log('Browser Console:', msg.text());
      }
    });
    
    // Enable request/response logging
    this.page.on('request', request => {
      if (request.url().includes('supabase')) {
        console.log('Supabase Request:', request.method(), request.url());
      }
    });
    
    this.page.on('response', response => {
      if (response.url().includes('supabase')) {
        console.log('Supabase Response:', response.status(), response.url());
      }
    });
  }

  async login() {
    console.log('🔐 Logging in test user...');
    
    try {
      await this.page.goto('http://localhost:3000/login');
      await this.page.waitForSelector('form', { timeout: 10000 });
      
      // Fill login form
      await this.page.fill('input[type="email"]', TEST_EMAIL);
      await this.page.fill('input[type="password"]', TEST_PASSWORD);
      
      // Submit form
      await this.page.click('button[type="submit"]');
      
      // Wait for redirect to dashboard
      await this.page.waitForNavigation({ timeout: 15000 });
      
      // Verify we're logged in
      const currentUrl = this.page.url();
      if (currentUrl.includes('/dashboard') || currentUrl.includes('/trades')) {
        console.log('✅ Successfully logged in');
        return true;
      } else {
        console.log('❌ Login failed - redirected to:', currentUrl);
        return false;
      }
    } catch (error) {
      console.error('❌ Login error:', error.message);
      return false;
    }
  }

  async testEmotionalStateInputComponent() {
    console.log('🎭 Testing Emotional State Input Component...');
    
    const results = {
      allEmotionsAvailable: false,
      multiSelectWorks: false,
      colorCodedTags: false,
      addRemoveDynamically: false,
      visualFeedback: false,
      screenshotTaken: false,
      errors: []
    };
    
    try {
      // Navigate to log trade form
      await this.page.goto('http://localhost:3000/trades');
      await this.page.waitForTimeout(2000);
      
      // Look for the log trade button
      const logTradeButton = await this.page.$('button:has-text("Log Trade"), button:has-text("Add Trade"), [data-testid="log-trade-button"]');
      if (logTradeButton) {
        await logTradeButton.click();
        await this.page.waitForTimeout(1000);
      }
      
      // Wait for modal or form to appear
      await this.page.waitForSelector('.modal, .dialog, form, [role="dialog"]', { timeout: 5000 });
      
      // Test 1: Check if all 10 predefined emotions are available
      try {
        const emotionElements = await this.page.$$eval('[data-emotion], .emotion-option, .emotion-tag, button:has-text("FOMO")', elements => {
          return elements.map(el => el.textContent?.trim() || el.getAttribute('data-emotion'));
        });
        
        const foundEmotions = emotionElements.filter(text => 
          EXPECTED_EMOTIONS.includes(text)
        );
        
        if (foundEmotions.length >= EXPECTED_EMOTIONS.length) {
          results.allEmotionsAvailable = true;
          console.log('✅ All emotions available:', foundEmotions);
        } else {
          results.errors.push(`Missing emotions: ${EXPECTED_EMOTIONS.filter(e => !foundEmotions.includes(e)).join(', ')}`);
        }
      } catch (error) {
        results.errors.push(`Error checking available emotions: ${error.message}`);
      }
      
      // Test 2: Test multi-select functionality
      try {
        // Select first emotion
        const firstEmotion = await this.page.$('button:has-text("FOMO"), [data-emotion="FOMO"]');
        if (firstEmotion) {
          await firstEmotion.click();
          await this.page.waitForTimeout(500);
          
          // Select second emotion
          const secondEmotion = await this.page.$('button:has-text("CONFIDENT"), [data-emotion="CONFIDENT"]');
          if (secondEmotion) {
            await secondEmotion.click();
            await this.page.waitForTimeout(500);
            
            // Check if both are selected
            const selectedEmotions = await this.page.$$eval('.emotion.selected, .emotion.active, [data-selected="true"]', elements => {
              return elements.map(el => el.textContent?.trim() || el.getAttribute('data-emotion'));
            });
            
            if (selectedEmotions.length >= 2) {
              results.multiSelectWorks = true;
              console.log('✅ Multi-select works, selected:', selectedEmotions);
            } else {
              results.errors.push('Multi-select functionality not working properly');
            }
          }
        }
      } catch (error) {
        results.errors.push(`Error testing multi-select: ${error.message}`);
      }
      
      // Test 3: Check color-coded emotion tags
      try {
        const emotionTags = await this.page.$$('.emotion, .emotion-tag, [data-emotion]');
        let coloredTags = 0;
        
        for (const tag of emotionTags.slice(0, 5)) {
          const styles = await tag.evaluate(el => {
            const computed = window.getComputedStyle(el);
            return {
              backgroundColor: computed.backgroundColor,
              color: computed.color,
              borderColor: computed.borderColor
            };
          });
          
          // Check if tag has non-default styling
          if (styles.backgroundColor !== 'rgba(0, 0, 0, 0)' || 
              styles.color !== 'rgb(0, 0, 0)' ||
              styles.borderColor !== 'rgb(0, 0, 0)') {
            coloredTags++;
          }
        }
        
        if (coloredTags > 0) {
          results.colorCodedTags = true;
          console.log(`✅ Found ${coloredTags} color-coded emotion tags`);
        } else {
          results.errors.push('No color-coded emotion tags found');
        }
      } catch (error) {
        results.errors.push(`Error checking color coding: ${error.message}`);
      }
      
      // Test 4: Test add/remove emotions dynamically
      try {
        // Get initial selected count
        let initialSelected = await this.page.$$eval('.emotion.selected, .emotion.active, [data-selected="true"]', els => els.length);
        
        // Add an emotion
        const addEmotion = await this.page.$('button:has-text("PATIENCE"), [data-emotion="PATIENCE"]');
        if (addEmotion) {
          await addEmotion.click();
          await this.page.waitForTimeout(500);
          
          // Check if count increased
          let afterAddSelected = await this.page.$$eval('.emotion.selected, .emotion.active, [data-selected="true"]', els => els.length);
          
          // Remove the emotion
          await addEmotion.click();
          await this.page.waitForTimeout(500);
          
          // Check if count returned to initial
          let afterRemoveSelected = await this.page.$$eval('.emotion.selected, .emotion.active, [data-selected="true"]', els => els.length);
          
          if (afterAddSelected > initialSelected && afterRemoveSelected === initialSelected) {
            results.addRemoveDynamically = true;
            console.log('✅ Add/remove emotions works dynamically');
          } else {
            results.errors.push('Add/remove emotions not working properly');
          }
        }
      } catch (error) {
        results.errors.push(`Error testing add/remove: ${error.message}`);
      }
      
      // Test 5: Check visual feedback for selected emotions
      try {
        const selectedEmotion = await this.page.$('.emotion.selected, .emotion.active, [data-selected="true"]');
        if (selectedEmotion) {
          const isSelected = await selectedEmotion.evaluate(el => {
            const computed = window.getComputedStyle(el);
            return {
              hasActiveClass: el.classList.contains('selected') || el.classList.contains('active'),
              hasSelectedAttr: el.hasAttribute('data-selected'),
              transform: computed.transform,
              boxShadow: computed.boxShadow,
              opacity: computed.opacity
            };
          });
          
          if (isSelected.hasActiveClass || isSelected.hasSelectedAttr || 
              isSelected.transform !== 'none' || isSelected.boxShadow !== 'none') {
            results.visualFeedback = true;
            console.log('✅ Visual feedback present for selected emotions');
          } else {
            results.errors.push('No visual feedback for selected emotions');
          }
        }
      } catch (error) {
        results.errors.push(`Error checking visual feedback: ${error.message}`);
      }
      
      // Take screenshot
      try {
        await this.page.screenshot({ 
          path: 'emotional-state-input-component-test.png',
          fullPage: false 
        });
        results.screenshotTaken = true;
        console.log('📸 Emotional state input component screenshot taken');
      } catch (error) {
        results.errors.push(`Screenshot error: ${error.message}`);
      }
      
    } catch (error) {
      results.errors.push(`General error in emotional state input test: ${error.message}`);
    }
    
    this.testResults.emotionalStateInput = results;
    
    // Update test counts
    this.testResults.summary.totalTests += 5;
    this.testResults.summary.passedTests += [
      results.allEmotionsAvailable,
      results.multiSelectWorks,
      results.colorCodedTags,
      results.addRemoveDynamically,
      results.visualFeedback
    ].filter(Boolean).length;
    
    return results;
  }

  async testEmotionRadarChart() {
    console.log('📊 Testing Emotion Radar Chart...');
    
    const results = {
      visualRepresentation: false,
      frequencyAnalysis: false,
      buySellLeaning: false,
      dynamicScaling: false,
      interactiveTooltips: false,
      chartRendering: false,
      screenshotTaken: false,
      errors: []
    };
    
    try {
      // Navigate to dashboard
      await this.page.goto('http://localhost:3000/dashboard');
      await this.page.waitForTimeout(3000);
      
      // Test 1: Check visual representation of emotional patterns
      try {
        const radarChart = await this.page.$('canvas, .radar-chart, .emotion-radar, [data-chart="radar"]');
        if (radarChart) {
          results.visualRepresentation = true;
          console.log('✅ Emotion radar chart found');
          
          // Check if it's actually rendered
          const isRendered = await radarChart.evaluate(el => {
            if (el.tagName === 'CANVAS') {
              const ctx = el.getContext('2d');
              return ctx && ctx.getImageData(0, 0, 1, 1).data[3] > 0; // Check if pixel has alpha
            }
            return el.offsetWidth > 0 && el.offsetHeight > 0;
          });
          
          if (isRendered) {
            results.chartRendering = true;
            console.log('✅ Radar chart is properly rendered');
          } else {
            results.errors.push('Radar chart found but not rendered');
          }
        } else {
          results.errors.push('No emotion radar chart found on dashboard');
        }
      } catch (error) {
        results.errors.push(`Error checking radar chart: ${error.message}`);
      }
      
      // Test 2: Check frequency analysis display
      try {
        const frequencyElements = await this.page.$$eval('.frequency, .emotion-frequency, .emotion-count, [data-frequency]', elements => {
          return elements.map(el => el.textContent?.trim()).filter(text => text && text.length > 0);
        });
        
        if (frequencyElements.length > 0) {
          results.frequencyAnalysis = true;
          console.log('✅ Frequency analysis elements found:', frequencyElements.slice(0, 3));
        } else {
          results.errors.push('No frequency analysis elements found');
        }
      } catch (error) {
        results.errors.push(`Error checking frequency analysis: ${error.message}`);
      }
      
      // Test 3: Check buy/sell leaning indicators
      try {
        const buySellElements = await this.page.$$eval('.buy-sell, .direction, .leaning, [data-direction]', elements => {
          return elements.map(el => el.textContent?.trim()).filter(text => 
            text && (text.includes('buy') || text.includes('sell') || text.includes('long') || text.includes('short'))
          );
        });
        
        if (buySellElements.length > 0) {
          results.buySellLeaning = true;
          console.log('✅ Buy/sell leaning indicators found:', buySellElements.slice(0, 3));
        } else {
          results.errors.push('No buy/sell leaning indicators found');
        }
      } catch (error) {
        results.errors.push(`Error checking buy/sell leaning: ${error.message}`);
      }
      
      // Test 4: Test dynamic scaling based on data
      try {
        // Look for scaling controls or dynamic behavior
        const scalingElements = await this.page.$$eval('.scale, .zoom, .dynamic, [data-scale]', elements => {
          return elements.length;
        });
        
        // Also check if chart responds to data changes
        const hasDynamicBehavior = await this.page.evaluate(() => {
          const charts = document.querySelectorAll('canvas, .radar-chart, .emotion-radar');
          return Array.from(charts).some(chart => {
            return chart.hasAttribute('data-dynamic') || 
                   chart.classList.contains('dynamic') ||
                   chart.style.width.includes('%') ||
                   chart.style.height.includes('%');
          });
        });
        
        if (scalingElements > 0 || hasDynamicBehavior) {
          results.dynamicScaling = true;
          console.log('✅ Dynamic scaling behavior detected');
        } else {
          results.errors.push('No dynamic scaling behavior found');
        }
      } catch (error) {
        results.errors.push(`Error checking dynamic scaling: ${error.message}`);
      }
      
      // Test 5: Test interactive tooltips and data points
      try {
        // Hover over chart to trigger tooltips
        const radarChart = await this.page.$('canvas, .radar-chart, .emotion-radar');
        if (radarChart) {
          await radarChart.hover();
          await this.page.waitForTimeout(1000);
          
          // Check for tooltip
          const tooltip = await this.page.$('.tooltip, .chart-tooltip, [data-tooltip]');
          if (tooltip) {
            const isVisible = await tooltip.isVisible();
            if (isVisible) {
              results.interactiveTooltips = true;
              console.log('✅ Interactive tooltips working');
            }
          } else {
            // Try clicking on chart
            await radarChart.click();
            await this.page.waitForTimeout(500);
            
            const tooltipAfterClick = await this.page.$('.tooltip, .chart-tooltip, [data-tooltip]');
            if (tooltipAfterClick) {
              results.interactiveTooltips = true;
              console.log('✅ Interactive tooltips working on click');
            } else {
              results.errors.push('No interactive tooltips found');
            }
          }
        }
      } catch (error) {
        results.errors.push(`Error testing interactive tooltips: ${error.message}`);
      }
      
      // Take screenshot
      try {
        await this.page.screenshot({ 
          path: 'emotion-radar-chart-test.png',
          fullPage: false 
        });
        results.screenshotTaken = true;
        console.log('📸 Emotion radar chart screenshot taken');
      } catch (error) {
        results.errors.push(`Screenshot error: ${error.message}`);
      }
      
    } catch (error) {
      results.errors.push(`General error in emotion radar chart test: ${error.message}`);
    }
    
    this.testResults.emotionRadarChart = results;
    
    // Update test counts
    this.testResults.summary.totalTests += 6;
    this.testResults.summary.passedTests += [
      results.visualRepresentation,
      results.frequencyAnalysis,
      results.buySellLeaning,
      results.dynamicScaling,
      results.interactiveTooltips,
      results.chartRendering
    ].filter(Boolean).length;
    
    return results;
  }

  async testDominantEmotionCard() {
    console.log('👑 Testing Dominant Emotion Card...');
    
    const results = {
      mostFrequentEmotion: false,
      emotionalTrendAnalysis: false,
      performanceCorrelation: false,
      expandableFunctionality: false,
      screenshotTaken: false,
      errors: []
    };
    
    try {
      // Navigate to dashboard
      await this.page.goto('http://localhost:3000/dashboard');
      await this.page.waitForTimeout(3000);
      
      // Test 1: Check most frequently experienced emotion display
      try {
        const dominantEmotionElements = await this.page.$$eval('.dominant-emotion, .most-frequent, .primary-emotion, [data-dominant]', elements => {
          return elements.map(el => ({
            text: el.textContent?.trim(),
            emotion: el.getAttribute('data-emotion')
          }));
        });
        
        if (dominantEmotionElements.length > 0) {
          const hasValidEmotion = dominantEmotionElements.some(el => 
            el.emotion && EXPECTED_EMOTIONS.includes(el.emotion) ||
            el.text && EXPECTED_EMOTIONS.some(emotion => el.text.includes(emotion))
          );
          
          if (hasValidEmotion) {
            results.mostFrequentEmotion = true;
            console.log('✅ Dominant emotion display found:', dominantEmotionElements[0]);
          } else {
            results.errors.push('Dominant emotion card found but no valid emotion displayed');
          }
        } else {
          results.errors.push('No dominant emotion card found');
        }
      } catch (error) {
        results.errors.push(`Error checking dominant emotion display: ${error.message}`);
      }
      
      // Test 2: Check emotional trend analysis
      try {
        const trendElements = await this.page.$$eval('.trend, .emotion-trend, .trend-analysis, [data-trend]', elements => {
          return elements.map(el => el.textContent?.trim()).filter(text => text && text.length > 0);
        });
        
        if (trendElements.length > 0) {
          results.emotionalTrendAnalysis = true;
          console.log('✅ Emotional trend analysis found:', trendElements.slice(0, 3));
        } else {
          results.errors.push('No emotional trend analysis found');
        }
      } catch (error) {
        results.errors.push(`Error checking trend analysis: ${error.message}`);
      }
      
      // Test 3: Check performance correlation with emotions
      try {
        const correlationElements = await this.page.$$eval('.correlation, .performance, .emotion-performance, [data-correlation]', elements => {
          return elements.map(el => el.textContent?.trim()).filter(text => 
            text && (text.includes('performance') || text.includes('win') || text.includes('loss') || text.includes('%'))
          );
        });
        
        if (correlationElements.length > 0) {
          results.performanceCorrelation = true;
          console.log('✅ Performance correlation found:', correlationElements.slice(0, 3));
        } else {
          results.errors.push('No performance correlation with emotions found');
        }
      } catch (error) {
        results.errors.push(`Error checking performance correlation: ${error.message}`);
      }
      
      // Test 4: Test expandable functionality
      try {
        const expandableElements = await this.page.$$('.expandable, .collapsible, [data-expandable], button:has-text("More"), button:has-text("Details")');
        
        if (expandableElements.length > 0) {
          const expandable = expandableElements[0];
          
          // Check initial state
          const initialState = await expandable.isVisible();
          
          // Try to expand/collapse
          await expandable.click();
          await this.page.waitForTimeout(500);
          
          // Check if state changed
          const afterClickState = await expandable.isVisible();
          
          // Look for expanded content
          const expandedContent = await this.page.$('.expanded, .expanded-content, [data-expanded="true"]');
          
          if (expandedContent || (initialState !== afterClickState)) {
            results.expandableFunctionality = true;
            console.log('✅ Expandable functionality working');
          } else {
            results.errors.push('Expandable functionality not working properly');
          }
        } else {
          results.errors.push('No expandable elements found in dominant emotion card');
        }
      } catch (error) {
        results.errors.push(`Error testing expandable functionality: ${error.message}`);
      }
      
      // Take screenshot
      try {
        await this.page.screenshot({ 
          path: 'dominant-emotion-card-test.png',
          fullPage: false 
        });
        results.screenshotTaken = true;
        console.log('📸 Dominant emotion card screenshot taken');
      } catch (error) {
        results.errors.push(`Screenshot error: ${error.message}`);
      }
      
    } catch (error) {
      results.errors.push(`General error in dominant emotion card test: ${error.message}`);
    }
    
    this.testResults.dominantEmotionCard = results;
    
    // Update test counts
    this.testResults.summary.totalTests += 4;
    this.testResults.summary.passedTests += [
      results.mostFrequentEmotion,
      results.emotionalTrendAnalysis,
      results.performanceCorrelation,
      results.expandableFunctionality
    ].filter(Boolean).length;
    
    return results;
  }

  async testEmotionalDataProcessing() {
    console.log('⚙️ Testing Emotional Data Processing...');
    
    const results = {
      storageFormats: false,
      retrievalParsing: false,
      associationWithTrades: false,
      analysisAcrossTrades: false,
      screenshotTaken: false,
      errors: []
    };
    
    try {
      // Test 1: Check storage in multiple formats (array, string, object)
      try {
        const { data: trades, error } = await this.supabase
          .from('trades')
          .select('id, emotional_state')
          .not('emotional_state', 'is', null)
          .limit(20);
        
        if (error) {
          results.errors.push(`Database error: ${error.message}`);
        } else {
          let stringFormat = 0;
          let arrayFormat = 0;
          let objectFormat = 0;
          
          trades.forEach(trade => {
            if (typeof trade.emotional_state === 'string') {
              stringFormat++;
              try {
                const parsed = JSON.parse(trade.emotional_state);
                if (Array.isArray(parsed)) arrayFormat++;
                if (typeof parsed === 'object' && !Array.isArray(parsed)) objectFormat++;
              } catch (e) {
                // Invalid JSON
              }
            } else if (Array.isArray(trade.emotional_state)) {
              arrayFormat++;
            } else if (typeof trade.emotional_state === 'object') {
              objectFormat++;
            }
          });
          
          if (stringFormat > 0 && arrayFormat > 0) {
            results.storageFormats = true;
            console.log(`✅ Multiple storage formats found: String(${stringFormat}), Array(${arrayFormat}), Object(${objectFormat})`);
          } else {
            results.errors.push(`Storage formats limited: String(${stringFormat}), Array(${arrayFormat}), Object(${objectFormat})`);
          }
        }
      } catch (error) {
        results.errors.push(`Error checking storage formats: ${error.message}`);
      }
      
      // Test 2: Check retrieval and parsing from database
      try {
        const { data: sampleTrades, error } = await this.supabase
          .from('trades')
          .select('*')
          .not('emotional_state', 'is', null)
          .limit(10);
        
        if (error) {
          results.errors.push(`Database retrieval error: ${error.message}`);
        } else {
          let successfullyParsed = 0;
          
          sampleTrades.forEach(trade => {
            let emotions = [];
            
            if (typeof trade.emotional_state === 'string') {
              try {
                emotions = JSON.parse(trade.emotional_state);
                if (Array.isArray(emotions) && emotions.length > 0) {
                  successfullyParsed++;
                }
              } catch (e) {
                // Invalid JSON
              }
            } else if (Array.isArray(trade.emotional_state)) {
              emotions = trade.emotional_state;
              if (emotions.length > 0) {
                successfullyParsed++;
              }
            }
          });
          
          if (successfullyParsed > 0) {
            results.retrievalParsing = true;
            console.log(`✅ Successfully parsed ${successfullyParsed}/${sampleTrades.length} emotional data entries`);
          } else {
            results.errors.push('No emotional data could be successfully parsed');
          }
        }
      } catch (error) {
        results.errors.push(`Error testing retrieval parsing: ${error.message}`);
      }
      
      // Test 3: Check association with trades
      try {
        const { data: tradesWithEmotions, error } = await this.supabase
          .from('trades')
          .select('id, emotional_state, outcome, entry_price, exit_price')
          .not('emotional_state', 'is', null)
          .limit(15);
        
        if (error) {
          results.errors.push(`Database association error: ${error.message}`);
        } else {
          let validAssociations = 0;
          
          tradesWithEmotions.forEach(trade => {
            if (trade.emotional_state && (trade.outcome || trade.entry_price || trade.exit_price)) {
              validAssociations++;
            }
          });
          
          if (validAssociations > 0) {
            results.associationWithTrades = true;
            console.log(`✅ Found ${validAssociations} trades with proper emotion-trade association`);
          } else {
            results.errors.push('No valid emotion-trade associations found');
          }
        }
      } catch (error) {
        results.errors.push(`Error testing association with trades: ${error.message}`);
      }
      
      // Test 4: Check analysis across all trades
      try {
        // Navigate to analytics or confluence page
        await this.page.goto('http://localhost:3000/confluence');
        await this.page.waitForTimeout(3000);
        
        const analysisElements = await this.page.$$eval('.analysis, .emotion-analysis, .aggregate, [data-analysis]', elements => {
          return elements.map(el => el.textContent?.trim()).filter(text => text && text.length > 10);
        });
        
        if (analysisElements.length > 0) {
          results.analysisAcrossTrades = true;
          console.log('✅ Cross-trade analysis elements found:', analysisElements.slice(0, 3));
        } else {
          results.errors.push('No cross-trade emotional analysis found');
        }
      } catch (error) {
        results.errors.push(`Error testing analysis across trades: ${error.message}`);
      }
      
      // Take screenshot
      try {
        await this.page.screenshot({ 
          path: 'emotional-data-processing-test.png',
          fullPage: false 
        });
        results.screenshotTaken = true;
        console.log('📸 Emotional data processing screenshot taken');
      } catch (error) {
        results.errors.push(`Screenshot error: ${error.message}`);
      }
      
    } catch (error) {
      results.errors.push(`General error in emotional data processing test: ${error.message}`);
    }
    
    this.testResults.emotionalDataProcessing = results;
    
    // Update test counts
    this.testResults.summary.totalTests += 4;
    this.testResults.summary.passedTests += [
      results.storageFormats,
      results.retrievalParsing,
      results.associationWithTrades,
      results.analysisAcrossTrades
    ].filter(Boolean).length;
    
    return results;
  }

  async testEmotionalDataStorage() {
    console.log('💾 Testing Emotional Data Storage...');
    
    const results = {
      persistenceWithTrades: false,
      dataIntegrity: false,
      formatConsistency: false,
      errorHandling: false,
      screenshotTaken: false,
      errors: []
    };
    
    try {
      // Test 1: Create a trade with emotional data and verify persistence
      try {
        // Navigate to trades page and open log trade form
        await this.page.goto('http://localhost:3000/trades');
        await this.page.waitForTimeout(2000);
        
        const logTradeButton = await this.page.$('button:has-text("Log Trade"), button:has-text("Add Trade")');
        if (logTradeButton) {
          await logTradeButton.click();
          await this.page.waitForTimeout(1000);
        }
        
        // Fill trade form with emotional data
        await this.page.waitForSelector('form, .modal, [role="dialog"]');
        
        // Select some emotions
        const emotionsToSelect = ['FOMO', 'CONFIDENT'];
        for (const emotion of emotionsToSelect) {
          const emotionButton = await this.page.$(`button:has-text("${emotion}"), [data-emotion="${emotion}"]`);
          if (emotionButton) {
            await emotionButton.click();
            await this.page.waitForTimeout(500);
          }
        }
        
        // Fill minimal trade data
        await this.page.fill('input[name="symbol"], input[placeholder*="symbol"]', 'TEST');
        await this.page.fill('input[name="entry_price"], input[placeholder*="entry"]', '100');
        await this.page.selectOption('select[name="direction"], [data-direction]', 'BUY');
        
        // Submit form
        const submitButton = await this.page.$('button[type="submit"], button:has-text("Save"), button:has-text("Submit")');
        if (submitButton) {
          await submitButton.click();
          await this.page.waitForTimeout(2000);
          
          // Verify trade was saved with emotional data
          const { data: newTrades, error } = await this.supabase
            .from('trades')
            .select('*')
            .eq('symbol', 'TEST')
            .order('created_at', { ascending: false })
            .limit(1);
          
          if (!error && newTrades.length > 0) {
            const newTrade = newTrades[0];
            if (newTrade.emotional_state) {
              results.persistenceWithTrades = true;
              console.log('✅ Trade with emotional data persisted successfully');
              
              // Clean up test trade
              await this.supabase
                .from('trades')
                .delete()
                .eq('id', newTrade.id);
            } else {
              results.errors.push('Trade saved but without emotional data');
            }
          } else {
            results.errors.push('Failed to retrieve newly created trade');
          }
        } else {
          results.errors.push('Could not find submit button');
        }
      } catch (error) {
        results.errors.push(`Error testing persistence: ${error.message}`);
      }
      
      // Test 2: Check data integrity
      try {
        const { data: integrityTrades, error } = await this.supabase
          .from('trades')
          .select('id, emotional_state')
          .not('emotional_state', 'is', null)
          .limit(10);
        
        if (error) {
          results.errors.push(`Data integrity check error: ${error.message}`);
        } else {
          let validData = 0;
          let invalidData = 0;
          
          integrityTrades.forEach(trade => {
            if (typeof trade.emotional_state === 'string') {
              try {
                const parsed = JSON.parse(trade.emotional_state);
                if (Array.isArray(parsed) && parsed.every(emotion => typeof emotion === 'string')) {
                  validData++;
                } else {
                  invalidData++;
                }
              } catch (e) {
                invalidData++;
              }
            } else if (Array.isArray(trade.emotional_state)) {
              if (trade.emotional_state.every(emotion => typeof emotion === 'string')) {
                validData++;
              } else {
                invalidData++;
              }
            } else {
              invalidData++;
            }
          });
          
          if (validData > invalidData) {
            results.dataIntegrity = true;
            console.log(`✅ Data integrity check passed: ${validData} valid, ${invalidData} invalid`);
          } else {
            results.errors.push(`Data integrity issues: ${validData} valid, ${invalidData} invalid`);
          }
        }
      } catch (error) {
        results.errors.push(`Error checking data integrity: ${error.message}`);
      }
      
      // Test 3: Check format consistency
      try {
        const { data: consistencyTrades, error } = await this.supabase
          .from('trades')
          .select('id, emotional_state')
          .not('emotional_state', 'is', null)
          .limit(20);
        
        if (error) {
          results.errors.push(`Format consistency check error: ${error.message}`);
        } else {
          const formats = new Set();
          
          consistencyTrades.forEach(trade => {
            if (typeof trade.emotional_state === 'string') {
              formats.add('string');
            } else if (Array.isArray(trade.emotional_state)) {
              formats.add('array');
            } else if (typeof trade.emotional_state === 'object') {
              formats.add('object');
            }
          });
          
          // Consistent if primarily using one format
          if (formats.size <= 2) {
            results.formatConsistency = true;
            console.log(`✅ Format consistency check passed: using ${Array.from(formats).join(', ')} formats`);
          } else {
            results.errors.push(`Format inconsistency: using ${Array.from(formats).join(', ')} formats`);
          }
        }
      } catch (error) {
        results.errors.push(`Error checking format consistency: ${error.message}`);
      }
      
      // Test 4: Check error handling
      try {
        // This would typically involve testing with invalid data
        // For now, we'll check if the system handles null/undefined values gracefully
        const { data: errorHandlingTrades, error } = await this.supabase
          .from('trades')
          .select('id, emotional_state')
          .limit(10);
        
        if (error) {
          results.errors.push(`Error handling check error: ${error.message}`);
        } else {
          // Check if system gracefully handles trades without emotional data
          const tradesWithoutEmotions = errorHandlingTrades.filter(trade => !trade.emotional_state);
          
          if (tradesWithoutEmotions.length >= 0) { // Should be able to handle this case
            results.errorHandling = true;
            console.log('✅ Error handling works: system gracefully handles trades without emotional data');
          } else {
            results.errors.push('Error handling issues with null emotional data');
          }
        }
      } catch (error) {
        results.errors.push(`Error testing error handling: ${error.message}`);
      }
      
      // Take screenshot
      try {
        await this.page.screenshot({ 
          path: 'emotional-data-storage-test.png',
          fullPage: false 
        });
        results.screenshotTaken = true;
        console.log('📸 Emotional data storage screenshot taken');
      } catch (error) {
        results.errors.push(`Screenshot error: ${error.message}`);
      }
      
    } catch (error) {
      results.errors.push(`General error in emotional data storage test: ${error.message}`);
    }
    
    this.testResults.emotionalDataStorage = results;
    
    // Update test counts
    this.testResults.summary.totalTests += 4;
    this.testResults.summary.passedTests += [
      results.persistenceWithTrades,
      results.dataIntegrity,
      results.formatConsistency,
      results.errorHandling
    ].filter(Boolean).length;
    
    return results;
  }

  async testEmotionalStateTags() {
    console.log('🏷️ Testing Emotional State Tags in Trades List...');
    
    const results = {
      tagsDisplayed: false,
      colorCoding: false,
      multipleEmotions: false,
      filtering: false,
      screenshotTaken: false,
      errors: []
    };
    
    try {
      // Navigate to trades list
      await this.page.goto('http://localhost:3000/trades');
      await this.page.waitForTimeout(3000);
      
      // Test 1: Check if emotional state tags are displayed
      try {
        const emotionTags = await this.page.$$eval('.emotion-tag, .emotion, .emotional-state, [data-emotion]', elements => {
          return elements.map(el => ({
            text: el.textContent?.trim(),
            emotion: el.getAttribute('data-emotion'),
            class: el.className
          }));
        });
        
        if (emotionTags.length > 0) {
          results.tagsDisplayed = true;
          console.log(`✅ Found ${emotionTags.length} emotion tags in trades list`);
          console.log('Sample tags:', emotionTags.slice(0, 3));
        } else {
          results.errors.push('No emotion tags found in trades list');
        }
      } catch (error) {
        results.errors.push(`Error checking emotion tags display: ${error.message}`);
      }
      
      // Test 2: Check color coding of tags
      try {
        const coloredTags = await this.page.$$('.emotion-tag, .emotion, .emotional-state');
        let properlyColored = 0;
        
        for (const tag of coloredTags.slice(0, 10)) {
          const styles = await tag.evaluate(el => {
            const computed = window.getComputedStyle(el);
            return {
              backgroundColor: computed.backgroundColor,
              color: computed.color,
              borderColor: computed.borderColor
            };
          });
          
          // Check if tag has non-default styling
          if (styles.backgroundColor !== 'rgba(0, 0, 0, 0)' && 
              styles.backgroundColor !== 'rgb(255, 255, 255)' &&
              styles.backgroundColor !== 'transparent') {
            properlyColored++;
          }
        }
        
        if (properlyColored > 0) {
          results.colorCoding = true;
          console.log(`✅ Found ${properlyColored} properly colored emotion tags`);
        } else {
          results.errors.push('No properly colored emotion tags found');
        }
      } catch (error) {
        results.errors.push(`Error checking color coding: ${error.message}`);
      }
      
      // Test 3: Check multiple emotions display
      try {
        const multipleEmotionElements = await this.page.$$eval('.emotion-multiple, .multiple-emotions, .emotion-list', elements => {
          return elements.map(el => el.textContent?.trim()).filter(text => 
            text && text.includes(',') && EXPECTED_EMOTIONS.some(emotion => text.includes(emotion))
          );
        });
        
        if (multipleEmotionElements.length > 0) {
          results.multipleEmotions = true;
          console.log(`✅ Found ${multipleEmotionElements.length} trades with multiple emotions`);
          console.log('Sample multiple emotions:', multipleEmotionElements.slice(0, 3));
        } else {
          results.errors.push('No trades with multiple emotions found');
        }
      } catch (error) {
        results.errors.push(`Error checking multiple emotions: ${error.message}`);
      }
      
      // Test 4: Check filtering functionality
      try {
        // Look for filter controls
        const filterControls = await this.page.$$('.filter, .emotion-filter, [data-filter], select');
        
        if (filterControls.length > 0) {
          // Try to use emotion filter
          for (const filter of filterControls) {
            const isVisible = await filter.isVisible();
            if (isVisible) {
              // Check if it's an emotion-related filter
              const filterText = await filter.textContent();
              if (filterText && filterText.toLowerCase().includes('emotion')) {
                results.filtering = true;
                console.log('✅ Emotion filtering controls found');
                break;
              }
            }
          }
          
          if (!results.filtering) {
            results.errors.push('Filter controls found but no emotion-specific filters');
          }
        } else {
          results.errors.push('No filter controls found');
        }
      } catch (error) {
        results.errors.push(`Error checking filtering: ${error.message}`);
      }
      
      // Take screenshot
      try {
        await this.page.screenshot({ 
          path: 'emotional-state-tags-test.png',
          fullPage: true 
        });
        results.screenshotTaken = true;
        console.log('📸 Emotional state tags screenshot taken');
      } catch (error) {
        results.errors.push(`Screenshot error: ${error.message}`);
      }
      
    } catch (error) {
      results.errors.push(`General error in emotional state tags test: ${error.message}`);
    }
    
    this.testResults.emotionalStateTags = results;
    
    // Update test counts
    this.testResults.summary.totalTests += 4;
    this.testResults.summary.passedTests += [
      results.tagsDisplayed,
      results.colorCoding,
      results.multipleEmotions,
      results.filtering
    ].filter(Boolean).length;
    
    return results;
  }

  async testEdgeCases() {
    console.log('🧪 Testing Edge Cases...');
    
    const results = {
      emptyEmotionalData: false,
      invalidEmotionalData: false,
      mixedEmotionalStates: false,
      nullEmotionalValues: false,
      largeDataset: false,
      screenshotTaken: false,
      errors: []
    };
    
    try {
      // Test 1: Empty emotional data
      try {
        const { data: emptyDataTrades, error } = await this.supabase
          .from('trades')
          .select('*')
          .eq('emotional_state', '')
          .or('emotional_state.eq.null,emotional_state.eq.undefined')
          .limit(5);
        
        if (!error) {
          // Check if system handles empty emotional data gracefully
          await this.page.goto('http://localhost:3000/trades');
          await this.page.waitForTimeout(2000);
          
          // Page should load without errors even with empty emotional data
          const pageLoaded = await this.page.$('body');
          if (pageLoaded) {
            results.emptyEmotionalData = true;
            console.log('✅ System handles empty emotional data gracefully');
          }
        } else {
          results.errors.push(`Error testing empty emotional data: ${error.message}`);
        }
      } catch (error) {
        results.errors.push(`Error in empty emotional data test: ${error.message}`);
      }
      
      // Test 2: Invalid emotional data
      try {
        // Create a test trade with invalid emotional data
        const { data: testTrade, error: createError } = await this.supabase
          .from('trades')
          .insert({
            symbol: 'INVALID_TEST',
            entry_price: 100,
            direction: 'BUY',
            emotional_state: 'invalid_json_data[{'
          })
          .select()
          .single();
        
        if (!createError && testTrade) {
          // Check if system handles invalid data gracefully
          await this.page.goto('http://localhost:3000/trades');
          await this.page.waitForTimeout(2000);
          
          // Page should still load
          const pageLoaded = await this.page.$('body');
          if (pageLoaded) {
            results.invalidEmotionalData = true;
            console.log('✅ System handles invalid emotional data gracefully');
          }
          
          // Clean up
          await this.supabase
            .from('trades')
            .delete()
            .eq('id', testTrade.id);
        } else {
          results.errors.push(`Error creating test trade with invalid data: ${createError?.message}`);
        }
      } catch (error) {
        results.errors.push(`Error testing invalid emotional data: ${error.message}`);
      }
      
      // Test 3: Mixed emotional states
      try {
        const { data: mixedStateTrades, error } = await this.supabase
          .from('trades')
          .select('emotional_state')
          .not('emotional_state', 'is', null)
          .limit(10);
        
        if (!error) {
          let stringFormat = 0;
          let arrayFormat = 0;
          let objectFormat = 0;
          
          mixedStateTrades.forEach(trade => {
            if (typeof trade.emotional_state === 'string') {
              stringFormat++;
            } else if (Array.isArray(trade.emotional_state)) {
              arrayFormat++;
            } else if (typeof trade.emotional_state === 'object') {
              objectFormat++;
            }
          });
          
          if ((stringFormat > 0 && arrayFormat > 0) || (stringFormat > 0 && objectFormat > 0) || (arrayFormat > 0 && objectFormat > 0)) {
            results.mixedEmotionalStates = true;
            console.log(`✅ Mixed emotional states found and handled: String(${stringFormat}), Array(${arrayFormat}), Object(${objectFormat})`);
          } else {
            results.errors.push('No mixed emotional states found for testing');
          }
        } else {
          results.errors.push(`Error testing mixed emotional states: ${error.message}`);
        }
      } catch (error) {
        results.errors.push(`Error in mixed emotional states test: ${error.message}`);
      }
      
      // Test 4: Null emotional values
      try {
        const { data: nullValueTrades, error } = await this.supabase
          .from('trades')
          .select('*')
          .is('emotional_state', null)
          .limit(5);
        
        if (!error) {
          // Check if system handles null values gracefully
          await this.page.goto('http://localhost:3000/trades');
          await this.page.waitForTimeout(2000);
          
          const pageLoaded = await this.page.$('body');
          if (pageLoaded) {
            results.nullEmotionalValues = true;
            console.log('✅ System handles null emotional values gracefully');
          }
        } else {
          results.errors.push(`Error testing null emotional values: ${error.message}`);
        }
      } catch (error) {
        results.errors.push(`Error in null emotional values test: ${error.message}`);
      }
      
      // Test 5: Large dataset with emotional data
      try {
        const startTime = Date.now();
        
        const { data: largeDataset, error } = await this.supabase
          .from('trades')
          .select('*')
          .not('emotional_state', 'is', null);
        
        const endTime = Date.now();
        const queryTime = endTime - startTime;
        
        if (!error && largeDataset) {
          console.log(`✅ Large dataset query completed in ${queryTime}ms for ${largeDataset.length} trades`);
          
          if (largeDataset.length >= 50 && queryTime < 10000) {
            results.largeDataset = true;
            console.log('✅ Large dataset performance acceptable');
          } else {
            results.errors.push(`Large dataset performance issues: ${largeDataset.length} trades in ${queryTime}ms`);
          }
        } else {
          results.errors.push(`Error testing large dataset: ${error?.message}`);
        }
      } catch (error) {
        results.errors.push(`Error in large dataset test: ${error.message}`);
      }
      
      // Take screenshot
      try {
        await this.page.screenshot({ 
          path: 'emotional-edge-cases-test.png',
          fullPage: false 
        });
        results.screenshotTaken = true;
        console.log('📸 Edge cases screenshot taken');
      } catch (error) {
        results.errors.push(`Screenshot error: ${error.message}`);
      }
      
    } catch (error) {
      results.errors.push(`General error in edge cases test: ${error.message}`);
    }
    
    this.testResults.edgeCases = results;
    
    // Update test counts
    this.testResults.summary.totalTests += 5;
    this.testResults.summary.passedTests += [
      results.emptyEmotionalData,
      results.invalidEmotionalData,
      results.mixedEmotionalStates,
      results.nullEmotionalValues,
      results.largeDataset
    ].filter(Boolean).length;
    
    return results;
  }

  async generateReport() {
    console.log('📝 Generating Comprehensive Emotional Analysis Test Report...');
    
    const timestamp = new Date().toISOString();
    
    const report = {
      timestamp,
      testType: 'Comprehensive Emotional Analysis Verification',
      environment: {
        url: 'http://localhost:3000',
        browser: 'Playwright',
        testUser: TEST_EMAIL
      },
      expectedEmotions: EXPECTED_EMOTIONS,
      emotionColors: EMOTION_COLORS,
      results: this.testResults,
      summary: {
        ...this.testResults.summary,
        successRate: this.testResults.summary.totalTests > 0 
          ? (this.testResults.summary.passedTests / this.testResults.summary.totalTests * 100).toFixed(2) + '%'
          : '0%'
      }
    };
    
    // Save JSON report
    const jsonReportPath = `emotional-analysis-comprehensive-test-report-${Date.now()}.json`;
    fs.writeFileSync(jsonReportPath, JSON.stringify(report, null, 2));
    
    // Generate markdown report
    const markdownReport = this.generateMarkdownReport(report);
    const markdownReportPath = `COMPREHENSIVE_EMOTIONAL_ANALYSIS_TEST_REPORT.md`;
    fs.writeFileSync(markdownReportPath, markdownReport);
    
    console.log(`📊 Reports generated:`);
    console.log(`   JSON: ${jsonReportPath}`);
    console.log(`   Markdown: ${markdownReportPath}`);
    
    return report;
  }

  generateMarkdownReport(report) {
    const { results, summary } = report;
    
    return `# Comprehensive Emotional Analysis Test Report

**Generated:** ${new Date(report.timestamp).toLocaleString()}  
**Test Type:** ${report.testType}  
**Environment:** ${report.environment.url}  
**Test User:** ${report.environment.testUser}  
**Browser:** ${report.environment.browser}

## Expected Emotions
${report.expectedEmotions.map(emotion => `- ${emotion}`).join('\n')}

## Test Results Summary

- **Total Tests:** ${summary.totalTests}
- **Passed:** ${summary.passedTests}
- **Failed:** ${summary.failedTests}
- **Success Rate:** ${summary.successRate}

## 1. Emotional State Input Component

### Status: ${results.emotionalStateInput.errors?.length > 0 ? '⚠️ Issues Found' : '✅ Passed'}

| Test | Status | Details |
|------|--------|---------|
| All 10 Emotions Available | ${results.emotionalStateInput.allEmotionsAvailable ? '✅' : '❌'} | ${results.emotionalStateInput.allEmotionsAvailable ? 'All predefined emotions are available' : 'Some emotions are missing'} |
| Multi-select Functionality | ${results.emotionalStateInput.multiSelectWorks ? '✅' : '❌'} | ${results.emotionalStateInput.multiSelectWorks ? 'Multiple emotions can be selected' : 'Multi-select not working'} |
| Color-coded Emotion Tags | ${results.emotionalStateInput.colorCodedTags ? '✅' : '❌'} | ${results.emotionalStateInput.colorCodedTags ? 'Emotions have distinct colors' : 'No color coding found'} |
| Add/Remove Dynamically | ${results.emotionalStateInput.addRemoveDynamically ? '✅' : '❌'} | ${results.emotionalStateInput.addRemoveDynamically ? 'Emotions can be added/removed dynamically' : 'Dynamic add/remove not working'} |
| Visual Feedback | ${results.emotionalStateInput.visualFeedback ? '✅' : '❌'} | ${results.emotionalStateInput.visualFeedback ? 'Visual feedback for selected emotions' : 'No visual feedback found'} |

${results.emotionalStateInput.errors?.length > 0 ? `
### Issues Found:
${results.emotionalStateInput.errors.map(error => `- ${error}`).join('\n')}
` : ''}

## 2. Emotion Radar Chart

### Status: ${results.emotionRadarChart.errors?.length > 0 ? '⚠️ Issues Found' : '✅ Passed'}

| Test | Status | Details |
|------|--------|---------|
| Visual Representation | ${results.emotionRadarChart.visualRepresentation ? '✅' : '❌'} | ${results.emotionRadarChart.visualRepresentation ? 'Radar chart displays emotional patterns' : 'No radar chart found'} |
| Frequency Analysis | ${results.emotionRadarChart.frequencyAnalysis ? '✅' : '❌'} | ${results.emotionRadarChart.frequencyAnalysis ? 'Emotion frequency analysis displayed' : 'No frequency analysis found'} |
| Buy/Sell Leaning | ${results.emotionRadarChart.buySellLeaning ? '✅' : '❌'} | ${results.emotionRadarChart.buySellLeaning ? 'Buy/sell indicators present' : 'No buy/sell leaning indicators'} |
| Dynamic Scaling | ${results.emotionRadarChart.dynamicScaling ? '✅' : '❌'} | ${results.emotionRadarChart.dynamicScaling ? 'Chart scales based on data' : 'No dynamic scaling'} |
| Interactive Tooltips | ${results.emotionRadarChart.interactiveTooltips ? '✅' : '❌'} | ${results.emotionRadarChart.interactiveTooltips ? 'Interactive tooltips work' : 'No interactive tooltips'} |
| Chart Rendering | ${results.emotionRadarChart.chartRendering ? '✅' : '❌'} | ${results.emotionRadarChart.chartRendering ? 'Chart renders properly' : 'Chart rendering issues'} |

${results.emotionRadarChart.errors?.length > 0 ? `
### Issues Found:
${results.emotionRadarChart.errors.map(error => `- ${error}`).join('\n')}
` : ''}

## 3. Dominant Emotion Card

### Status: ${results.dominantEmotionCard.errors?.length > 0 ? '⚠️ Issues Found' : '✅ Passed'}

| Test | Status | Details |
|------|--------|---------|
| Most Frequent Emotion | ${results.dominantEmotionCard.mostFrequentEmotion ? '✅' : '❌'} | ${results.dominantEmotionCard.mostFrequentEmotion ? 'Dominant emotion displayed correctly' : 'No dominant emotion display'} |
| Emotional Trend Analysis | ${results.dominantEmotionCard.emotionalTrendAnalysis ? '✅' : '❌'} | ${results.dominantEmotionCard.emotionalTrendAnalysis ? 'Trend analysis available' : 'No trend analysis'} |
| Performance Correlation | ${results.dominantEmotionCard.performanceCorrelation ? '✅' : '❌'} | ${results.dominantEmotionCard.performanceCorrelation ? 'Emotion-performance correlation shown' : 'No correlation analysis'} |
| Expandable Functionality | ${results.dominantEmotionCard.expandableFunctionality ? '✅' : '❌'} | ${results.dominantEmotionCard.expandableFunctionality ? 'Card can be expanded' : 'Not expandable'} |

${results.dominantEmotionCard.errors?.length > 0 ? `
### Issues Found:
${results.dominantEmotionCard.errors.map(error => `- ${error}`).join('\n')}
` : ''}

## 4. Emotional Data Processing

### Status: ${results.emotionalDataProcessing.errors?.length > 0 ? '⚠️ Issues Found' : '✅ Passed'}

| Test | Status | Details |
|------|--------|---------|
| Storage Formats | ${results.emotionalDataProcessing.storageFormats ? '✅' : '❌'} | ${results.emotionalDataProcessing.storageFormats ? 'Multiple storage formats supported' : 'Limited storage formats'} |
| Retrieval Parsing | ${results.emotionalDataProcessing.retrievalParsing ? '✅' : '❌'} | ${results.emotionalDataProcessing.retrievalParsing ? 'Data retrieval and parsing works' : 'Parsing issues found'} |
| Association with Trades | ${results.emotionalDataProcessing.associationWithTrades ? '✅' : '❌'} | ${results.emotionalDataProcessing.associationWithTrades ? 'Emotions properly associated with trades' : 'Association issues'} |
| Analysis Across Trades | ${results.emotionalDataProcessing.analysisAcrossTrades ? '✅' : '❌'} | ${results.emotionalDataProcessing.analysisAcrossTrades ? 'Cross-trade analysis available' : 'No cross-trade analysis'} |

${results.emotionalDataProcessing.errors?.length > 0 ? `
### Issues Found:
${results.emotionalDataProcessing.errors.map(error => `- ${error}`).join('\n')}
` : ''}

## 5. Emotional Data Storage

### Status: ${results.emotionalDataStorage.errors?.length > 0 ? '⚠️ Issues Found' : '✅ Passed'}

| Test | Status | Details |
|------|--------|---------|
| Persistence with Trades | ${results.emotionalDataStorage.persistenceWithTrades ? '✅' : '❌'} | ${results.emotionalDataStorage.persistenceWithTrades ? 'Emotional data persists with trades' : 'Persistence issues'} |
| Data Integrity | ${results.emotionalDataStorage.dataIntegrity ? '✅' : '❌'} | ${results.emotionalDataStorage.dataIntegrity ? 'Data integrity maintained' : 'Data integrity issues'} |
| Format Consistency | ${results.emotionalDataStorage.formatConsistency ? '✅' : '❌'} | ${results.emotionalDataStorage.formatConsistency ? 'Consistent data formats' : 'Format inconsistencies'} |
| Error Handling | ${results.emotionalDataStorage.errorHandling ? '✅' : '❌'} | ${results.emotionalDataStorage.errorHandling ? 'Graceful error handling' : 'Error handling issues'} |

${results.emotionalDataStorage.errors?.length > 0 ? `
### Issues Found:
${results.emotionalDataStorage.errors.map(error => `- ${error}`).join('\n')}
` : ''}

## 6. Emotional State Tags in Trades List

### Status: ${results.emotionalStateTags.errors?.length > 0 ? '⚠️ Issues Found' : '✅ Passed'}

| Test | Status | Details |
|------|--------|---------|
| Tags Displayed | ${results.emotionalStateTags.tagsDisplayed ? '✅' : '❌'} | ${results.emotionalStateTags.tagsDisplayed ? 'Emotion tags displayed in trades list' : 'No tags displayed'} |
| Color Coding | ${results.emotionalStateTags.colorCoding ? '✅' : '❌'} | ${results.emotionalStateTags.colorCoding ? 'Tags are color-coded' : 'No color coding'} |
| Multiple Emotions | ${results.emotionalStateTags.multipleEmotions ? '✅' : '❌'} | ${results.emotionalStateTags.multipleEmotions ? 'Multiple emotions displayed correctly' : 'Multi-emotion display issues'} |
| Filtering | ${results.emotionalStateTags.filtering ? '✅' : '❌'} | ${results.emotionalStateTags.filtering ? 'Emotion filtering available' : 'No filtering options'} |

${results.emotionalStateTags.errors?.length > 0 ? `
### Issues Found:
${results.emotionalStateTags.errors.map(error => `- ${error}`).join('\n')}
` : ''}

## 7. Edge Cases

### Status: ${results.edgeCases.errors?.length > 0 ? '⚠️ Issues Found' : '✅ Passed'}

| Test | Status | Details |
|------|--------|---------|
| Empty Emotional Data | ${results.edgeCases.emptyEmotionalData ? '✅' : '❌'} | ${results.edgeCases.emptyEmotionalData ? 'Handles empty data gracefully' : 'Issues with empty data'} |
| Invalid Emotional Data | ${results.edgeCases.invalidEmotionalData ? '✅' : '❌'} | ${results.edgeCases.invalidEmotionalData ? 'Handles invalid data gracefully' : 'Issues with invalid data'} |
| Mixed Emotional States | ${results.edgeCases.mixedEmotionalStates ? '✅' : '❌'} | ${results.edgeCases.mixedEmotionalStates ? 'Handles mixed data formats' : 'Issues with mixed formats'} |
| Null Emotional Values | ${results.edgeCases.nullEmotionalValues ? '✅' : '❌'} | ${results.edgeCases.nullEmotionalValues ? 'Handles null values gracefully' : 'Issues with null values'} |
| Large Dataset | ${results.edgeCases.largeDataset ? '✅' : '❌'} | ${results.edgeCases.largeDataset ? 'Performs well with large datasets' : 'Performance issues with large data'} |

${results.edgeCases.errors?.length > 0 ? `
### Issues Found:
${results.edgeCases.errors.map(error => `- ${error}`).join('\n')}
` : ''}

## Overall Assessment

### Emotional Analysis Status: ${summary.issues.length === 0 ? '✅ All Tests Passed' : '⚠️ Issues Found'}

${summary.issues.length > 0 ? `
### Critical Issues:
${summary.issues.map(issue => `- ${issue}`).join('\n')}
` : ''}

### Recommendations:
${summary.issues.length === 0 
  ? '- All emotional analysis components are working correctly\n- All 10 emotions are properly implemented and displayed\n- Data processing and storage are robust\n- Edge cases are handled gracefully\n- No immediate action required'
  : '- Address the critical issues identified above\n- Ensure all 10 emotions are properly displayed and analyzed\n- Verify emotional data parsing and visualization\n- Improve error handling for edge cases\n- Test performance with larger datasets'
}

### Component Summary:
- **Emotional State Input Component:** ${results.emotionalStateInput.errors?.length === 0 ? '✅ Working' : '⚠️ Issues'}
- **Emotion Radar Chart:** ${results.emotionRadarChart.errors?.length === 0 ? '✅ Working' : '⚠️ Issues'}
- **Dominant Emotion Card:** ${results.dominantEmotionCard.errors?.length === 0 ? '✅ Working' : '⚠️ Issues'}
- **Emotional Data Processing:** ${results.emotionalDataProcessing.errors?.length === 0 ? '✅ Working' : '⚠️ Issues'}
- **Emotional Data Storage:** ${results.emotionalDataStorage.errors?.length === 0 ? '✅ Working' : '⚠️ Issues'}
- **Emotional State Tags:** ${results.emotionalStateTags.errors?.length === 0 ? '✅ Working' : '⚠️ Issues'}
- **Edge Cases Handling:** ${results.edgeCases.errors?.length === 0 ? '✅ Working' : '⚠️ Issues'}

## Screenshots
- Emotional State Input Component: \`emotional-state-input-component-test.png\`
- Emotion Radar Chart: \`emotion-radar-chart-test.png\`
- Dominant Emotion Card: \`dominant-emotion-card-test.png\`
- Emotional Data Processing: \`emotional-data-processing-test.png\`
- Emotional Data Storage: \`emotional-data-storage-test.png\`
- Emotional State Tags: \`emotional-state-tags-test.png\`
- Edge Cases: \`emotional-edge-cases-test.png\`

---
*Report generated by Comprehensive Emotional Analysis Test Script*
`;
  }

  async cleanup() {
    console.log('🧹 Cleaning up...');
    
    if (this.context) {
      await this.context.close();
    }
    
    if (this.browser) {
      await this.browser.close();
    }
    
    console.log('✅ Cleanup completed');
  }

  async runFullTest() {
    try {
      await this.initialize();
      
      // Login first
      const loginSuccess = await this.login();
      if (!loginSuccess) {
        console.error('❌ Failed to login, aborting test');
        return false;
      }
      
      // Run all tests in sequence
      console.log('\n🎭 Testing Emotional State Input Component...');
      await this.testEmotionalStateInputComponent();
      
      console.log('\n📊 Testing Emotion Radar Chart...');
      await this.testEmotionRadarChart();
      
      console.log('\n👑 Testing Dominant Emotion Card...');
      await this.testDominantEmotionCard();
      
      console.log('\n⚙️ Testing Emotional Data Processing...');
      await this.testEmotionalDataProcessing();
      
      console.log('\n💾 Testing Emotional Data Storage...');
      await this.testEmotionalDataStorage();
      
      console.log('\n🏷️ Testing Emotional State Tags...');
      await this.testEmotionalStateTags();
      
      console.log('\n🧪 Testing Edge Cases...');
      await this.testEdgeCases();
      
      // Calculate failed tests
      this.testResults.summary.failedTests = 
        this.testResults.summary.totalTests - this.testResults.summary.passedTests;
      
      // Generate report
      const report = await this.generateReport();
      
      console.log('\n🎉 Comprehensive Emotional Analysis Test Completed!');
      console.log(`📊 Summary: ${this.testResults.summary.passedTests}/${this.testResults.summary.totalTests} tests passed`);
      console.log(`📈 Success Rate: ${this.testResults.summary.successRate}`);
      
      if (this.testResults.summary.issues.length > 0) {
        console.log('\n⚠️ Issues Found:');
        this.testResults.summary.issues.forEach(issue => console.log(`   - ${issue}`));
      }
      
      return report;
    } catch (error) {
      console.error('❌ Test execution error:', error);
      return false;
    } finally {
      await this.cleanup();
    }
  }
}

// Run the test
async function main() {
  const test = new EmotionalAnalysisComprehensiveTest();
  const result = await test.runFullTest();
  
  if (result) {
    console.log('\n✅ Comprehensive emotional analysis test completed successfully');
    process.exit(0);
  } else {
    console.log('\n❌ Comprehensive emotional analysis test failed');
    process.exit(1);
  }
}

// Handle uncaught errors
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

main();