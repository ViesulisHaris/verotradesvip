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
    <html lang="en" className="scroll-smooth">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>VeroTrade - Professional Trading Journal</title>
        
        {/* Google Fonts - Inter and Playfair Display */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@100..900&family=Playfair+Display:wght@400..900&display=swap" rel="stylesheet" />
        
        {/* Material Symbols Outlined */}
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,300,0,0" />
        
        {/* Font variable setup */}
        <style jsx global>{`
          :root {
            --font-inter: 'Inter', sans-serif;
            --font-playfair: 'Playfair Display', serif;
          }
        `}</style>
      </head>
      <body className="font-sans antialiased">
        <AuthContextProviderSimple>
          {children}
        </AuthContextProviderSimple>
      </body>
    </html>
  );
}