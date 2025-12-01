import { createServerClient, getServerUser } from '@/lib/auth-server';

// Helper function to format emotions as boxes
const formatEmotionsAsBoxes = (emotionalState: string[] | null | string) => {
  if (!emotionalState) {
    return <span className="text-gray-400">None</span>;
  }

  let emotions: string[] = [];
  
  if (Array.isArray(emotionalState)) {
    emotions = emotionalState
      .filter((e: any) => typeof e === 'string' && e.trim())
      .map((e: any) => e.trim().toUpperCase());
  } else if (typeof emotionalState === 'string') {
    const trimmed = emotionalState.trim();
    if (trimmed) {
      // Quick check if it's JSON format
      if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
        try {
          const parsed = JSON.parse(trimmed);
          if (Array.isArray(parsed)) {
            emotions = parsed.map((e: any) => typeof e === 'string' ? e.trim().toUpperCase() : e);
          } else if (typeof parsed === 'string') {
            emotions = [parsed.trim().toUpperCase()];
          }
        } catch {
          emotions = [trimmed.toUpperCase()];
        }
      } else {
        emotions = [trimmed.toUpperCase()];
      }
    }
  }
  
  const emotionColors: Record<string, { bg: string; text: string; border: string }> = {
    'FOMO': { bg: 'bg-orange-500/20', text: 'text-orange-400', border: 'border-orange-500/50' },
    'REVENGE': { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/50' },
    'TILT': { bg: 'bg-purple-500/20', text: 'text-purple-400', border: 'border-purple-500/50' },
    'OVERRISK': { bg: 'emotion-box-bg', text: 'emotion-box-text', border: 'border-yellow-500/50' },
    'PATIENCE': { bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500/50' },
    'REGRET': { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/50' },
    'DISCIPLINE': { bg: 'bg-teal-500/20', text: 'text-teal-400', border: 'border-teal-500/50' },
    'CONFIDENT': { bg: 'bg-indigo-500/20', text: 'text-indigo-400', border: 'border-indigo-500/50' },
    'ANXIOUS': { bg: 'bg-pink-500/20', text: 'text-pink-400', border: 'border-pink-500/50' },
    'NEUTRAL': { bg: 'bg-gray-500/20', text: 'text-gray-400', border: 'border-gray-500/50' }
  };
  
  return (
    <div className="flex flex-wrap gap-1">
      {emotions.map((emotion, index) => {
        const emotionColor = emotionColors[emotion] || emotionColors['NEUTRAL'];
        return (
          <div
            key={index}
            className={`px-2 py-1 rounded-md ${emotionColor.bg} ${emotionColor.text} text-xs border ${emotionColor.border}`}
          >
            {emotion}
          </div>
        );
      })}
    </div>
  );
};

export default async function TestTradesAuthPage() {
  console.log('=== TestTradesAuthPage: Starting ===');
  
  const supabase = createServerClient();
  console.log('=== TestTradesAuthPage: Created server client ===');
  
  const user = await getServerUser();
  console.log('=== TestTradesAuthPage: Got user:', user ? 'USER_FOUND' : 'USER_NULL', '===', user?.id);
  
  let tradesData: any[] = [];

  try {
    if (user) {
      console.log('=== TestTradesAuthPage: User exists, fetching trades ===');
      // Get trades with strategy information
      const { data: fetchedTrades } = await supabase
        .from('trades')
        .select(`
          *,
          strategies (
            id,
            name,
            rules
          )
        `)
        .eq('user_id', user.id)
        .order('trade_date', { ascending: false });
      
      tradesData = fetchedTrades || [];
      console.log('=== TestTradesAuthPage: Fetched', tradesData.length, 'trades ===');
    } else {
      console.log('=== TestTradesAuthPage: No user found ===');
    }
  } catch (error) {
    console.error('=== TestTradesAuthPage: Error in trades fetch ===', error);
  }

  console.log('=== TestTradesAuthPage: User check before render ===', user ? 'AUTHENTICATED' : 'NOT_AUTHENTICATED');

  if (!user) {
    console.log('=== TestTradesAuthPage: Rendering Authentication Required ===');
    return (
      <div className="p-6 text-white">
        <div className="glass p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Authentication Required</h2>
          <p className="text-white/70">Please log in to view your trades</p>
        </div>
      </div>
    );
  }

  console.log('=== TestTradesAuthPage: Rendering trades page ===');
  const safeTrades = Array.isArray(tradesData) ? tradesData : [];

  return (
    <div className="space-y-8 p-6">
      <h2 className="text-3xl font-bold text-white">Trade Log (Test Version)</h2>
      
      <div className="glass p-4">
        <h3 className="text-lg font-semibold mb-2">Debug Info:</h3>
        <p>User ID: {user.id}</p>
        <p>User Email: {user.email}</p>
        <p>Trades Count: {safeTrades.length}</p>
      </div>

      {safeTrades.length === 0 ? (
        <div className="glass p-8 text-center text-white/80">
          <p className="text-lg">No trades yet</p>
          <p className="text-sm opacity-60 mt-2">Log your first trade to see it here</p>
        </div>
      ) : (
        <div className="glass rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5">
                <tr className="text-left text-white/70 text-sm">
                  <th className="px-6 py-4 font-medium">Date</th>
                  <th className="px-6 py-4 font-medium">Symbol</th>
                  <th className="px-6 py-4 font-medium">Side</th>
                  <th className="px-6 py-4 font-medium">Quantity</th>
                  <th className="px-6 py-4 font-medium">Strategy</th>
                  <th className="px-6 py-4 font-medium">PnL</th>
                  <th className="px-6 py-4 font-medium">Emotion</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {safeTrades.map((trade: any) => (
                  <tr key={trade.id} className="text-white">
                    <td className="px-6 py-4">
                      {new Date(trade.trade_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 font-medium">{trade.symbol}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        trade.side === 'Buy' 
                          ? 'bg-green-500/20 text-green-400' 
                          : 'bg-red-500/20 text-red-400'
                      }`}>
                        {trade.side}
                      </span>
                    </td>
                    <td className="px-6 py-4">{trade.quantity}</td>
                    <td className="px-6 py-4">
                      {trade.strategies ? (
                        <div>
                          <div className="font-medium">{trade.strategies.name}</div>
                        </div>
                      ) : (
                        <span className="text-white/50">No strategy</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`font-medium ${
                        (trade.pnl || 0) >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        ${trade.pnl || 0}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {formatEmotionsAsBoxes(trade.emotional_state)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}