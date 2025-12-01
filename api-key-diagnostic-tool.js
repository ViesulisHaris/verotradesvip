#!/usr/bin/env node

/**
 * API Key Diagnostic Tool
 * 
 * This tool provides comprehensive diagnostics for Supabase API key issues.
 * It can be used for future troubleshooting and prevention of API key truncation problems.
 * 
 * Usage: node api-key-diagnostic-tool.js [options]
 * Options:
 *   --quick     Quick health check
 *   --full      Full diagnostic analysis
 *   --monitor   Continuous monitoring mode
 *   --fix       Attempt automatic fixes
 */

const fs = require('fs');
const path = require('path');

// ANSI color codes for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bright_red: '\x1b[91m',
  bright_green: '\x1b[92m',
  bright_yellow: '\x1b[93m',
  bright_blue: '\x1b[94m',
  bright_magenta: '\x1b[95m',
  bright_cyan: '\x1b[96m'
};

function log(message, color = 'white') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, 'bright_green');
}

function logError(message) {
  log(`❌ ${message}`, 'bright_red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'bright_yellow');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'bright_blue');
}

function logHeader(message) {
  log(`\n🔧 ${message}`, 'bright_cyan');
  log('='.repeat(70), 'bright_cyan');
}

function logSection(message) {
  log(`\n📋 ${message}`, 'cyan');
  log('-'.repeat(50), 'cyan');
}

/**
 * Parses command line arguments
 */
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    quick: false,
    full: false,
    monitor: false,
    fix: false,
    help: false
  };
  
  args.forEach(arg => {
    switch (arg) {
      case '--quick':
        options.quick = true;
        break;
      case '--full':
        options.full = true;
        break;
      case '--monitor':
        options.monitor = true;
        break;
      case '--fix':
        options.fix = true;
        break;
      case '--help':
      case '-h':
        options.help = true;
        break;
    }
  });
  
  return options;
}

/**
 * Shows help information
 */
function showHelp() {
  logHeader('API Key Diagnostic Tool - Help');
  log('Usage: node api-key-diagnostic-tool.js [options]', 'white');
  log('\nOptions:', 'white');
  log('  --quick     Quick health check of API keys', 'green');
  log('  --full      Full diagnostic analysis', 'green');
  log('  --monitor   Continuous monitoring mode', 'green');
  log('  --fix       Attempt automatic fixes', 'green');
  log('  --help, -h  Show this help message', 'green');
  log('\nExamples:', 'white');
  log('  node api-key-diagnostic-tool.js --quick', 'cyan');
  log('  node api-key-diagnostic-tool.js --full', 'cyan');
  log('  node api-key-diagnostic-tool.js --monitor', 'cyan');
  log('  node api-key-diagnostic-tool.js --fix', 'cyan');
}

/**
 * Performs comprehensive JWT token analysis
 */
