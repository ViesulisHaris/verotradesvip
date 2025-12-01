/**
 * SIMPLE VALIDATION LOGS SCRIPT
 * Adds comprehensive logging to validate JavaScript error diagnosis
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 [VALIDATION] Adding validation logs...\n');

// 1. Add logging to AuthContext
function addAuthContextLogs() {
  const authContextPath = 'src/contexts/AuthContext-simple.tsx';
  
  if (fs.existsSync(authContextPath)) {
    let content = fs.readFileSync(authContextPath, 'utf8');
    
    // Add logging at the beginning of useAuth hook
    content = content.replace(
      /export function useAuth\(\) \{/,
      `export function useAuth() {
    console.log('🔍 [AUTH-VALIDATION] useAuth hook called');
    console.log('🔍 [AUTH-VALIDATION] Checking if AuthContext is available...');`
    );
    
    // Add logging after useContext call
    content = content.replace(
      /const context = useContext\(AuthContext\);/,
      `const context = useContext(AuthContext);
    console.log('🔍 [AUTH-VALIDATION] AuthContext value:', context ? 'Available' : 'UNDEFINED');
    
    if (context === undefined) {
      console.error('🔍 [AUTH-VALIDATION] CRITICAL: AuthContext is undefined!');
      console.error('🔍 [AUTH-VALIDATION] This will cause "Cannot read properties of undefined" errors');
    }`
    );
    
    // Add logging to AuthContextProvider
    content = content.replace(
      /export function AuthContextProviderSimple\(\{ children \}: AuthProviderProps\) \{/,
      `export function AuthContextProviderSimple({ children }: AuthProviderProps) {
    console.log('🔍 [AUTH-VALIDATION] AuthContextProvider mounting...');`
    );
    
    // Add logging around getSupabaseClient call
    content = content.replace(
      /const supabase = getSupabaseClient\(\);/,
      `console.log('🔍 [AUTH-VALIDATION] About to call getSupabaseClient()...');
      const supabase = getSupabaseClient();
      console.log('🔍 [AUTH-VALIDATION] getSupabaseClient() result:', supabase ? 'Success' : 'FAILED');`
    );
    
    fs.writeFileSync(authContextPath, content);
    console.log('✅ Added AuthContext validation logs');
  }
}

// 2. Add logging to login page
function addLoginPageLogs() {
  const loginPagePath = 'src/app/(auth)/login/page.tsx';
  
  if (fs.existsSync(loginPagePath)) {
    let content = fs.readFileSync(loginPagePath, 'utf8');
    
    // Add logging at the beginning of component
    content = content.replace(
      /export default function LoginPage\(\) \{/,
      `export default function LoginPage() {
    console.log('🔍 [LOGIN-VALIDATION] LoginPage component mounting...');
    console.log('🔍 [LOGIN-VALIDATION] Environment:', typeof window !== 'undefined' ? 'Client' : 'Server');`
    );
    
    // Add logging before useAuth call
    content = content.replace(
      /const \{ user, authInitialized \} = useAuth\(\);/,
      `console.log('🔍 [LOGIN-VALIDATION] About to call useAuth()...');
      const { user, authInitialized } = useAuth();
      console.log('🔍 [LOGIN-VALIDATION] useAuth() result:', { hasUser: !!user, authInitialized });`
    );
    
    // Add window check before DOM access
    content = content.replace(
      /const computedStyle = getComputedStyle\(document\.documentElement\);/,
      `if (typeof window === 'undefined') {
        console.log('🔍 [LOGIN-VALIDATION] Skipping DOM access on server');
        return;
      }
      console.log('🔍 [LOGIN-VALIDATION] Accessing DOM on client...');
      const computedStyle = getComputedStyle(document.documentElement);`
    );
    
    fs.writeFileSync(loginPagePath, content);
    console.log('✅ Added login page validation logs');
  }
}

// 3. Add logging to Supabase client
function addSupabaseClientLogs() {
  const supabaseClientPath = 'src/supabase/client.ts';
  
  if (fs.existsSync(supabaseClientPath)) {
    let content = fs.readFileSync(supabaseClientPath, 'utf8');
    
    // Add logging at the beginning
    content = content.replace(
      /import { createClient } from '@supabase\/supabase-js';/,
      `import { createClient } from '@supabase/supabase-js';

console.log('🔍 [SUPABASE-VALIDATION] Supabase client module loading...');
console.log('🔍 [SUPABASE-VALIDATION] Environment variables:', {
  hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
  hasKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
});`
    );
    
    // Add logging around createClient call
    content = content.replace(
      /export const supabase = createClient\(/,
      `console.log('🔍 [SUPABASE-VALIDATION] Creating Supabase client...');
export const supabase = createClient(`
    );
    
    // Add logging after createClient
    content = content.replace(
      /}\);/,
      `});

console.log('🔍 [SUPABASE-VALIDATION] Supabase client created:', !!supabase?.auth);`
    );
    
    fs.writeFileSync(supabaseClientPath, content);
    console.log('✅ Added Supabase client validation logs');
  }
}

// 4. Create simple test page
function createTestPage() {
  const testPageContent = `'use client';

import { useAuth } from '@/contexts/AuthContext-simple';

export default function TestValidationPage() {
  console.log('🔍 [TEST-VALIDATION] Test page mounting...');
  
  let authData;
  let authError = null;
  
  try {
    console.log('🔍 [TEST-VALIDATION] Testing useAuth()...');
    authData = useAuth();
    console.log('🔍 [TEST-VALIDATION] useAuth() succeeded:', authData);
  } catch (error) {
    authError = error;
    console.error('🔍 [TEST-VALIDATION] useAuth() failed:', error);
  }
  
  return (
    <div style={{ padding: '2rem', color: 'white' }}>
      <h1>🔍 JavaScript Error Validation</h1>
      
      {authError ? (
        <div style={{ color: 'red', padding: '1rem', border: '1px solid red' }}>
          <h2>❌ AUTH ERROR DETECTED</h2>
          <p>Error: {authError.message}</p>
          <p>This confirms the "Cannot read properties of undefined" error source!</p>
        </div>
      ) : (
        <div style={{ color: 'green', padding: '1rem', border: '1px solid green' }}>
          <h2>✅ AUTH WORKING</h2>
          <p>AuthContext is properly initialized</p>
          <p>User: {authData?.user ? 'Present' : 'Not logged in'}</p>
          <p>Auth Initialized: {authData?.authInitialized ? 'Yes' : 'No'}</p>
        </div>
      )}
      
      <div style={{ marginTop: '2rem', padding: '1rem', border: '1px solid gray' }}>
        <h3>Console Logs</h3>
        <p>Check browser console for 🔍 [TEST-VALIDATION] messages</p>
      </div>
    </div>
  );
}
`;

  if (!fs.existsSync('src/app/test-validation')) {
    fs.mkdirSync('src/app/test-validation');
  }
  
  fs.writeFileSync('src/app/test-validation/page.tsx', testPageContent);
  console.log('✅ Created test validation page at /test-validation');
}

// Run all logging additions
addAuthContextLogs();
addLoginPageLogs();
addSupabaseClientLogs();
createTestPage();

console.log('\n🎯 [VALIDATION COMPLETE]');
console.log('========================');
console.log('✅ Added comprehensive validation logs');
console.log('✅ Created test page at /test-validation');
console.log('\n📋 [NEXT STEPS]:');
console.log('1. Restart development server');
console.log('2. Visit /test-validation to test');
console.log('3. Check browser console for 🔍 validation messages');
console.log('4. Confirm diagnosis before applying fixes');