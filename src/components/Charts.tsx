'use client';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  RadialLinearScale,
  Filler,
  Tooltip,
  Legend,
  defaults
} from 'chart.js';
import { Line, Radar } from 'react-chartjs-2';
import { useEffect } from 'react';

// DEBUG: Add Chart.js availability check
console.log('🔍 [Chart.js] Chart.js library status:', {
  ChartJS: typeof ChartJS !== 'undefined',
  Line: typeof Line !== 'undefined',
  hasDefaults: typeof defaults !== 'undefined',
  registeredComponents: {
    CategoryScale: typeof CategoryScale !== 'undefined',
    LinearScale: typeof LinearScale !== 'undefined',
    PointElement: typeof PointElement !== 'undefined',
    LineElement: typeof LineElement !== 'undefined'
  }
});

// Extend Window interface to include Chart
declare global {
  interface Window {
    Chart: typeof ChartJS;
  }
}

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  RadialLinearScale,
  Filler,
  Tooltip,
  Legend
);

// Set global Chart.js defaults to match HTML specification
defaults.font.family = 'Inter';
defaults.color = '#555';

// Make Chart available globally for testing
if (typeof window !== 'undefined') {
  window.Chart = ChartJS;
}

// LTTB (Largest-Triangle-Three-Buckets) algorithm implementation
// Simplified and more robust version for P&L chart optimization
const lttbDownsample = (data: {x: number, y: number}[], threshold: number): {x: number, y: number}[] => {
  // Handle edge cases
  if (!data || data.length === 0 || threshold >= data.length || threshold < 3) {
    return data || [];
  }

  const sampled: {x: number, y: number}[] = [];
  
  // Always include the first point
  if (data[0]) {
    sampled.push(data[0]);
  }
  
  // Calculate bucket size
  const bucketSize = (data.length - 2) / (threshold - 2);
  
  for (let i = 0; i < threshold - 2; i++) {
    // Calculate bucket boundaries
    const nextBucketStart = Math.floor((i + 1) * bucketSize) + 1;
    const nextBucketEnd = Math.min(Math.floor((i + 2) * bucketSize) + 1, data.length);
    
    // Calculate average of next bucket
    let avgX = 0;
    let avgY = 0;
    let avgCount = 0;
    
    for (let j = nextBucketStart; j < nextBucketEnd; j++) {
      if (data[j]) {
        avgX += data[j]!.x;
        avgY += data[j]!.y;
        avgCount++;
      }
    }
    
    if (avgCount > 0) {
      avgX /= avgCount;
      avgY /= avgCount;
    }
    
    // Current bucket range
    const currentBucketStart = Math.floor(i * bucketSize) + 1;
    const currentBucketEnd = Math.min(Math.floor((i + 1) * bucketSize) + 1, data.length);
    
    // Find the point with the largest triangle area
    let maxArea = -1;
    let maxAreaIndex = currentBucketStart;
    
    const prevPoint = sampled[sampled.length - 1];
    if (!prevPoint) continue;
    
    for (let j = currentBucketStart; j < currentBucketEnd; j++) {
      if (data[j] && prevPoint) {
        // Calculate triangle area using cross product
        const area = Math.abs(
          (prevPoint.x * (data[j]!.y - avgY) +
           data[j]!.x * (avgY - prevPoint.y) +
           avgX * (prevPoint.y - data[j]!.y)) * 0.5
        );
        
        if (area > maxArea) {
          maxArea = area;
          maxAreaIndex = j;
        }
      }
    }
    
    // Add the point with the largest area
    if (maxAreaIndex < data.length && data[maxAreaIndex]) {
      sampled.push(data[maxAreaIndex]!);
    }
  }
  
  // Always include the last point
  if (data.length > 1 && data[data.length - 1]) {
    sampled.push(data[data.length - 1]!);
  }
  
  return sampled;
};

