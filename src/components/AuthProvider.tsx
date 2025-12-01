'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/supabase/client';
import { useRouter, usePathname } from 'next/navigation';

interface AuthProviderProps {
  children: React.ReactNode;
}

export default function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
    
    const getSession = async () => {
      try {
        console.log('🔍 [DEBUG] Starting getSession...');
        const { data, error } = await supabase.auth.getSession();
        console.log('🔍 [DEBUG] getSession result:', { data, error });
        setUser(data.session?.user ?? null);
        setLoading(false);

        if (!data.session && !['/login', '/register'].includes(pathname)) {
          console.log('🔍 [DEBUG] Redirecting to login - no session found');
          router.replace('/login');
        }
      } catch (error) {
        console.error('❌ [ERROR] getSession failed:', error);
        setLoading(false);
      }
    };
    getSession();

    const { data: listener } = supabase.auth.onAuthStateChange((_, session) => {
      console.log('🔍 [DEBUG] Auth state changed:', session);
      setUser(session?.user ?? null);
    });

    return () => listener.subscription.unsubscribe();
  }, [router, pathname]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace('/login');
  };

  // Show loading state only during initial load
  if (loading && !mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        Loading...
      </div>
    );
  }

  // Show null for protected routes when no user
  if (!user && !['/login', '/register'].includes(pathname)) {
    return null;
  }

  return (
    <>
      {children}
      {/* Pass user and logout handler to children via context or props if needed */}
      <script 
        dangerouslySetInnerHTML={{
          __html: `
            window.__AUTH_USER = ${JSON.stringify(user)};
            window.__AUTH_LOGOUT = ${handleLogout.toString()};
          `
        }}
      />
    </>
  );
}