'use client';

import React from 'react';

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
      valueColor: '#EAE6DD' // Warm Off-White for values
    },
    {
      id: 'winrate',
      label: 'Winrate',
      value: `${winrate}%`,
      valueColor: '#EAE6DD' // Warm Off-White for values
    },
    {
      id: 'profit-factor',
      label: 'Profit Factor',
      value: profitFactor,
      valueColor: '#EAE6DD' // Warm Off-White for values
    },
    {
      id: 'total-trades',
      label: 'Total Trades',
      value: totalTrades.toString(),
      valueColor: '#EAE6DD' // Warm Off-White for values
    }
  ];

  return (
    <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {metrics.map((metric) => (
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
          
          <div className="relative flex items-center h-full">
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
          </div>
        </div>
      ))}
    </div>
  );
};

export default KeyMetricCards;