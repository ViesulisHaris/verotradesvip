import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { validateUUID } from '@/lib/uuid-validation';

interface StrategyResponse {
  strategies: Array<{
    id: string;
    name: string;
    description?: string;
    is_active: boolean;
  }>;
}

export async function GET(request: Request) {
  try {
    console.log('🔄 [STRATEGIES] Fetching user strategies...');
    
    // Initialize Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    
    // Extract JWT from Authorization header
    const authHeader = request.headers.get('authorization');
    let supabase;
    let user = null;
    let authError = null;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      
      supabase = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false
        },
        global: {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      });
      
      const result = await supabase.auth.getUser(token);
      user = result.data?.user;
      authError = result.error;
    } else {
      supabase = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false
        }
      });
      
      const result = await supabase.auth.getUser();
      user = result.data?.user;
      authError = result.error;
    }
    
    if (authError || !user) {
      console.error('❌ [STRATEGIES] Authentication failed:', authError?.message);
      return NextResponse.json({
        error: 'Authentication required',
        details: authError?.message
      }, { status: 401 });
    }

    const userId = validateUUID(user.id, 'user_id');

    // Fetch user's strategies
    const { data: strategies, error: fetchError } = await supabase
      .from('strategies')
      .select('id, name, description, is_active')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('❌ [STRATEGIES] Error fetching strategies:', fetchError);
      return NextResponse.json({
        error: 'Failed to fetch strategies',
        details: fetchError.message
      }, { status: 500 });
    }

    const response: StrategyResponse = {
      strategies: strategies || []
    };

    console.log('✅ [STRATEGIES] Strategies fetched successfully:', {
      count: response.strategies.length,
      strategies: response.strategies.map(s => ({ id: s.id, name: s.name }))
    });

    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ [STRATEGIES] Unexpected error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}