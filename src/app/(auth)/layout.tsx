'use client';

import AuthGuard from '@/components/AuthGuard';
import { usePathname } from 'next/navigation';
import UnifiedLayout from '@/components/layout/UnifiedLayout';
import { AuthContextProviderSimple } from '@/contexts/AuthContext-simple';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  
  // Don't require authentication for login and register pages
  const requireAuth = !pathname.includes('/login') && !pathname.includes('/register');
  
  // Check if current page needs UnifiedLayout (sidebar navigation)
  const needsUnifiedLayout = pathname.includes('/dashboard') ||
                           pathname.includes('/trades') ||
                           pathname.includes('/log-trade') ||
                           pathname.includes('/calendar') ||
                           pathname.includes('/strategies') ||
                           pathname.includes('/confluence') ||
                           pathname.includes('/settings');
  
  console.log('🔍 [AUTH_LAYOUT_DEBUG] AuthLayout rendering with AuthContextProviderSimple', {
    pathname,
    requireAuth,
    needsUnifiedLayout,
    timestamp: new Date().toISOString()
  });
  
  // CRITICAL FIX: Ensure AuthContextProviderSimple wraps all components in auth route group
  // This fixes the "AuthContext is undefined" issue by guaranteeing provider availability
  return (
    <AuthContextProviderSimple>
      <AuthGuard requireAuth={requireAuth}>
        {needsUnifiedLayout ? (
          <UnifiedLayout>
            {children}
          </UnifiedLayout>
        ) : (
          children
        )}
      </AuthGuard>
    </AuthContextProviderSimple>
  );
}