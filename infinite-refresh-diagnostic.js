// Comprehensive diagnostic script for infinite refresh loop investigation
// This script will add detailed logging to track the exact sequence of events

const fs = require('fs');
const path = require('path');

console.log('🔍 [DIAGNOSTIC] Starting infinite refresh investigation...');

// Read the current strategy performance page
const pagePath = path.join(__dirname, 'src/app/strategies/performance/[id]/page.tsx');
let pageContent = fs.readFileSync(pagePath, 'utf8');

// Enhanced logging additions
const diagnosticLogging = `
// ===== INFINITE REFRESH DIAGNOSTIC LOGGING =====
console.log('🔄 [DIAGNOSTIC] === PAGE RENDER START ===');
console.log('🔄 [DIAGNOSTIC] Current timestamp:', new Date().toISOString());
console.log('🔄 [DIAGNOSTIC] Strategy ID:', strategyId);
console.log('🔄 [DIAGNOSTIC] Is Loading:', isLoading);
console.log('🔄 [DIAGNOSTIC] Strategy exists:', !!strategy);
console.log('🔄 [DIAGNOSTIC] Strategy ID match:', strategy?.id === strategyId);
console.log('🔄 [DIAGNOSTIC] Trade data length:', tradeData.length);
console.log('🔄 [DIAGNOSTIC] Active tab:', activeTab);
console.log('🔄 [DIAGNOSTIC] MemoCache stats:', window.__memoCacheStats || 'Not available');
console.log('🔄 [DIAGNOSTIC] Auth state:', window.__authState || 'Not available');
console.log('🔄 [DIAGNOSTIC] Current pathname:', window.location?.pathname);
console.log('🔄 [DIAGNOSTIC] === PAGE RENDER END ===');
// ===== END DIAGNOSTIC LOGGING =====
`;

// Add diagnostic logging at the beginning of the component render
pageContent = pageContent.replace(
  'export default function StrategyPerformancePage({ params }: { params: Promise<{ id: string }> }) {',
  `export default function StrategyPerformancePage({ params }: { params: Promise<{ id: string }> }) {
  // ===== INFINITE REFRESH DIAGNOSTIC LOGGING =====
  console.log('🔄 [DIAGNOSTIC] === COMPONENT FUNCTION CALLED ===');
  console.log('🔄 [DIAGNOSTIC] Render timestamp:', new Date().toISOString());
  // ===== END DIAGNOSTIC LOGGING =====`
);

// Add diagnostic logging to useEffect hooks
pageContent = pageContent.replace(
  'useEffect(() => {\n    console.log(\'🔄 [INFINITE REFRESH DEBUG] useEffect triggered for strategyId:\', strategyId);\n    loadStrategy();\n  }, [strategyId]);',
  `useEffect(() => {
    console.log('🔄 [DIAGNOSTIC] === STRATEGY ID USE EFFECT TRIGGERED ===');
    console.log('🔄 [DIAGNOSTIC] Strategy ID changed:', strategyId);
    console.log('🔄 [DIAGNOSTIC] Previous strategy ID:', window.__previousStrategyId || 'None');
    window.__previousStrategyId = strategyId;
    console.log('🔄 [INFINITE REFRESH DEBUG] useEffect triggered for strategyId:', strategyId);
    loadStrategy();
    console.log('🔄 [DIAGNOSTIC] === STRATEGY ID USE EFFECT END ===');
  }, [strategyId]);`
);

pageContent = pageContent.replace(
  'useEffect(() => {\n    console.log(\'🔄 [INFINITE REFRESH DEBUG] Trade data useEffect triggered, strategy:\', strategy ? strategy.id : \'null\');\n    if (strategy) {\n      loadTradeData();\n    }\n  }, [strategy?.id, loadTradeData]);',
  `useEffect(() => {
    console.log('🔄 [DIAGNOSTIC] === TRADE DATA USE EFFECT TRIGGERED ===');
    console.log('🔄 [DIAGNOSTIC] Strategy ID:', strategy?.id);
    console.log('🔄 [DIAGNOSTIC] Strategy exists:', !!strategy);
    console.log('🔄 [DIAGNOSTIC] LoadTradeData function reference:', typeof loadTradeData);
    console.log('🔄 [DIAGNOSTIC] Previous strategy ID for trade data:', window.__previousTradeStrategyId || 'None');
    window.__previousTradeStrategyId = strategy?.id;
    console.log('🔄 [INFINITE REFRESH DEBUG] Trade data useEffect triggered, strategy:', strategy ? strategy.id : 'null');
    if (strategy) {
      loadTradeData();
    }
    console.log('🔄 [DIAGNOSTIC] === TRADE DATA USE EFFECT END ===');
  }, [strategy?.id, loadTradeData]);`
);

