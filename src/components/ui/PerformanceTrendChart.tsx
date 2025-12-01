'use client';

import React, { useMemo } from 'react';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';

interface PerformanceTrendChartProps {
  data: Array<{
    date: string;
    pnl: number;
    cumulative: number;
  }>;
  height?: number;
}

export default function PerformanceTrendChart({ data, height = 300 }: PerformanceTrendChartProps) {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) {
      // Generate sample data for empty state
      return Array.from({ length: 30 }, (_, i) => ({
        date: `Day ${i + 1}`,
        pnl: Math.random() * 1000 - 500,
        cumulative: (Math.random() - 0.5) * (i + 1) * 100
      }));
    }
    return data;
  }, [data]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass-enhanced p-4 rounded-xl border border-teal-500/30 shadow-2xl backdrop-blur-xl bg-black/40">
          <p className="text-white text-sm font-semibold mb-2">{label}</p>
          {payload[0] && (
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 bg-teal-400 rounded-full animate-pulse"></div>
              <p className="text-teal-300 text-sm font-medium">
                P&L: ${payload[0].value.toFixed(2)}
              </p>
            </div>
          )}
          {payload[1] && (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
              <p className="text-blue-300 text-sm font-medium">
                Cumulative: ${payload[1].value.toFixed(2)}
              </p>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="chart-container-enhanced relative">
      <ResponsiveContainer width="100%" height={height} debounce={50}>
        <AreaChart
          data={chartData}
          margin={{ top: 20, right: 20, left: 10, bottom: 5 }}
          className="stable-chart"
        >
          <defs>
            {/* Enhanced teal gradient for the area fill */}
            <linearGradient id="tealGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#9333ea" stopOpacity={0.7}/>
              <stop offset="95%" stopColor="#7c3aed" stopOpacity={0.3}/>
            </linearGradient>
            
            {/* Glow filter for the line */}
            <filter id="tealGlow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
            
            {/* Secondary gradient for hover effects */}
            <linearGradient id="hoverGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#9333ea" stopOpacity={0.9}/>
              <stop offset="100%" stopColor="#7c3aed" stopOpacity={0.4}/>
            </linearGradient>
          </defs>
          
          {/* More transparent grid lines */}
          <CartesianGrid
            strokeDasharray="3 6"
            stroke="rgba(255, 255, 255, 0.03)"
            vertical={true}
            horizontal={true}
          />
          
          <XAxis
            dataKey="date"
            stroke="rgba(255, 255, 255, 0.3)"
            fontSize={11}
            tick={{ fill: 'rgba(255, 255, 255, 0.5)' }}
            tickLine={false}
            axisLine={{ stroke: 'rgba(255, 255, 255, 0.1)' }}
          />
          
          <YAxis
            stroke="rgba(255, 255, 255, 0.3)"
            fontSize={11}
            tick={{ fill: 'rgba(255, 255, 255, 0.5)' }}
            tickLine={false}
            axisLine={{ stroke: 'rgba(255, 255, 255, 0.1)' }}
            domain={['dataMin - 100', 'dataMax + 100']}
          />
          
          <Tooltip
            content={<CustomTooltip />}
            cursor={{
              stroke: 'rgba(147, 51, 234, 0.4)',
              strokeWidth: 2,
              strokeDasharray: '5 5'
            }}
          />
          
          {/* Enhanced smooth area with spline interpolation */}
          <Area
            type="monotone"
            dataKey="cumulative"
            stroke="#9333ea"
            strokeWidth={5}
            fill="url(#tealGradient)"
            animationDuration={300} // SYNCHRONIZED - matches sidebar transition and other charts
            animationEasing="ease-out"
            dot={false}
            activeDot={{
              r: 6,
              fill: '#9333ea',
              stroke: '#fff',
              strokeWidth: 2,
              filter: "url(#tealGlow)"
            }}
            // Apply glow effect to the line
            style={{ filter: "url(#tealGlow)" }}
            onAnimationStart={() => {
              console.log('🔍 [FIXED] PerformanceTrendChart animation started:', {
                duration: 300,
                timestamp: new Date().toISOString(),
                timeMs: Date.now(),
                chartType: 'PerformanceTrendChart',
                debounceValue: 50, // STANDARDIZED
                animationType: 'SYNCHRONIZED_300MS',
                timingMatch: 'RESOLVED - All charts now use consistent timing'
              });
            }}
            onAnimationEnd={() => {
              console.log('🔍 [FIXED] PerformanceTrendChart animation ended:', {
                duration: 300,
                timestamp: new Date().toISOString(),
                timeMs: Date.now(),
                chartType: 'PerformanceTrendChart',
                actualDuration: 300,
                timingMatch: 'RESOLVED - Synchronized with sidebar and other charts'
              });
            }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}