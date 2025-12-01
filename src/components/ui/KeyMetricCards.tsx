'use client';

import React from 'react';
import {
  TrendingUp,
  Target,
  Star,
  Activity
} from 'lucide-react';

interface KeyMetricCardsProps {
  totalPnL: number;
  winrate: string;
  profitFactor: string;
  totalTrades: number;
}

const KeyMetricCards: React.FC<KeyMetricCardsProps> = ({
  totalPnL,
  winrate,
  profitFactor,
  totalTrades
}) => {
  // Format currency for PnL
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  const metrics = [
    {
      id: 'total-pnl',
      label: 'Total PnL',
      value: formatCurrency(totalPnL),
      icon: TrendingUp,
      iconColor: '#4F5B4A', // Muted Olive #4F5B4A
      valueColor: '#EAE6DD' // Warm Off-White for values
    },
    {
      id: 'winrate',
      label: 'Winrate',
      value: `${winrate}%`,
      icon: Target,
      iconColor: '#6A7661', // Soft Olive Highlight #6A7661
      valueColor: '#EAE6DD' // Warm Off-White for values
    },
    {
      id: 'profit-factor',
      label: 'Profit Factor',
      value: profitFactor,
      icon: Star,
      iconColor: '#B89B5E', // Dusty Gold #B89B5E
      valueColor: '#EAE6DD' // Warm Off-White for values
    },
    {
      id: 'total-trades',
      label: 'Total Trades',
      value: totalTrades.toString(),
      icon: Activity,
      iconColor: '#D6C7B2', // Warm Sand #D6C7B2
      valueColor: '#EAE6DD' // Warm Off-White for values
    }
  ];

  return (
    <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {metrics.map((metric) => {
        const IconComponent = metric.icon;
        return (
          <div
            key={metric.id}
            className="group relative overflow-hidden card-unified hover-lift transition-all duration-300 cursor-pointer focus-within:ring-2 focus-within:ring-dusty-gold/50 focus-within:ring-offset-2 focus-within:ring-offset-[#121212]"
            style={{
              height: '100px',
              padding: 'var(--spacing-card-inner)',
              background: 'var(--soft-graphite)',
              borderRadius: 'var(--radius-card)',
              border: '0.8px solid var(--border-primary)'
            }}
            role="article"
            aria-label={`${metric.label}: ${metric.value}`}
            tabIndex={0}
          >
            {/* Hover effect overlay */}
            <div
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
              style={{
                background: 'linear-gradient(135deg, rgba(184, 155, 94, 0.1) 0%, rgba(214, 199, 178, 0.05) 100%)',
                borderRadius: 'var(--radius-card)'
              }}
            />
            
            {/* Subtle animated border on hover */}
            <div
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
              style={{
                border: '0.8px solid var(--border-primary)',
                borderRadius: 'var(--radius-card)',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
              }}
            />
            
            <div className="relative flex items-center justify-between h-full">
              <div className="flex-1 min-w-0">
                <div
                  className="label-text mb-1 transition-colors duration-300 group-hover:text-[var(--dusty-gold)]"
                >
                  {metric.label}
                </div>
                <div
                  className="metric-value truncate transition-all duration-300 group-hover:text-[var(--warm-off-white)] group-hover:scale-105"
                  style={{
                    color: metric.valueColor
                  }}
                >
                  {metric.value}
                </div>
              </div>
              
              <div
                className="flex-shrink-0 ml-3 transition-all duration-300 group-hover:scale-110 group-hover:rotate-6"
                style={{
                  width: '16px',
                  height: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <IconComponent
                  size={16}
                  style={{
                    color: metric.iconColor,
                    transition: 'color 0.3s ease'
                  }}
                  strokeWidth={2}
                  aria-hidden="true"
                />
              </div>
            </div>
            
            {/* Keyboard navigation hint */}
            <div className="absolute bottom-1 right-1 opacity-0 group-hover:opacity-50 transition-opacity duration-300">
              <div
                className="w-1 h-1 rounded-full"
                style={{ backgroundColor: metric.iconColor }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default KeyMetricCards;