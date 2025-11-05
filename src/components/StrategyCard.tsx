'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../supabase/client';
import { formatCurrency } from '@/lib/utils';
import { Trash2 } from 'lucide-react';

interface Props {
  strategy: { id: string; name: string; rules?: string[] };
  onDelete?: () => void;
}

export default function StrategyCard({ strategy, onDelete }: Props) {
  const [stats, setStats] = useState({ totalPnL: 0, winrate: '0', profitFactor: '0', trades: 0 });

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from('trades').select('pnl').eq('strategy_id', strategy.id);
      const pnls = (data as { pnl: number }[] || []).map(t => t.pnl ?? 0);
      const totalPnL = pnls.reduce((a, b) => a + b, 0);
      const wins = pnls.filter(p => p > 0).length;
      const winrate = pnls.length ? ((wins / pnls.length) * 100).toFixed(1) : '0';
      const grossProfit = pnls.filter(p => p > 0).reduce((a, b) => a + b, 0);
      const grossLoss = pnls.filter(p => p < 0).reduce((a, b) => a + b, 0);
      const profitFactor = grossLoss === 0 ? 'Infinite' : (grossProfit / Math.abs(grossLoss)).toFixed(2);
      setStats({ totalPnL, winrate, profitFactor, trades: pnls.length });
    };
    fetch();
  }, [strategy.id]);

  const handleDelete = async () => {
    if (confirm('Delete?')) {
      const { error } = await supabase.from('strategies').delete().eq('id', strategy.id);
      if (!error) onDelete?.();
    }
  };

  return (
    <div className="glass p-5 relative">
      <button onClick={handleDelete} className="absolute top-2 right-2 p-1 rounded-full hover:bg-red-500/20 text-red-400">
        <Trash2 className="w-4 h-4" />
      </button>
      <h3 className="text-lg font-bold mb-2 text-white">{strategy.name}</h3>
      <div className="grid grid-cols-2 gap-2 text-sm text-white/80">
        <div>Winrate: {stats.winrate}%</div>
        <div>Profit Factor: {stats.profitFactor}</div>
        <div>Net PnL: {formatCurrency(stats.totalPnL)}</div>
        <div>Trades: {stats.trades}</div>
      </div>
      {strategy.rules && strategy.rules.length > 0 && (
        <div className="mt-3">
          <p className="text-xs font-medium text-white/80 mb-1">Rules:</p>
          <ul className="list-disc list-inside text-xs text-white/60 space-y-1">
            {strategy.rules.map((r, i) => <li key={i}>{r}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}
