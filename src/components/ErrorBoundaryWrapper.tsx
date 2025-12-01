'use client';

import React from 'react';
import ErrorBoundary from './ErrorBoundary';

interface ErrorBoundaryWrapperProps {
  children: React.ReactNode;
}

export default function ErrorBoundaryWrapper({ children }: ErrorBoundaryWrapperProps) {
  return (
    <ErrorBoundary
      onError={(error, errorInfo, isHydrationError) => {
        console.error('🚨 RootLayout ErrorBoundary caught error:', {
          error: error.message,
          stack: error.stack,
          componentStack: errorInfo.componentStack,
          isHydrationError,
          timestamp: new Date().toISOString()
        });
      }}
    >
      <ErrorBoundary
        onError={(error, errorInfo, isHydrationError) => {
          console.error('🚨 AuthContext ErrorBoundary caught error:', {
            error: error.message,
            stack: error.stack,
            componentStack: errorInfo.componentStack,
            isHydrationError,
            timestamp: new Date().toISOString()
          });
        }}
      >
        {children}
      </ErrorBoundary>
    </ErrorBoundary>
  );
}