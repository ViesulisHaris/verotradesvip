'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext-simple';
import UnifiedSidebar from '@/components/navigation/UnifiedSidebar';
import UnifiedLayout from '@/components/layout/UnifiedLayout';
import Link from 'next/link';

export default function SidebarVisibilityTest() {
  const { user, loading, authInitialized } = useAuth();
  const [testResults, setTestResults] = useState<any[]>([]);
  const [sidebarRenderTime, setSidebarRenderTime] = useState<number | null>(null);

  const addTestResult = (test: string, status: 'pass' | 'fail' | 'pending', details?: string) => {
    setTestResults(prev => [...prev, {
      test,
      status,
      details,
      timestamp: new Date().toISOString()
    }]);
  };

  useEffect(() => {
    const startTime = performance.now();
    
    // Test 1: Check if AuthContext is properly initialized
    if (authInitialized) {
      addTestResult('AuthContext Initialization', 'pass', `Auth initialized in ${(performance.now() - startTime).toFixed(2)}ms`);
    } else {
      addTestResult('AuthContext Initialization', 'pending', 'Waiting for auth initialization...');
    }

    // Test 2: Check if user is authenticated
    if (user) {
      addTestResult('User Authentication', 'pass', `User authenticated: ${user.email}`);
    } else if (authInitialized && !loading) {
      addTestResult('User Authentication', 'fail', 'No user found after auth initialization');
    } else {
      addTestResult('User Authentication', 'pending', 'Authentication in progress...');
    }

    // Test 3: Measure sidebar render time
    const sidebarElement = document.querySelector('.verotrade-sidebar-overlay');
    if (sidebarElement) {
      const renderTime = performance.now() - startTime;
      setSidebarRenderTime(renderTime);
      addTestResult('Sidebar Render Time', 'pass', `Sidebar rendered in ${renderTime.toFixed(2)}ms`);
    }

    // Test 4: Check sidebar visibility
    setTimeout(() => {
      const sidebarElement = document.querySelector('.verotrade-sidebar-overlay') as HTMLElement;
      if (sidebarElement) {
        const isVisible = sidebarElement.style.display !== 'none' && 
                        sidebarElement.style.transform !== 'translateX(-100%)';
        addTestResult('Sidebar Visibility', isVisible ? 'pass' : 'fail', 
          isVisible ? 'Sidebar is visible' : 'Sidebar is hidden');
      } else {
        addTestResult('Sidebar Visibility', 'fail', 'Sidebar element not found');
      }
    }, 100);

  }, [user, loading, authInitialized]);

  return (
    <UnifiedLayout>
      <div style={{ padding: '20px', color: '#EAE6DD' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '2rem' }}>
          Sidebar Visibility Test
        </h1>

        <div style={{ 
          backgroundColor: '#1c1c1c', 
          padding: '20px', 
          borderRadius: '12px', 
          marginBottom: '2rem' 
        }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Authentication Status</h2>
          <div style={{ display: 'grid', gap: '10px' }}>
            <div><strong>Loading:</strong> {loading ? 'Yes' : 'No'}</div>
            <div><strong>Auth Initialized:</strong> {authInitialized ? 'Yes' : 'No'}</div>
            <div><strong>User:</strong> {user ? user.email : 'Not authenticated'}</div>
            <div><strong>Sidebar Render Time:</strong> {sidebarRenderTime ? `${sidebarRenderTime.toFixed(2)}ms` : 'Not measured'}</div>
          </div>
        </div>

        <div style={{ 
          backgroundColor: '#1c1c1c', 
          padding: '20px', 
          borderRadius: '12px', 
          marginBottom: '2rem' 
        }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Test Results</h2>
          <div style={{ display: 'grid', gap: '10px' }}>
            {testResults.map((result, index) => (
              <div 
                key={index}
                style={{
                  padding: '10px',
                  borderRadius: '8px',
                  backgroundColor: result.status === 'pass' ? 'rgba(34, 197, 94, 0.1)' : 
                                   result.status === 'fail' ? 'rgba(239, 68, 68, 0.1)' : 
                                   'rgba(59, 130, 246, 0.1)',
                  border: `1px solid ${
                    result.status === 'pass' ? '#22c55e' : 
                    result.status === 'fail' ? '#ef4444' : 
                    '#3b82f6'
                  }`
                }}
              >
                <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
                  {result.test}
                  <span style={{
                    marginLeft: '10px',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '0.8rem',
                    backgroundColor: result.status === 'pass' ? '#22c55e' : 
                                     result.status === 'fail' ? '#ef4444' : 
                                     '#3b82f6',
                    color: '#fff'
                  }}>
                    {result.status.toUpperCase()}
                  </span>
                </div>
                <div style={{ fontSize: '0.9rem', opacity: 0.8 }}>
                  {result.details}
                </div>
                <div style={{ fontSize: '0.8rem', opacity: 0.6, marginTop: '5px' }}>
                  {new Date(result.timestamp).toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ 
          backgroundColor: '#1c1c1c', 
          padding: '20px', 
          borderRadius: '12px', 
          marginBottom: '2rem' 
        }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Manual Tests</h2>
          <div style={{ display: 'grid', gap: '15px' }}>
            <div>
              <strong>1. Sidebar Visibility:</strong> 
              <div>Check if the sidebar is visible on the left side of the screen</div>
            </div>
            <div>
              <strong>2. Navigation Links:</strong> 
              <div>Click on different navigation items in the sidebar to test navigation</div>
            </div>
            <div>
              <strong>3. Mobile Responsiveness:</strong> 
              <div>Resize the browser window to test mobile menu behavior</div>
            </div>
            <div>
              <strong>4. Toggle Functionality:</strong> 
              <div>Click the toggle button to expand/collapse the sidebar</div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <Link 
            href="/dashboard" 
            style={{
              padding: '10px 20px',
              backgroundColor: '#B89B5E',
              color: '#121212',
              textDecoration: 'none',
              borderRadius: '8px',
              fontWeight: 'bold'
            }}
          >
            Go to Dashboard
          </Link>
          <Link 
            href="/trades" 
            style={{
              padding: '10px 20px',
              backgroundColor: '#B89B5E',
              color: '#121212',
              textDecoration: 'none',
              borderRadius: '8px',
              fontWeight: 'bold'
            }}
          >
            Go to Trades
          </Link>
          <Link 
            href="/strategies" 
            style={{
              padding: '10px 20px',
              backgroundColor: '#B89B5E',
              color: '#121212',
              textDecoration: 'none',
              borderRadius: '8px',
              fontWeight: 'bold'
            }}
          >
            Go to Strategies
          </Link>
        </div>
      </div>
    </UnifiedLayout>
  );
}