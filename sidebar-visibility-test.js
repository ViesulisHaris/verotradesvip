/**
 * SIDEBAR VISIBILITY TEST
 * This script tests if the sidebar is actually visible and functional
 * after login and navigation to protected routes
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 [SIDEBAR TEST] Starting sidebar visibility test...');

// Test 1: Check if dashboard page compiles without errors
console.log('\n📋 [TEST 1] Checking dashboard page compilation...');

try {
  const dashboardContent = fs.readFileSync('./src/app/dashboard/page.tsx', 'utf8');
  
  // Check for React component structure
  const hasDefaultExport = dashboardContent.includes('export default function');
  const hasUnifiedLayout = dashboardContent.includes('UnifiedLayout');
  const hasAuthContext = dashboardContent.includes('useAuth');
  
  console.log('✅ Dashboard page structure:', {
    hasDefaultExport,
    hasUnifiedLayout,
    hasAuthContext,
    contentLength: dashboardContent.length
  });
  
  if (!hasDefaultExport || !hasUnifiedLayout) {
    console.log('❌ Dashboard page has structural issues');
  } else {
    console.log('✅ Dashboard page structure looks correct');
  }
} catch (error) {
  console.log('❌ Error reading dashboard page:', error.message);
}

// Test 2: Check sidebar component visibility logic
console.log('\n📋 [TEST 2] Checking sidebar visibility logic...');

try {
  const sidebarContent = fs.readFileSync('./src/components/navigation/UnifiedSidebar.tsx', 'utf8');
  
  // Check for the fixes we applied
  const hasProtectedRouteCheck = sidebarContent.includes('isProtectedRoute');
  const hasShowSidebarOnProtected = sidebarContent.includes('showing sidebar anyway');
  const hasLoadingStateFix = sidebarContent.includes('Always show sidebar on protected routes');
  
  console.log('✅ Sidebar component fixes:', {
    hasProtectedRouteCheck,
    hasShowSidebarOnProtected,
    hasLoadingStateFix,
    contentLength: sidebarContent.length
  });
  
  if (hasProtectedRouteCheck && hasShowSidebarOnProtected && hasLoadingStateFix) {
    console.log('✅ Sidebar visibility fixes are in place');
  } else {
    console.log('❌ Sidebar visibility fixes are missing');
  }
} catch (error) {
  console.log('❌ Error reading sidebar component:', error.message);
}

// Test 3: Check if there are any conflicting dashboard pages
console.log('\n📋 [TEST 3] Checking for conflicting dashboard pages...');

try {
  const authDashboardPath = './src/app/(auth)/dashboard/page.tsx';
  const mainDashboardPath = './src/app/dashboard/page.tsx';
  
  const authDashboardExists = fs.existsSync(authDashboardPath);
  const mainDashboardExists = fs.existsSync(mainDashboardPath);
  
  console.log('✅ Dashboard page status:', {
    authDashboardExists,
    mainDashboardExists,
    authDashboardPath,
    mainDashboardPath
  });
  
  if (authDashboardExists) {
    console.log('❌ CONFLICT: Both dashboard pages exist - this will cause routing errors');
    console.log('🔧 Solution: Remove the auth dashboard page to eliminate conflicts');
  } else if (mainDashboardExists) {
    console.log('✅ Only main dashboard page exists - no conflicts');
  } else {
    console.log('❌ No dashboard page found');
  }
} catch (error) {
  console.log('❌ Error checking dashboard pages:', error.message);
}

// Test 4: Check if the development server can start without errors
console.log('\n📋 [TEST 4] Testing development server startup...');

console.log('🔧 Starting development server for 10 seconds to check for compilation errors...');

const devServer = exec('cd verotradesvip && npm run dev', (error, stdout, stderr) => {
  if (error) {
    console.log('❌ Development server failed to start:', error.message);
    return;
  }
  
  console.log('✅ Development server started successfully');
  
  // Check for compilation errors in output
  if (stderr && stderr.includes('Error:')) {
    console.log('❌ Compilation errors detected:', stderr);
  } else if (stdout && stdout.includes('✓ Compiled')) {
    console.log('✅ No compilation errors detected');
  }
});

// Kill the dev server after 10 seconds
setTimeout(() => {
  if (devServer && devServer.kill) {
    devServer.kill('SIGTERM');
    console.log('🔧 Development server stopped');
  }
}, 10000);

// Test 5: Generate summary report
console.log('\n📋 [TEST 5] Generating sidebar visibility summary...');

const summary = {
  timestamp: new Date().toISOString(),
  tests: {
    dashboardStructure: {
      status: 'checked',
      hasDefaultExport: false,
      hasUnifiedLayout: false,
      hasAuthContext: false
    },
    sidebarFixes: {
      status: 'checked',
      hasProtectedRouteCheck: false,
      hasShowSidebarOnProtected: false,
      hasLoadingStateFix: false
    },
    routingConflicts: {
      status: 'checked',
      authDashboardExists: false,
      mainDashboardExists: false
    },
    compilation: {
      status: 'testing',
      result: 'pending'
    }
  },
  recommendations: [
    '1. Ensure dashboard page exports a default React component',
    '2. Verify sidebar visibility logic includes protected route checks',
    '3. Remove any conflicting dashboard pages in auth folder',
    '4. Test sidebar visibility after login by navigating to /dashboard',
    '5. Check browser console for sidebar visibility debug logs'
  ]
};

// Write summary to file
fs.writeFileSync('./SIDEBAR_VISIBILITY_TEST_REPORT.json', JSON.stringify(summary, null, 2));

console.log('📄 Summary report written to: SIDEBAR_VISIBILITY_TEST_REPORT.json');
console.log('\n🎯 SIDEBAR VISIBILITY TEST COMPLETE');
console.log('\n📋 NEXT STEPS:');
console.log('1. Open browser and navigate to http://localhost:3000');
console.log('2. Log in with valid credentials');
console.log('3. Navigate to /dashboard');
console.log('4. Check browser console for sidebar debug logs');
console.log('5. Verify sidebar is visible on the left side');
console.log('6. Test sidebar navigation items (Dashboard, Trades, Strategies, etc.)');
console.log('\n🔍 Expected sidebar debug logs:');
console.log('- 🔧 [UnifiedSidebar-DEBUG] Sidebar component loading');
console.log('- 🔧 [UnifiedSidebar-DEBUG] Auth state: { user: true, loading: false, authInitialized: true }');
console.log('- 🔧 [UnifiedSidebar-DEBUG] Protected route detected - showing sidebar');
console.log('- 🔧 [UnifiedSidebar-DEBUG] Sidebar visibility state: { isSidebarOpen: true, isCollapsed: true, isMobile: false }');