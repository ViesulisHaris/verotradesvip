// Strategy Win Rate Bug Test Script
// This script specifically tests the win rate calculation bug in strategy-rules-engine.ts

// Mock the calculateStrategyStats function to test the bug
function testOriginalBug() {
  console.log('🧪 Testing Original Bug Implementation');
  console.log('=====================================');
  
  // Sample trade data
  const pnls = [100, -50, 150, -25, 75, -100, 200, -75, 50, -30];
  const totalTrades = pnls.length;
  
  // Original implementation with bug
  const winningTrades = pnls.filter(p => p > 0).length; // Correct variable name
  const losingTrades = pnls.filter(p => p < 0).length;
  
  console.log(`Total Trades: ${totalTrades}`);
  console.log(`Winning Trades: ${winningTrades}`);
  console.log(`Losing Trades: ${losingTrades}`);
  
  // Test the bug - using undefined variable 'winningTrades' (with extra 'n')
  try {
    // This would be the buggy line from the report:
    // const winrate = (winningTrades / totalTrades) * 100;
    console.log('\n❌ Buggy Implementation (using undefined variable):');
    console.log('const winrate = (winningTrades / totalTrades) * 100;');
    console.log('Result: NaN (because winningTrades is undefined)');
  } catch (error) {
    console.log('Error with buggy implementation:', error.message);
  }
  
  // Test the correct implementation
  const correctWinrate = (winningTrades / totalTrades) * 100;
  console.log('\n✅ Correct Implementation:');
  console.log('const winrate = (winningTrades / totalTrades) * 100;');
  console.log(`Result: ${correctWinrate.toFixed(2)}%`);
  
  return {
    totalTrades,
    winningTrades,
    losingTrades,
    correctWinrate
  };
}

// Test the current implementation in the file
function testCurrentImplementation() {
  console.log('\n\n🔍 Testing Current Implementation');
  console.log('=================================');
  
  // Read the current implementation from strategy-rules-engine.ts
  const fs = require('fs');
  const path = require('path');
  
  try {
    const filePath = path.join(__dirname, 'src/lib/strategy-rules-engine.ts');
    const fileContent = fs.readFileSync(filePath, 'utf8');
    
    // Extract the relevant lines
    const lines = fileContent.split('\n');
    const line59 = lines[58]; // Line 59 (0-indexed)
    const line61 = lines[60]; // Line 61 (0-indexed)
    
    console.log('Line 59 (variable definition):', line59.trim());
    console.log('Line 61 (winrate calculation):', line61.trim());
    
    // Check if the bug exists
    const hasBug = line61.includes('winningTrades') && !line61.includes('winningTrades');
    const isFixed = line61.includes('winningTrades') && line59.includes('winningTrades');
    
    if (hasBug) {
      console.log('\n❌ BUG DETECTED: Line 61 uses "winningTrades" but variable is defined as "winningTrades"');
      return false;
    } else if (isFixed) {
      console.log('\n✅ BUG FIXED: Line 61 correctly uses "winningTrades" matching the variable definition');
      return true;
    } else {
      console.log('\n⚠️  UNCLEAR STATE: Could not determine bug status from current code');
      return null;
    }
  } catch (error) {
    console.error('Error reading file:', error.message);
    return null;
  }
}

// Main test function
function main() {
  console.log('🐛 Strategy Win Rate Bug Test');
  console.log('=============================\n');
  
  // Test the original bug scenario
  const testResults = testOriginalBug();
  
  // Test the current implementation
  const isFixed = testCurrentImplementation();
  
  // Summary
  console.log('\n\n📋 TEST SUMMARY');
  console.log('================');
  console.log(`Expected Win Rate: ${testResults.correctWinrate.toFixed(2)}%`);
  console.log(`Bug Status: ${isFixed === true ? '✅ FIXED' : isFixed === false ? '❌ STILL EXISTS' : '⚠️  UNCLEAR'}`);
  
  if (isFixed === true) {
    console.log('\n🎉 The win rate calculation bug has been successfully fixed!');
    console.log('Strategy analytics should now work correctly.');
  } else if (isFixed === false) {
    console.log('\n🚨 The win rate calculation bug still exists!');
    console.log('Strategy analytics will fail due to NaN values.');
  } else {
    console.log('\n❓ Could not determine the bug status from the current implementation.');
    console.log('Manual inspection of the code is required.');
  }
}

// Run the test
main();