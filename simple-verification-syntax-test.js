// Simple syntax test for VERIFICATION.sql
const fs = require('fs');
const path = require('path');

function testVerificationSyntax() {
  try {
    console.log('Testing VERIFICATION.sql syntax...');
    
    // Read the VERIFICATION.sql file
    const sqlFilePath = path.join(__dirname, 'VERIFICATION.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Check for RAISE NOTICE statements outside DO blocks
    const lines = sqlContent.split('\n');
    let inDoBlock = false;
    let syntaxErrors = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Track if we're inside a DO block
      if (line.startsWith('DO $$')) {
        inDoBlock = true;
      } else if (line.startsWith('END $$;')) {
        inDoBlock = false;
      }
      
      // Check for RAISE NOTICE outside DO blocks
      if (line.startsWith('RAISE NOTICE') && !inDoBlock) {
        syntaxErrors.push({
          line: i + 1,
          content: line,
          error: 'RAISE NOTICE statement outside DO block'
        });
      }
    }
    
    if (syntaxErrors.length > 0) {
      console.error('❌ Syntax errors found:');
      syntaxErrors.forEach(error => {
        console.error(`  Line ${error.line}: ${error.error}`);
        console.error(`  Content: ${error.content}`);
      });
      return false;
    } else {
      console.log('✅ No syntax errors found in VERIFICATION.sql');
      console.log('All RAISE NOTICE statements are properly contained within DO blocks');
      return true;
    }
  } catch (error) {
    console.error('Error reading VERIFICATION.sql:', error);
    return false;
  }
}

// Run the test
const success = testVerificationSyntax();
process.exit(success ? 0 : 1);