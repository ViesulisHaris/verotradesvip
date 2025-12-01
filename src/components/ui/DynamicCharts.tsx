// Dynamic chart imports for code splitting
import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

// Dynamic imports for Recharts components
export const DynamicPnLChart = dynamic(
  () => import('./PnLChart'),
  {
    loading: () => (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin" />
        <span className="ml-2 text-white/70">Loading chart...</span>
      </div>
    ),
    ssr: false
  }
);

export const DynamicEquityGraph = dynamic(
  () => import('./EquityGraph'),
  {
    loading: () => (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin" />
        <span className="ml-2 text-white/70">Loading chart...</span>
      </div>
    ),
    ssr: false
  }
);

export const DynamicStrategyPerformanceChart = dynamic(
  () => import('./StrategyPerformanceChart'),
  {
    loading: () => (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin" />
        <span className="ml-2 text-white/70">Loading chart...</span>
      </div>
    ),
    ssr: false
  }
);

export const DynamicPerformanceTrendChart = dynamic(
  () => import('./PerformanceTrendChart'),
  {
    loading: () => (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin" />
        <span className="ml-2 text-white/70">Loading chart...</span>
      </div>
    ),
    ssr: false
  }
);

export const DynamicMarketDistributionChart = dynamic(
  () => import('./MarketDistributionChart'),
  {
    loading: () => (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin" />
        <span className="ml-2 text-white/70">Loading chart...</span>
      </div>
    ),
    ssr: false
  }
);

export const DynamicEmotionRadar = dynamic(
  () => import('./EmotionRadar'),
  {
    loading: () => (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin" />
        <span className="ml-2 text-white/70">Loading chart...</span>
      </div>
    ),
    ssr: false
  }
);