'use client';

import React, { useState, useEffect } from 'react';
import UnifiedSidebar from '@/components/navigation/UnifiedSidebar';
import { useAuth } from '@/contexts/AuthContext-simple';

function TestSidebarDirectPage() {
  const { user } = useAuth();
  const [sidebarInfo, setSidebarInfo] = useState<{
    rendered: boolean;
    visible: boolean;
    userState: string;
    hasMobileButton?: boolean;
  }>({
    rendered: false,
    visible: false,
    userState: 'unknown'
  });

  useEffect(() => {
    // Check authentication state
    setSidebarInfo(prev => ({
      ...prev,
      userState: user ? 'authenticated' : 'not authenticated'
    }));

    // Check if sidebar renders after a delay
    const timer = setTimeout(() => {
      const sidebarElement = document.querySelector('.verotrade-sidebar, .verotrade-sidebar-overlay');
      const mobileButton = document.querySelector('.verotrade-mobile-menu-btn');
      
      setSidebarInfo({
        rendered: !!sidebarElement,
        visible: sidebarElement ? window.getComputedStyle(sidebarElement).transform !== 'translateX(-100%)' : false,
        userState: user ? 'authenticated' : 'not authenticated',
        hasMobileButton: !!mobileButton
      });
    }, 2000);

    return () => clearTimeout(timer);
  }, [user]);

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: 'var(--deep-charcoal)',
      color: 'var(--warm-off-white)',
      fontFamily: 'var(--font-family-primary)',
      padding: '2rem'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        <h1 style={{
          fontSize: '2rem',
          fontWeight: '600',
          marginBottom: '2rem',
          color: 'var(--dusty-gold)'
        }}>
          Direct Sidebar Test
        </h1>
        
        <div style={{
          backgroundColor: 'var(--soft-graphite)',
          padding: '1.5rem',
          borderRadius: '12px',
          marginBottom: '2rem'
        }}>
          <h2 style={{
            fontSize: '1.25rem',
            fontWeight: '600',
            marginBottom: '1rem',
            color: 'var(--warm-off-white)'
          }}>
            Authentication State:
          </h2>
          <p style={{
            fontSize: '1rem',
            color: sidebarInfo.userState === 'authenticated' ? '#4CAF50' : '#F44336',
            marginBottom: '1rem'
          }}>
            {sidebarInfo.userState === 'authenticated' ? '✅ User is authenticated' : '❌ User not authenticated'}
          </p>
          <p style={{
            fontSize: '0.875rem',
            color: 'var(--muted-gray)'
          }}>
            User ID: {user?.id || 'null'}
          </p>
        </div>

        {/* Test sidebar directly */}
        <div style={{
          backgroundColor: 'var(--soft-graphite)',
          padding: '1.5rem',
          borderRadius: '12px',
          marginBottom: '2rem'
        }}>
          <h2 style={{
            fontSize: '1.25rem',
            fontWeight: '600',
            marginBottom: '1rem',
            color: 'var(--warm-off-white)'
          }}>
            Direct Sidebar Component Test:
          </h2>
          
          {/* Force render sidebar with mock user */}
          <div style={{ marginBottom: '1rem' }}>
            <p style={{ fontSize: '0.875rem', marginBottom: '0.5rem' }}>
              Testing sidebar with mock authenticated user...
            </p>
            <UnifiedSidebar />
          </div>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '1rem',
            marginTop: '1rem'
          }}>
            <div style={{
              backgroundColor: 'rgba(184, 155, 94, 0.1)',
              padding: '1rem',
              borderRadius: '8px',
              border: '1px solid rgba(184, 155, 94, 0.3)'
            }}>
              <h3 style={{
                fontSize: '1rem',
                fontWeight: '500',
                marginBottom: '0.5rem',
                color: 'var(--dusty-gold)'
              }}>
                Sidebar Rendered:
              </h3>
              <p style={{
                fontSize: '0.875rem',
                color: sidebarInfo.rendered ? '#4CAF50' : '#F44336'
              }}>
                {sidebarInfo.rendered ? '✅ Sidebar Found in DOM' : '❌ Sidebar Not Found'}
              </p>
            </div>
            
            <div style={{
              backgroundColor: 'rgba(184, 155, 94, 0.1)',
              padding: '1rem',
              borderRadius: '8px',
              border: '1px solid rgba(184, 155, 94, 0.3)'
            }}>
              <h3 style={{
                fontSize: '1rem',
                fontWeight: '500',
                marginBottom: '0.5rem',
                color: 'var(--dusty-gold)'
              }}>
                Mobile Menu Button:
              </h3>
              <p style={{
                fontSize: '0.875rem',
                color: sidebarInfo.hasMobileButton ? '#4CAF50' : '#F44336'
              }}>
                {sidebarInfo.hasMobileButton ? '✅ Mobile Button Found' : '❌ Mobile Button Not Found'}
              </p>
            </div>
          </div>
        </div>

        <div style={{
          backgroundColor: 'var(--soft-graphite)',
          padding: '1.5rem',
          borderRadius: '12px'
        }}>
          <h2 style={{
            fontSize: '1.25rem',
            fontWeight: '600',
            marginBottom: '1rem',
            color: 'var(--warm-off-white)'
          }}>
            Manual Sidebar Tests:
          </h2>
          
          <div style={{
            display: 'flex',
            gap: '1rem',
            flexWrap: 'wrap',
            marginBottom: '1rem'
          }}>
            <button
              onClick={() => {
                // Try to find and click mobile menu button
                const mobileButton = document.querySelector('.verotrade-mobile-menu-btn');
                if (mobileButton) {
                  (mobileButton as HTMLElement).click();
                } else {
                  alert('Mobile menu button not found!');
                }
              }}
              style={{
                backgroundColor: 'var(--dusty-gold)',
                color: 'var(--deep-charcoal)',
                border: 'none',
                padding: '0.75rem 1.5rem',
                borderRadius: '8px',
                fontSize: '0.875rem',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              Toggle Mobile Menu
            </button>
            
            <button
              onClick={() => {
                const sidebar = document.querySelector('.verotrade-sidebar, .verotrade-sidebar-overlay');
                if (sidebar) {
                  const styles = window.getComputedStyle(sidebar);
                  alert(`Sidebar Found!\n\nDisplay: ${styles.display}\nVisibility: ${styles.visibility}\nTransform: ${styles.transform}\nZ-Index: ${styles.zIndex}\nWidth: ${styles.width}`);
                } else {
                  alert('Sidebar element not found in DOM!');
                }
              }}
              style={{
                backgroundColor: 'var(--soft-graphite)',
                color: 'var(--warm-off-white)',
                border: '1px solid rgba(184, 155, 94, 0.3)',
                padding: '0.75rem 1.5rem',
                borderRadius: '8px',
                fontSize: '0.875rem',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              Check Sidebar Styles
            </button>
          </div>
          
          <div style={{
            fontSize: '0.875rem',
            lineHeight: '1.6',
            color: 'var(--warm-off-white)'
          }}>
            <p style={{ marginBottom: '0.5rem' }}>
              <strong>Instructions:</strong>
            </p>
            <ol style={{ paddingLeft: '1.5rem' }}>
              <li style={{ marginBottom: '0.5rem' }}>This page tests the UnifiedSidebar component directly</li>
              <li style={{ marginBottom: '0.5rem' }}>The sidebar should render with a mock authenticated user</li>
              <li style={{ marginBottom: '0.5rem' }}>Try the manual test buttons to inspect sidebar state</li>
              <li style={{ marginBottom: '0.5rem' }}>Check browser console for additional debugging info</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TestSidebarDirectPage;