const fs = require('fs');
const path = require('path');

function findQuoteIssue() {
  console.log('Analyzing VERIFICATION.sql for quote issues...');
  
  try {
    const sqlFilePath = path.join(__dirname, 'VERIFICATION.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    const lines = sqlContent.split('\n');
    let lineNum = 0;
    let inString = false;
    let currentStringStart = null;
    let issues = [];
    
    for (const line of lines) {
      lineNum++;
      let colNum = 0;
      
      for (let i = 0; i < line.length; i++) {
        colNum++;
        const char = line[i];
        
        if (char === "'" && !inString) {
          // Starting a string
          inString = true;
          currentStringStart = { line: lineNum, col: colNum };
        } else if (char === "'" && inString) {
          // Check if this is an escaped quote (two single quotes in a row)
          if (i + 1 < line.length && line[i + 1] === "'") {
            // Escaped quote, skip the next character
            i++;
            colNum++;
          } else {
            // Ending a string
            inString = false;
            currentStringStart = null;
          }
        }
      }
      
      // If we're still in a string at the end of the line, that's an issue
      if (inString && currentStringStart) {
        issues.push({
          type: 'Unclosed string',
          startLine: currentStringStart.line,
          startCol: currentStringStart.col,
          endLine: lineNum,
          line: line.trim()
        });
      }
    }
    
    // Check if we're still in a string at the end of the file
    if (inString && currentStringStart) {
      issues.push({
        type: 'Unclosed string at end of file',
        startLine: currentStringStart.line,
        startCol: currentStringStart.col,
        endLine: 'EOF',
        line: 'End of file'
      });
    }
    
    if (issues.length > 0) {
      console.log('\n❌ Quote issues found:');
      issues.forEach(issue => {
        console.log(`  ${issue.type}: Started at line ${issue.startLine}, col ${issue.startCol}`);
        console.log(`  Line content: ${issue.line}`);
      });
    } else {
      console.log('\n✅ No quote issues found');
    }
    
    // Also count total quotes to verify
    const singleQuoteCount = (sqlContent.match(/'/g) || []).length;
    console.log(`\n📊 Total single quotes: ${singleQuoteCount}`);
    
    if (singleQuoteCount % 2 !== 0) {
      console.log('⚠️  Odd number of single quotes detected - there might be an unmatched quote');
    } else {
      console.log('✅ Even number of single quotes detected');
    }
    
  } catch (error) {
    console.error('Error analyzing VERIFICATION.sql:', error);
  }
}

findQuoteIssue();