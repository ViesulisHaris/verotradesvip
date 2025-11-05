import { supabase } from '../../../supabase/client';
import { formatCurrency } from '@/lib/utils';

export default async function DashboardPage() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return <div className="p-6 text-white">Please log in</div>;

  // Get stats
  const { data: trades } = await supabase
    .from('trades')
    .select('*')
    .eq('user_id', user.id);

  const safeTrades = trades || [];
  const totalPnL = safeTrades.reduce((s, t) => s + (t.pnl || 0), 0);
  const wins = safeTrades.filter(t => (t.pnl || 0) > 0).length;
  const total = safeTrades.length;
  const winrate = total ? ((wins / total) * 100).toFixed(1) : '0';

  const grossProfit = safeTrades.reduce((s, t) => s + Math.max(0, t.pnl || 0), 0);
  const grossLoss = safeTrades.reduce((s, t) => s + Math.min(0, t.pnl || 0), 0);
  const profitFactor = grossLoss === 0 ? (grossProfit > 0 ? '∞' : '0') : (grossProfit / Math.abs(grossLoss)).toFixed(2);

  const emotions = safeTrades.reduce((acc, t) => {
    const e = t.emotional_state || 'Neutral';
    acc[e] = (acc[e] || 0) + 1;
    return acc;
  }, {});

  const totalEmotions = Object.values(emotions).reduce((a, b) => a + b, 0) || 1;
  const emotionData = Object.entries(emotions).map(([label, value]) => ({
    subject: label,
    value: (value / totalEmotions) * 10,
    fullMark: 10,
    percent: ((value / totalEmotions) * 100).toFixed(1) + '%',
  }));

  return (
    <div className="space-y-8 p-6">
      <h2 className="text-3xl font-bold text-white">Dashboard</h2>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass p-6 rounded-xl">
          <h3 className="text-sm font-medium text-white/70 mb-2">Total PnL</h3>
          <p className={`text-2xl font-bold ${totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {formatCurrency(totalPnL)}
          </p>
        </div>
        <div className="glass p-6 rounded-xl">
          <h3 className="text-sm font-medium text-white/70 mb-2">Winrate</h3>
          <p className="text-2xl font-bold text-white">{winrate}%</p>
        </div>
        <div className="glass p-6 rounded-xl">
          <h3 className="text-sm font-medium text-white/70 mb-2">Profit Factor</h3>
          <p className="text-2xl font-bold text-white">{profitFactor}</p>
        </div>
        <div className="glass p-6 rounded-xl">
          <h3 className="text-sm font-medium text-white/70 mb-2">Total Trades</h3>
          <p className="text-2xl font-bold text-white">{total}</p>
        </div>
      </div>

      {/* Emotion Radar */}
      <div className="glass p-6 rounded-xl">
        <h3 className="text-lg font-semibold mb-4 text-white">Emotional Patterns</h3>
        <div className="h-80 bg-black/20 rounded-lg p-4">
          {emotionData.length > 0 ? (
            <div className="text-center text-white/70">
              <div className="space-y-1">
                {emotionData.map((item) => (
                  <div key={item.subject} className="flex justify-between text-sm">
                    <span>{item.subject}:</span>
                    <span>{item.percent}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs mt-2 opacity-60">Log trades to see radar chart</p>
            </div>
          ) : (
            <div className="text-center text-white/70 py-8">
              <p className="text-lg">No trades yet</p>
              <p className="text-sm opacity-60 mt-2">Log your first trade to see emotional patterns</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
