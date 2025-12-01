'use client';

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
