import './globals.css'
import '../styles/verotrade-design-system.css'
import { AuthContextProviderSimple as AuthContextProvider } from '@/contexts/AuthContext-simple';
import ErrorBoundaryWrapper from '@/components/ErrorBoundaryWrapper';
import { ToastProvider } from '@/contexts/ToastContext';
import GlobalToastContainer from '@/components/ui/GlobalToastContainer';

console.log('🔍 [HYDRATION_DEBUG] RootLayout component loading - START');
console.log('🔍 [HYDRATION_DEBUG] Layout environment:', {
  timestamp: new Date().toISOString(),
  isClient: typeof window !== 'undefined',
  hasWindow: typeof window !== 'undefined',
  hasDocument: typeof document !== 'undefined'
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  console.log('🔍 [HYDRATION_DEBUG] RootLayout rendering with children:', !!children);
  console.log('🔍 [HYDRATION_DEBUG] RootLayout render context:', {
    timestamp: new Date().toISOString(),
    isClient: typeof window !== 'undefined',
    childrenType: typeof children,
    hasChildren: !!children
  });
  
  return (
    <html lang="en" className="h-full" style={{ backgroundColor: 'var(--deep-charcoal)' }}>
      <body className="h-full" style={{ color: 'var(--warm-off-white)' }}>
        <AuthContextProvider>
          <ToastProvider>
            <ErrorBoundaryWrapper>
              {children}
            </ErrorBoundaryWrapper>
            <GlobalToastContainer />
          </ToastProvider>
        </AuthContextProvider>
      </body>
    </html>
  );
}
