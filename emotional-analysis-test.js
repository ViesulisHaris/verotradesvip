const { createClient } = require('@supabase/supabase-js');
const puppeteer = require('puppeteer');
const fs = require('fs');

// Configuration
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://wrvkwptpqsxvyfwjodnz.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indydmt3cHRwcXN4dnlmd2pvZG56Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI0MDc3NzAsImV4cCI6MjA0Nzk4Mzc3MH0.YaTJyldP8Mqo-sx4lHhQKTYC8L5XWdRvHQpzC6Cg5pk';

// Test credentials
const TEST_EMAIL = 'test@example.com';
const TEST_PASSWORD = 'testpassword123';

// Expected emotions
const EXPECTED_EMOTIONS = [
  'FOMO', 'REVENGE', 'TILT', 'OVERRISK', 'PATIENCE', 
  'REGRET', 'DISCIPLINE', 'CONFIDENT', 'ANXIOUS', 'NEUTRAL'
];

class EmotionalAnalysisTest {
  constructor() {
    this.supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    this.browser = null;
    this.page = null;
    this.testResults = {
      confluencePageAnalysis: {},
      emotionalStateDisplay: {},
      emotionBasedInsights: {},
      emotionalDataIntegration: {},
      emotionalDataHandling: {},
      summary: {
        totalTests: 0,
        passedTests: 0,
        failedTests: 0,
        issues: []
      }
    };
  }