// Add diagnostic logging to setStrategy calls
pageContent = pageContent.replace(
  'setStrategy(prevStrategy => {\n        // If no previous strategy or different ID, update\n        if (!prevStrategy || prevStrategy.id !== strategyData.id) {',
  `setStrategy(prevStrategy => {
        console.log('🔄 [DIAGNOSTIC] === SET STRATEGY CALLED ===');
        console.log('🔄 [DIAGNOSTIC] Previous strategy ID:', prevStrategy?.id);
        console.log('🔄 [DIAGNOSTIC] New strategy ID:', strategyData.id);
        console.log('🔄 [DIAGNOSTIC] Previous strategy reference:', prevStrategy);
        console.log('🔄 [DIAGNOSTIC] Strategy data reference:', strategyData);
        console.log('🔄 [DIAGNOSTIC] Stats data reference:', statsData);
        
        // If no previous strategy or different ID, update
        if (!prevStrategy || prevStrategy.id !== strategyData.id) {`
);

pageContent = pageContent.replace(
  'return prevStrategy;\n        }\n        \n        // Create new object but try to maintain reference stability\n        return {',
  `console.log('🔄 [DIAGNOSTIC] Strategy stats unchanged, returning previous reference');
        return prevStrategy;
        }
        
        console.log('🔄 [DIAGNOSTIC] Creating new strategy object with updated stats');
        // Create new object but try to maintain reference stability
        return {`
);

// Add diagnostic logging to loadTradeData
pageContent = pageContent.replace(
  'const loadTradeData = useCallback(async () => {\n    console.log(\'🔄 [INFINITE REFRESH DEBUG] loadTradeData called, strategy exists:\', !!strategy);\n    if (!strategy) return;',
  `const loadTradeData = useCallback(async () => {
    console.log('🔄 [DIAGNOSTIC] === LOAD TRADE DATA CALLED ===');
    console.log('🔄 [DIAGNOSTIC] Strategy exists:', !!strategy);
    console.log('🔄 [DIAGNOSTIC] Strategy ID:', strategy?.id);
    console.log('🔄 [DIAGNOSTIC] Callback reference created for strategy ID:', strategy?.id);
    console.log('🔄 [INFINITE REFRESH DEBUG] loadTradeData called, strategy exists:', !!strategy);
    if (!strategy) {
      console.log('🔄 [DIAGNOSTIC] No strategy, returning early');
      return;
    }`
);

// Add diagnostic logging to the main render return
pageContent = pageContent.replace(
  'return (\n    <div className="max-w-4xl mx-auto p-6">',
  `// Add diagnostic logging before render
  console.log('🔄 [DIAGNOSTIC] === ABOUT TO RENDER ===');
  console.log('🔄 [DIAGNOSTIC] Final render state:', {
    isLoading,
    hasStrategy: !!strategy,
    strategyId: strategy?.id,
    tradeDataLength: tradeData.length,
    activeTab
  });
  
  return (
    <div className="max-w-4xl mx-auto p-6">`
);

// Write the enhanced file
fs.writeFileSync(pagePath, pageContent);

console.log('✅ [DIAGNOSTIC] Enhanced logging added to strategy performance page');

// Now let's also add logging to the AuthProvider to track auth state changes
const authProviderPath = path.join(__dirname, 'src/components/AuthProvider.tsx');
let authContent = fs.readFileSync(authProviderPath, 'utf8');

