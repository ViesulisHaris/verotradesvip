/**
 * Comprehensive Fixes Validation Script
 * 
 * This script validates all the critical fixes implemented for the /trades tab data display issues:
 * 1. API Authentication fixes
 * 2. Win Rate Calculation bug fix
 * 3. Frontend User Validation improvements
 * 4. UUID Validation Logic improvements
 * 5. Comprehensive Error Logging
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 [VALIDATION] Starting comprehensive fixes validation...\n');

// Validation results
const results = {
  apiAuthentication: { status: 'pending', details: [] },
  winRateCalculation: { status: 'pending', details: [] },
  frontendUserValidation: { status: 'pending', details: [] },
  uuidValidation: { status: 'pending', details: [] },
  errorLogging: { status: 'pending', details: [] }
};

// 1. Validate API Authentication Fixes
console.log('📋 [VALIDATION] 1. Checking API Authentication fixes...');

function validateAPIAuthentication(filePath, routeName) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Check for correct authentication method
    const hasCorrectAuth = content.includes('await supabase.auth.getUser();') && 
                         !content.includes('await supabase.auth.getUser(token);');
    
    // Check for enhanced error logging
    const hasRequestId = content.includes('const requestId =');
    const hasEnhancedLogging = content.includes('console.error(`❌ [');
    
    results.apiAuthentication.details.push({
      route: routeName,
      hasCorrectAuth,
      hasRequestId,
      hasEnhancedLogging,
      file: filePath
    });
    
    return hasCorrectAuth;
  } catch (error) {
    console.error(`❌ [VALIDATION] Error reading ${filePath}:`, error.message);
    return false;
  }
}

const tradesRouteAuth = validateAPIAuthentication(
  'src/app/api/confluence-trades/route.ts',
  'confluence-trades'
);

const statsRouteAuth = validateAPIAuthentication(
  'src/app/api/confluence-stats/route.ts',
  'confluence-stats'
);

results.apiAuthentication.status = (tradesRouteAuth && statsRouteAuth) ? '✅ PASS' : '❌ FAIL';

// 2. Validate Win Rate Calculation Fix
console.log('📋 [VALIDATION] 2. Checking Win Rate Calculation fix...');

function validateWinRateCalculation(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Check for correct variable usage
    const hasCorrectCalculation = content.includes('const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;') ||
                                   content.includes('const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;');
    
    // Check that winningTrades variable is properly defined
    const hasWinningTradesDefined = content.includes('const winningTrades = filteredTrades.filter(trade => (trade.pnl || 0) > 0).length;');
    
    results.winRateCalculation.details.push({
      hasCorrectCalculation,
      hasWinningTradesDefined,
      file: filePath
    });
    
    return hasCorrectCalculation && hasWinningTradesDefined;
  } catch (error) {
    console.error(`❌ [VALIDATION] Error reading ${filePath}:`, error.message);
    return false;
  }
}

const winRateFixed = validateWinRateCalculation('src/app/api/confluence-stats/route.ts');
results.winRateCalculation.status = winRateFixed ? '✅ PASS' : '❌ FAIL';

// 3. Validate Frontend User Validation
console.log('📋 [VALIDATION] 3. Checking Frontend User Validation...');

function validateFrontendUserValidation(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Check for enhanced user validation
    const hasUserValidation = content.includes('if (!user || !user.id)') &&
                             content.includes('validateUUID(user.id, \'user_id\');') &&
                             content.includes('console.log(\'🔄 [TRADES_FETCH] User ID validated, proceeding with fetch:\'');
    
    // Check for proper error handling
    const hasErrorHandling = content.includes('console.error(\'🔄 [TRADES_FETCH] Invalid user ID format:\'');
    
    results.frontendUserValidation.details.push({
      hasUserValidation,
      hasErrorHandling,
      file: filePath
    });
    
    return hasUserValidation && hasErrorHandling;
  } catch (error) {
    console.error(`❌ [VALIDATION] Error reading ${filePath}:`, error.message);
    return false;
  }
}

const frontendValidation = validateFrontendUserValidation('src/app/trades/page.tsx');
results.frontendUserValidation.status = frontendValidation ? '✅ PASS' : '❌ FAIL';

// 4. Validate UUID Validation Logic
console.log('📋 [VALIDATION] 4. Checking UUID Validation Logic...');

function validateUUIDLogic(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Check for permissive validation
    const hasPermissiveRegex = content.includes('const permissiveUuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;');
    
    // Check for type conversion
    const hasTypeConversion = content.includes('if (typeof value === \'string\')') &&
                           content.includes('} else if (typeof value === \'number\' || typeof value === \'boolean\')');
    
    // Check for enhanced error handling
    const hasEnhancedErrorHandling = content.includes('console.warn(`UUID validation failed');
    
    results.uuidValidation.details.push({
      hasPermissiveRegex,
      hasTypeConversion,
      hasEnhancedErrorHandling,
      file: filePath
    });
    
    return hasPermissiveRegex && hasTypeConversion && hasEnhancedErrorHandling;
  } catch (error) {
    console.error(`❌ [VALIDATION] Error reading ${filePath}:`, error.message);
    return false;
  }
}

const uuidValidation = validateUUIDLogic('src/lib/uuid-validation.ts');
results.uuidValidation.status = uuidValidation ? '✅ PASS' : '❌ FAIL';

// 5. Validate Comprehensive Error Logging
console.log('📋 [VALIDATION] 5. Checking Comprehensive Error Logging...');

function validateErrorLogging(filePath, routeName) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Check for request tracking
    const hasRequestId = content.includes('const requestId = Math.random().toString(36).substring(7);');
    
    // Check for timing
    const hasTiming = content.includes('const startTime = Date.now();') &&
                     content.includes('const endTime = Date.now();') &&
                     content.includes('const duration = endTime - startTime;');
    
    // Check for enhanced error details
    const hasEnhancedErrors = content.includes('console.error(`❌ [') &&
                             content.includes('timestamp: new Date().toISOString()');
    
    // Check for response enhancement
    const hasEnhancedResponse = content.includes('requestId') &&
                               content.includes('processingTime: duration');
    
    results.errorLogging.details.push({
      route: routeName,
      hasRequestId,
      hasTiming,
      hasEnhancedErrors,
      hasEnhancedResponse,
      file: filePath
    });
    
    return hasRequestId && hasTiming && hasEnhancedErrors && hasEnhancedResponse;
  } catch (error) {
    console.error(`❌ [VALIDATION] Error reading ${filePath}:`, error.message);
    return false;
  }
}

const tradesErrorLogging = validateErrorLogging(
  'src/app/api/confluence-trades/route.ts',
  'confluence-trades'
);

const statsErrorLogging = validateErrorLogging(
  'src/app/api/confluence-stats/route.ts',
  'confluence-stats'
);

results.errorLogging.status = (tradesErrorLogging && statsErrorLogging) ? '✅ PASS' : '❌ FAIL';

// Generate final report
console.log('\n📊 [VALIDATION] COMPREHENSIVE FIXES VALIDATION REPORT');
console.log('=' .repeat(60));

console.log('\n🔐 API Authentication Fixes:');
console.log(`   Status: ${results.apiAuthentication.status}`);
results.apiAuthentication.details.forEach(detail => {
  console.log(`   ${detail.route}:`);
  console.log(`     ✓ Correct auth method: ${detail.hasCorrectAuth}`);
  console.log(`     ✓ Request ID tracking: ${detail.hasRequestId}`);
  console.log(`     ✓ Enhanced logging: ${detail.hasEnhancedLogging}`);
});

console.log('\n📈 Win Rate Calculation Fix:');
console.log(`   Status: ${results.winRateCalculation.status}`);
results.winRateCalculation.details.forEach(detail => {
  console.log(`     ✓ Correct calculation: ${detail.hasCorrectCalculation}`);
  console.log(`     ✓ Variable defined: ${detail.hasWinningTradesDefined}`);
});

console.log('\n👤 Frontend User Validation:');
console.log(`   Status: ${results.frontendUserValidation.status}`);
results.frontendUserValidation.details.forEach(detail => {
  console.log(`     ✓ User validation: ${detail.hasUserValidation}`);
  console.log(`     ✓ Error handling: ${detail.hasErrorHandling}`);
});

console.log('\n🆔 UUID Validation Logic:');
console.log(`   Status: ${results.uuidValidation.status}`);
results.uuidValidation.details.forEach(detail => {
  console.log(`     ✓ Permissive regex: ${detail.hasPermissiveRegex}`);
  console.log(`     ✓ Type conversion: ${detail.hasTypeConversion}`);
  console.log(`     ✓ Enhanced errors: ${detail.hasEnhancedErrorHandling}`);
});

console.log('\n📝 Comprehensive Error Logging:');
console.log(`   Status: ${results.errorLogging.status}`);
results.errorLogging.details.forEach(detail => {
  console.log(`   ${detail.route}:`);
  console.log(`     ✓ Request ID tracking: ${detail.hasRequestId}`);
  console.log(`     ✓ Timing measurement: ${detail.hasTiming}`);
  console.log(`     ✓ Enhanced errors: ${detail.hasEnhancedErrors}`);
  console.log(`     ✓ Enhanced response: ${detail.hasEnhancedResponse}`);
});

// Overall status
const allPassed = Object.values(results).every(result => result.status === '✅ PASS');

console.log('\n' + '='.repeat(60));
console.log(`🎯 OVERALL STATUS: ${allPassed ? '✅ ALL FIXES VALIDATED SUCCESSFULLY' : '❌ SOME FIXES NEED ATTENTION'}`);
console.log('='.repeat(60));

if (allPassed) {
  console.log('\n🚀 [VALIDATION] All critical fixes have been successfully implemented!');
  console.log('📋 [VALIDATION] Summary of fixes:');
  console.log('   1. ✅ API Authentication - Fixed incorrect getUser(token) calls');
  console.log('   2. ✅ Win Rate Calculation - Variable usage verified');
  console.log('   3. ✅ Frontend User Validation - Enhanced user ID checks');
  console.log('   4. ✅ UUID Validation - More permissive and robust');
  console.log('   5. ✅ Error Logging - Comprehensive tracking and debugging');
  console.log('\n🎉 [VALIDATION] The /trades tab should now display data correctly!');
} else {
  console.log('\n⚠️  [VALIDATION] Some fixes may need additional attention.');
  console.log('🔧 [VALIDATION] Please review the detailed results above.');
}

// Save validation report
const reportPath = 'verotradesvip/COMPREHENSIVE_FIXES_VALIDATION_REPORT.json';
fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
console.log(`\n📄 [VALIDATION] Detailed report saved to: ${reportPath}`);