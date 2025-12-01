import { NextRequest, NextResponse } from 'next/server';
import { getServerUser } from '@/lib/auth-server';

export async function GET(request: NextRequest) {
  try {
    console.log('=== Server Auth API Test Started ===');
    
    // Test the getServerUser function with the fallback mechanism
    const user = await getServerUser();
    
    console.log('Server auth result:', user ? 'USER_FOUND' : 'USER_NULL');
    
    if (user) {
      console.log('User details:', {
        id: user.id,
        email: user.email,
        created_at: user.created_at
      });
    }
    
    return NextResponse.json({
      success: true,
      user: user ? {
        id: user.id,
        email: user.email,
        created_at: user.created_at
      } : null,
      message: user ? 'Server authentication successful' : 'No user found',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Server auth API error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      user: null,
      message: 'Server authentication failed',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}