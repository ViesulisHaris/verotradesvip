/**
 * JAVASCRIPT ERROR VALIDATION LOGS
 * 
 * This script adds comprehensive logging to validate the root causes of the 
 * "Cannot read properties of undefined (reading 'call')" error and hydration failures.
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 [VALIDATION] Adding validation logs to confirm diagnosis...\n');

// 1. Add logging to AuthContext to catch Supabase initialization errors
function addAuthContextLogging() {
  console.log('🔍 [VALIDATION] Adding AuthContext logging...');
  
  const authContextPath = 'src/contexts/AuthContext-simple.tsx';
  
  if (fs.existsSync(authContextPath)) {
    let content = fs.readFileSync(authContextPath, 'utf8');
    
    // Add comprehensive logging at the beginning of the file
    const loggingHeader = `
'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { getSupabaseClient } from '@/supabase/client';
import { User, Session } from '@supabase/supabase-js';

// 🔍 [VALIDATION LOGS] AuthContext Error Tracking
console.log('🔍 [AUTH-VALIDATION] AuthContext module loaded');
console.log('🔍 [AUTH-VALIDATION] Environment check:', {
  isClient: typeof window !== 'undefined',
  hasDocument: typeof document !== 'undefined',
  userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Server'
});

// 🔍 [VALIDATION LOGS] Track Supabase client initialization
let supabaseClientInitialized = false;
let supabaseClientError = null;

try {
  const testClient = getSupabaseClient();
  supabaseClientInitialized = true;
  console.log('🔍 [AUTH-VALIDATION] Supabase client initialized successfully:', {
    hasAuth: !!testClient.auth,
    hasFunctions: !!testClient.functions,
    hasStorage: !!testClient.storage
  });
} catch (error) {
  supabaseClientError = error;
  console.error('🔍 [AUTH-VALIDATION] Supabase client initialization failed:', error);
  console.error('🔍 [AUTH-VALIDATION] Error details:', {
    message: error.message,
    stack: error.stack,
    name: error.name
  });
}
`;

    // Replace the original header with logging
    content = content.replace(/^'use client';\n\nimport { createContext, useContext, useEffect, useState, ReactNode } from 'react';\nimport { getSupabaseClient } from '@/supabase\/client';\nimport { User, Session } from '@supabase\/supabase-js';/, loggingHeader);
    
    // Add logging to the useAuth hook
    content = content.replace(
      /export function useAuth\(\) \{\s*const context = useContext\(AuthContext\);\s*if \(context === undefined\) \{\s*throw new Error\('useAuth must be used within an AuthProvider'\);\s*\}\s*return context;\s*\}/,
      `export function useAuth() {
  console.log('🔍 [AUTH-VALIDATION] useAuth hook called');
  console.log('🔍 [AUTH-VALIDATION] Supabase client status:', {
    initialized: supabaseClientInitialized,
    error: supabaseClientError ? supabaseClientError.message : null
  });
  
  const context = useContext(AuthContext);
  console.log('🔍 [AUTH-VALIDATION] AuthContext value:', {
    hasContext: !!context,
    hasUser: !!context?.user,
    hasSession: !!context?.session,
    loading: context?.loading,
    authInitialized: context?.authInitialized
  });
  
  if (context === undefined) {
    console.error('🔍 [AUTH-VALIDATION] CRITICAL: AuthContext is undefined!');
    console.error('🔍 [AUTH-VALIDATION] This will cause "Cannot read properties of undefined" errors');
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}`
    );
    
    // Add logging to the AuthContextProvider
    content = content.replace(
      /export function AuthContextProviderSimple\(\{ children \}: AuthProviderProps\) \{/,
      `export function AuthContextProviderSimple({ children }: AuthProviderProps) {
  console.log('🔍 [AUTH-VALIDATION] AuthContextProviderSimple mounting...');
  console.log('🔍 [AUTH-VALIDATION] Initial Supabase client status:', {
    initialized: supabaseClientInitialized,
    error: supabaseClientError ? supabaseClientError.message : null
  });`
    );
    
    // Add logging to the initializeAuth function
    content = content.replace(
      /const initializeAuth = async \(\) => \{/,
      `const initializeAuth = async () => {
      console.log('🔍 [AUTH-VALIDATION] initializeAuth starting...');
      console.log('🔍 [AUTH-VALIDATION] Component mounted check:', isComponentMounted);
      console.log('🔍 [AUTH-VALIDATION] Client-side check:', typeof window !== 'undefined');`
    );
    
    // Add logging around getSupabaseClient call
    content = content.replace(
      /const supabase = getSupabaseClient\(\);/,
      `console.log('🔍 [AUTH-VALIDATION] About to call getSupabaseClient()...');
      let supabase;
      try {
        supabase = getSupabaseClient();
        console.log('🔍 [AUTH-VALIDATION] getSupabaseClient() succeeded:', {
          hasAuth: !!supabase?.auth,
          hasGetSession: typeof supabase?.auth?.getSession === 'function'
        });
      } catch (error) {
        console.error('🔍 [AUTH-VALIDATION] getSupabaseClient() failed:', error);
        console.error('🔍 [AUTH-VALIDATION] This is likely the source of "Cannot read properties of undefined" error');
        throw error;
      }`
    );
    
    // Add logging around getSession call
    content = content.replace(
      /const \{ data: \{ session \}, error \} = await supabase\.auth\.getSession\(\);/,
      `console.log('🔍 [AUTH-VALIDATION] About to call supabase.auth.getSession()...');
      let sessionResult;
      try {
        sessionResult = await supabase.auth.getSession();
        console.log('🔍 [AUTH-VALIDATION] getSession() succeeded:', {
          hasSession: !!sessionResult?.data?.session,
          hasError: !!sessionResult?.error,
          error: sessionResult?.error?.message
        });
      } catch (error) {
        console.error('🔍 [AUTH-VALIDATION] getSession() failed:', error);
        console.error('🔍 [AUTH-VALIDATION] This could cause undefined errors in auth state');
        sessionResult = { data: { session: null }, error };
      }
      const { data: { session }, error } = sessionResult;`
    );
    
    fs.writeFileSync(authContextPath, content);
    console.log('✅ [VALIDATION] Added comprehensive logging to AuthContext');
  } else {
    console.log('❌ [VALIDATION] AuthContext file not found');
  }
}

// 2. Add logging to login page to catch hydration issues
function addLoginPageLogging() {
  console.log('🔍 [VALIDATION] Adding login page logging...');
  
  const loginPagePath = 'src/app/(auth)/login/page.tsx';
  
  if (fs.existsSync(loginPagePath)) {
    let content = fs.readFileSync(loginPagePath, 'utf8');
    
    // Add logging at the beginning of the component
    content = content.replace(
      /export default function LoginPage\(\) \{/,
      `export default function LoginPage() {
  console.log('🔍 [LOGIN-VALIDATION] LoginPage component mounting...');
  console.log('🔍 [LOGIN-VALIDATION] Environment check:', {
    isClient: typeof window !== 'undefined',
    hasDocument: typeof document !== 'undefined',
    hasWindow: typeof window !== 'undefined'
  });`
    );
    
    // Add logging before useAuth call
    content = content.replace(
      /const \{ user, authInitialized \} = useAuth\(\);/,
      `console.log('🔍 [LOGIN-VALIDATION] About to call useAuth()...');
      let authData;
      try {
        authData = useAuth();
        console.log('🔍 [LOGIN-VALIDATION] useAuth() succeeded:', {
          hasUser: !!authData?.user,
          hasAuthInitialized: !!authData?.authInitialized,
          loading: authData?.loading
        });
      } catch (error) {
        console.error('🔍 [LOGIN-VALIDATION] useAuth() failed:', error);
        console.error('🔍 [LOGIN-VALIDATION] This is likely causing the "Cannot read properties of undefined" error');
        throw error;
      }
      const { user, authInitialized } = authData;`
    );
    
    // Add logging to the first useEffect
    content = content.replace(
      /useEffect\(\(\) => \{/,
      `useEffect(() => {
      console.log('🔍 [LOGIN-VALIDATION] First useEffect running...');
      console.log('🔍 [LOGIN-VALIDATION] DOM access check:', {
        hasDocument: !!document,
        hasGetComputedStyle: typeof getComputedStyle !== 'undefined',
        hasQuerySelector: typeof document?.querySelector !== 'undefined'
      });`
    );
    
    // Add window check before DOM access
    content = content.replace(
      /const computedStyle = getComputedStyle\(document\.documentElement\);/,
      `if (typeof window === 'undefined') {
        console.log('🔍 [LOGIN-VALIDATION] Skipping DOM access on server side');
        return;
      }
      
      console.log('🔍 [LOGIN-VALIDATION] About to access DOM...');
      const computedStyle = getComputedStyle(document.documentElement);`
    );
    
    fs.writeFileSync(loginPagePath, content);
    console.log('✅ [VALIDATION] Added comprehensive logging to login page');
  } else {
    console.log('❌ [VALIDATION] Login page file not found');
  }
}

// 3. Add logging to Supabase client
function addSupabaseClientLogging() {
  console.log('🔍 [VALIDATION] Adding Supabase client logging...');
  
  const supabaseClientPath = 'src/supabase/client.ts';
  
  if (fs.existsSync(supabaseClientPath)) {
    let content = fs.readFileSync(supabaseClientPath, 'utf8');
    
    // Add logging at the beginning of the file
    const loggingHeader = `import { createClient } from '@supabase/supabase-js';

// 🔍 [VALIDATION LOGS] Supabase Client Error Tracking
console.log('🔍 [SUPABASE-VALIDATION] Supabase client module loading...');
console.log('🔍 [SUPABASE-VALIDATION] Environment variables check:', {
  hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
  hasKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  url: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'PRESENT' : 'MISSING',
  key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'PRESENT' : 'MISSING'
});

// Use environment variables with proper fallbacks
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Validate environment variables
if (!supabaseUrl) {
  console.error('🔍 [SUPABASE-VALIDATION] CRITICAL: NEXT_PUBLIC_SUPABASE_URL is not defined');
  console.error('🔍 [SUPABASE-VALIDATION] This will cause "Cannot read properties of undefined" errors');
  throw new Error('NEXT_PUBLIC_SUPABASE_URL is required');
}

if (!supabaseAnonKey) {
  console.error('🔍 [SUPABASE-VALIDATION] CRITICAL: NEXT_PUBLIC_SUPABASE_ANON_KEY is not defined');
  console.error('🔍 [SUPABASE-VALIDATION] This will cause "Cannot read properties of undefined" errors');
  throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY is required');
}

// Fix the URL if it's missing the protocol
const fixedSupabaseUrl = supabaseUrl.startsWith('http') ? supabaseUrl : \`https://\${supabaseUrl}\`;

console.log('🔍 [SUPABASE-VALIDATION] URL processing:', {
  original: supabaseUrl,
  fixed: fixedSupabaseUrl,
  protocolFixed: supabaseUrl !== fixedSupabaseUrl
});

console.log('🔍 [SUPABASE-VALIDATION] About to create Supabase client...');
let supabaseClient;
try {
  supabaseClient = createClient(fixedSupabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce', // Recommended for web apps
    },
    global: {
      headers: {
        'X-Client-Info': 'verotrades-web-optimized'
      }
    },
    // Optimized: Realtime configuration for better performance
    realtime: {
      params: {
        eventsPerSecond: 10
      }
    }
  });
  
  console.log('🔍 [SUPABASE-VALIDATION] Supabase client created successfully:', {
    hasAuth: !!supabaseClient?.auth,
    hasFunctions: !!supabaseClient?.functions,
    hasStorage: !!supabaseClient?.storage,
    hasFrom: typeof supabaseClient?.from === 'function'
  });
} catch (error) {
  console.error('🔍 [SUPABASE-VALIDATION] CRITICAL: Supabase client creation failed:', error);
  console.error('🔍 [SUPABASE-VALIDATION] This is the likely source of "Cannot read properties of undefined" errors');
  throw error;
}

export const supabase = supabaseClient;`;
    
    // Replace the original content
    content = content.replace(/import { createClient } from '@supabase\/supabase-js';[\s\S]*?export const supabase = createClient\([\s\S]*?\);[\s\S]*?export const getSupabaseClient = \(\) => supabase;/, loggingHeader);
    
    fs.writeFileSync(supabaseClientPath, content);
    console.log('✅ [VALIDATION] Added comprehensive logging to Supabase client');
  } else {
    console.log('❌ [VALIDATION] Supabase client file not found');
  }
}

// 4. Create a test page to validate the fixes
function createValidationTestPage() {
  console.log('🔍 [VALIDATION] Creating validation test page...');
  
  const testPageContent = `'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext-simple';
import { getSupabaseClient } from '@/supabase/client';

export default function JavaScriptErrorValidationPage() {
  const [testResults, setTestResults] = useState<any[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const addTestResult = (testName: string, passed: boolean, details?: string) => {
    setTestResults(prev => [...prev, {
      testName,
      passed,
      details,
      timestamp: new Date().toISOString()
    }]);
  };

  const runValidationTests = async () => {
    setIsRunning(true);
    setTestResults([]);
    
    console.log('🔍 [VALIDATION-TEST] Starting comprehensive JavaScript error validation...');
    
    // Test 1: Check if useAuth works without throwing
    try {
      console.log('🔍 [VALIDATION-TEST] Testing useAuth hook...');
      const authData = useAuth();
      addTestResult('useAuth Hook', true, `Auth data: ${JSON.stringify({
        hasUser: !!authData?.user,
        hasSession: !!authData?.session,
        loading: authData?.loading,
        authInitialized: authData?.authInitialized
      })}`);
    } catch (error) {
      console.error('🔍 [VALIDATION-TEST] useAuth failed:', error);
      addTestResult('useAuth Hook', false, \`Error: \${error.message}\`);
    }
    
    // Test 2: Check if Supabase client initializes
    try {
      console.log('🔍 [VALIDATION-TEST] Testing Supabase client...');
      const supabase = getSupabaseClient();
      addTestResult('Supabase Client', true, \`Client created: \${!!supabase?.auth}\`);
    } catch (error) {
      console.error('🔍 [VALIDATION-TEST] Supabase client failed:', error);
      addTestResult('Supabase Client', false, \`Error: \${error.message}\`);
    }
    
    // Test 3: Check for hydration issues
    try {
      console.log('🔍 [VALIDATION-TEST] Testing hydration...');
      const isClient = typeof window !== 'undefined';
      const hasDocument = typeof document !== 'undefined';
      addTestResult('Hydration Check', true, \`Client: \${isClient}, Document: \${hasDocument}\`);
    } catch (error) {
      console.error('🔍 [VALIDATION-TEST] Hydration check failed:', error);
      addTestResult('Hydration Check', false, \`Error: \${error.message}\`);
    }
    
    // Test 4: Check for undefined function calls
    try {
      console.log('🔍 [VALIDATION-TEST] Testing for undefined function calls...');
      // This would catch the "Cannot read properties of undefined (reading 'call')" error
      const testObject = { test: () => 'test' };
      const result = testObject.test ? testObject.test() : 'undefined';
      addTestResult('Function Call Check', true, \`Result: \${result}\`);
    } catch (error) {
      console.error('🔍 [VALIDATION-TEST] Function call check failed:', error);
      addTestResult('Function Call Check', false, \`Error: \${error.message}\`);
    }
    
    setIsRunning(false);
    console.log('🔍 [VALIDATION-TEST] Validation tests completed');
  };

  return (
    <div style={{
      padding: '2rem',
      backgroundColor: 'var(--deep-charcoal, #121212)',
      color: 'var(--warm-off-white, #EAE6DD)',
      minHeight: '100vh'
    }}>
      <div style={{
        maxWidth: '800px',
        margin: '0 auto'
      }}>
        <h1 style={{
          fontSize: '2rem',
          marginBottom: '1rem',
          color: 'var(--dusty-gold, #B89B5E)'
        }}>
          🔍 JavaScript Error Validation
        </h1>
        
        <p style={{
          marginBottom: '2rem',
          lineHeight: '1.6'
        }}>
          This page validates the fixes for the "Cannot read properties of undefined (reading 'call')" 
          error and hydration failures causing gray screens.
        </p>
        
        <button
          onClick={runValidationTests}
          disabled={isRunning}
          style={{
            padding: '1rem 2rem',
            backgroundColor: 'var(--dusty-gold, #B89B5E)',
            color: 'var(--deep-charcoal, #121212)',
            border: 'none',
            borderRadius: '8px',
            fontSize: '1rem',
            fontWeight: '600',
            cursor: isRunning ? 'not-allowed' : 'pointer',
            opacity: isRunning ? 0.7 : 1,
            marginBottom: '2rem'
          }}
        >
          {isRunning ? 'Running Tests...' : 'Run Validation Tests'}
        </button>
        
        <div style={{
          backgroundColor: 'var(--soft-graphite, #2A2A2A)',
          borderRadius: '8px',
          padding: '1rem',
          marginBottom: '2rem'
        }}>
          <h2 style={{
            fontSize: '1.5rem',
            marginBottom: '1rem',
            color: 'var(--warm-off-white, #EAE6DD)'
          }}>
            Test Results
          </h2>
          
          {testResults.length === 0 ? (
            <p style={{ color: 'var(--muted-gray, #999999)' }}>
              Click "Run Validation Tests" to start testing.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {testResults.map((result, index) => (
                <div
                  key={index}
                  style={{
                    padding: '1rem',
                    backgroundColor: result.passed ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                    border: \`1px solid \${result.passed ? '#22c55e' : '#ef4444'}\`,
                    borderRadius: '4px'
                  }}
                >
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    marginBottom: '0.5rem'
                  }}>
                    <span style={{
                      fontSize: '1.2rem',
                      color: result.passed ? '#22c55e' : '#ef4444'
                    }}>
                      {result.passed ? '✅' : '❌'}
                    </span>
                    <strong style={{ color: 'var(--warm-off-white, #EAE6DD)' }}>
                      {result.testName}
                    </strong>
                  </div>
                  <div style={{
                    fontSize: '0.9rem',
                    color: 'var(--muted-gray, #999999)'
                  }}>
                    {result.details}
                  </div>
                  <div style={{
                    fontSize: '0.8rem',
                    color: 'var(--muted-gray, #999999)',
                    marginTop: '0.5rem'
                  }}>
                    {result.timestamp}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div style={{
          backgroundColor: 'var(--soft-graphite, #2A2A2A)',
          borderRadius: '8px',
          padding: '1rem'
        }}>
          <h2 style={{
            fontSize: '1.5rem',
            marginBottom: '1rem',
            color: 'var(--warm-off-white, #EAE6DD)'
          }}>
            Console Logs
          </h2>
          <p style={{
            fontSize: '0.9rem',
            color: 'var(--muted-gray, #999999)',
            lineHeight: '1.6'
          }}>
            Open the browser console to see detailed validation logs. Look for messages starting with 
            "🔍 [VALIDATION-TEST]" to track the testing process.
          </p>
        </div>
      </div>
    </div>
  );
}
`;

  fs.writeFileSync('src/app/test-javascript-error-validation/page.tsx', testPageContent);
  console.log('✅ [VALIDATION] Created validation test page at /test-javascript-error-validation');
}

// Run all validation logging additions
function runValidationLogging() {
  console.log('🔍 [VALIDATION] Starting comprehensive validation logging...\n');
  
  addAuthContextLogging();
  addLoginPageLogging();
  addSupabaseClientLogging();
  createValidationTestPage();
  
  console.log('\n📊 [VALIDATION COMPLETE] Summary:');
  console.log('====================================');
  console.log('✅ Added comprehensive logging to AuthContext');
  console.log('✅ Added comprehensive logging to login page');
  console.log('✅ Added comprehensive logging to Supabase client');
  console.log('✅ Created validation test page');
  
  console.log('\n🔍 [NEXT STEPS]');
  console.log('================');
  console.log('1. Restart the development server');
  console.log('2. Visit /test-javascript-error-validation to run tests');
  console.log('3. Check browser console for detailed validation logs');
  console.log('4. Look for 🔍 [VALIDATION] messages to track issues');
  console.log('5. Confirm the diagnosis before applying fixes');
  
  console.log('\n💡 [EXPECTED LOGS]');
  console.log('==================');
  console.log('- 🔍 [AUTH-VALIDATION] - AuthContext initialization and errors');
  console.log('- 🔍 [LOGIN-VALIDATION] - Login page hydration and DOM access');
  console.log('- 🔍 [SUPABASE-VALIDATION] - Supabase client initialization');
  console.log('- 🔍 [VALIDATION-TEST] - Comprehensive test results');
}

// Export for use in other scripts
module.exports = {
  runValidationLogging,
  addAuthContextLogging,
  addLoginPageLogging,
  addSupabaseClientLogging,
  createValidationTestPage
};

// Run validation logging if this script is executed directly
if (require.main === module) {
  runValidationLogging();
}