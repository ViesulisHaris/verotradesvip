'use client';

import './globals.css';
import { Inter } from 'next/font/google';
import Sidebar from '@/components/Sidebar';
import ThemeToggle from '@/components/ThemeToggle';
import { useEffect, useState } from 'react';
import { supabase } from '@/supabase/client';
import { useRouter, usePathname } from 'next/navigation';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const getSession = async () => {
      const { data } = await supabase.auth.getSession();
      setUser(data.session?.user ?? null);
      setLoading(false);

      // Redirect to login if not auth and not on auth pages
      if (!data.session && !['/login', '/register'].includes(pathname)) {
        router.replace('/login');
      }
    };
    getSession();

    const { data: listener } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
    });

    return () => listener.subscription.unsubscribe();
  }, [router, pathname]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace('/login');
  };

  if (loading) {
    return (
      <html lang="en" className="h-full">
        <body className={`${inter.className} h-full flex items-center justify-center`}>
          <div className="text-white text-xl">Loading...</div>
        </body>
      </html>
    );
  }

  if (!user && !['/login', '/register'].includes(pathname)) {
    return null;
  }

  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} flex h-full bg-gradient-to-br from-pink-100 via-purple-50 to-blue-50`}>
        {user && <Sidebar onLogout={handleLogout} />}
        <div className="flex-1 flex flex-col">
          <header className="glass p-4 flex justify-between items-center border-b border-white/20">
            <h1 className="text-2xl font-bold text-white">VeroTrade</h1>
            <div className="flex items-center gap-3">
              <ThemeToggle />
              {user && (
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 bg-red-500/20 text-red-300 rounded-xl hover:bg-red-500/30 transition"
                >
                  Logout
                </button>
              )}
            </div>
          </header>
          <main className="flex-1 p-6 overflow-auto">{children}</main>
        </div>
      </body>
    </html>
  );
}