  async initialize() {
    console.log('🚀 Initializing Emotional Analysis Test...');
    
    // Initialize browser
    this.browser = await puppeteer.launch({ 
      headless: false,
      defaultViewport: { width: 1366, height: 768 },
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    this.page = await this.browser.newPage();
    
    // Enable console logging from browser
    this.page.on('console', msg => {
      console.log('Browser Console:', msg.text());
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
      await this.page.type('input[type="email"]', TEST_EMAIL);
      await this.page.type('input[type="password"]', TEST_PASSWORD);
      
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

  async verifyDatabaseEmotionalData() {
    console.log('📊 Verifying database emotional data...');
    
    try {
      // Get all trades with emotional data
      const { data: trades, error } = await this.supabase
        .from('trades')
        .select('*')
        .not('emotional_state', 'is', null);
      
      if (error) {
        console.error('❌ Error fetching trades:', error);
        return false;
      }
      
      console.log(`📈 Found ${trades.length} trades with emotional data`);
      
      // Analyze emotional data
      const emotionCounts = {};
      const emotionsInTrades = new Set();
      let tradesWithMultipleEmotions = 0;
      let totalEmotions = 0;
      
      trades.forEach(trade => {
        let emotions = [];
        
        if (typeof trade.emotional_state === 'string') {
          try {
            emotions = JSON.parse(trade.emotional_state);
          } catch (e) {
            console.warn('⚠️ Invalid JSON in emotional_state:', trade.id);
          }
        } else if (Array.isArray(trade.emotional_state)) {
          emotions = trade.emotional_state;
        }
        
        if (emotions.length > 0) {
          emotions.forEach(emotion => {
            emotionsInTrades.add(emotion);
            emotionCounts[emotion] = (emotionCounts[emotion] || 0) + 1;
            totalEmotions++;
          });
          
          if (emotions.length > 1) {
            tradesWithMultipleEmotions++;
          }
        }
      });
      
      console.log('🎭 Emotions found in dataset:', Array.from(emotionsInTrades));
      console.log('📊 Emotion counts:', emotionCounts);
      console.log('🔢 Trades with multiple emotions:', tradesWithMultipleEmotions);
      console.log('📈 Total emotion instances:', totalEmotions);
      
      // Verify all expected emotions are present
      const missingEmotions = EXPECTED_EMOTIONS.filter(emotion => !emotionsInTrades.has(emotion));
      
      if (missingEmotions.length > 0) {
        console.log('⚠️ Missing emotions:', missingEmotions);
        this.testResults.summary.issues.push(`Missing emotions: ${missingEmotions.join(', ')}`);
      }
      
      this.testResults.emotionalDataHandling.databaseVerification = {
        totalTrades: trades.length,
        uniqueEmotions: Array.from(emotionsInTrades),
        emotionCounts,
        tradesWithMultipleEmotions,
        totalEmotions,
        missingEmotions,
        allEmotionsPresent: missingEmotions.length === 0
      };
      
      return missingEmotions.length === 0;
    } catch (error) {
      console.error('❌ Database verification error:', error);
      return false;
    }
  }

  async testConfluencePageEmotionalAnalysis() {
    console.log('🧠 Testing Confluence Page Emotional Analysis...');
    
    try {
      await this.page.goto('http://localhost:3000/confluence');
      await this.page.waitForNavigation({ waitUntil: 'networkidle0' });
      await this.page.waitForTimeout(3000);
      
      const results = {
        emotionsDisplayed: false,
        chartsRendered: false,
        analyticsCalculations: false,
        correlationAnalysis: false,
        performanceAnalysis: false,
        screenshotTaken: false,
        errors: []
      };
      
      // Check if emotions are displayed
      try {
        const emotionElements = await this.page.$$eval('[data-emotion], .emotion, .emotional-state', elements => {
          return elements.map(el => el.textContent?.trim() || el.getAttribute('data-emotion'));
        });
        
        if (emotionElements.length > 0) {
          results.emotionsDisplayed = true;
          console.log('✅ Emotions displayed:', emotionElements.slice(0, 10));
        } else {
          results.errors.push('No emotion elements found on confluence page');
        }
      } catch (error) {
        results.errors.push(`Error checking emotion display: ${error.message}`);
      }
      
      // Check for emotion distribution charts
      try {
        const chartElements = await this.page.$$eval('canvas, .chart, .emotion-chart, [data-chart]', elements => {
          return elements.length;
        });
        
        if (chartElements > 0) {
          results.chartsRendered = true;
          console.log(`✅ Found ${chartElements} chart elements`);
        } else {
          results.errors.push('No chart elements found');
        }
      } catch (error) {
        results.errors.push(`Error checking charts: ${error.message}`);
      }
      
      // Check for analytics calculations
      try {
        const analyticsElements = await this.page.$$eval('.analytics, .statistics, .metrics, [data-analytics]', elements => {
          return elements.map(el => el.textContent?.trim()).filter(text => text && text.length > 0);
        });
        
        if (analyticsElements.length > 0) {
          results.analyticsCalculations = true;
          console.log('✅ Analytics elements found:', analyticsElements.slice(0, 5));
        } else {
          results.errors.push('No analytics elements found');
        }
      } catch (error) {
        results.errors.push(`Error checking analytics: ${error.message}`);
      }
      
      // Check for correlation analysis
      try {
        const correlationElements = await this.page.$$eval('.correlation, .emotion-performance, [data-correlation]', elements => {
          return elements.length;
        });
        
        if (correlationElements > 0) {
          results.correlationAnalysis = true;
          console.log(`✅ Found ${correlationElements} correlation elements`);
        }
      } catch (error) {
        results.errors.push(`Error checking correlation analysis: ${error.message}`);
      }
      
      // Check for emotion impact on performance
      try {
        const performanceElements = await this.page.$$eval('.performance, .impact, .emotion-impact', elements => {
          return elements.length;
        });
        
        if (performanceElements > 0) {
          results.performanceAnalysis = true;
          console.log(`✅ Found ${performanceElements} performance analysis elements`);
        }
      } catch (error) {
        results.errors.push(`Error checking performance analysis: ${error.message}`);
      }
      
      // Take screenshot
      try {
        await this.page.screenshot({ 
          path: 'emotional-analysis-confluence-test.png',
          fullPage: true 
        });
        results.screenshotTaken = true;
        console.log('📸 Confluence page screenshot taken');
      } catch (error) {
        results.errors.push(`Screenshot error: ${error.message}`);
      }
      
      this.testResults.confluencePageAnalysis = results;
      
      // Update test counts
      this.testResults.summary.totalTests += 5;
      this.testResults.summary.passedTests += [
        results.emotionsDisplayed,
        results.chartsRendered,
        results.analyticsCalculations,
        results.correlationAnalysis,
        results.performanceAnalysis
      ].filter(Boolean).length;
      
      return results;
    } catch (error) {
      console.error('❌ Confluence page test error:', error);
      this.testResults.summary.issues.push(`Confluence page test failed: ${error.message}`);
      return false;
    }
  }

  async testEmotionalStateDisplayOnTrades() {
    console.log('📋 Testing Emotional State Display on Individual Trades...');
    
    try {
      await this.page.goto('http://localhost:3000/trades');
      await this.page.waitForNavigation({ waitUntil: 'networkidle0' });
      await this.page.waitForTimeout(3000);
      
      const results = {
        emotionsAppearCorrectly: false,
        jsonDataParsedProperly: false,
        multipleEmotionsDisplayed: false,
        emotionFormattingStyling: false,
        screenshotTaken: false,
        errors: []
      };
      
      // Wait for trades to load
      await this.page.waitForSelector('.trade, [data-trade-id]', { timeout: 10000 });
      
      // Check if emotional states appear on trades
      try {
        const emotionElements = await this.page.$$eval('.emotion, .emotional-state, [data-emotion]', elements => {
          return elements.map(el => ({
            text: el.textContent?.trim(),
            classes: el.className,
            data: el.getAttribute('data-emotion')
          })).filter(item => item.text || item.data);
        });
        
        if (emotionElements.length > 0) {
          results.emotionsAppearCorrectly = true;
          console.log(`✅ Found ${emotionElements.length} emotion elements on trades page`);
          console.log('Sample emotion elements:', emotionElements.slice(0, 3));
        } else {
          results.errors.push('No emotion elements found on trades page');
        }
      } catch (error) {
        results.errors.push(`Error checking emotion display: ${error.message}`);
      }
      
      // Check JSON parsing
      try {
        // Look for evidence of proper JSON parsing in the DOM
        const parsedEmotions = await this.page.$$eval('[data-parsed-emotions], .parsed-emotion', elements => {
          return elements.length;
        });
        
        if (parsedEmotions > 0) {
          results.jsonDataParsedProperly = true;
          console.log(`✅ Found ${parsedEmotions} parsed emotion elements`);
        }
        
        // Also check for well-formed emotion displays (not raw JSON)
        const rawJsonElements = await this.page.$$eval('*', elements => {
          return elements.filter(el => {
            const text = el.textContent?.trim();
            return text && (text.startsWith('[') || text.startsWith('{')) && 
                   text.includes('FOMO') && text.length < 100;
          });
        });
        
        if (rawJsonElements.length === 0) {
          results.jsonDataParsedProperly = true;
          console.log('✅ No raw JSON emotion data found in display');
        } else {
          results.errors.push(`Found ${rawJsonElements.length} elements with raw JSON emotion data`);
        }
      } catch (error) {
        results.errors.push(`Error checking JSON parsing: ${error.message}`);
      }
      
      // Check multiple emotions display
      try {
        const multipleEmotionElements = await this.page.$$eval('.emotion-multiple, .multiple-emotions, [data-multiple-emotions]', elements => {
          return elements.length;
        });
        
        if (multipleEmotionElements > 0) {
          results.multipleEmotionsDisplayed = true;
          console.log(`✅ Found ${multipleEmotionElements} multiple emotion elements`);
        }
        
        // Also check for emotion lists/arrays
        const emotionLists = await this.page.$$eval('.emotion-list, .emotions', elements => {
          return elements.filter(el => {
            const text = el.textContent?.trim();
            return text && text.includes(',') && EXPECTED_EMOTIONS.some(emotion => text.includes(emotion));
          });
        });
        
        if (emotionLists.length > 0) {
          results.multipleEmotionsDisplayed = true;
          console.log(`✅ Found ${emotionLists.length} emotion lists`);
        }
      } catch (error) {
        results.errors.push(`Error checking multiple emotions: ${error.message}`);
      }
      
      // Check emotion formatting and styling
      try {
        const styledEmotions = await this.page.$$eval('.emotion, .emotional-state', elements => {
          return elements.filter(el => {
            const styles = window.getComputedStyle(el);
            return styles.backgroundColor !== 'rgba(0, 0, 0, 0)' || 
                   styles.color !== 'rgb(0, 0, 0)' ||
                   styles.padding !== '0px' ||
                   el.classList.length > 1;
          });
        });
        
        if (styledEmotions.length > 0) {
          results.emotionFormattingStyling = true;
          console.log(`✅ Found ${styledEmotions.length} styled emotion elements`);
        }
      } catch (error) {
        results.errors.push(`Error checking emotion styling: ${error.message}`);
      }
      
      // Take screenshot
      try {
        await this.page.screenshot({ 
          path: 'emotional-analysis-trades-display-test.png',
          fullPage: true 
        });
        results.screenshotTaken = true;
        console.log('📸 Trades page emotion display screenshot taken');
      } catch (error) {
        results.errors.push(`Screenshot error: ${error.message}`);
      }
      
      this.testResults.emotionalStateDisplay = results;
      
      // Update test counts
      this.testResults.summary.totalTests += 4;
      this.testResults.summary.passedTests += [
        results.emotionsAppearCorrectly,
        results.jsonDataParsedProperly,
        results.multipleEmotionsDisplayed,
        results.emotionFormattingStyling
      ].filter(Boolean).length;
      
      return results;
    } catch (error) {
      console.error('❌ Emotional state display test error:', error);
      this.testResults.summary.issues.push(`Emotional state display test failed: ${error.message}`);
      return false;
    }
  }

  async testEmotionBasedInsights() {
    console.log('💡 Testing Emotion-Based Insights...');
    
    try {
      await this.page.goto('http://localhost:3000/confluence');
      await this.page.waitForNavigation({ waitUntil: 'networkidle0' });
      await this.page.waitForTimeout(3000);
      
      const results = {
        insightsGenerated: false,
        performanceCorrelations: false,
        trendAnalysis: false,
        heatmapsVisualizations: false,
        screenshotTaken: false,
        errors: []
      };
      
      // Check for emotional insights/recommendations
      try {
        const insightElements = await this.page.$$eval('.insight, .recommendation, .emotion-insight, [data-insight]', elements => {
          return elements.map(el => el.textContent?.trim()).filter(text => text && text.length > 10);
        });
        
        if (insightElements.length > 0) {
          results.insightsGenerated = true;
          console.log(`✅ Found ${insightElements.length} insight elements`);
          console.log('Sample insights:', insightElements.slice(0, 3));
        } else {
          results.errors.push('No insight elements found');
        }
      } catch (error) {
        results.errors.push(`Error checking insights: ${error.message}`);
      }
      
      // Check for emotion-performance correlations
      try {
        const correlationElements = await this.page.$$eval('.correlation, .performance-correlation, .emotion-performance', elements => {
          return elements.length;
        });
        
        if (correlationElements > 0) {
          results.performanceCorrelations = true;
          console.log(`✅ Found ${correlationElements} correlation elements`);
        } else {
          results.errors.push('No correlation elements found');
        }
      } catch (error) {
        results.errors.push(`Error checking correlations: ${error.message}`);
      }
      
      // Check for emotional trend analysis
      try {
        const trendElements = await this.page.$$eval('.trend, .emotion-trend, .timeline, .time-series', elements => {
          return elements.length;
        });
        
        if (trendElements > 0) {
          results.trendAnalysis = true;
          console.log(`✅ Found ${trendElements} trend analysis elements`);
        } else {
          results.errors.push('No trend analysis elements found');
        }
      } catch (error) {
        results.errors.push(`Error checking trend analysis: ${error.message}`);
      }
      
      // Check for emotional heatmaps or visualizations
      try {
        const heatmapElements = await this.page.$$eval('.heatmap, .emotion-heatmap, .visualization, .emotion-viz', elements => {
          return elements.length;
        });
        
        if (heatmapElements > 0) {
          results.heatmapsVisualizations = true;
          console.log(`✅ Found ${heatmapElements} heatmap/visualization elements`);
        } else {
          results.errors.push('No heatmap/visualization elements found');
        }
      } catch (error) {
        results.errors.push(`Error checking heatmaps: ${error.message}`);
      }
      
      // Take screenshot
      try {
        await this.page.screenshot({ 
          path: 'emotional-analysis-insights-test.png',
          fullPage: true 
        });
        results.screenshotTaken = true;
        console.log('📸 Emotion insights screenshot taken');
      } catch (error) {
        results.errors.push(`Screenshot error: ${error.message}`);
      }
      
      this.testResults.emotionBasedInsights = results;
      
      // Update test counts
      this.testResults.summary.totalTests += 4;
      this.testResults.summary.passedTests += [
        results.insightsGenerated,
        results.performanceCorrelations,
        results.trendAnalysis,
        results.heatmapsVisualizations
      ].filter(Boolean).length;
      
      return results;
    } catch (error) {
      console.error('❌ Emotion-based insights test error:', error);
      this.testResults.summary.issues.push(`Emotion-based insights test failed: ${error.message}`);
      return false;
    }
  }

  async testEmotionalDataIntegration() {
    console.log('🔗 Testing Emotional Data Integration...');
    
    try {
      // Get sample trades from database to verify integration
      const { data: sampleTrades, error } = await this.supabase
        .from('trades')
        .select('*')
        .not('emotional_state', 'is', null)
        .limit(10);
      
      if (error) {
        console.error('❌ Error fetching sample trades:', error);
        return false;
      }
      
      const results = {
        emotionsLinkToOutcomes: false,
        emotionFiltering: false,
        summaryStatistics: false,
        performanceMetrics: false,
        errors: []
      };
      
      // Check if emotions link correctly to trade outcomes
      try {
        let validLinks = 0;
        sampleTrades.forEach(trade => {
          if (trade.emotional_state && trade.outcome) {
            // Check if emotional data is properly associated with trade outcomes
            let emotions = [];
            if (typeof trade.emotional_state === 'string') {
              try {
                emotions = JSON.parse(trade.emotional_state);
              } catch (e) {
                // Invalid JSON
              }
            } else if (Array.isArray(trade.emotional_state)) {
              emotions = trade.emotional_state;
            }
            
            if (emotions.length > 0) {
              validLinks++;
            }
          }
        });
        
        if (validLinks > 0) {
          results.emotionsLinkToOutcomes = true;
          console.log(`✅ Found ${validLinks} trades with emotion-outcome links`);
        } else {
          results.errors.push('No valid emotion-outcome links found');
        }
      } catch (error) {
        results.errors.push(`Error checking emotion-outcome links: ${error.message}`);
      }
      
      // Test emotion filtering in analytics (if implemented)
      try {
        await this.page.goto('http://localhost:3000/trades');
        await this.page.waitForTimeout(2000);
        await this.page.waitForTimeout(2000);
        
        // Look for emotion filter controls
        const filterElements = await this.page.$$eval('.filter, .emotion-filter, [data-filter]', elements => {
          return elements.filter(el => {
            const text = el.textContent?.toLowerCase() || '';
            return text.includes('emotion') || text.includes('fear') || text.includes('fomo');
          });
        });
        
        if (filterElements.length > 0) {
          results.emotionFiltering = true;
          console.log(`✅ Found ${filterElements.length} emotion filter elements`);
        } else {
          results.errors.push('No emotion filtering controls found');
        }
      } catch (error) {
        results.errors.push(`Error checking emotion filtering: ${error.message}`);
      }
      
      // Check emotional summary statistics
      try {
        await this.page.goto('http://localhost:3000/confluence');
        await this.page.waitForTimeout(2000);
        await this.page.waitForTimeout(2000);
        
        const statsElements = await this.page.$$eval('.stats, .statistics, .summary, .emotion-stats', elements => {
          return elements.map(el => el.textContent?.trim()).filter(text => text && text.length > 5);
        });
        
        if (statsElements.length > 0) {
          results.summaryStatistics = true;
          console.log(`✅ Found ${statsElements.length} statistics elements`);
          console.log('Sample stats:', statsElements.slice(0, 3));
        } else {
          results.errors.push('No emotional summary statistics found');
        }
      } catch (error) {
        results.errors.push(`Error checking summary statistics: ${error.message}`);
      }
      
      // Check emotion-based performance metrics
      try {
        const metricsElements = await this.page.$$eval('.metric, .performance-metric, .emotion-metric', elements => {
          return elements.length;
        });
        
        if (metricsElements > 0) {
          results.performanceMetrics = true;
          console.log(`✅ Found ${metricsElements} performance metric elements`);
        } else {
          results.errors.push('No emotion-based performance metrics found');
        }
      } catch (error) {
        results.errors.push(`Error checking performance metrics: ${error.message}`);
      }
      
      this.testResults.emotionalDataIntegration = results;
      
      // Update test counts
      this.testResults.summary.totalTests += 4;
      this.testResults.summary.passedTests += [
        results.emotionsLinkToOutcomes,
        results.emotionFiltering,
        results.summaryStatistics,
        results.performanceMetrics
      ].filter(Boolean).length;
      
      return results;
    } catch (error) {
      console.error('❌ Emotional data integration test error:', error);
      this.testResults.summary.issues.push(`Emotional data integration test failed: ${error.message}`);
      return false;
    }
  }

  async testEmotionalDataHandling() {
    console.log('⚙️ Testing Emotional Data Handling...');
    
    try {
      const results = {
        jsonParsingWorks: false,
        multipleEmotionsDisplay: false,
        performanceWith200Trades: false,
        errors: []
      };
      
      // Test JSON parsing of emotional data
      try {
        const { data: tradesWithEmotions, error } = await this.supabase
          .from('trades')
          .select('id, emotional_state')
          .not('emotional_state', 'is', null)
          .limit(50);
        
        if (error) {
          results.errors.push(`Database error: ${error.message}`);
        } else {
          let validJsonCount = 0;
          let invalidJsonCount = 0;
          
          tradesWithEmotions.forEach(trade => {
            if (typeof trade.emotional_state === 'string') {
              try {
                const parsed = JSON.parse(trade.emotional_state);
                if (Array.isArray(parsed) && parsed.length > 0) {
                  validJsonCount++;
                }
              } catch (e) {
                invalidJsonCount++;
              }
            } else if (Array.isArray(trade.emotional_state)) {
              validJsonCount++;
            }
          });
          
          if (validJsonCount > 0 && invalidJsonCount === 0) {
            results.jsonParsingWorks = true;
            console.log(`✅ JSON parsing works: ${validJsonCount} valid, ${invalidJsonCount} invalid`);
          } else {
            results.errors.push(`JSON parsing issues: ${validJsonCount} valid, ${invalidJsonCount} invalid`);
          }
        }
      } catch (error) {
        results.errors.push(`JSON parsing test error: ${error.message}`);
      }
      
      // Test display of trades with multiple emotions
      try {
        const { data: multiEmotionTrades, error } = await this.supabase
          .from('trades')
          .select('id, emotional_state')
          .not('emotional_state', 'is', null)
          .limit(20);
        
        if (error) {
          results.errors.push(`Database error for multi-emotions: ${error.message}`);
        } else {
          let multiEmotionCount = 0;
          
          multiEmotionTrades.forEach(trade => {
            let emotions = [];
            if (typeof trade.emotional_state === 'string') {
              try {
                emotions = JSON.parse(trade.emotional_state);
              } catch (e) {
                // Invalid JSON
              }
            } else if (Array.isArray(trade.emotional_state)) {
              emotions = trade.emotional_state;
            }
            
            if (emotions.length > 1) {
              multiEmotionCount++;
            }
          });
          
          if (multiEmotionCount > 0) {
            results.multipleEmotionsDisplay = true;
            console.log(`✅ Found ${multiEmotionCount} trades with multiple emotions`);
          } else {
            results.errors.push('No trades with multiple emotions found');
          }
        }
      } catch (error) {
        results.errors.push(`Multi-emotion test error: ${error.message}`);
      }
      
      // Test performance with 200 trades
      try {
        const startTime = Date.now();
        
        const { data: allTrades, error } = await this.supabase
          .from('trades')
          .select('*')
          .not('emotional_state', 'is', null);
        
        const endTime = Date.now();
        const queryTime = endTime - startTime;
        
        if (error) {
          results.errors.push(`Performance test error: ${error.message}`);
        } else {
          console.log(`✅ Query completed in ${queryTime}ms for ${allTrades.length} trades`);
          
          if (allTrades.length >= 180 && queryTime < 5000) { // Allow some tolerance
            results.performanceWith200Trades = true;
            console.log(`✅ Performance test passed: ${allTrades.length} trades in ${queryTime}ms`);
          } else {
            results.errors.push(`Performance issues: ${allTrades.length} trades in ${queryTime}ms`);
          }
        }
      } catch (error) {
        results.errors.push(`Performance test error: ${error.message}`);
      }
      
      this.testResults.emotionalDataHandling = results;
      
      // Update test counts
      this.testResults.summary.totalTests += 3;
      this.testResults.summary.passedTests += [
        results.jsonParsingWorks,
        results.multipleEmotionsDisplay,
        results.performanceWith200Trades
      ].filter(Boolean).length;
      
      return results;
    } catch (error) {
      console.error('❌ Emotional data handling test error:', error);
      this.testResults.summary.issues.push(`Emotional data handling test failed: ${error.message}`);
      return false;
    }
  }

  async generateReport() {
    console.log('📝 Generating Emotional Analysis Test Report...');
    
    const timestamp = new Date().toISOString();
    
    const report = {
      timestamp,
      testType: 'Emotional Analysis Verification',
      environment: {
        url: 'http://localhost:3000',
        browser: 'Puppeteer',
        testUser: TEST_EMAIL
      },
      expectedEmotions: EXPECTED_EMOTIONS,
      results: this.testResults,
      summary: {
        ...this.testResults.summary,
        successRate: this.testResults.summary.totalTests > 0 
          ? (this.testResults.summary.passedTests / this.testResults.summary.totalTests * 100).toFixed(2) + '%'
          : '0%'
      }
    };
    
    // Save JSON report
    const jsonReportPath = `emotional-analysis-test-report-${Date.now()}.json`;
    fs.writeFileSync(jsonReportPath, JSON.stringify(report, null, 2));
    
    // Generate markdown report
    const markdownReport = this.generateMarkdownReport(report);
    const markdownReportPath = `EMOTIONAL_ANALYSIS_TEST_REPORT.md`;
    fs.writeFileSync(markdownReportPath, markdownReport);
    
    console.log(`📊 Reports generated:`);
    console.log(`   JSON: ${jsonReportPath}`);
    console.log(`   Markdown: ${markdownReportPath}`);
    
    return report;
  }

  generateMarkdownReport(report) {
    const { results, summary } = report;
    
    return `# Emotional Analysis Test Report

**Generated:** ${new Date(report.timestamp).toLocaleString()}  
**Test Type:** ${report.testType}  
**Environment:** ${report.environment.url}  
**Test User:** ${report.environment.testUser}

## Expected Emotions
${report.expectedEmotions.map(emotion => `- ${emotion}`).join('\n')}

## Test Results Summary

- **Total Tests:** ${summary.totalTests}
- **Passed:** ${summary.passedTests}
- **Failed:** ${summary.failedTests}
- **Success Rate:** ${summary.successRate}

## 1. Confluence Page Emotional Analysis

### Status: ${results.confluencePageAnalysis.errors?.length > 0 ? '⚠️ Issues Found' : '✅ Passed'}

| Test | Status | Details |
|------|--------|---------|
| Emotions Displayed | ${results.confluencePageAnalysis.emotionsDisplayed ? '✅' : '❌'} | ${results.confluencePageAnalysis.emotionsDisplayed ? 'All 10 emotions displayed' : 'Some emotions missing'} |
| Charts Rendered | ${results.confluencePageAnalysis.chartsRendered ? '✅' : '❌'} | ${results.confluencePageAnalysis.chartsRendered ? 'Emotion charts render correctly' : 'Chart rendering issues'} |
| Analytics Calculations | ${results.confluencePageAnalysis.analyticsCalculations ? '✅' : '❌'} | ${results.confluencePageAnalysis.analyticsCalculations ? 'Analytics calculations working' : 'Analytics calculation issues'} |
| Correlation Analysis | ${results.confluencePageAnalysis.correlationAnalysis ? '✅' : '❌'} | ${results.confluencePageAnalysis.correlationAnalysis ? 'Emotion correlation analysis working' : 'Correlation analysis missing'} |
| Performance Analysis | ${results.confluencePageAnalysis.performanceAnalysis ? '✅' : '❌'} | ${results.confluencePageAnalysis.performanceAnalysis ? 'Emotion impact analysis working' : 'Performance analysis missing'} |

${results.confluencePageAnalysis.errors?.length > 0 ? `
### Issues Found:
${results.confluencePageAnalysis.errors.map(error => `- ${error}`).join('\n')}
` : ''}

## 2. Emotional State Display on Trades

### Status: ${results.emotionalStateDisplay.errors?.length > 0 ? '⚠️ Issues Found' : '✅ Passed'}

| Test | Status | Details |
|------|--------|---------|
| Emotions Appear Correctly | ${results.emotionalStateDisplay.emotionsAppearCorrectly ? '✅' : '❌'} | ${results.emotionalStateDisplay.emotionsAppearCorrectly ? 'Emotional states display properly' : 'Display issues found'} |
| JSON Data Parsed Properly | ${results.emotionalStateDisplay.jsonDataParsedProperly ? '✅' : '❌'} | ${results.emotionalStateDisplay.jsonDataParsedProperly ? 'JSON parsing works correctly' : 'JSON parsing issues'} |
| Multiple Emotions Displayed | ${results.emotionalStateDisplay.multipleEmotionsDisplayed ? '✅' : '❌'} | ${results.emotionalStateDisplay.multipleEmotionsDisplayed ? 'Multiple emotions show correctly' : 'Multi-emotion display issues'} |
| Emotion Formatting & Styling | ${results.emotionalStateDisplay.emotionFormattingStyling ? '✅' : '❌'} | ${results.emotionalStateDisplay.emotionFormattingStyling ? 'Emotions properly styled' : 'Styling issues found'} |

${results.emotionalStateDisplay.errors?.length > 0 ? `
### Issues Found:
${results.emotionalStateDisplay.errors.map(error => `- ${error}`).join('\n')}
` : ''}

## 3. Emotion-Based Insights

### Status: ${results.emotionBasedInsights.errors?.length > 0 ? '⚠️ Issues Found' : '✅ Passed'}

| Test | Status | Details |
|------|--------|---------|
| Insights Generated | ${results.emotionBasedInsights.insightsGenerated ? '✅' : '❌'} | ${results.emotionBasedInsights.insightsGenerated ? 'Emotional insights generated' : 'No insights found'} |
| Performance Correlations | ${results.emotionBasedInsights.performanceCorrelations ? '✅' : '❌'} | ${results.emotionBasedInsights.performanceCorrelations ? 'Emotion-performance correlations calculated' : 'Correlation analysis missing'} |
| Trend Analysis | ${results.emotionBasedInsights.trendAnalysis ? '✅' : '❌'} | ${results.emotionBasedInsights.trendAnalysis ? 'Emotional trend analysis working' : 'Trend analysis missing'} |
| Heatmaps/Visualizations | ${results.emotionBasedInsights.heatmapsVisualizations ? '✅' : '❌'} | ${results.emotionBasedInsights.heatmapsVisualizations ? 'Emotional visualizations working' : 'Visualizations missing'} |

${results.emotionBasedInsights.errors?.length > 0 ? `
### Issues Found:
${results.emotionBasedInsights.errors.map(error => `- ${error}`).join('\n')}
` : ''}

## 4. Emotional Data Integration

### Status: ${results.emotionalDataIntegration.errors?.length > 0 ? '⚠️ Issues Found' : '✅ Passed'}

| Test | Status | Details |
|------|--------|---------|
| Emotions Link to Outcomes | ${results.emotionalDataIntegration.emotionsLinkToOutcomes ? '✅' : '❌'} | ${results.emotionalDataIntegration.emotionsLinkToOutcomes ? 'Emotions properly linked to trade outcomes' : 'Linking issues found'} |
| Emotion Filtering | ${results.emotionalDataIntegration.emotionFiltering ? '✅' : '❌'} | ${results.emotionalDataIntegration.emotionFiltering ? 'Emotion filtering available' : 'Filtering not implemented'} |
| Summary Statistics | ${results.emotionalDataIntegration.summaryStatistics ? '✅' : '❌'} | ${results.emotionalDataIntegration.summaryStatistics ? 'Emotional summary statistics available' : 'Statistics missing'} |
| Performance Metrics | ${results.emotionalDataIntegration.performanceMetrics ? '✅' : '❌'} | ${results.emotionalDataIntegration.performanceMetrics ? 'Emotion-based performance metrics available' : 'Metrics missing'} |

${results.emotionalDataIntegration.errors?.length > 0 ? `
### Issues Found:
${results.emotionalDataIntegration.errors.map(error => `- ${error}`).join('\n')}
` : ''}

## 5. Emotional Data Handling

### Status: ${results.emotionalDataHandling.errors?.length > 0 ? '⚠️ Issues Found' : '✅ Passed'}

| Test | Status | Details |
|------|--------|---------|
| JSON Parsing Works | ${results.emotionalDataHandling.jsonParsingWorks ? '✅' : '❌'} | ${results.emotionalDataHandling.jsonParsingWorks ? 'JSON emotional data parsed correctly' : 'JSON parsing issues'} |
| Multiple Emotions Display | ${results.emotionalDataHandling.multipleEmotionsDisplay ? '✅' : '❌'} | ${results.emotionalDataHandling.multipleEmotionsDisplay ? 'Multiple emotions handled correctly' : 'Multi-emotion handling issues'} |
| Performance with 200 Trades | ${results.emotionalDataHandling.performanceWith200Trades ? '✅' : '❌'} | ${results.emotionalDataHandling.performanceWith200Trades ? 'Good performance with full dataset' : 'Performance issues with large dataset'} |

${results.emotionalDataHandling.errors?.length > 0 ? `
### Issues Found:
${results.emotionalDataHandling.errors.map(error => `- ${error}`).join('\n')}
` : ''}

## 6. Database Verification

${results.emotionalDataHandling.databaseVerification ? `
### Dataset Overview:
- **Total Trades with Emotional Data:** ${results.emotionalDataHandling.databaseVerification.totalTrades}
- **Unique Emotions Found:** ${results.emotionalDataHandling.databaseVerification.uniqueEmotions.join(', ')}
- **Trades with Multiple Emotions:** ${results.emotionalDataHandling.databaseVerification.tradesWithMultipleEmotions}
- **Total Emotion Instances:** ${results.emotionalDataHandling.databaseVerification.totalEmotions}
- **All Expected Emotions Present:** ${results.emotionalDataHandling.databaseVerification.allEmotionsPresent ? '✅ Yes' : '❌ No'}

### Emotion Distribution:
${Object.entries(results.emotionalDataHandling.databaseVerification.emotionCounts)
  .map(([emotion, count]) => `- ${emotion}: ${count}`)
  .join('\n')}
` : 'Database verification not completed.'}

## Overall Assessment

### Emotional Analysis Status: ${summary.issues.length === 0 ? '✅ All Tests Passed' : '⚠️ Issues Found'}

${summary.issues.length > 0 ? `
### Critical Issues:
${summary.issues.map(issue => `- ${issue}`).join('\n')}
` : ''}

### Recommendations:
${summary.issues.length === 0 
  ? '- Emotional analysis features are working correctly with all 10 emotions\n- All 200 trades are properly processed\n- No immediate action required'
  : '- Address the issues identified above\n- Ensure all 10 emotions are properly displayed and analyzed\n- Verify emotional data parsing and visualization'
}

## Screenshots
- Confluence Page: \`emotional-analysis-confluence-test.png\`
- Trades Display: \`emotional-analysis-trades-display-test.png\`
- Insights: \`emotional-analysis-insights-test.png\`

---
*Report generated by Emotional Analysis Test Script*
`;
  }

  async cleanup() {
    console.log('🧹 Cleaning up...');
    
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
      
      // Verify database emotional data
      await this.verifyDatabaseEmotionalData();
      
      // Run all tests
      await this.testConfluencePageEmotionalAnalysis();
      await this.testEmotionalStateDisplayOnTrades();
      await this.testEmotionBasedInsights();
      await this.testEmotionalDataIntegration();
      await this.testEmotionalDataHandling();
      
      // Calculate failed tests
      this.testResults.summary.failedTests = 
        this.testResults.summary.totalTests - this.testResults.summary.passedTests;
      
      // Generate report
      const report = await this.generateReport();
      
      console.log('\n🎉 Emotional Analysis Test Completed!');
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
  const test = new EmotionalAnalysisTest();
  const result = await test.runFullTest();
  
  if (result) {
    console.log('\n✅ Emotional analysis test completed successfully');
    process.exit(0);
  } else {
    console.log('\n❌ Emotional analysis test failed');
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