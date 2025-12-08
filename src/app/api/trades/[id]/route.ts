import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { validateUUID } from '@/lib/uuid-validation';

// GET single trade
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const tradeId = validateUUID(params.id, 'trade_id');
    
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
      
      const result = await supabase.auth.getUser();
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
      return NextResponse.json({
        error: 'Authentication required',
        details: authError?.message
      }, { status: 401 });
    }

    const userId = validateUUID(user.id, 'user_id');

    // Fetch the trade
    const { data: trade, error } = await supabase
      .from('trades')
      .select(`
        *,
        strategies (
          id,
          name
        )
      `)
      .eq('id', tradeId)
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching trade:', error);
      return NextResponse.json({
        error: 'Failed to fetch trade',
        details: error.message
      }, { status: 500 });
    }

    if (!trade) {
      return NextResponse.json({
        error: 'Trade not found'
      }, { status: 404 });
    }

    return NextResponse.json({ trade });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// PUT (update) trade
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const tradeId = validateUUID(params.id, 'trade_id');
    const updateData = await request.json();
    
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
      
      const result = await supabase.auth.getUser();
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
      return NextResponse.json({
        error: 'Authentication required',
        details: authError?.message
      }, { status: 401 });
    }

    const userId = validateUUID(user.id, 'user_id');

    // Update the trade
    const { data: updatedTrade, error } = await supabase
      .from('trades')
      .update({
        symbol: updateData.symbol,
        side: updateData.side,
        quantity: updateData.quantity,
        entry_price: updateData.entry_price,
        exit_price: updateData.exit_price,
        pnl: updateData.pnl,
        trade_date: updateData.trade_date,
        entry_time: updateData.entry_time,
        exit_time: updateData.exit_time,
        emotional_state: updateData.emotional_state,
        market: updateData.market,
        notes: updateData.notes,
        updated_at: new Date().toISOString()
      })
      .eq('id', tradeId)
      .eq('user_id', userId)
      .select(`
        *,
        strategies (
          id,
          name
        )
      `)
      .single();

    if (error) {
      console.error('Error updating trade:', error);
      return NextResponse.json({
        error: 'Failed to update trade',
        details: error.message
      }, { status: 500 });
    }

    if (!updatedTrade) {
      return NextResponse.json({
        error: 'Trade not found or no changes made'
      }, { status: 404 });
    }

    return NextResponse.json({ 
      message: 'Trade updated successfully',
      trade: updatedTrade 
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// DELETE trade
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const tradeId = validateUUID(params.id, 'trade_id');
    
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
      
      const result = await supabase.auth.getUser();
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
      return NextResponse.json({
        error: 'Authentication required',
        details: authError?.message
      }, { status: 401 });
    }

    const userId = validateUUID(user.id, 'user_id');

    // Delete the trade
    const { error } = await supabase
      .from('trades')
      .delete()
      .eq('id', tradeId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error deleting trade:', error);
      return NextResponse.json({
        error: 'Failed to delete trade',
        details: error.message
      }, { status: 500 });
    }

    return NextResponse.json({ 
      message: 'Trade deleted successfully'
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}