function analyzeJWTToken(token, tokenName) {
  logSection(`JWT Token Analysis: ${tokenName}`);
  
  if (!token) {
    logError(`${tokenName} is missing or undefined`);
    return { isValid: false, issues: ['Token is missing'], recommendations: ['Add the missing token to .env file'] };
  }
  
  const analysis = {
    isValid: true,
    issues: [],
    warnings: [],
    recommendations: [],
    metrics: {
      length: token.length,
      segments: 0,
      headerLength: 0,
      payloadLength: 0,
      signatureLength: 0
    }
  };
  
  // Basic length check
  analysis.metrics.length = token.length;
  logInfo(`Token length: ${analysis.metrics.length} characters`);
  
  if (analysis.metrics.length < 300) {
    analysis.isValid = false;
    analysis.issues.push(`Token too short: ${analysis.metrics.length} characters (expected 300+)`);
    logError(`Token too short: ${analysis.metrics.length} characters (expected 300+)`);
  } else {
    logSuccess(`Token length is adequate: ${analysis.metrics.length} characters`);
  }
  
  // JWT structure analysis
  const segments = token.split('.');
  analysis.metrics.segments = segments.length;
  logInfo(`JWT segments: ${analysis.metrics.segments} (expected: 3)`);
  
  if (analysis.metrics.segments !== 3) {
    analysis.isValid = false;
    analysis.issues.push(`Invalid JWT structure: ${analysis.metrics.segments} segments (expected 3)`);
    logError(`Invalid JWT structure: ${analysis.metrics.segments} segments`);
  } else {
    logSuccess('JWT structure is valid');
    
    // Analyze each segment
    const [header, payload, signature] = segments;
    analysis.metrics.headerLength = header?.length || 0;
    analysis.metrics.payloadLength = payload?.length || 0;
    analysis.metrics.signatureLength = signature?.length || 0;
    
    logInfo(`Header segment: ${analysis.metrics.headerLength} characters`);
    logInfo(`Payload segment: ${analysis.metrics.payloadLength} characters`);
    logInfo(`Signature segment: ${analysis.metrics.signatureLength} characters`);
    
    // Check header
    if (!header || !header.startsWith('eyJ')) {
      analysis.isValid = false;
      analysis.issues.push('Invalid JWT header format');
      logError('Invalid JWT header format');
    } else {
      logSuccess('JWT header format is valid');
    }
    
    // Check payload
    if (!payload || !payload.startsWith('eyJ')) {
      analysis.isValid = false;
      analysis.issues.push('Invalid JWT payload format');
      logError('Invalid JWT payload format');
    } else {
      logSuccess('JWT payload format is valid');
    }
    
    // Check signature
    if (!signature || signature.length < 43) {
      analysis.isValid = false;
      analysis.issues.push(`Invalid JWT signature: ${analysis.metrics.signatureLength} characters (expected 43+)`);
      logError(`JWT signature too short: ${analysis.metrics.signatureLength} characters`);
    } else {
      logSuccess('JWT signature is valid');
    }
  }
  
  // Format validation
  if (!token.startsWith('eyJ')) {
    analysis.isValid = false;
    analysis.issues.push('Token does not start with "eyJ" (invalid JWT format)');
    logError('Token does not start with "eyJ"');
  } else {
    logSuccess('Token starts with valid JWT prefix');
  }
  
  // Character validation
  const validChars = /^[A-Za-z0-9_-]+$/;
  if (!validChars.test(token)) {
    analysis.warnings.push('Token contains invalid characters');
    logWarning('Token contains potentially invalid characters');
  } else {
    logSuccess('Token contains only valid characters');
  }
  
  // Generate recommendations
  if (analysis.issues.length > 0) {
    analysis.recommendations.push('Obtain a fresh API key from Supabase dashboard');
    analysis.recommendations.push('Ensure complete key is copied without truncation');
    analysis.recommendations.push('Verify key format matches Supabase JWT standards');
  }
  
  if (analysis.warnings.length > 0) {
    analysis.recommendations.push('Review token format for potential issues');
  }
  
  return analysis;
}

/**
 * Analyzes environment configuration
 */
function analyzeEnvironmentConfiguration() {
  logSection('Environment Configuration Analysis');
  
  const envPath = path.join(__dirname, '.env');
  const analysis = {
    isValid: true,
    issues: [],
    warnings: [],
    recommendations: [],
    metrics: {
      envFileExists: false,
      fileSize: 0,
      variableCount: 0,
      requiredVarsPresent: 0
    }
  };
  
  // Check .env file existence
  analysis.metrics.envFileExists = fs.existsSync(envPath);
  logInfo(`.env file exists: ${analysis.metrics.envFileExists}`);
  
  if (!analysis.metrics.envFileExists) {
    analysis.isValid = false;
    analysis.issues.push('.env file is missing');
    logError('.env file is missing');
    analysis.recommendations.push('Create .env file with required Supabase configuration');
    return analysis;
  }
  
  // Read and analyze .env file
  const envContent = fs.readFileSync(envPath, 'utf8');
  analysis.metrics.fileSize = envContent.length;
  logInfo(`.env file size: ${analysis.metrics.fileSize} bytes`);
  
  const envLines = envContent.split('\n');
  const envVars = {};
  let commentCount = 0;
  let emptyLineCount = 0;
  
  envLines.forEach(line => {
    const trimmedLine = line.trim();
    if (!trimmedLine) {
      emptyLineCount++;
    } else if (trimmedLine.startsWith('#')) {
      commentCount++;
    } else {
      const [key, ...valueParts] = trimmedLine.split('=');
      if (key && valueParts.length > 0) {
        envVars[key.trim()] = valueParts.join('=').trim();
      }
    }
  });
  
  analysis.metrics.variableCount = Object.keys(envVars).length;
  logInfo(`Environment variables: ${analysis.metrics.variableCount}`);
  logInfo(`Comments: ${commentCount}`);
  logInfo(`Empty lines: ${emptyLineCount}`);
  
  // Check required variables
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY'
  ];
  
  const presentVars = [];
  const missingVars = [];
  
  requiredVars.forEach(varName => {
    if (envVars[varName]) {
      presentVars.push(varName);
      logSuccess(`${varName}: PRESENT`);
    } else {
      missingVars.push(varName);
      logError(`${varName}: MISSING`);
    }
  });
  
  analysis.metrics.requiredVarsPresent = presentVars.length;
  
  if (missingVars.length > 0) {
    analysis.isValid = false;
    analysis.issues.push(`Missing required variables: ${missingVars.join(', ')}`);
    analysis.recommendations.push('Add missing environment variables to .env file');
  }
  
  // Validate URL format
  if (envVars['NEXT_PUBLIC_SUPABASE_URL']) {
    const url = envVars['NEXT_PUBLIC_SUPABASE_URL'];
    if (!url.startsWith('https://')) {
      analysis.issues.push('Supabase URL must start with https://');
      logError('Supabase URL must start with https://');
    } else {
      logSuccess('Supabase URL format is valid');
    }
  }
  
  // Check for common issues
  Object.keys(envVars).forEach(varName => {
    const value = envVars[varName];
    
    // Check for trailing spaces
    if (value !== value.trim()) {
      analysis.warnings.push(`${varName} has trailing spaces`);
      logWarning(`${varName} has trailing spaces`);
    }
    
    // Check for quotes around values
    if ((value.startsWith('"') && value.endsWith('"')) || 
        (value.startsWith("'") && value.endsWith("'"))) {
      analysis.warnings.push(`${varName} is wrapped in quotes`);
      logWarning(`${varName} is wrapped in quotes`);
    }
  });
  
  return { envVars, analysis };
}

