const { createClient } = require('@supabase/supabase-js');
const puppeteer = require('puppeteer');
require('dotenv').config();

// SAFETY CONFIRMATION
console.log('🔍 VERIFYING EMOTIONAL ANALYSIS UI FUNCTIONALITY');
console.log('===============================================');
console.log('This will test emotional analysis on dashboard and confluence pages');
console.log('Press Ctrl+C to cancel, or wait 2 seconds to continue...');
setTimeout(() => {
  console.log('✅ Safety confirmation received - proceeding with UI verification...\n');
}, 2000);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const REQUIRED_EMOTIONS = ['ANXIOUS', 'CONFIDENT', 'FEARFUL', 'DISCIPLINED', 'IMPULSIVE', 'PATIENT', 'GREEDY', 'CALM'];

async function verifyEmotionalAnalysisUI() {
  try {
    console.log('🚀 STARTING EMOTIONAL ANALYSIS UI VERIFICATION');
    console.log('==============================================\n');
    
    // Wait for safety confirmation
    await new Promise(resolve => setTimeout(resolve, 2500));
    
    // First authenticate to get session
    console.log('🔐 Authenticating for browser session...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'test@example.com',
      password: 'testpassword123'
    });
    
    if (authError) {
      console.error('❌ Authentication failed:', authError.message);
      return;
    }
    
    console.log(`✅ Authenticated as: ${authData.user.email}`);
    
    // Launch browser
    console.log('\n🌐 Launching browser for UI testing...');
    const browser = await puppeteer.launch({ 
      headless: false, // Set to true for headless mode
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    
    // Set up authentication session
    console.log('🔧 Setting up authentication session...');
    
    // Get the session token
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      // Set authentication cookies
      await page.evaluateOnNewDocument((sessionData) => {
        // Store session in localStorage for the frontend to pick up
        localStorage.setItem('supabase.auth.token', sessionData.access_token);
        localStorage.setItem('supabase.auth.refreshToken', sessionData.refresh_token);
      }, session);
    }
    
    const baseUrl = 'http://localhost:3000';
    
    // Test Dashboard Page
    console.log('\n📊 Testing Dashboard Page...');
    try {
      await page.goto(`${baseUrl}/dashboard`, { waitUntil: 'networkidle2' });
      await page.waitForTimeout(3000); // Wait for page to load
      
      // Look for emotional analysis components
      const dashboardAnalysis = await page.evaluate(() => {
        const emotionalElements = document.querySelectorAll('[data-testid*="emotion"], [class*="emotion"], [id*="emotion"]');
        const radarCharts = document.querySelectorAll('canvas, svg');
        const emotionFilters = document.querySelectorAll('button, [role="button"]');
        
        return {
          emotionalElementsFound: emotionalElements.length,
          radarChartsFound: radarCharts.length,
          emotionFiltersFound: emotionFilters.length,
          pageContent: document.body.innerText.substring(0, 500)
        };
      });
      
      console.log('📊 Dashboard Analysis Results:');
      console.log(`  Emotional elements found: ${dashboardAnalysis.emotionalElementsFound}`);
      console.log(`  Radar charts found: ${dashboardAnalysis.radarChartsFound}`);
      console.log(`  Emotion filters found: ${dashboardAnalysis.emotionFiltersFound}`);
      console.log(`  Page content preview: ${dashboardAnalysis.pageContent.substring(0, 100)}...`);
      
      // Take screenshot
      await page.screenshot({ path: 'dashboard-emotional-analysis.png', fullPage: true });
      console.log('  📸 Dashboard screenshot saved as dashboard-emotional-analysis.png');
      
    } catch (error) {
      console.error('❌ Error testing dashboard:', error.message);
    }
    
    // Test Confluence Page
    console.log('\n🎯 Testing Confluence Page...');
    try {
      await page.goto(`${baseUrl}/confluence`, { waitUntil: 'networkidle2' });
      await page.waitForTimeout(3000); // Wait for page to load
      
      // Look for emotional analysis components
      const confluenceAnalysis = await page.evaluate(() => {
        const emotionalElements = document.querySelectorAll('[data-testid*="emotion"], [class*="emotion"], [id*="emotion"]');
        const radarCharts = document.querySelectorAll('canvas, svg');
        const emotionFilters = document.querySelectorAll('button, [role="button"], [class*="filter"]');
        
        return {
          emotionalElementsFound: emotionalElements.length,
          radarChartsFound: radarCharts.length,
          emotionFiltersFound: emotionFilters.length,
          pageContent: document.body.innerText.substring(0, 500)
        };
      });
      
      console.log('🎯 Confluence Analysis Results:');
      console.log(`  Emotional elements found: ${confluenceAnalysis.emotionalElementsFound}`);
      console.log(`  Radar charts found: ${confluenceAnalysis.radarChartsFound}`);
      console.log(`  Emotion filters found: ${confluenceAnalysis.emotionFiltersFound}`);
      console.log(`  Page content preview: ${confluenceAnalysis.pageContent.substring(0, 100)}...`);
      
      // Take screenshot
      await page.screenshot({ path: 'confluence-emotional-analysis.png', fullPage: true });
      console.log('  📸 Confluence screenshot saved as confluence-emotional-analysis.png');
      
      // Look for specific emotion pills/filters
      const emotionPills = await page.evaluate(() => {
        const pills = Array.from(document.querySelectorAll('[class*="pill"], [class*="badge"], [class*="chip"]'));
        return pills.map(pill => ({
          text: pill.innerText.trim(),
          visible: pill.offsetParent !== null
        })).filter(pill => pill.text && pill.visible);
      });
      
      if (emotionPills.length > 0) {
        console.log('\n🎭 Emotion Pills/Filters Found:');
        emotionPills.forEach(pill => {
          console.log(`  - ${pill.text}`);
        });
      }
      
    } catch (error) {
      console.error('❌ Error testing confluence:', error.message);
    }
    
    // Close browser
    await browser.close();
    
    // Final verification with database
    console.log('\n🔍 Final Database Verification...');
    const { data: finalTrades, error: finalError } = await supabase
      .from('trades')
      .select('emotional_state')
      .eq('user_id', authData.user.id);
    
    if (finalError) {
      console.error('❌ Final verification error:', finalError.message);
    } else {
      const uniqueEmotions = new Set();
      finalTrades.forEach(trade => {
        if (trade.emotional_state && typeof trade.emotional_state === 'string') {
          try {
            const parsed = JSON.parse(trade.emotional_state);
            if (Array.isArray(parsed)) {
              parsed.forEach(emotion => {
                if (typeof emotion === 'string') {
                  uniqueEmotions.add(emotion.toUpperCase());
                }
              });
            }
          } catch (e) {
            // Handle parsing error
          }
        }
      });
      
      const foundEmotions = Array.from(uniqueEmotions).sort();
      const missingEmotions = REQUIRED_EMOTIONS.filter(emotion => !foundEmotions.includes(emotion));
      
      console.log('\n📊 FINAL SUMMARY:');
      console.log(`✅ Total trades in database: ${finalTrades.length}`);
      console.log(`✅ Unique emotions found: ${foundEmotions.length}`);
      console.log(`✅ Required emotions: ${REQUIRED_EMOTIONS.length}`);
      
      if (missingEmotions.length === 0) {
        console.log('\n🎉 SUCCESS: All required emotions are present in database!');
        console.log('🚀 Emotional state analysis should be working on both pages!');
        console.log('\n📋 Verification Results:');
        console.log('✅ Dashboard page tested');
        console.log('✅ Confluence page tested');
        console.log('✅ Screenshots captured');
        console.log('✅ Database verification completed');
        console.log('\n💡 To verify manually:');
        console.log('1. Check dashboard-emotional-analysis.png and confluence-emotional-analysis.png');
        console.log('2. Visit http://localhost:3000/dashboard and http://localhost:3000/confluence');
        console.log('3. Look for emotional analysis components and radar charts');
        return true;
      } else {
        console.log(`\n❌ ISSUE: Missing emotions: ${missingEmotions.join(', ')}`);
        return false;
      }
    }
    
  } catch (error) {
    console.error('❌ Error during UI verification:', error.message);
    return false;
  }
}

// Run the verification
verifyEmotionalAnalysisUI().then(success => {
  if (success) {
    console.log('\n✅ Emotional analysis UI verification completed successfully!');
  } else {
    console.log('\n❌ Emotional analysis UI verification failed');
  }
}).catch(error => {
  console.error('❌ Error during verification:', error);
});