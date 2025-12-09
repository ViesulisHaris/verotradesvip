/**
 * Dashboard fallback component for when APIs are unavailable
 */

import React from 'react';

interface DashboardFallbackProps {
  error?: string;
  isAuthError?: boolean;
}

export default function DashboardFallback({ error, isAuthError }: DashboardFallbackProps) {
  return (
    <div className="min-h-screen bg-[#050505] text-[#EAEAEA] font-['Inter'] flex items-center justify-center">
      <div className="max-w-2xl mx-auto p-8 text-center">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-[#E6D5B8] mb-4">
            Trading Dashboard
          </h1>
          <div className="w-24 h-1 bg-[#C5A065] mx-auto mb-8"></div>
        </div>
        
        <div className="bg-[#1F1F1F] rounded-lg p-8 border border-[#2F2F2F]">
          {isAuthError ? (
            <>
              <div className="text-6xl mb-4">🔐</div>
              <h2 className="text-2xl font-semibold text-[#E6D5B8] mb-4">
                Authentication Required
              </h2>
              <p className="text-[#9ca3af] mb-6">
                Please log in to view your trading dashboard statistics and performance metrics.
              </p>
              <button 
                onClick={() => window.location.href = '/login'}
                className="bg-[#C5A065] hover:bg-[#C5A065]/80 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                Go to Login
              </button>
            </>
          ) : (
            <>
              <div className="text-6xl mb-4">📊</div>
              <h2 className="text-2xl font-semibold text-[#E6D5B8] mb-4">
                Dashboard Temporarily Unavailable
              </h2>
              <p className="text-[#9ca3af] mb-6">
                {error || 'We're having trouble loading your trading data. Please try again in a few moments.'}
              </p>
              <button 
                onClick={() => window.location.reload()}
                className="bg-[#2EBD85] hover:bg-[#2EBD85]/80 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                Try Again
              </button>
            </>
          )}
        </div>
        
        <div className="mt-8 text-sm text-[#9ca3af]">
          <p>If this problem persists, please contact support.</p>
        </div>
      </div>
    </div>
  );
}
