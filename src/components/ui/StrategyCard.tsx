'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/supabase/client';
import { formatCurrency } from '@/lib/utils';
import { Trash2 } from 'lucide-react';
import { validateUUID } from '@/lib/uuid-validation';

interface Props {
  strategy: { id: string; name: string; rules?: string[] };
  onDelete?: () => void;
}

export default function StrategyCard({ strategy, onDelete }: Props) {
  // Validate strategy prop on component mount
  const [isValidStrategy, setIsValidStrategy] = useState(false);
  const [stats, setStats] = useState({ totalPnL: 0, winrate: '0', profitFactor: '0', trades: 0 });

  useEffect(() => {
    // Validate strategy object and ID
    if (!strategy || !strategy.id) {
      console.error('Invalid strategy object passed to StrategyCard:', strategy);
      setIsValidStrategy(false);
      return;
    }

    try {
      const validatedStrategyId = validateUUID(strategy.id, 'strategy_id');
      setIsValidStrategy(true);
      
      const fetch = async () => {
        try {
          const { data } = await supabase.from('trades').select('pnl').eq('strategy_id', validatedStrategyId);
          const pnls = (data as { pnl: number }[] || []).map(t => t.pnl ?? 0);
          const totalPnL = pnls.reduce((a, b) => a + b, 0);
          const wins = pnls.filter(p => p > 0).length;
          const winrate = pnls.length ? ((wins / pnls.length) * 100).toFixed(1) : '0';
          const grossProfit = pnls.filter(p => p > 0).reduce((a, b) => a + b, 0);
          const grossLoss = pnls.filter(p => p < 0).reduce((a, b) => a + b, 0);
          const profitFactor = grossLoss === 0 ? 'Infinite' : (grossProfit / Math.abs(grossLoss)).toFixed(2);
          setStats({ totalPnL, winrate, profitFactor, trades: pnls.length });
        } catch (error) {
          console.error('Error fetching strategy stats:', error);
          // Set default stats on error
          setStats({ totalPnL: 0, winrate: '0', profitFactor: '0', trades: 0 });
        }
      };
      fetch();
    } catch (error) {
      console.error('Invalid strategy ID in StrategyCard:', error);
      setIsValidStrategy(false);
    }
  }, [strategy.id]);

  const handleDelete = async () => {
    if (!isValidStrategy) {
      alert('Cannot delete strategy: Invalid strategy data.');
      return;
    }
    
    if (confirm('Delete?')) {
      try {
        // Validate strategy ID before delete operation
        const validatedStrategyId = validateUUID(strategy.id, 'strategy_id');
        const { error } = await supabase.from('strategies').delete().eq('id', validatedStrategyId);
        if (!error) onDelete?.();
      } catch (error) {
        console.error('Error deleting strategy:', error);
        alert('Error deleting strategy. Please try again.');
      }
    }
  };

  if (!isValidStrategy) {
    return (
      <div className="p-5 relative" style={{
        borderRadius: '12px',
        background: 'var(--soft-graphite)',
        border: '0.8px solid rgba(184, 155, 94, 0.3)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)'
      }}>
        <div className="text-center" style={{ color: 'var(--rust-red)' }}>
          <h3 className="text-lg font-bold mb-2">Invalid Strategy</h3>
          <p className="text-sm">This strategy card contains invalid data.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-5 relative" style={{
      borderRadius: '12px',
      background: 'var(--soft-graphite)',
      border: '0.8px solid rgba(184, 155, 94, 0.3)',
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)'
    }}>
      <button onClick={handleDelete} className="absolute top-2 right-2 p-1 rounded-full transition-colors duration-200 hover:bg-[rgba(167,53,45,0.2)] hover:text-[var(--rust-red)]" style={{
        background: 'transparent',
        border: 'none',
        color: 'var(--muted-gray)'
      }}>
        <Trash2 className="w-4 h-4" />
      </button>
      <h3 className="text-lg font-bold mb-2" style={{ fontSize: '18px', fontWeight: '700', color: 'var(--warm-off-white)' }}>{strategy.name}</h3>
      <div className="grid grid-cols-2 gap-2 text-sm" style={{ fontSize: '14px', color: 'var(--warm-off-white)' }}>
        <div>Winrate: {stats.winrate}%</div>
        <div>Profit Factor: {stats.profitFactor}</div>
        <div>Net PnL: {formatCurrency(stats.totalPnL)}</div>
        <div>Trades: {stats.trades}</div>
      </div>
      {strategy.rules && strategy.rules.length > 0 && (
        <div className="mt-3">
          <p className="text-xs font-medium mb-1" style={{ fontSize: '12px', fontWeight: '500', color: 'var(--warm-off-white)' }}>Rules:</p>
          <ul className="list-disc list-inside text-xs space-y-1" style={{ fontSize: '12px', color: 'var(--muted-gray)' }}>
            {strategy.rules.map((r, i) => <li key={i}>{r}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}
