import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  const protectedRoutes = [
    '/dashboard',
    '/trades',
    '/strategies',
    '/log-trade',
    '/confluence',
    '/calendar',
    '/analytics'
  ];
  
  const publicRoutes = [
    '/login',
    '/register',
    '/',
    '/api'
  ];
  
  // Skip static assets and API routes
  if (pathname.startsWith('/_next/') ||
      pathname.startsWith('/favicon.ico') ||
      pathname.startsWith('/api/') ||
      pathname.includes('.')) {
    return NextResponse.next();
  }
  
  // Check if this is a protected route
  const isProtectedRoute = protectedRoutes.some(route =>
    pathname === route || pathname.startsWith(route + '/')
  );
  
  // Check if this is a public route
  const isPublicRoute = publicRoutes.some(route =>
    pathname === route || pathname.startsWith(route + '/')
  );
  
  // If it's a public route, allow access
  if (isPublicRoute) {
    return NextResponse.next();
  }
  
  // If it's a protected route, check authentication
  if (isProtectedRoute) {
    try {
      const supabase = createClient(supabaseUrl, supabaseAnonKey);
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error || !session?.user) {
        const loginUrl = new URL('/login', request.url);
        return NextResponse.redirect(loginUrl);
      }
      
      return NextResponse.next();
      
    } catch (error) {
      const loginUrl = new URL('/login', request.url);
      return NextResponse.redirect(loginUrl);
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};