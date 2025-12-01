const fs = require('fs');
const path = require('path');

function findQuoteIssue() {
  console.log('Analyzing VERIFICATION.sql for quote issues...');
  
  try {
    const sqlFilePath = path.join(__dirname, 'VERIFICATION.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Count total quotes
    const singleQuoteCount = (sqlContent.match(/'/g) || []).length;
    console.log(`📊 Total single quotes: ${singleQuoteCount}`);
    
    if (singleQuoteCount % 2 !== 0) {
      console.log('⚠️  Odd number of single quotes detected - there might be an unmatched quote');
    } else {
      console.log('✅ Even number of single quotes detected');
    }
    
    // Look for specific patterns that might cause issues
    const issues = [];
    
    // Check for lines with single quotes that might be problematic
    const lines = sqlContent.split('\n');
    let lineNum = 0;
    
    for (const line of lines) {
      lineNum++;
      
      // Count quotes on this line
      const lineQuoteCount = (line.match(/'/g) || []).length;
      
      // If odd number of quotes on a line that's not a comment, it might be an issue
      if (lineQuoteCount % 2 !== 0 && !line.trim().startsWith('--')) {
        // Check if it's a string that spans multiple lines
        const trimmed = line.trim();
        if (trimmed.startsWith("RAISE NOTICE '") && !trimmed.endsWith("';")) {
          issues.push({
            type: 'Possible multi-line RAISE NOTICE',
            line: lineNum,
            content: line.trim()
          });
        } else if (trimmed.includes("VALUES ('") && !trimmed.endsWith("');")) {
          issues.push({
            type: 'Possible multi-line VALUES statement',
            line: lineNum,
            content: line.trim()
          });
        } else if (trimmed.includes("'") && !trimmed.endsWith("';") && !trimmed.endsWith("',")) {
          issues.push({
            type: 'Possible unmatched quote',
            line: lineNum,
            content: line.trim()
          });
        }
      }
    }
    
    // Check for specific problematic patterns
    if (sqlContent.includes("can't")) {
      issues.push({
        type: 'Unescaped apostrophe in string',
        line: 'Multiple',
        content: "Found \"can't\" which should be escaped as \"can''t\""
      });
    }
    
    if (issues.length > 0) {
      console.log('\n❌ Potential issues found:');
      issues.forEach(issue => {
        console.log(`  ${issue.type} (line ${issue.line}): ${issue.content}`);
      });
    } else {
      console.log('\n✅ No obvious quote issues found');
    }
    
    // Check for the specific issue we're looking for
    console.log('\n🔍 Checking for specific issues...');
    
    // Check for the typo we fixed
    if (sqlContent.includes('CLEANSHIP')) {
      console.log('❌ Found typo: CLEANSIP should be CLEANUP');
    } else {
      console.log('✅ CLEANSIP typo not found (already fixed)');
    }
    
    // Check for the missing quote in the final RAISE NOTICE
    const finalNoticePattern = /RAISE NOTICE '==========================================================================';$/;
    if (finalNoticePattern.test(sqlContent)) {
      console.log('❌ Found missing quote in final RAISE NOTICE');
    } else {
      console.log('✅ Final RAISE NOTICE appears to be correct');
    }
    
  } catch (error) {
    console.error('Error analyzing VERIFICATION.sql:', error);
  }
}

findQuoteIssue();