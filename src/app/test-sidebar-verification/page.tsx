'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext-simple';
import UnifiedLayout from '@/components/layout/UnifiedLayout';
import AuthGuard from '@/components/AuthGuard';

export default function SidebarVerificationPage() {
  const { user, loading, authInitialized } = useAuth();
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [testResults, setTestResults] = useState<any[]>([]);

  useEffect(() => {
    const checkSidebar = () => {
      // Check if sidebar element exists
      const sidebarElement = document.querySelector('.verotrade-sidebar-overlay');
      const isSidebarVisible = sidebarElement &&
                            window.getComputedStyle(sidebarElement).display !== 'none' &&
                            window.getComputedStyle(sidebarElement).visibility !== 'hidden';
      
      setSidebarVisible(isSidebarVisible || false);
      
      const results = [
        {
          test: 'Sidebar Element Exists',
          status: !!sidebarElement,
          details: sidebarElement ? `Found: ${sidebarElement.tagName}` : 'Not found'
        },
        {
          test: 'Sidebar is Visible',
          status: isSidebarVisible,
          details: isSidebarVisible ? 'Visible' : 'Hidden'
        },
        {
          test: 'User Authenticated',
          status: !!user,
          details: user ? `Email: ${user.email}` : 'No user'
        },
        {
          test: 'Auth Initialized',
          status: authInitialized,
          details: authInitialized ? 'Yes' : 'No'
        },
        {
          test: 'Loading State',
          status: !loading,
          details: loading ? 'Still loading' : 'Loading complete'
        }
      ];
      
      setTestResults(results);
    };

    // Check sidebar immediately and then every 2 seconds
    checkSidebar();
    const interval = setInterval(checkSidebar, 2000);
    
    return () => clearInterval(interval);
  }, [user, loading, authInitialized]);

  return (
    <UnifiedLayout>
      <div style={{
        padding: '20px',
        backgroundColor: '#121212',
        color: '#EAE6DD',
        minHeight: '100vh'
      }}>
        <h1 style={{
          fontSize: '32px',
          fontWeight: 'bold',
          marginBottom: '20px',
          color: '#B89B5E'
        }}>
          Sidebar Verification Test
        </h1>
        
        <div style={{
          backgroundColor: '#1c1c1c',
          padding: '20px',
          borderRadius: '12px',
          marginBottom: '20px'
        }}>
          <h2 style={{
            fontSize: '20px',
            fontWeight: '600',
            marginBottom: '15px',
            color: '#EAE6DD'
          }}>
            Test Results
          </h2>
          
          {testResults.map((result, index) => (
            <div key={index} style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '10px',
              backgroundColor: result.status ? '#2d5a2d' : '#5d2d2d',
              borderRadius: '8px',
              marginBottom: '10px',
              border: `1px solid ${result.status ? '#B89B5E' : '#A7352D'}`
            }}>
              <span style={{
                fontWeight: '500',
                color: '#EAE6DD'
              }}>
                {result.test}
              </span>
              <span style={{
                fontWeight: 'bold',
                color: result.status ? '#4CAF50' : '#F44336',
                padding: '4px 8px',
                borderRadius: '4px',
                backgroundColor: result.status ? 'rgba(76, 175, 80, 0.2)' : 'rgba(244, 67, 54, 0.2)'
              }}>
                {result.status ? 'PASS' : 'FAIL'}
              </span>
            </div>
          ))}
          
          <div style={{
            marginTop: '15px',
            padding: '15px',
            backgroundColor: sidebarVisible ? 'rgba(184, 155, 94, 0.1)' : 'rgba(167, 53, 45, 0.1)',
            borderRadius: '8px',
            border: `1px solid ${sidebarVisible ? '#B89B5E' : '#A7352D'}`
          }}>
            <h3 style={{
              fontSize: '18px',
              fontWeight: '600',
              marginBottom: '10px',
              color: sidebarVisible ? '#B89B5E' : '#A7352D'
            }}>
              Sidebar Status: {sidebarVisible ? 'VISIBLE ✅' : 'HIDDEN ❌'}
            </h3>
            <p style={{
              fontSize: '14px',
              lineHeight: '1.5',
              color: '#EAE6DD'
            }}>
              {sidebarVisible 
                ? 'The sidebar is properly visible for authenticated users. Navigation should be working correctly.'
                : 'The sidebar is not visible. This indicates a problem with the conditional rendering logic.'}
            </p>
          </div>
        </div>

        <div style={{
          backgroundColor: '#1c1c1c',
          padding: '20px',
          borderRadius: '12px',
          marginBottom: '20px'
        }}>
          <h2 style={{
            fontSize: '20px',
            fontWeight: '600',
            marginBottom: '15px',
            color: '#EAE6DD'
          }}>
            Navigation Test
          </h2>
          <p style={{
            fontSize: '14px',
            lineHeight: '1.5',
            color: '#EAE6DD',
            marginBottom: '15px'
          }}>
            Try navigating to different pages using the sidebar. Each page should maintain the sidebar visibility:
          </p>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '10px'
          }}>
            {['/dashboard', '/trades', '/log-trade', '/calendar', '/strategies', '/settings'].map(route => (
              <button
                key={route}
                onClick={() => window.location.href = route}
                style={{
                  padding: '12px 16px',
                  backgroundColor: '#2d5a2d',
                  border: '1px solid #B89B5E',
                  borderRadius: '8px',
                  color: '#EAE6DD',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#B89B5E';
                  e.currentTarget.style.color = '#121212';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#2d5a2d';
                  e.currentTarget.style.color = '#EAE6DD';
                }}
              >
                {route.replace('/', '').toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>
    </UnifiedLayout>
  );
}