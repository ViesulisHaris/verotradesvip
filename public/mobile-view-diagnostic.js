// Mobile View Diagnostic Tool
// This script helps identify why the application is stuck in mobile view on desktop

console.log('🔍 MOBILE VIEW DIAGNOSTIC TOOL STARTED');
console.log('=====================================');

// 1. Viewport and Screen Information
function checkViewport() {
  console.log('\n📱 VIEWPORT & SCREEN INFO:');
  console.log('Window innerWidth:', window.innerWidth);
  console.log('Window innerHeight:', window.innerHeight);
  console.log('Screen width:', screen.width);
  console.log('Screen height:', screen.height);
  console.log('Device pixel ratio:', window.devicePixelRatio);
  
  // Check viewport meta tag
  const viewportMeta = document.querySelector('meta[name="viewport"]');
  if (viewportMeta) {
    console.log('✅ Viewport meta tag found:', viewportMeta.getAttribute('content'));
  } else {
    console.log('❌ Viewport meta tag NOT FOUND - This is likely the problem!');
  }
  
  // Check if window width matches expected desktop size
  if (window.innerWidth >= 1024) {
    console.log('✅ Window width indicates desktop view (≥1024px)');
  } else {
    console.log('❌ Window width indicates mobile view (<1024px)');
  }
}

// 2. CSS Media Query Testing
function checkMediaQueries() {
  console.log('\n🎨 CSS MEDIA QUERIES:');
  
  const queries = [
    { name: 'sm', query: '(min-width: 640px)' },
    { name: 'md', query: '(min-width: 768px)' },
    { name: 'lg', query: '(min-width: 1024px)' },
    { name: 'xl', query: '(min-width: 1280px)' },
    { name: '2xl', query: '(min-width: 1536px)' }
  ];
  
  queries.forEach(({ name, query }) => {
    const matches = window.matchMedia(query).matches;
    console.log(`${name.toUpperCase()} (${query}): ${matches ? '✅ ACTIVE' : '❌ INACTIVE'}`);
  });
}

// 3. Responsive Classes Detection
function checkResponsiveClasses() {
  console.log('\n🏗️ RESPONSIVE CLASSES DETECTION:');
  
  // Check if desktop sidebar is visible
  const desktopSidebar = document.querySelector('.hidden.lg\\:flex');
  if (desktopSidebar) {
    const computedStyle = window.getComputedStyle(desktopSidebar);
    const isVisible = computedStyle.display !== 'none';
    console.log('Desktop sidebar visibility:', isVisible ? '✅ VISIBLE' : '❌ HIDDEN');
    console.log('Desktop sidebar display property:', computedStyle.display);
  } else {
    console.log('❌ Desktop sidebar element not found');
  }
  
  // Check if mobile sidebar is hidden on desktop
  const mobileSidebar = document.querySelector('.lg\\:hidden');
  if (mobileSidebar) {
    const computedStyle = window.getComputedStyle(mobileSidebar);
    const isHidden = computedStyle.display === 'none';
    console.log('Mobile sidebar visibility:', isHidden ? '✅ HIDDEN (correct)' : '❌ VISIBLE (wrong)');
  } else {
    console.log('❌ Mobile sidebar element not found');
  }
  
  // Check main content margin
  const mainContent = document.querySelector('.lg\\:ml-64');
  if (mainContent) {
    const computedStyle = window.getComputedStyle(mainContent);
    console.log('Main content margin-left:', computedStyle.marginLeft);
    console.log('Expected desktop margin: 256px (16rem)');
  } else {
    console.log('❌ Main content with desktop margin not found');
  }
}

// 4. CSS Variables and Custom Properties
function checkCSSVariables() {
  console.log('\n🎯 CSS VARIABLES:');
  
  const root = document.documentElement;
  const computedStyle = getComputedStyle(root);
  
  // Check if CSS variables are properly set
  const variables = [
    '--breakpoint-sm',
    '--breakpoint-md', 
    '--breakpoint-lg',
    '--breakpoint-xl',
    '--breakpoint-2xl'
  ];
  
  variables.forEach(variable => {
    const value = computedStyle.getPropertyValue(variable);
    console.log(`${variable}: ${value || '❌ NOT SET'}`);
  });
}

