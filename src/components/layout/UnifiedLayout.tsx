'use client';

import React from 'react';
import TopNavigation from '@/components/navigation/TopNavigation';
import ErrorBoundary from '@/components/ErrorBoundary';
import HooksErrorBoundary from '@/components/HooksErrorBoundary';

interface UnifiedLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export default function UnifiedLayout({ children, className }: UnifiedLayoutProps) {
  return (
    <div
      className={`verotrade-min-h-screen verotrade-flex ${className}`}
      style={{
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Top Navigation Bar with Icons */}
      <HooksErrorBoundary
        onError={(error, errorInfo, isHooksError) => {
          console.error('🚨 UnifiedLayout HooksErrorBoundary caught error:', {
            error: error.message,
            isHooksError,
            componentStack: errorInfo.componentStack
          });
        }}
      >
        <ErrorBoundary
          onError={(error, errorInfo, isHydrationError) => {
            console.error('🚨 UnifiedLayout ErrorBoundary caught error:', {
              error: error.message,
              isHydrationError,
              componentStack: errorInfo.componentStack
            });
          }}
        >
          <TopNavigation />
        </ErrorBoundary>
      </HooksErrorBoundary>
      
      {/* Main content area */}
      <main
        className="verotrade-main-content"
        style={{
          width: '100%',
          minHeight: '100vh', // Full viewport height
          position: 'relative',
          zIndex: 1,
          backgroundColor: 'var(--deep-charcoal, #121212)',
          overflow: 'visible',
          boxSizing: 'border-box',
          pointerEvents: 'auto',
          marginTop: '0', // Ensure no negative margin
          paddingTop: '0', // Remove padding-top
        } as React.CSSProperties}
      >
        {/* Content wrapper with VeroTrade styling - adds margin-top to account for header */}
        <div
          className="verotrade-content-wrapper"
          style={{
            paddingTop: '70px', // Account for fixed navigation bar height (matching TopNavigation height)
            padding: '70px var(--spacing-section) var(--spacing-section)', // Top: 70px, Left/Right: 32px, Bottom: 32px
            maxWidth: '1400px',
            margin: '0 auto',
            minHeight: 'calc(100vh - 70px)', // Adjust for header height
            transform: 'translateZ(0)', // Hardware acceleration
            willChange: 'auto',
            boxSizing: 'border-box',
          }}
        >
          {/* Page transition wrapper */}
          <div
            className="verotrade-animate-fadeIn"
            style={{
              transition: 'opacity 0.3s ease',
            }}
          >
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}