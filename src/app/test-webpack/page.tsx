'use client';

import React from 'react';

console.log('🔍 [WEBPACK_TEST] Test webpack page module loading');

export default function TestWebpackPage() {
  console.log('🔍 [WEBPACK_TEST] TestWebpackPage component rendering');
  
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#121212',
      color: 'white',
      padding: '2rem',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1 style={{ color: '#B89B5E', fontSize: '2rem' }}>
        Webpack Test Page
      </h1>
      <p style={{ fontSize: '1.2rem', marginTop: '1rem' }}>
        If you can see this page, the basic webpack module loading is working.
      </p>
      <div style={{
        marginTop: '2rem',
        padding: '1rem',
        backgroundColor: '#333',
        borderRadius: '8px'
      }}>
        <h2>Debug Information:</h2>
        <p>✓ React module loaded</p>
        <p>✓ Component rendering</p>
        <p>✓ Styles applied</p>
      </div>
    </div>
  );
}