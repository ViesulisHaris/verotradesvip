'use client';

import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, AreaChart, Area } from 'recharts';
import { TrendingUp, TrendingDown, BarChart3 } from 'lucide-react';

interface TradeData {
  date: string;
  pnl: number;
  cumulative: number;
}

interface Props {
  data: TradeData[];
  title?: string;
  height?: number;
}

export default function StrategyPerformanceChart({ data, title = "Strategy Performance", height = 300 }: Props) {
  if (!data || data.length === 0) {
    return (
      <div className="chart-container" style={{ background: 'transparent' }}>
        <div className="chart-wrapper">
          <div className="chart-header">
            <h3 className="chart-title">{title}</h3>
          </div>
          <div className="h-64 sm:h-80 lg:h-96 flex items-center justify-center text-white/70">
            <div className="text-center px-4">
              <BarChart3 className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No performance data available</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const totalPnL = data.reduce((sum, trade) => sum + trade.pnl, 0);
  const isPositive = totalPnL >= 0;

  return (
    <div className="chart-container" style={{ background: 'transparent' }}>
      <div className="chart-wrapper">
        <div className="chart-header">
          {isPositive ? (
            <TrendingUp className="w-4 h-4 lg:w-5 lg:h-5 text-green-400" />
          ) : (
            <TrendingDown className="w-4 h-4 lg:w-5 lg:h-5 text-red-400" />
          )}
          <h3 className="chart-title">{title}</h3>
        </div>
        
        <div className="h-64 sm:h-80 lg:h-96">
          <ResponsiveContainer width="100%" height="100%" debounce={0}>
            <AreaChart
              data={data}
              margin={{
                top: 5,
                right: 10,
                left: 10,
                bottom: 5
              }}
            >
              <defs>
                <linearGradient id="colorPnL" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={isPositive ? "#9333ea" : "#ef4444"} stopOpacity={0.8}/>
                  <stop offset="95%" stopColor={isPositive ? "#9333ea" : "#ef4444"} stopOpacity={0.1}/>
                </linearGradient>
                <linearGradient id="colorCumulative" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1e3a8a" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#1e3a8a" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.1)"
                className="hidden sm:block"
              />
              <XAxis
                dataKey="date"
                tick={{
                  fill: 'white',
                  fontSize: 12
                }}
                stroke="rgba(255,255,255,0.3)"
                angle={-45}
                textAnchor="end"
                height={60}
                className="hidden xs:block"
              />
              <YAxis
                tick={{
                  fill: 'white',
                  fontSize: 12
                }}
                stroke="rgba(255,255,255,0.3)"
                width={60}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(0,0,0,0.8)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '8px',
                  fontSize: '12px'
                }}
                labelStyle={{ color: 'white' }}
                formatter={(value: any) => [
                  typeof value === 'number' ? `$${value.toFixed(2)}` : value,
                  ''
                ]}
              />
              <Legend
                wrapperStyle={{
                  color: 'white',
                  fontSize: '12px'
                }}
                iconSize={12}
              />
              <Area
                type="monotone"
                dataKey="pnl"
                stroke={isPositive ? "#9333ea" : "#ef4444"}
                fillOpacity={1}
                fill="url(#colorPnL)"
                strokeWidth={2}
                name="Trade P&L"
              />
              <Area
                type="monotone"
                dataKey="cumulative"
                stroke="#1e3a8a"
                fillOpacity={1}
                fill="url(#colorCumulative)"
                strokeWidth={2}
                name="Cumulative P&L"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}