// Add diagnostic logging to AuthProvider
authContent = authContent.replace(
  'useEffect(() => {\n    // Redirect if no session and not on auth page\n    if (!loading && !user && !isAuthPage) {',
  `useEffect(() => {
    console.log('🔄 [AUTH DIAGNOSTIC] === AUTH PROVIDER USE EFFECT TRIGGERED ===');
    console.log('🔄 [AUTH DIAGNOSTIC] Loading:', loading);
    console.log('🔄 [AUTH DIAGNOSTIC] User exists:', !!user);
    console.log('🔄 [AUTH DIAGNOSTIC] User ID:', user?.id);
    console.log('🔄 [AUTH DIAGNOSTIC] Is auth page:', isAuthPage);
    console.log('🔄 [AUTH DIAGNOSTIC] Pathname:', pathname);
    
    // Store auth state globally for debugging
    if (typeof window !== 'undefined') {
      window.__authState = {
        loading,
        user: user?.id || null,
        isAuthPage,
        pathname,
        timestamp: new Date().toISOString()
      };
    }
    
    // Redirect if no session and not on auth page
    if (!loading && !user && !isAuthPage) {`
);

fs.writeFileSync(authProviderPath, authContent);

console.log('✅ [DIAGNOSTIC] Enhanced logging added to AuthProvider');

// Add logging to SchemaValidator
const schemaValidatorPath = path.join(__dirname, 'src/components/SchemaValidator.tsx');
let schemaContent = fs.readFileSync(schemaValidatorPath, 'utf8');

schemaContent = schemaContent.replace(
  'useEffect(() => {\n    // Set client ready state\n    setIsClientReady(true);',
  `useEffect(() => {
    console.log('🔄 [SCHEMA DIAGNOSTIC] === SCHEMA VALIDATOR USE EFFECT TRIGGERED ===');
    console.log('🔄 [SCHEMA DIAGNOSTIC] Client ready:', isClientReady);
    
    // Set client ready state
    setIsClientReady(true);`
);

fs.writeFileSync(schemaValidatorPath, schemaContent);

console.log('✅ [DIAGNOSTIC] Enhanced logging added to SchemaValidator');

// Add logging to memoization
const memoizationPath = path.join(__dirname, 'src/lib/memoization.ts');
let memoContent = fs.readFileSync(memoizationPath, 'utf8');

memoContent = memoContent.replace(
  'export const memoCache = new MemoCache();',
  `export const memoCache = new MemoCache();

// Global debug tracking
if (typeof window !== 'undefined') {
  window.__memoCacheStats = {
    gets: 0,
    sets: 0,
    hits: 0,
    misses: 0,
    keys: []
  };
}`
);

memoContent = memoContent.replace(
  'get<T>(key: string): T | null {\n    console.log(\'🔄 [INFINITE REFRESH DEBUG] MemoCache.get called for key:\', key);',
  `get<T>(key: string): T | null {
    console.log('🔄 [INFINITE REFRESH DEBUG] MemoCache.get called for key:', key);
    
    // Track global stats
    if (typeof window !== 'undefined' && window.__memoCacheStats) {
      window.__memoCacheStats.gets++;
    }`
);

memoContent = memoContent.replace(
  'set<T>(key: string, value: T, ttl?: number): void {\n    console.log(\'🔄 [INFINITE REFRESH DEBUG] MemoCache.set called for key:\', key);',
  `set<T>(key: string, value: T, ttl?: number): void {
    console.log('🔄 [INFINITE REFRESH DEBUG] MemoCache.set called for key:', key);
    
    // Track global stats
    if (typeof window !== 'undefined' && window.__memoCacheStats) {
      window.__memoCacheStats.sets++;
      if (!window.__memoCacheStats.keys.includes(key)) {
        window.__memoCacheStats.keys.push(key);
      }
    }`
);

fs.writeFileSync(memoizationPath, memoContent);

console.log('✅ [DIAGNOSTIC] Enhanced logging added to memoization');

console.log('🎯 [DIAGNOSTIC] All diagnostic logging has been added!');
console.log('📋 [DIAGNOSTIC] Instructions:');
console.log('1. Restart the development server');
console.log('2. Navigate to the strategy performance page');
console.log('3. Open browser dev tools and check the console');
console.log('4. Look for the 🔄 [DIAGNOSTIC] logs to understand the refresh pattern');
console.log('5. Pay special attention to:');
console.log('   - How often the component function is called');
console.log('   - Which useEffect hooks are triggering');
console.log('   - Whether strategy ID is actually changing');
console.log('   - Auth state changes');
console.log('   - Memo cache hit/miss patterns');