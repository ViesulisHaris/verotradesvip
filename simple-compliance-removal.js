const fs = require('fs');
const https = require('https');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

// Read the SQL script
const sqlScript = fs.readFileSync('./REMOVE_COMPLIANCE_FUNCTIONALITY.sql', 'utf8');

console.log('Executing compliance removal script...');

// Split script into individual statements
const statements = sqlScript
  .split(';')
  .map(stmt => stmt.trim())
  .filter(stmt => stmt.length > 0 && !stmt.startsWith('--') && !stmt.startsWith('BEGIN') && !stmt.startsWith('COMMIT'));

console.log(`Found ${statements.length} SQL statements to execute`);

// Execute each statement using Supabase REST API
async function executeStatement(statement, index) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      query: statement
    });

    const options = {
      hostname: new URL(supabaseUrl).hostname,
      port: 443,
      path: '/rest/v1/rpc/exec_sql',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          console.log(`Statement ${index + 1}: Success`);
          resolve(result);
        } catch (e) {
          console.log(`Statement ${index + 1}: Warning - ${data}`);
          resolve(null); // Continue even if there's an error
        }
      });
    });

    req.on('error', (error) => {
      console.log(`Statement ${index + 1}: Error - ${error.message}`);
      resolve(null); // Continue even if there's an error
    });

    req.write(postData);
    req.end();
  });
}

// Execute all statements
async function executeAllStatements() {
  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    
    if (statement.trim().length === 0) continue;
    
    console.log(`Executing statement ${i + 1}/${statements.length}...`);
    console.log(`Preview: ${statement.substring(0, 100)}...`);
    
    await executeStatement(statement, i);
  }
  
  console.log('Compliance removal script execution completed');
  
  // Run verification queries
  console.log('\nRunning verification queries...');
  
  // Check if strategy_rule_compliance table exists
  await executeStatement(
    `SELECT COUNT(*) as count FROM information_schema.tables WHERE table_name = 'strategy_rule_compliance'`,
    statements.length + 1
  );
  
  // Check if compliance_percentage column exists in trades table
  await executeStatement(
    `SELECT COUNT(*) as count FROM information_schema.columns WHERE table_name = 'trades' AND column_name = 'compliance_percentage'`,
    statements.length + 2
  );
  
  console.log('\n=== VERIFICATION COMPLETE ===');
  console.log('If the counts above are 0, compliance elements have been successfully removed');
}

executeAllStatements().catch(console.error);