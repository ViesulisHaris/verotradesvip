'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface ModernLayoutProps {
  children: React.ReactNode;
  showNavigation?: boolean;
}

export default function ModernLayout({ children, showNavigation = true }: ModernLayoutProps) {
  const { user } = useAuth();
  const pathname = usePathname();
  const [isClient, setIsClient] = useState(false);

  // Handle hydration
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Pages that don't need navigation
  const noNavPages = ['/login', '/register'];
  const shouldShowNavigation = showNavigation && !noNavPages.includes(pathname) && user;

  if (!isClient) {
    // Return a simple loading state during hydration
    return (
      <div className="verotrade-min-h-screen bg-verotrade-primary verotrade-flex verotrade-items-center verotrade-justify-center">
        <div className="verotrade-animate-pulse verotrade-text-warning verotrade-text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="verotrade-relative">
      {/* Main Content - Simple layout without navigation */}
      <main className="verotrade-min-h-screen bg-verotrade-primary">
        <div className="verotrade-w-full">
          {children}
        </div>
      </main>
    </div>
  );
}