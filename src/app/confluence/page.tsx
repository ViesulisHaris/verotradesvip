'use client';

import React from 'react';
import UnifiedLayout from '@/components/layout/UnifiedLayout';
import AuthGuard from '@/components/AuthGuard';
import { Network } from 'lucide-react';

function ConfluencePage() {
  return (
    <UnifiedLayout>
      <div className="min-h-screen space-y-4 sm:space-y-6">
        <div className="flex flex-col gap-2 sm:gap-4">
          <h1 className="heading-luxury text-2xl sm:text-3xl md:text-4xl">Confluence</h1>
          <p className="body-text text-sm sm:text-base">Analyze the confluence of factors affecting your trading performance</p>
        </div>
        <div className="card-luxury p-4 sm:p-6 md:p-8">
          <div className="text-center py-8 sm:py-12">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-info-subtle rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
              <Network className="w-8 h-8 sm:w-10 sm:h-10 text-info" />
            </div>
            <h3 className="heading-4 text-lg sm:text-xl mb-2 sm:mb-4">Confluence Analysis Coming Soon</h3>
            <p className="body-text text-sm sm:text-base mb-6 sm:mb-8 max-w-md mx-auto">
              Advanced confluence analysis tools are being developed to help you understand how multiple factors 
              interact to influence your trading outcomes.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
              <button
                onClick={() => window.location.href = '/dashboard'}
                className="btn-primary min-h-[44px] min-w-[120px]"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    </UnifiedLayout>
  );
}

// Wrapper component with authentication guard
function ConfluencePageWithAuth() {
  return (
    <AuthGuard>
      <ConfluencePage />
    </AuthGuard>
  );
}

export default ConfluencePageWithAuth;