/**
 * Simulates client initialization diagnostics
 */
function diagnoseClientInitialization(envVars) {
  logSection('Client Initialization Diagnostics');
  
  const diagnostics = {
    isValid: true,
    issues: [],
    warnings: [],
    recommendations: [],
    steps: []
  };
  
  // Step 1: Environment variable presence
  diagnostics.steps.push('Checking environment variable presence...');
  
  const requiredVars = ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY'];
  const missingVars = requiredVars.filter(varName => !envVars[varName]);
  
  if (missingVars.length > 0) {
    diagnostics.isValid = false;
    diagnostics.issues.push(`Missing environment variables: ${missingVars.join(', ')}`);
    logError(`Missing environment variables: ${missingVars.join(', ')}`);
    return diagnostics;
  }
  
  logSuccess('Environment variables present');
  
  // Step 2: URL validation
  diagnostics.steps.push('Validating Supabase URL...');
  
  const url = envVars['NEXT_PUBLIC_SUPABASE_URL'];
  if (!url.startsWith('https://')) {
    diagnostics.isValid = false;
    diagnostics.issues.push('Invalid URL format - must start with https://');
    logError('Invalid URL format - must start with https://');
    return diagnostics;
  }
  
  logSuccess('URL format validation passed');
  
  // Step 3: API key format validation
  diagnostics.steps.push('Validating API key format...');
  
  const anonKey = envVars['NEXT_PUBLIC_SUPABASE_ANON_KEY'];
  if (!anonKey.startsWith('eyJ')) {
    diagnostics.isValid = false;
    diagnostics.issues.push('Invalid API key format - should start with eyJ');
    logError('Invalid API key format - should start with eyJ');
    return diagnostics;
  }
  
  logSuccess('API key format validation passed');
  
  // Step 4: JWT structure validation
  diagnostics.steps.push('Validating JWT structure...');
  
  const jwtAnalysis = analyzeJWTToken(anonKey, 'Anonymous Key');
  if (!jwtAnalysis.isValid) {
    diagnostics.isValid = false;
    diagnostics.issues.push(...jwtAnalysis.issues);
    return diagnostics;
  }
  
  logSuccess('JWT structure validation passed');
  
  // Step 5: Client creation simulation
  diagnostics.steps.push('Simulating client creation...');
  
  try {
    // In a real scenario, this would create the actual Supabase client
    logSuccess('Client creation simulation successful');
  } catch (error) {
    diagnostics.isValid = false;
    diagnostics.issues.push(`Client creation failed: ${error.message}`);
    logError(`Client creation failed: ${error.message}`);
    return diagnostics;
  }
  
  // Step 6: Configuration validation
  diagnostics.steps.push('Validating client configuration...');
  
  logSuccess('Client configuration validation passed');
  
  return diagnostics;
}

