'use client';

import { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns';
import { supabase } from '../../../supabase/client';
import TradeModal from '@/components/TradeModal';
import { Calendar as CalendarIcon, Plus } from 'lucide-react';
import Link from 'next/link';

interface Trade {
  id: string;
  pnl: number | null;
  trade_date: string;
  symbol: string;
  side: string;
  quantity: number;
  market: string;
  emotional_state: string;
}

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [trades, setTrades] = useState<Trade[]>([]);
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTrades();
  }, [currentDate]);

  const fetchTrades = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('trades')
      .select('*')
      .eq('user_id', user.id)
      .gte('trade_date', format(startOfMonth(currentDate), 'yyyy-MM-dd'))
      .lte('trade_date', format(endOfMonth(currentDate), 'yyyy-MM-dd'));

    setTrades(data as Trade[] ?? []);
    setLoading(false);
  };

  const days = eachDayOfInterval({ start: startOfMonth(currentDate), end: endOfMonth(currentDate) });

  const tradesByDate = trades.reduce<Record<string, Trade[]>>((acc, t) => {
    const key = t.trade_date;
    acc[key] = acc[key] || [];
    acc[key].push(t);
    return acc;
  }, {});

  const handleDateClick = (day: Date) => {
    const dateStr = format(day, 'yyyy-MM-dd');
    const dayTrades = tradesByDate[dateStr] || [];
    if (dayTrades.length > 0) setSelectedTrade(dayTrades[0]);
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-white flex items-center gap-2">
          <CalendarIcon className="w-8 h-8" />
          {format(currentDate, 'MMMM yyyy')}
        </h2>
        <div className="flex gap-2">
          <Link href="/log-trade" className="glass p-3 rounded-xl">
            <Plus className="w-5 h-5 text-white" />
          </Link>
          <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))} className="glass p-2">&lt;</button>
          <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))} className="glass p-2">&gt;</button>
        </div>
      </div>

      {loading ? (
        <div className="glass p-8 text-center text-white">Loading...</div>
      ) : (
        <div className="glass p-6">
          <div className="grid grid-cols-7 gap-1 text-center">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
              <div key={d} className="font-semibold text-white py-2">{d}</div>
            ))}
            {days.map(day => {
              const dateStr = format(day, 'yyyy-MM-dd');
              const dayTrades = tradesByDate[dateStr] || [];
              const totalPnL = dayTrades.reduce((sum, t) => sum + (t.pnl ?? 0), 0);
              const isPositive = totalPnL > 0;
              const isNegative = totalPnL < 0;

              return (
                <button
                  key={dateStr}
                  onClick={() => handleDateClick(day)}
                  className={`
                    p-2 h-20 rounded-lg border-2 transition-all
                    ${isSameDay(day, new Date()) ? 'border-primary bg-primary/10' : ''}
                    ${isPositive ? 'border-green-400 bg-green-500/10' : ''}
                    ${isNegative ? 'border-red-400 bg-red-500/10' : 'border-white/10 bg-white/5'}
                  `}
                >
                  <div className="text-sm font-medium text-white">{format(day, 'd')}</div>
                  {dayTrades.length > 0 && (
                    <div className={`text-xs mt-1 ${isPositive ? 'text-green-400' : isNegative ? 'text-red-400' : 'text-white'}`}>
                      ${totalPnL.toFixed(2)}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {selectedTrade && <TradeModal trade={selectedTrade} onClose={() => setSelectedTrade(null)} />}
    </div>
  );
}
