'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/supabase/client';
import { useRouter, usePathname } from 'next/navigation';
import Sidebar from '@/components/Sidebar';

interface LayoutContentProps {
  children: React.ReactNode;
}

export default function LayoutContent({ children }: LayoutContentProps) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
    
    const getSession = async () => {
      try {
        console.log('🔍 [DEBUG] LayoutContent - Starting getSession...');
        const { data, error } = await supabase.auth.getSession();
        console.log('🔍 [DEBUG] LayoutContent - getSession result:', { data, error });
        setUser(data.session?.user ?? null);
        setLoading(false);

        if (!data.session && !['/login', '/register'].includes(pathname)) {
          console.log('🔍 [DEBUG] LayoutContent - Redirecting to login - no session found');
          router.replace('/login');
        }
      } catch (error) {
        console.error('❌ [ERROR] LayoutContent - getSession failed:', error);
        setLoading(false);
      }
    };
    getSession();

    const { data: listener } = supabase.auth.onAuthStateChange((_, session) => {
      console.log('🔍 [DEBUG] LayoutContent - Auth state changed:', session);
      setUser(session?.user ?? null);
    });

    return () => listener.subscription.unsubscribe();
  }, [router, pathname]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace('/login');
  };

  // Show loading state only during initial server render or when not mounted
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
    <div className="relative h-full flex">
      {user && <Sidebar onLogout={handleLogout} />}
      <div className="flex-1 flex flex-col min-h-screen lg:ml-64">
        <header className="glass p-component flex justify-between items-center border-b border-white/10">
          <button
            onClick={() => document.getElementById('sidebar-toggle')?.click()}
            className="p-element rounded-lg hover:bg-white/10 lg:hidden"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h1 className="text-2xl font-bold">VeroTrade</h1>
          {user && (
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-900/50 text-red-300 rounded-xl hover:bg-red-900/70"
            >
              Logout
            </button>
          )}
        </header>
        <main className="flex-1 p-component lg:p-section overflow-auto">
          <div className="w-full max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}