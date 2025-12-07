'use client';

import { AuthContextProviderSimple } from '@/contexts/AuthContext-simple';
import './globals.css';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  console.log('🔍 [ROOT_LAYOUT_DEBUG] RootLayout rendering with AuthContextProviderSimple - START', {
    timestamp: new Date().toISOString(),
    hasChildren: !!children,
    isClient: typeof window !== 'undefined'
  });
  
  console.log('🔍 [ROOT_LAYOUT_DEBUG] About to render AuthContextProviderSimple');

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>VeroTrade - Professional Trading Journal</title>
      </head>
      <body>
        <AuthContextProviderSimple>
          {children}
        </AuthContextProviderSimple>
      </body>
    </html>
  );
}