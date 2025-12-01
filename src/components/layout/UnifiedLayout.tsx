'use client';

import React from 'react';
import TopNavigation from '@/components/navigation/TopNavigation';
import ErrorBoundary from '@/components/ErrorBoundary';

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
      
      {/* Main content area */}
      <main
        className="verotrade-main-content"
        style={{
          paddingTop: '80px', // Account for fixed navigation bar height
          width: '100%',
          minHeight: '100vh',
          position: 'relative',
          zIndex: 1,
          backgroundColor: 'var(--deep-charcoal, #121212)',
          overflow: 'visible',
          boxSizing: 'border-box',
          pointerEvents: 'auto',
        }}
      >
        {/* Content wrapper with VeroTrade styling */}
        <div
          className="verotrade-content-wrapper"
          style={{
            padding: 'var(--spacing-section)', // 32px
            maxWidth: '1400px',
            margin: '0 auto',
            transform: 'translateZ(0)', // Hardware acceleration
            willChange: 'auto',
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