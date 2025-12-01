'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/supabase/client';
import { formatCurrency } from '@/lib/utils';
import { Trash2, TrendingUp, Target, Star, Activity } from 'lucide-react';

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
    if (confirm('Delete this strategy? This action cannot be undone.')) {
      const { error } = await supabase.from('strategies').delete().eq('id', strategy.id);
      if (!error) onDelete?.();
    }
  };

  // Determine win rate color based on mockup specifications
  const getWinRateColor = (winrate: string) => {
    const rate = parseFloat(winrate);
    if (rate >= 70) return 'text-dusty-gold'; // High win rate
    if (rate >= 50) return 'text-muted-olive'; // Medium win rate
    return 'text-rust-red'; // Low win rate
  };

  // Determine P&L color
  const getPnLColor = (pnl: number) => {
    return pnl >= 0 ? 'text-dusty-gold' : 'text-rust-red';
  };

  return (
    <div className="dashboard-card relative group">
      {/* Delete Button */}
      <button
        onClick={handleDelete}
        className="absolute top-4 right-4 p-2 rounded-full hover:bg-rust-red/10 text-rust-red/60 hover:text-rust-red transition-all duration-200 opacity-0 group-hover:opacity-100 z-10"
        aria-label="Delete strategy"
      >
        <Trash2 className="w-4 h-4" />
      </button>
      
      {/* Strategy Name */}
      <div className="mb-component">
        <h3 className="h2-card-title mb-element">{strategy.name}</h3>
        <div className="flex items-center gap-element">
          <div className={`w-2 h-2 rounded-full ${stats.trades > 0 ? 'bg-dusty-gold' : 'bg-muted-gray'}`}></div>
          <span className="secondary-text">
            {stats.trades > 0 ? `${stats.trades} trades` : 'No trades yet'}
          </span>
        </div>
      </div>
      
      {/* Performance Metrics Grid */}
      <div className="grid grid-cols-2 gap-element mb-component">
        {/* Win Rate */}
        <div className="text-center p-3 rounded-lg bg-deep-charcoal/50">
          <Target className="w-5 h-5 mx-auto mb-2 text-dusty-gold" />
          <div className="secondary-text text-xs mb-tight">Win Rate</div>
          <div className={`metric-value text-lg ${getWinRateColor(stats.winrate)}`}>
            {stats.winrate}%
          </div>
        </div>
        
        {/* Profit Factor */}
        <div className="text-center p-element rounded-lg bg-deep-charcoal/50">
          <Star className="w-5 h-5 mx-auto mb-element text-dusty-gold" />
          <div className="secondary-text text-xs mb-tight">Profit Factor</div>
          <div className="metric-value text-lg text-warm-off-white">
            {stats.profitFactor}
          </div>
        </div>
        
        {/* Total P&L */}
        <div className="text-center p-element rounded-lg bg-deep-charcoal/50">
          <TrendingUp className="w-5 h-5 mx-auto mb-element text-dusty-gold" />
          <div className="secondary-text text-xs mb-tight">Total P&L</div>
          <div className={`metric-value text-lg ${getPnLColor(stats.totalPnL)}`}>
            {formatCurrency(stats.totalPnL)}
          </div>
        </div>
        
        {/* Trade Count */}
        <div className="text-center p-element rounded-lg bg-deep-charcoal/50">
          <Activity className="w-5 h-5 mx-auto mb-element text-dusty-gold" />
          <div className="secondary-text text-xs mb-tight">Total Trades</div>
          <div className="metric-value text-lg text-warm-off-white">
            {stats.trades}
          </div>
        </div>
      </div>
      
      {/* Strategy Rules */}
      {strategy.rules && strategy.rules.length > 0 && (
        <div className="border-t border-border-primary pt-component">
          <div className="flex items-center gap-element mb-element">
            <div className="w-2 h-2 rounded-full bg-dusty-gold"></div>
            <h4 className="body-text font-medium">Strategy Rules</h4>
          </div>
          <ul className="gap-element">
            {strategy.rules.slice(0, 3).map((rule, index) => (
              <li key={index} className="flex items-start gap-element">
                <span className="w-1.5 h-1.5 rounded-full bg-muted-olive mt-element flex-shrink-0"></span>
                <span className="secondary-text text-sm leading-relaxed">{rule}</span>
              </li>
            ))}
            {strategy.rules.length > 3 && (
              <li className="secondary-text text-sm italic">
                +{strategy.rules.length - 3} more rules...
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