// 5. Browser and Device Detection
function checkBrowserInfo() {
  console.log('\n🌐 BROWSER & DEVICE INFO:');
  console.log('User agent:', navigator.userAgent);
  console.log('Platform:', navigator.platform);
  
  // Check for touch capability (might affect responsive behavior)
  console.log('Touch capability:', 'ontouchstart' in window ? '✅ TOUCH' : '❌ NO TOUCH');
  
  // Check for mobile user agent
  const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  console.log('Mobile user agent detected:', isMobileUA ? '❌ YES' : '✅ NO');
}

// 6. Layout Structure Analysis
function checkLayoutStructure() {
  console.log('\n📐 LAYOUT STRUCTURE:');
  
  // Check body overflow
  const bodyStyle = getComputedStyle(document.body);
  console.log('Body overflow:', bodyStyle.overflow);
  console.log('Body overflow-x:', bodyStyle.overflowX);
  
  // Check for container max-width constraints
  const containers = document.querySelectorAll('[class*="container"], [class*="max-w"]');
  console.log(`Found ${containers.length} container elements`);
  
  containers.forEach((container, index) => {
    const style = getComputedStyle(container);
    console.log(`Container ${index + 1}: max-width=${style.maxWidth}, width=${style.width}`);
  });
}

// 7. Potential Issues Detection
function detectIssues() {
  console.log('\n🚨 POTENTIAL ISSUES DETECTION:');
  
  const issues = [];
  
  // Check viewport meta tag
  const viewportMeta = document.querySelector('meta[name="viewport"]');
  if (!viewportMeta) {
    issues.push('❌ Missing viewport meta tag');
  }
  
  // Check window size
  if (window.innerWidth < 1024) {
    issues.push('❌ Browser window width is less than desktop breakpoint (1024px)');
  }
  
  // Check for CSS that might be forcing mobile view
  const bodyStyle = getComputedStyle(document.body);
  if (bodyStyle.width === '100vw' && bodyStyle.maxWidth && parseInt(bodyStyle.maxWidth) < 1024) {
    issues.push('❌ Body has max-width constraint forcing mobile view');
  }
  
  // Check for zoom level issues
  const zoomLevel = window.outerWidth / window.innerWidth;
  if (Math.abs(zoomLevel - 1) > 0.1) {
    issues.push(`❌ Browser zoom level detected: ${(zoomLevel * 100).toFixed(0)}%`);
  }
  
  if (issues.length === 0) {
    console.log('✅ No obvious issues detected');
  } else {
    issues.forEach(issue => console.log(issue));
  }
  
  return issues;
}

// 8. Generate Recommendations
function generateRecommendations(issues) {
  console.log('\n💡 RECOMMENDATIONS:');
  
  if (issues.some(issue => issue.includes('viewport'))) {
    console.log('1. Add viewport meta tag: <meta name="viewport" content="width=device-width, initial-scale=1">');
  }
  
  if (issues.some(issue => issue.includes('window width'))) {
    console.log('2. Resize browser window to at least 1024px width for desktop view');
  }
  
  if (issues.some(issue => issue.includes('max-width'))) {
    console.log('3. Remove or adjust max-width constraints on body/container elements');
  }
  
  if (issues.some(issue => issue.includes('zoom'))) {
    console.log('4. Reset browser zoom level to 100% (Ctrl+0 or Cmd+0)');
  }
  
  console.log('5. Check browser developer tools for responsive design mode');
  console.log('6. Clear browser cache and hard refresh (Ctrl+Shift+R or Cmd+Shift+R)');
}

// Main diagnostic function
function runDiagnostic() {
  console.log('Running comprehensive mobile view diagnostic...\n');
  
  checkViewport();
  checkMediaQueries();
  checkResponsiveClasses();
  checkCSSVariables();
  checkBrowserInfo();
  checkLayoutStructure();
  const issues = detectIssues();
  generateRecommendations(issues);
  
  console.log('\n🔍 DIAGNOSTIC COMPLETE');
  console.log('=====================================');
  
  // Return results for programmatic use
  return {
    windowWidth: window.innerWidth,
    windowHeight: window.innerHeight,
    isDesktopSize: window.innerWidth >= 1024,
    issues: issues,
    timestamp: new Date().toISOString()
  };
}

// Auto-run diagnostic when page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', runDiagnostic);
} else {
  runDiagnostic();
}

// Also run diagnostic when window is resized
let resizeTimeout;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
    console.log('\n🔄 WINDOW RESIZED - RERUNNING DIAGNOSTIC');
    runDiagnostic();
  }, 500);
});

// Make diagnostic available globally for manual triggering
window.mobileViewDiagnostic = runDiagnostic;
console.log('💡 Tip: Run window.mobileViewDiagnostic() anytime to re-run diagnostic');