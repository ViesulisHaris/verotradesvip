'use client';

import React, { useEffect, useState } from 'react';
import UnifiedLayout from '@/components/layout/UnifiedLayout';
import AuthGuard from '@/components/AuthGuard';

export default function TestSidebarVisibility() {
  const [diagnosticInfo, setDiagnosticInfo] = useState<any>({});
  const [sidebarVisible, setSidebarVisible] = useState(false);

  useEffect(() => {
    // Check sidebar element existence and state
    const checkSidebar = () => {
      const sidebarElement = document.querySelector('.verotrade-sidebar-overlay') || 
                          document.querySelector('.verotrade-sidebar');
      
      if (sidebarElement) {
        const styles = window.getComputedStyle(sidebarElement);
        const info = {
          exists: true,
          visible: styles.visibility !== 'hidden' && styles.opacity !== '0',
          transform: styles.transform,
          display: styles.display,
          opacity: styles.opacity,
          zIndex: styles.zIndex,
          width: styles.width,
          height: styles.height,
          position: styles.position,
          left: styles.left,
          className: sidebarElement.className
        };
        
        setDiagnosticInfo(info);
        setSidebarVisible(info.visible);
      } else {
        setDiagnosticInfo({ exists: false });
        setSidebarVisible(false);
      }
    };

    // Initial check
    checkSidebar();

    // Set up interval to monitor changes
    const interval = setInterval(checkSidebar, 1000);

    // Listen for sidebar events
    const handleSidebarVisibility = (event: CustomEvent) => {
      console.log('🔍 [SIDEBAR_TEST] Sidebar visibility event:', event.detail);
      setTimeout(checkSidebar, 100);
    };

    window.addEventListener('sidebarVisibility', handleSidebarVisibility as EventListener);

    return () => {
      clearInterval(interval);
      window.removeEventListener('sidebarVisibility', handleSidebarVisibility as EventListener);
    };
  }, []);

  const forceShowSidebar = () => {
    const sidebarElement = document.querySelector('.verotrade-sidebar-overlay') || 
                        document.querySelector('.verotrade-sidebar');
    
    if (sidebarElement) {
      console.log('🔍 [SIDEBAR_TEST] Forcing sidebar to show...');
      (sidebarElement as HTMLElement).style.transform = 'translateX(0)';
      (sidebarElement as HTMLElement).style.visibility = 'visible';
      (sidebarElement as HTMLElement).style.opacity = '1';
      
      // Trigger visibility event
      window.dispatchEvent(new CustomEvent('sidebarVisibility', {
        detail: { isVisible: true }
      }));
      
      setTimeout(() => {
        const styles = window.getComputedStyle(sidebarElement);
        console.log('🔍 [SIDEBAR_TEST] Sidebar styles after force show:', {
          transform: styles.transform,
          visibility: styles.visibility,
          opacity: styles.opacity
        });
      }, 100);
    }
  };

  const toggleSidebarState = () => {
    // Try to trigger sidebar toggle
    window.dispatchEvent(new CustomEvent('toggleSidebar', {}));
    
    // Also try the collapse event
    window.dispatchEvent(new CustomEvent('sidebarCollapse', {
      detail: { isCollapsed: false }
    }));
  };

  return (
    <AuthGuard requireAuth={true}>
      <UnifiedLayout>
        <div style={{ 
          padding: '2rem',
          backgroundColor: 'var(--deep-charcoal, #121212)',
          color: 'var(--warm-off-white, #EAE6DD)',
          minHeight: '100vh'
        }}>
          <h1 style={{ fontSize: '2rem', marginBottom: '2rem' }}>Sidebar Visibility Test</h1>
          
          <div style={{ 
            backgroundColor: 'var(--soft-graphite, #202020)',
            padding: '1.5rem',
            borderRadius: '12px',
            marginBottom: '2rem',
            border: '1px solid var(--border-primary, rgba(184, 155, 94, 0.3))'
          }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Diagnostic Information</h2>
            
            <div style={{ fontFamily: 'monospace', fontSize: '0.875rem', lineHeight: '1.5' }}>
              <p><strong>Sidebar Exists:</strong> {diagnosticInfo.exists ? 'Yes' : 'No'}</p>
              {diagnosticInfo.exists && (
                <>
                  <p><strong>Visible:</strong> {sidebarVisible ? 'Yes' : 'No'}</p>
                  <p><strong>Transform:</strong> {diagnosticInfo.transform}</p>
                  <p><strong>Visibility:</strong> {diagnosticInfo.visibility}</p>
                  <p><strong>Opacity:</strong> {diagnosticInfo.opacity}</p>
                  <p><strong>Z-Index:</strong> {diagnosticInfo.zIndex}</p>
                  <p><strong>Width:</strong> {diagnosticInfo.width}</p>
                  <p><strong>Position:</strong> {diagnosticInfo.position}</p>
                  <p><strong>Class:</strong> {diagnosticInfo.className}</p>
                </>
              )}
            </div>
          </div>

          <div style={{ 
            display: 'flex', 
            gap: '1rem', 
            marginBottom: '2rem',
            flexWrap: 'wrap'
          }}>
            <button
              onClick={forceShowSidebar}
              style={{
                backgroundColor: 'var(--dusty-gold, #B89B5E)',
                color: 'var(--deep-charcoal, #121212)',
                border: 'none',
                padding: '0.75rem 1.5rem',
                borderRadius: '8px',
                fontSize: '1rem',
                cursor: 'pointer',
                fontWeight: '500'
              }}
            >
              Force Show Sidebar
            </button>
            
            <button
              onClick={toggleSidebarState}
              style={{
                backgroundColor: 'var(--dusty-gold, #B89B5E)',
                color: 'var(--deep-charcoal, #121212)',
                border: 'none',
                padding: '0.75rem 1.5rem',
                borderRadius: '8px',
                fontSize: '1rem',
                cursor: 'pointer',
                fontWeight: '500'
              }}
            >
              Toggle Sidebar State
            </button>
          </div>

          <div style={{ 
            backgroundColor: 'var(--soft-graphite, #202020)',
            padding: '1.5rem',
            borderRadius: '12px',
            border: '1px solid var(--border-primary, rgba(184, 155, 94, 0.3))'
          }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Instructions</h2>
            <ol style={{ lineHeight: '1.6' }}>
              <li>Check the diagnostic information above to see if the sidebar element exists</li>
              <li>If the sidebar exists but is hidden, click "Force Show Sidebar" to override CSS</li>
              <li>Click "Toggle Sidebar State" to trigger sidebar events</li>
              <li>Open browser console to see detailed logging</li>
              <li>Check if the sidebar appears after clicking the buttons</li>
            </ol>
            
            <div style={{ 
              marginTop: '1rem', 
              padding: '1rem',
              backgroundColor: 'rgba(184, 155, 94, 0.1)',
              borderRadius: '8px',
              border: '1px solid rgba(184, 155, 94, 0.3)'
            }}>
              <strong>Expected Behavior:</strong> If the sidebar is working correctly, you should see it appear on the left side of the screen when you click "Force Show Sidebar". If nothing appears, there may be a fundamental issue with the sidebar component.
            </div>
          </div>
        </div>
      </UnifiedLayout>
    </AuthGuard>
  );
}