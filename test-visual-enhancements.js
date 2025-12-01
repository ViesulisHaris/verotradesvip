
// Test script to verify visual enhancements are working
console.log('🧪 Testing visual enhancements...');

// Check if glass-enhanced class is applied
const glassElements = document.querySelectorAll('.glass-enhanced');
console.log('Found glass-enhanced elements:', glassElements.length);

// Check if chart containers have enhanced styling
const chartContainers = document.querySelectorAll('.chart-container-enhanced');
console.log('Found chart-container-enhanced elements:', chartContainers.length);

// Check if backdrop-filter is supported
const testElement = document.createElement('div');
testElement.style.backdropFilter = 'blur(10px)';
const backdropFilterSupported = testElement.style.backdropFilter !== '';
console.log('Backdrop filter supported:', backdropFilterSupported);

// Check computed styles
if (glassElements.length > 0) {
  const firstGlassElement = glassElements[0];
  const computedStyle = window.getComputedStyle(firstGlassElement);
  console.log('Glass element computed styles:', {
    backdropFilter: computedStyle.backdropFilter,
    background: computedStyle.background,
    border: computedStyle.border
  });
}

console.log('✅ Visual enhancement test completed');