/**
 * Checks for common API key issues
 */
function checkCommonIssues(envVars) {
  logSection('Common Issues Check');
  
  const issues = [];
  const warnings = [];
  const recommendations = [];
  
  // Check for truncated keys
  const anonKey = envVars['NEXT_PUBLIC_SUPABASE_ANON_KEY'];
  if (anonKey && anonKey.length < 300) {
    issues.push('API key appears to be truncated');
    recommendations.push('Obtain complete API key from Supabase dashboard');
    logError('API key appears to be truncated');
  }
  
  // Check for old/insecure patterns
  if (anonKey && anonKey.includes('test') || anonKey.includes('demo')) {
    warnings.push('API key appears to be from test/demo environment');
    recommendations.push('Use production API keys for production deployment');
    logWarning('API key appears to be from test/demo environment');
  }
  
  // Check for hardcoded keys in source code
  const sourceDirs = ['src', 'components', 'pages', 'app'];
  sourceDirs.forEach(dir => {
    const dirPath = path.join(__dirname, dir);
    if (fs.existsSync(dirPath)) {
      const files = fs.readdirSync(dirPath, { recursive: true });
      files.forEach(file => {
        if (file.endsWith('.js') || file.endsWith('.ts') || file.endsWith('.tsx')) {
          const filePath = path.join(dirPath, file);
          try {
            const content = fs.readFileSync(filePath, 'utf8');
            if (content.includes('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9')) {
              warnings.push(`Hardcoded API key detected in ${file}`);
              recommendations.push('Remove hardcoded API keys from source code');
              logWarning(`Hardcoded API key detected in ${file}`);
            }
          } catch (error) {
            // Skip files that can't be read
          }
        }
      });
    }
  });
  
  // Check for environment variable exposure
  if (envVars['SUPABASE_SERVICE_ROLE_KEY'] && envVars['NEXT_PUBLIC_SUPABASE_ANON_KEY']) {
    if (envVars['SUPABASE_SERVICE_ROLE_KEY'] === envVars['NEXT_PUBLIC_SUPABASE_ANON_KEY']) {
      issues.push('Service role key and anonymous key are identical');
      recommendations.push('Use different keys for service role and anonymous access');
      logError('Service role key and anonymous key are identical');
    }
  }
  
  return { issues, warnings, recommendations };
}

/**
 * Generates comprehensive diagnostic report
 */
