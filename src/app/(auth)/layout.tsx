'use client';

import AuthGuard from '@/components/AuthGuard';
import { usePathname } from 'next/navigation';
import UnifiedLayout from '@/components/layout/UnifiedLayout';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  
  // Don't require authentication for login and register pages
  const requireAuth = !pathname.includes('/login') && !pathname.includes('/register');
  
  // Check if current page needs UnifiedLayout (sidebar navigation)
  // CRITICAL FIX: Be more permissive about showing sidebar for authenticated routes
  const needsUnifiedLayout = pathname.includes('/dashboard') ||
                           pathname.includes('/trades') ||
                           pathname.includes('/log-trade') ||
                           pathname.includes('/calendar') ||
                           pathname.includes('/strategies') ||
                           pathname.includes('/confluence') ||
                           pathname.includes('/settings');
  
  console.log('🔍 [AUTH_LAYOUT_DEBUG] AuthLayout rendering', {
    pathname,
    requireAuth,
    needsUnifiedLayout,
    timestamp: new Date().toISOString()
  });
  
  return (
    <AuthGuard requireAuth={requireAuth}>
      {needsUnifiedLayout ? (
        <UnifiedLayout>
          {children}
        </UnifiedLayout>
      ) : (
        children
      )}
    </AuthGuard>
  );
}