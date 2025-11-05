import DashboardCard from '@/components/DashboardCard';
import EmotionRadar from '@/components/EmotionRadar';
import { supabase } from '../../../supabase/client';
import { formatCurrency } from '@/lib/utils';

interface Trade {
  pnl: number | null;
  emotional_state: string | null;
  user_id: string;
}

async function getStats(userId: string) {
  const { data: trades } = await supabase
    .from('trades')
    .select('*')
    .eq('user_id', userId);

  const safeTrades: Trade[] = (trades ?? []) as Trade[];

  const totalPnL = safeTrades.reduce((s, t) => s + (t.pnl ?? 0), 0);
  const wins = safeTrades.filter((t) => (t.pnl ?? 0) > 0).length;
  const total = safeTrades.length;
  const winrate = total ? ((wins / total) * 100).toFixed(1) : '0';

  const grossProfit = safeTrades.reduce((s, t) => s + Math.max(0, t.pnl ?? 0), 0);
  const grossLoss = safeTrades.reduce((s, t) => s + Math.min(0, t.pnl ?? 0), 0);
  const profitFactor = grossLoss === 0 ? (grossProfit > 0 ? 'Infinite' : '0') : (grossProfit / Math.abs(grossLoss)).toFixed(2);

  const emotions = safeTrades.reduce<Record<string, number>>((acc, t) => {
    const e = t.emotional_state ?? 'Neutral';
    acc[e] = (acc[e] ?? 0) + 1;
    return acc;
  }, {});

  const totalEmotions = Object.values(emotions).reduce((a: number, b: number) => a + b, 0) || 1;

  const { count: totalTrades } = await supabase
    .from('trades')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  return { totalPnL, winrate, profitFactor, emotions, totalEmotions, totalTrades: totalTrades ?? 0 };
}

export default async function DashboardPage() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { totalPnL, winrate, profitFactor, emotions, totalEmotions, totalTrades } = await getStats(user.id);

  const emotionData = Object.entries(emotions).map(([label, value]) => ({
    subject: label,
    value: (value / totalEmotions) * 10,
    fullMark: 10,
    percent: ((value / totalEmotions) * 100).toFixed(1) + '%',
  }));

  return (
    <div className="space-y-8 p-6">
      <h2 className="text-3xl font-bold text-white">Dashboard</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <DashboardCard title="Total PnL" value={formatCurrency(totalPnL)} />
        <DashboardCard title="Winrate" value={`${winrate}%`} />
        <DashboardCard title="Profit Factor" value={profitFactor} />
        <DashboardCard title="Total Trades" value={totalTrades.toString()} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass p-6">
          <h3 className="text-lg font-semibold mb-4 text-white">Emotional Patterns</h3>
          <EmotionRadar data={emotionData} />
        </div>
      </div>
    </div>
  );
}
