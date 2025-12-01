// Debug script to diagnose visual enhancement rendering issues
// Run this in the browser console on the dashboard page

console.log('🔍 [VISUAL_DEBUG] Starting visual enhancement diagnosis...');

// 1. Check authentication state
console.log('🔍 [AUTH_DEBUG] Checking authentication state...');
if (typeof window !== 'undefined' && window.supabase) {
  window.supabase.auth.getUser().then(({ data, error }) => {
    console.log('🔍 [AUTH_DEBUG] User data:', data);
    console.log('🔍 [AUTH_DEBUG] Auth error:', error);
  }).catch(err => {
    console.log('🔍 [AUTH_DEBUG] Auth check failed:', err);
  });
} else {
  console.log('🔍 [AUTH_DEBUG] Supabase not available in window');
}

// 2. Check if components are in the DOM
console.log('🔍 [DOM_DEBUG] Checking for components in DOM...');
const components = [
  { name: 'DashboardCard', selector: '[class*="group"], [class*="rounded-xl"]' },
  { name: 'EmotionRadar', selector: '.recharts-wrapper, .ResponsiveContainer' },
  { name: 'PnLChart', selector: '.recharts-wrapper, .ResponsiveContainer' },
  { name: 'SharpeRatioGauge', selector: '[class*="sharpe"], [class*="gauge"]' },
  { name: 'DominantEmotionCard', selector: '[class*="emotion"], [class*="dominant"]' },
  { name: 'VRatingCard', selector: '[class*="vrating"], [class*="performance"]' }
];

components.forEach(comp => {
  const elements = document.querySelectorAll(comp.selector);
  console.log(`🔍 [DOM_DEBUG] ${comp.name}: Found ${elements.length} elements`);
  if (elements.length > 0) {
    console.log(`🔍 [DOM_DEBUG] ${comp.name} sample element:`, elements[0]);
  }
});

// 3. Check for CSS styles
console.log('🔍 [CSS_DEBUG] Checking for CSS styles...');
const testElement = document.createElement('div');
testElement.className = 'test-backdrop-blur';
testElement.style.cssText = 'backdrop-filter: blur(20px);';
document.body.appendChild(testElement);

const computedStyle = window.getComputedStyle(testElement);
const backdropFilter = computedStyle.backdropFilter;
console.log('🔍 [CSS_DEBUG] backdrop-filter support:', backdropFilter);
document.body.removeChild(testElement);

// 4. Check for Tailwind classes
console.log('🔍 [CSS_DEBUG] Checking for Tailwind classes...');
const tailwindTest = document.querySelector('.bg-gradient-to-br');
console.log('🔍 [CSS_DEBUG] Tailwind gradient classes found:', !!tailwindTest);

// 5. Check for glass morphism effects
console.log('🔍 [CSS_DEBUG] Checking for glass morphism effects...');
const glassElements = document.querySelectorAll('[style*="backdrop-filter"]');
console.log('🔍 [CSS_DEBUG] Elements with backdrop-filter:', glassElements.length);

// 6. Check for animation keyframes
console.log('🔍 [CSS_DEBUG] Checking for animation keyframes...');
const styleSheets = Array.from(document.styleSheets);
let animationFound = false;
styleSheets.forEach(sheet => {
  try {
    const rules = Array.from(sheet.cssRules || sheet.rules || []);
    rules.forEach(rule => {
      if (rule.cssText && rule.cssText.includes('float') && rule.cssText.includes('animation')) {
        animationFound = true;
        console.log('🔍 [CSS_DEBUG] Animation found:', rule.cssText);
      }
    });
  } catch (e) {
    console.log('🔍 [CSS_DEBUG] Could not read stylesheet:', e);
  }
});
console.log('🔍 [CSS_DEBUG] Animation keyframes found:', animationFound);

// 7. Check for React component mounting
console.log('🔍 [REACT_DEBUG] Checking React component mounting...');
if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
  console.log('🔍 [REACT_DEBUG] React DevTools available');
  const reactRoot = document.querySelector('[data-reactroot]');
  console.log('🔍 [REACT_DEBUG] React root element:', reactRoot);
} else {
  console.log('🔍 [REACT_DEBUG] React DevTools not available');
}

// 8. Check for JavaScript errors
console.log('🔍 [JS_DEBUG] Checking for JavaScript errors...');
const originalError = console.error;
console.error = function(...args) {
  originalError.apply(console, args);
  console.log('🔍 [JS_DEBUG] JavaScript error:', args);
};

// 9. Check for data availability
console.log('🔍 [DATA_DEBUG] Checking for data availability...');
const dashboardElement = document.querySelector('[class*="dashboard"]');
if (dashboardElement) {
  console.log('🔍 [DATA_DEBUG] Dashboard element found');
  // Check if there are any data attributes or state
  console.log('🔍 [DATA_DEBUG] Dashboard element dataset:', dashboardElement.dataset);
} else {
  console.log('🔍 [DATA_DEBUG] Dashboard element not found');
}

console.log('🔍 [VISUAL_DEBUG] Diagnosis complete. Check the logs above for issues.');