// PnlChart component
export const PnlChart = ({ trades = [] }: { trades?: any[] }) => {
  // DEBUG: Log incoming trades data
  console.log('🔍 [PnlChart] Incoming trades data:', {
    tradesCount: trades?.length || 0,
    tradesSample: trades?.slice(0, 3),
    hasTradeDate: trades?.[0]?.trade_date,
    hasPnl: trades?.[0]?.pnl
  });

  // Process trades to create cumulative P&L data
  const processTradesForChart = (trades: any[]) => {
    console.log('🔍 [PnlChart] processTradesForChart called with:', {
      tradesLength: trades?.length || 0,
      firstTrade: trades?.[0],
      lastTrade: trades?.[trades?.length - 1]
    });

    if (!trades || trades.length === 0) {
      console.log('🔍 [PnlChart] No trades data, returning empty chart');
      return {
        data: [0],
        labels: ['No Data']
      };
    }

    // Sort trades by date
    const sortedTrades = [...trades].sort((a, b) =>
      new Date(a.trade_date).getTime() - new Date(b.trade_date).getTime()
    );

    console.log('🔍 [PnlChart] Sorted trades:', {
      firstDate: sortedTrades[0]?.trade_date,
      lastDate: sortedTrades[sortedTrades.length - 1]?.trade_date,
      totalPnL: sortedTrades.reduce((sum, trade) => sum + (trade.pnl || 0), 0)
    });

    // Calculate cumulative P&L
    let cumulativePnL = 0;
    const cumulativeData: number[] = [0];
    const labels: string[] = ['Start'];

    sortedTrades.forEach((trade, index) => {
      cumulativePnL += trade.pnl || 0;
      cumulativeData.push(cumulativePnL);
      
      // Format date label
      const date = new Date(trade.trade_date);
      const monthLabel = date.toLocaleDateString('en-US', { month: 'short' });
      const dayLabel = date.getDate();
      labels.push(`${monthLabel} ${dayLabel}`);
    });

    console.log('🔍 [PnlChart] Cumulative data calculated:', {
      dataPoints: cumulativeData.length,
      finalPnL: cumulativePnL,
      sampleData: cumulativeData.slice(0, 5),
      sampleLabels: labels.slice(0, 5)
    });

    // Apply LTTB algorithm if we have more than 500 points
    let processedData = cumulativeData;
    let processedLabels = labels;
    
    if (cumulativeData.length > 500) {
      console.log('🔍 [PnlChart] Applying LTTB algorithm for', cumulativeData.length, 'data points');
      try {
        // Convert cumulative data to x,y format for LTTB
        const dataPoints = cumulativeData.map((value, index) => ({
          x: index,
          y: value
        }));
        
        // Apply LTTB to reduce data points to ~500
        const threshold = Math.max(500, Math.floor(cumulativeData.length * 0.5));
        const sampledPoints = lttbDownsample(dataPoints, threshold);
        
        console.log('🔍 [PnlChart] LTTB sampling complete:', {
          originalPoints: dataPoints.length,
          threshold,
          sampledPoints: sampledPoints.length
        });
        
        // Extract the y values from sampled points
        processedData = sampledPoints.map(point => point.y);
        
        // Extract corresponding labels based on the x indices
        processedLabels = sampledPoints.map(point => {
          const index = Math.floor(point.x);
          return index < labels.length ? labels[index] : '';
        }).filter(label => label !== undefined) as string[];
      } catch (error) {
        console.error('🔍 [PnlChart] LTTB algorithm error:', error);
        // Fallback to original data if LTTB fails
        processedData = cumulativeData;
        processedLabels = labels;
      }
    }

    const result = {
      data: processedData,
      labels: processedLabels
    };

    console.log('🔍 [PnlChart] Final processed data:', {
      dataLength: result.data.length,
      labelsLength: result.labels.length,
      sampleData: result.data.slice(0, 3),
      sampleLabels: result.labels.slice(0, 3),
      finalValue: result.data[result.data.length - 1]
    });

    return result;
  };

  const { data, labels } = processTradesForChart(trades);

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Cumulative Profit',
        data,
        borderColor: '#E6D5B8',
        backgroundColor: (context: any) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 300);
          gradient.addColorStop(0, 'rgba(230, 213, 184, 0.3)');
          gradient.addColorStop(1, 'rgba(230, 213, 184, 0.01)');
          return gradient;
        },
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#E6D5B8',
        pointBorderColor: '#E6D5B8',
        pointBorderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 0,
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        padding: 12,
        displayColors: false,
        callbacks: {
          label: function(context: any) {
            return `Profit: $${context.parsed.y.toLocaleString()}`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
          drawBorder: false
        },
        ticks: {
          color: '#555'
        }
      },
      y: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
          drawBorder: false
        },
        ticks: {
          color: '#555',
          callback: function(value: any) {
            return '$' + value.toLocaleString();
          }
        }
      }
    }
  };

  console.log('🔍 [PnlChart] Rendering Chart.js Line component:', {
    dataLength: chartData.labels.length,
    datasetLength: chartData.datasets[0]?.data?.length,
    sampleLabels: chartData.labels.slice(0, 3),
    sampleData: chartData.datasets[0]?.data?.slice(0, 3)
  });

  try {
    console.log('🔍 [PnlChart] Rendering Chart.js Line component:', {
      dataLength: chartData.labels.length,
      datasetLength: chartData.datasets[0]?.data?.length,
      sampleLabels: chartData.labels.slice(0, 3),
      sampleData: chartData.datasets[0]?.data?.slice(0, 3)
    });

    return <Line data={chartData} options={options} />;
  } catch (error) {
    console.error('🔍 [PnlChart] Chart.js rendering error:', error);
    
    // Fallback rendering
    return (
      <div className="w-full h-full flex items-center justify-center bg-[#1F1F1F] rounded-lg p-8">
        <div className="text-center">
          <div className="text-red-500 text-lg mb-4">Chart Rendering Error</div>
          <div className="text-[#9ca3af] text-sm mb-4">{error instanceof Error ? error.message : 'Unknown error'}</div>
          
          {/* Fallback data display */}
          <div className="text-left text-[#EAEAEA]">
            <div className="mb-2">
              <span className="font-semibold">Data Points:</span> {chartData.labels.length}
            </div>
            <div className="mb-2">
              <span className="font-semibold">Final P&L:</span> ${chartData.datasets[0]?.data?.[chartData.datasets[0].data.length - 1]?.toFixed(2) || '0.00'}
            </div>
            <div className="mb-2">
              <span className="font-semibold">Date Range:</span> {chartData.labels[0]} - {chartData.labels[chartData.labels.length - 1]}
            </div>
          </div>
        </div>
      </div>
    );
  }
};

