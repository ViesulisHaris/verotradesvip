'use client';

import React from 'react';
import AuthGuard from '@/components/AuthGuard';
import UnifiedLayout from '@/components/layout/UnifiedLayout';
import ZoomAwareLayout from '@/components/ZoomAwareLayout';

function Analytics() {
  return (
    <div className="min-h-screen space-y-4 sm:space-y-6 p-4 sm:p-6 pt-[60px]">
      <div className="flex flex-col gap-2 sm:gap-4">
        <h1 className="heading-luxury text-2xl sm:text-3xl md:text-4xl">Analytics</h1>
        <p className="body-text text-sm sm:text-base">Comprehensive trading performance analysis and insights</p>
      </div>
      <div className="card-luxury p-4 sm:p-6 md:p-8">
        <div className="text-center py-8 sm:py-12">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-info-subtle rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
            <svg className="w-8 h-8 sm:w-10 sm:h-10 text-info" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h3 className="heading-4 text-lg sm:text-xl mb-2 sm:mb-4">Analytics Coming Soon</h3>
          <p className="body-text text-sm sm:text-base mb-6 sm:mb-8 max-w-md mx-auto">
            Advanced trading analytics, performance metrics, and detailed insights are being developed to help you improve your trading strategy.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
            <button
              onClick={() => window.location.href = '/dashboard'}
              className="btn-primary min-h-[44px] min-w-[120px]"
            >
              View Dashboard
            </button>
            <button
              onClick={() => window.location.href = '/trades'}
              className="btn-secondary min-h-[44px] min-w-[120px]"
            >
              View Trades
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Wrapper component with authentication guard
function AnalyticsWithAuth() {
  return (
    <AuthGuard>
      <UnifiedLayout>
        <Analytics />
      </UnifiedLayout>
    </AuthGuard>
  );
}

export default AnalyticsWithAuth;