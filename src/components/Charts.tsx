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

// PnlChart component
export const PnlChart = () => {
  const data = [10000, 25000, 42000, 58000, 80000, 95000, 115000, 128000, 142000, 150000, 152000, 156670];
  const labels = ['Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov'];

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
export const RadarEmotionChart = () => {
  const data = [5, 3, 7, 8, 4, 9, 3, 4];
  const labels = ['Neutral', 'Tilt', 'Discipline', 'Confident', 'FOMO', 'Patience', 'Revenge', 'Regret'];

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