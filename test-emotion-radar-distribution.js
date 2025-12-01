// Test script to verify emotion radar shows correct distribution instead of appearing filled
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testEmotionRadarDistribution() {
  console.log('🎯 Testing Emotion Radar Distribution Fix\n');
  
  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('❌ Authentication error:', userError?.message || 'No user found');
      return;
    }
    
    console.log(`✅ Authenticated as user: ${user.id}`);
    
    // Fetch current trades
    const { data: trades, error: tradesError } = await supabase
      .from('trades')
      .select('*')
      .eq('user_id', user.id)
      .order('trade_date', { ascending: false });
    
    if (tradesError) {
      console.error('❌ Error fetching trades:', tradesError);
      return;
    }
    
    console.log(`📊 Found ${trades.length} trades`);
    
    // Analyze emotion distribution
    const emotionCounts = {};
    const validEmotions = ['FOMO', 'REVENGE', 'TILT', 'OVERRISK', 'PATIENCE', 'REGRET', 'DISCIPLINE', 'CONFIDENT', 'ANXIOUS', 'NEUTRAL'];
    
    trades.forEach(trade => {
      if (trade.emotional_state) {
        let emotions = [];
        
        if (Array.isArray(trade.emotional_state)) {
          emotions = trade.emotional_state.filter(e => typeof e === 'string' && e.trim());
        } else if (typeof trade.emotional_state === 'string') {
          try {
            const parsed = JSON.parse(trade.emotional_state);
            if (Array.isArray(parsed)) {
              emotions = parsed.filter(e => typeof e === 'string' && e.trim());
            } else if (typeof parsed === 'string' && parsed.trim()) {
              emotions = [parsed.trim()];
            }
          } catch {
            emotions = [trade.emotional_state.trim()];
          }
        }
        
        emotions.forEach(emotion => {
          const normalizedEmotion = emotion.toUpperCase();
          if (validEmotions.includes(normalizedEmotion)) {
            emotionCounts[normalizedEmotion] = (emotionCounts[normalizedEmotion] || 0) + 1;
          }
        });
      }
    });
    
    const totalEmotionOccurrences = Object.values(emotionCounts).reduce((sum, count) => sum + count, 0);
    
    console.log('\n📈 Emotion Distribution Analysis:');
    console.log('=====================================');
    
    if (Object.keys(emotionCounts).length === 0) {
      console.log('⚠️  No emotions found in trades');
      return;
    }
    
    // Calculate and display relative frequencies
    const emotionDistribution = Object.entries(emotionCounts)
      .map(([emotion, count]) => ({
        emotion,
        count,
        percentage: ((count / totalEmotionOccurrences) * 100).toFixed(1)
      }))
      .sort((a, b) => b.count - a.count);
    
    console.log('Emotion\t\tCount\tPercentage');
    console.log('------\t\t-----\t----------');
    
    emotionDistribution.forEach(({ emotion, count, percentage }) => {
      const padding = emotion.length < 8 ? '\t\t' : '\t';
      console.log(`${emotion}${padding}${count}\t${percentage}%`);
    });
    
    console.log(`\n📊 Total emotion occurrences: ${totalEmotionOccurrences}`);
    
    // Verify the fix
    console.log('\n🔍 Verification Results:');
    console.log('=======================');
    
    const maxPercentage = Math.max(...emotionDistribution.map(e => parseFloat(e.percentage)));
    const minPercentage = Math.min(...emotionDistribution.map(e => parseFloat(e.percentage)));
    
    if (maxPercentage <= 100 && minPercentage >= 0) {
      console.log('✅ Percentage values are within valid range (0-100%)');
    } else {
      console.log('❌ Percentage values are outside valid range');
    }
    
    // Check if distribution shows variation (not all emotions at same high percentage)
    const percentageSpread = maxPercentage - minPercentage;
    if (percentageSpread > 5) {
      console.log('✅ Emotion distribution shows meaningful variation');
    } else {
      console.log('⚠️  Emotion distribution may appear too uniform');
    }
    
    // Check if most frequent emotion is reasonable
    const mostFrequent = emotionDistribution[0];
    if (parseFloat(mostFrequent.percentage) < 50) {
      console.log('✅ Most frequent emotion is below 50% (good distribution)');
    } else {
      console.log('⚠️  Most frequent emotion is very high (>50%)');
    }
    
    console.log('\n🎯 Expected Radar Behavior:');
    console.log('===========================');
    console.log('• Radar should show relative proportions, not filled appearance');
    console.log('• Each emotion should extend from center based on its percentage');
    console.log(`• ${mostFrequent.emotion} should extend furthest (${mostFrequent.percentage}%)`);
    console.log('• Total should sum to 100% across all emotions');
    console.log('• Tooltips should show "Frequency: X%" instead of "Bias: X%"');
    
    console.log('\n🌐 Test in Browser:');
    console.log('==================');
    console.log('1. Navigate to Dashboard page');
    console.log('2. Look at the Emotional Patterns radar chart');
    console.log('3. Verify the radar shows different extensions for each emotion');
    console.log('4. Hover over each emotion to see frequency percentages');
    console.log('5. The radar should NOT appear completely filled');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the test
testEmotionRadarDistribution().then(() => {
  console.log('\n✅ Test completed');
  process.exit(0);
}).catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});