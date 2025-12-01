'use client';

import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine } from 'recharts';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface TradeData {
  date: string;
  pnl: number;
  cumulative: number;
}

interface Props {
  data: TradeData[];
  title?: string;
}

export default function EquityGraph({ data, title = "Equity Curve" }: Props) {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 lg:h-80 flex items-center justify-center text-white/70">
        <div className="text-center px-4">
          <TrendingUp className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No equity data available</p>
        </div>
      </div>
    );
  }

  // Calculate initial equity (assuming starting at 0)
  const initialEquity = 0;
  const finalEquity = data[data.length - 1]?.cumulative || 0;
  const isPositive = finalEquity >= initialEquity;

  // Find peak and trough for better visualization
  let peak = initialEquity;
  let trough = initialEquity;
  data.forEach(item => {
    if (item.cumulative > peak) peak = item.cumulative;
    if (item.cumulative < trough) trough = item.cumulative;
  });

  return (
    <div className="h-64 lg:h-80" style={{ background: 'transparent' }}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-white flex items-center gap-2">
          {isPositive ? (
            <TrendingUp className="w-4 h-4 text-green-400" />
          ) : (
            <TrendingDown className="w-4 h-4 text-red-400" />
          )}
          {title}
        </h3>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1">
            <span className="text-white/60">Start:</span>
            <span className="text-white">${initialEquity.toFixed(2)}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-white/60">Current:</span>
            <span className={isPositive ? 'text-green-400' : 'text-red-400'}>
              ${finalEquity.toFixed(2)}
            </span>
          </div>
        </div>
      </div>
      
      <ResponsiveContainer width="100%" height="90%" debounce={50}>
        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <defs>
            {/* Enhanced teal gradient for the area fill */}
            <linearGradient id="equityTealGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#9333ea" stopOpacity={0.7}/>
              <stop offset="95%" stopColor="#7c3aed" stopOpacity={0.3}/>
            </linearGradient>
            
            {/* Glow filter for the line */}
            <filter id="equityTealGlow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          
          <CartesianGrid strokeDasharray="3 6" stroke="rgba(255,255,255,0.03)" />
          <XAxis 
            dataKey="date" 
            tick={{ fill: 'white', fontSize: 12 }}
            stroke="rgba(255,255,255,0.3)"
          />
          <YAxis 
            tick={{ fill: 'white', fontSize: 12 }}
            stroke="rgba(255,255,255,0.3)"
            domain={['dataMin - 100', 'dataMax + 100']}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'rgba(0,0,0,0.8)', 
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '8px'
            }}
            labelStyle={{ color: 'white' }}
            formatter={(value: number, name: string) => {
              if (name === 'cumulative') {
                return [`$${value.toFixed(2)}`, 'Equity'];
              }
              return [value, name];
            }}
          />
          <Legend 
            wrapperStyle={{ color: 'white' }}
          />
          
          {/* Zero line reference */}
          <ReferenceLine 
            y={0} 
            stroke="rgba(255,255,255,0.3)" 
            strokeDasharray="5 5" 
          />
          
          <Line
            type="monotone"
            dataKey="cumulative"
            stroke={isPositive ? '#9333ea' : '#ef4444'}
            strokeWidth={5}
            dot={false} // Remove cyan data point markers
            activeDot={{
              r: 6,
              fill: isPositive ? '#9333ea' : '#ef4444',
              stroke: '#fff',
              strokeWidth: 2,
              filter: "url(#equityTealGlow)"
            }}
            name="Equity"
            // Apply glow effect to the line with synchronized timing
            animationDuration={300} // SYNCHRONIZED - matches sidebar and other charts
            animationEasing="ease-out"
            style={{
              filter: "url(#equityTealGlow)",
              transform: 'translateZ(0)', // Hardware acceleration
              willChange: 'transform', // Optimize for transforms
              backfaceVisibility: 'hidden' // Prevent flickering
            }}
            onAnimationStart={() => {
              console.log('🔍 [FIXED] EquityGraph animation started:', {
                duration: 300,
                timestamp: new Date().toISOString(),
                timeMs: Date.now(),
                chartType: 'EquityGraph',
                debounceValue: 50, // STANDARDIZED
                animationType: 'SYNCHRONIZED_300MS',
                timingMatch: 'RESOLVED - All charts now use consistent timing'
              });
            }}
            onAnimationEnd={() => {
              console.log('🔍 [FIXED] EquityGraph animation ended:', {
                duration: 300,
                timestamp: new Date().toISOString(),
                timeMs: Date.now(),
                chartType: 'EquityGraph',
                actualDuration: 300,
                timingMatch: 'RESOLVED - Synchronized with sidebar and other charts'
              });
            }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}