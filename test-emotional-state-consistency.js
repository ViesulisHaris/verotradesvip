/**
 * Test script to verify emotional state dropdown consistency with radar chart data points
 * This ensures perfect mapping between dropdown selections and chart visualization
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Testing Emotional State Dropdown and Radar Chart Consistency');
console.log('=' .repeat(70));

// Read the log-trade page to extract dropdown options
const logTradePagePath = path.join(__dirname, 'src/app/log-trade/page.tsx');
const logTradeContent = fs.readFileSync(logTradePagePath, 'utf8');

// Extract emotionOptions from the log-trade page
const emotionOptionsMatch = logTradeContent.match(/const emotionOptions = (\[[\s\S]*?\]);/);
if (!emotionOptionsMatch) {
  console.error('❌ Could not find emotionOptions in log-trade page');
  process.exit(1);
}

const dropdownOptions = eval(emotionOptionsMatch[1]); // Safe since we control the content
console.log('📋 Dropdown Options in log-trade page:');
console.log(dropdownOptions.map((opt, i) => `  ${i + 1}. ${opt}`).join('\n'));

// Read the EmotionRadar component to extract valid emotions
const emotionRadarPath = path.join(__dirname, 'src/components/ui/EmotionRadar.tsx');
const emotionRadarContent = fs.readFileSync(emotionRadarPath, 'utf8');

// Extract VALID_EMOTIONS from EmotionRadar component
const validEmotionsMatch = emotionRadarContent.match(/const VALID_EMOTIONS = (\[[\s\S]*?\]);/);
if (!validEmotionsMatch) {
  console.error('❌ Could not find VALID_EMOTIONS in EmotionRadar component');
  process.exit(1);
}

const validEmotions = eval(validEmotionsMatch[1]); // Safe since we control the content
console.log('\n📊 Valid Emotions in EmotionRadar component:');
console.log(validEmotions.map((opt, i) => `  ${i + 1}. ${opt}`).join('\n'));

// Read the confluence page to extract available emotions
const confluencePagePath = path.join(__dirname, 'src/app/confluence/page.tsx');
const confluenceContent = fs.readFileSync(confluencePagePath, 'utf8');

// Extract AVAILABLE_EMOTIONS from confluence page
const availableEmotionsMatch = confluenceContent.match(/const AVAILABLE_EMOTIONS = \[[\s\S]*?\];/);
if (!availableEmotionsMatch) {
  console.error('❌ Could not find AVAILABLE_EMOTIONS in confluence page');
  process.exit(1);
}

const availableEmotions = eval(availableEmotionsMatch[0].replace('const AVAILABLE_EMOTIONS = ', '')); // Safe since we control the content
console.log('\n🎯 Available Emotions in confluence page:');
console.log(availableEmotions.map((opt, i) => `  ${i + 1}. ${opt}`).join('\n'));

// Perform consistency checks
console.log('\n🔍 Consistency Analysis:');
console.log('-'.repeat(50));

// Check if dropdown options match valid emotions exactly
const dropdownMatchesValid = 
  dropdownOptions.length === validEmotions.length &&
  dropdownOptions.every(opt => validEmotions.includes(opt));

if (dropdownMatchesValid) {
  console.log('✅ Dropdown options match EmotionRadar valid emotions exactly');
} else {
  console.log('❌ Dropdown options do NOT match EmotionRadar valid emotions');
  
  const missingInDropdown = validEmotions.filter(opt => !dropdownOptions.includes(opt));
  if (missingInDropdown.length > 0) {
    console.log(`   Missing in dropdown: ${missingInDropdown.join(', ')}`);
  }
  
  const extraInDropdown = dropdownOptions.filter(opt => !validEmotions.includes(opt));
  if (extraInDropdown.length > 0) {
    console.log(`   Extra in dropdown: ${extraInDropdown.join(', ')}`);
  }
}

// Check if dropdown options match available emotions exactly
const dropdownMatchesAvailable = 
  dropdownOptions.length === availableEmotions.length &&
  dropdownOptions.every(opt => availableEmotions.includes(opt));

if (dropdownMatchesAvailable) {
  console.log('✅ Dropdown options match confluence available emotions exactly');
} else {
  console.log('❌ Dropdown options do NOT match confluence available emotions');
}

// Check if valid emotions match available emotions exactly
const validMatchesAvailable = 
  validEmotions.length === availableEmotions.length &&
  validEmotions.every(opt => availableEmotions.includes(opt));

if (validMatchesAvailable) {
  console.log('✅ EmotionRadar valid emotions match confluence available emotions exactly');
} else {
  console.log('❌ EmotionRadar valid emotions do NOT match confluence available emotions');
}

// Final verdict
console.log('\n🎯 Final Consistency Verdict:');
if (dropdownMatchesValid && dropdownMatchesAvailable && validMatchesAvailable) {
  console.log('🎉 PERFECT CONSISTENCY ACHIEVED!');
  console.log('   - Dropdown options exactly match radar chart data points');
  console.log('   - Users can accurately track emotional patterns across trades');
  console.log('   - Perfect mapping between selections and visualization');
} else {
  console.log('⚠️  Consistency issues detected - needs attention');
}

// Test case scenarios
console.log('\n🧪 Test Case Scenarios:');
console.log('-'.repeat(50));

const testEmotions = ['FOMO', 'PATIENCE', 'NEUTRAL', 'TILT'];
testEmotions.forEach(emotion => {
  const inDropdown = dropdownOptions.includes(emotion);
  const inRadar = validEmotions.includes(emotion);
  const inConfluence = availableEmotions.includes(emotion);
  
  const status = inDropdown && inRadar && inConfluence ? '✅' : '❌';
  console.log(`${status} ${emotion}: Dropdown(${inDropdown}) | Radar(${inRadar}) | Confluence(${inConfluence})`);
});

console.log('\n📈 Emotional Tracking Impact:');
console.log('-'.repeat(50));
console.log(`Total emotional states available: ${dropdownOptions.length}`);
console.log('This enables comprehensive emotional analysis across:');
console.log('  • Fear-based emotions (FOMO, ANXIOUS)');
console.log('  • Action-based emotions (REVENGE, TILT)');
console.log('  • Control-based emotions (PATIENCE, DISCIPLINE)');
console.log('  • Risk-based emotions (OVERRISK)');
console.log('  • Reflection-based emotions (REGRET)');
console.log('  • Positive emotions (CONFIDENT)');
console.log('  • Neutral state (NEUTRAL)');

console.log('\n🎯 Implementation Complete!');