'use client';

import React, { useState, memo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Star,
  Shield,
  Target,
  Brain,
  BookOpen,
  Activity,
  AlertTriangle,
  CheckCircle,
  Info,
  BarChart3,
  Clock,
  Zap
} from 'lucide-react';

// Enhanced Props interface to support new metric types
interface Props {
  title: string;
  value: string;
  profitability?: 'good' | 'medium' | 'bad' | 'neutral';
  // VRating specific props
  vRating?: number; // 1-10 scale
  vRatingCategory?: 'profitability' | 'riskManagement' | 'consistency' | 'emotionalDiscipline' | 'journalingAdherence';
  // Icon support
  icon?: 'trending' | 'shield' | 'target' | 'brain' | 'book' | 'activity' | 'alert' | 'check' | 'star' | 'clock' | 'zap' | 'info' | 'chart';
  // Tooltip support
  tooltip?: string;
  // Additional styling
  className?: string;
}

// Memoized component for performance optimization
const DashboardCard = memo(function DashboardCard({
  title,
  value,
  profitability,
  vRating,
  vRatingCategory,
  icon,
  tooltip,
  className = ""
}: Props) {
  const [showTooltip, setShowTooltip] = useState(false);
  const isNegative = value.startsWith('-');
  
  // VRating color mapping for 1-10 scale - VeroTrade Design System
  const getVRatingColor = (rating: number) => {
    if (rating >= 9.0) {
      return {
        bg: 'bg-gradient-to-r from-verotrade-gold-primary/80 to-verotrade-gold-secondary/60',
        text: 'text-verotrade-gold-primary group-hover:text-verotrade-gold-primary',
        iconBg: 'bg-verotrade-gold-primary/10',
        iconColor: 'text-verotrade-gold-primary',
        glow: 'bg-gradient-to-r from-verotrade-gold-primary/20 to-transparent'
      };
    } else if (rating >= 8.0) {
      return {
        bg: 'bg-gradient-to-r from-verotrade-success/80 to-verotrade-success/60',
        text: 'text-verotrade-success group-hover:text-verotrade-success',
        iconBg: 'bg-verotrade-success/10',
        iconColor: 'text-verotrade-success',
        glow: 'bg-gradient-to-r from-verotrade-success/20 to-transparent'
      };
    } else if (rating >= 6.0) {
      return {
        bg: 'bg-gradient-to-r from-verotrade-warning/80 to-verotrade-warning/60',
        text: 'text-verotrade-warning group-hover:text-verotrade-warning',
        iconBg: 'bg-verotrade-warning/10',
        iconColor: 'text-verotrade-warning',
        glow: 'bg-gradient-to-r from-verotrade-warning/20 to-transparent'
      };
    } else if (rating >= 4.0) {
      return {
        bg: 'bg-gradient-to-r from-verotrade-gold-tertiary/60 to-verotrade-gold-quaternary/40',
        text: 'text-verotrade-gold-tertiary group-hover:text-verotrade-gold-quaternary',
        iconBg: 'bg-verotrade-gold-tertiary/10',
        iconColor: 'text-verotrade-gold-tertiary',
        glow: 'bg-gradient-to-r from-verotrade-gold-tertiary/20 to-transparent'
      };
    } else if (rating >= 2.0) {
      return {
        bg: 'bg-gradient-to-r from-verotrade-error/60 to-verotrade-warning/40',
        text: 'text-verotrade-error group-hover:text-verotrade-warning',
        iconBg: 'bg-verotrade-error/10',
        iconColor: 'text-verotrade-error',
        glow: 'bg-gradient-to-r from-verotrade-error/20 to-transparent'
      };
    } else {
      return {
        bg: 'bg-gradient-to-r from-verotrade-error/80 to-verotrade-error/60',
        text: 'text-verotrade-error group-hover:text-verotrade-error',
        iconBg: 'bg-verotrade-error/10',
        iconColor: 'text-verotrade-error',
        glow: 'bg-gradient-to-r from-verotrade-error/20 to-transparent'
      };
    }
  };
  
  // Phase 3: Enhanced color determination function with specific metric colors
  const getMetricColor = () => {
    // Priority: VRating > className-based metric detection > profitability > negative value detection
    
    // Check for specific metric classes first
    if (className) {
      if (className.includes('total-pnl-metric')) {
        return {
          bg: 'bg-gradient-to-r from-verotrade-gold-primary/80 to-verotrade-gold-secondary/60',
          text: 'text-verotrade-gold-primary group-hover:text-verotrade-gold-primary',
          iconBg: 'bg-verotrade-gold-primary/10',
          iconColor: 'text-verotrade-gold-primary',
          glow: 'bg-gradient-to-r from-verotrade-gold-primary/20 to-transparent'
        };
      }
      if (className.includes('winrate-metric')) {
        return {
          bg: 'bg-gradient-to-r from-verotrade-success/80 to-verotrade-success/60',
          text: 'text-verotrade-success group-hover:text-verotrade-success',
          iconBg: 'bg-verotrade-success/10',
          iconColor: 'text-verotrade-success',
          glow: 'bg-gradient-to-r from-verotrade-success/20 to-transparent'
        };
      }
      if (className.includes('profit-factor-metric')) {
        return {
          bg: 'bg-gradient-to-r from-verotrade-warning/80 to-verotrade-warning/60',
          text: 'text-verotrade-warning group-hover:text-verotrade-warning',
          iconBg: 'bg-verotrade-warning/10',
          iconColor: 'text-verotrade-warning',
          glow: 'bg-gradient-to-r from-verotrade-warning/20 to-transparent'
        };
      }
      if (className.includes('total-trades-metric')) {
        return {
          bg: 'bg-gradient-to-r from-verotrade-info/80 to-verotrade-info/60',
          text: 'text-verotrade-info group-hover:text-verotrade-info',
          iconBg: 'bg-verotrade-info/10',
          iconColor: 'text-verotrade-info',
          glow: 'bg-gradient-to-r from-verotrade-info/20 to-transparent'
        };
      }
    }
    
    // VRating takes priority over other color systems
    if (vRating !== undefined) {
      return getVRatingColor(vRating);
    }
    
    // Fallback to profitability system
    if (profitability) {
      switch (profitability) {
        case 'good':
          return {
            bg: 'bg-gradient-to-r from-verotrade-success/80 to-verotrade-success/60',
            text: 'text-verotrade-success group-hover:text-verotrade-success',
            iconBg: 'bg-verotrade-success/10',
            iconColor: 'text-verotrade-success',
            glow: 'bg-gradient-to-r from-verotrade-success/20 to-transparent'
          };
        case 'medium':
          return {
            bg: 'bg-gradient-to-r from-verotrade-gold-primary/80 to-verotrade-gold-secondary/60',
            text: 'text-verotrade-gold-primary group-hover:text-verotrade-gold-primary',
            iconBg: 'bg-verotrade-gold-primary/10',
            iconColor: 'text-verotrade-gold-primary',
            glow: 'bg-gradient-to-r from-verotrade-gold-primary/20 to-transparent'
          };
        case 'bad':
          return {
            bg: 'bg-gradient-to-r from-verotrade-error/80 to-verotrade-error/60',
            text: 'text-verotrade-error group-hover:text-verotrade-error',
            iconBg: 'bg-verotrade-error/10',
            iconColor: 'text-verotrade-error',
            glow: 'bg-gradient-to-r from-verotrade-error/20 to-transparent'
          };
        case 'neutral':
        default:
          return {
            bg: 'bg-gradient-to-r from-verotrade-warning/80 to-verotrade-warning/60',
            text: 'text-verotrade-warning group-hover:text-verotrade-warning',
            iconBg: 'bg-verotrade-warning/10',
            iconColor: 'text-verotrade-warning',
            glow: 'bg-gradient-to-r from-verotrade-warning/20 to-transparent'
          };
      }
    }
    
    // Final fallback to original logic
    return {
      bg: isNegative ? 'bg-gradient-to-r from-verotrade-error/80 to-verotrade-error/60' : 'bg-gradient-to-r from-verotrade-success/80 to-verotrade-success/60',
      text: isNegative ? 'text-verotrade-error group-hover:text-verotrade-error' : 'text-verotrade-success group-hover:text-verotrade-success',
      iconBg: isNegative ? 'bg-verotrade-error/10' : 'bg-verotrade-success/10',
      iconColor: isNegative ? 'text-verotrade-error' : 'text-verotrade-success',
      glow: isNegative ? 'bg-gradient-to-r from-verotrade-error/20 to-transparent' : 'bg-gradient-to-r from-verotrade-success/20 to-transparent'
    };
  };
  const colors = getMetricColor();
  
  // Icon selection logic based on icon prop
  const getIcon = () => {
    switch (icon) {
      case 'trending':
        return isNegative ? TrendingDown : TrendingUp;
      case 'shield':
        return Shield;
      case 'target':
        return Target;
      case 'brain':
        return Brain;
      case 'book':
        return BookOpen;
      case 'activity':
        return Activity;
      case 'alert':
        return AlertTriangle;
      case 'check':
        return CheckCircle;
      case 'star':
        return Star;
      case 'clock':
        return Clock;
      case 'zap':
        return Zap;
      default:
        return isNegative ? TrendingDown : TrendingUp;
    }
  };
  
  const IconComponent = getIcon();
  
  return (
    <div
      className={`group relative overflow-hidden transition-all duration-300 cursor-pointer focus-within:ring-2 focus-within:ring-[var(--dusty-gold)]/50 focus-within:ring-offset-2 focus-within:ring-offset-[var(--deep-charcoal)] touch-manipulation ${className}`}
      style={{
        borderRadius: '12px',
        background: 'var(--soft-graphite)',
        border: '0.8px solid rgba(184, 155, 94, 0.3)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)'
      }}
      onMouseEnter={() => tooltip && setShowTooltip(true)}
      onMouseLeave={() => tooltip && setShowTooltip(false)}
      role="article"
      aria-label={`${title}: ${value}`}
      tabIndex={0}
    >
      {/* Enhanced top accent border with metric-specific color */}
      <div
        className={`absolute top-0 left-0 right-0 h-1 ${colors.bg} pointer-events-none transition-all duration-300 group-hover:h-2`}
        style={{
          height: '2px',
          background: colors.bg.includes('verotrade-gold-primary') ? 'linear-gradient(90deg, var(--verotrade-gold-primary), var(--verotrade-gold-secondary))' :
                   colors.bg.includes('verotrade-success') ? 'linear-gradient(90deg, var(--verotrade-success), #059669)' :
                   colors.bg.includes('verotrade-warning') ? 'linear-gradient(90deg, var(--verotrade-warning), #d97706)' :
                   colors.bg.includes('verotrade-error') ? 'linear-gradient(90deg, var(--verotrade-error), #dc2626)' :
                   colors.bg.includes('verotrade-info') ? 'linear-gradient(90deg, var(--verotrade-info), #2563eb)' :
                   'linear-gradient(90deg, var(--verotrade-gold-primary), var(--verotrade-gold-secondary))'
        }}
      />
      
      {/* Hover effect overlay */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{
          borderRadius: '12px',
          background: 'linear-gradient(135deg, rgba(184, 155, 94, 0.05) 0%, rgba(212, 184, 127, 0.03) 100%)',
        }}
      />
      
      {/* Card content with enhanced styling */}
      <div className="relative p-4 sm:p-5 transition-all duration-300" style={{ padding: 'var(--spacing-card-inner)' }}>
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="h3-card-title transition-colors duration-300 group-hover:text-[var(--warm-off-white)] truncate">{title}</h3>
            <p className={`mt-2 metric-value transition-all duration-300 truncate group-hover:text-[var(--warm-off-white)] group-hover:scale-105 ${colors.text}`}>
              {value}
            </p>
          </div>
          
          {/* Value indicator icon with metric-specific color */}
          <div className={`p-2 rounded-lg flex-shrink-0 ml-3 transition-all duration-300 group-hover:scale-110 group-hover:rotate-6`} style={{
            background: 'var(--soft-graphite)',
            border: '0.8px solid rgba(184, 155, 94, 0.3)'
          }}>
            <IconComponent
              className={`w-5 h-5 transition-colors duration-300 ${colors.iconColor}`}
              strokeWidth={2}
              aria-hidden="true"
            />
          </div>
        </div>
      </div>
      
      {/* Enhanced tooltip with updated styling */}
      {tooltip && showTooltip && (
        <div
          className="absolute z-50 p-3 rounded-lg shadow-2xl max-w-xs -top-2 left-1/2 transform -translate-x-1/2 -translate-y-full"
          style={{
            background: 'var(--soft-graphite)',
            border: '0.8px solid rgba(184, 155, 94, 0.3)',
            backdropFilter: 'blur(8px) saturate(180%)',
            WebkitBackdropFilter: 'blur(8px) saturate(180%)',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            fontSize: '14px',
            fontWeight: '400',
            color: 'var(--warm-off-white)'
          }}
          role="tooltip"
        >
          <div
            className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full"
            style={{
              width: 0,
              height: 0,
              borderLeft: '8px solid transparent',
              borderRight: '8px solid transparent',
              borderTop: '8px solid var(--soft-graphite)',
              filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))'
            }}
          />
          {tooltip}
        </div>
      )}
    </div>
  );
});

// Export the memoized component
export default DashboardCard;
