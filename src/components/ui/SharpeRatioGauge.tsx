'use client';

import React from 'react';
import { BarChart3, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';

interface Props {
  sharpeRatio: number;
}

export default function SharpeRatioGauge({ sharpeRatio }: Props) {
  // Determine Sharpe Ratio quality and color using warm editorial gradient
  const getSharpeQuality = () => {
    if (sharpeRatio > 1.5) {
      return {
        quality: 'Excellent',
        color: 'text-[#B89B5E]', // Dusty gold
        bgColor: 'bg-[#B89B5E]/20',
        borderColor: 'border-[#B89B5E]/50',
        gaugeColor: 'bg-[#B89B5E]',
        icon: CheckCircle,
        description: 'Outstanding risk-adjusted returns'
      };
    } else if (sharpeRatio > 0.75) {
      return {
        quality: 'Good',
        color: 'text-[#7A5C3A]', // Warm brown
        bgColor: 'bg-[#7A5C3A]/20',
        borderColor: 'border-[#7A5C3A]/50',
        gaugeColor: 'bg-[#7A5C3A]',
        icon: TrendingUp,
        description: 'Good risk-adjusted returns'
      };
    } else if (sharpeRatio > 0) {
      return {
        quality: 'Acceptable',
        color: 'text-[#7A5C3A]', // Warm brown
        bgColor: 'bg-[#7A5C3A]/20',
        borderColor: 'border-[#7A5C3A]/50',
        gaugeColor: 'bg-[#7A5C3A]',
        icon: BarChart3,
        description: 'Moderate risk-adjusted returns'
      };
    } else {
      return {
        quality: 'Poor',
        color: 'text-[#4A2F2A]', // Dark muted red
        bgColor: 'bg-[#4A2F2A]/20',
        borderColor: 'border-[#4A2F2A]/50',
        gaugeColor: 'bg-[#4A2F2A]',
        icon: AlertTriangle,
        description: 'Negative risk-adjusted returns'
      };
    }
  };

  const sharpeQuality = getSharpeQuality();
  const Icon = sharpeQuality.icon;
  
  // Calculate gauge width (capped at 100%)
  const gaugeWidth = Math.min(Math.max((sharpeRatio + 2) / 4 * 100, 0), 100);

  return (
    <div
      className="group relative overflow-hidden rounded-xl card-solid"
    >
      {/* Enhanced top accent border with Sharpe-specific gradient */}
      <div
        className={`absolute top-0 left-0 right-0 h-1 ${sharpeQuality.bgColor} pointer-events-none`}
        style={{
          height: '2px',
          background: sharpeRatio > 1.5 ? 'linear-gradient(90deg, #B89B5E, #D6C7B2)' :
                   sharpeRatio > 0.75 ? 'linear-gradient(90deg, #7A5C3A, #8B7355)' :
                   sharpeRatio > 0 ? 'linear-gradient(90deg, #7A5C3A, #8B7355)' :
                   'linear-gradient(90deg, #4A2F2A, #5C2E2E)'
        }}
      />
      
      {/* Card content with enhanced styling */}
      <div className="relative p-5" style={{ background: 'rgba(32, 32, 32, 0.95)' }}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-sm font-medium metric-label group-hover:text-gray-300 transition-colors duration-200">
              Sharpe Ratio
            </h3>
            <div className="mt-3 flex items-center gap-3">
              <div className={`p-3 rounded-lg border`} style={{
                background: sharpeRatio > 1.5 ? 'rgba(184, 155, 94, 0.2)' :
                           sharpeRatio > 0.75 ? 'rgba(122, 92, 58, 0.2)' :
                           sharpeRatio > 0 ? 'rgba(122, 92, 58, 0.2)' :
                           'rgba(74, 47, 42, 0.2)',
                border: sharpeRatio > 1.5 ? '1px solid rgba(43, 43, 43, 0.4)' :
                         sharpeRatio > 0.75 ? '1px solid rgba(43, 43, 43, 0.4)' :
                         sharpeRatio > 0 ? '1px solid rgba(43, 43, 43, 0.4)' :
                         '1px solid rgba(43, 43, 43, 0.4)'
              }}>
                <Icon className={`w-6 h-6`} style={{
                  color: sharpeRatio > 1.5 ? '#B89B5E' :
                         sharpeRatio > 0.75 ? '#7A5C3A' :
                         sharpeRatio > 0 ? '#7A5C3A' :
                         '#4A2F2A'
                }} />
              </div>
              <div>
                <p className={`text-xl font-bold transition-colors duration-200`} style={{
                  color: sharpeRatio > 1.5 ? '#B89B5E' :
                         sharpeRatio > 0.75 ? '#7A5C3A' :
                         sharpeRatio > 0 ? '#7A5C3A' :
                         '#4A2F2A'
                }}>
                  {sharpeRatio.toFixed(2)}
                </p>
                <p className="text-xs metric-label mt-1">
                  {sharpeQuality.quality}
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Enhanced Sharpe Ratio gauge */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs metric-label mb-2">
            <span>Risk-Adjusted Performance</span>
            <span>{sharpeQuality.description}</span>
          </div>
          <div className="w-full rounded-full h-3 overflow-hidden relative" style={{ background: 'rgba(43, 43, 43, 0.3)' }}>
            {/* Enhanced background gradient zones */}
            <div className="absolute inset-0 flex">
              <div className="w-1/3" style={{ background: 'rgba(74, 47, 42, 0.3)' }}></div>
              <div className="w-1/3" style={{ background: 'rgba(122, 92, 58, 0.3)' }}></div>
              <div className="w-1/3" style={{ background: 'rgba(184, 155, 94, 0.3)' }}></div>
            </div>
            {/* Enhanced animated value indicator */}
            <div
              className={`h-full transition-all duration-700 ease-out relative`}
              style={{
                width: `${gaugeWidth}%`,
                background: sharpeRatio > 1.5 ? 'linear-gradient(90deg, #B89B5E, transparent)' :
                         sharpeRatio > 0.75 ? 'linear-gradient(90deg, #7A5C3A, transparent)' :
                         sharpeRatio > 0 ? 'linear-gradient(90deg, #7A5C3A, transparent)' :
                         'linear-gradient(90deg, #4A2F2A, transparent)',
                boxShadow: '0 0 20px rgba(255, 255, 255, 0.1)'
              }}
            >
              <div
                className="absolute right-0 top-0 bottom-0 w-1"
                style={{
                  background: 'linear-gradient(to bottom, rgba(255, 255, 255, 0.8), rgba(255, 255, 255, 0.4))',
                  boxShadow: '0 0 10px rgba(255, 255, 255, 0.6)'
                }}
              ></div>
            </div>
          </div>
          
          {/* Enhanced scale markers */}
          <div className="flex justify-between text-xs metric-label mt-1">
            <span>-2.0</span>
            <span>-1.0</span>
            <span>0.0</span>
            <span>1.0</span>
            <span>2.0+</span>
          </div>
        </div>
        
      </div>
    </div>
  );
}