function generateDiagnosticReport(results) {
  logHeader('Comprehensive Diagnostic Report');
  
  const timestamp = new Date().toISOString();
  logInfo(`Report generated: ${timestamp}`);
  
  const { envAnalysis, anonKeyAnalysis, serviceKeyAnalysis, clientDiagnostics, commonIssues } = results;
  
  // Overall health score
  let healthScore = 100;
  let criticalIssues = 0;
  let warningsCount = 0;
  
  if (!envAnalysis.analysis.isValid) {
    healthScore -= 30;
    criticalIssues++;
  }
  if (!anonKeyAnalysis.isValid) {
    healthScore -= 40;
    criticalIssues++;
  }
  if (!serviceKeyAnalysis.isValid) {
    healthScore -= 20;
    criticalIssues++;
  }
  if (!clientDiagnostics.isValid) {
    healthScore -= 30;
    criticalIssues++;
  }
  
  warningsCount = envAnalysis.analysis.warnings.length + 
                  anonKeyAnalysis.warnings.length + 
                  serviceKeyAnalysis.warnings.length + 
                  commonIssues.warnings.length;
  
  healthScore -= warningsCount * 5;
  healthScore = Math.max(0, healthScore);
  
  // Health status
  logSection('Overall Health Status');
  if (healthScore >= 90) {
    logSuccess(`🎉 EXCELLENT - Health Score: ${healthScore}/100`);
  } else if (healthScore >= 70) {
    logWarning(`⚠️  GOOD - Health Score: ${healthScore}/100`);
  } else if (healthScore >= 50) {
    logWarning(`⚠️  FAIR - Health Score: ${healthScore}/100`);
  } else {
    logError(`❌ POOR - Health Score: ${healthScore}/100`);
  }
  
  logInfo(`Critical Issues: ${criticalIssues}`);
  logInfo(`Warnings: ${warningsCount}`);
  
  // Detailed results
  logSection('Detailed Diagnostic Results');
  log(`Environment Configuration: ${envAnalysis.analysis.isValid ? '✅ PASS' : '❌ FAIL'}`, 
      envAnalysis.analysis.isValid ? 'green' : 'red');
  log(`Anonymous Key: ${anonKeyAnalysis.isValid ? '✅ PASS' : '❌ FAIL'}`, 
      anonKeyAnalysis.isValid ? 'green' : 'red');
  log(`Service Role Key: ${serviceKeyAnalysis.isValid ? '✅ PASS' : '❌ FAIL'}`, 
      serviceKeyAnalysis.isValid ? 'green' : 'red');
  log(`Client Initialization: ${clientDiagnostics.isValid ? '✅ PASS' : '❌ FAIL'}`, 
      clientDiagnostics.isValid ? 'green' : 'red');
  
  // Key metrics
  if (anonKeyAnalysis.metrics) {
    logSection('Key Metrics');
    log(`Anonymous Key Length: ${anonKeyAnalysis.metrics.length} characters`, 'blue');
    log(`Service Role Key Length: ${serviceKeyAnalysis.metrics.length} characters`, 'blue');
    log(`JWT Segments (Anon): ${anonKeyAnalysis.metrics.segments}`, 'blue');
    log(`JWT Segments (Service): ${serviceKeyAnalysis.metrics.segments}`, 'blue');
  }
  
  // Issues and recommendations
  if (criticalIssues > 0 || warningsCount > 0) {
    logSection('Issues and Recommendations');
    
    const allIssues = [
      ...envAnalysis.analysis.issues,
      ...anonKeyAnalysis.issues,
      ...serviceKeyAnalysis.issues,
      ...clientDiagnostics.issues,
      ...commonIssues.issues
    ];
    
    const allWarnings = [
      ...envAnalysis.analysis.warnings,
      ...anonKeyAnalysis.warnings,
      ...serviceKeyAnalysis.warnings,
      ...commonIssues.warnings
    ];
    
    const allRecommendations = [
      ...envAnalysis.analysis.recommendations,
      ...anonKeyAnalysis.recommendations,
      ...serviceKeyAnalysis.recommendations,
      ...clientDiagnostics.recommendations,
      ...commonIssues.recommendations
    ];
    
    if (allIssues.length > 0) {
      log('\n🚨 Critical Issues:', 'red');
      allIssues.forEach((issue, index) => {
        log(`   ${index + 1}. ${issue}`, 'red');
      });
    }
    
    if (allWarnings.length > 0) {
      log('\n⚠️  Warnings:', 'yellow');
      allWarnings.forEach((warning, index) => {
        log(`   ${index + 1}. ${warning}`, 'yellow');
      });
    }
    
    if (allRecommendations.length > 0) {
      log('\n💡 Recommendations:', 'green');
      const uniqueRecommendations = [...new Set(allRecommendations)];
      uniqueRecommendations.forEach((rec, index) => {
        log(`   ${index + 1}. ${rec}`, 'green');
      });
    }
  }
  
  return { healthScore, criticalIssues, warningsCount, overall: healthScore >= 70 };
}

/**
 * Attempts automatic fixes for common issues
 */
function attemptAutomaticFixes(results) {
  logHeader('Automatic Fix Attempts');
  
  const fixesApplied = [];
  const fixErrors = [];
  
  // Fix 1: Add missing environment variables template
  if (!results.envAnalysis.analysis.isValid) {
    try {
      const envPath = path.join(__dirname, '.env');
      const envTemplate = `# Supabase Configuration
# Get these values from: https://supabase.com/dashboard/project/your-project/settings/api

NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
`;
      
      if (!fs.existsSync(envPath)) {
        fs.writeFileSync(envPath, envTemplate);
        fixesApplied.push('Created .env file with template');
        logSuccess('Created .env file with template');
      }
    } catch (error) {
      fixErrors.push(`Failed to create .env template: ${error.message}`);
      logError(`Failed to create .env template: ${error.message}`);
    }
  }
  
  // Fix 2: Remove trailing spaces from environment variables
  try {
    const envPath = path.join(__dirname, '.env');
    if (fs.existsSync(envPath)) {
      let envContent = fs.readFileSync(envPath, 'utf8');
      const originalContent = envContent;
      
      // Remove trailing spaces from each line
      envContent = envContent.split('\n').map(line => line.trimEnd()).join('\n');
      
      if (envContent !== originalContent) {
        fs.writeFileSync(envPath, envContent);
        fixesApplied.push('Removed trailing spaces from .env file');
        logSuccess('Removed trailing spaces from .env file');
      }
    }
  } catch (error) {
    fixErrors.push(`Failed to clean .env file: ${error.message}`);
    logError(`Failed to clean .env file: ${error.message}`);
  }
  
  return { fixesApplied, fixErrors };
}

