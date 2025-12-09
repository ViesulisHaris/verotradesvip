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

// PnlChart component
export const PnlChart = ({ trades = [] }: { trades?: any[] }) => {
  // Process trades to create cumulative P&L data
  const processTradesForChart = (trades: any[]) => {
    if (!trades || trades.length === 0) {
      return {
        data: [0],
        labels: ['No Data']
      };
    }

    // Sort trades by date
    const sortedTrades = [...trades].sort((a, b) =>
      new Date(a.trade_date).getTime() - new Date(b.trade_date).getTime()
    );

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

    return {
      data: cumulativeData,
      labels
    };
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

  return <Line data={chartData} options={options} />;
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
            return `${context.label}: ${context.parsed.r}/10`;
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