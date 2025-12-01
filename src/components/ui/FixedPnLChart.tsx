'use client';

import React, { useMemo } from 'react';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { useSidebarSync } from '@/hooks/useSidebarSync';

interface PnLData {
  date: string;
  pnl: number;
  cumulative: number;
}

interface PnLChartProps {
  data: PnLData[];
  height?: number;
}

export default function FixedPnLChart({ data, height = 300 }: PnLChartProps) {
  const { isCollapsed, isTransitioning, transitionProgress } = useSidebarSync();

  // Implement intelligent data aggregation to prevent chart from going crazy with too many trades
  const aggregatedData = useMemo(() => {
    // Skip expensive data processing during transitions
    if (isTransitioning) {
      return [];
    }

    if (!data || data.length === 0) {
      // Generate sample data for empty state
      return Array.from({ length: 10 }, (_, i) => ({
        date: `Day ${i + 1}`,
        pnl: Math.random() * 1000 - 500,
        cumulative: (Math.random() - 0.5) * (i + 1) * 100
      }));
    }

    // Implement intelligent data aggregation based on data volume
    if (data.length > 30) {
      // Determine aggregation strategy based on data volume
      let aggregationStrategy: 'daily' | 'weekly' | 'monthly';
      let groupSize: number;
      
      if (data.length <= 90) {
        // For 1-3 months of data, aggregate weekly
        aggregationStrategy = 'weekly';
        groupSize = 7;
      } else if (data.length <= 365) {
        // For 3-12 months of data, aggregate bi-weekly
        aggregationStrategy = 'weekly';
        groupSize = 14;
      } else {
        // For >1 year of data, aggregate monthly
        aggregationStrategy = 'monthly';
        groupSize = 30;
      }
      
      // Group data points based on strategy
      const groupedData: Record<string, { totalPnL: number; points: PnLData[] }> = {};
      
      data.forEach((point, index) => {
        const groupIndex = Math.floor(index / groupSize);
        let groupKey: string;
        
        if (aggregationStrategy === 'weekly') {
          groupKey = `Week ${groupIndex + 1}`;
        } else if (aggregationStrategy === 'monthly') {
          groupKey = `Month ${groupIndex + 1}`;
        } else {
          groupKey = `Day ${groupIndex + 1}`;
        }
        
        if (!groupedData[groupKey]) {
          groupedData[groupKey] = { totalPnL: 0, points: [] };
        }
        
        groupedData[groupKey].totalPnL += point.pnl;
        groupedData[groupKey].points.push(point);
      });
      
      // Convert to array and calculate cumulative values
      let cumulativeSum = 0;
      const aggregated = Object.entries(groupedData).map(([groupKey, groupData]) => {
        cumulativeSum += groupData.totalPnL;
        
        // Calculate average P&L for this group
        const avgPnL = groupData.totalPnL / groupData.points.length;
        
        return {
          date: groupKey,
          pnl: avgPnL, // Use average for better representation
          cumulative: cumulativeSum
        };
      });
      
      return aggregated;
    }
    
    return data;
  }, [data, isTransitioning]);

  const finalValue = aggregatedData[aggregatedData.length - 1]?.cumulative || 0;
  const isPositive = finalValue >= 0;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="card-unified p-4 rounded-xl border border-accent shadow-2xl backdrop-blur-xl bg-black/40">
          <p className="text-primary text-sm font-semibold mb-2">{label}</p>
          {payload[0] && (
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 bg-accent rounded-full animate-pulse"></div>
              <p className="text-primary text-sm font-medium">
                P&L: ${payload[0].value.toFixed(2)}
              </p>
            </div>
          )}
          {payload[1] && (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-accent rounded-full animate-pulse"></div>
              <p className="text-primary text-sm font-medium">
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
    <div className="card-unified relative w-full min-h-[300px] h-[320px] md:h-[350px] lg:h-[400px] overflow-hidden p-4" style={{ background: 'rgba(32, 32, 32, 0.95)' }}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium title-main flex items-center gap-2">
          {isPositive ? (
            <TrendingUp className="w-4 h-4 text-success" />
          ) : (
            <TrendingDown className="w-4 h-4 text-error" />
          )}
          P&L Performance
        </h3>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1">
            <span className="text-secondary">Current:</span>
            <span className={isPositive ? 'text-success' : 'text-error'}>
              ${finalValue.toFixed(2)}
            </span>
          </div>
        </div>
      </div>
      
      <div className="relative w-full h-full">
        <ResponsiveContainer
          width="100%"
          height="100%"
          minWidth={250}
          minHeight={300}
          debounce={isTransitioning ? 500 : 100} // Higher debounce during transitions
          className="w-full h-full chart-container-stable"
          onResize={(width, height) => {
            // Skip expensive operations during transitions
            if (isTransitioning) {
              return;
            }
          }}
        >
          <AreaChart
            data={aggregatedData}
            margin={{ top: 20, right: 20, left: 10, bottom: 60 }} // Increased bottom margin for angled date labels
            className="stable-chart"
            style={{
              minHeight: '200px',
              minWidth: '300px'
            }}
          >
            <defs>
              {/* Updated vibrant gradient with slate blue colors */}
              <linearGradient id="pnlTealGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#1e3a8a" stopOpacity={0.9}/> {/* Dark blue at top */}
                <stop offset="30%" stopColor="#475569" stopOpacity={0.8}/> {/* Medium slate */}
                <stop offset="70%" stopColor="#334155" stopOpacity={0.7}/> {/* Standard slate */}
                <stop offset="100%" stopColor="#172554" stopOpacity={0.6}/> {/* Darker blue at bottom */}
              </linearGradient>
               
              {/* Animated gradient for visual depth with slate blue colors */}
              <linearGradient id="pnlAnimatedGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#1e3a8a" stopOpacity={0.3}>
                  <animate attributeName="stop-color" values="#1e3a8a;#475569;#1e3a8a" dur="4s" repeatCount="indefinite" />
                </stop>
                <stop offset="50%" stopColor="#475569" stopOpacity={0.2}>
                  <animate attributeName="stop-color" values="#475569;#172554;#475569" dur="4s" repeatCount="indefinite" />
                </stop>
                <stop offset="100%" stopColor="#172554" stopOpacity={0.3}>
                  <animate attributeName="stop-color" values="#172554;#1e3a8a;#172554" dur="4s" repeatCount="indefinite" />
                </stop>
              </linearGradient>
               
              {/* Enhanced glow filter with slate blue color matrix */}
              <filter id="pnlTealGlow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="6" result="coloredBlur"/>
                <feColorMatrix
                  in="coloredBlur"
                  type="matrix"
                  values="0 0 0 0 0.12
                          0 0 0 0 0.23
                          0 0 0 0 0.54
                          0 0 0 0.8 0"
                />
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            
            {/* Highly transparent grid lines with slate theme */}
            <CartesianGrid
              strokeDasharray="3 6"
              stroke="rgba(71, 85, 105, 0.2)"
              vertical={true}
              horizontal={true}
            />
            
            <XAxis
              dataKey="date"
              stroke="rgba(154, 154, 154, 0.5)"
              fontSize={11}
              tick={{ fill: 'var(--warm-sand)', fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: 'rgba(154, 154, 154, 0.2)' }}
              padding={{ left: 10, right: 10 }}
              height={50} // Increased height to ensure date labels are fully visible
              interval={0} // Show all tick labels
              angle={-45} // Angle labels to prevent overlap
              textAnchor="end" // Anchor text at the end for better readability
            />
            
            <YAxis
              stroke="rgba(154, 154, 154, 0.5)"
              fontSize={12}
              tick={{ fill: 'var(--warm-sand)', fontSize: 12 }}
              tickLine={false}
              axisLine={{ stroke: 'rgba(154, 154, 154, 0.2)' }}
              domain={['dataMin - 100', 'dataMax + 100']}
              width={60} // Ensure adequate width for Y-axis labels
            />
            
            <Tooltip
              content={<CustomTooltip />}
              cursor={{
                stroke: 'rgba(30, 58, 138, 0.6)',
                strokeWidth: 3,
                strokeDasharray: '8 4',
                filter: 'url(#pnlTealGlow)'
              }}
            />
            
            {/* Enhanced smooth area with spline interpolation and no cyan markers */}
            <Area
              type="monotone"
              dataKey="cumulative"
              stroke="#1e3a8a"
              strokeWidth={5}
              fill="url(#pnlTealGradient)"
              animationDuration={isTransitioning ? 0 : 300} // Disable animations during transitions
              animationEasing="ease-out"
              animationBegin={0}
              isAnimationActive={!isTransitioning} // Disable animations during transitions
              dot={false} // Remove all data point markers
              activeDot={false} // Remove active dots as well
              // Apply enhanced glow effect to the line with slate blue
              style={{
                filter: "url(#pnlTealGlow)",
                stroke: "#1e3a8a",
                strokeWidth: 5,
                transform: 'translateZ(0)', // Hardware acceleration
                willChange: 'transform', // Optimize for transforms
                backfaceVisibility: 'hidden' // Prevent flickering
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}