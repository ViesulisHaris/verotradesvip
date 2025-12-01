'use client';

import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface MarketDistributionChartProps {
  data: Array<{
    market: string;
    count: number;
    percentage: number;
  }>;
  height?: number;
}

const MARKET_COLORS = {
  'Stock': 'rgba(30, 58, 138, 0.8)',        // Dark blue with transparency
  'Crypto': 'rgba(147, 51, 234, 0.8)',      // Purple with transparency
  'Forex': 'rgba(245, 158, 11, 0.8)',       // Amber with transparency
  'Futures': 'rgba(239, 68, 68, 0.8)',      // Red with transparency
  'Options': 'rgba(139, 92, 246, 0.8)',     // Purple with transparency
  'Other': 'rgba(107, 114, 128, 0.8)'       // Gray with transparency
};

const DEFAULT_COLORS = [
  'rgba(30, 58, 138, 0.8)',
  'rgba(147, 51, 234, 0.8)',
  'rgba(245, 158, 11, 0.8)',
  'rgba(239, 68, 68, 0.8)',
  'rgba(139, 92, 246, 0.8)',
  'rgba(107, 114, 128, 0.8)'
];

export default function MarketDistributionChart({ data, height = 300 }: MarketDistributionChartProps) {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) {
      // Generate sample data for empty state
      return [
        { market: 'Stock', count: 45, percentage: 45 },
        { market: 'Crypto', count: 30, percentage: 30 },
        { market: 'Forex', count: 15, percentage: 15 },
        { market: 'Futures', count: 10, percentage: 10 }
      ];
    }
    return data;
  }, [data]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="glass-enhanced p-4 rounded-xl border border-blue-500/20 shadow-2xl">
          <p className="text-white text-sm font-semibold mb-2">{data.market}</p>
          <div className="space-y-1">
            <p className="text-blue-300 text-sm">
              Count: <span className="font-medium">{data.count}</span>
            </p>
            <p className="text-green-300 text-sm">
              Percentage: <span className="font-medium">{data.percentage}%</span>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  const renderCustomizedLabel = (props: any) => {
    const { cx, cy, midAngle, innerRadius, outerRadius, percent, index } = props;
    const RADIAN = Math.PI / 180;
    
    // Calculate position for label - place it closer to center for better positioning
    const radius = innerRadius + (outerRadius - innerRadius) * 0.65;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    
    const percentage = (percent * 100).toFixed(0);
    
    // Don't show label for very small slices
    if (parseInt(percentage) < 3) return null;

    return (
      <g>
        {/* Background box for better visibility */}
        <rect
          x={x - 20}
          y={y - 10}
          width="40"
          height="20"
          rx="4"
          fill="rgba(0, 0, 0, 0.7)"
          stroke="rgba(255, 255, 255, 0.2)"
          strokeWidth="1"
        />
        <text
          x={x}
          y={y}
          fill="white"
          textAnchor="middle"
          dominantBaseline="middle"
          className="text-xs font-semibold"
          style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}
        >
          {`${percentage}%`}
        </text>
      </g>
    );
  };

  return (
    <div className="chart-container-enhanced relative">
      <div className="relative flex flex-col h-full">
        <div className="flex-1">
          <ResponsiveContainer width="100%" height={height}>
            <PieChart>
              <defs>
                {/* Teal glow filter matching the performance trend chart */}
                <filter id="tealGlow">
                  <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
                
                {/* Additional glow filters for different market colors */}
                <filter id="blueGlow">
                  <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
                
                <filter id="greenGlow">
                  <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
                
                <filter id="amberGlow">
                  <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
                
                <filter id="redGlow">
                  <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
                
                <filter id="purpleGlow">
                  <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
                
                <filter id="grayGlow">
                  <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderCustomizedLabel}
                outerRadius={height / 2.5}
                innerRadius={height / 5}
                fill="#8884d8"
                dataKey="count"
                animationBegin={0}
                animationDuration={1200}
                animationEasing="ease-out"
                startAngle={90}
                endAngle={-270}
              >
                {chartData.map((entry, index) => {
                  const marketColor = MARKET_COLORS[entry.market as keyof typeof MARKET_COLORS] || DEFAULT_COLORS[index % DEFAULT_COLORS.length];
                  let glowFilter = 'url(#tealGlow)'; // Default teal glow to match performance chart
                  
                  // Assign specific glow filters based on market type
                  switch (entry.market) {
                    case 'Stock':
                      glowFilter = 'url(#blueGlow)';
                      break;
                    case 'Crypto':
                      glowFilter = 'url(#greenGlow)';
                      break;
                    case 'Forex':
                      glowFilter = 'url(#amberGlow)';
                      break;
                    case 'Futures':
                      glowFilter = 'url(#redGlow)';
                      break;
                    case 'Options':
                      glowFilter = 'url(#purpleGlow)';
                      break;
                    case 'Other':
                      glowFilter = 'url(#grayGlow)';
                      break;
                    default:
                      glowFilter = 'url(#tealGlow)'; // Default teal to match performance chart
                  }
                  
                  return (
                    <Cell
                      key={`cell-${index}`}
                      fill={marketColor}
                      stroke="rgba(255, 255, 255, 0.2)"
                      strokeWidth={2}
                      className="hover:opacity-90 transition-all duration-300 cursor-pointer hover:scale-105"
                      style={{
                        filter: glowFilter,
                        mixBlendMode: 'normal'
                      }}
                    />
                  );
                })}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        
        {/* Enhanced Custom Legend */}
        <div className="mt-6 px-4 pb-2">
          <div className="flex flex-wrap justify-center gap-4">
            {chartData.map((entry, index) => (
              <div
                key={entry.market}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/20 backdrop-blur-sm border border-white/10 hover:bg-black/30 transition-all duration-200 hover:scale-105"
              >
                <div
                  className="w-4 h-4 rounded-full shadow-sm"
                  style={{
                    backgroundColor: MARKET_COLORS[entry.market as keyof typeof MARKET_COLORS] || DEFAULT_COLORS[index % DEFAULT_COLORS.length],
                    boxShadow: '0 0 8px rgba(147, 51, 234, 0.5), 0 2px 4px rgba(0, 0, 0, 0.2)'
                  }}
                />
                <div className="flex flex-col">
                  <span className="text-xs text-white font-medium">
                    {entry.market}
                  </span>
                  <span className="text-xs text-white/60">
                    {entry.count} ({entry.percentage}%)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}