import { supabaseServer } from '@/supabase/server';
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const supabase = supabaseServer;
    
    // Step 1: Identify corrupted trades
    const { data: corruptedTrades, error: identifyError } = await supabase
      .from('trades')
      .select('id, market')
      .like('market', '%,%');
    
    if (identifyError) {
      return NextResponse.json({ 
        error: 'Error identifying corrupted trades', 
        details: identifyError.message 
      }, { status: 500 });
    }
    
    let deletedCount = 0;
    
    // Step 2: Delete corrupted trades if any exist
    if (corruptedTrades && corruptedTrades.length > 0) {
      const { error: deleteError } = await supabase
        .from('trades')
        .delete()
        .like('market', '%,%');
      
      if (deleteError) {
        return NextResponse.json({ 
          error: 'Error deleting corrupted trades', 
          details: deleteError.message 
        }, { status: 500 });
      }
      
      deletedCount = corruptedTrades.length;
    }
    
    // Step 3: Verify cleanup
    const { data: remainingCorrupted, error: verifyError } = await supabase
      .from('trades')
      .select('id')
      .like('market', '%,%');
    
    if (verifyError) {
      return NextResponse.json({ 
        error: 'Error verifying cleanup', 
        details: verifyError.message 
      }, { status: 500 });
    }
    
    // Step 4: Get final statistics
    const { data: finalStats, error: statsError } = await supabase
      .from('trades')
      .select('market');
    
    let marketStats = {};
    if (!statsError && finalStats) {
      const uniqueMarkets = [...new Set(finalStats.map((t: any) => t.market))];
      marketStats = {
        totalTrades: finalStats.length,
        uniqueMarkets: uniqueMarkets,
        marketCount: uniqueMarkets.length
      };
    }
    
    return NextResponse.json({
      success: true,
      message: `Database cleanup completed successfully`,
      results: {
        corruptedTradesFound: corruptedTrades?.length || 0,
        corruptedTradesDeleted: deletedCount,
        remainingCorruptedTrades: remainingCorrupted?.length || 0,
        finalStats: marketStats
      }
    });
    
  } catch (error) {
    console.error('Unexpected error during cleanup:', error);
    return NextResponse.json({ 
      error: 'Unexpected error during cleanup', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}