/**
 * Test Runner for Strategy Fix Testing
 * 
 * Purpose: Execute all test scripts in the specified environment
 * 
 * Usage: node run-tests.js [environment] [test-type]
 * Environment: 'development' (default) or 'production'
 * Test-type: 'all' (default), 'trade-logging', 'strategy-crud', 'strategy-permissions', 'end-to-end'
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Get command line arguments
const environment = process.argv[2] || 'development';
const testType = process.argv[3] || 'all';

console.log(`🚀 Starting Strategy Fix Test Runner`);
console.log(`📍 Environment: ${environment.toUpperCase()}`);
console.log(`🧪 Test Type: ${testType.toUpperCase()}`);
console.log(`📅 Started at: ${new Date().toISOString()}\n`);

// Load test configuration
let config;
try {
  const configData = fs.readFileSync('test-config.json', 'utf8');
  config = JSON.parse(configData);
  
  if (!config[environment]) {
    throw new Error(`Configuration for environment '${environment}' not found`);
  }
  
  // Replace environment variables in config
  const envConfig = JSON.stringify(config[environment]);
  const resolvedConfig = envConfig
    .replace(/\${NEXT_PUBLIC_SUPABASE_URL}/g, process.env.NEXT_PUBLIC_SUPABASE_URL || '')
    .replace(/\${SUPABASE_SERVICE_ROLE_KEY}/g, process.env.SUPABASE_SERVICE_ROLE_KEY || '')
    .replace(/\${NEXT_PUBLIC_SUPABASE_ANON_KEY}/g, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '');
  
  config[environment] = JSON.parse(resolvedConfig);
  
  console.log(`✅ Configuration loaded for ${environment}`);
  console.log(`   Destructive tests: ${config[environment].testSettings.allowDestructiveTests ? 'Enabled' : 'Disabled'}`);
  console.log(`   Data creation: ${config[environment].testSettings.allowDataCreation ? 'Enabled' : 'Disabled'}`);
  console.log(`   Data deletion: ${config[environment].testSettings.allowDataDeletion ? 'Enabled' : 'Disabled'}\n`);
} catch (error) {
  console.error(`❌ Error loading configuration: ${error.message}`);
  process.exit(1);
}

// Test scripts mapping
const testScripts = {
  'trade-logging': {
    name: 'Trade Logging Tests',
    script: 'test-trade-logging.js',
    description: 'Tests trade logging functionality without strategy_rule_compliance errors'
  },
  'strategy-crud': {
    name: 'Strategy CRUD Tests',
    script: 'test-strategy-crud.js',
    description: 'Tests strategy create, read, update, delete operations'
  },
  'strategy-permissions': {
    name: 'Strategy Permissions Tests',
    script: 'test-strategy-permissions.js',
    description: 'Tests strategy access with different user roles'
  },
  'end-to-end': {
    name: 'End-to-End Workflow Tests',
    script: 'test-end-to-end-workflow.js',
    description: 'Tests complete user workflows'
  }
};

// Function to run a test script
function runTestScript(scriptName, scriptPath, env) {
  console.log(`\n🧪 Running ${scriptName} in ${env.toUpperCase()} Environment`);
  console.log('='.repeat(60));
  
  try {
    const startTime = Date.now();
    
    // Execute the test script
    const result = execSync(`node ${scriptPath} ${env}`, {
      stdio: 'inherit',
      encoding: 'utf8'
    });
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log(`\n✅ ${scriptName} completed in ${duration}ms`);
    return { success: true, duration, output: result };
  } catch (error) {
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log(`\n❌ ${scriptName} failed in ${duration}ms`);
    console.log(`Error: ${error.message}`);
    
    return { success: false, duration, error: error.message };
  }
}

// Function to create backup before testing
function createBackup(env) {
  if (!config[env].rollback.createBackupBeforeTest) {
    console.log('⏭️  Backup creation skipped (disabled in configuration)');
    return;
  }
  
  console.log('💾 Creating database backup before testing...');
  
  try {
    const backupName = `strategy-fix-backup-${env}-${Date.now()}.sql`;
    // Note: This would need to be implemented based on your database system
    // For Supabase, you might use their backup API or export functionality
    console.log(`   Backup would be saved as: ${backupName}`);
    console.log('   (Backup creation would be implemented here)');
  } catch (error) {
    console.log(`   Warning: Backup creation failed: ${error.message}`);
  }
}

// Function to check prerequisites
function checkPrerequisites(env) {
  console.log('🔍 Checking prerequisites...');
  
  const requiredEnvVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY'
  ];
  
  let missingVars = [];
  
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      missingVars.push(envVar);
    }
  }
  
  if (missingVars.length > 0) {
    console.error(`❌ Missing required environment variables: ${missingVars.join(', ')}`);
    return false;
  }
  
  // Check if test scripts exist
  for (const [testKey, testInfo] of Object.entries(testScripts)) {
    if (testType === 'all' || testType === testKey) {
      if (!fs.existsSync(testInfo.script)) {
        console.error(`❌ Test script not found: ${testInfo.script}`);
        return false;
      }
    }
  }
  
  console.log('✅ Prerequisites check passed\n');
  return true;
}

// Function to generate summary report
function generateSummaryReport(results, env) {
  const reportData = {
    environment: env,
    timestamp: new Date().toISOString(),
    testType: testType,
    results: results,
    summary: {
      totalTests: results.length,
      successfulTests: results.filter(r => r.success).length,
      failedTests: results.filter(r => !r.success).length,
      totalDuration: results.reduce((sum, r) => sum + (r.duration || 0), 0)
    },
    configuration: config[env]
  };
  
  const reportFileName = `test-summary-${env}-${testType}-${Date.now()}.json`;
  fs.writeFileSync(reportFileName, JSON.stringify(reportData, null, 2));
  
  console.log(`\n📄 Summary report saved to: ${reportFileName}`);
  
  return reportFileName;
}

// Main execution function
function main() {
  // Check prerequisites
  if (!checkPrerequisites(environment)) {
    process.exit(1);
  }
  
  // Create backup if enabled
  createBackup(environment);
  
  const results = [];
  const scriptsToRun = testType === 'all' 
    ? Object.keys(testScripts)
    : [testType];
  
  // Run the specified tests
  for (const testKey of scriptsToRun) {
    if (!testScripts[testKey]) {
      console.log(`⚠️  Unknown test type: ${testKey}, skipping`);
      continue;
    }
    
    const result = runTestScript(
      testScripts[testKey].name,
      testScripts[testKey].script,
      environment
    );
    
    results.push({
      testType: testKey,
      testName: testScripts[testKey].name,
      description: testScripts[testKey].description,
      ...result
    });
    
    // If auto-rollback is enabled and test failed, stop execution
    if (!result.success && config.common.rollback.autoRollbackOnFailure) {
      console.log('\n🚨 Auto-rollback triggered due to test failure');
      console.log('   (Rollback would be implemented here)');
      break;
    }
  }
  
  // Generate summary report
  const reportFileName = generateSummaryReport(results, environment);
  
  // Print final summary
  console.log('\n\n📊 Final Test Summary');
  console.log('========================');
  
  const successfulTests = results.filter(r => r.success).length;
  const failedTests = results.filter(r => !r.success).length;
  
  console.log(`✅ Successful: ${successfulTests}`);
  console.log(`❌ Failed: ${failedTests}`);
  console.log(`📈 Total: ${results.length}`);
  
  if (failedTests > 0) {
    console.log('\n❌ Some tests failed. Check detailed reports for more information.');
    
    if (config[environment].rollback.manualRollbackRequired) {
      console.log('\n⚠️  Manual rollback may be required. Check rollback documentation.');
    }
    
    process.exit(1);
  } else {
    console.log('\n✅ All tests passed! Strategy fixes are working correctly.');
    
    // Clean up test data if enabled
    if (config.common.testExecution.cleanupAfterTest) {
      console.log('\n🧹 Cleaning up test data...');
      console.log('   (Cleanup would be implemented here)');
    }
    
    process.exit(0);
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Run the main function
main().catch(error => {
  console.error('Error in test runner:', error);
  process.exit(1);
});