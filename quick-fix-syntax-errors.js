/**
 * Quick fix for syntax errors in API routes
 */

const fs = require('fs');
const path = require('path');

function fixSyntaxErrors() {
  console.log('🔧 Fixing syntax errors in API routes...');
  
  // Fix confluence-stats route
  const confluenceStatsPath = path.join(__dirname, 'src/app/api/confluence-stats/route.ts');
  let confluenceStatsContent = fs.readFileSync(confluenceStatsPath, 'utf8');
  
  // Fix the missing semicolon after console.log
  confluenceStatsContent = confluenceStatsContent.replace(
    /console\.log\(`✅ \[CONFLUENCE_STATS:\$\{requestId\}\] Authentication successful for user:`\,\s*\{\s*userId: user\.id,\s*userEmail: user\.email,\s*timestamp: new Date\(\)\.toISOString\(\)\s*\}\);/g,
    `console.log(\`✅ [CONFLUENCE_STATS:${requestId}] Authentication successful for user:\`, {\n      userId: user.id,\n      userEmail: user.email,\n      timestamp: new Date().toISOString()\n    });`
  );
  
  fs.writeFileSync(confluenceStatsPath, confluenceStatsContent);
  console.log('✅ Fixed confluence-stats syntax error');
  
  // Fix confluence-trades route
  const confluenceTradesPath = path.join(__dirname, 'src/app/api/confluence-trades/route.ts');
  let confluenceTradesContent = fs.readFileSync(confluenceTradesPath, 'utf8');
  
  // Fix the missing semicolon after console.log
  confluenceTradesContent = confluenceTradesContent.replace(
    /console\.log\(`✅ \[CONFLUENCE_TRADES:\$\{requestId\}\] Authentication successful for user:`\,\s*\{\s*userId: user\.id,\s*userEmail: user\.email,\s*timestamp: new Date\(\)\.toISOString\(\)\s*\}\);/g,
    `console.log(\`✅ [CONFLUENCE_TRADES:${requestId}] Authentication successful for user:\`, {\n      userId: user.id,\n      userEmail: user.email,\n      timestamp: new Date().toISOString()\n    });`
  );
  
  fs.writeFileSync(confluenceTradesPath, confluenceTradesContent);
  console.log('✅ Fixed confluence-trades syntax error');
}

fixSyntaxErrors();
console.log('🎉 Syntax errors fixed successfully!');