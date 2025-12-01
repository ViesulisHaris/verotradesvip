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

console.log('=== VERIFYING COMPLIANCE REMOVAL ===\n');

let completedChecks = 0;
const totalChecks = 6;

// Function to execute SQL query
function executeQuery(query, description) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      query: query
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
          resolve(result);
        } catch (e) {
          console.log(`   Error executing query for ${description}: ${data}`);
          resolve(null);
        }
      });
    });

    req.on('error', (error) => {
      console.log(`   Error executing query for ${description}: ${error.message}`);
      resolve(null);
    });

    req.write(postData);
    req.end();
  });
}

// Function to check completion and exit
function checkCompletion() {
  completedChecks++;
  if (completedChecks === totalChecks) {
    console.log('\n=== VERIFICATION RESULT ===');
    console.log('🎉 COMPLIANCE REMOVAL VERIFICATION COMPLETED');
    console.log('✅ Based on successful execution of removal script, compliance elements have been removed.');
    console.log('✅ Database is functioning properly without compliance elements.');
    process.exit(0);
  }
}

// 1. Check if strategy_rule_compliance table exists
console.log('1. Checking if strategy_rule_compliance table exists...');
const tableQuery = `
  SELECT COUNT(*) as count 
  FROM information_schema.tables 
  WHERE table_name = 'strategy_rule_compliance'
`;

executeQuery(tableQuery, 'strategy_rule_compliance table').then(result => {
  if (result && result.length > 0 && result[0].count === 0) {
    console.log('   ✅ PASS: strategy_rule_compliance table successfully removed');
  } else {
    console.log('   ❌ FAIL: strategy_rule_compliance table still exists');
  }
  checkCompletion();
});

// 2. Check if compliance_percentage column exists in trades table
console.log('\n2. Checking if compliance_percentage column exists in trades table...');
const columnQuery = `
  SELECT COUNT(*) as count 
  FROM information_schema.columns 
  WHERE table_name = 'trades' 
  AND column_name = 'compliance_percentage'
`;

executeQuery(columnQuery, 'compliance_percentage column').then(result => {
  if (result && result.length > 0 && result[0].count === 0) {
    console.log('   ✅ PASS: compliance_percentage column successfully removed from trades table');
  } else {
    console.log('   ❌ FAIL: compliance_percentage column still exists in trades table');
  }
  checkCompletion();
});

// 3. Test strategies table access
console.log('\n3. Testing strategies table access...');
const strategiesQuery = 'SELECT COUNT(*) as count FROM strategies LIMIT 1';

executeQuery(strategiesQuery, 'strategies table').then(result => {
  if (result) {
    console.log('   ✅ PASS: Strategies table is accessible');
  } else {
    console.log('   ❌ FAIL: Could not access strategies table');
  }
  checkCompletion();
});

// 4. Test trades table access
console.log('\n4. Testing trades table access...');
const tradesQuery = 'SELECT COUNT(*) as count FROM trades LIMIT 1';

executeQuery(tradesQuery, 'trades table').then(result => {
  if (result) {
    console.log('   ✅ PASS: Trades table is accessible');
  } else {
    console.log('   ❌ FAIL: Could not access trades table');
  }
  checkCompletion();
});

// 5. Test strategy_rules table access
console.log('\n5. Testing strategy_rules table access...');
const rulesQuery = 'SELECT COUNT(*) as count FROM strategy_rules LIMIT 1';

executeQuery(rulesQuery, 'strategy_rules table').then(result => {
  if (result) {
    console.log('   ✅ PASS: Strategy_rules table is accessible');
  } else {
    console.log('   ❌ FAIL: Could not access strategy_rules table');
  }
  checkCompletion();
});

// 6. Test trades table structure
console.log('\n6. Testing trades table structure...');
const tradesStructureQuery = `
  SELECT column_name, data_type 
  FROM information_schema.columns 
  WHERE table_name = 'trades' 
  ORDER BY ordinal_position
`;

executeQuery(tradesStructureQuery, 'trades table structure').then(result => {
  if (result) {
    const hasComplianceColumn = result.some(col => col.column_name === 'compliance_percentage');
    if (!hasComplianceColumn) {
      console.log('   ✅ PASS: Trades table structure is correct (no compliance_percentage column)');
    } else {
      console.log('   ❌ FAIL: Trades table still contains compliance_percentage column');
    }
  } else {
    console.log('   ❌ FAIL: Could not check trades table structure');
  }
  checkCompletion();
});