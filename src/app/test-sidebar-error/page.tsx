'use client';

import React from 'react';
import UnifiedSidebar from '@/components/navigation/UnifiedSidebar';

export default function TestSidebarError() {
  console.log('🔧 [TEST] TestSidebarError page rendering...');
  
  return (
    <div style={{ padding: '20px', backgroundColor: '#121212', color: '#EAE6DD', minHeight: '100vh' }}>
      <h1>Sidebar Error Test Page</h1>
      <p>This page is designed to isolate and test the UnifiedSidebar component error.</p>
      
      <div style={{ marginTop: '20px', padding: '20px', border: '1px solid #B89B5E', borderRadius: '8px' }}>
        <h2>Test Components</h2>
        <p>Check the browser console for diagnostic logs.</p>
        
        {/* Try to render the sidebar component directly */}
        <div style={{ marginTop: '20px' }}>
          <h3>Direct Sidebar Component Test:</h3>
          <UnifiedSidebar />
        </div>
      </div>
    </div>
  );
}