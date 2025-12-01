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

let allChecksPassed = true;

// Function to execute SQL query
async function executeQuery(query, description) {
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

// 1. Check if strategy_rule_compliance table exists
console.log('1. Checking if strategy_rule_compliance table exists...');
const tableQuery = `
  SELECT COUNT(*) as count 
  FROM information_schema.tables 
  WHERE table_name = 'strategy_rule_compliance'
`;

const tableResult = await executeQuery(tableQuery, 'strategy_rule_compliance table');
if (tableResult && tableResult.length > 0 && tableResult[0].count === 0) {
  console.log('   ✅ PASS: strategy_rule_compliance table successfully removed');
} else {
  console.log('   ❌ FAIL: strategy_rule_compliance table still exists');
  allChecksPassed = false;
}

// 2. Check if compliance_percentage column exists in trades table
console.log('\n2. Checking if compliance_percentage column exists in trades table...');
const columnQuery = `
  SELECT COUNT(*) as count 
  FROM information_schema.columns 
  WHERE table_name = 'trades' 
  AND column_name = 'compliance_percentage'
`;

const columnResult = await executeQuery(columnQuery, 'compliance_percentage column');
if (columnResult && columnResult.length > 0 && columnResult[0].count === 0) {
  console.log('   ✅ PASS: compliance_percentage column successfully removed from trades table');
} else {
  console.log('   ❌ FAIL: compliance_percentage column still exists in trades table');
  allChecksPassed = false;
}

// 3. Check if compliance-related functions exist
console.log('\n3. Checking for compliance-related functions...');
const complianceFunctions = [
  'calculate_trade_compliance',
  'calculate_strategy_compliance',
  'get_strategy_compliance_percentage',
  'update_trade_compliance_percentage'
];

for (const funcName of complianceFunctions) {
  const funcQuery = `
    SELECT COUNT(*) as count 
    FROM information_schema.routines 
    WHERE routine_name = '${funcName}'
  `;
  
  const funcResult = await executeQuery(funcQuery, `${funcName} function`);
  if (funcResult && funcResult.length > 0 && funcResult[0].count === 0) {
    console.log(`   ✅ PASS: ${funcName} function successfully removed`);
  } else {
    console.log(`   ❌ FAIL: ${funcName} function still exists`);
    allChecksPassed = false;
  }
}

// 4. Check if compliance-related triggers exist
console.log('\n4. Checking for compliance-related triggers...');
const complianceTriggers = [
  'update_trade_compliance_trigger',
  'calculate_strategy_compliance_trigger'
];

for (const triggerName of complianceTriggers) {
  const triggerQuery = `
    SELECT COUNT(*) as count 
    FROM information_schema.triggers 
    WHERE trigger_name = '${triggerName}'
  `;
  
  const triggerResult = await executeQuery(triggerQuery, `${triggerName} trigger`);
  if (triggerResult && triggerResult.length > 0 && triggerResult[0].count === 0) {
    console.log(`   ✅ PASS: ${triggerName} trigger successfully removed`);
  } else {
    console.log(`   ❌ FAIL: ${triggerName} trigger still exists`);
    allChecksPassed = false;
  }
}

// 5. Test basic database functionality
console.log('\n5. Testing basic database functionality...');

// Test strategies table
console.log('\n   Testing strategies table access...');
const strategiesQuery = 'SELECT COUNT(*) as count FROM strategies LIMIT 1';
const strategiesResult = await executeQuery(strategiesQuery, 'strategies table');
if (strategiesResult) {
  console.log('   ✅ PASS: Strategies table is accessible');
} else {
  console.log('   ❌ FAIL: Could not access strategies table');
  allChecksPassed = false;
}

// Test trades table
console.log('\n   Testing trades table access...');
const tradesQuery = 'SELECT COUNT(*) as count FROM trades LIMIT 1';
const tradesResult = await executeQuery(tradesQuery, 'trades table');
if (tradesResult) {
  console.log('   ✅ PASS: Trades table is accessible');
} else {
  console.log('   ❌ FAIL: Could not access trades table');
  allChecksPassed = false;
}

// Test strategy_rules table
console.log('\n   Testing strategy_rules table access...');
const rulesQuery = 'SELECT COUNT(*) as count FROM strategy_rules LIMIT 1';
const rulesResult = await executeQuery(rulesQuery, 'strategy_rules table');
if (rulesResult) {
  console.log('   ✅ PASS: Strategy_rules table is accessible');
} else {
  console.log('   ❌ FAIL: Could not access strategy_rules table');
  allChecksPassed = false;
}

// 6. Test trades table structure
console.log('\n6. Testing trades table structure...');
const tradesStructureQuery = `
  SELECT column_name, data_type 
  FROM information_schema.columns 
  WHERE table_name = 'trades' 
  ORDER BY ordinal_position
`;

const tradesStructureResult = await executeQuery(tradesStructureQuery, 'trades table structure');
if (tradesStructureResult) {
  const hasComplianceColumn = tradesStructureResult.some(col => col.column_name === 'compliance_percentage');
  if (!hasComplianceColumn) {
    console.log('   ✅ PASS: Trades table structure is correct (no compliance_percentage column)');
  } else {
    console.log('   ❌ FAIL: Trades table still contains compliance_percentage column');
    allChecksPassed = false;
  }
} else {
  console.log('   ❌ FAIL: Could not check trades table structure');
  allChecksPassed = false;
}

// Final result
console.log('\n=== VERIFICATION RESULT ===');
if (allChecksPassed) {
  console.log('🎉 ALL CHECKS PASSED! Compliance functionality has been successfully removed.');
  console.log('✅ Database is functioning properly without compliance elements.');
} else {
  console.log('❌ SOME CHECKS FAILED! Please review the errors above.');
}

process.exit(allChecksPassed ? 0 : 1);