// RadarEmotionChart component
export const RadarEmotionChart = ({ emotionalData = [] }: { emotionalData?: any[] }) => {
  // Process emotional data for radar chart
  const processEmotionalData = (emotionalData: any[]) => {
    if (!emotionalData || emotionalData.length === 0) {
      return {
        data: [0, 0, 0, 0, 0, 0, 0, 0],
        labels: ['Neutral', 'Tilt', 'Discipline', 'Confident', 'FOMO', 'Patience', 'Revenge', 'Regret']
      };
    }

    // Map emotional data to radar chart format
    const emotionOrder = ['NEUTRAL', 'TILT', 'DISCIPLINE', 'CONFIDENT', 'FOMO', 'PATIENCE', 'REVENGE', 'REGRET'];
    const data = emotionOrder.map(emotion => {
      const emotionData = emotionalData.find(d => d.subject === emotion);
      return emotionData ? (emotionData.value / 100) * 10 : 0; // Convert percentage to 0-10 scale
    });

    const labels = emotionOrder.map(emotion =>
      emotion.charAt(0) + emotion.slice(1).toLowerCase()
    );

    return {
      data,
      labels
    };
  };

  const { data, labels } = processEmotionalData(emotionalData);

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Psychological State',
        data,
        borderColor: '#5E2121',
        backgroundColor: 'rgba(94, 33, 33, 0.2)',
        borderWidth: 2,
        pointBackgroundColor: '#5E2121',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        padding: 12,
        displayColors: false,
        callbacks: {
          label: function(context: any) {
            const value = typeof context.parsed.r === 'number' ? context.parsed.r.toFixed(2) : context.parsed.r;
            return `${context.label}: ${value}/10`;
          }
        }
      }
    },
    scales: {
      r: {
        angleLines: {
          color: 'rgba(255, 255, 255, 0.1)'
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        },
        pointLabels: {
          color: '#555',
          font: {
            size: 12
          }
        },
        ticks: {
          color: '#555',
          backdropColor: 'transparent',
          stepSize: 2,
          max: 10,
          min: 0
        }
      }
    }
  };

  return <Radar data={chartData} options={options} />;
};