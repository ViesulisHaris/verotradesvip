'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../supabase/client';
import { useRouter } from 'next/navigation';

interface FormState {
  market: { stock: boolean; crypto: boolean; forex: boolean; futures: boolean };
  symbol: string;
  strategy_id: string;
  date: string;
  side: string;
  quantity: string;
  stop_loss: string;
  take_profit: string;
  pnl: string;
  entry_time: string;
  exit_time: string;
  emotional_state: string;
}

interface Props {
  onSuccess?: () => void;
}

export default function TradeForm({ onSuccess }: Props) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>({
    market: { stock: false, crypto: false, forex: false, futures: false },
    symbol: '',
    strategy_id: '',
    date: new Date().toISOString().split('T')[0],
    side: 'Buy',
    quantity: '',
    stop_loss: '',
    take_profit: '',
    pnl: '',
    entry_time: '',
    exit_time: '',
    emotional_state: 'Neutral',
  });
  const [strategies, setStrategies] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from('strategies').select('id, name').eq('user_id', user.id);
        setStrategies(data ?? []);
      }
    };
    load();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const market = Object.keys(form.market).filter(k => form.market[k as keyof typeof form.market]).join(', ') || null;

    const { error } = await supabase.from('trades').insert({
      user_id: user.id,
      market,
      symbol: form.symbol,
      strategy_id: form.strategy_id || null,
      trade_date: form.date,
      side: form.side,
      quantity: parseFloat(form.quantity) || null,
      stop_loss: form.stop_loss ? parseFloat(form.stop_loss) : null,
      take_profit: form.take_profit ? parseFloat(form.take_profit) : null,
      pnl: form.pnl ? parseFloat(form.pnl) : null,
      entry_time: form.entry_time || null,
      exit_time: form.exit_time || null,
      emotional_state: form.emotional_state,
    });

    if (error) alert(error.message);
    else onSuccess?.() || router.push('/dashboard');
  };

  return (
    <form onSubmit={handleSubmit} className="glass space-y-form-group p-card-inner">
      <div>
        <label className="block text-sm font-medium mb-input-label text-white">Market</label>
        <div className="flex gap-button-group flex-wrap">
          {(['stock', 'crypto', 'forex', 'futures'] as const).map(m => (
            <label key={m} className="flex items-center gap-element p-element rounded-lg bg-white/5">
              <input type="checkbox" checked={form.market[m]} onChange={(e) => setForm({ ...form, market: { ...form.market, [m]: e.target.checked } })} className="accent-primary" />
              <span className="text-white capitalize">{m}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-component">
        {[
          { label: 'Symbol', key: 'symbol', type: 'text', required: true },
          { label: 'Strategy', key: 'strategy_id', type: 'select', options: ['None', ...strategies.map(s => s.name)] },
          { label: 'Date', key: 'date', type: 'date', required: true },
          { label: 'Side', key: 'side', type: 'select', options: ['Buy', 'Sell'] },
          { label: 'Quantity', key: 'quantity', type: 'number', required: true },
          { label: 'Stop Loss', key: 'stop_loss', type: 'number' },
          { label: 'Take Profit', key: 'take_profit', type: 'number' },
          { label: 'PnL', key: 'pnl', type: 'number' },
          { label: 'Entry Time', key: 'entry_time', type: 'time' },
          { label: 'Exit Time', key: 'exit_time', type: 'time' },
          { label: 'Emotional State', key: 'emotional_state', type: 'select', options: ['Neutral', 'Greed', 'Fear', 'Confidence', 'Frustration'] },
        ].map(({ label, key, type, options, required }) => (
          <div key={key}>
            <label className="block text-sm font-medium mb-input-label text-white">{label}</label>
            {type === 'select' ? (
              <select value={form[key as keyof FormState] as string} onChange={(e) => setForm({ ...form, [key]: e.target.value })} required={required} className="metallic-input w-full">
                {options!.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            ) : (
              <input type={type} value={form[key as keyof FormState] as string} onChange={(e) => setForm({ ...form, [key]: e.target.value })} required={required} className="metallic-input w-full" />
            )}
          </div>
        ))}
      </div>

      <button type="submit" className="w-full py-3 bg-white/20 text-white rounded-xl hover:bg-white/30">
        Save Trade
      </button>
    </form>
  );
}
