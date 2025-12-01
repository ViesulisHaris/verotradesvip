#!/usr/bin/env node

/**
 * Build-time environment variable validation script
 * This script validates that all required environment variables are present and properly formatted
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
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function validateSupabaseKey(key, keyName) {
  if (!key) {
    log(`❌ ${keyName} is missing`, 'red');
    return false;
  }

  // Check if it's a valid JWT format (starts with eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9)
  if (!key.startsWith('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9')) {
    log(`❌ ${keyName} has invalid format. Expected JWT token starting with 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9'`, 'red');
    log(`   Current format: ${key.substring(0, 20)}...`, 'red');
    return false;
  }

  // Check if it has the correct JWT structure (3 parts separated by dots)
  const parts = key.split('.');
  if (parts.length !== 3) {
    log(`❌ ${keyName} has invalid JWT structure. Expected 3 parts separated by dots`, 'red');
    return false;
  }

  log(`✅ ${keyName} is properly formatted`, 'green');
  return true;
}

function validateSupabaseUrl(url) {
  if (!url) {
    log('❌ NEXT_PUBLIC_SUPABASE_URL is missing', 'red');
    return false;
  }

  try {
    const urlObj = new URL(url);
    if (!urlObj.hostname.includes('supabase')) {
      log(`❌ NEXT_PUBLIC_SUPABASE_URL should be a Supabase URL`, 'red');
      return false;
    }
    log(`✅ NEXT_PUBLIC_SUPABASE_URL is properly formatted`, 'green');
    return true;
  } catch (error) {
    log(`❌ NEXT_PUBLIC_SUPABASE_URL is not a valid URL: ${error.message}`, 'red');
    return false;
  }
}

function validateEnvironmentFile() {
  const envPath = path.join(process.cwd(), '.env');
  
  if (!fs.existsSync(envPath)) {
    log('❌ .env file not found', 'red');
    return false;
  }

  const envContent = fs.readFileSync(envPath, 'utf8');
  const lines = envContent.split('\n').filter(line => line.trim() && !line.startsWith('#'));

  const requiredVars = {
    'NEXT_PUBLIC_SUPABASE_URL': null,
    'NEXT_PUBLIC_SUPABASE_ANON_KEY': null,
    'SUPABASE_SERVICE_ROLE_KEY': null
  };

  // Parse environment variables from file
  lines.forEach(line => {
    const [key, ...valueParts] = line.split('=');
    const value = valueParts.join('=').trim();
    if (requiredVars.hasOwnProperty(key)) {
      requiredVars[key] = value;
    }
  });

  log('\n🔍 Validating environment variables...', 'blue');
  
  let allValid = true;

  // Validate Supabase URL
  if (!validateSupabaseUrl(requiredVars['NEXT_PUBLIC_SUPABASE_URL'])) {
    allValid = false;
  }

  // Validate Supabase Anonymous Key
  if (!validateSupabaseKey(requiredVars['NEXT_PUBLIC_SUPABASE_ANON_KEY'], 'NEXT_PUBLIC_SUPABASE_ANON_KEY')) {
    allValid = false;
  }

  // Validate Service Role Key (optional but recommended)
  if (requiredVars['SUPABASE_SERVICE_ROLE_KEY']) {
    validateSupabaseKey(requiredVars['SUPABASE_SERVICE_ROLE_KEY'], 'SUPABASE_SERVICE_ROLE_KEY');
  } else {
    log('⚠️  SUPABASE_SERVICE_ROLE_KEY is missing (optional but recommended)', 'yellow');
  }

  return allValid;
}

function main() {
  log('\n🚀 Environment Variable Validation', 'cyan');
  log('================================', 'cyan');

  const isValid = validateEnvironmentFile();

  if (isValid) {
    log('\n✅ All environment variables are valid!', 'green');
    log('🎉 Build can proceed safely', 'green');
    process.exit(0);
  } else {
    log('\n❌ Environment variable validation failed!', 'red');
    log('🛑 Please fix the issues above before proceeding with the build', 'red');
    process.exit(1);
  }
}

// Run validation if this script is executed directly
if (require.main === module) {
  main();
}

module.exports = { validateEnvironmentFile };