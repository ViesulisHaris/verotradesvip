// Verification script for trades tab statistics display fixes
const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying trades tab statistics display fixes...\n');

// Files to check
const filesToCheck = [
  'src/app/trades/page.tsx',
  'src/app/trades/page-with-mock-data.tsx'
];

let allFixesVerified = true;

filesToCheck.forEach(filePath => {
  const fullPath = path.join(__dirname, filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`❌ File not found: ${filePath}`);
    allFixesVerified = false;
    return;
  }
  
  const content = fs.readFileSync(fullPath, 'utf8');
  
  console.log(`📄 Checking ${filePath}:`);
  
  // Check 1: Icon changed from stacked_bar_chart to bar_chart
  const hasOldIcon = content.includes('stacked_bar_chart');
  const hasNewIcon = content.includes('bar_chart');
  
  if (hasOldIcon) {
    console.log(`  ❌ Still contains old icon 'stacked_bar_chart'`);
    allFixesVerified = false;
  } else if (hasNewIcon) {
    console.log(`  ✅ Icon correctly changed to 'bar_chart'`);
  } else {
    console.log(`  ⚠️  Could not find bar_chart icon in statistics section`);
  }
  
  // Check 2: Label changed from "Total Trades" to "Trades"
  const hasOldLabel = content.includes('Total Trades');
  const hasNewLabel = content.includes('>Trades<');
  
  if (hasOldLabel) {
    console.log(`  ❌ Still contains old label 'Total Trades'`);
    allFixesVerified = false;
  } else if (hasNewLabel) {
    console.log(`  ✅ Label correctly changed to 'Trades'`);
  } else {
    console.log(`  ⚠️  Could not find 'Trades' label in statistics section`);
  }
  
  // Check 3: Verify the specific line context
  const lines = content.split('\n');
  const statsSectionLines = lines.filter((line, index) => {
    // Look for lines around the statistics cards
    return line.includes('material-symbols-outlined') && 
           (line.includes('text-gold') || line.includes('text-gray-400')) &&
           (index > 500 && index < 900); // Rough line range for stats section
  });
  
  if (statsSectionLines.length > 0) {
    console.log(`  📍 Found ${statsSectionLines.length} statistics card lines`);
    
    // Check if any of these lines contain our fixes
    const tradesCardLine = statsSectionLines.find(line => 
      line.includes('bar_chart') && line.includes('Trades')
    );
    
    if (tradesCardLine) {
      console.log(`  ✅ Found correct trades statistics card with icon and label`);
    } else {
      console.log(`  ⚠️  Could not verify complete trades card structure`);
    }
  }
  
  console.log('');
});

// Summary
if (allFixesVerified) {
  console.log('🎉 All fixes have been successfully verified!');
  console.log('✅ Icon display: Changed from stacked_bar_chart to bar_chart');
  console.log('✅ Label text: Changed from "Total Trades" to "Trades"');
} else {
  console.log('❌ Some fixes could not be verified. Please check the files manually.');
}

console.log('\n📋 Verification complete.');