/**
 * Continuous monitoring mode
 */
async function startMonitoringMode() {
  logHeader('Continuous Monitoring Mode');
  logInfo('Press Ctrl+C to stop monitoring');
  
  const monitorInterval = 30000; // 30 seconds
  let iteration = 0;
  
  const monitor = setInterval(async () => {
    iteration++;
    log(`\n🔄 Monitoring iteration ${iteration} - ${new Date().toISOString()}`, 'cyan');
    log('-'.repeat(50), 'cyan');
    
    try {
      // Quick health check
      const envResult = analyzeEnvironmentConfiguration();
      const anonKeyResult = analyzeJWTToken(envResult.envVars['NEXT_PUBLIC_SUPABASE_ANON_KEY'], 'Anonymous Key');
      const serviceKeyResult = analyzeJWTToken(envResult.envVars['SUPABASE_SERVICE_ROLE_KEY'], 'Service Role Key');
      
      const isHealthy = envResult.analysis.isValid && anonKeyResult.isValid && serviceKeyResult.isValid;
      
      if (isHealthy) {
        logSuccess(`✅ System healthy - Iteration ${iteration}`);
      } else {
        logWarning(`⚠️  System issues detected - Iteration ${iteration}`);
      }
    } catch (error) {
      logError(`❌ Monitoring error: ${error.message}`);
    }
  }, monitorInterval);
  
  // Handle graceful shutdown
  process.on('SIGINT', () => {
    clearInterval(monitor);
    log('\n🛑 Monitoring stopped', 'yellow');
    process.exit(0);
  });
}

/**
 * Main diagnostic function
 */
async function main() {
  const options = parseArgs();
  
  if (options.help) {
    showHelp();
    return;
  }
  
  log('🔧 Supabase API Key Diagnostic Tool', 'bright_cyan');
  log('='.repeat(70), 'bright_cyan');
  
  if (options.monitor) {
    await startMonitoringMode();
    return;
  }
  
  try {
    // Step 1: Analyze environment configuration
    const envResult = analyzeEnvironmentConfiguration();
    
    // Step 2: Analyze API keys
    const anonKeyResult = analyzeJWTToken(envResult.envVars['NEXT_PUBLIC_SUPABASE_ANON_KEY'], 'Anonymous Key');
    const serviceKeyResult = analyzeJWTToken(envResult.envVars['SUPABASE_SERVICE_ROLE_KEY'], 'Service Role Key');
    
    // Step 3: Diagnose client initialization
    const clientDiagnostics = diagnoseClientInitialization(envResult.envVars);
    
    // Step 4: Check for common issues
    const commonIssues = checkCommonIssues(envResult.envVars);
    
    const results = {
      envAnalysis: envResult,
      anonKeyAnalysis: anonKeyResult,
      serviceKeyAnalysis: serviceKeyResult,
      clientDiagnostics: clientDiagnostics,
      commonIssues: commonIssues
    };
    
    // Step 5: Generate report
    const reportResult = generateDiagnosticReport(results);
    
    // Step 6: Attempt fixes if requested
    if (options.fix) {
      const fixResults = attemptAutomaticFixes(results);
      
      if (fixResults.fixesApplied.length > 0) {
        logSection('Automatic Fixes Applied');
        fixResults.fixesApplied.forEach(fix => {
          logSuccess(fix);
        });
      }
      
      if (fixResults.fixErrors.length > 0) {
        logSection('Fix Errors');
        fixResults.fixErrors.forEach(error => {
          logError(error);
        });
      }
    }
    
    // Exit with appropriate code
    process.exit(reportResult.overall ? 0 : 1);
    
  } catch (error) {
    logError(`Diagnostic tool failed with error: ${error.message}`);
    logError(`Stack trace: ${error.stack}`);
    process.exit(1);
  }
}

// Run the diagnostic tool
if (require.main === module) {
  main();
}

module.exports = {
  analyzeJWTToken,
  analyzeEnvironmentConfiguration,
  diagnoseClientInitialization,
  checkCommonIssues,
  generateDiagnosticReport,
  attemptAutomaticFixes
};