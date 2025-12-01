'use client';

import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { TrendingUp } from 'lucide-react';

interface TradeData {
  date: string;
  pnl: number;
  cumulative: number;
}

interface Props {
  data: TradeData[];
}

export default function PerformanceChart({ data }: Props) {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 lg:h-80 flex items-center justify-center text-white/70">
        <div className="text-center px-4">
          <TrendingUp className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No trading data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-64 lg:h-80" style={{ background: 'transparent' }}>
      <ResponsiveContainer width="100%" height="100%" debounce={0}>
        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <defs>
            {/* Enhanced teal gradient for the area fill */}
            <linearGradient id="performanceTealGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#9333ea" stopOpacity={0.7}/>
              <stop offset="95%" stopColor="#7c3aed" stopOpacity={0.3}/>
            </linearGradient>
            
            {/* Glow filter for the line */}
            <filter id="performanceTealGlow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feColorMatrix in="coloredBlur" type="matrix" values="0 0 0 0 0.58
                                                                0 0 0 0 0.21
                                                                0 0 0 0 0.93
                                                                0 0 0 0.8 0"/>
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
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'rgba(0,0,0,0.8)', 
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '8px'
            }}
            labelStyle={{ color: 'white' }}
            itemStyle={{ color: '#9333ea' }}
          />
          <Legend 
            wrapperStyle={{ color: 'white' }}
          />
          <Line
            type="monotone"
            dataKey="cumulative"
            stroke="#9333ea"
            strokeWidth={5}
            dot={false} // Remove cyan data point markers
            activeDot={{
              r: 6,
              fill: '#9333ea',
              stroke: '#fff',
              strokeWidth: 2,
              filter: "url(#performanceTealGlow)"
            }}
            name="Cumulative P&L"
            // Apply glow effect to the line
            style={{ filter: "url(#performanceTealGlow)" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}