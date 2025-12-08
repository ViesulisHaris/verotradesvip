'use client';

import AuthGuard from '@/components/AuthGuard';
import UnifiedLayout from '@/components/layout/UnifiedLayout';
import TradeHistory from '@/components/TradeHistory';

// Main page component with authentication guard
export default function TradesPage() {
  return (
    <AuthGuard requireAuth={true}>
      <UnifiedLayout>
        <TradeHistory />
      </UnifiedLayout>
    </AuthGuard>
  );
}