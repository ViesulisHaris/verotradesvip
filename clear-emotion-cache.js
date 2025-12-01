// Clear emotion data cache to ensure new logic is applied
console.log('🧹 Clearing emotion data cache...');

// This will clear the memoization cache when the dashboard loads
if (typeof window !== 'undefined') {
  // Clear localStorage cache
  localStorage.removeItem('emotionDataCache');
  localStorage.removeItem('tradeDataCache');
  
  // Clear any other relevant cache keys
  Object.keys(localStorage).forEach(key => {
    if (key.includes('emotion') || key.includes('trade') || key.includes('dashboard')) {
      localStorage.removeItem(key);
      console.log(`Removed cache key: ${key}`);
    }
  });
  
  console.log('✅ Cache cleared successfully');
} else {
  console.log('⚠️ This script should be run in the browser console');
}