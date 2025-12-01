const http = require('http');

// Simple check for emotional graph on dashboard
async function checkEmotionalGraph() {
  console.log('🔍 Checking emotional graph on dashboard...\n');
  
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/dashboard',
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    };
    
    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log('✅ Dashboard page loaded successfully');
        
        // Check for emotional graph related content
        const hasEmotionRadar = data.includes('EmotionRadar');
        const hasEmotionalPatterns = data.includes('Emotional Patterns');
        const hasBrainIcon = data.includes('Brain className');
        const hasErrorBoundary = data.includes('ErrorBoundary');
        const hasRadarChart = data.includes('recharts-radar');
        
        console.log('\n🔍 Content Analysis:');
        console.log(`  - EmotionRadar component: ${hasEmotionRadar ? '✅' : '❌'}`);
        console.log(`  - Emotional Patterns section: ${hasEmotionalPatterns ? '✅' : '❌'}`);
        console.log(`  - Brain icon: ${hasBrainIcon ? '✅' : '❌'}`);
        console.log(`  - Error boundary: ${hasErrorBoundary ? '✅' : '❌'}`);
        console.log(`  - Radar chart: ${hasRadarChart ? '✅' : '❌'}`);
        
        // Check for error messages
        const hasNoDataMessage = data.includes('No emotional data available');
        const hasErrorMessage = data.includes('Unable to load emotional patterns');
        const hasChartError = data.includes('Chart rendering error');
        
        if (hasNoDataMessage) {
          console.log('\n❌ Found "No emotional data available" message');
        }
        
        if (hasErrorMessage) {
          console.log('\n❌ Found "Unable to load emotional patterns" message');
        }
        
        if (hasChartError) {
          console.log('\n❌ Found "Chart rendering error" message');
        }
        
        // Check for emotion data processing
        const hasEmotionData = data.includes('emotionData');
        const hasGetEmotionData = data.includes('getEmotionData');
        const hasEmotionProcessing = data.includes('DASHBOARD EMOTION');
        
        console.log('\n🔍 Data Processing Analysis:');
        console.log(`  - emotionData variable: ${hasEmotionData ? '✅' : '❌'}`);
        console.log(`  - getEmotionData function: ${hasGetEmotionData ? '✅' : '❌'}`);
        console.log(`  - Emotion processing logs: ${hasEmotionProcessing ? '✅' : '❌'}`);
        
        // Overall assessment
        const isEmotionalGraphPresent = hasEmotionRadar && hasEmotionalPatterns && hasBrainIcon;
        const hasErrors = hasNoDataMessage || hasErrorMessage || hasChartError;
        
        console.log('\n📊 Overall Assessment:');
        
        if (isEmotionalGraphPresent && !hasErrors) {
          console.log('✅ Emotional graph appears to be properly included in the dashboard');
          console.log('✅ No error messages detected');
          console.log('✅ Component structure looks correct');
          resolve({ success: true, hasData: true, hasErrors: false });
        } else if (isEmotionalGraphPresent && hasErrors) {
          console.log('⚠️ Emotional graph is included but showing error messages');
          console.log('⚠️ This suggests the component is rendering but data processing is failing');
          resolve({ success: false, hasData: false, hasErrors: true });
        } else if (!isEmotionalGraphPresent) {
          console.log('❌ Emotional graph component is not included in the dashboard');
          resolve({ success: false, hasData: false, hasErrors: false });
        } else {
          console.log('❓ Unknown state - please investigate further');
          resolve({ success: false, hasData: false, hasErrors: false });
        }
      });
    });
    
    req.on('error', (err) => {
      console.error('❌ Request error:', err.message);
      reject(err);
    });
    
    req.end();
  });
}

// Main execution
async function main() {
  try {
    const result = await checkEmotionalGraph();
    
    console.log('\n' + '='.repeat(50));
    console.log('FINAL RESULT:');
    
    if (result.success) {
      console.log('✅ SUCCESS: Emotional graph is properly implemented');
      console.log('✅ The issue might be related to data availability or browser rendering');
    } else {
      console.log('❌ ISSUE FOUND: Emotional graph has problems');
      
      if (result.hasErrors) {
        console.log('🔧 RECOMMENDATION: Check emotion data processing logic');
        console.log('🔧 RECOMMENDATION: Verify trade data has emotional_state values');
      } else {
        console.log('🔧 RECOMMENDATION: Check if EmotionRadar component is properly imported');
      }
    }
    
    console.log('='.repeat(50));
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

main();